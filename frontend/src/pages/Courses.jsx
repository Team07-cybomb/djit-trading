import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Badge,
  Form,
  InputGroup,
  Alert,
  Spinner,
  Modal,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import EnrollModal from "./EnrollModal";
import styles from "./Courses.module.css";

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, categoryFilter, levelFilter]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get("/api/courses");
      setCourses(response.data.courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      showAlert("Error loading courses", "danger");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseDetails = async (courseId) => {
    try {
      setLoadingDetails(true);
      const response = await axios.get(`/api/courses/${courseId}/details`);
      setCourseDetails(response.data.course);
    } catch (error) {
      console.error("Error fetching course details:", error);
      showAlert("Error loading course details", "danger");
      // Fallback to basic course data if details endpoint fails
      const basicCourse = courses.find(course => course._id === courseId);
      setCourseDetails(basicCourse);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(
        (course) => course.category === categoryFilter
      );
    }

    if (levelFilter) {
      filtered = filtered.filter((course) => course.level === levelFilter);
    }

    setFilteredCourses(filtered);
  };

  const handleEnrollClick = (course) => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: "/courses" } });
      return;
    }

    setSelectedCourse(course);
    setShowEnrollModal(true);
  };

  const handleViewDetails = async (course) => {
    setSelectedCourse(course);
    setShowDetailsModal(true);
    // Fetch complete course details when modal opens
    await fetchCourseDetails(course._id);
  };

  const handleCloseDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedCourse(null);
    setCourseDetails(null);
  };

  const handleEnrollSuccess = () => {
    setShowEnrollModal(false);
    setSelectedCourse(null);
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
  };

  const isCourseFree = (course) => {
    if (!course) return false;
    return course.price === 0 || course.discountedPrice === 0;
  };

  const categories = [...new Set(courses.map((course) => course.category))];
  const levels = ["Beginner", "Intermediate", "Advanced"];

  const getLevelVariant = (level) => {
    switch (level) {
      case "Beginner":
        return "success";
      case "Intermediate":
        return "warning";
      case "Advanced":
        return "danger";
      default:
        return "primary";
    }
  };

  // Course Details Modal Component with Icons
  const CourseDetailsModal = ({ show, onHide, course, courseDetails, loadingDetails }) => {
    // Use courseDetails if available, otherwise fallback to basic course data
    const displayCourse = courseDetails || course;
    
    if (!displayCourse) return null;

    return (
      <Modal show={show} onHide={onHide} size="lg" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>{displayCourse.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingDetails ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading course details...</p>
            </div>
          ) : (
            <>
              <Row>
                <Col md={6}>
                  <div className={styles.modalImage}>
                    {displayCourse.thumbnail ? (
                      <img 
                        src={displayCourse.thumbnail} 
                        alt={displayCourse.title} 
                        className="img-fluid rounded"
                      />
                    ) : (
                      <div className={`${styles.imagePlaceholder} ${styles.modalPlaceholder}`}>
                        {displayCourse.title.charAt(0)}
                      </div>
                    )}
                    <div className="mt-3">
                      <Badge bg={getLevelVariant(displayCourse.level)} className="me-2">
                        {displayCourse.level}
                      </Badge>
                      {displayCourse.featured && (
                        <Badge bg="primary" className="me-2">
                          Featured
                        </Badge>
                      )}
                      {isCourseFree(displayCourse) && (
                        <Badge bg="success">
                          Free
                        </Badge>
                      )}
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className={styles.modalContent}>
                    <h5 className="mb-3">Course Details</h5>
                    
                    {/* Icon-based Course Meta Information */}
                    <div className={styles.iconMetaGrid}>
                      <div className={styles.iconMetaItem}>
                        <div className={styles.iconWrapper}>
                          <span className={styles.metaIcon}>👨‍🏫</span>
                        </div>
                        <div className={styles.metaContent}>
                          <div className={styles.metaLabel}>Instructor</div>
                          <div className={styles.metaValue}>{displayCourse.instructor}</div>
                        </div>
                      </div>

                      <div className={styles.iconMetaItem}>
                        <div className={styles.iconWrapper}>
                          <span className={styles.metaIcon}>📚</span>
                        </div>
                        <div className={styles.metaContent}>
                          <div className={styles.metaLabel}>Category</div>
                          <div className={styles.metaValue}>{displayCourse.category}</div>
                        </div>
                      </div>

                      <div className={styles.iconMetaItem}>
                        <div className={styles.iconWrapper}>
                          <span className={styles.metaIcon}>⏱️</span>
                        </div>
                        <div className={styles.metaContent}>
                          <div className={styles.metaLabel}>Duration</div>
                          <div className={styles.metaValue}>{displayCourse.duration}</div>
                        </div>
                      </div>

                      <div className={styles.iconMetaItem}>
                        <div className={styles.iconWrapper}>
                          <span className={styles.metaIcon}>📖</span>
                        </div>
                        <div className={styles.metaContent}>
                          <div className={styles.metaLabel}>Lessons</div>
                          <div className={styles.metaValue}>{displayCourse.lessons}</div>
                        </div>
                      </div>

                      <div className={styles.iconMetaItem}>
                        <div className={styles.iconWrapper}>
                          <span className={styles.metaIcon}>🌐</span>
                        </div>
                        <div className={styles.metaContent}>
                          <div className={styles.metaLabel}>Language</div>
                          <div className={styles.metaValue}>{displayCourse.language || 'Tamil'}</div>
                        </div>
                      </div>

                      <div className={styles.iconMetaItem}>
                        <div className={styles.iconWrapper}>
                          <span className={styles.metaIcon}>🚚</span>
                        </div>
                        <div className={styles.metaContent}>
                          <div className={styles.metaLabel}>Delivery Time</div>
                          <div className={styles.metaValue}>{displayCourse.deliveryTime || '48 Working Hours'}</div>
                        </div>
                      </div>

                      <div className={styles.iconMetaItem}>
                        <div className={styles.iconWrapper}>
                          <span className={styles.metaIcon}>👥</span>
                        </div>
                        <div className={styles.metaContent}>
                          <div className={styles.metaLabel}>Students Enrolled</div>
                          <div className={styles.metaValue}>{displayCourse.studentsEnrolled}</div>
                        </div>
                      </div>

                      <div className={styles.iconMetaItem}>
                        <div className={styles.iconWrapper}>
                          <span className={styles.metaIcon}>💰</span>
                        </div>
                        <div className={styles.metaContent}>
                          <div className={styles.metaLabel}>Price</div>
                          <div className={styles.metaValue}>
                            {isCourseFree(displayCourse) ? (
                              <span className="text-success fw-bold">Free</span>
                            ) : (
                              <>
                                <span className="fw-bold">
                                  ₹{displayCourse.discountedPrice || displayCourse.price}
                                </span>
                                {displayCourse.discountedPrice && (
                                  <span className="text-muted text-decoration-line-through ms-2 small">
                                    ₹{displayCourse.price}
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>

              {/* Steps Section */}
              {displayCourse.steps && displayCourse.steps.length > 0 && (
                <div className="mt-4">
                  <div className="d-flex align-items-center mb-3">
                    <span className={`${styles.sectionIcon} me-2`}>🎯</span>
                    <h6 className="mb-0">Course Structure</h6>
                  </div>
                  <div className={styles.stepsSection}>
                    <div className="d-flex align-items-center mb-2">
                      <Badge bg="primary" className="me-2">
                        {displayCourse.steps.length} Steps
                      </Badge>
                    </div>
                    <div className={styles.stepsList}>
                      {displayCourse.steps.map((step, index) => (
                        <div key={index} className={styles.stepItem}>
                          <span className={styles.stepNumber}>{index + 1}</span>
                          <span className={styles.stepText}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Course Contains Section */}
              {displayCourse.courseContains && displayCourse.courseContains.length > 0 && (
                <div className="mt-4">
                  <div className="d-flex align-items-center mb-3">
                    <span className={`${styles.sectionIcon} me-2`}>📦</span>
                    <h6 className="mb-0">Course Modules</h6>
                  </div>
                  <div className={styles.featuresList}>
                    {displayCourse.courseContains.map((item, index) => (
                      <div key={index} className={styles.featureItem}>
                        <span className={styles.featureIcon}>✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Indicators Section */}
              {displayCourse.indicators && displayCourse.indicators.length > 0 && (
                <div className="mt-4">
                  <div className="d-flex align-items-center mb-3">
                    <span className={`${styles.sectionIcon} me-2`}>📊</span>
                    <h6 className="mb-0">Indicators You Will Get</h6>
                  </div>
                  <div className={styles.indicatorsList}>
                    {displayCourse.indicators.map((indicator, index) => (
                      <div key={index} className={styles.indicatorItem}>
                        <div className={styles.indicatorHeader}>
                          <span className={styles.indicatorIcon}>⚡</span>
                          <strong className={styles.indicatorName}>{indicator.name}</strong>
                        </div>
                        <p className={styles.indicatorDescription}>{indicator.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {displayCourse.notes && displayCourse.notes.length > 0 && (
                <div className="mt-4">
                  <div className="d-flex align-items-center mb-3">
                    <span className={`${styles.sectionIcon} me-2`}>📝</span>
                    <h6 className="mb-0">Notes You Will Get</h6>
                  </div>
                  <div className={styles.notesList}>
                    {displayCourse.notes.map((note, index) => (
                      <div key={index} className={styles.noteItem}>
                        <span className={styles.noteIcon}>📄</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Description */}
              {displayCourse.detailedDescription && (
                <div className="mt-4">
                  <div className="d-flex align-items-center mb-3">
                    <span className={`${styles.sectionIcon} me-2`}>ℹ️</span>
                    <h6 className="mb-0">About This Course</h6>
                  </div>
                  <div className={styles.descriptionContent}>
                    <p>{displayCourse.detailedDescription}</p>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              {displayCourse.disclaimer && (
                <div className="mt-4 p-3 bg-light rounded">
                  <div className="d-flex align-items-center mb-2">
                    <span className={`${styles.sectionIcon} me-2`}>⚠️</span>
                    <h6 className="mb-0">Important Notice</h6>
                  </div>
                  <p className="mb-0 small">{displayCourse.disclaimer}</p>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onHide}>
            Close
          </Button>
          <Button 
            variant={isCourseFree(displayCourse) ? "success" : "primary"}
            onClick={() => {
              onHide();
              handleEnrollClick(displayCourse);
            }}
            disabled={loadingDetails}
            className={styles.enrollButton}
          >
            {isCourseFree(displayCourse) ? (
              <>
                <span className="me-2">🎁</span>
                Enroll Free
              </>
            ) : (
              <>
                <span className="me-2">🚀</span>
                Enroll Now
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };

  return (
    <div className={styles.coursesPage}>
      <Container>
        {/* Alert */}
        {alert.show && (
          <Alert
            variant={alert.type}
            dismissible
            onClose={() => setAlert({ show: false, message: "", type: "" })}
          >
            {alert.message}
          </Alert>
        )}

        {/* Enhanced Header Section */}
        <Row className="mb-5">
          <Col>
            <div className={styles.pageHeader}>
              <div className={styles.headerBackground}>
                <div className={styles.headerContent}>
                  <h1 className={styles.pageTitle}>Our Trading Courses</h1>
                  <p className={styles.pageSubtitle}>
                    Master the markets with our comprehensive trading education
                    catalog. From beginner basics to advanced strategies, we
                    have the perfect course for your journey.
                  </p>

                  {/* Stats Cards Section */}
                  <Row className={styles.statsCards}>
                    <Col md={4} className="mb-3">
                      <Card className={styles.statCard}>
                        <Card.Body className={styles.statCardBody}>
                          <div className={styles.statIcon}>📚</div>
                          <div className={styles.statNumber}>
                            {courses.length}+
                          </div>
                          <div className={styles.statLabel}>Courses</div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4} className="mb-3">
                      <Card className={styles.statCard}>
                        <Card.Body className={styles.statCardBody}>
                          <div className={styles.statIcon}>👨‍🏫</div>
                          <div className={styles.statNumber}>Expert</div>
                          <div className={styles.statLabel}>Instructors</div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4} className="mb-3">
                      <Card className={styles.statCard}>
                        <Card.Body className={styles.statCardBody}>
                          <div className={styles.statIcon}>⚡</div>
                          <div className={styles.statNumber}>Lifetime</div>
                          <div className={styles.statLabel}>Access</div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </div>
              </div>
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
              <Button variant="primary">🔍</Button>
            </InputGroup>
          </Col>
          <Col lg={3} className="mb-3">
            <Form.Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
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
              {levels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
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
            filteredCourses.map((course) => (
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
                    {isCourseFree(course) && (
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

                    {/* Updated Course Meta with Icons */}
                    <div className={styles.courseMeta}>
                      <div className={styles.courseMetaItem}>
                        <span className={styles.courseMetaIcon}>👨‍🏫</span>
                        <div className={styles.courseMetaContent}>
                          <div className={styles.courseMetaLabel}>Instructor</div>
                          <div className={styles.courseMetaValue}>{course.instructor}</div>
                        </div>
                      </div>
                      
                      <div className={styles.courseMetaItem}>
                        <span className={styles.courseMetaIcon}>⏱️</span>
                        <div className={styles.courseMetaContent}>
                          <div className={styles.courseMetaLabel}>Duration</div>
                          <div className={styles.courseMetaValue}>{course.duration}</div>
                        </div>
                      </div>
                      
                      <div className={styles.courseMetaItem}>
                        <span className={styles.courseMetaIcon}>📖</span>
                        <div className={styles.courseMetaContent}>
                          <div className={styles.courseMetaLabel}>Lessons</div>
                          <div className={styles.courseMetaValue}>{course.lessons}</div>
                        </div>
                      </div>
                      
                      <div className={styles.courseMetaItem}>
                        <span className={styles.courseMetaIcon}>👥</span>
                        <div className={styles.courseMetaContent}>
                          <div className={styles.courseMetaLabel}>Students</div>
                          <div className={styles.courseMetaValue}>{course.studentsEnrolled}</div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.courseFooter}>
                      <div className={styles.priceSection}>
                        <div className={styles.coursePrice}>
                          {isCourseFree(course) ? (
                            <div className={styles.freePriceContainer}>
                              <span className={styles.freePriceIcon}>🎁</span>
                              <span className={styles.freePrice}>Free</span>
                            </div>
                          ) : (
                            <>
                              <div className={styles.paidPriceContainer}>
                                <span className={styles.priceIcon}>💰</span>
                                <span className={styles.currentPrice}>
                                  ₹{course.discountedPrice || course.price}
                                </span>
                                {course.discountedPrice && (
                                  <span className={styles.originalPrice}>
                                    ₹{course.price}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        {course.discountedPrice && !isCourseFree(course) && (
                          <div className={styles.discountBadge}>
                            <span className={styles.discountIcon}>🔥</span>
                            Save{" "}
                            {Math.round(
                              (1 - course.discountedPrice / course.price) * 100
                            )}
                            %
                          </div>
                        )}
                      </div>
                      
                      {/* Updated Button Section */}
                      <div className={styles.buttonGroup}>
                        <Button
                          variant="outline-primary"
                          className={styles.viewDetailsBtn}
                          onClick={() => handleViewDetails(course)}
                        >
                          <span className={styles.buttonIcon}>👁️</span>
                          View Details
                        </Button>
                        <Button
                          variant={isCourseFree(course) ? "success" : "primary"}
                          className={styles.enrollBtn}
                          onClick={() => handleEnrollClick(course)}
                          disabled={
                            enrolling && selectedCourse?._id === course._id
                          }
                        >
                          {enrolling && selectedCourse?._id === course._id ? (
                            <>
                              <Spinner
                                animation="border"
                                size="sm"
                                className="me-2"
                              />
                              Processing...
                            </>
                          ) : isCourseFree(course) ? (
                            <>
                              <span className={styles.buttonIcon}>🎁</span>
                              Enroll Free
                            </>
                          ) : (
                            <>
                              <span className={styles.buttonIcon}>🚀</span>
                              Enroll Now
                            </>
                          )}
                        </Button>
                      </div>
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
                    setSearchTerm("");
                    setCategoryFilter("");
                    setLevelFilter("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </Col>
          )}
        </Row>

        {/* Enroll Modal */}
        <EnrollModal
          show={showEnrollModal}
          onHide={() => setShowEnrollModal(false)}
          course={selectedCourse}
          onEnrollSuccess={handleEnrollSuccess}
          showAlert={showAlert}
        />

        {/* Course Details Modal */}
        <CourseDetailsModal
          show={showDetailsModal}
          onHide={handleCloseDetailsModal}
          course={selectedCourse}
          courseDetails={courseDetails}
          loadingDetails={loadingDetails}
        />
      </Container>
    </div>
  );
};

export default Courses;