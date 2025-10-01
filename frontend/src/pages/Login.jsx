import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Auth.module.css'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [alert, setAlert] = useState({ show: false, message: '', type: '' })
  const [loading, setLoading] = useState(false)

  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/traders'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAlert({ show: false, message: '', type: '' })

    const result = await login(formData.email, formData.password)

    if (result.success) {
      setAlert({
        show: true,
        message: 'Login successful! Redirecting...',
        type: 'success'
      })
      // Navigation is handled by the useEffect above
    } else {
      setAlert({
        show: true,
        message: result.message,
        type: 'danger'
      })
    }
    setLoading(false)
  }

  return (
    <Container className={styles.authPage}>
      <Row className="justify-content-center">
        <Col lg={5} md={7}>
          <Card className={styles.authCard}>
            <Card.Body className={styles.cardBody}>
              <div className={styles.authHeader}>
                <h2 className={styles.authTitle}>Welcome Back</h2>
                <p className={styles.authSubtitle}>Sign in to your account</p>
              </div>

              {alert.show && (
                <Alert variant={alert.type} className={styles.alert}>
                  {alert.message}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Email Address</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                    className={styles.formControl}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    className={styles.formControl}
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
              </Form>

              <div className={styles.authFooter}>
                <p className={styles.footerText}>
                  Don't have an account?{' '}
                  <Link to="/register" className={styles.footerLink}>
                    Sign up here
                  </Link>
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Login