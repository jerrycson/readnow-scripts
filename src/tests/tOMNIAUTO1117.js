// tOMNIAUTO1117 — (11/17 정범님 12:06 「관리자가 일일이 확인하는 구조 말고 엔진이 스스로 판매처 값을 읽고 판단 · 관리자에겐 스스로 못 하는 것만」 · 일꾼 omniauto1)
//   ① 순수 셈(◆ledger 덩어리만): 대조(장부 할 일) → 판단(omniWho = omniPick과 같은 차례) → 예외(omniEx — 🙋 사람 몫 8가지만)
//      · 다시 읽어 확인(omniLate — 맡긴 뒤 시한 넘게 그대로면 ⚠) · 되풀이 0(같은 열쇠 다시 안 고름) · 자료를 다 못 읽으면 판단 안 함(omniStill ld=false)
//   ② 화면(harness · RN_PORT가 있을 때): 엔진을 켜면 🛠 처리할 일 맨 위 「🙋 엔진이 스스로 못 하는 일만」 카드 · 엔진이 맡는 줄은 목록에서 빠짐 · 「모두 보기」로 다시 보임
// 실행: node tOMNIAUTO1117.js (화면은 pw/ 안에서 RN_PORT=<포트>) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
const F = new Function(cut('/* ◆ledger 시작', '/* ◆ledger 끝 */') + '\nreturn { ledBuild, ledTodo, omniPick, omniStill, omniLate, omniWho, omniEx, omniRk, OMNI_EX_K, OMNI_VERIFY_MS, OMNI_RE_MAX };')();
console.log('① 순수 셈');
const from = '2026-11-12T03:00:00Z';
const I = { now: '2026-11-12T05:00:00Z', days: 30,
  al: [{ id: 'aladin_B1', title: '밀린 책', qty: 1, live: true, st: '판매중', skus: ['B1'] }, { id: 'aladin_N1', title: '새 주문 책', qty: 1, live: true, st: '판매중', skus: ['N1'] },
    { id: 'aladin_F1', title: '예스24 많음', qty: 1, live: true, st: '판매중', skus: ['F1'] }, { id: 'aladin_A1', title: '알라딘 많음', qty: 3, live: true, st: '판매중', skus: ['A1'] },
    { id: 'aladin_L1', title: '예스24 적음', qty: 2, live: true, st: '판매중', skus: ['L1', 'L1b'] }, { id: 'aladin_M1', title: '짝 모름 책', qty: 1, live: true, st: '판매중', skus: ['M1'] },
    { id: 'aladin_O1', title: '초과 판매 책', qty: 1, live: true, st: '판매중', skus: ['O1'] }],
  y24: [{ no: '801', title: '밀린 책', stock: 1, live: true, self: 'B1', flags: [] }, { no: '803', title: '예스24 많음', stock: 3, live: true, self: 'F1', flags: [] }, { no: '804', title: '알라딘 많음', stock: 1, live: true, self: 'A1', flags: [] },
    { no: '805', title: '예스24 적음', stock: 1, live: true, self: 'L1', flags: [] }, { no: '806', title: '새 주문 책', stock: 1, live: true, self: 'N1', flags: [] },
    { no: '807', title: '짝 모름 책', stock: 1, live: true, self: 'M1', flags: [] }, { no: '808', title: '짝 모름 책', stock: 1, live: true, self: 'M1', flags: [] }, { no: '809', title: '초과 판매 책', stock: 1, live: true, self: 'O1', flags: [] }],
  ord: [{ ch: 'aladin', no: 'o1', at: '2026-11-12T01:00:00Z', amt: 3000, lines: [{ lid: 'aladin_B1', qty: 1 }] }, { ch: 'aladin', no: 'o2', at: '2026-11-12T04:00:00Z', amt: 3000, lines: [{ lid: 'aladin_N1', qty: 1 }] },
    { ch: 'aladin', no: 'o3', at: '2026-11-12T04:10:00Z', amt: 3000, lines: [{ lid: 'aladin_M1', qty: 1 }] },
    { ch: 'aladin', no: 'o4', at: '2026-11-12T04:20:00Z', amt: 3000, lines: [{ lid: 'aladin_O1', qty: 1 }] }, { ch: 'yes24', no: 'o5', at: '2026-11-12T04:30:00Z', amt: 3000, lines: [{ sku: 'O1', qty: 1 }] }] };
