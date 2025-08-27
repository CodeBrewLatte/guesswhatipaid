'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../src/contexts/AuthContext'
import Link from 'next/link'
import { supabase } from '../../../src/utils/supabase'

interface Contract {
  id: string
  category: string
  region: string
  priceCents: number
  description?: string
  vendorName?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  user: {
    email: string
    displayName?: string
  }
  tags: Array<{ label: string }>
}

export default function AdminReviewPage() {
  const { user } = useAuth()
  const isSignedIn = !!user
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminCheckLoading, setAdminCheckLoading] = useState(true)

  const fetchContracts = async () => {
    setLoading(true)
    try {
      const token = await getAuthToken()
      const response = await fetch(`/api/v1/admin/contracts?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setContracts(data)
      }
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!user?.email) {
        setAdminCheckLoading(false)
        return
      }

      try {
        // Check if user is admin by trying to fetch admin data
        const response = await fetch('/api/v1/admin/contracts?status=PENDING', {
          headers: {
            'Authorization': `Bearer ${await getAuthToken()}`
          }
        })

        if (response.status === 403) {
          setIsAdmin(false)
        } else if (response.ok) {
          setIsAdmin(true)
          fetchContracts() // Only fetch contracts if admin
        }
      } catch (error) {
        setIsAdmin(false)
      } finally {
        setAdminCheckLoading(false)
      }
    }

    checkAdminAccess()
  }, [user, filter])

  const getAuthToken = async () => {
    if (typeof window !== 'undefined') {
      const { data: { session } } = await supabase.auth.getSession()
      return session?.access_token || ''
    }
    return ''
  }

  const handleStatusChange = async (contractId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/v1/admin/contracts/${contractId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        // Refresh the list
        fetchContracts()
      }
    } catch (error) {
      console.error('Error updating contract status:', error)
    }
  }

  const formatPrice = (priceCents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(priceCents / 100)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (adminCheckLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Access Denied</strong>
            <p className="text-sm mt-1">You need to be signed in to access this page</p>
          </div>
          <p className="text-gray-600 mb-6">
            This area is restricted to administrators only.
          </p>
          <div className="space-y-3">
            <Link href="/auth/signin" className="btn-primary block">
              Sign In
            </Link>
            <Link href="/" className="btn-secondary block">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Admin Access Required</strong>
            <p className="text-sm mt-1">You don't have permission to access this area</p>
          </div>
          <p className="text-gray-600 mb-6">
            This area is restricted to administrators only. If you believe this is an error, please contact support.
          </p>
          <Link href="/" className="btn-primary block">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              You Paid What
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/browse" className="text-gray-900 font-medium">
                Browse
              </Link>
              <Link href="/upload" className="text-gray-900 font-medium">
                Upload
              </Link>
              <Link href="/admin/review" className="text-primary-600 font-medium">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contract Moderation</h1>
          <p className="text-gray-600">
            Review and approve/reject submitted contracts
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === status
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                  {status === 'PENDING' && contracts.filter(c => c.status === 'PENDING').length > 0 && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {contracts.filter(c => c.status === 'PENDING').length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Contracts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading contracts...</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No {filter.toLowerCase()} contracts found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {contracts.map((contract) => (
              <div key={contract.id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {contract.category} - {contract.region}
                    </h3>
                    <p className="text-2xl font-bold text-primary-600">
                      {formatPrice(contract.priceCents)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {formatDate(contract.createdAt)}
                    </div>
                    <div className="text-sm text-gray-600">
                      by {contract.user.displayName || contract.user.email}
                    </div>
                  </div>
                </div>

                {contract.description && (
                  <p className="text-gray-700 mb-3">{contract.description}</p>
                )}

                {contract.vendorName && (
                  <p className="text-sm text-gray-600 mb-3">
                    <span className="font-medium">Vendor:</span> {contract.vendorName}
                  </p>
                )}

                {contract.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {contract.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {filter === 'PENDING' && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleStatusChange(contract.id, 'APPROVED')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusChange(contract.id, 'REJECTED')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {filter === 'APPROVED' && (
                  <div className="text-sm text-green-600 font-medium">
                    ✅ Approved
                  </div>
                )}

                {filter === 'REJECTED' && (
                  <div className="text-sm text-red-600 font-medium">
                    ❌ Rejected
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
