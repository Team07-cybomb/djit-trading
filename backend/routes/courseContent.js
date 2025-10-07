const express = require('express');
const router = express.Router();
const courseContentController = require('../controllers/courseContentController');
const { uploadContentFiles, handleUploadError } = require('../middleware/uploadMiddleware');
const { adminAuth } = require('../middleware/auth'); // Fixed import path

console.log('=== DEBUG: CourseContent Routes Loading ===');

// Apply admin auth middleware to all routes
router.use(adminAuth);

// Test route for debugging
router.get('/test/:courseId', courseContentController.testRoute);

// Get all content for a course
router.get('/:courseId/content', courseContentController.getCourseContent);

// Get single content item
router.get('/:courseId/content/:contentId', courseContentController.getContentById);

// Add new course content with file upload
router.post('/:courseId/content', 
  uploadContentFiles,
  handleUploadError,
  courseContentController.addCourseContent
);

// Update course content
router.put('/:courseId/content/:contentId',
  uploadContentFiles,
  handleUploadError,
  courseContentController.updateCourseContent
);

// Delete course content
router.delete('/:courseId/content/:contentId', courseContentController.deleteCourseContent);

// Update content order (bulk update)
router.put('/:courseId/content-order', courseContentController.updateContentOrder);

// Serve uploaded files (make this public if needed)
router.get('/content/uploads/:fileType/:filename', courseContentController.serveFile);

console.log('=== DEBUG: CourseContent Routes Loaded ===');

module.exports = router;