"""Facturación con INC del 8 % (restaurantes Colombia, Art. 512-1 E.T.)."""

from fastapi import APIRouter, Depends, HTTPException

from auth import usuario_actual
from database import cursor, q_all, q_one
from models import FacturaIn

router = APIRouter()


def _impuesto_porcentaje() -> float:
    p = q_one("SELECT valor FROM parametros WHERE clave = 'facturacion.impuesto_porcentaje'")
    return float(p["valor"]) if p else 0.0


@router.get("/")
def listar(_: dict = Depends(usuario_actual)):
    return q_all(
        "SELECT id, pedido_id, cliente_id, fecha, subtotal, inc, total "
        "FROM facturas ORDER BY id DESC"
    )


@router.get("/{fid}")
def detalle(fid: int, _: dict = Depends(usuario_actual)):
    f = q_one("SELECT * FROM facturas WHERE id = ?", (fid,))
    if not f:
        raise HTTPException(404, "Factura no encontrada.")
    f["items"] = q_all(
        "SELECT nombre_snapshot AS nombre, precio_snapshot AS precio, cantidad "
        "FROM pedido_items WHERE pedido_id = ?",
        (f["pedido_id"],),
    )
    return f


@router.post("/", status_code=201)
def emitir(datos: FacturaIn, _: dict = Depends(usuario_actual)):
    """Emite la factura de un pedido. El pedido pasa a 'pagado'."""
    pedido = q_one("SELECT * FROM pedidos WHERE id = ?", (datos.pedido_id,))
    if not pedido:
        raise HTTPException(404, "Pedido no encontrado.")
    if pedido["estado"] == "cancelado":
        raise HTTPException(400, "No se puede facturar un pedido cancelado.")
    existente = q_one(
        "SELECT id FROM facturas WHERE pedido_id = ?", (datos.pedido_id,)
    )
    if existente:
        raise HTTPException(409, "El pedido ya tiene factura emitida.")

    subtotal = pedido["total"]
    inc = round(subtotal * _impuesto_porcentaje() / 100)
    total = subtotal + inc

    with cursor() as cur:
        cur.execute(
            "INSERT INTO facturas (pedido_id, cliente_id, subtotal, inc, total) "
            "VALUES (?, ?, ?, ?, ?)",
            (pedido["id"], pedido["cliente_id"], subtotal, inc, total),
        )
        fid = cur.lastrowid
        cur.execute("UPDATE pedidos SET estado = 'pagado' WHERE id = ?", (pedido["id"],))

    return q_one("SELECT * FROM facturas WHERE id = ?", (fid,))
