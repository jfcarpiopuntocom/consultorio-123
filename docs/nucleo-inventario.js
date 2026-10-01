/*!
 * inventario.js — Consultorio-123 · Módulo Inventario
 * ============================================================================
 * A diferencia de Ingresos y Cuentas por Cobrar, el inventario NO es un flujo
 * de hechos que ocurren en el tiempo — es una tabla de conteo periódico
 * (inicial/compras/final) que el usuario edita directamente. Guardarlo como
 * event-sourcing sería complejidad innecesaria para lo que es: un snapshot.
 * Se guarda tal cual en localStorage, simple y directo.
 *
 * Costo de Venta = Inventario Inicial + Compras − Inventario Final
 * ============================================================================
 */
(function (global) {
  "use strict";

  var KEY = "c123_inventario_v1";

  function leer() {
    if (global.OCSync) return global.OCSync.leerDatos('inventarioClinico');
    try { return JSON.parse(localStorage.getItem(KEY) || "[]") || []; } catch (_) { return []; }
  }

  function guardarTodo(items) {
    if (!global.OCSync) return Promise.reject(new Error('El almacenamiento no está disponible.'));
    return global.OCSync.guardarDatos('inventarioClinico', items);
  }

  function costoVenta(item) {
    var inicial = Number(item.inicial) || 0;
    var compras = Number(item.compras) || 0;
    var final = Number(item.final) || 0;
    return +(inicial + compras - final).toFixed(2);
  }

  function listar() {
    var items = leer().map(function (it) {
      return Object.assign({}, it, { costoVenta: costoVenta(it) });
    });
    var totalCostoVenta = items.reduce(function (acc, it) { return acc + it.costoVenta; }, 0);
    return { items: items, totalCostoVenta: +totalCostoVenta.toFixed(2) };
  }

  function guardarItem(item) {
    var items = leer();
    var id = item.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6));
    var idx = items.findIndex(function (it) { return it.id === id; });
    var limpio = {
      id: id,
      nombre: String(item.nombre || "").slice(0, 200),
      precio: +(Number(item.precio) || 0).toFixed(2),
      inicial: +(Number(item.inicial) || 0).toFixed(2),
      compras: +(Number(item.compras) || 0).toFixed(2),
      final: +(Number(item.final) || 0).toFixed(2)
    };
    if (idx === -1) items.push(limpio); else items[idx] = limpio;
    return guardarTodo(items).then(function () { return limpio; });
  }

  function eliminarItem(id) {
    return guardarTodo(leer().filter(function (it) { return it.id !== id; }));
  }

  global.AMG = global.AMG || {};
  global.AMG.Inventario = {
    VERSION: "1.0.0",
    listar: listar,
    guardarItem: guardarItem,
    eliminarItem: eliminarItem,
    costoVenta: costoVenta
  };
})(typeof window !== "undefined" ? window : this);
