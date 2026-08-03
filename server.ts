import express from 'express';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { createServer as createViteServer } from 'vite';
import vm from 'vm';
import {
  saveSubmissionToSupabase,
  testSupabaseConnection,
  getSupabaseCredentials,
  saveSupabaseCredentials,
  syncLocalSubmissionsToSupabase,
  fetchSubmissionsFromSupabase,
  getSupabaseSQLSchema,
} from './src/services/supabaseServer';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Helper to load/save JSON
function loadData<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data) as T;
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e);
  }
  return defaultValue;
}

function saveData<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error(`Error writing ${filePath}:`, e);
  }
}

// Problem definitions & Test Cases for backend verification
interface BackendTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

interface BackendProblem {
  id: string;
  marks: number;
  visibleTestCases: BackendTestCase[];
  hiddenTestCases: BackendTestCase[];
}

const BACKEND_PROBLEMS: Record<string, BackendProblem> = {
  'merge-sorted-array': {
    id: 'merge-sorted-array',
    marks: 15,
    visibleTestCases: [
      { id: 'msa-v1', input: 'nums1=[1,2,3,0,0,0], m=3, nums2=[2,5,6], n=3', expectedOutput: '[1, 2, 2, 3, 5, 6]', isHidden: false },
      { id: 'msa-v2', input: 'nums1=[1], m=1, nums2=[], n=0', expectedOutput: '[1]', isHidden: false },
      { id: 'msa-v3', input: 'nums1=[0], m=0, nums2=[1], n=1', expectedOutput: '[1]', isHidden: false },
    ],
    hiddenTestCases: [
      { id: 'msa-h1', input: 'nums1=[4,5,6,0,0,0], m=3, nums2=[1,2,3], n=3', expectedOutput: '[1, 2, 3, 4, 5, 6]', isHidden: true },
      { id: 'msa-h2', input: 'nums1=[0,0,0,0], m=0, nums2=[1,2,3,4], n=4', expectedOutput: '[1, 2, 3, 4]', isHidden: true },
    ]
  },
  'binary-search': {
    id: 'binary-search',
    marks: 15,
    visibleTestCases: [
      { id: 'bs-v1', input: 'arr=[1,3,5,7,9,11], target=7', expectedOutput: '3', isHidden: false },
      { id: 'bs-v2', input: 'arr=[2,4,6,8], target=5', expectedOutput: '-1', isHidden: false },
      { id: 'bs-v3', input: 'arr=[10], target=10', expectedOutput: '0', isHidden: false },
    ],
    hiddenTestCases: [
      { id: 'bs-h1', input: 'arr=[], target=1', expectedOutput: '-1', isHidden: true },
      { id: 'bs-h2', input: 'arr=[1,2,3,4,5], target=1', expectedOutput: '0', isHidden: true },
    ]
  },
  'matrix-multiplication': {
    id: 'matrix-multiplication',
    marks: 20,
    visibleTestCases: [
      { id: 'mm-v1', input: 'A=[[1,2],[3,4]], B=[[5,6],[7,8]]', expectedOutput: '[[19, 22], [43, 50]]', isHidden: false },
      { id: 'mm-v2', input: 'A=[[1,0],[0,1]], B=[[2,3],[4,5]]', expectedOutput: '[[2, 3], [4, 5]]', isHidden: false },
      { id: 'mm-v3', input: 'A=[[1,2,3]], B=[[1],[1],[1]]', expectedOutput: '[[6]]', isHidden: false },
    ],
    hiddenTestCases: [
      { id: 'mm-h1', input: 'A=[[2]], B=[[3]]', expectedOutput: '[[6]]', isHidden: true },
      { id: 'mm-h2', input: 'A=[[1,1],[1,1]], B=[[1,1],[1,1]]', expectedOutput: '[[2, 2], [2, 2]]', isHidden: true },
    ]
  }
};

// Check if javac is available
let javacAvailable: boolean | null = null;
async function checkJavac(): Promise<boolean> {
  if (javacAvailable !== null) return javacAvailable;
  return new Promise((resolve) => {
    const proc = spawn('javac', ['-version']);
    proc.on('error', () => {
      javacAvailable = false;
      resolve(false);
    });
    proc.on('close', (code) => {
      javacAvailable = (code === 0);
      resolve(javacAvailable);
    });
  });
}

