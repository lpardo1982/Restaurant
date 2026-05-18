"""Reportes / dashboard: KPIs, pedidos por estado, top platos."""

from datetime import date

from fastapi import APIRouter, Depends

from auth import usuario_actual
from database import q_all, q_one

router = APIRouter()


@router.get("/dashboard")
def dashboard(_: dict = Depends(usuario_actual)):
    hoy = date.today().isoformat()

    ventas = q_one(
        "SELECT COALESCE(SUM(total), 0) AS v, COUNT(*) AS n "
        "FROM facturas WHERE fecha = ?",
        (hoy,),
    )
    pedidos_hoy = q_one(
        "SELECT COUNT(*) AS n, COALESCE(SUM(total), 0) AS suma "
        "FROM pedidos WHERE fecha = ?",
        (hoy,),
    )
    pedidos_tot = q_one("SELECT COUNT(*) AS n FROM pedidos")
    reservas_hoy = q_one(
        "SELECT COUNT(*) AS n FROM reservas WHERE fecha = ?", (hoy,)
    )
    reservas_tot = q_one("SELECT COUNT(*) AS n FROM reservas")
    clientes_tot = q_one("SELECT COUNT(*) AS n FROM clientes WHERE activo = 1")

    ticket_prom = 0
    if pedidos_hoy["n"] > 0:
        ticket_prom = round(pedidos_hoy["suma"] / pedidos_hoy["n"])

    pedidos_por_estado = q_all(
        "SELECT estado, COUNT(*) AS n FROM pedidos GROUP BY estado"
    )
    top_platos = q_all(
        "SELECT nombre_snapshot AS nombre, SUM(cantidad) AS unidades "
        "FROM pedido_items pi "
        "JOIN pedidos p ON p.id = pi.pedido_id AND p.estado != 'cancelado' "
        "GROUP BY nombre_snapshot ORDER BY unidades DESC LIMIT 5"
    )

    return {
        "fecha": hoy,
        "ventas_dia": ventas["v"],
        "facturas_dia": ventas["n"],
        "pedidos_dia": pedidos_hoy["n"],
        "pedidos_totales": pedidos_tot["n"],
        "reservas_dia": reservas_hoy["n"],
        "reservas_totales": reservas_tot["n"],
        "clientes_totales": clientes_tot["n"],
        "ticket_promedio": ticket_prom,
        "pedidos_por_estado": pedidos_por_estado,
        "top_platos": top_platos,
    }
