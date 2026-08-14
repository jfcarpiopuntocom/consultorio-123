/*!
 * nucleo-ui.js — consultorio-123 · El núcleo: diseño exacto de Manuel García
 * ============================================================================
 * Esta es la sección "Contabilidad" del nav: los 4 módulos EXACTOS del
 * borrador original (Ingresos con Caja Chica/Bancos, Inventario con la
 * fórmula Inicial+Compras-Final, Cuentas por Cobrar con Número de Cuotas,
 * Estado de Resultados). Es lo que distingue a consultorio-123 de
 * amigable-123/friendly-123 — diseño de Manuel García de Cuenca, powered
 * by jfcarpio.com. Vive aparte del inventario semáforo/perchas heredado de
 * friendly-123 (ese sigue sirviendo para el día a día operativo y como lab
 * de UX); este núcleo es la capa contable exacta que pidió Manuel.
 *
 * Auto-contenido: estilos propios con prefijo .nucleo-, no toca ni depende
 * de las clases CSS del resto de index.html. Usa nucleo-cxc.js,
 * nucleo-ingresos.js, nucleo-inventario.js, nucleo-resultados.js — mismo
 * motor de hechos.js (event-sourcing, cadena de hash) que ya usa el resto
 * de la app.
 * ============================================================================
 */
