import express from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { verifyFirebaseToken } from '../config/firebaseAdmin.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('=== User Registration Request ===');
    console.log('MongoDB Connection State:', mongoose.connection.readyState);
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
    
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. ReadyState:', mongoose.connection.readyState);
      return res.status(503).json({ error: 'Database not connected. Please wait for MongoDB connection.' });
    }

    const { email, password, fullName, phone, photoURL, firebaseUid } = req.body;

    if (!email || !fullName) {
      console.error('Missing required fields:', { hasEmail: !!email, hasFullName: !!fullName });
      return res.status(400).json({ error: 'Email and full name are required' });
    }

    // Password is optional for OAuth users (Google login)
    if (password && password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists in MongoDB (by email or firebaseUid if provided)
    const normalizedEmail = email.toLowerCase();
    let query;
    if (firebaseUid) {
      query = {
        $or: [
          { email: normalizedEmail },
          { firebaseUid: firebaseUid }
        ]
      };
    } else {
      query = { email: normalizedEmail };
    }
    
    let existingUser = await User.findOne(query).maxTimeMS(10000);
    
    if (existingUser) {
      // User exists, update lastActive and return existing user (for OAuth login)
      existingUser.lastActive = new Date();
      // Update profile image if provided and different
      if (photoURL && photoURL !== existingUser.profileImage) {
        existingUser.profileImage = photoURL;
      }
      // Update firebaseUid if provided and not set
      if (firebaseUid && !existingUser.firebaseUid) {
        existingUser.firebaseUid = firebaseUid;
      }
      await existingUser.save();
      
      const userResponse = {
        id: existingUser._id.toString(),
        email: existingUser.email,
        fullName: existingUser.fullName,
        phone: existingUser.phone || '',
        isCreator: existingUser.isCreator || false,
        isVerified: existingUser.isVerified || false,
        memberSince: existingUser.memberSince || existingUser.createdAt,
        pointsBalance: existingUser.pointsBalance || 100,
        profilePicture: existingUser.profileImage || photoURL || null,
      };
      return res.status(200).json({ user: userResponse, token: `token_${existingUser._id}` });
    }

    // Create new user in MongoDB (for Google OAuth or regular registration)
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUser = new User({
      userId,
      email: normalizedEmail,
      fullName,
      phone: phone || '',
      profileImage: photoURL || null,
      password: password ? crypto.createHash('sha256').update(password).digest('hex') : null, // OAuth users don't have password
      firebaseUid: firebaseUid || null, // Store Firebase UID for Google OAuth users
      isCreator: false,
      isVerified: false,
      pointsBalance: 100, // Welcome bonus
      status: 'active',
      totalGenerations: 0,
      lastActive: new Date(),
    });

    try {
      await newUser.save();
      console.log(`✅ New user created: ${newUser.email} (${newUser._id}) - Google OAuth: ${!!firebaseUid}`);
    } catch (saveError) {
      console.error('Error saving new user:', saveError);
      throw saveError;
    }

    // Return user without password
    const userResponse = {
      id: newUser._id.toString(),
      email: newUser.email,
      fullName: newUser.fullName,
      phone: newUser.phone || '',
      isCreator: newUser.isCreator || false,
      isVerified: newUser.isVerified || false,
      memberSince: newUser.memberSince || newUser.createdAt,
      pointsBalance: newUser.pointsBalance || 100,
      profilePicture: newUser.profileImage || photoURL || null,
    };
    
    res.status(201).json({ user: userResponse, token: `token_${newUser._id}` });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    
    if (error.code === 11000) {
      // Duplicate key error
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'email';
      return res.status(400).json({ 
        error: `User with this ${duplicateField} already exists`,
        field: duplicateField
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors || {}).map(e => e.message).join(', ');
      return res.status(400).json({ error: `Validation failed: ${errors}` });
    }
    
    if (error.name === 'MongooseError' || error.message?.includes('buffering')) {
      return res.status(503).json({ error: 'Database connection error. Please try again.' });
    }
    
    res.status(500).json({ 
      error: error.message || 'Registration failed',
      ...(process.env.NODE_ENV === 'development' && { 
        details: {
          name: error.name,
          stack: error.stack
        }
      })
    });
  }
});

