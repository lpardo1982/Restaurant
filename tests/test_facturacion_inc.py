"""Pruebas del módulo de facturación.
Validan que el INC se calcule al 8 % (Art. 512-1 E.T. Colombia) y que el
pedido facturado cambie a estado 'pagado'.
"""

import pytest


def test_inc_es_ocho_por_ciento(client, headers):
    """El parámetro 'facturacion.impuesto_porcentaje' debe ser 8."""
    r = client.get("/api/parametros", headers=headers)
    assert r.status_code == 200
    params = r.json()
    assert params["facturacion.tipo_impuesto"] == "INC"
    assert params["facturacion.impuesto_porcentaje"] == "8"


@pytest.fixture
def pedido_para_facturar(client, headers):
    """Crea un cliente y un pedido para facturar de forma aislada."""
    cli = client.post(
        "/api/clientes/",
        json={"nombre": "Cliente Fact Test", "telefono": "3000000000"},
        headers=headers,
    ).json()
    ped = client.post(
        "/api/pedidos/",
        json={
            "cliente_id": cli["id"],
            "mesa": 1,
            "items": [{"plato_id": 1, "cantidad": 1}],  # Bandeja paisa 28000
        },
        headers=headers,
    ).json()
    return ped


def test_facturar_calcula_inc_y_total(client, headers, pedido_para_facturar):
    subtotal = pedido_para_facturar["total"]
    r = client.post(
        "/api/facturacion/",
        json={"pedido_id": pedido_para_facturar["id"]},
        headers=headers,
    )
    assert r.status_code == 201
    fac = r.json()
    inc_esperado = round(subtotal * 0.08)
    assert fac["subtotal"] == subtotal
    assert fac["inc"] == inc_esperado
    assert fac["total"] == subtotal + inc_esperado


def test_pedido_pasa_a_pagado_tras_facturar(client, headers, pedido_para_facturar):
    pid = pedido_para_facturar["id"]
    client.post("/api/facturacion/", json={"pedido_id": pid}, headers=headers)
    pedidos = client.get("/api/pedidos/", headers=headers).json()
    p = next(x for x in pedidos if x["id"] == pid)
    assert p["estado"] == "pagado"


def test_no_se_puede_facturar_dos_veces_el_mismo_pedido(client, headers, pedido_para_facturar):
    pid = pedido_para_facturar["id"]
    client.post("/api/facturacion/", json={"pedido_id": pid}, headers=headers)
    r = client.post("/api/facturacion/", json={"pedido_id": pid}, headers=headers)
    assert r.status_code == 409  # conflict: ya facturado
