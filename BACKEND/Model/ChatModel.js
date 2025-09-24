// Mongoose model for direct chat messages between users
const mongoose = require('mongoose');

// Define the schema for a chat message
const ChatSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId, // Sender's user ID
      ref: 'User',
      required: [true, 'Sender (fromUserId) is required']
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId, // Recipient's user ID
      ref: 'User',
      required: [true, 'Recipient (toUserId) is required']
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId, // Class/group ID for the chat
      ref: 'Class',
      required: [true, 'ClassId is required']
    },
    messageContent: {
      type: String, // The actual message text
      required: [true, 'Message content is required'],
      trim: true,
      minlength: [1, 'Message cannot be empty'],
      maxlength: [1000, 'Message too long (max 1000 chars)']
    },
    status: {
      type: String, // Message status: sent, delivered, or seen
      enum: ['sent', 'delivered', 'seen'],
      default: 'sent'
    },
    edited: {
      type: Boolean, // Whether the message was edited
      default: false
    },
    deleted: {
      type: Boolean, // Whether the message was deleted
      default: false  
    },
    deletedAt: {
      type: Date,    // Timestamp when message was deleted
      default: null   
    }
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Middleware: If a message is marked deleted, set deletedAt timestamp
ChatSchema.pre('findOneAndUpdate', function (next) {
  if (this._update.deleted === true) {
    this._update.deletedAt = new Date();
  }
  next();
});

// Export the model for use in controllers/routes
module.exports = mongoose.model('ChatMessage', ChatSchema);