// Check if python3 is available
let pythonAvailable: boolean | null = null;
async function checkPython3(): Promise<boolean> {
  if (pythonAvailable !== null) return pythonAvailable;
  return new Promise((resolve) => {
    const proc = spawn('python3', ['--version']);
    proc.on('error', () => {
      pythonAvailable = false;
      resolve(false);
    });
    proc.on('close', (code) => {
      pythonAvailable = (code === 0);
      resolve(pythonAvailable);
    });
  });
}

// Code Sandbox / Judge Engine for Python, Java, C, and C++
async function executeCodeTestCase(
  problemId: string,
  language: string,
  candidateCode: string,
  testCase: BackendTestCase
): Promise<{
  passed: boolean;
  actualOutput: string;
  error?: string;
  executionTimeMs: number;
}> {
  const startTime = Date.now();

  if (language === 'python') {
    const hasPython = await checkPython3();
    if (hasPython) {
      try {
        const res = await runRealPythonProcess(problemId, candidateCode, testCase);
        return res;
      } catch (e: any) {
        console.warn('Real python process failed, falling back to VM engine:', e?.message);
      }
    }
  } else if (language === 'java') {
    const hasJavac = await checkJavac();
    if (hasJavac) {
      try {
        const res = await runRealJavaProcess(problemId, candidateCode, testCase);
        return res;
      } catch (e: any) {
        console.warn('Real javac process failed, falling back to Java VM engine:', e?.message);
      }
    }
  }

  // Standalone Sandboxed Execution Engine for Java, C, C++, Python
  return runVMEngine(problemId, language || 'java', candidateCode, testCase, startTime);
}

