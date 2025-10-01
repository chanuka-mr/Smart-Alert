const Exam = require("../Model/ExamModel");
const PDFDocument = require("pdfkit");

// Get all exams
const getAllExams = async (req, res) => {
    try {
        const exams = await Exam.find();
        if (!exams) return res.status(404).json({ message: "Exams not found" });
        res.status(200).json({ exams });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Validate subjects payload: marks must be numbers (not strings)
function validateSubjectsInput(subjects) {
    if (!subjects) return true;
    if (!Array.isArray(subjects)) return false;
    for (let i = 0; i < subjects.length; i++) {
        const s = subjects[i];
        // Check both naming conventions: term1/term1Marks, term2/term2Marks, term3/term3Marks
        if (s.hasOwnProperty('term1') && s.term1 !== null && s.term1 !== undefined && typeof s.term1 !== 'number') return false;
        if (s.hasOwnProperty('term1Marks') && s.term1Marks !== null && s.term1Marks !== undefined && typeof s.term1Marks !== 'number') return false;
        if (s.hasOwnProperty('term2') && s.term2 !== null && s.term2 !== undefined && typeof s.term2 !== 'number') return false;
        if (s.hasOwnProperty('term2Marks') && s.term2Marks !== null && s.term2Marks !== undefined && typeof s.term2Marks !== 'number') return false;
        if (s.hasOwnProperty('term3') && s.term3 !== null && s.term3 !== undefined && typeof s.term3 !== 'number') return false;
        if (s.hasOwnProperty('term3Marks') && s.term3Marks !== null && s.term3Marks !== undefined && typeof s.term3Marks !== 'number') return false;
    }
    return true;
}

// Add exam for a student
const addExam = async (req, res) => {
    const { 
        studentId, 
        name, 
        studentName,
        grade, 
        term, 
        subjects, 
        feedback,
        teacherComments
    } = req.body;
    
    if (!validateSubjectsInput(subjects)) return res.status(400).json({ message: 'Invalid subjects payload: marks must be numbers' });

    //Ensure grade is string,not num
    if (req.body.hasOwnProperty('grade') && typeof req.body.grade === 'number') return res.status(400).json({ message: 'Grade must be a string, not a number' });
    
    try {
        // Map alternative field names to expected names
        const examData = {
            studentId,
            name: name || studentName,
            grade,
            term: term || "Final",
            subjects: subjects ? subjects.map(subject => ({
                subject: subject.subject || subject.subjectName,
                term1: subject.term1 || subject.term1Marks,
                term2: subject.term2 || subject.term2Marks,
                term3: subject.term3 || subject.term3Marks
            })) : [],
            feedback: feedback || teacherComments || ""
        };

        //Create and save new exam document
        const exam = new Exam(examData);
        await exam.save();
        res.status(200).json({ exam });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Unable to add exam" });
    }
};

// Get exam by MongoDB ID
const getById = async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ message: "Exam not found" });
        res.status(200).json({ exam });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Get exam by student ID
