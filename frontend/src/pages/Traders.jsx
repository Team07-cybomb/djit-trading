import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Badge, Table, Form, Button } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import styles from './Traders.module.css'

const Traders = () => {
  const { user, isAuthenticated } = useAuth()
  const [profile, setProfile] = useState(null)
  const [enrollments, setEnrollments] = useState([])
  const [isEditing, setIsEditing] = useState(false)
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

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserProfile()
      fetchEnrollments()
    }
  }, [isAuthenticated, user])

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`/api/users/${user.id}`)
      setProfile(response.data.user)
      if (response.data.user.profile) {
        setFormData({
          phone: response.data.user.profile.phone || '',
          birthday: response.data.user.profile.birthday ? 
            new Date(response.data.user.profile.birthday).toISOString().split('T')[0] : '',
          address: response.data.user.profile.address || {
            street: '', city: '', state: '', zipCode: '', country: ''
          },
          tradingViewId: response.data.user.profile.tradingViewId || '',
          vishcardId: response.data.user.profile.vishcardId || '',
          tradingSegment: response.data.user.profile.tradingSegment || ''
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchEnrollments = async () => {
    try {
      const response = await axios.get(`/api/enrollments/user/${user.id}`)
      setEnrollments(response.data.enrollments || [])
    } catch (error) {
      console.error('Error fetching enrollments:', error)
    }
  }

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
      await axios.put('/api/users/profile', formData)
      await fetchUserProfile()
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    }
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

  if (!isAuthenticated) {
    return (
      <Container className={styles.tradersPage}>
        <div className={styles.notAuthenticated}>
          <h2>Please log in to view your trader profile</h2>
          <p>You need to be logged in to access this page.</p>
        </div>
      </Container>
    )
  }

  return (
    <div className={styles.tradersPage}>
      <Container>
        <Row>
          <Col lg={4} className="mb-4">
            {/* Profile Card */}
            <Card className={styles.profileCard}>
              <Card.Body className="text-center">
                <div className={styles.avatar}>
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <h4 className={styles.username}>{user?.username}</h4>
                <p className={styles.email}>{user?.email}</p>
                
                {profile?.profile?.badge && (
                  <Badge 
                    bg={getBadgeVariant(profile.profile.badge)}
                    className={styles.userBadge}
                  >
                    {profile.profile.badge} Trader
                  </Badge>
                )}

                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <span className={styles.statNumber}>{enrollments.length}</span>
                    <span className={styles.statLabel}>Courses</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statNumber}>
                      {enrollments.filter(e => e.completed).length}
                    </span>
                    <span className={styles.statLabel}>Completed</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles.statNumber}>
                      {Math.round(enrollments.reduce((acc, curr) => acc + curr.progress, 0) / 
                       (enrollments.length || 1))}%
                    </span>
                    <span className={styles.statLabel}>Progress</span>
                  </div>
                </div>
              </Card.Body>
            </Card>

            {/* Quick Actions */}
            <Card className={styles.actionsCard}>
              <Card.Header>
                <h5 className={styles.cardTitle}>Quick Actions</h5>
              </Card.Header>
              <Card.Body>
                <div className={styles.actionButtons}>
                  <Button variant="outline-primary" className={styles.actionBtn}>
                    Browse Courses
                  </Button>
                  <Button variant="outline-success" className={styles.actionBtn}>
                    My Progress
                  </Button>
                  <Button variant="outline-info" className={styles.actionBtn}>
                    Community
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8}>
            {/* Profile Form */}
            <Card className={styles.detailsCard}>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className={styles.cardTitle}>Trader Profile</h5>
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

                    <h6>Address</h6>
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
                  <div className={styles.profileDetails}>
                    <Row>
                      <Col sm={6}>
                        <div className={styles.detailItem}>
                          <strong>Phone:</strong>
                          <span>{profile?.profile?.phone || 'Not provided'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <strong>Birthday:</strong>
                          <span>
                            {profile?.profile?.birthday ? 
                              new Date(profile.profile.birthday).toLocaleDateString() : 
                              'Not provided'
                            }
                          </span>
                        </div>
                        <div className={styles.detailItem}>
                          <strong>TradingView ID:</strong>
                          <span>{profile?.profile?.tradingViewId || 'Not provided'}</span>
                        </div>
                      </Col>
                      <Col sm={6}>
                        <div className={styles.detailItem}>
                          <strong>Vishcard ID:</strong>
                          <span>{profile?.profile?.vishcardId || 'Not provided'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <strong>Trading Segment:</strong>
                          <span>{profile?.profile?.tradingSegment || 'Not selected'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <strong>Member Since:</strong>
                          <span>
                            {user?.createdAt ? 
                              new Date(user.createdAt).toLocaleDateString() : 
                              'N/A'
                            }
                          </span>
                        </div>
                      </Col>
                    </Row>
                    
                    {profile?.profile?.address && (
                      <div className={styles.addressSection}>
                        <h6>Address</h6>
                        <div className={styles.detailItem}>
                          <strong>Street:</strong>
                          <span>{profile.profile.address.street || 'Not provided'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <strong>City:</strong>
                          <span>{profile.profile.address.city || 'Not provided'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <strong>State:</strong>
                          <span>{profile.profile.address.state || 'Not provided'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <strong>ZIP Code:</strong>
                          <span>{profile.profile.address.zipCode || 'Not provided'}</span>
                        </div>
                        <div className={styles.detailItem}>
                          <strong>Country:</strong>
                          <span>{profile.profile.address.country || 'Not provided'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>

            {/* Enrollments Table */}
            <Card className={styles.enrollmentsCard}>
              <Card.Header>
                <h5 className={styles.cardTitle}>My Courses</h5>
              </Card.Header>
              <Card.Body>
                {enrollments.length > 0 ? (
                  <Table responsive>
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Progress</th>
                        <th>Status</th>
                        <th>Enrolled Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map(enrollment => (
                        <tr key={enrollment._id}>
                          <td>
                            <strong>{enrollment.course?.title}</strong>
                          </td>
                          <td>
                            <div className={styles.progressBar}>
                              <div 
                                className={styles.progressFill}
                                style={{ width: `${enrollment.progress}%` }}
                              ></div>
                              <span className={styles.progressText}>
                                {enrollment.progress}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <Badge 
                              bg={enrollment.completed ? 'success' : 
                                  enrollment.paymentStatus === 'completed' ? 'primary' : 'warning'}
                            >
                              {enrollment.completed ? 'Completed' : 
                               enrollment.paymentStatus === 'completed' ? 'In Progress' : 'Pending'}
                            </Badge>
                          </td>
                          <td>
                            {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className={styles.noEnrollments}>
                    <p>You haven't enrolled in any courses yet.</p>
                    <Button variant="primary">
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