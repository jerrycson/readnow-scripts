// tBQKEEP1_1118 — (11/18 정범님 I-1118-2251-29) 수동 일괄 「추천 못 함」 탭을 선택 대기와 똑같이
//  · 카드 고르기 칸 · 전체 고르기 · 「고른 n개 → 선택 대기로」 · 「고른 것 중 n개 → 결정 대기로」
//  · 추천가가 없는 상품은 사람이 넣은 값이 있어야 결정 대기로(없으면 화면 안 알림으로 막음)
//  · 탭 동작은 탭 이름 대신 BQ_TABDEF 여섯째 칸(bqTabsOf · bqPxGate — 관제창도 같은 함수)
// 실행: node tBQKEEP1_1118.js · 시험 자료에 손님 정보 없음 · 실제 가격 바꾸기·확정은 하지 않음(순수 셈 + 글 검사)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const blk = cut('const BQ_TABDEF = [', 'function bqSoldHtml(') + cut('const BKF_TB = BQ_TABDEF', 'const BKF_TBQ = [];');
const M = new Function('unregOf', 'OBS_VALID', 'needSearch', 'edOf', 'edPickOf', 'edUse', 'bbNearX', 'lotCheck', blk + '\nreturn { BQ_TABDEF, BQ_TABACT, bqTabsOf, bqPxGate, bqCls };')(
  () => false, new Set(['green', 'blue']), () => false, () => null, () => null, () => null, () => false, () => false);
const D = cut('function drawBatchRes(', '\nfunction ') + cut('function batchCardK(', '\nfunction drawBatchRes('); /* (allcard1) 카드 도우미·카드 글은 batchCardK·batchCardHtml로 옮김(그룹 화면·관제소 안쪽 창이 함께 씀) */
console.log('① 탭 동작 칸(BQ_TABDEF 여섯째 칸)');
{ ok(M.BQ_TABDEF.every((d) => d.length === 6 && d[5] && typeof d[5] === 'object'), '탭마다 여섯째 칸 = 탭 동작 표시');
  const K = M.BQ_TABACT('keep'), S = M.BQ_TABACT('sel'), F = M.BQ_TABACT('few');
  ok(K.edit && K.chk === 'toSel' && K.need, '추천 못 함 = 값 고침(edit) · 고르기(chk toSel) · 사람 값 필요(need)', K);
  ok(S.edit && !S.chk && !S.need, '선택 대기 = 값 고침만', S);
  ok(F.edit && F.chk === 'fewsel' && !F.need, '3개이하/미등록 = 값 고침 · 고르기(fewsel)', F);
  ok(JSON.stringify(M.BQ_TABACT('없는탭')) === '{}', '없는 탭 = 빈 표시');
  ok(M.bqTabsOf('chk').join(',') === 'few,keep', 'bqTabsOf(chk) = 고르기 탭 few·keep', M.bqTabsOf('chk'));
  ok(['sel', 'few', 'keep', 'bb', 'lot'].every((t) => M.bqTabsOf('edit').includes(t)) && !M.bqTabsOf('edit').includes('pick'), 'bqTabsOf(edit) = 선택 대기처럼 고치는 탭', M.bqTabsOf('edit'));
  ok(/const TA = BQ_TABACT_G\(T\); const SELT = !!TA\.edit;/.test(D), '화면은 탭 이름 대신 탭 동작 칸으로 켬(SELT = TA.edit)'); }
console.log('② bqPxGate — 값 바닥 검사(돈이 걸림)');
{ const nr = { target: null }, hr = { target: 9000 };
  ok(/추천가가 없는 상품/.test(M.bqPxGate(nr, 0)) && /추천가가 없는 상품/.test(M.bqPxGate(nr, NaN)) && /추천가가 없는 상품/.test(M.bqPxGate(nr, 5)), '추천가 없음 + 값 없음/10원 미만 → 막음');
  ok(M.bqPxGate(nr, 8500) === '', '추천가 없음 + 사람이 넣은 값 → 통과');
  ok(M.bqPxGate(hr, 0) === '가격이 없음' && M.bqPxGate(hr, 9000) === '', '추천가 있는 상품도 같은 바닥');
  ok(/바닥값 8,000원보다 낮음/.test(M.bqPxGate(nr, 7500, 8000)) && M.bqPxGate(nr, 8000, 8000) === '' && M.bqPxGate(nr, 7500, 0) === '', '셋째 값 바닥값(관제창 개별 바닥값 자리) — 그 아래만 막음');
  ok(/const why = bqPxGate\(R\[\+b\.dataset\.bto\], v\); if \(why\) return toast\(why, 1\);/.test(D), '카드 「결정 대기로 →」(키보드 결정 대기도) — 바닥 검사 뒤에만 보냄');
  ok(/const pickAllOf = [^\n]*if \(bqPxGate\(x, pp\)\) return;/.test(D), '한꺼번에 보내기(pickAllOf · 살핀 패널·전체) — 같은 바닥 검사'); }
