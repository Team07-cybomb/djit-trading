const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const CourseContent = require("../models/CourseContent");
const Enrollment = require("../models/Enrollment");
const Progress = require("../models/Progress");

// Upload content
const uploadContent = async (req, res) => {
  try {
    const { title, courseId, type, description, duration, order, isFree, videoUrl, documentUrl } = req.body;

    if (!title || !courseId || !type)
      return res.status(400).json({ success: false, message: "Missing required fields" });

    // Prepare file data if uploaded
    let videoFileData = null;
    let documentFileData = null;

    if (req.files) {
      if (req.files.videoFile) {
        const file = req.files.videoFile[0];
        videoFileData = {
          filename: file.filename,
          originalName: file.originalname,
          path: `uploads/${file.filename}`,
          size: file.size,
          mimetype: file.mimetype,
          url: `/uploads/${file.filename}`,
        };
      }
      if (req.files.documentFile) {
        const file = req.files.documentFile[0];
        documentFileData = {
          filename: file.filename,
          originalName: file.originalname,
          path: `uploads/${file.filename}`,
          size: file.size,
          mimetype: file.mimetype,
          url: `/uploads/${file.filename}`,
        };
      }
    }

    const newContent = new CourseContent({
      course: courseId,
      title,
      description,
      type,
      duration,
      order: order ? parseInt(order) : 1,
      isFree: isFree === "true" || isFree === true,
      videoUrl: videoUrl || "",
      documentUrl: documentUrl || "",
      videoFile: videoFileData,
      documentFile: documentFileData,
    });

    await newContent.save();

    res.json({ success: true, message: "Content uploaded successfully", content: newContent });
  } catch (error) {
    console.error("❌ Error uploading content:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};

// Get all uploaded content data (Admin only)
const getAllContentData = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      type = "",
      course = "",
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }
    
    if (type) filter.type = type;
    if (course) filter.course = course;

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const contents = await CourseContent.find(filter)
      .populate("course", "title category instructor")
      .sort(sortConfig)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count for pagination
    const total = await CourseContent.countDocuments(filter);

    // Calculate storage statistics
    const storageStats = await CourseContent.aggregate([
      {
        $group: {
          _id: null,
          totalVideos: { $sum: { $cond: [{ $ne: ["$videoFile", null] }, 1, 0] } },
          totalDocuments: { $sum: { $cond: [{ $ne: ["$documentFile", null] }, 1, 0] } },
          totalVideoSize: { $sum: { $ifNull: ["$videoFile.size", 0] } },
          totalDocumentSize: { $sum: { $ifNull: ["$documentFile.size", 0] } },
          totalContent: { $sum: 1 }
        }
      }
    ]);

    // Format file sizes for readability
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const stats = storageStats[0] || {
      totalVideos: 0,
      totalDocuments: 0,
      totalVideoSize: 0,
      totalDocumentSize: 0,
      totalContent: 0
    };

    res.json({
      success: true,
      contents,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalContents: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      statistics: {
        totalContent: stats.totalContent,
        totalVideos: stats.totalVideos,
        totalDocuments: stats.totalDocuments,
        totalVideoSize: stats.totalVideoSize,
        totalDocumentSize: stats.totalDocumentSize,
        totalStorageUsed: stats.totalVideoSize + stats.totalDocumentSize,
        formatted: {
          totalVideoSize: formatBytes(stats.totalVideoSize),
          totalDocumentSize: formatBytes(stats.totalDocumentSize),
          totalStorageUsed: formatBytes(stats.totalVideoSize + stats.totalDocumentSize)
        }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching all content data:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get content by ID (Admin detailed view)
const getContentById = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await CourseContent.findById(id)
      .populate("course", "title category instructor duration level")
      .lean();

    if (!content) {
      return res.status(404).json({ success: false, message: "Content not found" });
    }

    // Get usage statistics
    const enrollmentCount = await Enrollment.countDocuments({ course: content.course._id });
    const completionStats = await Progress.aggregate([
      { $match: { content: content._id } },
      {
        $group: {
          _id: null,
          totalCompletions: { $sum: 1 },
          averageCompletionTime: { $avg: { $subtract: ["$completedAt", "$createdAt"] } }
        }
      }
    ]);

    res.json({
      success: true,
      content,
      analytics: {
        enrollmentCount,
        completionStats: completionStats[0] || { totalCompletions: 0, averageCompletionTime: 0 }
      }
    });
  } catch (error) {
    console.error("❌ Error fetching content by ID:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get contents for enrolled users
const getCourseContents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    console.log(`Fetching course content for user ${userId}, course ${courseId}`);

    // Check enrollment and payment
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      paymentStatus: "completed",
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course or payment is pending. Please enroll first.",
      });
    }

    const contents = await CourseContent.find({
      course: courseId,
      status: "active",
    }).sort({ order: 1 });

    // Get user progress records for this course
    const userProgress = await Progress.find({
      user: userId,
      course: courseId,
    });

    const completedContentIds = userProgress.map((p) => p.content.toString());

    const progressPercentage = contents.length > 0 ? Math.round((userProgress.length / contents.length) * 100) : 0;

    res.json({
      success: true,
      content: contents,
      enrollment: {
        enrollmentDate: enrollment.enrollmentDate,
        progress: enrollment.progress,
        completed: enrollment.completed,
      },
      progress: {
        completed: userProgress.length,
        total: contents.length,
        completedContentIds,
        percentage: progressPercentage,
      },
    });
  } catch (error) {
    console.error("Error fetching course contents:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Stream video content securely - Handles both header auth and token in URL
const streamVideo = async (req, res) => {
  try {
    const { contentId } = req.params;
    
    // Get user ID from either header auth or query parameter
    let userId;
    
    if (req.user && req.user.id) {
      // User authenticated via header (normal API calls)
      userId = req.user.id;
    } else if (req.query.token) {
      // User authenticated via token in URL (browser video tag)
      try {
        const decoded = jwt.verify(req.query.token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (error) {
        return res.status(401).json({ success: false, message: "Invalid token" });
      }
    } else {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    console.log(`Streaming video for content ${contentId}, user ${userId}`);

    // Find the content
    const content = await CourseContent.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: "Content not found" });
    }

    // Check if user is enrolled in the course
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: content.course,
      paymentStatus: "completed",
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course or payment is pending",
      });
    }

    // Check if content has a video file
    if (!content.videoFile || !content.videoFile.path) {
      return res.status(404).json({ success: false, message: "Video file not found" });
    }

    const videoPath = path.join(__dirname, '..', content.videoFile.path);
    
    // Check if file exists
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ success: false, message: "Video file not found on server" });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    // Set proper headers for video streaming
    const headers = {
      'Content-Type': content.videoFile.mimetype || 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
    };

    if (range) {
      // Handle range requests for video seeking
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      if (start >= fileSize || end >= fileSize) {
        return res.status(416).json({ success: false, message: "Requested range not satisfiable" });
      }

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      
      headers['Content-Range'] = `bytes ${start}-${end}/${fileSize}`;
      headers['Content-Length'] = chunksize;
      
      res.writeHead(206, headers);
      file.pipe(res);
    } else {
      // Stream entire file
      headers['Content-Length'] = fileSize;
      res.writeHead(200, headers);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error("Error streaming video:", error);
    res.status(500).json({ success: false, message: "Error streaming video" });
  }
};

// Get public course contents (free content for preview)
const getPublicCourseContents = async (req, res) => {
  try {
    const { courseId } = req.params;

    const contents = await CourseContent.find({
      course: courseId,
      status: "active",
      isFree: true,
    })
      .sort({ order: 1 })
      .select("title description type duration order isFree");

    res.json({ success: true, content: contents });
  } catch (error) {
    console.error("Error fetching public course contents:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete content
const deleteContent = async (req, res) => {
  try {
    const content = await CourseContent.findById(req.params.id);
    if (!content) return res.status(404).json({ success: false, message: "Content not found" });

    let filePath = null;
    if (content.videoFile?.path) filePath = path.join(__dirname, "..", content.videoFile.path);
    else if (content.documentFile?.path) filePath = path.join(__dirname, "..", content.documentFile.path);

    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await CourseContent.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Content deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update content
const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Handle file uploads
    if (req.files) {
      if (req.files.videoFile) {
        const file = req.files.videoFile[0];
        updateData.videoFile = {
          filename: file.filename,
          originalName: file.originalname,
          path: `uploads/${file.filename}`,
          size: file.size,
          mimetype: file.mimetype,
          url: `/uploads/${file.filename}`,
        };
      }
      if (req.files.documentFile) {
        const file = req.files.documentFile[0];
        updateData.documentFile = {
          filename: file.filename,
          originalName: file.originalname,
          path: `uploads/${file.filename}`,
          size: file.size,
          mimetype: file.mimetype,
          url: `/uploads/${file.filename}`,
        };
      }
    }

    // Convert string booleans & numeric order
    if (updateData.isFree) {
      updateData.isFree = updateData.isFree === "true" || updateData.isFree === true;
    }
    if (updateData.order) {
      updateData.order = parseInt(updateData.order);
    }

    const updatedContent = await CourseContent.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!updatedContent) {
      return res.status(404).json({
        success: false,
        message: "Course content not found",
      });
    }

    res.json({
      success: true,
      message: "Course content updated successfully",
      content: updatedContent,
    });
  } catch (error) {
    console.error("Error updating course content:", error);
    res.status(500).json({
      success: false,
      message: "Error updating course content",
      error: error.message,
    });
  }
};

// Mark content as completed
const markAsCompleted = async (req, res) => {
  try {
    const { contentId } = req.params;
    const userId = req.user.id;

    console.log(`Marking content ${contentId} as completed for user ${userId}`);

    const content = await CourseContent.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, message: "Content not found" });
    }

    // Check enrollment
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: content.course,
      paymentStatus: "completed",
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, message: "You are not enrolled in this course or payment is pending" });
    }

    // Check if already completed
    const existingProgress = await Progress.findOne({ user: userId, content: contentId });

    // Get counts for response
    const totalProgressBefore = await Progress.countDocuments({ user: userId, course: content.course });
    const totalContent = await CourseContent.countDocuments({ course: content.course, status: "active" });

    if (existingProgress) {
      const progressPercentage = totalContent > 0 ? Math.round((totalProgressBefore / totalContent) * 100) : 0;
      return res.json({
        success: true,
        message: "Content already marked as completed",
        progress: {
          completed: totalProgressBefore,
          total: totalContent,
          percentage: progressPercentage,
        },
        enrollment: {
          progress: enrollment.progress,
          completed: enrollment.completed || false,
        },
      });
    }

    // Create progress record
    const progressDoc = new Progress({
      user: userId,
      course: content.course,
      content: contentId,
      completedAt: new Date(),
    });

    await progressDoc.save();

    // Get updated progress count
    const totalProgress = await Progress.countDocuments({ user: userId, course: content.course });

    // Calculate new progress percentage
    const progressPercentage = totalContent > 0 ? Math.round((totalProgress / totalContent) * 100) : 0;

    // Update enrollment progress and check if course is completed
    const updateData = { progress: progressPercentage };
    if (totalProgress === totalContent && totalContent > 0) updateData.completed = true;

    await Enrollment.findOneAndUpdate({ user: userId, course: content.course }, updateData);

    res.json({
      success: true,
      message: "Content marked as completed",
      progress: {
        completed: totalProgress,
        total: totalContent,
        percentage: progressPercentage,
      },
      enrollment: {
        progress: progressPercentage,
        completed: updateData.completed || false,
      },
    });
  } catch (error) {
    console.error("Error marking content complete:", error);
    res.status(500).json({
      success: false,
      message: "Error marking content as completed",
      error: error.message,
    });
  }
};

