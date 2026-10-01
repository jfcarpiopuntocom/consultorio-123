/*!
 * ingresos.js — Consultorio-123 · Módulo Ingresos
 * ============================================================================
 * Adaptado de caja-chica.js (friendly-123). Mismo patrón de event-sourcing:
 * cada ingreso es un hecho inmutable "ingreso_registrado", nunca un total
 * mutable. El total (caja chica, bancos, o global) siempre se DERIVA sumando
 * los hechos conocidos — ver hechos.js para la cadena de hash que hace esto
 * tamper-evident.
 *
 * cuenta: "caja_chica" | "bancos" — dónde entró el dinero.
 * ============================================================================
 */
(function (global) {
  "use strict";

  var TIPO = "ingreso_registrado";
  var CUENTAS = ["caja_chica", "bancos"];

  function bus() {
    try { return global.AMG && global.AMG.EventBus; } catch (_) { return null; }
  }

  function registrar(datos) {
    var monto = Number(datos && datos.monto);
    if (!Number.isFinite(monto) || !(monto > 0)) return Promise.reject(new Error("ingresos: monto debe ser mayor a cero"));
    var cuenta = datos && datos.cuenta;
    if (CUENTAS.indexOf(cuenta) === -1) {
      return Promise.reject(new Error("ingresos: cuenta debe ser 'caja_chica' o 'bancos'"));
    }

    var payload = {
      monto: +monto.toFixed(2),
      cuenta: cuenta,
      paciente: String(datos.paciente || "").slice(0, 200),
      concepto: String(datos.concepto || "").slice(0, 300),
      formaPago: String(datos.formaPago || "").slice(0, 100),
      observaciones: String(datos.observaciones || "").slice(0, 500)
    };

    if (global.AMG && global.AMG.Hechos && global.AMG.Hechos.registrar) {
      return global.AMG.Hechos.registrar(TIPO, payload).then(function (hecho) {
        var eventBus = bus();
        if (eventBus) eventBus.emit(TIPO + ':registrado', { payload: payload });
        return hecho;
      });
    }
    return Promise.reject(new Error("ingresos: AMG.Hechos no disponible"));
  }

  // Lista todos los ingresos conocidos, con totales por cuenta y total global.
  function listar() {
    if (!global.AMG || !global.AMG.Hechos || !global.AMG.Hechos.todos) {
      return Promise.resolve({ movimientos: [], totalCajaChica: 0, totalBancos: 0, total: 0 });
    }
    return global.AMG.Hechos.todos().then(function (todos) {
      var mios = todos.filter(function (h) { return h.tipo === TIPO && h.datos; });
      // Older shells wrote one nested + one plain event per click. Preserve
      // both stored facts, count the historical pair once, not new payments.
      var pares = new Map();
      mios.forEach(function (h) {
        var p = h.datos.payload || h.datos;
        var key = JSON.stringify([p, Math.floor(h.ts / 2000)]);
        var g = pares.get(key) || { plain: [], nested: [] };
        g[h.datos.payload ? 'nested' : 'plain'].push(h); pares.set(key, g);
      });
      mios = [].concat.apply([], Array.from(pares.values()).map(function (g) {
        return g.plain.length && g.nested.length ? (g.plain.length >= g.nested.length ? g.plain : g.nested) : g.plain.concat(g.nested);
      }));
      var totalCajaChica = 0, totalBancos = 0;
      var movimientos = mios.map(function (h) {
        var p = h.datos.payload || h.datos;
        var monto = Number(p.monto) || 0;
        if (p.cuenta === "caja_chica") totalCajaChica += monto; else totalBancos += monto;
        return {
          fecha: h.ts,
          paciente: p.paciente || "",
          concepto: p.concepto || "",
          monto: monto,
          cuenta: p.cuenta,
          formaPago: p.formaPago || "",
          observaciones: p.observaciones || ""
        };
      });
      movimientos.sort(function (a, b) { return b.fecha - a.fecha; });
      return {
        movimientos: movimientos,
        totalCajaChica: +totalCajaChica.toFixed(2),
        totalBancos: +totalBancos.toFixed(2),
        total: +(totalCajaChica + totalBancos).toFixed(2)
      };
    });
  }

  global.AMG = global.AMG || {};
  global.AMG.Ingresos = { VERSION: "1.0.0", registrar: registrar, listar: listar };
})(typeof window !== "undefined" ? window : this);
