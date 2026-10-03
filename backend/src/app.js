const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Sanitize MongoDB operators from user input
app.use(mongoSanitize());

// Routes
app.use('/api/auth',       require('./routes/auth.routes'));
app.use('/api/grievances', require('./routes/grievance.routes'));
app.use('/api/patterns',   require('./routes/pattern.routes'));
app.use('/api/actions',    require('./routes/action.routes'));
app.use('/api/outcomes',   require('./routes/outcome.routes'));
app.use('/api/departments',require('./routes/department.routes'));
app.use('/api/search',     require('./routes/search.routes'));
app.use('/api/audit',      require('./routes/audit.routes'));
app.use('/api/admin',      require('./routes/admin.routes'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Campus Guardian 360 Backend', timestamp: new Date() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
