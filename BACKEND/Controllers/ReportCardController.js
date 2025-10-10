const ReportCard = require("../Model/ReportCardModel");
const Exam = require("../Model/ExamModel");
const PDFDocument = require('pdfkit');

// Get all report cards
const getAllReportCards = async (req, res, next) => {
    try {
        const reportCards = await ReportCard.find();
        
        // Return empty array if no report cards found (don't return 404)
        if (!reportCards || reportCards.length === 0) {
            return res.status(200).json({ reportCards: [] });
        }
        
        // Process each report card to include calculated fields
        const processedReportCards = reportCards.map(student => {
            const termTotals = student.termTotals;
            const termAverages = student.termAverages;
            const overallAverage = student.overallAverage;
             
            return {
                _id: student._id,
                studentId: student.studentId,
                studentName: student.studentName,
                grade: student.grade,
                class: student.class,
                term1Total: termTotals.term1,
                term2Total: termTotals.term2,
                term3Total: termTotals.term3,
                term1Average: termAverages.term1Average,
                term2Average: termAverages.term2Average,
                term3Average: termAverages.term3Average,
                overallAverage: overallAverage,
                subjects: student.subjects,
                teacherComments: student.teacherComments,
                academicYear: student.academicYear
            };
        });
         
        return res.status(200).json({ reportCards: processedReportCards });
    } catch (err) {
        console.error('Error fetching report cards:', err);
        return res.status(500).json({ message: "Error fetching report cards" });
    }
};

// Get report card by student ID
const getReportCardByStudentId = async (req, res, next) => {
    const { studentId } = req.params;
    
    let reportCard;
    try {
        reportCard = await ReportCard.findOne({ studentId });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error fetching report card" });
    }
    
    if (!reportCard) {
        return res.status(404).json({ message: "Report card not found for this student" });
    }
    
    return res.status(200).json({ reportCard });
};

// Get filtered report cards by grade and class section
const getFilteredReportCards = async (req, res, next) => {
    const { grade, class: classSection } = req.query;
    
    let filter = {};
    if (grade) {
        filter.grade = grade;
    }
    if (classSection) {
        filter.class = classSection;
    }
    
    let reportCards;
    try {
        reportCards = await ReportCard.find(filter);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error fetching report cards" });
    }
    
    return res.status(200).json({ reportCards });
};

// Add a new report card
const addReportCard = async (req, res, next) => {
    const { studentId, studentName, grade, class: classSection, subjects, teacherComments, academicYear } = req.body;

    // Validate required fields
    if (!studentId || !studentName || !grade || !subjects || !Array.isArray(subjects)) {
        return res.status(400).json({ 
            message: "Missing required fields. Please provide: studentId, studentName, grade, subjects" 
        });
    }

    // Validate grade
    if (typeof grade !== 'number' || grade < 1 || grade > 11) {
        return res.status(400).json({ 
            message: "grade must be a number between 1 and 11" 
        });
    }

    // Validate subjects array
    if (subjects.length === 0) {
        return res.status(400).json({ 
            message: "At least one subject is required" 
        });
    }

    // Validate each subject
    for (let subject of subjects) {
        if (!subject.subjectName) {
            return res.status(400).json({ 
                message: "Each subject must have a subjectName" 
            });
        }
        
        // Validate marks if provided
        if (subject.term1Marks !== null && (subject.term1Marks < 0 || subject.term1Marks > 100)) {
            return res.status(400).json({ 
                message: "term1Marks must be between 0 and 100" 
            });
        }
        if (subject.term2Marks !== null && (subject.term2Marks < 0 || subject.term2Marks > 100)) {
            return res.status(400).json({ 
                message: "term2Marks must be between 0 and 100" 
            });
        }
        if (subject.term3Marks !== null && (subject.term3Marks < 0 || subject.term3Marks > 100)) {
            return res.status(400).json({ 
                message: "term3Marks must be between 0 and 100" 
            });
        }
    }
    //Create new report card
    const reportCard = new ReportCard({
        studentId,
        studentName,
        grade,
        class: classSection,
        subjects,
        teacherComments: teacherComments || "",
        academicYear: academicYear || new Date().getFullYear().toString()
    });

    try {
        await reportCard.save();
        
        // Automatically create exam data for progress analysis
        try {
            const examData = {
                studentId: reportCard.studentId,
                name: reportCard.studentName,
                grade: reportCard.grade,
                term: "Progress Analysis",
                subjects: reportCard.subjects.map(subject => ({
                    subject: subject.subjectName,
                    term1: subject.term1Marks || 0,
                    term2: subject.term2Marks || 0,
                    term3: subject.term3Marks || 0
                })),
                feedback: reportCard.teacherComments || ""
            };
            
            const exam = new Exam(examData);
            await exam.save();
            console.log(`Exam data created for student ${studentId}`);
        } catch (examErr) {
            console.error('Error creating exam data:', examErr);
            // Don't fail the report card creation if exam creation fails
        }
        //Save report card
    } catch (err) {
        console.log(err);
        if (err.code === 11000) {
            return res.status(400).json({ 
                message: "A report card for this student ID already exists" 
            });
        }
        if (err.name === 'ValidationError') {
            const validationErrors = Object.values(err.errors).map(e => e.message).join(', ');
            return res.status(400).json({ 
                message: `Validation error: ${validationErrors}` 
            });
        }
        return res.status(500).json({ message: "Error saving report card" });
    }

    return res.status(201).json({ 
        message: "Report card created successfully", 
        reportCard 
    });
};

