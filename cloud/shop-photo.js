/* 📷 (11/13 shelf3) 우리숍 서가 — 표지 그림인가, 물건 전체 사진인가 (정범님 11/13 21:28 · 21:40)
 *  까닭: 미등록 상품(알라딘 표지 없이 교보 등에서 받거나 우리가 찍은 사진)과 음반·영상 상품 그림에는 '정면 표지 그림'이 아닌 것이 섞임
 *   ① 자리 그림 — 「제공된 상품이미지가 없습니다」(교보)·「이미지 준비중」·알라딘 램프 그림 → 'n'
 *   ② 물건 전체 사진 — 비스듬히 찍은 책·상자 세트·여러 권을 함께 찍은 사진·책등이 보이는 입체 그림·탁자 위 실물 사진 → 'o'
 *   ③ 정면 표지 그림 → 'c'
 *  판정은 비용 없는 간단한 영상 셈만(외부 AI 없음 · 헌장 제33조):
 *   · 그림을 긴 변 160칸으로 줄임 → 가장자리 띠의 색이 고른지(배경이 있는 사진인지) 봄
 *   · 배경이 고르면 가장자리에서 배경과 닮은 칸을 채워 나가 '물건 윤곽'을 얻음 → 윤곽 왼·오른 변의 기울기(사다리꼴·원근), 위·아래 변의 기울기,
 *     윤곽이 바깥 네모를 얼마나 채우는지(모서리가 잘린 입체 상자는 덜 채움), 윤곽이 그림에서 차지하는 몫
 *   · 자리 그림은 밝고(평균 밝기 높음) 채도가 거의 없고 진한 칸이 거의 없음
 *  한 번 셈한 판정은 shop_photo/b00~b31 {m:{도서키:'c'|'o'|'n' + 점수}}에 영구 저장 — 다시 셈하지 않음
 *  사람 판정(관리 웹앱 › 🛍 우리숍 주문 › 📷 서가 표지·사진 바로잡기)은 app_settings/shop.shelfPick에 따로 두고 늘 이김(헌장 제7조) — 이 파일은 그것을 덮지 않음
 *  근거 표본(11/13 booksqueen.com 실제 판매중): 미등록 474장 + 음반·영상 332장을 사람이 눈으로 가른 정답과 견줌 — reports/SHELF3_1113.md */
'use strict';
const N_BUCKET = 32;
const PK_RE = /^[con](?:\d{1,3})?$/;
/* 판정 문턱 — 표본으로 맞춤(바꾸면 새로 셈하는 책만 달라짐 · 이미 정한 것은 그대로) */
const TH = { side: 160, ring: 2, bgTol: 34, ringUni: 0.7, fgMin: 0.15, fgMax: 0.97, phL: 200, phS: 0.07, phDark: 0.006, uniA: 0.88, solA: 0.9, fill: 0.9, uniB: 0.7, solB: 0.95, fillB: 0.96, tilt: 0.4 };

/* 큰 그림 → 긴 변 S칸 RGB(칸마다 평균) */
function small(rgba, w, h, S) { const k = Math.max(w, h) / S; const W = Math.max(8, Math.round(w / k)), H = Math.max(8, Math.round(h / k)); const o = new Float32Array(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const x0 = Math.floor(x * w / W), x1 = Math.max(x0 + 1, Math.floor((x + 1) * w / W)), y0 = Math.floor(y * h / H), y1 = Math.max(y0 + 1, Math.floor((y + 1) * h / H));
    let r = 0, g = 0, b = 0, n = 0; const sx = Math.max(1, Math.floor((x1 - x0) / 4)), sy = Math.max(1, Math.floor((y1 - y0) / 4)); for (let yy = y0; yy < y1; yy += sy) for (let xx = x0; xx < x1; xx += sx) { const i = (yy * w + xx) * 4; const a = rgba[i + 3] == null ? 255 : rgba[i + 3]; const t = a / 255; r += rgba[i] * t + 255 * (1 - t); g += rgba[i + 1] * t + 255 * (1 - t); b += rgba[i + 2] * t + 255 * (1 - t); n++; }
    const j = (y * W + x) * 3; o[j] = r / n; o[j + 1] = g / n; o[j + 2] = b / n; } return { px: o, W, H }; }
