import React, { useState } from 'react';
import './ProgressAnalysis.css';
import ProgressAnalysisAPI from '../../services/ProgressAnalysisAPI';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ProgressAnalysis = () => {
  const [studentId, setStudentId] = useState('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to determine trend
  const determineTrend = (term1, term2, term3) => {
    const values = [term1, term2, term3].filter(v => v !== null && v !== undefined);
    if (values.length < 2) return "Insufficient Data";
    
    if (values[values.length - 1] > values[0]) return "Improving";
    if (values[values.length - 1] < values[0]) return "Declining";
    return "Stable";
  };

  // Function to generate recommendation
  const generateRecommendation = (trend, latestScore) => {
    if (latestScore < 65) return "Provide extra practice and revision.";
    if (trend === "Improving" && latestScore >= 75) return "Good progress — continue current strategies.";
    return "Maintain effort.";
  };

  // Function to calculate grade based on marks
  const calculateGrade = (marks) => {
    if (marks >= 90) return 'A+';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B+';
    if (marks >= 60) return 'B';
    if (marks >= 50) return 'C+';
    if (marks >= 40) return 'C';
    if (marks >= 30) return 'D';
    return 'F';
  };

  // Function to create line chart data for overall progress
  const createOverallProgressChart = () => {
    if (!analysisData) return null;

    return {
      labels: ['1st Term', '2nd Term', '3rd Term'],
      datasets: [
        {
          label: 'Overall Average',
          data: [analysisData.term1Avg, analysisData.term2Avg, analysisData.term3Avg],
          borderColor: 'rgba(0, 137, 123, 1)',
          backgroundColor: 'rgba(0, 137, 123, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(0, 137, 123, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        }
      ]
    };
  };

  // Chart options for line chart
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Overall Progress Trend',
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#00897b',
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#00897b',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context) {
            return `Average: ${context.parsed.y.toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: '#666',
          font: {
            size: 11
          },
          callback: function(value) {
            return value + '%';
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: '#666',
          font: {
            size: 11,
            weight: '500'
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  // Function to display progress analysis
  const displayProgressAnalysis = async (studentId) => {
    setLoading(true);
    setError(null);
    
    try {
      const progressData = await ProgressAnalysisAPI.getProgressAnalysis(studentId);
      setAnalysisData(progressData);
      setShowAnalysis(true);
    } catch (err) {
      setError(err.message);
      setShowAnalysis(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle search button click
  const handleSearch = () => {
    if (!studentId.trim()) {
      setError('Please enter a student ID');
      return;
    }
    
    displayProgressAnalysis(studentId);
  };

  // Handle download button click
  const handleDownload = async () => {
    if (!studentId.trim()) {
      setError('Please search for a student first');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting PDF download for student:', studentId);
      await ProgressAnalysisAPI.downloadProgressAnalysisPDF(studentId);
      console.log('PDF download completed successfully');
    } catch (err) {
      console.error('PDF download error:', err);
      setError(`Failed to download PDF: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <h2>Student Progress Analysis</h2>
        <p>Track student progress across multiple terms with detailed analytics</p>
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

      {/* Search Section */}
      <div className="search-section">
        <div className="search-form">
          <div className="form-group">
            <label htmlFor="student-id">Student ID</label>
            <input 
              type="text" 
              id="student-id" 
              placeholder="Enter student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            />
          </div>
          <div className="form-group">
            <button 
              className="btn btn-primary" 
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Analysis */}
      <div className={`progress-analysis ${showAnalysis ? 'show' : ''}`}>
        {analysisData && (
          <>
            <div className="student-header">
              <h3>WEBSTER INTERNATIONAL SCHOOL</h3>
              <p>Student Progress Analysis</p>
            </div>

            <div className="student-info">
              <div className="info-item">
                <span className="info-label">Name of Student:</span>
                <span>{analysisData.name}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Student ID:</span>
                <span>{analysisData.studentId}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Class:</span>
                <span>Class {analysisData.grade}</span>
              </div>
            </div>

            <div className="term-averages">
              <div className="term-card">
                <div className="term-title">1st Term Average</div>
                <div className="term-value">{analysisData.term1Avg.toFixed(2)}</div>
              </div>
              <div className="term-card">
                <div className="term-title">2nd Term Average</div>
                <div className="term-value">{analysisData.term2Avg.toFixed(2)}</div>
              </div>
              <div className="term-card">
                <div className="term-title">3rd Term Average</div>
                <div className="term-value">{analysisData.term3Avg.toFixed(2)}</div>
              </div>
              <div className="term-card">
                <div className="term-title">Overall Progress</div>
                <div className="term-value">{analysisData.overallProgress}%</div>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>1st Term</th>
                    <th>Grade</th>
                    <th>2nd Term</th>
                    <th>Grade</th>
                    <th>3rd Term</th>
                    <th>Grade</th>
                    <th>Trend</th>
                    <th>Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {analysisData.subjects.map((subject, index) => (
                    <tr key={index}>
                      <td>{subject.subject}</td>
                      <td>{subject.term1 || '-'}</td>
                      <td>{subject.term1 ? calculateGrade(subject.term1) : '-'}</td>
                      <td>{subject.term2 || '-'}</td>
                      <td>{subject.term2 ? calculateGrade(subject.term2) : '-'}</td>
                      <td>{subject.term3 || '-'}</td>
                      <td>{subject.term3 ? calculateGrade(subject.term3) : '-'}</td>
                      <td>{subject.trend}</td>
                      <td>{subject.recommendation}</td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr style={{
                    backgroundColor: '#f0f9ff',
                    fontWeight: 'bold',
                    borderTop: '2px solid #00897b'
                  }}>
                    <td style={{
                      backgroundColor: '#00897b',
                      color: 'white',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}>
                      TOTAL MARKS
                    </td>
                    <td style={{
                      backgroundColor: '#e8f5e8',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#2e7d32'
                    }}>
                      {analysisData.subjects.reduce((sum, subject) => sum + (subject.term1 || 0), 0)}
                    </td>
                    <td style={{
                      backgroundColor: '#e8f5e8',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#2e7d32'
                    }}>
                      -
                    </td>
                    <td style={{
                      backgroundColor: '#f0f9ff',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#1976d2'
                    }}>
                      {analysisData.subjects.reduce((sum, subject) => sum + (subject.term2 || 0), 0)}
                    </td>
                    <td style={{
                      backgroundColor: '#f0f9ff',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#1976d2'
                    }}>
                      -
                    </td>
                    <td style={{
                      backgroundColor: '#fff3e0',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#f57c00'
                    }}>
                      {analysisData.subjects.reduce((sum, subject) => sum + (subject.term3 || 0), 0)}
                    </td>
                    <td style={{
                      backgroundColor: '#fff3e0',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#f57c00'
                    }}>
                      -
                    </td>
                    <td style={{
                      backgroundColor: '#f5f5f5',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#424242'
                    }}>
                      -
                    </td>
                    <td style={{
                      backgroundColor: '#f5f5f5',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#424242'
                    }}>
                      -
                    </td>
                  </tr>
                  {/* Average Row */}
                  <tr style={{
                    backgroundColor: '#f8f9fa',
                    fontWeight: 'bold',
                    borderTop: '1px solid #dee2e6'
                  }}>
                    <td style={{
                      backgroundColor: '#6c757d',
                      color: 'white',
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }}>
                      AVERAGE
                    </td>
                    <td style={{
                      backgroundColor: '#d4edda',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#155724'
                    }}>
                      {(analysisData.subjects.reduce((sum, subject) => sum + (subject.term1 || 0), 0) / analysisData.subjects.length).toFixed(2)}
                    </td>
                    <td style={{
                      backgroundColor: '#d4edda',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#155724'
                    }}>
                      -
                    </td>
                    <td style={{
                      backgroundColor: '#cce5ff',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#004085'
                    }}>
                      {(analysisData.subjects.reduce((sum, subject) => sum + (subject.term2 || 0), 0) / analysisData.subjects.length).toFixed(2)}
                    </td>
                    <td style={{
                      backgroundColor: '#cce5ff',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#004085'
                    }}>
                      -
                    </td>
                    <td style={{
                      backgroundColor: '#ffeaa7',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#856404'
                    }}>
                      {(analysisData.subjects.reduce((sum, subject) => sum + (subject.term3 || 0), 0) / analysisData.subjects.length).toFixed(2)}
                    </td>
                    <td style={{
                      backgroundColor: '#ffeaa7',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#856404'
                    }}>
                      -
                    </td>
                    <td style={{
                      backgroundColor: '#e9ecef',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#495057'
                    }}>
                      -
                    </td>
                    <td style={{
                      backgroundColor: '#e9ecef',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: '#495057'
                    }}>
                      -
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Grading System Reference */}
            <div style={{
              marginTop: '30px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6'
            }}>
              <h4 style={{
                color: '#00897b',
                marginBottom: '15px',
                textAlign: 'center',
                fontSize: '18px',
                fontWeight: 'bold'
              }}>
                Grading System
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '10px',
                textAlign: 'center'
              }}>
                <div style={{
                  padding: '8px',
                  backgroundColor: '#d4edda',
                  borderRadius: '4px',
                  border: '1px solid #c3e6cb'
                }}>
                  <strong style={{ color: '#155724' }}>A+</strong><br/>
                  <span style={{ fontSize: '12px', color: '#155724' }}>90-100</span>
                </div>
                <div style={{
                  padding: '8px',
                  backgroundColor: '#d1ecf1',
                  borderRadius: '4px',
                  border: '1px solid #bee5eb'
                }}>
                  <strong style={{ color: '#0c5460' }}>A</strong><br/>
                  <span style={{ fontSize: '12px', color: '#0c5460' }}>80-89</span>
                </div>
                <div style={{
                  padding: '8px',
                  backgroundColor: '#cce5ff',
                  borderRadius: '4px',
                  border: '1px solid #b3d7ff'
                }}>
                  <strong style={{ color: '#004085' }}>B+</strong><br/>
                  <span style={{ fontSize: '12px', color: '#004085' }}>70-79</span>
                </div>
                <div style={{
                  padding: '8px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '4px',
                  border: '1px solid #ffeaa7'
                }}>
                  <strong style={{ color: '#856404' }}>B</strong><br/>
                  <span style={{ fontSize: '12px', color: '#856404' }}>60-69</span>
                </div>
                <div style={{
                  padding: '8px',
                  backgroundColor: '#ffeaa7',
                  borderRadius: '4px',
                  border: '1px solid #fdcb6e'
                }}>
                  <strong style={{ color: '#856404' }}>C+</strong><br/>
                  <span style={{ fontSize: '12px', color: '#856404' }}>50-59</span>
                </div>
                <div style={{
                  padding: '8px',
                  backgroundColor: '#f8d7da',
                  borderRadius: '4px',
                  border: '1px solid #f5c6cb'
                }}>
                  <strong style={{ color: '#721c24' }}>C</strong><br/>
                  <span style={{ fontSize: '12px', color: '#721c24' }}>40-49</span>
                </div>
                <div style={{
                  padding: '8px',
                  backgroundColor: '#f5c6cb',
                  borderRadius: '4px',
                  border: '1px solid #f1b0b7'
                }}>
                  <strong style={{ color: '#721c24' }}>D</strong><br/>
                  <span style={{ fontSize: '12px', color: '#721c24' }}>30-39</span>
                </div>
                <div style={{
                  padding: '8px',
                  backgroundColor: '#f1b0b7',
                  borderRadius: '4px',
                  border: '1px solid #ec9ca3'
                }}>
                  <strong style={{ color: '#721c24' }}>F</strong><br/>
                  <span style={{ fontSize: '12px', color: '#721c24' }}>0-29</span>
                </div>
              </div>
            </div>

            {/* Overall Progress Trend Chart */}
            <div className="charts-section">
              <div className="chart-container">
                <div className="chart-wrapper">
                  <Line 
                    data={createOverallProgressChart()} 
                    options={lineChartOptions}
                  />
                </div>
              </div>
            </div>

            <div className="recommendations-section">
              <div className="recommendations-title">Overall Recommendations</div>
              <p>{analysisData.overallRecommendations}</p>
            </div>

            <div style={{textAlign: 'center'}}>
              <button 
                className="btn btn-primary" 
                onClick={handleDownload}
                disabled={loading}
              >
                {loading ? 'Downloading...' : 'Download Progress Analysis (PDF)'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProgressAnalysis;
