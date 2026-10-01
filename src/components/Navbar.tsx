import React from 'react';
import { ShieldCheck, GitBranch, Terminal, Sparkles, Settings as SettingsIcon } from 'lucide-react';
import { SystemStatus } from '../../shared/types';

interface NavbarProps {
  status: SystemStatus | null;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Navbar: React.FC<NavbarProps> = ({ status, onNavigate, currentPage }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 rounded"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-zinc-100 text-sm">AI CODEBASE DOCTOR</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 uppercase">
                  v1.2.0
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">
                Diagnose · Repair · Validate · Review
              </p>
            </div>
          </button>
        </div>

        {/* System & Integration Indicators */}
        <div className="flex items-center gap-3">
          {/* GitHub Integration Status */}
          <div className="hidden md:flex items-center gap-2 text-xs text-zinc-400">
            <GitBranch className="w-3.5 h-3.5 text-zinc-400" />
            <span>GitHub:</span>
            {status?.github_configured ? (
              <span className="text-emerald-400 font-medium">LIVE CONNECTED</span>
            ) : (
              <span className="text-amber-400 font-medium">DEMO READY</span>
            )}
          </div>

          <span aria-hidden="true" className="hidden md:inline text-zinc-800">|</span>

          {/* AI Model Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Agent Brain:</span>
            <span className="font-mono text-zinc-200">
              {status?.model || 'gemini-3.1-pro-preview'}
            </span>
          </div>

          <span aria-hidden="true" className="hidden lg:inline text-zinc-800">|</span>

          {/* Sandbox Status */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sandbox:</span>
            <span className="text-emerald-400 font-medium">ISOLATED</span>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => onNavigate('settings')}
            className={`p-2 rounded-md transition-colors border ${
              currentPage === 'settings'
                ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
            title="System Settings & Integrations"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
