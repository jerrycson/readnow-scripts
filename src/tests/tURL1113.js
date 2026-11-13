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
{ const x = rd('app/index.html'); ok(/l\.href = 'm\/' \+ g \+ '\.webmanifest' \+ v/.test(x), '웹앱이 m/화면.webmanifest(상대 · 판 표시)를 붙임'); }
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
console.log('④ (url2) 설치 파일 주소의 판 표시 — 휴대폰 크롬이 옛 설치 파일을 저장본으로 쥐지 않게');
{ const x = rd('app/index.html'); const i = x.indexOf('<script>/* (1.44.0) 📱'); const code = x.slice(x.indexOf('*/', i) + 2, x.indexOf('</script>', i));
  const run = (search, ready, ver, sa) => { const links = []; const ls = {}; let dcl = null;
    const doc = { readyState: ready, addEventListener: (n, f) => { if (n === 'DOMContentLoaded') dcl = f; }, createElement: () => ({}), head: { appendChild: (l) => links.push(l) }, querySelector: () => ({}) };
    const sb = { document: doc, location: { search, pathname: '/app/', hash: '', replace: () => {} }, URLSearchParams, navigator: {}, localStorage: { getItem: (k) => ls[k] || null }, encodeURIComponent };
    sb.window = sb; sb.matchMedia = () => ({ matches: !!sa }); if (ver) vm.runInNewContext('var APP_VER = ' + JSON.stringify(ver), sb);
    vm.runInNewContext(code, sb); const before = links.length; if (dcl) dcl(); if (dcl) dcl(); return { before, links }; };
  const r1 = run('?go=deliv', 'loading', '9.9.9');
  ok(r1.before === 0, '문서를 다 읽기 전엔 걸지 않음(APP_VER가 body 끝에서 정해짐)');
  ok(r1.links.length === 2 && r1.links[0].rel === 'manifest' && r1.links[0].href === 'm/deliv.webmanifest?v=9.9.9', '설치 파일 = m/deliv.webmanifest?v=9.9.9', r1.links);
  ok(r1.links[1] && r1.links[1].rel === 'apple-touch-icon' && r1.links[1].href === 'm/deliv-180.png?v=9.9.9', '아이콘도 같은 판 표시', r1.links);
  const r2 = run('?go=zzz', 'complete', null); ok(r2.links.length === 2 && r2.links[0].href === 'm/home.webmanifest', 'APP_VER를 못 읽으면 판 표시 없이라도 걺 · 모르는 화면은 home', r2.links);
  ok(/\?v=' \+ encodeURIComponent\(APP_VER\)/.test(A), '원본(src/app.html)에도 판 표시'); }
console.log('⑤ (url2) Hosting — 설치 파일·폴더 주소는 늘 새로 확인 · 옛 경로 /readnow-scripts/… → 새 경로(쿼리 그대로)');
{ const F = JSON.parse(rd('firebase.json')).hosting; const { restConfig } = require(path.join(ROOT, 'hosting/deploy.js')); const C = restConfig(F);
  const nc = (C.headers || []).filter((h) => h.headers['Cache-Control'] === 'no-cache');
  ok(nc.some((h) => h.glob && /webmanifest/.test(h.glob)), '*.webmanifest = no-cache(예전 max-age=3600)');
  const dirRe = nc.find((h) => h.regex); ok(dirRe && ['/app/', '/', '/ui2/'].every((p) => new RegExp(dirRe.regex).test(p)) && !new RegExp(dirRe.regex).test('/app/m/home.webmanifest'), '폴더 주소(/app/ · / · /ui2/)도 no-cache(예전 max-age=3600)');
  const R = C.redirects || []; const go = (p) => { for (const r of R) { const m = r.regex ? p.match(new RegExp(r.regex)) : null; if (m) return { code: r.statusCode, to: r.location.replace(/:(\d+)/g, (_, n) => m[+n] || '') }; } return null; };
  for (const [p, want] of [['/readnow-scripts/app/', '/app/'], ['/readnow-scripts/app/m/home.webmanifest', '/app/m/home.webmanifest'], ['/readnow-scripts/manual/', '/manual/'], ['/readnow-scripts', '/'], ['/readnow-scripts/', '/']]) {
    const g = go(p); ok(g && g.code === 301 && g.to === want, `${p} → ${want} (301)`, g); }
  ok(go('/app/') === null && go('/readnow-scripts-x/') === null, '/app/ 등 다른 주소는 넘기지 않음'); }
console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
