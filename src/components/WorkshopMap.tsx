"use client";

import React, { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type { CandidateWorkshop } from '@/lib/algorithms/MultiCriteriaEngine';
import type { Waypoint } from '@/lib/algorithms/AStarRouter';

interface WorkshopMapProps {
    startLocation: { lat: number; lng: number };
    workshops: any[];
    recommendedWorkshop: CandidateWorkshop | null;
    baselineWorkshop: CandidateWorkshop | null;
    onLocationChange: (lat: number, lng: number) => void;
}

// Fetch real road curvature from OSRM directly from vehicle pin to destination workshop
// This avoids backtracking detours caused by discrete graph snap nodes (e.g. J_UITM gate)
async function fetchRoadGeometry(
    start: { lat: number; lng: number },
    dest: { lat: number; lng: number }
): Promise<[number, number][] | null> {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) return null;
        const data = await res.json();
        if (data.code === 'Ok' && data.routes && data.routes[0]?.geometry?.coordinates) {
            // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
            return data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        }
    } catch (e) {
        // Fallback to straight waypoint lines if OSRM is unreachable
    }
    return null;
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
    const [snappingToRoads, setSnappingToRoads] = useState(false);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        let isMounted = true;

        import('leaflet').then(async (L) => {
            if (!isMounted || !mapContainerRef.current) return;

            if (!mapInstanceRef.current) {
                const map = L.map(mapContainerRef.current).setView([startLocation.lat, startLocation.lng], 13);
                mapInstanceRef.current = map;

                // Standard OpenStreetMap Tile Layer (Clean, 100% Free, No Watermark or API Key)
                L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
                    className: '!bg-transparent !border-0',
                    html: `
                        <div style="background: #2563eb; color: white; width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 14px rgba(37,99,235,0.6); font-weight: bold; font-size: 18px; cursor: grab;">
                            📍
                        </div>
                    `,
                    iconSize: [38, 38],
                    iconAnchor: [19, 19]
                });

                const marker = L.marker([startLocation.lat, startLocation.lng], {
                    draggable: true,
                    icon: startIcon,
                    zIndexOffset: 2000
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

                let pinColor = '#475569';
                let zIndex = 100;
                let badgeHtml = '';

                if (isRec && isBase) {
                    pinColor = '#10b981';
                    zIndex = 1000;
                    badgeHtml = '<span style="background: #047857; padding: 1px 6px; border-radius: 9999px; font-size: 10px;">★ #1 Rec</span>';
                } else if (isRec) {
                    pinColor = '#10b981';
                    zIndex = 950;
                    badgeHtml = '<span style="background: #047857; padding: 1px 6px; border-radius: 9999px; font-size: 10px;">★ Rec</span>';
                } else if (isBase) {
                    pinColor = '#f59e0b';
                    zIndex = 900;
                    badgeHtml = '<span style="background: #b45309; padding: 1px 6px; border-radius: 9999px; font-size: 10px;">Nearest</span>';
                }

                const displayName = ws.name.length > 22 ? ws.name.slice(0, 20) + '...' : ws.name;

                const wsIcon = L.divIcon({
                    className: '!bg-transparent !border-0',
                    html: `
                        <div style="background: ${pinColor}; color: white; padding: 4px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; border: 2px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3); white-space: nowrap; display: inline-flex; align-items: center; gap: 5px; transform: translate(-50%, -100%); cursor: pointer;">
                            <span style="font-size: 12px;">🔧</span>
                            <span>${displayName}</span>
                            ${badgeHtml}
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
                    <div style="font-family: inherit; font-size: 13px; line-height: 1.4; min-width: 180px;">
                        <strong style="color: #0f172a; font-size: 14px;">${ws.name}</strong><br>
                        <small style="color: #64748b;">${ws.address}</small><br>
                        <hr style="margin: 8px 0; border: none; border-top: 1px solid #e2e8f0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <span style="color: #64748b;">Cost:</span>
                            <strong style="color: #059669;">RM ${Number(ws.baseline_repair_cost).toFixed(2)}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: #64748b;">Quality:</span>
                            <strong style="color: #d97706;">⭐ ${Number(ws.service_quality).toFixed(1)} / 10</strong>
                        </div>
                    </div>
                `);

                workshopMarkersRef.current.push(marker);
            });

            // Draw Route Polylines following real road curvature
            if (mcPolylineRef.current) map.removeLayer(mcPolylineRef.current);
            if (basePolylineRef.current) map.removeLayer(basePolylineRef.current);

            if (recommendedWorkshop || baselineWorkshop) {
                setSnappingToRoads(true);

                // Fetch direct street routes from vehicle pin to workshops (avoids snap-node backtracking)
                const [mcRoadCoords, baseRoadCoords] = await Promise.all([
                    recommendedWorkshop 
                        ? fetchRoadGeometry(startLocation, { lat: recommendedWorkshop.latitude, lng: recommendedWorkshop.longitude }) 
                        : Promise.resolve(null),
                    (baselineWorkshop && baselineWorkshop.workshop_id !== recommendedWorkshop?.workshop_id) 
                        ? fetchRoadGeometry(startLocation, { lat: baselineWorkshop.latitude, lng: baselineWorkshop.longitude }) 
                        : Promise.resolve(null)
                ]);

                if (!isMounted) return;
                setSnappingToRoads(false);

                // 1. Draw Baseline Polyline (Dashed Amber)
                if (baselineWorkshop && baselineWorkshop.workshop_id !== recommendedWorkshop?.workshop_id) {
                    const fallbackCoords: [number, number][] = (baselineWorkshop.waypoints || []).map(w => [w.lat, w.lng] as [number, number]);
                    const finalBaseCoords = baseRoadCoords || fallbackCoords;

                    if (finalBaseCoords.length > 0) {
                        basePolylineRef.current = L.polyline(finalBaseCoords, {
                            color: '#f59e0b',
                            weight: 3.5,
                            dashArray: '6, 8',
                            opacity: 0.85
                        }).addTo(map);
                    }
                }

                // 2. Draw Recommended Polyline (Solid Emerald Green)
                if (recommendedWorkshop) {
                    const fallbackCoords: [number, number][] = (recommendedWorkshop.waypoints || []).map(w => [w.lat, w.lng] as [number, number]);
                    const finalMcCoords = mcRoadCoords || fallbackCoords;

                    if (finalMcCoords.length > 0) {
                        mcPolylineRef.current = L.polyline(finalMcCoords, {
                            color: '#10b981',
                            weight: 5.5,
                            opacity: 0.95,
                            lineJoin: 'round',
                            lineCap: 'round'
                        }).addTo(map);

                        map.fitBounds(L.latLngBounds(finalMcCoords as any), { padding: [50, 50] });
                    }
                }
            }
        });

        return () => {
            isMounted = false;
        };
    }, [startLocation, workshops, recommendedWorkshop, baselineWorkshop, onLocationChange]);

    return (
        <div className="relative w-full h-[540px] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-lg">
            <div ref={mapContainerRef} className="w-full h-full" />
            
            {/* Status & Helper Overlay */}
            <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-2">
                <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 shadow-md flex items-center gap-2">
                    <span>📍</span>
                    <span>Drag the pin or click anywhere on the road network to change location</span>
                </div>
                {snappingToRoads && (
                    <div className="bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                        Snapping A* path to roads...
                    </div>
                )}
            </div>
        </div>
    );
}
