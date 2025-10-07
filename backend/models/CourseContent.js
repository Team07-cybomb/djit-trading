const mongoose = require('mongoose');

const courseContentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Content title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    default: '',
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  type: {
    type: String,
    enum: {
      values: ['video', 'pdf', 'document', 'quiz', 'assignment'],
      message: 'Content type must be video, pdf, document, quiz, or assignment'
    },
    required: [true, 'Content type is required']
  },
  // File upload fields
  videoFile: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String,
    url: String
  },
  documentFile: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String,
    url: String
  },
  // Keep URL fields for external content
  videoUrl: {
    type: String,
    default: ''
  },
  documentUrl: {
    type: String,
    default: ''
  },
  duration: {
    type: String,
    default: '',
    maxlength: [50, 'Duration cannot be more than 50 characters']
  },
  order: {
    type: Number,
    required: [true, 'Order is required'],
    min: [1, 'Order must be at least 1']
  },
  isFree: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for better query performance
courseContentSchema.index({ course: 1, order: 1 });
courseContentSchema.index({ course: 1, status: 1 });

// Pre-save middleware to validate media based on type
courseContentSchema.pre('save', function(next) {
  if (this.type === 'video' && !this.videoUrl && !this.videoFile) {
    return next(new Error('Video content must have either a video URL or video file'));
  }
  
  if ((this.type === 'document' || this.type === 'pdf') && !this.documentUrl && !this.documentFile) {
    return next(new Error('Document content must have either a document URL or document file'));
  }
  
  next();
});

// Create and export the model
const CourseContent = mongoose.model('CourseContent', courseContentSchema);

module.exports = CourseContent;