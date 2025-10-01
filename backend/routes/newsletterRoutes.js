const express = require('express');
const { subscribe, getSubscribers, unsubscribe } = require('../controllers/newsletterController');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', subscribe);
router.get('/', adminAuth, getSubscribers);
router.post('/unsubscribe', unsubscribe);

module.exports = router;