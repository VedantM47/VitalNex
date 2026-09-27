import React from "react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";

export function Footer() {
  return (
    <footer className="bg-white border-t border-[#D8E2EA] pt-10 pb-8 px-4 sm:px-8 mt-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3 md:col-span-1">
            <BrandLogo size="md" />
            <p className="text-xs text-[#64748B] leading-relaxed">
              Advancing responsible healthcare intelligence, clinical decision support, and connected care.
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-[#0B1F33] uppercase tracking-wider">Clinical AI Suite</h4>
            <ul className="space-y-1.5 text-xs text-[#475569]">
              <li><Link href="/risk-assessment" className="hover:text-[#0E7490]">Cardiometabolic Risk</Link></li>
              <li><Link href="/ai-trust" className="hover:text-[#0E7490]">AI Trust Passport</Link></li>
              <li><Link href="/health-profile" className="hover:text-[#0E7490]">Personal Health Vitals</Link></li>
              <li><Link href="/care-connect" className="hover:text-[#0E7490]">Pune Regional Care Connect</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-[#0B1F33] uppercase tracking-wider">Research & Governance</h4>
            <ul className="space-y-1.5 text-xs text-[#475569]">
              <li><Link href="/admin/model-lab" className="hover:text-[#0E7490]">Model Laboratory</Link></li>
              <li><Link href="/admin/datasets" className="hover:text-[#0E7490]">Pune Research Dataset (20k)</Link></li>
              <li><Link href="/admin/governance" className="hover:text-[#0E7490]">Fairness & Audit Trail</Link></li>
              <li><Link href="/accessibility" className="hover:text-[#0E7490]">Accessibility Statement (WCAG 2.2)</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-[#0B1F33] uppercase tracking-wider">Legal & Compliance</h4>
            <ul className="space-y-1.5 text-xs text-[#475569]">
              <li><Link href="/privacy" className="hover:text-[#0E7490]">Privacy Policy & RLS</Link></li>
              <li><Link href="/terms" className="hover:text-[#0E7490]">Terms of Research Prototype</Link></li>
              <li><Link href="/how-it-works" className="hover:text-[#0E7490]">How It Works</Link></li>
              <li><Link href="/about" className="hover:text-[#0E7490]">About the Project</Link></li>
            </ul>
          </div>
        </div>

        {/* Global Mandatory Healthcare Safety Disclaimer */}
        <div className="pt-6 border-t border-[#F1F5F9] text-center space-y-2">
          <p className="text-xs text-[#475569] max-w-4xl mx-auto leading-relaxed">
            <strong className="text-[#0B1F33]">Clinical Disclaimer:</strong> VITALNEX is an academic research and decision-support prototype. It does not diagnose disease, prescribe medications, or replace direct consultation with a qualified medical doctor. In case of acute or emergency symptoms, immediately call your local emergency service (108 / 112 in India).
          </p>
          <p className="text-[11px] text-[#94A3B8]">
            © {new Date().getFullYear()} VITALNEX. Health. Humanity. High-Tech. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
