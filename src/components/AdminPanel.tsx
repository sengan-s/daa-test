import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Lock,
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Code2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { SubmissionRecord } from '../types';
import { api } from '../services/api';

interface AdminPanelProps {
  onClose?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('daa_admin_token')
  );
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'totalScore' | 'rollNo' | 'submittedAt'>('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [selectedCodeProblem, setSelectedCodeProblem] = useState<'merge-sorted-array' | 'binary-search' | 'matrix-multiplication'>('merge-sorted-array');

  // Load submissions if authenticated
  const fetchResults = async (authToken: string) => {
    setIsLoading(true);
    try {
      const data = await api.getAdminResults(authToken);
      setSubmissions(data);
    } catch (err: any) {
      setToken(null);
      localStorage.removeItem('daa_admin_token');
      setLoginError('Session expired. Please log in again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchResults(token);
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const res = await api.adminLogin(password);
      setToken(res.token);
      localStorage.setItem('daa_admin_token', res.token);
      fetchResults(res.token);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('daa_admin_token');
  };

  // Search & Sorting Filter
  const filteredSubmissions = submissions
    .filter(
      (s) =>
        s.rollNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'submittedAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  // Export CSV
  const handleExportCsv = () => {
    if (!token) return;
    const url = api.getExportCsvUrl(token);
    window.open(url, '_blank');
  };

  // If not logged in: Password Modal
  if (!token) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl space-y-6">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-white">DAA Admin Portal</h2>
            <p className="text-xs text-slate-400">Enter security passkey to access assessment results</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Admin Passkey
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter passkey (e.g., 250806 or admin)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Passkey: <code className="text-indigo-300 font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded">250806</code> or <code className="text-indigo-300 font-mono font-bold bg-slate-800 px-1.5 py-0.5 rounded">admin</code></span>
              </p>
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400 font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : 'Access Dashboard'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="min-h-[calc(100vh-65px)] bg-slate-950 text-slate-100 p-4 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">DAA Assessment Admin Portal</h1>
            <p className="text-xs text-slate-400">Candidate Submission Records & Automated Judge Evaluation</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => token && fetchResults(token)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-indigo-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh DB</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Logout
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Roll No or Student Name..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-400 font-medium">Sort By:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="submittedAt">Submission Time</option>
            <option value="totalScore">Total Score</option>
            <option value="rollNo">Roll Number</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-semibold"
          >
            {sortOrder === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
          </button>

          <span className="text-slate-500 font-mono">
            Submissions: {filteredSubmissions.length}
          </span>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 font-mono text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="p-4">Roll Number</th>
                <th className="p-4">Student Name</th>
                <th className="p-4 text-center">Score (/50)</th>
                <th className="p-4 text-center">Merge Array (/15)</th>
                <th className="p-4 text-center">Binary Search (/15)</th>
                <th className="p-4 text-center">Matrix Mult (/20)</th>
                <th className="p-4 text-center">Warnings</th>
                <th className="p-4 text-center">Time Taken</th>
                <th className="p-4">Submitted At</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    No candidate submissions found.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => {
                  const isExpanded = expandedRowId === sub.id;

                  return (
                    <React.Fragment key={sub.id}>
                      <tr
                        onClick={() => setExpandedRowId(isExpanded ? null : sub.id)}
                        className={`hover:bg-slate-800/50 transition-colors cursor-pointer ${
                          isExpanded ? 'bg-indigo-950/20' : ''
                        }`}
                      >
                        <td className="p-4 font-mono font-bold text-indigo-400">{sub.rollNo}</td>
                        <td className="p-4 font-semibold text-white">{sub.name}</td>
                        <td className="p-4 text-center">
                          <span className="font-mono font-extrabold text-sm text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            {sub.totalScore}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono font-bold text-slate-300">{sub.mergeSortMarks}</td>
                        <td className="p-4 text-center font-mono font-bold text-slate-300">{sub.binarySearchMarks}</td>
                        <td className="p-4 text-center font-mono font-bold text-slate-300">{sub.matrixMultMarks}</td>
                        <td className="p-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold ${
                              sub.violations > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {sub.violations}/3
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono text-slate-400">{sub.timeTaken}</td>
                        <td className="p-4 text-slate-400 font-mono text-[11px]">
                          {new Date(sub.submittedAt).toLocaleString()}
                        </td>
                        <td className="p-4 text-right">
                          <button className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Row Details */}
                      {isExpanded && (
                        <tr className="bg-slate-950/80">
                          <td colSpan={10} className="p-5 border-y border-indigo-500/30">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                <div className="flex items-center space-x-2">
                                  <Code2 className="h-4 w-4 text-indigo-400" />
                                  <span className="font-bold text-white text-sm">
                                    Submitted Code ({sub.languages?.[selectedCodeProblem]?.toUpperCase() || 'JAVA'}) & Test Case Breakdown
                                  </span>
                                </div>

                                {/* Problem Code Selector */}
                                <div className="flex items-center space-x-2">
                                  {(['merge-sorted-array', 'binary-search', 'matrix-multiplication'] as const).map((pid) => (
                                    <button
                                      key={pid}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCodeProblem(pid);
                                      }}
                                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                        selectedCodeProblem === pid
                                          ? 'bg-indigo-600 text-white'
                                          : 'bg-slate-800 text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      {pid === 'merge-sorted-array'
                                        ? 'Merge Sorted Array'
                                        : pid === 'binary-search'
                                        ? 'Binary Search'
                                        : 'Matrix Mult'}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Code & Test breakdown display */}
                              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                                <div className="lg:col-span-7 bg-slate-900 p-4 rounded-2xl border border-slate-800 font-mono text-xs overflow-x-auto text-indigo-200">
                                  <pre className="whitespace-pre-wrap">{sub.code[selectedCodeProblem] || '// No code submitted'}</pre>
                                </div>

                                <div className="lg:col-span-5 bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
                                  <div className="font-bold text-slate-300 text-xs uppercase tracking-wider mb-2">
                                    Test Case Evaluations
                                  </div>

                                  {sub.testBreakdown?.[selectedCodeProblem]?.testResults ? (
                                    sub.testBreakdown[selectedCodeProblem].testResults.map((tc: any, i: number) => (
                                      <div
                                        key={i}
                                        className={`p-2.5 rounded-xl border font-mono text-[11px] flex items-center justify-between ${
                                          tc.passed
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                            : 'bg-red-500/10 border-red-500/20 text-red-300'
                                        }`}
                                      >
                                        <div className="flex items-center space-x-2">
                                          {tc.passed ? (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                          ) : (
                                            <XCircle className="h-3.5 w-3.5 text-red-400" />
                                          )}
                                          <span>{tc.isHidden ? `Hidden Case #${i + 1}` : `Visible Case #${i + 1}`}</span>
                                        </div>
                                        <span className="font-bold">{tc.passed ? 'PASS' : 'FAIL'}</span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-slate-500 text-xs">Evaluations available.</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
