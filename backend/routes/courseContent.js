// routes/courseContent.js
const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");
const courseContentController = require("../controllers/courseContentController");
const { auth, adminAuth } = require("../middleware/auth"); // Make sure both are imported

// Multi-file support
const multiUpload = upload.fields([
  { name: "videoFile", maxCount: 1 },
  { name: "documentFile", maxCount: 1 },
]);

// Public routes
router.get("/public/:courseId", courseContentController.getPublicCourseContents);

// Protected routes - UPLOAD route uses adminAuth
router.post("/upload", adminAuth, multiUpload, courseContentController.uploadContent); // Changed to adminAuth
router.get("/:courseId", auth, courseContentController.getCourseContents);
router.put("/:id", auth, multiUpload, courseContentController.updateContent);
router.delete("/:id", auth, courseContentController.deleteContent);

// Progress tracking routes
router.post("/:contentId/complete", auth, courseContentController.markAsCompleted);
router.get("/progress/:courseId", auth, courseContentController.getUserProgress);
router.get("/check-enrollment/:courseId", auth, courseContentController.checkEnrollment);

module.exports = router;