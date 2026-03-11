import supabase from '../supabase/supabse'

/**
 * Email Service for YogaPatha
 * Handles sending emails via Supabase Edge Function
 */

const SUPABASE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quick-function`
const SITE_URL = import.meta.env.VITE_SITE_URL || window?.location?.origin || 'https://yogapatha.com'

/**
 * Send email via Supabase Edge Function
 */
const sendEmail = async (to, subject, html, text = '', attachments = []) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_ANON_KEY}`,
      },
      body: JSON.stringify({ to, subject, html, text, attachments }),
    })

    const result = await response.json()
    

    if (!response.ok) {
      throw new Error(result.error || 'Failed to send email')
    }

    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Email service error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Email Templates
 */

// Payment Notification to Trainer (with PDF attachment option)
export const sendPaymentNotification = async (trainerEmail, paymentData, pdfBase64 = null) => {
  const { clientName, amount, paymentDate, paymentMethod, trainerAmount, platformFee, invoiceNumber } = paymentData

  const subject = `Payment Received - ${clientName}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #336b6e 0%, #2a5557 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .amount { font-size: 32px; font-weight: bold; color: #059669; text-align: center; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; color: #666; }
        .value { color: #333; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Payment Received!</h1>
          <p>You have received a new payment</p>
        </div>
        <div class="content">
          <div class="amount">₹${trainerAmount.toLocaleString('en-IN')}</div>
          
          <div class="details">
            <div class="detail-row">
              <span class="label">Client:</span>
              <span class="value">${clientName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Payment Date:</span>
              <span class="value">${new Date(paymentDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="detail-row">
              <span class="label">Payment Method:</span>
              <span class="value">${paymentMethod.replace('_', ' ').toUpperCase()}</span>
            </div>
            <div class="detail-row">
              <span class="label">Total Fee:</span>
              <span class="value">₹${amount.toLocaleString('en-IN')}</span>
            </div>
            <div class="detail-row">
              <span class="label">Platform Fee:</span>
              <span class="value" style="color: #dc2626;">- ₹${platformFee.toLocaleString('en-IN')}</span>
            </div>
            <div class="detail-row" style="border-bottom: none; font-weight: bold; font-size: 18px;">
              <span class="label" style="color: #059669;">Your Income:</span>
              <span class="value" style="color: #059669;">₹${trainerAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          ${pdfBase64 ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              📎 <strong>Invoice PDF attached</strong><br>
              Your payment invoice is attached to this email for your records.
            </p>
          </div>
          ` : ''}

          <p style="text-align: center; margin-top: 20px;">
            <a href="${SITE_URL}/trainer-dashboard/payment-history" 
               style="display: inline-block; background: #336b6e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View Payment Details
            </a>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated email from YogaPatha. Please do not reply.</p>
          <p>© ${new Date().getFullYear()} YogaPatha. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const attachments = pdfBase64 ? [{
    filename: `Invoice_${invoiceNumber || 'YP'}.pdf`,
    content: pdfBase64,
    contentType: 'application/pdf'
  }] : []

  return await sendEmail(trainerEmail, subject, html, '', attachments)
}

