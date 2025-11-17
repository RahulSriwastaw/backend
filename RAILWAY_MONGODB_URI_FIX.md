# Railway MONGODB_URI Setup - Step by Step

## Current Error
```
Invalid scheme, expected connection string to start with "mongodb://" or "mongodb+srv://"
```

This means `MONGODB_URI` is either:
- ❌ Not set in Railway
- ❌ Empty
- ❌ Has wrong format
- ❌ Has extra spaces

## Fix Steps

### Step 1: Get MongoDB Connection String

1. Go to **MongoDB Atlas**: https://cloud.mongodb.com
2. Login to your account
3. Click **"Database"** (left sidebar)
4. Click **"Connect"** button on your cluster
5. Select **"Connect your application"**
6. Copy the connection string (it looks like):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

### Step 2: Update Connection String

Replace these parts:
- `<username>` → Your MongoDB username (e.g., `rupantranai_db_user`)
- `<password>` → Your MongoDB password
- `?retryWrites=true&w=majority` → `?retryWrites=true&w=majority` (keep as is)
- Add database name: `/rupantar_ai` before the `?`

**Final format:**
```
mongodb+srv://rupantranai_db_user:YourPassword@cluster0.skr2l3f.mongodb.net/rupantar_ai?retryWrites=true&w=majority
```

### Step 3: Set in Railway

1. Go to **Railway Dashboard**: https://railway.app
2. Select your backend project
3. Click **"Variables"** tab
4. Click **"New Variable"** or find existing `MONGODB_URI`
5. **Key**: `MONGODB_URI`
6. **Value**: Paste the complete connection string (from Step 2)
7. **IMPORTANT**: 
   - ✅ No spaces before or after
   - ✅ No quotes around the value
   - ✅ Must start with `mongodb+srv://`
   - ✅ Replace `<password>` with actual password
8. Click **"Save"**

### Step 4: Verify

After saving, Railway will automatically redeploy. Check logs:

**✅ Success:**
```
✅ MongoDB Connected: ...
✅ Database: rupantar_ai
```

**❌ Still Error:**
- Check if connection string has no spaces
- Check if password is correct
- Check if database name is `rupantar_ai`

## Example Connection String

```
mongodb+srv://rupantranai_db_user:MyPassword123@cluster0.skr2l3f.mongodb.net/rupantar_ai?retryWrites=true&w=majority
```

## Common Mistakes

❌ **Wrong:**
```
MONGODB_URI = mongodb+srv://...
```
(Extra spaces)

❌ **Wrong:**
```
MONGODB_URI="mongodb+srv://..."
```
(Quotes not needed)

❌ **Wrong:**
```
MONGODB_URI=mongodb+srv://username:<password>@...
```
(Still has `<password>` placeholder)

✅ **Correct:**
```
MONGODB_URI=mongodb+srv://username:actualpassword@cluster0.skr2l3f.mongodb.net/rupantar_ai?retryWrites=true&w=majority
```

## If Password Has Special Characters

If your password has special characters like `@`, `#`, `$`, encode them:
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `?` → `%3F`
- `/` → `%2F`

Or use a simple password with only letters and numbers.

