import { NextResponse } from "next/server";
import { getRevokedLinks } from "@/lib/revocationStore";
import { kv } from "@vercel/kv";
import os from 'os';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
    const storePath = path.join(os.tmpdir(), 'vehicle_revoked_links.json');
    let kvStatus = "Disabled or Missing Env Vars";
    let kvLinks: string[] = [];

    const hasKvUrl = !!process.env.KV_REST_API_URL;
    const hasKvToken = !!process.env.KV_REST_API_TOKEN;

    if (hasKvUrl && hasKvToken) {
        try {
            const data = await kv.get<string[]>('revoked_links');
            kvLinks = data || [];
            kvStatus = "Connected";
        } catch (e: any) {
            kvStatus = `Error: ${e.message}`;
        }
    }

    const fileLinks = await getRevokedLinks();

    return NextResponse.json({
        environment: process.env.VERCEL ? 'Vercel' : 'Local',
        localStore: {
            path: storePath,
            linksCount: fileLinks.length,
            links: fileLinks,
        },
        vercelKV: {
            status: kvStatus,
            hasKvUrl,
            hasKvToken,
            linksCount: kvLinks.length,
            links: kvLinks
        }
    });
}
