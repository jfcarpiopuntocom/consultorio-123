# Plan — los 5 bugs de la caza post-produccion (2026-08-19)

**Fecha:** 2026-08-19 · **Estado:** propuesto, SIN ejecutar (a proposito — JFC
pidio pescar y documentar, no arreglar todavia).
**Contexto:** consultorio-123 acaba de salir a produccion hoy mismo, con Diego
Ortuño como socio nuevo del proyecto. friendly-123 y amigable-123 ya estaban en
produccion desde antes. Cualquier cambio de aqui en adelante es sobre datos
reales: cautela maxima, cero atajos.

---

## Los 5, en una tabla

| # | Bug | Repo | Severidad | Arreglado ya? |
|---|---|---|---|---|
| 1 | El merge de "sync real" opera sobre datos vestigiales, no sobre el negocio real | consultorio-123 | **Critico** | No |
| 2 | `f123_owned` vs `c123_owned` — la activacion escribe en una isla que nada mas lee | consultorio-123 | **Critico** | No |
| 3 | `wrangler.toml` apuntaba al Worker y la KV de friendly-123 | consultorio-123 | **Critico** | **SI, en vivo, mismo dia** |
| 4 | El service worker puede precachear un archivo viejo aunque el CACHE suba de numero | Los 3 repos (patron compartido) | Medio | No |
| 5 | El boton "Merge inventory" quedo en ingles fijo, sin pasar por `window.t()` | friendly-123 | Bajo | No |

---

## Bug 1 — El merge opera sobre el dominio equivocado (CRITICO)

**Donde:** `docs/mock-backend.js` (`compararCatalogo`/`aplicarCatalogo`,
agregados hoy), `docs/avanzado-extra.js` (boton "Juntar datos con mi equipo").

**Como se encontro (barato, sin leer archivos grandes):**

```bash
grep -n "gastosMensuales *=" docs/mock-backend.js
#  const gastosMensuales = {"smokeshop":0,"bookshelf":0,"fairbooth":0};
grep -n "^\s*var \|^\s*let \|^\s*const " docs/nucleo-cxc.js | head -8
#  var TIPOS = { cargo: "cxc_cargo", abono: "cxc_abono" };
#  ...trabaja con pacienteId, no con productoId ni ubicacionId.
```

**El problema:** el mecanismo de "sync real" que se envio a produccion hoy
—huella del catalogo, comparacion, boton de merge— fue portado literalmente
de friendly-123/amigable-123, donde SI describe el negocio real (perchas y
productos de una tienda). En consultorio-123 opera sobre las MISMAS
estructuras (`productos`, `ubicaciones`), pero esas son **datos de demo
vestigiales heredados del clon inicial** — los ids de ubicacion siguen siendo
literalmente `smokeshop`/`bookshelf`/`fairbooth`, los mismos nombres de la
demo de friendly-123.

El dato real del negocio de consultorio-123 —pacientes, cargos y abonos de
cuentas por cobrar— vive en un modelo **completamente distinto**: eventos
("hechos") agrupados por `pacienteId`, segun `nucleo-cxc.js`. Ese modelo no
tiene ni catalogo ni huella ni merge.

**Consecuencia practica:** el boton "Juntar datos con mi equipo" que Diego y
JFC van a ver en Avanzado promete resolver la sincronizacion, y en la
practica SOLO puede juntar productos y ubicaciones de demo que a nadie le
importan. Los pacientes y las cuentas por cobrar —lo que de verdad se
necesita sincronizar entre el celular y la laptop del consultorio— siguen
sin ningun mecanismo de merge. Es una falsa sensacion de "ya funciona".

**Que hay que decidir antes de tocar codigo (no es solo tecnico):**
- Si `pacientes` va a vivir como un array propio (como `clientes` en las
  otras apps) o va a seguir siendo 100% derivado de `hechos`.
- Si el merge de un paciente puede fusionar identidad (nombre/telefono) con
  la misma jerarquia dueño>admin>encargado, o si en un consultorio la
  jerarquia real es otra (medico > asistente?).
