"use client";

import { useEffect, useState } from "react";
import { Car, Wrench, Bike } from "lucide-react";

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
                    <Bike className="w-8 h-8 text-emerald-500" />
                </div>
                <div className={`absolute transition-all duration-300 transform ${iconStage === 2 ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}>
                    <Wrench className="w-7 h-7 text-amber-500" />
                </div>
            </div>
        </div>
    );
}
