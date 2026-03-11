import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Edit,
  Save,
  X as XIcon,
  DollarSign,
  TrendingUp,
  Percent,
  RefreshCw,
  Receipt,
  Download,
  Eye,
  FileText
} from 'lucide-react'
import supabase from '../../supabase/supabse'
import { useParams, useNavigate } from 'react-router-dom'
import { jsPDF } from 'jspdf'

function ClientDetail() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isEditingStatus, setIsEditingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [paymentHistory, setPaymentHistory] = useState([])
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showProofModal, setShowProofModal] = useState(false)
  const [invoiceSettings, setInvoiceSettings] = useState(null)

  // Fetch client details
  useEffect(() => {
    const fetchClientDetails = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single()

        if (clientError) {
          console.error('Error fetching client:', clientError)
          setErrorMessage('Failed to load client details')
          setIsLoading(false)
          return
        }

        if (!clientData) {
          setErrorMessage('Client not found')
          setIsLoading(false)
          return
        }

        setClient(clientData)
        setNewStatus(clientData.status || 'pending')
        
        // Fetch payment history for permanent clients
        if (clientData.class_type === 'permanent') {
          fetchPaymentHistory(clientData.id)
        }
        
        // Fetch invoice settings
        fetchInvoiceSettings()
      } catch (err) {
        console.error('Unexpected error:', err)
        setErrorMessage('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchClientDetails()
  }, [clientId])

  // Fetch invoice settings
  const fetchInvoiceSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('invoice_settings')
        .select('*')
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        setInvoiceSettings(data)
      }
    } catch (error) {
      console.error('Error fetching invoice settings:', error)
    }
  }

  // Fetch payment history for this client
  const fetchPaymentHistory = async (clientId) => {
    setLoadingPayments(true)
    try {
      // Get current trainer's profile
      const { data: { user } } = await supabase.auth.getUser()
      
      const { data: trainerProfile } = await supabase
        .from('trainer_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!trainerProfile) {
        setLoadingPayments(false)
        return
      }

      // Fetch payments for this client and trainer
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('client_id', clientId)
        .eq('trainer_id', trainerProfile.id)
        .order('payment_date', { ascending: false })

      if (error) throw error
      setPaymentHistory(data || [])
    } catch (error) {
      console.error('Error fetching payment history:', error)
    } finally {
      setLoadingPayments(false)
    }
  }

  // Update client status
  const handleStatusUpdate = async () => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', clientId)

      if (error) {
        console.error('Error updating status:', error)
        setErrorMessage('Failed to update status')
        return
      }

      setClient({ ...client, status: newStatus })
      setIsEditingStatus(false)
    } catch (err) {
      console.error('Unexpected error updating status:', err)
      setErrorMessage('An unexpected error occurred')
    }
  }

  // Status badge component
  const getStatusBadge = (status) => {
    const statusConfig = {
      accepted: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: CheckCircle,
        label: 'Accepted'
      },
      rejected: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: XCircle,
        label: 'Rejected'
      },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        icon: Clock,
        label: 'Pending'
      }
    }

    const config = statusConfig[status] || statusConfig.pending
    const IconComponent = config.icon

    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        <IconComponent className="w-5 h-5" />
        {config.label}
      </span>
    )
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Generate and download invoice PDF
  const downloadInvoice = async (payment) => {
    const amountReceived = payment.trainer_amount || payment.amount || 0
    const doc = new jsPDF('p', 'mm', 'a4')
    
    // Page dimensions
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 15
    const contentWidth = pageWidth - (2 * margin)
    
    // Get settings or use defaults
    const companyName = invoiceSettings?.company_name || 'YogaPatha'
    const companyTagline = invoiceSettings?.company_tagline || 'Professional Yoga Training Platform'
    const companyEmail = invoiceSettings?.email || 'support@yogapatha.com'
    const companyPhone = invoiceSettings?.phone || '+91 XXX XXX XXXX'
    const companyAddress = invoiceSettings?.address || 'Your Company Address Here'
    const companyWebsite = invoiceSettings?.website || 'www.yogapatha.com'
    const invoicePrefix = invoiceSettings?.invoice_prefix || 'YP'
    const footerText = invoiceSettings?.footer_text || 'Thank you for being part of YogaPatha!'
    const termsText = invoiceSettings?.terms_text || 'This is a computer-generated invoice and does not require a signature.'
    
    // Parse colors from settings
    const parsePrimaryColor = () => {
      if (invoiceSettings?.primary_color) {
        const rgb = invoiceSettings.primary_color.split(',').map(v => parseInt(v.trim()))
        if (rgb.length === 3) return rgb
      }
      return [51, 107, 110]
    }
    
    // Colors
    const primaryColor = parsePrimaryColor()
    const greenColor = [5, 150, 105]
    const redColor = [220, 38, 38]
    const grayColor = [102, 102, 102]
    
    let yPos = 0
    
    // Header - Company Logo and Info
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, pageWidth, 40, 'F')
    
    // Add logo if available
    if (invoiceSettings?.company_logo_url) {
      try {
        // Create a temporary image to load the logo
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = invoiceSettings.company_logo_url
        
        // Wait for image to load
        await new Promise((resolve, reject) => {
          img.onload = () => {
            try {
              doc.addImage(img, 'PNG', margin, 8, 25, 25)
              resolve()
            } catch (err) {
              console.error('Error adding image to PDF:', err)
              resolve() // Continue even if image fails
            }
          }
          img.onerror = () => {
            console.error('Failed to load logo image')
            resolve() // Continue even if image fails
          }
          // Timeout after 3 seconds
          setTimeout(() => resolve(), 3000)
        })
      } catch (error) {
        console.error('Error loading logo:', error)
      }
    }
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(26)
    doc.setFont('helvetica', 'bold')
    doc.text(companyName, pageWidth / 2, 15, { align: 'center' })
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(companyTagline, pageWidth / 2, 22, { align: 'center' })
    doc.text(`Email: ${companyEmail} | Phone: ${companyPhone}`, pageWidth / 2, 28, { align: 'center' })
    doc.text(companyAddress, pageWidth / 2, 34, { align: 'center' })
    
    yPos = 50
    
    // Invoice Title
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('PAYMENT INVOICE', pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 12
    
    // Invoice Details Section
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    
    const addRow = (label, value, isBold = false) => {
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
      doc.text(label, margin, yPos)
      
      doc.setFont('helvetica', isBold ? 'bold' : 'normal')
      doc.setTextColor(0, 0, 0)
      const valueText = String(value)
      doc.text(valueText, pageWidth - margin, yPos, { align: 'right', maxWidth: contentWidth * 0.6 })
      
      doc.setDrawColor(238, 238, 238)
      doc.setLineWidth(0.1)
      doc.line(margin, yPos + 1.5, pageWidth - margin, yPos + 1.5)
      yPos += 8
    }
    
    addRow('Invoice Number:', `${invoicePrefix}-${payment.id.substring(0, 8).toUpperCase()}`)
    addRow('Payment Date:', new Date(payment.payment_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }))
    addRow('Client Name:', `${client.first_name} ${client.last_name}`)
    addRow('Payment Method:', payment.payment_method.replace('_', ' ').toUpperCase())
    
    if (payment.transaction_reference) {
      addRow('Transaction Reference:', payment.transaction_reference)
    }
    
    if (payment.payment_period_start && payment.payment_period_end) {
      const periodText = `${new Date(payment.payment_period_start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - ${new Date(payment.payment_period_end).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}`
      addRow('Payment Period:', periodText)
    }
    
    addRow('Status:', payment.status.toUpperCase(), true)
    
    yPos += 5
    
    // Amount Section with background
    const boxHeight = payment.total_fee && payment.platform_fee ? 60 : 35
    doc.setFillColor(240, 249, 255)
    doc.roundedRect(margin, yPos, contentWidth, boxHeight, 2, 2, 'F')
    
    yPos += 12
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text(`Rs ${amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth / 2, yPos, { align: 'center' })
    
    yPos += 7
    doc.setFontSize(9)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text('Amount Received', pageWidth / 2, yPos, { align: 'center' })
    
    // Breakdown if available
    if (payment.total_fee && payment.platform_fee) {
      yPos += 10
      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)
      
      const leftX = margin + 10
      const rightX = pageWidth - margin - 10
      
      doc.setFont('helvetica', 'normal')
      doc.text('Total Fee (Client Paid):', leftX, yPos)
      doc.text(`Rs ${payment.total_fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightX, yPos, { align: 'right' })
      yPos += 6
      
      doc.setTextColor(redColor[0], redColor[1], redColor[2])
      doc.text(`Platform Fee (${payment.platform_fee_percentage}%):`, leftX, yPos)
      doc.text(`- Rs ${payment.platform_fee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightX, yPos, { align: 'right' })
      yPos += 8
      
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.setLineWidth(0.3)
      doc.line(leftX, yPos, rightX, yPos)
      yPos += 5
      
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(greenColor[0], greenColor[1], greenColor[2])
      doc.text('Your Income:', leftX, yPos)
      doc.text(`Rs ${amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightX, yPos, { align: 'right' })
      yPos += 8
    } else {
      yPos += boxHeight - 19
    }
    
    // Admin Notes
    if (payment.admin_notes) {
      yPos += 8
      doc.setFillColor(249, 250, 251)
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.setLineWidth(1)
      
      const noteLines = doc.splitTextToSize(payment.admin_notes, contentWidth - 10)
      const noteHeight = (noteLines.length * 5) + 12
      
      doc.rect(margin, yPos, contentWidth, noteHeight)
      doc.line(margin, yPos, margin, yPos + noteHeight)
      
      yPos += 7
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(0, 0, 0)
      doc.text('Admin Notes:', margin + 5, yPos)
      
      yPos += 5
      doc.setFont('helvetica', 'normal')
      doc.text(noteLines, margin + 5, yPos)
      yPos += noteHeight - 7
    }
    
    // Footer
    const footerY = pageHeight - 20
    doc.setDrawColor(238, 238, 238)
    doc.setLineWidth(0.2)
    doc.line(margin, footerY, pageWidth - margin, footerY)
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 0, 0)
    doc.text(footerText, pageWidth / 2, footerY + 5, { align: 'center' })
    
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text(termsText, pageWidth / 2, footerY + 9, { align: 'center' })
    doc.text(`For any queries, please contact us at ${companyEmail}`, pageWidth / 2, footerY + 13, { align: 'center' })
    
    // Save PDF
    doc.save(`${companyName}_Invoice_${invoicePrefix}-${payment.id.substring(0, 8)}.pdf`)
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-[#fdfcf3] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#336b6e]"></div>
          <p className="mt-4 text-[#336b6e] opacity-70">Loading client details...</p>
        </div>
      </div>
    )
  }

  if (errorMessage || !client) {
    return (
      <div className="p-6 bg-[#fdfcf3] min-h-screen">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="mb-6 flex items-center gap-2 text-[#336b6e] hover:text-[#2a5557] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-500" />
            <p className="text-red-700">{errorMessage || 'Client not found'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-[#fdfcf3] min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-[#336b6e] hover:text-[#2a5557] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Clients</span>
        </button>

        {/* Header Card */}
        <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] rounded-2xl p-8 mb-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {client.first_name} {client.last_name}
              </h1>
              <p className="text-white/80 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {client.email}
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
              <p className="text-xs text-white/70 mb-1">Class Type</p>
              <p className="text-lg font-bold">
                {client.class_type === 'demo' ? 'Demo' : client.class_type === 'permanent' ? 'Permanent' : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#336b6e] mb-2">Client Status</h2>
              {!isEditingStatus ? (
                <div className="flex items-center gap-4">
                  {getStatusBadge(client.status)}
                  <button
                    onClick={() => setIsEditingStatus(true)}
                    className="flex items-center gap-2 text-[#bb9f58] hover:text-[#a08a4a] transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="text-sm font-medium">Change Status</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#bb9f58]"
                  >
                    <option value="pending">Pending</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingStatus(false)
                      setNewStatus(client.status)
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    <XIcon className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fee Information - Only for Permanent Clients */}
        {client.class_type === 'permanent' && client.total_fee && (
          <div className="bg-gradient-to-br from-green-50 to-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-green-200">
            <h2 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              Fee Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Total Fee */}
              <div className="bg-white rounded-xl p-6 shadow-md border-2 border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-blue-600 font-medium">Total Fee</p>
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-blue-700">
                  ₹{parseFloat(client.total_fee).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-500 mt-1 capitalize">
                  {client.fee_frequency || 'monthly'}
                </p>
              </div>

              {/* Platform Fee */}
              <div className="bg-white rounded-xl p-6 shadow-md border-2 border-orange-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-orange-600 font-medium">Platform Fee</p>
                  <Percent className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-orange-700">
                  {parseFloat(client.platform_fee_percentage).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ₹{(parseFloat(client.total_fee) * parseFloat(client.platform_fee_percentage) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              {/* Your Income */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-white font-medium">Your Income</p>
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-bold text-white">
                  ₹{parseFloat(client.trainer_income).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-green-100 mt-1">
                  After platform fee
                </p>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-3">Fee Breakdown:</p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Client pays:</span>
                  <span className="font-semibold text-gray-900">₹{parseFloat(client.total_fee).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Platform fee ({client.platform_fee_percentage}%):</span>
                  <span className="font-semibold text-orange-600">- ₹{(parseFloat(client.total_fee) * parseFloat(client.platform_fee_percentage) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-900">You receive:</span>
                  <span className="font-bold text-green-600 text-lg">₹{parseFloat(client.trainer_income).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Payment Frequency Info */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Payment Frequency:</span> {client.fee_frequency ? client.fee_frequency.charAt(0).toUpperCase() + client.fee_frequency.slice(1).replace('_', ' ') : 'Monthly'}
              </p>
            </div>
          </div>
        )}

        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
            <User className="w-6 h-6" />
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#fdfcf3] rounded-xl p-4">
              <p className="text-sm text-[#336b6e] opacity-70 mb-1">First Name</p>
              <p className="text-lg font-semibold text-[#336b6e]">{client.first_name}</p>
            </div>
            <div className="bg-[#fdfcf3] rounded-xl p-4">
              <p className="text-sm text-[#336b6e] opacity-70 mb-1">Last Name</p>
              <p className="text-lg font-semibold text-[#336b6e]">{client.last_name}</p>
            </div>
            <div className="bg-[#fdfcf3] rounded-xl p-4">
              <p className="text-sm text-[#336b6e] opacity-70 mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </p>
              <p className="text-lg font-semibold text-[#336b6e]">{client.email}</p>
            </div>
            <div className="bg-[#fdfcf3] rounded-xl p-4">
              <p className="text-sm text-[#336b6e] opacity-70 mb-1 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone
              </p>
              <p className="text-lg font-semibold text-[#336b6e]">{client.phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            Address Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#fdfcf3] rounded-xl p-4">
              <p className="text-sm text-[#336b6e] opacity-70 mb-1">Street</p>
              <p className="text-lg font-semibold text-[#336b6e]">{client.street || 'N/A'}</p>
            </div>
            <div className="bg-[#fdfcf3] rounded-xl p-4">
              <p className="text-sm text-[#336b6e] opacity-70 mb-1">City</p>
              <p className="text-lg font-semibold text-[#336b6e]">{client.city || 'N/A'}</p>
            </div>
            <div className="bg-[#fdfcf3] rounded-xl p-4">
              <p className="text-sm text-[#336b6e] opacity-70 mb-1">State</p>
              <p className="text-lg font-semibold text-[#336b6e]">{client.state || 'N/A'}</p>
            </div>
            <div className="bg-[#fdfcf3] rounded-xl p-4">
              <p className="text-sm text-[#336b6e] opacity-70 mb-1">Pincode</p>
              <p className="text-lg font-semibold text-[#336b6e]">{client.pincode || 'N/A'}</p>
            </div>
            <div className="bg-[#fdfcf3] rounded-xl p-4 md:col-span-2">
              <p className="text-sm text-[#336b6e] opacity-70 mb-1">Country</p>
              <p className="text-lg font-semibold text-[#336b6e]">{client.country || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Payment History - Only for Permanent Clients */}
        {client.class_type === 'permanent' && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              Payment History
            </h2>

            {loadingPayments ? (
              <div className="text-center py-8">
                <RefreshCw className="w-8 h-8 mx-auto mb-2 text-[#336b6e] animate-spin" />
                <p className="text-gray-600">Loading payment history...</p>
              </div>
            ) : paymentHistory.length === 0 ? (
              <div className="p-8 bg-gray-50 rounded-lg text-center">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="font-medium text-gray-700">No payments received yet</p>
                <p className="text-sm text-gray-500 mt-1">Payment records will appear here once admin processes them</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-[#336b6e]">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#336b6e]">Amount Received</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#336b6e]">Method</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#336b6e]">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-[#336b6e]">Period</th>
                      <th className="text-center py-3 px-4 font-semibold text-[#336b6e]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paymentHistory.map((payment) => {
                      const amountReceived = payment.trainer_amount || payment.amount || 0
                      
                      return (
                        <tr key={payment.id} className="hover:bg-[#fdfcf3] transition-colors">
                          <td className="py-4 px-4 text-gray-700">
                            {new Date(payment.payment_date).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-bold text-green-600 text-lg">
                                ₹{amountReceived.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              {payment.total_fee && payment.platform_fee && (
                                <p className="text-xs text-gray-500">
                                  From ₹{payment.total_fee.toLocaleString('en-IN')} (Platform fee: ₹{payment.platform_fee.toLocaleString('en-IN', { maximumFractionDigits: 2 })})
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-600 capitalize">
                            {payment.payment_method.replace('_', ' ')}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                              payment.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : payment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {payment.payment_period_start && payment.payment_period_end ? (
                              <span>
                                {new Date(payment.payment_period_start).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                {' - '}
                                {new Date(payment.payment_period_end).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-2">
                              {payment.payment_proof_url && (
                                <button
                                  onClick={() => {
                                    setSelectedPayment(payment)
                                    setShowProofModal(true)
                                  }}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View Payment Proof"
                                >
                                  <Eye className="w-5 h-5" />
                                </button>
                              )}
                              <button
                                onClick={() => downloadInvoice(payment)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Download Invoice"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Payment Summary */}
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">Total Received:</span>
                    <span className="text-2xl font-bold text-green-600">
                      ₹{paymentHistory
                        .filter(p => p.status === 'completed')
                        .reduce((sum, p) => sum + (p.trainer_amount || p.amount || 0), 0)
                        .toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {paymentHistory.filter(p => p.status === 'completed').length} completed payment(s)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Timeline Information */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Timeline
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#fdfcf3] rounded-xl p-4">
              <p className="text-sm text-[#336b6e] opacity-70 mb-1">Joined Date</p>
              <p className="text-lg font-semibold text-[#336b6e]">{formatDate(client.created_at)}</p>
            </div>
            <div className="bg-[#fdfcf3] rounded-xl p-4">
              <p className="text-sm text-[#336b6e] opacity-70 mb-1">Last Updated</p>
              <p className="text-lg font-semibold text-[#336b6e]">{formatDate(client.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Proof Modal */}
      {showProofModal && selectedPayment && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowProofModal(false)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 text-white flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Payment Proof
                </h2>
                <p className="text-sm text-white/80 mt-1">
                  Payment Date: {new Date(selectedPayment.payment_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setShowProofModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Payment Details */}
              <div className="mb-6 p-4 bg-[#fdfcf3] rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Amount Received</p>
                    <p className="text-xl font-bold text-green-600">
                      ₹{(selectedPayment.trainer_amount || selectedPayment.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="text-lg font-semibold text-[#336b6e] capitalize">
                      {selectedPayment.payment_method.replace('_', ' ')}
                    </p>
                  </div>
                  {selectedPayment.transaction_reference && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Transaction Reference</p>
                      <p className="text-lg font-semibold text-[#336b6e] font-mono">
                        {selectedPayment.transaction_reference}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Proof Image/Document */}
              {selectedPayment.payment_proof_url && (
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-[#336b6e] mb-3">Uploaded Proof</h3>
                  {selectedPayment.payment_proof_url.toLowerCase().endsWith('.pdf') ? (
                    <div className="border-2 border-gray-200 rounded-xl p-4 text-center">
                      <FileText className="w-16 h-16 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600 mb-4">PDF Document</p>
                      <a
                        href={selectedPayment.payment_proof_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors"
                      >
                        <Download className="w-5 h-5" />
                        Open PDF
                      </a>
                    </div>
                  ) : (
                    <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                      <img
                        src={selectedPayment.payment_proof_url}
                        alt="Payment Proof"
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Admin Notes */}
              {selectedPayment.admin_notes && (
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
                  <p className="text-sm font-semibold text-blue-900 mb-2">Admin Notes:</p>
                  <p className="text-gray-700">{selectedPayment.admin_notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
              <button
                onClick={() => setShowProofModal(false)}
                className="px-6 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
              <button
                onClick={() => downloadInvoice(selectedPayment)}
                className="px-6 py-2 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors font-medium flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClientDetail

