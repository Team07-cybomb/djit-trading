const express = require('express');
const { 
  getUsers, 
  updateProfile, 
  getUserById, 
  getCurrentUser,
  uploadProfilePicture 
} = require('../controllers/userController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Upload profile picture
router.post('/upload-profile-picture', auth, uploadProfilePicture);

// Get current user profile
router.get('/me', auth, getCurrentUser);

// Get all users (admin only)
router.get('/', auth, adminAuth, getUsers);

// Get user by ID
router.get('/:id', auth, getUserById);

// Update user profile
router.put('/profile', auth, updateProfile);

module.exports = router;