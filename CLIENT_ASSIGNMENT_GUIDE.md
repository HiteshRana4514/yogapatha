# Client Assignment System - Admin Guide

## Overview
The enhanced client assignment system allows admins to assign clients to trainers with a two-stage workflow: **Demo Class** → **Permanent Assignment**.

## Features

### 1. **Comprehensive Client Table View**
- Full table display with all client information
- Sortable columns
- Shows client details: name, email, phone, location, fitness level, goals
- Visual indicators for assigned vs unassigned clients

### 2. **Advanced Search & Filtering**
- **Search Bar**: Search by client name, email, or city
- **Assignment Filter**: 
  - All Clients
  - Unassigned Only (default)
  - Already Assigned
- **Status Filter**: Active / Inactive
- **Fitness Level Filter**: Beginner / Intermediate / Advanced
- **Reset Button**: Clear all filters instantly

### 3. **Two-Stage Assignment Workflow**

#### Stage 1: Demo Class
- Assign client for a trial/demo class
- **Required**: Demo class date & time
- **Optional**: Admin notes
- Status tracked: scheduled → completed → cancelled/no_show
- Can be converted to permanent after completion

#### Stage 2: Permanent Assignment
- Direct permanent assignment (skips demo)
- Creates ongoing training relationship
- No end date - active until cancelled
- Can also be reached by converting demo clients

### 4. **Demo to Permanent Conversion**
- After demo class is marked "completed"
- "Convert" button appears in assigned clients table
- Confirmation modal with conversion details
- Tracks conversion date and admin who converted
- Maintains all previous assignment data

## How to Use

### Assigning a New Client

1. **Open Trainer Profile**
   - Navigate to Trainer Management
   - Click "View" on any trainer

2. **Click "Assign Client"**
   - Button located in "Assigned Clients" section
   - Opens enhanced assignment modal

3. **Search & Filter**
   - Use search bar to find specific clients
   - Apply filters to narrow down options
   - By default, shows only unassigned active clients

4. **Select Client**
   - Click "Select" button on desired client row
   - Client row highlights in blue
   - Assignment details section appears below

5. **Choose Assignment Type**

   **Option A: Demo Class**
   - Select demo class date & time (required)
   - Add admin notes (optional)
   - Click "Assign for Demo Class"
   
   **Option B: Permanent**
   - Add admin notes (optional)
   - Click "Assign as Permanent"

6. **Confirmation**
   - Assignment created successfully
   - Client appears in trainer's assigned clients table
   - Modal closes automatically

### Converting Demo to Permanent

1. **Mark Demo as Completed**
   - Update demo_class_status to "completed" in database
   - Or trainer marks it as completed from their dashboard

2. **Convert Button Appears**
   - In assigned clients table
   - Only shows for completed demo classes
   - Green "Convert" button with trending up icon

3. **Click Convert**
   - Confirmation modal appears
   - Shows what will happen
   - Lists changes being made

4. **Confirm Conversion**
   - Click "Convert Now"
   - Assignment type changes to "permanent"
   - Conversion date recorded
   - Client becomes active member

### Managing Assigned Clients

**Assigned Clients Table shows:**
- Client name and email
- Assignment type badge (Demo/Permanent)
- Demo class date and status (for demo clients)
- Conversion date (for converted clients)
- Actions: Convert (if eligible) and Remove

**To Remove Assignment:**
- Click X icon on any client row
- Confirms before removing
- Assignment status set to "cancelled"
- Client becomes available for reassignment

## Database Schema

### Tables Used

**clients**
- Client personal information
- Fitness goals and level
- Contact details
- Status (active/inactive)

**trainer_client_assignments**
- Links trainers to clients
- Assignment type: demo or permanent
- Demo class details (date, status, feedback)
- Conversion tracking
- Admin notes
- Status (active/completed/cancelled)

### Assignment Types

```sql
assignment_type:
  - 'demo'      # Trial class assignment
  - 'permanent' # Ongoing training relationship
```

### Demo Class Status

```sql
demo_class_status:
  - 'scheduled'  # Demo class scheduled
  - 'completed'  # Demo completed successfully
  - 'cancelled'  # Demo cancelled by admin/trainer
  - 'no_show'    # Client didn't show up
```

## Benefits

### For Admins
✅ Easy client-trainer matching  
✅ Trial period before permanent commitment  
✅ Complete visibility of all assignments  
✅ Flexible search and filtering  
✅ Track conversion rates (demo → permanent)  

### For Trainers
✅ Try working with client first (demo)  
✅ Build relationship before long-term commitment  
✅ Clear assignment status  
✅ Feedback mechanism after demo  

### For Clients
✅ Test trainer compatibility (demo)  
✅ No immediate long-term obligation  
✅ Smooth transition to permanent training  
✅ Clear assignment status  

## API Integration (TODO)

Replace mock data with Supabase queries:

```javascript
// Fetch all clients
const { data: clients } = await supabase
  .from('clients')
  .select('*')
  .eq('status', 'active')

// Fetch trainer's assignments
const { data: assignments } = await supabase
  .from('trainer_client_assignments')
  .select(`
    *,
    clients (*)
  `)
  .eq('trainer_id', trainerId)
  .eq('status', 'active')

// Create assignment
const { data, error } = await supabase
  .from('trainer_client_assignments')
  .insert({
    trainer_id: trainerId,
    client_id: clientId,
    assignment_type: 'demo',
    demo_class_date: demoDate,
    demo_class_status: 'scheduled',
    admin_notes: notes,
    assigned_by: adminId
  })

// Convert to permanent
const { error } = await supabase
  .from('trainer_client_assignments')
  .update({
    assignment_type: 'permanent',
    converted_to_permanent_at: new Date().toISOString(),
    converted_by: adminId
  })
  .eq('id', assignmentId)
```

## Status Badges

| Type | Color | Icon | Meaning |
|------|-------|------|---------|
| Demo Class | Blue | Calendar | Trial assignment |
| Permanent | Green | Check | Ongoing member |
| Scheduled | Blue | Clock | Demo upcoming |
| Completed | Green | Check | Demo done |
| Active | Green | - | Client active |
| Inactive | Gray | - | Client inactive |

## Best Practices

1. **Always start with demo** for new trainer-client pairs
2. **Add admin notes** for context (e.g., special requirements, goals)
3. **Monitor demo completion** rates
4. **Convert successful demos** to permanent promptly
5. **Filter unassigned** clients when assigning (default behavior)
6. **Use search** for quick client lookup
7. **Review assignments** regularly for optimization

## Troubleshooting

**Q: Client not appearing in list?**  
- Check if already assigned to this trainer
- Verify client status is "active"
- Check filters (reset to default)

**Q: Can't assign demo without date?**  
- Demo class date & time is required
- Use datetime-local input format

**Q: Convert button not showing?**  
- Demo must be marked "completed" first
- Only shows for demo assignments
- Check demo_class_status field

**Q: Assignment disappeared?**  
- Check if status is "cancelled"
- May have been removed by another admin
- Check assignment_status in database

## Future Enhancements

- [ ] Bulk assignment (multiple clients at once)
- [ ] Assignment templates (save common configurations)
- [ ] Automated demo reminders (email/SMS)
- [ ] Analytics dashboard (conversion rates, success metrics)
- [ ] Client preference matching (auto-suggest trainers)
- [ ] Calendar integration for demo scheduling
- [ ] Trainer availability checking
- [ ] Payment integration for permanent assignments
- [ ] Contract generation for permanent members
- [ ] Rating/feedback system after demo completion
