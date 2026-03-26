"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Loader2, Plus, LogOut, Moon, Sun, Monitor, AlertCircle, Wrench, Calendar, CalendarCheck, PenLine, Car, Bike, Settings, Clock, CheckCircle2, XCircle, Trash2, Search, EyeOff, Camera, ChevronDown, ShieldCheck, Gauge, MessageSquare, AlertTriangle, X } from 'lucide-react';
import { LaunchingScreen } from "@/components/LaunchingScreen";
import { useTheme } from "@/components/ThemeProvider";
import { AnimatedLoader } from "@/components/AnimatedLoader";
import { PushSubscriber } from "@/components/PushSubscriber";
import { AnimatedCheck, AnimatedX, AnimatedTrash, AnimatedClock, AnimatedCalendarCheck, AnimatedPenLine, AnimatedOdometer, AnimatedSpeedometer } from "@/components/AnimatedStatusIcons";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700/50 shadow-inner">
      <button onClick={() => setTheme("light")} className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-white text-amber-500 shadow-md dark:bg-zinc-700 dark:text-amber-400' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}`} title="Force Light Mode">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
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
  const [showManageModal, setShowManageModal] = useState(false);
  const [isManageModalClosing, setIsManageModalClosing] = useState(false);
  const [dynamicVehicles, setDynamicVehicles] = useState<any[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Record<string, { status: 'dismissed' | 'attended', timestamp: number }>>({});
  const [resolvingAlert, setResolvingAlert] = useState<any>(null);
  const [newVehicleName, setNewVehicleName] = useState("");
  const [newVehicleType, setNewVehicleType] = useState("Car");
  const [newVehicleColor, setNewVehicleColor] = useState(CAR_COLORS[4]); // Default to Blue
  const [newRoadtaxExpiry, setNewRoadtaxExpiry] = useState("");
  const [newInsuranceExpiry, setNewInsuranceExpiry] = useState("");
  const [newInsuranceCompany, setNewInsuranceCompany] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);
  const [vehicleToEdit, setVehicleToEdit] = useState<string | null>(null);

  // Flash Screen States for Adding/Updating/Deleting Vehicles
  const [flash, setFlash] = useState<{
    show: boolean;
    type: "idle" | "saving" | "mileage_saving" | "deleting" | "success" | "mileage_success" | "deleted" | "error" | "renewing" | "renew_success"
  }>({ show: false, type: "idle" });
  const [errorMsg, setErrorMsg] = useState("");

  // Login & Logout Animations
  const [loginFlash, setLoginFlash] = useState(false);
  const [logoutFlash, setLogoutFlash] = useState(false);

  // In-App Push Notification Fallback
  const [systemAlerts, setSystemAlerts] = useState<string[]>([]);
  const [showSystemAlert, setShowSystemAlert] = useState(false);

  // Voluntary Mileage Update States
  const [showMileageModal, setShowMileageModal] = useState(false);
  const [isMileageModalClosing, setIsMileageModalClosing] = useState(false);
  const [mileageTarget, setMileageTarget] = useState<any>(null);
  const [newMileage, setNewMileage] = useState("");
  const [mileageLoading, setMileageLoading] = useState(false);

  // Renewal States
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [isRenewModalClosing, setIsRenewModalClosing] = useState(false);
  const [renewTarget, setRenewTarget] = useState<any>(null);
  const [renewInterval, setRenewInterval] = useState<6 | 12>(12);
  const [renewCompany, setRenewCompany] = useState("");
  const [renewStartDate, setRenewStartDate] = useState("");
  const [renewLoading, setRenewLoading] = useState(false);

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
    setNewMileage("");
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

  const openRenewModal = (vehicle: any) => {
    setRenewTarget(vehicle);
    setRenewInterval(12);
    setRenewCompany(vehicle.insuranceCompany || "");
    const today = new Date();
    setRenewStartDate(new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0]);
    setShowRenewModal(true);
    setIsRenewModalClosing(false);
  };

  const closeRenewModal = () => {
    setIsRenewModalClosing(true);
    setTimeout(() => {
      setShowRenewModal(false);
      setIsRenewModalClosing(false);
      setRenewTarget(null);
    }, 300);
  };

  const [nowDate, setNowDate] = useState<Date | null>(null);

  useEffect(() => {
    setNowDate(new Date());
  }, []);

  useEffect(() => {
    if (dynamicVehicles.length > 0 && typeof window !== "undefined" && "Notification" in window) {
      const now = new Date();
      const alerts: string[] = [];
      dynamicVehicles.forEach(v => {
        const rDate = new Date(v.roadtaxExpiry);
        const iDate = new Date(v.insuranceExpiry);
        if (v.roadtaxExpiry && !isNaN(rDate.getTime()) && (rDate.getTime() - now.getTime()) / 86400000 <= 14) {
          alerts.push(`${v.name} Roadtax expires soon`);
        }
        if (v.insuranceExpiry && !isNaN(iDate.getTime()) && (iDate.getTime() - now.getTime()) / 86400000 <= 14) {
          alerts.push(`${v.name} Insurance expires soon`);
        }
      });

      if (alerts.length > 0) {
        setSystemAlerts(alerts);
        const lastNotified = localStorage.getItem("last_sys_notify");
        const todayDate = now.toDateString();

        if (lastNotified !== todayDate) {
          setShowSystemAlert(true);

          if (Notification.permission === "granted") {
            try {
              new Notification("Vehicle Maintenance App", { body: alerts.join(", "), icon: "/icon.svg" });
              localStorage.setItem("last_sys_notify", todayDate);
            } catch (e) {
              console.error("Browser obstructed direct Notification constructor:", e);
              localStorage.setItem("last_sys_notify", todayDate);
            }
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(perm => {
              if (perm === "granted") {
                try {
                  new Notification("Vehicle Maintenance App", { body: alerts.join(", "), icon: "/icon.svg" });
                } catch (e) {
                  console.error("Browser obstructed direct Notification constructor:", e);
                }
              }
              localStorage.setItem("last_sys_notify", todayDate);
            }).catch(e => console.error("Permission request failed", e));
          } else {
            // Still mark it notified so the in-app toast only shows once per day per session
            localStorage.setItem("last_sys_notify", todayDate);
          }
        }
      }
    }
  }, [dynamicVehicles]);

  useEffect(() => {
    // Load dismissed alerts from local storage purely on client
    const saved = localStorage.getItem("vehicle_dismissals");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: convert old arrays or pure numbers to the new object format if needed
        const migrated: any = {};
        Object.keys(parsed).forEach(key => {
          if (typeof parsed[key] === 'number') {
            migrated[key] = { status: 'dismissed', timestamp: parsed[key] };
          } else {
            migrated[key] = parsed[key];
          }
        });
        setDismissedAlerts(migrated as Record<string, { status: 'dismissed' | 'attended', timestamp: number }>);
      } catch (e) { }
    }

    if (session && (session as any).accessToken) {
      if (!sessionStorage.getItem("hasLoggedIn")) {
        sessionStorage.setItem("hasLoggedIn", "true");
        setLoginFlash(true);
        setTimeout(() => setLoginFlash(false), 1500); // Hide after animation
      }
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
          if (data.vehicles) {
            setDynamicVehicles(data.vehicles);
            // Sync evaluated dates straight to Vercel KV for the offline Cron engine processing layer
            fetch("/api/webpush/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ vehicles: data.vehicles })
            }).catch(console.error);
          }
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
      formData.append("roadtaxExpiry", newRoadtaxExpiry);
      formData.append("insuranceExpiry", newInsuranceExpiry);
      formData.append("insuranceCompany", newInsuranceCompany);

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
          setDynamicVehicles(dynamicVehicles.map(v => v.name === vehicleToEdit ? { ...v, ...data.vehicle } : v));
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
          setNewRoadtaxExpiry("");
          setNewInsuranceExpiry("");
          setNewInsuranceCompany("");
          setVehicleToEdit(null);
          setFlash(prev => ({ ...prev, show: false }));
          closeManageModal();
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

  const handleRenewService = async () => {
    if (!renewTarget) return;
    setRenewLoading(true);
    setFlash({ show: true, type: "renewing" });
    setErrorMsg("");

    try {
      const start = renewStartDate ? new Date(renewStartDate) : new Date();
      start.setMonth(start.getMonth() + renewInterval);
      const newDateStr = start.toISOString().split('T')[0];

      const formData = new FormData();
      formData.append("originalName", renewTarget.name);
      formData.append("vehicleName", renewTarget.name);
      formData.append("vehicleType", renewTarget.type);
      formData.append("color", renewTarget.color);
      formData.append("roadtaxExpiry", newDateStr);
      formData.append("insuranceExpiry", newDateStr);
      formData.append("insuranceCompany", renewCompany.trim());

      const res = await fetch("/api/vehicles", {
        method: "PUT",
        headers: { "Authorization": `Bearer ${(session as any).accessToken}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setDynamicVehicles(prev => prev.map(v => v.name === renewTarget.name ? { ...v, ...data.vehicle } : v));
        setFlash({ show: true, type: "renew_success" });
        setTimeout(() => {
          setFlash(prev => ({ ...prev, show: false }));
          closeRenewModal();
        }, 2000);
      } else {
        const err = await res.json().catch(() => ({ error: "Unknown" }));
        setErrorMsg(`Renewal failed: ${err.error}`);
        setFlash({ show: true, type: "error" });
        setTimeout(() => setFlash(prev => ({ ...prev, show: false })), 3000);
      }
    } catch (e: any) {
      setErrorMsg(`Connection Error: ${e.message}`);
      setFlash({ show: true, type: "error" });
      setTimeout(() => setFlash(prev => ({ ...prev, show: false })), 3000);
    } finally {
      setRenewLoading(false);
    }
  };

  const startEditVehicle = (v: any) => {
    setVehicleToEdit(v.name);
    setNewVehicleName(v.name);
    setNewVehicleType(v.type);
    setNewVehicleColor(v.color || CAR_COLORS[4]);
    setNewRoadtaxExpiry(v.roadtaxExpiry || "");
    setNewInsuranceExpiry(v.insuranceExpiry || "");
    setNewInsuranceCompany(v.insuranceCompany || "");
  };

  const cancelEdit = () => {
    setVehicleToEdit(null);
    setNewVehicleName("");
    setNewVehicleColor(CAR_COLORS[4]);
    setNewVehicleType("Car");
    setNewRoadtaxExpiry("");
    setNewInsuranceExpiry("");
    setNewInsuranceCompany("");
  };

  const handleUpdateMileage = async () => {
    if (!mileageTarget || !newMileage.trim()) return;
    const mileageNum = parseInt(newMileage.replace(/,/g, ''), 10);
    // [TEMP] Relaxed validation to allow lower values for testing
    if (isNaN(mileageNum) || mileageNum < 0) {
      setErrorMsg("Mileage must be a valid positive number.");
      setFlash({ show: true, type: "error" });
      setTimeout(() => setFlash(prev => ({ ...prev, show: false })), 3000);
      return;
    }

    setMileageLoading(true);
    closeMileageModal(); // Hide modal
    setFlash({ show: true, type: "mileage_saving" }); // Show specific mileage saving flash overlay
    setErrorMsg("");

    try {
      const res = await fetch("/api/vehicles", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${(session as any).accessToken}`
        },
        body: JSON.stringify({ vehicleName: mileageTarget.name, mileage: mileageNum })
      });

      if (res.ok) {
        // Update local vehicle state to reflect new mileage immediately
        setDynamicVehicles(prev => prev.map(v =>
          v.name === mileageTarget.name ? { ...v, mileage: mileageNum } : v
        ));

        setFlash({ show: true, type: "mileage_success" });
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
    return <LaunchingScreen />;
  }

  if (!session) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-zinc-950 p-6 relative overflow-hidden font-sans">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-blue-600/20 rounded-[100%] blur-[120px] mix-blend-screen opacity-60"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[500px] bg-indigo-500/20 rounded-[100%] blur-[100px] mix-blend-screen opacity-40"></div>

        {/* Floating UI Container */}
        <div className="relative z-10 w-full max-w-md animate-in slide-in-from-bottom-8 fade-in duration-1000 ease-out">
          {/* Glassmorphism Card */}
          <div className="bg-zinc-900/60 backdrop-blur-2xl border border-zinc-800/80 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">

            {/* Subtle inner top highlight */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

            {/* Header / Logo Icon */}
            <div className="flex justify-center mb-8 relative">
              <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="w-20 h-20 bg-gradient-to-b from-zinc-800 to-zinc-950 border border-zinc-700/50 rounded-2xl flex items-center justify-center shadow-inner relative z-10">
                <Car className="w-10 h-10 text-white drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" strokeWidth={1.5} />
              </div>
            </div>

            {/* Typography */}
            <div className="text-center space-y-3 mb-12">
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Vehicle Maintenance <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">App</span>
              </h1>
              <p className="text-zinc-400 text-sm font-medium leading-relaxed max-w-[280px] mx-auto">
                Your entire garage's maintenance history securely synced via Google Drive.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => signIn("google")}
                className="relative w-full group/btn overflow-hidden"
              >
                {/* Button Background & Hover State */}
                <div className="absolute inset-0 bg-white group-hover/btn:bg-zinc-100 transition-colors duration-300 rounded-2xl"></div>

                {/* Inner Content */}
                <div className="relative flex items-center justify-center gap-3 py-4 px-6 text-zinc-950 font-bold text-[15px] shadow-[0_4px_14px_0_rgba(255,255,255,0.1)] active:scale-[0.98] transition-all duration-200">
                  <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </div>
              </button>
            </div>
          </div>

          {/* Footer Metrics / Security Badges Container */}
          <div className="mt-8 flex items-center justify-center gap-6 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
            <div className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Sync</div>
            <div className="w-1 h-1 bg-zinc-800 rounded-full"></div>
            <div className="flex items-center gap-1.5"><Gauge className="w-4 h-4 text-blue-500" /> Fast Access</div>
          </div>

          {/* Mandatory Legal Links for Google OAuth Approval */}
          <div className="mt-8 flex items-center justify-center gap-4 text-zinc-500 text-xs font-medium">
            <a href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
            <span className="text-zinc-700">•</span>
            <a href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    );
  }

  // Pre-fill with all dynamic vehicles so even those without records show up
  const initialVehicleData = dynamicVehicles.reduce((acc, v) => {
    if (v && v.name) {
      acc[v.name] = {
        name: v.name,
        color: v.color,
        type: v.type,
        currentMileage: v.mileage || 0,
        roadtaxExpiry: v.roadtaxExpiry || "",
        insuranceExpiry: v.insuranceExpiry || "",
        insuranceCompany: v.insuranceCompany || "",
        services: {}
      };
    }
    return acc;
  }, {} as Record<string, any>);

  // Advanced extraction: track latest overall mileage AND latest record per service type
  const vehicleData = records.reduce((acc, record) => {
    if (!record.vehicle || record.vehicle === "Unknown Vehicle") return acc;

    // Only process records for vehicles that are currently tracked in the main registry
    if (!acc[record.vehicle]) {
      const dv = dynamicVehicles.find(v => v.name === record.vehicle);
      if (!dv) {
        // The vehicle was deleted from dynamicVehicles, but records remain.
        // Ignore these orphaned records so a "ghost" card isn't recreated.
        return acc;
      }
      acc[record.vehicle] = {
        name: record.vehicle,
        color: dv.color || "#3b82f6",
        type: dv.type || "Car",
        currentMileage: dv.mileage || 0,
        roadtaxExpiry: dv.roadtaxExpiry || "",
        insuranceExpiry: dv.insuranceExpiry || "",
        insuranceCompany: dv.insuranceCompany || "",
        services: {}
      };
    }

    // Update overall latest mileage
    const mileageStr = String(record.lastMileage).replace(/,/g, '');
    const mileage = parseInt(mileageStr, 10);
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
      const nextDueStr = String(service.nextServiceCalculated).replace(/,/g, '');
      const nextDue = parseInt(nextDueStr, 10);
      if (!isNaN(nextDue)) {
        const remainingKm = nextDue - v.currentMileage;
        const alertId = `${v.name}-${service.serviceType}-${nextDue}`;

        // Skip if 'attended' or 'dismissed' (snoozed)
        if (dismissedAlerts[alertId]?.status === 'attended') return;
        if (dismissedAlerts[alertId]?.status === 'dismissed') return;

        if (remainingKm !== null && !isNaN(remainingKm)) {
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
      }
    });
  });

  const handleResolveAlert = (alert: any, action: 'dismissed' | 'attended') => {
    const alertId = `${alert.vehicle}-${alert.serviceType}-${alert.nextDue}`;
    const newDismissals: Record<string, { status: 'dismissed' | 'attended', timestamp: number }> = {
      ...dismissedAlerts,
      [alertId]: { status: action, timestamp: Date.now() }
    };
    setDismissedAlerts(newDismissals);
    localStorage.setItem("vehicle_dismissals", JSON.stringify(newDismissals));
    setResolvingAlert(null);
  };

  // Sort by highest priority (lowest remaining KM)
  upcomingServices.sort((a, b) => a.remainingKm - b.remainingKm);

  const hasDismissed = Object.values(dismissedAlerts).some(a => a.status === 'dismissed');
  const hasAttended = Object.values(dismissedAlerts).some(a => a.status === 'attended');

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-8 transition-colors">
      {/* In-App Notification Toast (Mobile Fallback) */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[300] transition-all duration-500 ease-in-out w-[90vw] sm:w-[400px] ${showSystemAlert ? 'translate-y-0 opacity-100' : '-translate-y-24 opacity-0 pointer-events-none'}`}>
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl p-4 flex items-start gap-4 ring-1 ring-black/5 dark:ring-white/10">
          <div className="bg-rose-100 dark:bg-rose-500/20 p-2 rounded-xl text-rose-600 dark:text-rose-400 shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-zinc-900 dark:text-white text-sm">Action Required</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {systemAlerts.join(" • ")}
            </p>
          </div>
          <button onClick={() => setShowSystemAlert(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 -mr-2 -mt-2 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Login Flash Overlay */}
      <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-blue-600 transition-all duration-500 ease-in-out ${loginFlash ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none delay-500'}`}>
        <div className={`relative ${loginFlash ? 'animate-vroom-in' : 'opacity-0'}`}>
          <Car className="w-32 h-32 text-white fill-white/20" />
        </div>
        <h2 className={`text-3xl sm:text-4xl font-black text-white tracking-tight transition-all duration-500 delay-300 ${loginFlash ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          Logging In...
        </h2>
      </div>

      {/* Logout Flash Overlay */}
      <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-rose-600 transition-opacity duration-300 ease-in-out ${logoutFlash ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`relative ${logoutFlash ? 'animate-vroom-out' : 'opacity-0'}`}>
          <Car className="w-32 h-32 text-white fill-white/20" />
        </div>
        <h2 className={`text-3xl sm:text-4xl font-black text-white tracking-tight transition-all duration-500 ${logoutFlash ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          Logging Out...
        </h2>
      </div>

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
          <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-3 sm:gap-4 mt-6 md:mt-0">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <PushSubscriber />
              <button onClick={openManageModal} className="inline-flex items-center justify-center gap-2 flex-1 sm:flex-none px-4 sm:px-5 h-11 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white hover:bg-zinc-200 dark:hover:bg-zinc-700 font-medium text-sm rounded-xl transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm whitespace-nowrap">
                Manage Vehicles
              </button>
              <a href="/record/new" className="hidden sm:inline-flex items-center justify-center gap-2 px-5 h-11 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-xl transition-colors border border-blue-600 hover:border-blue-500 shadow-sm shadow-blue-500/20 whitespace-nowrap group">
                <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
                New Record
              </a>
            </div>
            <button
              onClick={() => {
                setLogoutFlash(true);
                sessionStorage.removeItem("hasLoggedIn");
                setTimeout(() => signOut(), 1200);
              }}
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-rose-600 hover:text-white dark:text-rose-400 bg-rose-50 hover:bg-rose-500 dark:bg-rose-500/10 dark:hover:bg-rose-600 transition-colors px-4 h-11 rounded-xl border border-rose-200 dark:border-rose-500/20 w-full sm:w-auto mt-1 sm:mt-0 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </header>

        <div className="relative min-h-[50vh]">
          <div className={`absolute inset-0 z-10 bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center transition-all duration-700 ease-in-out ${loading ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
            <AnimatedLoader />
            <p className="mt-4 text-sm font-medium text-zinc-500 dark:text-zinc-400 animate-pulse">Parsing Records...</p>
          </div>

          <div className={`transition-all duration-700 ease-in-out ${loading ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              <div className="space-y-8">
                {/* Vehicle Cards */}
                <section className="space-y-6 text-zinc-900 dark:text-zinc-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-blue-400" />
                      Upcoming Services
                    </h2>
                    <div className="flex items-center gap-2">
                      {hasDismissed && (
                        <button
                          onClick={() => {
                            const newAlerts = { ...dismissedAlerts };
                            Object.keys(newAlerts).forEach(k => {
                              if (newAlerts[k].status === 'dismissed') delete newAlerts[k];
                            });
                            setDismissedAlerts(newAlerts);
                            localStorage.setItem("vehicle_dismissals", JSON.stringify(newAlerts));
                          }}
                          className="text-[10px] font-bold text-amber-600 hover:text-amber-500 dark:text-amber-500 dark:hover:text-amber-400 transition-all bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 px-3 py-1.5 rounded-lg flex items-center gap-1.5 active:scale-95 shadow-sm"
                        >
                          <Clock className="w-3 h-3" />
                          Reset Snoozed
                        </button>
                      )}
                    </div>
                  </div>
                  {vehicles.length === 0 ? (
                    <div className="p-10 rounded-3xl border border-zinc-200 border-dashed dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/10 flex flex-col items-center justify-center text-center shadow-sm">
                      <div className="w-16 h-16 mb-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-full flex items-center justify-center">
                        <Car className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
                      </div>
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">No Vehicles Found</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
                        Your garage is empty. Add a vehicle to start tracking maintenance records, mileage, and service costs.
                      </p>
                      <button onClick={openManageModal} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors shadow-md shadow-blue-500/20">
                        Add Your First Vehicle
                      </button>
                    </div>
                  ) : (
                    vehicles.map((v, i) => {
                      const vehicleJobs = upcomingServices.filter(
                        job => job.vehicle === v.name && !dismissedAlerts[`${job.vehicle}-${job.serviceType}-${job.nextDue}`]
                      );
                      const hasOverdue = vehicleJobs.some(job => job.remainingKm < 0);
                      const hasDueSoon = vehicleJobs.some(job => job.remainingKm >= 0 && job.remainingKm <= 500);

                      const getDaysLeft = (dateStr: string) => {
                        if (!nowDate || !dateStr) return null;
                        const target = new Date(dateStr);
                        if (isNaN(target.getTime())) return null;
                        const diffTime = target.getTime() - nowDate.getTime();
                        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      };

                      const roadtaxDays = getDaysLeft(v.roadtaxExpiry);
                      const insuranceDays = getDaysLeft(v.insuranceExpiry);

                      const expiryAlerts = [];
                      if (roadtaxDays !== null && roadtaxDays <= 31 && insuranceDays !== null && insuranceDays <= 31) {
                        const minDays = Math.min(roadtaxDays, insuranceDays);
                        expiryAlerts.push({
                          type: 'Roadtax & Insurance',
                          days: minDays,
                          detail: `Roadtax: ${v.roadtaxExpiry} • Ins: ${v.insuranceExpiry} ${v.insuranceCompany ? '(' + v.insuranceCompany + ')' : ''}`
                        });
                      } else {
                        if (roadtaxDays !== null && roadtaxDays <= 31) {
                          expiryAlerts.push({ type: 'Roadtax', days: roadtaxDays, detail: v.roadtaxExpiry });
                        }
                        if (insuranceDays !== null && insuranceDays <= 31) {
                          expiryAlerts.push({ type: 'Insurance', days: insuranceDays, detail: `${v.insuranceExpiry} ${v.insuranceCompany ? '(' + v.insuranceCompany + ')' : ''}` });
                        }
                      }

                      const hasExpiryOverdue = expiryAlerts.some(a => a.days <= 0);
                      const hasExpiryCritical = expiryAlerts.some(a => a.days > 0 && a.days <= 3);
                      const hasExpiryWarning = expiryAlerts.some(a => a.days > 3 && a.days <= 14);

                      let animationClass = "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700";
                      if (hasOverdue || hasExpiryOverdue || hasExpiryCritical) animationClass = "border-rose-300 dark:border-rose-500/50 animate-pulse-red hover:border-rose-400 shadow-lg shadow-rose-900/20";
                      else if (hasDueSoon || hasExpiryWarning) animationClass = "border-amber-300 dark:border-amber-500/50 animate-pulse-orange hover:border-amber-400 shadow-lg shadow-amber-900/20";

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

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
                              <div className="space-y-1 bg-white/40 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm overflow-hidden group">
                                <div className="flex items-start justify-between gap-2">
                                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">Mileage</span>
                                  <button
                                    onClick={() => openMileageModal(v)}
                                    title="Update Mileage"
                                    className="p-1 -mt-1 -mr-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white/50 dark:bg-zinc-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-all border border-transparent hover:border-blue-200 dark:hover:border-blue-800/50 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 flex-shrink-0"
                                  >
                                    <PenLine className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="font-mono text-sm sm:text-base text-zinc-800 dark:text-zinc-200 truncate pr-1" title={v.currentMileage > 0 ? v.currentMileage.toLocaleString() + ' KM' : ''}>
                                  {v.currentMileage > 0 ? v.currentMileage.toLocaleString() : '--'} <span className="text-[10px] text-zinc-500">KM</span>
                                </p>
                              </div>
                              <div className="space-y-1 bg-white/40 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm">
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">Tracked</span>
                                <p className="font-mono text-sm sm:text-base text-blue-600 dark:text-blue-400">{Object.keys(v.services).length} <span className="text-[10px] text-zinc-500">services</span></p>
                              </div>
                              <div className="space-y-1 bg-white/40 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm">
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">Roadtax</span>
                                <p className="font-mono text-sm text-zinc-800 dark:text-zinc-200 truncate">{v.roadtaxExpiry || 'Not Set'}</p>
                              </div>
                              <div className="space-y-1 bg-white/40 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm overflow-hidden">
                                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-bold">Insurance</span>
                                <p className="font-mono text-sm text-zinc-800 dark:text-zinc-200 truncate" title={v.insuranceCompany || ""}>{v.insuranceExpiry || 'Not Set'}</p>
                              </div>
                            </div>

                            {/* Embedded Expiry Alerts */}
                            {expiryAlerts.length > 0 && (
                              <div className="mt-6 pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Clock className={`w-5 h-5 ${hasExpiryOverdue || hasExpiryCritical ? 'text-rose-500 dark:text-rose-400' : hasExpiryWarning ? 'text-amber-500 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400'}`} />
                                  <span className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Expiring Soon</span>
                                </div>
                                <div className="space-y-3">
                                  {expiryAlerts.map((alert, idx) => {
                                    const isOverdue = alert.days <= 0;
                                    const isCritical = alert.days > 0 && alert.days <= 3;
                                    const isWarning = alert.days > 3 && alert.days <= 14;
                                    const isNotice = alert.days > 14 && alert.days <= 31;

                                    let containerStyle = 'border-amber-200/60 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200';
                                    let indicatorStyle = 'bg-amber-500';
                                    let labelStyle = 'text-amber-600 dark:text-amber-400';
                                    let chipStyle = 'bg-amber-100/50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-900/50';

                                    if (isOverdue || isCritical) {
                                      containerStyle = 'border-rose-200/60 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                                      indicatorStyle = 'bg-rose-500';
                                      labelStyle = 'text-rose-600 dark:text-rose-400';
                                      chipStyle = 'bg-rose-100/50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-900/50';
                                    } else if (isNotice) {
                                      containerStyle = 'border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/80 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-200';
                                      indicatorStyle = 'bg-zinc-400 dark:bg-zinc-600';
                                      labelStyle = 'text-zinc-600 dark:text-zinc-400';
                                      chipStyle = 'bg-white/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/50';
                                    }

                                    return (
                                      <div key={`expiry-${idx}`} className={`p-4 rounded-2xl border ${containerStyle} flex flex-col gap-2 relative overflow-hidden group/alert shadow-sm dark:shadow-lg backdrop-blur-md`}>
                                        <div className={`absolute top-0 left-0 w-1.5 h-full ${indicatorStyle}`}></div>
                                        <div className="flex justify-between items-start pl-3 pr-8">
                                          <div>
                                            <p className="font-bold text-base tracking-tight">{alert.type}</p>
                                            <p className="text-xs opacity-80 mt-1 font-medium">{alert.detail}</p>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <p className={`text-sm font-mono font-bold uppercase ${labelStyle}`}>
                                              {isOverdue ? 'EXPIRED' : isCritical ? 'CRITICAL' : isWarning ? 'WARNING' : 'NOTICE'}
                                            </p>
                                            <p className={`text-xs opacity-90 mt-1 font-medium inline-block px-2 py-0.5 rounded-md border ${chipStyle}`}>
                                              {isOverdue ? Math.abs(alert.days) + ' days ago' : alert.days + ' days left'}
                                            </p>
                                            <button
                                              onClick={() => openRenewModal(v)}
                                              className="block mt-2 text-[10px] w-full font-bold bg-blue-600 hover:bg-blue-500 text-white px-2 py-1.5 rounded-lg transition-colors text-center shadow-sm whitespace-nowrap"
                                            >
                                              Renew Now
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Embedded Action Required */}
                            {vehicleJobs.length > 0 && (
                              <div className="mt-6 pt-6 border-t border-zinc-200/60 dark:border-zinc-800/60 space-y-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Wrench className={`w-5 h-5 ${hasOverdue ? 'text-rose-500 dark:text-rose-400' : hasDueSoon ? 'text-amber-500 dark:text-amber-400' : 'text-zinc-500 dark:text-zinc-400'}`} />
                                  <span className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">{hasOverdue ? 'Action Required' : 'Scheduled Services'}</span>
                                </div>

                                <div className="space-y-3">
                                  {vehicleJobs.map((job, j) => {
                                    const isOverdue = job.remainingKm < 0;
                                    const isDueSoon = job.remainingKm >= 0 && job.remainingKm <= 500;
                                    const isScheduled = job.remainingKm > 500;
                                    const alertId = `${job.vehicle}-${job.serviceType}-${job.nextDue}`;

                                    let containerStyle = 'border-amber-200/60 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200';
                                    let indicatorStyle = 'bg-amber-500';
                                    let buttonStyle = 'text-amber-500 border-amber-200 dark:border-amber-800';
                                    let labelStyle = 'text-amber-600 dark:text-amber-400';
                                    let chipStyle = 'bg-amber-100/50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-900/50';

                                    if (isOverdue) {
                                      containerStyle = 'border-rose-200/60 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                                      indicatorStyle = 'bg-rose-500';
                                      buttonStyle = 'text-rose-500 border-rose-200 dark:border-rose-800';
                                      labelStyle = 'text-rose-600 dark:text-rose-400';
                                      chipStyle = 'bg-rose-100/50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-900/50';
                                    } else if (isScheduled) {
                                      containerStyle = 'border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/80 dark:bg-zinc-900/40 text-zinc-900 dark:text-zinc-200';
                                      indicatorStyle = 'bg-zinc-400 dark:bg-zinc-600';
                                      buttonStyle = 'text-zinc-500 border-zinc-200 dark:border-zinc-700';
                                      labelStyle = 'text-zinc-600 dark:text-zinc-400';
                                      chipStyle = 'bg-white/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700/50';
                                    }

                                    return (
                                      <div key={j} className={`p-4 rounded-2xl border ${containerStyle} flex flex-col gap-2 relative overflow-hidden group/alert shadow-sm dark:shadow-lg backdrop-blur-md`}>
                                        <div className={`absolute top-0 left-0 w-1.5 h-full ${indicatorStyle}`}></div>

                                        {/* Dismiss/Resolve Button */}
                                        <button
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (isOverdue) {
                                              setResolvingAlert(job);
                                            } else {
                                              const alertId = `${job.vehicle}-${job.serviceType}-${job.nextDue}`;
                                              const newDismissals: Record<string, { status: 'dismissed' | 'attended', timestamp: number }> = {
                                                ...dismissedAlerts,
                                                [alertId]: { status: 'dismissed', timestamp: Date.now() }
                                              };
                                              setDismissedAlerts(newDismissals);
                                              localStorage.setItem("vehicle_dismissals", JSON.stringify(newDismissals));
                                            }
                                          }}
                                          className={`absolute top-2 right-2 opacity-0 group-hover/alert:opacity-100 transition-opacity bg-white/90 dark:bg-zinc-900/90 rounded-lg p-1.5 backdrop-blur-md border shadow-sm ${buttonStyle}`}
                                          title={isOverdue ? "Resolve Overdue Alert" : "Dismiss Alert"}
                                        >
                                          {isOverdue ? (
                                            <Settings className="w-4 h-4" />
                                          ) : (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                          )}
                                        </button>

                                        <div className="flex justify-between items-start pl-3 pr-8">
                                          <div>
                                            <p className="font-bold text-base tracking-tight">
                                              {job.serviceType}
                                            </p>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <p className={`text-sm font-mono font-bold uppercase ${labelStyle}`}>
                                              {isOverdue ? 'OVERDUE' : isDueSoon ? 'DUE SOON' : 'SCHEDULED'} <span className="opacity-80 dark:opacity-60 text-xs font-normal ml-1">@ {job.nextDue.toLocaleString()} KM</span>
                                            </p>
                                            <p className={`text-xs opacity-90 mt-1 font-medium inline-block px-2 py-0.5 rounded-md border ${chipStyle}`}>
                                              {isOverdue ? Math.abs(job.remainingKm).toLocaleString() + ' KM ago' : 'in ' + job.remainingKm.toLocaleString() + ' KM'}
                                            </p>
                                          </div>
                                        </div>

                                        {/* Last Service Details Summarized Inline */}
                                        {(job.details || job.workshop || (job.cost && job.cost !== "0")) && (
                                          <div className="pl-3 pr-8 mt-3 text-xs opacity-90 border-t border-black/5 dark:border-white/10 pt-3 space-y-1.5 font-medium">
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

              <div className="space-y-8 lg:space-y-10">
                {/* Global Upcoming Services Removed per user request */}

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
            </div>
          </div>
        </div>

        {/* Manage Vehicles Modal */}
        {
          showManageModal && (
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ease-in-out animate-in fade-in ${isManageModalClosing ? 'bg-black/0 backdrop-blur-none opacity-0' : 'bg-black/60 backdrop-blur-sm opacity-100'}`}>

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

              <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl dark:shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] transition-all duration-500 ease-in-out animate-in zoom-in-95 fade-in ${isManageModalClosing ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'}`}>
                <div className="px-4 py-3 sm:p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                  <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
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

                <div className="px-4 py-3 sm:p-6 overflow-y-auto overflow-x-hidden flex flex-col gap-4 sm:gap-6">
                  {/* Add New / Edit */}
                  <div className="flex flex-col gap-2 sm:gap-3 relative z-10 bg-zinc-50 dark:bg-zinc-950/30 p-3 sm:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800/80 order-2">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">{vehicleToEdit ? "Edit Vehicle" : "Add New Vehicle"}</p>
                    <input
                      type="text"
                      value={newVehicleName}
                      onChange={(e) => setNewVehicleName(e.target.value)}
                      placeholder="Vehicle Name (e.g. Toyota Corolla)"
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg p-2.5 sm:p-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                    />

                    <div className="flex flex-row gap-2 sm:gap-3">
                      {/* Compact Vehicle Type Buttons */}
                      <div className="flex flex-col gap-1.5 sm:gap-2 shrink-0 w-24 sm:w-32">
                        <button
                          type="button"
                          onClick={() => setNewVehicleType("Car")}
                          className={`px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${newVehicleType === "Car"
                            ? "bg-blue-600 text-white shadow-md scale-105 z-10"
                            : "bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                            }`}
                        >
                          <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Car
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewVehicleType("Motorcycle")}
                          className={`px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium rounded-lg flex items-center justify-center gap-1.5 transition-all ${newVehicleType === "Motorcycle"
                            ? "bg-blue-600 text-white shadow-md scale-105 z-10"
                            : "bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                            }`}
                        >
                          <Bike className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Bike
                        </button>
                      </div>

                      <div className="flex-1 grid grid-cols-5 gap-1.5 sm:gap-2">
                        {CAR_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewVehicleColor(color)}
                            className={`h-9 sm:h-11 w-full rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-zinc-950 ${newVehicleColor === color
                              ? 'ring-2 ring-zinc-800 dark:ring-white scale-105 z-10'
                              : 'ring-1 ring-zinc-200 dark:ring-zinc-700/50 hover:scale-105 hover:ring-zinc-400 dark:hover:ring-zinc-500'
                              }`}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                            title={`Select color ${color}`}
                          />
                        ))}

                        {/* Custom Color Picker Button */}
                        <div className="relative h-9 sm:h-11 w-full">
                          <input
                            type="color"
                            value={newVehicleColor}
                            onChange={(e) => setNewVehicleColor(e.target.value)}
                            onBlur={(e) => setNewVehicleColor(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-20"
                            title="Choose Custom Color"
                          />
                          <div
                            className={`absolute inset-0 rounded-md shadow-sm transition-all flex items-center justify-center overflow-hidden
                              ${!CAR_COLORS.includes(newVehicleColor)
                                ? 'ring-2 ring-zinc-800 dark:ring-white scale-105 z-10'
                                : 'ring-1 ring-zinc-200 dark:ring-zinc-700/50 hover:scale-105 hover:ring-zinc-400 dark:hover:ring-zinc-500'
                              }`}
                          >
                            {/* Background shows the currently selected custom color, or a rainbow gradient if a preset is selected indicating it's the "Custom" button */}
                            {!CAR_COLORS.includes(newVehicleColor) ? (
                              <div className="absolute inset-0" style={{ backgroundColor: newVehicleColor }}></div>
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-tr from-rose-500 via-amber-500 to-blue-500 opacity-80"></div>
                            )}
                            <Plus className={`w-4 h-4 relative z-10 ${!CAR_COLORS.includes(newVehicleColor) && ['#ffffff', '#f4f4f5'].includes(newVehicleColor.toLowerCase()) ? 'text-zinc-900' : 'text-white drop-shadow-md'}`} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Roadtax Expiry</label>
                        <input
                          type="date"
                          value={newRoadtaxExpiry}
                          onChange={(e) => setNewRoadtaxExpiry(e.target.value)}
                          className="w-[95%] bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg p-2 sm:p-2.5 text-sm text-zinc-900 dark:text-white outline-none transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Insurance Expiry</label>
                        <input
                          type="date"
                          value={newInsuranceExpiry}
                          onChange={(e) => setNewInsuranceExpiry(e.target.value)}
                          className="w-[95%] bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg p-2 sm:p-2.5 text-sm text-zinc-900 dark:text-white outline-none transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 mb-2">
                      <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Insurance Company</label>
                      <input
                        type="text"
                        value={newInsuranceCompany}
                        onChange={(e) => setNewInsuranceCompany(e.target.value)}
                        placeholder="e.g. Allianz, Etiqa"
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg p-2 sm:p-2.5 text-sm text-zinc-900 dark:text-white outline-none transition-colors"
                      />
                    </div>

                    <div className="flex gap-2 w-full">
                      {vehicleToEdit && (
                        <button
                          onClick={cancelEdit}
                          disabled={modalLoading}
                          className="flex-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium rounded-lg p-2.5 sm:p-3 text-sm transition-colors flex items-center justify-center"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={handleSaveVehicle}
                        disabled={modalLoading || !newVehicleName.trim()}
                        className={`${vehicleToEdit ? 'flex-1' : 'w-full'} bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium rounded-lg p-2.5 sm:p-3 text-sm transition-colors flex items-center justify-center relative overflow-hidden`}
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
                  <div className="space-y-1.5 sm:space-y-2 pb-1 order-1">
                    <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 sm:mb-3">Your Vehicles</p>
                    {dynamicVehicles.length === 0 ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg border border-zinc-200 dark:border-zinc-800/50">No vehicles tracked yet.</p>
                    ) : (
                      dynamicVehicles.map((v, i) => (
                        <div key={i} className="flex justify-between items-center p-2.5 sm:p-3 bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800/80 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors animate-in slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'both' }}>
                          <div className="flex items-center gap-2.5 sm:gap-3">
                            <div
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-md border border-zinc-300 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-inner"
                              style={{ backgroundColor: v.color || "#3b82f6" }}
                            >
                              {v.type === "Motorcycle" ? (
                                <Bike className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 drop-shadow-md" />
                              ) : (
                                <Car className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 drop-shadow-md" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs sm:text-sm font-medium text-zinc-800 dark:text-zinc-200">{v.name}</span>
                              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{v.type}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEditVehicle(v)}
                              disabled={modalLoading || vehicleToEdit === v.name}
                              className="text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 sm:p-2 rounded-lg transition-all"
                              title="Edit vehicle"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                            </button>
                            <button
                              onClick={() => setVehicleToDelete(v.name)}
                              disabled={modalLoading || vehicleToEdit === v.name}
                              className="text-rose-500/70 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-400/10 p-1.5 sm:p-2 rounded-lg transition-all"
                              title="Remove tracking"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* Voluntary Mileage Update Modal */}
        {
          showMileageModal && (
            <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ease-in-out animate-in fade-in ${isMileageModalClosing ? 'bg-black/0 backdrop-blur-none opacity-0' : 'bg-black/60 backdrop-blur-sm opacity-100'}`}>
              <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-xl dark:shadow-2xl transition-all duration-500 ease-in-out animate-in zoom-in-95 fade-in ${isMileageModalClosing ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'}`}>
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
                    <div className="flex justify-between items-end mb-1">
                      <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">New Odometer Reading (KM)</label>
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 px-2 py-0.5 rounded-md">
                        Current: <span className="font-mono text-zinc-900 dark:text-zinc-200">{mileageTarget.currentMileage?.toLocaleString('en-GB') || "0"}</span>
                      </span>
                    </div>
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
          )
        }

        {/* Renewal Modal */}
        {showRenewModal && renewTarget && (
          <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-500 ease-in-out animate-in fade-in ${isRenewModalClosing ? 'bg-black/0 backdrop-blur-none opacity-0' : 'bg-black/60 backdrop-blur-sm opacity-100'}`}>
            <div className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-xl dark:shadow-2xl transition-all duration-500 ease-in-out animate-in zoom-in-95 fade-in ${isRenewModalClosing ? 'scale-95 opacity-0 translate-y-4' : 'scale-100 opacity-100 translate-y-0'}`}>
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                  Renew Policy
                </h3>
                <button
                  onClick={closeRenewModal}
                  className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-1"
                  disabled={renewLoading}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Renewing <strong className="text-zinc-900 dark:text-white">{renewTarget.name}</strong> will calculate your new Roadtax & Insurance expiry date from the starting date below.
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Starting Date</label>
                  <input
                    type="date"
                    value={renewStartDate}
                    onChange={(e) => setRenewStartDate(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl p-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Select Renewal Interval</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setRenewInterval(6)}
                      className={`flex-1 py-3 text-sm font-bold rounded-xl border transition-all ${renewInterval === 6 ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}
                    >
                      6 Months
                    </button>
                    <button
                      onClick={() => setRenewInterval(12)}
                      className={`flex-1 py-3 text-sm font-bold rounded-xl border transition-all ${renewInterval === 12 ? "bg-blue-600 text-white border-blue-600 shadow-sm" : "bg-white dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}
                    >
                      12 Months
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Insurance Company</label>
                  <input
                    type="text"
                    value={renewCompany}
                    onChange={(e) => setRenewCompany(e.target.value)}
                    placeholder="e.g. Allianz, Etiqa"
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-xl p-3 text-sm text-zinc-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-inner"
                  />
                </div>

                <button
                  onClick={handleRenewService}
                  disabled={renewLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-xl p-3.5 transition-colors flex items-center justify-center relative overflow-hidden mt-4"
                >
                  <span className={`transition-all duration-300 flex items-center gap-2 ${renewLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                    Confirm Renewal
                  </span>
                  {renewLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
        }

        {/* Status Flash Screen Overlay (Injected for Saving/Updating/Deleting Vehicles) */}
        <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center backdrop-blur-xl transition-all duration-500 ease-in-out ${flash.show ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-105'
          } ${flash.type === "saving" || flash.type === "mileage_saving" || flash.type === "deleting" ? "bg-white/95 dark:bg-zinc-900/95 bg-gradient-to-br from-orange-500/95 to-amber-600/95 dark:from-orange-900/95 dark:to-orange-950/95" :
            flash.type === "renewing" ? "bg-white/95 dark:bg-zinc-900/95 bg-gradient-to-br from-indigo-500/95 to-blue-600/95 dark:from-indigo-900/95 dark:to-blue-950/95" :
              flash.type === "success" || flash.type === "mileage_success" || flash.type === "renew_success" ? "bg-white/95 dark:bg-zinc-900/95 bg-gradient-to-br from-emerald-500/95 to-teal-600/95 dark:from-emerald-900/95 dark:to-teal-950/95" :
                flash.type === "deleted" || flash.type === "error" ? "bg-white/95 dark:bg-zinc-900/95 bg-gradient-to-br from-rose-500/95 to-red-600/95 dark:from-rose-900/95 dark:to-red-950/95" : "bg-transparent"
          }`}>

          {(flash.type === "saving" || flash.type === "deleting") && (
            <div className={`flex flex-col items-center animate-in zoom-in duration-500`}>
              <div className="w-28 h-28 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(255,255,255,0.3)] dark:shadow-[0_0_50px_rgba(255,255,255,0.1)] relative overflow-hidden ring-4 ring-white/30 dark:ring-transparent">
                <AnimatedClock className="w-14 h-14 text-white dark:text-orange-200" />
                <div className="absolute inset-0 border-4 border-white/50 dark:border-orange-400/30 rounded-full border-t-white animate-spin"></div>
              </div>
              <h2 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                {flash.type === "saving" ? "Writing to Database..." : "Removing Vehicle..."}
              </h2>
              <p className="text-orange-50 dark:text-orange-200 mt-3 font-medium text-lg animate-pulse">Syncing with Garage</p>
            </div>
          )}

          {(flash.type === "mileage_saving") && (
            <div className={`flex flex-col items-center animate-in zoom-in duration-500`}>
              <div className="w-28 h-28 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(255,255,255,0.3)] dark:shadow-[0_0_50px_rgba(255,255,255,0.1)] relative overflow-hidden">
                <AnimatedOdometer className="w-16 h-16 text-white dark:text-orange-200" />
              </div>
              <h2 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                Updating Mileage...
              </h2>
              <p className="text-orange-50 dark:text-orange-200 mt-3 font-medium text-lg animate-pulse">Rolling the distance</p>
            </div>
          )}

          {(flash.type === "renewing") && (
            <div className={`flex flex-col items-center animate-in zoom-in duration-500`}>
              <div className="w-28 h-28 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(255,255,255,0.3)] dark:shadow-[0_0_50px_rgba(255,255,255,0.1)] relative overflow-hidden ring-4 ring-white/30 dark:ring-transparent">
                <AnimatedPenLine className="w-14 h-14 text-white dark:text-blue-200" />
                <div className="absolute inset-0 border-4 border-white/50 dark:border-blue-400/30 rounded-full border-t-white animate-spin"></div>
              </div>
              <h2 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                Updating reminder...
              </h2>
              <p className="text-blue-50 dark:text-blue-200 mt-3 font-medium text-lg animate-pulse">Calculating dates</p>
            </div>
          )}

          {(flash.type === "success" || flash.type === "renew_success") && (
            <div className={`flex flex-col items-center animate-in zoom-in slide-in-from-bottom-4 duration-500`}>
              <div className="w-28 h-28 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(255,255,255,0.3)] dark:shadow-[0_0_50px_rgba(16,185,129,0.4)] ring-4 ring-white/50 dark:ring-emerald-400/50">
                {flash.type === "renew_success" ? (
                  <AnimatedCalendarCheck className="w-16 h-16 text-white dark:text-emerald-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                ) : (
                  <AnimatedCheck className="w-16 h-16 text-white dark:text-emerald-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
                )}
              </div>
              <h2 className="text-4xl font-extrabold text-white mb-3 drop-shadow-lg">
                {flash.type === "renew_success" ? "Reminder updated!" :
                  (vehicleToEdit ? "Vehicle Updated!" : "Vehicle Added!")}
              </h2>
              <p className="text-emerald-50 dark:text-emerald-100 font-semibold text-lg drop-shadow-md">Returning to dashboard...</p>
            </div>
          )}

          {(flash.type === "mileage_success") && (
            <div className={`flex flex-col items-center animate-in zoom-in slide-in-from-bottom-4 duration-500`}>
              <div className="w-28 h-28 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(255,255,255,0.3)] dark:shadow-[0_0_50px_rgba(16,185,129,0.4)] ring-4 ring-white/50 dark:ring-emerald-400/50">
                <AnimatedSpeedometer className="w-16 h-16 text-white dark:text-emerald-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
              </div>
              <h2 className="text-4xl font-extrabold text-white mb-3 drop-shadow-lg">Mileage Updated!</h2>
              <p className="text-emerald-50 dark:text-emerald-100 font-semibold text-lg drop-shadow-md">Returning to dashboard...</p>
            </div>
          )}

          {flash.type === "deleted" && (
            <div className={`flex flex-col items-center animate-in zoom-in slide-in-from-top-4 duration-500`}>
              <div className="w-28 h-28 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(255,255,255,0.3)] dark:shadow-[0_0_50px_rgba(244,63,94,0.4)] ring-4 ring-white/50 dark:ring-rose-400/50">
                <AnimatedTrash className="w-16 h-16 text-white dark:text-rose-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
              </div>
              <h2 className="text-4xl font-extrabold text-white mb-3 drop-shadow-lg">Vehicle Deleted</h2>
              <p className="text-rose-50 dark:text-rose-100 font-semibold text-lg drop-shadow-md">Removed from your garage.</p>
            </div>
          )}

          {flash.type === "error" && (
            <div className={`flex flex-col items-center animate-in shake duration-300`}>
              <div className="w-28 h-28 bg-white/20 dark:bg-white/10 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(255,255,255,0.3)] dark:shadow-[0_0_50px_rgba(244,63,94,0.4)] ring-4 ring-white/50 dark:ring-rose-400/50">
                <AnimatedX className="w-16 h-16 text-white dark:text-rose-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
              </div>
              <h2 className="text-4xl font-extrabold text-white mb-3 drop-shadow-lg">Action Failed</h2>
              <p className="text-rose-50 dark:text-rose-100 font-semibold text-lg max-w-sm text-center bg-rose-900/40 dark:bg-rose-950/50 p-4 rounded-xl border border-white/20 dark:border-rose-500/30 backdrop-blur-md">{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Alert Resolution Modal */}
        {
          resolvingAlert && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setResolvingAlert(null)}></div>
              <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 slide-in-from-bottom-4 duration-500">
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                    <AlertCircle className="w-10 h-10 text-rose-500 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Resolve Service Alert</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 px-4">
                    How would you like to handle the <strong>{resolvingAlert.serviceType}</strong> alert for <strong>{resolvingAlert.vehicle}</strong>?
                  </p>

                  <div className="grid gap-3">
                    <button
                      onClick={() => handleResolveAlert(resolvingAlert, 'dismissed')}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white font-bold rounded-2xl transition-all border border-zinc-200 dark:border-zinc-700 active:scale-95"
                    >
                      <Clock className="w-5 h-5 text-amber-500" />
                      Only Dismiss (Snooze)
                    </button>
                    <button
                      onClick={() => handleResolveAlert(resolvingAlert, 'attended')}
                      className="w-full flex items-center justify-center gap-3 p-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Mark as Attended
                    </button>
                    <button
                      onClick={() => setResolvingAlert(null)}
                      className="w-full p-4 text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        }

      </div >

      {/* Floating Action Button (Mobile & Desktop) */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
        <a
          href="/record/new"
          className="pointer-events-auto p-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[20px] shadow-2xl shadow-blue-500/40 hover:scale-105 active:scale-90 active:translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center gap-0 hover:gap-3 group border border-white/20 ring-1 ring-blue-400/20"
          title="Create New Record"
        >
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-500 ease-in-out font-bold text-sm">
            New Record
          </span>
          <Plus className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-500 group-hover:rotate-90" />
        </a>
      </div>
    </div >
  );
}
