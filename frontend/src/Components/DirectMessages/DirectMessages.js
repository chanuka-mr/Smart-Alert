import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { api } from '../../utils/api';
import './DirectMessages.css';

const DirectMessages = ({ userType }) => {
  const [parents, setParents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [showActionsId, setShowActionsId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const chatRef = useRef(null);

  // Fetch current user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await api('/auth/me');
        console.log('User data received:', userData);
        console.log('User data keys:', Object.keys(userData));
        
        // Extract user from different possible response formats
        let user = userData?.user || userData?.data?.user || userData;
        console.log('Extracted user:', user);
        console.log('User keys:', Object.keys(user || {}));
        
        // Handle different ID field names
        if (user && !user._id) {
          // Try to find ID in different field names
          if (user.id) {
            user._id = user.id;
          } else if (user.userID) {
            user._id = user.userID;
          } else if (user.userId) {
            user._id = user.userId;
          } else if (user.ID) {
            user._id = user.ID;
          }
          console.log('User after ID mapping:', user);
        }
        
        if (user && user._id) {
          setCurrentUser(user);
          console.log('Current user set successfully:', user);
        } else {
          console.error('User data missing _id field. Full user object:', JSON.stringify(user, null, 2));
        }
      } catch (err) {
        console.error('Failed to load user:', err);
      }
    };
    fetchUser();
  }, []);

  // Fetch list of parents (for teacher view) or teachers (for parent view)
  useEffect(() => {
    if (userType === 'teacher' && currentUser) {
      const fetchParents = async () => {
        console.log('Fetching parents for teacher. Current user:', currentUser);
        setLoading(false);
        
        try {
          // Step 1: Get teacher's academic info (grade and class)
          const teacherAcademicRes = await api(`/academic/${currentUser.userID}`);
          console.log('Teacher academic response:', teacherAcademicRes);
          
          const teacherAcademic = teacherAcademicRes?.academicRecord || teacherAcademicRes;
          console.log('Teacher academic info:', teacherAcademic);
          
          if (!teacherAcademic || !teacherAcademic.grade || !teacherAcademic.class) {
            console.log('Teacher has no academic assignment');
            setParents([]);
            return;
          }
          
          const teacherGrade = teacherAcademic.grade;
          const teacherClass = teacherAcademic.class;
          console.log(`Teacher is assigned to Grade ${teacherGrade}${teacherClass}`);
          
          // Step 2: Get all parents
          const parentsRes = await api('/users/role/parent');
          const allParents = parentsRes?.users || parentsRes || [];
          console.log('All parents:', allParents);
          
          if (allParents.length === 0) {
            console.log('No parents found in system');
            setParents([]);
            return;
          }
          
          // Step 3: Get academic info for all parents
          const parentsWithAcademic = await Promise.all(
            allParents.map(async (parent) => {
              try {
                const academicRes = await api(`/academic/${parent.userID}`);
                const academicInfo = academicRes?.academicRecord || academicRes;
                
                if (!academicInfo || !academicInfo.grade || !academicInfo.class) {
                  console.log(`No valid academic info for parent ${parent.userID}`);
                  return null;
                }
                
                return {
                  ...parent,
                  _id: parent.userID, // Use userID as _id for consistency
                  firstName: parent.fullName?.split(' ')[0] || parent.fullName,
                  lastName: parent.fullName?.split(' ').slice(1).join(' ') || '',
                  grade: academicInfo.grade,
                  class: academicInfo.class
                };
              } catch (err) {
                console.log(`Error fetching academic info for parent ${parent.userID}:`, err);
                return null;
              }
            })
          );
          
          // Filter out null values (parents without academic info)
          const validParents = parentsWithAcademic.filter(p => p !== null);
          console.log('Parents with academic info:', validParents);
          
          // Step 4: Filter parents by matching grade and class
          const matchingParents = validParents.filter(p => {
            const matches = p.grade === teacherGrade && p.class === teacherClass;
            console.log(`Parent ${p.userID} (Grade ${p.grade}${p.class}): ${matches ? 'MATCH' : 'no match'}`);
            return matches;
          });
          
          console.log('Matching parents:', matchingParents);
          setParents(matchingParents);
          
        } catch (err) {
          console.error('Failed to load parents:', err);
          setParents([]);
        }
      };
      fetchParents();
    } else if (userType === 'parent' && currentUser) {
      // For parents, fetch their child's class teacher based on Academic table
      const fetchTeachers = async () => {
        console.log('Fetching teachers for parent. Current user:', currentUser);
        setLoading(false);
        
        try {
          // Step 1: Get parent's academic info (grade and class)
          const parentAcademicRes = await api(`/academic/${currentUser.userID}`);
          console.log('Parent academic response:', parentAcademicRes);
          
          const parentAcademic = parentAcademicRes?.academicRecord || parentAcademicRes;
          console.log('Parent academic info:', parentAcademic);
          
          if (!parentAcademic || !parentAcademic.grade || !parentAcademic.class) {
            console.log('Parent has no academic assignment');
            setTeachers([]);
            return;
          }
          
          const parentGrade = parentAcademic.grade;
          const parentClass = parentAcademic.class;
          console.log(`Parent is in Grade ${parentGrade}${parentClass}`);
          
          // Step 2: Get all teachers
          const teachersRes = await api(`/users/role/teacher`);
          const allTeachers = teachersRes?.users || teachersRes || [];
          console.log('All teachers:', allTeachers);
          
          if (allTeachers.length === 0) {
            console.log('No teachers found in system');
            setTeachers([]);
            return;
          }
          
          // Step 3: Get academic info for all teachers
          const teachersWithAcademic = await Promise.all(
            allTeachers.map(async (teacher) => {
              try {
                const academicRes = await api(`/academic/${teacher.userID}`);
                const academicInfo = academicRes?.academicRecord || academicRes;
                
                if (!academicInfo || !academicInfo.grade || !academicInfo.class) {
                  console.log(`No valid academic info for teacher ${teacher.userID}`);
                  return null;
                }
                
                return {
                  ...teacher,
                  _id: teacher.userID, // Use userID as _id for consistency
                  firstName: teacher.fullName?.split(' ')[0] || teacher.fullName,
                  lastName: teacher.fullName?.split(' ').slice(1).join(' ') || '',
                  grade: academicInfo.grade,
                  class: academicInfo.class
                };
              } catch (err) {
                console.log(`Error fetching academic info for teacher ${teacher.userID}:`, err);
                return null; // Don't include teachers without academic info
              }
            })
          );
          
          // Filter out null values (teachers without academic info)
          const validTeachers = teachersWithAcademic.filter(t => t !== null);
          console.log('Teachers with academic info:', validTeachers);
          
          // Step 4: Filter teachers by matching grade and class
          const matchingTeachers = validTeachers.filter(t => {
            const matches = t.grade === parentGrade && t.class === parentClass;
            console.log(`Teacher ${t.userID} (Grade ${t.grade}${t.class}): ${matches ? 'MATCH' : 'no match'}`);
            return matches;
          });
          
          console.log('Matching teachers:', matchingTeachers);
          setTeachers(matchingTeachers);
          
        } catch (err) {
          console.error('Failed to load teachers:', err);
          setTeachers([]);
        }
      };
      fetchTeachers();
    } else if (currentUser) {
      setLoading(false);
    }
  }, [userType, currentUser]);

  // Helper to determine message side based on sender
  const getMessageSide = (senderId) => {
    if (!currentUser) return 'left';
    return senderId === currentUser._id ? 'right' : 'left';
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

  // Show hover actions/drop menu only within 2 hours of sending
  function canShowActionsMenu(msg) {
    const now = Date.now();
    const sent = new Date(msg.sentAt || msg.createdAt).getTime();
    return (now - sent) <= 2 * 60 * 60 * 1000; // 2 hours
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

  // Fetch messages when a contact is selected
  useEffect(() => {
    if (selectedContact && currentUser && currentUser._id) {
      const fetchMessages = async () => {
        try {
          console.log('Fetching messages between:', currentUser._id, 'and', selectedContact._id);
          // Use the simpler endpoint that works with fromUserId/toUserId
          const res = await axios.get(`/chat/${currentUser._id}/${selectedContact._id}`);
          console.log('Messages received:', res.data);
          setMessages(res.data.messages || res.data || []);
        } catch (err) {
          console.error('Failed to load messages:', err);
          setMessages([]);
        }
      };
      fetchMessages();
    }
  }, [selectedContact, currentUser]);

  // Scroll chat to bottom when messages change
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message to backend
  const handleSend = async () => {
    if (input.trim() === '') {
      alert('Please enter a message');
      return;
    }
    
    if (!currentUser || !currentUser._id) {
      alert('User not loaded. Please refresh the page.');
      console.error('currentUser not loaded:', currentUser);
      return;
    }
    
    if (!selectedContact || !selectedContact._id) {
      alert('No contact selected');
      return;
    }
    
    try {
      // Build classId from grade and class (e.g., "3B")
      const classId = selectedContact.grade && selectedContact.class 
        ? `${selectedContact.grade}${selectedContact.class}` 
        : 'default';
      
      console.log('Sending message:', {
        fromUserId: currentUser._id,
        toUserId: selectedContact._id,
        classId: classId,
        messageContent: input
      });
      
      const response = await axios.post('/chat', {
        fromUserId: currentUser._id,
        toUserId: selectedContact._id,
        classId: classId,
        messageContent: input
      });
      
      console.log('Message sent successfully:', response.data);
      
      // Refresh messages
      const res = await axios.get(`/chat/${currentUser._id}/${selectedContact._id}`);
      setMessages(res.data.messages || res.data || []);
      setInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
      console.error('Error details:', err.response?.data);
      alert(`Failed to send message: ${err.response?.data?.message || err.message}`);
    }
  };

  // Edit message
  const handleEditSave = async (id) => {
    if (!selectedContact || !currentUser) return;
    try {
      await axios.put(`/chat/${id}`, { messageContent: editText });
      const res = await axios.get(`/chat/${currentUser._id}/${selectedContact._id}`);
      setMessages(res.data.messages || res.data || []);
      setEditId(null);
      setEditText('');
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  // Delete message
  const handleDelete = async (id) => {
    if (!selectedContact || !currentUser) return;
    try {
      await axios.delete(`/chat/${id}`);
      const res = await axios.get(`/chat/${currentUser._id}/${selectedContact._id}`);
      setMessages(res.data.messages || res.data || []);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Filter contacts based on search query
  const contactList = userType === 'teacher' ? parents : teachers;
  console.log('Contact list:', contactList, 'userType:', userType, 'parents:', parents, 'teachers:', teachers);
  
  const filteredContacts = contactList.filter(contact => {
    const query = searchQuery.toLowerCase();
    const name = `${contact.firstName || ''} ${contact.lastName || ''}`.toLowerCase();
    const userId = (contact.userId || contact._id || '').toLowerCase();
    return name.includes(query) || userId.includes(query);
  });
  
  console.log('Filtered contacts:', filteredContacts);

  return (
    <div className="container">
      <div className="section-title">
        <h2>Direct Messages</h2>
        <p>Chat securely between teachers and parents</p>
      </div>
      <div className="dm-whatsapp-container">
        {/* Left sidebar - Contact list (Parents for teachers, Teachers for parents) */}
        <div className="dm-sidebar">
          <div className="dm-search-bar">
            <input
              type="text"
              placeholder="Search by name or user ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dm-search-input"
            />
          </div>
          <div className="dm-parent-list">
            {loading ? (
              <p className="dm-no-parents">Loading...</p>
            ) : filteredContacts.length === 0 ? (
              <p className="dm-no-parents">
                {userType === 'teacher' ? 'No parents found' : 'No teachers found'}
              </p>
            ) : (
              filteredContacts.map(contact => (
                <div
                  key={contact._id}
                  className={`dm-parent-item ${selectedContact?._id === contact._id ? 'active' : ''}`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="dm-parent-avatar">
                    {(contact.firstName?.[0] || (userType === 'teacher' ? 'P' : 'T')).toUpperCase()}
                  </div>
                  <div className="dm-parent-info">
                    <div className="dm-parent-name">
                      {contact.firstName || (userType === 'teacher' ? 'Parent' : 'Teacher')} {contact.lastName || ''}
                    </div>
                    <div className="dm-parent-id">ID: {contact.userID || contact.userId || contact._id}</div>
                    {(contact.grade && contact.class) && (
                      <div className="dm-parent-class">Grade {contact.grade}{contact.class}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right side - Chat area */}
        <div className="dm-chat-area">
          {!selectedContact ? (
            <div className="dm-no-chat-selected">
              <i className="fas fa-comments" style={{ fontSize: '4rem', color: '#ccc', marginBottom: '1rem' }}></i>
              <p>{userType === 'teacher' ? 'Select a parent to start chatting' : 'Select your class teacher to start chatting'}</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="dm-chat-header">
                <div className="dm-parent-avatar">
                  {(selectedContact.firstName?.[0] || (userType === 'teacher' ? 'P' : 'T')).toUpperCase()}
                </div>
                <div className="dm-header-info">
                  <div className="dm-header-name">
                    {selectedContact.firstName || (userType === 'teacher' ? 'Parent' : 'Teacher')} {selectedContact.lastName || ''}
                  </div>
                  <div className="dm-header-id">ID: {selectedContact.userID || selectedContact.userId || selectedContact._id}</div>
                  {(selectedContact.grade && selectedContact.class) && (
                    <div className="dm-header-class">Grade {selectedContact.grade}{selectedContact.class}</div>
                  )}
                </div>
              </div>

              {/* Chat messages */}
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
                        {getMessageSide(m.fromUserId) === 'right' ? 'You' : selectedContact?.firstName || (userType === 'teacher' ? 'Parent' : 'Teacher')}
                      </span>
                      {currentUser && m.fromUserId === currentUser._id && canShowActionsMenu(m) && (
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
                        {currentUser && m.fromUserId === currentUser._id && canShowActionsMenu(m) && showActionsId === m._id && (
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

              {/* Chat input */}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectMessages;
