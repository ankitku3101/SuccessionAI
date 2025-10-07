import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        user_role: string;
        email: string;
      };
    }
  }
}
