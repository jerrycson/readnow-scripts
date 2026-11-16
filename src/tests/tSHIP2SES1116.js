// tSHIP2SES1116 — 정범님 11/16 15:28 (11/15 두 세션 — 둘째 세션 재검토가 하루 카드·③에 안 보임) · shipaudit 출고 두 세션 재검토 · 전반 점검
//  A 하루 두 세션 — 둘째 세션 맡김을 다른 길이 먼저 만들어 os·batch가 비어도(ALPS 일 id로 짝지음) 카드에 '오늘 2세션' 두 줄 · 둘째 줄에 재검토 이상
//  B 맡김↔세션 짝짓기 세 길(runId · 문서 id alps_<id> · 묶음이 지켜보는 invDoc)
//  C 맡김을 만들었다고 적힌 세션인데 기록이 목록에 없으면 🟠 기록 누락(목록이 꽉 찼으면 누락이라 하지 않음)
//  D 송장 중복 🔴 — 같은 주문에 송장 둘 · 받는 분이 다른 주문들에 같은 송장(합포장 = 같은 받는 분은 정상) · 받는 분 이름은 화면에 안 냄
//  E 자정 넘김 — 어제 시작한 원스톱이 아직 돌면 '자정을 넘겨 아직 진행 중'(끝 ✅을 먼저 띄우지 않음)
//  F ③ '오늘 다른 송장 입력' 줄에 세션 이름표
//  G 맡김 목록 비교값에 재검토 상태·개수·확인·세션(바뀌면 출고 화면을 다시 그림)
//  H 끝난 세션의 ALPS 일 → 맡김에 세션 이름표만(담당권 확인 없음 · 맡김이 만들어짐) · 담당권 없는 탭이 os로 맡기면 막힘(#5)
//  I 둘째 세션이 남의 맡김에 이름표를 채우는 쓰기도 담당권 트랜잭션 안(#5)
//  J 출고 단계 탭 4묶음 — data-stab 차례 그대로 · 360px 폭에서 화면 가로 넘침 없음
// 시험 자료 손님은 '손님A'… (공개 저장소) · 쓰는 법: RN_PORT=<포트> node tSHIP2SES1116.js
let bad = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) bad++; };
const fs = require('fs'), path = require('path');
const appP = [path.join(__dirname, '..', 'app.html'), path.join(__dirname, 'app.html'), path.join(__dirname, '..', 'src', 'app.html')].find((f) => fs.existsSync(f));
const app = appP ? fs.readFileSync(appP, 'utf8') : '';
ok(!!app, '웹앱 원본을 찾음: ' + (appP || '없음'));
// G — 맡김 목록 비교값(정적)
{ const f = (app.match(/function loadInvBatch\(\)[^\n]*/) || [''])[0];
  ok(/B\.os \|\| ''/.test(f) && /B\.rck \? \[B\.rck\.state, B\.rck\.okN, \(B\.rck\.bad \|\| \[\]\)\.length\]/.test(f) && /Object\.keys\(B\.rckAck \|\| \{\}\)\.length/.test(f), 'G 맡김 목록 비교값에 세션·재검토 상태·이상 수·확인 수가 들어 있음'); }
