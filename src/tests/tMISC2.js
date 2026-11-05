// 🧪 misc2 (정범님 11/05) — ① 머리 📶 유심 갱신 시각·확인 기록 ② 🌙 야간 운영·🖥 기기 운영 보고를 🧭 관리도구로 ③ 📜 김미소책방 매출 문서 PDF → 표(관찰·참고용 · 안쪽 창)
// 시험 자료는 모두 가짜(숫자·이름 지어냄) — 실제 매출·손님 정보 없음
const fs = require('fs'); const path = require('path');
/* ⓪ 수집기 simTick의 유심 확인 기록(브라우저 밖) — 함수만 떼어 가짜 둘레로 돌림 */
const cands = [path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js'), path.join(__dirname, '../readnow-pc-runtime.js'), path.join(__dirname, '../readnow-pc-crm.js'), path.join(__dirname, '../readnow-pc-products.js'), path.join(__dirname, '../readnow-pc-helper.js')];
let colSrc = ''; for (const f of cands) { try { const t = fs.readFileSync(f, 'utf8'); if (t.includes('function simTick(H, b)')) { colSrc = t; break; } } catch (e) {} }
const pc = { found: !!colSrc };
if (colSrc) { const a = colSrc.indexOf('  function simTick(H, b)'); const b = colSrc.indexOf('\n  const budSend = ', a); const body = colSrc.slice(a, b);
  const W = []; const SCHED = { budget: { sim: { cur: 's2', list: { s1: { name: '유심 1', gb: 120 }, s2: { name: '유심 2', gb: 120 } }, done: 'x', seen: null } } };
  const mk = new Function('SCHED', 'AS', 'RA', 'C', 'PC_NAME', 'log', 'helperGet1', 'firebase', 'auth', 'SCHED_REF', 'nowIso', body + '\nreturn simTick;');
  const simTick = mk(SCHED, { simSwitch: () => null }, { saveBudget: async () => {} }, () => ({ doc: () => ({}) }), 'LOGGER', () => {}, () => {}, { firestore: { FieldValue: { arrayUnion: () => ({}) } } }, { currentUser: null }, () => ({ set: async (v, o) => { W.push({ v, o }); } }), () => new Date().toISOString());
  const H = { ok: true, phones: [{ id: 'd1', name: '휴대폰 1', active: true }], tether: { ok: true } };
  simTick(H, null); pc.first = W.length === 1 && W[0].o && W[0].o.merge && W[0].v.budget.sim.seen.sim === 's2' && W[0].v.budget.sim.seen.dev === 'd1' && W[0].v.budget.sim.seen.by === 'LOGGER';
  SCHED.budget.sim.seen = W[0] ? W[0].v.budget.sim.seen : null; simTick(H, null); pc.throttle = W.length === 1; /* 10분 안 · 6시간 안 · 같은 휴대폰 → 다시 안 씀 */ }
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const r = await p.evaluate(async () => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); const o = {}; const now = Date.now(); const iso = (h) => new Date(now - h * 3600e3).toISOString();
    /* ① 📶 유심 */
    const cfg = { budget: { sim: { cur: 's2', list: { s1: { name: '유심 1', gb: 120 }, s2: { name: '유심 2', gb: 120 } }, done: 'q', seen: { at: iso(2), how: '로거 테더링 확인', by: 'LOGGER', dev: 'd1', sim: 's2' } } } };
    window.__FS.prd_system = window.__FS.prd_system || {}; window.__FS.prd_system.autoSched = JSON.parse(JSON.stringify(cfg)); S.auto.cfg = JSON.parse(JSON.stringify(cfg)); S.netLive = null; simChip();
    const hb = document.getElementById('hsim'); const kt = (x) => kTime(x).replace('-', '/'); o.chipTxt = hb.textContent; o.chipDate = hb.textContent.includes(kt(iso(2)) + ' 갱신') && /유심 2/.test(hb.textContent); o.chipCalm = !hb.style.background;
    // 30시간 넘게 확인 없음 → 주황 + 로거 보고를 읽어 봄 → 새 보고로 기록(웹앱)
    const dk = new Date(now + 9 * 3600e3).toISOString().slice(0, 10); window.__FS.prd_jobs = window.__FS.prd_jobs || {}; const nAt = new Date(now - 60e3).toISOString();
    window.__FS.prd_jobs['net_' + dk] = { day: dk, pcs: { LOGGER: { route: 'tether', at: nAt, helper: { at: nAt, tetherOk: true, phones: [{ id: 'd1', name: '휴대폰 1', active: true }] } } } };
    S.auto.cfg.budget.sim.seen.at = iso(30); window.__FS.prd_system.autoSched.budget.sim.seen.at = iso(30); S._netLiveAt = 0; S._simChkAt = 0; S._simSeenW = 0; simChip(); o.staleOrange = !!hb.style.background; await w(600);
    const sv = (window.__FS.prd_system.autoSched.budget.sim || {}).seen || {}; o.webSeen = sv.at === nAt && /^웹앱/.test(sv.by) && sv.how === '로거 테더링 보고' && sv.dev === 'd1' && sv.sim === 's2'; o.chipNew = hb.textContent.includes(kt(nAt) + ' 갱신') && !hb.style.background;
    // 꽂힌 휴대폰이 다른 유심으로 기억됨 → ⚠
    S.auto.cfg.budget.sim.devAuto = true; S.auto.cfg.budget.sim.dev = { d1: 's1' }; simChip(); o.mismatch = /⚠/.test(hb.textContent); S.auto.cfg.budget.sim.devAuto = false; delete S.auto.cfg.budget.sim.dev;
    // 유심 창: 마지막 확인 + 간격 저장
    hb.click(); await w(200); const pop = document.querySelector('.rn-ipop.simpop'); o.popSeen = !!pop && /마지막 확인/.test(pop.textContent);
    if (pop) { pop.querySelector('#sim_pcH').value = '8'; pop.querySelector('#sim_staleH').value = '30'; pop.querySelector('[data-simseencfg]').click(); await w(200); }
    const sc = (window.__FS.prd_system.autoSched.budget.sim || {}).seenCfg || {}; o.cfgSaved = sc.pcH === 8 && sc.staleH === 30 && sc.webH === 1; document.querySelectorAll('.rn-ipop').forEach((x) => x.remove());
    o.featSim = featFind('유심 갱신').some((f) => /📶 유심/.test(f.t));
    /* ② 🧭 관리도구로 옮김 */
    S.tab = 'settings'; renderTabs(); renderMain(); await w(800); o.setMoved = !!document.querySelector('#main [data-mgmoved]'); o.setGone = !document.querySelector('#main details[data-sec="set_night"]') && !document.querySelector('#main details[data-sec="set_devops"]');
    const g1 = document.querySelector('#main [data-mggo="mg_devops"]'); if (g1) g1.click(); await w(900); const dv = document.querySelector('#sheet details[data-sec="mg_devops"]'); o.mgDevops = !!dv && dv.open && !!dv.querySelector('#devops_box,#pcroles_box'); o.mgNight = !!document.querySelector('#sheet details[data-sec="mg_night"]');
    history.back(); await w(400);
    const fN = featFind('야간 운영').find((f) => f.go && f.go.sec === 'mg_night'); o.featNight = !!fN && fN.go.tab === 'mgr' && /관리도구/.test(fN.w); const fD = featFind('PC 역할 등록 PC').find((f) => f.go && f.go.sec === 'mg_devops'); o.featRole = !!fD;
    if (fN) { await featGo(fN); await w(900); const ng = document.querySelector('#sheet details[data-sec="mg_night"]'); o.featGoNight = !!ng && ng.open && !!ng.querySelector('#ng_on,[data-ngsave]') || (!!ng && ng.open); history.back(); await w(400); }
    /* ③ PDF → 표 */
    o.num = [kpdfNum('12,500'), kpdfNum('12,500원'), kpdfNum('(1,000)'), kpdfNum('△300'), kpdfNum('2023-05-01'), kpdfNum('합계'), kpdfNum('-')].join('|');
    const it = (rows, y0) => { const out = []; rows.forEach((R, ri) => R.forEach(([s, x]) => out.push({ s, x, y: y0 - ri * 20, w: String(s).length * 7, h: 10 }))); return out; };
    const P1 = [[['날짜', 40], ['현금', 200], ['카드', 300], ['합계', 400]], [['2001-01-01', 40], ['1,000', 200], ['2,000', 300], ['3,000', 400]], [['2001-01-02', 40], ['3,000', 200], ['1,000', 300], ['4,000', 400]], [['2001-01-03', 40], ['2,000', 200], ['', 300], ['2,000', 400]], [['합계', 40], ['6,000', 200], ['3,000', 300], ['9,000', 400]]];
    const T = kpdfTable(kpdfLines(it(P1, 700))); o.tbl = T.cols === 4 && T.rows.length === 5 && T.rows[1][2] === '2,000' && T.rows[3][2] === '';
    const Sm = kpdfSummary(T.rows, T.cols); const cs = Object.fromEntries(Sm.cols.map((c) => [c.name, c])); o.sum = Sm.head === 0 && cs['현금'] && cs['현금'].sum === 6000 && cs['현금'].n === 3 && cs['현금'].ok === true && cs['합계'].sum === 9000 && cs['합계'].avg === 3000 && cs['카드'].n === 2 && cs['카드'].ok === true && !cs['날짜'];
    // 가짜 pdf.js — 1쪽 글자 표 · 2쪽 그림(글자 없음)
    const mkPage = (items) => ({ getTextContent: async () => ({ items: items.map((x) => ({ str: x.s, transform: [x.h, 0, 0, x.h, x.x, x.y], width: x.w, height: x.h })) }), getViewport: ({ scale }) => ({ width: 600 * scale, height: 800 * scale }), render: () => ({ promise: Promise.resolve() }) });
    const pages = [mkPage(it(P1, 700)), mkPage([])]; window.pdfjsLib = { GlobalWorkerOptions: {}, getDocument: () => ({ promise: Promise.resolve({ numPages: pages.length, getPage: async (n) => pages[n - 1], destroy: () => {} }) }) };
    const sent = []; window.kmsAdd = async (id, files, title) => { sent.push({ id, n: files.length, title, type: files[0] && files[0].type }); };
    openKimiso(); await w(500); o.obsList = /관찰·참고용/.test((document.querySelector('#kms_body [data-kmsobs]') || {}).textContent || ''); o.pdfBtn = !!document.querySelector('#kms_pdf');
    const f = new File([new Uint8Array([37, 80, 68, 70, 45])], '가짜_매출.pdf', { type: 'application/pdf' }); await kpdfAdd(f, '가짜 PDF 문서'); await w(500);
    const P = window.__FS.biz_kimiso_pdf || {}; const ids = Object.keys(P); const D = P[ids[0]] || {}; o.pdfSaved = ids.length === 1 && D.kind === 'pdf' && D.rows.length === 5 && D.cols === 4 && JSON.stringify(D.imgPages) === '[2]' && D.obs === true && Array.isArray(D.rows[0].c);
    o.imgSent = sent.length === 1 && sent[0].n === 1 && sent[0].type === 'image/jpeg' && /그림 쪽/.test(sent[0].title);
    const ov = document.querySelector('.kpdf-ov'); o.win = !!ov && /관찰·참고용/.test(ov.textContent) && /9,000/.test((ov.querySelector('.kpdf-sum') || {}).textContent || '') && !!ov.querySelector('.kpdf-t'); if (ov) ov.querySelector('.bigask-x').click(); await w(100); o.winClosed = !document.querySelector('.kpdf-ov');
    o.aggClean = kmsAgg().total === 0 && ![...KMS.docs.values()].some((d) => d.kind === 'pdf'); /* PDF 표는 매출 통계에 안 들어감 */
    // 그림뿐인 PDF → 표 문서 없이 사진 읽기로만
    pages.length = 0; pages.push(mkPage([]), mkPage([]), mkPage([])); await kpdfAdd(new File([new Uint8Array([1])], '그림만.pdf', { type: 'application/pdf' }), ''); await w(300);
    o.imgOnly = Object.keys(window.__FS.biz_kimiso_pdf).length === 1 && sent.length === 2 && sent[1].n === 3;
    // biz_kimiso에 kind:'pdf'로 들어간 것(규칙에 막혔을 때 길)도 통계에서 빠짐
    window.__FS.biz_kimiso = window.__FS.biz_kimiso || {}; window.__FS.biz_kimiso.pdffb = { kind: 'pdf', title: '대신 저장', rows: [{ pg: 1, c: ['합계', '5'] }], cols: 2, createdAt: '2001-01-01T00:00:00Z', status: 'confirmed', salesCol: 'x' }; await db.collection('biz_kimiso').doc('pdffb').update({ title: '대신 저장' }); await w(300);
    o.fbOut = !KMS.docs.has('pdffb') && KPDF.fb.has('pdffb') && kmsAgg().checks.every((c) => c.d.id !== 'pdffb');
    history.back(); await w(300);
    // 🏪 매입처 김미소책방 쪽 바로 가기 → 안쪽 창
    const sh = supSrcHtml('ms', {}); o.supBtn = /data-kpdfwin/.test(sh) && /관찰·참고용/.test(sh); const box = document.createElement('div'); box.innerHTML = sh; document.body.appendChild(box); box.querySelector('[data-kpdfwin]').click(); await w(400); o.supWin = !!document.querySelector('.kpdf-ov'); const ov2 = document.querySelector('.kpdf-ov'); if (ov2) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await w(100); } o.escClosed = !document.querySelector('.kpdf-ov'); box.remove();
    o.featPdf = featFind('김미소 PDF').some((f) => /PDF/.test(f.t));
    return o; });
  console.log(JSON.stringify({ pc, ...r }, null, 0));
  const keys = ['chipDate', 'chipCalm', 'staleOrange', 'webSeen', 'chipNew', 'mismatch', 'popSeen', 'cfgSaved', 'featSim', 'setMoved', 'setGone', 'mgDevops', 'mgNight', 'featNight', 'featRole', 'featGoNight', 'tbl', 'sum', 'obsList', 'pdfBtn', 'pdfSaved', 'imgSent', 'win', 'winClosed', 'aggClean', 'imgOnly', 'fbOut', 'supBtn', 'supWin', 'escClosed', 'featPdf'];
  const bad = keys.filter((k) => !r[k]); if (r.num !== '12500|12500|-1000|-300|||') bad.push('num ' + r.num); if (!pc.found || !pc.first || !pc.throttle) bad.push('collector ' + JSON.stringify(pc));
  console.log(errs.join(' | ')); console.log(!bad.length && !errs.length ? '✓ tMISC2 통과' : '❌ tMISC2 실패: ' + bad.join(', '));
}, { vp: { width: 1300, height: 900 } });
