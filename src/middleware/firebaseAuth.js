import { verifyFirebaseToken } from '../config/firebaseAdmin.js';

/**
 * Express middleware to verify Firebase ID token
 * Reads Authorization: Bearer <token> header
 * Verifies token and attaches user info to req.user
 * 
 * Usage:
 *   router.get('/protected', authMiddleware, (req, res) => {
 *     const user = req.user; // { uid, email, name, picture, email_verified }
 *     res.json({ message: 'Protected route', user });
 *   });
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header. Expected: Bearer <token>'
      });
    }
    
    // Extract token
    const idToken = authHeader.split('Bearer ')[1];
    
    if (!idToken) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Firebase token is required'
      });
    }
    
    // Verify token
    const userInfo = await verifyFirebaseToken(idToken);
    
    // Attach user info to request object
    req.user = {
      uid: userInfo.uid,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      email_verified: userInfo.email_verified,
      phone_number: userInfo.phone_number,
    };
    
    // Also attach full Firebase claims if needed
    req.firebaseClaims = userInfo.firebase_claims;
    
    // Move to next middleware
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    
    // Return appropriate error response
    if (error.message.includes('expired')) {
      return res.status(401).json({ 
        error: 'Token Expired',
        message: error.message
      });
    } else if (error.message.includes('revoked') || error.message.includes('Invalid')) {
      return res.status(401).json({ 
        error: 'Invalid Token',
        message: error.message
      });
    }
    
    return res.status(401).json({ 
      error: 'Authentication Failed',
      message: error.message || 'Failed to verify Firebase token'
    });
  }
};

/**
 * Optional middleware - doesn't fail if token is missing
 * Useful for routes that work with or without authentication
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const idToken = authHeader.split('Bearer ')[1];
      
      if (idToken) {
        try {
          const userInfo = await verifyFirebaseToken(idToken);
          req.user = {
            uid: userInfo.uid,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            email_verified: userInfo.email_verified,
            phone_number: userInfo.phone_number,
          };
          req.firebaseClaims = userInfo.firebase_claims;
        } catch (error) {
          // Token invalid, but continue without user
          console.warn('Optional auth failed:', error.message);
          req.user = null;
        }
      }
    }
    
    // Continue even if no token provided
    next();
  } catch (error) {
    // Continue even on error
    console.error('Optional auth middleware error:', error.message);
    req.user = null;
    next();
  }
};

export default authMiddleware;

