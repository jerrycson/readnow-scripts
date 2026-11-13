/* 📚 (11/12 shelf4) 우리숍 서가 — 앞표지를 클라우드가 미리 셈(대표색 + 제목 글꼴 갈래) · 손님 화면은 셈하지 않고 서가 자료 칸 cv로 받음
 *  까닭(실제 확인 11/12): 표지·책등 그림이 Firebase 저장소(firebasestorage.googleapis.com)에 있는데 그 주소는 CORS를 열지 않음
 *   → 손님 브라우저 canvas가 색을 못 읽음(4번 막히면 그만두고 제목 낱말 색으로 영구 저장해 버림) → 클라우드가 미리 셈해 실어 보냄
 *  하는 일: 판매중 책의 앞표지 큰 그림(img/bk_<도서>/front.jpg · 저장소 관리자 읽기 — 공개 읽기와 같은 그림)을 jpeg-js로 풀어
 *   ① 대표색 — 16×16 칸으로 줄여 채도 높은 색에 무게(손님 화면 shelf-core dominant와 같은 셈)
 *   ② 글꼴 갈래(어림) — 제목이 흔히 놓이는 위 45%에서 글자 잉크를 가려 획 굵기·가로/세로 획 대비·고르기를 셈:
 *      세로 획이 가로 획보다 많이 두꺼움(대비 1.6배 넘음) → my(명조) · 굵은 획(그림 폭의 2% 넘음) → bd(굵은 제목체) · 그 밖 → go(고딕) — 어림이라 손글씨·붓·둥근은 고르지 않음(분야·제목 낱말 몫)
 *      그림·사진이 많은 표지(잉크 비율이 3~35% 밖)는 갈래를 정하지 않음(손님 화면이 분야·제목 낱말로 고름)
 *  저장: shop_cover/b00~b31 {m:{도서키:'rrggbb.갈래'|'x'}} (상품 번호가 아니라 그림 폴더 bk_<도서> — 같은 책 여러 매물이 한 번만)
 *  비용: 회차마다 새 책 최대 N권(기본 300 · 5분마다 · shelf5 — 전엔 120 · 10분) · 그림 받기는 같은 구역 저장소 → 바깥 전송 아님 · 한 권 약 30~60ms */
'use strict';
const N_BUCKET = 32;
/* (shelf5) 셈 속도 — 전엔 10분마다 120권(16,000권에 약 22시간) → 5분마다 300권 · 셋씩 나란히(약 4시간) · 차례는 '책등 그림 없는 책 → 새로 들어온 책'(책등 그림이 있으면 대표색을 안 씀 · 첫 책장이 새 책) */
const PAR = 3, TICK_N = 300, TICK_MS = 300e3;
/* 셈할 차례: 책등 그림(sp) 없는 것 먼저 · 그 안에서 새로 들어온(at) 것 먼저 · 우리 저장소 표지만 */
const order = (items) => (items || []).filter((x) => x && (keyOfIm(x.im) || keyOfIm(x.bk))) /* (shelfset2) 앞표지가 알라딘 주소여도 뒤표지가 우리 저장소면 뒤표지 셈에 들어감 */.sort((a, b) => (a.sp ? 1 : 0) - (b.sp ? 1 : 0) || String(b.at || '').localeCompare(String(a.at || '')));
const bucketOf = (k) => { let h = 2166136261 >>> 0; const t = String(k); for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return 'b' + String(h % N_BUCKET).padStart(2, '0'); };
/* 표지 주소(서가 칸 im) → 저장소 폴더 키 'bk_123' (우리 저장소 그림만) */
const keyOfIm = (im) => { const m = /img(?:%2F|\/)(bk_[0-9A-Za-z_-]{1,40})(?:%2F|\/)/.exec(String(im || '')); return m ? m[1] : null; };

