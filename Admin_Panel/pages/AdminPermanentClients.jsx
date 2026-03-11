import React, { useState, useEffect } from 'react'
import {
  Search,
  Eye,
  Trash2,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  UserCog,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import supabase from '../../src/supabase/supabse'
import { useNavigate } from 'react-router-dom'
import { sendClientAssignmentNotification } from '../../src/utils/emailService'

function AdminPermanentClients() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [trainersMap, setTrainersMap] = useState({})

  // Trainer assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [allTrainers, setAllTrainers] = useState([])
  const [filteredTrainers, setFilteredTrainers] = useState([])
  const [trainerSearchTerm, setTrainerSearchTerm] = useState('')
  const [selectedTrainer, setSelectedTrainer] = useState(null)
  const [isAssigning, setIsAssigning] = useState(false)

  // Fee management state
  const [feeData, setFeeData] = useState({
    total_fee: '',
    platform_fee_percentage: '',
    trainer_income: '',
    fee_frequency: 'monthly'
  })

  useEffect(() => {
    fetchClients()
    fetchAllTrainers()
  }, [])

  useEffect(() => {
    filterAndSortClients()
  }, [searchTerm, statusFilter, sortConfig, clients])

  useEffect(() => {
    if (trainerSearchTerm.trim() === '') {
      setFilteredTrainers(allTrainers)
    } else {
      const filtered = allTrainers.filter(trainer =>
        `${trainer.first_name} ${trainer.last_name}`.toLowerCase().includes(trainerSearchTerm.toLowerCase()) ||
        trainer.email.toLowerCase().includes(trainerSearchTerm.toLowerCase()) ||
        trainer.city.toLowerCase().includes(trainerSearchTerm.toLowerCase())
      )
      setFilteredTrainers(filtered)
    }
  }, [trainerSearchTerm, allTrainers])

  const fetchClients = async () => {
    setIsLoading(true)
    try {
      // Fetch clients
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .eq('class_type', 'permanent')
        .order('created_at', { ascending: false })

      if (clientsError) throw clientsError

      // Get unique trainer IDs
      const trainerIds = [...new Set(clientsData?.filter(c => c.trainer_id).map(c => c.trainer_id))]

      if (trainerIds.length > 0) {
        // Fetch trainer profiles
        const { data: trainerProfiles, error: trainerError } = await supabase
          .from('trainer_profiles')
          .select('id, user_id')
          .in('id', trainerIds)

        if (trainerError) throw trainerError

        // Fetch user details from edge function
        const response = await fetch(`${import.meta.env.VITE_PROJECT_URL}/functions/v1/get-all-users`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_ANON_KEY}`
          }
        })

        if (!response.ok) throw new Error('Failed to fetch users')
        const users = await response.json()

        // Create a map of trainer_id -> trainer details
        const trainersMapping = {}
        trainerProfiles.forEach(profile => {
          const user = users.find(u => u.id === profile.user_id)
          if (user) {
            const metadata = user.user_metadata || {}
            trainersMapping[profile.id] = {
              id: profile.id,
              first_name: metadata.firstName || metadata.first_name || 'N/A',
              last_name: metadata.lastName || metadata.last_name || 'N/A',
              email: user.email || 'N/A',
              phone: metadata.phone || 'N/A',
              city: metadata.city || 'N/A'
            }
          }
        })

        setTrainersMap(trainersMapping)
      }

      setClients(clientsData || [])
    } catch (error) {
      console.error('Error fetching permanent clients:', error)
      alert('Failed to fetch clients: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const filterAndSortClients = () => {
    let result = [...clients]

    // Search filter
    if (searchTerm) {
      result = result.filter(client =>
        client.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm) ||
        client.city?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(client => client.status === statusFilter)
    }

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    setFilteredClients(result)
    setCurrentPage(1)
  }

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const handleDeleteClient = async (clientId) => {
    if (!confirm('Are you sure you want to delete this client?')) return

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) throw error
      alert('Client deleted successfully!')
      fetchClients()
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Failed to delete client: ' + error.message)
    }
  }

  const fetchAllTrainers = async () => {
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

      // Merge and filter for active trainers with approved KYC
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

      const activeTrainers = mergedTrainers.filter(t => t.is_active && t.kyc_status === 'approved')
      setAllTrainers(activeTrainers)
      setFilteredTrainers(activeTrainers)
    } catch (error) {
      console.error('Error fetching trainers:', error)
    }
  }

  const handleOpenAssignModal = (client) => {
    setSelectedClient(client)
    setSelectedTrainer(null)
    setTrainerSearchTerm('')
    // Reset fee data or load existing fee data if client already has fees
    setFeeData({
      total_fee: client.total_fee || '',
      platform_fee_percentage: client.platform_fee_percentage || '',
      trainer_income: client.trainer_income || '',
      fee_frequency: client.fee_frequency || 'monthly'
    })
    setShowAssignModal(true)
  }

  // Calculate trainer income when total fee or platform fee changes
  const handleFeeChange = (field, value) => {
    const updatedFeeData = { ...feeData, [field]: value }

    // Auto-calculate trainer income if both total_fee and platform_fee_percentage are set
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

  const handleAssignTrainer = async () => {
    if (!selectedTrainer) {
      alert('Please select a trainer')
      return
    }

    // Validate fee data for permanent clients
    if (!feeData.total_fee || !feeData.platform_fee_percentage) {
      alert('Please enter total fee and platform fee percentage')
      return
    }

    if (parseFloat(feeData.platform_fee_percentage) < 0 || parseFloat(feeData.platform_fee_percentage) > 100) {
      alert('Platform fee percentage must be between 0 and 100')
      return
    }

    setIsAssigning(true)
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          trainer_id: selectedTrainer.id,
          status: 'accepted',
          total_fee: parseFloat(feeData.total_fee),
          platform_fee_percentage: parseFloat(feeData.platform_fee_percentage),
          fee_frequency: feeData.fee_frequency
          // trainer_income will be auto-calculated by the database trigger
        })
        .eq('id', selectedClient.id)

      if (error) throw error

      // Create notification for trainer
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedTrainer.user_id,
          type: 'client_assigned',
          title: 'New Permanent Client Assigned',
          message: `${selectedClient.first_name} ${selectedClient.last_name} has been assigned to you as a permanent client.`,
          client_id: selectedClient.id,
          client_type: 'permanent'
        })
        .select()

      if (notifError) {
        console.error('Error creating notification:', notifError)
        alert('Warning: Notification could not be sent to trainer. Error: ' + notifError.message)
      }

      // Send email notification to trainer
      try {
        await sendClientAssignmentNotification(selectedTrainer.email, {
          clientName: `${selectedClient.first_name} ${selectedClient.last_name}`,
          clientEmail: selectedClient.email,
          clientPhone: selectedClient.phone,
          classType: 'permanent',
          assignedDate: new Date().toISOString()
        })
      } catch (emailError) {
        console.error('Error sending trainer email:', emailError)
      }

      alert('Trainer assigned successfully with fee details!')
      setShowAssignModal(false)
      setSelectedClient(null)
      setSelectedTrainer(null)
      setTrainerSearchTerm('')
      setFeeData({
        total_fee: '',
        platform_fee_percentage: '',
        trainer_income: '',
        fee_frequency: 'monthly'
      })
      fetchClients()
    } catch (error) {
      console.error('Error assigning trainer:', error)
      alert('Failed to assign trainer: ' + error.message)
    } finally {
      setIsAssigning(false)
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

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredClients.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)

  return (
    <div className="p-6 bg-[#fdfcf3] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#336b6e] mb-2">Permanent Clients</h1>
          <p className="text-[#336b6e] opacity-80">
            Manage all permanent clients and their trainer assignments
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Total Permanent Clients</h3>
              <Users className="w-5 h-5 text-[#336b6e]" />
            </div>
            <p className="text-3xl font-bold text-[#336b6e]">{clients.length}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Accepted</h3>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              {clients.filter(c => c.status === 'accepted').length}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Pending</h3>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              {clients.filter(c => c.status === 'pending').length}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Rejected</h3>
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-600">
              {clients.filter(c => c.status === 'rejected').length}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58] transition-colors duration-200"
                />
              </div>
            </div>

            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58] transition-colors duration-200 bg-white"
              >
                <option value="all">All Status</option>
                <option value="accepted">Accepted</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <button
              onClick={fetchClients}
              className="px-4 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors duration-200 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden md:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#336b6e] font-medium">Loading clients...</p>
              </div>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-bold text-[#336b6e] mb-2">No Clients Found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#fdfcf3] border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => handleSort('first_name')}
                          className="flex items-center gap-2 text-sm font-semibold text-[#336b6e]"
                        >
                          Name
                          {sortConfig.key === 'first_name' && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#336b6e]">Contact</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#336b6e]">Location</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#336b6e]">Trainer</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#336b6e]">Status</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[#336b6e]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentItems.map((client) => (
                      <tr key={client.id} className="hover:bg-[#fdfcf3] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {client.first_name?.[0]}{client.last_name?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-[#336b6e]">
                                {client.first_name} {client.last_name}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="text-[#336b6e]">{client.email}</div>
                            <div className="text-gray-500">{client.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#336b6e]">
                          {client.city}, {client.state}
                        </td>
                        <td className="px-6 py-4">
                          {client.trainer_id && trainersMap[client.trainer_id] ? (
                            <div className="text-sm">
                              <div className="font-semibold text-[#336b6e]">
                                {trainersMap[client.trainer_id].first_name} {trainersMap[client.trainer_id].last_name}
                              </div>
                              <div className="text-gray-500 text-xs">{trainersMap[client.trainer_id].email}</div>
                            </div>
                          ) : client.trainer_id ? (
                            <span className="text-sm text-yellow-600 font-medium">Loading...</span>
                          ) : (
                            <span className="text-sm text-gray-400">Not Assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(client.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => navigate(`/admin_dashboard/client/${client.id}`)}
                              className="p-2 text-[#336b6e] hover:bg-[#336b6e] hover:text-white rounded-lg transition-all"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleOpenAssignModal(client)}
                              className="p-2 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all"
                              title={client.trainer_id ? "Change Trainer" : "Assign Trainer"}
                            >
                              <UserCog className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClient(client.id)}
                              className="p-2 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all"
                              title="Delete Client"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-[#336b6e]">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredClients.length)} of {filteredClients.length}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-[#fdfcf3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`px-4 py-2 rounded-lg transition-colors ${currentPage === index + 1
                          ? 'bg-[#336b6e] text-white'
                          : 'border border-gray-200 hover:bg-[#fdfcf3]'
                          }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-[#fdfcf3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Assign/Change Trainer Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedClient?.trainer_id ? 'Change Trainer' : 'Assign Trainer'}
                  </h2>
                  <p className="text-white/80 mt-1">
                    For {selectedClient?.first_name} {selectedClient?.last_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Fee Management Section */}
              <div className="bg-gradient-to-br from-[#fdfcf3] to-white rounded-xl p-6 border-2 border-[#bb9f58]/20">
                <h3 className="text-lg font-bold text-[#336b6e] mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#bb9f58] rounded-full flex items-center justify-center text-white text-sm">₹</span>
                  Fee Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Total Fee */}
                  <div>
                    <label className="block text-sm font-semibold text-[#336b6e] mb-2">
                      Total Fee (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={feeData.total_fee}
                      onChange={(e) => handleFeeChange('total_fee', e.target.value)}
                      placeholder="e.g., 5000"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58] transition-all"
                      required
                    />
                  </div>

                  {/* Platform Fee Percentage */}
                  <div>
                    <label className="block text-sm font-semibold text-[#336b6e] mb-2">
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58] transition-all"
                      required
                    />
                  </div>

                  {/* Fee Frequency */}
                  <div>
                    <label className="block text-sm font-semibold text-[#336b6e] mb-2">
                      Payment Frequency
                    </label>
                    <select
                      value={feeData.fee_frequency}
                      onChange={(e) => handleFeeChange('fee_frequency', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58] transition-all appearance-none bg-white"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                      <option value="one_time">One Time</option>
                    </select>
                  </div>

                  {/* Trainer Income (Auto-calculated) */}
                  <div>
                    <label className="block text-sm font-semibold text-[#336b6e] mb-2">
                      Trainer Income (₹)
                    </label>
                    <div className="w-full px-4 py-3 bg-green-50 border-2 border-green-200 rounded-xl text-green-700 font-bold text-lg">
                      {feeData.trainer_income ? `₹${parseFloat(feeData.trainer_income).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Auto-calculated based on total fee and platform fee</p>
                  </div>
                </div>

                {/* Fee Breakdown */}
                {feeData.total_fee && feeData.platform_fee_percentage && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-semibold text-blue-800 mb-2">Fee Breakdown:</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-blue-600">Total Fee</p>
                        <p className="font-bold text-blue-900">₹{parseFloat(feeData.total_fee).toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Platform Fee ({feeData.platform_fee_percentage}%)</p>
                        <p className="font-bold text-blue-900">₹{(parseFloat(feeData.total_fee) * parseFloat(feeData.platform_fee_percentage) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Trainer Gets</p>
                        <p className="font-bold text-green-700">₹{parseFloat(feeData.trainer_income).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Bar */}
              <div>
                <label className="block text-sm font-semibold text-[#336b6e] mb-2">
                  Select Trainer
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search trainers by name, email, or city..."
                    value={trainerSearchTerm}
                    onChange={(e) => setTrainerSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58] transition-colors"
                  />
                </div>
              </div>

              {/* Trainers List */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredTrainers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <UserCog className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No trainers found</p>
                  </div>
                ) : (
                  filteredTrainers.map((trainer) => (
                    <div
                      key={trainer.id}
                      onClick={() => setSelectedTrainer(trainer)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedTrainer?.id === trainer.id
                        ? 'border-[#bb9f58] bg-[#fdfcf3]'
                        : 'border-gray-200 hover:border-[#336b6e] hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-lg">
                            {trainer.first_name?.[0]}{trainer.last_name?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[#336b6e] truncate">
                            {trainer.first_name} {trainer.last_name}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">{trainer.email}</p>
                          <p className="text-xs text-gray-500">
                            {trainer.city}, {trainer.state} • {trainer.experience} experience
                          </p>
                        </div>
                        {selectedTrainer?.id === trainer.id && (
                          <CheckCircle className="w-6 h-6 text-[#bb9f58] flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTrainer}
                disabled={!selectedTrainer || isAssigning}
                className="px-6 py-2.5 bg-gradient-to-r from-[#336b6e] to-[#2a5557] text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
              >
                {isAssigning ? 'Assigning...' : selectedClient?.trainer_id ? 'Change Trainer' : 'Assign Trainer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPermanentClients

