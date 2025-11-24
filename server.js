require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { authenticateApiKey } = require('./middleware/auth');
const { apiLimiter } = require('./middleware/rateLimit');
const serversRouter = require('./routes/servers');
const statsRouter = require('./routes/stats');
const notifyRouter = require('./routes/notify');
const { startCleanup, stopCleanup } = require('./tasks/cleanup');
const Logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for dashboard
}));

// CORS configuration
app.use(cors({
  origin: '*', // Allow all origins (adjust for production)
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api', apiLimiter);

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes (require authentication)
app.use('/api/notify', authenticateApiKey, notifyRouter);
app.use('/api/servers', authenticateApiKey, serversRouter);
app.use('/api/stats', authenticateApiKey, statsRouter);

// Root route - serve dashboard
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  Logger.error('Unhandled error', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
  Logger.info(`Server started on port ${PORT}`);
  Logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Validate configuration
  if (!process.env.DISCORD_WEBHOOK_URL) {
    Logger.error('WARNING: DISCORD_WEBHOOK_URL not set');
  }
  if (!process.env.API_KEY) {
    Logger.error('WARNING: API_KEY not set');
  }
  
  // Start cleanup task for expiring entries
  startCleanup();
  
  Logger.info('All services started');
});

// Graceful shutdown
function gracefulShutdown(signal) {
  Logger.info(`${signal} received, shutting down gracefully...`);
  stopCleanup();
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

