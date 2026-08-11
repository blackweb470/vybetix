import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import Modular Routes
import authRoutes from './modules/auth/auth.routes';
import eventsRoutes from './modules/events/events.routes';
import ticketsRoutes from './modules/tickets/tickets.routes';
import paymentsRoutes from './modules/payments/payments.routes';
import scannerRoutes from './modules/scanner/scanner.routes';
import organizerRoutes from './modules/organizer/organizer.routes';
import adminRoutes from './modules/admin/admin.routes';
import whatsappRoutes from './modules/whatsapp/whatsapp.routes';
import { initCronJobs } from './services/cron';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Enable security headers with helmet
app.use(helmet());

// Enable CORS — restrict to frontend origin(s) via env in production
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000'];

const allowedOrigins = [...envOrigins, 'https://vybetix.com', 'https://www.vybetix.com'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-paystack-signature', 'x-device-fingerprint']
}));

// Request logger
app.use(morgan('dev'));

// JSON Body parser
app.use(express.json());

// ---------------------- Routes Register ----------------------
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/scanner', scannerRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/whatsapp', whatsappRoutes);

// Server check
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '⚡️ Vybetix High-Performance Backend API is active and running!',
    timestamp: new Date().toISOString()
  });
});

// Global API Fallback (404)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Requested route ${req.method} ${req.url} does not exist.`
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Global Error Audit]:', err.stack || err);
  
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred on the server.'
  });
});

// Boot listening socket
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`⚡️[server]: Vybetix API is listening on port ${PORT}`);
  initCronJobs();
});
export default app;

