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

export function AnimatedCalendarCheck({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" pathLength="1" className="animate-draw" />
            <line x1="16" x2="16" y1="2" y2="6" pathLength="1" className="animate-draw" />
            <line x1="8" x2="8" y1="2" y2="6" pathLength="1" className="animate-draw" />
            <line x1="3" x2="21" y1="10" y2="10" pathLength="1" className="animate-draw-delayed" />
            <path d="m9 16 2 2 4-4" pathLength="1" className="animate-draw-delayed" />
        </svg>
    );
}

export function AnimatedPenLine({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z" pathLength="1" className="animate-draw" />
            <path d="M12 20h9" pathLength="1" className="animate-draw-delayed" />
        </svg>
    );
}

export function AnimatedOdometer({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect x="2" y="8" width="20" height="8" rx="2" ry="2" pathLength="1" className="animate-draw" />
            <line x1="8" y1="8" x2="8" y2="16" pathLength="1" className="animate-draw-delayed" />
            <line x1="16" y1="8" x2="16" y2="16" pathLength="1" className="animate-draw-delayed" />

            <line x1="5" y1="10" x2="5" y2="14" className="animate-roll-dashes" />
            <line x1="12" y1="10" x2="12" y2="14" className="animate-roll-dashes" style={{ animationDelay: '0.7s' }} />
            <line x1="19" y1="10" x2="19" y2="14" className="animate-roll-dashes" style={{ animationDelay: '0.8s' }} />
        </svg>
    );
}

export function AnimatedSpeedometer({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M3 18 A 10 10 0 0 1 21 18" pathLength="1" className="animate-draw" />
            <line x1="12" y1="8" x2="12" y2="10" pathLength="1" className="animate-draw-delayed" />
            <line x1="6.5" y1="12" x2="8.5" y2="13.5" pathLength="1" className="animate-draw-delayed" />
            <line x1="17.5" y1="12" x2="15.5" y2="13.5" pathLength="1" className="animate-draw-delayed" />
            <g style={{ transformOrigin: '12px 18px' }} className="animate-needle-swing">
                <line x1="12" y1="18" x2="12" y2="8" />
                <circle cx="12" cy="18" r="2.5" fill="currentColor" />
            </g>
        </svg>
    );
}
