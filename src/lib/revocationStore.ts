import fs from 'fs';
import path from 'path';
import os from 'os';

// Use OS temp dir to guarantee write access across different environments
const storePath = path.join(os.tmpdir(), 'vehicle_revoked_links.json');

export function getRevokedLinks(): string[] {
    try {
        if (!fs.existsSync(storePath)) {
            return [];
        }
        const data = fs.readFileSync(storePath, 'utf8');
        return JSON.parse(data);
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
