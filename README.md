# Sistema Integral de Gestión de Restaurante (SIGR) — "Sabor & Mesa"

Aplicación web full-stack para la gestión operativa de un restaurante.

- **Frontend**: HTML5, CSS3, JavaScript vanilla (sin frameworks).
- **Backend**: FastAPI (Python 3.11+) con JWT y CORS.
- **Base de datos**: SQLite (archivo único `DataBase/sigr.db`, sin servidor que instalar).
- **Internacionalización**: español + inglés (selector en vivo en la UI).
- **Tributación**: INC 8 % para restaurantes (Art. 512-1 E.T. Colombia).

Este repositorio representa la **línea base v1.0.0-baseline** del proyecto, entregable
del taller AA2 de la Unidad 2 — Gestión de la configuración (Tecnológica del Oriente).

---

## Estructura del proyecto

```
sigr-baseline/
├── README.md, CHANGELOG.md, LICENSE.txt, .gitignore
├── Jenkinsfile                  ← pipeline declarativo (7 stages)
├── pytest.ini, .flake8          ← config de pruebas y lint
├── docs/
│   ├── arquitectura.md              ← decisiones técnicas + diagrama
│   ├── GUIA_GIT.md                  ← paso a paso para subir el repo a GitHub
│   ├── GUIA_PIPELINE.md             ← paso a paso para Jenkins (incluye plugins)
│   ├── GUIA_GESTION_CAMBIOS.md      ← RFC, líneas base, SemVer, ecosistema (Unidad 2 completa)
│   ├── PLANTILLA_RFC.md             ← formato para nuevas solicitudes de cambio
│   └── RFC-001-cambio-iva-a-inc.md  ← RFC real (caso de estudio: IVA→INC)
├── tests/
│   ├── conftest.py              ← fixtures (BD efímera, TestClient, token)
│   ├── test_health.py
│   ├── test_auth.py
│   ├── test_menu.py
│   ├── test_facturacion_inc.py  ← valida cálculo INC 8 %
│   └── requirements-dev.txt
├── DataBase/
│   ├── schema.sql               ← DDL (tablas, índices, checks)
│   ├── seeds/
│   │   ├── 01_catalogos.sql     ← catálogos, parámetros, permisos, módulos
│   │   └── 02_negocio.sql       ← platos, clientes, pedidos, reservas, facturas
│   └── sigr.db                  ← (generado por seed.py)
├── Backend/
│   ├── main.py                  ← FastAPI + CORS + montaje de routers
│   ├── database.py              ← capa SQLite (q_all / q_one / run)
│   ├── auth.py                  ← JWT + bcrypt + permisos por rol
│   ├── models.py                ← schemas Pydantic
│   ├── seed.py                  ← crea BD, ejecuta schema y siembra usuarios
│   ├── requirements.txt
│   ├── .env.example
│   └── routers/
│       ├── auth_router.py       ← /api/auth/{login,me}
│       ├── catalogos_router.py  ← /api/{catalogos,parametros,modulos}
│       ├── menu_router.py       ← CRUD /api/menu
│       ├── clientes_router.py   ← CRUD /api/clientes + historial
│       ├── pedidos_router.py    ← /api/pedidos + cambio de estado
│       ├── reservas_router.py   ← /api/reservas
│       ├── facturacion_router.py← /api/facturacion (INC 8 %)
│       └── reportes_router.py   ← /api/reportes/dashboard
└── FrontEnd/
    ├── index.html               ← login + shell
    ├── assets/logo.svg
    ├── i18n/{es,en}.json        ← diccionarios de traducción
    ├── css/{styles,modules}.css ← sin estilos inline
    └── js/
        ├── api.js               ← cliente REST (fetch + JWT)
        ├── storage.js           ← localStorage (token e idioma)
        ├── config.js            ← caché de catálogos + parámetros
        ├── i18n.js              ← traductor ES / EN
        ├── auth.js              ← login + sesión
        ├── app.js               ← router interno + UI + selector idioma
        ├── menu.js, pedidos.js, reservas.js,
        ├── clientes.js, facturacion.js, reportes.js
```

---

## Arranque rápido

