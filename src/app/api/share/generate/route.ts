import { NextResponse } from "next/server";
import { createShareToken } from "@/lib/shareUtils";
import { getServerSession } from "next-auth/next";

export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { record, expiresIn } = await request.json();
        if (!record) {
            return NextResponse.json({ error: "Record data is required" }, { status: 400 });
        }

        const token = await createShareToken(record, expiresIn);
        return NextResponse.json({ token });
    } catch (error: any) {
        console.error("Token generation failed:", error.message);
        return NextResponse.json(
            { error: "Failed to generate share link" },
            { status: 500 }
        );
    }
}
