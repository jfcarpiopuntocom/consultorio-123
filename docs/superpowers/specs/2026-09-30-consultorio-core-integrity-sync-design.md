# Consultorio Core Integrity and Sync Design

**Date:** 2026-09-30
**Status:** Approved conversational design, written specification pending user review
**Product:** consultorio-123
**First delivery program:** operational and polish parity with friendly-123 while preserving Consultorio's medical and financial domain

## 1. Intent

Bring consultorio-123 to the reliability standard already reached by friendly-123 without turning it into a retail app. The first implementation lot establishes a trustworthy data foundation: every shared business record must survive local persistence, synchronize correctly across licensed devices, appear in the remote UI within two seconds when both devices are online and awake, and remain recoverable through a user-owned export.

This lot protects the existing Consultorio scope: patients, care/charges, accounts receivable, financial facts, clinical inventory, locations, team access, business identity, and photos. Agenda, longitudinal clinical history, retail-language removal, and broad visual polish are later lots built on this foundation.

The newer global JFC instruction requiring all shared business data to synchronize supersedes the 2026-09-08 local note that excluded patients from peer sync. Patient and financial payloads may travel only through the existing end-to-end encrypted channel. They must never be written in plaintext to Cloudflare, license telemetry, logs, public notes, or test fixtures.

## 2. Success Criteria

The lot is successful only when all of the following are evidenced:

1. Creates, edits, deactivations/deletions, and restorations converge for every shared entity in scope.
2. Money, inventory, history, and photos are preserved under duplication, reordering, concurrency, offline work, reconnect, reload, and device restart.
3. A connected remote device persists the mutation and updates its visible UI within 2,000 ms under recorded test conditions. Offline or suspended devices make no delivery promise until they reconnect.
4. A new clean browser profile can recover the canonical business state from an online licensed peer, and can independently recover it from a verified user export.
5. Export followed by restore preserves normalized records, financial totals, stock, history, and photo hashes.
6. The relay and private license panel reveal no patient, financial, PIN, inventory, or photo content.
7. Existing installations upgrade without destructive reset, room purge, forced reactivation, or loss of older records.
8. The release passes the full local suite, focused cross-device tests, Service Worker integrity checks, deployment, live read-back, and an honest statement of any physical-device checks not performed.

## 3. Scope Boundaries

### In scope

- Repair the IndexedDB isolation failure currently reported by `aislamiento.js`.
- Define and enforce one canonical shared-data contract.
- Synchronize patients, care/charge records, accounts-receivable facts, cash/financial facts, expenses, inventory, transfers, locations, categories, team records, business identity, and product/patient-related photos that exist in the current product.
- Support create, edit, deactivate/delete, restore/reactivate, and import semantics appropriate to each record type.
- Make remote persistence and visible refresh part of the sync acceptance path.
- Preserve four-digit Consultorio PIN behavior and role restrictions.
- Expand automated coverage using synthetic data and the real product modules.
- Keep the legacy realtime path temporarily for backward compatibility until the Yjs path is proven and adopted.

### Out of scope for this lot

- New agenda and clinical-history features.
- Broad UI redesign or visual polish beyond the minimum sync/error states required for safe operation.
- Deleting legacy retail-shaped arrays or real records. Legacy data is preserved until a later migration explicitly proves it is disposable.
- Storing recoverable patient data in plaintext on any server.
- Replacing Yjs, inventing a third sync engine, or migrating to a framework.
- Purging production rooms, resetting live browsers, or modifying customer data for tests.

## 4. Current Gaps This Design Resolves

- `sync-yjs.js` declares patients/clients and several financial collections, but `OCSync.catalogoPropio()` does not publish patients and `aplicarCatalogo()` does not apply them.
- Mutable catalogue records still contain add-only or role-based merge paths that cannot reliably propagate edits, tombstones, or restorations.
- `aplicarOpRemota()` primarily understands product stock deltas and cannot by itself prove correct patient, expense, transfer, charge, or payment convergence.
- The browser reports that another script overwrote the IndexedDB isolation wrapper, creating cross-app database risk.
- Export includes important arrays, but full recovery coverage for IndexedDB facts and photos is not established.
- Tests cover only a small financial baseline and do not exercise real two-replica convergence.
- Retail remnants such as perchas, commissions, and an AMIGABLE QR remain; they are catalogued for the domain-cleanup lot rather than mixed into the integrity repair.

## 5. Architecture

The implementation will repair the existing local-first stack in place:

### 5.1 `sync-domain.js`: pure merge rules

Add a focused module containing deterministic, side-effect-free rules for:

- logical revisions `{ c, d }` using a Lamport counter and stable device actor;
- revision comparison and deterministic tie-breaking;
- tombstone and restoration semantics;
- normalized canonical snapshots;
- per-device inventory counters and legacy-base compatibility;
- collision detection for immutable facts;
- content-hash references for photos.

This module contains no network, DOM, IndexedDB, or customer-specific constants. It exists so the dangerous rules can be tested without loading the entire application.

