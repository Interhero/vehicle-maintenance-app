import fs from 'fs';
import path from 'path';
import os from 'os';
import { unstable_noStore as noStore } from 'next/cache';

// Using the OS tmp directory guarantees uniform physical write locations across all API and Page render processes
// regardless of how Turbopack defines `process.cwd()`.
const storePath = path.join(os.tmpdir(), 'vehicle_revoked_links.json');

export function getRevokedLinks(): string[] {
    // CRITICAL: Next.js aggressively memoizes function calls and `fs.readFileSync` inside Server Components.
    // Calling `noStore()` explicitly opts this function out of ANY rendering cache, forcing a synchronous disk read.
    noStore();
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
