"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Loader2, Plus, LogOut, Moon, Sun, Monitor, AlertCircle, Wrench, Calendar, Car, Bike, Settings, Clock, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { useTheme } from "@/components/ThemeProvider";
import { AnimatedLoader } from "@/components/AnimatedLoader";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700/50 shadow-inner">
      <button onClick={() => setTheme("light")} className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-white text-amber-500 shadow-md dark:bg-zinc-700 dark:text-amber-400' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}`} title="Force Light Mode">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
      </button>
      <button onClick={() => setTheme("system")} className={`p-1.5 rounded-lg transition-all ${theme === 'system' ? 'bg-white text-emerald-500 shadow-md dark:bg-zinc-700 dark:text-emerald-400' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}`} title="Match OS System">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
      </button>
      <button onClick={() => setTheme("dark")} className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-white text-indigo-500 shadow-md dark:bg-zinc-700 dark:text-indigo-400' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}`} title="Force Dark Mode">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
      </button>
    </div>
  );
}

// Static Image Mapping based on typical generated filenames
const VEHICLE_IMAGES: Record<string, string> = {
  "Honda City WXE7539": "/honda_city.png",
  "Yamaha Y16ZR VKB6835": "/yamaha_y16zr.png"
};

const CAR_COLORS = [
  "#ffffff", // White
  "#000000", // Black
  "#94a3b8", // Silver/Light Gray
  "#64748b", // Dark Gray
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#78350f", // Brown
  "#22c55e"  // Green
];

