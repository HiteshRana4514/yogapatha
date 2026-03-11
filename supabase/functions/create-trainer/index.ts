import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { firstName, lastName, email, password, location, kycApproved } = await req.json();

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !location) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Determine KYC status based on admin's choice
    const kycStatus = kycApproved ? 'approved' : 'pending';

    const supabase = createClient(
      Deno.env.get("PROJECT_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!
    );

    // Create user with admin API (bypasses email confirmation)
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        firstName: firstName,
        lastName: lastName,
        location: location,
        role: 'trainer',
      },
    });

    if (userError) {
      return new Response(
        JSON.stringify({ error: userError.message }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create profile entry
    const { error: profileError } = await supabase
      .from("profiles")
      .insert([
        { 
          id: userData.user.id, 
          email: email, 
          role: "trainer" 
        },
      ]);

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Don't fail the request if profile creation fails
      // The trigger should handle this
    }

    // Create trainer_profile entry with initial KYC status
    // Using upsert to handle cases where profile might already exist
    const { data: trainerProfileData, error: trainerProfileError } = await supabase
      .from("trainer_profiles")
      .upsert([
        {
          user_id: userData.user.id,
          is_active: true,
          kyc_status: kycStatus,
          partnership_status: 'pending',
          wants_partnership: false,
          certifications: [],
          // Placeholder for identity card - trainer will upload later
          identity_card_url: 'https://via.placeholder.com/400x300/336b6e/ffffff?text=Upload+ID+Card',
          avatar_url: null,
        },
      ], {
        onConflict: 'user_id',
        ignoreDuplicates: false
      })
      .select();

    if (trainerProfileError) {
      console.error("Trainer profile creation error:", trainerProfileError);
      // Return error if trainer profile creation fails
      return new Response(
        JSON.stringify({ error: `Failed to create trainer profile: ${trainerProfileError.message}` }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }


    // Send welcome email to new trainer
    try {
      const emailResponse = await fetch(
        `${Deno.env.get("PROJECT_URL")}/functions/v1/quick-function`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get("SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            to: email,
            subject: 'Welcome to YogaPatha! 🧘',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background: linear-gradient(135deg, #336b6e 0%, #2a5557 100%); color: white; padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
                  .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                  .welcome-text { font-size: 18px; text-align: center; margin: 20px 0; }
                  .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #336b6e; }
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
                    <p style="font-size: 18px;">Hi ${firstName}, we're excited to have you on board!</p>
                  </div>
                  <div class="content">
                    <p class="welcome-text">
                      You're now part of India's leading yoga training platform. Let's help you get started!
                    </p>

                    <div class="credentials">
                      <h3 style="color: #336b6e; margin-top: 0;">Your Login Credentials</h3>
                      <p><strong>Email:</strong> ${email}</p>
                      <p><strong>Password:</strong> ${password}</p>
                      <p style="color: #dc2626; font-size: 14px; margin-top: 15px;">
                        ⚠️ Please change your password after first login for security.
                      </p>
                    </div>

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
                      <a href="${Deno.env.get("SITE_URL") || 'https://yogapatha.com'}/trainer-auth" 
                         style="display: inline-block; background: #336b6e; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
                        Login to Dashboard
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
            `,
          }),
        }
      );

      if (!emailResponse.ok) {
        console.error('Failed to send welcome email:', await emailResponse.text());
      } else {
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail the trainer creation if email fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: userData.user.id,
          email: userData.user.email,
          firstName: firstName,
          lastName: lastName,
          location: location,
          password: password, // Return password for display
          kycStatus: kycStatus,
        },
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

