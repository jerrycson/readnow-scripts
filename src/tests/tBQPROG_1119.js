// tBQPROG_1119 — (11/19 정범님 I-1119-1619-18) 수동 일괄 진행바 — 단계 · 상품마다 줄 · 까닭 풀이 · 실시간 다시 그림
// (bkprog1 11/19) 진행 칸 글은 공용 부품 bpPanelHtml(blk 안)으로 옮김 — 그룹 화면(drawBatchRes)은 bpCalc·bpPanelHtml을 부름 · 묶음 화면도 같은 부품(tBKPROG1)
// 실행: node tBQPROG_1119.js · 시험 자료에 손님 정보 없음 · 순수 셈 + 글 검사(값을 바꾸는 동작 없음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const blk = cut('const BP_STG = [', 'function bqMorph(');
const S = {}; const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); const won = (n) => (n == null ? '-' : Number(n).toLocaleString() + '원'); const num = (n) => (n == null ? '-' : Number(n).toLocaleString());
const kTime = (iso) => { const t = Date.parse(iso || ''); if (!Number.isFinite(t)) return ''; return new Date(t + 9 * 3600e3).toISOString().slice(5, 16).replace('T', ' '); };
const PR_ST = { blocked: '막힘', stale: '오래돼 다시 판정' };
const M = new Function('S', 'esc', 'won', 'num', 'kTime', 'PR_ST', blk + '\nreturn { BP_VWHY, bpRowOf, bpStages, bpSummary, bpProdHtml, bpAgo, bpDur };')(S, esc, won, num, kTime, PR_ST);
const iso = (m) => new Date(Date.parse('2026-11-19T07:00:00Z') + m * 60000).toISOString();
console.log('① 까닭 코드 풀이 — 감시기가 남기는 state 전부');
{ const pw = fs.readFileSync(path.resolve(path.dirname(APP), '..', 'readnow-price-watch.user.js'), 'utf8'); const used = new Set([...pw.matchAll(/'(noitem|notfound|other|timeout)'/g)].map((m) => m[1]));
  ['noitem', 'notfound', 'other', 'timeout'].forEach((k) => ok(used.has(k), '감시기 코드 ' + k + ' 존재', [...used]));
  ok([...used].filter((u) => ['noitem', 'notfound', 'other', 'timeout'].includes(u)).every((u) => M.BP_VWHY[u] && M.BP_VWHY[u][1].length > 20), '코드마다 쉬운 풀이가 있음');
  ok(/ItemId/.test(M.BP_VWHY.noitem[1]) && /품절·내려감과는 상관없음/.test(M.BP_VWHY.noitem[1]), 'noitem = 책 번호(ItemId)가 없어 확인을 못 한 것 — 품절 뜻이 아님'); }
console.log('② bpRowOf — 상품마다 단계·상태·까닭');
{ const ap = { batchId: 'g1', decision: 'batch', at: iso(0) };
  const r1 = M.bpRowOf('k1', { title: '국수 1-6 세트', approvalState: 'manual', approval: ap }, null, { from: 9000, price: 8000 });
  ok(r1.st === 'wait' && r1.stage === 1 && r1.from === 9000 && r1.to === 8000, '반영 대기 = 대기 · ② 단계 · 전→후 가격', r1);
  ok(M.bpRowOf('k', { approvalState: 'applying', approval: ap, applyingAt: iso(1) }, null, null).st === 'run', '반영 중 = 진행 중');
  const rb = M.bpRowOf('k', { approvalState: 'blocked', execNote: '샵매니저 상품번호(ItemId)가 없음', approval: ap }, null, null);
  ok(rb.st === 'bad' && /샵매니저 상품번호/.test(rb.why), '막힘 = 실패 + 서버 까닭(execNote) 그대로', rb);
  const act = (verify) => ({ from: 9000, to: 8000, at: iso(5), verify });
  const rn = M.bpRowOf('k', { approvalState: 'done', approval: ap }, act(undefined), null); ok(rn.st === 'wait' && /공개 확인 시작/.test(rn.txt), '반영됨 + 확인 기록 없음 = 대기');
  const rw = M.bpRowOf('k', { approvalState: 'done', approval: ap }, act({ state: 'wait', n: 3, old: 2, next: iso(60) }), null); ok(rw.st === 'run' && rw.stage === 4 && /옛 값 2번/.test(rw.why) && /다음 확인/.test(rw.next), '공개 확인 중 = 진행 중(확인 횟수·옛 값·다음 확인)', rw);
  const ro = M.bpRowOf('k', { approvalState: 'done', approval: ap }, act({ state: 'ok', seenAt: iso(25), lagLoSec: 600, lagHiSec: 1200 }), null); ok(ro.st === 'ok' && /10분~20분/.test(ro.why), '공개 확인됨 = 성공 · 걸린 시간 범위', ro);
  for (const s of ['noitem', 'notfound', 'other', 'timeout']) { const rp = M.bpRowOf('k', { approvalState: 'done', approval: ap }, act({ state: s, doneAt: iso(90), lastSeenPrice: 8500 }), null); ok(rp.st === 'prob' && rp.txt === M.BP_VWHY[s][0] && rp.why.indexOf(M.BP_VWHY[s][1]) === 0, s + ' = 문제 + 쉬운 풀이', rp.txt); }
  ok(M.bpRowOf('k', { approvalState: 'done', approval: ap }, act({ state: 'zzz' }), null).why.indexOf('알 수 없는') === 0, '모르는 코드도 숨기지 않고 코드를 보임'); }