export default function Home() {
  const { data: session, status } = useSession();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, number>>({});

  const [showManageModal, setShowManageModal] = useState(false);
  const [isManageModalClosing, setIsManageModalClosing] = useState(false);
  const [dynamicVehicles, setDynamicVehicles] = useState<any[]>([]);
  const [newVehicleName, setNewVehicleName] = useState("");
  const [newVehicleType, setNewVehicleType] = useState("Car");
  const [newVehicleColor, setNewVehicleColor] = useState(CAR_COLORS[4]); // Default to Blue
  const [modalLoading, setModalLoading] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
  const [vehicleToEdit, setVehicleToEdit] = useState<string | null>(null);

  // Flash Screen States for Adding/Updating/Deleting Vehicles
  const [flash, setFlash] = useState<{ show: boolean; type: "idle" | "saving" | "deleting" | "success" | "deleted" | "error" }>({ show: false, type: "idle" });
  const [errorMsg, setErrorMsg] = useState("");

  // Voluntary Mileage Update States
  const [showMileageModal, setShowMileageModal] = useState(false);
  const [isMileageModalClosing, setIsMileageModalClosing] = useState(false);
  const [mileageTarget, setMileageTarget] = useState<any>(null);
  const [newMileage, setNewMileage] = useState("");
  const [mileageLoading, setMileageLoading] = useState(false);

  const openManageModal = () => {
    setShowManageModal(true);
    setIsManageModalClosing(false);
  };

  const closeManageModal = () => {
    setIsManageModalClosing(true);
    setTimeout(() => {
      setShowManageModal(false);
      setIsManageModalClosing(false);
    }, 300);
  };

  const openMileageModal = (vehicle: any) => {
    setMileageTarget(vehicle);
    setNewMileage(vehicle.currentMileage?.toString() || "");
    setShowMileageModal(true);
    setIsMileageModalClosing(false);
  };

  const closeMileageModal = () => {
    setIsMileageModalClosing(true);
    setTimeout(() => {
      setShowMileageModal(false);
      setIsMileageModalClosing(false);
      setMileageTarget(null);
    }, 300);
  };

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

      fetch("/api/vehicles", {
        headers: { "Authorization": `Bearer ${(session as any).accessToken}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.vehicles) setDynamicVehicles(data.vehicles);
        })
        .catch(console.error);

    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);

  const handleSaveVehicle = async () => {
    if (!newVehicleName.trim()) return;
    setModalLoading(true);
    // User requested modal to NOT auto-close, so we keep it open under the flash screen
    setFlash({ show: true, type: "saving" });
    setErrorMsg("");

    try {
      const formData = new FormData();
      if (vehicleToEdit) formData.append("originalName", vehicleToEdit);
      formData.append("vehicleName", newVehicleName.trim());
      formData.append("vehicleType", newVehicleType);
      formData.append("color", newVehicleColor);

      const method = vehicleToEdit ? "PUT" : "POST";
      const res = await fetch("/api/vehicles", {
        method,
        headers: {
          "Authorization": `Bearer ${(session as any).accessToken}`
        },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (vehicleToEdit) {
          setDynamicVehicles(dynamicVehicles.map(v => v.name === vehicleToEdit ? data.vehicle : v));
          if (vehicleToEdit !== newVehicleName.trim()) {
            setRecords(records.map(r => r.vehicle === vehicleToEdit ? { ...r, vehicle: newVehicleName.trim() } : r));
          }
        } else {
          setDynamicVehicles([...dynamicVehicles, data.vehicle]);
        }

        // Ensure success screen happens before resetting form
        setFlash({ show: true, type: "success" });
        setTimeout(() => {
          setNewVehicleName("");
          setNewVehicleColor(CAR_COLORS[4]);
          setNewVehicleType("Car");
          setVehicleToEdit(null);
          setFlash(prev => ({ ...prev, show: false }));
        }, 2000);

      } else {
        const errorData = await res.json().catch(async () => ({ error: await res.text() }));
        if (errorData.error && errorData.error.includes("insufficient authentication scopes")) {
          setErrorMsg("Google needs Spreadsheet permissions across your account. Re-login and check the boxes.");
        } else {
          setErrorMsg(`Save failed: ${errorData.error || "Unknown error"}`);
        }
        setFlash({ show: true, type: "error" });
        setTimeout(() => {
          setFlash(prev => ({ ...prev, show: false }));
        }, 3000);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(`Connection Error: ${e.message}`);
      setFlash({ show: true, type: "error" });
      setTimeout(() => {
        setFlash(prev => ({ ...prev, show: false }));
      }, 3000);
    } finally {
      setModalLoading(false);
    }
  };

  const startEditVehicle = (v: any) => {
    setVehicleToEdit(v.name);
    setNewVehicleName(v.name);
    setNewVehicleType(v.type);
    setNewVehicleColor(v.color || CAR_COLORS[4]);
  };

  const cancelEdit = () => {
    setVehicleToEdit(null);
    setNewVehicleName("");
    setNewVehicleColor(CAR_COLORS[4]);
    setNewVehicleType("Car");
  };

  const handleUpdateMileage = async () => {
    if (!mileageTarget || !newMileage.trim()) return;
    const mileageNum = parseInt(newMileage.replace(/,/g, ''), 10);
    if (isNaN(mileageNum) || mileageNum <= (mileageTarget.currentMileage || 0)) {
      setErrorMsg("Mileage must be a valid number greater than current mileage.");
      setFlash({ show: true, type: "error" });
      setTimeout(() => setFlash(prev => ({ ...prev, show: false })), 3000);
      return;
    }

    setMileageLoading(true);
    closeMileageModal(); // Hide modal
    setFlash({ show: true, type: "saving" }); // Show loading flash overlay
    setErrorMsg("");

    try {
      const payload = {
        vehicleType: mileageTarget.name,
        serviceType: "Mileage Check",
        dateDone: new Date().toLocaleDateString("en-GB"),
        lastMileage: mileageNum.toString(),
        workshop: "Driver (Voluntary)",
        cost: "0",
        remark: "Voluntary mileage check to calculate dashboard intervals."
      };

      const res = await fetch("/api/records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(session as any).accessToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Fetch fresh records to guarantee dashboard consistency
        fetch("/api/records", { headers: { "Authorization": `Bearer ${(session as any).accessToken}` } })
          .then(r => r.json())
          .then(d => {
            if (d.records) setRecords(d.records);
          })
          .catch(console.error);

        setFlash({ show: true, type: "success" });
        setTimeout(() => {
          setFlash(prev => ({ ...prev, show: false }));
        }, 2000);
      } else {
        const errorText = await res.text();
        setErrorMsg(`Failed update: ${errorText}`);
        setFlash({ show: true, type: "error" });
        setTimeout(() => setFlash(prev => ({ ...prev, show: false })), 3000);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(`Connection Error: ${e.message}`);
      setFlash({ show: true, type: "error" });
      setTimeout(() => setFlash(prev => ({ ...prev, show: false })), 3000);
    } finally {
      setMileageLoading(false);
    }
  };

  const handleDeleteVehicle = async () => {
    if (!vehicleToDelete) return;
    setModalLoading(true);
    setFlash({ show: true, type: "deleting" });
    setErrorMsg("");

    try {
      const res = await fetch("/api/vehicles", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(session as any).accessToken}`
        },
        body: JSON.stringify({ vehicleName: vehicleToDelete })
      });
      if (res.ok) {
        setDynamicVehicles(dynamicVehicles.filter(v => v.name !== vehicleToDelete));
        setFlash({ show: true, type: "deleted" });
        setTimeout(() => {
          setVehicleToDelete(null);
          setFlash(prev => ({ ...prev, show: false }));
        }, 2000);
      } else {
        const errorText = await res.text();
        setErrorMsg(`Deletion failed: ${errorText}`);
        setFlash({ show: true, type: "error" });
        setTimeout(() => {
          setFlash(prev => ({ ...prev, show: false }));
        }, 3000);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(`Connection Error: ${e.message}`);
      setFlash({ show: true, type: "error" });
      setTimeout(() => {
        setFlash(prev => ({ ...prev, show: false }));
      }, 3000);
    } finally {
      setModalLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
        <AnimatedLoader />
        <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">Initializing Garage...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 transition-colors">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">VehicleTracker</h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg">Manage your maintenance logs securely with Google Drive.</p>
          </div>
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-3 bg-zinc-900 text-white dark:bg-white dark:text-black font-semibold py-4 px-8 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all duration-200 active:scale-[0.98] shadow-lg"
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

  // Pre-fill with all dynamic vehicles so even those without records show up
  const initialVehicleData = dynamicVehicles.reduce((acc, v) => {
    if (v && v.name) {
      acc[v.name] = { name: v.name, color: v.color, type: v.type, currentMileage: 0, services: {} };
    }
    return acc;
  }, {} as Record<string, any>);

  // Advanced extraction: track latest overall mileage AND latest record per service type
  const vehicleData = records.reduce((acc, record) => {
    if (!record.vehicle || record.vehicle === "Unknown Vehicle") return acc;

    // Only process records for vehicles that are currently tracked
    if (!acc[record.vehicle]) {
      return acc;
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
  }, initialVehicleData);

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl shadow-sm dark:shadow-none">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Dashboard
              <ThemeToggle />
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Welcome back, {session.user?.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4 md:mt-0">
            <button onClick={openManageModal} className="px-4 py-2 sm:px-5 sm:py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white font-medium rounded-xl transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm">
              Manage Vehicles
            </button>
            <a href="/record/new" className="px-4 py-2 sm:px-5 sm:py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-md shadow-blue-500/20 whitespace-nowrap">
              + New Record
            </a>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 ml-auto sm:ml-0"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <AnimatedLoader />
            <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">Parsing Records...</p>
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
                      className="text-xs font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors bg-zinc-200/50 dark:bg-zinc-900/80 border border-zinc-300 dark:border-zinc-800 px-3 py-1.5 rounded-lg"
                    >
                      Reset Dismissed Alerts
                    </button>
                  )}
                </div>
                {vehicles.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 text-zinc-500 text-center shadow-sm">
                    No vehicle data found in the spreadsheet.
                  </div>
                ) : (
                  vehicles.map((v, i) => {
                    const vehicleJobs = upcomingServices.filter(
                      job => job.vehicle === v.name && !dismissedAlerts[`${job.vehicle}-${job.serviceType}`]
                    );
                    const hasOverdue = vehicleJobs.some(job => job.remainingKm < 0);
                    const hasDueSoon = vehicleJobs.some(job => job.remainingKm >= 0 && job.remainingKm <= 500);

                    let animationClass = "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700";
                    if (hasOverdue) animationClass = "border-rose-300 dark:border-rose-500/50 animate-pulse-red hover:border-rose-400 shadow-lg shadow-rose-900/20";
                    else if (hasDueSoon) animationClass = "border-amber-300 dark:border-amber-500/50 animate-pulse-orange hover:border-amber-400 shadow-lg shadow-amber-900/20";

                    return (
                      <div key={i} className={`relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900/60 border transition-all shadow-md dark:shadow-none ${animationClass}`}>
                        {/* Background Image & Overlay */}
                        <div className="absolute inset-0 z-0 pointer-events-none bg-zinc-50 dark:bg-zinc-950 overflow-hidden rounded-3xl">
                          <div
                            className="absolute inset-0 opacity-80 dark:opacity-70 transition-all duration-700 group-hover:opacity-100 dark:group-hover:opacity-90"
                            style={{ background: `radial-gradient(circle at top left, ${v.color || '#3b82f6'} 0%, transparent 80%)` }}
                          ></div>
                          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-zinc-950 via-white/30 dark:via-zinc-950/60 to-transparent"></div>
                          <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-zinc-950 via-white/20 dark:via-zinc-950/40 to-transparent"></div>
                        </div>

                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-8">
                            <h3 className="font-bold text-2xl tracking-tight text-zinc-900 dark:text-white drop-shadow-sm dark:drop-shadow-md">{v.name}</h3>
                            <a href={`/vehicle/${encodeURIComponent(v.name)}`} className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-white/80 dark:bg-zinc-800/90 backdrop-blur-md px-4 py-2 rounded-xl border border-zinc-300/50 dark:border-zinc-700/50 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all shadow-md dark:shadow-xl">
                              View History &rarr;
                            </a>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-2">
                            <div className="space-y-1 bg-white/40 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm">
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">Current Mileage</span>
                              <div className="flex items-center justify-between">
                                <p className="font-mono text-xl text-zinc-800 dark:text-zinc-200">{v.currentMileage > 0 ? v.currentMileage.toLocaleString() : '--'} <span className="text-sm text-zinc-500">KM</span></p>
                                <button
                                  onClick={() => openMileageModal(v)}
                                  className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-800/40 px-2 py-1 rounded-md transition-colors border border-blue-200 dark:border-blue-800/50"
                                >
                                  Update
                                </button>
                              </div>
                            </div>
                            <div className="space-y-1 bg-white/40 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm">
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">Tracked Services</span>
                              <p className="font-mono text-xl text-blue-600 dark:text-blue-400">{Object.keys(v.services).length}</p>
                            </div>
                          </div>

                          {/* Embedded Action Required */}
                          {vehicleJobs.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Wrench className={`w-5 h-5 ${hasOverdue ? 'text-rose-500 dark:text-rose-400' : 'text-amber-500 dark:text-amber-400'}`} />
                                <span className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Action Required</span>
                              </div>

                              <div className="space-y-3">
                                {vehicleJobs.map((job, j) => {
                                  const isOverdue = job.remainingKm < 0;
                                  const alertId = `${job.vehicle}-${job.serviceType}`;

                                  return (
                                    <div key={j} className={`p-4 rounded-2xl border ${isOverdue ? 'border-rose-200/60 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200' : 'border-amber-200/60 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200'} flex flex-col gap-2 relative overflow-hidden group/alert shadow-sm dark:shadow-lg backdrop-blur-md`}>
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
                                        className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white opacity-0 group-hover/alert:opacity-100 transition-opacity bg-white/90 dark:bg-zinc-900/90 rounded-lg p-1.5 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 shadow-sm"
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
                                          <p className={`text-sm font-mono font-bold ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                            {isOverdue ? 'OVERDUE' : 'DUE SOON'} <span className="opacity-80 dark:opacity-60 text-xs font-normal ml-1">@ {job.nextDue.toLocaleString()} KM</span>
                                          </p>
                                          <p className={`text-xs opacity-90 mt-1 font-medium inline-block px-2 py-0.5 rounded-md border ${isOverdue ? 'bg-rose-100/50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-900/50' : 'bg-amber-100/50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-900/50'}`}>
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
                  <div key={i} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/30 group hover:bg-zinc-50 dark:hover:bg-zinc-900/80 transition-all shadow-sm dark:shadow-none">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1 overflow-hidden pr-4">
                        <p className="font-medium text-sm text-zinc-900 dark:text-zinc-200 truncate">{record.serviceType}</p>
                        <p className="text-xs text-zinc-500 truncate">{record.vehicle}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
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
                      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/50">
                        <details className="text-xs text-zinc-600 dark:text-zinc-400 outline-none [&_summary::-webkit-details-marker]:hidden group/details">
                          <summary className="cursor-pointer text-zinc-500 hover:text-emerald-600 dark:hover:text-emerald-400 w-fit select-none outline-none flex items-center gap-1 transition-colors">
                            <span className="text-[10px] transform transition-transform group-open/details:rotate-90">▶</span>
                            View Service Details
                          </summary>
                          <div className="mt-3 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/80 dark:border-zinc-800/80 space-y-1.5 font-medium">
                            {record.workshop && <p><span className="text-zinc-500 w-16 inline-block">Location:</span> <span className="text-zinc-700 dark:text-zinc-300">{record.workshop}</span></p>}
                            {record.details && <p><span className="text-zinc-500 w-16 inline-block shrink-0 flex-shrink-0 align-top">Notes:</span> <span className="text-zinc-700 dark:text-zinc-300 leading-relaxed inline-block w-[calc(100%-4rem)]">{record.details}</span></p>}
                            {record.receipt && (
                              <a href={record.receipt} target="_blank" rel="noreferrer" className="text-emerald-600 dark:text-emerald-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:underline flex items-center gap-1 mt-3 w-fit bg-emerald-500/10 px-3 py-1.5 rounded-md border border-emerald-500/20">
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

      {/* Manage Vehicles Modal */}
      {showManageModal && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${isManageModalClosing ? 'bg-black/0 backdrop-blur-none opacity-0' : 'bg-black/60 backdrop-blur-sm opacity-100'}`}>

          {/* Deletion Confirmation Sub-Modal Overlay */}
          {vehicleToDelete && !flash.show && (
            <div className={`absolute inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 transition-all duration-300`}>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-xl dark:shadow-2xl relative animate-in zoom-in-95 duration-200">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Remove Vehicle?</h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Are you sure you want to remove <strong className="text-zinc-800 dark:text-zinc-200">{vehicleToDelete}</strong>? This will remove it from all menus, but your past maintenance records won't be deleted.
                  </p>
                </div>
                <div className="flex border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/50">
                  <button
                    onClick={() => setVehicleToDelete(null)}
                    disabled={modalLoading}
                    className="flex-1 px-4 py-3 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteVehicle}
                    disabled={modalLoading}
                    className="flex-1 px-4 py-3 text-sm font-semibold text-rose-600 dark:text-rose-500 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 transition-colors border-l border-zinc-200 dark:border-zinc-800/80 flex items-center justify-center gap-2"
                  >
                    {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Remove"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl dark:shadow-2xl flex flex-col max-h-[90vh] transition-all duration-300 ease-in-out ${isManageModalClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
                <Car className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                Manage Vehicles
              </h3>
              <button
                onClick={() => { closeManageModal(); cancelEdit(); }}
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors p-1"
                disabled={modalLoading}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto overflow-x-hidden space-y-6">
              {/* Add New */}
              <div className="flex flex-col gap-3 relative z-10 bg-zinc-50 dark:bg-zinc-950/30 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80">
                <input
                  type="text"
                  value={newVehicleName}
                  onChange={(e) => setNewVehicleName(e.target.value)}
                  placeholder="Vehicle Name (e.g. Toyota Corolla)"
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg p-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                />

                <div className="flex gap-3">
                  {/* Stacked Vertical Control for Vehicle Type */}
                  <div className="flex flex-col gap-2 shrink-0 w-32">
                    <button
                      type="button"
                      onClick={() => setNewVehicleType("Car")}
                      className={`px-4 py-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${newVehicleType === "Car"
                        ? "bg-blue-600 text-white shadow-md scale-105 z-10"
                        : "bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        }`}
                    >
                      <Car className="w-4 h-4" />
                      Car
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewVehicleType("Motorcycle")}
                      className={`px-4 py-3 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${newVehicleType === "Motorcycle"
                        ? "bg-blue-600 text-white shadow-md scale-105 z-10"
                        : "bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                        }`}
                    >
                      <Bike className="w-4 h-4" />
                      Bike
                    </button>
                  </div>

                  <div className="flex-1 grid grid-cols-4 gap-2">
                    {CAR_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewVehicleColor(color)}
                        className={`h-11 w-full rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950 ${newVehicleColor === color
                          ? 'ring-2 ring-zinc-800 dark:ring-white scale-105 z-10'
                          : 'ring-1 ring-zinc-200 dark:ring-zinc-700/50 hover:scale-105 hover:ring-zinc-400 dark:hover:ring-zinc-500'
                          }`}
                        style={{ backgroundColor: color }}
                        aria-label={`Select color ${color}`}
                        title={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 w-full mt-1">
                  {vehicleToEdit && (
                    <button
                      onClick={cancelEdit}
                      disabled={modalLoading}
                      className="flex-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium rounded-lg p-3 text-sm transition-colors flex items-center justify-center"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={handleSaveVehicle}
                    disabled={modalLoading || !newVehicleName.trim()}
                    className={`${vehicleToEdit ? 'flex-1' : 'w-full'} bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg p-3 text-sm transition-colors flex items-center justify-center relative overflow-hidden`}
                  >
                    <span className={`transition-all duration-300 ${modalLoading && newVehicleName.trim() ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                      {vehicleToEdit ? "Save Changes" : "Add to Garage"}
                    </span>
                    {modalLoading && newVehicleName.trim() && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="space-y-2 pb-4">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Your Vehicles</p>
                {dynamicVehicles.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg border border-zinc-200 dark:border-zinc-800/50">No vehicles tracked yet.</p>
                ) : (
                  dynamicVehicles.map((v, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-md border border-zinc-300 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-inner"
                          style={{ backgroundColor: v.color || "#3b82f6" }}
                        >
                          {v.type === "Motorcycle" ? (
                            <Bike className="w-5 h-5 text-white/90 drop-shadow-md" />
                          ) : (
                            <Car className="w-5 h-5 text-white/90 drop-shadow-md" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{v.name}</span>
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{v.type}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => startEditVehicle(v)}
                          disabled={modalLoading || vehicleToEdit === v.name}
                          className="text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded-lg transition-all"
                          title="Edit vehicle"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                        </button>
                        <button
                          onClick={() => setVehicleToDelete(v.name)}
                          disabled={modalLoading || vehicleToEdit === v.name}
                          className="text-rose-500/70 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-400/10 p-2 rounded-lg transition-all"
                          title="Remove tracking"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voluntary Mileage Update Modal */}
      {showMileageModal && mileageTarget && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ease-in-out ${isMileageModalClosing ? 'bg-black/0 backdrop-blur-none opacity-0' : 'bg-black/60 backdrop-blur-sm opacity-100'}`}>
          <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-xl dark:shadow-2xl flex flex-col transition-all duration-300 ease-in-out ${isMileageModalClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Update Mileage
              </h3>
              <button
                onClick={closeMileageModal}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-1"
                disabled={mileageLoading}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                You are updating the mileage for <strong className="text-zinc-900 dark:text-white">{mileageTarget.name}</strong>. This forces a recalculation of your upcoming services.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">New Odometer Reading (KM)</label>
                <input
                  type="number"
                  value={newMileage}
                  onChange={(e) => setNewMileage(e.target.value)}
                  placeholder="e.g. 50500"
                  className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl p-3.5 text-lg font-mono text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-inner"
                  autoFocus
                />
              </div>

              <button
                onClick={handleUpdateMileage}
                disabled={mileageLoading || !newMileage || parseInt(newMileage) <= (mileageTarget.currentMileage || 0)}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-xl p-3.5 transition-colors flex items-center justify-center relative overflow-hidden mt-2"
              >
                <span className={`transition-all duration-300 ${mileageLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                  Confirm Mileage
                </span>
                {mileageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Flash Screen Overlay (Injected for Saving/Updating/Deleting Vehicles) */}
      <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center backdrop-blur-xl transition-all duration-500 ease-in-out ${flash.show ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-105'
        } ${flash.type === "saving" || flash.type === "deleting" ? "bg-white/95 dark:bg-zinc-900/95 bg-gradient-to-br from-orange-500/95 to-amber-600/95 dark:from-orange-900/95 dark:to-orange-950/95" :
          flash.type === "success" ? "bg-white/95 dark:bg-zinc-900/95 bg-gradient-to-br from-emerald-500/95 to-teal-600/95 dark:from-emerald-900/95 dark:to-teal-950/95" :
            flash.type === "deleted" || flash.type === "error" ? "bg-white/95 dark:bg-zinc-900/95 bg-gradient-to-br from-rose-500/95 to-red-600/95 dark:from-rose-900/95 dark:to-red-950/95" : "bg-transparent"
        }`}>

        {(flash.type === "saving" || flash.type === "deleting") && (
          <div className={`flex flex-col items-center animate-in zoom-in duration-500`}>
            <div className="w-28 h-28 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(255,255,255,0.3)] dark:shadow-[0_0_50px_rgba(255,255,255,0.1)] relative overflow-hidden ring-4 ring-white/30 dark:ring-transparent">
              <Clock className="w-14 h-14 text-white dark:text-orange-200 animate-[spin_3s_linear_infinite]" />
              <div className="absolute inset-0 border-4 border-white/50 dark:border-orange-400/30 rounded-full border-t-white animate-spin"></div>
            </div>
            <h2 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">{flash.type === "saving" ? "Writing to Database..." : "Removing Vehicle..."}</h2>
            <p className="text-orange-50 dark:text-orange-200 mt-3 font-medium text-lg animate-pulse">Syncing with Garage</p>
          </div>
        )}

        {flash.type === "success" && (
          <div className={`flex flex-col items-center animate-in zoom-in slide-in-from-bottom-4 duration-500 spring-bounce`}>
            <div className="w-28 h-28 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(255,255,255,0.3)] dark:shadow-[0_0_50px_rgba(16,185,129,0.4)] ring-4 ring-white/50 dark:ring-emerald-400/50">
              <CheckCircle2 className="w-16 h-16 text-white dark:text-emerald-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-[bounce_1s_ease-in-out_infinite]" />
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-3 drop-shadow-lg">{vehicleToEdit ? "Vehicle Updated!" : "Vehicle Added!"}</h2>
            <p className="text-emerald-50 dark:text-emerald-100 font-semibold text-lg drop-shadow-md">Returning to dashboard...</p>
          </div>
        )}

        {flash.type === "deleted" && (
          <div className={`flex flex-col items-center animate-in zoom-in slide-in-from-top-4 duration-500 spring-bounce`}>
            <div className="w-28 h-28 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(255,255,255,0.3)] dark:shadow-[0_0_50px_rgba(244,63,94,0.4)] ring-4 ring-white/50 dark:ring-rose-400/50">
              <Trash2 className="w-16 h-16 text-white dark:text-rose-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-[bounce_1s_ease-in-out_infinite]" />
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-3 drop-shadow-lg">Vehicle Deleted</h2>
            <p className="text-rose-50 dark:text-rose-100 font-semibold text-lg drop-shadow-md">Removed from your garage.</p>
          </div>
        )}

        {flash.type === "error" && (
          <div className={`flex flex-col items-center animate-in shake duration-300`}>
            <div className="w-28 h-28 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(255,255,255,0.3)] dark:shadow-[0_0_50px_rgba(244,63,94,0.4)] ring-4 ring-white/50 dark:ring-rose-400/50">
              <XCircle className="w-16 h-16 text-white dark:text-rose-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-[ping_1.5s_ease-in-out_infinite]" />
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-3 drop-shadow-lg">Action Failed</h2>
            <p className="text-rose-50 dark:text-rose-100 font-semibold text-lg max-w-sm text-center bg-rose-900/40 dark:bg-rose-950/50 p-4 rounded-xl border border-white/20 dark:border-rose-500/30 backdrop-blur-md">{errorMsg}</p>
          </div>
        )}
      </div>

    </div>
  );
}
