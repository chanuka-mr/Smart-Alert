
// Import the Notice model and required modules for file handling
const Notice = require("../Model/NoticeModel");
const fs = require('fs'); // For file system operations
const path = require('path'); // For file path handling

// Get all notices from the database
const getAllNotice = async (req, res, next) => {
    let notices;
    try {
        // Fetch all notices but exclude the Base64 data to reduce payload size
        // Only include attachment metadata (filename, contentType, size)
        notices = await Notice.find().select('-attachment.data');
    } catch (err) {
        console.log(err);
    }
    // If no notices found, return 404
    if (!notices) {
        return res.status(404).json({ message: "Notice not found" });
    }
    // Return all notices
    return res.status(200).json({ notices });
};

// Add a new notice to the database
const addNotices = async (req, res, next) => {
    const { title, notice, createdBy, category, publishedAt, updatedAt } = req.body;
    let attachment = null;
    
    // Handle file upload if present
    if (req.file) {
        // Convert file to Base64 and store in database
        const fileData = fs.readFileSync(req.file.path);
        const base64Data = fileData.toString('base64');
        
        attachment = {
            data: base64Data,
            contentType: req.file.mimetype,
            filename: req.file.originalname,
            size: req.file.size
        };
        
        // Delete the temporary file after converting to Base64
        fs.unlinkSync(req.file.path);
    } else if (req.body.attachment) {
        // If attachment is sent as JSON (already Base64)
        attachment = req.body.attachment;
    }
    
    let notices;
    try {
        notices = new Notice({ title, notice, attachment, createdBy, category, publishedAt, updatedAt });
        await notices.save(); // Save new notice
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error saving notice", error: err.message });
    }
    // If not inserted, return error
    if (!notices) {
        return res.status(404).json({ massage: "unable to add Notice" });
    }
    return res.status(200).json({ notices });
};

// Get a notice by its ID
const getById = async (req, res, next) => {
    const id = req.params.id;
    let notice;
    try {
        notice = await Notice.findById(id); // Find notice by ID
    } catch (err) {
        console.log(err);
    }
    // If not found, return error
    if (!notice) {
        return res.status(404).json({ massage: "Notice not found" });
    }
    return res.status(200).json({ notice });
}

// Update an existing notice
const updateNotice = async (req, res, next) => {
    const id = req.params.id;
    let { title, notice, attachment, createdBy, category, publishedAt, updatedAt } = req.body;

    // Find existing notice
    let existingNotice = await Notice.findById(id);
    if (!existingNotice) {
        return res.status(404).json({ massage: "Notice not found" });
    }

    // If a new file is uploaded, convert to Base64
    if (req.file) {
        const fileData = fs.readFileSync(req.file.path);
        const base64Data = fileData.toString('base64');
        
        attachment = {
            data: base64Data,
            contentType: req.file.mimetype,
            filename: req.file.originalname,
            size: req.file.size
        };
        
        // Delete the temporary file
        fs.unlinkSync(req.file.path);
    } else if (attachment === "" || attachment === null) {
        // Remove attachment if explicitly set to empty
        attachment = null;
    } else if (typeof attachment === 'string') {
        // Keep existing attachment if no change
        attachment = existingNotice.attachment;
    }

    let updatedNotice;
    try {
        updatedNotice = await Notice.findByIdAndUpdate(
            id,
            {
                title,
                notice,
                attachment,
                createdBy,
                category,
                publishedAt,
                updatedAt
            },
            { new: true }
        ); // Update notice in DB
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error updating notice", error: err.message });
    }
    if (!updatedNotice) {
        return res.status(404).json({ massage: "Unable to update notice Details" });
    }
    return res.status(200).json({ notices: updatedNotice });
};

// Delete a notice (attachment is stored in DB, so no file deletion needed)
const deletenotice = async (req, res, next) => {
    const id = req.params.id;
    let notice;
    try {
        notice = await Notice.findByIdAndDelete(id); // Delete notice from DB (including attachment data)
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error deleting notice", error: err.message });
    }
    if (!notice) {
        return res.status(404).json({ massage: "Unable to Delete notice Details" });
    }
    return res.status(200).json({ notice });
}

// Get attachment for a specific notice
const getAttachment = async (req, res, next) => {
    const id = req.params.id;
    try {
        const notice = await Notice.findById(id);
        console.log('getAttachment called for notice:', id, 'attachment type:', typeof notice?.attachment);
        if (!notice || !notice.attachment) {
            return res.status(404).json({ message: "Attachment not found" });
        }
        
        // Handle old format: attachment is a string path
        if (typeof notice.attachment === 'string') {
            console.log('Serving file from path:', notice.attachment);
            const filePath = path.join(__dirname, '..', notice.attachment);
            if (!fs.existsSync(filePath)) {
                console.log('File not found at:', filePath);
                return res.status(404).json({ message: "Attachment file not found on disk" });
            }
            return res.sendFile(filePath);
        }
        
        // Handle new format: attachment is an object with Base64 data
        if (!notice.attachment.data) {
            return res.status(404).json({ message: "Attachment data not found" });
        }
        
        // Convert Base64 back to buffer
        const fileBuffer = Buffer.from(notice.attachment.data, 'base64');
        
        // Set appropriate headers
        res.setHeader('Content-Type', notice.attachment.contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${notice.attachment.filename}"`);
        res.setHeader('Content-Length', fileBuffer.length);
        
        // Send the file
        return res.send(fileBuffer);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: "Error retrieving attachment", error: err.message });
    }
};

// Export controller functions for use in routes
exports.getAllNotice = getAllNotice;
exports.addNotice = addNotices;
exports.getById = getById;
exports.updateNotice = updateNotice;
exports.deletenotice = deletenotice;
exports.getAttachment = getAttachment;
