# Railway Environment Variables - Complete Setup

## Required Variables

Copy these to Railway Dashboard → Your Backend Project → Variables:

### 1. MongoDB Connection (REQUIRED)
```env
MONGODB_URI=mongodb+srv://rupantranai_db_user:YOUR_PASSWORD@cluster0.skr2l3f.mongodb.net/rupantar_ai?retryWrites=true&w=majority
```

**Important:**
- Replace `YOUR_PASSWORD` with your actual MongoDB password
- Must start with `mongodb+srv://`
- Must include `/rupantar_ai` (database name)
- No spaces before or after
- No quotes

### 2. Environment (Optional but Recommended)
```env
NODE_ENV=production
```

### 3. Firebase Admin SDK (Optional - for authentication)
```env
FIREBASE_PROJECT_ID=rupantra-ai
FIREBASE_PRIVATE_KEY_ID=1ace185ef545b93a608a5658b799cf0d089a4abf
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCt8SVa2XrPIZ4Z...\n-----END PRIVATE KEY-----
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@rupantra-ai.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=107747358782493789631
FIREBASE_STORAGE_BUCKET=rupantra-ai.firebasestorage.app
```

**Note:** For `FIREBASE_PRIVATE_KEY`, replace `\n` with actual newlines or use Railway's multiline variable support.

### 4. Cloudinary (Optional - for image uploads)
```env
CLOUDINARY_USER_CLOUD_NAME=dno47zdrh
CLOUDINARY_USER_API_KEY=323385711182591
CLOUDINARY_USER_API_SECRET=V7O-ktZe4h1QCQsECBJjfa8f-XE
CLOUDINARY_CREATOR_CLOUD_NAME=dmbrs338o
CLOUDINARY_CREATOR_API_KEY=943571584978134
CLOUDINARY_CREATOR_API_SECRET=xLvXUL573laZHjFTwbpZboBBhNA
CLOUDINARY_GENERATED_CLOUD_NAME=dkeigiajt
CLOUDINARY_GENERATED_API_KEY=683965962197886
CLOUDINARY_GENERATED_API_SECRET=kJzq7XRNTFB33FKKsIK-Pj90T50
```

### 5. Payment Gateways (Optional)
```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## Quick Setup Steps

1. Go to Railway Dashboard → Your Backend Project → Variables
2. Click "New Variable"
3. Add each variable from above
4. For `MONGODB_URI`, make sure:
   - Username is correct
   - Password is correct (URL encode special characters if needed)
   - Database name is `/rupantar_ai`
5. Save and redeploy

## Verification

After setting variables, check Railway logs for:
```
✅ MongoDB Connected: ...
✅ Database: rupantar_ai
```

If you see errors, check:
- MongoDB Atlas IP whitelist (add 0.0.0.0/0)
- MongoDB credentials are correct
- Connection string format is correct

