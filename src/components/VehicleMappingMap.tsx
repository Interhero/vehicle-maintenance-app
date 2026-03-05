"use client";

import React, { useMemo } from 'react';

interface VehicleMappingMapProps {
    isMotorcycle: boolean;
    serviceDetails: string; // the string from the log to parse
    locationFront?: string;
    locationRear?: string;
}

// Pre-defined mapping coordinates (Percentages) based on the specific blueprints
const HONDA_COORDS = {
    // Top-Down sedan view pointing LEFT (Left side of image = Front)
    front: { top: "50%", left: "15%" },
    rear: { top: "50%", left: "85%" },
    "front left": { top: "65%", left: "22%" },
    "front right": { top: "35%", left: "22%" },
    "rear left": { top: "65%", left: "80%" },
    "rear right": { top: "35%", left: "80%" },
    engine: { top: "50%", left: "20%" },
    transmission: { top: "50%", left: "30%" },
    battery: { top: "35%", left: "18%" },
};

const YAMAHA_COORDS = {
    // Side-profile motorcycle pointing LEFT
    front: { top: "55%", left: "18%" }, // Front wheel hub
    rear: { top: "55%", left: "78%" },  // Rear wheel hub
    engine: { top: "58%", left: "46%" }, // Center engine block
    battery: { top: "38%", left: "55%" }, // Below seat 
    chain: { top: "58%", left: "65%" },   // Drive chain
    coolant: { top: "50%", left: "40%" }, // Radiator area
    magnet: { top: "58%", left: "46%" }, // Stator engine left side
};

export default function VehicleMappingMap({ isMotorcycle, serviceDetails, locationFront, locationRear }: VehicleMappingMapProps) {

    const blueprintSrc = isMotorcycle ? "/yamaha_blueprint.png" : "/honda_blueprint.png";
    const coordsMap = isMotorcycle ? YAMAHA_COORDS : HONDA_COORDS;

    // Analyze the details string and discrete props to extract locations
    const activeMarkers = useMemo(() => {
        const text = (serviceDetails + " " + (locationFront || "") + " " + (locationRear || "")).toLowerCase();
        const markers: { id: string; label?: string; top: string; left: string }[] = [];

        // Direct Props Mapping (Priority)
        if (locationFront) {
            const lf = locationFront.toLowerCase();
            if (lf.includes("left")) {
                if (coordsMap["front left" as keyof typeof coordsMap]) markers.push({ id: "Front Left", ...coordsMap["front left" as keyof typeof coordsMap] });
            } else if (lf.includes("right")) {
                if (coordsMap["front right" as keyof typeof coordsMap]) markers.push({ id: "Front Right", ...coordsMap["front right" as keyof typeof coordsMap] });
            } else if (lf.includes("both")) {
                if (coordsMap["front left" as keyof typeof coordsMap]) markers.push({ id: "Front Left", ...coordsMap["front left" as keyof typeof coordsMap] });
                if (coordsMap["front right" as keyof typeof coordsMap]) markers.push({ id: "Front Right", ...coordsMap["front right" as keyof typeof coordsMap] });
            } else if (lf.includes("center") || lf === "front") {
                if (coordsMap["front" as keyof typeof coordsMap]) markers.push({ id: "Front", ...coordsMap["front" as keyof typeof coordsMap] });
            }
        }

        if (locationRear) {
            const lr = locationRear.toLowerCase();
            if (lr.includes("left")) {
                if (coordsMap["rear left" as keyof typeof coordsMap]) markers.push({ id: "Rear Left", ...coordsMap["rear left" as keyof typeof coordsMap] });
            } else if (lr.includes("right")) {
                if (coordsMap["rear right" as keyof typeof coordsMap]) markers.push({ id: "Rear Right", ...coordsMap["rear right" as keyof typeof coordsMap] });
            } else if (lr.includes("both") || lr.includes("chain")) {
                if (coordsMap["rear left" as keyof typeof coordsMap]) markers.push({ id: "Rear Left", ...coordsMap["rear left" as keyof typeof coordsMap] });
                if (coordsMap["rear right" as keyof typeof coordsMap]) markers.push({ id: "Rear Right", ...coordsMap["rear right" as keyof typeof coordsMap] });
                if (lr.includes("chain") && 'chain' in coordsMap) markers.push({ id: "Chain/Sprocket", ...(coordsMap as any).chain });
            } else if (lr.includes("center") || lr === "rear") {
                if (coordsMap["rear" as keyof typeof coordsMap]) markers.push({ id: "Rear", ...coordsMap["rear" as keyof typeof coordsMap] });
            }
        }

        // Fallback/Legacy text-based parsing for other markers (Oil, Battery, etc)
        // ...
        if (text.includes("engine") || text.includes("oil") || text.includes("filter") || text.includes("bleeding")) {
            markers.push({ id: "Engine Bay", ...coordsMap.engine });
        }
        if (text.includes("battery")) {
            markers.push({ id: "Battery", ...coordsMap.battery });
        }
        if (text.includes("coolant") && 'coolant' in coordsMap) {
            markers.push({ id: "Radiator/Coolant", ...(coordsMap as any).coolant });
        }
        if (text.includes("magnet") && 'magnet' in coordsMap) {
            markers.push({ id: "Magnet Coil", ...(coordsMap as any).magnet });
        }

        // Remove duplicates based on ID
        return markers.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
    }, [serviceDetails, locationFront, locationRear, coordsMap]);

    return (
        <div className="relative w-full max-w-sm mx-auto sm:mx-0 aspect-[4/3] rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800">
            {/* Blueprint Image */}
            <img
                src={blueprintSrc}
                alt="Vehicle Blueprint Map"
                className={`w-full h-full ${isMotorcycle ? 'object-contain scale-90' : 'object-cover'} opacity-50`}
            />



            {/* Overlays / Markers */}
            {activeMarkers.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs text-zinc-500 font-medium px-3 py-1 bg-zinc-900/80 rounded-full border border-zinc-800 backdrop-blur-md">General Maintenance</span>
                </div>
            ) : (
                activeMarkers.map((marker, idx) => (
                    <div
                        key={idx}
                        className="absolute -translate-x-1/2 -translate-y-1/2 group hover:z-50 cursor-pointer"
                        style={{ top: marker.top, left: marker.left }}
                    >
                        {/* Pulsating dot indicator */}
                        <div className="relative flex h-6 w-6">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-6 w-6 bg-rose-500 border-2 border-zinc-900 shadow-[0_0_15px_rgba(244,63,94,0.8)]"></span>
                        </div>

                        {/* Hover Label */}
                        <div className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-zinc-800 text-xs font-bold text-zinc-100 rounded shadow-xl whitespace-nowrap z-10 border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {marker.label || marker.id}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
