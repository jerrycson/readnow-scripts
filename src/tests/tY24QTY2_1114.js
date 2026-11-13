/* tY24QTY2_1114 — (11/14 일꾼 y24qty2 · 원문 진단 app_settings/omni_auto·col2_y24_cmd 11/14 04:1x) 줄 열쇠만 바뀐 예스24 맡김 — 「hot banana fudge」 195142826 수량 1
 *  ① 보내기 직전 다시 셈(y24PFind)이 옛 열쇠 줄도 같은 예스24 상품 번호·같은 종류·수량·마지막 주문 시각이면 그 할 일로 봄(rekey) · 다르면 예전처럼 할 일 없음
 *  ② '할 일 없음'으로 닫힌 맡김 한 번 더 고르기(y24NosPick) — 웹앱·수집기 글자 그대로 같음 · 같은 표로 둘 다 돌림 · 문서마다 한 번 · 그 상품 번호의 가장 새 문서만 · 수량·판매중지만
 *  ③ 장부 기억 열쇠에 SKU 표 시각 · 맡긴 일 줄 처리에서 불림 · 수집기 쓰기 다리에서 불림
 * 실행: node src/tests/tY24QTY2_1114.js (서버·브라우저 필요 없음) · 손님 정보 없음 */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..')].find((p) => fs.existsSync(path.join(p, 'src/app.html')));
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 400))); };
const A = rd('src/app.html'), C = rd('src/readnow-collector.src.js');
const reBlk = /const Y24_NOS_MS = 30 \* 60e3;[^\n]*\n\s*function y24NosPick\([\s\S]*?return out; \}\n\s*function y24NosPatch\([\s\S]*?by: String\(by \|\| ''\)\.slice\(0, 40\) \} \}; \}\n/;
const bA = (A.match(reBlk) || [''])[0], bC = (C.match(reBlk) || [''])[0];
const norm = (s) => s.split('\n').map((l) => l.trim()).join('\n');
console.log('② 닫힌 맡김 한 번 더 고르기 — 웹앱·수집기');
ok(!!bA && !!bC, '두 곳에 덩어리 있음');
ok(norm(bA) === norm(bC), '웹앱·수집기 글자 그대로 같음');
const NOW = Date.parse('2026-11-13T19:30:00Z');
const row = (rid, no, kind, extra) => ({ rid, rk: rid + '|' + kind + '|' + (kind === 'qty' ? 1 : '') + '|', no, kind, to: kind === 'qty' ? 1 : null, ...(extra || {}) });
const NOS = { state: 'already', msg: '할 일 없음 — 보내기 직전에 다시 셈(아무것도 안 보냄)', rows: {} };
const D = [
  { id: 'z2e', k: 'w', st: 'done', at: '2026-11-13T13:58:45Z', doneAt: '2026-11-13T14:09:35Z', job: { rows: [row('PNKd3734EX|195142826', '195142826', 'qty', { src: 'auto' })] }, res: NOS },
  { id: 'kh9', k: 'w', st: 'done', at: '2026-11-13T00:52:28Z', doneAt: '2026-11-13T04:35:58Z', job: { rows: [row('al:aladin_U345587565|195142826', '195142826', 'qty', { src: 'auto' })] }, res: NOS }, /* 같은 상품의 옛 문서 — 뺌 */
  { id: 'b', k: 'w', st: 'done', at: '2026-11-13T10:00:00Z', doneAt: '2026-11-13T10:01:00Z', reNos: 'x', job: { rows: [row('K|1001', '1001', 'stop')] }, res: NOS }, /* 이미 한 번 — 뺌 */
  { id: 'c', k: 'w', st: 'done', at: '2026-11-13T10:00:00Z', doneAt: '2026-11-13T10:01:00Z', job: { rows: [row('K|1002', '1002', 'qty')] }, res: { ...NOS, state: 'skip' } }, /* 할 일이 바뀜 — 뺌 */
  { id: 'd', k: 'w', st: 'done', at: '2026-11-13T10:00:00Z', doneAt: '2026-11-13T10:01:00Z', job: { rows: [row('K|1003', '1003', 'price', { src: 'price' })] }, res: NOS }, /* 판매가 — 뺌 */
  { id: 'e', k: 'w', st: 'done', at: '2026-11-09T10:00:00Z', doneAt: '2026-11-09T10:01:00Z', job: { rows: [row('K|1004', '1004', 'qty')] }, res: NOS }, /* 72시간 넘음 — 뺌 */
  { id: 'f', k: 'w', st: 'done', at: '2026-11-13T10:00:00Z', doneAt: '2026-11-13T10:01:00Z', job: { rows: [row('K|1005', '1005', 'stop')] }, res: NOS }, /* 뒤에 맡긴 일이 줄에 있음 — 뺌 */
  { id: 'g', k: 'w', st: 'done', at: '2026-11-13T10:00:00Z', doneAt: '2026-11-13T10:01:00Z', ok: true, job: { rows: [row('K|1006', '1006', 'qty')] }, res: NOS },
  { id: 'h', k: 'w', st: 'done', at: '2026-11-13T10:00:00Z', doneAt: '2026-11-13T10:01:00Z', job: { rows: [row('K|1007', '1007', 'qty')] }, res: { state: 'fail', msg: '저장되지 않음', rows: {} } }, /* 실패 — 다른 길(y24re) */
  { id: 'i', k: 'w', st: 'done', at: '2026-11-13T10:00:00Z', doneAt: '2026-11-13T10:01:00Z', job: { rows: [row('K|1008', '1008', 'stop', { src: 'recon' })] }, res: NOS }, /* 재고 맞추기 — 뺌 */
  { id: 'j', k: 'w', st: 'done', at: '2026-11-13T10:00:00Z', doneAt: '2026-11-13T10:01:00Z', job: { rows: [row('K|1009', '1009', 'stop')] }, res: NOS }, /* 고름 */
];
const ACT = [{ id: 'f2', st: 'hold', at: '2026-11-13T11:00:00Z', holdAt: '2026-11-13T11:00:00Z', job: { rows: [row('K2|1005', '1005', 'stop')] } }];
for (const [nm, b] of [['웹앱', bA], ['수집기', bC]]) { const F = new Function(b + '; return { y24NosPick, y24NosPatch };')();
  const ids = F.y24NosPick(D, ACT, NOW).map((d) => d.id).sort(); ok(JSON.stringify(ids) === JSON.stringify(['j', 'z2e']), `${nm}: 고른 것 = 가장 새 문서 z2e·j 뿐`, ids);
  const P = F.y24NosPatch(D[0], 'HOME', NOW); ok(P.st === 'hold' && P.reNos && P.retryAt === new Date(NOW).toISOString() && P.res === null && P.lastRes === NOS && P._t && /한 번 더/.test(P._t.m), `${nm}: 줄로 — hold · reNos · 바로 다시 셈 · 옛 결과는 lastRes`, P);
  ok(F.y24NosPick([{ ...D[0], ...P, st: 'done', res: NOS }], [], NOW).length === 0, `${nm}: 한 번 돌린 문서(reNos)는 다시 닫혀도 또 고르지 않음(되풀이 0)`); }
