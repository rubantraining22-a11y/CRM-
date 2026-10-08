import { Router } from 'express';
import multer from 'multer';
import { bulkUploadCampaign, uploadHeaderMedia } from '../controllers/campaignController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

// Memory buffer upload capped at 30MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024, // 30MB
  },
});

// Media upload for template headers (image/video/document)
router.post('/upload-media', verifyToken, upload.single('file'), uploadHeaderMedia);

// WhatsApp Bulk Template Send (CSV Upload)
router.post('/bulk-upload', verifyToken, upload.single('file'), bulkUploadCampaign);

export default router;
