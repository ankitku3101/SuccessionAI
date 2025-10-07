# Seed Scripts

Seed scripts populate the database with initial data for development or testing.

---

## seedEmployees.ts

```typescript
import mongoose from 'mongoose';
import { connectMongo } from '../config/mongo';
import Employee from '../models/Employee';
// Import CSV/JSON parsing utilities as needed

const seedEmployees = async () => {
  await connectMongo();
  // 1. Read employee data from CSV/JSON
  // 2. Parse data into objects
  // 3. Insert data into Employee collection
  mongoose.disconnect();
};

seedEmployees();
```

**Explanation:**
- Connects to MongoDB.
- Reads and parses employee data from a file.
- Inserts the data into the Employee collection.
- Disconnects from the database.

---

## seedSuccessRoles.ts

```typescript
import mongoose from 'mongoose';
import { connectMongo } from '../config/mongo';
import SuccessRole from '../models/SuccessRole';
// Import JSON parsing utilities as needed

const seedSuccessRoles = async () => {
  await connectMongo();
  // 1. Read success role data from JSON
  // 2. Parse data into objects
  // 3. Insert data into SuccessRole collection
  mongoose.disconnect();
};

seedSuccessRoles();
```

**Explanation:**
- Similar to `seedEmployees.ts`, but for success roles.

---

**How to Use:**
- Run these scripts manually to initialize or reset your database with sample data.