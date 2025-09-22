const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender (fromUserId) is required']
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient (toUserId) is required']
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: [true, 'ClassId is required']
    },
    messageContent: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      minlength: [1, 'Message cannot be empty'],
      maxlength: [1000, 'Message too long (max 1000 chars)']
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'seen'],
      default: 'sent'
    },
    edited: {
      type: Boolean,
      default: false
    },
    deleted: {
      type: Boolean,
      default: false  
    },
    deletedAt: {
      type: Date,
      default: null   
    }
  },
  { timestamps: true } 
);

// Optional: ensure deletion automatically updates deletedAt
ChatSchema.pre('findOneAndUpdate', function (next) {
  if (this._update.deleted === true) {
    this._update.deletedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('ChatMessage', ChatSchema);