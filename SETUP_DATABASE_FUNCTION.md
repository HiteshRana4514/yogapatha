# 🔧 Database Function Setup Guide

## ⚠️ IMPORTANT: Required Setup Step

Before the trainer management system will work, you **MUST** run the SQL function in your Supabase database.

## 🎯 Why This Is Needed

The admin panel needs to fetch trainer data that is split across two locations:
1. **`trainer_profiles` table** - Contains KYC status, documents, partnership info
2. **`auth.users.user_metadata`** - Contains personal info (name, phone, bio, etc.)

The `auth.users` table is **not directly accessible** from client-side code for security reasons. Therefore, we created a **database function** that runs on the server side with elevated permissions to join these tables.

## 📋 Setup Instructions

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### Step 2: Run the SQL Function

Copy and paste the **entire contents** of `get_trainers_with_metadata.sql` into the SQL editor and click **"Run"**.

The file contains:
- ✅ A database function `get_trainers_with_metadata()`
- ✅ A database view `trainers_with_metadata` (alternative approach)
- ✅ Proper permissions for authenticated users
- ✅ Explicit type casts to prevent PostgreSQL type errors

**Note:** The SQL uses `CREATE OR REPLACE` so you can run it multiple times safely. It will update the function if it already exists.

### Step 3: Verify Installation

After running the SQL, verify it worked by running this test query:

```sql
SELECT * FROM get_trainers_with_metadata();
```

You should see all trainers with their complete data including metadata.

## 🔍 What the Function Does

### Function: `get_trainers_with_metadata()`

```sql
-- Returns all trainers with joined metadata
SELECT * FROM get_trainers_with_metadata();
```

**Returns:**
- `id` - trainer_profiles.id (used for client assignments)
- `user_id` - auth.users.id
- `first_name`, `last_name` - from user_metadata
- `email` - from auth.users
- `phone`, `city`, `state`, `address`, `pincode` - from user_metadata
- `bio`, `experience`, `specializations`, `certifications` - from user_metadata
- `kyc_status`, `partnership_status` - from trainer_profiles
- `avatar_url`, `identity_card_url`, `certificate_documents` - from trainer_profiles
- `academy_name`, `academy_address`, `academy_logo_url` - from trainer_profiles
- `client_count` - calculated count of assigned clients
- `created_at`, `updated_at` - from trainer_profiles

### View: `trainers_with_metadata`

Alternatively, you can query the view:

```sql
-- Query the view (doesn't include client_count)
SELECT * FROM trainers_with_metadata;
```

The view is simpler but doesn't include the client count. The function is recommended.

## 🚀 How It's Used in the Code

### TrainerManagement.jsx

```javascript
const fetchTrainers = async () => {
  // Call the database function
  const { data, error } = await supabase
    .rpc('get_trainers_with_metadata')
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  // Data is already formatted with all metadata!
  setTrainers(data)
}
```

## 🔐 Security

The function uses `SECURITY DEFINER` which means:
- ✅ It runs with the permissions of the function creator (admin)
- ✅ It can access `auth.users` table
- ✅ It's still secure because it only returns trainer data
- ✅ Only authenticated users can call it (via `GRANT EXECUTE`)

## 🐛 Troubleshooting

### Error: "function get_trainers_with_metadata() does not exist"

**Solution:** You haven't run the SQL file yet. Go to Supabase SQL Editor and run `get_trainers_with_metadata.sql`.

### Error: "permission denied for table auth.users"

**Solution:** Make sure the function uses `SECURITY DEFINER`. This is already included in the SQL file.

### Error: "operator does not exist: text = uuid"

**Solution:** This is a type mismatch error. Make sure you're using the **latest version** of `get_trainers_with_metadata.sql` which includes explicit type casts (`::TEXT`, `::BIGINT`). Re-run the entire SQL file.

See `DATABASE_FUNCTION_FIX.md` for details.

---

### Error: "could not serialize access due to concurrent update"

**Solution:** This is a rare race condition. Just retry the operation.

### Trainers show "N/A" for all fields

**Possible causes:**
1. Trainers haven't filled out their profiles yet
2. Metadata field names don't match (check if it's `firstName` vs `first_name`)
3. User metadata is empty

**Solution:** Check the actual metadata structure:

```sql
SELECT 
  id,
  email,
  raw_user_meta_data
FROM auth.users
WHERE id IN (SELECT user_id FROM trainer_profiles)
LIMIT 5;
```

## 📊 Alternative Approach (If Function Doesn't Work)

If you can't create the database function, you can use the view instead:

### Option 1: Use the View

```javascript
// In TrainerManagement.jsx
const { data, error } = await supabase
  .from('trainers_with_metadata')
  .select('*')

// Then manually count clients for each trainer
const trainersWithCounts = await Promise.all(
  data.map(async (trainer) => {
    const { count } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('trainer_id', trainer.id)
    
    return { ...trainer, client_count: count }
  })
)
```

### Option 2: Fetch Separately (Fallback)

If neither function nor view works, you can fetch trainer_profiles and manually get current user's metadata:

```javascript
// This only works for the logged-in user
const { data: { user } } = await supabase.auth.getUser()
const metadata = user.user_metadata
```

**Note:** This won't work for admin viewing all trainers, only for trainers viewing their own data.

## ✅ Verification Checklist

After setup, verify:

- [ ] SQL function runs without errors
- [ ] Test query returns trainer data
- [ ] Admin panel loads trainers successfully
- [ ] Trainer names display correctly (not "N/A")
- [ ] Client counts show accurate numbers
- [ ] KYC status displays properly
- [ ] Specializations appear as array
- [ ] No console errors in browser

## 📝 Next Steps

Once the database function is set up:

1. ✅ Trainers will load from real database
2. ✅ All metadata will display dynamically
3. ✅ Client assignments will work correctly
4. ✅ Admin can view complete trainer profiles

## 🆘 Need Help?

If you encounter issues:

1. Check Supabase logs in the dashboard
2. Verify RLS policies allow admin access
3. Ensure admin user has proper role in `profiles` table
4. Check browser console for detailed error messages

---

**Remember:** This is a **one-time setup**. Once the function is created, it will work for all future sessions!

