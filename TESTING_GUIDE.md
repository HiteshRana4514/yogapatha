# Testing Guide - Role-Based Authentication

## 🧪 Testing Checklist

### Step 1: Create Test Users

#### Create Admin User (via Supabase Dashboard)
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Email: `admin@test.com`
4. Password: `Admin123!`
5. Copy the user's UUID after creation
6. Go to SQL Editor and run:
```sql
-- Insert admin role into profiles table
INSERT INTO profiles (id, email, role)
VALUES ('paste-user-uuid-here', 'admin@test.com', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

**Note**: Roles are stored in the `profiles` table, not in user metadata.

#### Create Trainer User (via Signup Form)
1. Go to `http://localhost:5173/trainer_login`
2. Click "Join Our Team" tab
3. Fill out the signup form
4. Check email for confirmation
5. Confirm email
6. User will have `role: "trainer"` automatically

### Step 2: Test Admin Login

#### ✅ Valid Admin Login
- **URL**: `http://localhost:5173/admin-login`
- **Credentials**: admin@test.com / Admin123!
- **Expected**: Success message → Redirect to `/admin_dashboard`
- **Result**: Should see admin dashboard with stats

#### ❌ Trainer Trying Admin Login
- **URL**: `http://localhost:5173/admin-login`
- **Credentials**: trainer@test.com / trainer password
- **Expected**: Error "Access denied. Admin credentials required."
- **Result**: User signed out, stays on login page

### Step 3: Test Trainer Login

#### ✅ Valid Trainer Login
- **URL**: `http://localhost:5173/trainer_login`
- **Credentials**: trainer@test.com / trainer password
- **Expected**: Success message → Redirect to `/trainer_dashboard`
- **Result**: Should see trainer dashboard

#### ❌ Admin Trying Trainer Login
- **URL**: `http://localhost:5173/trainer_login`
- **Credentials**: admin@test.com / Admin123!
- **Expected**: Error "Please use the admin login portal."
- **Result**: User signed out, stays on login page

### Step 4: Test Protected Routes

#### Admin Dashboard Access
- **Logged in as Admin**: ✅ Can access `/admin_dashboard`
- **Logged in as Trainer**: ❌ Redirected to home page
- **Not logged in**: ❌ Redirected to home page

#### Trainer Dashboard Access
- **Logged in as Trainer**: ✅ Can access `/trainer_dashboard`
- **Logged in as Admin**: ❌ Redirected to home page
- **Not logged in**: ❌ Redirected to home page

### Step 5: Test Direct URL Access

Try accessing dashboards directly via URL:

1. **While logged out**:
   - Navigate to `/admin_dashboard` → Should redirect to `/`
   - Navigate to `/trainer_dashboard` → Should redirect to `/`

2. **While logged in as Admin**:
   - Navigate to `/admin_dashboard` → ✅ Should work
   - Navigate to `/trainer_dashboard` → ❌ Should redirect to `/`

3. **While logged in as Trainer**:
   - Navigate to `/trainer_dashboard` → ✅ Should work
   - Navigate to `/admin_dashboard` → ❌ Should redirect to `/`

### Step 6: Test Logout Functionality

#### Admin Logout
1. Login as admin
2. Click logout button in sidebar
3. Should redirect to `/admin-login`
4. Should not be able to access `/admin_dashboard`

#### Trainer Logout
1. Login as trainer
2. Click logout button in sidebar
3. Should redirect to `/trainer_login`
4. Should not be able to access `/trainer_dashboard`

## 🎯 Expected Behavior Summary

| User Type | Can Access Admin Dashboard | Can Access Trainer Dashboard |
|-----------|---------------------------|------------------------------|
| Admin     | ✅ Yes                    | ❌ No                        |
| Trainer   | ❌ No                     | ✅ Yes                       |
| Guest     | ❌ No                     | ❌ No                        |

## 🔍 Debugging Tips

### Check User Role
Open browser console and run:
```javascript
const { data } = await supabase.auth.getUser()
console.log(data.user?.user_metadata?.role)
```

### Check Authentication State
```javascript
const { data } = await supabase.auth.getSession()
console.log(data.session)
```

### Common Issues

**Issue**: "Loading..." forever on protected route
- **Fix**: Check if user metadata has role field
- **Fix**: Check Supabase connection

**Issue**: Can access wrong dashboard
- **Fix**: Clear browser cache and localStorage
- **Fix**: Check ProtectedRoute component role prop

**Issue**: Login succeeds but redirects to home
- **Fix**: Verify role in user_metadata matches exactly ("admin" or "trainer")
- **Fix**: Check for typos in role string

## 📊 Test Results Template

```
✅ Admin Login - Valid Credentials: PASS/FAIL
❌ Admin Login - Trainer Credentials: PASS/FAIL
✅ Trainer Login - Valid Credentials: PASS/FAIL
❌ Trainer Login - Admin Credentials: PASS/FAIL
✅ Admin Dashboard - Admin Access: PASS/FAIL
❌ Admin Dashboard - Trainer Access: PASS/FAIL
✅ Trainer Dashboard - Trainer Access: PASS/FAIL
❌ Trainer Dashboard - Admin Access: PASS/FAIL
✅ Admin Logout: PASS/FAIL
✅ Trainer Logout: PASS/FAIL
```

## 🚀 Ready to Test!

Start your development server:
```bash
npm run dev
```

Then follow the testing checklist above!
