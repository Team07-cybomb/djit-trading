const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

// Create enrollment
exports.createEnrollment = async (req, res) => {
  try {
    const { courseId, couponCode, finalAmount = 0 } = req.body; // Add finalAmount
    const userId = req.user.id;

    console.log('🎯 Creating enrollment for:', { userId, courseId, couponCode, finalAmount });

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (existingEnrollment) {
      console.log('⚠️ User already enrolled:', existingEnrollment);
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    console.log('📚 Course found:', course.title, 'Price:', course.price, 'Final Amount:', finalAmount);

    // Determine payment status based on final amount
    const isFreeEnrollment = finalAmount === 0 || course.price === 0 || course.discountedPrice === 0;
    
    const enrollmentData = {
      user: userId,
      course: courseId,
      amountPaid: finalAmount === 0 ? 0 : (course.discountedPrice || course.price), // Use finalAmount if it's 0
      paymentStatus: isFreeEnrollment ? 'completed' : 'pending', // Set completed for free enrollments
      enrollmentDate: new Date()
    };

    console.log('📝 Creating enrollment with data:', enrollmentData);

    const enrollment = await Enrollment.create(enrollmentData);

    // Update course enrollment count
    course.studentsEnrolled += 1;
    await course.save();

    console.log('✅ Enrollment created successfully:', enrollment._id, 'Payment Status:', enrollment.paymentStatus);

    res.status(201).json({
      success: true,
      enrollment
    });
  } catch (error) {
    console.error('❌ Error creating enrollment:', error);
    res.status(500).json({
      success: false,
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