function dominant(px) { const B = new Map(); const n = px ? px.length : 0;
  for (let i = 0; i + 3 < n; i += 4) { if (px[i + 3] < 128) continue; const r = px[i], g = px[i + 1], b = px[i + 2]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); const sat = mx ? (mx - mn) / mx : 0;
    let w = 1 + sat * 2.5; if (mn > 232) w *= 0.15; else if (mx < 22) w *= 0.35; const k = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4); const o = B.get(k) || [0, 0, 0, 0]; o[0] += w; o[1] += r * w; o[2] += g * w; o[3] += b * w; B.set(k, o); }
  let top = null; for (const v of B.values()) if (!top || v[0] > top[0]) top = v; if (!top) return null;
  return [top[1], top[2], top[3]].map((x) => Math.round(x / top[0]).toString(16).padStart(2, '0')).join(''); }
/* 큰 그림 → 16×16 평균(칸마다) */
function shrink(rgba, w, h, S) { const out = new Uint8ClampedArray(S * S * 4); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const x0 = Math.floor(x * w / S), x1 = Math.max(x0 + 1, Math.floor((x + 1) * w / S)), y0 = Math.floor(y * h / S), y1 = Math.max(y0 + 1, Math.floor((y + 1) * h / S));
    let r = 0, g = 0, b = 0, a = 0, n = 0; const sx = Math.max(1, Math.floor((x1 - x0) / 6)), sy = Math.max(1, Math.floor((y1 - y0) / 6)); for (let yy = y0; yy < y1; yy += sy) for (let xx = x0; xx < x1; xx += sx) { const i = (yy * w + xx) * 4; r += rgba[i]; g += rgba[i + 1]; b += rgba[i + 2]; a += rgba[i + 3]; n++; }
    const o = (y * S + x) * 4; out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = a / n; } return out; }
const med = (L) => { if (!L.length) return 0; const s = [...L].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
/* 글꼴 갈래 어림 — 위 45%(제목 자리) · 밝기 오츠 문턱으로 글자(적은 쪽)를 가림 · 가로 달리기(세로 획 굵기)·세로 달리기(가로 획 굵기) */
function genreOf(rgba, w, h) { const W = Math.min(w, 360), sc = w / W, H = Math.floor(h * 0.45 / sc); if (W < 60 || H < 30) return { fg: null, why: '작음' };
  const L = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (Math.floor(y * sc) * w + Math.floor(x * sc)) * 4; L[y * W + x] = 0.299 * rgba[i] + 0.587 * rgba[i + 1] + 0.114 * rgba[i + 2]; }
  const hist = new Array(256).fill(0); for (const v of L) hist[v | 0]++; let sum = 0; for (let i = 0; i < 256; i++) sum += i * hist[i]; let sB = 0, wB = 0, best = 0, th = 128; const tot = L.length;
  for (let t = 0; t < 256; t++) { wB += hist[t]; if (!wB) continue; const wF = tot - wB; if (!wF) break; sB += t * hist[t]; const mB = sB / wB, mF = (sum - sB) / wF; const v = wB * wF * (mB - mF) * (mB - mF); if (v > best) { best = v; th = t; } }
  let dark = 0; for (const v of L) if (v < th) dark++; const inkDark = dark < tot / 2; const ink = (i) => (inkDark ? L[i] < th : L[i] >= th); const frac = (inkDark ? dark : tot - dark) / tot;
  if (frac < 0.03 || frac > 0.3) return { fg: null, why: '잉크 ' + Math.round(frac * 100) + '%' };
  const hr = [], vr = []; for (let y = 0; y < H; y++) { let r = 0; for (let x = 0; x <= W; x++) { if (x < W && ink(y * W + x)) r++; else { if (r >= 1 && r < W * 0.25) hr.push(r); r = 0; } } }
  for (let x = 0; x < W; x++) { let r = 0; for (let y = 0; y <= H; y++) { if (y < H && ink(y * W + x)) r++; else { if (r >= 1 && r < H * 0.4) vr.push(r); r = 0; } } }
  if (hr.length < 40 || vr.length < 40) return { fg: null, why: '글자 적음' };
  const mh = med(hr), mv = med(vr); const sw = Math.min(mh, mv) / W; /* 획 굵기(그림 폭 대비) */ const ratio = mh / Math.max(1, mv); /* 세로 획 ÷ 가로 획 */
  const mean = hr.reduce((a, b) => a + b, 0) / hr.length; const cv = Math.sqrt(hr.reduce((a, b) => a + (b - mean) * (b - mean), 0) / hr.length) / Math.max(1, mean);
  /* 실제 표지 12장으로 맞춰 봄(11/12): 획 고르기(cv)는 그림·선이 섞여 거의 늘 높게 나와 손글씨·붓 구분에 못 씀 → 명조(세로/가로 획 대비)·굵은 제목체(획 굵기)·고딕만 어림 · 손글씨·둥근 등은 제목 낱말·분야로 */
  const fg = ratio > 1.6 && sw < 0.03 ? 'my' : sw > 0.02 ? 'bd' : 'go';
  return { fg, why: `획 ${(sw * 100).toFixed(1)}% · 대비 ${ratio.toFixed(2)} · 고르기 ${cv.toFixed(2)} · 잉크 ${Math.round(frac * 100)}%` }; }
