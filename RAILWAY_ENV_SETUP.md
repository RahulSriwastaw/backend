# Railway Environment Variables Setup

## Required Environment Variables

Copy these to Railway Dashboard → Variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://rupantranai_db_user:auC2C5rXl4nNleWd@cluster0.skr2l3f.mongodb.net/rupantar_ai?retryWrites=true&w=majority

# Firebase Admin SDK
FIREBASE_PROJECT_ID=rupantra-ai
FIREBASE_PRIVATE_KEY_ID=1ace185ef545b93a608a5658b799cf0d089a4abf
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCt8SVa2XrPIZ4Z...\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@rupantra-ai.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=107747358782493789631
FIREBASE_STORAGE_BUCKET=rupantra-ai.firebasestorage.app

# Cloudinary Account 1 - User Image Uploads
CLOUDINARY_USER_CLOUD_NAME=dno47zdrh
CLOUDINARY_USER_API_KEY=323385711182591
CLOUDINARY_USER_API_SECRET=V7O-ktZe4h1QCQsECBJjfa8f-XE
CLOUDINARY_URL=cloudinary://323385711182591:V7O-ktZe4h1QCQsECBJjfa8f-XE@dno47zdrh

# Cloudinary Account 2 - Creator Demo Images
CLOUDINARY_CREATOR_CLOUD_NAME=dmbrs338o
CLOUDINARY_CREATOR_API_KEY=943571584978134
CLOUDINARY_CREATOR_API_SECRET=xLvXUL573laZHjFTwbpZboBBhNA

# Cloudinary Account 3 - Generated Images Storage
CLOUDINARY_GENERATED_CLOUD_NAME=dkeigiajt
CLOUDINARY_GENERATED_API_KEY=683965962197886
CLOUDINARY_GENERATED_API_SECRET=kJzq7XRNTFB33FKKsIK-Pj90T50

# Server Configuration
NODE_ENV=production
PORT=8080

# CORS (Optional - if not set, allows all origins)
# CORS_ORIGIN=https://your-frontend.vercel.app,https://your-admin-panel.vercel.app

# Payment Gateways (Optional)
# RAZORPAY_KEY_ID=your_razorpay_key_id
# RAZORPAY_KEY_SECRET=your_razorpay_key_secret
# STRIPE_SECRET_KEY=your_stripe_secret_key
```

## Important Notes

1. **MongoDB Atlas IP Whitelist**: You MUST add `0.0.0.0/0` in MongoDB Atlas Network Access
2. **FIREBASE_PRIVATE_KEY**: Replace `\n` with actual newlines or use Railway's multiline variable support
3. **PORT**: Railway automatically sets PORT, but you can set it explicitly
4. **CORS_ORIGIN**: If not set, backend allows all origins (for quick setup)

## Quick Setup Steps

1. Go to Railway Dashboard → Your Project → Variables
2. Add all variables from above
3. For FIREBASE_PRIVATE_KEY, use Railway's multiline variable support or replace `\n` with actual newlines
4. Save and redeploy

