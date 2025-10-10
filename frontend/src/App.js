import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Students from "./pages/Students";
import Attendance from "./pages/Attendance";
import AttendanceRecords from "./pages/AttendanceRecords";
import './index.css';

const App = () => {
  return (
    <div className="fade-in">
      <Routes>
        <Route path="/" element={<Students />} />
        <Route path="/students" element={<Students />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/records" element={<AttendanceRecords />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
