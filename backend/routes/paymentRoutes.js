const express = require('express');
const { 
  createPaymentOrder, 
  verifyPayment, 
  getUserPayments, 
  getAllPayments, 
  initiateRefund 
} = require('../controllers/paymentController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/create-order', auth, createPaymentOrder);
router.post('/verify', auth, verifyPayment);
router.get('/user', auth, getUserPayments);
router.get('/all', auth, adminAuth, getAllPayments);
router.post('/refund', auth, adminAuth, initiateRefund);

module.exports = router;