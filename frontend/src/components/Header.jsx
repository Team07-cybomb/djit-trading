import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 991);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
    setOpenDropdown(null);
  };

  const toggleDropdown = (dropdownName) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setOpenDropdown(null);
  };

  // Handle resize and mobile detection
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 991;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.header-container')) {
        setIsMobileMenuOpen(false);
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);

  // ----- Styles -----
  const styles = {
    navbar: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(10px)",
      boxShadow: "0 2px 20px rgba(0,0,0,0.1)",
      padding: "1rem 0",
      zIndex: 1000,
    },
    container: {
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "0 1rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "relative",
    },
    brand: {
      fontSize: "1.8rem",
      fontWeight: 700,
      background: "linear-gradient(135deg,#667eea,#764ba2)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      textDecoration: "none",
      zIndex: 1001,
    },
    // Desktop nav links
    desktopNav: {
      display: isMobile ? "none" : "flex",
      alignItems: "center",
      gap: "1rem",
    },
    // Mobile nav links (shown when menu is open)
    mobileNav: {
      display: isMobile && isMobileMenuOpen ? "flex" : "none",
      flexDirection: "column",
      position: "absolute",
      top: "100%",
      left: 0,
      right: 0,
      background: "white",
      boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
      padding: "1.5rem",
      borderTop: "1px solid #e1e8ed",
      zIndex: 999,
      gap: "1rem",
    },
    navLink: {
      textDecoration: "none",
      color: "#2c3e50",
      fontWeight: 500,
      padding: "8px 16px",
      borderRadius: "25px",
      transition: "0.3s",
      background: "none",
      border: "none",
      cursor: "pointer",
      display: "block",
      textAlign: "left",
      width: "100%",
    },
    navLinkHover: {
      background: "rgba(52,152,219,0.1)",
      color: "#3498db",
    },
    dropdown: {
      position: "relative",
    },
    dropdownMenu: {
      position: "absolute",
      top: "100%",
      left: 0,
      background: "white",
      borderRadius: "10px",
      boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
      padding: "10px 0",
      minWidth: "200px",
      zIndex: 2000,
    },
    mobileDropdownMenu: {
      position: "static",
      boxShadow: "none",
      background: "#f9f9f9",
      borderRadius: "5px",
      marginTop: "5px",
      marginLeft: "1rem",
    },
    dropdownItem: {
      display: "block",
      padding: "10px 20px",
      background: "none",
      border: "none",
      color: "#2c3e50",
      width: "100%",
      textAlign: "left",
      cursor: "pointer",
      transition: "0.3s",
      textDecoration: "none",
    },
    dropdownItemHover: {
      background: "rgba(52,152,219,0.1)",
      color: "#3498db",
    },
    authLinks: {
      display: "flex",
      gap: "0.5rem",
    },
    mobileAuthLinks: {
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
    },
    hr: {
      border: "none",
      height: "1px",
      background: "#e1e8ed",
      margin: "5px 0",
    },
    hamburger: {
      display: isMobile ? "flex" : "none",
      flexDirection: "column",
      justifyContent: "space-between",
      width: "28px",
      height: "20px",
      background: "none",
      border: "none",
      cursor: "pointer",
      zIndex: 1001,
      padding: 0,
    },
    line: {
      height: "3px",
      width: "100%",
      background: "#2c3e50",
      borderRadius: "2px",
      transition: "0.3s ease",
      transformOrigin: "center",
    },
    line1: {
      transform: isMobileMenuOpen ? "rotate(45deg) translate(6px, 6px)" : "none",
    },
    line2: {
      opacity: isMobileMenuOpen ? 0 : 1,
    },
    line3: {
      transform: isMobileMenuOpen ? "rotate(-45deg) translate(6px, -6px)" : "none",
    },
  };

  const onHover = (e, isEnter) => {
    if (!isMobile) {
      Object.assign(e.target.style, isEnter ? styles.navLinkHover : {});
    }
  };

  // Common navigation items component
  const NavItems = ({ isMobile = false }) => (
    <>
      <Link
        to="/"
        style={styles.navLink}
        onMouseEnter={(e) => !isMobile && onHover(e, true)}
        onMouseLeave={(e) => !isMobile && onHover(e, false)}
        onClick={isMobile ? handleNavClick : undefined}
      >
        Home
      </Link>

      <Link
        to="/courses"
        style={styles.navLink}
        onMouseEnter={(e) => !isMobile && onHover(e, true)}
        onMouseLeave={(e) => !isMobile && onHover(e, false)}
        onClick={isMobile ? handleNavClick : undefined}
      >
        Courses
      </Link>

      {/* Tools Dropdown */}
      <div style={styles.dropdown}>
        <button
          style={{
            ...styles.navLink,
            ...(openDropdown === `tools-${isMobile ? 'mobile' : 'desktop'}` ? styles.navLinkHover : {}),
          }}
          onClick={() => toggleDropdown(`tools-${isMobile ? 'mobile' : 'desktop'}`)}
          onMouseEnter={(e) => !isMobile && onHover(e, true)}
          onMouseLeave={(e) => !isMobile && onHover(e, false)}
        >
          Tools ▼
        </button>
        {openDropdown === `tools-${isMobile ? 'mobile' : 'desktop'}` && (
          <div style={isMobile ? styles.mobileDropdownMenu : styles.dropdownMenu}>
            {["fd-calculator", "sip-calculator", "swp-calculator"].map(
              (tool) => (
                <Link
                  key={tool}
                  to={`/tools/${tool}`}
                  style={styles.dropdownItem}
                  onMouseEnter={(e) => !isMobile && Object.assign(e.target.style, styles.dropdownItemHover)}
                  onMouseLeave={(e) => !isMobile && Object.assign(e.target.style, styles.dropdownItem)}
                  onClick={isMobile ? handleNavClick : undefined}
                >
                  {tool.replace(/-/g, " ").toUpperCase()}
                </Link>
              )
            )}
          </div>
        )}
      </div>

      <Link
        to="/traders"
        style={styles.navLink}
        onMouseEnter={(e) => !isMobile && onHover(e, true)}
        onMouseLeave={(e) => !isMobile && onHover(e, false)}
        onClick={isMobile ? handleNavClick : undefined}
      >
        Traders
      </Link>

      <Link
        to="/faq"
        style={styles.navLink}
        onMouseEnter={(e) => !isMobile && onHover(e, true)}
        onMouseLeave={(e) => !isMobile && onHover(e, false)}
        onClick={isMobile ? handleNavClick : undefined}
      >
        FAQ
      </Link>

      <Link
        to="/about"
        style={styles.navLink}
        onMouseEnter={(e) => !isMobile && onHover(e, true)}
        onMouseLeave={(e) => !isMobile && onHover(e, false)}
        onClick={isMobile ? handleNavClick : undefined}
      >
        About
      </Link>

      {isAuthenticated ? (
        <div style={styles.dropdown}>
          <button
            style={{
              ...styles.navLink,
              ...(openDropdown === `user-${isMobile ? 'mobile' : 'desktop'}` ? styles.navLinkHover : {}),
            }}
            onClick={() => toggleDropdown(`user-${isMobile ? 'mobile' : 'desktop'}`)}
            onMouseEnter={(e) => !isMobile && onHover(e, true)}
            onMouseLeave={(e) => !isMobile && onHover(e, false)}
          >
            Welcome, {user?.username} ▼
          </button>
          {openDropdown === `user-${isMobile ? 'mobile' : 'desktop'}` && (
            <div style={isMobile ? styles.mobileDropdownMenu : styles.dropdownMenu}>
              <Link
                to="/profile"
                style={styles.dropdownItem}
                onMouseEnter={(e) => !isMobile && Object.assign(e.target.style, styles.dropdownItemHover)}
                onMouseLeave={(e) => !isMobile && Object.assign(e.target.style, styles.dropdownItem)}
                onClick={isMobile ? handleNavClick : undefined}
              >
                My Profile
              </Link>
              <div style={styles.hr}></div>
              <button
                style={styles.dropdownItem}
                onMouseEnter={(e) => !isMobile && Object.assign(e.target.style, styles.dropdownItemHover)}
                onMouseLeave={(e) => !isMobile && Object.assign(e.target.style, styles.dropdownItem)}
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={isMobile ? styles.mobileAuthLinks : styles.authLinks}>
          <Link
            to="/login"
            style={styles.navLink}
            onMouseEnter={(e) => !isMobile && onHover(e, true)}
            onMouseLeave={(e) => !isMobile && onHover(e, false)}
            onClick={isMobile ? handleNavClick : undefined}
          >
            Login
          </Link>
          <Link
            to="/register"
            style={styles.navLink}
            onMouseEnter={(e) => !isMobile && onHover(e, true)}
            onMouseLeave={(e) => !isMobile && onHover(e, false)}
            onClick={isMobile ? handleNavClick : undefined}
          >
            Register
          </Link>
        </div>
      )}
    </>
  );

  return (
    <nav style={styles.navbar} className="header-container">
      <div style={styles.container}>
        <Link to="/" style={styles.brand} onClick={handleNavClick}>
          TradeMaster Pro
        </Link>

        {/* Desktop Navigation */}
        <div style={styles.desktopNav}>
          <NavItems isMobile={false} />
        </div>

        {/* Mobile Navigation */}
        <div style={styles.mobileNav}>
          <NavItems isMobile={true} />
        </div>

        {/* Hamburger Button - Only visible on mobile */}
        <button
          style={styles.hamburger}
          onClick={toggleMobileMenu}
          aria-label="Menu"
          aria-expanded={isMobileMenuOpen}
        >
          <span style={{ ...styles.line, ...styles.line1 }}></span>
          <span style={{ ...styles.line, ...styles.line2 }}></span>
          <span style={{ ...styles.line, ...styles.line3 }}></span>
        </button>
      </div>
    </nav>
  );
};

export default Header;