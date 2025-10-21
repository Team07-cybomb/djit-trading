import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Badge, Form, InputGroup, Modal, Alert, Image, Row, Col, ProgressBar } from 'react-bootstrap'
import axios from 'axios'
import * as XLSX from 'xlsx'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showBatchStatsModal, setShowBatchStatsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetails, setUserDetails] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [alert, setAlert] = useState({ show: false, message: '', type: '' })
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [importResults, setImportResults] = useState(null)
  const [importLoading, setImportLoading] = useState(false)
  const [batchStats, setBatchStats] = useState(null)
  const [csvFile, setCsvFile] = useState(null)
  const [batchName, setBatchName] = useState('')

  // Get authentication token
  const getAuthToken = () => {
    return localStorage.getItem('adminToken') || localStorage.getItem('token')
  }

  // Create axios instance with auth header
  const api = axios.create({
    baseURL: '/api'
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
    fetchUsers()
  }, [currentPage, searchTerm, selectedBatch])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/users?page=${currentPage}&search=${searchTerm}&batch=${selectedBatch}`)
      setUsers(response.data.users)
      setTotalPages(response.data.totalPages)
      setBatches(response.data.batches || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      if (error.response?.status === 403) {
        showAlert('Access denied. Admin privileges required.', 'danger')
      } else if (error.response?.status === 401) {
        showAlert('Please login again.', 'danger')
      } else {
        showAlert('Error fetching users', 'danger')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchUserDetails = async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}/details`)
      setUserDetails(response.data.user)
      setShowDetailsModal(true)
    } catch (error) {
      console.error('Error fetching user details:', error)
      showAlert('Error fetching user details', 'danger')
    }
  }

  const fetchBatchStats = async () => {
    try {
      const response = await api.get('/admin/users/batch-stats')
      setBatchStats(response.data)
      setShowBatchStatsModal(true)
    } catch (error) {
      console.error('Error fetching batch stats:', error)
      showAlert('Error fetching batch statistics', 'danger')
    }
  }

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000)
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleBatchChange = (e) => {
    setSelectedBatch(e.target.value)
    setCurrentPage(1)
  }

  const handleRoleChange = (user) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setShowRoleModal(true)
  }

  const handleViewDetails = (user) => {
    setSelectedUser(user)
    fetchUserDetails(user._id)
  }

  const updateUserRole = async () => {
    try {
      await api.put(`/admin/users/${selectedUser._id}/role`, { role: newRole })
      showAlert('User role updated successfully', 'success')
      setShowRoleModal(false)
      fetchUsers()
    } catch (error) {
      console.error('Error updating user role:', error)
      if (error.response?.status === 403) {
        showAlert('You do not have permission to update user roles', 'danger')
      } else {
        showAlert('Error updating user role', 'danger')
      }
    }
  }

  const deleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/users/${userId}`)
        showAlert('User deleted successfully', 'success')
        fetchUsers()
      } catch (error) {
        console.error('Error deleting user:', error)
        if (error.response?.status === 403) {
          showAlert('You do not have permission to delete users', 'danger')
        } else {
          showAlert('Error deleting user', 'danger')
        }
      }
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      setCsvFile(file)
      // Generate batch name from filename
      const nameWithoutExt = file.name.replace('.csv', '')
      setBatchName(nameWithoutExt)
    }
  }

  const importCSV = async () => {
    if (!csvFile) {
      showAlert('Please select a CSV file to import', 'warning')
      return
    }

    try {
      setImportLoading(true)
      const formData = new FormData()
      formData.append('csvFile', csvFile)
      formData.append('batchName', batchName)

      const response = await api.post('/admin/users/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setImportResults(response.data)
      showAlert(`CSV import completed! ${response.data.results.successful} users imported successfully.`, 'success')
      setCsvFile(null)
      setBatchName('')
      fetchUsers()
    } catch (error) {
      console.error('Error importing CSV:', error)
      showAlert('Error importing CSV file', 'danger')
    } finally {
      setImportLoading(false)
    }
  }

  // Get profile picture URL or return null
  const getProfilePicture = (user) => {
    if (user?.profile?.profilePicture?.url) {
      return user.profile.profilePicture.url
    }
    return null
  }

  // Get initials for avatar fallback
  const getInitials = (user) => {
    if (user?.profile?.firstName && user?.profile?.lastName) {
      return `${user.profile.firstName.charAt(0)}${user.profile.lastName.charAt(0)}`.toUpperCase()
    }
    return user?.username?.charAt(0).toUpperCase() || 'U'
  }

  const exportToExcel = () => {
    try {
      // Prepare data for export
      const exportData = users.map(user => ({
        'Username': user.username,
        'Email': user.email,
        'First Name': user.profile?.firstName || '',
        'Last Name': user.profile?.lastName || '',
        'Phone': user.profile?.phone || '',
        'Alternate Phone': user.profile?.phone2 || '',
        'Birthday': user.profile?.birthday ? new Date(user.profile.birthday).toLocaleDateString() : '',
        'TradingView ID': user.profile?.tradingViewId || '',
        'Discord ID': user.profile?.discordId || '',
        'Trading Segment': user.profile?.tradingSegment || '',
        'Badge': user.profile?.badge || '',
        'Profile Picture': getProfilePicture(user) || 'No picture',
        'Role': user.role,
        'Batch': user.batch || 'default',
        'Import Source': user.importSource || 'manual',
        'Status': user.isActive !== false ? 'Active' : 'Inactive',
        'Verified': user.isVerified ? 'Yes' : 'No',
        'Joined Date': new Date(user.createdAt).toLocaleDateString(),
        'Street': user.profile?.address?.street || '',
        'City': user.profile?.address?.city || '',
        'State': user.profile?.address?.state || '',
        'ZIP Code': user.profile?.address?.zipCode || '',
        'Country': user.profile?.address?.country || ''
      }))

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      // Set column widths
      const colWidths = [
        { wch: 15 }, // Username
        { wch: 25 }, // Email
        { wch: 15 }, // First Name
        { wch: 15 }, // Last Name
        { wch: 15 }, // Phone
        { wch: 15 }, // Alternate Phone
        { wch: 12 }, // Birthday
        { wch: 15 }, // TradingView ID
        { wch: 15 }, // Discord ID
        { wch: 15 }, // Trading Segment
        { wch: 12 }, // Badge
        { wch: 20 }, // Profile Picture
        { wch: 10 }, // Role
        { wch: 15 }, // Batch
        { wch: 15 }, // Import Source
        { wch: 10 }, // Status
        { wch: 10 }, // Verified
        { wch: 12 }, // Joined Date
        { wch: 20 }, // Street
        { wch: 15 }, // City
        { wch: 15 }, // State
        { wch: 10 }, // ZIP Code
        { wch: 15 }  // Country
      ]
      ws['!cols'] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Users')

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const filename = `users_export_${timestamp}.xlsx`

      // Download the file
      XLSX.writeFile(wb, filename)
      showAlert('User data exported successfully!', 'success')
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      showAlert('Error exporting user data', 'danger')
    }
  }

  const getRoleVariant = (role) => {
    switch (role) {
      case 'admin': return 'danger'
      case 'user': return 'primary'
      default: return 'secondary'
    }
  }

  const getBadgeVariant = (badge) => {
    switch (badge) {
      case 'Beginner': return 'success'
      case 'Intermediate': return 'warning'
      case 'Advanced': return 'danger'
      case 'Pro': return 'primary'
      default: return 'secondary'
    }
  }

  const getImportSourceVariant = (source) => {
    switch (source) {
      case 'csv_import': return 'info'
      case 'manual': return 'secondary'
      default: return 'secondary'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const getPageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    
    return pages
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>User Management</h2>
        <div className="d-flex align-items-center gap-3">
          <div className="text-muted">
            {loading ? 'Loading...' : `Total Users: ${users.length}`}
          </div>
          <Button 
            variant="info" 
            onClick={fetchBatchStats}
            disabled={loading}
          >
            📊 Batch Stats
          </Button>
          <Button 
            variant="primary" 
            onClick={() => setShowImportModal(true)}
          >
            📁 Import CSV
          </Button>
          <Button 
            variant="success" 
            onClick={exportToExcel}
            disabled={users.length === 0 || loading}
          >
            📊 Export to Excel
          </Button>
        </div>
      </div>

      {alert.show && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false, message: '', type: '' })}>
          {alert.message}
        </Alert>
      )}

      <Card className="admin-card mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search users by username, email, or name..."
                  value={searchTerm}
                  onChange={handleSearch}
                />
                <Button variant="outline-secondary">
                  🔍 Search
                </Button>
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select
                value={selectedBatch}
                onChange={handleBatchChange}
              >
                <option value="">All Batches</option>
                {batches.map((batch, index) => (
                  <option key={index} value={batch}>
                    {batch}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col md={3} className="text-end">
              <small className="text-muted">
                Search by: username, email, first name, last name, phone, trading segment
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="admin-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">All Users</h5>
          <div className="d-flex align-items-center gap-2">
            <Badge bg="primary">{users.length} users</Badge>
            {selectedBatch && (
              <Badge bg="info">Batch: {selectedBatch}</Badge>
            )}
          </div>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading users...</p>
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="table-responsive">
                <Table hover striped>
                  <thead className="table-dark">
                    <tr>
                      <th>Profile</th>
                      <th>User Info</th>
                      <th>Contact</th>
                      <th>Trading Details</th>
                      <th>Role</th>
                      <th>Batch</th>
                      <th>Joined</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <div className="d-flex align-items-center">
                            {getProfilePicture(user) ? (
                              <Image
                                src={getProfilePicture(user)}
                                roundedCircle
                                style={{width: '45px', height: '45px', objectFit: 'cover'}}
                                alt={`${user.username}'s profile`}
                                className="me-2"
                              />
                            ) : (
                              <div 
                                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                                style={{width: '45px', height: '45px', fontSize: '0.9rem'}}
                              >
                                {getInitials(user)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{user.username}</strong>
                            <div>
                              <small className="text-muted">
                                {user.profile?.firstName} {user.profile?.lastName}
                              </small>
                            </div>
                            {user.profile?.badge && (
                              <Badge bg={getBadgeVariant(user.profile.badge)} size="sm" className="mt-1">
                                {user.profile.badge}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td>
                          <div>{user.email}</div>
                          <div>
                            <small className="text-muted">
                              {user.profile?.phone || 'No phone'}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div>
                            {user.profile?.tradingSegment && (
                              <Badge bg="info" className="mb-1">
                                {user.profile.tradingSegment}
                              </Badge>
                            )}
                            <div>
                              <small className="text-muted">
                                TV: {user.profile?.tradingViewId || 'N/A'}
                              </small>
                            </div>
                            <div>
                              <small className="text-muted">
                                Discord: {user.profile?.discordId || 'N/A'}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge bg={getRoleVariant(user.role)}>
                            {user.role.toUpperCase()}
                          </Badge>
                        </td>
                        <td>
                          <div>
                            <Badge bg={getImportSourceVariant(user.importSource)} className="mb-1">
                              {user.importSource === 'csv_import' ? 'Imported' : 'Manual'}
                            </Badge>
                            <div>
                              <small className="text-muted">
                                {user.batch || 'default'}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <Badge bg={user.isActive !== false ? 'success' : 'danger'}>
                            {user.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="outline-info"
                              onClick={() => handleViewDetails(user)}
                              title="View full details"
                            >
                              Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handleRoleChange(user)}
                              title="Change user role"
                            >
                              Role
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => deleteUser(user._id)}
                              disabled={user.role === 'admin'}
                              title={user.role === 'admin' ? 'Cannot delete admin users' : 'Delete user'}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center mt-4">
                  <nav>
                    <ul className="pagination">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </button>
                      </li>
                      
                      {getPageNumbers().map((page) => (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </button>
                        </li>
                      ))}
                      
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <h5 className="text-muted">No users found</h5>
              <p className="text-muted">
                {searchTerm || selectedBatch ? 'Try adjusting your search criteria' : 'No users in the system yet'}
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Role Change Modal */}
      <Modal show={showRoleModal} onHide={() => setShowRoleModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change User Role</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Change role for <strong>{selectedUser?.username}</strong> ({selectedUser?.email})
          </p>
          <Form.Select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Form.Select>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={updateUserRole}>
            Update Role
          </Button>
        </Modal.Footer>
      </Modal>

      {/* User Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {userDetails && (
            <Row>
              <Col md={4} className="text-center mb-4">
                {getProfilePicture(userDetails) ? (
                  <Image
                    src={getProfilePicture(userDetails)}
                    roundedCircle
                    style={{width: '120px', height: '120px', objectFit: 'cover'}}
                    alt={`${userDetails.username}'s profile`}
                  />
                ) : (
                  <div 
                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto"
                    style={{width: '120px', height: '120px', fontSize: '2rem'}}
                  >
                    {getInitials(userDetails)}
                  </div>
                )}
                <h5 className="mt-3">{userDetails.username}</h5>
                <Badge bg={getRoleVariant(userDetails.role)}>
                  {userDetails.role.toUpperCase()}
                </Badge>
              </Col>
              <Col md={8}>
                <Row>
                  <Col md={6}>
                    <h6>Personal Information</h6>
                    <p><strong>Name:</strong> {userDetails.profile?.firstName} {userDetails.profile?.lastName}</p>
                    <p><strong>Email:</strong> {userDetails.email}</p>
                    <p><strong>Phone:</strong> {userDetails.profile?.phone || 'N/A'}</p>
                    <p><strong>Alt Phone:</strong> {userDetails.profile?.phone2 || 'N/A'}</p>
                    <p><strong>Birthday:</strong> {userDetails.profile?.birthday ? formatDate(userDetails.profile.birthday) : 'N/A'}</p>
                  </Col>
                  <Col md={6}>
                    <h6>Trading Information</h6>
                    <p><strong>TradingView ID:</strong> {userDetails.profile?.tradingViewId || 'N/A'}</p>
                    <p><strong>Discord ID:</strong> {userDetails.profile?.discordId || 'N/A'}</p>
                    <p><strong>Trading Segment:</strong> {userDetails.profile?.tradingSegment || 'N/A'}</p>
                    <p><strong>Badge:</strong> {userDetails.profile?.badge || 'N/A'}</p>
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col md={12}>
                    <h6>Address Information</h6>
                    {userDetails.profile?.address?.street ? (
                      <p>
                        {userDetails.profile.address.street}<br/>
                        {userDetails.profile.address.city}, {userDetails.profile.address.state} {userDetails.profile.address.zipCode}<br/>
                        {userDetails.profile.address.country}
                      </p>
                    ) : (
                      <p>No address information</p>
                    )}
                  </Col>
                </Row>
                <Row className="mt-3">
                  <Col md={6}>
                    <h6>Account Information</h6>
                    <p><strong>Batch:</strong> {userDetails.batch || 'default'}</p>
                    <p><strong>Import Source:</strong> {userDetails.importSource || 'manual'}</p>
                    <p><strong>Verified:</strong> {userDetails.isVerified ? 'Yes' : 'No'}</p>
                    <p><strong>Joined:</strong> {formatDate(userDetails.createdAt)}</p>
                  </Col>
                </Row>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Import CSV Modal */}
      <Modal show={showImportModal} onHide={() => setShowImportModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📁 Import Users from CSV</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {importResults ? (
            <div>
              <Alert variant="success">
                <h6>Import Completed Successfully!</h6>
                <p>Batch: <strong>{importResults.batchName}</strong></p>
              </Alert>
              
              <div className="mb-4">
                <h6>Import Results:</h6>
                <Row>
                  <Col md={4}>
                    <Card className="text-center">
                      <Card.Body>
                        <h3 className="text-success">{importResults.results.successful}</h3>
                        <p className="mb-0">Successful</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="text-center">
                      <Card.Body>
                        <h3 className="text-warning">{importResults.results.failed}</h3>
                        <p className="mb-0">Failed</p>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={4}>
                    <Card className="text-center">
                      <Card.Body>
                        <h3 className="text-info">{importResults.results.total}</h3>
                        <p className="mb-0">Total</p>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>

              {importResults.results.errors.length > 0 && (
                <div>
                  <h6>Errors:</h6>
                  <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                    {importResults.results.errors.map((error, index) => (
                      <Alert key={index} variant="warning" className="py-2">
                        <small>{error}</small>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center mt-3">
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setImportResults(null)
                    setShowImportModal(false)
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <Alert variant="info">
                <h6>CSV Import Instructions</h6>
                <p className="mb-1">• Upload a CSV file with user data</p>
                <p className="mb-1">• Required field: Email (Email 1 or Email 2)</p>
                <p className="mb-1">• Optional fields: First Name, Last Name, Phone, Address, etc.</p>
                <p className="mb-0">• Duplicate emails will be skipped automatically</p>
              </Alert>

              <Form.Group className="mb-3">
                <Form.Label>Select CSV File</Form.Label>
                <Form.Control
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={importLoading}
                />
                <Form.Text className="text-muted">
                  Maximum file size: 10MB
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Batch Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter batch name (defaults to filename)"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  disabled={importLoading}
                />
                <Form.Text className="text-muted">
                  This helps you organize imported users into groups
                </Form.Text>
              </Form.Group>

              {csvFile && (
                <Alert variant="success">
                  <strong>File selected:</strong> {csvFile.name}<br/>
                  <strong>Batch name:</strong> {batchName}<br/>
                  <strong>Size:</strong> {(csvFile.size / 1024 / 1024).toFixed(2)} MB
                </Alert>
              )}

              {importLoading && (
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Importing...</span>
                  </div>
                  <p className="mt-2">Importing users, please wait...</p>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        {!importResults && (
          <Modal.Footer>
            <Button 
              variant="secondary" 
              onClick={() => setShowImportModal(false)}
              disabled={importLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={importCSV}
              disabled={!csvFile || importLoading}
            >
              {importLoading ? 'Importing...' : 'Import Users'}
            </Button>
          </Modal.Footer>
        )}
      </Modal>

      {/* Batch Statistics Modal */}
      <Modal show={showBatchStatsModal} onHide={() => setShowBatchStatsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>📊 Batch Statistics</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {batchStats ? (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <Card className="text-center bg-primary text-white">
                    <Card.Body>
                      <h3>{batchStats.totalUsers}</h3>
                      <p className="mb-0">Total Users</p>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="text-center bg-info text-white">
                    <Card.Body>
                      <h3>{batchStats.importedUsers}</h3>
                      <p className="mb-0">Imported Users</p>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <h6>Batch Breakdown:</h6>
              <div className="table-responsive">
                <Table striped bordered>
                  <thead>
                    <tr>
                      <th>Batch Name</th>
                      <th>User Count</th>
                      <th>Last Import</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchStats.batchStats.map((batch, index) => (
                      <tr key={index}>
                        <td>
                          <Badge bg="secondary">{batch._id}</Badge>
                        </td>
                        <td>
                          <strong>{batch.count}</strong>
                        </td>
                        <td>
                          {batch.lastImport ? formatDate(batch.lastImport) : 'N/A'}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="flex-grow-1 me-2">
                              <ProgressBar 
                                now={(batch.count / batchStats.totalUsers) * 100} 
                                variant="success"
                                style={{height: '8px'}}
                              />
                            </div>
                            <small>
                              {((batch.count / batchStats.totalUsers) * 100).toFixed(1)}%
                            </small>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading batch statistics...</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowBatchStatsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default UserManagement