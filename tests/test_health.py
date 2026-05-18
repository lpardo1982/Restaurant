"""Pruebas del endpoint de health (sanity check)."""


def test_health_responde_ok(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    datos = r.json()
    assert datos["status"] == "ok"
    assert datos["version"].startswith("1.0.0")
