'use client';

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '../src/contexts/AuthContext'
import { RegionSetupModal } from '@/components/RegionSetupModal'

export default function HomePage() {
  const { user, signOut } = useAuth();
  const [showRegionModal, setShowRegionModal] = useState(false);

  // Show region modal for new users without a region
  useEffect(() => {
    if (user && !user.region) {
      // Small delay to let the page load first
      const timer = setTimeout(() => setShowRegionModal(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleRegionSet = (region: string) => {
    // Update the user context or refresh user data
    // For now, just close the modal
    setShowRegionModal(false);
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img 
                src="/guess-logo.png" 
                alt="You Paid What Logo" 
                className="h-16 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              {!user ? (
                <>
                  <Link href="/auth/signin" className="btn-secondary">Sign In</Link>
                  <Link href="/auth/signup" className="btn-primary">Get Started</Link>
                </>
              ) : (
                <>
                  <Link href="/browse" className="btn-secondary">
                    Browse
                  </Link>
                  <Link href="/upload" className="btn-primary">
                    Upload
                  </Link>
                  <div className="flex items-center space-x-3">
                    <Link href="/profile" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        {user.user_metadata?.avatar_url ? (
                          <img 
                            src={user.user_metadata.avatar_url} 
                            alt="Profile" 
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : user.displayName ? (
                          <span className="text-sm font-medium text-primary-600">
                            {user.displayName.charAt(0).toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-primary-600">
                            {user.email?.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium hidden sm:block">Profile</span>
                    </Link>
                    <button onClick={signOut} className="btn-secondary">
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <img 
            src="/guess-logo.png" 
            alt="You Paid What Logo" 
            className="h-48 w-auto mx-auto mb-8"
          />
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Know What You Should Pay
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Crowdsourced pricing transparency for real-world projects. 
            Upload one contract to unlock unlimited access to pricing data from home renovations to legal services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {!user ? (
              <Link href="/auth/signup" className="btn-primary text-lg px-8 py-3">
                Start Sharing Prices
              </Link>
            ) : (
              <Link href="/upload" className="btn-primary text-lg px-8 py-3">
                Upload Your First Contract
              </Link>
            )}
            <Link href="/browse" className="btn-secondary text-lg px-8 py-3">
              See Sample Data
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload & Redact</h3>
              <p className="text-gray-600">
                Upload your contract, quote, or invoice. Use our simple tools to blur out personal information.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Approved</h3>
              <p className="text-gray-600">
                Our team reviews your submission to ensure quality and privacy. Usually takes 24-48 hours.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Unlock Everything</h3>
              <p className="text-gray-600">
                Once approved, you get unlimited access to browse all pricing data and see detailed statistics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-16">
            Popular Categories
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Home & Garden', icon: '🏠', count: '500+' },
              { name: 'Auto & Transport', icon: '🚗', count: '300+' },
              { name: 'Legal Services', icon: '⚖️', count: '200+' },
              { name: 'Professional Services', icon: '💼', count: '400+' }
            ].map((category) => (
              <div key={category.name} className="card text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{category.name}</h3>
                <p className="text-gray-600">{category.count} contracts</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Share What You Paid?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of people making informed decisions about their next project. 
            Your one upload unlocks the collective wisdom of the crowd.
          </p>
          {!user ? (
            <Link href="/auth/signup" className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg text-lg transition-colors">
              Get Started Free
            </Link>
          ) : (
            <Link href="/upload" className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg text-lg transition-colors">
              Upload Now
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img 
                  src="/guess-logo.png" 
                  alt="You Paid What Logo" 
                  className="h-8 w-auto mr-3"
                />
                <h3 className="text-xl font-bold">You Paid What</h3>
              </div>
              <p className="text-gray-400">
                Crowdsourced pricing transparency for real-world projects.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/browse" className="hover:text-white">Browse</Link></li>
                <li><Link href="/upload" className="hover:text-white">Upload</Link></li>
                <li><Link href="/categories" className="hover:text-white">Categories</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 You Paid What. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Region Setup Modal */}
      <RegionSetupModal
        isOpen={showRegionModal}
        onClose={() => setShowRegionModal(false)}
        onRegionSet={handleRegionSet}
      />
    </div>
  )
}
