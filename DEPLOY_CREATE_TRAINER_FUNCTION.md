# Deploy create-trainer Edge Function

## ⚠️ IMPORTANT: Function Updated!

The `create-trainer` edge function has been updated to:
- ✅ Fix CORS headers
- ✅ Properly create `trainer_profiles` entry with KYC status
- ✅ Use `upsert` instead of `insert` to handle edge cases
- ✅ Include all required fields (certifications, wants_partnership, etc.)
- ✅ Better error handling and logging

**You MUST deploy this updated function for it to work!**

---

## Why Deploy is Required

The edge function needs to be deployed to Supabase because:
1. The function creates the `trainer_profiles` entry with the KYC status
2. Without deployment, the KYC status won't be saved to the database
3. CORS headers need to be properly configured on the server

## Option 1: Deploy to Remote Supabase (Recommended)

### Step 1: Login to Supabase CLI
```bash
supabase login
```

### Step 2: Link to Your Project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

To find your project ref:
- Go to your Supabase dashboard
- Look at the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
- Or go to Settings > General > Reference ID

### Step 3: Deploy the Function
```bash
supabase functions deploy create-trainer
```

### Step 4: Verify Deployment
Go to your Supabase dashboard:
- Navigate to **Edge Functions**
- You should see `create-trainer` listed
- Check the logs to ensure it's working

---

## Option 2: Run Supabase Locally

### Step 1: Start Supabase
```bash
supabase start
```

This will start all Supabase services locally including Edge Functions.

### Step 2: Serve the Function
The function should be automatically available at:
```
http://localhost:54321/functions/v1/create-trainer
```

### Step 3: Update Your .env File
Make sure your `VITE_BASE_URL` points to the local functions:
```
VITE_BASE_URL=http://localhost:54321/functions/v1/
```

---

## Testing the Function

### Using curl:
```bash
curl -i --location --request POST 'YOUR_SUPABASE_URL/functions/v1/create-trainer' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "firstName": "Test",
    "lastName": "Trainer",
    "email": "test@example.com",
    "password": "TestPass123!",
    "location": "New York, NY",
    "kycApproved": true
  }'
```

### Expected Response:
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "test@example.com",
    "firstName": "Test",
    "lastName": "Trainer",
    "location": "New York, NY",
    "password": "TestPass123!",
    "kycStatus": "approved"
  }
}
```

---

## Environment Variables Required

The edge function needs these environment variables (set automatically by Supabase):
- `PROJECT_URL` - Your Supabase project URL
- `SERVICE_ROLE_KEY` - Your Supabase service role key (has admin privileges)

These are automatically available in deployed functions.

---

## Troubleshooting

### CORS Error
- Make sure the function is deployed
- Check that CORS headers are set correctly (already done in the code)
- Verify the function URL in your frontend matches the deployed URL

### Authentication Error
- The function uses `SERVICE_ROLE_KEY` which bypasses RLS
- Make sure your Supabase project has the service role key set

### Function Not Found
- Run `supabase functions list` to see deployed functions
- Make sure you deployed to the correct project
- Check the function name matches exactly: `create-trainer`

---

## Quick Deploy Command

If you're already logged in and linked:
```bash
supabase functions deploy create-trainer
```

That's it! The function should now be accessible and CORS should work.

