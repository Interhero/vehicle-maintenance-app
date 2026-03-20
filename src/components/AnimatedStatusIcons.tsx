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

export function AnimatedCar({ className, strokeWidth = 2 }: { className?: string, strokeWidth?: number }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" pathLength="1" className="animate-draw" />
            <circle cx="7" cy="17" r="2" pathLength="1" className="animate-draw-delayed" />
            <path d="M9 17h6" pathLength="1" className="animate-draw-delayed" />
            <circle cx="17" cy="17" r="2" pathLength="1" className="animate-draw-delayed" />
        </svg>
    );
}
