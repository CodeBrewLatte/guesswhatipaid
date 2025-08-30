'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../src/contexts/AuthContext'
import { supabase } from '../../src/utils/supabase'
import Link from 'next/link'
import { FiltersBar } from '@/components/FiltersBar'
import { StatsBar } from '@/components/StatsBar'
import { ContractCard } from '@/components/ContractCard'
import { LockNotice } from '@/components/LockNotice'

interface Contract {
  id: string
  category: string
  region: string
  priceCents: number
  unit?: string
  quantity?: number
  thumbKey?: string
  description?: string
  vendorName?: string
  takenOn?: string
  createdAt: string
  priceDisplay: string
  pricePerUnit?: string
  _count: { reviews: number }
}

interface SearchResponse {
  items: Contract[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
  stats: {
    avg: number
    min: number
    max: number
  } | null
  locked: boolean
}

export default function BrowsePage() {
  const { user } = useAuth()
  const isSignedIn = !!user
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [locked, setLocked] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 })
  const [filters, setFilters] = useState({
    category: '',
    region: '',
    q: '',
    min: '',
    max: '',
    sort: 'newest'
  })

  const fetchContracts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value)
      })
      params.append('page', pagination.page.toString())
      params.append('pageSize', pagination.pageSize.toString())

      const response = await fetch(`/api/v1/contracts?${params}`)
      const data: SearchResponse = await response.json()
      
      setContracts(data.items)
      setStats(data.stats)
      setLocked(data.locked)
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching contracts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Set default region filter to user's region
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user && !filters.region) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const response = await fetch('/api/v1/users/profile-direct', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
            });
            if (response.ok) {
              const profileData = await response.json();
              if (profileData.region && !filters.region) {
                setFilters(prev => ({ ...prev, region: profileData.region }))
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user, filters.region])

  useEffect(() => {
    fetchContracts()
  }, [filters, pagination?.page])

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to browse</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to view contracts</p>
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                <img 
                  src="/guess-logo.png" 
                  alt="Guess What I Paid Logo" 
                  className="h-8 w-8 object-contain"
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Guess What I Paid
              </span>
            </Link>
            <nav className="flex items-center space-x-8">
              <Link href="/browse" className="text-blue-600 font-semibold relative group">
                Browse
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-500"></span>
              </Link>
              <Link href="/upload" className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg">
                Upload
              </Link>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔍</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Browse Contracts</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover real-world project costs and pricing data from your community
          </p>
        </div>

        {/* Filters */}
        <FiltersBar 
          filters={filters} 
          onFilterChange={handleFilterChange} 
        />

        {/* Lock Notice */}
        {locked && <LockNotice />}

        {/* Stats */}
        {stats && !locked && (
          <StatsBar stats={stats} />
        )}

        {/* Results */}
        <div className="mt-12">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
              <p className="text-lg text-gray-600 font-medium">Loading contracts...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🔍</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-3">No contracts found</h3>
              <p className="text-gray-600 mb-4">No contracts match your current filters.</p>
              <p className="text-gray-500">Try adjusting your filters or be the first to upload in this category!</p>
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {contracts.map((contract) => (
                  <ContractCard 
                    key={contract.id} 
                    contract={contract}
                    locked={locked}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.total > pagination.pageSize && (
                <div className="mt-12 flex justify-center">
                  <nav className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
                    <div className="flex space-x-1">
                      {pagination.page > 1 && (
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                        >
                          Previous
                        </button>
                      )}
                      
                      {Array.from({ length: Math.ceil(pagination.total / pagination.pageSize) }, (_, i) => i + 1)
                        .filter(page => Math.abs(page - pagination.page) <= 2)
                        .map(page => (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                              page === pagination.page
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      
                      {pagination.page < Math.ceil(pagination.total / pagination.pageSize) && (
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                        >
                          Next
                        </button>
                      )}
                    </div>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
