// src/lib/algorithms/MultiCriteriaEngine.ts
// Two-Stage Multi-Criteria Decision Support & A* Routing Engine
// Follows Chapter 3.5.3 (Equations 3.4.1, 3.5.1, 3.5.2, 3.5.3, 3.5.4)

import { AStarRouter, RouteResult, Waypoint } from './AStarRouter';
import defaultWorkshops from '@/data/workshops.json';

export interface WorkshopData {
    workshop_id: number;
    name: string;
    address: string;
    contact_number?: string;
    latitude: number;
    longitude: number;
    capacity?: number;
    current_occupancy?: number;
    baseline_repair_cost: number;
    service_quality: number;
    is_active?: number;
}

export interface CandidateWorkshop {
    workshop_id: number;
    name: string;
    address: string;
    contact_number: string;
    latitude: number;
    longitude: number;
    raw_distance_km: number;
    raw_cost_rm: number;
    raw_quality: number;
    capacity: number;
    current_occupancy: number;
    estimated_time_min: number;
    nodes_expanded: number;
    computation_time_ms: number;
    path_nodes: string[];
    waypoints: Waypoint[];
    norm_distance: number;
    norm_cost: number;
    norm_quality: number;
    mc_score: number;
    score_components: {
        distance_contrib: number;
        cost_contrib: number;
        quality_contrib: number;
    };
}

export interface EvaluationResult {
    meta: {
        start_coordinates: { lat: number; lng: number };
        snapped_road_node: string;
        distance_to_road_km: number;
        maintenance_condition: string;
        urgency_level: 'High' | 'Medium' | 'Low';
        weights: {
            Wd_distance: number;
            Wc_cost: number;
            Wq_quality: number;
        };
        normalization_ranges: {
            distance: { min: number; max: number };
            cost: { min: number; max: number };
            quality: { min: number; max: number };
        };
        total_candidates: number;
        total_nodes_expanded: number;
        astar_compute_time_ms: number;
        total_engine_time_ms: number;
    };
    recommended: CandidateWorkshop;
    baseline: CandidateWorkshop;
    comparison: {
        is_same_workshop: boolean;
        distance_diff_km: number;
        cost_diff_rm: number;
        quality_diff: number;
        mc_score_diff: number;
        summary_text: string;
    };
    all_candidates: CandidateWorkshop[];
}

export class MultiCriteriaEngine {
    private router: AStarRouter;

    public static readonly WEIGHT_PROFILES = {
        High: {
            Wd: 0.60,
            Wc: 0.20,
            Wq: 0.20,
            description: 'Vehicle breakdown: High priority on closest distance and rapid access.'
        },
        Medium: {
            Wd: 0.30,
            Wc: 0.40,
            Wq: 0.30,
            description: 'Urgent repair: Balanced compromise between repair cost, distance, and quality.'
        },
        Low: {
            Wd: 0.10,
            Wc: 0.60,
            Wq: 0.30,
            description: 'Scheduled maintenance: High priority on financial savings (lowest cost).'
        }
    };

    public static readonly CONDITION_URGENCY_MAP: Record<string, 'High' | 'Medium' | 'Low'> = {
        'Vehicle breakdown': 'High',
        'Urgent repair': 'Medium',
        'Scheduled maintenance': 'Low'
    };

    constructor(router?: AStarRouter) {
        this.router = router || new AStarRouter();
    }

    public static resolveUrgency(condition: string): 'High' | 'Medium' | 'Low' {
        return this.CONDITION_URGENCY_MAP[condition] || 'Medium';
    }

