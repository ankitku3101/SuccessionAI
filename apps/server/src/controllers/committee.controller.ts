import { Request, Response } from 'express';
import Employee from '../models/Employee';
import SuccessRole from '../models/SuccessRole';
import { AuthRequest } from '../middlewares/auth.middleware';
import SuccessRoleModel from '../models/SuccessRole';

function requireCommittee(req: AuthRequest, res: Response): boolean {
  if (!req.user || req.user.user_role !== 'committee') {
    res.status(403).json({ message: 'Committee access only' });
    return false;
  }
  return true;
}

// GET /employees
export async function listEmployees(req: AuthRequest, res: Response) {
  if (!requireCommittee(req, res)) return;
  const { department, role, status, q, limit = '50', page = '1' } = req.query as any;

  const filter: any = {};
  if (department) filter.department = department;
  if (role) filter.role = role;
  if (status) filter['mentorship.status'] = status;
  if (q) filter.$or = [{ name: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = Math.min(100, parseInt(limit, 10) || 50);

  const [items, total] = await Promise.all([
    Employee.find(filter)
      .select('-password')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ updatedAt: -1 }),
    Employee.countDocuments(filter),
  ]);

  res.json({ items, total, page: pageNum, limit: limitNum });
}

// GET /employee/:id
export async function getEmployee(req: AuthRequest, res: Response) {
  if (!requireCommittee(req, res)) return;
  const emp = await Employee.findById(req.params.id).select('-password');
  if (!emp) return res.status(404).json({ message: 'Employee not found' });
  res.json(emp);
}

// PATCH /employee/:id
export async function updateEmployee(req: AuthRequest, res: Response) {
  if (!requireCommittee(req, res)) return;
  const allowed = ['role', 'department', 'skills', 'target_success_role', 'performance_rating', 'potential_rating', 'assessment_scores', 'mentorship', 'development_plan'];
  const updates: any = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }
  updates['updatedAt'] = new Date();

  const updated = await Employee.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true }).select('-password');
  if (!updated) return res.status(404).json({ message: 'Employee not found' });
  res.json(updated);
}
// POST /committee/success-profile
export async function createSuccessProfile(req: AuthRequest, res: Response) {
  if (!requireCommittee(req, res)) return;

  try {
    const {
      role,
      role_description,
      required_experience,
      required_skills,
      min_performance_rating,
      min_potential_rating,
      required_scores,
    } = req.body;

    // Basic validation
    if (!role) {
      return res.status(400).json({ message: "Role name is required" });
    }

    // Check if role already exists
    const existing = await SuccessRole.findOne({ role: role.trim() });
    if (existing) {
      return res.status(409).json({ message: "A success profile with this role already exists" });
    }

    // Create a new success profile
    const newProfile = new SuccessRole({
      role: role.trim(),
      role_description: role_description || "",
      required_experience: Number(required_experience) || 0,
      required_skills: Array.isArray(required_skills)
        ? required_skills
        : typeof required_skills === "string"
        ? required_skills.split(",").map((s: string) => s.trim())
        : [],
      min_performance_rating: Number(min_performance_rating) || 0,
      min_potential_rating: Number(min_potential_rating) || 0,
      required_scores: {
        technical: Number(required_scores?.technical) || 0,
        communication: Number(required_scores?.communication) || 0,
        leadership: Number(required_scores?.leadership) || 0,
      },
    });

    const savedProfile = await newProfile.save();

    res.status(201).json({
      message: "Success profile created successfully",
      profile: savedProfile,
    });
  } catch (error) {
    console.error("Error creating success profile:", error);
    res.status(500).json({ message: "Server error", error });
  }
}




export async function successProfiles(req: AuthRequest, res: Response) {
  try {
    if (!requireCommittee(req, res)) return

    const profiles = await SuccessRoleModel.find({})
      .select(
        "role role_description required_experience required_skills min_performance_rating min_potential_rating required_scores"
      )
      .sort({ required_experience: 1 })
      .lean()

    if (!profiles.length) {
      return res.status(404).json({ message: "No success profiles found" })
    }

    res.status(200).json(profiles)
  } catch (error) {
    console.error("Error fetching success profiles:", error)
    res.status(500).json({ message: "Server error", error })
  }
}


// POST /employee/:id/development-plan
export async function upsertDevelopmentPlan(req: AuthRequest, res: Response) {
  if (!requireCommittee(req, res)) return;
  const { goals, trainings } = req.body;
  const updated = await Employee.findByIdAndUpdate(
    req.params.id,
    { $set: { 'development_plan.goals': goals, 'development_plan.trainings': trainings, 'development_plan.last_updated': new Date() } },
    { new: true }
  ).select('-password');
  if (!updated) return res.status(404).json({ message: 'Employee not found' });
  res.status(201).json(updated.development_plan);
}

// GET /reports/summary
export async function reportsSummary(req: AuthRequest, res: Response) {
  if (!requireCommittee(req, res)) return;

  const byDepartment = await Employee.aggregate([
    { $group: { _id: '$department', count: { $sum: 1 }, avgPerf: { $avg: '$performance_rating' }, avgPot: { $avg: '$potential_rating' } } },
  ]);

  const readinessByRole = await Employee.aggregate([
    { $match: { target_success_role: { $exists: true, $ne: '' } } },
    { $group: { _id: '$target_success_role', avgPerf: { $avg: '$performance_rating' }, avgPot: { $avg: '$potential_rating' }, count: { $sum: 1 } } },
  ]);

  res.json({ byDepartment, readinessByRole });
}


