import React from 'react';
import { Link } from 'react-router-dom';
import './Examination.css';

const ExamOnly = () => {
  const links = [
    { to: '/report-card', label: 'Report Card', subtitle: 'Generate & view' },
    { to: '/report-data', label: 'Report Data Entry', subtitle: 'Enter marks & details' },
    { to: '/progress-analysis', label: 'Progress Analysis', subtitle: 'Insights & trends' }
  ];

  return (
    <div className="examination-container">
      <div className="examination-header">
        <h2>Exam</h2>
        <p className="examination-subtitle">Report cards, data entry and performance analysis</p>
      </div>

      <div className="exam-only-card">
        {links.map(link => (
          <Link key={link.to + link.label} to={link.to} className="exam-link">
            <div className="exam-link-card" style={{ marginBottom: 12 }}>
              <div className="exam-link-title">{link.label}</div>
              {link.subtitle ? <div className="exam-link-subtitle">{link.subtitle}</div> : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ExamOnly;
