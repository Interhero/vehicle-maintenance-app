"use client";

import React, { useEffect, useRef } from 'react';
import type { CandidateWorkshop } from '@/lib/algorithms/MultiCriteriaEngine';
import type { Waypoint } from '@/lib/algorithms/AStarRouter';

interface WorkshopMapProps {
    startLocation: { lat: number; lng: number };
    workshops: any[];
    recommendedWorkshop: CandidateWorkshop | null;
    baselineWorkshop: CandidateWorkshop | null;
    onLocationChange: (lat: number, lng: number) => void;
}

export default function WorkshopMap({
    startLocation,
    workshops,
    recommendedWorkshop,
    baselineWorkshop,
    onLocationChange
}: WorkshopMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const startMarkerRef = useRef<any>(null);
    const workshopMarkersRef = useRef<any[]>([]);
    const mcPolylineRef = useRef<any>(null);
    const basePolylineRef = useRef<any>(null);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        let isMounted = true;

        import('leaflet').then((L) => {
            if (!isMounted || !mapContainerRef.current) return;

            // Import Leaflet CSS dynamically if not loaded
            if (!document.getElementById('leaflet-css')) {
                const link = document.createElement('link');
                link.id = 'leaflet-css';
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
                document.head.appendChild(link);
            }

            if (!mapInstanceRef.current) {
                const map = L.map(mapContainerRef.current).setView([startLocation.lat, startLocation.lng], 12);
                mapInstanceRef.current = map;

                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
                    subdomains: 'abcd',
                    maxZoom: 19
                }).addTo(map);

                // 15km Study Boundary Circle (UiTM KT)
                L.circle([5.26197, 103.16551], {
                    radius: 15000,
                    color: '#3b82f6',
                    weight: 2,
                    dashArray: '6, 8',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.05
                }).addTo(map).bindTooltip("15 km Study Boundary (UiTM Kuala Terengganu)", { direction: "top" });

                // Map click listener to relocate start pin
                map.on('click', (e: any) => {
                    onLocationChange(e.latlng.lat, e.latlng.lng);
                });
            }

            const map = mapInstanceRef.current;

            // Update Start Marker
            if (!startMarkerRef.current) {
                const startIcon = L.divIcon({
                    className: 'custom-start-marker',
                    html: `
                        <div style="background: #2563eb; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-weight: bold; font-size: 14px;">
                            📍
                        </div>
                    `,
                    iconSize: [34, 34],
                    iconAnchor: [17, 34]
                });

                const marker = L.marker([startLocation.lat, startLocation.lng], {
                    draggable: true,
                    icon: startIcon
                }).addTo(map);

                marker.on('dragend', () => {
                    const pos = marker.getLatLng();
                    onLocationChange(pos.lat, pos.lng);
                });

                startMarkerRef.current = marker;
            } else {
                startMarkerRef.current.setLatLng([startLocation.lat, startLocation.lng]);
            }

            // Clear old workshop markers
            workshopMarkersRef.current.forEach(m => map.removeLayer(m));
            workshopMarkersRef.current = [];

            // Add workshop markers
            workshops.forEach((ws) => {
                const isRec = recommendedWorkshop?.workshop_id === ws.workshop_id;
                const isBase = baselineWorkshop?.workshop_id === ws.workshop_id;

                let pinColor = '#64748b';
                let zIndex = 100;
                let badgeText = '';

                if (isRec && isBase) {
                    pinColor = '#10b981';
                    zIndex = 1000;
                    badgeText = '★ #1';
                } else if (isRec) {
                    pinColor = '#10b981';
                    zIndex = 950;
                    badgeText = '★ Rec';
                } else if (isBase) {
                    pinColor = '#f59e0b';
                    zIndex = 900;
                    badgeText = 'Nearest';
                }

                const wsIcon = L.divIcon({
                    className: 'custom-ws-pin',
                    html: `
                        <div style="background: ${pinColor}; color: white; padding: 3px 6px; border-radius: 6px; font-size: 11px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.25); white-space: nowrap; transform: translate(-50%, -100%);">
                            🔧 ${ws.name.split(' ')[0]} ${badgeText ? `[${badgeText}]` : ''}
                        </div>
                    `,
                    iconSize: [0, 0],
                    iconAnchor: [0, 0]
                });

                const marker = L.marker([ws.latitude, ws.longitude], {
                    icon: wsIcon,
                    zIndexOffset: zIndex
                }).addTo(map);

                marker.bindPopup(`
                    <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
                        <strong>${ws.name}</strong><br>
                        <small style="color: #64748b;">${ws.address}</small><br>
                        <hr style="margin: 6px 0; border: none; border-top: 1px solid #e2e8f0;">
                        <div>Cost: <strong>RM ${Number(ws.baseline_repair_cost).toFixed(2)}</strong></div>
                        <div>Quality: <strong>⭐ ${Number(ws.service_quality).toFixed(1)} / 10</strong></div>
                    </div>
                `);

                workshopMarkersRef.current.push(marker);
            });

            // Draw Route Polylines
            if (mcPolylineRef.current) map.removeLayer(mcPolylineRef.current);
            if (basePolylineRef.current) map.removeLayer(basePolylineRef.current);

            // Baseline polyline (Dashed Amber)
            if (baselineWorkshop && baselineWorkshop.waypoints && baselineWorkshop.workshop_id !== recommendedWorkshop?.workshop_id) {
                const baseLatLngs: [number, number][] = baselineWorkshop.waypoints.map(w => [w.lat, w.lng] as [number, number]);
                basePolylineRef.current = L.polyline(baseLatLngs, {
                    color: '#f59e0b',
                    weight: 3.5,
                    dashArray: '6, 8',
                    opacity: 0.85
                }).addTo(map);
            }

            // Recommended polyline (Solid Emerald Green)
            if (recommendedWorkshop && recommendedWorkshop.waypoints) {
                const recLatLngs: [number, number][] = recommendedWorkshop.waypoints.map(w => [w.lat, w.lng] as [number, number]);
                mcPolylineRef.current = L.polyline(recLatLngs, {
                    color: '#10b981',
                    weight: 5,
                    opacity: 0.95
                }).addTo(map);

                map.fitBounds(L.latLngBounds(recLatLngs as any), { padding: [40, 40] });
            }
        });

        return () => {
            isMounted = false;
        };
    }, [startLocation, workshops, recommendedWorkshop, baselineWorkshop, onLocationChange]);

    return (
        <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-md">
            <div ref={mapContainerRef} className="w-full h-full" />
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 shadow-sm pointer-events-none">
                💡 Click anywhere or drag the 📍 pin to change starting position
            </div>
        </div>
    );
}
