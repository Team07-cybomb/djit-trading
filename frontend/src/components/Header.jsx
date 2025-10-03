import React, { useState } from "react";
import { Navbar, Nav, Container, NavDropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import styles from "./Header.module.css";

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setExpanded(false);
  };

  const handleNavClick = () => {
    setExpanded(false);
  };

  return (
    <Navbar
      expand="lg"
      className={styles.navbar}
      fixed="top"
      expanded={expanded}
    >
      <Container>
        <Navbar.Brand as={Link} to="/" className={styles.brand}>
          TradeMaster Pro
        </Navbar.Brand>

        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          onClick={() => setExpanded(expanded ? false : "expanded")}
        />

        <Navbar.Collapse
          id="basic-navbar-nav"
          className={styles.navbarCollapse}
        >
          <Nav className={`ms-auto ${styles.navbarNav}`}>
            <Nav.Link
              as={Link}
              to="/"
              onClick={handleNavClick}
              className={styles.navLink}
            >
              Home
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/courses"
              onClick={handleNavClick}
              className={styles.navLink}
            >
              Courses
            </Nav.Link>

            <NavDropdown
              title="Tools"
              id="tools-dropdown"
              className={styles.navDropdown}
            >
              <NavDropdown.Item
                as={Link}
                to="/tools/fd-calculator"
                onClick={handleNavClick}
              >
                FD Calculator
              </NavDropdown.Item>
              <NavDropdown.Item
                as={Link}
                to="/tools/sip-calculator"
                onClick={handleNavClick}
              >
                SIP Calculator
              </NavDropdown.Item>
              <NavDropdown.Item
                as={Link}
                to="/tools/swp-calculator"
                onClick={handleNavClick}
              >
                SWP Calculator
              </NavDropdown.Item>
            </NavDropdown>

            <Nav.Link
              as={Link}
              to="/traders"
              onClick={handleNavClick}
              className={styles.navLink}
            >
              Traders
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/faq"
              onClick={handleNavClick}
              className={styles.navLink}
            >
              FAQ
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/about"
              onClick={handleNavClick}
              className={styles.navLink}
            >
              About
            </Nav.Link>

            {isAuthenticated ? (
              <NavDropdown
                title={`Welcome, ${user?.username}`}
                id="user-dropdown"
                className={styles.navDropdown}
              >
                <NavDropdown.Item
                  as={Link}
                  to="/traders"
                  onClick={handleNavClick}
                >
                  My Profile
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <div className={`d-flex ${styles.authContainer}`}>
                <Nav.Link
                  as={Link}
                  to="/login"
                  onClick={handleNavClick}
                  className={styles.navLink}
                >
                  Login
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/register"
                  onClick={handleNavClick}
                  className={styles.navLink}
                >
                  Register
                </Nav.Link>
              </div>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;
