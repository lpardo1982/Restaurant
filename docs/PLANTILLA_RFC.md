# RFC-XXX — \<Título corto del cambio\>

> Copiar este archivo a `docs/RFC-XXX-<slug-del-cambio>.md` y reemplazar
> los campos entre paréntesis angulares. El número XXX es correlativo
> (siguiente número libre).

---

## 1. Identificación

| Campo | Valor |
|---|---|
| **ID único** | RFC-XXX |
| **Título** | \<Título breve y descriptivo\> |
| **Tipo de cambio** | \<Correctivo / Adaptativo / Evolutivo / Preventivo\> |
| **Prioridad** | \<Crítica / Alta / Media / Baja\> |
| **Estado** | \<Propuesta / En análisis / Aprobada / En implementación / Validación / Cerrada / Rechazada\> |

## 2. Descripción detallada del problema

\<Explicar qué está mal o qué necesidad surge. Incluir evidencias: capturas,
logs, links a tickets de soporte.\>

## 3. Objetivo del cambio

\<Resultado esperado tras aplicar el cambio. Una frase clara.\>

## 4. Análisis de impacto

| Aspecto | Estimación |
|---|---|
| **Tiempo estimado** | \<horas o días\> |
| **Costo** | \<bajo / medio / alto — opcional valor en COP\> |
| **Riesgo** | \<bajo / medio / alto + justificación\> |
| **Componentes afectados** | \<archivos, módulos, tablas, endpoints\> |
| **Dependencias** | \<otras RFCs o features que deben estar listas antes\> |
| **Cambios en BD** | \<sí/no — describir migración\> |
| **Cambios en API** | \<sí/no — breaking change o retro-compatible\> |

## 5. Responsables

| Rol | Persona |
|---|---|
| **Solicitante** | \<Nombre — área\> |
| **Responsable técnico** | \<Nombre — desarrollador\> |
| **Aprobador (CCB)** | \<Nombre — coordinador / arquitecto\> |
| **QA / validador** | \<Nombre\> |

## 6. Fechas

| Hito | Fecha |
|---|---|
| **Solicitud creada** | YYYY-MM-DD |
| **Aprobación esperada** | YYYY-MM-DD |
| **Implementación propuesta** | YYYY-MM-DD |
| **Despliegue planificado** | YYYY-MM-DD |

## 7. Criterios de aceptación

- [ ] \<Criterio 1: por ejemplo, "el endpoint /api/x devuelve 200 con el payload Z"\>
- [ ] \<Criterio 2: "las pruebas unitarias y de integración pasan"\>
- [ ] \<Criterio 3: "la documentación correspondiente queda actualizada"\>
- [ ] \<Criterio 4: "no se introducen regresiones en módulos relacionados"\>

## 8. Plan de implementación

1. \<Paso 1 — por ejemplo, crear rama `feat/RFC-XXX-...`\>
2. \<Paso 2\>
3. \<Paso 3\>

## 9. Plan de rollback

\<Cómo revertir el cambio si en producción algo falla. Ej.: "Revertir tag
`vX.Y.Z` y restaurar BD desde el respaldo previo".\>

## 10. Vínculos

- Rama Git: `feat/RFC-XXX-<slug>`
- Pull Request: `<URL del PR>`
- Tag de despliegue: `vX.Y.Z`
- Build Jenkins: `<URL del build>`

## 11. Bitácora

| Fecha | Autor | Evento |
|---|---|---|
| YYYY-MM-DD | \<Nombre\> | RFC creada. |
| YYYY-MM-DD | \<Nombre\> | Aprobada por CCB. |
| YYYY-MM-DD | \<Nombre\> | Implementación finalizada (commit `abc1234`). |
| YYYY-MM-DD | \<Nombre\> | Validación QA OK. |
| YYYY-MM-DD | \<Nombre\> | Desplegada a producción. |
