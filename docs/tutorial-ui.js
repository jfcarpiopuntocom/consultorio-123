// tutorial-ui.js — INTERACTIVE TUTORIAL for consultorio-123 (JFC 2026-08-20).
// FIX: este archivo era el tutorial de AMIGABLE sin adaptar -- hablaba de
// "perchas", "comisiones a socios", "productos", "escanear codigo de
// barras" y apuntaba a vistas que no existen en consultorio-123
// (inventario, escanear). Reescrito con las vistas reales de esta app
// (Hoy, Agenda, Clientes, Contabilidad, Salas, Avanzado) y lenguaje de
// consulta medica.
// Launch with window.OCTutorial.iniciar().
// Bilingual EN/ES: self-contained dictionary keyed by OCI18n.getLang().
(function () {
  const TXT = {
    en: {
      pasoDe: (a, b) => "Step " + a + " of " + b,
      atras: "Back", sig: "Next", fin: "Got it", salir: "Exit tutorial",
      pasos: [
        { titulo: "Your navigation bar", texto: "From here you move through the whole app. This tutorial walks you through every section — tap Next to move forward." },
        { titulo: "Today: your practice at a glance", texto: "Overall traffic light, today's income and pending payments. If something needs your attention, it shows up here first, in red." },
        { titulo: "Agenda", texto: "Schedule appointments and block days when you're not attending. It keeps your day organized without depending on memory." },
        { titulo: "Patients", texto: "Register patients and see their receivables at a glance: who owes, who has credit. You decide who to trust, with data." },
        { titulo: "Accounting, without the jargon", texto: "Income, expenses, receivables and results — in tabs, in plain language. No accounting background required." },
        { titulo: "Advanced: your vault", texto: "Backups, PIN codes, recovery email, and the accounting report for your accountant. Everything lives on YOUR device — no cloud, no subscriptions." },
      ],
    },
    es: {
      pasoDe: (a, b) => "Paso " + a + " de " + b,
      atras: "Atrás", sig: "Siguiente", fin: "Entendido", salir: "Salir del tutorial",
      pasos: [
        { titulo: "Tu barra de navegación", texto: "Desde aquí te mueves por toda la app. Este tutorial te lleva de la mano por cada sección — usa Siguiente para avanzar." },
        { titulo: "Hoy: tu consultorio de un vistazo", texto: "Semáforo general, ingresos de hoy y cobros pendientes. Si algo necesita tu atención, aparece aquí primero, en rojo." },
        { titulo: "Agenda", texto: "Programa tus citas y bloquea los días que no atiendes. Mantiene tu día ordenado sin depender de la memoria." },
        { titulo: "Pacientes", texto: "Registra pacientes y mira su cuenta pendiente de un vistazo: quién debe, quién tiene crédito a favor. Tú decides a quién fiar, con datos." },
        { titulo: "Contabilidad, sin tecnicismos", texto: "Ingresos, gastos, cuentas por cobrar y resultados — en pestañas, en lenguaje simple. No necesitas formación contable." },
        { titulo: "Avanzado: tu caja fuerte", texto: "Respaldos, claves, correo de recuperación, y el reporte contable para tu contador. Todo vive en TU dispositivo — sin nube, sin suscripciones." },
      ],
    },
  };
  // Vista + selector por paso (mismo orden que TXT.*.pasos). Vistas reales
  // de consultorio-123 (confirmadas contra los data-vista del nav).
  const DESTINOS = [
    { vista: "hoy", sel: "nav" },
    { vista: "hoy", sel: null },
    { vista: "agenda", sel: null },
    { vista: "clientes", sel: "#btnAltaCliente" },
    { vista: "contabilidad", sel: null },
    { vista: "avanzado", sel: null },
  ];

  function idioma() {
    try { return (window.OCI18n && window.OCI18n.getLang() === "es") ? TXT.es : TXT.en; } catch (_) { return TXT.es; }
  }

  let idx = -1;
  let foco = null, tarjeta = null;
  let reposicionar = null;

  function $(s) { return document.querySelector(s); }

  function css() {
    if (document.getElementById("oc-tut-css")) return;
    const st = document.createElement("style");
    st.id = "oc-tut-css";
    st.textContent =
      "#oc-tut-foco{position:fixed;z-index:10060;pointer-events:none;border:3px solid #E86040;border-radius:10px;box-shadow:0 0 0 9999px rgba(15,25,35,.78);transition:all .28s ease;}" +
      "#oc-tut-card{position:fixed;z-index:10061;width:min(340px,calc(100vw - 24px));background:#0F1923;border:2px solid #E86040;border-radius:12px;padding:16px;box-shadow:0 10px 34px #060d14;}" +
      "#oc-tut-card .paso{font-family:var(--font-mono,monospace);font-size:13px;font-weight:700;letter-spacing:.06em;color:#28ECAA !important;-webkit-text-fill-color:#28ECAA !important;margin:0 0 4px;}" +
      "#oc-tut-card h3{font-family:var(--font-display,sans-serif);font-size:19px;font-weight:700;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;margin:0 0 6px;line-height:1.2;}" +
      "#oc-tut-card p{font-size:15px;line-height:1.45;color:#F8F9FB !important;-webkit-text-fill-color:#F8F9FB !important;margin:0 0 12px;}" +
      "#oc-tut-card .fila{display:flex;gap:8px;}" +
      "#oc-tut-card button{min-height:44px;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;touch-action:manipulation;}" +
      "#oc-tut-atras{flex:0 0 auto;padding:0 14px;border:2px solid #5294AC;background:transparent;color:#F8F9FB !important;-webkit-text-fill-color:#F8F9FB !important;}" +
      "#oc-tut-sig{flex:1;border:2px solid #E86040;background:#E86040;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;}" +
      "#oc-tut-salir{width:100%;margin-top:8px;min-height:44px;border:none;background:transparent;color:#CCCCCC !important;-webkit-text-fill-color:#CCCCCC !important;font-size:13px;text-decoration:underline;cursor:pointer;}" +
      "@media (prefers-color-scheme: dark){#oc-tut-card h3{color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;}#oc-tut-card p{color:#F8F9FB !important;-webkit-text-fill-color:#F8F9FB !important;}}";
    document.head.appendChild(st);
  }

  function irAVista(nombre) {
    const b = document.querySelector('nav button[data-vista="' + nombre + '"]');
    if (b) b.click();
    return b;
  }

  function objetivoDe(d) {
    let el = d.sel ? $(d.sel) : null;
    if (!el) el = $('main .vista.activa') || $('[id^="vista-"].activa') || $('#vista-' + d.vista) || $('#' + d.vista);
    if (!el) el = document.querySelector('nav button[data-vista="' + d.vista + '"]');
    if (!el) el = $("nav");
    return el;
  }

  function pintar(intento) {
    intento = intento || 0;
    const L = idioma();
    const d = DESTINOS[idx];
    const txt = L.pasos[idx];
    const el = objetivoDe(d);
    if (!el) return;
    try { el.scrollIntoView({ block: "center", behavior: "instant" }); } catch (_) {}
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0 && intento < 10) {
      setTimeout(() => { if (idx >= 0) pintar(intento + 1); }, 150);
      return;
    }
    const pad = 6;
    foco.style.left = Math.max(4, r.left - pad) + "px";
    foco.style.top = Math.max(4, r.top - pad) + "px";
    foco.style.width = Math.min(window.innerWidth - 8, r.width + pad * 2) + "px";
    foco.style.height = Math.min(window.innerHeight - 8, r.height + pad * 2) + "px";
    tarjeta.querySelector(".paso").textContent = L.pasoDe(idx + 1, DESTINOS.length);
    tarjeta.querySelector("h3").textContent = txt.titulo;
    tarjeta.querySelector(".cuerpo").textContent = txt.texto;
    const bAtras = document.getElementById("oc-tut-atras");
    bAtras.style.display = idx === 0 ? "none" : "";
    bAtras.textContent = L.atras;
    document.getElementById("oc-tut-sig").textContent = idx === DESTINOS.length - 1 ? L.fin : L.sig;
    document.getElementById("oc-tut-salir").textContent = L.salir;
    const ch = tarjeta.offsetHeight || 190;
    let top = r.bottom + pad + 12;
    if (top + ch > window.innerHeight - 10) top = Math.max(10, r.top - pad - ch - 12);
    let left = Math.min(Math.max(12, r.left), window.innerWidth - (tarjeta.offsetWidth || 340) - 12);
    tarjeta.style.top = top + "px";
    tarjeta.style.left = left + "px";
  }

  function paso(n) {
    idx = Math.max(0, n);
    if (idx >= DESTINOS.length) return terminar();
    irAVista(DESTINOS[idx].vista);
    setTimeout(pintar, 620);
    setTimeout(() => { if (idx === n) pintar(); }, 900);
  }

  function terminar() {
    cerrar();
    irAVista("hoy");
  }

  function cerrar() {
    if (foco) { foco.remove(); foco = null; }
    if (tarjeta) { tarjeta.remove(); tarjeta = null; }
    if (reposicionar) {
      window.removeEventListener("resize", reposicionar);
      window.removeEventListener("scroll", reposicionar, true);
      reposicionar = null;
    }
    idx = -1;
  }

  function iniciar() {
    if (foco) cerrar();
    css();
    foco = document.createElement("div"); foco.id = "oc-tut-foco";
    tarjeta = document.createElement("div"); tarjeta.id = "oc-tut-card";
    tarjeta.innerHTML =
      '<p class="paso"></p><h3></h3><p class="cuerpo"></p>' +
      '<div class="fila"><button id="oc-tut-atras"></button><button id="oc-tut-sig"></button></div>' +
      '<button id="oc-tut-salir"></button>';
    document.body.appendChild(foco);
    document.body.appendChild(tarjeta);
    tarjeta.querySelector("#oc-tut-sig").addEventListener("click", () => paso(idx + 1));
    tarjeta.querySelector("#oc-tut-atras").addEventListener("click", () => paso(idx - 1));
    tarjeta.querySelector("#oc-tut-salir").addEventListener("click", cerrar);
    reposicionar = () => { if (idx >= 0) pintar(); };
    window.addEventListener("resize", reposicionar);
    window.addEventListener("scroll", reposicionar, true);
    paso(0);
  }

  window.OCTutorial = { iniciar: iniciar, cerrar: cerrar };
})();
