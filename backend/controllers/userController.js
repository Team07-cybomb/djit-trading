const User = require('../models/User');

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
      discordId
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
      'profile.discordId': discordId
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