### 5.2 `mock-backend.js`: canonical local state adapter

The current backend remains the authoritative adapter for local business state. It will:

- stamp every local mutable record with a new logical revision;
- retain tombstones instead of splicing shared records out of existence;
- expose a complete canonical snapshot through `OCSync.catalogoPropio()`;
- apply remote entities through the pure merge rules;
- emit stable, idempotent operations only after the local mutation has persisted;
- report persistence failure instead of confirming success;
- notify the UI after a committed remote merge.

The large file is not broadly refactored. Only merge logic moves to `sync-domain.js`; route behavior remains in place to minimize migration risk.

### 5.3 `sync-yjs.js`: encrypted transport bridge

Yjs continues to provide shared maps, offline persistence, deduplication, and relay transport. The bridge will:

- publish canonical entity records by stable ID;
- publish immutable facts and business operations by operation ID;
- import remote changes in bounded batches without debounce starvation;
- skip self-originated operations while still reconciling canonical entity state;
- persist cursors/checkpoints locally so reconnect does not replay an unbounded history;
- pass committed merge results to the UI event path;
- transport only ciphertext over the relay.

Yjs convergence is not treated as proof of application correctness. Tests must verify the real local stores, visible UI, and totals on both replicas.

### 5.4 IndexedDB stores

- `hechos.js` remains the append-only source for accounts-receivable and cash facts.
- `idb-fotos.js` remains the content store for photo blobs and gains verified export/restore coverage.
- `estado-idb.js` remains the durable complete-state mirror.
- `aislamiento.js` must be the effective IndexedDB namespace boundary after every script loads. Startup fails visibly into a safe degraded state if isolation cannot be established; it never silently shares a sister app's database.

### 5.5 Legacy realtime compatibility

`sync-realtime.js` stays active during migration as a compatibility channel for older shells. The new canonical merge functions must make duplicate delivery from legacy realtime and Yjs harmless. Removing the old path requires a later release with measured adoption and its own rollback plan.

## 6. Shared Data Contract

### 6.1 Mutable entities

Patients, products/supplies, locations/offices, categories, team members, expenses that may be corrected, transfer records, and business identity use:

```text
id: stable string
rev: { c: non-negative integer, d: stable device actor }
borrado: boolean
restauradoDeRev: optional prior revision reference
updatedAt: informational ISO timestamp, never the primary conflict clock
```

An edit or state transition creates a higher revision. A deletion is a winning tombstone, not physical removal. A restore is a later explicit revision with `borrado:false`; stale snapshots cannot resurrect records.

An intentionally blank optional value is a real edit and must not be replaced by an older nonblank value.

### 6.2 Immutable financial and clinical facts

Charges, payments, credits, cash facts, and audit movements are append-only facts with stable IDs and content hashes. Re-delivery is idempotent. Receiving the same ID with different content is a collision: preserve both evidence paths, stop automatic application for that ID, and show an owner-visible integrity warning. Corrections are compensating facts, never silent history rewrites.

### 6.3 Care/charge records

Existing `ventas` records are treated as Consultorio care/charge records for compatibility during this lot. Their monetary values, patient reference, quantity, unit price/cost, date, status, and revision travel together. Later domain cleanup may rename the public and internal concepts through a reversible migration; this lot does not change IDs or recalculate history.

### 6.4 Inventory

Current stock is derived from a stable baseline plus per-device positive and negative counters or equivalent idempotent deltas. Two offline deductions must both survive. Legacy snapshots with incompatible bases must not overwrite each other silently; they produce a recoverable conflict requiring reconciliation.

Rejected or failed care/charge operations never decrement stock. Returns and cancellations use explicit inverse operations tied to the original record.

### 6.5 Photos

Entity records carry a content hash and explicit photo state: present, replaced, or removed. Blobs are stored and transported by hash. Arrival order of metadata and blob is irrelevant. Replacement and deletion must converge without an older blob reappearing.

### 6.6 Device-local data

Language, open view, session state, temporary tokens, local diagnostic flags, Service Worker caches, retry timers, and other presentation/runtime preferences do not synchronize. PINs and access material never enter telemetry or logs; team access required on peer devices travels only inside the end-to-end encrypted business channel.

## 7. Mutation and Delivery Flow

1. Validate the user action and role locally.
2. Build the entity revision or immutable fact with a stable ID.
3. Persist it to the canonical local store.
4. Re-read or acknowledge the committed state.
5. Emit the Yjs/legacy-compatible operation.
6. On the peer, decrypt, deduplicate, validate, and merge in one bounded transaction.
7. Persist the merged canonical state and associated blob/fact.
8. Emit one domain-level UI event containing the committed IDs.
9. Re-render affected views and measure action-to-visible-peer time.

No success message appears before step 3 locally or step 7 in remote test assertions. A connected socket, heartbeat, Yjs map equality, or receipt of a frame is insufficient.

## 8. Failure Handling