    public evaluate(startLat: number, startLng: number, maintenanceCondition: string, workshopList?: WorkshopData[]): EvaluationResult {
        const engineStartTime = performance.now();

        const urgency = MultiCriteriaEngine.resolveUrgency(maintenanceCondition);
        const weights = MultiCriteriaEngine.WEIGHT_PROFILES[urgency];
        const { Wd, Wc, Wq } = weights;

        const workshops: WorkshopData[] = (workshopList && workshopList.length > 0) ? workshopList : (defaultWorkshops as WorkshopData[]);
        if (!workshops || workshops.length === 0) {
            throw new Error('No candidate workshops available for evaluation.');
        }

        const snapResult = this.router.findNearestNode(startLat, startLng);
        const startNodeId = snapResult.node_id;
        const distToRoad = snapResult.distance_to_node;

        let totalNodesExpanded = 0;
        let totalAStarTimeMs = 0;
        const candidates: CandidateWorkshop[] = [];

        for (const ws of workshops) {
            const goalNodeId = `WS_${ws.workshop_id}`;
            let routeResult = this.router.findShortestPath(startNodeId, goalNodeId);

            if (!routeResult) {
                const fallbackDist = AStarRouter.haversine(startLat, startLng, ws.latitude, ws.longitude);
                routeResult = {
                    success: true,
                    total_distance_km: Math.round(fallbackDist * 1.15 * 100) / 100,
                    estimated_time_min: Math.round(((fallbackDist * 1.15) / 38.0) * 60 * 10) / 10,
                    nodes_expanded: 1,
                    computation_time_ms: 0.1,
                    path_nodes: [startNodeId, goalNodeId],
                    waypoints: [
                        { id: 'START', name: 'Current Location', lat: startLat, lng: startLng },
                        { id: goalNodeId, name: ws.name, lat: ws.latitude, lng: ws.longitude }
                    ]
                };
            }

            const fullDistance = Math.round((routeResult.total_distance_km + distToRoad) * 100) / 100;
            totalNodesExpanded += routeResult.nodes_expanded;
            totalAStarTimeMs += routeResult.computation_time_ms;

            const wps = [...routeResult.waypoints];
            if (wps.length > 0 && (Math.abs(wps[0].lat - startLat) > 0.0002 || Math.abs(wps[0].lng - startLng) > 0.0002)) {
                wps.unshift({
                    id: 'START',
                    name: 'Current Vehicle Location',
                    lat: startLat,
                    lng: startLng
                });
            }

            candidates.push({
                workshop_id: ws.workshop_id,
                name: ws.name,
                address: ws.address,
                contact_number: ws.contact_number || '+609-6170000',
                latitude: ws.latitude,
                longitude: ws.longitude,
                raw_distance_km: fullDistance,
                raw_cost_rm: Number(ws.baseline_repair_cost),
                raw_quality: Number(ws.service_quality),
                capacity: ws.capacity || 8,
                current_occupancy: ws.current_occupancy || 2,
                estimated_time_min: routeResult.estimated_time_min,
                nodes_expanded: routeResult.nodes_expanded,
                computation_time_ms: routeResult.computation_time_ms,
                path_nodes: routeResult.path_nodes,
                waypoints: wps,
                norm_distance: 0,
                norm_cost: 0,
                norm_quality: 0,
                mc_score: 0,
                score_components: {
                    distance_contrib: 0,
                    cost_contrib: 0,
                    quality_contrib: 0
                }
            });
        }

        // Stage 2: Min-Max Normalization (Equation 3.4.1)
        const distances = candidates.map(c => c.raw_distance_km);
        const costs = candidates.map(c => c.raw_cost_rm);
        const qualities = candidates.map(c => c.raw_quality);

        const minDist = Math.min(...distances);
        const maxDist = Math.max(...distances);
        const minCost = Math.min(...costs);
        const maxCost = Math.max(...costs);
        const minQual = Math.min(...qualities);
        const maxQual = Math.max(...qualities);

        for (const c of candidates) {
            c.norm_distance = maxDist > minDist ? Math.round(((c.raw_distance_km - minDist) / (maxDist - minDist)) * 10000) / 10000 : 0;
            c.norm_cost = maxCost > minCost ? Math.round(((c.raw_cost_rm - minCost) / (maxCost - minCost)) * 10000) / 10000 : 0;
            c.norm_quality = maxQual > minQual ? Math.round(((maxQual - c.raw_quality) / (maxQual - minQual)) * 10000) / 10000 : 0;

            const mcScore = (Wd * c.norm_distance) + (Wc * c.norm_cost) + (Wq * c.norm_quality);
            c.mc_score = Math.round(mcScore * 10000) / 10000;

            c.score_components = {
                distance_contrib: Math.round(Wd * c.norm_distance * 10000) / 10000,
                cost_contrib: Math.round(Wc * c.norm_cost * 10000) / 10000,
                quality_contrib: Math.round(Wq * c.norm_quality * 10000) / 10000
            };
        }

        // Sort ascending by MC Score (Equation 3.5.4)
        candidates.sort((a, b) => a.mc_score - b.mc_score);
        const recommendedWorkshop = candidates[0];

        // Baseline A* Selection (Distance only)
        const baselineCandidates = [...candidates].sort((a, b) => a.raw_distance_km - b.raw_distance_km);
        const baselineWorkshop = baselineCandidates[0];

        const engineTotalTimeMs = Math.round((performance.now() - engineStartTime) * 100) / 100;

        const distanceDelta = Math.round((recommendedWorkshop.raw_distance_km - baselineWorkshop.raw_distance_km) * 100) / 100;
        const costDelta = Math.round((recommendedWorkshop.raw_cost_rm - baselineWorkshop.raw_cost_rm) * 100) / 100;
        const qualityDelta = Math.round((recommendedWorkshop.raw_quality - baselineWorkshop.raw_quality) * 10) / 10;
        const scoreDelta = Math.round((recommendedWorkshop.mc_score - baselineWorkshop.mc_score) * 10000) / 10000;

        return {
            meta: {
                start_coordinates: { lat: startLat, lng: startLng },
                snapped_road_node: startNodeId,
                distance_to_road_km: distToRoad,
                maintenance_condition: maintenanceCondition,
                urgency_level: urgency,
                weights: {
                    Wd_distance: Wd,
                    Wc_cost: Wc,
                    Wq_quality: Wq
                },
                normalization_ranges: {
                    distance: { min: minDist, max: maxDist },
                    cost: { min: minCost, max: maxCost },
                    quality: { min: minQual, max: maxQual }
                },
                total_candidates: candidates.length,
                total_nodes_expanded: totalNodesExpanded,
                astar_compute_time_ms: Math.round(totalAStarTimeMs * 100) / 100,
                total_engine_time_ms: engineTotalTimeMs
            },
            recommended: recommendedWorkshop,
            baseline: baselineWorkshop,
            comparison: {
                is_same_workshop: recommendedWorkshop.workshop_id === baselineWorkshop.workshop_id,
                distance_diff_km: distanceDelta,
                cost_diff_rm: costDelta,
                quality_diff: qualityDelta,
                mc_score_diff: scoreDelta,
                summary_text: MultiCriteriaEngine.generateComparisonSummary(recommendedWorkshop, baselineWorkshop, urgency)
            },
            all_candidates: candidates
        };
    }

