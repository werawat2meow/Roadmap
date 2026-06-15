'use client';

import React, { useState } from 'react';
import Navbar from './components/Navbar';
import { Menu } from 'lucide-react';

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleDesktopSidebar = () => setIsDesktopCollapsed(!isDesktopCollapsed);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className="relative min-h-screen bg-[#F9F5F2]">
      {/* --- Desktop Sidebar (Fixed Position) --- */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-20">
        <Navbar
          isCollapsed={isDesktopCollapsed}
          toggleSidebar={toggleDesktopSidebar} // ส่งแค่ props ที่จำเป็นสำหรับ Desktop
        />
      </div>

      {/* --- Mobile Menu Overlay --- */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
            onClick={toggleMobileMenu}
          ></div>
          <div className="fixed inset-y-0 left-0 z-40 md:hidden">
            <Navbar
              isCollapsed={false}
              onLinkClick={toggleMobileMenu} // ส่งแค่ onLinkClick
            />
          </div>
        </>
      )}

      {/* --- Main Content Area with Dynamic Padding --- */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isDesktopCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        {/* Mobile Header */}
        <header className="flex md:hidden items-center justify-between p-4 bg-white shadow-sm sticky top-0 z-10">
          <button onClick={toggleMobileMenu} className="text-gray-700">
            <Menu className="h-6 w-6" />
          </button>
          <div className="text-lg font-bold">Roadmap</div>
          <div className="w-6"></div> {/* Spacer */}
        </header>

        {/* Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}