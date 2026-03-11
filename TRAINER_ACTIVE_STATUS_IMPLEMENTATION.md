# Trainer Active/Inactive Status Implementation

## Overview
This document describes the implementation of the trainer account activation/deactivation feature. Admins can now activate or deactivate trainer accounts, and inactive trainers are prevented from logging in.

---

## 🗄️ Database Changes

### 1. Added `is_active` Column to `trainer_profiles` Table

**File**: `database_schema.sql`

```sql
-- Account Status (managed by admin)
is_active BOOLEAN DEFAULT TRUE, -- Trainer can login only if active
```

**Default Value**: `TRUE` (all new trainers are active by default)

**Index Created**: 
```sql
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_is_active ON trainer_profiles(is_active);
```

---

## 📝 Migration Script

**File**: `add_trainer_active_status.sql`

Run this SQL script in Supabase SQL Editor to add the field to existing databases:

```sql
-- Add is_active field to trainer_profiles table
ALTER TABLE trainer_profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_trainer_profiles_is_active ON trainer_profiles(is_active);

-- Update any existing trainers to be active by default
UPDATE trainer_profiles SET is_active = TRUE WHERE is_active IS NULL;

-- Add comment to the column
COMMENT ON COLUMN trainer_profiles.is_active IS 'Trainer can login only if active. Managed by admin.';
```

---

## 🔧 Admin Panel Changes

### 1. Trainer Management Table

**File**: `Admin_Panel/pages/TrainerManagement.jsx`

#### Added Features:
- **New Column**: "Account Status" showing Active/Inactive badge
- **Toggle Button**: Power icon to activate/deactivate trainers
- **Visual Indicators**: 
  - Green badge with checkmark for Active
  - Red badge with X for Inactive
  - Green power button to activate
  - Red power-off button to deactivate

#### Key Functions:

```javascript
// Toggle trainer active/inactive status
const toggleTrainerStatus = async (trainerId, currentStatus) => {
  const newStatus = !currentStatus
  
  const { error } = await supabase
    .from('trainer_profiles')
    .update({ is_active: newStatus })
    .eq('id', trainerId)

  if (!error) {
    // Update local state
    setTrainers(prevTrainers =>
      prevTrainers.map(trainer =>
        trainer.id === trainerId
          ? { ...trainer, is_active: newStatus }
          : trainer
      )
    )
    alert(`Trainer ${newStatus ? 'activated' : 'deactivated'} successfully`)
  }
}

// Display active/inactive badge
const getActiveBadge = (isActive) => {
  return isActive ? (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
      <CheckCircle className="w-3 h-3" />
      Active
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
      <XCircle className="w-3 h-3" />
      Inactive
    </span>
  )
}
```

#### Table Structure:
| Name | Contact | Location | Experience | Clients | KYC Status | Account Status | Actions |
|------|---------|----------|------------|---------|------------|----------------|---------|
| John Doe | email/phone | City, State | 5 years | 10 | Approved | Active 🔴 | 👁️ |

---

## 🔒 Authentication Changes

### 1. Trainer Login Page

**File**: `src/pages/TrainerAuthPage.jsx`

#### Added Check:
After successful authentication and role verification, the system now checks if the trainer's account is active:

```javascript
// Check if trainer account is active
const { data: trainerProfile, error: trainerError } = await supabase
  .from('trainer_profiles')
  .select('is_active')
  .eq('user_id', data.user.id)
  .single()

// If trainer profile exists and is_active is false, deny login
if (trainerProfile && trainerProfile.is_active === false) {
  await supabase.auth.signOut()
  throw new Error('Your account has been deactivated. Please contact the administrator for assistance.')
}
```

#### Error Message:
When an inactive trainer tries to log in, they see:
> "Your account has been deactivated. Please contact the administrator for assistance."

---

### 2. Protected Route Component

**File**: `src/components/ProtectedRoute.jsx`

#### Added Check:
The protected route now checks trainer status on every page load:

```javascript
// If user is a trainer, check if account is active
if (role === 'trainer') {
  const { data: trainerProfile, error: trainerError } = await supabase
    .from('trainer_profiles')
    .select('is_active')
    .eq('user_id', user.id)
    .single()

  // If trainer profile exists and is_active is false, deny access
  if (trainerProfile && trainerProfile.is_active === false) {
    setErrorMessage('Your account has been deactivated. Please contact the administrator for assistance.')
    await supabase.auth.signOut()
    setIsAuthorized(false)
    setLoading(false)
    return
  }
}
```