// Firebase Login - Automatically syncs Firebase user to MongoDB
// This endpoint should be called after Firebase authentication (Email/Phone/Google)
router.post('/firebase-login', async (req, res) => {
  try {
    console.log('=== Firebase Login Request ===');
    const { firebaseToken, fullName, phone } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ error: 'Firebase token is required' });
    }

    // Use the existing syncUser endpoint logic
    // This ensures Firebase user is always synced to MongoDB
    return await syncFirebaseUserToMongoDB(req, res, firebaseToken, fullName, phone);
  } catch (error) {
    console.error('Firebase login error:', error);
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// Helper function to sync Firebase user to MongoDB
async function syncFirebaseUserToMongoDB(req, res, firebaseToken, fullName, phone) {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. ReadyState:', mongoose.connection.readyState);
      return res.status(503).json({ error: 'Database not connected. Please wait for MongoDB connection.' });
    }

    // Verify Firebase token
    let userInfo;
    try {
      userInfo = await verifyFirebaseToken(firebaseToken);
      console.log('✅ Firebase token verified:', userInfo.uid);
    } catch (error) {
      console.error('❌ Firebase token verification failed:', error);
      return res.status(401).json({ 
        error: 'Invalid Firebase token',
        details: error.message 
      });
    }

    // Extract user info from verified token
    const firebaseUid = userInfo.uid;
    const email = userInfo.email || '';
    const displayName = fullName || userInfo.name || userInfo.email?.split('@')[0] || 'User';
    const photoURL = userInfo.picture || null;
    const emailVerified = userInfo.email_verified || false;
    const phoneNumber = phone || userInfo.phone_number || null;

    if (!email) {
      return res.status(400).json({ error: 'Email is required from Firebase token' });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if user already exists in MongoDB
    let existingUser = await User.findOne({
      $or: [
        { firebaseUid: firebaseUid },
        { email: normalizedEmail }
      ]
    }).maxTimeMS(10000);
    
    if (existingUser) {
      // User exists - update their info
      existingUser.firebaseUid = firebaseUid;
      existingUser.email = normalizedEmail;
      existingUser.fullName = displayName;
      existingUser.lastActive = new Date();
      
      if (photoURL && photoURL !== existingUser.profileImage) {
        existingUser.profileImage = photoURL;
      }
      
      if (phoneNumber && phoneNumber !== existingUser.phone) {
        existingUser.phone = phoneNumber;
      }
      
      if (emailVerified && !existingUser.isVerified) {
        existingUser.isVerified = true;
      }

      await existingUser.save();
      console.log('✅ User updated in MongoDB:', existingUser.email);

      const userResponse = {
        id: existingUser._id.toString(),
        email: existingUser.email,
        fullName: existingUser.fullName,
        phone: existingUser.phone || '',
        isCreator: existingUser.isCreator || false,
        isVerified: existingUser.isVerified || false,
        memberSince: existingUser.memberSince || existingUser.createdAt,
        pointsBalance: existingUser.pointsBalance || 100,
        profilePicture: existingUser.profileImage || photoURL || null,
        firebaseUid: existingUser.firebaseUid,
        role: existingUser.role || (existingUser.isCreator ? 'creator' : 'user'),
      };

      return res.json({ 
        user: userResponse, 
        token: `token_${existingUser._id}`,
        isNewUser: false
      });
    } else {
      // New user - create in MongoDB
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const username = email.split('@')[0] + '_' + Date.now().toString().slice(-6);
      
      const newUser = new User({
        userId,
        firebaseUid: firebaseUid,
        email: normalizedEmail,
        fullName: displayName,
        username: username,
        phone: phoneNumber || '',
        profileImage: photoURL || null,
        password: null,
        role: 'user', // Default role
        isCreator: false,
        isVerified: emailVerified,
        pointsBalance: 100,
        status: 'active',
        totalGenerations: 0,
        lastActive: new Date(),
      });

      await newUser.save();
      console.log('✅ New user created in MongoDB:', newUser.email);

      const userResponse = {
        id: newUser._id.toString(),
        email: newUser.email,
        fullName: newUser.fullName,
        phone: newUser.phone || '',
        isCreator: newUser.isCreator || false,
        isVerified: newUser.isVerified || false,
        memberSince: newUser.memberSince || newUser.createdAt,
        pointsBalance: newUser.pointsBalance || 100,
        profilePicture: newUser.profileImage || photoURL || null,
        firebaseUid: newUser.firebaseUid,
        role: newUser.role || 'user',
      };

      return res.status(201).json({ 
        user: userResponse, 
        token: `token_${newUser._id}`,
        isNewUser: true
      });
    }
  } catch (error) {
    console.error('Sync Firebase user error:', error);
    throw error;
  }
}

// Traditional Email/Password Login (for non-Firebase users)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user in MongoDB (include password field)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    if (!user.password || user.password !== hashedPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update lastActive
    user.lastActive = new Date();
    await user.save();

    // Return user without password
    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      phone: user.phone || '',
      isCreator: user.isCreator || false,
      isVerified: user.isVerified || false,
      memberSince: user.memberSince || user.createdAt,
      pointsBalance: user.pointsBalance || 100,
      profilePicture: user.profileImage || null,
      role: user.role || (user.isCreator ? 'creator' : 'user'),
    };
    
    res.json({ user: userResponse, token: `token_${user._id}` });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync Firebase user with MongoDB
// This endpoint should be called after every Firebase login (Google, Email, OTP)
// NOTE: Use /api/auth/firebase-login for automatic sync on login
router.post('/syncUser', async (req, res) => {
  try {
    console.log('=== Sync User Request ===');
    console.log('MongoDB Connection State:', mongoose.connection.readyState);
    
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      console.error('MongoDB not connected. ReadyState:', mongoose.connection.readyState);
      return res.status(503).json({ error: 'Database not connected. Please wait for MongoDB connection.' });
    }

    const { firebaseToken, fullName, phone } = req.body;

    if (!firebaseToken) {
      return res.status(400).json({ error: 'Firebase token is required' });
    }
    
    // Use the helper function to sync user
    return await syncFirebaseUserToMongoDB(req, res, firebaseToken, fullName, phone);
  } catch (error) {
    console.error('Sync user error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    
    if (error.code === 11000) {
      // Duplicate key error
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'email';
      return res.status(400).json({ 
        error: `User with this ${duplicateField} already exists`,
        field: duplicateField
      });
    }
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors || {}).map(e => e.message).join(', ');
      return res.status(400).json({ error: `Validation failed: ${errors}` });
    }
    
    if (error.name === 'MongooseError' || error.message?.includes('buffering')) {
      return res.status(503).json({ error: 'Database connection error. Please try again.' });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to sync user',
      ...(process.env.NODE_ENV === 'development' && { 
        details: {
          name: error.name,
          stack: error.stack
        }
      })
    });
  }
});

// Test endpoint to verify routes are working
router.get('/test-routes', (req, res) => {
  res.json({ 
    message: 'Auth routes are working',
    availableRoutes: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/firebase-login', // NEW: Auto-sync Firebase users to MongoDB
      'POST /api/auth/syncUser',
      'POST /api/auth/syncAllFirebaseUsers',
      'GET /api/auth/me',
      'GET /api/auth/test-routes'
    ]
  });
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-auth-token'] ||
                  req.query.token;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized - Token required' });
    }

    const userId = token.replace('token_', '');
    
    // Find user in MongoDB
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user without password
    const userResponse = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      phone: user.phone || '',
      isCreator: user.isCreator || false,
      isVerified: user.isVerified || false,
      memberSince: user.memberSince || user.createdAt,
      pointsBalance: user.pointsBalance || 100,
      profilePicture: user.profileImage || null,
    };
    
    res.json({ user: userResponse });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper endpoint to list all Firebase users and sync them to MongoDB
// This requires Firebase Admin SDK with proper credentials
router.post('/syncAllFirebaseUsers', async (req, res) => {
  try {
    console.log('=== Manual Sync All Firebase Users ===');
    
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    // Import Firebase Admin instance
    const firebaseAdminModule = await import('../config/firebaseAdmin.js');
    const firebaseAdmin = firebaseAdminModule.default || firebaseAdminModule.firebaseAdmin;
    
    if (!firebaseAdmin) {
      return res.status(503).json({ 
        error: 'Firebase Admin SDK not initialized',
        solution: 'Please check Firebase Admin configuration in config/firebaseAdmin.js'
      });
    }

    let syncedCount = 0;
    let errorCount = 0;
    const errors = [];

    // List all Firebase users (max 1000 at a time)
    let nextPageToken;
    do {
      const listUsersResult = await firebaseAdmin.auth().listUsers(1000, nextPageToken);
      
      for (const firebaseUser of listUsersResult.users) {
        try {
          const email = firebaseUser.email || '';
          const firebaseUid = firebaseUser.uid;
          const displayName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User';
          const photoURL = firebaseUser.photoURL || null;
          const emailVerified = firebaseUser.emailVerified || false;
          const phoneNumber = firebaseUser.phoneNumber || null;

          if (!email) {
            console.warn('Skipping user without email:', firebaseUid);
            continue;
          }

          const normalizedEmail = email.toLowerCase();

          // Check if user exists in MongoDB
          let existingUser = await User.findOne({
            $or: [
              { firebaseUid: firebaseUid },
              { email: normalizedEmail }
            ]
          });

          if (existingUser) {
            // Update existing user
            existingUser.firebaseUid = firebaseUid;
            existingUser.email = normalizedEmail;
            existingUser.fullName = displayName;
            if (photoURL) existingUser.profileImage = photoURL;
            if (phoneNumber) existingUser.phone = phoneNumber;
            if (emailVerified) existingUser.isVerified = true;
            await existingUser.save();
            console.log(`✅ Updated user: ${email}`);
          } else {
            // Create new user
            const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // Generate username from email if not provided
            const username = email.split('@')[0] + '_' + Date.now().toString().slice(-6);
            
            const newUser = new User({
              userId,
              firebaseUid: firebaseUid,
              email: normalizedEmail,
              fullName: displayName,
              username: username, // Add username to avoid validation issues
              phone: phoneNumber || '',
              profileImage: photoURL || null,
              password: null,
              isCreator: false,
              isVerified: emailVerified,
              pointsBalance: 100,
              status: 'active',
              totalGenerations: 0,
              lastActive: new Date(),
            });
            await newUser.save();
            console.log(`✅ Created user: ${email}`);
            
            // Verify user was actually saved
            const verifySaved = await User.findById(newUser._id);
            if (!verifySaved) {
              console.error(`❌ User ${email} was not saved properly!`);
              throw new Error(`Failed to save user ${email} to database`);
            }
            console.log(`✅ Verified user ${email} saved with ID: ${newUser._id}`);
          }
          syncedCount++;
        } catch (userError) {
          errorCount++;
          errors.push({ uid: firebaseUser.uid, error: userError.message });
          console.error(`❌ Error syncing user ${firebaseUser.uid}:`, userError);
        }
      }

      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    res.json({
      success: true,
      message: `Synced ${syncedCount} users from Firebase to MongoDB`,
      synced: syncedCount,
      errors: errorCount,
      errorDetails: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Sync all users error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Make sure FIREBASE_SERVICE_ACCOUNT_KEY is set in backend .env file'
    });
  }
});

export default router;

