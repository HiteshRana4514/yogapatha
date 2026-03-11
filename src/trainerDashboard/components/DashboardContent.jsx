import { useState, useEffect } from 'react'
import {
  Users,
  TrendingUp,
  User,
  Clock,
  Star,
  Activity,
  Award,
  Target,
  CheckCircle,
  Loader2,
  ArrowUpRight,
  UserCheck,
  UserX,
  AlertCircle,
  RefreshCw,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import supabase from '../../supabase/supabse'

function DashboardContent() {
  const navigate = useNavigate()
  const { userData } = useOutletContext()
  const [isLoading, setIsLoading] = useState(true)
  const [trainerProfileId, setTrainerProfileId] = useState(null)

  // Real-time stats
  const [stats, setStats] = useState({
    totalClients: 0,
    demoClients: 0,
    permanentClients: 0,
    pendingClients: 0,
    acceptedClients: 0,
    rejectedClients: 0
  })

  const [recentClients, setRecentClients] = useState([])
  const [clientsByStatus, setClientsByStatus] = useState({
    pending: 0,
    accepted: 0,
    rejected: 0
  })
  const [linkCopied, setLinkCopied] = useState(false)

  // First, get trainer profile ID
  useEffect(() => {
    const getTrainerProfileId = async () => {
      if (!userData?.id) {
        setIsLoading(false)
        return
      }

      try {
        const { data: trainerProfile, error } = await supabase
          .from('trainer_profiles')
          .select('id')
          .eq('user_id', userData.id)
          .single()

        if (error) {
          console.error('Error fetching trainer profile:', error)
          setIsLoading(false)
          return
        }

        setTrainerProfileId(trainerProfile?.id)
      } catch (error) {
        console.error('Error getting trainer profile:', error)
        setIsLoading(false)
      }
    }

    getTrainerProfileId()
  }, [userData?.id])

  // Then fetch dashboard data when we have the profile ID
  useEffect(() => {
    if (trainerProfileId) {
      fetchDashboardData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainerProfileId])

  const fetchDashboardData = async () => {
    if (!trainerProfileId) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      await Promise.all([
        fetchStats(),
        fetchRecentClients()
      ])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!trainerProfileId) return

    try {
      // Fetch all clients assigned to this trainer
      // Note: clients.trainer_id stores trainer_profiles.id, not auth user id
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, class_type, status, created_at')
        .eq('trainer_id', trainerProfileId)

      if (error) {
        console.error('Error fetching stats:', error)
        throw error
      }


      setStats({
        totalClients: clients?.length || 0,
        demoClients: clients?.filter(c => c.class_type === 'demo').length || 0,
        permanentClients: clients?.filter(c => c.class_type === 'permanent').length || 0,
        pendingClients: clients?.filter(c => c.status === 'pending').length || 0,
        acceptedClients: clients?.filter(c => c.status === 'accepted').length || 0,
        rejectedClients: clients?.filter(c => c.status === 'rejected').length || 0
      })

      setClientsByStatus({
        pending: clients?.filter(c => c.status === 'pending').length || 0,
        accepted: clients?.filter(c => c.status === 'accepted').length || 0,
        rejected: clients?.filter(c => c.status === 'rejected').length || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchRecentClients = async () => {
    if (!trainerProfileId) return

    try {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, class_type, status, created_at, phone')
        .eq('trainer_id', trainerProfileId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        console.error('Error fetching recent clients:', error)
        throw error
      }

      setRecentClients(clients || [])
    } catch (error) {
      console.error('Error fetching recent clients:', error)
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

  const statsCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      subtitle: `${stats.demoClients} demo, ${stats.permanentClients} permanent`,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      link: '/trainer_dashboard/demo-clients'
    },
    {
      title: 'Pending Requests',
      value: stats.pendingClients,
      subtitle: 'Awaiting your response',
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Accepted Clients',
      value: stats.acceptedClients,
      subtitle: 'Active training',
      icon: UserCheck,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      link: '/trainer_dashboard/permanent-clients'
    },
    {
      title: 'Avg Rating',
      value: '4.8',
      subtitle: 'Client satisfaction',
      icon: Star,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600'
    }
  ]

  // Show loading only if we're actually loading and have userData
  if (isLoading && userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#336b6e] animate-spin mx-auto mb-4" />
          <p className="text-[#336b6e] font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // If no userData after loading, show message
  if (!userData && !isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <p className="text-[#336b6e] font-medium">Loading user data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gradient-to-br from-[#fdfcf3] to-white min-h-screen">

      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-[#336b6e] to-[#2a5557] rounded-2xl p-6 lg:p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Welcome back, {userData?.user_metadata?.firstName && userData?.user_metadata?.lastName
                ? `${userData.user_metadata.firstName} ${userData.user_metadata.lastName}`
                : 'Trainer'}! 👋
            </h1>
            <p className="text-white/80">Here's what's happening with your training business today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
              title="Refresh data"
            >
              <RefreshCw className="w-6 h-6" />
            </button>
            <Award className="w-16 h-16 text-[#bb9f58] hidden md:block" />
          </div>
        </div>
      </div>

      {/* Share Profile Card */}
      {trainerProfileId && (
        <div className="bg-gradient-to-br from-[#bb9f58] to-[#a08a4a] rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Share2 className="w-6 h-6" />
                <h3 className="text-xl font-bold">Share Your Profile</h3>
              </div>
              <p className="text-white/90 mb-4">Share your professional profile with potential clients</p>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-4 break-all">
                <p className="text-sm font-mono text-white/90">
                  {window.location.origin}/trainer/{trainerProfileId}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/trainer/${trainerProfileId}`);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-[#336b6e] rounded-lg font-semibold hover:bg-white/90 transition-colors"
                >
                  {linkCopied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
                <a
                  href={`${window.location.origin}/trainer/${trainerProfileId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Preview
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const IconComponent = stat.icon
          return (
            <div
              key={index}
              onClick={() => stat.link && navigate(stat.link)}
              className={`bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:shadow-xl hover:border-[#bb9f58] transition-all ${
                stat.link ? 'cursor-pointer transform hover:scale-105' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`${stat.bgColor} p-4 rounded-xl`}>
                  <IconComponent className={`w-7 h-7 ${stat.iconColor}`} />
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
              <p className="text-3xl font-bold text-[#336b6e]">{clientsByStatus.pending}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Awaiting your response</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Accepted</p>
              <p className="text-3xl font-bold text-[#336b6e]">{clientsByStatus.accepted}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Active training clients</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <UserX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Rejected</p>
              <p className="text-3xl font-bold text-[#336b6e]">{clientsByStatus.rejected}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">Declined requests</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Clients */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#336b6e] flex items-center gap-2">
              <Users className="w-6 h-6 text-[#bb9f58]" />
              Recent Clients
            </h2>
            <button
              onClick={() => navigate('/trainer_dashboard/demo-clients')}
              className="text-sm text-[#bb9f58] hover:text-[#336b6e] font-medium flex items-center gap-1"
            >
              View All
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
          {recentClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium mb-2">No clients yet</p>
              <p className="text-gray-400 text-sm">Clients assigned to you will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentClients.map((client) => (
                <div
                  key={client.id}
                  onClick={() => navigate(`/trainer_dashboard/client/${client.id}`)}
                  className="flex items-center justify-between p-4 bg-[#fdfcf3] rounded-xl hover:bg-[#f8f6e8] hover:border-[#bb9f58] border-2 border-transparent transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-[#bb9f58]" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#336b6e]">{client.first_name} {client.last_name}</h3>
                      <p className="text-sm text-gray-500">{client.phone}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        client.class_type === 'demo'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {client.class_type}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        client.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : client.status === 'accepted'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {client.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{formatTimeAgo(client.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100">
          <h2 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#bb9f58]" />
            Quick Stats
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 font-medium">Demo Classes</span>
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-[#336b6e]">{stats.demoClients}</p>
              <p className="text-xs text-gray-500 mt-1">Total demo clients</p>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 font-medium">Permanent</span>
                <UserCheck className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-[#336b6e]">{stats.permanentClients}</p>
              <p className="text-xs text-gray-500 mt-1">Long-term clients</p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 font-medium">Response Rate</span>
                <CheckCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <p className="text-3xl font-bold text-[#336b6e]">
                {stats.totalClients > 0
                  ? Math.round(((stats.acceptedClients + stats.rejectedClients) / stats.totalClients) * 100)
                  : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Requests responded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100">
        <h3 className="text-xl font-bold text-[#336b6e] mb-6 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-[#bb9f58]" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/trainer_dashboard/demo-clients')}
            className="p-5 rounded-xl border-2 border-gray-200 hover:border-[#bb9f58] hover:bg-[#fdfcf3] hover:shadow-lg transition-all text-center group transform hover:scale-105"
          >
            <Users className="w-10 h-10 text-[#336b6e] mx-auto mb-3 group-hover:text-[#bb9f58] transition-colors" />
            <p className="text-sm font-semibold text-[#336b6e]">View Clients</p>
          </button>

          <button
            onClick={() => navigate('/trainer_dashboard/permanent-clients')}
            className="p-5 rounded-xl border-2 border-gray-200 hover:border-[#bb9f58] hover:bg-[#fdfcf3] hover:shadow-lg transition-all text-center group transform hover:scale-105"
          >
            <UserCheck className="w-10 h-10 text-[#336b6e] mx-auto mb-3 group-hover:text-[#bb9f58] transition-colors" />
            <p className="text-sm font-semibold text-[#336b6e]">Permanent</p>
          </button>

          <button
            onClick={() => navigate('/trainer_dashboard/profile')}
            className="p-5 rounded-xl border-2 border-gray-200 hover:border-[#bb9f58] hover:bg-[#fdfcf3] hover:shadow-lg transition-all text-center group transform hover:scale-105"
          >
            <User className="w-10 h-10 text-[#336b6e] mx-auto mb-3 group-hover:text-[#bb9f58] transition-colors" />
            <p className="text-sm font-semibold text-[#336b6e]">Profile</p>
          </button>

          <button
            onClick={() => navigate('/trainer_dashboard/settings')}
            className="p-5 rounded-xl border-2 border-gray-200 hover:border-[#bb9f58] hover:bg-[#fdfcf3] hover:shadow-lg transition-all text-center group transform hover:scale-105"
          >
            <Target className="w-10 h-10 text-[#336b6e] mx-auto mb-3 group-hover:text-[#bb9f58] transition-colors" />
            <p className="text-sm font-semibold text-[#336b6e]">Settings</p>
          </button>
        </div>
      </div>

      {/* Action Cards */}
      {stats.pendingClients > 0 && (
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">
                  {stats.pendingClients} Pending {stats.pendingClients === 1 ? 'Request' : 'Requests'}
                </h3>
                <p className="text-white/90">You have clients waiting for your response</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/trainer_dashboard/demo-clients')}
              className="px-6 py-3 bg-white text-orange-600 rounded-xl font-semibold hover:bg-white/90 transition-all flex items-center gap-2"
            >
              Review Now
              <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardContent