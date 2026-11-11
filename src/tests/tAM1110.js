// tAM1110 — 11/10 아침 확인 고침 셋(학습 빨강은 tMLDAY ④에서)
//   ① 판매자 지문(sellerFpTick) — 재료(판매자·법정 고지) 0이면 날짜 잠금 없이 몇 시간 뒤 다시 · 하루 상한 · 재료 수(mat) 기록 · 빈 셈은 seller_fp_runs에 안 남김
//   ② 예스24 시장 지표(y24MktTick) — 요청·오래된 책이 없으면 우리 예스24 매물 책 중 아직 안 읽은 것 한 권(허브 번호 있으면 검색 건너뜀 · 끄기 seed:false)
//   ③ 진단 sfp=1(diagSfp) — y24_mkt·y24_sellers(legal 세기)·seller_fp·seller_fp_runs·eng_fence_ledger 세기·요약 · 법정 고지 원문·전화·이름 안 내보냄 · okPath에 세 칸
//   ④ 수집기 — 받아 둔 새 판 받침(__rnLiveReady)을 판 알림 거래보다 먼저 걸고 · 5분마다 지킴이(머리 서명 그대로)
// 실행: cd pw && node tAM1110.js   (공용 파일·클라우드·수집기는 ../readnow-ext-core.js · ../cloud/index.js · ../readnow-collector.src.js 또는 ../src/… — 빌드 복사본 자리)
// 시험 자료는 모두 지어낸 값(업체A·대표A·010-0000-0000 · 가게 아이디 shopA…) — 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m, x === undefined ? '' : JSON.stringify(x).slice(0, 200)); };
const ROOT = path.join(__dirname, '..'); const find = (L) => L.map((x) => path.join(ROOT, x)).find((x) => fs.existsSync(x));
const X = require(find(['readnow-ext-core.js', '../readnow-ext-core.js']));
const SRC = fs.readFileSync(find(['cloud/index.js', '../cloud/index.js']), 'utf8');
const COL = fs.readFileSync(find(['readnow-collector.src.js', 'src/readnow-collector.src.js', '../src/readnow-collector.src.js']), 'utf8');

const mkFS = () => { const D = {}; const col = (n) => (D[n] = D[n] || {}); const cp = (v) => JSON.parse(JSON.stringify(v)); const get = (o, k) => k.split('.').reduce((a, x) => (a == null ? a : a[x]), o);
  const Q = (n, fl, lim, ord) => ({ where: (k, op, v) => Q(n, [...fl, [k, op, v]], lim, ord), select: () => Q(n, fl, lim, ord), limit: (x) => Q(n, fl, x, ord), orderBy: (k) => Q(n, fl, lim, k),
    get: async () => { let L = Object.entries(col(n)).filter(([, v]) => fl.every(([k, op, x]) => { const a = get(v, k); return a != null && (op === '>=' ? a >= x : op === '>' ? a > x : op === '<' ? a < x : op === 'in' ? x.includes(a) : op === '==' ? a === x : true); }));
      if (ord) L.sort((a, b) => String(get(a[1], ord)).localeCompare(String(get(b[1], ord)))); L = L.slice(0, lim || 1e9); const docs = L.map(([id, v]) => ({ id, data: () => cp(v) })); return { docs, empty: !docs.length, size: docs.length, forEach: (f) => docs.forEach(f) }; } });
  const C = (n) => ({ ...Q(n, [], 0, null), doc: (id) => ({ get: async () => ({ exists: !!col(n)[id], data: () => (col(n)[id] ? cp(col(n)[id]) : undefined) }), set: async (v, o) => { col(n)[id] = o && o.merge ? { ...(col(n)[id] || {}), ...cp(v) } : cp(v); } }), add: async (v) => { col(n)['a' + Object.keys(col(n)).length] = cp(v); } });
  return { D, C }; };
const day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