// Real python3 runner
async function runRealPythonProcess(problemId: string, candidateCode: string, testCase: BackendTestCase): Promise<{
  passed: boolean;
  actualOutput: string;
  error?: string;
  executionTimeMs: number;
}> {
  const startTime = Date.now();
  const runId = Math.random().toString(36).substring(2, 9);
  const tempDir = path.join('/tmp', `daa_py_${runId}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const pyPath = path.join(tempDir, 'solution.py');

  let testWrapper = candidateCode + '\n\nimport json, sys\n';

  if (problemId === 'merge-sorted-array') {
    const { nums1, m, nums2, n } = parseMsaInput(testCase.input);
    testWrapper += `
nums1 = ${JSON.stringify(nums1)}
m = ${m}
nums2 = ${JSON.stringify(nums2)}
n = ${n}

if 'Solution' in globals():
    sol = Solution()
    if hasattr(sol, 'merge'):
        sol.merge(nums1, m, nums2, n)
    elif 'merge' in globals():
        merge(nums1, m, nums2, n)
elif 'merge' in globals():
    merge(nums1, m, nums2, n)

print(json.dumps(nums1))
`;
  } else if (problemId === 'binary-search') {
    const { arr, target } = parseBsInput(testCase.input);
    testWrapper += `
arr = ${JSON.stringify(arr)}
target = ${target}
res = -1

if 'Solution' in globals():
    sol = Solution()
    if hasattr(sol, 'binarySearch'):
        res = sol.binarySearch(arr, target)
    elif hasattr(sol, 'binary_search'):
        res = sol.binary_search(arr, target)
    elif 'binarySearch' in globals():
        res = binarySearch(arr, target)
    elif 'binary_search' in globals():
        res = binary_search(arr, target)
elif 'binarySearch' in globals():
    res = binarySearch(arr, target)
elif 'binary_search' in globals():
    res = binary_search(arr, target)

print(res)
`;
  } else if (problemId === 'matrix-multiplication') {
    const { A, B } = parseMmInput(testCase.input);
    testWrapper += `
A = ${JSON.stringify(A)}
B = ${JSON.stringify(B)}
res = []

if 'Solution' in globals():
    sol = Solution()
    if hasattr(sol, 'multiply'):
        res = sol.multiply(A, B)
    elif 'multiply' in globals():
        multiply(A, B)
elif 'multiply' in globals():
    res = multiply(A, B)

print(json.dumps(res))
`;
  }

  fs.writeFileSync(pyPath, testWrapper);

  return new Promise((resolve) => {
    const pyProcess = spawn('python3', ['solution.py'], { cwd: tempDir });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      pyProcess.kill();
    }, 5000);

    pyProcess.stdout.on('data', (d) => { stdout += d.toString(); });
    pyProcess.stderr.on('data', (d) => { stderr += d.toString(); });

    pyProcess.on('close', (code) => {
      clearTimeout(timer);
      cleanup(tempDir);
      const executionTimeMs = Date.now() - startTime;

      if (timedOut) {
        return resolve({
          passed: false,
          actualOutput: '',
          error: 'Time Limit Exceeded (> 5000ms)',
          executionTimeMs
        });
      }

      if (code !== 0 && stderr) {
        return resolve({
          passed: false,
          actualOutput: '',
          error: `Syntax / Runtime Error: ${stderr.trim()}`,
          executionTimeMs
        });
      }

      const rawActual = stdout.trim();
      const normalizedActual = formatOutputString(rawActual);
      const normalizedExpected = formatOutputString(testCase.expectedOutput);
      const passed = normalizedActual === normalizedExpected;

      resolve({
        passed,
        actualOutput: normalizedActual,
        error: passed ? undefined : `Mismatch! Expected '${normalizedExpected}', got '${normalizedActual}'`,
        executionTimeMs
      });
    });
  });
}

// Real javac + java runner
async function runRealJavaProcess(problemId: string, candidateCode: string, testCase: BackendTestCase): Promise<{
  passed: boolean;
  actualOutput: string;
  error?: string;
  executionTimeMs: number;
}> {
  const startTime = Date.now();
  const runId = Math.random().toString(36).substring(2, 9);
  const tempDir = path.join('/tmp', `daa_${runId}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const solutionPath = path.join(tempDir, 'Solution.java');
  const mainPath = path.join(tempDir, 'Main.java');

  fs.writeFileSync(solutionPath, candidateCode);

  let wrapperCode = '';
  if (problemId === 'merge-sorted-array') {
    const { nums1, m, nums2, n } = parseMsaInput(testCase.input);
    wrapperCode = `
import java.util.Arrays;
public class Main {
    public static void main(String[] args) {
        int[] nums1 = new int[]${JSON.stringify(nums1).replace(/\[/g, '{').replace(/\]/g, '}')};
        int m = ${m};
        int[] nums2 = new int[]${JSON.stringify(nums2).replace(/\[/g, '{').replace(/\]/g, '}')};
        int n = ${n};
        Solution.merge(nums1, m, nums2, n);
        System.out.println(Arrays.toString(nums1));
    }
}`;
  } else if (problemId === 'binary-search') {
    const { arr, target } = parseBsInput(testCase.input);
    wrapperCode = `
public class Main {
    public static void main(String[] args) {
        int[] arr = new int[]${JSON.stringify(arr).replace(/\[/g, '{').replace(/\]/g, '}')};
        int target = ${target};
        int res = Solution.binarySearch(arr, target);
        System.out.println(res);
    }
}`;
  } else if (problemId === 'matrix-multiplication') {
    const { A, B } = parseMmInput(testCase.input);
    wrapperCode = `
import java.util.Arrays;
public class Main {
    public static void main(String[] args) {
        int[][] A = new int[][]${JSON.stringify(A).replace(/\[/g, '{').replace(/\]/g, '}')};
        int[][] B = new int[][]${JSON.stringify(B).replace(/\[/g, '{').replace(/\]/g, '}')};
        int[][] res = Solution.multiply(A, B);
        System.out.println(Arrays.deepToString(res));
    }
}`;
  }

  fs.writeFileSync(mainPath, wrapperCode);

  // Compile
  const compileError = await new Promise<string | null>((resolve) => {
    const javac = spawn('javac', ['Solution.java', 'Main.java'], { cwd: tempDir });
    let stderr = '';
    javac.stderr.on('data', (d) => { stderr += d.toString(); });
    javac.on('close', (code) => {
      if (code === 0) resolve(null);
      else resolve(stderr || 'Compilation error');
    });
  });

  if (compileError) {
    cleanup(tempDir);
    return {
      passed: false,
      actualOutput: '',
      error: `Compilation Error: ${compileError}`,
      executionTimeMs: Date.now() - startTime
    };
  }

  // Run java
  return new Promise((resolve) => {
    const java = spawn('java', ['-cp', '.', 'Main'], { cwd: tempDir });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      java.kill();
    }, 5000);

    java.stdout.on('data', (d) => { stdout += d.toString(); });
    java.stderr.on('data', (d) => { stderr += d.toString(); });

    java.on('close', (code) => {
      clearTimeout(timer);
      cleanup(tempDir);
      const executionTimeMs = Date.now() - startTime;

      if (timedOut) {
        return resolve({
          passed: false,
          actualOutput: '',
          error: 'Time Limit Exceeded (5000ms)',
          executionTimeMs
        });
      }

      if (code !== 0) {
        return resolve({
          passed: false,
          actualOutput: '',
          error: `Runtime Error: ${stderr.trim() || 'Process exited with non-zero code'}`,
          executionTimeMs
        });
      }

      const actualTrimmed = formatOutputString(stdout.trim());
      const expectedTrimmed = formatOutputString(testCase.expectedOutput);
      const passed = (actualTrimmed === expectedTrimmed);

      resolve({
        passed,
        actualOutput: actualTrimmed,
        executionTimeMs
      });
    });
  });
}

