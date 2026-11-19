// tREO1FZ — (reo1 · 정범님 I-1120-0149-07) 수동 일괄 확정 「빠진 것도 함께 확정」·「이번엔 비교군 없이」
//  batchExec0를 흉내 저장소(vm)에서 그대로 돌림 — ① 기본은 빠짐 그대로 ② 켜면 조건 밖·10분의 1 아래 상품이 확정 목록에 듦 ③ 비교군 없이는 이번만(ctrlPct 그대로 · 이미 비교군인 상품 그대로) ④ 잠금 상품은 켜도 빠짐
// 실행: node tREO1FZ.js · 시험 자료에 손님 정보 없음 · 진짜 운영 저장소·잠금(prd_locks) 쓰지 않음(모두 흉내)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const i0 = T.indexOf('/* ◆bqexec ('), i1 = T.indexOf('/* ◆bqexec 끝 */', i0); /* (recf1) 확정 본문은 바깥 bqExecCore(E, only, opt) · 확인 창 bqExecAsk — 그룹 화면 batchExec0은 그 화면 값을 넘기는 얇은 껍데기 */
const EX = i0 > 0 && i1 > i0 ? T.slice(i0, i1) + '\nconst batchExec0 = (only, opt) => bqExecCore(__E, only, opt);\n' : '';
const f0 = T.indexOf('/* ◆bqfz '), f1 = T.indexOf('/* ◆bqfz 끝 */'); const FZB = f0 > 0 && f1 > f0 ? T.slice(f0, f1) : '';
ok(!!EX && !!FZB, '확정 함수·확인 판 덩어리를 찾음');
ok(!/\b(alert|confirm|prompt)\s*\(/.test(FZB), '새 덩어리에 브라우저 창 없음');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const won = (n) => (n == null ? '-' : n + '원');

async function run(opt, mk) {
  const W = { sheets: [], asks: [], notes: [], toasts: [], bsave: [], save: [], exec: null };
  const items = mk(); const R = items.map((it) => ({ l: { usedCode: it.u, listingId: 'L' + it.u, title: '책 ' + it.u, price: it.cur, status: '판매중' }, out: !!it.out, start: it.start, lk: !!it.lk, target: it.pick }));
  const st = { picks: {}, decided: {}, ctrl: { aladin_OLDC: { at: 'x', price: 1 } } }; R.forEach((x, i) => { st.picks['aladin_' + x.l.usedCode] = { price: items[i].pick }; });
  const c = { name: '1만 이하', ctrlPct: 20 };
  const env = {
    id: 'G1', c, st, R, L: R.map((x, i) => i), keyOf: (x) => 'aladin_' + x.l.usedCode, startOf: (x) => x.start, lotCheck: () => false,
    S: { prCfg: {}, user: { email: 'a@b' }, batchMeta: {}, pbooks: new Map() }, WATCH_MIN: '0.0.1', cmpVer: () => 1, bqApplyUi: () => true, batchIsOn: () => true,
    plkFreshMany: async (ks) => new Map(), bqLockWhy: (x) => (x.lk ? { m: 'full', v: { on: true } } : null), plkSkipped: () => {}, plkCondOk: () => true, plkClamp: (v, p) => ({ ok: true, p }), plkCtx: () => ({}), plkNote: () => {},
    PRC: { bucketOf: (s) => (/^C/.test(s) ? 0 : 99), groupOfListing: () => 'g' }, prSettings: () => ({}), fsSafe: (x) => x, mkRows: () => [], decMktOfListing: () => ({}), decSnap: () => Promise.resolve(), phClear: () => {},
    W: () => ({}), BP: { per: 6000, cnt: { wait: 0, applying: 0 } }, nLate: 0, won, num: String, esc, errKo: (e) => String(e && e.message),
    ask: async (m) => { W.asks.push(m); return true; }, askSheet: async (o) => { W.sheets.push(o); return true; }, toast: (m) => W.toasts.push(m), rnNoteW: (m) => W.notes.push(m), redraw: () => {},
    save: (p) => { W.save.push(p); if (p.execLog) W.exec = p.execLog; }, batchSave: async (gid, p) => { W.bsave.push(p); },
    window: { addEventListener() {}, removeEventListener() {} }, document: { getElementById: () => null },
    firebase: { firestore: { FieldPath: { documentId: () => '__id' }, FieldValue: { delete: () => '__del', arrayUnion: (x) => x } } },
    db: { collection: (n) => ({ doc: (d) => ({ get: async () => ({ exists: n === 'prd_system', data: () => ({ watchVer: '9.9.9', watchTab: 't', watchBeat: new Date().toISOString() }) }) }), where: () => ({ get: async () => ({ forEach() {} }) }) }), batch: () => ({ set() {}, commit: async () => {} }) },
    meta: () => env.S.batchMeta, pxMark: () => false, ctrlRecOf: () => ({}), bqBaseOf: () => ({}), bqOnceStart: async () => {}, bqWaitK: () => [], cancelOne: async () => [true],
  };
  const has = (t, k) => typeof k === 'string' && (k in env || !(k in globalThis));
  const P = new Proxy(env, { has, get: (t, k) => (k === Symbol.unscopables ? undefined : k in t ? t[k] : (() => undefined)) });
  env.__E = P; /* (recf1) with 안에서 이름 env는 흉내 덩어리로 풀리지 않음 — 흉내 판 자체를 __E로 넘김 */
  const F = new Function('env', `with (env) { ${FZB}\n${EX}\n return { batchExec0, bqFzHtml }; }`)(P);
  env.twiceArm = () => 'go';
  await F.batchExec0(null, opt);
  W.dec = Object.assign({}, ...W.bsave.map((p) => p.decided || {})); W.ctrlW = Object.assign({}, ...W.bsave.map((p) => p.ctrl || {})); W.st = st; W.c = c; W.F = F; return W;
}
/* 상품: 보통 A1~A12(이 가운데 C로 시작하는 것은 비교군) · 조건 밖 O1·O2 · 10분의 1 아래 T1 · 조건 밖이면서 잠금 OL */
const mk = () => [
  ...Array.from({ length: 10 }, (_, i) => ({ u: 'A' + i, cur: 10000, start: 10000, pick: 9000 })),
  { u: 'C1', cur: 10000, start: 10000, pick: 9000 }, { u: 'C2', cur: 10000, start: 10000, pick: 9000 },
  { u: 'O1', cur: 8000, start: 8000, pick: 7000, out: 1 }, { u: 'O2', cur: 8000, start: 8000, pick: 7000, out: 1 },
  { u: 'T1', cur: 50000, start: 50000, pick: 3000 }, { u: 'OL', cur: 8000, start: 8000, pick: 7000, out: 1, lk: 1 },
];
(async () => {
  console.log('① 기본 — 지금처럼 뺌');
  { const W = await run({}, mk); const k = Object.keys(W.dec);
    ok(k.length === 10 && k.every((x) => /aladin_A/.test(x)), '확정 = 보통 10개만(조건 밖·10분의 1 아래·비교군·잠금 빠짐)', k);
    ok(W.sheets.length === 1 && /data-bqfz="out"/.test(W.sheets[0].html) && /data-bqfz="tenth"/.test(W.sheets[0].html) && /data-bqfz="noCtrl"/.test(W.sheets[0].html), '확인 판에 세 고르기 단추(조건 밖·10분의 1 아래·비교군 없이)');
    ok(/지금 조건 밖 2개도 함께 확정/.test(W.sheets[0].html) && /시작 가격의 10분의 1 아래 1개도 함께 확정/.test(W.sheets[0].html), '빠질 수 = 조건 밖 2(잠금 상품은 이미 빠져 셈 안 함) · 10분의 1 아래 1', W.sheets[0].html.slice(0, 300));
    ok(/책 T1 · 시작 50000원 → 고른 3000원/.test(W.sheets[0].html), '10분의 1 아래는 켜기 전에 목록(제목 · 시작 가격 → 고른 가격)을 보여 줌');
    ok(st2(W, 'O1') === '지금 조건 밖' && st2(W, 'T1') === '시작 가격의 10분의 1 아래', '빠진 상품은 까닭(dropWhy)을 남김', [W.st.picks.aladin_O1, W.st.picks.aladin_T1]);
    ok(Object.keys(W.ctrlW).sort().join() === 'aladin_C1,aladin_C2', '비교군 2개는 그대로 비교군', W.ctrlW);
    ok(W.exec && !W.exec.forced && !W.exec.noCtrl, '실행 기록에 넘김 표시 없음', W.exec); }
  console.log('② 「빠진 것도 함께 확정」 켬');
  { const W = await run({ forceOut: true, forceTenth: true }, mk); const k = Object.keys(W.dec);
    ok(['aladin_O1', 'aladin_O2', 'aladin_T1'].every((x) => k.includes(x)) && k.length === 13, '조건 밖 2·10분의 1 아래 1이 확정 목록에 듦(13개)', k);
    ok(!k.includes('aladin_OL'), '잠금 상품은 켜도 빠짐');
    ok(!st2(W, 'O1') && !st2(W, 'T1'), '함께 확정한 상품엔 빠진 까닭을 남기지 않음', [W.st.picks.aladin_O1, W.st.picks.aladin_T1]);
    ok(W.dec.aladin_T1 && W.dec.aladin_T1.price === 3000, '고른 가격 그대로 확정');
    ok(W.exec && JSON.stringify(W.exec.forced) === '["out","tenth"]' && W.exec.forcedN === 3, '실행 기록 forced: [out, tenth] · 3개', W.exec);
    ok(W.notes.some((m) => /빠질 것을 함께 확정/.test(m)), '끝 알림에 함께 확정한 수'); }
  console.log('③ 「이번엔 비교군 없이」');
  { const W = await run({ noCtrl: true }, mk); const k = Object.keys(W.dec);
    ok(k.includes('aladin_C1') && k.includes('aladin_C2') && k.length === 12, '비교군이었을 2개도 가격을 바꿈(12개)', k);
    ok(!Object.keys(W.ctrlW).length, '이번엔 비교군 기록을 새로 쓰지 않음');
    ok(W.c.ctrlPct === 20 && !W.bsave.some((p) => 'ctrlPct' in p) && !W.save.some((p) => 'ctrlPct' in p), '그룹 설정 ctrlPct는 그대로(20)');
    ok(W.st.ctrl.aladin_OLDC && W.st.ctrl.aladin_OLDC.price === 1, '이미 비교군에 든 상품은 건드리지 않음');
    ok(W.exec && W.exec.noCtrl === true && W.exec.noCtrlN === 2, '실행 기록 noCtrl: true', W.exec); }
  console.log('④ 확인 판 두 번 누름');
  { const W = await run({}, mk); const html = W.sheets[0].html; ok(/켜려면 두 번 누름/.test(html) && /twiceArm\(b, '켜기'/.test(FZB), '켜기는 두 번 누름(twiceArm) · 다시 누르면 끔');
    const n = (s) => (T.match(new RegExp(s, 'g')) || []).length; ok(n('const FZ = \\{ out: !!O\\.forceOut, tenth: !!O\\.forceTenth, noCtrl: !!O\\.noCtrl \\}') === 1, '기본은 모두 꺼짐(opt로만 미리 켬)'); }
  console.log(bad ? `❌ tREO1FZ ${bad}개 실패` : '✓ tREO1FZ 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('  ❌ 시험 오류', e && e.stack); process.exit(1); });
function st2(W, u) { const p = W.st.picks['aladin_' + u]; return p && p.dropWhy ? String(p.dropWhy).split(' (')[0] : null; }
