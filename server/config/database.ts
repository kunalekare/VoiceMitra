import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'skillbridge.sqlite');

let dbInstance: Database | null = null;
let saveDebounceTimer: NodeJS.Timeout | null = null;

// Debounced save to disk to optimize write throughput while ensuring durability
export function saveDatabaseToDisk(): void {
  if (!dbInstance) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const data = dbInstance.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

export function queueDatabaseSave(): void {
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    saveDatabaseToDisk();
  }, 100);
}

export async function getDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    dbInstance = new SQL.Database(fileBuffer);
  } else {
    dbInstance = new SQL.Database();
  }

  // Enable foreign keys
  dbInstance.run('PRAGMA foreign_keys = ON;');

  return dbInstance;
}

// Database helper functions for standardized query execution
export const db = {
  run: (sql: string, params: unknown[] = []): void => {
    if (!dbInstance) throw new Error('Database not initialized');
    dbInstance.run(sql, params as (number | string | null | Uint8Array)[]);
    queueDatabaseSave();
  },

  query: <T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] => {
    if (!dbInstance) throw new Error('Database not initialized');
    const stmt = dbInstance.prepare(sql);
    stmt.bind(params as (number | string | null | Uint8Array)[]);
    const results: T[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject() as unknown as T);
    }
    stmt.free();
    return results;
  },

  queryOne: <T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | null => {
    const rows = db.query<T>(sql, params);
    return rows.length > 0 ? rows[0] : null;
  },

  transaction: <T>(callback: () => T): T => {
    if (!dbInstance) throw new Error('Database not initialized');
    dbInstance.run('BEGIN TRANSACTION;');
    try {
      const result = callback();
      dbInstance.run('COMMIT;');
      queueDatabaseSave();
      return result;
    } catch (err) {
      dbInstance.run('ROLLBACK;');
      throw err;
    }
  }
};
