
// Import the Notice model and required modules for file handling
const Notice = require("../Model/NoticeModel");
const fs = require('fs'); // For file system operations
const path = require('path'); // For file path handling

// Get all notices from the database
const getAllNotice = async (req, res, next) => {
    let notices;
    try {
        notices = await Notice.find(); // Fetch all notices
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
        attachment = '/uploads/' + req.file.filename;
    } else if (req.body.attachment) {
        attachment = req.body.attachment;
    }
    let notices;
    try {
        notices = new Notice({ title, notice, attachment, createdBy, category, publishedAt, updatedAt });
        await notices.save(); // Save new notice
    } catch (err) {
        console.log(err);
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

    // Find existing notice for attachment deletion
    let existingNotice = await Notice.findById(id);
    if (!existingNotice) {
        return res.status(404).json({ massage: "Notice not found" });
    }

    // If a new file is uploaded, replace old attachment
    if (req.file) {
        // Delete old attachment if exists
        if (existingNotice.attachment) {
            const filePath = path.join(__dirname, '..', existingNotice.attachment);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        attachment = '/uploads/' + req.file.filename;
    } else if (attachment === "" && existingNotice.attachment) {
        // Delete attachment file if removed
        const filePath = path.join(__dirname, '..', existingNotice.attachment);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        attachment = null;
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
    }
    if (!updatedNotice) {
        return res.status(404).json({ massage: "Unable to update notice Details" });
    }
    return res.status(200).json({ notices: updatedNotice });
};

// Delete a notice and its attachment
const deletenotice = async (req, res, next) => {
    const id = req.params.id;
    let notice;
    try {
        notice = await Notice.findByIdAndDelete(id); // Delete notice from DB
        // Delete attachment file if exists
        if (notice && notice.attachment) {
            const filePath = path.join(__dirname, '..', notice.attachment);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
    } catch (err) {
        console.log(err)
    }
    if (!notice) {
        return res.status(404).json({ massage: "Unable to Delete notice Details" });
    }
    return res.status(200).json({ notice });
}

// Export controller functions for use in routes
exports.getAllNotice = getAllNotice;
exports.addNotice = addNotices;
exports.getById = getById;
exports.updateNotice = updateNotice;
exports.deletenotice = deletenotice;
