import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { api } from '../../utils/api';
import './DisplayNotices.css';

const DisplayNotices = ({ userType: propUserType, classId: propClassId }) => {
  const [notices, setNotices] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [userType, setUserType] = useState(propUserType || null);
  const [classId, setClassId] = useState(propClassId || null);

  const navigate = useNavigate();
  
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
  
  // Backspace navigation
  useEffect(() => {
    const handleBackspace = (e) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        navigate(-1);
      }
    };
    window.addEventListener('keydown', handleBackspace);
    return () => window.removeEventListener('keydown', handleBackspace);
  }, [navigate]);

  useEffect(() => {
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
    fetchNotices();
  }, []);

  // School notices: createdBy === 'admin'
  const schoolNotices = notices.filter(n => n.createdBy === 'admin');
  // Class notices: createdBy !== 'admin' and (for parents, only their class)
  const classNotices = notices.filter(n => n.createdBy !== 'admin' && n.classId === classId);
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


  return (
    <>
      <div className="section-title">
        <h2>Notices</h2>
        <p>View all school and class notices</p>
        {(userType === 'Admin' || userType === 'Teacher' || userType === 'admin' || userType === 'teacher') && (
          <button 
            className="btn-primary create-notice-btn"
            onClick={() => navigate((userType === 'Admin' || userType === 'admin') ? '/admin-create-notice' : '/teacher-create-notice')}
          >
            + Create New Notice
          </button>
        )}
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
            <div className="notices-subtopic">
              <h3>School Notices</h3>
              <div className="notices-section">
                {filteredSchoolNotices.length === 0 ? <p>No school notices.</p> : filteredSchoolNotices.map(n => (
                  <div className="notice-card" key={n._id}>
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
                    <button
                      className="btn-primary notice-download"
                      onClick={() => downloadNoticeAsPDF(n.title, n.notice, n.publishedAt, n.createdBy)}
                    >Download Notice as PDF</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="notices-subtopic">
              <h3>Class Notices</h3>
              <div className="notices-section">
                {filteredClassNotices.length === 0 ? <p>No class notices.</p> : filteredClassNotices.map(n => (
                  <div className="notice-card" key={n._id}>
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
                    <button
                      className="btn-primary notice-download"
                      onClick={() => downloadNoticeAsPDF(n.title, n.notice)}
                    >Download Notice as PDF</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
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
