const express = require('express');
const router = express.Router();
const {
  getLeads, getLeadStats, getLead, createLead, updateLead, updateLeadStage, addNote, deleteLead,
} = require('../controllers/leadController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/stats', getLeadStats);
router.route('/').get(getLeads).post(createLead);
router.route('/:id').get(getLead).put(updateLead).delete(deleteLead);
router.patch('/:id/stage', updateLeadStage);
router.post('/:id/notes', addNote);

module.exports = router;
