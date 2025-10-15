import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../logo.png';
import './Navigation.css';

const Navigation = () => {
  const navigate = useNavigate();
  const [examMenuOpen, setExamMenuOpen] = useState(false);
  const examMenuRef = useRef(null);

  const handleProfileClick = (e) => {
    e.preventDefault();
    navigate('/profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('lastUserID');
    navigate('/login');
  };

  const handleNavClick = (e) => {
    e.preventDefault();
    const targetId = e.target.getAttribute('href');
    if (targetId === '#' || targetId === '#home') {
      navigate('/home');
    } else if (targetId) {
      navigate('/home');
      setTimeout(() => {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          window.scrollTo({
            top: targetElement.offsetTop - 80,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (examMenuRef.current && !examMenuRef.current.contains(e.target)) {
        setExamMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <header className="navigation-header">
        <div className="nav-container">
          <div className="nav-content">
            <div className="logo-section">
              <img src={logo} alt="Smart Alert Logo" className="logo-image" />
              <h1 className="logo-text">Smart Alert</h1>
            </div>
            <nav className="main-navigation">
              <ul className="nav-menu">
                <li><a href="#home" onClick={handleNavClick}>Home</a></li>
                <li><a href="#features" onClick={handleNavClick}>Features</a></li>
                <li><a href="#about" onClick={handleNavClick}>About</a></li>
                <li><a href="#contact" onClick={handleNavClick}>Contact</a></li>
              </ul>
            </nav>
            <div className="user-actions">
              <a href="#" className="profile-button" onClick={handleProfileClick}>
                <i className="fas fa-user-circle"></i>
                <span>Profile</span>
              </a>
              <a href="#" className="logout-button" onClick={(e) => { e.preventDefault(); handleLogout(); }}>
                <i className="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Action Buttons Section */}
      <section className="main-actions-section">
        <div className="nav-container">
          <div className="main-actions">
            <button className="action-btn action-btn-admin-dashboard" onClick={(e) => { e.preventDefault(); navigate('/admin-dashboard'); }}>
              <i className="fas fa-tachometer-alt"></i>
              <span>Admin Dashboard</span>
            </button>
            <button className="action-btn action-btn-mark-attendance" onClick={(e) => { e.preventDefault(); navigate('/attendance'); }}>
              <i className="fas fa-clipboard-check"></i>
              <span>Mark Attendance</span>
            </button>
            <button className="action-btn action-btn-notices" onClick={(e) => { e.preventDefault(); navigate('/display-notices'); }}>
              <i className="fas fa-bullhorn"></i>
              <span>Notices</span>
            </button>
            <div className="action-btn action-btn-examination" ref={examMenuRef}>
              <button className="btn-iconless" onClick={(e) => { e.preventDefault(); setExamMenuOpen(s => !s); }}>
                <i className="fas fa-file-alt"></i>
                <span>Examination</span>
                <i className="fas fa-caret-down"></i>
              </button>
              {examMenuOpen && (
                <div className="exam-dropdown">
                  <button onClick={() => { setExamMenuOpen(false); navigate('/timetable'); }}>Timetable & Hall Arrangement</button>
                  <button onClick={() => { setExamMenuOpen(false); navigate('/exams'); }}>Exams</button>
                </div>
              )}
            </div>
            <button className="action-btn action-btn-shuttle" onClick={(e) => { e.preventDefault(); navigate('/shuttle-services'); }}>
              <i className="fas fa-bus"></i>
              <span>Shuttle Services</span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Navigation;
