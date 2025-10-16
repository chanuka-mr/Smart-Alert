import React, { useState, useEffect } from 'react';
import { studentAPI, shuttleAPI } from '../services/api';
import { api } from '../utils/api';
import './StudentManagement.css';

const StudentManagement = ({ userRole: propUserRole = '' }) => {
  const [students, setStudents] = useState([]);
  const [shuttleRoutes, setShuttleRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewStudent, setIsNewStudent] = useState(true);
  const [userRole, setUserRole] = useState(propUserRole);
  
  // Fetch user role if not provided as prop
  useEffect(() => {
    if (!propUserRole) {
      const fetchRole = async () => {
        try {
          const response = await api('/auth/me', { method: 'GET' });
          const role = response?.user?.role || response?.role || 'admin';
          setUserRole(role.toLowerCase());
        } catch (error) {
          console.error('Failed to fetch role:', error);
          setUserRole('admin'); // Default to admin if fetch fails
        }
      };
      fetchRole();
    } else {
      setUserRole(propUserRole);
    }
  }, [propUserRole]);
  
  // Check if user has edit permissions
  const canEdit = userRole === 'admin' || userRole === 'administrator';

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
      // Handle both array response and object with students property
      const studentsArray = Array.isArray(data) ? data : (data.students || []);
      setStudents(Array.isArray(studentsArray) ? studentsArray : []);
      setError('');
    } catch (err) {
      setError('Failed to load students: ' + err.message);
      setStudents([]);
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

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    
    // If Student ID field is being changed, fetch user details
    if (name === 'userId' && value.trim()) {
      try {
        // Fetch user details from users database by userID
        const response = await api(`/users/search/${value}`, { method: 'GET' });
        
        if (response && response.user) {
          // Auto-fill the name field
          setFormData(prev => ({
            ...prev,
            userId: value,
            name: response.user.fullName || response.user.name || ''
          }));
          setError('');
        } else {
          // User not found, just update userId
          setFormData(prev => ({
            ...prev,
            userId: value
          }));
        }
      } catch (err) {
        // If user not found or error, just update the field normally
        console.log('User not found or error:', err.message);
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      // For other fields, update normally
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
        console.log('Deleting student with ID:', id);
        const result = await studentAPI.deleteStudent(id);
        console.log('Delete result:', result);
        setSuccess('Student deleted successfully!');
        setError('');
        // Reload students list
        await loadStudents();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        console.error('Delete error:', err);
        setError('Failed to delete student: ' + (err.message || 'Unknown error'));
        setSuccess('');
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

  // For parents, show simplified view
  if (userRole === 'parent') {
    return (
      <div className="student-management">
        <div className="page-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Register Your Child</h1>
              <p>Register your child for shuttle service</p>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error fade-in">{error}</div>}
        {success && <div className="alert alert-success fade-in">{success}</div>}

        {/* Always show form for parents */}
        <div className="form-container slide-up">
          <h3>Child Registration Form</h3>
          <form onSubmit={handleSubmit} className="student-form">
            <div className="form-group">
              <label>Child's Student ID *</label>
              <input
                type="text"
                name="userId"
                value={formData.userId}
                onChange={handleInputChange}
                placeholder="Enter student ID (e.g., STU001)"
                required
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                Enter the student ID to auto-fill the name
              </small>
            </div>

            <div className="form-group">
              <label>Child's Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Name will auto-fill from student ID"
                required
                style={{ backgroundColor: formData.name && formData.userId ? '#f0f9ff' : 'white' }}
              />
              {formData.name && formData.userId && (
                <small style={{ color: '#00897b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  ✓ Student found
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Select Shuttle Route *</label>
              <select
                name="route"
                value={formData.route}
                onChange={handleInputChange}
                required
              >
                <option value="">Select a route</option>
                {shuttleRoutes.map((route, index) => (
                  <option key={index} value={route}>{route}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Guardian Name *</label>
              <input
                type="text"
                name="guardianName"
                value={formData.guardianName}
                onChange={handleInputChange}
                placeholder="Enter guardian name"
                required
              />
            </div>

            <div className="form-group">
              <label>Contact Number *</label>
              <input
                type="tel"
                name="parentContactNo"
                value={formData.parentContactNo}
                onChange={handleInputChange}
                placeholder="Enter contact number"
                pattern="[0-9]{10}"
                required
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                <span>✅</span>
                Register Child
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Admin/Teacher view with full table
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
            {canEdit && (
              <button 
                className="btn btn-primary"
                onClick={() => setShowAddForm(true)}
              >
                <span>👨‍🎓</span>
                Register New Student
              </button>
            )}
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

      {canEdit && showAddForm && (
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
                  {canEdit && <th>Actions</th>}
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
                    {canEdit && (
                      <td className="actions">
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
                    )}
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
