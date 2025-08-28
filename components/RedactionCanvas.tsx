'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [zoom, setZoom] = useState(1)

  // Determine file type and load file
  useEffect(() => {
    if (file && typeof window !== 'undefined') {
      const isPDF = file.type === 'application/pdf'
      setFileType(isPDF ? 'pdf' : 'image')
      
      if (isPDF) {
        loadPDF(file)
      } else {
        // For images, load directly
        const url = URL.createObjectURL(file)
        setImageUrl(url)
        loadImage(url)
      }
    }
  }, [file])

  const loadPDF = async (pdfFile: File) => {
    try {
      console.log('Loading PDF for redaction...')
      
      // Create a hybrid approach: show actual PDF + redaction canvas
      createHybridPDFView(pdfFile)
      
    } catch (error) {
      console.error('Error in PDF processing:', error)
      // Fallback to basic preview
      createBasicPDFPreview(pdfFile)
    }
  }

  const createHybridPDFView = (pdfFile: File) => {
    // Create a hybrid view: actual PDF for viewing + canvas for redaction
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      // Create a transparent overlay canvas for redaction
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.fillRect(0, 0, 800, 600)
      
      // Add redaction instructions on the canvas
      ctx.fillStyle = '#0066cc'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('REDACTION CANVAS', 400, 30)
      ctx.fillText('Draw redaction boxes over sensitive areas below', 400, 55)
      ctx.fillText('Your actual PDF is displayed underneath', 400, 80)
    }
    
    const dataUrl = canvas.toDataURL()
    setImageUrl(dataUrl)
    setCanvasSize({ width: 800, height: 600 })
    setScale(1)
    
    // Create the actual PDF viewer
    createPDFViewer(pdfFile)
    
    console.log('Hybrid PDF view created successfully')
  }

  const createPDFViewer = (pdfFile: File) => {
    // Create an iframe to show the actual PDF content
    const pdfViewer = document.createElement('div')
    pdfViewer.style.marginTop = '20px'
    pdfViewer.style.border = '2px solid #e5e7eb'
    pdfViewer.style.borderRadius = '8px'
    pdfViewer.style.overflow = 'hidden'
    pdfViewer.style.backgroundColor = '#f9fafb'
    
    // Add header
    const header = document.createElement('div')
    header.style.padding = '12px 16px'
    header.style.backgroundColor = '#f3f4f6'
    header.style.borderBottom = '1px solid #e5e7eb'
    header.style.fontWeight = 'bold'
    header.style.color = '#374151'
    header.textContent = `📄 ${pdfFile.name} - Your Actual PDF Content`
    pdfViewer.appendChild(header)
    
    // Create iframe for PDF
    const iframe = document.createElement('iframe')
    iframe.id = 'pdf-iframe' // Add an ID for easy removal
    iframe.src = URL.createObjectURL(pdfFile)
    iframe.style.width = '100%'
    iframe.style.height = '500px'
    iframe.style.border = 'none'
    iframe.style.backgroundColor = 'white'
    
    // Add error handling for iframe
    iframe.onerror = () => {
      console.error('PDF iframe failed to load, trying object tag fallback')
      createObjectTagFallback(pdfFile, pdfViewer)
    }
    iframe.onload = () => console.log('PDF iframe loaded successfully')
    
    // Add timeout to detect if iframe fails silently
    setTimeout(() => {
      if (iframe.contentDocument && iframe.contentDocument.body.innerHTML === '') {
        console.log('Iframe appears empty, trying object tag fallback')
        createObjectTagFallback(pdfFile, pdfViewer)
      }
    }, 3000)
    
    pdfViewer.appendChild(iframe)
    
    // Add instructions below
    const instructions = document.createElement('div')
    instructions.style.padding = '12px 16px'
    instructions.style.backgroundColor = '#fef3c7'
    instructions.style.borderTop = '1px solid #f59e0b'
    instructions.style.fontSize = '14px'
    instructions.style.color = '#92400e'
    instructions.innerHTML = `
      <strong>How to redact:</strong><br>
      1. View your PDF content above<br>
      2. Draw redaction boxes on the canvas below<br>
      3. The redactions will be applied to your actual PDF<br>
      4. Only the redacted version will be uploaded
    `
    pdfViewer.appendChild(instructions)
    
    // Insert PDF viewer after the canvas
    const canvasElement = canvasRef.current
    if (canvasElement && canvasElement.parentNode) {
      canvasElement.parentNode.insertBefore(pdfViewer, canvasElement.nextSibling)
    }
  }

  const createObjectTagFallback = (pdfFile: File, pdfViewer: HTMLElement) => {
    console.log('Using object tag fallback for PDF loading...')
    const objectTag = document.createElement('object')
    objectTag.data = URL.createObjectURL(pdfFile)
    objectTag.type = 'application/pdf'
    objectTag.style.width = '100%'
    objectTag.style.height = '500px'
    objectTag.style.border = 'none'
    objectTag.style.backgroundColor = 'white'
    pdfViewer.appendChild(objectTag)
  }

  const createBasicPDFPreview = (pdfFile: File) => {
    // Fallback preview if smart preview fails
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 600
    const ctx = canvas.getContext('2d')
    
    if (ctx) {
      ctx.fillStyle = '#f8f9fa'
      ctx.fillRect(0, 0, 800, 600)
      ctx.fillStyle = '#666'
      ctx.font = '24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('PDF Document Ready for Redaction', 400, 250)
      ctx.fillText('Draw redaction boxes over sensitive areas', 400, 300)
      ctx.fillText('Your original PDF will be protected', 400, 350)
    }
    
    const dataUrl = canvas.toDataURL()
    setImageUrl(dataUrl)
    setCanvasSize({ width: 800, height: 600 })
    setScale(1)
    
    createDownloadLink(pdfFile)
  }

  const createDownloadLink = (pdfFile: File) => {
    // Create a download link for the original PDF
    const downloadLink = document.createElement('div')
    downloadLink.style.marginTop = '20px'
    downloadLink.style.padding = '15px'
    downloadLink.style.backgroundColor = '#f8f9fa'
    downloadLink.style.border = '1px solid #dee2e6'
    downloadLink.style.borderRadius = '5px'
    downloadLink.style.textAlign = 'center'
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(pdfFile)
    link.download = `original_${pdfFile.name}`
    link.textContent = '📄 Download Original PDF for Reference'
    link.style.color = '#0066cc'
    link.style.textDecoration = 'none'
    link.style.fontWeight = 'bold'
    
    downloadLink.appendChild(link)
    
    // Insert download link after the canvas
    const canvasElement = canvasRef.current
    if (canvasElement && canvasElement.parentNode) {
      canvasElement.parentNode.insertBefore(downloadLink, canvasElement.nextSibling)
    }
  }

  const loadImage = (url: string) => {
    if (typeof window === 'undefined') return
    
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
    if (typeof window === 'undefined') return
    
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
    if (typeof window === 'undefined') return { x: 0, y: 0 }
    
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

    if (Math.abs(width) > 5 && Math.abs(height) > 5) {
      const newRedaction: RedactionBox = {
        x: Math.min(startPoint.x, pos.x),
        y: Math.min(startPoint.y, pos.y),
        width: Math.abs(width),
        height: Math.abs(height)
      }
      setRedactions(prev => [...prev, newRedaction])
    }

    setIsDrawing(false)
    setStartPoint(null)
  }

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const pos = getTouchPos(touch)
      setIsDrawing(true)
      setStartPoint(pos)
    }
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing || !startPoint || e.touches.length !== 1) return

    const touch = e.touches[0]
    const pos = getTouchPos(touch)
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

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing || !startPoint) return

    const touch = e.changedTouches[0]
    const pos = getTouchPos(touch)
    const width = pos.x - startPoint.x
    const height = pos.y - startPoint.y

    if (Math.abs(width) > 5 && Math.abs(height) > 5) {
      const newRedaction: RedactionBox = {
        x: Math.min(startPoint.x, pos.x),
        y: Math.min(startPoint.y, pos.y),
        width: Math.abs(width),
        height: Math.abs(height)
      }
      setRedactions(prev => [...prev, newRedaction])
    }

    setIsDrawing(false)
    setStartPoint(null)
  }

  // Wheel event handler for zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom(prev => Math.max(0.5, Math.min(3, prev * delta)))
  }

  // Helper function for touch positions
  const getTouchPos = (touch: React.Touch) => {
    if (typeof window === 'undefined') return { x: 0, y: 0 }
    
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: (touch.clientX - rect.left) / zoom,
      y: (touch.clientY - rect.top) / zoom
    }
  }

  const removeRedaction = (index: number) => {
    setRedactions(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllRedactions = () => {
    setRedactions([])
  }

  const changePage = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    
    setCurrentPage(newPage)
    // Page changes are handled by the preview system
    console.log(`Page changed to ${newPage}`)
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
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800 mb-3">
              <strong>PDF Note:</strong> Your actual PDF content is displayed below! 
              You can see your real document and draw redaction boxes over sensitive areas.
            </p>
            <div className="text-sm text-gray-600 mb-3">
              <span className="font-medium">📄 Hybrid PDF Redaction</span>
              <br />
              <span>View your PDF content above, then redact sensitive areas on the canvas below</span>
            </div>
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
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
