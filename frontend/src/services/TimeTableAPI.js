// API service for TimeTable and Hall Arrangements
const API_BASE_URL = 'http://localhost:5001/timetable';

class TimeTableAPI {
  // Get all timetables
  static async getAllTimeTables() {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.timetables || [];
    } catch (error) {
      console.error('Error fetching timetables:', error);
      throw error;
    }
  }

  // Get timetables filtered by grade and class section
  static async getFilteredTimeTables(grade = '', classSection = '') {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (grade) params.append('grade', grade);
      if (classSection) params.append('class', classSection);
      const queryString = params.toString();
      const url = queryString ? `${API_BASE_URL}/filtered?${queryString}` : `${API_BASE_URL}/filtered`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.timetables || [];
    } catch (error) {
      console.error('Error filtering timetables:', error);
      throw error;
    }
  }

  // Get hall arrangements grouped by hall
  static async getHallArrangements(grade = '', classSection = '') {
    try {
      const timetables = await this.getAllTimeTables();
      
      // Filter by grade and class section if specified
      const filteredTimetables = timetables.filter(item => {
        if (grade && (item.grade || item.classLevel) !== grade) return false;
        if (classSection && (item.class || item.section) !== classSection) return false;
        return true;
      });

      // Group by hall and calculate capacity
      const hallMap = new Map();
      
      filteredTimetables.forEach(item => {
        const hallName = item.hall || 'Unassigned';
        if (!hallMap.has(hallName)) {
          hallMap.set(hallName, {
            hall: hallName,
            grade: item.grade || item.classLevel,
            sections: new Set(),
            capacity: 0,
            timetables: []
          });
        }
        
        const hallData = hallMap.get(hallName);
        // Only add valid letter sections (A, B, C, D, E)
        const section = item.class || item.section;
        if (section && ['A', 'B', 'C', 'D', 'E'].includes(section)) {
          hallData.sections.add(section);
        }
        hallData.timetables.push(item);
        // Estimate capacity based on valid sections only
        hallData.capacity = hallData.sections.size * 20;
      });

      // Convert Map to Array and transform sections Set to Array
      return Array.from(hallMap.values()).map(hall => ({
        ...hall,
        sections: Array.from(hall.sections).sort()
      }));
    } catch (error) {
      console.error('Error getting hall arrangements:', error);
      throw error;
    }
  }

  // Download timetable PDF for a specific grade and class section
  static async downloadTimeTableByGradeAndClass(grade, classSection) {
    try {
      const params = new URLSearchParams();
      params.append('grade', grade);
      params.append('classSection', classSection);
      
      const response = await fetch(`${API_BASE_URL}/download/filtered?${params.toString()}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TimeTable_${grade}_${classSection}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading timetable:', error);
      throw error;
    }
  }

  // Download timetable PDF for a specific class section (A, B, C) - Legacy function
  static async downloadTimeTableByClass(classSection) {
    try {
      const response = await fetch(`${API_BASE_URL}/download/class-section/${classSection}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TimeTable_${classSection}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading timetable:', error);
      throw error;
    }
  }

  // Download timetable PDF for a specific grade (all classes)
  static async downloadTimeTableByGrade(grade) {
    try {
      const params = new URLSearchParams();
      params.append('grade', grade);
      
      const response = await fetch(`${API_BASE_URL}/download/filtered?${params.toString()}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        // Try to get the error message from the response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // If we can't parse the error response, use the default message
          console.warn('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `TimeTable_Grade_${grade}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading timetable:', error);
      throw error;
    }
  }

  // Download hall arrangement PDF for a specific grade and class
  static async downloadHallArrangementByGradeAndClass(grade, classSection) {
    try {
      const params = new URLSearchParams();
      params.append('class', classSection);
      
      const response = await fetch(`${API_BASE_URL}/download/hall/${grade}?${params.toString()}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        // Try to get the error message from the response
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // If we can't parse the error response, use the default message
          console.warn('Could not parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HallArrangement_${grade}_${classSection}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading hall arrangement:', error);
      throw error;
    }
  }

  // Download hall arrangement PDF for a specific grade
  static async downloadHallArrangementByGrade(grade) {
    try {
      const response = await fetch(`${API_BASE_URL}/download/hall/${grade}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `HallArrangement_${grade}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error downloading hall arrangement:', error);
      throw error;
    }
  }

  // Add a new timetable entry
  static async addTimeTable(timetableData) {
    try {
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timetableData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.timetable;
    } catch (error) {
      console.error('Error adding timetable:', error);
      throw error;
    }
  }

  // Update a timetable entry
  static async updateTimeTable(id, timetableData) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timetableData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.timetable;
    } catch (error) {
      console.error('Error updating timetable:', error);
      throw error;
    }
  }

  // Delete a timetable entry
  static async deleteTimeTable(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.timetable;
    } catch (error) {
      console.error('Error deleting timetable:', error);
      throw error;
    }
  }
}

export default TimeTableAPI;