const V = F.ledBuild(I); const TD = F.ledTodo(V); const g = (k) => TD.find((x) => x.key === k);
/* 1) 대조 — 장부가 판매처 값을 스스로 맞대어 할 일을 만듦(사람이 누르지 않음) */
ok(g('B1') && g('N1') && g('F1') && g('A1') && g('A1').aud, '대조: 주문으로 생긴 일(B1·N1)·예스24 > 알라딘(F1)·실사(A1)를 장부가 스스로 만듦', TD.map((x) => x.key));
/* 2) 판단 — omniWho는 omniPick 고르는 차례와 같음(둘이 어긋나면 사람 몫·엔진 몫 셈이 틀림) */
{ let mis = []; for (const bl of [0, 1]) { const P = F.omniPick(TD, { from, bl, lim: { aladin: 99, yes24: 99, naver: 99 } }); const picked = new Set(P.map((p) => p.T.key + '|' + p.a.ch + '|' + p.a.k + '|' + p.a.to));
    for (const T of TD) for (const a of T.acts || []) { const w = F.omniWho(T, a, { from }); const k = T.key + '|' + a.ch + '|' + a.k + '|' + a.to; const ord = T.sold > 0 && (T.from || []).length > 0; const isBl = !ord || String(T.last || '') < from;
      if (picked.has(k) && w) mis.push(['골랐는데 사람 몫', bl, k, w.kind]); if (!w && !picked.has(k) && (bl || !isBl)) mis.push(['엔진 몫인데 안 고름', bl, k]); } }
  ok(!mis.length, '판단: omniWho(엔진이 맡나) = omniPick(엔진이 고르나) — 지금·밀린 일 미리보기 뒤 모두 같음', mis); }
ok(F.omniWho(g('A1'), (g('A1').acts || [])[0] || { ch: 'aladin' }, { from }).kind === 'audit', '판단: 실사 줄은 🔍 실사(엔진이 알라딘을 내리지 않음)');
{ const a = g('M1').acts.find((x) => x.ch === 'yes24'); const w = a && F.omniWho(g('M1'), a, { from }); ok(w && w.kind === 'match', '판단: 같은 자체코드 예스24가 둘 → ❔ 짝 모름(엔진이 짐작해 고르지 않음)', { a, w }); }
{ const a = g('B1').acts.find((x) => x.ch === 'yes24'); ok(!F.omniWho(g('B1'), a, { from, blSt: 'go' }) && F.omniWho(g('B1'), a, { from, blSt: 'stop' }).kind === 'stop', '판단: 밀린 일은 엔진 몫 · 사람이 ⏸ 멈춰 두면 ⏸ 사람이 멈춤'); }
{ const al = g('N1').acts.find((x) => x.ch === 'aladin'); ok(!al || F.omniWho(g('N1'), al, { from }).kind === 'self', '판단: 팔린 판매처(알라딘) 제 칸은 아무도 안 맡음(사람 몫으로도 안 셈)'); }
ok(F.omniWho({ key: 'X', sold: 1, from: ['aladin'], last: '2026-11-12T04:00:00Z', acts: [] }, { ch: 'yes24', k: 'up', to: 3 }, { from }).kind === 'rule', '판단: 올리기·가격·지우기는 📏 규칙 밖(헌장 제7·8조 — 엔진은 내리기·줄이기만)');
/* 3) 예외 — 엔진이 스스로 못 하는 것만 사람 몫 */
{ const R = F.omniEx(TD, { from }); const kinds = new Set(R.ex.map((x) => x.kind)); const K = (k) => R.ex.filter((x) => x.key === k);
  ok(K('O1').some((x) => x.kind === 'loss') && K('A1').some((x) => x.kind === 'audit') && K('M1').some((x) => x.kind === 'match'), '예외: 💸 초과 판매(O1)·🔍 실사(A1)·❔ 짝 모름(M1)', R.ex);
  ok(R.engK.has('N1') && !R.people.has('N1') && !R.engK.has('A1') && !R.engK.has('M1') && R.eng === R.engK.size, '예외: 엔진이 맡는 줄(N1)은 사람 몫에 없음 · eng = 엔진 줄 수', { eng: R.eng, engK: [...R.engK], ppl: [...R.people] });
  ok([...kinds].every((k) => F.OMNI_EX_K[k]) && Object.keys(F.OMNI_EX_K).length === 8, '예외 종류는 정해진 8가지만', [...kinds]); }
{ const R = F.omniEx(TD, { from, y24Why: '번외 수집기 PC 없음' }); ok(R.ex.some((x) => x.key === 'N1' && x.ch === 'yes24' && x.kind === 'login') && !R.engK.has('N1'), '예외: 예스24 쓰기 길이 없으면 🔑 쓰기 길·로그인(엔진 몫에서 빠짐)', R.ex.filter((x) => x.key === 'N1')); }
{ const R = F.omniEx(TD, { from, alarm: { k: 'beat', t: '자동 내림을 돌릴 PC가 없음' } }); ok(R.ex[0] && R.ex[0].kind === 'pc' && !R.ex[0].key, '예외: 돌릴 PC가 없으면 💓 한 줄(맨 위)', R.ex[0]); }
{ const st = (n, s) => (T, a) => (T.key === 'N1' && a.ch === 'yes24' ? { cls: 'bad', t: '⚠ 예스24가 받지 않음', todo: '번외 확인', n, st: s } : null);
  const R1 = F.omniEx(TD, { from, st: st(2, 'sent') }), R5 = F.omniEx(TD, { from, st: st(F.OMNI_RE_MAX, 'sent') }), Rf = F.omniEx(TD, { from, st: st(1, 'fail') });
  ok(!R1.ex.some((x) => x.kind === 'reject') && R1.engK.has('N1'), '예외: 다시 맡길 수 있는 동안(2번째)은 엔진 몫(엔진이 다시 맡김)', R1.ex);
  ok(R5.ex.some((x) => x.key === 'N1' && x.kind === 'reject') && Rf.ex.some((x) => x.key === 'N1' && x.kind === 'reject' && /맡기지 못함/.test(x.why)), `예외: ${F.OMNI_RE_MAX}번 맡겨도 안 됨·맡기기 전 실패 → ⛔ 판매처가 받지 않음`, { R5: R5.ex, Rf: Rf.ex }); }
/* 4) 다시 읽어 확인 — 맡긴 뒤 시한 */
{ const t0 = Date.parse('2026-11-12T10:00:00Z'); const at = (h) => new Date(t0 - h * 3600e3).toISOString();
  ok(F.omniLate({ ch: 'aladin', st: 'sent', at: at(2 + 1 / 60) }, t0) > 0 && F.omniLate({ ch: 'aladin', st: 'sent', at: at(1) }, t0) === 0 && F.omniLate({ ch: 'aladin', st: 'fail', at: at(9) }, t0) === 0 && F.omniLate({ ch: 'yes24', st: 'sent', at: at(2.5) }, t0) === 0 && F.omniLate({ ch: 'yes24', st: 'dup', at: at(3.5) }, t0) > 0,
    '다시 읽어 확인: 알라딘·네이버 2시간 · 예스24 3시간 넘게 그대로면 ⚠ · 실패 줄은 시한 셈 안 함', F.OMNI_VERIFY_MS);
  ok(F.omniLate({ ch: 'naver', st: 'sent', at: at(5), doneAt: at(0.5) }, t0) === 0, '다시 읽어 확인: 판매처가 받은 시각(doneAt)부터 셈'); }
