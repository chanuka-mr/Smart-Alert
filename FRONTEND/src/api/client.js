import axios from "axios";

const baseURL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5002";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" }
});

// Students
export const getStudents = () => api.get("/students");
export const addStudent = (payload) => api.post("/students", payload);
export const updateStudent = (id, payload) => api.put(`/students/${id}`, payload);
export const deleteStudent = (idOrIndex) => api.delete(`/students/${idOrIndex}`);

// Attendance
export const getAllAttendance = () => api.get("/attendance");
export const markAttendance = (payload) => api.post("/attendance", payload);
export const updateAttendance = (id, payload) => api.put(`/attendance/${id}`, payload);
export const deleteAttendance = (id) => api.delete(`/attendance/${id}`);
export const getAttendanceByStudent = (idOrIndex) => api.get(`/attendance/${idOrIndex}`);

// Notify parents for Absent/Late (WhatsApp)
export const notifyParentsForAbsents = (items) => api.post("/attendance/notify-parents", { items });
