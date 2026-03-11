# Creating an Admin User

Since you now have role-based authentication, you'll need to create an admin user to test the admin dashboard.

**IMPORTANT**: Roles are stored in the `profiles` table, not in user metadata.

## Step-by-Step Guide (Recommended)

### Step 1: Create User in Supabase Auth
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Click **Add User** or **Invite User**
4. Enter the admin email and password (e.g., `admin@test.com`)
5. Click **Create User**
6. Copy the user's UUID (you'll need this for the next step)

### Step 2: Add Admin Role to Profiles Table
1. Navigate to **SQL Editor** in Supabase
2. Run this query (replace with your admin's UUID and email):

```sql
-- Insert admin role into profiles table
INSERT INTO profiles (id, email, role)
VALUES ('paste-user-uuid-here', 'admin@test.com', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

**That's it!** Your admin user is now ready to login.

## Quick SQL Method (All-in-One)

If you want to create an admin user via SQL only:

```sql
-- This assumes you have the user already created in auth.users
-- Get the user ID first, then insert into profiles

-- Find user ID
SELECT id, email FROM auth.users WHERE email = 'admin@test.com';

-- Insert into profiles (replace 'user-id-here' with actual UUID)
INSERT INTO profiles (id, email, role)
VALUES ('user-id-here', 'admin@test.com', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
```

## Verify Admin User

Run this query to verify the admin user was created correctly:

```sql
SELECT p.id, p.email, p.role, u.email as auth_email
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role = 'admin';
```

## Testing the Role-Based Authentication

### Admin Login:
- URL: `http://localhost:5173/admin-login`
- Credentials: admin@test.com / your-password
- Should redirect to: `/admin_dashboard`
- Only users with `role: "admin"` in profiles table can access

### Trainer Login:
- URL: `http://localhost:5173/trainer_login`
- Use trainer credentials (created through signup)
- Should redirect to: `/trainer_dashboard`
- Only users with `role: "trainer"` in profiles table can access

### Security Features Implemented:
1. ✅ Admin can only login through admin portal
2. ✅ Trainer can only login through trainer portal
3. ✅ Cross-portal login attempts are blocked
4. ✅ Role verification from profiles table on login
5. ✅ Role verification from profiles table on protected routes
6. ✅ Automatic sign-out if wrong role detected
7. ✅ Separate dashboards for admin and trainer

## Profiles Table Structure

Make sure your `profiles` table has this structure:

```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'trainer', 'client')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy to allow authenticated users to read all profiles (for role checking)
CREATE POLICY "Authenticated users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);
```
