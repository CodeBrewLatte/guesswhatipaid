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
  thumbKey?: string
  storageFileName?: string // The actual filename in Supabase storage
  redactedFileName?: string
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
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>('')

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
          console.log('Contracts fetched:', data)
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

  const openImageModal = (storageFileName: string) => {
    console.log('🚀 openImageModal called!')
    console.log('🚀 Storage filename:', storageFileName)
    console.log('🚀 Setting selectedImage to:', storageFileName)
    console.log('🚀 Setting imageModalOpen to true')
    setSelectedImage(storageFileName)
    setImageModalOpen(true)
    console.log('🚀 State should now be updated')
  }

  const closeImageModal = () => {
    setImageModalOpen(false)
    setSelectedImage('')
  }

  // Utility function to get Supabase storage URL
  const getStorageUrl = (thumbKey: string) => {
    // Clean the filename by removing invisible characters and normalizing
    const cleanFilename = thumbKey
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width spaces and other invisible chars
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim() // Remove leading/trailing spaces
    
    // Properly encode the cleaned filename
    const encodedFilename = encodeURIComponent(cleanFilename)
    return `https://ldwwsxhxozncosptuqut.supabase.co/storage/v1/object/public/contracts/${encodedFilename}`
  }

  const handleStatusChange = async (contractId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const token = await getAuthToken()
      const response = await fetch(`/api/v1/admin/contracts/${contractId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        // Refresh the list
        fetchContracts()
      } else {
        console.error('Failed to update contract status:', response.status, response.statusText)
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
            <Link href="/" className="flex items-center space-x-3">
              <img 
                src="/guess-logo.png" 
                alt="Guess What I Paid Logo" 
                className="h-8 w-8 object-contain"
              />
              <span className="text-2xl font-bold text-primary-600">
                Guess What I Paid
              </span>
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

                {/* Contract Image */}
                        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">Contract Image:</span>
            <span className="ml-2 text-xs text-gray-400">
              (Storage: {contract.storageFileName || 'No storage file'})
            </span>
          </div>
          {contract.storageFileName ? (
            <div className="relative inline-block">
                              <img
                  src={getStorageUrl(contract.storageFileName)}
                  alt="Contract preview"
                  className="w-32 h-24 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => {
                    console.log('🖱️ Thumbnail clicked!')
                    console.log('🖱️ Storage filename:', contract.storageFileName)
                    console.log('🖱️ Calling openImageModal with:', contract.storageFileName)
                    openImageModal(contract.storageFileName!)
                  }}
                  onError={(e) => {
                    const imageUrl = getStorageUrl(contract.storageFileName!)
                    console.error('Contract image failed to load:', imageUrl)
                    console.error('Storage filename:', contract.storageFileName)
                    console.error('Encoded filename:', encodeURIComponent(contract.storageFileName!))
                    
                    // Fallback to a placeholder if image fails to load
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const fallback = document.createElement('div')
                    fallback.className = 'w-32 h-24 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 text-xs'
                    fallback.innerHTML = 'Contract image failed to load'
                    fallback.onclick = () => openImageModal(contract.storageFileName!)
                    target.parentNode?.appendChild(fallback)
                  }}
                  onLoad={() => console.log('Contract image loaded successfully:', getStorageUrl(contract.storageFileName!))}
                />
                
                {/* Simple click hint below the image */}
                <div className="text-center mt-1">
                  <span className="text-xs text-gray-500">Click image to expand</span>
                </div>
               
               {/* Debug button */}
               <button
                 onClick={() => {
                   const url = getStorageUrl(contract.storageFileName!)
                   console.log('Testing image URL:', url)
                   fetch(url)
                     .then(response => {
                       console.log('Image fetch response:', response.status, response.statusText)
                       if (response.ok) {
                         console.log('✅ Image exists and is accessible')
                       } else {
                         console.log('❌ Image fetch failed:', response.status)
                       }
                     })
                     .catch(error => {
                       console.error('❌ Image fetch error:', error)
                     })
                 }}
                 className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
               >
                 Test Image URL
               </button>
                    </div>
                                      ) : (
                      <div className="w-32 h-24 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center text-gray-500 text-xs">
                        No contract image available
                      </div>
                    )}
                </div>

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

            {/* Image Modal */}
      {imageModalOpen && selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[9999] p-4"
          style={{ zIndex: 9999 }}
        >
          <div className="relative max-w-4xl max-h-full bg-white rounded-lg p-6">
            <button
              onClick={closeImageModal}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-black text-center mb-4">
              <p className="font-bold">Debug: Modal open with filename: {selectedImage}</p>
              <p className="text-sm">Full URL: {getStorageUrl(selectedImage)}</p>
            </div>
            <img
              src={getStorageUrl(selectedImage)}
              alt="Contract full view"
              className="max-w-full max-h-full object-contain rounded-lg border border-gray-300"
              onLoad={() => console.log('Modal image loaded successfully')}
              onError={(e) => console.error('Modal image failed to load:', e)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