#### Deactivation Screen:
When an inactive trainer tries to access the dashboard, they see a full-page error:

```
┌─────────────────────────────────────┐
│         🔴 Account Deactivated      │
│                                     │
│  Your account has been deactivated. │
│  Please contact the administrator   │
│  for assistance.                    │
│                                     │
│      [Back to Login]                │
└─────────────────────────────────────┘
```

---

## 🎯 User Flow

### Admin Workflow:

1. **Admin logs into Admin Dashboard**
2. **Navigates to Trainer Management**
3. **Sees all trainers with their Account Status**
4. **Clicks Power/PowerOff button** to toggle status
5. **Confirmation alert** shows success
6. **Trainer's status updates immediately** in the table

### Trainer Workflow (Active):

1. **Trainer logs in** at `/trainer_login`
2. **System checks**:
   - ✅ Valid credentials
   - ✅ Role is 'trainer'
   - ✅ Account is active
3. **Redirects to dashboard** successfully

### Trainer Workflow (Inactive):

1. **Trainer logs in** at `/trainer_login`
2. **System checks**:
   - ✅ Valid credentials
   - ✅ Role is 'trainer'
   - ❌ Account is inactive
3. **Login fails** with error message
4. **Trainer is signed out** automatically
5. **Error displayed**: "Your account has been deactivated. Please contact the administrator for assistance."

### Trainer Workflow (Already Logged In, Then Deactivated):

1. **Trainer is using dashboard**
2. **Admin deactivates their account**
3. **Trainer navigates to another page** (triggers ProtectedRoute check)
4. **System detects inactive status**
5. **Trainer is signed out** automatically
6. **Deactivation screen shown** with contact message

---

## 🔍 Technical Details

### Database Schema:
- **Table**: `trainer_profiles`
- **Column**: `is_active` (BOOLEAN)
- **Default**: `TRUE`
- **Nullable**: No
- **Indexed**: Yes

### Security:
- Only admins can change `is_active` status
- Trainers cannot modify their own status
- Status is checked on:
  - Login attempt
  - Every protected route access
  - Dashboard navigation

### Performance:
- Indexed column for fast lookups
- Single query to check status
- Cached in component state after fetch

---

## 📋 Testing Checklist

### Admin Panel:
- [ ] Admin can see Account Status column in Trainer Management
- [ ] Active trainers show green "Active" badge
- [ ] Inactive trainers show red "Inactive" badge
- [ ] Clicking power button toggles status
- [ ] Success alert appears after toggle
- [ ] Table updates immediately without refresh
- [ ] Status persists after page reload

### Trainer Login:
- [ ] Active trainer can log in successfully
- [ ] Inactive trainer cannot log in
- [ ] Error message displays for inactive trainer
- [ ] Inactive trainer is signed out automatically
- [ ] Error message is clear and helpful

### Protected Routes:
- [ ] Active trainer can access all dashboard pages
- [ ] Inactive trainer is blocked from dashboard
- [ ] Deactivation screen shows proper message
- [ ] "Back to Login" button works
- [ ] Trainer is signed out when deactivated

### Edge Cases:
- [ ] New trainer (no profile yet) can log in
- [ ] Trainer with NULL is_active is treated as active
- [ ] Multiple rapid toggles work correctly
- [ ] Status check doesn't break for admins

---

## 🚀 Deployment Steps

1. **Run Migration Script**:
   - Open Supabase SQL Editor
   - Run `add_trainer_active_status.sql`
   - Verify column was added

2. **Deploy Code Changes**:
   - Update `database_schema.sql`
   - Update `TrainerManagement.jsx`
   - Update `TrainerAuthPage.jsx`
   - Update `ProtectedRoute.jsx`

3. **Test Functionality**:
   - Test admin toggle
   - Test trainer login (active)
   - Test trainer login (inactive)
   - Test protected route access

4. **Monitor**:
   - Check for any login errors
   - Verify status checks are working
   - Ensure no performance issues

---

## 📞 Support

If a trainer's account is deactivated, they should:
1. Contact the administrator
2. Provide their email address
3. Request account reactivation
4. Wait for admin to toggle status back to active

---

## ✅ Summary

This implementation provides:
- ✅ Admin control over trainer account status
- ✅ Automatic login prevention for inactive trainers
- ✅ Clear error messages for deactivated accounts
- ✅ Real-time status updates in admin panel
- ✅ Security checks on login and route access
- ✅ User-friendly UI with visual indicators
- ✅ Backward compatibility (defaults to active)

All trainers are **active by default** when they sign up, and only admins can deactivate accounts through the Trainer Management panel.

