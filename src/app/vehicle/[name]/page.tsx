"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Search,
    Filter,
    SortAsc,
    SortDesc,
    Calendar,
    Wrench,
    MapPin,
    ExternalLink,
    History,
    Share2,
    Navigation,
    X
} from "lucide-react";
import VehicleMappingMap from "@/components/VehicleMappingMap";
import { AnimatedLoader } from "@/components/AnimatedLoader";

export default function VehicleDetails({ params }: { params: Promise<{ name: string }> }) {
    const unwrappedParams = use(params);
    const decodedName = decodeURIComponent(unwrappedParams.name);

    const { data: session, status } = useSession();
    const router = useRouter();
    const [history, setHistory] = useState<any[]>([]);
    const [vehicleMeta, setVehicleMeta] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Filter & Sort State
    const [searchQuery, setSearchQuery] = useState("");
    const [activeChip, setActiveChip] = useState<string | null>(null);
    const [sortNewest, setSortNewest] = useState(true);

    useEffect(() => {
        if (session && (session as any).accessToken) {
            fetch("/api/records", {
                headers: { "Authorization": `Bearer ${(session as any).accessToken}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.records) {
                        const filtered = data.records.filter((r: any) => r.vehicle === decodedName);
                        setHistory(filtered.reverse());
                    }
                })
                .catch(console.error)
                .finally(() => setLoading(false));

            fetch("/api/vehicles", {
                headers: { "Authorization": `Bearer ${(session as any).accessToken}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.vehicles) {
                        const meta = data.vehicles.find((v: any) => v.name === decodedName);
                        if (meta) setVehicleMeta(meta);
                    }
                })
                .catch(console.error);

        } else if (status !== "loading") {
            setLoading(false);
        }
    }, [session, status, decodedName]);

    // Derive unique service types for chips
    const serviceTypes = useMemo(() => {
        const types = new Set<string>();
        history.forEach(r => {
            if (r.serviceType && r.serviceType !== "N/A" && r.serviceType !== "Unknown Service") {
                types.add(r.serviceType);
            }
        });
        return Array.from(types).sort();
    }, [history]);

    // Filtered + Sorted records
    const handleShare = (record: any) => {
        const text = `🛠️ Maintenance Record: ${record.vehicle}\n📅 Date: ${record.dateDone}\n🔧 Service: ${record.serviceType}\n📍 Workshop: ${record.workshop || 'Self'}\n🛣️ Mileage: ${record.lastMileage} KM\n💰 Cost: RM ${record.cost}\n\nShared from Vehicle Maintenance App`;

        if (navigator.share) {
            navigator.share({
                title: `Maintenance Record - ${record.vehicle}`,
                text: text,
                url: window.location.href
            }).catch(console.error);
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(text).then(() => {
                alert("Record summary copied to clipboard!");
            }).catch(err => {
                console.error("Could not copy text: ", err);
            });
        }
    };

    const filteredHistory = useMemo(() => {
        let results = [...history];

        // Chip filter
        if (activeChip) {
            results = results.filter(r => r.serviceType === activeChip);
        }

        // Search query filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            results = results.filter(r =>
                (r.serviceType?.toLowerCase().includes(q)) ||
                (r.workshop?.toLowerCase().includes(q)) ||
                (r.details?.toLowerCase().includes(q)) ||
                (r.dateDone?.toLowerCase().includes(q)) ||
                (r.cost?.toString().includes(q))
            );
        }

        return results;
    }, [history, activeChip, searchQuery]);

    const sortedHistory = useMemo(() => {
        const results = [...filteredHistory];

        results.sort((a, b) => {
            const dateA = new Date(a.dateDone.split('/').reverse().join('-')).getTime();
            const dateB = new Date(b.dateDone.split('/').reverse().join('-')).getTime();
            return sortNewest ? dateB - dateA : dateA - dateB;
        });

        return results;
    }, [filteredHistory, sortNewest]);

    if (status === "loading" || (loading && session)) {
        return (
            <div className="min-h-dvh flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
                <AnimatedLoader />
                <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">Loading Profile...</p>
            </div>
        );
    }

    if (!session) {
        router.push("/");
        return null;
    }

    const isMotorcycle = vehicleMeta?.type === "Motorcycle" || decodedName.toLowerCase().includes("yamaha");
    const hasActiveFilters = searchQuery.trim() || activeChip;

    return (
        <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8 transition-colors">
            <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">

                <header className="relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 shadow-md dark:shadow-2xl transition-colors">
                    <div className="absolute inset-0 z-0 pointer-events-none bg-zinc-50 dark:bg-zinc-950 overflow-hidden rounded-2xl">
                        <div
                            className="absolute inset-0 opacity-80 dark:opacity-70 transition-all duration-700 hover:opacity-100 dark:hover:opacity-90"
                            style={{ background: `radial-gradient(circle at top left, ${vehicleMeta?.color || '#3b82f6'} 0%, transparent 80%)` }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-950 via-white/30 dark:via-zinc-950/60 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-zinc-950 via-white/20 dark:via-zinc-950/40 to-transparent"></div>
                    </div>

                    <div className="flex items-center gap-4 relative z-10">
                        <button onClick={() => router.back()} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{decodedName}</h1>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Complete Maintenance History</p>
                        </div>
                    </div>
                    <a href="/record/new" className="relative z-10 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-md dark:shadow-lg dark:shadow-blue-500/20">
                        + Log New Service
                    </a>
                </header>

                {/* Search & Filter Bar */}
                {history.length > 0 && (
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            {/* Search Input */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search service, workshop, notes..."
                                    className="w-full bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-10 pr-9 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Sort Toggle */}
                            <button
                                onClick={() => setSortNewest(!sortNewest)}
                                className="flex items-center gap-1.5 px-3 py-2.5 bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors shrink-0"
                                title={sortNewest ? "Showing newest first" : "Showing oldest first"}
                            >
                                {sortNewest ? <SortDesc className="w-3.5 h-3.5" /> : <SortAsc className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline">{sortNewest ? "Newest" : "Oldest"}</span>
                            </button>
                        </div>

                        {/* Service Type Chips */}
                        {serviceTypes.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
                                {serviceTypes.map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setActiveChip(activeChip === type ? null : type)}
                                        className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${activeChip === type
                                            ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                                            : "bg-white dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Active Filter Summary */}
                        {hasActiveFilters && (
                            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                                <span>
                                    Showing <strong className="text-zinc-700 dark:text-zinc-200">{sortedHistory.length}</strong> of {history.length} records
                                </span>
                                <button
                                    onClick={() => { setSearchQuery(""); setActiveChip(null); }}
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-500 font-medium"
                                >
                                    Clear filters
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 shadow-sm dark:shadow-none transition-colors">
                    {history.length === 0 ? (
                        <div className="text-center text-zinc-500 py-12">No records found for this vehicle.</div>
                    ) : sortedHistory.length === 0 ? (
                        <div className="text-center py-12">
                            <Search className="w-8 h-8 text-zinc-300 dark:text-zinc-600 mx-auto mb-3" />
                            <p className="text-zinc-500 dark:text-zinc-400">No records match your filters.</p>
                            <button onClick={() => { setSearchQuery(""); setActiveChip(null); }} className="text-sm text-blue-600 dark:text-blue-400 mt-2 hover:underline">Clear all filters</button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {sortedHistory.map((record, i) => (
                                <div key={i} className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group flex flex-col xl:flex-row gap-6 shadow-sm dark:shadow-none">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-zinc-200 dark:border-zinc-800/50 pb-4 mb-4">
                                            <div>
                                                <h3 className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">{record.serviceType}</h3>
                                                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-[10px] sm:text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                                                        <Calendar className="w-3 h-3" />
                                                        {record.dateDone}
                                                    </div>
                                                    {record.workshop && record.workshop !== "Self" ? (
                                                        <a
                                                            href={record.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(record.workshop)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 bg-blue-100/50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-500/20 hover:bg-blue-200/50 dark:hover:bg-blue-500/20 transition-all group/shop"
                                                            title={record.mapLink ? "View pinned location" : `Search ${record.workshop} on Maps`}
                                                        >
                                                            <MapPin className="w-3 h-3 group-hover/shop:animate-bounce" />
                                                            {record.workshop}
                                                            <Navigation className="w-2.5 h-2.5 opacity-60 group-hover/shop:opacity-100" />
                                                        </a>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-bold border border-zinc-200 dark:border-zinc-700/50">
                                                            <Wrench className="w-3 h-3" />
                                                            {record.workshop || "Self"}
                                                        </div>
                                                    )}

                                                    {/* Action Button: Share */}
                                                    <div className="flex items-center gap-1 ml-auto">
                                                        <button
                                                            onClick={() => handleShare(record)}
                                                            className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                                                            title="Share record"
                                                        >
                                                            <Share2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-200">RM {record.cost || '0'}</p>
                                                {record.receipt && <a href={record.receipt} target="_blank" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 flex items-center sm:justify-end gap-1 mt-1"><ExternalLink className="w-3 h-3" /> View Receipt</a>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <span className="block text-xs text-zinc-600 dark:text-zinc-500 uppercase font-medium tracking-wider mb-1">Mileage</span>
                                                <span className="font-mono text-zinc-800 dark:text-zinc-300">{record.lastMileage || '--'} KM</span>
                                            </div>
                                            <div>
                                                <span className="block text-xs text-zinc-600 dark:text-zinc-500 uppercase font-medium tracking-wider mb-1">Interval</span>
                                                <span className="font-mono text-zinc-800 dark:text-zinc-300">{record.nextMileageInterval || '--'} KM</span>
                                            </div>
                                            <div>
                                                <span className="block text-xs text-zinc-600 dark:text-zinc-500 uppercase font-medium tracking-wider mb-1">Next Due</span>
                                                <span className="font-mono text-blue-600 dark:text-blue-400">{record.nextServiceCalculated || '--'} KM</span>
                                            </div>
                                        </div>

                                        {(record.details || record.workshop || record.receipt) && (
                                            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/50">
                                                <details className="text-sm text-zinc-600 dark:text-zinc-400 outline-none [&_summary::-webkit-details-marker]:hidden group/details">
                                                    <summary className="cursor-pointer text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 w-fit select-none outline-none flex items-center gap-1.5 transition-colors font-medium">
                                                        <span className="text-xs transform transition-transform group-open/details:rotate-90">▶</span>
                                                        View Service Details & Attached Receipts
                                                    </summary>
                                                    <div className="mt-4 p-4 rounded-xl bg-white dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80 space-y-2 shadow-inner dark:shadow-none">
                                                        {record.workshop && <p><span className="text-zinc-500 w-20 inline-block">Location:</span> <span className="text-zinc-700 dark:text-zinc-300 font-medium">{record.workshop}</span></p>}
                                                        {record.details && <p><span className="text-zinc-500 w-20 inline-block shrink-0 flex-shrink-0 align-top">Notes:</span> <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium inline-block w-[calc(100%-5rem)]">{record.details}</span></p>}
                                                        {record.receipt && (
                                                            <a href={record.receipt} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-400 hover:underline flex items-center gap-1.5 mt-4 w-fit bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20 font-medium shadow-sm shadow-emerald-500/5">
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                                                                Open Attached Receipt
                                                            </a>
                                                        )}
                                                    </div>
                                                </details>
                                            </div>
                                        )}
                                    </div>

                                    {/* 2D Interactive Service Mapping Map */}
                                    <div className="w-full xl:w-72 shrink-0">
                                        <VehicleMappingMap isMotorcycle={isMotorcycle} serviceDetails={record.serviceType + " " + (record.details || "")} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
