/*!
 * agenda-ui.js — consultorio-123 · Agenda + integración Google Calendar/Outlook
 * ============================================================================
 * Integración SIN OAuth ni backend propio — cubre la gran mayoría de casos:
 *   - "Agregar a Google Calendar": URL de quick-add de Google (estándar
 *     público, sin API key, funciona en cualquier cuenta Google).
 *   - "Descargar .ics": formato universal que Outlook, Apple Calendar y el
 *     propio Google Calendar importan nativamente con un doble clic.
 * Sync bidireccional real (que un cambio acá mueva el evento allá y
 * viceversa) requiere OAuth + backend — ver _private/PLAN-AGENDA-CITAS.md,
 * fase 5, deliberadamente NO construida todavía.
 * ============================================================================
 */
(function () {
  "use strict";

  var mount = document.getElementById("vista-agenda");
  if (!mount) return;

  var css = document.createElement("style");
  css.textContent = `
  .agenda-card{background:#FFFFFF;border-radius:16px;padding:20px 16px;box-shadow:0 4px 10px rgba(0,0,0,.08);margin-bottom:16px;}
  .agenda-card h3{font-size:17px;font-weight:800;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;margin:0 0 12px;}
  .agenda-fg{margin-bottom:14px;}
  .agenda-fg label{display:block;font-size:14px;font-weight:700;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;margin-bottom:6px;}
  .agenda-fg input,.agenda-fg select{width:100%;min-height:44px;padding:10px 12px;border:2px solid #F0E4CE;border-radius:10px;font-size:16px;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;background:#FFFFFF;}
  .agenda-btn{min-height:44px;width:100%;padding:10px 20px;border:none;border-radius:12px;background:#8E2DE2;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;font-weight:800;font-size:16px;cursor:pointer;}
  .agenda-fila{background:#FFFFFF;border-radius:12px;padding:14px;box-shadow:0 3px 8px rgba(0,0,0,.06);margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;}
  .agenda-fila .quien{font-weight:800;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;}
  .agenda-fila .cuando{font-size:14px;color:#7A3C00 !important;-webkit-text-fill-color:#7A3C00 !important;font-weight:700;}
  .agenda-fila .motivo{font-size:14px;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;}
  /* Cita en curso (JFC 2026-08-11): la pregunta que el consultorio se hace todo
     el dia es quien esta adentro y quien sigue. Se marca con tinta y peso, sin
     gastar un color del semaforo Simon. */
  .agenda-fila.en-curso{border-left:6px solid #0F1923;background:#EFF1F3;}
  .agenda-chip-ahora{display:inline-block;font-family:var(--font-mono,monospace);font-size:14px;font-weight:800;
    text-transform:uppercase;letter-spacing:.04em;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;
    background:#0F1923;border-radius:20px;padding:3px 11px;margin-left:9px;vertical-align:middle;}
  .agenda-acciones{display:flex;gap:8px;flex-wrap:wrap;}
  .agenda-mini{min-height:36px;padding:6px 12px;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;}
  .agenda-mini.google{background:#0057B8;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;}
  .agenda-mini.ics{background:#00A651;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;}
  .agenda-mini.cancelar{background:#E8112D;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;}
  .agenda-vacio{padding:28px 16px;text-align:center;color:#1A1A1A !important;-webkit-text-fill-color:#1A1A1A !important;font-weight:600;}
  `;
  document.head.appendChild(css);

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  function fechaHoraLocal(fecha, hora) {
    // fecha "YYYY-MM-DD", hora "HH:MM" -> Date en hora LOCAL del dispositivo.
    var partes = fecha.split("-").map(Number);
    var horaPartes = hora.split(":").map(Number);
    return new Date(partes[0], partes[1] - 1, partes[2], horaPartes[0], horaPartes[1]);
  }

  function aUTCCompacto(d) {
    // Formato requerido por Google Calendar / ICS: YYYYMMDDTHHMMSSZ
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  }

  function linkGoogleCalendar(cita) {
    var inicio = fechaHoraLocal(cita.fecha, cita.hora);
    var fin = new Date(inicio.getTime() + cita.duracionMin * 60000);
    var params = new URLSearchParams({
      action: "TEMPLATE",
      text: "Cita: " + cita.paciente,
      dates: aUTCCompacto(inicio) + "/" + aUTCCompacto(fin),
      details: cita.motivo || "",
    });
    return "https://calendar.google.com/calendar/render?" + params.toString();
  }

  function descargarICS(cita) {
    var inicio = fechaHoraLocal(cita.fecha, cita.hora);
    var fin = new Date(inicio.getTime() + cita.duracionMin * 60000);
    var ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//consultorio-123//Agenda//ES", "BEGIN:VEVENT",
      "UID:" + cita.id + "@consultorio-123", "DTSTAMP:" + aUTCCompacto(new Date()),
      "DTSTART:" + aUTCCompacto(inicio), "DTEND:" + aUTCCompacto(fin),
      "SUMMARY:Cita: " + cita.paciente, "DESCRIPTION:" + (cita.motivo || ""),
      "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n");
    var blob = new Blob([ics], { type: "text/calendar" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "cita-" + cita.paciente.replace(/[^a-z0-9]+/gi, "-") + ".ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }

  mount.innerHTML =
    '<div class="agenda-card"><h3>Agendar cita</h3><form id="agenda-form">' +
    '<div class="agenda-fg"><label>Paciente</label><input name="paciente" required></div>' +
    '<div class="agenda-fg"><label>Motivo (breve)</label><input name="motivo" placeholder="Control, consulta, revisión..."></div>' +
    '<div class="agenda-fg"><label>Fecha</label><input name="fecha" type="date" required></div>' +
    '<div class="agenda-fg"><label>Hora</label><input name="hora" type="time" required></div>' +
    '<div class="agenda-fg"><label>Duración (minutos)</label><input name="duracionMin" type="number" step="5" min="5" value="30"></div>' +
    '<button type="submit" class="agenda-btn">Agendar</button>' +
    "</form></div>" +
    '<div class="agenda-card"><h3>Próximas citas</h3><p style="font-size:13px;color:#7A3C00;margin:-6px 0 14px">💡 Nota: esto coordina la agenda del consultorio. El historial clínico del paciente vive en el sistema que tu clínica ya use — aquí no se guardan notas médicas.</p><div id="agenda-lista"></div></div>';

  document.getElementById("agenda-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = new FormData(e.target);
    window.AMG.Agenda.agendar({
      paciente: f.get("paciente"), motivo: f.get("motivo"), fecha: f.get("fecha"),
      hora: f.get("hora"), duracionMin: f.get("duracionMin")
    }).then(function () { e.target.reset(); renderLista(); });
  });

  function renderLista() {
    window.AMG.Agenda.listar().then(function (citas) {
      var el = document.getElementById("agenda-lista");
      if (!citas.length) { el.innerHTML = '<div class="agenda-vacio">Todavía no hay citas agendadas.</div>'; return; }
      var ahora = new Date();
      el.innerHTML = citas.map(function (c) {
        // ¿esta cita esta ocurriendo ahora mismo? (entre su hora de inicio y su fin)
        var enCurso = false;
        try {
          var ini = fechaHoraLocal(c.fecha, c.hora);
          var fin = new Date(ini.getTime() + (c.duracionMin || 30) * 60000);
          enCurso = ahora >= ini && ahora < fin;
        } catch (_) { enCurso = false; }
        return '<div class="agenda-fila' + (enCurso ? " en-curso" : "") + '">' +
          '<div><div class="quien">' + esc(c.paciente) + (enCurso ? '<span class="agenda-chip-ahora">Ahora</span>' : "") + '</div>' +
          '<div class="cuando">' + esc(c.fecha) + " · " + esc(c.hora) + " (" + c.duracionMin + " min)</div>" +
          (c.motivo ? '<div class="motivo">' + esc(c.motivo) + "</div>" : "") + "</div>" +
          '<div class="agenda-acciones">' +
          '<a class="agenda-mini google" target="_blank" rel="noopener" href="' + linkGoogleCalendar(c) + '">📅 Google</a>' +
          '<button type="button" class="agenda-mini ics" data-ics="' + esc(c.id) + '">⬇️ Outlook/.ics</button>' +
          '<button type="button" class="agenda-mini cancelar" data-cancelar="' + esc(c.id) + '">Cancelar</button>' +
          "</div></div>";
      }).join("");

      citas.forEach(function (c) {
        var btnIcs = el.querySelector('[data-ics="' + c.id + '"]');
        if (btnIcs) btnIcs.addEventListener("click", function () { descargarICS(c); });
      });
      el.querySelectorAll("[data-cancelar]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (!confirm("¿Cancelar esta cita?")) return;
          window.AMG.Agenda.cancelar(btn.getAttribute("data-cancelar")).then(renderLista);
        });
      });
    });
  }

  var pintado = false;
  function montar() {
    if (pintado) return;
    pintado = true;
    renderLista();
  }
  // FIX (JFC 2026-08-20): Agenda dejo de tener boton propio en el nav --
  // ahora vive como pestana dentro de Atenciones (vista-escanear). El tab
  // de Atenciones llama a OCAgendaUI.montar() al hacer click en su tab.
  // Se conserva el listener del boton viejo por si algun link externo o
  // atajo todavia lo busca -- no hace nada malo si el boton no existe.
  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.querySelector('nav button[data-vista="agenda"]');
    if (btn) btn.addEventListener("click", montar);
  });
  window.OCAgendaUI = { montar: montar };
})();
