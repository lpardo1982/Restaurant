/* ==========================================================================
   app.js — Bootstrap principal y router interno
   Orquesta el ciclo: i18n -> restaurar sesión -> cargar Config -> mostrar app.
   ========================================================================== */

const App = (() => {

  const RENDERERS = {
    reportes:    () => Reportes.render(contenedor()),
    menu:        () => Menu.render(contenedor()),
    pedidos:     () => Pedidos.render(contenedor()),
    reservas:    () => Reservas.render(contenedor()),
    clientes:    () => Clientes.render(contenedor()),
    facturacion: () => Facturacion.render(contenedor())
  };

  function contenedor() { return document.getElementById('contenedor-modulo'); }

  async function iniciar() {
    await I18n.cargar();
    aplicarTextosUI();
    I18n.alCambiar(aplicarTextosUI);

    Auth.enlazarFormularioLogin(mostrarApp);
    enlazarHeader();
    pintarSelectorIdioma();

    // Si hay token guardado, intentamos restaurar la sesión.
    const u = await Auth.restaurar();
    if (u) {
      try {
        await Config.cargar();
        mostrarApp(u);
      } catch (_) {
        Auth.cerrarSesion();
        mostrarLogin();
      }
    } else {
      mostrarLogin();
    }
  }

  function aplicarTextosUI() {
    document.documentElement.lang = I18n.idioma();
    document.title = I18n.t('app.titulo') + ' — SIGR';

    setText('login-titulo',         I18n.t('app.titulo'));
    setText('login-subtitulo',      I18n.t('app.subtitulo'));
    setText('lbl-login-usuario',    I18n.t('login.email'));
    setText('lbl-login-clave',      I18n.t('login.clave'));
    setText('btn-login',            I18n.t('login.ingresar'));

    setText('app-titulo',           I18n.t('app.titulo'));
    setText('btn-salir',            I18n.t('app.cerrar_sesion'));
    const tog = document.getElementById('btn-menu-toggle');
    if (tog) tog.setAttribute('aria-label', I18n.t('app.menu'));

    const activo = document.querySelector('#lista-modulos button.activo');
    pintarSidebar();
    if (activo) navegar(activo.dataset.modulo);
  }

  function setText(id, texto) {
    const el = document.getElementById(id);
    if (el) el.textContent = texto;
  }

  function mostrarLogin() {
    document.getElementById('pantalla-login').hidden = false;
    document.getElementById('app-shell').hidden = true;
  }

  function mostrarApp(sesion) {
    document.getElementById('pantalla-login').hidden = true;
    document.getElementById('app-shell').hidden = false;

    const rolI18n = I18n.t('login.rol_' + sesion.rol) || sesion.rol;
    document.getElementById('info-usuario').textContent = `${sesion.nombre} · ${rolI18n}`;

    pintarSidebar();
    const primer = Config.modulos()[0];
    if (primer) navegar(primer.codigo);
  }

  function pintarSidebar() {
    const ul = document.getElementById('lista-modulos');
    if (!ul) return;
    ul.innerHTML = '';
    Config.modulos().forEach(m => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.textContent = `${m.icono} ${I18n.t(m.clave_i18n)}`;
      btn.dataset.modulo = m.codigo;
      btn.addEventListener('click', () => navegar(m.codigo));
      li.appendChild(btn);
      ul.appendChild(li);
    });
  }

  function navegar(idModulo) {
    if (!Auth.puedeAcceder(idModulo)) {
      UI.toast(I18n.t('app.sin_permiso'), 'error');
      return;
    }
    const render = RENDERERS[idModulo];
    if (!render) return;

    document.querySelectorAll('#lista-modulos button').forEach(b => {
      b.classList.toggle('activo', b.dataset.modulo === idModulo);
    });
    Promise.resolve(render()).catch(e => {
      console.error(e);
      UI.toast(e.message || 'Error al cargar el módulo.', 'error');
    });
    document.getElementById('barra-lateral').classList.remove('visible');
    contenedor().focus();
  }

  function enlazarHeader() {
    document.getElementById('btn-salir').addEventListener('click', () => {
      Auth.cerrarSesion();
      mostrarLogin();
      UI.toast(I18n.t('app.sesion_cerrada'), 'aviso');
    });
    document.getElementById('btn-menu-toggle').addEventListener('click', () => {
      document.getElementById('barra-lateral').classList.toggle('visible');
    });
  }

  function pintarSelectorIdioma() {
    const cont = document.getElementById('selector-idioma');
    cont.innerHTML = '';
    I18n.disponibles().forEach(cod => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'boton-idioma' + (cod === I18n.idioma() ? ' activo' : '');
      btn.textContent = cod.toUpperCase();
      btn.addEventListener('click', () => {
        I18n.cambiarIdioma(cod);
        pintarSelectorIdioma();
      });
      cont.appendChild(btn);
    });
  }

  return { iniciar, navegar };
})();


/* ==========================================================================
   UI — toasts, modales, formatos. Compartido por todos los módulos.
   ========================================================================== */
const UI = (() => {

  function toast(mensaje, tipo = '') {
    const cont = document.getElementById('contenedor-toasts');
    const div = document.createElement('div');
    div.className = 'toast ' + tipo;
    div.textContent = mensaje;
    cont.appendChild(div);
    setTimeout(() => div.remove(), 3500);
  }

  function modal({ titulo, contenidoHTML, botones = [] }) {
    const cont = document.getElementById('contenedor-modal');
    cont.hidden = false;
    cont.innerHTML = '';

    const div = document.createElement('div');
    div.className = 'modal';
    div.innerHTML = `
      <div class="modal-cabecera">
        <h3>${escapar(titulo)}</h3>
        <button class="boton-icono" aria-label="${escapar(I18n.t('comun.cerrar'))}" data-cerrar>✕</button>
      </div>
      <div class="modal-cuerpo"></div>
      <div class="modal-pie"></div>
    `;
    div.querySelector('.modal-cuerpo').innerHTML = contenidoHTML;

    const pie = div.querySelector('.modal-pie');
    botones.forEach(b => {
      const btn = document.createElement('button');
      btn.className = 'boton ' + (b.clase || 'boton-secundario');
      btn.textContent = b.texto;
      btn.addEventListener('click', () => b.onClick(cerrar));
      pie.appendChild(btn);
    });

    cont.appendChild(div);
    div.querySelector('[data-cerrar]').addEventListener('click', cerrar);
    cont.addEventListener('click', (e) => { if (e.target === cont) cerrar(); });

    function cerrar() { cont.hidden = true; cont.innerHTML = ''; }
  }

  function confirmar(titulo, mensaje) {
    return new Promise(resolve => {
      modal({
        titulo,
        contenidoHTML: `<p>${escapar(mensaje)}</p>`,
        botones: [
          { texto: I18n.t('comun.cancelar'), clase: 'boton-secundario', onClick: (c) => { c(); resolve(false); } },
          { texto: I18n.t('comun.aceptar'),  clase: 'boton-peligro',    onClick: (c) => { c(); resolve(true);  } }
        ]
      });
    });
  }

  function escapar(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function moneda(valor) {
    const moneda = Config.parametro('facturacion.moneda') || 'COP';
    const locale = I18n.idioma() === 'en' ? 'en-US' : 'es-CO';
    return new Intl.NumberFormat(locale, {
      style: 'currency', currency: moneda, maximumFractionDigits: 0
    }).format(valor || 0);
  }

  return { toast, modal, confirmar, escapar, moneda };
})();


document.addEventListener('DOMContentLoaded', App.iniciar);
