# PhonePe Payment Gateway Integration Guide

## Overview
This guide covers integrating PhonePe Payment Gateway to collect fees from clients via payment links.

---

## Prerequisites

### 1. PhonePe Merchant Account
- Sign up at: https://business.phonepe.com/
- Complete KYC verification
- Get your credentials:
  - **Merchant ID**
  - **Salt Key**
  - **Salt Index**
  - **API Key**

### 2. Environment Setup
Add to your `.env` file:
```env
VITE_PHONEPE_MERCHANT_ID=your_merchant_id
VITE_PHONEPE_SALT_KEY=your_salt_key
VITE_PHONEPE_SALT_INDEX=1
VITE_PHONEPE_MODE=UAT  # Use 'PRODUCTION' for live
```

---

## PhonePe API Endpoints

### UAT (Testing)
- Payment: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay`
- Status: `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status`

### Production
- Payment: `https://api.phonepe.com/apis/hermes/pg/v1/pay`
- Status: `https://api.phonepe.com/apis/hermes/pg/v1/status`

---

## Implementation Steps

### Step 1: Database Schema Updates

Add payment link fields to clients table:

```sql
-- Add payment link columns to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_link_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_link_url TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_link_status TEXT DEFAULT 'pending';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_link_created_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_link_expires_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phonepe_transaction_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;
```

### Step 2: Create Supabase Edge Function

Create `/supabase/functions/phonepe-payment/index.ts`

This function will:
- Generate payment links
- Handle payment callbacks
- Update payment status

### Step 3: Frontend Integration

Create payment link UI in admin panel to:
- Generate payment links for clients
- Send links via email/SMS
- Track payment status
- Handle payment confirmations

---

## Security Best Practices

1. **Never expose Salt Key** in frontend code
2. **Validate all callbacks** using signature verification
3. **Use HTTPS** for all webhook URLs
4. **Store sensitive data** in Supabase secrets
5. **Implement rate limiting** on payment endpoints
6. **Log all transactions** for audit trail

---

## Payment Flow

```
1. Admin generates payment link for client
   ↓
2. System creates PhonePe payment request
   ↓
3. Client receives payment link via email
   ↓
4. Client clicks link → redirected to PhonePe
   ↓
5. Client completes payment
   ↓
6. PhonePe sends callback to webhook
   ↓
7. System verifies payment and updates status
   ↓
8. Admin receives notification
   ↓
9. Payment recorded in system
```

---

## Testing

### Test Cards (UAT Mode)
- **Success**: 4111 1111 1111 1111
- **Failure**: 4000 0000 0000 0002
- **CVV**: Any 3 digits
- **Expiry**: Any future date

---

## Webhook URL Setup

Your webhook URL should be:
```
https://your-project.supabase.co/functions/v1/phonepe-payment
```

Configure this in PhonePe merchant dashboard.

---

## Error Handling

Common errors and solutions:

| Error Code | Description | Solution |
|------------|-------------|----------|
| `BAD_REQUEST` | Invalid request format | Check payload structure |
| `AUTHORIZATION_FAILED` | Invalid signature | Verify Salt Key and hash |
| `TRANSACTION_NOT_FOUND` | Invalid transaction ID | Check transaction exists |
| `PAYMENT_PENDING` | Payment in progress | Wait for callback |
| `PAYMENT_DECLINED` | Payment failed | Ask client to retry |

---

## Next Steps

1. ✅ Set up PhonePe merchant account
2. ✅ Add environment variables
3. ✅ Run database migration
4. ✅ Deploy edge function
5. ✅ Configure webhook URL
6. ✅ Test with UAT credentials
7. ✅ Go live with production credentials

---

**Documentation**: https://developer.phonepe.com/v1/docs/payment-gateway
**Support**: support@phonepe.com
