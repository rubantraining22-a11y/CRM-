import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: String, required: true },
    sender: { type: String, enum: ['agent', 'contact', 'system', 'bot'], required: true },
    text: { type: String, required: true },
    waMessageId: { type: String },
    status: { type: String, enum: ['sent', 'delivered', 'read', 'failed'], default: 'sent' },
  },
  { timestamps: true }
);

export default mongoose.models.Message || mongoose.model('Message', messageSchema);
