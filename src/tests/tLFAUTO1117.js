// tLFAUTO1117 — (11/17 일꾼 listfix1 · 정범님 16:16 「백업 파일 복사 — 이걸 내가 왜 해야 돼? 자동으로」 · 「모든 버전을 백업 · 구분 · 뜻을 훗날 세세히」 · 「MJ 빼고 아무거나」)
//  사람 손 0 되돌리기: 로거 수집기가 도우미(1.8.31)로 백업 파일을 직접 읽고(읽기만) '복구'·'복구1108'을 다 셈 → 버전 넷(사고 전·지금 값·복구·복구1108)을 덮지 않고 따로 남김 → 숫자가 맞을 때만 '복구1108'을 씀
//  ① 도우미 /lf-ls·/lf-get·/lf-put: 수집기만(POST·X-RN-Bk) · 이름 검사 · 줄 끝에서 잘라 한글이 안 깨짐 · 한 번 쓴 파일은 다시 못 씀(409) · 읽기 전용 · SHA256.txt
//  ② 저절로 되돌리기: 버전 넷 + 뜻(about.json) · Firestore listfix_versions · 되돌림 자료 먼저 · '복구1108' 처음 본 때 · 끝나면 다시 안 함
//  ③ 숫자가 예상(약 14,700 ±15%) 밖이면 쓰지 않고 'held'(버전은 남김) · 멈춤 표시(stop) · 로거가 아니거나 MJ-MAIN이면 안 함 · 도우미가 옛 판이면 기다림
// 실행: node src/tests/tLFAUTO1117.js (127.0.0.1 빈 포트 하나 · 시험 자료는 모두 지어낸 값)
const fs = require('fs'), path = require('path'), os = require('os'), http = require('http'), cp = require('child_process'), vm = require('vm');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'local/readnow-local.js')));
const HLPF = path.join(R, 'local/readnow-local.js'); const LSRC = fs.readFileSync(HLPF, 'utf8');
const SRCF = [path.join(R, 'src/readnow-collector.src.js'), path.join(R, 'readnow-collector.src.js')].find((f) => fs.existsSync(f)); const SRC = fs.readFileSync(SRCF, 'utf8');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌ ' + m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓ ' + m); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'tlfauto_')); const LOC = path.join(HOME, 'local'); fs.mkdirSync(LOC);
const BK = path.join(HOME, 'backup'); const SRCD = path.join(BK, 'firestore', 'prd_listings'); fs.mkdirSync(SRCD, { recursive: true });
const PORT = 21200 + Math.floor(Math.random() * 1500); const TF = path.join(HOME, 'fake.json');
fs.writeFileSync(TF, JSON.stringify({ ifaces: [{ name: '이더넷', ip: '192.168.0.10', desc: 'Realtek PCIe GbE' }], hw: { '이더넷': { id: 'PCI\\VEN_10EC&DEV_8168\\X' } }, pubip: { '192.168.0.10': '125.1.1.1' }, mobile: { '125.1.1.1': { mobile: false, isp: 'KT 유선' } }, speed: {}, defaultIp: '192.168.0.10' }));
fs.writeFileSync(path.join(LOC, 'readnow-local.json'), JSON.stringify({ port: PORT, selfUpdate: false, wifiIface: '이더넷' }));
const req = (method, p, body, hdr) => new Promise((res, rej) => { const rq = http.request({ host: '127.0.0.1', port: PORT, method, path: p, headers: { Host: '127.0.0.1:' + PORT, ...(hdr || {}) }, timeout: 20000 }, (r) => { const bufs = []; r.on('data', (c) => bufs.push(c)); r.on('end', () => res({ status: r.statusCode, responseText: Buffer.concat(bufs).toString('utf8') })); }); rq.on('error', rej); rq.on('timeout', () => rq.destroy(new Error('시간 초과'))); if (body != null) rq.write(body); rq.end(); });
const BKH = { 'X-RN-Bk': '1', 'Content-Type': 'application/json' };
const pj = (r) => { try { return JSON.parse(r.responseText); } catch (e) { return {}; } };

