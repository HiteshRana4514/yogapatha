import React, { useState, useEffect } from 'react'
import DashboardSidebar from '../components/DashboardSidebar'
import DashboardHeader from '../components/DashboardHeader'
import DashboardContent from '../components/DashboardContent'
import supabase from '../../supabase/supabse'
import { Outlet } from 'react-router-dom'
function TrainerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [userData, setUserData] = useState(null);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  useEffect(()=>{
    const getUserData = async()=>{
      const {data, error} = await supabase.auth.getUser();
      if(error){
        console.error('Can not get user',error);
        
      }
      else{
        setUserData(data.user);
      }
    }
    getUserData()
  },[])

  return (
    <div className="min-h-screen bg-[#fdfcf3]">
      
      {/* Sidebar */}
      <DashboardSidebar 
        isOpen={sidebarOpen} 
        toggleSidebar={toggleSidebar}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        
        {/* Header */}
        <DashboardHeader toggleSidebar={toggleSidebar} userData={userData} />

        {/* Dashboard Content */}
        <main className="flex-1">
          {/* <DashboardContent userData={userData}/> */}
          <Outlet context={{ userData }}/>
        </main>
      </div>
    </div>
  )
}

export default TrainerDashboard
