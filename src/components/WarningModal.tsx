import React from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface WarningModalProps {
  isOpen: boolean;
  violationCount: number;
  maxViolations?: number;
  onClose: () => void;
}

export const WarningModal: React.FC<WarningModalProps> = ({
  isOpen,
  violationCount,
  maxViolations = 3,
  onClose,
}) => {
  if (!isOpen) return null;

  const isFinalWarning = violationCount >= maxViolations;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-6 shadow-2xl text-center space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Warning Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 ring-8 ring-amber-500/10 animate-bounce">
          <AlertTriangle className="h-8 w-8" />
        </div>

        {/* Warning Header */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white">
            Proctoring Warning [{violationCount}/{maxViolations}]
          </h3>
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Unpermitted Clipboard / Navigation Action Detected
          </p>
        </div>

        {/* Message */}
        <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
          {isFinalWarning
            ? 'Warning 3/3 reached! Copy-paste, cut, or window switching is strictly forbidden. Your assessment is now being automatically submitted and locked.'
            : `Copy-paste, cut, and tab switching are prohibited during this assessment. You have received warning ${violationCount} of ${maxViolations}. Reaching 3 warnings will result in immediate automatic submission.`}
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 transition-all shadow-lg shadow-amber-500/20"
        >
          {isFinalWarning ? 'Proceeding to Final Submission...' : 'I Understand & Resume Assessment'}
        </button>
      </div>
    </div>
  );
};
