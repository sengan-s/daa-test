import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  XCircle,
  Play,
  Send,
  ChevronRight,
  ChevronLeft,
  Lock,
  Code2,
  FileText,
  Terminal,
  Sparkles,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { Problem, CandidateSession, ProblemExecutionResult, Language } from '../types';
import { PROBLEMS } from '../data/problems';
import { api } from '../services/api';
import { soundService } from '../services/audio';
import { RobotMascot } from './RobotMascot';
import { WarningModal } from './WarningModal';

interface AssessmentPageProps {
  session: CandidateSession;
  onUpdateSession: (updated: CandidateSession) => void;
  onFinalSubmit: (session: CandidateSession) => Promise<void>;
}

export const AssessmentPage: React.FC<AssessmentPageProps> = ({
  session,
  onUpdateSession,
  onFinalSubmit,
}) => {
  const [activeProblemId, setActiveProblemId] = useState<Problem['id']>('merge-sorted-array');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [executionResult, setExecutionResult] = useState<ProblemExecutionResult | null>(
    session.lastEvaluatedResults?.[activeProblemId] || null
  );
  const [mascotStatus, setMascotStatus] = useState<'idle' | 'running' | 'pass' | 'fail'>('idle');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);

  const activeProblem = PROBLEMS.find((p) => p.id === activeProblemId) || PROBLEMS[0];
  const activeLanguage: Language = session.languagePerProblem?.[activeProblemId] || 'java';
  const currentCode = session.codePerProblem[activeProblemId] || activeProblem.starterCode[activeLanguage];

  // Language Change Handler
  const handleLanguageChange = (newLang: Language) => {
    const newStarterCode = activeProblem.starterCode[newLang];
    const updated: CandidateSession = {
      ...session,
      languagePerProblem: {
        ...(session.languagePerProblem || {
          'merge-sorted-array': 'java',
          'binary-search': 'java',
          'matrix-multiplication': 'java',
        }),
        [activeProblemId]: newLang,
      },
      codePerProblem: {
        ...session.codePerProblem,
        [activeProblemId]: newStarterCode,
      },
    };
    onUpdateSession(updated);
  };

  // Auto-save session periodically
  useEffect(() => {
    const timer = setInterval(() => {
      api.syncSession(session).catch(() => {});
    }, 15000);
    return () => clearInterval(timer);
  }, [session]);

  // Anti-Cheating Event Handlers (Clipboard & Tab Switch)
  useEffect(() => {
    const triggerViolation = (type: string) => {
      soundService.playWarning();
      const newCount = session.violations + 1;
      const updated: CandidateSession = {
        ...session,
        violations: newCount,
      };
      onUpdateSession(updated);
      setShowWarningModal(true);

      if (newCount >= 3) {
        // Auto-submit on 3rd warning
        setTimeout(() => {
          onFinalSubmit(updated);
        }, 1200);
      }
    };

    const handleCopyPasteCut = (e: ClipboardEvent) => {
      e.preventDefault();
      triggerViolation('clipboard');
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerViolation('contextmenu');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerViolation('tabswitch');
      }
    };

    document.addEventListener('copy', handleCopyPasteCut);
    document.addEventListener('paste', handleCopyPasteCut);
    document.addEventListener('cut', handleCopyPasteCut);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('copy', handleCopyPasteCut);
      document.removeEventListener('paste', handleCopyPasteCut);
      document.removeEventListener('cut', handleCopyPasteCut);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [session, onUpdateSession, onFinalSubmit]);

  // Handle Code Editor Change
  const handleCodeChange = (value: string | undefined) => {
    const newCode = value || '';
    const updated: CandidateSession = {
      ...session,
      codePerProblem: {
        ...session.codePerProblem,
        [activeProblemId]: newCode,
      },
    };
    onUpdateSession(updated);
  };

  // Switch Problem Tab (Preserves code & results)
  const handleSwitchProblem = (problemId: Problem['id']) => {
    setActiveProblemId(problemId);
    setExecutionResult(session.lastEvaluatedResults?.[problemId] || null);
    setMascotStatus('idle');
  };

  // Run visible test cases
  const handleRunCode = async () => {
    setIsEvaluating(true);
    setMascotStatus('running');

    try {
      const res = await api.runCode(activeProblemId, currentCode, activeLanguage, false);
      setExecutionResult(res);

      const allPassed = res.passedCount === res.totalCount && res.compiled;
      setMascotStatus(allPassed ? 'pass' : 'fail');

      if (allPassed) {
        soundService.playPass();
      } else {
        soundService.playFail();
      }

      // Update session state
      const updated: CandidateSession = {
        ...session,
        lastEvaluatedResults: {
          ...session.lastEvaluatedResults,
          [activeProblemId]: res,
        },
        problemStatuses: {
          ...session.problemStatuses,
          [activeProblemId]: allPassed ? 'solved' : 'attempted',
        },
      };
      onUpdateSession(updated);
    } catch (err: any) {
      soundService.playFail();
      setMascotStatus('fail');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Submit single problem (runs all visible + hidden test cases)
  const handleSubmitProblem = async () => {
    setIsEvaluating(true);
    setMascotStatus('running');

    try {
      const res = await api.runCode(activeProblemId, currentCode, activeLanguage, true);
      setExecutionResult(res);

      const allPassed = res.passedCount === res.totalCount && res.compiled;
      setMascotStatus(allPassed ? 'pass' : 'fail');

      if (allPassed) {
        soundService.playPass();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        soundService.playFail();
      }

      // Update session state
      const updated: CandidateSession = {
        ...session,
        lastEvaluatedResults: {
          ...session.lastEvaluatedResults,
          [activeProblemId]: res,
        },
        problemStatuses: {
          ...session.problemStatuses,
          [activeProblemId]: allPassed ? 'solved' : 'attempted',
        },
      };
      onUpdateSession(updated);
    } catch (err: any) {
      soundService.playFail();
      setMascotStatus('fail');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Count solved problems
  const solvedCount = Object.values(session.problemStatuses).filter((s) => s === 'solved').length;

  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white select-none">
      <WarningModal
        isOpen={showWarningModal}
        violationCount={session.violations}
        onClose={() => setShowWarningModal(false)}
      />

      {/* Top Banner / Progress Summary */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-slate-300">Assessment Progress:</span>
          <div className="flex items-center space-x-2">
            <div className="w-32 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
              <div
                className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full transition-all duration-500"
                style={{ width: `${(solvedCount / 3) * 100}%` }}
              />
            </div>
            <span className="font-mono font-bold text-emerald-400">{solvedCount}/3 Solved</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <RobotMascot
            status={mascotStatus}
            passedCount={executionResult?.passedCount}
            totalCount={executionResult?.totalCount}
          />

          <button
            onClick={() => {
              setIsSubmittingFinal(true);
              soundService.playSubmit();
              onFinalSubmit(session).finally(() => setIsSubmittingFinal(false));
            }}
            disabled={isSubmittingFinal}
            className="flex items-center space-x-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-2 px-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>{isSubmittingFinal ? 'Submitting...' : 'Finish Assessment'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Sidebar: Problem Navigation */}
        <div className="lg:col-span-3 bg-slate-900/90 border-r border-slate-800 p-4 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Problems</span>
            <span className="text-[10px] text-indigo-400">Total: 50 Marks</span>
          </div>

          <div className="space-y-2">
            {PROBLEMS.map((prob) => {
              const status = session.problemStatuses[prob.id];
              const isActive = prob.id === activeProblemId;

              return (
                <button
                  key={prob.id}
                  onClick={() => handleSwitchProblem(prob.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                    isActive
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-sm group-hover:text-white">
                      {prob.title}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Marks: <span className="text-indigo-300 font-mono">{prob.marks}</span>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {status === 'solved' && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Passed</span>
                      </span>
                    )}

                    {status === 'attempted' && (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span>Attempted</span>
                      </span>
                    )}

                    {status === 'unattempted' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700">
                        Not Started
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Problem Switcher Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                const idx = PROBLEMS.findIndex((p) => p.id === activeProblemId);
                if (idx > 0) handleSwitchProblem(PROBLEMS[idx - 1].id);
              }}
              disabled={PROBLEMS.findIndex((p) => p.id === activeProblemId) === 0}
              className="flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => {
                const idx = PROBLEMS.findIndex((p) => p.id === activeProblemId);
                if (idx < PROBLEMS.length - 1) handleSwitchProblem(PROBLEMS[idx + 1].id);
              }}
              disabled={PROBLEMS.findIndex((p) => p.id === activeProblemId) === PROBLEMS.length - 1}
              className="flex items-center space-x-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Center: Problem Statement */}
        <div className="lg:col-span-4 bg-slate-900/60 p-4 border-r border-slate-800 overflow-y-auto max-h-[calc(100vh-130px)] space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-lg font-bold text-white">{activeProblem.title}</h2>
            <span className="px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 font-mono text-xs font-bold">
              {activeProblem.marks} Marks
            </span>
          </div>

          {/* Statement */}
          <div className="prose prose-invert max-w-none text-xs leading-relaxed text-slate-300 space-y-2 whitespace-pre-line">
            {activeProblem.description}
          </div>

          {/* Input/Output Format */}
          <div className="space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="font-semibold text-slate-200 flex items-center space-x-1.5">
              <FileText className="h-3.5 w-3.5 text-indigo-400" />
              <span>Input / Output Spec</span>
            </div>
            <div>
              <span className="text-slate-400">Input: </span>
              <code className="text-indigo-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded">{activeProblem.inputFormat}</code>
            </div>
            <div>
              <span className="text-slate-400">Expected Output: </span>
              <code className="text-emerald-300 font-mono bg-slate-900 px-1.5 py-0.5 rounded">{activeProblem.outputFormat}</code>
            </div>
          </div>

          {/* Constraints */}
          <div className="space-y-1.5 bg-slate-950/80 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="font-semibold text-slate-200">Constraints:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-[11px]">
              {activeProblem.constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>

          {/* Visible Sample Cases */}
          <div className="space-y-2">
            <div className="font-semibold text-xs text-slate-300">Visible Sample Test Cases:</div>
            {activeProblem.visibleTestCases.map((tc, idx) => (
              <div key={tc.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                <div className="font-mono text-[11px] text-indigo-400 font-semibold">Sample Case #{idx + 1}</div>
                <div className="font-mono text-slate-300"><span className="text-slate-500">Input:</span> {tc.input}</div>
                <div className="font-mono text-emerald-400"><span className="text-slate-500">Output:</span> {tc.expectedOutput}</div>
                {tc.explanation && (
                  <div className="text-[11px] text-slate-400 italic pt-1">{tc.explanation}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Monaco Editor & Judge Output */}
        <div className="lg:col-span-5 flex flex-col bg-slate-950 overflow-hidden">
          {/* Editor Header Bar */}
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Code2 className="h-4 w-4 text-indigo-400" />
              <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1">
                <span className="text-[11px] text-slate-400 font-semibold">Language:</span>
                <select
                  value={activeLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value as Language)}
                  className="bg-transparent text-xs font-bold font-mono text-indigo-300 focus:outline-none cursor-pointer"
                >
                  <option value="python" className="bg-slate-900 text-slate-100">Python (Python 3)</option>
                  <option value="java" className="bg-slate-900 text-slate-100">Java (OpenJDK 17)</option>
                  <option value="c" className="bg-slate-900 text-slate-100">C (GCC 11)</option>
                  <option value="cpp" className="bg-slate-900 text-slate-100">C++ (G++ 11)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Run Button (Visible sample test cases) */}
              <button
                onClick={handleRunCode}
                disabled={isEvaluating}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs py-1.5 px-3 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5 text-indigo-400 fill-current" />
                <span>Run (Samples)</span>
              </button>

              {/* Submit Problem Button (Visible + Hidden test cases) */}
              <button
                onClick={handleSubmitProblem}
                disabled={isEvaluating}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs py-1.5 px-3 rounded-lg shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Submit Code</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-[340px] border-b border-slate-800 relative">
            <Editor
              height="100%"
              language={activeLanguage === 'java' ? 'java' : activeLanguage === 'python' ? 'python' : 'cpp'}
              theme="vs-dark"
              value={currentCode}
              onChange={handleCodeChange}
              options={{
                fontSize: 13,
                fontFamily: "'Fira Code', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                contextmenu: false, // Disables right-click inside monaco
                lineNumbersMinChars: 3,
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>

          {/* Judge Results Panel */}
          <div className="h-56 bg-slate-900/90 p-4 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <Terminal className="h-4 w-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Test Case Results
                </span>
              </div>

              {executionResult && (
                <div className="text-xs font-mono">
                  <span className={executionResult.passedCount === executionResult.totalCount ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    Passed: {executionResult.passedCount} / {executionResult.totalCount}
                  </span>
                  <span className="text-slate-400 ml-2">
                    (Earned: {executionResult.earnedMarks}/{activeProblem.marks} Marks)
                  </span>
                </div>
              )}
            </div>

            {!executionResult && !isEvaluating && (
              <div className="text-xs text-slate-500 text-center py-8">
                Click "Run" to test on sample inputs or "Submit Code" to run all test cases.
              </div>
            )}

            {isEvaluating && (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-xs font-mono text-indigo-300">Compiling & Executing Java Code...</div>
              </div>
            )}

            {executionResult && !isEvaluating && (
              <div className="space-y-2">
                {executionResult.compilationError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs font-mono text-red-300 whitespace-pre-wrap">
                    <div className="font-bold text-red-400 mb-1 flex items-center space-x-1">
                      <XCircle className="h-4 w-4" />
                      <span>Compilation / Execution Failure</span>
                    </div>
                    {executionResult.compilationError}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-2">
                  {executionResult.testResults.map((tc, idx) => (
                    <div
                      key={tc.testCaseId}
                      className={`p-3 rounded-xl border text-xs font-mono space-y-1 transition-all ${
                        tc.passed
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                          : 'bg-red-500/10 border-red-500/30 text-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 font-bold">
                          {tc.passed ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-400" />
                          )}
                          <span>
                            {tc.isHidden ? `Hidden Test Case #${idx + 1}` : `Test Case #${idx + 1}`}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-sans font-bold ${
                            tc.passed
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {tc.passed ? 'PASS ✅' : 'FAIL ❌'}
                        </span>
                      </div>

                      {/* Display test details */}
                      {!tc.isHidden ? (
                        <div className="space-y-0.5 pt-1 text-[11px] text-slate-300">
                          <div><span className="text-slate-500">Input:</span> {tc.input}</div>
                          <div><span className="text-slate-500">Expected:</span> {tc.expectedOutput}</div>
                          <div>
                            <span className="text-slate-500">Actual Output:</span>{' '}
                            <span className={tc.passed ? 'text-emerald-300' : 'text-red-300 font-bold'}>
                              {tc.error ? tc.error : tc.actualOutput || '(Empty)'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 italic pt-1">
                          {tc.passed
                            ? 'All hidden assertions matched.'
                            : tc.error
                            ? `Failed: ${tc.error}`
                            : 'Output did not match hidden expected result.'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
