/* tPRIV1113 — (priv1 11/13) 저장소 비공개 전 남은 옮기기
 *  ① 클라우드 🔑 진단 열쇠 길: /diag·/kp-in·/board-in 세 곳에만 X-RN-Diag-Key · 해시만 비교 · 시험 열쇠는 GitHub 자동 작업 열쇠로만
 *  ② 웹앱 안 옛 주소(github.io·raw 설치 글·Releases)를 readnow.kr로 · 점검 목록은 Firestore 먼저(같은 날 GitHub 건너뜀)
 *  ③ 🚚 옛 주소 → 새 주소 짐 넘기기(가짜 두 창으로 postMessage 흐름) — 출처 확인 · 처음 기기면 모두, 쓰던 기기면 빈 칸만
 *  ④ 🐾 책방 친구 설치 파일 쪽(hosting/friend-dl.js) 꼴 · Hosting 작업에 단계
 * 실행: node src/tests/tPRIV1113.js (저장소 뿌리 기준 · 서버·브라우저 필요 없음) */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 300)); } else console.log('  ✓', m); };
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '../..'); const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
console.log('① 클라우드 진단 열쇠 길');
{ const s = rd('cloud/index.js');
  ok((s.match(/if \(!who && await diagKeyOk\(req\)\) who = 'diag-key';/g) || []).length === 3, '열쇠 길은 세 곳(/diag·/kp-in·/board-in)만');
  for (const p of ["if (path === '/diag')", "if (path === '/kp-in')", "if (path === '/board-in')"]) { const i = s.indexOf(p); ok(i > 0 && s.slice(i, i + 1600).includes('diagKeyOk(req)'), p + ' 안에 있음'); }
  const i = s.indexOf("if (path === '/pclive')"); ok(i > 0 && !s.slice(i, i + 1400).includes('diagKeyOk'), '/pclive 는 예전 열쇠만');
  ok(/createHash\('sha256'\)\.update\(k\)/.test(s) && /timingSafeEqual\(Buffer\.from\(String\(x\.h\)\), Buffer\.from\(h\)\)/.test(s) && /k\.length < 32/.test(s), '해시만 비교 · 짧은 열쇠 거절');
  ok(/J0\.diagKey && who !== 'diag-key'/.test(s) && /Math\.min\(24, \+o\.hours/.test(s), '시험 열쇠는 GitHub 자동 작업 열쇠로만 · 24시간 안');
  const k = rd('cloud/setup-diagkey.sh'); ok(/openssl rand -hex 32/.test(k) && /sha256sum/.test(k) && /app_secrets\/diag_key/.test(k) && !/echo "\$K" *>/.test(k), 'Cloud Shell 글: 열쇠는 화면에만 · 해시만 Firestore'); }
console.log('② 웹앱 옛 주소');
const A = rd('src/app.html');
{ const live = A.split('\n').filter((l) => !/^\s*(\/\*|\*)/.test(l));
  const bads = live.filter((l) => /raw\.githubusercontent\.com\/jerrycson\/readnow-scripts\/main\/(local|lab|app|cloud)\//.test(l) || /PJ_UI2_URL = 'https:\/\/jerrycson/.test(l) || /FRW_REL = 'https:\/\/github\.com/.test(l) || /'https:\/\/jerrycson\.github\.io\/readnow-scripts\/cloud\//.test(l));
  ok(bads.length === 0, '설치 글·리드나우 2·책방 친구·할인 셈 파일 주소가 readnow.kr', bads.map((l) => l.slice(0, 80)));
  ok(/FRW_REL = 'https:\/\/readnow\.kr\/dl\/friend\/'/.test(A) && /PJ_UI2_URL = 'https:\/\/readnow\.kr\/ui2\/'/.test(A), '책방 친구 설치 쪽 · 리드나우 2 = readnow.kr');
  ok(/async function c2SrcGet\(\) \{ for \(const u of \['https:\/\/readnow\.kr\/src\/readnow-collector\.src\.js'/.test(A) && (A.match(/await c2SrcGet\(\)/g) || []).length === 2, '번외 운영 본체 글: readnow.kr 먼저');
  ok(/r\.status !== 404\) AUD\.err/.test(A) && /fsDay\.has\(\(fb \? 'fable' : 'daily'\) \+ '\|' \+ d0\)\) continue;/.test(A), '점검 목록: GitHub 404(비공개)는 오류 아님 · Firestore에 같은 날 있으면 건너뜀'); }
console.log('③ 짐 넘기기');
{ const i = A.indexOf('<script>/* (priv1 11/13) 🚚'); const j = A.indexOf('</script>', i); const code = A.slice(i + 8, j);
  ok(i > 0 && i < A.indexOf('firebase-app-compat.js'), '본문·Firebase보다 앞(먼저 돎)');
  ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(code), '브라우저 팝업 없음');
  const mkLS = (o) => { const m = new Map(Object.entries(o)); return { get length() { return m.size; }, key: (i) => [...m.keys()][i], getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m }; };
  const mkWin = (origin, search, ls) => { const L = {}; const w = { location: { origin, search, pathname: '/app/', hash: '', replace: (u) => { w.replaced = u; } }, localStorage: ls, addEventListener: (t, f) => { (L[t] = L[t] || []).push(f); }, _fire: (t, e) => (L[t] || []).forEach((f) => f(e)), setTimeout: (f) => f(), document: null };
    const body = { kids: [], prepend: (n) => body.kids.unshift(n) }; const el = () => { const n = { style: {}, set innerHTML(v) { n._h = v; }, get innerHTML() { return n._h; }, querySelector: (q) => (q === 'small' ? (n._s = n._s || { textContent: '' }) : (n._b = n._b || {})) }; return n; };
    w.document = { body, createElement: el, getElementById: (id) => body.kids.find((k) => k.id === id) || null, addEventListener: () => {} }; return w; };
  const run = (w) => vm.runInNewContext(code, { window: w, location: w.location, localStorage: w.localStorage, document: w.document, setTimeout: w.setTimeout, JSON, Date });
  /* 옛 창 · 새 창 서로 잇기 */
  const oldLS = mkLS({ 'rn-device': 'HOME', 'rn-lastver': '1.78.500', 'rn-x': 'a', other: 'z' }); const W1 = mkWin('https://jerrycson.github.io', '', oldLS); run(W1);
  ok(W1.document.body.kids.length === 1 && /readnow\.kr\/app\//.test(W1.document.body.kids[0]._h), '옛 주소에 띠가 뜸');
  const newLS = mkLS({ 'rn-x': 'b' }); const W2 = mkWin('https://readnow.kr', '?rnmove=1', newLS);
  const src1 = { postMessage: (d, o) => { ok(o === 'https://readnow.kr', '옛 창은 새 출처로만 보냄'); W2._fire('message', { origin: 'https://evil.example', data: d, source: {} }); ok(!newLS.getItem('rn-device'), '다른 출처 글은 무시'); W2._fire('message', { origin: 'https://jerrycson.github.io', data: d, source: src2 }); } };
  const src2 = { postMessage: (d, o) => { ok(o === 'https://jerrycson.github.io' && d.t === 'rn-move-done', '새 창이 옮김 끝을 알림', d); W1._fire('message', { origin: 'https://readnow.kr', data: d, source: src1 }); } };
  W2.opener = { postMessage: (d, o) => { ok(o === 'https://jerrycson.github.io' && d.t === 'rn-move-ready', '새 창이 준비됨을 옛 출처로만'); W1._fire('message', { origin: 'https://readnow.kr', data: d, source: src1 }); } };
  run(W2);
  ok(newLS.getItem('rn-device') === 'HOME' && newLS.getItem('rn-lastver') === '1.78.500' && newLS.getItem('other') == null, 'rn 칸만 옮김(다른 칸은 안 옮김)');
  ok(newLS.getItem('rn-x') === 'a', '처음 여는 기기(rn-lastver 없음)면 옛 값으로 채움');
  ok(W2.replaced === '/app/', '옮긴 뒤 새 주소를 다시 엶(?rnmove 뺌)');
  ok(oldLS.getItem('rn-moved-to') && /칸 옮김/.test(W1.document.body.kids[0]._s.textContent), '옛 창 띠에 옮김 끝 글');
  /* 쓰던 기기: 있는 칸은 그대로 */
  const LS3 = mkLS({ 'rn-lastver': '1.78.556', 'rn-x': 'keep' }); const W3 = mkWin('https://readnow.kr', '?rnmove=1', LS3); W3.opener = { postMessage: () => {} }; run(W3);
  W3._fire('message', { origin: 'https://jerrycson.github.io', data: { t: 'rn-move', items: { 'rn-x': 'old', 'rn-new': 'n' } }, source: { postMessage: () => {} } });
  ok(LS3.getItem('rn-x') === 'keep' && LS3.getItem('rn-new') === 'n', '쓰던 기기는 빈 칸만 채움');
  const W4 = mkWin('https://readnow.kr', '', mkLS({})); run(W4); ok(W4.document.body.kids.length === 0, '새 주소 평소엔 아무 일 없음'); }
console.log('④ 책방 친구 설치 쪽 · Hosting');
{ const F = require(path.join(ROOT, 'hosting/friend-dl.js'));
  ok(F.kindOf('readnow-friend_0.2.2_x64-setup.exe') === 'win' && F.kindOf('readnow-friend-0.2.2.apk') === 'android' && F.kindOf('x.zip') === null, '파일 종류');
  const h = F.page({ ver: '0.2.2', at: '2026-11-02', files: [{ name: 'a.apk', size: 1048576, kind: 'android' }, { name: 'b_x64-setup.exe', size: 2097152, kind: 'win' }] });
  ok(/noindex/.test(h) && /href="a\.apk" download/.test(h) && /윈도우/.test(h) && /<html lang="ko">/.test(h), '받기 쪽 글(한국어 · 검색 막음)');
  const y = rd('.github/workflows/deploy-hosting.yml'); ok(/node hosting\/friend-dl\.js \.hosting\/public\/dl\/friend \|\| echo "::warning::/.test(y) && /workflow_run:/.test(y) && /'ui2\/\*\*'/.test(y), 'Hosting 작업: 설치 파일 단계(실패해도 경고만) · 친구 판 뒤 · ui2 바뀜');
  const d = fs.readFileSync(path.join(ROOT, 'src/tools/kpsum-get.sh'), 'utf8'); ok(/X-RN-Diag-Key/.test(d) && /RN_DIAG_VIA/.test(d), '출판 요약 받기도 열쇠 길 먼저'); }
console.log(bad ? `❌ tPRIV1113 실패 ${bad}` : '✅ tPRIV1113 모두 통과'); process.exit(bad ? 1 : 0);
