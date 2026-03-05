import fs from 'fs';
import path from 'path';
import os from 'os';

// Use a safe path for Next.js - `process.cwd()` is standard for local writes.
// On Vercel, `process.cwd()` is usually NOT writable, so we use `os.tmpdir()`.
// Since the environment is likely a local server for this user, .revoked.json in root is most reliable.
const isVercel = process.env.VERCEL === "1";
const storePath = isVercel
    ? path.join(os.tmpdir(), 'vehicle_revoked_links.json')
    : path.join(process.cwd(), '.revoked_links.json');

export function getRevokedLinks(): string[] {
    try {
        if (fs.existsSync(storePath)) {
            const data = fs.readFileSync(storePath, 'utf8');
            return JSON.parse(data);
        }
        return [];
    } catch (e) {
        console.error("Failed to read revocation store:", e);
        return [];
    }
}

export function revokeLinkInstant(shareId: string) {
    try {
        const revoked = getRevokedLinks();
        if (!revoked.includes(shareId)) {
            revoked.push(shareId);
            fs.writeFileSync(storePath, JSON.stringify(revoked), 'utf8');
        }
    } catch (e) {
        console.error("Failed to write to revocation store:", e);
    }
}
