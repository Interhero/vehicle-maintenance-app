"use client";

import { useEffect, useState } from "react";
import { Wrench, ShieldCheck, Gauge } from "lucide-react";
import { AnimatedCar } from "@/components/AnimatedStatusIcons";

export function LaunchingScreen() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Subtle simulated loading progress
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                // Random jumps between 2 and 15
                return Math.min(100, p + Math.floor(Math.random() * 13) + 2);
            });
        }, 300);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 min-h-dvh flex flex-col items-center justify-center bg-zinc-950 overflow-hidden z-[100]">
            {/* Ambient Background Gradients */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen opacity-60 animate-in fade-in duration-1000"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen opacity-40 animate-in fade-in duration-1000 delay-300"></div>

            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6">

                <div className="relative w-32 h-32 mb-10 flex items-center justify-center animate-in zoom-in-95 duration-1000 ease-out">
                    {/* Outer Rotating Ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-zinc-800/50 border-t-blue-500/80 border-l-indigo-500/80 animate-spin-slow opacity-70"></div>

                    {/* Inner Pulsing Ring */}
                    <div className="absolute inset-3 rounded-full border border-blue-500/20 animate-pulse" style={{ animationDuration: '4s' }}></div>

                    {/* Core Shield & Car */}
                    <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-700/50 shadow-2xl overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <AnimatedCar className="w-10 h-10 text-white drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]" strokeWidth={1.5} />
                    </div>
                </div>

                {/* Typography */}
                <h1 className="text-3xl font-black text-white tracking-tight mb-3 text-center animate-in fade-in slide-in-from-bottom-3 duration-1000 delay-300 ease-out fill-mode-both">
                    Vehicle <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Tracker</span>
                </h1>

                {/* Progress Bar & Status Text */}
                <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-1000 delay-500 ease-out fill-mode-both">
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between items-center text-xs font-mono font-medium text-zinc-500 uppercase tracking-widest">
                        <span className="animate-pulse">Initializing System</span>
                        <span>{progress}%</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
