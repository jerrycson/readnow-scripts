// tREL10_1112 — (11/12 rel10 · 판 내기 일꾼이 더한 것)
//   ① ⚙ 설정 › ⑭ 🧭 관리도구 「🖥 리드나우 PC 배치(JS-MAIN 실행·배치 창) 설치 파일 받기」 — 웹앱이 만든 글(PCDOCK_CMD)이 lab/pcdock/install-pcdock.cmd와 바이트까지 같음(CRLF)
//        · 화면: 단추·설명 한 줄 · 누르면 Blob으로 install-pcdock.cmd 내려받기(새 창·이동·브라우저 창 0) · 🔍 기능 찾기에 있음
//   ② 🟩 네이버 등록 이중 등록 막이(11/11 정밀 점검 1-2) — 순수 셈 nvRegDupChk(◆nvreg): 같은 SKU 네이버 매물 → '올라감' · 답 못 받은 앞 등록 → '확인 필요' · 그 밖은 다시 맡겨도 됨
//        · 이음(글자 검사): ↻ 누름·1분 차례 ①결과·②차례가 모두 nvRegDupChk를 거침 · 확인 필요 칩(✓ 없음 확인 · 다시) · 화면: 확인 필요 칩이 그려짐
// 실행: pw/ 안(harness.js·seed.js 옆) RN_PORT=<포트> RN_REPO=<저장소> node tREL10_1112.js · RN_PORT가 없으면 ①②의 순수·글자 검사만 · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const ROOTS = [process.env.RN_REPO || '', path.resolve(__dirname, '..', '..'), path.resolve(__dirname, '..')].filter(Boolean);
const find = (rel) => ROOTS.map((r) => path.join(r, rel)).find((x) => fs.existsSync(x));
const APP = process.env.RN_APP || find('src/app.html') || find('app.html'); const T = fs.readFileSync(APP, 'utf8');
const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const CMD = fs.readFileSync(find('lab/pcdock/install-pcdock.cmd'), 'utf8');

console.log('① PC 배치 설치 파일 글');
const PC = new Function(cut('const PCDOCK_CMD = ', '\nfunction pcdockInstDownload') + '\nreturn PCDOCK_CMD;')();
ok(PC === CMD, '웹앱 설치 파일 글 = lab/pcdock/install-pcdock.cmd 그대로(줄 끝 CRLF까지)', { a: PC.length, b: CMD.length });
ok(/readnow-scripts\/main\/lab\/pcdock\/install-pcdock\.ps1/.test(PC) && /readnow\.kr\/lab\/pcdock\/bundle\.json/.test(fs.readFileSync(find('lab/pcdock/install-pcdock.ps1'), 'utf8')) && /\['lab\/pcdock', true\]/.test(fs.readFileSync(find('hosting/build.js'), 'utf8')), '설치 길: cmd → 저장소 install-pcdock.ps1 → readnow.kr/lab/pcdock 묶음(Hosting 목록에 lab/pcdock 있음)');
ok(/data-pcdockinst="1"[^>]*>🖥 리드나우 PC 배치\(JS-MAIN 실행·배치 창\) 설치 파일 받기<\/button> <small class="hint">JS-MAIN에서 한 번 더블클릭 → 바탕 화면 아이콘<\/small>/.test(T) && /go: \{ tab: 'settings', sec: 'set_mgr' \} \},/.test(cut("{ t: '🖥 리드나우 PC 배치 설치 파일 받기", '\n')), '⚙ 설정 › ⑭ 🧭 관리도구에 단추와 설명 한 줄 · 🔍 기능 찾기 항목');
ok(/new Blob\(\[PCDOCK_CMD\], \{ type: 'application\/octet-stream' \}\)/.test(T) && !/window\.open\([^)]*pcdock/.test(T), 'Blob으로 내려받기(서버 주소로 받지 않음 · 새 창 없음)');

