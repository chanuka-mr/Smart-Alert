const TimeTable = require("../Model/TimeTableModel");
const PDFDocument = require('pdfkit');

// Get all timetables
const getAllTimeTables = async (req, res, next) => {
    let timetables;
    try {
        timetables = await TimeTable.find();
    } catch (err) {
        console.log(err);
    }
    if (!timetables) {
        return res.status(404).json({ message: "No timetable found" });
    }
    return res.status(200).json({ timetables });
};

// Get filtered timetables by grade and class class
const getFilteredTimeTables = async (req, res, next) => {
    const { grade, classSection } = req.query;
    
    let filter = {};
    
    // Handle both old and new field names
    if (grade && !isNaN(parseInt(grade))) {
        const gradeNum = parseInt(grade);
        filter.$or = [
            { grade: gradeNum },
            { classLevel: gradeNum }
        ];
    }
    //Handle class section
    if (classSection && classSection.trim() !== '') {
        const classFilter = { $or: [{ class: classSection }, { section: classSection }] };
        
        if (filter.$or) {
            // If we already have grade filter, combine with class filter
            filter = {
                $and: [
                    { $or: filter.$or },
                    classFilter
                ]
            };
        } else {
            filter = classFilter;
        }
    }
    //Get timetables
    let timetables;
    try {
        timetables = await TimeTable.find(filter);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error fetching timetables" });
    }
    
    return res.status(200).json({ timetables });
};

// Add a new timetable
const addTimeTable = async (req, res, next) => {
    const { examName, class: classSection, grade, subject, examDate, examTime, hall } = req.body;

    //  Validate required fields
    if (!examName || !classSection || !grade || !subject || !examDate || !examTime || !hall) {
        return res.status(400).json({ 
            message: "Missing required fields. Please provide: examName, class, grade, subject, examDate, examTime, hall" 
        });
    }

    // Validate grade is a number between 1-11
    if (typeof grade !== 'number' || grade < 1 || grade > 11) {
        return res.status(400).json({ 
            message: "grade must be a number between 1 and 11" 
        });
    }

    // Validate class is a valid letter
    if (!['A', 'B', 'C', 'D', 'E'].includes(classSection)) {
        return res.status(400).json({ 
            message: "class must be one of: A, B, C, D, E" 
        });
    }

    // Calculate category based on grade
    const category = (grade >= 1 && grade <= 5) ? "Primary" : "Secondary";
    const classSectionFormatted = `${grade}-${classSection}`;

    let timetable;
    try {
        timetable = new TimeTable({
            examName,
            class: classSection,
            grade,
            classSection: classSectionFormatted,
            category,
            subject,
            examDate,
            examTime,
            hall
        });
        await timetable.save();
    } catch (err) {
        console.log("Error saving timetable:", err);
        return res.status(500).json({ message: "Unable to add timetable", error: err.message });
    }

    if (!timetable) {
        return res.status(500).json({ message: "Unable to add timetable" });
    }
    return res.status(200).json({ timetable });
};

// Get timetable by ID
const getById = async (req, res, next) => {
    const id = req.params.id;
    let timetable;
    try {
        timetable = await TimeTable.findById(id);
    } catch (err) {
        console.log(err);
    }
    if (!timetable) {
        return res.status(404).json({ message: "No timetable found" });
    }
    return res.status(200).json({ timetable });
};

// Update timetable
const updateTimeTable = async (req, res, next) => {
    const { examName, class: classSection, grade, subject, examDate, examTime, hall } = req.body;
    const id = req.params.id;

    // Calculate category based on grade
    const category = (grade >= 1 && grade <= 5) ? "Primary" : "Secondary";
    const classSectionFormatted = `${grade}-${classSection}`;

    let timetable;
    try {
        timetable = await TimeTable.findByIdAndUpdate(id, {
            examName,
            class: classSection,
            grade,
            classSection: classSectionFormatted,
            category,
            subject,
            examDate,
            examTime,
            hall
        });
        timetable = await timetable.save();
    } catch (err) {
        console.log(err);
    }
    if (!timetable) {
        return res.status(404).json({ message: "Unable to update timetable" });
    }
    return res.status(200).json({ timetable });
};

// Delete timetable
const deleteTimeTable = async (req, res, next) => {
    const id = req.params.id;
    let timetable;
    try {
        timetable = await TimeTable.findByIdAndDelete(id);
    } catch (err) {
        console.log(err);
    }
    if (!timetable) {
        return res.status(404).json({ message: "Unable to delete timetable" });
    }
    return res.status(200).json({ timetable });
};

