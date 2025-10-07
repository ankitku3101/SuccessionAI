# Server Source Overview

This folder contains the main source code for the backend API server.

## Main Entry Point

- **index.ts**  
  - Sets up the Express server.
  - Loads environment variables.
  - Connects to MongoDB using the config in `config/mongo.ts`.
  - Applies global middlewares (CORS, JSON parsing).
  - Mounts all API routes:
    - `/api/auth` → Authentication endpoints
    - `/api/employee` → Employee management endpoints
    - `/api/committee` → Committee management endpoints

## Folder Structure

- **config/**: Database connection logic.
- **controllers/**: Business logic for each API resource.
- **data/**: Static data for seeding or reference.
- **middlewares/**: Express middlewares (e.g., authentication).
- **models/**: Mongoose schemas/models for MongoDB.
- **routes/**: Express route definitions.
- **seed/**: Scripts for populating the database.
- **types/**: TypeScript type definitions.

---

## API Flow

1. **Request** hits a route (e.g., `/api/employee`).
2. **Route** forwards the request to the appropriate controller.
3. **Controller** handles business logic, interacts with models, and sends a response.
4. **Model** interacts with MongoDB for data persistence.
5. **Middleware** (like authentication) can protect routes as needed.

See each subfolder's README for detailed explanations of the API logic.