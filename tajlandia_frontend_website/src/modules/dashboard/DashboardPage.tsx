'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { routes } from '@/lib/constants/routes';
import { clearAuth } from '@/lib/api/auth.utils';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-navy/10 mb-4">
          <div className="w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
        </div>
        <p className="text-sm text-muted">Loading dashboard...</p>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  // Redirect to login if not authenticated
  if (!isLoading && !isAuthenticated) {
    router.push(routes.login);
    return null;
  }

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const handleLogout = () => {
    clearAuth();
    router.push(routes.login);
  };

  const userName = user?.name || 'User';
  const userEmail = user?.email || '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">T</span>
              </div>
              <span className="text-lg font-semibold text-navy">tajlandia</span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <a href={routes.explore} className="text-sm font-medium text-navy hover:text-navy-deep">
                Home
              </a>
              <a href={routes.explore} className="text-sm font-medium text-muted hover:text-foreground">
                Explore Map
              </a>
              <a href={routes.explore} className="text-sm font-medium text-muted hover:text-foreground">
                My Land
              </a>
            </nav>

            <div className="flex items-center gap-4">
              <button className="p-2 text-muted hover:text-foreground transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="p-2 text-muted hover:text-foreground transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button onClick={handleLogout} className="p-2 text-muted hover:text-foreground transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2zm0 0V5a2 2 0 012-2h2a2 2 0 012 2v12a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg border-2 border-blue-400 p-8 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 tracking-wide mb-2">YOUR TAJLANDIA HOME</p>
              <h1 className="text-3xl font-bold text-navy mb-6">
                Welcome back, <span className="text-red-500">{userName.split(' ')[0]}</span> <span className="text-red-500 text-2xl">◆</span>
              </h1>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-xs text-muted mb-1">OWNERSHIP DETAILS</p>
                  <p className="text-2xl font-bold text-navy">8000</p>
                  <p className="text-xs text-muted">sqft in total</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-xs text-muted mb-1">YOUR COLLECTION</p>
                  <p className="text-2xl font-bold text-green-600">12</p>
                  <p className="text-xs text-muted">Pinned Locations</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-xs text-muted mb-1">LAND REGIONS</p>
                  <p className="text-2xl font-bold text-purple-600">05</p>
                  <p className="text-xs text-muted">Regions</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-muted mb-1">TOTAL SPENT</p>
                  <p className="text-2xl font-bold text-yellow-600">$48,500</p>
                  <p className="text-xs text-muted">Total Spent</p>
                </div>
              </div>
            </div>

            <a href={routes.explore} className="px-6 py-2 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-deep transition whitespace-nowrap">
              Explore Thailand →
            </a>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* CTA Card */}
          <div className="bg-white rounded-lg border-2 border-red-400 p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">📍</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-600 tracking-wide">OWN A LITTLE PIECE</p>
                <h2 className="text-2xl font-bold text-navy">Give a Little Piece of Thailand</h2>
              </div>
            </div>
            <p className="text-sm text-muted mb-6">Invest in authentic Thai real estate opportunities. Be part of something extraordinary while owning a piece of paradise.</p>
            <button className="px-6 py-2 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 transition">
              Gift a Plot →
            </button>
            <div className="mt-6 flex gap-4 text-xs text-muted">
              <span>√ Instant Digital Certificate</span>
              <span>√ Official Deed & Proof</span>
            </div>
          </div>

          {/* Feature Card */}
          <div className="bg-gradient-to-br from-green-800 to-green-900 rounded-lg p-8 text-white overflow-hidden relative">
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 400 300" fill="none">
                <circle cx="100" cy="100" r="80" fill="currentColor" />
                <circle cx="350" cy="200" r="100" fill="currentColor" />
              </svg>
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-2">Thailand Awaits</h2>
              <p className="text-green-100 mb-6">Discover breathtaking landscapes and exclusive real estate opportunities.</p>
              <a href={routes.explore} className="inline-block px-6 py-2 bg-white text-green-900 rounded-lg text-sm font-medium hover:bg-green-50 transition">
                Explore Thailand →
              </a>
            </div>
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-navy">Recent Purchase</h2>
            <a href="#" className="text-sm text-navy hover:underline">
              View All →
            </a>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Purchase Card 1 */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="flex gap-4 p-4">
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-yellow-600 font-semibold mb-1">Yellow Ridge Plot</p>
                  <h3 className="text-sm font-semibold text-navy mb-2">Yellow Ridge Plot</h3>
                  <div className="flex items-center gap-2 text-xs text-muted mb-2">
                    <span>📍 15 Sqft</span>
                    <span>📅 10-01-2026</span>
                  </div>
                  <a href="#" className="text-xs text-navy font-medium hover:underline">
                    View Item →
                  </a>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold text-navy">$2.50</p>
                </div>
              </div>
            </div>

            {/* Purchase Card 2 */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="flex gap-4 p-4">
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-purple-600 font-semibold mb-1">Heritage Ridge Plot</p>
                  <h3 className="text-sm font-semibold text-navy mb-2">Heritage Ridge Plot</h3>
                  <div className="flex items-center gap-2 text-xs text-muted mb-2">
                    <span>📍 15 Sqft</span>
                    <span>📅 10-01-2026</span>
                  </div>
                  <a href="#" className="text-xs text-navy font-medium hover:underline">
                    View Item →
                  </a>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xl font-bold text-navy">$2.50</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
