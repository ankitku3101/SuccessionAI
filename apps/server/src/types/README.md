# Types

This folder contains TypeScript type definitions and extensions.

---

## express.d.ts

```typescript
import 'express';

declare module 'express' {
  export interface Request {
    // Add custom properties, e.g.:
    // user?: IUser;
  }
}
```

**Explanation:**
- Extends the Express `Request` interface to allow attaching custom properties (like `user` after authentication).
- Ensures type safety when using these properties in controllers or middlewares.

---

**Usage Example:**
- After authentication, you can safely access `req.user` in your controllers.

---

Use this folder to add or override TypeScript types as your project grows.