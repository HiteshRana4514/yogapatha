# Service Management System - Complete Guide

## Overview

A comprehensive service management system for the admin panel that allows admins to create, edit, delete, and manage services displayed on the website.

---

## Features Implemented

### ✅ Database Table
- **Table Name:** `services`
- **Fields:**
  - `id` - UUID primary key
  - `title` - Service title (required)
  - `description` - Service description (required)
  - `image_url` - Service image URL (required)
  - `popular_tag` - Boolean for "Popular" badge
  - `features` - JSONB array of feature strings (pointers)
  - `price` - Optional price (e.g., "$80/session")
  - `duration` - Optional duration (e.g., "60 mins")
  - `rating` - Decimal rating (0-5)
  - `category` - Service category (e.g., "Personal", "Group")
  - `is_active` - Boolean for active/inactive status
  - `display_order` - Integer for ordering services
  - `created_at`, `updated_at` - Timestamps
  - `created_by`, `updated_by` - Admin user references

### ✅ Admin Page Features
1. **View All Services** - Grid/list view with all service details
2. **Search** - Search by title, description, or category
3. **Filter** - Filter by All/Active/Inactive status
4. **Create Service** - Add new services with full details
5. **Edit Service** - Update existing services
6. **Delete Service** - Remove services (with confirmation)
7. **Toggle Active/Inactive** - Show/hide services on website
8. **Reorder Services** - Move services up/down in display order
9. **Image Upload** - Upload service images to Cloudinary
10. **Popular Tag** - Mark services as "Popular"

---

## Setup Instructions

### Step 1: Create Database Table

Run the SQL file to create the services table:

**Option A: Via Supabase Dashboard**
1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `create_services_table.sql`
4. Click **Run**

**Option B: Via Supabase CLI**
```bash
supabase db execute --file create_services_table.sql
```

### Step 2: Verify Installation

The following files have been created/updated:

**New Files:**
- `create_services_table.sql` - Database schema
- `Admin_Panel/pages/ServiceManagement.jsx` - Admin page
- `SERVICE_MANAGEMENT_GUIDE.md` - This guide

**Updated Files:**
- `src/App.jsx` - Added route for service management
- `Admin_Panel/components/AdminDashboardSidebar.jsx` - Added menu item

### Step 3: Access the Page

1. Login to admin dashboard
2. Click **"Service Management"** in the sidebar
3. Start managing services!

---

## How to Use

### Creating a New Service

1. Click **"Add Service"** button
2. Fill in the form:
   - **Title** (required) - e.g., "One-on-One Personal Training"
   - **Description** (required) - Detailed description
   - **Image** (required) - Upload service image
   - **Category** (optional) - e.g., "Personal", "Group", "Cardio"
   - **Price** (optional) - e.g., "$80/session"
   - **Duration** (optional) - e.g., "60 mins"
   - **Rating** (optional) - 0-5 rating
   - **Display Order** - Order in which service appears
   - **Features** - Add multiple feature points
   - **Popular Tag** - Check to show "Popular" badge
   - **Active** - Check to show on website
3. Click **"Create Service"**

### Editing a Service

1. Click the **Edit** (pencil) icon on any service
2. Update the fields you want to change
3. Click **"Update Service"**

### Deleting a Service

1. Click the **Delete** (trash) icon on any service
2. Confirm deletion in the popup
3. Service is permanently removed

### Activating/Deactivating a Service

1. Click the **Eye/Eye-Off** icon on any service
2. Service status toggles between Active/Inactive
3. Inactive services won't show on the website

### Reordering Services

1. Use **Arrow Up/Down** buttons to move services
2. Services are reordered immediately
3. Order affects how they appear on the website

### Searching and Filtering

- **Search Bar** - Type to search by title, description, or category
- **Filter Buttons** - Click All/Active/Inactive to filter services

---

## Database Schema Details

### Services Table Structure

```sql
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  popular_tag BOOLEAN DEFAULT FALSE,
  features JSONB DEFAULT '[]'::jsonb,
  price TEXT,
  duration TEXT,
  rating DECIMAL(2,1) DEFAULT 0.0,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);
```

### Row Level Security (RLS) Policies

**Public Access:**
- Anyone can read **active** services (for website display)

