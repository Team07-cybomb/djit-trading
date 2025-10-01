const Coupon = require('../models/Coupon');

// Get all coupons (admin only)
exports.getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: coupons.length,
      coupons
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching coupons',
      error: error.message
    });
  }
};

// Create coupon (admin only)
exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    
    res.status(201).json({
      success: true,
      coupon
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating coupon',
      error: error.message
    });
  }
};

// Validate coupon
exports.validateCoupon = async (req, res) => {
  try {
    const { code, courseId } = req.body;
    
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(),
      isActive: true,
      validFrom: { $lte: new Date() },
      validUntil: { $gte: new Date() }
    });

    if (!coupon) {
      return res.status(404).json({
        message: 'Invalid or expired coupon code'
      });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({
        message: 'Coupon usage limit reached'
      });
    }

    res.json({
      success: true,
      coupon
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error validating coupon',
      error: error.message
    });
  }
};

// Update coupon (admin only)
exports.updateCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!coupon) {
      return res.status(404).json({
        message: 'Coupon not found'
      });
    }

    res.json({
      success: true,
      coupon
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating coupon',
      error: error.message
    });
  }
};

// Delete coupon (admin only)
exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        message: 'Coupon not found'
      });
    }

    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting coupon',
      error: error.message
    });
  }
};