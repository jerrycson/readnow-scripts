// 📜 김미소책방 매출 문서 + 📖 설명서 판 — 화면 시험 (Firebase 가짜 · 클라우드 /kmsocr는 진짜 파서로 만든 답을 돌려줌)
const fs = require('fs'); const src = fs.readFileSync(__dirname + '/../cloud/index.js', 'utf8');
const a = src.indexOf('/* ══════════ 📜 김미소책방 매출 문서'), b = src.indexOf('/* ── (0.5.5) 사진 가격 조회 기록 저장·읽기');
const K = new Function('let visionClient = null;\n' + src.slice(a, b) + '\nreturn { kmsLines, kmsParse };')();
function fake(lines) { const out = []; let y = 40; for (const L of lines) { for (const [t, x, c] of L) { const w = Math.max(14, String(t).length * 14); out.push([t, x, y, x + w, y, x + w, y + 20, x, y + 20, c == null ? 0.97 : c].join('\t')); } y += 34; } return out.join('\n'); }
const L1 = [[['김미소책방 일일 매출', 40]], [['일자', 40], ['현금', 240], ['카드', 400], ['합계', 560]], [['2023-05-01', 40], ['120,000', 220], ['80,000', 390], ['200,000', 540]], [['2023-05-02', 40], ['95,500', 225], ['104,500', 385], ['200,000', 540]], [['2023-05-03', 40], ['10,000', 225], ['20,000', 390], ['31,000', 545]], [['합계', 40], ['225,500', 220], ['204,500', 385], ['431,000', 540]]];
const wds = fake(L1); const RESP = { ok: true, vision: true, ocr: { text: '김미소책방 일일 매출 …', w: 800, h: 300, wds }, parse: K.kmsParse(K.kmsLines(wds), null) };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const r = await p.evaluate(async (RESP) => { const w = (ms) => new Promise((z) => setTimeout(z, ms)); const o = {};
    S.tab = 'biz'; renderTabs(); for (let i = 0; i < 8 && !document.querySelector('#kms_bizc'); i++) { renderMain(); await w(800); } o.bizTxt = (document.querySelector('#kms_bizc') || {}).textContent || (document.querySelector('#main') || {}).textContent.slice(0, 80); o.bizCard = !!document.querySelector('#kms_bizc') && !!document.querySelector('[data-gopage="kimiso"]');
    o.feat = featFind('김미소 매출 문서').some((f) => /김미소책방 매출 문서/.test(f.t)); o.widget = !!WIDGETS.go_kimiso;
    window.pptCloudUrl = () => 'http://cloud.test'; let calls = 0; window.cloudCall = async (path, body) => { calls++; if (path !== '/kmsocr' || !/^data:image\/jpeg/.test(body.image || '')) throw new Error('잘못 부름 ' + path); return JSON.parse(JSON.stringify(RESP)); };
    o.ordersLoaded = !!S.ordersLoaded; (document.querySelector('[data-gopage="kimiso"]') || { click: () => openKimiso() }).click(); await w(500); o.listOpen = !!document.querySelector('#kms_body .mgrid');
    const cv = document.createElement('canvas'); cv.width = 400; cv.height = 300; cv.getContext('2d').fillRect(10, 10, 100, 100); const blob = await new Promise((z) => cv.toBlob(z, 'image/jpeg', 0.9)); const file = new File([blob], '일계표1.jpg', { type: 'image/jpeg' });
    await kmsAdd(null, [file], '2023년 5월 일계표'); await w(600);
    const ids = Object.keys(window.__FS.biz_kimiso || {}); o.docN = ids.length; const D = window.__FS.biz_kimiso[ids[0]]; o.rows = (D.rows || []).length; o.salesCol = D.salesCol; o.pages = (D.pages || []).length; o.photo = !!(D.pages[0] && D.pages[0].photo); o.ocrSaved = !!(window.__FS.biz_kimiso_ocr || {})[ids[0] + '_p1']; o.calls = calls;
    o.docPage = S.detail && S.detail.kms === 'doc'; o.yellow = document.querySelectorAll('#kms_body .kms-yc').length; o.imgs = document.querySelectorAll('#kms_body .kms-ph img').length;
    // 노랑(현금+카드 ≠ 합계)인 5월 3일 현금을 11,000으로 고침 → 저장 · 고친 기록 · 그 칸 노랑 풀림
    const tr = [...document.querySelectorAll('#kms_body tr[data-kr]')].find((t) => (t.querySelector('[data-kf="date"]') || {}).value === '2023-05-03'); const inp = tr.querySelector('[data-kf="v:현금"]'); inp.value = '11000'; inp.dispatchEvent(new Event('change', { bubbles: true })); await w(400);
    const D2 = window.__FS.biz_kimiso[ids[0]]; const r3 = D2.rows.find((x) => x.date === '2023-05-03'); o.edited = r3.vals['현금'] === 11000 && (D2.edits || []).length === 1 && D2.edits[0].from === 10000; o.inputFmt = inp.value; o.cellClear = !inp.closest('td').classList.contains('kms-yc');
    // 합계 칸 노랑(sum≠)은 ✔로 풂
    tr.querySelector('[data-kok]').click(); await w(300); o.okAll = !!window.__FS.biz_kimiso[ids[0]].rows.find((x) => x.date === '2023-05-03').chk.all;
    // 확정 — 두 번 눌러야
    let cf = document.querySelector('#kms_conf'); cf.click(); await w(100); o.armed = /한 번 더/.test(cf.textContent) && window.__FS.biz_kimiso[ids[0]].status === 'draft'; cf.click(); await w(400); o.status = window.__FS.biz_kimiso[ids[0]].status;
    // 둘째 문서(이미 확정): 5월 2일 다른 값(겹침) + 5월 6일 → 5월 4·5일 빔
    window.__FS.biz_kimiso.d2 = { title: '보충 문서', status: 'confirmed', confirmedAt: '2099-01-01T00:00:00Z', createdAt: '2026-10-26T00:00:00Z', pages: [], cols: [{ key: '매출', name: '매출', role: 'sales' }], salesCol: '매출', rows: [{ id: 'a', pg: 1, kind: 'day', date: '2023-05-02', ym: '2023-05', vals: { 매출: 190000 }, flags: {}, conf: {} }, { id: 'b', pg: 1, kind: 'day', date: '2023-05-06', ym: '2023-05', vals: { 매출: 50000 }, flags: {}, conf: {} }], edits: [] };
    KMS.docs.set('d2', { id: 'd2', ...window.__FS.biz_kimiso.d2 });
    openKimiso(); await w(500); const A = kmsAgg(); o.total = A.total; o.miss = A.miss; o.conf = A.conflicts.length; o.check = A.checks.find((c) => c.d.id === ids[0]).ok;
    o.bars = document.querySelectorAll('#kms_body .kms-ch rect').length; document.querySelector('[data-kmsp="day"]').click(); await w(200); o.dayBars = document.querySelectorAll('#kms_body .kms-ch rect').length; o.warnBar = document.querySelectorAll('#kms_body .kms-bar.w').length;
    document.querySelector('[data-kmsp="year"]').click(); await w(200); o.yearRow = /2023년/.test(document.querySelector('#kms_body .tbl').textContent);
    const rv = document.querySelector('#kms_rev'); const t0 = rv.textContent; rv.click(); await w(150); o.revFlip = document.querySelector('#kms_rev').textContent !== t0;
    // 확인 중 문서만 있으면 통계 0 · 스위치로 보임
    window.__FS.biz_kimiso.d3 = { title: '확인 중', status: 'draft', createdAt: '2026-10-26T01:00:00Z', pages: [], cols: [{ key: '값1', name: '값1' }], salesCol: '값1', rows: [{ id: 'c', pg: 1, kind: 'day', date: '2023-06-01', ym: '2023-06', vals: { 값1: 7000 }, flags: {}, conf: {} }], edits: [] }; KMS.docs.set('d3', { id: 'd3', ...window.__FS.biz_kimiso.d3 });
    o.draftOff = kmsAgg().total; S.kmsDraft = true; o.draftOn = kmsAgg().total; S.kmsDraft = false;
    history.back(); await w(300);
    // 📖 설명서 머리 판 표시
    openManual(); await w(300); o.manHead = (document.querySelector('#sheet .sh .t') || {}).textContent || ''; o.manSec = /김미소책방 매출 문서/.test(document.querySelector('#sheet').textContent); history.back(); await w(200);
    return o; }, RESP);
  console.log(JSON.stringify(r, null, 0));
  const ok = r.bizCard && r.feat && r.widget && r.listOpen && r.docN === 1 && r.rows === 4 && r.salesCol === '합계' && r.pages === 1 && r.photo && r.ocrSaved && r.calls === 1 && r.docPage && r.yellow >= 1 && r.imgs === 1
    && r.edited && r.inputFmt === '11,000' && r.cellClear && r.okAll && r.armed && r.status === 'confirmed'
    && r.total === 200000 + 190000 + 31000 + 50000 && JSON.stringify(r.miss) === '["2023-05-04","2023-05-05"]' && r.conf === 1 && r.check === true && r.bars === 1 && r.dayBars === 4 && r.warnBar === 1 && r.yearRow && r.revFlip
    && r.draftOff === r.total && r.draftOn === r.total + 7000 && /설명서 v\d+ · \d{4}-\d{2}-\d{2}/.test(r.manHead) && /지난 판 보기/.test(r.manHead) && r.manSec && !errs.length;
  console.log(errs.join(' | ')); console.log(ok ? '✓ t90 통과' : '❌ t90 실패');
}, { vp: { width: 1300, height: 900 } });
