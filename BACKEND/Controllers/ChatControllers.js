// BACKEND/Controllers/ChatControllers.js
const ChatMessage = require('../Model/ChatModel');

// CREATE
exports.createMessage = async (req, res) => {
  try {
    const { fromUserId, toUserId, classId, messageContent } = req.body;
    const message = new ChatMessage({ fromUserId, toUserId, classId, messageContent });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ ALL (admin/testing)
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await ChatMessage.find().sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ (by conversation)
exports.getConversation = async (req, res) => {
  try {
    const { classId, parentId, teacherId } = req.params;
    const messages = await ChatMessage.find({
      classId,
      $or: [
        { fromUserId: parentId, toUserId: teacherId },
        { fromUserId: teacherId, toUserId: parentId }
      ]
    }).sort({ createdAt: 1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET by ID (single message)
exports.getMessageById = async (req, res, next) => {
  try {
    const  id  = req.params.id;
    const message = await ChatMessage.findById(id);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    res.status(200).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
exports.updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { messageContent } = req.body;
    const updated = await ChatMessage.findByIdAndUpdate(
      id,
      { messageContent, edited: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Message not found' });
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
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