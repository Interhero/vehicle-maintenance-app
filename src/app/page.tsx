"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Car, Wrench, Calendar, LogOut, Loader2 } from "lucide-react";

// Static Image Mapping based on typical generated filenames
const VEHICLE_IMAGES: Record<string, string> = {
  "Honda City WXE7539": "/honda_city.png",
  "Yamaha Y16ZR VKB6835": "/yamaha_y16zr.png"
};

export default function Home() {
  const { data: session, status } = useSession();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Load dismissed alerts from local storage purely on client
    const saved = localStorage.getItem("vehicle_dismissals");
    if (saved) {
      try { setDismissedAlerts(JSON.parse(saved)); } catch (e) { }
    }

    if (session && (session as any).accessToken) {
      fetch("/api/records", {
        headers: {
          "Authorization": `Bearer ${(session as any).accessToken}`
        }
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.records) {
            setRecords(data.records);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 p-6">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-zinc-100 tracking-tight">VehicleTracker</h1>
            <p className="text-zinc-400 text-lg">Manage your maintenance logs securely with Google Drive.</p>
          </div>
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold py-4 px-8 rounded-xl hover:bg-zinc-200 transition-all duration-200 active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // Advanced extraction: track latest overall mileage AND latest record per service type
  const vehicleData = records.reduce((acc, record) => {
    if (!record.vehicle || record.vehicle === "Unknown Vehicle") return acc;
    if (!acc[record.vehicle]) {
      acc[record.vehicle] = {
        name: record.vehicle,
        currentMileage: 0,
        services: {}
      };
    }

    // Update overall latest mileage
    const mileage = parseInt(record.lastMileage);
    if (!isNaN(mileage) && mileage > acc[record.vehicle].currentMileage) {
      acc[record.vehicle].currentMileage = mileage;
    }

    // Since records are chronological, updating this always keeps the latest record for a given service type
    const sType = record.serviceType;
    if (sType && sType !== "N/A" && sType !== "Unknown Service") {
      acc[record.vehicle].services[sType] = record;
    }

    return acc;
  }, {});

  const vehicles = Object.values(vehicleData) as any[];

  // Calculate upcoming services across all vehicles
  const upcomingServices: any[] = [];
  vehicles.forEach(v => {
    Object.values(v.services).forEach((service: any) => {
      const nextDue = parseInt(service.nextServiceCalculated);
      if (!isNaN(nextDue)) {
        const remainingKm = nextDue - v.currentMileage;

        // Push every tracked service, rely on manual dismissal to clear
        upcomingServices.push({
          vehicle: v.name,
          serviceType: service.serviceType,
          remainingKm,
          nextDue,
          lastDone: service.dateDone,
          details: service.details,
          workshop: service.workshop,
          cost: service.cost,
          receipt: service.receipt
        });
      }
    });
  });

  // Sort by highest priority (lowest remaining KM)
  upcomingServices.sort((a, b) => a.remainingKm - b.remainingKm);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-zinc-400">Welcome back, {session.user?.name}</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="/record/new" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-500/20">
              + New Record
            </a>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-zinc-800"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            <div className="space-y-8">
              {/* Vehicle Cards */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-400" />
                    My Vehicles
                  </h2>
                  {Object.keys(dismissedAlerts).length > 0 && (
                    <button
                      onClick={() => {
                        setDismissedAlerts({});
                        localStorage.removeItem("vehicle_dismissals");
                      }}
                      className="text-xs font-medium text-zinc-400 hover:text-white transition-colors bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-lg"
                    >
                      Reset Dismissed Alerts
                    </button>
                  )}
                </div>
                {vehicles.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 text-zinc-500 text-center">
                    No vehicle data found in the spreadsheet.
                  </div>
                ) : (
                  vehicles.map((v, i) => {
                    const vehicleJobs = upcomingServices.filter(
                      job => job.vehicle === v.name && !dismissedAlerts[`${job.vehicle}-${job.serviceType}`]
                    );
                    const hasOverdue = vehicleJobs.some(job => job.remainingKm < 0);
                    const hasDueSoon = vehicleJobs.some(job => job.remainingKm >= 0 && job.remainingKm <= 500);

                    let animationClass = "border-zinc-800 hover:border-zinc-700";
                    if (hasOverdue) animationClass = "border-rose-500/50 animate-pulse-red hover:border-rose-400 shadow-lg shadow-rose-900/20";
                    else if (hasDueSoon) animationClass = "border-amber-500/50 animate-pulse-orange hover:border-amber-400 shadow-lg shadow-amber-900/20";

                    return (
                      <div key={i} className={`relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-zinc-800 transition-all ${animationClass}`}>
                        {/* Background Image */}
                        {VEHICLE_IMAGES[v.name] && (
                          <div className="absolute inset-0 z-0 pointer-events-none">
                            <img src={VEHICLE_IMAGES[v.name]} alt={v.name} className="w-full h-full object-cover opacity-[0.35] transition-transform duration-700 hover:scale-[1.03]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/20"></div>
                            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/50 to-transparent"></div>
                          </div>
                        )}

                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-8">
                            <h3 className="font-bold text-2xl tracking-tight text-white drop-shadow-md">{v.name}</h3>
                            <a href={`/vehicle/${encodeURIComponent(v.name)}`} className="text-xs font-semibold text-zinc-300 bg-zinc-800/90 backdrop-blur-md px-4 py-2 rounded-xl border border-zinc-700/50 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-all shadow-xl">
                              View History &rarr;
                            </a>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-2">
                            <div className="space-y-1 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/50 backdrop-blur-sm">
                              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Current Mileage</span>
                              <p className="font-mono text-xl text-zinc-200">{v.currentMileage > 0 ? v.currentMileage.toLocaleString() : '--'} <span className="text-sm text-zinc-500">KM</span></p>
                            </div>
                            <div className="space-y-1 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/50 backdrop-blur-sm">
                              <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Tracked Services</span>
                              <p className="font-mono text-xl text-blue-400">{Object.keys(v.services).length}</p>
                            </div>
                          </div>

                          {/* Embedded Action Required */}
                          {vehicleJobs.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-zinc-800/60 space-y-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Wrench className={`w-5 h-5 ${hasOverdue ? 'text-rose-400' : 'text-amber-400'}`} />
                                <span className="text-sm font-bold text-white uppercase tracking-wider">Action Required</span>
                              </div>

                              <div className="space-y-3">
                                {vehicleJobs.map((job, j) => {
                                  const isOverdue = job.remainingKm < 0;
                                  const alertId = `${job.vehicle}-${job.serviceType}`;

                                  return (
                                    <div key={j} className={`p-4 rounded-2xl border ${isOverdue ? 'border-rose-900/60 bg-rose-950/40 text-rose-200' : 'border-amber-900/60 bg-amber-950/40 text-amber-200'} flex flex-col gap-2 relative overflow-hidden group/alert shadow-lg backdrop-blur-md`}>
                                      <div className={`absolute top-0 left-0 w-1.5 h-full ${isOverdue ? 'bg-rose-500' : 'bg-amber-500'}`}></div>

                                      {/* Dismiss Button */}
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          const newDismissals = { ...dismissedAlerts, [alertId]: Date.now() };
                                          setDismissedAlerts(newDismissals);
                                          localStorage.setItem("vehicle_dismissals", JSON.stringify(newDismissals));
                                        }}
                                        className="absolute top-2 right-2 text-zinc-400 hover:text-white opacity-0 group-hover/alert:opacity-100 transition-opacity bg-zinc-900/90 rounded-lg p-1.5 backdrop-blur-md border border-zinc-700 shadow-md"
                                        title="Dismiss Alert"
                                      >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                      </button>

                                      <div className="flex justify-between items-start pl-3 pr-8">
                                        <div>
                                          <p className="font-bold text-base tracking-tight">
                                            {job.serviceType}
                                          </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <p className={`text-sm font-mono font-bold ${isOverdue ? 'text-rose-400' : 'text-amber-400'}`}>
                                            {isOverdue ? 'OVERDUE' : 'DUE SOON'} <span className="opacity-60 text-xs font-normal ml-1">@ {job.nextDue.toLocaleString()} KM</span>
                                          </p>
                                          <p className="text-xs opacity-70 mt-1 font-medium bg-black/20 inline-block px-2 py-0.5 rounded-md">
                                            {isOverdue ? Math.abs(job.remainingKm).toLocaleString() + ' KM ago' : 'in ' + job.remainingKm.toLocaleString() + ' KM'}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Last Service Details Summarized Inline */}
                                      {(job.details || job.workshop || (job.cost && job.cost !== "0")) && (
                                        <div className="pl-3 pr-8 mt-3 text-xs opacity-90 border-t border-white/10 pt-3 space-y-1.5 font-medium">
                                          {job.workshop && <p className="flex items-center gap-1.5"><span className="opacity-60">Workshop:</span> {job.workshop}</p>}
                                          {job.details && <p className="line-clamp-2 flex items-start gap-1.5"><span className="opacity-60">Notes:</span> <span>{job.details}</span></p>}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </section>

              {/* The Action Required section has been migrated into the Vehicle Cards directly */}
            </div>

            {/* Recent Logs Summary */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                Recent Maintenance
              </h2>
              <div className="space-y-3">
                {records.slice(-10).reverse().map((record, i) => (
                  <div key={i} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 group hover:bg-zinc-900/80 transition-all">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 overflow-hidden pr-4">
                        <p className="font-medium text-sm text-zinc-200 truncate">{record.serviceType}</p>
                        <p className="text-xs text-zinc-500 truncate">{record.vehicle}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-emerald-400">
                          {record.cost && record.cost !== '0' ? `RM ${record.cost}` : '--'}
                        </p>
                        <p className="text-xs text-zinc-500 flex items-center justify-end gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {record.dateDone}
                        </p>
                      </div>
                    </div>

                    {/* Expandable Details for Recent Record */}
                    {(record.details || record.workshop || record.receipt) && (
                      <div className="mt-3 pt-3 border-t border-zinc-800/50">
                        <details className="text-xs text-zinc-400 outline-none [&_summary::-webkit-details-marker]:hidden group/details">
                          <summary className="cursor-pointer text-zinc-500 hover:text-emerald-400 w-fit select-none outline-none flex items-center gap-1 transition-colors">
                            <span className="text-[10px] transform transition-transform group-open/details:rotate-90">▶</span>
                            View Service Details
                          </summary>
                          <div className="mt-3 p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/80 space-y-1.5 font-medium">
                            {record.workshop && <p><span className="text-zinc-500 w-16 inline-block">Location:</span> <span className="text-zinc-300">{record.workshop}</span></p>}
                            {record.details && <p><span className="text-zinc-500 w-16 inline-block shrink-0 flex-shrink-0 align-top">Notes:</span> <span className="text-zinc-300 leading-relaxed inline-block w-[calc(100%-4rem)]">{record.details}</span></p>}
                            {record.receipt && (
                              <a href={record.receipt} target="_blank" rel="noreferrer" className="text-emerald-500 hover:text-emerald-400 hover:underline flex items-center gap-1 mt-3 w-fit bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>
                                Open Attached Receipt
                              </a>
                            )}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
