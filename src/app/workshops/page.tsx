"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { 
    Wrench, ArrowLeft, Navigation, ShieldAlert, Sparkles, CheckCircle2, 
    Compass, AlertTriangle, Clock, MapPin, Gauge, Download, Star, DollarSign, Crosshair
} from 'lucide-react';
import { MultiCriteriaEngine, EvaluationResult } from '@/lib/algorithms/MultiCriteriaEngine';
import workshopsData from '@/data/workshops.json';

// Dynamically import map component with SSR disabled
const WorkshopMap = dynamic(() => import('@/components/WorkshopMap'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[520px] rounded-2xl bg-zinc-100 dark:bg-zinc-800/50 flex flex-col items-center justify-center border border-zinc-200 dark:border-zinc-800 animate-pulse">
            <Compass className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Loading interactive spatial map...</p>
        </div>
    )
});

const PRESET_LOCATIONS: Record<string, { name: string; lat: number; lng: number }> = {
    uitm: { name: 'UiTM Chendering', lat: 5.26197, lng: 103.16551 },
    batuburok: { name: 'Pantai Batu Burok (HSNZ)', lat: 5.31820, lng: 103.15540 },
    waterfront: { name: 'KT Waterfront / Pasar Payang', lat: 5.33450, lng: 103.12980 },
    gongbadak: { name: 'Gong Badak Airport', lat: 5.38500, lng: 103.10200 },
    bukitpayung: { name: 'Pekan Bukit Payung', lat: 5.24120, lng: 103.09850 }
};

