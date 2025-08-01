'use client';

import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import BottomNavigation from '@/components/BottomNavigation';

const MissionsComponent = dynamic(
  () => import('./MissionsComponent'),
  { 
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </main>
        <BottomNavigation />
      </div>
    )
  }
);

export default function MissionsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 overflow-x-hidden">
      <Header />
      <main className="max-w-6xl mx-auto flex-grow px-3 sm:px-4 py-4 sm:py-6 w-full">
        <MissionsComponent />
      </main>
      <BottomNavigation />
    </div>
  );
}