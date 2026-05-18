/* ==========================================================================
   config.js — Caché de catálogos, parámetros y módulos
   Los carga desde el backend al iniciar sesión y los expone síncronamente
   al resto de módulos. "Nada quemado": todos los textos y reglas vienen de BD.
   ========================================================================== */

const Config = (() => {

  let cache = {
    catalogos: {},
    parametros: {},
    modulos: []
  };

  /** Carga catálogos, parámetros y módulos desde el backend (paralelo). */
  async function cargar() {
    const [params, modulos, cat, est, estR, roles] = await Promise.all([
      Api.get('/parametros'),
      Api.get('/modulos'),
      Api.get('/catalogos/categorias_plato'),
      Api.get('/catalogos/estados_pedido'),
      Api.get('/catalogos/estados_reserva'),
      Api.get('/catalogos/roles')
    ]);
    cache.parametros = params;
    cache.modulos = modulos;
    cache.catalogos = {
      categorias_plato: cat,
      estados_pedido:   est,
      estados_reserva:  estR,
      roles:            roles
    };
  }

  function catalogo(nombre)    { return cache.catalogos[nombre] || []; }
  function buscar(nombre, c)   { return catalogo(nombre).find(x => x.codigo === c) || null; }
  function modulos()           { return cache.modulos; }
  function parametro(clave)    { return cache.parametros[clave]; }
  function parametroNum(clave) { return parseFloat(cache.parametros[clave] || '0'); }

  return { cargar, catalogo, buscar, modulos, parametro, parametroNum };
})();
