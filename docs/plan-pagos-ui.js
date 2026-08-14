/*!
 * plan-pagos-ui.js — consultorio-123 · Cuotas de tratamientos
 * ============================================================================
 * El motor esta en plan-pagos.js y este archivo NO calcula nada de dinero:
 * solo pinta lo que el motor deriva. Si se borra, ningun saldo ni ninguna
 * cuota se pierde.
 *
 * DONDE VIVE CADA COSA, igual que en amigable-123 y friendly-123, a proposito:
 *
 *   LA ALERTA va en Hoy. Es el tablero que el medico abre cada manana y
 *   responde el trabajo diario, "a quien hay que recordarle hoy". No cuesta un
 *   boton de menu, que en esta app ya tiene once.
 *
 *   LA GESTION se queda dentro de Cuentas por Cobrar, en Contabilidad, donde
 *   ya vive. Un plan de cuotas ES una cuenta por cobrar con calendario: darle
 *   pantalla propia partiria un concepto en dos.
 *
 * Las tres apps se comportan igual en esto. La consistencia entre hermanas vale
 * mas que optimizar cada una por separado: JFC las mantiene a las tres.
 *
 * COPY: el aviso se encuadra como un olvido, nunca como una falta. "No ha
 * llegado la cuota", jamas "no pago". Aca ademas son pacientes, no deudores.
 *
 * NARANJA, NO ROJO: el rojo tiene significado propio en el semaforo. Una cuota
 * atrasada es "urgente, pronto", que es naranja.
 * ============================================================================
 */
