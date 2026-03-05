import { verifyShareToken } from "@/lib/shareUtils";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    Calendar,
    Wrench,
    MapPin,
    Navigation,
    CheckCircle2,
    Clock,
    ArrowRight,
    Bike,
    FileText
} from "lucide-react";

export default async function SharePage({ params }: { params: { token: string } }) {
    const { token } = await params;
    const record = await verifyShareToken(token);

    if (!record) {
        return (
            <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mb-6 border border-rose-500/20">
                    <Clock className="w-8 h-8 text-rose-500" />
                </div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Link Expired or Invalid</h1>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-xs mb-8">
                    This maintenance record link is no longer active or was generated incorrectly.
                </p>
                <Link
                    href="/"
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
                >
                    Return to App
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-8 flex items-center justify-center">
            <div className="w-full max-w-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl overflow-hidden backdrop-blur-sm">
                {/* Header Decor */}
                <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500"></div>

                <div className="p-8 sm:p-12">
                    {/* Top Info */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                                <Bike className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Maintenance Record</h2>
                                <h1 className="text-xl font-bold text-zinc-900 dark:text-white capitalize">{record.vehicle}</h1>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase">Verified Record</span>
                        </div>
                    </div>

                    {/* Service Highlight */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/80 rounded-2xl p-6 mb-8 border border-zinc-200 dark:border-zinc-800/50">
                        <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-2 truncate">{record.serviceType}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-zinc-500 dark:text-zinc-400 text-sm">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {record.dateDone}
                            </div>
                            {record.workshop && record.workshop !== "Self" && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="w-4 h-4" />
                                    {record.workshop}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1 block">Current Mileage</span>
                            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-200">{record.lastMileage} KM</p>
                        </div>
                        <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900/30">
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1 block">Service Cost</span>
                            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-200">RM {record.cost || '0'}</p>
                        </div>
                    </div>

                    {/* Extra Info */}
                    {record.details && (
                        <div className="mb-8">
                            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3 block">Service Details</span>
                            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/50 text-zinc-600 dark:text-zinc-300 leading-relaxed italic text-sm">
                                "{record.details}"
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        {record.workshop && record.workshop !== "Self" && (
                            <a
                                href={record.mapLink || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(record.workshop)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
                            >
                                <Navigation className="w-4 h-4" />
                                View Workshop Location
                            </a>
                        )}
                        {record.receipt && (
                            <a
                                href={record.receipt}
                                target="_blank"
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-sm font-semibold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all border border-zinc-200 dark:border-zinc-700"
                            >
                                <FileText className="w-4 h-4" />
                                View Receipt
                            </a>
                        )}
                    </div>

                    <p className="mt-8 text-center text-[10px] text-zinc-400 dark:text-zinc-600 font-medium">
                        This record was shared securely via Vehicle Maintenance App.
                    </p>
                </div>
            </div>
        </div>
    );
}
