"""Crea la base de datos SQLite, aplica el schema y siembra los datos
de prueba. Se ejecuta una sola vez con: python seed.py"""

import sqlite3
from pathlib import Path
from passlib.context import CryptContext

BASE_DIR    = Path(__file__).resolve().parent
DB_PATH     = BASE_DIR.parent / "DataBase" / "sigr.db"
SCHEMA_FILE = BASE_DIR.parent / "DataBase" / "schema.sql"
SEEDS_DIR   = BASE_DIR.parent / "DataBase" / "seeds"

# Usuarios precargados (email + clave en claro -> se hashea aquí)
USUARIOS = [
    ("administrador@masconsulta.com", "admin123",     "Administrador General", "admin"),
    ("luis.pardo@masconsulta.com",    "mesero123",    "Luis Pardo",            "mesero"),
    ("manager@qmspm.com",             "manager123",   "Manager QMSPM",         "cocinero"),
]

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hashear(clave: str) -> str:
    return pwd.hash(clave)


def main() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    print(f"BD destino: {DB_PATH}")

    con = sqlite3.connect(DB_PATH)
    con.execute("PRAGMA foreign_keys = ON")
    try:
        # 1) Schema
        with open(SCHEMA_FILE, encoding="utf-8") as f:
            con.executescript(f.read())
        print("  + schema aplicado")

        # 2) Seeds SQL en orden alfabético
        for sql_file in sorted(SEEDS_DIR.glob("*.sql")):
            with open(sql_file, encoding="utf-8") as f:
                con.executescript(f.read())
            print(f"  + seed: {sql_file.name}")

        # 3) Usuarios con clave hasheada
        for email, clave, nombre, rol in USUARIOS:
            con.execute(
                "INSERT OR IGNORE INTO usuarios (email, clave_hash, nombre, rol) "
                "VALUES (?, ?, ?, ?)",
                (email, hashear(clave), nombre, rol),
            )
        con.commit()
        print(f"  + {len(USUARIOS)} usuarios sembrados")

        print("\nBase de datos lista.")
        print("Credenciales de prueba:")
        for email, clave, nombre, rol in USUARIOS:
            print(f"  {email:40s}  {clave:12s}  ({rol})")
    finally:
        con.close()


if __name__ == "__main__":
    main()
