
// React component for creating a new notice as a teacher
import React, { useState, useRef } from 'react';
import axios from 'axios'; // For making API requests
import { FileUploaderRegular } from '@uploadcare/react-uploader';
import '@uploadcare/react-uploader/core.css';
import './CreateNoticeTeacher.css'; // Import component-specific styles

const CreateNoticeTeacher = ({ classId, teacherName }) => {
  // State variables for form fields and status
  const [title, setTitle] = useState(''); // Notice title
  const [notice, setNotice] = useState(''); // Notice content
  const [attachment, setAttachment] = useState(null); // Uploadcare file data
  const [category, setCategory] = useState('General'); // Notice category
  const [loading, setLoading] = useState(false); // Loading state for submit
  const [success, setSuccess] = useState(''); // Success message
  const [error, setError] = useState(''); // Error message
  const uploaderRef = useRef(null);

  // Handle Uploadcare file upload success
  const handleUploadSuccess = (file) => {
    if (file && file.cdnUrl) {
      const attachmentData = {
        url: file.cdnUrl,
        uuid: file.uuid,
        contentType: file.mimeType,
        filename: file.name,
        size: file.size
      };
      setAttachment(attachmentData);
      console.log('File uploaded to Uploadcare:', attachmentData);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submit
    setLoading(true); // Show loading spinner
    setError(''); // Reset error
    setSuccess(''); // Reset success
    try {
      // Prepare data for backend
      const noticeData = {
        title,
        notice,
        createdBy: teacherName || 'teacher',
        category,
        classId,
        attachment: attachment || null
      };
      // Send POST request to backend
      await axios.post('/notices', noticeData, {
        headers: { 'Content-Type': 'application/json' },
      });
      // On success, reset form and show message
      setSuccess('Notice published successfully!');
      setTitle('');
      setNotice('');
      setAttachment(null);
      setCategory('General');
      // Reset Uploadcare widget
      if (uploaderRef.current && uploaderRef.current.uploadCollection) {
        try {
          uploaderRef.current.uploadCollection.clearAll();
        } catch (err) {
          console.log('Could not clear uploader:', err);
        }
      }
    } catch (err) {
      console.error('Error publishing notice:', err);
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
          <FileUploaderRegular
            ref={uploaderRef}
            pubkey="e8c9790d2d0cfc27cb41"
            maxLocalFileSizeBytes={20971520}
            multiple={false}
            sourceList="local, url, camera, dropbox"
            classNameUploader="uc-light"
            onFileUploadSuccess={handleUploadSuccess}
          />
          {attachment && (
            <div style={{ marginTop: '10px', padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
              <p style={{ margin: 0, fontSize: '14px' }}>✓ File uploaded: {attachment.filename}</p>
              <button 
                type="button" 
                onClick={() => setAttachment(null)}
                style={{ marginTop: '5px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
              >
                Remove
              </button>
            </div>
          )}
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
