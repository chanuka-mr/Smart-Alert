// Import required modules
const express = require ("express"); // Express framework
const router = express.Router(); // Create a new router instance
const Notice = require("../Model/NoticeModel"); // Notice model (not used directly here)
const NoticeController = require("../Controllers/NoticeControllers"); // Notice controller functions

// Route to get all notices
router.get("/", NoticeController.getAllNotice);

// Route to add a new notice (attachment URL from Uploadcare sent in body)
router.post("/", NoticeController.addNotice);

// Route to download attachment for a specific notice (MUST be before /:id route)
router.get("/:id/attachment", NoticeController.getAttachment);

// Route to get a notice by its ID
router.get("/:id", NoticeController.getById);

// Route to update a notice by its ID (attachment URL from Uploadcare sent in body)
router.put("/:id", NoticeController.updateNotice);

// Route to delete a notice by its ID
router.delete("/:id", NoticeController.deletenotice);

// Export the router to be used in app.js
module.exports = router;