/* 지어낸 세계: 상품 300개 · 앞 12개가 사고로 덮임 · 그중 앞 4개는 11/08 사고로 처음 본 때가 이미 늦어져 있었음 */
const T0 = Date.parse('2026-11-17T03:37:00Z'); const iso = (ms) => new Date(ms).toISOString();
const OLD = Date.parse('2026-10-01T00:00:00Z'), D1108 = Date.parse('2026-11-08T05:00:00Z'), INC = T0 - 10 * 3600e3, HIT = T0 + 20 * 60e3;
const N = 300; const ids = Array.from({ length: N }, (_, i) => 'aladin_U' + (200000 + i)); const hitIds = ids.slice(0, 12);
const long = '한글 제목 가나다라마바사 — 시험용 지어낸 책 이름 '.repeat(20);
const line = (id, d) => JSON.stringify({ path: 'prd_listings/' + id, id, d: { title: long + id, ...d } });
const full = ids.map((id, i) => line(id, { firstSeenAt: { __ts: OLD + i * 1000 }, registeredAt: '2025-03-01', qty: 1, uploadedAt: { __ts: Date.parse('2026-10-28T02:00:00Z') } }));
const inc1108 = hitIds.slice(0, 4).map((id) => line(id, { firstSeenAt: { __ts: D1108 }, registeredAt: '2025-03-01', qty: 1, uploadedAt: { __ts: D1108 + 60e3 } })); // 11/08 사고: 처음 본 때가 늦어짐
const inc1117 = [...ids.slice(0, 40).map((id, i) => line(id, { firstSeenAt: { __ts: i < 4 ? D1108 : OLD + i * 1000 }, registeredAt: '2025-03-01', qty: 1, uploadedAt: { __ts: INC } })), ...hitIds.map((id) => line(id, { firstSeenAt: { __ts: HIT }, registeredAt: '2026-03-01', qty: 5, uploadedAt: { __ts: HIT + 1000 } }))];
const FILES = { '2026-10-28-full.jsonl': full.join('\n') + '\n', '2026-11-08-inc.jsonl': inc1108.join('\n') + '\n', '2026-11-17-inc.jsonl': inc1117.join('\n') + '\n', 'state-x.json': '{}' };
for (const [f, t] of Object.entries(FILES)) fs.writeFileSync(path.join(SRCD, f), t);

