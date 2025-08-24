'use client'

import Link from 'next/link'

export function LockNotice() {
  return (
    <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg p-6 mb-6">
      <div className="flex items-start space-x-4">
        <div className="text-3xl">🔒</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-primary-800 mb-2">
            Upload to Unlock Full Access
          </h3>
          <p className="text-primary-700 mb-4">
            You're currently seeing limited results with blurred pricing. Upload one approved contract 
            to unlock unlimited browsing and see detailed pricing statistics for all contracts.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/upload" className="btn-primary">
              Upload Your First Contract
            </Link>
            <Link href="/browse" className="btn-secondary">
              Continue Browsing Limited Results
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-primary-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-primary-600">
          <div className="flex items-center">
            <span className="mr-2">✅</span>
            <span>Upload any contract, quote, or invoice</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">✅</span>
            <span>We'll help you redact personal info</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">✅</span>
            <span>Get approved in 24-48 hours</span>
          </div>
        </div>
      </div>
    </div>
  )
}
