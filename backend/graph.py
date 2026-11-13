"""Antalya Neighborhood Graph Representation for HEATNODE AI."""

from __future__ import annotations

import csv
import math
from pathlib import Path
from typing import Dict, List, TypedDict


class NodeRecord(TypedDict):
    node_id: str
    name: str
    district: str
    lat: float
    lon: float
    safe_intersection_name: str
    urban_density: float
    vulnerability_weight: float
    population_weight: float
    elevation_m: float


class EdgeRecord(TypedDict):
    source_id: str
    target_id: str
    distance_km: float
    bearing_deg: float


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in kilometers."""
    r = 6371.0  # Earth radius in kilometers
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)

    a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return r * c


def bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate forward azimuth bearing from point 1 to point 2 in degrees [0, 360)."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dlambda = math.radians(lon2 - lon1)
    y = math.sin(dlambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(dlambda)
    return (math.degrees(math.atan2(y, x)) + 360.0) % 360.0


class AntalyaGraph:
    """Graph structure holding 24 Antalya neighborhood nodes and connecting edges."""

    def __init__(self, nodes: Dict[str, NodeRecord], edges: List[EdgeRecord]) -> None:
        self.nodes: Dict[str, NodeRecord] = nodes
        self.edges: List[EdgeRecord] = edges

        # Precompute incoming and outgoing edge indexes
        self._incoming: Dict[str, List[EdgeRecord]] = {nid: [] for nid in self.nodes}
        self._outgoing: Dict[str, List[EdgeRecord]] = {nid: [] for nid in self.nodes}

        for edge in self.edges:
            target = edge["target_id"]
            source = edge["source_id"]
            if target in self._incoming:
                self._incoming[target].append(edge)
            if source in self._outgoing:
                self._outgoing[source].append(edge)

    def incoming_edges(self, node_id: str) -> List[EdgeRecord]:
        """Return list of edges directed into the specified node."""
        return list(self._incoming.get(node_id, []))

    def outgoing_edges(self, node_id: str) -> List[EdgeRecord]:
        """Return list of edges directed out of the specified node."""
        return list(self._outgoing.get(node_id, []))

    @classmethod
    def load_graph(
        cls,
        nodes_path: str | Path = "data/antalya_nodes.csv",
        edges_path: str | Path = "data/antalya_edges.csv",
    ) -> AntalyaGraph:
        """Load and validate AntalyaGraph from nodes and edges CSV files."""
        return load_graph(nodes_path, edges_path)


def load_graph(
    nodes_path: str | Path = "data/antalya_nodes.csv",
    edges_path: str | Path = "data/antalya_edges.csv",
) -> AntalyaGraph:
    """Load and validate AntalyaGraph from CSV files."""
    nodes_p = Path(nodes_path)
    edges_p = Path(edges_path)

    if not nodes_p.exists():
        raise FileNotFoundError(f"Nodes file not found: {nodes_p}")
    if not edges_p.exists():
        raise FileNotFoundError(f"Edges file not found: {edges_p}")

    nodes: Dict[str, NodeRecord] = {}
    with open(nodes_p, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            nid = row["node_id"].strip()
            record: NodeRecord = {
                "node_id": nid,
                "name": row["name"].strip(),
                "district": row["district"].strip(),
                "lat": float(row["lat"]),
                "lon": float(row["lon"]),
                "safe_intersection_name": row["safe_intersection_name"].strip(),
                "urban_density": float(row["urban_density"]),
                "vulnerability_weight": float(row["vulnerability_weight"]),
                "population_weight": float(row["population_weight"]),
                "elevation_m": float(row["elevation_m"]),
            }
            nodes[nid] = record

    edges: List[EdgeRecord] = []
    with open(edges_p, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            source = row["source_id"].strip()
            target = row["target_id"].strip()
            if source not in nodes:
                raise ValueError(f"Unknown source node_id in edges: {source}")
            if target not in nodes:
                raise ValueError(f"Unknown target node_id in edges: {target}")

            edge: EdgeRecord = {
                "source_id": source,
                "target_id": target,
                "distance_km": float(row["distance_km"]),
                "bearing_deg": float(row["bearing_deg"]),
            }
            edges.append(edge)

    return AntalyaGraph(nodes=nodes, edges=edges)
