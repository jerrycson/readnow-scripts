// 📷 제품 사진 판정·다시 받기 (10/27) — ① 공용 판정 표 ② 수집기 prodPhotosJob(건너뛰기·재사용·표지/미리보기 안 받음·로그인 없이) ③ 웹앱(productPhotos 우선·미리보기 안 섞임·관리도구·기능 찾기)
const fs = require('fs'); const { chromium } = require('playwright'); const W = '/home/claude/w';
const src = fs.readFileSync(W + '/readnow-collector.user.js', 'utf8'); const a = src.indexOf('  const PPJ_REF = '); const b = src.indexOf('  /* 📷 저절로 한 번'); const CODE = src.slice(a, b);
(async () => { let ok = true; const br = await chromium.launch(); const p = await br.newPage(); await p.goto('http://localhost:8765/readnow-products-core.js'); await p.addScriptTag({ url: 'http://localhost:8765/readnow-products-core.js' });
  const r = await p.evaluate(async (CODE) => { const P = window.ReadnowProducts; const out = {};
    // ① 판정 표
    const T = [['https://image.aladin.co.kr/product/31317/40/cover500/scm996008826671.jpg', 'top', 'product'], ['https://image.aladin.co.kr/usedshop/scm996008826671.jpg', 'top', 'product'], ['https://image.aladin.co.kr/product/31317/40/cover500/8954691501_1.jpg', 'top', 'cover'], ['https://image.aladin.co.kr/product/31317/40/letslook/8954691501_t1.jpg', 'top', 'preview'], ['https://image.aladin.co.kr/Community/x/a.jpg', 'desc', 'product'], ['https://image.aladin.co.kr/Community/x/a.jpg', 'top', 'other'], ['https://image.aladin.co.kr/px/12.gif', 'desc', 'px'], ['https://image.aladin.co.kr/img/shop/2018/zz.jpg', 'desc', 'icon'], ['https://image.aladin.co.kr/product/1/2/cover500/x.jpg', 'desc', 'cover'], ['https://image.aladin.co.kr/product/1/2/coversum/scm1234567.jpg', 'search', 'other'], ['//image.aladin.co.kr/img/blank.gif', 'top', 'icon']];
    out.table = T.map(([s, w, k]) => [P.photoKind({ src: s, where: w }), k]).filter(([g, k]) => g !== k);
    out.of = [P.productPhotosOf({ productPhotos: [], photos: [{ src: T[0][0], where: 'top', stored: 'x' }] }).length, P.productPhotosOf({ photos: [{ src: T[0][0], where: 'top', stored: 'x' }, { src: T[2][0], where: 'top', stored: 'y' }, { src: T[3][0], where: 'top', stored: 'z' }] }).length, P.productPhotosOf({ photosFrom: 'search', photos: [{ src: T[0][0], where: 'search' }] }).length].join(',');
    // ② 수집기 일
    const COV = 'https://image.aladin.co.kr/product/1/2/cover500/8901234567_1.jpg', LET = 'https://image.aladin.co.kr/product/1/2/letslook/8901234567_t1.jpg', SCMs = '//image.aladin.co.kr/product/1/2/coversum/scm996008111.jpg', DESC = 'https://image.aladin.co.kr/Community/x/a.jpg', PX = 'https://image.aladin.co.kr/px/7.gif';
    const store = { prd_listings: {
      aladin_U1: { listingId: '11', usedCode: 'U1', active: true, title: '하나', photos: [{ src: COV, where: 'top', stored: 'img/listing/U1/1.jpg' }, { src: 'https://image.aladin.co.kr/product/1/2/cover500/scm996008111.jpg', where: 'top', stored: 'img/listing/U1/2.jpg', thumb: 'img/listing/U1/2_t.webp', bytes: 50 }, { src: LET, where: 'top', stored: 'img/listing/U1/3.jpg' }], photosAt: 't', photosStatus: 'done' },
      aladin_U2: { listingId: '12', usedCode: 'U2', active: true, title: '둘' },
      aladin_U3: { listingId: '13', usedCode: 'U3', active: true, photosV: 2, productPhotos: [], productPhotosStatus: 'none' },
      aladin_U4: { listingId: '14', usedCode: 'U4', active: true },
      aladin_U5: { listingId: '15', usedCode: 'U5', active: false },
      aladin_U6: { listingId: '16', usedCode: 'U6', active: true } }, app_settings: { previews_migrate: { status: 'running' } }, prd_jobs: {} };
    const writes = []; const C = (c) => ({ doc: (id) => ({ get: async () => ({ exists: !!store[c][id], data: () => (store[c][id] ? JSON.parse(JSON.stringify(store[c][id])) : undefined) }), set: async (v) => { writes.push([c, id]); store[c][id] = { ...(store[c][id] || {}), ...JSON.parse(JSON.stringify(v)) }; } }) });
    const LISTINGS = new Map(Object.entries(JSON.parse(JSON.stringify(store.prd_listings)))); const order = []; const opts = []; const blobs = []; const put = [];
    const page = (id, inner) => `<html><head><title>[중고] 책</title><link rel="canonical" href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${id}"></head><body>${inner}</body></html>`;
    const getDoc = async (u, o) => { const id = u.match(/ItemId=(\d+)/)[1]; order.push(id); opts.push(!!(o && o.noLogin)); let html;
      if (id === '11') html = page(id, `<img id="CoverMainImage" src="${COV}"><div id="swiper-container-cover"><div class="swiper-slide"><img src="${LET}"></div><div class="swiper-slide"><img src="${SCMs}"></div></div><div id="usedDecription">깨끗 <img src="${PX}"><img src="${DESC}"></div>`);
      else if (id === '12') html = page(id, `<img id="CoverMainImage" src="${COV}"><div id="swiper-container-cover"><div class="swiper-slide"><img src="${LET}"></div></div><div id="usedDecription">깨끗</div>`);
      else if (id === '14') throw Object.assign(new Error('비공개'), { hidden: true });
      else if (id === '16') throw Object.assign(new Error('19금'), { needLogin: true });
      else html = `<html><head><title>알라딘</title><link rel="canonical" href="https://www.aladin.co.kr/"></head><body></body></html>`;
      return { doc: new DOMParser().parseFromString(html, 'text/html') }; };
    let prog0 = null; const env = { P, PUBONLY: false, acquireLane: async () => ({ ok: true }), releaseLane: async () => {}, loadListings: async () => LISTINGS, LISTINGS, loadProgress: async () => prog0, saveProgress: async (n, pg) => { prog0 = pg; }, finishJob: async (n, s) => { env.fin = s; prog0 = null; }, C, W: () => ({ uploadedAt: 1 }), nowIso: () => '2026-10-27T12:00:00Z', FORCE_ALL: false, stopFlag: false, ui: () => {}, log: () => {}, sleep: async () => {}, getDoc, gmBlob: async (u) => { blobs.push(u); return { size: 900, type: 'image/jpeg' }; }, storage: { ref: (x) => ({ put: async () => put.push(x) }) }, thumb: async () => ({}), lockMsg: () => '', PC_NAME: 'T' };
    const job = new Function(...Object.keys(env), CODE + '; return prodPhotosJob;')(...Object.values(env));
    out.r0 = await job(); out.w0 = writes.length; // 옮기기 전 — 시작 안 함
    store.app_settings.previews_migrate = { status: 'done', doneAt: '2026-10-27T10:00:00Z' };
    out.r1 = await job(); const L = store.prd_listings;
    out.order = order.join(','); out.noLogin = opts.every(Boolean); out.blobs = blobs; out.put = put;
    out.U1 = L.aladin_U1.productPhotos; out.U1v = [L.aladin_U1.photosV, L.aladin_U1.productPhotosStatus, L.aladin_U1.photos.length];
    out.U2 = [L.aladin_U2.photosV, L.aladin_U2.productPhotosStatus, JSON.stringify(L.aladin_U2.productPhotos)];
    out.U3w = writes.filter((w) => w[1] === 'aladin_U3').length; out.U4 = [L.aladin_U4.photosV ?? null, L.aladin_U4.productPhotosTry && L.aladin_U4.productPhotosTry.status];
    out.U5 = [L.aladin_U5.photosV, L.aladin_U5.productPhotosStatus, 'productPhotos' in L.aladin_U5]; out.U6 = [L.aladin_U6.photosV, L.aladin_U6.productPhotosStatus];
    out.st = store.app_settings.pphotos_job; out.fin = env.fin;
    order.length = 0; out.r2 = await job(); out.order2 = order.join(','); out.round2 = store.app_settings.pphotos_job.round;
    return out; }, CODE);
  console.log(JSON.stringify(r, null, 0).slice(0, 2500));
  const t1 = !r.table.length && r.of === '0,1,0'; console.log('① 판정 표', t1 ? '✓' : '❌', JSON.stringify(r.table)); ok = ok && t1;
  const U1 = r.U1 || []; const t2 = r.r0 === 'off' && r.w0 === 0 && r.order === '11,12,14,16,15' && r.noLogin && U1.length === 2 && U1[0].from === 'photos' && U1[0].stored === 'img/listing/U1/2.jpg' && U1[1].from === 'page' && U1[1].stored === 'img/listing/U1/p2.jpg' && U1.every((x) => x.kind === 'product')
    && r.blobs.length === 1 && r.blobs[0] === 'https://image.aladin.co.kr/Community/x/a.jpg' && !r.put.some((x) => !/p\d+(_t)?\.(jpg|webp)$/.test(x)) && r.U1v.join() === '2,done,3'
    && r.U2.join('|') === '2|none|[]' && r.U3w === 0 && r.U4[0] === null && r.U4[1] === 'hidden' && r.U5.join() === '2,nopage,false' && r.U6.join() === '2,gate'
    && r.st.status === 'done' && r.st.retryLeft === 1 && r.fin.ok === 1 && r.fin.none === 1 && r.fin.reused === 1 && r.fin.imgs === 1 && r.fin.skip === 0 && r.order2 === '14' && r.round2 === 2;
  console.log('② 수집기 다시 받기', t2 ? '✓' : '❌'); ok = ok && t2;
  // ②-b 모르는 주소 꼴(unknown) · 규칙이 늘면 저장한 주소만 다시 판정 · 처음 100개 표본 → 30% 넘으면 확인 기다림
  const r2 = await p.evaluate(async (CODE) => { const P0 = window.ReadnowProducts; const out = {};
    const WEIRD = 'https://image.aladin.co.kr/Weird/abc/q.jpg', SCM = '//image.aladin.co.kr/product/1/2/coversum/scm996008222.jpg';
    const mk = (P, store, opts) => { const writes = []; const C = (c) => ({ doc: (id) => ({ get: async () => ({ exists: !!store[c][id], data: () => (store[c][id] ? JSON.parse(JSON.stringify(store[c][id])) : undefined) }), set: async (v) => { writes.push(id); store[c][id] = { ...(store[c][id] || {}), ...JSON.parse(JSON.stringify(v)) }; } }) });
      const LISTINGS = new Map(Object.entries(JSON.parse(JSON.stringify(store.prd_listings)))); const reads = []; const blobs = []; let prog0 = opts.prog || null;
      const getDoc = async (u) => { const id = u.match(/ItemId=(\d+)/)[1]; reads.push(id); const html = `<html><head><title>[중고] 책</title><link rel="canonical" href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${id}"></head><body><img id="CoverMainImage" src="${WEIRD}"><div id="swiper-container-cover"><div class="swiper-slide"><img src="${SCM}"></div></div></body></html>`; return { doc: new DOMParser().parseFromString(html, 'text/html') }; };
      const env = { P, PUBONLY: false, acquireLane: async () => ({ ok: true }), releaseLane: async () => {}, loadListings: async () => LISTINGS, LISTINGS, loadProgress: async () => prog0, saveProgress: async (n, pg) => { prog0 = JSON.parse(JSON.stringify(pg)); }, finishJob: async (n, sm) => { env.fin = sm; prog0 = null; }, C, W: () => ({}), nowIso: () => '2026-10-27T12:00:00Z', FORCE_ALL: !!opts.force, stopFlag: false, ui: () => {}, log: () => {}, sleep: async () => {}, getDoc, gmBlob: async (u) => { blobs.push(u); return { size: 9, type: 'image/jpeg' }; }, storage: { ref: () => ({ put: async () => {} }) }, thumb: async () => ({}), lockMsg: () => '', PC_NAME: 'T' };
      const job = new Function(...Object.keys(env), CODE + '; return prodPhotosJob;')(...Object.values(env)); return { job, reads, blobs, writes, getProg: () => prog0, env }; };
    // (가) 하나: 모르는 꼴 → 받지 않고 주소만
    const st1 = { prd_listings: { aladin_U7: { listingId: '17', usedCode: 'U7', active: true } }, app_settings: { previews_migrate: { doneAt: 'x' } }, prd_jobs: {} };
    const A = mk(P0, st1, {}); out.a = await A.job(); const L7 = st1.prd_listings.aladin_U7; out.u7 = [L7.productPhotosStatus, L7.photosV ?? null, (L7.productPhotosUnknown || []).map((x) => x.src).join(), (L7.productPhotosSeen || []).length, L7.productPhotosJudgeV, 'productPhotos' in L7, A.blobs.length];
    // 같은 규칙으로 다시 → 화면 안 엶
    const A2 = mk(P0, st1, {}); await A2.job(); out.same = A2.reads.length;
    // (나) 규칙이 늚(PP_V 3 · Weird 꼴 허용) → 화면을 열지 않고 저장 주소만 다시 판정해 받음
    const P3 = { ...P0, PP_V: 3, photoKind: (x, w) => (/\/Weird\//.test(String((x && x.src) || x)) ? 'product' : P0.photoKind(x, w)) }; P3.isProductPhoto = (x, w) => P3.photoKind(x, w) === 'product';
    const B = mk(P3, st1, {}); await B.job(); out.re = [B.reads.length, st1.prd_listings.aladin_U7.productPhotosStatus, st1.prd_listings.aladin_U7.photosV, (st1.prd_listings.aladin_U7.productPhotos || []).length, B.blobs.length, B.env.fin.reJ];
    // (다) 120개 모두 모르는 꼴 → 100개 뒤 확인 기다림 · 사람이 다시 시작(수동)하면 이어감
    const st2 = { prd_listings: {}, app_settings: { previews_migrate: { doneAt: 'x' } }, prd_jobs: {} }; for (let i = 0; i < 120; i++) st2.prd_listings['aladin_H' + i] = { listingId: String(1000 + i), usedCode: 'H' + i, active: true };
    const H = mk(P0, st2, {}); out.h = await H.job(); const J = st2.app_settings.pphotos_job; out.hold = [J.status, J.sample && J.sample.n, J.sample && J.sample.unknown, J.sample && J.sample.rate, J.sample && J.sample.top[0] && J.sample.top[0][0], H.reads.length, H.getProg().i];
    const H2 = mk(P0, st2, { force: true, prog: H.getProg() }); await H2.job(); out.cont = [H2.reads.length, st2.app_settings.pphotos_job.status];
    return out; }, CODE);
  console.log(JSON.stringify(r2));
  const t2b = r2.u7.join('|') === 'unknown||' + 'https://image.aladin.co.kr/Weird/abc/q.jpg|2|2|false|0' && r2.same === 0 && r2.re.join() === '0,done,3,2,2,1' && r2.h === 'hold' && r2.hold.join('|') === 'hold|100|100|100|image.aladin.co.kr/Weird/abc|100|100' && r2.cont.join() === '20,done';
  console.log('②-b 모르는 꼴·다시 판정·표본 멈춤', t2b ? '✓' : '❌'); ok = ok && t2b; await br.close();
  // ③ 웹앱
  await require('./harness.js')(async (pg) => { await pg.evaluate(require('./seed.js')); const errs = []; pg.on('pageerror', (e) => errs.push(e.message));
    const w = await pg.evaluate(async () => { const o = {}; const SCM = 'https://image.aladin.co.kr/product/1/2/cover500/scm996008111.jpg', COV = 'https://image.aladin.co.kr/product/1/2/cover500/8901234567_1.jpg', LET = 'https://image.aladin.co.kr/product/1/2/letslook/8901234567_t1.jpg';
      const raw = { usedCode: 'UH1', listingId: '888001', title: '사진 책', active: true, status: '판매중', photos: [{ src: COV, where: 'top', stored: 'img/listing/UH1/1.jpg' }, { src: LET, where: 'top', stored: 'img/listing/UH1/2.jpg' }, { src: SCM, where: 'top', stored: 'img/listing/UH1/3.jpg' }], productPhotos: [{ src: SCM, where: 'top', stored: 'img/listing/UH1/p1.jpg', kind: 'product' }, { src: 'https://image.aladin.co.kr/Community/x/a.jpg', where: 'desc', stored: 'img/listing/UH1/p2.jpg', kind: 'product' }], photosV: 2 };
      const a1 = slimDoc('prd_listings', JSON.parse(JSON.stringify(raw))); const a2 = slimDoc('prd_listings', a1); o.pp = [a1.photos.map((x) => x.stored).join(), a1._pk, 'productPhotos' in a1, a2.photos.length];
      const b1 = slimDoc('prd_listings', { usedCode: 'UH2', photos: raw.photos.slice() }); o.old = b1.photos.map((x) => x.stored).join(); o.oldPv = b1.pvN;
      const c1 = slimDoc('prd_listings', { usedCode: 'UH3', photosFrom: 'search', photos: [{ src: SCM, where: 'search', stored: 'img/listing/UH3/1.jpg' }] }); o.srch = c1.photos.length;
      S.plist.set('aladin_UH1', { ...a1, id: 'aladin_UH1' }); await openProduct('aladin_UH1'); await new Promise((r) => setTimeout(r, 1000));
      const im = [...document.querySelectorAll('#sheet .pimgs img')]; o.det = [im.filter((x) => x.classList.contains('ppimg')).length, im.filter((x) => /UH1%2F[123]\.jpg/.test(x.getAttribute('src') || '')).length];
      S.uinfo = S.uinfo || new Map(); S.uinfo.set('5551', { note: '', checkedAt: '2026-10-27', found: true, photos: [{ src: 'https://image.aladin.co.kr/px/1.gif', where: 'desc' }, { src: 'https://image.aladin.co.kr/product/1/2/cover500/x.jpg', where: 'desc' }, { src: 'https://image.aladin.co.kr/Community/y/b.jpg', where: 'desc' }] }); o.pq = pqNoteState('5551').ph;
      S.uinfo.set('5552', { note: '깨끗', photos: [{ src: COV, where: 'top' }, { src: SCM, where: 'top' }, { src: LET, where: 'top' }], photoDiff: false }); const at = document.createElement('span'); document.body.appendChild(at); await showUsedInfo('5552', at); const bx = document.querySelector('.uipop'); o.ui = [bx.querySelectorAll('img').length, [...bx.querySelectorAll('img')].filter((x) => /B0322A/i.test(x.getAttribute('style'))).length, /다른 사진 있음/.test(bx.textContent)]; bx.remove();
      window.__FS.app_settings = window.__FS.app_settings || {}; window.__FS.app_settings.previews_migrate = { status: 'done', doneAt: '2026-10-27T10:00:00Z', moved: 5 }; window.__FS.app_settings.pphotos_job = { status: 'running', i: 1000, n: 26000, ok: 300, none: 600, nopage: 50, imgs: 280, reused: 40, msPer: 3000, pc: 'JS-MAIN', at: '2026-10-27T12:00:00Z' };
      await ppMgrLoad(true); const h = ppMgrHtml(); o.mgr = [/1,000 \/ 26,000/.test(h), /남은 시간 약/.test(h), /하루 최대 약 28,800개/.test(h), /data-req="prodPhotos"/.test(h), /✅ 끝/.test(h)];
      window.__FS.app_settings.pphotos_job = { status: 'hold', i: 100, n: 26000, unknown: 90, sample: { n: 100, done: 5, none: 5, unknown: 90, rate: 90, top: [['image.aladin.co.kr/Weird/abc', 90]] }, at: '2026-10-27T12:00:00Z' }; await ppMgrLoad(true); const h2 = ppMgrHtml(); o.hold = /확인 기다림/.test(h2) && /image\.aladin\.co\.kr\/Weird\/abc/.test(h2) && /모르는 꼴 90/.test(h2);
      o.feat = FEAT.filter((x) => /📷 제품 사진 다시 받기/.test(x.t)).length; o.man = /📷 제품 사진 다시 받기 — 판매자가 올린 제품 사진만/.test(document.documentElement.innerHTML) || typeof sec2 === 'function'; return o; });
    console.log('web', JSON.stringify(w));
    const t3 = w.pp[0] === 'img/listing/UH1/p1.jpg,img/listing/UH1/p2.jpg' && w.pp[1] === 2 && !w.pp[2] && w.pp[3] === 2 && w.old === 'img/listing/UH1/3.jpg' && w.oldPv === 1 && w.srch === 0 && w.det[0] === 2 && w.det[1] === 0 && w.pq === 1 && w.ui.join() === '2,1,true' && w.mgr.every(Boolean) && w.hold && w.feat === 1;
    console.log('③ 웹앱', t3 ? '✓' : '❌', errs.join(' | ')); ok = ok && t3 && !errs.length; });
  console.log(ok ? '✓ tH 통과' : '❌ tH 실패'); })();
