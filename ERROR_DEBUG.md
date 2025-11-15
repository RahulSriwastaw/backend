# Template Creation Error Debug Guide

## Steps to Debug:

1. **Check Backend Console Logs**
   - Look for "=== Template Creation Request ==="
   - Check MongoDB connection state
   - Look for error messages

2. **Test MongoDB Connection**
   - Visit: http://localhost:4000/api/test-connections
   - Should show MongoDB status

3. **Check Request Body**
   - Backend logs will show the request body
   - Verify all required fields are present

4. **Common Issues:**
   - MongoDB not connected (ReadyState !== 1)
   - Missing required fields (title, category, demoImage, prompt)
   - Validation errors from Mongoose schema
   - Duplicate key errors (template with same title exists)

## Quick Fix:

1. Restart backend server
2. Check MongoDB connection
3. Verify all form fields are filled
4. Check backend console for detailed error logs