(function () {
  "use strict";

  var mount = document.getElementById("vista-contabilidad");
  if (!mount) return;

  var css = document.createElement("style");
  css.textContent = `
  .nucleo-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;}
  .nucleo-tab{min-height:44px;padding:10px 16px;border:none;border-radius:12px;background:#F0E4CE;color:#1A1A1A;font-weight:700;font-size:14px;cursor:pointer;}
  .nucleo-tab.activo{background:#FF6B00;color:#FFFFFF;}
  .nucleo-panel{display:none;}
  .nucleo-panel.activo{display:block;}
  .nucleo-card{background:#FFFFFF;border-radius:16px;padding:20px 16px;box-shadow:0 4px 10px rgba(0,0,0,.08);margin-bottom:16px;}
  .nucleo-card h3{font-size:17px;font-weight:800;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;margin:0 0 12px;}
  .nucleo-fg{margin-bottom:14px;}
  .nucleo-fg label{display:block;font-size:14px;font-weight:700;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;margin-bottom:6px;}
  .nucleo-fg input,.nucleo-fg select,.nucleo-fg textarea{width:100%;min-height:44px;padding:10px 12px;border:2px solid #F0E4CE;border-radius:10px;font-size:16px;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;background:#FFFFFF;}
  .nucleo-btn{min-height:44px;width:100%;padding:10px 20px;border:none;border-radius:12px;background:#FF6B00;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;font-weight:800;font-size:16px;cursor:pointer;}
  .nucleo-btn.verde{background:#00A651;}
  .nucleo-btn.chico{width:auto;min-height:36px;padding:6px 12px;font-size:14px;}
  .nucleo-total{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-radius:12px;background:#FFD400;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;font-weight:800;font-size:17px;margin-top:8px;}
  .nucleo-total.destacado{background:#00A651;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;}
  .nucleo-total.rojo{background:#E8112D;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;}
  .nucleo-total.naranja{background:#FF6B00;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;}
  .nucleo-tabla-wrap{overflow-x:auto;background:#FFFFFF;border-radius:14px;box-shadow:0 4px 10px rgba(0,0,0,.08);}
  .nucleo-tabla-wrap table{width:100%;min-width:520px;border-collapse:collapse;font-size:15px;}
  .nucleo-tabla-wrap th{background:#0057B8;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;text-align:left;padding:12px 10px;font-size:13px;white-space:nowrap;}
  .nucleo-tabla-wrap td{padding:12px 10px;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;border-bottom:1px solid #F0E4CE;}
  .nucleo-badge{display:inline-block;padding:4px 10px;border-radius:999px;font-size:13px;font-weight:700;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;}
  .nucleo-badge.rojo{background:#E8112D;}
  .nucleo-badge.verde{background:#00A651;}
  `;
  document.head.appendChild(css);

  function fmt(n) { return "$" + (Number(n) || 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function fecha(ts) { return new Date(ts).toLocaleDateString("es-EC", { year: "numeric", month: "short", day: "numeric" }); }

  mount.innerHTML =
    '<div class="nucleo-tabs">' +
    '<button class="nucleo-tab activo" data-tab="ingresos"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;vertical-align:-3px;margin-right:7px;"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2.6"></circle><path d="M6 12h.01M18 12h.01"></path></svg>Ingresos</button>' +
    '<button class="nucleo-tab" data-tab="inventario"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;vertical-align:-3px;margin-right:7px;"><rect x="3" y="10" width="8" height="8"></rect><rect x="13" y="10" width="8" height="8"></rect><rect x="8" y="3" width="8" height="6"></rect></svg>Insumos</button>' +
    '<button class="nucleo-tab" data-tab="cxc"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;vertical-align:-3px;margin-right:7px;"><circle cx="9" cy="8" r="3.2"></circle><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"></path><path d="M17 8.5a3 3 0 0 1 0 5.4"></path><path d="M19 20c0-2.2-1-3.9-2.6-4.8"></path></svg>Cuentas por Cobrar</button>' +
    '<button class="nucleo-tab" data-tab="resultados"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="width:17px;height:17px;vertical-align:-3px;margin-right:7px;"><path d="M3 20h18"></path><path d="M6 20V11"></path><path d="M11 20V5"></path><path d="M16 20v-6"></path></svg>Estado de Resultados</button>' +
    "</div>" +
    '<div class="nucleo-panel activo" id="nucleo-panel-ingresos"></div>' +
    '<div class="nucleo-panel" id="nucleo-panel-inventario"></div>' +
    '<div class="nucleo-panel" id="nucleo-panel-cxc"></div>' +
    '<div class="nucleo-panel" id="nucleo-panel-resultados"></div>';


  /* Abre una pestana concreta de Contabilidad desde fuera del modulo.
     La usan los botones del nav que llevan data-nucleo-tab (ver index.html).
     Si la pestana no existe, no hace nada: nunca deja la vista en blanco. */
  window.NucleoUI = window.NucleoUI || {};
  window.NucleoUI.abrirTab = function (nombre) {
    /* Delega en el click real de la pestana en vez de duplicar el cambio de
       clases: asi corre tambien renderTab(), que es quien pinta el panel.
       Duplicar el swap de clases dejaba el panel activo pero VACIO. */
    var tab = document.querySelector('.nucleo-tab[data-tab="' + nombre + '"]');
    if (tab) tab.click();
  };
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest('nav button[data-nucleo-tab]');
    if (!b) return;
    /* El cambio de vista lo hace el handler del nav; esto corre despues. */
    setTimeout(function () { window.NucleoUI.abrirTab(b.dataset.nucleoTab); }, 0);
  });

  mount.querySelectorAll(".nucleo-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      mount.querySelectorAll(".nucleo-tab").forEach(function (t) { t.classList.remove("activo"); });
      mount.querySelectorAll(".nucleo-panel").forEach(function (p) { p.classList.remove("activo"); });
      tab.classList.add("activo");
      document.getElementById("nucleo-panel-" + tab.dataset.tab).classList.add("activo");
      renderTab(tab.dataset.tab);
    });
  });

  // ---------------------------------------------------------------------
  // Ingresos
  // ---------------------------------------------------------------------
  function pintarIngresos() {
    var el = document.getElementById("nucleo-panel-ingresos");
    el.innerHTML =
      '<div class="nucleo-card"><h3>Registrar ingreso</h3><form id="nucleo-form-ingreso">' +
      '<div class="nucleo-fg"><label>Paciente</label><input name="paciente" required></div>' +
      '<div class="nucleo-fg"><label>Concepto</label><input name="concepto" required></div>' +
      '<div class="nucleo-fg"><label>Valor</label><input name="monto" type="number" step="0.01" min="0.01" required></div>' +
      '<div class="nucleo-fg"><label>Cuenta</label><select name="cuenta"><option value="caja_chica">Caja chica (efectivo)</option><option value="bancos">Bancos (transferencia/tarjeta/cheque)</option></select></div>' +
      '<div class="nucleo-fg"><label>Forma de pago</label><input name="formaPago" placeholder="Efectivo, tarjeta, transferencia..."></div>' +
      '<div class="nucleo-fg"><label>Observaciones</label><textarea name="observaciones"></textarea></div>' +
      '<button type="submit" class="nucleo-btn">Guardar ingreso</button>' +
      "</form></div>" +
      '<div id="nucleo-totales-ingresos"></div>' +
      '<div id="nucleo-tabla-ingresos" style="margin-top:12px"></div>';

    document.getElementById("nucleo-form-ingreso").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(e.target);
      window.AMG.Ingresos.registrar({
        paciente: f.get("paciente"), concepto: f.get("concepto"), monto: f.get("monto"),
        cuenta: f.get("cuenta"), formaPago: f.get("formaPago"), observaciones: f.get("observaciones")
      }).then(function () { e.target.reset(); renderIngresos(); });
    });
    renderIngresos();
  }

  function renderIngresos() {
    window.AMG.Ingresos.listar().then(function (info) {
      document.getElementById("nucleo-totales-ingresos").innerHTML =
        '<div class="nucleo-total"><span>Total caja chica</span><span>' + fmt(info.totalCajaChica) + "</span></div>" +
        '<div class="nucleo-total" style="margin-top:8px"><span>Total bancos</span><span>' + fmt(info.totalBancos) + "</span></div>" +
        '<div class="nucleo-total destacado" style="margin-top:8px"><span>INGRESOS TOTALES</span><span>' + fmt(info.total) + "</span></div>";
      var filas = info.movimientos.map(function (m) {
        return "<tr><td>" + fecha(m.fecha) + "</td><td>" + esc(m.paciente) + "</td><td>" + esc(m.concepto) + "</td><td>" + fmt(m.monto) +
          "</td><td>" + (m.cuenta === "caja_chica" ? "Caja chica" : "Bancos") + "</td></tr>";
      }).join("");
      document.getElementById("nucleo-tabla-ingresos").innerHTML = info.movimientos.length
        ? '<div class="nucleo-tabla-wrap"><table><thead><tr><th>Fecha</th><th>Paciente</th><th>Concepto</th><th>Valor</th><th>Cuenta</th></tr></thead><tbody>' + filas + "</tbody></table></div>"
        : "";
    });
  }

  // ---------------------------------------------------------------------
  // Inventario
  // ---------------------------------------------------------------------
  function pintarInventario() {
    var el = document.getElementById("nucleo-panel-inventario");
    el.innerHTML =
      '<div class="nucleo-card"><h3>Agregar artículo</h3><form id="nucleo-form-inventario">' +
      '<input type="hidden" name="id">' +
      '<div class="nucleo-fg"><label>Nombre del artículo</label><input name="nombre" required></div>' +
      '<div class="nucleo-fg"><label>Precio unitario</label><input name="precio" type="number" step="0.01" min="0"></div>' +
      '<div class="nucleo-fg"><label>Inventario inicial</label><input name="inicial" type="number" step="0.01" min="0"></div>' +
      '<div class="nucleo-fg"><label>Compras</label><input name="compras" type="number" step="0.01" min="0"></div>' +
      '<div class="nucleo-fg"><label>Inventario final</label><input name="final" type="number" step="0.01" min="0"></div>' +
      '<button type="submit" class="nucleo-btn">Guardar artículo</button>' +
      "</form></div>" +
      '<div id="nucleo-totales-inventario"></div>' +
      '<div id="nucleo-tabla-inventario" style="margin-top:12px"></div>';

    document.getElementById("nucleo-form-inventario").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(e.target);
      window.AMG.Inventario.guardarItem({
        id: f.get("id") || undefined, nombre: f.get("nombre"), precio: f.get("precio"),
        inicial: f.get("inicial"), compras: f.get("compras"), final: f.get("final")
      });
      e.target.reset();
      renderInventario();
    });
    renderInventario();
  }

  function renderInventario() {
    var info = window.AMG.Inventario.listar();
    document.getElementById("nucleo-totales-inventario").innerHTML =
      '<div class="nucleo-total destacado"><span>TOTAL COSTO DE VENTA</span><span>' + fmt(info.totalCostoVenta) + "</span></div>";
    var filas = info.items.map(function (it) {
      return "<tr><td>" + esc(it.nombre) + "</td><td>" + fmt(it.precio) + "</td><td>" + fmt(it.inicial) + "</td><td>" + fmt(it.compras) +
        "</td><td>" + fmt(it.final) + "</td><td><strong>" + fmt(it.costoVenta) + '</strong></td><td><button class="nucleo-btn chico" data-eliminar-inv="' + esc(it.id) + '">Quitar</button></td></tr>';
    }).join("");
    document.getElementById("nucleo-tabla-inventario").innerHTML = info.items.length
      ? '<div class="nucleo-tabla-wrap"><table><thead><tr><th>Artículo</th><th>Precio</th><th>Inicial</th><th>Compras</th><th>Final</th><th>Costo Venta</th><th></th></tr></thead><tbody>' + filas + "</tbody></table></div>"
      : "";
    document.querySelectorAll("[data-eliminar-inv]").forEach(function (btn) {
      btn.addEventListener("click", function () { window.AMG.Inventario.eliminarItem(btn.getAttribute("data-eliminar-inv")); renderInventario(); });
    });
  }

  // ---------------------------------------------------------------------
  // Cuentas por cobrar — Número de Cuotas explícito (spec de Manuel)
  // ---------------------------------------------------------------------
  function pintarCxc() {
    var el = document.getElementById("nucleo-panel-cxc");
    el.innerHTML =
      '<div class="nucleo-card"><h3>Nuevo tratamiento</h3><form id="nucleo-form-tratamiento">' +
      '<div class="nucleo-fg"><label>Paciente</label><input name="paciente" required></div>' +
      '<div class="nucleo-fg"><label>Tratamiento</label><input name="concepto" required></div>' +
      '<div class="nucleo-fg"><label>Valor total</label><input name="valorTotal" type="number" step="0.01" min="0.01" required></div>' +
      '<div class="nucleo-fg"><label>Pago inicial (opcional)</label><input name="pagoInicial" type="number" step="0.01" min="0" value="0"></div>' +
      '<div class="nucleo-fg"><label>Número de cuotas</label><input name="numeroCuotas" type="number" step="1" min="1" value="1"></div>' +
      '<div class="nucleo-fg"><label>Valor de cada cuota (calculado)</label><input name="valorCuota" readonly></div>' +
      /* Sin fecha no hay calendario, y sin calendario "numero de cuotas" es
         decoracion: no se puede saber quien esta atrasado. Solo aparece cuando
         de verdad hay mas de una cuota. */
      '<div class="nucleo-fg" id="nucleo-fg-desde" style="display:none;"><label>Primera cuota el</label><input name="primeraCuota" type="date"></div>' +
      '<button type="submit" class="nucleo-btn">Registrar tratamiento</button>' +
      "</form></div>" +
      '<div class="nucleo-card"><h3>Registrar pago de cuota</h3><form id="nucleo-form-abono">' +
      '<div class="nucleo-fg"><label>Paciente</label><input name="paciente" required></div>' +
      '<div class="nucleo-fg"><label>Valor del pago</label><input name="monto" type="number" step="0.01" min="0.01" required></div>' +
      '<div class="nucleo-fg"><label>Concepto</label><input name="concepto" placeholder="Cuota 2 de 4..."></div>' +
      '<button type="submit" class="nucleo-btn verde">Registrar pago</button>' +
      "</form></div>" +
      '<div id="nucleo-tabla-cxc"></div>';

    var form = document.getElementById("nucleo-form-tratamiento");
    function recalcularCuota() {
      var total = Number(form.valorTotal.value) || 0;
      var inicial = Number(form.pagoInicial.value) || 0;
      var n = Number(form.numeroCuotas.value) || 1;
      var restante = Math.max(0, total - inicial);
      form.valorCuota.value = n > 0 ? (restante / n).toFixed(2) : "0.00";
      var fg = document.getElementById("nucleo-fg-desde");
      if (fg) fg.style.display = n > 1 ? "" : "none";
      if (n > 1 && !form.primeraCuota.value) {
        var hoy = new Date();
        form.primeraCuota.value = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      }
    }
    ["valorTotal", "pagoInicial", "numeroCuotas"].forEach(function (campo) {
      form[campo].addEventListener("input", recalcularCuota);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(e.target);
      var concepto = f.get("concepto") + " (" + f.get("numeroCuotas") + " cuotas de " + fmt(form.valorCuota.value) + ")";
      var paciente = f.get("paciente").trim();
      var nCuotas = Number(f.get("numeroCuotas")) || 1;
      window.AMG.CxC.registrarTratamiento(paciente, concepto, f.get("valorTotal"), f.get("pagoInicial"))
        .then(function () {
          /* El tratamiento se registra PRIMERO y el plan despues, a proposito:
             si el plan falla, la deuda igual quedo registrada. Al reves se
             perderia el dinero. */
          if (nCuotas > 1 && window.AMG.PlanPagos) {
            var restante = Math.max(0, (Number(f.get("valorTotal")) || 0) - (Number(f.get("pagoInicial")) || 0));
            if (restante > 0) {
              return window.AMG.PlanPagos.crearPlan(paciente, {
                montoTotal: restante,
                numCuotas: nCuotas,
                frecuencia: "mensual",
                primerVencimiento: new Date((f.get("primeraCuota") || "") + "T00:00:00"),
                motivo: concepto
              });
            }
          }
        })
        .then(function () { e.target.reset(); form.valorCuota.value = ""; renderCxc(); })
        .catch(function (err) { try { console.error("cuotas:", err); } catch (_) {} renderCxc(); });
    });

    document.getElementById("nucleo-form-abono").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(e.target);
      window.AMG.CxC.registrarMovimiento(f.get("paciente").trim(), "abono", f.get("monto"), f.get("concepto"))
        .then(function () { e.target.reset(); renderCxc(); });
    });
    renderCxc();
  }

  function renderCxc() {
    window.AMG.CxC.saldosTotales().then(function (saldos) {
      var pendientes = saldos.filter(function (s) { return s.saldo < 0; });
      var totalPendiente = pendientes.reduce(function (a, s) { return a + Math.abs(s.saldo); }, 0);
      var ordenados = saldos.sort(function (a, b) { return a.saldo - b.saldo; });
      /* El estado de las cuotas se pide al motor, que lo DERIVA de los hechos.
         Nunca se guarda ni se calcula aca. */
      var estados = window.AMG.PlanPagos
        ? Promise.all(ordenados.map(function (s) { return window.AMG.PlanPagos.estadoDelPlan(s.pacienteId); }))
        : Promise.resolve(ordenados.map(function () { return { hayPlan: false }; }));
      return estados.then(function (es) {
        var filas = ordenados.map(function (s, i) {
          var debe = s.saldo < 0;
          var celda = window.AMG.PlanPagosUI ? window.AMG.PlanPagosUI.celdaEstado(es[i]) : "";
          return "<tr><td>" + esc(s.pacienteId) + '</td><td><span class="nucleo-badge ' + (debe ? "rojo" : "verde") + '">' +
            (debe ? "Debe " + fmt(Math.abs(s.saldo)) : "Al día") + "</span></td><td>" + celda + "</td></tr>";
        }).join("");
        document.getElementById("nucleo-tabla-cxc").innerHTML =
          '<div class="nucleo-total rojo"><span>TOTAL PENDIENTE DE COBRO</span><span>' + fmt(totalPendiente) + "</span></div>" +
          (saldos.length ? '<div class="nucleo-tabla-wrap" style="margin-top:12px"><table><thead><tr><th>Paciente</th><th>Saldo</th><th>Cuotas</th></tr></thead><tbody>' + filas + "</tbody></table></div>" : "");
        if (window.AMG.PlanPagosUI) window.AMG.PlanPagosUI.refrescarHoy();
      });
    });
  }

  // ---------------------------------------------------------------------
  // Estado de resultados
  // ---------------------------------------------------------------------
  function pintarResultados() {
    var g = window.AMG.EstadoResultados.leerGastos();
    var el = document.getElementById("nucleo-panel-resultados");
    el.innerHTML =
      '<div class="nucleo-card"><h3>Gastos fijos del mes</h3><form id="nucleo-form-gastos">' +
      '<div class="nucleo-fg"><label>Salarios</label><input name="salarios" type="number" step="0.01" min="0" value="' + g.salarios + '"></div>' +
      '<div class="nucleo-fg"><label>Arriendo</label><input name="arriendo" type="number" step="0.01" min="0" value="' + g.arriendo + '"></div>' +
      '<div class="nucleo-fg"><label>Servicios</label><input name="servicios" type="number" step="0.01" min="0" value="' + g.servicios + '"></div>' +
      '<div class="nucleo-fg"><label>Impuestos</label><input name="impuestos" type="number" step="0.01" min="0" value="' + g.impuestos + '"></div>' +
      '<div class="nucleo-fg"><label>Gastos varios</label><input name="gastosVarios" type="number" step="0.01" min="0" value="' + g.gastosVarios + '"></div>' +
      '<button type="submit" class="nucleo-btn">Guardar gastos</button>' +
      "</form></div>" +
      '<div id="nucleo-resumen-resultados"></div>';

    document.getElementById("nucleo-form-gastos").addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(e.target);
      window.AMG.EstadoResultados.guardarGastos({
        salarios: f.get("salarios"), arriendo: f.get("arriendo"), servicios: f.get("servicios"),
        impuestos: f.get("impuestos"), gastosVarios: f.get("gastosVarios")
      });
      renderResultados();
    });
    renderResultados();
  }

  function fila(label, valor) {
    return '<div class="nucleo-total" style="margin-top:8px;background:#F0E4CE"><span>' + esc(label) + "</span><span>" + fmt(valor) + "</span></div>";
  }

  function renderResultados() {
    window.AMG.EstadoResultados.calcular().then(function (r) {
      document.getElementById("nucleo-resumen-resultados").innerHTML =
        '<div class="nucleo-card"><h3>Estado de resultados</h3>' +
        '<div class="nucleo-total destacado"><span>Ingresos totales</span><span>' + fmt(r.ingresosTotales) + "</span></div>" +
        fila("(-) Costo de venta", r.costoVenta) +
        '<div class="nucleo-total naranja" style="margin-top:8px"><span>Utilidad bruta</span><span>' + fmt(r.utilidadBruta) + "</span></div>" +
        fila("(-) Gastos fijos", r.gastosFijos) +
        '<div class="nucleo-total destacado" style="margin-top:8px"><span>UTILIDAD NETA</span><span>' + fmt(r.utilidadNeta) + "</span></div>" +
        '<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">' +
        '<span class="nucleo-badge verde">Margen bruto ' + r.margenBruto + "%</span>" +
        '<span class="nucleo-badge verde">Margen neto ' + r.margenNeto + "%</span>" +
        "</div></div>";
    });
  }

  var pintado = { ingresos: false, inventario: false, cxc: false, resultados: false };
  var pintores = { ingresos: pintarIngresos, inventario: pintarInventario, cxc: pintarCxc, resultados: pintarResultados };
  function renderTab(tab) {
    if (!pintado[tab]) { pintores[tab](); pintado[tab] = true; }
  }

  // Primer render cuando el usuario entra por primera vez a esta vista.
  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.querySelector('nav button[data-vista="contabilidad"]');
    if (btn) btn.addEventListener("click", function () { renderTab("ingresos"); }, { once: true });
  });
})();