// Get user progress for a course
const getUserProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const progress = await Progress.find({ user: userId, course: courseId }).populate("content", "title type order");

    const totalContent = await CourseContent.countDocuments({ course: courseId, status: "active" });

    const enrollment = await Enrollment.findOne({ user: userId, course: courseId });

    res.json({
      success: true,
      progress: {
        completed: progress.length,
        total: totalContent,
        percentage: totalContent > 0 ? Math.round((progress.length / totalContent) * 100) : 0,
        completedContents: progress.map((p) => p.content._id),
        details: progress,
      },
      enrollment: enrollment,
    });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    res.status(500).json({ success: false, message: "Error fetching user progress", error: error.message });
  }
};

// Check if user is enrolled in a course
const checkEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({ user: userId, course: courseId, paymentStatus: "completed" });

    res.json({
      success: true,
      enrolled: !!enrollment,
      enrollment: enrollment,
    });
  } catch (error) {
    console.error("Error checking enrollment:", error);
    res.status(500).json({ success: false, message: "Error checking enrollment status", error: error.message });
  }
};

module.exports = {
  uploadContent,
  getAllContentData,
  getContentById,
  getCourseContents,
  getPublicCourseContents,
  deleteContent,
  updateContent,
  markAsCompleted,
  getUserProgress,
  checkEnrollment,
  streamVideo,
};