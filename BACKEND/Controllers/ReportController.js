const Attendance = require("../Model/AttendanceModel");
const { User, Academic } = require("../Model/userModel");
const { jsPDF } = require("jspdf");
const PDFDocument = require('pdfkit');

// Helper to get student section from academic info
const getStudentSection = async (userID) => {
  const academic = await Academic.findOne({ userID });
  return academic ? `${academic.grade}${academic.class}` : 'N/A';
};

// Helper to enrich attendance records with academic section info
const enrichRecordsWithSection = async (records) => {
  const enrichedRecords = await Promise.all(
    records.map(async (record) => {
      const recordObj = record.toObject ? record.toObject() : record;
      if (recordObj.student && recordObj.student.userID) {
        const academic = await Academic.findOne({ userID: recordObj.student.userID });
        recordObj.student.section = academic ? `${academic.grade}${academic.class}` : 'N/A';
        recordObj.student.grade = academic ? academic.grade : null;
        recordObj.student.class = academic ? academic.class : null;
      }
      return recordObj;
    })
  );
  return enrichedRecords;
};

// Helper function to calculate attendance statistics
const calculateAttendanceStats = (records) => {
  const stats = {
    totalRecords: records.length,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendancePercentage: 0,
    byStudent: {},
    bySection: {},
    byDate: {}
  };

  records.forEach(record => {
    const studentId = record.student._id.toString();
    // Get section from populated student data (should be added during query)
    const section = record.student.section || 'N/A';
    const date = new Date(record.date).toISOString().split('T')[0];
    
    // Count by status
    stats[record.status.toLowerCase()]++;
    
    // Count by student
    if (!stats.byStudent[studentId]) {
      stats.byStudent[studentId] = {
        name: record.student.fullName || record.student.name,
        index: record.student.userID || record.student.std_index,
        section: section,
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0
      };
    }
    stats.byStudent[studentId].total++;
    stats.byStudent[studentId][record.status.toLowerCase()]++;
    
    // Count by section
    if (!stats.bySection[section]) {
      stats.bySection[section] = {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0
      };
    }
    stats.bySection[section].total++;
    stats.bySection[section][record.status.toLowerCase()]++;
    
    // Count by date
    if (!stats.byDate[date]) {
      stats.byDate[date] = {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0
      };
    }
    stats.byDate[date].total++;
    stats.byDate[date][record.status.toLowerCase()]++;
  });

  // Calculate attendance percentage
  if (stats.totalRecords > 0) {
    stats.attendancePercentage = ((stats.present + stats.excused) / stats.totalRecords * 100).toFixed(2);
  }

  // Calculate individual student percentages
  Object.keys(stats.byStudent).forEach(studentId => {
    const student = stats.byStudent[studentId];
    student.attendancePercentage = student.total > 0 ? 
      ((student.present + student.excused) / student.total * 100).toFixed(2) : 0;
  });

  // Calculate section percentages
  Object.keys(stats.bySection).forEach(section => {
    const sectionStats = stats.bySection[section];
    sectionStats.attendancePercentage = sectionStats.total > 0 ? 
      ((sectionStats.present + sectionStats.excused) / sectionStats.total * 100).toFixed(2) : 0;
  });

  return stats;
};

// Generate PDF report
const generatePDFReport = (records, stats, filters = {}) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Attendance Report", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Report info
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const reportDate = new Date().toLocaleDateString();
    doc.text(`Generated on: ${reportDate}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // Filters applied
    if (filters.section || filters.date || filters.status) {
      doc.setFontSize(10);
      doc.text("Filters Applied:", 20, yPosition);
      yPosition += 5;
      if (filters.section) doc.text(`Section: ${filters.section}`, 25, yPosition);
      if (filters.date) doc.text(`Date: ${filters.date}`, 25, yPosition + 5);
      if (filters.status) doc.text(`Status: ${filters.status}`, 25, yPosition + 10);
      yPosition += 20;
    }

    // Overall Statistics
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Overall Statistics", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Records: ${stats.totalRecords}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Present: ${stats.present}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Absent: ${stats.absent}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Late: ${stats.late}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Excused: ${stats.excused}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Attendance Rate: ${stats.attendancePercentage}%`, 20, yPosition);
    yPosition += 15;

    // Section-wise Statistics
    if (Object.keys(stats.bySection).length > 1) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Section-wise Statistics", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      Object.keys(stats.bySection).forEach(section => {
        const sectionStats = stats.bySection[section];
        doc.text(`Section ${section}:`, 20, yPosition);
        yPosition += 5;
        doc.text(`  Total: ${sectionStats.total}, Present: ${sectionStats.present}, Absent: ${sectionStats.absent}, Rate: ${sectionStats.attendancePercentage}%`, 25, yPosition);
        yPosition += 8;
      });
      yPosition += 5;
    }

    // Individual Student Performance
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Student Performance", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    // Table headers
    doc.text("Name", 20, yPosition);
    doc.text("Index", 60, yPosition);
    doc.text("Section", 90, yPosition);
    doc.text("Present", 120, yPosition);
    doc.text("Absent", 140, yPosition);
    doc.text("Late", 160, yPosition);
    doc.text("Rate %", 180, yPosition);
    yPosition += 5;

    // Student rows
    Object.keys(stats.byStudent).forEach(studentId => {
      const student = stats.byStudent[studentId];
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(student.name.substring(0, 15), 20, yPosition);
      doc.text(student.index, 60, yPosition);
      doc.text(student.section, 90, yPosition);
      doc.text(student.present.toString(), 120, yPosition);
      doc.text(student.absent.toString(), 140, yPosition);
      doc.text(student.late.toString(), 160, yPosition);
      doc.text(student.attendancePercentage + "%", 180, yPosition);
      yPosition += 5;
    });

    return doc;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF: ' + error.message);
  }
};

