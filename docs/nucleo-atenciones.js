/*!
 * nucleo-atenciones.js — Consultorio-123 · Registro de atenciones
 * ============================================================================
 * POR QUE EXISTE (Manuel L., 2026-08-11): "la inmensa mayoria de medicos que
 * tienen consultorio no venden en si productos a los pacientes, sus ingresos
 * son consultas, cirugias menores en el consultorio, etc. No le veo sentido
 * agregar inventarios de productos que se vendan y debas colocar costo y
 * precio."
 *
 * La vista Atenciones (id historico "vista-escanear") era la cuadricula de
 * vender del retail: tocar un producto = una unidad menos de stock, con costo
 * y precio. Para un consultorio eso es el modelo equivocado. Lo que se cobra
 * es un SERVICIO, que no tiene stock, no tiene costo unitario y no se agota.
 *
 * QUE HACE ESTO: monta arriba de esa vista un tarifario de servicios. Tocar un
 * servicio registra un ingreso real via AMG.Ingresos, que es el mismo modulo
 * que alimenta Contabilidad y el Estado de Resultados. Un solo camino para el
 * dinero: no hay un total de atenciones paralelo que pueda desincronizarse.
 *
 * QUE NO HACE: no toca ni oculta la cuadricula de productos que ya estaba
 * abajo. JFC fue explicito ("no duermas NADA"). El consultorio que si vende
 * algo (lentes, ortesis, cremas) la sigue teniendo.
 *
 * DONDE VIVE EL DATO: el tarifario es configuracion, no un flujo de hechos, y
 * se guarda como snapshot en localStorage igual que nucleo-inventario.js. Los
 * INGRESOS si son hechos inmutables y viven en hechos.js con cadena de hash.
 * Esa asimetria es a proposito: cambiar el precio de una consulta manana no
 * debe reescribir lo que se cobro ayer.
 * ============================================================================
 */
