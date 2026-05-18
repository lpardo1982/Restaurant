# Guía de Gestión de Configuración — SIGR (Unidad 2)

Este documento consolida los tres bloques de la Unidad 2 del curso *Gestión
del Software* aplicados al proyecto SIGR "Sabor & Mesa":

1. **2.1 Gestión de cambios** (RFC, ciclo de aprobación, herramientas).
2. **2.2 Definición de líneas base** (tipos, propósitos, versionado semántico).
3. **2.3 Uso de herramientas** (Git + Jenkins + ecosistema CI/CD).

---

## 1. Gestión de cambios (RFC — Request for Change)

### 1.1 ¿Qué es una RFC?

Una **RFC (Request for Change)** es la solicitud formal para modificar un
artefacto que pertenece a una línea base aprobada. **Ningún cambio entra al
producto sin pasar por una RFC**: garantiza trazabilidad, evaluación de
impacto y aprobación de los responsables.

### 1.2 Anatomía de una RFC

| Campo | Descripción |
|---|---|
| **ID único del cambio** | Identificador correlativo (RFC-001, RFC-002…). |
| **Descripción del problema** | Qué está mal o qué necesidad surge. |
| **Objetivo del cambio** | Resultado esperado tras aplicar el cambio. |
| **Análisis de impacto** | Tiempo estimado, costo, riesgo, componentes afectados. |
| **Solicitante y responsable técnico** | Quién pide el cambio y quién lo implementa. |
| **Fecha propuesta de implementación** | Cuándo se planea liberar el cambio. |
| **Criterios de aceptación** | Pruebas/checklist que validan que el cambio cumple el objetivo. |

> Ver [`PLANTILLA_RFC.md`](PLANTILLA_RFC.md) para el formulario en blanco
> y [`RFC-001-cambio-iva-a-inc.md`](RFC-001-cambio-iva-a-inc.md) para un
> ejemplo real diligenciado en este proyecto.

### 1.3 Ciclo de vida de una RFC

```
┌──────────┐   ┌─────────┐   ┌──────────┐   ┌────────────┐   ┌────────┐   ┌──────────┐
│ Solicitud│ → │Análisis │ → │ Comité   │ → │Implementar │ → │Validar │ → │ Cerrar / │
│  (RFC)   │   │ impacto │   │ aprobar  │   │  (rama Git)│   │(pruebas│   │ archivar │
│          │   │         │   │  CCB     │   │ + tests)   │   │ + UAT) │   │          │
└──────────┘   └─────────┘   └──────────┘   └────────────┘   └────────┘   └──────────┘
                                  │
                                  ▼  (si se rechaza)
                              ┌────────┐
                              │ Rechazo│
                              │  + log │
                              └────────┘
```

CCB = *Change Control Board* (comité de control de cambios).

### 1.4 Tipos de cambio

| Tipo | Cuándo aplica | Ejemplo en SIGR |
|---|---|---|
| **Correctivo** | Corregir un defecto detectado. | Bug en el cálculo del subtotal del pedido. |
| **Adaptativo** | Adaptarse a un cambio externo (legal, infraestructura). | Cambiar **IVA 19 % por INC 8 %** (ver RFC-001). |
| **Evolutivo** | Agregar nueva funcionalidad. | Módulo de inventario de insumos. |
| **Preventivo** | Mejorar mantenibilidad o desempeño sin cambiar funcionalidad visible. | Refactor del módulo de reportes para reducir consultas SQL. |

### 1.5 Herramientas para gestionar RFCs

| Herramienta | Uso típico |
|---|---|
| **Jira** | Tickets, flujos de estado configurables, integración con Git. |
| **GitLab Issues** | Issues nativas del repo, conectadas a commits y PRs. |
| **Azure DevOps Boards** | Work Items con plantillas (CMMI, Agile, Scrum). |
| **ServiceNow** | Gestión empresarial de cambios (ITIL). |

