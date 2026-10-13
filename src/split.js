// 수집기 나누기 (개편 3단계): 한 파일로 고치고 시험한 readnow-collector.user.js(원본)를
//  ① Tampermonkey에 넣는 작은 본체(readnow-collector.user.js) + ② GitHub에 올리는 모듈 파일 5개로 나눔.
// 관문: 모듈 내용을 차례로 이으면 원본의 코드와 글자 하나까지 같아야 함 (같은 코드 = 같은 기록). 다르면 멈춤.
const fs = require('fs'); const path = require('path');
const SRC = process.argv[2] || '/home/claude/w/readnow-collector.user.js'; const OUT = process.argv[3] || '/home/claude/w/out';
const s = fs.readFileSync(SRC, 'utf8');
const ver = (s.match(/\/\/ @version\s+([\d.]+)/) || [])[1]; if (!ver) throw new Error('@version 없음');
const hEnd = s.indexOf('// ==/UserScript==\n') + '// ==/UserScript==\n'.length; const header = s.slice(0, hEnd); const body = s.slice(hEnd);
const MODS = [
  ['runtime', 'readnow-pc-runtime.js', '바탕 — 이 PC 이름·네이버 다시 로그인·일시정지(모든 탭)·작업 기록·탭끼리 나누는 상태·통합 관제판', null],
  ['crm', 'readnow-pc-crm.js', '모듈 ① 고객·주문 — 전체·취소 주문, 반품, 문의, 구매평, 고객 점수, 대조', '/* ═════════════ 고객·주문 (예전 고객 수집기)'],
  ['products', 'readnow-pc-products.js', '모듈 ②③⑤⑦ 상품·시장·판매자·매입·일괄/매일 자동 — 상품 조회, 도서 정보·시장 지표, 사진, 매물 유의 사항, 판매자 평가, 구매자 분포, 알라딘 구매·팔기, 맡긴 일, 일정', '/* ═════════════ 상품·판매자·매입 (예전 상품 수집기)'],
  ['ship', 'readnow-pc-ship.js', '모듈 ④ 출고 — 발송 요청 화면 송장 입력', '/* ══════════ 송장 입력 (1.28.0)'],
  ['helper', 'readnow-pc-helper.js', '모듈 ⑥ 화면 도우미 — 고객 응대 문구', '/* ══════════ 고객 응대 문구 도우미 (1.34.0)'],
];
const cuts = MODS.map(([, , , m]) => (m ? body.indexOf(m) : 0)); cuts.forEach((c, i) => { if (c < 0) throw new Error('표시를 못 찾음: ' + MODS[i][3]); if (i && c <= cuts[i - 1]) throw new Error('순서가 다름'); });
const parts = MODS.map((m, i) => body.slice(cuts[i], i + 1 < cuts.length ? cuts[i + 1] : body.length));
if (parts.join('') !== body) throw new Error('관문 실패: 나눈 것을 이으면 원본과 다름');
const RAW = 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/';
const stamp = (k) => `;(function (g) { g.ReadnowPcMods = Object.assign(g.ReadnowPcMods || {}, { ${k}: '${ver}' }); })(typeof globalThis !== 'undefined' ? globalThis : this);\n`;
fs.mkdirSync(OUT, { recursive: true });
/* (1.63.8) ⚡ 모듈은 불리자마자 돌지 않고 줄(__rnModQ)에 함수로 섬 → 본체가 '빠른 업데이트로 받아 둔 새 판'이 있으면 그것으로, 없으면 이 판으로 차례대로 돌림
 *  모듈 사이에 맨 바깥(전역) 선언을 나눠 쓰지 않음(모두 window.__rn… 으로 주고받음)을 아래에서 확인 — 함수로 감싸도 뜻이 같음 */
