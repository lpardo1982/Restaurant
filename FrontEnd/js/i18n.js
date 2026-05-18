/* ==========================================================================
   i18n.js — Internacionalización (ES + EN)
   Política QMSPM: siempre ES + EN. Los textos viven en /i18n/{es,en}.json.
   Se cargan vía fetch al iniciar y se exponen a través de I18n.t('clave').
   ========================================================================== */

const I18n = (() => {

  let diccionarios = {};   // { es: {...}, en: {...} }
  let idiomaActual = 'es';
  const escuchadores = [];

  /** Carga ambos diccionarios desde /i18n/*.json. Devuelve una promesa. */
  async function cargar() {
    const disponibles = Config.parametro('interfaz.idiomas_disponibles') || ['es', 'en'];
    const cargas = disponibles.map(async (cod) => {
      const r = await fetch(`i18n/${cod}.json`);
      diccionarios[cod] = await r.json();
    });
    await Promise.all(cargas);
    idiomaActual = leerIdiomaGuardado()
                || Config.parametro('interfaz.idioma_defecto')
                || 'es';
  }

  /** Traduce una clave punteada. Permite interpolar {var}. */
  function t(clave, vars = {}) {
    const partes = clave.split('.');
    let valor = diccionarios[idiomaActual];
    for (const p of partes) {
      if (valor == null) break;
      valor = valor[p];
    }
    if (typeof valor !== 'string') return clave;          // fallback: clave cruda
    return valor.replace(/\{(\w+)\}/g, (_, k) =>
      (vars[k] !== undefined ? vars[k] : `{${k}}`));
  }

  /** Cambia el idioma activo y notifica a los suscriptores. */
  function cambiarIdioma(nuevo) {
    if (!diccionarios[nuevo]) return;
    idiomaActual = nuevo;
    localStorage.setItem('sigr_idioma', nuevo);
    escuchadores.forEach(fn => { try { fn(nuevo); } catch (_) {} });
  }

  /** Idioma activo. */
  function idioma() { return idiomaActual; }

  /** Lista de idiomas disponibles. */
  function disponibles() { return Object.keys(diccionarios); }

  /** Suscribe a cambios de idioma. */
  function alCambiar(fn) { escuchadores.push(fn); }

  function leerIdiomaGuardado() {
    return localStorage.getItem('sigr_idioma');
  }

  return { cargar, t, cambiarIdioma, idioma, disponibles, alCambiar };
})();
