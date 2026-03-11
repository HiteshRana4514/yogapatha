# Cloudinary Setup Guide

This project uses Cloudinary for file storage instead of Supabase Storage.

## Setup Steps

### 1. Create Cloudinary Account
1. Go to [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. After login, you'll see your dashboard

### 2. Get Your Credentials
From your Cloudinary Dashboard, you'll need:
- **Cloud Name**: Found at the top of the dashboard
- **Upload Preset**: Need to create one (see below)

### 3. Create Upload Preset
1. Go to **Settings** → **Upload**
2. Scroll down to **Upload presets**
3. Click **Add upload preset**
4. Configure:
   - **Preset name**: Choose a name (e.g., `yoga_patha_trainers`)
   - **Signing Mode**: Select **Unsigned** (for client-side uploads)
   - **Folder**: Leave empty or set default folder
   - **Access Mode**: **Public**
5. Click **Save**
6. Copy the preset name

### 4. Configure Environment Variables
Update your `.env` file with your Cloudinary credentials:

```env
# Cloudinary Configuration
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_here
```

**Example:**
```env
VITE_CLOUDINARY_CLOUD_NAME=dxyz123abc
VITE_CLOUDINARY_UPLOAD_PRESET=yoga_patha_trainers
```

### 5. Folder Structure in Cloudinary
Files will be organized as:
```
trainers/
  ├── {user_id}/
  │   ├── avatar/
  │   │   └── profile_image.jpg
  │   ├── academy/
  │   │   └── logo.png
  │   ├── documents/
  │   │   └── id_card.pdf
  │   └── certificates/
  │       ├── cert1.pdf
  │       ├── cert2.jpg
  │       └── cert3.pdf
```

## Features Implemented

### File Upload Utility (`src/utils/cloudinary.js`)
- ✅ Single file upload with progress tracking
- ✅ Multiple file upload
- ✅ File validation (type and size)
- ✅ Organized folder structure
- ✅ Error handling

### Supported File Types
- **Images**: JPG, PNG, WEBP
- **Documents**: PDF
- **Max Size**: 5MB per file

### Upload Locations
- **Avatar**: `trainers/{user_id}/avatar/`
- **Academy Logo**: `trainers/{user_id}/academy/`
- **ID Card**: `trainers/{user_id}/documents/`
- **Certificates**: `trainers/{user_id}/certificates/`

## Usage in Code

```javascript
import { uploadToCloudinary, uploadMultipleToCloudinary, validateFile } from '../../utils/cloudinary'

// Single file upload
const url = await uploadToCloudinary(file, 'trainers/123/avatar', (progress) => {
  console.log(`Upload progress: ${progress}%`)
})

// Multiple files upload
const urls = await uploadMultipleToCloudinary(files, 'trainers/123/certificates')

// Validate file before upload
const validation = validateFile(file, {
  maxSize: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'application/pdf']
})
```

## Security Notes

1. **Unsigned Uploads**: Using unsigned upload preset for client-side uploads
2. **Folder Organization**: Files organized by user ID for easy management
3. **File Validation**: Client-side validation before upload
4. **Public URLs**: All uploaded files are publicly accessible via Cloudinary CDN

## Cloudinary Dashboard Management

### View Uploaded Files
1. Go to **Media Library** in Cloudinary Dashboard
2. Navigate through folders to find trainer files
3. You can view, download, or delete files

### Monitor Usage
1. Go to **Dashboard** → **Usage**
2. Check:
   - Storage used
   - Bandwidth used
   - Transformations used

### Free Tier Limits
- **Storage**: 25GB
- **Bandwidth**: 25GB/month
- **Transformations**: 25,000/month

## Troubleshooting

### Upload Fails
- Check if environment variables are set correctly
- Verify upload preset is set to "Unsigned"
- Check file size (must be < 5MB)
- Verify file type is allowed

### CORS Issues
- Cloudinary should work out of the box
- If issues persist, check Cloudinary CORS settings in dashboard

### Missing Files
- Check Cloudinary Media Library
- Verify folder path is correct
- Check if upload was successful (check console logs)

## Migration from Supabase Storage

If you had files in Supabase Storage:
1. Download all files from Supabase
2. Upload them to Cloudinary manually or via script
3. Update database URLs to point to Cloudinary URLs

## Database Schema

The `trainer_profiles` table stores Cloudinary URLs:
- `avatar_url`: Cloudinary URL for profile picture
- `identity_card_url`: Cloudinary URL for ID card
- `academy_logo_url`: Cloudinary URL for academy logo
- `certificate_documents`: JSONB array of objects with Cloudinary URLs

Example:
```json
{
  "avatar_url": "https://res.cloudinary.com/dxyz123/image/upload/v123/trainers/user-id/avatar/photo.jpg",
  "certificate_documents": [
    {
      "url": "https://res.cloudinary.com/dxyz123/image/upload/v123/trainers/user-id/certificates/cert1.pdf",
      "name": "NASM-CPT.pdf"
    }
  ]
}
```
