import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GlobalNavigation from '../Navigation/Navigation';
import ShuttleManagement from '../ShuttleManagement';
import StudentManagement from '../StudentManagement';
import RealTimeTracking from '../RealTimeTracking';
import { api } from '../../utils/api';
import './ShuttleServices.css';

const ShuttleServices = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Fetch user role on mount and redirect parents
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const response = await api('/auth/me', { method: 'GET' });
        const role = response?.user?.role || response?.role || '';
        const roleLower = role.toLowerCase();
        setUserRole(roleLower);
        
        // Redirect parents to their dedicated page
        if (roleLower === 'parent') {
          navigate('/shuttle-services/parent', { replace: true });
        }
      } catch (error) {
        console.error('Failed to fetch user role:', error);
        setUserRole('');
      } finally {
        setLoading(false);
      }
    };
    fetchUserRole();
  }, [navigate]);
  
  const initialTab = useMemo(() => {
    const fromState = location?.state?.tab;
    const fromQuery = new URLSearchParams(location.search).get('tab');
    const fromHash = location.hash ? location.hash.replace('#', '') : null;
    const fromPath = location?.pathname?.endsWith('/students')
      ? 'students'
      : location?.pathname?.endsWith('/tracking')
      ? 'tracking'
      : location?.pathname?.endsWith('/shuttles')
      ? 'shuttles'
      : null;
    
    // For parents, always default to tracking
    if (userRole === 'parent') {
      return 'tracking';
    }
    
    const candidate = fromState || fromQuery || fromHash || fromPath || 'shuttles';
    return ['shuttles', 'students', 'tracking'].includes(candidate) ? candidate : 'shuttles';
  }, [location, userRole]);

  const [activeTab, setActiveTab] = useState(initialTab);

  // Keep tab in sync when URL changes (e.g., navigating via navbar dropdown)
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const renderContent = () => {
    // Parents can only view tracking
    if (userRole === 'parent') {
      return <RealTimeTracking readOnly={true} userRole={userRole} />;
    }
    
    switch (activeTab) {
      case 'shuttles':
        return <ShuttleManagement userRole={userRole} />;
      case 'students':
        return <StudentManagement userRole={userRole} />;
      case 'tracking':
        return <RealTimeTracking readOnly={false} userRole={userRole} />;
      default:
        return <ShuttleManagement userRole={userRole} />;
    }
  };

  if (loading) {
    return (
      <div className="shuttle-services-container">
        <GlobalNavigation />
        <div className="shuttle-services-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="shuttle-services-container">
      <GlobalNavigation />
      <div className="shuttle-services-content">
        {userRole === 'parent' && (
          <div className="page-header">
            <div className="header-content">
              <div className="header-text">
                <h1>Live Tracking</h1>
                <p>View real-time shuttle locations and track your child's bus</p>
              </div>
            </div>
          </div>
        )}
        {renderContent()}
      </div>
    </div>
  );
};

export default ShuttleServices;
