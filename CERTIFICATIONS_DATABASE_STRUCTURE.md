# Certifications Database Structure

## Overview

The `trainer_profiles` table needs **TWO separate fields** for certifications:

1. **`certificate_documents`** - Already exists (for uploaded files)
2. **`certifications`** - Needs to be added (for certification names + URLs)

---

## Current Database Schema

### What EXISTS in `trainer_profiles`:

```sql
CREATE TABLE trainer_profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  
  -- Documents
  avatar_url TEXT,
  identity_card_url TEXT,
  certificate_documents JSONB DEFAULT '[]'::jsonb,  -- ✅ EXISTS
  
  -- Other fields...
  kyc_status TEXT,
  partnership_status TEXT,
  wants_partnership BOOLEAN,
  academy_name TEXT,
  academy_address TEXT,
  academy_logo_url TEXT,
  is_active BOOLEAN,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### What's MISSING:

```sql
-- ❌ This column does NOT exist yet
certifications JSONB DEFAULT '[]'::jsonb
```

---

## Why Two Separate Fields?

### `certificate_documents` (Already Exists)
**Purpose:** Store uploaded certificate files  
**Used for:** Document verification, file downloads  
**Structure:**
```json
[
  {
    "name": "Certificate-1.pdf",
    "url": "https://res.cloudinary.com/..."
  },
  {
    "name": "RYT-200-Certificate.pdf",
    "url": "https://res.cloudinary.com/..."
  }
]
```

### `certifications` (Needs to be Added)
**Purpose:** Store certification names with optional URLs  
**Used for:** Display badges, show credentials  
**Structure:**
```json
[
  {
    "name": "Yoga Alliance RYT-200",
    "url": "https://res.cloudinary.com/cert1.pdf"
  },
  {
    "name": "Prenatal Yoga Certification",
    "url": "https://res.cloudinary.com/cert2.pdf"
  }
]
```

---

## The Problem

### Issue 1: Missing Column
When trainers try to save their profile, the code tries to save:

```javascript
const profileData = {
  user_id: userData.id,
  avatar_url: formData.avatar,
  identity_card_url: formData.identityCard,
  certifications: formData.certifications,  // ❌ Column doesn't exist!
  wants_partnership: formData.wantsPartnership,
};

await supabase.from("trainer_profiles").upsert(profileData);
```

**Result:** RLS policy error because the column doesn't exist

### Issue 2: RLS Policy Too Restrictive
Even if the column exists, the UPDATE policy blocks UPSERT:

```sql
-- OLD POLICY (Too restrictive)
CREATE POLICY "Trainers can update own profile"
  ON trainer_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);  -- ❌ Blocks UPSERT
```

**Why it fails:**
- Admin creates trainer_profile → `user_id` is set
- Trainer tries to UPSERT → Checks INSERT first (fails, row exists)
- UPSERT tries UPDATE → `WITH CHECK` fails because profile was created by admin
- Result: "new row violates row-level security policy"

---

## The Solution

Run `FIX_CERTIFICATIONS_COMPLETE.sql` which does:

### 1. Add Missing Column
```sql
ALTER TABLE trainer_profiles
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;
```

### 2. Fix RLS Policy
```sql
-- Remove WITH CHECK clause
CREATE POLICY "Trainers can update own profile"
  ON trainer_profiles FOR UPDATE
  USING (auth.uid() = user_id);  -- ✅ No WITH CHECK
```

---

## After Running the Fix

### Database Structure:
```sql
trainer_profiles
├── id
├── user_id
├── avatar_url
├── identity_card_url
├── certificate_documents  -- ✅ For uploaded files
├── certifications         -- ✅ For certification names + URLs (NEW)
├── kyc_status
├── partnership_status
└── ...
```

### Trainers Can:
- ✅ Add certification names with URLs
- ✅ Upload certificate files
- ✅ Update their profile via UPSERT
- ✅ Save changes without RLS errors

### Admins Can:
- ✅ View certification names in Trainer Details
- ✅ View uploaded certificate files
- ✅ See complete trainer information

---

## Data Flow

### Trainer Profile Page:
```javascript
// Load data
const certifications = profile?.certifications || []  // [{name, url}]

// Save data
await supabase.from("trainer_profiles").upsert({
  certifications: formData.certifications  // Array of {name, url}
})
```

### Admin Trainer Management:
```javascript
// Fetch data
const { data: trainerProfile } = await supabase
  .from('trainer_profiles')
  .select('*')
  .eq('user_id', user.id)
  .single()

// Use data
certifications: trainerProfile?.certifications || []
certificate_documents: trainerProfile?.certificate_documents || []
```

### Admin Trainer Detail View:
```javascript
// Display certifications (names)
{fullTrainerData.certifications.map(cert => (
  <span>{cert.name}</span>
))}

// Display certificate files
{fullTrainerData.certification_files.map(file => (
  <a href={file.url} download>{file.name}</a>
))}
```

---

## Summary

**Current State:**
- ❌ `certifications` column missing
- ❌ RLS policy blocks UPSERT
- ❌ Trainers can't save certifications
- ❌ Admin can't see certifications

**After Running Fix:**
- ✅ `certifications` column added
- ✅ RLS policy allows UPSERT
- ✅ Trainers can save certifications
- ✅ Admin can see certifications

**Action Required:**
Run `FIX_CERTIFICATIONS_COMPLETE.sql` in Supabase SQL Editor

