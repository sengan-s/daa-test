export type Language = 'java' | 'python' | 'c' | 'cpp';

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  explanation?: string;
}

export interface Problem {
  id: 'merge-sorted-array' | 'binary-search' | 'matrix-multiplication';
  title: string;
  marks: number; // 15, 15, or 20
  description: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  starterCode: Record<Language, string>;
  visibleTestCases: TestCase[];
  hiddenTestCases: TestCase[];
}

export interface TestCaseResult {
  testCaseId: string;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  error?: string; // Compilation error, Runtime error, or Timeout
  isHidden: boolean;
  executionTimeMs?: number;
}

export interface ProblemExecutionResult {
  problemId: string;
  language?: Language;
  compiled: boolean;
  compilationError?: string;
  testResults: TestCaseResult[];
  passedCount: number;
  totalCount: number;
  earnedMarks: number;
}

export interface CandidateSession {
  sessionId: string;
  rollNo: string;
  name: string;
  startTime: number; // Timestamp
  timeRemainingSeconds: number;
  violations: number;
  codePerProblem: {
    'merge-sorted-array': string;
    'binary-search': string;
    'matrix-multiplication': string;
  };
  languagePerProblem: {
    'merge-sorted-array': Language;
    'binary-search': Language;
    'matrix-multiplication': Language;
  };
  problemStatuses: {
    'merge-sorted-array': 'unattempted' | 'attempted' | 'solved';
    'binary-search': 'unattempted' | 'attempted' | 'solved';
    'matrix-multiplication': 'unattempted' | 'attempted' | 'solved';
  };
  lastEvaluatedResults?: {
    [problemId: string]: ProblemExecutionResult;
  };
  isSubmitted: boolean;
}

export interface SubmissionRecord {
  id: string;
  sessionId: string;
  rollNo: string;
  name: string;
  mergeSortMarks: number;
  binarySearchMarks: number;
  matrixMultMarks: number;
  totalScore: number;
  timeTaken: string; // e.g. "14:25"
  violations: number;
  submittedAt: string; // ISO String
  code: {
    'merge-sorted-array': string;
    'binary-search': string;
    'matrix-multiplication': string;
  };
  languages?: {
    'merge-sorted-array': Language;
    'binary-search': Language;
    'matrix-multiplication': Language;
  };
  testBreakdown?: {
    [problemId: string]: ProblemExecutionResult;
  };
}
