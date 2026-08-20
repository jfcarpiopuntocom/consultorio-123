/*!
 * edutips.js — consultorio-123
 * ============================================================================
 * QUE ES
 * ----------------------------------------------------------------------------
 * La cajita azul al pie de la vista contable. Un tip corto que ensena a
 * sacarle mas a la app: una funcion que ya esta pagada y nadie usa, un
 * atajo, una forma mas rapida de hacer algo que hoy se hace a mano.
 *
 * ADAPTADO de AMIGABLE (JFC 2026-08-20): AMIGABLE ya tiene 33 tips de
 * "aprovechamiento" (cambio de rumbo del 2026-08-15, de tips FINANCIEROS a
 * tips de USO). consultorio-123 tenia todavia los 7 tips financieros
 * viejos de retail (margen/percha/comision), que no aplican a un
 * consultorio medico. Reemplazados por tips REALES sobre las funciones que
 * consultorio-123 de verdad tiene hoy -- no una traduccion 1:1 de los 33 de
 * AMIGABLE (mas de la mitad de esos son de perchas, codigo de barras,
 * comisiones a promotores o inventario, que no existen aqui). Cuando haya
 * mas contenido curado por JFC, se agrega a este mismo arreglo.
 *
 * REGLA DE COLOR (JFC 2026-07-28) — IMPORTANTE, NO ROMPER
 * ----------------------------------------------------------------------------
 * El azul esta EXCLUIDO de tableros y tarjetas: vive SOLO en "En
 * observacion" y en esta cajita.
 * ============================================================================
 */
