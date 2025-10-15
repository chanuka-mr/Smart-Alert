import React from 'react';
import { Link } from 'react-router-dom';
import Navigation from '../Navigation/Navigation';
import Footer from '../Footer/Footer';
import './Examination.css';

const MenuCard = ({ icon, title, subtitle, to }) => {
  return (
    <Link to={to} className="menu-card-link">
      <div className="menu-card">
        <div className="menu-card-icon">
          <i className={icon}></i>
        </div>
        <div className="menu-card-content">
          <h3 className="menu-card-title">{title}</h3>
          <p className="menu-card-subtitle">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
};

const ExamOnly = () => {
  return (
    <>
      <Navigation />
      <div className="examination-container">
        <div className="examination-header">
        <h1 className="examination-title">Exam</h1>
        <p className="examination-description">Report cards, data entry and performance analysis</p>
      </div>

      <div className="menu-cards-container">
        <MenuCard
          icon="fas fa-file-alt"
          title="Report Card"
          subtitle="Generation & view"
          to="/report-card"
        />
        
        <MenuCard
          icon="fas fa-keyboard"
          title="Report Data Entry"
          subtitle="Enter marks & details"
          to="/report-data"
        />
        
        <MenuCard
          icon="fas fa-chart-line"
          title="Progress Analysis"
          subtitle="Insights & trends"
          to="/progress-analysis"
        />
      </div>
      </div>
      <Footer />
    </>
  );
};

export default ExamOnly;
