require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const { Server } = require('socket.io');
const logger = require('./utils/logger');

// Initialize AI services
const proposalsAIService = require('./services/ai/proposals-ai-service');

// Initialize ProposalsAI service if API key is available
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-placeholder') {
  try {
    proposalsAIService.initialize(process.env.OPENAI_API_KEY);
    logger.info('✅ ProposalsAI service initialized');
  } catch (error) {
    logger.warn('⚠️ ProposalsAI service initialization failed:', error.message);
  }
} else {
  logger.warn('⚠️ OPENAI_API_KEY not set - AI proposals will not work');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Compression middleware - compress all responses
app.use(compression({
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Middleware - РАЗРЕШАЕМ ВСЁ (временно для отладки)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', require('./api/auth'));
app.use('/api/users', require('./api/users'));
app.use('/api/clients', require('./api/clients'));
app.use('/api/leads', require('./api/leads'));
app.use('/api/pipelines', require('./api/pipelines'));
app.use('/api/tasks', require('./api/tasks'));
app.use('/api/calls', require('./api/calls'));
app.use('/api/activities', require('./api/activities'));
app.use('/api/emails', require('./api/emails'));
app.use('/api/proposals', require('./api/proposals'));
app.use('/api/settings', require('./api/settings'));
app.use('/api/webhooks', require('./api/webhooks'));
app.use('/api/dashboard', require('./api/dashboard'));
app.use('/api/projects', require('./api/projects'));
app.use('/api/expenses', require('./api/expenses'));
app.use('/api/deals', require('./api/deals'));
app.use('/api/uploads', require('./api/uploads'));

// Internal API for Telegram bot (no auth)
app.use('/api/bot-internal', require('./api/bot-internal'));

// New integrations
app.use('/api/retell', require('./api/retell'));
app.use('/api/agents', require('./api/agents'));
app.use('/api/offerteo', require('./api/offerteo'));

// Telegram webhook
const telegramWebhookRouter = require('./api/telegram-webhook');
app.use('/api/telegram-webhook', telegramWebhookRouter);

// NOTE: Telegram bot теперь работает в отдельном контейнере (pbk-integrations) в polling режиме
// Webhook не работает через Cloudflare + Starlink CGNAT
// Register Telegram bot instance for webhook processing (DISABLED - bot runs in separate container)
// try {
//   const { bot } = require('./integrations/unified-integration-manager');
//   if (bot && telegramWebhookRouter.registerBot) {
//     telegramWebhookRouter.registerBot(bot);
//     logger.info('✅ Telegram bot registered for webhook processing');
//   }
// } catch (error) {
//   logger.warn('⚠️ Telegram integration not loaded (this is ok if running separately)');
// }
logger.info('ℹ️ Telegram bot runs in separate integrations container (polling mode)');

// AI Copilot
app.use('/api/ai', require('./routes/ai'));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500
    }
  });
});

// Socket.io connection
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || process.env.API_PORT || 5001;

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 PBK CRM Backend running on port ${PORT}`);
});

module.exports = { app, io };
