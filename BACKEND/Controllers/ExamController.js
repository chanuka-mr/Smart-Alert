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

        // Create PDF
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `Report_${exam.studentId}.pdf`;

        //Set headers for PDF
        res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
        res.setHeader("Content-Type", "application/pdf");
        doc.pipe(res);

        // --- Header ---
        doc.fontSize(22).fillColor("#1F4E79").text("WEBSTER INTERNATIONAL SCHOOL", { align: "center" });
        doc.fontSize(14).fillColor("black").text("Report Card", { align: "center" });
        doc.moveDown(2);

        // --- Student Info ---
        doc.fontSize(11).fillColor("black");
        doc.text(`Name of Student: ${exam.name}`);
        doc.text(`Student ID: ${exam.studentId}`);
        doc.text(`Class: ${exam.grade}`);
        doc.text(`School Year: ${new Date().getFullYear()}`);
        doc.moveDown(2);

        // --- Subjects Table ---
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margins = doc.page.margins || { top: 50, bottom: 50, left: 50, right: 50 };
        const contentWidth = pageWidth - margins.left - margins.right;
        const contentHeight = pageHeight - margins.top - margins.bottom;

        const reservedHeight = 90 + 20 + 110;
        const availableTableHeight = Math.max(80, contentHeight - reservedHeight);

        const subjectsCount = Math.max(1, exam.subjects.length);
        const maxRowHeight = 28;
        const minRowHeight = 14;
        let rowHeight = Math.floor(availableTableHeight / (subjectsCount + 1));
        if (rowHeight > maxRowHeight) rowHeight = maxRowHeight;
        if (rowHeight < minRowHeight) rowHeight = minRowHeight;

        const tableLeft = margins.left;
        const tableW = contentWidth;
        const headerH = rowHeight;
        let y = doc.y;

        // Header Row
        doc.rect(tableLeft, y, tableW, headerH).fill("#1F4E79");
        const tableFontSize = Math.max(8, Math.min(11, rowHeight - 10));
        doc.fillColor("white").fontSize(tableFontSize);
        
        const colSubjectX = tableLeft + 10;
        const col1X = tableLeft + Math.floor(tableW * 0.45);
        const colGap = Math.floor((tableW - (col1X - tableLeft) - 20) / 6);
        doc.text("Subjects", colSubjectX, y + (headerH / 2) - 6);
        doc.text("1st", col1X, y + (headerH / 2) - 6);
        doc.text("G", col1X + colGap, y + (headerH / 2) - 6);
        doc.text("2nd", col1X + colGap * 2, y + (headerH / 2) - 6);
        doc.text("G", col1X + colGap * 3, y + (headerH / 2) - 6);
        doc.text("3rd", col1X + colGap * 4, y + (headerH / 2) - 6);
        doc.text("G", col1X + colGap * 5, y + (headerH / 2) - 6);

        y += headerH;

        // Subject Rows & total calculation
        let totalFinalMarks = 0;
        doc.fillColor("black").fontSize(tableFontSize);
        exam.subjects.forEach((s, i) => {
            const bgColor = i % 2 === 0 ? "#F2F6FB" : "#FFFFFF";
            doc.rect(tableLeft, y, tableW, rowHeight).fill(bgColor);
            doc.fillColor("black");
            doc.text(s.subject || "", colSubjectX, y + (rowHeight / 2) - 6, { width: col1X - colSubjectX - 4 });

            const val1 = typeof s.term1 === 'number' ? s.term1 : '';
            const val2 = typeof s.term2 === 'number' ? s.term2 : '';
            const val3 = typeof s.term3 === 'number' ? s.term3 : '';
            doc.text(val1, col1X, y + (rowHeight / 2) - 6);
            doc.text(getGrade(val1), col1X + colGap, y + (rowHeight / 2) - 6);
            doc.text(val2, col1X + colGap * 2, y + (rowHeight / 2) - 6);
            doc.text(getGrade(val2), col1X + colGap * 3, y + (rowHeight / 2) - 6);
            doc.text(val3, col1X + colGap * 4, y + (rowHeight / 2) - 6);
            doc.text(getGrade(val3), col1X + colGap * 5, y + (rowHeight / 2) - 6);

            const marks = [s.term1, s.term2, s.term3].filter(m => typeof m === 'number');
            const subjectFinal = marks.length > 0 ? Math.round(marks.reduce((a, b) => a + b, 0) / marks.length) : 0;
            totalFinalMarks += subjectFinal;

            y += rowHeight;
        });

        // Term-wise boxes
        const gap = 10;
        const boxesTotalWidth = contentWidth;
        let boxW = Math.floor((boxesTotalWidth - gap * 2) / 3);
        if (boxW > 200) boxW = 200;
        const boxX = tableLeft;
        const boxY = y + 12;
        const boxH = 68;
        //Calculate term-wise totals
        const termTotals = { t1: 0, t2: 0, t3: 0 };
        exam.subjects.forEach(s => {
            if (typeof s.term1 === 'number') termTotals.t1 += s.term1;
            if (typeof s.term2 === 'number') termTotals.t2 += s.term2;
            if (typeof s.term3 === 'number') termTotals.t3 += s.term3;
        });
        //Calculate average per subject
        const t1AvgPerSubject = exam.subjects.length > 0 ? (termTotals.t1 / exam.subjects.length) : 0;
        const t2AvgPerSubject = exam.subjects.length > 0 ? (termTotals.t2 / exam.subjects.length) : 0;
        const t3AvgPerSubject = exam.subjects.length > 0 ? (termTotals.t3 / exam.subjects.length) : 0;
        //Create boxes for term-wise totals
        const boxes = [
            { title: '1st Term', total: termTotals.t1, avg: t1AvgPerSubject },
            { title: '2nd Term', total: termTotals.t2, avg: t2AvgPerSubject },
            { title: '3rd Term', total: termTotals.t3, avg: t3AvgPerSubject }
        ];

        boxes.forEach((b, idx) => {
            const x = boxX + idx * (boxW + gap);
            doc.rect(x, boxY, boxW, boxH).fill('#F7FBFF');
            doc.rect(x, boxY, boxW, 20).fill('#1F4E79');
            doc.fillColor('white').fontSize(11).text(b.title, x + 8, boxY + 4);
            doc.fillColor('black').fontSize(10).text(`Total: ${b.total} / ${exam.subjects.length * 100}`, x + 8, boxY + 26);
            doc.text(`Average: ${b.avg.toFixed(2)}`, x + 8, boxY + 42);
            doc.lineWidth(1).strokeColor('#1F4E79').rect(x, boxY, boxW, boxH).stroke();
        });

        // Teacher's Comme  nts box
        const commentsBoxX = tableLeft;
        const verticalOffset = 24;
        const commentsBoxY = boxY + boxH + 14 + verticalOffset;
        const commentsBoxW = Math.min(420, contentWidth * 0.65);
        const commentsBoxH = 80;
        doc.fontSize(12).fillColor('black').text("Teacher's Comments & Feedback:", commentsBoxX, commentsBoxY - 18);
        doc.rect(commentsBoxX, commentsBoxY, commentsBoxW, commentsBoxH).stroke('#1F4E79');
        if (exam.feedback && exam.feedback.trim() !== '') {
            doc.fontSize(11).fillColor('black').text(exam.feedback, commentsBoxX + 8, commentsBoxY + 8, { width: commentsBoxW - 16 });
        }

        // Grading System box
        const gradingBoxW = Math.min(220, contentWidth - commentsBoxW - 20);
        let gradingBoxX = commentsBoxX + commentsBoxW + 12;
        let gradingBoxY = commentsBoxY + commentsBoxH - 10 + verticalOffset;
        let placeRight = gradingBoxW > 100 && (gradingBoxX + gradingBoxW <= margins.left + contentWidth + 5);
        if (!placeRight) {
            gradingBoxX = commentsBoxX;
            gradingBoxY = commentsBoxY + commentsBoxH + 10 + verticalOffset;
        }

        const grading = [
            ['A+', '97-100'], ['A', '94-96'], ['A-', '90-93'],
            ['B+', '87-89'], ['B', '84-86'], ['B-', '80-83'],
            ['C+', '77-79'], ['C', '74-76'], ['C-', '70-73'],
            ['D+', '67-69'], ['D', '64-66'], ['D-', '60-63'],
            ['F', '0-59']
        ];
        const lineHeight = 12;
        const headerHeight = 20;
        const padding = 6;
        const gradingBoxH = padding + headerHeight + grading.length * lineHeight + padding;

        doc.save();
        doc.rect(gradingBoxX, gradingBoxY - gradingBoxH + (placeRight ? commentsBoxH : 0), gradingBoxW, gradingBoxH).fill('#FBFDFF');
        doc.rect(gradingBoxX, gradingBoxY - gradingBoxH + (placeRight ? commentsBoxH : 0), gradingBoxW, headerHeight).fill('#1F4E79');
        doc.fillColor('white').fontSize(11).text('Grading System', gradingBoxX + 10, gradingBoxY - gradingBoxH + (placeRight ? commentsBoxH : 0) + 6);
        doc.lineWidth(1).strokeColor('#1F4E79').rect(gradingBoxX, gradingBoxY - gradingBoxH + (placeRight ? commentsBoxH : 0), gradingBoxW, gradingBoxH).stroke();
        doc.fillColor('black').fontSize(10);
        let gy2 = gradingBoxY - gradingBoxH + (placeRight ? commentsBoxH : 0) + headerHeight + 2;
        grading.forEach(([grade, range]) => {
            doc.text(`${grade}: ${range}`, gradingBoxX + 8, gy2);
            gy2 += lineHeight;
        });
        doc.restore();

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
        //Get first exam
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
        //Calculate overall term averages
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
        //Create new PDF document
        doc = new PDFDocument({ 
            margin: 40, 
            size: 'A4',
            layout: 'portrait'
        });
        const fileName = `ProgressAnalysis_${studentId}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);
        //Set headers for PDF
        doc.fillColor('#4CAF50').fontSize(24).font('Helvetica-Bold').text('WEBSTER INTERNATIONAL SCHOOL', { align: 'center', y: 50 });
        doc.fillColor('#333333').fontSize(18).font('Helvetica').text('Student Progress Analysis', { align: 'center', y: 80 });
        doc.strokeColor('#4CAF50').lineWidth(1).moveTo(40, 110).lineTo(doc.page.width - 40, 110).stroke();
        doc.moveDown(3);
 
        const pageWidth = doc.page.width;
        const pageMargins = doc.page.margins || { left: 40, right: 40 };
        const contentW = pageWidth - pageMargins.left - pageMargins.right;
        const startX = pageMargins.left;

        // Student Info Section
        const infoY = doc.y;
        doc.fillColor('#4CAF50').fontSize(12).font('Helvetica-Bold');
        doc.text('Name of Student:', startX, infoY);
        doc.fillColor('#333333').fontSize(12).font('Helvetica').text(sample.name, startX + 120, infoY);
        doc.fillColor('#4CAF50').fontSize(12).font('Helvetica-Bold');
        doc.text('Student ID:', startX, infoY + 20);
        doc.fillColor('#333333').fontSize(12).font('Helvetica').text(sample.studentId, startX + 120, infoY + 20);
        doc.fillColor('#4CAF50').fontSize(12).font('Helvetica-Bold');
        doc.text('Class:', startX, infoY + 40);
        doc.fillColor('#333333').fontSize(12).font('Helvetica').text(`Class ${sample.grade}`, startX + 120, infoY + 40);

        doc.moveDown(2.5);

        // Term Summary Cards
        const cardY = doc.y;
        const cardW = Math.floor((contentW - 30) / 4);
        const cardH = 60;
        
        const cardData = [
            { title: '1st Term Average', value: overallTermAverages.t1, color: '#4CAF50', bgColor: '#f0f9ff' },
            { title: '2nd Term Average', value: overallTermAverages.t2, color: '#2196F3', bgColor: '#f0f9ff' },
            { title: '3rd Term Average', value: overallTermAverages.t3, color: '#FFC107', bgColor: '#f0f9ff' },
            { title: 'Overall Progress', value: ((overallTermAverages.t3 - overallTermAverages.t1) / overallTermAverages.t1 * 100), color: '#4CAF50', bgColor: '#f0f9ff' }
        ];
 
        cardData.forEach((card, i) => {
            const x = startX + i * (cardW + 10);
            doc.rect(x, cardY, cardW, cardH).fill(card.bgColor).stroke('#e8f5e8', 1);
            doc.rect(x, cardY, cardW, 4).fill(card.color);
            doc.fillColor('#4CAF50').fontSize(10).font('Helvetica-Bold');
            doc.text(card.title, x + 8, cardY + 12, { width: cardW - 16, align: 'center' });
            doc.fillColor(card.color).fontSize(18).font('Helvetica-Bold');
            const displayValue = i === 3 ? `${card.value.toFixed(1)}%` : card.value.toFixed(2);
            doc.text(displayValue, x + 8, cardY + 28, { width: cardW - 16, align: 'center' });
        });

        doc.moveDown(2);

        // Table
        const tableY = doc.y;
        const colWidths = { 
            subject: Math.floor(contentW * 0.18), 
            term1: Math.floor(contentW * 0.12), 
            term2: Math.floor(contentW * 0.12), 
            term3: Math.floor(contentW * 0.12), 
            trend: Math.floor(contentW * 0.16),
            recommendation: Math.floor(contentW * 0.30)
        };
        const headerH = 40;
        const rowH = 35;
        
        doc.rect(startX, tableY, contentW, headerH).fill('#4CAF50');
        doc.fillColor('white').fontSize(12).font('Helvetica-Bold');
        doc.text('Subject', startX + 10, tableY + 15, { width: colWidths.subject - 20, align: 'left' });
        doc.text('1st Term', startX + colWidths.subject + 10, tableY + 15, { width: colWidths.term1 - 20, align: 'center' });
        doc.text('2nd Term', startX + colWidths.subject + colWidths.term1 + 10, tableY + 15, { width: colWidths.term2 - 20, align: 'center' });
        doc.text('3rd Term', startX + colWidths.subject + colWidths.term1 + colWidths.term2 + 10, tableY + 15, { width: colWidths.term3 - 20, align: 'center' });
        doc.text('Trend', startX + colWidths.subject + colWidths.term1 + colWidths.term2 + colWidths.term3 + 10, tableY + 15, { width: colWidths.trend - 20, align: 'center' });
        doc.text('Recommendation', startX + colWidths.subject + colWidths.term1 + colWidths.term2 + colWidths.term3 + colWidths.trend + 10, tableY + 15, { width: colWidths.recommendation - 20, align: 'left' });

        let currentY = tableY + headerH;
        for (let i = 0; i < subjects.length; i++) {
            const s = subjects[i];
            const rowColor = i % 2 === 0 ? '#ffffff' : '#f8fffe';
            doc.rect(startX, currentY, contentW, rowH).fill(rowColor);
            doc.rect(startX, currentY, contentW, rowH).stroke('#e0e0e0', 0.5);
            
            doc.fillColor('black').fontSize(11).font('Helvetica-Bold');
            doc.text(s.name, startX + 10, currentY + 12, { width: colWidths.subject - 20, align: 'left' });
            
            doc.fillColor('black').fontSize(11).font('Helvetica');
            doc.text(s.a1 !== null ? s.a1.toString() : '-', startX + colWidths.subject + 10, currentY + 12, { width: colWidths.term1 - 20, align: 'center' });
            doc.text(s.a2 !== null ? s.a2.toString() : '-', startX + colWidths.subject + colWidths.term1 + 10, currentY + 12, { width: colWidths.term2 - 20, align: 'center' });
            doc.text(s.a3 !== null ? s.a3.toString() : '-', startX + colWidths.subject + colWidths.term1 + colWidths.term2 + 10, currentY + 12, { width: colWidths.term3 - 20, align: 'center' });
            doc.text(s.trend, startX + colWidths.subject + colWidths.term1 + colWidths.term2 + colWidths.term3 + 10, currentY + 12, { width: colWidths.trend - 20, align: 'center' });
            doc.text(s.recommendation, startX + colWidths.subject + colWidths.term1 + colWidths.term2 + colWidths.term3 + colWidths.trend + 10, currentY + 12, { width: colWidths.recommendation - 20, align: 'left' });
            
            currentY += rowH;
        }

        // Progress Chart
        const chartY = currentY + 20;
        const chartHeight = 150;
        const chartWidth = contentW;
        const chartInnerHeight = chartHeight - 20;

        doc.fillColor('#4CAF50').fontSize(14).font('Helvetica-Bold').text('Overall Progress Trend', startX, chartY);
        
        const chartStartY = chartY + 20;
        const chartEndY = chartStartY + chartInnerHeight;

        doc.rect(startX, chartStartY, chartWidth, chartInnerHeight).fill('#ffffff').stroke('#e0e0e0', 1);

        const maxScore = 100;
        const ticks = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        doc.lineWidth(0.5).strokeColor('#cccccc');
        
        ticks.forEach(t => {
            const ty = chartEndY - Math.round((t / maxScore) * chartInnerHeight);
            doc.moveTo(startX, ty).lineTo(startX + chartWidth, ty).stroke();
        });

        doc.fillColor('#666666').fontSize(9);
        ticks.forEach(t => {
            const ty = chartEndY - Math.round((t / maxScore) * chartInnerHeight);
            doc.text(String(t), startX - 25, ty - 4, { width: 20, align: 'right' });
        });
        
        const termLabels = ['1st Term', '2nd Term', '3rd Term'];
        const labelSpacing = chartWidth / 3;
        doc.fillColor('#666666').fontSize(9);
        termLabels.forEach((label, index) => {
            const labelX = startX + (index * labelSpacing) + (labelSpacing / 2);
            doc.text(label, labelX - 20, chartEndY + 8, { width: 40, align: 'center' });
        });
        //Calculate term values
        const termValues = [overallTermAverages.t1, overallTermAverages.t2, overallTermAverages.t3];
        const points = termValues.map((value, index) => {
            const x = startX + (index * labelSpacing) + (labelSpacing / 2);
            const y = chartEndY - Math.round((value / maxScore) * chartInnerHeight);
            return { x, y, value };
        });

        doc.save();
        doc.moveTo(points[0].x, chartEndY);
        points.forEach(point => {
            doc.lineTo(point.x, point.y);
        });
        doc.lineTo(points[points.length - 1].x, chartEndY);
        doc.closePath();
        doc.fill('#4CAF50', 0.1);
        doc.restore();

        doc.lineWidth(3).strokeColor('#4CAF50');
        doc.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            doc.lineTo(points[i].x, points[i].y);
        }
        doc.stroke();
        //Create points for chart
        points.forEach(point => {
            doc.circle(point.x, point.y, 6).fill('#ffffff').stroke('#4CAF50', 2);
            doc.circle(point.x, point.y, 3).fill('#4CAF50');
            doc.fillColor('#4CAF50').fontSize(8).font('Helvetica-Bold');
            doc.text(point.value.toFixed(1), point.x - 10, point.y - 15, { width: 20, align: 'center' });
        });

        const recY = chartEndY + 30;
        doc.fillColor('#4CAF50').fontSize(14).font('Helvetica-Bold').text('Overall Recommendations', startX, recY);
        //Calculate overall recommendations
        let overallRec = 'Keep monitoring progress and provide targeted support where needed.';
        const vals = [overallTermAverages.t1, overallTermAverages.t2, overallTermAverages.t3].filter(v => v !== 0);
        if (vals.length >= 2) {
            if (vals[vals.length - 1] > vals[0]) overallRec = 'Student shows improvement — reinforce successful study habits.';
            else if (vals[vals.length - 1] < vals[0]) overallRec = 'Performance declined — consider remediation and extra tutoring.';
        }
        //Calculate low subjects
        const lowSubjects = subjects.filter(s => {
            const latest = [s.a3, s.a2, s.a1].find(v => v !== null);
            return latest !== undefined && latest !== null && latest < 65;
        }).map(s => s.name);
        if (lowSubjects.length) overallRec += ` Focus on: ${lowSubjects.join(', ')}.`;

        doc.fillColor('#333333').fontSize(11).font('Helvetica').text(overallRec, startX, recY + 20, { width: contentW });

        doc.end();
        console.log('Clean frontend-matching PDF generation completed successfully');
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