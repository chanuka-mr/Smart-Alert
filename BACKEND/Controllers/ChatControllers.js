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

// Add a new chat message to the database
const addMessage = async (req, res, next) => {
  const { sender, receiver, message, time } = req.body;
  let chat;
  try {
    chat = new Chat({ sender, receiver, message, time });
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

// Delete a chat message by its ID
const deleteMessage = async (req, res, next) => {
  const id = req.params.id;
  let message;
  try {
    message = await Chat.findByIdAndDelete(id); // Delete message from DB
  } catch (err) {
    console.log(err);
  }
  // If not deleted, return error
  if (!message) {
    return res.status(404).json({ message: "Unable to delete message" });
  }
  return res.status(200).json({ message });
};

// Export controller functions for use in routes
exports.getAllMessages = getAllMessages;
exports.addMessage = addMessage;
exports.getMessagesByUser = getMessagesByUser;
exports.deleteMessage = deleteMessage;
  }
};

//Delete Notice
exports.deleteMessage = async(req, res, next) => {
    const id = req.params.id;

    let notice;

    try{
        Chat = await ChatMessage.findByIdAndDelete(id);
    }catch(err){
        console.log(err)
    }
       //not avilable notice inserting
    if (!Chat){
        return res.status(404).json({massage:"Unable to Delete notice Details"});
    }
    return res.status(200).json({Chat});

}