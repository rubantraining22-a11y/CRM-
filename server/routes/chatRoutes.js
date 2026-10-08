import { Router } from 'express';
import multer from 'multer';
import { 
  getConversations, 
  sendMessage, 
  sendChatMedia,
  sendDirectMessage,
  generateAiChatReply,
  getPageIndexDocuments
} from '../controllers/chatController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB media limit
});

router.get('/', verifyToken, getConversations);
router.get('/pageindex/documents', verifyToken, getPageIndexDocuments);
router.post('/send-direct', verifyToken, sendDirectMessage);
router.post('/:chatId/messages', verifyToken, sendMessage);
router.post('/:chatId/media', verifyToken, upload.single('file'), sendChatMedia);
router.post('/:chatId/ai-reply', verifyToken, generateAiChatReply);

export default router;

