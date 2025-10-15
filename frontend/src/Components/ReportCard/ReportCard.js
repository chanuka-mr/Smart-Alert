import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../Navigation/Navigation';
import Footer from '../Footer/Footer';
import './ReportCard.css';
import ReportCardAPI from '../../services/ReportCardAPI';

// Edit Student Modal Component
const EditStudentModal = ({ student, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    studentName: student.studentName || '',
    grade: student.grade || '',
    classSection: student.classSection || '',
    subjects: student.subjects || []
  });

  // Common subjects by class level
  const subjectsByLevel = {
    '1': ['Sinhala', 'English', 'Tamil', 'Buddhist', 'Mathematics', 'Science', 'Art', 'Music', 'Dance'],
    '2': ['Sinhala', 'English', 'Tamil', 'Buddhist', 'Mathematics', 'Science', 'Art', 'Music', 'Dance'],
    '3': ['Sinhala', 'English', 'Tamil', 'Buddhist', 'Mathematics', 'Science', 'Art', 'Music', 'Dance'],
    '4': ['Sinhala', 'English', 'Tamil', 'Buddhist', 'Mathematics', 'Science', 'Art', 'Music', 'Dance'],
    '5': ['Sinhala', 'English', 'Tamil', 'Buddhist', 'Mathematics', 'Science', 'Art', 'Music', 'Dance'],
    '6': ['English', 'Science', 'Mathematics', 'Sinhala', 'Tamil', 'Buddhist', 'History', 'Agriculture', 'Home Science', 'ICT', 'Health and Physical Education', 'Art', 'Dance', 'Music', 'Drama', 'Literature', 'Geography', 'Business and Accounting Studies'],
    '7': ['English', 'Science', 'Mathematics', 'Sinhala', 'Tamil', 'Buddhist', 'History', 'Agriculture', 'Home Science', 'ICT', 'Health and Physical Education', 'Art', 'Dance', 'Music', 'Drama', 'Literature', 'Geography', 'Business and Accounting Studies'],
    '8': ['English', 'Science', 'Mathematics', 'Sinhala', 'Tamil', 'Buddhist', 'History', 'Agriculture', 'Home Science', 'ICT', 'Health and Physical Education', 'Art', 'Dance', 'Music', 'Drama', 'Literature', 'Geography', 'Business and Accounting Studies'],
    '9': ['English', 'Science', 'Mathematics', 'Sinhala', 'Tamil', 'Buddhist', 'History', 'Agriculture', 'Home Science', 'ICT', 'Health and Physical Education', 'Art', 'Dance', 'Music', 'Drama', 'Literature', 'Geography', 'Business and Accounting Studies'],
    '10': ['English', 'Science', 'Mathematics', 'Sinhala', 'Tamil', 'Buddhist', 'History', 'Agriculture', 'Home Science', 'ICT', 'Health and Physical Education', 'Art', 'Dance', 'Music', 'Drama', 'Literature', 'Geography', 'Business and Accounting Studies'],
    '11': ['English', 'Science', 'Mathematics', 'Sinhala', 'Tamil', 'Buddhist', 'History', 'Agriculture', 'Home Science', 'ICT', 'Health and Physical Education', 'Art', 'Dance', 'Music', 'Drama', 'Literature', 'Geography', 'Business and Accounting Studies']
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleSubjectChange = (index, field, value) => {
    const updatedSubjects = [...formData.subjects];
    updatedSubjects[index] = { ...updatedSubjects[index], [field]: value };
    setFormData({ ...formData, subjects: updatedSubjects });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Edit Student: {student.studentName}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Student Name:</label>
              <input
                type="text"
                value={formData.studentName}
                onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Grade:</label>
              <input
                type="number"
                min="1"
                max="11"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: parseInt(e.target.value) })}
                required
              />
            </div>
            <div className="form-group">
              <label>Class Section:</label>
              <input
                type="text"
                value={formData.classSection}
                onChange={(e) => setFormData({ ...formData, classSection: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Subjects:</label>
              {formData.subjects.map((subject, index) => (
                <div key={index} className="subject-edit">
                  <select
                    value={subject.subjectName || ''}
                    onChange={(e) => handleSubjectChange(index, 'subjectName', e.target.value)}
                    required
                  >
                    <option value="">Select Subject</option>
                    {formData.grade && subjectsByLevel[formData.grade] ? 
                      subjectsByLevel[formData.grade].map(subjectOption => (
                        <option 
                          key={subjectOption} 
                          value={subjectOption}
                        >
                          {subjectOption}
                        </option>
                      )) : (
                        <option value="" disabled>Please select a grade first</option>
                      )
                    }
                  </select>
                  <input
                    type="number"
                    placeholder="Term 1"
                    min="0"
                    max="100"
                    value={subject.term1 || ''}
                    onChange={(e) => handleSubjectChange(index, 'term1', parseInt(e.target.value))}
                  />
                  <input
                    type="number"
                    placeholder="Term 2"
                    min="0"
                    max="100"
                    value={subject.term2 || ''}
                    onChange={(e) => handleSubjectChange(index, 'term2', parseInt(e.target.value))}
                  />
                  <input
                    type="number"
                    placeholder="Term 3"
                    min="0"
                    max="100"
                    value={subject.term3 || ''}
                    onChange={(e) => handleSubjectChange(index, 'term3', parseInt(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Delete Confirmation Modal Component
const DeleteConfirmModal = ({ student, onConfirm, onCancel, loading }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Confirm Delete</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <p>Are you sure you want to delete the report card for:</p>
          <div style={{ 
            background: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '5px', 
            margin: '15px 0' 
          }}>
            <strong>Name:</strong> {student.studentName}<br />
            <strong>ID:</strong> {student.studentId}<br />
            <strong>Grade:</strong> {student.grade}<br />
            <strong>Class:</strong> {student.classSection}
          </div>
          <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>
            This action cannot be undone!
          </p>
        </div>
        <div className="modal-footer">
          <button onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            disabled={loading}
            style={{ 
              backgroundColor: '#d32f2f', 
              color: 'white',
              border: 'none'
            }}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ReportCard = () => {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState('');
  const [reportData, setReportData] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [studentRank, setStudentRank] = useState(null);
  
  // State for all students
  const [allStudents, setAllStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentsError, setStudentsError] = useState(null);
  
  // State for edit and delete operations
  const [editingStudent, setEditingStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);

  // Function to fetch all students
  const fetchAllStudents = async () => {
    setLoadingStudents(true);
    setStudentsError(null);
    
    try {
      const students = await ReportCardAPI.getAllReportCards();
      console.log('Fetched students:', students); // Debug log
      setAllStudents(students);
    } catch (err) {
      console.error('Error fetching students:', err); // Debug log
      setStudentsError(err.message);
    } finally {
      setLoadingStudents(false);
    }
  };

  // Handle search button click
  const handleSearch = () => {
    if (!studentId.trim()) {
      setError('Please enter a student ID');
      return;
    }
    
    // Navigate to the report card view page
    navigate(`/report-card/${studentId}`);
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

  // Handle edit student - navigate to ReportData page
  const handleEditStudent = (student) => {
    navigate('/report-data', {
      state: {
        editMode: true,
        editData: student
      }
    });
  };

  // Handle delete student
  const handleDeleteStudent = (student) => {
    setDeleteConfirm(student);
    setShowDeleteModal(true);
  };

  // Confirm delete student
  const confirmDeleteStudent = async () => {
    if (!deleteConfirm) return;
    
    setOperationLoading(true);
    try {
      await ReportCardAPI.deleteReportCard(deleteConfirm._id);
      // Refresh the students list
      await fetchAllStudents();
      setShowDeleteModal(false);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setOperationLoading(false);
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setShowEditModal(false);
    setEditingStudent(null);
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteConfirm(null);
  };

  // Handle edit submit
  const handleEditSubmit = async (updatedData) => {
    if (!editingStudent) return;
    
    setOperationLoading(true);
    try {
      await ReportCardAPI.updateReportCard(editingStudent._id, updatedData);
      // Refresh the students list
      await fetchAllStudents();
      setShowEditModal(false);
      setEditingStudent(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setOperationLoading(false);
    }
  };

  // Fetch all students on component mount
  useEffect(() => {
    fetchAllStudents();
  }, []);

  // Calculate summary values using API helper
  const calculateSummary = () => {
    if (!reportData) return { term1Total: 0, term2Total: 0, term3Total: 0, overallAverage: 0, classRank: 0 };
    
    console.log('Calculating summary for subjects:', reportData.subjects);
    const summary = ReportCardAPI.calculateSummary(reportData.subjects);
    console.log('Calculated summary:', summary);
    
    // Use actual rank from backend if available, otherwise calculate based on performance
    let classRank = 0;
    if (studentRank && studentRank.overallRank) {
      classRank = studentRank.overallRank;
    } else {
      // Fallback calculation based on overall average
      if (summary.overallAverage >= 90) {
        classRank = Math.floor(Math.random() * 5) + 1; // Top 5
      } else if (summary.overallAverage >= 80) {
        classRank = Math.floor(Math.random() * 10) + 6; // 6-15
      } else if (summary.overallAverage >= 70) {
        classRank = Math.floor(Math.random() * 10) + 16; // 16-25
      } else {
        classRank = Math.floor(Math.random() * 5) + 26; // 26-30
      }
    }

    return { 
      term1Total: summary.term1Total, 
      term2Total: summary.term2Total, 
      term3Total: summary.term3Total, 
      term1Average: summary.term1Average,
      term2Average: summary.term2Average,
      term3Average: summary.term3Average,
      overallAverage: summary.overallAverage, 
      classRank,
      totalStudents: studentRank ? studentRank.totalStudents : 0
    };
  };

  const summary = calculateSummary();

  return (
    <>
      <Navigation />
      <div className="container">
        <div className="page-header">
          <h2>Student Report Card</h2>
          <p>View and download student report cards</p>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <div className="search-form">
            <div className="form-group">
              <label htmlFor="student-id">Student ID</label>
              <input 
                type="text" 
                id="student-id" 
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter student ID"
              />
            </div>
            <button 
              className="btn btn-primary"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
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

        {/* All Students Section */}
        <div className="all-students-section">
          <h2>All Students</h2>
          <p>Students entered through data entry form</p>
          
          {loadingStudents && (
            <div className="loading-message">
              <p>Loading students...</p>
            </div>
          )}
          
          {studentsError && (
            <div className="error-message">
              <strong>Error:</strong> {studentsError}
            </div>
          )}
          
          {!loadingStudents && !studentsError && (
            <div className="students-grid">
              {allStudents.length > 0 ? (
                allStudents.map((student) => {
                  console.log('Rendering student:', student); // Debug log
                  return (
                    <div key={student._id} className="student-card">
                    <div className="student-card-header">
                      <h4>{student.studentName}</h4>
                      <span className="student-id">ID: {student.studentId}</span>
                    </div>
                    <div className="student-card-body">
                      <div className="student-info">
                        <div className="info-row">
                          <span className="label">Class:</span>
                          <span className="value">{student.grade}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Subjects:</span>
                          <span className="value">{student.subjects.length}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Overall Average:</span>
                          <span className="value">{student.overallAverage ? student.overallAverage.toFixed(2) : 'N/A'}%</span>
                        </div>
                      </div>
                      <div className="student-actions">
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => navigate(`/report-card/${student.studentId}`)}
                        >
                          View Report
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEditStudent(student)}
                          disabled={operationLoading}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteStudent(student)}
                          disabled={operationLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="no-students">
                  <p>No students found. Add students through the Data Entry form.</p>
                </div>
              )}
            </div>
          )}
        </div>

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
                <span className="detail-label">Class Level:</span>
                <span className="detail-value">{reportData.classLevel}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Grade:</span>
                <span className="detail-value">{reportData.grade}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Class Section:</span>
                <span className="detail-value">{reportData.classSection}</span>
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

        {/* Report Card */}
        <div className={`report-card ${showReport ? 'show' : ''}`}>
          {reportData && (
            <>
              <div className="report-header">
                <h3>WEBSTER INTERNATIONAL SCHOOL</h3>
                <p>Report Card</p>
              </div>

              <div className="student-info">
                <div className="info-item">
                  <span className="info-label">Name of Student:</span>
                  <span>{reportData.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Student ID:</span>
                  <span>{reportData.studentId}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Class:</span>
                  <span>Class {reportData.classLevel}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Term:</span>
                  <span>{reportData.term}</span>
                </div>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Subjects</th>
                      <th>1st Term</th>
                      <th>Grade</th>
                      <th>2nd Term</th>
                      <th>Grade</th>
                      <th>3rd Term</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.subjects.map((subject, index) => (
                      <tr key={index}>
                        <td>{subject.subject}</td>
                        <td>{subject.term1 || '-'}</td>
                        <td>{subject.term1 ? ReportCardAPI.calculateGrade(subject.term1) : '-'}</td>
                        <td>{subject.term2 || '-'}</td>
                        <td>{subject.term2 ? ReportCardAPI.calculateGrade(subject.term2) : '-'}</td>
                        <td>{subject.term3 || '-'}</td>
                        <td>{subject.term3 ? ReportCardAPI.calculateGrade(subject.term3) : '-'}</td>
                      </tr>
                    ))}
                    {/* Total Marks Row */}
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
                        {summary.term1Total}
                      </td>
                      <td style={{
                        backgroundColor: '#f0f9ff',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#00897b'
                      }}>
                        -
                      </td>
                      <td style={{
                        backgroundColor: '#e8f5e8',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#2e7d32'
                      }}>
                        {summary.term2Total}
                      </td>
                      <td style={{
                        backgroundColor: '#f0f9ff',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#00897b'
                      }}>
                        -
                      </td>
                      <td style={{
                        backgroundColor: '#e8f5e8',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#2e7d32'
                      }}>
                        {summary.term3Total}
                      </td>
                      <td style={{
                        backgroundColor: '#f0f9ff',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#00897b'
                      }}>
                        -
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="summary-section">
                <div className="summary-card">
                  <div className="summary-title">1st Term Average</div>
                  <div className="summary-value">{summary.term1Average.toFixed(2)}%</div>
                  <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                    Total: {summary.term1Total}
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-title">2nd Term Average</div>
                  <div className="summary-value">{summary.term2Average.toFixed(2)}%</div>
                  <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                    Total: {summary.term2Total}
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-title">3rd Term Average</div>
                  <div className="summary-value">{summary.term3Average.toFixed(2)}%</div>
                  <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                    Total: {summary.term3Total}
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-title">Overall Average</div>
                  <div className="summary-value">{summary.overallAverage.toFixed(2)}%</div>
                </div>
                <div className="summary-card">
                  <div className="summary-title">Class Rank</div>
                  <div className="summary-value">{summary.classRank}</div>
                  <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                    out of {summary.totalStudents} students
                  </div>
                </div>
              </div>

              <div className="comments-section">
                <div className="comments-title">Teacher's Comments & Feedback</div>
                <p>{reportData.feedback}</p>
              </div>

              <div style={{textAlign: 'center'}}>
                <button 
                  className="btn btn-primary" 
                  onClick={handleDownload}
                >
                  Download Report Card (PDF)
                </button>
              </div>
            </>
          )}
        </div>

        {/* Edit Modal */}
        {showEditModal && editingStudent && (
          <EditStudentModal
            student={editingStudent}
            onSubmit={handleEditSubmit}
            onCancel={cancelEdit}
            loading={operationLoading}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && deleteConfirm && (
          <DeleteConfirmModal
            student={deleteConfirm}
            onConfirm={confirmDeleteStudent}
            onCancel={cancelDelete}
            loading={operationLoading}
          />
        )}
      </div>
      <Footer />
    </>
  );
};

export default ReportCard;
