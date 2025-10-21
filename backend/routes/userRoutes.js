const express = require('express');
const { 
  getUsers, 
  updateProfile, 
  getUserById, 
  getCurrentUser,
  uploadProfilePicture,
  importUsers,
  getBatchStats
} = require('../controllers/userController');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Upload profile picture
router.post('/upload-profile-picture', auth, uploadProfilePicture);

// Get current user profile
router.get('/me', auth, getCurrentUser);

// Get all users (admin only)
router.get('/', auth, adminAuth, getUsers);

// Import users from CSV (admin only)
router.post('/import', auth, adminAuth, importUsers);

// Get batch statistics (admin only)
router.get('/batch-stats', auth, adminAuth, getBatchStats);

// Get user by ID
router.get('/:id', auth, getUserById);

// Update user profile
router.put('/profile', auth, updateProfile);

module.exports = router;