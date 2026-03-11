import { useState, useEffect } from 'react'
import { X, Link as LinkIcon, Send, Loader2, CheckCircle, Copy, Mail, Search } from 'lucide-react'
import supabase from '../../src/supabase/supabse'

/**
 * Modal to generate PhonePe payment link for client
 */
const GeneratePaymentLinkModal = ({ isOpen = true, onClose, client, onSuccess }) => {
  const [generating, setGenerating] = useState(false)
  const [paymentLink, setPaymentLink] = useState(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [copied, setCopied] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [clients, setClients] = useState([])
  const [amount, setAmount] = useState('')
  const [loadingClients, setLoadingClients] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch clients if no client provided (manual mode)
  useEffect(() => {
    if (!client) {
      fetchClients()
    }
  }, [client])

  const fetchClients = async () => {
    setLoadingClients(true)
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, total_fee, fee_amount')
        .order('first_name', { ascending: true })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoadingClients(false)
    }
  }

  if (!isOpen) return null

  const activeClient = client || selectedClient
  const filteredClients = clients.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleGenerateLink = async () => {
    if (!activeClient) {
      alert('Please select a client')
      return
    }

    const paymentAmount = amount || activeClient.total_fee || activeClient.fee_amount || 0
    if (!paymentAmount || paymentAmount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    setGenerating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/phonepe-payment/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_ANON_KEY}`,
          },
          body: JSON.stringify({
            clientId: activeClient.id,
            amount: parseFloat(paymentAmount),
            clientName: `${activeClient.first_name} ${activeClient.last_name}`,
            clientEmail: activeClient.email,
            clientPhone: activeClient.phone
          })
        }
      )

      const result = await response.json()

      if (result.success) {
        setPaymentLink(result)
        if (onSuccess) onSuccess(result)
      } else {
        alert('Failed to generate payment link: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error generating payment link:', error)
      alert('Failed to generate payment link: ' + error.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleCopyLink = () => {
    if (paymentLink?.paymentUrl) {
      navigator.clipboard.writeText(paymentLink.paymentUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSendEmail = async () => {
    setSendingEmail(true)
    try {
      // Import email service
      const { sendEmail } = await import('../../src/utils/emailService')
      
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #336b6e 0%, #2a5557 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .amount { font-size: 32px; font-weight: bold; color: #336b6e; text-align: center; margin: 20px 0; }
            .button { display: inline-block; background: #336b6e; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>💳 Payment Request</h1>
              <p>Complete your payment for YogaPatha</p>
            </div>
            <div class="content">
              <p>Hi ${client.first_name},</p>
              
              <p>We've generated a secure payment link for your yoga training fee.</p>
              
              <div class="amount">₹${(client.total_fee || client.fee_amount || 0).toLocaleString('en-IN')}</div>
              
              <p style="text-align: center;">
                <a href="${paymentLink.paymentUrl}" class="button">
                  Pay Now with PhonePe
                </a>
              </p>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>⏰ Link expires in 24 hours</strong><br>
                  Please complete your payment before ${new Date(paymentLink.expiresAt).toLocaleString('en-IN')}
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                <strong>Payment Methods Accepted:</strong><br>
                UPI, Credit/Debit Cards, Net Banking, Wallets
              </p>
              
              <p style="color: #666; font-size: 14px;">
                If you have any questions, please contact us at support@yogapatha.com
              </p>
            </div>
            <div class="footer">
              <p>This is a secure payment link from YogaPatha.</p>
              <p>© ${new Date().getFullYear()} YogaPatha. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `

      await sendEmail(
        client.email,
        'Payment Link - YogaPatha',
        emailHtml
      )

      alert('Payment link sent to client via email!')
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Failed to send email: ' + error.message)
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <LinkIcon className="w-6 h-6" />
              Generate Payment Link
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Client Selection (if no client provided) */}
          {!client && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Client
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                  />
                </div>
                <select
                  value={selectedClient?.id || ''}
                  onChange={(e) => {
                    const client = clients.find(c => c.id === e.target.value)
                    setSelectedClient(client)
                    setAmount(client?.total_fee || client?.fee_amount || '')
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                  disabled={loadingClients}
                >
                  <option value="">Select a client...</option>
                  {filteredClients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.first_name} {c.last_name} - {c.email}
                    </option>
                  ))}
                </select>
              </div>

              {selectedClient && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-[#336b6e] mb-2">Selected Client</h3>
                  <p className="text-lg font-bold">{selectedClient.first_name} {selectedClient.last_name}</p>
                  <p className="text-sm text-gray-600">{selectedClient.email}</p>
                  <p className="text-sm text-gray-600">{selectedClient.phone}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount (₹)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
                  min="1"
                  step="0.01"
                />
              </div>
            </div>
          )}

          {/* Client Info (if client provided) */}
          {client && (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-[#336b6e] mb-2">Client Details</h3>
                <p className="text-lg font-bold">{client.first_name} {client.last_name}</p>
                <p className="text-sm text-gray-600">{client.email}</p>
                <p className="text-sm text-gray-600">{client.phone}</p>
              </div>

              {/* Amount */}
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Payment Amount</p>
                <p className="text-3xl font-bold text-[#336b6e]">
                  ₹{(client.total_fee || client.fee_amount || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </>
          )}

          {!paymentLink ? (
            /* Generate Button */
            <button
              onClick={handleGenerateLink}
              disabled={generating}
              className="w-full bg-[#336b6e] text-white px-6 py-4 rounded-lg font-semibold hover:bg-[#2a5557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Payment Link...
                </>
              ) : (
                <>
                  <LinkIcon className="w-5 h-5" />
                  Generate PhonePe Payment Link
                </>
              )}
            </button>
          ) : (
            /* Payment Link Generated */
            <div className="space-y-4">
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Payment Link Generated!</span>
                </div>
                <p className="text-sm text-gray-600">
                  Expires: {new Date(paymentLink.expiresAt).toLocaleString('en-IN')}
                </p>
              </div>

              {/* Payment URL */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Payment URL:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={paymentLink.paymentUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Send Email Button */}
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sendingEmail ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Email...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Send Link via Email
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default GeneratePaymentLinkModal
