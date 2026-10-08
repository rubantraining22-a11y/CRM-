import { Router } from 'express';
import { login, getMe, getTeamUsers, updateUserRole } from '../controllers/authController.js';
import { verifyToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', verifyToken, getMe);
router.get('/users', verifyToken, getTeamUsers);
router.post('/update-role', verifyToken, updateUserRole);

export default router;

