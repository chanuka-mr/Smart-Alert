// src/Components/Profile/Profile.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import "./Profile.css";
import { api } from "../../utils/api";

export default function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const location = useLocation();
  const [user, setUser] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [viewingUser, setViewingUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [academicInfo, setAcademicInfo] = useState(null);
  const [parentInfo, setParentInfo] = useState(null);
  const [info, setInfo] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAcademicModal, setShowAcademicModal] = useState(false);
  const [showParentModal, setShowParentModal] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [academicForm, setAcademicForm] = useState({});
  const [parentForm, setParentForm] = useState({});
  const [errors, setErrors] = useState({});
  
  // Get the 'from' parameter to know which tab to return to
  const searchParams = new URLSearchParams(location.search);
  const fromTab = searchParams.get('from') || 'dashboard';

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setInfo("Loading...");
      try {
        // Always get current user first
        const me = await api("/auth/me");
        if (cancelled) return;
        const currentUserData = me?.user || me;
        setCurrentUser(currentUserData);

        if (userId) {
          // If viewing another user's profile, get their data
          const usersResponse = await api("/users");
          const users = usersResponse.users || [];
          const targetUser = users.find(u => u._id === userId);
          
          if (targetUser) {
            setViewingUser(targetUser);
            setUser(targetUser);
            
            // Load academic information for this user
            try {
              const academicResponse = await api(`/academic/${targetUser.userID}`);
              if (academicResponse.academicRecord) {
                setAcademicInfo(academicResponse.academicRecord);
              }
            } catch (e) {
              console.log("No academic record found for user");
            }

            // Load parent details for this user
            if (targetUser.role === 'Parent') {
              try {
                const parentResponse = await api(`/parents/${targetUser.userID}`);
                if (parentResponse.parentDetails) {
                  setParentInfo(parentResponse.parentDetails);
                }
              } catch (e) {
                console.log("No parent details found for user");
              }
            }
          } else {
            setInfo("User not found");
          }
        } else {
          // Viewing own profile - get verification status from current user data
          const userWithVerification = {
            ...currentUserData,
            isEmailVerified: currentUserData.isVerified || false
          };
          setUser(userWithVerification);
          
          // Load academic information for current user
          try {
            const academicResponse = await api(`/academic/${currentUserData.userID}`);
            if (academicResponse.academicRecord) {
              setAcademicInfo(academicResponse.academicRecord);
            }
          } catch (e) {
            console.log("No academic record found for current user");
          }

          // Load parent details for current user
          if (currentUserData.role === 'Parent') {
            try {
              const parentResponse = await api(`/parents/${currentUserData.userID}`);
              if (parentResponse.parentDetails) {
                setParentInfo(parentResponse.parentDetails);
              }
            } catch (e) {
              console.log("No parent details found for current user");
            }
          }
        }
        
        setInfo("");
      } catch (e) {
        if (!cancelled) setInfo(e.message || "Failed to load profile");
      }
    }

    load();
    return () => { cancelled = true; };
  }, [userId]);

  // Formatting helpers
  const age = useMemo(() => {
    if (!user?.birthday) return null;
    const bday = new Date(user.birthday);
    const today = new Date();
    let years = today.getFullYear() - bday.getFullYear();
    const m = today.getMonth() - bday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) years--;
    return years;
  }, [user]);

  const fmt = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "";

  const logout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("lastUserID");
    } catch {}
    window.location.assign("/login");
  };

  // Form handling functions
  const openEditModal = () => {
    setEditForm({
      fullName: user.fullName || '',
      birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
      address: user.address || '',
      email: user.email || ''
    });
    setShowEditModal(true);
    setErrors({});
  };

  const openAcademicModal = () => {
    setAcademicForm({
      grade: academicInfo?.grade || '',
      class: academicInfo?.class || ''
    });
    setShowAcademicModal(true);
    setErrors({});
  };

  const openParentModal = () => {
    setParentForm({
      parentName: parentInfo?.parentName || '',
      contactNumber: parentInfo?.contactNumber || '',
      whatsappNumber: parentInfo?.whatsappNumber || ''
    });
    setShowParentModal(true);
    setErrors({});
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      const targetUserId = userId || user.userID;
      await api(`/users/${targetUserId}`, {
        method: 'PUT',
        body: editForm
      });

      // Update local user state
      setUser({ ...user, ...editForm });
      setShowEditModal(false);
      setInfo("Profile updated successfully");
      setTimeout(() => setInfo(""), 3000);
    } catch (error) {
      setErrors({ general: error.message });
    }
  };

  const handleAcademicSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      const targetUserId = userId || user.userID;
      
      // Try to create new academic record first
      try {
        await api('/academic/assign', {
          method: 'POST',
          body: {
            userID: targetUserId,
            grade: academicForm.grade,
            class: academicForm.class
          }
        });
      } catch (createError) {
        // If creation fails, try to update existing record
        await api(`/academic/${targetUserId}`, {
          method: 'PUT',
          body: {
            grade: academicForm.grade,
            class: academicForm.class
          }
        });
      }

      // Update local academic state
      setAcademicInfo({ ...academicInfo, ...academicForm });
      setShowAcademicModal(false);
      setInfo("Academic information updated successfully");
      setTimeout(() => setInfo(""), 3000);
    } catch (error) {
      setErrors({ general: error.message });
    }
  };

  const handleParentSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    try {
      const targetUserId = userId || user.userID;
      
      // Try to create new parent details first
      try {
        await api('/parents', {
          method: 'POST',
          body: {
            userID: targetUserId,
            ...parentForm
          }
        });
      } catch (createError) {
        // If creation fails, try to update existing record
        await api(`/parents/${targetUserId}`, {
          method: 'PUT',
          body: parentForm
        });
      }

      // Update local parent state
      setParentInfo({ ...parentInfo, ...parentForm });
      setShowParentModal(false);
      setInfo("Parent details updated successfully");
      setTimeout(() => setInfo(""), 3000);
    } catch (error) {
      setErrors({ general: error.message });
    }
  };

  // While loading or if user missing, show placeholders
  const data = user || {
    userID: "—",
    fullName: "—",
    birthday: "",
    address: "—",
    email: "—",
    role: "User",
    isVerified: false,
    createdAt: "",
  };

  return (
    <div className="profile-page">
      <div className="container">
        <header className="header">
          <h1>Smart Alert</h1>
          <p>User Profile Management</p>
        </header>

        <section className="profile-section">
          <h2 className="section-title">Personal Information</h2>

          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">User ID</div>
              <div className="info-value">{data.userID || data.id || "-"}</div>
            </div>

            <div className="info-item">
              <div className="info-label">Full Name</div>
              <div className="info-value">{data.fullName || data.name || "-"}</div>
            </div>

            <div className="info-item">
              <div className="info-label">Birthday</div>
              <div className="info-value">{fmt(data.birthday) || "-"}</div>
            </div>

            <div className="info-item">
              <div className="info-label">Age</div>
              <div className="info-value">{age != null ? `${age} years` : "-"}</div>
            </div>

            <div className="info-item">
              <div className="info-label">Address</div>
              <div className="info-value">{data.address || "-"}</div>
            </div>

            <div className="info-item">
              <div className="info-label">Role</div>
              <div className="info-value">
                <span className="role-badge">{data.role || "User"}</span>
              </div>
            </div>
          </div>
        </section>

        <section className="profile-section">
          <h2 className="section-title">Account Information</h2>

          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Email Address</div>
              <div className="info-value">{data.email || "-"}</div>
            </div>

            <div className="info-item">
              <div className="info-label">Account Status</div>
              <div className="info-value">
                <span className={`status-badge ${data.isEmailVerified ? "verified" : "not-verified"}`}>
                  {data.isEmailVerified ? "Verified" : "Not Verified"}
                </span>
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">Member Since</div>
              <div className="info-value">{fmt(data.createdAt) || "-"}</div>
            </div>
          </div>
        </section>

        {/* Academic Information Section */}
        {(data.role === 'Parent' || data.role === 'Teacher') && (
          <section className="profile-section">
            <h2 className="section-title">
              Academic Information
              {currentUser?.role === 'Admin' && (
                <button 
                  className="edit-button-small" 
                  onClick={openAcademicModal}
                  title="Edit Academic Information"
                >
                  <i className="fa-solid fa-pen-to-square" />
                </button>
              )}
            </h2>

            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Grade</div>
                <div className="info-value">
                  {academicInfo?.grade ? `Grade ${academicInfo.grade}` : "Not Assigned"}
                </div>
              </div>

              <div className="info-item">
                <div className="info-label">Class</div>
                <div className="info-value">
                  {academicInfo?.class || "Not Assigned"}
                </div>
              </div>

              {academicInfo?.assignedAt && (
                <div className="info-item">
                  <div className="info-label">Assigned On</div>
                  <div className="info-value">{fmt(academicInfo.assignedAt)}</div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Parent Details Section */}
        {data.role === 'Parent' && (
          <section className="profile-section">
            <h2 className="section-title">
              Parent Details
              {currentUser?.role === 'Admin' && (
                <button 
                  className="edit-button-small" 
                  onClick={openParentModal}
                  title="Edit Parent Details"
                >
                  <i className="fa-solid fa-pen-to-square" />
                </button>
              )}
            </h2>

            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Parent Name</div>
                <div className="info-value">{parentInfo?.parentName || "Not Provided"}</div>
              </div>

              <div className="info-item">
                <div className="info-label">Contact Number</div>
                <div className="info-value">{parentInfo?.contactNumber || "Not Provided"}</div>
              </div>

              <div className="info-item">
                <div className="info-label">WhatsApp Number</div>
                <div className="info-value">{parentInfo?.whatsappNumber || "Not Provided"}</div>
              </div>
            </div>
          </section>
        )}

        <div className="action-buttons">
          {/* Show different buttons based on whether viewing own profile or another user's */}
          {!userId ? (
            // Own profile - show normal buttons
            <>
              <button className="action-button edit-button" onClick={openEditModal}>
                <i className="fa-solid fa-pen-to-square" /> Edit Profile
              </button>
              <button className="action-button change-password" onClick={() => navigate('/change-password')}>
                <i className="fa-solid fa-key" /> Change Password
              </button>
              <button className="action-button logout-button" onClick={logout}>
                <i className="fa-solid fa-right-from-bracket" /> Logout
              </button>
            </>
          ) : (
            // Viewing another user's profile - show limited buttons
            <>
              <button className="action-button back-button" onClick={() => navigate(`/admin-dashboard?tab=${fromTab}`)}>
                <i className="fa-solid fa-arrow-left" /> Back to {fromTab === 'students' ? 'Students' : fromTab === 'teachers' ? 'Teachers' : fromTab === 'shuttle-staff' ? 'Shuttle Staff' : fromTab === 'admins' ? 'Admins' : 'Dashboard'}
              </button>
              {/* Only show edit button if current user is admin */}
              {currentUser?.role && currentUser.role.toLowerCase() === "admin" && (
                <button className="action-button edit-button" onClick={openEditModal}>
                  <i className="fa-solid fa-pen-to-square" /> Edit User
                </button>
              )}
            </>
          )}
        </div>

        <div className="system-info">
          <p>{info || "Smart Alert System v4.1 • Secure User Management"}</p>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Profile</h2>
              <button 
                className="close-modal" 
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="form-group">
                <label htmlFor="editFullName">Full Name</label>
                <input
                  type="text"
                  id="editFullName"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editBirthday">Birthday</label>
                <input
                  type="date"
                  id="editBirthday"
                  value={editForm.birthday}
                  onChange={(e) => setEditForm({ ...editForm, birthday: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="editAddress">Address</label>
                <textarea
                  id="editAddress"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  required
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="editEmail">Email</label>
                <input
                  type="email"
                  id="editEmail"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                />
              </div>

              {errors.general && (
                <div className="error-message">{errors.general}</div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="modal-btn btn-cancel"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn btn-submit"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Academic Information Modal */}
      {showAcademicModal && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Academic Information</h2>
              <button 
                className="close-modal" 
                onClick={() => setShowAcademicModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleAcademicSubmit}>
              <div className="form-group">
                <label htmlFor="academicGrade">Grade</label>
                <select
                  id="academicGrade"
                  value={academicForm.grade}
                  onChange={(e) => setAcademicForm({ ...academicForm, grade: e.target.value })}
                  required
                >
                  <option value="">Select Grade</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(grade => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="academicClass">Class</label>
                <select
                  id="academicClass"
                  value={academicForm.class}
                  onChange={(e) => setAcademicForm({ ...academicForm, class: e.target.value })}
                  required
                >
                  <option value="">Select Class</option>
                  <option value="A">Class A</option>
                  <option value="B">Class B</option>
                  <option value="C">Class C</option>
                </select>
              </div>

              {errors.general && (
                <div className="error-message">{errors.general}</div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="modal-btn btn-cancel"
                  onClick={() => setShowAcademicModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn btn-submit"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Parent Details Modal */}
      {showParentModal && (
        <div className="modal" style={{ display: 'flex' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Edit Parent Details</h2>
              <button 
                className="close-modal" 
                onClick={() => setShowParentModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleParentSubmit}>
              <div className="form-group">
                <label htmlFor="parentName">Parent Name</label>
                <input
                  type="text"
                  id="parentName"
                  value={parentForm.parentName}
                  onChange={(e) => setParentForm({ ...parentForm, parentName: e.target.value })}
                  placeholder="Enter parent name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="contactNumber">Contact Number</label>
                <input
                  type="tel"
                  id="contactNumber"
                  value={parentForm.contactNumber}
                  onChange={(e) => setParentForm({ ...parentForm, contactNumber: e.target.value })}
                  placeholder="Enter contact number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="whatsappNumber">WhatsApp Number</label>
                <input
                  type="tel"
                  id="whatsappNumber"
                  value={parentForm.whatsappNumber}
                  onChange={(e) => setParentForm({ ...parentForm, whatsappNumber: e.target.value })}
                  placeholder="Enter WhatsApp number"
                />
              </div>

              {errors.general && (
                <div className="error-message">{errors.general}</div>
              )}

              <div className="form-actions">
                <button 
                  type="button" 
                  className="modal-btn btn-cancel"
                  onClick={() => setShowParentModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn btn-submit"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
