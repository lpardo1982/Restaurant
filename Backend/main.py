"""SIGR - Sabor & Mesa - Backend FastAPI.
Punto de entrada: define la aplicación, CORS y monta los routers por módulo."""

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Cargar .env (si existe) ANTES de importar routers porque algunos leen env.
load_dotenv(Path(__file__).parent / ".env")

from routers import (  # noqa: E402 (carga de .env debe ir antes)
    auth_router,
    catalogos_router,
    clientes_router,
    facturacion_router,
    menu_router,
    pedidos_router,
    reportes_router,
    reservas_router,
)


app = FastAPI(
    title="SIGR - Sabor & Mesa",
    version="1.0.0-baseline",
    description="API REST del Sistema Integral de Gestión de Restaurante.",
)

# CORS: permitimos el origen del frontend (puerto del http.server local).
origenes = (os.environ.get("SIGR_CORS_ORIGEN") or "http://localhost:9040").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origenes + ["http://127.0.0.1:9040"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montaje de routers
app.include_router(auth_router.router,        prefix="/api/auth",        tags=["auth"])
app.include_router(catalogos_router.router,   prefix="/api",             tags=["catalogos"])
app.include_router(menu_router.router,        prefix="/api/menu",        tags=["menu"])
app.include_router(clientes_router.router,    prefix="/api/clientes",    tags=["clientes"])
app.include_router(pedidos_router.router,     prefix="/api/pedidos",     tags=["pedidos"])
app.include_router(reservas_router.router,    prefix="/api/reservas",    tags=["reservas"])
app.include_router(facturacion_router.router, prefix="/api/facturacion", tags=["facturacion"])
app.include_router(reportes_router.router,    prefix="/api/reportes",    tags=["reportes"])


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok", "version": app.version}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=int(os.environ.get("SIGR_PUERTO", "8001")),
        reload=True,
    )
