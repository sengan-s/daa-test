import React, { useState, useEffect, useRef } from 'react';
import { CandidateSession, SubmissionRecord } from './types';
import { PROBLEMS } from './data/problems';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { StartPage } from './components/StartPage';
import { AssessmentPage } from './components/AssessmentPage';
import { ResultsPage } from './components/ResultsPage';
import { AdminPanel } from './components/AdminPanel';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'start' | 'assessment' | 'results' | 'admin'>(() => {
    if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
      return 'admin';
    }
    return 'start';
  });

  const [isDarkMode, setIsDarkMode] = useState(true);
  const [session, setSession] = useState<CandidateSession | null>(null);
  const [submission, setSubmission] = useState<SubmissionRecord | null>(null);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(3600); // 1 hour = 3600s
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Restore session from localStorage on load/refresh
  useEffect(() => {
    const savedSessionStr = localStorage.getItem('daa_candidate_session');
    const savedSubmissionStr = localStorage.getItem('daa_submission_record');

    if (savedSubmissionStr) {
      try {
        const sub = JSON.parse(savedSubmissionStr);
        setSubmission(sub);
        if (currentScreen !== 'admin') {
          setCurrentScreen('results');
        }
      } catch (e) {}
    } else if (savedSessionStr) {
      try {
        const sess: CandidateSession = JSON.parse(savedSessionStr);
        setSession(sess);

        if (sess.isSubmitted) {
          setCurrentScreen('results');
        } else if (currentScreen !== 'admin') {
          // Calculate remaining time based on start timestamp
          const elapsedSeconds = Math.floor((Date.now() - sess.startTime) / 1000);
          const remaining = Math.max(0, 3600 - elapsedSeconds);
          setTimeRemainingSeconds(remaining);
          setCurrentScreen('assessment');
        }
      } catch (e) {}
    }
  }, []);

  // Sync route changes (#admin)
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin' || window.location.pathname === '/admin') {
        setCurrentScreen('admin');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (currentScreen === 'assessment' && session && !session.isSubmitted) {
      timerRef.current = setInterval(() => {
        setTimeRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            // Timeout reached -> Auto-submit
            if (session) {
              handleFinalSubmit(session);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentScreen, session]);

  // Start Assessment Handler
  const handleStartAssessment = (rollNo: string, name: string) => {
    const newSession: CandidateSession = {
      sessionId: Math.random().toString(36).substring(2, 11),
      rollNo,
      name,
      startTime: Date.now(),
      timeRemainingSeconds: 3600,
      violations: 0,
      codePerProblem: {
        'merge-sorted-array': PROBLEMS[0].starterCode.java,
        'binary-search': PROBLEMS[1].starterCode.java,
        'matrix-multiplication': PROBLEMS[2].starterCode.java,
      },
      languagePerProblem: {
        'merge-sorted-array': 'java',
        'binary-search': 'java',
        'matrix-multiplication': 'java',
      },
      problemStatuses: {
        'merge-sorted-array': 'unattempted',
        'binary-search': 'unattempted',
        'matrix-multiplication': 'unattempted',
      },
      isSubmitted: false,
    };

    setSession(newSession);
    setTimeRemainingSeconds(3600);
    localStorage.setItem('daa_candidate_session', JSON.stringify(newSession));
    setCurrentScreen('assessment');
  };

  // Update Session in State and LocalStorage
  const handleUpdateSession = (updated: CandidateSession) => {
    setSession(updated);
    localStorage.setItem('daa_candidate_session', JSON.stringify(updated));
  };

  // Final Submit Handler
  const handleFinalSubmit = async (sessToSubmit: CandidateSession) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsedSeconds = Math.max(0, 3600 - timeRemainingSeconds);
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    const timeTakenStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    try {
      const resultRecord = await api.submitAssessment({
        sessionId: sessToSubmit.sessionId,
        rollNo: sessToSubmit.rollNo,
        name: sessToSubmit.name,
        codePerProblem: sessToSubmit.codePerProblem,
        languages: sessToSubmit.languagePerProblem,
        violations: sessToSubmit.violations,
        timeTaken: timeTakenStr,
      });

      const updatedSess: CandidateSession = {
        ...sessToSubmit,
        isSubmitted: true,
      };

      setSession(updatedSess);
      setSubmission(resultRecord);
      localStorage.setItem('daa_candidate_session', JSON.stringify(updatedSess));
      localStorage.setItem('daa_submission_record', JSON.stringify(resultRecord));
      setCurrentScreen('results');
    } catch (err: any) {
      console.warn('Backend submission warning:', err);
      // Fallback submission record so student progress is always preserved
      const fallbackRecord: SubmissionRecord = {
        id: sessToSubmit.sessionId || 'sub_' + Date.now(),
        sessionId: sessToSubmit.sessionId,
        rollNo: sessToSubmit.rollNo,
        name: sessToSubmit.name,
        totalScore: 0,
        mergeSortMarks: 0,
        binarySearchMarks: 0,
        matrixMultMarks: 0,
        timeTaken: timeTakenStr,
        violations: sessToSubmit.violations,
        submittedAt: new Date().toISOString(),
        code: sessToSubmit.codePerProblem,
      };

      const updatedSess: CandidateSession = {
        ...sessToSubmit,
        isSubmitted: true,
      };

      setSession(updatedSess);
      setSubmission(fallbackRecord);
      localStorage.setItem('daa_candidate_session', JSON.stringify(updatedSess));
      localStorage.setItem('daa_submission_record', JSON.stringify(fallbackRecord));
      setCurrentScreen('results');
    }
  };

  // Exit Assessment Handler
  const handleExit = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    setSession(null);
    setSubmission(null);
    setTimeRemainingSeconds(3600);

    localStorage.removeItem('daa_candidate_session');
    localStorage.removeItem('daa_submission_record');

    // Replace history state to lock back-navigation
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, '', '/');
    }

    setCurrentScreen('start');
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-gradient-to-br from-[#0A0E2A] via-[#0D1335] to-[#1A1F4B] text-slate-100' : 'bg-slate-100 text-slate-900'} transition-colors duration-200 font-sans selection:bg-[#F72585] selection:text-white`}>
      <Navbar
        timeRemainingSeconds={timeRemainingSeconds}
        rollNo={session?.rollNo}
        name={session?.name}
        violations={session?.violations || 0}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onOpenAdminLogin={() => setCurrentScreen('admin')}
        isAssessmentActive={currentScreen === 'assessment'}
      />

      <main className="w-full">
        {currentScreen === 'start' && (
          <StartPage
            onStartAssessment={handleStartAssessment}
            savedRollNo={session?.rollNo}
            savedName={session?.name}
          />
        )}

        {currentScreen === 'assessment' && session && (
          <AssessmentPage
            session={session}
            onUpdateSession={handleUpdateSession}
            onFinalSubmit={handleFinalSubmit}
          />
        )}

        {currentScreen === 'results' && submission && (
          <ResultsPage submission={submission} onExit={handleExit} />
        )}

        {currentScreen === 'admin' && (
          <AdminPanel onClose={() => setCurrentScreen(session ? (session.isSubmitted ? 'results' : 'assessment') : 'start')} />
        )}
      </main>
    </div>
  );
}
