# Media Management System - Implementation Guide

## Overview
A complete media management system with Cloudinary integration for storing images and videos. Includes admin management interface, public media gallery, and landing page slider.

## Features Implemented

### 1. Database Schema (`create_media_table.sql`)
- **Media table** with Cloudinary URL storage
- Fields: title, description, media_url, media_type, cloudinary_public_id
- **Toggle system**: `show_on_landing` boolean field
- **Display order**: Custom ordering for landing page items
- **RLS Policies**: Public read access, admin-only write access

### 2. Admin Media Management (`/admin_dashboard/media_management`)
- Upload images and videos to Cloudinary
- View all media in grid layout
- Toggle media visibility on landing page (max 8 items)
- Reorder media with up/down arrows
- Delete media from database
- Preview images and videos
- Add titles and descriptions

### 3. Public Media Page (`/media`)
- Beautiful gallery layout with filters
- Filter by: All, Images, Videos
- Lightbox view for full-screen media
- Responsive grid layout
- Click to view full details
- Video playback support

### 4. Landing Page Slider
- Auto-playing carousel (5-second intervals)
- Shows up to 8 media items (controlled by admin toggle)
- Thumbnail navigation
- Dot indicators
- Previous/Next arrows
- "View All Media" button linking to `/media` page

## Setup Instructions

### Step 1: Configure Cloudinary

1. **Create Cloudinary Account**
   - Go to [cloudinary.com](https://cloudinary.com)
   - Sign up for a free account

2. **Get Your Credentials**
   - Go to Dashboard
   - Copy your Cloud Name
   - Create an Upload Preset:
     - Go to Settings → Upload
     - Scroll to "Upload presets"
     - Click "Add upload preset"
     - Set signing mode to "Unsigned"
     - Save and copy the preset name

3. **Add to Environment Variables**
   
   Create or update `.env` file in project root:
   ```env
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
   VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_here
   ```

### Step 2: Run Database Migration

Execute the SQL file in your Supabase dashboard:

```bash
# In Supabase SQL Editor, run:
create_media_table.sql
```

This creates:
- `media` table
- Indexes for performance
- RLS policies
- Triggers for auto-updating timestamps

### Step 3: Verify Routes

Routes are already configured in `App.jsx`:
- `/media` - Public media gallery page
- `/admin_dashboard/media_management` - Admin management interface

### Step 4: Test the System

1. **Login as Admin**
   - Go to `/admin-login`
   - Login with admin credentials

2. **Upload Media**
   - Navigate to "Media Management" in sidebar
   - Click "Upload Media"
   - Fill in title, description, select type
   - Choose file and upload

3. **Toggle Landing Page Display**
   - Click "Show" button on any media item
   - Maximum 8 items can be shown on landing page
   - Use up/down arrows to reorder

4. **View Public Gallery**
   - Go to `/media` to see all media
   - Filter by type
   - Click any item for lightbox view

5. **Check Landing Page**
   - Go to `/` (home page)
   - Scroll to "Our Gallery" section
   - See slider with selected media
   - Click "View All Media" button

## Component Structure

```
Admin_Panel/
  └── pages/
      └── MediaManagement.jsx       # Admin interface

src/
  ├── components/
  │   └── MediaSliderSection.jsx   # Landing page slider
  └── pages/
      └── MediaPage.jsx             # Public gallery page
```

## Database Schema

```sql
media (
  id UUID PRIMARY KEY
  title TEXT NOT NULL
  description TEXT
  media_url TEXT NOT NULL              -- Cloudinary URL
  media_type TEXT ('image' | 'video')
  cloudinary_public_id TEXT            -- For deletion
  show_on_landing BOOLEAN              -- Toggle for landing
  display_order INTEGER                -- Order on landing
  uploaded_by UUID                     -- Admin who uploaded
  created_at TIMESTAMP
  updated_at TIMESTAMP
)
```

## API Integration

### Upload to Cloudinary
```javascript
const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const resourceType = file.type.startsWith('video') ? 'video' : 'image';
  
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();
  return {
    url: data.secure_url,
    publicId: data.public_id
  };
};
```

### Fetch Landing Page Media
```javascript
const { data } = await supabase
  .from('media')
  .select('*')
  .eq('show_on_landing', true)
  .order('display_order', { ascending: true })
  .limit(8);
```

### Toggle Landing Page Display
```javascript
const { error } = await supabase
  .from('media')
  .update({ show_on_landing: !currentStatus })
  .eq('id', mediaId);
```

## Features

### Admin Features
- ✅ Upload images and videos
- ✅ Add titles and descriptions
- ✅ Toggle landing page visibility (max 8)
- ✅ Reorder media items
- ✅ Delete media
- ✅ Preview media
- ✅ Track upload statistics

### Public Features
- ✅ View all media in gallery
- ✅ Filter by type (all/images/videos)
- ✅ Lightbox view
- ✅ Responsive design
- ✅ Video playback
- ✅ Landing page slider with auto-play

### Landing Page Slider
- ✅ Auto-play (5 seconds per slide)
- ✅ Manual navigation (arrows)
- ✅ Dot indicators
- ✅ Thumbnail grid
- ✅ Maximum 8 items
- ✅ "View All" button

## Customization

### Change Slider Auto-play Speed
In `MediaSliderSection.jsx`, line ~85:
```javascript
const interval = setInterval(() => {
  nextSlide();
}, 5000); // Change this value (milliseconds)
```

### Change Maximum Landing Page Items
In `create_media_table.sql`, update the comment/query:
```sql
-- Change LIMIT 8 to your desired number
LIMIT 8;
```

Also update in `MediaManagement.jsx`, line ~14:
```javascript
{landingPageCount} of 8 shown on landing page.
// Change "8" to your desired number
```

### Styling
All components use Tailwind CSS. Customize colors and styles by editing the className properties.

## Security Notes

- ✅ RLS policies protect database
- ✅ Only admins can upload/delete
- ✅ Public read access for media
- ✅ Cloudinary handles file storage
- ⚠️ Cloudinary deletion requires backend (API secret)

## Cloudinary Deletion (Advanced)

For production, implement server-side deletion:

```javascript
// Backend endpoint (Node.js example)
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

app.delete('/api/media/:publicId', async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.publicId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Troubleshooting

### Upload Fails
- Check Cloudinary credentials in `.env`
- Verify upload preset is "unsigned"
- Check file size limits (free tier: 10MB images, 40MB videos)

### Media Not Showing on Landing Page
- Verify `show_on_landing` is true in database
- Check maximum limit (8 items)
- Clear browser cache

### RLS Policy Errors
- Ensure admin role is set in `profiles` table
- Verify user is authenticated
- Check RLS policies are enabled

## Next Steps

1. ✅ Run database migration
2. ✅ Configure Cloudinary credentials
3. ✅ Upload test media
4. ✅ Toggle items for landing page
5. ✅ Test public gallery
6. ✅ Verify landing page slider

## Support

For issues or questions:
1. Check Supabase logs
2. Check browser console
3. Verify Cloudinary dashboard for uploads
4. Review RLS policies in Supabase

---

**Status**: ✅ Fully Implemented and Ready to Use
