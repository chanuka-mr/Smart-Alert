
// React component for creating a new notice as a teacher
import React, { useState } from 'react';
import axios from 'axios'; // For making API requests
import './CreateNoticeTeacher.css'; // Import component-specific styles

const CreateNoticeTeacher = ({ classId, teacherName }) => {
  // State variables for form fields and status
  const [title, setTitle] = useState(''); // Notice title
  const [notice, setNotice] = useState(''); // Notice content
  const [attachment, setAttachment] = useState(null); // File attachment
  const [category, setCategory] = useState('General'); // Notice category
  const [loading, setLoading] = useState(false); // Loading state for submit
  const [success, setSuccess] = useState(''); // Success message
  const [error, setError] = useState(''); // Error message

  // Handle file input change
  const handleFileChange = (e) => {
    setAttachment(e.target.files[0]); // Store selected file
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submit
    setLoading(true); // Show loading spinner
    setError(''); // Reset error
    setSuccess(''); // Reset success
    try {
      // Prepare form data for backend
      const formData = new FormData();
      formData.append('title', title);
      formData.append('notice', notice);
      formData.append('createdBy', teacherName || 'teacher'); // Set creator as teacher
      formData.append('category', category);
      formData.append('classId', classId); // For backend filtering
      if (attachment) formData.append('attachment', attachment); // Add file if present
      // Send POST request to backend
      await axios.post('/notices', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // On success, reset form and show message
      setSuccess('Notice published successfully!');
      setTitle('');
      setNotice('');
      setAttachment(null);
      setCategory('General');
    } catch (err) {
      setError('Failed to publish notice.'); // Show error message
    }
    setLoading(false); // Hide loading spinner
  };

  // Render the notice creation form
  return (
    <div className="container">
      {/* Section title and description */}
      <div className="section-title">
        <h2>Create Notice (Teacher)</h2>
        <p>Publish class-specific announcements and updates</p>
      </div>
      <div className="create-notice-teacher-container">
        <form className="create-notice-form" onSubmit={handleSubmit}>
          {/* Title input */}
          <label>Title</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
          {/* Notice content input */}
          <label>Notice</label>
          <textarea value={notice} onChange={e => setNotice(e.target.value)} required />
          {/* Category dropdown */}
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="General">General</option>
            <option value="Exam">Exam</option>
            <option value="Holiday">Holiday</option>
            <option value="Event">Event</option>
            <option value="Other">Other</option>
          </select>
          {/* File attachment input */}
          <label>Attachment (optional)</label>
          <input type="file" onChange={handleFileChange} />
          {/* Submit button */}
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Publishing...' : 'Publish Notice'}</button>
          {/* Success and error messages */}
          {success && <p className="success-msg">{success}</p>}
          {error && <p className="error-msg">{error}</p>}
        </form>
      </div>
    </div>
  );
};

// Export the component for use in the app
export default CreateNoticeTeacher;
