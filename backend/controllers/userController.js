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

// Helper function to parse date
const parseDate = (dateString) => {
  if (!dateString) return null;
  
  // Handle various date formats
  const formats = [
    'YYYY-MM-DD',
    'DD/MM/YYYY', 
    'MM/DD/YYYY',
    'YYYY/MM/DD'
  ];
  
  for (let format of formats) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return null;
};

// Helper function to clean phone number
const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  // Remove all non-digit characters except +
  return phone.toString().replace(/[^\d+]/g, '');
};

// Helper function to generate username from email
const generateUsername = (email) => {
  if (!email) return `user_${Date.now()}`;
  const baseUsername = email.toLowerCase().split('@')[0];
  // Remove special characters from username
  return baseUsername.replace(/[^a-zA-Z0-9]/g, '');
};

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

    if (batch) {
      query.batch = batch;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);
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

// Import users from CSV - FIXED VERSION
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
            const email = row['Email 1'] || row['Email 2'];
            if (!email) {
              results.failed++;
              results.errors.push(`Row ${results.total}: No email provided`);
              return resolve();
            }

            // Check if user already exists
            const existingUser = await User.findOne({ 
              email: email.toLowerCase().trim()
            });

            if (existingUser) {
              results.failed++;
              results.errors.push(`Row ${results.total}: User with email ${email} already exists`);
              return resolve();
            }

            // Generate username
            const username = generateUsername(email);
            
            // Generate a random password
            const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            
            // Parse dates
            const birthday = parseDate(row['Birthdate']);
            const createdAtUTC = parseDate(row['Created At (UTC+0)']);
            const lastActivityDate = parseDate(row['Last Activity Date (UTC+0)']);

            // Clean phone numbers
            const phone1 = cleanPhoneNumber(row['Phone 1']);
            const phone2 = cleanPhoneNumber(row['Phone 2']);

            // Parse labels
            const labels = row['Labels'] ? 
              row['Labels'].split(';').map(label => label.trim()).filter(label => label) : 
              [];

            // Create user data with ALL fields from CSV
            const userData = {
              username: username,
              email: email.toLowerCase().trim(),
              password: tempPassword,
              batch: batchName,
              importSource: 'csv_import',
              importBatchId: batchId,
              importDate: new Date(),
              profile: {
                firstName: (row['First Name'] || '').trim(),
                lastName: (row['Last Name'] || '').trim(),
                phone: phone1,
                phone2: phone2,
                birthday: birthday,
                discordId: (row['discord id'] || '').trim(),
                tradingViewId: (row['Tradingview ID'] || '').trim(),
                
                // Primary Address
                address: {
                  street: (row['Address 1 - Street'] || '').trim(),
                  city: '',
                  state: '',
                  zipCode: '',
                  country: ''
                },
                
                // Secondary Address
                address2: {
                  type: (row['Address 2 - Type'] || '').trim(),
                  street: (row['Address 2 - Street'] || '').trim(),
                  city: (row['Address 2 - City'] || '').trim(),
                  state: (row['Address 2 - State/Region'] || '').trim(),
                  zipCode: (row['Address 2 - Zip'] || '').trim(),
                  country: (row['Address 2 - Country'] || '').trim()
                },
                
                // Tertiary Address
                address3: {
                  street: (row['Address 3 - Street'] || '').trim()
                },
                
                labels: labels,
                emailSubscriberStatus: (row['Email subscriber status'] || '').trim(),
                smsSubscriberStatus: (row['SMS subscriber status'] || '').trim(),
                source: (row['Source'] || '').trim(),
                language: (row['Language'] || '').trim(),
                lastActivity: (row['Last Activity'] || '').trim(),
                lastActivityDate: lastActivityDate,
                createdAtUTC: createdAtUTC
              }
            };

            // If Address 1 has data but Address 2 doesn't, move Address 1 data to address field
            if (row['Address 1 - Street'] && !row['Address 2 - Street']) {
              userData.profile.address = {
                street: (row['Address 1 - Street'] || '').trim(),
                city: (row['Address 2 - City'] || '').trim(),
                state: (row['Address 2 - State/Region'] || '').trim(),
                zipCode: (row['Address 2 - Zip'] || '').trim(),
                country: (row['Address 2 - Country'] || '').trim()
              };
            }

            const user = new User(userData);
            await user.save();
            results.successful++;
            resolve();
          } catch (error) {
            results.failed++;
            results.errors.push(`Row ${results.total}: ${error.message}`);
            console.error('Error processing row:', error);
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

      // Process rows sequentially
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
        $sort: { count: -1 }
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
      address2,
      address3,
      tradingViewId, 
      tradingSegment,
      firstName,
      lastName,
      phone2,
      discordId,
      profilePicture,
      batch,
      emailSubscriberStatus,
      smsSubscriberStatus,
      source,
      language,
      lastActivity,
      lastActivityDate,
      labels
    } = req.body;
    
    const updateData = {
      'profile.phone': phone,
      'profile.birthday': birthday ? parseDate(birthday) : undefined,
      'profile.tradingViewId': tradingViewId,
      'profile.tradingSegment': tradingSegment,
      'profile.firstName': firstName,
      'profile.lastName': lastName,
      'profile.phone2': phone2,
      'profile.discordId': discordId,
      'profile.profilePicture': profilePicture,
      'profile.emailSubscriberStatus': emailSubscriberStatus,
      'profile.smsSubscriberStatus': smsSubscriberStatus,
      'profile.source': source,
      'profile.language': language,
      'profile.lastActivity': lastActivity,
      'profile.lastActivityDate': lastActivityDate ? parseDate(lastActivityDate) : undefined,
      'profile.labels': labels
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

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

    if (address2) {
      updateData['profile.address2.type'] = address2.type;
      updateData['profile.address2.street'] = address2.street;
      updateData['profile.address2.city'] = address2.city;
      updateData['profile.address2.state'] = address2.state;
      updateData['profile.address2.zipCode'] = address2.zipCode;
      updateData['profile.address2.country'] = address2.country;
    }

    if (address3) {
      updateData['profile.address3.street'] = address3.street;
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

      const baseUrl = process.env.NODE_ENV === 'production' 
        ? `${req.protocol}://${req.get('host')}`
        : 'http://localhost:5000';

      const profilePicture = {
        url: `${baseUrl}/uploads/profile-pictures/${req.file.filename}`,
        filename: req.file.filename
      };

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

// Get user details for admin
exports.getUserDetails = async (req, res) => {
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
      message: 'Error fetching user details',
      error: error.message
    });
  }
};

// Update user role (admin only)
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating user role',
      error: error.message
    });
  }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting user',
      error: error.message
    });
  }
};