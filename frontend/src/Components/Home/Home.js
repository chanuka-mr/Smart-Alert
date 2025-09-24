import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="home-container">
      <h1>Smart Alert Home</h1>
      <div className="home-buttons">
  <button className="btn-primary" onClick={() => navigate('/admin-create-notice')}>Admin Create Notice</button>
  <button className="btn-primary" onClick={() => navigate('/teacher-create-notice')}>Teacher Create Notice</button>
  <button className="btn-primary" onClick={() => navigate('/direct-message-teacher')}>Direct Message Teacher</button>
  <button className="btn-primary" onClick={() => navigate('/direct-message-parent')}>Direct Message Parent</button>
  <button className="btn-primary" onClick={() => navigate('/display-notices')}>Display Notices</button>
  <button className="btn-primary" onClick={() => navigate('/update-admin-notices')}>Update Admin Notices</button>
  <button className="btn-primary" onClick={() => navigate('/update-teacher-notices')}>Update Teacher Notices</button>
      </div>
    </div>
  );
};

export default Home;