(async () => {
  console.log('① 판매자 지문 — 재료 0이면 몇 시간 뒤 다시');
  const i0 = SRC.indexOf('let sfpAt = 0;'), i1 = SRC.indexOf('/* (정범님 11/09) 🟦 예스24 시장 지표 — 알라딘 시장 지표와 따로'); ok(i0 > 0 && i1 > i0, '클라우드에 sellerFpTick·diagSfp 자리');
  const mk = (FS) => new Function('C', 'extMod', 'fetch', 'nowIso', 'log', SRC.slice(i0, i1) + '\nreturn { sellerFpTick, diagSfp };')(FS.C, async () => X, async () => { throw new Error('새로 읽으면 안 됨'); }, () => new Date().toISOString(), () => {});
  { const F = mkFS(); F.D.app_settings = { seller_fp_state: { hour: 0 } }; const T = mk(F);
    const r1 = await T.sellerFpTick(); const st1 = F.D.app_settings.seller_fp_state;
    ok(r1 && r1.empty === 1 && r1.retry === true && st1.day === null && st1.empty.n === 1 && Math.abs(Date.parse(st1.empty.nextAt) - Date.now() - 3 * 3600e3) < 60e3, '재료 0 → 날짜 잠금 풂 · 3시간 뒤 다시(오늘 1/4번)', st1.empty);
    ok(/y24_mkt\) 문서가 없음/.test(st1.empty.why) && /근거: 없음, 설정으로 바꿈/.test(st1.empty.how) && st1.lastRun.empty === true && st1.lastRun.mat.mktDocs === 0, '왜 0인지(재료 수 mat·까닭)와 근거 표시', st1.empty);
    ok(!F.D.seller_fp_runs && !F.D.seller_fp, '빈 셈은 seller_fp_runs·seller_fp에 안 남김(뒤 회차의 진짜 셈을 덮지 않게)');
    const T2 = mk(F); ok((await T2.sellerFpTick()) === null, '다시 볼 때(nextAt) 전에는 안 돎');
    F.D.app_settings.seller_fp_state.empty.nextAt = new Date(Date.now() - 1000).toISOString(); F.D.app_settings.seller_fp_state.emptyMax = 2; const r3 = await mk(F).sellerFpTick(); const st3 = F.D.app_settings.seller_fp_state;
    ok(r3 && r3.empty === 2 && r3.retry === false && st3.day === day && st3.empty.nextAt === null && /내일 다시/.test(st3.empty.how), '하루 상한(emptyMax)에 닿으면 그날은 잠금 · 내일 다시', st3.empty);
    ok((await mk(F).sellerFpTick()) === null, '잠근 날은 더 안 돎'); }
  { const F = mkFS(); F.D.app_settings = { seller_fp_state: { hour: 0, empty: { day, n: 1, nextAt: new Date(Date.now() - 1000).toISOString() } } }; F.D.y24_mkt = { 9780000000001: { page1: [{ r: 1, id: '11', p: 5000, sid: 'shopA' }, { r: 2, id: '12', p: 6000, sid: 'shopB' }, { r: 3, id: '13', p: 7000 }] } };
    F.D.y24_sellers = { shopA: { legal: { bizNo: '123-45-67890', co: '업체A', rep: '대표A', tel: '010-0000-0000' } } };
    const r = await mk(F).sellerFpTick(); const st = F.D.app_settings.seller_fp_state;
    ok(r && !r.empty && r.sellers === 2 && st.day === day && F.D.seller_fp_runs && F.D.seller_fp_runs[day] && F.D.seller_fp_runs[day].mat.rowsSid === 2 && st.lastRun.mat.cardsLegal === 1 && st.lastRun.mat.rows === 3, '재료가 생기면 다음 회차에 제대로 셈 · 날짜 잠금 · 재료 수 기록', st.lastRun); }

  console.log('② 예스24 시장 지표 — 우리 매물 책으로 재료 넓히기');
  { const j0 = SRC.indexOf('let y24mAt = 0;'), j1 = SRC.indexOf('/* (0.26.0) 🟦 예스24 우리 가게 매물'); ok(j0 > 0 && j1 > j0, '클라우드에 y24MktTick');
    const run = async (FS) => { const calls = []; const fetch = async (u) => { calls.push(u); return { ok: false, status: 404, arrayBuffer: async () => Buffer.from(''), headers: { get: () => 'text/html; charset=utf-8' } }; };
      const f = new Function('C', 'extMod', 'fetch', 'sleep', 'nowIso', 'log', 'UA', 'VER', 'y24Dec', SRC.slice(j0, j1) + '\nreturn y24MktTick;')(FS.C, async () => X, fetch, async () => {}, () => new Date().toISOString(), () => {}, 'UA', 'test', async (r) => String(Buffer.from(await r.arrayBuffer())));
      const out = await f(); return { out, calls }; };
    const F = mkFS(); F.D.app_settings = { y24_mkt_state: {} }; F.D.y24_mkt = { 9780000000001: { at: new Date().toISOString(), page1: [] } };
    F.D.y24_listings = { g1: { goodsNo: 'g1', isbn13: '9780000000001' }, g2: { goodsNo: 'g2', isbn13: '9780000000002', masterNo: '5550002' }, g3: { goodsNo: 'g3', isbn13: '9780000000003', goneAt: '2026-11-01T00:00:00Z' }, g4: { goodsNo: 'g4', isbn13: '9780000000004' } };
    const R1 = await run(F); ok(R1.out && R1.out.why === 'seed' && R1.out.isbn === '9780000000002' && R1.calls.length === 1 && /UsedShopHub\/Hub\/5550002/.test(R1.calls[0]), '이미 읽은 책(1)은 건너뛰고 2번 — 허브 번호가 있어 검색 화면 없이 허브부터', { out: R1.out, calls: R1.calls });
    ok(F.D.app_settings.y24_mkt_state.seedAfter === '9780000000002' && F.D.y24_mkt['9780000000002'] && F.D.app_settings.y24_mkt_state.n === 1, '고른 자리(seedAfter)와 오늘 쓴 화면 수 기록 · y24_mkt에 문서가 생김');
    const R2 = await run(F); ok(R2.out && R2.out.isbn === '9780000000004' && /product\/search/.test(R2.calls[0]), '다음 회차: 팔린·내린 매물(3)은 빼고 4번(허브 번호 없음 → 검색부터)', R2.calls);
    const R3 = await run(F); const st3 = F.D.app_settings.y24_mkt_state; ok(R3.out === null && R3.calls.length === 0 && st3.seedAfter === null && Date.parse(st3.seedIdle) > Date.now() + 23 * 3600e3, '다 돌면 하루 쉼(seedIdle) · 아무 화면도 안 읽음', st3);
    const G = mkFS(); G.D.app_settings = { y24_mkt_state: { seed: false } }; G.D.y24_listings = F.D.y24_listings; const R4 = await run(G); ok(R4.out === null && R4.calls.length === 0, '끄기(seed:false)면 안 고름');
    const H = mkFS(); H.D.app_settings = { y24_mkt_state: { day, n: 120, cap: 120 } }; H.D.y24_listings = F.D.y24_listings; const R5 = await run(H); ok(R5.calls.length === 0, '하루 상한을 다 쓰면 고르지도 않음(관문 먼저)'); }

  console.log('③ 진단 sfp=1 — 세기·요약만');
  { const F = mkFS(); F.D.y24_mkt = { 9780000000001: { at: '2026-11-10T01:00:00Z', page1: [{ id: '1', sid: 'shopA', sn: '가게A', cmt: '연락 010-0000-0000' }, { id: '2', sid: 'shopB' }, { id: '3' }] }, 9780000000002: { req: { at: '2026-11-10T02:00:00Z' } } };
    F.D.y24_sellers = { shopA: { at: '2026-11-09T00:00:00Z', legal: { bizNo: '123-45-67890', co: '업체A', rep: '대표A', tel: '010-0000-0000', addr: '어느 길 1' } }, shopB: { at: '2026-11-08T00:00:00Z' } };
    F.D.seller_fp = { y24_shopA: { legal: { rep: '대표A' } } }; F.D.seller_fp_runs = { '2026-11-09': { at: 'x', n: { sellers: 2 }, pairs: [{ a: 'shopA', b: 'shopB', strong: true, why: ['아이디 머리글 같음'] }], cross: { legal: [{ sid: 'shopA', sc: '1' }], list: [] }, ms: 5 }, '2026-11-10': { at: 'y', n: { sellers: 0 }, pairs: [], cross: { legal: [], list: [] }, mat: { mktDocs: 0 } } };
    F.D.eng_fence_ledger = { '2026-11-10': { day: '2026-11-10', limit: 11000, spent: 1200, held: 300, items: { a1: { a: 100 } }, note: '사람 글' }, _head: { at: '2026-11-10T00:00:00Z' } };
    F.D.app_settings = { seller_fp_state: { day, empty: { why: 'x' }, lastRun: { sellers: 0, mat: { mktDocs: 1 } }, legal: { rep: '대표A' } }, y24_mkt_state: { seedAfter: '9780000000002', n: 3 } };
    const out = await mk(F).diagSfp({}); const J = JSON.stringify(out); const hit = (J.match(/대표A|업체A|010-0000-0000|어느 길|가게A/g) || []);
    ok(out.y24_mkt.docs === 2 && out.y24_mkt.read === 1 && out.y24_mkt.rows === 3 && out.y24_mkt.rowsSid === 2 && out.y24_mkt.sellers === 2 && out.y24_mkt.reqWait === 1, 'y24_mkt: 책 2 · 읽음 1 · 첫 쪽 3줄 · 판매자 아이디 2줄 · 요청 대기 1', out.y24_mkt);
    ok(out.y24_sellers.cards === 2 && out.y24_sellers.legal === 1 && out.y24_sellers.bizNo === 1 && out.seller_fp.n === 1, 'y24_sellers: 카드 2 · 법정 고지 1 · 사업자 번호 1 · seller_fp 1', out.y24_sellers);
    ok(out.seller_fp_runs.n === 2 && out.seller_fp_runs.last[0].day === '2026-11-10' && out.seller_fp_runs.last[1].pairs === 1 && out.seller_fp_runs.last[1].strong === 1 && out.seller_fp_runs.last[1].crossLegal === 1, 'seller_fp_runs: 최근부터 숫자 요약', out.seller_fp_runs);
    const L0 = out.eng_fence_ledger.last.find((x) => x.day === '2026-11-10'); ok(out.eng_fence_ledger.n === 2 && L0 && L0.limit === 11000 && L0.spent === 1200 && L0.items.keys === 1 && L0.note === '(글)', 'eng_fence_ledger: 숫자 칸만 · 글은 (글)', L0);
    ok(!/대표A|업체A|010-0000-0000|어느 길|가게A/.test(J) && out.seller_fp_state.lastRun.mat.mktDocs === 1 && out.y24_mkt_state.seedAfter === '9780000000002', '법정 고지 원문·전화·주소·판매자 이름은 진단에 없음 · 설정 상태는 가린 채', { hit, st: out.seller_fp_state, y: out.y24_mkt_state });
    ok(/\|seller_fp_runs\|eng_fence_ledger\|y24_mkt(?:\|[a-z_0-9]+)*\)\\\/\[A-Za-z0-9_\\-\.\]\+\$\/\.test\(p0\)/.test(SRC) && !/okPath = [^\n]*y24_sellers/.test(SRC), 'okPath에 seller_fp_runs·eng_fence_ledger·y24_mkt(문서 그대로 읽기 · y24_sellers는 원문 안 냄 — 세기만)');
    ok(/diagScrub\(d\.data\(\)\)/.test(SRC) && /if \(q\.sfp\) \{ try \{ out\.sfp = await diagSfp\(q\)/.test(SRC), '세 칸 문서 읽기는 가림(diagScrub) · 진단 줄 sfp=1');
    const sc = new Function('C', SRC.slice(SRC.indexOf('const DIAG_PII_K'), SRC.indexOf('async function diagSfp')) + '\nreturn diagScrub;')(null); const s1 = sc({ page1: [{ id: '1', sid: 'shopA', sn: '가게A', cmt: '글' }], note: '전화 010-1234-5678 · 01000000000 · a@b.co', isbn: '9780100000002', legal: { rep: '대표A' } });
    ok(!s1.legal && !s1.page1[0].sn && !s1.page1[0].cmt && s1.page1[0].sid === 'shopA' && !/1234|9876|a@b/.test(s1.note) && s1.isbn === '9780100000002', 'diagScrub: 법정 고지·이름·공지 칸 지움 · 글 속 전화·메일 가림 · ISBN은 그대로', s1); }

  console.log('④ 수집기 — 새 판 받침을 거래보다 먼저 · 지킴이');
  { const v0 = COL.indexOf('  async function versionWatch() {'), v1 = COL.indexOf('  /* ══════════ (1.59.2) 🛰 원격 조작', v0); const VW = COL.slice(v0, v1);
    const iReady = VW.indexOf('window.__rnLiveReady = (v) =>'), iSnap = VW.indexOf('ref.onSnapshot((d) => onNewVer('), iTx = VW.indexOf('try { await Promise.race([db.runTransaction('), iDog = VW.indexOf('⚡ 받아 둔 새 판 지킴이');
    ok(v0 > 0 && iReady > 0 && iSnap > iReady && iTx > iSnap && iDog > 0 && iDog < iTx && !/\n {4}(try \{ )?await\b/.test(VW.slice(0, iTx)) && /^try \{ await Promise\.race[^\n]*\n  \}\n$/.test(VW.slice(iTx)), '받침(__rnLiveReady)·판 알림 듣기·지킴이가 판 알림 거래보다 먼저 · 기다리는 거래는 함수 맨 끝 한 줄', { iReady, iSnap, iTx, iDog });
    ok((VW.match(/let verTimer = null;/g) || []).length === 1 && VW.indexOf('let verTimer = null;') < iReady, 'verTimer는 받침보다 먼저 선언(TDZ 없음)');
    const m = VW.match(/ {4}setInterval\(\(\) => \{ try \{ if \(window\.__rnOutdated[\s\S]*?\}, 5 \* 60e3\);/); ok(!!m, '지킴이 5분마다');
    const sim = (G, W) => { let fn = null; const logs = []; new Function('setInterval', 'GM_getValue', 'window', 'verNum', 'VER', 'log', m[0])((f) => { fn = f; }, (k, d) => (k in G ? G[k] : d), W, (v) => String(v || '0').split('.').map((x) => +x || 0).reduce((a, x) => a * 1000 + x, 0), '1.89.238', (s) => logs.push(s)); fn(); return logs; };
    const mkW = () => { const W = { calls: [], __rnOutdated: false, __rnLiveInfo: () => ({ hsig: '8559039d5a96110b' }) }; W.__rnLiveReady = (v) => W.calls.push(v); return W; };
    { const W = mkW(); const lg = sim({ 'rn-live': { ver: '1.89.253', hsig: '8559039d5a96110b' } }, W); ok(W.calls.join() === '1.89.253' && /지킴이가 다시 걸어 둠/.test(lg[0]), '받아 둔 새 판(같은 머리)이 있는데 준비가 없으면 받침을 다시 부름', lg); }
    { const W = mkW(); W.__rnOutdated = '1.89.253'; sim({ 'rn-live': { ver: '1.89.253', hsig: '8559039d5a96110b' } }, W); ok(!W.calls.length, '이미 바꿀 준비 중이면(쉬는 사이·저장 지점 기다림) 건드리지 않음'); }
    { const W = mkW(); sim({ 'rn-live': { ver: '1.89.253', hsig: 'other' } }, W); sim({ 'rn-live': { ver: '1.89.238', hsig: '8559039d5a96110b' } }, W); sim({ 'rn-live': { ver: '1.89.253', hsig: '8559039d5a96110b' }, 'rn-live-bad': { ver: '1.89.253' } }, W); sim({ 'rn-live': { ver: '1.89.253', hsig: '8559039d5a96110b' }, 'rn-live-off': true }, W);
      ok(!W.calls.length, '머리가 다른 판·같은 판·시작 실패한 판·빠른 업데이트 끈 PC는 부르지 않음'); }
    ok(/if \(window\.__rnShipWait && window\.__rnShipWait\('verReload'/.test(VW) && /!tried && !hw && busy && running[^\n]*curKey !== 'explore' && JOBS\[curKey\]/.test(VW), '바꾸는 규칙은 그대로 — 출고 보호 · 긴 일(🎯 벤치마킹 포함)은 저장 지점에서 멈추고 새로고침 뒤 그 자리부터'); }

  console.log(bad ? `❌ tAM1110 실패 ${bad}` : '✓ tAM1110 통과'); process.exitCode = bad ? 1 : 0; })();
