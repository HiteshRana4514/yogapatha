# Cloudinary PDF Upload Fix - IMPORTANT

## The Problem
PDFs uploaded to Cloudinary are getting 401 Unauthorized errors when trying to view/download them.

## Root Cause
Your Cloudinary upload preset `yoga_patha_trainers` needs to be configured to support RAW file uploads (PDFs are "raw" resources, not "image" resources in Cloudinary).

## Required Fix in Cloudinary Dashboard

### Step 1: Login to Cloudinary
Go to: https://cloudinary.com/console

### Step 2: Navigate to Upload Presets
1. Click **Settings** (gear icon)
2. Click **Upload** tab
3. Scroll to **Upload presets** section
4. Find `yoga_patha_trainers` preset
5. Click **Edit** (pencil icon)

### Step 3: Configure the Preset for RAW Files

**CRITICAL SETTINGS:**

1. **Signing Mode**: Must be `Unsigned`
2. **Access control**: Must be `Public` (NOT "Authenticated")
3. **Allowed formats**: Leave EMPTY or add `pdf` to the list
4. **Resource type**: This is the KEY setting
   - If you see a dropdown, select **"Auto"**
   - If not visible, the preset might be image-only

### Step 4: Create a Separate Preset for Raw Files (Alternative)

If the above doesn't work, create a NEW preset specifically for PDFs:

1. Click **Add upload preset**
2. Name it: `yoga_patha_trainers_raw`
3. Set:
   - **Signing Mode**: `Unsigned`
   - **Access control**: `Public`
   - **Resource type**: `Raw` or `Auto`
   - **Allowed formats**: Leave empty or add `pdf`
4. Save

Then update your `.env`:
```env
VITE_CLOUDINARY_UPLOAD_PRESET=yoga_patha_trainers_raw
```

### Step 5: Verify Settings

After saving, try uploading a PDF again. The URL should now be:
- ✅ `https://res.cloudinary.com/dft1et3yz/raw/upload/v.../file.pdf` (CORRECT)
- ❌ `https://res.cloudinary.com/dft1et3yz/image/upload/v.../file.pdf` (WRONG - causes 401)

## Code Changes Already Made

The code has been updated to:
1. Detect PDF files (`file.type === 'application/pdf'`)
2. Upload PDFs to `/raw/upload` endpoint
3. Upload images to `/image/upload` endpoint
4. Better error logging

## Testing

After updating the Cloudinary preset:
1. Restart your dev server: `npm run dev`
2. Upload a PDF government ID
3. Check the URL in the database - it should contain `/raw/upload/`
4. Click to view/download - should work without 401 error

## Why This Happens

Cloudinary has different resource types:
- **image**: For JPG, PNG, WEBP, etc.
- **raw**: For PDFs, documents, videos, etc.
- **video**: For video files

When a preset is configured for "image" only, it rejects raw files or stores them incorrectly, causing 401 errors on access.

## Quick Check

If you're still getting errors, check the uploaded file URL:
- If it says `/image/upload/...file.pdf` → Preset is wrong
- If it says `/raw/upload/...file.pdf` → Preset is correct

The preset MUST allow raw file uploads for PDFs to work properly.
