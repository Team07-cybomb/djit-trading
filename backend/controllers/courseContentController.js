// controllers/courseContentController.js
const path = require("path");
const fs = require("fs");
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
          path: `uploads/${file.filename}`, // FIX: Store relative path
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
          path: `uploads/${file.filename}`, // FIX: Store relative path
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
      order: order || 1,
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

// Get contents for enrolled users
const getCourseContents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    console.log(`Fetching course content for user ${userId}, course ${courseId}`);

    // Check if user is enrolled in the course - using your enrollment model
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      paymentStatus: 'completed' // Only allow access if payment is completed
    });

    if (!enrollment) {
      return res.status(403).json({ 
        success: false, 
        message: "You are not enrolled in this course or payment is pending. Please enroll first." 
      });
    }

    // Get course content with status active, sorted by order
    const contents = await CourseContent.find({ 
      course: courseId,
      status: 'active'
    }).sort({ order: 1 });

    // Get user progress
    const userProgress = await Progress.find({
      user: userId,
      course: courseId,
    });

    const completedContentIds = userProgress.map(progress => progress.content.toString());

    // Calculate overall progress percentage
    const progressPercentage = contents.length > 0 ? 
      Math.round((userProgress.length / contents.length) * 100) : 0;

    res.json({ 
      success: true, 
      content: contents,
      enrollment: {
        enrollmentDate: enrollment.enrollmentDate,
        progress: enrollment.progress,
        completed: enrollment.completed
      },
      progress: {
        completed: userProgress.length,
        total: contents.length,
        completedContentIds: completedContentIds,
        percentage: progressPercentage
      }
    });
  } catch (error) {
    console.error("Error fetching course contents:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get public course contents (free content for preview)
const getPublicCourseContents = async (req, res) => {
  try {
    const { courseId } = req.params;

    const contents = await CourseContent.find({ 
      course: courseId,
      status: 'active',
      isFree: true
    }).sort({ order: 1 }).select('title description type duration order isFree');

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
          path: `uploads/${file.filename}`, // FIX: Store relative path
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
          path: `uploads/${file.filename}`, // FIX: Store relative path
          size: file.size,
          mimetype: file.mimetype,
          url: `/uploads/${file.filename}`,
        };
      }
    }

    // Convert string booleans
    if (updateData.isFree) {
      updateData.isFree = updateData.isFree === "true" || updateData.isFree === true;
    }
    if (updateData.order) {
      updateData.order = parseInt(updateData.order);
    }

    const updatedContent = await CourseContent.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

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

    // Check if content exists
    const content = await CourseContent.findById(contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: "Content not found",
      });
    }

    // Check if user is enrolled in the course with completed payment
    const enrollment = await Enrollment.findOne({
      user: userId,
      course: content.course,
      paymentStatus: 'completed'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course or payment is pending",
      });
    }

    // Check if already completed
    const existingProgress = await Progress.findOne({
      user: userId,
      content: contentId,
    });

    if (existingProgress) {
      return res.json({
        success: true,
        message: "Content already marked as completed",
        progress: existingProgress,
      });
    }

    // Create progress record
    const progress = new Progress({
      user: userId,
      course: content.course,
      content: contentId,
      completedAt: new Date(),
    });

    await progress.save();

    // Get updated progress count
    const totalProgress = await Progress.countDocuments({
      user: userId,
      course: content.course,
    });

    const totalContent = await CourseContent.countDocuments({
      course: content.course,
      status: 'active',
    });

    // Calculate new progress percentage
    const progressPercentage = Math.round((totalProgress / totalContent) * 100);

    // Update enrollment progress and check if course is completed
    const updateData = {
      progress: progressPercentage
    };

    // If all content is completed, mark course as completed
    if (totalProgress === totalContent && totalContent > 0) {
      updateData.completed = true;
    }

    await Enrollment.findOneAndUpdate(
      { user: userId, course: content.course },
      updateData
    );

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
        completed: updateData.completed || false
      }
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

    const progress = await Progress.find({
      user: userId,
      course: courseId,
    }).populate("content", "title type order");

    const totalContent = await CourseContent.countDocuments({
      course: courseId,
      status: 'active',
    });

    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
    });

    res.json({
      success: true,
      progress: {
        completed: progress.length,
        total: totalContent,
        percentage: totalContent > 0 ? Math.round((progress.length / totalContent) * 100) : 0,
        completedContents: progress.map(p => p.content._id),
        details: progress,
      },
      enrollment: enrollment,
    });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user progress",
      error: error.message,
    });
  }
};

// Check if user is enrolled in a course
const checkEnrollment = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const enrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
      paymentStatus: 'completed'
    });

    res.json({
      success: true,
      enrolled: !!enrollment,
      enrollment: enrollment
    });
  } catch (error) {
    console.error("Error checking enrollment:", error);
    res.status(500).json({
      success: false,
      message: "Error checking enrollment status",
      error: error.message,
    });
  }
};

// Export all functions
module.exports = {
  uploadContent,
  getCourseContents,
  getPublicCourseContents,
  deleteContent,
  updateContent,
  markAsCompleted,
  getUserProgress,
  checkEnrollment
};