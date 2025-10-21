const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const bcrypt = require('bcryptjs');

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

// Configure multer for CSV uploads
const csvStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/csv-imports/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'contacts-' + uniqueSuffix + '.csv');
  }
});

const csvUpload = multer({
  storage: csvStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'), false);
    }
  }
});

// Get all users (admin only)
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', batch = '' } = req.query;
    
    let query = {};
    if (search) {
      query = {
        $or: [
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { 'profile.firstName': { $regex: search, $options: 'i' } },
          { 'profile.lastName': { $regex: search, $options: 'i' } },
          { 'profile.phone': { $regex: search, $options: 'i' } },
          { 'profile.tradingSegment': { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Add batch filter
    if (batch) {
      query.batch = batch;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Get unique batches for filter dropdown
    const batches = await User.distinct('batch');

    res.json({
      success: true,
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      batches
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// Import users from CSV
exports.importUsers = [
  csvUpload.single('csvFile'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No CSV file uploaded'
        });
      }

      const batchId = `batch_${Date.now()}`;
      const batchName = req.body.batchName || `Import ${new Date().toLocaleDateString()}`;
      const results = {
        total: 0,
        successful: 0,
        failed: 0,
        errors: []
      };

      const processRow = (row) => {
        return new Promise(async (resolve) => {
          try {
            results.total++;

            // Skip if no email
            if (!row['Email 1'] && !row['Email 2']) {
              results.failed++;
              results.errors.push(`Row ${results.total}: No email provided`);
              return resolve();
            }

            const email = row['Email 1'] || row['Email 2'];
            
            // Check if user already exists
            const existingUser = await User.findOne({ 
              $or: [
                { email: email.toLowerCase() },
                { username: email.toLowerCase().split('@')[0] }
              ] 
            });

            if (existingUser) {
              results.failed++;
              results.errors.push(`Row ${results.total}: User with email ${email} already exists`);
              return resolve();
            }

            // Generate username from email
            const username = email.toLowerCase().split('@')[0];
            
            // Generate a random password
            const tempPassword = Math.random().toString(36).slice(-8);
            
            // Parse birthday
            let birthday = null;
            if (row['Birthdate']) {
              birthday = new Date(row['Birthdate']);
            }

            // Create user
            const userData = {
              username: username,
              email: email.toLowerCase(),
              password: tempPassword,
              batch: batchName,
              importSource: 'csv_import',
              importBatchId: batchId,
              importDate: new Date(),
              profile: {
                firstName: row['First Name'] || '',
                lastName: row['Last Name'] || '',
                phone: row['Phone 1'] || '',
                phone2: row['Phone 2'] || '',
                birthday: birthday,
                discordId: row['discord id'] || '',
                tradingViewId: row['Tradingview ID'] || '',
                address: {
                  street: row['Address 1 - Street'] || '',
                  city: row['Address 2 - City'] || '',
                  state: row['Address 2 - State/Region'] || '',
                  zipCode: row['Address 2 - Zip'] || '',
                  country: row['Address 2 - Country'] || ''
                },
                labels: row['Labels'] ? row['Labels'].split(';') : [],
                emailSubscriberStatus: row['Email subscriber status'] || '',
                smsSubscriberStatus: row['SMS subscriber status'] || '',
                source: row['Source'] || '',
                language: row['Language'] || ''
              }
            };

            const user = new User(userData);
            await user.save();
            results.successful++;
            resolve();
          } catch (error) {
            results.failed++;
            results.errors.push(`Row ${results.total}: ${error.message}`);
            resolve();
          }
        });
      };

      // Process CSV file
      const rows = [];
      await new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', (row) => rows.push(row))
          .on('end', resolve)
          .on('error', reject);
      });

      // Process rows sequentially to avoid database conflicts
      for (const row of rows) {
        await processRow(row);
      }

      // Delete the uploaded CSV file after processing
      fs.unlinkSync(req.file.path);

      res.json({
        success: true,
        message: 'CSV import completed',
        batchId,
        batchName,
        results
      });

    } catch (error) {
      console.error('CSV import error:', error);
      
      // Delete the uploaded file if there was an error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(500).json({
        success: false,
        message: 'Error importing CSV file',
        error: error.message
      });
    }
  }
];

// Get batch statistics
exports.getBatchStats = async (req, res) => {
  try {
    const batchStats = await User.aggregate([
      {
        $group: {
          _id: '$batch',
          count: { $sum: 1 },
          lastImport: { $max: '$importDate' }
        }
      },
      {
        $sort: { lastImport: -1 }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const importedUsers = await User.countDocuments({ importSource: 'csv_import' });

    res.json({
      success: true,
      batchStats,
      totalUsers,
      importedUsers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching batch statistics',
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
      tradingSegment,
      firstName,
      lastName,
      phone2,
      discordId,
      profilePicture,
      batch
    } = req.body;
    
    const updateData = {
      'profile.phone': phone,
      'profile.birthday': birthday,
      'profile.tradingViewId': tradingViewId,
      'profile.tradingSegment': tradingSegment,
      'profile.firstName': firstName,
      'profile.lastName': lastName,
      'profile.phone2': phone2,
      'profile.discordId': discordId,
      'profile.profilePicture': profilePicture
    };

    // Add batch if provided
    if (batch) {
      updateData.batch = batch;
    }

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
        : 'http://localhost:5000';

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