/* 📚 (11/12 shelf5) 우리숍 서가 — 쓰인 글자만 잘라 주는 글꼴 창구 GET /shop/font?f=<별칭>&t=<글자>
 *  까닭: Google Fonts 한글 글꼴(37 집안)은 다 썼음 · 더 늘릴 상업 무료 글꼴(shop/FONTS_LICENSE.md 2절)은 한 파일이 0.2~1.5MB라 손님 화면이 통째로 받으면 느림
 *   → Google Fonts의 text= 처럼 '그 책장에 쓰인 글자만' 잘라 woff2로 돌려줌(보통 수 KB~수십 KB)
 *  자르기: subset-font(BSD-3 · harfbuzz wasm — MIT) · 원본: npm 꾸러미의 woff2를 jsDelivr(없으면 unpkg) CDN에서 한 번 받아 메모리에(판 번호 고정 — 받는 파일이 바뀌지 않음)
 *  가볍게: 원본은 최근 4개·합 48MB까지 · 잘라 낸 결과는 최근 400개·합 12MB까지 · 응답은 1년 캐시(같은 글자 묶음은 브라우저·CDN이 다시 묻지 않음)
 *  ⚠ 목록(LIST)은 shop/shelf-core.js FONTS 51번부터와 같은 별칭 — 둘 다 '뒤에 덧붙이기만'(저장된 책등 글꼴 번호가 바뀌지 않게)
 *  라이선스: 모두 SIL Open Font License 1.1 — 상업 사용·웹 삽입·잘라 쓰기(부분 글꼴) 자유 · 근거는 shop/FONTS_LICENSE.md */
'use strict';
/* 별칭 → [npm 꾸러미@판, 꾸러미 안 woff2 길, 굵기] */
const LIST = {
  'pretendard-b': ['pretendard@1.3.9', 'dist/web/static/woff2/Pretendard-Bold.woff2', 700],
  'pretendard-k': ['pretendard@1.3.9', 'dist/web/static/woff2/Pretendard-Black.woff2', 900],
  'suit-b': ['@sun-typeface/suit@2.0.5', 'fonts/static/woff2/SUIT-Bold.woff2', 700],
  'suit-h': ['@sun-typeface/suit@2.0.5', 'fonts/static/woff2/SUIT-Heavy.woff2', 900],
  'wanted-b': ['wanted-sans@1.0.3', 'fonts/webfonts/static/complete/woff2/WantedSans-Bold.woff2', 700],
  'wanted-k': ['wanted-sans@1.0.3', 'fonts/webfonts/static/complete/woff2/WantedSans-ExtraBlack.woff2', 950],
  'galmuri': ['galmuri@2.40.3', 'dist/Galmuri11-Bold.woff2', 700],
  'maruburi-b': ['@kfonts/maruburi@0.1.0', 'MaruBuri-Bold.woff2', 700],
  'maruburi-l': ['@kfonts/maruburi@0.1.0', 'MaruBuri-Light.woff2', 300],
  'nsquare-b': ['@kfonts/nanum-square@0.2.0', 'NanumSquareB.woff2', 700],
  'nsquare-k': ['@kfonts/nanum-square@0.2.0', 'NanumSquareEB.woff2', 800],
  'nsround-b': ['@kfonts/nanum-square-round@0.2.0', 'NanumSquareRoundB.woff2', 700],
  'nsround-k': ['@kfonts/nanum-square-round@0.2.0', 'NanumSquareRoundEB.woff2', 800],
  'barun-gothic': ['@kfonts/nanum-barun-gothic@0.3.0', 'NanumBarunGothicBold.woff2', 700],
  'barun-pen': ['@kfonts/nanum-barun-pen@0.2.0', 'NanumBarunpenB.woff2', 700],
  'ridi-batang': ['@kfonts/ridi-batang@0.2.0', 'RIDIBatang.woff2', 400],
  'line-seed': ['@kfonts/line-seed-sans-kr@0.1.0', 'LINESeedKR-Bd.woff2', 700],
  'neodgm': ['@kfonts/neodgm@0.5.0', 'neodgm.woff2', 400],
};
const CDNS = [(p, f) => `https://cdn.jsdelivr.net/npm/${p}/${f}`, (p, f) => `https://unpkg.com/${p}/${f}`];
const T_MAX = 900;
/* 글자 묶음 정리 — 겹침 빼고 정렬(같은 책장이면 같은 열쇠) · 조절 글자·서로게이트 짝이 깨진 것 뺌 · 900자까지 */
const textOf = (t) => [...new Set([...String(t || '')].filter((c) => { const p = c.codePointAt(0); return p >= 0x20 && !(p >= 0xd800 && p <= 0xdfff); }))].sort().join('').slice(0, T_MAX);

function lru(maxN, maxB) { const m = new Map(); let bytes = 0;
  return { get(k) { const v = m.get(k); if (v) { m.delete(k); m.set(k, v); } return v; }, set(k, v) { if (m.has(k)) { bytes -= m.get(k).length; m.delete(k); } m.set(k, v); bytes += v.length; while (m.size > maxN || bytes > maxB) { const [k0, v0] = m.entries().next().value; m.delete(k0); bytes -= v0.length; } }, size: () => m.size, bytes: () => bytes }; }

/* deps: { fetch(시험용), subset(시험용 — 기본 subset-font) , log } */
function makeFont(o) { o = o || {}; const fx = o.fetch || ((u, x) => fetch(u, x)); const log = o.log;
  const SRC = lru(4, 48e6), OUT = lru(400, 12e6), BUSY = new Map(); const ST = { hit: 0, made: 0, err: 0, srcGot: 0, lastErr: null };
  const sub = o.subset || ((buf, text, opt) => require('subset-font')(buf, text, opt));
  async function source(id) { const v = SRC.get(id); if (v) return v; if (BUSY.has(id)) return BUSY.get(id); const L = LIST[id]; if (!L) throw new Error('없는 글꼴');
    const p = (async () => { let last = null; for (const c of CDNS) { try { const r = await fx(c(L[0], L[1]), { signal: AbortSignal.timeout(20000) }); if (!r.ok) { last = 'HTTP ' + r.status; continue; } const b = Buffer.from(await r.arrayBuffer()); if (b.length < 1000 || b.toString('latin1', 0, 4) !== 'wOF2') { last = '글꼴 아님'; continue; } SRC.set(id, b); ST.srcGot++; return b; } catch (e) { last = e.message; } } throw new Error('원본 글꼴을 못 받음: ' + last); })();
    BUSY.set(id, p); try { return await p; } finally { BUSY.delete(id); } }
  /* 별칭·글자 → woff2 Buffer */
  async function get(id, text) { if (!LIST[id]) { const e = new Error('없는 글꼴'); e.code = 404; throw e; } const t = textOf(text); if (!t) { const e = new Error('글자 없음'); e.code = 400; throw e; }
    const k = id + '\u0000' + t; const c = OUT.get(k); if (c) { ST.hit++; return c; }
    try { const src = await source(id); const out = Buffer.from(await sub(src, t, { targetFormat: 'woff2' })); OUT.set(k, out); ST.made++; return out; }
    catch (e) { ST.err++; ST.lastErr = String(e.message || e).slice(0, 120); log && log('📚 글꼴 자르기 실패', id, ST.lastErr); throw e; } }
  return { get, state: () => ({ ...ST, src: SRC.size(), srcMB: +(SRC.bytes() / 1e6).toFixed(1), out: OUT.size(), outKB: Math.round(OUT.bytes() / 1e3) }) };
}
module.exports = { LIST, textOf, makeFont, CDNS, T_MAX };