**En SIGR** las RFCs viven como archivos versionados en `docs/RFC-*.md`. Para
un equipo más grande, recomendamos migrar a **Jira** (gratuito hasta 10
usuarios) y enlazar cada RFC con su rama Git por nombre (`feat/RFC-002-...`).

---

## 2. Definición de líneas base (Baselines)

### 2.1 ¿Qué es una línea base?

> *Una línea base es un conjunto de artefactos de software formalmente
> revisado y aprobado, que sirve como punto de referencia para el desarrollo
> posterior. Solo puede modificarse mediante un proceso formal de control de
> cambios.*

**Analogía**: los planos aprobados de un edificio. Una vez firmados,
cualquier modificación requiere un nuevo proceso de aprobación (= RFC).

### 2.2 Propósitos (los 5 pilares)

| Pilar | Qué garantiza |
|---|---|
| **Control de evolución** | Se sabe exactamente qué cambió y cuándo. |
| **Trabajo consistente** | Todo el equipo trabaja sobre la misma versión. |
| **Recuperación** | Se puede volver a una versión estable conocida. |
| **Auditoría** | Trazabilidad completa del proyecto. |
| **Despliegue seguro** | Solo se despliegan versiones aprobadas. |

### 2.3 Tipos de líneas base en el ciclo de vida

| Línea base | Qué contiene | En SIGR |
|---|---|---|
| **Funcional** | Requisitos aprobados. | `docs/arquitectura.md` + RFCs aprobadas. |
| **Asignada** | Diseño arquitectónico aprobado. | Sección "Arquitectura lógica" en `arquitectura.md`. |
| **Desarrollo** | Código integrado, compilable. | Tag `v1.0.0-baseline` en Git. |
| **Producto** | Versión lista para despliegue. | Artefacto `sigr-<BUILD>.zip` producido por Jenkins. |

> **Regla**: cada línea base es **un hito aprobado y congelado**.

### 2.4 Implementación con Git Tags + Versionado Semántico

