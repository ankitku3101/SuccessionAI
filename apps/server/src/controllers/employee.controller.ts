import { Response } from 'express';
import Employee from '../models/Employee';
import { AuthRequest } from '../middlewares/auth.middleware';

// GET /employee/mentor-candidates
export async function getMentorCandidates(req: AuthRequest, res: Response) {
  if (!req.user || req.user.user_role !== 'employee') {
    return res.status(403).json({ message: 'Only employees can access mentor candidates' });
  }

  const me = await Employee.findById(req.user.id);
  if (!me) return res.status(404).json({ message: 'User not found' });

  const query: any = {
    _id: { $ne: me._id },
    user_role: 'employee',
    experience_years: { $gte: (me.experience_years || 0) + 2 },
  };
  if (me.target_success_role) {
    query.target_success_role = me.target_success_role;
  }

  const candidates = await Employee.find(query)
    .select('name role department experience_years target_success_role skills')
    .limit(20)
    .sort({ experience_years: -1 });

  res.json(candidates);
}

// PATCH /employee/me
export async function updateMe(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

  const updatable: any = {};
  const allowed = ['skills', 'target_success_role', 'num_trainings', 'assessment_scores', 'performance_rating', 'potential_rating'];
  for (const key of allowed) {
    if (req.body[key] !== undefined) updatable[key] = req.body[key];
  }
  updatable['updatedAt'] = new Date();

  const updated = await Employee.findByIdAndUpdate(req.user.id, { $set: updatable }, { new: true }).select('-password');
  if (!updated) return res.status(404).json({ message: 'User not found' });

  res.json(updated);
}

// POST /employee/mentorship-request
export async function requestMentorship(req: AuthRequest, res: Response) {
  if (!req.user || req.user.user_role !== 'employee') {
    return res.status(403).json({ message: 'Only employees can request mentorship' });
  }

  const { mentor_id } = req.body;
  if (!mentor_id) return res.status(400).json({ message: 'mentor_id is required' });

  const mentor = await Employee.findById(mentor_id);
  if (!mentor) return res.status(404).json({ message: 'Mentor not found' });

  const updated = await Employee.findByIdAndUpdate(
    req.user.id,
    { $set: { mentorship: { mentor_id, requested_at: new Date(), status: 'requested' } } },
    { new: true }
  ).select('-password');

  if (!updated) return res.status(404).json({ message: 'User not found' });

  res.status(201).json(updated.mentorship);
}


