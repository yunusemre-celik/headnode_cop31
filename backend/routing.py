"""Antalya neighborhood/intersection graph loader and risk-aware evacuation router."""

from __future__ import annotations

import csv
from dataclasses import dataclass
from functools import lru_cache
import heapq
import math
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Set, Tuple

from backend.geo import haversine_meters
from backend.models import (
    EVENT_RADIUS_METERS,
    EventRecord,
    RouteStep,
    SafeRoute,
    SafezoneNode,
)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
HAZARD_PENALTY_KM = 50.0


@dataclass(frozen=True)
class GraphNode:
    """Static node metadata loaded from data/antalya_nodes.csv."""

    node_id: str
    name: str
    district: str
    intersection_name: str
    lat: float
    lng: float


@dataclass(frozen=True)
class GraphEdge:
    """Directed edge loaded from data/antalya_edges.csv."""

    target_id: str
    distance_km: float


@lru_cache(maxsize=1)
def load_antalya_graph() -> Tuple[Dict[str, GraphNode], Dict[str, List[GraphEdge]]]:
    """Load and cache the Antalya intersection nodes and directed edges."""
    nodes_path = DATA_DIR / "antalya_nodes.csv"
    edges_path = DATA_DIR / "antalya_edges.csv"

    nodes: Dict[str, GraphNode] = {}
    with nodes_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            nid = row["node_id"].strip()
            nodes[nid] = GraphNode(
                node_id=nid,
                name=row["name"].strip(),
                district=row["district"].strip(),
                intersection_name=row["safe_intersection_name"].strip(),
                lat=float(row["lat"]),
                lng=float(row["lon"]),
            )

    adj: Dict[str, List[GraphEdge]] = {nid: [] for nid in nodes}
    with edges_path.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            src = row["source_id"].strip()
            dst = row["target_id"].strip()
            if src in nodes and dst in nodes:
                adj[src].append(
                    GraphEdge(
                        target_id=dst,
                        distance_km=float(row["distance_km"]),
                    )
                )

    return nodes, adj


def _point_in_any_hazard(
    lat: float,
    lng: float,
    events: Sequence[EventRecord],
    radius_m: float,
) -> bool:
    return any(
        haversine_meters(lat, lng, ev.origin_lat, ev.origin_lng) <= radius_m
        for ev in events
    )


def _segment_intersects_circle_m(
    lat1: float,
    lng1: float,
    lat2: float,
    lng2: float,
    c_lat: float,
    c_lng: float,
    radius_m: float,
) -> bool:
    """Return True if segment (lat1, lng1)-(lat2, lng2) intersects circle at (c_lat, c_lng)."""
    meters_per_deg_lat = 111_320.0
    cos_lat = max(0.01, abs(math.cos(math.radians(c_lat))))
    meters_per_deg_lng = 111_320.0 * cos_lat

    ax = (lng1 - c_lng) * meters_per_deg_lng
    ay = (lat1 - c_lat) * meters_per_deg_lat
    bx = (lng2 - c_lng) * meters_per_deg_lng
    by = (lat2 - c_lat) * meters_per_deg_lat

    dx = bx - ax
    dy = by - ay
    seg_len_sq = dx * dx + dy * dy
    if seg_len_sq <= 1e-9:
        return math.hypot(ax, ay) <= radius_m

    t = max(0.0, min(1.0, -(ax * dx + ay * dy) / seg_len_sq))
    closest_x = ax + t * dx
    closest_y = ay + t * dy
    return math.hypot(closest_x, closest_y) <= radius_m


def _edge_is_hazardous(
    u: GraphNode,
    v: GraphNode,
    events: Sequence[EventRecord],
    radius_m: float,
) -> bool:
    return any(
        _segment_intersects_circle_m(
            u.lat, u.lng, v.lat, v.lng, ev.origin_lat, ev.origin_lng, radius_m
        )
        for ev in events
    )


def build_safezone_nodes(
    active_safezone_ids: Set[str],
    events: Sequence[EventRecord],
    radius_m: float = EVENT_RADIUS_METERS,
) -> List[SafezoneNode]:
    """Build SafezoneNode list for all Antalya intersections with active and hazard flags."""
    nodes, _ = load_antalya_graph()
    result = [
        SafezoneNode(
            node_id=n.node_id,
            name=n.name,
            district=n.district,
            intersection_name=n.intersection_name,
            lat=n.lat,
            lng=n.lng,
            is_active=n.node_id in active_safezone_ids,
            is_hazardous=_point_in_any_hazard(n.lat, n.lng, events, radius_m),
        )
        for n in nodes.values()
    ]
    result.sort(key=lambda item: (item.district, item.name))
    return result


