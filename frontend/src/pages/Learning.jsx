// components/Learning.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  ListGroup,
  Badge,
  Spinner,
  Alert,
  ProgressBar
} from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import styles from "./Learning.module.css";

const Learning = () => {
  const [courseContent, setCourseContent] = useState([]);
  const [currentContent, setCurrentContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrollment, setEnrollment] = useState(null);
  const [completedContents, setCompletedContents] = useState(new Set());
  const [progress, setProgress] = useState({ completed: 0, total: 0, percentage: 0 });
  const [markingComplete, setMarkingComplete] = useState(false);

  const { courseId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/learning/${courseId}` } });
      return;
    }
    fetchCourseContent();
  }, [courseId, isAuthenticated]);

  const fetchCourseContent = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/course-content/${courseId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      setCourseContent(response.data.content);
      setEnrollment(response.data.enrollment);
      setCompletedContents(new Set(response.data.progress.completedContentIds));
      setProgress({
        completed: response.data.progress.completed,
        total: response.data.progress.total,
        percentage: response.data.progress.percentage
      });
      
      // Set first content as current if available
      if (response.data.content.length > 0) {
        setCurrentContent(response.data.content[0]);
      }
    } catch (error) {
      console.error("Error fetching course content:", error);
      const errorMessage = error.response?.data?.message || 
        "Failed to load course content. Please try again.";
      setError(errorMessage);
      
      if (error.response?.status === 403) {
        // User not enrolled, redirect to course page
        setTimeout(() => {
          navigate(`/course/${courseId}`);
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleContentSelect = (content) => {
    setCurrentContent(content);
  };

  const markAsCompleted = async (contentId) => {
    try {
      setMarkingComplete(true);
      const response = await axios.post(
        `/api/course-content/${contentId}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );
      
      setCompletedContents(prev => new Set(prev.add(contentId)));
      setProgress(response.data.progress);
      setEnrollment(prev => ({
        ...prev,
        ...response.data.enrollment
      }));
      
      // Auto-advance to next content if available
      const currentIndex = courseContent.findIndex(content => content._id === contentId);
      if (currentIndex < courseContent.length - 1) {
        setTimeout(() => {
          setCurrentContent(courseContent[currentIndex + 1]);
        }, 1000);
      }
    } catch (error) {
      console.error("Error marking content complete:", error);
      alert("Failed to mark as completed. Please try again.");
    } finally {
      setMarkingComplete(false);
    }
  };

  const getContentIcon = (type) => {
    switch (type) {
      case 'video':
        return '🎬';
      case 'pdf':
        return '📄';
      case 'document':
        return '📝';
      case 'quiz':
        return '❓';
      case 'assignment':
        return '📋';
      default:
        return '📁';
    }
  };

  const getDurationText = (content) => {
    if (content.type === 'video' && content.duration) {
      return content.duration;
    }
    if (content.type === 'document' || content.type === 'pdf') {
      return 'Read';
    }
    if (content.type === 'quiz') {
      return 'Quiz';
    }
    if (content.type === 'assignment') {
      return 'Assignment';
    }
    return '';
  };

  const getVideoUrl = (content) => {
    if (content.videoUrl) return content.videoUrl;
    if (content.videoFile?.url) return content.videoFile.url;
    return null;
  };

  const getDocumentUrl = (content) => {
    if (content.documentUrl) return content.documentUrl;
    if (content.documentFile?.url) return content.documentFile.url;
    return null;
  };

  const formatEnrollmentDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container className={styles.loadingContainer}>
        <div className="text-center">
          <Spinner animation="border" role="status" className={styles.spinner}>
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading course content...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className={styles.errorContainer}>
        <Alert variant="danger">
          <Alert.Heading>Access Denied</Alert.Heading>
          <p>{error}</p>
          <div className="d-flex gap-2">
            <Button 
              variant="primary" 
              onClick={() => navigate(`/course/${courseId}`)}
            >
              Enroll in Course
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={() => navigate('/courses')}
            >
              Back to Courses
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <div className={styles.learningPage}>
      <Container fluid>
        <Row>
          {/* Sidebar - Course Content List */}
          <Col lg={3} className={styles.sidebar}>
            <Card className={styles.sidebarCard}>
              <Card.Header className={styles.sidebarHeader}>
                <div>
                  <h5>Course Content</h5>
                  {enrollment && (
                    <div className={styles.enrollmentInfo}>
                      <small>Enrolled on: {formatEnrollmentDate(enrollment.enrollmentDate)}</small>
                      {enrollment.completed && (
                        <Badge bg="success" className="mt-1">
                          Course Completed
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className={styles.progressSection}>
                    <div className={styles.progressText}>
                      Progress: {progress.completed}/{progress.total} ({progress.percentage}%)
                    </div>
                    <ProgressBar 
                      now={progress.percentage} 
                      className={styles.progressBar}
                      variant={enrollment?.completed ? "success" : "primary"}
                    />
                  </div>
                </div>
              </Card.Header>
              <Card.Body className={styles.sidebarBody}>
                <ListGroup variant="flush">
                  {courseContent.map((content, index) => (
                    <ListGroup.Item
                      key={content._id}
                      className={`${styles.contentItem} ${
                        currentContent?._id === content._id ? styles.active : ''
                      }`}
                      onClick={() => handleContentSelect(content)}
                    >
                      <div className={styles.contentInfo}>
                        <div className={styles.contentIcon}>
                          {getContentIcon(content.type)}
                        </div>
                        <div className={styles.contentDetails}>
                          <div className={styles.contentTitle}>
                            {content.title}
                          </div>
                          <div className={styles.contentMeta}>
                            <span className={styles.contentType}>
                              {content.type}
                            </span>
                            {getDurationText(content) && (
                              <span className={styles.contentDuration}>
                                • {getDurationText(content)}
                              </span>
                            )}
                            {content.isFree && (
                              <Badge bg="success" className={styles.freeBadge}>
                                Free
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className={styles.contentStatus}>
                        {completedContents.has(content._id) ? (
                          <Badge bg="success" className={styles.completedBadge}>
                            ✓
                          </Badge>
                        ) : (
                          <div className={styles.contentOrder}>
                            {index + 1}
                          </div>
                        )}
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content Area */}
          <Col lg={9} className={styles.mainContent}>
            {currentContent ? (
              <Card className={styles.contentCard}>
                <Card.Header className={styles.contentHeader}>
                  <div className={styles.contentHeaderInfo}>
                    <h4>{currentContent.title}</h4>
                    <div className={styles.contentMeta}>
                      <Badge bg="secondary">
                        {currentContent.type}
                      </Badge>
                      {currentContent.duration && (
                        <span className={styles.duration}>
                          Duration: {currentContent.duration}
                        </span>
                      )}
                    </div>
                  </div>
                  {!completedContents.has(currentContent._id) && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => markAsCompleted(currentContent._id)}
                      disabled={markingComplete}
                    >
                      {markingComplete ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Marking...
                        </>
                      ) : (
                        'Mark as Complete'
                      )}
                    </Button>
                  )}
                </Card.Header>
                
                <Card.Body className={styles.contentBody}>
                  {currentContent.description && (
                    <div className={styles.contentDescription}>
                      <p>{currentContent.description}</p>
                    </div>
                  )}

                  {/* Video Content */}
                  {currentContent.type === 'video' && (
                    <div className={styles.videoContainer}>
                      {getVideoUrl(currentContent) ? (
                        <video
                          controls
                          className={styles.videoPlayer}
                          src={getVideoUrl(currentContent)}
                          controlsList="nodownload"
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <div className={styles.noContent}>
                          <p>Video content not available</p>
                          <Button 
                            variant="outline-primary" 
                            onClick={() => navigate(`/course/${courseId}`)}
                          >
                            Contact Support
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Document/PDF Content */}
                  {(currentContent.type === 'document' || currentContent.type === 'pdf') && (
                    <div className={styles.documentContainer}>
                      {getDocumentUrl(currentContent) ? (
                        <iframe
                          src={getDocumentUrl(currentContent)}
                          className={styles.documentViewer}
                          title={currentContent.title}
                        />
                      ) : (
                        <div className={styles.noContent}>
                          <p>Document not available</p>
                          <Button 
                            variant="outline-primary" 
                            onClick={() => navigate(`/course/${courseId}`)}
                          >
                            Contact Support
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quiz Content */}
                  {currentContent.type === 'quiz' && (
                    <div className={styles.quizContainer}>
                      <div className={styles.comingSoon}>
                        <h5>Quiz Feature Coming Soon</h5>
                        <p>Interactive quizzes are under development and will be available soon.</p>
                        <Button 
                          variant="outline-primary"
                          onClick={() => markAsCompleted(currentContent._id)}
                          disabled={completedContents.has(currentContent._id)}
                        >
                          Mark as Completed
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Assignment Content */}
                  {currentContent.type === 'assignment' && (
                    <div className={styles.assignmentContainer}>
                      <div className={styles.comingSoon}>
                        <h5>Assignment Feature Coming Soon</h5>
                        <p>Assignment submissions are under development and will be available soon.</p>
                        <Button 
                          variant="outline-primary"
                          onClick={() => markAsCompleted(currentContent._id)}
                          disabled={completedContents.has(currentContent._id)}
                        >
                          Mark as Completed
                        </Button>
                      </div>
                    </div>
                  )}
                </Card.Body>

                {/* Navigation Buttons */}
                <Card.Footer className={styles.contentFooter}>
                  <div className={styles.navigation}>
                    <Button
                      variant="outline-secondary"
                      onClick={() => {
                        const currentIndex = courseContent.findIndex(
                          content => content._id === currentContent._id
                        );
                        if (currentIndex > 0) {
                          setCurrentContent(courseContent[currentIndex - 1]);
                        }
                      }}
                      disabled={
                        courseContent.findIndex(
                          content => content._id === currentContent._id
                        ) === 0
                      }
                    >
                      ← Previous
                    </Button>
                    
                    <div className={styles.navigationInfo}>
                      Lesson {courseContent.findIndex(content => content._id === currentContent._id) + 1} of {courseContent.length}
                    </div>
                    
                    <Button
                      variant="primary"
                      onClick={() => {
                        const currentIndex = courseContent.findIndex(
                          content => content._id === currentContent._id
                        );
                        if (currentIndex < courseContent.length - 1) {
                          setCurrentContent(courseContent[currentIndex + 1]);
                        }
                      }}
                      disabled={
                        courseContent.findIndex(
                          content => content._id === currentContent._id
                        ) === courseContent.length - 1
                      }
                    >
                      Next →
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            ) : (
              <Card className={styles.noContentCard}>
                <Card.Body className="text-center">
                  <h5>No content available</h5>
                  <p>This course doesn't have any content yet.</p>
                  <Button 
                    variant="primary" 
                    onClick={() => navigate('/courses')}
                  >
                    Browse Other Courses
                  </Button>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Learning;