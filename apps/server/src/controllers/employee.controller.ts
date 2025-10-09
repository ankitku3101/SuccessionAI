import { Response } from 'express';
import Employee from '../models/Employee';
import { AuthRequest } from '../middlewares/auth.middleware';
import SuccessRoleModel from '../models/SuccessRole';


// GET /employee/me
export async function me(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Fetch employee profile by user ID (omit password)
    const employee = await Employee.findById(req.user.id).select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    return res.status(200).json(employee);
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
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

// GET /employee/success-profile
export async function getSuccessProfiles(req: AuthRequest, res: Response) {
  try {
    //Authentication check
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // using correct model
    const profiles = await SuccessRoleModel.find({})
      .select(
        'role role_description required_experience required_skills min_performance_rating min_potential_rating required_scores'
      )
      .sort({ required_experience: 1 })
      .lean(); // returns plain JS objects (good for frontend)

    if (!profiles || profiles.length === 0) {
      return res.status(404).json({ message: 'No success profiles found' });
    }

    //Clean data (ensure empty arrays, not undefined)
    const formattedProfiles = profiles.map((p) => ({
      role: p.role || '',
      role_description: p.role_description || '',
      required_experience: p.required_experience || 0,
      required_skills: p.required_skills && Array.isArray(p.required_skills) ? p.required_skills : [],
      min_performance_rating: p.min_performance_rating || 0,
      min_potential_rating: p.min_potential_rating || 0,
      required_scores: {
        technical: p.required_scores?.technical ?? 0,
        communication: p.required_scores?.communication ?? 0,
        leadership: p.required_scores?.leadership ?? 0,
      },
    }));

    return res.status(200).json({
      count: formattedProfiles.length,
      profiles: formattedProfiles,
    });
  } catch (error) {
    console.error('Error fetching success profiles:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
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

//-----------------------------------------------------------------------//

// PATCH /employee/mentorship-accept
export async function acceptMentorship(req: AuthRequest, res: Response) {
  try {
    const { mentee_id, action } = req.body; // (action -> appr else rej)

    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Mentor details
    const mentorId = req.user.id;
    const mentor = await Employee.findById(mentorId);
    if (!mentor) return res.status(404).json({ message: "Mentor not found" });

    // Check mentee
    const mentee = await Employee.findById(mentee_id);
    if (!mentee) return res.status(404).json({ message: "Mentee not found" });

    // Check mentorship request validity
    if (!mentee.mentorship || mentee.mentorship.status !== "requested" || String(mentee.mentorship.mentor_id) !== String(mentorId)) {
      return res.status(400).json({ message: "No valid mentorship request found for this mentor" });
    }

    // Update mentee’s mentorship status
    mentee.mentorship.status = action === "approved" ? "approved" : "rejected";
    if (action === "approved") mentee.mentorship.approved_at = new Date();

    await mentee.save();

    return res.status(200).json({
      message: `Mentorship ${action} successfully`,
      mentorship: mentee.mentorship,
    });
  } catch (error) {
    console.error("Error in mentorship accept:", error);
    return res.status(500).json({ message: "Server error", error });
  }
}


// GET /employee/mentorship-status
export async function getMentorshipStatus(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const employee = await Employee.findById(req.user.id)
      .select("name mentorship")
      .populate("mentorship.mentor_id", "name role department");

    if (!employee) return res.status(404).json({ message: "Employee not found" });

    return res.status(200).json({
      mentorship: employee.mentorship,
    });
  } catch (error) {
    console.error("Error fetching mentorship status:", error);
    return res.status(500).json({ message: "Server error", error });
  }
}

//****************-------------------************************//


// GET /employee/development-plan
export async function getDevelopmentPlan(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const employee = await Employee.findById(req.user.id)
      .select("name role department development_plan target_success_role")
      .populate("target_success_role", "role role_description required_skills required_experience");

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Check if the development plan exists
    if (!employee.development_plan || Object.keys(employee.development_plan).length === 0) {
      return res.status(404).json({ message: "No development plan found for this employee" });
    }

    return res.status(200).json({
      name: employee.name,
      role: employee.role,
      department: employee.department,
      target_success_role: employee.target_success_role || null,
      development_plan: employee.development_plan,
    });
  } catch (error) {
    console.error("Error fetching development plan:", error);
    return res.status(500).json({ message: "Server error", error });
  }
}