(function (global) {
  "use strict";

  var TIPS = {
    es: [
      { t: "Los colores te dicen que hacer",
        c: "No hace falta leer un solo numero para saber como esta tu consultorio. Verde: todo fluye. Ambar: hay un cobro pendiente. Rojo: actua hoy. Un vistazo a Hoy antes de abrir y ya sabes por donde empezar." },
      { t: "Busca como piensas, no por columnas",
        c: "El buscador de Pacientes encuentra por cualquier cosa: nombre, codigo, telefono, un pedazo de palabra. No tienes que recordar en que campo lo escribiste." },
      { t: "Tu equipo entra con su propio PIN",
        c: "Cada persona con su clave no es burocracia: es que el registro de actividad diga quien hizo cada cosa. El dia que un numero no cuadre, la diferencia entre saber y sospechar es esa." },
      { t: "El historial esta sellado",
        c: "Cada movimiento queda encadenado con el anterior. Si alguien edita o borra uno, la cadena se rompe y el control anti fraude lo dice. No impide que pase; te avisa que paso." },
      { t: "Fiado sin intereses, pero con memoria",
        c: "Puedes anotar lo que un paciente te queda debiendo y armar un plan de pagos, con cuotas fijas o con abonos como vayan cayendo. Sin recargos: solo un aviso cuando toca cobrar." },
      { t: "El respaldo es tuyo, no nuestro",
        c: "En Avanzado puedes bajar todo tu consultorio en un archivo y guardarlo donde quieras. Hazlo una vez al mes: son diez segundos y es la diferencia entre un susto y una perdida." },
      { t: "Un equipo, un codigo",
        c: "Con la sincronizacion encendida, lo que registra uno lo ven todos en segundos. Se acaba el mensaje de WhatsApp preguntando si ya cobraron." },
      { t: "El Tablero funciona desde cualquier dispositivo",
        c: "Abre tablero.html en una computadora: si ese dispositivo ya tiene tu consultorio activado, entra solo con tu PIN. Desde otro, tu codigo de consultorio mas tu PIN te dan la misma vista de solo lectura, en pantalla grande." },
      { t: "Exporta lo que tu contador si pueda usar",
        c: "El reporte contable sale en un archivo que abre en Excel. Mandarle eso en vez de fotos de apuntes le ahorra a el horas y a ti la factura de esas horas." },
      { t: "Caja chica tambien es tu dinero",
        c: "El taxi, el cafe, la fotocopia. Anotarlos toma cinco segundos y es la unica forma de que la ganancia del mes sea la de verdad y no la que te gustaria." },
      { t: "El buscador tambien perdona los acentos",
        c: "Escribe Perez o Pérez, con tilde o sin ella: encuentra igual. Esta hecho para teclear rapido con una mano." },
      { t: "Quien esta en el loop",
        c: "En Avanzado ves que dispositivos de tu equipo estan sincronizados y cuales llevan rato sin hablar. El que anda desconectado puede no estar viendo un cobro que ya se registro aqui." },
      { t: "Sin internet tambien funciona",
        c: "La app abre y registra aunque se caiga la conexion. Cuando vuelve, se pone al dia sola con el resto del equipo. No pierdes un cobro por el wifi." },
      { t: "Instalala como app",
        c: "Desde el navegador puedes agregarla a la pantalla de inicio. Abre a pantalla completa, arranca mas rapido y deja de ser una pestana que se pierde entre veinte." },
      { t: "Las citas no viven en tu memoria",
        c: "La Agenda anota lo que un paciente reservo y queda. Es lo que evita agendar dos veces el mismo horario o dejar mal a quien ya tenia su cita." },
      { t: "Bloquea los dias que no atiendes",
        c: "En Agenda puedes bloquear dias u horas enteras para que no se agende nada cuando no estas — sin tener que recordarlo cada vez." },
      { t: "El correo de recuperacion no es tramite",
        c: "Es lo unico que te devuelve el acceso si olvidas tu PIN. Registralo en Avanzado hoy, no el dia que lo necesites." },
      { t: "Tu WhatsApp es mas importante que tu correo",
        c: "Un correo rebota o se queda sin leer; un WhatsApp llega. Es por donde te contactamos si algo pasa con tu licencia — por eso se pide desde el primer dia." },
      { t: "Tu codigo de consultorio es casi una llave privada",
        c: "Quien lo tenga entra a la sala de tu consultorio. Anotalo en un lugar seguro, compartelo solo con tu equipo, y si se filtra puedes cambiarlo desde Avanzado." },
      { t: "Contabilidad, en pestanas, sin tecnicismos",
        c: "Ingresos, gastos, cuentas por cobrar y resultados viven cada uno en su propia pestana dentro de Contabilidad. No necesitas formacion contable para leerlas." },
      { t: "La app se reporta sola cuando falla",
        c: "Si algo se rompe, nos llega el dato tecnico y nada mas: ni un paciente, ni un monto, ni una cifra tuya. Casi siempre lo arreglamos antes de que alcances a escribir." },
    ],
    en: [
      { t: "The colors tell you what to do",
        c: "You don't need to read a single number to know how your practice is doing. Green: everything's flowing. Amber: a payment is pending. Red: act today. One glance at Today before you open and you know where to start." },
      { t: "Search how you think, not by column",
        c: "The Patients search finds by anything: name, code, phone, part of a word. No need to remember which field you typed it in." },
      { t: "Your team logs in with their own PIN",
        c: "Everyone having their own code isn't bureaucracy — it's what makes the activity log say who did what. The day a number doesn't add up, that's the difference between knowing and suspecting." },
      { t: "The history is sealed",
        c: "Every movement is chained to the one before it. If someone edits or deletes one, the chain breaks and the anti-fraud check flags it. It doesn't stop it from happening — it tells you it did." },
      { t: "Patient credit without interest, but with memory",
        c: "You can log what a patient owes you and set up a payment plan — fixed installments or payments as they come in. No fees, just a reminder when it's due." },
      { t: "The backup is yours, not ours",
        c: "Under Advanced you can download your whole practice into a file and keep it wherever you want. Do it once a month: ten seconds, and it's the difference between a scare and a real loss." },
      { t: "One team, one code",
        c: "With sync on, whatever one person logs, everyone sees within seconds. No more WhatsApp messages asking if the payment came in." },
      { t: "The Dashboard works from any device",
        c: "Open tablero.html on a computer: if that device already has your practice active, it opens with just your PIN. From another device, your practice code plus your PIN gets you the same read-only view, on a big screen." },
      { t: "Export what your accountant can actually use",
        c: "The accounting report comes out as a file that opens in Excel. Sending that instead of photos of notes saves them hours, and saves you the bill for those hours." },
      { t: "Petty cash is still your money",
        c: "The taxi, the coffee, the photocopy. Logging it takes five seconds and it's the only way this month's profit is the real one, not the one you'd like it to be." },
      { t: "The search bar forgives accents too",
        c: "Type Perez or Pérez, with or without an accent: same result either way. Built for typing fast with one hand." },
      { t: "Who's in the loop",
        c: "Under Advanced you can see which of your team's devices are synced and which haven't spoken in a while. The one that's disconnected might not be seeing a payment that's already logged here." },
      { t: "It also works without internet",
        c: "The app opens and logs entries even if the connection drops. When it's back, it catches up with the rest of the team on its own. You never lose a payment to wifi." },
      { t: "Install it as an app",
        c: "From the browser you can add it to your home screen. It opens full-screen, starts faster, and stops being one tab lost among twenty." },
      { t: "Appointments don't live in your memory",
        c: "The Agenda logs what a patient booked and keeps it. That's what stops you from double-booking the same slot or letting down someone who already had a time set." },
      { t: "Block the days you don't attend",
        c: "In Agenda you can block whole days or hours so nothing gets scheduled when you're not there — without having to remember it every time." },
      { t: "The recovery email isn't paperwork",
        c: "It's the only thing that gets your access back if you forget your PIN. Set it up under Advanced today, not the day you need it." },
      { t: "Your WhatsApp matters more than your email",
        c: "An email bounces or goes unread; a WhatsApp gets through. It's how we reach you if something happens with your license — that's why it's asked for from day one." },
      { t: "Your practice code is almost a private key",
        c: "Whoever has it gets into your practice's room. Write it down somewhere safe, share it only with your team, and if it leaks you can rotate it from Advanced." },
      { t: "Accounting, in tabs, no jargon",
        c: "Income, expenses, receivables and results each live in their own tab under Accounting. No accounting background required to read them." },
      { t: "The app reports its own crashes",
        c: "If something breaks, we get the technical detail and nothing else — not a patient, not an amount, not a figure of yours. We usually fix it before you can even type a message." },
    ],
  };

  var TIP_PIN = {
    es: { t: "Los PIN de demo siguen puestos",
      c: "Mientras esten los codigos de ejemplo, cualquiera que los haya visto en la landing puede entrar a tu consultorio. Poner los tuyos toma un minuto en Avanzado, y desde ahi cada persona de tu equipo entra con su propia clave: eso es lo que hace que el registro de actividad sirva de algo." },
    en: { t: "The demo PINs are still active",
      c: "As long as the sample codes are there, anyone who saw them on the landing page can get into your practice. Setting your own takes a minute under Advanced, and from there everyone on your team logs in with their own code — that's what makes the activity log actually mean something." },
    pin: true,
  };

  var K_PIN_VISTO = "c123_edutip_pin_visto";
  var CADA_MS = 14 * 86400000;

  function idioma() {
    try { return (global.OCI18n && global.OCI18n.getLang() === "en") ? "en" : "es"; } catch (_) { return "es"; }
  }

  function sigueEnDemo() {
    try {
      var raw = localStorage.getItem("c123_owned");
      if (!raw) return true;
      var o = JSON.parse(raw);
      return !(o && o.licenseCode);
    } catch (_) { return false; }
  }

  function tocaElDePin() {
    if (!sigueEnDemo()) return false;
    try {
      var ultimo = Number(localStorage.getItem(K_PIN_VISTO)) || 0;
      return (Date.now() - ultimo) >= CADA_MS;
    } catch (_) { return false; }
  }

  function diasDesdeEpoca() {
    var d = new Date();
    return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
  }

  function barajaDe(semilla, n) {
    var orden = [], i;
    for (i = 0; i < n; i++) orden.push(i);
    var x = (semilla * 2654435761) % 4294967296;
    for (i = n - 1; i > 0; i--) {
      x = (x * 1103515245 + 12345) % 2147483648;
      var j = x % (i + 1);
      var t = orden[i]; orden[i] = orden[j]; orden[j] = t;
    }
    return orden;
  }

  function tipDeHoy() {
    try {
      var lang = idioma();
      if (tocaElDePin()) return TIP_PIN[lang];
      var arr = TIPS[lang];
      var dia = diasDesdeEpoca();
      var n = arr.length;
      var bloque = Math.floor(dia / n);
      var pos = ((dia % n) + n) % n;
      return arr[barajaDe(bloque + 1, n)[pos]];
    } catch (_) {
      return TIPS[idioma()][0];
    }
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function pintar(mount) {
    if (!mount) return;
    var tip = tipDeHoy();
    if (tip.pin) { try { localStorage.setItem(K_PIN_VISTO, String(Date.now())); } catch (_) {} }
    var eyebrow = idioma() === "en" ? "TO GET MORE OUT OF YOUR APP" : "PARA APROVECHAR MEJOR TU APP";
    mount.innerHTML =
      '<div style="font-size:.82rem;font-weight:700;letter-spacing:.04em;'
      + 'color:#2E6278 !important;-webkit-text-fill-color:#2E6278 !important;'
      + 'margin:0 0 6px;">' + esc(eyebrow) + '</div>'
      + '<div style="font-family:Georgia,serif;font-size:17px;font-weight:700;'
      + 'color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;'
      + 'margin:0 0 6px;">' + esc(tip.t) + '</div>'
      + '<div style="font-size:16px;line-height:1.55;'
      + 'color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;'
      + 'margin:0;">' + esc(tip.c) + '</div>';
  }

  function montar() { pintar(document.getElementById("oc-edutip-contable")); }

  global.OCEdutips = {
    montar: montar, tipDeHoy: tipDeHoy, TIPS: TIPS, TIP_PIN: TIP_PIN,
    _baraja: barajaDe, _sigueEnDemo: sigueEnDemo,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", montar, { once: true });
  } else {
    montar();
  }
  try { global.addEventListener("oc-lang-change", montar); } catch (_) {}
})(typeof window !== "undefined" ? window : this);
