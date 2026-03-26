import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { kv } from "@vercel/kv";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { vehicles } = body;

        if (!vehicles || !Array.isArray(vehicles)) {
            return NextResponse.json({ error: "Invalid payload architecture" }, { status: 400 });
        }

        const key = `push_expiries:${session.user.email}`;

        // Map down to just strings and dates to save KV space
        const cachedExpiries = vehicles.map(v => ({
            name: v.name,
            roadtaxExpiry: v.roadtaxExpiry,
            insuranceExpiry: v.insuranceExpiry
        }));

        await kv.set(key, cachedExpiries);

        return NextResponse.json({ success: true, message: "Vehicle expiries synced securely to Vercel KV for Cron Worker" });
    } catch (error) {
        console.error("Critical Sync Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