/* 표지 한 장 → 'rrggbb.갈래' | 'rrggbb' | 'x' */
function analyze(rgba, w, h) { if (!rgba || !w || !h) return 'x'; const c = dominant(shrink(rgba, w, h, 16)); if (!c) return 'x'; const g = genreOf(rgba, w, h); return c + (g.fg ? '.' + g.fg : ''); }
const CV_RE = /^(?:[0-9a-f]{6}(?:\.[a-z]{2})?|x)$/;
/* (shelfset2 · 정범님 11/14 00:29 「세트는 … 책등 표본이 없으면 최대한 앞뒤 표지를 기준으로 참고해서 각 권의 디자인이 조화롭게 일체감이 살도록」)
 *  🔙 뒤표지 대표색 — 세트 책등 디자인(앞표지 색 + 뒤표지 색 한 벌)에만 씀 → 세트 꼴 제목(또는 관리자 「세트 권 수 바로잡기」에 적힌 상품)이면서 뒤표지 그림이 있는 책만 셈
 *   · 그림: 도서 정보 images.back(수집기가 알라딘 화면에서 모아 우리 저장소 img/<도서>/back.* 로 받아 둔 것 · 없으면 알라딘 원래 주소를 JPEG·PNG로 다시 받음 — 앞표지와 같은 길)
 *   · 저장: 앞표지와 같은 shop_cover/b00~b31 · 열쇠 'b:<도서>' · 값 'rrggbb' | 'x'(셈했는데 쓸 색 없음 · 다시 안 셈)
 *   · 실제 자료(11/14 booksqueen.com 판매중 16,173권): 세트 꼴 427개 중 뒤표지 그림이 있는 것 18개 — 나머지는 지금처럼 앞표지 색만(손님 화면이 그대로 그림) */
const SET_LIKE = /세트|셋트|\bset\b|boxed|박스|전집|완결|전권|\bvol(?:ume)?s?\b|\bbooks?\b|(?:전|총)\s*\d{1,3}\s*권|\d{1,3}\s*[~\-–]\s*\d{1,3}\s*권|\d{1,3}\s*권\s*(?:세트|묶음)/i;
const BACK_N = 60; /* 회차마다 뒤표지 최대 수 */
const bkKey = (x) => keyOfIm(x && x.bk) || keyOfIm(x && x.im);
const wantBack = (x, ids) => !!(x && x.bk && bkKey(x) && ((ids && ids.has(String(x.id))) || SET_LIKE.test(String(x.t || ''))));
const backOf = (rgba, w, h) => { if (!rgba || !w || !h) return 'x'; return dominant(shrink(rgba, w, h, 16)) || 'x'; };

