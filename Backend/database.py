"""Capa de acceso a SQLite. Aisla el módulo `sqlite3` para que el resto del
backend trabaje con diccionarios y no con cursores."""

import os
import sqlite3
from contextlib import contextmanager
from typing import Any, Iterable

DB_PATH = os.environ.get(
    "SIGR_DB_PATH",
    os.path.join(os.path.dirname(__file__), "..", "DataBase", "sigr.db"),
)


def _conexion() -> sqlite3.Connection:
    """Abre una conexión nueva con foreign_keys habilitadas y filas como dict."""
    con = sqlite3.connect(DB_PATH)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


@contextmanager
def cursor():
    """Context manager que entrega un cursor y hace commit/rollback automático."""
    con = _conexion()
    try:
        cur = con.cursor()
        yield cur
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        con.close()


def q_all(sql: str, params: Iterable[Any] = ()) -> list[dict]:
    """Ejecuta SELECT y devuelve todas las filas como lista de dicts."""
    with cursor() as cur:
        cur.execute(sql, list(params))
        return [dict(r) for r in cur.fetchall()]


def q_one(sql: str, params: Iterable[Any] = ()) -> dict | None:
    """Ejecuta SELECT y devuelve la primera fila como dict (o None)."""
    with cursor() as cur:
        cur.execute(sql, list(params))
        r = cur.fetchone()
        return dict(r) if r else None


def run(sql: str, params: Iterable[Any] = ()) -> int:
    """Ejecuta INSERT/UPDATE/DELETE y devuelve lastrowid o rowcount."""
    with cursor() as cur:
        cur.execute(sql, list(params))
        return cur.lastrowid or cur.rowcount
