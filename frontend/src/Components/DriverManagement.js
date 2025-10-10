import React, { useState, useEffect } from 'react';
import './DriverManagement.css';

const API_BASE_URL = 'http://localhost:5000';

const DriverManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    nicNumber: '',
    phoneNumber: '',
    emergencyContact: { name: '', phone: '' },
    isActive: true,
    availabilityStatus: 'available',
    backgroundCheckStatus: 'pending',
    trainingCompleted: false,
    ratings: 0
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers`);
      if (!response.ok) throw new Error('Failed to fetch drivers');
      const data = await response.json();
      setDrivers(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editingDriver 
        ? `${API_BASE_URL}/api/drivers/${editingDriver._id}`
        : `${API_BASE_URL}/api/drivers`;
      
      const method = editingDriver ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save driver');
      }

      await fetchDrivers();
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(err.message);
      console.error('Error saving driver:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name || '',
      licenseNumber: driver.licenseNumber || '',
      nicNumber: driver.nicNumber || '',
      phoneNumber: driver.phoneNumber || '',
      emergencyContact: driver.emergencyContact || { name: '', phone: '' },
      isActive: driver.isActive !== undefined ? driver.isActive : true,
      availabilityStatus: driver.availabilityStatus || 'available',
      backgroundCheckStatus: driver.backgroundCheckStatus || 'pending',
      trainingCompleted: driver.trainingCompleted || false,
      ratings: driver.ratings || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/drivers/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete driver');
      await fetchDrivers();
    } catch (err) {
      setError(err.message);
      console.error('Error deleting driver:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      licenseNumber: '',
      nicNumber: '',
      phoneNumber: '',
      emergencyContact: { name: '', phone: '' },
      isActive: true,
      availabilityStatus: 'available',
      backgroundCheckStatus: 'pending',
      trainingCompleted: false,
      ratings: 0
    });
    setEditingDriver(null);
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'available': 'status-available',
      'on-duty': 'status-on-duty',
      'off-duty': 'status-off-duty',
      'leave': 'status-leave',
      'verified': 'status-verified',
      'pending': 'status-pending',
      'rejected': 'status-rejected'
    };
    return statusMap[status] || 'status-default';
  };

  return (
    <div className="driver-management">
      <div className="driver-header">
        <div className="header-content">
          <h2>👨‍✈️ Driver Management</h2>
          <p>Manage your driver fleet and assignments</p>
        </div>
        <button 
          className="btn-add-driver"
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
        >
          {showForm ? '✕ Cancel' : '+ Add New Driver'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {showForm && (
        <div className="driver-form-container">
          <h3>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</h3>
          <form onSubmit={handleSubmit} className="driver-form">
            <div className="form-grid">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter driver name"
                />
              </div>

              <div className="form-group">
                <label>License Number * (10 chars, at least 1 letter)</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., B1234567890"
                  maxLength="10"
                />
              </div>

              <div className="form-group">
                <label>NIC Number * (13 digits)</label>
                <input
                  type="text"
                  name="nicNumber"
                  value={formData.nicNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 1234567890123"
                  maxLength="13"
                />
              </div>

              <div className="form-group">
                <label>Phone Number * (max 10 digits)</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 0771234567"
                  maxLength="10"
                />
              </div>

              <div className="form-group">
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergencyContact.name"
                  value={formData.emergencyContact.name}
                  onChange={handleInputChange}
                  placeholder="Emergency contact name"
                />
              </div>

              <div className="form-group">
                <label>Emergency Contact Phone</label>
                <input
                  type="text"
                  name="emergencyContact.phone"
                  value={formData.emergencyContact.phone}
                  onChange={handleInputChange}
                  placeholder="Emergency contact phone"
                />
              </div>

              <div className="form-group">
                <label>Availability Status</label>
                <select
                  name="availabilityStatus"
                  value={formData.availabilityStatus}
                  onChange={handleInputChange}
                >
                  <option value="available">Available</option>
                  <option value="on-duty">On Duty</option>
                  <option value="off-duty">Off Duty</option>
                  <option value="leave">On Leave</option>
                </select>
              </div>

              <div className="form-group">
                <label>Background Check Status</label>
                <select
                  name="backgroundCheckStatus"
                  value={formData.backgroundCheckStatus}
                  onChange={handleInputChange}
                >
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="form-group">
                <label>Ratings (0-5)</label>
                <input
                  type="number"
                  name="ratings"
                  value={formData.ratings}
                  onChange={handleInputChange}
                  min="0"
                  max="5"
                  step="0.1"
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  <span>Active Driver</span>
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="trainingCompleted"
                    checked={formData.trainingCompleted}
                    onChange={handleInputChange}
                  />
                  <span>Training Completed</span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? 'Saving...' : editingDriver ? 'Update Driver' : 'Add Driver'}
              </button>
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="drivers-list">
        {loading && !showForm ? (
          <div className="loading">Loading drivers...</div>
        ) : drivers.length === 0 ? (
          <div className="no-data">
            <p>No drivers found. Add your first driver to get started!</p>
          </div>
        ) : (
          <div className="drivers-grid">
            {drivers.map((driver) => (
              <div key={driver._id} className="driver-card">
                <div className="driver-card-header">
                  <h3>{driver.name}</h3>
                  <div className="driver-status">
                    <span className={`status-badge ${getStatusBadgeClass(driver.availabilityStatus)}`}>
                      {driver.availabilityStatus}
                    </span>
                    {!driver.isActive && <span className="status-badge status-inactive">Inactive</span>}
                  </div>
                </div>

                <div className="driver-details">
                  <div className="detail-row">
                    <span className="detail-label">📜 License:</span>
                    <span className="detail-value">{driver.licenseNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">🆔 NIC:</span>
                    <span className="detail-value">{driver.nicNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">📞 Phone:</span>
                    <span className="detail-value">{driver.phoneNumber}</span>
                  </div>
                  {driver.emergencyContact?.name && (
                    <div className="detail-row">
                      <span className="detail-label">🚨 Emergency:</span>
                      <span className="detail-value">
                        {driver.emergencyContact.name} ({driver.emergencyContact.phone})
                      </span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">✅ Background:</span>
                    <span className={`status-badge ${getStatusBadgeClass(driver.backgroundCheckStatus)}`}>
                      {driver.backgroundCheckStatus}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">⭐ Rating:</span>
                    <span className="detail-value">{driver.ratings.toFixed(1)} / 5.0</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">🎓 Training:</span>
                    <span className="detail-value">
                      {driver.trainingCompleted ? '✓ Completed' : '✗ Pending'}
                    </span>
                  </div>
                </div>

                <div className="driver-actions">
                  <button 
                    className="btn-edit"
                    onClick={() => handleEdit(driver)}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDelete(driver._id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverManagement;