/* (shelf6) 표지 한 장 받기·풀기 — 저장소 그림(도서 정보의 실제 길 · 없으면 front.jpg)을 꼴대로 풂(JPEG·PNG·GIF)
 *  WebP·AVIF 등 못 푸는 꼴이면 알라딘 원래 주소를 'JPEG·PNG만 받겠다'(Accept)고 다시 받아 풂 — 공개 그림 한 장 · 로그인·쿠키 없음(약속 0)
 *  deps: B(저장소) · jpeg(jpeg-js) · pathOf(k)/srcOf(k)(도서 정보에서) · fx(시험용 fetch) */
const IMG = require('./shop-img.js');
const ALADIN_IMG = /^https:\/\/image\.aladin\.co\.kr\//i;
async function loadCover(k, d, slot) { const p0 = d.pathOf && d.pathOf(k); const path = p0 || `img/${k}/${slot || 'front'}.jpg`; let fmt = null; /* (shelfset2) slot 'back' = 뒤표지 — 우리 저장소에 아직 안 받은 뒤표지는 알라딘 원래 주소로 바로 */
  if (slot === 'back' && !p0 && d.srcOf && d.srcOf(k)) fmt = 'none';
  else { try { const [buf] = await d.B.file(path).download(); return { im: IMG.decode(buf, d.jpeg), how: IMG.sniff(buf) }; }
    catch (e) { const m = /^fmt:(.+)$/.exec(String(e.message || '')); if (!m) throw e; fmt = m[1]; } }
  const src = d.srcOf && d.srcOf(k); if (!src || !ALADIN_IMG.test(src)) throw new Error('fmt:' + fmt + ' (다시 받을 원래 주소 없음)');
  const r = await d.fx(src, { headers: { Accept: 'image/jpeg,image/png;q=0.9,image/gif;q=0.8' }, redirect: 'follow', signal: AbortSignal.timeout(10000) }); if (!r.ok) throw new Error('원래 주소 HTTP ' + r.status);
  const buf = Buffer.from(await r.arrayBuffer()); if (buf.length > 8e6) throw new Error('원래 그림 너무 큼'); return { im: IMG.decode(buf, d.jpeg), how: fmt + '→원래 ' + IMG.sniff(buf) }; }

