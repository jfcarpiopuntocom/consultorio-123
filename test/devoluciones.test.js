// devoluciones.test.js — SKIPPED en consultorio-123.
//
// Este test es legado del fork de friendly-123: prueba anulación de venta
// sobre un backend Node (db.js/data.js/loyverse.js) con perchas, productos y
// promotores. Consultorio-123 NO lleva perchas ni productos ni promotores
// (ver DIRECCION-PRODUCTO-2026-08-18.md y CLAUDE.md): su modelo son
// pacientes, atenciones y cuentas por cobrar, y corre 100% en el navegador
// contra IndexedDB / mock-backend.js — sin backend Node.
//
// El test se deja como skip explicito (JFC 2026-08-19, caza) para que:
//   1) `npm test` deje verde, sin errores de "MODULE_NOT_FOUND: ./loyverse".
//   2) La razón quede escrita en el archivo, no en la memoria de nadie.
//
// Si algún día consultorio adopta un backend Node propio, este archivo se
// borra completo y se escriben tests contra ESE backend, no contra el fork
// muerto de friendly.

const { test } = require("node:test");

test("legacy: devoluciones sobre perchas — no aplica a consultorio-123", { skip: true }, () => {});
