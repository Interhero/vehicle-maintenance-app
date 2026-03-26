import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { saveSubscription, removeSubscription } from "@/lib/pushStore";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { action, subscription } = body;

        if (action === "subscribe" && subscription) {
            await saveSubscription(session.user.email, subscription);
            return NextResponse.json({ success: true, message: "Push subscription saved securely" });
        } else if (action === "unsubscribe" && subscription?.endpoint) {
            await removeSubscription(session.user.email, subscription.endpoint);
            return NextResponse.json({ success: true, message: "Push subscription purged" });
        }

        return NextResponse.json({ error: "Invalid payload architecture" }, { status: 400 });
    } catch (error) {
        console.error("Critical Subscription Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
