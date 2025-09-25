// src/Components/Profile/Profile.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Profile.css";
import { api } from "../../utils/api";

export default function Profile() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [info, setInfo] = useState("");

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
          } else {
            setInfo("User not found");
          }
        } else {
          // Viewing own profile
          setUser(currentUserData);
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
                <span className={`status-badge ${data.isVerified ? "verified" : "not-verified"}`}>
                  {data.isVerified ? "Verified" : "Not Verified"}
                </span>
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">Member Since</div>
              <div className="info-value">{fmt(data.createdAt) || "-"}</div>
            </div>
          </div>
        </section>

        <div className="action-buttons">
          {/* Show different buttons based on whether viewing own profile or another user's */}
          {!userId ? (
            // Own profile - show normal buttons
            <>
              {/* Only show Edit Profile button for admin users */}
              {data.role && data.role.toLowerCase() === "admin" && (
                <button className="action-button edit-button" onClick={() => alert("Edit profile coming soon")}>
                  <i className="fa-solid fa-pen-to-square" /> Edit Profile
                </button>
              )}
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
              <button className="action-button back-button" onClick={() => navigate('/admin-dashboard')}>
                <i className="fa-solid fa-arrow-left" /> Back to Dashboard
              </button>
              {/* Only show edit button if current user is admin */}
              {currentUser?.role && currentUser.role.toLowerCase() === "admin" && (
                <button className="action-button edit-button" onClick={() => alert("Edit user coming soon")}>
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
    </div>
  );
}
