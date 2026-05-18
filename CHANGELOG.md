# Changelog

Todas las versiones notables del proyecto SIGR — "Sabor & Mesa".
El formato sigue las convenciones de [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/)
y el versionado [SemVer](https://semver.org/lang/es/).

## [1.0.0-baseline] — 2026-05-17

### Añadido — Línea base inicial

- **Estructura del proyecto** organizada por módulos (`auth`, `menu`, `pedidos`,
  `reservas`, `clientes`, `facturacion`, `reportes`) más el **núcleo transversal**
  (`storage`, `config`, `i18n`, `app`).
- **Catálogos y parámetros editables** (`js/config.js`): categorías de platos,
  estados de pedidos y reservas, roles, permisos por rol, lista de módulos, IVA,
  datos de la empresa, moneda. Cumple la política QMSPM "nada quemado".
- **Internacionalización ES + EN** (`i18n/es.json`, `i18n/en.json`, `js/i18n.js`)
  con selector de idioma en el header.
- **Módulo de autenticación** con tres roles (administrador, mesero, cocinero) y
  control de acceso por rol en la navegación.
- **Módulo de menú** con CRUD de platos (nombre, categoría, precio, disponibilidad).
- **Módulo de pedidos** con creación, listado, cambio de estado y cálculo de total.
- **Módulo de reservas** con creación, listado y cancelación.
- **Módulo de clientes** con registro, búsqueda por nombre/teléfono y consulta de
  historial de pedidos.
- **Módulo de facturación** con generación de factura a partir de un pedido y
  cálculo automático de IVA al 19 %.
- **Módulo de reportes** con indicadores básicos: ventas del día, pedidos por
  estado y top de platos vendidos.
- **Persistencia** en `localStorage` con datos de prueba precargados.
- **CSS separado** (sin `style="..."` inline ni en HTML ni en strings de JS); las
  medidas dinámicas se inyectan vía CSS custom properties.
- **Documentación** mínima: README, CHANGELOG, LICENSE y `docs/arquitectura.md`.
- **Convenciones de código** definidas y aprobadas por el grupo.

### Criterios de aceptación de la línea base

- [x] La aplicación abre sin errores en consola en Chrome y Edge.
- [x] Cada módulo carga su vista al hacer clic en la barra lateral.
- [x] El login valida credenciales y restringe accesos por rol.
- [x] Los datos persisten al recargar la página.
- [x] La interfaz es responsive en viewports de 360, 768 y 1280 px.
