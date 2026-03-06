import { NextResponse } from "next/server";
import { createShareToken } from "@/lib/shareUtils";
import { getServerSession } from "next-auth/next";
import { saveSharedLink, resolveSpreadsheetId, getOrProvisionPublicBlocklist } from "@/lib/googleSheets";
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
        const spreadsheetId = await resolveSpreadsheetId((session as any).accessToken);
        const blocklistId = await getOrProvisionPublicBlocklist((session as any).accessToken);

        // Timestamps for storage
        const now = Date.now();
        let expiresAtTimestamp: number | string = "Never";
        let jwtExpiry: string | number | undefined = undefined;

        if (expiresIn === "1h") {
            expiresAtTimestamp = now + 3600000;
            jwtExpiry = "1h";
        } else if (expiresIn === "1d") {
            expiresAtTimestamp = now + 86400000;
            jwtExpiry = "1d";
        } else if (expiresIn === "7d") {
            expiresAtTimestamp = now + 604800000;
            jwtExpiry = "7d";
        }

        // Include shareId, spreadsheetId, AND blocklistId in the token payload
        const token = await createShareToken({ ...record, shareId, spreadsheetId, blocklistId }, jwtExpiry);

        await saveSharedLink((session as any).accessToken, [
            shareId,
            record.vehicle || "Unknown",
            record.serviceType || "Unknown",
            now,
            expiresAtTimestamp,
            "Active"
        ]);

        return NextResponse.json({ token, shareId, expiresAt: expiresAtTimestamp });
    } catch (error: any) {
        console.error("Token generation failed:", error.message);
        return NextResponse.json(
            { error: "Failed to generate share link" },
            { status: 500 }
        );
    }
}
