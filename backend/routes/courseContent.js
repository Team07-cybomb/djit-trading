const express = require('express');
const router = express.Router();
const courseContentController = require('../controllers/courseContentController');
const { uploadContentFiles, handleUploadError } = require('../middleware/uploadMiddleware');
const { adminAuth } = require('../middleware/auth');

console.log('=== DEBUG: CourseContent Routes Loading ===');

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`📝 CourseContent Route: ${req.method} ${req.originalUrl}`);
  console.log(`🔐 Auth Header: ${req.headers.authorization ? 'Present' : 'Missing'}`);
  next();
});

// Apply admin auth middleware to all routes
router.use(adminAuth);

// Debug route to check model loading
router.get('/debug/models', courseContentController.debugModels);

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

// Serve uploaded files (public route - remove auth for file serving)
router.get('/content/uploads/:fileType/:filename', (req, res, next) => {
  // Bypass auth for file serving
  courseContentController.serveFile(req, res, next);
});

console.log('=== DEBUG: CourseContent Routes Loaded ===');

module.exports = router;