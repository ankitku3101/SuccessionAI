# Controllers

Controllers contain the business logic for each API endpoint.  
They receive requests from routes, validate input, interact with models, and send responses.

---

## auth.contoller.ts

```typescript
import { Request, Response } from 'express';
// Import authentication service or models as needed

export const login = async (req: Request, res: Response) => {
  // 1. Extract credentials from request body
  // 2. Validate credentials (e.g., check user exists, compare password)
  // 3. If valid, generate JWT token
  // 4. Return token and user info
  // 5. If invalid, return error
};

export const register = async (req: Request, res: Response) => {
  // 1. Extract user data from request body
  // 2. Validate data (e.g., check for required fields, unique email)
  // 3. Hash password
  // 4. Create new user in database
  // 5. Return success or error
};
```

**Explanation:**
- `login`:  
  - Receives credentials from the client.
  - Looks up the user in the database.
  - Compares the password (usually with bcrypt).
  - If valid, generates a JWT and returns it.
  - If invalid, sends an error response.
- `register`:  
  - Receives new user data.
  - Validates input (e.g., checks if email is unique).
  - Hashes the password for security.
  - Creates a new user record in the database.
  - Returns success or error.

---

## committee.controller.ts

```typescript
import { Request, Response } from 'express';
// Import committee model as needed

export const getCommittees = async (req: Request, res: Response) => {
  // 1. Query the database for all committees
  // 2. Return the list as JSON
};

export const createCommittee = async (req: Request, res: Response) => {
  // 1. Extract committee data from request body
  // 2. Validate data
  // 3. Create new committee in database
  // 4. Return the created committee or error
};
```

**Explanation:**
- `getCommittees`:  
  - Fetches all committee records from the database.
  - Returns them as a JSON array.
- `createCommittee`:  
  - Receives committee data from the client.
  - Validates the input.
  - Creates a new committee record.
  - Returns the created committee or an error.

---

## employee.controller.ts

```typescript
import { Request, Response } from 'express';
// Import employee model as needed

export const getEmployees = async (req: Request, res: Response) => {
  // 1. Query the database for all employees
  // 2. Return the list as JSON
};

export const createEmployee = async (req: Request, res: Response) => {
  // 1. Extract employee data from request body
  // 2. Validate data
  // 3. Create new employee in database
  // 4. Return the created employee or error
};
```

**Explanation:**
- `getEmployees`:  
  - Fetches all employee records from the database.
  - Returns them as a JSON array.
- `createEmployee`:  
  - Receives employee data from the client.
  - Validates the input.
  - Creates a new employee record.
  - Returns the created employee or an error.

---

**General Controller Flow:**
1. Receive request from route.
2. Extract and validate input.
3. Interact with the database via models.
4. Send a JSON response (success or error).

See the `models` README for details on the data structures.