### 1) Instalar dependencias del backend

```bash
cd Backend
pip install -r requirements.txt
```

### 2) Crear y sembrar la base de datos (una sola vez)

```bash
python seed.py
```

Salida esperada:

```
BD destino: .../DataBase/sigr.db
  + schema aplicado
  + seed: 01_catalogos.sql
  + seed: 02_negocio.sql
  + 3 usuarios sembrados
```

### 3) Levantar el backend (puerto 8001)

```bash
python -m uvicorn main:app --port 8001 --reload
```

Endpoints disponibles en `http://127.0.0.1:8001/api`. Swagger UI en `/docs`.

### 4) Servir el frontend (puerto 9040)

En otra terminal:

```bash
cd FrontEnd
python -m http.server 9040
```

Abrir `http://localhost:9040` en el navegador.

---

## Usuarios precargados

| Email | Contraseña | Rol | Módulos accesibles |
|---|---|---|---|
| `administrador@masconsulta.com` | `admin123` | Administrador | Todos |
| `luis.pardo@masconsulta.com` | `mesero123` | Mesero | Menú (lectura), Pedidos, Reservas, Clientes |
| `manager@qmspm.com` | `manager123` | Cocinero | Menú (lectura), Pedidos (lectura) |

---

## Módulos del sistema

| Backend (router) | Frontend (módulo) | Descripción |
|---|---|---|
| `auth_router` | `auth.js` | Login con email + JWT firmado (HS256, 8 h). |
| `menu_router` | `menu.js` | CRUD de platos. Categorías desde catálogo en BD. |
| `pedidos_router` | `pedidos.js` | Toma de pedido por mesa, items y total. Estados desde BD. |
| `reservas_router` | `reservas.js` | Reservas por fecha, hora, personas y mesa. |
| `clientes_router` | `clientes.js` | Registro de clientes + historial de pedidos. |
| `facturacion_router` | `facturacion.js` | Facturas con INC 8 % (Art. 512-1 E.T.). |
| `reportes_router` | `reportes.js` | KPIs, pedidos por estado, top platos. |
| `catalogos_router` | `config.js` | Catálogos, parámetros y módulos accesibles por rol. |

---

## Convenciones de código (políticas QMSPM)

- **Idioma del código:** español de Colombia para variables, comentarios y mensajes internos. **La UI es bilingüe ES + EN** vía `i18n/`.
- **Nada quemado:** catálogos (categorías, estados, roles, módulos), permisos rol-módulo y parámetros (INC, datos de empresa, moneda) viven en **tablas SQL** con su CRUD. Cero literales en el código.
- **Tributación correcta:** restaurantes responsables del INC en Colombia facturan al **8 %** (no IVA del 19 %). Cambiable desde la tabla `parametros`.
- **CSS separado:** sin `style="..."` inline en HTML ni en strings de JS. Las medidas dinámicas (barras de progreso) se inyectan vía CSS custom properties (`--pct`).
- **Sin prompts nativos:** se usan `UI.modal()` y `UI.confirmar()` en lugar de `window.alert/confirm/prompt`.
- **1 archivo por responsabilidad:** un router por módulo en backend; un archivo JS por módulo en frontend.
- **Permisos por rol** validados tanto en frontend (oculta opciones) como en backend (devuelve 403).
- **Comentarios:** documentan la *intención* de cada función pública.

---

## Mapa de cobertura del temario (Unidad 2)

Cada objetivo del curso tiene un artefacto concreto en este repositorio:

