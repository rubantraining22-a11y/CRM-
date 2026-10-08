const express = require('express');
const router = express.Router();
const { verifyWebhook, receiveWebhook } = require('../controllers/webhookController');

// Meta webhook verification (GET)
router.get('/whatsapp', verifyWebhook);

// Receive incoming messages (POST) - No auth needed, Meta calls this
router.post('/whatsapp', receiveWebhook);

module.exports = router;
