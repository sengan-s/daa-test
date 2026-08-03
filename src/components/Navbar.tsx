import React from 'react';
import { Terminal, Clock, ShieldAlert, Moon, Sun, Code2, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  timeRemainingSeconds: number;
  rollNo?: string;
  name?: string;
  violations?: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAdminLogin?: () => void;
  isAssessmentActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  timeRemainingSeconds,
  rollNo,
  name,
  violations = 0,
  isDarkMode,
  onToggleDarkMode,
  onOpenAdminLogin,
  isAssessmentActive = false,
}) => {
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(Math.max(0, totalSecs) / 60);
    const secs = Math.max(0, totalSecs) % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeRemainingSeconds > 0 && timeRemainingSeconds < 300; // < 5 minutes
  const progressPercent = Math.min(100, Math.max(0, (timeRemainingSeconds / 3600) * 100));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 lg:px-8 py-3 transition-colors duration-200">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Left: Branding Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-lg shadow-indigo-500/25 ring-1 ring-white/20">
            <Code2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-space font-bold tracking-tight text-white text-lg lg:text-xl">
                DAA Assessment
              </span>
              <span className="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-indigo-500/30">
                Java Judge
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Design & Analysis of Algorithms Examination
            </p>
          </div>
        </div>

        {/* Center: Live Timer if Assessment is Active */}
        {isAssessmentActive && (
          <div className="flex items-center space-x-3 bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-700/80 shadow-inner">
            <div className="relative flex h-8 w-8 items-center justify-center">
              {/* Circular Progress Ring */}
              <svg className="h-8 w-8 -rotate-90 transform">
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  className="stroke-slate-700"
                  strokeWidth="3"
                  fill="transparent"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="13"
                  className={`transition-all duration-300 ${
                    isLowTime ? 'stroke-red-500 animate-pulse' : 'stroke-indigo-500'
                  }`}
                  strokeWidth="3"
                  strokeDasharray={81.68}
                  strokeDashoffset={81.68 - (81.68 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <Clock className={`absolute h-4 w-4 ${isLowTime ? 'text-red-400 animate-bounce' : 'text-indigo-400'}`} />
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Time Remaining
              </span>
              <span
                className={`font-mono font-bold text-base tracking-wider ${
                  isLowTime ? 'text-red-400 animate-pulse' : 'text-slate-100'
                }`}
              >
                {formatTime(timeRemainingSeconds)}
              </span>
            </div>
          </div>
        )}

        {/* Right: Candidate Info, Violations & Controls */}
        <div className="flex items-center space-x-3">
          {rollNo && (
            <div className="hidden md:flex items-center space-x-3 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700">
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-200">{name}</div>
                <div className="text-[11px] font-mono text-indigo-400">{rollNo}</div>
              </div>

              {/* Violation Indicator */}
              <div
                className={`flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold ${
                  violations > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}
                title="Anti-Cheating Warnings (Max 3)"
              >
                {violations > 0 ? (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                ) : (
                  <ShieldAlert className="h-3.5 w-3.5 text-emerald-400" />
                )}
                <span>Warnings: {violations}/3</span>
              </div>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
          </button>

          {/* Admin Portal Button */}
          {onOpenAdminLogin && (
            <button
              onClick={onOpenAdminLogin}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              <Terminal className="h-3.5 w-3.5 text-indigo-400" />
              <span>Admin Portal</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
