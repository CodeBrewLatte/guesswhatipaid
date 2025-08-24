'use client'

import Link from 'next/link'
import { useState } from 'react'

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

interface ContractCardProps {
  contract: Contract
  locked: boolean
}

export function ContractCard({ contract, locked }: ContractCardProps) {
  const [imageError, setImageError] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategoryIcon = (category: string) => {
    if (category.toLowerCase().includes('home') || category.toLowerCase().includes('garden')) {
      return '🏠'
    } else if (category.toLowerCase().includes('auto') || category.toLowerCase().includes('transport')) {
      return '🚗'
    } else if (category.toLowerCase().includes('legal')) {
      return '⚖️'
    } else if (category.toLowerCase().includes('professional') || category.toLowerCase().includes('service')) {
      return '💼'
    } else {
      return '📄'
    }
  }

  return (
    <Link href={`/contracts/${contract.id}`} className="block">
      <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full">
        {/* Thumbnail */}
        <div className="mb-4">
          {contract.thumbKey && !imageError ? (
            <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={`/api/v1/files/${contract.thumbKey}`}
                alt="Contract thumbnail"
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-4xl">{getCategoryIcon(contract.category)}</div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Category and Region */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
              {contract.category}
            </span>
            <span className="text-sm text-gray-500">
              {contract.region}
            </span>
          </div>

          {/* Price */}
          <div className="mb-3">
            <div className="text-2xl font-bold text-gray-900">
              {locked ? '— — —' : contract.priceDisplay}
            </div>
            {!locked && contract.pricePerUnit && (
              <div className="text-sm text-gray-600">
                {contract.pricePerUnit}
              </div>
            )}
          </div>

          {/* Description */}
          {contract.description && (
            <p className="text-gray-700 mb-3 line-clamp-2">
              {contract.description}
            </p>
          )}

          {/* Vendor */}
          {contract.vendorName && (
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium">Vendor:</span> {contract.vendorName}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {contract.takenOn ? formatDate(contract.takenOn) : formatDate(contract.createdAt)}
            </span>
            <span className="flex items-center">
              <span className="mr-1">👍</span>
              {contract._count.reviews}
            </span>
          </div>
        </div>

        {/* Lock Overlay */}
        {locked && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-3xl mb-2">🔒</div>
              <div className="text-sm font-medium">Upload to Unlock</div>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
