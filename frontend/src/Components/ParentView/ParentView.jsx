import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import './ParentView.css';

const ParentView = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchMyAttendance();
  }, []);

  const fetchMyAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api('/attendance/my-attendance');
      
      setStudentData(response.student);
      setRecords(response.records);
      setStats(response.stats);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      
      if (err.status === 403) {
        setError('Access denied. This page is only for students/parents.');
      } else if (err.status === 401) {
        setError('Please log in to view your attendance.');
      } else {
        setError(err.message || 'Failed to load attendance data');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return 'status-present';
      case 'Absent':
        return 'status-absent';
      case 'Late':
        return 'status-late';
      case 'Excused':
        return 'status-excused';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className="parent-view-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your attendance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="parent-view-container">
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="parent-view-container">
      {/* Student Info Card */}
      <div className="student-info-card">
        <div className="card-header">
          <i className="fas fa-user-graduate"></i>
          <h2>Student Information</h2>
        </div>
        <div className="card-body">
          <div className="info-row">
            <span className="info-label">Student ID:</span>
            <span className="info-value">{studentData?.userID}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Name:</span>
            <span className="info-value">{studentData?.name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{studentData?.email}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Section:</span>
            <span className="info-value">{studentData?.section}</span>
          </div>
        </div>
      </div>

      {/* Attendance Statistics */}
      {stats && (
        <div className="stats-container">
          <div className="stat-card stat-total">
            <i className="fas fa-calendar-check"></i>
            <div className="stat-content">
              <h3>{stats.total}</h3>
              <p>Total Days</p>
            </div>
          </div>
          <div className="stat-card stat-present">
            <i className="fas fa-check-circle"></i>
            <div className="stat-content">
              <h3>{stats.present}</h3>
              <p>Present</p>
            </div>
          </div>
          <div className="stat-card stat-absent">
            <i className="fas fa-times-circle"></i>
            <div className="stat-content">
              <h3>{stats.absent}</h3>
              <p>Absent</p>
            </div>
          </div>
          <div className="stat-card stat-late">
            <i className="fas fa-clock"></i>
            <div className="stat-content">
              <h3>{stats.late}</h3>
              <p>Late</p>
            </div>
          </div>
          <div className="stat-card stat-percentage">
            <i className="fas fa-percentage"></i>
            <div className="stat-content">
              <h3>{stats.attendancePercentage}%</h3>
              <p>Attendance Rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Records Table */}
      <div className="attendance-records-card">
        <div className="card-header">
          <i className="fas fa-list"></i>
          <h2>Attendance History</h2>
        </div>
        <div className="card-body">
          {records.length === 0 ? (
            <div className="no-records">
              <i className="fas fa-inbox"></i>
              <p>No attendance records found</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="attendance-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Justification</th>
                    <th>Parent Notified</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record._id}>
                      <td>{formatDate(record.date)}</td>
                      <td>
                        <span className={`status-badge ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td>{record.justification || '-'}</td>
                      <td>
                        {record.notifiedParent ? (
                          <span className="notified-yes">
                            <i className="fas fa-check"></i> Yes
                          </span>
                        ) : (
                          <span className="notified-no">
                            <i className="fas fa-times"></i> No
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentView;
