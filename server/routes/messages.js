const express = require('express');
const router = express.Router();
const { getConversation, getConversations, sendMessage, sendTemplate } = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/conversations', getConversations);
router.get('/:phone', getConversation);
router.post('/send', sendMessage);
router.post('/send-template', sendTemplate);

module.exports = router;
