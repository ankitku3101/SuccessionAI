import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth.middleware';
import { login, signup, me } from '../controllers/auth.contoller';

const router = Router();

router.post('/login', login);
router.post('/signup', signup);
router.get('/me', authenticateJWT, me);

export default router;
