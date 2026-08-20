// idb-fotos.js — fotos de percha en IndexedDB, no en localStorage (JFC 2026-07-18).
//
// POR QUÉ: localStorage tiene un techo practico de ~5-10MB por origen. Cada
// foto de percha (resize a 640px, JPEG 0.8) pesa 200-800KB en base64. Con
// 10-15 perchas con foto, localStorage ya revienta — bug real reportado esta
// sesion: "No se pudo guardar la foto (espacio lleno)". IndexedDB no tiene ese
// techo practico (tipicamente cientos de MB a varios GB) y es async nativo:
// no bloquea el hilo principal como localStorage.setItem() de un blob grande.
//
// COMPATIBILIDAD: IndexedDB es tecnologia baseline (soporte >96% global,
// Chrome 23+/Firefox 10+/Safari 10+ — MDN/caniuse, verificado 2026-07-18). Aun
// asi, TODA funcion de este archivo hace feature-detection y cae de vuelta a
// localStorage si "indexedDB" no existe en window — nunca asume soporte.
//
// CONTRATO: mismo shape de funciones que el getFoto()/FOTO_KEY() que
// reemplaza en vista-perchas.js, para que el swap sea interno — nadie mas
// necesita cambiar. Las lecturas siguen siendo SINCRONAS desde el punto de
// vista de quien llama gracias al cache en memoria de vista-perchas.js (ver
// precargarFotos() ahi); este archivo solo expone la capa de persistencia.
(function () {
  // FIX (JFC 2026-08-20): decia "f123_fotos" -- literal de friendly-123,
  // compartido sin querer por las 3 apps. La nota de 2026-08-18 sigue siendo
  // correcta (renombrar una IndexedDB sin migrar deja los datos invisibles),
  // asi que el rename viene CON migracion: se copian (nunca se borran) las
  // fotos de la base compartida vieja a la nueva, una sola vez.
  const DB_NAME = "c123_fotos";
  const DB_NAME_VIEJA = "f123_fotos";
  const MIGRACION_DB_KEY = "c123_fotos_db_migrada_v1";
  const STORE = "perchas";
  const SOPORTADO = "indexedDB" in window;
  let dbPromise = null;

  function abrirCruda(nombre) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(nombre, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error("IndexedDB bloqueado (otra pestaña con una version vieja abierta)"));
    });
  }

  function migrarDbViejaSiHaceFalta(dbNueva) {
    try { if (localStorage.getItem(MIGRACION_DB_KEY) === "1") return Promise.resolve(); } catch (_) {}
    return abrirCruda(DB_NAME_VIEJA).then((dbVieja) => new Promise((resolve) => {
      try {
        const txLeer = dbVieja.transaction(STORE, "readonly");
        const store = txLeer.objectStore(STORE);
        const out = {};
        const cur = store.openCursor();
        cur.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) { out[cursor.key] = cursor.value; cursor.continue(); return; }
          const claves = Object.keys(out);
          if (!claves.length) { try { localStorage.setItem(MIGRACION_DB_KEY, "1"); } catch (_) {} resolve(); return; }
          const txEscribir = dbNueva.transaction(STORE, "readwrite");
          claves.forEach((k) => { try { txEscribir.objectStore(STORE).put(out[k], k); } catch (_) {} });
          txEscribir.oncomplete = () => {
            try { localStorage.setItem(MIGRACION_DB_KEY, "1"); } catch (_) {}
            try { console.warn("[idb-fotos] migradas " + claves.length + " foto(s) desde la base compartida vieja"); } catch (_) {}
            resolve();
          };
          txEscribir.onerror = () => resolve();
        };
        cur.onerror = () => resolve();
      } catch (_) { resolve(); }
    })).catch(() => { try { localStorage.setItem(MIGRACION_DB_KEY, "1"); } catch (_) {} });
  }

  function abrirDB() {
    if (dbPromise) return dbPromise;
    dbPromise = abrirCruda(DB_NAME).then((db) => migrarDbViejaSiHaceFalta(db).then(() => db));
    return dbPromise;
  }

  // Clave localStorage que usaba el formato viejo (antes de esta migracion) —
  // se mantiene aqui SOLO como fallback si IndexedDB no esta disponible.
  const claveVieja = (id) => "c123_foto_percha_" + id;

  async function guardarFoto(id, dataUrl) {
    if (!SOPORTADO) {
      try { localStorage.setItem(claveVieja(id), dataUrl); return true; }
      catch (_) { return false; }
    }
    try {
      const db = await abrirDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(dataUrl, id);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      return true;
    } catch (err) {
      console.error("[idb-fotos] guardarFoto:", err);
      return false;
    }
  }

  async function leerFoto(id) {
    if (!SOPORTADO) {
      try { return localStorage.getItem(claveVieja(id)); }
      catch (_) { return null; }
    }
    try {
      const db = await abrirDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error("[idb-fotos] leerFoto:", err);
      return null;
    }
  }

  // Lee TODAS las fotos guardadas de una vez — usado por vista-perchas.js para
  // precargar el cache en memoria antes de pintar el grid (evita N lecturas
  // async individuales, una por tarjeta).
  async function leerTodas() {
    if (!SOPORTADO) {
      const out = {};
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.indexOf("c123_foto_percha_") === 0) out[k.slice("c123_foto_percha_".length)] = localStorage.getItem(k);
        }
      } catch (_) {}
      return out;
    }
    try {
      const db = await abrirDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const store = tx.objectStore(STORE);
        const out = {};
        const req = store.openCursor();
        req.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) { out[cursor.key] = cursor.value; cursor.continue(); }
          else resolve(out);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error("[idb-fotos] leerTodas:", err);
      return {};
    }
  }

  async function borrarFoto(id) {
    if (!SOPORTADO) {
      try { localStorage.removeItem(claveVieja(id)); } catch (_) {}
      return;
    }
    try {
      const db = await abrirDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.error("[idb-fotos] borrarFoto:", err);
    }
  }

  // Migracion silenciosa y de una sola vez: copia fotos ya guardadas en el
  // formato viejo (localStorage, f123_foto_percha_*) a IndexedDB y las borra
  // de localStorage. No pierde nada — si algo falla a medio camino, el flag
  // NO se marca y se reintenta en el proximo load (las fotos ya migradas se
  // sobrescriben con el mismo valor, sin duplicar ni corromper).
  async function migrarSiHaceFalta() {
    if (!SOPORTADO) return;
    const FLAG = "c123_fotos_migradas_idb_v1";
    if (localStorage.getItem(FLAG)) return;
    try {
      const claves = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf("c123_foto_percha_") === 0) claves.push(k);
      }
      for (const k of claves) {
        const id = k.slice("c123_foto_percha_".length);
        const dataUrl = localStorage.getItem(k);
        if (dataUrl) {
          const ok = await guardarFoto(id, dataUrl);
          if (ok) localStorage.removeItem(k);
        }
      }
      localStorage.setItem(FLAG, "1");
    } catch (err) {
      console.error("[idb-fotos] migracion (se reintentara en el proximo load):", err);
    }
  }

  window.OCFotos = { guardarFoto, leerFoto, leerTodas, borrarFoto, migrarSiHaceFalta, soportado: () => SOPORTADO };
})();