const getByStudentId = async (req, res) => {
    try {
        const exam = await Exam.findOne({ studentId: req.params.studentId });
        if (!exam) return res.status(404).json({ message: "Result not found" });
        res.status(200).json({ exam });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Update exam
const updateExam = async (req, res) => {
    const { studentId, name, grade, term, subjects, feedback } = req.body;
    //validate inputs
    if (!validateSubjectsInput(subjects)) return res.status(400).json({ message: 'Invalid subjects payload: marks must be numbers' });
    if (req.body.hasOwnProperty('grade') && typeof req.body.grade === 'number') return res.status(400).json({ message: 'Grade must be a string, not a number' });
    try {
        //update exam by id
        const exam = await Exam.findByIdAndUpdate(
            req.params.id,
            { studentId, name, grade, term, subjects, feedback },
            { new: true }
        );
        if (!exam) return res.status(404).json({ message: "Unable to update exam" });
        await exam.save();
        res.status(200).json({ exam });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete exam
const deleteExam = async (req, res) => {
    try {
        const exam = await Exam.findByIdAndDelete(req.params.id);
        if (!exam) return res.status(404).json({ message: "Unable to delete exam" });
        res.status(200).json({ exam });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Helper function to get grade for marks
function getGrade(mark) {
    if (mark === undefined || mark === null || mark === "") return "";
    if (mark >= 97) return "A+";
    if (mark >= 94) return "A";
    if (mark >= 90) return "A-";
    if (mark >= 87) return "B+";
    if (mark >= 84) return "B";
    if (mark >= 80) return "B-";
    if (mark >= 77) return "C+";
    if (mark >= 74) return "C";
    if (mark >= 70) return "C-";
    if (mark >= 67) return "D+";
    if (mark >= 64) return "D";
    if (mark >= 60) return "D-";
    return "F";
}

// Download report card as a PDF
const downloadReport = async (req, res) => {
    try {
        //Get exam by student id
        const exam = await Exam.findOne({ studentId: req.params.studentId });
        if (!exam) return res.status(404).json({ message: "Report not found" });

        // Calculate class rank
        const classmates = await Exam.find({ grade: exam.grade, term: exam.term });
        classmates.sort((a, b) => b.totalMarks - a.totalMarks);
        const rank = classmates.findIndex(e => e.studentId === exam.studentId) + 1;

        // Create PDF with modern settings
        const doc = new PDFDocument({ 
            margin: 30, 
            size: 'A4',
            layout: 'portrait',
            compress: true
        });
        const fileName = `Report_${exam.studentId}.pdf`;

        //Set headers for PDF
        res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
        res.setHeader("Content-Type", "application/pdf");
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
           .text(`Academic Year: ${exam.academicYear || new Date().getFullYear().toString()}`, margin + 60, margin + 60);
        
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
            { label: 'Student Name', value: exam.name },
            { label: 'Student ID', value: exam.studentId },
            { label: 'Class', value: exam.grade },
            { label: 'Term', value: exam.term },
            { label: 'Class Rank', value: `${rank} of ${classmates.length}` },
            { label: 'Academic Year', value: exam.academicYear || new Date().getFullYear().toString() }
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

        // --- Professional Subjects Table ---
        const tableY = studentY + 80;
        const rowHeight = 25;
        const maxTableHeight = Math.min(300, contentHeight - (tableY - margin) - 200);
        const maxRows = Math.floor(maxTableHeight / rowHeight);
        
        // Table header
        doc.rect(margin, tableY, contentWidth, rowHeight)
           .fill(colors.primary);
        
        const colWidths = {
            subject: contentWidth * 0.30,
            term1: contentWidth * 0.12,
            grade1: contentWidth * 0.08,
            term2: contentWidth * 0.12,
            grade2: contentWidth * 0.08,
            term3: contentWidth * 0.12,
            grade3: contentWidth * 0.08,
            average: contentWidth * 0.10
        };
        
        const headers = ['Subject', '1st Term', 'Grade', '2nd Term', 'Grade', '3rd Term', 'Grade', 'Average'];
        let currentX = margin;
        
        headers.forEach((header, index) => {
            const width = Object.values(colWidths)[index];
            doc.fillColor('white')
               .fontSize(10)
               .font('Helvetica-Bold')
               .text(header, currentX + 5, tableY + 8, { width: width - 10, align: 'center' });
            currentX += width;
        });

        // Table rows
        const displaySubjects = exam.subjects.slice(0, Math.min(maxRows - 1, exam.subjects.length));
        let totalFinalMarks = 0;
        
        displaySubjects.forEach((subject, index) => {
            const rowY = tableY + rowHeight + (index * rowHeight);
            const rowColor = index % 2 === 0 ? '#ffffff' : colors.lightGray;
            
            doc.rect(margin, rowY, contentWidth, rowHeight)
               .fill(rowColor)
               .stroke(colors.border, 0.5);
            
            currentX = margin;
            const val1 = typeof subject.term1 === 'number' ? subject.term1 : '';
            const val2 = typeof subject.term2 === 'number' ? subject.term2 : '';
            const val3 = typeof subject.term3 === 'number' ? subject.term3 : '';
            
            const marks = [subject.term1, subject.term2, subject.term3].filter(m => typeof m === 'number');
            const subjectAverage = marks.length > 0 ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length) : 0;
            totalFinalMarks += subjectAverage;
            
            const rowData = [
                subject.subject || '',
                val1,
                getGrade(val1),
                val2,
                getGrade(val2),
                val3,
                getGrade(val3),
                subjectAverage
            ];
            
            rowData.forEach((data, dataIndex) => {
                const width = Object.values(colWidths)[dataIndex];
                doc.fillColor(colors.text)
                   .fontSize(9)
                   .font('Helvetica')
                   .text(data, currentX + 5, rowY + 8, { width: width - 10, align: 'center' });
                currentX += width;
            });
        });
        
        // Add note if subjects were truncated
        if (exam.subjects.length > maxRows - 1) {
            const noteY = tableY + (maxRows - 1) * rowHeight + rowHeight;
            doc.fillColor(colors.warning)
               .fontSize(8)
               .font('Helvetica-Bold')
               .text(`Note: Showing ${maxRows - 1} of ${exam.subjects.length} subjects.`, margin, noteY, { width: contentWidth, align: 'center' });
        }

        // --- Performance Summary Cards ---
        const cardsY = tableY + (displaySubjects.length + 1) * rowHeight + 20;
        const cardWidth = (contentWidth - 20) / 3;
        const cardHeight = 80;
        
        // Calculate term-wise totals
        const termTotals = { t1: 0, t2: 0, t3: 0 };
        exam.subjects.forEach(s => {
            if (typeof s.term1 === 'number') termTotals.t1 += s.term1;
            if (typeof s.term2 === 'number') termTotals.t2 += s.term2;
            if (typeof s.term3 === 'number') termTotals.t3 += s.term3;
        });
        
        // Calculate averages
        const t1AvgPerSubject = exam.subjects.length > 0 ? (termTotals.t1 / exam.subjects.length) : 0;
        const t2AvgPerSubject = exam.subjects.length > 0 ? (termTotals.t2 / exam.subjects.length) : 0;
        const t3AvgPerSubject = exam.subjects.length > 0 ? (termTotals.t3 / exam.subjects.length) : 0;
        
        const performanceData = [
            { 
                title: '1st Term', 
                total: termTotals.t1, 
                average: t1AvgPerSubject,
                color: colors.success,
                icon: '📊'
            },
            { 
                title: '2nd Term', 
                total: termTotals.t2, 
                average: t2AvgPerSubject,
                color: colors.info,
                icon: '📈'
            },
            { 
                title: '3rd Term', 
                total: termTotals.t3, 
                average: t3AvgPerSubject,
                color: colors.warning,
                icon: '📉'
            }
        ];

        performanceData.forEach((card, index) => {
            const x = margin + (index * (cardWidth + 10));
            const y = cardsY;
            
            // Card background
            doc.rect(x, y, cardWidth, cardHeight)
               .fill(colors.cardBg)
               .stroke(colors.border, 1);
            
            // Card header
            doc.rect(x, y, cardWidth, 25)
               .fill(card.color);
            
            // Card content
            doc.fillColor('white')
               .fontSize(11)
               .font('Helvetica-Bold')
               .text(card.title, x + 5, y + 8, { width: cardWidth - 10, align: 'center' });
            
            doc.fillColor(card.color)
               .fontSize(16)
               .font('Helvetica-Bold')
               .text(`${card.average.toFixed(1)}%`, x + 5, y + 35, { width: cardWidth - 10, align: 'center' });
            
            doc.fillColor(colors.text)
               .fontSize(9)
               .font('Helvetica')
               .text(`Total: ${card.total}/${exam.subjects.length * 100}`, x + 5, y + 55, { width: cardWidth - 10, align: 'center' });
        });

        // --- Teacher's Comments Section ---
        const commentsY = cardsY + cardHeight + 20;
        const commentsWidth = contentWidth * 0.65;
        const commentsHeight = 80;
        
        doc.fillColor(colors.text)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text("Teacher's Comments & Feedback:", margin, commentsY - 20);
        
        doc.rect(margin, commentsY, commentsWidth, commentsHeight)
           .fill('#ffffff')
           .stroke(colors.primary, 1);
        
        if (exam.feedback && exam.feedback.trim() !== '') {
            doc.fillColor(colors.text)
               .fontSize(10)
               .font('Helvetica')
               .text(exam.feedback, margin + 10, commentsY + 10, { 
                   width: commentsWidth - 20,
                   lineGap: 2
               });
        } else {
            doc.fillColor(colors.text)
               .fontSize(10)
               .font('Helvetica')
               .text('No comments provided.', margin + 10, commentsY + 10);
        }

        // --- Grading System Section ---
        const gradingX = margin + commentsWidth + 20;
        const gradingWidth = contentWidth - commentsWidth - 20;
        const gradingHeight = 80;
        
        doc.fillColor(colors.text)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text("Grading System:", gradingX, commentsY - 20);
        
        doc.rect(gradingX, commentsY, gradingWidth, gradingHeight)
           .fill(colors.cardBg)
           .stroke(colors.primary, 1);

        const grading = [
            ['A+', '97-100'], ['A', '94-96'], ['A-', '90-93'],
            ['B+', '87-89'], ['B', '84-86'], ['B-', '80-83'],
            ['C+', '77-79'], ['C', '74-76'], ['C-', '70-73'],
            ['D+', '67-69'], ['D', '64-66'], ['D-', '60-63'],
            ['F', '0-59']
        ];
        
        const gradingCols = 3;
        const gradingColWidth = gradingWidth / gradingCols;
        const gradingRowHeight = 12;
        
        grading.forEach(([grade, range], index) => {
            const col = index % gradingCols;
            const row = Math.floor(index / gradingCols);
            const x = gradingX + (col * gradingColWidth) + 5;
            const y = commentsY + (row * gradingRowHeight) + 10;
            
            doc.fillColor(colors.text)
               .fontSize(9)
               .font('Helvetica-Bold')
               .text(`${grade}:`, x, y);
            
            doc.fillColor(colors.text)
               .fontSize(9)
               .font('Helvetica')
               .text(range, x + 25, y);
        });

        // --- Professional Footer ---
        const footerY = commentsY + commentsHeight + 30;
        const footerHeight = 40;
        
        doc.rect(margin, footerY, contentWidth, footerHeight)
           .fill(colors.primary)
           .stroke(colors.primary, 1);
        
        doc.fillColor('white')
           .fontSize(10)
           .font('Helvetica')
           .text('This report card is generated electronically and does not require a signature.', margin + 10, footerY + 10, { width: contentWidth - 20, align: 'center' });
        
        doc.fillColor('white')
           .fontSize(9)
           .font('Helvetica')
           .text(`Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin + 10, footerY + 25, { width: contentWidth - 20, align: 'center' });

        doc.end();
    } catch (err) {
        console.error(err);
        if (res.headersSent) {
            try {
                if (typeof doc !== 'undefined' && !doc._ending) doc.end();
            } catch (e) {}
            return;
        }
        res.status(500).json({ message: "Error generating report" });
    }
};

// Download student progress analysis (PDF)
const downloadProgressAnalysis = async (req, res) => {
    let doc;
    try {
        console.log('Starting PDF generation for student:', req.params.studentId);
        const studentId = req.params.studentId;
        const exams = await Exam.find({ studentId });
        console.log('Found exams:', exams.length);
        
        if (!exams || exams.length === 0) {
            console.log('No exams found for student:', studentId);
            return res.status(404).json({ message: 'No exams found for this student' });
        }
        
        // Get first exam for student info
        const sample = exams[0];
        const termTotals = { t1: { total: 0, count: 0 }, t2: { total: 0, count: 0 }, t3: { total: 0, count: 0 } };
        const subjectsMap = {};
        
        // Calculate term-wise totals
        exams.forEach(exam => {
            (exam.subjects || []).forEach(s => {
                const name = (s.subject || 'Unknown').trim();
                if (!subjectsMap[name]) subjectsMap[name] = { t1: [], t2: [], t3: [] };
                if (typeof s.term1 === 'number') { subjectsMap[name].t1.push(s.term1); termTotals.t1.total += s.term1; termTotals.t1.count++; }
                if (typeof s.term2 === 'number') { subjectsMap[name].t2.push(s.term2); termTotals.t2.total += s.term2; termTotals.t2.count++; }
                if (typeof s.term3 === 'number') { subjectsMap[name].t3.push(s.term3); termTotals.t3.total += s.term3; termTotals.t3.count++; }
            });
        });
        
        // Calculate overall term averages
        const overallTermAverages = {
            t1: termTotals.t1.count ? Number((termTotals.t1.total / termTotals.t1.count).toFixed(2)) : 0,
            t2: termTotals.t2.count ? Number((termTotals.t2.total / termTotals.t2.count).toFixed(2)) : 0,
            t3: termTotals.t3.count ? Number((termTotals.t3.total / termTotals.t3.count).toFixed(2)) : 0
        };

        const subjects = Object.keys(subjectsMap).map(name => {
            const arr = subjectsMap[name];
            const avg = arrVal => (arrVal && arrVal.length ? Math.round(arrVal.reduce((a, b) => a + b, 0) / arrVal.length) : null);
            const a1 = avg(arr.t1);
            const a2 = avg(arr.t2);
            const a3 = avg(arr.t3);
            let trend = 'Stable';
            const values = [a1, a2, a3].filter(v => v !== null);
            if (values.length >= 2) {
                if (values[values.length - 1] > values[0]) trend = 'Improving';
                else if (values[values.length - 1] < values[0]) trend = 'Declining';
            } 
            let recommendation = 'Maintain effort.';
            const latest = [a3, a2, a1].find(v => v !== null);
            if (latest !== undefined && latest !== null && latest < 65) recommendation = 'Provide extra practice and revision.';
            if (trend === 'Improving' && latest >= 75) recommendation = 'Good progress — continue current strategies.';

            return { name, a1, a2, a3, trend, recommendation };
        });

        // Create new PDF document with optimized settings
        doc = new PDFDocument({ 
            margin: 30, 
            size: 'A4',
            layout: 'portrait',
            autoFirstPage: true
        });
        
        const fileName = `ProgressAnalysis_${studentId}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);
 
        // Page dimensions
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 30;
        const contentWidth = pageWidth - (margin * 2);
        const contentHeight = pageHeight - (margin * 2);

        // Color scheme matching frontend Progress Analysis page
        const colors = {
            primary: '#00897b',        // Teal - main color
            secondary: '#00bfa5',      // Light teal - secondary color
            accent: '#e74c3c',         // Red - for warnings/errors
            warning: '#f39c12',       // Orange - for warnings
            text: '#2c3e50',          // Dark blue-gray - text color
            lightGray: '#f9f9f9',     // Light gray - alternating rows
            border: '#dee2e6',        // Light border
            cardBg: '#f0f9ff',        // Light blue - card backgrounds
            chartLine: '#00897b',     // Teal - chart line color
            chartFill: 'rgba(0, 137, 123, 0.1)', // Teal with transparency
            success: '#2e7d32',      // Green - for success states
            info: '#1976d2'           // Blue - for info states
        };

        // Header Section
        doc.rect(margin, margin, contentWidth, 80)
           .fill(colors.cardBg)
           .stroke(colors.border, 1);
        
        // School logo placeholder (you can add actual logo here)
        doc.circle(margin + 25, margin + 25, 20)
           .fill(colors.primary)
           .stroke(colors.primary, 2);
        
        doc.fillColor('white')
           .fontSize(16)
           .font('Helvetica-Bold')
           .text('W', margin + 20, margin + 18, { width: 10, align: 'center' });

        // School name and title
        doc.fillColor(colors.primary)
           .fontSize(20)
           .font('Helvetica-Bold')
           .text('WEBSTER INTERNATIONAL SCHOOL', margin + 60, margin + 15);
        
        doc.fillColor(colors.text)
           .fontSize(16)
           .font('Helvetica')
           .text('Student Progress Analysis Report', margin + 60, margin + 40);
        
        doc.fillColor(colors.secondary)
           .fontSize(12)
           .text(`Generated on: ${new Date().toLocaleDateString()}`, margin + 60, margin + 60);

        // Student Information Section
        const studentY = margin + 100;
        doc.fillColor(colors.text)
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('Student Information', margin, studentY);
        
        // Student info box
        doc.rect(margin, studentY + 20, contentWidth, 50)
           .fill('#ffffff')
           .stroke(colors.border, 1);
        
        const infoItems = [
            { label: 'Student Name:', value: sample.name },
            { label: 'Student ID:', value: sample.studentId },
            { label: 'Class:', value: `Grade ${sample.grade}` }
        ];
        
        const itemWidth = contentWidth / 3;
        infoItems.forEach((item, index) => {
            const x = margin + (index * itemWidth) + 15;
            doc.fillColor(colors.text)
               .fontSize(11)
               .font('Helvetica-Bold')
               .text(item.label, x, studentY + 35);
            doc.fillColor(colors.text)
               .fontSize(11)
               .font('Helvetica')
               .text(item.value, x, studentY + 50);
        });

        // Performance Summary Cards
        const cardsY = studentY + 90;
        const cardWidth = (contentWidth - 30) / 4;
        const cardHeight = 70;
        
        const performanceData = [
            { 
                title: '1st Term', 
                value: overallTermAverages.t1 || 0, 
                color: colors.success,  // Green for 1st term
                icon: '📊'
            },
            { 
                title: '2nd Term', 
                value: overallTermAverages.t2 || 0, 
                color: colors.info,     // Blue for 2nd term
                icon: '📈'
            },
            { 
                title: '3rd Term', 
                value: overallTermAverages.t3 || 0, 
                color: colors.warning,  // Orange for 3rd term
                icon: '📉'
            },
            { 
                title: 'Overall', 
                value: ((overallTermAverages.t1 || 0) + (overallTermAverages.t2 || 0) + (overallTermAverages.t3 || 0)) / 3, 
                color: colors.primary,  // Teal for overall
                icon: '🎯'
            }
        ];

        performanceData.forEach((card, index) => {
            const x = margin + (index * (cardWidth + 10));
            const y = cardsY;
            
            // Card background - matching frontend gradient style
            doc.rect(x, y, cardWidth, cardHeight)
               .fill(colors.cardBg)
               .stroke(colors.border, 1);
            
            // Card header
            doc.rect(x, y, cardWidth, 20)
               .fill(card.color);
            
            // Card content
            doc.fillColor('white')
               .fontSize(10)
               .font('Helvetica-Bold')
               .text(card.title, x + 5, y + 6, { width: cardWidth - 10, align: 'center' });
            
            doc.fillColor(card.color)
               .fontSize(24)
               .font('Helvetica-Bold')
               .text(typeof card.value === 'number' ? card.value.toFixed(1) : '0.0', x + 5, y + 30, { width: cardWidth - 10, align: 'center' });
            
            doc.fillColor(colors.text)
               .fontSize(8)
               .font('Helvetica')
               .text('Average Score', x + 5, y + 55, { width: cardWidth - 10, align: 'center' });
        });

        // Subject Performance Table
        const tableY = cardsY + 90;
        const baseRowHeight = 20; // Base row height
        const maxTableHeight = Math.min(300, contentHeight - (tableY - margin) - 200); // Reserve space for chart and recommendations
        const maxRows = Math.floor(maxTableHeight / baseRowHeight);
        
        // Table header
        doc.rect(margin, tableY, contentWidth, baseRowHeight)
           .fill(colors.primary);
        
        const colWidths = { 
            subject: contentWidth * 0.20,
            term1: contentWidth * 0.12,
            term2: contentWidth * 0.12,
            term3: contentWidth * 0.12,
            trend: contentWidth * 0.12,
            recommendation: contentWidth * 0.32
        };
        
        const headers = ['Subject', '1st Term', '2nd Term', '3rd Term', 'Trend', 'Recommendation'];
        let currentX = margin;
        
        headers.forEach((header, index) => {
            const width = Object.values(colWidths)[index];
            doc.fillColor('white')
               .fontSize(9)
               .font('Helvetica-Bold')
               .text(header, currentX + 5, tableY + 6, { width: width - 10, align: 'center' });
            currentX += width;
        });

        // Table rows - Show ALL subjects, but limit if too many to fit
        const displaySubjects = subjects.slice(0, Math.min(maxRows - 1, subjects.length));
        let currentTableY = tableY + baseRowHeight;
        
        displaySubjects.forEach((subject, index) => {
            const rowColor = index % 2 === 0 ? '#ffffff' : colors.lightGray;
            
            // Calculate dynamic row height based on recommendation text length
            const recommendationWidth = colWidths.recommendation - 10;
            const estimatedLines = Math.ceil(subject.recommendation.length / 40); // Rough estimate
            const dynamicRowHeight = Math.max(baseRowHeight, estimatedLines * 12);
            
            doc.rect(margin, currentTableY, contentWidth, dynamicRowHeight)
               .fill(rowColor)
               .stroke(colors.border, 0.5);
            
            currentX = margin;
            const rowData = [
                subject.name,
                subject.a1 !== null ? subject.a1.toString() : '-',
                subject.a2 !== null ? subject.a2.toString() : '-',
                subject.a3 !== null ? subject.a3.toString() : '-',
                subject.trend,
                subject.recommendation // Full recommendation text, no truncation
            ];
            
            rowData.forEach((data, dataIndex) => {
                const width = Object.values(colWidths)[dataIndex];
                const isRecommendation = dataIndex === 5; // Recommendation column
                
                if (isRecommendation) {
                    // For recommendation column, allow text wrapping
                    doc.fillColor(colors.text)
                       .fontSize(8)
                       .font('Helvetica')
                       .text(data, currentX + 5, currentTableY + 4, { 
                           width: width - 10, 
                           align: 'left',
                           lineGap: 1
                       });
                } else {
                    // For other columns, center align
                    doc.fillColor(colors.text)
                       .fontSize(8)
                       .font('Helvetica')
                       .text(data, currentX + 5, currentTableY + (dynamicRowHeight / 2) - 4, { width: width - 10, align: 'center' });
                }
                currentX += width;
            });
            
            currentTableY += dynamicRowHeight;
        });
        
        // Add note if subjects were truncated
        if (subjects.length > maxRows - 1) {
            const noteY = currentTableY + 10;
            doc.fillColor(colors.warning)
               .fontSize(8)
               .font('Helvetica-Bold')
               .text(`Note: Showing ${maxRows - 1} of ${subjects.length} subjects. Additional subjects available in detailed report.`, margin, noteY, { width: contentWidth, align: 'center' });
        }

        // Progress Chart (Line Chart) - Positioned higher
        const chartY = subjects.length > maxRows - 1 ? 
            currentTableY + 45 : // Account for note - further reduced spacing
            currentTableY + 35; // Further reduced spacing from table
        const chartHeight = 120;
        
        if (chartY + chartHeight < pageHeight - margin) {
            doc.fillColor(colors.text)
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Overall Progress Trend', margin, chartY - 5);
            
            // Chart background - matching frontend
            doc.rect(margin, chartY + 15, contentWidth, chartHeight)
               .fill(colors.cardBg)
               .stroke(colors.border, 1);
            
            // Chart dimensions
            const chartInnerWidth = contentWidth - 40;
            const chartInnerHeight = chartHeight - 40;
            const chartStartX = margin + 20;
            const chartStartY = chartY + 15 + 20; // Adjusted for new background position
            const chartEndX = chartStartX + chartInnerWidth;
            const chartEndY = chartStartY + chartInnerHeight;
            
            // Y-axis grid lines and labels
            const maxValue = Math.max(overallTermAverages.t1 || 0, overallTermAverages.t2 || 0, overallTermAverages.t3 || 0, 50);
            const minValue = Math.min(overallTermAverages.t1 || 0, overallTermAverages.t2 || 0, overallTermAverages.t3 || 0, 0);
            const valueRange = Math.max(maxValue - minValue, 20); // Ensure minimum range of 20
            
            // Draw horizontal grid lines
            doc.lineWidth(0.5).strokeColor('#e5e7eb');
            for (let i = 0; i <= 10; i++) {
                const y = chartEndY - (i / 10) * chartInnerHeight;
                doc.moveTo(chartStartX, y).lineTo(chartEndX, y).stroke();
                
                // Y-axis labels
                const value = minValue + (i / 10) * valueRange;
                doc.fillColor('#6b7280')
                   .fontSize(8)
                   .font('Helvetica')
                   .text(value.toFixed(0), chartStartX - 25, y - 4, { width: 20, align: 'right' });
            }
            
            // X-axis labels
        const termLabels = ['1st Term', '2nd Term', '3rd Term'];
            const labelSpacing = chartInnerWidth / 2;
            doc.fillColor('#6b7280')
               .fontSize(9)
               .font('Helvetica');
        termLabels.forEach((label, index) => {
                const labelX = chartStartX + (index * labelSpacing);
            doc.text(label, labelX - 20, chartEndY + 8, { width: 40, align: 'center' });
        });
            
            // Calculate data points
            const termValues = [overallTermAverages.t1 || 0, overallTermAverages.t2 || 0, overallTermAverages.t3 || 0];
        const points = termValues.map((value, index) => {
                const x = chartStartX + (index * labelSpacing);
                const y = chartEndY - ((value - minValue) / valueRange) * chartInnerHeight;
            return { x, y, value };
        });

            // Draw area fill
        doc.save();
        doc.moveTo(points[0].x, chartEndY);
        points.forEach(point => {
            doc.lineTo(point.x, point.y);
        });
        doc.lineTo(points[points.length - 1].x, chartEndY);
        doc.closePath();
            doc.fill(colors.primary, 0.1);
        doc.restore();

            // Draw trend line
            doc.lineWidth(3).strokeColor(colors.primary);
        doc.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            doc.lineTo(points[i].x, points[i].y);
        }
        doc.stroke();
            
            // Draw data points
        points.forEach(point => {
                doc.circle(point.x, point.y, 6).fill('#ffffff').stroke(colors.primary, 2);
                doc.circle(point.x, point.y, 3).fill(colors.primary);
                
                // Value labels above points
                doc.fillColor(colors.primary)
                   .fontSize(8)
                   .font('Helvetica-Bold')
                   .text(point.value.toFixed(1), point.x - 10, point.y - 20, { width: 20, align: 'center' });
            });
        }

        // Overall Recommendations
        const recY = Math.min(chartY + chartHeight + 30, pageHeight - margin - 60);
        
        doc.fillColor(colors.text)
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('Overall Recommendations', margin, recY);
        
        // Calculate overall recommendations
        let overallRec = 'Continue monitoring progress and provide targeted support where needed.';
        const vals = [overallTermAverages.t1, overallTermAverages.t2, overallTermAverages.t3].filter(v => v !== 0);
        if (vals.length >= 2) {
            if (vals[vals.length - 1] > vals[0]) overallRec = 'Student shows improvement — reinforce successful study habits and maintain current strategies.';
            else if (vals[vals.length - 1] < vals[0]) overallRec = 'Performance declined — consider remediation, extra tutoring, and review study methods.';
        }
        
        const lowSubjects = subjects.filter(s => {
            const latest = [s.a3, s.a2, s.a1].find(v => v !== null);
            return latest !== undefined && latest !== null && latest < 65;
        }).map(s => s.name);
        
        if (lowSubjects.length) overallRec += ` Focus areas: ${lowSubjects.join(', ')}.`;

        // Recommendations box - matching frontend
        doc.rect(margin, recY + 20, contentWidth, 40)
           .fill(colors.cardBg)
           .stroke(colors.primary, 1);
        
        doc.fillColor(colors.text)
           .fontSize(10)
           .font('Helvetica')
           .text(overallRec, margin + 10, recY + 30, { width: contentWidth - 20 });

        // Footer
        doc.fillColor(colors.text)
           .fontSize(8)
           .font('Helvetica')
           .text('This report was generated automatically by the Smart Alert System', margin, pageHeight - margin - 10, { width: contentWidth, align: 'center' });

        doc.end();
        console.log('Modern single-page PDF generation completed successfully');
    } catch (err) {
        console.error('Error in PDF generation:', err);
        try {
            if (doc && !doc._ending) doc.end();
        } catch (e) {
            console.error('Error ending document:', e);
        }
        if (!res.headersSent) {
            return res.status(500).json({ message: 'Error generating progress analysis PDF', error: err.message });
        }
    }
};

// Get student progress analysis data (JSON)
const getProgressAnalysis = async (req, res) => {
    try {
        const studentId = req.params.studentId;
        const exams = await Exam.find({ studentId });
        if (!exams || exams.length === 0) {
            return res.status(404).json({ message: 'No exams found for this student' });
        }

        const sample = exams[0];
        const termTotals = { t1: { total: 0, count: 0 }, t2: { total: 0, count: 0 }, t3: { total: 0, count: 0 } };
        const subjectsMap = {};
        //Calculate term-wise totals
        exams.forEach(exam => {
            (exam.subjects || []).forEach(s => {
                const name = (s.subject || 'Unknown').trim();
                if (!subjectsMap[name]) subjectsMap[name] = { t1: [], t2: [], t3: [] };
                if (typeof s.term1 === 'number') { subjectsMap[name].t1.push(s.term1); termTotals.t1.total += s.term1; termTotals.t1.count++; }
                if (typeof s.term2 === 'number') { subjectsMap[name].t2.push(s.term2); termTotals.t2.total += s.term2; termTotals.t2.count++; }
                if (typeof s.term3 === 'number') { subjectsMap[name].t3.push(s.term3); termTotals.t3.total += s.term3; termTotals.t3.count++; }
            });
        });

        const overallTermAverages = {
            t1: termTotals.t1.count ? Number((termTotals.t1.total / termTotals.t1.count).toFixed(2)) : 0,
            t2: termTotals.t2.count ? Number((termTotals.t2.total / termTotals.t2.count).toFixed(2)) : 0,
            t3: termTotals.t3.count ? Number((termTotals.t3.total / termTotals.t3.count).toFixed(2)) : 0
        };

        const subjects = Object.keys(subjectsMap).map(name => {
            const arr = subjectsMap[name];
            const avg = arrVal => (arrVal && arrVal.length ? Math.round(arrVal.reduce((a, b) => a + b, 0) / arrVal.length) : null);
            const a1 = avg(arr.t1);
            const a2 = avg(arr.t2);
            const a3 = avg(arr.t3);
            
            let trend = 'Stable';
            const values = [a1, a2, a3].filter(v => v !== null);
            if (values.length >= 2) {
                if (values[values.length - 1] > values[0]) trend = 'Improving';
                else if (values[values.length - 1] < values[0]) trend = 'Declining';
            }
            
            let recommendation = 'Maintain effort.';
            const latest = [a3, a2, a1].find(v => v !== null);
            if (latest !== undefined && latest !== null && latest < 65) recommendation = 'Provide extra practice and revision.';
            if (trend === 'Improving' && latest >= 75) recommendation = 'Good progress — continue current strategies.';

            return { 
                subject: name, 
                term1: a1, 
                term2: a2, 
                term3: a3, 
                trend, 
                recommendation 
            };
        });

        const overallProgress = overallTermAverages.t1 > 0 ? 
            ((overallTermAverages.t3 - overallTermAverages.t1) / overallTermAverages.t1 * 100) : 0;

        let overallRecommendations = 'Keep monitoring progress and provide targeted support where needed.';
        const vals = [overallTermAverages.t1, overallTermAverages.t2, overallTermAverages.t3].filter(v => v !== 0);
        if (vals.length >= 2) {
            if (vals[vals.length - 1] > vals[0]) overallRecommendations = 'Student shows improvement — reinforce successful study habits.';
            else if (vals[vals.length - 1] < vals[0]) overallRecommendations = 'Performance declined — consider remediation and extra tutoring.';
        }
        
        const lowSubjects = subjects.filter(s => {
            const latest = [s.term3, s.term2, s.term1].find(v => v !== null);
            return latest !== undefined && latest !== null && latest < 65;
        }).map(s => s.subject);
        
        if (lowSubjects.length) {
            overallRecommendations += ` Focus on: ${lowSubjects.join(', ')}.`;
        }
 
        const progressData = {
            studentId: sample.studentId,
            name: sample.name,
            grade: sample.grade,
            subjects,
            term1Avg: overallTermAverages.t1,
            term2Avg: overallTermAverages.t2,
            term3Avg: overallTermAverages.t3,
            overallProgress: Number(overallProgress.toFixed(1)),
            overallRecommendations
        };
        //Send progress analysis data
        res.status(200).json({ progressAnalysis: progressData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error generating progress analysis' });
    }
};
 //Export all functions
module.exports = {
    getAllExams,
    addExam,
    getById,
    getByStudentId,
    updateExam,
    deleteExam,
    downloadReport,
    downloadProgressAnalysis,
    getProgressAnalysis
};