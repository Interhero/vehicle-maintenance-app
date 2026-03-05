import fs from 'fs';
import path from 'path';

// Use a file inside the Next.js process-accessible directory or /tmp
const storePath = path.join(process.cwd(), 'revoked_links.json');

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
