import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '../src/contexts/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'You Paid What - Crowdsourced Pricing Transparency',
  description: 'Discover real-world project costs. Upload a contract to unlock unlimited pricing data.',
  icons: {
    icon: '/guess-logo.png',
    shortcut: '/guess-logo.png',
    apple: '/guess-logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
