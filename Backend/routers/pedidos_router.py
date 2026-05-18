"""CRUD de pedidos + cambio de estado."""

from fastapi import APIRouter, Depends, HTTPException

from auth import requiere_rol, usuario_actual
from database import cursor, q_all, q_one, run
from models import CambiarEstadoIn, PedidoIn

router = APIRouter()


def _construir_pedido(pid: int) -> dict:
    pedido = q_one("SELECT * FROM pedidos WHERE id = ?", (pid,))
    if not pedido:
        return None
    pedido["items"] = q_all(
        "SELECT plato_id, nombre_snapshot AS nombre, "
        "precio_snapshot AS precio, cantidad "
        "FROM pedido_items WHERE pedido_id = ?",
        (pid,),
    )
    return pedido


@router.get("/")
def listar(estado: str | None = None, _: dict = Depends(usuario_actual)):
    if estado:
        peds = q_all(
            "SELECT * FROM pedidos WHERE estado = ? ORDER BY id DESC", (estado,)
        )
    else:
        peds = q_all("SELECT * FROM pedidos ORDER BY id DESC")
    for p in peds:
        p["items"] = q_all(
            "SELECT plato_id, nombre_snapshot AS nombre, "
            "precio_snapshot AS precio, cantidad "
            "FROM pedido_items WHERE pedido_id = ?",
            (p["id"],),
        )
    return peds


@router.post("/", status_code=201)
def crear(p: PedidoIn, _: dict = Depends(requiere_rol("admin", "mesero"))):
    if not p.items:
        raise HTTPException(400, "El pedido debe tener al menos un item.")

    # Snapshot de nombre y precio de cada plato (los valores actuales)
    snapshots = []
    total = 0
    for it in p.items:
        plato = q_one("SELECT * FROM platos WHERE id = ?", (it.plato_id,))
        if not plato:
            raise HTTPException(400, f"Plato {it.plato_id} no existe.")
        snapshots.append((plato, it.cantidad))
        total += plato["precio"] * it.cantidad

    with cursor() as cur:
        cur.execute(
            "INSERT INTO pedidos (cliente_id, mesa, estado, total) "
            "VALUES (?, ?, 'pendiente', ?)",
            (p.cliente_id, p.mesa, total),
        )
        pid = cur.lastrowid
        for plato, cant in snapshots:
            cur.execute(
                "INSERT INTO pedido_items "
                "(pedido_id, plato_id, nombre_snapshot, precio_snapshot, cantidad) "
                "VALUES (?, ?, ?, ?, ?)",
                (pid, plato["id"], plato["nombre"], plato["precio"], cant),
            )
    return _construir_pedido(pid)


@router.put("/{pid}/estado")
def cambiar_estado(
    pid: int,
    datos: CambiarEstadoIn,
    _: dict = Depends(requiere_rol("admin", "mesero")),
):
    if not q_one("SELECT id FROM pedidos WHERE id = ?", (pid,)):
        raise HTTPException(404, "Pedido no encontrado.")
    valido = q_one(
        "SELECT 1 FROM catalogos WHERE tipo = 'estados_pedido' AND codigo = ?",
        (datos.estado,),
    )
    if not valido:
        raise HTTPException(400, "Estado inválido.")
    run("UPDATE pedidos SET estado = ? WHERE id = ?", (datos.estado, pid))
    return _construir_pedido(pid)


@router.delete("/{pid}")
def cancelar(pid: int, _: dict = Depends(requiere_rol("admin", "mesero"))):
    """Cancela un pedido (soft: cambia el estado a 'cancelado')."""
    if not q_one("SELECT id FROM pedidos WHERE id = ?", (pid,)):
        raise HTTPException(404, "Pedido no encontrado.")
    run("UPDATE pedidos SET estado = 'cancelado' WHERE id = ?", (pid,))
    return {"cancelado": pid}