function cleanup(dir: string) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

// Input Parsers
function parseMsaInput(inputStr: string) {
  // e.g. "nums1=[1,2,3,0,0,0], m=3, nums2=[2,5,6], n=3"
  const nums1Match = inputStr.match(/nums1=\[([\d\s,-]*)\]/);
  const mMatch = inputStr.match(/m=(\d+)/);
  const nums2Match = inputStr.match(/nums2=\[([\d\s,-]*)\]/);
  const nMatch = inputStr.match(/n=(\d+)/);

  const nums1 = nums1Match && nums1Match[1].trim() ? nums1Match[1].split(',').map(x => parseInt(x.trim())) : [];
  const m = mMatch ? parseInt(mMatch[1]) : 0;
  const nums2 = nums2Match && nums2Match[1].trim() ? nums2Match[1].split(',').map(x => parseInt(x.trim())) : [];
  const n = nMatch ? parseInt(nMatch[1]) : 0;

  return { nums1, m, nums2, n };
}

function parseBsInput(inputStr: string) {
  // e.g. "arr=[1,3,5,7,9,11], target=7"
  const arrMatch = inputStr.match(/arr=\[([\d\s,-]*)\]/);
  const targetMatch = inputStr.match(/target=([\d-]+)/);

  const arr = arrMatch && arrMatch[1].trim() ? arrMatch[1].split(',').map(x => parseInt(x.trim())) : [];
  const target = targetMatch ? parseInt(targetMatch[1]) : 0;

  return { arr, target };
}

function parseMmInput(inputStr: string) {
  // e.g. "A=[[1,2],[3,4]], B=[[5,6],[7,8]]"
  const aMatch = inputStr.match(/A=\[(\[[\d\s,-]+\](?:,\s*\[[\d\s,-]+\])*)\]/);
  const bMatch = inputStr.match(/B=\[(\[[\d\s,-]+\](?:,\s*\[[\d\s,-]+\])*)\]/);

  const parse2D = (str: string | null) => {
    if (!str) return [];
    return JSON.parse(`[${str}]`);
  };

  const A = parse2D(aMatch ? aMatch[1] : '[]');
  const B = parse2D(bMatch ? bMatch[1] : '[]');

  return { A, B };
}

function formatOutputString(out: string): string {
  // Normalizes formatting e.g. [1, 2, 2, 3, 5, 6] or [[19, 22], [43, 50]]
  let s = out.replace(/\s+/g, ' ').trim();
  // Ensure single space after commas
  s = s.replace(/,\s*/g, ', ');
  return s;
}

