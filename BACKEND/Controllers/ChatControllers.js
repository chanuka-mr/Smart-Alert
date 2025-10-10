// BACKEND/Controllers/ChatControllers.js

// Import the Chat model
const Chat = require("../Model/ChatModel");

// Get all chat messages from the database
const getAllMessages = async (req, res, next) => {
  let messages;
  try {
    messages = await Chat.find(); // Fetch all messages
  } catch (err) {
    console.log(err);
  }
  // If no messages found, return 404
  if (!messages) {
    return res.status(404).json({ message: "Messages not found" });
  }
  // Return all messages
  return res.status(200).json({ messages });
};


// Add a new chat message to the database, set status to 'delivered' when sent
const addMessage = async (req, res, next) => {
  // Support both old and new frontend payloads
  const { sender, receiver, message, time, fromUserId, toUserId, classId, messageContent } = req.body;
  let chat;
  try {
    // Use new frontend payload if available
    if (fromUserId && toUserId && classId && messageContent) {
      chat = new Chat({
        fromUserId,
        toUserId,
        classId,
        messageContent,
        status: 'delivered'
      });
    } else {
      // Fallback for old payload
      chat = new Chat({
        sender,
        receiver,
        message,
        time,
        status: 'delivered'
      });
    }
    await chat.save(); // Save new message
  } catch (err) {
    console.log(err);
  }
  // If not inserted, return error
  if (!chat) {
    return res.status(404).json({ message: "Unable to add message" });
  }
  return res.status(200).json({ chat });
};

// Get messages between two users (sender or receiver)
const getMessagesByUser = async (req, res, next) => {
  const { user1, user2 } = req.params;
  let messages;
  try {
    messages = await Chat.find({
      $or: [
        { sender: user1, receiver: user2 },
        { sender: user2, receiver: user1 }
      ]
    }); // Find messages between user1 and user2
  } catch (err) {
    console.log(err);
  }
  // If not found, return error
  if (!messages) {
    return res.status(404).json({ message: "Messages not found" });
  }
  return res.status(200).json({ messages });
};


// Delete a chat message by its ID (supports string or ObjectId)
const deleteMessage = async (req, res, next) => {
  const id = req.params.id;
  let message;
  try {
    message = await Chat.findOneAndDelete({ _id: id }); // Delete by _id
  } catch (err) {
    console.log(err);
  }
  // If not deleted, return error
  if (!message) {
    return res.status(404).json({ message: "Unable to delete message" });
  }
  return res.status(200).json({ message });
};


// Get all messages between parent and teacher for a class
const getConversation = async (req, res, next) => {
  const { classId, parentId, teacherId } = req.params;
  try {
    // Find all messages where (from parent to teacher) or (from teacher to parent) for the class
    const messages = await Chat.find({
      classId,
      $or: [
        { fromUserId: parentId, toUserId: teacherId },
        { fromUserId: teacherId, toUserId: parentId }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversation.' });
  }
};


// Update a chat message's content
const updateMessage = async (req, res, next) => {
  const id = req.params.id;
  const { messageContent } = req.body;
  try {
    const updated = await Chat.findByIdAndUpdate(
      id,
      { messageContent, edited: true },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Message not found' });
    }
    res.status(200).json({ message: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update message.' });
  }
};

// Export controller functions for use in routes
exports.getAllMessages = getAllMessages;
exports.addMessage = addMessage;
exports.getMessagesByUser = getMessagesByUser;
exports.deleteMessage = deleteMessage;
exports.getConversation = getConversation;
exports.updateMessage = updateMessage;