// Update report card
const updateReportCard = async (req, res, next) => {
    const { id } = req.params;
    const { studentName, grade, class: classSection, subjects, teacherComments, academicYear } = req.body;

    let reportCard;
    try {
        reportCard = await ReportCard.findById(id);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error finding report card" });
    }

    if (!reportCard) {
        return res.status(404).json({ message: "Report card not found" });
    }

    // Update fields if provided
    if (studentName) reportCard.studentName = studentName;
    if (grade) reportCard.grade = grade;
    if (classSection) reportCard.class = classSection;
    if (subjects) reportCard.subjects = subjects;
    if (teacherComments !== undefined) reportCard.teacherComments = teacherComments;
    if (academicYear) reportCard.academicYear = academicYear;

    try {
        await reportCard.save();
        
        // Update corresponding exam data for progress analysis
        try {
            const examData = {
                studentId: reportCard.studentId,
                name: reportCard.studentName,
                grade: reportCard.grade,
                term: "Progress Analysis",
                subjects: reportCard.subjects.map(subject => ({
                    subject: subject.subjectName,
                    term1: subject.term1Marks || 0,
                    term2: subject.term2Marks || 0,
                    term3: subject.term3Marks || 0
                })),
                feedback: reportCard.teacherComments || ""
            };
            
            // Find and update existing exam record, or create new one
            const existingExam = await Exam.findOne({ studentId: reportCard.studentId });
            if (existingExam) {
                await Exam.findByIdAndUpdate(existingExam._id, examData);
                console.log(`Exam data updated for student ${reportCard.studentId}`);
            } else {
                const exam = new Exam(examData);
                await exam.save();
                console.log(`Exam data created for student ${reportCard.studentId}`);
            }
        } catch (examErr) {
            console.error('Error updating exam data:', examErr);
            // Don't fail the report card update if exam update fails
        }
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error updating report card" });
    }

    return res.status(200).json({ 
        message: "Report card updated successfully", 
        reportCard 
    });
};

// Delete report card
const deleteReportCard = async (req, res, next) => {
    const { id } = req.params;

    try {
        const reportCard = await ReportCard.findByIdAndDelete(id);
        if (!reportCard) {
            return res.status(404).json({ message: "Report card not found" });
        }
        
        // Delete corresponding exam data for progress analysis
        try {
            await Exam.deleteMany({ studentId: reportCard.studentId });
            console.log(`Exam data deleted for student ${reportCard.studentId}`);
        } catch (examErr) {
            console.error('Error deleting exam data:', examErr);
            // Don't fail the report card deletion if exam deletion fails
        }
        
        return res.status(200).json({ message: "Report card deleted successfully" });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error deleting report card" });
    }
};