// VM Engine for Java, C, and C++ execution
function runVMEngine(
  problemId: string,
  language: string,
  candidateCode: string,
  testCase: BackendTestCase,
  startTime: number
): { passed: boolean; actualOutput: string; error?: string; executionTimeMs: number } {
  let jsBody = candidateCode;

  if (language === 'java') {
    if (!candidateCode.includes('class Solution') && !candidateCode.includes('merge') && !candidateCode.includes('binarySearch') && !candidateCode.includes('multiply')) {
      return {
        passed: false,
        actualOutput: '',
        error: 'Compilation Error: Missing "public class Solution" or method definition',
        executionTimeMs: Date.now() - startTime
      };
    }
    // Clean Java type signatures
    jsBody = jsBody.replace(/public\s+class\s+Solution\s*\{/, '');
    jsBody = jsBody.replace(/public\s+static\s+(void|int|int\[\]|int\[\]\[\])\s+(\w+)\s*\(([^)]*)\)\s*\{/g, function(_, retType, methodName, params) {
      return `function ${methodName}(${params.replace(/(int|boolean|double|float|long|String|int\[\]|int\[\]\[\])\s+/g, '')}) {`;
    });
    jsBody = jsBody.replace(/int\[\]\s+(\w+)\s*=\s*new\s+int\[([^\]]+)\]/g, '$1 = new Array($2).fill(0)');
    jsBody = jsBody.replace(/int\[\]\[\]\s+(\w+)\s*=\s*new\s+int\[([^\]]+)\]\[([^\]]+)\]/g, '$1 = Array.from({length: $2}, () => new Array($3).fill(0))');
    jsBody = jsBody.replace(/int\s+/g, 'let ');
    jsBody = jsBody.replace(/boolean\s+/g, 'let ');
    jsBody = jsBody.replace(/double\s+/g, 'let ');
    jsBody = jsBody.replace(/System\.out\.println\(/g, 'console.log(');

    if (candidateCode.includes('class Solution')) {
      const lastBracket = jsBody.lastIndexOf('}');
      if (lastBracket !== -1) {
        jsBody = jsBody.substring(0, lastBracket) + jsBody.substring(lastBracket + 1);
      }
    }
  } else if (language === 'c' || language === 'cpp') {
    // Strip headers & class wrappers
    jsBody = jsBody.replace(/#include\s*<[^>]+>/g, '');
    jsBody = jsBody.replace(/using\s+namespace\s+std\s*;/g, '');
    jsBody = jsBody.replace(/class\s+Solution\s*\{/, '');
    jsBody = jsBody.replace(/public:/g, '');
    jsBody = jsBody.replace(/private:/g, '');

    // Transform C / C++ method signatures to JS functions
    jsBody = jsBody.replace(/(void|int|int\*\*|vector<int>|vector<vector<int>>)\s+(\w+)\s*\(([^)]*)\)\s*\{/g, function(_, retType, methodName, params) {
      const cleanParams = params
        .replace(/(const\s+)?(vector<vector<int>>&?|vector<int>&?|int\*\*|int\*|int|double|float|bool|size_t|\*)\s*/g, '')
        .replace(/&/g, '');
      return `function ${methodName}(${cleanParams}) {`;
    });

    // C/C++ vector methods & allocations
    jsBody = jsBody.replace(/\.size\(\)/g, '.length');
    jsBody = jsBody.replace(/\.push_back\(/g, '.push(');
    jsBody = jsBody.replace(/vector<vector<int>>\s+(\w+)\s*\(([^,]+),\s*vector<int>\(([^,]+),\s*([^)]+)\)\);?/g, 'let $1 = Array.from({length: $2}, () => new Array($3).fill($4));');
    jsBody = jsBody.replace(/vector<int>\s+(\w+)\s*\(([^,]+),\s*([^)]+)\);?/g, 'let $1 = new Array($2).fill($3);');
    jsBody = jsBody.replace(/vector<int>\s+(\w+)\s*\(([^)]+)\);?/g, 'let $1 = new Array($2).fill(0);');
    jsBody = jsBody.replace(/vector<int>\s+(\w+);/g, 'let $1 = [];');
    jsBody = jsBody.replace(/vector<vector<int>>\s+(\w+);/g, 'let $1 = [];');
    jsBody = jsBody.replace(/int\s+/g, 'let ');
    jsBody = jsBody.replace(/double\s+/g, 'let ');
    jsBody = jsBody.replace(/bool\s+/g, 'let ');
    jsBody = jsBody.replace(/size_t\s+/g, 'let ');
    jsBody = jsBody.replace(/std::max/g, 'Math.max');
    jsBody = jsBody.replace(/std::min/g, 'Math.min');
    jsBody = jsBody.replace(/std::abs/g, 'Math.abs');
    jsBody = jsBody.replace(/printf\(/g, 'console.log(');

    if (candidateCode.includes('class Solution')) {
      const lastBracket = jsBody.lastIndexOf('}');
      if (lastBracket !== -1) {
        jsBody = jsBody.substring(0, lastBracket) + jsBody.substring(lastBracket + 1);
      }
    }
  }

  // Common JS helpers & replacements
  jsBody = jsBody.replace(/Math\.max/g, 'Math.max');
  jsBody = jsBody.replace(/Math\.min/g, 'Math.min');
  jsBody = jsBody.replace(/Math\.abs/g, 'Math.abs');

  let testSetup = '';
  if (problemId === 'merge-sorted-array') {
    const { nums1, m, nums2, n } = parseMsaInput(testCase.input);
    testSetup = `
      let nums1 = ${JSON.stringify(nums1)};
      let m = ${m};
      let nums2 = ${JSON.stringify(nums2)};
      let n = ${n};
      if (typeof merge === 'function') {
        if (merge.length >= 6) {
          merge(nums1, nums1.length, m, nums2, nums2.length, n);
        } else {
          merge(nums1, m, nums2, n);
        }
      } else {
        throw new Error("Function 'merge' is not defined.");
      }
      return JSON.stringify(nums1);
    `;
  } else if (problemId === 'binary-search') {
    const { arr, target } = parseBsInput(testCase.input);
    testSetup = `
      let arr = ${JSON.stringify(arr)};
      let target = ${target};
      let res = -1;
      if (typeof binarySearch === 'function') {
        if (binarySearch.length >= 3) {
          res = binarySearch(arr, arr.length, target);
        } else {
          res = binarySearch(arr, target);
        }
      } else {
        throw new Error("Function 'binarySearch' is not defined.");
      }
      return String(res);
    `;
  } else if (problemId === 'matrix-multiplication') {
    const { A, B } = parseMmInput(testCase.input);
    testSetup = `
      let A = ${JSON.stringify(A)};
      let B = ${JSON.stringify(B)};
      let res = [];
      if (typeof multiply === 'function') {
        if (multiply.length >= 6) {
          let rR = [0], rC = [0];
          res = multiply(A, A.length, A[0] ? A[0].length : 0, B, B.length, B[0] ? B[0].length : 0, rR, rC);
        } else {
          res = multiply(A, B);
        }
      } else {
        throw new Error("Function 'multiply' is not defined.");
      }
      return JSON.stringify(res);
    `;
  }

  const fullScript = `
    (function() {
      ${jsBody}
      ${testSetup}
    })()
  `;

  try {
    const sandbox = {
      console: { log: () => {} },
      Math,
      Array,
      String,
      Number,
      JSON
    };
    vm.createContext(sandbox);

    const resultStr = vm.runInContext(fullScript, sandbox, { timeout: 5000 });
    const actualTrimmed = formatOutputString(String(resultStr));
    const expectedTrimmed = formatOutputString(testCase.expectedOutput);
    const passed = (actualTrimmed === expectedTrimmed);

    return {
      passed,
      actualOutput: actualTrimmed,
      executionTimeMs: Date.now() - startTime
    };
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    if (errMsg.includes('Script execution timed out')) {
      return {
        passed: false,
        actualOutput: '',
        error: 'Time Limit Exceeded (5000ms)',
        executionTimeMs: Date.now() - startTime
      };
    }
    if (errMsg.includes('is not defined') || errMsg.includes('Unexpected token') || errMsg.includes('SyntaxError')) {
      return {
        passed: false,
        actualOutput: '',
        error: `Compilation Error: ${errMsg}`,
        executionTimeMs: Date.now() - startTime
      };
    }
    return {
      passed: false,
      actualOutput: '',
      error: `Runtime Error: ${errMsg}`,
      executionTimeMs: Date.now() - startTime
    };
  }
}

