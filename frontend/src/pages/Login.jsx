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
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/traders";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ show: false, message: "", type: "" });

    const result = await login(formData.email, formData.password);

    if (result.success) {
      setAlert({
        show: true,
        message: "Login successful! Redirecting...",
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
    <div className="login-page">
      {/* Background with trading theme */}
      <div className="login-background">
        <div className="login-overlay"></div>
        <div className="floating-element login-float-1"></div>
        <div className="floating-element login-float-2"></div>
        <div className="floating-element login-float-3"></div>
      </div>

      <Container>
        <Row className="justify-content-center align-items-center min-vh-100">
          <Col lg={5} md={7} sm={9}>
            {/* Trusted Badge */}
            <div className="login-trusted-badge">
              <span className="trusted-text">
                <span className="check-icon">✓</span>
                Trusted by 10,000+ traders
              </span>
            </div>

            <Card className="login-card">
              <Card.Body className="login-card-body">
                {/* Header Section */}
                <div className="login-header">
                  <div className="login-brand">
                    <h1 className="login-brand-title">
                      DJIT <span className="gradient-text">TRADING</span>
                    </h1>
                    <p className="login-brand-subtitle">
                      Professional Trading Platform
                    </p>
                  </div>

                  <div className="login-welcome">
                    <h2 className="login-title">Welcome Back</h2>
                    <p className="login-subtitle">
                      Sign in to access your trading dashboard
                    </p>
                  </div>
                </div>

                {alert.show && (
                  <Alert variant={alert.type} className="login-alert">
                    {alert.message}
                  </Alert>
                )}

                <div className="login-form-container">
                  <Form onSubmit={handleSubmit} className="login-form">
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
                        className="login-form-control"
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="form-label">Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        className="login-form-control"
                      />
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
                      className="login-submit-button"
                      disabled={loading}
                    >
                      <span className="btn-icon">🚀</span>
                      {loading ? "Signing In..." : "Sign In to Dashboard"}
                    </Button>
                  </Form>
                </div>

                {/* Quick Stats */}
                <div className="login-stats">
                  <div className="login-stat">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                      <strong>10,000+</strong>
                      <span>Active Traders</span>
                    </div>
                  </div>
                  <div className="login-stat">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <strong>95%</strong>
                      <span>Success Rate</span>
                    </div>
                  </div>
                </div>

                <div className="login-footer">
                  <p className="footer-text">
                    New to DJIT Trading?{" "}
                    <Link to="/register" className="footer-link">
                      Create your account
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

export default Login;
