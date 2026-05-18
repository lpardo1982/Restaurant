/* ==========================================================================
   storage.js — Almacenamiento local mínimo (cliente)
   Tras la migración a backend, localStorage solo guarda preferencias del
   usuario (token JWT, idioma). Los datos de negocio viven en SQLite.
   ========================================================================== */

const Storage = (() => {
  const PREFIJO = 'sigr_';

  function get(clave, porDefecto = null) {
    const crudo = localStorage.getItem(PREFIJO + clave);
    if (crudo === null) return porDefecto;
    try { return JSON.parse(crudo); } catch (_) { return crudo; }
  }

  function set(clave, valor) {
    if (typeof valor === 'string') localStorage.setItem(PREFIJO + clave, valor);
    else localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
  }

  function remove(clave) { localStorage.removeItem(PREFIJO + clave); }

  return { get, set, remove };
})();
