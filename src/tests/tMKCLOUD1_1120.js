// tMKCLOUD1_1120 — (mkcloud1 11/20) 📈 🧺 수동 일괄 「시장 지표 갱신」(단추·Alt+Shift+U) = ☁ 클라우드 먼저 · 못 읽거나 느리면 저절로 수집기
//  클라우드(원본 글): shp_cmds type 'market' + lst → 판매 중 상품(listing id) 한 개를 공개 화면으로 다시 읽어 prd_book_metrics에 수집기와 같은 모양으로 씀(metRefreshCloud)
//   · 출고 시장 다시 읽기(주문 상품 · 「사라짐」 길 mktJobs)에는 섞이지 않음 · 받기와 읽기를 나눠 차례(serial) 멈춤 없음
//  웹앱(화면 · 가짜 Firestore): 단추 → shp_cmds market lst 맡김(listingIds·devName) · 클라우드 끝남(ok) → 시장 칸에 바로 들어감 · 수집기 맡김 없음
//   · 클라우드가 못 읽음(ok 없음 · 옛 클라우드 판 포함) / 느림(받지 않음) / 주소 없음 / 매물 번호 없음 → 수집기 길(type 'metrics')로 넘어감
// 시험 자료에 손님 정보 없음 · 쓰는 법: RN_PORT=<포트> node tMKCLOUD1_1120.js (RN_PORT 없으면 원본 글 확인만)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const pick = (c) => c.filter(Boolean).find((x) => fs.existsSync(x));
const APP = pick([process.env.RN_APP, path.resolve(__dirname, '..', 'app.html')]);
const CLD = pick([path.resolve(__dirname, '..', '..', 'cloud', 'index.js'), process.env.RN_GIT_REPO && path.join(process.env.RN_GIT_REPO, 'cloud', 'index.js'), path.resolve(__dirname, '..', '..', '..', 'cloud', 'index.js')]);
const T = fs.readFileSync(APP, 'utf8'); const C = fs.readFileSync(CLD, 'utf8');
const cut = (S, a, b) => { const i = S.indexOf(a); const j = S.indexOf(b, i + a.length); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return S.slice(i, j); };
console.log('① 클라우드 원본 글');
{ const run = cut(C, 'async function runCmds(', '\nasync function ');
  ok(/v\.type === 'market' && v\.lst\) \{ const J = lstTake\(d\.ref, v\)/.test(run), 'runCmds — market + lst를 따로 받음(일반 출고 시장 분기보다 앞)');
  ok(run.indexOf("v.type === 'market' && v.lst") < run.indexOf("v.type === 'market'", run.indexOf("v.type === 'market' && v.lst") + 10), 'lst 분기가 일반 market 분기보다 먼저');
  const lb = cut(run, "v.type === 'market' && v.lst", '/* (mkcloud1');
  ok(!/metRefreshCloud|serial\(/.test(lb) && /status: 'running'/.test(lb) && /runBy: 'cloud'/.test(lb), '받기만(running) — 읽기는 차례 밖 lstStep(serial 안에서 serial을 부르지 않음)');
  const st = cut(C, 'async function lstStep(', '\nconst metCloud ');
  ok(/metRefreshCloud\(/.test(st) && /lstLoadL\(/.test(st), 'lstStep — 매물 번호로 상품을 찾아 metRefreshCloud(수집기 refreshOne과 같은 칸)로 다시 읽음');
  ok(!/mktJobs\.set|gone|사라짐/.test(st + cut(C, 'function lstTake(', '\nasync function lstStep(')), 'lst 길에 출고 시장 작업(mktJobs)·「사라짐」 없음');
  ok(/const ok = J\.done\.length > 0 && !J\.fail\.length/.test(st) && /status: 'done', ok,/.test(st) && /status: 'done'/.test(st) && /by: 'cloud'/.test(st), '끝 = status done + ok(모두 읽음일 때만)');
  ok(/J0 = await cjobs\(\)/.test(st) && /J0\.met === false/.test(st), '설정에서 클라우드 시장 지표를 끄면 오류로 닫음(웹앱이 수집기로 넘김)');
  const ld = cut(C, 'async function lstLoadL(', '\nfunction lstTake('); ok(/prd_listings/.test(ld) && /listingId/.test(ld) && !/\.set\(|\.update\(|\.delete\(/.test(ld), 'lstLoadL — prd_listings 읽기만(상품 기록을 고치지 않음)');
  ok(/const LST_MAX = \d+/.test(C) && /slice\(0, LST_MAX\)/.test(C), '한 번 맡김 개수 한도');
  ok(/const lo = await lstStep\(/.test(cut(C, "'/tick'", "'/kick'")) || /lstStep\(Date\.now\(\) \+ 40e3\)/.test(C), '/tick에서 lstStep');
  ok(/serial\(\(\) => tick\('kick'\)\)[\s\S]{0,200}lstStep\(/.test(C), '/kick — 차례(serial)가 끝난 뒤 lstStep(웹앱이 깨우면 바로 읽음)');
  ok(/const mktJobsLoad|async function mktJobsLoad/.test(C) && /!v\.rerd/.test(cut(C, 'async function mktJobsLoad', '\nasync function mktJobsTick')), '출고 시장 작업 되살리기는 rerd만(lst 문서는 섞이지 않음)'); }
console.log('② 웹앱 원본 글');
{ const bq = cut(T, 'async function bqMetRequest(', '\n/*');
  ok(/type: 'market', lst: true/.test(bq) && /listingIds: \[lid\]/.test(bq) && /devName:/.test(bq) && !/\bdev: /.test(bq), '맡김 = market + lst · listingIds · devName(dev 칸 없음 — 클라우드가 PC 맡김으로 보고 미루지 않게)');
  ok(/cloudCall\('\/kick'/.test(bq), '맡긴 뒤 클라우드를 깨움(/kick)');
  ok(/pmkRequest\(l, false\)/.test(bq) && /runTransaction/.test(bq) && /status: 'cancel'/.test(bq), '넘길 때 아직 queued면 취소(트랜잭션) 뒤 수집기 길');
  ok(/prd_book_metrics/.test(bq) && /pmPut\(/.test(bq), '끝나면 prd_book_metrics를 읽어 시장 칸(pmPut)');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(bq) && !/01[016789][-\s]?\d{3,4}[-\s]?\d{4}/.test(bq), '브라우저 창·휴대전화 번호 꼴 없음');
  ok((T.match(/bqMetRequest\(l\)/g) || []).length >= 2, '관제창·그룹 화면 카드 단추 둘 다 클라우드 먼저'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tMKCLOUD1_1120 ${bad}개 실패` : '✓ tMKCLOUD1_1120 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('③ 화면(가짜 Firestore · 가짜 클라우드)');
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); }); const perr = []; p.on('pageerror', (e) => perr.push(e.message));
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const FS = window.__FS; const out = {};
    window.__kick = []; cloudCall = async (pth) => { window.__kick.push(pth); return { ok: true }; }; window.__cu = 'https://cloud.test'; pptCloudUrl = () => window.__cu || null;
    BQMET_MS.tick = 200; BQMET_MS.take = 60e3; BQMET_MS.done = 60e3;
    const L = [...S.plist.values()].filter((l) => l.active && /^\d+$/.test(String(l.listingId || '')) && l.bookId).slice(0, 6);
    out.nL = L.length; const K = (j) => 'aladin_' + L[j].usedCode; try { localStorage.setItem('rn-bq-view', 'full'); } catch (e) {}
    const sh = document.getElementById('sheet'); sh.classList.add('on'); sh.innerHTML = '<div id="b_res"></div>'; S.detail = { batch: 1 };
    S.batchRes = L.map((l, j) => ({ l, target: l.price - 500 - j, reasons: ['시험'], page1: [], at: new Date().toISOString(), out: false })); S.batchSt = { picks: {}, decided: {} }; S.batchMeta = {}; S.batchT = 'sel'; S.batchEdit = {}; S.bqOpen = new Set();
    drawBatchRes(sh, { ...JSON.parse(JSON.stringify(BATCH_DEF)), name: '시험 그룹' }, 'g1'); await W(700);
    const res = () => sh.querySelector('#b_res'); const btn = (k) => res().querySelector(`[data-bqmet="${k}"]`) || { click: () => { (out.miss = out.miss || []).push({ k, all: [...res().querySelectorAll('[data-bqmet]')].map((x) => x.dataset.bqmet), K: L.map((l) => l.id) }); } };
    const cmds = () => Object.entries(FS.shp_cmds || {}).map(([id, v]) => ({ id, ...v }));
    const forK = (k, t) => cmds().filter((v) => (v.keys || [])[0] === k && v.type === t);
    const fin = async (id, o) => db.collection('shp_cmds').doc(id).set(o, { merge: true });
    // ⓐ 클라우드 끝남(ok) → 시장 칸 · 수집기 맡김 없음
    out.btns = res().querySelectorAll('[data-bqmet]').length; const b0 = btn(K(0)); b0 && b0.click(); await W(400);
    const m0 = forK(K(0), 'market')[0] || {}; out.a = { cmd: { lst: m0.lst, one: m0.one, lids: m0.listingIds, dev: 'dev' in m0, devName: 'devName' in m0, st: m0.status }, kick: window.__kick.slice(), req: { ...(S.pmk.req[K(0)] || {}) }, tag: (res().textContent.match(/⏳[^✓⚠]{0,30}/) || [''])[0] };
    await fin(m0.id, { status: 'running', runBy: 'cloud' }); await W(400); out.a.run = (S.pmk.req[K(0)] || {}).txt;
    FS.prd_book_metrics = FS.prd_book_metrics || {}; FS.prd_book_metrics[L[0].bookId] = { bookId: L[0].bookId, refreshedAt: new Date().toISOString(), by: 'cloud', usedTotal: 77, rows: [] };
    await fin(m0.id, { status: 'done', ok: true, by: 'cloud', doneAt: new Date().toISOString(), results: { [String(L[0].listingId)]: { ok: true, bookId: L[0].bookId } } }); await W(900);
    const pm = S.pmetrics.get(L[0].bookId) || {}; out.a.done = { st: (S.pmk.req[K(0)] || {}).state, ok: (S.pmk.req[K(0)] || {}).ok, via: (S.pmk.req[K(0)] || {}).via, pm: pm.usedTotal, metrics: forK(K(0), 'metrics').length };
    // ⓑ 클라우드가 못 읽음(done · ok 없음 — 옛 클라우드 판도 이렇게 끝냄) → 수집기 길
    btn(K(1)).click(); await W(400); const m1 = forK(K(1), 'market')[0] || {}; await fin(m1.id, { status: 'done', doneAt: new Date().toISOString() }); await W(900);
    out.b = { metrics: forK(K(1), 'metrics').length, via: (S.pmk.req[K(1)] || {}).via, txt: (S.pmk.req[K(1)] || {}).txt };
    // ⓒ 클라우드가 받지 않음(느림) → 맡김 취소 + 수집기 길
    BQMET_MS.take = 1200; btn(K(2)).click(); await W(2600); const m2 = (FS.shp_cmds || {})[(forK(K(2), 'market')[0] || {}).id] || {};
    out.c = { st: m2.status, why: m2.cancelWhy || '', metrics: forK(K(2), 'metrics').length, txt: (S.pmk.req[K(2)] || {}).txt }; BQMET_MS.take = 60e3;
    // ⓓ 클라우드 주소 없음 → 바로 수집기
    window.__cu = ''; btn(K(3)).click(); await W(600); out.d = { market: forK(K(3), 'market').length, metrics: forK(K(3), 'metrics').length, txt: (S.pmk.req[K(3)] || {}).txt }; window.__cu = 'https://cloud.test';
    // ⓔ 매물 번호 없음 → 바로 수집기
    L[4].listingId = null; btn(K(4)).click(); await W(600); out.e = { market: forK(K(4), 'market').length, metrics: forK(K(4), 'metrics').length };
    // ⓕ 클라우드가 실패로 닫음(fail) → 수집기
    btn(K(5)).click(); await W(400); const m5 = forK(K(5), 'market')[0] || {}; await fin(m5.id, { status: 'fail', msg: '시험' }); await W(900); out.f = { metrics: forK(K(5), 'metrics').length };
    return out; });
  if (process.env.V) console.log(JSON.stringify(r, null, 1));
  ok(r.nL >= 6 && r.btns >= 6, '시험 상품 6개 · 카드마다 📈 단추', [r.nL, r.btns]);
  ok(r.a.cmd.lst === true && r.a.cmd.one === true && r.a.cmd.lids && r.a.cmd.lids.length === 1 && !r.a.cmd.dev && r.a.cmd.devName && r.a.cmd.st === 'queued', 'ⓐ 누르면 shp_cmds market lst 하나(매물 번호 1개 · devName · dev 없음)', r.a.cmd);
  ok(r.a.kick.includes('/kick'), 'ⓐ 맡긴 뒤 클라우드를 깨움(/kick)', r.a.kick);
  ok(r.a.req.via === 'cloud' && r.a.req.state === 'queued' && /☁/.test(r.a.tag), 'ⓐ 카드 상태 = ☁ 맡김', [r.a.req, r.a.tag]);
  ok(/클라우드가 읽는 중/.test(r.a.run || ''), 'ⓐ running → 「클라우드가 읽는 중」', r.a.run);
  ok(r.a.done.st === 'done' && r.a.done.ok === true && r.a.done.via === 'cloud' && r.a.done.pm === 77 && r.a.done.metrics === 0, 'ⓐ 끝남(ok) → 새 시장 지표가 시장 칸(S.pmetrics)에 · ✓ · 수집기 맡김 없음(판매 중 상품이 「사라짐」이 아님)', r.a.done);
  ok(r.b.metrics === 1 && r.b.via === 'pc' && /수집기/.test(r.b.txt || ''), 'ⓑ 클라우드가 못 읽음(ok 없음 · 옛 클라우드 판) → 수집기 길(metrics) 하나', r.b);
  ok(r.c.st === 'cancel' && /수집기 길로 넘김/.test(r.c.why) && r.c.metrics === 1 && /받지 않음/.test(r.c.txt || ''), 'ⓒ 클라우드가 받지 않음(느림) → 맡김 취소 + 수집기 길', r.c);
  ok(r.d.market === 0 && r.d.metrics === 1 && /주소/.test(r.d.txt || ''), 'ⓓ 클라우드 주소 없음 → 바로 수집기', r.d);
  ok(r.e.market === 0 && r.e.metrics === 1, 'ⓔ 매물 번호 없음 → 바로 수집기', r.e);
  ok(r.f.metrics === 1, 'ⓕ 클라우드가 실패로 닫음 → 수집기', r.f);
  ok(!dlg.length, '브라우저 창 없음', dlg); ok(!perr.length, '화면 오류 없음', perr);
  console.log(bad ? `❌ tMKCLOUD1_1120 ${bad}개 실패` : '✓ tMKCLOUD1_1120 통과'); process.exitCode = bad ? 1 : 0; });