(function (global) {
  "use strict";

  var css = document.createElement("style");
  css.textContent = "" +
    "#pp-hoy{display:none;margin:0 0 14px;padding:14px 16px;border-radius:14px;background:#FFF1EC;border-left:5px solid #E86040;}" +
    "#pp-hoy.hay{display:block;}" +
    "#pp-hoy .t{font-size:17px;font-weight:800;color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;margin:0 0 4px;}" +
    "#pp-hoy .s{font-size:15px;line-height:1.5;color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;margin:0 0 10px;}" +
    "#pp-hoy button{min-height:44px;padding:10px 18px;border:none;border-radius:10px;background:#E86040;" +
      "color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;font-weight:800;font-size:15px;cursor:pointer;}" +
    ".pp-estado{display:inline-block;font-size:14px;font-weight:700;padding:4px 10px;border-radius:8px;" +
      "color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;}" +
    ".pp-prox{display:block;font-size:14px;color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;margin-top:4px;}" +
    ".pp-anular{display:inline-block;margin-top:6px;min-height:44px;padding:8px 14px;border:2px solid #E2E8ED;" +
      "border-radius:10px;background:#FFFFFF;font-size:14px;font-weight:700;" +
      "color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;cursor:pointer;}";
  document.head.appendChild(css);

  /* MISMO formato que nucleo-ui.js, a proposito. Con toFixed(2) la tabla
     mostraba "Debe $500,00" al lado de "atrasado $300.00": dos convenciones de
     dinero en la misma fila. Si nucleo-ui cambia de locale, cambiar aca tambien. */
  function fmt(n) {
    return "$" + (Number(n) || 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* cumplido: ya no debe nada, no se anuncian mas cuotas. */
  var TXT = { al_dia: "al día", adelantado: "adelantado", atrasado: "atrasado", cumplido: "plan cumplido" };

  /* Celda de estado para la tabla de Cuentas por Cobrar. Devuelve HTML listo,
     o cadena vacia si el paciente no tiene plan, que es el caso normal: la
     mayoria de los tratamientos se pagan de una y no llevan calendario. */
  function celdaEstado(e, pacienteId) {
    if (!e || !e.hayPlan) return "";
    var color = e.estado === "atrasado" ? "#E86040" : "#00C87A";
    var extra = e.diferencia < 0 ? " " + fmt(-e.diferencia) : (e.diferencia > 0 ? " " + fmt(e.diferencia) : "");
    var html = '<span class="pp-estado" style="background:' + color + '">' + esc(TXT[e.estado] || "") + extra + "</span>";
    if (e.proximoVencimiento) {
      html += '<span class="pp-prox">Próxima: ' + fmt(e.montoCuota) + " el " +
        esc(global.AMG.PlanPagos.fechaEnPalabras(e.proximoVencimiento)) + "</span>";
    }
    /* Cambiar el acuerdo. El motor NO borra el plan viejo: emite
       plan_pago_anulado, asi que el historial muestra que hubo una
       renegociacion. Y el saldo no se toca: anular un acuerdo no perdona una
       deuda. El id del paciente va en el atributo porque esta tabla se pinta
       con innerHTML de una sola vez. */
    html += '<button type="button" class="pp-anular" data-pp-anular="' + esc(pacienteId || "") + '">Cambiar acuerdo</button>';
    return html;
  }

  /* Un solo listener delegado para toda la tabla, en vez de uno por fila: la
     tabla se repinta entera cada vez y los listeners por fila se perderian. */
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-pp-anular]");
    if (!b) return;
    var id = b.getAttribute("data-pp-anular");
    if (!id || !global.AMG || !global.AMG.PlanPagos) return;
    if (!global.confirm("Se anula el calendario de cuotas de " + id + ". La deuda NO se perdona: el saldo queda igual.")) return;
    b.disabled = true;
    global.AMG.PlanPagos.anularPlan(id, "Renegociado desde Cuentas por Cobrar")
      .then(function () { if (global.NucleoUI && global.NucleoUI.repintarCxc) global.NucleoUI.repintarCxc(); })
      .catch(function (e) { b.disabled = false; try { console.error("anular:", e); } catch (_) {} });
  });

  // ---------------------------------------------------------------------------
  // La alerta en Hoy
  // ---------------------------------------------------------------------------
  function refrescarHoy() {
    var caja = document.getElementById("pp-hoy");
    if (!caja || !global.AMG || !global.AMG.CxC || !global.AMG.PlanPagos) return Promise.resolve();
    return global.AMG.CxC.saldosTotales().then(function (saldos) {
      return Promise.all((saldos || []).map(function (s) {
        return global.AMG.PlanPagos.estadoDelPlan(s.pacienteId).then(function (e) {
          return { id: s.pacienteId, e: e };
        });
      }));
    }).then(function (todos) {
      var atrasados = todos.filter(function (x) { return x.e.hayPlan && x.e.estado === "atrasado"; });
      if (!atrasados.length) { caja.classList.remove("hay"); caja.innerHTML = ""; return; }
      var total = atrasados.reduce(function (a, x) { return a + Math.abs(x.e.diferencia); }, 0);
      var n = atrasados.length;
      caja.innerHTML =
        '<p class="t">' + n + (n === 1 ? " cuota no ha llegado" : " cuotas no han llegado") + "</p>" +
        '<p class="s">Suman ' + fmt(total) + ". Son " + (n === 1 ? "un paciente" : n + " pacientes") +
          " con cuotas acordadas.</p>" +
        '<button type="button" id="pp-ver">Ver quiénes son</button>';
      caja.classList.add("hay");
      caja.querySelector("#pp-ver").addEventListener("click", function () {
        var b = document.querySelector('nav button[data-nucleo-tab="ingresos"]');
        if (b) b.click();
        setTimeout(function () {
          if (global.NucleoUI && global.NucleoUI.abrirTab) global.NucleoUI.abrirTab("cxc");
        }, 400);
      });
    }).catch(function () {});
  }

  function montar() {
    var hoy = document.getElementById("vista-hoy");
    if (hoy && !document.getElementById("pp-hoy")) {
      var d = document.createElement("div");
      d.id = "pp-hoy";
      hoy.insertBefore(d, hoy.firstChild);
    }
    refrescarHoy();
  }

  global.addEventListener("oc-login", function () { setTimeout(montar, 700); });
  global.addEventListener("oc-logout", function () {
    var c = document.getElementById("pp-hoy");
    if (c) { c.classList.remove("hay"); c.innerHTML = ""; }
  });

  global.AMG = global.AMG || {};
  global.AMG.PlanPagosUI = {
    VERSION: "1.0.0",
    celdaEstado: celdaEstado,
    refrescarHoy: refrescarHoy,
    montar: montar
  };
})(typeof window !== "undefined" ? window : this);
