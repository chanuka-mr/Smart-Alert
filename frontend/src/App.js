<<<<<<< Updated upstream
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Students from "./pages/Students";
import Attendance from "./pages/Attendance";
import AttendanceRecords from "./pages/AttendanceRecords";
import './index.css';
=======


import React from "react";                   
import { Routes, Route, Navigate } from "react-router-dom";  
import Students from "./pages/Students";      
import Attendance from "./pages/Attendance"; 
import AttendanceRecords from "./pages/AttendanceRecords";  
import ParentView from "./pages/ParentView";  
import './index.css';                        

>>>>>>> Stashed changes

const App = () => {
  return (
    <div className="fade-in">
      
      <Routes>
        
        <Route path="/" element={<Students />} />
<<<<<<< Updated upstream
        <Route path="/students" element={<Students />} />
=======
        
        
>>>>>>> Stashed changes
        <Route path="/attendance" element={<Attendance />} />
        
        
        <Route path="/records" element={<AttendanceRecords />} />
<<<<<<< Updated upstream
=======
        
        
        <Route path="/parent" element={<ParentView />} />
        
        
>>>>>>> Stashed changes
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

// Export the App component as the default export
export default App;
