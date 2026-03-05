import fs from 'fs';
import path from 'path';
import os from 'os';

// Use OS temp dir to guarantee write access across different environments
const storePath = path.join(os.tmpdir(), 'vehicle_revoked_links.json');

declare global {
    var revokedLinksCache: string[] | undefined;
}

export function getRevokedLinks(): string[] {
    try {
        if (!globalThis.revokedLinksCache) {
            if (fs.existsSync(storePath)) {
                const data = fs.readFileSync(storePath, 'utf8');
                globalThis.revokedLinksCache = JSON.parse(data);
            } else {
                globalThis.revokedLinksCache = [];
            }
        }
        return globalThis.revokedLinksCache || [];
    } catch (e) {
        console.error("Failed to read revocation store:", e);
        return globalThis.revokedLinksCache || [];
    }
}

export function revokeLinkInstant(shareId: string) {
    try {
        const revoked = getRevokedLinks();
        if (!revoked.includes(shareId)) {
            revoked.push(shareId);
            globalThis.revokedLinksCache = revoked;
            fs.writeFileSync(storePath, JSON.stringify(revoked), 'utf8');
        }
    } catch (e) {
        console.error("Failed to write to revocation store:", e);
    }
}
