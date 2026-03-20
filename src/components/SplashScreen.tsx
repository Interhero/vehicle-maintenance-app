"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { AnimatedCar } from "@/components/AnimatedStatusIcons";

export function SplashScreen() {
    const { data: session, status } = useSession();
    const [showWelcome, setShowWelcome] = useState(true);
    const [welcomeFading, setWelcomeFading] = useState(false);

    useEffect(() => {
        // Check if the welcome screen was already shown in this session
        if (sessionStorage.getItem("welcomeShown")) {
            setShowWelcome(false);
        } else if (status !== "loading") {
            // Start fading out after 4 seconds ONCE session is resolved
            const timer1 = setTimeout(() => setWelcomeFading(true), 4000);

            // Remove it from the DOM completely after the transition (700ms)
            const timer2 = setTimeout(() => {
                setShowWelcome(false);
                sessionStorage.setItem("welcomeShown", "true");
            }, 4700);

            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
            };
        }
    }, [status]);

    if (!showWelcome) return null;

    const userName = session?.user?.name || "";

    return (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 overflow-hidden transition-all duration-1000 ease-out ${welcomeFading ? 'opacity-0 pointer-events-none blur-sm scale-105' : 'opacity-100 scale-100 blur-none'}`}>
            {/* Ambient Background Gradients to seamlessly match LaunchingScreen */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen opacity-60"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen opacity-40"></div>

            <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-1000 ease-out">
                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                    <AnimatedCar className="w-12 h-12 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                </div>

                {/* Dynamic Text Area - Fades in once session resolves to avoid jitter */}
                <div className={`flex flex-col items-center transition-all duration-700 ${status === 'loading' ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                    <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 tracking-tight text-center px-4 uppercase">
                        {session ? `Welcome Back, ${userName}!` : "VehicleTracker"}
                    </h1>
                    <p className="font-medium text-zinc-500 dark:text-zinc-400 mt-4 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500/70" />
                        {session ? "Revving up your garage..." : "Starting engines..."}
                    </p>
                </div>
            </div>
        </div>
    );
}
