import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './UpdateNoticeAdmin.css';

const UpdateNoticeAdmin = () => {
  const [notices, setNotices] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editNotice, setEditNotice] = useState('');
  const [editAttachment, setEditAttachment] = useState(null);
  const [editAttachmentUrl, setEditAttachmentUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/notices');
      setNotices((res.data.notices || []).filter(n => n.createdBy === 'admin'));
    } catch (err) {
      setError('Failed to load notices.');
    }
    setLoading(false);
  };

  const handleEdit = (notice) => {
    setEditId(notice._id);
    setEditTitle(notice.title);
    setEditNotice(notice.notice);
    setEditAttachment(null);
    setEditAttachmentUrl(notice.attachment || '');
  };

  const handleDeleteAttachment = () => {
    setEditAttachment(null);
    setEditAttachmentUrl('');
  };

  const handleAttachmentChange = (e) => {
    setEditAttachment(e.target.files[0]);
    setEditAttachmentUrl('');
  };

  const handleUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append('title', editTitle);
      formData.append('notice', editNotice);
      if (editAttachment) {
        formData.append('attachment', editAttachment);
      } else if (editAttachmentUrl === '') {
        formData.append('attachment', ''); // delete attachment
      }
      await axios.put(`/notices/${editId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditId(null);
      setEditTitle('');
      setEditNotice('');
      setEditAttachment(null);
      setEditAttachmentUrl('');
      fetchNotices();
    } catch (err) {
      setError('Failed to update notice.');
    }
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`/notices/${deleteId}`);
      setDeleteId(null);
      fetchNotices();
    } catch (err) {
      setError('Failed to delete notice.');
      setDeleteId(null);
    }
  };

  return (
    <>
      <div className="section-title">
        <h2>Admin: Update or Delete Notices</h2>
      </div>
      <div className="update-notice-admin-container">
        {loading ? <p>Loading...</p> : error ? <p className="error-msg">{error}</p> : (
          <div className="notices-list">
            {notices.length === 0 ? <p>No admin notices found.</p> : notices.map(n => (
              <div className="notice-item" key={n._id}>
                {editId === n._id ? (
                  <div className="edit-form">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      placeholder="Title"
                    />
                    <textarea
                      value={editNotice}
                      onChange={e => setEditNotice(e.target.value)}
                      placeholder="Notice"
                    />
                    {editAttachmentUrl && (
                      <div>
                        <a href={`http://localhost:5000${editAttachmentUrl}`} target="_blank" rel="noopener noreferrer">Download Current Attachment</a>
                        <button type="button" className="btn-primary" onClick={handleDeleteAttachment}>Delete Attachment</button>
                      </div>
                    )}
                    <input type="file" onChange={handleAttachmentChange} />
                    <button className="btn-primary" onClick={handleUpdate}>Save</button>
                    <button className="btn-primary" onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                ) : (
                  <>
                    <h3>{n.title}</h3>
                    <p>{n.notice}</p>
                    {n.attachment && (
                      <div className="notice-attachment-display" style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
                        <span role="img" aria-label="attachment" style={{ fontSize: '1.3em' }}>📎</span>
                        <span style={{ fontWeight: 500 }}>{n.attachment.split('/').pop()}</span>
                        <a href={`http://localhost:5000${n.attachment}`} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ padding: '2px 10px', fontSize: '0.95em' }}>Download</a>
                      </div>
                    )}
                    <span className="notice-category">{n.category}</span>
                    <span className="notice-date">{new Date(n.publishedAt).toLocaleString()}</span>
                    <span className="notice-author">By: {n.createdBy}</span>
                    <button className="btn-primary" onClick={() => handleEdit(n)}>Edit</button>
                    <button className="btn-primary" onClick={() => handleDelete(n._id)}>Delete</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
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
            {/* Remove click-to-close behavior on backdrop */}
            <div className="modal-backdrop" style={{ pointerEvents: 'none' }}></div>
          </div>
        )}
      </div>
    </>
  );
};

export default UpdateNoticeAdmin;