// Main report generation endpoint
const generateAttendanceReport = async (req, res) => {
  try {
    const { section, date, status, format = 'pdf' } = req.query;
    
    // Build query
    let query = {};
    let populateQuery = { path: 'student' };
    
    // Apply filters
    if (section) {
      const students = await Student.find({ section });
      const studentIds = students.map(s => s._id);
      query.student = { $in: studentIds };
    }
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }
    
    if (status) {
      query.status = status;
    }

    // Get records
    let records = await Attendance.find(query).populate('student').sort({ date: -1 });
    
    if (records.length === 0) {
      return res.status(404).json({ message: "No records found for the specified criteria" });
    }

    // Enrich records with academic section info
    records = await enrichRecordsWithSection(records);

    // Calculate statistics
    const stats = calculateAttendanceStats(records);
    
    // Generate report based on format
    if (format === 'pdf') {
      try {
        const doc = generatePDFReport(records, stats, { section, date, status });
        const pdfBuffer = doc.output('arraybuffer');
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="attendance-report-${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(Buffer.from(pdfBuffer));
      } catch (pdfError) {
        console.error('PDF generation failed:', pdfError);
        return res.status(500).json({ 
          message: "Failed to generate PDF report", 
          error: pdfError.message 
        });
      }
    } else {
      // Return JSON data for other formats
      res.json({
        records,
        statistics: stats,
        filters: { section, date, status },
        generatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ message: "Error generating report", error: error.message });
  }
};

// Get available sections for filtering
const getAvailableSections = async (req, res) => {
  try {
    // Get all unique grade/class combinations from Academic model
    const academics = await Academic.find({}).distinct('grade');
    const classes = await Academic.find({}).distinct('class');
    
    // Generate sections like "1A", "1B", "2A", etc.
    const sections = [];
    for (const grade of academics) {
      for (const cls of classes) {
        const section = `${grade}${cls}`;
        // Check if this combination actually exists
        const exists = await Academic.findOne({ grade, class: cls });
        if (exists) {
          sections.push(section);
        }
      }
    }
    
    res.json({ sections: sections.sort() });
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ message: "Error fetching sections", error: error.message });
  }
};