**Admin Access:**
- Admins can read **all** services (including inactive)
- Admins can **insert** new services
- Admins can **update** existing services
- Admins can **delete** services

### Sample Data

The SQL file includes 3 sample services:
1. One-on-One Personal Training (Popular)
2. Small Group Training
3. HIIT Cardio Classes (Popular)

---

## Integration with Website

### Current Implementation

The services are currently hardcoded in:
- `src/pages/ServicesPage.jsx`
- `src/components/FeaturedServicesSection.jsx`

### Future Integration (Recommended)

To display services from the database on your website:

1. **Update ServicesPage.jsx:**
```javascript
const [services, setServices] = useState([])

useEffect(() => {
  const loadServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    
    setServices(data || [])
  }
  loadServices()
}, [])
```

2. **Update FeaturedServicesSection.jsx:**
```javascript
// Same as above - fetch active services from database
```

This way, when admin creates/updates services, they automatically appear on the website!

---

## Features Breakdown

### Service Card Display

Each service shows:
- **Image** - Full-width service image
- **Popular Badge** - If `popular_tag` is true
- **Title** - Service name
- **Description** - Full description
- **Category** - Service category badge
- **Price** - Pricing information
- **Duration** - Session duration
- **Rating** - Star rating
- **Features** - List of feature points with checkmarks
- **Status Badge** - Active/Inactive indicator

### Action Buttons

- **Move Up/Down** - Reorder services
- **Edit** - Open edit modal
- **Toggle Active** - Show/hide on website
- **Delete** - Remove service

### Modal Form

- **Responsive Design** - Works on all screen sizes
- **Image Upload** - Drag & drop or click to upload
- **Progress Indicator** - Shows upload progress
- **Dynamic Features** - Add/remove feature points
- **Validation** - Required fields are validated
- **Success/Error Messages** - Clear feedback

---

## Technical Details

### Technologies Used

- **React** - Frontend framework
- **Supabase** - Database and authentication
- **Cloudinary** - Image hosting
- **Lucide React** - Icons
- **Tailwind CSS** - Styling

### Key Functions

**loadServices()** - Fetches all services from database
**handleSubmit()** - Creates or updates service
**toggleServiceStatus()** - Activates/deactivates service
**deleteService()** - Removes service
**moveService()** - Reorders services
**handleImageUpload()** - Uploads image to Cloudinary

### State Management

- `services` - All services from database
- `filteredServices` - Filtered/searched services
- `formData` - Form input data
- `showModal` - Modal visibility
- `modalMode` - 'create' or 'edit'
- `selectedService` - Service being edited

---

## Troubleshooting

### Services Not Loading

**Check:**
1. Database table exists: `SELECT * FROM services;`
2. RLS policies are set correctly
3. Admin is logged in
4. Console for errors

### Image Upload Failing

**Check:**
1. Cloudinary credentials in `.env`
2. File size (max 10MB)
3. File type (PNG, JPG, WEBP)
4. Network connection

### Can't Create/Edit Services

**Check:**
1. Admin role is set correctly
2. RLS policies allow admin access
3. All required fields are filled
4. Image is uploaded

### Services Not Showing on Website

**Check:**
1. Service `is_active` is true
2. Website is fetching from database (not hardcoded)
3. RLS policy allows public read for active services

---

## Future Enhancements

### Possible Additions

1. **Bulk Actions** - Select multiple services to activate/deactivate/delete
2. **Duplicate Service** - Clone existing service
3. **Service Analytics** - Track views, clicks, bookings
4. **Service Categories** - Manage categories separately
5. **Service Packages** - Bundle multiple services
6. **Pricing Tiers** - Multiple pricing options per service
7. **Availability** - Set service availability schedule
8. **Trainer Assignment** - Assign trainers to services
9. **Export/Import** - Export services to CSV/JSON
10. **Service Templates** - Pre-made service templates

---

## Summary

✅ **Database table created** with all necessary fields
✅ **Admin page built** with full CRUD functionality
✅ **Image upload** integrated with Cloudinary
✅ **Search and filter** for easy management
✅ **Reordering** with up/down arrows
✅ **Active/Inactive toggle** for visibility control
✅ **Responsive design** works on all devices
✅ **RLS policies** for security
✅ **Sample data** included for testing

The service management system is fully functional and ready to use! 🎉

