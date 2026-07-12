import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import departmentRoutes from './routes/departments.js';
import categoryRoutes from './routes/categories.js';
import employeeRoutes from './routes/employees.js';
import locationRoutes from './routes/locations.js';
import assetRoutes from './routes/assets.js';
import allocationRoutes from './routes/allocations.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/allocations', allocationRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'AssetFlow Backend' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