// API Routes

// 1. Run / Submit test cases for a single problem
app.post('/api/run', async (req, res) => {
  try {
    const { problemId, code, language, isSubmit } = req.body;
    const problem = BACKEND_PROBLEMS[problemId];

    if (!problem) {
      return res.status(400).json({ message: 'Invalid problemId' });
    }

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Code is required' });
    }

    const testCasesToRun = isSubmit
      ? [...problem.visibleTestCases, ...problem.hiddenTestCases]
      : problem.visibleTestCases;

    const testResults = [];
    let passedCount = 0;
    let compiled = true;
    let firstCompilationError = '';

    for (const tc of testCasesToRun) {
      const exec = await executeCodeTestCase(problemId, language || 'java', code, tc);

      if (exec.error && exec.error.startsWith('Compilation Error')) {
        compiled = false;
        firstCompilationError = exec.error;
      }

      if (exec.passed) {
        passedCount++;
      }

      testResults.push({
        testCaseId: tc.id,
        passed: exec.passed,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: exec.actualOutput,
        error: exec.error,
        isHidden: tc.isHidden,
        executionTimeMs: exec.executionTimeMs
      });
    }

    const totalCount = testCasesToRun.length;
    // Calculate marks proportional to passed test cases
    const totalProblemCases = problem.visibleTestCases.length + problem.hiddenTestCases.length;
    const allPassedRatio = isSubmit ? (passedCount / totalProblemCases) : (passedCount / problem.visibleTestCases.length);
    const earnedMarks = Math.round(allPassedRatio * problem.marks);

    res.json({
      problemId,
      language: language || 'java',
      compiled,
      compilationError: firstCompilationError,
      testResults,
      passedCount,
      totalCount,
      earnedMarks
    });
  } catch (err: any) {
    console.error('API /api/run error:', err);
    res.status(500).json({ message: err?.message || 'Server error during execution' });
  }
});

