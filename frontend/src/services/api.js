const API_BASE_URL = 'http://localhost:5000/api';

// Student API functions
export const studentAPI = {
  // Get all students
  getAllStudents: async () => {
    const response = await fetch(`${API_BASE_URL}/students`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  },

  // Get student by ID
  getStudentById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  },

  // Add new student
  addStudent: async (studentData) => {
    const response = await fetch(`${API_BASE_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Update student
  updateStudent: async (id, studentData) => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Delete student
  deleteStudent: async (id) => {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },
};

// Shuttle API functions
export const shuttleAPI = {
  // Get all shuttles
  getAllShuttles: async () => {
    const response = await fetch(`${API_BASE_URL}/shuttles`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  },

  // Get shuttle by ID
  getShuttleById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/shuttles/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  },

  // Add new shuttle
  addShuttle: async (shuttleData) => {
    const response = await fetch(`${API_BASE_URL}/shuttles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shuttleData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Update shuttle
  updateShuttle: async (id, shuttleData) => {
    const response = await fetch(`${API_BASE_URL}/shuttles/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shuttleData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },

  // Delete shuttle
  deleteShuttle: async (id) => {
    const response = await fetch(`${API_BASE_URL}/shuttles/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  },
};