const dist = (P, i, c) => { const dr = P[i] - c[0], dg = P[i + 1] - c[1], db = P[i + 2] - c[2]; return Math.sqrt(dr * dr + dg * dg + db * db); };
const medOf = (L) => { const s = [...L].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
/* 곧은 줄 맞추기(가장 작은 제곱 · 바깥 값 한 번 빼고 다시) → 기울기 */
function slopeOf(pts) { const fit = (P) => { const n = P.length; if (n < 6) return null; let sx = 0, sy = 0, sxx = 0, sxy = 0; for (const [x, y] of P) { sx += x; sy += y; sxx += x * x; sxy += x * y; } const d = n * sxx - sx * sx; if (!d) return null; const a = (n * sxy - sx * sy) / d; return { a, b: (sy - a * sx) / n }; };
  let f = fit(pts); if (!f) return 0; const res = pts.map(([x, y]) => Math.abs(y - (f.a * x + f.b))); const th = Math.max(1.5, medOf(res) * 2.5); const P2 = pts.filter((p, i) => res[i] <= th); const f2 = fit(P2); return f2 ? f2.a : f.a; }

/* 볼록 껍질(단조 사슬) · 다각형 넓이 · 줄에서 벗어난 정도 */
function hullOf(P) { const p = [...P].sort((a, b) => a[0] - b[0] || a[1] - b[1]); if (p.length < 3) return p; const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); } for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop(); return lo.concat(up); }
const polyArea = (H) => { let a = 0; for (let i = 0; i < H.length; i++) { const [x1, y1] = H[i], [x2, y2] = H[(i + 1) % H.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; };
/* 닫힌 다각형 줄이기(더글러스-포이커) → 꼭짓점 · 볼록 껍질을 몇 개의 곧은 변으로 그릴 수 있나 */
function simplify(H, tol) { if (H.length < 4) return H; let i0 = 0, i1 = 0, dmax = -1; for (let i = 0; i < H.length; i++) for (let j = i + 1; j < H.length; j++) { const d = Math.hypot(H[i][0] - H[j][0], H[i][1] - H[j][1]); if (d > dmax) { dmax = d; i0 = i; i1 = j; } }
  const dp = (P) => { if (P.length < 3) return P; const [a, b] = [P[0], P[P.length - 1]]; const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; let k = -1, m = -1; for (let i = 1; i < P.length - 1; i++) { const d = Math.abs((b[0] - a[0]) * (a[1] - P[i][1]) - (a[0] - P[i][0]) * (b[1] - a[1])) / L; if (d > m) { m = d; k = i; } } return m > tol ? dp(P.slice(0, k + 1)).slice(0, -1).concat(dp(P.slice(k))) : [a, b]; };
  const A = H.slice(i0, i1 + 1), B = H.slice(i1).concat(H.slice(0, i0 + 1)); return dp(A).slice(0, -1).concat(dp(B).slice(0, -1)); }
function ragOf(pts) { if (pts.length < 6) return 0; const a = slopeOf(pts); const r = pts.map(([x, y]) => y - a * x); const m = medOf(r); return medOf(r.map((v) => Math.abs(v - m))); }

/* 그림 한 장 → { k:'c'|'o'|'n', s(0~99 · 물건 사진다움), why } */
function judge(rgba, w, h) { if (!rgba || !w || !h) return { k: 'c', s: 0, why: '그림 없음' };
  const { px: P, W, H } = small(rgba, w, h, TH.side); const N = W * H;
  /* ① 자리 그림 — 밝고 채도 없고 진한 칸이 거의 없음 */
  let Ls = 0, Ss = 0, dark = 0; for (let i = 0; i < N; i++) { const r = P[i * 3], g = P[i * 3 + 1], b = P[i * 3 + 2]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); const L = 0.299 * r + 0.587 * g + 0.114 * b; Ls += L; Ss += mx ? (mx - mn) / mx : 0; if (L < 110) dark++; }
  const Lm = Ls / N, Sm = Ss / N, Dk = dark / N;
  if (Lm > TH.phL && Sm < TH.phS && Dk < TH.phDark) return { k: 'n', s: 99, why: `자리 그림(밝기 ${Lm | 0} · 채도 ${Sm.toFixed(2)} · 진한 칸 ${(Dk * 100).toFixed(1)}%)` };
  /* ② 가장자리 띠의 색 — 고르면 배경이 있는 사진 */
  const ring = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (x < TH.ring || y < TH.ring || x >= W - TH.ring || y >= H - TH.ring) ring.push((y * W + x) * 3);
  const bg = [0, 1, 2].map((c) => medOf(ring.map((i) => P[i + c])));
  const uni = ring.filter((i) => dist(P, i, bg) < TH.bgTol).length / ring.length;
  if (uni < TH.ringUni) return { k: 'c', s: 0, why: `가장자리까지 그림(배경 고름 ${(uni * 100) | 0}%)` };
  /* ③ 가장자리에서 배경과 닮은 칸을 채워 나감 → 남은 것이 물건 */
  const isBg = new Uint8Array(N); const st = []; for (const i of ring) { const p = i / 3; if (dist(P, i, bg) < TH.bgTol && !isBg[p]) { isBg[p] = 1; st.push(p); } }
  while (st.length) { const p = st.pop(); const x = p % W, y = (p - x) / W; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const q = Y * W + X; if (isBg[q]) continue; if (dist(P, q * 3, bg) < TH.bgTol) { isBg[q] = 1; st.push(q); } } }
  let x0 = W, x1 = -1, y0 = H, y1 = -1, fg = 0; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!isBg[y * W + x]) { fg++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const fgF = fg / N; if (!fg) return { k: 'c', s: 0, why: '물건 윤곽 없음' };
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1; const fill = fg / (bw * bh);
  const mar = Math.min(x0, y0, W - 1 - x1, H - 1 - y1) / Math.max(W, H); /* 둘레 여백 — 정면 표지를 흰 바탕에 놓은 것은 여백 없이 꽉 차거나 네모 */
  /* 변마다 윤곽 점 → 기울기(가운데 80%만) */
  const Lp = [], Rp = [], Tp = [], Bp = []; for (let y = y0 + Math.floor(bh * 0.1); y <= y1 - Math.floor(bh * 0.1); y++) { let a = -1, b = -1; for (let x = x0; x <= x1; x++) if (!isBg[y * W + x]) { if (a < 0) a = x; b = x; } if (a >= 0) { Lp.push([y, a]); Rp.push([y, b]); } }
  for (let x = x0 + Math.floor(bw * 0.1); x <= x1 - Math.floor(bw * 0.1); x++) { let a = -1, b = -1; for (let y = y0; y <= y1; y++) if (!isBg[y * W + x]) { if (a < 0) a = y; b = y; } if (a >= 0) { Tp.push([x, a]); Bp.push([x, b]); } }
  const sL = Math.abs(slopeOf(Lp)), sR = Math.abs(slopeOf(Rp)), sT = Math.abs(slopeOf(Tp)), sB = Math.abs(slopeOf(Bp)); const sMax = Math.max(sL, sR, sT, sB);
  /* 볼록함 — 윤곽 점들의 볼록 껍질 넓이 대비 물건 넓이(입체 상자·책은 볼록한 다각형 ≈ 1 · 흰 바탕 표지의 그림 덩어리는 들쭉날쭉 < 0.9) */
  const pts = []; for (let y = y0; y <= y1; y++) { let a = -1, b = -1; for (let x = x0; x <= x1; x++) if (!isBg[y * W + x]) { if (a < 0) a = x; b = x; } if (a >= 0) { pts.push([a, y], [b + 1, y], [a, y + 1], [b + 1, y + 1]); } }
  const hull = hullOf(pts); const hA = polyArea(hull); const sol = hA ? Math.min(1, fg / hA) : 0;
  /* 곧음 — 변마다 줄에서 벗어난 정도(중앙값 · 칸) */
  const rag = Math.max(ragOf(Lp), ragOf(Rp), ragOf(Tp), ragOf(Bp));
  const full = fgF > TH.fgMax; /* 배경 가장자리가 얇게만 있는 꽉 찬 그림 */
  const poly = simplify(hull, Math.max(2, Math.hypot(bw, bh) * 0.02)); const nv = poly.length;
  let eMax = 0; for (let i = 0; i < nv; i++) { const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % nv]; const dx = Math.abs(bx - ax), dy = Math.abs(by - ay); const len = Math.hypot(dx, dy); if (len < Math.min(bw, bh) * 0.15) continue; eMax = Math.max(eMax, Math.min(dx, dy) / Math.max(dx, dy, 1)); } /* 긴 변 가운데 가장 기운 것(0 = 반듯) */
  const bgL = 0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2];
  const F = { uni, fgF, fill, sMax, sol, rag, mar, Lm, Sm, Dk, nv, eMax, bgL }; if (TH.dbg) TH.dbg({ isBg, W, H, poly }); /* 연구용(시험·표본 견줌) */
  const why = `배경 고름 ${(uni * 100) | 0}% · 물건 ${(fgF * 100) | 0}% · 네모 채움 ${(fill * 100) | 0}% · 볼록 ${(sol * 100) | 0}% · 긴 변 기울기 ${eMax.toFixed(2)} · 꼭짓점 ${nv}`;
  if (fgF < TH.fgMin || fgF > TH.fgMax) return { k: 'c', s: 0, f: F, why: '물건 몫이 너무 작거나 꽉 참 · ' + why };
  /* 가르기(표본 806장으로 맞춤 — 정면 표지를 물건으로 잘못 보는 일을 가장 적게: 물건 사진 41% 찾음 · 표지 잘못 0.5%) */
  const A = uni >= TH.uniA && sol >= TH.solA && (eMax >= TH.tilt || fill < TH.fill);
  const B = uni >= TH.uniB && sol >= TH.solB && eMax >= TH.tilt && fill < TH.fillB;
  const s = Math.max(1, Math.min(99, Math.round(50 + 49 * Math.min(1, Math.max(eMax, 1 - fill)))));
  if (A || B) return { k: 'o', s, f: F, why: (eMax >= TH.tilt ? '비스듬한 물건 · ' : '네모가 아닌 물건 윤곽 · ') + why };
  return { k: 'c', s: 0, f: F, why }; }

