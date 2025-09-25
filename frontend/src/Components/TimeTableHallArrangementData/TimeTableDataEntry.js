import React, { useState, useEffect } from 'react';
import './TimeTableDataEntry.css';
import TimeTableAPI from '../../services/TimeTableAPI';
import { useNavigate } from 'react-router-dom';

const TimeTableDataEntry = () => {
  const navigate = useNavigate();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('timetable');

  // State for timetable form
  const [timetableForm, setTimetableForm] = useState({
    examName: '',
    grade: '',
    class: '',
    classSection: '',
    category: '',
    subject: '',
    examDate: '',
    examTime: '',
    hall: ''
  });

  // State for hall form
  const [hallForm, setHallForm] = useState({
    hallName: '',
    hallGrade: '',
    hallCapacity: '',
    hallClasses: []
  });

  // State for data viewing
  const [viewFilters, setViewFilters] = useState({
    viewGrade: ''
  });

  // State for data storage
  const [timetableData, setTimetableData] = useState([]);
  const [hallArrangementsData, setHallArrangementsData] = useState([]);
  const [displayData, setDisplayData] = useState({ timetable: [], halls: [] });

  // State for form operations
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // State for edit and delete operations
  const [editingTimetable, setEditingTimetable] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // State for hall arrangements edit and delete operations
  const [editingHall, setEditingHall] = useState(null);
  const [showHallEditModal, setShowHallEditModal] = useState(false);
  const [deleteHallConfirm, setDeleteHallConfirm] = useState(null);
  const [showHallDeleteModal, setShowHallDeleteModal] = useState(false);

  // Helper function to derive hall arrangements from timetable data
  const deriveHallArrangements = (timetables) => {
    const hallMap = new Map();
    
    timetables.forEach(timetable => {
      const hallKey = timetable.hall;
      if (!hallMap.has(hallKey)) {
        hallMap.set(hallKey, {
          hall: hallKey,
          grade: timetable.grade,
          sections: new Set(),
          capacity: 40 // Default capacity, could be made configurable
        });
      }
      
      // Add the class section to this hall
      hallMap.get(hallKey).sections.add(timetable.class);
    });
    
    // Convert Set to Array and return
    return Array.from(hallMap.values()).map(hall => ({
      ...hall,
      sections: Array.from(hall.sections)
    }));
  };

  // Update auto-generated fields when grade or class changes
  useEffect(() => {
    const { grade, class: classVal } = timetableForm;
    
    // Update class section
    if (grade && classVal) {
      setTimetableForm(prev => ({
        ...prev,
        classSection: `${grade}-${classVal}`
      }));
    } else {
      setTimetableForm(prev => ({
        ...prev,
        classSection: ''
      }));
    }
    
    // Update category
    if (grade) {
      const gradeNum = parseInt(grade);
      let category = '';
      if (gradeNum >= 1 && gradeNum <= 5) {
        category = 'Primary';
      } else if (gradeNum >= 6 && gradeNum <= 11) {
        category = 'Secondary';
      }
      setTimetableForm(prev => ({
        ...prev,
        category
      }));
    } else {
      setTimetableForm(prev => ({
        ...prev,
        category: ''
      }));
    }
  }, [timetableForm.grade, timetableForm.class]);

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setTimetableForm(prev => ({
      ...prev,
      examDate: today
    }));
  }, []);

  // Load data from backend on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const timetables = await TimeTableAPI.getAllTimeTables();
        setTimetableData(timetables);
        
        // For hall arrangements, we'll derive them from timetable data
        // since the backend doesn't have a separate hall arrangements model
        const hallData = deriveHallArrangements(timetables);
        setHallArrangementsData(hallData);
        
        // Initialize display data with all data
        setDisplayData({
          timetable: timetables,
          halls: hallData
        });
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data from server');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Handle timetable form input changes
  const handleTimetableInputChange = (e) => {
    const { name, value } = e.target;
    setTimetableForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (error) {
      setError(null);
    }
  };

  // Handle hall form input changes
  const handleHallInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setHallForm(prev => ({
        ...prev,
        hallClasses: checked 
          ? [...prev.hallClasses, value]
          : prev.hallClasses.filter(cls => cls !== value)
      }));
    } else {
      setHallForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear errors when user starts typing
    if (error) {
      setError(null);
    }
  };

  // Handle view filter changes
  const handleViewFilterChange = (e) => {
    const { name, value } = e.target;
    setViewFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate timetable form
  const validateTimetableForm = () => {
    const { examName, grade, class: classVal, subject, examDate, examTime, hall } = timetableForm;
    
    if (!examName) {
      setError('Please select an exam name');
      return false;
    }
    
    if (!grade) {
      setError('Please select a grade');
      return false;
    }
    
    if (!classVal) {
      setError('Please select a class');
      return false;
    }
    
    if (!subject) {
      setError('Please enter a subject');
      return false;
    }
    
    if (!examDate) {
      setError('Please select an exam date');
      return false;
    }
    
    // Check if exam date is in the past
    const selectedDate = new Date(examDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
    
    if (selectedDate < today) {
      setError('Cannot schedule exams for past dates. Please select today or a future date.');
      return false;
    }
    
    if (!examTime) {
      setError('Please enter an exam time');
      return false;
    }
    
    if (!hall) {
      setError('Please enter a hall');
      return false;
    }
    
    return true;
  };

  // Validate hall form
  const validateHallForm = () => {
    const { hallName, hallGrade, hallCapacity, hallClasses } = hallForm;
    
    if (!hallName) {
      setError('Please enter a hall name');
      return false;
    }
    
    if (!hallGrade) {
      setError('Please select a grade');
      return false;
    }
    
    if (!hallCapacity || hallCapacity < 1) {
      setError('Please enter a valid capacity');
      return false;
    }
    
    if (hallClasses.length === 0) {
      setError('Please select at least one class for this hall');
      return false;
    }
    
    return true;
  };

  // Submit timetable form
  const submitTimetableForm = async (e) => {
    e.preventDefault();
    
    if (!validateTimetableForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Prepare form data for submission
      const formData = {
        examName: timetableForm.examName,
        grade: parseInt(timetableForm.grade),
        class: timetableForm.class,
        subject: timetableForm.subject,
        examDate: timetableForm.examDate,
        examTime: timetableForm.examTime,
        hall: timetableForm.hall
      };
      
      // Submit to backend
      const newTimetable = await TimeTableAPI.addTimeTable(formData);
      
      // Update local state with the new timetable
      setTimetableData(prev => [...prev, newTimetable]);
      
      // Update hall arrangements data
      const updatedHallData = deriveHallArrangements([...timetableData, newTimetable]);
      setHallArrangementsData(updatedHallData);
      
      setSuccess('Timetable entry submitted successfully!');
      
      // Reset the form after successful submission
      setTimeout(() => {
        resetTimetableForm();
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Failed to submit timetable entry');
    } finally {
      setLoading(false);
    }
  };

  // Submit hall form
  const submitHallForm = async (e) => {
    e.preventDefault();
    
    if (!validateHallForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Since backend doesn't have separate hall arrangements model,
      // we'll create a local record for demonstration
      // In a real system, you'd have a separate hall model in the backend
      
      const formData = {
        hall: hallForm.hallName,
        grade: parseInt(hallForm.hallGrade),
        capacity: parseInt(hallForm.hallCapacity),
        sections: hallForm.hallClasses
      };
      
      // Update local hall arrangements data
      const newHallData = [...hallArrangementsData, formData];
      setHallArrangementsData(newHallData);
      
      setSuccess('Hall arrangement submitted successfully! Note: This creates a local record. For full integration, a separate hall arrangements model would be needed in the backend.');
      
      // Reset the form after successful submission
      setTimeout(() => {
        resetHallForm();
      }, 2000);
      
    } catch (err) {
      setError(err.message || 'Failed to submit hall arrangement');
    } finally {
      setLoading(false);
    }
  };

  // Reset timetable form
  const resetTimetableForm = () => {
    setTimetableForm({
      examName: '',
      grade: '',
      class: '',
      classSection: '',
      category: '',
      subject: '',
      examDate: new Date().toISOString().split('T')[0],
      examTime: '',
      hall: ''
    });
    setError(null);
    setSuccess(null);
  };

  // Reset hall form
  const resetHallForm = () => {
    setHallForm({
      hallName: '',
      hallGrade: '',
      hallCapacity: '',
      hallClasses: []
    });
    setError(null);
    setSuccess(null);
  };

  // Display filtered data
  const handleDisplayData = () => {
    const { viewGrade } = viewFilters;
    
    // Check if data is loaded
    if (!timetableData || timetableData.length === 0) {
      setDisplayData({ timetable: [], halls: [] });
      return;
    }
    
    // Filter timetable data by grade only
    let filteredTimetable = timetableData;
    if (viewGrade) {
      filteredTimetable = filteredTimetable.filter(item => item.grade === parseInt(viewGrade));
    }
    
    // Derive hall arrangements from filtered timetable data
    let filteredHalls = [];
    if (viewGrade) {
      // Filter timetable data for hall arrangements (only grade)
      let hallFilteredTimetable = timetableData;
      if (viewGrade) {
        hallFilteredTimetable = hallFilteredTimetable.filter(item => item.grade === parseInt(viewGrade));
      }
      
      // Derive hall arrangements from the filtered timetable data
      filteredHalls = deriveHallArrangements(hallFilteredTimetable);
    } else {
      // If no grade is selected, derive from all timetable data
      filteredHalls = deriveHallArrangements(timetableData);
    }
    
    setDisplayData({
      timetable: filteredTimetable,
      halls: filteredHalls
    });
  };

  // Handle edit timetable
  const handleEditTimetable = (timetable) => {
    setEditingTimetable(timetable);
    setShowEditModal(true);
  };

  // Handle delete timetable
  const handleDeleteTimetable = (timetable) => {
    setDeleteConfirm(timetable);
    setShowDeleteModal(true);
  };

  // Confirm delete timetable
  const confirmDeleteTimetable = async () => {
    if (!deleteConfirm) return;
    
    try {
      setLoading(true);
      await TimeTableAPI.deleteTimeTable(deleteConfirm._id);
      
      // Remove timetable from the list
      setTimetableData(prev => prev.filter(t => t._id !== deleteConfirm._id));
      
      // Update display data
      setDisplayData(prev => ({
        ...prev,
        timetable: prev.timetable.filter(t => t._id !== deleteConfirm._id)
      }));
      
      // Update hall arrangements data
      const updatedHallData = deriveHallArrangements(timetableData.filter(t => t._id !== deleteConfirm._id));
      setHallArrangementsData(updatedHallData);
      
      setShowDeleteModal(false);
      setDeleteConfirm(null);
      setSuccess('Timetable entry deleted successfully!');
    } catch (err) {
      setError(err.message || 'Failed to delete timetable entry');
    } finally {
      setLoading(false);
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteConfirm(null);
  };

  // Handle edit form submission
  const handleEditSubmit = async (editedData) => {
    if (!editingTimetable) return;
    
    try {
      setLoading(true);
      const updatedTimetable = await TimeTableAPI.updateTimeTable(editingTimetable._id, editedData);
      
      // Update timetable in the list
      setTimetableData(prev => prev.map(t => t._id === editingTimetable._id ? updatedTimetable : t));
      
      // Update display data
      setDisplayData(prev => ({
        ...prev,
        timetable: prev.timetable.map(t => t._id === editingTimetable._id ? updatedTimetable : t)
      }));
      
      // Update hall arrangements data
      const updatedHallData = deriveHallArrangements(timetableData.map(t => t._id === editingTimetable._id ? updatedTimetable : t));
      setHallArrangementsData(updatedHallData);
      
      setShowEditModal(false);
      setEditingTimetable(null);
      setSuccess('Timetable entry updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update timetable entry');
    } finally {
      setLoading(false);
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setShowEditModal(false);
    setEditingTimetable(null);
  };

  // Handle edit hall arrangement
  const handleEditHall = (hall) => {
    setEditingHall(hall);
    setShowHallEditModal(true);
  };

  // Handle delete hall arrangement
  const handleDeleteHall = (hall) => {
    setDeleteHallConfirm(hall);
    setShowHallDeleteModal(true);
  };

  // Confirm delete hall arrangement
  const confirmDeleteHall = async () => {
    if (!deleteHallConfirm) return;
    
    try {
      setLoading(true);
      
      // Since hall arrangements are derived from timetable data,
      // we need to delete all timetable entries for this hall
      const timetablesToDelete = timetableData.filter(t => t.hall === deleteHallConfirm.hall);
      
      // Delete all timetable entries for this hall
      for (const timetable of timetablesToDelete) {
        await TimeTableAPI.deleteTimeTable(timetable._id);
      }
      
      // Update local state
      setTimetableData(prev => prev.filter(t => t.hall !== deleteHallConfirm.hall));
      
      // Update display data
      setDisplayData(prev => ({
        ...prev,
        timetable: prev.timetable.filter(t => t.hall !== deleteHallConfirm.hall)
      }));
      
      // Update hall arrangements data
      const updatedHallData = deriveHallArrangements(timetableData.filter(t => t.hall !== deleteHallConfirm.hall));
      setHallArrangementsData(updatedHallData);
      
      setShowHallDeleteModal(false);
      setDeleteHallConfirm(null);
      setSuccess(`Hall arrangement deleted successfully! Removed ${timetablesToDelete.length} timetable entries.`);
    } catch (err) {
      setError(err.message || 'Failed to delete hall arrangement');
    } finally {
      setLoading(false);
    }
  };

  // Cancel hall delete
  const cancelHallDelete = () => {
    setShowHallDeleteModal(false);
    setDeleteHallConfirm(null);
  };

  // Handle hall edit form submission
  const handleHallEditSubmit = async (editedData) => {
    if (!editingHall) return;
    
    try {
      setLoading(true);
      
      // Since hall arrangements are derived from timetable data,
      // we need to update all timetable entries for this hall
      const timetablesToUpdate = timetableData.filter(t => t.hall === editingHall.hall);
      
      // Update all timetable entries for this hall
      for (const timetable of timetablesToUpdate) {
        const updateData = {
          examName: timetable.examName,
          grade: parseInt(editedData.grade),
          class: timetable.class,
          subject: timetable.subject,
          examDate: timetable.examDate,
          examTime: timetable.examTime,
          hall: editedData.hallName
        };
        await TimeTableAPI.updateTimeTable(timetable._id, updateData);
      }
      
      // Reload data to get updated information
      const updatedTimetables = await TimeTableAPI.getAllTimeTables();
      setTimetableData(updatedTimetables);
      
      // Update hall arrangements data
      const updatedHallData = deriveHallArrangements(updatedTimetables);
      setHallArrangementsData(updatedHallData);
      
      setShowHallEditModal(false);
      setEditingHall(null);
      setSuccess(`Hall arrangement updated successfully! Updated ${timetablesToUpdate.length} timetable entries.`);
    } catch (err) {
      setError(err.message || 'Failed to update hall arrangement');
    } finally {
      setLoading(false);
    }
  };

  // Cancel hall edit
  const cancelHallEdit = () => {
    setShowHallEditModal(false);
    setEditingHall(null);
  };

  // Edit Timetable Modal Component
  const EditTimetableModal = ({ timetable, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      examName: timetable.examName,
      grade: timetable.grade,
      class: timetable.class,
      subject: timetable.subject,
      examDate: new Date(timetable.examDate).toISOString().split('T')[0],
      examTime: timetable.examTime,
      hall: timetable.hall
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Validate exam date is not in the past
      const selectedDate = new Date(formData.examDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
      
      if (selectedDate < today) {
        alert('Cannot schedule exams for past dates. Please select today or a future date.');
        return;
      }
      
      onSubmit(formData);
    };

    const handleChange = (e) => {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    };

    return (
      <div className="modal-overlay" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div className="modal-content" style={{
          background: 'white',
          borderRadius: '10px',
          padding: '30px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <div className="modal-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '2px solid #00897b'
          }}>
            <h3 style={{ color: '#00897b', margin: 0 }}>Edit Timetable Entry</h3>
            <button 
              className="modal-close" 
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                padding: '0',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#00897b' }}>Exam Name:</label>
                <select
                  name="examName"
                  value={formData.examName}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                >
                  <option value="">Select Exam</option>
                  <option value="1st Term">1st Term</option>
                  <option value="2nd Term">2nd Term</option>
                  <option value="3rd Term">3rd Term</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#00897b' }}>Grade:</label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                >
                  <option value="">Select Grade</option>
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                  <option value="6">Grade 6</option>
                  <option value="7">Grade 7</option>
                  <option value="8">Grade 8</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#00897b' }}>Class:</label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                >
                  <option value="">Select Class</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#00897b' }}>Subject:</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#00897b' }}>Exam Date:</label>
                <input
                  type="date"
                  name="examDate"
                  value={formData.examDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#00897b' }}>Exam Time:</label>
                <input
                  type="text"
                  name="examTime"
                  value={formData.examTime}
                  onChange={handleChange}
                  required
                  placeholder="e.g., 9:00 AM - 11:00 AM"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#00897b' }}>Hall:</label>
                <input
                  type="text"
                  name="hall"
                  value={formData.hall}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Hall 1, Classroom 6B"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
            </div>
            <div className="modal-footer" style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '20px',
              paddingTop: '15px',
              borderTop: '1px solid #eee'
            }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onCancel}
                style={{
                  padding: '10px 20px',
                  borderRadius: '5px',
                  border: '2px solid #00897b',
                  background: 'white',
                  color: '#00897b',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{
                  padding: '10px 20px',
                  borderRadius: '5px',
                  border: 'none',
                  background: 'linear-gradient(to right, #00897b 0%, #00bfa5 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Delete Confirmation Modal Component
  const DeleteConfirmModal = ({ timetable, onConfirm, onCancel, loading }) => {
    return (
      <div className="modal-overlay" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div className="modal-content" style={{
          background: 'white',
          borderRadius: '10px',
          padding: '30px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <div className="modal-header" style={{
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '2px solid #f44336'
          }}>
            <h3 style={{ color: '#f44336', margin: 0 }}>Delete Timetable Entry</h3>
          </div>
          <div className="modal-body">
            <p style={{ marginBottom: '15px' }}>Are you sure you want to delete this timetable entry?</p>
            <div className="timetable-info" style={{
              background: '#f5f5f5',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '15px'
            }}>
              <p style={{ margin: '5px 0' }}><strong>Exam:</strong> {timetable.examName}</p>
              <p style={{ margin: '5px 0' }}><strong>Grade:</strong> {timetable.grade}</p>
              <p style={{ margin: '5px 0' }}><strong>Class:</strong> {timetable.class}</p>
              <p style={{ margin: '5px 0' }}><strong>Subject:</strong> {timetable.subject}</p>
              <p style={{ margin: '5px 0' }}><strong>Date:</strong> {new Date(timetable.examDate).toLocaleDateString()}</p>
              <p style={{ margin: '5px 0' }}><strong>Time:</strong> {timetable.examTime}</p>
              <p style={{ margin: '5px 0' }}><strong>Hall:</strong> {timetable.hall}</p>
            </div>
            <p className="warning-text" style={{ color: '#f44336', fontWeight: '600' }}>This action cannot be undone.</p>
          </div>
          <div className="modal-footer" style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px',
            paddingTop: '15px',
            borderTop: '1px solid #eee'
          }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                border: '2px solid #666',
                background: 'white',
                color: '#666',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: loading ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-danger" 
              onClick={onConfirm}
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                border: 'none',
                background: '#f44336',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Deleting...' : 'Delete Entry'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Edit Hall Arrangement Modal Component
  const EditHallModal = ({ hall, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      hallName: hall.hall,
      grade: hall.grade,
      capacity: hall.capacity,
      sections: hall.sections
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    const handleChange = (e) => {
      const { name, value, type, checked } = e.target;
      
      if (type === 'checkbox') {
        setFormData(prev => ({
          ...prev,
          sections: checked 
            ? [...prev.sections, value]
            : prev.sections.filter(section => section !== value)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    };

    return (
      <div className="modal-overlay" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div className="modal-content" style={{
          background: 'white',
          borderRadius: '10px',
          padding: '30px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <div className="modal-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '2px solid #00897b'
          }}>
            <h3 style={{ color: '#00897b', margin: 0 }}>Edit Hall Arrangement</h3>
            <button 
              className="modal-close" 
              onClick={onCancel}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                padding: '0',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ×
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#00897b' }}>Hall Name:</label>
                <input
                  type="text"
                  name="hallName"
                  value={formData.hallName}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Hall 1, Classroom 6B"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#00897b' }}>Grade:</label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                >
                  <option value="">Select Grade</option>
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                  <option value="6">Grade 6</option>
                  <option value="7">Grade 7</option>
                  <option value="8">Grade 8</option>
                  <option value="9">Grade 9</option>
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#00897b' }}>Capacity:</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min="1"
                  placeholder="Number of students"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
              <div className="form-group" style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#00897b' }}>Classes:</label>
                <div style={{ marginTop: '10px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    <input 
                      type="checkbox" 
                      name="sections" 
                      value="A"
                      checked={formData.sections.includes('A')}
                      onChange={handleChange}
                    /> Class A
                  </label>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    <input 
                      type="checkbox" 
                      name="sections" 
                      value="B"
                      checked={formData.sections.includes('B')}
                      onChange={handleChange}
                    /> Class B
                  </label>
                  <label style={{ display: 'block', marginBottom: '5px' }}>
                    <input 
                      type="checkbox" 
                      name="sections" 
                      value="C"
                      checked={formData.sections.includes('C')}
                      onChange={handleChange}
                    /> Class C
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              marginTop: '20px',
              paddingTop: '15px',
              borderTop: '1px solid #eee'
            }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onCancel}
                style={{
                  padding: '10px 20px',
                  borderRadius: '5px',
                  border: '2px solid #00897b',
                  background: 'white',
                  color: '#00897b',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{
                  padding: '10px 20px',
                  borderRadius: '5px',
                  border: 'none',
                  background: 'linear-gradient(to right, #00897b 0%, #00bfa5 100%)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Delete Hall Confirmation Modal Component
  const DeleteHallConfirmModal = ({ hall, onConfirm, onCancel, loading }) => {
    const timetablesForHall = timetableData.filter(t => t.hall === hall.hall);
    
    return (
      <div className="modal-overlay" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div className="modal-content" style={{
          background: 'white',
          borderRadius: '10px',
          padding: '30px',
          maxWidth: '500px',
          width: '90%',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
        }}>
          <div className="modal-header" style={{
            marginBottom: '20px',
            paddingBottom: '15px',
            borderBottom: '2px solid #f44336'
          }}>
            <h3 style={{ color: '#f44336', margin: 0 }}>Delete Hall Arrangement</h3>
          </div>
          <div className="modal-body">
            <p style={{ marginBottom: '15px' }}>Are you sure you want to delete this hall arrangement?</p>
            <div className="hall-info" style={{
              background: '#f5f5f5',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '15px'
            }}>
              <p style={{ margin: '5px 0' }}><strong>Hall:</strong> {hall.hall}</p>
              <p style={{ margin: '5px 0' }}><strong>Grade:</strong> {hall.grade}</p>
              <p style={{ margin: '5px 0' }}><strong>Classes:</strong> {hall.sections.map(section => `${hall.grade}-${section}`).join(', ')}</p>
              <p style={{ margin: '5px 0' }}><strong>Capacity:</strong> {hall.capacity}</p>
            </div>
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '5px',
              padding: '15px',
              marginBottom: '15px'
            }}>
              <p style={{ margin: '0', color: '#856404', fontWeight: '600' }}>
                <strong>Warning:</strong> This will also delete {timetablesForHall.length} timetable entry(ies) associated with this hall.
              </p>
            </div>
            <p className="warning-text" style={{ color: '#f44336', fontWeight: '600' }}>This action cannot be undone.</p>
          </div>
          <div className="modal-footer" style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '20px',
            paddingTop: '15px',
            borderTop: '1px solid #eee'
          }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                border: '2px solid #666',
                background: 'white',
                color: '#666',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: loading ? 0.6 : 1
              }}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-danger" 
              onClick={onConfirm}
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                border: 'none',
                background: '#f44336',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Deleting...' : 'Delete Hall'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container">

      {/* Page Content */}
      <div className="container">
        <div className="page-header">
          <h2>Timetable & Hall Arrangements Data Entry</h2>
          <p>Enter examination timetable and hall arrangement information</p>
          <div style={{ marginTop: '20px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate('/')}
              style={{ 
                padding: '10px 20px', 
                fontSize: '14px',
                borderRadius: '6px',
                border: '2px solid #00897b',
                background: 'white',
                color: '#00897b',
                cursor: 'pointer',
                transition: 'all 0.3s',
                marginRight: '10px'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#00897b';
                e.target.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'white';
                e.target.style.color = '#00897b';
              }}
            >
              <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
              Back to Timetable View
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

        {/* Tabs */}
        <div className="tabs">
          <div 
            className={`tab ${activeTab === 'timetable' ? 'active' : ''}`}
            onClick={() => setActiveTab('timetable')}
          >
            Timetable Entry
          </div>
          <div 
            className={`tab ${activeTab === 'hall' ? 'active' : ''}`}
            onClick={() => setActiveTab('hall')}
          >
            Hall Arrangements
          </div>
        </div>

        {/* Form Container */}
        <div className="form-container">
          {/* Timetable Tab Content */}
          {activeTab === 'timetable' && (
            <div className="tab-content active">
              <form id="timetableForm" onSubmit={submitTimetableForm}>
                {/* Exam Information Section */}
                <div className="form-section">
                  <h3 className="form-section-title">Exam Information</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="examName">Exam Name *</label>
                      <select 
                        id="examName" 
                        name="examName" 
                        value={timetableForm.examName}
                        onChange={handleTimetableInputChange}
                        required
                      >
                        <option value="">Select Exam</option>
                        <option value="1st Term">1st Term</option>
                        <option value="2nd Term">2nd Term</option>
                        <option value="3rd Term">3rd Term</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="grade">Grade *</label>
                      <select 
                        id="grade" 
                        name="grade" 
                        value={timetableForm.grade}
                        onChange={handleTimetableInputChange}
                        required
                      >
                        <option value="">Select Grade</option>
                        <option value="1">Grade 1</option>
                        <option value="2">Grade 2</option>
                        <option value="3">Grade 3</option>
                        <option value="4">Grade 4</option>
                        <option value="5">Grade 5</option>
                        <option value="6">Grade 6</option>
                        <option value="7">Grade 7</option>
                        <option value="8">Grade 8</option>
                        <option value="9">Grade 9</option>
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="class">Class *</label>
                      <select 
                        id="class" 
                        name="class" 
                        value={timetableForm.class}
                        onChange={handleTimetableInputChange}
                        required
                      >
                        <option value="">Select Class</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group readonly">
                      <label htmlFor="classSection">Class Section (Auto-generated)</label>
                      <input 
                        type="text" 
                        id="classSection" 
                        name="classSection" 
                        value={timetableForm.classSection}
                        readOnly
                      />
                    </div>
                    <div className="form-group readonly">
                      <label htmlFor="category">Category (Auto-generated)</label>
                      <input 
                        type="text" 
                        id="category" 
                        name="category" 
                        value={timetableForm.category}
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                {/* Subject & Schedule Section */}
                <div className="form-section">
                  <h3 className="form-section-title">Subject & Schedule</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="subject">Subject *</label>
                      <input 
                        type="text" 
                        id="subject" 
                        name="subject" 
                        value={timetableForm.subject}
                        onChange={handleTimetableInputChange}
                        required 
                        placeholder="Enter subject name"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="examDate">Exam Date *</label>
                      <input 
                        type="date" 
                        id="examDate" 
                        name="examDate" 
                        value={timetableForm.examDate}
                        onChange={handleTimetableInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="examTime">Exam Time *</label>
                      <input 
                        type="text" 
                        id="examTime" 
                        name="examTime" 
                        value={timetableForm.examTime}
                        onChange={handleTimetableInputChange}
                        required 
                        placeholder="e.g., 9:00 AM - 11:00 AM"
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="hall">Hall *</label>
                      <input 
                        type="text" 
                        id="hall" 
                        name="hall" 
                        value={timetableForm.hall}
                        onChange={handleTimetableInputChange}
                        required 
                        placeholder="e.g., Hall 1, Classroom 6B"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to reset the timetable form? All data will be lost.')) {
                        resetTimetableForm();
                      }
                    }}
                  >
                    Reset Form
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success" 
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Timetable Entry'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Hall Arrangements Tab Content */}
          {activeTab === 'hall' && (
            <div className="tab-content active">
              <form id="hallForm" onSubmit={submitHallForm}>
                {/* Hall Information Section */}
                <div className="form-section">
                  <h3 className="form-section-title">Hall Information</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="hallName">Hall Name *</label>
                      <input 
                        type="text" 
                        id="hallName" 
                        name="hallName" 
                        value={hallForm.hallName}
                        onChange={handleHallInputChange}
                        required 
                        placeholder="e.g., Hall 1, Classroom 6B"
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="hallGrade">Grade *</label>
                      <select 
                        id="hallGrade" 
                        name="hallGrade" 
                        value={hallForm.hallGrade}
                        onChange={handleHallInputChange}
                        required
                      >
                        <option value="">Select Grade</option>
                        <option value="1">Grade 1</option>
                        <option value="2">Grade 2</option>
                        <option value="3">Grade 3</option>
                        <option value="4">Grade 4</option>
                        <option value="5">Grade 5</option>
                        <option value="6">Grade 6</option>
                        <option value="7">Grade 7</option>
                        <option value="8">Grade 8</option>
                        <option value="9">Grade 9</option>
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="hallCapacity">Capacity *</label>
                      <input 
                        type="number" 
                        id="hallCapacity" 
                        name="hallCapacity" 
                        value={hallForm.hallCapacity}
                        onChange={handleHallInputChange}
                        required 
                        min="1" 
                        placeholder="Number of students"
                      />
                    </div>
                  </div>
                </div>

                {/* Class Assignments Section */}
                <div className="form-section">
                  <h3 className="form-section-title">Class Assignments</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Assign Classes to this Hall</label>
                      <div style={{marginTop: '10px'}}>
                        <label style={{display: 'block', marginBottom: '5px'}}>
                          <input 
                            type="checkbox" 
                            name="hallClasses" 
                            value="A"
                            checked={hallForm.hallClasses.includes('A')}
                            onChange={handleHallInputChange}
                          /> Class A
                        </label>
                        <label style={{display: 'block', marginBottom: '5px'}}>
                          <input 
                            type="checkbox" 
                            name="hallClasses" 
                            value="B"
                            checked={hallForm.hallClasses.includes('B')}
                            onChange={handleHallInputChange}
                          /> Class B
                        </label>
                        <label style={{display: 'block', marginBottom: '5px'}}>
                          <input 
                            type="checkbox" 
                            name="hallClasses" 
                            value="C"
                            checked={hallForm.hallClasses.includes('C')}
                            onChange={handleHallInputChange}
                          /> Class C
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  <button 
                    type="button" 
                    className="btn btn-danger" 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to reset the hall arrangement form? All data will be lost.')) {
                        resetHallForm();
                      }
                    }}
                  >
                    Reset Form
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-success" 
                    disabled={loading}
                  >
                    {loading ? 'Submitting...' : 'Submit Hall Arrangement'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* View Existing Data Section */}
        <div className="form-container">
          <h3 className="form-section-title">View Existing Data</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="viewGrade">Filter by Grade</label>
              <select 
                id="viewGrade"
                name="viewGrade"
                value={viewFilters.viewGrade}
                onChange={handleViewFilterChange}
              >
                <option value="">All Grades</option>
                <option value="1">Grade 1</option>
                <option value="2">Grade 2</option>
                <option value="3">Grade 3</option>
                <option value="4">Grade 4</option>
                <option value="5">Grade 5</option>
                <option value="6">Grade 6</option>
                <option value="7">Grade 7</option>
                <option value="8">Grade 8</option>
                <option value="9">Grade 9</option>
                <option value="10">Grade 10</option>
                <option value="11">Grade 11</option>
              </select>
            </div>
            <div className="form-group">
              <button 
                type="button" 
                className="btn btn-info" 
                onClick={handleDisplayData}
                style={{marginTop: '25px'}}
              >
                View Data
              </button>
            </div>
          </div>
          
          <div id="dataDisplay" style={{marginTop: '20px'}}>
            {/* Display Timetable Data - Only on Timetable Tab */}
            {activeTab === 'timetable' && displayData.timetable && displayData.timetable.length > 0 && (
              <div>
                <h4>Timetable Entries</h4>
                <table className="timetable-table">
                  <thead>
                    <tr>
                      <th>Exam</th>
                      <th>Grade</th>
                      <th>Class</th>
                      <th>Subject</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Hall</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.timetable.map((item, index) => (
                      <tr key={index}>
                        <td>{item.examName}</td>
                        <td>{item.grade}</td>
                        <td>{item.class}</td>
                        <td>{item.subject}</td>
                        <td>{new Date(item.examDate).toLocaleDateString()}</td>
                        <td>{item.examTime}</td>
                        <td>{item.hall}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => handleEditTimetable(item)}
                              title="Edit Timetable Entry"
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                borderRadius: '4px',
                                border: 'none',
                                background: '#ff9800',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                              }}
                              onMouseOver={(e) => {
                                e.target.style.background = '#f57c00';
                                e.target.style.transform = 'translateY(-1px)';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.background = '#ff9800';
                                e.target.style.transform = 'translateY(0)';
                              }}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteTimetable(item)}
                              title="Delete Timetable Entry"
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                borderRadius: '4px',
                                border: 'none',
                                background: '#f44336',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                              }}
                              onMouseOver={(e) => {
                                e.target.style.background = '#d32f2f';
                                e.target.style.transform = 'translateY(-1px)';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.background = '#f44336';
                                e.target.style.transform = 'translateY(0)';
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Display Hall Arrangements Data - Only on Hall Arrangements Tab */}
            {activeTab === 'hall' && (
              <div style={{marginTop: '30px'}}>
                <h4>Hall Arrangements</h4>
              {!viewFilters.viewGrade ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '40px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '8px',
                  color: '#856404'
                }}>
                  <p style={{textAlign: 'center', margin: 0}}>
                    Please select a Grade to view hall arrangements
                  </p>
                </div>
              ) : displayData.halls && displayData.halls.length > 0 ? (
                <table className="timetable-table">
                  <thead>
                    <tr>
                      <th>Hall</th>
                      <th>Grade</th>
                      <th>Classes</th>
                      <th>Capacity</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayData.halls.map((item, index) => (
                      <tr key={index}>
                        <td>{item.hall}</td>
                        <td>{item.grade}</td>
                        <td>{item.sections.map(section => `${item.grade}-${section}`).join(', ')}</td>
                        <td>{item.capacity}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => handleEditHall(item)}
                              title="Edit Hall Arrangement"
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                borderRadius: '4px',
                                border: 'none',
                                background: '#ff9800',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                              }}
                              onMouseOver={(e) => {
                                e.target.style.background = '#f57c00';
                                e.target.style.transform = 'translateY(-1px)';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.background = '#ff9800';
                                e.target.style.transform = 'translateY(0)';
                              }}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteHall(item)}
                              title="Delete Hall Arrangement"
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                borderRadius: '4px',
                                border: 'none',
                                background: '#f44336',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                              }}
                              onMouseOver={(e) => {
                                e.target.style.background = '#d32f2f';
                                e.target.style.transform = 'translateY(-1px)';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.background = '#f44336';
                                e.target.style.transform = 'translateY(0)';
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  padding: '40px',
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  color: '#6c757d'
                }}>
                  <p style={{textAlign: 'center', margin: 0}}>
                    No hall arrangements found for the selected grade
                  </p>
                </div>
              )}
              </div>
            )}
            
            {/* No Data Message */}
            {displayData.timetable && displayData.halls && 
             displayData.timetable.length === 0 && displayData.halls.length === 0 && (
              <p>No data found for the selected filters.</p>
            )}
          </div>
        </div>
      </div>


      {/* Edit Timetable Modal */}
      {showEditModal && editingTimetable && (
        <EditTimetableModal
          timetable={editingTimetable}
          onSubmit={handleEditSubmit}
          onCancel={cancelEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteConfirm && (
        <DeleteConfirmModal
          timetable={deleteConfirm}
          onConfirm={confirmDeleteTimetable}
          onCancel={cancelDelete}
          loading={loading}
        />
      )}

      {/* Edit Hall Arrangement Modal */}
      {showHallEditModal && editingHall && (
        <EditHallModal
          hall={editingHall}
          onSubmit={handleHallEditSubmit}
          onCancel={cancelHallEdit}
        />
      )}

      {/* Delete Hall Confirmation Modal */}
      {showHallDeleteModal && deleteHallConfirm && (
        <DeleteHallConfirmModal
          hall={deleteHallConfirm}
          onConfirm={confirmDeleteHall}
          onCancel={cancelHallDelete}
          loading={loading}
        />
      )}
    </div>
  );
};

export default TimeTableDataEntry;