for (const P of parts) { const top = P.split('\n').filter((l) => /^(const|let|var|class) /.test(l)); if (top.length) throw new Error('모듈 맨 바깥 선언이 있어 감쌀 수 없음: ' + top[0].slice(0, 80)); }
const wrapMod = (k, code) => `;(globalThis.__rnModQ = globalThis.__rnModQ || []).push(['${k}', '${ver}', function () {\n${code}\n}]);\n`;
MODS.forEach(([k, f, what], i) => { const txt = `/* ${f} — 리드나우 수집기 ${ver}의 ${what}\n * Tampermonkey의 '리드나우 수집기' 본체가 @require로 불러옴 (이 파일만 따로 설치하지 않음). 본체와 판이 같아야 함 — 다르면 관제판에 빨간 띠.\n * 원본 한 파일에서 기계로 나눈 것: 모듈을 차례로 이으면 원본 코드와 글자 하나까지 같음 (같은 코드 = 같은 기록). */\n${stamp(k)}${wrapMod(k, parts[i])}`; fs.writeFileSync(path.join(OUT, f), txt); });
// 본체: 머리(@require에 알라딘 창구·모듈 5개를 판 번호로) + 모듈이 다 왔는지 확인
const lastReq = [...header.matchAll(/\/\/ @require[^\n]*\n/g)].pop(); // 모듈은 맨 뒤(Firebase·엑셀 프로그램을 다 받은 뒤)에 — 모듈이 불리자마자 firebase를 씀
let head = header.slice(0, lastReq.index + lastReq[0].length).replace(/[\s\S]*$/, (m) => m + `// @require      ${RAW}readnow-aladin-core.js?v=0.2.0\n` + `// @require      ${RAW}readnow-exec-core.js?v=0.1.1\n` + MODS.map(([, f]) => `// @require      ${RAW}${f}?v=${ver}\n`).join('')) + header.slice(lastReq.index + lastReq[0].length);
if (!/readnow-pc-runtime\.js/.test(head)) throw new Error('@require 넣기 실패');
if (!/@connect\s+raw\.githubusercontent\.com/.test(head)) head = head.replace(/(\/\/ @connect[^\n]*\n)/, '// @connect      raw.githubusercontent.com\n$1');
/* (1.63.8) ⚡ 머리 서명 — 판 번호·GitHub 파일 줄을 뺀 머리(맞는 화면·권한·바깥 프로그램). 새 판의 머리가 다르면(권한·화면이 바뀐 판) 빠른 업데이트로는 못 바꾸고 Tampermonkey 업데이트를 기다림 */
const headSig = head.split('\n').filter((l) => /^\/\/ @/.test(l) && !/^\/\/ @(version|updateURL|downloadURL)\b/.test(l) && !/raw\.githubusercontent\.com\/jerrycson\/readnow-scripts/.test(l)).map((l) => l.replace(/\s+/g, ' ').trim()).join('|');
const HSIG = require('crypto').createHash('sha256').update(headSig).digest('hex').slice(0, 16); fs.writeFileSync(path.join(OUT, 'pc-live-head.txt'), HSIG + '\n' + headSig.split('|').join('\n'));
const main = `${head}/* 리드나우 수집기 ${ver} 본체 — 개편 3단계: 코드는 GitHub의 모듈 파일 5개(위 @require), 여기는 모두 왔는지만 확인.
 * 올리는 순서: ① GitHub에 readnow-aladin-core.js · readnow-pc-*.js 5개 → ② 이 본체를 Tampermonkey에 붙여넣기 (먼저 붙이면 Tampermonkey가 파일을 못 받아 알림)
 * 모듈 판이 본체와 다르면(Tampermonkey가 옛 파일을 기억 · GitHub에 안 올림) 오른쪽 위에 빨간 띠 + 작업 기록에 남김 */
(function rnLive() { /* (1.63.8) ⚡ 빠른 업데이트 — Tampermonkey의 자동 업데이트(최소 몇 시간마다)를 기다리지 않고, 이 본체가 5분마다 GitHub의 pc-live.json(판 번호·파일 목록·지문)을 보고
   *  새 판이면 파일들을 받아 지문(sha256)이 모두 맞을 때만 이 PC(Tampermonkey 저장소)에 받아 둠 → 수집기가 쉬는 사이(또는 긴 작업이면 저장 지점에서) 새로고침 → 받아 둔 새 판으로 뜸
   *  받아 둔 판이 이 본체의 판보다 새것이면 그것을, 아니면(또는 시작에 실패하면) 위 @require의 이 판을 씀 — 실패한 판은 다시 쓰지 않음 · 머리(화면·권한)가 바뀐 판은 Tampermonkey 업데이트를 기다림 */
  const G = globalThis; const CLASSIC = '${ver}'; const HSIG = '${HSIG}'; const RAWL = '${RAW}'; const Q0 = (G.__rnModQ || []).slice();
  const vn = (v) => String(v || '0').split('.').reduce((a, x) => a * 1000 + (+x || 0), 0); const gv = (k, d) => { try { return GM_getValue(k, d); } catch (e) { return d; } }; const sv = (k, v) => { try { GM_setValue(k, v); } catch (e) {} };
  const L = gv('rn-live', null); const bad = gv('rn-live-bad', null); const prevFV = G.__RN_FILE_VER; let used = 'classic';
  if (L && L.code && L.hsig === HSIG && vn(L.ver) > vn(CLASSIC) && !(bad && bad.ver === L.ver) && !gv('rn-live-off', false)) {
    try { G.__rnModQ = []; G.__RN_FILE_VER = L.ver; eval(L.code); if (G.__rnModQ.length !== Q0.length || G.__rnModQ.some((x) => x[1] !== L.ver)) throw new Error('받아 둔 판의 모듈이 다 오지 않음'); used = 'live'; }
    catch (e) { G.__rnModQ = Q0; G.__RN_FILE_VER = prevFV; G.__rnLiveErr = String(e && e.message || e); sv('rn-live-bad', { ver: L.ver, at: Date.now(), err: G.__rnLiveErr }); if (/unsafe-eval|EvalError|Content Security|not allowed/i.test(G.__rnLiveErr + ' ' + (e && e.name))) sv('rn-live-noeval', { at: Date.now(), err: G.__rnLiveErr }); try { console.error('[리드나우] 빠른 업데이트 판 시작 실패 — 이 판(' + CLASSIC + ')으로', e); } catch (x) {} } }
  G.__rnLiveUsed = used; G.__rnLiveVer = used === 'live' ? L.ver : CLASSIC;
  const run = G.__rnModQ; G.__rnModQ = []; for (const [k, , fn] of run) { try { fn(); } catch (e) { try { console.error('[리드나우] 모듈 ' + k + ' 시작 오류', e); window.__rnLog && window.__rnLog('수집기', 'err', '모듈 ' + k + ' 시작 오류: ' + (e && e.message)); } catch (x) {} } }
  if (G.__rnLiveErr) setTimeout(() => { try { window.__rnLog && window.__rnLog('수집기', 'err', '⚡ 빠른 업데이트로 받아 둔 판 ' + (L && L.ver) + '을 시작하지 못해 이 판(' + CLASSIC + ')으로 돎: ' + G.__rnLiveErr); } catch (x) {} }, 3000);
  else if (used === 'live') setTimeout(() => { try { window.__rnLog && window.__rnLog('수집기', 'info', '⚡ 빠른 업데이트로 받아 둔 판 ' + L.ver + '으로 돎 (Tampermonkey의 본체는 ' + CLASSIC + ')'); } catch (x) {} }, 3000);
  if (window.top !== window) return;
  const sha = async (t) => { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); };
  let busy = false; const chk = async (force) => { if (busy || gv('rn-live-noeval', null) || gv('rn-live-off', false)) return; /* 이 브라우저가 받아 둔 코드를 돌리지 못하게 막음 — Tampermonkey 자동 업데이트만 씀 · (1.63.11 자동 점검) 빠른 업데이트를 꺼 둔 PC도 받지 않음(받아 두면 새로고침해도 이 판으로 떠 끝없이 새로고침) */ if (!force && Date.now() - (+gv('rn-live-at', 0) || 0) < 4 * 60e3) { const H = gv('rn-live', null); const bd0 = gv('rn-live-bad', null); if (H && H.ver && vn(H.ver) > vn(G.__rnLiveVer) && H.hsig === HSIG && !(bd0 && bd0.ver === H.ver)) { /* (1.63.11 자동 점검) 시작에 실패한 판은 지름길로도 다시 부르지 않음 */ try { window.__rnLiveReady && window.__rnLiveReady(H.ver); } catch (e) {} } return; } busy = true; sv('rn-live-at', Date.now());
    try { const r = await fetch(RAWL + 'pc-live.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) throw new Error('pc-live.json HTTP ' + r.status); const M = await r.json(); sv('rn-live-seen', { ver: M.ver, at: Date.now() });
      if (!M || !M.ver || !Array.isArray(M.files) || vn(M.ver) <= vn(G.__rnLiveVer)) return; const bd = gv('rn-live-bad', null); if (bd && bd.ver === M.ver) return;
      if (M.hsig !== HSIG) { if (gv('rn-live-hnote', '') !== M.ver) { sv('rn-live-hnote', M.ver); try { window.__rnLog && window.__rnLog('수집기', 'warn', '⚡ 새 판 ' + M.ver + '은 머리(화면·권한)가 바뀐 판이라 빠른 업데이트로 못 바꿈 — Tampermonkey 업데이트(대시보드 → 업데이트 확인)를 기다림'); } catch (e) {} } return; }
      const H = gv('rn-live', null); if (!(H && H.ver === M.ver && H.hsig === HSIG)) { let code = ''; for (const f of M.files) { const t = await (await fetch(RAWL + f.f + '?v=' + f.v + '&h=' + String(f.sha).slice(0, 10), { cache: 'no-store' })).text(); const h = await sha(t); if (h !== f.sha) throw new Error(f.f + ' 지문이 다름(GitHub 캐시가 아직 옛 파일 — 다음 확인 때 다시)'); code += '\\n;' + t + '\\n'; }
        sv('rn-live', { ver: M.ver, hsig: HSIG, code, at: Date.now(), n: M.files.length }); try { window.__rnLog && window.__rnLog('수집기', 'info', '⚡ 새 판 ' + M.ver + '을 GitHub에서 받아 둠(파일 ' + M.files.length + '개 · 지문 확인) — 쉬는 사이 새로고침해 바꿈'); } catch (e) {} }
      try { window.__rnLiveReady && window.__rnLiveReady(M.ver); } catch (e) {} }
    catch (e) { const m = String(e && e.message || e); if (gv('rn-live-err', '') !== m) { sv('rn-live-err', m); try { window.__rnLog && window.__rnLog('수집기', 'warn', '⚡ 빠른 업데이트 확인 실패: ' + m); } catch (x) {} } } finally { busy = false; } };
  window.__rnLiveCheck = () => chk(true); window.__rnLiveInfo = () => ({ used: G.__rnLiveUsed, ver: G.__rnLiveVer, classic: CLASSIC, have: (gv('rn-live', null) || {}).ver || null, seen: gv('rn-live-seen', null), bad: gv('rn-live-bad', null), err: gv('rn-live-err', '') || null, noeval: gv('rn-live-noeval', null) });
  setTimeout(() => chk(false), 20000); setInterval(() => chk(false), 5 * 60e3); })();
(function rnModCheck() {
  if (window.top !== window) return;
  const want = ${JSON.stringify(MODS.map(([k, f]) => [k, f]))}; const V = globalThis.__rnLiveVer || '${ver}'; const got = (typeof globalThis !== 'undefined' && globalThis.ReadnowPcMods) || window.ReadnowPcMods || {};
  const bad = want.filter(([k]) => got[k] !== V).map(([k, f]) => \`\${f} \${got[k] ? got[k] + ' (본체 ' + V + ')' : '못 받음'}\`);
  window.__rnModsOk = !bad.length; window.__rnMods = { ...got, aladin: (globalThis.ReadnowAladin || {}).VERSION || null, exec: (globalThis.ReadnowExec || {}).VERSION || null };
  if (!bad.length) return;
  try { window.__rnLog && window.__rnLog('수집기', 'err', '모듈 판이 맞지 않음: ' + bad.join(', ') + ' — GitHub에 올렸는지 확인하고 본체를 다시 붙여넣기'); } catch (e) {}
  const show = () => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:12px;top:8px;z-index:2147483647;max-width:560px;background:#B0322A;color:#fff;padding:9px 12px;border-radius:9px;font:600 13px/1.5 system-ui,Malgun Gothic,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.25)';
    d.textContent = '리드나우 수집기 ' + V + ': 모듈 판이 맞지 않음 — ' + bad.join(' · ') + '. GitHub에 모듈 파일을 올렸는지 확인한 뒤 본체를 다시 붙여넣어 주세요.'; document.body.appendChild(d); };
  if (document.body) show(); else document.addEventListener('DOMContentLoaded', show);
})();
`;
fs.writeFileSync(path.join(OUT, 'readnow-collector.user.js'), main);
console.log('나눔 완료', ver, MODS.map(([, f], i) => `${f} ${(parts[i].length / 1024).toFixed(0)}KB`).join(' · '), '| 본체', (main.length / 1024).toFixed(1) + 'KB', '| 관문: 이으면 원본과 같음 ✓');
