import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { fetchSharedLinks, revokeSharedLink } from "@/lib/googleSheets";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revokeLinkInstant } from "@/lib/revocationStore";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session as any).accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const links = await fetchSharedLinks((session as any).accessToken);
        return NextResponse.json({ links });
    } catch (error: any) {
        console.error("Failed to fetch shared links:", error.message);
        return NextResponse.json({ error: "Failed to fetch links" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session as any).accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const shareId = searchParams.get("id");

        if (!shareId) {
            return NextResponse.json({ error: "Missing share ID" }, { status: 400 });
        }

        const success = await revokeSharedLink((session as any).accessToken, shareId);
        if (success) {
            revokeLinkInstant(shareId);
        }
        return NextResponse.json({ success });
    } catch (error: any) {
        console.error("Failed to revoke link:", error.message);
        return NextResponse.json({ error: "Failed to revoke link" }, { status: 500 });
    }
}
