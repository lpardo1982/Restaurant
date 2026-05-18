/* ==========================================================================
   clientes.js — Módulo de clientes (consume /api/clientes)
   ========================================================================== */

const Clientes = (() => {

  async function render(contenedor) {
    const clientes = await Api.get('/clientes/');

    contenedor.innerHTML = `
      <div class="cabecera-modulo">
        <h2>${I18n.t('clientes.titulo')}</h2>
        <button class="boton boton-primario" id="btn-nuevo-cliente">${UI.escapar(I18n.t('clientes.nuevo'))}</button>
      </div>

      <div class="formulario filtro-corto">
        <label for="buscar-cliente">${I18n.t('clientes.buscar_por')}</label>
        <input id="buscar-cliente" type="text" placeholder="${UI.escapar(I18n.t('clientes.buscar_placeholder'))}">
      </div>

      <div class="tabla-contenedor">
        <table class="tabla">
          <thead>
            <tr>
              <th>${I18n.t('pedidos.numero')}</th>
              <th>${I18n.t('menu.nombre')}</th>
              <th>${I18n.t('clientes.telefono')}</th>
              <th>${I18n.t('clientes.correo')}</th>
              <th>${I18n.t('clientes.registro')}</th>
              <th>${I18n.t('comun.acciones')}</th>
            </tr>
          </thead>
          <tbody id="lista-clientes"></tbody>
        </table>
      </div>
    `;

    const pintar = () => {
      const q = document.getElementById('buscar-cliente').value.toLowerCase().trim();
      const datos = clientes.filter(c =>
        !q || c.nombre.toLowerCase().includes(q) || (c.telefono || '').includes(q));
      pintarTabla(document.getElementById('lista-clientes'), datos);
    };
    document.getElementById('buscar-cliente').addEventListener('input', pintar);
    pintar();

    document.getElementById('btn-nuevo-cliente').addEventListener('click', () => abrirFormulario(null, clientes));
  }

  function pintarTabla(tbody, clientes) {
    if (clientes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="tabla-vacia">${UI.escapar(I18n.t('comun.sin_datos'))}</td></tr>`;
      return;
    }
    tbody.innerHTML = clientes.map(c => `
      <tr>
        <td>${c.id}</td>
        <td>${UI.escapar(c.nombre)}</td>
        <td>${UI.escapar(c.telefono)}</td>
        <td>${UI.escapar(c.correo || '-')}</td>
        <td>${c.fecha_registro}</td>
        <td class="acciones">
          <button class="boton boton-secundario boton-pequeno" data-historial="${c.id}">${UI.escapar(I18n.t('clientes.historial'))}</button>
          <button class="boton boton-secundario boton-pequeno" data-editar="${c.id}">${UI.escapar(I18n.t('comun.editar'))}</button>
          <button class="boton boton-peligro boton-pequeno" data-eliminar="${c.id}">${UI.escapar(I18n.t('comun.eliminar'))}</button>
        </td>
      </tr>`).join('');

    tbody.querySelectorAll('[data-historial]').forEach(b =>
      b.addEventListener('click', () => verHistorial(parseInt(b.dataset.historial, 10), clientes)));
    tbody.querySelectorAll('[data-editar]').forEach(b =>
      b.addEventListener('click', () => abrirFormulario(parseInt(b.dataset.editar, 10), clientes)));
    tbody.querySelectorAll('[data-eliminar]').forEach(b =>
      b.addEventListener('click', () => eliminar(parseInt(b.dataset.eliminar, 10))));
  }

  function abrirFormulario(id, clientes) {
    const cliente = id
      ? clientes.find(c => c.id === id)
      : { nombre: '', telefono: '', correo: '' };

    UI.modal({
      titulo: id ? I18n.t('clientes.form_titulo_editar') : I18n.t('clientes.form_titulo_nuevo'),
      contenidoHTML: `
        <form class="formulario" id="form-cliente">
          <label for="c-nombre">${I18n.t('clientes.nombre_completo')}</label>
          <input id="c-nombre" type="text" value="${UI.escapar(cliente.nombre)}" required>

          <label for="c-telefono">${I18n.t('clientes.telefono')}</label>
          <input id="c-telefono" type="tel" value="${UI.escapar(cliente.telefono)}" required>

          <label for="c-correo">${I18n.t('clientes.correo_opcional')}</label>
          <input id="c-correo" type="email" value="${UI.escapar(cliente.correo || '')}">
        </form>`,
      botones: [
        { texto: I18n.t('comun.cancelar'), clase: 'boton-secundario', onClick: c => c() },
        { texto: I18n.t('comun.guardar'), clase: 'boton-primario', onClick: async (cerrar) => {
            const cuerpo = {
              nombre: document.getElementById('c-nombre').value.trim(),
              telefono: document.getElementById('c-telefono').value.trim(),
              correo: document.getElementById('c-correo').value.trim() || null
            };
            if (!cuerpo.nombre || !cuerpo.telefono) {
              UI.toast(I18n.t('clientes.obligatorios'), 'error'); return;
            }
            try {
              if (id) await Api.put('/clientes/' + id, cuerpo);
              else    await Api.post('/clientes/', cuerpo);
              cerrar();
              UI.toast(id ? I18n.t('clientes.actualizado') : I18n.t('clientes.creado'), 'exito');
              App.navegar('clientes');
            } catch (e) { UI.toast(e.message, 'error'); }
          }
        }
      ]
    });
  }

  async function verHistorial(id, clientes) {
    const cliente = clientes.find(c => c.id === id); if (!cliente) return;
    let peds = [];
    try { peds = await Api.get('/clientes/' + id + '/historial'); }
    catch (e) { UI.toast(e.message, 'error'); return; }

    const html = peds.length === 0
      ? `<p class="tabla-vacia">${UI.escapar(I18n.t('clientes.sin_pedidos'))}</p>`
      : `<table class="tabla">
          <thead><tr>
            <th>${I18n.t('pedidos.numero')}</th>
            <th>${I18n.t('comun.fecha')}</th>
            <th>${I18n.t('comun.total')}</th>
            <th>${I18n.t('comun.estado')}</th>
          </tr></thead>
          <tbody>
            ${peds.map(p => `
              <tr>
                <td>${p.id}</td>
                <td>${p.fecha}</td>
                <td>${UI.moneda(p.total)}</td>
                <td><span class="badge badge-neutral">${UI.escapar(p.estado)}</span></td>
              </tr>`).join('')}
          </tbody>
        </table>`;

    UI.modal({
      titulo: I18n.t('clientes.historial_de', { nombre: cliente.nombre }),
      contenidoHTML: html,
      botones: [{ texto: I18n.t('comun.cerrar'), clase: 'boton-secundario', onClick: c => c() }]
    });
  }

  async function eliminar(id) {
    const ok = await UI.confirmar(I18n.t('comun.eliminar'), I18n.t('clientes.confirmar_eliminar'));
    if (!ok) return;
    try {
      await Api.del('/clientes/' + id);
      UI.toast(I18n.t('clientes.eliminado'), 'aviso');
      App.navegar('clientes');
    } catch (e) {
      UI.toast(e.status === 409 ? I18n.t('clientes.tiene_pedidos') : e.message, 'error');
    }
  }

  return { render };
})();
