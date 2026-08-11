# Datos y privacidad

**Versión corta: los datos de tu consultorio nunca salen de tu dispositivo. Lo único que rastreamos es tu licencia.**

consultorio-123 es local-first por diseño. Pacientes, historial clínico, citas, cobros y tus códigos de acceso — todo lo relacionado con tu consultorio vive en el almacenamiento local de tu navegador, en tu dispositivo, y en ningún otro lugar. No hay un servidor que lo guarde, no hay sincronización en la nube, no hay analítica, no hay telemetría.

## La única excepción: la activación de la licencia

Para vender licencias y desbloquear la app completa a quienes ya pagaron, operamos un pequeño Worker de Cloudflare que rastrea *instancias*, no *consultorios*. La licencia comercial es válida por **5 años** desde la activación. Cuando activas (PIN 789) o entras, tu dispositivo envía:

- `instanceId` — un ID aleatorio generado en tu dispositivo, no ligado a nada más
- Tu nombre, correo y código de licencia — solo si decidiste ingresarlos durante la activación, para recuperar tu acceso
- Tu número de WhatsApp — solo si decidiste agregarlo, para que podamos contactarte directamente además de por correo
- Estado de activación (full / mínima / bloqueada)

Esa es la lista completa. Nada sobre tus pacientes, su historial clínico, citas o cobros viaja jamás en este ping, en ningún momento, bajo ninguna función.

## Verifícalo tú mismo/a

No es algo que tengas que creer por fe: revísalo:

- **Abre DevTools → pestaña Network** mientras usas la app. Cada solicitud que hace la app es visible. Verás llamadas a `/api/*` (tu propio navegador, interceptadas localmente por `mock-backend.js` — nada sale de tu dispositivo) y llamadas ocasionales al endpoint `/checkin` del Worker de Cloudflare, al activar o entrar. Nada más.
- **Lee el código del worker directamente**: [`cloudflare-worker-licencias/worker.js`](./cloudflare-worker-licencias/worker.js) en este repo es el código exacto desplegado — sin paso de build, sin minificación que esconda nada.
- **Lee el código del cliente**: `docs/*.js` es JavaScript plano, sin minificar. No hay ningún paso de bundler entre lo que está en este repo y lo que corre en tu navegador.

## Por qué nos importa

Esto no es un disclaimer legal — es el diseño real del producto. Si estás evaluando consultorio-123 para un consultorio donde "a dónde va la información de mis pacientes" es una pregunta real (y debería serlo), la respuesta es: a ningún lado, por construcción, y no tienes que tomar nuestra palabra.
