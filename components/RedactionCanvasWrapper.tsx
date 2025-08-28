'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import RedactionCanvas with SSR disabled
const RedactionCanvas = dynamic(
  () => import('./RedactionCanvas').then(mod => ({ default: mod.RedactionCanvas })),
  { 
    ssr: false,
    loading: () => (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading redaction tool...</p>
      </div>
    )
  }
)

interface RedactionCanvasWrapperProps {
  file: File
  onComplete: (redactedFile: File, redactions: any[]) => void
  onBack: () => void
}

export function RedactionCanvasWrapper(props: RedactionCanvasWrapperProps) {
  return (
    <Suspense fallback={
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading redaction tool...</p>
      </div>
    }>
      <RedactionCanvas {...props} />
    </Suspense>
  )
}
