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
  const [videoBlobUrls, setVideoBlobUrls] = useState({});

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, isAuthenticated]);

  // Clean up blob URLs and intervals on unmount
  useEffect(() => {
    return () => {
      // Clean up blob URLs to prevent memory leaks
      Object.values(videoBlobUrls).forEach(blobUrl => {
        if (blobUrl && blobUrl.startsWith('blob:')) {
          URL.revokeObjectURL(blobUrl);
        }
      });
      
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [videoBlobUrls]);

  // When currentContent changes and it's a video, set up tracking and fetch blob URL
  useEffect(() => {
    if (currentContent?.type === "video") {
      // Fetch blob URL for local videos
      if (currentContent.videoFile?.url && !isYouTubeUrl(currentContent.videoUrl)) {
        fetchVideoBlobUrl(currentContent._id);
      }
      const cleanup = setupVideoTracking();
      return cleanup;
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

      // set completedContents (make a Set)
      setCompletedContents(new Set(res.data.progress.completedContentIds || []));

      setProgress({
        completed: res.data.progress.completed || 0,
        total: res.data.progress.total || contents.length,
        percentage: res.data.progress.percentage || 0,
      });

      // Initialize video progress tracking
      const initialVideoProgress = {};
      contents.forEach((content) => {
        if (content.type === "video") {
          initialVideoProgress[content._id] = {
            currentTime: 0,
            duration: content.duration || 0,
            percentage: 0,
            completed: false,
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

  const fetchVideoBlobUrl = async (contentId) => {
    try {
      // Check if we already have a blob URL for this content
      if (videoBlobUrls[contentId]) {
        return videoBlobUrls[contentId];
      }

      const response = await axios.get(`/api/course-content/video/${contentId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const blobUrl = URL.createObjectURL(blob);

      setVideoBlobUrls(prev => ({
        ...prev,
        [contentId]: blobUrl
      }));

      return blobUrl;
    } catch (error) {
      console.error('Error fetching video blob:', error);
      return null;
    }
  };

  const setupVideoTracking = () => {
    const isYouTube = isYouTubeUrl(currentContent?.videoUrl);
    const video = videoRef.current;

    if (!video || isYouTube) {
      return () => {};
    }

    const handleLoadedMetadata = () => {
      setVideoProgress((prev) => ({
        ...prev,
        [currentContent._id]: {
          ...prev[currentContent._id],
          duration: video.duration || prev[currentContent._id]?.duration || 0,
        },
      }));
    };

    const handleTimeUpdate = () => {
      if (!video.duration) return;

      const currentTime = video.currentTime;
      const duration = video.duration;
      const percentage = currentTime / duration;

      setVideoProgress((prev) => ({
        ...prev,
        [currentContent._id]: {
          currentTime,
          duration,
          percentage,
          completed: percentage >= COMPLETION_THRESHOLD,
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

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    // Periodic check (safe if timeupdate doesn't fire)
    progressIntervalRef.current = setInterval(() => {
      if (video.readyState > 0) {
        handleTimeUpdate();
      }
    }, 1000);

    // Return cleanup function to be used by the effect
    return () => {
      try {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("timeupdate", handleTimeUpdate);
        video.removeEventListener("ended", handleEnded);
      } catch (e) {
        // ignore
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
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

  const getVideoUrl = async (content) => {
    if (!content) return null;

    // YouTube videos - use embed URL
    if (content.videoUrl && isYouTubeUrl(content.videoUrl)) {
      const videoId = extractYouTubeId(content.videoUrl);
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return content.videoUrl;
    }

    // Local videos - use blob URL
    if (content.videoFile?.url) {
      const blobUrl = await fetchVideoBlobUrl(content._id);
      return blobUrl;
    }

    return null;
  };

  const [currentVideoUrl, setCurrentVideoUrl] = useState(null);

  // Effect to load video URL when currentContent changes
  useEffect(() => {
    const loadVideoUrl = async () => {
      if (currentContent?.type === 'video') {
        const url = await getVideoUrl(currentContent);
        setCurrentVideoUrl(url);
      } else {
        setCurrentVideoUrl(null);
      }
    };

    loadVideoUrl();
  }, [currentContent]);

  const getDocumentUrl = (content) => {
    if (!content) return null;
    if (content.documentUrl) return content.documentUrl;
    if (content.documentFile?.url) {
      // For documents, we can still use direct URLs or implement blob streaming if needed
      if (content.documentFile.url.startsWith('http')) {
        return content.documentFile.url;
      }
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://your-production-domain.com'
        : 'http://localhost:5000';
      
      const cleanPath = content.documentFile.url.startsWith('/') 
        ? content.documentFile.url.substring(1) 
        : content.documentFile.url;
      
      return `${backendUrl}/${cleanPath}`;
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
    const mins = Math.floor(seconds / 60) || 0;
    const secs = Math.floor(seconds % 60) || 0;
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
      setMarkingComplete(true);

      const response = await markContentAsCompleted(currentContent._id);

      // update next content
      const currentIndex = courseContent.findIndex((c) => c._id === currentContent._id);
      const next = currentIndex < courseContent.length - 1 ? courseContent[currentIndex + 1] : null;
      setNextContent(next);
      setShowCompletionModal(true);

    } catch (err) {
      console.error("Error completing video:", err);
    } finally {
      setMarkingComplete(false);
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

      const returnedProgress = res.data.progress || {};
      setProgress({
        completed: returnedProgress.completed ?? progress.completed,
        total: returnedProgress.total ?? progress.total,
        percentage: returnedProgress.percentage ?? progress.percentage,
      });

      if (res.data.enrollment) {
        setEnrollment((prev) => ({
          ...prev,
          ...res.data.enrollment,
        }));
      }

      setCompletedContents((prev) => {
        const newSet = new Set(Array.from(prev));
        newSet.add(contentId);
        return newSet;
      });

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
    // If switching to local video, reset its currentTime to 0 to restart view
    if (content.type === "video" && videoRef.current && !isYouTubeUrl(content.videoUrl)) {
      try {
        videoRef.current.currentTime = 0;
      } catch (e) {
        // ignore cross-origin issues (iframe etc.)
      }
    }
  };

  const handleContinueLearning = () => {
    setShowCompletionModal(false);
    if (nextContent) setCurrentContent(nextContent);
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
                      {currentVideoUrl ? (
                        <div className={styles.videoWrapper}>
                          {isYouTubeUrl(currentContent.videoUrl) ? (
                            <div className={styles.youtubeContainer}>
                              <div className={styles.iframeWrapper}>
                                <iframe
                                  title={currentContent.title}
                                  src={currentVideoUrl}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                  className={styles.youtubeIframe}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className={styles.localVideoContainer}>
                              <video
                                ref={videoRef}
                                controls
                                className={styles.videoPlayer}
                                src={currentVideoUrl}
                                controlsList="nodownload"
                                preload="metadata"
                                onError={(e) => {
                                  console.error("Video loading error:", e);
                                  e.target.style.display = 'none';
                                }}
                              >
                                Your browser does not support the video tag.
                              </video>
                            </div>
                          )}

                          <div className={styles.videoStats}>
                            <div className={styles.progressInfo}>
                              <span>Progress: </span>
                              <ProgressBar now={getVideoProgress(currentContent._id).percentage * 100} variant="primary" className={styles.videoProgressBar} />
                              <span>
                                {formatTime(getVideoProgress(currentContent._id).currentTime)} / {formatTime(getVideoProgress(currentContent._id).duration)}
                              </span>
                            </div>

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