// Helper function to create a properly formatted table
const createFormattedTable = (doc, timetables, title) => {
    // Header
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown(1.5);

    // Table setup
    const startX = 50;
    const startY = doc.y;
    const rowHeight = 25;
    const colWidths = { examName: 100, subject: 120, date: 80, time: 100, hall: 80 };
    const totalWidth = Object.values(colWidths).reduce((sum, width) => sum + width, 0);
    
    // Draw table headers
    let headerX = startX;
    doc.fillColor('#00897b').rect(startX, startY, totalWidth, rowHeight).fill();
    
    doc.fillColor('white').fontSize(12).font('Helvetica-Bold');
    doc.text('Exam Name', headerX + 5, startY + 8, { width: colWidths.examName - 10, align: 'center' });
    headerX += colWidths.examName;
    
    doc.text('Subject', headerX + 5, startY + 8, { width: colWidths.subject - 10, align: 'center' });
    headerX += colWidths.subject;
    
    doc.text('Date', headerX + 5, startY + 8, { width: colWidths.date - 10, align: 'center' });
    headerX += colWidths.date;
    
    doc.text('Time', headerX + 5, startY + 8, { width: colWidths.time - 10, align: 'center' });
    headerX += colWidths.time;
    
    doc.text('Hall', headerX + 5, startY + 8, { width: colWidths.hall - 10, align: 'center' });
    
    // Draw table data rows
    doc.fillColor('black').fontSize(10).font('Helvetica');
    let currentY = startY + rowHeight;
    
    timetables.forEach((entry, index) => {
        // Check if we need a new page
        if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom - 40) {
            doc.addPage();
            currentY = doc.page.margins.top;
        }
        
        // Alternate row colors
        if (index % 2 === 0) {
            doc.fillColor('#f5f5f5').rect(startX, currentY, totalWidth, rowHeight).fill();
        } else {
            doc.fillColor('white').rect(startX, currentY, totalWidth, rowHeight).fill();
        }
        
        // Draw row data
        let dataX = startX;
        doc.fillColor('black');
        
        doc.text(entry.examName || '-', dataX + 5, currentY + 8, { width: colWidths.examName - 10, align: 'left' });
        dataX += colWidths.examName;
        
        doc.text(entry.subject || '-', dataX + 5, currentY + 8, { width: colWidths.subject - 10, align: 'left' });
        dataX += colWidths.subject;
        
        const dateStr = entry.examDate ? new Date(entry.examDate).toLocaleDateString() : '-';
        doc.text(dateStr, dataX + 5, currentY + 8, { width: colWidths.date - 10, align: 'center' });
        dataX += colWidths.date;
        
        doc.text(entry.examTime || '-', dataX + 5, currentY + 8, { width: colWidths.time - 10, align: 'center' });
        dataX += colWidths.time;
        
        doc.text(entry.hall || '-', dataX + 5, currentY + 8, { width: colWidths.hall - 10, align: 'center' });
        
        currentY += rowHeight;
    });
    
    // Draw table borders
    doc.strokeColor('#cccccc').lineWidth(1);
    
    // Vertical lines
    let borderX = startX;
    for (let i = 0; i <= Object.keys(colWidths).length; i++) {
        doc.moveTo(borderX, startY).lineTo(borderX, currentY).stroke();
        if (i < Object.keys(colWidths).length) {
            borderX += Object.values(colWidths)[i];
        }
    }
    
    // Horizontal lines
    for (let i = 0; i <= timetables.length + 1; i++) {
        const y = startY + (i * rowHeight);
        doc.moveTo(startX, y).lineTo(startX + totalWidth, y).stroke();
    }
};

