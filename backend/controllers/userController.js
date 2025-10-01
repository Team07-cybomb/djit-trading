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
    const { phone, birthday, address, tradingViewId, vishcardId, tradingSegment } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'profile.phone': phone,
          'profile.birthday': birthday,
          'profile.address': address,
          'profile.tradingViewId': tradingViewId,
          'profile.vishcardId': vishcardId,
          'profile.tradingSegment': tradingSegment
        }
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating profile',
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