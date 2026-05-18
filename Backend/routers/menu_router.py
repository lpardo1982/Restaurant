"""CRUD de platos del menú."""

from fastapi import APIRouter, Depends, HTTPException

from auth import requiere_rol, usuario_actual
from database import q_all, q_one, run
from models import PlatoIn

router = APIRouter()


@router.get("/")
def listar(_: dict = Depends(usuario_actual)):
    return q_all(
        "SELECT id, nombre, categoria, precio, disponible "
        "FROM platos ORDER BY categoria, nombre"
    )


@router.post("/", status_code=201)
def crear(p: PlatoIn, _: dict = Depends(requiere_rol("admin"))):
    pid = run(
        "INSERT INTO platos (nombre, categoria, precio, disponible) "
        "VALUES (?, ?, ?, ?)",
        (p.nombre, p.categoria, p.precio, int(p.disponible)),
    )
    return q_one("SELECT * FROM platos WHERE id = ?", (pid,))


@router.put("/{plato_id}")
def actualizar(plato_id: int, p: PlatoIn, _: dict = Depends(requiere_rol("admin"))):
    actual = q_one("SELECT id FROM platos WHERE id = ?", (plato_id,))
    if not actual:
        raise HTTPException(404, "Plato no encontrado.")
    run(
        "UPDATE platos SET nombre = ?, categoria = ?, precio = ?, disponible = ? "
        "WHERE id = ?",
        (p.nombre, p.categoria, p.precio, int(p.disponible), plato_id),
    )
    return q_one("SELECT * FROM platos WHERE id = ?", (plato_id,))


@router.delete("/{plato_id}")
def eliminar(plato_id: int, _: dict = Depends(requiere_rol("admin"))):
    if not q_one("SELECT id FROM platos WHERE id = ?", (plato_id,)):
        raise HTTPException(404, "Plato no encontrado.")
    run("DELETE FROM platos WHERE id = ?", (plato_id,))
    return {"eliminado": plato_id}
