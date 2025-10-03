const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const Coupon = require('../models/Coupon');
const paymentService = require('../services/paymentService');
const emailService = require('../services/emailService');

// Create payment order
exports.createPaymentOrder = async (req, res) => {
  try {
    console.log('=== CREATE PAYMENT ORDER STARTED ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.user.id);

    const { courseId, couponCode } = req.body;
    const userId = req.user.id;

    // Get course details
    console.log('Fetching course:', courseId);
    const course = await Course.findById(courseId);
    console.log('Course found:', course);
    
    if (!course) {
      console.log('Course not found');
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      course: courseId
    });

    if (existingEnrollment && existingEnrollment.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Calculate final amount
    let finalAmount = course.discountedPrice || course.price;
    let discountAmount = 0;
    let coupon = null;

    // Validate coupon if provided
    if (couponCode) {
      coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        validFrom: { $lte: new Date() },
        validUntil: { $gte: new Date() }
      });

      if (coupon) {
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
          return res.status(400).json({
            success: false,
            message: 'Coupon usage limit reached'
          });
        }

        if (coupon.minPurchase && finalAmount < coupon.minPurchase) {
          return res.status(400).json({
            success: false,
            message: `Coupon requires minimum purchase of ₹${coupon.minPurchase}`
          });
        }

        // Apply discount
        if (coupon.discountType === 'percentage') {
          discountAmount = (finalAmount * coupon.discountValue) / 100;
          if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
            discountAmount = coupon.maxDiscount;
          }
        } else {
          discountAmount = coupon.discountValue;
        }

        finalAmount -= discountAmount;
        if (finalAmount < 0) finalAmount = 0;
      }
    }

    // Create payment record
    const payment = await Payment.create({
      user: userId,
      course: courseId,
      amount: course.discountedPrice || course.price,
      discountAmount,
      finalAmount,
      couponUsed: coupon?._id,
      paymentStatus: 'pending'
    });

    // Create payment order with gateway
    const order = await paymentService.createOrder({
      amount: finalAmount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${payment._id}`,
      notes: {
        paymentId: payment._id.toString(),
        courseId: courseId,
        userId: userId
      }
    });

    // Update payment with gateway order ID
    payment.gatewayOrderId = order.id;
    await payment.save();

    res.json({
      success: true,
      order,
      payment: {
        id: payment._id,
        amount: finalAmount,
        currency: 'INR'
      }
    });

  } catch (error) {
    console.error('Payment order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment order',
      error: error.message
    });
  }
};

// Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const { paymentId, orderId, signature } = req.body;
    const userId = req.user.id;

    // Verify payment signature
    const isVerified = paymentService.verifySignature(orderId, paymentId, signature);
    
    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    // Get payment details from gateway
    const paymentDetails = await paymentService.getPaymentDetails(paymentId);

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { 
        _id: paymentId, 
        user: userId,
        paymentStatus: 'pending'
      },
      {
        paymentStatus: 'completed',
        gatewayPaymentId: paymentId,
        gatewaySignature: signature,
        paymentDate: new Date(),
        metadata: paymentDetails
      },
      { new: true }
    ).populate('course').populate('user');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found or already processed'
      });
    }

    // Create or update enrollment
    let enrollment = await Enrollment.findOne({
      user: userId,
      course: payment.course._id
    });

    if (enrollment) {
      enrollment.paymentStatus = 'completed';
      enrollment.amountPaid = payment.finalAmount;
      enrollment.couponUsed = payment.couponUsed;
      await enrollment.save();
    } else {
      enrollment = await Enrollment.create({
        user: userId,
        course: payment.course._id,
        paymentStatus: 'completed',
        amountPaid: payment.finalAmount,
        couponUsed: payment.couponUsed
      });

      // Update course enrollment count
      await Course.findByIdAndUpdate(payment.course._id, {
        $inc: { studentsEnrolled: 1 }
      });
    }

    // Update coupon usage count
    if (payment.couponUsed) {
      await Coupon.findByIdAndUpdate(payment.couponUsed, {
        $inc: { usedCount: 1 }
      });
    }

    // Send confirmation email
    await emailService.sendPaymentConfirmation({
      to: payment.user.email,
      userName: payment.user.username,
      courseName: payment.course.title,
      amount: payment.finalAmount,
      paymentDate: payment.paymentDate
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        id: payment._id,
        status: payment.paymentStatus,
        amount: payment.finalAmount
      },
      enrollment: {
        id: enrollment._id,
        course: payment.course.title
      }
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

// Get user payments
exports.getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user.id })
      .populate('course')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

// Get all payments (admin only)
exports.getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = {};
    
    if (status) {
      filter.paymentStatus = status;
    }

    const payments = await Payment.find(filter)
      .populate('user', 'username email')
      .populate('course', 'title price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      payments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
};

// Initiate refund
exports.initiateRefund = async (req, res) => {
  try {
    const { paymentId, refundAmount, reason } = req.body;

    const payment = await Payment.findById(paymentId)
      .populate('user')
      .populate('course');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.paymentStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot refund non-completed payment'
      });
    }

    const refundableAmount = refundAmount || payment.finalAmount;

    // Process refund with payment gateway
    const refund = await paymentService.initiateRefund({
      paymentId: payment.gatewayPaymentId,
      amount: refundableAmount * 100, // Convert to paise
      notes: {
        reason: reason || 'Customer request',
        admin: req.user.id
      }
    });

    // Update payment record
    payment.paymentStatus = 'refunded';
    payment.refundAmount = refundableAmount;
    payment.refundId = refund.id;
    payment.refundDate = new Date();
    await payment.save();

    // Update enrollment status
    await Enrollment.findOneAndUpdate(
      { user: payment.user._id, course: payment.course._id },
      { paymentStatus: 'refunded' }
    );

    // Update course enrollment count
    await Course.findByIdAndUpdate(payment.course._id, {
      $inc: { studentsEnrolled: -1 }
    });

    // Send refund confirmation email
    await emailService.sendRefundConfirmation({
      to: payment.user.email,
      userName: payment.user.username,
      courseName: payment.course.title,
      amount: refundableAmount,
      refundDate: payment.refundDate
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: refundableAmount,
        status: refund.status
      }
    });

  } catch (error) {
    console.error('Refund initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error.message
    });
  }
};