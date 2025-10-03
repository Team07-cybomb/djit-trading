import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Badge } from 'react-bootstrap'
import axios from 'axios'
import './AdminDashboard.css'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentEnrollments, setRecentEnrollments] = useState([])
  const [loading, setLoading] = useState(true)

  const getAuthToken = () => {
    return localStorage.getItem('adminToken') || localStorage.getItem('token')
  }
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = getAuthToken()
      const response = await axios.get('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      setStats(response.data.stats)
      setRecentEnrollments(response.data.stats.recentEnrollments)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Handle 403 specifically
      if (error.response?.status === 403) {
        console.log('Access denied - check admin permissions')
        // Redirect to login or show error message
      }
    } finally {
      setLoading(false)
    }
  }
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Admin Dashboard</h2>
        <div className="text-muted">Welcome to your admin panel</div>
      </div>

      {/* Stats Grid */}
      <Row className="stats-grid mb-4">
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-number">{stats?.totalUsers || 0}</div>
              <div className="stat-label">Total Users</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-number">{stats?.totalCourses || 0}</div>
              <div className="stat-label">Total Courses</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-number">{stats?.totalEnrollments || 0}</div>
              <div className="stat-label">Total Enrollments</div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="stat-card">
            <Card.Body>
              <div className="stat-number">₹{stats?.totalRevenue || 0}</div>
              <div className="stat-label">Total Revenue</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="admin-card">
            <Card.Header>
              <h5 className="mb-0">Recent Enrollments</h5>
            </Card.Header>
            <Card.Body>
              {recentEnrollments.length > 0 ? (
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Course</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEnrollments.map((enrollment) => (
                        <tr key={enrollment._id}>
                          <td>
                            <div>
                              <strong>{enrollment.user?.username}</strong>
                              <br />
                              <small className="text-muted">{enrollment.user?.email}</small>
                            </div>
                          </td>
                          <td>{enrollment.course?.title}</td>
                          <td>{new Date(enrollment.enrollmentDate).toLocaleDateString()}</td>
                          <td>
                            <Badge 
                              bg={
                                enrollment.paymentStatus === 'completed' ? 'success' :
                                enrollment.paymentStatus === 'pending' ? 'warning' : 'danger'
                              }
                            >
                              {enrollment.paymentStatus}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No recent enrollments</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="admin-card">
            <Card.Header>
              <h5 className="mb-0">Popular Courses</h5>
            </Card.Header>
            <Card.Body>
              {stats?.popularCourses?.length > 0 ? (
                <div>
                  {stats.popularCourses.map((course, index) => (
                    <div key={course._id} className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                      <div>
                        <h6 className="mb-1">{course.course.title}</h6>
                        <small className="text-muted">{course.enrollments} enrollments</small>
                      </div>
                      <Badge bg="primary">#{index + 1}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No course data available</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default AdminDashboard