# MongoDB Authentication Fix

## Problem
Error: `bad auth : Authentication failed`

This means MongoDB credentials are incorrect or the connection string is wrong.

## Solution

### Step 1: Verify MongoDB Atlas Credentials

1. Go to https://cloud.mongodb.com
2. Login to your account
3. Go to **Database Access** (left sidebar)
4. Check if user `rupantranai_db_user` exists
5. If not, create a new database user:
   - Click "Add New Database User"
   - Username: `rupantranai_db_user`
   - Password: Create a strong password (save it!)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

### Step 2: Update Railway Environment Variable

Go to Railway Dashboard → Your Project → Variables:

**Option A: Use existing user (if password changed)**
```env
MONGODB_URI=mongodb+srv://rupantranai_db_user:YOUR_NEW_PASSWORD@cluster0.skr2l3f.mongodb.net/rupantar_ai?retryWrites=true&w=majority
```

**Option B: Create new database user**
1. In MongoDB Atlas → Database Access → Add New Database User
2. Username: `railway_user` (or any name)
3. Password: Create strong password
4. Privileges: "Read and write to any database"
5. Copy the connection string from MongoDB Atlas:
   - Go to **Database** → **Connect** → **Connect your application**
   - Copy the connection string
   - Replace `<password>` with your actual password
   - Replace `<dbname>` with `rupantar_ai`

Example:
```env
MONGODB_URI=mongodb+srv://railway_user:YourPassword123@cluster0.skr2l3f.mongodb.net/rupantar_ai?retryWrites=true&w=majority
```

### Step 3: Verify IP Whitelist

1. Go to MongoDB Atlas → **Network Access**
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (adds `0.0.0.0/0`)
4. Click "Confirm"

### Step 4: Test Connection

After updating Railway variables, wait for redeploy and check logs:
- Should see: `✅ MongoDB Connected: ...`
- Should NOT see: `bad auth : Authentication failed`

## Quick Fix

If you want to use the existing connection string but password is wrong:

1. Go to MongoDB Atlas → Database Access
2. Find user `rupantranai_db_user`
3. Click "Edit" → "Edit Password"
4. Set new password
5. Update Railway `MONGODB_URI` with new password
6. Redeploy

## Connection String Format

```
mongodb+srv://USERNAME:PASSWORD@cluster0.skr2l3f.mongodb.net/DATABASE_NAME?retryWrites=true&w=majority
```

Make sure:
- ✅ USERNAME is correct
- ✅ PASSWORD has no special characters that need URL encoding (or encode them)
- ✅ DATABASE_NAME is `rupantar_ai`
- ✅ Cluster name matches (`cluster0.skr2l3f`)

