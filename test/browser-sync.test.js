const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const modules = ['sync-domain.js', 'estado-idb.js', 'mock-backend.js', 'hechos.js', 'idb-fotos.js', 'nucleo-ingresos.js', 'nucleo-cxc.js', 'nucleo-inventario.js', 'nucleo-resultados.js', 'nucleo-ui.js', 'sync-yjs.js'];
const fixture = `<!doctype html><html><head><meta charset="utf-8"></head><body><nav><button data-vista="contabilidad">Contabilidad</button></nav><main id="vista-contabilidad"></main>
<script src="/aislamiento.js"></script><script>
if (!localStorage.getItem('c123_owned')) {
const actor=crypto.randomUUID();
localStorage.setItem('c123_owned', JSON.stringify({instanceId:actor, licenseCode:'C123-SYNTHETIC-LOCAL-INTEGRITY-TEST'}));
localStorage.setItem('c123_device_id',actor);
localStorage.setItem('c123_autoheal_888_v1','1');
localStorage.setItem('c123_estado_v2',JSON.stringify({_app:'consultorio-123',schemaVersion:3,_rev:1,productos:[],ubicaciones:[],clientes:[],ventas:[],movimientos:[],transferencias:[],usuarios:[],sucursales:[],promotoras:[],configuracion:{gastosMensuales:{}}}));
}
window.OCAuth={rolActual:()=> 'dueno'};
</script>${modules.map(m => `<script src="/${m}"></script>`).join('')}</body></html>`;

test('real Chromium replicas persist, render, reconnect and restore encrypted clinical data', { timeout: 60000 }, async () => {
  const docs = path.resolve(__dirname, '../docs');
  const server = http.createServer((req, res) => {
    if (req.url === '/fixture') { res.setHeader('Content-Type','text/html; charset=utf-8'); return res.end(fixture); }
    const file = path.resolve(docs, '.' + new URL(req.url, 'http://localhost').pathname);
    if (!file.startsWith(docs + path.sep) || !fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8'); res.end(fs.readFileSync(file));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
  const browser = await chromium.launch({ headless: true, executablePath });
  const rooms = new Map(), frames = [], errors = [], peers = [];
  async function peer() {
    const context = await browser.newContext();
    const state = { offline: false };
    await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
    await context.routeWebSocket('**/*', ws => {
      const room = rooms.get(ws.url()) || { peers: new Set(), ops: [] }; rooms.set(ws.url(), room);
      const connection = { ws, state }; room.peers.add(connection);
      ws.onClose(() => room.peers.delete(connection));
      ws.onMessage(data => {
        if (state.offline) return;
        frames.push(data);
        if (typeof data === 'string') {
          const message = JSON.parse(data);
          if (message.k === 'pull') { for (const frame of room.ops) ws.send(frame); }
          if (message.k === 'op' || message.k === 'ckpt') room.ops.push(Buffer.from(message.c, 'base64'));
        } else {
          for (const p of room.peers) if (p !== connection && !p.state.offline) p.ws.send(data);
        }
      });
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' || m.text().includes('sembrar:') || m.text().includes('sin licencia')) console.log('browser:',m.text()); });
    await page.goto(base + '/fixture');
    await page.waitForFunction(() => window.OCYjs && OCYjs.estado === 'activo' && OCYjs._store);
    await page.locator('nav button').click();
    const p = { page, context, state }; peers.push(p); return p;
  }
  const request = (p, url, body, method = 'POST') => p.page.evaluate(async ({url,body,method}) => {
    const r = await fetch(url,{method,body:JSON.stringify(body)}); const data=await r.json(); if(!r.ok)throw new Error(JSON.stringify(data)); return data;
  }, {url,body,method});
  try {
    const a = await peer(), b = await peer();
    const started = performance.now();
    await a.page.evaluate(() => AMG.Ingresos.registrar({monto:45,cuenta:'caja_chica',paciente:'Synthetic Patient',concepto:'Synthetic consultation'}));
    await b.page.waitForFunction(() => document.querySelector('#nucleo-tabla-ingresos').textContent.includes('Synthetic consultation'));
    const incomeMs = performance.now() - started;
    assert.ok(incomeMs <= 2000, `income action→durable visible: ${incomeMs}ms`);
    assert.equal(await b.page.evaluate(async () => (await AMG.Ingresos.listar()).total),45);
    const product = await request(a,'/api/productos',{nombre:'Synthetic supply',barcode:'SYN',stockInicial:10,precio:12,costo:4,umbralRojo:1,umbralAmarillo:3});
    await b.page.waitForFunction(id => OCSync.catalogoPropio().productos.some(p => p.id===id),product.id);
    a.state.offline=b.state.offline=true;
    await request(a,`/api/productos/${product.id}/venta`,{cantidad:2});
    await request(b,`/api/productos/${product.id}/venta`,{cantidad:3});
    await a.page.evaluate(()=>OCYjs._store.sembrar()); await b.page.evaluate(()=>OCYjs._store.sembrar());
    a.state.offline=b.state.offline=false;
    // Reconnect from durable Yjs state, with neither peer allowed to use raw snapshots.
    await a.page.reload(); await b.page.reload();
    for(const p of [a,b]) await p.page.waitForFunction(id=>OCSync.catalogoPropio().productos.find(p=>p.id===id)?.stockActual===5,product.id);
    const c = await peer();
    await c.page.waitForFunction(id=>OCSync.catalogoPropio().productos.find(p=>p.id===id)?.stockActual===5,product.id);
    assert.equal(await c.page.evaluate(async()=>(await AMG.Ingresos.listar()).total),45);
    const backup=await request(a,'/api/respaldo/exportar',undefined,'GET');
    assert.equal(backup.recuperacion.hechos.length,1);
    for(const frame of frames) {
      const text=Buffer.isBuffer(frame)?frame.toString('utf8'):frame;
      assert.equal(text.includes('Synthetic Patient')||text.includes('Synthetic consultation')||text.includes('SYNTHETIC-LOCAL-INTEGRITY-TEST'),false);
    }
    assert.deepEqual(errors,[]);
    const fullContext = await browser.newContext({ serviceWorkers: 'block' });
    const fullPage = await fullContext.newPage(), fullErrors=[];
    await fullContext.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
    fullPage.on('pageerror',e=>fullErrors.push(e.message));
    await fullPage.goto(base+'/index.html');
    await fullPage.waitForFunction(()=>window.OCSync && window.AMG && AMG.Ingresos && window.NucleoUI);
    assert.deepEqual(fullErrors,[],'full production shell startup');
    await fullContext.close();
    console.log(JSON.stringify({browser:'Chromium',transport:'intercepted encrypted WebSocket relay; local machine',incomeActionToDurableVisibleMs:Math.round(incomeMs),replicas:3,stock:5,income:45,frames:frames.length}));
  } catch (error) {
    for (const p of peers) console.log(JSON.stringify(await p.page.evaluate(() => ({state:OCSync.catalogoPropio(),y:OCYjs.getProductos(),status:OCYjs.estado,owned:localStorage.getItem('c123_owned')})).catch(()=>null)));
    console.log({errors}); throw error;
  } finally { await browser.close(); server.closeAllConnections(); await new Promise(resolve=>server.close(resolve)); }
});
