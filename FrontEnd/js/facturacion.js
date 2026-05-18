/* ==========================================================================
   facturacion.js — Módulo de facturación (consume /api/facturacion)
   INC del 8 % para restaurantes (Art. 512-1 E.T. Colombia).
   ========================================================================== */

const Facturacion = (() => {

  function inc()     { return Config.parametroNum('facturacion.impuesto_porcentaje'); }
  function empresa() {
    return {
      nombre:    Config.parametro('empresa.nombre'),
      nit:       Config.parametro('empresa.nit'),
      direccion: Config.parametro('empresa.direccion')
    };
  }

  async function render(contenedor) {
    const [facturas, clientes] = await Promise.all([Api.get('/facturacion/'), Api.get('/clientes/')]);

    contenedor.innerHTML = `
      <div class="cabecera-modulo">
        <h2>${I18n.t('facturacion.titulo')}</h2>
        <button class="boton boton-primario" id="btn-nueva-factura">${UI.escapar(I18n.t('facturacion.nueva'))}</button>
      </div>

      <div class="tabla-contenedor">
        <table class="tabla">
          <thead>
            <tr>
              <th>${I18n.t('pedidos.numero')}</th>
              <th>${I18n.t('facturacion.pedido')}</th>
              <th>${I18n.t('pedidos.cliente')}</th>
              <th>${I18n.t('facturacion.subtotal')}</th>
              <th>${I18n.t('facturacion.inc', { pct: inc() })}</th>
              <th>${I18n.t('comun.total')}</th>
              <th>${I18n.t('comun.fecha')}</th>
              <th>${I18n.t('comun.acciones')}</th>
            </tr>
          </thead>
          <tbody id="lista-facturas"></tbody>
        </table>
      </div>
    `;

    pintarTabla(document.getElementById('lista-facturas'), facturas, clientes);
    document.getElementById('btn-nueva-factura').addEventListener('click', () => seleccionarPedido());
  }

  function pintarTabla(tbody, facturas, clientes) {
    if (facturas.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="tabla-vacia">${UI.escapar(I18n.t('facturacion.sin_facturas'))}</td></tr>`;
      return;
    }
    tbody.innerHTML = facturas.map(f => {
      const cliente = clientes.find(c => c.id === f.cliente_id);
      return `
        <tr>
          <td>${f.id}</td>
          <td>#${f.pedido_id}</td>
          <td>${UI.escapar(cliente ? cliente.nombre : 'N/A')}</td>
          <td>${UI.moneda(f.subtotal)}</td>
          <td>${UI.moneda(f.inc)}</td>
          <td><b>${UI.moneda(f.total)}</b></td>
          <td>${f.fecha}</td>
          <td class="acciones">
            <button class="boton boton-secundario boton-pequeno" data-ver="${f.id}">${UI.escapar(I18n.t('comun.ver'))}</button>
            <button class="boton boton-secundario boton-pequeno" data-imprimir="${f.id}">${UI.escapar(I18n.t('facturacion.imprimir'))}</button>
          </td>
        </tr>`;
    }).join('');

    tbody.querySelectorAll('[data-ver]').forEach(b =>
      b.addEventListener('click', () => verFactura(parseInt(b.dataset.ver, 10), clientes)));
    tbody.querySelectorAll('[data-imprimir]').forEach(b =>
      b.addEventListener('click', async () => {
        await verFactura(parseInt(b.dataset.imprimir, 10), clientes);
        setTimeout(() => window.print(), 250);
      }));
  }

  async function seleccionarPedido() {
    const pedidos = await Api.get('/pedidos/');
    const facturas = await Api.get('/facturacion/');
    const facturados = new Set(facturas.map(f => f.pedido_id));
    const candidatos = pedidos.filter(p => !facturados.has(p.id) && p.estado !== 'cancelado');

    if (candidatos.length === 0) {
      UI.toast(I18n.t('facturacion.sin_pendientes'), 'aviso'); return;
    }

    UI.modal({
      titulo: I18n.t('facturacion.seleccionar_pedido'),
      contenidoHTML: `
        <form class="formulario">
          <label for="f-pedido">${I18n.t('facturacion.pedido')}</label>
          <select id="f-pedido">
            ${candidatos.map(p => `<option value="${p.id}">${I18n.t('facturacion.pedido')} #${p.id} — ${I18n.t('pedidos.mesa')} ${p.mesa} — ${UI.moneda(p.total)}</option>`).join('')}
          </select>
        </form>`,
      botones: [
        { texto: I18n.t('comun.cancelar'), clase: 'boton-secundario', onClick: c => c() },
        { texto: I18n.t('facturacion.emitir'), clase: 'boton-primario', onClick: async (cerrar) => {
            const pedidoId = parseInt(document.getElementById('f-pedido').value, 10);
            try {
              const factura = await Api.post('/facturacion/', { pedido_id: pedidoId });
              cerrar();
              UI.toast(I18n.t('facturacion.emitida', { id: factura.id }), 'exito');
              const clientes = await Api.get('/clientes/');
              await verFactura(factura.id, clientes);
              App.navegar('facturacion');
            } catch (e) { UI.toast(e.message, 'error'); }
          }
        }
      ]
    });
  }

  async function verFactura(id, clientes) {
    let f;
    try { f = await Api.get('/facturacion/' + id); }
    catch (e) { UI.toast(e.message, 'error'); return; }
    const cliente = clientes.find(c => c.id === f.cliente_id);
    const emp = empresa();

    const itemsHTML = (f.items || []).map(i => `
      <tr>
        <td>${i.cantidad} × ${UI.escapar(i.nombre)}</td>
        <td class="alineado-derecha">${UI.moneda(i.cantidad * i.precio)}</td>
      </tr>`).join('');

    UI.modal({
      titulo: I18n.t('facturacion.factura_numero', { id: f.id }),
      contenidoHTML: `
        <div class="factura">
          <div class="factura-cabecera">
            <h3>${UI.escapar(emp.nombre || '')}</h3>
            <p>${I18n.t('facturacion.nit')}: ${UI.escapar(emp.nit || '')} · ${UI.escapar(emp.direccion || '')}</p>
            <p><b>${I18n.t('facturacion.factura_numero', { id: f.id })}</b> · ${f.fecha}</p>
          </div>
          <p><b>${I18n.t('pedidos.cliente')}:</b> ${UI.escapar(cliente ? cliente.nombre : I18n.t('facturacion.consumidor_final'))}</p>
          <p><b>${I18n.t('facturacion.pedido')}:</b> #${f.pedido_id}</p>
          <table class="factura-tabla">
            <thead><tr><th>${I18n.t('facturacion.detalle')}</th><th class="alineado-derecha">${I18n.t('facturacion.valor')}</th></tr></thead>
            <tbody>${itemsHTML}</tbody>
          </table>
          <div class="factura-totales">
            <div>${I18n.t('facturacion.subtotal')}: <b>${UI.moneda(f.subtotal)}</b></div>
            <div>${I18n.t('facturacion.inc', { pct: inc() })}: <b>${UI.moneda(f.inc)}</b></div>
            <div class="total-final">${I18n.t('facturacion.total_pagar')}: ${UI.moneda(f.total)}</div>
            <p class="factura-pie">${UI.escapar(I18n.t('facturacion.inc_descripcion'))}</p>
          </div>
        </div>`,
      botones: [{ texto: I18n.t('comun.cerrar'), clase: 'boton-secundario', onClick: c => c() }]
    });
  }

  return { render };
})();
