# Guía paso a paso — Pipeline Jenkins para SIGR

Esta guía instala Jenkins en Windows, conecta el repositorio Git y ejecuta el
pipeline declarativo definido en [`Jenkinsfile`](../Jenkinsfile) con los 7
stages exigidos por la Unidad 2.3 *(Verificar Entorno → Instalar Dependencias →
Análisis de Código → Ejecutar Pruebas → Generar Reporte → Crear Baseline →
Despliegue)*.

> Requisito previo: el proyecto ya está en GitHub. Ver [`GUIA_GIT.md`](GUIA_GIT.md).

---

## 1. Pre-requisitos

| Software | Versión mínima | Verificación |
|---|---|---|
| Java JDK | 17 | `java -version` |
| Python  | 3.11 | `python --version` |
| Git     | 2.40 | `git --version` |
| Jenkins LTS | 2.452 | <https://www.jenkins.io/download/> |

### Instalar Java 17 (si falta)

1. Descargar **Temurin OpenJDK 17** desde <https://adoptium.net/>.
2. Instalar con opciones por defecto, marcar *Set JAVA_HOME variable*.
3. Reabrir la terminal y verificar `java -version`.

---

## 2. Instalar Jenkins en Windows

1. Descargar **Jenkins LTS for Windows** (`jenkins.msi`) desde
   <https://www.jenkins.io/download/>.
2. Ejecutar el instalador. Cuando pregunte el puerto, **escribir 8085** (para
   no chocar con http.server del frontend en 9040).
3. Dejar el resto en por defecto. Al terminar, Jenkins arranca como servicio
   de Windows.
4. Abrir <http://localhost:8085> en el navegador.
5. La primera vez pide el **password inicial**. Está en:

   ```
   C:\ProgramData\Jenkins\.jenkins\secrets\initialAdminPassword
   ```

   Copiarlo y pegarlo.
6. Elegir **Install suggested plugins** (incluye Git, Pipeline, JUnit, etc.).
7. Crear el primer usuario admin (anotar usuario y clave).
8. Confirmar URL `http://localhost:8085/` y guardar.

---

## 3. Plugins adicionales que necesita el Jenkinsfile

Menú: **Manage Jenkins → Plugins → Available plugins** e instalar:

- **Pipeline Utility Steps** — usado por `archiveArtifacts` con patrones.
- **HTML Publisher** — para publicar el `pytest-report.html`.
- **Warnings Next Generation** — *(opcional)* parsea el reporte de `flake8`.
- **Timestamper** — agrega timestamp a cada línea de log (lo usa `options { timestamps() }`).

Reiniciar Jenkins si lo pide (botón al final de la lista).

---

## 4. Configurar las herramientas globales

Menú: **Manage Jenkins → Tools**.

- **Git installations**: ya viene `Default` apuntando al `git` del PATH. Dejar.
- **Python**: no se configura aquí; el Jenkinsfile invoca `python` del PATH.

