import React, { useState, useEffect } from 'react';
import { shuttleAPI } from '../services/api';
import './ShuttleManagement.css';

const ShuttleManagement = () => {
  const [shuttles, setShuttles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState('');

  // Form data for adding/editing shuttles
  const [formData, setFormData] = useState({
    vehicleNo: '',
    driverName: '',
    contactNo: '',
    route: '',
    startingLocation: {
      name: '',
      coordinates: { lat: 0, lng: 0 }
    },
    endingLocation: {
      name: '',
      coordinates: { lat: 0, lng: 0 }
    },
    waypoints: [],
    schedule: {
      startTime: '',
      frequency: 'Daily'
    }
  });

  // Load shuttles on component mount
  useEffect(() => {
    loadShuttles();
  }, []);

  const loadShuttles = async () => {
    try {
      setLoading(true);
      const data = await shuttleAPI.getAllShuttles();
      setShuttles(data);
      setError('');
    } catch (err) {
      console.error('Error loading shuttles:', err);
      setError('Failed to load shuttles: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      vehicleNo: '',
      driverName: '',
      contactNo: '',
      route: '',
      startingLocation: {
        name: '',
        coordinates: { lat: 0, lng: 0 }
      },
      endingLocation: {
        name: '',
        coordinates: { lat: 0, lng: 0 }
      },
      waypoints: [],
      schedule: {
        startTime: '',
        frequency: 'Daily'
      }
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.vehicleNo || !formData.driverName || !formData.contactNo) {
      setError('Please fill in all required fields (Vehicle Number, Driver Name, Contact Number)');
      return;
    }

    // Validate location fields
    if (!formData.startingLocation.name || formData.startingLocation.name.trim() === '') {
      setError('Please enter a starting location');
      return;
    }

    if (!formData.endingLocation.name || formData.endingLocation.name.trim() === '') {
      setError('Please enter an ending location');
      return;
    }

    if (!formData.schedule.startTime || formData.schedule.startTime.trim() === '') {
      setError('Please enter a start time');
      return;
    }

    // Prepare data for submission
    const submitData = {
      vehicleNo: formData.vehicleNo,
      driverName: formData.driverName,
      contactNo: formData.contactNo,
      contactNumber: formData.contactNo, // Also send as contactNumber for compatibility
      route: formData.route,
      startingLocation: {
        name: formData.startingLocation.name || 'Not specified',
        coordinates: {
          lat: formData.startingLocation.coordinates.lat || 0,
          lng: formData.startingLocation.coordinates.lng || 0
        }
      },
      endingLocation: {
        name: formData.endingLocation.name || 'Not specified',
        coordinates: {
          lat: formData.endingLocation.coordinates.lat || 0,
          lng: formData.endingLocation.coordinates.lng || 0
        }
      },
      waypoints: formData.waypoints || [],
      schedule: {
        startTime: formData.schedule.startTime || 'Not specified',
        frequency: formData.schedule.frequency || 'Daily'
      }
    };

    console.log('Submitting data:', submitData); // Debug log

    try {
      if (editingId) {
        // Update existing shuttle
        await shuttleAPI.updateShuttle(editingId, submitData);
        setSuccess('Shuttle updated successfully!');
      } else {
        // Add new shuttle
        await shuttleAPI.addShuttle(submitData);
        setSuccess('Shuttle added successfully!');
      }
      resetForm();
      loadShuttles();
    } catch (err) {
      console.error('Error submitting shuttle:', err);
      setError(err.message || 'Failed to save shuttle');
    }
  };

  const handleEdit = (shuttle) => {
    console.log('Editing shuttle:', shuttle); // Debug log
    
    setFormData({
      vehicleNo: shuttle.vehicleNo || '',
      driverName: shuttle.driverName || '',
      contactNo: shuttle.contactNo || shuttle.contactNumber || '',
      route: shuttle.route || '',
      startingLocation: {
        name: shuttle.startingLocation?.name || '',
        coordinates: {
          lat: shuttle.startingLocation?.coordinates?.lat || 0,
          lng: shuttle.startingLocation?.coordinates?.lng || 0
        }
      },
      endingLocation: {
        name: shuttle.endingLocation?.name || '',
        coordinates: {
          lat: shuttle.endingLocation?.coordinates?.lat || 0,
          lng: shuttle.endingLocation?.coordinates?.lng || 0
        }
      },
      waypoints: shuttle.waypoints || [],
      schedule: {
        startTime: shuttle.schedule?.startTime || '',
        frequency: shuttle.schedule?.frequency || 'Daily'
      }
    });
    setEditingId(shuttle._id);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this shuttle?')) {
      try {
        await shuttleAPI.deleteShuttle(id);
        setSuccess('Shuttle deleted successfully!');
        loadShuttles();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  // Search for locations using Google Places API
  const searchLocation = async (query, fieldType) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearchingLocation(true);
    setActiveSearchField(fieldType);
    
    try {
      // Use Google Places API for location search
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      
      const request = {
        query: query,
        fields: ['name', 'geometry', 'formatted_address', 'place_id']
      };

      service.textSearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const formattedResults = results.map(place => ({
            name: place.name,
            address: place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            placeId: place.place_id
          }));
          
          setSearchResults(formattedResults);
        } else {
          setSearchResults([]);
        }
        setSearchingLocation(false);
      });
    } catch (err) {
      console.error('Error searching locations:', err);
      setSearchResults([]);
      setSearchingLocation(false);
    }
  };

  // Select a location from search results
  const selectLocation = (location, fieldType) => {
    if (fieldType === 'starting') {
      setFormData(prev => ({
        ...prev,
        startingLocation: {
          name: location.name,
          coordinates: { lat: location.lat, lng: location.lng }
        }
      }));
    } else if (fieldType === 'ending') {
      setFormData(prev => ({
        ...prev,
        endingLocation: {
          name: location.name,
          coordinates: { lat: location.lat, lng: location.lng }
        }
      }));
    } else if (fieldType.startsWith('waypoint-')) {
      const waypointIndex = parseInt(fieldType.split('-')[1]);
      const newWaypoints = [...formData.waypoints];
      newWaypoints[waypointIndex] = {
        ...newWaypoints[waypointIndex],
        name: location.name,
        coordinates: { lat: location.lat, lng: location.lng }
      };
      setFormData(prev => ({ ...prev, waypoints: newWaypoints }));
    }
    
    setSearchResults([]);
    setActiveSearchField('');
  };

  // Add a new waypoint
  const addWaypoint = () => {
    setFormData(prev => ({
      ...prev,
      waypoints: [...prev.waypoints, {
        name: '',
        coordinates: { lat: 0, lng: 0 },
        description: ''
      }]
    }));
  };

  // Remove a waypoint
  const removeWaypoint = (index) => {
    setFormData(prev => ({
      ...prev,
      waypoints: prev.waypoints.filter((_, i) => i !== index)
    }));
  };

  // Update waypoint data
  const updateWaypoint = (index, field, value) => {
    const newWaypoints = [...formData.waypoints];
    newWaypoints[index] = {
      ...newWaypoints[index],
      [field]: value
    };
    setFormData(prev => ({ ...prev, waypoints: newWaypoints }));
  };


  // Filter shuttles based on search term
  const filteredShuttles = shuttles.filter(shuttle =>
    shuttle.vehicleNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shuttle.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shuttle.route?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="loading">Loading shuttles...</div>;
  }

  return (
    <div className="shuttle-management">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Shuttle Management</h1>
            <p>Manage your shuttle fleet, routes, and schedules efficiently</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              <span>➕</span>
              Add New Shuttle
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
            placeholder="Search shuttles by vehicle number, driver name, or route..."
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
          {filteredShuttles.length} of {shuttles.length} shuttles
        </div>
      </div>

      {showAddForm && (
        <div className="form-container slide-up">
          <h3>{editingId ? 'Edit Shuttle' : 'Add New Shuttle'}</h3>
          <form onSubmit={handleSubmit} className="shuttle-form">
            <div className="form-group">
              <label>Vehicle Number *</label>
              <input
                type="text"
                name="vehicleNo"
                value={formData.vehicleNo}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Driver Name *</label>
                <input
                  type="text"
                  name="driverName"
                  value={formData.driverName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contact Number *</label>
                <input
                  type="tel"
                  name="contactNo"
                  value={formData.contactNo}
                  onChange={handleInputChange}
                  pattern="[0-9]{10}"
                  required
                />
              </div>
            </div>

             <div className="form-group">
               <label>Route Description *</label>
               <input
                 type="text"
                 name="route"
                 value={formData.route}
                 onChange={handleInputChange}
                 placeholder="e.g., Marine Drive Railway Station → Senanayake Junction → School"
                 required
               />
             </div>

             {/* Starting Location */}
             <div className="location-section">
               <h4>Starting Location</h4>
               <div className="form-group">
                 <label>Starting Location *</label>
                 <div className="location-search-container">
                   <input
                     type="text"
                     value={formData.startingLocation.name}
                     onChange={(e) => {
                       setFormData(prev => ({
                         ...prev,
                         startingLocation: { ...prev.startingLocation, name: e.target.value }
                       }));
                       if (e.target.value.length >= 3) {
                         searchLocation(e.target.value, 'starting');
                       } else {
                         setSearchResults([]);
                       }
                     }}
                     placeholder="Search for starting location..."
                     className="location-search-input"
                   />
                   
                   {searchingLocation && activeSearchField === 'starting' && (
                     <div className="search-loading">Searching...</div>
                   )}
                   
                   {searchResults.length > 0 && activeSearchField === 'starting' && (
                     <div className="search-results">
                       {searchResults.map((result, index) => (
                         <div
                           key={index}
                           className="search-result-item"
                           onClick={() => selectLocation(result, 'starting')}
                         >
                           <div className="result-name">{result.name}</div>
                           <div className="result-address">{result.address}</div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               </div>
             </div>

             {/* Ending Location */}
             <div className="location-section">
               <h4>Ending Location</h4>
               <div className="form-group">
                 <label>Ending Location *</label>
                 <div className="location-search-container">
                   <input
                     type="text"
                     value={formData.endingLocation.name}
                     onChange={(e) => {
                       setFormData(prev => ({
                         ...prev,
                         endingLocation: { ...prev.endingLocation, name: e.target.value }
                       }));
                       if (e.target.value.length >= 3) {
                         searchLocation(e.target.value, 'ending');
                       } else {
                         setSearchResults([]);
                       }
                     }}
                     placeholder="Search for ending location..."
                     className="location-search-input"
                   />
                   
                   {searchingLocation && activeSearchField === 'ending' && (
                     <div className="search-loading">Searching...</div>
                   )}
                   
                   {searchResults.length > 0 && activeSearchField === 'ending' && (
                     <div className="search-results">
                       {searchResults.map((result, index) => (
                         <div
                           key={index}
                           className="search-result-item"
                           onClick={() => selectLocation(result, 'ending')}
                         >
                           <div className="result-name">{result.name}</div>
                           <div className="result-address">{result.address}</div>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
               </div>
             </div>

             {/* Schedule */}
             <div className="schedule-section">
               <h4>Schedule</h4>
               <div className="form-row">
                 <div className="form-group">
                   <label>Start Time *</label>
                   <input
                     type="time"
                     name="schedule.startTime"
                     value={formData.schedule.startTime}
                     onChange={handleInputChange}
                     required
                   />
                 </div>
                 <div className="form-group">
                   <label>Frequency</label>
                   <select
                     name="schedule.frequency"
                     value={formData.schedule.frequency}
                     onChange={handleInputChange}
                   >
                     <option value="Daily">Daily</option>
                     <option value="Weekdays">Weekdays Only</option>
                     <option value="Weekends">Weekends Only</option>
                   </select>
                 </div>
               </div>
             </div>

             {/* Waypoints */}
             <div className="waypoints-section">
               <h4>Waypoints (Optional)</h4>
               <p>Add intermediate stops along the route</p>
               
               <button
                 type="button"
                 onClick={addWaypoint}
                 className="btn btn-secondary"
               >
                 + Add Waypoint
               </button>

               {formData.waypoints.map((waypoint, index) => (
                 <div key={index} className="waypoint-item">
                   <h5>Waypoint {index + 1}</h5>
                   
                   <div className="form-group">
                     <label>Location Name *</label>
                     <div className="location-search-container">
                       <input
                         type="text"
                         value={waypoint.name}
                         onChange={(e) => {
                           updateWaypoint(index, 'name', e.target.value);
                           if (e.target.value.length >= 3) {
                             searchLocation(e.target.value, `waypoint-${index}`);
                           } else {
                             setSearchResults([]);
                           }
                         }}
                         placeholder="Search for waypoint location..."
                         className="location-search-input"
                       />
                       
                       {searchingLocation && activeSearchField === `waypoint-${index}` && (
                         <div className="search-loading">Searching...</div>
                       )}
                       
                       {searchResults.length > 0 && activeSearchField === `waypoint-${index}` && (
                         <div className="search-results">
                           {searchResults.map((result, resultIndex) => (
                             <div
                               key={resultIndex}
                               className="search-result-item"
                               onClick={() => selectLocation(result, `waypoint-${index}`)}
                             >
                               <div className="result-name">{result.name}</div>
                               <div className="result-address">{result.address}</div>
                             </div>
                           ))}
                         </div>
                       )}
                     </div>
                   </div>

                   <div className="form-group">
                     <label>Description</label>
                     <input
                       type="text"
                       value={waypoint.description}
                       onChange={(e) => updateWaypoint(index, 'description', e.target.value)}
                       placeholder="e.g., Pickup point, Drop off point"
                     />
                   </div>

                   <button
                     type="button"
                     onClick={() => removeWaypoint(index)}
                     className="btn btn-danger btn-sm"
                   >
                     Remove Waypoint
                   </button>
                 </div>
               ))}
             </div>


            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingId ? 'Update Shuttle' : 'Add Shuttle'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
         <table className="shuttle-table">
           <thead>
             <tr>
               <th>Vehicle No</th>
               <th>Driver Name</th>
               <th>Contact Number</th>
               <th>Route</th>
               <th>Starting Location</th>
               <th>Ending Location</th>
               <th>Waypoints</th>
               <th>Schedule</th>
               <th>Actions</th>
             </tr>
           </thead>
          <tbody>
            {filteredShuttles.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-results">No shuttles found.</td>
              </tr>
            ) : (
              filteredShuttles.map((shuttle, index) => (
                <tr key={shuttle._id || index}>
                  <td>{shuttle.vehicleNo || 'N/A'}</td>
                  <td>{shuttle.driverName || 'N/A'}</td>
                  <td>{shuttle.contactNo || shuttle.contactNumber || 'N/A'}</td>
                  <td>
                    <div className="route-info">
                      <div className="route-text">{shuttle.route || 'N/A'}</div>
                    </div>
                  </td>
                  <td>
                    <div className="location-info">
                      {shuttle.startingLocation?.name && shuttle.startingLocation.name !== 'Not specified' ? (
                        <div className="location-name">{shuttle.startingLocation.name}</div>
                      ) : (
                        <div className="no-data">Not specified</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="location-info">
                      {shuttle.endingLocation?.name && shuttle.endingLocation.name !== 'Not specified' ? (
                        <div className="location-name">{shuttle.endingLocation.name}</div>
                      ) : (
                        <div className="no-data">Not specified</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="waypoints-info">
                      {shuttle.waypoints && shuttle.waypoints.length > 0 ? (
                        <div className="waypoints-list">
                          <div className="waypoints-count">
                            <strong>{shuttle.waypoints.length} waypoint{shuttle.waypoints.length !== 1 ? 's' : ''}</strong>
                          </div>
                          {shuttle.waypoints.map((waypoint, wpIndex) => (
                            <div key={wpIndex} className="waypoint-item">
                              <div className="waypoint-name">{waypoint.name || 'Unnamed'}</div>
                              {waypoint.description && (
                                <div className="waypoint-description">{waypoint.description}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-data">No waypoints</div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="schedule-info">
                      {shuttle.schedule?.startTime && shuttle.schedule.startTime !== 'Not specified' ? (
                        <div className="time-item">
                          <strong>Start:</strong> {shuttle.schedule.startTime}
                        </div>
                      ) : (
                        <div className="no-data">Not specified</div>
                      )}
                      {shuttle.schedule?.frequency && (
                        <div className="frequency-item">
                          <strong>Frequency:</strong> {shuttle.schedule.frequency}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="actions">
                    <div className="action-buttons">
                      <button className="btn-sm btn-primary" onClick={() => handleEdit(shuttle)}>Edit</button>
                      <button className="btn-sm btn-danger" onClick={() => handleDelete(shuttle._id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ShuttleManagement;
