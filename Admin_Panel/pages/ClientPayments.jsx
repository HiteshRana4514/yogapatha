import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  RefreshCw,
  Plus,
  Search,
  Calendar,
  User,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  Filter
} from 'lucide-react'
import supabase from '../../src/supabase/supabse'
import GeneratePaymentLinkModal from '../components/GeneratePaymentLinkModal'

function ClientPayments() {
  const [payments, setPayments] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [refreshingStatus, setRefreshingStatus] = useState({})

  useEffect(() => {
    fetchPayments()
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, email, phone, payment_link_url, payment_link_status, phonepe_order_id, phonepe_transaction_id')
        .order('created_at', { ascending: false })

      if (error) throw error
      setClients(data || [])
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('client_payments')
        .select(`
          *,
          client:clients(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshStatus = async (payment) => {
    if (!payment.phonepe_order_id || !payment.phonepe_transaction_id) {
      alert('Missing PhonePe order information')
      return
    }

    setRefreshingStatus(prev => ({ ...prev, [payment.id]: true }))
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/phonepe-payment/status?orderId=${payment.phonepe_order_id}&merchantOrderId=${payment.phonepe_transaction_id}`,
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
        await fetchPayments()
      } else {
        alert('Payment status checked: ' + (result.state || result.code || 'Unknown'))
      }
    } catch (error) {
      console.error('Error checking payment status:', error)
      alert('Failed to check payment status: ' + error.message)
    } finally {
      setRefreshingStatus(prev => ({ ...prev, [payment.id]: false }))
    }
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.client?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.client?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.client?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      failed: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle }
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status.toUpperCase()}
      </span>
    )
  }

  return (
    <div className="p-4 md:p-6 bg-[#fdfcf3] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#336b6e] flex items-center gap-2">
                <DollarSign className="w-8 h-8" />
                Client Payments
              </h1>
              <p className="text-gray-600 mt-1">Track all PhonePe payment transactions from clients</p>
            </div>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-4 py-2.5 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Generate Payment Link
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by client name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#336b6e] focus:border-transparent appearance-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Payments List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-[#336b6e] animate-spin" />
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Payments Found</h3>
            <p className="text-gray-500">No client payments match your search criteria</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPayments.map((payment) => (
              <div key={payment.id} className="bg-white rounded-xl shadow-lg p-4 md:p-6 hover:shadow-xl transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Client Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#336b6e] rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-[#336b6e] truncate">
                        {payment.client?.first_name} {payment.client?.last_name}
                      </h3>
                      <p className="text-sm text-gray-600 truncate">{payment.client?.email}</p>
                      <p className="text-sm text-gray-500">{payment.client?.phone}</p>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 lg:gap-6">
                    {/* Amount */}
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-gray-600 mb-1">Amount</p>
                      <p className="text-2xl font-bold text-[#336b6e]">
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-gray-600 mb-1">Status</p>
                      {getStatusBadge(payment.status)}
                    </div>

                    {/* Date */}
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-gray-600 mb-1">Date</p>
                      <p className="text-sm font-medium text-gray-800 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(payment.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRefreshStatus(payment)}
                        disabled={refreshingStatus[payment.id] || payment.status === 'completed'}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        title="Refresh payment status"
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshingStatus[payment.id] ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Refresh</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transaction Details */}
                {payment.phonepe_transaction_id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Transaction ID:</p>
                    <p className="font-mono text-xs text-gray-700 break-all bg-gray-50 px-3 py-2 rounded">
                      {payment.phonepe_transaction_id}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {payment.notes && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 italic">{payment.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Payment Link Modal */}
      {showGenerateModal && (
        <GeneratePaymentLinkModal
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => {
            setShowGenerateModal(false)
            fetchPayments()
            fetchClients()
          }}
        />
      )}
    </div>
  )
}

export default ClientPayments
