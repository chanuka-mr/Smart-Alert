const API_BASE_URL = 'http://localhost:5001/reportcard';

class ReportDataAPI {
  // Add new report card
  static async addReportCard(reportCardData) {
    try {
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportCardData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.reportCard;
    } catch (error) {
      throw error;
    }
  }

  // Get report card by student ID
  static async getReportCardByStudentId(studentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/student/${studentId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Report card not found for this student');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.reportCard;
    } catch (error) {
      throw error;
    }
  }

  // Update report card
  static async updateReportCard(id, reportCardData) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportCardData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.reportCard;
    } catch (error) {
      throw error;
    }
  }

  // Get all report cards
  static async getAllReportCards() {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.reportCards || [];
    } catch (error) {
      throw error;
    }
  }

  // Get filtered report cards by grade and class section
  static async getFilteredReportCards(grade = '', classSection = '') {
    try {
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
      return data.reportCards || [];
    } catch (error) {
      throw error;
    }
  }

  // Delete report card
  static async deleteReportCard(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.message;
    } catch (error) {
      throw error;
    }
  }

  // Download report card PDF
  static async downloadReportCardPDF(studentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/download/${studentId}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-card-${studentId}.pdf`;
      
      // Trigger the download
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get student's rank in class
  static async getStudentRank(studentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/rank/${studentId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Get all students in a class with rankings
  static async getClassRankings(grade) {
    try {
      const response = await fetch(`${API_BASE_URL}/class/${grade}/rankings`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Validate form data before submission
  static validateFormData(formData) {
    const errors = [];
    
    console.log('Validating form data:', formData);

    if (!formData.studentId) {
      errors.push('Student ID is required');
    }

    if (!formData.studentName) {
      errors.push('Student Name is required');
    }

    if (!formData.grade) {
      errors.push('Class Level is required');
    } else {
      const gradeNum = parseInt(formData.grade);
      console.log('Class level validation:', { grade: formData.grade, gradeNum, isNaN: isNaN(gradeNum) });
      if (isNaN(gradeNum)) {
        errors.push('Class Level must be a valid number');
      } else if (gradeNum < 1 || gradeNum > 11) {
        errors.push('Class Level must be between 1 and 11');
      }
    }

    if (!formData.class) {
      errors.push('Class is required');
    } else {
      const validClasses = ['A', 'B', 'C'];
      if (!validClasses.includes(formData.class)) {
        errors.push('Class must be A, B, or C');
      }
    }

    if (!formData.academicYear) {
      errors.push('Academic Year is required');
    }

    if (!formData.subjects || !Array.isArray(formData.subjects) || formData.subjects.length === 0) {
      errors.push('At least one subject is required');
    } else {
      formData.subjects.forEach((subject, index) => {
        if (!subject.subjectName) {
          errors.push(`Subject name is required for subject ${index + 1}`);
        }

        // Check if at least one term has marks
        const hasMarks = subject.term1Marks !== null || subject.term2Marks !== null || subject.term3Marks !== null;
        if (!hasMarks) {
          errors.push(`At least one term mark is required for ${subject.subjectName}`);
        }

        // Validate marks range
        if (subject.term1Marks !== null && (subject.term1Marks < 0 || subject.term1Marks > 100)) {
          errors.push(`Term 1 marks for ${subject.subjectName} must be between 0 and 100`);
        }
        if (subject.term2Marks !== null && (subject.term2Marks < 0 || subject.term2Marks > 100)) {
          errors.push(`Term 2 marks for ${subject.subjectName} must be between 0 and 100`);
        }
        if (subject.term3Marks !== null && (subject.term3Marks < 0 || subject.term3Marks > 100)) {
          errors.push(`Term 3 marks for ${subject.subjectName} must be between 0 and 100`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  // Transform form data to match backend expectations
  static transformFormData(formData) {
    return {
      studentId: formData.studentId,
      studentName: formData.studentName,
      grade: parseInt(formData.grade),
      class: formData.class || '',
      academicYear: formData.academicYear,
      teacherComments: formData.teacherComments || '',
      subjects: formData.subjects.map(subject => ({
        subjectName: subject.subjectName,
        term1Marks: subject.term1Marks ? parseInt(subject.term1Marks) : null,
        term2Marks: subject.term2Marks ? parseInt(subject.term2Marks) : null,
        term3Marks: subject.term3Marks ? parseInt(subject.term3Marks) : null
      }))
    };
  }
}

export default ReportDataAPI;
