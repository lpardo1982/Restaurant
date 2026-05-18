/* ==========================================================================
   reservas.js — Módulo de reservas (consume /api/reservas)
   ========================================================================== */

const Reservas = (() => {

  async function render(contenedor) {
    const [reservas, clientes] = await Promise.all([Api.get('/reservas/'), Api.get('/clientes/')]);

    contenedor.innerHTML = `
      <div class="cabecera-modulo">
        <h2>${I18n.t('reservas.titulo')}</h2>
        <button class="boton boton-primario" id="btn-nueva-reserva">${UI.escapar(I18n.t('reservas.nueva'))}</button>
      </div>

      <div class="formulario filtro-corto">
        <label for="filtro-fecha">${I18n.t('reservas.filtrar_fecha')}</label>
        <input type="date" id="filtro-fecha">
      </div>

      <div class="tabla-contenedor">
        <table class="tabla">
          <thead>
            <tr>
              <th>${I18n.t('pedidos.numero')}</th>
              <th>${I18n.t('pedidos.cliente')}</th>
              <th>${I18n.t('comun.fecha')}</th>
              <th>${I18n.t('reservas.hora')}</th>
              <th>${I18n.t('reservas.personas')}</th>
              <th>${I18n.t('reservas.mesa')}</th>
              <th>${I18n.t('comun.estado')}</th>
              <th>${I18n.t('comun.acciones')}</th>
            </tr>
          </thead>
          <tbody id="lista-reservas"></tbody>
        </table>
      </div>
    `;

    const pintar = () => {
      const fecha = document.getElementById('filtro-fecha').value;
      const datos = fecha ? reservas.filter(r => r.fecha === fecha) : reservas;
      pintarTabla(document.getElementById('lista-reservas'), datos, clientes);
    };
    document.getElementById('filtro-fecha').addEventListener('change', pintar);
    pintar();

    document.getElementById('btn-nueva-reserva').addEventListener('click', () => abrirFormulario(clientes));
  }

  function pintarTabla(tbody, reservas, clientes) {
    if (reservas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="tabla-vacia">${UI.escapar(I18n.t('comun.sin_datos'))}</td></tr>`;
      return;
    }
    tbody.innerHTML = reservas.map(r => {
      const cliente = clientes.find(c => c.id === r.cliente_id);
      const est = Config.buscar('estados_reserva', r.estado) || { nombre: r.estado, badge: 'badge-neutral' };
      return `
        <tr>
          <td>${r.id}</td>
          <td>${UI.escapar(cliente ? cliente.nombre : 'N/A')}</td>
          <td>${r.fecha}</td>
          <td>${r.hora}</td>
          <td>${r.personas}</td>
          <td>${r.mesa}</td>
          <td><span class="badge ${est.badge}">${UI.escapar(est.nombre)}</span></td>
          <td class="acciones">
            <button class="boton boton-secundario boton-pequeno" data-confirmar="${r.id}">${UI.escapar(I18n.t('reservas.confirmar'))}</button>
            <button class="boton boton-peligro boton-pequeno" data-cancelar="${r.id}">${UI.escapar(I18n.t('reservas.cancelar_reserva'))}</button>
          </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-confirmar]').forEach(b =>
      b.addEventListener('click', () => cambiarEstado(parseInt(b.dataset.confirmar, 10), 'confirmada')));
    tbody.querySelectorAll('[data-cancelar]').forEach(b =>
      b.addEventListener('click', () => cambiarEstado(parseInt(b.dataset.cancelar, 10), 'cancelada')));
  }

  function abrirFormulario(clientes) {
    if (clientes.length === 0) { UI.toast(I18n.t('pedidos.sin_clientes'), 'error'); return; }

    UI.modal({
      titulo: I18n.t('reservas.form_titulo_nueva'),
      contenidoHTML: `
        <form class="formulario" id="form-reserva">
          <label for="r-cliente">${I18n.t('pedidos.cliente')}</label>
          <select id="r-cliente">
            ${clientes.map(c => `<option value="${c.id}">${UI.escapar(c.nombre)}</option>`).join('')}
          </select>

          <div class="form-grid">
            <div>
              <label for="r-fecha">${I18n.t('comun.fecha')}</label>
              <input id="r-fecha" type="date" value="${new Date().toISOString().slice(0, 10)}">
            </div>
            <div>
              <label for="r-hora">${I18n.t('reservas.hora')}</label>
              <input id="r-hora" type="time" value="19:00">
            </div>
            <div>
              <label for="r-personas">${I18n.t('reservas.personas')}</label>
              <input id="r-personas" type="number" min="1" max="20" value="2">
            </div>
            <div>
              <label for="r-mesa">${I18n.t('reservas.mesa')}</label>
              <input id="r-mesa" type="number" min="1" max="50" value="1">
            </div>
          </div>
        </form>
      `,
      botones: [
        { texto: I18n.t('comun.cancelar'), clase: 'boton-secundario', onClick: c => c() },
        { texto: I18n.t('comun.guardar'), clase: 'boton-primario', onClick: async (cerrar) => {
            const cuerpo = {
              cliente_id: parseInt(document.getElementById('r-cliente').value, 10),
              fecha: document.getElementById('r-fecha').value,
              hora: document.getElementById('r-hora').value,
              personas: parseInt(document.getElementById('r-personas').value, 10) || 1,
              mesa: parseInt(document.getElementById('r-mesa').value, 10) || 1
            };
            if (!cuerpo.fecha || !cuerpo.hora) {
              UI.toast(I18n.t('reservas.fecha_hora_obligatorias'), 'error'); return;
            }
            try {
              await Api.post('/reservas/', cuerpo);
              cerrar();
              UI.toast(I18n.t('reservas.creada'), 'exito');
              App.navegar('reservas');
            } catch (e) { UI.toast(e.message, 'error'); }
          }
        }
      ]
    });
  }

  async function cambiarEstado(id, nuevoEstado) {
    try {
      await Api.put('/reservas/' + id + '/estado/' + nuevoEstado);
      const est = Config.buscar('estados_reserva', nuevoEstado);
      UI.toast(I18n.t('reservas.actualizada', { estado: est ? est.nombre.toLowerCase() : nuevoEstado }), 'exito');
      App.navegar('reservas');
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  return { render };
})();
