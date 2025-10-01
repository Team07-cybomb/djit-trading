import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import styles from './Home.module.css'

const Home = () => {
  const [featuredCourses, setFeaturedCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    fetchFeaturedCourses()
  }, [])

  const fetchFeaturedCourses = async () => {
    try {
      const response = await axios.get('/api/courses?featured=true&limit=3')
      setFeaturedCourses(response.data.courses)
    } catch (error) {
      console.error('Error fetching featured courses:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.homePage}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <Container>
          <Row className="align-items-center min-vh-100">
            <Col lg={6}>
              <h1 className={styles.heroTitle}>
                Master Trading with <span className={styles.highlight}>Expert Courses</span>
              </h1>
              <p className={styles.heroSubtitle}>
                Learn from industry professionals and take your trading skills to the next level. 
                Join thousands of successful traders who started their journey with us.
              </p>
              <div className={styles.heroButtons}>
                <Button 
                  as={Link} 
                  to="/courses" 
                  className={styles.primaryBtn}
                  size="lg"
                >
                  Explore Courses
                </Button>
                {!isAuthenticated && (
                  <Button 
                    as={Link} 
                    to="/register" 
                    variant="outline-light" 
                    className={styles.secondaryBtn}
                    size="lg"
                  >
                    Start Free
                  </Button>
                )}
              </div>
            </Col>
            <Col lg={6}>
              <div className={styles.heroImage}>
                <div className={styles.floatingCard}>
                  <div className={styles.cardContent}>
                    <h6>Live Trading Session</h6>
                    <p>Real-time market analysis</p>
                    <Badge bg="success">Live</Badge>
                  </div>
                </div>
                <div className={`${styles.floatingCard} ${styles.card2}`}>
                  <div className={styles.cardContent}>
                    <h6>Expert Mentors</h6>
                    <p>10+ years experience</p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className={styles.featuresSection}>
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className={styles.sectionTitle}>Why Choose TradeMaster Pro?</h2>
              <p className={styles.sectionSubtitle}>
                Comprehensive learning platform designed for traders of all levels
              </p>
            </Col>
          </Row>
          <Row>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🎯</div>
                <h5>Expert Instructors</h5>
                <p>Learn from industry professionals with years of trading experience</p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>📈</div>
                <h5>Live Trading</h5>
                <p>Real-time market analysis and live trading sessions</p>
              </div>
            </Col>
            <Col lg={4} md={6} className="mb-4">
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🤝</div>
                <h5>Community Support</h5>
                <p>Join our vibrant community of traders and mentors</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Featured Courses Section */}
      <section className={styles.coursesSection}>
        <Container>
          <Row className="mb-5">
            <Col>
              <h2 className={styles.sectionTitle}>Featured Courses</h2>
              <p className={styles.sectionSubtitle}>
                Handpicked courses to kickstart your trading journey
              </p>
            </Col>
          </Row>
          <Row>
            {loading ? (
              <Col className="text-center">
                <div className={styles.loading}>Loading courses...</div>
              </Col>
            ) : featuredCourses.length > 0 ? (
              featuredCourses.map(course => (
                <Col lg={4} md={6} key={course._id} className="mb-4">
                  <Card className={styles.courseCard}>
                    <div className={styles.courseImage}>
                      <Badge 
                        bg={course.level === 'Beginner' ? 'success' : 
                            course.level === 'Intermediate' ? 'warning' : 'danger'}
                        className={styles.levelBadge}
                      >
                        {course.level}
                      </Badge>
                    </div>
                    <Card.Body>
                      <Card.Title className={styles.courseTitle}>
                        {course.title}
                      </Card.Title>
                      <Card.Text className={styles.courseDescription}>
                        {course.description.substring(0, 100)}...
                      </Card.Text>
                      <div className={styles.courseMeta}>
                        <span className={styles.instructor}>
                          By {course.instructor}
                        </span>
                        <span className={styles.duration}>
                          ⏱️ {course.duration}
                        </span>
                      </div>
                      <div className={styles.coursePrice}>
                        <span className={styles.currentPrice}>
                          ₹{course.discountedPrice || course.price}
                        </span>
                        {course.discountedPrice && (
                          <span className={styles.originalPrice}>
                            ₹{course.price}
                          </span>
                        )}
                      </div>
                      <Button 
                        as={Link} 
                        to="/courses" 
                        variant="primary" 
                        className={styles.enrollBtn}
                      >
                        Enroll Now
                      </Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))
            ) : (
              <Col className="text-center">
                <p>No featured courses available at the moment.</p>
              </Col>
            )}
          </Row>
          <Row className="mt-4">
            <Col className="text-center">
              <Button 
                as={Link} 
                to="/courses" 
                variant="outline-primary" 
                size="lg"
              >
                View All Courses
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <Container>
          <Row className="text-center">
            <Col>
              <h2 className={styles.ctaTitle}>Ready to Start Your Trading Journey?</h2>
              <p className={styles.ctaSubtitle}>
                Join thousands of successful traders today
              </p>
              {!isAuthenticated ? (
                <Button 
                  as={Link} 
                  to="/register" 
                  size="lg" 
                  className={styles.ctaButton}
                >
                  Get Started Free
                </Button>
              ) : (
                <Button 
                  as={Link} 
                  to="/courses" 
                  size="lg" 
                  className={styles.ctaButton}
                >
                  Browse Courses
                </Button>
              )}
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  )
}

export default Home