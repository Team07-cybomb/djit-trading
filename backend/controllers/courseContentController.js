const CourseContent = require('../models/CourseContent');
const Course = require('../models/Course');
const fs = require('fs');
const path = require('path');

// Debug: Check if models are loaded
console.log('=== DEBUG: CourseContent Controller Loading ===');
console.log('CourseContent model:', CourseContent ? 'Loaded' : 'NOT LOADED');
console.log('Course model:', Course ? 'Loaded' : 'NOT LOADED');

// Get all content for a course
exports.getCourseContent = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    console.log('=== DEBUG: getCourseContent called ===');
    console.log('CourseId:', courseId);

    // Verify course exists first
    const courseExists = await Course.findById(courseId);
    console.log('Course exists:', !!courseExists);
    
    if (!courseExists) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    
    const content = await CourseContent.find({ course: courseId })
      .sort({ order: 1 })
      .select('-__v');
    
    console.log('✅ Found content:', content.length, 'items');
    
    res.json({
      success: true,
      content,
      count: content.length,
      course: {
        title: courseExists.title,
        _id: courseExists._id
      }
    });
  } catch (error) {
    console.error('❌ Error in getCourseContent:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error fetching course content',
      error: error.message
    });
  }
};

// Add new course content with file upload
exports.addCourseContent = async (req, res) => {
  console.log('=== DEBUG: addCourseContent called ===');
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);
  console.log('Course ID:', req.params.courseId);

  try {
    const { courseId } = req.params;
    const {
      title,
      description,
      type,
      videoUrl,
      documentUrl,
      duration,
      order,
      isFree
    } = req.body;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      console.log('❌ Course not found:', courseId);
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    console.log('✅ Course found:', course.title);

    const contentData = {
      course: courseId,
      title: title.trim(),
      description: description?.trim() || '',
      type,
      duration: duration?.trim() || '',
      order: parseInt(order) || 1,
      isFree: isFree === 'true' || isFree === true
    };

    console.log('📝 Content data:', contentData);

    // Handle file uploads
    if (req.files) {
      console.log('📁 Files received:', Object.keys(req.files));
      
      if (req.files.videoFile && req.files.videoFile[0]) {
        const videoFile = req.files.videoFile[0];
        console.log('🎥 Video file details:', {
          filename: videoFile.filename,
          originalName: videoFile.originalname,
          path: videoFile.path,
          size: videoFile.size,
          mimetype: videoFile.mimetype
        });
        
        contentData.videoFile = {
          filename: videoFile.filename,
          originalName: videoFile.originalname,
          path: videoFile.path,
          size: videoFile.size,
          mimetype: videoFile.mimetype,
          url: `/api/admin/courses/content/uploads/videos/${videoFile.filename}`
        };
        contentData.videoUrl = contentData.videoFile.url;
      }

      if (req.files.documentFile && req.files.documentFile[0]) {
        const documentFile = req.files.documentFile[0];
        console.log('📄 Document file details:', {
          filename: documentFile.filename,
          originalName: documentFile.originalname,
          path: documentFile.path,
          size: documentFile.size,
          mimetype: documentFile.mimetype
        });
        
        contentData.documentFile = {
          filename: documentFile.filename,
          originalName: documentFile.originalname,
          path: documentFile.path,
          size: documentFile.size,
          mimetype: documentFile.mimetype,
          url: `/api/admin/courses/content/uploads/documents/${documentFile.filename}`
        };
        contentData.documentUrl = contentData.documentFile.url;
      }
    } else {
      console.log('📝 No files received, using URL fields');
      // Use URL fields if no files uploaded
      if (videoUrl) contentData.videoUrl = videoUrl.trim();
      if (documentUrl) contentData.documentUrl = documentUrl.trim();
    }

    // Validate that required media is provided based on type
    if (contentData.type === 'video' && !contentData.videoUrl && !contentData.videoFile) {
      return res.status(400).json({
        success: false,
        message: 'Video content requires either a video file or video URL'
      });
    }

    if ((contentData.type === 'document' || contentData.type === 'pdf') && !contentData.documentUrl && !contentData.documentFile) {
      return res.status(400).json({
        success: false,
        message: 'Document content requires either a document file or document URL'
      });
    }

    console.log('💾 Saving content to database...');
    
    // Debug: Check if CourseContent is defined before using it
    if (!CourseContent) {
      console.error('❌ CourseContent model is not defined!');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error: CourseContent model not loaded'
      });
    }

    const newContent = new CourseContent(contentData);
    await newContent.save();

    console.log('✅ Content saved successfully');

    res.status(201).json({
      success: true,
      message: 'Content added successfully',
      content: newContent
    });

  } catch (error) {
    console.error('❌ Error adding course content:', error);
    console.error('Error stack:', error.stack);
    
    // Clean up uploaded files if there was an error
    if (req.files) {
      console.log('🧹 Cleaning up uploaded files due to error');
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(file => {
          if (fs.existsSync(file.path)) {
            try {
              fs.unlinkSync(file.path);
              console.log(`✅ Deleted file: ${file.path}`);
            } catch (unlinkError) {
              console.error('❌ Error deleting file:', unlinkError);
            }
          }
        });
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating course content',
      error: error.message
    });
  }
};

