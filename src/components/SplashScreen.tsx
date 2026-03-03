"use client";

import { useEffect, useState } from "react";
import { Car, Loader2 } from "lucide-react";

export function SplashScreen() {
    const [showWelcome, setShowWelcome] = useState(true);
    const [welcomeFading, setWelcomeFading] = useState(false);

    useEffect(() => {
        // Check if the welcome screen was already shown in this session
        if (sessionStorage.getItem("welcomeShown")) {
            setShowWelcome(false);
        } else {
            // Start fading out after 1.5 seconds
            const timer1 = setTimeout(() => setWelcomeFading(true), 1500);

            // Remove it from the DOM completely after the transition (700ms)
            const timer2 = setTimeout(() => {
                setShowWelcome(false);
                sessionStorage.setItem("welcomeShown", "true");
            }, 2200);

            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        }
    }, []);

    if (!showWelcome) return null;

    return (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-opacity duration-700 ${welcomeFading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex flex-col items-center animate-in zoom-in duration-500 spring-bounce">
                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                    <Car className="w-12 h-12 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                </div>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 tracking-tight">
                    VehicleTracker
                </h1>
                <p className="font-medium text-zinc-500 dark:text-zinc-400 mt-4 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500/70" />
                    Revving up engines...
                </p>
            </div>
        </div>
    );
}
