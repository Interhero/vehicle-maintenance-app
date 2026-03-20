import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Force dynamic so it doesn't cache the old build ID response across re-deployments
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');
        const buildId = fs.readFileSync(buildIdPath, 'utf8');
        return NextResponse.json({ version: buildId.trim() });
    } catch (e) {
        // Fallback if BUILD_ID is unreadable or not generated yet
        return NextResponse.json({ version: 'unknown' });
    }
}
