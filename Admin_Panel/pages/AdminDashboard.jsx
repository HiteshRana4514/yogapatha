import React, { useState, useEffect } from 'react'
import AdminDashboardSidebar from '../components/AdminDashboardSidebar'
import AdminDashboardHeader from '../components/AdminDashboardHeader'
import AdminDashboardContent from '../components/AdminDashboardContent'
import supabase from '../../src/supabase/supabse'
import { Outlet } from 'react-router-dom'

function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [userData, setUserData] = useState(null)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  useEffect(() => {
    const getUserData = async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Cannot get user', error)
      } else {
        setUserData(data.user)
      }
    }
    getUserData()
  }, [])

  return (
    <div className="min-h-screen bg-[#fdfcf3]">
      {/* Sidebar */}
      <AdminDashboardSidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Header */}
        <AdminDashboardHeader toggleSidebar={toggleSidebar} userData={userData} />

        {/* Dashboard Content */}
        <main className="flex-1">
          <Outlet/>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard
