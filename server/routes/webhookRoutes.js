import { Router } from 'express';
import { verifyWebhook, receiveWebhook, getMetaStatus, getMetaTemplates, sendWhatsAppTemplate } from '../controllers/webhookController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.get('/whatsapp', verifyWebhook);
router.post('/whatsapp', receiveWebhook);
router.get('/status', getMetaStatus);
router.get('/templates', verifyToken, getMetaTemplates);
router.post('/send-template', verifyToken, sendWhatsAppTemplate);

export default router;