function world(opt) {
  opt = opt || {}; const st = { writes: [], undo: [], sys: new Map(), logs: [], qchk: [], gm: new Map(), running: [] };
  const docs = new Map(); ids.forEach((id, i) => docs.set(id, { firstSeenAt: iso(OLD + i * 1000), registeredAt: '2025-03-01', qty: 1, active: true, listingId: 500000000 + i, uploadedAt: { toMillis: () => INC } }));
  hitIds.forEach((id, j) => { Object.assign(docs.get(id), { firstSeenAt: iso(HIT + j), registeredAt: '2026-03-01', registeredYearGuessed: true, qty: 5, uploadedAt: { toMillis: () => HIT } }); });
  if (opt.auto) st.sys.set('listfix_auto', JSON.parse(JSON.stringify(opt.auto)));
  const merge = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b)) o[k] = v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' && !v.__sts ? merge(o[k], v) : v; return o; };
  const snap = (arr) => ({ size: arr.length, docs: arr, metadata: { fromCache: false }, forEach: (f) => arr.forEach(f) }); const D = (id) => ({ id, data: () => docs.get(id) });
  const C = (name) => { const q = { _w: null, _after: null, _lim: 0, where(f) { q._w = f; return q; }, orderBy() { return q; }, limit(n) { q._lim = n; return q; }, startAfter(d) { q._after = d; return q; },
    doc(id) { return { _n: name, _id: id || 'auto' + Math.random(), get: async () => ({ data: () => (name === 'prd_listings' ? docs.get(id) : st.sys.get(id)) }),
      set: async (v, o) => { if (name !== 'prd_system') return; if (/^listfix_undo_/.test(id)) st.undo.push([id, v, st.writes.length]); st.sys.set(id, o && o.merge ? merge(st.sys.get(id), v) : v); } }; },
    async get() { if (q._w === 'uploadedAt') return snap([]); const s = [...docs.keys()].sort(); const a = q._after ? s.indexOf(q._after.id) + 1 : 0; return snap(s.slice(a, a + q._lim).map(D)); } }; return q; };
  const FV = { delete: () => ({ __fvdel: 1 }), serverTimestamp: () => ({ __sts: 1 }) };
  const firebase = { firestore: Object.assign(() => {}, { FieldValue: FV, FieldPath: { documentId: () => '__id__' }, Timestamp: { fromMillis: (ms) => ({ toMillis: () => ms }) } }) };
  const db = { batch: () => { const ops = []; return { set: (ref, v) => ops.push([ref, v]), commit: async () => { for (const [ref, v] of ops) if (ref._n === 'prd_listings') { st.writes.push([ref._id, v]); const d = { ...(docs.get(ref._id) || {}) }; for (const [k, x] of Object.entries(v)) { if (x && x.__fvdel) delete d[k]; else d[k] = x; } docs.set(ref._id, d); } } }; },
    runTransaction: async (fn) => fn({ get: async (ref) => ({ data: () => st.sys.get(ref._id) }), set: (ref, v, o) => st.sys.set(ref._id, o && o.merge ? merge(st.sys.get(ref._id), v) : v) }) };
  const ctx = { console, JSON, Math, Date, Map, Set, Object, Array, String, Number, Promise, Error, Blob: function () {}, URL: { createObjectURL: () => 'blob:' }, TextDecoderStream: undefined, encodeURIComponent,
    document: { createElement: () => ({ click() {}, remove() {} }), body: { appendChild() {} } }, setTimeout: () => 0, setInterval: () => 0,
    firebase, db, C, LF_SRVN: 0, PC_NAME: opt.pc || 'LOGGER', PUBONLY: opt.pub !== false, HLP: opt.hlp || 'http://127.0.0.1:' + PORT, auth: { currentUser: { uid: 'x' } }, running: null, BKX: { state: 'idle' }, stopFlag: false,
    setRunning: (n) => { st.running.push(n); ctx.running = n; }, GM_getValue: (k, d) => (st.gm.has(k) ? st.gm.get(k) : d), GM_setValue: (k, v) => st.gm.set(k, v),
    gmReq: async (o) => { try { return await req(o.method, o.url.replace(/^http:\/\/127\.0\.0\.1:\d+/, ''), o.data, o.headers); } catch (e) { return null; } }, prompt: () => { throw new Error('저절로 길에서 창을 띄움'); },
    nowIso: () => new Date().toISOString(), W: () => ({ uploadedAt: FV.serverTimestamp(), writer: 'TEST' }), ui() {}, sleep: async () => {}, log: (m) => st.logs.push(String(m)),
    lfSrvGet: async (q) => q.get({ source: 'server' }), lfSrvCount: async () => docs.size, lfShort: (n, srv) => (n < srv * 0.97 ? `서버 ${srv}건 중 ${n}건` : ''),
    qchkQueue: async (pairs, label, why) => { st.qchk.push({ pairs, label, why }); return { cmds: Math.ceil(pairs.length / 40), items: pairs.length }; },
    commitBatches: async (ops) => { for (let i = 0; i < ops.length; i += 400) { const b = db.batch(); ops.slice(i, i + 400).forEach((f) => f(b)); await b.commit(); } } };
  const a = SRC.indexOf('/* LFR-PURE-BEGIN */'), b = SRC.indexOf('  /* ───────── 파일 가져오기', a); const BKSER = (SRC.match(/const bkSer = [^\n]*?return o; };/) || [])[0];
  vm.createContext(ctx); vm.runInContext(BKSER + '\n' + SRC.slice(a, b).replace(/let running\b/, 'var running0') + '\n;globalThis.__X = { LFR, LFA, lfrAuto, lfaKeepFs };', ctx);
  if (opt.lo != null) { ctx.__X.LFA.LO = opt.lo; ctx.__X.LFA.HI = opt.hi; }
  return { st, docs, ctx, X: ctx.__X };
}

