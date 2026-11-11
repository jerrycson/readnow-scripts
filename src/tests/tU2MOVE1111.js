// 🚚 리드나우 2 이전 장치 — 지금 웹앱 쪽(app.html <head> 맨 앞 짧은 글 · RN2_MOVE_SYNC · ?old=1 띠) 시험 — node src/tests/tU2MOVE1111.js
// 네 가지: ① rn2-move 'on'이면 넘어감(?·# 그대로 + from=old) ② ?old=1이면 안 넘어감(탭 기억 · 띠) ③ 'back'·'off'·없음이면 안 넘어감 ④ 새 웹앱 안(window.U2)·다른 창 안이면 안 넘어감
const fs = require('fs'); const vm = require('vm');
const html = fs.readFileSync(__dirname + '/../app.html', 'utf8');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ✗', m); } else console.log('  ✓', m); };
const h0 = html.indexOf('<head>'); const s0 = html.indexOf('<script>', h0); const s1 = html.indexOf('</script>', s0);
const code = html.slice(s0 + 8, s1);
ok(h0 >= 0 && s0 > h0 && /rn2-move/.test(code) && /RN2_MOVE_SYNC/.test(code), '<head> 첫 <script>가 이전 짧은 글');
const firstScripts = html.slice(h0, html.indexOf('</head>')); ok(firstScripts.indexOf('rn2-move') < firstScripts.indexOf('firebase') || firstScripts.indexOf('firebase') < 0, 'Firebase·본문보다 먼저');
ok(!/localStorage\.setItem\(['"]rn2-move/.test(code), 'rn2-move는 읽기만(새 웹앱만 씀)');
const ON = { state: 'on', to: 'https://jerrycson.github.io/readnow-ui2/', until: new Date(Date.now() + 10.2 * 864e5).toISOString() };
function run(o) {
  const ls = new Map(Object.entries(o.ls || {})), ss = new Map(Object.entries(o.ss || {})); const els = {}; let ready = []; const rep = [];
  const doc = { readyState: o.ready || 'complete', addEventListener: (k, f) => ready.push(f), getElementById: (id) => els[id] || null,
    createElement: () => { const e = { style: {}, children: [], appendChild(c) { this.children.push(c); }, remove() { delete els[this.id]; } }; return e; },
    body: { appendChild(e) { els[e.id] = e; } } };
  const loc = { search: o.search || '', hash: o.hash || '', pathname: '/readnow-scripts/app/', replace: (u) => rep.push(u) };
  const win = { document: doc, location: loc, URLSearchParams,
    localStorage: { getItem: (k) => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => ls.set(k, String(v)) },
    sessionStorage: { getItem: (k) => (ss.has(k) ? ss.get(k) : null), setItem: (k, v) => ss.set(k, String(v)), removeItem: (k) => ss.delete(k) } };
  win.window = win; win.top = o.iframe ? {} : win; if (o.u2) win.U2 = {};
  vm.createContext(win); vm.runInContext(code, win); ready.forEach((f) => f());
  return { rep, ss, els, win };
}
const J = (x) => JSON.stringify(x);
// ①
let r = run({ ls: { 'rn2-move': J(ON) }, search: '?go=deliv', hash: '#c=12' });
ok(r.rep.length === 1 && r.rep[0] === ON.to + '?go=deliv&from=old#c=12', '① on → 새 웹앱으로 넘어감 · ?go·# 그대로 + from=old — ' + r.rep[0]);
ok(r.win.RN2_MOVING === true, '① 넘어가는 중 표시(설치 앱 시작 화면 넘김이 덮지 않게)');
ok(/if \(sa && !q\.get\('st'\) && !window\.RN2_MOVING\)/.test(html), '① 설치 앱 시작 화면 넘김은 RN2_MOVING이면 안 함');
// ②
r = run({ ls: { 'rn2-move': J(ON) }, search: '?old=1&go=confirm' });
ok(r.rep.length === 0 && r.ss.get('rn2-old') === '1', '② ?old=1 → 안 넘어감 · 이 탭 기억(rn2-old)');
const band = r.els.rn2oldband; ok(!!band && /옛 화면 — 1[01]일 뒤 닫힘/.test(band.children[0].textContent), '② 머리 띠 "옛 화면 — ○일 뒤 닫힘" — ' + (band && band.children[0].textContent));
const go = band && band.children[1]; ok(go && go.textContent === '리드나우 2로 ›' && go.href === ON.to + '?go=confirm&from=old', '② 띠 "리드나우 2로 ›" 주소(old 빼고 from=old) — ' + (go && go.href));
r = run({ ls: { 'rn2-move': J(ON) }, ss: { 'rn2-old': '1' }, search: '' });
ok(r.rep.length === 0 && !!r.els.rn2oldband, '② 같은 탭 새로고침(주소에 old 없음)도 옛 화면 그대로');
r = run({ ls: { 'rn2-move': J(ON) }, ss: { 'rn2-old': '1', 'rn2-old-hide': '1' } }); ok(!r.els.rn2oldband, '② 띠를 닫았으면 이 탭에서 다시 안 뜸');
r = run({ ls: { 'rn2-move': J({ state: 'back', to: ON.to }) }, search: '?old=1' }); ok(r.rep.length === 0 && !r.els.rn2oldband, '② 되돌린 뒤 ?old=1 → 띠 없음(지금 웹앱이 본 화면)');
r = run({ ls: { 'rn2-move': J(ON) }, search: '?old=1', ready: 'loading' }); ok(!!r.els.rn2oldband, '② 본문이 아직이면 DOMContentLoaded 때 띠');
// ③
for (const [nm, v] of [['back', J({ state: 'back', to: ON.to })], ['off', J({ state: 'off', to: ON.to })], ['to 없음', J({ state: 'on' })], ['깨진 글', '{x'], ['없음', null]]) {
  r = run({ ls: v == null ? {} : { 'rn2-move': v }, search: '?go=deliv' }); ok(r.rep.length === 0 && !r.win.RN2_MOVING, '③ ' + nm + ' → 안 넘어감');
}
// ④
r = run({ ls: { 'rn2-move': J(ON) }, u2: true }); ok(r.rep.length === 0, '④ 새 웹앱 안(window.U2)에서는 안 넘어감');
r = run({ ls: { 'rn2-move': J(ON) }, iframe: true }); ok(r.rep.length === 0, '④ 다른 창 안(iframe)에서는 안 넘어감');
// RN2_MOVE_SYNC — 로그인 뒤 문서 1개
const fdb = (data, fail) => { const calls = []; return { calls, collection: (c) => ({ doc: (d) => ({ get: () => { calls.push(c + '/' + d); return fail ? Promise.reject({ code: 'permission-denied' }) : Promise.resolve({ exists: !!data, data: () => data }); } }) }) }; };
(async () => {
  r = run({ search: '?go=y24ord' }); let db = fdb({ move: ON }); r.win.RN2_MOVE_SYNC(db); await new Promise((f) => setTimeout(f, 5));
  ok(db.calls.join() === 'ui2_site/main' && r.rep[0] === ON.to + '?go=y24ord&from=old', '동기화: 새 웹앱을 안 연 기기도 ui2_site/main 1개 읽고 넘어감 — ' + r.rep[0]);
  r.win.RN2_MOVE_SYNC(db); ok(db.calls.length === 1, '동기화: 한 번 연 동안 한 번만 읽음');
  r = run({}); db = fdb({ move: { state: 'back', to: ON.to } }); r.win.RN2_MOVE_SYNC(db); await new Promise((f) => setTimeout(f, 5)); ok(r.rep.length === 0 && r.win.RN2_MOVE_LAST.state === 'back', '동기화: back → 안 넘어감');
  r = run({}); db = fdb(null, true); r.win.RN2_MOVE_SYNC(db); await new Promise((f) => setTimeout(f, 5)); ok(r.rep.length === 0 && r.win.RN2_MOVE_LAST.err === 'permission-denied', '동기화: 규칙이 막아도 조용히(까닭은 RN2_MOVE_LAST)');
  r = run({ search: '?old=1' }); db = fdb({ move: ON }); r.win.RN2_MOVE_SYNC(db); ok(db.calls.length === 0, '동기화: ?old=1 탭은 읽지도 않음');
  r = run({ u2: true }); db = fdb({ move: ON }); r.win.RN2_MOVE_SYNC(db); ok(db.calls.length === 0, '동기화: 새 웹앱 안에서는 안 함');
  ok(/S\.user = u; pm\('auth'\); try \{ if \(window\.RN2_MOVE_SYNC\) RN2_MOVE_SYNC\(db\)/.test(html), '로그인 뒤 한 줄 RN2_MOVE_SYNC(db)');
  ok(/col: 'ui2_site', write: false, doc: 'main'/.test(html), '권한 점검(⚙ 설정 › 권한)에 ui2_site/main 읽기 — 규칙이 막으면 ✗');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ tU2MOVE1111 모두 통과'); process.exit(bad ? 1 : 0);
})();
