import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Badge, Form, InputGroup, Modal, Alert, Spinner } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import styles from './Courses.module.css'

const Courses = () => {
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [enrolling, setEnrolling] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: '', type: '' })
  const [couponCode, setCouponCode] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)
  const [validatedCoupon, setValidatedCoupon] = useState(null)
  
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    filterCourses()
  }, [courses, searchTerm, categoryFilter, levelFilter])

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/courses')
      setCourses(response.data.courses)
    } catch (error) {
      console.error('Error fetching courses:', error)
      showAlert('Error loading courses', 'danger')
    } finally {
      setLoading(false)
    }
  }

  const filterCourses = () => {
    let filtered = courses

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter) {
      filtered = filtered.filter(course => course.category === categoryFilter)
    }

    if (levelFilter) {
      filtered = filtered.filter(course => course.level === levelFilter)
    }

    setFilteredCourses(filtered)
  }

  const handleEnrollClick = (course) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/courses' } })
      return
    }
    
    setSelectedCourse(course)
    setCouponCode('')
    setValidatedCoupon(null)
    setShowEnrollModal(true)
  }

  const validateCoupon = async () => {
    if (!couponCode.trim() || !selectedCourse) {
      setValidatedCoupon(null)
      return
    }

    setCouponLoading(true)
    try {
      const response = await axios.post('/api/coupons/validate', {
        code: couponCode,
        courseId: selectedCourse._id
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      setValidatedCoupon(response.data.coupon)
      showAlert('Coupon applied successfully!', 'success')
    } catch (error) {
      setValidatedCoupon(null)
      showAlert(error.response?.data?.message || 'Invalid coupon code', 'danger')
    } finally {
      setCouponLoading(false)
    }
  }

  const handleEnrollConfirm = async () => {
    if (!selectedCourse) return

    setEnrolling(true)
    try {
      // Check if course is free
      if (isCourseFree(selectedCourse)) {
        // Direct enrollment for free courses
        await axios.post('/api/enrollments', {
          courseId: selectedCourse._id
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        showAlert('Enrolled successfully! Redirecting to course...', 'success')
        setShowEnrollModal(false)
        
        setTimeout(() => {
          navigate(`/learning/${selectedCourse._id}`)
        }, 2000)
        
      } else {
        // Paid course - create payment order
        const paymentResponse = await axios.post('/api/payments/create-order', {
          courseId: selectedCourse._id,
          couponCode: validatedCoupon?.code
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        })

        const { order, payment } = paymentResponse.data

        // Initialize Razorpay
        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: payment.amount * 100, // Convert to paise
          currency: payment.currency,
          name: 'Trading Course Platform',
          description: selectedCourse.title,
          order_id: order.id,
          handler: async function (response) {
            try {
              // Verify payment
              await axios.post('/api/payments/verify', {
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature
              }, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              })

              showAlert('Enrollment successful! Redirecting to course...', 'success')
              setShowEnrollModal(false)
              
              // Redirect to course page after 2 seconds
              setTimeout(() => {
                navigate(`/learning/${selectedCourse._id}`)
              }, 2000)

            } catch (error) {
              console.error('Payment verification failed:', error)
              showAlert('Payment verification failed. Please contact support.', 'danger')
            }
          },
          prefill: {
            name: user?.username || '',
            email: user?.email || '',
          },
          theme: {
            color: '#007bff'
          },
          modal: {
            ondismiss: function() {
              showAlert('Payment cancelled', 'warning')
            }
          }
        }

        const razorpay = new window.Razorpay(options)
        razorpay.open()
      }

    } catch (error) {
      console.error('Enrollment error:', error)
      showAlert(error.response?.data?.message || 'Enrollment failed. Please try again.', 'danger')
    } finally {
      setEnrolling(false)
    }
  }

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000)
  }

  // FIXED: Add null check for course parameter
  const isCourseFree = (course) => {
    if (!course) return false // Add this null check
    return (course.price === 0 || course.discountedPrice === 0)
  }

  const calculateFinalPrice = () => {
    if (!selectedCourse) return 0
    
    let price = selectedCourse.discountedPrice || selectedCourse.price
    
    if (validatedCoupon) {
      if (validatedCoupon.discountType === 'percentage') {
        const discount = (price * validatedCoupon.discountValue) / 100
        price -= Math.min(discount, validatedCoupon.maxDiscount || discount)
      } else {
        price -= validatedCoupon.discountValue
      }
    }
    
    return Math.max(0, price)
  }

  const categories = [...new Set(courses.map(course => course.category))]
  const levels = ['Beginner', 'Intermediate', 'Advanced']

  const getLevelVariant = (level) => {
    switch (level) {
      case 'Beginner': return 'success'
      case 'Intermediate': return 'warning'
      case 'Advanced': return 'danger'
      default: return 'primary'
    }
  }

  return (
    <div className={styles.coursesPage}>
      <Container>
        {/* Alert */}
        {alert.show && (
          <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false, message: '', type: '' })}>
            {alert.message}
          </Alert>
        )}

        {/* Header Section */}
        <Row className="mb-5">
          <Col>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Our Courses</h1>
              <p className={styles.pageSubtitle}>
                Master trading with our comprehensive course catalog
              </p>
            </div>
          </Col>
        </Row>

        {/* Search and Filters */}
        <Row className="mb-4">
          <Col lg={6} className="mb-3">
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Search courses, instructors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              <Button variant="primary">
                🔍
              </Button>
            </InputGroup>
          </Col>
          <Col lg={3} className="mb-3">
            <Form.Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </Form.Select>
          </Col>
          <Col lg={3} className="mb-3">
            <Form.Select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Levels</option>
              {levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </Form.Select>
          </Col>
        </Row>

        {/* Results Count */}
        <Row className="mb-4">
          <Col>
            <div className={styles.resultsInfo}>
              Showing {filteredCourses.length} of {courses.length} courses
            </div>
          </Col>
        </Row>

        {/* Courses Grid */}
        <Row>
          {loading ? (
            <Col className="text-center">
              <div className={styles.loading}>
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3">Loading courses...</p>
              </div>
            </Col>
          ) : filteredCourses.length > 0 ? (
            filteredCourses.map(course => (
              <Col lg={4} md={6} key={course._id} className="mb-4">
                <Card className={styles.courseCard}>
                  <div className={styles.courseImage}>
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} />
                    ) : (
                      <div className={styles.imagePlaceholder}>
                        {course.title.charAt(0)}
                      </div>
                    )}
                    <Badge 
                      bg={getLevelVariant(course.level)}
                      className={styles.levelBadge}
                    >
                      {course.level}
                    </Badge>
                    {course.featured && (
                      <Badge bg="primary" className={styles.featuredBadge}>
                        Featured
                      </Badge>
                    )}
                    {isCourseFree(course) && ( // This is safe now
                      <Badge bg="success" className={styles.freeBadge}>
                        Free
                      </Badge>
                    )}
                  </div>
                  <Card.Body className={styles.courseBody}>
                    <div className={styles.courseHeader}>
                      <Card.Title className={styles.courseTitle}>
                        {course.title}
                      </Card.Title>
                      <Card.Text className={styles.courseDescription}>
                        {course.description.substring(0, 120)}...
                      </Card.Text>
                    </div>
                    
                    <div className={styles.courseMeta}>
                      <div className={styles.instructor}>
                        <span className={styles.metaLabel}>Instructor:</span>
                        <span className={styles.metaValue}>{course.instructor}</span>
                      </div>
                      <div className={styles.duration}>
                        <span className={styles.metaLabel}>Duration:</span>
                        <span className={styles.metaValue}>{course.duration}</span>
                      </div>
                      <div className={styles.lessons}>
                        <span className={styles.metaLabel}>Lessons:</span>
                        <span className={styles.metaValue}>{course.lessons}</span>
                      </div>
                      <div className={styles.students}>
                        <span className={styles.metaLabel}>Students:</span>
                        <span className={styles.metaValue}>{course.studentsEnrolled}</span>
                      </div>
                    </div>

                    <div className={styles.courseFooter}>
                      <div className={styles.priceSection}>
                        <div className={styles.coursePrice}>
                          {isCourseFree(course) ? ( // This is safe now
                            <span className={styles.freePrice}>Free</span>
                          ) : (
                            <>
                              <span className={styles.currentPrice}>
                                ₹{course.discountedPrice || course.price}
                              </span>
                              {course.discountedPrice && (
                                <span className={styles.originalPrice}>
                                  ₹{course.price}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        {course.discountedPrice && !isCourseFree(course) && (
                          <div className={styles.discountBadge}>
                            Save {Math.round((1 - course.discountedPrice / course.price) * 100)}%
                          </div>
                        )}
                      </div>
                      <Button 
                        variant={isCourseFree(course) ? "success" : "primary"} // This is safe now
                        className={styles.enrollBtn}
                        onClick={() => handleEnrollClick(course)}
                        disabled={enrolling && selectedCourse?._id === course._id}
                      >
                        {enrolling && selectedCourse?._id === course._id ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Processing...
                          </>
                        ) : isCourseFree(course) ? (
                          'Enroll Free'
                        ) : (
                          'Enroll Now'
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col className="text-center">
              <div className={styles.noResults}>
                <h4>No courses found</h4>
                <p>Try adjusting your search criteria</p>
                <Button 
                  variant="outline-primary"
                  onClick={() => {
                    setSearchTerm('')
                    setCategoryFilter('')
                    setLevelFilter('')
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </Col>
          )}
        </Row>

        {/* Enroll Confirmation Modal */}
        <Modal show={showEnrollModal} onHide={() => setShowEnrollModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Enroll in Course</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedCourse && ( // Added safety check
              <div className={styles.enrollModalContent}>
                <div className={styles.courseInfo}>
                  <h5>{selectedCourse.title}</h5>
                  <p className="text-muted">{selectedCourse.instructor}</p>
                </div>
                
                <div className={styles.pricingSection}>
                  <div className={styles.originalPriceLine}>
                    <span>Course Price:</span>
                    <span>₹{selectedCourse.discountedPrice || selectedCourse.price}</span>
                  </div>
                  
                  {validatedCoupon && (
                    <div className={styles.couponDiscount}>
                      <span>Coupon Discount:</span>
                      <span className={styles.discountText}>
                        -₹{((selectedCourse.discountedPrice || selectedCourse.price) - calculateFinalPrice()).toFixed(2)}
                      </span>
                    </div>
                  )}
                  
                  <hr />
                  <div className={styles.finalPrice}>
                    <strong>Final Price:</strong>
                    <strong>₹{calculateFinalPrice()}</strong>
                  </div>
                </div>

                {!isCourseFree(selectedCourse) && ( // This is safe now
                  <div className={styles.couponSection}>
                    <Form.Group>
                      <Form.Label>Have a coupon code?</Form.Label>
                      <InputGroup>
                        <Form.Control
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          disabled={couponLoading}
                        />
                        <Button 
                          variant="outline-primary" 
                          onClick={validateCoupon}
                          disabled={couponLoading || !couponCode.trim()}
                        >
                          {couponLoading ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            'Apply'
                          )}
                        </Button>
                      </InputGroup>
                    </Form.Group>
                  </div>
                )}

                <div className={styles.enrollBenefits}>
                  <h6>What you'll get:</h6>
                  <ul>
                    <li>Lifetime access to course content</li>
                    <li>Certificate of completion</li>
                    <li>Q&A support</li>
                    <li>Downloadable resources</li>
                    <li>Mobile and TV access</li>
                  </ul>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowEnrollModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleEnrollConfirm}
              disabled={enrolling || !selectedCourse} // Added safety check
              className={styles.confirmEnrollBtn}
            >
              {enrolling ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Processing...
                </>
              ) : selectedCourse && isCourseFree(selectedCourse) ? (
                'Enroll for Free'
              ) : (
                `Pay ₹${calculateFinalPrice()}`
              )}
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  )
}

export default Courses