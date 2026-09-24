# consultorio-123

**Administra tu consulta médica, a color.**

Un cuaderno digital compartido que te ayuda a coordinar ingresos, inventario, cuentas por cobrar y resultados — en equipo, sin depender de una hoja de cálculo ni de que una sola persona tenga todo en la cabeza.

Software de gestión para consultorios médicos, clínicas privadas y consultorios dentales. De la misma familia que friendly-123 y AMIGABLE: local-first, sin servidor obligatorio, sin suscripción, con las mismas guardas de integridad de datos y un dominio distinto.

Por Manuel Garcia de Cuenca y J. F. Carpio.

**Demo en vivo:** https://jfcarpiopuntocom.github.io/Consultorio-123/

---

## Qué incluye

- **Ingresos** — caja chica + bancos, registro por paciente/concepto/forma de pago
- **Inventario** — insumos, equipo médico y prótesis, con código de barras, semáforo de 5 colores (verde/amarillo/naranja/rojo/negro — sin azul) y costo de venta automático
- **Cuentas por cobrar** — tratamientos con pago inicial y cuotas, saldo pendiente por paciente
- **Estado de resultados** — alimentado automáticamente por los módulos anteriores, margen bruto/neto
- **Roles** — dueño/médico, empleado/asistente, contador (capa contable tras subclave)
- **Sync entre dispositivos** — cifrado de extremo a extremo, relay propio sin guardar nada
- **Respaldo soberano** — el respaldo va a TI, nunca a un servidor nuestro

## Lo que viene

Agenda de citas, historial de pacientes, reportes para el contador y app instalable. Se anuncia cuando esté medido y funcionando, no antes.

---

## Una palabra sobre la tubería

Lo que se ve aquí es el **vestíbulo**. La superficie publicada es una puerta, y una puerta no es una casa. El libro diario es una **bitácora encadenada por hash**: cada asiento lleva la huella del anterior, así que el pasado no se reescribe en silencio. Los aparatos que se pertenecen conversan por un **relay cifrado** que no guarda nada y no entiende nada. El acceso es **por huella, nunca por llave**: el código compara digestos, y nada en este árbol abre nada. La **capa contable** va detrás de su propia subclave y el **semáforo** no lleva azul a propósito.

Cada pieza tiene una razón, una fecha y el bug que la hizo necesaria. Esas razones están escritas donde importan y a propósito no se resumen aquí. Si buscas un tutorial, un árbol de módulos o una invitación a bifurcar: esto no es eso. A quien quiera conocer el producto le sirve más el demo.

---

## Datos y privacidad

Ver [PRIVACY.md](./PRIVACY.md). Los datos del consultorio se quedan con el consultorio.

## Licencia

Ver `LICENSE`.

**Licencia comercial de uso:** 5 años desde la activación, con soporte y actualizaciones incluidos durante todo ese período. Sin suscripción.
