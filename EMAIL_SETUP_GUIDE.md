# Email Setup Guide for YogaPatha

This guide will help you configure custom email functionality using your Hostinger email account.

## Part 1: Configure Supabase Auth SMTP (For Authentication Emails)

### Step 1: Get Your Hostinger SMTP Credentials

From your Hostinger email account, you'll need:
- **SMTP Host**: `smtp.hostinger.com`
- **SMTP Port**: `465` (SSL) or `587` (TLS)
- **Username**: Your full email address (e.g., `noreply@yourdomain.com`)
- **Password**: Your email password

### Step 2: Configure Supabase SMTP Settings

1. Go to your Supabase Dashboard
2. Navigate to **Project Settings** → **Authentication**
3. Scroll down to **SMTP Settings**
4. Enable **Custom SMTP**
5. Fill in the details:
   ```
   Host: smtp.hostinger.com
   Port: 465
   Username: your-email@yourdomain.com
   Password: your-email-password
   Sender email: your-email@yourdomain.com
   Sender name: YogaPatha
   ```
6. Click **Save**

### Step 3: Test Authentication Emails

Try signing up a new user or resetting password to test if emails are being sent from your custom email.

---

## Part 2: Deploy Edge Function for Custom Emails

### Step 1: Set Environment Variables in Supabase

1. Go to **Project Settings** → **Edge Functions**
2. Add the following secrets:
   ```
   SMTP_HOST=smtp.hostinger.com
   SMTP_PORT=465
   SMTP_USER=your-email@yourdomain.com
   SMTP_PASS=your-email-password
   FROM_EMAIL=your-email@yourdomain.com
   FROM_NAME=YogaPatha
   ```

### Step 2: Deploy the Edge Function

Run these commands in your terminal:

```bash
# Login to Supabase CLI (if not already logged in)
npx supabase login

# Link your project
npx supabase link --project-ref your-project-ref

# Deploy the send-email function
npx supabase functions deploy send-email

# Set the secrets
npx supabase secrets set SMTP_HOST=smtp.hostinger.com
npx supabase secrets set SMTP_PORT=465
npx supabase secrets set SMTP_USER=your-email@yourdomain.com
npx supabase secrets set SMTP_PASS=your-email-password
npx supabase secrets set FROM_EMAIL=your-email@yourdomain.com
npx supabase secrets set FROM_NAME=YogaPatha
```

### Step 3: Test the Edge Function

You can test it using curl:

```bash
curl -i --location --request POST 'https://your-project-ref.supabase.co/functions/v1/send-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"to":"test@example.com","subject":"Test Email","html":"<h1>Hello!</h1>"}'
```

---

## Part 3: Integrate Email Notifications in Your App

### Available Email Functions:

1. **Payment Notification** - Sent to trainer when payment is recorded
2. **Client Assignment** - Sent to trainer when new client is assigned
3. **Welcome Email** - Sent to new trainers
4. **Payment Reminder** - Sent to admin for upcoming payments

### Example Usage:

#### In RecordPaymentModal.jsx (After recording payment):

```javascript
import { sendPaymentNotification } from '../../src/utils/emailService'

// After successful payment recording
const trainerEmail = trainerData.email // Get from trainer profile
await sendPaymentNotification(trainerEmail, {
  clientName: `${client.first_name} ${client.last_name}`,
  amount: totalFee,
  paymentDate: paymentDate,
  paymentMethod: paymentMethod,
  trainerAmount: trainerAmount,
  platformFee: platformFee
})
```

#### When Assigning Client to Trainer:

```javascript
import { sendClientAssignmentNotification } from '../../src/utils/emailService'

await sendClientAssignmentNotification(trainerEmail, {
  clientName: `${client.first_name} ${client.last_name}`,
  clientEmail: client.email,
  clientPhone: client.phone,
  classType: client.class_type,
  assignedDate: new Date().toISOString()
})
```

#### When Creating New Trainer:

```javascript
import { sendTrainerWelcomeEmail } from '../../src/utils/emailService'

await sendTrainerWelcomeEmail(
  trainerEmail,
  `${trainer.first_name} ${trainer.last_name}`
)
```

---

## Part 4: Email Templates Customization

All email templates are in `/src/utils/emailService.js`. You can customize:
- Colors and styling
- Content and messaging
- Company branding
- Links and CTAs

### Tips for Email Templates:
1. Use inline CSS for better email client compatibility
2. Keep width under 600px for mobile compatibility
3. Test emails across different email clients
4. Use absolute URLs for images and links

---

## Troubleshooting

### Emails Not Sending?

1. **Check SMTP credentials** - Verify username/password
2. **Check port** - Try 587 if 465 doesn't work
3. **Check Hostinger email limits** - Some plans have sending limits
4. **Check Edge Function logs** - View logs in Supabase dashboard
5. **Verify DNS records** - Ensure SPF/DKIM are configured for your domain

### Edge Function Errors?

```bash
# View function logs
npx supabase functions logs send-email

# Test locally
npx supabase functions serve send-email
```

### Email Going to Spam?

1. Configure SPF record in your domain DNS
2. Configure DKIM in Hostinger email settings
3. Add DMARC policy
4. Warm up your email (start with low volume)
5. Avoid spam trigger words in subject/content

---

## Security Best Practices

1. ✅ Never commit SMTP credentials to Git
2. ✅ Use environment variables for all sensitive data
3. ✅ Implement rate limiting for email sending
4. ✅ Validate email addresses before sending
5. ✅ Log all email activities for audit trail
6. ✅ Use HTTPS for all API calls

---

## Next Steps

1. Deploy the Edge Function
2. Test with a few emails
3. Integrate into payment recording flow
4. Add email notifications for other events
5. Monitor email delivery rates
6. Set up email analytics (optional)

---

## Support

For issues with:
- **Hostinger Email**: Contact Hostinger support
- **Supabase Edge Functions**: Check Supabase docs or Discord
- **Email Templates**: Modify `/src/utils/emailService.js`

---

**Last Updated**: February 2026
