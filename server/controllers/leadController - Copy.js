const Lead = require('../models/Lead');
const Message = require('../models/Message');
const { emitLeadUpdate } = require('../services/socketService');

// GET /api/leads
const getLeads = async (req, res) => {
  const { stage, search, priority, source, page = 1, limit = 50, sortBy = 'createdAt', order = 'desc' } = req.query;
  const query = {};

  if (stage) query.stage = stage;
  if (priority) query.priority = priority;
  if (source) query.source = source;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOrder = order === 'desc' ? -1 : 1;

  const [leads, total] = await Promise.all([
    Lead.find(query).sort({ [sortBy]: sortOrder }).skip(skip).limit(parseInt(limit)),
    Lead.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: leads,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) },
  });
};

// GET /api/leads/stats
const getLeadStats = async (req, res) => {
  const [stageCounts, totalLeads, wonLeads, lostLeads, recentLeads] = await Promise.all([
    Lead.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 }, totalValue: { $sum: '$value' } } }]),
    Lead.countDocuments(),
    Lead.countDocuments({ stage: 'Won' }),
    Lead.countDocuments({ stage: 'Lost' }),
    Lead.find().sort({ createdAt: -1 }).limit(5).select('name phone stage source createdAt'),
  ]);

  // Monthly trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const monthlyTrend = await Lead.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0;

  res.json({
    success: true,
    data: { stageCounts, totalLeads, wonLeads, lostLeads, conversionRate, recentLeads, monthlyTrend },
  });
};

// GET /api/leads/:id
const getLead = async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
  res.json({ success: true, data: lead });
};

// POST /api/leads
const createLead = async (req, res) => {
  const lead = await Lead.create(req.body);
  res.status(201).json({ success: true, data: lead });
};

// PUT /api/leads/:id
const updateLead = async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });

  // Handle stage change manually to trigger pre-save hook
  if (req.body.stage && req.body.stage !== lead.stage) {
    lead.stage = req.body.stage;
  }

  Object.assign(lead, req.body);
  await lead.save();

  emitLeadUpdate(lead);
  res.json({ success: true, data: lead });
};

// PATCH /api/leads/:id/stage
const updateLeadStage = async (req, res) => {
  const { stage } = req.body;
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });

  lead.stage = stage;
  await lead.save();

  emitLeadUpdate(lead);
  res.json({ success: true, data: lead });
};

// POST /api/leads/:id/notes
const addNote = async (req, res) => {
  const { content } = req.body;
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });

  lead.notes.push({ content });
  await lead.save();
  res.json({ success: true, data: lead });
};

// DELETE /api/leads/:id
const deleteLead = async (req, res) => {
  const lead = await Lead.findByIdAndDelete(req.params.id);
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found.' });
  res.json({ success: true, message: 'Lead deleted.' });
};

module.exports = { getLeads, getLeadStats, getLead, createLead, updateLead, updateLeadStage, addNote, deleteLead };
