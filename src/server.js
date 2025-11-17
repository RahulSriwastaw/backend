/**
 * Rupantar AI Backend Server
 * 
 * IMPORTANT: You MUST whitelist 0.0.0.0/0 in MongoDB Atlas Network Access
 * Go to: https://cloud.mongodb.com → Network Access → Add IP Address → Allow Access from Anywhere
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// ============================================
// MIDDLEWARE (Order matters!)
// ============================================

// CORS - Allow all origins for development and Vercel deployments
app.use(cors({ 
  origin: true, 
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// ============================================
// BASIC ROUTES (Must work even if other routes fail)
// ============================================

// Root route for Railway health check (responds immediately)
app.get('/', (req, res) => {
  res.status(200).send('Backend is running successfully!');
});

// Health check endpoint (fast response for Railway)
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.status(200).json({ 
    status: 'ok', 
    message: 'Backend is running', 
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    port: PORT
  });
});

// Simple API test route (responds immediately)
app.get('/api', (req, res) => {
  res.status(200).json({ 
    message: 'API is working', 
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Connection test endpoint
app.get('/api/test-connections', async (req, res) => {
  try {
    const results = {
      mongodb: {
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        readyState: mongoose.connection.readyState,
        states: {
          0: 'disconnected',
          1: 'connected',
          2: 'connecting',
          3: 'disconnecting'
        }
      },
      cloudinary: {
        status: 'configured',
        accounts: {
          user: process.env.CLOUDINARY_USER_CLOUD_NAME || 'dno47zdrh',
          creator: process.env.CLOUDINARY_CREATOR_CLOUD_NAME || 'dmbrs338o',
          generated: process.env.CLOUDINARY_GENERATED_CLOUD_NAME || 'dkeigiajt',
        }
      },
      firebase: {
        status: 'configured',
        projectId: process.env.FIREBASE_PROJECT_ID || 'rupantra-ai',
      }
    };
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check connections', message: error.message });
  }
});

// ============================================
// IMPORT ROUTES (With error handling)
// ============================================

let connectDB = null;
let paymentRoutes = null;
let templateRoutes = null;
let generationRoutes = null;
let authRoutes = null;
let walletRoutes = null;
let creatorRoutes = null;
let adminRoutes = null;

// Import database connection
try {
  const dbModule = await import('./config/database.js');
  connectDB = dbModule.default;
  console.log('✅ Database module loaded');
} catch (error) {
  console.error('❌ Failed to import database module:', error.message);
}

// Import routes with individual error handling
try {
  const module = await import('./routes/payment.js');
  paymentRoutes = module.default;
  console.log('✅ Payment routes loaded');
} catch (error) {
  console.error('❌ Failed to import payment routes:', error.message);
}

try {
  const module = await import('./routes/templates.js');
  templateRoutes = module.default;
  console.log('✅ Template routes loaded');
} catch (error) {
  console.error('❌ Failed to import template routes:', error.message);
}

try {
  const module = await import('./routes/generation.js');
  generationRoutes = module.default;
  console.log('✅ Generation routes loaded');
} catch (error) {
  console.error('❌ Failed to import generation routes:', error.message);
}

try {
  const module = await import('./routes/auth.js');
  authRoutes = module.default;
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.error('❌ Failed to import auth routes:', error.message);
}

try {
  const module = await import('./routes/wallet.js');
  walletRoutes = module.default;
  console.log('✅ Wallet routes loaded');
} catch (error) {
  console.error('❌ Failed to import wallet routes:', error.message);
}

try {
  const module = await import('./routes/creator.js');
  creatorRoutes = module.default;
  console.log('✅ Creator routes loaded');
} catch (error) {
  console.error('❌ Failed to import creator routes:', error.message);
}

try {
  const module = await import('./routes/admin.js');
  adminRoutes = module.default;
  console.log('✅ Admin routes loaded');
} catch (error) {
  console.error('❌ Failed to import admin routes:', error.message);
}

// ============================================
// MOUNT API ROUTES
// ============================================

if (authRoutes) {
  app.use('/api/auth', authRoutes);
  console.log('✅ Route mounted: /api/auth');
}
if (paymentRoutes) {
  app.use('/api/payment', paymentRoutes);
  console.log('✅ Route mounted: /api/payment');
}
if (templateRoutes) {
  app.use('/api/templates', templateRoutes);
  console.log('✅ Route mounted: /api/templates');
}
if (generationRoutes) {
  app.use('/api/generation', generationRoutes);
  console.log('✅ Route mounted: /api/generation');
}
if (walletRoutes) {
  app.use('/api/wallet', walletRoutes);
  console.log('✅ Route mounted: /api/wallet');
}
if (creatorRoutes) {
  app.use('/api/creator', creatorRoutes);
  console.log('✅ Route mounted: /api/creator');
}
if (adminRoutes) {
  app.use('/api/admin', adminRoutes);
  console.log('✅ Route mounted: /api/admin');
}

console.log('✅ Route mounting completed');

// Debug: List all registered routes (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/routes', (req, res) => {
    const routes = [];
    app._router.stack.forEach((middleware) => {
      if (middleware.route) {
        routes.push({
          path: middleware.route.path,
          methods: Object.keys(middleware.route.methods)
        });
      } else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler) => {
          if (handler.route) {
            routes.push({
              path: middleware.regexp.source.replace(/\\\//g, '/').replace(/\^|\$|\?/g, '') + handler.route.path,
              methods: Object.keys(handler.route.methods)
            });
          }
        });
      }
    });
    res.json({ routes });
  });
}

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler (must be after all routes)
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Error handling middleware (must be last)
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ 
    error: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// PROCESS ERROR HANDLERS
// ============================================

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit - let server continue running
  console.warn('⚠️  Server will continue running despite uncaught exception');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Don't exit - let server continue running
  console.warn('⚠️  Server will continue running despite unhandled rejection');
});

// ============================================
// DATABASE CONNECTION (Non-blocking)
// ============================================

// Connect to MongoDB (non-blocking - server will start even if MongoDB fails)
if (connectDB) {
  connectDB().catch((err) => {
    console.error('⚠️  Failed to connect to MongoDB:', err.message);
    console.error('⚠️  Server will continue but database operations may fail.');
    console.error('⚠️  Please check:');
    console.error('   1. MongoDB Atlas IP whitelist (add 0.0.0.0/0 for all IPs)');
    console.error('   2. MongoDB connection string in Railway variables (MONGODB_URI)');
    console.error('   3. Internet connection');
  });
} else {
  console.warn('⚠️  Database connection module not loaded - MongoDB operations will fail');
}

// ============================================
// START SERVER
// ============================================

console.log(`🚀 Starting server on port ${PORT}...`);
console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🌐 PORT from env: ${process.env.PORT || 'not set (using default 8080)'}`);

const server = app.listen(PORT, '0.0.0.0', () => {
  const address = server.address();
  console.log(`✅ Server Running successfully!`);
  console.log(`✅ Port: ${PORT}`);
  console.log(`✅ Address: ${address ? `${address.address}:${address.port}` : 'unknown'}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`✅ Root endpoint: http://0.0.0.0:${PORT}/`);
  console.log(`✅ API endpoint: http://0.0.0.0:${PORT}/api`);
  console.log(`✅ Server is ready to accept connections`);
  
  // Verify server is listening
  if (server.listening) {
    console.log(`✅ Server is listening and ready`);
  } else {
    console.error(`❌ Server is NOT listening!`);
  }
});

// Ensure server stays alive
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Server error handler
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`⚠️  Port ${PORT} is already in use`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