    private static generateComparisonSummary(mc: CandidateWorkshop, baseline: CandidateWorkshop, urgency: string): string {
        if (mc.workshop_id === baseline.workshop_id) {
            return `Both Multi-Criteria A* and Baseline A* selected the same workshop (${mc.name}). It represents the Pareto-optimal choice across distance, cost, and quality.`;
        }

        const costSaved = baseline.raw_cost_rm - mc.raw_cost_rm;
        const distAdded = mc.raw_distance_km - baseline.raw_distance_km;
        const qualGain = mc.raw_quality - baseline.raw_quality;

        const parts: string[] = [];
        if (costSaved > 0) {
            parts.push(`saved RM ${costSaved.toFixed(2)} in estimated repairs`);
        } else if (costSaved < 0) {
            parts.push(`incurred RM ${Math.abs(costSaved).toFixed(2)} higher cost`);
        }

        if (qualGain > 0) {
            parts.push(`achieved a higher service quality rating (+${qualGain.toFixed(1)})`);
        }

        let detail = parts.join(' and ');
        if (distAdded > 0) {
            detail = detail ? `${detail} by travelling an additional ${distAdded.toFixed(2)} km` : `travelled an additional ${distAdded.toFixed(2)} km`;
        }

        return `Under ${urgency} urgency, Multi-Criteria A* prioritised optimal trade-offs: it ${detail} compared to single-criterion nearest-distance routing.`;
    }
}
