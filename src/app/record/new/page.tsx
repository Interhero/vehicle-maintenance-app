"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Car, Wrench, CheckCircle2, XCircle, Clock } from "lucide-react";
import { AnimatedLoader } from "@/components/AnimatedLoader";

export default function NewRecord() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [error, setError] = useState("");
    const [receiptFile, setReceiptFile] = useState<File | null>(null);

    const [dynamicVehicles, setDynamicVehicles] = useState<any[]>([]);
    const [flash, setFlash] = useState<{ show: boolean; type: "idle" | "loading" | "success" | "error" }>({ show: false, type: "idle" });
    const [vehiclesLoading, setVehiclesLoading] = useState(true);

    const [formData, setFormData] = useState({
        vehicleType: "",
        serviceType: "",
        otherServiceType: "", // Added
        dateDone: new Date().toISOString().split('T')[0],
        lastMileage: "",
        nextInterval: "",
        otherNextInterval: "", // Added
        nextServiceCalculated: "",
        locationType: "Self", // Added Self/Other radio approach
        workshop: "",
        details: "",
        cost: "",
        receipt: "",
        remark: "",
        // Specific Part Modifiers
        partBrand: "",
        partModel: "",
        locationFront: "",
        locationRear: "",
    });

    useEffect(() => {
        if (session && (session as any).accessToken) {
            fetch("/api/vehicles", {
                headers: { "Authorization": `Bearer ${(session as any).accessToken}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.vehicles) setDynamicVehicles(data.vehicles);
                })
                .catch(console.error)
                .finally(() => setVehiclesLoading(false));
        } else if (status !== "loading") {
            setVehiclesLoading(false);
        }
    }, [session, status]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };

            // Auto-calculate Next Service 
            if (name === "lastMileage" || name === "nextInterval" || name === "otherNextInterval") {
                const last = parseInt(updated.lastMileage);
                const activeIntervalString = updated.nextInterval === "Other" ? updated.otherNextInterval : updated.nextInterval;

                if (activeIntervalString === "None" || !activeIntervalString) {
                    updated.nextServiceCalculated = "";
                } else {
                    const interval = parseInt(activeIntervalString);
                    if (!isNaN(last) && !isNaN(interval)) {
                        updated.nextServiceCalculated = (last + interval).toString();
                    } else {
                        updated.nextServiceCalculated = "";
                    }
                }
            }
            return updated;
        });
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setFlash({ show: true, type: "loading" });
        setError("");

        try {
            let driveReceiptLink = formData.receipt;

            // 1. If a file was attached, upload it to Drive via our new endpoint first
            if (receiptFile) {
                const fileData = new FormData();
                fileData.append("receipt", receiptFile);

                const uploadRes = await fetch("/api/upload", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${(session as any)?.accessToken}`
                    },
                    body: fileData
                });

                if (!uploadRes.ok) throw new Error("Failed to upload receipt image to Drive");
                const uploadData = await uploadRes.json();

                // Override the receipt string with the new live Drive web link
                if (uploadData.webViewLink) {
                    driveReceiptLink = uploadData.webViewLink;
                }
            }

            // Details and part matrices are now mapped cleanly to array indices on the backend route
            let finalDetails = formData.details;

            const res = await fetch("/api/records", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${(session as any).accessToken}`
                },
                body: JSON.stringify({
                    ...formData,
                    serviceType: formData.serviceType === "Other" ? formData.otherServiceType : formData.serviceType,
                    nextInterval: formData.nextInterval === "Other" ? formData.otherNextInterval : formData.nextInterval,
                    workshop: formData.locationType === "Self" ? "Self" : formData.workshop,
                    details: finalDetails,
                    receipt: driveReceiptLink,
                    // Google Sheets typically expects DD/MM/YYYY text if you match their locale form outputs
                    dateDone: new Date(formData.dateDone).toLocaleDateString("en-GB")
                })
            });

            if (!res.ok) throw new Error("Failed to save maintenance record");

            setFlash({ show: true, type: "success" });
            setTimeout(() => {
                setFlash(prev => ({ ...prev, show: false }));
                setTimeout(() => router.push("/"), 500); // Wait for fade out
            }, 2000);

        } catch (err: any) {
            setError(err.message);
            setFlash({ show: true, type: "error" });
            setTimeout(() => setFlash(prev => ({ ...prev, show: false })), 3000);
        }
    };

    if (status === "loading") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
                <AnimatedLoader />
                <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">Initializing Form...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8 transition-colors">
            {/* Status Flash Screen Overlay */}
            <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center backdrop-blur-xl transition-all duration-500 ease-in-out ${flash.show ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-105'
                } ${flash.type === "loading" ? "bg-white/95 dark:bg-zinc-900/95 bg-gradient-to-br from-orange-500/95 to-amber-600/95 dark:from-orange-900/95 dark:to-orange-950/95" :
                    flash.type === "success" ? "bg-white/95 dark:bg-zinc-900/95 bg-gradient-to-br from-emerald-500/95 to-teal-600/95 dark:from-emerald-900/95 dark:to-teal-950/95" :
                        flash.type === "error" ? "bg-white/95 dark:bg-zinc-900/95 bg-gradient-to-br from-rose-500/95 to-red-600/95 dark:from-rose-900/95 dark:to-red-950/95" : "bg-transparent"
                }`}>

                {flash.type === "loading" && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-500">
                        <div className="w-28 h-28 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(255,255,255,0.3)] dark:shadow-[0_0_50px_rgba(255,255,255,0.1)] relative overflow-hidden ring-4 ring-white/30 dark:ring-transparent">
                            <Clock className="w-14 h-14 text-white dark:text-orange-200 animate-[spin_3s_linear_infinite]" />
                            <div className="absolute inset-0 border-4 border-white/50 dark:border-orange-400/30 rounded-full border-t-white animate-spin"></div>
                        </div>
                        <h2 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">Writing to Database...</h2>
                        <p className="text-orange-50 dark:text-orange-200 mt-3 font-medium text-lg animate-pulse">Connecting to Google Sheets</p>
                    </div>
                )}

                {flash.type === "success" && (
                    <div className="flex flex-col items-center animate-in zoom-in slide-in-from-bottom-4 duration-500 spring-bounce">
                        <div className="w-28 h-28 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(255,255,255,0.3)] dark:shadow-[0_0_50px_rgba(16,185,129,0.4)] ring-4 ring-white/50 dark:ring-emerald-400/50">
                            <CheckCircle2 className="w-16 h-16 text-white dark:text-emerald-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-[bounce_1s_ease-in-out_infinite]" />
                        </div>
                        <h2 className="text-4xl font-extrabold text-white mb-3 drop-shadow-lg">Saved Successfully!</h2>
                        <p className="text-emerald-50 dark:text-emerald-100 font-semibold text-lg drop-shadow-md">Redirecting to garage...</p>
                    </div>
                )}

                {flash.type === "error" && (
                    <div className="flex flex-col items-center animate-in shake duration-300">
                        <div className="w-28 h-28 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(255,255,255,0.3)] dark:shadow-[0_0_50px_rgba(244,63,94,0.4)] ring-4 ring-white/50 dark:ring-rose-400/50">
                            <XCircle className="w-16 h-16 text-white dark:text-rose-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-[ping_1.5s_ease-in-out_infinite]" />
                        </div>
                        <h2 className="text-4xl font-extrabold text-white mb-3 drop-shadow-lg">Save Failed</h2>
                        <p className="text-rose-50 dark:text-rose-100 font-semibold text-lg max-w-sm text-center bg-rose-900/40 dark:bg-rose-950/50 p-4 rounded-xl border border-white/20 dark:border-rose-500/30 backdrop-blur-md">{error}</p>
                    </div>
                )}
            </div>
            <div className="max-w-3xl mx-auto space-y-8">
                <header className="flex items-center gap-4 glass-panel p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm dark:shadow-none">
                    <button onClick={() => router.back()} className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">New Maintenance Record</h1>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Add a new log to your Google Sheet</p>
                    </div>
                </header>

                {error && <div className="p-4 bg-rose-500/10 border border-rose-500/50 rounded-xl text-rose-600 dark:text-rose-400">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-8 glass-panel p-6 sm:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 shadow-md dark:shadow-none">

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b border-zinc-800 pb-2 flex items-center gap-2 text-blue-400">
                            <span className="bg-blue-500/20 w-6 h-6 flex items-center justify-center rounded-md text-sm">1</span>
                            Vehicle Details
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Vehicle Type *</span>
                                <select required name="vehicleType" value={formData.vehicleType} onChange={handleChange} disabled={vehiclesLoading || dynamicVehicles.length === 0} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50">
                                    <option value="" disabled>{vehiclesLoading ? "Loading vehicles..." : "Select vehicle..."}</option>
                                    {dynamicVehicles.map((v, i) => (
                                        <option key={i} value={v.name}>{v.name}</option>
                                    ))}
                                </select>
                                {!vehiclesLoading && dynamicVehicles.length === 0 && (
                                    <p className="text-xs text-rose-400 mt-1">No vehicles found. Set one up on the Dashboard first.</p>
                                )}
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Current Mileage (KM) *</span>
                                <input required type="number" name="lastMileage" value={formData.lastMileage} onChange={handleChange} min="0" className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="e.g. 158279" />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold border-b border-zinc-800 pb-2 flex items-center gap-2 text-emerald-400">
                            <span className="bg-emerald-500/20 w-6 h-6 flex items-center justify-center rounded-md text-sm">2</span>
                            Service Info
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <label className="space-y-2">
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">What was done? *</span>
                                <select required name="serviceType" value={formData.serviceType} onChange={handleChange} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all">
                                    <option value="" disabled>Select primary service...</option>
                                    <option value="Engine Oil">Engine Oil</option>
                                    <option value="Engine Oil Filter">Engine Oil Filter</option>
                                    <option value="Transition Oil">Transition Oil</option>
                                    <option value="Transmition Oil Filter">Transmition Oil Filter</option>
                                    <option value="Brake Pads">Brake Pads</option>
                                    <option value="Tire">Tire</option>
                                    <option value="Battery">Battery</option>
                                    <option value="Other">Other</option>
                                </select>
                            </label>

                            {/* Conditional text input if 'Other' is selected */}
                            {formData.serviceType === "Other" && (
                                <label className="space-y-2">
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Specify Other Service *</span>
                                    <input required type="text" name="otherServiceType" value={formData.otherServiceType} onChange={handleChange} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" placeholder="e.g. Changed spark plugs" />
                                </label>
                            )}

                            {/* Additional conditionally rendered details based on Service Type grouping */}
                            {["Other", "Brake Pads", "Tire"].includes(formData.serviceType) && (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Location - Front</span>
                                            <select name="locationFront" value={formData.locationFront} onChange={handleChange} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all">
                                                <option value="">N/A</option>
                                                <option value="Front Left">Left</option>
                                                <option value="Front Right">Right</option>
                                                <option value="Front Both">Both</option>
                                                <option value="Front Center">Center (Motorcycle)</option>
                                            </select>
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Location - Rear</span>
                                            <select name="locationRear" value={formData.locationRear} onChange={handleChange} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all">
                                                <option value="">N/A</option>
                                                <option value="Rear Left">Left</option>
                                                <option value="Rear Right">Right</option>
                                                <option value="Rear Both">Both</option>
                                                <option value="Rear Center">Center (Motorcycle)</option>
                                            </select>
                                        </label>
                                    </div>
                                    <label className="space-y-2">
                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Brand of Part</span>
                                        <input type="text" name="partBrand" value={formData.partBrand} onChange={handleChange} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" placeholder="e.g. Michelin" />
                                    </label>
                                    {formData.serviceType === "Other" && (
                                        <label className="space-y-2">
                                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Model Name of Part</span>
                                            <input type="text" name="partModel" value={formData.partModel} onChange={handleChange} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" placeholder="e.g. Pilot Sport 5" />
                                        </label>
                                    )}
                                </>
                            )}

                            {/* Oil & Battery grouping conditionals */}
                            {["Engine Oil", "Engine Oil Filter", "Transition Oil", "Transmition Oil Filter", "Battery"].includes(formData.serviceType) && (
                                <label className="space-y-2">
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Brand / Type</span>
                                    <input type="text" name="partBrand" value={formData.partBrand} onChange={handleChange} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" placeholder="Fully Synthetic / YTX4L-BS..." />
                                </label>
                            )}

                            <label className="space-y-2">
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Date Done *</span>
                                <input required type="date" name="dateDone" value={formData.dateDone} onChange={handleChange} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" />
                            </label>

                            <div className="space-y-2 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/20">
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Where it was done? *</span>
                                <div className="flex gap-4 mt-2">
                                    <label className="flex items-center gap-2 text-zinc-400 cursor-pointer hover:text-white transition-colors">
                                        <input type="radio" name="locationType" value="Self" checked={formData.locationType === "Self"} onChange={handleChange} className="accent-emerald-500" />
                                        Self
                                    </label>
                                    <label className="flex items-center gap-2 text-zinc-400 cursor-pointer hover:text-white transition-colors">
                                        <input type="radio" name="locationType" value="Other" checked={formData.locationType === "Other"} onChange={handleChange} className="accent-emerald-500" />
                                        Other Workshop
                                    </label>
                                </div>
                                {formData.locationType === "Other" && (
                                    <input required type="text" name="workshop" value={formData.workshop} onChange={handleChange} className="mt-3 w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm" placeholder="Enter workshop name..." />
                                )}
                            </div>

                            <label className="space-y-2">
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">General Notes / Details</span>
                                <input type="text" name="details" value={formData.details} onChange={handleChange} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" placeholder="Any extra specific details..." />
                            </label>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold border-b border-zinc-800 pb-2 flex items-center gap-2 text-indigo-400">
                            <span className="bg-indigo-500/20 w-6 h-6 flex items-center justify-center rounded-md text-sm">3</span>
                            Cost & Next Schedule
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="space-y-2">
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Next Due Interval (KM)</span>
                                    <select name="nextInterval" value={formData.nextInterval} onChange={handleChange} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all">
                                        <option value="" disabled>Select interval...</option>
                                        <option value="None">None</option>
                                        <option value="3000">3000</option>
                                        <option value="5000">5000</option>
                                        <option value="7000">7000</option>
                                        <option value="10000">10000</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </label>
                                {formData.nextInterval === "Other" && (
                                    <label className="space-y-2 block">
                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Specify Custom Interval</span>
                                        <input type="number" name="otherNextInterval" value={formData.otherNextInterval} onChange={handleChange} min="0" className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="e.g. 15000" />
                                    </label>
                                )}
                            </div>

                            <label className="space-y-2">
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Calculated Next Due Service (KM)</span>
                                <input readOnly type="number" name="nextServiceCalculated" value={formData.nextServiceCalculated} className="w-full bg-zinc-100 dark:bg-zinc-800/20 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 text-zinc-500 cursor-not-allowed" placeholder="Auto-calculated" />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Total Cost (RM)</span>
                                <input type="number" step="0.01" name="cost" value={formData.cost} onChange={handleChange} min="0" className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all" placeholder="e.g. 150" />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-medium text-zinc-300 flex items-center justify-between">
                                    Receipt Web Link
                                    <span className="text-[10px] text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded">Optional</span>
                                </span>
                                <input type="url" name="receipt" value={formData.receipt} onChange={handleChange} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-zinc-600" placeholder="https://drive.google.com/..." />
                            </label>

                            <label className="space-y-2 relative group">
                                <span className="text-sm font-medium text-zinc-300 flex items-center justify-between">
                                    Upload Receipt Image
                                    <span className="text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded font-bold tracking-wide">NEW</span>
                                </span>
                                <div className="relative w-full overflow-hidden bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-700/50 border-dashed rounded-xl transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800/50 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent">
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="flex items-center gap-3 p-3.5 text-zinc-400">
                                        <div className="p-2 bg-zinc-800 rounded-lg text-zinc-300 shrink-0">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="font-medium text-sm text-zinc-200 truncate">
                                                {receiptFile ? receiptFile.name : "Choose a file to upload..."}
                                            </span>
                                            <span className="text-xs text-zinc-500 group-hover:text-indigo-400 transition-colors">
                                                {receiptFile ? `${(receiptFile.size / 1024 / 1024).toFixed(2)} MB • Auto-saves to your Google Drive` : "Auto-saves directly to your Google Drive"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </label>
                        </div>

                        <label className="space-y-2 block">
                            <span className="text-sm font-medium text-zinc-300">Additional Remarks</span>
                            <textarea name="remark" value={formData.remark} onChange={handleChange} className="w-full bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-700/50 rounded-xl p-3.5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all h-28 resize-y" placeholder="Any extra notes or mechanic advice..." />
                        </label>
                    </div>

                    <button disabled={flash.type === "loading" || flash.type === "success"} type="submit" className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl flex items-center justify-center gap-3 transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50 mt-8 active:scale-[0.99]">
                        {flash.type === "loading" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {flash.type === "loading" ? "Writing to Spreadsheet..." : "Submit Maintenance Record"}
                    </button>
                </form>
            </div>
        </div>
    );
}
