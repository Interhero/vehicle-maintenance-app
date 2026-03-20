"use client";

import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";

export function UpdateNotifier() {
    const [hasUpdate, setHasUpdate] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        let currentVersion: string | null = null;
        let isMounted = true;

        const checkVersion = async () => {
            if (!isMounted) return;
            try {
                const res = await fetch("/api/version", { cache: "no-store" });
                if (!res.ok) return;
                const data = await res.json();

                if (!currentVersion) {
                    currentVersion = data.version;
                } else if (currentVersion !== 'unknown' && data.version !== 'unknown' && currentVersion !== data.version) {
                    setHasUpdate(true);
                }
            } catch (e) {
                console.error("Failed to check app version", e);
            }
        };

        // Check once immediately, then every 5 minutes
        checkVersion();
        const interval = setInterval(checkVersion, 5 * 60 * 1000);

        // Also check when the user focuses the window (comes back from another tab)
        const onFocus = () => checkVersion();
        window.addEventListener('focus', onFocus);

        return () => {
            isMounted = false;
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
        };
    }, []);

    if (!hasUpdate || dismissed) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-8 fade-in duration-500 ease-out">
            <div className="bg-zinc-900 border border-zinc-700/50 shadow-2xl p-4 sm:p-5 rounded-2xl flex items-center gap-4 max-w-sm">
                <div className="bg-blue-500/10 p-2.5 rounded-full text-blue-400 ring-1 ring-blue-500/20">
                    <RefreshCw className="w-5 h-5 animate-[spin_3s_linear_infinite]" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-bold text-white tracking-tight">Update Available</p>
                    <p className="text-[13px] text-zinc-400 mt-0.5 leading-snug">A new version of the app is ready.</p>
                </div>
                <div className="flex items-center gap-2 border-l border-zinc-800 pl-4 ml-2">
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20 active:scale-95"
                    >
                        Refresh
                    </button>
                    <button
                        onClick={() => setDismissed(true)}
                        className="p-2 text-zinc-500 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
                        title="Dismiss"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
