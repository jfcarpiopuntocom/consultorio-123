const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { storage } = require('./helpers/browser.cjs');
const tick = () => new Promise(resolve => setImmediate(resolve));
function load(file, context) {
  context.window = context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../docs', file), 'utf8'), context);
  return context;
}
test('IndexedDB isolation reports success and resists later method replacement', () => {
  const names = [];
  const w = load('aislamiento.js', {
    localStorage: storage(), sessionStorage: storage(), console,
    indexedDB: { open: n => names.push(n), deleteDatabase: n => names.push(n) },
    document: { getElementById() {}, readyState: 'loading', addEventListener() {} }
  });
  assert.equal(w.AMG.Aislamiento.idbInstalado, true);
  w.indexedDB.open('state');
  w.indexedDB.open = n => names.push('unisolated:' + n);
  w.indexedDB.open('state');
  w.indexedDB.deleteDatabase(12);
  assert.deepEqual(names, ['c123::state', 'c123::state', 'c123::12']);
});
test('failed isolation blocks raw IndexedDB access instead of touching a sibling database', () => {
  const raw = {};
  Object.defineProperty(raw,'open',{value:()=>{throw new Error('raw database touched');},configurable:false});
  const w = load('aislamiento.js', {
    localStorage:storage(),sessionStorage:storage(),console:{error(){}},indexedDB:raw,
    document:{getElementById(){},readyState:'loading',addEventListener(){}}
  });
  assert.equal(w.AMG.Aislamiento.idbInstalado,false);
  assert.throws(()=>w.indexedDB.open('sibling'),/aislamiento/i);
});
function mirror() {
  const transactions = [];
  const timers = new Map();
  let timerId = 0;
  const db = {
    transaction() {
      const tx = { objectStore: () => ({ put: value => { tx.value = value; } }) };
      transactions.push(tx);
      return tx;
    }
  };
  const w = load('estado-idb.js', {
    indexedDB: { open() {
      const req = {};
      queueMicrotask(() => { req.result = db; req.onsuccess(); });
      return req;
    } },
    setTimeout(fn) { timers.set(++timerId, fn); return timerId; },
    clearTimeout(id) { timers.delete(id); }, navigator: {},
    console: { error() {} }
  });
  return { api: w.OCEstadoIDB, transactions, flush() {
    const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(fn => fn());
  } };
}
test('buffered save waits for its own transaction and propagates its failure', async () => {
  const f = mirror();
  const first = f.api.guardar({ _rev: 1 });
  const second = f.api.guardar({ _rev: 2 });
  let secondSettled = false;
  second.then(() => { secondSettled = true; });
  await tick();
  f.transactions[0].oncomplete();
  assert.equal(await first, true);
  await tick();
  assert.equal(secondSettled, false);
  f.flush(); await tick();
  assert.equal(f.transactions[1].value._rev, 2);
  f.transactions[1].onabort();
  assert.equal(await second, false);
});
test('save snapshots data before the asynchronous database open', async () => {
  const f = mirror();
  const source = { _rev: 1, patient: { name: 'Synthetic A' } };
  const saved = f.api.guardar(source);
  source.patient.name = 'Synthetic B';
  await tick();
  assert.equal(f.transactions[0].value.patient.name, 'Synthetic A');
  f.transactions[0].oncomplete();
  assert.equal(await saved, true);
});
test('immediate save flushes older buffered snapshots before the new state', async () => {
  const f = mirror();
  const first = f.api.guardar({ _rev: 1 });
  const second = f.api.guardar({ _rev: 2 });
  await tick(); f.transactions[0].oncomplete(); await first;
  const third = f.api.guardarYa({ _rev: 3 });
  await tick();
  assert.equal(f.transactions[1].value._rev, 2);
  f.transactions[1].oncomplete(); await second; await tick();
  assert.equal(f.transactions[2].value._rev, 3);
  f.transactions[2].oncomplete(); assert.equal(await third, true);
  f.flush(); await tick(); assert.equal(f.transactions.length, 3);
});
