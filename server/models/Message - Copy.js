const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'template', 'image', 'audio', 'document', 'video', 'interactive'],
      default: 'text',
    },
    body: {
      type: String,
      default: '',
    },
    templateName: {
      type: String,
      default: '',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed', 'received'],
      default: 'sent',
    },
    waMessageId: {
      type: String,
      default: '',
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

MessageSchema.index({ contactPhone: 1, timestamp: -1 });
MessageSchema.index({ leadId: 1, timestamp: -1 });

module.exports = mongoose.model('Message', MessageSchema);
