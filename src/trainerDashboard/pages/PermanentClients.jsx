import { useState, useEffect } from 'react'
import {
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  Users,
  AlertCircle
} from 'lucide-react'
import supabase from '../../supabase/supabse'
import { useOutletContext, useNavigate } from 'react-router-dom'

function PermanentClients() {
  const { userData } = useOutletContext()
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  // Fetch permanent clients from Supabase
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


        // Fetch PERMANENT clients assigned to this trainer
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .eq('trainer_id', trainerProfile.id)
          .eq('class_type', 'permanent')
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

  // Search and filter logic
  useEffect(() => {
    let result = clients

    // Apply search filter
    if (searchQuery) {
      result = result.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery) ||
        client.city?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(client => client.status === statusFilter)
    }

    setFilteredClients(result)
  }, [searchQuery, statusFilter, clients])

  // Navigate to client detail page
  const viewClientDetails = (clientId) => {
    navigate(`/trainer_dashboard/client/${clientId}`)
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
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        <IconComponent className="w-4 h-4" />
        {config.label}
      </span>
    )
  }

  // Calculate stats
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
        <h1 className="text-3xl font-bold text-[#336b6e] mb-2">Permanent Clients</h1>
        <p className="text-[#336b6e] opacity-80">Manage and track your permanent clients</p>
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

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58] transition-colors duration-200"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-10 pr-10 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58] transition-colors duration-200 appearance-none bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="accepted">Accepted</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#336b6e]"></div>
            <p className="mt-4 text-[#336b6e] opacity-70">Loading permanent clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#336b6e] mb-2">No Permanent Clients Found</h3>
            <p className="text-[#336b6e] opacity-70">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'You don\'t have any permanent clients yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">City</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredClients.map((client, index) => (
                  <tr
                    key={client.id}
                    className={`hover:bg-[#fdfcf3] transition-colors duration-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#336b6e]">{client.name}</div>
                    </td>
                    <td className="px-6 py-4 text-[#336b6e] opacity-80">{client.email}</td>
                    <td className="px-6 py-4 text-[#336b6e] opacity-80">{client.phone}</td>
                    <td className="px-6 py-4 text-[#336b6e] opacity-80">{client.city || 'N/A'}</td>
                    <td className="px-6 py-4">
                      {getStatusBadge(client.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button
                          onClick={() => viewClientDetails(client.id)}
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
    </div>
  )
}

export default PermanentClients