// I — 이름표 채우기 쓰기가 담당권 트랜잭션 안(정적)
{ const L = app.split('\n').filter((l) => /osLate:/.test(l));
  ok(L.length === 1 && /await osOwnedWrite\(r\.id, async \(run, tx\) =>[\s\S]*tx\.get\(iref\)[\s\S]*if \(!cur\.os\) tx\.set\(iref,[\s\S]*osLate:/.test(L[0]) && !/iref\.set\(|\.doc\(hold\.id\)\.set\(/.test(L[0]) && /e\.code === 'os-owner-changed'\) throw e/.test(L[0]), 'I 둘째 세션 이름표 채우기 = osOwnedWrite 트랜잭션 안에서만 · 담당권을 잃으면 그대로 멈춤');
  const a = (app.match(/async function alpsInvAuto\([^\n]*\n(?:[^\n]*\n){0,6}/) || [''])[0];
  ok(/o\.os \? \{ os: o\.os \} : o\.osTag \? \{ os: String\(o\.osTag\) \} : \{\}/.test(a) && /if \(o\.os\) \{ const lease = /.test(a), 'I 맡김 만들기 — os(원스톱 담당권 확인)와 osTag(이름표만)를 나눔'); }
const H = require('./harness.js');
H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; window.ask = async () => true; S.user = S.user || { email: 'tester@x' };
    const day = osDay(), now = new Date().toISOString(); const yd = new Date(Date.parse(alpsTd() + 'T12:00:00+09:00') - 864e5 + 9 * 3600e3).toISOString().slice(0, 10).replace(/-/g, '');
    const keep = { runs: S.os.runs, runsDay: S.os.runsDay, runsUn: S.os.runsUn, doc: S.os.doc, invBs: S.invBs, invL: S._invL, lease: S.os.lease, pl: S.os.phaseLease };
    const setDay = (runs, docs, doc) => { S.os.runsDay = day; S.os.runsUn = () => {}; S.os.runs = runs; S.os.doc = doc || null; S._invL = true; S.invBs = docs; S._rckM = null; };
    const it = (orderNo, invoice, recipient, state) => ({ orderNo, invoice, recipient, state: state || 'done' });
    const run = (n, st, bt) => ({ id: `${day}_${n}`, n, day, status: st, createdAt: now, ph: st === 'done' ? 'DONE' : 'INV', bt });
    const txt = (h) => { const d = document.createElement('div'); d.innerHTML = h; return d.textContent.replace(/\s+/g, ' '); };
    // A — 두 세션 · 둘째 맡김은 다른 길이 먼저 만들어 os·batch 없음(ALPS 일 id runId로만 짝)
    const r1 = run(1, 'done', [{ alpsId: 'AJ1', al: ['A-1', 'A-2'], n: 1, invDoc: 'alps_AJ1', invAsk: 'made', alps: { printed: 2, boxes: 2 } }]);
    const r2 = run(2, 'done', [{ alpsId: 'AJ2', alpsIds: ['AJ2'], al: ['A-3'], n: 1, invDoc: 'alps_AJ2', invAsk: 'dup', alps: { printed: 1, boxes: 1 } }]);
    const B1 = { id: 'alps_AJ1', os: r1.id, runId: 'AJ1', createdAt: now, status: 'done', items: [it('A-1', '111100001111', '손님A'), it('A-2', '111100002222', '손님B')], rck: { state: 'done', okN: 2, bad: [] } };
    const B2 = { id: 'alps_AJ2', runId: 'AJ2', createdAt: now, status: 'done', items: [it('A-3', '111100003333', '손님C')], rck: { state: 'done', okN: 0, bad: [{ o: 'A-3', v: 'bad' }] } };
    setDay([r1, r2], [B1, B2]); { const D = osDaySum(); const h = osDayCardHtml('home'); const t = txt(h);
      o.A = { docs: D && D.docs, ses: D && D.ses.map((x) => x.st), sesN: (h.match(/data-ses="\d+"/) || [''])[0], rows: (h.match(/<div data-ses="/g) || []).length, two: /오늘 2세션/.test(t), chk: /마무리 점검/.test(t), tot: D && [D.done, D.tot] }; }
    // B — 짝짓기 세 길
    o.B = [osRunOfInv({ id: 'x1', runId: 'AJ2' }, [r1, r2]), osRunOfInv({ id: 'alps_AJ2' }, [r1, r2]), osRunOfInv({ id: 'man_9' }, [r1, { ...r2, bt: [{ invDoc: 'man_9', al: ['A-3'] }] }]), osRunOfInv({ id: 'x2', runId: 'ZZ' }, [r1, r2])].map((r) => (r ? r.n : null));
    // C — 기록 누락 🟠(목록이 꽉 차지 않음) · 꽉 찼으면 누락이라 하지 않음
    const r3 = run(3, 'done', [{ alpsId: 'AJ3', al: ['A-4'], n: 1, invDoc: 'alps_AJ3', invAsk: 'made', alps: { printed: 1, boxes: 1 } }]);
    const B2ok = { ...B2, rck: { state: 'done', okN: 1, bad: [] } };
    setDay([r1, r2, r3], [B1, B2ok]); { const D = osDaySum(); const t = txt(osDayCardHtml('home')); o.C = { lost: D.lost.map((x) => x.no), st3: D.ses[2].st, card: /🟠 송장 입력 기록을 못 찾은 세션 #3/.test(t), chk: /☐ 기록 누락 1/.test(t) }; }
    const filler = Array.from({ length: INV_LIST_N - 2 }, (_, i) => ({ id: 'old_' + i, createdAt: new Date(Date.now() - 30 * 3600e3).toISOString(), status: 'done', items: [] }));
    setDay([r1, r2, r3], [B1, B2ok, ...filler]); { const D = osDaySum(); o.Cfull = D.lost.length; }
    setDay([r1, r2], [B1, B2ok]); { const D = osDaySum(); const t = txt(osDayCardHtml('home')); o.Cok = { lost: D.lost.length, end: /✅ 오늘 출고 확실히 끝/.test(t), ses: D.ses.map((x) => x.st) }; }
    // D — 송장 중복
    const r4 = run(4, 'done', [{ alpsId: 'AJ4', al: ['A-1', 'A-5', 'A-6', 'A-7', 'A-8'], n: 1, invDoc: 'alps_AJ4', invAsk: 'made', alps: { printed: 4, boxes: 4 } }]);
    const B4 = { id: 'alps_AJ4', os: r4.id, runId: 'AJ4', createdAt: now, status: 'done', items: [it('A-1', '9999-0000-1111', '손님A'), it('A-5', '555500005555', '손님E'), it('A-6', '555500005555', '손님F'), it('A-7', '777700007777', '손님G'), it('A-8', '777700007777', '손님 G')], rck: { state: 'done', okN: 5, bad: [] } };
    setDay([r1, r4], [B1, B4]); { const D = osDaySum(); const h = osDayCardHtml('home'); const t = txt(h); o.D = { o2: D.dup.o2, i2: D.dup.i2.map((x) => x.iv + ':' + x.os.join('/')), n: D.dup.n, card: /🔴 송장 중복 의심 2건/.test(t), k: (h.match(/data-k="(\w+)"/) || [])[1], pii: /손님/.test(h) }; }
    o.D0 = osInvDupCheck([{ items: [it('A-1', '1', '손님A'), it('A-2', '2', '손님B'), it('A-3', '1', '손님A', 'fail')] }]).n;
    // E — 자정 넘김
    setDay([], [], { id: `${yd}_3`, n: 3, day: yd, status: 'run', ph: 'INV', createdAt: now, bt: [{ alpsId: 'AJ9', al: ['A-9'] }] }); { const D = osDaySum(); const t = txt(osDayCardHtml('home')); o.E = { carry: !!(D && D.carry), run: /자정을 넘겨 아직 진행 중/.test(t), notEnd: !/확실히 끝/.test(t), noChk: !/마무리 점검/.test(t) }; }
    setDay([], [], { id: `${yd}_3`, n: 3, day: yd, status: 'done', ph: 'DONE', createdAt: now, bt: [] }); o.E2 = osDaySum();
    // F — ③ 다른 송장 입력 줄에 세션 이름표
    setDay([r1, r2], [B1, B2]); { const h = invOthHtml(B1); o.F = { oth: /오늘 다른 송장 입력 1개/.test(txt(h)), tag: /🚚 세션 #2/.test(h), tag1: invSesTag(B1), none: invSesTag({ id: 'zz', runId: 'nope' }) }; }
    // H — 끝난 세션 ALPS 일 → 이름표만 · 담당권 없는 os 맡김은 막힘
    const r5 = run(5, 'done', [{ alpsId: 'AJ5', alpsIds: ['AJ5'], al: ['A-10'], n: 2 }]); const r6 = run(6, 'run', [{ alpsId: 'AJ6', al: ['A-11'], n: 1 }]);
    setDay([r5, r6], []); S.os.lease = null; S.os.phaseLease = null;
    const ow5 = osAlpsOwner('AJ5'), ow6 = osAlpsOwner('AJ6'); o.H = { live5: ow5 && ow5.live, tag5: ow5 && ow5.o.osTag, os5: ow5 && 'os' in ow5.o, live6: ow6 && ow6.live, none: osAlpsOwner('ZZZ') };
    const M = (no, iv) => ({ byOrder: [{ orderNo: no, invoice: iv, recipient: '손님H', status: 'ok' }] });
    try { o.H.made = await alpsInvAuto(M('A-10', '101010101010'), 'x.csv', 'AJ5', { ...ow5.o, force: true }); } catch (e) { o.H.made = 'ERR ' + (e.code || e.message); }
    const d5 = (await db.collection('shp_invoices').doc('alps_AJ5').get()).data() || {}; o.H.doc = { os: d5.os, from: d5.from, batch: (d5.batch || []).join(), n: d5.batchN, items: (d5.items || []).length };
    try { o.H.lease = await alpsInvAuto(M('A-12', '121212121212'), 'y.csv', 'AJ7', { force: true, os: r5.id }); } catch (e) { o.H.lease = 'THROW ' + (e.code || e.message); }
    o.H.lease7 = (await db.collection('shp_invoices').doc('alps_AJ7').get()).exists;
    // J — 출고 단계 탭(넓은 화면) · 카드에 두 세션이 보이게 A 상태로
    setDay([r1, r2], [B1, B2]); S.shipTab = 'deliv'; S._shipRowsC = null; await openShip(); await W(700);
    const sh = () => document.getElementById('sheet'); const tabs = () => [...sh().querySelectorAll('.shp-tabs [data-stab]')].map((b) => b.dataset.stab);
    const grp = () => [...sh().querySelectorAll('.shp-tabs .shp-tg')].map((g) => g.dataset.tg + ':' + [...g.querySelectorAll('[data-stab]')].map((b) => b.dataset.stab).join('/') + (g.querySelector('.shp-tgh') ? '' : '(머리 없음)'));
    o.J = { tabs: tabs(), grp: grp(), card: !!sh().querySelector('#osday_ship .osday-ses') };
    o.keep = keep; return o; });
  // 360px — 같은 화면을 폰 폭으로
  await p.setViewportSize({ width: 360, height: 800 }); await p.waitForTimeout(400);
  const R2 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); S.shipTab = 'deliv'; S._shipRowsC = null; await openShip(); await W(700); const sh = document.getElementById('sheet'); const vw = document.documentElement.clientWidth;
    const over = [...sh.querySelectorAll('.shp-tabs, .shp-tg, #osday_ship, .osday-ses, .osday-chk, .shp-srcs')].map((e) => { const r = e.getBoundingClientRect(); return { c: e.className || e.id, l: Math.round(r.left), r: Math.round(r.right) }; }).filter((x) => x.c && !/shp-tg\b|shp-tg /.test(x.c) && (x.l < -1 || x.r > vw + 1));
    const bar = sh.querySelector('.shp-tabs'); const bs = bar ? getComputedStyle(bar).overflowX : '';
    return { vw, docW: document.documentElement.scrollWidth, bodyW: document.body.scrollWidth, shW: sh.scrollWidth, shC: sh.clientWidth, over, bs, tabs: [...sh.querySelectorAll('.shp-tabs [data-stab]')].map((b) => b.dataset.stab), tgh: [...sh.querySelectorAll('.shp-tgh')].map((x) => getComputedStyle(x).display !== 'none').length };
  });
  console.log(JSON.stringify(R).slice(0, 1600)); console.log(JSON.stringify(R2).slice(0, 700));
  ok(R.A.docs === 2 && R.A.ses.length === 2 && R.A.sesN === 'data-ses="2"' && R.A.rows === 2 && R.A.two, 'A 두 세션 — 둘째 맡김(os·batch 없음)도 카드에 · 세션마다 한 줄: ' + JSON.stringify(R.A));
  ok(/재검토 2건 이상 없음/.test(R.A.ses[0] || '') && /재검토 이상 1/.test(R.A.ses[1] || '') && R.A.tot.join() === '3,3' && R.A.chk, 'A 첫 세션 ✅ 재검토 이상 없음 · 둘째 세션 🔴 재검토 이상 · 송장 입력 3/3 · 마무리 점검표: ' + R.A.ses.join(' | '));
  ok(R.B.join() === '2,2,2,', 'B 짝짓기 — runId · 문서 id alps_<id> · invDoc 세 길 모두 둘째 세션 · 모르는 것은 없음: ' + R.B.join());
  ok(R.C.lost.join() === '3' && /기록을 못 찾음/.test(R.C.st3) && R.C.card && R.C.chk, 'C 맡김을 만들었다는 세션인데 기록 없음 → 🟠 기록 누락 #3: ' + JSON.stringify(R.C));
  ok(R.Cfull === 0, 'C 맡김 목록이 꽉 찼으면(오래된 것이 밀려났을 수 있음) 누락이라 하지 않음: ' + R.Cfull);
  ok(R.Cok.lost === 0 && R.Cok.end, 'C 둘 다 끝나고 재검토도 이상 없으면 ✅ 오늘 출고 확실히 끝: ' + JSON.stringify(R.Cok));
  ok(R.D.o2.join() === 'A-1' && R.D.i2.join() === '555500005555:A-5/A-6' && R.D.n === 2 && R.D.card && R.D.k === 'bad', 'D 송장 중복 🔴 — 같은 주문에 송장 둘 · 받는 분이 다른 주문들에 같은 송장 · 합포장(같은 받는 분)은 정상: ' + JSON.stringify(R.D));
  ok(!R.D.pii, 'D 카드에 받는 분 이름이 나오지 않음');
  ok(R.D0 === 0, 'D 중복 없음 · 실패한 줄은 견주지 않음: ' + R.D0);
  ok(R.E.carry && R.E.run && R.E.notEnd && R.E.noChk, 'E 어제 시작한 원스톱이 아직 돌면 자정을 넘겨 진행 중(끝 ✅·마무리 점검 없음): ' + JSON.stringify(R.E));
  ok(R.E2 === null, 'E 어제 원스톱이 끝났고 오늘 세션이 없으면 오늘 카드 없음: ' + JSON.stringify(R.E2));
  ok(R.F.oth && R.F.tag && /세션 #1/.test(R.F.tag1) && R.F.none === '', 'F ③ 오늘 다른 송장 입력 줄에 🚚 세션 이름표: ' + JSON.stringify(R.F));
  ok(R.H.live5 === false && R.H.tag5 && R.H.os5 === false && R.H.live6 === true && R.H.none === null, 'H 끝난 세션 → 이름표(osTag)만 · 도는 세션은 live: ' + JSON.stringify(R.H));
  ok(R.H.made === 'made' && R.H.doc.os && /_5$/.test(R.H.doc.os) && R.H.doc.from === 'alps-auto' && R.H.doc.batch === 'A-10' && R.H.doc.n === 2 && R.H.doc.items === 1, 'H 끝난 세션 ALPS 일 → 맡김이 만들어지고 세션 이름표·묶음이 붙음(담당권 확인으로 막히지 않음): ' + R.H.made + ' ' + JSON.stringify(R.H.doc));
  ok(/^THROW os-owner-changed/.test(String(R.H.lease)) && R.H.lease7 === false, 'H 담당권 없는 탭이 os로 맡기면 막히고 맡김이 안 생김(#5): ' + R.H.lease + ' · ' + R.H.lease7);
  const want = ['confirm', 'deliv', 'out', 'printed', 'sending', 'done', 'exc', 'all', 'sales'];
  ok(R.J.tabs.join() === want.join(), 'J 단계 탭 차례 그대로: ' + R.J.tabs.join());
  ok(R.J.grp.join(' ') === 'prep:confirm/deliv/out inv:printed/sending end:done look:exc/all/sales', 'J 네 묶음(① 준비 › ② 송장 › ③ 끝 · 살펴보기) · 묶음마다 머리 이름: ' + R.J.grp.join(' '));
  ok(R.J.card, 'J 출고 화면 하루 카드에도 세션마다 한 줄');
  ok(R2.tabs.join() === want.join() && R2.tgh === 4, 'J 360px — 탭 차례 같음 · 묶음 머리 넷 보임: ' + R2.tabs.join() + ' · ' + R2.tgh);
  ok(R2.docW <= R2.vw + 1 && R2.bodyW <= R2.vw + 1, `J 360px — 화면 가로 넘침 없음(문서 ${R2.docW} · 본문 ${R2.bodyW} / ${R2.vw})`);
  ok(R2.shW <= R2.shC + 1, `J 360px — 출고 창 안 가로 넘침 없음(${R2.shW} / ${R2.shC})`);
  ok(!R2.over.length && R2.bs === 'auto', 'J 360px — 탭 줄·하루 카드·판매처 칩이 화면 밖으로 안 나감(탭 줄은 안에서 옆으로 밀기): ' + JSON.stringify(R2.over) + ' · ' + R2.bs);
  console.log(bad ? `❌ tSHIP2SES1116 실패 ${bad}` : '✓ tSHIP2SES1116 통과'); process.exitCode = bad ? 1 : 0; }, {});
