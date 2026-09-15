# NOTA — Bases del sistema de versión en consultorio (JFC 2026-09-08)

Portado de friendly-123 en "broad strokes" (veloz) para que futuras sesiones
debuggeen y le hagan el proceso JFC. NO está completo a propósito.

## Puesto (bases anti-destrozo)
- `scripts/gen-manifest.js` (genérico) + `docs/version-manifest.json` generado.
- `docs/sw.js`: verificación SRI **fail-open** tras el precache (nunca borra un
  archivo por hash; lo re-pide y si falla conserva el que hay). Shell c123-v50.
- `check-sw.sh`: guard que recomputa los hashes REALES del shell contra el
  manifest → un push con manifest desincronizado falla la compuerta.

## Regla dura (igual que friendly)
Cualquier cambio a un archivo del SHELL exige, ANTES de pushear: subir el CACHE
en sw.js + shell en version.json (mismo número) y `node scripts/gen-manifest.js`.

## PENDIENTE para el proceso JFC (no portado aún)
- #3 fin de mezcla intra-sesión (listener del SW → recarga diferida).
- #4 insignia del shell real en el candado (consultorio no tiene pintarBuildGate).
- #5 piso autoritativo desde version.json (no tiene _recargarSeguroVersion).
- #6 radar de versión en Inspector (consultorio no tiene inspector-ui).
Estos exigen enganches que consultorio aún no tiene; se construyen en la sesión
de 5h con cuidado, no a la ligera.
