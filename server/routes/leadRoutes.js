import { Router } from 'express';
import { getLeads, createLead, updateLeadStage, addFollowUpLog, updateLead, deleteLead } from '../controllers/leadController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/', verifyToken, getLeads);
router.post('/', verifyToken, createLead);
router.patch('/:id/stage', verifyToken, updateLeadStage);
router.post('/:id/follow-ups', verifyToken, addFollowUpLog);
router.put('/:id', verifyToken, updateLead);
router.delete('/:id', verifyToken, deleteLead);

export default router;
