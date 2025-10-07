import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
 
const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
 
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
 
  // Header styles
  const headerStyles = {
    navbar: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 2px 20px rgba(0, 0, 0, 0.1)',
      padding: '1rem 0',
      zIndex: 1000,
      transition: 'all 0.3s ease'
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    brand: {
      fontSize: '1.8rem',
      fontWeight: '700',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textDecoration: 'none'
    },
    nav: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    navLink: {
      color: '#2c3e50',
      fontWeight: '500',
      padding: '8px 16px',
      borderRadius: '25px',
      transition: 'all 0.3s ease',
      textDecoration: 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap'
    },
    navLinkHover: {
      color: '#3498db',
      backgroundColor: 'rgba(52, 152, 219, 0.1)'
    },
    dropdown: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    dropdownToggle: {
      color: '#2c3e50',
      fontWeight: '500',
      padding: '8px 16px',
      borderRadius: '25px',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      textDecoration: 'none',
      whiteSpace: 'nowrap'
    },
    dropdownMenu: {
      position: 'absolute',
      top: '100%',
      left: '0',
      backgroundColor: 'white',
      border: 'none',
      borderRadius: '10px',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
      padding: '10px',
      minWidth: '200px',
      zIndex: 1001,
      marginTop: '8px'
    },
    dropdownItem: {
      display: 'block',
      padding: '10px 20px',
      borderRadius: '8px',
      transition: 'all 0.3s ease',
      color: '#2c3e50',
      textDecoration: 'none',
      border: 'none',
      background: 'none',
      width: '100%',
      textAlign: 'left',
      cursor: 'pointer'
    },
    dropdownItemHover: {
      backgroundColor: 'rgba(52, 152, 219, 0.1)',
      color: '#3498db'
    },
    authContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    mobileMenuButton: {
      display: 'none',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      width: '30px',
      height: '30px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: 0
    },
    mobileMenuLine: {
      width: '25px',
      height: '3px',
      backgroundColor: '#2c3e50',
      margin: '2px 0',
      transition: '0.3s',
      borderRadius: '2px'
    },
    mobileMenu: {
      position: 'absolute',
      top: '100%',
      left: '0',
      right: '0',
      backgroundColor: 'white',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      padding: '1rem',
      display: 'none',
      flexDirection: 'column',
      gap: '0.5rem'
    },
    mobileMenuOpen: {
      display: 'flex'
    }
  };
 
  // Mobile styles
  const mobileStyles = {
    '@media (max-width: 991px)': {
      nav: {
        display: 'none'
      },
      mobileMenuButton: {
        display: 'flex'
      },
      mobileMenu: {
        display: isMobileMenuOpen ? 'flex' : 'none'
      },
      dropdownMenu: {
        position: 'static',
        boxShadow: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        marginTop: '5px'
      },
      authContainer: {
        flexDirection: 'column',
        width: '100%'
      }
    }
  };
 
  // Merge styles with mobile overrides
  const getStyle = (styleName) => {
    const baseStyle = headerStyles[styleName];
    const mobileOverride = mobileStyles['@media (max-width: 991px)']?.[styleName];
   
    if (mobileOverride && window.innerWidth <= 991) {
      return { ...baseStyle, ...mobileOverride };
    }
   
    return baseStyle;
  };
 
  const NavLink = ({ to, children, onClick }) => (
    <Link
      to={to}
      style={headerStyles.navLink}
      onMouseEnter={(e) => {
        Object.assign(e.target.style, headerStyles.navLinkHover);
      }}
      onMouseLeave={(e) => {
        Object.assign(e.target.style, headerStyles.navLink);
      }}
      onClick={onClick}
    >
      {children}
    </Link>
  );
 
  const Dropdown = ({ title, children, dropdownName }) => (
    <div style={headerStyles.dropdown}>
      <button
        style={{
          ...headerStyles.dropdownToggle,
          ...(openDropdown === dropdownName ? headerStyles.navLinkHover : {})
        }}
        onMouseEnter={(e) => {
          if (window.innerWidth > 991) {
            Object.assign(e.target.style, headerStyles.navLinkHover);
          }
        }}
        onMouseLeave={(e) => {
          if (window.innerWidth > 991) {
            Object.assign(e.target.style, headerStyles.dropdownToggle);
          }
        }}
        onClick={() => toggleDropdown(dropdownName)}
      >
        {title} ▼
      </button>
      {(openDropdown === dropdownName || (window.innerWidth <= 991 && isMobileMenuOpen)) && (
        <div style={getStyle('dropdownMenu')}>
          {children}
        </div>
      )}
    </div>
  );
 
  const DropdownItem = ({ to, onClick, children }) =>
    to ? (
      <Link
        to={to}
        style={headerStyles.dropdownItem}
        onMouseEnter={(e) => {
          Object.assign(e.target.style, headerStyles.dropdownItemHover);
        }}
        onMouseLeave={(e) => {
          Object.assign(e.target.style, headerStyles.dropdownItem);
        }}
        onClick={onClick}
      >
        {children}
      </Link>
    ) : (
      <button
        style={headerStyles.dropdownItem}
        onMouseEnter={(e) => {
          Object.assign(e.target.style, headerStyles.dropdownItemHover);
        }}
        onMouseLeave={(e) => {
          Object.assign(e.target.style, headerStyles.dropdownItem);
        }}
        onClick={onClick}
      >
        {children}
      </button>
    );
 
  return (
    <nav style={headerStyles.navbar}>
      <div style={headerStyles.container}>
        <Link to="/" style={headerStyles.brand} onClick={handleNavClick}>
          TradeMaster Pro
        </Link>
 
        {/* Desktop Navigation */}
        <div style={getStyle('nav')}>
          <NavLink to="/" onClick={handleNavClick}>Home</NavLink>
          <NavLink to="/courses" onClick={handleNavClick}>Courses</NavLink>
 
          {/* Tools Dropdown */}
          <Dropdown title="Tools" dropdownName="tools">
            <DropdownItem to="/tools/fd-calculator" onClick={handleNavClick}>
              FD Calculator
            </DropdownItem>
            <DropdownItem to="/tools/sip-calculator" onClick={handleNavClick}>
              SIP Calculator
            </DropdownItem>
            <DropdownItem to="/tools/swp-calculator" onClick={handleNavClick}>
              SWP Calculator
            </DropdownItem>
          </Dropdown>
 
          <NavLink to="/traders" onClick={handleNavClick}>Traders</NavLink>
          <NavLink to="/faq" onClick={handleNavClick}>FAQ</NavLink>
          <NavLink to="/about" onClick={handleNavClick}>About</NavLink>
 
          {isAuthenticated ? (
            <Dropdown title={`Welcome, ${user?.username}`} dropdownName="user">
              <DropdownItem to="/profile" onClick={handleNavClick}>
                My Profile
              </DropdownItem>
              <div style={{ height: '1px', backgroundColor: '#e1e8ed', margin: '5px 0' }} />
              <DropdownItem onClick={handleLogout}>
                Logout
              </DropdownItem>
            </Dropdown>
          ) : (
            <div style={getStyle('authContainer')}>
              <NavLink to="/login" onClick={handleNavClick}>Login</NavLink>
              <NavLink to="/register" onClick={handleNavClick}>Register</NavLink>
            </div>
          )}
        </div>
 
        {/* Mobile Menu Button */}
        <button
          style={getStyle('mobileMenuButton')}
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          <span style={headerStyles.mobileMenuLine} />
          <span style={headerStyles.mobileMenuLine} />
          <span style={headerStyles.mobileMenuLine} />
        </button>
      </div>
 
      {/* Mobile Menu */}
      <div style={getStyle('mobileMenu')}>
        <NavLink to="/" onClick={handleNavClick}>Home</NavLink>
        <NavLink to="/courses" onClick={handleNavClick}>Courses</NavLink>
 
        {/* Tools Dropdown Mobile */}
        <div>
          <button
            style={headerStyles.dropdownToggle}
            onClick={() => toggleDropdown('tools')}
          >
            Tools ▼
          </button>
          {openDropdown === 'tools' && (
            <div style={getStyle('dropdownMenu')}>
              <DropdownItem to="/tools/fd-calculator" onClick={handleNavClick}>
                FD Calculator
              </DropdownItem>
              <DropdownItem to="/tools/sip-calculator" onClick={handleNavClick}>
                SIP Calculator
              </DropdownItem>
              <DropdownItem to="/tools/swp-calculator" onClick={handleNavClick}>
                SWP Calculator
              </DropdownItem>
            </div>
          )}
        </div>
 
        <NavLink to="/traders" onClick={handleNavClick}>Traders</NavLink>
        <NavLink to="/faq" onClick={handleNavClick}>FAQ</NavLink>
        <NavLink to="/about" onClick={handleNavClick}>About</NavLink>
 
        {isAuthenticated ? (
          <div>
            <button
              style={headerStyles.dropdownToggle}
              onClick={() => toggleDropdown('user')}
            >
              Welcome, {user?.username} ▼
            </button>
            {openDropdown === 'user' && (
              <div style={getStyle('dropdownMenu')}>
                <DropdownItem to="/profile" onClick={handleNavClick}>
                  My Profile
                </DropdownItem>
                <div style={{ height: '1px', backgroundColor: '#e1e8ed', margin: '5px 0' }} />
                <DropdownItem onClick={handleLogout}>
                  Logout
                </DropdownItem>
              </div>
            )}
          </div>
        ) : (
          <div style={getStyle('authContainer')}>
            <NavLink to="/login" onClick={handleNavClick}>Login</NavLink>
            <NavLink to="/register" onClick={handleNavClick}>Register</NavLink>
          </div>
        )}
      </div>
    </nav>
  );
};
 
export default Header;