console.log('③ 단계 줄 — 수·% · 시작/끝 · 걸린 시간 · 지금 단계');
{ const tA = [iso(5), iso(6), iso(7), iso(8)]; const G = M.bpStages(4, { done: 4, applying: 0, wait: 0, bad: 0 }, { ok: 1, wait: 3, bad: 0, none: 0 }, tA, [iso(20)], [iso(0), iso(1)], Date.parse(iso(30)), 900, null);
  ok(G.L.length === 4 && G.L[0].fin && G.L[1].fin && G.L[2].fin && !G.L[3].fin && G.cur === 3, '확정·보냄·반영 끝 → 지금 단계 = ④ 공개 확인', G.cur);
  ok(Math.round(G.L[3].pct) === 25 && G.L[3].took === 25 * 60000 && /보통 15분/.test(G.L[3].eta), '④ 25% · 지금까지 25분 · 보통 15분');
  ok(G.L[2].took === 3 * 60000 && G.L[2].t1 === iso(8), '③ 끝난 단계는 시작~끝 걸린 시간');
  const G2 = M.bpStages(10, { done: 3, applying: 1, wait: 6, bad: 0 }, { ok: 0, wait: 3, bad: 0, none: 0 }, [iso(5), iso(6), iso(7), iso(8)], [], [iso(0)], Date.parse(iso(10)), null, Date.parse(iso(40)));
  ok(G2.cur === 1 && /남은 6개/.test(G2.L[1].eta) && /끝 예상 30분/.test(G2.L[2].eta), '반영 중간 → 지금 단계 = ② · 남은 개수 · 끝 예상', [G2.cur, G2.L[1].eta, G2.L[2].eta]); }
