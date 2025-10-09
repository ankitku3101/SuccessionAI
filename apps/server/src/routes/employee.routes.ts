import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { getMentorCandidates, requestMentorship, updateMe } from '../controllers/employee.controller';
import { getSuccessProfiles } from '../controllers/employee.controller';//added for success-profile
import { acceptMentorship, getMentorshipStatus } from '../controllers/employee.controller';
import { me } from '../controllers/auth.contoller';
import { getDevelopmentPlan } from '../controllers/employee.controller';

const router = Router();

router.get('/me', authenticateJWT, me);//fetching prof
router.patch('/me', authenticateJWT, authorizeRoles('employee'), updateMe);
router.get('/mentor-candidates', authenticateJWT, authorizeRoles('employee'), getMentorCandidates);
router.post('/mentorship-request', authenticateJWT, authorizeRoles('employee'), requestMentorship);
router.get('/success-profile',authenticateJWT,authorizeRoles('employee', 'committee'),getSuccessProfiles);
//-----------------------------------------//
router.patch("/mentorship-accept", authenticateJWT, authorizeRoles("employee", "committee"), acceptMentorship);
router.get("/mentorship-status", authenticateJWT, authorizeRoles("employee"), getMentorshipStatus);
router.get('/development-plan', authenticateJWT, authorizeRoles('employee'), getDevelopmentPlan);

export default router;


