"""Endpoints de catálogos, parámetros y módulos (datos de configuración)."""

from fastapi import APIRouter, Depends

from auth import usuario_actual
from database import q_all

router = APIRouter()


@router.get("/catalogos/{tipo}")
def listar_catalogo(tipo: str, _: dict = Depends(usuario_actual)):
    """Lista los ítems de un catálogo (categorías de plato, estados, roles)."""
    return q_all(
        "SELECT codigo, nombre, badge, orden FROM catalogos "
        "WHERE tipo = ? AND activo = 1 ORDER BY orden, nombre",
        (tipo,),
    )


@router.get("/parametros")
def parametros(_: dict = Depends(usuario_actual)):
    """Devuelve todos los parámetros como diccionario plano."""
    filas = q_all("SELECT clave, valor FROM parametros")
    return {f["clave"]: f["valor"] for f in filas}


@router.get("/modulos")
def modulos(user: dict = Depends(usuario_actual)):
    """Devuelve los módulos accesibles para el rol del usuario actual."""
    return q_all(
        """
        SELECT m.codigo, m.icono, m.clave_i18n, m.orden
        FROM modulos m
        JOIN permisos p ON p.modulo = m.codigo
        WHERE p.rol = ? AND m.activo = 1
        ORDER BY m.orden
        """,
        (user["rol"],),
    )
