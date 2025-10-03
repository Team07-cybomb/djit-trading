import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/traders");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear validation error when user starts typing
    if (validationErrors[e.target.name]) {
      setValidationErrors({
        ...validationErrors,
        [e.target.name]: "",
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters long";
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setAlert({ show: false, message: "", type: "" });

    const result = await register(
      formData.username,
      formData.email,
      formData.password
    );

    if (result.success) {
      setAlert({
        show: true,
        message: "Registration successful! Redirecting to your profile...",
        type: "success",
      });
      // Navigation is handled by the useEffect above
    } else {
      setAlert({
        show: true,
        message: result.message,
        type: "danger",
      });
    }
    setLoading(false);
  };

  return (
    <div className="register-page">
      {/* Background with trading theme */}
      <div className="register-background">
        <div className="register-overlay"></div>
        <div className="floating-element register-float-1"></div>
        <div className="floating-element register-float-2"></div>
        <div className="floating-element register-float-3"></div>
      </div>

      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg={5} md={7} sm={9}>
            {/* Trusted Badge */}
            <div className="register-trusted-badge">
              <span className="trusted-text">
                <span className="check-icon">✓</span>
                Trusted by 10,000+ traders
              </span>
            </div>

            <Card className="register-card">
              <Card.Body className="register-card-body">
                {/* Header Section */}
                <div className="register-header">
                  <div className="register-brand">
                    <h1 className="register-brand-title">
                      DJIT <span className="gradient-text">TRADING</span>
                    </h1>
                    <p className="register-brand-subtitle">
                      Professional Trading Platform
                    </p>
                  </div>

                  <div className="register-welcome">
                    <h2 className="register-title">Join Our Community</h2>
                    <p className="register-subtitle">
                      Create your account and start your trading journey
                    </p>
                  </div>
                </div>

                {alert.show && (
                  <Alert variant={alert.type} className="register-alert">
                    {alert.message}
                  </Alert>
                )}

                <div className="register-form-container">
                  <Form onSubmit={handleSubmit} className="register-form">
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label">Username</Form.Label>
                      <Form.Control
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Choose a username"
                        required
                        isInvalid={!!validationErrors.username}
                        className="register-form-control"
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.username}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="form-label">
                        Email Address
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                        isInvalid={!!validationErrors.email}
                        className="register-form-control"
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.email}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="form-label">Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a password"
                        required
                        isInvalid={!!validationErrors.password}
                        className="register-form-control"
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.password}
                      </Form.Control.Feedback>
                      <Form.Text className="password-hint">
                        Password must be at least 6 characters long
                      </Form.Text>
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="form-label">
                        Confirm Password
                      </Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        required
                        isInvalid={!!validationErrors.confirmPassword}
                        className="register-form-control"
                      />
                      <Form.Control.Feedback type="invalid">
                        {validationErrors.confirmPassword}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
                      className="register-submit-button"
                      disabled={loading}
                    >
                      <span className="btn-icon">🚀</span>
                      {loading
                        ? "Creating Account..."
                        : "Create Trading Account"}
                    </Button>
                  </Form>
                </div>

                {/* Quick Stats */}
                <div className="register-stats">
                  <div className="register-stat">
                    <div className="stat-icon">🔄</div>
                    <div className="stat-content">
                      <strong>10,000+</strong>
                      <span>Active Traders</span>
                    </div>
                  </div>
                  <div className="register-stat">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <strong>95%</strong>
                      <span>Success Rate</span>
                    </div>
                  </div>
                </div>

                <div className="register-footer">
                  <p className="footer-text">
                    Already have an account?{" "}
                    <Link to="/login" className="footer-link">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default Register;