// Download report card PDF
const downloadReportCardPDF = async (req, res, next) => {
    const { studentId } = req.params;

    try {
        const reportCard = await ReportCard.findOne({ studentId });
        if (!reportCard) {
            return res.status(404).json({ message: "Report card not found" });
        }

        // Create PDF with modern settings
        const doc = new PDFDocument({ 
            margin: 30, 
            size: 'A4',
            layout: 'portrait',
            compress: true
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="report-card-${studentId}.pdf"`);
        doc.pipe(res);

        // Modern color scheme matching frontend
        const colors = {
            primary: '#00897b',        // Teal - main color
            secondary: '#00bfa5',      // Light teal - secondary color
            accent: '#e74c3c',         // Red - for warnings/errors
            warning: '#f39c12',       // Orange - for warnings
            text: '#2c3e50',          // Dark blue-gray - text color
            lightGray: '#f9f9f9',     // Light gray - alternating rows
            border: '#dee2e6',        // Light border
            cardBg: '#f0f9ff',        // Light blue - card backgrounds
            success: '#2e7d32',      // Green - for success states
            info: '#1976d2'           // Blue - for info states
        };

        // Page dimensions
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 30;
        const contentWidth = pageWidth - (margin * 2);
        const contentHeight = pageHeight - (margin * 2);

        // --- Professional Header Section ---
        doc.rect(margin, margin, contentWidth, 80)
           .fill(colors.cardBg)
           .stroke(colors.border, 1);
        
        // School logo placeholder
        doc.circle(margin + 25, margin + 25, 20)
           .fill(colors.primary)
           .stroke(colors.primary, 2);
        
        // School name
        doc.fillColor(colors.primary)
           .fontSize(24)
           .font('Helvetica-Bold')
           .text('WEBSTER INTERNATIONAL SCHOOL', margin + 60, margin + 15);
        
        // Report title
        doc.fillColor(colors.text)
           .fontSize(18)
           .font('Helvetica-Bold')
           .text('STUDENT REPORT CARD', margin + 60, margin + 40);
        
        // Academic year
        doc.fillColor(colors.text)
           .fontSize(12)
           .font('Helvetica')
           .text(`Academic Year: ${reportCard.academicYear || new Date().getFullYear().toString()}`, margin + 60, margin + 60);
        
        // Generation date
        doc.fillColor(colors.text)
           .fontSize(10)
           .font('Helvetica')
           .text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - margin - 150, margin + 60);

        // --- Student Information Section ---
        const studentY = margin + 100;
        doc.rect(margin, studentY, contentWidth, 60)
           .fill('#ffffff')
           .stroke(colors.border, 1);
        
        // Student info grid
        const infoItems = [
            { label: 'Student Name', value: reportCard.studentName },
            { label: 'Student ID', value: reportCard.studentId },
            { label: 'Class', value: reportCard.class },
            { label: 'Grade', value: reportCard.grade },
            { label: 'Academic Year', value: reportCard.academicYear || new Date().getFullYear().toString() }
        ];
        
        const infoCols = 3;
        const infoColWidth = contentWidth / infoCols;
        const infoRowHeight = 20;
        
        infoItems.forEach((item, index) => {
            const col = index % infoCols;
            const row = Math.floor(index / infoCols);
            const x = margin + (col * infoColWidth) + 10;
            const y = studentY + (row * infoRowHeight) + 10;
            
            doc.fillColor(colors.text)
               .fontSize(10)
               .font('Helvetica-Bold')
               .text(`${item.label}:`, x, y);
            
            doc.fillColor(colors.text)
               .fontSize(10)
               .font('Helvetica')
               .text(item.value, x + 80, y);
        });

        // Table setup
        const startX = 50;
        const startY = 230;
        const rowHeight = 25;
        const colWidths = { subject: 120, term1: 60, grade1: 50, term2: 60, grade2: 50, term3: 60, grade3: 50 };
        const totalWidth = Object.values(colWidths).reduce((sum, width) => sum + width, 0);

        // Draw table headers
        let currentX = startX;
        doc.fillColor('#00897b').rect(startX, startY, totalWidth, rowHeight).fill();
        
        doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
        doc.text('Subject', currentX + 5, startY + 8, { width: colWidths.subject - 10, align: 'left' });
        currentX += colWidths.subject;
        doc.text('1st Term', currentX + 5, startY + 8, { width: colWidths.term1 - 10, align: 'center' });
        currentX += colWidths.term1;
        doc.text('Grade', currentX + 5, startY + 8, { width: colWidths.grade1 - 10, align: 'center' });
        currentX += colWidths.grade1;
        doc.text('2nd Term', currentX + 5, startY + 8, { width: colWidths.term2 - 10, align: 'center' });
        currentX += colWidths.term2;
        doc.text('Grade', currentX + 5, startY + 8, { width: colWidths.grade2 - 10, align: 'center' });
        currentX += colWidths.term2;
        doc.text('3rd Term', currentX + 5, startY + 8, { width: colWidths.term3 - 10, align: 'center' });
        currentX += colWidths.term3;
        doc.text('Grade', currentX + 5, startY + 8, { width: colWidths.grade3 - 10, align: 'center' });

        // Draw table data rows
        doc.fillColor('black').fontSize(9).font('Helvetica');
        let currentY = startY + rowHeight;
        
        reportCard.subjects.forEach((subject, index) => {
            // Check if we need a new page
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
            }

            // Alternate row colors
            if (index % 2 === 0) {
                doc.fillColor('#f9f9f9').rect(startX, currentY, totalWidth, rowHeight).fill();
            }

            let dataX = startX;
            doc.fillColor('black');
            
            doc.text(subject.subjectName || '-', dataX + 5, currentY + 8, { width: colWidths.subject - 10, align: 'left' });
            dataX += colWidths.subject;
            doc.text(subject.term1Marks ? subject.term1Marks.toString() : '-', dataX + 5, currentY + 8, { width: colWidths.term1 - 10, align: 'center' });
            dataX += colWidths.term1;
            doc.text(subject.term1Marks ? calculateGrade(subject.term1Marks) : '-', dataX + 5, currentY + 8, { width: colWidths.grade1 - 10, align: 'center' });
            dataX += colWidths.grade1;
            doc.text(subject.term2Marks ? subject.term2Marks.toString() : '-', dataX + 5, currentY + 8, { width: colWidths.term2 - 10, align: 'center' });
            dataX += colWidths.term2;
            doc.text(subject.term2Marks ? calculateGrade(subject.term2Marks) : '-', dataX + 5, currentY + 8, { width: colWidths.grade2 - 10, align: 'center' });
            dataX += colWidths.term2;
            doc.text(subject.term3Marks ? subject.term3Marks.toString() : '-', dataX + 5, currentY + 8, { width: colWidths.term3 - 10, align: 'center' });
            dataX += colWidths.term3;
            doc.text(subject.term3Marks ? calculateGrade(subject.term3Marks) : '-', dataX + 5, currentY + 8, { width: colWidths.grade3 - 10, align: 'center' });
            
            currentY += rowHeight;
        });

        // Add Total Marks row
        const termTotals = reportCard.termTotals;
        const termAverages = reportCard.termAverages;
        
        // Check if we need a new page for the total row
        if (currentY > 700) {
            doc.addPage();
            currentY = 50;
        }

        // Draw total marks row with special styling
        doc.fillColor('#f0f9ff').rect(startX, currentY, totalWidth, rowHeight).fill();
        
        let totalX = startX;
        doc.fillColor('#00897b').fontSize(9).font('Helvetica-Bold');
        doc.text('TOTAL MARKS', totalX + 5, currentY + 8, { width: colWidths.subject - 10, align: 'center' });
        totalX += colWidths.subject;
        
        doc.fillColor('#2e7d32').fontSize(9).font('Helvetica-Bold');
        doc.text(termTotals.term1.toString(), totalX + 5, currentY + 8, { width: colWidths.term1 - 10, align: 'center' });
        totalX += colWidths.term1;
        doc.fillColor('#00897b').fontSize(9).font('Helvetica-Bold');
        doc.text('-', totalX + 5, currentY + 8, { width: colWidths.grade1 - 10, align: 'center' });
        totalX += colWidths.grade1;
        doc.fillColor('#2e7d32').fontSize(9).font('Helvetica-Bold');
        doc.text(termTotals.term2.toString(), totalX + 5, currentY + 8, { width: colWidths.term2 - 10, align: 'center' });
        totalX += colWidths.term2;
        doc.fillColor('#00897b').fontSize(9).font('Helvetica-Bold');
        doc.text('-', totalX + 5, currentY + 8, { width: colWidths.grade2 - 10, align: 'center' });
        totalX += colWidths.grade2;
        doc.fillColor('#2e7d32').fontSize(9).font('Helvetica-Bold');
        doc.text(termTotals.term3.toString(), totalX + 5, currentY + 8, { width: colWidths.term3 - 10, align: 'center' });
        totalX += colWidths.term3;
        doc.fillColor('#00897b').fontSize(9).font('Helvetica-Bold');
        doc.text('-', totalX + 5, currentY + 8, { width: colWidths.grade3 - 10, align: 'center' });
        
        currentY += rowHeight;

        // Draw table borders (including total row)
        doc.strokeColor('#000000').lineWidth(1);
        doc.rect(startX, startY, totalWidth, (reportCard.subjects.length + 2) * rowHeight).stroke();

        // --- Professional Summary Table ---
        const summaryY = currentY + 20;
        const summaryTableHeight = 80;
        const summaryTableWidth = contentWidth;
        
        // Summary table background
        doc.rect(margin, summaryY, summaryTableWidth, summaryTableHeight)
           .fill(colors.cardBg)
           .stroke(colors.primary, 1);
        
        // Summary table header
        doc.rect(margin, summaryY, summaryTableWidth, 25)
           .fill(colors.primary);
        
        doc.fillColor('white')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('ACADEMIC SUMMARY', margin + 10, summaryY + 8, { width: summaryTableWidth - 20, align: 'center' });
        
        // Summary content in grid format
        const summaryItems = [
            { label: '1st Term Total', value: termTotals.term1 },
            { label: '2nd Term Total', value: termTotals.term2 },
            { label: '3rd Term Total', value: termTotals.term3 },
            { label: 'Overall Average', value: `${reportCard.overallAverage.toFixed(2)}%` }
        ];
        
        const summaryCols = 2;
        const summaryColWidth = summaryTableWidth / summaryCols;
        const summaryRowHeight = 15;
        
        summaryItems.forEach((item, index) => {
            const col = index % summaryCols;
            const row = Math.floor(index / summaryCols);
            const x = margin + (col * summaryColWidth) + 10;
            const y = summaryY + 30 + (row * summaryRowHeight);
            
            doc.fillColor(colors.text)
               .fontSize(10)
               .font('Helvetica-Bold')
               .text(`${item.label}:`, x, y);
            
            doc.fillColor(colors.primary)
               .fontSize(10)
               .font('Helvetica-Bold')
               .text(item.value, x + 100, y);
        });

        // --- Professional Teacher Comments Box ---
        const commentsY = summaryY + summaryTableHeight + 20;
        const commentsBoxHeight = 100;
        const commentsBoxWidth = contentWidth;
        
        // Comments box background
        doc.rect(margin, commentsY, commentsBoxWidth, commentsBoxHeight)
           .fill('#ffffff')
           .stroke(colors.primary, 1);
        
        // Comments box header
        doc.rect(margin, commentsY, commentsBoxWidth, 25)
           .fill(colors.primary);
        
        doc.fillColor('white')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('TEACHER COMMENTS & FEEDBACK', margin + 10, commentsY + 8, { width: commentsBoxWidth - 20, align: 'center' });
        
        // Comments content
        if (reportCard.teacherComments && reportCard.teacherComments.trim() !== '') {
            doc.fillColor(colors.text)
               .fontSize(10)
               .font('Helvetica')
               .text(reportCard.teacherComments, margin + 10, commentsY + 35, { 
                   width: commentsBoxWidth - 20,
                   lineGap: 3
               });
        } else {
            doc.fillColor(colors.text)
               .fontSize(10)
               .font('Helvetica')
               .text('No comments provided by the teacher.', margin + 10, commentsY + 35);
        }

        doc.end();
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error generating PDF" });
    }
};

// Get all students in a class with rankings
const getClassRankings = async (req, res, next) => {
    const { grade } = req.params;
    
    try {
        // Get all students in the specified class
        const students = await ReportCard.find({ grade: parseInt(grade) });
        
        if (students.length === 0) {
            return res.status(404).json({ message: "No students found in this class" });
        }
        
        // Calculate rankings for each student
        const studentsWithRankings = students.map(student => {
            const termTotals = student.termTotals;
            const termAverages = student.termAverages;
            const overallAverage = student.overallAverage;
            
            return {
                studentId: student.studentId,
                studentName: student.studentName,
                grade: student.grade,
                grade: student.grade,
                class: student.class,
                term1Total: termTotals.term1,
                term2Total: termTotals.term2,
                term3Total: termTotals.term3,
                term1Average: termAverages.term1Average,
                term2Average: termAverages.term2Average,
                term3Average: termAverages.term3Average,
                overallAverage: overallAverage,
                subjects: student.subjects
            };
        });
        
        // Sort students by overall average (descending)
        studentsWithRankings.sort((a, b) => b.overallAverage - a.overallAverage);
        
        // Assign ranks
        studentsWithRankings.forEach((student, index) => {
            student.overallRank = index + 1;
        });
        
        // Sort by term 1 average for term 1 ranking
        const term1Rankings = [...studentsWithRankings].sort((a, b) => b.term1Average - a.term1Average);
        term1Rankings.forEach((student, index) => {
            student.term1Rank = index + 1;
        });
        
        // Sort by term 2 average for term 2 ranking
        const term2Rankings = [...studentsWithRankings].sort((a, b) => b.term2Average - a.term2Average);
        term2Rankings.forEach((student, index) => {
            student.term2Rank = index + 1;
        });
        
        // Sort by term 3 average for term 3 ranking
        const term3Rankings = [...studentsWithRankings].sort((a, b) => b.term3Average - a.term3Average);
        term3Rankings.forEach((student, index) => {
            student.term3Rank = index + 1;
        });
        
        // Merge rankings back to main array
        const finalRankings = studentsWithRankings.map(student => {
            const term1Student = term1Rankings.find(s => s.studentId === student.studentId);
            const term2Student = term2Rankings.find(s => s.studentId === student.studentId);
            const term3Student = term3Rankings.find(s => s.studentId === student.studentId);
            
            return {
                ...student,
                term1Rank: term1Student.term1Rank,
                term2Rank: term2Student.term2Rank,
                term3Rank: term3Student.term3Rank
            };
        });
        
        return res.status(200).json({ 
            grade: parseInt(grade),
            totalStudents: finalRankings.length,
            rankings: finalRankings
        });
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error calculating class rankings" });
    }
};

// Get student's rank in class
const getStudentRank = async (req, res, next) => {
    const { studentId } = req.params;
    
    try {
        // Get the student
        const student = await ReportCard.findOne({ studentId });
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        // Get all students in the same class
        const classStudents = await ReportCard.find({ grade: student.grade });
        
        // Calculate rankings
        const studentsWithAverages = classStudents.map(s => ({
            studentId: s.studentId,
            studentName: s.studentName,
            overallAverage: s.overallAverage,
            termTotals: s.termTotals
        }));
        
        // Sort by overall average
        studentsWithAverages.sort((a, b) => b.overallAverage - a.overallAverage);
        
        // Find the student's rank
        const studentRank = studentsWithAverages.findIndex(s => s.studentId === studentId) + 1;
        
        return res.status(200).json({
            studentId: student.studentId,
            studentName: student.studentName,
            grade: student.grade,
            overallAverage: student.overallAverage,
            overallRank: studentRank,
            totalStudents: classStudents.length,
            class: student.class
        });
        
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error getting student rank" });
    }
};

// Helper function to calculate grade
function calculateGrade(marks) {
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

// Fix class section format for existing records
const fixClassSections = async (req, res) => {
    try {
        console.log('Starting class section fix...');
        
        // Get all report cards
        const reportCards = await ReportCard.find({});
        console.log(`Found ${reportCards.length} report cards to process`);
        
        let updatedCount = 0;
        
        for (const reportCard of reportCards) {
            // Always update class to ensure proper format
            let section = 'A'; // Default section
            
            // Try to extract section from studentId
            const sectionMatch = reportCard.studentId.match(/([A-E])$/);
            if (sectionMatch) {
                section = sectionMatch[1];
            } else {
                
                // Extract last digit and map to section
                const lastDigit = reportCard.studentId.match(/(\d)$/);
                if (lastDigit) {
                    const digit = parseInt(lastDigit[1]);
                    // Map digits to sections: 4->B, 5->B, 6->C, etc.
                    const sectionMap = ['A', 'A', 'A', 'A', 'B', 'B', 'C', 'C', 'D', 'D'];
                    section = sectionMap[digit] || 'A';
                }
            }
            
            const newClassSection = `${reportCard.grade}-${section}`;
            
            // Check if update is needed
            if (reportCard.class !== newClassSection) {
                console.log(`Updating ${reportCard.studentId}: "${reportCard.class}" -> "${newClassSection}"`);
                
                // Update the record
                await ReportCard.findByIdAndUpdate(
                    reportCard._id,
                    { class: newClassSection },
                    { new: true }
                );
                
                updatedCount++;
            } else {
                console.log(`No update needed for ${reportCard.studentId}: "${reportCard.class}"`);
            }
        }
        
        console.log(`Fixed ${updatedCount} class sections`);
        
        res.status(200).json({
            success: true,
            message: `Successfully fixed ${updatedCount} class sections`,
            updatedCount: updatedCount,
            totalRecords: reportCards.length
        });
        
    } catch (error) {
        console.error('Error fixing class sections:', error);
        res.status(500).json({
            success: false,
            message: 'Error fixing class sections',
            error: error.message
        });
    }
};

// Get progress analysis for a student from report card data
const getProgressAnalysis = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const reportCard = await ReportCard.findOne({ studentId });
        
        if (!reportCard) {
            return res.status(404).json({ message: 'No report card found for this student' });
        }

        // Extract progress data from report card
        const termAverages = reportCard.termAverages;
        const progressAnalysis = {
            studentId: reportCard.studentId,
            studentName: reportCard.studentName,
            grade: reportCard.grade,
            classSection: reportCard.class,
            term1Avg: termAverages.term1Average || 0,
            term2Avg: termAverages.term2Average || 0,
            term3Avg: termAverages.term3Average || 0,
            overallAverage: reportCard.overallAverage || 0,
            subjects: reportCard.subjects.map(subject => ({
                subjectName: subject.subjectName,
                term1: subject.term1Marks || 0,
                term2: subject.term2Marks || 0,
                term3: subject.term3Marks || 0,
                average: ((subject.term1Marks || 0) + (subject.term2Marks || 0) + (subject.term3Marks || 0)) / 3
            })),
            teacherComments: reportCard.teacherComments || '',
            academicYear: reportCard.academicYear || new Date().getFullYear()
        };

        res.status(200).json({
            success: true,
            progressAnalysis: progressAnalysis
        });
        
    } catch (error) {
        console.error('Error getting progress analysis:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting progress analysis',
            error: error.message
        });
    }
};

// Migrate existing report cards to create exam data for progress analysis
const migrateReportCardsToExams = async (req, res) => {
    try {
        const reportCards = await ReportCard.find();
        let migratedCount = 0;
        let skippedCount = 0;
        
        for (const reportCard of reportCards) {
            try {
                // Check if exam data already exists for this student
                const existingExam = await Exam.findOne({ studentId: reportCard.studentId });
                
                if (existingExam) {
                    skippedCount++;
                    continue;
                }
                
                // Create exam data from report card
                const examData = {
                    studentId: reportCard.studentId,
                    name: reportCard.studentName,
                    grade: reportCard.grade,
                    term: "Progress Analysis",
                    subjects: reportCard.subjects.map(subject => ({
                        subject: subject.subjectName,
                        term1: subject.term1Marks || 0,
                        term2: subject.term2Marks || 0,
                        term3: subject.term3Marks || 0
                    })),
                    feedback: reportCard.teacherComments || ""
                };
                
                const exam = new Exam(examData);
                await exam.save();
                migratedCount++;
                console.log(`Migrated exam data for student ${reportCard.studentId}`);
                
            } catch (examErr) {
                console.error(`Error migrating exam data for student ${reportCard.studentId}:`, examErr);
            }
        }
        
        res.status(200).json({
            success: true,
            message: `Migration completed. ${migratedCount} exam records created, ${skippedCount} skipped (already existed)`,
            migratedCount,
            skippedCount,
            totalReportCards: reportCards.length
        });
        
    } catch (error) {
        console.error('Error migrating report cards to exams:', error);
        res.status(500).json({
            success: false,
            message: 'Error migrating report cards to exams',
            error: error.message
        });
    }
};

module.exports = {
    getAllReportCards,
    getReportCardByStudentId,
    getFilteredReportCards,
    addReportCard,
    updateReportCard,
    deleteReportCard,
    downloadReportCardPDF,
    getClassRankings,
    getStudentRank,
    fixClassSections,
    getProgressAnalysis,
    migrateReportCardsToExams
};
