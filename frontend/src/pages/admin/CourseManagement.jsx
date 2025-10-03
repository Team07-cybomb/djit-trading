import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Table, Badge, Form, Modal, Alert, Tabs, Tab } from 'react-bootstrap'
import axios from 'axios'

const CourseManagement = () => {
  const [courses, setCourses] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [showContentModal, setShowContentModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState({ show: false, message: '', type: '' })
  const [contentLoading, setContentLoading] = useState(false)
  const [courseContent, setCourseContent] = useState([])

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructor: '',
    price: '',
    discountedPrice: '',
    category: '',
    level: 'Beginner',
    duration: '',
    lessons: '',
    thumbnail: '',
    featured: false
  })

  const [contentFormData, setContentFormData] = useState({
    title: '',
    description: '',
    type: 'video',
    videoUrl: '',
    pdfUrl: '',
    duration: '',
    order: 0,
    isFree: false
  })

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

  const fetchCourseContent = async (courseId) => {
    try {
      setContentLoading(true)
      const response = await api.get(`/admin/courses/${courseId}/content`)
      setCourseContent(response.data.content || [])
    } catch (error) {
      console.error('Error fetching course content:', error)
      showAlert('Error fetching course content', 'danger')
    } finally {
      setContentLoading(false)
    }
  }

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000)
  }

  const handleShowModal = (course = null) => {
    if (course) {
      setEditingCourse(course)
      setFormData({
        title: course.title || '',
        description: course.description || '',
        instructor: course.instructor || '',
        price: course.price || '',
        discountedPrice: course.discountedPrice || '',
        category: course.category || '',
        level: course.level || 'Beginner',
        duration: course.duration || '',
        lessons: course.lessons || '',
        thumbnail: course.thumbnail || '',
        featured: course.featured || false
      })
    } else {
      setEditingCourse(null)
      setFormData({
        title: '',
        description: '',
        instructor: '',
        price: '',
        discountedPrice: '',
        category: '',
        level: 'Beginner',
        duration: '',
        lessons: '',
        thumbnail: '',
        featured: false
      })
    }
    setShowModal(true)
  }

  const handleShowContentModal = (course) => {
    setSelectedCourse(course)
    setContentFormData({
      title: '',
      description: '',
      type: 'video',
      videoUrl: '',
      pdfUrl: '',
      duration: '',
      order: courseContent.length + 1,
      isFree: false
    })
    fetchCourseContent(course._id)
    setShowContentModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingCourse(null)
  }

  const handleCloseContentModal = () => {
    setShowContentModal(false)
    setSelectedCourse(null)
    setCourseContent([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        discountedPrice: formData.discountedPrice ? parseFloat(formData.discountedPrice) : null,
        lessons: formData.lessons ? parseInt(formData.lessons) : 0,
        status: 'active'
      }

      if (editingCourse) {
        await api.put(`/admin/courses/${editingCourse._id}`, submitData)
        showAlert('Course updated successfully', 'success')
      } else {
        await api.post('/admin/courses', submitData)
        showAlert('Course created successfully', 'success')
      }

      handleCloseModal()
      fetchCourses()
    } catch (error) {
      console.error('Error saving course:', error)
      if (error.response?.status === 403) {
        showAlert('You do not have permission to manage courses', 'danger')
      } else if (error.response?.status === 401) {
        showAlert('Please login again', 'danger')
      } else {
        showAlert(error.response?.data?.message || 'Error saving course', 'danger')
      }
    }
  }

  const handleContentSubmit = async (e) => {
    e.preventDefault()
    if (!selectedCourse) return

    try {
      await api.post(`/admin/courses/${selectedCourse._id}/content`, contentFormData)
      showAlert('Content added successfully', 'success')
      setContentFormData({
        title: '',
        description: '',
        type: 'video',
        videoUrl: '',
        pdfUrl: '',
        duration: '',
        order: courseContent.length + 1,
        isFree: false
      })
      fetchCourseContent(selectedCourse._id)
    } catch (error) {
      console.error('Error adding content:', error)
      showAlert('Error adding content', 'danger')
    }
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

  const handleDeleteContent = async (contentId) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      try {
        await api.delete(`/admin/courses/${selectedCourse._id}/content/${contentId}`)
        showAlert('Content deleted successfully', 'success')
        fetchCourseContent(selectedCourse._id)
      } catch (error) {
        console.error('Error deleting content:', error)
        showAlert('Error deleting content', 'danger')
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

  const getContentTypeVariant = (type) => {
    switch (type) {
      case 'video': return 'primary'
      case 'pdf': return 'info'
      case 'quiz': return 'warning'
      case 'assignment': return 'success'
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

      {/* Add/Edit Course Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingCourse ? 'Edit Course' : 'Add New Course'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Course Title *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Instructor *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Form.Group>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Level *</Form.Label>
                  <Form.Select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Duration</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., 8 weeks"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Price (₹) *</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Discounted Price (₹)</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.discountedPrice}
                    onChange={(e) => setFormData({ ...formData, discountedPrice: e.target.value })}
                    min="0"
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Number of Lessons</Form.Label>
                  <Form.Control
                    type="number"
                    value={formData.lessons}
                    onChange={(e) => setFormData({ ...formData, lessons: e.target.value })}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Thumbnail URL</Form.Label>
              <Form.Control
                type="url"
                value={formData.thumbnail}
                onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </Form.Group>

            <Form.Check
              type="checkbox"
              label="Featured Course"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" className="btn-admin-primary">
              {editingCourse ? 'Update Course' : 'Create Course'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Course Content Management Modal */}
      <Modal show={showContentModal} onHide={handleCloseContentModal} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            Manage Content - {selectedCourse?.title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs defaultActiveKey="content" className="mb-3">
            <Tab eventKey="content" title="Course Content">
              <Row>
                <Col md={6}>
                  <Card>
                    <Card.Header>
                      <h6 className="mb-0">Add New Content</h6>
                    </Card.Header>
                    <Card.Body>
                      <Form onSubmit={handleContentSubmit}>
                        <Form.Group className="mb-3">
                          <Form.Label>Content Title *</Form.Label>
                          <Form.Control
                            type="text"
                            value={contentFormData.title}
                            onChange={(e) => setContentFormData({ ...contentFormData, title: e.target.value })}
                            required
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Description</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={2}
                            value={contentFormData.description}
                            onChange={(e) => setContentFormData({ ...contentFormData, description: e.target.value })}
                          />
                        </Form.Group>

                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Content Type *</Form.Label>
                              <Form.Select
                                value={contentFormData.type}
                                onChange={(e) => setContentFormData({ ...contentFormData, type: e.target.value })}
                              >
                                <option value="video">Video</option>
                                <option value="pdf">PDF Document</option>
                                <option value="quiz">Quiz</option>
                                <option value="assignment">Assignment</option>
                              </Form.Select>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Order *</Form.Label>
                              <Form.Control
                                type="number"
                                value={contentFormData.order}
                                onChange={(e) => setContentFormData({ ...contentFormData, order: parseInt(e.target.value) })}
                                min="1"
                                required
                              />
                            </Form.Group>
                          </Col>
                        </Row>

                        {contentFormData.type === 'video' && (
                          <Form.Group className="mb-3">
                            <Form.Label>Video URL *</Form.Label>
                            <Form.Control
                              type="url"
                              value={contentFormData.videoUrl}
                              onChange={(e) => setContentFormData({ ...contentFormData, videoUrl: e.target.value })}
                              placeholder="https://youtube.com/embed/..."
                              required
                            />
                            <Form.Text className="text-muted">
                              Use embedded URL for YouTube videos
                            </Form.Text>
                          </Form.Group>
                        )}

                        {contentFormData.type === 'pdf' && (
                          <Form.Group className="mb-3">
                            <Form.Label>PDF URL *</Form.Label>
                            <Form.Control
                              type="url"
                              value={contentFormData.pdfUrl}
                              onChange={(e) => setContentFormData({ ...contentFormData, pdfUrl: e.target.value })}
                              placeholder="https://example.com/document.pdf"
                              required
                            />
                          </Form.Group>
                        )}

                        <Form.Group className="mb-3">
                          <Form.Label>Duration</Form.Label>
                          <Form.Control
                            type="text"
                            value={contentFormData.duration}
                            onChange={(e) => setContentFormData({ ...contentFormData, duration: e.target.value })}
                            placeholder="e.g., 15 minutes"
                          />
                        </Form.Group>

                        <Form.Check
                          type="checkbox"
                          label="Free Preview (Available without enrollment)"
                          checked={contentFormData.isFree}
                          onChange={(e) => setContentFormData({ ...contentFormData, isFree: e.target.checked })}
                          className="mb-3"
                        />

                        <Button type="submit" variant="primary">
                          Add Content
                        </Button>
                      </Form>
                    </Card.Body>
                  </Card>
                </Col>

                <Col md={6}>
                  <Card>
                    <Card.Header>
                      <h6 className="mb-0">Course Content ({courseContent.length})</h6>
                    </Card.Header>
                    <Card.Body>
                      {contentLoading ? (
                        <div className="text-center py-3">
                          <div className="spinner-border spinner-border-sm" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </div>
                      ) : courseContent.length > 0 ? (
                        <div className="content-list">
                          {courseContent
                            .sort((a, b) => a.order - b.order)
                            .map((content) => (
                              <div key={content._id} className="content-item border-bottom pb-2 mb-2">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div>
                                    <h6 className="mb-1">{content.title}</h6>
                                    <Badge bg={getContentTypeVariant(content.type)} className="me-2">
                                      {content.type}
                                    </Badge>
                                    {content.isFree && (
                                      <Badge bg="success">Free Preview</Badge>
                                    )}
                                    <div className="text-muted small">
                                      Order: {content.order} | Duration: {content.duration}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline-danger"
                                    onClick={() => handleDeleteContent(content._id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-muted text-center">No content added yet</p>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseContentModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default CourseManagement