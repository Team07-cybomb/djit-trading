import React, { useState, useEffect } from "react";
import { Modal, Form, Button, Row, Col, Badge, Card, Alert, Spinner } from "react-bootstrap";
import axios from "axios";

const CourseContentModal = ({ show, onHide, selectedCourse, showAlert, onContentAdded }) => {
  const [uploadLoading, setUploadLoading] = useState(false);
  const [contentFormData, setContentFormData] = useState(initialFormData());
  const [videoFile, setVideoFile] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [localAlert, setLocalAlert] = useState({ show: false, message: "", type: "" });

  function initialFormData() {
    return { title: "", description: "", type: "video", videoUrl: "", documentUrl: "", duration: "", order: 1, isFree: false };
  }

  const getAuthToken = () => localStorage.getItem("adminToken") || localStorage.getItem("token");

  const api = axios.create({ baseURL: "http://localhost:5000/api" });
  api.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  useEffect(() => {
    if (selectedCourse && show) {
      setContentFormData(initialFormData());
      setVideoFile(null);
      setDocumentFile(null);
    }
  }, [selectedCourse, show]);

  const showLocalAlert = (message, type) => {
    setLocalAlert({ show: true, message, type });
    setTimeout(() => setLocalAlert({ show: false, message: "", type: "" }), 4000);
  };

  const handleContentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return showLocalAlert("No course selected", "danger");
    if (!contentFormData.title.trim()) return showLocalAlert("Please enter a content title", "danger");
    if (contentFormData.type === "video" && !videoFile && !contentFormData.videoUrl.trim())
      return showLocalAlert("Please upload a video file or enter a video URL", "danger");
    if ((contentFormData.type === "document" || contentFormData.type === "pdf") && !documentFile && !contentFormData.documentUrl.trim())
      return showLocalAlert("Please upload a document or provide a document URL", "danger");

    try {
      setUploadLoading(true);
      const formData = new FormData();
      Object.entries(contentFormData).forEach(([key, value]) => formData.append(key, value));
      formData.append("courseId", selectedCourse._id);
      if (videoFile) formData.append("videoFile", videoFile);
      if (documentFile) formData.append("documentFile", documentFile);

      const res = await api.post("/course-content/upload", formData, { headers: { "Content-Type": "multipart/form-data" }, timeout: 300000 });

      showAlert("Content added successfully", "success");
      showLocalAlert("Content added successfully", "success");

      setContentFormData((prev) => ({ ...initialFormData(), order: prev.order + 1 }));
      setVideoFile(null);
      setDocumentFile(null);

      // ✅ Safe replacement for optional chaining
      const videoInput = document.getElementById("videoFileInput");
      if (videoInput) videoInput.value = "";
      const documentInput = document.getElementById("documentFileInput");
      if (documentInput) documentInput.value = "";

      if (onContentAdded) onContentAdded(res.data.content);
    } catch (error) {
      console.error("Upload error:", error);
      let msg = "Error adding content";
      if (error.response) {
        msg = error.response.data?.message || `Server error: ${error.response.status}`;
        if (error.response.status === 413) msg = "File too large.";
        if (error.response.status === 415) msg = "Unsupported file type.";
      } else if (error.request) msg = "Network error. Backend not reachable.";
      else msg = error.message;
      showAlert(msg, "danger");
      showLocalAlert(msg, "danger");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) return showLocalAlert("Please select a valid video file", "danger");
    if (file.size > 500 * 1024 * 1024) return showLocalAlert("Max video size is 500MB", "danger");
    setVideoFile(file);
    setContentFormData((p) => ({ ...p, videoUrl: "" }));
    showLocalAlert(`Video selected: ${file.name} (${(file.size / 1048576).toFixed(2)} MB)`, "info");
  };

  const handleDocumentFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.ms-powerpoint","application/vnd.openxmlformats-officedocument.presentationml.presentation","text/plain"];
    if (!allowed.includes(file.type)) return showLocalAlert("Invalid file. Allowed: PDF, Word, PPT, Text", "danger");
    if (file.size > 50 * 1024 * 1024) return showLocalAlert("Max document size is 50MB", "danger");
    setDocumentFile(file);
    setContentFormData((p) => ({ ...p, documentUrl: "" }));
    showLocalAlert(`Document selected: ${file.name} (${(file.size / 1048576).toFixed(2)} MB)`, "info");
  };

  const clearFile = (type) => {
    if (type === "video") {
      setVideoFile(null);
      const videoInput = document.getElementById("videoFileInput");
      if (videoInput) videoInput.value = "";
    } else {
      setDocumentFile(null);
      const documentInput = document.getElementById("documentFileInput");
      if (documentInput) documentInput.value = "";
    }
  };

  const handleModalClose = () => {
    setContentFormData(initialFormData());
    setVideoFile(null);
    setDocumentFile(null);
    setLocalAlert({ show: false, message: "", type: "" });
    onHide();
  };

  return (
    <Modal show={show} onHide={handleModalClose} size="lg" backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>Add Content {selectedCourse ? ` - ${selectedCourse.title}` : ""}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {localAlert.show && <Alert variant={localAlert.type} dismissible onClose={() => setLocalAlert({ show: false, message: "", type: "" })}>{localAlert.message}</Alert>}
        <Card>
          <Card.Header><h6 className="mb-0">Add New Content</h6></Card.Header>
          <Card.Body>
            <Form onSubmit={handleContentSubmit}>
              {/* Title & Description */}
              <Form.Group className="mb-3">
                <Form.Label>Content Title *</Form.Label>
                <Form.Control type="text" value={contentFormData.title} onChange={(e) => setContentFormData({ ...contentFormData, title: e.target.value })} placeholder="Enter content title" required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control as="textarea" rows={2} value={contentFormData.description} onChange={(e) => setContentFormData({ ...contentFormData, description: e.target.value })} placeholder="Optional description" />
              </Form.Group>

              {/* Type & Order */}
              <Row>
                <Col md={6}><Form.Group className="mb-3">
                  <Form.Label>Content Type *</Form.Label>
                  <Form.Select value={contentFormData.type} onChange={(e) => setContentFormData({ ...contentFormData, type: e.target.value })}>
                    <option value="video">Video</option>
                    <option value="document">Document</option>
                    <option value="pdf">PDF</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                  </Form.Select>
                </Form.Group></Col>
                <Col md={6}><Form.Group className="mb-3">
                  <Form.Label>Order *</Form.Label>
                  <Form.Control type="number" min="1" value={contentFormData.order} onChange={(e) => setContentFormData({ ...contentFormData, order: parseInt(e.target.value) || 1 })} required />
                </Form.Group></Col>
              </Row>

              {/* Video */}
              {contentFormData.type === "video" && <>
                <Form.Group className="mb-3">
                  <Form.Label>Upload Video</Form.Label>
                  <Form.Control id="videoFileInput" type="file" accept="video/*" onChange={handleVideoFileChange} />
                  <Form.Text>Max 500MB. MP4/AVI/MOV</Form.Text>
                  {videoFile && <div className="mt-2 d-flex gap-2"><Badge bg="info" className="flex-grow-1 text-truncate">{videoFile.name} ({(videoFile.size / 1048576).toFixed(2)} MB)</Badge><Button size="sm" variant="outline-danger" onClick={() => clearFile("video")}>×</Button></div>}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Or Video URL</Form.Label>
                  <Form.Control type="url" placeholder="https://youtube.com/embed/..." value={contentFormData.videoUrl} onChange={(e) => setContentFormData({ ...contentFormData, videoUrl: e.target.value })} disabled={!!videoFile} />
                </Form.Group>
              </>}

              {/* Document */}
              {(contentFormData.type === "document" || contentFormData.type === "pdf") && <>
                <Form.Group className="mb-3">
                  <Form.Label>Upload Document</Form.Label>
                  <Form.Control id="documentFileInput" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" onChange={handleDocumentFileChange} />
                  <Form.Text>Max 50MB. PDF/Word/PPT/Text</Form.Text>
                  {documentFile && <div className="mt-2 d-flex gap-2"><Badge bg="info" className="flex-grow-1 text-truncate">{documentFile.name} ({(documentFile.size / 1048576).toFixed(2)} MB)</Badge><Button size="sm" variant="outline-danger" onClick={() => clearFile("document")}>×</Button></div>}
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Or Document URL</Form.Label>
                  <Form.Control type="url" placeholder="https://example.com/doc.pdf" value={contentFormData.documentUrl} onChange={(e) => setContentFormData({ ...contentFormData, documentUrl: e.target.value })} disabled={!!documentFile} />
                </Form.Group>
              </>}

              {/* Duration & Free */}
              <Form.Group className="mb-3">
                <Form.Label>Duration</Form.Label>
                <Form.Control type="text" placeholder="Optional" value={contentFormData.duration} onChange={(e) => setContentFormData({ ...contentFormData, duration: e.target.value })} />
              </Form.Group>
              <Form.Check type="checkbox" label="Free Preview" checked={contentFormData.isFree} onChange={(e) => setContentFormData({ ...contentFormData, isFree: e.target.checked })} className="mb-3" />

              <Button type="submit" variant="primary" disabled={uploadLoading} className="w-100">
                {uploadLoading ? <><Spinner as="span" animation="border" size="sm" className="me-2"/>Uploading...</> : "Add Content"}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer><Button variant="secondary" onClick={handleModalClose}>Close</Button></Modal.Footer>
    </Modal>
  );
};

export default CourseContentModal;
