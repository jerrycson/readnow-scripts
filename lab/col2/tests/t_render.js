/* t_render — (11/11 col2rep2 · 외부 정보 '못 읽음 100%': 예스24 도서·예스24 중고·네이버 도서) 번외 그려 읽기가 결과 목록이 늦게 오는 검색 화면을 끝까지 그림
 *  가짜 검색 화면: 머리에 같은 꼴 링크(/goods/1)가 곧바로 · 결과 목록(itemUnit · /goods/2)은 1.5초 뒤 따로 불러옴 · 지연 로딩 칸은 화면이 커야 보임
 *  예전: 첫 링크가 보이자마자 떠 결과 목록이 없는 HTML(→ '검색 결과 목록(itemUnit)이 화면에 없음') · 이제: 운영 도우미 /render처럼 크게 · 다 그린 뒤
 * 실행: node tests/t_render.js */
const L = require('./lib.js'); const { ok } = L; const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
const { Browser } = require('../helper/col2-cdp.js');
const PAGE = `<!doctype html><title>검색</title><body><div class="gnb"><a href="/Product/Goods/1">광고 책</a></div><div id="list"></div><div style="height:4000px"></div><div id="lazy"></div>
<script>fetch('/r').then((r) => r.text()).then((t) => { document.getElementById('list').innerHTML = t; });
new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) document.getElementById('lazy').innerHTML = '<a href="/Product/Goods/3">아래 칸</a>'; }).observe(document.getElementById('lazy'));</script></body>`;
(async () => { const srv = http.createServer((q, s) => { const H = (h) => { s.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); s.end(h); }; if (q.url === '/main') { s.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': 'pcid=1; Path=/; Max-Age=3600' }); return s.end('<title>첫 화면</title><body>main</body>'); } if (q.url.startsWith('/csearch')) { if (!/pcid=1/.test(q.headers.cookie || '')) { s.writeHead(302, { Location: '/main' }); return s.end(); } return H('<title>검색</title><div class="itemUnit"><a href="/Product/Goods/7">책</a></div>'); } /* (0.1.78) 예스24처럼: 쿠키 없이 검색하면 첫 화면으로 돌려보냄 */ if (q.url === '/r') return setTimeout(() => H('<div class="itemUnit"><a class="gd_name" href="/Product/Goods/2">소년이 온다</a></div>'), 1500); H(PAGE); }); /* 결과 목록은 1.5초 늦게 따로 받음(예스24·네이버처럼) */ await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${srv.address().port}`;
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'col2r_')); const exe = path.join(D, 'chrome'); fs.writeFileSync(exe, `#!/bin/bash\nexec ${JSON.stringify(L.chromium().executablePath())} --no-sandbox "$@"\n`); fs.chmodSync(exe, 0o755); const b = new Browser({ exe, profile: path.join(D, 'p'), headless: true, rect: { x: 0, y: 0, w: 1280, h: 900 }, stale: async () => {}, handoffMs: 0 });
  try { await b.launch(); const t0 = Date.now(); const R = await b.render(base + '/search?q=1', { wait: 12000, re: '\\/goods\\/\\d+', reFlags: 'i' }); const ms = Date.now() - t0;
    ok(R.ok && /itemUnit/.test(R.html) && /Goods\/2/.test(R.html), '결과 목록이 늦게 와도(1.5초) 결과 목록까지 그린 HTML을 뜸 — 머리 링크만 보고 일찍 뜨지 않음', R.ok ? (R.html.match(/Goods\/\d/g) || []).join(',') : R.why);
    ok(R.ok && /Goods\/3/.test(R.html), '아래쪽 지연 로딩 칸도 든 HTML(화면을 크게 — 운영 도우미 /render처럼)');
    ok(ms < 11000, '다 그려지면 wait(12초)까지 기다리지 않고 뜸', ms + 'ms');
    /* (0.1.78 bunoe3) 그리기 칸을 오래 씀 → 첫 방문에 받은 사이트 쿠키로 다음 검색이 첫 화면으로 안 튕김 · 못 읽으면 끝난 곳(land)을 알림 */
    const c1 = await b.render(base + '/csearch?q=1', { wait: 3000, re: '\\/goods\\/\\d+', reFlags: 'i' });
    ok(c1.land && /\/main$/.test(c1.land.final) && c1.land.title === '첫 화면' && !/Goods\/7/.test(c1.html || ''), '쿠키 없는 첫 검색은 첫 화면으로 튕김 — 그린 HTML과 함께 끝난 곳(주소·제목)을 돌려줌(뒤 해석이 못 읽으면 하루 요약 land로)', JSON.stringify(c1.land));
    const c2 = await b.render(base + '/csearch?q=2', { wait: 3000, re: '\\/goods\\/\\d+', reFlags: 'i' });
    ok(c2.ok && /Goods\/7/.test(c2.html) && /\/csearch$/.test(c2.land.final), '같은 그리기 칸이라 쿠키가 남아 다음 검색은 결과를 읽음(운영 도우미의 오래 쓰는 프로필처럼)', c2.ok ? c2.land.final : c2.why);
    const c3 = await b.render(base + '/csearch?q=3', { wait: 3000, re: '\\/goods\\/\\d+', reFlags: 'i', keep: false });
    ok(/\/main$/.test((c3.land || {}).final || '') && !/Goods\/7/.test(c3.html || ''), 'renderKeep:false(되돌림 스위치)면 예전처럼 그릴 때마다 새 칸 — 쿠키 없음', JSON.stringify(c3.land));
    const c4 = await b.render(base + '/csearch?q=4', { wait: 3000, re: '\\/goods\\/\\d+', reFlags: 'i' });
    ok(c4.ok && /Goods\/7/.test(c4.html), '새 칸으로 한 번 그린 뒤에도 오래 쓰는 칸은 그대로 남아 쿠키가 있음');
  } finally { try { await b.close(); } catch (e) {} try { b.proc && b.proc.kill('SIGKILL'); } catch (e) {} srv.close(); }
  L.done('t_render'); })();
