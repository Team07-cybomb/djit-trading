const multer = require("multer");
const path = require("path");
const fs = require("fs");


// Ensure uploads folder exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  const videoTypes = ["video/mp4", "video/avi", "video/mov", "video/mkv"];
  const documentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
  ];

  if (file.fieldname === "videoFile" && videoTypes.includes(file.mimetype)) cb(null, true);
  else if (file.fieldname === "documentFile" && documentTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error("Unsupported file type for " + file.fieldname), false);
};

// Multer limits (separate for video/document)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 * 1024 }, // 500MB max for videos
});

module.exports = upload;
