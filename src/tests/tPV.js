// 📖 미리보기(letslook) — 제품 사진과 따로 · 넘겨 보기 · 관리도구 칸 · 유의 사항 사진 거르기
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const LL = (n) => `https://image.aladin.co.kr/product/31317/40/letslook/8954691501_t${n}.jpg`;
  const r = await p.evaluate(async (LS) => { const out = {};
    // ① 서버 기록(원 주소 있음) → 기기에 둘 때: 제품 사진에서 미리보기를 빼고 쪽 수만
    const raw = { usedCode: 'UPV1', listingId: '777001', title: '미리보기 책', bookId: 'bkpv', isbn13: '9788954691501', active: true, status: '판매중',
      photos: [{ src: 'https://image.aladin.co.kr/product/31317/40/cover500/scm996008x.jpg', where: 'top', stored: 'img/listing/UPV1/1.jpg', thumb: 'img/listing/UPV1/1_t.webp' }, { src: LS[2], where: 'top', stored: 'img/listing/UPV1/2.jpg', thumb: 'img/listing/UPV1/2_t.webp' }, { src: LS[1], where: 'top', stored: 'img/listing/UPV1/3.jpg' }, { src: LS[3], where: 'top', stored: 'img/listing/UPV1/4.jpg' }], photosAt: '2026-10-20T00:00:00Z' };
    const a = slimDoc('prd_listings', JSON.parse(JSON.stringify(raw))); out.a = { ph: a.photos.length, pvN: a.pvN, hasPv: 'previews' in a };
    const a2 = slimDoc('prd_listings', a); out.a2 = { ph: a2.photos.length, pvN: a2.pvN }; // 두 번 해도 같음
    // ② previews 칸이 있고 photos는 이미 가볍게 한(주소 없는) 보관본 → 저장 경로로 가려냄
    const b = slimDoc('prd_listings', { usedCode: 'UPV2', photos: [{ stored: 'img/listing/UPV2/1.jpg' }, { stored: 'img/listing/UPV2/2.jpg' }], previews: [{ src: LS[1], stored: 'img/listing/UPV2/2.jpg', n: 1 }], previewsAt: 'x', previewsStatus: 'done' }); out.b = { ph: b.photos.length, pvN: b.pvN, keys: Object.keys(b).filter((k) => /^preview/.test(k)) };
    // ③ 미리보기 없는 상품은 그대로
    const c0 = { usedCode: 'UPV3', photos: [{ stored: 'img/listing/UPV3/1.jpg' }] }; out.c = slimDoc('prd_listings', c0).pvN === undefined;
    // 서버(가짜)에 원 기록 · 기기에는 가볍게 한 것
    window.__FS.prd_listings = window.__FS.prd_listings || {}; window.__FS.prd_listings.aladin_UPV1 = raw; S.plist.set('aladin_UPV1', { ...a, id: 'aladin_UPV1' });
    // 공용 파일
    const P = window.ReadnowProducts; out.core = { pg: P.pvPageNo(LS[12]), from: P.previewsFromPhotos(raw.photos, raw.photosAt).map((x) => x.n).join(','), prod: P.productPhotos(raw.photos).length, isPv: P.isPreviewPhoto({ kind: 'preview' }) && !P.isPreviewPhoto({ src: 'a/cover500/b.jpg' }) };
    const d = new DOMParser().parseFromString(`<img id="CoverMainImage" src="//image.aladin.co.kr/product/1/2/cover500/x.jpg"><div id="swiper-container-cover"><div class="swiper-slide"><img src="${LS[2]}"></div><div class="swiper-slide"><img src="${LS[1]}"></div><div class="swiper-slide"><img src="${LS[1]}"></div></div>`, 'text/html');
    out.core.parse = P.parseUsedItemPreviews(d).map((x) => x.n).join(','); out.core.photos = P.parseUsedItemPhotos(d).length;
    return out; }, [null, LL(1), LL(2), LL(3), null, null, null, null, null, null, null, null, LL(12)]);
  console.log(JSON.stringify(r));
  let ok = r.a.ph === 1 && r.a.pvN === 3 && !r.a.hasPv && r.a2.ph === 1 && r.a2.pvN === 3 && r.b.ph === 0 /* (10/27 📷) 원 주소 없는 예전 보관본 사진은 판정할 수 없어 제품 사진으로 안 보임 */ && r.b.pvN === 1 && !r.b.keys.length && r.c && r.core.pg === 12 && r.core.from === '1,2,3' && r.core.prod === 1 && r.core.isPv && r.core.parse === '1,2' && r.core.photos === 1;
  // ④ 상품 상세: 사진 칸에 미리보기 없음 · 📖 칸 · 넘겨 보기
  await p.evaluate(() => openProduct('aladin_UPV1')); await p.waitForTimeout(1200);
  const d1 = await p.evaluate(() => ({ imgs: document.querySelectorAll('#sheet .pimgs img').length, card: !!document.querySelector('#sheet .pvcard'), txt: (document.querySelector('#sheet .pvcard') || {}).textContent || '' }));
  console.log('detail', JSON.stringify(d1)); ok = ok && d1.imgs === 1 && d1.card && /3쪽/.test(d1.txt);
  await p.click('#sheet [data-pvopen]'); await p.waitForTimeout(600);
  const no = () => p.evaluate(() => (document.querySelector('#pvv .pvv-no') || {}).textContent || null);
  const v1 = await no(); await p.keyboard.press('ArrowRight'); const v2 = await no(); await p.keyboard.press('End'); const v3 = await no(); await p.keyboard.press('ArrowRight'); const v3b = await no();
  await p.click('#pvv [data-pvi="0"]'); const v4 = await no(); await p.click('#pvv [data-pvgo="1"]'); const v5 = await no();
  const th = await p.evaluate(() => ({ n: document.querySelectorAll('#pvv .pvv-strip button').length, src: document.querySelector('#pvv .pvv-pg img').getAttribute('src') }));
  await p.click('#pvv [data-pvz]'); const zoom = await p.evaluate(() => document.getElementById('pvv').classList.contains('zoom'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(200); const closed = await p.evaluate(() => !document.getElementById('pvv') && document.getElementById('sheet').classList.contains('on'));
  console.log('viewer', v1, v2, v3, v3b, v4, v5, JSON.stringify(th), zoom, closed);
  ok = ok && v1 === '1 / 3쪽' && v2 === '2 / 3쪽' && v3 === '3 / 3쪽' && v3b === '3 / 3쪽' && v4 === '1 / 3쪽' && v5 === '2 / 3쪽' && th.n === 3 && /UPV1%2F2\.jpg|UPV1%2F3\.jpg/.test(th.src) && zoom && closed;
  // 같은 단추로 닫기 · 어두운 곳 누르기로 닫기
  await p.click('#sheet [data-pvopen]'); await p.waitForTimeout(400); await p.evaluate(() => document.querySelector('#sheet [data-pvopen]').click()); const c1 = await p.evaluate(() => !document.getElementById('pvv'));
  await p.click('#sheet [data-pvopen]'); await p.waitForTimeout(400); await p.evaluate(() => document.querySelector('#pvv .pvv-main').dispatchEvent(new MouseEvent('click', { bubbles: true }))); const c2 = await p.evaluate(() => !document.getElementById('pvv'));
  // 휴대폰 밀어 넘기기(터치)
  await p.click('#sheet [data-pvopen]'); await p.waitForTimeout(400); await p.evaluate(() => { const el = document.getElementById('pvv'); const T = (x) => new Touch({ identifier: 1, target: el, clientX: x, clientY: 300 }); el.dispatchEvent(new TouchEvent('touchstart', { touches: [T(300)], changedTouches: [T(300)], bubbles: true })); el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [T(150)], bubbles: true })); });
  const sw = await no(); await p.keyboard.press('Escape');
  console.log('close', c1, c2, 'swipe', sw); ok = ok && c1 && c2 && sw === '2 / 3쪽';
  // ⑤ 유의 사항 사진(?) — 미리보기는 판매자 사진에서 뺌
  const u = await p.evaluate(async (L1) => { S.uinfo = S.uinfo || new Map(); S.uinfo.set('999', { note: '깨끗', photos: [{ src: L1, where: 'top' }, { src: 'https://x/cover500/a.jpg', where: 'top' }], photoDiff: true }); const at = document.createElement('span'); document.body.appendChild(at); await showUsedInfo('999', at); const b = document.querySelector('.uipop'); const r = { n: b.querySelectorAll('img').length, t: b.textContent }; b.remove(); return r; }, LL(1));
  console.log('uinfo', u.n, /미리보기 1장/.test(u.t), /표지와 같음/.test(u.t)); ok = ok && u.n === 1 && /미리보기 1장/.test(u.t) && /표지와 같음/.test(u.t);
  // ⑥ 관리도구 칸
  const m = await p.evaluate(async () => { window.__FS.app_settings = window.__FS.app_settings || {}; window.__FS.app_settings.previews_migrate = { status: 'running', moved: 5, pvImgs: 100, scanned: 900 }; window.__FS.app_settings.previews_job = { status: 'done', at: '2026-10-26T10:00:00Z', pc: 'JS-MAIN', page: 3, imgs: 60, moved: 2, shared: 1 }; await pvMgrLoad(true); return pvMgrHtml(); });
  const mOk = /지금 한 번/.test(m) && /5개 상품/.test(m) && /화면에서 받음 3개/.test(m) && /data-req="previews"/.test(m); console.log('mgr', mOk); ok = ok && mOk;
  // ⑦ 기능 찾기
  const f = await p.evaluate(() => FEAT.filter((x) => /📖 미리보기/.test(x.t)).length); console.log('feat', f); ok = ok && f === 2;
  console.log('errs', errs.join(' | ')); console.log(ok && !errs.length ? '✓ tPV 통과' : '❌ tPV 실패');
});
