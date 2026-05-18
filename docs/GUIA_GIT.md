# Guía paso a paso — Git + GitHub para SIGR

Esta guía cubre el primer envío del proyecto a GitHub y la creación del **tag de
línea base**. Si Jenkins va a hacer checkout del repositorio, **este paso es
obligatorio antes** de configurar el pipeline.

> Convención: los comandos se ejecutan desde la carpeta raíz `sigr-baseline/`.

---

## 1. Instalación previa

- **Git para Windows**: descargar e instalar desde <https://git-scm.com/download/win>.
  Aceptar las opciones por defecto. Marca *Git from the command line and also from
  3rd-party software*.
- Verificar:

```powershell
git --version
```

---

## 2. Configurar la identidad (una sola vez por máquina)

```powershell
git config --global user.name  "Tu Nombre Apellido"
git config --global user.email "tu.correo@ejemplo.com"
git config --global init.defaultBranch main
```

---

## 3. Crear el repositorio remoto en GitHub

1. Entrar a <https://github.com> e iniciar sesión.
2. Botón **New repository** (esquina superior derecha → ➕ → *New repository*).
3. **Repository name**: `sigr-sabor-mesa` (puede ser otro nombre).
4. **Description**: "SIGR — Sistema Integral de Gestión de Restaurante. Línea base v1.0.0".
5. **Public** o **Private** (público si quieres que el profesor lo abra sin invitación).
6. **NO marques** *Add a README* ni *Add .gitignore* ni *Choose a license* — esos
   archivos ya están en el proyecto y se subirán en el primer push.
7. Botón **Create repository**.
8. GitHub muestra la URL HTTPS del repo, anótala:

```
https://github.com/<usuario>/sigr-sabor-mesa.git
```

---

## 4. Inicializar el repositorio local y hacer el primer push

Desde la raíz del proyecto:

```powershell
git init
git add .
git status                       # revisa qué se va a comitear
git commit -m "feat: linea base inicial SIGR v1.0.0-baseline"
git branch -M main
git remote add origin https://github.com/<usuario>/sigr-sabor-mesa.git
git push -u origin main
```

> En el `git push` GitHub pedirá usuario y un **Personal Access Token** (no la
> contraseña). Si no tienes uno: <https://github.com/settings/tokens> → *Generate
> new token (classic)* → permiso `repo`. Cópialo y úsalo como contraseña.

Verificar en el navegador que los archivos aparecen en GitHub.

---

## 5. Crear el tag de la línea base

```powershell
git tag -a v1.0.0-baseline -m "Linea base SIGR v1.0.0 - estructura por modulos + backend + BD"
git push origin v1.0.0-baseline
```

En GitHub el tag aparece en **Releases** o en la pestaña **Tags** del repositorio.

---

## 6. Flujo de trabajo recomendado a partir de aquí

```powershell
# Trabajar en una rama por feature
git checkout -b feat/menu-mejoras

# ... hacer cambios ...
git add .
git commit -m "feat(menu): permite duplicar plato"
git push -u origin feat/menu-mejoras

# Abrir Pull Request en GitHub, revisar, fusionar a main
# Tras el merge, en local:
git checkout main
git pull
```

Cada vez que `main` reciba un merge, Jenkins puede correr automáticamente el
pipeline (ver `GUIA_PIPELINE.md`).

---

## 7. Errores frecuentes

| Mensaje | Causa / Solución |
|---|---|
| `remote: Support for password authentication was removed` | Usar Personal Access Token, no la contraseña. |
| `fatal: not a git repository` | Estás fuera de la carpeta del proyecto. `cd sigr-baseline`. |
| `error: failed to push some refs` | Hay commits remotos no integrados. `git pull --rebase origin main`. |
| `Updates were rejected because the tag already exists` | El tag ya existe en remoto. Usar otro nombre o borrar el tag remoto con `git push --delete origin v1.0.0-baseline`. |
| Faltan archivos al push (ej. `__pycache__`) | El `.gitignore` los excluye, es correcto. |
