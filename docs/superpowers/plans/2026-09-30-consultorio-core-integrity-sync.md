# Consultorio Core Integrity and Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Consultorio's shared medical and business records reliably persist, converge across connected devices, and recover from an owner export.

**Architecture:** Repair the existing local-first architecture in bounded steps. Add pure deterministic merge rules in `docs/sync-domain.js`, integrate them with the existing local state adapter and encrypted Yjs bridge, retain legacy realtime compatibility, and validate actual durable state and visible peer updates. Keep domain cleanup and broad UI polish for later releases after integrity and recovery are proven.

**Tech Stack:** Browser JavaScript, IndexedDB, Yjs, existing realtime relay, Node.js built-in test runner, existing Service Worker and GitHub Pages release flow.

**Spec:** `docs/superpowers/specs/2026-09-30-consultorio-core-integrity-sync-design.md`

## Global Constraints

- Shared business records and create/edit/delete/restore operations must converge in 2 seconds or less between connected, awake devices.
- Do not place readable patient or financial data in relay storage, license telemetry, logs, public notes, or test fixtures.
- Preserve money, inventory, clinical history, IDs, photos, and existing user data across migration and recovery.
- Never purge production rooms, browser stores, backups, or customer records.
- Meaningful UI text must meet the global absolute readability rule.
- Keep the legacy realtime path until backward compatibility and rollback are evidenced.
- For Consultorio releases, increment only `c123-shell-vNN`; keep the public version policy unchanged and regenerate `docs/version-manifest.json`.
- Ship production changes through `$ship-jfc`; distinguish local tests, provider deployment, live read-back, and physical-device adoption.

## Review Focus

- Concurrent offline stock deductions from one baseline must both survive; test two replicas and assert the resulting quantity and operation history.
- An intentional blank edit must beat an older populated value; test opposite delivery orders.
- Replayed immutable financial IDs with changed content must stop and surface an integrity conflict; test that neither value silently overwrites the other.
- Tombstones and explicit later restoration must survive stale snapshots; test delete/restore/replay permutations.
- Missing or reordered photo blobs must preserve metadata and recover by hash; test metadata-first, blob-first, replacement, and removal.

---

### Task 1: Deterministic shared-data merge rules

**Files:**
- Create: `docs/sync-domain.js`
- Create: `test/sync-domain.test.js`
- Modify: `docs/index.html` to load the new local module before its consumers

**Interfaces:**
- Produces `OCSyncDomain.compareRevision(a, b) -> -1 | 0 | 1`, `mergeEntity(local, incoming) -> { entity, changed }`, `mergeFact(factsById, incoming) -> { factsById, status }`, and `mergeInventory(base, counters, operation) -> { base, counters, quantity }`.
- A mutable revision has `{ c: non-negative integer, d: stable device actor }`; wall-clock timestamps never select winners.
- Immutable fact status is `inserted`, `duplicate`, or `collision`.

- [ ] Write tests for revision order/tie-break, blank edits, delete and restore, equal-revision deterministic handling, duplicate facts, changed-content collision, and independent positive/negative inventory counters.
- [ ] Run `node --test --test-isolation=none test/sync-domain.test.js`; confirm the new tests fail because the module is absent.
- [ ] Implement the four pure functions in `docs/sync-domain.js`, without DOM, storage, or network dependencies.
- [ ] Run the focused test file and assert each defined merge result and collision status.
- [ ] Run `node --check docs/sync-domain.js` and `git diff --check`.

### Task 2: IndexedDB isolation and durable local state contract

**Files:**
- Modify: `docs/aislamiento.js`
- Modify: `docs/estado-idb.js`
- Modify: `docs/mock-backend.js`
- Create or modify focused tests under `test/`

**Interfaces:**
- Consumes `OCSyncDomain` from Task 1.
- Produces local persistence acknowledgements that distinguish committed state from failed storage; existing callers must not report success before commit.
- Isolation remains established after all scripts load; failure enters a visible safe-degraded state.

- [ ] Add a regression test reproducing a later script replacing `window.indexedDB.open` and assert startup detects it without touching another app's database.
- [ ] Add tests for a local mutable record revision being persisted before its sync notification, a retained tombstone, and storage failure not returning a successful acknowledgement.
- [ ] Run the focused tests and confirm failure against current behavior.
- [ ] Apply the shared merge rules in the narrow local persistence and isolation paths; preserve legacy record IDs and avoid bulk revision stamping at startup.
- [ ] Run focused tests plus existing financial tests; inspect database names and script load order in `docs/index.html`.

### Task 3: Canonical snapshot and Yjs entity convergence

**Files:**
- Modify: `docs/mock-backend.js`
- Modify: `docs/sync-yjs.js`
- Modify: `docs/sync-queue.js` and/or `docs/sync-outbox.js` only where required by existing flow
- Create or modify: `test/sync-yjs.test.js` or existing browser harness tests

**Interfaces:**
- Consumes `OCSyncDomain` and the durable local state acknowledgement from Tasks 1–2.
- `OCSync.catalogoPropio()` emits the complete canonical shared entity snapshot with stable IDs, revisions, and tombstones.
- Remote entity application returns committed IDs after local durable storage and dispatches the existing domain event only after commit.

