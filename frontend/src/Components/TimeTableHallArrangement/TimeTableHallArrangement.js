import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navigation from '../Navigation/Navigation';
import Footer from '../Footer/Footer';
import './TimeTableHallArrangement.css';
import TimeTableAPI from '../../services/TimeTableAPI';
import { useNavigate } from 'react-router-dom';

const TimeTableHallArrangement = () => {
  const navigate = useNavigate();
  const [examDropdownOpen, setExamDropdownOpen] = useState(false);
  const examDropdownRef = useRef(null);
  
  // Fallback data for when backend is not available
  const fallbackTimetableData = [
    { examName: "1st Term", grade: 1, class: "A", classSection: "1-A", subject: "Mathematics", examDate: "2023-10-15", examTime: "9:00 AM - 11:00 AM", hall: "Hall 1" },
    { examName: "2nd Term", grade: 1, class: "B", classSection: "1-B", subject: "Science", examDate: "2023-10-16", examTime: "9:00 AM - 11:00 AM", hall: "Hall 2" },
    { examName: "3rd Term", grade: 2, class: "A", classSection: "2-A", subject: "English", examDate: "2023-10-17", examTime: "9:00 AM - 11:00 AM", hall: "Hall 3" },
    { examName: "1st Term", grade: 3, class: "C", classSection: "3-C", subject: "Social Studies", examDate: "2023-12-10", examTime: "9:00 AM - 12:00 PM", hall: "Hall 1" },
    { examName: "2nd Term", grade: 4, class: "B", classSection: "4-B", subject: "Mathematics", examDate: "2023-12-11", examTime: "9:00 AM - 12:00 PM", hall: "Hall 2" },
    { examName: "3rd Term", grade: 5, class: "D", classSection: "5-D", subject: "Science", examDate: "2023-12-12", examTime: "9:00 AM - 12:00 PM", hall: "Hall 3" },
    { examName: "1st Term", grade: 6, class: "A", classSection: "6-A", subject: "Physics", examDate: "2023-10-20", examTime: "10:00 AM - 12:00 PM", hall: "Hall 4" },
    { examName: "2nd Term", grade: 7, class: "B", classSection: "7-B", subject: "Chemistry", examDate: "2023-11-15", examTime: "2:00 PM - 4:00 PM", hall: "Hall 5" },
    { examName: "3rd Term", grade: 8, class: "C", classSection: "8-C", subject: "Biology", examDate: "2023-12-20", examTime: "9:00 AM - 11:00 AM", hall: "Hall 6" },
    { examName: "1st Term", grade: 9, class: "D", classSection: "9-D", subject: "Advanced Math", examDate: "2023-10-25", examTime: "11:00 AM - 1:00 PM", hall: "Hall 7" },
    { examName: "2nd Term", grade: 10, class: "E", classSection: "10-E", subject: "Computer Science", examDate: "2023-11-20", examTime: "3:00 PM - 5:00 PM", hall: "Hall 8" },
    { examName: "3rd Term", grade: 11, class: "A", classSection: "11-A", subject: "Advanced Physics", examDate: "2023-12-25", examTime: "9:00 AM - 12:00 PM", hall: "Hall 9" }
  ];

  // const fallbackHallArrangements = [
  //   { hall: "Hall 1", grade: 1, sections: ["A", "B"], capacity: 40 },
  //   { hall: "Hall 2", grade: 2, sections: ["A", "B", "C"], capacity: 60 },
  //   { hall: "Hall 3", grade: 3, sections: ["A", "C"], capacity: 40 },
  //   { hall: "Hall 4", grade: 4, sections: ["B", "D"], capacity: 40 },
  //   { hall: "Hall 5", grade: 5, sections: ["A", "B", "C", "D"], capacity: 80 },
  //   { hall: "Hall 6", grade: 6, sections: ["A", "B"], capacity: 40 },
  //   { hall: "Hall 7", grade: 7, sections: ["B", "C"], capacity: 40 },
  //   { hall: "Hall 8", grade: 8, sections: ["C", "D"], capacity: 40 },
  //   { hall: "Hall 9", grade: 9, sections: ["D", "E"], capacity: 40 },
  //   { hall: "Hall 10", grade: 10, sections: ["A", "B", "C", "D", "E"], capacity: 100 },
  //   { hall: "Hall 11", grade: 11, sections: ["A", "B"], capacity: 40 }
  // ];

  // State management
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [filteredTimetable, setFilteredTimetable] = useState([]);
  const [filteredHallArrangements, setFilteredHallArrangements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useFallbackData, setUseFallbackData] = useState(false);

  // Normalize data to handle both old and new field names
  const normalizeTimetableData = (data) => {
    return data.map(item => ({
      ...item,
      grade: item.grade || item.classLevel,
      class: item.class || item.section,
      classSection: item.classSection || `${item.grade || item.classLevel}-${item.class || item.section}`
    }));
  };

  // Extract grade number from "Grade X" format
  const getGradeNumber = (gradeString) => {
    if (!gradeString) return '';
    const match = gradeString.match(/Grade (\d+)/);
    return match ? match[1] : gradeString;
  };

  // Helper function to derive hall arrangements from timetable data
  const deriveHallArrangements = (timetables, filterClass = null) => {
    const hallMap = new Map();
    
    timetables.forEach(timetable => {
      // If a specific class is requested, only include timetables for that class
      if (filterClass && timetable.class !== filterClass) {
        return;
      }
      
      const hallKey = timetable.hall;
      if (!hallMap.has(hallKey)) {
        hallMap.set(hallKey, {
          hall: hallKey,
          grade: timetable.grade || timetable.classLevel,
          sections: new Set(),
          capacity: 40 // Default capacity
        });
      }
      
      // Add the class section to this hall
      const section = timetable.class || timetable.section;
      if (section && ['A', 'B', 'C', 'D', 'E'].includes(section)) {
        hallMap.get(hallKey).sections.add(section);
      }
    });
    
    // Convert Set to Array and return
    return Array.from(hallMap.values()).map(hall => ({
      ...hall,
      sections: Array.from(hall.sections).sort()
    }));
  };

  // Load data from backend
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Convert "Grade X" to just the number for API calls
      const gradeNumber = getGradeNumber(selectedGrade);
      
      // Get filtered timetables
      const timetables = await TimeTableAPI.getFilteredTimeTables(gradeNumber, selectedClass);
      
      // Normalize the data to handle both old and new field names
      const normalizedTimetables = normalizeTimetableData(timetables);
      
      // Derive hall arrangements from timetable data for the selected grade and class
      let hallArrangements = [];
      if (selectedGrade && selectedClass) {
        // Get all timetables for the selected grade (not filtered by class)
        const gradeTimetables = await TimeTableAPI.getFilteredTimeTables(gradeNumber, '');
        const normalizedGradeTimetables = normalizeTimetableData(gradeTimetables);
        // Filter hall arrangements to show only the selected class
        hallArrangements = deriveHallArrangements(normalizedGradeTimetables, selectedClass);
      }
      
      setFilteredTimetable(normalizedTimetables);
      setFilteredHallArrangements(hallArrangements);
      setUseFallbackData(false);
    } catch (err) {
      console.error('Backend not available, using fallback data:', err);
      setError('Backend not available. Showing sample data.');
      
      // Use fallback data with new filtering logic
      const gradeNumber = getGradeNumber(selectedGrade);
      const filteredTimetableData = fallbackTimetableData.filter(item => {
        if (gradeNumber && item.grade !== parseInt(gradeNumber)) return false;
        if (selectedClass && item.class !== selectedClass) return false;
        return true;
      });

      // Derive hall arrangements from fallback timetable data for the selected grade and class
      let filteredHallData = [];
      if (selectedGrade && selectedClass) {
        // Get all fallback timetables for the selected grade (not filtered by class)
        const gradeTimetableData = fallbackTimetableData.filter(item => {
          if (gradeNumber && item.grade !== parseInt(gradeNumber)) return false;
          return true;
        });
        // Filter hall arrangements to show only the selected class
        filteredHallData = deriveHallArrangements(gradeTimetableData, selectedClass);
      }

      setFilteredTimetable(filteredTimetableData);
      setFilteredHallArrangements(filteredHallData);
      setUseFallbackData(true);
    } finally {
      setLoading(false);
    }
  }, [selectedGrade, selectedClass]);

  // Filter functions
  const applyFilters = async () => {
    await loadData();
  };

  // Download functions
  const handleDownloadTimetable = async () => {
    if (!selectedGrade) {
      alert('Please select a grade to download timetable');
      return;
    }
    
    if (useFallbackData) {
      alert('Backend not available. Cannot download PDF in demo mode.');
      return;
    }
    
    try {
      setLoading(true);
      const gradeNumber = getGradeNumber(selectedGrade);
      // Download timetable for the entire grade (all classes)
      await TimeTableAPI.downloadTimeTableByGrade(gradeNumber);
    } catch (err) {
      alert('Failed to download timetable. Please try again.');
      console.error('Download error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadHall = async () => {
    if (!selectedGrade || !selectedClass) {
      alert('Please select both grade and class to download hall arrangements');
      return;
    }
    
    if (useFallbackData) {
      alert('Backend not available. Cannot download PDF in demo mode.');
      return;
    }
    
    try {
      setLoading(true);
      const gradeNumber = getGradeNumber(selectedGrade);
      await TimeTableAPI.downloadHallArrangementByGradeAndClass(gradeNumber, selectedClass);
    } catch (err) {
      alert('Failed to download hall arrangements. Please try again.');
      console.error('Download error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters when state changes
  useEffect(() => {
    loadData();
  }, [selectedGrade, selectedClass, loadData]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (examDropdownRef.current && !examDropdownRef.current.contains(e.target)) {
        setExamDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <Navigation />
      <div className="timetable-hall-container">
        <div className="container">
          <div className="page-header">
          <h2>All Classes TimeTable & Hall Arrangements</h2>
          <p>View and download timetables and hall arrangements for classes 1-11 (Primary: 1-5, Secondary: 6-11)</p>
          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }} ref={examDropdownRef}>
              <button
                className="btn btn-secondary"
                onClick={() => setExamDropdownOpen(s => !s)}
                style={{ padding: '10px 16px' }}
              >
                Examination <i className="fas fa-caret-down" style={{ marginLeft: 8 }} />
              </button>
              {examDropdownOpen && (
                <div style={{ position: 'absolute', top: '46px', right: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 6, boxShadow: '0 10px 30px rgba(0,0,0,0.12)', zIndex: 9999, minWidth: 220 }} role="menu">
                  <button className="dropdown-item" onClick={() => { setExamDropdownOpen(false); navigate('/exams'); }} style={{ display: 'block', padding: '10px 14px', width: '100%', textAlign: 'left', background: 'none', border: 'none' }}>Exams</button>
                  <button className="dropdown-item" onClick={() => { setExamDropdownOpen(false); navigate('/timetable'); }} style={{ display: 'block', padding: '10px 14px', width: '100%', textAlign: 'left', background: 'none', border: 'none' }}>Time Tables & Hall Arrangement</button>
                </div>
              )}
            </div>
            
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/timetable-data-entry')}
              style={{ 
                padding: '12px 24px', 
                fontSize: '16px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(to right, #00897b 0%, #00bfa5 100%)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: '0 2px 8px rgba(0, 137, 123, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 137, 123, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(0, 137, 123, 0.3)';
              }}
            >
              <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>
              Enter Timetable Data
            </button>
          </div>
        </div>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-form">
            <div className="form-group">
              <label htmlFor="grade-select">Select Grade</label>
              <select 
                id="grade-select" 
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
              >
                <option value="">All Grades</option>
                <option value="Grade 1">Grade 1</option>
                <option value="Grade 2">Grade 2</option>
                <option value="Grade 3">Grade 3</option>
                <option value="Grade 4">Grade 4</option>
                <option value="Grade 5">Grade 5</option>
                <option value="Grade 6">Grade 6</option>
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="class-select">Class</label>
              <select 
                id="class-select" 
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">All Classes</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
              </select>
            </div>
            <div className="form-group">
              <button 
                className="btn btn-primary" 
                onClick={applyFilters}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Apply Filters'}
              </button>
            </div>
          </div>
        </div>

        {/* TimeTable Section */}
        <h3 style={{marginBottom: '15px', color: '#00897b'}}>TimeTable</h3>
        {error && (
          <div style={{
            background: useFallbackData ? '#fff3e0' : '#ffebee',
            color: useFallbackData ? '#e65100' : '#c62828',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
            border: useFallbackData ? '1px solid #ffcc02' : '1px solid #ffcdd2'
          }}>
            {error}
            {useFallbackData && (
              <div style={{marginTop: '10px', fontSize: '14px'}}>
                <strong>To connect to backend:</strong>
                <ol style={{marginTop: '5px', paddingLeft: '20px'}}>
                  <li>Make sure backend server is running on port 5000</li>
                  <li>Check if MongoDB connection is working</li>
                  <li>Verify CORS is enabled in backend</li>
                </ol>
              </div>
            )}
          </div>
        )}
        <div className="table-container">
          <table id="timetable">
            <thead>
              <tr>
                <th>Exam Name</th>
                <th>Grade</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Time</th>
                <th>Hall</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center', padding: '40px'}}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'}}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid #00897b',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : filteredTimetable.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{textAlign: 'center'}}>No data available</td>
                </tr>
              ) : (
                filteredTimetable.map((item, index) => (
                  <tr key={index}>
                    <td>{item.examName}</td>
                    <td>{item.grade || item.classLevel}</td>
                    <td>{item.subject}</td>
                    <td>{new Date(item.examDate).toLocaleDateString()}</td>
                    <td>{item.examTime}</td>
                    <td>{item.hall}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          <button 
            className="btn btn-primary" 
            onClick={handleDownloadTimetable}
            disabled={loading}
          >
            {loading ? 'Downloading...' : 'Download TimeTable (PDF)'}
          </button>
        </div>

        {/* Hall Arrangements Section */}
        <h3 style={{marginBottom: '15px', color: '#00897b'}}>Hall Arrangements</h3>
        <div className="card-container" id="hall-arrangements">
          {!selectedGrade || !selectedClass ? (
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
                Please select both Grade and Class to view hall arrangements
              </p>
            </div>
          ) : loading ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: '40px',
              gap: '10px'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                border: '2px solid #00897b',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Loading hall arrangements...
            </div>
          ) : filteredHallArrangements.length === 0 ? (
            <p style={{textAlign: 'center', width: '100%'}}>No hall arrangements found for the selected filters</p>
          ) : (
            filteredHallArrangements.map((item, index) => (
              <div key={index} className="card">
                <div className="card-header">
                  <div className="card-title">{item.hall}</div>
                </div>
                <div className="card-content">
                  <p><strong>Grade:</strong> {item.grade || item.classLevel}</p>
                  <p><strong>Class:</strong> {item.sections
                    .filter(section => section && ['A', 'B', 'C', 'D', 'E'].includes(section))
                    .map(section => `${item.grade || item.classLevel}-${section}`)
                    .join(', ')}</p>
                  <p><strong>Capacity:</strong> {item.capacity} students</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          <button 
            className="btn btn-primary" 
            onClick={handleDownloadHall}
            disabled={loading}
          >
            {loading ? 'Downloading...' : 'Download Grade Hall Arrangements (PDF)'}
          </button>
        </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TimeTableHallArrangement;