def _run_dijkstra(
    start_id: str,
    target_ids: Set[str],
    nodes: Dict[str, GraphNode],
    adj: Dict[str, List[GraphEdge]],
    hazardous_nodes: Set[str],
    hazardous_edges: Set[Tuple[str, str]],
    allow_hazardous: bool,
) -> Optional[Tuple[List[str], float, bool]]:
    """Return (node_id_path, real_distance_km, avoided_all_hazards) or None."""
    if not allow_hazardous and start_id in hazardous_nodes:
        return None

    # Priority queue items: (cost_km, real_dist_km, had_hazard, node_id)
    heap: List[Tuple[float, float, bool, str]] = [(0.0, 0.0, False, start_id)]
    best_cost: Dict[str, float] = {start_id: 0.0}
    parent: Dict[str, Optional[str]] = {start_id: None}

    while heap:
        cost, real_dist, had_hazard, u_id = heapq.heappop(heap)
        if cost > best_cost.get(u_id, float("inf")):
            continue

        if u_id in target_ids:
            path: List[str] = []
            curr: Optional[str] = u_id
            while curr is not None:
                path.append(curr)
                curr = parent[curr]
            path.reverse()
            return path, real_dist, (not had_hazard and start_id not in hazardous_nodes)

        for edge in adj.get(u_id, []):
            v_id = edge.target_id
            is_edge_bad = (u_id, v_id) in hazardous_edges or v_id in hazardous_nodes
            if is_edge_bad and not allow_hazardous:
                continue

            step_cost = edge.distance_km + (HAZARD_PENALTY_KM if is_edge_bad else 0.0)
            next_cost = cost + step_cost
            if next_cost < best_cost.get(v_id, float("inf")):
                best_cost[v_id] = next_cost
                parent[v_id] = u_id
                heapq.heappush(
                    heap,
                    (
                        next_cost,
                        real_dist + edge.distance_km,
                        had_hazard or is_edge_bad,
                        v_id,
                    ),
                )

    return None


def compute_safe_route(
    user_lat: float,
    user_lng: float,
    active_safezone_ids: Set[str],
    events: Sequence[EventRecord],
    radius_m: float = EVENT_RADIUS_METERS,
) -> Optional[SafeRoute]:
    """Compute the shortest hazard-avoiding route from (user_lat, user_lng) to any active safezone."""
    nodes, adj = load_antalya_graph()
    valid_targets = {nid for nid in active_safezone_ids if nid in nodes}
    if not valid_targets:
        return None

    hazardous_nodes: Set[str] = {
        nid
        for nid, node in nodes.items()
        if _point_in_any_hazard(node.lat, node.lng, events, radius_m)
    }
    hazardous_edges: Set[Tuple[str, str]] = {
        (u_id, edge.target_id)
        for u_id, edges in adj.items()
        for edge in edges
        if _edge_is_hazardous(nodes[u_id], nodes[edge.target_id], events, radius_m)
    }

    safe_nodes = [n for nid, n in nodes.items() if nid not in hazardous_nodes]
    candidate_starts = safe_nodes if safe_nodes else list(nodes.values())
    candidate_starts.sort(
        key=lambda n: haversine_meters(user_lat, user_lng, n.lat, n.lng)
    )

    best_safe: Optional[Tuple[List[str], float, bool, GraphNode]] = None
    for start_node in candidate_starts[:5]:
        entry_hazardous = any(
            _segment_intersects_circle_m(
                user_lat,
                user_lng,
                start_node.lat,
                start_node.lng,
                ev.origin_lat,
                ev.origin_lng,
                radius_m,
            )
            for ev in events
        )
        if entry_hazardous:
            continue
        res = _run_dijkstra(
            start_id=start_node.node_id,
            target_ids=valid_targets,
            nodes=nodes,
            adj=adj,
            hazardous_nodes=hazardous_nodes,
            hazardous_edges=hazardous_edges,
            allow_hazardous=False,
        )
        if res is not None:
            path, graph_dist_km, avoided = res
            entry_km = (
                haversine_meters(user_lat, user_lng, start_node.lat, start_node.lng)
                / 1000.0
            )
            total_km = round(entry_km + graph_dist_km, 2)
            if best_safe is None or total_km < best_safe[1]:
                best_safe = (path, total_km, avoided, start_node)

    chosen = best_safe
    if chosen is None:
        nearest_node = candidate_starts[0]
        entry_hazardous = any(
            _segment_intersects_circle_m(
                user_lat,
                user_lng,
                nearest_node.lat,
                nearest_node.lng,
                ev.origin_lat,
                ev.origin_lng,
                radius_m,
            )
            for ev in events
        )
        res = _run_dijkstra(
            start_id=nearest_node.node_id,
            target_ids=valid_targets,
            nodes=nodes,
            adj=adj,
            hazardous_nodes=hazardous_nodes,
            hazardous_edges=hazardous_edges,
            allow_hazardous=True,
        )
        if res is None:
            return None
        path, graph_dist_km, avoided = res
        entry_km = (
            haversine_meters(user_lat, user_lng, nearest_node.lat, nearest_node.lng)
            / 1000.0
        )
        chosen = (
            path,
            round(entry_km + graph_dist_km, 2),
            avoided and not entry_hazardous,
            nearest_node,
        )

    path_ids, total_km, avoided_all_hazards, _ = chosen
    target_node = nodes[path_ids[-1]]
    steps = [
        RouteStep(
            node_id=nodes[nid].node_id,
            name=nodes[nid].name,
            intersection_name=nodes[nid].intersection_name,
            lat=nodes[nid].lat,
            lng=nodes[nid].lng,
        )
        for nid in path_ids
    ]

    waypoints: List[List[float]] = [[user_lat, user_lng]]
    for step in steps:
        if (
            abs(step.lat - user_lat) > 1e-6 or abs(step.lng - user_lng) > 1e-6
        ):
            waypoints.append([step.lat, step.lng])

    return SafeRoute(
        target_safezone=SafezoneNode(
            node_id=target_node.node_id,
            name=target_node.name,
            district=target_node.district,
            intersection_name=target_node.intersection_name,
            lat=target_node.lat,
            lng=target_node.lng,
            is_active=True,
            is_hazardous=target_node.node_id in hazardous_nodes,
        ),
        waypoints=waypoints,
        steps=steps,
        total_distance_km=total_km,
        avoided_all_hazards=avoided_all_hazards,
        status="safe" if avoided_all_hazards else "fallback_risky",
    )
