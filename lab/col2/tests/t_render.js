/* t_render — (11/11 col2rep2 · 외부 정보 '못 읽음 100%': 예스24 도서·예스24 중고·네이버 도서) 번외 그려 읽기가 결과 목록이 늦게 오는 검색 화면을 끝까지 그림
 *  가짜 검색 화면: 머리에 같은 꼴 링크(/goods/1)가 곧바로 · 결과 목록(itemUnit · /goods/2)은 1.5초 뒤 따로 불러옴 · 지연 로딩 칸은 화면이 커야 보임
 *  예전: 첫 링크가 보이자마자 떠 결과 목록이 없는 HTML(→ '검색 결과 목록(itemUnit)이 화면에 없음') · 이제: 운영 도우미 /render처럼 크게 · 다 그린 뒤
 * 실행: node tests/t_render.js */
const L = require('./lib.js'); const { ok } = L; const fs = require('fs'), os = require('os'), path = require('path'), http = require('http');
const { Browser } = require('../helper/col2-cdp.js');
const PAGE = `<!doctype html><title>검색</title><body><div class="gnb"><a href="/Product/Goods/1">광고 책</a></div><div id="list"></div><div style="height:4000px"></div><div id="lazy"></div>
<script>fetch('/r').then((r) => r.text()).then((t) => { document.getElementById('list').innerHTML = t; });
new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) document.getElementById('lazy').innerHTML = '<a href="/Product/Goods/3">아래 칸</a>'; }).observe(document.getElementById('lazy'));</script></body>`;
(async () => { const srv = http.createServer((q, s) => { const H = (h) => { s.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); s.end(h); }; if (q.url === '/r') return setTimeout(() => H('<div class="itemUnit"><a class="gd_name" href="/Product/Goods/2">소년이 온다</a></div>'), 1500); H(PAGE); }); /* 결과 목록은 1.5초 늦게 따로 받음(예스24·네이버처럼) */ await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const base = `http://127.0.0.1:${srv.address().port}`;
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'col2r_')); const exe = path.join(D, 'chrome'); fs.writeFileSync(exe, `#!/bin/bash\nexec ${JSON.stringify(L.chromium().executablePath())} --no-sandbox "$@"\n`); fs.chmodSync(exe, 0o755); const b = new Browser({ exe, profile: path.join(D, 'p'), headless: true, rect: { x: 0, y: 0, w: 1280, h: 900 }, stale: async () => {}, handoffMs: 0 });
  try { await b.launch(); const t0 = Date.now(); const R = await b.render(base + '/search?q=1', { wait: 12000, re: '\\/goods\\/\\d+', reFlags: 'i' }); const ms = Date.now() - t0;
    ok(R.ok && /itemUnit/.test(R.html) && /Goods\/2/.test(R.html), '결과 목록이 늦게 와도(1.5초) 결과 목록까지 그린 HTML을 뜸 — 머리 링크만 보고 일찍 뜨지 않음', R.ok ? (R.html.match(/Goods\/\d/g) || []).join(',') : R.why);
    ok(R.ok && /Goods\/3/.test(R.html), '아래쪽 지연 로딩 칸도 든 HTML(화면을 크게 — 운영 도우미 /render처럼)');
    ok(ms < 11000, '다 그려지면 wait(12초)까지 기다리지 않고 뜸', ms + 'ms');
  } finally { try { await b.close(); } catch (e) {} try { b.proc && b.proc.kill('SIGKILL'); } catch (e) {} srv.close(); }
  L.done('t_render'); })();
