/* ==========================================================================
   reportes.js — Módulo de reportes (consume /api/reportes/dashboard)
   ========================================================================== */

const Reportes = (() => {

  async function render(contenedor) {
    const d = await Api.get('/reportes/dashboard');

    contenedor.innerHTML = `
      <div class="cabecera-modulo">
        <h2>${I18n.t('reportes.titulo', { fecha: d.fecha })}</h2>
      </div>

      <div class="kpi-grid">
        ${kpi(I18n.t('reportes.kpi_ventas_dia'),     UI.moneda(d.ventas_dia),
              I18n.t('reportes.detalle_facturas_dia', { n: d.facturas_dia }))}
        ${kpi(I18n.t('reportes.kpi_pedidos_dia'),    d.pedidos_dia,
              I18n.t('reportes.detalle_pedidos_totales', { n: d.pedidos_totales }))}
        ${kpi(I18n.t('reportes.kpi_reservas_dia'),   d.reservas_dia,
              I18n.t('reportes.detalle_reservas_totales', { n: d.reservas_totales }))}
        ${kpi(I18n.t('reportes.kpi_ticket_promedio'), UI.moneda(d.ticket_promedio),
              I18n.t('reportes.detalle_ticket'))}
        ${kpi(I18n.t('reportes.kpi_clientes'),       d.clientes_totales,
              I18n.t('reportes.detalle_clientes'))}
      </div>

      ${bloquePedidosPorEstado(d.pedidos_por_estado)}
      ${bloqueTopPlatos(d.top_platos)}
    `;

    // Las barras de progreso usan custom property --pct (sin inline style).
    contenedor.querySelectorAll('[data-pct]').forEach(el => {
      el.style.setProperty('--pct', el.dataset.pct + '%');
    });
  }

  function kpi(etiqueta, valor, detalle) {
    return `
      <div class="kpi">
        <div class="kpi-etiqueta">${UI.escapar(etiqueta)}</div>
        <div class="kpi-valor">${UI.escapar(String(valor))}</div>
        <div class="kpi-detalle">${UI.escapar(detalle)}</div>
      </div>`;
  }

  function bloquePedidosPorEstado(filas) {
    const total = filas.reduce((s, f) => s + f.n, 0) || 1;
    const html = filas.map(f => {
      const pct = Math.round((f.n / total) * 100);
      const est = Config.buscar('estados_pedido', f.estado) || { nombre: f.estado };
      return `
        <div class="fila-reporte">
          <div class="fila-reporte-cabecera">
            <b>${UI.escapar(est.nombre)}</b><span>${f.n} (${pct} %)</span>
          </div>
          <div class="barra-progreso">
            <div class="barra-progreso-relleno" data-pct="${pct}"></div>
          </div>
        </div>`;
    }).join('') || `<p class="tabla-vacia">${UI.escapar(I18n.t('reportes.sin_pedidos'))}</p>`;

    return `
      <div class="bloque-reporte">
        <h3>${I18n.t('reportes.bloque_pedidos_estado')}</h3>
        ${html}
      </div>`;
  }

  function bloqueTopPlatos(top) {
    if (!top || top.length === 0) {
      return `
        <div class="bloque-reporte">
          <h3>${I18n.t('reportes.bloque_top_platos')}</h3>
          <p class="tabla-vacia">${UI.escapar(I18n.t('reportes.sin_ventas'))}</p>
        </div>`;
    }
    const maxVal = top[0].unidades;
    const html = top.map(t => {
      const pct = Math.round((t.unidades / maxVal) * 100);
      return `
        <div class="fila-reporte">
          <div class="fila-reporte-cabecera">
            <b>${UI.escapar(t.nombre)}</b><span>${t.unidades} ${I18n.t('reportes.unidades')}</span>
          </div>
          <div class="barra-progreso">
            <div class="barra-progreso-relleno" data-pct="${pct}"></div>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="bloque-reporte">
        <h3>${I18n.t('reportes.bloque_top_platos')}</h3>
        ${html}
      </div>`;
  }

  return { render };
})();
