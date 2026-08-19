# Bitácora — prompts de JFC y qué se hizo con cada uno

Registro para poder retroceder. Prompts textuales, fechados, con el commit que
salió de cada uno. Se actualiza en la misma sesión, no después.

---

## 2026-08-17 — sesión de noche

**Prompt (resumido, textual en el historial de la sesión):** tablero no cargó a
la hermana con licencia `AMG-7ZXZ-LS9K-XNWC` y PIN 789, tabs vacíos en su PC
donde ya había cargado. "be surgical!". Más: quitar "También en otra percha" o
ponerlo al final; persistencia de ingresos vía cookies; que no cambie lo
editable al volver a editar; categoría con pulldown mixto; encargado y no
empleado en las 3 apps; bar y licores una sola cosa.

**Y para el 18 de agosto:** editar comisiones en retrospectiva; actividad por
evento como pestaña del tablero; pestaña Comisiones para liquidaciones;
asociado/a en vez de promotor/a; perchas exigen teclear el nombre para borrar;
el aviso de "memoria llena" no debe salir en una PC con espacio; al abrir una
percha ver TODO lo conectado; costo unitario en el tablero; variante o chip al
final del formulario; "familia" → serie/programa/familia; los guiones de la
licencia los pone la app; licencia mostrada en Avanzado no coincide
(`AMG-SA3L-AVD5-WG4Z` en vez de la suya).

**Qué se hizo — 5 commits en `claude/adoring-cray-o3ju9x`, todos pusheados:**

| commit | qué |
|---|---|
| `ac8980d` | tablero en blanco, licencia cruzada, "memoria llena" falsa, encargado |
| `a07e80a` | borradores.js, categoría pulldown, orden del formulario |
| `b704956` | borrar exige teclear el nombre, panorama de percha |
| `2c77323` | comisiones en retrospectiva, las dos mitades del reparto |
| `1d4aecd` | pestañas Eventos y Comisiones, calculadora de costo unitario |

**Causa raíz del tablero en blanco:** si el PIN no se podía juzgar en el propio
dispositivo (secreto no disponible, o penalización por intentos fallidos), la
puerta iba al relay; si nadie contestaba en la sala, `sinNadie()` pintaba las
pestañas VACÍAS aunque el negocio estuviera guardado en ese mismo navegador.

**Decisiones tomadas distinto a lo pedido, y por qué:**
- **Cookies → localStorage.** Una cookie tiene 4 KB para todo el sitio y viaja
  en cada petición; un alta de producto no entra. localStorage sobrevive igual
  al back, al cierre y a quedarse sin internet, que era lo que se pedía.
- **El % de comisión NO se guarda por persona.** La misma persona puede ser
  vendedora al 10% en una percha y artista al 85% en otra. Un número por
  persona sería mentira en cuanto tenga dos tratos.

**PRs abiertos (política del entorno: tras pushear hay que abrir PR):**
AMIGABLE#1, friendly-123#1, consultorio-123#1. Los 3 en borrador, sin CI
(ningún repo tiene workflows).

---

## 2026-08-18

**Prompt:** `/make-plan` no funcionaba. Plan para estabilizar y pasar los
sistemas a friendly-123 para que ya se pueda usar, y lo pertinente a
consultorio-123. Prioridad: friendly-123 a producción y live. consultorio-123
apenas en focus groups, va a ser distinta app — contable, financiero, abonos y
pagos, cuentas por cobrar de pacientes, control y visualización financiera
fácil. Revisar commits de 3-7 días, no leer código quemando tokens.

**Qué se hizo:**
- `/make-plan` no estaba en este contenedor: los comandos de la máquina de JFC
  no se sincronizan a las sesiones remotas. Se creó
  `.claude/commands/make-plan.md` **en los 3 repos**, para que viaje con ellos.
- `DIRECCION-PRODUCTO-2026-08-18.md` con el rumbo de las 3 apps.
- **`CLAUDE.md` en los 3 repos.** No existía en ninguno — ésa era la causa raíz
  de que los apuntes no se leyeran. Trae la REGLA 0: leer los apuntes antes de
  planificar.

**Error propio, registrado para que no se repita:** se propuso un plan de port
que habría sobrescrito `mock-backend.js` y `avanzado-extra.js` de friendly-123
con los de amigable, borrando el orden de sacrificio de espacio y el respaldo
autoverificado. La causa: no se leyó `PORT-NOTES-2026-07-21.md`, donde ya
constaba que friendly-123 recibe los avances primero. JFC lo corrigió.

