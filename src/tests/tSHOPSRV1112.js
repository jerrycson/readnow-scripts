// tSHOPSRV1112 — (11/12 shopsrv) 🛍 우리숍 전용 서버 readnow-shop(정범님 11/12 밤 결정 · 돈 허락)
//   ① 진입 파일(cloud/shop-main.js): index.js·크롬(puppeteer)·수집 일을 읽지 않음 · 숍 주소만 받음 · /healthz·/shop/ping에 서비스 이름 · 응답 머리 X-RN-Srv
//   ② 숍 전용 모드(bg:false): 표지 대표색 셈·책등 규칙 주소 묻기(쓰기 뒷일)를 하지 않고 표지 셈 결과만 읽음 · 주문(트랜잭션)은 그대로 · 원래 서비스(기본)는 뒷일 그대로
//   ③ Hosting 넘김 대신 길(hosting/deploy.js resolveRuns): 새 서비스가 /healthz로 답할 때만 그리로 · 아니면 readnow-cloud · REST 설정엔 probe·fallback 칸이 안 나감
//   ④ 배포 작업(.github/workflows/deploy-cloud.yml shop 일)·손님 화면(shop/shop.js pickApi)·비용 기록·진단(cloud/index.js) 글 확인
//   ⑤ 원래 서비스가 죽어도: 숍 전용 서버는 다른 프로세스 — 원래 서버를 꺼도 숍 서버가 계속 답함(가짜 Firestore · 한 상자 안 두 서버)
// 실행: node src/tests/tSHOPSRV1112.js · 손님 정보 없음(손님A · 010-0000-0000)
const fs = require('fs'); const path = require('path'); const http = require('http'); const vm = require('vm'); const { execFileSync } = require('child_process');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const R = (p) => path.join(ROOT, p);
(async () => {
console.log('① 진입 파일이 가벼움');
{ const out = execFileSync(process.execPath, ['-e', `require(${JSON.stringify(R('cloud/shop-main.js'))}); const k = Object.keys(require.cache); console.log(JSON.stringify({ idx: k.some((x) => /cloud[\\\\/]index\\.js$/.test(x)), pup: k.some((x) => /puppeteer/.test(x)), fa: k.some((x) => /firebase-admin/.test(x)), n: k.length }))`], { encoding: 'utf8' });
  const j = JSON.parse(out.trim().split('\n').pop()); ok(!j.idx && !j.pup && !j.fa, '시험으로 불러도(require.main 아님) index.js·크롬·firebase-admin을 읽지 않음 · 읽은 파일 ' + j.n + '개', j);
  const src = fs.readFileSync(R('cloud/shop-main.js'), 'utf8'); ok(!/require\(['"]\.\/index/.test(src) && !/puppeteer|ALADIN|TICK_KEY/.test(src), '진입 파일에 수집기·알라딘 계정·예약 열쇠 없음');
  ok(/COPY \*\.js \.\//.test(fs.readFileSync(R('cloud/Dockerfile'), 'utf8')), '같은 이미지에 shop-main.js가 들어감(Dockerfile COPY *.js)'); }

console.log('② 가짜 Firestore로 두 서버(숍 전용 · 원래)');
const store = {}; const col = (n) => (store[n] = store[n] || {}); const clone = (x) => JSON.parse(JSON.stringify(x)); const reads = {}; const writes = {};
const FV = { serverTimestamp: () => new Date().toISOString(), arrayUnion: (...a) => ({ __au: a }) }; const merge = (cur, v) => { const o = { ...(cur || {}) }; for (const [k, x] of Object.entries(v)) o[k] = x && x.__au ? [...(o[k] || []), ...x.__au] : x; return o; };
const snap = (n, id) => { const d = col(n)[id]; return { id, exists: d != null, data: () => (d == null ? undefined : clone(d)), ref: ref(n, id) }; };
function ref(n, id) { return { _n: n, id, get: async () => snap(n, id), set: async (v, o) => { writes[n] = (writes[n] || 0) + 1; col(n)[id] = o && o.merge ? merge(col(n)[id], v) : merge({}, v); } }; }
const C = (n) => { const q = (flt) => ({ where: (f, op, v) => q([...flt, [f, op, v]]), select: () => q(flt), get: async () => { reads[n] = (reads[n] || 0) + 1; const docs = Object.keys(col(n)).filter((id) => flt.every(([f, op, v]) => { const x = col(n)[id][f]; return op === '==' ? x === v : op === '>' ? String(x) > String(v instanceof Date ? v.toISOString() : v) : true; })).map((id) => snap(n, id)); return { size: docs.length, forEach: (f) => docs.forEach(f) }; } }); return { ...q([]), doc: (id) => ref(n, id) }; };
const db = { getAll: async (...r) => r.map((x) => snap(x._n, x.id)), runTransaction: async (fn) => { const W = []; await fn({ get: (r) => r.get(), getAll: async (...r) => r.map((x) => snap(x._n, x.id)), set: (r, v, o) => W.push(() => r.set(v, o)) }); for (const w of W) await w(); } };
const L0 = (o) => ({ status: '판매중', active: true, qty: 1, grade: '상', ...o });
for (let i = 1; i <= 4; i++) { col('prd_listings')['aladin_S' + i] = L0({ title: '시험 책 ' + i, sku: 'A01BC12' + i + 'PK', bookId: 'sb' + i, isbn13: '978890000001' + i, price: 4000 + i * 1000 }); col('prd_books')['sb' + i] = { title: '시험 책 ' + i, author: '지은이', publisher: '출판사', pubDate: '2020-01-01', priceList: 15000, categories: [{ path: '국내도서>소설' }], images: { front: { stored: 'img/sb' + i + '/front.jpg', src: 'https://image.aladin.co.kr/product/1/1/cover/k' + i + '_1.jpg' } } }; }
col('app_settings').shop = { open: 1, shipFee: 3500, payDays: 2, bank: { name: '시험은행', acct: '000-000', holder: '가게' }, biz: { name: '가게' } };
const fetched = []; const realFetch = global.fetch; global.fetch = async (u, o) => { if (/^http:\/\/127\.0\.0\.1/.test(String(u))) return realFetch(u, o); fetched.push(String(u)); throw new Error('시험: 밖으로 안 나감'); };
const SM = require(R('cloud/shop-main.js')); const SH = require(R('cloud/shop.js'));
process.env.K_SERVICE = 'readnow-shop'; const A = SM.makeServer({ db, C, FV, log: () => {}, bucket: () => ({ file: () => ({ download: async () => { throw new Error('No such object'); } }) }) }); delete process.env.K_SERVICE;
process.env.K_SERVICE = 'readnow-cloud'; const ORIG = SH.makeShop({ db, C, FV, log: () => {} }); delete process.env.K_SERVICE;
const orig = http.createServer(async (req, res) => { const p0 = req.url.split('?')[0]; if (p0 === '/boom') { res.end('x'); setImmediate(() => orig.close()); return; } if (await ORIG.handle(req, res, p0)) return; res.writeHead(404); res.end(); });
await new Promise((r) => A.server.listen(0, '127.0.0.1', r)); await new Promise((r) => orig.listen(0, '127.0.0.1', r));
const bA = 'http://127.0.0.1:' + A.server.address().port, bO = 'http://127.0.0.1:' + orig.address().port;
const G = async (b, p, o) => { const r = await realFetch(b + p, { headers: { Origin: 'https://booksqueen.com', ...(o ? { 'Content-Type': 'application/json' } : {}) }, ...(o ? { method: 'POST', body: JSON.stringify(o) } : {}) }); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) {} return { s: r.status, h: r.headers, j }; };
{ const h = await G(bA, '/healthz'); ok(h.s === 200 && h.j.srv === 'readnow-shop' && h.j.bg === 0 && h.h.get('x-rn-srv') === 'readnow-shop' && h.j.mem && h.j.req.n >= 1, '/healthz: 서비스 이름·뒷일 끔·요청 수·메모리', h.j);
  const p = await G(bA, '/shop/ping'); ok(p.s === 200 && p.j.srv === 'readnow-shop' && p.h.get('access-control-allow-origin') === 'https://booksqueen.com' && p.h.get('cache-control') === 'no-store', '/shop/ping: 서비스 이름 · booksqueen.com 출처 허락 · 저장 안 함', p.j);
  const c = await G(bA, '/shop/cfg'); ok(c.s === 200 && c.j.n === 4 && c.h.get('x-rn-srv') === 'readnow-shop', '/shop/cfg: 판매 4권 · 응답 머리 X-RN-Srv: readnow-shop');
  const sh = await G(bA, '/shop/shelf?k=0'); ok(sh.s === 200 && sh.j.rows.length === 4, '서가 첫 묶음 4권');
  const n404 = await G(bA, '/tick'); const n2 = await G(bA, '/diag?x=1'); ok(n404.s === 404 && n2.s === 404 && /숍 주소만/.test(n404.j.err), '수집·진단 주소(/tick·/diag)는 없음(404)');
  const o = await G(bA, '/shop/order', { items: ['aladin_S1'], buyer: { name: '손님A', phone: '010-0000-0000' }, rcv: { zip: '06000', addr1: '어딘가 1길', addr2: '1호', memo: '' }, agree: { privacy: true, terms: true } });
  ok(o.s === 200 && /^BQ/.test(o.j.no) && col('shop_holds').aladin_S1 && col('shop_holds').aladin_S1.on === 1 && col('shop_orders')[o.j.no].writer === 'cloud-shop', '주문 접수(트랜잭션 · 주문 중 표) — 숍 전용 서버에서 그대로', o.j);
  const o2 = await G(bO, '/shop/order', { items: ['aladin_S1'], buyer: { name: '손님A', phone: '010-0000-0000' }, rcv: { zip: '06000', addr1: '어딘가 1길', addr2: '1호', memo: '' }, agree: { privacy: true, terms: true } });
  ok(o2.s === 409, '두 서버가 함께 받아도 같은 책 두 주문 0(원래 서버로 온 둘째 주문 막힘 · Firestore 트랜잭션)'); }
{ ok(A.SHOP.BG === false && ORIG.BG === true, '숍 전용 = 뒷일 끔 · 원래 서비스 = 뒷일 그대로(기본)');
  ok(!writes.shop_cover && !writes.shop_spinetry && !Object.keys(col('prd_books')).some((k) => col('prd_books')[k].images.spine), '숍 전용 서버는 서가를 불러도 표지 셈·책등 묻기 쓰기 0');
  ok(!fetched.some((u) => /aladin|firebasestorage/.test(u)), '숍 전용 서버는 알라딘 책등 주소를 묻지 않음(밖으로 나간 요청 ' + fetched.length + ')', fetched);
  ok((reads.shop_cover || 0) >= 1, '표지 대표색 결과(shop_cover)는 읽음 — 서가 책등 색 그대로'); }
console.log('⑤ 원래 서버가 꺼져도 숍 서버는 답함');
{ await G(bO, '/boom').catch(() => {}); await new Promise((r) => setTimeout(r, 100)); let dead = false; try { await realFetch(bO + '/shop/cfg'); } catch (e) { dead = true; }
  const c = await G(bA, '/shop/list'); ok(dead && c.s === 200 && c.j.items.length >= 3, '원래 서버(수집 쪽) 꺼짐 → 숍 전용 서버 목록 그대로'); }
A.server.close();

console.log('③ Hosting 넘김 대신 길');
{ const DEP = require(R('hosting/deploy.js')); const conf = JSON.parse(fs.readFileSync(R('hosting/shop.json'), 'utf8'));
  ok(conf.rewrites.length === 3 && conf.rewrites.every((x) => x.run.serviceId === 'readnow-shop' && x.run.fallback === 'readnow-cloud' && /readnow-shop-63884079760\.asia-northeast3\.run\.app\/healthz$/.test(x.run.probe)), 'shop.json: 세 넘김 모두 readnow-shop · 대신 readnow-cloud · probe /healthz');
  const RC = DEP.restConfig(conf); ok(RC.rewrites.every((x) => Object.keys(x.run).sort().join() === 'region,serviceId'), 'REST 설정엔 serviceId·region만(probe·fallback 안 나감)');
  const fk = (st, srv) => async () => ({ status: st, json: async () => (srv ? { ok: true, srv } : null) });
  let r = await DEP.resolveRuns(conf, { fetch: fk(200, 'readnow-shop'), waitS: 0 }); ok(!r.fellBack && r.conf.rewrites.every((x) => x.run.serviceId === 'readnow-shop'), '새 서비스가 답하면 그리로');
  r = await DEP.resolveRuns(conf, { fetch: fk(403), waitS: 0 }); ok(r.fellBack && r.conf.rewrites.every((x) => x.run.serviceId === 'readnow-cloud') && /403/.test(r.notes[0]), '공개 안 됨(403)이면 원래 서비스로', r.notes);
  r = await DEP.resolveRuns(conf, { fetch: fk(200, 'readnow-cloud'), waitS: 0 }); ok(r.fellBack, '다른 서비스가 답하면(이름이 다름) 원래 서비스로');
  r = await DEP.resolveRuns(conf, { fetch: async () => { throw new Error('연결 안 됨'); }, waitS: 0 }); ok(r.fellBack, '연결 실패면 원래 서비스로');
  let n = 0; r = await DEP.resolveRuns(conf, { fetch: async () => (++n < 3 ? { status: 404, json: async () => null } : { status: 200, json: async () => ({ srv: 'readnow-shop' }) }), waitS: 1, stepMs: 10 }); ok(!r.fellBack && n === 3, 'RUN_WAIT_S 동안 기다렸다 새 서비스가 뜨면 그리로(같은 주소는 한 번만 물음: ' + n + '번)');
  const plain = await DEP.resolveRuns({ rewrites: [{ source: '/x', run: { serviceId: 'readnow-cloud' } }] }, { fetch: fk(500), waitS: 0 }); ok(plain.conf.rewrites[0].run.serviceId === 'readnow-cloud' && !plain.fellBack, 'probe 없는 넘김은 그대로'); }

console.log('④ 배포 작업·손님 화면·비용 기록');
{ const y = fs.readFileSync(R('.github/workflows/deploy-cloud.yml'), 'utf8'); const job = y.slice(y.indexOf('\n  shop:'));
  ok(/needs: deploy/.test(job) && /needs\.deploy\.outputs\.deployed == 'true'/.test(job) && /deployed: "\$\{\{ steps\.ver\.outcome == 'success' \}\}"/.test(y) && /id: ver/.test(y), '클라우드 새 판이 확인된 뒤에만 숍 전용 서버 배포');
  for (const [re, m] of [[/--image "\$IMG"/, '같은 이미지'], [/--args="--max-old-space-size=700,shop-main\.js"/, '명령 = node shop-main.js'], [/--min-instances 0 --max-instances 3/, '최소 0 · 최대 3'], [/--cpu-boost/, '켤 때 CPU 부스트'], [/--concurrency 40/, '동시 40'], [/--memory 1Gi --cpu 1/, '1 vCPU · 1GiB'], [/RN_ROLE=shop/, '역할 표시'], [/--allow-unauthenticated/, '공개 시도'], [/add-iam-policy-binding "\$SHOP_SVC"[^\n]*allUsers/, '공개 다시 시도'], [/gh workflow run deploy-shop\.yml/, '넘김 다시(우리숍 내기)'], [/ROUTED != '1'/, '아직 안 넘어갔을 때만']]) ok(re.test(job), '배포: ' + m);
  ok(!/set-secrets/.test(job) && !/ALADIN/.test(job), '숍 전용 서버엔 알라딘 비밀을 넣지 않음');
  ok(/actions: write/.test(job) && /id-token: write/.test(job), '그 일만 actions: write(우리숍 내기 다시 돌림)');
  const sj = fs.readFileSync(R('shop/shop.js'), 'utf8'); ok(/API_SHOP = 'https:\/\/readnow-shop-63884079760\.asia-northeast3\.run\.app'/.test(sj) && /if \(!\(get && SAME\.on\)\) await pickApi\(\);/.test(sj), '손님 화면: 주문·로그인(POST) 전에 숍 전용 서버를 먼저 봄');
  ok(/shop\.js\?v=0\.1\.9/.test(fs.readFileSync(R('shop/index.html'), 'utf8')), '손님 화면 파일 판 표시 0.1.9(새로 받게)');
  /* pickApi 동작 — shop.js에서 그 부분만 떼어 돌림 */
  const a = sj.indexOf('  const API_CLOUD'), b = sj.indexOf('  const $ = (s, r)'); const part = sj.slice(a, b);
  const run = async (fx, ss, bqApi) => { const S = { window: bqApi ? { BQ_API: bqApi } : {}, fetch: fx, AbortController, setTimeout, clearTimeout, sessionStorage: ss || { getItem: () => null, setItem: () => {} }, JSON, Date, Promise, out: null }; vm.createContext(S); vm.runInContext(part + '\nout = { pickApi, get: () => API };', S); await S.out.pickApi(); return S.out.get(); };
  const fx = (j) => async () => ({ json: async () => j });
  ok(await run(fx({ ok: true, srv: 'readnow-shop' })) === 'https://readnow-shop-63884079760.asia-northeast3.run.app', '숍 전용 서버가 답하면 그 주소');
  ok(await run(async () => { throw new TypeError('Failed to fetch'); }) === 'https://readnow-cloud-63884079760.asia-northeast3.run.app', '답이 없거나 막히면(공개 안 됨 — CORS 실패) 원래 주소');
  ok(await run(fx({ ok: true, srv: 'readnow-cloud' })) === 'https://readnow-cloud-63884079760.asia-northeast3.run.app', '다른 서비스 이름이면 원래 주소');
  let asked = 0; ok(await run(async () => { asked++; return { json: async () => ({}) }; }, { getItem: () => JSON.stringify({ u: 'https://readnow-shop-63884079760.asia-northeast3.run.app', at: Date.now() }), setItem() {} }) === 'https://readnow-shop-63884079760.asia-northeast3.run.app' && asked === 0, '10분 안엔 기억한 주소(다시 안 물음)');
  ok(await run(async () => { throw new Error('x'); }, null, 'http://시험') === 'http://시험', 'BQ_API를 정하면 그대로(시험·데모)');
  const ix = fs.readFileSync(R('cloud/index.js'), 'utf8');
  ok(/service_name="readnow-shop"/.test(ix) && /L\('run_shop'/.test(ix), '비용 기록(costs_auto)에 🛍 우리숍 전용 서버 줄');
  ok(/if \(q\.shopsrv\)/.test(ix) && /monthUsdEst/.test(ix), '진단 shopsrv=1: 날마다 요청 수·인스턴스 시간·어림 비용');
  ok(/setInterval\(\(\) => SHOP\.build\(\)\.catch\(\(\) => \{\}\), 10 \* 60e3\)/.test(ix), '원래 서비스가 목록을 계속 들고 뒷일(표지 셈·책등)을 이어 함'); }
global.fetch = realFetch;
console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e.stack); process.exit(1); });
