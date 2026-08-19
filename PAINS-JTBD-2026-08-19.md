# consultorio-123 · Top 3 Pains y Top 3 Jobs To Be Done

Redactado por JFC el 2026-08-19 y apuntado aquí para que sobreviva a saltos
de sesión, PC y cuenta de Claude. Es la vara con la que se juzga cada
decisión de producto de consultorio-123: si algo no ataca uno de estos
dolores o no cumple uno de estos trabajos, no entra.

Los pains y JTBDs de las hermanas (amigable-123, friendly-123) están en sus
propios repos — no confundir. Consultorio es un producto DISTINTO: no
gestiona perchas, ni comisiones, ni variantes. Su usuario es el
médico/dentista/clínica.

---

## Top 3 Pains

1. **No tienen tiempo ni formación contable para saber cuánto ganan
   realmente** — cargan gastos e ingresos de forma dispersa (agenda, efectivo,
   transferencias) y no llegan a "contabilizar" en serio; necesitan algo
   simple, no un sistema contable completo.

2. **La operación diaria está fragmentada entre agenda, pagos y gastos** — no
   hay una forma rápida de registrar un cobro (forma de pago debería ser un
   simple dropdown, sin etiquetas ni fricción) ni de bloquear días/turnos
   cuando el consultorio no atiende.

3. **Compartir información sensible sin perder el control** — necesitan
   exportar cosas como la lista de pacientes (para un colega, un reemplazo,
   un socio) pero sin poder dejar constancia de por qué se compartió, lo que
   genera desconfianza o riesgo de uso indebido.

---

## Top 3 Jobs To Be Done

1. **"Déjame registrar un cobro o un gasto en segundos, sin pensar en
   categorías"** — forma de pago como dropdown, sin etiquetar, ingreso rápido
   de gastos con campos mínimos.

2. **"Déjame cerrar mis números cuando yo decida, no cuando el sistema me
   obligue"** — período de cierre elegible por el usuario, agenda con bloqueo
   de días para ordenar la operación sin depender de memoria.

3. **"Déjame compartir justo lo que hace falta, con trazabilidad de por qué
   lo hago"** — exportar lista de pacientes dejando registrado el motivo,
   acceso protegido por clave para entrar y buscar información del
   consultorio.

---

## Implicaciones concretas para el código

De este listado salen decisiones específicas que se implementan como
tareas separadas. Al 2026-08-19 quedan como pendientes explícitos:

- **Forma de pago como dropdown** (pain #2, JTBD #1) — reemplazar cualquier
  categorización libre o etiquetas por un pulldown corto: efectivo,
  transferencia, tarjeta, cheque, otro. Sin friction.
- **Ingreso de gasto en segundos** (pain #2, JTBD #1) — botón visible desde
  la pantalla principal, campos mínimos (monto, forma de pago, nota).
- **Bloquear días en la agenda** (pain #2, JTBD #2) — botones "Bloquear día"
  y "Bloquear rango" persistidos como hechos inmutables (`agenda_bloqueada`
  sobre `hechos.js`).
- **Período de cierre elegible** (JTBD #2) — el resultado del mes/quincena/
  año lo cierra el usuario, no el sistema. Nunca cerrar automático.
- **Exportar lista de pacientes con motivo obligatorio** (pain #3, JTBD #3) —
  al exportar se pide un campo "para qué / para quién" que queda como
  hecho `pacientes_exportados` con timestamp, usuario, motivo y hash del
  archivo. Trazabilidad completa.
- **Acceso al consultorio protegido por clave** (JTBD #3) — el PIN del dueño
  ya existe (4 dígitos por diseño); reforzar que también el buscador y las
  vistas sensibles lo exijan. NO relajar los 4 dígitos.
- **Nada de "sistema contable completo"** (pain #1) — cero cuentas T, cero
  asientos, cero plan de cuentas. Un consultorio quiere ver "esto entró,
  esto salió, esto queda", no debitar/acreditar.