// Generate monthly attendance report
const generateMonthlyReport = async (req, res) => {
  try {
    const { year, month, section, format = 'pdf' } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ message: "Year and month are required" });
    }

    // Create date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    
    // Build query
    let query = {
      date: { $gte: startDate, $lte: endDate }
    };
    
    // Apply section filter if provided
    if (section) {
      // Find students by section using Academic model
      const academics = await Academic.find({
        grade: parseInt(section.charAt(0)),
        class: section.charAt(1)
      });
      const userIDs = academics.map(a => a.userID);
      const students = await User.find({ userID: { $in: userIDs }, role: "Parent" });
      const studentIds = students.map(s => s._id);
      query.student = { $in: studentIds };
    }

    // Get records for the month
    let records = await Attendance.find(query).populate('student').sort({ date: 1 });
    
    if (records.length === 0) {
      return res.status(404).json({ message: "No records found for the specified month" });
    }

    // Enrich records with academic section info
    records = await enrichRecordsWithSection(records);

    // Calculate enhanced statistics
    const stats = calculateMonthlyStats(records, year, month);
    
    // Generate report based on format
    if (format === 'pdf') {
      try {
        const doc = generateMonthlyPDFReport(records, stats, { year, month, section });
        const pdfBuffer = doc.output('arraybuffer');
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="monthly-report-${year}-${month.toString().padStart(2, '0')}.pdf"`);
        res.send(Buffer.from(pdfBuffer));
      } catch (pdfError) {
        console.error('PDF generation failed:', pdfError);
        return res.status(500).json({ 
          message: "Failed to generate PDF report", 
          error: pdfError.message 
        });
      }
    } else {
      // Return JSON data for other formats
      res.json({
        records,
        statistics: stats,
        filters: { year, month, section },
        generatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Monthly report generation error:', error);
    res.status(500).json({ message: "Error generating monthly report", error: error.message });
  }
};

// Calculate monthly statistics with trends
const calculateMonthlyStats = (records, year, month) => {
  const stats = {
    month: month,
    year: year,
    totalRecords: records.length,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendancePercentage: 0,
    byStudent: {},
    bySection: {},
    byDate: {},
    dailyTrends: [],
    weeklyTrends: [],
    topPerformers: [],
    attendanceIssues: []
  };

  // Calculate basic statistics
  records.forEach(record => {
    const studentId = record.student._id.toString();
    const section = record.student.section;
    const date = new Date(record.date).toISOString().split('T')[0];
    const dayOfWeek = new Date(record.date).getDay();
    
    // Count by status
    stats[record.status.toLowerCase()]++;
    
    // Count by student
    if (!stats.byStudent[studentId]) {
      stats.byStudent[studentId] = {
        name: record.student.fullName || record.student.name,
        index: record.student.userID || record.student.std_index,
        section: record.student.section || 'N/A',
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        attendanceDays: new Set()
      };
    }
    stats.byStudent[studentId].total++;
    stats.byStudent[studentId][record.status.toLowerCase()]++;
    stats.byStudent[studentId].attendanceDays.add(date);
    
    // Count by section
    if (!stats.bySection[section]) {
      stats.bySection[section] = {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0
      };
    }
    stats.bySection[section].total++;
    stats.bySection[section][record.status.toLowerCase()]++;
    
    // Count by date
    if (!stats.byDate[date]) {
      stats.byDate[date] = {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        excused: 0,
        dayOfWeek: dayOfWeek
      };
    }
    stats.byDate[date].total++;
    stats.byDate[date][record.status.toLowerCase()]++;
  });

  // Calculate attendance percentage
  if (stats.totalRecords > 0) {
    stats.attendancePercentage = ((stats.present + stats.excused) / stats.totalRecords * 100).toFixed(2);
  }

  // Calculate individual student percentages and trends
  Object.keys(stats.byStudent).forEach(studentId => {
    const student = stats.byStudent[studentId];
    student.attendancePercentage = student.total > 0 ? 
      ((student.present + student.excused) / student.total * 100).toFixed(2) : 0;
    student.attendanceDays = student.attendanceDays.size;
  });

  // Calculate section percentages
  Object.keys(stats.bySection).forEach(section => {
    const sectionStats = stats.bySection[section];
    sectionStats.attendancePercentage = sectionStats.total > 0 ? 
      ((sectionStats.present + sectionStats.excused) / sectionStats.total * 100).toFixed(2) : 0;
  });

  // Calculate daily trends
  Object.keys(stats.byDate).forEach(date => {
    const dateStats = stats.byDate[date];
    const attendanceRate = dateStats.total > 0 ? 
      ((dateStats.present + dateStats.excused) / dateStats.total * 100).toFixed(2) : 0;
    
    stats.dailyTrends.push({
      date: date,
      attendanceRate: parseFloat(attendanceRate),
      present: dateStats.present,
      absent: dateStats.absent,
      late: dateStats.late,
      excused: dateStats.excused,
      dayOfWeek: dateStats.dayOfWeek
    });
  });

  // Sort daily trends by date
  stats.dailyTrends.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate weekly trends
  const weeks = {};
  stats.dailyTrends.forEach(day => {
    const weekNumber = Math.ceil(new Date(day.date).getDate() / 7);
    if (!weeks[weekNumber]) {
      weeks[weekNumber] = { totalDays: 0, totalRate: 0, days: [] };
    }
    weeks[weekNumber].totalDays++;
    weeks[weekNumber].totalRate += parseFloat(day.attendanceRate);
    weeks[weekNumber].days.push(day);
  });

  Object.keys(weeks).forEach(week => {
    const weekData = weeks[week];
    stats.weeklyTrends.push({
      week: parseInt(week),
      averageAttendanceRate: (weekData.totalRate / weekData.totalDays).toFixed(2),
      days: weekData.days
    });
  });

  // Find top performers (students with 100% attendance)
  stats.topPerformers = Object.keys(stats.byStudent)
    .map(id => stats.byStudent[id])
    .filter(student => parseFloat(student.attendancePercentage) === 100)
    .sort((a, b) => b.attendanceDays - a.attendanceDays);

  // Find attendance issues (students with < 80% attendance)
  stats.attendanceIssues = Object.keys(stats.byStudent)
    .map(id => stats.byStudent[id])
    .filter(student => parseFloat(student.attendancePercentage) < 80)
    .sort((a, b) => parseFloat(a.attendancePercentage) - parseFloat(b.attendancePercentage));

  return stats;
};

// Generate monthly PDF report
const generateMonthlyPDFReport = (records, stats, filters = {}) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Monthly Attendance Report", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Month and year
    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text(`${monthNames[stats.month - 1]} ${stats.year}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // Report info
    doc.setFontSize(10);
    const reportDate = new Date().toLocaleDateString();
    doc.text(`Generated on: ${reportDate}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Filters applied
    if (filters.section) {
      doc.setFontSize(10);
      doc.text(`Section: ${filters.section}`, 20, yPosition);
      yPosition += 10;
    }

    // Overall Statistics
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Monthly Statistics", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Records: ${stats.totalRecords}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Present: ${stats.present}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Absent: ${stats.absent}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Late: ${stats.late}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Excused: ${stats.excused}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Overall Attendance Rate: ${stats.attendancePercentage}%`, 20, yPosition);
    yPosition += 15;

    // Weekly Trends
    if (stats.weeklyTrends.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Weekly Trends", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      stats.weeklyTrends.forEach(week => {
        doc.text(`Week ${week.week}: ${week.averageAttendanceRate}% average attendance`, 20, yPosition);
        yPosition += 5;
      });
      yPosition += 10;
    }

    // Top Performers
    if (stats.topPerformers.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Top Performers (100% Attendance)", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      stats.topPerformers.slice(0, 10).forEach(student => {
        doc.text(`${student.name} (${student.index}) - ${student.attendanceDays} days`, 20, yPosition);
        yPosition += 5;
      });
      yPosition += 10;
    }

    // Attendance Issues
    if (stats.attendanceIssues.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Students Needing Attention (< 80% Attendance)", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      stats.attendanceIssues.slice(0, 10).forEach(student => {
        doc.text(`${student.name} (${student.index}) - ${student.attendancePercentage}%`, 20, yPosition);
        yPosition += 5;
      });
      yPosition += 10;
    }

    // Section-wise Statistics
    if (Object.keys(stats.bySection).length > 1) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Section-wise Performance", 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      Object.keys(stats.bySection).forEach(section => {
        const sectionStats = stats.bySection[section];
        doc.text(`Section ${section}: ${sectionStats.attendancePercentage}% (${sectionStats.present}/${sectionStats.total})`, 20, yPosition);
        yPosition += 5;
      });
    }

    return doc;
  } catch (error) {
    console.error('Monthly PDF generation error:', error);
    throw new Error('Failed to generate monthly PDF: ' + error.message);
  }
};

