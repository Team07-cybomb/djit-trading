import React, { useState } from "react";
import { Container, Row, Col, Form, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
  Phone,
} from "lucide-react";
import styles from "./Footer.module.css";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/newsletter", { email });
      setAlert({
        show: true,
        message: "Successfully subscribed to newsletter!",
        type: "success",
      });
      setEmail("");
    } catch (error) {
      setAlert({
        show: true,
        message: error.response?.data?.message || "Subscription failed",
        type: "danger",
      });
    }
  };

  return (
    <footer className={styles.footer}>
      <Container>
        <Row>
          <Col lg={4} md={6} className="mb-4">
            <h5 className={styles.footerTitle}>TradeMaster Pro</h5>
            <p className={styles.footerText}>
              Master the markets with our comprehensive trading courses. Learn
              from industry experts and take your trading skills to the next
              level.
            </p>
            <div className={styles.socialLinks}>
              <a href="#" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="#" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="#" aria-label="Instagram">
                <Instagram size={20} />
              </a>
            </div>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <Mail size={18} className={styles.contactIcon} />
                <a
                  href="mailto:support@trademasterpro.com"
                  className={styles.contactLink}
                >
                  support@trademasterpro.com
                </a>
              </div>
              <div className={styles.contactItem}>
                <Phone size={18} className={styles.contactIcon} />
                <a href="tel:+919715092104" className={styles.contactLink}>
                  +91 9715092104
                </a>
              </div>
            </div>
          </Col>

          <Col lg={2} md={6} className="mb-4">
            <h6 className={styles.footerSubtitle}>Quick Links</h6>
            <ul className={styles.footerLinks}>
              <li>
                <Link to="/courses">All Courses</Link>
              </li>
              <li>
                <Link to="/traders">Traders</Link>
              </li>
              <li>
                <Link to="/about">About Us</Link>
              </li>
              <li>
                <Link to="/faq">FAQ</Link>
              </li>
            </ul>
          </Col>

          <Col lg={2} md={6} className="mb-4">
            <h6 className={styles.footerSubtitle}>Tools</h6>
            <ul className={styles.footerLinks}>
              <li>
                <Link to="/tools/fd-calculator">FD Calculator</Link>
              </li>
              <li>
                <Link to="/tools/sip-calculator">SIP Calculator</Link>
              </li>
              <li>
                <Link to="/tools/swp-calculator">SWP Calculator</Link>
              </li>
            </ul>
          </Col>

          <Col lg={4} md={6} className="mb-4">
            <h6 className={styles.footerSubtitle}>Newsletter</h6>
            <p className={styles.footerText}>
              Subscribe to get updates on new courses and trading insights.
            </p>
            <Form
              onSubmit={handleNewsletterSubmit}
              className={styles.newsletterForm}
            >
              <Form.Group className="mb-3">
                <Form.Control
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={styles.newsletterInput}
                />
              </Form.Group>
              <Button type="submit" className={styles.subscribeBtn}>
                Subscribe
              </Button>
            </Form>
            {alert.show && (
              <Alert
                variant={alert.type}
                className="mt-2"
                onClose={() => setAlert({ show: false, message: "", type: "" })}
                dismissible
              >
                {alert.message}
              </Alert>
            )}
          </Col>
        </Row>

        <hr className={styles.divider} />

        <Row>
          <Col md={6}>
            <p className={styles.copyright}>
              © 2024 TradeMaster Pro. All rights reserved.
            </p>
          </Col>
          <Col md={6}>
            <div className={styles.legalLinks}>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms & Conditions</Link>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