const bucketOf = (k) => { let h = 2166136261 >>> 0; const t = String(k); for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return 'b' + String(h % N_BUCKET).padStart(2, '0'); };
const pkStr = (r) => r.k + (r.k === 'c' ? '' : String(Math.max(0, Math.min(99, r.s | 0))));
/* ══ 클라우드 일 — makeShop이 부름(표지 대표색 셈과 같은 길로 그림 한 장 받기 · 같은 구역 저장소라 바깥 전송 아님)
 *  차례: 설정 photoScope — unreg(기본) = 미등록(우리 사진 폴더 bk_x) + 음반·LP·DVD·블루레이·그 밖 · all = 모든 상품
 *  회차: 5분마다 최대 120장 · 셋씩 나란히 · 한 장 30~80ms 셈 · 판정은 영구(다시 셈하지 않음 · 판정 틀을 바꿔도 이미 정한 것은 그대로) */
const TICK_N = 120, TICK_MS = 300e3, PAR = 3;
const KIND_X = /^(음반|LP|DVD|블루레이|그 밖)$/;
const wants = (x, scope) => { if (!x) return false; if (scope === 'all') return true; const k0 = String(x.cp || '').split('>')[0]; return /img(?:%2F|\/)bk_x/.test(String(x.im || '')) || KIND_X.test(k0) || /^\s*[\[(【]\s*(블루레이|blu-?ray|DVD|CD|LP|VHS)/i.test(String(x.t || '')); };
function makePhoto({ C, bucket, log, pathOf, srcOf, fetch: F }) {
  const CV = require('./shop-cover.js'); const fx = F || ((u, o) => fetch(u, o));
  const ST = { m: new Map(), at: 0, busy: null, dirty: new Map(), runAt: 0, done: 0, fail: 0, lastErr: null, n: { c: 0, o: 0, n: 0 } };
  const load = async () => { if (ST.at && Date.now() - ST.at < 3600e3) return; try { const ss = await C('shop_photo').get(); ss.forEach((d) => { const m = (d.data() || {}).m || {}; for (const k in m) if (PK_RE.test(m[k])) ST.m.set(k, m[k]); }); ST.at = Date.now(); } catch (e) { log && log('📷 사진 판정 읽기 실패', e.message); } };
  const flush = async () => { const by = new Map(); for (const [k, v] of ST.dirty) { const b = bucketOf(k); if (!by.has(b)) by.set(b, {}); by.get(b)[k] = v; } ST.dirty.clear();
    for (const [b, m] of by) { try { await C('shop_photo').doc(b).set({ m, at: new Date().toISOString(), writer: 'cloud-shop' }, { merge: true }); } catch (e) { log && log('📷 사진 판정 쓰기 실패', b, e.message); } } };
  async function tick(items, scope, n) { if (ST.busy) return ST.busy; ST.busy = (async () => { await load(); let jpeg = null; try { jpeg = require('jpeg-js'); } catch (e) { ST.lastErr = 'jpeg-js 없음'; return 0; }
    const want = []; const seen = new Set(); for (const x of items || []) { if (!wants(x, scope)) continue; const k = CV.keyOfIm(x.im); if (!k || seen.has(k) || ST.m.has(k)) continue; seen.add(k); want.push(k); if (want.length >= (n || TICK_N)) break; }
    const B = bucket(); let done = 0; let qi = 0;
    const one = async () => { while (qi < want.length) { const k = want[qi++]; try { const { im } = await CV.loadCover(k, { B, jpeg, pathOf, srcOf, fx }); const r = judge(im.data, im.width, im.height); const v = pkStr(r); ST.m.set(k, v); ST.dirty.set(k, v); ST.n[r.k] = (ST.n[r.k] || 0) + 1; done++; }
      catch (e) { ST.fail++; ST.lastErr = String(e.message || e).slice(0, 120); if (/No such object|404|^fmt:|SOI not found|png |gif /.test(ST.lastErr)) { ST.m.set(k, 'c'); ST.dirty.set(k, 'c'); } } /* 못 받는 그림은 '표지'(지금 그대로) — 다시 안 셈 */
      if (ST.dirty.size >= 100) await flush(); } };
    await Promise.all(Array.from({ length: Math.min(PAR, want.length) }, one)); if (ST.dirty.size) await flush(); ST.done += done; ST.runAt = Date.now(); ST.lastN = done; return done; })().finally(() => { ST.busy = null; }); return ST.busy; }
  const pkOf = (im) => { const k = CV.keyOfIm(im); return k ? ST.m.get(k) || null : null; };
  return { tick, pkOf, load, state: () => ({ n: ST.m.size, done: ST.done, fail: ST.fail, runAt: ST.runAt, lastErr: ST.lastErr, lastN: ST.lastN || 0, kinds: ST.n }) };
}
module.exports = { makePhoto, wants, TICK_N, TICK_MS, judge, small, slopeOf, TH, PK_RE, bucketOf, pkStr, N_BUCKET };