// Download class-class-wise timetable PDF
const downloadTimeTableByClassSection = async (req, res, next) => {
    try {
        const classSection = req.params.classSection;
        if (!classSection) return res.status(400).json({ message: 'Class-Section parameter required' });

        const timetables = await TimeTable.find({ classSection }).sort({ examDate: 1 });
        if (!timetables || timetables.length === 0) return res.status(404).json({ message: 'No timetable entries for this class-class' });

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const fileName = `TimeTable_${classSection}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // Header
        doc.fontSize(18).fillColor('#1F4E79').text('WEBSTER INTERNATIONAL SCHOOL', { align: 'center' });
        doc.fontSize(14).fillColor('black').text(`Class-Section ${classSection} - Time Table`, { align: 'center' });
        doc.moveDown(1.5);

        // Use helper function to create formatted table
        createFormattedTable(doc, timetables, '');

        doc.end();
    } catch (err) {
        console.error(err);
        if (res.headersSent) {
            try { if (doc && !doc._ending) doc.end(); } catch (e) {}
            return;
        }
        res.status(500).json({ message: 'Error generating class-class timetable' });
    }
};

// Download filtered timetable PDF by grade and class class
const downloadFilteredTimeTable = async (req, res, next) => {
    try {
        const { grade, classSection } = req.query;
        
        if (!grade) {
            return res.status(400).json({ message: 'Grade parameter is required' });
        }

        // Validate and convert grade to number
        if (isNaN(parseInt(grade))) {
            return res.status(400).json({ message: 'Grade must be a valid number' });
        }
        const gradeNum = parseInt(grade);

        // Build query based on whether classSection is provided
        let query;
        if (classSection) {
            // Find timetables matching both grade and class (handle both old and new field names)
            query = { 
                $and: [
                    { $or: [{ grade: gradeNum }, { classLevel: gradeNum }] },
                    { $or: [
                        { classSection: classSection },
                        { class: classSection },
                        { section: classSection },
                        // Handle case where classSection is like "5-A" but we need to match class "A" for grade 5
                        { $and: [
                            { class: classSection.split('-')[1] },
                            { $or: [{ grade: gradeNum }, { classLevel: gradeNum }] }
                        ]}
                    ]}
                ]
            };
        } else {
            // Find timetables matching only grade (all classes)
            query = { 
                $or: [{ grade: gradeNum }, { classLevel: gradeNum }] 
            };
        }

        const timetables = await TimeTable.find(query).sort({ examDate: 1 });
        
        if (!timetables || timetables.length === 0) {
            const errorMessage = classSection 
                ? `No timetable entries found for Grade ${gradeNum}, Section ${classSection}`
                : `No timetable entries found for Grade ${gradeNum}`;
            return res.status(404).json({ message: errorMessage });
        }

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const fileName = classSection 
            ? `TimeTable_${gradeNum}_${classSection}.pdf`
            : `TimeTable_Grade_${gradeNum}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // Use helper function to create formatted table
        const title = classSection 
            ? `TimeTable - Grade ${gradeNum}, Section ${classSection}`
            : `TimeTable - Grade ${gradeNum} (All Classes)`;
        createFormattedTable(doc, timetables, title);

        doc.end();
    } catch (err) {
        console.error(err);
        if (res.headersSent) {
            try { if (doc && !doc._ending) doc.end(); } catch (e) {}
            return;
        }
        res.status(500).json({ message: 'Error generating timetable PDF' });
    }
};

