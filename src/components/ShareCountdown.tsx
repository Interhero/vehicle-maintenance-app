"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock } from "lucide-react";

interface ShareCountdownProps {
    expiresAt: number | "Never";
}

export function ShareCountdown({ expiresAt }: ShareCountdownProps) {
    const [now, setNow] = useState(0);

    useEffect(() => {
        setNow(Date.now());
        if (expiresAt === "Never") return;
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, [expiresAt]);

    // Auto-reload when expired
    useEffect(() => {
        if (expiresAt !== "Never" && now > 0 && now >= expiresAt) {
            window.location.reload();
        }
    }, [now, expiresAt]);

    const info = useMemo(() => {
        if (expiresAt === "Never") return { label: "Permanent Access", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" };

        const diff = expiresAt - now;
        if (diff <= 0) return { label: "Link Expired", color: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" };

        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        const secs = Math.floor((diff % 60000) / 1000);

        let color = "text-emerald-500";
        let bg = "bg-emerald-500/10";
        let border = "border-emerald-500/20";
        let pulse = false;

        if (diff < 3600000) { // < 1 hour
            color = "text-rose-500";
            bg = "bg-rose-500/10";
            border = "border-rose-500/20";
            pulse = true;
        } else if (diff < 43200000) { // < 12 hours
            color = "text-amber-500";
            bg = "bg-amber-500/10";
            border = "border-amber-500/20";
        }

        return {
            label: `Expires in: ${hours}h ${mins}m ${secs}s`,
            color,
            bg,
            border,
            pulse
        };
    }, [expiresAt, now]);

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${info.bg} ${info.border} ${info.pulse ? "animate-pulse" : ""} transition-colors duration-500`}>
            <Clock className={`w-3.5 h-3.5 ${info.color}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${info.color}`}>
                {info.label}
            </span>
        </div>
    );
}
