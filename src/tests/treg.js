const G = require('/home/claude/w/out/readnow-registry.js'); const now = Date.parse('2026-10-08T12:00:00Z'); const ago = (m) => new Date(now - m * 60e3).toISOString();
const R = G.merge({ ver: '0.1.0', overrides: { kinds: { lookup: { off: true }, newKind: { label: '새 종류', by: ['pc'] } } } });
console.log('can', G.canHandle(R, 'read', 'pc'), G.canHandle(R, 'market', 'pc'), G.canHandle(R, 'lookup', 'pc'), G.canHandle(R, 'zzz', 'pc'), G.canHandle(R, 'newKind', 'pc'), G.canHandle(R, 'c2bAdd', 'cloud'));
const cmds = [
  { id: 'a', type: 'read', status: 'running', claim: { pc: 'cloud', at: ago(30) }, createdAt: ago(31) },
  { id: 'b', type: 'startDelivery', status: 'running', claim: { pc: 'JS-MAIN', at: ago(40) }, beatAt: ago(20), createdAt: ago(41) },
  { id: 'c', type: 'read', status: 'running', claim: { pc: 'cloud', at: ago(30) }, attempts: 2, createdAt: ago(31) },
  { id: 'd', type: 'lookup', status: 'queued', createdAt: ago(20) },
  { id: 'e', type: 'zzz', status: 'queued', createdAt: ago(1) },
  { id: 'f', type: 'metrics', status: 'running', claim: { pc: 'HOME', at: ago(500) }, uploadedAt: { seconds: (now - 30 * 60e3) / 1000 }, createdAt: ago(600) },
  { id: 'g', type: 'cashTest', status: 'queued', createdAt: ago(100) },
  { id: 'h', type: 'read', status: 'done', createdAt: ago(100) },
];
console.log(JSON.stringify(G.sweep(R, cmds, now, { cloud: true, pc: false }), null, 1));
console.log(JSON.stringify(G.pinDiff(R, 'watch', { 'readnow-core.js': '1.3.0', 'readnow-pricing-core.js': '0.15.0' })));
console.log(JSON.stringify(G.freshness(R, 'shp_state', now - 15 * 60e3, now)), JSON.stringify(G.freshness(R, 'crm_notes', 0, now)));
