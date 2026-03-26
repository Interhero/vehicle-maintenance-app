"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, "+")
        .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function PushSubscriber() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").then((reg) => {
                setRegistration(reg);
                reg.pushManager.getSubscription().then((sub) => {
                    if (sub) {
                        setIsSubscribed(true);
                        setSubscription(sub);
                    }
                    setLoading(false);
                });
            }).catch(e => {
                console.error("Service Worker registration failed", e);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, []);

    const subscribeButtonOnClick = async () => {
        if (!registration || !publicVapidKey) return;
        setLoading(true);
        try {
            // Trigger the native OS permission prompt!
            const sub = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
            });

            // Post the secure endpoint safely to the Vercel KV DB
            const res = await fetch("/api/webpush/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "subscribe", subscription: sub }),
            });

            if (res.ok) {
                setIsSubscribed(true);
                setSubscription(sub);
            }
        } catch (err) {
            console.error("User denied or PushManager failed", err);
        }
        setLoading(false);
    };

    const unsubscribeButtonOnClick = async () => {
        if (!subscription) return;
        setLoading(true);
        try {
            await subscription.unsubscribe();
            await fetch("/api/webpush/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "unsubscribe", subscription }),
            });
            setIsSubscribed(false);
            setSubscription(null);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    if (!publicVapidKey) return null;

    return (
        <button
            onClick={isSubscribed ? unsubscribeButtonOnClick : subscribeButtonOnClick}
            disabled={loading}
            title={isSubscribed ? "Disable Background Alerts" : "Enable Background Alerts"}
            className={`inline-flex items-center justify-center p-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all h-11 shadow-sm gap-2 ${isSubscribed
                    ? "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
                    : "bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:border-zinc-700 dark:text-zinc-400"
                }`}
        >
            {loading ? (
                <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" />
            ) : isSubscribed ? (
                <>
                    <Bell className="w-5 h-5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline font-medium text-sm">Alerts On</span>
                </>
            ) : (
                <>
                    <BellOff className="w-5 h-5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline font-medium text-sm">Alerts Off</span>
                </>
            )}
        </button>
    );
}
