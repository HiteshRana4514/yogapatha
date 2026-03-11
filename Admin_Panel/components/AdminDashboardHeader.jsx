import React from 'react'
import { Menu, Bell, Search, User, Shield } from 'lucide-react'

function AdminDashboardHeader({ toggleSidebar, userData }) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-[#336b6e]" />
            </button>
            
            <div>
              <h1 className="text-2xl font-bold text-[#336b6e] flex items-center gap-2">
                <Shield className="w-6 h-6 text-[#bb9f58]" />
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-600">Manage your fitness platform</p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Search Bar - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 bg-[#fdfcf3] rounded-lg px-4 py-2 border border-gray-200">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent border-none outline-none text-sm text-[#336b6e] w-48"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Bell className="w-6 h-6 text-[#336b6e]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Admin Profile */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-[#336b6e]">
                  {userData?.user_metadata?.firstName || 'Admin'} {userData?.user_metadata?.lastName || ''}
                </p>
                <p className="text-xs text-[#bb9f58] font-medium">Administrator</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-[#336b6e] to-[#2a5557] rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-[#bb9f58]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminDashboardHeader
