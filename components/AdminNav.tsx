'use client'

import { useAuth } from '../src/contexts/AuthContext'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '../src/utils/supabase'

interface AdminNavProps {
  className?: string
}

export default function AdminNav({ className = '' }: AdminNavProps) {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const getAuthToken = async () => {
    // Get the auth token from Supabase session
    if (typeof window !== 'undefined') {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session found:', !!session, 'Token exists:', !!session?.access_token)
        return session?.access_token || ''
      } catch (error) {
        console.error('Error getting session:', error)
        return ''
      }
    }
    return ''
  }

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.email) {
        console.log('No user email, skipping admin check')
        setIsAdmin(false)
        setLoading(false)
        return
      }

      console.log('Checking admin status for user:', user.email)

      try {
        // Check if user is admin by trying to fetch admin data
        const token = await getAuthToken();
        console.log('Admin check token length:', token ? token.length : 0);
        
        if (!token) {
          console.log('No token available, cannot check admin status')
          setIsAdmin(false)
          setLoading(false)
          return
        }
        
        const response = await fetch('/api/v1/admin/contracts?status=PENDING', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Admin check response status:', response.status);

        if (response.ok) {
          const contracts = await response.json()
          setPendingCount(contracts.length)
          setIsAdmin(true)
          console.log('User is admin, contracts found:', contracts.length)
        } else if (response.status === 403) {
          console.log('User is not admin (403 response)')
          setIsAdmin(false)
        } else {
          console.log('Unexpected response status:', response.status)
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [user])

  if (loading) {
    return null // Don't show anything while checking
  }

  if (!isAdmin) {
    return null // Don't show admin nav for non-admins
  }

  return (
    <div className={`bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-lg shadow-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-full">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold">Admin Panel</h3>
            <p className="text-sm text-white/80">
              {pendingCount} contract{pendingCount !== 1 ? 's' : ''} pending review
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Link 
            href="/admin/review" 
            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Review Contracts
          </Link>
          <Link 
            href="/admin/dashboard" 
            className="bg-white text-purple-600 hover:bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
