# PORTAR EL SYNC NUEVO (CRDT/Yjs) A CONSULTORIO-123 — apuntes de JFC (2026-09-10)

JFC pidió portar a consultorio-123 el mismo "sync nuevo" que ya está en
friendly-123 y amigable-123. Aquí quedan los pasos EXACTOS para no re-derivarlo.
Es un cuaderno digital compartido: sincronizar bien todo es crucial.

## QUÉ ES
Un segundo sync redundante, **event-sourcing sobre CRDT (Yjs)**, que corre EN
PARALELO al sync viejo (sync-realtime.js) y **apagado por defecto** detrás del
flag `localStorage["OC_YJS_FASE0"]==="1"`. No cambia NADA hasta que se prenda.

Sincroniza:
- **Entidades** (add-only, nunca pisa): productos, ubicaciones, usuarios/equipo,
  clientes (y promotoras/sucursales si el catalogoPropio las incluye).
- **Ventas/movimientos** (event-sourcing): cada op viaja como evento y se aplica
  UNA sola vez por `OCSync.aplicarOpRemota` (idempotente por opId). Cada aparato
  SALTA sus propios ops por `deviceId` (ya aplicados) — sin eso se DOBLA la plata.
- **Fotos** por hash (opcional; consultorio no tiene perchas, quizá no aplica).

Fuente de verdad del motor: **friendly-123 `docs/sync-yjs.js`** (copiarlo y adaptar).

## SPECIFICS DE CONSULTORIO (ya verificados 2026-09-10)
- `ROOM_KEY = "c123_sync_room"`  (en sync-realtime.js)
- `RELAY_URL = "wss://consultorio123-sync-relay.jfcarpio.workers.dev/sala/"`
- `SALT_FIJO = "amigable-sync-v1"` y `idDeSala` usa `"amigable-sala:"+codigo`
  → IDÉNTICOS a friendly/amigable (la cripto no cambia).
- Shell: `const CACHE = "c123-shell-vNN"` en `docs/sw.js`. **NO hay
  version-manifest.json ni gen-manifest** (a dif. de friendly/amigable): release =
  subir CACHE + `docs/version.json` ("shell") + `bash check-sw.sh` (todo OK).
- `OCSync.aplicarOpRemota` ES idempotente por opId (linchpin de seguridad). ✔
- `OCSyncControl.deviceIdActual` **YA existe** en consultorio (a dif. de amigable,
  donde hubo que agregarlo). ✔  No hace falta tocarlo.
- APIs presentes: OCSyncEmit, catalogoPropio, aplicarOpRemota. ✔

## PASOS (idénticos al port de amigable, PR AMIGABLE#15)
1. **Copiar** `docs/vendor/yjs-bundle.min.js` de friendly a consultorio (idéntico).
2. **Crear** `docs/sync-yjs.js` copiando el de friendly y sustituyendo:
   - `ROOM_KEY`: `"f123_sync_room"` → `"c123_sync_room"`
   - relay: `friendly123-sync-relay` → `consultorio123-sync-relay`
   - prefijos IndexedDB/BroadcastChannel: `f123-yjs` → `cons-yjs`
     (las 3 apps comparten origen en Pages → nombres app-distintos, OBLIGATORIO).
   - Verificar: `grep -c f123 docs/sync-yjs.js` == 0.  `node --check` OK.
3. **idb-fotos.js** (si consultorio lo tiene y quieres fotos): agregar la API por
   hash (guardarPorHash/leerPorHash/tieneHash/hashDeDataUrl/hashesGuardados/
   guardarFotoContenido + store "blobs" + DB a v2). Prefijo blob `c123_fotoblob_`.
   Si consultorio no maneja fotos, se puede OMITIR (el sync-yjs no crashea: sus
   llamadas a OCFotos.* van en try/catch y guards).
4. **sync-realtime.js**: en `OCSyncEmit`, tras construir `op` y antes de enviar,
   agregar: `try { window.dispatchEvent(new CustomEvent("oc-op-local",{detail:op})); } catch(_){}`
   (deviceIdActual ya está, no tocar).
5. **index.html**: agregar `<script src="./sync-yjs.js"></script>` DESPUÉS de
   `sync-realtime.js` (usa OCSyncControl) y de `mock-backend.js` (usa OCSync).
6. **avanzado-extra.js** (o donde esté el panel de sync `oc-sync-panel`): inyectar
   un toggle "Sync nuevo (en prueba)" que prenda/apague `OC_YJS_FASE0` y recargue.
   Ver el bloque autocontenido que se agregó en amigable `docs/avanzado-extra.js`
   (define `window.toggleSyncNuevo`/`pintarSyncNuevoEstado` inline, en español).
7. **sw.js + version.json**: agregar `"./sync-yjs.js"` y
   `"./vendor/yjs-bundle.min.js"` al `SHELL`; subir `CACHE`/`shell` al siguiente
   entero. `bash check-sw.sh` → TODO OK antes de commitear.

## VERIFICACIÓN (headless, como en amigable)
- Flag APAGADO: `window.OCYjs === undefined` (inerte, no rompe nada).
- Flag PRENDIDO + sala puesta + login: `OCYjs._diag().estado === "activo"`,
  sembrado del store real; `OCYjs.opsMap` y `OCYjs.fotosMap` presentes.
- **SEGURIDAD (money-critical):** espiar `OCSync.aplicarOpRemota`; inyectar por el
  `opsDoc` (2º Y.Doc, origin "red") un op remoto (otro deviceId) → se aplica 1 vez
  aunque se re-envíe; un op PROPIO (mismo deviceId) → 0 veces. Ver el test que se
  corrió en friendly/amigable.

## OJO
- Consultorio es de 4 dígitos, foco contable, sin perchas. El valor grande aquí es
  el **event-sourcing de las ventas/asientos** (cuaderno contable compartido).
- Aviso pre-existente en amigable (no del port): "[aislamiento] SIN AISLAMIENTO DE
  IndexedDB" — revisar si consultorio también lo tiene (algo pisa
  window.indexedDB.open tras aislamiento.js). Es aparte del sync.
- NO retirar el sync viejo hasta que el nuevo esté probado en aparatos reales.

Referencia viva: friendly-123 PRs #125–#135, amigable-123 PR #15.
