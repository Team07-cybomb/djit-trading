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
    address2: {
      type: String,
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    tradingViewId: String,
    vishcardId: String,
    tradingSegment: {
      type: String,
      enum: ['Stock', 'Options', 'Forex', '']
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
    language: String
  },
  isVerified: {
    type: Boolean,
    default: false
  }
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