import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/mongo';
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import committeeRoutes from './routes/committee.routes';

dotenv.config();

const app = express();

connectDB();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/committee', committeeRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
