
// Import required modules
const express = require ("express"); // Express framework
const router = express.Router(); // Create a new router instance
const Notice = require("../Model/NoticeModel"); // Notice model (not used directly here)
const NoticeController = require("../Controllers/NoticeControllers"); // Notice controller functions
const multer = require('multer'); // Multer for file uploads
const path = require('path'); // Path module for file paths

// Set up storage configuration for file attachments
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		// Save uploaded files to /uploads directory
		cb(null, path.join(__dirname, '../uploads'));
	},
	filename: function (req, file, cb) {
		// Rename file with timestamp for uniqueness
		cb(null, Date.now() + '-' + file.originalname);
	}
});
const upload = multer({ storage: storage }); // Multer middleware instance

// Route to get all notices
router.get("/", NoticeController.getAllNotice);

// Route to add a new notice (with file upload)
router.post("/", upload.single('attachment'), NoticeController.addNotice);

// Route to download attachment for a specific notice (MUST be before /:id route)
router.get("/:id/attachment", NoticeController.getAttachment);

// Route to get a notice by its ID
router.get("/:id", NoticeController.getById);

// Route to update a notice by its ID (with file upload)
router.put("/:id", upload.single('attachment'), NoticeController.updateNotice);

// Route to delete a notice by its ID
router.delete("/:id", NoticeController.deletenotice);

// Export the router to be used in app.js
module.exports = router;