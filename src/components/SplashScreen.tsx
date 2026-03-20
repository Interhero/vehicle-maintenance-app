"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { AnimatedCar } from "@/components/AnimatedStatusIcons";

export function SplashScreen() {
    const { data: session, status } = useSession();
    const [showWelcome, setShowWelcome] = useState(true);
    const [welcomeFading, setWelcomeFading] = useState(false);
    const [charIndex, setCharIndex] = useState(0);

    const userName = session?.user?.name || "";
    const prefix = session ? "Welcome Back, " : "";
    const namePart = session ? userName : "Vehicle Maintenance Record";
    const suffix = session ? "!" : "";
    const fullText = prefix + namePart + suffix;

    useEffect(() => {
        // Check if the welcome screen was already shown in this session
        if (sessionStorage.getItem("welcomeShown")) {
            setShowWelcome(false);
            return;
        }

        if (status !== "loading") {
            let i = 0;
            const typingInterval = setInterval(() => {
                i++;
                setCharIndex(i);

                if (i >= fullText.length) {
                    clearInterval(typingInterval);

                    // After typing finishes, wait 1s then fade out natively to the homepage
                    setTimeout(() => {
                        setWelcomeFading(true);
                        setTimeout(() => {
                            setShowWelcome(false);
                            sessionStorage.setItem("welcomeShown", "true");
                        }, 700);
                    }, 1000);
                }
            }, 60); // Clean 60ms typing speed

            return () => clearInterval(typingInterval);
        }
    }, [status, fullText]);

    if (!showWelcome) return null;

    const currentPrefix = prefix.slice(0, charIndex);
    const currentName = charIndex > prefix.length ? namePart.slice(0, charIndex - prefix.length) : "";
    const currentSuffix = charIndex > prefix.length + namePart.length ? suffix.slice(0, charIndex - prefix.length - namePart.length) : "";

    return (
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 overflow-hidden transition-all duration-1000 ease-out ${welcomeFading ? 'opacity-0 pointer-events-none blur-sm scale-110' : 'opacity-100 scale-100 blur-none'}`}>
            {/* Ambient Background Gradients to seamlessly match LaunchingScreen */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] mix-blend-screen opacity-60"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] mix-blend-screen opacity-40"></div>

            <div className="relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-1000 ease-out">
                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                    <AnimatedCar className="w-12 h-12 text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                </div>

                <div className={`flex flex-col items-center max-w-2xl transition-all duration-700 ${status === 'loading' ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                    <h1 className="text-3xl sm:text-4xl font-extrabold flex flex-wrap justify-center items-center tracking-tight text-center px-4 min-h-[48px] leading-relaxed">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 whitespace-pre-wrap">
                            {currentPrefix}
                        </span>

                        {currentName && (
                            <span className="relative inline-block px-1">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 whitespace-pre-wrap">
                                    {currentName}
                                </span>
                                {/* Dynamic Underline growing with the name */}
                                <span className="absolute bottom-0 left-1 right-1 h-[4px] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)]"></span>
                            </span>
                        )}

                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 whitespace-pre-wrap">
                            {currentSuffix}
                        </span>

                        {/* Blinking Cursor */}
                        {(status === 'loading' || charIndex < fullText.length) && (
                            <span className="inline-block w-[3px] sm:w-[4px] bg-blue-500 h-[28px] sm:h-[36px] ml-1 sm:ml-2 mb-1 animate-pulse rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                        )}
                    </h1>

                    <div className="font-medium text-zinc-500 dark:text-zinc-400 mt-6 flex items-center justify-center gap-2 h-6">
                        {status === 'loading' || charIndex < fullText.length ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin text-blue-500/70" />
                                <span className="animate-pulse">{session ? "Revving up your garage..." : "Starting engines..."}</span>
                            </>
                        ) : (
                            <span className="text-emerald-500 dark:text-emerald-400 animate-in fade-in duration-500 font-bold tracking-widest uppercase text-xs">Access Granted</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
