import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './DirectMessages.css';

// Demo IDs (replace with real IDs from your app)
const DEMO_CLASS_ID = '6510e1f1e1f1e1f1e1f1e1f1';
const DEMO_PARENT_ID = '6510e1f1e1f1e1f1e1f1e1f2';
const DEMO_TEACHER_ID = '6510e1f1e1f1e1f1e1f1e1f3';

const DirectMessages = ({ userType }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showActionsId, setShowActionsId] = useState(null);
  const chatRef = useRef(null);

  // Helper to determine message side based on userType and sender
  const getMessageSide = (senderId) => {
    if (userType === 'parent') {
      return senderId === DEMO_PARENT_ID ? 'right' : 'left';
    } else {
      return senderId === DEMO_TEACHER_ID ? 'right' : 'left';
    }
  };

  // Helper to check edit/delete time limits
  function canEditMessage(msg) {
    const now = Date.now();
    const sent = new Date(msg.sentAt || msg.createdAt).getTime();
    return (now - sent) <= 10 * 60 * 1000; // 10 minutes
  }
  function canDeleteMessage(msg) {
    const now = Date.now();
    const sent = new Date(msg.sentAt || msg.createdAt).getTime();
    return (now - sent) <= 24 * 60 * 60 * 1000; // 24 hours
  }

  // Format date for display
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    }
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  // Format time for display
  function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  // Fetch messages from backend
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/chat/${DEMO_CLASS_ID}/${DEMO_PARENT_ID}/${DEMO_TEACHER_ID}`);
        setMessages(res.data);
      } catch (err) {
        setMessages([]);
      }
    };
    fetchMessages();
  }, []);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message to backend
  const handleSend = async () => {
    if (input.trim() === '') return;
    const fromUserId = userType === 'parent' ? DEMO_PARENT_ID : DEMO_TEACHER_ID;
    const toUserId = userType === 'parent' ? DEMO_TEACHER_ID : DEMO_PARENT_ID;
    try {
      await axios.post('/chat', {
        fromUserId,
        toUserId,
        classId: DEMO_CLASS_ID,
        messageContent: input
      });
      // Refresh messages
      const res = await axios.get(`/chat/${DEMO_CLASS_ID}/${DEMO_PARENT_ID}/${DEMO_TEACHER_ID}`);
      setMessages(res.data);
      setInput('');
    } catch (err) {
      // handle error
    }
  };

  // Edit message
  const handleEdit = (id, text) => {
    setEditId(id);
    setEditText(text);
  };

  const handleEditSave = async (id) => {
    try {
      await axios.put(`/chat/${id}`, { messageContent: editText });
      const res = await axios.get(`/chat/${DEMO_CLASS_ID}/${DEMO_PARENT_ID}/${DEMO_TEACHER_ID}`);
      setMessages(res.data);
      setEditId(null);
      setEditText('');
    } catch (err) {
      // handle error
    }
  };

  // Delete message
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/chat/${id}`);
      const res = await axios.get(`/chat/${DEMO_CLASS_ID}/${DEMO_PARENT_ID}/${DEMO_TEACHER_ID}`);
      setMessages(res.data);
    } catch (err) {
      // handle error
    }
  };

  return (
    <div className="container">
      <div className="section-title">
        <h2>Direct Messages</h2>
        <p>Chat securely between teachers and parents</p>
      </div>
      <div className="dm-container">
    <div className="dm-chat" ref={chatRef}>
          {(() => {
            let lastDate = null;
            return messages.map((m, i) => {
              const msgDate = new Date(m.sentAt || m.createdAt).toDateString();
              const showDate = lastDate !== msgDate;
              lastDate = msgDate;
              return (
                <React.Fragment key={m._id}>
                  {showDate && (
                    <div className="dm-date-separator">{formatDate(m.sentAt || m.createdAt)}</div>
                  )}
                  <div
                    className={`dm-message-bubble ${getMessageSide(m.fromUserId)}`}
                    style={{ alignSelf: getMessageSide(m.fromUserId) === 'right' ? 'flex-end' : 'flex-start' }}
                  >
                    <div className="dm-message-meta" style={{ position: 'relative', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '6px' }}>
                      <span className="dm-sender">
                        {getMessageSide(m.fromUserId) === 'right'
                          ? 'You'
                          : (userType === 'parent' ? 'Teacher' : 'Parent')}
                      </span>
                      {((userType === 'parent' && m.fromUserId === DEMO_PARENT_ID) || (userType === 'teacher' && m.fromUserId === DEMO_TEACHER_ID)) && (
                        <button
                          className="dm-more-btn"
                          style={{ background: 'none', border: 'none', color: '#1976d2', fontSize: '1em', cursor: 'pointer', padding: 0, display: 'none', verticalAlign: 'middle' }}
                          onClick={() => setShowActionsId(showActionsId === m._id ? null : m._id)}
                          aria-label="Show actions"
                        >&#709;</button>
                      )}
                    </div>
                    {editId === m._id ? (
                      <>
                        <input value={editText} onChange={e => setEditText(e.target.value)} />
                        <button className="btn-primary" onClick={() => handleEditSave(m._id)}>Save</button>
                        <button className="btn-primary" onClick={() => setEditId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <span className="dm-text">{m.messageContent}</span>
                        <span className="dm-time" style={{ display: 'block', marginTop: 2, textAlign: 'right', color: '#888', fontSize: '0.95em' }}>{formatTime(m.sentAt || m.createdAt)}</span>
                        {((userType === 'parent' && m.fromUserId === DEMO_PARENT_ID) || (userType === 'teacher' && m.fromUserId === DEMO_TEACHER_ID)) && showActionsId === m._id && (
                          <div
                            className="dm-actions-hover"
                            style={{ width: '100%', display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: '8px', marginTop: 8 }}
                          >
                            {canEditMessage(m) && <button className="btn-primary dm-edit" onClick={() => { setEditId(m._id); setEditText(m.messageContent); setShowActionsId(null); }}>Edit</button>}
                            {canDeleteMessage(m) && <button className="btn-primary dm-delete" onClick={() => { handleDelete(m._id); setShowActionsId(null); }}>Delete</button>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </React.Fragment>
              );
            });
          })()}
        </div>
        <div className="dm-input-row">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message..."
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          />
          <button className="btn-primary" onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default DirectMessages;
