
// Import the Notice model and required modules for file handling
const Notice = require("../Model/NoticeModel");
const fs = require('fs'); // For file system operations
const path = require('path'); // For file path handling

// Get all notices from the database
const getAllNotice = async (req, res, next) => {
    let notices;
    try {
        // Fetch all notices with Uploadcare URLs
        notices = await Notice.find();
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
    const { title, notice, createdBy, category, publishedAt, updatedAt, attachment } = req.body;
    
    // attachment should be sent as JSON with Uploadcare URL
    // Format: { url, uuid, contentType, filename, size }
    
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

    // Handle attachment update
    // attachment should be sent as JSON with Uploadcare URL or null to remove
    if (attachment === "" || attachment === null) {
        attachment = null;
    } else if (typeof attachment === 'string' && attachment === 'keep') {
        // Keep existing attachment if 'keep' is sent
        attachment = existingNotice.attachment;
    }
    // Otherwise, attachment is the new Uploadcare object

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

// Get attachment for a specific notice (redirect to Uploadcare CDN)
const getAttachment = async (req, res, next) => {
    const id = req.params.id;
    try {
        const notice = await Notice.findById(id);
        if (!notice || !notice.attachment || !notice.attachment.url) {
            return res.status(404).json({ message: "Attachment not found" });
        }
        
        // Redirect to Uploadcare CDN URL
        return res.redirect(302, notice.attachment.url);
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
