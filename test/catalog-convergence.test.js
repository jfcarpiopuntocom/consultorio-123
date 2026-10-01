const { test } = require('node:test');
const assert = require('node:assert/strict');
const { browser, storage } = require('./helpers/browser.cjs');
function replica(id, ls = storage()) {
  ls.setItem('c123_owned', JSON.stringify({ instanceId: 'synthetic-convergence' }));
  ls.setItem('c123_device_id', id);
  const w = browser(ls); w.OCAuth = { rolActual: () => 'dueno' }; return { w, ls };
}
async function supply(w) {
  return w.request('/api/productos', 'POST', { nombre: 'Synthetic Supply', barcode: 'SYN-1', precio: 12, costo: 4, stockInicial: 10, umbralRojo: 1, umbralAmarillo: 3 });
}
test('supply metadata, blank fields, tombstones and restart resist stale snapshots', async () => {
  const a = replica('a'), b = replica('b');
  const p = await supply(a.w); await b.w.receive(a.w);
  assert.equal(b.w.catalog().productos.find(x => x.id === p.id).stockActual, 10);
  await b.w.request('/api/productos/' + p.id, 'PATCH', { nombre: 'Edited supply', categoria: '', proveedor: '', costo: 5, precioCasa: null });
  await a.w.receive(b.w);
  assert.equal(a.w.catalog().productos.find(x => x.id === p.id).categoria, '');
  const stale = a.w.catalog();
  await b.w.request('/api/productos/' + p.id, 'DELETE'); await a.w.receive(b.w);
  await a.w.OCSync.aplicarCatalogo(stale);
  assert.equal(a.w.catalog().productos.find(x => x.id === p.id).borrado, true);
  const restarted = replica('a', a.ls);
  assert.equal(restarted.w.catalog().productos.find(x => x.id === p.id).borrado, true);
  await restarted.w.request('/api/productos/' + p.id + '/restaurar', 'POST'); await b.w.receive(restarted.w);
  assert.equal(b.w.catalog().productos.find(x => x.id === p.id).nombre, 'Edited supply');
  assert.equal(!!b.w.catalog().productos.find(x => x.id === p.id).borrado, false);
});
test('offline stock deductions and cancellation preserve quantities and original sale prices', async () => {
  const a = replica('a'), b = replica('b');
  const p = await supply(a.w); await b.w.receive(a.w);
  const sale = await a.w.request('/api/productos/' + p.id + '/venta', 'POST', { cantidad: 2, info: { precioOverride: 7 } });
  await b.w.request('/api/productos/' + p.id + '/venta', 'POST', { cantidad: 3 });
  const ca = a.w.catalog(), cb = b.w.catalog();
  await a.w.OCSync.aplicarCatalogo(cb); await b.w.OCSync.aplicarCatalogo(ca);
  for (const w of [a.w, b.w]) {
    assert.equal(w.catalog().productos.find(x => x.id === p.id).stockActual, 5);
    assert.equal(w.catalog().ventas.filter(v => v.productoId === p.id).reduce((n,v) => n + v.cantidad*v.precioUnit, 0), 50);
  }
  await a.w.request('/api/ventas/' + sale.ventaId + '/anular', 'POST');
  await b.w.receive(a.w); await b.w.OCSync.aplicarCatalogo(ca);
  assert.equal(b.w.catalog().productos.find(x => x.id === p.id).stockActual, 7);
  assert.equal(b.w.catalog().ventas.find(x => x.id === sale.ventaId).borrado, true);
});
test('replaying a canonical snapshot is a durable no-op', async () => {
  const a = replica('a'), b = replica('b'); await supply(a.w); await b.w.receive(a.w);
  const before = JSON.stringify(b.w.OCSync.estadoParaCheckpoint());
  await b.w.receive(a.w);
  assert.equal(JSON.stringify(b.w.OCSync.estadoParaCheckpoint()), before);
});
test('medical tariffs, periodic inventory and fixed costs converge including deletions', async () => {
  const a = replica('a'), b = replica('b');
  await a.w.OCSync.guardarDatos('tarifario', [{ id: 's1', nombre: 'Consultation', tarifa: 40 }]);
  await a.w.OCSync.guardarDatos('inventarioClinico', [{ id: 'i1', nombre: 'Supplies', inicial: 10, compras: 5, final: 4 }]);
  await b.w.receive(a.w);
  assert.equal(b.w.OCSync.leerDatos('tarifario')[0].tarifa, 40);
  await b.w.OCSync.guardarDatos('tarifario', []); await a.w.receive(b.w);
  assert.equal(a.w.OCSync.leerDatos('tarifario').length, 0);
  assert.equal(replica('a', a.ls).w.OCSync.leerDatos('inventarioClinico')[0].final, 4);
});
test('two offline cancellations of the same sale restore inventory only once', async () => {
  const a=replica('a'), b=replica('b'); const p=await supply(a.w);
  const sale=await a.w.request('/api/productos/'+p.id+'/venta','POST',{cantidad:2}); await b.w.receive(a.w);
  await a.w.request('/api/ventas/'+sale.ventaId+'/anular','POST');
  await b.w.request('/api/ventas/'+sale.ventaId+'/anular','POST');
  await a.w.receive(b.w); await b.w.receive(a.w);
  assert.equal(a.w.catalog().productos.find(x=>x.id===p.id).stockActual,10);
  assert.equal(b.w.catalog().productos.find(x=>x.id===p.id).stockActual,10);
});
test('patients converge through create, blank edit, deactivate, restore and restart', async () => {
  const a = replica('a'); const b = replica('b');
  const p = await a.w.request('/api/clientes', 'POST', { nombre: 'Synthetic Patient', telefono: '123' });
  await b.w.receive(a.w);
  assert.ok((await b.w.request('/api/clientes')).some(c => c.id === p.id));
  await b.w.request('/api/clientes/' + p.id, 'PATCH', { telefono: '' });
  const stale = a.w.catalog();
  await a.w.receive(b.w);
  assert.equal((await a.w.request('/api/clientes')).find(c => c.id === p.id).telefono, '');
  await b.w.request('/api/clientes/' + p.id + '/despedir', 'POST', {});
  await a.w.receive(b.w); await a.w.OCSync.aplicarCatalogo(stale, null);
  assert.equal((await a.w.request('/api/clientes')).some(c => c.id === p.id), false);
  await a.w.request('/api/clientes/' + p.id + '/reactivar', 'POST', {});
  await b.w.receive(a.w);
  const restarted = replica('b', b.ls);
  assert.ok((await restarted.w.request('/api/clientes')).some(c => c.id === p.id));
});
test('offline patient evaluations keep both history entries after bidirectional merge', async () => {
  const a = replica('a'); const b = replica('b');
  const p = await a.w.request('/api/clientes', 'POST', { nombre: 'Synthetic History' });
  await b.w.receive(a.w);
  await a.w.request('/api/clientes/' + p.id + '/evaluacion', 'PATCH', { trato: 3, quien: 'A' });
  await b.w.request('/api/clientes/' + p.id + '/evaluacion', 'PATCH', { trato: 5, quien: 'B' });
  const ca = a.w.catalog(), cb = b.w.catalog();
  await a.w.OCSync.aplicarCatalogo(cb, null); await b.w.OCSync.aplicarCatalogo(ca, null);
  const ea = a.w.catalog().clientes.find(c => c.id === p.id).evaluacion;
  const eb = b.w.catalog().clientes.find(c => c.id === p.id).evaluacion;
  assert.equal(ea.historial.length, 2); assert.deepEqual(ea, eb);
});
test('remote apply waits for persistence and rejects a failed merge without changing local state', async () => {
  const a = replica('a'); const b = replica('b');
  await a.w.request('/api/clientes', 'POST', { nombre: 'Synthetic Uncommitted' });
  const before = b.w.OCSync.estadoParaCheckpoint();
  b.ls.setItem = () => { throw new Error('Synthetic quota'); };
  b.w.OCEstadoIDB = { guardar: async () => false };
  const result = await b.w.receive(a.w);
  assert.equal(result.ok, false);
  assert.equal(JSON.stringify(b.w.OCSync.estadoParaCheckpoint()), JSON.stringify(before));
});