console.log('③ bqCls — 추천 못 함 → 선택 대기 표지');
{ const st = (o) => ({ picks: {}, decided: {}, held: {}, trashed: {}, fewsel: {}, edkw: {}, ...o }); const k = 'aladin_U9';
  const x = { l: { usedCode: 'U9', price: 9000 }, target: null, page1: [{ c: 'green' }, { c: 'green' }, { c: 'blue' }, { c: 'green' }] };
  ok(M.bqCls(x, { st: st() }) === 'keep', '추천가 없음 → 추천 못 함');
  ok(M.bqCls(x, { st: st({ fewsel: { [k]: { p: 8550 } } }) }) === 'sel', '선택 대기 표지가 있으면 → 선택 대기(다시 계산·새로고침 뒤에도)');
  ok(M.bqCls({ ...x, toSel: 1, target: 8550 }, { st: st() }) === 'sel', '선택 대기로 보낸 직후(toSel) → 선택 대기');
  ok(/const F = FS\[keyOf\(x\)\]; if \(F && \+F\.p >= 10\) \{ x\.target = \+F\.p; x\.toSel = 1; \}/.test(D), '표지의 값(p)으로 추천가 되살림');
  ok(/if \(t0 == null && \+x\.target >= 10\) \{ st\.fewsel = st\.fewsel \|\| \{\}; st\.fewsel\[k\] = \{[^}]*p: \+x\.target \}/.test(D) && /patch\.held \|\| patch\.trashed \|\| patch\.fewsel/.test(D), 'toSelOf — 추천가가 없던 상품은 표지를 서버에 저장');
  ok(/const kp = f === 'fewsel' && st\[f\]\[k\]\.p != null; if \(kp\) \{ x\.toSel = 0; x\.target = null; \}/.test(D) && /↩ 추천 못 함으로/.test(D), '「↩ 추천 못 함으로」 되돌리기'); }
console.log('④ 화면 — 고르기·보내기·카드 가격');
{ ok(/\$\{TA\.chk && L\.length \? fewBarHtml\(\) : ''\}/.test(D), '고르기 줄(전체 고르기·전체 풀기) — 고르기 탭 모두');
  ok(/if \(TA\.chk\) \{ res\.querySelectorAll\('\[data-bfewsel\]'\)/.test(D), '카드 고르기 칸 처리기 — 고르기 탭 모두(3개이하/미등록과 같은 것)');
  ok(/id="b_fewpick"/.test(D) && /const fp = res\.querySelector\('#b_fewpick'\)/.test(D), '「고른 것 중 n개 → 결정 대기로」 단추·처리기');
  ok(/const okI = ix\.filter\(\(i\) => !bqPxGate\(R\[i\], fewPx\(i\)\)\);/.test(D) && /모두 가격이 없음/.test(D), '고른 것 중 값이 없는 것은 남기고 알림');
  ok(/if \(TA\.chk === 'toSel'\) \{ const fg2 = res\.querySelector\('#b_fewgo'\); if \(fg2\) fg2\.onclick = async \(\) => \{[^\n]*await toSelOf\(ks\)/.test(D), '「고른 n개 → 선택 대기로」 = 살핀 패널·카드와 같은 toSelOf');
  ok(/const PIN = SELT \|\| !!TA\.pin;/.test(D), '추천 못 함 카드에도 가격 칸·−5%/+5%·「결정 대기로 →」');
  ok(/placeholder="가격 넣기"/.test(D), '빈 가격 칸 — 「가격 넣기」');
  ok(/TA\.need \? '살핀 것 넣은 가격으로 결정 대기로'/.test(D), '살핀 패널 글 — 넣은 가격으로');
  ok(/넣은 가격으로 모두 결정 대기로/.test(D), '「넣은 가격으로 모두 결정 대기로」');
  ok(/if \(TA\.chk\) fewLive\(\);/.test(D), '값을 넣는 대로 「결정 대기로」 개수 바로 바뀜'); }
console.log('⑤ 메모 자리(memo1)·화면 안 알림');
{ ok(/const bqReasonHtml = \(x, k\) => `<ul class="bqreason" data-bqreason="\$\{esc\(k\)\}"/.test(D) && /\$\{bqReasonHtml\(x, k\)\}/.test(D), '「판단 이유」 줄 한 덩어리 — bqReasonHtml · data-bqreason');
  const add = D.match(/bqkeep1[^\n]{0,400}/g) || []; ok(add.length >= 5 && !add.some((l) => /\b(alert|confirm|prompt)\(/.test(l)), '브라우저 팝업 없음(이 판에서 더한 줄)'); }
console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