- **Storage quota or IndexedDB failure:** retain the last good double-buffer state, show a high-contrast persistent warning, and never claim the mutation was saved.
- **Relay unavailable:** queue encrypted operations locally with bounded retry and exponential backoff; show offline/pending state without promising delivery time.
- **Duplicate or reordered messages:** deduplicate by operation ID and merge entities by logical revision.
- **Clock skew:** wall-clock timestamps remain descriptive only; Lamport revisions determine mutable winners.
- **Unknown legacy record:** preserve it in export and diagnostics; do not delete or coerce it silently.
- **Base mismatch or fact collision:** stop automatic overwrite, preserve both evidence sets, and require explicit reconciliation.
- **Missing photo blob:** keep the hash and placeholder, continue requesting the blob, and never discard metadata.
- **Old client:** server/relay behavior remains backward compatible; new-only features fail closed without destroying the old client's local state.

All warnings must obey the absolute readability rule. No meaningful message may use weak gray or opacity.

## 9. Migration and Compatibility

1. Before edits, copy every affected existing file to a private backup with SHA-256, bytes, and line count.
2. Record the clean Git base and remote base. Preserve unrelated work.
3. Introduce pure merge rules and red tests before changing production paths.
4. Read existing state without rewriting it on startup.
5. Lazily stamp legacy records when they are first mutated or safely seeded; never assign one bulk revision that can defeat a real newer peer edit.
6. Preserve old IDs, amounts, dates, photo hashes, and access behavior.
7. Keep the old realtime channel until adoption and rollback evidence justify removal.
8. Do not purge relay rooms, browser stores, backups, or production records.

## 10. Verification Matrix

Automated tests use two or three isolated browser contexts, synthetic licenses, and fictional records. They must exercise the real modules rather than regex-presence checks.

### Entities and UI

- Patient create, edit, intentional blank contact, deactivate/delete, and restore.
- Patient rating/notes/history merge without losing prior facts.
- Product/supply create, edit, archive/delete, restore, category, cost, price, thresholds, expiry, and location.
- Team create, PIN change, role change, deactivate, delete tombstone, restore, and remote login/revocation.
- Business name and office/location changes without stale header repaint.

### Money and stock

- Two offline deductions from the same stock baseline preserve both operations.
- Rejected charge does not alter stock or money.
- Charge, payment, credit, refund/cancellation, expense, transfer, and correction remain idempotent.
- Financial totals on both replicas equal the expected totals, not merely each other.
- Restart and replay do not duplicate money or stock.

### Photos and ordering

- Metadata before blob, blob before metadata, replacement, removal, and stale replay.
- Duplicate and reversed-order Yjs/legacy delivery.
- Large update chunking and reconnect after an interrupted chunk sequence.

### Resilience

- Offline bidirectional edits followed by reconnect.
- Two tabs on one device and two devices with skewed clocks.
- Reload, browser restart, new clean profile from an online peer.
- Full export, import into clean storage, and comparison of canonical state, totals, and photo hashes.
- Quota failure and interrupted persistence retain the last known good state.

### Privacy and timing

- Captured WebSocket/relay payloads contain ciphertext and protocol metadata only.
- License panel/check-in contains no business records or PINs.
- For each supported mutation class, measure local action to remote persistence and visible render; connected runs must be at or under 2,000 ms. Record network, device, shell, and foreground/background conditions.

## 11. Release Contract

Every production batch follows `$ship-jfc`:

1. Recoverable pre-edit backup with SHA-256, bytes, and lines.
2. Red regression proving the defect when practical.
3. Narrow implementation and complete diff review.
4. Focused tests, then `node --test --test-isolation=none test/*.test.js`.
5. Syntax checks for changed JavaScript.
6. Increment only the `c123-shell-vNN` integer in `docs/sw.js` and `docs/version.json`; keep public version policy unchanged.
7. Regenerate `docs/version-manifest.json` and pass `check-sw.sh`.
8. Stage only intended files and record the ship-verification receipt.
9. Confirm the remote base, commit, and push without force or a temporary public progress branch.
10. Wait for Pages deployment and read back live version, Service Worker, manifest, and changed assets with cache busting.
11. Distinguish local verification, provider deployment, live HTTP read-back, and physical-device adoption.

## 12. Subsequent Lots

After this lot is implemented and released:

1. **Recovery parity:** broaden sovereign backup UX, scheduled assurance, clean-device restore, and recovery drills.
2. **Consultorio domain:** remove retail remnants, make terminology medical/financial, and add agenda plus longitudinal patient history through separate approved specs.
3. **Operational UI polish:** compact mobile header/navigation, complete-corner cards, exact footer brand line, Spanish consistency, accessible states, and lord/canary-gated diagnostics.
4. **Physical acceptance:** PC/phone convergence, Safari behavior, offline/reconnect, Service Worker adoption, and documented end-to-end timing.

Each subsequent lot receives its own focused specification and plan. They must not be mixed into the core-integrity release.
