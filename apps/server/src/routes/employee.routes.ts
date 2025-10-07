import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { getMentorCandidates, requestMentorship, updateMe } from '../controllers/employee.controller';
import { me } from '../controllers/auth.contoller';

const router = Router();

router.get('/me', authenticateJWT, me);
router.patch('/me', authenticateJWT, authorizeRoles('employee'), updateMe);
router.get('/mentor-candidates', authenticateJWT, authorizeRoles('employee'), getMentorCandidates);
router.post('/mentorship-request', authenticateJWT, authorizeRoles('employee'), requestMentorship);

export default router;


