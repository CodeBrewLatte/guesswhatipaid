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
  const [categories, setCategories] = useState<string[]>([])
  const [regions, setRegions] = useState<string[]>([])
  const [newTag, setNewTag] = useState('')

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
              <option key={category} value={category}>
                {category}
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
              value={formData.priceCents}
              onChange={(e) => handleInputChange('priceCents', e.target.value)}
              className={`input-field pl-8 ${errors.priceCents ? 'border-red-500' : ''}`}
              placeholder="0.00"
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
