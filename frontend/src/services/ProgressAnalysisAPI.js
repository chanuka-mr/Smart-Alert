const API_BASE_URL = 'http://localhost:5001/exams';

class ProgressAnalysisAPI {
  // Get student progress analysis data from exam data
  static async getProgressAnalysis(studentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/progress-analysis/${studentId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No exam data found for this student');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.progressAnalysis;
    } catch (error) {
      console.error('Error fetching progress analysis:', error);
      throw error;
    }
  }

  // Get all exams for a student (for comprehensive analysis)
  static async getAllStudentExams(studentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      // Filter exams for the specific student
      const studentExams = data.exams.filter(exam => exam.studentId === studentId);
      return studentExams;
    } catch (error) {
      console.error('Error fetching all student exams:', error);
      throw error;
    }
  }

  // Download progress analysis PDF
  static async downloadProgressAnalysisPDF(studentId) {
    try {
      console.log('Attempting to download PDF for student:', studentId);
      const response = await fetch(`${API_BASE_URL}/progress/${studentId}`, {
        method: 'GET',
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No exam data found for this student');
        }
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      
      // Check if response is actually a PDF
      const contentType = response.headers.get('content-type');
      console.log('Content type:', contentType);
      
      if (!contentType || !contentType.includes('application/pdf')) {
        const errorText = await response.text();
        console.error('Expected PDF but got:', contentType, errorText);
        throw new Error('Server did not return a PDF file');
      }
      
      // Create blob from response
      const blob = await response.blob();
      console.log('Blob size:', blob.size);
      
      if (blob.size === 0) {
        throw new Error('PDF file is empty');
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ProgressAnalysis_${studentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('PDF download initiated successfully');
      return true;
    } catch (error) {
      console.error('Error downloading progress analysis PDF:', error);
      throw error;
    }
  }

  // Process exam data for progress analysis
  static processProgressData(exams) {
    if (!exams || exams.length === 0) {
      return null;
    }

    // Use the first exam as the base for student info
    const baseExam = exams[0];
    
    // Aggregate all subjects across all exams
    const subjectsMap = {};
    const termTotals = { term1: 0, term2: 0, term3: 0 };
    const termCounts = { term1: 0, term2: 0, term3: 0 };

    exams.forEach(exam => {
      exam.subjects.forEach(subject => {
        const subjectName = subject.subject || 'Unknown';
        
        if (!subjectsMap[subjectName]) {
          subjectsMap[subjectName] = {
            subject: subjectName,
            term1: null,
            term2: null,
            term3: null
          };
        }

        // Take the latest value for each term
        if (subject.term1 !== null && subject.term1 !== undefined) {
          subjectsMap[subjectName].term1 = subject.term1;
          termTotals.term1 += subject.term1;
          termCounts.term1++;
        }
        if (subject.term2 !== null && subject.term2 !== undefined) {
          subjectsMap[subjectName].term2 = subject.term2;
          termTotals.term2 += subject.term2;
          termCounts.term2++;
        }
        if (subject.term3 !== null && subject.term3 !== undefined) {
          subjectsMap[subjectName].term3 = subject.term3;
          termTotals.term3 += subject.term3;
          termCounts.term3++;
        }
      });
    });

    // Convert subjects map to array
    const subjects = Object.values(subjectsMap);

    // Calculate term averages
    const term1Avg = termCounts.term1 > 0 ? termTotals.term1 / termCounts.term1 : 0;
    const term2Avg = termCounts.term2 > 0 ? termTotals.term2 / termCounts.term2 : 0;
    const term3Avg = termCounts.term3 > 0 ? termTotals.term3 / termCounts.term3 : 0;

    // Calculate overall progress
    const overallProgress = term1Avg > 0 ? ((term3Avg - term1Avg) / term1Avg * 100) : 0;

    // Generate overall recommendations
    const lowSubjects = subjects.filter(subject => {
      const latest = subject.term3 || subject.term2 || subject.term1;
      return latest !== null && latest < 65;
    }).map(subject => subject.subject);

    let overallRecommendations = 'Keep monitoring progress and provide targeted support where needed.';
    if (term3Avg > term1Avg) {
      overallRecommendations = 'Student shows improvement — reinforce successful study habits.';
    } else if (term3Avg < term1Avg) {
      overallRecommendations = 'Performance declined — consider remediation and extra tutoring.';
    }
    
    if (lowSubjects.length > 0) {
      overallRecommendations += ` Focus on: ${lowSubjects.join(', ')}.`;
    }

    return {
      studentId: baseExam.studentId,
      name: baseExam.name,
      classLevel: baseExam.classLevel,
      subjects,
      term1Avg: Number(term1Avg.toFixed(2)),
      term2Avg: Number(term2Avg.toFixed(2)),
      term3Avg: Number(term3Avg.toFixed(2)),
      overallProgress: Number(overallProgress.toFixed(1)),
      overallRecommendations
    };
  }

  // Determine trend for a subject
  static determineTrend(term1, term2, term3) {
    const values = [term1, term2, term3].filter(v => v !== null && v !== undefined);
    if (values.length < 2) return "Insufficient Data";
    
    if (values[values.length - 1] > values[0]) return "Improving";
    if (values[values.length - 1] < values[0]) return "Declining";
    return "Stable";
  }

  // Generate recommendation for a subject
  static generateRecommendation(trend, latestScore) {
    if (latestScore < 65) return "Provide extra practice and revision.";
    if (trend === "Improving" && latestScore >= 75) return "Good progress — continue current strategies.";
    return "Maintain effort.";
  }
}

export default ProgressAnalysisAPI;
