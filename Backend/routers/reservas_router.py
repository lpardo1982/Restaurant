"""CRUD de reservas."""

from fastapi import APIRouter, Depends, HTTPException

from auth import usuario_actual
from database import q_all, q_one, run
from models import ReservaIn

router = APIRouter()


@router.get("/")
def listar(fecha: str | None = None, _: dict = Depends(usuario_actual)):
    if fecha:
        return q_all(
            "SELECT * FROM reservas WHERE fecha = ? ORDER BY hora", (fecha,)
        )
    return q_all("SELECT * FROM reservas ORDER BY fecha DESC, hora")


@router.post("/", status_code=201)
def crear(r: ReservaIn, _: dict = Depends(usuario_actual)):
    rid = run(
        "INSERT INTO reservas (cliente_id, fecha, hora, personas, mesa, estado) "
        "VALUES (?, ?, ?, ?, ?, 'pendiente')",
        (r.cliente_id, r.fecha, r.hora, r.personas, r.mesa),
    )
    return q_one("SELECT * FROM reservas WHERE id = ?", (rid,))


@router.put("/{rid}/estado/{estado}")
def cambiar_estado(rid: int, estado: str, _: dict = Depends(usuario_actual)):
    valido = q_one(
        "SELECT 1 FROM catalogos WHERE tipo = 'estados_reserva' AND codigo = ?",
        (estado,),
    )
    if not valido:
        raise HTTPException(400, "Estado inválido.")
    if not q_one("SELECT id FROM reservas WHERE id = ?", (rid,)):
        raise HTTPException(404, "Reserva no encontrada.")
    run("UPDATE reservas SET estado = ? WHERE id = ?", (estado, rid))
    return q_one("SELECT * FROM reservas WHERE id = ?", (rid,))
