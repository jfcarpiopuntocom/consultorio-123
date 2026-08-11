# consultorio-123

**Administra tu consulta médica, a color.**

Un cuaderno digital compartido que te ayuda a coordinar ingresos, inventario, cuentas por cobrar y resultados — en equipo, sin depender de una hoja de cálculo ni de que una sola persona tenga todo en la cabeza.

Software de gestión para consultorios médicos, clínicas privadas y consultorios dentales. Clonado y adaptado sobre la base completa de [friendly-123](https://github.com/jfcarpiopuntocom/friendly-123) (PWA local-first, sin servidor obligatorio, sin suscripción) — misma arquitectura probada, mismos guards de integridad de datos, dominio distinto.

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

## Pensado para v2.0 (arquitectura modular desde ya)

- Agenda de citas + integración Google Calendar / Outlook (ver `_private/PLAN-AGENDA-CITAS.md`)
- Historial de pacientes
- Reportes PDF/Excel
- App instalable para Android, iOS, Windows y Mac

## Correr localmente

```bash
cd docs
python -m http.server 8737
```

Abre `http://localhost:8737`.

---

## Datos y privacidad

Ver [PRIVACY.md](./PRIVACY.md). Los datos del consultorio no salen del dispositivo.

## Licencia

Ver `LICENSE`.

**Licencia comercial de uso:** 5 años desde la activación, con soporte y actualizaciones incluidos durante todo ese período. Sin suscripción.
