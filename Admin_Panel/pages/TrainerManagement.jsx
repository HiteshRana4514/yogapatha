import React, { useState, useEffect } from 'react'
import {
  Search,
  Eye,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  User,
  Award,
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Building,
  Users,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter,
  Power,
  PowerOff
} from 'lucide-react'
import TrainerDetailView from '../components/TrainerDetailView'
import supabase from '../../src/supabase/supabse'

// Trainers Table Component
function TrainersTable({ onViewTrainer }) {
  const [trainers, setTrainers] = useState([])
  const [filteredTrainers, setFilteredTrainers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [kycFilter, setKycFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const url = `${import.meta.env.VITE_PROJECT_URL}/functions/v1/get-all-users`;


  useEffect(() => {
    fetchTrainers()
  }, [])


  const fetchTrainers = async () => {
    setIsLoading(true)

    try {
      // Fetch all users from edge function API
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_ANON_KEY}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users from API')
      }

      const allUsers = await response.json()

      // Filter only trainers (users with role = 'trainer' in user_metadata)
      const trainerUsers = allUsers.filter(user =>
        user.user_metadata?.role === 'trainer'
      )

      if (!trainerUsers || trainerUsers.length === 0) {
        setTrainers([])
        setFilteredTrainers([])
        setIsLoading(false)
        return
      }

      // For each trainer user, get their trainer_profile (if exists) and client count
      const formattedTrainers = await Promise.all(
        trainerUsers.map(async (user) => {
          const metadata = user.user_metadata || {}

          // Get trainer_profile for this user (if exists)
          const { data: trainerProfile } = await supabase
            .from('trainer_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

          // Count clients for this trainer (using trainer_profile.id if exists)
          let clientCount = 0
          if (trainerProfile) {
            const { count } = await supabase
              .from('clients')
              .select('*', { count: 'exact', head: true })
              .eq('trainer_id', trainerProfile.id)
            clientCount = count || 0
          }

          // Merge user metadata from API and trainer_profile from database
          return {
            id: trainerProfile?.id || user.id, // Use trainer_profile.id if exists, otherwise user.id
            user_id: user.id, // Auth user ID
            // Personal info from user_metadata (API)
            first_name: metadata.firstName || metadata.first_name || 'N/A',
            last_name: metadata.lastName || metadata.last_name || 'N/A',
            email: user.email || 'N/A',
            phone: metadata.phone || 'N/A',
            city: metadata.city || 'N/A',
            state: metadata.state || 'N/A',
            address: metadata.address || 'N/A',
            pincode: metadata.pincode || 'N/A',
            location: metadata.location || 'N/A',
            bio: metadata.bio || '',
            experience: metadata.experience || 'N/A',
            specializations: Array.isArray(metadata.specializations)
              ? metadata.specializations
              : [],
            // Certifications: Prefer trainer_profiles.certifications (new JSONB), fallback to user_metadata
            // Note: certifications is a separate field from certificate_documents
            certifications: trainerProfile?.certifications || metadata.certifications || [],
            // Trainer profile specific fields from trainer_profiles table
            kyc_status: trainerProfile?.kyc_status || 'pending',
            partnership_status: trainerProfile?.partnership_status || null,
            wants_partnership: trainerProfile?.wants_partnership || false,
            is_partner: trainerProfile?.partnership_status === 'approved',
            academy_name: trainerProfile?.academy_name || null,
            academy_address: trainerProfile?.academy_address || null,
            academy_logo_url: trainerProfile?.academy_logo_url || null,
            avatar_url: trainerProfile?.avatar_url || null,
            identity_card_url: trainerProfile?.identity_card_url || null,
            certificate_documents: trainerProfile?.certificate_documents || [],
            verified_at: trainerProfile?.verified_at || null,
            is_active: trainerProfile?.is_active !== undefined ? trainerProfile.is_active : true,
            client_count: clientCount,
            created_at: user.created_at,
            updated_at: user.updated_at,
            has_trainer_profile: !!trainerProfile // Flag to know if trainer_profile exists
          }
        })
      )

      setTrainers(formattedTrainers)
      setFilteredTrainers(formattedTrainers)
    } catch (error) {
      console.error('Error fetching trainers:', error)
      alert('Failed to fetch trainers: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let result = [...trainers]

    if (searchTerm) {
      result = result.filter(trainer =>
        trainer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        trainer.location.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (kycFilter !== 'all') {
      result = result.filter(trainer => trainer.kyc_status === kycFilter)
    }

    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    setFilteredTrainers(result)
    setCurrentPage(1)
  }, [searchTerm, kycFilter, sortConfig, trainers])

  const handleSort = (key) => {
    let direction = 'asc'
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const toggleTrainerStatus = async (trainerId, currentStatus) => {
    const newStatus = !currentStatus

    try {
      const { error } = await supabase
        .from('trainer_profiles')
        .update({ is_active: newStatus })
        .eq('id', trainerId)

      if (error) {
        console.error('Error updating trainer status:', error)
        alert('Failed to update trainer status')
        return
      }

      // Update local state
      setTrainers(prevTrainers =>
        prevTrainers.map(trainer =>
          trainer.id === trainerId
            ? { ...trainer, is_active: newStatus }
            : trainer
        )
      )

      alert(`Trainer ${newStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (err) {
      console.error('Unexpected error:', err)
      alert('An unexpected error occurred')
    }
  }

  const getKYCBadge = (status) => {
    const config = {
      approved: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle, label: 'Approved' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock, label: 'Pending' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle, label: 'Rejected' }
    }

    const { bg, text, icon: Icon, label } = config[status]

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
    )
  }

  const getActiveBadge = (isActive) => {
    return isActive ? (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
        <XCircle className="w-3 h-3" />
        Inactive
      </span>
    )
  }

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredTrainers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredTrainers.length / itemsPerPage)

  return (
    <div className="p-6 bg-[#fdfcf3] min-h-screen">
      <div className="max-w-7xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#336b6e] mb-2">Trainer Management</h1>
          <p className="text-[#336b6e] opacity-80">
            Manage trainer profiles, verify KYC documents, and assign clients
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Total Trainers</h3>
              <Users className="w-5 h-5 text-[#336b6e]" />
            </div>
            <p className="text-3xl font-bold text-[#336b6e]">{trainers.length}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">KYC Approved</h3>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-green-600">
              {trainers.filter(t => t.kyc_status === 'approved').length}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Pending KYC</h3>
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-3xl font-bold text-yellow-600">
              {trainers.filter(t => t.kyc_status === 'pending').length}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-gray-600 text-sm font-medium">Partners</h3>
              <Building className="w-5 h-5 text-[#bb9f58]" />
            </div>
            <p className="text-3xl font-bold text-[#bb9f58]">
              {trainers.filter(t => t.is_partner).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trainers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58]"
                />
              </div>
            </div>

            <select
              value={kycFilter}
              onChange={(e) => setKycFilter(e.target.value)}
              className="md:w-48 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58] bg-white"
            >
              <option value="all">All KYC Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>

            <button
              onClick={fetchTrainers}
              className="px-4 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#336b6e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#336b6e] font-medium">Loading trainers...</p>
              </div>
            </div>
          ) : currentItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-bold text-[#336b6e] mb-2">No Trainers Found</h3>
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
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#336b6e]">Experience</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#336b6e]">Clients</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#336b6e]">KYC Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-[#336b6e]">Account Status</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-[#336b6e]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentItems.map((trainer) => (
                      <tr key={trainer.id} className="hover:bg-[#fdfcf3] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {trainer.first_name[0]}{trainer.last_name[0]}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-[#336b6e]">
                                {trainer.first_name} {trainer.last_name}
                              </p>
                              {trainer.is_partner && (
                                <span className="text-xs text-[#bb9f58] font-semibold">Partner</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="text-[#336b6e]">{trainer.email}</div>
                            <div className="text-gray-500">{trainer.phone}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[#336b6e]">
                          {trainer.city}, {trainer.state}
                        </td>
                        <td className="px-6 py-4 text-[#336b6e]">
                          {trainer.experience}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                            {trainer.client_count}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {getKYCBadge(trainer.kyc_status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getActiveBadge(trainer.is_active)}
                            <button
                              onClick={() => toggleTrainerStatus(trainer.id, trainer.is_active)}
                              className={`p-2 rounded-lg transition-all ${trainer.is_active
                                  ? 'text-red-600 hover:bg-red-100'
                                  : 'text-green-600 hover:bg-green-100'
                                }`}
                              title={trainer.is_active ? 'Deactivate Trainer' : 'Activate Trainer'}
                            >
                              {trainer.is_active ? (
                                <PowerOff className="w-5 h-5" />
                              ) : (
                                <Power className="w-5 h-5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => onViewTrainer(trainer)}
                              className="p-2 text-[#336b6e] hover:bg-[#336b6e] hover:text-white rounded-lg transition-all"
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

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-[#336b6e]">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredTrainers.length)} of {filteredTrainers.length}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border rounded-lg hover:bg-[#fdfcf3] disabled:opacity-50"
                    >
                      Previous
                    </button>
                    {[...Array(totalPages)].map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`px-4 py-2 rounded-lg ${currentPage === index + 1
                            ? 'bg-[#336b6e] text-white'
                            : 'border hover:bg-[#fdfcf3]'
                          }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border rounded-lg hover:bg-[#fdfcf3] disabled:opacity-50"
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
    </div>
  )
}

// Trainer Detail View Component
<TrainerDetailView />

// Main Component
function TrainerManagement() {
  const [selectedTrainer, setSelectedTrainer] = useState(null)

  return (
    <>
      {!selectedTrainer ? (
        <TrainersTable onViewTrainer={setSelectedTrainer} />
      ) : (
        <TrainerDetailView
          trainer={selectedTrainer}
          onBack={() => setSelectedTrainer(null)}
        />
      )}
    </>
  )
}

export default TrainerManagement