import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/mongo';
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import committeeRoutes from './routes/committee.routes';
import cors from 'cors';


dotenv.config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/committee', committeeRoutes);

app.use('/health', (req, res) => {
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
