"""Endpoints de autenticación: login con email + clave."""

from fastapi import APIRouter, Depends, HTTPException

from auth import crear_token, usuario_actual, verificar_clave
from database import q_one
from models import LoginIn, TokenOut

router = APIRouter()


@router.post("/login", response_model=TokenOut)
def login(datos: LoginIn):
    """Valida credenciales por email y devuelve un JWT firmado."""
    u = q_one(
        "SELECT id, email, clave_hash, nombre, rol, activo "
        "FROM usuarios WHERE email = ?",
        (datos.email.lower(),),
    )
    if not u or not u["activo"] or not verificar_clave(datos.clave, u["clave_hash"]):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos.")

    token = crear_token(u)
    publico = {k: u[k] for k in ("id", "email", "nombre", "rol")}
    return {"access_token": token, "token_type": "bearer", "usuario": publico}


@router.get("/me")
def quien_soy(user: dict = Depends(usuario_actual)):
    """Devuelve el usuario asociado al token actual."""
    return user