**Divergencia real medida (2026-08-18) — friendly-123 va ADELANTE en:**

| archivo | AMIGABLE | friendly-123 |
|---|---|---|
| `crypto-store.js` | 14.8 KB | **27.9 KB** |
| `mock-backend.js` | 122 KB | **130 KB** (orden de sacrificio) |
| `avanzado-extra.js` | 134 KB | **141 KB** (respaldo autoverificado) |
| `reconciliacion.js` | 24.5 KB | 25.0 KB |
| `i18n.js` + 6 archivos | — | sistema completo |

**AMIGABLE va adelante en:** `index.html`, `auth-ui.js`, `sync-realtime.js`,
`vista-perchas.js`, y 7 archivos que a F123 le faltan (`tablero.html`,
`tablero-avanzado.js`, `estado-idb.js`, `borradores.js`, `micelio-vivo.js`,
`micelio-ui.js`, `percha-reposicion.js`, `simon-config.js`).

---

## 2026-08-19 — activar consultorio-123 + panel.html + notas OCR

### Prompt textual de JFC (2026-08-19)

> "ahora vamos brevemente pero focused a consultorio-123 (ya quiero que se active
> y me des un panel de control para friendly-123 y consultorio-123, de cada uno
> su panel.html como el de amigable-123 pero sin nada de Olimpo Control ni de
> otras cosas que no sean hyper focused en ellas como apps, y ponles mi misma
> clave 895759 que no me molesta que sepas, ya la cambiaré luego cuando haya
> info real etc etc — Aqui van apuntes para cambios en las fotos y aqui abajo a
> continuacion en texto un MAL ocr de las fotos entonces pensemos bien,
> /make-plan y me haces aprobar formas, ya sabes mis filosofias y que amo costas
> estables, hibridas, innovadoras y robustas, en ese orden"

### Qué se hizo ahora

- Verificado que `docs/panel.html` YA tenía la clave 895759 (hash SHA-256
  coincide con `printf 895759 | sha256sum`).
- Fix: cross-app auth key. La sesión del panel usaba `panel_auth_f123` (herencia
  de haber clonado desde friendly). Cambiada a `panel_auth_c123` para que abrir
  ambos paneles en la misma máquina no cross-autentique.
- Fix: se quita el PIN escrito en texto plano en la tabla de "Códigos maestros
  de recuperación" (`4-1-9-2-5-7`). Reemplazado por "oculto (sha256 en
  _expectedHash)". Regla: la clave nunca en el fuente, sólo su hash.
- Snapshot: `panel-y-consultorio-notas`.
- PR #2 mergeado a main.

### Pendiente — 14 items de las notas OCR (JFC dijo que el OCR es imperfecto)

Se listan aquí para retomar. **NO se implementaron todavía porque adivinar la
interpretación de un OCR malo, sin confirmar con JFC, es exactamente lo que
la regla 'no alucinar, no asumir' prohíbe.** Cada item necesita 30s de JFC
para confirmar/aclarar antes de tocar código:

1. **Ingresar → Caja chica / Bancos**: el flujo de ingreso pide destino
   (¿radio caja/bancos? ¿o es un tab del panel financiero?).
2. **Forma de pago = pulldown**: efectivo / transferencia / tarjeta / cheque /
   otro. ¿En qué formulario exactamente — cobro de cita, abono, gasto?
3. **No etiquetar**: ¿quitar el sistema de tags/etiquetas de contactos? ¿o de
   otro lado (movimientos, citas)?
4. **Ayuda a bloquear días** (agenda): botón "Bloquear día"/"Bloquear rango"
   para feriados/vacaciones. Confirmar que se persiste como hecho.
5. **Editar agenda**: cita creada debe ser editable (hora, paciente, nota) —
   ¿cambio de hora reemite hecho o crea `cita_reagendada`? decisión de JFC.
6. **Informar cuando solo hay [ilegible]** — el OCR corta la palabra clave.
   Posibles lecturas: "cuando sólo hay poco stock", "cuando sólo hay un
   paciente", "cuando sólo hay un cobro pendiente". Necesita aclarar.
7. **Poder agregar gasto**: `caja-chica.js` ya tiene `retiro` que es el
   equivalente; ¿"gasto" es sólo el label visible, o es una categoría
   contable distinta (COGS vs OPEX)?
8. **Editable por campo**: cada fila con lápiz por campo — patrón ya
   estandarizado. Aplicar a las tablas financieras del panel.
9. **Solo necesitamos contacto/s**: unificar cliente/proveedor bajo un único
   modelo "contacto" con banderas. Confirmar antes de migrar registros
   existentes.
10. **Interactuar con contactos**: click-to-call, click-to-whatsapp,
    click-to-mail en la ficha.
11. **Que ellos puedan elegir el perfil**: el contacto se autoservicia por link
    corto. Requiere endpoint público firmado — decisión arquitectónica.
12. **Ejecutar para completar**: la cita queda "pendiente" hasta que se
    presiona "Completar" (que cobra y cierra).
13. **Lista de pacientes/clientes**: tab dedicado con buscador y ficha con
    historial de citas + estado de CxC.
14. **Fotos de personas**: campo foto en ficha de contacto. Sensibles →
    `crypto-store` (AES-GCM), no en claro.

### Estado del código para retomar

- `docs/agenda.js` y `docs/agenda-ui.js` ya existen (event-sourcing sobre
  `hechos.js`, mismo patrón que cxc/ingresos).
- `docs/caja-chica.js` tiene `ingreso` y `retiro` como hechos inmutables.
- `docs/nucleo-cxc.js`, `docs/nucleo-ingresos.js`, `docs/nucleo-resultados.js`,
  `docs/nucleo-ui.js` — núcleo financiero ya montado.
- `_private/PLAN-AGENDA-CITAS.md` es la referencia arquitectónica de la agenda.

Bloqueado en: aclarar OCR con JFC. Sin eso, cualquier implementación es
adivinanza — y la regla es no adivinar.

---

## 2026-08-19 — Top 3 Pains y JTBDs de consultorio-123

### Prompt textual de JFC

> "esto apuntalo para consultorio-123 en tus .md igual que el prompt anterior
> era lo mismo pero para amigable y friendly, ponlo tambien en tus .md
>
> Top 3 Pains
>
> 1. No tienen tiempo ni formación contable para saber cuánto ganan realmente
>    — cargan gastos e ingresos de forma dispersa (agenda, efectivo,
>    transferencias) y no llegan a "contabilizar" en serio; necesitan algo
>    simple, no un sistema contable completo.
> 2. La operación diaria está fragmentada entre agenda, pagos y gastos — no
>    hay una forma rápida de registrar un cobro (forma de pago debería ser un
>    simple dropdown, sin etiquetas ni fricción) ni de bloquear días/turnos
>    cuando el consultorio no atiende.
> 3. Compartir información sensible sin perder el control — necesitan
>    exportar cosas como la lista de pacientes (para un colega, un reemplazo,
>    un socio) pero sin poder dejar constancia de por qué se compartió, lo
>    que genera desconfianza o riesgo de uso indebido.
>
> Top 3 Jobs To Be Done
>
> 1. "Déjame registrar un cobro o un gasto en segundos, sin pensar en
>    categorías" — forma de pago como dropdown, sin etiquetar, ingreso
>    rápido de gastos con campos mínimos.
> 2. "Dejame cerrar mis números cuando yo decida, no cuando el sistema me
>    obligue" — período de cierre elegible por el usuario, agenda con bloqueo
>    de días para ordenar la operación sin depender de memoria.
> 3. "Dejame compartir justo lo que hace falta, con trazabilidad de por qué
>    lo hago" — exportar lista de pacientes dejando registrado el motivo,
>    acceso protegido por clave para entrar y buscar información del
>    consultorio.

### Qué se hizo

- Guardado como `PAINS-JTBD-2026-08-19.md` en la raíz del repo, con las
  implicaciones concretas para el código listadas (dropdown de forma de
  pago, ingreso rápido de gasto, bloqueo de días en agenda, cierre elegible,
  exportar pacientes con motivo obligatorio y trazabilidad, acceso protegido).
- Estas implicaciones se cruzan con los 14 items del OCR apuntados el mismo
  día — varios se resuelven juntos.
- Actualización de `visualize.html` y `save.html` para que la landing hable
  el mismo idioma de estos pains/JTBDs y no palabras sueltas.