// Client Assignment Notification to Trainer
export const sendClientAssignmentNotification = async (trainerEmail, clientData) => {
  const { clientName, clientEmail, clientPhone, classType, assignedDate } = clientData

  const subject = `New Client Assigned - ${clientName}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #336b6e 0%, #2a5557 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .client-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #336b6e; }
        .detail-row { padding: 10px 0; }
        .label { font-weight: bold; color: #666; display: block; margin-bottom: 5px; }
        .value { color: #333; }
        .badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .badge-permanent { background: #d1fae5; color: #065f46; }
        .badge-demo { background: #fef3c7; color: #92400e; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>👤 New Client Assigned!</h1>
          <p>You have been assigned a new client</p>
        </div>
        <div class="content">
          <div class="client-card">
            <h2 style="color: #336b6e; margin-top: 0;">${clientName}</h2>
            <span class="badge badge-${classType}">${classType.toUpperCase()}</span>
            
            <div class="detail-row">
              <span class="label">Email:</span>
              <span class="value">${clientEmail}</span>
            </div>
            <div class="detail-row">
              <span class="label">Phone:</span>
              <span class="value">${clientPhone}</span>
            </div>
            <div class="detail-row">
              <span class="label">Assigned Date:</span>
              <span class="value">${new Date(assignedDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          <p style="text-align: center; margin-top: 20px;">
            <a href="${SITE_URL}/trainer-dashboard/${classType}-clients" 
               style="display: inline-block; background: #336b6e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              View Client Details
            </a>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated email from YogaPatha. Please do not reply.</p>
          <p>© ${new Date().getFullYear()} YogaPatha. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail(trainerEmail, subject, html)
}

// Welcome Email to New Trainer
export const sendTrainerWelcomeEmail = async (trainerEmail, trainerName) => {
  const subject = 'Welcome to YogaPatha! 🧘'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #336b6e 0%, #2a5557 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .welcome-text { font-size: 18px; text-align: center; margin: 20px 0; }
        .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .feature { padding: 15px 0; border-bottom: 1px solid #eee; }
        .feature:last-child { border-bottom: none; }
        .feature-icon { font-size: 24px; margin-right: 10px; }
        .cta { text-align: center; margin: 30px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🧘 Welcome to YogaPatha!</h1>
          <p style="font-size: 18px;">Hi ${trainerName}, we're excited to have you on board!</p>
        </div>
        <div class="content">
          <p class="welcome-text">
            You're now part of India's leading yoga training platform. Let's help you get started!
          </p>

          <div class="features">
            <h3 style="color: #336b6e; margin-top: 0;">What you can do:</h3>
            <div class="feature">
              <span class="feature-icon">👥</span>
              <strong>Manage Clients:</strong> Track demo and permanent clients
            </div>
            <div class="feature">
              <span class="feature-icon">💰</span>
              <strong>Payment Tracking:</strong> View all payments and download invoices
            </div>
            <div class="feature">
              <span class="feature-icon">📊</span>
              <strong>Dashboard:</strong> Monitor your performance and earnings
            </div>
            <div class="feature">
              <span class="feature-icon">⚙️</span>
              <strong>Profile Management:</strong> Update your details and payment info
            </div>
          </div>

          <div class="cta">
            <a href="${SITE_URL}/trainer-dashboard" 
               style="display: inline-block; background: #336b6e; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
              Go to Dashboard
            </a>
          </div>

          <p style="text-align: center; color: #666; margin-top: 30px;">
            Need help? Contact us at <a href="mailto:support@yogapatha.com" style="color: #336b6e;">support@yogapatha.com</a>
          </p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} YogaPatha. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail(trainerEmail, subject, html)
}

// Payment Reminder to Admin
export const sendPaymentReminderToAdmin = async (adminEmail, reminderData) => {
  const { trainerName, clientName, dueDate, amount } = reminderData

  const subject = `Payment Reminder - ${clientName} to ${trainerName}`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #fef3c7; color: #92400e; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; border-left: 4px solid #f59e0b; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .reminder-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .detail-row { padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; color: #666; }
        .value { color: #333; float: right; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Payment Reminder</h1>
          <p>A payment is due soon</p>
        </div>
        <div class="content">
          <div class="reminder-box">
            <div class="detail-row">
              <span class="label">Trainer:</span>
              <span class="value">${trainerName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Client:</span>
              <span class="value">${clientName}</span>
            </div>
            <div class="detail-row">
              <span class="label">Amount:</span>
              <span class="value">₹${amount.toLocaleString('en-IN')}</span>
            </div>
            <div class="detail-row" style="border-bottom: none;">
              <span class="label">Due Date:</span>
              <span class="value">${new Date(dueDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          <p style="text-align: center; margin-top: 20px;">
            <a href="${SITE_URL}/admin_dashboard/transactions" 
               style="display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Record Payment
            </a>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated reminder from YogaPatha.</p>
          <p>© ${new Date().getFullYear()} YogaPatha. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail(adminEmail, subject, html)
}

// Contact Form Submission Confirmation to Client
export const sendContactFormConfirmation = async (clientEmail, formData) => {
  const { name, subject, message, inquiryType } = formData

  const emailSubject = `We received your inquiry - YogaPatha`
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #336b6e 0%, #2a5557 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .message-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #336b6e; }
        .info-row { padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { font-weight: bold; color: #666; }
        .value { color: #333; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        .checkmark { font-size: 48px; color: #059669; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🙏 Thank You for Contacting Us!</h1>
          <p style="font-size: 18px;">We've received your inquiry</p>
        </div>
        <div class="content">
          <div class="checkmark">✓</div>
          
          <p style="text-align: center; font-size: 18px; margin: 20px 0;">
            Hi ${name},
          </p>
          
          <p style="text-align: center; color: #666;">
            Thank you for reaching out to YogaPatha. We've received your inquiry and our team will get back to you within 24 hours.
          </p>

          <div class="message-box">
            <h3 style="color: #336b6e; margin-top: 0;">Your Inquiry Details:</h3>
            <div class="info-row">
              <span class="label">Subject:</span>
              <span class="value">${subject}</span>
            </div>
            <div class="info-row">
              <span class="label">Inquiry Type:</span>
              <span class="value">${inquiryType.replace('_', ' ').toUpperCase()}</span>
            </div>
            <div class="info-row" style="border-bottom: none;">
              <span class="label">Your Message:</span>
              <p style="color: #666; margin-top: 10px;">${message}</p>
            </div>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>⏰ What's Next?</strong><br>
              Our team is reviewing your inquiry and will respond via email within 24 hours. 
              Please check your inbox (and spam folder) for our response.
            </p>
          </div>

          <p style="text-align: center; color: #666; margin-top: 30px;">
            Need immediate assistance? Call us at <a href="tel:+911234567890" style="color: #336b6e;">+91 123 456 7890</a>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated confirmation email from YogaPatha.</p>
          <p>© ${new Date().getFullYear()} YogaPatha. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  return await sendEmail(clientEmail, emailSubject, html)
}

export default {
  sendEmail,
  sendPaymentNotification,
  sendClientAssignmentNotification,
  sendTrainerWelcomeEmail,
  sendPaymentReminderToAdmin,
  sendContactFormConfirmation,
}