let child = null, out = '';
(async () => {
  try {
    ok(/const VERSION = '1\.8\.(3[1-9]|[4-9]\d)'/.test(LSRC), '⓪ 도우미 판 1.8.31 이상');
    ok(/if \(\/\^\\\/\(bk\|lf\)-\/\.test\(u\.pathname\)\) return bkApi/.test(LSRC), '⓪ /lf- 길은 백업 문(bkApi)으로');
    const gi = LSRC.indexOf("req.headers['x-rn-bk'] !== '1' || req.method !== 'POST'"), li = LSRC.indexOf('return lfApi(u, req, res, J)'); ok(gi > 0 && li > gi, '⓪ /lf- 길은 수집기 문(POST·X-RN-Bk)을 지난 뒤에만');
    ok(/LFA = \{ ON: true, MODE: 'min', LO: 12500, HI: 16900/.test(SRC), "⓪ 운영 값: 쓰는 길 '복구1108'(min) · 예상 범위 12,500~16,900");
    ok(/!PUBONLY \|\| \/\^MJ-MAIN\$\/i\.test/.test(SRC), '⓪ 로거(공개 전용 PC)만 · MJ-MAIN은 안 함');

    child = cp.spawn(process.execPath, [HLPF], { env: { ...process.env, RN_TEST_FILE: TF, RN_TEST_HOME: LOC }, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', (c) => (out += c)); child.stderr.on('data', (c) => (out += c));
    let up = false; for (let i = 0; i < 60 && !up; i++) { try { const r = await req('POST', '/lf-ls', '{}', BKH); up = r.status === 200; } catch (e) {} if (!up) await sleep(150); }
    ok(up, '① 도우미가 뜨고 /lf-ls 답함');
    /* ① 도우미 */
    const g1 = await req('GET', '/lf-ls'); ok(g1.status === 403, '① GET은 막힘(브라우저 페이지가 못 읽음)', g1.status);
    const g2 = await req('POST', '/lf-ls', '{}', { 'Content-Type': 'application/json' }); ok(g2.status === 403, '① X-RN-Bk 머리 없으면 막힘', g2.status);
    const ls = pj(await req('POST', '/lf-ls', '{}', BKH)); ok(ls.ok && ls.files.map((f) => f.name).join() === '2026-10-28-full.jsonl,2026-11-08-inc.jsonl,2026-11-17-inc.jsonl', '① 목록 = 날짜-full|inc.jsonl만(다른 파일 뺌) · 이름 차례', ls.files);
    for (const f of ['../x.jsonl', '..%2F..%2Flocal%2Freadnow-local.json', 'state-x.json', '2026-10-28-full.jsonl.bak']) { const r = await req('POST', '/lf-get?f=' + f, '{}', BKH); ok(r.status === 400, `① 이상한 이름 막힘: ${f}`, r.status); }
    const fb = fs.readFileSync(path.join(SRCD, '2026-10-28-full.jsonl')); let off = 0, got = [], k = 0; while (off < fb.length && k++ < 100) { const j = pj(await req('POST', `/lf-get?f=2026-10-28-full.jsonl&off=${off}&len=70000`, '{}', BKH)); if (!j.ok) break; got.push(j.text); if (!(j.next > off)) break; off = j.next; }
    ok(fb.length > 300000 && k > 3 && got.every((t, i) => i === got.length - 1 || t.endsWith('\n')) && Buffer.from(got.join(''), 'utf8').equals(fb), `① 조각 ${k}개로 나눠 읽어도 원본과 바이트까지 같음(줄 끝에서 자름 · 한글 안 깨짐 · ${fb.length.toLocaleString()}바이트)`);
    ok(fs.readFileSync(path.join(SRCD, '2026-10-28-full.jsonl')).equals(fb), '① 읽은 뒤 백업 파일은 그대로');
    const p1 = await req('POST', '/lf-put?run=202611170000&name=test&part=0', 'a\n', BKH); const p2 = await req('POST', '/lf-put?run=202611170000&name=test&part=0', 'b\n', BKH);
    const tf = path.join(BK, 'listfix', '202611170000', 'test-0.jsonl');
    ok(p1.status === 200 && p2.status === 409 && fs.readFileSync(tf, 'utf8') === 'a\n', '① 한 번 쓴 파일은 다시 못 씀(409 · 내용 그대로)', [p1.status, p2.status]);
    ok((fs.statSync(tf).mode & 0o222) === 0, '① 쓴 파일은 읽기 전용');
    ok(/^[0-9a-f]{64}  test-0\.jsonl  2  /.test(fs.readFileSync(path.join(BK, 'listfix', '202611170000', 'SHA256.txt'), 'utf8')), '① SHA256.txt에 지문·이름·크기');
    for (const q of ['run=../../x&name=a', 'run=202611170000&name=../a', 'run=202611170000&name=A%2Fb']) { const r = await req('POST', '/lf-put?' + q, 'x', BKH); ok(r.status === 400, '① 이상한 회차·이름 막힘: ' + q, r.status); }

    /* ② Firestore 사본 크기: 문서 하나 1MiB 한도 — 상품 문서 통째인 버전도 바이트로 나눔 */
    { const Z = world(); const big = Array.from({ length: 3000 }, (_, i) => ({ id: 'aladin_Z' + i, d: { title: '한글 긴 제목 가나다 '.repeat(40) + i, firstSeenAt: { toMillis: () => OLD } } }));
      const np = await Z.X.lfaKeepFs('202611170001', 'pre', big, '시험'); const ds = [...Z.st.sys.entries()].filter(([k]) => /^listfix_v_202611170001_pre_/.test(k)).sort((a, b) => a[1].part - b[1].part);
      const bytes = ds.map(([, v]) => Buffer.byteLength(v.rows, 'utf8')); const back = ds.flatMap(([, v]) => JSON.parse(v.rows));
      ok(np > 5 && np === ds.length && bytes.every((b) => b < 700000) && back.length === 3000 && back[2999].id === 'aladin_Z2999' && ds.every(([, v]) => v.parts === np), `② Firestore 사본은 바이트로 나눔(${np}문서 · 가장 큰 ${Math.max(...bytes).toLocaleString()}바이트 < 1MiB) · 다시 모으면 3,000줄 그대로`); }
    /* ③ 먼저: 로거가 아니거나 MJ-MAIN이면 안 함 · 도우미 옛 판이면 기다림 · 멈춤 표시 */
    for (const [o, m] of [[{ pub: false }, '로거가 아님'], [{ pc: 'MJ-MAIN' }, 'MJ-MAIN'], [{ hlp: 'http://127.0.0.1:1' }, '도우미 옛 판·꺼짐'], [{ auto: { stop: true } }, '멈춤 표시(stop)']]) {
      const w = world({ ...o, lo: 1, hi: 100 }); if (o.hlp) w.ctx.gmReq = async () => ({ status: 404, responseText: '{"ok":false}' }); await w.X.lfrAuto();
      ok(!w.st.writes.length && !w.st.running.length && !(w.st.sys.get('listfix_auto') || {}).state, `③ ${m} → 아무것도 안 함`, [...w.st.sys.keys()]); }

    /* ③ 예상 범위(운영 값 12,500~16,900) 밖 → 쓰지 않음(held) · 버전은 남김 */
    const H = world(); await H.X.lfrAuto(); const ha = H.st.sys.get('listfix_auto') || {};
    ok(ha.state === 'held' && !H.st.writes.length && !H.st.undo.length && /보고서 ①/.test((ha.warn || []).join()), "③ 고른 상품 12개 = 예상 밖 → 'held' · 상품 기록 안 씀", ha);
    const hv = (H.st.sys.get('listfix_versions') || {}).runs || {}; ok(Object.keys(hv).length === 1 && hv[ha.run] && hv[ha.run].versions.min.건수 === 12, '③ 쓰지 않아도 버전은 남김', Object.keys(hv));
    await H.X.lfrAuto(); ok(H.st.gm.get('rn-lfa-done') === 'held' && (H.st.sys.get('listfix_auto') || {}).tries === 1, '③ held면 다시 하지 않음');

    /* ② 저절로 되돌리기(시험이라 범위를 1~100으로) */
    await sleep(61000 - (Date.now() % 60000)); /* 회차 이름(분 단위)이 위 held 회차와 겹치지 않게 */
    const A = world({ lo: 1, hi: 100 }); await A.X.lfrAuto(); const aa = A.st.sys.get('listfix_auto') || {};
    ok(aa.state === 'done' && aa.done === 12 && A.st.writes.length === 12, "② 끝 — 상품 12개를 '복구1108'로 되돌림", aa);
    ok(A.st.undo.length >= 1 && A.st.undo[0][2] === 0, '② 되돌림 자료를 쓰기 전에 먼저 남김');
    const w4 = A.docs.get(hitIds[0]), w8 = A.docs.get(hitIds[8]); const ms = (v) => (v && v.toMillis ? v.toMillis() : Date.parse(v));
    ok(ms(w4.firstSeenAt) === OLD && ms(w8.firstSeenAt) === OLD + 8000 && w4.registeredAt === '2025-03-01' && w4.qty === 1 && !('registeredYearGuessed' in w4), "② '복구1108': 11/08 사고로 늦어졌던 것도 처음(10/01)으로 · 등록일·수량·연도 추정 표시도", [w4, w8]);
    ok(ms(A.docs.get(ids[50]).firstSeenAt) === OLD + 50000 && !A.st.writes.some(([id]) => !hitIds.includes(id)), '② 덮이지 않은 상품은 안 건드림');
    const dir = path.join(BK, 'listfix', aa.run); const fl = fs.readdirSync(dir).sort();
    ok(['SHA256.txt', 'about-0.json', 'cur-0.jsonl', 'last-0.jsonl', 'min-0.jsonl', 'pre-0.jsonl', 'result-0.json'].every((f) => fl.includes(f)), '② 로거 backup\\listfix\\<회차>에 버전 넷 + 뜻 + 결과 + 지문', fl);
    const ab = JSON.parse(fs.readFileSync(path.join(dir, 'about-0.json'), 'utf8')); const V = ab.versions || {};
    ok(['pre', 'cur', 'last', 'min'].every((k) => V[k] && V[k].뜻 && V[k].건수 != null) && ab.made && ab.backup.files.length === 3 && ab.mode === 'min' && V.min.쓰기 === true && V.last.쓰기 === false, '② about.json: 버전마다 뜻·건수 · 만든 때 · 근거 백업 파일 · 쓴 길', V);
    const L = (f) => fs.readFileSync(path.join(dir, f), 'utf8').trim().split('\n').map((x) => JSON.parse(x));
    const last = L('last-0.jsonl'), min = L('min-0.jsonl'), pre = L('pre-0.jsonl'), cur = L('cur-0.jsonl');
    ok(last[0].about && /'복구'/.test(last[0].about.뜻) && min[0].about && /'복구1108'/.test(min[0].about.뜻) && pre[0].about.version === 'pre' && cur[0].about.version === 'cur', '② 파일마다 첫 줄에 그 버전의 뜻');
    const l0 = last.find((r) => r.id === hitIds[0]), m0 = min.find((r) => r.id === hitIds[0]);
    ok(last.length - 1 === 12 && min.length - 1 === 12 && pre.length - 1 === 12 && cur.length - 1 === N && l0.set.firstSeenAt.__ts === D1108 && m0.set.firstSeenAt.__ts === OLD, "② '복구'(11/08 값)와 '복구1108'(처음 값)이 따로 · 사고 전 12 · 지금 값 300", [l0 && l0.set, m0 && m0.set]);
    ok(l0.before && l0.before.firstSeenAt === iso(HIT), '② 적용 전 지금 값(before)도 남김');
    const vr = ((A.st.sys.get('listfix_versions') || {}).runs || {})[aa.run] || {}; ok(vr.versions && vr.versions.min.건수 === 12 && vr.versions.last.건수 === 12 && /listfix_v_\d{12}_min_0/.test(vr.versions.min.fsDocs) && vr.applied && vr.applied.done === 12, '② Firestore listfix_versions.runs.<회차>에 버전·뜻·건수·결과', vr);
    ok(['pre', 'cur', 'last', 'min'].every((k) => A.st.sys.has(`listfix_v_${aa.run}_${k}_0`)), '② Firestore 버전 사본 문서(회차가 이름에 — 덮을 일 없음)');
    ok(A.st.qchk.length === 1 && A.st.qchk[0].pairs.length === 12, '② 수량을 되돌린 판매 중 상품은 다시 세기 줄에');
    const w0 = A.st.writes.length; await A.X.lfrAuto(); ok(A.st.writes.length === w0 && A.st.gm.get('rn-lfa-done') === 'done', '② 끝나면 다시 하지 않음');
    const A2 = world({ lo: 1, hi: 100, auto: A.st.sys.get('listfix_auto') }); await A2.X.lfrAuto(); ok(!A2.st.writes.length && A2.st.gm.get('rn-lfa-done') === 'done', '② 수집기를 다시 띄워도(기기 기억 없음) Firestore 표시로 다시 안 함');
  } catch (e) { bad++; console.log('  ❌ 오류', e.stack); }
  finally { try { child && child.kill(); } catch (e) {} if (bad) console.log(out.split('\n').slice(-20).join('\n')); try { fs.rmSync(HOME, { recursive: true, force: true }); } catch (e) {} }
  console.log(bad ? `❌ tLFAUTO1117 실패 ${bad}` : '✅ tLFAUTO1117 통과'); process.exit(bad ? 1 : 0);
})();
