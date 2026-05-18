"""Pruebas del módulo de menú: CRUD básico."""


def test_listar_menu_con_seeds(client, headers):
    r = client.get("/api/menu/", headers=headers)
    assert r.status_code == 200
    platos = r.json()
    assert len(platos) >= 10  # 10 platos sembrados
    assert any(p["nombre"] == "Bandeja paisa" for p in platos)


def test_crear_y_eliminar_plato(client, headers):
    nuevo = {
        "nombre": "Plato de prueba",
        "categoria": "plato_fuerte",
        "precio": 15000,
        "disponible": True,
    }
    r = client.post("/api/menu/", json=nuevo, headers=headers)
    assert r.status_code == 201
    creado = r.json()
    assert creado["id"] > 0
    assert creado["nombre"] == "Plato de prueba"

    # Limpieza
    r = client.delete(f"/api/menu/{creado['id']}", headers=headers)
    assert r.status_code == 200


def test_actualizar_plato(client, headers):
    # Tomamos el primer plato
    r = client.get("/api/menu/", headers=headers)
    plato = r.json()[0]
    nuevo_precio = plato["precio"] + 1000

    r = client.put(
        f"/api/menu/{plato['id']}",
        json={
            "nombre": plato["nombre"],
            "categoria": plato["categoria"],
            "precio": nuevo_precio,
            "disponible": bool(plato["disponible"]),
        },
        headers=headers,
    )
    assert r.status_code == 200
    assert r.json()["precio"] == nuevo_precio

    # Restauramos
    client.put(
        f"/api/menu/{plato['id']}",
        json={
            "nombre": plato["nombre"],
            "categoria": plato["categoria"],
            "precio": plato["precio"],
            "disponible": bool(plato["disponible"]),
        },
        headers=headers,
    )
