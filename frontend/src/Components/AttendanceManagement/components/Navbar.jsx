import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  const { pathname } = useLocation();
  const isActive = (path) => pathname === path;

  return (
    <nav className="smart-alert-navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <div className="logo-circle">
            <span className="logo-icon">🎓</span>
          </div>
          <span className="logo-text">Smart Alert</span>
        </div>
        
        <div className="navbar-links">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/features" 
            className={`nav-link ${isActive('/features') ? 'active' : ''}`}
          >
            Features
          </Link>
          <Link 
            to="/about" 
            className={`nav-link ${isActive('/about') ? 'active' : ''}`}
          >
            About
          </Link>
          <Link 
            to="/contact" 
            className={`nav-link ${isActive('/contact') ? 'active' : ''}`}
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