// Download hall arrangement for a given grade and class
const downloadHallArrangementByGrade = async (req, res, next) => {
    try {
        const grade = req.params.grade;
        const { class: classSection } = req.query;
        
        if (!grade) return res.status(400).json({ message: 'Grade parameter required' });
        if (!classSection) return res.status(400).json({ message: 'Class parameter required' });

        // Validate and convert grade to number
        if (isNaN(parseInt(grade))) {
            return res.status(400).json({ message: 'Grade must be a valid number' });
        }
        const gradeNum = parseInt(grade);

        // Find timetables matching grade and class (handle both old and new field names)
        const timetables = await TimeTable.find({ 
            $and: [
                { $or: [{ grade: gradeNum }, { classLevel: gradeNum }] },
                { $or: [
                    { class: classSection },
                    { section: classSection }
                ]}
            ]
        }).sort({ hall: 1, examDate: 1 });
        
        if (!timetables || timetables.length === 0) {
            return res.status(404).json({ message: `No timetable entries found for Grade ${gradeNum}, Class ${classSection}` });
        }

        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const fileName = `HallArrangement_${gradeNum}_${classSection}.pdf`;
        res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);

        // Header
        doc.fontSize(20).text(`Hall Arrangement - Grade ${gradeNum}, Class ${classSection}`, { align: 'center' });
        doc.moveDown(1);

        // Group by hall
        const byHall = {};
        timetables.forEach(entry => {
            const hallName = entry.hall || 'Unassigned';
            if (!byHall[hallName]) byHall[hallName] = [];
            byHall[hallName].push(entry);
        });

        // Create hall arrangement layout
        Object.keys(byHall).forEach(hallName => {
            if (doc.y > doc.page.height - doc.page.margins.bottom - 100) doc.addPage();
            
            doc.fontSize(16).fillColor('#00897b').text(hallName, { align: 'left' });
            doc.moveDown(0.5);

            // Table setup for hall
            const startX = 50;
            const startY = doc.y;
            const rowHeight = 20;
            const colWidths = { classSection: 80, subject: 120, date: 80, time: 100 };
            const totalWidth = Object.values(colWidths).reduce((sum, width) => sum + width, 0);
            
            // Draw table headers
            let headerX = startX;
            doc.fillColor('#00897b').rect(startX, startY, totalWidth, rowHeight).fill();
            
            doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
            doc.text('Class-Section', headerX + 5, startY + 5, { width: colWidths.classSection - 10, align: 'center' });
            headerX += colWidths.classSection;
            
            doc.text('Subject', headerX + 5, startY + 5, { width: colWidths.subject - 10, align: 'center' });
            headerX += colWidths.subject;
            
            doc.text('Date', headerX + 5, startY + 5, { width: colWidths.date - 10, align: 'center' });
            headerX += colWidths.date;
            
            doc.text('Time', headerX + 5, startY + 5, { width: colWidths.time - 10, align: 'center' });
            
            // Draw table data rows
            doc.fillColor('black').fontSize(9).font('Helvetica');
            let currentY = startY + rowHeight;
            
            byHall[hallName].forEach((entry, index) => {
                // Check if we need a new page
                if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom - 40) {
                    doc.addPage();
                    currentY = doc.page.margins.top;
                }
                
                // Alternate row colors
                if (index % 2 === 0) {
                    doc.fillColor('#f5f5f5').rect(startX, currentY, totalWidth, rowHeight).fill();
                } else {
                    doc.fillColor('white').rect(startX, currentY, totalWidth, rowHeight).fill();
                }
                
                // Draw row data
                let dataX = startX;
                doc.fillColor('black');
                
                doc.text(entry.classSection || `${entry.grade}-${entry.class}`, dataX + 5, currentY + 5, { width: colWidths.classSection - 10, align: 'center' });
                dataX += colWidths.classSection;
                
                doc.text(entry.subject || '-', dataX + 5, currentY + 5, { width: colWidths.subject - 10, align: 'left' });
                dataX += colWidths.subject;
                
                const dateStr = entry.examDate ? new Date(entry.examDate).toLocaleDateString() : '-';
                doc.text(dateStr, dataX + 5, currentY + 5, { width: colWidths.date - 10, align: 'center' });
                dataX += colWidths.date;
                
                doc.text(entry.examTime || '-', dataX + 5, currentY + 5, { width: colWidths.time - 10, align: 'center' });
                
                currentY += rowHeight;
            });
            
            // Draw table borders
            doc.strokeColor('#cccccc').lineWidth(0.5);
            
            // Vertical lines
            let borderX = startX;
            for (let i = 0; i <= Object.keys(colWidths).length; i++) {
                doc.moveTo(borderX, startY).lineTo(borderX, currentY).stroke();
                if (i < Object.keys(colWidths).length) {
                    borderX += Object.values(colWidths)[i];
                }
            }
            
            // Horizontal lines
            for (let i = 0; i <= byHall[hallName].length + 1; i++) {
                const y = startY + (i * rowHeight);
                doc.moveTo(startX, y).lineTo(startX + totalWidth, y).stroke();
            }

            doc.moveDown(1);
        });

        doc.end();
    } catch (err) {
        console.error(err);
        if (res.headersSent) {
            try { if (doc && !doc._ending) doc.end(); } catch (e) {}
            return;
        }
        res.status(500).json({ message: 'Error generating hall arrangement' });
    }
};

// Migration function to update existing records
const migrateTimeTableFields = async (req, res, next) => {
    try {
        console.log('Starting timetable field migration...');
        
        // Find all records with old field names
        const oldRecords = await TimeTable.find({
            $or: [
                { section: { $exists: true } },
                { classLevel: { $exists: true } }
            ]
        });
        
        console.log(`Found ${oldRecords.length} records to migrate`);
        
        let updatedCount = 0;
        
        for (const record of oldRecords) {
            const updateData = {};
            
            // Migrate section to class
            if (record.section) {
                updateData.class = record.section;
            }
            
            // Migrate classLevel to grade
            if (record.classLevel) {
                updateData.grade = record.classLevel;
            }
            
            // Update the record and remove old fields
            await TimeTable.findByIdAndUpdate(
                record._id,
                { 
                    $set: updateData,
                    $unset: { section: "", classLevel: "" }
                },
                { new: true }
            );
            
            updatedCount++;
            console.log(`Updated record ${record._id}`);
        }
        
        console.log(`Migration completed. Updated ${updatedCount} records`);
        
        res.status(200).json({
            success: true,
            message: `Successfully migrated ${updatedCount} timetable records`,
            updatedCount: updatedCount,
            totalRecords: oldRecords.length
        });
        
    } catch (error) {
        console.error('Error during migration:', error);
        res.status(500).json({
            success: false,
            message: 'Error during migration',
            error: error.message
        });
    }
};

module.exports = {
  getAllTimeTables,
  getFilteredTimeTables,
  addTimeTable,
  getById,
  updateTimeTable,
  deleteTimeTable,
  downloadTimeTableByClassSection,
  downloadHallArrangementByGrade,
  downloadFilteredTimeTable,
  migrateTimeTableFields
};