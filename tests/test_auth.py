"""Pruebas de autenticación y validación de permisos por rol."""


def test_login_con_credenciales_validas(client):
    r = client.post(
        "/api/auth/login",
        json={"email": "administrador@masconsulta.com", "clave": "admin123"},
    )
    assert r.status_code == 200
    body = r.json()
    assert body["token_type"] == "bearer"
    assert body["usuario"]["rol"] == "admin"
    assert body["usuario"]["email"] == "administrador@masconsulta.com"


def test_login_con_credenciales_invalidas(client):
    r = client.post(
        "/api/auth/login",
        json={"email": "administrador@masconsulta.com", "clave": "incorrecta"},
    )
    assert r.status_code == 401


def test_me_requiere_token(client):
    r = client.get("/api/auth/me")
    assert r.status_code == 401


def test_me_con_token_devuelve_usuario(client, headers):
    r = client.get("/api/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["rol"] == "admin"
