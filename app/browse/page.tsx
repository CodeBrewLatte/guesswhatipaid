'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../src/contexts/AuthContext'
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
    if (user?.region && !filters.region) {
      setFilters(prev => ({ ...prev, region: user.region }))
    }
  }, [user?.region])

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
              <Link href="/upload" className="btn-primary">
                Upload
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Contracts</h1>
          <p className="text-gray-600">
            Discover real-world project costs and pricing data
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
        <div className="mt-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading contracts...</p>
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No contracts found matching your criteria.</p>
              <p className="text-gray-500 mt-2">Try adjusting your filters or be the first to upload in this category!</p>
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
                <div className="mt-8 flex justify-center">
                  <nav className="flex space-x-2">
                    {pagination.page > 1 && (
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            page === pagination.page
                              ? 'bg-primary-600 text-white'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    
                    {pagination.page < Math.ceil(pagination.total / pagination.pageSize) && (
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        Next
                      </button>
                    )}
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
