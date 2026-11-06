import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import suppliersRoutes from './routes/suppliers.routes.js';
import productsRoutes from './routes/products.routes.js';
import salesRoutes from './routes/sales.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import customersRoutes from './routes/customers.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Endpoint de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'StockFlow Connect API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/settings', settingsRoutes);

// Middleware centralizado de errores
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend de StockFlow Connect corriendo en http://localhost:${PORT}`);
});

export default app;