// 2. Submit entire assessment
app.post('/api/submit', async (req, res) => {
  try {
    const { sessionId, rollNo, name, codePerProblem, languages, violations, timeTaken } = req.body;

    if (!rollNo || !name || !codePerProblem) {
      return res.status(400).json({ message: 'Roll No, Name, and code are required' });
    }

    // Server-side recalculation of ALL 3 problem test cases
    const testBreakdown: Record<string, any> = {};
    let mergeSortMarks = 0;
    let binarySearchMarks = 0;
    let matrixMultMarks = 0;

    for (const problemId of ['merge-sorted-array', 'binary-search', 'matrix-multiplication']) {
      const problem = BACKEND_PROBLEMS[problemId];
      const code = codePerProblem[problemId] || '';
      const lang = languages?.[problemId as 'merge-sorted-array' | 'binary-search' | 'matrix-multiplication'] || 'java';
      const allCases = [...problem.visibleTestCases, ...problem.hiddenTestCases];

      let passedCount = 0;
      let compiled = true;
      let compilationError = '';
      const testResults = [];

      for (const tc of allCases) {
        const exec = await executeCodeTestCase(problemId, lang, code, tc);
        if (exec.error && exec.error.startsWith('Compilation Error')) {
          compiled = false;
          compilationError = exec.error;
        }
        if (exec.passed) passedCount++;

        testResults.push({
          testCaseId: tc.id,
          passed: exec.passed,
          input: tc.input,
          expectedOutput: tc.expectedOutput,
          actualOutput: exec.actualOutput,
          error: exec.error,
          isHidden: tc.isHidden,
          executionTimeMs: exec.executionTimeMs
        });
      }

      const totalCases = allCases.length;
      const marksEarned = Math.round((passedCount / totalCases) * problem.marks);

      if (problemId === 'merge-sorted-array') mergeSortMarks = marksEarned;
      else if (problemId === 'binary-search') binarySearchMarks = marksEarned;
      else if (problemId === 'matrix-multiplication') matrixMultMarks = marksEarned;

      testBreakdown[problemId] = {
        problemId,
        language: lang,
        compiled,
        compilationError,
        testResults,
        passedCount,
        totalCount: totalCases,
        earnedMarks: marksEarned
      };
    }

    const totalScore = mergeSortMarks + binarySearchMarks + matrixMultMarks;
    const submittedAt = new Date().toISOString();

    const record = {
      id: Math.random().toString(36).substring(2, 11),
      sessionId: sessionId || Math.random().toString(36).substring(2, 11),
      rollNo,
      name,
      mergeSortMarks,
      binarySearchMarks,
      matrixMultMarks,
      totalScore,
      timeTaken: timeTaken || '60:00',
      violations: violations || 0,
      submittedAt,
      code: codePerProblem,
      testBreakdown
    };

    // Save to submissions database
    const submissions = loadData<any[]>(SUBMISSIONS_FILE, []);
    // Remove previous submission from same rollNo if exists to prevent duplicates
    const filtered = submissions.filter((s) => s.rollNo !== rollNo);
    filtered.push(record);
    saveData(SUBMISSIONS_FILE, filtered);

    // Sync to Supabase in background (lazy & non-blocking)
    saveSubmissionToSupabase(record).catch((err) => {
      console.warn('Background Supabase submission sync warning:', err);
    });

    res.json(record);
  } catch (err: any) {
    console.error('API /api/submit error:', err);
    res.status(500).json({ message: err?.message || 'Server error during submission' });
  }
});

