import React from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Courses from './pages/Courses'
import Traders from './pages/Traders'
import FAQ from './pages/FAQ'
import About from './pages/About'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Login from './pages/Login'
import Register from './pages/Register'
import FDCalculator from './tools/FDCalculator'
import SIPCalculator from './tools/SIPCalculator'
import SWPCalculator from './tools/SWPCalculator'

// Admin Components
import AdminRoute from './components/admin/AdminRoute'
import AdminLayout from './components/admin/AdminLayout'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import CourseManagement from './pages/admin/CourseManagement'
import UserManagement from './pages/admin/UserManagement'
import EnrollmentManagement from './pages/admin/EnrollmentManagement'
import NewsletterManagement from './pages/admin/NewsletterManagement'

import './App.css'

function App() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin') && location.pathname !== '/admin/login'

  return (
    <AuthProvider>
      <AdminAuthProvider>
        <div className="App">
          {!isAdminRoute && <Header />}
          <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/traders" element={<Traders />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/about" element={<About />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/tools/fd-calculator" element={<FDCalculator />} />
              <Route path="/tools/sip-calculator" element={<SIPCalculator />} />
              <Route path="/tools/swp-calculator" element={<SWPCalculator />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route 
                path="/admin/*" 
                element={
                  <AdminRoute>
                    <AdminLayout />
                  </AdminRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="courses" element={<CourseManagement />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="enrollments" element={<EnrollmentManagement />} />
                <Route path="newsletter" element={<NewsletterManagement />} />
              </Route>
            </Routes>
          </main>
          {!isAdminRoute && <Footer />}
        </div>
      </AdminAuthProvider>
    </AuthProvider>
  )
}

export default App