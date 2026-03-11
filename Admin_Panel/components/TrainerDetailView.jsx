import { useState, useEffect } from "react"
import {
  ArrowLeft,
  MapPin,
  User,
  Award,
  FileText,
  Download,
  Plus,
  X,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Calendar,
  TrendingUp,
  Building,
  AlertCircle,
  RefreshCw,
  Wallet,
  CreditCard,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Share2,
  Copy,
  Eye
} from 'lucide-react'
import supabase from '../../src/supabase/supabse'
import PaymentVerificationModal from './PaymentVerificationModal'
import RecordPaymentModal from './RecordPaymentModal'
import EditFeeModal from './EditFeeModal'
import ClientPaymentHistoryModal from './ClientPaymentHistoryModal'
import { sendPaymentNotification } from '../../src/utils/emailService'
import { generateInvoicePDF } from '../utils/generateInvoicePDF'
function TrainerDetailView({ trainer, onBack }) {
  const [kycStatus, setKycStatus] = useState(trainer?.kyc_status || 'pending')
  // Fix: Use partnership_status (from database) not partner_status
  const [partnerStatus, setPartnerStatus] = useState(
    trainer?.partnership_status || (trainer?.wants_partnership ? 'pending' : 'not_applied')
  )
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignedClients, setAssignedClients] = useState([])
  const [allClients, setAllClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, active, inactive
  const [assignmentFilter, setAssignmentFilter] = useState('unassigned') // all, unassigned, assigned
  const [fitnessLevelFilter, setFitnessLevelFilter] = useState('all') // all, beginner, intermediate, advanced
  const [selectedClient, setSelectedClient] = useState(null)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [clientToConvert, setClientToConvert] = useState(null)
  const [demoClassDate, setDemoClassDate] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [feeData, setFeeData] = useState({
    total_fee: '',
    platform_fee_percentage: '',
    trainer_income: '',
    fee_frequency: 'monthly'
  })

  // Payment-related state
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [loadingPaymentDetails, setLoadingPaymentDetails] = useState(false)
  const [showPaymentSection, setShowPaymentSection] = useState(true)
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false)
  const [selectedClientForPayment, setSelectedClientForPayment] = useState(null)

  // New Modals State
  const [showEditFeeModal, setShowEditFeeModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedClientForFee, setSelectedClientForFee] = useState(null)
  const [selectedClientForHistory, setSelectedClientForHistory] = useState(null)

  useEffect(() => {
    fetchClientsData()
    fetchPaymentDetails()
    // Sync state with trainer prop when it changes
    setKycStatus(trainer?.kyc_status || 'pending')
    setPartnerStatus(
      trainer?.partnership_status || (trainer?.wants_partnership ? 'pending' : 'not_applied')
    )
  }, [trainer])

  useEffect(() => {
    filterClients()
  }, [searchTerm, statusFilter, assignmentFilter, fitnessLevelFilter, allClients, assignedClients])

  const fetchClientsData = async () => {
    setIsLoading(true)
    try {
      // Fetch all clients from Supabase
      const { data: allClientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .neq('status', 'onboarded')
        .order('created_at', { ascending: false })

      if (clientsError) {
        console.error('Error fetching clients:', clientsError)
        throw clientsError
      }

      // Fetch clients assigned to this specific trainer
      const { data: assignedClientsData, error: assignedError } = await supabase
        .from('clients')
        .select('*')
        .eq('trainer_id', trainer.id)
        .order('created_at', { ascending: false })

      if (assignedError) {
        console.error('Error fetching assigned clients:', assignedError)
        throw assignedError
      }

      setAllClients(allClientsData || [])
      setAssignedClients(assignedClientsData || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
      alert('Failed to fetch clients: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPaymentDetails = async () => {
    if (!trainer?.id) return

    setLoadingPaymentDetails(true)
    try {
      const { data, error } = await supabase
        .from('trainer_payment_details')
        .select('*')
        .eq('trainer_id', trainer.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching payment details:', error)
        throw error
      }

      setPaymentDetails(data)
    } catch (error) {
      console.error('Error fetching payment details:', error)
    } finally {
      setLoadingPaymentDetails(false)
    }
  }

  const handleVerifyPayment = async (paymentDetailsId, adminNotes) => {
    try {
      const { error } = await supabase
        .from('trainer_payment_details')
        .update({
          is_verified: true,
          rejection_reason: null,
          verified_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
        .eq('id', paymentDetailsId)

      if (error) throw error

      alert('Payment details verified successfully!')
      await fetchPaymentDetails()
    } catch (error) {
      console.error('Error verifying payment:', error)
      throw error
    }
  }

  const handleRejectPayment = async (paymentDetailsId, rejectionReason, adminNotes) => {
    try {
      const { error } = await supabase
        .from('trainer_payment_details')
        .update({
          is_verified: false,
          rejection_reason: rejectionReason,
          admin_notes: adminNotes
        })
        .eq('id', paymentDetailsId)

      if (error) throw error

      alert('Payment details rejected')
      await fetchPaymentDetails()
    } catch (error) {
      console.error('Error rejecting payment:', error)
      throw error
    }
  }

  const handleSavePayment = async (paymentData, closeModal = true) => {
    
    try {
      // Get current user (admin)
      const { data: { user } } = await supabase.auth.getUser()
      
      // Add recorded_by field
      const paymentDataWithAdmin = {
        ...paymentData,
        recorded_by: user?.id
      }

      // Insert payment transaction and get the inserted data
      const { data: insertedPayment, error: txnError } = await supabase
        .from('payment_transactions')
        .insert([paymentDataWithAdmin])
        .select()
        .single()

      if (txnError) {
        console.error('Payment transaction error:', txnError)
        throw txnError
      }

      alert('Payment recorded successfully!')

      // Send email notification to trainer with PDF attachment
      if (trainer?.email && selectedClientForPayment && insertedPayment) {
        try {
          // Fetch invoice settings
          const { data: invoiceSettings } = await supabase
            .from('invoice_settings')
            .select('*')
            .limit(1)
            .single()

          // Generate PDF invoice
          const pdfBase64 = await generateInvoicePDF(
            insertedPayment,
            selectedClientForPayment,
            trainer,
            invoiceSettings
          )

          // Send email with PDF attachment
          const emailResult = await sendPaymentNotification(trainer.email, {
            clientName: `${selectedClientForPayment.first_name} ${selectedClientForPayment.last_name}`,
            amount: paymentData.total_fee,
            paymentDate: paymentData.payment_date,
            paymentMethod: paymentData.payment_method,
            trainerAmount: paymentData.trainer_amount,
            platformFee: paymentData.platform_fee,
            invoiceNumber: `${invoiceSettings?.invoice_prefix || 'YP'}-${insertedPayment.id.substring(0, 8).toUpperCase()}`
          }, pdfBase64)
        } catch (emailError) {
          console.error('❌ Failed to send payment notification email:', emailError)
          // Don't throw - payment was recorded successfully
        }
      } else {
      }

      // Refresh clients data to show updated payment status
      await fetchClientsData()

      if (closeModal) {
        setShowRecordPaymentModal(false)
        setSelectedClientForPayment(null)
      }
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('Failed to record payment: ' + error.message)
      throw error
    }
  }

  const filterClients = () => {
    let result = [...allClients]

    // Search filter
    if (searchTerm) {
      result = result.filter(client =>
        client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(client => client.status === statusFilter)
    }

    // Assignment filter
    if (assignmentFilter === 'unassigned') {
      result = result.filter(client => !client.trainer_id)
    } else if (assignmentFilter === 'assigned') {
      result = result.filter(client => client.trainer_id)
    }

    setFilteredClients(result)
  }

  const handleKYCUpdate = async (newStatus) => {
    try {
      const { error } = await supabase
        .from('trainer_profiles')
        .update({
          kyc_status: newStatus,
          verified_at: newStatus === 'approved' ? new Date().toISOString() : null
        })
        .eq('user_id', trainer.user_id)

      if (error) {
        throw error
      }

      setKycStatus(newStatus)
      alert(`KYC status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating KYC:', error)
      alert('Failed to update KYC status: ' + error.message)
    }
  }

  const handlePartnerStatusUpdate = async (newStatus) => {
    try {
      const { error } = await supabase
        .from('trainer_profiles')
        .update({
          partnership_status: newStatus
        })
        .eq('user_id', trainer.user_id)

      if (error) {
        throw error
      }

      setPartnerStatus(newStatus)
      alert(`Partner status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating partner status:', error)
      alert('Failed to update partner status: ' + error.message)
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

  const handleAssignClient = async (client, type = 'demo') => {
    // Check if trainer has a trainer_profile
    if (!trainer.has_trainer_profile) {
      alert('Cannot assign clients: This trainer needs to complete their trainer profile first.')
      return
    }

    try {
      // Validate demo class date if assigning for demo
      if (type === 'demo' && !demoClassDate) {
        alert('Please select a demo class date and time')
        return
      }

      // Validate fee data for permanent assignments
      if (type === 'permanent') {
        if (!feeData.total_fee || !feeData.platform_fee_percentage) {
          alert('Please enter total fee and platform fee percentage for permanent assignment')
          return
        }

        if (parseFloat(feeData.platform_fee_percentage) < 0 || parseFloat(feeData.platform_fee_percentage) > 100) {
          alert('Platform fee percentage must be between 0 and 100')
          return
        }
      }

      setIsAssigning(true)

      // Prepare update data
      const updateData = {
        trainer_id: trainer.id,
        class_type: type,
        status: 'active'
      }

      // Add fee data for permanent assignments
      if (type === 'permanent') {
        updateData.total_fee = parseFloat(feeData.total_fee)
        updateData.platform_fee_percentage = parseFloat(feeData.platform_fee_percentage)
        updateData.fee_frequency = feeData.fee_frequency
        updateData.fee_amount = parseFloat(feeData.total_fee) // Also set fee_amount for payment system
        // trainer_income will be auto-calculated by database trigger
      }

      // Update client with trainer_id and class_type
      const { error } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', client.id)

      if (error) {
        throw error
      }

      // Refresh client lists
      await fetchClientsData()

      alert(`Client ${client.first_name} ${client.last_name} assigned for ${type} class successfully!`)
      setShowAssignModal(false)
      setSelectedClient(null)
      setDemoClassDate('')
      setAdminNotes('')
      setFeeData({
        total_fee: '',
        platform_fee_percentage: '',
        trainer_income: '',
        fee_frequency: 'monthly'
      })
    } catch (error) {
      console.error('Error assigning client:', error)
      alert('Failed to assign client: ' + error.message)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleConvertToPermanent = async () => {
    if (!clientToConvert) return

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
      // Update client's class_type to permanent with fee data
      const { error } = await supabase
        .from('clients')
        .update({
          class_type: 'permanent',
          status: 'active',
          total_fee: parseFloat(feeData.total_fee),
          platform_fee_percentage: parseFloat(feeData.platform_fee_percentage),
          fee_frequency: feeData.fee_frequency,
          fee_amount: parseFloat(feeData.total_fee) // Also set fee_amount for payment system
          // trainer_income will be auto-calculated by database trigger
        })
        .eq('id', clientToConvert.id)

      if (error) {
        throw error
      }

      // Refresh client lists
      await fetchClientsData()

      alert(`Client ${clientToConvert.first_name} ${clientToConvert.last_name} converted to permanent successfully!`)
      setShowConvertModal(false)
      setClientToConvert(null)
      setFeeData({
        total_fee: '',
        platform_fee_percentage: '',
        trainer_income: '',
        fee_frequency: 'monthly'
      })
    } catch (error) {
      console.error('Error converting to permanent:', error)
      alert('Failed to convert client: ' + error.message)
    }
  }

  const handleRemoveAssignment = async (clientId) => {
    const client = assignedClients.find(c => c.id === clientId)
    if (!client) return

    if (!confirm(`Are you sure you want to remove ${client.first_name} ${client.last_name} from this trainer?`)) return

    try {
      // Remove trainer_id and class_type from client
      const { error } = await supabase
        .from('clients')
        .update({
          trainer_id: null,
          class_type: null,
          status: 'pending'
        })
        .eq('id', clientId)

      if (error) {
        throw error
      }

      // Refresh client lists
      await fetchClientsData()
      alert(`${client.first_name} ${client.last_name} removed from trainer successfully`)
    } catch (error) {
      console.error('Error removing assignment:', error)
      alert('Failed to remove assignment: ' + error.message)
    }
  }

  const getAssignmentTypeBadge = (type) => {
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
        Unassigned
      </span>
    )
  }

  const getStatusBadge = (status) => {
    const config = {
      active: { bg: 'bg-green-100', text: 'text-green-700' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      inactive: { bg: 'bg-gray-100', text: 'text-gray-600' }
    }
    const { bg, text } = config[status] || config.pending
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (!trainer) return null

  // Use trainer data with fallbacks for missing fields
  const fullTrainerData = {
    ...trainer,
    bio: trainer.bio || 'No bio provided',
    // Handle specializations - can be array or JSONB
    specializations: Array.isArray(trainer.specializations)
      ? trainer.specializations
      : (trainer.specializations ? [trainer.specializations] : []),
    // Handle certifications - NEW: array of {name, url} objects from trainer_profiles
    // Also support legacy: string from user_metadata
    certifications: (() => {
      let certs = trainer.certifications;

      // If it's a string (JSONB from database or legacy), try to parse it
      if (typeof certs === 'string') {
        // Empty string check
        if (!certs || certs.trim() === '') return [];

        try {
          certs = JSON.parse(certs);
        } catch (e) {
          // If parsing fails, treat as comma-separated string (legacy)
          return certs.split(',').map(c => ({ name: c.trim(), url: null })).filter(c => c.name);
        }
      }

      // If it's an array
      if (Array.isArray(certs)) {
        if (certs.length === 0) return [];

        // Check if it's the new structure [{name, url}]
        if (typeof certs[0] === 'object' && certs[0] !== null) {
          return certs; // New structure
        }
        // Old structure - array of strings
        return certs.map(name => ({ name, url: null }));
      }

      return [];
    })(),
    pincode: trainer.pincode || 'N/A',
    street: trainer.address || 'N/A',
    country: trainer.country || 'India',
    // Handle certification files - Use 'certifications' column (not 'certificate_documents')
    // The 'certifications' column stores array of {name, url} objects
    certification_files: (() => {
      // Try 'certifications' first (new column), fallback to 'certificate_documents' (old column)
      let docs = trainer.certifications || trainer.certificate_documents;

      // If it's a string, try to parse it
      if (typeof docs === 'string') {
        // Empty string check
        if (!docs || docs.trim() === '' || docs === '[]') {
          return [];
        }

        try {
          docs = JSON.parse(docs);
        } catch (e) {
          console.error('Failed to parse certifications:', e);
          return [];
        }
      }

      // Now check if it's an array with items
      if (Array.isArray(docs) && docs.length > 0) {
        return docs.map((doc, idx) => {
          // Handle both object format {name, url} and string format (URL only)
          if (typeof doc === 'object' && doc !== null) {
            return {
              name: doc.name || doc.filename || `Certificate-${idx + 1}`,
              url: doc.url || doc.secure_url || doc
            };
          } else if (typeof doc === 'string') {
            return {
              name: `Certificate-${idx + 1}`,
              url: doc
            };
          }
          return null;
        }).filter(doc => doc !== null && doc.url);
      }

      return [];
    })(),
    gov_id: {
      name: trainer.identity_card_url ? 'Government-ID.pdf' : 'Not uploaded',
      url: trainer.identity_card_url || '#'
    },
    // Partner details (only if trainer applied for partnership)
    partner_status: trainer.partnership_status || (trainer.wants_partnership ? 'pending' : 'not_applied'),
    academy_name: trainer.academy_name || null,
    academy_address: trainer.academy_address || null,
    logo: trainer.academy_logo_url || trainer.avatar_url || 'https://via.placeholder.com/200x80/bb9f58/336b6e?text=LOGO'
  }

  return (
    <div className="p-6 bg-[#fdfcf3] min-h-screen">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[#336b6e] hover:text-[#2a5557] font-semibold mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Trainers
          </button>
          <h1 className="text-3xl font-bold text-[#336b6e]">Trainer Profile</h1>
        </div>

        {/* Warning if trainer doesn't have trainer_profile */}
        {!trainer.has_trainer_profile && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-1">Incomplete Trainer Profile</h3>
                <p className="text-sm text-yellow-700">
                  This trainer doesn't have a complete trainer profile yet. Some features like document uploads and client assignments may be limited.
                  The trainer needs to complete their profile setup.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column - Profile & Documents */}
          <div className="lg:col-span-2 space-y-6">

            {/* Personal Information */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">First Name</label>
                  <p className="font-semibold text-[#336b6e]">{fullTrainerData.first_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Last Name</label>
                  <p className="font-semibold text-[#336b6e]">{fullTrainerData.last_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Email</label>
                  <a href={`mailto:${fullTrainerData.email}`} className="font-semibold text-[#bb9f58] hover:underline">
                    {fullTrainerData.email}
                  </a>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Phone</label>
                  <a href={`tel:${fullTrainerData.phone}`} className="font-semibold text-[#bb9f58] hover:underline">
                    {fullTrainerData.phone}
                  </a>
                </div>
              </div>

              <div className="mt-6">
                <label className="text-sm text-gray-600 mb-2 block">Bio</label>
                <p className="text-[#336b6e] leading-relaxed">{fullTrainerData.bio}</p>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Address Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600 mb-1 block">Street</label>
                  <p className="font-semibold text-[#336b6e]">{fullTrainerData.street}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">City</label>
                  <p className="font-semibold text-[#336b6e]">{fullTrainerData.city}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">State</label>
                  <p className="font-semibold text-[#336b6e]">{fullTrainerData.state}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Pincode</label>
                  <p className="font-semibold text-[#336b6e]">{fullTrainerData.pincode}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Country</label>
                  <p className="font-semibold text-[#336b6e]">{fullTrainerData.country}</p>
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Professional Details
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Experience Level</label>
                  <p className="font-semibold text-[#336b6e]">{fullTrainerData.experience}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Specializations</label>
                  <div className="flex flex-wrap gap-2">
                    {fullTrainerData.specializations.length > 0 ? (
                      fullTrainerData.specializations.map((spec, index) => (
                        <span key={index} className="px-3 py-1 bg-[#bb9f58]/10 text-[#336b6e] rounded-full text-sm font-semibold">
                          {spec}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No specializations listed</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-gray-600 mb-2 block">Certifications</label>
                  <div className="flex flex-wrap gap-2">
                    {fullTrainerData.certifications.length > 0 ? (
                      fullTrainerData.certifications.map((cert, index) => (
                        <span key={index} className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                          {cert.name}
                          {cert.url && (
                            <a
                              href={cert.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-green-900"
                              title="View certificate"
                            >
                              <FileText className="w-3 h-3" />
                            </a>
                          )}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-500 italic">No certifications listed</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Partner Information */}
            {fullTrainerData.partner_status !== 'not_applied' && (
              <div className="bg-gradient-to-br from-[#bb9f58]/10 to-white rounded-xl shadow-lg p-6 border-2 border-[#bb9f58]/30">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-[#336b6e] flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Partner Application
                  </h2>
                  {partnerStatus === 'approved' && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                      Active Partner
                    </span>
                  )}
                  {partnerStatus === 'pending' && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                      Pending Review
                    </span>
                  )}
                  {partnerStatus === 'rejected' && (
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                      Application Rejected
                    </span>
                  )}
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm text-gray-600 mb-2 block">Academy Logo</label>
                    <img src={fullTrainerData.logo} alt="Academy Logo" className="h-20 rounded-lg shadow-md" />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Academy/Institute Name</label>
                    <p className="font-semibold text-[#336b6e] text-lg">{fullTrainerData.academy_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mb-1 block">Academy Address</label>
                    <p className="font-semibold text-[#336b6e]">{fullTrainerData.academy_address}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Documents */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Documents
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-[#336b6e] mb-3 block">Certification Files</label>
                  <div className="space-y-2">
                    {fullTrainerData.certification_files.length > 0 ? (
                      fullTrainerData.certification_files.map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-[#fdfcf3] rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-[#336b6e]" />
                            <span className="text-[#336b6e] font-medium">{file.name}</span>
                          </div>
                          <a
                            href={file.url}
                            download
                            className="p-2 text-[#bb9f58] hover:bg-[#bb9f58] hover:text-white rounded-lg transition-all"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No certification files uploaded yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-[#336b6e] mb-3 block">Government ID</label>
                  {fullTrainerData.gov_id.url !== '#' ? (
                    <div className="flex items-center justify-between p-3 bg-[#fdfcf3] rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[#336b6e]" />
                        <span className="text-[#336b6e] font-medium">{fullTrainerData.gov_id.name}</span>
                      </div>
                      <a
                        href={fullTrainerData.gov_id.url}
                        download
                        className="p-2 text-[#bb9f58] hover:bg-[#bb9f58] hover:text-white rounded-lg transition-all"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">No government ID uploaded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Details Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#336b6e] flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Payment Details
                </h2>
                <button
                  onClick={() => setShowPaymentSection(!showPaymentSection)}
                  className="text-[#336b6e] hover:text-[#bb9f58] transition-colors"
                >
                  {showPaymentSection ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </button>
              </div>

              {showPaymentSection && (
                <div className="space-y-4">
                  {loadingPaymentDetails ? (
                    <div className="text-center py-8">
                      <RefreshCw className="w-8 h-8 mx-auto mb-2 text-[#336b6e] animate-spin" />
                      <p className="text-gray-600">Loading payment details...</p>
                    </div>
                  ) : !paymentDetails ? (
                    <div className="p-6 bg-gray-50 rounded-lg text-center">
                      <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="font-medium text-gray-700">No payment details added yet</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Trainer needs to set up payment details from their dashboard
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Verification Status */}
                      <div className={`p-4 rounded-lg ${paymentDetails.is_verified === true
                        ? 'bg-green-50 border border-green-200'
                        : paymentDetails.is_verified === false
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-yellow-50 border border-yellow-200'
                        }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {paymentDetails.is_verified === true ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : paymentDetails.is_verified === false ? (
                              <XCircle className="w-5 h-5 text-red-600" />
                            ) : (
                              <Clock className="w-5 h-5 text-yellow-600" />
                            )}
                            <span className={`font-medium ${paymentDetails.is_verified === true
                              ? 'text-green-800'
                              : paymentDetails.is_verified === false
                                ? 'text-red-800'
                                : 'text-yellow-800'
                              }`}>
                              {paymentDetails.is_verified === true
                                ? 'Verified'
                                : paymentDetails.is_verified === false
                                  ? 'Rejected'
                                  : 'Pending Verification'}
                            </span>
                          </div>
                          <button
                            onClick={() => setShowVerificationModal(true)}
                            className="px-4 py-2 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors text-sm font-medium"
                          >
                            Review Details
                          </button>
                        </div>
                        {paymentDetails.rejection_reason && (
                          <p className="text-sm text-red-700 mt-2">
                            Reason: {paymentDetails.rejection_reason}
                          </p>
                        )}
                      </div>

                      {/* Payment Methods Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Bank Details */}
                        {paymentDetails.bank_account_number && (
                          <div className={`p-4 border-2 rounded-lg ${paymentDetails.preferred_payment_method === 'bank'
                            ? 'border-[#bb9f58] bg-[#bb9f58]/5'
                            : 'border-gray-200'
                            }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <CreditCard className="w-5 h-5 text-[#bb9f58]" />
                              <span className="font-semibold text-[#336b6e]">Bank Transfer</span>
                              {paymentDetails.preferred_payment_method === 'bank' && (
                                <span className="text-xs bg-[#bb9f58] text-white px-2 py-0.5 rounded">Preferred</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {paymentDetails.bank_name}
                            </p>
                            <p className="text-xs text-gray-500 font-mono mt-1">
                              ****{paymentDetails.bank_account_number.slice(-4)}
                            </p>
                          </div>
                        )}

                        {/* UPI Details */}
                        {paymentDetails.upi_id && (
                          <div className={`p-4 border-2 rounded-lg ${paymentDetails.preferred_payment_method === 'upi'
                            ? 'border-[#bb9f58] bg-[#bb9f58]/5'
                            : 'border-gray-200'
                            }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Wallet className="w-5 h-5 text-[#bb9f58]" />
                              <span className="font-semibold text-[#336b6e]">UPI</span>
                              {paymentDetails.preferred_payment_method === 'upi' && (
                                <span className="text-xs bg-[#bb9f58] text-white px-2 py-0.5 rounded">Preferred</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 font-mono break-all">
                              {paymentDetails.upi_id}
                            </p>
                          </div>
                        )}

                        {/* QR Code */}
                        {paymentDetails.upi_qr_code_url && (
                          <div className={`p-4 border-2 rounded-lg ${paymentDetails.preferred_payment_method === 'qr_code'
                            ? 'border-[#bb9f58] bg-[#bb9f58]/5'
                            : 'border-gray-200'
                            }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-5 h-5 text-[#bb9f58]" />
                              <span className="font-semibold text-[#336b6e]">QR Code</span>
                              {paymentDetails.preferred_payment_method === 'qr_code' && (
                                <span className="text-xs bg-[#bb9f58] text-white px-2 py-0.5 rounded">Preferred</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              QR Code available
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Assigned Clients */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#336b6e] flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Assigned Clients ({assignedClients.length})
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchClientsData}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-[#336b6e] rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    title="Refresh clients list"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    disabled={!trainer.has_trainer_profile}
                    className="flex items-center gap-2 px-4 py-2 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={!trainer.has_trainer_profile ? 'Trainer needs to complete profile first' : 'Assign a client to this trainer'}
                  >
                    <Plus className="w-4 h-4" />
                    Assign Client
                  </button>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <RefreshCw className="w-12 h-12 mx-auto mb-3 text-[#336b6e] animate-spin" />
                  <p className="font-medium text-[#336b6e]">Loading clients...</p>
                </div>
              ) : assignedClients.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No clients assigned yet</p>
                  <p className="text-sm mt-1">Click "Assign Client" to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-2 text-sm font-semibold text-[#336b6e]">Client</th>
                        <th className="text-left py-3 px-2 text-sm font-semibold text-[#336b6e]">Type</th>
                        <th className="text-left py-3 px-2 text-sm font-semibold text-[#336b6e]">Fee Structure</th>
                        <th className="text-left py-3 px-2 text-sm font-semibold text-[#336b6e]">Location</th>
                        <th className="text-center py-3 px-2 text-sm font-semibold text-[#336b6e]">Status</th>
                        <th className="text-center py-3 px-2 text-sm font-semibold text-[#336b6e]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {assignedClients.map((client) => (
                        <tr key={client.id} className="hover:bg-[#fdfcf3] transition-colors">
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-[#336b6e]">{client.first_name} {client.last_name}</p>
                                <p className="text-xs text-gray-500">{client.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-2">
                            {getAssignmentTypeBadge(client.class_type)}
                          </td>
                          <td className="py-4 px-2">
                            {client.class_type === 'permanent' ? (
                              <div className="text-sm space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-gray-500 text-xs">Total:</span>
                                  <span className="font-semibold text-[#336b6e]">₹{client.fee_amount?.toLocaleString('en-IN') || 0}</span>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-gray-500 text-xs">Platform:</span>
                                  <span className="text-gray-700">{client.platform_fee_percentage || 0}%</span>
                                </div>
                                <div className="flex items-center justify-between gap-2 border-t border-gray-100 pt-1">
                                  <span className="text-gray-500 text-xs">Trainer:</span>
                                  <span className="font-medium text-green-600">
                                    ₹{((client.fee_amount || 0) * (1 - (client.platform_fee_percentage || 0) / 100)).toFixed(0)}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-400 capitalize pt-1">
                                  {client.fee_frequency || 'monthly'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-4 px-2">
                            <div className="text-sm">
                              <p className="text-gray-700 font-medium">{client.city || 'N/A'}</p>
                              <p className="text-xs text-gray-500">{client.state || ''}</p>
                            </div>
                          </td>
                          <td className="py-4 px-2 text-center">
                            {getStatusBadge(client.status)}
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex flex-col gap-2">
                              {client.class_type === 'permanent' && (
                                <>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => {
                                        setSelectedClientForPayment(client)
                                        setShowRecordPaymentModal(true)
                                      }}
                                      className="flex-1 px-2 py-1.5 bg-[#bb9f58] text-white text-xs rounded hover:bg-[#a68a4a] transition-colors flex items-center justify-center gap-1"
                                      title="Record Payment"
                                    >
                                      <DollarSign className="w-3 h-3" />
                                      Pay
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedClientForFee(client)
                                        setShowEditFeeModal(true)
                                      }}
                                      className="flex-1 px-2 py-1.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors flex items-center justify-center gap-1"
                                      title="Edit Fee Structure"
                                    >
                                      <FileText className="w-3 h-3" />
                                      Edit
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedClientForHistory(client)
                                      setShowHistoryModal(true)
                                    }}
                                    className="w-full px-2 py-1.5 bg-gray-100 text-gray-600 text-xs rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                                    title="View Payment History"
                                  >
                                    <Clock className="w-3 h-3" />
                                    History
                                  </button>
                                </>
                              )}

                              {client.class_type === 'demo' && (
                                <button
                                  onClick={() => {
                                    setClientToConvert(client)
                                    setShowConvertModal(true)
                                  }}
                                  className="w-full px-2 py-1.5 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors flex items-center justify-center gap-1"
                                  title="Convert to Permanent"
                                >
                                  <TrendingUp className="w-3 h-3" />
                                  Convert
                                </button>
                              )}

                              <button
                                onClick={() => handleRemoveAssignment(client.id)}
                                className="w-full px-2 py-1.5 border border-red-200 text-red-500 text-xs rounded hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                                title="Remove Assignment"
                              >
                                <X className="w-3 h-3" />
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Profile Picture, KYC & Partner Status */}
          <div className="space-y-6">

            {/* Profile Picture Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#336b6e] mb-4">Profile Picture</h2>
              <div className="flex flex-col items-center">
                {trainer.avatar_url ? (
                  <img
                    src={trainer.avatar_url}
                    alt={`${fullTrainerData.first_name} ${fullTrainerData.last_name}`}
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#bb9f58] shadow-lg"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/128/336b6e/ffffff?text=' + fullTrainerData.first_name.charAt(0) + fullTrainerData.last_name.charAt(0);
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#336b6e] to-[#2a5557] flex items-center justify-center border-4 border-[#bb9f58] shadow-lg">
                    <span className="text-4xl font-bold text-[#bb9f58]">
                      {fullTrainerData.first_name.charAt(0)}{fullTrainerData.last_name.charAt(0)}
                    </span>
                  </div>
                )}
                <p className="text-sm text-gray-600 mt-3 text-center">
                  {trainer.avatar_url ? 'Profile picture' : 'No profile picture uploaded'}
                </p>
              </div>
            </div>

            {/* Share Profile Card */}
            <div className="bg-gradient-to-br from-[#bb9f58] to-[#a08a4a] rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Share2 className="w-5 h-5" />
                Public Profile
              </h3>
              <p className="text-white/90 text-sm mb-4">
                Share this trainer's profile with potential clients
              </p>
              <div className="flex gap-2">
                <a
                  href={`${window.location.origin}/trainer/${trainer.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white text-[#336b6e] rounded-lg font-semibold hover:bg-white/90 transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  View
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/trainer/${trainer.id}`);
                    alert('Profile link copied!');
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors text-sm"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
            </div>

            {/* KYC Verification Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              <h2 className="text-xl font-bold text-[#336b6e] mb-6">KYC Verification</h2>

              <div className="mb-6">
                <label className="text-sm text-gray-600 mb-2 block">Current KYC Status</label>
                <div className="mb-4">
                  {kycStatus === 'approved' && (
                    <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <span className="font-bold text-green-800">KYC Approved</span>
                      </div>
                      <p className="text-sm text-green-700">All documents verified and approved</p>
                    </div>
                  )}

                  {kycStatus === 'pending' && (
                    <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-6 h-6 text-yellow-600" />
                        <span className="font-bold text-yellow-800">Pending Review</span>
                      </div>
                      <p className="text-sm text-yellow-700">Documents awaiting verification</p>
                    </div>
                  )}

                  {kycStatus === 'rejected' && (
                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <XCircle className="w-6 h-6 text-red-600" />
                        <span className="font-bold text-red-800">KYC Rejected</span>
                      </div>
                      <p className="text-sm text-red-700">Documents verification failed</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleKYCUpdate('approved')}
                  disabled={kycStatus === 'approved'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve KYC
                </button>

                <button
                  onClick={() => handleKYCUpdate('rejected')}
                  disabled={kycStatus === 'rejected'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  Reject KYC
                </button>

                <button
                  onClick={() => handleKYCUpdate('pending')}
                  disabled={kycStatus === 'pending'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Clock className="w-5 h-5" />
                  Mark as Pending
                </button>
              </div>
            </div>

            {/* Partner Status Card (Only if trainer applied) */}
            {fullTrainerData.partner_status !== 'not_applied' && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Partner Status
                </h2>

                <div className="mb-6">
                  <label className="text-sm text-gray-600 mb-2 block">Current Partner Status</label>
                  <div className="mb-4">
                    {partnerStatus === 'approved' && (
                      <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <span className="font-bold text-green-800">Partner Approved</span>
                        </div>
                        <p className="text-sm text-green-700">Trainer is an active partner</p>
                      </div>
                    )}

                    {partnerStatus === 'pending' && (
                      <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <Clock className="w-6 h-6 text-yellow-600" />
                          <span className="font-bold text-yellow-800">Application Pending</span>
                        </div>
                        <p className="text-sm text-yellow-700">Partnership application under review</p>
                      </div>
                    )}

                    {partnerStatus === 'rejected' && (
                      <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <XCircle className="w-6 h-6 text-red-600" />
                          <span className="font-bold text-red-800">Application Rejected</span>
                        </div>
                        <p className="text-sm text-red-700">Partnership application was rejected</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => handlePartnerStatusUpdate('approved')}
                    disabled={partnerStatus === 'approved'}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#bb9f58] text-white rounded-lg hover:bg-[#a08a4a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                    Approve Partnership
                  </button>

                  <button
                    onClick={() => handlePartnerStatusUpdate('rejected')}
                    disabled={partnerStatus === 'rejected'}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                    Reject Partnership
                  </button>

                  <button
                    onClick={() => handlePartnerStatusUpdate('pending')}
                    disabled={partnerStatus === 'pending'}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Clock className="w-5 h-5" />
                    Mark as Pending
                  </button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> Partnership is optional and separate from KYC verification. Trainers must have approved KYC before partnership approval.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Info Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-[#336b6e] mb-4">Quick Info</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">KYC Status:</span>
                  <span className={`font-semibold ${kycStatus === 'approved' ? 'text-green-600' :
                    kycStatus === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                    {kycStatus.charAt(0).toUpperCase() + kycStatus.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Partner Status:</span>
                  <span className={`font-semibold ${partnerStatus === 'approved' ? 'text-green-600' :
                    partnerStatus === 'rejected' ? 'text-red-600' :
                      partnerStatus === 'pending' ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                    {partnerStatus === 'not_applied' ? 'Not Applied' :
                      partnerStatus.charAt(0).toUpperCase() + partnerStatus.slice(1)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Clients:</span>
                  <span className="font-semibold text-[#336b6e]">{assignedClients.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Demo Clients:</span>
                  <span className="font-semibold text-blue-600">
                    {assignedClients.filter(c => c.class_type === 'demo').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Permanent Clients:</span>
                  <span className="font-semibold text-green-600">
                    {assignedClients.filter(c => c.class_type === 'permanent').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Experience:</span>
                  <span className="font-semibold text-[#336b6e]">{fullTrainerData.experience}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Specializations:</span>
                  <span className="font-semibold text-[#336b6e]">{fullTrainerData.specializations.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Client Modal - Enhanced with Table, Search & Filters */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-6xl w-full my-8">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 text-white flex items-center justify-between rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold">Assign Client to Trainer</h2>
                <p className="text-sm opacity-90 mt-1">Search and filter clients, then assign for demo or permanent training</p>
              </div>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedClient(null)
                  setSearchTerm('')
                  setStatusFilter('all')
                  setAssignmentFilter('unassigned')
                  setFitnessLevelFilter('all')
                }}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#bb9f58] focus:outline-none transition-colors"
                  />
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-gray-600 mb-1 block font-medium">Assignment Status</label>
                    <select
                      value={assignmentFilter}
                      onChange={(e) => setAssignmentFilter(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#bb9f58] focus:outline-none transition-colors text-sm"
                    >
                      <option value="all">All Clients</option>
                      <option value="unassigned">Unassigned Only</option>
                      <option value="assigned">Already Assigned</option>
                    </select>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-gray-600 mb-1 block font-medium">Client Status</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#bb9f58] focus:outline-none transition-colors text-sm"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>


                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setStatusFilter('all')
                      setAssignmentFilter('unassigned')
                      setFitnessLevelFilter('all')
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium self-end"
                  >
                    <RefreshCw className="w-4 h-4 inline mr-1" />
                    Reset
                  </button>
                </div>

                {/* Results Count */}
                <div className="flex items-center justify-between text-sm">
                  <p className="text-gray-600">
                    Showing <span className="font-semibold text-[#336b6e]">{filteredClients.length}</span> client{filteredClients.length !== 1 ? 's' : ''}
                  </p>
                  {selectedClient && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">{selectedClient.first_name} {selectedClient.last_name} selected</span>
                      <button
                        onClick={() => setSelectedClient(null)}
                        className="ml-2 hover:bg-blue-100 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Clients Table */}
              {filteredClients.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500 font-medium text-lg">No clients found</p>
                  <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Client</th>
                          <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Location</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Status</th>
                          <th className="text-center py-3 px-4 text-xs font-semibold text-gray-600 uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredClients.map((client) => {
                          const isAssigned = !!client.trainer_id
                          return (
                            <tr
                              key={client.id}
                              className={`hover:bg-[#fdfcf3] transition-colors ${selectedClient?.id === client.id ? 'bg-blue-50' : ''
                                }`}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center flex-shrink-0">
                                    <User className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-[#336b6e] text-sm">
                                      {client.first_name} {client.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500">{client.email}</p>
                                    <p className="text-xs text-gray-400">{client.phone || 'No phone'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="text-sm">
                                  <p className="text-gray-700 font-medium">{client.city || 'N/A'}</p>
                                  <p className="text-xs text-gray-500">{client.state || ''}</p>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center">
                                {isAssigned ? (
                                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                                    Assigned
                                  </span>
                                ) : (
                                  getStatusBadge(client.status)
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {!isAssigned && (
                                  <button
                                    onClick={() => setSelectedClient(client)}
                                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${selectedClient?.id === client.id
                                      ? 'bg-blue-500 text-white'
                                      : 'bg-[#336b6e] text-white hover:bg-[#2a5557]'
                                      }`}
                                  >
                                    {selectedClient?.id === client.id ? 'Selected' : 'Select'}
                                  </button>
                                )}
                                {isAssigned && (
                                  <span className="text-xs text-gray-400">Already assigned</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Assignment Type Selection */}
              {selectedClient && (
                <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl">
                  <h3 className="font-bold text-[#336b6e] mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    Assignment Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Demo Class Option */}
                    <div
                      onClick={() => {
                        /* Demo selection handled by buttons below */
                      }}
                      className="p-4 border-2 border-gray-300 rounded-xl hover:border-blue-400 transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <Calendar className="w-6 h-6 text-blue-600 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-[#336b6e] mb-1">Demo Class</h4>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Assign client for a trial/demo class. Can be converted to permanent later.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-600 font-medium mb-1 block">Demo Class Date & Time</label>
                          <input
                            type="datetime-local"
                            value={demoClassDate}
                            onChange={(e) => setDemoClassDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Permanent Assignment Option */}
                    <div className="p-4 border-2 border-gray-300 rounded-xl hover:border-green-400 transition-all md:col-span-2">
                      <div className="flex items-start gap-3 mb-3">
                        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                        <div>
                          <h4 className="font-bold text-[#336b6e] mb-1">Permanent Assignment</h4>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            Assign client as a permanent member for ongoing training sessions.
                          </p>
                        </div>
                      </div>

                      {/* Fee Management Section */}
                      <div className="mt-4 p-4 bg-gradient-to-br from-[#fdfcf3] to-white rounded-lg border border-[#bb9f58]/30">
                        <h5 className="text-sm font-bold text-[#336b6e] mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 bg-[#bb9f58] rounded-full flex items-center justify-center text-white text-xs">₹</span>
                          Fee Details (Required for Permanent)
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

                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-xs text-green-800">
                          <strong>Note:</strong> This creates an active training relationship immediately with fee structure.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div className="mb-4">
                    <label className="text-xs text-gray-600 font-medium mb-1 block">Admin Notes (Optional)</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add any notes about this assignment..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-[#bb9f58] focus:outline-none text-sm resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAssignClient(selectedClient, 'demo')}
                      disabled={!demoClassDate || isAssigning}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                    >
                      {isAssigning ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <Calendar className="w-5 h-5" />
                          Assign for Demo Class
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleAssignClient(selectedClient, 'permanent')}
                      disabled={isAssigning}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                    >
                      {isAssigning ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Assign as Permanent
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Convert to Permanent Modal */}
      {showConvertModal && clientToConvert && (
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
                  Converting <strong>{clientToConvert.first_name} {clientToConvert.last_name}</strong> from demo to permanent client.
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
                    setClientToConvert(null)
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
      )}

      {/* Payment Verification Modal */}
      {showVerificationModal && paymentDetails && (
        <PaymentVerificationModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          paymentDetails={paymentDetails}
          onVerify={handleVerifyPayment}
          onReject={handleRejectPayment}
        />
      )}

      {/* Record Payment Modal */}
      {showRecordPaymentModal && selectedClientForPayment && (
        <RecordPaymentModal
          isOpen={showRecordPaymentModal}
          onClose={() => {
            setShowRecordPaymentModal(false)
            setSelectedClientForPayment(null)
          }}
          client={selectedClientForPayment}
          trainer={{
            id: trainer.id,
            firstName: trainer.first_name,
            lastName: trainer.last_name
          }}
          onSavePayment={handleSavePayment}
        />
      )}
      {/* Edit Fee Modal */}
      <EditFeeModal
        isOpen={showEditFeeModal}
        onClose={() => setShowEditFeeModal(false)}
        client={selectedClientForFee}
        onUpdate={fetchClientsData}
      />

      {/* Payment History Modal */}
      <ClientPaymentHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        client={selectedClientForHistory}
      />
    </div>
  )
}

export default TrainerDetailView