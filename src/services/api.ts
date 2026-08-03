import { CandidateSession, Language, ProblemExecutionResult, SubmissionRecord } from '../types';

export const api = {
  async runCode(
    problemId: string,
    code: string,
    language: Language = 'java',
    isSubmit: boolean = false
  ): Promise<ProblemExecutionResult> {
    const res = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ problemId, code, language, isSubmit }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Server request failed' }));
      throw new Error(err.message || 'Execution error');
    }

    return res.json();
  },

  async submitAssessment(data: {
    sessionId: string;
    rollNo: string;
    name: string;
    codePerProblem: CandidateSession['codePerProblem'];
    languages?: CandidateSession['languagePerProblem'];
    violations: number;
    timeTaken: string;
  }): Promise<SubmissionRecord> {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Submission failed' }));
      throw new Error(err.message || 'Submission error');
    }

    return res.json();
  },

  async syncSession(session: CandidateSession): Promise<{ success: boolean }> {
    try {
      const res = await fetch('/api/session/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session }),
      });
      return res.json();
    } catch {
      return { success: false };
    }
  },

  async adminLogin(password: string): Promise<{ token: string }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Invalid password' }));
      throw new Error(err.message || 'Authentication failed');
    }

    return res.json();
  },

  async getAdminResults(token: string): Promise<SubmissionRecord[]> {
    const res = await fetch(`/api/admin/results?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    });

    if (!res.ok) {
      throw new Error('Failed to fetch submission records');
    }

    return res.json();
  },

  getExportCsvUrl(token: string): string {
    return `/api/admin/export-csv?token=${encodeURIComponent(token)}`;
  }
};
