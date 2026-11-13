/* tURL1113 — (url1 11/13) 새 주소(readnow.kr · Firebase 기본 주소)에서 휴대폰 앱 설치
 *  ① 휴대폰 앱 설치 파일(app/m/*.webmanifest): 옛 경로(/readnow-scripts/app/)가 없음 · start_url·scope·바로 가기가 상대 경로라
 *     옛 주소·새 주소 모두에서 웹앱 첫 화면(/app/)으로 풀리고 범위 안 · id 없음(= start_url) · 아이콘 파일이 있음
 *  ② 만드는 도구(src/tools/app-icons.py)도 같은 기준 경로
 *  ③ 웹앱 맨 앞: Firebase 기본 주소(readnow-3a385.web.app·firebaseapp.com)로 열면 readnow.kr로 넘김(경로·?·# 그대로) · readnow.kr·옛 주소·?stay=1·다른 창 안은 그대로
 * 실행: node src/tests/tURL1113.js (저장소 뿌리 기준 · 서버·브라우저 필요 없음) */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 300)); } else console.log('  ✓', m); };
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '../..'); const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
console.log('① 휴대폰 앱 설치 파일');
const KEYS = ['home', 'confirm', 'deliv', 'reg', 'ppt', 'batch', 'products', 'orders', 'search', 'mgr'];
for (const k of KEYS) {
  const f = 'app/m/' + k + '.webmanifest'; const t = rd(f); const m = JSON.parse(t);
  ok(!/readnow-scripts/.test(t) && !('id' in m), f + ': 옛 경로 없음 · id 없음');
  for (const base of ['https://readnow.kr/app/m/', 'https://readnow-3a385.web.app/app/m/', 'https://jerrycson.github.io/readnow-scripts/app/m/']) {
    const app = new URL('../', base).href; const st = new URL(m.start_url, base), sc = new URL(m.scope, base).href;
    ok(sc === app && st.href.startsWith(sc) && st.pathname === new URL(app).pathname && (k === 'home' ? !st.search : st.searchParams.get('go') === k), `${k} @ ${new URL(base).host}: 시작 ${st.pathname}${st.search} · 범위 ${new URL(sc).pathname}`);
    ok((m.shortcuts || []).every((s) => new URL(s.url, base).href.startsWith(sc)), `${k} @ ${new URL(base).host}: 바로 가기도 범위 안`);
  }
  ok(m.icons.every((i) => fs.existsSync(path.join(ROOT, 'app/m', i.src))) && m.icons.some((i) => i.sizes === '512x512') && m.icons.some((i) => i.purpose === 'maskable'), f + ': 아이콘 파일 있음(192·512·마스커블)');
  ok(m.display === 'standalone' && m.name && m.short_name, f + ': 설치 조건(이름·standalone)');
}
{ const x = rd('app/index.html'); ok(/l\.href = 'm\/' \+ g \+ '\.webmanifest'/.test(x), '웹앱이 m/화면.webmanifest(상대)를 붙임'); }
console.log('② 만드는 도구');
{ const p = rd('src/tools/app-icons.py'); ok(/^BASE = '\.\.\/'/m.test(p) && !/'id': start/.test(p), "app-icons.py 기준 경로 '../' · id 없음"); }
console.log('③ Firebase 기본 주소 → readnow.kr');
const A = rd('src/app.html');
{ const i = A.indexOf('<script>/* (url1 11/13) 🌐'); const j = A.indexOf('</script>', i); const code = A.slice(A.indexOf('*/', i) + 2, j);
  ok(i > 0 && i < A.indexOf('<script>/* (리드나우 2 이전') && i < A.indexOf('<script>/* (priv1 11/13) 🚚'), '맨 앞(다른 넘김·짐 넘기기보다 먼저)');
  ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(code), '브라우저 팝업 없음');
  const run = (href, top) => { const u = new URL(href); let to = null; const w = {}; w.top = top === false ? {} : w;
    const sb = { window: w, location: { hostname: u.hostname, pathname: u.pathname, search: u.search, hash: u.hash, replace: (v) => { to = v; } } }; vm.runInNewContext(code, sb); return to; };
  ok(run('https://readnow-3a385.web.app/app/?go=deliv#x') === 'https://readnow.kr/app/?go=deliv#x', 'web.app/app/?go=deliv#x → readnow.kr 같은 경로');
  ok(run('https://readnow-3a385.firebaseapp.com/app/') === 'https://readnow.kr/app/', 'firebaseapp.com → readnow.kr');
  ok(run('https://readnow.kr/app/?go=reg') === null, 'readnow.kr 는 그대로');
  ok(run('https://jerrycson.github.io/readnow-scripts/app/') === null, '옛 주소는 그대로(짐 넘기기 띠가 맡음)');
  ok(run('https://readnow-3a385.web.app/app/?stay=1') === null, '?stay=1 은 넘기지 않음');
  ok(run('https://readnow-3a385.web.app/app/', false) === null, '다른 창 안(iframe)은 그대로');
  ok(run('http://localhost:8080/app/') === null, '시험 주소는 그대로'); }
{ const x = rd('app/index.html'); const a = A.match(/const APP_VER = '([\d.]+)'/)[1]; ok(x.includes('(url1 11/13) 🌐') && x.includes("APP_VER = '" + a + "'"), '결과물(app/index.html)에도 들어감 · 판 ' + a); }
console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
