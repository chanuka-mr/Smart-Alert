

import axios from "axios";

const baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5002";


export const api = axios.create({
  baseURL,                                    
  headers: { "Content-Type": "application/json" } 
});

// Get all students from the database
export const getStudents = () => api.get("/students");

// Add a new student to the database
export const addStudent = (payload) => api.post("/students", payload);

// Update existing student's information
export const updateStudent = (id, payload) => api.put(`/students/${id}`, payload);

// Delete student from the database
export const deleteStudent = (idOrIndex) => api.delete(`/students/${idOrIndex}`);

// Get  attendance records from the database
export const getAllAttendance = () => api.get("/attendance");

// Mark attendance for a student
export const markAttendance = (payload) => api.post("/attendance", payload);

// Update an existing attendance record
export const updateAttendance = (id, payload) => api.put(`/attendance/${id}`, payload);

// Delete an attendance record
export const deleteAttendance = (id) => api.delete(`/attendance/${id}`);

// Get attendance records for a specific student
export const getAttendanceByStudent = (idOrIndex) => api.get(`/attendance/${idOrIndex}`);

// Send WhatsApp notifications to parents for absent/late students
export const notifyParentsForAbsents = (items) => api.post("/attendance/notify-parents", { items });

// Reports
export const generateAttendanceReport = (params) => api.get("/reports/attendance", { params, responseType: 'blob' });
export const generateMonthlyReport = (params) => api.get("/reports/monthly", { params, responseType: 'blob' });
export const generateStudentReport = (params) => api.get("/reports/student", { params, responseType: 'blob' });
export const getAvailableSections = () => api.get("/reports/sections");
