import React from "react";
import { Link, useLocation } from "react-router-dom";

const Navbar = () => {
  const { pathname } = useLocation();
  const active = (path) => (pathname === path ? 'active' : '');

  return (
    <div className="navbar" style={{ background: '#ffffff', color: '#000000' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div className="top-row" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="logo-icon">🎓</div>
            <h1>WEBSTAR INTERNATIONAL COLLEGE</h1>
          </div>
        </div>

        <div className="subtitle" style={{ marginTop: 4 }}>
          Smart Alert
        </div>
      </div>
    </div>
  );
};

export default Navbar;
