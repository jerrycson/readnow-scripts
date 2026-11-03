// tLOST — 정범님 11/03: 🔎 소재불명 페이지 — lostAdd 중복 없음 · 판매중지 맡김 한 번(여러 권 = 수량 −1 · 이미 판매중지 = 건너뜀 · 등록 상품 = 기록만) · 상품 상세 단추(두 번)
//   · 수색 기록지 저장/문구 단추 · 수색 지도 색 · 고치면 이전 값 남김 · 단서 더하기/제외 · 가설 · 다음에 볼 곳 · 이웃 책 · 발견/종결/되돌리기 · 오래된 사건 · 휴대폰 · 링크 위치(📝 등록 노트 옆 · 기능 찾기 · 휴대폰 고르기)
// 쓰는 법: RN_PORT=<포트> node tLOST.js
let bad = 0, ran = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const H = require('./harness.js');
H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; const FS = window.__FS; window.ask = async () => true; window.prompt = () => '여러 번 찾아도 없음';
    const LO = () => ((FS.prd_system || {}).lost || {}); const PG = (cid) => ((FS.prd_system || {})['lost_c_' + cid] || {}); const cmds = () => Object.values(FS.shp_cmds || {}).filter((c) => c.type === 'prdEdit' && c.op !== 'read');
    const sh = document.getElementById('sheet'); const A = [...S.plist.values()]; const day = '2026-10-20';
    // 같은 날 같은 관리코드로 등록한 책 다섯 권(이웃 책) — A[0]이 가운데
    const nbL = [A[5], A[6], A[0], A[7], A[8]]; nbL.forEach((l, i) => { l.sku = 'BLKCMN_ms'; l.registeredAt = `${day}T10:0${i}:00`; l.status = '판매중'; l.active = true; l.qty = 1; }); A[0].qty = 1;
    const L0 = A[0]; const Lq = A[1]; Lq.qty = 2; Lq.status = '판매중'; Lq.active = true; Lq.sku = 'GRNSTD'; const Ls = A[2]; Ls.status = '판매중지'; Ls.sku = 'YLWNOT';
    // ── ① 링크 위치: 상품 탭 첫 화면 '🏷 알라딘 매입' 아래 줄 📝 등록 노트 바로 옆 · 기능 찾기 · 휴대폰 고르기
    S.detail = null; sh.classList.remove('on'); S.tab = 'products'; S.q = ''; renderTabs(); renderMainNow(); await W(500); const lb = document.getElementById('lostbtn'); out.btn = !!lb; out.btnPrev = lb && lb.previousElementSibling ? lb.previousElementSibling.id : null; out.btnBar = lb ? lb.parentElement.className : null;
    const bb = document.getElementById('bbuybtn'); out.bbuyAbove = !!(bb && lb && (bb.compareDocumentPosition(lb) & Node.DOCUMENT_POSITION_FOLLOWING));
    const fi = FEAT.findIndex((f) => /소재불명/.test(f.t)); out.feat = fi >= 0 && /매입 품목 휴지통/.test((FEAT[fi + 1] || {}).t || ''); out.ptsec = PT_SECS.some((x) => x[0] === 'pt_lost'); out.rgen = JSON.stringify(rgenData()).includes('dup-lost');
    // ── ② lostAdd: 처음 → 사건 + 판매중지 맡김 한 번 · 같은 key 다시 → 출처만 · 다른 key라도 같은 SKU → 출처만
    const pe0 = cmds().length; const e0 = { key: L0.usedCode, kind: 'al', title: L0.title, isbn13: L0.isbn13, sku: L0.sku, skus: ['k0001'], grade: L0.grade, price: L0.price, from: 'bbuy', at: new Date().toISOString(), by: 'bbuy@x' };
    const r1 = await lostAdd(e0); await W(300); const r2 = await lostAdd({ ...e0, from: 'prod' }); await W(300); const r3 = await lostAdd({ ...e0, key: 'OTHER_KEY', skus: ['RNk0001'], from: 'batch' }); await W(300);
    const cid = r1.cid; out.add = { n: Object.keys(LO().cases || {}).length, same: r2.cid === cid && r3.cid === cid, isNew: [r1.isNew, r2.isNew, r3.isNew], src: Object.keys((LO().cases[cid] || {}).src || {}).length, stop: (LO().cases[cid].stop || {}).how, pe: cmds().slice(pe0).map((c) => JSON.stringify(c.ch)), reason: (S.stopR.get(L0.id) || {}).reason, nb: ((LO().cases[cid].nb || {}).L || []).length };
    // 여러 권 매물 → 수량 −1 · 이미 판매중지 → 건너뜀 · 등록 상품 → 기록만
    const pe1 = cmds().length; const rq = await lostAdd({ key: Lq.usedCode + '~q0002', kind: 'al', title: Lq.title, skus: ['q0002'], from: 'bbuy' }); await W(300); const rs = await lostAdd({ key: Ls.usedCode, kind: 'al', title: Ls.title, skus: [], from: 'bbuy' }); const rg = await lostAdd({ key: 'REG_x77', kind: 'reg', title: '등록 상품', skus: ['g0001'], from: 'bbuy' }); await W(300);
    out.kinds = { q: rq.stop && rq.stop.how, qch: cmds().slice(pe1).map((c) => JSON.stringify({ ...c.ch, qtyAdd: c.qtyAdd })), s: rs.stop && rs.stop.how, g: rg.stop && rg.stop.how };
    const pe2 = cmds().length; await lostAdd({ ...e0, from: 'again' }); await W(200); await lostStop(cid); await W(200); out.once = cmds().length - pe2;
    // ── ③ 상품 상세 단추(두 번 누르기)
    S.detail = null; await openProduct(A[3].id); await W(700); let pb = sh.querySelector(`[data-lostpd="${A[3].id}"]`); out.pdBtn = !!pb; if (pb) { pb.click(); await W(100); out.pdArm = pb.textContent; pb.click(); await W(900); } out.pdCase = lostCases().some((c) => c.key === A[3].usedCode); out.pdAfter = (sh.querySelector('.lo-pd') || {}).textContent;
    // ── ④ 목록·사건 화면
    S.detail = null; sh.classList.remove('on'); openLost(); await W(700); out.listN = sh.querySelectorAll('.lo-row').length; out.listTxt = (sh.querySelector('.lo-sum') || {}).textContent;
    sh.querySelector(`.lo-row[data-locase="${cid}"]`).click(); await W(900); out.caseOpen = !!(S.detail && S.detail.lcid === cid) && !!sh.querySelector('#lo_form');
    out.dossier = (sh.querySelector('.lo-dos') || {}).innerText; out.next = [...sh.querySelectorAll('.lo-nx')].map((x) => x.innerText.replace(/\s+/g, ' ')); out.nbRows = sh.querySelectorAll('.lo-nbr').length; out.nbMe = !!sh.querySelector('.lo-nbr.me');
    // 기록지: 서가·책장·칸·사이·방법·결과·문구 단추
    const clk = async (sel) => { const el = sh.querySelector(sel); if (!el) throw new Error('없음 ' + sel + ' · 화면: ' + JSON.stringify(S.detail) + ' ' + sh.innerText.slice(0, 200).replace(/\s+/g, ' ')); el.click(); await W(150); if (S.detail && S.detail.lost && !sh.querySelector('.lo-stat,.lo-sum')) throw new Error('화면이 바뀜 — 누른 것 ' + sel); };
    await clk('[data-loshelf="BLKCMN"]'); await clk('[data-lostep="bay"][data-d="1"]'); await clk('[data-lohow="tw"]'); await clk('[data-lohow="spine"]');
    const ia = sh.querySelector('[data-lofld="betA"]'); ia.value = A[6].title.slice(0, 12); ia.dispatchEvent(new Event('input', { bubbles: true })); ia.blur();
    await clk('[data-lores="none"]'); await clk('.phx[data-phx="lost"] [data-phtog]'); const pbt = sh.querySelector('.phx[data-phx="lost"] .phx-b'); out.phTxt = pbt ? pbt.textContent : null; if (pbt) { pbt.click(); await W(150); }
    await clk('[data-lomin="10"]'); await clk('[data-losave]'); await W(600);
    const P1 = () => PG(cid).logs || []; out.log1 = P1()[0] ? { shelf: P1()[0].shelf, bay: P1()[0].bay, row: P1()[0].row, res: P1()[0].res, how: P1()[0].how.join(','), ph: (P1()[0].ph || []).join(','), mins: P1()[0].mins, betA: P1()[0].betA, at: !!P1()[0].at } : null; out.sum1 = { nS: LO().cases[cid].nS, mins: LO().cases[cid].mins, lastRes: LO().cases[cid].lastRes };
    // 같은 칸 한 번 더(없음) → 진하게 · 옆 칸 '의심' → 보라 · 지도 칸 누르면 기록지에 그 자리
    Object.assign(S.lostF[cid], { bay: 2, row: 1, res: 'none' }); lostRenderForce(); await W(200); await clk('[data-losave]'); await W(500);
    Object.assign(S.lostF[cid], { bay: 3, row: 2, res: 'sus' }); lostRenderForce(); await W(200); await clk('[data-losave]'); await W(600);
    const cell = (b, rw) => (sh.querySelector(`[data-locell="BLKCMN|${b}|${rw}"]`) || {}).className || ''; out.grid = { c21: cell(2, 1), c32: cell(3, 2), c11: cell(1, 1), c55: cell(5, 5) };
    await clk('[data-locell="BLKCMN|4|5"]'); out.cellFill = [S.lostF[cid].shelf, S.lostF[cid].bay, S.lostF[cid].row].join('|');
    out.nextSus = [...sh.querySelectorAll('.lo-nx')].map((x) => x.innerText.replace(/\s+/g, ' ')).join(' / ');
    // 문구 모음 저장(모든 기기 같음) — ✎ 문구 고치기 → ＋ 블록 → 💾
    if (!sh.querySelector('.phx[data-phx="lost"].open')) await clk('.phx[data-phx="lost"] [data-phtog]'); await W(100); const pe = sh.querySelector('.phx[data-phx="lost"] [data-phedit]'); if (pe) { pe.click(); await W(150); sh.querySelector('.phx[data-phx="lost"] [data-phadd]').click(); await W(150); const ins = [...sh.querySelectorAll('.phx[data-phx="lost"] [data-phin]')]; const last = ins[ins.length - 1]; last.value = '사다리로 맨 위 칸까지'; last.dispatchEvent(new Event('input', { bubbles: true })); sh.querySelector('.phx[data-phx="lost"] [data-phsave]').click(); await W(500); }
    out.phSaved = (((FS.app_settings || {}).phrases_lost || {}).items || []).some((x) => x.t === '사다리로 맨 위 칸까지');
    // 고치기 — 이전 값 남김
    lostRenderForce(); await W(300); const eb = sh.querySelector('[data-loedit="1|0"]'); out.editBtn = !!eb; if (eb) { eb.click(); await W(200); const er = sh.querySelector('[data-lofld="ed_res"]'); er.value = 'sus'; await clk('[data-loedsave]'); await W(600); }
    out.edited = P1()[0] ? { res: P1()[0].res, prev: (P1()[0].prev || []).map((x) => JSON.stringify(x.v)).join(' ') } : null;
    // 단서: 더하기 · 제외 · 써 봄 횟수
    lostRenderForce(); await W(300); sh.querySelector('#lo_ck').value = 'color'; sh.querySelector('#lo_cv').value = '파란 책등'; await clk('[data-locladd]'); await W(400);
    const cl = lostClues(cid); out.clue = { add: cl.some((x) => x.kind === 'color' && x.v === '파란 책등'), n: cl.length }; const tw = cl.find((x) => x.kind === 'tw'); await clk(`[data-loclon="${tw.id}"]`); await W(400); out.clueOff = lostClues(cid).find((x) => x.id === tw.id).on === false && !!(PG(cid).clues || {})[tw.id];
    // 가설
    await clk('[data-lohyp="box_ret"][data-v="hot"]'); await W(300); out.hyp = (PG(cid).hyp || {}).box_ret; out.nextHot = lostNext(cid).some((x) => /반품·검수 상자/.test(x.where) && /유력/.test(x.why));
    // ── ⑤ 발견 → 판매중 복구 → 되돌리기 → 종결 → 되돌리기
    S.peFld && S.peFld.delete(L0.id + ':state'); S.peCmds && S.peCmds.delete(L0.id); const pe3 = cmds().length; lostRenderForce(); await W(200);
    const dbl = async (sel, ms) => { sh.querySelector(sel).click(); await W(100); sh.querySelector(sel).click(); await W(ms || 900); }; /* 사이에 화면이 다시 그려져도 사람처럼 지금 보이는 단추를 누름 */ await dbl('[data-lofound]', 600); out.found = LO().cases[cid].st;
    await dbl('[data-lonext="sell"]', 800); out.sell = cmds().slice(pe3).map((c) => JSON.stringify(c.ch)); out.undone = !!(LO().cases[cid].stop || {}).undone; out.next1 = (LO().cases[cid].found || {}).next;
    S.peFld && S.peFld.delete(L0.id + ':state'); S.peCmds && S.peCmds.delete(L0.id); const pe4 = cmds().length; await dbl('[data-loundo="found"]'); out.undoFound = { st: LO().cases[cid].st, ch: cmds().slice(pe4).map((c) => JSON.stringify(c.ch)) };
    await dbl('[data-loclose]'); out.closed = { st: LO().cases[cid].st, loss: (LO().cases[cid].closed || {}).loss, why: (LO().cases[cid].closed || {}).why, reason: (S.stopR.get(L0.id) || {}).reason };
    await dbl('[data-loundo="closed"]'); out.undoClosed = { st: LO().cases[cid].st, reason: (S.stopR.get(L0.id) || {}).reason };
    out.acts = (PG(cid).acts || []).map((a) => a.act).join(','); out.hist = ((LO().cases[cid].hist) || []).map((h) => h.from + '>' + h.to).join(',');
    // ── ⑥ 오래된 사건 · 설정
    await lostSetCase(rs.cid, { lastAt: new Date(Date.now() - 20 * 864e5).toISOString(), at: new Date(Date.now() - 30 * 864e5).toISOString() }); await W(300); history.back(); await W(600); out.backList = !!(S.detail && S.detail.lost && !S.detail.lcid); lostRenderForce(); await W(300);
    out.stale = { rows: sh.querySelectorAll('.lo-row.stale').length, sub: lostBtnSub() }; const sd = sh.querySelector('[data-locfg="staleDays"]'); sd.value = '40'; sd.dispatchEvent(new Event('change', { bubbles: true })); await W(500); lostRenderForce(); await W(300); out.stale2 = { rows: sh.querySelectorAll('.lo-row.stale').length, cfg: (LO().cfg || {}).staleDays, why: /근거: 없음, 설정으로 바꿈/.test(sh.textContent) };
    // ── ⑦ 직접 넣기
    S.lostP.add = A[9].title.slice(0, 8); lostRenderForce(); await W(300); const ad = sh.querySelector(`[data-loaddl="${A[9].id}"]`); out.addHit = !!ad; if (ad) { ad.click(); await W(100); ad.click(); await W(900); } out.addCase = !!(S.detail && S.detail.lcid) && lostCases().some((c) => c.key === A[9].usedCode);
    // 저장 자리 — prd_system 안(새 컬렉션 없음)
    out.cols = Object.keys(FS).filter((k) => /lost/i.test(k)); out.docs = Object.keys(FS.prd_system || {}).filter((k) => /^lost/.test(k));
    window.__loCid = cid; return out; });
  ran++; console.log(JSON.stringify(r, null, 0).slice(0, 7000));
  ok(r.btn && r.btnPrev === 'regnotebtn' && /sortbar/.test(r.btnBar) && r.bbuyAbove, `링크: 상품 탭 '🏷 알라딘 매입' 아래 줄 📝 등록 노트 바로 옆 (앞 단추 ${r.btnPrev})`);
  ok(r.feat && r.ptsec && r.rgen, '🔍 기능 찾기(🗑 매입 품목 휴지통 바로 위) · 📱 휴대폰 고르기 pt_lost · 📖 등록 백과 항목');
  ok(r.add.n === 1 && r.add.same && r.add.isNew.join() === 'true,false,false' && r.add.src === 3, `lostAdd 중복 없음: 같은 key·같은 SKU(RN 머리 붙어도) → 사건 1개 · 출처 ${r.add.src}`);
  ok(r.add.stop === 'stop' && r.add.pe.length === 1 && /판매중지/.test(r.add.pe[0]) && r.add.reason === 'check', `판매중지 맡김 한 번 ${r.add.pe} · 이유 ${r.add.reason}(판매 끝으로 세지 않음)`);
  ok(r.once === 0, `다시 넣거나 lostStop을 또 불러도 판매중지를 다시 맡기지 않음 (+${r.once})`);
  ok(r.add.nb === 5, `이웃 책 사본(같은 날·같은 관리코드) ${r.add.nb}권을 사건에 남김`);
  ok(r.kinds.q === 'qty' && r.kinds.qch.length === 1 && /"qty":1/.test(r.kinds.qch[0]) && /"qtyAdd":-1/.test(r.kinds.qch[0]) && r.kinds.s === 'already' && r.kinds.g === 'record', `여러 권 → 수량 −1(${r.kinds.qch}) · 이미 판매중지 → ${r.kinds.s} · 등록 상품 → ${r.kinds.g}`);
  ok(r.pdBtn && /한 번 더/.test(r.pdArm || '') && r.pdCase && /수색중/.test(r.pdAfter || ''), `상품 상세 '🔎 소재불명으로'(두 번) → 사건 · 단추가 '${(r.pdAfter || '').trim()}'`);
  ok(r.listN === 5 && r.caseOpen, `목록 ${r.listN}건 · 사건 화면 열림`);
  ok(/ISBN/.test(r.dossier) && /관리코드/.test(r.dossier) && /우리 SKU/.test(r.dossier) && /등록일/.test(r.dossier), '사건 카드: ISBN·관리코드·우리 SKU·등록일');
  ok(r.nbRows === 5 && r.nbMe && r.next.length === 3 && r.next.some((x) => /사이/.test(x)), `이웃 책 ${r.nbRows}줄(이 책 표시) · 다음에 볼 곳 3곳: ${r.next.join(' | ')}`);
  ok(r.log1 && r.log1.shelf === 'BLKCMN' && r.log1.bay === 2 && r.log1.row === 1 && r.log1.res === 'none' && r.log1.how === 'tw,spine' && r.log1.mins === 10 && r.log1.ph && r.log1.betA && r.log1.at, `기록지 저장: ${JSON.stringify(r.log1)}`);
  ok(r.sum1.nS === 1 && r.sum1.mins === 10 && r.sum1.lastRes === 'none', `요약: 수색 ${r.sum1.nS}번 · ${r.sum1.mins}분`);
  ok(/n2/.test(r.grid.c21) && /su/.test(r.grid.c32) && /no/.test(r.grid.c11) && /no/.test(r.grid.c55), `수색 지도 색: 2번 ${r.grid.c21} · 의심 ${r.grid.c32} · 안 함 ${r.grid.c11}`);
  ok(r.cellFill === 'BLKCMN|4|5' && /의심/.test(r.nextSus), `지도 칸 → 기록지 자리 ${r.cellFill} · 의심 칸이 다음에 볼 곳에: ${r.nextSus.slice(0, 120)}`);
  ok(r.phTxt && r.phSaved, `문구 단추로 한 번에(${r.phTxt}) · 문구 모음 저장(app_settings/phrases_lost)`);
  ok(r.editBtn && r.edited && r.edited.res === 'sus' && /"res":"none"/.test(r.edited.prev), `고치기 → 이전 값 남김 ${r.edited && r.edited.prev}`);
  ok(r.clue.add && r.clueOff, '단서 더하기 · 제외(기록 남김)');
  ok(r.hyp === 'hot' && r.nextHot, "가설 '유력' → 다음에 볼 곳에 오름");
  ok(r.found === 'found' && r.sell.length === 1 && /판매중"/.test(r.sell[0]) && r.undone && r.next1 === 'sell', `발견 → 판매중 복구 맡김 ${r.sell}`);
  ok(r.undoFound.st === 'open' && r.undoFound.ch.length === 1 && /판매중지/.test(r.undoFound.ch[0]), `발견 되돌리기 → 다시 수색 · 판매중지 다시 맡김 ${r.undoFound.ch}`);
  ok(r.closed.st === 'closed' && r.closed.loss > 0 && r.closed.reason === 'lost' && r.closed.why, `종결 → 손실 ${r.closed.loss} · 판매중지 이유 ${r.closed.reason}`);
  ok(r.undoClosed.st === 'open' && r.undoClosed.reason === 'check' && /open>found/.test(r.hist) && /closed>open/.test(r.hist), `종결 되돌리기 → 다시 수색 · 이유 ${r.undoClosed.reason} · 상태 기록 ${r.hist}`);
  ok(/add/.test(r.acts) && /stop/.test(r.acts) && /next/.test(r.acts) && /logEdit/.test(r.acts) && /clue/.test(r.acts) && /hyp/.test(r.acts), `사건 기록: ${r.acts}`);
  ok(r.backList && r.stale.rows === 1 && /⏰/.test(r.stale.sub) && r.stale2.rows === 0 && r.stale2.cfg === 40 && r.stale2.why, `오래된 사건 알림 ${r.stale.rows}건 · 설정 40일 → ${r.stale2.rows}건 · '근거: 없음, 설정으로 바꿈'`);
  ok(r.addHit && r.addCase, '＋ 직접 넣기 → 사건 화면');
  ok(r.cols.length === 0 && r.docs.includes('lost') && r.docs.some((d) => /^lost_c_/.test(d)), `저장 = prd_system 안(${r.docs.slice(0, 4).join(', ')}) · 새 컬렉션 없음`);
}).then(() => H(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; window.ask = async () => true; const sh = document.getElementById('sheet'); const l = [...S.plist.values()][0]; l.sku = 'BLKCMN'; l.status = '판매중'; l.active = true; l.qty = 1;
    const x = await lostAdd({ key: l.usedCode, kind: 'al', title: l.title, skus: [], from: 'bbuy' }); await W(300); openLostCase(x.cid); await W(900);
    const fab = sh.querySelector('.lo-fab'); out.fab = fab ? getComputedStyle(fab).display : null; const rb = sh.querySelector('.lo-rb2'); out.rbH = rb ? rb.getBoundingClientRect().height : 0; const st = sh.querySelector('.lo-step button'); out.stepH = st ? st.getBoundingClientRect().height : 0; const sv = sh.querySelector('.lo-save'); out.saveH = sv ? sv.getBoundingClientRect().height : 0;
    out.overflow = document.documentElement.scrollWidth > window.innerWidth + 2 || sh.scrollWidth > sh.clientWidth + 2;
    fab.querySelector('button').click(); await W(500); const f = sh.querySelector('#lo_form').getBoundingClientRect(); out.fabGo = f.top < window.innerHeight && f.bottom > 0;
    sh.querySelector('[data-loshelf="BLKCMN"]').click(); await W(100); sh.querySelector('[data-lores="sus"]').click(); await W(100); sh.querySelector('[data-lotimer]').click(); await W(100); S.lostTimer.t0 -= 7 * 60000; sh.querySelector('[data-lotimer]').click(); await W(100); out.mins = S.lostF[x.cid].mins; sh.querySelector('[data-losave]').click(); await W(600);
    out.saved = (((window.__FS.prd_system || {})['lost_c_' + x.cid] || {}).logs || []).length; return out; });
  ran++; console.log(JSON.stringify(r));
  ok(r.fab === 'flex' && r.rbH >= 48 && r.stepH >= 40 && r.saveH >= 48 && !r.overflow, `📱 휴대폰: 떠 있는 '＋ 수색 기록' · 결과 단추 ${Math.round(r.rbH)}px · ± ${Math.round(r.stepH)}px · 저장 ${Math.round(r.saveH)}px · 가로 넘침 없음`);
  ok(r.fabGo && r.mins === 7 && r.saved === 1, `📱 떠 있는 단추 → 기록지 · ⏱ 타이머 ${r.mins}분 · 저장 ${r.saved}줄`);
}, { vp: { width: 390, height: 844 }, touch: true })).then(() => { if (ran < 2) { bad++; console.log('  ❌ 시험 도중 멈춤(위 ERRORS의 TEST 줄)'); } console.log(bad ? `❌ tLOST 실패 ${bad}` : '✅ tLOST 모두 통과'); });
