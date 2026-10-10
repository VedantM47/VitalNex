"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Footer } from "./Footer";
import { X } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#F7FAFC] overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop and Sidebar */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex md:hidden"
        >
          <div
            className="fixed inset-0 bg-[#0B1F33]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-10 shadow-2xl">
            <div className="absolute top-3 right-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="p-2 text-[#475569] hover:bg-[#F1F5F9] rounded-xl"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <Sidebar onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 focus:outline-none flex flex-col justify-between">
          <div className="max-w-7xl mx-auto space-y-8 w-full">
            {children}
          </div>
          <footer className="mt-12 pt-6 pb-2 border-t border-[#E2E8F0] text-center text-xs text-[#64748B] w-full">
            <p className="max-w-3xl mx-auto leading-relaxed">
              <span className="font-semibold text-[#0B1F33]">VITALNEX Clinical Intelligence</span> • Research & Decision-Support Prototype • Non-diagnostic • Emergency: 108 / 112 (India)
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