console.log('④ 상품마다 줄 — 정렬·거르기·더 보기·끝 요약');
{ const ap = { batchId: 'g1', at: iso(0) }; const mk = (i, vs) => M.bpRowOf('k' + i, { title: '상품' + i, approvalState: 'done', approval: ap }, { from: 1000, to: 900, at: iso(5), verify: vs }, null);
  const rows = [mk(1, { state: 'ok', seenAt: iso(20), lagLoSec: 60, lagHiSec: 120 }), mk(2, { state: 'noitem', doneAt: iso(9) }), mk(3, { state: 'wait', n: 1, lastCheckAt: iso(10) }), M.bpRowOf('k4', { title: '상품4', approvalState: 'manual', approval: ap }, null, null)];
  const sm = M.bpSummary(rows); ok(sm.c.ok === 1 && sm.c.prob === 1 && sm.c.run === 1 && sm.c.wait === 1 && !sm.done, '요약 개수', sm.c);
  const h = M.bpProdHtml(rows, { filt: 'all', lim: 30, open: true, id: 'g1' }); const i2 = h.indexOf('상품2'), i3 = h.indexOf('상품3'), i4 = h.indexOf('상품4'), i1 = h.indexOf('상품1');
  ok(i2 < i3 && i3 < i4 && i4 < i1, '문제 → 진행 중 → 대기 → 성공 순서');
  ok(/data-bpgo="k2"/.test(h) && /data-bpf="bad"/.test(h) && /까닭: /.test(h), '카드로 가기 단추 · 거르기 단추 · 까닭 글');
  const hb = M.bpProdHtml(rows, { filt: 'bad', lim: 30, open: true }); ok(/상품2/.test(hb) && !/상품1/.test(hb) && !/상품3/.test(hb), '문제·실패만 거르기');
  const many = Array.from({ length: 70 }, (_, i) => mk(100 + i, { state: 'ok', seenAt: iso(20), lagLoSec: 1, lagHiSec: 2 })); const hm = M.bpProdHtml(many, { filt: 'all', lim: 30 }); ok((hm.match(/class="bprow"/g) || []).length === 30 && /data-bpmore/.test(hm) && /40개 더 보기/.test(hm), '30개씩 · 더 보기(40개 남음)');
  const done = M.bpSummary([mk(1, { state: 'ok', seenAt: iso(20), lagLoSec: 1, lagHiSec: 2 }), mk(2, { state: 'timeout', doneAt: iso(50) })]); ok(done.done && done.c.prob === 1 && done.t1 === iso(50), '다 끝남 = 요약 줄 상태 · 마지막 갱신 시각'); }
console.log('⑤ 실시간 · 시간 글 · 화면 연결');
{ ok(M.bpAgo(Date.now() - 7000) === '7초 전' && /^1분 \d+초 전$/.test(M.bpAgo(Date.now() - 70000)) && M.bpAgo(0) === '아직 못 받음', '마지막 갱신 n초 전');
  ok(M.bpDur(90 * 1000) === '2분' && M.bpDur(3 * 3600e3 + 5 * 60e3) === '3시간 5분', '걸린 시간 글');
  ok(/S\.batchActAt = Date\.now\(\)/.test(T) && /S\.batchSrvAt = Date\.now\(\)/.test(T), '이미 있는 실시간 수신(onSnapshot 둘)에서 받은 시각을 남김');
  ok(/bpTick\(\);/.test(T) && /setInterval\(\(\) => \{ const el = document\.getElementById\('bp_ago'\)/.test(T) && /clearInterval\(S\._bpT\)/.test(T), '5초마다 글자만 고치는 시계 · 칸이 사라지면 스스로 멈춤(새로 읽지 않음)');
  const D = cut('function drawBatchRes(', '\nfunction ');
  ok(/bpProdHtml\(BP\.rowsP/.test(D) && /bpStages\(BP\.N/.test(blk) && /bpCalc\(\{/.test(D) && /bpPanelHtml\(BP, /.test(D) && /data-bpgo/.test(T) && /querySelectorAll\('\[data-bpgo\]'\)[^\n]*goK\(/.test(D) && /querySelectorAll\('\[data-bpf\]'\)/.test(D), '진행 칸이 단계 줄 + 상품마다 보기를 그리고 단추가 연결됨');
  ok(/class="bbar" title="샵매니저 반영"/.test(blk) && /공개 반영 확인 <b>/.test(blk), '옛 두 줄 막대·마일스톤은 그대로 둠(bkprog1부터 공용 부품 bpPanelHtml 안)');
  ok(/repeat\(auto-fit,minmax\(150px,1fr\)\)/.test(blk) && /word-break:break-all/.test(blk), '휴대폰 폭: 단계 칸은 자동 줄바꿈 격자 · 상품명 줄바꿈');
  ok(!/\b(alert|confirm|prompt)\(/.test(blk), '브라우저 팝업 없음'); }
{ const D2 = cut('function drawBatchRes(', '\nfunction '); ok(/<details class="bpd" \$\{S\.bpBig \? 'open' : ''\}>/.test(blk) && /open: S\.bpOpen === true/.test(D2), '진행 띠는 기본 접힘(한 줄 요약) · 상품마다 보기도 기본 접힘'); }
console.log(bad ? `\n❌ ${bad}건 실패` : '\n✓ 전부 통과'); process.exit(bad ? 1 : 0);
