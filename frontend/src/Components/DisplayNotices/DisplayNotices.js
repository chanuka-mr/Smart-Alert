import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DisplayNotices.css';

const DisplayNotices = ({ userType, classId }) => {
  const [notices, setNotices] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');

  const navigate = useNavigate();
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
        setNotices(res.data.notices || []);
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

  // Helper to get correct attachment path or data URL
  function getAttachmentPath(attachment, noticeId) {
    if (!attachment) return '';
    
    // If attachment is an object (with or without Base64 data), use the API endpoint
    if (typeof attachment === 'object' && noticeId) {
      // If Base64 data is present, use data URL (for backward compatibility)
      if (attachment.data) {
        return `data:${attachment.contentType};base64,${attachment.data}`;
      }
      // Otherwise, fetch from API endpoint
      return `/notices/${noticeId}/attachment`;
    }
    
    // If we have a notice ID, use the attachment API endpoint (use relative path for proxy)
    if (noticeId) {
      return `/notices/${noticeId}/attachment`;
    }
    
    // Fallback: if attachment is a string path
    const attachmentStr = typeof attachment === 'string' ? attachment : attachment.path || attachment.filename || '';
    if (!attachmentStr) return '';
    const filename = attachmentStr.split('/').pop().split('\\').pop();
    return `/uploads/${filename}`;
  }


  return (
    <>
      <div className="section-title">
        <h2>Notices</h2>
        <p>View all school and class notices</p>
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
                    {n.attachment && (
                      <div className="notice-attachment">
                        <a href={getAttachmentPath(n.attachment, n._id)} download target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#222' }}>
                          <img src="https://cdn.jsdelivr.net/gh/file-icons/icons/svg/pdf.svg" alt="pdf" style={{ width: 28, height: 28, marginRight: 8 }} />
                          <span>{getFileName(n.attachment)}</span>
                        </a>
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
                    {n.attachment && (
                      <div className="notice-attachment">
                        <a href={getAttachmentPath(n.attachment, n._id)} download target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#222' }}>
                          <img src="https://cdn.jsdelivr.net/gh/file-icons/icons/svg/pdf.svg" alt="pdf" style={{ width: 28, height: 28, marginRight: 8 }} />
                          <span>{getFileName(n.attachment)}</span>
                        </a>
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
