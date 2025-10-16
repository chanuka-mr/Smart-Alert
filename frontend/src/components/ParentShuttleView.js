import React, { useState } from 'react';
import GlobalNavigation from './Navigation/Navigation';
import StudentManagement from './StudentManagement';
import RealTimeTracking from './RealTimeTracking';
import './ShuttleServices/ShuttleServices.css';

const ParentShuttleView = () => {
  const [activeTab, setActiveTab] = useState('tracking');

  const renderContent = () => {
    switch (activeTab) {
      case 'registration':
        return <StudentManagement userRole="parent" />;
      case 'tracking':
        return <RealTimeTracking readOnly={true} userRole="parent" />;
      default:
        return <RealTimeTracking readOnly={true} userRole="parent" />;
    }
  };

  return (
    <div className="shuttle-services-container">
      <GlobalNavigation />
      <div className="shuttle-services-content">
        <div className="page-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Shuttle Services - Parent Portal</h1>
              <p>Register your child and track shuttle locations in real-time</p>
            </div>
          </div>
        </div>

        {/* Parent-specific tab navigation */}
        <div className="parent-tabs">
          <button 
            className={`tab-button ${activeTab === 'tracking' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracking')}
          >
            <i className="fas fa-map-marker-alt"></i>
            Live Tracking
          </button>
          <button 
            className={`tab-button ${activeTab === 'registration' ? 'active' : ''}`}
            onClick={() => setActiveTab('registration')}
          >
            <i className="fas fa-user-plus"></i>
            Register Child
          </button>
        </div>

        {renderContent()}
      </div>
    </div>
  );
};

export default ParentShuttleView;