/* 5) 되풀이 0 — 맡긴 열쇠는 다시 안 고름 */
{ const P = F.omniPick(TD, { from, bl: 1 }); const done = new Set(P.map((p) => p.rk)); const P2 = F.omniPick(TD, { from, bl: 1, done }); const rks = P.map((p) => p.rk);
  ok(P.length > 0 && P2.length === 0 && new Set(rks).size === rks.length, '되풀이 0: 한 번 맡긴 일은 같은 열쇠로 다시 안 고름 · 한 번에 같은 열쇠 둘 없음', { n: P.length, P2: P2.length }); }
/* 6) 자료 없음 → 판단 안 함 */
{ const a = g('B1').acts.find((x) => x.ch === 'yes24'); const s0 = F.omniStill(a, { live: true, qty: 1 }, false), s1 = F.omniStill(a, null, false), s2 = F.omniStill(a, { live: false }, false);
  ok(s0.wait && s1.wait && s2.wait && !s0.go && !s2.shut && F.omniStill(a, { live: true, qty: 1 }, true).go === 1, '자료 없음: 판매처 목록을 다 못 읽었으면 맡기지도 닫지도 않음(거짓 경보 0) · 다 읽으면 예전대로', { s0, s1, s2 }); }
{ const ex = cut('function omniWhy(', 'function omniTick('); ok(/실물 SKU 표를 못 읽음/.test(ex) && /실물 SKU 표를 아직 다 안 읽음/.test(ex), '자료 없음: 실물 SKU 표를 다 읽기 전엔 엔진 1분 돌기가 쉼(같은 책 열쇠가 바뀌지 않게)'); }
{ const i = T.indexOf('async function omniTick('); const tk = i < 0 ? '' : T.slice(i, T.indexOf('const why = omniWhy()', i)); ok(i > 0 && /skuWatch\(\)/.test(tk) && /i < 60 && !sr\(\)/.test(tk) && /finally \{ S\._omniBusy = 0; \}/.test(tk), '자료 없음: SKU 표가 막 읽히는 중이면 판단 전에 잠깐(9초까지) 기다림 · 기다리는 동안 겹쳐 돌지 않음'); }
{ const tk = (() => { const i = T.indexOf('async function omniTick('); return i < 0 ? '' : T.slice(i, i + 12000); })(); ok(/omniHoldNow\(P\.T, P\.a\)/.test(tk) && (/omniStill\(P\.a, omniCur\(P\.T, ?P\.a\), omniLd\(P\.a\.ch\)\)/.test(tk) || (/omniRecheck\(P, TD2, omniCur\(P\.T, ?P\.a\), omniLd\(P\.a\.ch\)\)/.test(tk) && /return omniStill\(a2, cur, ld\)/.test(T))), '맡기기 직전: 등록 중·사람이 막 손댄 칸은 쉼 · 모든 일에 다시 셈(판매처 목록을 다 읽었을 때만)'); }
/* 9) (clash1 F-1) 알라딘 '수량 n권'은 절대값 — 줄이기 전용(downOnly): 보내기 직전 지금 수량(c)·맡길 때(b)·목표(t)로 가름 · 클라우드와 수집기가 같은 셈 */
{ const fnd = (L) => { for (const b of [path.join(__dirname, '..'), path.join(__dirname, '../..')]) for (const x of L) { const f = path.join(b, x); if (fs.existsSync(f)) return f; } return null; };
  const CS = fs.readFileSync(fnd(['cloud/index.js']), 'utf8'); const PS = (() => { for (const b of [path.join(__dirname, '..'), path.join(__dirname, '../..')]) for (const x of ['src/readnow-collector.src.js', 'readnow-collector.src.js', 'readnow-collector.user.js', 'readnow-pc-helper.js']) { const f = path.join(b, x); if (!fs.existsSync(f)) continue; const t = fs.readFileSync(f, 'utf8'); if (t.includes('async function prdEditPc')) return t; } return ''; })(); /* 시험 관문 w/ 안에선 수집기 원본이 readnow-collector.user.js 이름으로 놓임 */
  const body = (src, nm) => { const m = src.match(new RegExp('const ' + nm + ' = (\\(c, b, t\\) => [^;]+);')); return m ? m[1] : null; };
  const bc = body(CS, 'peDown'); const bp = body(PS, 'peDownPc'); ok(bc && bp && bc === bp, 'F-1: 클라우드 peDown과 수집기 peDownPc가 글자 그대로 같은 셈', [bc, bp]);
  const D = bc ? new Function('return ' + bc)() : () => null;
  ok(D(0, 1, 1) === 'done', "F-1: 그 사이 팔려 지금 0권 · 목표 1권 → '이미 됨'(0을 1로 되살리지 않음)", D(0, 1, 1));
  ok(D(1, 2, 1) === 'done', "F-1: 지금 = 목표 → '이미 됨'(보내지 않음)");
  ok(D(3, 2, 1) === 'human', "F-1: 맡길 때 2권 → 지금 3권(사람이 늘림) → '사람 몫'(덮지 않음)", D(3, 2, 1));
  ok(D(2, 2, 1) === 'send' && D(2, null, 1) === 'send', "F-1: 지금 2권 = 맡길 때 · 목표 1권 → 보냄");
  ok(D(null, 2, 1) === 'unk' && D(undefined, 2, 1) === 'unk', "F-1: 지금 수량을 못 읽으면 보내지 않음('unk')");
  { const i = CS.indexOf('async function prdEditRun'); const seg = CS.slice(i, CS.indexOf('/* ① 바로 바꾸기 */', i)); const k = seg.indexOf('v.downOnly && \'qty\' in ch'); ok(i > 0 && k > seg.indexOf('if (cur.uid !== lid)') && k < seg.indexOf('if (v.qtyAdd != null'), 'F-1: 클라우드 prdEditRun — 상품 번호 확인 뒤·수량 보내기 전에 줄이기 전용 셈'); }
  { const i = PS.indexOf('async function prdEditPc'); const seg = PS.slice(i, i + 20000); const k = seg.indexOf('v.downOnly && \'qty\' in ch'); ok(i > 0 && k > 0 && k < seg.indexOf('if (v.qtyAdd != null'), 'F-1: 수집기 prdEditPc — 같은 자리에 줄이기 전용 셈'); }
  const AL = (() => { const i = T.indexOf('async function ledAlGo'); return i < 0 ? '' : T.slice(i, T.indexOf('function ledTodoBind', i)); })();
  ok(/peQueue\(l, ch, \{ qty: cur \}, \{ quiet: true, downOnly: 1, \.\.\.\(auto \? \{ auto: 'omni' \} : \{\}\) \}\)/.test(AL) || (/const po = \{ quiet: true, \.\.\.\(ch\.state \? \{\} : \{ downOnly: 1 \}\), \.\.\.\(auto \? \{ auto: 'omni' \} : \{\}\) \}/.test(AL) && /peQueue\(l, ch, \{ qty: cur \}, po\)/.test(AL)), "F-1: 통합 장부 알라딘 수량은 downOnly:1 · 자동이면 auto:'omni'");
  ok(/await ledAlGo\(T\.key, a\.to, 1\)/.test(T), '자동 감시(omniTick)는 ledAlGo에 자동 표시를 넘김');
  ok(/\.\.\.\(opt\.downOnly && 'qty' in ch && !opt\.qtyAdd \? \{ downOnly: 1 \} : \{\}\)/.test(T), 'peQueue가 명령 문서에 downOnly를 적음');
  ok(/return s\.cls === 'bad' && !s\.human;/.test(T), "F-1: '사람 몫'(사람이 늘린 수량) 실패는 엔진이 다시 맡기지 않음(되풀이 0)");
  /* omniEx — 사람이 늘린 줄은 🙋 사람 몫(📏 규칙 밖)으로만 · 엔진 몫에 세지 않음 */
  const TN = g('N1'); const aN = TN && (TN.acts || []).find((x) => !F.omniWho(TN, x, { from })); /* 엔진이 맡는 칸 */
  if (TN && aN) { const R = F.omniEx([TN], { from, st: (T0, a0) => (T0 === TN && a0 === aN ? { cls: 'bad', human: 1, t: '🙋 사람 몫 — 실패 — 사람 몫 — 맡길 때 1권이었는데 지금 2권', st: 'sent', n: 1 } : null) });
    ok(R.ex.some((x) => x.key === 'N1' && x.kind === 'rule' && /사람 몫/.test(x.why)) && R.people.has('N1'), "F-1: omniEx — 사람이 늘린 줄은 🙋 사람 몫(📏)으로", R.ex); }
  else ok(false, 'F-1: 시험 자료 N1 할 일을 못 찾음'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tOMNIAUTO1117 ${bad}개 실패` : '✓ tOMNIAUTO1117 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  await p.evaluate(() => { window.__T0 = Date.now(); const ids = ['aladin_U215983410', 'aladin_U215983412']; ids.forEach((id) => { const l = S.plist.get(id); l.status = '판매중'; l.active = true; });
    window.ledNow = () => { const al = ids.map((id) => { const l = S.plist.get(id); return { id, title: l.title, price: l.price, qty: id.endsWith('12') ? 3 : 1, live: true, st: '판매중', skus: ['SK' + id.slice(-2)] }; });
      const ord = [{ ch: 'yes24', no: 'y0', at: new Date(window.__T0 - 10 * 60e3).toISOString(), amt: 5000, lines: [{ sku: 'SK10', qty: 1 }] }];
      const y24 = [{ no: 'y12', title: S.plist.get(ids[1]).title, stock: 1, live: true, self: 'SK12', flags: [] }]; /* 알라딘 3권 · 예스24 1권 → 🔍 실사(사람 몫) */
      return ledBuild({ al, y24, ord, reg: [], chs: ledChs(), days: 30, now: new Date().toISOString() }); };
    S.y24.loaded = true; S.y24o.loaded = true; });
  await p.evaluate(async () => { await db.collection('app_settings').doc('platforms').set({ omni: { autoDown: { on: 1, from: new Date(window.__T0 - 3600e3).toISOString(), by: 'test', at: new Date().toISOString() } } }, { merge: true }); await omniLoad(true); S._led = null; S._ledView = 'todo'; S._ledAll = 0; openLedger(); });
  await p.waitForTimeout(700);
  const A = await p.evaluate(() => { const c = document.getElementById('omni_ex'); const sh = document.getElementById('sheet'); return { c: c ? c.textContent : '', n: c && c.dataset.exn, rows: [...document.querySelectorAll('.omni-ex-r')].map((r) => r.dataset.exk), t10: !!(sh && sh.querySelector('[data-pid="aladin_U215983410"]')), t12: !!(sh && sh.querySelector('[data-pid="aladin_U215983412"]')) }; });
  ok(/엔진이 스스로 못 하는 일만/.test(A.c) && A.rows.includes('audit'), '🛠 처리할 일 맨 위 「🙋 엔진이 스스로 못 하는 일만」 카드 · 실사 줄은 사람 몫', A);
  await p.locator('#omni_exall').click(); await p.waitForTimeout(400);
  const B = await p.evaluate(() => ({ all: S._ledAll, c: (document.getElementById('omni_ex') || {}).textContent || '' }));
  ok(B.all, '「모두 보기」를 누르면 엔진이 맡는 줄까지 다 보임', B);
  ok(!dlg.length, '브라우저 창(alert·confirm) 0', dlg);
  console.log(bad ? `❌ tOMNIAUTO1117 ${bad}개 실패` : '✓ tOMNIAUTO1117 모두 통과'); });
