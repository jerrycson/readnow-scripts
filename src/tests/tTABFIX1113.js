// tTABFIX1113 — 정범님 11/13 11:54 「크롬 수집기가 자꾸 탭이나 창을 띄우는 걸 당장 고쳐줘」(tabfix)
//  ① 수집기가 일을 위해 여는 탭은 모두 뒤 탭(active:false · setParent 없음 · 사람 창이면 맨 뒤 · 작업 창이면 옆자리)
//  ② 안전한 새로고침: 새 탭은 뒤 탭 · 사람이 그 탭을 쓰는 중(보이고 90초 안 입력)이면 손을 놓을 때까지 기다림
//  ③ 판 몰아 받기: 처음 새 판을 본 때부터 10분 모아 한 번 · 웹앱 '업데이트 먼저'(sgUrgent)는 기다리지 않음 · 단계 사이 바꿈도 같은 10분
//  ④ 저절로 앞으로 띄우던 곳(번외 손발 window.focus · 웹앱 자동 수집 창) 없앰 — 사람이 누른 단추로 여는 창은 그대로
//  ⑤ 💰 매입가 기입 나눔 기본 = 정가 비율로(정범님 11/13 바로잡음)
//  노드만 — 쓰는 법: cd src/tests && node tTABFIX1113.js
const fs = require('fs'), path = require('path');
const pick = (...a) => a.find((f) => fs.existsSync(f));
const s = fs.readFileSync(pick(path.join(__dirname, '..', 'readnow-collector.src.js'), path.join(__dirname, '..', 'readnow-collector.user.js')), 'utf8');
const app = fs.readFileSync(pick(path.join(__dirname, '..', 'app.html'), path.join(__dirname, '..', 'index.html')), 'utf8');
let bad = 0; const ok = (c, m, x) => { console.log((c ? '✓ ' : '❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 300))); if (!c) bad++; };
const cut = (a, b) => { const i = s.indexOf(a); const j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error('못 찾음: ' + a); return s.slice(i, j); };
try {
  // ① 뒤 탭 도우미
  const H = cut('window.__rnTabOpt = ', '(function rnFeatInit() {');
  const mk = (o) => { const L = {}; const W = { __rnWork: o.work ? { isWork: () => true } : null, addEventListener: (k, f) => { L[k] = f; } }; const D = { visibilityState: o.vis || 'visible' };
    new Function('window', 'document', 'Date', H)(W, D, { now: () => o.now || 0 }); return { W, D, L }; };
  { const { W } = mk({}); const o = W.__rnTabOpt(); ok(o.active === false && o.setParent === false && o.insert === false, '① 사람 창: 뒤 탭 · setParent 없음 · 맨 뒤', o); }
  { const { W } = mk({ work: true }); const o = W.__rnTabOpt(); ok(o.active === false && o.setParent === false && o.insert === true, '① 작업 창: 뒤 탭 · 같은 창 옆자리', o); }
  { const { W, L } = mk({ now: 100000 }); ok(!W.__rnHumanBusy(90), '② 만진 적 없으면 사람 안 씀'); L.mousemove({ isTrusted: true }); ok(W.__rnHumanBusy(90), '② 방금 마우스 → 쓰는 중'); }
  { const o = { now: 100000 }; const { W, L, D } = mk(o); L.keydown({ isTrusted: true }); D.visibilityState = 'hidden'; ok(!W.__rnHumanBusy(90), '② 다른 탭으로 가면(안 보임) 기다리지 않음'); }
  { const { W, L } = mk({ now: 100000 }); L.mousemove({ isTrusted: false }); ok(!W.__rnHumanBusy(90), '② 스크립트가 만든 가짜 입력은 사람으로 안 셈'); }
  // 모든 GM_openInTab — 앞 탭(active:true)은 허용한 곳만
  const opens = [...s.matchAll(/GM_openInTab\(([^;]{0,260})/g)].map((m) => m[0]);
  const front = opens.filter((x) => /active:\s*true/.test(x));
  const allow = [/NAVER_URL\(ret\), \{ active: true/, /P\.urls\[i\], \{ active: true/, /GM_openInTab\(SURL, \{ active: true/];
  const bad1 = front.filter((x) => !allow.some((r) => r.test(x)));
  ok(!bad1.length, `① 앞 탭으로 여는 곳은 사람 손이 꼭 필요한 셋만(네이버 로그인 풀림 · 🌐 머리 받기 설치 화면 · 🔔 출고 알림) — 그 밖 ${bad1.length}곳`, bad1);
  ok(opens.filter((x) => /__rnTabOpt\(\)/.test(x)).length >= 6, '① 로그인·되살리기·바깥 사이트·예스24 탭이 뒤 탭 도우미를 씀', opens.filter((x) => /__rnTabOpt\(\)/.test(x)).length);
  ok(!/setParent:\s*true/.test(opens.filter((x) => !/active:\s*true/.test(x) && !/location\.href\.replace/.test(x)).join('\n')), '① 뒤 탭은 setParent 없음(안전한 새로고침의 작업 창만 예외)');
  // ② 안전한 새로고침
  const SR = cut('async function safeReload(reason, resumeKey)', '/* (1.78.4) 🐕 작업 멈춤 지킴이');
  ok(/GM_openInTab\(location\.href\.replace\(\/#\.\*\$\/, ''\)[^;]*\{ active: false, insert: true, setParent: isW \}/.test(SR), '② 새 판 바꿈 새 탭 = 뒤 탭(active:false) · 옆자리 · setParent는 작업 창만');
  ok(![...SR.matchAll(/GM_openInTab\([^;]{0,200}/g)].some((m) => /active:\s*true/.test(m[0])), '② 안전한 새로고침 안에 앞 탭 열기 없음');
  ok(/__rnHumanBusy\(90\)[\s\S]{0,600}while \(window\.__rnHumanBusy\(90\)\) await sleep\(5000\)/.test(SR) && SR.indexOf('__rnHumanBusy(90)') < SR.indexOf('GM_openInTab'), '② 사람이 쓰는 중이면 손 놓은 틈까지 기다린 뒤 새 탭');
  ok(SR.indexOf('__rnHumanBusy(90)') < SR.indexOf('window.__rnSgOn && window.__rnSgOn()'), '② 기다린 뒤에도 🚚 출고 보호를 다시 봄(기다림이 출고 보호 앞)');
  ok(/window\.close\(\)/.test(SR), '② 옛 탭은 이어받은 뒤 스스로 닫힘(그대로)');
  // ③ 판 몰아 받기
  const VB = cut('const VER_BATCH_MS = ', 'function onNewVer(v, src)');
  { let urgent = false; const W = {}; new Function('window', 'sgUrgent', 'Date', VB + '; return VER_BATCH_MS;')(W, () => urgent, { now: () => 1000 + 5 * 60000 });
    ok(W.__rnVerHold() === false, '③ 새 판을 아직 안 봤으면 붙잡지 않음'); W.__rnVerBatch0 = 1000; ok(W.__rnVerHold() === true, '③ 처음 본 지 5분 → 아직 모음'); urgent = true; ok(W.__rnVerHold() === false, '③ 웹앱 「업데이트 먼저 하고 출고」면 바로'); }
  { const W = { __rnVerBatch0: 1000 }; new Function('window', 'sgUrgent', 'Date', VB)(W, () => false, { now: () => 1000 + 10 * 60000 + 1 }); ok(W.__rnVerHold() === false, '③ 10분 지나면 한 번에 바꿈'); }
  const ON = cut('function onNewVer(v, src)', '// 새로고침 뒤 이어가기');
  ok(/if \(!window\.__rnVerBatch0\) window\.__rnVerBatch0 = Date\.now\(\)/.test(ON), '③ 모음 시작 = 처음 새 판을 본 때(그 사이 판이 또 나와도 다시 0부터 세지 않음)');
  ok(ON.indexOf('window.__rnVerHold()') > 0 && ON.indexOf('window.__rnVerHold()') < ON.indexOf('safeReload('), '③ 쉬는 사이·긴 작업 바꿈 모두 모음 뒤');
  ok(/__rnVerHold && window\.__rnVerHold\(\)\) \/\* \(tabfix\) 📦 판 몰아 받기 10분 \*\/ && !\(window\.__rnSqWait && window\.__rnSqWait\('verStep'/.test(s), '③ 일괄 수집 단계 사이 바꿈도 10분 모음');
  // ④ 저절로 앞으로 띄우던 곳
  const HT = cut('async function hTake(h, pc, hold)', 'const jobs = Array.isArray(h.jobs)');
  ok(/GM_notification\(\{[^]*onclick: \(\) => \{[^]*window\.focus\(\)/.test(HT) && !/\} else window\.focus\(\); \} catch/.test(HT.replace(/onclick: \(\) => \{[^]*?\} \} \}\);/, '')), '④ 번외 손발 「사람 손 필요」 = 알림만(누를 때만 앞으로)');
  const MA = app.slice(app.indexOf('function maybeAutoCollect()'), app.indexOf('/* ── 고객 연결 점검'));
  ok(MA && !/openCollect\(true\)/.test(MA) && /collectRequest/.test(MA), '④ 웹앱 자동 수집 = 창을 띄우지 않고 그 PC 수집기 탭에 요청');
  ok(/b\.onclick = \(\) => openCollect\(false\)/.test(app), '④ 「지금 수집」 단추(사람이 누름)는 그대로 창을 엶');
  // ⑤ 매입가 나눔 기본
  ok(/const D = \{ total: '', how: 'list', arm: false/.test(app), '⑤ 💰 매입가 기입 나눔 기본 = 정가 비율로');
} catch (e) { bad++; console.log('❌ tTABFIX1113 오류: ' + (e && e.stack || e)); }
console.log(bad ? `❌ tTABFIX1113 실패 ${bad}개` : '✓ tTABFIX1113 모두 통과');
