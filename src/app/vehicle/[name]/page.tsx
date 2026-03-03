"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Wrench, FileText } from "lucide-react";
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

    useEffect(() => {
        if (session && (session as any).accessToken) {
            // Fetch records
            fetch("/api/records", {
                headers: { "Authorization": `Bearer ${(session as any).accessToken}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.records) {
                        const filtered = data.records.filter((r: any) => r.vehicle === decodedName);
                        setHistory(filtered.reverse()); // Newest first
                    }
                })
                .catch(console.error)
                .finally(() => setLoading(false));

            // Fetch dynamic vehicle metadata (for custom image & type)
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

    if (status === "loading" || (loading && session)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
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

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8 transition-colors">
            <div className="max-w-5xl mx-auto space-y-8">

                <header className="relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 shadow-md dark:shadow-2xl transition-colors">
                    {/* Background Color Gradient Overlay */}
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

                <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 shadow-sm dark:shadow-none transition-colors">
                    {history.length === 0 ? (
                        <div className="text-center text-zinc-500 py-12">No records found for this vehicle.</div>
                    ) : (
                        <div className="space-y-6">
                            {history.map((record, i) => (
                                <div key={i} className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group flex flex-col xl:flex-row gap-6 shadow-sm dark:shadow-none">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-zinc-200 dark:border-zinc-800/50 pb-4 mb-4">
                                            <div>
                                                <h3 className="font-semibold text-lg text-emerald-600 dark:text-emerald-400">{record.serviceType}</h3>
                                                <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {record.dateDone}
                                                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                                    <Wrench className="w-3.5 h-3.5" />
                                                    {record.workshop}
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <p className="text-xl font-bold text-zinc-900 dark:text-zinc-200">RM {record.cost || '0'}</p>
                                                {record.receipt && <a href={record.receipt} target="_blank" className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 flex items-center sm:justify-end gap-1 mt-1"><FileText className="w-3 h-3" /> View Receipt</a>}
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
