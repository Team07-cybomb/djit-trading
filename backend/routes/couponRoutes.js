// routes/couponRoutes.js
const express = require('express');
const router = express.Router();
const { createCoupon, getAllCoupons, validateCoupon } = require('../controllers/couponController');

// Create coupon
router.post('/create', createCoupon);

// Get all coupons
router.get('/', getAllCoupons);

// Validate coupon code
router.post('/validate', validateCoupon);

module.exports = router;
