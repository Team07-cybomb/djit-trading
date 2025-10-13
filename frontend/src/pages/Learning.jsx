// components/Learning.jsx
import React, { useState, useEffect, useRef } from "react";
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
  ProgressBar,
  Modal
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
  const [videoProgress, setVideoProgress] = useState({});
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [nextContent, setNextContent] = useState(null);
  const [completionInProgress, setCompletionInProgress] = useState(false);

  const videoRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const { courseId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Video completion threshold (90% watched)
  const COMPLETION_THRESHOLD = 0.9;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/learning/${courseId}` } });
      return;
    }
    fetchCourseContent();
  }, [courseId, isAuthenticated]);

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Setup video tracking when current content changes to a video
    if (currentContent?.type === 'video') {
      setupVideoTracking();
    } else {
      // Cleanup interval when not on video content
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
  }, [currentContent]);

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
      
      // Initialize video progress tracking
      const initialVideoProgress = {};
      response.data.content.forEach(content => {
        if (content.type === 'video') {
          initialVideoProgress[content._id] = {
            currentTime: 0,
            duration: 0,
            percentage: 0,
            completed: false
          };
        }
      });
      setVideoProgress(initialVideoProgress);
      
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
        setTimeout(() => {
          navigate(`/course/${courseId}`);
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  const setupVideoTracking = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    const handleLoadedMetadata = () => {
      setVideoProgress(prev => ({
        ...prev,
        [currentContent._id]: {
          ...prev[currentContent._id],
          duration: video.duration
        }
      }));
    };

    const handleTimeUpdate = () => {
      if (!video.duration) return;

      const currentTime = video.currentTime;
      const duration = video.duration;
      const percentage = currentTime / duration;

      setVideoProgress(prev => ({
        ...prev,
        [currentContent._id]: {
          currentTime,
          duration,
          percentage,
          completed: percentage >= COMPLETION_THRESHOLD
        }
      }));

      // Auto-mark as completed when threshold is reached
      if (percentage >= COMPLETION_THRESHOLD && 
          !completedContents.has(currentContent._id) && 
          !completionInProgress) {
        handleVideoCompletion();
      }
    };

    const handleEnded = () => {
      if (!completedContents.has(currentContent._id) && !completionInProgress) {
        handleVideoCompletion();
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    // Start progress tracking interval
    progressIntervalRef.current = setInterval(() => {
      if (video.readyState > 0) {
        handleTimeUpdate();
      }
    }, 1000);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  };

  const handleVideoCompletion = async () => {
    if (completedContents.has(currentContent._id)) return;
    
    // Prevent multiple calls
    if (completionInProgress) return;

    try {
      setCompletionInProgress(true);
      setMarkingComplete(true);
      
      const response = await markContentAsCompleted(currentContent._id);
      
      // Find next content
      const currentIndex = courseContent.findIndex(content => content._id === currentContent._id);
      const nextContentItem = currentIndex < courseContent.length - 1 ? courseContent[currentIndex + 1] : null;
      
      setNextContent(nextContentItem);
      setShowCompletionModal(true);
      
    } catch (error) {
      console.error("Error completing video:", error);
    } finally {
      setMarkingComplete(false);
      setCompletionInProgress(false);
    }
  };

  const markContentAsCompleted = async (contentId) => {
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

    return response.data;
  };

  const handleContentSelect = (content) => {
    setCurrentContent(content);
    // Reset video progress tracking for new content
    if (content.type === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  const handleContinueLearning = () => {
    setShowCompletionModal(false);
    if (nextContent) {
      setCurrentContent(nextContent);
    }
  };

  const handleStayOnContent = () => {
    setShowCompletionModal(false);
  };

  const getContentIcon = (type) => {
    const icons = {
      'video': '🎬',
      'pdf': '📄',
      'document': '📝',
      'quiz': '❓',
      'assignment': '📋'
    };
    return icons[type] || '📁';
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
    if (content.videoFile?.url) {
      return `http://localhost:5000${content.videoFile.url}`;
    }
    return null;
  };

  const getDocumentUrl = (content) => {
    if (content.documentUrl) return content.documentUrl;
    if (content.documentFile?.url) {
      return `http://localhost:5000${content.documentFile.url}`;
    }
    return null;
  };

  const formatEnrollmentDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVideoProgress = (contentId) => {
    return videoProgress[contentId] || { currentTime: 0, duration: 0, percentage: 0, completed: false };
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
                  {courseContent.map((content, index) => {
                    const isVideo = content.type === 'video';
                    const videoProg = getVideoProgress(content._id);
                    const isCompleted = completedContents.has(content._id);
                    
                    return (
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
                            {isVideo && videoProg.percentage > 0 && !isCompleted && (
                              <div className={styles.videoProgress}>
                                <ProgressBar 
                                  now={videoProg.percentage * 100} 
                                  variant="info" 
                                  className={styles.miniProgressBar}
                                />
                                <small className={styles.videoTime}>
                                  {formatTime(videoProg.currentTime)} / {formatTime(videoProg.duration)}
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={styles.contentStatus}>
                          {isCompleted ? (
                            <Badge bg="success" className={styles.completedBadge}>
                              ✓
                            </Badge>
                          ) : isVideo && videoProg.completed ? (
                            <Badge bg="warning" className={styles.pendingBadge}>
                              ⏳
                            </Badge>
                          ) : (
                            <div className={styles.contentOrder}>
                              {index + 1}
                            </div>
                          )}
                        </div>
                      </ListGroup.Item>
                    );
                  })}
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
                      {currentContent.type === 'video' && videoProgress[currentContent._id] && (
                        <span className={styles.watchProgress}>
                          Watched: {Math.round(videoProgress[currentContent._id].percentage * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                  {!completedContents.has(currentContent._id) && currentContent.type !== 'video' && (
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => markContentAsCompleted(currentContent._id)}
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
                        <div className={styles.videoWrapper}>
                          <video
                            ref={videoRef}
                            controls
                            className={styles.videoPlayer}
                            src={getVideoUrl(currentContent)}
                            controlsList="nodownload"
                            preload="metadata"
                          >
                            Your browser does not support the video tag.
                          </video>
                          <div className={styles.videoStats}>
                            <div className={styles.progressInfo}>
                              <span>Progress: </span>
                              <ProgressBar 
                                now={getVideoProgress(currentContent._id).percentage * 100} 
                                variant="primary"
                                className={styles.videoProgressBar}
                              />
                              <span>
                                {formatTime(getVideoProgress(currentContent._id).currentTime)} / 
                                {formatTime(getVideoProgress(currentContent._id).duration)}
                              </span>
                            </div>
                            {completionInProgress && (
                              <Alert variant="info" className={styles.completionAlert}>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Marking as completed...
                              </Alert>
                            )}
                          </div>
                        </div>
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

                  {/* Document Content */}
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
                          onClick={() => markContentAsCompleted(currentContent._id)}
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
                          onClick={() => markContentAsCompleted(currentContent._id)}
                          disabled={completedContents.has(currentContent._id)}
                        >
                          Mark as Completed
                        </Button>
                      </div>
                    </div>
                  )}
                </Card.Body>

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

      {/* Completion Modal */}
      <Modal show={showCompletionModal} onHide={handleStayOnContent} centered>
        <Modal.Header closeButton>
          <Modal.Title>🎉 Content Completed!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>You've successfully completed <strong>{currentContent?.title}</strong>!</p>
          {nextContent ? (
            <p>Ready to move on to the next lesson: <strong>{nextContent.title}</strong>?</p>
          ) : (
            <p>Congratulations! You've completed all the content in this course.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleStayOnContent}>
            Stay on This Lesson
          </Button>
          <Button variant="primary" onClick={handleContinueLearning}>
            {nextContent ? 'Continue to Next Lesson' : 'View Course Completion'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Learning;