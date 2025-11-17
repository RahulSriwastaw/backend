# 502 Bad Gateway Error - Fix Guide

## Problem
Railway shows "502 Bad Gateway" or "Application failed to respond"

## Root Causes
1. ❌ Server not starting (crashes on startup)
2. ❌ Invalid MONGODB_URI format causing server to crash
3. ❌ Missing environment variables
4. ❌ Route import errors

## ✅ Fixes Applied

### 1. Server Startup Robustness
- ✅ Server now starts even if MONGODB_URI is invalid (just warns)
- ✅ MongoDB connection is non-blocking
- ✅ Route mounting has error handling
- ✅ Server listens on `0.0.0.0:PORT` (Railway requirement)

### 2. MongoDB Connection
- ✅ Connection string validation (warns but doesn't crash)
- ✅ Retry logic (3 attempts)
- ✅ Clear error messages

---

## 🔧 Step-by-Step Fix

### Step 1: Check Railway Logs

1. Go to Railway Dashboard → Your Backend Project
2. Click "Deployments" tab
3. Click on latest deployment
4. Click "View Logs"
5. Look for errors like:
   - `Error: Invalid MongoDB connection string format`
   - `Cannot find module`
   - `SyntaxError`
   - `MongoDB connection failed`

### Step 2: Set MONGODB_URI in Railway

1. Go to Railway Dashboard → Your Backend Project
2. Click "Variables" tab
3. Click "New Variable"
4. **Key:** `MONGODB_URI`
5. **Value:** 
   ```
   mongodb+srv://username:password@cluster0.skr2l3f.mongodb.net/rupantar_ai?retryWrites=true&w=majority
   ```
   Replace `username` and `password` with your MongoDB credentials

6. **Important:**
   - ✅ No spaces before/after
   - ✅ No quotes
   - ✅ Must include `/rupantar_ai` (database name)
   - ✅ Must start with `mongodb+srv://`

7. Click "Save"

### Step 3: Verify MongoDB Atlas

1. Go to https://cloud.mongodb.com
2. **Network Access:**
   - Click "Network Access" (left sidebar)
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (adds `0.0.0.0/0`)
   - Save

3. **Database Access:**
   - Click "Database Access" (left sidebar)
   - Verify your database user exists
   - If password is wrong, click "Edit" → "Edit Password"
   - Update Railway `MONGODB_URI` with new password

### Step 4: Redeploy

After setting `MONGODB_URI`:
- Railway will automatically redeploy
- Or click "Redeploy" button manually

### Step 5: Check Logs Again

After redeploy, check logs for:
```
✅ Server Running on port 8080
✅ Environment: production
✅ MongoDB Connected: ...
✅ Database: rupantar_ai
```

If you see these, server is working! ✅

---

## 🧪 Test Endpoints

After server starts, test:

1. **Root:** `https://new-backend-production-c886.up.railway.app/`
   - Should return: "Backend is running successfully!"

2. **Health:** `https://new-backend-production-c886.up.railway.app/health`
   - Should return JSON: `{"status":"ok","message":"Backend is running",...}`

3. **Test Connections:** `https://new-backend-production-c886.up.railway.app/api/test-connections`
   - Shows MongoDB, Cloudinary, Firebase status

---

## ❌ Common Errors & Solutions

### Error: "Invalid scheme, expected connection string to start with..."
**Solution:** 
- Check Railway Variables → `MONGODB_URI`
- Make sure it starts with `mongodb+srv://`
- Remove any spaces or quotes

### Error: "bad auth : Authentication failed"
**Solution:**
- Check MongoDB username/password
- Update password in MongoDB Atlas if needed
- Update Railway `MONGODB_URI` with correct credentials

### Error: "IP isn't whitelisted"
**Solution:**
- Go to MongoDB Atlas → Network Access
- Add `0.0.0.0/0` (Allow Access from Anywhere)

### Error: "Cannot find module"
**Solution:**
- Check Railway logs for missing dependency
- Run `npm install` locally and push `package-lock.json`
- Or add missing dependency to `package.json`

---

## 📋 Quick Checklist

- [ ] Railway `MONGODB_URI` variable is set correctly
- [ ] MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- [ ] MongoDB username/password are correct
- [ ] Connection string includes `/rupantar_ai` database name
- [ ] Railway logs show "✅ Server Running on port 8080"
- [ ] Root endpoint (`/`) returns "Backend is running successfully!"

---

## 🚀 After Fix

Once server starts successfully:
1. ✅ Backend will respond to requests
2. ✅ Health check will work
3. ✅ API endpoints will be accessible
4. ✅ Frontend can connect to backend

**All fixes have been pushed to GitHub!**