- Que pasa con los CARGOS Y ABONOS del CxC al mergear: la nota de hoy
  (`PARA-CONSULTORIO-123-2026-08-19.md`) ya es clara — **NUNCA se auto-mergean
  montos de dinero**. Un cargo o abono duplicado o perdido es plata real de un
  paciente. Eso se queda igual en el plan.

---

## Bug 2 — `f123_owned` vs `c123_owned`: la activacion escribe en una isla (CRITICO)

**Como se encontro:**

```bash
grep -n 'setItem("f123_owned"\|setItem("c123_owned"' docs/auth-ui.js docs/avanzado-extra.js
#  auth-ui.js:175   setItem("f123_owned", ...)
#  auth-ui.js:774   setItem("f123_owned", ...)   <- el que se agrego HOY (rescate de licencia)
#  avanzado-extra.js:2256   setItem("c123_owned", ...)

grep -rln 'getItem("c123_owned")' docs/*.js
#  avanzado-extra.js backup-scheduler.js crypto-store.js
#  identity-context.js mock-backend.js reconciliacion.js
```

**El problema:** `auth-ui.js` —el archivo de la activacion, incluido el
arreglo de HOY que hace que por fin se guarde `licenseCode`— escribe **solo**
en la clave `f123_owned`. Todo lo demas en la app —el backend
(`mock-backend.js`), el log de auditoria (`identity-context.js`), el
recordatorio de respaldo (`backup-scheduler.js`), la correlacion de PIN
(`crypto-store.js`), la conciliacion (`reconciliacion.js`), e incluso las
OTRAS lecturas dentro del propio `avanzado-extra.js`— leen de `c123_owned`.

Son dos claves de `localStorage` **distintas**. `aislamiento.js` las
namespacea cada una por separado (confirmado: no hay unificacion), asi que no
es un problema cosmetico de nombre — son dos registros que nunca se hablan.

**Consecuencia practica:** el login/activacion "funciona" en el sentido
angosto de que el dueño ve la pantalla de bienvenida y puede entrar con su
PIN (porque `entrar()`/`dispositivoApropiado()` en el mismo `auth-ui.js`
tambien leen consistentemente de `f123_owned`). Pero **todo lo que esta fuera
de `auth-ui.js`** — el backend que decide si el catalogo esta activado, el
log de auditoria que ata movimientos a la licencia, los recordatorios de
respaldo, la recuperacion de PIN por correo — se queda ciego, leyendo un
registro que siempre esta vacio.

Un indicio de que esto ya se sospechaba a medias: `atestacionRespaldo()` en
`auth-ui.js` (linea 88) SI revisa las dos variantes de clave al buscar la
fecha del ultimo respaldo (`c123_backup_last_v1` Y `f123_backup_last_v1`) —
alguien ya se topo con esta ambiguedad en un rincon chico y la parcho ahi,
sin notar que el registro `owned` completo tiene el mismo problema, mucho
mas grave.

**La pregunta que decide el arreglo:** ¿cual de las dos claves es la
"correcta" — la que ya leen 6 archivos (`c123_owned`) o la que escribe la
activacion (`f123_owned`)? La recomendacion: **renombrar los 2 `setItem` de
`auth-ui.js` a `c123_owned`**, no al reves. Cambiar 6 archivos para que lean
`f123_owned` arriesga tocar mas superficie y esos 6 ya son la mayoria del
sistema, no la activacion.

---

## Bug 3 — `wrangler.toml` apuntaba al Worker de friendly-123 (CRITICO — YA ARREGLADO)

Encontrado al ir a desplegar el Worker de consultorio-123 a pedido de JFC
("pon el worker y todo eso"). `name = "friendly123-licencias"` y la KV era
literalmente `f1599c69c4174cc2b38dd125c18ee3df` — la KV de friendly-123, con
los datos reales de JFC y de Sarah (idiomARTE) rescatados esa misma mañana.

Si se desplegaba tal cual: el Worker de friendly-123 en Cloudflare quedaba
sobrescrito con el codigo de consultorio, y cada checkin de consultorio
escribia instancias en la KV de friendly-123.

