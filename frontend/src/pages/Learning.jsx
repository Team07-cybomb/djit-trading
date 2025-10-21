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
  const [videoLoading, setVideoLoading] = useState(false);

  const videoRef = useRef(null);
  const youtubeIframeRef = useRef(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, isAuthenticated]);

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  // When currentContent changes, set up video URL and tracking
  useEffect(() => {
    if (currentContent?.type === "video") {
      setupVideoForContent();
    } else {
      // If not video, clear interval if set
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentContent]);

  const fetchCourseContent = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/course-content/${courseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      const contents = res.data.content || [];
      setCourseContent(contents);
      setEnrollment(res.data.enrollment || null);

      // Set completedContents from API response
      const completedContentIds = res.data.progress?.completedContentIds || [];
      setCompletedContents(new Set(completedContentIds));

      // Calculate progress based on completed contents
      const totalContents = contents.length;
      const completedCount = completedContentIds.length;
      const percentage = totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0;

      setProgress({
        completed: completedCount,
        total: totalContents,
        percentage: percentage,
      });

      // Initialize video progress tracking
      const initialVideoProgress = {};
      contents.forEach((content) => {
        if (content.type === "video") {
          initialVideoProgress[content._id] = {
            currentTime: 0,
            duration: content.duration || 0,
            percentage: 0,
            completed: completedContentIds.includes(content._id),
          };
        }
      });
      setVideoProgress(initialVideoProgress);

      if (contents.length > 0) {
        setCurrentContent(contents[0]);
      } else {
        setCurrentContent(null);
      }
    } catch (err) {
      console.error("Error fetching course content:", err);
      const errorMessage = err.response?.data?.message || "Failed to load course content. Please try again.";
      setError(errorMessage);

      if (err.response?.status === 403) {
        // navigate back to course page after short delay for better UX
        setTimeout(() => {
          navigate(`/course/${courseId}`);
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const setupVideoForContent = async () => {
    if (!currentContent) return;

    setVideoLoading(true);
    
    try {
      if (isYouTubeUrl(currentContent.videoUrl)) {
        // YouTube video - create embed URL
        const videoId = extractYouTubeId(currentContent.videoUrl);
        if (videoId) {
          // Setup YouTube tracking after iframe loads
          setTimeout(() => {
            setupYouTubeTracking();
          }, 1000);
        }
      } else if (currentContent.videoFile?.url) {
        // Local video file - use direct streaming URL
        setTimeout(() => {
          setupLocalVideoTracking();
        }, 500);
      }
    } catch (error) {
      console.error("Error setting up video:", error);
    } finally {
      setVideoLoading(false);
    }
  };

  const isYouTubeUrl = (url) => {
    if (!url) return false;
    return /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/)/.test(url);
  };

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&/]+)/) || url.match(/embed\/([^?&/]+)/);
    return match ? match[1] : null;
  };

  const getVideoSrc = (content) => {
    if (!content) return null;

    if (isYouTubeUrl(content.videoUrl)) {
      const videoId = extractYouTubeId(content.videoUrl);
      return videoId ? `https://www.youtube.com/embed/${videoId}?enablejsapi=1` : null;
    }

    if (content.videoFile?.url) {
      // Use token in URL for video streaming (browser video tags don't send Authorization header)
      const token = localStorage.getItem("token");
      // Use the correct endpoint path that matches your route
      return `/api/course-content/video/${content._id}?token=${token}`;
    }

    return null;
  };

  const setupLocalVideoTracking = () => {
    const video = videoRef.current;
    if (!video) return;

    // Clear any existing interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    const handleLoadedMetadata = () => {
      console.log("Video metadata loaded, duration:", video.duration);
      setVideoProgress((prev) => ({
        ...prev,
        [currentContent._id]: {
          ...prev[currentContent._id],
          duration: video.duration || prev[currentContent._id]?.duration || 0,
        },
      }));
      setVideoLoading(false);
    };

    const handleTimeUpdate = () => {
      if (!video.duration || video.duration === Infinity) return;

      const currentTime = video.currentTime;
      const duration = video.duration;
      const percentage = currentTime / duration;

      setVideoProgress((prev) => ({
        ...prev,
        [currentContent._id]: {
          currentTime,
          duration,
          percentage,
          completed: percentage >= COMPLETION_THRESHOLD || completedContents.has(currentContent._id),
        },
      }));

      if (percentage >= COMPLETION_THRESHOLD && !completedContents.has(currentContent._id) && !completionInProgress) {
        handleVideoCompletion();
      }
    };

    const handleEnded = () => {
      if (!completedContents.has(currentContent._id) && !completionInProgress) {
        handleVideoCompletion();
      }
    };

    const handleError = (e) => {
      console.error("Video error:", e);
      setVideoLoading(false);
      // Handle 401 errors specifically
      if (e.target.error && e.target.error.code === 4) {
        console.error("Video access denied - authentication required");
      }
    };

    const handleWaiting = () => {
      setVideoLoading(true);
    };

    const handlePlaying = () => {
      setVideoLoading(false);
    };

    // Remove existing event listeners first
    video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    video.removeEventListener("timeupdate", handleTimeUpdate);
    video.removeEventListener("ended", handleEnded);
    video.removeEventListener("error", handleError);
    video.removeEventListener("waiting", handleWaiting);
    video.removeEventListener("playing", handlePlaying);

    // Add new event listeners
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);

    // Set up periodic check as backup
    progressIntervalRef.current = setInterval(() => {
      if (video.readyState > 0 && video.duration && video.duration !== Infinity) {
        handleTimeUpdate();
      }
    }, 2000);

    // Return cleanup function
    return () => {
      try {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("ended", handleEnded);
        video.removeEventListener("error", handleError);
        video.removeEventListener("waiting", handleWaiting);
        video.removeEventListener("playing", handlePlaying);
      } catch (e) {
        // ignore errors
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  };

  const setupYouTubeTracking = () => {
    const iframe = youtubeIframeRef.current;
    if (!iframe) return;

    // YouTube API tracking would go here
    // For now, we'll rely on manual completion for YouTube videos
    console.log("YouTube iframe loaded, manual completion required");
    setVideoLoading(false);
  };

  const getDocumentUrl = (content) => {
    if (!content) return null;
    if (content.documentUrl) return content.documentUrl;
    if (content.documentFile?.url) {
      // For local documents, we might need to implement similar streaming
      if (content.documentFile.url.startsWith('http')) {
        return content.documentFile.url;
      }
      // For local files, you might want to create a document streaming endpoint
      return content.documentFile.url;
    }
    return null;
  };

  const formatEnrollmentDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === 0 || seconds === Infinity) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getVideoProgress = (contentId) => {
    return videoProgress[contentId] || { currentTime: 0, duration: 0, percentage: 0, completed: false };
  };

  const handleVideoCompletion = async () => {
    if (!currentContent) return;
    if (completedContents.has(currentContent._id)) return;
    if (completionInProgress) return;

    try {
      setCompletionInProgress(true);
      await markContentAsCompleted(currentContent._id);

      // Find next content
      const currentIndex = courseContent.findIndex((c) => c._id === currentContent._id);
      const next = currentIndex < courseContent.length - 1 ? courseContent[currentIndex + 1] : null;
      setNextContent(next);
      setShowCompletionModal(true);

    } catch (err) {
      console.error("Error completing video:", err);
    } finally {
      setCompletionInProgress(false);
    }
  };

  const markContentAsCompleted = async (contentId) => {
    try {
      setMarkingComplete(true);
      const res = await axios.post(
        `/api/course-content/${contentId}/complete`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      // Update progress based on API response or local calculation
      const updatedCompletedContents = new Set(Array.from(completedContents));
      updatedCompletedContents.add(contentId);
      
      const completedCount = updatedCompletedContents.size;
      const totalContents = courseContent.length;
      const percentage = totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0;

      setProgress({
        completed: completedCount,
        total: totalContents,
        percentage: percentage,
      });

      if (res.data.enrollment) {
        setEnrollment((prev) => ({
          ...prev,
          ...res.data.enrollment,
        }));
      }

      setCompletedContents(updatedCompletedContents);

      // Update video progress to mark as completed
      if (currentContent?.type === "video") {
        setVideoProgress((prev) => ({
          ...prev,
          [contentId]: {
            ...prev[contentId],
            completed: true,
          },
        }));
      }

      return res.data;
    } catch (err) {
      console.error("Error marking content as completed:", err);
      throw err;
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleContentSelect = (content) => {
    setCurrentContent(content);
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
      video: "🎬",
      pdf: "📄",
      document: "📝",
      quiz: "❓",
      assignment: "📋",
    };
    return icons[type] || "📁";
  };

  const getDurationText = (content) => {
    if (!content) return "";
    if (content.type === "video" && content.duration) return content.duration;
    if (content.type === "document" || content.type === "pdf") return "Read";
    if (content.type === "quiz") return "Quiz";
    if (content.type === "assignment") return "Assignment";
    return "";
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
            <Button variant="primary" onClick={() => navigate(`/course/${courseId}`)}>
              Enroll in Course
            </Button>
            <Button variant="outline-secondary" onClick={() => navigate("/courses")}>
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
                    <ProgressBar now={progress.percentage} className={styles.progressBar} variant={enrollment?.completed ? "success" : "primary"} />
                  </div>
                </div>
              </Card.Header>
              <Card.Body className={styles.sidebarBody}>
                <ListGroup variant="flush">
                  {courseContent.map((content, index) => {
                    const isVideo = content.type === "video";
                    const videoProg = getVideoProgress(content._id);
                    const isCompleted = completedContents.has(content._id);

                    return (
                      <ListGroup.Item
                        key={content._id}
                        className={`${styles.contentItem} ${currentContent?._id === content._id ? styles.active : ""}`}
                        onClick={() => handleContentSelect(content)}
                      >
                        <div className={styles.contentInfo}>
                          <div className={styles.contentIcon}>{getContentIcon(content.type)}</div>
                          <div className={styles.contentDetails}>
                            <div className={styles.contentTitle}>{content.title}</div>
                            <div className={styles.contentMeta}>
                              <span className={styles.contentType}>{content.type}</span>
                              {getDurationText(content) && <span className={styles.contentDuration}>• {getDurationText(content)}</span>}
                              {content.isFree && (
                                <Badge bg="success" className={styles.freeBadge}>
                                  Free
                                </Badge>
                              )}
                            </div>

                            {isVideo && videoProg.percentage > 0 && !isCompleted && (
                              <div className={styles.videoProgress}>
                                <ProgressBar now={videoProg.percentage * 100} variant="info" className={styles.miniProgressBar} />
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
                            <div className={styles.contentOrder}>{index + 1}</div>
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
                      <Badge bg="secondary">{currentContent.type}</Badge>
                      {currentContent.duration && <span className={styles.duration}>Duration: {currentContent.duration}</span>}
                      {currentContent.type === "video" && videoProgress[currentContent._id] && (
                        <span className={styles.watchProgress}>Watched: {Math.round(videoProgress[currentContent._id].percentage * 100)}%</span>
                      )}
                    </div>
                  </div>
                  {!completedContents.has(currentContent._id) && currentContent.type !== "video" && (
                    <Button variant="success" size="sm" onClick={() => markContentAsCompleted(currentContent._id)} disabled={markingComplete}>
                      {markingComplete ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Marking...
                        </>
                      ) : (
                        "Mark as Complete"
                      )}
                    </Button>
                  )}
                </Card.Header>

                <Card.Body className={styles.contentBody}>
                  {currentContent.description && <div className={styles.contentDescription}><p>{currentContent.description}</p></div>}

                  {/* Video Content */}
                  {currentContent.type === "video" && (
                    <div className={styles.videoContainer}>
                      {videoLoading && (
                        <div className={styles.videoLoading}>
                          <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading video...</span>
                          </Spinner>
                          <p>Loading video content...</p>
                        </div>
                      )}
                      
                      {getVideoSrc(currentContent) ? (
                        <div className={styles.videoWrapper}>
                          {isYouTubeUrl(currentContent.videoUrl) ? (
                            <div className={styles.youtubeContainer}>
                              <div className={styles.iframeWrapper}>
                                <iframe
                                  ref={youtubeIframeRef}
                                  title={currentContent.title}
                                  src={getVideoSrc(currentContent)}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                  className={styles.youtubeIframe}
                                  onLoad={() => setVideoLoading(false)}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className={styles.localVideoContainer}>
                              <video
                                ref={videoRef}
                                controls
                                className={styles.videoPlayer}
                                src={getVideoSrc(currentContent)}
                                controlsList="nodownload"
                                preload="metadata"
                                onLoadedData={() => setVideoLoading(false)}
                                onError={(e) => {
                                  console.error("Video loading error:", e);
                                  setVideoLoading(false);
                                }}
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          )}

                          <div className={styles.videoStats}>
                            {!isYouTubeUrl(currentContent.videoUrl) && (
                              <div className={styles.progressInfo}>
                                <span>Progress: </span>
                                <ProgressBar now={getVideoProgress(currentContent._id).percentage * 100} variant="primary" className={styles.videoProgressBar} />
                                <span>
                                  {formatTime(getVideoProgress(currentContent._id).currentTime)} / {formatTime(getVideoProgress(currentContent._id).duration)}
                                </span>
                              </div>
                            )}

                            {completionInProgress && (
                              <Alert variant="info" className={styles.completionAlert}>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Marking as completed...
                              </Alert>
                            )}

                            {isYouTubeUrl(currentContent.videoUrl) && !completedContents.has(currentContent._id) && (
                              <div className={styles.youtubeNotice}>
                                <small>
                                  This is a YouTube video. Playback is displayed via embed and cannot be tracked automatically.
                                  If you've watched the lesson, click the button below to mark it complete.
                                </small>
                                <div className="mt-2">
                                  <Button variant="outline-success" size="sm" onClick={() => markContentAsCompleted(currentContent._id)} disabled={markingComplete}>
                                    {markingComplete ? "Marking..." : "Mark as Complete"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className={styles.noContent}>
                          <p>Video content not available</p>
                          <Button variant="outline-primary" onClick={() => navigate(`/course/${courseId}`)}>
                            Contact Support
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Document Content */}
                  {(currentContent.type === "document" || currentContent.type === "pdf") && (
                    <div className={styles.documentContainer}>
                      {getDocumentUrl(currentContent) ? (
                        <iframe src={getDocumentUrl(currentContent)} className={styles.documentViewer} title={currentContent.title} />
                      ) : (
                        <div className={styles.noContent}>
                          <p>Document not available</p>
                          <Button variant="outline-primary" onClick={() => navigate(`/course/${courseId}`)}>
                            Contact Support
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quiz Content */}
                  {currentContent.type === "quiz" && (
                    <div className={styles.quizContainer}>
                      <div className={styles.comingSoon}>
                        <h5>Quiz Feature Coming Soon</h5>
                        <p>Interactive quizzes are under development and will be available soon.</p>
                        <Button variant="outline-primary" onClick={() => markContentAsCompleted(currentContent._id)} disabled={completedContents.has(currentContent._id)}>
                          Mark as Completed
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Assignment Content */}
                  {currentContent.type === "assignment" && (
                    <div className={styles.assignmentContainer}>
                      <div className={styles.comingSoon}>
                        <h5>Assignment Feature Coming Soon</h5>
                        <p>Assignment submissions are under development and will be available soon.</p>
                        <Button variant="outline-primary" onClick={() => markContentAsCompleted(currentContent._id)} disabled={completedContents.has(currentContent._id)}>
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
                        const currentIndex = courseContent.findIndex((content) => content._id === currentContent._id);
                        if (currentIndex > 0) setCurrentContent(courseContent[currentIndex - 1]);
                      }}
                      disabled={courseContent.findIndex((content) => content._id === currentContent._id) === 0}
                    >
                      ← Previous
                    </Button>

                    <div className={styles.navigationInfo}>
                      Lesson {courseContent.findIndex((content) => content._id === currentContent._id) + 1} of {courseContent.length}
                    </div>

                    <Button
                      variant="primary"
                      onClick={() => {
                        const currentIndex = courseContent.findIndex((content) => content._id === currentContent._id);
                        if (currentIndex < courseContent.length - 1) setCurrentContent(courseContent[currentIndex + 1]);
                      }}
                      disabled={courseContent.findIndex((content) => content._id === currentContent._id) === courseContent.length - 1}
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
                  <Button variant="primary" onClick={() => navigate("/courses")}>
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
          <p>
            You've successfully completed <strong>{currentContent?.title}</strong>!
          </p>
          {nextContent ? (
            <p>
              Ready to move on to the next lesson: <strong>{nextContent.title}</strong>?
            </p>
          ) : (
            <p>Congratulations! You've completed all the content in this course.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleStayOnContent}>
            Stay on This Lesson
          </Button>
          <Button variant="primary" onClick={handleContinueLearning}>
            {nextContent ? "Continue to Next Lesson" : "View Course Completion"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Learning;