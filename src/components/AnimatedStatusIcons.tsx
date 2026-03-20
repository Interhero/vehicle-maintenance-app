"use client";

import React from "react";

export function AnimatedCheck({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" pathLength="1" className="animate-draw" />
            <path d="m9 12 2 2 4-4" pathLength="1" className="animate-draw-delayed" />
        </svg>
    );
}

export function AnimatedX({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" pathLength="1" className="animate-draw" />
            <path d="m15 9-6 6" pathLength="1" className="animate-draw-delayed" />
            <path d="m9 9 6 6" pathLength="1" className="animate-draw-delayed" />
        </svg>
    );
}

export function AnimatedTrash({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 6h18" pathLength="1" className="animate-draw" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" pathLength="1" className="animate-draw-delayed" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" pathLength="1" className="animate-draw" />
            <line x1="10" y1="11" x2="10" y2="17" pathLength="1" className="animate-draw-delayed" />
            <line x1="14" y1="11" x2="14" y2="17" pathLength="1" className="animate-draw-delayed" />
        </svg>
    );
}

export function AnimatedClock({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" pathLength="1" className="animate-draw" />
            <g className="animate-spin origin-center" style={{ animationDelay: '0s', animationDuration: '3s' }}>
                <polyline points="12 6 12 12 16 14" pathLength="1" className="animate-draw-delayed" />
            </g>
        </svg>
    );
}
