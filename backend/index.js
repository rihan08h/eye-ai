require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const { validateEnv } = require('./config/env');
const connectDB = require('./config/db');
const { checkMLServiceHealth } = require('./services/mlService');
const errorHandler = require('./middleware/errorHandler');

// ─── Route Imports ─────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const screeningRoutes = require('./routes/screening.routes');
const referralRoutes = require('./routes/referral.routes');
const campRoutes = require('./routes/camp.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const chatRoutes = require('./routes/chat.routes');
const reviewRoutes = require('./routes/review.routes');

// ─── App Init ──────────────────────────────────────────────────────────────
// Validate configuration before anything binds a port. An insecure production
// deployment should be impossible to start, not merely discouraged.
try {
  validateEnv();
} catch (err) {
  process.exit(1);
}

const app = express();
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Connect to MongoDB
connectDB();

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Allow cross-origin images for canvas and Grad-CAM
  })
);

// Rate limiting — 300 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter rate limit on auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
});
app.use('/api/auth', authLimiter);

// ─── General Middleware ────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true, // Allow cookies to be sent cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use(cookieParser());

// Static file serving for fundus image uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  // Reports the real state of the model service so the UI can warn an
  // operator before they upload an image that cannot be analysed.
  const ml = await checkMLServiceHealth();

  res.status(200).json({
    success: true,
    message: 'RetinaAI Clinical API is operational',
    environment: process.env.NODE_ENV,
    aiModel: ml,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/screenings', screeningRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/camps', campRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', chatRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found.`,
  });
});

// ─── Global Error Handler ──────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend: ${process.env.FRONTEND_URL}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 Unhandled Promise Rejection:', err.message);
});

// Graceful shutdown — let in-flight requests finish rather than dropping a
// screening upload mid-write during a rolling deploy.
const shutdown = (signal) => {
  console.log(`\n${signal} received, shutting down...`);
  server.close(() => {
    require('mongoose').connection.close(false, () => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
