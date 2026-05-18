-- ===========================================================================
-- Seeds: catálogos, parámetros, permisos y módulos del sistema.
-- ===========================================================================

-- Catálogos tipados
INSERT OR IGNORE INTO catalogos (tipo, codigo, nombre, badge, orden) VALUES
  ('categorias_plato', 'entrada',      'Entrada',         NULL,          1),
  ('categorias_plato', 'sopa',         'Sopa',            NULL,          2),
  ('categorias_plato', 'plato_fuerte', 'Plato fuerte',    NULL,          3),
  ('categorias_plato', 'bebida',       'Bebida',          NULL,          4),
  ('categorias_plato', 'postre',       'Postre',          NULL,          5),

  ('estados_pedido',   'pendiente',    'Pendiente',       'badge-aviso', 1),
  ('estados_pedido',   'preparacion',  'En preparación',  'badge-info',  2),
  ('estados_pedido',   'entregado',    'Entregado',       'badge-info',  3),
  ('estados_pedido',   'pagado',       'Pagado',          'badge-exito', 4),
  ('estados_pedido',   'cancelado',    'Cancelado',       'badge-error', 5),

  ('estados_reserva',  'pendiente',    'Pendiente',       'badge-aviso', 1),
  ('estados_reserva',  'confirmada',   'Confirmada',      'badge-exito', 2),
  ('estados_reserva',  'cancelada',    'Cancelada',       'badge-error', 3),
  ('estados_reserva',  'cumplida',     'Cumplida',        'badge-info',  4),

  ('roles',            'admin',        'Administrador',   NULL,          1),
  ('roles',            'mesero',       'Mesero',          NULL,          2),
  ('roles',            'cocinero',     'Cocinero',        NULL,          3);

-- Parámetros del negocio
-- INC 8 % es el impuesto correcto para restaurantes responsables en Colombia
-- (Art. 512-1 E.T.). Si la empresa fuese NO responsable del INC, podría aplicar
-- IVA del 19 % cambiando aquí.
INSERT OR IGNORE INTO parametros (clave, valor, descripcion) VALUES
  ('facturacion.tipo_impuesto',      'INC',                       'Tipo de impuesto: INC (restaurantes) o IVA'),
  ('facturacion.impuesto_porcentaje','8',                         'Porcentaje del impuesto al consumo'),
  ('facturacion.moneda',             'COP',                       'Moneda ISO 4217'),
  ('facturacion.pais',               'CO',                        'País ISO 3166-1 alpha-2'),
  ('facturacion.regimen',            'Responsable del INC',       'Régimen tributario'),
  ('empresa.nombre',                 'Sabor & Mesa',              'Razón social'),
  ('empresa.nit',                    '900.123.456-7',             'NIT con dígito de verificación'),
  ('empresa.direccion',              'Calle 100 # 15-20, Bogotá', 'Dirección comercial'),
  ('empresa.telefono',               '+57 601 555 0123',          'Teléfono de contacto'),
  ('empresa.correo',                 'contacto@saborymesa.co',    'Correo de contacto'),
  ('interfaz.idioma_defecto',        'es',                        'Idioma por defecto'),
  ('interfaz.idiomas_disponibles',   'es,en',                     'Idiomas disponibles');

-- Permisos rol -> módulo
INSERT OR IGNORE INTO permisos (rol, modulo) VALUES
  ('admin', 'menu'), ('admin', 'pedidos'), ('admin', 'reservas'),
  ('admin', 'clientes'), ('admin', 'facturacion'), ('admin', 'reportes'),
  ('mesero', 'menu'), ('mesero', 'pedidos'), ('mesero', 'reservas'), ('mesero', 'clientes'),
  ('cocinero', 'menu'), ('cocinero', 'pedidos');

-- Módulos del sistema
INSERT OR IGNORE INTO modulos (codigo, icono, clave_i18n, orden) VALUES
  ('reportes',    '📊', 'modulos.reportes',    1),
  ('menu',        '🍽️', 'modulos.menu',        2),
  ('pedidos',     '🧾', 'modulos.pedidos',     3),
  ('reservas',    '📅', 'modulos.reservas',    4),
  ('clientes',    '👤', 'modulos.clientes',    5),
  ('facturacion', '💵', 'modulos.facturacion', 6);
