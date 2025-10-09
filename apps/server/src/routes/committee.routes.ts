import { Router } from 'express';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth.middleware';
import { getEmployee, listEmployees, reportsSummary, successProfiles, upsertDevelopmentPlan, updateEmployee } from '../controllers/committee.controller';

const router = Router();

router.use(authenticateJWT, authorizeRoles('committee'));

router.get('/employees', listEmployees);
router.get('/employee/:id', getEmployee);
router.patch('/employee/:id', updateEmployee);
router.get('/success-profiles', successProfiles);
router.post('/employee/:id/development-plan', upsertDevelopmentPlan);
router.get('/reports/summary', reportsSummary);

export default router;


