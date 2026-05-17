import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  UserCog,
  MessageSquare,
  Settings,
  LogOut,
  X,
  Briefcase,
  Image,
  BookOpen,
  Shield,
  ChevronRight,
  ChevronDown,
  BarChart3,
  FileText,
  MapPin,
  DollarSign,
  Receipt,
  Star,
  GraduationCap,
  HelpCircle
} from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import supabase from '../../src/supabase/supabse'

function AdminDashboardSidebar({ isOpen, toggleSidebar, activeTab, setActiveTab }) {
  const navigate = useNavigate()
  const [clientsDropdownOpen, setClientsDropdownOpen] = useState(false)
  const [transactionsDropdownOpen, setTransactionsDropdownOpen] = useState(false)
  const [cmsDropdownOpen, setCmsDropdownOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/admin-login')
  }

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, url: "/admin_dashboard" },
    { id: 'trainers', label: 'Manage Trainers', icon: UserCog, url: "trainer_management" },
    { id: 'clientsQuerry', label: 'Client Queries', icon: FileText, url: "clients_querry" },
    { id: 'generalQueries', label: 'General Queries', icon: MessageSquare, url: "general_queries" },
    {
      id: 'cms',
      label: 'CMS Management',
      icon: LayoutDashboard, // Will use LayoutDashboard as a placeholder or Image
      hasDropdown: true,
      dropdownKey: 'cms',
      subItems: [
        { id: 'landing-cms', label: 'Landing Page', url: 'landing_cms' },
        { id: 'about-cms', label: 'About Us Page', url: 'about_cms' },
        { id: 'contact-cms', label: 'Contact Us Page', url: 'contact_cms' },
        { id: 'footer-cms', label: 'Footer', url: 'footer_cms' },
      ]
    },
    {
      id: 'transactions',
      label: 'Transactions',
      icon: DollarSign,
      hasDropdown: true,
      dropdownKey: 'transactions',
      subItems: [
        { id: 'client-payments', label: 'Client Payments', url: 'client_payments' },
        { id: 'trainer-payments', label: 'Trainer Payments', url: 'transactions' },
      ]
    },
    {
      id: 'allClients',
      label: 'All Clients',
      icon: Users,
      hasDropdown: true,
      dropdownKey: 'clients',
      subItems: [
        { id: 'demo-clients', label: 'Demo Clients', url: 'demo_clients' },
        { id: 'permanent-clients', label: 'Permanent Clients', url: 'permanent_clients' },
      ]
    },
    { id: 'services', label: 'Service Management', icon: Briefcase, url: "service_management" },
    { id: 'yttc-courses', label: 'YTTC Courses', icon: GraduationCap, url: "course_management" },
    { id: 'media', label: 'Media Management', icon: Image, url: "media_management" },
    { id: 'blogs', label: 'Blog Management', icon: BookOpen, url: "blog_management" },
    { id: 'testimonials', label: 'Testimonials', icon: Star, url: "testimonials" },
    { id: 'faq-management', label: 'FAQ Management', icon: HelpCircle, url: "faq_management" },
    { id: 'team', label: 'Our Team', icon: Users, url: "team" },
    { id: 'locations', label: 'Location Management', icon: MapPin, url: "location_management" },
    { id: 'support', label: 'Support Tickets', icon: MessageSquare, url: "support_tickets" },
    { id: 'reports', label: 'Reports', icon: BarChart3, url: "reports" },
    { id: 'settings', label: 'Settings', icon: Settings, url: "settings" },
    { id: 'invoice-settings', label: 'Invoice Settings', icon: Receipt, url: "invoice_settings" },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-[#336b6e] to-[#2a5557] text-white
        transform transition-transform duration-300 ease-in-out z-50
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#bb9f58] rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-[#336b6e]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#bb9f58]">Admin Panel</h2>
                  <p className="text-xs text-white/70">Control Center</p>
                </div>
              </div>
              <button
                onClick={toggleSidebar}
                className="lg:hidden text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 overflow-y-auto admin-sidebar-nav">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = activeTab === item.id

                // Handle dropdown menu items
                if (item.hasDropdown) {
                  let isDropdownOpen = false
                  let toggleDropdown = () => { }

                  if (item.dropdownKey === 'clients') {
                    isDropdownOpen = clientsDropdownOpen
                    toggleDropdown = () => setClientsDropdownOpen(!clientsDropdownOpen)
                  } else if (item.dropdownKey === 'transactions') {
                    isDropdownOpen = transactionsDropdownOpen
                    toggleDropdown = () => setTransactionsDropdownOpen(!transactionsDropdownOpen)
                  } else if (item.dropdownKey === 'cms') {
                    isDropdownOpen = cmsDropdownOpen
                    toggleDropdown = () => setCmsDropdownOpen(!cmsDropdownOpen)
                  }

                  return (
                    <li key={item.id}>
                      <button
                        onClick={toggleDropdown}
                        className={`
                          w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl
                          transition-all duration-300 group
                          ${isActive
                            ? 'bg-[#bb9f58] text-[#336b6e] shadow-lg'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${isActive ? 'text-[#336b6e]' : 'text-white/70 group-hover:text-white'}`} />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {isDropdownOpen ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>

                      {/* Dropdown submenu */}
                      {isDropdownOpen && (
                        <ul className="mt-2 ml-4 space-y-1">
                          {item.subItems.map((subItem) => (
                            <li key={subItem.id}>
                              <Link
                                to={subItem.url}
                                onClick={() => {
                                  setActiveTab(subItem.id)
                                  if (window.innerWidth < 1024) toggleSidebar()
                                }}
                                className={`
                                  flex items-center gap-2 px-4 py-2 rounded-lg
                                  transition-all duration-300
                                  ${activeTab === subItem.id
                                    ? 'bg-[#bb9f58] text-[#336b6e] font-semibold'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                  }
                                `}
                              >
                                <div className="w-2 h-2 rounded-full bg-current opacity-50"></div>
                                <span className="text-sm">{subItem.label}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                }

                // Regular menu items
                return (
                  <li key={item.id}>
                    <Link
                      to={item.url}
                      onClick={() => {
                        setActiveTab(item.id)
                        console.log(item);

                        if (window.innerWidth < 1024) toggleSidebar()
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl
                        transition-all duration-300 group
                        ${isActive
                          ? 'bg-[#bb9f58] text-[#336b6e] shadow-lg'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-[#336b6e]' : 'text-white/70 group-hover:text-white'}`} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                text-white/80 hover:bg-red-500/20 hover:text-red-300
                transition-all duration-300 group"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

export default AdminDashboardSidebar
