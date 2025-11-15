# Firebase Authentication Usage Guide

## Overview

Firebase Admin SDK is now properly configured with service account credentials. This allows the backend to verify Firebase ID tokens from both email/password and Google OAuth logins.

## Files Created/Updated

1. **`src/config/firebaseAdmin.js`** - Firebase Admin SDK initialization with service account
2. **`src/middleware/firebaseAuth.js`** - Express middleware for token verification
3. **`src/routes/auth.js`** - Updated to use new `verifyFirebaseToken` function

## Usage Examples

### 1. Using the Middleware in Routes

```javascript
import express from 'express';
import { authMiddleware } from '../middleware/firebaseAuth.js';

const router = express.Router();

// Protected route - requires Firebase token
router.get('/protected', authMiddleware, (req, res) => {
  // req.user contains:
  // {
  //   uid: 'firebase-user-id',
  //   email: 'user@example.com',
  //   name: 'User Name',
  //   picture: 'https://...',
  //   email_verified: true,
  //   phone_number: '+1234567890'
  // }
  
  res.json({
    message: 'This is a protected route',
    user: req.user
  });
});

// Optional auth - works with or without token
import { optionalAuthMiddleware } from '../middleware/firebaseAuth.js';

router.get('/public', optionalAuthMiddleware, (req, res) => {
  if (req.user) {
    res.json({ message: 'Authenticated user', user: req.user });
  } else {
    res.json({ message: 'Guest user' });
  }
});
```

### 2. Manual Token Verification

```javascript
import { verifyFirebaseToken } from '../config/firebaseAdmin.js';

router.post('/custom-endpoint', async (req, res) => {
  try {
    const { firebaseToken } = req.body;
    
    // Verify token
    const userInfo = await verifyFirebaseToken(firebaseToken);
    
    // userInfo contains:
    // {
    //   uid: 'firebase-user-id',
    //   email: 'user@example.com',
    //   name: 'User Name',
    //   picture: 'https://...',
    //   email_verified: true,
    //   phone_number: '+1234567890',
    //   firebase_claims: { ... } // Full Firebase token claims
    // }
    
    res.json({ user: userInfo });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});
```

### 3. Frontend Usage

#### Email/Password Login
```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

// Login
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const idToken = await userCredential.user.getIdToken();

// Send to backend
const response = await fetch('http://localhost:4000/api/auth/syncUser', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ firebaseToken: idToken })
});
```

#### Google OAuth Login
```javascript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase';

const provider = new GoogleAuthProvider();
const userCredential = await signInWithPopup(auth, provider);
const idToken = await userCredential.user.getIdToken();

// Send to backend
const response = await fetch('http://localhost:4000/api/auth/syncUser', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ firebaseToken: idToken })
});
```

#### Protected API Calls
```javascript
// Get Firebase token
const idToken = await auth.currentUser.getIdToken();

// Make authenticated request
const response = await fetch('http://localhost:4000/api/protected-route', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  }
});
```

## API Endpoints

### `/api/auth/syncUser` (POST)
Syncs Firebase user to MongoDB. Should be called after every Firebase login.

**Request:**
```json
{
  "firebaseToken": "firebase-id-token",
  "fullName": "Optional Full Name",
  "phone": "Optional Phone Number"
}
```

**Response:**
```json
{
  "user": {
    "id": "mongodb-user-id",
    "email": "user@example.com",
    "fullName": "User Name",
    "firebaseUid": "firebase-user-id"
  },
  "token": "token_mongodb-user-id",
  "isNewUser": true
}
```

### `/api/auth/syncAllFirebaseUsers` (POST)
Manually sync all Firebase users to MongoDB. Useful for initial setup.

**Response:**
```json
{
  "success": true,
  "message": "Synced 10 users from Firebase to MongoDB",
  "synced": 10,
  "errors": 0
}
```

## Error Handling

The middleware and functions throw specific errors:

- **Token Expired**: `Firebase token has expired. Please login again.`
- **Token Revoked**: `Firebase token has been revoked. Please login again.`
- **Invalid Token**: `Invalid Firebase token format.`
- **Not Initialized**: `Firebase Admin not initialized`

## Configuration

Service account credentials are hardcoded in `src/config/firebaseAdmin.js`. The private key is automatically formatted with proper line breaks using `.replace(/\\n/g, '\n')`.

To use environment variables instead, set:
```env
FIREBASE_PROJECT_ID=rupantra-ai
FIREBASE_PRIVATE_KEY_ID=1ace185ef545b93a608a5658b799cf0d089a4abf
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@rupantra-ai.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=107747358782493789631
```

## Testing

1. **Test Token Verification:**
```bash
curl -X POST http://localhost:4000/api/auth/syncUser \
  -H "Content-Type: application/json" \
  -d '{"firebaseToken": "your-firebase-token"}'
```

2. **Test Protected Route:**
```bash
curl -X GET http://localhost:4000/api/protected-route \
  -H "Authorization: Bearer your-firebase-token"
```

## Notes

- Both email/password and Google OAuth logins are supported
- Tokens are automatically verified and decoded
- User information is attached to `req.user` in protected routes
- The middleware works for both user frontend and admin panel frontend

