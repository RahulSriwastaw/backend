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

// Import all modules - if any fail, server will crash during import (which is fine - we want to know)
import connectDB from './config/database.js';
import paymentRoutes from './routes/payment.js';
import templateRoutes from './routes/templates.js';
import generationRoutes from './routes/generation.js';
import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import creatorRoutes from './routes/creator.js';
import adminRoutes from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 8080;

// CORS - Allow all origins for development and Vercel deployments
app.use(cors({ 
  origin: true, 
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Root route for Railway health check (responds immediately)
app.get('/', (req, res) => {
  res.send('Backend is running successfully!');
});

// Health check endpoint (fast response for Railway)
app.get('/health', (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ 
      status: 'ok', 
      message: 'Backend is running', 
      database: dbStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Health check failed',
      error: error.message 
    });
  }
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

// API Routes - Mount all routes with /api prefix (with individual error handling)
const mountRoute = (path, route, name) => {
  try {
    if (route) {
      app.use(path, route);
      console.log(`✅ Route mounted: ${path}`);
      return true;
    } else {
      console.warn(`⚠️  Route not available: ${name}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error mounting route ${path}:`, error.message);
    console.error('Stack:', error.stack);
    return false;
  }
};

try {
  mountRoute('/api/auth', authRoutes, 'authRoutes');
  mountRoute('/api/payment', paymentRoutes, 'paymentRoutes');
  mountRoute('/api/templates', templateRoutes, 'templateRoutes');
  mountRoute('/api/generation', generationRoutes, 'generationRoutes');
  mountRoute('/api/wallet', walletRoutes, 'walletRoutes');
  mountRoute('/api/creator', creatorRoutes, 'creatorRoutes');
  mountRoute('/api/admin', adminRoutes, 'adminRoutes');
  console.log('✅ Route mounting completed');
} catch (error) {
  console.error('❌ Error during route mounting:', error.message);
  console.error('Stack:', error.stack);
  // Server will still start, but some routes may not work
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ 
    error: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

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

// Process error handlers - prevent server crashes
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

// Start server - ensure it stays alive
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
  console.log(`✅ Server is ready to accept connections`);
});

// Ensure server stays alive
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Keep server alive - handle errors gracefully
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
