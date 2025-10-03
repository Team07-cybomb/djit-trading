import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Badge, Button } from 'react-bootstrap'
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
      setRecentEnrollments(response.data.stats.recentEnrollments || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      if (error.response?.status === 403) {
        console.log('Access denied - check admin permissions')
      }
    } finally {
      setLoading(false)
    }
  }

  const refreshData = () => {
    setLoading(true)
    fetchDashboardData()
  }

  if (loading) {
    return (
      <div className="dashboard-loading text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3 text-muted">Loading dashboard data...</p>
      </div>
    )
  }

  const getStatusVariant = (status) => {
    switch (status) {
      case 'completed': return 'success'
      case 'pending': return 'warning'
      case 'failed': return 'danger'
      default: return 'secondary'
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="admin-dashboard">
      {/* Header Section */}
      <div className="dashboard-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h2 className="dashboard-title">Dashboard Overview</h2>
            <p className="dashboard-subtitle text-muted">
              Welcome back! Here's what's happening with your platform today.
            </p>
          </div>
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={refreshData}
            className="refresh-btn"
          >
            <i className="fas fa-sync-alt me-2"></i>
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid - All 4 cards in one row */}
      <Row className="stats-grid mb-5">
        <Col xl={3} lg={3} md={6} sm={6} className="mb-4">
          <Card className="stat-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stat-icon-wrapper me-3">
                <i className="fas fa-users stat-icon users"></i>
              </div>
              <div className="flex-grow-1">
                <div className="stat-number">{stats?.totalUsers || 0}</div>
                <div className="stat-label">Total Users</div>
                <div className="stat-trend text-success">
                  <i className="fas fa-arrow-up me-1"></i>
                  Active users
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xl={3} lg={3} md={6} sm={6} className="mb-4">
          <Card className="stat-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stat-icon-wrapper me-3">
                <i className="fas fa-book stat-icon courses"></i>
              </div>
              <div className="flex-grow-1">
                <div className="stat-number">{stats?.totalCourses || 0}</div>
                <div className="stat-label">Total Courses</div>
                <div className="stat-trend text-info">
                  <i className="fas fa-chart-line me-1"></i>
                  Available courses
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xl={3} lg={3} md={6} sm={6} className="mb-4">
          <Card className="stat-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stat-icon-wrapper me-3">
                <i className="fas fa-graduation-cap stat-icon enrollments"></i>
              </div>
              <div className="flex-grow-1">
                <div className="stat-number">{stats?.totalEnrollments || 0}</div>
                <div className="stat-label">Total Enrollments</div>
                <div className="stat-trend text-warning">
                  <i className="fas fa-user-plus me-1"></i>
                  Student enrollments
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col xl={3} lg={3} md={6} sm={6} className="mb-4">
          <Card className="stat-card h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="stat-icon-wrapper me-3">
                <i className="fas fa-rupee-sign stat-icon revenue"></i>
              </div>
              <div className="flex-grow-1">
                <div className="stat-number">{formatCurrency(stats?.totalRevenue || 0)}</div>
                <div className="stat-label">Total Revenue</div>
                <div className="stat-trend text-success">
                  <i className="fas fa-wallet me-1"></i>
                  Total earnings
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Data Tables Section */}
      <Row>
        <Col lg={8} className="mb-4">
          <Card className="admin-card h-100">
            <Card.Header className="card-header-custom">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Enrollments</h5>
                <Badge bg="primary" className="enrollment-count">
                  {recentEnrollments.length} Total
                </Badge>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {recentEnrollments.length > 0 ? (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-header-custom">
                      <tr>
                        <th>User</th>
                        <th>Course</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEnrollments.map((enrollment) => (
                        <tr key={enrollment._id} className="table-row-custom">
                          <td>
                            <div className="user-info">
                              <div className="user-avatar-sm me-2">
                                {enrollment.user?.username?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong className="d-block">{enrollment.user?.username}</strong>
                                <small className="text-muted">{enrollment.user?.email}</small>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="course-title">{enrollment.course?.title}</span>
                          </td>
                          <td>
                            <div className="date-info">
                              {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                              <br />
                              <small className="text-muted">
                                {new Date(enrollment.enrollmentDate).toLocaleTimeString()}
                              </small>
                            </div>
                          </td>
                          <td>
                            <span className="amount">
                              {enrollment.amount ? formatCurrency(enrollment.amount) : 'Free'}
                            </span>
                          </td>
                          <td>
                            <Badge 
                              bg={getStatusVariant(enrollment.paymentStatus)}
                              className="status-badge"
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
                <div className="text-center py-5 empty-state">
                  <i className="fas fa-graduation-cap fa-3x text-muted mb-3"></i>
                  <p className="text-muted">No recent enrollments</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="admin-card h-100">
            <Card.Header className="card-header-custom">
              <h5 className="mb-0">Popular Courses</h5>
            </Card.Header>
            <Card.Body>
              {stats?.popularCourses?.length > 0 ? (
                <div className="popular-courses-list">
                  {stats.popularCourses.map((course, index) => (
                    <div key={course._id || index} className="course-item d-flex align-items-center mb-3 pb-3 border-bottom">
                      <div className="course-rank me-3">
                        <div className={`rank-badge rank-${index + 1}`}>
                          #{index + 1}
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="course-name mb-1">{course.course?.title}</h6>
                        <div className="course-stats d-flex justify-content-between">
                          <small className="text-muted">
                            <i className="fas fa-users me-1"></i>
                            {course.enrollments} enrollments
                          </small>
                          {course.revenue && (
                            <small className="text-success fw-semibold">
                              {formatCurrency(course.revenue)}
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 empty-state">
                  <i className="fas fa-book fa-3x text-muted mb-3"></i>
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