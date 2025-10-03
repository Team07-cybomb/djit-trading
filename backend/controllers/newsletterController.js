const Newsletter = require('../models/Newsletter');

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if already subscribed
    const existingSubscription = await Newsletter.findOne({ email });
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
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
      success: false,
      message: 'Error subscribing to newsletter',
      error: error.message
    });
  }
};

// Get all subscribers with pagination (admin only)
exports.getSubscribers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const subscribers = await Newsletter.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Newsletter.countDocuments();
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      subscribers,
      currentPage: page,
      totalPages,
      totalSubscribers: total
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscribers',
      error: error.message
    });
  }
};

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const subscription = await Newsletter.findOneAndUpdate(
      { email },
      { isActive: false },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error unsubscribing from newsletter',
      error: error.message
    });
  }
};

// Send newsletter to all active subscribers
exports.sendNewsletter = async (req, res) => {
  try {
    const { subject, content } = req.body;

    if (!subject || !content) {
      return res.status(400).json({
        success: false,
        message: 'Subject and content are required'
      });
    }

    // Get all active subscribers
    const activeSubscribers = await Newsletter.find({ isActive: true });
    
    if (activeSubscribers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No active subscribers found'
      });
    }

    // Here you would integrate with your email service (Nodemailer, SendGrid, etc.)
    // For demonstration, we'll simulate sending emails
    console.log(`=== NEWSLETTER SENDING ===`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${content}`);
    console.log(`Recipients: ${activeSubscribers.length} subscribers`);
    console.log(`Emails: ${activeSubscribers.map(sub => sub.email).join(', ')}`);
    console.log(`=== END NEWSLETTER ===`);

    // Simulate email sending process
    // In real implementation, you would:
    // 1. Use Nodemailer, SendGrid, or other email service
    // 2. Handle email templates
    // 3. Process emails in queue/batches
    // 4. Handle failures and retries

    res.json({
      success: true,
      message: `Newsletter sent successfully to ${activeSubscribers.length} subscribers`,
      recipients: activeSubscribers.length,
      data: {
        subject,
        contentPreview: content.substring(0, 100) + '...'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending newsletter',
      error: error.message
    });
  }
};

// Get subscriber statistics
exports.getSubscriberStats = async (req, res) => {
  try {
    const totalSubscribers = await Newsletter.countDocuments();
    const activeSubscribers = await Newsletter.countDocuments({ isActive: true });
    const inactiveSubscribers = totalSubscribers - activeSubscribers;

    // Get subscription growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newSubscribers = await Newsletter.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      stats: {
        total: totalSubscribers,
        active: activeSubscribers,
        inactive: inactiveSubscribers,
        newLast30Days: newSubscribers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriber statistics',
      error: error.message
    });
  }
};