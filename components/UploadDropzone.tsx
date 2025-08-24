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
    setError('')
    
    if (acceptedFiles.length === 0) {
      setError('No valid files selected')
      return
    }

    const file = acceptedFiles[0]
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only PDF, JPG, and PNG are allowed.')
      return
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }

    onFileUpload(file)
  }, [onFileUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
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
              Drag and drop your file here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF, JPG, and PNG files up to 10MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        <p>• Accepted formats: PDF, JPG, PNG</p>
        <p>• Maximum file size: 10MB</p>
        <p>• We'll help you redact personal information in the next step</p>
      </div>
    </div>
  )
}
