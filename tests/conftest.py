"""Fixtures comunes para los tests de la API SIGR.

Crea una BD SQLite efímera (`sigr_test.db`) antes de la suite y la borra al
terminar para no contaminar la BD real `sigr.db`.
"""

import os
import sys
import sqlite3
import tempfile
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parent.parent
BACKEND_DIR = ROOT / "Backend"

# Aseguramos que el backend sea importable como módulo plano.
sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture(scope="session", autouse=True)
def db_temporal():
    """Crea una BD efímera y la apunta vía la variable SIGR_DB_PATH antes
    de importar el backend. Se aplica el schema, se siembran datos básicos
    y al terminar la sesión de tests se elimina el archivo."""
    fd, ruta = tempfile.mkstemp(prefix="sigr_test_", suffix=".db")
    os.close(fd)
    os.environ["SIGR_DB_PATH"] = ruta

    con = sqlite3.connect(ruta)
    try:
        # Schema
        with open(ROOT / "DataBase" / "schema.sql", encoding="utf-8") as f:
            con.executescript(f.read())
        # Seeds (catalogos + negocio)
        for sql in sorted((ROOT / "DataBase" / "seeds").glob("*.sql")):
            with open(sql, encoding="utf-8") as f:
                con.executescript(f.read())
        # Usuarios con clave hasheada
        from passlib.context import CryptContext
        pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
        con.execute(
            "INSERT INTO usuarios (email, clave_hash, nombre, rol) VALUES (?, ?, ?, ?)",
            ("administrador@masconsulta.com", pwd.hash("admin123"),
             "Administrador General", "admin"),
        )
        con.commit()
    finally:
        con.close()

    yield ruta

    try:
        os.remove(ruta)
    except OSError:
        pass


@pytest.fixture(scope="session")
def client(db_temporal):
    """TestClient de FastAPI apuntando a la BD efímera."""
    from fastapi.testclient import TestClient
    from main import app

    return TestClient(app)


@pytest.fixture(scope="session")
def token(client):
    """Login del usuario admin y devuelve el JWT."""
    r = client.post(
        "/api/auth/login",
        json={"email": "administrador@masconsulta.com", "clave": "admin123"},
    )
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


@pytest.fixture
def headers(token):
    """Headers con Authorization para los tests autenticados."""
    return {"Authorization": f"Bearer {token}"}
