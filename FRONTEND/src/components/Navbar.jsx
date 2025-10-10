import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const { pathname } = useLocation();
  const active = (path) => (pathname === path ? 'active' : '');

  return (
    <div className="navbar">
      <div className="container">
        <div className="top-row">
          <div className="logo">
            <div className="logo-icon">🎓</div>
            <h1>WEBSTAR INTERNATIONAL COLLEGE</h1>
          </div>
        </div>

        <div className="subtitle">
          Smart Alert
        </div>

        <div className="nav-links">
          <Link to="/students" className={pathname === "/" || pathname === "/students" ? active("/students") : ''}>Students</Link>
          <Link to="/attendance" className={active("/attendance")}>Mark Attendance</Link>
          <Link to="/records" className={active("/records")}>Records</Link>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
