/*!
 * estado-resultados.js — Consultorio-123 · Módulo Estado de Resultados
 * ============================================================================
 * Se alimenta AUTOMÁTICAMENTE de ingresos.js e inventario.js. Los gastos fijos
 * (salarios, arriendo, servicios, impuestos, varios) son la única entrada
 * manual de este módulo — se guardan como un snapshot simple en localStorage,
 * igual que inventario.js, porque son un dato de configuración mensual, no un
 * flujo de eventos.
 *
 * Cuentas por Cobrar (cxc.js) NO se suma aquí: un tratamiento a crédito no es
 * ingreso hasta que se cobra de verdad. El cobro de una cuota SÍ debe
 * registrarse también como un ingreso en ingresos.js — cxc.js y ingresos.js
 * son intencionalmente independientes, así el dueño decide cuándo un abono de
 * paciente entra a caja.
 *
 * Utilidad Bruta    = Ingresos Totales − Costo de Venta
 * Utilidad Operativa = Utilidad Bruta − Gastos Fijos
 * Utilidad Neta      = Utilidad Operativa (v1.0 no modela impuestos aparte)
 * Margen Bruto/Neto  = Utilidad / Ingresos × 100
 * ============================================================================
 */
(function (global) {
  "use strict";

  var KEY = "c123_gastos_fijos_v1";
  var CAMPOS = ["salarios", "arriendo", "servicios", "impuestos", "gastosVarios"];

  function leerGastos() {
    try {
      var g = global.OCSync ? (global.OCSync.leerDatos('gastosFijos')[0] || {}) : JSON.parse(localStorage.getItem(KEY) || "null") || {};
      var limpio = {};
      CAMPOS.forEach(function (c) { limpio[c] = +(Number(g[c]) || 0).toFixed(2); });
      return limpio;
    } catch (_) {
      var vacio = {};
      CAMPOS.forEach(function (c) { vacio[c] = 0; });
      return vacio;
    }
  }

  function guardarGastos(gastos) {
    var limpio = {};
    CAMPOS.forEach(function (c) { limpio[c] = +(Number(gastos[c]) || 0).toFixed(2); });
    if (!global.OCSync) return Promise.reject(new Error('El almacenamiento no está disponible.'));
    return global.OCSync.guardarDatos('gastosFijos', [{ id: 'gastos-fijos', ...limpio }]).then(function () { return limpio; });
  }

  function totalGastosFijos(gastos) {
    return +CAMPOS.reduce(function (acc, c) { return acc + (Number(gastos[c]) || 0); }, 0).toFixed(2);
  }

  // Calcula el estado completo. Requiere AMG.Ingresos e AMG.Inventario ya
  // cargados en la página (index.html los incluye antes que este archivo).
  function calcular() {
    var gastos = leerGastos();
    var gastosFijos = totalGastosFijos(gastos);

    return global.AMG.Ingresos.listar().then(function (ingresosInfo) {
      var inventarioInfo = global.AMG.Inventario.listar();
      var ingresosTotales = ingresosInfo.total;
      var costoVenta = inventarioInfo.totalCostoVenta;
      var utilidadBruta = +(ingresosTotales - costoVenta).toFixed(2);
      var utilidadOperativa = +(utilidadBruta - gastosFijos).toFixed(2);
      var utilidadNeta = utilidadOperativa;
      var margenBruto = ingresosTotales > 0 ? +((utilidadBruta / ingresosTotales) * 100).toFixed(1) : 0;
      var margenNeto = ingresosTotales > 0 ? +((utilidadNeta / ingresosTotales) * 100).toFixed(1) : 0;

      return {
        ingresosTotales: ingresosTotales,
        costoVenta: costoVenta,
        utilidadBruta: utilidadBruta,
        gastos: gastos,
        gastosFijos: gastosFijos,
        utilidadOperativa: utilidadOperativa,
        utilidadNeta: utilidadNeta,
        margenBruto: margenBruto,
        margenNeto: margenNeto
      };
    });
  }

  global.AMG = global.AMG || {};
  global.AMG.EstadoResultados = {
    VERSION: "1.0.0",
    leerGastos: leerGastos,
    guardarGastos: guardarGastos,
    calcular: calcular,
    CAMPOS: CAMPOS
  };
})(typeof window !== "undefined" ? window : this);
