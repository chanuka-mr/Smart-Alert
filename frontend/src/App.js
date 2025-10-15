// src/App.js
import './App.css';
import './theme.css';
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/Home/Home";
import Login from "./components/Login/Login";
import Profile from "./components/Profile/Profile";
import OtpVerification from "./components/OtpVerification/OtpVerification";
import ResetPassword from "./components/ResetPassword/ResetPassword";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
import ResetPasswordViaEmail from "./components/ResetPasswordViaEmail/ResetPasswordViaEmail";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import CreateNoticeAdmin from './components/CreateNotices/Admin/CreateNoticeAdmin';
import CreateNoticeTeacher from './components/CreateNotices/Teachers/CreateNoticeTeacher';
import DirectMessages from './components/DirectMessages/DirectMessages';
import DisplayNotices from './components/DisplayNotices/DisplayNotices';
import UpdateNoticeAdmin from './components/UpdateNotices/Admin/UpdateNoticeAdmin';
import UpdateNoticeTeacher from './components/UpdateNotices/Teachers/UpdateNoticeTeacher';
import TimeTableHallArrangement from './components/TimeTableHallArrangement/TimeTableHallArrangement';
import ReportCard from './components/ReportCard/ReportCard';
import ReportCardView from './components/ReportCardView/ReportCardView';
import ProgressAnalysis from './components/ProgressAnalysis/ProgressAnalysis';
import ReportData from './components/ReportData/ReportData';
import TimeTableDataEntry from './components/TimeTableHallArrangementData/TimeTableDataEntry';
<<<<<<< Updated upstream
<<<<<<< Updated upstream
import Examination from './components/Examination/Examination';
import ExamOnly from './components/Examination/ExamOnly';
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
import ShuttleServices from './components/ShuttleServices/ShuttleServices';
import Students from './components/AttendanceManagement/Students';
import Attendance from './components/AttendanceManagement/Attendance';
import AttendanceRecords from './components/AttendanceManagement/AttendanceRecords';
import { api } from "./utils/api";

// ✅ Enhanced guard: checks token in localStorage and validates it
function RequireAuth({ children }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [authChecked, setAuthChecked] = React.useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      // First check: Is there a token?
      const token = localStorage.getItem("token");
      
      if (!token) {
        // No token is normal for logged-out users - not an error
        setIsAuthenticated(false);
        setIsLoading(false);
        setAuthChecked(true);
        return;
      }

      try {
        // Second check: Is the token valid with backend?
        const response = await api('/auth/me', { method: 'GET' });
        
        if (response && response.user) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        }
      } catch (error) {
        // Token is invalid or backend is unreachable
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();
  }, []);

  // Show loading while checking authentication
  if (isLoading || !authChecked) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#00897b',
        flexDirection: 'column'
      }}>
        <div>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
          Verifying authentication...
        </div>
      </div>
    );
  }

  // If not authenticated, show access denied message and redirect
  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#d32f2f',
        flexDirection: 'column',
        textAlign: 'center'
      }}>
        <div>
          <i className="fas fa-lock" style={{ marginRight: '10px', fontSize: '24px' }}></i>
          <div style={{ marginTop: '10px' }}>Access Denied</div>
          <div style={{ fontSize: '14px', marginTop: '5px', color: '#666' }}>
            Please log in to access this page
          </div>
        </div>
        <Navigate to="/login" replace />
      </div>
    );
  }

  // If authenticated, render the protected component
  console.log('✅ Access granted');
  return children;
}

// Guard for OTP stage: checks if otpPending flag exists
function RequireOtp({ children }) {
  const otpPending = typeof window !== "undefined" ? localStorage.getItem("otpPending") : null;
  return otpPending ? children : <Navigate to="/login" replace />;
}