| Tema del syllabus | Artefacto en el proyecto |
|---|---|
| **2.1 Gestión de cambios — concepto de RFC** | [`docs/GUIA_GESTION_CAMBIOS.md`](docs/GUIA_GESTION_CAMBIOS.md) §1 |
| **2.1 Anatomía y ciclo de vida de una RFC** | [`docs/PLANTILLA_RFC.md`](docs/PLANTILLA_RFC.md) (plantilla en blanco) |
| **2.1 RFC real diligenciada (caso de estudio)** | [`docs/RFC-001-cambio-iva-a-inc.md`](docs/RFC-001-cambio-iva-a-inc.md) |
| **2.1 Tipos de cambio (correctivo, adaptativo, evolutivo, preventivo)** | [`docs/GUIA_GESTION_CAMBIOS.md`](docs/GUIA_GESTION_CAMBIOS.md) §1.4 |
| **2.1 Herramientas (Jira, GitLab Issues, Azure DevOps, ServiceNow)** | [`docs/GUIA_GESTION_CAMBIOS.md`](docs/GUIA_GESTION_CAMBIOS.md) §1.5 |
| **2.2 ¿Qué es una línea base? + propósitos** | [`docs/GUIA_GESTION_CAMBIOS.md`](docs/GUIA_GESTION_CAMBIOS.md) §2.1–2.2 |
| **2.2 Tipos de líneas base (funcional, asignada, desarrollo, producto)** | [`docs/GUIA_GESTION_CAMBIOS.md`](docs/GUIA_GESTION_CAMBIOS.md) §2.3 |
| **2.2 Versionado Semántico (SemVer)** | [`docs/GUIA_GESTION_CAMBIOS.md`](docs/GUIA_GESTION_CAMBIOS.md) §2.4 |
| **2.2 Implementación práctica con Git Tags** | Tag `v1.0.0-baseline` + [`docs/GUIA_GIT.md`](docs/GUIA_GIT.md) §5 |
| **2.3 Git: control de versiones, ramas, conflictos** | [`docs/GUIA_GIT.md`](docs/GUIA_GIT.md) + [`docs/GUIA_GESTION_CAMBIOS.md`](docs/GUIA_GESTION_CAMBIOS.md) §3.4 |
| **2.3 Jenkins: pipelines CI/CD** | [`Jenkinsfile`](Jenkinsfile) + [`docs/GUIA_PIPELINE.md`](docs/GUIA_PIPELINE.md) |
| **2.3 Ecosistema de herramientas (Git, ALM, CI/CD, docs, artefactos)** | [`docs/GUIA_GESTION_CAMBIOS.md`](docs/GUIA_GESTION_CAMBIOS.md) §3.1 |

---

## Pipeline CI (Jenkins) — Unidad 2.3

Pipeline declarativo en [`Jenkinsfile`](Jenkinsfile) con los 7 stages exigidos
por la unidad:

```
Verificar Entorno → Instalar Dependencias → Análisis de Código →
Ejecutar Pruebas → Generar Reporte → Crear Baseline → Despliegue
```

### Probar la pipeline localmente (sin Jenkins)

```bash
# 1. Instalar dependencias de pruebas
pip install -r tests/requirements-dev.txt

# 2. Análisis de código
python -m flake8 Backend

# 3. Pruebas + reporte HTML
python -m pytest tests --junitxml=junit.xml \
                       --html=pytest-report.html --self-contained-html
```

Resultado esperado: **12/12 tests verdes**, `flake8` sin errores.

### Configurar en Jenkins

Ver [`docs/GUIA_PIPELINE.md`](docs/GUIA_PIPELINE.md) — incluye:

1. Instalación de Jenkins LTS en Windows (puerto 8085).
2. Plugins requeridos (Pipeline, Git, HTML Publisher, JUnit, Timestamper).
3. Credenciales para repos privados (Personal Access Token de GitHub).
4. Creación del job tipo *Pipeline script from SCM*.
5. Primer build y lectura de artefactos.

Para subir el proyecto a GitHub por primera vez ver
[`docs/GUIA_GIT.md`](docs/GUIA_GIT.md).

---

## Línea base

| Atributo | Valor |
|---|---|
| Versión | `1.0.0-baseline` |
| Fecha | 2026-05-17 |
| Rama estable | `main` |
| Validado por | Grupo de desarrollo |
| Responsable | Coordinador del equipo |
| Pipeline | Jenkins declarativo (7 stages) |
| Pruebas | 12/12 en pytest |
| Lint | flake8 sin warnings |

---

## Equipo

| Integrante | Rol |
|---|---|
| Integrante 1 | Coordinador |
| Integrante 2 | Documentador |
| Integrante 3 | Encargado de Git |

---

## Licencia

MIT — ver [`LICENSE.txt`](LICENSE.txt).
