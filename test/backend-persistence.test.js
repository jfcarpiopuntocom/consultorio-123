const { test } = require('node:test');
const assert = require('node:assert/strict');
const { browser, storage } = require('./helpers/browser.cjs');
function fixture() {
  const ls = storage(); ls.setItem('c123_owned', JSON.stringify({ instanceId: 'synthetic-storage' }));
  const w = browser(ls); w.OCAuth = { rolActual: () => 'dueno' };
  return { w, ls };
}
test('a business-name mutation takes exactly one durable snapshot', async () => {
  const { w } = fixture();
  let writes = 0;
  w.OCEstadoIDB = { guardar: async () => { writes++; return true; } };
  await w.request('/api/instancia/nombre', 'POST', { nombre: 'Synthetic Clinic' });
  assert.equal(writes, 1);
});
test('rejected input does not advance the persisted state revision', async () => {
  const { w } = fixture();
  const before = JSON.stringify(w.OCSync.estadoParaCheckpoint());
  await assert.rejects(() => w.request('/api/clientes', 'POST', { nombre: '' }), /400/);
  assert.equal(JSON.stringify(w.OCSync.estadoParaCheckpoint()), before);
});
test('failed local and IndexedDB storage rejects a sale without emitting or keeping its stock change', async () => {
  const { w, ls } = fixture();
  const p = (await w.request('/api/productos')).find(x => x.stockActual > 3);
  const before = JSON.stringify(w.OCSync.estadoParaCheckpoint());
  const emitted = []; w.OCSyncEmit = (...args) => emitted.push(args);
  ls.setItem = () => { throw new Error('Synthetic quota exceeded'); };
  w.OCEstadoIDB = { guardar: async () => false };
  await assert.rejects(() => w.request('/api/productos/' + p.id + '/venta', 'POST', { cantidad: 1 }), /507/);
  assert.equal(emitted.length, 0);
  assert.equal(JSON.stringify(w.OCSync.estadoParaCheckpoint()), before);
});
test('IndexedDB fallback must commit before the API returns success or publishes a sale', async () => {
  const { w, ls } = fixture();
  const p = (await w.request('/api/productos')).find(x => x.stockActual > 3);
  const emitted = []; w.OCSyncEmit = (...args) => emitted.push(args);
  ls.setItem = () => { throw new Error('Synthetic quota exceeded'); };
  let finish;
  w.OCEstadoIDB = { guardar: () => new Promise(resolve => { finish = resolve; }) };
  let done = false;
  const request = w.request('/api/productos/' + p.id + '/venta', 'POST', { cantidad: 1 }).then(r => { done = true; return r; });
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(done, false); assert.equal(emitted.length, 0);
  finish(true); await request;
  assert.equal(emitted.length, 1);
});
