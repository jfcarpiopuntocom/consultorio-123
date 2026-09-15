# CLAUDE.md — léeme entero antes de planificar o tocar código

Este archivo se carga solo en cada sesión. Es la memoria persistente de este
repo: lo crítico está aquí para no re-derivarlo (ni re-preguntarlo) cada vez.
Si un dato cambia, se actualiza aquí en el mismo commit.

---

## QUÉ ES consultorio-123 — es una app DISTINTA, no "amigable para médicos"

- Su centro es lo **contable y financiero**: abonos, pagos, cuentas por cobrar
  de pacientes, control y visualización financiera fácil.
- Unidad básica: **el paciente** (no la percha).
- **PIN de 4 dígitos, POR DISEÑO.** No "corregir" a 3. Las apps de tiendas usan 3.
- Idioma español, con `i18n.js` (a diferencia de amigable).
- Está en **beta** (focus groups / market research). En el PIN se declara
  **`beta version · shell-vNN`**.
- **NO portarle** perchas, variantes, comisiones a asociados, eventos ni
  reposición de stock — un consultorio no tiene nada de eso. Ante la duda: **no
  portar todavía.**
- Apps hermanas: **friendly-123** (testeo, inglés, recibe avances primero) y
  **amigable-123** (producción tiendas, español). Las tres divergieron: **jamás
  `cp` de una a otra**, se injerta cambio por cambio.

## PRIME DIRECTIVE — NO NUBE, NO FILTRAR DATOS DE PACIENTES

Todo vive en el dispositivo. Lo ÚNICO que sale es el heartbeat de licencia.
**Jamás** datos de pacientes, atenciones, ni financieros. Los pacientes **NO
viajan** en el sync entre pares (decisión firme). El worker de Cloudflare es un
relay de puro broadcast, sin almacenamiento — no meterle estado.

---

## POLÍTICA DE VERSIÓN (JFC 2026-09-09) — NO MOVER SIN ORDEN EXPRESA

- La etiqueta pública es **`beta version`** (badge en el PIN). Junto a ella se
  muestra **`· shell-vNN`** (el entero del shell) para comparar entre dispositivos.
- **De aquí en adelante SOLO sube el ENTERO del shell** (`c123-shell-vNN`), que
  es el control de cambios real. `version` en `version.json` no se mueve salvo
  un salto mayor deliberado que JFC pida.
- El badge lee `version.json` (que el SW nunca cachea); fail-safe si falla.

## CHECKLIST DE RELEASE — obligatorio en CADA cambio a un archivo del SHELL

Un archivo del SHELL es cualquiera en `const SHELL = [...]` de `docs/sw.js`. Si tocas uno:

1. Sube `const CACHE = "c123-shell-vNN"` en `docs/sw.js` al siguiente entero.
2. Sube `"shell": "c123-shell-vNN"` en `docs/version.json` al MISMO número.
3. `node scripts/gen-manifest.js`.
4. `bash check-sw.sh` — todo OK (hashes reales cuadran, sw.js↔version.json
   coinciden, G4 nav/sección/panel). Si falla, no se pushea.
5. Recién ahí commit + push.

Saltarse esto deja a los aparatos ya instalados con MEZCLA de shell viejo/nuevo.

## SISTEMA DE INTEGRIDAD DE VERSIÓN (ya montado, no romper)

- `version-manifest.json`: SHA-256 por archivo del shell.
- SW: verificación SRI **fail-open** — hash que no cuadra NUNCA se borra; se
  re-pide y se conserva el servido si falla.
- `check-sw.sh`: recomputa el hash real y falla si el manifest está viejo.
- El SW limpia caches `c123-shell-` y `f123-shell-` (heredó el prefijo de friendly).

---

## SYNC (estado actual)

- `sync-watchdog.js` portado de friendly. Capability B (verificar consistencia +
  auto-resync) funciona. Capability A (snapshot local) activa vía
  `OCSync.estadoParaCheckpoint`. **NO** hay restore (`aplicarCheckpoint`) todavía:
  cero riesgo de pisar datos de pacientes hasta que se decida con cuidado.

## CÓMO INVESTIGAR SIN QUEMAR TOKENS

`docs/index.html` es enorme. **Nunca leerlo entero.**

```bash
git log --since="7 days ago" --pretty=format:"%h %ad %s" --date=short
grep -n "MARCADOR" docs/index.html          # ubicar, no volcar
```

En minificado: editar con scripts que verifiquen ancla ÚNICA + `node --check`. Nunca `sed` a ciegas.

---

## GIT — YO CIERRO EL CICLO, NADA QUEDA A MEDIAS

- Antes de ramificar: `git fetch origin main` y `git checkout -B <rama>
  origin/main` (base fresca).
- Pushes frecuentes; cada paso verde se pushea (el contenedor es efímero).
- JFC no necesita saber qué es un PR/rama/merge. El ciclo (respaldo → commit →
  push → PR → mergear cuando esté verde y comprobado) es mío. No dejar PRs en el
  limbo esperando su decisión de mecánica de git.
- Rama por defecto: **main**.

---

## NOMENCLATURA Y ESTILO

- **fiado** = deuda (debt). **abono** = crédito a favor (credit); puede ser
  "sin determinar" o por ítem. Se quitó el confuso "on credit".
- Español natural, 80% para el lego, 20% académico. **No usar "vive en"**.
- **Legibilidad premiada SIEMPRE**: nunca gris/opaco/sombreado/muy pequeño. Tinta de verdad.
- Sin emojis en la UI. Comentarios que expliquen POR QUÉ, con fecha y el bug real.
- No parar a mitad de tarea aprobada. No dejar commits sin pushear. No hacerle
  pedir la misma cosa tres veces.