**Ya resuelto en vivo, mismo dia, commit `fef6070`:**
- KV nueva y propia: `cce886f038ad4401ae480855d30824c1`
  (`npx wrangler kv namespace create LICENCIAS_C123`).
- `name = "consultorio123-licencias"`.
- Desplegado: `https://consultorio123-licencias.jfcarpio.workers.dev`.
- Verificado con un checkin de prueba (borrado despues) y confirmando que la
  KV de friendly-123 NO se toco.
- De paso, se limpiaron 2 registros de prueba propios que habian quedado en
  la KV de friendly-123 de las verificaciones de hoy — no eran datos reales.

**Pendiente, y solo lo puede hacer JFC** (pide password interactivo):

```bash
cd "C:/00 Projects/Consultorio-123/cloudflare-worker" && npx wrangler secret put MASTER_KEY
```

Sin eso, el panel de licencias de consultorio-123 da 401 a todo — igual que
le paso a friendly-123 la mañana de hoy antes de que JFC corriera el mismo
comando.

Se lista aqui, aunque este resuelto, porque es la referencia de que ESTE
patron de riesgo (nombre/KV compartidos entre apps hermanas) existe y hay que
revisarlo **cada vez que se clona un `wrangler.toml`** para una app nueva.

---

## Bug 4 — El service worker puede precachear un archivo viejo aunque el CACHE suba (MEDIO)

**Como se encontro:** al verificar el port de hoy en el navegador de pruebas
de consultorio-123, `window.OCSync.catalogoPropio` no existia aunque:
- El archivo en disco tenia el codigo correcto (confirmado con `grep`).
- `curl` directo al servidor de preview devolvia el archivo correcto.
- `node --check` confirmaba sintaxis valida.
- El `CACHE` de `sw.js` SI se habia subido de numero (`v22`).
- `navigator.serviceWorker.getRegistrations()` + `caches.delete()` +
  recargar — el procedimiento que funciono en friendly-123 y amigable-123
  hoy mismo, varias veces — no lo resolvio en consultorio-123.

**La causa tecnica**, en `docs/sw.js` de las tres apps (mismo codigo
compartido):

```js
SHELL.map((u) => cache.add(u).catch(...))
```

`cache.add(u)` hace un `fetch` con el modo de cache **por defecto**, que
respeta las cabeceras HTTP normales (`Last-Modified`/`ETag`). Si el
navegador ya tiene una respuesta HTTP cacheada para ese archivo — de una
visita anterior al MISMO origen, aunque sea de una sesion de pruebas
distinta — el `install` del Service Worker puede terminar precacheando esa
version vieja, **aunque el nombre del `CACHE` haya cambiado**. Subir el
numero de version crea una caja nueva, pero no garantiza que lo que se pone
adentro sea fresco.

**Por que importa para produccion, no solo para las pruebas de hoy:** el
mismo patron puede darse en un telefono real si el navegador del dueño ya
tenia una respuesta HTTP cacheada de una visita anterior (por ejemplo, si
entro a la app por error antes de que se completara un despliegue, o si el
servidor de GitHub Pages manda cabeceras de cache generosas). Es una version
mas sutil del bug de "shell viejo" que ya costo un dia entero hoy — ese se
arreglo con `check-sw.sh` (subir el numero), pero subir el numero no blinda
100% contra este segundo mecanismo.

**El arreglo tecnico es conocido y estandar:** forzar bypass de cache HTTP en
el precache, pasando un `Request` con `cache: "reload"` en vez de la URL
cruda:

```js
cache.add(new Request(u, { cache: "reload" }))
```

---

## Bug 5 — El boton de merge quedo en ingles fijo dentro de una app bilingue (BAJO)

**Donde:** friendly-123, `docs/avanzado-extra.js`, todo el bloque agregado
hoy para "Merge inventory with my team" (boton, modal, mensajes de estado).

**Como se encontro:**

```bash
grep -n "Merge inventory\|Merge now\|Asking your team" docs/avanzado-extra.js
#  3 lineas, texto fijo en ingles
grep -n "window.t(\"sync.panel" docs/avanzado-extra.js | wc -l
#  17   <- el resto del MISMO panel si usa window.t()
```

