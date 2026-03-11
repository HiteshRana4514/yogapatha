# Email Fix - Trainer Creation & Client Assignment

## Problem Identified

Emails were not being sent for:
1. **Trainer Creation** - Welcome emails to new trainers
2. **Client Assignment** - Notification emails to trainers when clients are assigned

Payment record emails were working fine.

## Root Cause

The email templates in `src/utils/emailService.js` were using `window.location.origin` to generate URLs for email links. This causes issues because:
- `window` object doesn't exist in server-side/edge function context
- This would cause the email sending to fail or generate broken links

## Changes Made

### 1. Fixed Email Service (`src/utils/emailService.js`)
- Added `SITE_URL` constant that uses environment variable or falls back to window.location
- Replaced all instances of `window.location.origin` with `SITE_URL`
- This ensures emails work in both client-side and server-side contexts

### 2. Fixed Create Trainer Function (`supabase/functions/create-trainer/index.ts`)
- Corrected endpoint from `ck-function` to `quick-function`

### 3. Updated Environment Variables
- Added `VITE_SITE_URL` to `.env.example`

## Action Required

### 1. Update Your `.env` File
Add this line to your `.env` file:
```env
VITE_SITE_URL=https://your-actual-domain.com
```
Replace with your actual production URL (e.g., `https://yogapatha.com` or your Netlify/Vercel URL)

### 2. Redeploy Create Trainer Function
The create-trainer function has been updated and needs to be redeployed:
```bash
supabase functions deploy create-trainer
```

### 3. Rebuild Your Frontend
Since we updated the email service, rebuild your frontend:
```bash
npm run build
```

## Testing

After completing the above steps, test:

1. **Trainer Creation Email**:
   - Go to Admin Dashboard → Create Trainer
   - Create a new trainer
   - Check if welcome email is received

2. **Client Assignment Email**:
   - Go to Admin Dashboard → Clients
   - Assign a client to a trainer
   - Check if assignment notification email is received to trainer

## Why Payment Emails Were Working

Payment emails were working because they're sent from the `phonepe-payment` function which:
- Uses the correct `quick-function` endpoint
- Doesn't rely on `window.location.origin` in the same way
- Was already properly deployed

## Summary

✅ Fixed `window.location.origin` issue in email templates
✅ Added `SITE_URL` environment variable support
✅ Corrected function endpoint typo
✅ All email templates now use consistent URL generation

The emails should now work correctly for trainer creation and client assignment once you:
1. Add `VITE_SITE_URL` to your `.env`
2. Redeploy the create-trainer function
3. Rebuild the frontend
