import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Badge, Form, InputGroup, Modal, Alert } from 'react-bootstrap'
import axios from 'axios'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newRole, setNewRole] = useState('')
  const [alert, setAlert] = useState({ show: false, message: '', type: '' })

  // Get authentication token
  const getAuthToken = () => {
    // Try admin token first, then regular token
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
        // Redirect to login if needed
        // window.location.href = '/admin/login'
      } else {
        showAlert('Error fetching users', 'danger')
      }
    } finally {
      setLoading(false)
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

  const updateUserRole = async () => {
    try {
      await api.put(`/admin/users/${selectedUser._id}/role`, { role: newRole })
      showAlert('User role updated successfully', 'success')
      setShowRoleModal(false)
      fetchUsers() // Refresh the list
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
        fetchUsers() // Refresh the list
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

  const getRoleVariant = (role) => {
    switch (role) {
      case 'admin': return 'danger'
      case 'user': return 'primary'
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

  // Handle pagination button clicks
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // Generate page numbers for pagination
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
        <div className="text-muted">
          {loading ? 'Loading...' : `Total Users: ${users.length}`}
        </div>
      </div>

      {alert.show && (
        <Alert variant={alert.type} dismissible onClose={() => setAlert({ show: false, message: '', type: '' })}>
          {alert.message}
        </Alert>
      )}

      <Card className="admin-card mb-4">
        <Card.Body>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search users by username or email..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <Button variant="outline-secondary">
              🔍 Search
            </Button>
          </InputGroup>
        </Card.Body>
      </Card>

      <Card className="admin-card">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">All Users</h5>
          <Badge bg="primary">{users.length} users</Badge>
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
                      <th>User</th>
                      <th>Email</th>
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
                          <div>
                            <strong>{user.username}</strong>
                            {user.profile?.tradingSegment && (
                              <div>
                                <small className="text-muted">
                                  {user.profile.tradingSegment} Trader
                                </small>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{user.email}</td>
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
                        </td>
                        <td>
                          <div className="d-flex gap-2 flex-wrap">
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
              <p>
                Change role for <strong>{selectedUser.username}</strong> ({selectedUser.email})
              </p>
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
    </div>
  )
}

export default UserManagement