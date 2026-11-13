// tWEBORIGIN1113 — (priv2 11/13) 🌐 웹앱 출처 세기 · 브라우저 필요 없음 · node src/tests/tWEBORIGIN1113.js
const assert = require('assert'); const W = require('../../cloud/web-origin.js');
let now = Date.parse('2026-11-13T09:00:00Z'); const store = {};
const C = () => ({ doc: (id) => ({ get: async () => ({ data: () => store[id] }), set: async (v) => { store[id] = JSON.parse(JSON.stringify(v)); } }) });
const w = W.make({ C, now: () => now, flushMs: 60e3 }); let ok = 0; const t = (n, f) => { f(); ok++; console.log('✓', n); };
const rq = (o, ua, url) => ({ headers: { origin: o, 'user-agent': ua }, url: url || '/diag?x=1' });
const WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36', AND = 'Mozilla/5.0 (Linux; Android 14; wv) AppleWebKit Chrome/130.0 Mobile Safari';
(async () => {
  t('종류 가름', () => { assert.strictEqual(W.uaKind(WIN), 'win·chrome131'); assert.strictEqual(W.uaKind(AND), 'android·webview'); assert.strictEqual(W.uaKind(''), 'etc·etc'); });
  w.seen(rq('https://jerrycson.github.io', WIN, '/friend-tok?a=1')); w.seen(rq('https://readnow.kr', AND)); w.seen(rq('https://evil.example', WIN)); w.seen({ headers: {} });
  t('모르는 출처·출처 없음은 안 셈', () => { const p = w.peek().pending['2026-11-13']; assert.deepStrictEqual(Object.keys(p).sort(), ['https://jerrycson.github.io', 'https://readnow.kr']); assert.strictEqual(p['https://jerrycson.github.io'].paths['/friend-tok'], 1); });
  await w.flush(); t('씀 · 합계', () => { const d = store.web_origin; assert.strictEqual(d.sum.oldN, 1); assert.strictEqual(d.sum.newN, 1); assert.strictEqual(d.sum.lastOldDay, '2026-11-13'); });
  w.seen(rq('https://jerrycson.github.io', WIN)); await w.flush(); t('같은 날 더함', () => { assert.strictEqual(store.web_origin.days['2026-11-13']['https://jerrycson.github.io'].n, 2); assert.strictEqual(store.web_origin.days['2026-11-13']['https://jerrycson.github.io'].kinds['win·chrome131'], 2); });
  for (let i = 1; i <= 16; i++) { now += 864e5; w.seen(rq('https://readnow.kr', WIN)); await w.flush(); }
  t('14일만 둠 · 옛 주소 0', () => { const d = store.web_origin; assert.strictEqual(Object.keys(d.days).length, 14); assert.strictEqual(d.sum.oldN, 0); assert.strictEqual(d.sum.lastOldDay, null); });
  const bad = W.make({ C: () => ({ doc: () => ({ get: async () => { throw new Error('막힘'); } }) }), now: () => now }); bad.seen(rq('https://readnow.kr', WIN)); const r = await bad.flush();
  t('쓰기 실패면 다시 들고 있음', () => { assert.strictEqual(r.ok, false); assert.ok(bad.peek().pending[W.kstDay(now)]); });
  await new Promise((r) => setTimeout(r, 20)); await w.flush(); const n0 = store.web_origin.days[W.kstDay(now)]['https://readnow.kr'].n;
  w.seen(rq('https://readnow.kr', WIN)); now += 61e3; w.seen(rq('https://readnow.kr', WIN)); await new Promise((r) => setTimeout(r, 20));
  t('10분(시험 1분) 지나면 저절로 씀', () => { assert.strictEqual(Object.keys(w.peek().pending).length, 0); assert.strictEqual(store.web_origin.days[W.kstDay(now)]['https://readnow.kr'].n, n0 + 2); });
  console.log(`모두 ${ok}개 통과`);
})().catch((e) => { console.error('❌', e.message); process.exit(1); });
