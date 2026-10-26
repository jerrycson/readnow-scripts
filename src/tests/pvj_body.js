const LL = (n) => `https://image.aladin.co.kr/product/1/2/letslook/97_t${n}.jpg`;
const store = { prd_listings: {
  aladin_A: { listingId: '1', usedCode: 'A', bookId: 'bk1', active: true, photos: [{ src: LL(1), stored: 'img/listing/A/2.jpg' }], photosAt: 't' }, // ② 옮김
  aladin_B: { listingId: '2', usedCode: 'B', bookId: 'bk1', active: true }, // ③ 같은 책 → 경로 함께
  aladin_C: { listingId: '3', usedCode: 'C', bookId: 'bk2', active: false }, // ④ 화면에서 받음
  aladin_D: { listingId: '4', usedCode: 'D', bookId: 'bk2', active: true, previews: [], previewsAt: 'x', previewsStatus: 'none' }, // 건너뜀
  aladin_E: { listingId: '5', usedCode: 'E', isbn13: '9790000000001', active: true }, // 미리보기 없음
}, app_settings: {}, prd_jobs: {} };
const writes = []; const C = (c) => ({ doc: (id) => ({ get: async () => ({ exists: !!store[c][id], data: () => JSON.parse(JSON.stringify(store[c][id] || {})) }), set: async (v, o) => { writes.push([c, id, Object.keys(v).join(',')]); store[c][id] = { ...(store[c][id] || {}), ...v }; return true; } }) });
const LISTINGS = new Map(Object.entries(JSON.parse(JSON.stringify(store.prd_listings))));
const pages = { 1: [], 2: [], 3: [LL(2), LL(1)], 5: [] };
const getDoc = async (u) => { const id = u.match(/ItemId=(\d+)/)[1]; const html = `<link rel="canonical" href="https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${id}"><div id="swiper-container-cover">${(pages[id] || []).map((s) => `<img src="${s}">`).join('')}</div>`; return { doc: new DOMParser().parseFromString(html, 'text/html') }; };
let prog0 = null; const put = []; const storage = { ref: (p) => ({ put: async () => put.push(p) }) };
const P = window.ReadnowProducts; const env = { P, acquireLane: async () => ({ ok: true }), releaseLane: async () => {}, loadListings: async () => LISTINGS, LISTINGS, loadProgress: async () => prog0, saveProgress: async (n, p) => { prog0 = p; }, finishJob: async (n, s) => { env.fin = s; }, C, W: () => ({ uploadedAt: 1 }), nowIso: () => '2026-10-26T12:00:00Z', FORCE_ALL: false, stopFlag: false, ui: () => {}, log: (m) => console.log(m), sleep: async () => {}, getDoc, gmBlob: async () => ({ size: 1000, type: 'image/jpeg' }), storage, thumb: async () => ({}), lockMsg: () => '', PC_NAME: 'T' };
const f = new Function(...Object.keys(env), code + '; return previewsJob;')(...Object.values(env));
return (async () => { await f(); const L = store.prd_listings;
  console.log(JSON.stringify(env.fin)); console.log(put.join(' '));
  const ok = L.aladin_A.previewsFrom === 'photos' && L.aladin_B.previewsFrom === 'book' && L.aladin_B.previews[0].stored === 'img/listing/A/2.jpg' && L.aladin_C.previewsFrom === 'page' && L.aladin_C.previews.map((x) => x.n).join() === '1,2' && L.aladin_C.previews[0].stored === 'img/preview/bk2/1.jpg' && L.aladin_D.previewsStatus === 'none' && !writes.some((w) => w[1] === 'aladin_D') && L.aladin_E.previewsStatus === 'none' && env.fin.page === 1 && env.fin.moved === 1 && env.fin.shared === 1 && store.app_settings.previews_job.status === 'done' && !L.aladin_A.photos[0].kind;
  return [env.fin, put, ok, L.aladin_C.previews]; })()
