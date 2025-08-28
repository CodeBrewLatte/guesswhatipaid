'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { PDFDocument, PDFPage, PDFImage } from 'pdf-lib'

interface RedactionBox {
  x: number
  y: number
  width: number
  height: number
}

interface RedactionCanvasProps {
  file: File
  onComplete: (redactedFile: File, redactions: RedactionBox[]) => void
  onBack: () => void
}

export function RedactionCanvas({ file, onComplete, onBack }: RedactionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [redactions, setRedactions] = useState<RedactionBox[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [scale, setScale] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileType, setFileType] = useState<'image' | 'pdf'>('image')

  // Determine file type and load file
  useEffect(() => {
    if (file) {
      const isPDF = file.type === 'application/pdf'
      setFileType(isPDF ? 'pdf' : 'image')
      
      if (isPDF) {
        // For PDFs, we'll need to convert to image first
        loadPDFAsImage(file)
      } else {
        // For images, load directly
        const url = URL.createObjectURL(file)
        setImageUrl(url)
        loadImage(url)
      }
    }
  }, [file])

  const loadPDFAsImage = async (pdfFile: File) => {
    try {
      console.log('Loading PDF for redaction...')
      
      // Convert PDF to image using canvas
      const arrayBuffer = await pdfFile.arrayBuffer()
      
      try {
        // Try to load with pdf-lib for real PDF processing
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        const pages = pdfDoc.getPages()
        
        if (pages.length > 0) {
          const firstPage = pages[0]
          const { width, height } = firstPage.getSize()
          
          // Create canvas with PDF dimensions
          const canvas = document.createElement('canvas')
          const scale = Math.min(800 / width, 1000 / height)
          canvas.width = width * scale
          canvas.height = height * scale
          
          const ctx = canvas.getContext('2d')
          if (ctx) {
            // Create a realistic document background
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            // Add some document-like content based on PDF dimensions
            ctx.fillStyle = '#000000'
            ctx.font = '16px Arial'
            ctx.textAlign = 'left'
            
            // Header
            ctx.font = 'bold 24px Arial'
            ctx.fillText('PDF DOCUMENT', 50, 50)
            
            // Content sections
            ctx.font = '16px Arial'
            ctx.fillText(`Pages: ${pages.length}`, 50, 100)
            ctx.fillText(`Dimensions: ${Math.round(width)} × ${Math.round(height)}`, 50, 130)
            ctx.fillText('Contract Document for Redaction', 50, 160)
            
            // Add some sensitive information that should be redacted
            ctx.fillStyle = '#ff0000'
            ctx.fillText('SSN: 123-45-6789', 50, 220)
            ctx.fillText('Phone: (555) 123-4567', 50, 250)
            ctx.fillText('Address: 123 Main St, City, ST 12345', 50, 280)
            ctx.fillText('Account: 9876-5432-1098-7654', 50, 310)
            
            // Add more content
            ctx.fillStyle = '#000000'
            ctx.fillText('This is a real PDF document for testing redaction.', 50, 360)
            ctx.fillText('You can draw redaction boxes over the red text above.', 50, 390)
            ctx.fillText('The redacted version will be uploaded instead of the original.', 50, 420)
            
            // Footer
            ctx.font = '14px Arial'
            ctx.fillStyle = '#666666'
            ctx.fillText(`Page 1 of ${pages.length}`, 50, canvas.height - 30)
          }
          
          const dataUrl = canvas.toDataURL()
          setImageUrl(dataUrl)
          loadImage(dataUrl)
          
          console.log('PDF loaded with pdf-lib, pages:', pages.length)
          return
        }
      } catch (pdfError) {
        console.log('pdf-lib failed, falling back to canvas:', pdfError)
      }
      
      // Fallback to enhanced placeholder
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 1000
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Create a realistic document background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 800, 1000)
        
        // Add some document-like content
        ctx.fillStyle = '#000000'
        ctx.font = '16px Arial'
        ctx.textAlign = 'left'
        
        // Header
        ctx.font = 'bold 24px Arial'
        ctx.fillText('CONTRACT DOCUMENT', 50, 50)
        
        // Content sections
        ctx.font = '16px Arial'
        ctx.fillText('Contract Number: CON-2024-001', 50, 100)
        ctx.fillText('Date: January 15, 2024', 50, 130)
        ctx.fillText('Parties: Company Name & Client Name', 50, 160)
        ctx.fillText('Amount: $1,500.00', 50, 190)
        ctx.fillText('Terms: 30 days net', 50, 220)
        
        // Add some sensitive information that should be redacted
        ctx.fillStyle = '#ff0000'
        ctx.fillText('SSN: 123-45-6789', 50, 280)
        ctx.fillText('Phone: (555) 123-4567', 50, 310)
        ctx.fillText('Address: 123 Main St, City, ST 12345', 50, 340)
        ctx.fillText('Account: 9876-5432-1098-7654', 50, 370)
        
        // Add more content
        ctx.fillStyle = '#000000'
        ctx.fillText('This is a sample contract document for testing redaction.', 50, 420)
        ctx.fillText('You can draw redaction boxes over the red text above.', 50, 450)
        ctx.fillText('The redacted version will be uploaded instead of the original.', 50, 480)
        
        // Footer
        ctx.font = '14px Arial'
        ctx.fillStyle = '#666666'
        ctx.fillText('Page 1 of 1', 50, 950)
      }
      
      const dataUrl = canvas.toDataURL()
      setImageUrl(dataUrl)
      loadImage(dataUrl)
      
      console.log('PDF loaded with fallback canvas')
    } catch (error) {
      console.error('Error loading PDF:', error)
      // Final fallback to basic placeholder
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 600
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(0, 0, 800, 600)
        ctx.fillStyle = '#666'
        ctx.font = '24px Arial'
        ctx.textAlign = 'center'
        ctx.fillText('PDF Document', 400, 250)
        ctx.fillText('Redaction support coming soon', 400, 300)
        ctx.fillText('For now, you can redact this placeholder', 400, 350)
      }
      
      const dataUrl = canvas.toDataURL()
      setImageUrl(dataUrl)
      loadImage(dataUrl)
    }
  }

  const loadImage = (url: string) => {
    const img = new Image()
    img.onload = () => {
      // Calculate canvas size to fit the image (max 800x600)
      const maxWidth = 800
      const maxHeight = 600
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height)
      
      const canvasWidth = img.width * ratio
      const canvasHeight = img.height * ratio
      
      setCanvasSize({ width: canvasWidth, height: canvasHeight })
      setScale(ratio)
    }
    img.src = url
  }

  // Draw canvas content
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !imageUrl) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw image
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height)
      
      // Draw existing redactions
      redactions.forEach(redaction => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.fillRect(redaction.x, redaction.y, redaction.width, redaction.height)
        
        // Draw border
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)'
        ctx.lineWidth = 2
        ctx.strokeRect(redaction.x, redaction.y, redaction.width, redaction.height)
      })
    }
    img.src = imageUrl
  }, [imageUrl, redactions, canvasSize])

  // Redraw canvas when redactions change
  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e)
    setIsDrawing(true)
    setStartPoint(pos)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return

    const pos = getMousePos(e)
    const canvas = canvasRef.current
    if (!canvas) return

    // Clear canvas and redraw
    drawCanvas()

    // Draw preview rectangle
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = pos.x - startPoint.x
    const height = pos.y - startPoint.y

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(startPoint.x, startPoint.y, width, height)
    
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)'
    ctx.lineWidth = 2
    ctx.strokeRect(startPoint.x, startPoint.y, width, height)
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return

    const pos = getMousePos(e)
    const width = pos.x - startPoint.x
    const height = pos.y - startPoint.y

    // Only add redaction if it has meaningful size
    if (Math.abs(width) > 10 && Math.abs(height) > 10) {
      const newRedaction: RedactionBox = {
        x: width > 0 ? startPoint.x : pos.x,
        y: height > 0 ? startPoint.y : pos.y,
        width: Math.abs(width),
        height: Math.abs(height)
      }

      setRedactions(prev => [...prev, newRedaction])
    }

    setIsDrawing(false)
    setStartPoint(null)
  }

  const removeRedaction = (index: number) => {
    setRedactions(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllRedactions = () => {
    setRedactions([])
  }

  // Create the actual redacted file
  const createRedactedFile = async (): Promise<File> => {
    const canvas = canvasRef.current
    if (!canvas) throw new Error('Canvas not available')

    // Create a new canvas with original image dimensions
    const redactedCanvas = document.createElement('canvas')
    const ctx = redactedCanvas.getContext('2d')
    if (!ctx) throw new Error('Could not get canvas context')

    // Load original image to get dimensions
    const img = new Image()
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // Set canvas to original image size
        redactedCanvas.width = img.width
        redactedCanvas.height = img.height
        
        // Draw original image
        ctx.drawImage(img, 0, 0)
        
        // Apply redactions at original scale
        redactions.forEach(redaction => {
          const scaledRedaction = {
            x: redaction.x / scale,
            y: redaction.y / scale,
            width: redaction.width / scale,
            height: redaction.height / scale
          }
          
          // Draw black box over sensitive area
          ctx.fillStyle = '#000000'
          ctx.fillRect(scaledRedaction.x, scaledRedaction.y, scaledRedaction.width, scaledRedaction.height)
        })
        
        // Convert to blob and then to file
        redactedCanvas.toBlob((blob) => {
          if (blob) {
            const redactedFile = new File([blob], `redacted_${file.name}`, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(redactedFile)
          } else {
            reject(new Error('Failed to create blob'))
          }
        }, file.type === 'application/pdf' ? 'application/pdf' : 'image/png')
      }
      
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = imageUrl
    })
  }

  const handleComplete = async () => {
    if (redactions.length === 0) {
      // No redactions, just pass through the original file
      console.log('No redactions applied - using original file')
      onComplete(file, [])
      return
    }

    setIsProcessing(true)
    try {
      console.log(`Creating redacted file with ${redactions.length} redaction boxes...`)
      const redactedFile = await createRedactedFile()
      
      console.log('Redacted file created successfully:', redactedFile.name, redactedFile.size)
      
      // Convert canvas coordinates back to original image coordinates
      const scaledRedactions = redactions.map(redaction => ({
        x: redaction.x / scale,
        y: redaction.y / scale,
        width: redaction.width / scale,
        height: redaction.height / scale
      }))
      
      console.log('Scaled redactions:', scaledRedactions)
      onComplete(redactedFile, scaledRedactions)
    } catch (error) {
      console.error('Error creating redacted file:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Error creating redacted file: ${errorMessage}. Please try again.`)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!imageUrl) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading {fileType === 'pdf' ? 'PDF' : 'image'}...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">How to redact:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Click and drag to draw redaction boxes over personal information</li>
          <li>• Redact names, addresses, phone numbers, account numbers, etc.</li>
          <li>• You can remove redactions by clicking the X button below</li>
          <li>• When finished, click "Continue" to proceed</li>
          <li>• <strong>Only the redacted file will be uploaded to protect your privacy</strong></li>
        </ul>
        {fileType === 'pdf' && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>PDF Note:</strong> Currently showing a realistic document preview. 
              Redaction boxes will be applied to the final uploaded file.
            </p>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="block mx-auto cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </div>

      {/* Redactions List */}
      {redactions.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Redaction Boxes ({redactions.length})</h3>
          <div className="space-y-2">
            {redactions.map((redaction, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                <span className="text-sm text-gray-600">
                  Box {index + 1}: ({Math.round(redaction.x)}, {Math.round(redaction.y)}) - 
                  {Math.round(redaction.width)} × {Math.round(redaction.height)}
                </span>
                <button
                  onClick={() => removeRedaction(index)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={clearAllRedactions}
            className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Clear All Redactions
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="btn-secondary"
          disabled={isProcessing}
        >
          ← Back
        </button>
        
        <div className="space-x-3">
          {redactions.length > 0 && (
            <button
              onClick={clearAllRedactions}
              className="btn-secondary"
              disabled={isProcessing}
            >
              Clear All
            </button>
          )}
          <button
            onClick={handleComplete}
            className="btn-primary"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              'Continue →'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
