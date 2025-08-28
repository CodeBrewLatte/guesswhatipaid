import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Load PDF with pdf-lib to get metadata
    const pdfDoc = await PDFDocument.load(buffer)
    const pages = pdfDoc.getPages()
    
    if (pages.length === 0) {
      return NextResponse.json({ error: 'PDF has no pages' }, { status: 400 })
    }

    // Get first page dimensions
    const firstPage = pages[0]
    const { width, height } = firstPage.getSize()

    // Return PDF metadata for frontend processing
    return NextResponse.json({
      success: true,
      metadata: {
        pages: pages.length,
        width: Math.round(width),
        height: Math.round(height),
        fileName: file.name,
        fileSize: file.size
      }
    })

  } catch (error) {
    console.error('Error processing PDF:', error)
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    )
  }
}
