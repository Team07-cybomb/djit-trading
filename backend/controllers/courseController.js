const Course = require('../models/Course');
const Coupon = require('../models/coupon');

// =============================
// Get all courses
// =============================
exports.getCourses = async (req, res) => {
  try {
    const { category, level, featured } = req.query;
    let filter = { status: 'active' };

    if (category) filter.category = category;
    if (level) filter.level = level;
    if (featured) filter.featured = featured === 'true';

    const courses = await Course.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching courses',
      error: error.message
    });
  }
};

// =============================
// Get single course
// =============================
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ success: true, course });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching course',
      error: error.message
    });
  }
};

// =============================
// Create course (Admin only)
// =============================
exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating course',
      error: error.message
    });
  }
};

// =============================
// Update course (Admin only)
// =============================
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating course',
      error: error.message
    });
  }
};

// =============================
// Delete course (Admin only)
// =============================
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting course',
      error: error.message
    });
  }
};

// =============================
// Purchase Course (with coupon)
// =============================
exports.purchaseCourse = async (req, res) => {
  try {
    const { courseId, couponCode } = req.body;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    let totalAmount = course.price;
    let discountAmount = 0;

    // If coupon applied
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });

      if (!coupon) {
        return res.status(400).json({ success: false, message: 'Invalid coupon code' });
      }

      const now = new Date();
      if (now < coupon.validFrom || now > coupon.validUntil) {
        return res.status(400).json({ success: false, message: 'Coupon expired or not valid' });
      }

      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
      }

      if (coupon.minPurchase && totalAmount < coupon.minPurchase) {
        return res.status(400).json({ success: false, message: `Minimum purchase of ₹${coupon.minPurchase} required` });
      }

      if (coupon.discountType === 'percentage') {
        discountAmount = (totalAmount * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else {
        discountAmount = coupon.discountValue;
      }

      totalAmount = totalAmount - discountAmount;

      coupon.usedCount += 1;
      await coupon.save();
    }

    // TODO: Implement saving the order in Order Model (optional)

    res.json({
      success: true,
      message: 'Course purchased successfully',
      course,
      discountAmount,
      finalAmount: totalAmount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error purchasing course',
      error: error.message
    });
  }
};
