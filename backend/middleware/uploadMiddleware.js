const multer = require('multer');
const path = require('path');
const fs = require('fs');

console.log('=== DEBUG: Upload Middleware Loading ===');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads/videos',
    'uploads/documents',
    'uploads/thumbnails',
    'uploads/others'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      console.log(`✅ Created directory: ${fullPath}`);
    }
  });
};

createUploadDirs();

// Configure storage with better organization
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    if (file.mimetype.startsWith('video/')) {
      uploadPath += 'videos/';
    } else if (file.mimetype === 'application/pdf' || 
               file.mimetype.includes('document') ||
               file.mimetype.includes('presentation') ||
               file.mimetype === 'text/plain') {
      uploadPath += 'documents/';
    } else {
      uploadPath += 'others/';
    }
    
    // Create full path
    const fullPath = path.join(__dirname, '..', uploadPath);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    console.log(`📁 Uploading file to: ${fullPath}`);
    cb(null, fullPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original name preservation
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = name.replace(/[^a-zA-Z0-9]/g, '_') + '-' + uniqueSuffix + ext;
    console.log(`📄 Generated filename: ${filename}`);
    cb(null, filename);
  }
});

// Enhanced file filter
const fileFilter = (req, file, cb) => {
  console.log(`🔍 Checking file: ${file.originalname}, type: ${file.mimetype}, size: ${file.size} bytes`);
  
  // Allow videos
  if (file.mimetype.startsWith('video/')) {
    if (file.size > 500 * 1024 * 1024) {
      console.log('❌ Video file too large');
      return cb(new Error('Video file too large. Maximum size is 500MB.'), false);
    }
    console.log('✅ Video file accepted');
    cb(null, true);
  }
  // Allow documents
  else if (
    file.mimetype === 'application/pdf' ||
    file.mimetype === 'application/msword' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'application/vnd.ms-powerpoint' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    file.mimetype === 'text/plain'
  ) {
    if (file.size > 50 * 1024 * 1024) {
      console.log('❌ Document file too large');
      return cb(new Error('Document file too large. Maximum size is 50MB.'), false);
    }
    console.log('✅ Document file accepted');
    cb(null, true);
  } else {
    console.log('❌ Unsupported file type:', file.mimetype);
    cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload video or document files.`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max file size
  }
});

// Specific upload configurations
const uploadContentFiles = upload.fields([
  { name: 'videoFile', maxCount: 1 },
  { name: 'documentFile', maxCount: 1 }
]);

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('❌ Multer Error:', err.code, err.message);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        message: 'File too large. Please check file size limits.'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files uploaded.'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field.'
      });
    }
  }
  
  if (err) {
    console.error('❌ Upload Error:', err.message);
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  next();
};

console.log('=== DEBUG: Upload Middleware Loaded ===');

module.exports = {
  uploadContentFiles,
  handleUploadError
};