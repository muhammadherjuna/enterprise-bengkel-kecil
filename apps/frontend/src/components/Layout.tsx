import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from './OfflineBanner';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50/70 overflow-x-hidden antialiased">
      <OfflineBanner />
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-12">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};
