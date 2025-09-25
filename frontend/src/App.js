import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import TimeTableHallArrangement from './Components/TimeTableHallArrangement/TimeTableHallArrangement';
import ReportCard from './Components/ReportCard/ReportCard';
import ReportCardView from './Components/ReportCardView/ReportCardView';
import ProgressAnalysis from './Components/ProgressAnalysis/ProgressAnalysis';
import ReportData from './Components/ReportData/ReportData';
import TimeTableDataEntry from './Components/TimeTableHallArrangementData/TimeTableDataEntry';

function App() {
  return (
    <Router>
      <div className="App">
        <nav style={{
          background: 'linear-gradient(to right, #00897b 0%, #00bfa5 100%)',
          padding: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <h1 style={{ color: 'white', margin: 0, fontSize: '24px' }}>Smart Alert</h1>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link 
                to="/" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none', 
                  padding: '0.5rem 1rem',
                  borderRadius: '5px',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Time Table
              </Link>
              <Link 
                to="/report-card" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none', 
                  padding: '0.5rem 1rem',
                  borderRadius: '5px',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Report Card
              </Link>
              <Link 
                to="/progress-analysis" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none', 
                  padding: '0.5rem 1rem',
                  borderRadius: '5px',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Progress Analysis
              </Link>
              <Link 
                to="/report-data" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none', 
                  padding: '0.5rem 1rem',
                  borderRadius: '5px',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Report Data Entry
              </Link>
              <Link 
                to="/timetable-data-entry" 
                style={{ 
                  color: 'white', 
                  textDecoration: 'none', 
                  padding: '0.5rem 1rem',
                  borderRadius: '5px',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                Timetable Data Entry
              </Link>
            </div>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<TimeTableHallArrangement />} />
          <Route path="/report-card" element={<ReportCard />} />
          <Route path="/report-card/:studentId" element={<ReportCardView />} />
          <Route path="/progress-analysis" element={<ProgressAnalysis />} />
          <Route path="/report-data" element={<ReportData />} />
          <Route path="/timetable-data-entry" element={<TimeTableDataEntry />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
