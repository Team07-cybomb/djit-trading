const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files - Serve uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));
// Specific route for course content uploads
app.use("/api/admin/courses/content/uploads", express.static(path.join(__dirname, "uploads")));

// Load models first (important!)
require("./models/User");
require("./models/Admin");
require("./models/Course");
require("./models/CourseContent");

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/enrollments", require("./routes/enrollmentRoutes"));
app.use("/api/videos", require("./routes/videoRoutes"));
app.use("/api/coupons", require("./routes/couponRoutes"));
app.use("/api/newsletter", require("./routes/newsletterRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/admin/auth", require("./routes/adminAuthRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// Admin course routes - ONLY ONCE!
app.use("/api/admin/courses", require("./routes/adminCourseRoutes"));
// REMOVE THIS DUPLICATE LINE: app.use("/api/admin/courses", require("./routes/courseContent"));

// Course content routes (this includes all course content functionality)
app.use("/api/admin/courses", require("./routes/courseContent"));

// Error handling middleware
app.use(require("./middleware/errorHandler"));

// Handle undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});