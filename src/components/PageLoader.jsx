import React from 'react'
import { Loader2 } from 'lucide-react'

function PageLoader() {
  return (
    <div className="fixed inset-0 bg-[#fdfcf3] flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo or Brand Name */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-[#336b6e] mb-2">
            YogaPatha
          </h1>
          <p className="text-lg text-[#bb9f58]">Transform Your Life</p>
        </div>

        {/* Animated Loader */}
        <div className="relative">
          <div className="w-20 h-20 border-4 border-[#336b6e]/20 border-t-[#336b6e] rounded-full animate-spin mx-auto"></div>
          <Loader2 className="w-8 h-8 text-[#bb9f58] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>

        {/* Loading Text */}
        <p className="mt-6 text-[#336b6e] opacity-70 animate-pulse">
          Loading your wellness journey...
        </p>
      </div>
    </div>
  )
}

export default PageLoader
