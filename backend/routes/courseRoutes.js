const express = require('express');
const { getCourses, getCourse, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', getCourses);
router.get('/:id', getCourse);
router.post('/', auth, adminAuth, createCourse);
router.put('/:id', auth, adminAuth, updateCourse);
router.delete('/:id', auth, adminAuth, deleteCourse);

module.exports = router;