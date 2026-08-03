import { createClient, SupabaseClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'data', 'supabase_config.json');

export interface SupabaseConfig {
  url: string;
  key: string;
}

// Load dynamic runtime config if set by user via UI or server env
export function getSupabaseCredentials(): SupabaseConfig {
  const envUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey) {
    return { url: envUrl.trim(), key: envKey.trim() };
  }

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed.url && parsed.key) {
        return { url: parsed.url.trim(), key: parsed.key.trim() };
      }
    }
  } catch (e) {
    console.error('Failed to read Supabase config file:', e);
  }

  return { url: '', key: '' };
}

export function saveSupabaseCredentials(config: SupabaseConfig): void {
  const dataDir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

let cachedClient: SupabaseClient | null = null;
let cachedKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const creds = getSupabaseCredentials();
  if (!creds.url || !creds.key) {
    return null;
  }

  const comboKey = `${creds.url}::${creds.key}`;
  if (cachedClient && cachedKey === comboKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(creds.url, creds.key, {
      auth: { persistSession: false },
    });
    cachedKey = comboKey;
    return cachedClient;
  } catch (e) {
    console.error('Error creating Supabase client:', e);
    return null;
  }
}

export function getSupabaseSQLSchema(): string {
  return `-- Copy and run this SQL query in your Supabase SQL Editor to create the DAA Assessment submissions table:

CREATE TABLE IF NOT EXISTS public.daa_submissions (
    id TEXT PRIMARY KEY,
    roll_no TEXT NOT NULL,
    name TEXT NOT NULL,
    total_score INT DEFAULT 0,
    merge_sort_marks INT DEFAULT 0,
    binary_search_marks INT DEFAULT 0,
    matrix_mult_marks INT DEFAULT 0,
    violations INT DEFAULT 0,
    time_taken TEXT,
    code_submission JSONB,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.daa_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts and selects
CREATE POLICY "Allow public read and insert" ON public.daa_submissions
    FOR ALL USING (true) WITH CHECK (true);
`;
}

export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string; tableExists: boolean }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      message: 'Supabase URL or Key not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables or configure via UI.',
      tableExists: false,
    };
  }

  try {
    const { data, error } = await client.from('daa_submissions').select('count', { count: 'exact', head: true });
    if (error) {
      if (error.code === '42P01') { // Table does not exist
        return {
          connected: true,
          message: 'Connected to Supabase! Table "daa_submissions" needs to be created.',
          tableExists: false,
        };
      }
      return {
        connected: false,
        message: `Supabase query error: ${error.message} (${error.code})`,
        tableExists: false,
      };
    }
    return {
      connected: true,
      message: `Successfully connected to Supabase database! Table "daa_submissions" exists (${data !== null ? 'ready' : 'active'}).`,
      tableExists: true,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Supabase connection failed: ${err?.message || 'Unknown network error'}`,
      tableExists: false,
    };
  }
}

export async function saveSubmissionToSupabase(record: any): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const payload = {
      id: record.id || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      roll_no: record.rollNo || '',
      name: record.name || '',
      total_score: record.totalScore || 0,
      merge_sort_marks: record.mergeSortMarks || 0,
      binary_search_marks: record.binarySearchMarks || 0,
      matrix_mult_marks: record.matrixMultMarks || 0,
      violations: record.violations || 0,
      time_taken: record.timeTaken || '',
      code_submission: record.code || record.codes || {},
      submitted_at: record.submittedAt || new Date().toISOString(),
    };

    const { error } = await client.from('daa_submissions').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error('Failed to save submission to Supabase:', error.message);
      return false;
    }
    console.log(`Successfully synced submission ${payload.id} (${payload.name}) to Supabase DB.`);
    return true;
  } catch (e) {
    console.error('Exception during Supabase submission sync:', e);
    return false;
  }
}

export async function fetchSubmissionsFromSupabase(): Promise<any[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('daa_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('Error fetching from Supabase:', error.message);
      return null;
    }

    return (data || []).map((row) => ({
      id: row.id,
      rollNo: row.roll_no,
      name: row.name,
      totalScore: row.total_score,
      mergeSortMarks: row.merge_sort_marks,
      binarySearchMarks: row.binary_search_marks,
      matrixMultMarks: row.matrix_mult_marks,
      violations: row.violations,
      timeTaken: row.time_taken,
      code: row.code_submission || {},
      codes: row.code_submission || {},
      submittedAt: row.submitted_at,
      syncedFromSupabase: true,
    }));
  } catch (e) {
    console.error('Exception fetching from Supabase:', e);
    return null;
  }
}

export async function syncLocalSubmissionsToSupabase(localSubmissions: any[]): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;

  for (const sub of localSubmissions) {
    const success = await saveSubmissionToSupabase(sub);
    if (success) synced++;
    else failed++;
  }

  return { synced, failed };
}
