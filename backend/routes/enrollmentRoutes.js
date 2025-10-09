// routes/enrollmentRoutes.js
const express = require('express');
const { createEnrollment, getUserEnrollments, updateProgress } = require('../controllers/enrollmentController');
const { auth } = require('../middleware/auth'); // Fixed: destructure auth

const router = express.Router();

router.post('/', auth, createEnrollment);
router.get('/user/:userId', auth, getUserEnrollments);
router.put('/:id/progress', auth, updateProgress);

module.exports = router;