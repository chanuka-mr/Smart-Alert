
// Import required modules and controllers
const express = require('express'); // Express framework
const router = express.Router(); // Create a new router instance
const ChatController = require('../Controllers/ChatControllers'); // Chat controller functions

// Route to create a new chat message
router.post('/', ChatController.createMessage);

// Route to get all chat messages
router.get('/', ChatController.getAllMessages);

// Route to get a single message by its ID
router.get('/:id', ChatController.getMessageById);

// Route to update a chat message by its ID
router.put('/:id', ChatController.updateMessage);

// Route to delete a chat message by its ID
router.delete(":id", ChatController.deleteMessage);

// Route to get a conversation between class, parent, and teacher (placed last to avoid route clashes)
router.get('/:classId/:parentId/:teacherId', ChatController.getConversation);

// Export the router to be used in app.js
module.exports = router;