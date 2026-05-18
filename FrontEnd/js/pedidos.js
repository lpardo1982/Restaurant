/* ==========================================================================
   pedidos.js — Módulo de pedidos (consume /api/pedidos)
   ========================================================================== */

const Pedidos = (() => {

  function estados() { return Config.catalogo('estados_pedido'); }

  async function render(contenedor) {
    const rol = Auth.sesionActiva().rol;
    const puedeCrear = (rol === 'admin' || rol === 'mesero');
    const [pedidos, clientes] = await Promise.all([Api.get('/pedidos/'), Api.get('/clientes/')]);

    contenedor.innerHTML = `
      <div class="cabecera-modulo">
        <h2>${I18n.t('pedidos.titulo')}</h2>
        ${puedeCrear
          ? `<button class="boton boton-primario" id="btn-nuevo-pedido">${UI.escapar(I18n.t('pedidos.nuevo'))}</button>`
          : ''}
      </div>

      <div class="formulario filtro-corto">
        <label for="filtro-estado">${I18n.t('pedidos.filtrar_estado')}</label>
        <select id="filtro-estado">
          <option value="">${I18n.t('comun.todos')}</option>
          ${estados().map(e => `<option value="${e.codigo}">${UI.escapar(e.nombre)}</option>`).join('')}
        </select>
      </div>

      <div class="tabla-contenedor">
        <table class="tabla">
          <thead>
            <tr>
              <th>${I18n.t('pedidos.numero')}</th>
              <th>${I18n.t('pedidos.mesa')}</th>
              <th>${I18n.t('pedidos.cliente')}</th>
              <th>${I18n.t('pedidos.items')}</th>
              <th>${I18n.t('comun.total')}</th>
              <th>${I18n.t('comun.estado')}</th>
              <th>${I18n.t('comun.fecha')}</th>
              <th>${I18n.t('comun.acciones')}</th>
            </tr>
          </thead>
          <tbody id="lista-pedidos"></tbody>
        </table>
      </div>
    `;

    const pintar = () => {
      const filtro = document.getElementById('filtro-estado').value;
      const datos = filtro ? pedidos.filter(p => p.estado === filtro) : pedidos;
      pintarTabla(document.getElementById('lista-pedidos'), datos, rol, clientes);
    };
    document.getElementById('filtro-estado').addEventListener('change', pintar);
    pintar();

    if (puedeCrear) {
      document.getElementById('btn-nuevo-pedido').addEventListener('click', () => abrirFormulario(clientes));
    }
  }

  function pintarTabla(tbody, pedidos, rol, clientes) {
    if (pedidos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="tabla-vacia">${UI.escapar(I18n.t('comun.sin_datos'))}</td></tr>`;
      return;
    }
    tbody.innerHTML = pedidos.map(p => {
      const cliente = clientes.find(c => c.id === p.cliente_id);
      const est = Config.buscar('estados_pedido', p.estado) || { nombre: p.estado, badge: 'badge-neutral' };
      return `
        <tr>
          <td>${p.id}</td>
          <td>${p.mesa}</td>
          <td>${UI.escapar(cliente ? cliente.nombre : I18n.t('pedidos.cliente_eliminado'))}</td>
          <td>${p.items.length}</td>
          <td>${UI.moneda(p.total)}</td>
          <td><span class="badge ${est.badge}">${UI.escapar(est.nombre)}</span></td>
          <td>${p.fecha}</td>
          <td class="acciones">
            <button class="boton boton-secundario boton-pequeno" data-ver="${p.id}">${UI.escapar(I18n.t('pedidos.ver_detalle'))}</button>
            ${rol !== 'cocinero' ? `
              <button class="boton boton-secundario boton-pequeno" data-estado="${p.id}">${UI.escapar(I18n.t('pedidos.cambiar_estado'))}</button>
              <button class="boton boton-peligro boton-pequeno" data-cancelar="${p.id}">${UI.escapar(I18n.t('pedidos.cancelar_pedido'))}</button>
            ` : ''}
          </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-ver]').forEach(b =>
      b.addEventListener('click', () => verPedido(parseInt(b.dataset.ver, 10), pedidos, clientes)));
    tbody.querySelectorAll('[data-estado]').forEach(b =>
      b.addEventListener('click', () => cambiarEstado(parseInt(b.dataset.estado, 10), pedidos)));
    tbody.querySelectorAll('[data-cancelar]').forEach(b =>
      b.addEventListener('click', () => cancelar(parseInt(b.dataset.cancelar, 10))));
  }

  function verPedido(id, pedidos, clientes) {
    const p = pedidos.find(x => x.id === id); if (!p) return;
    const cliente = clientes.find(c => c.id === p.cliente_id);
    const est = Config.buscar('estados_pedido', p.estado) || { nombre: p.estado, badge: 'badge-neutral' };

    const itemsHTML = p.items.map(i =>
      `<li>${i.cantidad} × ${UI.escapar(i.nombre)} <span>${UI.moneda(i.cantidad * i.precio)}</span></li>`
    ).join('');

    UI.modal({
      titulo: `${I18n.t('pedidos.numero')}${p.id} — ${I18n.t('pedidos.mesa')} ${p.mesa}`,
      contenidoHTML: `
        <p><b>${I18n.t('pedidos.cliente')}:</b> ${UI.escapar(cliente ? cliente.nombre : 'N/A')}</p>
        <p><b>${I18n.t('comun.estado')}:</b> <span class="badge ${est.badge}">${UI.escapar(est.nombre)}</span></p>
        <p><b>${I18n.t('comun.fecha')}:</b> ${p.fecha}</p>
        <ul class="pedido-items">${itemsHTML}</ul>
        <div class="pedido-total">${I18n.t('comun.total')}: ${UI.moneda(p.total)}</div>`,
      botones: [{ texto: I18n.t('comun.cerrar'), clase: 'boton-secundario', onClick: c => c() }]
    });
  }

  async function abrirFormulario(clientes) {
    const platos = (await Api.get('/menu/')).filter(p => p.disponible);
    if (platos.length === 0)   { UI.toast(I18n.t('pedidos.sin_platos'), 'error'); return; }
    if (clientes.length === 0) { UI.toast(I18n.t('pedidos.sin_clientes'), 'error'); return; }

    let items = [];

    UI.modal({
      titulo: I18n.t('pedidos.form_titulo_nuevo'),
      contenidoHTML: `
        <form class="formulario" id="form-pedido">
          <div class="form-grid">
            <div>
              <label for="pe-cliente">${I18n.t('pedidos.cliente')}</label>
              <select id="pe-cliente">
                ${clientes.map(c => `<option value="${c.id}">${UI.escapar(c.nombre)}</option>`).join('')}
              </select>
            </div>
            <div>
              <label for="pe-mesa">${I18n.t('pedidos.mesa')}</label>
              <input id="pe-mesa" type="number" min="1" max="50" value="1">
            </div>
          </div>

          <label>${I18n.t('pedidos.agregar_plato')}</label>
          <div class="selector-plato">
            <select id="pe-plato">
              ${platos.map(p => `<option value="${p.id}">${UI.escapar(p.nombre)} — ${UI.moneda(p.precio)}</option>`).join('')}
            </select>
            <input id="pe-cantidad" type="number" min="1" value="1">
            <button type="button" class="boton boton-secundario" id="btn-add-item">${UI.escapar(I18n.t('pedidos.agregar'))}</button>
          </div>

          <label>${I18n.t('pedidos.items_pedido')}</label>
          <ul class="pedido-items" id="pe-items"><li class="tabla-vacia">${UI.escapar(I18n.t('pedidos.sin_items'))}</li></ul>
          <div class="pedido-total" id="pe-total">${I18n.t('comun.total')}: ${UI.moneda(0)}</div>
        </form>
      `,
      botones: [
        { texto: I18n.t('comun.cancelar'), clase: 'boton-secundario', onClick: c => c() },
        { texto: I18n.t('comun.guardar'), clase: 'boton-primario', onClick: async (cerrar) => {
            if (items.length === 0) { UI.toast(I18n.t('pedidos.agregar_minimo_un_item'), 'error'); return; }
            const cuerpo = {
              cliente_id: parseInt(document.getElementById('pe-cliente').value, 10),
              mesa: parseInt(document.getElementById('pe-mesa').value, 10) || 1,
              items: items.map(i => ({ plato_id: i.platoId, cantidad: i.cantidad }))
            };
            try {
              const nuevo = await Api.post('/pedidos/', cuerpo);
              cerrar();
              UI.toast(I18n.t('pedidos.creado', { id: nuevo.id }), 'exito');
              App.navegar('pedidos');
            } catch (e) { UI.toast(e.message, 'error'); }
          }
        }
      ]
    });

    document.getElementById('btn-add-item').addEventListener('click', () => {
      const platoId = parseInt(document.getElementById('pe-plato').value, 10);
      const cant = parseInt(document.getElementById('pe-cantidad').value, 10) || 1;
      const plato = platos.find(p => p.id === platoId);
      if (!plato) return;
      const existente = items.find(i => i.platoId === platoId);
      if (existente) existente.cantidad += cant;
      else items.push({ platoId, nombre: plato.nombre, precio: plato.precio, cantidad: cant });
      refrescarItems();
    });

    function refrescarItems() {
      const ul = document.getElementById('pe-items');
      if (items.length === 0) { ul.innerHTML = `<li class="tabla-vacia">${UI.escapar(I18n.t('pedidos.sin_items'))}</li>`; }
      else {
        ul.innerHTML = items.map((i, idx) =>
          `<li>${i.cantidad} × ${UI.escapar(i.nombre)}
             <span>${UI.moneda(i.cantidad * i.precio)}
               <button type="button" class="boton-icono" data-rem="${idx}">✕</button>
             </span>
           </li>`).join('');
        ul.querySelectorAll('[data-rem]').forEach(b => b.addEventListener('click', () => {
          items.splice(parseInt(b.dataset.rem, 10), 1); refrescarItems();
        }));
      }
      const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
      document.getElementById('pe-total').textContent = I18n.t('comun.total') + ': ' + UI.moneda(total);
    }
  }

  function cambiarEstado(id, pedidos) {
    const p = pedidos.find(x => x.id === id); if (!p) return;
    UI.modal({
      titulo: `${I18n.t('pedidos.cambiar_estado')} — ${I18n.t('pedidos.numero')}${p.id}`,
      contenidoHTML: `
        <form class="formulario">
          <label for="ce-estado">${I18n.t('comun.estado')}</label>
          <select id="ce-estado">
            ${estados().map(e => `<option value="${e.codigo}" ${e.codigo === p.estado ? 'selected' : ''}>${UI.escapar(e.nombre)}</option>`).join('')}
          </select>
        </form>`,
      botones: [
        { texto: I18n.t('comun.cancelar'), clase: 'boton-secundario', onClick: c => c() },
        { texto: I18n.t('comun.guardar'), clase: 'boton-primario', onClick: async (cerrar) => {
            try {
              await Api.put('/pedidos/' + id + '/estado', { estado: document.getElementById('ce-estado').value });
              cerrar();
              UI.toast(I18n.t('pedidos.estado_actualizado'), 'exito');
              App.navegar('pedidos');
            } catch (e) { UI.toast(e.message, 'error'); }
          }
        }
      ]
    });
  }

  async function cancelar(id) {
    const ok = await UI.confirmar(I18n.t('pedidos.cancelar_pedido'), I18n.t('pedidos.confirmar_cancelar'));
    if (!ok) return;
    try {
      await Api.del('/pedidos/' + id);
      UI.toast(I18n.t('pedidos.cancelado'), 'aviso');
      App.navegar('pedidos');
    } catch (e) { UI.toast(e.message, 'error'); }
  }

  return { render };
})();
