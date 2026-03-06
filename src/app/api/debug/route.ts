import { NextResponse } from "next/server";
import { getRevokedLinks } from "@/lib/revocationStore";
import os from 'os';
import path from 'path';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET() {
    const storePath = path.join(os.tmpdir(), 'vehicle_revoked_links.json');
    const links = await getRevokedLinks();

    return NextResponse.json({
        storePath,
        linksCount: links.length,
        links,
    });
}