// Generate individual student report
const generateStudentReport = async (req, res) => {
  try {
    const { studentId, std_index } = req.query;
    
    if (!studentId && !std_index) {
      return res.status(400).json({ message: "Provide studentId or std_index" });
    }

    // Find student (User with role=Parent)
    let student;
    if (studentId) {
      student = await User.findOne({ _id: studentId, role: "Parent" });
    } else {
      student = await User.findOne({ userID: std_index, role: "Parent" });
    }
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Get academic info
    const academic = await Academic.findOne({ userID: student.userID });
    student.section = academic ? `${academic.grade}${academic.class}` : 'N/A';
    student.std_index = student.userID;
    student.name = student.fullName;

    // Get student's attendance records
    let records = await Attendance.find({ student: student._id })
      .populate('student')
      .sort({ date: -1 });

    if (records.length === 0) {
      return res.status(404).json({ message: "No attendance records found for this student" });
    }

    // Enrich records with academic section info
    records = await enrichRecordsWithSection(records);

    // Calculate statistics for this student
    const stats = calculateAttendanceStats(records);
    
    // Generate PDF report
    try {
      const doc = generateStudentPDFReport(student, records, stats);
      const pdfBuffer = doc.output('arraybuffer');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="student-report-${student.std_index}-${new Date().toISOString().split('T')[0]}.pdf"`);
      res.send(Buffer.from(pdfBuffer));
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError);
      return res.status(500).json({ 
        message: "Failed to generate PDF report", 
        error: pdfError.message 
      });
    }
  } catch (error) {
    console.error('Student report generation error:', error);
    res.status(500).json({ message: "Error generating student report", error: error.message });
  }
};

// Generate individual student PDF report
const generateStudentPDFReport = (student, records, stats) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 20;

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Student Attendance Report", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Student info
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Student Information", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${student.name}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Index: ${student.std_index}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Section: ${student.section}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Parent: ${student.parentName}`, 20, yPosition);
    yPosition += 8;
    doc.text(`Parent Phone: ${student.parentPhoneNum}`, 20, yPosition);
    yPosition += 15;

    // Report info
    doc.setFontSize(10);
    const reportDate = new Date().toLocaleDateString();
    doc.text(`Generated on: ${reportDate}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Attendance Statistics
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Attendance Statistics", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Records: ${stats.totalRecords}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Present: ${stats.present}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Absent: ${stats.absent}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Late: ${stats.late}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Excused: ${stats.excused}`, 20, yPosition);
    yPosition += 6;
    doc.text(`Attendance Rate: ${stats.attendancePercentage}%`, 20, yPosition);
    yPosition += 15;

    // Attendance Records Table
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Attendance Records", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Table headers
    doc.text("Date", 20, yPosition);
    doc.text("Status", 80, yPosition);
    doc.text("Notified", 120, yPosition);
    yPosition += 5;

    // Draw line under headers
    doc.line(20, yPosition, 180, yPosition);
    yPosition += 5;

    // Records rows
    records.forEach(record => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
      
      const date = new Date(record.date).toLocaleDateString();
      doc.text(date, 20, yPosition);
      doc.text(record.status, 80, yPosition);
      doc.text(record.notifiedParent ? "Yes" : "No", 120, yPosition);
      yPosition += 6;
    });

    return doc;
  } catch (error) {
    console.error('Student PDF generation error:', error);
    throw new Error('Failed to generate student PDF: ' + error.message);
  }
};