- [ ] Add two-replica tests for patient, product/supply, location, category, team, and business identity create/edit/delete/restore; assert both durable state and visible event payload.
- [ ] Add a test where patient `notes` or contact is intentionally blanked and assert it remains blank under both delivery orders.
- [ ] Run the tests red against the current patient-omitting snapshot and partial remote-apply behavior.
- [ ] Implement canonical snapshot and bounded remote merge using Task 1 rules; make self-delivery, duplicate delivery, and reversed delivery idempotent.
- [ ] Run focused tests and assert connected peer persistence-to-visible-render is measured at or below 2,000 ms in the harness.

### Task 4: Financial facts, care records, and inventory operations

**Files:**
- Modify: `docs/hechos.js`
- Modify: `docs/nucleo-atenciones.js`
- Modify: `docs/nucleo-inventario.js`
- Modify: `docs/mock-backend.js`
- Modify: `docs/sync-yjs.js`
- Create or modify focused tests under `test/`

**Interfaces:**
- Consumes fact and inventory merge APIs from Task 1 and canonical transport from Task 3.
- Charges, payments, credits, cash facts, and audit movements use stable append-only operation IDs and content hashes.
- Inventory quantity is the baseline plus per-device idempotent counters; cancellation/return is an explicit inverse tied to the source record.

- [ ] Add tests for duplicate/reordered charge, payment, credit, expense, transfer, cancellation, and correction operations; assert exact expected totals after replay and restart.
- [ ] Add a two-replica test for simultaneous offline stock deductions from one baseline; assert both deductions and both operation IDs remain.
- [ ] Add collision test for same financial operation ID with different content; assert both evidence paths remain available and automatic application stops.
- [ ] Add rejection test asserting rejected care/charge changes neither stock nor financial facts.
- [ ] Run tests red, implement only the adapters needed to satisfy the operation contract, and rerun focused then complete suites.

### Task 5: Photo synchronization and complete sovereign export/restore

**Files:**
- Modify: `docs/idb-fotos.js`
- Modify: `docs/mock-backend.js` export/import paths
- Modify: relevant export UI module found in `docs/index.html` load graph
- Create or modify: focused tests under `test/`

**Interfaces:**
- Photo metadata references immutable content hashes with explicit `present`, `replaced`, or `removed` state.
- Export contains every canonical shared store, append-only facts, photo blobs, and required business settings; restore validates before applying.
- Produces a verifiable import result with normalized record totals and photo hashes, without destructive clearing on invalid input.

- [ ] Add tests for metadata-first, blob-first, replacement, removal, and stale photo replay; assert hash and final state.
- [ ] Add synthetic full export/restore test into clean storage; compare normalized entities, financial totals, inventory, history, and photo hashes.
- [ ] Add malformed or interrupted import test; assert existing durable state remains intact.
- [ ] Run tests red, implement hash-verified photo and full-state export/restore coverage, then rerun focused tests.

### Task 6: Resilience, privacy, timing, and UI feedback

**Files:**
- Modify: `docs/sync-yjs.js`
- Modify: `docs/sync-watchdog.js`
- Modify: `docs/sync-latencia.js`
- Modify: `docs/index.html` or the existing sync status UI module
- Create or modify: browser integration tests under `test/`

**Interfaces:**
- Sync metrics record operation class, shell, network and foreground conditions, local commit time, peer durable commit time, and peer visible-render time; no business payload or PIN is recorded.
- Pending/offline and storage failure states remain visible and high contrast.

- [ ] Add browser integration coverage for offline bidirectional edits followed by reconnect, two tabs, clock skew, reload/restart, and a clean profile joining an online peer.
- [ ] Capture relay test frames and assert they contain ciphertext/protocol metadata only; inspect test telemetry for absence of patient, financial, photo, and PIN values.
- [ ] Assert connected/awake mutation classes reach remote persistence and visible rendering within 2,000 ms; mark offline intervals as unmeasured until reconnection.
- [ ] Run the new browser tests red and implement bounded batches, reconnect cursors, and domain UI events only where gaps are demonstrated.
- [ ] Verify degraded-state copy against the readability rule and rerun the full suite.

### Task 7: Production release and live evidence

**Files:**
- Modify as needed: `docs/sw.js`, `docs/version.json`, `docs/version-manifest.json`
- Modify only implementation and test files proven necessary in Tasks 1–6
- Record the `$ship-jfc` verification receipt and release evidence in the private operational location

**Interfaces:**
- Consumes passing Tasks 1–6 and the unchanged Consultorio release policy.
- Produces a direct-to-Pages-branch commit with cache-busted live read-back evidence; no temporary public progress branch.

- [ ] Back up each existing file before its release edit and record SHA-256, bytes, and line count.
- [ ] Review the full diff and run `node --test test/*.test.js`, JavaScript syntax checks for changed files, and `check-sw.sh`.
- [ ] Increment the `c123-shell-vNN` integer only if shell assets changed, regenerate `docs/version-manifest.json`, and verify version consistency.
- [ ] Stage only intended files and run `C:\Users\JFC\.codex\skills\ship-jfc\scripts\record-ship-verification.ps1` in Windows PowerShell 5.1.
- [ ] Confirm the remote base, commit and push without force, wait for Pages deployment, then fetch live version, Service Worker, manifest, and changed assets with cache busting.
- [ ] Report automated cross-replica evidence separately from physical PC/phone adoption checks.

## Deferred release lots

Retail terminology cleanup, broad mobile/header polish, exact footer brand treatment, agenda, longitudinal clinical history, and lord/canary diagnostics stay in separate follow-up specs after core data integrity and recovery are released.
