# Connection Status & Configuration

## ✅ All Connections Configured

### 1. MongoDB
- **Connection String**: `mongodb+srv://rupantaranai_db_user:auC2C5rXl4nNleWd@cluster0.skr2l3f.mongodb.net/rupantar_ai`
- **Database**: `rupantar_ai`
- **Status**: Configured with auto-retry and reconnection
- **File**: `src/config/database.js`

### 2. Firebase
- **Project ID**: `rupantra-ai`
- **Auth Domain**: `rupantra-ai.firebaseapp.com`
- **Storage Bucket**: `rupantra-ai.firebasestorage.app`
- **Messaging Sender ID**: `717770940130`
- **App ID**: `1:717770940130:web:e918e9e148560f10c3c8bb`
- **Status**: Configured for Authentication, FCM, and Admin SDK
- **Files**: 
  - Backend: `src/config/firebaseAdmin.js`
  - Admin Panel: `admin/admin/src/lib/firebaseClient.ts`

### 3. Cloudinary (3 Accounts)

#### Account 1 - User Image Uploads
- **Cloud Name**: `dno47zdrh`
- **API Key**: `323385711182591`
- **API Secret**: `V7O-ktZe4h1QCQsECBJjfa8f-XE`

#### Account 2 - Creator Demo Images
- **Cloud Name**: `dmbrs338o`
- **API Key**: `943571584978134`
- **API Secret**: `xLvXUL573laZHjFTwbpZboBBhNA`

#### Account 3 - Generated Images Storage
- **Cloud Name**: `dkeigiajt`
- **API Key**: `683965962197886`
- **API Secret**: `kJzq7XRNTFB33FKKsIK-Pj90T50`

- **Status**: All 3 accounts configured
- **File**: `src/config/cloudinary.js`

## Testing Connections

### MongoDB
```bash
# Check connection
curl http://localhost:4000/api/test-connections
```

### Firebase
- Frontend: Check browser console for Firebase initialization
- Backend: Check server logs for "Firebase Admin SDK initialized"

### Cloudinary
- Test by uploading an image through admin panel

## Environment Variables (Optional)

You can override defaults by setting these in `.env`:

```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# Firebase
FIREBASE_PROJECT_ID=rupantra-ai
FIREBASE_STORAGE_BUCKET=rupantra-ai.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=717770940130

# Cloudinary Account 1
CLOUDINARY_USER_CLOUD_NAME=dno47zdrh
CLOUDINARY_USER_API_KEY=323385711182591
CLOUDINARY_USER_API_SECRET=V7O-ktZe4h1QCQsECBJjfa8f-XE

# Cloudinary Account 2
CLOUDINARY_CREATOR_CLOUD_NAME=dmbrs338o
CLOUDINARY_CREATOR_API_KEY=943571584978134
CLOUDINARY_CREATOR_API_SECRET=xLvXUL573laZHjFTwbpZboBBhNA

# Cloudinary Account 3
CLOUDINARY_GENERATED_CLOUD_NAME=dkeigiajt
CLOUDINARY_GENERATED_API_KEY=683965962197886
CLOUDINARY_GENERATED_API_SECRET=kJzq7XRNTFB33FKKsIK-Pj90T50
```

## Notes

- All credentials are hardcoded as defaults in config files
- Environment variables can override defaults
- MongoDB connection has auto-retry (3 attempts)
- Cloudinary uses 3 separate accounts for different purposes
- Firebase configured for both client and admin SDK

