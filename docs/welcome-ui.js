// welcome-ui.js — Mensaje de bienvenida para consultorio-123 (JFC 2026-08-20).
// FIX: este archivo era una copia sin adaptar de AMIGABLE (decia "AMIGABLE"
// en su propio comentario de cabecera, "comisiones"/"perchas" que no existen
// aqui, todo en ingles duro sin pasar por i18n, y nunca mostraba la licencia
// del consultorio). Reescrito para consultorio-123: espanol por defecto
// (respeta el switch), lenguaje de consulta medica, y muestra el codigo de
// licencia real leido de c123_owned -- para que nadie salga de la activacion
// sin haberlo visto donde de verdad importa.
//
// Aparece UNA sola vez, tras el primer login exitoso (escucha "oc-login"), y
// marca un flag en localStorage para no repetirse.
//
// Reglas de legibilidad (CLAUDE.md): colores solidos hex, sin opacidad en
// texto, tamanos >=13px, color + -webkit-text-fill-color con !important y
// bloque prefers-color-scheme:dark repetido para que iOS/WhatsApp no oscurezca.
(function () {
  'use strict';

  const FLAG = 'c123_bienvenida_v1';
  const FLAG_CONFIRMADO = 'c123_bienvenida_confirmada';

  function esES() {
    try { return !window.OCI18n || window.OCI18n.getLang() !== 'en'; } catch (_) { return true; }
  }
  function t(k, es, en) {
    try { if (window.t) { const v = window.t(k); if (v && v !== k) return v; } } catch (_) {}
    return esES() ? es : en;
  }
  function licenciaActual() {
    try {
      const ow = JSON.parse(localStorage.getItem('c123_owned') || 'null') || {};
      return ow.licenseCode || ow.syncCode || '';
    } catch (_) { return ''; }
  }

  const css = document.createElement('style');
  css.textContent = `
  .am-welcome-overlay{position:fixed;inset:0;z-index:9997;background:var(--azul-oscuro,#0F1923);
    display:none;align-items:center;justify-content:center;padding:20px;}
  .am-welcome-overlay.abierto{display:flex;}
  .am-welcome-card{background:var(--blanco-calido,#F8F9FB);width:100%;max-width:440px;border-radius:14px;
    border:2px solid var(--sim-plata,#C4CDD8);border-top:4px solid var(--brass,#5294AC);
    padding:30px 24px 26px;text-align:center;box-shadow:0 12px 40px #060d14;max-height:88vh;overflow-y:auto;}
  .am-welcome-overlay .marca{font-family:var(--font-mono,monospace);font-size:14px;font-weight:700;
    letter-spacing:.14em;text-transform:uppercase;color:#2E6278 !important;-webkit-text-fill-color:#2E6278 !important;margin:0 0 6px;}
  .am-welcome-overlay h2{font-family:var(--font-display,sans-serif);font-size:27px;font-weight:700;line-height:1.15;
    color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;margin:0 0 12px;}
  .am-welcome-overlay .tagline{font-family:var(--font-display,sans-serif);font-size:22px;font-weight:700;
    color:#E86040 !important;-webkit-text-fill-color:#E86040 !important;margin:0 0 4px;}
  .am-welcome-overlay .formal{font-family:var(--font-mono,monospace);font-size:14px;
    color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;margin:0 0 18px;}
  .am-welcome-overlay .cuerpo{font-family:var(--font-body,sans-serif);font-size:16px;line-height:1.5;
    color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;margin:0 0 18px;}
  .am-welcome-overlay .licencia-box{background:#FFF6F2;border-left:4px solid #E86040;border-radius:0 8px 8px 0;
    padding:12px 14px;margin:0 0 22px;text-align:left;}
  .am-welcome-overlay .licencia-box .lbl{font-size:13px;font-weight:700;color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;margin:0 0 4px;}
  .am-welcome-overlay .licencia-box .cod{font-family:var(--font-mono,monospace);font-size:17px;letter-spacing:.06em;
    font-weight:700;color:#E86040 !important;-webkit-text-fill-color:#E86040 !important;word-break:break-all;}
  .am-welcome-overlay button{width:100%;min-height:48px;padding:14px;border-radius:9px;border:2px solid var(--brass,#5294AC);
    background:var(--azul-oscuro,#0F1923);color:#F8F9FB !important;-webkit-text-fill-color:#F8F9FB !important;
    font-family:var(--font-display,sans-serif);font-size:16px;font-weight:700;cursor:pointer;}
  .am-welcome-overlay button#am-welcome-guia{background:transparent;border-color:var(--azul-medio,#2E6278);
    color:#2E6278 !important;-webkit-text-fill-color:#2E6278 !important;margin:0 0 10px;}
  @media (prefers-color-scheme: dark){
    .am-welcome-overlay{background:#0F1923;}
    .am-welcome-card{background:#F8F9FB;}
    .am-welcome-overlay .marca, .am-welcome-overlay .formal{color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;}
    .am-welcome-overlay .marca{color:#2E6278 !important;-webkit-text-fill-color:#2E6278 !important;}
    .am-welcome-overlay h2, .am-welcome-overlay .cuerpo{color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;}
    .am-welcome-overlay .tagline{color:#E86040 !important;-webkit-text-fill-color:#E86040 !important;}
    .am-welcome-overlay button{color:#F8F9FB !important;-webkit-text-fill-color:#F8F9FB !important;}
    .am-welcome-overlay button#am-welcome-guia{color:#2E6278 !important;-webkit-text-fill-color:#2E6278 !important;}
    .am-welcome-overlay .licencia-box .lbl{color:#2C3E50 !important;-webkit-text-fill-color:#2C3E50 !important;}
    .am-welcome-overlay .licencia-box .cod{color:#E86040 !important;-webkit-text-fill-color:#E86040 !important;}
  }
  @media (prefers-reduced-motion: no-preference){
    .am-welcome-overlay.abierto .am-welcome-card{animation:amwin .28s ease;}
    @keyframes amwin{from{transform:translateY(14px);}to{transform:translateY(0);}}
  }
  #am-rec-card label{display:flex;align-items:flex-start;gap:10px;text-align:left;font-family:var(--font-body,sans-serif);
    font-size:15px;line-height:1.4;color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;margin:0 0 20px;cursor:pointer;}
  #am-rec-card input[type=checkbox]{width:22px;height:22px;min-width:22px;margin-top:1px;accent-color:var(--brass,#5294AC);}
  .am-welcome-overlay button:disabled{background:#8B95A1;border-color:#8B95A1;color:#F8F9FB !important;-webkit-text-fill-color:#F8F9FB !important;cursor:not-allowed;}
  @media (prefers-color-scheme: dark){
    #am-rec-card label{color:#0F1923 !important;-webkit-text-fill-color:#0F1923 !important;}
  }`;
  document.head.appendChild(css);

  const modal = document.createElement('div');
  modal.id = 'am-welcome';
  modal.className = 'am-welcome-overlay';
  modal.setAttribute('aria-hidden', 'true');
  document.body.appendChild(modal);

  const reminder = document.createElement('div');
  reminder.id = 'am-welcome-reminder';
  reminder.className = 'am-welcome-overlay';
  reminder.setAttribute('aria-hidden', 'true');
  document.body.appendChild(reminder);

  // El contenido se pinta en pintar(), no en un template estatico, porque el
  // idioma y el codigo de licencia pueden no estar listos al parsear el
  // script (i18n.js carga async, la licencia se escribe recien al activar).
  function pintar() {
    const lic = licenciaActual();
    modal.innerHTML = `
      <div id="am-welcome-card" class="am-welcome-card" role="dialog" aria-label="${esES() ? 'Bienvenida' : 'Welcome'}">
        <p class="marca">consultorio-123</p>
        <h2>${t('welcome.title', 'Bienvenido a tu consultorio digital', 'Welcome to your digital practice')}</h2>
        <p class="tagline">${t('welcome.tagline', 'Tu consultorio, en color', 'Your practice, in color')}</p>
        <p class="formal">${t('welcome.formal', 'Ingresos · inventario · cuentas por cobrar · resultados', 'Income · inventory · receivables · results')}</p>
        <p class="cuerpo">${t('welcome.body',
          'No necesitas saber contabilidad para llevar tu consultorio en orden. Tus cifras hablan en colores que se encienden solos cuando hace falta actuar: verde cuando todo fluye, ámbar cuando hay un cobro pendiente, rojo cuando toca actuar hoy. Funciona sin conexión. Tus datos son solo tuyos, sin suscripciones ni anuncios.',
          "You don't need an accounting background to keep your practice in order. Your numbers speak in colors that light up on their own when action is needed: green when everything flows, amber when a payment is pending, red when it's time to act today. Works offline. Your data is yours alone, no subscriptions, no ads.")}</p>
        ${lic ? `
        <div class="licencia-box">
          <p class="lbl">${t('welcome.licenseLabel', 'Tu código de licencia (guárdalo):', 'Your license code (save it):')}</p>
          <p class="cod">${String(lic).replace(/[&<>]/g, '')}</p>
        </div>` : ''}
        <button id="am-welcome-tut" style="width:100%;min-height:46px;margin-bottom:8px;border-radius:8px;border:2px solid #E86040;background:#E86040;color:#FFFFFF !important;-webkit-text-fill-color:#FFFFFF !important;font-size:15px;font-weight:700;cursor:pointer;">${t('welcome.tutBtn', 'Hacer el tutorial guiado', 'Take the guided tutorial')}</button>
        <button id="am-welcome-guia">${t('welcome.guideBtn', 'Ver la guía', 'See the guide')}</button>
        <button id="am-welcome-ok">${t('welcome.okBtn', 'Empezar', 'Get started')}</button>
      </div>`;

    reminder.innerHTML = `
      <div id="am-rec-card" class="am-welcome-card" role="dialog" aria-label="${esES() ? 'Confirma que viste el tutorial' : 'Confirm you watched the tutorial'}">
        <p class="marca">consultorio-123</p>
        <h2>${t('welcome.checkTitle', 'Un momento', 'Quick check')}</h2>
        <p class="cuerpo" style="margin-bottom:16px;">${t('welcome.checkBody', 'Antes de seguir, confirma que ya viste el tutorial de bienvenida. Toma un minuto y es lo que hace que todo lo demás tenga sentido.', "Before you continue, confirm you went through the welcome tutorial. It only takes a minute and it's how everything below will make sense.")}</p>
        <button id="am-rec-ver" style="width:100%;min-height:44px;padding:10px;border-radius:7px;border:2px solid var(--brass,#5294AC);background:transparent;color:var(--azul-medio,#2E6278) !important;-webkit-text-fill-color:var(--azul-medio,#2E6278) !important;font-family:var(--font-display,sans-serif);font-size:15px;font-weight:700;cursor:pointer;margin:0 0 14px;">${t('welcome.seeTutNow', 'Ver el tutorial ahora', 'See the tutorial now')}</button>
        <label><input type="checkbox" id="am-rec-check"> ${t('welcome.checkLabel', 'Sí, ya vi el tutorial de bienvenida', 'Yes, I already went through the welcome tutorial')}</label>
        <button id="am-rec-continuar" disabled>${t('welcome.continueBtn', 'Continuar', 'Continue')}</button>
      </div>`;

    cablear();
  }

  function cerrar() {
    modal.classList.remove('abierto');
    try { localStorage.setItem(FLAG, '1'); } catch (_) {}
  }

  function _amAvisarCargando(cardId) {
    const c = document.getElementById(cardId);
    if (!c || c.querySelector('.am-welcome-err')) return;
    const p = document.createElement('p');
    p.className = 'am-welcome-err';
    p.style.cssText = 'font-size:15px;font-weight:700;line-height:1.4;margin:10px 0 0;color:#B2461F !important;-webkit-text-fill-color:#B2461F !important;';
    p.textContent = t('welcome.stillLoading', 'Todavía está cargando. Dale un momento y toca de nuevo.', 'Still loading. Give it a moment and tap again.');
    c.appendChild(p);
    setTimeout(() => { try { p.remove(); } catch (_) {} }, 4000);
  }

  function cablear() {
    const okBtn = document.getElementById('am-welcome-ok');
    if (okBtn) okBtn.addEventListener('click', cerrar);
    const tutBtn = document.getElementById('am-welcome-tut');
    if (tutBtn) tutBtn.addEventListener('click', () => {
      if (!(window.OCTutorial && window.OCTutorial.iniciar)) { _amAvisarCargando('am-welcome-card'); return; }
      cerrar();
      window.OCTutorial.iniciar();
    });
    const guiaBtn = document.getElementById('am-welcome-guia');
    if (guiaBtn) guiaBtn.addEventListener('click', () => {
      if (!(window.OCHelp && window.OCHelp.abrir)) { _amAvisarCargando('am-welcome-card'); return; }
      cerrar();
      window.OCHelp.abrir();
    });

    const recCheck = document.getElementById('am-rec-check');
    const recBtn = document.getElementById('am-rec-continuar');
    if (recCheck && recBtn) {
      recCheck.addEventListener('change', () => { recBtn.disabled = !recCheck.checked; });
      recBtn.addEventListener('click', () => {
        if (recCheck.checked) {
          try { localStorage.setItem(FLAG_CONFIRMADO, '1'); } catch (_) {}
          reminder.classList.remove('abierto');
        }
      });
    }
    const recVer = document.getElementById('am-rec-ver');
    if (recVer) recVer.addEventListener('click', () => {
      if (!(window.OCTutorial && window.OCTutorial.iniciar)) { _amAvisarCargando('am-rec-card'); return; }
      reminder.classList.remove('abierto');
      window.OCTutorial.iniciar();
    });
  }
  modal.addEventListener('click', (e) => { if (e.target === modal) cerrar(); });

  function quizasMostrar() {
    let visto = false, confirmado = false;
    try { visto = localStorage.getItem(FLAG) === '1'; } catch (_) {}
    try { confirmado = localStorage.getItem(FLAG_CONFIRMADO) === '1'; } catch (_) {}
    pintar();
    if (!visto) { modal.classList.add('abierto'); return; }
    if (!confirmado) reminder.classList.add('abierto');
  }

  window.OCWelcome = { abrir: () => { pintar(); modal.classList.add('abierto'); } };

  window.addEventListener('oc-login', (e) => {
    if (!e.detail || e.detail.rol !== 'dueno' || e.detail.demo) return;
    const gate = document.getElementById('oc-gate');
    if (gate && gate.style.display !== 'none') return;
    quizasMostrar();
  });
})();
