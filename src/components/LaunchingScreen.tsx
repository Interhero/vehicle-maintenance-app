"use client";

import { useEffect, useState } from "react";
import { Car, Wrench, ShieldCheck, Gauge } from "lucide-react";

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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse-slow"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] mix-blend-screen opacity-50"></div>

            {/* Main Content Container */}
            <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6">

                {/* Dynamic Icon Composition */}
                <div className="relative w-32 h-32 mb-10 flex items-center justify-center">
                    {/* Outer Rotating Ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-zinc-800/80 border-t-blue-500 border-l-indigo-500 animate-spin-slow"></div>

                    {/* Inner Pulsing Ring */}
                    <div className="absolute inset-4 rounded-full border border-blue-500/30 animate-ping opacity-20" style={{ animationDuration: '3s' }}></div>

                    {/* Core Shield & Car */}
                    <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-700/50 shadow-2xl overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Car className="w-10 h-10 text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] fill-blue-500/20" strokeWidth={1.5} />
                    </div>

                    {/* Floating Accent Icons */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-400 shadow-lg animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}>
                        <Wrench className="w-4 h-4" />
                    </div>
                    <div className="absolute -bottom-2 -left-2 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-indigo-400 shadow-lg animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}>
                        <Gauge className="w-4 h-4" />
                    </div>
                    <div className="absolute bottom-4 -right-4 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 shadow-lg animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}>
                        <ShieldCheck className="w-4 h-4" />
                    </div>
                </div>

                {/* Typography */}
                <h1 className="text-3xl font-black text-white tracking-tight mb-3 text-center">
                    Vehicle <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Tracker</span>
                </h1>

                {/* Progress Bar & Status Text */}
                <div className="w-full space-y-3">
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
