import React, { useState, useEffect } from 'react';
import { Play, Code, ShieldAlert, Clock, CheckCircle2, Award, Sparkles, Terminal } from 'lucide-react';

interface StartPageProps {
  onStartAssessment: (rollNo: string, name: string) => void;
  savedRollNo?: string;
  savedName?: string;
}

export const StartPage: React.FC<StartPageProps> = ({
  onStartAssessment,
  savedRollNo = '',
  savedName = '',
}) => {
  const [rollNo, setRollNo] = useState(savedRollNo);
  const [name, setName] = useState(savedName);
  const [typedTitle, setTypedTitle] = useState('');
  const fullTitle = 'Design & Analysis of Algorithms Assessment';

  // Typewriter effect for heading
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index <= fullTitle.length) {
        setTypedTitle(fullTitle.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 45);

    return () => clearInterval(interval);
  }, []);

  // Validation: YYYY-DEPT-NNN (e.g., 2024-CSBS-108)
  const rollNoPattern = /^\d{4}-[A-Za-z0-9]+-\d+$/;
  const isRollNoValid = rollNoPattern.test(rollNo.trim());
  const isNameValid = name.trim().length >= 2;
  const isFormValid = isRollNoValid && isNameValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid) {
      onStartAssessment(rollNo.trim(), name.trim());
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-65px)] flex items-center justify-center p-4 lg:p-8 overflow-hidden">
      {/* Animated Gradient Particle Background */}
      <div className="absolute inset-0 bg-slate-950 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-pink-500/10 rounded-full blur-2xl animate-pulse delay-500" />

        {/* Floating Code Symbols Particles */}
        <div className="absolute inset-0 opacity-10 font-mono text-sm text-indigo-300 select-none overflow-hidden">
          <div className="absolute top-[10%] left-[15%] animate-bounce duration-1000">public static void merge()</div>
          <div className="absolute top-[25%] right-[20%] animate-pulse">binarySearch(arr, target)</div>
          <div className="absolute bottom-[30%] left-[10%] animate-bounce duration-700">int[][] C = new int[m][p]</div>
          <div className="absolute bottom-[15%] right-[15%] animate-pulse">O(log n) | O(m * n * p)</div>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Info Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-3 py-1 text-xs font-semibold text-indigo-300">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Official Examination Portal</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight min-h-[72px]">
              {typedTitle}
              <span className="inline-block w-1.5 h-7 bg-indigo-400 ml-1 animate-pulse align-middle" />
            </h1>
            <p className="text-slate-300 text-sm lg:text-base leading-relaxed">
              Welcome to the automated Java algorithm judging system. Complete 3 core algorithmic problems under a timed session. Your code will be automatically compiled and evaluated against visible and hidden test suites.
            </p>
          </div>

          {/* Key Guidelines */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start space-x-3">
              <Clock className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">1 Hour Duration</div>
                <div className="text-[11px] text-slate-400">Timer starts immediately</div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start space-x-3">
              <Award className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">50 Total Marks</div>
                <div className="text-[11px] text-slate-400">Partial test credit awarded</div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start space-x-3">
              <Code className="h-5 w-5 text-pink-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">3 Problems</div>
                <div className="text-[11px] text-slate-400">Merge, Binary Search, Matrix</div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start space-x-3">
              <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold text-white">Strict Proctoring</div>
                <div className="text-[11px] text-slate-400">Max 3 warnings allowed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Candidate Registration Card */}
        <div className="lg:col-span-5">
          <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-6 lg:p-7 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

            <div className="mb-6 space-y-1">
              <div className="flex items-center space-x-2">
                <Terminal className="h-5 w-5 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">Candidate Registration</h2>
              </div>
              <p className="text-xs text-slate-400">Enter your credentials to begin session</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Roll No Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Roll Number <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value.toUpperCase())}
                    placeholder="e.g. 2024-CSBS-108"
                    className={`w-full bg-slate-950/80 border rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      rollNo && !isRollNoValid
                        ? 'border-red-500/80 focus:ring-red-500/50'
                        : isRollNoValid
                        ? 'border-emerald-500/80 focus:ring-emerald-500/50'
                        : 'border-slate-700 focus:ring-indigo-500'
                    }`}
                  />
                  {isRollNoValid && (
                    <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-emerald-400" />
                  )}
                </div>
                <p className={`text-[11px] ${rollNo && !isRollNoValid ? 'text-red-400 font-medium' : 'text-slate-500'}`}>
                  Format: YYYY-DEPT-NNN (e.g. 2024-CSBS-108)
                </p>
              </div>

              {/* Student Name Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Student Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Asmita"
                    className={`w-full bg-slate-950/80 border rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      name && !isNameValid
                        ? 'border-red-500/80 focus:ring-red-500/50'
                        : isNameValid
                        ? 'border-emerald-500/80 focus:ring-emerald-500/50'
                        : 'border-slate-700 focus:ring-indigo-500'
                    }`}
                  />
                  {isNameValid && (
                    <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-emerald-400" />
                  )}
                </div>
              </div>

              {/* Anti-Cheating Policy Notice */}
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 flex items-start space-x-2.5">
                <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-200/90 leading-relaxed">
                  Copy-pasting and window switching are restricted. Attaining 3 warnings will auto-submit your assessment immediately.
                </p>
              </div>

              {/* Start Button */}
              <button
                type="submit"
                disabled={!isFormValid}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg ${
                  isFormValid
                    ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:opacity-95 shadow-indigo-500/25 cursor-pointer active:scale-[0.99]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                }`}
              >
                <span>Start Assessment</span>
                <Play className="h-4 w-4 fill-current" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