export default function WorkshopsPage() {
    const engine = useMemo(() => new MultiCriteriaEngine(), []);

    // State
    const [selectedIssue, setSelectedIssue] = useState<string>("");
    const [urgencyCondition, setUrgencyCondition] = useState<string | null>(null);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number }>({
        lat: 5.26197,
        lng: 103.16551
    });
    const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
    const [benchmarkData, setBenchmarkData] = useState<any>(null);

    // Run A* Multi-Criteria Evaluation whenever condition or location changes
    useEffect(() => {
        if (!urgencyCondition) {
            setEvaluation(null);
            return;
        }

        try {
            const res = engine.evaluate(currentLocation.lat, currentLocation.lng, urgencyCondition);
            setEvaluation(res);
        } catch (err) {
            console.error("Evaluation error:", err);
        }
    }, [urgencyCondition, currentLocation, engine]);

    // Handle symptom dropdown selection
    const handleIssueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedIssue(val);
        if (!val) {
            setUrgencyCondition(null);
            return;
        }
        const opt = e.target.selectedOptions[0];
        const cond = opt?.getAttribute('data-condition') || 'Vehicle breakdown';
        setUrgencyCondition(cond);
    };

    // Handle urgency card click
    const handleUrgencyClick = (cond: string) => {
        setUrgencyCondition(cond);
        // Sync dropdown to top matching symptom
        if (cond === 'Vehicle breakdown') setSelectedIssue('Complete Breakdown');
        else if (cond === 'Urgent repair') setSelectedIssue('Urgent repair');
        else if (cond === 'Scheduled maintenance') setSelectedIssue('Scheduled maintenance');
    };

    // Auto GPS
    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setIsLocating(false);
                setCurrentLocation({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                });
            },
            (err) => {
                setIsLocating(false);
                alert("GPS Notice: " + err.message);
            },
            { timeout: 8000, enableHighAccuracy: true }
        );
    };

    // Urgency weight details
    const weightMeta = useMemo(() => {
        if (!urgencyCondition) {
            return {
                badgeText: 'Please Select Urgency Status',
                badgeClass: 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
                borderClass: 'border-zinc-200 dark:border-zinc-800',
                bgClass: 'bg-zinc-50/50 dark:bg-zinc-900/50',
                wd: '-',
                wc: '-',
                wq: '-',
                wdNum: 0,
                wcNum: 0,
                wqNum: 0
            };
        }

        if (urgencyCondition === 'Vehicle breakdown') {
            return {
                badgeText: 'High Urgency (Vehicle Breakdown)',
                badgeClass: 'bg-red-500 text-white',
                borderClass: 'border-red-300 dark:border-red-900/50',
                bgClass: 'bg-red-50/50 dark:bg-red-950/20',
                wd: '60%',
                wc: '20%',
                wq: '20%',
                wdNum: 60,
                wcNum: 20,
                wqNum: 20
            };
        } else if (urgencyCondition === 'Urgent repair') {
            return {
                badgeText: 'Medium Urgency (Urgent Repair)',
                badgeClass: 'bg-amber-500 text-white',
                borderClass: 'border-amber-300 dark:border-amber-900/50',
                bgClass: 'bg-amber-50/50 dark:bg-amber-950/20',
                wd: '30%',
                wc: '40%',
                wq: '30%',
                wdNum: 30,
                wcNum: 40,
                wqNum: 30
            };
        } else {
            return {
                badgeText: 'Low Urgency (Scheduled Maintenance)',
                badgeClass: 'bg-emerald-500 text-white',
                borderClass: 'border-emerald-300 dark:border-emerald-900/50',
                bgClass: 'bg-emerald-50/50 dark:bg-emerald-950/20',
                wd: '10%',
                wc: '60%',
                wq: '30%',
                wdNum: 10,
                wcNum: 60,
                wqNum: 30
            };
        }
    }, [urgencyCondition]);

    // Run Experimental Benchmarking Suite (20 Scenarios)
    const runBenchmarks = () => {
        const scenarios: any[] = [];
        let scenarioId = 1;
        let totalCostSavings = 0;
        let totalScoreImprovement = 0;

        const locs = Object.values(PRESET_LOCATIONS);
        const conds = ['Vehicle breakdown', 'Urgent repair', 'Scheduled maintenance'];

        for (const loc of locs) {
            for (const cond of conds) {
                const evalRes = engine.evaluate(loc.lat, loc.lng, cond);
                const rec = evalRes.recommended;
                const base = evalRes.baseline;
                const costSavings = base.raw_cost_rm - rec.raw_cost_rm;
                const scoreDiff = base.mc_score - rec.mc_score;

                totalCostSavings += Math.max(0, costSavings);
                totalScoreImprovement += scoreDiff;

                scenarios.push({
                    scenario_id: scenarioId++,
                    location_name: loc.name,
                    condition: cond,
                    urgency_level: evalRes.meta.urgency_level,
                    mc_workshop: rec,
                    baseline_workshop: base,
                    trade_offs: {
                        cost_savings_rm: costSavings,
                        distance_delta_km: rec.raw_distance_km - base.raw_distance_km,
                        quality_gain: rec.raw_quality - base.raw_quality
                    }
                });
            }
        }

        setBenchmarkData({
            scenarios,
            summary: {
                total_scenarios: scenarios.length,
                total_astar_calculations: scenarios.length * 20,
                net_cost_savings_rm: totalCostSavings,
                net_score_improvement: totalScoreImprovement
            }
        });
        setShowBenchmarkModal(true);
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center gap-3">
                        <Link 
                            href="/" 
                            className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-emerald-500 text-white"><Compass className="w-5 h-5" /></span>
                                Workshop Selection & Route Planning
                            </h1>
                            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                                Multi-Criteria A* Search Algorithm &bull; UiTM Kuala Terengganu Study Area (15km)
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                            CSP650 FYP Model
                        </span>
                        <button
                            onClick={runBenchmarks}
                            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                        >
                            <Sparkles className="w-3.5 h-3.5" /> Run 20 Experimental Scenarios
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Sidebar: Controls */}
                <div className="lg:col-span-4 xl:col-span-3 space-y-4">
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                        
                        {/* 1. Maintenance Status Selector */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mb-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500" /> 1. Vehicle Maintenance Status
                            </label>

                            {/* Dropdown Menu (High to Low Order, Default Null) */}
                            <div className="mb-3">
                                <label className="text-xs text-zinc-500 dark:text-zinc-400 flex justify-between items-center mb-1">
                                    <span>Select Symptom / Problem:</span>
                                    <span className="text-[10px] text-zinc-400">Auto-maps Urgency</span>
                                </label>
                                <select 
                                    value={selectedIssue}
                                    onChange={handleIssueChange}
                                    className="w-full text-xs p-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="" disabled>-- Select Vehicle Problem / Urgency Level --</option>
                                    
                                    <optgroup label="🚨 High Urgency (Breakdown / Safety Hazard)">
                                        <option value="Complete Breakdown" data-condition="Vehicle breakdown">🚨 Complete Breakdown (Engine Won't Start)</option>
                                        <option value="Engine Overheating" data-condition="Vehicle breakdown">🌡️ Engine Overheating / Smoke</option>
                                        <option value="Brake Failure" data-condition="Vehicle breakdown">🛑 Critical Brake Failure / Fluid Leak</option>
                                        <option value="Flat Tyre / Blowout" data-condition="Vehicle breakdown">🛞 Flat Tyre / Severe Rim Damage</option>
                                        <option value="Transmission Failure" data-condition="Vehicle breakdown">⚙️ Gearbox / Transmission Lockup</option>
                                    </optgroup>

                                    <optgroup label="⚠️ Medium Urgency (Urgent Repair / Impairment)">
                                        <option value="Urgent repair" data-condition="Urgent repair">⚠️ General Urgent Mechanical Repair</option>
                                        <option value="Check Engine Light" data-condition="Urgent repair">💡 Check Engine Light Glowing (Amber)</option>
                                        <option value="Alternator / Battery Fault" data-condition="Urgent repair">🔋 Alternator / Battery Charging Fault</option>
                                        <option value="Severe Steering Vibration" data-condition="Urgent repair">〰️ Severe Steering Shake / Vibration</option>
                                        <option value="Coolant Leak" data-condition="Urgent repair">💧 Minor Radiator / Coolant Leak</option>
                                    </optgroup>

                                    <optgroup label="🟢 Low Urgency (Scheduled Maintenance / Routine)">
                                        <option value="Scheduled maintenance" data-condition="Scheduled maintenance">🟢 Periodic Scheduled Maintenance</option>
                                        <option value="Engine Oil & Filter Change" data-condition="Scheduled maintenance">🛢️ Engine Oil & Filter Change (10k km)</option>
                                        <option value="Air-Con Servicing" data-condition="Scheduled maintenance">❄️ Air-Conditioning Service & Regas</option>
                                        <option value="Tyre Rotation & Alignment" data-condition="Scheduled maintenance">🔄 Tyre Rotation, Balancing & Alignment</option>
                                        <option value="Brake Pad Inspection" data-condition="Scheduled maintenance">🔧 Routine Brake Wear Inspection</option>
                                    </optgroup>
                                </select>
                            </div>

                            {/* Urgency Category Quick Cards (High to Low) */}
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => handleUrgencyClick('Vehicle breakdown')}
                                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                                        urgencyCondition === 'Vehicle breakdown'
                                            ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 ring-2 ring-red-400'
                                            : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                    }`}
                                >
                                    <span className="text-red-500 text-lg">🚨</span>
                                    <span className="text-xs font-bold leading-tight">Breakdown</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 font-medium">High</span>
                                </button>

                                <button
                                    onClick={() => handleUrgencyClick('Urgent repair')}
                                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                                        urgencyCondition === 'Urgent repair'
                                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400'
                                            : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                    }`}
                                >
                                    <span className="text-amber-500 text-lg">⚠️</span>
                                    <span className="text-xs font-bold leading-tight">Urgent</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-medium">Medium</span>
                                </button>

                                <button
                                    onClick={() => handleUrgencyClick('Scheduled maintenance')}
                                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                                        urgencyCondition === 'Scheduled maintenance'
                                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400'
                                            : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                                    }`}
                                >
                                    <span className="text-emerald-500 text-lg">🟢</span>
                                    <span className="text-xs font-bold leading-tight">Scheduled</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-medium">Low</span>
                                </button>
                            </div>
                        </div>

                        {/* 2. Weight Profile Display Card */}
                        <div className={`p-3 rounded-xl border transition-all ${weightMeta.borderClass} ${weightMeta.bgClass}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Weight Profile W(u)</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${weightMeta.badgeClass}`}>
                                    {weightMeta.badgeText}
                                </span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-zinc-600 dark:text-zinc-400">Distance (W<sub>d</sub>):</span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400">{weightMeta.wd}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-600 dark:text-zinc-400">Repair Cost (W<sub>c</sub>):</span>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{weightMeta.wc}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-600 dark:text-zinc-400">Quality Rating (W<sub>q</sub>):</span>
                                    <span className="font-bold text-purple-600 dark:text-purple-400">{weightMeta.wq}</span>
                                </div>
                            </div>

                            {/* Multi-Segment Weight Bar */}
                            <div className="h-2 rounded-full overflow-hidden flex bg-zinc-200 dark:bg-zinc-800 mt-2.5">
                                <div style={{ width: `${weightMeta.wdNum}%` }} className="bg-blue-500 transition-all duration-300" />
                                <div style={{ width: `${weightMeta.wcNum}%` }} className="bg-emerald-500 transition-all duration-300" />
                                <div style={{ width: `${weightMeta.wqNum}%` }} className="bg-purple-500 transition-all duration-300" />
                            </div>
                        </div>

                        {/* 3. Starting Location Input */}
                        <div>
                            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5 mb-2">
                                <MapPin className="w-4 h-4 text-red-500" /> 2. Current Location
                            </label>

                            {/* Preset Buttons */}
                            <div className="flex flex-wrap gap-1 mb-2">
                                {Object.entries(PRESET_LOCATIONS).map(([key, loc]) => (
                                    <button
                                        key={key}
                                        onClick={() => setCurrentLocation({ lat: loc.lat, lng: loc.lng })}
                                        className="text-[11px] px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/60 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all text-zinc-700 dark:text-zinc-300"
                                    >
                                        {loc.name.split(' ')[0]}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleDetectLocation}
                                disabled={isLocating}
                                className="w-full py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-all cursor-pointer text-zinc-700 dark:text-zinc-200"
                            >
                                <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-500' : ''}`} />
                                {isLocating ? 'Acquiring GPS...' : 'Auto GPS Location'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Area: Interactive Map & Multi-Criteria Results */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                    
                    {/* Leaflet Map Card */}
                    <WorkshopMap
                        startLocation={currentLocation}
                        workshops={workshopsData}
                        recommendedWorkshop={evaluation?.recommended || null}
                        baselineWorkshop={evaluation?.baseline || null}
                        onLocationChange={(lat, lng) => setCurrentLocation({ lat, lng })}
                    />

                    {/* Result Comparison Cards */}
                    {evaluation ? (
                        <div className="space-y-4">
                            {/* Summary Trade-Off Banner */}
                            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-start gap-3">
                                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div className="flex-grow">
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-0.5">Pareto Trade-Off Evaluation (Table 3.6.2)</h4>
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                                        {evaluation.comparison.summary_text}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="text-xs px-2.5 py-1 rounded-lg font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                                            {evaluation.comparison.cost_diff_rm < 0 
                                                ? `Saves RM ${Math.abs(evaluation.comparison.cost_diff_rm).toFixed(2)}`
                                                : evaluation.comparison.cost_diff_rm > 0 
                                                ? `+RM ${evaluation.comparison.cost_diff_rm.toFixed(2)}`
                                                : 'Same Cost'}
                                        </span>
                                        <span className="text-xs px-2.5 py-1 rounded-lg font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                            {evaluation.comparison.distance_diff_km > 0 
                                                ? `+${evaluation.comparison.distance_diff_km.toFixed(2)} km`
                                                : 'Same Distance'}
                                        </span>
                                        <span className="text-xs px-2.5 py-1 rounded-lg font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                            {evaluation.comparison.quality_diff > 0 
                                                ? `+${evaluation.comparison.quality_diff.toFixed(1)} Rating`
                                                : 'Same Quality'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Side-by-Side Cards: Recommended vs Baseline */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                
                                {/* Recommended (Multi-Criteria A*) */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border-2 border-emerald-500 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> Optimal Multi-Criteria Choice
                                    </div>

                                    <h3 className="font-bold text-lg text-emerald-600 dark:text-emerald-400 mb-1">
                                        {evaluation.recommended.name}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">{evaluation.recommended.address}</p>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                            <span className="text-zinc-500 text-[10px] block">A* Route Distance</span>
                                            <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{evaluation.recommended.raw_distance_km} km</span>
                                            <span className="text-[10px] text-zinc-400 block">~{evaluation.recommended.estimated_time_min} mins</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                            <span className="text-zinc-500 text-[10px] block">Estimated Cost</span>
                                            <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">RM {evaluation.recommended.raw_cost_rm.toFixed(2)}</span>
                                            <span className="text-[10px] text-zinc-400 block">Baseline repair</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                            <span className="text-zinc-500 text-[10px] block">Service Quality</span>
                                            <span className="font-bold text-sm text-amber-500">⭐ {evaluation.recommended.raw_quality.toFixed(1)} / 10</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
                                            <span className="text-emerald-700 dark:text-emerald-300 text-[10px] block font-semibold">Objective MC Score</span>
                                            <span className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400">{evaluation.recommended.mc_score.toFixed(4)}</span>
                                            <span className="text-[10px] text-emerald-600 dark:text-emerald-500 block">Lowest penalty</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Baseline (Single-Criterion Nearest A*) */}
                                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl">
                                        Single-Criterion Baseline (Nearest)
                                    </div>

                                    <h3 className="font-bold text-lg text-zinc-800 dark:text-zinc-200 mb-1">
                                        {evaluation.baseline.name}
                                    </h3>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">{evaluation.baseline.address}</p>

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                            <span className="text-zinc-500 text-[10px] block">A* Route Distance</span>
                                            <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">{evaluation.baseline.raw_distance_km} km</span>
                                            <span className="text-[10px] text-zinc-400 block">~{evaluation.baseline.estimated_time_min} mins</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                            <span className="text-zinc-500 text-[10px] block">Estimated Cost</span>
                                            <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200">RM {evaluation.baseline.raw_cost_rm.toFixed(2)}</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                                            <span className="text-zinc-500 text-[10px] block">Service Quality</span>
                                            <span className="font-bold text-sm text-amber-500">⭐ {evaluation.baseline.raw_quality.toFixed(1)} / 10</span>
                                        </div>
                                        <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                                            <span className="text-zinc-500 text-[10px] block font-semibold">Objective MC Score</span>
                                            <span className="font-bold text-sm text-zinc-700 dark:text-zinc-300">{evaluation.baseline.mc_score.toFixed(4)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Full Ranked Workshop Table */}
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                                <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">All 20 Candidate Workshops Evaluated</h3>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Ranked by Multi-Criteria Objective Score (argmin MCScore)</p>
                                    </div>
                                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                        {evaluation.all_candidates.length} Workshops
                                    </span>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800">
                                            <tr>
                                                <th className="p-3">Rank</th>
                                                <th className="p-3">Workshop Name</th>
                                                <th className="p-3">Distance (D')</th>
                                                <th className="p-3">Repair Cost (C')</th>
                                                <th className="p-3">Quality (Q')</th>
                                                <th className="p-3">MC Score</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                            {evaluation.all_candidates.map((ws, idx) => {
                                                const isRec = ws.workshop_id === evaluation.recommended.workshop_id;
                                                const isBase = ws.workshop_id === evaluation.baseline.workshop_id;
                                                return (
                                                    <tr 
                                                        key={ws.workshop_id}
                                                        className={`transition-colors ${
                                                            isRec 
                                                                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 font-semibold' 
                                                                : isBase 
                                                                ? 'bg-amber-50/50 dark:bg-amber-950/20' 
                                                                : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                                                        }`}
                                                    >
                                                        <td className="p-3">
                                                            {isRec ? (
                                                                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">#1 Optimal</span>
                                                            ) : isBase ? (
                                                                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">Nearest</span>
                                                            ) : (
                                                                `#${idx + 1}`
                                                            )}
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="font-medium text-zinc-900 dark:text-zinc-100">{ws.name}</div>
                                                            <div className="text-[10px] text-zinc-400 truncate max-w-xs">{ws.address}</div>
                                                        </td>
                                                        <td className="p-3">
                                                            <div>{ws.raw_distance_km.toFixed(2)} km</div>
                                                            <div className="text-[10px] text-zinc-400">D': {ws.norm_distance.toFixed(3)}</div>
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="text-emerald-600 dark:text-emerald-400">RM {ws.raw_cost_rm.toFixed(2)}</div>
                                                            <div className="text-[10px] text-zinc-400">C': {ws.norm_cost.toFixed(3)}</div>
                                                        </td>
                                                        <td className="p-3">
                                                            <div>⭐ {ws.raw_quality.toFixed(1)}</div>
                                                            <div className="text-[10px] text-zinc-400">Q': {ws.norm_quality.toFixed(3)}</div>
                                                        </td>
                                                        <td className="p-3">
                                                            <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 font-mono font-bold text-xs text-indigo-600 dark:text-indigo-400">
                                                                {ws.mc_score.toFixed(4)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center shadow-sm">
                            <Compass className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                            <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-200 mb-1">Awaiting Vehicle Problem or Urgency Selection</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                                Please choose a vehicle symptom from the dropdown or click one of the urgency cards on the left to evaluate all 20 candidate workshops using Two-Stage A* search.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Benchmark Modal */}
            {showBenchmarkModal && benchmarkData && (
                <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-4xl w-full max-h-[85vh] flex flex-col border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-indigo-500" />
                                    Experimental Benchmark Suite (20 Scenarios)
                                </h3>
                                <p className="text-xs text-zinc-500">100 A* Route Calculations &bull; 5 Geographic Corridors &times; 3 Urgency Levels</p>
                            </div>
                            <button 
                                onClick={() => setShowBenchmarkModal(false)}
                                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 text-xs">
                            <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                <span className="text-zinc-500 text-[10px] block">Total Scenarios</span>
                                <span className="font-bold text-sm">20 Scenarios</span>
                            </div>
                            <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                <span className="text-zinc-500 text-[10px] block">A* Calculations</span>
                                <span className="font-bold text-sm text-blue-500">100 Routes</span>
                            </div>
                            <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                <span className="text-zinc-500 text-[10px] block">Net Repair Savings</span>
                                <span className="font-bold text-sm text-emerald-500">RM {benchmarkData.summary.net_cost_savings_rm.toFixed(2)}</span>
                            </div>
                            <div className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                <span className="text-zinc-500 text-[10px] block">Objective Score Gain</span>
                                <span className="font-bold text-sm text-indigo-500">{benchmarkData.summary.net_score_improvement.toFixed(4)}</span>
                            </div>
                        </div>

                        {/* Scenarios Table */}
                        <div className="overflow-y-auto p-4 flex-grow text-xs">
                            <table className="w-full text-left">
                                <thead className="text-[11px] font-bold text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                                    <tr>
                                        <th className="pb-2">Scenario</th>
                                        <th className="pb-2">Origin Corridor</th>
                                        <th className="pb-2">Urgency</th>
                                        <th className="pb-2">Multi-Criteria Choice</th>
                                        <th className="pb-2">Baseline Nearest Choice</th>
                                        <th className="pb-2">Cost Savings</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                    {benchmarkData.scenarios.map((sc: any) => (
                                        <tr key={sc.scenario_id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30">
                                            <td className="py-2.5 font-bold">#{sc.scenario_id}</td>
                                            <td className="py-2.5">{sc.location_name}</td>
                                            <td className="py-2.5">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    sc.urgency_level === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400' :
                                                    sc.urgency_level === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' :
                                                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                                }`}>
                                                    {sc.urgency_level}
                                                </span>
                                            </td>
                                            <td className="py-2.5 font-medium text-emerald-600 dark:text-emerald-400">{sc.mc_workshop.name}</td>
                                            <td className="py-2.5 text-zinc-500">{sc.baseline_workshop.name}</td>
                                            <td className="py-2.5 font-bold text-emerald-500">
                                                {sc.trade_offs.cost_savings_rm > 0 ? `+RM ${sc.trade_offs.cost_savings_rm.toFixed(2)}` : 'RM 0'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2 bg-zinc-50 dark:bg-zinc-950">
                            <button
                                onClick={() => setShowBenchmarkModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
