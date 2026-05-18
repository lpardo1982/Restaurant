"""CRUD de clientes + historial de pedidos."""

from fastapi import APIRouter, Depends, HTTPException

from auth import usuario_actual
from database import q_all, q_one, run
from models import ClienteIn

router = APIRouter()


@router.get("/")
def listar(_: dict = Depends(usuario_actual)):
    return q_all(
        "SELECT id, nombre, telefono, correo, fecha_registro "
        "FROM clientes WHERE activo = 1 ORDER BY nombre"
    )


@router.post("/", status_code=201)
def crear(c: ClienteIn, _: dict = Depends(usuario_actual)):
    cid = run(
        "INSERT INTO clientes (nombre, telefono, correo) VALUES (?, ?, ?)",
        (c.nombre, c.telefono, c.correo),
    )
    return q_one("SELECT * FROM clientes WHERE id = ?", (cid,))


@router.put("/{cid}")
def actualizar(cid: int, c: ClienteIn, _: dict = Depends(usuario_actual)):
    if not q_one("SELECT id FROM clientes WHERE id = ?", (cid,)):
        raise HTTPException(404, "Cliente no encontrado.")
    run(
        "UPDATE clientes SET nombre = ?, telefono = ?, correo = ? WHERE id = ?",
        (c.nombre, c.telefono, c.correo, cid),
    )
    return q_one("SELECT * FROM clientes WHERE id = ?", (cid,))


@router.delete("/{cid}")
def eliminar(cid: int, _: dict = Depends(usuario_actual)):
    if not q_one("SELECT id FROM clientes WHERE id = ?", (cid,)):
        raise HTTPException(404, "Cliente no encontrado.")
    tiene = q_one("SELECT 1 FROM pedidos WHERE cliente_id = ? LIMIT 1", (cid,))
    if tiene:
        raise HTTPException(409, "El cliente tiene pedidos asociados; no se puede eliminar.")
    run("DELETE FROM clientes WHERE id = ?", (cid,))
    return {"eliminado": cid}


@router.get("/{cid}/historial")
def historial(cid: int, _: dict = Depends(usuario_actual)):
    return q_all(
        "SELECT id, fecha, estado, total FROM pedidos "
        "WHERE cliente_id = ? ORDER BY fecha DESC, id DESC",
        (cid,),
    )