// Generate detailed student report with individual records and parent info
const generateStudentDetailedReport = (doc, records, stats, filters) => {
  const student = records[0].student; // All records are for the same student
  const studentStats = stats.byStudent[student._id.toString()];
  
  let currentY = 50;
  
  // Header - Student Report
  doc.rect(0, 0, 612, 70).stroke('black').lineWidth(2);
  
  // School Logo/Icon Area
  doc.circle(40, 35, 20).stroke('black').lineWidth(2);
  doc.fontSize(14).font('Helvetica-Bold').fillColor('black');
  doc.text('SA', 34, 30);
  
  // Title
  doc.fontSize(20).font('Helvetica-Bold').fillColor('black');
  doc.text('SMART ALERT', 80, 20);
  doc.fontSize(14).font('Helvetica').fillColor('black');
  doc.text('Individual Student Report', 80, 40);
  
  // Report Date
  const reportDate = new Date().toLocaleDateString();
  doc.fontSize(9).font('Helvetica').fillColor('black');
  doc.text(`Generated: ${reportDate}`, 450, 30);
  
  currentY = 90;
  
  // Student Information Section
  doc.fontSize(16).font('Helvetica-Bold').fillColor('black');
  doc.text('STUDENT INFORMATION', 50, currentY);
  doc.moveTo(50, currentY + 18).lineTo(562, currentY + 18).lineWidth(2).stroke('black');
  
  currentY += 30;
  
  // Student details box
  doc.rect(50, currentY, 512, 80).stroke('black').lineWidth(1);
  
  doc.fontSize(12).font('Helvetica-Bold').fillColor('black');
  doc.text('Name:', 70, currentY + 15);
  doc.font('Helvetica').text(student.name, 150, currentY + 15);
  
  doc.font('Helvetica-Bold').text('Student Index:', 70, currentY + 30);
  doc.font('Helvetica').text(student.std_index, 180, currentY + 30);
  
  doc.font('Helvetica-Bold').text('Section:', 70, currentY + 45);
  doc.font('Helvetica').text(student.section, 150, currentY + 45);
  
  doc.font('Helvetica-Bold').text('Parent Name:', 300, currentY + 15);
  doc.font('Helvetica').text(student.parentName || 'N/A', 400, currentY + 15);
  
  doc.font('Helvetica-Bold').text('Parent Phone:', 300, currentY + 30);
  doc.font('Helvetica').text(student.parentPhoneNum || 'N/A', 400, currentY + 30);
  
  // Attendance Summary for this student
  const attendanceRate = studentStats.total > 0 ? 
    (((studentStats.present + studentStats.late) / studentStats.total) * 100).toFixed(1) : '0.0';
  
  doc.font('Helvetica-Bold').text('Attendance Rate:', 300, currentY + 45);
  doc.font('Helvetica').text(`${attendanceRate}%`, 420, currentY + 45);
  
  doc.font('Helvetica-Bold').text('Total Days:', 300, currentY + 60);
  doc.font('Helvetica').text(studentStats.total.toString(), 380, currentY + 60);
  
  currentY += 100;
  
  // Attendance Records Section
  doc.fontSize(16).font('Helvetica-Bold').fillColor('black');
  doc.text('ATTENDANCE RECORDS', 50, currentY);
  doc.moveTo(50, currentY + 18).lineTo(562, currentY + 18).lineWidth(2).stroke('black');
  
  currentY += 30;
  
  // Table header
  doc.rect(50, currentY, 512, 25).stroke('black').lineWidth(1);
  doc.fontSize(11).font('Helvetica-Bold').fillColor('black');
  doc.text('DATE', 70, currentY + 8);
  doc.text('STATUS', 200, currentY + 8);
  doc.text('JUSTIFICATION', 300, currentY + 8);
  doc.text('PARENT NOTIFIED', 450, currentY + 8);
  
  currentY += 25;
  
  // Sort records by date (newest first)
  const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Attendance records rows
  sortedRecords.forEach((record, index) => {
    // Check if we need a new page
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
      
      // Re-add table header on new page
      doc.rect(50, currentY, 512, 25).stroke('black').lineWidth(1);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('black');
      doc.text('DATE', 70, currentY + 8);
      doc.text('STATUS', 200, currentY + 8);
      doc.text('JUSTIFICATION', 300, currentY + 8);
      doc.text('PARENT NOTIFIED', 450, currentY + 8);
      currentY += 25;
    }
    
    const rowColor = index % 2 === 0 ? '#f9f9f9' : '#ffffff';
    doc.rect(50, currentY, 512, 20).fill(rowColor).stroke('#e0e0e0');
    
    doc.fontSize(10).font('Helvetica').fillColor('black');
    
    const date = new Date(record.date).toLocaleDateString();
    doc.text(date, 70, currentY + 6);
    
    // Color code status
    const statusColor = record.status === 'Present' ? 'green' : 
                       record.status === 'Late' ? 'orange' : 
                       record.status === 'Excused' ? 'blue' : 'red';
    doc.fillColor('black'); // Keep it black and white
    doc.text(record.status, 200, currentY + 6);
    
    doc.text(record.justification || '-', 300, currentY + 6);
    doc.text(record.notifiedParent ? 'Yes' : 'No', 470, currentY + 6);
    
    currentY += 20;
  });
  
  // Footer
  const footerY = doc.page.height - 50;
  doc.rect(0, footerY, doc.page.width, 50).stroke('black').lineWidth(1);
  
  doc.fontSize(8).font('Helvetica').fillColor('black');
  doc.text('Generated by Smart Alert System', 50, footerY + 15);
  doc.text(`Student Report - ${student.name} (${student.std_index})`, 50, footerY + 28);
  
  doc.text('Confidential - For Internal Use Only', 350, footerY + 15);
  doc.text(`Report ID: SA-${Date.now()}`, 450, footerY + 28);
  
  console.log('Student detailed PDF content added successfully');
  doc.end();
};