/* 클라우드 일 — makeShop이 부름 · deps: { C(컬렉션), bucket()(저장소), log, pathOf, srcOf, fetch } */
function makeCover({ C, bucket, log, pathOf, srcOf, backPathOf, backSrcOf, fetch: F }) {
  const fx = F || ((u, o) => fetch(u, o));
  const ST = { m: new Map(), at: 0, busy: null, dirty: new Map(), runAt: 0, done: 0, fail: 0, lastErr: null, how: {} };
  const load = async () => { if (ST.at && Date.now() - ST.at < 3600e3) return; try { const ss = await C('shop_cover').get(); ss.forEach((d) => { const m = (d.data() || {}).m || {}; for (const k in m) if (CV_RE.test(m[k])) ST.m.set(k, m[k]); }); ST.at = Date.now(); } catch (e) { log && log('📚 표지 셈 읽기 실패', e.message); } };
  const flush = async () => { const by = new Map(); for (const [k, v] of ST.dirty) { const b = bucketOf(k); if (!by.has(b)) by.set(b, {}); by.get(b)[k] = v; } ST.dirty.clear();
    for (const [b, m] of by) { try { await C('shop_cover').doc(b).set({ m, at: new Date().toISOString(), writer: 'cloud-shop' }, { merge: true }); } catch (e) { log && log('📚 표지 셈 쓰기 실패', b, e.message); } } };
  /* 회차: 아직 셈하지 않은 책 최대 n권 */
  async function tick(items, n, setIds) { if (ST.busy) return ST.busy; ST.busy = (async () => { await load(); let jpeg = null; try { jpeg = require('jpeg-js'); } catch (e) { ST.lastErr = 'jpeg-js 없음'; return 0; }
    const want = []; const seen = new Set(); for (const x of items) { const k = keyOfIm(x.im); if (!k || seen.has(k) || ST.m.has(k)) continue; seen.add(k); want.push(k); if (want.length >= (n || 120)) break; }
    /* (shelfset2) 🔙 세트 뒤표지 — 앞표지보다 먼저(몇 권 안 됨) · 열쇠 'b:<도서>' */
    const wantB = []; { const sb = new Set(); for (const x of items) { if (!wantBack(x, setIds)) continue; const k = bkKey(x); if (sb.has(k) || ST.m.has('b:' + k)) continue; sb.add(k); wantB.push(k); if (wantB.length >= BACK_N) break; } }
    if (wantB.length) { const B0 = bucket(); for (const k of wantB) { try { const { im, how } = await loadCover(k, { B: B0, jpeg, pathOf: backPathOf, srcOf: backSrcOf, fx }, 'back'); const v = backOf(im.data, im.width, im.height); ST.m.set('b:' + k, v); ST.dirty.set('b:' + k, v); ST.nb = (ST.nb || 0) + 1; ST.how['back ' + how] = (ST.how['back ' + how] || 0) + 1; }
      catch (e) { ST.fail++; ST.lastErr = '뒤표지 ' + String(e.message || e).slice(0, 110); if (/No such object|404|^fmt:|SOI not found|png |gif /.test(String(e.message || e))) { ST.m.set('b:' + k, 'x'); ST.dirty.set('b:' + k, 'x'); ST.how['back x'] = (ST.how['back x'] || 0) + 1; } } } }
    const B = bucket(); let done = 0; const t0 = Date.now();
    /* (shelf5) 셋씩 나란히 받음 — 한 권 시간의 대부분이 그림 받기 기다림(셈은 30~60ms) · 풀기는 한 번에 하나라 메모리는 그대로(그림 한 장 ≈ 1MB) · 150권마다 중간 저장(회차가 끊겨도 한 일은 남음 · 쓰기 수는 회차당 약 60번) */
    let qi = 0; const one = async () => { while (qi < want.length) { const k = want[qi++]; try { const { im, how } = await loadCover(k, { B, jpeg, pathOf, srcOf, fx }); const v = analyze(im.data, im.width, im.height); ST.m.set(k, v); ST.dirty.set(k, v); done++; ST.how[how] = (ST.how[how] || 0) + 1; }
      catch (e) { ST.fail++; ST.lastErr = String(e.message || e).slice(0, 120); if (/No such object|404|^fmt:|SOI not found|png |gif /.test(ST.lastErr)) { ST.m.set(k, 'x'); ST.dirty.set(k, 'x'); ST.how.x = (ST.how.x || 0) + 1; } } /* 없음·풀 수 없는 꼴은 'x'(다시 안 셈 — 손님 화면은 제목 낱말·분야로) */
      if (ST.dirty.size >= 150) await flush(); } };
    await Promise.all(Array.from({ length: Math.min(PAR, want.length) }, one));
    if (ST.dirty.size) await flush(); ST.done += done; ST.runAt = Date.now(); ST.lastMs = Date.now() - t0; ST.lastN = done; return done; })().finally(() => { ST.busy = null; }); return ST.busy; }
  const cvOf = (im) => { const k = keyOfIm(im); return k ? ST.m.get(k) || null : null; };
  /* (shelfset2) 서가 칸 cb — 뒤표지 대표색 'rrggbb'(셈해 둔 세트만 · 'x'·없음은 null — 손님 화면은 앞표지 색만) */
  const cbOf = (x) => { const k = bkKey(x); const v = k ? ST.m.get('b:' + k) : null; return v && /^[0-9a-f]{6}$/.test(v) ? v : null; };
  return { tick, cvOf, cbOf, load, state: () => ({ n: ST.m.size, nb: [...ST.m.keys()].filter((k) => k.startsWith('b:')).length, done: ST.done, fail: ST.fail, runAt: ST.runAt, lastErr: ST.lastErr, lastMs: ST.lastMs || null, lastN: ST.lastN || 0, how: ST.how }) };
}
module.exports = { SET_LIKE, BACK_N, bkKey, wantBack, backOf, loadCover, order, PAR, TICK_N, TICK_MS, analyze, dominant, genreOf, shrink, keyOfIm, bucketOf, makeCover, CV_RE };
