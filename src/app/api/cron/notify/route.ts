import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import webpush from "web-push";

// Initialize web-push with VAPID keys from environment
const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const privateVapidKey = process.env.VAPID_PRIVATE_KEY!;

webpush.setVapidDetails(
    'mailto:ammarfaiz2011@hotmail.com',
    publicVapidKey,
    privateVapidKey
);

export async function GET(req: Request) {
    // 1. Verify Cron Security
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const results: any[] = [];

        // 2. Scan KV for all "push_expiries:*" keys
        // Note: In a massive app, we'd use a more scalable scan, but for this use-case, keys() is fine.
        const keys = await kv.keys("push_expiries:*");

        for (const key of keys) {
            const email = key.replace("push_expiries:", "");
            const vehicles = await kv.get<any[]>(key) || [];
            const subscriptions = await kv.get<any[]>(`push_subs:${email}`) || [];

            if (subscriptions.length === 0) continue;

            const alerts: string[] = [];
            vehicles.forEach(v => {
                const rDate = new Date(v.roadtaxExpiry);
                const iDate = new Date(v.insuranceExpiry);

                // Notify if < 14 days
                if (v.roadtaxExpiry && !isNaN(rDate.getTime())) {
                    const diff = (rDate.getTime() - now.getTime()) / 86400000;
                    if (diff >= 0 && diff <= 14) alerts.push(`${v.name} Roadtax expires in ${Math.ceil(diff)} days`);
                    else if (diff < 0 && diff > -3) alerts.push(`${v.name} Roadtax is OVERDUE!`);
                }

                if (v.insuranceExpiry && !isNaN(iDate.getTime())) {
                    const diff = (iDate.getTime() - now.getTime()) / 86400000;
                    if (diff >= 0 && diff <= 14) alerts.push(`${v.name} Insurance expires in ${Math.ceil(diff)} days`);
                    else if (diff < 0 && diff > -3) alerts.push(`${v.name} Insurance is OVERDUE!`);
                }
            });

            if (alerts.length > 0) {
                const payload = JSON.stringify({
                    title: "Vehicle Alert",
                    body: alerts.join("\n"),
                    url: "/"
                });

                // 3. Dispatch to all devices registered for this user
                for (const sub of subscriptions) {
                    try {
                        await webpush.sendNotification(sub, payload);
                        results.push({ email, status: "success" });
                    } catch (err: any) {
                        console.error(`Failed to push to ${email}:`, err);
                        // If the subscription is expired or invalid, we could remove it here
                        if (err.statusCode === 410 || err.statusCode === 404) {
                            // Optional: Auto-cleanup stale subscriptions
                        }
                        results.push({ email, status: "failed", error: err.message });
                    }
                }
            }
        }

        return NextResponse.json({ success: true, processed: results });
    } catch (error: any) {
        console.error("Cron notification failure:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
