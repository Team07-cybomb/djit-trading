const Course = require('../models/Course');

// Get all courses
exports.getCourses = async (req, res) => {
  try {
    const { category, level, featured } = req.query;
    let filter = { status: 'active' };

    if (category) filter.category = category;
    if (level) filter.level = level;
    if (featured) filter.featured = featured === 'true';

    const courses = await Course.find(filter).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching courses',
      error: error.message
    });
  }
};

// Get single course
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        message: 'Course not found'
      });
    }
    res.json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching course',
      error: error.message
    });
  }
};

// Create course (admin only)
exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating course',
      error: error.message
    });
  }
};

// Update course (admin only)
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!course) {
      return res.status(404).json({
        message: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      course
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating course',
      error: error.message
    });
  }
};

// Delete course (admin only)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    
    if (!course) {
      return res.status(404).json({
        message: 'Course not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Course deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting course',
      error: error.message
    });
  }
};