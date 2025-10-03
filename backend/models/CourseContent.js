const mongoose = require('mongoose');

const courseContentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['video', 'pdf', 'quiz', 'assignment'],
    required: true
  },
  videoUrl: {
    type: String,
    default: ''
  },
  pdfUrl: {
    type: String,
    default: ''
  },
  duration: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    required: true,
    min: 1
  },
  isFree: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CourseContent', courseContentSchema);