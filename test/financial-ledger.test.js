const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { webcrypto } = require('node:crypto');
const { IDBFactory } = require('fake-indexeddb');
const { browser, storage } = require('./helpers/browser.cjs');
function ledger(id) {
  const ls = storage(); ls.setItem('c123_owned', JSON.stringify({ instanceId: id }));
  const w = browser(ls); w.indexedDB = new IDBFactory(); w.crypto = webcrypto; w.TextEncoder = TextEncoder;
  for (const name of ['hechos.js', 'nucleo-ingresos.js', 'nucleo-cxc.js', 'cartera.js', 'idb-fotos.js', 'agenda.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../docs', name), 'utf8'), w);
  return w;
}
test('a clinical income commits once and is included without an event-bus side effect', async () => {
  const w = ledger('a');
  await w.AMG.Ingresos.registrar({ monto: 45, cuenta: 'caja_chica', concepto: 'Synthetic consultation' });
  assert.equal((await w.AMG.Hechos.todos()).length, 1);
  assert.equal((await w.AMG.Ingresos.listar()).total, 45);
});
test('appointments are read from committed plain facts and cancellation survives replay', async()=>{
  const a=ledger('a'), b=ledger('b');
  const cita=await a.AMG.Agenda.agendar({paciente:'Synthetic',fecha:'2026-10-02',hora:'10:00'});
  assert.equal((await a.AMG.Agenda.listar()).length,1);
  for(const h of await a.AMG.Hechos.todos()) await b.AMG.Hechos.importarRemoto(h);
  await b.AMG.Agenda.cancelar(cita.id,'Synthetic cancellation');
  for(const h of await b.AMG.Hechos.todos()) await a.AMG.Hechos.importarRemoto(h);
  assert.equal((await a.AMG.Agenda.listar()).length,0);
});
test('full export restores money, tariffs and photo blobs without partial invalid imports', async () => {
  const a = ledger('a'), b = ledger('b'); a.OCAuth = b.OCAuth = { rolActual: () => 'dueno' };
  await a.AMG.Ingresos.registrar({ monto: 45, cuenta: 'caja_chica' });
  await a.OCSync.guardarDatos('tarifario', [{ id: 's1', nombre: 'Synthetic', tarifa: 45 }]);
  const photo = 'data:image/png;base64,aGVsbG8=';
  assert.equal(await a.OCFotos.guardarFoto('synthetic-photo', photo), true);
  const backup = await a.request('/api/respaldo/exportar');
  assert.equal(backup.recuperacion.hechos.length, 1);
  await b.request('/api/respaldo/importar', 'POST', backup);
  assert.equal((await b.AMG.Ingresos.listar()).total, 45);
  assert.equal(b.OCSync.leerDatos('tarifario')[0].tarifa, 45);
  assert.equal(await b.OCFotos.leerFoto('synthetic-photo'), photo);
  const legacy = JSON.parse(JSON.stringify(backup)); delete legacy.recuperacion;
  await b.request('/api/respaldo/importar', 'POST', legacy);
  assert.equal((await b.AMG.Ingresos.listar()).total, 45, 'legacy restore preserves recovered ledger');
  assert.equal(await b.OCFotos.leerFoto('synthetic-photo'), photo);
  const before = JSON.stringify(b.OCSync.estadoParaCheckpoint());
  backup.recuperacion.hechos[0].datos.monto = 900;
  await assert.rejects(b.request('/api/respaldo/importar', 'POST', backup));
  assert.equal(JSON.stringify(b.OCSync.estadoParaCheckpoint()), before);
});
test('a failed fact write rejects rather than reporting a successful null payment', async () => {
  const w = ledger('a'); w.indexedDB.open = () => { throw new Error('Synthetic disk failure'); };
  await assert.rejects(w.AMG.Ingresos.registrar({ monto: 45, cuenta: 'caja_chica' }));
});
test('a treatment and initial payment commit atomically or not at all', async()=>{
  const w=ledger('a');
  const result=await w.AMG.CxC.registrarTratamiento('synthetic-p','Treatment',100,25);
  assert.ok(result.cargo && result.abono);
  assert.equal((await w.AMG.CxC.saldoDePaciente('synthetic-p')).saldo,-75);
  const before=await w.AMG.Hechos.contar();
  await assert.rejects(()=>w.AMG.Hechos.registrarLote([{tipo:'cxc_cargo',datos:{monto:50}},null]));
  assert.equal(await w.AMG.Hechos.contar(),before);
});
test('photo metadata can arrive before its blob; removal resists stale replay', async()=>{
  const a=ledger('a'),b=ledger('b'); a.OCAuth=b.OCAuth={rolActual:()=> 'dueno'};
  const p=await a.request('/api/productos','POST',{nombre:'Synthetic photo',barcode:'SYN-PHOTO',stockInicial:1,precio:2,costo:1,umbralRojo:1,umbralAmarillo:2});
  const foto='data:image/png;base64,aGVsbG8=';
  await a.request('/api/productos/'+p.id,'PATCH',{foto});
  const cat=a.catalog(), ref=cat.productos.find(x=>x.id===p.id);
  assert.equal(typeof ref.fotoHash,'string'); assert.equal(ref.foto,undefined);
  await b.receive(a);
  assert.equal(b.catalog().productos.find(x=>x.id===p.id).fotoHash,ref.fotoHash);
  await b.OCFotos.guardarPorHash(ref.fotoHash,foto); await b.OCSync.hidratarFotosProductos();
  assert.equal((await b.request('/api/productos')).find(x=>x.id===p.id).foto,foto);
  await b.request('/api/productos/'+p.id,'PATCH',{foto:null}); await a.receive(b); await a.OCSync.aplicarCatalogo(cat);
  assert.equal((await a.request('/api/productos')).find(x=>x.id===p.id).foto,null);
  await assert.rejects(b.OCFotos.guardarPorHash(ref.fotoHash,'data:image/png;base64,d3Jvbmc='));
});
test('financial peers import once, preserve totals, and quarantine changed-content collisions', async () => {
  const a = ledger('a'), b = ledger('b');
  const h = await a.AMG.Hechos.registrar('cxc_cargo', { pacienteId: 'synthetic-p', monto: 100 });
  await b.AMG.Hechos.importarRemoto(h); await b.AMG.Hechos.importarRemoto(h);
  assert.equal((await b.AMG.CxC.saldoDePaciente('synthetic-p')).saldo, -100);
  await assert.rejects(b.AMG.Hechos.importarRemoto({ ...h, datos: { pacienteId: 'synthetic-p', monto: 900 } }));
  assert.equal((await b.AMG.Hechos.todos()).length, 1);
  assert.equal((await b.AMG.Hechos.conflictos()).length, 1);
});
