/* ==========================================================================
   menu.js — Módulo de menú digital (consume /api/menu)
   ========================================================================== */

const Menu = (() => {

  async function render(contenedor) {
    const puedeEditar = (Auth.sesionActiva().rol === 'admin');
    const categorias = Config.catalogo('categorias_plato');
    const platos = await Api.get('/menu/');

    contenedor.innerHTML = `
      <div class="cabecera-modulo">
        <h2>${I18n.t('menu.titulo')}</h2>
        ${puedeEditar
          ? `<button class="boton boton-primario" id="btn-nuevo-plato">${UI.escapar(I18n.t('menu.nuevo_plato'))}</button>`
          : `<span class="badge badge-neutral">${UI.escapar(I18n.t('comun.solo_lectura'))}</span>`}
      </div>

      <div class="formulario filtro-corto">
        <label for="filtro-categoria">${I18n.t('menu.filtrar_categoria')}</label>
        <select id="filtro-categoria">
          <option value="">${I18n.t('menu.todas')}</option>
          ${categorias.map(c => `<option value="${c.codigo}">${UI.escapar(c.nombre)}</option>`).join('')}
        </select>
      </div>

      <div class="grid-tarjetas" id="lista-menu"></div>
    `;

    const pintar = () => {
      const filtro = document.getElementById('filtro-categoria').value;
      const datos = filtro ? platos.filter(p => p.categoria === filtro) : platos;
      pintarMenu(document.getElementById('lista-menu'), datos, puedeEditar, categorias);
    };
    document.getElementById('filtro-categoria').addEventListener('change', pintar);
    pintar();

    if (puedeEditar) {
      document.getElementById('btn-nuevo-plato').addEventListener('click', () => abrirFormulario());
    }
  }

  function pintarMenu(cont, platos, puedeEditar, categorias) {
    if (platos.length === 0) {
      cont.innerHTML = `<p class="tabla-vacia">${UI.escapar(I18n.t('comun.sin_datos'))}</p>`;
      return;
    }
    cont.innerHTML = platos.map(p => {
      const cat = categorias.find(c => c.codigo === p.categoria);
      return `
        <div class="menu-tarjeta">
          <span class="menu-categoria">${UI.escapar(cat ? cat.nombre : p.categoria)}</span>
          <div class="menu-tarjeta-titulo">
            <strong>${UI.escapar(p.nombre)}</strong>
            ${p.disponible
              ? `<span class="badge badge-exito">${UI.escapar(I18n.t('menu.disponible'))}</span>`
              : `<span class="badge badge-neutral">${UI.escapar(I18n.t('menu.agotado'))}</span>`}
          </div>
          <div class="menu-precio">${UI.moneda(p.precio)}</div>
          ${puedeEditar ? `
            <div class="menu-acciones">
              <button class="boton boton-secundario boton-pequeno" data-editar="${p.id}">${UI.escapar(I18n.t('comun.editar'))}</button>
              <button class="boton boton-peligro boton-pequeno" data-eliminar="${p.id}">${UI.escapar(I18n.t('comun.eliminar'))}</button>
            </div>
          ` : ''}
        </div>`;
    }).join('');

    if (puedeEditar) {
      cont.querySelectorAll('[data-editar]').forEach(b =>
        b.addEventListener('click', () => abrirFormulario(parseInt(b.dataset.editar, 10), platos)));
      cont.querySelectorAll('[data-eliminar]').forEach(b =>
        b.addEventListener('click', () => eliminar(parseInt(b.dataset.eliminar, 10))));
    }
  }

  function abrirFormulario(id = null, platos = []) {
    const categorias = Config.catalogo('categorias_plato');
    const plato = id
      ? platos.find(p => p.id === id)
      : { nombre: '', categoria: categorias[0]?.codigo || '', precio: 0, disponible: true };

    UI.modal({
      titulo: id ? I18n.t('menu.form_titulo_editar') : I18n.t('menu.form_titulo_nuevo'),
      contenidoHTML: `
        <form class="formulario" id="form-plato">
          <label for="p-nombre">${I18n.t('menu.nombre')}</label>
          <input id="p-nombre" type="text" value="${UI.escapar(plato.nombre)}" required>

          <label for="p-categoria">${I18n.t('menu.categoria')}</label>
          <select id="p-categoria">
            ${categorias.map(c =>
              `<option value="${c.codigo}" ${c.codigo === plato.categoria ? 'selected' : ''}>${UI.escapar(c.nombre)}</option>`
            ).join('')}
          </select>

          <label for="p-precio">${I18n.t('menu.precio')}</label>
          <input id="p-precio" type="number" min="0" step="500" value="${plato.precio}" required>

          <label><input id="p-disponible" type="checkbox" ${plato.disponible ? 'checked' : ''}> ${I18n.t('menu.disponible')}</label>
        </form>
      `,
      botones: [
        { texto: I18n.t('comun.cancelar'), clase: 'boton-secundario', onClick: c => c() },
        { texto: I18n.t('comun.guardar'), clase: 'boton-primario', onClick: async (cerrar) => {
            const cuerpo = {
              nombre: document.getElementById('p-nombre').value.trim(),
              categoria: document.getElementById('p-categoria').value,
              precio: parseInt(document.getElementById('p-precio').value, 10) || 0,
              disponible: document.getElementById('p-disponible').checked
            };
            if (!cuerpo.nombre) { UI.toast(I18n.t('comun.obligatorio'), 'error'); return; }
            try {
              if (id) await Api.put('/menu/' + id, cuerpo);
              else    await Api.post('/menu/', cuerpo);
              cerrar();
              UI.toast(id ? I18n.t('menu.actualizado') : I18n.t('menu.creado'), 'exito');
              App.navegar('menu');
            } catch (e) { UI.toast(e.message, 'error'); }
          }
        }
      ]
    });
  }

  async function eliminar(id) {
    const ok = await UI.confirmar(I18n.t('menu.form_titulo_editar'), I18n.t('menu.confirmar_eliminar'));
    if (!ok) return;
    try {
      await Api.del('/menu/' + id);
      UI.toast(I18n.t('menu.eliminado'), 'aviso');
      App.navegar('menu');
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  return { render };
})();
