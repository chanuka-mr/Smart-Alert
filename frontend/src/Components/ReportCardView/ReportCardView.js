import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ReportCardView.css';
import ReportCardAPI from '../../services/ReportCardAPI';

const ReportCardView = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  
  const [reportData, setReportData] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studentRank, setStudentRank] = useState(null);

  // Grading system function
  const getGrade = (marks) => {
    if (marks >= 90) return 'A+';
    if (marks >= 85) return 'A';
    if (marks >= 80) return 'A-';
    if (marks >= 75) return 'B+';
    if (marks >= 70) return 'B';
    if (marks >= 65) return 'B-';
    if (marks >= 60) return 'C+';
    if (marks >= 55) return 'C';
    if (marks >= 50) return 'C-';
    if (marks >= 45) return 'D+';
    if (marks >= 40) return 'D';
    return 'F';
  };

  // Function to fetch report card from backend
  const fetchReportCard = async (studentId) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch both report card and student rank in parallel
      const [reportCard, rankData] = await Promise.all([
        ReportCardAPI.getReportCardByStudentId(studentId),
        ReportCardAPI.getStudentRank(studentId)
      ]);
      
      setReportData(reportCard);
      setStudentRank(rankData);
      setShowReport(true);
    } catch (err) {
      setError(err.message);
      setShowReport(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle download button click
  const handleDownload = async () => {
    if (!studentId.trim()) {
      setError('Please search for a student first');
      return;
    }
    
    try {
      await ReportCardAPI.downloadReportCardPDF(studentId);
    } catch (err) {
      setError(err.message);
    }
  };

  // Calculate summary values using API helper
  const calculateSummary = () => {
    if (!reportData) return { term1Total: 0, term2Total: 0, term3Total: 0, overallAverage: 0, classRank: 0 };
    
    console.log('Calculating summary for subjects:', reportData.subjects);
    const summary = ReportCardAPI.calculateSummary(reportData.subjects);
    console.log('Calculated summary:', summary);
    return summary;
  };

  // Fetch report card when component mounts or studentId changes
  useEffect(() => {
    if (studentId) {
      fetchReportCard(studentId);
    }
  }, [studentId]);

  const summary = calculateSummary();

  return (
    <div className="container">
      {/* Page Content */}
      <div className="container">
        <div className="page-header">
          <h2>Report Card View</h2>
          <p>View and download student report card</p>
        </div>

        {/* Error Display */}
        {error && (
          <div style={{
            background: '#ffebee',
            border: '1px solid #f44336',
            borderRadius: '5px',
            padding: '15px',
            marginBottom: '20px',
            color: '#c62828'
          }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Student Details Display */}
        {reportData && (
          <div className="student-details-section">
            <h3>Student Information</h3>
            <div className="student-details-grid">
              <div className="detail-item">
                <span className="detail-label">Student ID:</span>
                <span className="detail-value">{reportData.studentId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Student Name:</span>
                <span className="detail-value">{reportData.studentName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Class:</span>
                <span className="detail-value">{reportData.class}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Academic Year:</span>
                <span className="detail-value">2023</span>
              </div>
            </div>
            
            {/* Student Performance Summary */}
            <div className="performance-summary">
              <h4>Performance Summary</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-label">Overall Average:</span>
                  <span className="summary-value">{reportData.overallAverage ? reportData.overallAverage.toFixed(2) : 'N/A'}%</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Class Rank:</span>
                  <span className="summary-value">{studentRank ? `${studentRank.overallRank}/${studentRank.totalStudents}` : 'N/A'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Total Subjects:</span>
                  <span className="summary-value">{reportData.subjects.length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grading System */}
        <div className="grading-system">
          <h4>Grading System</h4>
          <div className="grade-scale">
            <div className="grade-item">
              <span className="grade-letter">A+</span>
              <span className="grade-range">90-100</span>
            </div>
            <div className="grade-item">
              <span className="grade-letter">A</span>
              <span className="grade-range">85-89</span>
            </div>
            <div className="grade-item">
              <span className="grade-letter">A-</span>
              <span className="grade-range">80-84</span>
            </div>
            <div className="grade-item">
              <span className="grade-letter">B+</span>
              <span className="grade-range">75-79</span>
            </div>
            <div className="grade-item">
              <span className="grade-letter">B</span>
              <span className="grade-range">70-74</span>
            </div>
            <div className="grade-item">
              <span className="grade-letter">B-</span>
              <span className="grade-range">65-69</span>
            </div>
            <div className="grade-item">
              <span className="grade-letter">C+</span>
              <span className="grade-range">60-64</span>
            </div>
            <div className="grade-item">
              <span className="grade-letter">C</span>
              <span className="grade-range">55-59</span>
            </div>
            <div className="grade-item">
              <span className="grade-letter">C-</span>
              <span className="grade-range">50-54</span>
            </div>
            <div className="grade-item">
              <span className="grade-letter">D+</span>
              <span className="grade-range">45-49</span>
            </div>
            <div className="grade-item">
              <span className="grade-letter">D</span>
              <span className="grade-range">40-44</span>
            </div>
            <div className="grade-item">
              <span className="grade-letter">F</span>
              <span className="grade-range">0-39</span>
            </div>
          </div>
        </div>

        {/* Report Card */}
        <div className={`report-card ${showReport ? 'show' : ''}`}>
          {loading && (
            <div className="loading-message">
              <p>Loading report card...</p>
            </div>
          )}
          
          {reportData && (
            <div className="report-content">
              {/* Report Header */}
              <div className="report-header">
                <h2>Report Card</h2>
                <div className="report-info">
                  <p><strong>Student:</strong> {reportData.studentName}</p>
                  <p><strong>Class:</strong> {reportData.class}</p>
                  <p><strong>Academic Year:</strong> 2023</p>
                </div>
              </div>

              {/* Subjects Table */}
              <div className="subjects-section">
                <h3>Subject Performance</h3>
                <table className="subjects-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Term 1</th>
                      <th>Grade</th>
                      <th>Term 2</th>
                      <th>Grade</th>
                      <th>Term 3</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.subjects.map((subject, index) => (
                      <tr key={index}>
                        <td>{subject.subjectName}</td>
                        <td>{subject.term1Marks || '-'}</td>
                        <td>{subject.term1Marks ? getGrade(subject.term1Marks) : '-'}</td>
                        <td>{subject.term2Marks || '-'}</td>
                        <td>{subject.term2Marks ? getGrade(subject.term2Marks) : '-'}</td>
                        <td>{subject.term3Marks || '-'}</td>
                        <td>{subject.term3Marks ? getGrade(subject.term3Marks) : '-'}</td>
                      </tr>
                    ))}
                    {/* Total Row */}
                    <tr className="total-row">
                      <td><strong>Total Marks</strong></td>
                      <td><strong>{summary.term1Total}</strong></td>
                      <td><strong>-</strong></td>
                      <td><strong>{summary.term2Total}</strong></td>
                      <td><strong>-</strong></td>
                      <td><strong>{summary.term3Total}</strong></td>
                      <td><strong>-</strong></td>
                    </tr>
                    {/* Average Row */}
                    <tr className="average-row">
                      <td><strong>Average</strong></td>
                      <td><strong>{summary.term1Average.toFixed(2)}</strong></td>
                      <td><strong>-</strong></td>
                      <td><strong>{summary.term2Average.toFixed(2)}</strong></td>
                      <td><strong>-</strong></td>
                      <td><strong>{summary.term3Average.toFixed(2)}</strong></td>
                      <td><strong>-</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Comments Section */}
              {reportData.teacherComments && (
                <div className="comments-section">
                  <h3>Teacher Comments</h3>
                  <p>{reportData.teacherComments}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/report-card')}
          >
            <i className="fas fa-arrow-left"></i> Back to Report Cards
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={!reportData}
          >
            <i className="fas fa-download"></i> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportCardView;
