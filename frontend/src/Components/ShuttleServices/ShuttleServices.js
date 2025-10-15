import React, { useState } from 'react';
import Navigation from '../Navigation';
import ShuttleManagement from '../ShuttleManagement';
import StudentManagement from '../StudentManagement';
import RealTimeTracking from '../RealTimeTracking';
import './ShuttleServices.css';

const ShuttleServices = () => {
  const [activeTab, setActiveTab] = useState('shuttles');

  const renderContent = () => {
    switch (activeTab) {
      case 'shuttles':
        return <ShuttleManagement />;
      case 'students':
        return <StudentManagement />;
      case 'tracking':
        return <RealTimeTracking />;
      default:
        return <ShuttleManagement />;
    }
  };

  return (
    <div className="shuttle-services-container">
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="shuttle-services-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default ShuttleServices;
