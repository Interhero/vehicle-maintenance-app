import { kv } from "@vercel/kv";

export async function saveSubscription(email: string, subscription: any) {
    if (!email) throw new Error("Email required");
    const key = `push_subs:${email}`;
    const existing = await kv.get<any[]>(key) || [];

    // Check if subscription already exists for this device
    const exists = existing.find(sub => sub.endpoint === subscription.endpoint);
    if (!exists) {
        existing.push(subscription);
        await kv.set(key, existing);
    }
}

export async function getSubscriptions(email: string) {
    if (!email) return [];
    const key = `push_subs:${email}`;
    return await kv.get<any[]>(key) || [];
}

export async function removeSubscription(email: string, endpoint: string) {
    if (!email) return;
    const key = `push_subs:${email}`;
    let existing = await kv.get<any[]>(key) || [];
    existing = existing.filter(sub => sub.endpoint !== endpoint);
    await kv.set(key, existing);
}
