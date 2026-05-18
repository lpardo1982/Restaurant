-- ===========================================================================
-- Seeds: datos de prueba (platos, clientes, pedidos, reservas, facturas).
-- Los usuarios se siembran desde seed.py para hashear las contraseñas.
-- ===========================================================================

INSERT OR IGNORE INTO platos (id, nombre, categoria, precio, disponible) VALUES
  (1,  'Bandeja paisa',         'plato_fuerte', 28000, 1),
  (2,  'Ajiaco santafereño',    'sopa',         22000, 1),
  (3,  'Sancocho de gallina',   'sopa',         24000, 1),
  (4,  'Lomo de res al ajillo', 'plato_fuerte', 32000, 1),
  (5,  'Pollo a la plancha',    'plato_fuerte', 26000, 1),
  (6,  'Ensalada César',        'entrada',      18000, 1),
  (7,  'Empanadas (x3)',        'entrada',       9000, 1),
  (8,  'Limonada de coco',      'bebida',        8000, 1),
  (9,  'Jugo de mango',         'bebida',        6000, 1),
  (10, 'Brownie con helado',    'postre',       12000, 1);

INSERT OR IGNORE INTO clientes (id, nombre, telefono, correo, fecha_registro) VALUES
  (1, 'Luis Pardo',     '3001112233', 'luis@correo.com',   '2026-04-10'),
  (2, 'María Gómez',    '3014445566', 'maria@correo.com',  '2026-04-12'),
  (3, 'Carlos Ramírez', '3027778899', 'carlos@correo.com', '2026-04-15'),
  (4, 'Ana Torres',     '3039990011', 'ana@correo.com',    '2026-04-20');

INSERT OR IGNORE INTO pedidos (id, cliente_id, mesa, fecha, estado, total) VALUES
  (1, 1, 5, DATE('now'), 'pagado',      72000),
  (2, 2, 3, DATE('now'), 'preparacion', 50000),
  (3, 3, 8, DATE('now'), 'pendiente',   22000);

INSERT OR IGNORE INTO pedido_items (pedido_id, plato_id, nombre_snapshot, precio_snapshot, cantidad) VALUES
  (1, 1, 'Bandeja paisa',         28000, 2),
  (1, 8, 'Limonada de coco',       8000, 2),
  (2, 4, 'Lomo de res al ajillo', 32000, 1),
  (2, 6, 'Ensalada César',        18000, 1),
  (3, 2, 'Ajiaco santafereño',    22000, 1);

INSERT OR IGNORE INTO reservas (id, cliente_id, fecha, hora, personas, mesa, estado) VALUES
  (1, 1, DATE('now'), '19:30', 4, 5, 'confirmada'),
  (2, 2, DATE('now'), '20:00', 2, 3, 'pendiente');

-- Factura del pedido #1: subtotal 72000 + INC 8 % = 5760 -> total 77760
INSERT OR IGNORE INTO facturas (id, pedido_id, cliente_id, fecha, subtotal, inc, total) VALUES
  (1, 1, 1, DATE('now'), 72000, 5760, 77760);