console.log('① 보내기 직전 다시 셈 — 줄 열쇠만 바뀐 같은 할 일');
const bR = (A.match(/const y24RkTail = [^\n]*\nfunction y24PRekey\([\s\S]*?return \{ \.\.\.M\[0\], rekey: 1 \}; \}\n\/\*[^\n]*\*\/\nfunction y24PRekeyRow\([^\n]*\n/) || [''])[0];
ok(!!bR, '웹앱에 y24PRekey 덩어리 있음');
const stub = `const ledY24Row = (T, a) => { const rid = T.key + '|' + (a.no || ''); const kind = a.k === 'down' || !(+a.to > 0) ? 'stop' : 'qty'; return { rid, rk: [rid, kind, kind === 'qty' ? a.to : '', String(T.last || '').replace(/\\D/g, '').slice(0, 14)].join('|'), no: String(a.no || ''), self: T.sku || '', fill: '', isbn: '', mode: 'self', kind, to: kind === 'qty' ? +a.to : null, title: T.title }; }; const ledY24Can = (r) => !!(r.no && r.self);`;
const G = new Function(stub + bR + '; return { y24PRekey, y24PRekeyRow };')();
const T1 = { key: 'PNKd3734EX', sku: 'PNKd3734EX', title: 'hot banana fudge', last: '', acts: [{ ch: 'yes24', k: 'qty', to: 1, no: '195142826' }] };
const old = row('al:aladin_U345587565|195142826', '195142826', 'qty', { src: 'auto' });
const it = G.y24PRekey(old, [T1]); ok(it && it.rekey === 1 && it.T === T1, '옛 열쇠 줄 → 지금 열쇠의 같은 할 일(rekey)', it);
const nr = it && G.y24PRekeyRow(old, it.T, it.a); ok(nr && nr.rid === 'PNKd3734EX|195142826' && nr.rk === 'PNKd3734EX|195142826|qty|1|' && nr.src === 'auto' && nr.self === 'PNKd3734EX' && nr.kind === 'qty' && nr.to === 1, '보낼 줄은 지금 열쇠로 다시 만듦(출처 그대로)', nr);
ok(G.y24PRekey(row('PNKd3734EX|195142826', '195142826', 'qty'), [T1]) === null, '열쇠가 같으면 rekey 아님(정확히 맞는 줄은 위에서 찾음)');
ok(G.y24PRekey(old, [{ ...T1, acts: [{ ch: 'yes24', k: 'qty', to: 2, no: '195142826' }] }]) === null, '수량이 다르면 할 일이 바뀐 것 — 할 일 없음');
ok(G.y24PRekey(old, [{ ...T1, last: '2026-11-13T10:00:00Z' }]) === null, '마지막 주문 시각이 다르면(새 주문) 할 일 없음');
ok(G.y24PRekey(old, [{ ...T1, acts: [{ ch: 'yes24', k: 'down', to: 0, no: '195142826' }] }]) === null, '종류가 다르면(판매중지) 할 일 없음');
ok(G.y24PRekey(old, [T1, { ...T1, key: 'PNKx0000EX' }]) === null, '같은 상품 번호 할 일이 둘이면 정하지 않음');
ok(G.y24PRekey(old, [{ ...T1, acts: [{ ch: 'yes24', k: 'qty', to: 1, no: '195999999' }] }]) === null, '상품 번호가 다르면 할 일 없음');
ok(G.y24PRekey({ ...old, src: 'price' }, [T1]) === null && G.y24PRekey({ ...old, src: 'recon' }, [T1]) === null, '판매가·재고 맞추기 줄은 그 출처 셈 그대로');
ok(G.y24PRekeyRow(old, { ...T1, sku: '' }, T1.acts[0]) === null, '번외가 찾을 길이 없으면 보낼 줄 없음(닫음)');
console.log('③ 붙은 자리');
ok(/T\.key \+ '\|' \+ \(a\.no \|\| ''\) === r\.rid\) return \{ T, a \};\n  return y24PRekey\(r, TD\); \}/.test(A), 'y24PFind 끝에서 rekey를 봄');
ok(/if \(it\.rekey\) \{ const nr = y24PRekeyRow\(r, it\.T, it\.a\);[^\n]*keep\.push\(nr\); rek\+\+; continue; \}/.test(A), '맡긴 일 줄 처리가 rekey 줄을 지금 열쇠로 보냄');
ok(/await y24Re1114b\(\);[^\n]*\n\s*await y24ReNos\(\);/.test(A), '맡긴 일 줄 처리에서 y24ReNos를 부름');
ok(/async function y24ReNos\(\)[\s\S]{0,900}ledY24Guard\(\) \|\| y24PReady\(\)/.test(A) && /y24NosPick\(docs, act\)\) \{ if \(!\(\(\(d\.job \|\| \{\}\)\.rows\) \|\| \[\]\)\.every\(\(r\) => \{ const it = y24PFind\(r, TD\);/.test(A), '웹앱은 출고 중·자료 덜 옴이면 안 돌고, 장부에 같은 할 일이 남은 것만 줄로');
ok(/function ledNow\(\) \{ const chs = ledChs\(\); const k = \[[^\]]*\(S\.sku && S\.sku\.at\) \|\| 0/.test(A), '장부 기억 열쇠에 SKU 표 시각');
ok(/await wRe1114b\(fs, pc\);[^\n]*\n\s*await wReNos\(fs, pc\);/.test(C), '수집기 쓰기 다리에서 wReNos를 부름');
ok(/async function wReNos\(fs, pc\)[\s\S]{0,700}vn\(hv\) < vn\(NOS_NEED\)/.test(C) && /NOS_NEED = '0\.1\.62'/.test(C), '수집기는 맡은 PC 번외 0.1.62 뒤에만');
console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
