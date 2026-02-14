const API_BASE_URL = 'http://localhost:5001/reportcard';

class ReportCardAPI {
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
      console.error('Error fetching report cards:', error);
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
      console.error('Error fetching report card:', error);
      throw error;
    }
  }

  // Get filtered report cards by grade and class section
  static async getFilteredReportCards(grade = '', classSection = '') {
    try {
      const params = new URLSearchParams();
      if (grade) params.append('grade', grade);
      if (classSection) params.append('classSection', classSection);
      
      const queryString = params.toString();
      const url = queryString ? `${API_BASE_URL}/filtered?${queryString}` : `${API_BASE_URL}/filtered`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.reportCards || [];
    } catch (error) {
      console.error('Error filtering report cards:', error);
      throw error;
    }
  }

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
      console.error('Error adding report card:', error);
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
      console.error('Error updating report card:', error);
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
      console.error('Error deleting report card:', error);
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
      console.error('Error downloading report card:', error);
      throw error;
    }
  }

  // Calculate grade based on marks
  static calculateGrade(marks) {
    if (marks >= 97) return "A+";
    if (marks >= 94) return "A";
    if (marks >= 90) return "A-";
    if (marks >= 87) return "B+";
    if (marks >= 84) return "B";
    if (marks >= 80) return "B-";
    if (marks >= 77) return "C+";
    if (marks >= 74) return "C";
    if (marks >= 70) return "C-";
    if (marks >= 67) return "D+";
    if (marks >= 64) return "D";
    if (marks >= 60) return "D-";
    return "F";
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
      console.error('Error getting student rank:', error);
      throw error;
    }
  }

  // Get all students in a class with rankings
  static async getClassRankings(classLevel) {
    try {
      const response = await fetch(`${API_BASE_URL}/class/${classLevel}/rankings`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting class rankings:', error);
      throw error;
    }
  }

  // Calculate summary statistics
  static calculateSummary(subjects) {
    let term1Total = 0, term2Total = 0, term3Total = 0;
    let term1Count = 0, term2Count = 0, term3Count = 0;
    
    subjects.forEach(subject => {
      // Handle both naming conventions: term1Marks/term1, term2Marks/term2, term3Marks/term3
      const term1Marks = subject.term1Marks !== undefined ? subject.term1Marks : subject.term1;
      const term2Marks = subject.term2Marks !== undefined ? subject.term2Marks : subject.term2;
      const term3Marks = subject.term3Marks !== undefined ? subject.term3Marks : subject.term3;
      
      if (term1Marks !== null && term1Marks !== undefined && !isNaN(term1Marks)) {
        term1Total += term1Marks;
        term1Count++;
      }
      if (term2Marks !== null && term2Marks !== undefined && !isNaN(term2Marks)) {
        term2Total += term2Marks;
        term2Count++;
      }
      if (term3Marks !== null && term3Marks !== undefined && !isNaN(term3Marks)) {
        term3Total += term3Marks;
        term3Count++;
      }
    });

    // Calculate term-wise averages
    const term1Average = term1Count > 0 ? term1Total / term1Count : 0;
    const term2Average = term2Count > 0 ? term2Total / term2Count : 0;
    const term3Average = term3Count > 0 ? term3Total / term3Count : 0;

    // Calculate overall average based on all available marks
    const totalMarks = term1Total + term2Total + term3Total;
    const totalCount = term1Count + term2Count + term3Count;
    const overallAverage = totalCount > 0 ? totalMarks / totalCount : 0;
    
    return {
      term1Total,
      term2Total,
      term3Total,
      term1Average: isNaN(term1Average) ? 0 : term1Average,
      term2Average: isNaN(term2Average) ? 0 : term2Average,
      term3Average: isNaN(term3Average) ? 0 : term3Average,
      overallAverage: isNaN(overallAverage) ? 0 : overallAverage,
      term1Count,
      term2Count,
      term3Count
    };
  }

}

export default ReportCardAPI;