**Convención SemVer:** `v{MAJOR}.{MINOR}.{PATCH}` ([semver.org](https://semver.org/lang/es/)).

| Componente | Cuándo se incrementa | Ejemplo |
|---|---|---|
| **MAJOR** | Cambio incompatible (breaking change). | `v1.x.x → v2.0.0` |
| **MINOR** | Funcionalidad nueva, retro-compatible. | `v1.0.x → v1.1.0` |
| **PATCH** | Corrección de bug, retro-compatible. | `v1.1.0 → v1.1.1` |

Línea de tiempo:

```
v1.0.0  ──►  v1.1.0  ──►  v1.1.1  ──►  v2.0.0
 │            │            │            │
 │            │            │            └── Major breaking change
 │            │            └── Patch fix
 │            └── Minor feature added
 └── Initial release  (← LA LÍNEA BASE DE ESTE PROYECTO)
```

### 2.5 Comandos para crear, listar y publicar tags

```powershell
# Crear tag anotado (recomendado para línea base)
git tag -a v1.0.0-baseline -m "Linea base inicial SIGR - estructura + backend + BD + i18n + CI"

# Listar
git tag

# Publicar al remoto
git push origin v1.0.0-baseline

# Volver puntualmente a una línea base (sin perder el HEAD actual)
git checkout v1.0.0-baseline

# Comparar lo que cambió desde la línea base
git diff v1.0.0-baseline..HEAD --stat
```

---

## 3. Uso de herramientas (ecosistema)

### 3.1 Matriz de herramientas usadas en SIGR

| Categoría | Herramienta usada | Alternativas conocidas | Para qué se usa aquí |
|---|---|---|---|
| **Control de versiones** | **Git + GitHub** | GitLab, Bitbucket | Versionado del código, ramas, tags de línea base. |
| **Gestión ALM** | `docs/RFC-*.md` (markdown versionado) | Polarion, IBM EWM, Jira | Trazabilidad de cambios. |
| **CI/CD** | **Jenkins** (declarativo) | GitHub Actions, GitLab CI, Azure Pipelines | Etiquetar builds estables, correr tests y desplegar. |
| **Documentación** | Markdown en `docs/` + README | Confluence + Jira | Decisiones técnicas, RFCs, guías. |
| **Artefactos** | `archiveArtifacts` de Jenkins (`sigr-<BUILD>.zip`) | Nexus, Artifactory | Almacenar versiones compiladas y reportes. |
| **Análisis estático** | `flake8` | SonarQube, Pylint | Detectar olores de código antes de fusionar. |
| **Pruebas** | `pytest` + `httpx` + `TestClient` | unittest, JUnit | Validar API y reglas de negocio. |
| **Reportes** | `pytest-html` + `publishHTML` | Allure, ReportPortal | Mostrar resultados de pruebas en cada build. |

### 3.2 ¿Por qué Jenkins?

- **Open source** y gratuito.
- **Extensible**: 1800+ plugins disponibles.
- **Multi-plataforma**: Linux, Windows, macOS.
- **Integrable**: Git, Docker, AWS, Kubernetes, Slack, Teams.
- Orquesta el flujo completo: compilación → pruebas → análisis → despliegue.

### 3.3 Flujo completo Git + Jenkins en SIGR

```
Desarrollador                GitHub                      Jenkins
     │                          │                            │
     │ git push feat/RFC-002    │                            │
     ├─────────────────────────►│                            │
     │                          │  webhook (o polling)       │
     │                          ├───────────────────────────►│
     │                          │                            │ Pipeline:
     │                          │                            │  1. Verificar Entorno
     │                          │                            │  2. Instalar Deps
     │                          │                            │  3. Análisis (flake8)
     │                          │                            │  4. Pruebas (pytest)
     │                          │                            │  5. Generar Reporte
     │                          │                            │  6. Crear Baseline
     │                          │                            │  7. Despliegue
     │                          │                            │
     │                          │   git tag vX.Y.Z + push    │
     │                          │◄───────────────────────────┤
     │                          │                            │
     │  Pull Request a main     │                            │
     ├─────────────────────────►│                            │
     │                          │ merge → trigger pipeline   │
     │                          ├───────────────────────────►│
```

### 3.4 Resolución de conflictos en Git (operativa)

```powershell
# Estás en feat/RFC-002 y main avanzó
git fetch origin
git rebase origin/main          # reaplica tus commits encima de main

# Si hay conflicto en archivo X:
# 1) Abrir el archivo, buscar <<<<<<<, =======, >>>>>>>
# 2) Editar manualmente, dejando la versión correcta
git add <archivo-resuelto>
git rebase --continue

# Para abortar y dejar todo como antes:
git rebase --abort
```

**Buenas prácticas para evitar conflictos**:

- Ramas cortas (1–3 días máximo).
- Hacer `git pull --rebase` antes de empezar a editar.
- Commits pequeños y descriptivos.
- Coordinar quién toca qué archivo en cada sprint.

---

## 4. Cobertura de objetivos de aprendizaje

| Objetivo del syllabus | Cómo se cubre en SIGR |
|---|---|
| Comprender el proceso formal de gestión de cambios | Este documento + `RFC-001-cambio-iva-a-inc.md` |
| Definir y aplicar líneas base como mecanismo de control | Tag `v1.0.0-baseline` + sección 2 de este documento |
| Configurar y ejecutar pipelines automatizados con Jenkins | `Jenkinsfile` + `docs/GUIA_PIPELINE.md` |
| Utilizar Git para control de versiones, ramas y resolución de conflictos | `docs/GUIA_GIT.md` + sección 3.4 de este documento |
| Diseñar flujos CI/CD básicos para proyectos reales | Pipeline de 7 stages en el `Jenkinsfile` + diagrama de la sección 3.3 |
