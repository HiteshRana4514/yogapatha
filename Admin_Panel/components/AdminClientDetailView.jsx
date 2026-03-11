import React, { useState, useEffect } from 'react'
import {
  ArrowLeft,
  User,
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  UserCog,
  Search,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Link as LinkIcon,
  DollarSign,
  Copy,
  Send,
  ExternalLink
} from 'lucide-react'
import supabase from '../../src/supabase/supabse'
import { useParams, useNavigate } from 'react-router-dom'
import GeneratePaymentLinkModal from './GeneratePaymentLinkModal'
import { sendClientAssignmentNotification } from '../../src/utils/emailService'

function AdminClientDetailView() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [assignedTrainer, setAssignedTrainer] = useState(null)

  // Trainer assignment
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [trainers, setTrainers] = useState([])
  const [filteredTrainers, setFilteredTrainers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTrainer, setSelectedTrainer] = useState(null)
  const [isAssigning, setIsAssigning] = useState(false)
  const [feeData, setFeeData] = useState({
    total_fee: '',
    platform_fee_percentage: '',
    trainer_income: '',
    fee_frequency: 'monthly'
  })
  const [showConvertModal, setShowConvertModal] = useState(false)

  // Payment link state
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)

  useEffect(() => {
    fetchClientDetails()
    fetchTrainers()
    fetchPaymentHistory()
  }, [clientId])

  useEffect(() => {
    filterTrainers()
  }, [searchTerm, trainers])

  const fetchClientDetails = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (error) throw error
      setClient(data)
      setNewStatus(data.status || 'pending')

      // Fetch assigned trainer details if trainer_id exists
      if (data.trainer_id) {
        await fetchAssignedTrainer(data.trainer_id)
      } else {
        setAssignedTrainer(null)
      }
    } catch (error) {
      console.error('Error fetching client:', error)
      alert('Failed to fetch client details: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAssignedTrainer = async (trainerId) => {
    try {
      // Fetch trainer profile
      const { data: trainerProfile, error: profileError } = await supabase
        .from('trainer_profiles')
        .select('id, user_id')
        .eq('id', trainerId)
        .single()

      if (profileError) throw profileError

      // Fetch user details from edge function
      const response = await fetch(`${import.meta.env.VITE_PROJECT_URL}/functions/v1/get-all-users`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_ANON_KEY}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch users')
      const users = await response.json()

      const user = users.find(u => u.id === trainerProfile.user_id)
      if (user) {
        const metadata = user.user_metadata || {}
        setAssignedTrainer({
          id: trainerProfile.id,
          first_name: metadata.firstName || metadata.first_name || 'N/A',
          last_name: metadata.lastName || metadata.last_name || 'N/A',
          email: user.email || 'N/A',
          phone: metadata.phone || 'N/A',
          city: metadata.city || 'N/A',
          state: metadata.state || 'N/A'
        })
      }
    } catch (error) {
      console.error('Error fetching assigned trainer:', error)
      setAssignedTrainer(null)
    }
  }

  const fetchTrainers = async () => {
    try {
      // Fetch all users with trainer role from Edge Function
      const response = await fetch(`${import.meta.env.VITE_PROJECT_URL}/functions/v1/get-all-users`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_ANON_KEY}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch users')
      const users = await response.json()

      // Filter only trainers
      const trainerUsers = users.filter(user => user.user_metadata?.role === 'trainer')

      // Fetch trainer profiles
      const { data: trainerProfiles, error } = await supabase
        .from('trainer_profiles')
        .select('*')
        .in('user_id', trainerUsers.map(u => u.id))

      if (error) throw error

      // Merge user data with trainer profiles
      const mergedTrainers = trainerUsers.map(user => {
        const profile = trainerProfiles?.find(p => p.user_id === user.id)
        const metadata = user.user_metadata || {}

        return {
          id: profile?.id || user.id,
          user_id: user.id,
          first_name: metadata.firstName || metadata.first_name || 'N/A',
          last_name: metadata.lastName || metadata.last_name || 'N/A',
          email: user.email || 'N/A',
          phone: metadata.phone || 'N/A',
          city: metadata.city || 'N/A',
          state: metadata.state || 'N/A',
          experience: metadata.experience || 'N/A',
          kyc_status: profile?.kyc_status || 'pending',
          is_active: profile?.is_active !== undefined ? profile.is_active : true,
          has_trainer_profile: !!profile
        }
      })

      setTrainers(mergedTrainers.filter(t => t.is_active && t.kyc_status === 'approved'))
    } catch (error) {
      console.error('Error fetching trainers:', error)
    }
  }

  const fetchPaymentHistory = async () => {
    setLoadingPayments(true)
    try {
      // Fetch PhonePe payments from client_payments table (NOT payment_transactions)
      const { data, error } = await supabase
        .from('client_payments')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // If there's a current payment link that's pending, add it to history
      if (client?.payment_link_url && client?.payment_link_status !== 'completed') {
        const currentPayment = {
          id: 'current',
          amount: client.total_fee || client.fee_amount || 0,
          status: client.payment_link_status || 'pending',
          created_at: client.payment_link_created_at,
          completed_at: null,
          payment_method: 'phonepe',
          phonepe_order_id: client.phonepe_order_id,
          phonepe_transaction_id: client.phonepe_transaction_id,
          notes: `Payment link expires: ${new Date(client.payment_link_expires_at).toLocaleString('en-IN')}`
        }
        setPaymentHistory([currentPayment, ...(data || [])])
      } else {
        setPaymentHistory(data || [])
      }
    } catch (error) {
      console.error('Error fetching payment history:', error)
    } finally {
      setLoadingPayments(false)
    }
  }

  const handlePaymentLinkGenerated = async (result) => {
    // Refresh client data to show updated payment link status
    await fetchClientDetails()
  }

  const handleCopyPaymentLink = () => {
    if (client?.payment_link_url) {
      navigator.clipboard.writeText(client.payment_link_url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  const handleCheckPaymentStatus = async () => {
    if (!client?.phonepe_order_id || !client?.phonepe_transaction_id) {
      alert('No payment link found to check status')
      return
    }

    setCheckingStatus(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/phonepe-payment/status?orderId=${client.phonepe_order_id}&merchantOrderId=${client.phonepe_transaction_id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_ANON_KEY}`,
          }
        }
      )

      const result = await response.json()

      if (result.clientUpdated) {
        alert(`Payment status updated to: ${result.newStatus}`)
        // Refresh client details and payment history
        await fetchClientDetails()
        await fetchPaymentHistory()
      } else {
        alert('Payment status checked. Current status: ' + (result.state || result.code || 'Unknown'))
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
      alert('Failed to check payment status: ' + error.message)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleSendPaymentEmail = async () => {
    if (!client?.payment_link_url || !client?.email) {
      alert('Payment link or client email not available')
      return
    }

    setSendingEmail(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
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
            .info-box { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }
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
                <a href="${client.payment_link_url}" class="button">
                  Pay Now with PhonePe
                </a>
              </p>
              
              <div class="info-box">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>⏰ Link expires at:</strong><br>
                  ${new Date(client.payment_link_expires_at).toLocaleString('en-IN')}
                </p>
              </div>
              
              <p style="color: #666; font-size: 14px;">
                <strong>Payment Methods Accepted:</strong><br>
                UPI, Credit/Debit Cards, Net Banking, Wallets
              </p>
              
              <p style="color: #666; font-size: 14px;">
                <strong>Payment Status:</strong> ${client.payment_link_status}<br>
                <strong>Transaction ID:</strong> ${client.phonepe_transaction_id}
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

      const SUPABASE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quick-function`
      
      const response = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_ANON_KEY}`,
        },
        body: JSON.stringify({
          to: client.email,
          subject: 'Payment Link - YogaPatha',
          html: emailHtml,
          text: '',
          attachments: []
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email')
      }

      alert('Payment link sent to client via email!')
    } catch (error) {
      console.error('Error sending email:', error)
      alert('Failed to send email: ' + error.message)
    } finally {
      setSendingEmail(false)
    }
  }

  const filterTrainers = () => {
    let result = [...trainers]

    if (searchTerm) {
      result = result.filter(trainer =>
        trainer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.city?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTrainers(result)
  }

  const handleStatusUpdate = async () => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', clientId)

      if (error) throw error
      setClient({ ...client, status: newStatus })
      setIsEditingStatus(false)
      alert('Status updated successfully!')
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update status: ' + error.message)
    }
  }

  const handleAssignTrainer = async () => {
    if (!selectedTrainer) {
      alert('Please select a trainer')
      return
    }

    setIsAssigning(true)
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          trainer_id: selectedTrainer.id,
          status: 'accepted'
        })
        .eq('id', clientId)

      if (error) throw error

      alert('Trainer assigned successfully!')
      
      // Send email notification to trainer about new client assignment
      if (selectedTrainer?.email) {
        try {
          const emailResult = await sendClientAssignmentNotification(selectedTrainer.email, {
            clientName: `${client.first_name} ${client.last_name}`,
            clientEmail: client.email,
            clientPhone: client.phone,
            classType: client.class_type,
            assignedDate: new Date().toISOString()
          })
        } catch (emailError) {
          console.error('❌ Failed to send assignment notification email:', emailError)
          // Don't throw - assignment was successful
        }
      } else {
      }
      
      setShowAssignModal(false)
      setSelectedTrainer(null)
      setSearchTerm('')
      fetchClientDetails()
    } catch (error) {
      console.error('Error assigning trainer:', error)
      alert('Failed to assign trainer: ' + error.message)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveTrainer = async () => {
    if (!confirm('Are you sure you want to remove the assigned trainer?')) return

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          trainer_id: null,
          status: 'pending'
        })
        .eq('id', clientId)

      if (error) throw error

      alert('Trainer removed successfully!')
      fetchClientDetails()
    } catch (error) {
      console.error('Error removing trainer:', error)
      alert('Failed to remove trainer: ' + error.message)
    }
  }

  const handleFeeChange = (field, value) => {
    const updatedFeeData = { ...feeData, [field]: value }

    if (field === 'total_fee' || field === 'platform_fee_percentage') {
      const totalFee = parseFloat(field === 'total_fee' ? value : updatedFeeData.total_fee) || 0
      const platformFee = parseFloat(field === 'platform_fee_percentage' ? value : updatedFeeData.platform_fee_percentage) || 0

      if (totalFee > 0 && platformFee >= 0) {
        const trainerIncome = totalFee - (totalFee * platformFee / 100)
        updatedFeeData.trainer_income = trainerIncome.toFixed(2)
      } else {
        updatedFeeData.trainer_income = ''
      }
    }

    setFeeData(updatedFeeData)
  }

  const handleConvertToPermanent = async () => {
    // Validate fee data
    if (!feeData.total_fee || !feeData.platform_fee_percentage) {
      alert('Please enter total fee and platform fee percentage before converting to permanent')
      return
    }

    if (parseFloat(feeData.platform_fee_percentage) < 0 || parseFloat(feeData.platform_fee_percentage) > 100) {
      alert('Platform fee percentage must be between 0 and 100')
      return
    }

    try {
      const { error } = await supabase
        .from('clients')
        .update({
          class_type: 'permanent',
          total_fee: parseFloat(feeData.total_fee),
          platform_fee_percentage: parseFloat(feeData.platform_fee_percentage),
          fee_frequency: feeData.fee_frequency
          // trainer_income will be auto-calculated by database trigger
        })
        .eq('id', clientId)

      if (error) throw error

      alert('Client converted to permanent successfully!')
      setShowConvertModal(false)
      setFeeData({
        total_fee: '',
        platform_fee_percentage: '',
        trainer_income: '',
        fee_frequency: 'monthly'
      })
      fetchClientDetails()
    } catch (error) {
      console.error('Error converting client:', error)
      alert('Failed to convert client: ' + error.message)
    }
  }

  const getStatusBadge = (status) => {
    const config = {
      accepted: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Accepted' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pending' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Rejected' }
    }
    const { bg, text, icon: Icon, label } = config[status] || config.pending
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    )
  }

  const getClassTypeBadge = (type) => {
    if (type === 'demo') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
          <Calendar className="w-3 h-3" />
          Demo Class
        </span>
      )
    }
    if (type === 'permanent') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          Permanent
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
        Not Assigned
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-[#fdfcf3] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#336b6e] font-medium">Loading client details...</p>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="p-6 bg-[#fdfcf3] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#336b6e] mb-2">Client Not Found</h2>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 bg-[#fdfcf3] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#336b6e] hover:text-[#2a5557] font-semibold mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Clients
          </button>
          <h1 className="text-2xl md:text-3xl font-bold text-[#336b6e]">Client Details</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - Client Information */}
          <div className="xl:col-span-2 space-y-4 md:space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
              <h2 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">First Name</label>
                  <p className="font-semibold text-[#336b6e]">{client.first_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Last Name</label>
                  <p className="font-semibold text-[#336b6e]">{client.last_name}</p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Contact Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Email</label>
                  <a href={`mailto:${client.email}`} className="font-semibold text-[#bb9f58] hover:underline">
                    {client.email}
                  </a>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Phone</label>
                  <a href={`tel:${client.phone}`} className="font-semibold text-[#bb9f58] hover:underline">
                    {client.phone || 'N/A'}
                  </a>
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600 mb-1 block">Street</label>
                  <p className="font-semibold text-[#336b6e]">{client.street || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">City</label>
                  <p className="font-semibold text-[#336b6e]">{client.city || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">State</label>
                  <p className="font-semibold text-[#336b6e]">{client.state || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Pincode</label>
                  <p className="font-semibold text-[#336b6e]">{client.pincode || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Country</label>
                  <p className="font-semibold text-[#336b6e]">{client.country || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Link & Status */}
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <h2 className="text-lg md:text-xl font-bold text-[#336b6e] flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Payment Link & Status
              </h2>
              <button
                onClick={() => setShowPaymentLinkModal(true)}
                className="w-full sm:w-auto px-3 py-2 bg-[#336b6e] text-white text-sm rounded-lg hover:bg-[#2a5557] transition-colors flex items-center justify-center gap-1"
              >
                <LinkIcon className="w-4 h-4" />
                Generate New Link
              </button>
            </div>

            {client?.payment_link_url ? (
              <div className="space-y-4">
                {/* Payment Status Badge */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 md:p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-xs md:text-sm text-gray-600 mb-1">Payment Status</p>
                    <span className={`inline-block px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold ${
                      client.payment_link_status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : client.payment_link_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : client.payment_link_status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                    }`}>
                      {client.payment_link_status?.charAt(0).toUpperCase() + client.payment_link_status?.slice(1)}
                    </span>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs md:text-sm text-gray-600 mb-1">Amount</p>
                    <p className="text-xl md:text-2xl font-bold text-[#336b6e]">
                      ₹{(client.total_fee || client.fee_amount || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Payment Link Details */}
                <div className="border border-gray-200 rounded-lg p-3 md:p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Payment URL</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={client.payment_link_url}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-xs md:text-sm overflow-hidden text-ellipsis"
                      />
                      <button
                        onClick={handleCopyPaymentLink}
                        className="px-3 md:px-4 py-2 bg-[#336b6e] text-white rounded hover:bg-[#2a5557] transition-colors flex items-center justify-center gap-2 whitespace-nowrap text-sm"
                        title="Copy link"
                      >
                        {copiedLink ? (
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

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Created</p>
                      <p className="font-medium text-gray-800 text-xs">
                        {new Date(client.payment_link_created_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Expires</p>
                      <p className="font-medium text-gray-800 text-xs">
                        {new Date(client.payment_link_expires_at).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-600 mb-1">Transaction ID</p>
                      <p className="font-mono text-xs text-gray-700 break-all">
                        {client.phonepe_transaction_id}
                      </p>
                    </div>
                    {client.phonepe_order_id && (
                      <div className="col-span-2">
                        <p className="text-xs text-gray-600 mb-1">PhonePe Order ID</p>
                        <p className="font-mono text-xs text-gray-700 break-all">
                          {client.phonepe_order_id}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => window.open(client.payment_link_url, '_blank')}
                    className="px-3 py-2.5 bg-white border border-[#336b6e] text-[#336b6e] rounded hover:bg-[#336b6e] hover:text-white transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">Open Link</span>
                    <span className="sm:hidden">Open</span>
                  </button>
                  <button
                    onClick={handleCheckPaymentStatus}
                    disabled={checkingStatus}
                    className="px-3 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <RefreshCw className={`w-4 h-4 ${checkingStatus ? 'animate-spin' : ''}`} />
                    {checkingStatus ? 'Checking...' : 'Refresh Status'}
                  </button>
                  <button
                    onClick={handleSendPaymentEmail}
                    disabled={client.payment_link_status === 'completed' || sendingEmail}
                    className="px-3 py-2.5 bg-[#336b6e] text-white rounded hover:bg-[#2a5557] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    <Send className="w-4 h-4" />
                    {sendingEmail ? 'Sending...' : 'Send Email'}
                  </button>
                </div>

                {/* Payment Completed Info */}
                {client.payment_completed_at && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>✅ Payment Completed:</strong> {new Date(client.payment_completed_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 bg-gray-50 rounded-lg text-center">
                <LinkIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="font-medium text-gray-700 mb-2">No Payment Link Generated</p>
                <p className="text-sm text-gray-500 mb-4">
                  Generate a PhonePe payment link to collect fees from this client
                </p>
                <button
                  onClick={() => setShowPaymentLinkModal(true)}
                  className="px-6 py-2 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors"
                >
                  Generate Payment Link
                </button>
              </div>
            )}

            {/* PhonePe Payment History */}
            {paymentHistory.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  PhonePe Payment History
                </h3>
                <div className="space-y-3">
                  {paymentHistory.map((payment) => {
                    const amount = payment.amount || 0;
                    return (
                      <div key={payment.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#336b6e] transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-base md:text-lg text-[#336b6e]">
                              ₹{amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </p>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              payment.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : payment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                            }`}>
                              {payment.status.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-left sm:text-right">
                            <p className="text-xs text-gray-500">
                              {new Date(payment.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(payment.created_at).toLocaleTimeString('en-IN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                        {(payment.phonepe_order_id || payment.phonepe_transaction_id) && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-600 font-medium mb-1">Transaction ID:</p>
                            <p className="font-mono text-xs bg-white px-2 py-1 rounded break-all text-gray-700 leading-relaxed">
                              {payment.phonepe_order_id || payment.phonepe_transaction_id}
                            </p>
                          </div>
                        )}
                        {payment.notes && (
                          <p className="text-xs text-gray-500 mt-2 italic leading-relaxed">
                            {payment.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
            <h2 className="text-xl font-bold text-[#336b6e] mb-6">Client Status</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-2 block">Class Type</label>
                {getClassTypeBadge(client.class_type)}
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-2 block">Current Status</label>
                {isEditingStatus ? (
                  <div className="space-y-2">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58]"
                    >
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleStatusUpdate}
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingStatus(false)
                          setNewStatus(client.status)
                        }}
                        className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    {getStatusBadge(client.status)}
                    <button
                      onClick={() => setIsEditingStatus(true)}
                      className="text-sm text-[#bb9f58] hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600 mb-1 block">Created At</label>
                <p className="text-sm font-semibold text-[#336b6e]">
                  {new Date(client.created_at).toLocaleString()}
                </p>
              </div>

              {/* Assigned Trainer Info */}
              {assignedTrainer && (
                <div className="pt-4 border-t border-gray-200">
                  <label className="text-sm text-gray-600 mb-2 block">Assigned Trainer</label>
                  <div className="bg-[#fdfcf3] rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center">
                        <UserCog className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-[#336b6e]">
                          {assignedTrainer.first_name} {assignedTrainer.last_name}
                        </p>
                        <p className="text-xs text-gray-500">{assignedTrainer.email}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{assignedTrainer.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{assignedTrainer.city}, {assignedTrainer.state}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              {client.class_type === 'demo' && (
                <button
                  onClick={() => setShowConvertModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <TrendingUp className="w-5 h-5" />
                  Convert to Permanent
                </button>
              )}

              {client.trainer_id ? (
                <>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#bb9f58] text-white rounded-lg hover:bg-[#a08a4a] transition-colors"
                  >
                    <UserCog className="w-5 h-5" />
                    Change Trainer
                  </button>
                  <button
                    onClick={() => setShowPaymentLinkModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors"
                  >
                    <LinkIcon className="w-5 h-5" />
                    Generate Payment Link
                  </button>
                  <button
                    onClick={handleRemoveTrainer}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Remove Trainer
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors"
                >
                  <UserCog className="w-5 h-5" />
                  Assign Trainer
                </button>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Assign Trainer Modal */}
      {
        showAssignModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 text-white flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Assign Trainer</h2>
                  <p className="text-sm opacity-90 mt-1">Select a trainer for this client</p>
                </div>
                <button
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedTrainer(null)
                    setSearchTerm('')
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6">
                {/* Search */}
                <div className="mb-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search trainers by name, email, or city..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#bb9f58] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Trainers List */}
                {filteredTrainers.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 font-medium text-lg">No trainers found</p>
                    <p className="text-gray-400 text-sm mt-1">Try adjusting your search</p>
                  </div>
                ) : (
                  <div className="border-2 border-gray-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Trainer</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Location</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Experience</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredTrainers.map((trainer) => (
                          <tr
                            key={trainer.id}
                            className={`hover:bg-[#fdfcf3] transition-colors ${selectedTrainer?.id === trainer.id ? 'bg-blue-50' : ''
                              }`}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <p className="font-semibold text-[#336b6e] text-sm">
                                    {trainer.first_name} {trainer.last_name}
                                  </p>
                                  <p className="text-xs text-gray-500">{trainer.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-gray-700">{trainer.city}, {trainer.state}</p>
                            </td>
                            <td className="py-3 px-4">
                              <p className="text-sm text-gray-700">{trainer.experience}</p>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => setSelectedTrainer(trainer)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTrainer?.id === trainer.id
                                  ? 'bg-[#336b6e] text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                              >
                                {selectedTrainer?.id === trainer.id ? 'Selected' : 'Select'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Footer */}
                <div className="mt-6 flex gap-3">
                  <button
                    onClick={() => {
                      setShowAssignModal(false)
                      setSelectedTrainer(null)
                      setSearchTerm('')
                    }}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignTrainer}
                    disabled={!selectedTrainer || isAssigning}
                    className="flex-1 px-6 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isAssigning ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      'Assign Trainer'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Convert to Permanent Modal */}
      {
        showConvertModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full my-8">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white rounded-t-2xl">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-6 h-6" />
                  Convert to Permanent
                </h2>
              </div>

              <div className="p-6">
                <div className="mb-6">
                  <p className="text-gray-700 mb-4">
                    Converting <strong>{client.first_name} {client.last_name}</strong> from demo to permanent client.
                  </p>

                  {/* Fee Management Section */}
                  <div className="mb-4 p-4 bg-gradient-to-br from-[#fdfcf3] to-white rounded-lg border-2 border-[#bb9f58]/30">
                    <h5 className="text-sm font-bold text-[#336b6e] mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-[#bb9f58] rounded-full flex items-center justify-center text-white text-xs">₹</span>
                      Fee Details (Required)
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Total Fee */}
                      <div>
                        <label className="text-xs text-gray-600 font-medium mb-1 block">
                          Total Fee (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={feeData.total_fee}
                          onChange={(e) => handleFeeChange('total_fee', e.target.value)}
                          placeholder="e.g., 5000"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#bb9f58] focus:outline-none text-sm"
                        />
                      </div>

                      {/* Platform Fee Percentage */}
                      <div>
                        <label className="text-xs text-gray-600 font-medium mb-1 block">
                          Platform Fee (%) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={feeData.platform_fee_percentage}
                          onChange={(e) => handleFeeChange('platform_fee_percentage', e.target.value)}
                          placeholder="e.g., 20"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#bb9f58] focus:outline-none text-sm"
                        />
                      </div>

                      {/* Fee Frequency */}
                      <div>
                        <label className="text-xs text-gray-600 font-medium mb-1 block">
                          Payment Frequency
                        </label>
                        <select
                          value={feeData.fee_frequency}
                          onChange={(e) => handleFeeChange('fee_frequency', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#bb9f58] focus:outline-none text-sm appearance-none bg-white"
                        >
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="yearly">Yearly</option>
                          <option value="one_time">One Time</option>
                        </select>
                      </div>

                      {/* Trainer Income (Auto-calculated) */}
                      <div>
                        <label className="text-xs text-gray-600 font-medium mb-1 block">
                          Trainer Income (₹)
                        </label>
                        <div className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-700 font-bold text-sm">
                          {feeData.trainer_income ? `₹${parseFloat(feeData.trainer_income).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '₹0.00'}
                        </div>
                      </div>
                    </div>

                    {/* Fee Breakdown */}
                    {feeData.total_fee && feeData.platform_fee_percentage && (
                      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-600">Total: ₹{parseFloat(feeData.total_fee).toLocaleString('en-IN')}</span>
                          <span className="text-blue-600">Platform ({feeData.platform_fee_percentage}%): ₹{(parseFloat(feeData.total_fee) * parseFloat(feeData.platform_fee_percentage) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          <span className="text-green-700 font-bold">Trainer: ₹{parseFloat(feeData.trainer_income).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Note:</strong> This action will:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-green-700 ml-4">
                      <li>• Change assignment type to permanent</li>
                      <li>• Create an ongoing training relationship</li>
                      <li>• Set up fee structure for the trainer</li>
                      <li>• Track conversion date for records</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowConvertModal(false)
                      setFeeData({
                        total_fee: '',
                        platform_fee_percentage: '',
                        trainer_income: '',
                        fee_frequency: 'monthly'
                      })
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConvertToPermanent}
                    disabled={!feeData.total_fee || !feeData.platform_fee_percentage}
                    className="flex-1 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Convert Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Generate Payment Link Modal */}
      {
        showPaymentLinkModal && client && (
          <GeneratePaymentLinkModal
            isOpen={showPaymentLinkModal}
            onClose={() => setShowPaymentLinkModal(false)}
            client={client}
            onSuccess={handlePaymentLinkGenerated}
          />
        )
      }
    </div>
  )
}

export default AdminClientDetailView

