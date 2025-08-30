'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../src/contexts/AuthContext'
import { supabase } from '../../src/utils/supabase'
import Link from 'next/link'
import { UploadDropzone } from '@/components/UploadDropzone'
import { RedactionCanvasWrapper } from '@/components/RedactionCanvasWrapper'
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
    dealRating: number | null
  }
}

export default function UploadPage() {
  const { user, signOut } = useAuth()
  const isSignedIn = !!user
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload')
  const [userRegion, setUserRegion] = useState<string>('Not Set')
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
      tags: [],
      dealRating: null
    }
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Fetch user's region when component mounts
  useEffect(() => {
    const fetchUserRegion = async () => {
      if (user) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.access_token) {
            const profileResponse = await fetch('/api/v1/users/profile-direct', {
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
              },
            });
            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              setUserRegion(profileData.region || 'Not Set');
            }
          }
        } catch (error) {
          console.error('Error fetching user region:', error);
        }
      }
    };

    fetchUserRegion();
  }, [user]);

  const handleFileUpload = (file: File) => {
    setUploadData(prev => ({ ...prev, file }))
    setCurrentStep('redact')
    setError('')
  }

  const handleRedactionComplete = (redactedFile: File, redactions: RedactionBox[]) => {
    setUploadData(prev => ({ 
      ...prev, 
      file: redactedFile, // Use the redacted file instead of original
      redactions 
    }))
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
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const profileResponse = await fetch('/api/v1/users/profile-direct', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            formData.append('region', profileData.region || '');
          } else {
            formData.append('region', '');
          }
        } else {
          formData.append('region', '');
        }
      } catch (error) {
        console.error('Error fetching user region:', error);
        formData.append('region', '');
      }

      // Get the session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('/api/v1/contracts-direct', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
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
        priceCents: '',
        unit: '',
        quantity: '',
        description: '',
        vendorName: '',
        takenOn: '',
        tags: [],
        dealRating: null
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
              <Link href="/browse" className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative group">
                Browse
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link href="/upload" className="text-blue-600 font-semibold relative group">
                Upload
                <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-500"></span>
              </Link>
              <div className="flex items-center space-x-4">
                <Link href="/profile" className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 transition-colors duration-200 group">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center border-2 border-blue-200 group-hover:border-blue-300 transition-all duration-200">
                    {user?.user_metadata?.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url} 
                        alt="Profile" 
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : user?.user_metadata?.full_name ? (
                      <span className="text-sm font-medium text-blue-600">
                        {user.user_metadata.full_name.charAt(0).toUpperCase()}
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-blue-600">
                        {user?.email?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium hidden sm:block">Profile</span>
                </Link>
                <button onClick={() => signOut()} className="text-gray-700 hover:text-red-600 font-medium transition-colors duration-200">
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-12">
        {/* Progress Steps */}
        <div className="mb-12">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 max-w-4xl mx-auto">
            <div className="flex items-center justify-between">
              {[
                { key: 'upload', label: 'Upload File', icon: '📁' },
                { key: 'redact', label: 'Redact Info', icon: '✏️' },
                { key: 'metadata', label: 'Add Details', icon: '📝' },
                { key: 'preview', label: 'Review', icon: '👀' },
                { key: 'submitted', label: 'Complete', icon: '✅' }
              ].map((step, index) => (
                <div key={step.key} className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                    currentStep === step.key 
                      ? 'border-blue-500 bg-blue-500 text-white shadow-lg scale-110'
                      : index < ['upload', 'redact', 'metadata', 'preview', 'submitted'].indexOf(currentStep)
                      ? 'border-green-500 bg-green-500 text-white shadow-md'
                      : 'border-gray-200 bg-white text-gray-400'
                  }`}>
                    <span className="text-base">{step.icon}</span>
                  </div>
                  <span className={`mt-3 text-sm font-medium text-center transition-colors duration-300 ${
                    currentStep === step.key ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                  {index < 4 && (
                    <div className={`absolute top-6 left-1/2 w-16 h-0.5 transition-all duration-500 ${
                      index < ['upload', 'redact', 'metadata', 'preview', 'submitted'].indexOf(currentStep)
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`} style={{ transform: 'translateX(50%)' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-2xl shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
          {currentStep === 'upload' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📁</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Contract</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Upload a JPG, PNG, or HEIC image of your contract, quote, or invoice. 
                We'll help you redact personal information in the next step.
              </p>
              <UploadDropzone onFileUpload={handleFileUpload} />
            </div>
          )}

          {currentStep === 'redact' && uploadData.file && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">✏️</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Redact Personal Information</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Draw rectangles over any personal information like names, addresses, 
                account numbers, or other sensitive data.
              </p>
              <RedactionCanvasWrapper 
                file={uploadData.file}
                onComplete={handleRedactionComplete}
                onBack={() => setCurrentStep('upload')}
              />
            </div>
          )}

          {currentStep === 'metadata' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📝</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Add Contract Details</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Fill in the details about your contract to help others find and compare pricing.
              </p>
              <MetadataForm
                onComplete={handleMetadataComplete}
                onBack={() => setCurrentStep('redact')}
                userRegion={userRegion}
              />
            </div>
          )}

          {currentStep === 'preview' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">👀</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Review Your Submission</h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Review the details before submitting. You can go back to make changes.
              </p>
              
              <div className="space-y-6 mb-8">
                <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border border-blue-100">
                  <h3 className="font-semibold mb-3 text-blue-900">File</h3>
                  <p className="text-blue-700">{uploadData.file?.name}</p>
                </div>
                
                <div className="p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border border-green-100">
                  <h3 className="font-semibold mb-3 text-green-900">Contract Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Category:</span> {uploadData.metadata.category}
                    </div>
                    <div>
                      <span className="font-medium">Region:</span> {userRegion}
                    </div>
                    <div>
                      <span className="font-medium">Price:</span> ${(Number(uploadData.metadata.priceCents) / 100).toFixed(2)}
                    </div>
                    {uploadData.metadata.unit && (
                      <div>
                        <span className="font-medium">Unit:</span> {uploadData.metadata.unit}
                        {uploadData.metadata.quantity && ` (${uploadData.metadata.quantity})`}
                      </div>
                    )}
                    {uploadData.metadata.dealRating && (
                      <div>
                        <span className="font-medium">Deal Rating:</span> {uploadData.metadata.dealRating}/5
                        <span className="text-xs text-gray-500 ml-2">
                          {uploadData.metadata.dealRating === 1 && '😞 Ripped off'}
                          {uploadData.metadata.dealRating === 2 && '😕 Expensive'}
                          {uploadData.metadata.dealRating === 3 && '😐 Fair'}
                          {uploadData.metadata.dealRating === 4 && '🙂 Good'}
                          {uploadData.metadata.dealRating === 5 && '😍 Stellar!'}
                        </span>
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

              <div className="flex space-x-6 justify-center">
                <button
                  onClick={() => setCurrentStep('metadata')}
                  className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 border border-gray-200 hover:border-gray-300"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Contract'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 'submitted' && (
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                <span className="text-6xl">🎉</span>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Contract Submitted!</h2>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Thank you for contributing to pricing transparency! Your contract is now 
                under review and will be available to others once approved.
              </p>
              <p className="text-gray-500 mb-8 max-w-2xl mx-auto">
                You'll receive an email notification when your contract is approved, 
                and then you'll have full access to browse all pricing data.
              </p>
              <div className="flex space-x-6 justify-center">
                <button
                  onClick={resetUpload}
                  className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 border border-gray-200 hover:border-gray-300"
                >
                  Upload Another
                </button>
                <Link href="/browse" className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg inline-block">
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
