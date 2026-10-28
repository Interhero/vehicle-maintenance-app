// src/lib/algorithms/AStarRouter.ts
// Spatial A* Pathfinding Engine on Kuala Terengganu Road Network Graph
// Ported from Chapter 3.5.3 (Equations 3.5.1, 3.5.2)

import roadNetworkData from '@/data/road_network.json';

export interface RoadNode {
    id: string;
    name: string;
    lat: number;
    lng: number;
}

export interface RoadEdge {
    from: string;
    to: string;
    distance: number;
    name?: string;
}

export interface Waypoint {
    id: string;
    name: string;
    lat: number;
    lng: number;
}

export interface RouteResult {
    success: boolean;
    total_distance_km: number;
    estimated_time_min: number;
    nodes_expanded: number;
    computation_time_ms: number;
    path_nodes: string[];
    waypoints: Waypoint[];
}

export class AStarRouter {
    private nodes: Record<string, RoadNode>;
    private graph: Record<string, { to: string; distance: number; name?: string }[]>;
    private edges: RoadEdge[];

    constructor() {
        this.nodes = roadNetworkData.nodes as Record<string, RoadNode>;
        this.graph = roadNetworkData.graph as Record<string, { to: string; distance: number; name?: string }[]>;
        this.edges = roadNetworkData.edges as RoadEdge[];
    }

    public static haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const earthRadius = 6371.0; // km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadius * c;
    }

    public findNearestNode(lat: number, lng: number, excludePrefix = 'WS_'): { node_id: string; distance_to_node: number; node_data: RoadNode | null } {
        let nearestId = 'J_UITM';
        let minDist = Infinity;

        for (const [id, node] of Object.entries(this.nodes)) {
            if (excludePrefix && id.startsWith(excludePrefix)) {
                continue;
            }
            const dist = AStarRouter.haversine(lat, lng, node.lat, node.lng);
            if (dist < minDist) {
                minDist = dist;
                nearestId = id;
            }
        }

        return {
            node_id: nearestId,
            distance_to_node: Math.round(minDist * 1000) / 1000,
            node_data: this.nodes[nearestId] ?? null
        };
    }

    public findShortestPath(startNodeId: string, goalNodeId: string): RouteResult | null {
        const startTime = performance.now();

        if (!this.nodes[startNodeId]) {
            throw new Error(`Start node '${startNodeId}' not found in road network.`);
        }
        if (!this.nodes[goalNodeId]) {
            throw new Error(`Goal node '${goalNodeId}' not found in road network.`);
        }

        const goalLat = this.nodes[goalNodeId].lat;
        const goalLng = this.nodes[goalNodeId].lng;

        const openSet = new Map<string, number>();
        openSet.set(startNodeId, 0.0);

        const closedSet = new Set<string>();
        const gScore = new Map<string, number>();
        gScore.set(startNodeId, 0.0);

        const cameFrom = new Map<string, string>();
        let nodesExpanded = 0;

        while (openSet.size > 0) {
            let current = '';
            let lowestF = Infinity;
            for (const [nodeId, f] of openSet.entries()) {
                if (f < lowestF) {
                    lowestF = f;
                    current = nodeId;
                }
            }

            openSet.delete(current);
            closedSet.add(current);
            nodesExpanded++;

            if (current === goalNodeId) {
                const totalTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
                return this.reconstructPath(cameFrom, current, gScore.get(goalNodeId) || 0, nodesExpanded, totalTimeMs);
            }

            const neighbors = this.graph[current] || [];
            for (const edge of neighbors) {
                const neighbor = edge.to;
                const edgeWeight = edge.distance;

                if (closedSet.has(neighbor)) {
                    continue;
                }

                const tentativeG = (gScore.get(current) ?? Infinity) + edgeWeight;

                if (!gScore.has(neighbor) || tentativeG < (gScore.get(neighbor) ?? Infinity)) {
                    cameFrom.set(neighbor, current);
                    gScore.set(neighbor, tentativeG);

                    const h = AStarRouter.haversine(
                        this.nodes[neighbor].lat,
                        this.nodes[neighbor].lng,
                        goalLat,
                        goalLng
                    );

                    const f = tentativeG + h;
                    openSet.set(neighbor, f);
                }
            }
        }

        return null;
    }

    private reconstructPath(cameFrom: Map<string, string>, current: string, totalDist: number, nodesExpanded: number, timeMs: number): RouteResult {
        const pathNodes: string[] = [current];
        let curr = current;
        while (cameFrom.has(curr)) {
            curr = cameFrom.get(curr)!;
            pathNodes.unshift(curr);
        }

        const waypoints: Waypoint[] = pathNodes.map(nodeId => {
            const node = this.nodes[nodeId];
            return {
                id: nodeId,
                name: node.name || nodeId,
                lat: node.lat,
                lng: node.lng
            };
        });

        const estimatedTimeMinutes = Math.round((totalDist / 38.0) * 60 * 10) / 10;

        return {
            success: true,
            total_distance_km: Math.round(totalDist * 100) / 100,
            estimated_time_min: estimatedTimeMinutes,
            nodes_expanded: nodesExpanded,
            computation_time_ms: timeMs,
            path_nodes: pathNodes,
            waypoints
        };
    }

    public getNodes(): Record<string, RoadNode> {
        return this.nodes;
    }
}
