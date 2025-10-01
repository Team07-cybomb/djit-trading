const Newsletter = require('../models/Newsletter');

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if already subscribed
    const existingSubscription = await Newsletter.findOne({ email });
    if (existingSubscription) {
      return res.status(400).json({
        message: 'This email is already subscribed to our newsletter'
      });
    }

    const subscription = await Newsletter.create({ email });

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      subscription
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error subscribing to newsletter',
      error: error.message
    });
  }
};

// Get all subscribers (admin only)
exports.getSubscribers = async (req, res) => {
  try {
    const subscribers = await Newsletter.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: subscribers.length,
      subscribers
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching subscribers',
      error: error.message
    });
  }
};

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    const subscription = await Newsletter.findOneAndUpdate(
      { email },
      { isActive: false },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error unsubscribing from newsletter',
      error: error.message
    });
  }
};