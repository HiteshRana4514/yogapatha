import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Eye,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  Users,
  AlertCircle
} from 'lucide-react'
import supabase from '../../supabase/supabse'
import { useOutletContext } from 'react-router-dom'

function DemoClients() {
  const { userData } = useOutletContext()
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedClient, setSelectedClient] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  // Fetch clients from Supabase
  useEffect(() => {
    const fetchClients = async () => {
      if (!userData) return

      setIsLoading(true)
      setErrorMessage('')

      try {
        // First, get the trainer's profile ID
        const { data: trainerProfile, error: profileError } = await supabase
          .from('trainer_profiles')
          .select('id, user_id')
          .eq('user_id', userData.id)
          .single()


        if (profileError) {
          console.error('Error fetching trainer profile:', profileError)
          setErrorMessage('Failed to load trainer profile')
          setIsLoading(false)
          return
        }

        if (!trainerProfile) {
          setClients([])
          setFilteredClients([])
          setIsLoading(false)
          return
        }


        // Fetch DEMO clients assigned to this trainer
        // clients.trainer_id contains the trainer_profiles.id (UUID)
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .eq('trainer_id', trainerProfile.id)
          .eq('class_type', 'demo')
          .order('created_at', { ascending: false })

        if (clientsError) {
          console.error('Error fetching clients:', clientsError)
          setErrorMessage('Failed to load clients')
          setIsLoading(false)
          return
        }


        // Transform data to match component structure
        const transformedClients = (clientsData || []).map(client => ({
          id: client.id,
          name: `${client.first_name} ${client.last_name}`,
          firstName: client.first_name,
          lastName: client.last_name,
          email: client.email,
          phone: client.phone || 'N/A',
          address: [client.street, client.city, client.state, client.pincode, client.country]
            .filter(Boolean)
            .join(', ') || 'N/A',
          street: client.street,
          city: client.city,
          state: client.state,
          pincode: client.pincode,
          country: client.country,
          classType: client.class_type || 'N/A',
          status: client.status || 'pending',
          joinedDate: client.created_at,
          updatedDate: client.updated_at,
        }))

        setClients(transformedClients)
        setFilteredClients(transformedClients)
      } catch (err) {
        console.error('Unexpected error:', err)
        setErrorMessage('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchClients()
  }, [userData])

  // Filter and search logic
  useEffect(() => {
    let filtered = clients

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter)
    }

    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery)
      )
    }

    setFilteredClients(filtered)
  }, [searchQuery, statusFilter, clients])

  const handleStatusChange = async (clientId, newStatus) => {
    try {
      // Update status in Supabase
      const { error } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', clientId)

      if (error) {
        console.error('Error updating client status:', error)
        setErrorMessage('Failed to update client status')
        return
      }

      // Update local state
      setClients(prevClients =>
        prevClients.map(client =>
          client.id === clientId ? { ...client, status: newStatus } : client
        )
      )

      if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient({ ...selectedClient, status: newStatus })
      }
    } catch (err) {
      console.error('Unexpected error updating status:', err)
      setErrorMessage('An unexpected error occurred')
    }
  }

  const openDetailModal = (client) => {
    setSelectedClient(client)
    setShowDetailModal(true)
  }

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setTimeout(() => setSelectedClient(null), 300)
  }

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
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        <IconComponent className="w-4 h-4" />
        {config.label}
      </span>
    )
  }

  const stats = {
    total: clients.length,
    accepted: clients.filter(c => c.status === 'accepted').length,
    pending: clients.filter(c => c.status === 'pending').length,
    rejected: clients.filter(c => c.status === 'rejected').length
  }

  return (
    <div className="p-6 bg-[#fdfcf3] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#336b6e] mb-2">Demo Clients</h1>
        <p className="text-[#336b6e] opacity-80">Manage and track your demo class clients</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-[#336b6e]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#336b6e] opacity-70 text-sm font-medium mb-1">Total Clients</p>
              <p className="text-3xl font-bold text-[#336b6e]">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-[#336b6e]/10 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-[#336b6e]" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#336b6e] opacity-70 text-sm font-medium mb-1">Accepted</p>
              <p className="text-3xl font-bold text-green-600">{stats.accepted}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#336b6e] opacity-70 text-sm font-medium mb-1">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#336b6e] opacity-70 text-sm font-medium mb-1">Rejected</p>
              <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-12 pr-10 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all duration-300 appearance-none cursor-pointer min-w-[200px]"
            >
              <option value="all">All Status</option>
              <option value="accepted">Accepted</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Clients Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#336b6e]"></div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-[#336b6e] opacity-30 mx-auto mb-4" />
            <p className="text-[#336b6e] opacity-70 text-lg">No clients found</p>
            <p className="text-[#336b6e] opacity-50 text-sm mt-2">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Your clients will appear here'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Client Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">City</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Class Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClients.map((client, index) => (
                  <tr
                    key={client.id}
                    className="hover:bg-[#fdfcf3] transition-colors duration-200"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#336b6e] to-[#bb9f58] rounded-full flex items-center justify-center text-white font-semibold">
                          {client.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-[#336b6e]">{client.name}</p>
                          <p className="text-xs text-[#336b6e] opacity-60">
                            Joined: {new Date(client.joinedDate).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#336b6e]">{client.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#336b6e]">{client.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[#336b6e]">{client.city || 'N/A'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        client.classType === 'demo'
                          ? 'bg-blue-100 text-blue-800'
                          : client.classType === 'permanent'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {client.classType === 'demo' ? 'Demo' : client.classType === 'permanent' ? 'Permanent' : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(client.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => openDetailModal(client)}
                          className="p-2 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-all duration-300 transform hover:scale-110"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
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

      {/* Detail Modal */}
      {showDetailModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300"
            style={{
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] p-6 text-white relative">
              <button
                onClick={closeDetailModal}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-[#bb9f58] rounded-full flex items-center justify-center text-2xl font-bold">
                  {selectedClient.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedClient.name}</h2>
                  <p className="opacity-90">Client Details</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-bold text-[#336b6e] mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Contact Information
                </h3>
                <div className="space-y-3 bg-[#fdfcf3] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-[#bb9f58] mt-0.5" />
                    <div>
                      <p className="text-sm text-[#336b6e] opacity-70">Email</p>
                      <p className="font-semibold text-[#336b6e]">{selectedClient.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-[#bb9f58] mt-0.5" />
                    <div>
                      <p className="text-sm text-[#336b6e] opacity-70">Phone Number</p>
                      <p className="font-semibold text-[#336b6e]">{selectedClient.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-[#bb9f58] mt-0.5" />
                    <div>
                      <p className="text-sm text-[#336b6e] opacity-70">Address</p>
                      <p className="font-semibold text-[#336b6e]">{selectedClient.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Class Information */}
              <div>
                <h3 className="text-lg font-bold text-[#336b6e] mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Client Information
                </h3>
                <div className="bg-[#fdfcf3] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[#336b6e] opacity-70">Class Type</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedClient.classType === 'demo'
                        ? 'bg-blue-100 text-blue-800'
                        : selectedClient.classType === 'permanent'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedClient.classType === 'demo' ? 'Demo Class' : selectedClient.classType === 'permanent' ? 'Permanent Client' : 'Not Set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#336b6e] opacity-70">Joined Date</span>
                    <span className="font-semibold text-[#336b6e]">
                      {new Date(selectedClient.joinedDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#336b6e] opacity-70">Last Updated</span>
                    <span className="font-semibold text-[#336b6e]">
                      {new Date(selectedClient.updatedDate).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Management */}
              <div>
                <h3 className="text-lg font-bold text-[#336b6e] mb-4">Client Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-[#fdfcf3] rounded-xl p-4">
                    <span className="text-[#336b6e] font-medium">Current Status:</span>
                    {getStatusBadge(selectedClient.status)}
                  </div>
                  
                  <div className="bg-[#fdfcf3] rounded-xl p-4">
                    <p className="text-sm text-[#336b6e] opacity-70 mb-3">Change Status:</p>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => handleStatusChange(selectedClient.id, 'accepted')}
                        disabled={selectedClient.status === 'accepted'}
                        className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                          selectedClient.status === 'accepted'
                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                            : 'bg-white border-2 border-green-500 text-green-700 hover:bg-green-500 hover:text-white transform hover:scale-105'
                        }`}
                      >
                        <CheckCircle className="w-5 h-5" />
                        Accept
                      </button>

                      <button
                        onClick={() => handleStatusChange(selectedClient.id, 'pending')}
                        disabled={selectedClient.status === 'pending'}
                        className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                          selectedClient.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                            : 'bg-white border-2 border-yellow-500 text-yellow-700 hover:bg-yellow-500 hover:text-white transform hover:scale-105'
                        }`}
                      >
                        <Clock className="w-5 h-5" />
                        Pending
                      </button>

                      <button
                        onClick={() => handleStatusChange(selectedClient.id, 'rejected')}
                        disabled={selectedClient.status === 'rejected'}
                        className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                          selectedClient.status === 'rejected'
                            ? 'bg-red-100 text-red-700 cursor-not-allowed'
                            : 'bg-white border-2 border-red-500 text-red-700 hover:bg-red-500 hover:text-white transform hover:scale-105'
                        }`}
                      >
                        <XCircle className="w-5 h-5" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <button
                onClick={closeDetailModal}
                className="w-full bg-[#336b6e] text-[#bb9f58] py-3 px-6 rounded-xl font-semibold hover:bg-[#2a5557] transition-all duration-300 transform hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style> */}
    </div>
  )
}

export default DemoClients