**El problema:** todo el dia de hoy giro, en parte, sobre sacar el español
suelto de la UI en ingles de friendly-123 (el Bloque 4 de la caza de 22
bugs). El feature de merge, escrito el mismo dia, comete el error inverso:
esta en ingles fijo, sin pasar por `window.t()`, dentro de una app que SI es
bilingue y donde el resto del mismo panel de sync ya usa el sistema de
traduccion correctamente. Un usuario que cambie a español ve "Merge
inventory", "Merge now", etc. sin traducir, justo al lado de texto que si
esta en su idioma.

**El arreglo es mecanico:** mover los ~10 strings a `docs/i18n.js` (en los
dos bloques, `en` y `es`) y reemplazar el texto fijo por
`window.t("sync.merge.xxx")`, mismo patron que el resto del panel.

---

## Orden de ejecucion

1. **Bug 2** (f123_owned/c123_owned). Va primero: mientras no se arregle, TODA
   la infraestructura de auditoria/respaldo/conciliacion de consultorio-123
   sigue ciega, incluida cualquier otra cosa que se construya encima.
2. **Bug 1** (dominio equivocado del merge). Es el que mas requiere decision
   de producto (no solo codigo) — arrancar temprano para no bloquear a Diego
   con una pregunta de diseño a mitad de otra cosa.
3. **Bug 4** (SW cache: `cache: "reload"`). Cambio de una linea en un archivo
   compartido por las tres apps — bajo riesgo, alto valor, se hace junto con
   cualquier otro toque a `sw.js`.
4. **Bug 5** (i18n del merge). Cosmetico, sin riesgo de datos — al final.
5. **Bug 3**: ya resuelto. Solo queda que JFC corra el `wrangler secret put`.

---

## Como se comprueba cada uno

| # | Comprobacion, con el numero que tiene que dar |
|---|---|
| 2 | Activar un dispositivo de prueba y correr `grep -c 'setItem("f123_owned"' docs/auth-ui.js` → **0**. Verificar en el navegador que `identity-context.js` ve el `instanceId` recien creado (hoy no lo ve) |
| 1 | Definido el modelo de pacientes, el merge debe agregar/comparar pacientes, no productos. La prueba minima: dos dispositivos con pacientes distintos, mergear, y que NINGUNO pierda un paciente propio — igual que se verifico hoy con productos en las otras 3 apps |
| 4 | Con un archivo HTTP-cacheado a proposito (visita previa) y el `CACHE` subido de numero, el `install` del SW debe traer la version nueva. Verificable forzando una respuesta 304 con curl antes y despues del cambio |
| 5 | Cambiar el idioma a español y abrir Avanzado → Sync: el boton y el modal de merge deben salir en español. `grep -c "window.t(\"sync.merge" docs/avanzado-extra.js` debe ser mayor a 0 |
| 3 | `curl -H "X-Master-Key: <la que ponga JFC>" https://consultorio123-licencias.jfcarpio.workers.dev/licencias` debe devolver JSON, no 401 |

---

## Lo que NO entra

- **No se auto-mergean cargos ni abonos de CxC**, bajo ninguna circunstancia.
  Eso no es parte de "arreglar el bug 1" — es una linea roja permanente,
  documentada desde `PARA-CONSULTORIO-123-2026-08-19.md`.
- **No se decide hoy la jerarquia de roles** (medico > asistente, o la que
  sea) sin que JFC y Diego la definan. El plan solo señala que hay que
  decidirla antes del bug 1.
- **No se toca `sw.js` de las tres apps a la vez en el mismo commit.** El
  fix del bug 4 es identico en los tres, pero cada app se prueba y se
  despliega por separado — mismo criterio que todo lo demas hoy (nunca
  sobrescribir entre apps hermanas de una).
- **No se renombra `productos`/`ubicaciones` a `pacientes`/algo hoy.** Eso es
  var parte de resolver el bug 1 de verdad, y depende de la decision de
  producto de arriba — no es un find-replace seguro sin ella.
