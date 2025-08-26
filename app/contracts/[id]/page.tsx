'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../src/contexts/AuthContext'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Contract {
  id: string
  category: string
  region: string
  priceCents: number
  unit?: string
  quantity?: number
  description?: string
  vendorName?: string
  takenOn?: string
  createdAt: string
  fileKey: string
  thumbKey?: string
  priceDisplay: string
  pricePerUnit?: string
  user: {
    displayName?: string
  }
  tags: Array<{ label: string }>
  reviews: Array<{
    id: string
    rating: number
    comment?: string
    user: {
      displayName?: string
    }
    createdAt: string
  }>
}

export default function ContractDetailPage() {
  const { user } = useAuth()
  const isSignedIn = !!user
  const params = useParams()
  const [contract, setContract] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [userComment, setUserComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchContract = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/v1/contracts/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setContract(data)
        setLocked(data.priceDisplay === '— — —')
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchContract()
    }
  }, [params.id])

  const handleVote = async (rating: number) => {
    if (!isSignedIn) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/v1/contracts/${params.id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, comment: userComment || undefined })
      })

      if (response.ok) {
        setUserRating(rating)
        fetchContract() // Refresh to get updated review count
      }
    } catch (error) {
      console.error('Error submitting vote:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading contract...</p>
        </div>
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Contract Not Found</h1>
          <p className="text-gray-600 mb-6">The contract you're looking for doesn't exist or has been removed.</p>
          <Link href="/browse" className="btn-primary">
            Browse Contracts
          </Link>
        </div>
      </div>
    )
  }

  const positiveReviews = contract.reviews.filter(r => r.rating === 1).length
  const negativeReviews = contract.reviews.filter(r => r.rating === -1).length

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link href="/browse" className="hover:text-gray-700">Browse</Link></li>
            <li>/</li>
            <li><Link href={`/browse?category=${contract.category}`} className="hover:text-gray-700">{contract.category}</Link></li>
            <li>/</li>
            <li className="text-gray-900">{contract.region}</li>
          </ol>
        </nav>

        {/* Contract Header */}
        <div className="card mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {contract.category} - {contract.region}
              </h1>
              <div className="text-4xl font-bold text-primary-600 mb-2">
                {locked ? '— — —' : contract.priceDisplay}
              </div>
              {!locked && contract.pricePerUnit && (
                <div className="text-lg text-gray-600">
                  {contract.pricePerUnit}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                {contract.takenOn ? formatDate(contract.takenOn) : formatDate(contract.createdAt)}
              </div>
              <div className="text-sm text-gray-600">
                by {contract.user.displayName || contract.user.email || 'Anonymous'}
              </div>
            </div>
          </div>

          {contract.description && (
            <p className="text-gray-700 text-lg mb-4">{contract.description}</p>
          )}

          {contract.vendorName && (
            <p className="text-gray-600 mb-4">
              <span className="font-medium">Vendor:</span> {contract.vendorName}
            </p>
          )}

          {contract.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {contract.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                >
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Lock Notice */}
        {locked && (
          <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-4">
              <div className="text-3xl">🔒</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-primary-800 mb-2">
                  Upload to Unlock Full Details
                </h3>
                <p className="text-primary-700 mb-4">
                  This contract's pricing is hidden. Upload one approved contract to unlock 
                  all pricing data and see detailed information.
                </p>
                <Link href="/upload" className="btn-primary">
                  Upload Your First Contract
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Community Feedback</h2>
          
          {/* Rating Summary */}
          <div className="flex items-center space-x-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{positiveReviews}</div>
              <div className="text-sm text-gray-600">Helpful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{negativeReviews}</div>
              <div className="text-sm text-gray-600">Not Helpful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{contract.reviews.length}</div>
              <div className="text-sm text-gray-600">Total Votes</div>
            </div>
          </div>

          {/* User Vote */}
          {isSignedIn && (
            <div className="border-t pt-4 mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Was this helpful?</h3>
              <div className="flex space-x-3 mb-3">
                <button
                  onClick={() => handleVote(1)}
                  disabled={submitting}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    userRating === 1
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-green-100'
                  }`}
                >
                  👍 Helpful
                </button>
                <button
                  onClick={() => handleVote(-1)}
                  disabled={submitting}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    userRating === -1
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-red-100'
                  }`}
                >
                  👎 Not Helpful
                </button>
              </div>
              <input
                type="text"
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="Optional comment..."
                className="input-field"
                maxLength={200}
              />
            </div>
          )}

          {/* Reviews List */}
          {contract.reviews.length > 0 && (
            <div className="space-y-3">
              {contract.reviews.map((review) => (
                <div key={review.id} className="border-t pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className={review.rating === 1 ? 'text-green-600' : 'text-red-600'}>
                        {review.rating === 1 ? '👍' : '👎'}
                      </span>
                      <span className="font-medium text-gray-900">
                        {review.user.displayName || review.user.email || 'Anonymous'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-gray-700">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {contract.reviews.length === 0 && (
            <p className="text-gray-500 text-center py-4">
              No reviews yet. Be the first to vote on this contract!
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-center space-x-4">
          <Link href="/browse" className="btn-secondary">
            ← Back to Browse
          </Link>
          <Link href="/upload" className="btn-primary">
            Upload Your Contract
          </Link>
        </div>
      </div>
    </div>
  )
}