// Generate general summary report (existing functionality)
const generateGeneralSummaryReport = (doc, records, stats, filters) => {
  // Use fixed positioning for better layout control
  let currentY = 50;
  
  // Header - Black and White
  doc.rect(0, 0, 612, 70).stroke('black').lineWidth(2);
  
  // School Logo/Icon Area (black and white)
  doc.circle(40, 35, 20).stroke('black').lineWidth(2);
  doc.fontSize(14).font('Helvetica-Bold').fillColor('black');
  doc.text('SA', 34, 30);
  
  // Title
  doc.fontSize(20).font('Helvetica-Bold').fillColor('black');
  doc.text('SMART ALERT', 80, 20);
  doc.fontSize(14).font('Helvetica').fillColor('black');
  doc.text('Attendance Analytics Report', 80, 40);
  
  // Report Date in header
  const reportDate = new Date().toLocaleDateString();
  doc.fontSize(9).font('Helvetica').fillColor('black');
  doc.text(`Generated: ${reportDate}`, 450, 30);
  
  currentY = 80;
  
  // Filters applied (if any) - Black and White
  if (filters && Object.keys(filters).some(key => filters[key])) {
    // Filters box - black and white
    doc.rect(50, currentY, 512, 50).stroke('black').lineWidth(1);
    doc.fontSize(11).font('Helvetica-Bold').fillColor('black');
    doc.text('Applied Filters', 70, currentY + 10);
    
    doc.fontSize(9).font('Helvetica').fillColor('black');
    let filterX = 70;
    let filterY = currentY + 25;
    
    if (filters.searchTerm) {
      doc.text(`Search: ${filters.searchTerm}`, filterX, filterY);
      filterX += 150;
    }
    if (filters.dateFilter) {
      doc.text(`Date: ${filters.dateFilter}`, filterX, filterY);
      filterX += 150;
    }
    if (filters.monthFilter) {
      doc.text(`Month: ${filters.monthFilter}`, filterX, filterY);
    }
    
    filterX = 70;
    filterY += 12;
    if (filters.statusFilter) {
      doc.text(`Status: ${filters.statusFilter}`, filterX, filterY);
      filterX += 150;
    }
    if (filters.sectionFilter) {
      doc.text(`Section: ${filters.sectionFilter}`, filterX, filterY);
    }
    
    currentY += 60;
  }
  
  // Overall Statistics Section - Fixed positioning
  currentY += 10;
  
  // Section Title with underline
  doc.fontSize(14).font('Helvetica-Bold').fillColor('black');
  doc.text('OVERALL SUMMARY', 50, currentY);
  doc.moveTo(50, currentY + 15).lineTo(562, currentY + 15).lineWidth(2).stroke('black');
  
  currentY += 25;
  
  // Statistics in compact table format
  doc.rect(50, currentY, 512, 60).stroke('black').lineWidth(1);
  
  // Statistics content - more compact
  doc.fontSize(11).font('Helvetica-Bold').fillColor('black');
  doc.text('Total Records:', 70, currentY + 12);
  doc.font('Helvetica').text(stats.totalRecords.toString(), 180, currentY + 12);
  
  doc.font('Helvetica-Bold').text('Present:', 70, currentY + 25);
  doc.font('Helvetica').text(`${stats.present} (${((stats.present / stats.totalRecords) * 100).toFixed(1)}%)`, 140, currentY + 25);
  
  doc.font('Helvetica-Bold').text('Absent:', 70, currentY + 38);
  doc.font('Helvetica').text(`${stats.absent} (${((stats.absent / stats.totalRecords) * 100).toFixed(1)}%)`, 140, currentY + 38);
  
  doc.font('Helvetica-Bold').text('Late:', 280, currentY + 25);
  doc.font('Helvetica').text(`${stats.late} (${((stats.late / stats.totalRecords) * 100).toFixed(1)}%)`, 320, currentY + 25);
  
  doc.font('Helvetica-Bold').text('Excused:', 280, currentY + 38);
  doc.font('Helvetica').text(`${stats.excused} (${((stats.excused / stats.totalRecords) * 100).toFixed(1)}%)`, 340, currentY + 38);
  
  // Attendance Rate - more prominent
  doc.fontSize(12).font('Helvetica-Bold').fillColor('black');
  doc.text(`OVERALL ATTENDANCE RATE: ${stats.attendancePercentage}%`, 70, currentY + 48);
  
  currentY += 70;
  
  // Class-wise Statistics Section - Fixed positioning
  currentY += 10;
  
  // Section Title
  doc.fontSize(14).font('Helvetica-Bold').fillColor('black');
  doc.text('CLASS-WISE STATISTICS', 50, currentY);
  doc.moveTo(50, currentY + 15).lineTo(562, currentY + 15).lineWidth(2).stroke('black');
  
  currentY += 25;
  
  // Get sections from stats
  const sections = Object.keys(stats.bySection || {});
  
  if (sections.length > 0) {
    // Table header
    doc.rect(50, currentY, 512, 20).stroke('black').lineWidth(1);
    
    // Table headers - smaller font
    doc.fontSize(9).font('Helvetica-Bold').fillColor('black');
    doc.text('SECTION', 70, currentY + 6);
    doc.text('TOTAL', 140, currentY + 6);
    doc.text('PRESENT', 180, currentY + 6);
    doc.text('ABSENT', 240, currentY + 6);
    doc.text('LATE', 290, currentY + 6);
    doc.text('EXCUSED', 330, currentY + 6);
    doc.text('RATE %', 450, currentY + 6);
    
    currentY += 20;
    
    // Table rows - compact spacing
    sections.forEach((section, index) => {
      const sectionStats = stats.bySection[section];
      const sectionRate = sectionStats.total > 0 ? 
        (((sectionStats.present + sectionStats.late) / sectionStats.total) * 100).toFixed(1) : '0.0';
      
      // Simple alternating row background (very light gray for readability)
      const rowColor = index % 2 === 0 ? '#f9f9f9' : '#ffffff';
      doc.rect(50, currentY, 512, 16).fill(rowColor).stroke('#e0e0e0');
      
      // All text in black, properly aligned
      doc.fontSize(8).font('Helvetica').fillColor('black');
      
      doc.text(section, 70, currentY + 4);
      doc.text(sectionStats.total.toString(), 140, currentY + 4);
      doc.text(sectionStats.present.toString(), 180, currentY + 4);
      doc.text(sectionStats.absent.toString(), 240, currentY + 4);
      doc.text(sectionStats.late.toString(), 290, currentY + 4);
      doc.text(sectionStats.excused.toString(), 330, currentY + 4);
      doc.text(`${sectionRate}%`, 450, currentY + 4);
      
      currentY += 16;
    });
    
    doc.fillColor('black');
  }
  
  // Student Performance Summary Section - Fixed positioning
  currentY += 10;
  
  // Section Title
  doc.fontSize(14).font('Helvetica-Bold').fillColor('black');
  doc.text('STUDENT PERFORMANCE ANALYSIS', 50, currentY);
  doc.moveTo(50, currentY + 15).lineTo(562, currentY + 15).lineWidth(2).stroke('black');
  
  currentY += 25;
  
  // Calculate student performance categories
  const studentStats = Object.values(stats.byStudent || {});
  const excellentStudents = studentStats.filter(s => {
    const rate = s.total > 0 ? ((s.present + s.late) / s.total) * 100 : 0;
    return rate >= 95;
  }).length;
  
  const goodStudents = studentStats.filter(s => {
    const rate = s.total > 0 ? ((s.present + s.late) / s.total) * 100 : 0;
    return rate >= 85 && rate < 95;
  }).length;
  
  const averageStudents = studentStats.filter(s => {
    const rate = s.total > 0 ? ((s.present + s.late) / s.total) * 100 : 0;
    return rate >= 75 && rate < 85;
  }).length;
  
  const belowAverageStudents = studentStats.filter(s => {
    const rate = s.total > 0 ? ((s.present + s.late) / s.total) * 100 : 0;
    return rate < 75;
  }).length;
  
  const totalStudents = studentStats.length;
  
  if (totalStudents > 0) {
    // Performance summary in compact table format - Black and White
    doc.rect(50, currentY, 512, 40).stroke('black').lineWidth(1);
    
    doc.fontSize(9).font('Helvetica-Bold').fillColor('black');
    doc.text('Total Students Analyzed:', 70, currentY + 8);
    doc.font('Helvetica').text(totalStudents.toString(), 200, currentY + 8);
    
    doc.font('Helvetica-Bold').text('Excellent (95%+):', 70, currentY + 20);
    doc.font('Helvetica').text(`${excellentStudents} students (${((excellentStudents/totalStudents)*100).toFixed(1)}%)`, 160, currentY + 20);
    
    doc.font('Helvetica-Bold').text('Good (85-94%):', 70, currentY + 30);
    doc.font('Helvetica').text(`${goodStudents} students (${((goodStudents/totalStudents)*100).toFixed(1)}%)`, 150, currentY + 30);
    
    doc.font('Helvetica-Bold').text('Average (75-84%):', 300, currentY + 20);
    doc.font('Helvetica').text(`${averageStudents} students (${((averageStudents/totalStudents)*100).toFixed(1)}%)`, 400, currentY + 20);
    
    doc.font('Helvetica-Bold').text('Needs Help (<75%):', 300, currentY + 30);
    doc.font('Helvetica').text(`${belowAverageStudents} students (${((belowAverageStudents/totalStudents)*100).toFixed(1)}%)`, 400, currentY + 30);
    
    currentY += 50;
  }
  
  // Simple footer at bottom of page - Fixed position
  const footerY = 720; // Fixed footer position
  doc.rect(0, footerY, doc.page.width, 50).stroke('black').lineWidth(1);
  
  doc.fontSize(8).font('Helvetica').fillColor('black');
  doc.text('Generated by Smart Alert System', 50, footerY + 15);
  doc.text(`Report ID: SA-${Date.now()}`, 50, footerY + 28);
  
  doc.text('Confidential - For Internal Use Only', 350, footerY + 15);
  doc.text('Page 1 of 1', 500, footerY + 28);
  
  console.log('General summary PDF content added successfully');
  doc.end();
};

