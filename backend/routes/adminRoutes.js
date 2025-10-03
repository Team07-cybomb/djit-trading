const express = require('express');
const { adminAuth } = require('../middleware/auth');
const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Newsletter = require('../models/Newsletter');
const Payment = require('../models/Payment');

const router = express.Router();

// All routes are protected with adminAuth
router.use(adminAuth);

// Get admin dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    console.log('Admin accessing dashboard:', req.admin._id);
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue,
      recentEnrollments,
      popularCourses
    ] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Payment.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$finalAmount' } } }
      ]),
      Enrollment.find()
        .populate('user', 'username email')
        .populate('course', 'title')
        .sort({ createdAt: -1 })
        .limit(10),
      Enrollment.aggregate([
        { $group: { _id: '$course', enrollments: { $sum: 1 } } },
        { $sort: { enrollments: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'courses',
            localField: '_id',
            foreignField: '_id',
            as: 'course'
          }
        },
        { $unwind: '$course' }
      ])
    ]);

    const stats = {
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue: totalRevenue[0]?.total || 0,
      recentEnrollments,
      popularCourses
    };

    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = search ? {
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update user role
router.put('/users/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Also delete user's enrollments
    await Enrollment.deleteMany({ user: req.params.id });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all enrollments with filters
router.get('/enrollments', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', course = '' } = req.query;
    const query = {};
    
    if (status) query.paymentStatus = status;
    if (course) query.course = course;

    const enrollments = await Enrollment.find(query)
      .populate('user', 'username email')
      .populate('course', 'title price')
      .sort({ enrollmentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Enrollment.countDocuments(query);

    res.json({
      success: true,
      enrollments,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update enrollment status
router.put('/enrollments/:id', adminAuth, async (req, res) => {
  try {
    const { progress, completed, paymentStatus } = req.body;
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { progress, completed, paymentStatus },
      { new: true }
    ).populate('user', 'username email')
     .populate('course', 'title');

    if (!enrollment) {
      return res.status(404).json({ success: false, message: 'Enrollment not found' });
    }

    res.json({ success: true, enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all newsletter subscribers
router.get('/newsletter', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const subscribers = await Newsletter.find()
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Newsletter.countDocuments();

    res.json({
      success: true,
      subscribers,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send newsletter to all subscribers
router.post('/newsletter/send', adminAuth, async (req, res) => {
  try {
    const { subject, content } = req.body;
    const subscribers = await Newsletter.find({ isActive: true });
    
    // In a real application, you would use a queue system for this
    const emailService = require('../services/emailService');
    
    const results = await Promise.allSettled(
      subscribers.map(subscriber => 
        emailService.sendNewsletter({
          to: subscriber.email,
          subject,
          content
        })
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    res.json({
      success: true,
      message: `Newsletter sent to ${successful} subscribers${failed > 0 ? `, ${failed} failed` : ''}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// ... rest of your existing admin routes remain the same
// All routes will automatically have req.admin available

module.exports = router;