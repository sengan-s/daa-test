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
  FileSpreadsheet,
  Database,
  CloudUpload,
  Copy,
  Check,
  ExternalLink,
  Settings,
  Zap,
  Layers
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

  // Supabase Database State
  const [supabaseStatus, setSupabaseStatus] = useState<{
    configured: boolean;
    url: string;
    fullUrl?: string;
    connected: boolean;
    tableExists: boolean;
    message: string;
  } | null>(null);
  const [isSupabaseLoading, setIsSupabaseLoading] = useState(false);
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [showSchemaModal, setShowSchemaModal] = useState(false);
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [supabaseMsg, setSupabaseMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [sqlSchema, setSqlSchema] = useState('');
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeDataSource, setActiveDataSource] = useState<'local' | 'supabase'>('local');

  // Load submissions if authenticated
  const fetchResults = async (authToken: string) => {
    setIsLoading(true);
    try {
      if (activeDataSource === 'supabase') {
        const data = await api.getSupabaseSubmissions();
        setSubmissions(data);
      } else {
        const data = await api.getAdminResults(authToken);
        setSubmissions(data);
      }
    } catch (err: any) {
      if (activeDataSource === 'supabase') {
        setSupabaseMsg({ type: 'error', text: err.message || 'Failed to fetch Supabase data' });
      } else {
        setToken(null);
        localStorage.removeItem('daa_admin_token');
        setLoginError('Session expired. Please log in again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSupabaseStatus = async () => {
    setIsSupabaseLoading(true);
    try {
      const status = await api.getSupabaseStatus();
      setSupabaseStatus(status);
      if (status.fullUrl) setSupabaseUrlInput(status.fullUrl);
    } catch (e: any) {
      console.error('Error getting Supabase status:', e);
    } finally {
      setIsSupabaseLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchResults(token);
      fetchSupabaseStatus();
    }
  }, [token, activeDataSource]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const res = await api.adminLogin(password);
      setToken(res.token);
      localStorage.setItem('daa_admin_token', res.token);
      fetchResults(res.token);
      fetchSupabaseStatus();
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

  const handleExportCsv = () => {
    if (!token) return;
    const url = api.getExportCsvUrl(token);
    window.open(url, '_blank');
  };

  const handleSaveSupabaseConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSupabaseLoading(true);
    setSupabaseMsg(null);

    try {
      const res = await api.saveSupabaseConfig(supabaseUrlInput, supabaseKeyInput);
      setSupabaseMsg({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      fetchSupabaseStatus();
      if (res.success) {
        setTimeout(() => setShowSupabaseModal(false), 1500);
      }
    } catch (err: any) {
      setSupabaseMsg({ type: 'error', text: err.message || 'Configuration failed' });
    } finally {
      setIsSupabaseLoading(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSupabaseLoading(true);
    setSupabaseMsg(null);
    try {
      const res = await api.syncSupabaseSubmissions();
      setSupabaseMsg({
        type: 'success',
        text: `Successfully synced ${res.syncedCount} of ${res.totalCount} records to Supabase!`,
      });
      fetchSupabaseStatus();
    } catch (err: any) {
      setSupabaseMsg({ type: 'error', text: err.message || 'Sync failed' });
    } finally {
      setIsSupabaseLoading(false);
    }
  };

  const handleFetchSchema = async () => {
    try {
      const schema = await api.getSupabaseSchema();
      setSqlSchema(schema);
      setShowSchemaModal(true);
    } catch (e) {
      console.error('Failed to get schema:', e);
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(sqlSchema);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
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

  // If not logged in: Password Modal
  if (!token) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A0E2A]/90 backdrop-blur-md">
        <div className="relative w-full max-w-md bg-[#0D1335]/90 border border-[#7B61FF]/30 rounded-3xl p-6 lg:p-8 shadow-[0_0_35px_rgba(247,37,133,0.15)] space-y-6">
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F72585]/20 text-[#F72585] border border-[#F72585]/40 shadow-lg shadow-[#F72585]/20">
              <Lock className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">DAA Admin Portal</h2>
            <p className="text-xs text-slate-300">Enter security passkey to access assessment results</p>
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
                placeholder="Enter passkey"
                className="w-full bg-[#070A1E] border border-[#7B61FF]/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#F72585] transition-all"
              />
            </div>

            {loginError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-400 font-medium">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#F72585] to-[#7B61FF] hover:from-[#e01e74] hover:to-[#684be3] text-white shadow-lg shadow-[#F72585]/25 transition-all cursor-pointer disabled:opacity-50 border border-[#F72585]/40"
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
    <div className="min-h-[calc(100vh-65px)] bg-gradient-to-br from-[#0A0E2A] via-[#0E1338] to-[#1A1F4B] text-slate-100 p-4 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0D1335]/80 border border-[#7B61FF]/30 rounded-2xl p-5 shadow-[0_0_20px_rgba(247,37,133,0.1)] backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F72585]/20 text-[#F72585] border border-[#F72585]/30">
            <Terminal className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">DAA Assessment Admin Portal</h1>
            <p className="text-xs text-slate-300">Candidate Submission Records & Automated Judge Evaluation</p>
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

      {/* Supabase Database Connectivity Hub */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Supabase Cloud Database Connectivity</h2>
                {supabaseStatus?.connected ? (
                  <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Connected</span>
                  </span>
                ) : supabaseStatus?.configured ? (
                  <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Zap className="h-3 w-3" />
                    <span>Schema / Setup Required</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                    <span>Not Configured</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {supabaseStatus?.message || 'Sync submissions to cloud PostgreSQL database table daa_submissions.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Source Switcher */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center space-x-1">
              <button
                onClick={() => setActiveDataSource('local')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeDataSource === 'local'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Local JSON
              </button>
              <button
                onClick={() => setActiveDataSource('supabase')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  activeDataSource === 'supabase'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Database className="h-3.5 w-3.5" />
                <span>Supabase Live DB</span>
              </button>
            </div>

            <button
              onClick={handleSyncToSupabase}
              disabled={isSupabaseLoading}
              className="flex items-center space-x-1.5 px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <CloudUpload className={`h-3.5 w-3.5 ${isSupabaseLoading ? 'animate-bounce' : ''}`} />
              <span>Sync Local → Supabase</span>
            </button>

            <button
              onClick={handleFetchSchema}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Code2 className="h-3.5 w-3.5 text-purple-400" />
              <span>SQL Schema</span>
            </button>

            <button
              onClick={() => setShowSupabaseModal(true)}
              className="flex items-center space-x-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5 text-emerald-400" />
              <span>Configure Keys</span>
            </button>
          </div>
        </div>

        {supabaseMsg && (
          <div
            className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
              supabaseMsg.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <span>{supabaseMsg.text}</span>
            <button onClick={() => setSupabaseMsg(null)} className="text-slate-400 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
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

      {/* Supabase Settings Modal */}
      {showSupabaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowSupabaseModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Configure Supabase Database</h3>
                <p className="text-xs text-slate-400">Connect your Supabase project to auto-persist assessment results</p>
              </div>
            </div>

            <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Supabase Anon Key or Service Role Key
                </label>
                <input
                  type="password"
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              {supabaseMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    supabaseMsg.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  {supabaseMsg.text}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupabaseModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSupabaseLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSupabaseLoading ? 'Connecting...' : 'Save & Verify Connection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SQL DDL Schema Modal */}
      {showSchemaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowSchemaModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Code2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Supabase SQL DDL Schema</h3>
                <p className="text-xs text-slate-400">Copy and execute in Supabase SQL Editor to create table daa_submissions</p>
              </div>
            </div>

            <div className="relative bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto max-h-80">
              <button
                onClick={handleCopySchema}
                className="absolute top-3 right-3 flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                {copiedSql ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedSql ? 'Copied!' : 'Copy SQL'}</span>
              </button>
              <pre className="font-mono text-xs text-purple-200 whitespace-pre">{sqlSchema}</pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSchemaModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

