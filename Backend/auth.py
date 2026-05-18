"""Autenticación: hash de contraseñas, emisión y verificación de JWT,
y dependencia FastAPI para proteger endpoints con permisos por rol."""

import os
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from database import q_one

SECRET = os.environ.get("SIGR_JWT_SECRET", "dev-secret-cambia-esto")
ALGO = "HS256"
HORAS = int(os.environ.get("SIGR_JWT_HORAS", "8"))

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2 = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verificar_clave(clave_plana: str, clave_hash: str) -> bool:
    return pwd.verify(clave_plana, clave_hash)


def crear_token(usuario: dict) -> str:
    """Emite un JWT con id, email y rol. Vence en SIGR_JWT_HORAS."""
    payload = {
        "sub": str(usuario["id"]),
        "email": usuario["email"],
        "nombre": usuario["nombre"],
        "rol": usuario["rol"],
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(hours=HORAS),
    }
    return jwt.encode(payload, SECRET, algorithm=ALGO)


def usuario_actual(token: str = Depends(oauth2)) -> dict:
    """Dependencia: valida el JWT y carga el usuario activo desde la BD."""
    excepcion = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas o sesión expirada.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGO])
        uid = int(payload.get("sub") or 0)
    except (JWTError, ValueError):
        raise excepcion

    fila = q_one(
        "SELECT id, email, nombre, rol, activo FROM usuarios WHERE id = ?",
        (uid,),
    )
    if not fila or not fila["activo"]:
        raise excepcion
    return fila


def requiere_rol(*roles: str):
    """Genera una dependencia que exige uno de los roles indicados."""

    def _dep(user: dict = Depends(usuario_actual)) -> dict:
        if user["rol"] not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Se requiere uno de los roles: {', '.join(roles)}.",
            )
        return user

    return _dep


def puede_acceder(rol: str, modulo: str) -> bool:
    """Consulta la matriz de permisos en BD."""
    r = q_one(
        "SELECT 1 FROM permisos WHERE rol = ? AND modulo = ?",
        (rol, modulo),
    )
    return r is not None
