'use client'

import { useState, useRef } from 'react'
import { useAuth } from '../../src/contexts/AuthContext'
import Link from 'next/link'
import { UploadDropzone } from '@/components/UploadDropzone'
import { RedactionCanvas } from '@/components/RedactionCanvas'
import { MetadataForm } from '@/components/MetadataForm'

type UploadStep = 'upload' | 'redact' | 'metadata' | 'preview' | 'submitted'

interface RedactionBox {
  x: number
  y: number
  width: number
  height: number
}

interface UploadData {
  file: File | null
  redactions: RedactionBox[]
  metadata: {
    category: string
    priceCents: string
    unit: string
    quantity: string
    description: string
    vendorName: string
    takenOn: string
    tags: string[]
  }
}

export default function UploadPage() {
  const { user } = useAuth()
  const isSignedIn = !!user
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload')
  const [uploadData, setUploadData] = useState<UploadData>({
    file: null,
    redactions: [],
    metadata: {
      category: '',
      priceCents: '',
      unit: '',
      quantity: '',
      description: '',
      vendorName: '',
      takenOn: '',
      tags: []
    }
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleFileUpload = (file: File) => {
    setUploadData(prev => ({ ...prev, file }))
    setCurrentStep('redact')
    setError('')
  }

  const handleRedactionComplete = (redactions: RedactionBox[]) => {
    setUploadData(prev => ({ ...prev, redactions }))
    setCurrentStep('metadata')
  }

  const handleMetadataComplete = (metadata: any) => {
    setUploadData(prev => ({ ...prev, metadata }))
    setCurrentStep('preview')
  }

  const handleSubmit = async () => {
    if (!uploadData.file) {
      setError('No file selected')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', uploadData.file)
      formData.append('redactions', JSON.stringify(uploadData.redactions))
      
      Object.entries(uploadData.metadata).forEach(([key, value]) => {
        if (value) {
          if (key === 'tags' && Array.isArray(value)) {
            value.forEach(tag => formData.append('tags[]', tag))
          } else if (typeof value === 'string') {
            formData.append(key, value)
          }
        }
      })

      // Automatically add the user's region
      formData.append('region', user?.region || '')

      const response = await fetch('/api/v1/contracts', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      setCurrentStep('submitted')
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const resetUpload = () => {
    setUploadData({
      file: null,
      redactions: [],
      metadata: {
        category: '',
        region: '',
        priceCents: '',
        unit: '',
        quantity: '',
        description: '',
        vendorName: '',
        takenOn: '',
        tags: []
      }
    })
    setCurrentStep('upload')
    setError('')
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to upload</h1>
          <p className="text-gray-600 mb-6">You need to be signed in to upload contracts</p>
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
              <Link href="/upload" className="text-primary-600 font-medium">
                Upload
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[
              { key: 'upload', label: 'Upload File', icon: '📁' },
              { key: 'redact', label: 'Redact Info', icon: '✏️' },
              { key: 'metadata', label: 'Add Details', icon: '📝' },
              { key: 'preview', label: 'Review', icon: '👀' },
              { key: 'submitted', label: 'Complete', icon: '✅' }
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep === step.key 
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : index < ['upload', 'redact', 'metadata', 'preview', 'submitted'].indexOf(currentStep)
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-500'
                }`}>
                  <span className="text-sm">{step.icon}</span>
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep === step.key ? 'text-primary-600' : 'text-gray-500'
                }`}>
                  {step.label}
                </span>
                {index < 4 && (
                  <div className={`ml-4 w-8 h-0.5 ${
                    index < ['upload', 'redact', 'metadata', 'preview', 'submitted'].indexOf(currentStep)
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="card">
          {currentStep === 'upload' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Upload Your Contract</h2>
              <p className="text-gray-600 mb-6">
                Upload a PDF, JPG, or PNG file of your contract, quote, or invoice. 
                We'll help you redact personal information in the next step.
              </p>
              <UploadDropzone onFileUpload={handleFileUpload} />
            </div>
          )}

          {currentStep === 'redact' && uploadData.file && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Redact Personal Information</h2>
              <p className="text-gray-600 mb-6">
                Draw rectangles over any personal information like names, addresses, 
                account numbers, or other sensitive data.
              </p>
              <RedactionCanvas 
                file={uploadData.file}
                onComplete={handleRedactionComplete}
                onBack={() => setCurrentStep('upload')}
              />
            </div>
          )}

          {currentStep === 'metadata' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Add Contract Details</h2>
              <p className="text-gray-600 mb-6">
                Fill in the details about your contract to help others find and compare pricing.
              </p>
                    <MetadataForm
        onComplete={handleMetadataComplete}
        onBack={() => setCurrentStep('redact')}
        userRegion={user?.region || 'Not Set'}
      />
            </div>
          )}

          {currentStep === 'preview' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Review Your Submission</h2>
              <p className="text-gray-600 mb-6">
                Review the details before submitting. You can go back to make changes.
              </p>
              
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">File</h3>
                  <p className="text-gray-600">{uploadData.file?.name}</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Contract Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Category:</span> {uploadData.metadata.category}
                    </div>
                    <div>
                      <span className="font-medium">Region:</span> {uploadData.metadata.region}
                    </div>
                    <div>
                      <span className="font-medium">Price:</span> ${uploadData.metadata.priceCents}
                    </div>
                    {uploadData.metadata.unit && (
                      <div>
                        <span className="font-medium">Unit:</span> {uploadData.metadata.unit}
                        {uploadData.metadata.quantity && ` (${uploadData.metadata.quantity})`}
                      </div>
                    )}
                  </div>
                  {uploadData.metadata.description && (
                    <div className="mt-2">
                      <span className="font-medium">Description:</span> {uploadData.metadata.description}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setCurrentStep('metadata')}
                  className="btn-secondary"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? 'Submitting...' : 'Submit Contract'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'submitted' && (
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold mb-4">Contract Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Thank you for contributing to pricing transparency! Your contract is now 
                under review and will be available to others once approved.
              </p>
              <p className="text-gray-500 mb-8">
                You'll receive an email notification when your contract is approved, 
                and then you'll have full access to browse all pricing data.
              </p>
              <div className="flex space-x-4 justify-center">
                <button
                  onClick={resetUpload}
                  className="btn-secondary"
                >
                  Upload Another
                </button>
                <Link href="/browse" className="btn-primary">
                  Browse Contracts
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
