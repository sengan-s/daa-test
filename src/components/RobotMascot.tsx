import React from 'react';
import { Bot, CheckCircle2, XCircle, Sparkles, AlertCircle } from 'lucide-react';

interface RobotMascotProps {
  status: 'idle' | 'running' | 'pass' | 'fail';
  passedCount?: number;
  totalCount?: number;
}

export const RobotMascot: React.FC<RobotMascotProps> = ({
  status,
  passedCount = 0,
  totalCount = 0,
}) => {
  return (
    <div className="flex items-center space-x-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-md">
      {/* Robot Avatar */}
      <div className="relative">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
            status === 'pass'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 ring-4 ring-emerald-500/10 animate-bounce'
              : status === 'fail'
              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
              : status === 'running'
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 animate-spin'
              : 'bg-slate-800 text-indigo-400 border border-slate-700'
          }`}
        >
          <Bot className="h-6 w-6" />
        </div>

        {/* Reaction badge */}
        {status === 'pass' && (
          <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-amber-400 animate-spin" />
        )}
      </div>

      {/* Robot Dialogue */}
      <div className="text-xs">
        {status === 'idle' && (
          <div>
            <div className="font-semibold text-slate-200">AlgoBot Judge Ready</div>
            <div className="text-[11px] text-slate-400">Write your solution & click Run!</div>
          </div>
        )}

        {status === 'running' && (
          <div>
            <div className="font-semibold text-indigo-300 animate-pulse">Compiling & Executing...</div>
            <div className="text-[11px] text-slate-400">Evaluating against test cases</div>
          </div>
        )}

        {status === 'pass' && (
          <div>
            <div className="font-semibold text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>All Test Cases Passed! 🎉</span>
            </div>
            <div className="text-[11px] text-emerald-300/80">
              {passedCount}/{totalCount} passed. Great work!
            </div>
          </div>
        )}

        {status === 'fail' && (
          <div>
            <div className="font-semibold text-red-400 flex items-center space-x-1">
              <XCircle className="h-3.5 w-3.5" />
              <span>Test Suite Failed</span>
            </div>
            <div className="text-[11px] text-slate-400">
              {passedCount}/{totalCount} passed. Check stdout details below.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
