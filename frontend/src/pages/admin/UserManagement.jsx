import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Badge, Form, InputGroup, Modal, Alert, Image } from 'react-bootstrap'
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
  const [selectedUser, setSelectedUser] = useState(null)
  const [userDetails, setUserDetails] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [alert, setAlert] = useState({ show: false, message: '', type: '' })

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
  }, [currentPage, searchTerm])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/admin/users?page=${currentPage}&search=${searchTerm}`)
      setUsers(response.data.users)
      setTotalPages(response.data.totalPages)
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

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type })
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 5000)
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
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
        //'Vishcard ID': user.profile?.vishcardId || '',
        'Discord ID': user.profile?.discordId || '',
        'Trading Segment': user.profile?.tradingSegment || '',
        'Badge': user.profile?.badge || '',
        'Profile Picture': getProfilePicture(user) || 'No picture',
        'Role': user.role,
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
        //{ wch: 15 }, // Vishcard ID
        { wch: 15 }, // Discord ID
        { wch: 15 }, // Trading Segment
        { wch: 12 }, // Badge
        { wch: 20 }, // Profile Picture
        { wch: 10 }, // Role
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
          <div className="row">
            <div className="col-md-8">
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
            </div>
            <div className="col-md-4 text-end">
              <small className="text-muted">
                Search by: username, email, first name, last name, phone, trading segment
              </small>
            </div>
          </div>
        </Card.Body>
      </Card>

      <Card className="admin-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">All Users</h5>
          <div className="d-flex align-items-center gap-2">
            <Badge bg="primary">{users.length} users</Badge>
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
                        <td>{formatDate(user.createdAt)}</td>
                        <td>
                          <Badge bg={user.isActive !== false ? 'success' : 'danger'}>
                            {user.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                          <div>
                            {/* <small className={user.isVerified ? 'text-success' : 'text-warning'}>
                              {user.isVerified ? '✓ Verified' : '⚠ Unverified'}
                            </small> */}
                          </div>
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
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="text-muted">
                    Page {currentPage} of {totalPages}
                  </div>
                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="page-link"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          &laquo; Previous
                        </Button>
                      </li>
                      
                      {getPageNumbers().map((page) => (
                        <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                          <Button
                            variant={currentPage === page ? 'primary' : 'outline-primary'}
                            size="sm"
                            className="page-link"
                            onClick={() => handlePageChange(page)}
                          >
                            {page}
                          </Button>
                        </li>
                      ))}
                      
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="page-link"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next &raquo;
                        </Button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">No users found</p>
              {searchTerm && (
                <Button 
                  variant="outline-primary" 
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              )}
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
          {selectedUser && (
            <div>
              <div className="d-flex align-items-center mb-3">
                {getProfilePicture(selectedUser) ? (
                  <Image
                    src={getProfilePicture(selectedUser)}
                    roundedCircle
                    style={{width: '50px', height: '50px', objectFit: 'cover'}}
                    alt={`${selectedUser.username}'s profile`}
                    className="me-3"
                  />
                ) : (
                  <div 
                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-3"
                    style={{width: '50px', height: '50px', fontSize: '1rem'}}
                  >
                    {getInitials(selectedUser)}
                  </div>
                )}
                <div>
                  <strong>{selectedUser.username}</strong>
                  <div className="text-muted">{selectedUser.email}</div>
                </div>
              </div>
              <Form.Group className="mb-3">
                <Form.Label>Select Role</Form.Label>
                <Form.Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                </Form.Select>
              </Form.Group>
              <Alert variant="warning" className="mb-0">
                <small>
                  <strong>Warning:</strong> Admin users have full access to the system. 
                  Only assign this role to trusted users.
                </small>
              </Alert>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowRoleModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={updateUserRole}
            disabled={!newRole || newRole === selectedUser?.role}
          >
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
            <div>
              {/* Profile Header with Picture */}
              <div className="d-flex align-items-center mb-4 p-3 bg-light rounded">
                {getProfilePicture(userDetails) ? (
                  <Image
                    src={getProfilePicture(userDetails)}
                    roundedCircle
                    style={{width: '80px', height: '80px', objectFit: 'cover'}}
                    alt={`${userDetails.username}'s profile`}
                    className="me-4"
                  />
                ) : (
                  <div 
                    className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-4"
                    style={{width: '80px', height: '80px', fontSize: '1.5rem'}}
                  >
                    {getInitials(userDetails)}
                  </div>
                )}
                <div>
                  <h4 className="mb-1">{userDetails.username}</h4>
                  <p className="text-muted mb-1">{userDetails.email}</p>
                  <div className="d-flex gap-2">
                    <Badge bg={getRoleVariant(userDetails.role)}>
                      {userDetails.role.toUpperCase()}
                    </Badge>
                    {userDetails.profile?.badge && (
                      <Badge bg={getBadgeVariant(userDetails.profile.badge)}>
                        {userDetails.profile.badge} Trader
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <h6>Basic Information</h6>
                  <Table borderless size="sm">
                    <tbody>
                      <tr>
                        <td><strong>Username:</strong></td>
                        <td>{userDetails.username}</td>
                      </tr>
                      <tr>
                        <td><strong>Email:</strong></td>
                        <td>{userDetails.email}</td>
                      </tr>
                      <tr>
                        <td><strong>First Name:</strong></td>
                        <td>{userDetails.profile?.firstName || 'Not provided'}</td>
                      </tr>
                      <tr>
                        <td><strong>Last Name:</strong></td>
                        <td>{userDetails.profile?.lastName || 'Not provided'}</td>
                      </tr>
                      <tr>
                        <td><strong>Role:</strong></td>
                        <td>
                          <Badge bg={getRoleVariant(userDetails.role)}>
                            {userDetails.role.toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
                <div className="col-md-6">
                  <h6>Contact Information</h6>
                  <Table borderless size="sm">
                    <tbody>
                      <tr>
                        <td><strong>Phone:</strong></td>
                        <td>{userDetails.profile?.phone || 'Not provided'}</td>
                      </tr>
                      <tr>
                        <td><strong>Alt Phone:</strong></td>
                        <td>{userDetails.profile?.phone2 || 'Not provided'}</td>
                      </tr>
                      <tr>
                        <td><strong>Birthday:</strong></td>
                        <td>
                          {userDetails.profile?.birthday 
                            ? formatDate(userDetails.profile.birthday)
                            : 'Not provided'
                          }
                        </td>
                      </tr>
                      <tr>
                        <td><strong>Joined:</strong></td>
                        <td>{formatDate(userDetails.createdAt)}</td>
                      </tr>
                      <tr>
                        <td><strong>Status:</strong></td>
                        <td>
                          <Badge bg={userDetails.isActive !== false ? 'success' : 'danger'}>
                            {userDetails.isActive !== false ? 'Active' : 'Inactive'}
                          </Badge>
                          {' '}
                          <Badge bg={userDetails.isVerified ? 'success' : 'warning'}>
                            {userDetails.isVerified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </div>

              <hr />

              <div className="row">
                <div className="col-md-6">
                  <h6>Trading Information</h6>
                  <Table borderless size="sm">
                    <tbody>
                      <tr>
                        <td><strong>TradingView ID:</strong></td>
                        <td>{userDetails.profile?.tradingViewId || 'Not provided'}</td>
                      </tr>
                      {/* <tr>
                        <td><strong>Vishcard ID:</strong></td>
                        <td>{userDetails.profile?.vishcardId || 'Not provided'}</td>
                      </tr> */}
                      <tr>
                        <td><strong>Discord ID:</strong></td>
                        <td>{userDetails.profile?.discordId || 'Not provided'}</td>
                      </tr>
                      <tr>
                        <td><strong>Trading Segment:</strong></td>
                        <td>{userDetails.profile?.tradingSegment || 'Not selected'}</td>
                      </tr>
                      <tr>
                        <td><strong>Badge:</strong></td>
                        <td>
                          {userDetails.profile?.badge && (
                            <Badge bg={getBadgeVariant(userDetails.profile.badge)}>
                              {userDetails.profile.badge}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
                <div className="col-md-6">
                  <h6>Address Information</h6>
                  <Table borderless size="sm">
                    <tbody>
                      <tr>
                        <td><strong>Street:</strong></td>
                        <td>{userDetails.profile?.address?.street || 'Not provided'}</td>
                      </tr>
                      <tr>
                        <td><strong>City:</strong></td>
                        <td>{userDetails.profile?.address?.city || 'Not provided'}</td>
                      </tr>
                      <tr>
                        <td><strong>State:</strong></td>
                        <td>{userDetails.profile?.address?.state || 'Not provided'}</td>
                      </tr>
                      <tr>
                        <td><strong>ZIP Code:</strong></td>
                        <td>{userDetails.profile?.address?.zipCode || 'Not provided'}</td>
                      </tr>
                      <tr>
                        <td><strong>Country:</strong></td>
                        <td>{userDetails.profile?.address?.country || 'Not provided'}</td>
                      </tr>
                    </tbody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default UserManagement