/* ==========================================================================
   auth.js — Autenticación contra el backend
   Login por email, JWT en localStorage, validación de permisos por rol.
   ========================================================================== */

const Auth = (() => {

  let usuario = null;

  function sesionActiva() { return usuario; }

  /** Intenta restaurar la sesión usando el token guardado. */
  async function restaurar() {
    if (!Api.token()) return null;
    try {
      usuario = await Api.get('/auth/me');
      return usuario;
    } catch (_) {
      Api.clearToken();
      usuario = null;
      return null;
    }
  }

  /** Login con email + clave. Devuelve el usuario o lanza error. */
  async function iniciarSesion(email, clave) {
    const r = await Api.post('/auth/login', { email, clave });
    Api.setToken(r.access_token);
    usuario = r.usuario;
    return usuario;
  }

  /** Cierra sesión: limpia token y cache local. */
  function cerrarSesion() {
    Api.clearToken();
    usuario = null;
  }

  /** Verifica si el rol del usuario actual tiene acceso a un módulo. */
  function puedeAcceder(modulo) {
    if (!usuario) return false;
    return Config.modulos().some(m => m.codigo === modulo);
  }

  /** Engancha el formulario de login del HTML. */
  function enlazarFormularioLogin(callback) {
    const form = document.getElementById('form-login');
    const error = document.getElementById('login-error');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      error.hidden = true;
      const email = document.getElementById('login-usuario').value.trim().toLowerCase();
      const clave = document.getElementById('login-clave').value;
      if (!email || !clave) {
        return mostrarError(I18n.t('login.campos_obligatorios'));
      }
      try {
        const u = await iniciarSesion(email, clave);
        await Config.cargar();
        form.reset();
        callback(u);
      } catch (e) {
        mostrarError(e.status === 401
          ? I18n.t('login.credenciales_invalidas')
          : (e.message || 'Error al iniciar sesión.'));
      }
    });

    function mostrarError(msg) {
      error.textContent = msg;
      error.hidden = false;
    }
  }

  return { sesionActiva, restaurar, iniciarSesion, cerrarSesion, puedeAcceder, enlazarFormularioLogin };
})();