// Supabase DB Connectivity APIs
app.get('/api/supabase/status', async (req, res) => {
  try {
    const creds = getSupabaseCredentials();
    const status = await testSupabaseConnection();
    res.json({
      configured: Boolean(creds.url && creds.key),
      url: creds.url ? `${creds.url.substring(0, 18)}...` : '',
      fullUrl: creds.url,
      connected: status.connected,
      tableExists: status.tableExists,
      message: status.message,
    });
  } catch (err: any) {
    res.status(500).json({ configured: false, connected: false, message: err?.message || 'Error checking Supabase status' });
  }
});

app.post('/api/supabase/config', async (req, res) => {
  try {
    const { url, key } = req.body;
    if (!url || !key) {
      return res.status(400).json({ message: 'Both Supabase URL and Key are required.' });
    }
    saveSupabaseCredentials({ url: url.trim(), key: key.trim() });
    const status = await testSupabaseConnection();
    res.json({
      success: status.connected,
      message: status.message,
      tableExists: status.tableExists,
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message || 'Failed to save configuration' });
  }
});

app.post('/api/supabase/sync', async (req, res) => {
  try {
    const submissions = loadData<any[]>(SUBMISSIONS_FILE, []);
    const result = await syncLocalSubmissionsToSupabase(submissions);
    res.json({
      success: true,
      syncedCount: result.synced,
      failedCount: result.failed,
      totalCount: submissions.length,
    });
  } catch (e: any) {
    res.status(500).json({ success: false, message: e?.message || 'Sync failed' });
  }
});

app.get('/api/supabase/schema', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(getSupabaseSQLSchema());
});

app.get('/api/supabase/submissions', async (req, res) => {
  try {
    const data = await fetchSubmissionsFromSupabase();
    if (data === null) {
      return res.status(400).json({ message: 'Supabase DB not configured or unreachable. Falling back to local data.' });
    }
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ message: e?.message || 'Error fetching Supabase submissions' });
  }
});


// 3. Auto-sync session state
app.post('/api/session/sync', (req, res) => {
  try {
    const { session } = req.body;
    if (session && session.sessionId) {
      const sessions = loadData<Record<string, any>>(SESSIONS_FILE, {});
      sessions[session.sessionId] = session;
      saveData(SESSIONS_FILE, sessions);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// 4. Admin Login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const cleanPass = (password || '').trim().toLowerCase();
  const validPasskeys = ['250806', 'admin', 'daa2026', 'admin123', 'daa_admin'];

  if (validPasskeys.includes(cleanPass)) {
    res.json({ token: 'daa_admin_secret_token_250806' });
  } else {
    res.status(401).json({ message: 'Incorrect admin passkey. Default passkey: 250806 or admin' });
  }
});

// 5. Admin Results
app.get('/api/admin/results', (req, res) => {
  const { token } = req.query;
  if (token !== 'daa_admin_secret_token_250806') {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  const submissions = loadData<any[]>(SUBMISSIONS_FILE, []);
  res.json(submissions);
});

// 6. Admin Export CSV
app.get('/api/admin/export-csv', (req, res) => {
  const { token } = req.query;
  if (token !== 'daa_admin_secret_token_250806') {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  const submissions = loadData<any[]>(SUBMISSIONS_FILE, []);

  let csv = 'Roll No,Student Name,Total Score (/50),Merge Sorted Array (/15),Binary Search (/15),Matrix Multiplication (/20),Time Taken,Violations,Submitted At\n';

  for (const s of submissions) {
    csv += `"${s.rollNo}","${s.name}",${s.totalScore},${s.mergeSortMarks},${s.binarySearchMarks},${s.matrixMultMarks},"${s.timeTaken}",${s.violations},"${s.submittedAt}"\n`;
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="DAA_Assessment_Results.csv"');
  res.send(csv);
});

// Start Server with Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DAA Assessment server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
