import React, { useState, useEffect } from 'react';
import './ReportData.css';
import ReportDataAPI from '../../services/ReportDataAPI';
import { useLocation, useNavigate } from 'react-router-dom';

const ReportData = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check if we're in edit mode
  const isEditMode = location.state?.editMode || false;
  const editData = location.state?.editData || null;
  
  // State for form data
  const [formData, setFormData] = useState({
    studentId: '',
    studentName: '',
    grade: '',
    class: '',
    academicYear: new Date().getFullYear().toString(),
    teacherComments: ''
  });

  // State for subjects
  const [subjects, setSubjects] = useState([]);
  const [usedSubjects, setUsedSubjects] = useState(new Set());
  
  // State for API operations
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Common subjects by class level
  const subjectsByLevel = {
    '1': ['Mathematics', 'English', 'Science', 'Social Studies', 'Art', 'Physical Education'],
    '2': ['Mathematics', 'English', 'Science', 'Social Studies', 'Art', 'Physical Education'],
    '3': ['Mathematics', 'English', 'Science', 'Social Studies', 'Art', 'Physical Education'],
    '4': ['Mathematics', 'English', 'Science', 'Social Studies', 'Art', 'Physical Education'],
    '5': ['Mathematics', 'English', 'Science', 'Social Studies', 'Art', 'Physical Education'],
    '6': ['Mathematics', 'English', 'Science', 'Social Studies', 'Art', 'Physical Education', 'Computer Science'],
    '7': ['Mathematics', 'English', 'Science', 'Social Studies', 'Art', 'Physical Education', 'Computer Science'],
    '8': ['Mathematics', 'English', 'Science', 'Social Studies', 'Art', 'Physical Education', 'Computer Science'],
    '9': ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer Science'],
    '10': ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer Science'],
    '11': ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Computer Science']
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) {
      setError(null);
    }
  };

  // Handle class level change
  const handleClassLevelChange = (e) => {
    const grade = e.target.value;
    setFormData(prev => ({
      ...prev,
      grade: grade
    }));
    
    // Clear errors when user changes class level
    if (error) {
      setError(null);
    }
    
    // Clear subjects when class level changes
    setSubjects([]);
    setUsedSubjects(new Set());
    
    // Add one empty subject row
    addSubjectRow();
  };

  // Add a new subject row
  const addSubjectRow = (subjectName = '', term1 = '', term2 = '', term3 = '') => {
    const newSubject = {
      id: Date.now() + Math.random(), // Ensure unique ID
      subjectName: subjectName,
      term1Marks: term1,
      term2Marks: term2,
      term3Marks: term3
    };
    
    console.log('Adding subject row:', newSubject);
    setSubjects(prev => {
      const newSubjects = [...prev, newSubject];
      console.log('Updated subjects:', newSubjects);
      return newSubjects;
    });
    
    if (subjectName) {
      setUsedSubjects(prev => new Set([...prev, subjectName]));
    }
    
    // Clear errors when user adds a subject
    if (error) {
      setError(null);
    }
  };

  // Remove a subject row
  const removeSubjectRow = (id, subjectName) => {
    console.log('Attempting to remove subject:', { id, subjectName, subjectsCount: subjects.length });
    
    // Don't allow removing if it's the only row
    if (subjects.length <= 1) {
      alert('At least one subject row is required');
      return;
    }
    
    setSubjects(prev => prev.filter(subject => subject.id !== id));
    
    // Remove from used subjects if it has a name
    if (subjectName) {
      setUsedSubjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(subjectName);
        return newSet;
      });
    }
    
    // Clear errors when user removes a subject
    if (error) {
      setError(null);
    }
  };

  // Update subject data
  const updateSubject = (id, field, value) => {
    console.log('Updating subject:', { id, field, value });
    console.log('Current subjects before update:', subjects);
    
    setSubjects(prev => {
      const updated = prev.map(subject => 
        subject.id === id ? { ...subject, [field]: value } : subject
      );
      console.log('Updated subjects after update:', updated);
      return updated;
    });
    
    // Clear errors when user updates subjects
    if (error) {
      setError(null);
    }
  };

  // Handle subject name change
  const handleSubjectNameChange = (id, oldName, newName) => {
    // Remove old subject from used subjects
    if (oldName) {
      setUsedSubjects(prev => {
        const newSet = new Set(prev);
        newSet.delete(oldName);
        return newSet;
      });
    }
    
    // Add new subject to used subjects
    if (newName) {
      setUsedSubjects(prev => new Set([...prev, newName]));
    }
    
    // Update subject name
    updateSubject(id, 'subjectName', newName);
    
    // Clear errors when user changes subject
    if (error) {
      setError(null);
    }
  };

  // Reset the form
  const resetForm = () => {
    setFormData({
      studentId: '',
      studentName: '',
      grade: '',
      class: '',
      academicYear: new Date().getFullYear().toString(),
      teacherComments: ''
    });
    setSubjects([]);
    setUsedSubjects(new Set());
    setError(null);
    setSuccess(null);
    addSubjectRow();
  };

  // Validate the form
  const validateForm = () => {
    const formDataWithSubjects = {
      ...formData,
      subjects: subjects
    };
    
    const validation = ReportDataAPI.validateFormData(formDataWithSubjects);
    
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return false;
    }
    
    return true;
  };

  // Submit the form
  const submitForm = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare form data for submission
      const formDataWithSubjects = {
        ...formData,
        subjects: subjects
      };
      
      const submissionData = ReportDataAPI.transformFormData(formDataWithSubjects);
      
      let result;
      if (isEditMode && editData) {
        // Update existing report card
        result = await ReportDataAPI.updateReportCard(editData._id, submissionData);
        setSuccess('Report card data updated successfully!');
        
        // Navigate back to ReportCard page after successful update
        setTimeout(() => {
          navigate('/report-card');
        }, 2000);
      } else {
        // Create new report card
        result = await ReportDataAPI.addReportCard(submissionData);
        setSuccess('Report card data submitted successfully!');
        
        // Reset the form after successful submission
        setTimeout(() => {
          resetForm();
        }, 2000);
      }
      
    } catch (err) {
      setError(err.message || 'Failed to submit report card data');
    } finally {
      setLoading(false);
    }
  };

  // Initialize with one subject row
  useEffect(() => {
    // Only add a subject row if none exist
    if (subjects.length === 0) {
      addSubjectRow();
    }
  }, []);

  // Clear errors when form data changes
  useEffect(() => {
    if (error && formData.grade) {
      setError(null);
    }
  }, [formData.grade, error]);

  // Debug subjects state
  useEffect(() => {
    console.log('Subjects state updated:', subjects);
  }, [subjects]);

  // Pre-fill form when in edit mode
  useEffect(() => {
    if (isEditMode && editData) {
      // Pre-fill form data
      setFormData({
        studentId: editData.studentId || '',
        studentName: editData.studentName || '',
        grade: editData.grade?.toString() || '',
        class: editData.class ? editData.class.split('-')[1] || '' : '', // Extract letter from "11-B" format
        academicYear: editData.academicYear || new Date().getFullYear().toString(),
        teacherComments: editData.teacherComments || ''
      });
      
      // Pre-fill subjects data
      if (editData.subjects && editData.subjects.length > 0) {
        const subjectsData = editData.subjects.map((subject, index) => ({
          id: Date.now() + Math.random() + index, // Generate unique ID for each subject
          subjectName: subject.subjectName || '',
          term1Marks: subject.term1Marks || '',
          term2Marks: subject.term2Marks || '',
          term3Marks: subject.term3Marks || ''
        }));
        setSubjects(subjectsData);
        
        // Update used subjects
        const usedSubjectsSet = new Set(subjectsData.map(s => s.subjectName).filter(name => name));
        setUsedSubjects(usedSubjectsSet);
      }
    }
  }, [isEditMode, editData]);

  return (
    <div className="container">

      {/* Page Content */}
      <div className="container">
        <div className="page-header">
          <h2>{isEditMode ? 'Edit Report Card Data' : 'Report Card Data Entry'}</h2>
          <p>Enter student report card information for the academic year</p>
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

        {/* Success Display */}
        {success && (
          <div style={{
            background: '#e8f5e8',
            border: '1px solid #4CAF50',
            borderRadius: '5px',
            padding: '15px',
            marginBottom: '20px',
            color: '#2e7d32'
          }}>
            <strong>Success:</strong> {success}
          </div>
        )}

        {/* Form Container */}
        <div className="form-container">
          <form id="reportCardForm" onSubmit={submitForm}>
            {/* Student Information Section */}
            <div className="form-section">
              <h3 className="form-section-title">Student Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="studentId">Student ID *</label>
                  <input 
                    type="text" 
                    id="studentId" 
                    name="studentId" 
                    value={formData.studentId}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="studentName">Student Name *</label>
                  <input 
                    type="text" 
                    id="studentName" 
                    name="studentName" 
                    value={formData.studentName}
                    onChange={handleInputChange}
                    required 
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="grade">Class Level *</label>
                  <select 
                    id="grade" 
                    name="grade" 
                    value={formData.grade}
                    onChange={handleClassLevelChange}
                    required
                  >
                    <option value="">Select Class</option>
                    <option value="1">Class 1</option>
                    <option value="2">Class 2</option>
                    <option value="3">Class 3</option>
                    <option value="4">Class 4</option>
                    <option value="5">Class 5</option>
                    <option value="6">Class 6</option>
                    <option value="7">Class 7</option>
                    <option value="8">Class 8</option>
                    <option value="9">Class 9</option>
                    <option value="10">Class 10</option>
                    <option value="11">Class 11</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="class">Class</label>
                  <select 
                    id="class" 
                    name="class" 
                    value={formData.class}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Class</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="academicYear">Academic Year *</label>
                  <input 
                    type="number" 
                    id="academicYear" 
                    name="academicYear" 
                    value={formData.academicYear}
                    onChange={handleInputChange}
                    min="2020"
                    max="2030"
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Subject Marks Section */}
            <div className="form-section">
              <h3 className="form-section-title">Subject Marks</h3>
              
              <table className="subjects-table" id="subjectsTable">
                <thead>
                  <tr>
                    <th>Subject Name</th>
                    <th>Term 1 Marks (0-100)</th>
                    <th>Term 2 Marks (0-100)</th>
                    <th>Term 3 Marks (0-100)</th>
                    <th className="subject-actions">Actions</th>
                  </tr>
                </thead>
                <tbody id="subjectsBody">
                  {subjects.length > 0 ? subjects.map((subject) => (
                    <tr key={subject.id}>
                      <td>
                        <select
                          value={subject.subjectName}
                          onChange={(e) => handleSubjectNameChange(subject.id, subject.subjectName, e.target.value)}
                          required
                        >
                          <option value="">Select Subject</option>
                          {formData.grade && subjectsByLevel[formData.grade] ? 
                            subjectsByLevel[formData.grade].map(subjectOption => (
                              <option 
                                key={subjectOption} 
                                value={subjectOption}
                                disabled={usedSubjects.has(subjectOption) && subjectOption !== subject.subjectName}
                              >
                                {subjectOption}
                              </option>
                            )) : (
                              <option value="" disabled>Please select a class level first</option>
                            )
                          }
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={subject.term1Marks}
                          onChange={(e) => updateSubject(subject.id, 'term1Marks', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={subject.term2Marks}
                          onChange={(e) => updateSubject(subject.id, 'term2Marks', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={subject.term3Marks}
                          onChange={(e) => updateSubject(subject.id, 'term3Marks', e.target.value)}
                        />
                      </td>
                      <td className="subject-actions">
                        <button
                          type="button"
                          className={`btn ${subjects.length <= 1 ? 'btn-secondary' : 'btn-danger'}`}
                          onClick={() => removeSubjectRow(subject.id, subject.subjectName)}
                          title={subjects.length <= 1 ? 'At least one subject row is required' : 'Remove this subject'}
                          disabled={subjects.length <= 1}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                        No subjects added yet. Click "Add Subject" to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              <div style={{textAlign: 'center', marginTop: '20px'}}>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => addSubjectRow()}
                >
                  <i className="fas fa-plus"></i> Add Subject
                </button>
              </div>
            </div>

            {/* Teacher Comments Section */}
            <div className="form-section">
              <h3 className="form-section-title">Teacher Comments</h3>
              
              <div className="form-group">
                <label htmlFor="teacherComments">Comments & Feedback</label>
                <textarea 
                  id="teacherComments" 
                  name="teacherComments" 
                  value={formData.teacherComments}
                  onChange={handleInputChange}
                  placeholder="Enter teacher comments and feedback for the student..."
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={() => {
                  if (window.confirm('Are you sure you want to reset the form? All data will be lost.')) {
                    resetForm();
                  }
                }}
              >
                Reset Form
              </button>
              {isEditMode && (
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => navigate('/report-card')}
                  style={{ marginRight: '10px' }}
                >
                  Cancel Edit
                </button>
              )}
              <button 
                type="submit" 
                className="btn btn-success" 
                id="submitBtn"
                disabled={loading}
              >
                {loading ? 'Submitting...' : (isEditMode ? 'Update Report Card' : 'Submit Report Card')}
              </button>
            </div>
          </form>
        </div>
      </div>

    </div>
  );
};

export default ReportData;
