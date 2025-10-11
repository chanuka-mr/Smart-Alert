import axios from "axios";

const baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" }
});

// Students
export const getStudents = () => api.get("/api/students");
export const addStudent = (payload) => api.post("/api/students", payload);
export const updateStudent = (id, payload) => api.put(`/api/students/${id}`, payload);
export const deleteStudent = (idOrIndex) => api.delete(`/api/students/${idOrIndex}`);

// Attendance
export const getAllAttendance = () => api.get("/attendance");
export const markAttendance = (payload) => api.post("/attendance", payload);
export const updateAttendance = (id, payload) => api.put(`/attendance/${id}`, payload);
export const deleteAttendance = (id) => api.delete(`/attendance/${id}`);
export const getAttendanceByStudent = (idOrIndex) => api.get(`/attendance/${idOrIndex}`);

// Notify parents for Absent/Late (WhatsApp)
export const notifyParentsForAbsents = (items) => api.post("/attendance/notify-parents", { items });

// Reports
export const generateAttendanceReport = (params) => api.get("/reports/attendance", { params, responseType: 'blob' });
export const generateMonthlyReport = (params) => api.get("/reports/monthly", { params, responseType: 'blob' });
export const generateStudentReport = (params) => api.get("/reports/student", { params, responseType: 'blob' });
export const getAvailableSections = () => api.get("/reports/sections");
