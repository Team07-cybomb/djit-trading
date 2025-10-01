const express = require('express');
const { getUsers, updateProfile, getUserById } = require('../controllers/userController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, adminAuth, getUsers);
router.get('/:id', auth, getUserById);
router.put('/profile', auth, updateProfile);

module.exports = router;