# RFC-001 — Cambiar IVA 19 % por INC 8 % en facturación

---

## 1. Identificación

| Campo | Valor |
|---|---|
| **ID único** | RFC-001 |
| **Título** | Cambiar el impuesto de facturación de IVA 19 % a INC 8 % |
| **Tipo de cambio** | Adaptativo (cumplimiento normativo) |
| **Prioridad** | Alta |
| **Estado** | Cerrada (implementada y validada) |

## 2. Descripción detallada del problema

La línea base inicial de SIGR calculaba un **IVA del 19 %** en todas las
facturas emitidas, basado en la tarifa general colombiana.

Sin embargo, **los restaurantes responsables del Impuesto Nacional al Consumo
(INC) NO cobran IVA al servicio de restaurante**. La tarifa correcta es del
**8 %** sobre el valor del servicio, según el **Art. 512-1 del Estatuto
Tributario** (modificado por la Ley 1819/2016).

Cobrar IVA 19 % en lugar de INC 8 % implica:

- Sobre-facturar al cliente final (+11 % indebido sobre el subtotal).
- Reportar un impuesto al que la empresa no está obligada, con riesgo
  sancionatorio ante la DIAN.
- Errores contables en el cierre mensual.

## 3. Objetivo del cambio

Reemplazar el cálculo de IVA 19 % por INC 8 % en todo el flujo de
facturación (BD, backend, frontend, reportes, documentación) **sin** romper
la compatibilidad con las facturas ya emitidas y manteniendo el parámetro
**editable desde la tabla `parametros`** para que un futuro cambio normativo
no requiera tocar código.

## 4. Análisis de impacto

| Aspecto | Estimación |
|---|---|
| **Tiempo estimado** | 2 horas |
| **Costo** | Bajo |
| **Riesgo** | Medio (afecta cálculo monetario y muestra resultado al cliente final) |
| **Componentes afectados** | `DataBase/schema.sql`, `DataBase/seeds/01_catalogos.sql`, `Backend/routers/facturacion_router.py`, `FrontEnd/js/facturacion.js`, `FrontEnd/i18n/es.json`, `FrontEnd/i18n/en.json`, `README.md`, `CHANGELOG.md` |
| **Dependencias** | Ninguna |
| **Cambios en BD** | Sí. La columna `facturas.iva` se renombra a `facturas.inc`. Los parámetros `facturacion.tipo_impuesto = 'INC'` y `facturacion.impuesto_porcentaje = '8'` se insertan en la tabla `parametros`. |
| **Cambios en API** | Sí. El campo `iva` de la respuesta de `/api/facturacion/` pasa a llamarse `inc`. Es un *breaking change* para clientes externos (no hay todavía → riesgo controlado). |

## 5. Responsables

| Rol | Persona |
|---|---|
| **Solicitante** | Luis Pardo (Coordinador) |
| **Responsable técnico** | Equipo SIGR |
| **Aprobador (CCB)** | Luis Pardo |
| **QA / validador** | Equipo SIGR |

## 6. Fechas

| Hito | Fecha |
|---|---|
| **Solicitud creada** | 2026-05-17 |
| **Aprobación CCB** | 2026-05-17 |
| **Implementación finalizada** | 2026-05-17 |
| **Validación QA** | 2026-05-17 |
| **Cerrada** | 2026-05-17 |

## 7. Criterios de aceptación

- [x] El parámetro `facturacion.tipo_impuesto` vale `INC` y
      `facturacion.impuesto_porcentaje` vale `8` tras correr `seed.py`.
- [x] El endpoint `POST /api/facturacion/` calcula `inc = round(subtotal * 0.08)`.
- [x] La factura emitida del pedido #1 (subtotal $72.000) produce:
      `subtotal = 72000`, `inc = 5760`, `total = 77760`.
- [x] La cabecera de la tabla en el frontend muestra **INC (8 %)**, no IVA.
- [x] Los textos `i18n/es.json` y `i18n/en.json` reflejan el cambio
      ("INC" / "Consumption Tax").
- [x] La factura PDF/preview menciona el respaldo normativo
      ("Art. 512-1 E.T.").
- [x] La suite `pytest tests/test_facturacion_inc.py` pasa 4/4 verde.
- [x] `flake8 Backend` no reporta nuevos warnings.

## 8. Plan de implementación

1. Renombrar la columna en `DataBase/schema.sql` (`facturas.iva` → `facturas.inc`).
2. Reemplazar los parámetros `iva_*` por `tipo_impuesto` + `impuesto_porcentaje`
   en `DataBase/seeds/01_catalogos.sql`.
3. Recrear la BD: borrar `DataBase/sigr.db` y ejecutar `python Backend/seed.py`.
4. Actualizar `Backend/routers/facturacion_router.py` para leer
   `facturacion.impuesto_porcentaje` y persistir en la columna `inc`.
5. Actualizar `FrontEnd/js/facturacion.js` para mostrar `f.inc` y la etiqueta
   `INC (8 %)`.
6. Actualizar `FrontEnd/i18n/{es,en}.json`: clave `facturacion.iva` → `facturacion.inc`.
7. Actualizar `README.md` y `CHANGELOG.md`.
8. Ejecutar `pytest tests/` y `flake8 Backend`.
9. Verificación end-to-end en navegador: emitir factura, validar visualmente.

## 9. Plan de rollback

1. Revertir el commit que implementa la RFC: `git revert <hash>`.
2. Reconstruir la BD desde el schema anterior (versión previa en historial Git).
3. Reasignar `facturacion.tipo_impuesto = 'IVA'` y `facturacion.impuesto_porcentaje = '19'`.
4. Anunciar reversión al equipo y al cliente final.

## 10. Vínculos

- Rama Git: `feat/RFC-001-iva-a-inc`
- Pull Request: \<a generar al fusionar a `main`\>
- Tag de despliegue: `v1.0.0-baseline` (cambio incluido en la línea base inicial)
- Build Jenkins: \<a generar en el primer push\>

## 11. Bitácora

| Fecha | Autor | Evento |
|---|---|---|
| 2026-05-17 | Luis Pardo | RFC creada y aprobada (cambio normativo). |
| 2026-05-17 | Equipo SIGR | Implementación: schema + seeds + backend + frontend + i18n. |
| 2026-05-17 | Equipo SIGR | Pruebas: 12/12 verdes (incluye `test_facturacion_inc.py`). |
| 2026-05-17 | Equipo SIGR | Validación end-to-end OK: factura #1 = $72.000 + $5.760 = **$77.760**. |
| 2026-05-17 | Luis Pardo | Cerrada. Incluida en la línea base `v1.0.0-baseline`. |
