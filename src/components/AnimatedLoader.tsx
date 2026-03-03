"use client";

import { useEffect, useState } from "react";
import { Car, Wrench } from "lucide-react";

export function AnimatedLoader() {
    const [iconStage, setIconStage] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setIconStage((s) => (s + 1) % 3), 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative flex items-center justify-center w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-[3px] border-zinc-200 dark:border-zinc-800"></div>
            <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-500 border-r-emerald-500 animate-[spin_1.5s_linear_infinite]"></div>
            <div className="absolute inset-2 bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-full flex items-center justify-center shadow-inner overflow-hidden">
                <div className={`absolute transition-all duration-300 transform ${iconStage === 0 ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
                    <Car className="w-8 h-8 text-blue-500" />
                </div>
                <div className={`absolute transition-all duration-300 transform ${iconStage === 1 ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
                    <svg className="w-8 h-8 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 15v1c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="3" /><path d="M14 17h1" /><circle cx="17" cy="17" r="3" /></svg>
                </div>
                <div className={`absolute transition-all duration-300 transform ${iconStage === 2 ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
                    <Wrench className="w-7 h-7 text-amber-500" />
                </div>
            </div>
        </div>
    );
}