> Si `python` no está en el PATH del servicio de Windows, abrir *Servicios →
> Jenkins → Propiedades → Variables del sistema* y agregar al PATH la carpeta
> de Python (`C:\Users\<tu_usuario>\AppData\Local\Programs\Python\Python311\`).

---

## 5. Configurar credenciales de Git (para repos privados)

Si tu repo es **público** puedes saltar este paso. Si es privado:

1. Menú: **Manage Jenkins → Credentials → System → Global credentials → Add**.
2. *Kind*: **Username with password**.
3. *Username*: tu usuario de GitHub.
4. *Password*: el **Personal Access Token** generado en `GUIA_GIT.md` paso 4.
5. *ID*: `github-token` (Jenkins lo referenciará por este ID).
6. *Description*: "GitHub PAT para SIGR".
7. Guardar.

---

## 6. Crear el job de pipeline

1. Página principal de Jenkins → **New Item**.
2. *Item name*: `sigr-sabor-mesa`.
3. *Type*: **Pipeline**.
4. Botón **OK**.

En la pantalla de configuración del job:

### General

- *Description*: "Pipeline SIGR — taller AA2 Unidad 2".
- Marcar **GitHub project** y pegar la URL del repo
  (`https://github.com/<usuario>/sigr-sabor-mesa/`).

### Triggers

- Marcar **GitHub hook trigger for GITScm polling** (opcional, requiere
  webhook). Para empezar sin webhook usar **Poll SCM** con `H/5 * * * *` (cada
  5 minutos verifica si hay commits nuevos).

### Pipeline

- *Definition*: **Pipeline script from SCM**.
- *SCM*: **Git**.
- *Repository URL*: `https://github.com/<usuario>/sigr-sabor-mesa.git`.
- *Credentials*: elegir `github-token` (solo si el repo es privado).
- *Branches to build*: `*/main`.
- *Script Path*: `Jenkinsfile` *(la raíz del proyecto)*.
- Marcar **Lightweight checkout**.

Guardar.

---

## 7. Lanzar el primer build

1. En la página del job hacer click en **Build Now**.
2. Aparece un nuevo build en *Build History*. Click sobre el número
   (`#1`) → **Console Output** para ver el log en vivo.
3. Si todos los stages quedan verdes verás algo como:

```
[Pipeline] Start of Pipeline
[Pipeline] stage (Verificar Entorno) ............. OK
[Pipeline] stage (Instalar Dependencias) ......... OK
[Pipeline] stage (Análisis de Código) ............ OK
[Pipeline] stage (Ejecutar Pruebas) .............. OK
[Pipeline] stage (Generar Reporte) ............... OK
[Pipeline] stage (Crear Baseline) ................ OK
[Pipeline] stage (Despliegue) .................... OK
```

4. En la vista **Blue Ocean** (sidebar izquierdo) los stages se ven como una
   línea de tiempo gráfica — es la captura que te mostró el profesor.

---

## 8. Resultados que produce el pipeline

| Stage | Artefacto |
|---|---|
| Análisis de Código | `flake8-report.txt` archivado. |
| Ejecutar Pruebas | `junit.xml` publicado en *Tests* del build. |
| Generar Reporte | `pytest-report.html` archivado + visible en *Reporte de pruebas*. |
| Crear Baseline | Tag `v1.0.0-baseline` creado localmente en el workspace. |
| Despliegue | `sigr-<BUILD>.zip` con `Backend/`, `FrontEnd/`, `DataBase/` y docs. |

---

## 9. Errores frecuentes

| Mensaje | Solución |
|---|---|
| `pytest: command not found` | Falta instalar `tests/requirements-dev.txt`. El stage *Instalar Dependencias* debería hacerlo. Verifica permisos del `pip --user`. |
| `flake8: ... E402` | Asegúrate de tener `.flake8` con `per-file-ignores` (ya viene en el proyecto). |
| `git config user.email` falla en *Crear Baseline* | El usuario de Windows que corre el servicio Jenkins no tiene permisos. Ejecuta Jenkins como tu usuario (no como `LocalSystem`) o configura `git config --system` en el servidor. |
| El tag `v1.0.0-baseline` no aparece en GitHub | El Jenkinsfile lo crea **local**. Para publicarlo, agrega un paso `git push origin v1.0.0-baseline` con credenciales (envoltura `withCredentials`). Documentado en el comentario del Jenkinsfile. |
| `publishHTML` falla | Falta el plugin **HTML Publisher** (paso 3). |

---

## 10. Diagrama de stages (referencia)

```
┌──────────┐  ┌────────────┐  ┌──────────┐  ┌─────────┐  ┌─────────┐  ┌────────┐  ┌──────────┐
│  Start   │→ │ Verificar  │→ │ Instalar │→ │Análisis │→ │Ejecutar │→ │Generar │→ │  Crear   │
│          │  │  Entorno   │  │   Deps   │  │ Código  │  │ Pruebas │  │Reporte │  │ Baseline │
└──────────┘  └────────────┘  └──────────┘  └─────────┘  └─────────┘  └────────┘  └─────┬────┘
                                                                                        │
                                                                              ┌─────────▼────────┐
                                                                              │    Despliegue    │ → End
                                                                              └──────────────────┘
```

Idéntico al pipeline `git_biblioteca_ceto` que el profesor demostró en clase.
