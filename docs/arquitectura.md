# Arquitectura — SIGR "Sabor & Mesa"

## Visión general

Aplicación de página única (SPA) implementada en **HTML5 + CSS3 + JavaScript ES6**,
sin frameworks. La interfaz se compone de un *shell* (header, sidebar, contenedor
principal) y cada módulo se renderiza dinámicamente dentro del contenedor mediante
funciones puras `render<Modulo>(container)`.

## Decisiones técnicas

| Decisión | Justificación |
|---|---|
| HTML/CSS/JS vanilla | Compatible con el material entregado por el docente. No requiere instalación de Node, dependencias ni servidor. |
| `localStorage` como persistencia | Permite trabajar sin backend. Suficiente para una línea base. |
| Un archivo JS por módulo | Refuerza el principio de responsabilidad única y simplifica la trazabilidad. |
| Módulos como objetos con `render()` | Patrón uniforme: cada módulo expone `Modulo.render(container)`. Facilita el ruteo. |
| Capa `storage.js` centralizada | Aísla el acceso a `localStorage` para poder migrar a backend sin cambiar los módulos. |
| Catálogos y parámetros en `config.js` | Política QMSPM "nada quemado": estados, categorías, roles, IVA, datos de empresa y permisos viven como datos, no como código. En una versión con backend, `Config` se reescribe sin tocar los módulos. |
| Internacionalización en JSON externo | Los textos viven en `i18n/es.json` y `i18n/en.json`. Cambiar idioma o agregar uno nuevo no requiere tocar JS. |
| Sin `style="..."` inline | Cumple CSP estricta. Las medidas dinámicas usan CSS custom properties (`--pct`) inyectadas desde JS. |

## Diagrama lógico de módulos

```
        ┌──────────────────┐
        │     index.html   │
        │   (shell + login)│
        └────────┬─────────┘
                 │
        ┌────────▼─────────┐
        │      app.js      │  ← router interno + navegación
        └────────┬─────────┘
                 │
   ┌─────────────┼──────────────┐
   │             │              │
┌──▼──┐    ┌─────▼─────┐   ┌────▼────┐
│auth │    │ storage.js│   │  UI util│
└──┬──┘    └─────┬─────┘   └────┬────┘
   │             │              │
   │   ┌─────────┴──────────┐   │
   └───┤  menu  pedidos  …  ├───┘
       └─────────┬──────────┘
                 │
            localStorage
```

## Flujo de control

1. El usuario abre `index.html`. El *shell* se carga y `app.js` evalúa si hay sesión
   activa en `localStorage`.
2. Si **no** hay sesión → `Auth.renderLogin()` pinta el formulario de inicio de sesión.
3. Al validar credenciales, `Auth` guarda el usuario en `localStorage` y avisa a
   `App` para que pinte el *shell* autenticado.
4. La barra lateral muestra los módulos permitidos para el rol y, al hacer clic en
   uno, `App.navigate(modulo)` invoca `<Modulo>.render(container)`.
5. Cada módulo lee y escribe únicamente a través de `Storage.get(coleccion)` y
   `Storage.set(coleccion, datos)`.

## Roles y permisos

| Rol | Módulos accesibles |
|---|---|
| `admin` | Todos los módulos. |
| `mesero` | Pedidos, reservas, clientes. |
| `cocinero` | Pedidos (lectura) y menú (lectura). |

## Convenciones

- **Idioma:** español de Colombia en variables, comentarios y mensajes de UI.
- **Nombres:** `camelCase` para variables y funciones; `PascalCase` para módulos.
- **Estilos:** archivos `.css` separados. Cero `style="..."` inline en HTML.
- **Comentarios:** se documentan las funciones públicas (las que expone el módulo).
