// controllers/couponController.js
const Coupon = require('../models/coupon');
const Course = require('../models/Course');

exports.createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, minPurchase, maxDiscount, validFrom, validUntil, usageLimit } = req.body;

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      validFrom,
      validUntil,
      usageLimit,
    });

    res.status(201).json({ success: true, coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, coupons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const { code, totalAmount } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) {
      return res.status(400).json({ success: false, message: 'Coupon expired or not yet valid' });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
    }

    if (coupon.minPurchase && totalAmount < coupon.minPurchase) {
      return res.status(400).json({ success: false, message: `Minimum purchase of ₹${coupon.minPurchase} required` });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (totalAmount * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    const finalAmount = totalAmount - discountAmount;

    res.status(200).json({
      success: true,
      coupon,
      discountAmount,
      finalAmount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
