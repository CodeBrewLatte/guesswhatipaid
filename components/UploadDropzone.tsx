'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'

interface UploadDropzoneProps {
  onFileUpload: (file: File) => void
}

export function UploadDropzone({ onFileUpload }: UploadDropzoneProps) {
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      
      // Check if it's a PDF and block it with friendly message
      if (file.type === 'application/pdf') {
        alert('📱 PDFs are not supported. Please take a photo with your phone instead!\n\nThis gives you a better redaction experience and works perfectly on mobile devices.')
        return
      }
      
      // Only accept images
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (JPEG, PNG, etc.)')
        return
      }
      
      onFileUpload(file)
    }
  }, [onFileUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp', '.heic']
    },
    multiple: false
  })

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        
        <div className="text-6xl mb-4">📁</div>
        
        {isDragActive ? (
          <p className="text-lg text-primary-600 font-medium">
            Drop your file here...
          </p>
        ) : (
                  <div>
          <p className="text-lg text-gray-600 mb-2">
            Drag and drop your contract photo here, or click to select
          </p>
          <p className="text-sm text-gray-500">
            Supports JPEG, PNG, HEIC files up to 10MB
          </p>
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            📱 <strong>Mobile Optimized:</strong> Works perfectly on phones!
          </div>
        </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p>• Accepted formats: JPEG, PNG, HEIC</p>
        <p>• Maximum file size: 10MB</p>
        <p>• 📱 Take photos directly from your phone for best results</p>
        <p>• We'll help you redact personal information in the next step</p>
      </div>
    </div>
  )
}
