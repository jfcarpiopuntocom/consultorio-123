/*!
 * agenda.js — consultorio-123 · Agenda de citas
 * ============================================================================
 * Event-sourcing sobre hechos.js, mismo patrón que cxc.js/ingresos.js — una
 * cita agendada o cancelada es un hecho inmutable, nunca un registro que se
 * sobreescribe. Ver _private/PLAN-AGENDA-CITAS.md para la arquitectura
 * completa (por qué esto y no una tabla mutable).
 *
 * CORE: coordinar la agenda del consultorio e integrarse con Google
 * Calendar/Outlook (agenda-ui.js). NO ES nuestro core llevar historial
 * clínico del paciente — eso ya lo resuelven otras apps que médicos/clínicas
 * ya usan; aquí solo se guarda lo mínimo para coordinar (paciente, motivo
 * breve, fecha/hora), nunca notas clínicas.
 * ============================================================================
 */
(function (global) {
  "use strict";

  var TIPOS = { agendada: "cita_agendada", cancelada: "cita_cancelada" };

  function bus() { try { return global.AMG && global.AMG.EventBus; } catch (_) { return null; } }

  function agendar(datos) {
    var paciente = String(datos.paciente || "").trim();
    var fecha = String(datos.fecha || "").trim(); // YYYY-MM-DD
    var hora = String(datos.hora || "").trim();   // HH:MM
    if (!paciente) return Promise.reject(new Error("agenda: falta paciente"));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return Promise.reject(new Error("agenda: fecha inválida"));
    if (!/^\d{2}:\d{2}$/.test(hora)) return Promise.reject(new Error("agenda: hora inválida"));

    var payload = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      paciente: paciente.slice(0, 200),
      motivo: String(datos.motivo || "").slice(0, 300),
      fecha: fecha,
      hora: hora,
      duracionMin: Number(datos.duracionMin) > 0 ? Number(datos.duracionMin) : 30
    };
    if (global.AMG && global.AMG.Hechos && global.AMG.Hechos.registrar) {
      return global.AMG.Hechos.registrar(TIPOS.agendada, payload).then(function () { return payload; });
    }
    return Promise.reject(new Error("agenda: AMG.Hechos no disponible"));
  }

  function cancelar(citaId, motivo) {
    var payload = { citaId: citaId, motivo: String(motivo || "").slice(0, 300) };
    if (global.AMG && global.AMG.Hechos && global.AMG.Hechos.registrar) {
      return global.AMG.Hechos.registrar(TIPOS.cancelada, payload);
    }
    return Promise.reject(new Error("agenda: AMG.Hechos no disponible"));
  }

  // Lista citas vigentes (agendadas y no canceladas), ordenadas por fecha/hora.
  function listar() {
    if (!global.AMG || !global.AMG.Hechos || !global.AMG.Hechos.todos) return Promise.resolve([]);
    return global.AMG.Hechos.todos().then(function (todos) {
      var agendadas = {};
      todos.forEach(function (h) {
        if (h.tipo === TIPOS.agendada && h.datos) {
          var p = h.datos.payload || h.datos;
          agendadas[p.id] = p;
        }
      });
      todos.forEach(function (h) {
        if (h.tipo === TIPOS.cancelada && h.datos) {
          delete agendadas[(h.datos.payload || h.datos).citaId];
        }
      });
      return Object.values(agendadas).sort(function (a, b) {
        return (a.fecha + a.hora).localeCompare(b.fecha + b.hora);
      });
    });
  }

  global.AMG = global.AMG || {};
  global.AMG.Agenda = { VERSION: "1.0.0", agendar: agendar, cancelar: cancelar, listar: listar };
})(typeof window !== "undefined" ? window : this);
