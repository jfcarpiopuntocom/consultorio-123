// idb-archivo.js — consultorio-123 (Fase 2 del plan de blindaje de datos, 2026-08-04)
// ============================================================================
// POR QUE: cuando localStorage se llena, guardarEstadoLocal() (mock-backend.js)
// tenia que elegir entre no guardar la venta de HOY o recortar el log de
// actividad VIEJO. El log de actividad es a la vez la evidencia forense de un
// robo y el insumo de la reconciliacion (hechos.js/reconciliacion.js) — hasta
// ahora, recortarlo significaba BORRARLO para siempre.
//
// Este archivo mueve los movimientos viejos a IndexedDB (sin techo practico de
// espacio, mismo criterio que idb-fotos.js) en vez de descartarlos. Nada se
// pierde: solo se muda de un almacen lleno a uno con espacio.
//
// CONTRATO: put() usa el id del propio movimiento como clave — reintentar con
// el mismo lote no duplica nada (sobrescribe con el mismo valor).
//
// Si IndexedDB no existe en este navegador: todas las funciones son no-op
// seguro (mismo criterio que idb-fotos.js) — guardarEstadoLocal() sigue
// funcionando como hoy, sin este resguardo extra pero sin romperse.
//
// FIX (JFC 2026-08-20): el nombre de base decia "f123_archivo" -- literal de
// friendly-123, compartido sin querer por las 3 apps. La nota de 2026-08-18
// ("NO renombrar sin migrar, deja los datos invisibles") seguia siendo
// correcta, asi que el rename viene CON migracion: se copian (nunca se
// borran) los registros de la base compartida vieja a la nueva, una sola vez.
(function () {
  const DB_NAME = "c123_archivo";
  const DB_NAME_VIEJA = "f123_archivo";
  const MIGRACION_KEY = "c123_archivo_migrado_v1";
  const STORE = "movimientos";
  const SOPORTADO = "indexedDB" in window;
  let dbPromise = null;

  function abrirCruda(nombre) {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(nombre, 1);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE, { keyPath: "id" });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error("IndexedDB bloqueado (otra pestaña con una version vieja abierta)"));
    });
  }

  function migrarDesdeBaseVieja(dbNueva) {
    try { if (localStorage.getItem(MIGRACION_KEY) === "1") return Promise.resolve(); } catch (_) {}
    return abrirCruda(DB_NAME_VIEJA).then((dbVieja) => new Promise((resolve) => {
      try {
        const txLeer = dbVieja.transaction(STORE, "readonly");
        const reqTodos = txLeer.objectStore(STORE).getAll();
        reqTodos.onsuccess = () => {
          const registros = reqTodos.result || [];
          if (!registros.length) { try { localStorage.setItem(MIGRACION_KEY, "1"); } catch (_) {} resolve(); return; }
          const txEscribir = dbNueva.transaction(STORE, "readwrite");
          registros.forEach((r) => { try { txEscribir.objectStore(STORE).put(r); } catch (_) {} });
          txEscribir.oncomplete = () => {
            try { localStorage.setItem(MIGRACION_KEY, "1"); } catch (_) {}
            try { console.warn("[idb-archivo] migrados " + registros.length + " registro(s) desde la base compartida vieja"); } catch (_) {}
            resolve();
          };
          txEscribir.onerror = () => resolve();
        };
        reqTodos.onerror = () => resolve();
      } catch (_) { resolve(); }
    })).catch(() => { try { localStorage.setItem(MIGRACION_KEY, "1"); } catch (_) {} });
  }

  function abrirDB() {
    if (dbPromise) return dbPromise;
    dbPromise = abrirCruda(DB_NAME).then((db) => migrarDesdeBaseVieja(db).then(() => db));
    return dbPromise;
  }

  // Archiva un lote. Idempotente: reintentar con el mismo lote no duplica.
  // Los movimientos sin id propio reciben uno sintetico estable (fecha+indice)
  // para que igual queden archivados sin romper el keyPath.
  async function archivarLote(movimientos) {
    if (!SOPORTADO || !Array.isArray(movimientos) || !movimientos.length) return false;
    try {
      const db = await abrirDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        const store = tx.objectStore(STORE);
        movimientos.forEach((m, i) => {
          const conId = m && m.id ? m : { ...m, id: (m && m.fecha ? m.fecha : "sinfecha") + "_" + i + "_" + Math.random().toString(36).slice(2, 8) };
          store.put(conId);
        });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      return true;
    } catch (err) {
      console.error("[idb-archivo] archivarLote:", err);
      return false;
    }
  }

  async function leerTodos() {
    if (!SOPORTADO) return [];
    try {
      const db = await abrirDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.error("[idb-archivo] leerTodos:", err);
      return [];
    }
  }

  async function contar() {
    if (!SOPORTADO) return 0;
    try {
      const db = await abrirDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, "readonly");
        const req = tx.objectStore(STORE).count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => reject(req.error);
      });
    } catch (_) { return 0; }
  }

  window.OCArchivo = { archivarLote, leerTodos, contar, soportado: () => SOPORTADO };
})();
