import { useState, useEffect } from 'react'
import {
  Users,
  UserCog,
  TrendingUp,
  Calendar,
  Activity,
  Award,
  Clock,
  X,
  Mail,
  MapPin,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  User,
  FileText,
  Briefcase,
  UserCheck,
  UserX,
  ArrowUpRight,
  Settings
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import supabase from '../../src/supabase/supabse'

function AdminDashboardContent({ userData }) {
  const navigate = useNavigate()
  const [showAddTrainerModal, setShowAddTrainerModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [copiedField, setCopiedField] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showAddClientModal, setShowAddClientModal] = useState(false)
  const [allTrainersList, setAllTrainersList] = useState([])
  const [newClientData, setNewClientData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    country: '',
    class_type: 'demo',
    trainer_id: ''
  })

  // Real-time stats
  const [stats, setStats] = useState({
    totalTrainers: 0,
    activeTrainers: 0,
    totalClients: 0,
    demoClients: 0,
    permanentClients: 0,
    pendingQueries: 0,
    totalServices: 0,
    activeServices: 0
  })

  const [recentActivities, setRecentActivities] = useState([])
  const [topTrainers, setTopTrainers] = useState([])
  const [clientStats, setClientStats] = useState({
    pending: 0,
    accepted: 0,
    rejected: 0
  })

  const [trainerData, setTrainerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    location: '',
    kycApproved: false
  })

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    try {
      await Promise.all([
        fetchStats(),
        fetchRecentActivities(),
        fetchTopTrainers(),
        fetchClientStats(),
        fetchAllTrainersList()
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch trainers count
      const { data: trainers, error: trainersError } = await supabase
        .from('trainer_profiles')
        .select('id, is_active')

      if (trainersError) throw trainersError

      // Fetch clients count
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, class_type, status')

      if (clientsError) throw clientsError

      // Fetch services count
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id, is_active')

      if (servicesError) throw servicesError

      setStats({
        totalTrainers: trainers?.length || 0,
        activeTrainers: trainers?.filter(t => t.is_active).length || 0,
        totalClients: clients?.length || 0,
        demoClients: clients?.filter(c => c.class_type === 'demo').length || 0,
        permanentClients: clients?.filter(c => c.class_type === 'permanent').length || 0,
        pendingQueries: clients?.filter(c => c.status === 'pending').length || 0,
        totalServices: services?.length || 0,
        activeServices: services?.filter(s => s.is_active).length || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchRecentActivities = async () => {
    try {
      // Fetch recent clients
      const { data: recentClients, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, class_type, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      const activities = recentClients?.map(client => ({
        id: client.id,
        action: client.class_type === 'demo' ? 'New demo class request' : 'New permanent client enrolled',
        name: `${client.first_name} ${client.last_name}`,
        time: formatTimeAgo(client.created_at),
        type: client.class_type,
        status: client.status
      })) || []

      setRecentActivities(activities)
    } catch (error) {
      console.error('Error fetching recent activities:', error)
    }
  }

  const fetchTopTrainers = async () => {
    try {
      // Fetch trainers with client count
      const { data: trainers, error } = await supabase
        .from('trainer_profiles')
        .select(`
          id,
          user_id,
          is_active,
          kyc_status
        `)
        .eq('is_active', true)
        .limit(10)

      if (error) throw error

      // Fetch profiles for trainer names
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', trainers?.map(t => t.user_id) || [])

      if (profilesError) throw profilesError

      // Fetch client counts for each trainer
      const trainersWithStats = await Promise.all(
        trainers?.map(async (trainer) => {
          const { data: clients } = await supabase
            .from('clients')
            .select('id')
            .eq('trainer_id', trainer.user_id)

          const profile = profiles?.find(p => p.id === trainer.user_id)

          return {
            id: trainer.id,
            name: profile?.email?.split('@')[0] || 'Unknown',
            clients: clients?.length || 0,
            rating: 4.5 + Math.random() * 0.5, // Mock rating for now
            kycStatus: trainer.kyc_status
          }
        }) || []
      )

      // Sort by client count and take top 4
      const sorted = trainersWithStats
        .sort((a, b) => b.clients - a.clients)
        .slice(0, 4)

      setTopTrainers(sorted)
    } catch (error) {
      console.error('Error fetching top trainers:', error)
    }
  }

  const fetchAllTrainersList = async () => {
    try {
      const { data: trainers, error } = await supabase
        .from('trainer_profiles')
        .select(`
          id,
          user_id,
          is_active
        `)
        .eq('is_active', true)

      if (error) throw error

      // Fetch user names
      const { data: users, error: usersError } = await fetch(`${import.meta.env.VITE_PROJECT_URL}/functions/v1/get-all-users`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_ANON_KEY}`
        }
      }).then(res => res.json().then(data => ({ data, error: !res.ok })))

      if (usersError) throw new Error('Failed to fetch users')

      const trainersWithNames = trainers.map(trainer => {
        const user = users.find(u => u.id === trainer.user_id)
        if (user) {
          const metadata = user.user_metadata || {}
          return {
            id: trainer.id,
            name: `${metadata.firstName || metadata.first_name || ''} ${metadata.lastName || metadata.last_name || ''}`.trim() || user.email.split('@')[0]
          }
        }
        return null
      }).filter(Boolean)

      setAllTrainersList(trainersWithNames)
    } catch (error) {
      console.error('Error fetching all trainers:', error)
    }
  }

  const fetchClientStats = async () => {
    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('status')

      if (error) throw error

      setClientStats({
        pending: clients?.filter(c => c.status === 'pending').length || 0,
        accepted: clients?.filter(c => c.status === 'accepted').length || 0,
        rejected: clients?.filter(c => c.status === 'rejected').length || 0
      })
    } catch (error) {
      console.error('Error fetching client stats:', error)
    }
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now - date) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  // Generate random password
  const generatePassword = () => {
    const length = 12
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""

    // Ensure at least one of each required character type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]
    password += "0123456789"[Math.floor(Math.random() * 10)]
    password += "!@#$%^&*"[Math.floor(Math.random() * 8)]

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)]
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  const handleOpenModal = () => {
    setShowAddTrainerModal(true)
    setSuccessData(null)
    setErrorMessage('')
    setTrainerData({
      firstName: '',
      lastName: '',
      email: '',
      password: generatePassword(),
      location: '',
      kycApproved: false
    })
  }

  const handleCloseModal = () => {
    setShowAddTrainerModal(false)
    setSuccessData(null)
    setErrorMessage('')
    setTrainerData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      location: '',
      kycApproved: false
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setTrainerData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    if (!trainerData.firstName.trim()) {
      setErrorMessage('First name is required')
      return false
    }
    if (!trainerData.lastName.trim()) {
      setErrorMessage('Last name is required')
      return false
    }
    if (!trainerData.email.trim()) {
      setErrorMessage('Email is required')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trainerData.email)) {
      setErrorMessage('Please enter a valid email address')
      return false
    }
    if (!trainerData.password) {
      setErrorMessage('Password is required')
      return false
    }
    if (trainerData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters')
      return false
    }
    if (!trainerData.location.trim()) {
      setErrorMessage('Location is required')
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const url = `${import.meta.env.VITE_PROJECT_URL}/functions/v1/create-trainer`

      // Get the current session token
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_ANON_KEY}`,
        },
        body: JSON.stringify(trainerData)
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create trainer')
      }

      setSuccessData(data.user)

    } catch (error) {
      console.error('Error creating trainer:', error)
      setErrorMessage(error.message || 'Failed to create trainer. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenAddClientModal = () => {
    setNewClientData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: '',
      class_type: 'demo',
      trainer_id: ''
    })
    setErrorMessage('')
    setShowAddClientModal(true)
  }

  const handleAddClient = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    // Basic validation
    if (!newClientData.firstName.trim() || !newClientData.lastName.trim() || !newClientData.email.trim() || !newClientData.phone.trim()) {
      setErrorMessage('Please fill in all required fields (Name, Email, Phone)')
      return
    }

    if (!newClientData.trainer_id) {
      setErrorMessage('Please select a trainer')
      return
    }

    setIsSubmitting(true)

    try {
      // Check for duplicate email
      const { data: existingClient, error: checkError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', newClientData.email)
        .maybeSingle()

      if (checkError) throw checkError
      if (existingClient) {
        setErrorMessage('A client with this email already exists.')
        setIsSubmitting(false)
        return
      }

      // Insert client
      const { error: insertError } = await supabase
        .from('clients')
        .insert([{
          first_name: newClientData.firstName,
          last_name: newClientData.lastName,
          email: newClientData.email,
          phone: newClientData.phone,
          street: newClientData.street,
          city: newClientData.city,
          state: newClientData.state,
          pincode: newClientData.pincode,
          country: newClientData.country,
          class_type: newClientData.class_type,
          trainer_id: newClientData.trainer_id,
          status: newClientData.class_type === 'demo' ? 'accepted' : 'onboarded'
        }])

      if (insertError) throw insertError

      // Create notification for trainer
      const selectedTrainerProfile = allTrainersList.find(t => t.id === newClientData.trainer_id)
      if (selectedTrainerProfile) {
        // Need to find user_id for notification
        const { data: tProfile } = await supabase
          .from('trainer_profiles')
          .select('user_id')
          .eq('id', newClientData.trainer_id)
          .single()

        if (tProfile) {
          await supabase
            .from('notifications')
            .insert({
              user_id: tProfile.user_id,
              type: 'client_assigned',
              title: 'New Client Assigned',
              message: `You have been assigned a new ${newClientData.class_type} client: ${newClientData.firstName} ${newClientData.lastName}`,
              read: false
            })
        }
      }

      // Success
      setShowAddClientModal(false)
      fetchDashboardData() // Refresh stats
      alert('Client added successfully!')

    } catch (error) {
      console.error('Error adding client:', error)
      setErrorMessage(error.message || 'Failed to add client. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  const statsCards = [
    {
      title: 'Total Trainers',
      value: stats.totalTrainers,
      subtitle: `${stats.activeTrainers} active`,
      icon: UserCog,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      link: '/admin_dashboard/trainer_management'
    },
    {
      title: 'Total Clients',
      value: stats.totalClients,
      subtitle: `${stats.demoClients} demo, ${stats.permanentClients} permanent`,
      icon: Users,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      link: '/admin_dashboard/demo_clients'
    },
    {
      title: 'Pending Queries',
      value: stats.pendingQueries,
      subtitle: 'Awaiting assignment',
      icon: FileText,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      link: '/admin_dashboard/clients_querry'
    },
    {
      title: 'Services',
      value: stats.totalServices,
      subtitle: `${stats.activeServices} active`,
      icon: Briefcase,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      link: '/admin_dashboard/service_management'
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#336b6e] animate-spin mx-auto mb-4" />
          <p className="text-[#336b6e] font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-[#fdfcf3] to-white min-h-screen">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              Welcome back, {userData?.user_metadata?.firstName || 'Admin'}! 👋
            </h2>
            <p className="text-lg text-white/80">
              Here's what's happening with your fitness platform today.
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            title="Refresh data"
          >
            <TrendingUp className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              onClick={() => stat.link && navigate(stat.link)}
              className={`bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl hover:border-[#bb9f58] transition-all ${stat.link ? 'cursor-pointer transform hover:scale-105' : ''
                }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.bgColor} p-4 rounded-xl`}>
                  <Icon className={`w-7 h-7 ${stat.iconColor}`} />
                </div>
                {stat.link && (
                  <ArrowUpRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1 uppercase tracking-wide">{stat.title}</h3>
              <p className="text-4xl font-bold text-[#336b6e] mb-2">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.subtitle}</p>
            </div>
          )
        })}
      </div>

      {/* Client Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Pending</p>
              <p className="text-3xl font-bold text-[#336b6e]">{clientStats.pending}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Awaiting trainer assignment</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Accepted</p>
              <p className="text-3xl font-bold text-[#336b6e]">{clientStats.accepted}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Active with trainers</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Rejected</p>
              <p className="text-3xl font-bold text-[#336b6e]">{clientStats.rejected}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Declined requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#336b6e] flex items-center gap-2">
              <Clock className="w-6 h-6 text-[#bb9f58]" />
              Recent Activities
            </h3>
            <button
              onClick={() => navigate('/admin_dashboard/clients_querry')}
              className="text-sm text-[#bb9f58] hover:text-[#336b6e] font-medium flex items-center gap-1"
            >
              View All
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No recent activities</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="flex items-start gap-4 p-4 rounded-xl hover:bg-[#fdfcf3] transition-all border border-transparent hover:border-[#bb9f58] cursor-pointer"
                  onClick={() => navigate(`/admin_dashboard/client/${activity.id}`)}
                >
                  <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${activity.type === 'demo' ? 'bg-blue-500' : 'bg-green-500'
                    }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#336b6e] mb-1">{activity.action}</p>
                    <p className="text-sm text-gray-600 truncate">{activity.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${activity.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        activity.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {activity.status}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">{activity.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Trainers */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#336b6e] flex items-center gap-2">
              <Award className="w-6 h-6 text-[#bb9f58]" />
              Top Trainers
            </h3>
            <button
              onClick={() => navigate('/admin_dashboard/trainer_management')}
              className="text-sm text-[#bb9f58] hover:text-[#336b6e] font-medium flex items-center gap-1"
            >
              View All
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          {topTrainers.length === 0 ? (
            <div className="text-center py-8">
              <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No trainers yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topTrainers.map((trainer, index) => (
                <div key={trainer.id || index} className="flex items-center gap-4 p-4 rounded-xl hover:bg-[#fdfcf3] transition-all border border-transparent hover:border-[#bb9f58]">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center text-[#bb9f58] font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-[#336b6e] mb-1">{trainer.name}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {trainer.clients} clients
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${trainer.kycStatus === 'approved' ? 'bg-green-100 text-green-700' :
                        trainer.kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                        {trainer.kycStatus}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                      <span className="text-yellow-500">★</span>
                      <span className="font-bold text-[#336b6e]">{trainer.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
        <h3 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-[#bb9f58]" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button
            onClick={handleOpenAddClientModal}
            className="p-5 rounded-xl border-2 border-gray-200 hover:border-[#bb9f58] hover:bg-[#fdfcf3] hover:shadow-lg transition-all text-center group transform hover:scale-105"
          >
            <Users className="w-10 h-10 text-[#336b6e] mx-auto mb-3 group-hover:text-[#bb9f58] transition-colors" />
            <p className="text-sm font-semibold text-[#336b6e]">Add Client</p>
          </button>

          <button
            onClick={() => navigate('/admin_dashboard/trainer_management')}
            className="p-5 rounded-xl border-2 border-gray-200 hover:border-[#bb9f58] hover:bg-[#fdfcf3] hover:shadow-lg transition-all text-center group transform hover:scale-105"
          >
            <Users className="w-10 h-10 text-[#336b6e] mx-auto mb-3 group-hover:text-[#bb9f58] transition-colors" />
            <p className="text-sm font-semibold text-[#336b6e]">Trainers</p>
          </button>

          <button
            onClick={() => navigate('/admin_dashboard/clients_querry')}
            className="p-5 rounded-xl border-2 border-gray-200 hover:border-[#bb9f58] hover:bg-[#fdfcf3] hover:shadow-lg transition-all text-center group transform hover:scale-105"
          >
            <FileText className="w-10 h-10 text-[#336b6e] mx-auto mb-3 group-hover:text-[#bb9f58] transition-colors" />
            <p className="text-sm font-semibold text-[#336b6e]">Queries</p>
          </button>

          <button
            onClick={() => navigate('/admin_dashboard/demo_clients')}
            className="p-5 rounded-xl border-2 border-gray-200 hover:border-[#bb9f58] hover:bg-[#fdfcf3] hover:shadow-lg transition-all text-center group transform hover:scale-105"
          >
            <Calendar className="w-10 h-10 text-[#336b6e] mx-auto mb-3 group-hover:text-[#bb9f58] transition-colors" />
            <p className="text-sm font-semibold text-[#336b6e]">Demo Clients</p>
          </button>

          <button
            onClick={() => navigate('/admin_dashboard/service_management')}
            className="p-5 rounded-xl border-2 border-gray-200 hover:border-[#bb9f58] hover:bg-[#fdfcf3] hover:shadow-lg transition-all text-center group transform hover:scale-105"
          >
            <Briefcase className="w-10 h-10 text-[#336b6e] mx-auto mb-3 group-hover:text-[#bb9f58] transition-colors" />
            <p className="text-sm font-semibold text-[#336b6e]">Services</p>
          </button>

          <button
            onClick={() => navigate('/admin_dashboard/settings')}
            className="p-5 rounded-xl border-2 border-gray-200 hover:border-[#bb9f58] hover:bg-[#fdfcf3] hover:shadow-lg transition-all text-center group transform hover:scale-105"
          >
            <Settings className="w-10 h-10 text-[#336b6e] mx-auto mb-3 group-hover:text-[#bb9f58] transition-colors" />
            <p className="text-sm font-semibold text-[#336b6e]">Settings</p>
          </button>
        </div>
      </div>

      {/* Add Trainer Modal */}
      {showAddTrainerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <UserCog className="w-6 h-6" />
                  {successData ? 'Trainer Created Successfully!' : 'Add New Trainer'}
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  {successData ? 'Save these credentials for the trainer' : 'Create a new trainer account with auto-generated password'}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {successData ? (
                // Success View
                <div className="space-y-6">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900">Trainer account created successfully!</p>
                      <p className="text-sm text-green-700 mt-1">
                        The trainer can now log in with these credentials. Make sure to save the password as it won't be shown again.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-[#fdfcf3] rounded-xl p-4 border-2 border-[#bb9f58]">
                      <label className="block text-sm font-medium text-[#336b6e] mb-2">
                        First Name
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-lg font-semibold text-[#336b6e]">{successData.firstName}</p>
                        <button
                          onClick={() => handleCopy(successData.firstName, 'firstName')}
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                          title="Copy"
                        >
                          {copiedField === 'firstName' ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <Copy className="w-5 h-5 text-[#336b6e]" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#fdfcf3] rounded-xl p-4 border-2 border-[#bb9f58]">
                      <label className="block text-sm font-medium text-[#336b6e] mb-2">
                        Last Name
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-lg font-semibold text-[#336b6e]">{successData.lastName}</p>
                        <button
                          onClick={() => handleCopy(successData.lastName, 'lastName')}
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                          title="Copy"
                        >
                          {copiedField === 'lastName' ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <Copy className="w-5 h-5 text-[#336b6e]" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#fdfcf3] rounded-xl p-4 border-2 border-[#bb9f58]">
                      <label className="flex items-center gap-2 text-sm font-medium text-[#336b6e] mb-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-lg font-semibold text-[#336b6e] break-all">{successData.email}</p>
                        <button
                          onClick={() => handleCopy(successData.email, 'email')}
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                          title="Copy"
                        >
                          {copiedField === 'email' ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <Copy className="w-5 h-5 text-[#336b6e]" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-red-50 rounded-xl p-4 border-2 border-red-300">
                      <label className="flex items-center gap-2 text-sm font-medium text-red-900 mb-2">
                        <Lock className="w-4 h-4" />
                        Generated Password (Save this!)
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-lg font-mono font-bold text-red-900 break-all">{successData.password}</p>
                        <button
                          onClick={() => handleCopy(successData.password, 'password')}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Copy"
                        >
                          {copiedField === 'password' ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <Copy className="w-5 h-5 text-red-900" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-red-700 mt-2">
                        ⚠️ This password will not be shown again. Make sure to copy and share it with the trainer.
                      </p>
                    </div>

                    <div className="bg-[#fdfcf3] rounded-xl p-4 border-2 border-[#bb9f58]">
                      <label className="flex items-center gap-2 text-sm font-medium text-[#336b6e] mb-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </label>
                      <div className="flex items-center gap-2">
                        <p className="flex-1 text-lg font-semibold text-[#336b6e]">{successData.location}</p>
                        <button
                          onClick={() => handleCopy(successData.location, 'location')}
                          className="p-2 hover:bg-white rounded-lg transition-colors"
                          title="Copy"
                        >
                          {copiedField === 'location' ? (
                            <Check className="w-5 h-5 text-green-500" />
                          ) : (
                            <Copy className="w-5 h-5 text-[#336b6e]" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className={`rounded-xl p-4 border-2 ${successData.kycStatus === 'approved'
                      ? 'bg-green-50 border-green-300'
                      : 'bg-yellow-50 border-yellow-300'
                      }`}>
                      <label className="flex items-center gap-2 text-sm font-medium mb-2">
                        <CheckCircle className={`w-4 h-4 ${successData.kycStatus === 'approved' ? 'text-green-700' : 'text-yellow-700'
                          }`} />
                        <span className={successData.kycStatus === 'approved' ? 'text-green-900' : 'text-yellow-900'}>
                          KYC Status
                        </span>
                      </label>
                      <div className="flex items-center gap-2">
                        <p className={`flex-1 text-lg font-semibold ${successData.kycStatus === 'approved' ? 'text-green-900' : 'text-yellow-900'
                          }`}>
                          {successData.kycStatus === 'approved' ? '✅ Approved' : '⏳ Pending'}
                        </p>
                      </div>
                      <p className={`text-xs mt-2 ${successData.kycStatus === 'approved' ? 'text-green-700' : 'text-yellow-700'
                        }`}>
                        {successData.kycStatus === 'approved'
                          ? 'This trainer has been approved and can start accepting clients immediately.'
                          : 'This trainer will need KYC approval before they can accept clients.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCloseModal}
                    className="w-full bg-[#336b6e] text-[#bb9f58] py-3 px-6 rounded-xl font-semibold hover:bg-[#2a5557] transition-all"
                  >
                    Close
                  </button>
                </div>
              ) : (
                // Form View
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#336b6e] mb-2">
                        First Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                        <input
                          type="text"
                          name="firstName"
                          value={trainerData.firstName}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
                          placeholder="First name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#336b6e] mb-2">
                        Last Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                        <input
                          type="text"
                          name="lastName"
                          value={trainerData.lastName}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
                          placeholder="Last name"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#336b6e] mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                      <input
                        type="email"
                        name="email"
                        value={trainerData.email}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
                        placeholder="trainer@example.com"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Email will be auto-confirmed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#336b6e] mb-2">
                      Auto-Generated Password *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={trainerData.password}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-24 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all font-mono"
                        required
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                        <button
                          type="button"
                          onClick={() => setTrainerData(prev => ({ ...prev, password: generatePassword() }))}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-xs font-medium text-[#336b6e]"
                          title="Regenerate"
                        >
                          🔄
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title={showPassword ? 'Hide' : 'Show'}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5 text-[#336b6e]" /> : <Eye className="w-5 h-5 text-[#336b6e]" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Click 🔄 to generate a new password</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#336b6e] mb-2">
                      Location *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#336b6e] opacity-50" />
                      <input
                        type="text"
                        name="location"
                        value={trainerData.location}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-[#fdfcf3]/50 focus:bg-white focus:border-[#bb9f58] focus:outline-none transition-all"
                        placeholder="City, State"
                        required
                      />
                    </div>
                  </div>

                  {/* KYC Approval Checkbox */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={trainerData.kycApproved}
                        onChange={(e) => setTrainerData(prev => ({ ...prev, kycApproved: e.target.checked }))}
                        className="mt-1 w-5 h-5 text-[#336b6e] border-2 border-gray-300 rounded focus:ring-2 focus:ring-[#bb9f58] cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-[#336b6e] mb-1">
                          Approve KYC Immediately
                        </p>
                        <p className="text-sm text-gray-600">
                          Check this box to set the trainer's KYC status to "Approved" upon creation.
                          If unchecked, KYC status will be set to "Pending" and will need to be approved later.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 bg-gradient-to-r from-[#336b6e] to-[#2a5557] text-[#bb9f58] py-3 px-6 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <UserCog className="w-5 h-5" />
                          Create Trainer
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#336b6e] to-[#2a5557] text-white p-6 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <UserCheck className="w-6 h-6" />
                  Add New Client
                </h2>
                <p className="text-white/80 text-sm mt-1">Manual client creation with trainer assignment</p>
              </div>
              <button
                onClick={() => setShowAddClientModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleAddClient} className="p-6 space-y-8">
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {errorMessage}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#336b6e] border-b pb-2 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      required
                      value={newClientData.firstName}
                      onChange={(e) => setNewClientData({ ...newClientData, firstName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58]"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={newClientData.lastName}
                      onChange={(e) => setNewClientData({ ...newClientData, lastName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58]"
                      placeholder="Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={newClientData.email}
                      onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58]"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={newClientData.phone}
                      onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58]"
                      placeholder="+91 0000000000"
                    />
                  </div>
                </div>
              </div>

              {/* Assignment Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#336b6e] border-b pb-2 flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Assignment Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Class Type</label>
                    <select
                      value={newClientData.class_type}
                      onChange={(e) => setNewClientData({ ...newClientData, class_type: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58]"
                    >
                      <option value="demo">Demo Class</option>
                      <option value="permanent">Permanent Class</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Assign Trainer *</label>
                    <select
                      required
                      value={newClientData.trainer_id}
                      onChange={(e) => setNewClientData({ ...newClientData, trainer_id: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58]"
                    >
                      <option value="">Select a Trainer</option>
                      {allTrainersList.map(trainer => (
                        <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#336b6e] border-b pb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Address Information (Optional)
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                    <input
                      type="text"
                      value={newClientData.street}
                      onChange={(e) => setNewClientData({ ...newClientData, street: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58]"
                      placeholder="123 Yoga St"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        value={newClientData.city}
                        onChange={(e) => setNewClientData({ ...newClientData, city: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58]"
                        placeholder="City"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">State</label>
                      <input
                        type="text"
                        value={newClientData.state}
                        onChange={(e) => setNewClientData({ ...newClientData, state: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58]"
                        placeholder="State"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Pincode</label>
                      <input
                        type="text"
                        value={newClientData.pincode}
                        onChange={(e) => setNewClientData({ ...newClientData, pincode: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58]"
                        placeholder="000000"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={newClientData.country}
                        onChange={(e) => setNewClientData({ ...newClientData, country: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#bb9f58]"
                        placeholder="India"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 p-6 -mx-6 -mb-6 border-t border-gray-200 rounded-b-2xl flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-[#336b6e] text-white rounded-xl hover:bg-[#2a5557] transition-all font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-5 h-5" />
                      Create Client
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardContent
