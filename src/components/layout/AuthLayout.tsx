import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { LanguageSwitcher } from '../common/LanguageSwitcher';

interface AuthLayoutProps {
  children?: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--agri-fill)] flex">
      {/* Left Hero Column */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-12 lg:p-16 flex-col justify-between relative overflow-hidden text-white selection:bg-emerald-500 selection:text-white">
        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -left-20 w-80 h-80 bg-teal-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-20 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3.5 mb-14">
            <div className="w-12 h-12 bg-white/15 border border-white/25 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-lg shadow-emerald-950/30">
              <svg className="w-7 h-7 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 3C8 3 8 9 8 9c-2 2-4 5-4 8a8 8 0 1016 0c0-3-2-6-4-8 0 0 0-6-4-6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 3v18" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M8 9h8" />
              </svg>
            </div>
            <div>
              <span className="text-2xl font-black font-display tracking-tight text-white block">AgriTrack</span>
              <span className="text-[0.6875rem] font-bold tracking-widest text-emerald-300 uppercase">Rwanda Smart Agriculture</span>
            </div>
          </div>

          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-semibold mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Empowering Rwandan Agriculture with AI
            </div>
            <h1 className="text-4xl lg:text-5xl font-black font-display leading-[1.15] mb-6 tracking-tight text-white drop-shadow-sm">
              Smarter farming. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200">
                Higher yields.
              </span>
            </h1>
            <p className="text-emerald-100/90 text-base lg:text-lg mb-10 leading-relaxed font-normal">
              Unified digital infrastructure for Rwandan farmers, cooperative managers, and agronomists to monitor fields, order certified inputs, and optimize harvest revenues.
            </p>

            <div className="space-y-4">
              <FeatureCard 
                icon={
                  <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
                title="Precision Crop Monitoring"
                description="Live timeline of growth stages, pest alerts, and weather-driven recommendations."
              />
              <FeatureCard 
                icon={
                  <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                }
                title="Certified Input Ordering"
                description="Order subsidized seeds and fertilizers directly from authorized cooperatives with MoMo payment."
              />
              <FeatureCard 
                icon={
                  <svg className="w-5 h-5 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                }
                title="AI Agronomist Assistant"
                description="Instant multi-lingual advisory for rice and crop diseases trained on Rwandan agronomic standards."
              />
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-emerald-700/60 flex items-center justify-between text-xs text-emerald-200/80">
          <span>&copy; {new Date().getFullYear()} AgriTrack Rwanda</span>
          <span>Security & Compliance Guaranteed</span>
        </div>
      </div>

      {/* Right Content Form Column */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute right-6 top-6 z-10 sm:right-12">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-700/20">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3C8 3 8 9 8 9c-2 2-4 5-4 8a8 8 0 1016 0c0-3-2-6-4-8 0 0 0-6-4-6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18" />
              </svg>
            </div>
            <h1 className="text-2xl font-black font-display text-[var(--agri-text)]">AgriTrack</h1>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mt-0.5">Smart Agriculture Rwanda</p>
          </div>
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 p-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md transition-all duration-200">
      <div className="w-10 h-10 bg-emerald-700/70 border border-emerald-400/30 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-sm text-white">{title}</h3>
        <p className="text-emerald-100/80 text-xs mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}