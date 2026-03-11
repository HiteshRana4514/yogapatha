import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com'
const SMTP_PORT = Deno.env.get('SMTP_PORT') || '465'
const SMTP_USER = Deno.env.get('SMTP_USER') // Your Hostinger email
const SMTP_PASS = Deno.env.get('SMTP_PASS') // Your Hostinger email password
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || SMTP_USER
const FROM_NAME = Deno.env.get('FROM_NAME') || 'YogaPatha'

interface EmailRequest {
  to: string
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: string // base64 encoded
    contentType: string
  }>
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { to, subject, html, text, attachments }: EmailRequest = await req.json()

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Using nodemailer via npm:nodemailer
    const nodemailer = await import('npm:nodemailer@6.9.7')

    const transporter = nodemailer.default.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT),
      secure: true, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    })

    const mailOptions: any = {
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html,
    }

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      mailOptions.attachments = attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        encoding: 'base64',
        contentType: att.contentType
      }))
    }

    const info = await transporter.sendMail(mailOptions)

    return new Response(
      JSON.stringify({
        success: true,
        messageId: info.messageId,
        message: 'Email sent successfully'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to send email',
        details: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
