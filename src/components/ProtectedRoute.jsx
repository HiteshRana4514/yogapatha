// components/ProtectedRoute.jsx
import React, { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import supabase from '../supabase/supabse'

function ProtectedRoute({ children, role }) {
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Fetch role from profiles table
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (!error && profileData && role && profileData.role === role) {
          // If user is a trainer, check if account is active
          if (role === 'trainer') {
            const { data: trainerProfile, error: trainerError } = await supabase
              .from('trainer_profiles')
              .select('is_active')
              .eq('user_id', user.id)
              .single()

            if (trainerError && trainerError.code !== 'PGRST116') {
              console.error('Error checking trainer status:', trainerError)
            }

            // If trainer profile exists and is_active is false, deny access
            if (trainerProfile && trainerProfile.is_active === false) {
              setErrorMessage('Your account has been deactivated. Please contact the administrator for assistance.')
              await supabase.auth.signOut()
              setIsAuthorized(false)
              setLoading(false)
              return
            }
          }

          setIsAuthorized(true)
        }
      }

      setLoading(false)
    }

    checkUser()
  }, [role])

  if (loading) return <div className="min-h-screen bg-[#fdfcf3] flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-[#336b6e] border-t-[#bb9f58] rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-[#336b6e] font-medium">Loading...</p>
    </div>
  </div>

  if (!isAuthorized) {
    if (errorMessage) {
      // Show error message for deactivated trainers
      return (
        <div className="min-h-screen bg-[#fdfcf3] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#336b6e] mb-3">Account Deactivated</h2>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <a
              href="/trainer_login"
              className="inline-block px-6 py-3 bg-[#336b6e] text-white rounded-lg hover:bg-[#2a5557] transition-colors"
            >
              Back to Login
            </a>
          </div>
        </div>
      )
    }
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
