import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Badge, Table, Form, Button, Spinner, Alert } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import styles from './Traders.module.css'

const Traders = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    phone: '',
    birthday: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    tradingViewId: '',
    vishcardId: '',
    tradingSegment: ''
  })

  // Get user ID from auth context
  const getUserId = () => {
    if (!user) return null
    return user.id || user._id || user.userId || user.userID
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError('')
        const token = localStorage.getItem('token')
        
        if (!token) {
          throw new Error('No authentication token found')
        }

        const config = {
          headers: { Authorization: `Bearer ${token}` }
        }

        // Try to get current user data without needing ID
        const [profileResponse, enrollmentsResponse] = await Promise.all([
          axios.get('/api/users/me', config).catch(() => 
            // Fallback: try with user ID if /me endpoint doesn't exist
            axios.get(`/api/users/${getUserId()}`, config)
          ),
          axios.get('/api/enrollments/my-courses', config).catch(() =>
            // Fallback: try with user ID if /my-courses endpoint doesn't exist
            axios.get(`/api/enrollments/user/${getUserId()}`, config)
          )
        ])

        setProfile(profileResponse.data.user || profileResponse.data)
        
        // Set form data if profile exists
        const userProfile = profileResponse.data.user || profileResponse.data
        if (userProfile.profile) {
          setFormData({
            phone: userProfile.profile.phone || '',
            birthday: userProfile.profile.birthday ? 
              new Date(userProfile.profile.birthday).toISOString().split('T')[0] : '',
            address: userProfile.profile.address || {
              street: '', city: '', state: '', zipCode: '', country: ''
            },
            tradingViewId: userProfile.profile.tradingViewId || '',
            vishcardId: userProfile.profile.vishcardId || '',
            tradingSegment: userProfile.profile.tradingSegment || ''
          })
        }

        // Process enrollments data
        const enrollmentsData = enrollmentsResponse.data.enrollments || enrollmentsResponse.data || []
        setEnrollments(enrollmentsData)

      } catch (error) {
        console.error('Error fetching user data:', error)
        const errorMessage = error.response?.data?.message || 
          error.message || 
          'Failed to load user data. Please try again.'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthenticated, user])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      await axios.put('/api/users/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Refetch data to update UI
      setLoading(true)
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const [profileResponse, enrollmentsResponse] = await Promise.all([
        axios.get('/api/users/me', config).catch(() => 
          axios.get(`/api/users/${getUserId()}`, config)
        ),
        axios.get('/api/enrollments/my-courses', config).catch(() =>
          axios.get(`/api/enrollments/user/${getUserId()}`, config)
        )
      ])

      setProfile(profileResponse.data.user || profileResponse.data)
      setEnrollments(enrollmentsResponse.data.enrollments || enrollmentsResponse.data || [])
      
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleContinueLearning = (courseId) => {
    if (!courseId) {
      alert('Course not found. Please try again.')
      return
    }
    navigate(`/learning/${courseId}`)
  }

  const handleStartLearning = (courseId) => {
    if (!courseId) {
      alert('Course not found. Please try again.')
      return
    }
    navigate(`/learning/${courseId}`)
  }

  const handleBrowseCourses = () => {
    navigate('/courses')
  }

  const getBadgeVariant = (badge) => {
    switch (badge) {
      case 'Beginner': return 'success'
      case 'Intermediate': return 'warning'
      case 'Advanced': return 'danger'
      case 'Pro': return 'primary'
      default: return 'secondary'
    }
  }

  const getProgressVariant = (progress) => {
    if (progress === 100) return 'success'
    if (progress >= 50) return 'primary'
    if (progress > 0) return 'warning'
    return 'secondary'
  }

  const getProgressText = (progress) => {
    if (progress === 0) return 'Not Started'
    if (progress === 100) return 'Completed'
    return `In Progress (${progress}%)`
  }

  const getCourseAction = (enrollment) => {
    if (enrollment.progress === 100) {
      return {
        variant: "outline-success",
        text: 'Review',
        handler: () => handleContinueLearning(enrollment.course?._id || enrollment.course)
      }
    } else if (enrollment.progress > 0) {
      return {
        variant: "primary",
        text: 'Continue',
        handler: () => handleContinueLearning(enrollment.course?._id || enrollment.course)
      }
    } else {
      return {
        variant: "primary",
        text: 'Start Learning',
        handler: () => handleStartLearning(enrollment.course?._id || enrollment.course)
      }
    }
  }

  if (loading) {
    return (
      <Container className={styles.tradersPage}>
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-3">Loading your profile...</p>
        </div>
      </Container>
    )
  }

  if (!isAuthenticated) {
    return (
      <Container className={styles.tradersPage}>
        <div className="text-center py-5">
          <h2>Please log in to view your trader profile</h2>
          <p className="mb-4">You need to be logged in to access this page.</p>
          <Button variant="primary" onClick={() => navigate('/login')}>
            Log In
          </Button>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container className={styles.tradersPage}>
        <Alert variant="danger" className="mt-4">
          <Alert.Heading>Error Loading Profile</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex gap-2">
            <Button variant="primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate('/courses')}>
              Browse Courses
            </Button>
          </div>
        </Alert>
      </Container>
    )
  }

  const inProgressEnrollments = enrollments.filter(
    enrollment => enrollment.progress > 0 && enrollment.progress < 100
  )

  const completedEnrollments = enrollments.filter(
    enrollment => enrollment.progress === 100 || enrollment.completed
  )

  return (
    <div className={styles.tradersPage}>
      <Container className="py-4">
        <Row>
          <Col lg={4} className="mb-4">
            {/* Profile Card */}
            <Card className="shadow-sm">
              <Card.Body className="text-center">
                <div className={`${styles.avatar} bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3`} 
                     style={{width: '80px', height: '80px', fontSize: '2rem'}}>
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <h4 className="mb-1">{user?.username || 'User'}</h4>
                <p className="text-muted mb-3">{user?.email || 'No email'}</p>
                
                {profile?.profile?.badge && (
                  <Badge 
                    bg={getBadgeVariant(profile.profile.badge)}
                    className="mb-3 fs-6"
                  >
                    {profile.profile.badge} Trader
                  </Badge>
                )}

                <div className="d-flex justify-content-around mt-4">
                  <div className="text-center">
                    <div className="fw-bold fs-4 text-primary">{enrollments.length}</div>
                    <div className="text-muted small">Courses</div>
                  </div>
                  <div className="text-center">
                    <div className="fw-bold fs-4 text-success">{completedEnrollments.length}</div>
                    <div className="text-muted small">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="fw-bold fs-4 text-warning">
                      {enrollments.length > 0 
                        ? Math.round(enrollments.reduce((acc, curr) => acc + (curr.progress || 0), 0) / enrollments.length)
                        : 0
                      }%
                    </div>
                    <div className="text-muted small">Progress</div>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-sm mt-4">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  <Button 
                    variant="outline-primary" 
                    onClick={handleBrowseCourses}
                  >
                    Browse Courses
                  </Button>
                  <Button 
                    variant="outline-success" 
                    onClick={() => navigate('/progress')}
                  >
                    My Progress
                  </Button>
                  <Button 
                    variant="outline-info" 
                    onClick={() => navigate('/community')}
                  >
                    Community
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Continue Learning Section */}
            {inProgressEnrollments.length > 0 && (
              <Card className="shadow-sm mt-4">
                <Card.Header className="bg-light">
                  <h5 className="mb-0">Continue Learning</h5>
                </Card.Header>
                <Card.Body>
                  {inProgressEnrollments.slice(0, 3).map(enrollment => {
                    const courseAction = getCourseAction(enrollment)
                    return (
                      <div key={enrollment._id} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                        <div className="flex-grow-1">
                          <h6 className="mb-1" style={{fontSize: '0.9rem'}}>
                            {enrollment.course?.title || 'Untitled Course'}
                          </h6>
                          <div className="d-flex align-items-center">
                            <div className="progress flex-grow-1 me-2" style={{height: '6px'}}>
                              <div 
                                className="progress-bar"
                                style={{ width: `${enrollment.progress || 0}%` }}
                              ></div>
                            </div>
                            <small className="text-muted">{enrollment.progress || 0}%</small>
                          </div>
                        </div>
                        <Button
                          variant={courseAction.variant}
                          size="sm"
                          onClick={courseAction.handler}
                          style={{minWidth: '80px'}}
                        >
                          {courseAction.text}
                        </Button>
                      </div>
                    )
                  })}
                </Card.Body>
              </Card>
            )}
          </Col>

          <Col lg={8}>
            {/* Profile Form */}
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-light d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Trader Profile</h5>
                <Button 
                  variant={isEditing ? "outline-secondary" : "outline-primary"}
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </Button>
              </Card.Header>
              <Card.Body>
                {isEditing ? (
                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Phone</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Enter phone number"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Birthday</Form.Label>
                          <Form.Control
                            type="date"
                            name="birthday"
                            value={formData.birthday}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group className="mb-3">
                      <Form.Label>TradingView ID</Form.Label>
                      <Form.Control
                        type="text"
                        name="tradingViewId"
                        value={formData.tradingViewId}
                        onChange={handleInputChange}
                        placeholder="Enter your TradingView ID"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Vishcard ID</Form.Label>
                      <Form.Control
                        type="text"
                        name="vishcardId"
                        value={formData.vishcardId}
                        onChange={handleInputChange}
                        placeholder="Enter your Vishcard ID"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Trading Segment</Form.Label>
                      <div>
                        <Form.Check
                          inline
                          type="radio"
                          name="tradingSegment"
                          value="Stock"
                          checked={formData.tradingSegment === 'Stock'}
                          onChange={handleInputChange}
                          label="Stock"
                        />
                        <Form.Check
                          inline
                          type="radio"
                          name="tradingSegment"
                          value="Options"
                          checked={formData.tradingSegment === 'Options'}
                          onChange={handleInputChange}
                          label="Options"
                        />
                        <Form.Check
                          inline
                          type="radio"
                          name="tradingSegment"
                          value="Forex"
                          checked={formData.tradingSegment === 'Forex'}
                          onChange={handleInputChange}
                          label="Forex"
                        />
                      </div>
                    </Form.Group>

                    <h6 className="border-bottom pb-2">Address</h6>
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Label>Street</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.street"
                            value={formData.address.street}
                            onChange={handleInputChange}
                            placeholder="Enter street address"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>City</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.city"
                            value={formData.address.city}
                            onChange={handleInputChange}
                            placeholder="Enter city"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>State</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.state"
                            value={formData.address.state}
                            onChange={handleInputChange}
                            placeholder="Enter state"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>ZIP Code</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.zipCode"
                            value={formData.address.zipCode}
                            onChange={handleInputChange}
                            placeholder="Enter ZIP code"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Country</Form.Label>
                          <Form.Control
                            type="text"
                            name="address.country"
                            value={formData.address.country}
                            onChange={handleInputChange}
                            placeholder="Enter country"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex gap-2">
                      <Button type="submit" variant="primary">
                        Save Changes
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline-secondary"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form>
                ) : (
                  <div>
                    <Row>
                      <Col sm={6}>
                        <div className="mb-3">
                          <strong>Phone:</strong>
                          <div>{profile?.profile?.phone || 'Not provided'}</div>
                        </div>
                        <div className="mb-3">
                          <strong>Birthday:</strong>
                          <div>
                            {profile?.profile?.birthday ? 
                              new Date(profile.profile.birthday).toLocaleDateString() : 
                              'Not provided'
                            }
                          </div>
                        </div>
                        <div className="mb-3">
                          <strong>TradingView ID:</strong>
                          <div>{profile?.profile?.tradingViewId || 'Not provided'}</div>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className="mb-3">
                          <strong>Vishcard ID:</strong>
                          <div>{profile?.profile?.vishcardId || 'Not provided'}</div>
                        </div>
                        <div className="mb-3">
                          <strong>Trading Segment:</strong>
                          <div>{profile?.profile?.tradingSegment || 'Not selected'}</div>
                        </div>
                        <div className="mb-3">
                          <strong>Member Since:</strong>
                          <div>
                            {user?.createdAt ? 
                              new Date(user.createdAt).toLocaleDateString() : 
                              'N/A'
                            }
                          </div>
                        </div>
                      </Col>
                    </Row>
                    
                    {profile?.profile?.address && (
                      <div className="mt-4">
                        <h6>Address</h6>
                        <Row>
                          <Col sm={6}>
                            <div className="mb-2">
                              <strong>Street:</strong>
                              <div>{profile.profile.address.street || 'Not provided'}</div>
                            </div>
                            <div className="mb-2">
                              <strong>City:</strong>
                              <div>{profile.profile.address.city || 'Not provided'}</div>
                            </div>
                            <div className="mb-2">
                              <strong>State:</strong>
                              <div>{profile.profile.address.state || 'Not provided'}</div>
                            </div>
                          </Col>
                          <Col sm={6}>
                            <div className="mb-2">
                              <strong>ZIP Code:</strong>
                              <div>{profile.profile.address.zipCode || 'Not provided'}</div>
                            </div>
                            <div className="mb-2">
                              <strong>Country:</strong>
                              <div>{profile.profile.address.country || 'Not provided'}</div>
                            </div>
                          </Col>
                        </Row>
                      </div>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Enrollments Table */}
            <Card className="shadow-sm">
              <Card.Header className="bg-light">
                <h5 className="mb-0">My Courses</h5>
              </Card.Header>
              <Card.Body>
                {enrollments.length > 0 ? (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Progress</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map(enrollment => {
                        const courseAction = getCourseAction(enrollment)
                        return (
                          <tr key={enrollment._id}>
                            <td>
                              <strong>{enrollment.course?.title || 'Untitled Course'}</strong>
                              <div>
                                <small className="text-muted">
                                  Enrolled: {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                                </small>
                              </div>
                            </td>
                            <td style={{width: '200px'}}>
                              <div className="d-flex align-items-center">
                                <div className="progress flex-grow-1 me-2" style={{height: '8px'}}>
                                  <div 
                                    className={`progress-bar bg-${getProgressVariant(enrollment.progress || 0)}`}
                                    style={{ width: `${enrollment.progress || 0}%` }}
                                  ></div>
                                </div>
                                <small>{enrollment.progress || 0}%</small>
                              </div>
                            </td>
                            <td>
                              <Badge bg={getProgressVariant(enrollment.progress || 0)}>
                                {getProgressText(enrollment.progress || 0)}
                              </Badge>
                            </td>
                            <td>
                              <Button
                                variant={courseAction.variant}
                                size="sm"
                                onClick={courseAction.handler}
                              >
                                {courseAction.text}
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </Table>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted mb-3">You haven't enrolled in any courses yet.</p>
                    <Button variant="primary" onClick={handleBrowseCourses}>
                      Browse Courses
                    </Button>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  )
}

export default Traders