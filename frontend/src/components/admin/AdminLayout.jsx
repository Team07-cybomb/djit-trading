import React, { useState } from 'react'
import { Container, Navbar, Nav, Button } from 'react-bootstrap'
import { Link, useNavigate, Outlet } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import './AdminLayout.css'

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  if (!admin) {
    return null; // Or redirect to login
  }

  return (
    <div className="admin-layout">
      {/* Top Navigation */}
      <Navbar bg="dark" variant="dark" expand="lg" className="admin-navbar">
        <Container fluid>
          <Button
            variant="outline-light"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="me-3"
          >
            ☰
          </Button>
          <Navbar.Brand>Admin Panel</Navbar.Brand>
          <Nav className="ms-auto">
            <span className="navbar-text text-light me-3">
              Welcome, {admin.username}
            </span>
            <Nav.Link as={Link} to="/" className="text-light">
              View Site
            </Nav.Link>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <div className="admin-content-wrapper">
        {/* Sidebar */}
        <div className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-content">
            <div className="sidebar-header">
              <h6>Admin Menu</h6>
              <small className="text-muted">Role: {admin.role}</small>
            </div>
            <nav className="sidebar-nav">
              <Link to="/admin" className="nav-item">
                📊 Dashboard
              </Link>
              <Link to="/admin/courses" className="nav-item">
                📚 Courses
              </Link>
              <Link to="/admin/users" className="nav-item">
                👥 Users
              </Link>
              <Link to="/admin/enrollments" className="nav-item">
                🎓 Enrollments
              </Link>
              <Link to="/admin/newsletter" className="nav-item">
                📧 Newsletter
              </Link>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="admin-main">
          <div className="admin-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout