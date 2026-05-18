/* ==========================================================================
   api.js — Cliente REST para el backend SIGR
   Aisla fetch() y agrega automáticamente el JWT a las peticiones autenticadas.
   ========================================================================== */

const Api = (() => {

  // URL base del backend. Configurable por window.SIGR_API_BASE_URL si se monta
  // detrás de un proxy.
  const BASE = window.SIGR_API_BASE_URL || 'http://127.0.0.1:8001/api';

  function token()       { return localStorage.getItem('sigr_token'); }
  function setToken(t)   { localStorage.setItem('sigr_token', t); }
  function clearToken()  { localStorage.removeItem('sigr_token'); }

  async function request(metodo, ruta, cuerpo = null) {
    const opciones = {
      method: metodo,
      headers: { 'Content-Type': 'application/json' }
    };
    const tk = token();
    if (tk) opciones.headers['Authorization'] = 'Bearer ' + tk;
    if (cuerpo !== null) opciones.body = JSON.stringify(cuerpo);

    let respuesta;
    try {
      respuesta = await fetch(BASE + ruta, opciones);
    } catch (e) {
      throw new ApiError(0, 'Sin conexión con el servidor.');
    }

    if (respuesta.status === 401) {
      clearToken();
      throw new ApiError(401, 'Sesión expirada. Vuelve a iniciar sesión.');
    }
    const tipo = respuesta.headers.get('content-type') || '';
    const datos = tipo.includes('application/json') ? await respuesta.json() : null;

    if (!respuesta.ok) {
      const detalle = (datos && (datos.detail || datos.message)) || respuesta.statusText;
      throw new ApiError(respuesta.status, detalle);
    }
    return datos;
  }

  class ApiError extends Error {
    constructor(status, mensaje) { super(mensaje); this.status = status; }
  }

  return {
    BASE,
    token, setToken, clearToken,
    get:  (ruta)         => request('GET',    ruta),
    post: (ruta, cuerpo) => request('POST',   ruta, cuerpo),
    put:  (ruta, cuerpo) => request('PUT',    ruta, cuerpo),
    del:  (ruta)         => request('DELETE', ruta),
    ApiError
  };
})();
