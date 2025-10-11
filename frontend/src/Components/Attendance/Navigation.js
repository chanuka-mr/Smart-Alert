import React from 'react';
import './Navigation.css';

const Navigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    {
      id: 'shuttles',
      label: 'Shuttle Management',
      icon: '🚌',
      description: 'Manage shuttle fleet and routes'
    },
    {
      id: 'drivers',
      label: 'Driver Management',
      icon: '👨‍✈️',
      description: 'Manage drivers and assignments'
    },
    {
      id: 'students',
      label: 'Student Registration',
      icon: '👨‍🎓',
      description: 'Register and manage students'
    },
    {
      id: 'tracking',
      label: 'Live Tracking',
      icon: '🗺️',
      description: 'Real-time shuttle tracking'
    }
  ];

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <div className="brand-icon">🚌</div>
          <div className="brand-content">
            <h1>Smart Alert</h1>
            <p>Shuttle Management System</p>
          </div>
        </div>
        <div className="nav-tabs">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              title={tab.description}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
