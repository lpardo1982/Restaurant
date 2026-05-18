-- ===========================================================================
-- SIGR - Sabor & Mesa - Schema SQLite (línea base v1.0.0)
-- Política QMSPM: catálogos y parámetros tipados, FKs reales, soft-delete.
-- ===========================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Usuarios del sistema (login con email)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  email        TEXT    NOT NULL UNIQUE,
  clave_hash   TEXT    NOT NULL,
  nombre       TEXT    NOT NULL,
  rol          TEXT    NOT NULL CHECK (rol IN ('admin', 'mesero', 'cocinero')),
  activo       INTEGER NOT NULL DEFAULT 1,
  created_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS ix_usuarios_email ON usuarios(email);

-- ---------------------------------------------------------------------------
-- Catálogos tipados (categorías de plato, estados de pedido, etc.)
-- "Nada quemado": vivien aquí, editables vía CRUD.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS catalogos (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo    TEXT    NOT NULL,
  codigo  TEXT    NOT NULL,
  nombre  TEXT    NOT NULL,
  badge   TEXT,
  orden   INTEGER NOT NULL DEFAULT 0,
  activo  INTEGER NOT NULL DEFAULT 1,
  UNIQUE (tipo, codigo)
);

CREATE INDEX IF NOT EXISTS ix_catalogos_tipo ON catalogos(tipo);

-- ---------------------------------------------------------------------------
-- Parámetros del negocio (IVA/INC, datos de empresa, idioma por defecto, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS parametros (
  clave        TEXT PRIMARY KEY,
  valor        TEXT NOT NULL,
  descripcion  TEXT
);

-- ---------------------------------------------------------------------------
-- Matriz de permisos rol -> módulo
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS permisos (
  rol      TEXT NOT NULL,
  modulo   TEXT NOT NULL,
  PRIMARY KEY (rol, modulo)
);

-- ---------------------------------------------------------------------------
-- Módulos del sistema (orden, ícono, clave de traducción)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS modulos (
  codigo       TEXT PRIMARY KEY,
  icono        TEXT NOT NULL,
  clave_i18n   TEXT NOT NULL,
  orden        INTEGER NOT NULL DEFAULT 0,
  activo       INTEGER NOT NULL DEFAULT 1
);

-- ---------------------------------------------------------------------------
-- Negocio: platos, clientes, pedidos, reservas, facturas
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre        TEXT    NOT NULL,
  -- categoria referencia (logicamente) catalogos.codigo con tipo='categorias_plato'.
  -- La FK se valida en la capa de aplicacion porque catalogos.codigo no es
  -- unico por si solo (es UNIQUE compuesto con tipo).
  categoria     TEXT    NOT NULL,
  precio        INTEGER NOT NULL CHECK (precio >= 0),
  disponible    INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre          TEXT NOT NULL,
  telefono        TEXT NOT NULL,
  correo          TEXT,
  fecha_registro  TEXT NOT NULL DEFAULT (DATE('now')),
  activo          INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS pedidos (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id  INTEGER NOT NULL,
  mesa        INTEGER NOT NULL CHECK (mesa BETWEEN 1 AND 50),
  fecha       TEXT    NOT NULL DEFAULT (DATE('now')),
  estado      TEXT    NOT NULL,
  total       INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE INDEX IF NOT EXISTS ix_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS ix_pedidos_fecha   ON pedidos(fecha);
CREATE INDEX IF NOT EXISTS ix_pedidos_estado  ON pedidos(estado);

CREATE TABLE IF NOT EXISTS pedido_items (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id         INTEGER NOT NULL,
  plato_id          INTEGER NOT NULL,
  nombre_snapshot   TEXT    NOT NULL,
  precio_snapshot   INTEGER NOT NULL,
  cantidad          INTEGER NOT NULL CHECK (cantidad > 0),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (plato_id)  REFERENCES platos(id)
);

CREATE INDEX IF NOT EXISTS ix_items_pedido ON pedido_items(pedido_id);

CREATE TABLE IF NOT EXISTS reservas (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id  INTEGER NOT NULL,
  fecha       TEXT    NOT NULL,
  hora        TEXT    NOT NULL,
  personas    INTEGER NOT NULL CHECK (personas > 0),
  mesa        INTEGER NOT NULL CHECK (mesa BETWEEN 1 AND 50),
  estado      TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

CREATE INDEX IF NOT EXISTS ix_reservas_fecha ON reservas(fecha);

-- Facturación: INC del 8 % para restaurantes (Art. 512-1 E.T. Colombia)
CREATE TABLE IF NOT EXISTS facturas (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id       INTEGER NOT NULL UNIQUE,
  cliente_id      INTEGER NOT NULL,
  fecha           TEXT    NOT NULL DEFAULT (DATE('now')),
  subtotal        INTEGER NOT NULL,
  inc             INTEGER NOT NULL,   -- Impuesto Nacional al Consumo
  total           INTEGER NOT NULL,
  created_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pedido_id)  REFERENCES pedidos(id),
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);
