import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageSquare,
  TrendingUp,
  Settings,
  LogOut,
  Dumbbell,
  X,
  ChevronDown,
  ChevronRight,
  Wallet,
  Receipt,
} from 'lucide-react'

function DashboardSidebar({ isOpen, toggleSidebar, activeTab, setActiveTab }) {
  const [clientsDropdownOpen, setClientsDropdownOpen] = useState(false)

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, url: '/trainer_dashboard' },
    {
      id: 'clients',
      name: 'My Clients',
      icon: Users,
      hasDropdown: true,
      subItems: [
        { id: 'demo-clients', name: 'Demo Clients', url: '/trainer_dashboard/demo-clients' },
        { id: 'permanent-clients', name: 'Permanent Clients', url: '/trainer_dashboard/permanent-clients' },
      ]
    },
    // { id: 'schedule', name: 'Schedule', icon: Calendar, url: '/trainer_dashboard/schedule' },
    // { id: 'messages', name: 'Messages', icon: MessageSquare, badge: 3, url: '/trainer_dashboard/messages' },
    // { id: 'progress', name: 'Progress Tracking', icon: TrendingUp, url: '/trainer_dashboard/progress' },
    { id: 'payment-settings', name: 'Payment Settings', icon: Wallet, url: '/trainer_dashboard/payment-settings' },
    { id: 'payment-history', name: 'Payment History', icon: Receipt, url: '/trainer_dashboard/payment-history' },
    { id: 'settings', name: 'Settings', icon: Settings, url: '/trainer_dashboard/settings' }
  ]

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-[#336b6e] to-[#2a5557] text-white w-64 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#bb9f58] rounded-lg flex items-center justify-center">
                <Dumbbell className="w-6 h-6 text-[#336b6e]" />
              </div>
              <div>
                <h2 className="font-bold text-lg">Trainer Portal</h2>
                <p className="text-xs text-white/70">Dashboard</p>
              </div>
            </div>
            <button
              onClick={toggleSidebar}
              className="lg:hidden text-white hover:bg-white/10 p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 flex-1 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const IconComponent = item.icon

              // Menu item with dropdown
              if (item.hasDropdown) {
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setClientsDropdownOpen(!clientsDropdownOpen)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-white hover:bg-white/10"
                    >
                      <IconComponent className="w-5 h-5" />
                      <span className="font-medium flex-1 text-left">{item.name}</span>
                      {clientsDropdownOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    {/* Dropdown submenu */}
                    {clientsDropdownOpen && (
                      <ul className="mt-2 ml-4 space-y-1">
                        {item.subItems.map((subItem) => (
                          <li key={subItem.id}>
                            <NavLink
                              to={subItem.url}
                              className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${isActive
                                  ? 'bg-[#bb9f58] text-[#336b6e] shadow-lg'
                                  : 'text-white/80 hover:bg-white/10 hover:text-white'
                                }`
                              }
                              onClick={() => {
                                setActiveTab(subItem.id)
                                if (window.innerWidth < 1024) toggleSidebar()
                              }}
                            >
                              <span className="font-medium text-sm">{subItem.name}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              }

              // Regular menu item
              return (
                <li key={item.id}>
                  <NavLink
                    to={item.url}
                    end
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                        ? 'bg-[#bb9f58] text-[#336b6e] shadow-lg'
                        : 'text-white hover:bg-white/10'
                      }`
                    }
                    onClick={() => {
                      setActiveTab(item.id)
                      if (window.innerWidth < 1024) toggleSidebar()
                    }}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="font-medium flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-white/10">
          <button
            className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default DashboardSidebar
