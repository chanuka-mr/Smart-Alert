import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const { pathname } = useLocation();
  const active = (path) => (pathname === path ? { opacity: 1 } : { opacity: 0.8 });

  return (
    <div className="navbar">
      <div className="container">
        <div className="top-row">
          <div className="logo">
            <i className="fas fa-graduation-cap"></i>
            <h1>WEBSTAR INTERNATIONAL COLLEGE</h1>
          </div>
        </div>

        <div className="subtitle">
          Smart Alert
        </div>

        <div className="nav-links">
          <Link to="/" style={active("/")}>Students</Link>
          <Link to="/attendance" style={active("/attendance")}>Mark Attendance</Link>
          <Link to="/records" style={active("/records")}>Records</Link>
          <Link to="/parent" style={active("/parent")}>Parent Portal</Link>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
