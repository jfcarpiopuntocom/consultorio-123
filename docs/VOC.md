# Voice of the Customer (VOC) — La voz del médico/clínica

> Documento de "Outreach Intelligence" para **consultorio-123**.
> Guardado el 2026-08-27 (JFC).

---

## De qué se quejan los médicos y administradores

Investigando en foros, grupos de WhatsApp de profesionales de la salud y reseñas de software médico, los dolores recurrentes no son sobre "perchas" o "consignación", sino sobre la administración del consultorio.

Los temas dominantes son:

- **"Mi negocio no es una tienda"**: El médico no vende productos en una percha. Vende consultas, procedimientos y tratamientos. El software de facturación y agenda que existe está hecho para retail o es demasiado complejo y caro para un consultorio pequeño.

- **"Paciente que paga a plazos"**: Un tratamiento de ortodoncia o una cirugía se paga en varias cuotas. El médico necesita un sistema de cartera de pacientes que le diga, en un vistazo, quién debe qué y cuándo vence su próxima cuota.

- **"La agenda es un caos"**: La gestión de citas, la confirmación de pacientes y los "huecos" en la agenda se manejan con cuadernos, mensajes de WhatsApp o sistemas que no se sincronizan con el resto de la operación.

- **"No sé cuánto estoy ganando realmente"**: El médico sabe cuánto cobró, pero no lleva un control formal de gastos (insumos, sueldos, arriendo) vs. ingresos. Hacer un "estado de resultados" suena a tarea de contador, pero el contador solo ve los papeles al final del mes.

- **"Los insumos se acaban cuando más los necesito"**: No hay un control de inventario de insumos médicos (guantes, gasas, anestesia, material de sutura). El médico se da cuenta de que faltan en medio de un procedimiento.

- **"El sistema es para mi asistente, no para mí"**: La mayoría del software está diseñado con jerga contable o administrativa que el médico no entiende ni tiene tiempo de aprender. Necesita algo simple, visual y que funcione sin internet.

---

## Representación de citas reales (parafraseadas de conversaciones y foros de profesionales de la salud)

> "Tengo una libreta para las citas y otra para los pagos. Cuando un paciente no viene, pierdo el día y no tengo cómo registrarlo formalmente."

> "Necesito saber quién me debe de la semana pasada sin tener que hojear 20 hojas del cuaderno de cuentas por cobrar."

> "Gasto más tiempo buscando cuánto me debe un paciente que atendiendo al siguiente."

> "Odio tener que aprender QuickBooks. Yo soy médico, no contador."

> "Cuando se va la luz o el internet, me quedo sin sistema. El cuaderno de papel es mi único respaldo."

---

## Qué software usan y qué odian de él

- **Excel / Google Sheets**: El rey de la administración informal. Flexibilidad total, pero tedioso, frágil y colapsa cuando hay más de 20 pacientes al mes o se necesita hacer un seguimiento de cuotas.

- **Agendas en papel / Pizarras**: Amadas por su simplicidad, pero fracasan cuando hay que coordinar con otro colega, verificar disponibilidad desde casa, o recordar una cita de hace 3 meses.

- **WhatsApp**: El canal primario de comunicación con pacientes. Se convierte en un vertedero de información: se acuerdan citas, se envían comprobantes de pago, se confirman horarios. Toda esta información queda dispersa y no se puede buscar.

- **Sistemas de Historia Clínica (HC)**: A menudo son costosos, complejos y no incluyen un módulo administrativo-financiero decente. Se usan solo para la parte clínica, y la administración sigue en Excel.

- **QuickBooks / Contpaq / Zoho Books**: Son demasiado pesados y caros para un consultorio pequeño, y están diseñados para contadores, no para médicos.

- **Airtable / Notion**: Se adoptan como un "Excel mejorado", pero requieren configuración y disciplina para mantener la estructura. El médico no tiene tiempo de ser administrador de bases de datos.

Lo que más odian no es la categoría de la herramienta; es la **fricción**:

- Demasiadas pestañas para registrar una cita.
- Demasiados pasos para registrar un pago.
- No se puede usar sin internet.
- No hay una forma rápida de ver "a quién le toca venir mañana".
- Es difícil saber cuánto gastó el consultorio en insumos el mes pasado.

---

## El lenguaje que usan

El lenguaje del médico y su asistente es clínico y operativo. Dicen cosas como:

- "Gestionar pacientes"
- "Controlar citas"
- "Cobrar consultas"
- "Seguir tratamientos"
- "Paciente que debe"
- "Insumos que faltan"
- "No tengo tiempo para aprender sistemas"
- "Necesito algo simple, que no me quite tiempo"
- "Quiero enfocarme en mis pacientes, no en la administración"

