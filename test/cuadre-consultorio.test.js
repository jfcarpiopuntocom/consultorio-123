// Port de la corrida Hugo/Paco/Luis de friendly-123 v395-v397 (JFC 2026-09-24).
// consultorio-123 es otra app (sin perchas ni comisiones): solo recibe los
// arreglos de stock, foto y balance que le aplican. Rojo antes del port.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { browser, storage } = require('./helpers/browser.cjs');
const cent = (n) => Math.round((Number(n) || 0) * 100);
function consultorio() {
  const ls = storage(); ls.setItem('c123_owned', JSON.stringify({ instanceId: 'fixture-cuadre' }));
  const w = browser(ls); w.OCAuth = { rolActual: () => 'dueno' }; return w;
}
test('B1 Luis: una venta rechazada (paciente inexistente) no baja el stock', async () => {
  const w = consultorio();
  const p = (await w.request('/api/productos')).find((x) => x.stockActual > 3);
  await assert.rejects(() => w.request(`/api/productos/${p.id}/venta`, 'POST', { cantidad: 2, clienteId: 'no-existe' }));
  assert.equal((await w.request('/api/productos')).find((x) => x.id === p.id).stockActual, p.stockActual);
});
test('F1 la foto elegida al crear un producto se guarda', async () => {
  const w = consultorio(); const foto = 'data:image/webp;base64,UklGRg==';
  const p = await w.request('/api/productos', 'POST', { nombre: 'Guantes', barcode: 'G-1', precio: 5, costo: 2, stockInicial: 3, umbralRojo: 1, umbralAmarillo: 2, foto });
  assert.equal((await w.request('/api/productos')).find((x) => x.id === p.id).foto, foto);
});
test('C4 balance: el inventario cuenta como activo a COSTO', async () => {
  const w = consultorio();
  const b = await w.request('/api/reportes/balance');
  const ps = await w.request('/api/productos'); const racks = await w.request('/api/ubicaciones');
  const consig = (p) => p.tipoProveedor === 'consignacion' || (racks.find((u) => u.id === p.ubicacionId) || {}).tipo === 'consignacion';
  assert.equal(cent(b.activos.inventarioValorizado), ps.filter((p) => !consig(p)).reduce((a, p) => a + cent((p.costo || 0) * p.stockActual), 0));
  assert.equal(b.memo.criterioInventario, 'costo');
});