// Generate filtered report based on frontend filters
const generateFilteredReport = async (req, res) => {
  try {
    const { filters, records } = req.body;

    console.log('Received request for filtered report:', {
      filters,
      recordCount: records ? records.length : 0
    });

    if (!records || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: "No records provided for report generation"
      });
    }

    if (records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No records to generate report from"
      });
    }

    // Detect if this is a student-specific search
    const isStudentSearch = filters.searchTerm && filters.searchTerm.trim();
    const searchTerm = filters.searchTerm ? filters.searchTerm.toLowerCase().trim() : '';
    
    // Check if search results are for a single student
    const uniqueStudents = [...new Set(records.map(r => r.student._id.toString()))];
    const isSingleStudentReport = uniqueStudents.length === 1;
    
    console.log('Report type detection:', {
      isStudentSearch,
      searchTerm,
      uniqueStudents: uniqueStudents.length,
      isSingleStudentReport
    });

    // Calculate statistics for the filtered records
    const stats = calculateAttendanceStats(records);
    console.log('Calculated stats:', stats);
    
    // Generate PDF report using PDFKit
    console.log('Creating PDF report with PDFKit...');
    
    const doc = new PDFDocument({ margin: 50 });
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      console.log('PDF buffer size:', pdfData.length);
      
      if (pdfData.length < 100) {
        console.error('PDF buffer is too small, likely generation failed');
        return res.status(500).json({ 
          success: false, 
          message: "PDF generation failed - buffer too small" 
        });
      }
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.pdf');
      res.send(pdfData);
    });

    // Generate different PDF layouts based on report type
    if (isSingleStudentReport && isStudentSearch) {
      // Generate detailed student report
      generateStudentDetailedReport(doc, records, stats, filters);
    } else {
      // Generate general summary report
      generateGeneralSummaryReport(doc, records, stats, filters);
    }
    
  } catch (error) {
    console.error('Filtered report generation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate filtered report: " + error.message 
    });
  }
};

module.exports = {
  generateAttendanceReport,
  getAvailableSections,
  generateStudentReport,
  generateMonthlyReport,
  generateFilteredReport
};
