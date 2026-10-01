/* Deterministic merge primitives for shared Consultorio business records.
 * This module is deliberately storage-, transport-, and DOM-independent.
 */
(function attachSyncDomain(root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.OCSyncDomain = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createSyncDomain() {
  'use strict';

  function isRecord(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function cloneRecord(value) {
    if (!isRecord(value)) throw new TypeError('Expected a plain record');
    const encoded = canonical(value);
    return JSON.parse(encoded);
  }

  function cloneMap(value) {
    if (value == null) return Object.create(null);
    if (!isRecord(value)) throw new TypeError('Expected a record map');
    return Object.assign(Object.create(null), value);
  }

  function validateRevision(revision) {
    if (!isRecord(revision) || !Number.isSafeInteger(revision.c) || revision.c < 0 ||
        typeof revision.d !== 'string') {
      throw new TypeError('Revision must contain a non-negative safe integer counter and string actor');
    }
  }

  function compareRevision(a, b) {
    validateRevision(a);
    validateRevision(b);
    if (a.c !== b.c) return a.c < b.c ? -1 : 1;
    if (a.d === b.d) return 0;
    return a.d < b.d ? -1 : 1;
  }

  function canonical(value) {
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (isRecord(value)) {
      const keys = Object.keys(value).sort();
      return '{' + keys.map((key) => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
    }
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new TypeError('Entity must contain JSON-compatible values');
    return encoded;
  }

  function mergeEntity(local, incoming) {
    if (!isRecord(incoming) || typeof incoming.id !== 'string' || !incoming.id) {
      throw new TypeError('Entity must have a stable string id');
    }
    validateRevision(incoming.rev);
    if (local == null) return { entity: cloneRecord(incoming), changed: true };
    if (!isRecord(local) || local.id !== incoming.id) throw new TypeError('Entity ids must match');
    validateRevision(local.rev);

    const order = compareRevision(local.rev, incoming.rev);
    if (order > 0) return { entity: cloneRecord(local), changed: false };
    if (order < 0) return { entity: cloneRecord(incoming), changed: true };

    // Identical logical revisions should be identical records. A stable content
    // tie-break preserves convergence if a corrupt or buggy peer reuses a rev.
    const localText = canonical(local);
    const incomingText = canonical(incoming);
    if (localText === incomingText) return { entity: cloneRecord(local), changed: false };
    return incomingText > localText
      ? { entity: cloneRecord(incoming), changed: true }
      : { entity: cloneRecord(local), changed: false };
  }

  function cloneJsonRecord(value) {
    if (!isRecord(value)) throw new TypeError('Expected an immutable fact record');
    const encoded = JSON.stringify(value);
    if (encoded === undefined) throw new TypeError('Fact must contain JSON-compatible values');
    return JSON.parse(encoded);
  }

  function mergeFact(factState, incoming) {
    if (!isRecord(incoming) || typeof incoming.id !== 'string' || !incoming.id ||
        typeof incoming.hash !== 'string' || !incoming.hash) {
      throw new TypeError('Fact must have a stable string id and content hash');
    }
    const isState = isRecord(factState) && isRecord(factState.factsById) && isRecord(factState.collisions);
    const facts = cloneMap(isState ? factState.factsById : factState);
    const collisions = cloneMap(isState ? factState.collisions : null);
    const candidate = cloneJsonRecord(incoming);
    if (!Object.prototype.hasOwnProperty.call(facts, incoming.id)) {
      facts[incoming.id] = candidate;
      return { factsById: facts, status: 'inserted', collisions };
    }

    const existing = facts[incoming.id];
    if (existing.hash === incoming.hash && canonical(existing) === canonical(candidate)) {
      return { factsById: facts, status: 'duplicate', collisions };
    }

    const evidence = (collisions[incoming.id] || [existing]).map(cloneJsonRecord);
    if (!evidence.some((fact) => fact.hash === incoming.hash && canonical(fact) === canonical(candidate))) evidence.push(candidate);
    collisions[incoming.id] = evidence;
    return { factsById: facts, status: 'collision', collisions };
  }

  function mergeInventory(base, counters, operation) {
    if (typeof base !== 'number' || !Number.isFinite(base)) throw new TypeError('Inventory base must be finite');
    if (!isRecord(operation) || typeof operation.id !== 'string' || !operation.id ||
        typeof operation.deviceId !== 'string' || !operation.deviceId ||
        typeof operation.delta !== 'number' || !Number.isFinite(operation.delta) || operation.delta === 0) {
      throw new TypeError('Inventory operation must have an id, device id, and non-zero finite delta');
    }

    const prior = isRecord(counters) ? counters : Object.create(null);
    const operations = cloneMap(prior.operations);
    const conflicts = cloneMap(prior.conflicts);
    const previous = operations[operation.id];
    const normalized = { id: operation.id, deviceId: operation.deviceId, delta: operation.delta };
    let status = 'applied';
    if (previous) {
      if (previous.deviceId === normalized.deviceId && previous.delta === normalized.delta) {
        status = 'duplicate';
      } else {
        status = 'collision';
        const evidence = (conflicts[operation.id] || [previous]).map(cloneJsonRecord);
        if (!evidence.some((item) => item.deviceId === normalized.deviceId && item.delta === normalized.delta)) {
          evidence.push(normalized);
        }
        conflicts[operation.id] = evidence;
      }
    } else {
      operations[operation.id] = normalized;
    }

    const byDevice = Object.create(null);
    let deltaTotal = 0;
    for (const op of Object.keys(operations).sort().map(id => operations[id])) {
      if (!byDevice[op.deviceId]) byDevice[op.deviceId] = { positive: 0, negative: 0 };
      if (op.delta > 0) byDevice[op.deviceId].positive += op.delta;
      else byDevice[op.deviceId].negative += Math.abs(op.delta);
      deltaTotal += op.delta;
    }
    return {
      base,
      counters: { operations, conflicts, byDevice },
      quantity: base + deltaTotal,
      status
    };
  }

  // Both the durable adapter and the Yjs publisher use this same join. A
  // revision selects editable fields, never the append-only history/counters.
  function mergeShared(local, incoming, collection) {
    const normalize = r => r && { ...r, rev: r.rev || { c: 0, d: '' } };
    const result = mergeEntity(normalize(local), normalize(incoming)).entity;
    if (collection === 'clientes') {
      const history = new Map();
      [local, incoming].forEach(r => ((r && r.evaluacion && r.evaluacion.historial) || []).forEach(h => {
        const key = h.id || canonical(h), prior = history.get(key);
        if (prior && canonical(prior) !== canonical(h)) throw new Error('Conflicting clinical history');
        history.set(key, cloneRecord(h));
      }));
      if (history.size) result.evaluacion = { ...(result.evaluacion || {}), historial: [...history.keys()].sort().map(k => history.get(k)) };
    }
    if (collection === 'productos') {
      const baseOf = r => r && Number.isFinite(r.stockBase) ? r.stockBase : r && Number.isFinite(r.stockActual) ? r.stockActual : null;
      const a = baseOf(local), b = baseOf(incoming);
      if (a !== null && b !== null && a !== b) throw new Error('Incompatible inventory baseline');
      const base = a === null ? b : a;
      if (base !== null) {
        const pn = Object.create(null);
        [local, incoming].forEach(r => Object.entries(r && r.stockPN || {}).forEach(([id, v]) => {
          if (!Number.isFinite(v.add) || !Number.isFinite(v.sub) || v.add < 0 || v.sub < 0) throw new Error('Invalid inventory counter');
          const p = pn[id] || { add: 0, sub: 0 };
          pn[id] = { add: Math.max(p.add, v.add), sub: Math.max(p.sub, v.sub) };
        }));
        result.stockBase = base; result.stockPN = pn;
        result.stockActual = base + Object.keys(pn).sort().reduce((n, id) => n + pn[id].add - pn[id].sub, 0);
        if ((local && local.stockOps) || incoming.stockOps) {
          let ledger = { operations: {} }, quantity = base;
          [local, incoming].forEach(r => Object.values(r && r.stockOps || {}).forEach(op => {
            const merged = mergeInventory(base, ledger, op);
            if (merged.status === 'collision') throw new Error('Conflicting inventory operation');
            ledger = merged.counters; quantity = merged.quantity;
          }));
          result.stockOps = ledger.operations; result.stockActual = quantity;
        }
      }
    }
    return result;
  }
  return Object.freeze({ compareRevision, mergeEntity, mergeFact, mergeInventory, mergeShared });
});
