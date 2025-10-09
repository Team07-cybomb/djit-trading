const express = require('express');
const { 
  getCourses, 
  getCourse, 
  createCourse, 
  updateCourse, 
  deleteCourse, 
  purchaseCourse 
} = require('../controllers/courseController');

const { auth, adminAuth } = require('../middleware/auth');
const CourseContent = require('../models/CourseContent');

const router = express.Router();

// ==========================
// Public routes
// ==========================
router.get('/', getCourses);
router.get('/:id', getCourse);

// ==========================
// Purchase course with coupon
// ==========================
router.post('/purchase', auth, purchaseCourse);

// ==========================
// Get course content (for enrolled users)
// ==========================
router.get('/:id/content', auth, async (req, res) => {
  try {
    const content = await CourseContent.find({ 
      course: req.params.id,
      status: 'active'
    }).sort({ order: 1 });

    res.json({
      success: true,
      content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching course content',
      error: error.message
    });
  }
});

// ==========================
// Admin routes
// ==========================
router.post('/', auth, adminAuth, createCourse);
router.put('/:id', auth, adminAuth, updateCourse);
router.delete('/:id', auth, adminAuth, deleteCourse);

module.exports = router;
