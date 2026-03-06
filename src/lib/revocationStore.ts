import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';

// Use a safe path for Next.js - `process.cwd()` is standard for local writes.
// On Vercel, `process.cwd()` is usually NOT writable, so we use `os.tmpdir()`.
const isVercel = process.env.VERCEL === "1";
const dbPath = isVercel
    ? path.join(os.tmpdir(), 'vehicle_revoked_links.db')
    : path.join(process.cwd(), '.revoked_links.db');

// Initialize DB and ensure table exists
let db: Database.Database | null = null;

function getDb(): Database.Database {
    if (!db) {
        db = new Database(dbPath);
        db.pragma('journal_mode = WAL');
        db.exec(`
            CREATE TABLE IF NOT EXISTS revoked_links (
                shareId TEXT PRIMARY KEY,
                revokedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }
    return db;
}

export function getRevokedLinks(): string[] {
    try {
        const database = getDb();
        const rows = database.prepare('SELECT shareId FROM revoked_links').all() as { shareId: string }[];
        return rows.map(row => row.shareId);
    } catch (e) {
        console.error("Failed to read revocation store from SQLite:", e);
        return [];
    }
}

export function revokeLinkInstant(shareId: string) {
    try {
        const database = getDb();
        const stmt = database.prepare('INSERT OR IGNORE INTO revoked_links (shareId) VALUES (?)');
        stmt.run(shareId);
    } catch (e) {
        console.error("Failed to write to revocation store in SQLite:", e);
    }
}
