import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const navigate = useNavigate();

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

  return (
    <footer className="footer" id="contact">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-column">
            <h3>Smart Alert</h3>
            <p>lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
          </div>
          <div className="footer-column">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#home" onClick={handleNavClick}>Home</a></li>
              <li><a href="#features" onClick={handleNavClick}>Features</a></li>
              <li><a href="#about" onClick={handleNavClick}>About Us</a></li>
              <li><a href="#contact" onClick={handleNavClick}>Contact</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Resources</h3>
            <ul>
              <li><a href="#" onClick={handleNavClick}>Documentation</a></li>
              <li><a href="#" onClick={handleNavClick}>Support Center</a></li>
              <li><a href="#" onClick={handleNavClick}>Blog</a></li>
              <li><a href="#" onClick={handleNavClick}>Webinars</a></li>
              <li><a href="#" onClick={handleNavClick}>Community</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h3>Contact Us</h3>
            <ul>
              <li><i className="fas fa-map-marker-alt"></i> Hatton</li>
              <li><i className="fas fa-phone"></i> 0123456789</li>
              <li><i className="fas fa-envelope"></i> info@webster.edu</li>
            </ul>
          </div>
        </div>
        <div className="copyright">
          <p>&copy; 2023 Smart Alert School Management System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
