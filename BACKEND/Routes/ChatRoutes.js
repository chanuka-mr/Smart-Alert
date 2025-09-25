
// Import required modules and controllers
const express = require('express'); // Express framework
const router = express.Router(); // Create a new router instance
const ChatController = require('../Controllers/ChatControllers'); // Chat controller functions


// Route to get all chat messages
router.get('/', ChatController.getAllMessages);


// Route to add a new chat message (for /chat and /chat/add)
router.post('/', ChatController.addMessage);
router.post('/add', ChatController.addMessage);


// Route to get messages between two users
router.get('/:user1/:user2', ChatController.getMessagesByUser);

// Route to get conversation between parent and teacher for a class
router.get('/:classId/:parentId/:teacherId', ChatController.getConversation);



// Route to update a chat message by its ID
router.put('/:id', ChatController.updateMessage);

// Route to delete a chat message by its ID (for /chat/:id and /chat/delete/:id)
router.delete('/:id', ChatController.deleteMessage);
router.delete('/delete/:id', ChatController.deleteMessage);

// Export the router to be used in app.js
module.exports = router;