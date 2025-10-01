const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

// Create enrollment
exports.createEnrollment = async (req, res) => {
  try {
    const { courseId, couponCode } = req.body;
    const userId = req.user.id;

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(400).json({
        message: 'You are already enrolled in this course'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: 'Course not found'
      });
    }

    const enrollment = await Enrollment.create({
      user: userId,
      course: courseId,
      amountPaid: course.discountedPrice || course.price
    });

    // Update course enrollment count
    course.studentsEnrolled += 1;
    await course.save();

    res.status(201).json({
      success: true,
      enrollment
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating enrollment',
      error: error.message
    });
  }
};

// Get user enrollments
exports.getUserEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.params.userId })
      .populate('course')
      .sort({ enrollmentDate: -1 });

    res.json({
      success: true,
      enrollments
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching enrollments',
      error: error.message
    });
  }
};

// Update enrollment progress
exports.updateProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { progress },
      { new: true }
    );

    if (!enrollment) {
      return res.status(404).json({
        message: 'Enrollment not found'
      });
    }

    res.json({
      success: true,
      enrollment
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating progress',
      error: error.message
    });
  }
};