import React from 'react';
import { Link } from 'react-router-dom';
import './Examination.css';

const SectionCard = ({ title, description, links }) => {
  return (
    <div className="exam-section-card">
      <div className="exam-section-header">
        <h3>{title}</h3>
        {description ? <p className="exam-section-desc">{description}</p> : null}
      </div>
      <div className="exam-links">
        {links.map(link => (
          <Link key={link.to} to={link.to} className="exam-link">
            <div className="exam-link-card">
              <div className="exam-link-title">{link.label}</div>
              {link.subtitle ? <div className="exam-link-subtitle">{link.subtitle}</div> : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default function Examination() {
  return (
    <div className="examination-container">
      <div className="examination-header">
        <h2>Examination</h2>
        <p className="examination-subtitle">Manage timetables, hall arrangements, report cards and analysis</p>
      </div>

      <div className="examination-grid">
        <SectionCard
          title="Timetable & Hall Arrangement"
          description="Create, view and download timetables and hall arrangements"
          links={[
            { to: '/timetable', label: 'TimeTable & Hall Arrangement', subtitle: 'Browse & download' },
            { to: '/timetable-data-entry', label: 'TimeTable/Hall Data Entry', subtitle: 'Add & update data' },
          ]}
        />

        <SectionCard
          title="Exam"
          description="Report cards, data entry and performance analysis"
          links={[
            { to: '/report-card', label: 'Report Card', subtitle: 'Generate & view' },
            { to: '/report-data', label: 'Report Data Entry', subtitle: 'Enter marks & details' },
            { to: '/progress-analysis', label: 'Progress Analysis', subtitle: 'Insights & trends' },
            { to: '/report-card', label: 'Report Card View', subtitle: 'Search & view by student' },
          ]}
        />
      </div>

      <div className="examination-all-pages">
        <h4>All related pages</h4>
        <ul>
          <li>
            <Link to="/progress-analysis">1. ProgressAnalysis (ProgressAnalysis.css, ProgressAnalysis.js)</Link>
          </li>
          <li>
            <Link to="/report-card">2. ReportCard (ReportCard.css, ReportCard.js)</Link>
          </li>
          <li>
            <Link to="/report-card">3. ReportCardView (ReportCardView.css, ReportCardView.js)</Link>
          </li>
          <li>
            <Link to="/report-data">4. ReportData (ReportData.css, ReportData.js)</Link>
          </li>
          <li>
            <Link to="/timetable">5. TimeTableHallArrangement (README.md, TimeTableHallArrangement.css, TimeTableHallArrangement.js)</Link>
          </li>
          <li>
            <Link to="/timetable-data-entry">6. TimeTableHallArrangementData (TimeTableDataEntry.css, TimeTableDataEntry.js)</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
