const mongoose = require('mongoose');

const LEAD_STAGES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

const StageHistorySchema = new mongoose.Schema({
  stage: { type: String, enum: LEAD_STAGES },
  changedAt: { type: Date, default: Date.now },
  note: { type: String, default: '' },
}, { _id: false });

const NoteSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const LeadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Lead name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    source: {
      type: String,
      enum: ['whatsapp', 'manual', 'web', 'referral', 'other'],
      default: 'manual',
    },
    stage: {
      type: String,
      enum: LEAD_STAGES,
      default: 'New',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    value: {
      type: Number,
      default: 0,
    },
    whatsappId: {
      type: String,
      default: '',
      index: true,
    },
    tags: [{ type: String, trim: true }],
    notes: [NoteSchema],
    stageHistory: [StageHistorySchema],
    lastContactedAt: {
      type: Date,
    },
    closedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Auto-push to stage history when stage changes
LeadSchema.pre('save', function (next) {
  if (this.isModified('stage')) {
    this.stageHistory.push({ stage: this.stage, changedAt: new Date() });
    if (this.stage === 'Won' || this.stage === 'Lost') {
      this.closedAt = new Date();
    }
  }
  next();
});

LeadSchema.index({ phone: 1 });
LeadSchema.index({ stage: 1 });
LeadSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Lead', LeadSchema);
module.exports.LEAD_STAGES = LEAD_STAGES;
