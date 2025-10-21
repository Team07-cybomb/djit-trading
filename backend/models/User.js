const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    phone2: String,
    birthday: Date,
    profilePicture: {
      url: String,
      filename: String
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    // FIX: Change address2 from String to Object
    address2: {
      type: {
        type: String,
        default: ''
      },
      street: {
        type: String,
        default: ''
      },
      city: {
        type: String,
        default: ''
      },
      state: {
        type: String,
        default: ''
      },
      zipCode: {
        type: String,
        default: ''
      },
      country: {
        type: String,
        default: ''
      }
    },
    address3: {
      street: String
    },
    tradingViewId: String,
    tradingSegment: {
      type: String,
      enum: ['Stock', 'Options', 'Forex', ''],
      default: ''
    },
    badge: {
      type: String,
      default: 'Beginner'
    },
    discordId: String,
    labels: [String],
    emailSubscriberStatus: String,
    smsSubscriberStatus: String,
    source: String,
    language: String,
    lastActivity: String,
    lastActivityDate: Date,
    createdAtUTC: Date
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  batch: {
    type: String,
    default: 'default'
  },
  importSource: {
    type: String,
    enum: ['manual', 'csv_import'],
    default: 'manual'
  },
  importBatchId: String,
  importDate: Date
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);