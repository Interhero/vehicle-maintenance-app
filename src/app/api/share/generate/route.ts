import { NextResponse } from "next/server";
import { createShareToken } from "@/lib/shareUtils";
import { getServerSession } from "next-auth/next";
import { saveSharedLink } from "@/lib/googleSheets";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !(session as any).accessToken) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { record, expiresIn } = await request.json();
        if (!record) {
            return NextResponse.json({ error: "Record data is required" }, { status: 400 });
        }

        // Generate a unique ID for this share
        const shareId = "sh_" + Math.random().toString(36).substring(2, 10);

        // Include shareId in the token payload
        const token = await createShareToken({ ...record, shareId }, expiresIn);

        // Persist to Google Sheets
        const createdAt = new Date().toLocaleString("en-GB");
        let expiresAtLabel = "Never";
        if (expiresIn === "1h") expiresAtLabel = new Date(Date.now() + 3600000).toLocaleString("en-GB");
        else if (expiresIn === "1d") expiresAtLabel = new Date(Date.now() + 86400000).toLocaleString("en-GB");
        else if (expiresIn === "7d") expiresAtLabel = new Date(Date.now() + 604800000).toLocaleString("en-GB");

        await saveSharedLink((session as any).accessToken, [
            shareId,
            record.vehicle || "Unknown",
            record.serviceType || "Unknown",
            createdAt,
            expiresAtLabel,
            "Active"
        ]);

        return NextResponse.json({ token, shareId, expiresAt: expiresAtLabel });
    } catch (error: any) {
        console.error("Token generation failed:", error.message);
        return NextResponse.json(
            { error: "Failed to generate share link" },
            { status: 500 }
        );
    }
}
