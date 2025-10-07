# Models

Models define the structure of your MongoDB collections using Mongoose.  
They are used by controllers to interact with the database.

---

## Employee.ts

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  // Define employee fields, e.g.:
  // name: string;
  // position: string;
  // ...
}

const EmployeeSchema: Schema = new Schema({
  // ...schema fields...
});

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
```

**Explanation:**
- Imports Mongoose and TypeScript types.
- Defines an interface for employee documents.
- Defines the schema (fields like name, position, etc.).
- Exports the model for use in controllers.

---

## SuccessRole.ts

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface ISuccessRole extends Document {
  // Define success role fields, e.g.:
  // title: string;
  // description: string;
  // ...
}

const SuccessRoleSchema: Schema = new Schema({
  // ...schema fields...
});

export default mongoose.model<ISuccessRole>('SuccessRole', SuccessRoleSchema);
```

**Explanation:**
- Similar structure to Employee.
- Used for storing roles relevant to succession planning.

---

**Model Usage in Controllers:**
- Import the model.
- Use methods like `find()`, `findById()`, `create()`, etc., to interact with the database.