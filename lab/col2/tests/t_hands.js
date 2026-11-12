/* t_hands — 🖐 손발 길 (11/12 hands1 · 정범님 결정 'HOME 알라딘은 평소 크롬을 손발로' · readnow-chats reports/ANS_1112_night.md 8번 길 가)
 *  ⓪ 순수 함수 — handsClean이 정해진 칸만 남김(손님 정보 칸 버림) · 운영 수집기 본문의 맡김 주소 표가 번외 읽기 다섯 길과 글자까지 같음 · 해석 칸이 번외 READ_FN과 같음
 *  ① 설정 — 기본: HOME만 켬 · 다른 PC 꺼짐 · 로거는 칸을 숨기고 켜지지도 않음(약속 0)
 *  ② HOME — 번외 크롬은 알라딘에 로그인하지 않음(크롬 안 띄움 · 로그인 단추 = 평소 크롬 띄우기) · 🏠 이어받기를 켜 둬도 번외 자리 안 받음(운영 탭이 자리 그대로)
 *  ③ 맡김 → 결과 받기 → 운영 칸과 견줌 — 손님 정보는 결과·상태·파일 어디에도 없음 · 출고 중엔 맡기지 않음 · 답이 없으면 기다림 끝
 *  ④ 창 — 평소 크롬 손발 창 찾기·숨기기·띄우기 · 로그인이 오래 풀리면 저절로 앞으로 · 끄기·닫기는 절대 안 함
 * 시험 자료의 손님은 '손님A'·010-1234-5678 꼴만(공개 저장소) · 실행: node tests/t_hands.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), cp = require('child_process');
const AC = require('../shadow/col2-al-compare.js'); const AL = require('../helper/col2-al.js');
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 60); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };
const PII = ['손님A', '010-1234-5678', '시험시 시험구 1길', '책 상태가 궁금해요'];
const walk = (d, hit) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); let st0; try { st0 = fs.lstatSync(p); } catch (e) { continue; } if (st0.isSymbolicLink()) continue; if (st0.isDirectory()) walk(p, hit); else hit(f, fs.readFileSync(p, 'utf8')); } };
const repo = process.env.COL2_PROD_REPO || path.join(__dirname, '..', '..', '..');

(async () => {
  console.log('⓪ 순수 함수 · 운영 수집기 본문과 맞춤');
  { const c = AL.handsClean('list', { ok: true, st: 200, sum: { page: 1, lastPage: 1, rows: [{ u: 'U1', l: '5', s: '판매중', p: 12000, k: 'A-1', g: '상', q: 1, buyer: '손님A', phone: '010-1234-5678' }] }, extra: '손님A' });
    ok(c.ok && c.sum.rows[0].u === 'U1' && c.sum.rows[0].p === 12000 && !PII.some((w) => JSON.stringify(c).includes(w)), '상품 목록 답 — 정해진 칸(u·l·s·p·k·g·q)만 남기고 그 밖 칸은 버림', JSON.stringify(c));
    const o = AL.handsClean('confirm', { ok: true, sum: { tab: { 주문확인요청: 2, '<b>': '손님A' }, orders: [{ o: '111-A1', it: ['5'], d: null, name: '손님A', addr: '시험시 시험구 1길' }] } });
    ok(o.ok && o.sum.orders[0].o === '111-A1' && o.sum.tab['주문확인요청'] === 2 && !PII.some((w) => JSON.stringify(o).includes(w)), '주문 답 — 주문번호·상품 번호·송장만', JSON.stringify(o));
    const q = AL.handsClean('qna', { ok: true, sum: { rows: [{ q: '9001', a: 'true', title: '책 상태가 궁금해요', who: '손님A' }] } });
    ok(q.ok && q.sum.rows[0].q === '9001' && !PII.some((w) => JSON.stringify(q).includes(w)), '문의 답 — 문의 번호·답 상태만(글·작성자 없음)', JSON.stringify(q));
    const f = AL.handsClean('list', { ok: false, login: true, kind: 'login', why: '샵매니저가 로그인 화면으로 감' }); ok(!f.ok && f.login && f.kind === 'login', '로그인 풀림 답은 그대로 전함');
    ok(!AL.handsClean('zzz', { ok: true }).ok && !AL.handsClean('list', null).ok, '모르는 일·빈 답은 실패로'); }
  { const src = fs.readFileSync(path.join(repo, 'src', 'readnow-collector.src.js'), 'utf8'); const m = /const HST = (\{[^}]+\});\s*const hUrl = (\(j\) => \{[\s\S]*?default: return null; \} \});/.exec(src);
    ok(!!m, '운영 수집기 본문(rnC2al)에 🖐 손발 맡김 주소 표가 있음');
    if (m) { const hUrl = new Function(`const HST = ${m[1]}; return ${m[2].replace(/;$/, '')};`)();
      const cases = [['chk', {}], ['confirm', {}], ['deliv', {}], ['list', { st: '판매중', page: 1 }], ['list', { st: '판매중지', page: 3 }], ['list', { st: '일시판매중지', page: 99 }], ['qna', { page: 1 }], ['qna', { page: 40 }]];
      ok(cases.every(([k, a]) => hUrl({ k, ...a }) === AC.READ[k].url(a)), '맡김 주소 = 번외 읽기 다섯 길과 글자 하나까지 같음(쪽 번호 한도까지)', cases.map(([k, a]) => [hUrl({ k, ...a }), AC.READ[k].url(a)]).filter(([x, y]) => x !== y));
      ok(cases.every(([k, a]) => AC.isReadUrl(hUrl({ k, ...a }))) && hUrl({ k: 'list', st: '판매금지' }) === null && hUrl({ k: '/scm/ajaxCmd.aspx?cmd=x' }) === null && hUrl({ k: 'write' }) === null, '맡김 주소는 모두 읽기 길 · 모르는 종류·상태는 주소를 만들지 않음'); }
    const blk = (src.match(/\(function rnC2al\(\)[\s\S]*?\n\}\)\(\);/) || [''])[0];
    ok(/hands: hBody\(\)/.test(blk) && /hTake\(r\.hands, pc, hold\)/.test(blk) && /gx\('\/al\/hands'/.test(blk), '다리 알림에 손발 소식을 싣고 · 답의 맡김을 받고 · 결과를 /al/hands로 돌려줌');
    const fetches = blk.match(/fetch\([^)]*\)/g) || []; ok(fetches.length === 1 && /credentials: 'include', cache: 'no-store'/.test(blk) && !/method: 'POST'[^}]*aladin/.test(blk), '알라딘엔 GET fetch 한 길뿐(값 바꾸는 요청 없음)', fetches);
    ok(/s0 && s0\.in === true/.test(blk) && /hold && hold\.on/.test(blk) && /isLogger\(\)/.test(blk), '자리를 쥔 때만 · 출고 중엔 안 읽음 · 로거 크롬은 안 함');
    const RF = AC.READ_FN; const pieces = ["rows: x.rows.map((z) => ({ u: z.usedCode || null, l: z.listingId || null, s: z.status, p: z.price, k: z.sku, g: z.grade, q: z.qty }))", "orders: (x.orders || []).map((o) => ({ o: o.orderNo, it: (o.items || []).map((i) => i.listingId || null), d: o.deliveryNo || null }))", "rows: x.map((z) => ({ q: z.questionId, a: z.answered == null ? null : String(z.answered) }))"];
    ok(pieces.every((p) => RF.includes(p) && blk.includes(p)), '운영 탭 해석 칸 = 번외 READ_FN과 같음(같은 공용 해석 파일 · 번호·상태·값만)'); }

  console.log('① 설정 — HOME만 기본 켬 · 로거 숨김');
  const alcfg = { chkMin: 600, confirmMin: 600, delivMin: 600, listMin: 600, qnaMin: 600, gapA: 100, gapB: 200, cmpWaitMin: 0.5, handsFrontMin: 0.02, handsFrontGapMin: 0.05, handsWinSec: 0.3, handsSec: 3 };
  { const H0 = await L.startHelper({ cfg: { pc: 'JS-MAIN', on: true, y24: false, auto: false, headless: true, al: true, alcfg } });
    try { const rows = (await H0.api('GET', '/settings')).j.rows; const h = rows.find((r) => r.k === 'hands'); ok(h && h.v === false && h.d === false, '다른 PC(JS-MAIN)는 손발 길 기본 꺼짐', h);
      const r = (await H0.api('POST', '/al/feed', { by: 't', seat: { ok: true }, hands: { v: 1, login: true } })).j; ok(r.ok && r.hands && r.hands.on === false && r.al.on === true, '꺼진 PC는 다리 답에 손발 일이 없음(예전 길 그대로)', r.hands); }
    finally { await H0.stop(); } }
  { const H0 = await L.startHelper({ cfg: { pc: 'LOGGER', on: true, y24: false, auto: false, headless: true, alcfg } });
    try { const rows = (await H0.api('GET', '/settings')).j.rows; ok(!rows.some((r) => r.k === 'hands' || r.k === 'handsHide') && rows.some((r) => r.k === 'on'), '로거는 손발 길 칸을 아예 숨김', rows.map((r) => r.k).filter((k) => /hand/.test(k)));
      await H0.api('POST', '/cfg', { hands: true }); const r1 = (await H0.api('POST', '/set', { k: 'hands', v: true })).j; const s = (await H0.api('GET', '/status')).j.al;
      ok(!(s.hands && s.hands.on) && !(r1.out && r1.out[0] && r1.out[0].ok && r1.out[0].v === true), '로거는 켜려 해도 꺼진 채(약속 0)', { r1, h: s.hands });
      const w = await H0.api('POST', '/al/hands/win', { act: 'show' }); ok(w.st === 403, '로거는 평소 크롬 창 다루기도 거절', w.st); }
    finally { await H0.stop(); } }

  console.log('② HOME — 번외 로그인 0 · 자리 안 받음');
  const H = await L.startHelper({ cfg: { pc: 'HOME', on: true, y24: false, auto: false, headless: true, al: true, alOwn: true, alcfg } }); const D = H.D, HOME = D + '/home';
  const st = async () => (await H.api('GET', '/status')).j; const a = async () => (await st()).al;
  let login = true, hold = false, auto = true; const JOBS = [], FRONTS = []; const got = [];
  const answer = (j) => { const k = j.k; if (k === 'chk') return { ok: true, st: 200, sum: { loggedIn: true } };
    if (k === 'list') return { ok: true, st: 200, sum: { page: 1, lastPage: 1, rows: [{ u: 'U000000001', l: '5001', s: '판매중', p: 12000, k: 'BLKCMN-1', g: '상', q: 1, buyer: '손님A' }, { u: 'U000000002', l: '5002', s: '판매중', p: 8000, k: 'BLKCMN-2', g: '최상', q: 1, phone: '010-1234-5678' }] } };
    if (k === 'confirm') return { ok: true, st: 200, sum: { tab: { 주문확인요청: 2, '발송 요청': 1 }, orders: [{ o: '111-A000000001', it: ['5001'], d: null, name: '손님A' }, { o: '111-A000000002', it: ['5002'], d: null, addr: '시험시 시험구 1길' }] } };
    if (k === 'deliv') return { ok: true, st: 200, sum: { tab: { 주문확인요청: 2, '발송 요청': 1 }, orders: [{ o: '111-A000000003', it: ['5003'], d: '123412341234' }] } };
    return { ok: true, st: 200, sum: { rows: [{ q: '9001', a: 'true', title: '책 상태가 궁금해요', who: '손님A' }, { q: '9002', a: 'false' }] } }; };
  /* 가짜 운영 수집기 탭(다리) — 10초 대신 0.3초마다 /al/feed · 맡김이 오면 읽은 셈 치고 /al/hands로 돌려줌 */
  const feed = async () => { const r = (await H.api('POST', '/al/feed', { by: 'HOME', seat: { ok: false, why: '번외 자리 안 받음' }, hold: { on: hold }, hands: { v: 1, login, why: login ? '' : '샵매니저 로그인 화면', work: false, page: 'worders.aspx', ver: '1.89.999', title: true } })).j;
    if (r && r.hands) { if (r.hands.front && !FRONTS.includes(r.hands.front)) FRONTS.push(r.hands.front); for (const j of r.hands.jobs || []) { JOBS.push(j); if (auto) { const d = await H.api('POST', '/al/hands', { by: 'HOME', done: [{ id: j.id, res: login ? answer(j) : { ok: false, login: true, kind: 'login', why: '샵매니저가 로그인 화면으로 감' } }] }); got.push(d.j); } } } return r; };
  let feeding = true; const feeder = setInterval(() => { if (feeding) feed().catch(() => {}); }, 300);
  const handsWin = cp.spawn(process.execPath, ['-e', 'setInterval(()=>{},1e9)', '@hands', D], { stdio: 'ignore' }); /* 가짜 '평소 크롬 손발 창'(가짜 PowerShell은 명령 줄에 @hands와 시험 폴더가 든 프로세스를 창으로 봄) */
  try {
    let r0 = await until(async () => { const r = await feed(); return r && r.hands && r.hands.on ? r : null; }, 40);
    ok(r0 && r0.hands.on === true && r0.al.on === false && r0.al.own === false, 'HOME 기본 켬 — 다리 답 al.on·own 거짓(운영 탭이 번외 자리를 내려놓고·이어받기 끝 · 이 PC 자리 그대로)', r0 && { hands: r0.hands, on: r0.al.on, own: r0.al.own });
    const rows = (await H.api('GET', '/settings')).j.rows; const hr = rows.find((r) => r.k === 'hands'); ok(hr && hr.v === true && hr.d === true, '⚙ 이 PC만 「🖐 알라딘은 평소 크롬을 손발로」 — HOME 기본 켬', hr);
    ok(!(await H.api('POST', '/al/seatcalc', { who: 'HOME~col2', d: {} })).j.ok, '웹앱에 번외 자리를 부탁하지 않음(seatAsk 없음)');
    await wait(1500); ok(!H.T.clog().some((l) => /col2-al-chrome/.test(l)), '번외 알라딘 크롬을 띄우지 않음(새 기기 로그인 시도 0)', H.T.clog().filter((l) => /col2-al/.test(l)));
    const v = await H.api('POST', '/cred/save', { pf: 'al', id: 'seller', pw: 'pw-test-1' }, { Origin: `http://127.0.0.1:${H.port}` }); ok(v.j && !v.j.ok && /손발 길/.test(v.j.err || '') && !H.T.clog().some((l) => /col2-al-chrome/.test(l)), '🔐 계정 확인도 번외 창으로 로그인해 보지 않음(손발 길 까닭을 알림)', v.j && v.j.err);

    console.log('③ 맡김 → 결과 → 견줌 · 손님 정보 없음');
    auto = true; let s = await until(async () => { const x = await a(); return KINDS_OK(x) ? x : null; }, 120);
    function KINDS_OK(x) { return x && x.last && ['chk', 'confirm', 'deliv', 'list', 'qna'].every((k) => x.last[k] && x.last[k].ok); }
    ok(s && JOBS.length >= 5 && JOBS.every((j) => /^h/.test(j.id) && AL.HANDS_KINDS.includes(j.k) && !j.url) && got.every((g) => g && g.ok && g.n === 1), '다섯 가지 읽기를 평소 크롬 탭에 맡김 — 맡김엔 종류·쪽 번호만(주소 없음) · 결과 받음', JOBS.map((j) => j.k));
    ok(s && s.hands.on && s.hands.linked && s.hands.login === true && s.hands.n >= 5 && s.hands.ok >= 5 && /🖐/.test(s.msg), "상태 — '평소 크롬이 손발 · 로그인 ✓ · 맡긴 일 n'", s && { h: s.hands, msg: s.msg });
    const pd = (await H.api('GET', '/relay/pending?by=t')).j; const W = pd.want.map((w) => w.c + '/' + w.id);
    ok(W.includes('prd_listings/aladin_U000000001') && W.includes('shp_state/confirm') && W.includes('crm_interactions/aladin_qna_9001'), '견줄 운영 문서를 웹앱에 부탁(예전 길 그대로)', W);
    await H.api('POST', '/relay/answer', { docs: [{ c: 'prd_listings', id: 'aladin_U000000001', v: { usedCode: 'U000000001', status: '판매중', price: 12000, sku: 'BLKCMN-1', grade: '상', qty: 1 } }, { c: 'prd_listings', id: 'aladin_U000000002', v: { usedCode: 'U000000002', status: '판매중', price: 8000, sku: 'BLKCMN-2', grade: '최상', qty: 1 } },
      { c: 'shp_state', id: 'confirm', v: { at: new Date().toISOString(), tabCounts: { 주문확인요청: 2, '발송 요청': 1 }, orders: [{ orderNo: '111-A000000001', items: [{ listingId: '5001' }] }, { orderNo: '111-A000000002', items: [{ listingId: '5002' }] }] } },
      { c: 'shp_state', id: 'current', v: { at: new Date().toISOString(), tabCounts: { 주문확인요청: 2, '발송 요청': 1 }, orders: [{ orderNo: '111-A000000003', items: [{ listingId: '5003' }], deliveryNo: '123412341234' }] } },
      { c: 'crm_interactions', id: 'aladin_qna_9001', v: { answerStatus: 'true' } }, { c: 'crm_interactions', id: 'aladin_qna_9002', v: { answerStatus: 'false' } }] });
    const outs = await until(async () => { const p = (await H.api('GET', '/relay/pending?by=t')).j; const o2 = p.out.filter((x) => x.c === 'col2_al' && !/^day_/.test(x.id)); return o2.length >= 4 ? p.out : null; }, 120);
    const byK = {}; for (const x of (outs || []).filter((x) => x.c === 'col2_al')) byK[x.v.kind || 'day'] = x.v;
    ok(byK.list && byK.list.verdict === 'same' && byK.confirm && byK.confirm.verdict === 'same' && byK.deliv && byK.deliv.verdict === 'same', '평소 크롬이 읽은 결과도 운영 칸과 칸마다 견줘 col2_al에만', byK.list && { l: byK.list.verdict, c: byK.confirm && byK.confirm.verdict, d: byK.deliv && byK.deliv.verdict, q: byK.qna && byK.qna.verdict });
    const blob = JSON.stringify(outs) + JSON.stringify(await st()); const fh = []; walk(HOME, (f, t) => { if (PII.some((w) => t.includes(w))) fh.push(f); });
    ok(!PII.some((w) => blob.includes(w)) && !fh.length, '손님 이름·전화·주소·문의 글이 결과·상태·도우미 파일 어디에도 없음', fh);
    const pl = (await H.api('GET', '/relay/pending?by=t')).j; const ln = JSON.stringify(pl); ok(/"hands":\{"linked":true/.test(ln) || /🖐/.test(ln), '웹앱 PC 줄(🟧)에도 손발 상태가 실림', ln.slice(0, 0));

    console.log('④ 출고 중 · 답 없음 · 로그인 풀림 → 사람 손');
    hold = true; await wait(900); const j0 = JOBS.length; await H.api('POST', '/al/run', { what: 'confirm' }); await wait(2000); s = await a();
    ok(JOBS.length === j0 && /출고 중/.test(s.msg), '🚚 출고 중엔 평소 크롬 탭에 맡기지 않음(약속 0-1)', s.msg);
    hold = false; auto = false; await wait(3500); /* 출고 중에 기다리던 맡김은 기다림 끝으로 정리됨 */
    await H.api('POST', '/al/run', { what: 'deliv' }); s = await until(async () => { const x = await a(); return x.last.deliv && !x.last.deliv.ok ? x : null; }, 60);
    ok(s && /답하지 않음/.test(s.last.deliv.why || '') && s.hands.fail >= 1, '평소 크롬 탭이 답하지 않으면 기다림 끝 → 실패로 남기고 다음 차례', s && s.last.deliv);
    auto = true; login = false; await wait(400); s = await until(async () => { const x = await a(); return x.hands.login === false && /로그인이 풀림/.test(x.msg || '') ? x : null; }, 60);
    ok(s && /로그인이 풀림/.test(s.msg), "평소 크롬 로그인이 풀리면 맡기지 않고 '운영 수집기가 다시 로그인하는 중'", s && s.msg);
    const fr = await until(async () => (FRONTS.length && H.T.win().acts.some((x) => /^(show|front):@hands$/.test(x)) ? true : null), 60);
    s = await a(); ok(fr && s.hands.todo && /평소 크롬/.test(s.todo || ''), '로그인이 오래 풀리면 🖐 사람 손 필요 — 운영 탭에 앞으로 나오라 알리고(window.focus) 그 창을 앞으로 띄움', { acts: H.T.win().acts.filter((x) => /@hands/.test(x)), todo: s.todo });
    login = true; await wait(900);

    console.log('⑤ 창 — 숨기기·띄우기 · 끄기·닫기 없음');
    let w = (await H.api('POST', '/al/hands/win', { act: 'hide' }, { Origin: `http://127.0.0.1:${H.port}` })).j; const win1 = H.T.win();
    ok(w.ok && win1.acts.includes('hide:@hands') && win1['@hands'] && win1['@hands'].tool && JSON.parse(fs.readFileSync(HOME + '/col2.json', 'utf8')).handsHide === true, '[숨기기] → 평소 크롬 손발 창을 화면 밖으로(늘 숨김 켬)', w.err || w.msg);
    w = (await H.api('POST', '/al/hands/win', { act: 'show' }, { Origin: `http://127.0.0.1:${H.port}` })).j; ok(w.ok && !H.T.win()['@hands'].tool && H.T.win().acts.filter((x) => x === 'show:@hands').length >= 1, '[🖐 띄우기] → 그 창을 앞으로', w.err || w.msg);
    const x403 = await H.api('POST', '/al/hands/win', { act: 'hide' }, { Origin: 'https://example.com' }); ok(x403.st === 403, '다른 출처는 창 다루기 거절', x403.st);
    const lg = await H.api('POST', '/al/login', { why: '시험' }); ok(lg.j.ok && /평소 크롬/.test(lg.j.msg) && !H.T.clog().some((l) => /col2-al-chrome/.test(l)), '[🔐 알라딘 로그인] = 평소 크롬 탭을 앞으로(번외 창 로그인 없음)', lg.j.msg || lg.j.err);
    ok(!H.T.win().acts.some((x) => /^(kill|close):@hands$/.test(x)), '평소 크롬은 한 번도 끄거나 닫지 않음', H.T.win().acts.filter((x) => /@hands/.test(x)));
    const ui = (await H.req('GET', '/s/col2-ui.js')).b; ok(/평소 크롬이 손발 · 로그인 ✓/.test(ui) && /맡긴 일/.test(ui) && /\/al\/hands\/win/.test(ui), '옆 창 🟧 알라딘 카드에 「🖐 평소 크롬이 손발 · 로그인 ✓ · 맡긴 일 n」과 [🖐 띄우기]·[숨기기]');

    console.log('⑥ 끄면 예전 길');
    await H.api('POST', '/set', { k: 'hands', v: false }); const r2 = await until(async () => { const r = await feed(); return r && r.hands && r.hands.on === false ? r : null; }, 30);
    ok(r2 && r2.al.on === true && r2.al.own === true, '손발 길을 끄면 다리 답이 예전대로(번외 읽기 켬 · 🏠 이어받기 켜 둔 값이 다시 살아남)', r2 && { on: r2.al.on, own: r2.al.own });
  } finally { feeding = false; clearInterval(feeder); try { handsWin.kill('SIGKILL'); } catch (e) {} await H.stop(); }
  L.done();
})().catch((e) => { console.error(e); process.exit(1); });
