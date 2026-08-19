// db.js — Persistencia simple en archivo JSON (lowdb).
// Por qué lowdb y no una base de datos pesada: cero dependencias nativas que puedan
// fallar al desplegar, cero configuración de servidor de base de datos, y un archivo
// db.json que se puede respaldar copiándolo. Para un negocio de 1 a 5 perchas
// es más que suficiente y es muy fácil de migrar a Postgres más adelante si crece.

const path = require("path");
const low = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const dbPath = path.join(__dirname, "data", "db.json");
const fs = require("fs");
if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"));
}

const adapter = new FileSync(dbPath);
const db = low(adapter);

// --- Datos semilla (solo se usan la primera vez que arranca el servidor) ---
// consultorio-123 no lleva perchas ni productos ni asociados (esa parte es
// legado del fork de friendly-123 y no aplica al modelo médico — ver
// DIRECCION-PRODUCTO). El seed-data.js correspondiente NO existe en este
// repo y no debería existir. Si algun día vuelve un backend Node para
// consultorio, seed vacío es la base correcta; si el archivo aparece por
// error de port, se respeta pero no se exige. Fix real (JFC 2026-08-19,
// caza): antes hacía crash al hacer `npm start` porque el require duro
// tumbaba db.js sin dejar arrancar el server.
var semilla = { pacientes: [], atenciones: [], movimientos: [], configuracion: {} };
try {
  var extra = require("./seed-data");
  if (extra && typeof extra === "object") {
    Object.keys(extra).forEach(function (k) { semilla[k] = extra[k]; });
  }
} catch (e) {
  if (e && e.code !== "MODULE_NOT_FOUND") throw e;
}

db.defaults(semilla).write();

module.exports = db;
