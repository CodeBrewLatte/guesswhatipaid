'use client'

interface StatsBarProps {
  stats: {
    avg: number | null
    min: number | null
    max: number | null
  }
}

export function StatsBar({ stats }: StatsBarProps) {
  const formatPrice = (price: number | null) => {
    if (price === null) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Statistics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600 mb-2">
            {formatPrice(stats.avg)}
          </div>
          <div className="text-sm text-gray-600">Average Price</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">
            {formatPrice(stats.min)}
          </div>
          <div className="text-sm text-gray-600">Lowest Price</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-2">
            {formatPrice(stats.max)}
          </div>
          <div className="text-sm text-gray-600">Highest Price</div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Based on {stats.avg ? 'all' : '0'} contracts in your current search
      </div>
    </div>
  )
}
