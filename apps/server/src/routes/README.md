# Routes

This folder contains the Express route definitions for the API.  
Each route file maps HTTP endpoints to controller functions, which handle the business logic.

---

## auth.routes.ts

```typescript
import { Router } from 'express';
import { login, register } from '../controllers/auth.contoller';

const router = Router();

// Route for user login
router.post('/login', login);

// Route for user registration
router.post('/register', register);

export default router;
```

**Explanation:**
- `import { Router } from 'express';`  
  Imports the Express Router, which is used to define modular route handlers.
- `import { login, register } from '../controllers/auth.contoller';`  
  Imports the controller functions for authentication.
- `const router = Router();`  
  Creates a new router instance.
- `router.post('/login', login);`  
  Defines a POST endpoint `/login` that calls the `login` controller. This endpoint expects user credentials and returns a JWT if successful.
- `router.post('/register', register);`  
  Defines a POST endpoint `/register` that calls the `register` controller. This endpoint expects user details and creates a new user.
- `export default router;`  
  Exports the router to be used in the main app.

---

## committee.routes.ts

```typescript
import { Router } from 'express';
import { getCommittees, createCommittee } from '../controllers/committee.controller';

const router = Router();

// Route to get all committees
router.get('/', getCommittees);

// Route to create a new committee
router.post('/', createCommittee);

export default router;
```

**Explanation:**
- Imports the Express Router and committee controller functions.
- `router.get('/', getCommittees);`  
  Handles GET requests to `/api/committee/`. Calls `getCommittees` to fetch all committees from the database.
- `router.post('/', createCommittee);`  
  Handles POST requests to `/api/committee/`. Calls `createCommittee` to add a new committee.

---

## employee.routes.ts

```typescript
import { Router } from 'express';
import { getEmployees, createEmployee } from '../controllers/employee.controller';

const router = Router();

// Route to get all employees
router.get('/', getEmployees);

// Route to create a new employee
router.post('/', createEmployee);

export default router;
```

**Explanation:**
- Imports the Express Router and employee controller functions.
- `router.get('/', getEmployees);`  
  Handles GET requests to `/api/employee/`. Calls `getEmployees` to fetch all employees.
- `router.post('/', createEmployee);`  
  Handles POST requests to `/api/employee/`. Calls `createEmployee` to add a new employee.

---

**General Route Flow:**
1. The main app (`index.ts`) mounts these routers at their respective base paths.
2. When a request matches a route, the corresponding controller function is called.
3. Controllers handle validation, interact with the database, and send responses.

See the `controllers` README for a breakdown of the controller logic.