# Fix Emails Going to Spam - Complete Guide

Your emails are landing in spam because your domain lacks proper email authentication. Here's how to fix it:

---

## Step 1: Configure SPF Record (Sender Policy Framework)

SPF tells receiving servers which mail servers are authorized to send emails from your domain.

### In Hostinger DNS Settings:

1. Go to **Hostinger Control Panel** → **Domains** → **Your Domain** → **DNS Zone**
2. Add a new **TXT record**:
   ```
   Type: TXT
   Name: @ (or leave blank for root domain)
   Value: v=spf1 include:_spf.hostinger.com ~all
   TTL: 14400 (or default)
   ```

**What this does:** Authorizes Hostinger's mail servers to send emails on behalf of your domain.

---

## Step 2: Configure DKIM (DomainKeys Identified Mail)

DKIM adds a digital signature to your emails to verify they haven't been tampered with.

### In Hostinger Email Settings:

1. Go to **Hostinger Control Panel** → **Emails** → **Your Email Account**
2. Look for **DKIM Settings** or **Email Authentication**
3. **Enable DKIM** - Hostinger will generate DKIM keys
4. Copy the DKIM record provided
5. Add it to your DNS as a **TXT record**:
   ```
   Type: TXT
   Name: default._domainkey (or as provided by Hostinger)
   Value: [Long DKIM key provided by Hostinger]
   TTL: 14400
   ```

---

## Step 3: Configure DMARC (Domain-based Message Authentication)

DMARC tells receiving servers what to do with emails that fail SPF/DKIM checks.

### In Hostinger DNS Settings:

1. Add a new **TXT record**:
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=none; rua=mailto:your-email@yourdomain.com
   TTL: 14400
   ```

**Explanation:**
- `p=none` - Monitor mode (don't reject emails yet)
- `rua=mailto:...` - Where to send DMARC reports
- Later change to `p=quarantine` or `p=reject` once everything works

---

## Step 4: Set Up Reverse DNS (PTR Record)

This is usually handled by Hostinger automatically, but verify:

1. Contact **Hostinger Support**
2. Ask them to verify **PTR record** is set for your email server
3. PTR should point back to your domain

---

## Step 5: Improve Email Content

Even with authentication, content matters:

### ✅ DO:
- Use a professional "From" name (e.g., "YogaPatha Team")
- Include physical address in footer
- Add unsubscribe link (for marketing emails)
- Keep HTML clean and simple
- Test emails before sending to users

### ❌ DON'T:
- Use ALL CAPS in subject lines
- Use spam trigger words: "FREE", "URGENT", "ACT NOW"
- Send too many emails too quickly
- Use URL shorteners
- Have too many images vs text

---

## Step 6: Warm Up Your Email Domain

New email domains are treated with suspicion. Warm them up:

1. **Week 1:** Send 10-20 emails/day
2. **Week 2:** Send 50-100 emails/day
3. **Week 3:** Send 200-500 emails/day
4. **Week 4+:** Normal volume

**Tips:**
- Send to engaged users first
- Encourage recipients to reply
- Ask users to add you to contacts
- Monitor bounce rates

---

## Step 7: Use Email Verification

Verify email addresses before sending:

```javascript
// Add to your email service
const verifyEmail = async (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}
```

---

## Step 8: Monitor Email Reputation

### Check Your Domain Reputation:
- **MXToolbox**: https://mxtoolbox.com/blacklists.aspx
- **Google Postmaster Tools**: https://postmaster.google.com/
- **Microsoft SNDS**: https://sendersupport.olc.protection.outlook.com/snds/

### If Blacklisted:
1. Identify the blacklist
2. Follow their delisting process
3. Fix the underlying issue
4. Request removal

---

## Step 9: Test Your Email Setup

### Test Tools:
1. **Mail Tester**: https://www.mail-tester.com/
   - Send a test email to the address provided
   - Get a score out of 10
   - Fix issues highlighted

2. **MXToolbox**: https://mxtoolbox.com/SuperTool.aspx
   - Check SPF, DKIM, DMARC records
   - Verify DNS configuration

3. **Google Admin Toolbox**: https://toolbox.googleapps.com/apps/checkmx/
   - Check MX records
   - Verify email authentication

---

## Step 10: Update Email Templates

Make your emails look more legitimate:

### Add to Email Footer:
```html
<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
  <p style="font-size: 12px; color: #666;">
    <strong>YogaPatha</strong><br>
    Your Company Address<br>
    City, State, ZIP Code<br>
    India
  </p>
  <p style="font-size: 11px; color: #999;">
    You received this email because you are registered with YogaPatha.
    If you have any questions, contact us at support@yourdomain.com
  </p>
</div>
```

---

## Quick Checklist

- [ ] SPF record added to DNS
- [ ] DKIM enabled and record added to DNS
- [ ] DMARC record added to DNS
- [ ] PTR record verified with Hostinger
- [ ] Email content reviewed (no spam triggers)
- [ ] Domain warming plan started
- [ ] Email templates include footer with address
- [ ] Tested with mail-tester.com (score 8+)
- [ ] Monitored first batch of emails
- [ ] Asked recipients to whitelist your email

---

## Expected Timeline

- **DNS Changes:** 24-48 hours to propagate
- **Spam Folder → Inbox:** 1-2 weeks with good practices
- **Full Reputation:** 4-6 weeks of consistent sending

---

## Immediate Quick Fixes

While waiting for DNS to propagate:

1. **Ask recipients to:**
   - Mark your email as "Not Spam"
   - Add your email to contacts
   - Reply to your email

2. **Send fewer emails initially** (10-20/day)

3. **Use plain text version** alongside HTML

4. **Personalize emails** with recipient's name

---

## Support Resources

- **Hostinger Email Support**: https://www.hostinger.com/tutorials/email
- **SPF Record Generator**: https://www.spfwizard.net/
- **DMARC Generator**: https://dmarcian.com/dmarc-record-wizard/

---

**Last Updated**: February 2026
