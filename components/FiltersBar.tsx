'use client'

import { useState, useEffect } from 'react'

interface FiltersBarProps {
  filters: {
    category: string
    region: string
    q: string
    min: string
    max: string
    sort: string
  }
  onFilterChange: (filters: any) => void
}

export function FiltersBar({ filters, onFilterChange }: FiltersBarProps) {
  const [categories, setCategories] = useState<string[]>([])
  const [regions, setRegions] = useState<string[]>([])
  const [localFilters, setLocalFilters] = useState(filters)

  // Fetch categories and regions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, regionsRes] = await       Promise.all([
        fetch('/api/v1/categories-direct'),
        fetch('/api/v1/regions-direct')
      ])
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.categories || [])
        }
        
        if (regionsRes.ok) {
          const regionsData = await regionsRes.json()
          setRegions(regionsData.regions || [])
        }
      } catch (error) {
        console.error('Error fetching filter data:', error)
      }
    }

    fetchData()
  }, [])

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...localFilters, [field]: value }
    setLocalFilters(newFilters)
    
    // Debounce the filter change to avoid too many API calls
    setTimeout(() => {
      onFilterChange(newFilters)
    }, 300)
  }

  const handleSearchChange = (value: string) => {
    setLocalFilters(prev => ({ ...prev, q: value }))
    
    // Debounce search to avoid too many API calls
    setTimeout(() => {
      onFilterChange({ ...localFilters, q: value })
    }, 500)
  }

  const clearFilters = () => {
    const clearedFilters = {
      category: '',
      region: '',
      q: '',
      min: '',
      max: '',
      sort: 'newest'
    }
    setLocalFilters(clearedFilters)
    onFilterChange(clearedFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== 'newest')

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Clear all filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            value={localFilters.q}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input-field"
            placeholder="Search descriptions, vendor names..."
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={localFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="input-field"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Region
          </label>
          <select
            value={localFilters.region}
            onChange={(e) => handleFilterChange('region', e.target.value)}
            className="input-field"
          >
            <option value="">All regions</option>
            {regions.map((region) => (
              <option key={region.name} value={region.name}>
                {region.name} ({region.count})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {/* Price Range */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price Range
          </label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={localFilters.min}
              onChange={(e) => handleFilterChange('min', e.target.value)}
              className="input-field"
              placeholder="Min price"
              min="0"
            />
            <span className="flex items-center text-gray-500">to</span>
            <input
              type="number"
              value={localFilters.max}
              onChange={(e) => handleFilterChange('max', e.target.value)}
              className="input-field"
              placeholder="Max price"
              min="0"
            />
          </div>
        </div>

        {/* Sort */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort by
          </label>
          <select
            value={localFilters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="input-field"
          >
            <option value="newest">Newest first</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  )
}
