const express = require('express');
const router = express.Router();
const ChatController = require('../Controllers/ChatControllers');

// CREATE
router.post('/', ChatController.createMessage);

// READ ALL
router.get('/', ChatController.getAllMessages);

// GET single message by ID
router.get('/:id', ChatController.getMessageById);

// UPDATE
router.put('/:id', ChatController.updateMessage);

// DELETE
router.delete("/:id",ChatController.deleteMessage);

// READ Conversation (placed last to avoid clashes)
router.get('/:classId/:parentId/:teacherId', ChatController.getConversation);

module.exports = router;