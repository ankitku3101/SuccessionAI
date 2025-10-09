# Middlewares

Middlewares are functions that run before your route handlers.  
They can modify the request/response or halt the request if needed.

---

## auth.middleware.ts

```typescript
import { Request, Response, NextFunction } from 'express';
// Import JWT utilities as needed

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // 1. Check for Authorization header
  // 2. Extract and verify JWT token
  // 3. If valid, attach user info to req.user
  // 4. If invalid, return 401 Unauthorized
};
```

**Explanation:**
- Checks if the request has a valid JWT token.
- If valid, attaches user info to the request object and calls `next()` to proceed.
- If invalid or missing, sends a 401 Unauthorized response.
- Used to protect routes that require authentication.

---

**Usage Example:**
```typescript
app.use('/api/employee', authenticate, employeeRoutes);
```
This ensures only authenticated users can access employee endpoints.