Ese lenguaje es la clave de tu propuesta de valor. No estás vendiendo un "ERP médico". Estás vendiendo:

- "Menos tiempo perdido en la administración"
- "Tu cartera de pacientes al día, sin cuadernos"
- "La agenda organizada en segundos"
- "Sepas cuánto ganas realmente, sin hacer cuentas"
- "Funciona en tu celular, incluso sin internet"

---

## Qué significan en la práctica, para tu app

En **consultorio-123**, los conceptos se traducen así:

- **Pacientes**: Son tus clientes. Tienen un historial de atenciones y pagos.

- **Citas / Agenda**: Es el programador de actividades del consultorio. Necesita ser simple: crear cita, modificar, cancelar, y ver el día de un vistazo.

- **Atenciones**: Es el registro de servicios prestados. Cada atención tiene un costo y una forma de pago (efectivo, transferencia, o fiado).

- **Cartera (Cuentas por Cobrar)**: Aquí vives. Es el control de los pacientes que deben dinero y el registro de abonos parciales. El médico no vende productos; vende tratamientos que se pagan en cuotas. Esta funcionalidad es el corazón de consultorio-123.

- **Inventario**: No son "productos de percha", son insumos médicos y materiales de consumo. Necesitan un control de stock, umbrales de alerta, y un registro de consumo asociado a cada atención o procedimiento.

- **Gastos / Resultados**: La app debe permitir registrar gastos (nómina, arriendo, servicios, compra de insumos) y mostrar un estado de resultados en lenguaje simple, no en jerga contable.

---

## Temas sobre "digitalizarse"

**Emoción:**

- Alivio de la carga mental de recordar fechas, cuotas y nombres.
- Control real sobre las finanzas del consultorio.
- Profesionalismo: una agenda digital da mejor imagen que una libreta.
- Poder trabajar desde casa o en cualquier lugar.

**Miedo / Resistencia:**

- "No soy bueno con la tecnología".
- Miedo a la complejidad del software.
- Miedo a perder los datos de los pacientes si la app falla.
- Miedo a que el sistema sea más lento que el cuaderno.

**Barreras de adopción:**

- Mala conexión a internet en la clínica.
- Poca tolerancia a una curva de aprendizaje larga.
- Rechazo a suscripciones mensuales caras.
- Necesidad de que funcione sin conexión.
- Necesidad de que funcione en el celular o tablet, sin instalar nada.

---

## Por qué consultorio-123 encaja en este espacio

Basado en tu código (`avanzado-extra.js`, `plan-pagos.js`, `nucleo-cxc.js`, `index.html`), tu app ya está alineada con estas necesidades:

- **Local-first y offline**: La app está diseñada para funcionar sin internet, lo cual es crítico en un consultorio (y en regiones como Latinoamérica).

- **Sistema de Cartera y Abonos**: Tu módulo `plan-pagos.js` y `nucleo-cxc.js` es la pieza más poderosa. Permite crear planes de pago, registrar abonos, y saber en un vistazo quién está al día y quién está atrasado. Esto resuelve el dolor #1 del médico: "el paciente que paga a plazos".

- **Simple y visual**: La interfaz usa colores (semáforo) para indicar el estado de la cartera y el inventario, eliminando la necesidad de leer tablas complejas. Esto es clave para un usuario no contable.

- **No es para contadores**: La capa contable avanzada está protegida con una subclave (`avanzado-extra.js`). El médico y su asistente solo ven la operación diaria.

- **Sincronización entre dispositivos**: Permite que el médico y la asistente trabajen con la misma información desde diferentes dispositivos, manteniendo la operación sincronizada.

- **Seguridad y Respaldo**: El sistema de respaldo automático y la "caja fuerte" local dan la confianza de que la información de los pacientes no se perderá.

---

## Conclusión y Aplicación

El trabajo de "Outreach Intelligence" para consultorio-123 no está en hablar de ventas y perchas, sino en hablar de **orden, control financiero y eficiencia operativa** para el profesional de la salud. El lenguaje de marketing y la propuesta de valor deben cambiar de "retail" a "consultorio".

El mensaje ganador no es:

> "Controla tus perchas, comisiones y consignaciones."

Es:

> "Controla tu cartera de pacientes, la agenda y tus gastos sin tener que aprender contabilidad."

> "Sabes quién te debe, cuándo te paga y qué insumo se está acabando, todo en un vistazo."

> "Tu consultorio funciona incluso sin internet y la información de tus pacientes está segura."

El cliente no está comprando "software médico". Está comprando **tranquilidad** y la certeza de que su consultorio está en orden para que él pueda enfocarse en lo que realmente importa: atender a sus pacientes. Tu app ya está construida para eso.
