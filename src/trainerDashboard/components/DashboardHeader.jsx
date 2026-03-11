import { useState, useEffect } from 'react'
import supabase from '../../supabase/supabse'
import { useNavigate, Link } from 'react-router-dom'
import {
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  ChevronDown,
  User,
  Clock,
  Award,
  CheckCircle,
  AlertCircle,
  UserPlus
} from 'lucide-react'
function DashboardHeader({ toggleSidebar, userData }) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [kycStatus, setKycStatus] = useState('pending')
  const [avatarUrl, setAvatarUrl] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate();

  const [isPartner, setIsPartner] = useState(false)

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userData) return
      
      try {
        const { data: profile, error } = await supabase
          .from('trainer_profiles')
          .select('kyc_status, avatar_url, wants_partnership, partnership_status')
          .eq('user_id', userData.id)
          .single()

        if (!error && profile) {
          setKycStatus(profile.kyc_status || 'pending')
          setAvatarUrl(profile.avatar_url)
          // Check if trainer is an approved partner
          setIsPartner(profile.wants_partnership && profile.partnership_status === 'approved')
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      }
    }

    fetchProfileData()
  }, [userData])

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!userData) return

      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (!error && data) {
          setNotifications(data)
          setUnreadCount(data.filter(n => !n.read).length)
        }
      } catch (err) {
        console.error('Error fetching notifications:', err)
      }
    }

    fetchNotifications()

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userData?.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev].slice(0, 10))
          setUnreadCount(prev => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userData])

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (!error) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err) {
      console.error('Error marking notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
      
      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds)

      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error('Error marking all as read:', err)
    }
  }

  const getTimeAgo = (timestamp) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffMs = now - past
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'client_assigned':
        return <UserPlus className="w-4 h-4 text-green-600" />
      case 'client_removed':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Bell className="w-4 h-4 text-[#336b6e]" />
    }
  }

  const handleLogout = async() => {
    const {error} = await supabase.auth.signOut();

    if (error) {
  console.error("Logout error:", error.message);
} else {
  navigate('/')
}
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center justify-between px-4 lg:px-6 py-4">
        
        {/* Left Section - Menu & Search */}
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden text-[#336b6e] hover:bg-[#fdfcf3] p-2 rounded-lg transition-colors duration-200"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients, sessions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#bb9f58] transition-colors duration-200"
              />
            </div>
          </div>
        </div>

        {/* Right Section - Notifications & Profile */}
        <div className="flex items-center gap-4">
          
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-[#336b6e] hover:bg-[#fdfcf3] p-2 rounded-lg transition-colors duration-200"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                <div className="p-4 border-b border-gray-200 bg-[#fdfcf3] flex items-center justify-between">
                  <h3 className="font-semibold text-[#336b6e]">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-[#bb9f58] hover:text-[#a08a4a] font-medium"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm text-gray-500">No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id}
                        onClick={() => !notif.read && markAsRead(notif.id)}
                        className={`p-4 border-b border-gray-100 hover:bg-[#fdfcf3] transition-colors duration-200 cursor-pointer ${
                          !notif.read ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getNotificationIcon(notif.type)}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-[#336b6e] mb-1">{notif.title}</p>
                            <p className="text-sm text-gray-600 mb-1">{notif.message}</p>
                            {notif.client_type && (
                              <span className="inline-block px-2 py-0.5 bg-[#336b6e]/10 text-[#336b6e] text-xs rounded-full mr-2">
                                {notif.client_type === 'demo' ? 'Demo Client' : 'Permanent Client'}
                              </span>
                            )}
                            <p className="text-xs text-gray-500 mt-1">{getTimeAgo(notif.created_at)}</p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-3 hover:bg-[#fdfcf3] px-3 py-2 rounded-lg transition-colors duration-200"
            >
              <div className="relative">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full object-cover border-2 border-[#336b6e]"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-[#bb9f58]" />
                  </div>
                )}
                {/* KYC Status Indicator */}
                {kycStatus === 'approved' && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                )}
                {kycStatus === 'pending' && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white">
                    <Clock className="w-3 h-3 text-white" />
                  </div>
                )}
                {kycStatus === 'rejected' && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                    <AlertCircle className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-semibold text-[#336b6e]">{userData?.user_metadata?.firstName +' '+ userData?.user_metadata?.lastName}</p>
                <p className="text-xs text-gray-500">
                  {isPartner ? (
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3 text-[#bb9f58]" />
                      <span className="text-[#bb9f58] font-semibold">Partner Trainer</span>
                    </span>
                  ) : (
                    'Certified Trainer'
                  )}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500 hidden md:block" />
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-[#fdfcf3]">
                  <p className="font-semibold text-[#336b6e]">{userData?.user_metadata?.firstName +' '+ userData?.user_metadata?.lastName}</p>
                  <p className="text-xs text-gray-500">{userData?.email}</p>
                </div>
                <div className="p-2">
                  <Link 
                    to="/trainer_dashboard/profile"
                    onClick={() => setShowProfile(false)}
                    className="w-full text-left px-4 py-2 text-sm text-[#336b6e] hover:bg-[#fdfcf3] rounded transition-colors duration-200 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                  <Link 
                    to="/trainer_dashboard/settings"
                    onClick={() => setShowProfile(false)}
                    className="w-full text-left px-4 py-2 text-sm text-[#336b6e] hover:bg-[#fdfcf3] rounded transition-colors duration-200 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <Link
                    to="/trainer_dashboard/help-support"
                    onClick={() => setShowProfile(false)}
                    className="w-full text-left px-4 py-2 text-sm text-[#336b6e] hover:bg-[#fdfcf3] rounded transition-colors duration-200 flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Help & Support
                  </Link>
                </div>
                <div className="p-2 border-t border-gray-200">
                  <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors duration-200 flex items-center gap-2" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}


export default DashboardHeader