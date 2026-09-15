# PLAN (trazo grande) — Fases 3-4 de sync en consultorio (JFC 2026-09-08)

Fases 1-2 YA portadas (failsafes + team licence) y las bases del sistema de
versión también (ver NOTA-bases-sistema-version). Faltan las Fases 3-4, que son
más grandes y arriesgadas — se hacen en tanda propia, con calma, NO al final de
una sesión larga (evitar "desperfectos").

## Fase 4 — sync-watchdog.js (la MENOS riesgosa; hacer primero)
- Portar `docs/sync-watchdog.js` desde friendly-123 (redundancia de sync:
  snapshot local, consistencia, snapshot entre pares).
- Adaptación c123: renombrar TODAS las claves `f123_*` → `c123_*`; verificar que
  las funciones que llama de `sync-realtime.js`/`mock-backend.js` existan en
  consultorio (el modelo es paciente, no percha — revisar nombres).
- Wiring: agregar el `<script src="./sync-watchdog.js">` a index.html Y al SHELL
  de sw.js; bump de shell + `node scripts/gen-manifest.js`; compuerta.
- Harness: portar `harness-watchdog.cjs` si aplica.

## Fase 3 — checkpoint + bitácora cifrada en el relay (Cloudflare worker) — RIESGOSA
- Toca el WORKER en vivo (relay zero-knowledge). NO improvisar.
- Requiere: acceso al repo/dir del worker (cloudflare-worker/), entender el
  contrato actual del relay, y probar end-to-end con DOS aparatos ANTES de subir.
- Mantener el LÍMITE SIN-NUBE: el relay no guarda estado de tiendas; checkpoint y
  bitácora van CIFRADOS (zero-knowledge), solo huellas, nunca contenido (REGLA 8).
- Hacer en sesión dedicada, con snapshot del worker y rollback listo.

## Orden sugerido
1) Fase 4 (watchdog, additivo, en el repo). 2) Fase 3 (worker, sesión aparte).

---

## RESOLUCIÓN Fase 3 (JFC 2026-09-08, sesión dedicada)

Decisión de JFC: **los pacientes NO viajan** entre aparatos (se quedan locales).

Con eso, la Fase 3 queda EFECTIVAMENTE CUMPLIDA sin tocar el worker ni el
WebSocket en vivo:

- **Capability A (snapshot local en IndexedDB)** — VIVA (v1.3.4/v52). Respaldo
  durable local que SÍ incluye pacientes (nunca sale del aparato).
- **Recuperación entre pares SIN pacientes** — YA EXISTÍA: `pedirCatalogo()` →
  `responderCatalogo()` envía `catalogoPropio()` COMPLETO (catálogo+equipo+PINs+
  config, chunked), que por diseño excluye pacientes. El watchdog (Capability B)
  lo dispara. Construir la Capability C del watchdog sería DUPLICAR esto bajo
  otro nombre → riesgo en el sync vivo, cero ganancia. NO hacerlo.
- **El relay NO necesita cambios ni deploy**: es un broadcast puro zero-knowledge
  (57 líneas, sin storage). No hay "checkpoint guardado en el relay" que portar.
- **Pacientes**: respaldo local (Capability A) + export. Si en el futuro se
  decide que viajen (cifrados E2E), es otra decisión de producto (ver la pregunta
  de esta sesión).

CONCLUSIÓN: no queda código de Fase 3 seguro y no-redundante por hacer. La
redundancia buscada (que el fallo sea virtualmente imposible) está cubierta.
