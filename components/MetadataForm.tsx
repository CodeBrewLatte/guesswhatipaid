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
    tags: [] as string[]
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<Array<{name: string, count: number} | string>>([])
  const [regions, setRegions] = useState<Array<{name: string, count: number} | string>>([])
  const [newTag, setNewTag] = useState('')
  
  // Enhanced price input state
  const [priceInput, setPriceInput] = useState('')
  const [pricePreview, setPricePreview] = useState('')

  // Helper function to safely extract category/region name and value
  const getItemName = (item: {name: string, count: number} | string) => {
    return typeof item === 'string' ? item : item.name
  }

  const getItemValue = (item: {name: string, count: number} | string) => {
    return typeof item === 'string' ? item : item.name
  }

  // Enhanced price handling
  const handlePriceChange = (value: string) => {
    // Only allow numbers, decimals, and backspace
    const cleanValue = value.replace(/[^0-9.]/g, '')
    
    // Prevent multiple decimal points
    const parts = cleanValue.split('.')
    if (parts.length > 2) return
    
    // Limit decimal places to 2
    if (parts[1] && parts[1].length > 2) return
    
    setPriceInput(cleanValue)
    
    // Convert to cents and update form data
    if (cleanValue && !isNaN(parseFloat(cleanValue))) {
      const dollars = parseFloat(cleanValue)
      const cents = Math.round(dollars * 100)
      setFormData(prev => ({ ...prev, priceCents: cents.toString() }))
      
      // Format preview
      setPricePreview(`$${dollars.toFixed(2)} (${cents.toLocaleString()} cents)`)
      
      // Debug logging
      console.log(`💰 Price Input: $${dollars.toFixed(2)} → ${cents.toLocaleString()} cents`)
    } else {
      setFormData(prev => ({ ...prev, priceCents: '' }))
      setPricePreview('')
    }
    
    // Clear price error if it exists
    if (errors.priceCents) {
      setErrors(prev => ({ ...prev, priceCents: '' }))
    }
  }

  // Format price input on blur
  const handlePriceBlur = () => {
    if (priceInput && !isNaN(parseFloat(priceInput))) {
      const formatted = parseFloat(priceInput).toFixed(2)
      setPriceInput(formatted)
    }
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      // Show confirmation of what's being submitted
      const priceInDollars = (Number(formData.priceCents) / 100).toFixed(2)
      console.log(`🚀 Submitting contract with price: $${priceInDollars} (${formData.priceCents} cents)`)
      console.log(`📊 Price breakdown: ${priceInDollars} dollars = ${formData.priceCents} cents`)
      
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
      {/* Price System Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">💰 New Price Input System</h3>
        <p className="text-xs text-blue-700">
          Enter prices in dollars (e.g., 300.00 for $300). The system automatically converts to cents for storage.
          This prevents confusion and ensures accurate pricing.
        </p>
        <div className="mt-2 text-xs text-blue-600">
          <strong>Examples:</strong><br/>
          • Type "300" → $300.00 (30,000 cents)<br/>
          • Type "150.50" → $150.50 (15,050 cents)<br/>
          • Type "0.99" → $0.99 (99 cents)
        </div>
      </div>

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
          <p className="text-xs text-gray-500 mb-2">
            Enter the price in dollars (e.g., 300.00 for $300)
          </p>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="text" // Changed to text to allow decimal input
              value={priceInput}
              onChange={(e) => handlePriceChange(e.target.value)}
              onBlur={handlePriceBlur} // Call onBlur to format on exit
              className={`input-field pl-8 ${errors.priceCents ? 'border-red-500' : ''}`}
              placeholder="300.00"
              title="Enter price in dollars (e.g., 300.00 for $300)"
            />
          </div>
          {errors.priceCents && (
            <p className="mt-1 text-sm text-red-600">{errors.priceCents}</p>
          )}
          {!errors.priceCents && !formData.priceCents && (
            <p className="mt-1 text-xs text-gray-500">
              Minimum price: $1.00
            </p>
          )}
          {!errors.priceCents && formData.priceCents && Number(formData.priceCents) > 1000000 && (
            <p className="mt-1 text-xs text-yellow-600">
              ⚠️ High price detected: ${(Number(formData.priceCents) / 100).toFixed(2)}
            </p>
          )}
          {pricePreview && (
            <p className="mt-1 text-xs text-gray-600">{pricePreview}</p>
          )}
          {!pricePreview && priceInput && (
            <p className="mt-1 text-xs text-gray-500">
              Enter a valid price to see the conversion
            </p>
          )}
          <p className="mt-1 text-xs text-blue-600">
            💡 The system automatically converts your dollar amount to cents for storage
          </p>
          <button
            type="button"
            onClick={() => {
              setPriceInput('300.00')
              handlePriceChange('300.00')
            }}
            className="mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Try example: $300.00
          </button>
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
            step="0.01"
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

      {/* Price Summary */}
      {formData.priceCents && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-800 mb-2">✅ Price Summary</h3>
          <p className="text-xs text-green-700">
            <strong>You entered:</strong> ${(Number(formData.priceCents) / 100).toFixed(2)}<br/>
            <strong>Will be stored as:</strong> {Number(formData.priceCents).toLocaleString()} cents<br/>
            <strong>Displayed as:</strong> ${(Number(formData.priceCents) / 100).toFixed(2)}
          </p>
        </div>
      )}

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
          title={formData.priceCents ? `Submit contract with price: $${(Number(formData.priceCents) / 100).toFixed(2)}` : 'Submit contract'}
        >
          Continue →
        </button>
      </div>
    </form>
  )
}