(function (global) {
  "use strict";

  var LLAVE = "c123_tarifario";

  /* Tarifario de arranque. Son los servicios mas comunes de un consultorio,
     puestos para que la vista no aparezca vacia el primer dia. El medico los
     edita o los borra: no son obligatorios ni tienen nada de especial. */
  var SEMILLA = [
    { id: "s1", nombre: "Consulta primera vez", tarifa: 40 },
    { id: "s2", nombre: "Consulta de control", tarifa: 25 },
    { id: "s3", nombre: "Curacion", tarifa: 20 },
    { id: "s4", nombre: "Procedimiento menor", tarifa: 80 },
    { id: "s5", nombre: "Certificado medico", tarifa: 15 }
  ];

  function leer() {
    try {
      var v = JSON.parse(localStorage.getItem(LLAVE) || "null");
      if (Array.isArray(v) && v.length) return v;
    } catch (_) {}
    return SEMILLA.slice();
  }

  function guardar(lista) {
    try { localStorage.setItem(LLAVE, JSON.stringify(lista)); } catch (_) {}
  }

  function fmt(n) {
    return "$" + (Number(n) || 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  var vista = document.getElementById("vista-escanear");
  if (!vista) return;

  var css = document.createElement("style");
  css.textContent = "" +
    ".at-card{background:#FFFFFF;border-radius:16px;padding:18px 16px;box-shadow:0 4px 10px rgba(0,0,0,.08);margin:0 0 18px;}" +
    ".at-card h3{font-size:17px;font-weight:800;color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;margin:0 0 4px;}" +
    ".at-sub{font-size:15px;line-height:1.5;color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;margin:0 0 14px;}" +
    ".at-grid{display:grid;grid-template-columns:1fr;gap:10px;}" +
    "@media(min-width:520px){.at-grid{grid-template-columns:1fr 1fr;}}" +
    "@media(min-width:860px){.at-grid{grid-template-columns:1fr 1fr 1fr;}}" +
    ".at-serv{display:flex;justify-content:space-between;align-items:center;gap:10px;min-height:56px;" +
      "padding:12px 14px;border:2px solid #E2E8ED;border-radius:12px;background:#F8F9FB;cursor:pointer;text-align:left;}" +
    ".at-serv:hover,.at-serv:focus-visible{border-color:#E86040;outline:none;}" +
    ".at-serv .n{font-size:16px;font-weight:700;color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;}" +
    ".at-serv .t{font-size:16px;font-weight:800;font-family:var(--font-mono,monospace);font-variant-numeric:tabular-nums;" +
      "color:#E86040 !important;-webkit-text-fill-color:#E86040 !important;white-space:nowrap;}" +
    ".at-fg{margin-bottom:12px;}" +
    ".at-fg label{display:block;font-size:14px;font-weight:700;color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;margin-bottom:6px;}" +
    ".at-fg input,.at-fg select{width:100%;min-height:44px;padding:10px 12px;border:2px solid #E2E8ED;border-radius:10px;" +
      "font-size:16px;background:#FFFFFF;color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;}" +
    ".at-btn{min-height:48px;width:100%;padding:12px 20px;border:none;border-radius:12px;background:#E86040;" +
      "color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;font-weight:800;font-size:16px;cursor:pointer;}" +
    ".at-btn.gris{background:#FFFFFF;color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;border:2px solid #E2E8ED;}" +
    ".at-ok{font-size:15px;font-weight:700;color:#00875A !important;-webkit-text-fill-color:#00875A !important;margin:10px 0 0;}" +
    ".at-err{font-size:15px;font-weight:700;color:#B0183E !important;-webkit-text-fill-color:#B0183E !important;margin:10px 0 0;}" +
    ".at-links{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px;}" +
    ".at-mini{min-height:40px;padding:8px 14px;border-radius:10px;border:2px solid #E2E8ED;background:#FFFFFF;" +
      "font-size:14px;font-weight:700;color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;cursor:pointer;}";
  document.head.appendChild(css);

  var caja = document.createElement("section");
  caja.id = "at-panel";
  // FIX (JFC 2026-08-20): vista-escanear ahora tiene tabs internos
  // (Atenciones/Agenda/Insumos). El contenido de este archivo debe caer
  // DENTRO del panel de la pestana Atenciones, no antes de la barra de
  // tabs -- si no, la tarjeta se pintaba arriba de los botones de tab.
  var contenedor = document.getElementById("at-tabpanel-atenciones") || vista;
  contenedor.insertBefore(caja, contenedor.firstChild);

  var editando = false;

  function pintar() {
    var lista = leer();
    if (editando) { pintarEditor(lista); return; }
    caja.innerHTML =
      '<div class="at-card">' +
        '<h3>Registrar una atencion</h3>' +
        '<p class="at-sub">Toca el servicio que acabas de dar. Queda registrado como ingreso y aparece en Contabilidad y en el Estado de resultados.</p>' +
        '<div class="at-grid" id="at-grid"></div>' +
        '<div class="at-links"><button type="button" class="at-mini" id="at-editar">Editar mis tarifas</button></div>' +
        '<div id="at-form"></div>' +
      '</div>';
    var grid = caja.querySelector("#at-grid");
    lista.forEach(function (s) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "at-serv";
      b.innerHTML = '<span class="n"></span><span class="t"></span>';
      b.querySelector(".n").textContent = s.nombre;
      b.querySelector(".t").textContent = fmt(s.tarifa);
      b.addEventListener("click", function () { abrirForm(s); });
      grid.appendChild(b);
    });
    caja.querySelector("#at-editar").addEventListener("click", function () {
      editando = true; pintar();
    });
  }

  function abrirForm(serv) {
    var cont = caja.querySelector("#at-form");
    cont.innerHTML =
      '<div style="border-top:2px solid #E2E8ED;margin-top:16px;padding-top:16px;">' +
        '<div class="at-fg"><label for="at-monto">Cuanto se cobro</label>' +
          '<input id="at-monto" type="number" inputmode="decimal" min="0" step="0.01"></div>' +
        '<div class="at-fg"><label for="at-cuenta">Como se pago</label>' +
          '<select id="at-cuenta">' +
            '<option value="caja_chica">Efectivo (caja chica)</option>' +
            '<option value="bancos">Transferencia o tarjeta (bancos)</option>' +
          '</select></div>' +
        '<div class="at-fg"><label for="at-paciente">Paciente (opcional)</label>' +
          '<input id="at-paciente" type="text" autocomplete="off"></div>' +
        '<button type="button" class="at-btn" id="at-guardar">Registrar atencion</button>' +
        '<p id="at-msg"></p>' +
      '</div>';
    cont.querySelector("#at-monto").value = serv.tarifa;
    var msg = cont.querySelector("#at-msg");
    cont.querySelector("#at-guardar").addEventListener("click", function (ev) {
      var btn = ev.currentTarget;
      if (btn.disabled) return;
      btn.disabled = true;
      setTimeout(function () { btn.disabled = false; }, 900);
      var monto = Number(cont.querySelector("#at-monto").value);
      if (!(monto > 0)) { msg.className = "at-err"; msg.textContent = "El monto debe ser mayor a cero."; return; }
      if (!global.AMG || !global.AMG.Ingresos) {
        msg.className = "at-err"; msg.textContent = "El modulo de ingresos no esta disponible."; return;
      }
      global.AMG.Ingresos.registrar({
        monto: monto,
        cuenta: cont.querySelector("#at-cuenta").value,
        paciente: cont.querySelector("#at-paciente").value,
        concepto: serv.nombre,
        formaPago: cont.querySelector("#at-cuenta").value === "bancos" ? "Transferencia o tarjeta" : "Efectivo"
      }).then(function () {
        msg.className = "at-ok";
        msg.textContent = serv.nombre + " por " + fmt(monto) + ", registrado.";
        setTimeout(function () { cont.innerHTML = ""; }, 2200);
      }).catch(function (e) {
        msg.className = "at-err";
        msg.textContent = (e && e.message) || "No se pudo registrar.";
      });
    });
    cont.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function pintarEditor(lista) {
    var filas = lista.map(function (s, i) {
      return '<div style="display:flex;gap:8px;margin-bottom:10px;">' +
        '<input type="text" data-i="' + i + '" data-c="nombre" value="" style="flex:2;min-height:44px;padding:10px 12px;' +
          'border:2px solid #E2E8ED;border-radius:10px;font-size:16px;color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;">' +
        '<input type="number" data-i="' + i + '" data-c="tarifa" min="0" step="0.01" value="' + Number(s.tarifa) + '" ' +
          'style="flex:1;min-height:44px;padding:10px 12px;border:2px solid #E2E8ED;border-radius:10px;font-size:16px;' +
          'color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;">' +
        '<button type="button" class="at-mini" data-borrar="' + i + '">Quitar</button>' +
      '</div>';
    }).join("");
    caja.innerHTML =
      '<div class="at-card">' +
        '<h3>Mis tarifas</h3>' +
        '<p class="at-sub">Cambiar una tarifa aqui no toca lo que ya cobraste: los ingresos registrados quedan como estaban.</p>' +
        '<div id="at-filas">' + filas + '</div>' +
        '<div class="at-links">' +
          '<button type="button" class="at-mini" id="at-agregar">Agregar servicio</button>' +
          '<button type="button" class="at-mini" id="at-cancelar">Cancelar</button>' +
        '</div>' +
        '<div style="margin-top:12px;"><button type="button" class="at-btn" id="at-guardar-tarifas">Guardar tarifas</button></div>' +
      '</div>';
    // los nombres se asignan por propiedad, nunca por interpolacion en HTML
    caja.querySelectorAll('input[data-c="nombre"]').forEach(function (inp) {
      inp.value = lista[Number(inp.dataset.i)].nombre;
    });
    caja.querySelectorAll("button[data-borrar]").forEach(function (b) {
      b.addEventListener("click", function () {
        var l = recolectar(lista);
        l.splice(Number(b.dataset.borrar), 1);
        guardar(l.length ? l : SEMILLA.slice());
        pintarEditor(leer());
      });
    });
    caja.querySelector("#at-agregar").addEventListener("click", function () {
      var l = recolectar(lista);
      l.push({ id: "s" + Date.now().toString(36), nombre: "Servicio nuevo", tarifa: 0 });
      guardar(l);
      pintarEditor(leer());
    });
    caja.querySelector("#at-cancelar").addEventListener("click", function () {
      editando = false; pintar();
    });
    caja.querySelector("#at-guardar-tarifas").addEventListener("click", function () {
      guardar(recolectar(lista));
      editando = false; pintar();
    });
  }

  function recolectar(lista) {
    var out = lista.map(function (s) { return { id: s.id, nombre: s.nombre, tarifa: s.tarifa }; });
    caja.querySelectorAll("input[data-i]").forEach(function (inp) {
      var i = Number(inp.dataset.i);
      if (!out[i]) return;
      if (inp.dataset.c === "nombre") out[i].nombre = String(inp.value || "").slice(0, 120) || "Servicio";
      else out[i].tarifa = Math.max(0, Number(inp.value) || 0);
    });
    return out;
  }

  pintar();

  global.AMG = global.AMG || {};
  global.AMG.Atenciones = { VERSION: "1.0.0", tarifario: leer, guardarTarifario: guardar };
})(typeof window !== "undefined" ? window : this);
