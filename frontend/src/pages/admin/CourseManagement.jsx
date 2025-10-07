import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Table, Badge, Alert } from 'react-bootstrap'
import axios from 'axios'
import CourseModal from './CourseModal'
import CourseContentModal from './CourseContentModal'

const CourseManagement = () => {
  const [courses, setCourses] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showContentModal, setShowContentModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState({ show: false, message: '', type: '' })

  // Get authentication token
  const getAuthToken = () => {
    return localStorage.getItem('adminToken') || localStorage.getItem('token')
  }

  // Create axios instance with auth header
  const api = axios.create({
    baseURL: '/api'
  })

  // Add request interceptor to include auth token
  api.interceptors.request.use(
    (config) => {
      const token = getAuthToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await api.get('/admin/courses')
      setCourses(response.data.courses || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      if (error.response?.status === 403) {
        showAlert('Access denied. Admin privileges required.', 'danger')
      } else if (error.response?.status === 401) {
        showAlert('Please login again.', 'danger')
      } else {
        showAlert('Error fetching courses', 'danger')
      }
    } finally {
      setLoading(false)
    }
  }

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000)
  }

  const handleShowModal = (course = null) => {
    setEditingCourse(course)
    setShowModal(true)
  }

  const handleShowContentModal = (course) => {
    setSelectedCourse(course)
    setShowContentModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCourse(null)
  }

  const handleCloseContentModal = () => {
    setShowContentModal(false)
    setSelectedCourse(null)
  }

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await api.delete(`/admin/courses/${courseId}`)
        showAlert('Course deleted successfully', 'success')
        fetchCourses()
      } catch (error) {
        console.error('Error deleting course:', error)
        if (error.response?.status === 403) {
          showAlert('You do not have permission to delete courses', 'danger')
        } else {
          showAlert('Error deleting course', 'danger')
        }
      }
    }
  }

  const getLevelVariant = (level) => {
    switch (level) {
      case 'Beginner': return 'success'
      case 'Intermediate': return 'warning'
      case 'Advanced': return 'danger'
      default: return 'secondary'
    }
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Course Management</h2>
        <Button onClick={() => handleShowModal()} className="btn-admin-primary">
          + Add New Course
        </Button>
      </div>

      {alert.show && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false, message: '', type: '' })}>
          {alert.message}
        </Alert>
      )}

      <Card className="admin-card">
        <Card.Header>
          <h5 className="mb-0">All Courses</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : courses.length > 0 ? (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Instructor</th>
                    <th>Price</th>
                    <th>Level</th>
                    <th>Students</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course._id}>
                      <td>
                        <div>
                          <strong>{course.title}</strong>
                          <br />
                          <small className="text-muted">{course.category}</small>
                          {course.featured && (
                            <Badge bg="primary" className="ms-2">Featured</Badge>
                          )}
                        </div>
                      </td>
                      <td>{course.instructor}</td>
                      <td>
                        <div>
                          <strong>₹{course.discountedPrice || course.price}</strong>
                          {course.discountedPrice && (
                            <small className="text-muted text-decoration-line-through ms-1">
                              ₹{course.price}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <Badge bg={getLevelVariant(course.level)}>
                          {course.level}
                        </Badge>
                      </td>
                      <td>{course.studentsEnrolled || 0}</td>
                      <td>
                        <Badge bg={course.status === 'active' ? 'success' : 'secondary'}>
                          {course.status || 'active'}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            onClick={() => handleShowModal(course)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-info"
                            onClick={() => handleShowContentModal(course)}
                          >
                            Content
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleDelete(course._id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No courses found</p>
              <Button onClick={() => handleShowModal()} className="btn-admin-primary">
                Create Your First Course
              </Button>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Course Modals */}
      <CourseModal
        show={showModal}
        onHide={handleCloseModal}
        editingCourse={editingCourse}
        onCourseSaved={() => {
          handleCloseModal()
          fetchCourses()
        }}
        showAlert={showAlert}
      />

      <CourseContentModal
        show={showContentModal}
        onHide={handleCloseContentModal}
        selectedCourse={selectedCourse}
        showAlert={showAlert}
      />
    </div>
  )
}

export default CourseManagement