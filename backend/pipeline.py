"""3-Stage ML Inference Pipeline for HEATNODE AI.

Stage 1: Spatial-Temporal DBSCAN + Isolation Forest crowd anomaly verification.
Stage 2: Graph-aware feature engineering + XGBoost (+1h/+2h/+3h) + SHAP TreeExplainer.
Stage 3: Weighted K-Means mobile cooling hub allocation and nearest-hub routing.
"""

from __future__ import annotations

import math
from pathlib import Path
from typing import Any, Dict, List

import joblib
import numpy as np
import shap
from sklearn.cluster import DBSCAN, KMeans

from backend.graph import AntalyaGraph, haversine_km
from backend.weather import WeatherSnapshot, compute_utci
from ml.train_propagation import FEATURE_COLUMNS, ISOLATION_FOREST_FEATURES


class HeatnodePipeline:
    """End-to-end 3-stage geospatial & ML inference pipeline."""

    def __init__(
        self,
        graph: AntalyaGraph,
        model_path: str | Path = "ml/artifacts/xgb_propagation.joblib",
    ) -> None:
        self.graph = graph
        self.model_path = Path(model_path)
        bundle = joblib.load(self.model_path)

        self.models: Dict[str, Any] = bundle["models"]
        self.feature_columns: List[str] = list(bundle.get("feature_columns", FEATURE_COLUMNS))
        self.iso_forest = bundle["iso_forest"]
        self.iso_indices: List[int] = [
            self.feature_columns.index(col) for col in ISOLATION_FOREST_FEATURES
        ]
        self.explainer_2h = shap.TreeExplainer(self.models["2h"])

    def _stage1_anomaly_detection(
        self,
        reports: List[Dict[str, Any]],
        node_ids: List[str],
        x_all: np.ndarray,
    ) -> tuple[Dict[str, int], Dict[str, bool]]:
        """Run DBSCAN on jittered report coordinates and verify with Isolation Forest."""
        report_counts: Dict[str, int] = {nid: 0 for nid in node_ids}
        cluster_counts: Dict[str, int] = {nid: 0 for nid in node_ids}
        valid_reports: List[Dict[str, Any]] = []

        for rep in reports:
            nid = rep.get("node_id")
            if nid in report_counts:
                report_counts[nid] += 1
                valid_reports.append(rep)

        if valid_reports:
            rng = np.random.default_rng(42)
            coords = np.array(
                [
                    [
                        self.graph.nodes[rep["node_id"]]["lat"],
                        self.graph.nodes[rep["node_id"]]["lon"],
                    ]
                    for rep in valid_reports
                ],
                dtype=float,
            )
            jitter = rng.normal(0.0, 0.002, size=coords.shape)
            labels = DBSCAN(eps=0.015, min_samples=10).fit_predict(coords + jitter)
            for rep, label in zip(valid_reports, labels):
                if label != -1:
                    cluster_counts[rep["node_id"]] += 1

        x_iso = x_all[:, self.iso_indices]
        iso_preds = self.iso_forest.predict(x_iso)

        verified_by_node: Dict[str, bool] = {}
        for idx, nid in enumerate(node_ids):
            has_reports = report_counts[nid] > 0
            in_cluster = cluster_counts[nid] > 0
            iso_flagged = int(iso_preds[idx]) == -1
            verified_by_node[nid] = bool(has_reports and in_cluster and iso_flagged)

        return report_counts, verified_by_node

    def _build_features(
        self,
        weather: WeatherSnapshot | Dict[str, Any],
        node_ids: List[str],
        report_counts: Dict[str, int],
    ) -> tuple[np.ndarray, np.ndarray]:
        """Build (N, 11) feature matrix and instantaneous risk_now array."""
        n_nodes = len(node_ids)
        node_idx = {nid: idx for idx, nid in enumerate(node_ids)}

        temp_c = float(weather["temperature_c"])
        rel_humidity = float(weather["relative_humidity"])
        wind_speed_kmh = float(weather["wind_speed_kmh"])
        wind_dir_deg = float(weather["wind_direction_deg"])
        solar_wm2 = float(weather["solar_radiation_wm2"])
        base_utci = float(
            weather.get(
                "utci_c",
                compute_utci(temp_c, rel_humidity, wind_speed_kmh / 3.6, solar_wm2),
            )
        )
        temp_grad_1h = float(weather.get("temp_grad_1h", 0.0))
        temp_grad_3h = float(weather.get("temp_grad_3h", 0.0))

        urban_density = np.array([self.graph.nodes[nid]["urban_density"] for nid in node_ids], dtype=float)
        vulnerability = np.array([self.graph.nodes[nid]["vulnerability_weight"] for nid in node_ids], dtype=float)
        elevation_m = np.array([self.graph.nodes[nid]["elevation_m"] for nid in node_ids], dtype=float)
        crowd_density = np.array(
            [min(1.0, report_counts[nid] / 25.0) for nid in node_ids],
            dtype=float,
        )

        node_utci = base_utci + 2.5 * urban_density - 0.0065 * elevation_m

        risk_now = np.clip(
            5.0
            + (node_utci - 15.0) / 33.0 * 65.0
            + urban_density * 12.0
            + vulnerability * 8.0
            + crowd_density * 10.0,
            5.0,
            100.0,
        )

        # Open-Meteo wind_direction_deg is meteorological "from" direction; wind blows toward +180 deg.
        wind_to_rad = math.radians((wind_dir_deg + 180.0) % 360.0)

        upwind_advection = np.zeros(n_nodes, dtype=float)
        max_alignment = np.zeros(n_nodes, dtype=float)
        mean_neighbor_risk = np.zeros(n_nodes, dtype=float)

        for j, nid in enumerate(node_ids):
            inc_edges = self.graph.incoming_edges(nid)
            if not inc_edges:
                continue
            neighbor_risk_sum = 0.0
            for edge in inc_edges:
                src_i = node_idx[edge["source_id"]]
                dist_km = max(edge["distance_km"], 0.5)
                bearing_rad = math.radians(edge["bearing_deg"])
                align = max(0.0, math.cos(wind_to_rad - bearing_rad))
                upwind_advection[j] += align * (risk_now[src_i] / dist_km)
                max_alignment[j] = max(max_alignment[j], align)
                neighbor_risk_sum += risk_now[src_i]
            mean_neighbor_risk[j] = neighbor_risk_sum / float(len(inc_edges))

        feature_map = {
            "utci_c": node_utci,
            "temp_grad_1h": np.full(n_nodes, temp_grad_1h, dtype=float),
            "temp_grad_3h": np.full(n_nodes, temp_grad_3h, dtype=float),
            "rel_humidity": np.full(n_nodes, rel_humidity, dtype=float),
            "wind_speed_kmh": np.full(n_nodes, wind_speed_kmh, dtype=float),
            "upwind_advection_score": upwind_advection,
            "max_upwind_alignment": max_alignment,
            "mean_neighbor_risk": mean_neighbor_risk,
            "urban_density": urban_density,
            "vulnerability_weight": vulnerability,
            "crowd_density": crowd_density,
        }
        x_all = np.column_stack([feature_map[col] for col in self.feature_columns])
        return x_all, risk_now

    def _group_shap_drivers(self, shap_row: np.ndarray) -> List[Dict[str, Any]]:
        """Aggregate 11 feature SHAP values into 4 physical driver categories."""
        idx = {col: i for i, col in enumerate(self.feature_columns)}
        groups = {
            "Wind Vector Alignment": float(
                shap_row[idx["upwind_advection_score"]]
                + shap_row[idx["max_upwind_alignment"]]
                + shap_row[idx["wind_speed_kmh"]]
                + shap_row[idx["mean_neighbor_risk"]]
            ),
            "Urban Heat Retention": float(
                shap_row[idx["urban_density"]] + shap_row[idx["vulnerability_weight"]]
            ),
            "Crowd Report Density": float(shap_row[idx["crowd_density"]]),
            "Solar & Thermal Gradient": float(
                shap_row[idx["utci_c"]]
                + shap_row[idx["temp_grad_1h"]]
                + shap_row[idx["temp_grad_3h"]]
                + shap_row[idx["rel_humidity"]]
            ),
        }
        sorted_groups = sorted(groups.items(), key=lambda item: abs(item[1]), reverse=True)
        return [{"driver": name, "impact": round(val, 3)} for name, val in sorted_groups]

    def _extract_propagation_edges(
        self,
        wind_dir_deg: float,
        risk_now_by_node: Dict[str, float],
    ) -> List[Dict[str, Any]]:
        """Extract active downwind propagation edges where source risk >= 65 and alignment >= 0.5."""
        wind_to_rad = math.radians((wind_dir_deg + 180.0) % 360.0)
        active_edges: List[Dict[str, Any]] = []

        for edge in self.graph.edges:
            src_id = edge["source_id"]
            tgt_id = edge["target_id"]
            src_risk = risk_now_by_node.get(src_id, 0.0)
            if src_risk < 65.0:
                continue

            align = math.cos(wind_to_rad - math.radians(edge["bearing_deg"]))
            if align < 0.5:
                continue

            src_node = self.graph.nodes[src_id]
            tgt_node = self.graph.nodes[tgt_id]
            active_edges.append(
                {
                    "source_id": src_id,
                    "target_id": tgt_id,
                    "source_lat": src_node["lat"],
                    "source_lon": src_node["lon"],
                    "target_lat": tgt_node["lat"],
                    "target_lon": tgt_node["lon"],
                    "alignment": round(float(align), 3),
                    "source_risk": round(float(src_risk), 2),
                }
            )
        return active_edges

    def _stage3_allocate_hubs(
        self,
        node_ids: List[str],
        risk_2h: np.ndarray,
        hub_count: int,
    ) -> tuple[List[Dict[str, Any]], Dict[str, Dict[str, Any]]]:
        """Run Weighted K-Means to place K cooling hubs snapped to safe intersections."""
        n_nodes = len(node_ids)
        k = max(1, min(int(hub_count), n_nodes))

        coords = np.array(
            [[self.graph.nodes[nid]["lat"], self.graph.nodes[nid]["lon"]] for nid in node_ids],
            dtype=float,
        )
        weights = np.array(
            [
                max(
                    1e-3,
                    float(risk_2h[i])
                    * self.graph.nodes[nid]["vulnerability_weight"]
                    * self.graph.nodes[nid]["population_weight"],
                )
                for i, nid in enumerate(node_ids)
            ],
            dtype=float,
        )

        kmeans = KMeans(n_clusters=k, n_init=10, random_state=42)
        kmeans.fit(coords, sample_weight=weights)

        used_nodes: set[str] = set()
        hubs: List[Dict[str, Any]] = []
        for idx, center in enumerate(kmeans.cluster_centers_):
            c_lat, c_lon = float(center[0]), float(center[1])
            ranked_nodes = sorted(
                node_ids,
                key=lambda nid: haversine_km(
                    c_lat,
                    c_lon,
                    self.graph.nodes[nid]["lat"],
                    self.graph.nodes[nid]["lon"],
                ),
            )
            snapped_nid = next((nid for nid in ranked_nodes if nid not in used_nodes), ranked_nodes[0])
            used_nodes.add(snapped_nid)
            node = self.graph.nodes[snapped_nid]
            hubs.append(
                {
                    "hub_id": f"HUB-{idx + 1}",
                    "name": node["safe_intersection_name"],
                    "node_id": snapped_nid,
                    "district": node["district"],
                    "lat": node["lat"],
                    "lon": node["lon"],
                    "assigned_nodes": [],
                    "hub_type": "Mobile Cooling & Hydration Hub",
                }
            )

        nearest_hub_by_node: Dict[str, Dict[str, Any]] = {}
        hub_lookup = {h["hub_id"]: h for h in hubs}
        for nid in node_ids:
            n = self.graph.nodes[nid]
            best_hub = min(
                hubs,
                key=lambda h: haversine_km(n["lat"], n["lon"], h["lat"], h["lon"]),
            )
            dist = haversine_km(n["lat"], n["lon"], best_hub["lat"], best_hub["lon"])
            hub_lookup[best_hub["hub_id"]]["assigned_nodes"].append(nid)
            nearest_hub_by_node[nid] = {
                "hub_id": best_hub["hub_id"],
                "name": best_hub["name"],
                "distance_km": round(float(dist), 3),
            }

        return hubs, nearest_hub_by_node

    def evaluate(
        self,
        weather: WeatherSnapshot | Dict[str, Any],
        reports: List[Dict[str, Any]],
        hub_count: int = 3,
    ) -> Dict[str, Any]:
        """Execute all 3 ML stages and return node states, propagation edges, and cooling hubs."""
        node_ids = list(self.graph.nodes.keys())

        # Precompute report counts for Stage 2 crowd_density before Stage 1 IsoForest check
        prelim_counts: Dict[str, int] = {nid: 0 for nid in node_ids}
        for rep in reports:
            nid = rep.get("node_id")
            if nid in prelim_counts:
                prelim_counts[nid] += 1

        x_all, risk_now = self._build_features(weather, node_ids, prelim_counts)
        report_counts, verified_by_node = self._stage1_anomaly_detection(reports, node_ids, x_all)

        # Stage 2: XGBoost +1h/+2h/+3h predictions and SHAP explanations
        pred_1h = np.clip(self.models["1h"].predict(x_all), 0.0, 100.0)
        pred_2h = np.clip(self.models["2h"].predict(x_all), 0.0, 100.0)
        pred_3h = np.clip(self.models["3h"].predict(x_all), 0.0, 100.0)
        shap_values = np.asarray(self.explainer_2h.shap_values(x_all))

        node_states: List[Dict[str, Any]] = []
        risk_now_by_node: Dict[str, float] = {}
        for i, nid in enumerate(node_ids):
            node = self.graph.nodes[nid]
            r_now = float(risk_now[i])
            r_1h = float(pred_1h[i])
            r_2h = float(pred_2h[i])
            r_3h = float(pred_3h[i])
            prob_2h = 1.0 / (1.0 + math.exp(-(r_2h - 75.0) / 8.0))
            risk_now_by_node[nid] = r_now

            node_states.append(
                {
                    "node_id": nid,
                    "name": node["name"],
                    "district": node["district"],
                    "lat": node["lat"],
                    "lon": node["lon"],
                    "report_count": report_counts[nid],
                    "verified_anomaly": verified_by_node[nid],
                    "risk_now": round(r_now, 2),
                    "risk_1h": round(r_1h, 2),
                    "risk_2h": round(r_2h, 2),
                    "risk_3h": round(r_3h, 2),
                    "threshold_prob_2h": round(prob_2h, 4),
                    "shap_drivers": self._group_shap_drivers(shap_values[i]),
                }
            )

        propagation_edges = self._extract_propagation_edges(
            float(weather["wind_direction_deg"]),
            risk_now_by_node,
        )

        # Stage 3: Weighted K-Means hub allocation
        hubs, nearest_hub_by_node = self._stage3_allocate_hubs(node_ids, pred_2h, hub_count)

        return {
            "node_states": node_states,
            "propagation_edges": propagation_edges,
            "hubs": hubs,
            "nearest_hub_by_node": nearest_hub_by_node,
            "any_verified_anomaly": any(verified_by_node.values()),
        }