export default function App() {
  // Global authentication state
  const [globalAuth, setGlobalAuth] = React.useState({
    isChecking: true,
    isAuthenticated: false
  });

  // Check authentication on app load
  React.useEffect(() => {
    const checkGlobalAuth = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setGlobalAuth({ isChecking: false, isAuthenticated: false });
        return;
      }

      try {
        const response = await api('/auth/me', { method: 'GET' });
        if (response && response.user) {
          setGlobalAuth({ isChecking: false, isAuthenticated: true });
        } else {
          localStorage.removeItem("token");
          setGlobalAuth({ isChecking: false, isAuthenticated: false });
        }
      } catch (error) {
        localStorage.removeItem("token");
        setGlobalAuth({ isChecking: false, isAuthenticated: false });
      }
    };

    checkGlobalAuth();
  }, []);

  // Show loading screen while checking global auth
  if (globalAuth.isChecking) {
  return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#00897b',
        flexDirection: 'column'
      }}>
        <div>
          <i className="fas fa-spinner fa-spin" style={{ marginRight: '10px' }}></i>
          Initializing Smart Alert...
        </div>
    </div>
  );
}

  return (
    <BrowserRouter>
      <Routes>
        {/* Home Page (only if logged in) */}
        <Route
          path="/"
          element={
            <RequireAuth>
              <Home />
            </RequireAuth>
          }
        />
        
        
        {/* Login Page */}
        <Route path="/login" element={<Login />} />

        {/* Forgot Password Page */}
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Reset Password via Email Page */}
        <Route path="/reset-password" element={<ResetPasswordViaEmail />} />

        {/* OTP Verification Page (only if otpPending is true) */}
        <Route
          path="/verify-otp"
          element={
            <RequireOtp>
              <OtpVerification />
            </RequireOtp>
          }
        />

        {/* Profile Page (only if logged in) */}
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        {/* Profile Page with User ID (for admin viewing other users) */}
        <Route
          path="/profile/:userId"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        {/* Change Password Page (only if logged in) */}
        <Route
          path="/change-password"
          element={
            <RequireAuth>
              <ResetPassword />
            </RequireAuth>
          }
        />

        {/* Admin Dashboard Page (only if logged in) */}
        <Route
          path="/admin-dashboard"
          element={
            <RequireAuth>
              <AdminDashboard />
            </RequireAuth>
          }
        />

        {/* Notice Management Routes */}
        <Route path="/admin-create-notice" element={<CreateNoticeAdmin />} />
        <Route path="/teacher-create-notice" element={<CreateNoticeTeacher />} />
        <Route path="/direct-message-teacher" element={<DirectMessages userType="teacher" />} />
        <Route path="/direct-message-parent" element={<DirectMessages userType="parent" />} />
        <Route path="/display-notices" element={<DisplayNotices />} />
        <Route path="/update-admin-notices" element={<UpdateNoticeAdmin />} />
        <Route path="/update-teacher-notices" element={<UpdateNoticeTeacher />} />

        {/* Examination Management Routes */}
        <Route 
          path="/examination" 
          element={
            <RequireAuth>
              <Examination />
            </RequireAuth>
          } 
        />
        <Route 
          path="/exams"
          element={
            <RequireAuth>
              <ExamOnly />
            </RequireAuth>
          }
        />
        <Route 
          path="/timetable" 
          element={
            <RequireAuth>
              <TimeTableHallArrangement />
            </RequireAuth>
          } 
        />
        <Route 
          path="/report-card" 
          element={
            <RequireAuth>
              <ReportCard />
            </RequireAuth>
          } 
        />
        <Route 
          path="/report-card/:studentId" 
          element={
            <RequireAuth>
              <ReportCardView />
            </RequireAuth>
          } 
        />
        <Route 
          path="/progress-analysis" 
          element={
            <RequireAuth>
              <ProgressAnalysis />
            </RequireAuth>
          } 
        />
        <Route 
          path="/report-data" 
          element={
            <RequireAuth>
              <ReportData />
            </RequireAuth>
          } 
        />
        <Route 
          path="/timetable-data-entry" 
          element={
            <RequireAuth>
              <TimeTableDataEntry />
            </RequireAuth>
          } 
        />

        {/* Shuttle Services Management Routes */}
        <Route 
          path="/shuttle-services" 
          element={
            <RequireAuth>
              <ShuttleServices />
            </RequireAuth>
          } 
        />

        {/* Attendance Management Routes */}
        <Route 
          path="/students" 
          element={
            <RequireAuth>
              <Students />
            </RequireAuth>
          } 
        />
        <Route 
          path="/attendance" 
          element={
            <RequireAuth>
              <Attendance />
            </RequireAuth>
          } 
        />
        <Route 
          path="/records" 
          element={
            <RequireAuth>
              <AttendanceRecords />
            </RequireAuth>
          } 
        />

        {/* Default → Redirect to home (will redirect to login if not authenticated) */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
