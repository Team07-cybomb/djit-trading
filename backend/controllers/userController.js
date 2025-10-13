const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profile-pictures/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Get all users (admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { 
      phone, 
      birthday, 
      address, 
      tradingViewId, 
      vishcardId, 
      tradingSegment,
      firstName,
      lastName,
      phone2,
      discordId,
      profilePicture
    } = req.body;
    
    const updateData = {
      'profile.phone': phone,
      'profile.birthday': birthday,
      'profile.tradingViewId': tradingViewId,
      'profile.vishcardId': vishcardId,
      'profile.tradingSegment': tradingSegment,
      'profile.firstName': firstName,
      'profile.lastName': lastName,
      'profile.phone2': phone2,
      'profile.discordId': discordId,
      'profile.profilePicture': profilePicture
    };

    // Add address fields if provided
    if (address) {
      updateData['profile.address.street'] = address.street;
      updateData['profile.address.city'] = address.city;
      updateData['profile.address.state'] = address.state;
      updateData['profile.address.zipCode'] = address.zipCode;
      updateData['profile.address.country'] = address.country;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: updateData
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Upload profile picture
exports.uploadProfilePicture = [
  upload.single('profilePicture'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      // Use absolute URL for the uploaded file to fix 404 issue
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? `${req.protocol}://${req.get('host')}`
        : 'http://localhost:5000'; // Your backend port

      const profilePicture = {
        url: `${baseUrl}/uploads/profile-pictures/${req.file.filename}`,
        filename: req.file.filename
      };

      // Update user's profile picture
      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          $set: {
            'profile.profilePicture': profilePicture
          }
        },
        { new: true }
      ).select('-password');

      if (!user) {
        // Delete the uploaded file if user not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Profile picture uploaded successfully',
        profilePicture,
        user
      });

    } catch (error) {
      console.error('Profile picture upload error:', error);
      
      // Delete the uploaded file if there was an error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        message: 'Error uploading profile picture',
        error: error.message
      });
    }
  }
];

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching user',
      error: error.message
    });
  }
};