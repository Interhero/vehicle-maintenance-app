import { verifyShareToken } from "@/lib/shareUtils";
import {
    Calendar,
    Wrench,
    MapPin,
    Navigation,
    Bike,
    Car,
    FileText,
    ShieldAlert
} from "lucide-react";
import { ShareCountdown } from "@/components/ShareCountdown";
import VehicleMappingMap from "@/components/VehicleMappingMap";
import { getRevokedLinks } from "@/lib/revocationStore";
import Link from "next/link";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function SharePage({ params }: { params: { token: string } }) {
    const unwrappedParams = await params;
    const shareToken = unwrappedParams.token;

    const record = await verifyShareToken(shareToken);

    // Security checks
    let isExpired = false;
    let isInstantlyRevoked = false;

    if (record && record.exp) {
        if (Date.now() >= record.exp * 1000) {
            isExpired = true;
        }
    }

    const revokedList = await getRevokedLinks();

    if (record && record.shareId) {
        if (revokedList.includes(record.shareId)) {
            isInstantlyRevoked = true;
        }
    }

    // Backward compatibility for legacy links generated before the shareId system.
    // Legacy links stored the full URL (e.g., http://.../share/eyJ...) in the spreadsheet and blocklist.
    // We check if any entry in the blocklist contains the current raw token string.
    if (!isInstantlyRevoked && revokedList.some(revokedItem => revokedItem.includes(shareToken))) {
        isInstantlyRevoked = true;
    }

    if (!record || isInstantlyRevoked) {
        return (
            <div className="min-h-dvh flex items-center justify-center bg-zinc-950 p-6 font-sans">
                <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] text-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-600 via-rose-500 to-rose-600"></div>
                    <div className="w-20 h-20 bg-rose-500/10 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 border border-rose-500/20 rotate-3">
                        <ShieldAlert className="w-10 h-10 text-rose-500 -rotate-3" />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Access Revoked</h1>
                    <p className="text-zinc-400 font-medium leading-relaxed mb-8">
                        The owner has manually revoked access to this vehicle maintenance record. It is no longer securely available.
                    </p>
                    <a href="/" className="inline-flex items-center gap-2 bg-white text-zinc-900 font-bold py-3 px-8 rounded-xl hover:bg-zinc-200 transition-colors">
                        Return to App
                    </a>
                </div>
            </div>
        );
    }

    if (isExpired) {
        return (
            <div className="min-h-screen bg-rose-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    @keyframes pulse-shake {
                        0%, 100% { transform: scale(1); }
                        10%, 20% { transform: scale(1.1) rotate(-3deg); }
                        30%, 50%, 70%, 90% { transform: scale(1.1) rotate(3deg); }
                        40%, 60%, 80% { transform: scale(1.1) rotate(-3deg); }
                    }
                    .animate-pulse-shake {
                        animation: pulse-shake 1.5s cubic-bezier(.36,.07,.19,.97) both infinite;
                    }
                `}} />

                <div className="w-24 h-24 bg-rose-500 rounded-full flex items-center justify-center mb-8 border-4 border-rose-600 shadow-2xl shadow-rose-500/40 animate-pulse-shake">
                    <svg viewBox="0 0 24 24" className="w-12 h-12 text-white" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                </div>

                <h1 className="text-3xl font-black text-rose-600 dark:text-rose-500 mb-3 tracking-tight">ACCESS DENIED</h1>
                <p className="text-zinc-600 dark:text-zinc-400 max-w-sm mb-10 font-medium leading-relaxed">
                    This maintenance record link has <span className="text-rose-600 dark:text-rose-500 font-bold">Expired</span> or was <span className="text-rose-600 dark:text-rose-500 font-bold">Revoked</span> by the owner. You may need to request a new link for access.
                </p>

                <Link
                    href="/"
                    className="px-8 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl text-sm font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-zinc-500/20 uppercase tracking-widest"
                >
                    Return to App
                </Link>
            </div>
        );
    }

    const isMotorcycle = record.vehicle.toLowerCase().includes("yamaha") || record.vehicle.toLowerCase().includes("bike");

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-8 flex items-center justify-center transition-colors">
            <div className="w-full max-w-5xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-md flex flex-col lg:flex-row">

                {/* Left Side: Info */}
                <div className="flex-1 p-8 sm:p-12">
                    {/* Top Info */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                {isMotorcycle ? (
                                    <Bike className="w-6 h-6 text-emerald-500" />
                                ) : (
                                    <Car className="w-6 h-6 text-emerald-500" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">Verified Record</h2>
                                <h1 className="text-2xl font-black text-zinc-900 dark:text-white capitalize leading-tight">{record.vehicle}</h1>
                            </div>
                        </div>
                        <ShareCountdown expiresAt={record.expiresAt} />
                    </div>

                    <div className="space-y-8">
                        {/* Service Highlight */}
                        <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 p-8 rounded-3xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Wrench className="w-24 h-24 rotate-12" />
                            </div>
                            <h3 className="text-4xl font-black text-emerald-600 dark:text-emerald-400 mb-3 tracking-tight">{record.serviceType}</h3>
                            <div className="flex flex-wrap items-center gap-6 text-zinc-500 dark:text-zinc-400 font-bold text-xs uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-emerald-500" />
                                    {record.dateDone}
                                </div>
                                {record.workshop && record.workshop !== "Self" && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-emerald-500" />
                                        {record.workshop}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
                                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 block">Mileage</span>
                                <p className="text-2xl font-black text-zinc-900 dark:text-white">{record.lastMileage} <span className="text-xs text-zinc-400">KM</span></p>
                            </div>
                            <div className="p-6 rounded-3xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
                                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 block">Total Cost</span>
                                <p className="text-2xl font-black text-zinc-900 dark:text-white"><span className="text-xs text-emerald-500 mr-1">RM</span>{record.cost || '0'}</p>
                            </div>
                        </div>

                        {/* Notes */}
                        {record.details && (
                            <div className="space-y-3">
                                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">Service Notes</span>
                                <div className="p-6 rounded-3xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/50 text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium italic text-lg shadow-inner">
                                    &quot;{record.details}&quot;
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {record.workshop && record.workshop !== "Self" && (
                                <a
                                    href={record.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(record.workshop)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-500/20 active:scale-95 group"
                                >
                                    <Navigation className="w-5 h-5 group-hover:transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                                    Navigate to Workshop
                                </a>
                            )}
                            {record.receipt && record.receipt.startsWith("http") && (
                                <a
                                    href={record.receipt}
                                    target="_blank"
                                    className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-2xl font-black hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all border border-zinc-200 dark:border-zinc-700 active:scale-95"
                                >
                                    <FileText className="w-5 h-5" />
                                    View Receipt
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Side: Blueprint (Interactive Map) */}
                <div className="lg:w-96 bg-zinc-50/50 dark:bg-zinc-950/50 border-l border-zinc-100 dark:border-zinc-800 p-8 sm:p-12 flex flex-col justify-center items-center">
                    <div className="w-full max-w-sm space-y-6">
                        <div className="text-center lg:text-left">
                            <h4 className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Service Mapping</h4>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Interactive blueprint showing service areas.</p>
                        </div>
                        <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-4 shadow-xl border border-zinc-100 dark:border-zinc-800">
                            <VehicleMappingMap
                                isMotorcycle={isMotorcycle}
                                serviceDetails={record.serviceType + " " + (record.details || "")}
                                locationFront={record.locationFront}
                                locationRear={record.locationRear}
                            />
                        </div>
                        <div className="flex items-center gap-2 justify-center lg:justify-start">
                            <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Active Marker System</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
