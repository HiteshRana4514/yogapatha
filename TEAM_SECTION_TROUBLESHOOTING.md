# Team Section Troubleshooting Guide

## Issue: Team section not visible on landing page

### Steps to Fix:

#### 1. Check Browser Console
Open browser console (F12 → Console) and look for these logs:
- 🔍 Fetching team members...
- 📊 Team members data: [...]
- ❌ Team members error: (should be null)
- ✅ Team members set: X members

#### 2. Verify Table Exists and Has Data
Run this in Supabase SQL Editor:
```sql
SELECT * FROM team_members WHERE status = 'active';
```

If you see data, the table is working. If not, run `create_team_table.sql` again.

#### 3. Fix RLS Policies (Most Common Issue)
If the table exists but you see an error in console about permissions, run:
```sql
fix_team_members_rls.sql
```

This will create more permissive policies that allow public read access.

#### 4. Check Supabase Connection
Verify your `.env` file has correct values:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

#### 5. Hard Refresh Browser
After any changes:
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### Common Errors:

**Error: "relation team_members does not exist"**
- Solution: Run `create_team_table.sql` in Supabase SQL Editor

**Error: "permission denied for table team_members"**
- Solution: Run `fix_team_members_rls.sql` to fix RLS policies

**Error: "Failed to fetch"**
- Solution: Check your Supabase URL and keys in `.env`

**No error but section shows "No team members found"**
- Solution: The table is empty. Run the INSERT statements from `create_team_table.sql`

### Quick Test Query
Run this to verify everything:
```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'team_members'
);

-- Check row count
SELECT COUNT(*) FROM team_members;

-- Check active members
SELECT COUNT(*) FROM team_members WHERE status = 'active';

-- View all data
SELECT id, name, designation, status FROM team_members;
```
