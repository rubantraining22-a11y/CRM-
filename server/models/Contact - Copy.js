const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, unique: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    company: { type: String, trim: true, default: '' },
    jobTitle: { type: String, trim: true, default: '' },
    whatsappId: { type: String, default: '', index: true },
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },
    tags: [{ type: String }],
    notes: { type: String, default: '' },
    avatar: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contact', ContactSchema);
