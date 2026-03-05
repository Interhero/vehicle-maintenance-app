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
    X,
    Link2,
    Copy,
    Check,
    AlertCircle,
    Clock,
    XCircle,
    CheckCircle2,
    Trash2
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

    // Advanced Sharing State
    const [sharingRecord, setSharingRecord] = useState<any | null>(null);
    const [shareExpiry, setShareExpiry] = useState("1d");
    const [generatedLink, setGeneratedLink] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    // Active Shares Management
    const [showSharesManager, setShowSharesManager] = useState(false);
    const [activeLinks, setActiveLinks] = useState<any[]>([]);
    const [isLoadingLinks, setIsLoadingLinks] = useState(false);
    const [revokingLink, setRevokingLink] = useState<string | null>(null);
    const [revokeFlash, setRevokeFlash] = useState(false);

    const fetchLinks = async () => {
        setIsLoadingLinks(true);
        try {
            const res = await fetch("/api/share");
            const data = await res.json();
            if (data.links) setActiveLinks(data.links.filter((l: any) => l.vehicle === decodedName && l.status === "Active"));
        } catch (e) { console.error(e); }
        finally { setIsLoadingLinks(false); }
    };

    const handleRevoke = async (id: string) => {
        try {
            await fetch(`/api/share?id=${id}`, { method: "DELETE" });
            fetchLinks();
        } catch (e) { console.error(e); }
    };

    const confirmRevoke = (id: string) => {
        setRevokingLink(id);
    };

    const executeRevoke = async () => {
        if (!revokingLink) return;
        try {
            await fetch(`/api/share?id=${revokingLink}`, { method: "DELETE" });
            fetchLinks();
            setRevokingLink(null);
            setRevokeFlash(true);
            setTimeout(() => setRevokeFlash(false), 1500);
        } catch (e) { console.error(e); }
    };

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
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        if (!showSharesManager) return;
        const timer = setInterval(() => setNow(Date.now()), 30000); // Update every 30s
        return () => clearInterval(timer);
    }, [showSharesManager]);

    const activeLinksList = useMemo(() => {
        return activeLinks.map(link => {
            if (link.expiresAt === 'Never') return { ...link, countdown: 'Permanent', isExpired: false };

            const expiry = parseInt(link.expiresAt);
            if (isNaN(expiry)) return { ...link, countdown: 'Invalid Date', isExpired: true };

            const created = parseInt(link.createdAt);
            const createdDate = isNaN(created) ? link.createdAt : new Date(created).toLocaleDateString('en-GB');

            const diff = expiry - now;
            if (diff <= 0) return { ...link, countdown: 'Expired', isExpired: true, createdDate };

            const hours = Math.floor(diff / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            return {
                ...link,
                countdown: `Expiring in: ${hours}h ${mins}m`,
                isExpired: false,
                isUrgent: diff < 3600000,
                createdDate
            };
        });
    }, [activeLinks, now]);

    const handleShare = (record: any) => {
        setSharingRecord(record);
        setGeneratedLink("");
        setIsCopied(false);
    };

    const handleGenerateLink = async () => {
        if (!sharingRecord) return;
        setIsGenerating(true);
        try {
            const response = await fetch("/api/share/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    record: { ...sharingRecord, vehicle: decodedName },
                    expiresIn: shareExpiry === "never" ? undefined : shareExpiry
                }),
            });
            const data = await response.json();
            if (data.token) {
                const link = `${window.location.origin}/share/${data.token}`;
                setGeneratedLink(link);
            }
        } catch (error) {
            console.error("Link generation failed:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
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
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-1">Maintenance History</h2>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                                Track and manage all service records for your {isMotorcycle ? 'motorcycle' : 'vehicle'}.
                            </p>
                        </div>
                        <button
                            onClick={() => { setShowSharesManager(true); fetchLinks(); }}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl text-xs font-bold transition-all border border-zinc-200 dark:border-zinc-700 shadow-sm"
                        >
                            <Share2 className="w-3.5 h-3.5" />
                            Manage Public Links
                        </button>
                    </div>
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
                                                {(record.partBrand || record.partModel) && (
                                                    <div className="flex flex-wrap gap-2 mt-1 mb-2">
                                                        {record.partBrand && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                                                BRAND: {record.partBrand}
                                                            </span>
                                                        )}
                                                        {record.partModel && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                                                                MODEL: {record.partModel}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
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
                                                        {record.workshop && <p className="text-sm"><span className="text-zinc-500 w-24 inline-block text-[10px] font-black uppercase tracking-tighter">Location</span> <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{record.workshop}</span></p>}
                                                        {record.partBrand && <p className="text-sm"><span className="text-zinc-500 w-24 inline-block text-[10px] font-black uppercase tracking-tighter">Part Brand</span> <span className="text-emerald-600 dark:text-emerald-400 font-bold">{record.partBrand}</span></p>}
                                                        {record.partModel && <p className="text-sm"><span className="text-zinc-500 w-24 inline-block text-[10px] font-black uppercase tracking-tighter">Part Model</span> <span className="text-zinc-700 dark:text-zinc-300 font-bold">{record.partModel}</span></p>}
                                                        {record.details && <p className="text-sm flex gap-2"><span className="text-zinc-500 w-24 inline-block shrink-0 text-[10px] font-black uppercase tracking-tighter pt-1">Notes</span> <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium italic">{record.details}</span></p>}
                                                        {record.receipt && record.receipt.startsWith("http") && (
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
                                        <VehicleMappingMap
                                            isMotorcycle={isMotorcycle}
                                            serviceDetails={record.serviceType + " " + (record.details || "")}
                                            locationFront={record.locationFront}
                                            locationRear={record.locationRear}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

            {/* Advanced Sharing Modal */}
            {sharingRecord && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSharingRecord(null)}></div>
                    <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                        {/* Header */}
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <Share2 className="w-5 h-5 text-emerald-500" />
                                    Share Record
                                </h3>
                                <button onClick={() => setSharingRecord(null)} className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                Create a public link for <span className="text-emerald-500 font-semibold">{sharingRecord.serviceType}</span>
                            </p>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {!generatedLink ? (
                                <>
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-1">Link Expiration</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { label: "1 Hour", value: "1h" },
                                                { label: "1 Day", value: "1d" },
                                                { label: "7 Days", value: "7d" },
                                                { label: "Never", value: "never" }
                                            ].map((opt) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setShareExpiry(opt.value)}
                                                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${shareExpiry === opt.value
                                                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                                        : "bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                                        }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-blue-50/50 dark:bg-blue-500/5 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/10 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                        <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                                            This link will allow anyone to view this specific record and map details without needing an account.
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleGenerateLink}
                                        disabled={isGenerating}
                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Link2 className="w-5 h-5" />
                                                Generate Public Link
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                    <div className="p-4 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-500/10 text-center">
                                        <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Share Link Ready!</p>
                                    </div>

                                    <div className="relative group">
                                        <input
                                            readOnly
                                            value={generatedLink}
                                            className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 pr-12 text-sm text-zinc-900 dark:text-zinc-200 outline-none truncate"
                                        />
                                        <button
                                            onClick={copyToClipboard}
                                            className="absolute right-2 top-2 p-2 rounded-xl bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 text-zinc-500 hover:text-zinc-900 dark:hover:text-white shadow-sm transition-all active:scale-95"
                                        >
                                            {isCopied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-2 pt-2">
                                        <p className="text-[10px] text-zinc-400 text-center font-medium">Link expires in: <span className="text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">{shareExpiry}</span></p>
                                        <button
                                            onClick={() => setGeneratedLink("")}
                                            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors py-2"
                                        >
                                            Change expiration or generate new
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Manage Shares Modal */}
            {showSharesManager && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSharesManager(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 flex flex-col max-h-[80vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                    <History className="w-5 h-5 text-blue-500" />
                                    Active Public Links
                                </h3>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Manage and revoke links shared with mechanics or friends.</p>
                            </div>
                            <button onClick={() => setShowSharesManager(false)} className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            {isLoadingLinks ? (
                                <div className="space-y-3">
                                    {[1, 2].map(i => (
                                        <div key={i} className="h-24 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl animate-pulse"></div>
                                    ))}
                                </div>
                            ) : activeLinks.length === 0 ? (
                                <div className="py-12 text-center text-zinc-500">
                                    <Link2 className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm font-medium">No active links found for this {isMotorcycle ? 'motorcycle' : 'vehicle'}.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {activeLinksList.map((link) => (
                                        <div key={link.id} className="p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-center justify-between group">
                                            <div className="space-y-1">
                                                <h4 className="font-bold text-zinc-900 dark:text-white text-sm">{link.service}</h4>
                                                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                                    <span className="flex items-center gap-1 text-zinc-500">
                                                        <Calendar className="w-3 h-3" />
                                                        {link.createdDate}
                                                    </span>
                                                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full font-bold shadow-sm ${link.isExpired
                                                        ? 'bg-rose-500/10 text-rose-500'
                                                        : link.countdown === 'Permanent'
                                                            ? 'bg-blue-500/10 text-blue-500'
                                                            : link.isUrgent
                                                                ? 'bg-rose-500/10 text-rose-500 animate-pulse'
                                                                : 'bg-orange-500/10 text-orange-500'
                                                        }`}>
                                                        <Clock className="w-3 h-3" />
                                                        {link.countdown}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {link.isExpired ? (
                                                    <button
                                                        onClick={() => handleRevoke(link.id)}
                                                        className="p-2.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-all border border-zinc-300 dark:border-zinc-700 font-bold text-[10px] uppercase"
                                                    >
                                                        Dismiss
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => confirmRevoke(link.id)}
                                                        className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 shadow-lg shadow-rose-500/5 group-hover:scale-105 active:scale-95"
                                                        title="Revoke Access"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/80 text-center">
                            <p className="text-[10px] text-zinc-400">Revoking a link will immediately block access for anyone using that token.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Revoke Confirmation Modal */}
            {revokingLink && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRevokingLink(null)}></div>
                    <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 text-center shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-300">
                        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl mx-auto flex items-center justify-center mb-4">
                            <Trash2 className="w-8 h-8 text-rose-500" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Revoke Access?</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                            Are you sure you want to instantly revoke this public link? Visitors will immediately be blocked.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setRevokingLink(null)} className="flex-1 py-3 px-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-colors">
                                Cancel
                            </button>
                            <button onClick={executeRevoke} className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 transition-all">
                                Revoke Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Revoke Flash Animation Overlay */}
            <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center bg-rose-600 transition-all duration-500 ease-in-out ${revokeFlash ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <Trash2 className={`w-32 h-32 text-white mb-4 transition-transform duration-500 ease-in-out ${revokeFlash ? 'scale-110 drop-shadow-2xl translate-y-0' : 'scale-50 translate-y-20'}`} />
                <h2 className={`text-4xl font-black text-white tracking-tight transition-all duration-500 delay-100 ${revokeFlash ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>Link Revoked</h2>
            </div>
        </div>
    );
}
