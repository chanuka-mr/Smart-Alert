import React, { useState, useEffect } from 'react';
import { studentAPI, shuttleAPI } from '../services/api';
import './StudentManagement.css';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [shuttleRoutes, setShuttleRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewStudent, setIsNewStudent] = useState(true);

  // Form data for adding/editing students
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    route: '',
    guardianName: '',
    parentContactNo: ''
  });

  // Load students and shuttle routes on component mount
  useEffect(() => {
    loadStudents();
    loadShuttleRoutes();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await studentAPI.getAllStudents();
      setStudents(data);
      setError('');
    } catch (err) {
      setError('Failed to load students: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadShuttleRoutes = async () => {
    try {
      const data = await shuttleAPI.getAllShuttles();
      // Extract unique routes from shuttles
      const uniqueRoutes = [...new Set(data.map(shuttle => shuttle.route).filter(route => route))];
      setShuttleRoutes(uniqueRoutes);
    } catch (err) {
      console.error('Failed to load shuttle routes:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStudentIdChange = (e) => {
    const selectedUserId = e.target.value;
    
    if (selectedUserId === '') {
      // Reset form for new student
      setIsNewStudent(true);
      setFormData({
        userId: '',
        name: '',
        route: '',
        guardianName: '',
        parentContactNo: ''
      });
    } else if (selectedUserId === 'new') {
      // New student option selected
      setIsNewStudent(true);
      setFormData({
        userId: '',
        name: '',
        route: '',
        guardianName: '',
        parentContactNo: ''
      });
    } else {
      // Existing student selected - auto-fill data
      const selectedStudent = students.find(student => student.userId === selectedUserId);
      if (selectedStudent) {
        setIsNewStudent(false);
        setFormData({
          userId: selectedStudent.userId,
          name: selectedStudent.name,
          route: selectedStudent.route,
          guardianName: selectedStudent.guardianName,
          parentContactNo: selectedStudent.parentContactNo
        });
        setEditingId(selectedStudent._id);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      name: '',
      route: '',
      guardianName: '',
      parentContactNo: ''
    });
    setShowAddForm(false);
    setEditingId(null);
    setIsNewStudent(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update existing student
        await studentAPI.updateStudent(editingId, formData);
        setSuccess('Student updated successfully!');
      } else {
        // Add new student
        await studentAPI.addStudent(formData);
        setSuccess('Student registered successfully!');
      }
      resetForm();
      loadStudents();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (student) => {
    setFormData({
      userId: student.userId || '',
      name: student.name || '',
      route: student.route || '',
      guardianName: student.guardianName || '',
      parentContactNo: student.parentContactNo || ''
    });
    setEditingId(student._id);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentAPI.deleteStudent(id);
        setSuccess('Student deleted successfully!');
        loadStudents();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.route?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.guardianName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.parentContactNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading students...</div>;
  }

  return (
    <div className="student-management">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Student Registration & Management</h1>
            <p>Register and manage student information with shuttle route assignments</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-secondary"
              onClick={loadShuttleRoutes}
              title="Refresh shuttle routes"
            >
              <span>🔄</span>
              Refresh Routes
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              <span>👨‍🎓</span>
              Register New Student
            </button>
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error fade-in">{error}</div>}
      {success && <div className="alert alert-success fade-in">{success}</div>}

      <div className="search-section">
        <div className="search-container">
          <div className="search-icon">🔍</div>
          <input
            type="text"
            placeholder="Search students by name, ID, or route..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
        <div className="search-stats">
          {filteredStudents.length} of {students.length} students
        </div>
      </div>

      {showAddForm && (
        <div className="form-container slide-up">
          <h3>{isNewStudent ? 'Register New Student' : 'Edit Student'}</h3>
          <form onSubmit={handleSubmit} className="student-form">
            <div className="form-group">
              <label>Select Student *</label>
              <select
                name="studentSelection"
                value={isNewStudent ? 'new' : formData.userId}
                onChange={handleStudentIdChange}
                required
                className="student-select"
              >
                <option value="">Choose an option...</option>
                <option value="new">➕ Register New Student</option>
                {students.map((student) => (
                  <option key={student._id} value={student.userId}>
                    {student.userId} - {student.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Student ID *</label>
                <input
                  type="text"
                  name="userId"
                  value={formData.userId}
                  onChange={handleInputChange}
                  placeholder="e.g., STU001, 2024001"
                  required
                  disabled={!isNewStudent}
                />
                {!isNewStudent && (
                  <small className="form-help">
                    Student ID cannot be changed for existing students
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Student Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Full name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Route *</label>
              <select
                name="route"
                value={formData.route}
                onChange={handleInputChange}
                required
                className="route-select"
              >
                <option value="">Select a route...</option>
                {shuttleRoutes.map((route, index) => (
                  <option key={index} value={route}>
                    {route}
                  </option>
                ))}
              </select>
              {shuttleRoutes.length === 0 && (
                <small className="form-help">
                  No shuttle routes available. Please add shuttle routes first.
                </small>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Guardian Name *</label>
                <input
                  type="text"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={handleInputChange}
                  placeholder="Parent/Guardian full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Parent Contact Number *</label>
                <input
                  type="tel"
                  name="parentContactNo"
                  value={formData.parentContactNo}
                  onChange={handleInputChange}
                  placeholder="10-digit phone number"
                  pattern="[0-9]{10}"
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {isNewStudent ? 'Register Student' : 'Update Student'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="student-list">
        <h3>Registered Students ({filteredStudents.length} students)</h3>
        {filteredStudents.length === 0 ? (
          <div className="no-data">No students found</div>
        ) : (
          <div className="table-container">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Route</th>
                  <th>Guardian Name</th>
                  <th>Contact Number</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student._id}>
                    <td>{student.userId || 'N/A'}</td>
                    <td>{student.name || 'N/A'}</td>
                    <td>{student.route || 'N/A'}</td>
                    <td>{student.guardianName || 'N/A'}</td>
                    <td>{student.parentContactNo || 'N/A'}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-sm btn-edit"
                          onClick={() => handleEdit(student)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-sm btn-delete"
                          onClick={() => handleDelete(student._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;
