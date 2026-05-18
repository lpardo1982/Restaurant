"""Esquemas Pydantic compartidos por los routers."""

from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field


# ----------------------------- Auth -----------------------------
class LoginIn(BaseModel):
    email: EmailStr
    clave: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: dict


# ----------------------------- Menú -----------------------------
class PlatoIn(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=120)
    categoria: str
    precio: int = Field(..., ge=0)
    disponible: bool = True


# --------------------------- Clientes ---------------------------
class ClienteIn(BaseModel):
    nombre: str = Field(..., min_length=1, max_length=120)
    telefono: str = Field(..., min_length=4, max_length=30)
    correo: Optional[EmailStr] = None


# --------------------------- Pedidos ----------------------------
class PedidoItemIn(BaseModel):
    plato_id: int
    cantidad: int = Field(..., gt=0)


class PedidoIn(BaseModel):
    cliente_id: int
    mesa: int = Field(..., ge=1, le=50)
    items: List[PedidoItemIn]


class CambiarEstadoIn(BaseModel):
    estado: str


# --------------------------- Reservas ---------------------------
class ReservaIn(BaseModel):
    cliente_id: int
    fecha: str
    hora: str
    personas: int = Field(..., gt=0, le=20)
    mesa: int = Field(..., ge=1, le=50)


# -------------------------- Facturación -------------------------
class FacturaIn(BaseModel):
    pedido_id: int
