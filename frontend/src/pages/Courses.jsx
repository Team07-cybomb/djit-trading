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
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
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

                    <div className={styles.courseMeta}>
                      <div className={styles.instructor}>
                        <span className={styles.metaLabel}>Instructor:</span>
                        <span className={styles.metaValue}>
                          {course.instructor}
                        </span>
                      </div>
                      <div className={styles.duration}>
                        <span className={styles.metaLabel}>Duration:</span>
                        <span className={styles.metaValue}>
                          {course.duration}
                        </span>
                      </div>
                      <div className={styles.lessons}>
                        <span className={styles.metaLabel}>Lessons:</span>
                        <span className={styles.metaValue}>
                          {course.lessons}
                        </span>
                      </div>
                      <div className={styles.students}>
                        <span className={styles.metaLabel}>Students:</span>
                        <span className={styles.metaValue}>
                          {course.studentsEnrolled}
                        </span>
                      </div>
                    </div>

                    <div className={styles.courseFooter}>
                      <div className={styles.priceSection}>
                        <div className={styles.coursePrice}>
                          {isCourseFree(course) ? (
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
                            Save{" "}
                            {Math.round(
                              (1 - course.discountedPrice / course.price) * 100
                            )}
                            %
                          </div>
                        )}
                      </div>
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
                          "Enroll Free"
                        ) : (
                          "Enroll Now"
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
      </Container>
    </div>
  );
};

export default Courses;