console.log('② 🟩 네이버 이중 등록 막이 — 순수 셈');
const NR = new Function(cut('/* ◆nvreg 시작 */', '/* ◆nvreg 끝 */') + '\nreturn { nvRegDupChk };')();
const D = NR.nvRegDupChk; const NVL = new Map([['661', { originNo: '661', sku: 'SKU1', st: 'SALE' }], ['663', { originNo: '663', sku: 'SKU3', st: 'SUSPENSION' }], ['664', { originNo: '664', sku: 'SKU4', st: 'DELETE' }]]);
ok(D('SKU1', null, NVL).k === 'on' && D('SKU1', null, NVL).originNo === '661' && D('SKU3', null, NVL).k === 'on', '같은 SKU 네이버 매물(판매중·판매중지 모두) → on(원상품번호)');
ok(D('SKU4', null, NVL) === null && D('SKU9', null, NVL) === null && D('', null, NVL) === null && D('DUPES', null, new Map([['1', { sku: 'DUPES' }]])) === null, '지운 매물·없는 SKU·빈 SKU·미끼는 on 아님');
const jU = { st: 'fail', unsure: true, err: '네이버 답을 못 받음' }, jL = { st: 'fail', later: true, err: '네이버 쪽 일시 오류' }, jN = { st: 'fail', err: '네이버에 닿지 못함(시간 넘음)' }, jB = { st: 'fail', err: '빠진 칸: 출고지 주소록 번호' };
ok(D('SKU9', jU, NVL).k === 'check' && D('SKU9', jL, NVL).k === 'check' && D('SKU9', jN, NVL).k === 'check' && /확인/.test(D('SKU9', jU, NVL).t), "답 못 받은 앞 등록(확인 필요 · 5xx · 옛 번외의 '시간 넘음') → check");
ok(D('SKU9', jB, NVL) === null && D('SKU9', { st: 'done' }, NVL) === null && D('SKU1', jU, NVL).k === 'on', '까닭이 분명한 실패(빠진 칸)는 다시 맡겨도 됨 · 같은 SKU가 보이면 확인 필요보다 on 먼저');
console.log('② 이음(글자)');
const CL = cut('async function regNvClick(t)', '/* 1분마다(관리자 기기');
ok(/nvRegDupChk\(X\.book\.sku, t\.dataset\.nvchk \? null : nvJob\(e0\.job\), S\.nvl\)/.test(CL) && /st: 'check'/.test(CL) && /st: 'done', originNo: ck\.originNo/.test(CL) && CL.indexOf("ck.k === 'check'") < CL.indexOf("st: 'retry'"), '↻ 누름: 같은 SKU → 올라감 · 답 못 받음 → 확인 필요 · 그 다음에만 다시 맡김');
const TK = cut('async function nvRegTick()', 'setTimeout(nvRegTick, 40e3);');
ok(/e\.st === 'check'/.test(TK) && /nvRegDupChk\(e\.sku, null, S\.nvl\)/.test(TK) && TK.indexOf('nvRegDupChk(X.book.sku, null, S.nvl)') < TK.indexOf('const id = `nvreg:'), '1분 차례: 확인 필요가 네이버 목록에 보이면 저절로 올라감 · 맡기기 바로 앞에서 같은 SKU 다시 봄');
ok(/e\.st === 'check'\) return tag\('bl', '네이버 확인 필요'/.test(T) && /data-nvchk="1"/.test(T), "카드 칩: '네이버 확인 필요' + ✓ 없음 확인 · 다시(두 번)");

