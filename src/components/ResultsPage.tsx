import React, { useEffect, useState } from 'react';
import { fireConfetti } from '../utils/confetti';
import {
  CheckCircle2,
  Award,
  Clock,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  Code
} from 'lucide-react';
import { SubmissionRecord } from '../types';

interface ResultsPageProps {
  submission: SubmissionRecord;
  onExit: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({ submission, onExit }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Score count-up animation and Confetti
  useEffect(() => {
    fireConfetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
    });

    let current = 0;
    const target = submission.totalScore;
    const increment = Math.max(1, Math.ceil(target / 30));
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedScore(target);
        clearInterval(timer);
      } else {
        setAnimatedScore(current);
      }
    }, 40);

    return () => clearInterval(timer);
  }, [submission]);

  // Determine achievement badges
  const isSpeedSolver = submission.timeTaken && submission.timeTaken < '45:00';
  const isPerfectionist = submission.totalScore === 50;
  const isCleanRecord = submission.violations === 0;

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center p-4 lg:p-8 bg-slate-950 text-slate-100">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-10 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Decorative Top Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500" />

        {/* Header Badge */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 ring-8 ring-emerald-500/10 shadow-lg">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Assessment Submitted Successfully
            </h1>
            <p className="text-sm text-slate-400">
              Your Java code has been evaluated and permanently recorded in the DAA portal.
            </p>
          </div>
        </div>

        {/* Big Score Reveal Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center relative overflow-hidden shadow-inner">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
            Final Examination Score
          </div>
          <div className="flex items-baseline justify-center space-x-2">
            <span className="font-mono text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400">
              {animatedScore}
            </span>
            <span className="text-slate-500 text-xl font-bold font-mono">/ 50</span>
          </div>
          <p className="text-xs text-indigo-400 mt-2 font-semibold">
            Candidate: {submission.name} ({submission.rollNo})
          </p>
        </div>

        {/* Per-Problem Marks Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            <BarChart3 className="h-4 w-4 text-indigo-400" />
            <span>Problem Marks Breakdown</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Merge Sorted Array */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-medium">1. Merge Sorted Array</div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xl font-bold text-white">
                  {submission.mergeSortMarks} <span className="text-slate-500 text-xs">/ 15</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    submission.mergeSortMarks === 15
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : submission.mergeSortMarks > 0
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {submission.mergeSortMarks === 15 ? 'Full Marks' : `${submission.mergeSortMarks} pts`}
                </span>
              </div>
            </div>

            {/* Binary Search */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-medium">2. Binary Search</div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xl font-bold text-white">
                  {submission.binarySearchMarks} <span className="text-slate-500 text-xs">/ 15</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    submission.binarySearchMarks === 15
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : submission.binarySearchMarks > 0
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {submission.binarySearchMarks === 15 ? 'Full Marks' : `${submission.binarySearchMarks} pts`}
                </span>
              </div>
            </div>

            {/* Matrix Multiplication */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-medium">3. Matrix Multiplication</div>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xl font-bold text-white">
                  {submission.matrixMultMarks} <span className="text-slate-500 text-xs">/ 20</span>
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    submission.matrixMultMarks === 20
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : submission.matrixMultMarks > 0
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {submission.matrixMultMarks === 20 ? 'Full Marks' : `${submission.matrixMultMarks} pts`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Achievement Badges */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Performance Achievements
          </div>
          <div className="flex flex-wrap gap-2">
            {isPerfectionist && (
              <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold">
                <Target className="h-4 w-4 text-amber-400" />
                <span>🎯 Perfectionist (50/50 Score)</span>
              </div>
            )}

            {isSpeedSolver && (
              <div className="flex items-center space-x-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-xl text-xs font-bold">
                <Zap className="h-4 w-4 text-indigo-400" />
                <span>⚡ Speed Solver</span>
              </div>
            )}

            {isCleanRecord && (
              <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>🛡️ Clean Record (0 Warnings)</span>
              </div>
            )}

            {!isPerfectionist && !isCleanRecord && (
              <div className="flex items-center space-x-1.5 bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-xl text-xs font-medium">
                <Sparkles className="h-4 w-4 text-slate-400" />
                <span>Assessment Completed</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary Info Row */}
        <div className="grid grid-cols-2 gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-indigo-400 shrink-0" />
            <div>
              <div className="text-slate-400 font-medium">Time Remaining at Submit</div>
              <div className="font-mono font-bold text-white text-sm">{submission.timeTaken}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-slate-400 font-medium">Proctoring Warnings</div>
              <div className="font-mono font-bold text-white text-sm">
                {submission.violations} / 3
              </div>
            </div>
          </div>
        </div>

        {/* Exit Button - Real onClick Handler */}
        <div className="pt-2">
          <button
            onClick={onExit}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white flex items-center justify-center space-x-2 shadow-lg shadow-red-500/20 transition-all cursor-pointer active:scale-[0.99]"
          >
            <LogOut className="h-4 w-4" />
            <span>Exit Portal & Return to Start</span>
          </button>
        </div>
      </div>
    </div>
  );
};
