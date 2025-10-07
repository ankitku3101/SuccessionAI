import { Request, Response } from 'express';
import Employee from '../models/Employee';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'arcus';
const JWT_EXPIRES_IN = '2h';

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  const user = await Employee.findOne({ email }).select('+password');
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const passwordMatch = await bcrypt.compare(password, user.password);
  if (!passwordMatch) return res.status(401).json({ message: 'Invalid credentials' });

  const payload = {
    id: user._id,
    user_role: user.user_role,
    email: user.email,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.json({ token, user: { id: user._id, name: user.name, user_role: user.user_role, email: user.email } });
}

export async function signup(req: Request, res: Response) {
  const { name, email, password, role, department, user_role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  const existing = await Employee.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  if (user_role === 'committee') {
    return res.status(403).json({ message: 'Committee accounts cannot be created via signup' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const created = await Employee.create({
    name,
    email,
    password: hashedPassword,
    role: role || '',
    department: department || '',
    user_role: 'employee',
  });

  const payload = {
    id: created._id,
    user_role: created.user_role,
    email: created.email,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.status(201).json({ token, user: { id: created._id, name: created.name, user_role: created.user_role, email: created.email } });
}

export async function me(req: Request, res: Response) {
  // JWT-authenticated route - user attached to req by middleware
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });

  const user = await Employee.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });

  res.json(user);
}
