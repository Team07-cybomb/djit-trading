import React, { useState, useEffect } from 'react'
import { Modal, Form, Button, Row, Col, Badge, Card, Alert } from 'react-bootstrap'
import axios from 'axios'

const CourseContentModal = ({ show, onHide, selectedCourse, showAlert, onContentAdded }) => {
  const [uploadLoading, setUploadLoading] = useState(false)
  const [contentFormData, setContentFormData] = useState({
    title: '',
    description: '',
    type: 'video',
    videoUrl: '',
    documentUrl: '',
    duration: '',
    order: 1,
    isFree: false
  })
  const [videoFile, setVideoFile] = useState(null)
  const [documentFile, setDocumentFile] = useState(null)
  const [localAlert, setLocalAlert] = useState({ show: false, message: '', type: '' })

  // Get authentication token
  const getAuthToken = () => {
    return localStorage.getItem('adminToken') || localStorage.getItem('token')
  }

  // Create axios instance with auth header
  const api = axios.create({
    baseURL: 'http://localhost:5000/api' // Use full URL to avoid proxy issues
  })

  // Add request interceptor to include auth token
  api.interceptors.request.use(
    (config) => {
      const token = getAuthToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  useEffect(() => {
    if (selectedCourse && show) {
      // Reset form when modal opens
      setContentFormData({
        title: '',
        description: '',
        type: 'video',
        videoUrl: '',
        documentUrl: '',
        duration: '',
        order: 1,
        isFree: false
      })
      setVideoFile(null)
      setDocumentFile(null)
    }
  }, [selectedCourse, show])

  const showLocalAlert = (message, type) => {
    setLocalAlert({ show: true, message, type })
    setTimeout(() => setLocalAlert({ show: false, message: '', type: '' }), 5000)
  }

  const handleContentSubmit = async (e) => {
    e.preventDefault()
    if (!selectedCourse) {
      showLocalAlert('No course selected', 'danger')
      return
    }

    // Basic validation
    if (!contentFormData.title.trim()) {
      showLocalAlert('Please enter a content title', 'danger')
      return
    }

    if (contentFormData.type === 'video' && !videoFile && !contentFormData.videoUrl) {
      showLocalAlert('Please provide either a video file or video URL', 'danger')
      return
    }

    if ((contentFormData.type === 'document' || contentFormData.type === 'pdf') && !documentFile && !contentFormData.documentUrl) {
      showLocalAlert('Please provide either a document file or document URL', 'danger')
      return
    }

    try {
      setUploadLoading(true)
      
      const formData = new FormData()
      
      // Append form data
      formData.append('title', contentFormData.title.trim())
      formData.append('description', contentFormData.description.trim())
      formData.append('type', contentFormData.type)
      formData.append('duration', contentFormData.duration.trim())
      formData.append('order', contentFormData.order.toString())
      formData.append('isFree', contentFormData.isFree.toString())
      
      // Append URLs if no files
      if (!videoFile && contentFormData.videoUrl) {
        formData.append('videoUrl', contentFormData.videoUrl.trim())
      }
      if (!documentFile && contentFormData.documentUrl) {
        formData.append('documentUrl', contentFormData.documentUrl.trim())
      }
      
      // Append files
      if (videoFile) {
        formData.append('videoFile', videoFile)
        console.log('📤 Appending video file:', videoFile.name)
      }
      if (documentFile) {
        formData.append('documentFile', documentFile)
        console.log('📤 Appending document file:', documentFile.name)
      }

      console.log('🚀 Submitting content for course:', selectedCourse._id)
      console.log('📦 FormData entries:')
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value instanceof File ? `${value.name} (${value.size} bytes)` : value)
      }

      const response = await api.post(`/admin/courses/${selectedCourse._id}/content`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 300000 // 5 minutes timeout for large files
      })
      
      console.log('✅ Content added successfully:', response.data)
      
      showAlert('Content added successfully', 'success')
      showLocalAlert('Content added successfully', 'success')
      
      // Reset form for next content
      setContentFormData(prev => ({
        title: '',
        description: '',
        type: 'video',
        videoUrl: '',
        documentUrl: '',
        duration: '',
        order: prev.order + 1, // Increment order for next item
        isFree: false
      }))
      setVideoFile(null)
      setDocumentFile(null)
      
      // Reset file inputs
      const videoInput = document.getElementById('videoFileInput')
      const documentInput = document.getElementById('documentFileInput')
      if (videoInput) videoInput.value = ''
      if (documentInput) documentInput.value = ''
      
      // Notify parent component that content was added
      if (onContentAdded) {
        onContentAdded(response.data.content)
      }
      
    } catch (error) {
      console.error('❌ Error adding content:', error)
      let errorMessage = 'Error adding content'
      
      if (error.response) {
        console.error('Response error:', error.response.data)
        errorMessage = error.response.data?.message || `Error: ${error.response.status}`
        
        // Handle specific error cases
        if (error.response.status === 413) {
          errorMessage = 'File too large. Please check file size limits.'
        } else if (error.response.status === 415) {
          errorMessage = 'Unsupported file type. Please check file format.'
        } else if (error.response.status === 500) {
          errorMessage = 'Server error. Please check server logs.'
        }
      } else if (error.request) {
        console.error('Request error:', error.request)
        errorMessage = 'Network error - cannot reach server. Make sure backend is running on port 5000.'
      } else {
        errorMessage = error.message
      }
      
      showAlert(errorMessage, 'danger')
      showLocalAlert(errorMessage, 'danger')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleVideoFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('video/')) {
        showLocalAlert('Please select a valid video file', 'danger')
        e.target.value = ''
        return
      }
      if (file.size > 500 * 1024 * 1024) {
        showLocalAlert('Video file too large. Maximum size is 500MB.', 'danger')
        e.target.value = ''
        return
      }
      setVideoFile(file)
      setContentFormData(prev => ({ ...prev, videoUrl: '' }))
      showLocalAlert(`Video file selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`, 'info')
    }
  }

  const handleDocumentFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        showLocalAlert('Please select a valid document file (PDF, Word, PowerPoint, Text)', 'danger')
        e.target.value = ''
        return
      }
      
      if (file.size > 50 * 1024 * 1024) {
        showLocalAlert('Document file too large. Maximum size is 50MB.', 'danger')
        e.target.value = ''
        return
      }
      
      setDocumentFile(file)
      setContentFormData(prev => ({ ...prev, documentUrl: '' }))
      showLocalAlert(`Document file selected: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`, 'info')
    }
  }

  const handleModalClose = () => {
    // Reset all states when modal closes
    setContentFormData({
      title: '',
      description: '',
      type: 'video',
      videoUrl: '',
      documentUrl: '',
      duration: '',
      order: 1,
      isFree: false
    })
    setVideoFile(null)
    setDocumentFile(null)
    setLocalAlert({ show: false, message: '', type: '' })
    onHide()
  }

  const clearFile = (fileType) => {
    if (fileType === 'video') {
      setVideoFile(null)
      const videoInput = document.getElementById('videoFileInput')
      if (videoInput) videoInput.value = ''
    } else if (fileType === 'document') {
      setDocumentFile(null)
      const documentInput = document.getElementById('documentFileInput')
      if (documentInput) documentInput.value = ''
    }
  }

  return (
    <Modal show={show} onHide={handleModalClose} size="lg" backdrop="static" keyboard={false}>
      <Modal.Header closeButton>
        <Modal.Title>
          Add Content - {selectedCourse?.title}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {localAlert.show && (
          <Alert variant={localAlert.type} dismissible onClose={() => setLocalAlert({ show: false, message: '', type: '' })}>
            {localAlert.message}
          </Alert>
        )}

        <Card>
          <Card.Header>
            <h6 className="mb-0">Add New Content</h6>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleContentSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Content Title *</Form.Label>
                <Form.Control
                  type="text"
                  value={contentFormData.title}
                  onChange={(e) => setContentFormData({ ...contentFormData, title: e.target.value })}
                  required
                  placeholder="Enter content title"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={contentFormData.description}
                  onChange={(e) => setContentFormData({ ...contentFormData, description: e.target.value })}
                  placeholder="Enter content description (optional)"
                />
              </Form.Group>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Content Type *</Form.Label>
                    <Form.Select
                      value={contentFormData.type}
                      onChange={(e) => setContentFormData({ ...contentFormData, type: e.target.value })}
                    >
                      <option value="video">Video</option>
                      <option value="document">Document</option>
                      <option value="pdf">PDF</option>
                      <option value="quiz">Quiz</option>
                      <option value="assignment">Assignment</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Order *</Form.Label>
                    <Form.Control
                      type="number"
                      value={contentFormData.order}
                      onChange={(e) => setContentFormData({ ...contentFormData, order: parseInt(e.target.value) || 1 })}
                      min="1"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              {/* File Upload for Videos */}
              {contentFormData.type === 'video' && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Upload Video File</Form.Label>
                    <Form.Control
                      id="videoFileInput"
                      type="file"
                      accept="video/*"
                      onChange={handleVideoFileChange}
                    />
                    <Form.Text className="text-muted">
                      Supported formats: MP4, AVI, MOV, etc. Max size: 500MB
                    </Form.Text>
                    {videoFile && (
                      <div className="mt-2 d-flex align-items-center gap-2">
                        <Badge bg="info" className="flex-grow-1">
                          Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => clearFile('video')}
                        >
                          ×
                        </Button>
                      </div>
                    )}
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Or Video URL</Form.Label>
                    <Form.Control
                      type="url"
                      value={contentFormData.videoUrl}
                      onChange={(e) => setContentFormData({ ...contentFormData, videoUrl: e.target.value })}
                      placeholder="https://youtube.com/embed/..."
                      disabled={!!videoFile}
                    />
                    <Form.Text className="text-muted">
                      Use embedded URL for YouTube videos
                    </Form.Text>
                  </Form.Group>
                </>
              )}

              {/* File Upload for Documents */}
              {(contentFormData.type === 'document' || contentFormData.type === 'pdf') && (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Upload Document</Form.Label>
                    <Form.Control
                      id="documentFileInput"
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                      onChange={handleDocumentFileChange}
                    />
                    <Form.Text className="text-muted">
                      Supported formats: PDF, Word, PowerPoint, Text. Max size: 50MB
                    </Form.Text>
                    {documentFile && (
                      <div className="mt-2 d-flex align-items-center gap-2">
                        <Badge bg="info" className="flex-grow-1">
                          Selected: {documentFile.name} ({(documentFile.size / (1024 * 1024)).toFixed(2)} MB)
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => clearFile('document')}
                        >
                          ×
                        </Button>
                      </div>
                    )}
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Or Document URL</Form.Label>
                    <Form.Control
                      type="url"
                      value={contentFormData.documentUrl}
                      onChange={(e) => setContentFormData({ ...contentFormData, documentUrl: e.target.value })}
                      placeholder="https://example.com/document.pdf"
                      disabled={!!documentFile}
                    />
                  </Form.Group>
                </>
              )}

              <Form.Group className="mb-3">
                <Form.Label>Duration</Form.Label>
                <Form.Control
                  type="text"
                  value={contentFormData.duration}
                  onChange={(e) => setContentFormData({ ...contentFormData, duration: e.target.value })}
                  placeholder="e.g., 15 minutes (optional)"
                />
              </Form.Group>

              <Form.Check
                type="checkbox"
                label="Free Preview (Available without enrollment)"
                checked={contentFormData.isFree}
                onChange={(e) => setContentFormData({ ...contentFormData, isFree: e.target.checked })}
                className="mb-3"
              />

              <Button 
                type="submit" 
                variant="primary" 
                disabled={uploadLoading}
                className="w-100"
              >
                {uploadLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Adding Content...
                  </>
                ) : (
                  'Add Content'
                )}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleModalClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default CourseContentModal