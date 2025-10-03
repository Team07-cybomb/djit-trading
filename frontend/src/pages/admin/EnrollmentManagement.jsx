import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Badge, Form, InputGroup, Alert } from 'react-bootstrap'
import axios from 'axios'

const EnrollmentManagement = () => {
  const [enrollments, setEnrollments] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    course: '',
    page: 1
  })
  const [totalPages, setTotalPages] = useState(1)
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
    fetchEnrollments()
    fetchCourses()
  }, [filters])

  const fetchEnrollments = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      if (filters.status) queryParams.append('status', filters.status)
      if (filters.course) queryParams.append('course', filters.course)
      if (filters.page) queryParams.append('page', filters.page)

      const response = await api.get(`/admin/enrollments?${queryParams}`)
      setEnrollments(response.data.enrollments || [])
      setTotalPages(response.data.totalPages || 1)
    } catch (error) {
      console.error('Error fetching enrollments:', error)
      if (error.response?.status === 403) {
        showAlert('Access denied. Admin privileges required.', 'danger')
      } else if (error.response?.status === 401) {
        showAlert('Please login again.', 'danger')
      } else {
        showAlert('Error fetching enrollments', 'danger')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses')
      setCourses(response.data.courses || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
    }
  }

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const updateEnrollmentStatus = async (enrollmentId, updates) => {
    try {
      await api.put(`/admin/enrollments/${enrollmentId}`, updates)
      showAlert('Enrollment updated successfully', 'success')
      fetchEnrollments()
    } catch (error) {
      console.error('Error updating enrollment:', error)
      if (error.response?.status === 403) {
        showAlert('You do not have permission to update enrollments', 'danger')
      } else {
        showAlert('Error updating enrollment', 'danger')
      }
    }
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'success'
      case 'pending': return 'warning'
      case 'failed': return 'danger'
      case 'refunded': return 'secondary'
      default: return 'primary'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const calculateProgressColor = (progress) => {
    if (progress >= 80) return 'success'
    if (progress >= 50) return 'warning'
    return 'danger'
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Enrollment Management</h2>
        <div className="text-muted">Total Enrollments: {enrollments.length}</div>
      </div>

      {alert.show && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false, message: '', type: '' })}>
          {alert.message}
        </Alert>
      )}

      {/* Filters */}
      <Card className="admin-card mb-4">
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Payment Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-4">
              <Form.Group>
                <Form.Label>Course</Form.Label>
                <Form.Select
                  value={filters.course}
                  onChange={(e) => handleFilterChange('course', e.target.value)}
                >
                  <option value="">All Courses</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-4 d-flex align-items-end">
              <Button
                variant="outline-secondary"
                onClick={() => setFilters({ status: '', course: '', page: 1 })}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="admin-card">
        <Card.Header>
          <h5 className="mb-0">All Enrollments</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : enrollments.length > 0 ? (
            <>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Course</th>
                      <th>Enrollment Date</th>
                      <th>Amount Paid</th>
                      <th>Progress</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment._id}>
                        <td>
                          <div>
                            <strong>{enrollment.user?.username}</strong>
                            <br />
                            <small className="text-muted">{enrollment.user?.email}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{enrollment.course?.title}</strong>
                            <br />
                            <small className="text-muted">
                              {formatCurrency(enrollment.course?.price)}
                            </small>
                          </div>
                        </td>
                        <td>{formatDate(enrollment.enrollmentDate)}</td>
                        <td>
                          <strong>{formatCurrency(enrollment.amountPaid)}</strong>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="progress flex-grow-1 me-2" style={{ height: '8px' }}>
                              <div
                                className={`progress-bar bg-${calculateProgressColor(enrollment.progress)}`}
                                style={{ width: `${enrollment.progress}%` }}
                              ></div>
                            </div>
                            <small>{enrollment.progress}%</small>
                          </div>
                          <div>
                            <small className="text-muted">
                              {enrollment.completed ? 'Completed' : 'In Progress'}
                            </small>
                          </div>
                        </td>
                        <td>
                          <Badge bg={getStatusVariant(enrollment.paymentStatus)}>
                            {enrollment.paymentStatus}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline-success"
                              onClick={() => updateEnrollmentStatus(enrollment._id, {
                                progress: 100,
                                completed: true,
                                paymentStatus: 'completed'
                              })}
                              disabled={enrollment.completed}
                            >
                              Mark Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-warning"
                              onClick={() => updateEnrollmentStatus(enrollment._id, {
                                paymentStatus: 'pending'
                              })}
                            >
                              Set Pending
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <nav>
                    <ul className="pagination">
                      <li className={`page-item ${filters.page === 1 ? 'disabled' : ''}`}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleFilterChange('page', filters.page - 1)}
                          disabled={filters.page === 1}
                        >
                          Previous
                        </Button>
                      </li>
                      {[...Array(totalPages)].map((_, index) => (
                        <li key={index + 1} className={`page-item ${filters.page === index + 1 ? 'active' : ''}`}>
                          <Button
                            variant={filters.page === index + 1 ? 'primary' : 'outline-primary'}
                            size="sm"
                            onClick={() => handleFilterChange('page', index + 1)}
                          >
                            {index + 1}
                          </Button>
                        </li>
                      ))}
                      <li className={`page-item ${filters.page === totalPages ? 'disabled' : ''}`}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handleFilterChange('page', filters.page + 1)}
                          disabled={filters.page === totalPages}
                        >
                          Next
                        </Button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No enrollments found</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}

export default EnrollmentManagement