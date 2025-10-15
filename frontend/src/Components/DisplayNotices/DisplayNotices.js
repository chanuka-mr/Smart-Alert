import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FileUploaderRegular } from '@uploadcare/react-uploader';
import '@uploadcare/react-uploader/core.css';
import { api } from '../../utils/api';
import './DisplayNotices.css';

const DisplayNotices = ({ userType: propUserType, classId: propClassId }) => {
  const [notices, setNotices] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [userType, setUserType] = useState(propUserType || null);
  const [classId, setClassId] = useState(propClassId || null);
  const [deleteId, setDeleteId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotice, setEditNotice] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editAttachment, setEditAttachment] = useState(null);
  const [editAttachmentUrl, setEditAttachmentUrl] = useState('');
  const uploaderRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  
  // Get filter from URL query parameter
  const searchParams = new URLSearchParams(location.search);
  const viewFilter = searchParams.get('filter'); // 'school', 'class', or null for all
  
  // Fetch user data to determine userType
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await api('/auth/me');
        const user = userData?.user || userData;
        const detectedUserType = user?.userType || user?.role;
        console.log('DisplayNotices - User Type:', detectedUserType);
        setUserType(detectedUserType);
        setClassId(user?.classId);
      } catch (err) {
        console.error('Failed to load user data:', err);
      }
    };
    
    // Only fetch if userType not provided via props
    if (!propUserType) {
      fetchUserData();
    }
  }, [propUserType]);
  
  // Backspace navigation (only when not editing)
  useEffect(() => {
    const handleBackspace = (e) => {
      // Don't navigate if user is typing in an input, textarea, or select element
      const target = e.target;
      const isEditing = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.tagName === 'SELECT' ||
                       target.isContentEditable;
      
      if (e.key === 'Backspace' && !isEditing) {
        e.preventDefault();
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handleBackspace);
    return () => window.removeEventListener('keydown', handleBackspace);
  }, [navigate]);

  const fetchNotices = async () => {
    try {
      const res = await axios.get('/notices');
      const fetchedNotices = res.data.notices || [];
      console.log('Fetched notices:', fetchedNotices);
      // Log first notice attachment for debugging
      if (fetchedNotices.length > 0 && fetchedNotices[0].attachment) {
        console.log('First notice attachment:', fetchedNotices[0].attachment);
      }
      setNotices(fetchedNotices);
    } catch (err) {
      console.error('Failed to load notices:', err);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // School notices: createdBy === 'admin' (case-insensitive)
  const schoolNotices = notices.filter(n => n.createdBy && n.createdBy.toLowerCase() === 'admin');
  // Class notices: createdBy !== 'admin' and (for parents, only their class)
  const classNotices = notices.filter(n => n.createdBy && n.createdBy.toLowerCase() !== 'admin' && n.classId === classId);
  // Filter notices by category if selected
  const filteredSchoolNotices = schoolNotices.filter(n => !categoryFilter || n.category === categoryFilter);
  const filteredClassNotices = classNotices.filter(n => !categoryFilter || n.category === categoryFilter);

  // Helper to check if attachment has valid data
  function hasValidAttachment(attachment) {
    if (!attachment) return false;
    if (typeof attachment === 'object') {
      const keys = Object.keys(attachment);
      if (keys.length === 0) return false;
      return !!(attachment.url || attachment.uuid);
    }
    if (typeof attachment === 'string' && attachment.length > 0) {
      return true;
    }
    return false;
  }

  // Helper to get correct attachment path or URL
  function getAttachmentPath(attachment, noticeId) {
    if (!attachment) return '';
    
    console.log('getAttachmentPath called with:', { attachment, noticeId, attachmentType: typeof attachment, attachmentKeys: typeof attachment === 'object' ? Object.keys(attachment) : 'N/A' });
    
    // If attachment is an object
    if (typeof attachment === 'object') {
      // Check if it's an empty object
      const keys = Object.keys(attachment);
      if (keys.length === 0) {
        console.log('Empty attachment object, skipping');
        return '';
      }
      
      // If full URL is present, use it
      if (attachment.url) {
        console.log('Using attachment.url:', attachment.url);
        return attachment.url;
      }
      // If only UUID is present, construct the Uploadcare URL
      if (attachment.uuid) {
        const constructedUrl = `https://ucarecdn.com/${attachment.uuid}/`;
        console.log('Constructed URL from UUID:', constructedUrl);
        return constructedUrl;
      }
    }
    
    // If attachment is a string (could be UUID or URL)
    if (typeof attachment === 'string') {
      // If it's already a full URL, return it
      if (attachment.startsWith('http')) {
        console.log('Using string URL:', attachment);
        return attachment;
      }
      // If it looks like a UUID, construct the Uploadcare URL
      if (attachment.length > 20 && !attachment.includes('/')) {
        const constructedUrl = `https://ucarecdn.com/${attachment}/`;
        console.log('Constructed URL from string UUID:', constructedUrl);
        return constructedUrl;
      }
    }
    
    console.log('No valid attachment data found');
    return '';
  }

  // Helper to handle attachment download
  const handleDownloadAttachment = async (attachment, noticeId, filename) => {
    try {
      const url = getAttachmentPath(attachment, noticeId);
      if (!url) return;

      // For Uploadcare URLs, open in new tab (they handle downloads)
      if (url.includes('ucarecdn.com')) {
        window.open(url, '_blank');
        return;
      }

      // For local API endpoints, fetch and download
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to download attachment:', err);
      alert('Failed to download attachment. Please try again.');
    }
  };

  // Handle inline edit notice
  const handleUpdateNotice = (notice) => {
    setEditId(notice._id);
    setEditTitle(notice.title);
    setEditNotice(notice.notice);
    setEditCategory(notice.category || 'General');
    // Store existing attachment data
    if (notice.attachment && notice.attachment.url) {
      setEditAttachment(notice.attachment);
      setEditAttachmentUrl(notice.attachment.url);
    } else {
      setEditAttachment(null);
      setEditAttachmentUrl('');
    }
    // Scroll to the edit form
    setTimeout(() => {
      const element = document.getElementById(`edit-form-${notice._id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditId(null);
    setEditTitle('');
    setEditNotice('');
    setEditCategory('');
    setEditAttachment(null);
    setEditAttachmentUrl('');
  };

  // Handle delete attachment
  const handleDeleteAttachment = () => {
    setEditAttachment(null);
    setEditAttachmentUrl('');
  };

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
      setEditAttachment(attachmentData);
      setEditAttachmentUrl(file.cdnUrl);
      console.log('File uploaded to Uploadcare:', attachmentData);
    }
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    try {
      const noticeData = {
        title: editTitle,
        notice: editNotice,
        category: editCategory,
        attachment: editAttachmentUrl === '' ? null : (editAttachment || 'keep'),
        updatedAt: new Date().toISOString()
      };
      await axios.put(`/notices/${editId}`, noticeData, {
        headers: { 'Content-Type': 'application/json' },
      });
      handleCancelEdit();
      fetchNotices();
    } catch (err) {
      console.error('Error updating notice:', err);
      alert('Failed to update notice. Please try again.');
    }
  };

  // Handle delete notice
  const handleDeleteNotice = (noticeId) => {
    setDeleteId(noticeId);
  };

  // Confirm delete
  const confirmDelete = async () => {
    try {
      await axios.delete(`/notices/${deleteId}`);
      setDeleteId(null);
      fetchNotices();
    } catch (err) {
      console.error('Failed to delete notice:', err);
      alert('Failed to delete notice. Please try again.');
      setDeleteId(null);
    }
  };


  return (
    <>
      <div className="section-title">
        <h2>Notices</h2>
      </div>
      <div className="display-notices-container">
        <div className="container home-page">
          <div className="notices-filter-row">
            <label htmlFor="categoryFilter">Search by Category:</label>
            <select id="categoryFilter" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="">All</option>
              <option value="General">General</option>
              <option value="Exam">Exam</option>
              <option value="Holiday">Holiday</option>
              <option value="Event">Event</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="notices-subtopics">
            {(!viewFilter || viewFilter === 'school') && (
            <div className="notices-subtopic">
              <h3>School Notices</h3>
              <div className="notices-section">
                {filteredSchoolNotices.length === 0 ? <p>No school notices.</p> : filteredSchoolNotices.map(n => (
                  <div className="notice-card" key={n._id} id={`notice-${n._id}`}>
                    {editId === n._id ? (
                      <div className="edit-form" id={`edit-form-${n._id}`}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          placeholder="Title"
                          className="edit-input"
                        />
                        <textarea
                          value={editNotice}
                          onChange={e => setEditNotice(e.target.value)}
                          placeholder="Notice"
                          className="edit-textarea"
                          rows="5"
                        />
                        <select
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value)}
                          className="edit-select"
                        >
                          <option value="General">General</option>
                          <option value="Exam">Exam</option>
                          <option value="Holiday">Holiday</option>
                          <option value="Event">Event</option>
                          <option value="Other">Other</option>
                        </select>
                        {editAttachmentUrl && (
                          <div className="current-attachment">
                            <p>Current: {editAttachment?.filename || 'Attachment'}</p>
                            <a href={editAttachmentUrl} target="_blank" rel="noopener noreferrer">View</a>
                            <button type="button" className="btn-remove" onClick={handleDeleteAttachment}>Remove</button>
                          </div>
                        )}
                        <label className="upload-label">Upload New Attachment (optional)</label>
                        <FileUploaderRegular
                          ref={uploaderRef}
                          pubkey="e8c9790d2d0cfc27cb41"
                          maxLocalFileSizeBytes={20971520}
                          multiple={false}
                          sourceList="local, url, camera, dropbox"
                          classNameUploader="uc-light"
                          onFileUploadSuccess={handleUploadSuccess}
                        />
                        <div className="edit-actions">
                          <button className="btn-save" onClick={handleSaveEdit}>Save</button>
                          <button className="btn-cancel" onClick={handleCancelEdit}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3>{n.title}</h3>
                        <p>{n.notice}</p>
                        {hasValidAttachment(n.attachment) && (
                          <div className="notice-attachment">
                            <button 
                              onClick={() => handleDownloadAttachment(n.attachment, n._id, getFileName(n.attachment))}
                              style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#222', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              <img src="https://cdn.jsdelivr.net/gh/file-icons/icons/svg/pdf.svg" alt="pdf" style={{ width: 28, height: 28, marginRight: 8 }} />
                              <span>{getFileName(n.attachment)}</span>
                            </button>
                          </div>
                        )}
                        <span className="notice-category">{n.category}</span>
                        <span className="notice-date">{new Date(n.publishedAt).toLocaleString()}</span>
                        <span className="notice-author">By: {n.createdBy}</span>
                        <div className="notice-actions">
                          <button
                            className="btn-primary notice-download"
                            onClick={() => downloadNoticeAsPDF(n.title, n.notice, n.publishedAt, n.createdBy)}
                          >Download Notice as PDF</button>
                          {(userType === 'Admin' || userType === 'admin') && (
                            <>
                              <button
                                className="btn-update"
                                onClick={() => handleUpdateNotice(n)}
                              >Update</button>
                              <button
                                className="btn-delete"
                                onClick={() => handleDeleteNotice(n._id)}
                              >Delete</button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            )}
            {(!viewFilter || viewFilter === 'class') && (
            <div className="notices-subtopic">
              <h3>Class Notices</h3>
              <div className="notices-section">
                {filteredClassNotices.length === 0 ? <p>No class notices.</p> : filteredClassNotices.map(n => (
                  <div className="notice-card" key={n._id} id={`notice-${n._id}`}>
                    {editId === n._id ? (
                      <div className="edit-form" id={`edit-form-${n._id}`}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          placeholder="Title"
                          className="edit-input"
                        />
                        <textarea
                          value={editNotice}
                          onChange={e => setEditNotice(e.target.value)}
                          placeholder="Notice"
                          className="edit-textarea"
                          rows="5"
                        />
                        <select
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value)}
                          className="edit-select"
                        >
                          <option value="General">General</option>
                          <option value="Exam">Exam</option>
                          <option value="Holiday">Holiday</option>
                          <option value="Event">Event</option>
                          <option value="Other">Other</option>
                        </select>
                        {editAttachmentUrl && (
                          <div className="current-attachment">
                            <p>Current: {editAttachment?.filename || 'Attachment'}</p>
                            <a href={editAttachmentUrl} target="_blank" rel="noopener noreferrer">View</a>
                            <button type="button" className="btn-remove" onClick={handleDeleteAttachment}>Remove</button>
                          </div>
                        )}
                        <label className="upload-label">Upload New Attachment (optional)</label>
                        <FileUploaderRegular
                          ref={uploaderRef}
                          pubkey="e8c9790d2d0cfc27cb41"
                          maxLocalFileSizeBytes={20971520}
                          multiple={false}
                          sourceList="local, url, camera, dropbox"
                          classNameUploader="uc-light"
                          onFileUploadSuccess={handleUploadSuccess}
                        />
                        <div className="edit-actions">
                          <button className="btn-save" onClick={handleSaveEdit}>Save</button>
                          <button className="btn-cancel" onClick={handleCancelEdit}>Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h3>{n.title}</h3>
                        <p>{n.notice}</p>
                        {hasValidAttachment(n.attachment) && (
                          <div className="notice-attachment">
                            <button 
                              onClick={() => handleDownloadAttachment(n.attachment, n._id, getFileName(n.attachment))}
                              style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#222', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            >
                              <img src="https://cdn.jsdelivr.net/gh/file-icons/icons/svg/pdf.svg" alt="pdf" style={{ width: 28, height: 28, marginRight: 8 }} />
                              <span>{getFileName(n.attachment)}</span>
                            </button>
                          </div>
                        )}
                        <span className="notice-category">{n.category}</span>
                        <span className="notice-date">{new Date(n.publishedAt).toLocaleString()}</span>
                        <span className="notice-author">By: {n.createdBy}</span>
                        <div className="notice-actions">
                          <button
                            className="btn-primary notice-download"
                            onClick={() => downloadNoticeAsPDF(n.title, n.notice)}
                          >Download Notice as PDF</button>
                          {(userType === 'Admin' || userType === 'admin') && (
                            <>
                              <button
                                className="btn-update"
                                onClick={() => handleUpdateNotice(n)}
                              >Update</button>
                              <button
                                className="btn-delete"
                                onClick={() => handleDeleteNotice(n._id)}
                              >Delete</button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this notice? This action cannot be undone.</p>
            <p style={{ color: '#d32f2f', fontWeight: 500, marginTop: 8 }}>
              If there is an attached file, it will also be deleted.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '18px' }}>
              <button className="btn-primary" onClick={confirmDelete}>Delete</button>
              <button className="btn-primary" style={{ background: '#bbb', color: '#222' }} onClick={() => setDeleteId(null)}>Cancel</button>
            </div>
          </div>
          <div className="modal-backdrop" style={{ pointerEvents: 'none' }}></div>
        </div>
      )}
    </>
  );
};

// Helper to get file name from attachment path or object
function getFileName(attachment) {
  if (!attachment) return '';
  
  // If attachment is an object with filename property
  if (typeof attachment === 'object' && attachment.filename) {
    return attachment.filename;
  }
  
  // If attachment is a string path
  const pathStr = typeof attachment === 'string' ? attachment : attachment.path || '';
  if (!pathStr) return '';
  return pathStr.split('/').pop().split('\\').pop();
}

// Helper to download notice as PDF
function downloadNoticeAsPDF(title, notice, publishedAt, createdBy) {
  // Use jsPDF for PDF generation
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  script.onload = () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
  // Header
  doc.setFontSize(18);
  doc.setTextColor(22, 119, 210);
  doc.text('WEBSTER INTERNATIONAL SCHOOL', 10, 15);
  // Publisher and Date
  doc.setFontSize(12);
  const dateStr = publishedAt ? new Date(publishedAt).toLocaleString() : '';
  doc.text(`Published by: ${createdBy || 'Unknown'}`, 10, 25);
  doc.text(`Published at: ${dateStr}`, 10, 33);
  // Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text(title, 10, 45);
  // Notice
  doc.setFontSize(12);
  doc.text(notice, 10, 60);
  doc.save(`${title}-notice.pdf`);
  };
  document.body.appendChild(script);
}

export default DisplayNotices;
