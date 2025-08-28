import { NextRequest, NextResponse } from 'next/server'

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

    // Return basic file information for frontend processing
    // PDF rendering is now handled entirely on the client side
    return NextResponse.json({
      success: true,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        message: 'PDF will be rendered on the client side for redaction'
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
