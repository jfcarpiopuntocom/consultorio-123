const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const domain = require('../docs/sync-domain.js');

test('index loads sync rules before local state and sync bridge scripts', () => {
  const html = fs.readFileSync(path.join(__dirname, '../docs/index.html'), 'utf8');
  const rules = html.indexOf('src="./sync-domain.js"');
  const state = html.indexOf('src="./mock-backend.js"');
  const sync = html.indexOf('src="./sync-yjs.js"');
  assert.ok(rules >= 0 && rules < state && state < sync);
});

test('compareRevision orders counters then stable actor ids', () => {
  assert.equal(domain.compareRevision({ c: 2, d: 'b' }, { c: 1, d: 'z' }), 1);
  assert.equal(domain.compareRevision({ c: 2, d: 'a' }, { c: 2, d: 'b' }), -1);
  assert.equal(domain.compareRevision({ c: 2, d: 'a' }, { c: 2, d: 'a' }), 0);
});

test('mergeEntity accepts intentional blank edits and keeps a newer tombstone', () => {
  const local = { id: 'p1', name: 'Paciente', phone: '555', rev: { c: 4, d: 'a' }, borrado: false };
  const blankEdit = { ...local, phone: '', rev: { c: 5, d: 'a' } };
  const deleted = { ...local, rev: { c: 6, d: 'b' }, borrado: true };
  const blankResult = domain.mergeEntity(local, blankEdit);
  assert.equal(blankResult.changed, true);
  assert.equal(blankResult.entity.phone, '');
  const deletedResult = domain.mergeEntity(blankResult.entity, deleted);
  const staleReplay = domain.mergeEntity(deletedResult.entity, blankEdit);
  assert.equal(deletedResult.entity.borrado, true);
  assert.equal(staleReplay.entity.borrado, true);
  assert.equal(staleReplay.changed, false);
});

test('mergeEntity allows an explicit higher-revision restoration', () => {
  const deleted = { id: 'p1', rev: { c: 6, d: 'b' }, borrado: true };
  const restored = { id: 'p1', rev: { c: 7, d: 'a' }, borrado: false, restauradoDeRev: { c: 6, d: 'b' } };
  const result = domain.mergeEntity(deleted, restored);
  assert.equal(result.changed, true);
  assert.equal(result.entity.borrado, false);
  assert.equal(result.entity.rev.c, 7);
});

test('mergeEntity converges deterministically when a peer reuses the same revision', () => {
  const a = { id: 'p1', name: 'A', rev: { c: 4, d: 'same-device' } };
  const b = { id: 'p1', name: 'B', rev: { c: 4, d: 'same-device' } };
  const ab = domain.mergeEntity(a, b).entity;
  const ba = domain.mergeEntity(b, a).entity;
  assert.equal(ab.name, ba.name);
});

test('mergeEntity returns a detached copy of nested revision and fields', () => {
  const incoming = { id: 'p1', rev: { c: 1, d: 'phone' }, profile: { notes: 'private test note' } };
  const result = domain.mergeEntity(null, incoming);
  incoming.rev.c = 99;
  incoming.profile.notes = 'mutated after merge';
  assert.equal(result.entity.rev.c, 1);
  assert.equal(result.entity.profile.notes, 'private test note');
});

test('mergeFact deduplicates identical content and preserves collision evidence across merges', () => {
  const original = { id: 'pay1', hash: 'h1', amount: 25 };
  const first = domain.mergeFact({}, original);
  assert.equal(first.status, 'inserted');
  const duplicate = domain.mergeFact(first, { ...original });
  assert.equal(duplicate.status, 'duplicate');
  const collision = domain.mergeFact(duplicate, { id: 'pay1', hash: 'h2', amount: 50 });
  assert.equal(collision.status, 'collision');
  assert.equal(collision.factsById.pay1.amount, 25);
  assert.deepEqual(collision.collisions.pay1.map((fact) => fact.hash), ['h1', 'h2']);
  const nextCollision = domain.mergeFact(collision, { id: 'pay1', hash: 'h3', amount: 60 });
  assert.deepEqual(nextCollision.collisions.pay1.map((fact) => fact.hash), ['h1', 'h2', 'h3']);
});

test('mergeFact treats same hash with different content as a collision and handles hostile ids safely', () => {
  const first = domain.mergeFact({}, { id: '__proto__', hash: 'h1', amount: 25 });
  const mismatch = domain.mergeFact(first, { id: '__proto__', hash: 'h1', amount: 99 });
  assert.equal(mismatch.status, 'collision');
  assert.equal(mismatch.factsById['__proto__'].amount, 25);
  assert.equal({}.polluted, undefined);
});

test('mergeInventory retains independent offline deductions and ignores replay', () => {
  const baseline = 10;
  const first = { id: 'op-a', deviceId: 'phone', delta: -2 };
  const second = { id: 'op-b', deviceId: 'laptop', delta: -3 };
  const afterFirst = domain.mergeInventory(baseline, {}, first);
  const afterBoth = domain.mergeInventory(afterFirst.base, afterFirst.counters, second);
  const replay = domain.mergeInventory(afterBoth.base, afterBoth.counters, first);
  assert.equal(afterBoth.quantity, 5);
  assert.equal(replay.quantity, 5);
  assert.equal(replay.counters.byDevice.phone.negative, 2);
  assert.equal(replay.counters.byDevice.laptop.negative, 3);
});
test('subsequent collisions do not mutate earlier evidence snapshots', () => {
  const domain = require('../docs/sync-domain.js');
  let state = domain.mergeFact({}, { id: 'x', hash: 'a', amount: 1 });
  state = domain.mergeFact(state, { id: 'x', hash: 'b', amount: 2 });
  const before = JSON.stringify(state);
  const next = domain.mergeFact(state, { id: 'x', hash: 'c', amount: 3 });
  assert.equal(JSON.stringify(state), before);
  assert.equal(next.collisions.x.length, 3);
});
