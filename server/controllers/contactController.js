const Contact = require('../models/Contact');

// GET /api/contacts
const getContacts = async (req, res) => {
  const { search, page = 1, limit = 50 } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } },
    ];
  }
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [contacts, total] = await Promise.all([
    Contact.find(query).populate('leadId', 'name stage').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Contact.countDocuments(query),
  ]);
  res.json({ success: true, data: contacts, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
};

// GET /api/contacts/:id
const getContact = async (req, res) => {
  const contact = await Contact.findById(req.params.id).populate('leadId');
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found.' });
  res.json({ success: true, data: contact });
};

// POST /api/contacts
const createContact = async (req, res) => {
  const contact = await Contact.create(req.body);
  res.status(201).json({ success: true, data: contact });
};

// PUT /api/contacts/:id
const updateContact = async (req, res) => {
  const contact = await Contact.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found.' });
  res.json({ success: true, data: contact });
};

// DELETE /api/contacts/:id
const deleteContact = async (req, res) => {
  const contact = await Contact.findByIdAndDelete(req.params.id);
  if (!contact) return res.status(404).json({ success: false, message: 'Contact not found.' });
  res.json({ success: true, message: 'Contact deleted.' });
};

module.exports = { getContacts, getContact, createContact, updateContact, deleteContact };
