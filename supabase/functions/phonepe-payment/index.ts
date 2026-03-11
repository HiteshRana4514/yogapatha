import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// PhonePe OAuth Configuration
const PHONEPE_MODE = Deno.env.get('PHONEPE_MODE') || 'SANDBOX'
const PHONEPE_CLIENT_ID = Deno.env.get('PHONEPE_CLIENT_ID')
const PHONEPE_CLIENT_SECRET = Deno.env.get('PHONEPE_CLIENT_SECRET')
const PHONEPE_CLIENT_VERSION = Deno.env.get('PHONEPE_CLIENT_VERSION') || 'v1'

// Fixed Base URLs
const PHONEPE_BASE_URL = PHONEPE_MODE === 'PRODUCTION' 
  ? 'https://api.phonepe.com/apis/pg' 
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox'

  mode: PHONEPE_MODE,
  baseUrl: PHONEPE_BASE_URL,
  clientIdConfigured: !!PHONEPE_CLIENT_ID,
  clientSecretConfigured: !!PHONEPE_CLIENT_SECRET,
  clientVersion: PHONEPE_CLIENT_VERSION
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

// Get OAuth Access Token
async function getAccessToken(): Promise<string> {
  
  const formData = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: PHONEPE_CLIENT_ID || '',
    client_secret: PHONEPE_CLIENT_SECRET || '',
    client_version: PHONEPE_CLIENT_VERSION
  })

    grant_type: 'client_credentials',
    client_id: PHONEPE_CLIENT_ID,
    client_version: PHONEPE_CLIENT_VERSION,
    client_secret_set: !!PHONEPE_CLIENT_SECRET
  })

  const tokenResponse = await fetch(`${PHONEPE_BASE_URL}/v1/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString()
  })

  const tokenResult = await tokenResponse.json()
  
  if (!tokenResponse.ok || !tokenResult.access_token) {
    console.error('❌ Failed to get access token:', tokenResult)
    throw new Error('Failed to obtain OAuth access token: ' + (tokenResult.message || JSON.stringify(tokenResult)))
  }

  return tokenResult.access_token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('PROJECT_URL')!,
    Deno.env.get('SERVICE_ROLE_KEY')!
  )

  try {
    const url = new URL(req.url)
    const path = url.pathname

    // Generate Payment Link
    if (path.includes('/create') && req.method === 'POST') {
      const { clientId, amount, clientName, clientEmail, clientPhone } = await req.json()

      if (!clientId || !amount) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      try {
        // Step 1: Get OAuth Access Token
        const accessToken = await getAccessToken()

        // Step 2: Generate unique merchant order ID
        const merchantOrderId = `ORDER_${Date.now()}_${clientId.substring(0, 8)}`

        // Step 3: Create payment request payload for v2 API
        const paymentPayload = {
          merchantOrderId: merchantOrderId,
          amount: Math.round(amount * 100), // Convert to paise
          expireAfter: 1200, // 20 minutes in seconds
          merchantUrls: {
            redirectUrl: `${Deno.env.get('SITE_URL') || 'http://localhost:5173'}/payment/success?orderId=${merchantOrderId}`,
            callbackUrl: `${Deno.env.get('PROJECT_URL')}/functions/v1/phonepe-payment/callback`
          },
          metaInfo: {
            udf1: clientId,
            udf2: clientName || '',
            udf3: clientEmail || '',
            udf4: clientPhone || ''
          }
        }


        // Step 4: Make API call to PhonePe v2 checkout with O-Bearer
        const response = await fetch(`${PHONEPE_BASE_URL}/checkout/v2/pay`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `O-Bearer ${accessToken}`,
            'Accept': 'application/json'
          },
          body: JSON.stringify(paymentPayload)
        })

        const result = await response.json()

        // ✅ FIXED: v2 API returns state and redirectUrl at root level, not wrapped in data
        if (result.state === 'PENDING' && result.redirectUrl) {
          const paymentUrl = result.redirectUrl
          const orderId = result.orderId
          const expiresAt = new Date(result.expireAt) // expireAt is in epoch milliseconds

          // Update client record with payment link
          const { error: updateError } = await supabase
            .from('clients')
            .update({
              payment_link_id: merchantOrderId,
              payment_link_url: paymentUrl,
              payment_link_status: 'pending',
              payment_link_created_at: new Date().toISOString(),
              payment_link_expires_at: expiresAt.toISOString(),
              phonepe_transaction_id: merchantOrderId,
              phonepe_order_id: orderId
            })
            .eq('id', clientId)

          if (updateError) {
            console.error('Error updating client:', updateError)
          }

          // Create pending payment record in client_payments table
          const { error: paymentError } = await supabase
            .from('client_payments')
            .insert({
              client_id: clientId,
              amount: amount,
              currency: 'INR',
              status: 'pending',
              phonepe_order_id: orderId,
              phonepe_transaction_id: merchantOrderId,
              payment_method: 'phonepe',
              notes: `Payment link generated. Expires: ${expiresAt.toISOString()}`
            })

          if (paymentError) {
            console.error('Error creating payment record:', paymentError)
          }

          return new Response(
            JSON.stringify({
              success: true,
              paymentUrl: paymentUrl,
              transactionId: merchantOrderId,
              orderId: orderId,
              state: result.state,
              expiresAt: expiresAt.toISOString()
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        } else {
          // If there's an error, PhonePe returns error details at root level
          return new Response(
            JSON.stringify({ 
              error: 'Failed to create payment link', 
              details: result,
              message: result.message || result.errorCode || 'Unknown error'
            }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }
      } catch (error) {
        console.error('❌ Error creating payment:', error)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to create payment link', 
            message: error.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    // Handle Payment Callback
    if (path.includes('/callback') && req.method === 'POST') {
      try {
        const body = await req.json()

        // PhonePe v2 sends callback with state at root level
        const { orderId, merchantOrderId, amount, state, code, transactionId } = body

          orderId,
          merchantOrderId,
          amount,
          state,
          code,
          transactionId
        })

        // First, find the client by phonepe_transaction_id
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id, phonepe_transaction_id')
          .eq('phonepe_transaction_id', merchantOrderId)
          .single()

        if (clientError || !client) {
          console.error('❌ Client not found:', clientError)
          return new Response(
            JSON.stringify({ success: false, error: 'Client not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }


        // Update client payment status based on state
        const updateData: any = {
          payment_link_status: state === 'COMPLETED' ? 'completed' : 
                             state === 'FAILED' ? 'failed' : 'pending',
        }

        if (state === 'COMPLETED') {
          updateData.payment_completed_at = new Date().toISOString()

          // Find client and update pending payment record
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('phonepe_transaction_id', merchantOrderId)
            .single()

          if (client) {
            // Update existing pending payment record to completed
            const { error: updatePaymentError } = await supabase
              .from('client_payments')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                notes: `PhonePe payment completed. Transaction ID: ${transactionId || orderId}`
              })
              .eq('client_id', client.id)
              .eq('phonepe_transaction_id', merchantOrderId)
              .eq('status', 'pending')

            if (updatePaymentError) {
              console.error('Error updating payment record:', updatePaymentError)
              // If update fails, create new record
              await supabase
                .from('client_payments')
                .insert({
                  client_id: client.id,
                  amount: amount / 100,
                  currency: 'INR',
                  status: 'completed',
                  phonepe_order_id: orderId,
                  phonepe_transaction_id: transactionId || merchantOrderId,
                  payment_method: 'phonepe',
                  completed_at: new Date().toISOString(),
                  notes: `PhonePe payment completed. Transaction ID: ${transactionId || orderId}`
                })
            }

            // Clear payment link details from client record
            await supabase
              .from('clients')
              .update({
                payment_link_url: null,
                payment_link_id: null,
                payment_link_expires_at: null
              })
              .eq('id', client.id)
          }
        } else if (state === 'FAILED') {
          // Update pending payment to failed
          const { data: client } = await supabase
            .from('clients')
            .select('id')
            .eq('phonepe_transaction_id', merchantOrderId)
            .single()

          if (client) {
            await supabase
              .from('client_payments')
              .update({
                status: 'failed',
                notes: `Payment failed. Code: ${code || 'Unknown'}`
              })
              .eq('client_id', client.id)
              .eq('phonepe_transaction_id', merchantOrderId)
              .eq('status', 'pending')

            // Clear payment link details from client record
            await supabase
              .from('clients')
              .update({
                payment_link_url: null,
                payment_link_id: null,
                payment_link_expires_at: null
              })
              .eq('id', client.id)
          }
        }

        // Update client record
        const { error: updateError } = await supabase
          .from('clients')
          .update(updateData)
          .eq('id', client.id)

        if (updateError) {
          console.error('❌ Error updating client:', updateError)
        } else {
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Callback processed',
            clientId: client.id,
            status: updateData.payment_link_status
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      } catch (error) {
        console.error('❌ Callback error:', error)
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Check Payment Status (using OAuth v2) and update database
    if (path.includes('/status') && req.method === 'GET') {
      const orderId = url.searchParams.get('orderId')
      const merchantOrderId = url.searchParams.get('merchantOrderId')

      if (!orderId || !merchantOrderId) {
        return new Response(
          JSON.stringify({ error: 'Order ID and Merchant Order ID required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      try {
        const accessToken = await getAccessToken()

        // PhonePe status check API endpoint - correct path from Postman collection
        const statusUrl = `${PHONEPE_BASE_URL}/checkout/v2/order/${merchantOrderId}/status`

        const response = await fetch(statusUrl, {
          method: 'GET',
          headers: {
            'Authorization': `O-Bearer ${accessToken}`,
            'Accept': 'application/json'
          }
        })

        const responseText = await response.text()

        let result
        try {
          result = JSON.parse(responseText)
        } catch (e) {
          console.error('Failed to parse response as JSON:', responseText)
          throw new Error(`Invalid response from PhonePe: ${responseText.substring(0, 100)}`)
        }


        // Extract payment status from response
        const state = result.state || result.code
        const transactionId = result.transactionId
        const amount = result.amount

        // Find client by merchantOrderId
        const { data: client, error: clientError } = await supabase
          .from('clients')
          .select('id, payment_link_status')
          .eq('phonepe_transaction_id', merchantOrderId)
          .single()

        if (client && state) {
          
          const updateData: any = {
            payment_link_status: state === 'COMPLETED' ? 'completed' : 
                               state === 'FAILED' ? 'failed' : 'pending',
          }

          if (state === 'COMPLETED' && client.payment_link_status !== 'completed') {
            updateData.payment_completed_at = new Date().toISOString()

            // Update existing pending payment record
            const { error: updatePaymentError } = await supabase
              .from('client_payments')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                notes: `PhonePe payment completed (status check). Transaction ID: ${transactionId || orderId}`
              })
              .eq('client_id', client.id)
              .eq('phonepe_transaction_id', merchantOrderId)
              .eq('status', 'pending')

            if (updatePaymentError) {
              console.error('Error updating payment record:', updatePaymentError)
              // If update fails, create new record
              await supabase
                .from('client_payments')
                .insert({
                  client_id: client.id,
                  amount: amount / 100,
                  currency: 'INR',
                  status: 'completed',
                  phonepe_order_id: orderId,
                  phonepe_transaction_id: transactionId || merchantOrderId,
                  payment_method: 'phonepe',
                  completed_at: new Date().toISOString(),
                  notes: `PhonePe payment completed (status check). Transaction ID: ${transactionId || orderId}`
                })
            }

            // Clear payment link details from client record
            await supabase
              .from('clients')
              .update({
                ...updateData,
                payment_link_url: null,
                payment_link_id: null,
                payment_link_expires_at: null
              })
              .eq('id', client.id)
          } else if (state === 'FAILED') {
            // Update pending payment to failed
            await supabase
              .from('client_payments')
              .update({
                status: 'failed',
                notes: `Payment failed (status check).`
              })
              .eq('client_id', client.id)
              .eq('phonepe_transaction_id', merchantOrderId)
              .eq('status', 'pending')

            // Clear payment link details from client record
            await supabase
              .from('clients')
              .update({
                ...updateData,
                payment_link_url: null,
                payment_link_id: null,
                payment_link_expires_at: null
              })
              .eq('id', client.id)
          } else {
            // Just update client status for pending
            await supabase
              .from('clients')
              .update(updateData)
              .eq('id', client.id)
          }

        }

        return new Response(
          JSON.stringify({
            ...result,
            clientUpdated: !!client,
            newStatus: client ? (state === 'COMPLETED' ? 'completed' : state === 'FAILED' ? 'failed' : 'pending') : null
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      } catch (error) {
        console.error('❌ Status check error:', error)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to check status', 
            message: error.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
