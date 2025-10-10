import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [user, setUser] = useState(null);
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    parents: 0,
    teachers: 0
  });
  const [features, setFeatures] = useState([
    {
      id: 1,
      title: "Attendance Monitoring",
      description: "Track student and staff attendance in real-time with automated reporting and alerts for absentees.",
      icon: "fas fa-clipboard-check"
    },
    {
      id: 2,
      title: "Transportation Tracking",
      description: "Monitor school buses in real-time with GPS tracking and send arrival notifications to parents.",
      icon: "fas fa-bus"
    },
    {
      id: 3,
      title: "Performance Monitoring",
      description: "Track academic progress with detailed analytics, grade books, and performance reports.",
      icon: "fas fa-chart-line"
    },
    {
      id: 4,
      title: "Announcements",
      description: "Broadcast important updates, events, and emergency alerts to students, parents, and staff.",
      icon: "fas fa-bullhorn"
    },
    {
      id: 5,
      title: "Parent Communication",
      description: "Facilitate seamless communication between teachers and parents with messaging and notifications.",
      icon: "fas fa-comments"
    }
  ]);
  const [newFeature, setNewFeature] = useState({
    title: '',
    description: '',
    icon: ''
  });

  // Load user data, statistics, and features
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await api('/auth/me');
        setUser(userData?.user || userData);
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    const loadUserStats = async () => {
      try {
        const stats = await api('/users/stats');
        setUserStats(stats);
      } catch (error) {
        console.error('Failed to load user statistics:', error);
      }
    };

    const loadFeatures = async () => {
      try {
        const response = await api('/features');
        setFeatures(response.features || []);
      } catch (error) {
        console.error('Failed to load features:', error);
        // Keep default features if API fails
      }
    };

    loadUserData();
    loadUserStats();
    loadFeatures();
  }, []);

  const handleProfileClick = (e) => {
    e.preventDefault();
    navigate('/profile');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('lastUserID');
    navigate('/login');
  };

  const handleGetStarted = (e) => {
    e.preventDefault();
    alert('Thank you for your interest! A representative will contact you soon.');
  };

  const handleAddFeature = () => {
    setEditingFeature(null);
    setNewFeature({ title: '', description: '', icon: '' });
    setShowModal(true);
  };

  const handleEditFeature = (feature) => {
    setEditingFeature(feature);
    setNewFeature({
      title: feature.title,
      description: feature.description,
      icon: feature.icon
    });
    setShowModal(true);
  };

  const handleDeleteFeature = async (featureId) => {
    if (window.confirm('Are you sure you want to delete this feature?')) {
      try {
        await api(`/features/${featureId}`, { method: 'DELETE' });
        setFeatures(prev => prev.filter(f => f._id !== featureId));
        alert('Feature deleted successfully!');
      } catch (error) {
        console.error('Failed to delete feature:', error);
        alert('Failed to delete feature. Please try again.');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFeature(null);
    setNewFeature({ title: '', description: '', icon: '' });
  };

  const handleFeatureSubmit = async (e) => {
    e.preventDefault();
    
    if (newFeature.title && newFeature.description && newFeature.icon) {
      try {
        if (editingFeature) {
          // Update existing feature
          const response = await api(`/features/${editingFeature._id}`, {
            method: 'PUT',
            body: {
              title: newFeature.title,
              description: newFeature.description,
              icon: newFeature.icon
            }
          });
          
          setFeatures(prev => prev.map(f => 
            f._id === editingFeature._id ? response.feature : f
          ));
          alert('Feature updated successfully!');
        } else {
          // Add new feature
          const response = await api('/features', {
            method: 'POST',
            body: {
              title: newFeature.title,
              description: newFeature.description,
              icon: newFeature.icon
            }
          });
          
          setFeatures(prev => [...prev, response.feature]);
          alert('New feature added successfully!');
        }
        
        setNewFeature({ title: '', description: '', icon: '' });
        setEditingFeature(null);
        setShowModal(false);
      } catch (error) {
        console.error('Failed to save feature:', error);
        alert('Failed to save feature. Please try again.');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFeature(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNavClick = (e) => {
    e.preventDefault();
    const targetId = e.target.getAttribute('href');
    if (targetId !== '#') {
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <div className="home-page">
      {/* Header */}
      <header>
        <div className="container">
          <div className="header-content">
            <div className="logo">
              <i className="fas fa-graduation-cap"></i>
              <h1>Smart Alert</h1>
            </div>
            <nav>
              <ul>
                <li><a href="#" onClick={handleNavClick}>Home</a></li>
                <li><a href="#features" onClick={handleNavClick}>Features</a></li>
                <li><a href="#about" onClick={handleNavClick}>About</a></li>
                <li><a href="#contact" onClick={handleNavClick}>Contact</a></li>
              </ul>
            </nav>
            <div className="header-actions">
              {user && user.role && user.role.toLowerCase() === 'admin' && (
                <>
                  <a href="#" className="admin-dashboard-button" onClick={(e) => { e.preventDefault(); navigate('/admin-dashboard'); }}>
                    <i className="fas fa-tachometer-alt"></i>
                    <span>Admin Dashboard</span>
                  </a>
                  <a href="#" className="admin-dashboard-button" onClick={(e) => { e.preventDefault(); navigate('/admin-create-notice'); }}>
                    <i className="fas fa-bullhorn"></i>
                    <span>Notices</span>
                  </a>
                </>
              )}
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

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <h2>Under Development</h2>
          <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
          <a href="#" className="btn-hero" onClick={handleGetStarted}>Button</a>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="container">
          <div className="section-title">
            <h2>Features</h2>
            <p>lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
          </div>
          <div className="features-grid">
            {features.map(feature => (
              <div key={feature._id || feature.id} className="feature-card">
                <div className="feature-icon">
                  <i className={feature.icon}></i>
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                {user && user.role && user.role.toLowerCase() === 'admin' && (
                  <div className="feature-actions">
                    <button 
                      className="edit-btn" 
                      onClick={() => handleEditFeature(feature)}
                      title="Edit Feature"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className="delete-btn" 
                      onClick={() => handleDeleteFeature(feature._id || feature.id)}
                      title="Delete Feature"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                )}
              </div>
            ))}
            {user && user.role && user.role.toLowerCase() === 'admin' && (
              <div className="add-feature-card" onClick={handleAddFeature}>
                <div className="feature-icon">
                  <i className="fas fa-plus"></i>
                </div>
                <p>Add New Feature</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <h3>{userStats.totalUsers}</h3>
              <p>Total Users</p>
            </div>
            <div className="stat-item">
              <h3>{userStats.parents}</h3>
              <p>Parents</p>
            </div>
            <div className="stat-item">
              <h3>{userStats.teachers}</h3>
              <p>Teachers</p>
            </div>
            <div className="stat-item">
              <h3>99.9%</h3>
              <p>System Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact">
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <h3>Smart Alert</h3>
              <p>lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
            </div>
            <div className="footer-column">
              <h3>Quick Links</h3>
              <ul>
                <li><a href="#" onClick={handleNavClick}>Home</a></li>
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

      {/* Modal for adding/editing feature */}
      {showModal && (
        <div className="modal" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingFeature ? 'Edit Feature' : 'Add New Feature'}</h3>
            <form onSubmit={handleFeatureSubmit}>
              <div className="form-group">
                <label htmlFor="featureTitle">Feature Title</label>
                <input 
                  type="text" 
                  id="featureTitle" 
                  name="title"
                  value={newFeature.title}
                  onChange={handleInputChange}
                  placeholder="Enter feature title" 
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="featureDescription">Feature Description</label>
                <textarea 
                  id="featureDescription" 
                  name="description"
                  value={newFeature.description}
                  onChange={handleInputChange}
                  placeholder="Enter feature description" 
                  required 
                />
              </div>
              <div className="form-group">
                <label htmlFor="featureIcon">Select Icon</label>
                <select 
                  id="featureIcon" 
                  name="icon"
                  value={newFeature.icon}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select an icon</option>
                  <option value="fa-user-graduate">Graduation Cap</option>
                  <option value="fa-chalkboard-teacher">Chalkboard Teacher</option>
                  <option value="fa-book">Book</option>
                  <option value="fa-calendar-alt">Calendar</option>
                  <option value="fa-chart-bar">Chart Bar</option>
                  <option value="fa-clock">Clock</option>
                  <option value="fa-cogs">Cogs</option>
                  <option value="fa-file-alt">File</option>
                </select>
              </div>
              <div className="modal-buttons">
                <button type="button" className="modal-btn btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="modal-btn btn-submit">
                  {editingFeature ? 'Update Feature' : 'Add Feature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
