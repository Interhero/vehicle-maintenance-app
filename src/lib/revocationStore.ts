import fs from 'fs';
import path from 'path';
import os from 'os';
import { unstable_noStore as noStore } from 'next/cache';
import { kv } from '@vercel/kv';

const storePath = path.join(os.tmpdir(), 'vehicle_revoked_links.json');

export async function getRevokedLinks(): Promise<string[]> {
    noStore();

    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        try {
            const data = await kv.get<string[]>('revoked_links');
            return data || [];
        } catch (e) {
            console.error("Failed to read from Vercel KV:", e);
            return [];
        }
    }

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

export async function revokeLinkInstant(shareId: string) {
    try {
        const revoked = await getRevokedLinks();
        if (!revoked.includes(shareId)) {
            revoked.push(shareId);

            if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
                await kv.set('revoked_links', revoked);
            } else {
                fs.writeFileSync(storePath, JSON.stringify(revoked), 'utf8');
            }
        }
    } catch (e) {
        console.error("Failed to write to revocation store:", e);
    }
}
