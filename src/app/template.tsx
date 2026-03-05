"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Template({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(false);
        // Simple slight delay to let the DOM settle before fading in
        const timer = setTimeout(() => setMounted(true), 10);
        return () => clearTimeout(timer);
    }, [pathname]);

    return (
        <div
            key={pathname}
            className={`transition-opacity duration-500 ease-out ${mounted ? "opacity-100" : "opacity-0"
                }`}
        >
            {children}
        </div>
    );
}
