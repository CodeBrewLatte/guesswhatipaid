'use client'

import { useState, useEffect } from 'react'

interface MetadataFormProps {
  onComplete: (metadata: any) => void
  onBack: () => void
  userRegion: string // Add user's region
}

export function MetadataForm({ onComplete, onBack, userRegion }: MetadataFormProps) {
  const [formData, setFormData] = useState({
    category: '',
    priceCents: '',
    unit: '',
    quantity: '',
    description: '',
    vendorName: '',
    takenOn: '',
    tags: [] as string[],
    dealRating: null as number | null
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<Array<{name: string, count: number} | string>>([])
  const [regions, setRegions] = useState<Array<{name: string, count: number} | string>>([])
  const [newTag, setNewTag] = useState('')
  
  // Deal rating state
  const [dealRating, setDealRating] = useState<number | null>(null)

  // Helper function to safely extract category/region name and value
  const getItemName = (item: {name: string, count: number} | string) => {
    return typeof item === 'string' ? item : item.name
  }

  const getItemValue = (item: {name: string, count: number} | string) => {
    return typeof item === 'string' ? item : item.name
  }

  // Handle deal rating change
  const handleDealRatingChange = (rating: number) => {
    setDealRating(rating)
    setFormData(prev => ({ ...prev, dealRating: rating }))
  }

  // Fetch categories and regions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, regionsRes] = await Promise.all([
          fetch('/api/v1/categories-direct-v2'),
          fetch('/api/v1/regions-direct-v2')
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
        console.error('Error fetching form data:', error)
      }
    }

    fetchData()
  }, [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }
    if (!formData.priceCents) {
      newErrors.priceCents = 'Price is required'
    } else if (isNaN(Number(formData.priceCents)) || Number(formData.priceCents) <= 0) {
      newErrors.priceCents = 'Price must be a positive number'
    } else if (Number(formData.priceCents) < 100) {
      newErrors.priceCents = 'Price must be at least $1.00 (100 cents)'
    } else if (Number(formData.priceCents) > 100000000) { // $1 million max
      newErrors.priceCents = 'Price cannot exceed $1,000,000.00'
    }
    if (formData.quantity && (isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0)) {
      newErrors.quantity = 'Quantity must be a positive number'
    }

    // Check if user has a region set
    if (userRegion === 'Not Set') {
      newErrors.region = 'You must set your state before uploading contracts'
    }
    
    // Check if deal rating is selected
    if (!formData.dealRating) {
      newErrors.dealRating = 'Please rate how good this deal was'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onComplete(formData)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">


      {/* Category and Region */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className={`input-field ${errors.category ? 'border-red-500' : ''}`}
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={getItemValue(category)} value={getItemValue(category)}>
                {getItemName(category)}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category}</p>
          )}
        </div>

        {userRegion !== 'Not Set' ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Your Region:</strong> {userRegion}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Contracts are automatically associated with your state
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Region Not Set:</strong> Please set your state in your profile
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              You need to set your state before uploading contracts
            </p>
            <button 
              type="button"
              onClick={() => window.location.href = '/profile'}
              className="mt-2 text-xs bg-yellow-600 text-white px-3 py-1 rounded hover:bg-yellow-700"
            >
              Set Region
            </button>
          </div>
        )}
      </div>

      {/* Region Error */}
      {errors.region && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{errors.region}</p>
        </div>
      )}

      {/* Price and Unit */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (USD) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.priceCents ? (Number(formData.priceCents) / 100) : ''}
              onChange={(e) => {
                const dollars = parseFloat(e.target.value) || 0
                const cents = Math.round(dollars * 100)
                handleInputChange('priceCents', cents.toString())
              }}
              className={`input-field pl-8 ${errors.priceCents ? 'border-red-500' : ''}`}
              placeholder="300"
            />
          </div>
          {errors.priceCents && (
            <p className="mt-1 text-sm text-red-600">{errors.priceCents}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Unit
          </label>
          <select
            value={formData.unit}
            onChange={(e) => handleInputChange('unit', e.target.value)}
            className="input-field"
          >
            <option value="">Select unit</option>
            <option value="flat">Flat rate</option>
            <option value="hour">Per hour</option>
            <option value="sqft">Per sq ft</option>
            <option value="linear">Per linear ft</option>
            <option value="item">Per item</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={formData.quantity}
            onChange={(e) => handleInputChange('quantity', e.target.value)}
            className={`input-field ${errors.quantity ? 'border-red-500' : ''}`}
            placeholder="e.g., 800"
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
          )}
        </div>
      </div>

      {/* Deal Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          How good was this deal? *
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Rate your satisfaction with this price (1 = ripped off, 5 = stellar deal)
        </p>
        <div className="flex space-x-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => handleDealRatingChange(rating)}
              className={`w-12 h-12 rounded-lg border-2 transition-colors ${
                dealRating === rating
                  ? 'border-primary-500 bg-primary-100 text-primary-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-600'
              }`}
            >
              {rating}
            </button>
          ))}
        </div>
        {dealRating && (
          <p className="mt-2 text-sm text-gray-600">
            {dealRating === 1 && '😞 Ripped off - Way overpriced'}
            {dealRating === 2 && '😕 Expensive - Higher than expected'}
            {dealRating === 3 && '😐 Fair - About what I expected'}
            {dealRating === 4 && '🙂 Good - Better than expected'}
            {dealRating === 5 && '😍 Stellar - Amazing deal!'}
          </p>
        )}
        {errors.dealRating && (
          <p className="mt-1 text-sm text-red-600">{errors.dealRating}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className="input-field"
          placeholder="Brief description of the work or service..."
        />
      </div>

      {/* Vendor Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Vendor/Company Name
        </label>
        <input
          type="text"
          value={formData.vendorName}
          onChange={(e) => handleInputChange('vendorName', e.target.value)}
          className="input-field"
          placeholder="Optional: Name of the company or contractor"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contract Date
        </label>
        <input
          type="date"
          value={formData.takenOn}
          onChange={(e) => handleInputChange('takenOn', e.target.value)}
          className="input-field"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex space-x-2 mb-3">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            className="input-field flex-1"
            placeholder="Add tags to help others find this contract..."
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Add
          </button>
        </div>
        
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-2 text-primary-600 hover:text-primary-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>



      {/* Actions */}
      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={onBack}
          className="btn-secondary"
        >
          ← Back
        </button>
        
        <button
          type="submit"
          className="btn-primary"
        >
          Continue →
        </button>
      </div>
    </form>
  )
}