// Update course content
exports.updateCourseContent = async (req, res) => {
  try {
    const { courseId, contentId } = req.params;
    const updateData = { ...req.body };

    // Check if content exists and belongs to course
    const existingContent = await CourseContent.findOne({
      _id: contentId,
      course: courseId
    });

    if (!existingContent) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Handle file uploads if any
    if (req.files) {
      if (req.files.videoFile && req.files.videoFile[0]) {
        const videoFile = req.files.videoFile[0];
        
        // Delete old video file if exists
        if (existingContent.videoFile && existingContent.videoFile.path) {
          if (fs.existsSync(existingContent.videoFile.path)) {
            fs.unlinkSync(existingContent.videoFile.path);
          }
        }

        updateData.videoFile = {
          filename: videoFile.filename,
          originalName: videoFile.originalname,
          path: videoFile.path,
          size: videoFile.size,
          mimetype: videoFile.mimetype,
          url: `/api/admin/courses/content/uploads/videos/${videoFile.filename}`
        };
        updateData.videoUrl = updateData.videoFile.url;
      }

      if (req.files.documentFile && req.files.documentFile[0]) {
        const documentFile = req.files.documentFile[0];
        
        // Delete old document file if exists
        if (existingContent.documentFile && existingContent.documentFile.path) {
          if (fs.existsSync(existingContent.documentFile.path)) {
            fs.unlinkSync(existingContent.documentFile.path);
          }
        }

        updateData.documentFile = {
          filename: documentFile.filename,
          originalName: documentFile.originalname,
          path: documentFile.path,
          size: documentFile.size,
          mimetype: documentFile.mimetype,
          url: `/api/admin/courses/content/uploads/documents/${documentFile.filename}`
        };
        updateData.documentUrl = updateData.documentFile.url;
      }
    }

    // Convert order to number if present
    if (updateData.order) {
      updateData.order = parseInt(updateData.order);
    }

    const updatedContent = await CourseContent.findByIdAndUpdate(
      contentId,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({
      success: true,
      message: 'Content updated successfully',
      content: updatedContent
    });

  } catch (error) {
    console.error('Error updating course content:', error);
    
    // Clean up uploaded files if there was an error
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating course content',
      error: error.message
    });
  }
};

// Delete course content
exports.deleteCourseContent = async (req, res) => {
  try {
    const { courseId, contentId } = req.params;

    const content = await CourseContent.findOne({
      _id: contentId,
      course: courseId
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Delete associated files
    if (content.videoFile && content.videoFile.path) {
      if (fs.existsSync(content.videoFile.path)) {
        fs.unlinkSync(content.videoFile.path);
      }
    }

    if (content.documentFile && content.documentFile.path) {
      if (fs.existsSync(content.documentFile.path)) {
        fs.unlinkSync(content.documentFile.path);
      }
    }

    await CourseContent.findByIdAndDelete(contentId);

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting course content:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course content',
      error: error.message
    });
  }
};

// Serve uploaded files
exports.serveFile = async (req, res) => {
  try {
    const { fileType, filename } = req.params;
    
    const validTypes = ['videos', 'documents'];
    if (!validTypes.includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type'
      });
    }

    const filePath = path.join(__dirname, '..', 'uploads', fileType, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Set appropriate headers
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain'
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({
      success: false,
      message: 'Error serving file',
      error: error.message
    });
  }
};

// Get single content item
exports.getContentById = async (req, res) => {
  try {
    const { courseId, contentId } = req.params;

    const content = await CourseContent.findOne({
      _id: contentId,
      course: courseId
    }).select('-__v');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      content
    });

  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
};

// Update content order (bulk update) - ADD THIS MISSING FUNCTION
exports.updateContentOrder = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { contentOrder } = req.body;

    if (!Array.isArray(contentOrder)) {
      return res.status(400).json({
        success: false,
        message: 'contentOrder must be an array'
      });
    }

    const bulkOps = contentOrder.map(item => ({
      updateOne: {
        filter: { _id: item.id, course: courseId },
        update: { order: item.order }
      }
    }));

    await CourseContent.bulkWrite(bulkOps);

    res.json({
      success: true,
      message: 'Content order updated successfully'
    });

  } catch (error) {
    console.error('Error updating content order:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating content order',
      error: error.message
    });
  }
};

// Test route for debugging
exports.testRoute = async (req, res) => {
  try {
    console.log('=== DEBUG: Test route called ===');
    console.log('CourseId from params:', req.params.courseId);
    
    // Test if CourseContent model is available
    if (!CourseContent) {
      return res.status(500).json({
        success: false,
        message: 'CourseContent model not loaded',
        modelLoaded: false
      });
    }
    
    const content = await CourseContent.find({ course: req.params.courseId }).sort({ order: 1 });
    
    console.log('✅ Database query successful, found:', content.length, 'items');
    
    res.json({
      success: true,
      content,
      debug: {
        modelLoaded: true,
        courseId: req.params.courseId,
        count: content.length
      }
    });
  } catch (error) {
    console.error('❌ Test route error:', error);
    res.status(500).json({
      success: false,
      message: 'Test route error',
      error: error.message,
      modelLoaded: !!CourseContent
    });
  }
};