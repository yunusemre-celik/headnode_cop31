import math
import pytest
from backend.graph import load_graph, haversine_km, AntalyaGraph


def test_load_graph_counts_and_districts():
    graph = load_graph("data/antalya_nodes.csv", "data/antalya_edges.csv")
    assert isinstance(graph, AntalyaGraph)
    assert len(graph.nodes) == 24
    districts = [n["district"] for n in graph.nodes.values()]
    assert districts.count("Muratpaşa") == 8
    assert districts.count("Kepez") == 10
    assert districts.count("Konyaaltı") == 6
    assert len(graph.edges) >= 48
    for edge in graph.edges:
        assert edge["source_id"] in graph.nodes
        assert edge["target_id"] in graph.nodes
        assert 0.0 < edge["distance_km"] < 25.0
        assert 0.0 <= edge["bearing_deg"] < 360.0


def test_haversine_km_calculation():
    # Antalya center to Dokuma (~4-5 km)
    # 36.8860, 30.6650 to 36.9180, 30.6800
    dist = haversine_km(36.8860, 30.6650, 36.9180, 30.6800)
    assert 3.0 < dist < 5.0
    # Zero distance
    assert haversine_km(36.8860, 30.6650, 36.8860, 30.6650) == pytest.approx(0.0, abs=1e-5)


def test_incoming_edges():
    graph = load_graph("data/antalya_nodes.csv", "data/antalya_edges.csv")
    first_node_id = next(iter(graph.nodes.keys()))
    incoming = graph.incoming_edges(first_node_id)
    assert len(incoming) > 0
    for edge in incoming:
        assert edge["target_id"] == first_node_id
        assert edge["source_id"] in graph.nodes


def test_node_record_fields_and_ranges():
    graph = load_graph("data/antalya_nodes.csv", "data/antalya_edges.csv")
    for nid, node in graph.nodes.items():
        assert node["node_id"] == nid
        assert isinstance(node["name"], str) and len(node["name"]) > 0
        assert node["district"] in {"Muratpaşa", "Kepez", "Konyaaltı"}
        assert 36.80 <= node["lat"] <= 37.00
        assert 30.55 <= node["lon"] <= 30.85
        assert isinstance(node["safe_intersection_name"], str) and len(node["safe_intersection_name"]) > 0
        assert 0.1 <= node["urban_density"] <= 1.0
        assert 0.1 <= node["vulnerability_weight"] <= 1.0
        assert node["population_weight"] > 0
        assert node["elevation_m"] >= 0.0


def test_edge_bidirectionality():
    graph = load_graph("data/antalya_nodes.csv", "data/antalya_edges.csv")
    edge_pairs = {(e["source_id"], e["target_id"]) for e in graph.edges}
    for src, tgt in edge_pairs:
        assert (tgt, src) in edge_pairs, f"Missing reverse edge for {src} -> {tgt}"
