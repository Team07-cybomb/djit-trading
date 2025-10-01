const express = require('express');
const { getCoupons, createCoupon, validateCoupon, updateCoupon, deleteCoupon } = require('../controllers/couponController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, adminAuth, getCoupons);
router.post('/', auth, adminAuth, createCoupon);
router.post('/validate', auth, validateCoupon);
router.put('/:id', auth, adminAuth, updateCoupon);
router.delete('/:id', auth, adminAuth, deleteCoupon);

module.exports = router;