if (!process.env.RN_PORT) { console.log(bad ? `❌ tREL10_1112 ${bad}개 실패` : '✓ tREL10_1112 순수·글자 검사 통과 (화면은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }

require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); }); const pops = []; p.on('popup', (x) => pops.push(x.url()));
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(600); const url0 = p.url();
  console.log('① 화면 — ⚙ 설정 › ⑭ 🧭 관리도구');
  await p.evaluate(() => { S.tab = 'settings'; renderMain(); }); await p.waitForTimeout(900);
  await p.evaluate(() => { const d = document.querySelector('#main details.sec[data-sec="set_mgr"]'); if (d && !d.open) d.open = true; }); await p.waitForTimeout(500);
  const B = await p.evaluate(() => { const b = document.querySelector('#main [data-pcdockinst]'); return b ? { t: b.textContent, hint: b.parentElement.querySelector('small.hint') && b.parentElement.querySelector('small.hint').textContent, vis: !!b.offsetParent } : null; });
  ok(B && B.vis && /PC 배치/.test(B.t) && /더블클릭 → 바탕 화면 아이콘/.test(B.hint), '단추와 설명 한 줄이 보임', B);
  const dl = p.waitForEvent('download', { timeout: 15000 }).catch(() => null); await p.locator('#main [data-pcdockinst]').click(); const d = await dl;
  let got = null; if (d) { const f = await d.path().catch(() => null); got = { name: d.suggestedFilename(), same: f ? fs.readFileSync(f, 'utf8') === CMD : null }; }
  ok(got && got.name === 'install-pcdock.cmd' && got.same === true, '누르면 install-pcdock.cmd 내려받기(내용이 저장소 설치 파일과 같음)', got);
  const toastT = await p.evaluate(() => (document.getElementById('toast') || {}).textContent || ''); ok(/JS-MAIN/.test(toastT) && /바탕 화면/.test(toastT), '알림 한 줄(JS-MAIN에서 더블클릭 → 바탕 화면 아이콘)', toastT.slice(0, 200));
  const fx = await p.evaluate(() => (typeof featIndex === 'function' ? featIndex() : FEAT).some((x) => /PC 배치 설치 파일/.test(x.t || x[0] || ''))); ok(fx, '🔍 기능 찾기 목록에 있음');
  console.log('② 화면 — 🟩 네이버 확인 필요 칩');
  const C = await p.evaluate(() => { const L = 'aladin_TEST1'; S.nvReg = { r: { [L]: { st: 'check', why: '앞 등록이 네이버 답을 못 받음', at: new Date().toISOString() } } }; S._nvRegUn = 1; window.nvRegBookOf = () => ({ lid: L, book: { sku: 'SKU9' }, pp: [] });
    const a = regNvChip({ id: 'r1', stage: 'done', nvReg: 1 }, false); S.nvReg.r[L] = { st: 'sent', job: 'nvreg:aladin_TEST1:1' }; S.nvJobs = new Map([[nvJobKey('nvreg:aladin_TEST1:1'), { st: 'fail', unsure: true, err: '네이버 답을 못 받음(시간 넘음)' }]]); window.nvDataLoad = () => {}; const b = regNvChip({ id: 'r1', stage: 'done', nvReg: 1 }, false);
    S.nvJobs = new Map([[nvJobKey('nvreg:aladin_TEST1:1'), { st: 'fail', err: '빠진 칸: 출고지' }]]); const c = regNvChip({ id: 'r1', stage: 'done', nvReg: 1 }, false); return { a, b, c }; });
  ok(/네이버 확인 필요/.test(C.a) && /data-nvchk="1"/.test(C.a) && /없음 확인/.test(C.a), "확인 필요 칩 + 「✓ 없음 확인 · 다시」", C.a.slice(0, 300));
  ok(/네이버 확인 필요/.test(C.b) && /↻ 확인/.test(C.b) && !/data-nvchk/.test(C.b), "답 못 받은 실패 = '확인 필요'(↻ 확인 — 누르면 먼저 확인)", C.b.slice(0, 300));
  ok(/네이버 등록 못 함/.test(C.c) && /↻ 다시/.test(C.c), '까닭이 분명한 실패는 예전처럼 ↻ 다시', C.c.slice(0, 300));
  ok(!dlg.length && !pops.length && p.url() === url0, '브라우저 창(alert·confirm·prompt)·새 창·이동 0', { dlg, pops });
  console.log(bad ? `❌ tREL10_1112 ${bad}개 실패` : '✓ tREL10_1112 모두 통과'); process.exitCode = bad ? 1 : 0;
});
