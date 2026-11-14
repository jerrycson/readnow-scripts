/* 📐 (11/14 coverfix1 · 정범님 20:00) 반듯한 평면 표지인가, 세워 찍은 입체 물건 사진인가 — 엔진 연구 V02 「표지 평면·입체 판별」
 *  정범님: 「확실히 반듯하게 평평한 표지인지 3차원의 물건이 세워져 있는지 구분할 수 있어? … 3차원의 그림이 표지 붙은 것들을 전부 내리고 그런 표지는 고유 디자인 … 특히 미등록 상품들이 매우 문제」
 *  까닭(실제 자료 11/14 · booksqueen.com 판매중 16,213개):
 *   ① 미등록 상품(알라딘 카탈로그 없이 정보를 직접 써서 등록 · 번호가 상품코드 U…뿐)은 알라딘 상품 화면의 그림 = 우리가 올린 실물 사진(휴대폰 1600×2133 · 벽 앞 나무 바닥에 세워 찍음)
 *      → 수집기가 그 그림을 도서 앞표지(img/bk_<알라딘 번호>/front.jpg)로 받아 둠 → 서가가 그것을 표지로 붙임
 *   ② 예전 사진 판정(shelf3 · cloud/shop-photo.js)은 '미등록'을 그림 폴더 이름 bk_x(알라딘 번호가 없는 것)로만 알아봐서
 *      알라딘 번호가 있는 미등록 상품 대부분(판매중 1,938개 중 bk_x 470개 밖)은 판정 대상에 들지 않았음(정답 표본 실물 사진 170장 중 판정 받은 것 0)
 *   ③ 판정을 받아도(음반·LP·영상) 가장자리 색이 고른 배경만 '물건 사진'으로 봐서 벽+나무 바닥 두 색 배경(LP 'LA DIVINA')은 '표지'로 판정
 *  판별(비용 없음 · 외부 AI 없음 · 헌장 제33조) — 신호 넷을 더함:
 *   📷 카메라 틀: 그림 크기가 휴대폰 사진(긴 변 900칸 넘음 · 가로:세로 3:4 또는 4:3 ±1%) — 알라딘 카탈로그 표지는 긴 변 500칸 안팎·책 판형 비율
 *   🧱 촬영 배경: 위 두 모서리가 고르고 무채색에 가까운 벽(밝기 100~248 · 흩어짐 16 아래) · 아래 두 모서리가 고른 바닥·받침
 *   🏷 출처: 미등록 상품이면 그 그림은 우리가 올린 사진(알라딘 카탈로그 표지가 아님)
 *   🧊 윤곽: 예전 판정(shop-photo judge — 고른 배경 위 비스듬한 상자·자리 그림 n)
 *  저장: shop_photo/b00~b31 같은 문서에 열쇠 'g2:<도서 그림 키>' · 값 '<c|o|n><점수>|<신호>'(예 'o92|cam.bg2.un') — 예전 판정(열쇠 <키>)은 지우지 않고 그대로 둠
 *  사람(관리자 📷 서가 표지·사진 바로잡기 · app_settings/shop.shelfPick)이 고른 것은 늘 이김(제7조) — 이 파일은 그것을 읽어 채점만 함 */
'use strict';
const GEN = 2; /* 판별 세대 — 올리면 새 열쇠로 모두 다시 셈(예전 값은 남김) */
const G2_RE = /^[con]\d{0,3}\|[a-z0-9.]{0,40}$/;
const TH = { camMin: 900, arTol: 0.01, wallSd: 16, wallSat: 0.28, wallLo: 100, wallHi: 248, flSd: 50, flSat: 0.4, flLo: 60, flHi: 248 };
const keyG = (k) => 'g' + GEN + ':' + k;
/* 그림 → 긴 변 80칸 작은 RGB(칸 평균) */
function tiny(rgba, w, h, S) { const k = Math.max(w, h) / S; const W = Math.max(8, Math.round(w / k)), H = Math.max(8, Math.round(h / k)); const o = new Float32Array(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const x0 = Math.floor(x * w / W), x1 = Math.max(x0 + 1, Math.floor((x + 1) * w / W)), y0 = Math.floor(y * h / H), y1 = Math.max(y0 + 1, Math.floor((y + 1) * h / H));
    let r = 0, g = 0, b = 0, n = 0; const sx = Math.max(1, Math.floor((x1 - x0) / 4)), sy = Math.max(1, Math.floor((y1 - y0) / 4));
    for (let yy = y0; yy < y1; yy += sy) for (let xx = x0; xx < x1; xx += sx) { const i = (yy * w + xx) * 4; const a = rgba[i + 3] == null ? 255 : rgba[i + 3]; const t = a / 255; r += rgba[i] * t + 255 * (1 - t); g += rgba[i + 1] * t + 255 * (1 - t); b += rgba[i + 2] * t + 255 * (1 - t); n++; }
    const j = (y * W + x) * 3; o[j] = r / n; o[j + 1] = g / n; o[j + 2] = b / n; } return { P: o, W, H }; }
/* 조각(비율 범위) → 평균 밝기·흩어짐·채도 */
function patch(T, y0, y1, x0, x1) { const { P, W, H } = T; let n = 0, sL = 0, sL2 = 0, sS = 0;
  for (let y = Math.floor(y0 * H); y < Math.max(Math.floor(y0 * H) + 1, Math.floor(y1 * H)); y++) for (let x = Math.floor(x0 * W); x < Math.max(Math.floor(x0 * W) + 1, Math.floor(x1 * W)); x++) { const j = (y * W + x) * 3; const r = P[j], g = P[j + 1], b = P[j + 2]; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); const L = 0.299 * r + 0.587 * g + 0.114 * b; n++; sL += L; sL2 += L * L; sS += mx ? (mx - mn) / mx : 0; }
  const L = sL / n; return { L, sd: Math.sqrt(Math.max(0, sL2 / n - L * L)), sat: sS / n }; }
const wallOk = (c) => c.sd < TH.wallSd && c.sat < TH.wallSat && c.L > TH.wallLo && c.L < TH.wallHi;
const floorOk = (c) => c.sd < TH.flSd && c.sat < TH.flSat && c.L > TH.flLo && c.L < TH.flHi;
const camOf = (w, h) => { const ar = w / h; return Math.max(w, h) >= TH.camMin && (Math.abs(ar - 0.75) < TH.arTol || Math.abs(ar - 4 / 3) < TH.arTol * 1.8); };
/* 신호 셈 — 순수 셈(시험 tCOVER3D1114) */
function signals(rgba, w, h) { const T = tiny(rgba, w, h, 80); const tl = patch(T, 0, 0.08, 0, 0.15), tr = patch(T, 0, 0.08, 0.85, 1), bl = patch(T, 0.92, 1, 0, 0.15), br = patch(T, 0.92, 1, 0.85, 1);
  const wall = (wallOk(tl) ? 1 : 0) + (wallOk(tr) ? 1 : 0), floor = (floorOk(bl) ? 1 : 0) + (floorOk(br) ? 1 : 0);
  return { cam: camOf(w, h), wall, floor, bg: (wall === 2 ? 1 : 0) + (floor === 2 ? 1 : 0), w, h }; }
/* 판별 — o(입체 물건 사진 · 표지로 안 씀) · n(자리 그림) · c(평면 표지)
 *  ctx: { un(미등록), old(예전 judge 결과 {k,s}), off(스스로 끈 길 Set — 사람 고침으로 틀린 길) } */
function decide(sg, ctx) { ctx = ctx || {}; const old = ctx.old || { k: 'c', s: 0 }; const off = ctx.off || new Set(); const sig = [sg.cam ? 'cam' : '', 'bg' + sg.bg, ctx.un ? 'un' : '', old.k === 'o' ? 'old' : ''].filter(Boolean).join('.');
  const path = sg.cam ? (sg.bg ? 'cam_bg' : ctx.un ? 'cam_un' : old.k === 'o' ? 'cam_old' : '') : old.k === 'o' ? 'old' : ctx.un && sg.bg === 2 ? 'un_bg2' : '';
  if (old.k === 'n') return { k: 'n', s: old.s || 99, sig, path: 'ph' };
  if (path && !off.has(path)) { const s = { cam_bg: 92, cam_un: 80, cam_old: 85, old: Math.max(50, old.s || 60), un_bg2: 62 }[path]; return { k: 'o', s, sig, path }; }
  return { k: 'c', s: 0, sig, path: path ? path + ':off' : '' }; }
const valStr = (r) => r.k + (r.k === 'c' ? '' : String(Math.max(0, Math.min(99, r.s | 0)))) + '|' + String(r.sig || '').slice(0, 40);
const pkPart = (v) => (v && G2_RE.test(v) ? v.split('|')[0] : null);
const sigPart = (v) => (v && G2_RE.test(v) ? v.split('|')[1] : '');

/* ══ 채점 — 사람이 고른 것(shelfPick C=표지다 · O=사진 · N=그림 없음)과 엔진 판별을 견줌 · 길(path)마다 맞힌 몫(베타 수축)
 *  스스로 고치기(제34조): 한 길이 사람 고침 5건 넘고 맞힌 몫이 0.8 아래면 그 길을 끔(off) → 다음 회차부터 그 길로는 'o'를 내지 않음(다시 셈은 새 그림부터 · 지난 판별은 일지에 남김) */
function score(vals, picks) { const byPath = {}; let tp = 0, fp = 0, fn = 0, tn = 0, n = 0;
  for (const [k, v] of vals) { const p = picks.get(k); if (!p || !/^[CON]$/.test(p)) continue; const e = pkPart(v); if (!e) continue; n++; const truthO = p !== 'C'; const engO = e[0] !== 'c';
    if (engO && truthO) tp++; else if (engO && !truthO) fp++; else if (!engO && truthO) fn++; else tn++;
    const sig = sigPart(v); const path = engO ? (/cam/.test(sig) ? (/bg[12]/.test(sig) ? 'cam_bg' : /un/.test(sig) ? 'cam_un' : 'cam_old') : /old/.test(sig) ? 'old' : 'un_bg2') : 'c';
    const o = byPath[path] || (byPath[path] = { n: 0, ok: 0 }); o.n++; if (engO === truthO) o.ok++; }
  for (const k in byPath) { const o = byPath[k]; o.rate = Math.round(((o.ok + 4) / (o.n + 5)) * 1000) / 1000; }
  return { n, tp, fp, fn, tn, prec: tp + fp ? Math.round((tp / (tp + fp)) * 1000) / 1000 : null, rec: tp + fn ? Math.round((tp / (tp + fn)) * 1000) / 1000 : null, byPath }; }
const offFrom = (sc, was) => { const off = new Set(was || []); const why = []; for (const [k, o] of Object.entries((sc && sc.byPath) || {})) { if (k === 'c') continue; if (o.n >= 5 && o.rate < 0.8 && !off.has(k)) { off.add(k); why.push(`${k} 끔(사람 고침 ${o.n}건 중 맞음 ${o.ok})`); } } return { off: [...off], why }; };
/* 단계(NEW_STUDY 5) — 사람 고침과 견준 정밀도로 엔진이 스스로: 1 그림자 · 2 안내 · 3 작게 · 4 전부(이 엔진은 처음부터 서가에 씀 = 4, 정밀도가 떨어지면 내려 'o'를 덜 냄) */
function stageOf(sc, prev) { const p = sc && sc.prec; const n = (sc && sc.tp + sc.fp) || 0; if (n >= 10 && p != null && p < 0.85) return { n: Math.max(1, (prev || 4) - 1), why: `사람 고침과 견준 정밀도 ${p}(n ${n}) — 0.85 아래라 한 단계 내림` }; return { n: prev || 4, why: n ? `정밀도 ${p}(n ${n})` : '사람 고침 아직 없음 — 정답 표본(11/14 Claude 눈으로 437장) 정밀도·재현율로 시작' }; }

/* ══ 클라우드 일 — shop.js가 부름 · 5분마다 최대 TICK_N장(미등록 먼저 → 음반·영상 → 나머지) · 셋씩 나란히 */
const TICK_N = 150, TICK_MS = 300e3, PAR = 3;
const KIND_M = /^(음반|LP|DVD|블루레이|그 밖|잡지)$/;
const rankOf = (x) => (x.un ? 0 : KIND_M.test(String(x.cp || '').split('>')[0]) ? 1 : 2);
function make3d({ C, bucket, log, pathOf, srcOf, fetch: F, now }) {
  const CV = require('./shop-cover.js'); const PH = require('./shop-photo.js'); const fx = F || ((u, o) => fetch(u, o)); const NOW = now || (() => Date.now());
  const ST = { m: new Map(), at: 0, busy: null, dirty: new Map(), runAt: 0, done: 0, fail: 0, lastErr: null, day: { d: null, n: { c: 0, o: 0, n: 0 }, paths: {}, ms: 0 }, off: [], loadedOff: false };
  const load = async () => { if (ST.at && NOW() - ST.at < 3600e3) return; try { const ss = await C('shop_photo').get(); ss.forEach((d) => { const m = (d.data() || {}).m || {}; for (const k in m) if (k.startsWith('g' + GEN + ':') && G2_RE.test(m[k])) ST.m.set(k.slice(3), m[k]); }); ST.at = NOW(); } catch (e) { log && log('📐 표지 판별 읽기 실패', e.message); }
    if (!ST.loadedOff) { try { const d = await C('app_settings').doc('cov3d_state').get(); const v = d.exists ? d.data() || {} : {}; ST.off = Array.isArray(v.off) ? v.off.slice(0, 10) : []; ST.loadedOff = true; } catch (e) {} } };
  const flush = async () => { const by = new Map(); for (const [k, v] of ST.dirty) { const b = PH.bucketOf(k); if (!by.has(b)) by.set(b, {}); by.get(b)[keyG(k)] = v; } ST.dirty.clear();
    for (const [b, m] of by) { try { await C('shop_photo').doc(b).set({ m, at: new Date(NOW()).toISOString(), writer: 'cloud-cov3d' }, { merge: true }); } catch (e) { log && log('📐 표지 판별 쓰기 실패', b, e.message); } } };
  const dayKey = () => new Date(NOW() + 9 * 3600e3).toISOString().slice(0, 10);
  async function tick(items, scope, n) { if (ST.busy) return ST.busy; ST.busy = (async () => { await load(); let jpeg = null; try { jpeg = require('jpeg-js'); } catch (e) { ST.lastErr = 'jpeg-js 없음'; return 0; }
    const off = new Set(ST.off); const L = []; const seen = new Set();
    for (const x of items || []) { if (!x || !x.im) continue; if (scope !== 'all' && !(x.un || PH.wants(x, 'unreg'))) continue; const k = CV.keyOfIm(x.im); if (!k || seen.has(k) || ST.m.has(k)) continue; seen.add(k); L.push([rankOf(x), k, !!x.un]); }
    L.sort((a, b) => a[0] - b[0]); const want = L.slice(0, n || TICK_N); const B = bucket(); let done = 0, qi = 0; const t0 = NOW(); if (ST.day.d !== dayKey()) ST.day = { d: dayKey(), n: { c: 0, o: 0, n: 0 }, paths: {}, ms: 0 };
    const one = async () => { while (qi < want.length) { const [, k, un] = want[qi++]; try { const { im } = await CV.loadCover(k, { B, jpeg, pathOf, srcOf, fx }); const sg = signals(im.data, im.width, im.height); const old = PH.judge(im.data, im.width, im.height); const r = decide(sg, { un, old, off });
        const v = valStr(r); ST.m.set(k, v); ST.dirty.set(k, v); ST.day.n[r.k] = (ST.day.n[r.k] || 0) + 1; ST.day.paths[r.path || 'c'] = (ST.day.paths[r.path || 'c'] || 0) + 1; done++; }
      catch (e) { ST.fail++; ST.lastErr = String(e.message || e).slice(0, 120); if (/No such object|404|^fmt:|SOI not found|png |gif /.test(ST.lastErr)) { const v = 'c|x'; ST.m.set(k, v); ST.dirty.set(k, v); } }
      if (ST.dirty.size >= 100) await flush(); } };
    await Promise.all(Array.from({ length: Math.min(PAR, want.length) }, one)); if (ST.dirty.size) await flush(); ST.done += done; ST.runAt = NOW(); ST.lastN = done; ST.day.ms += NOW() - t0; return done; })().finally(() => { ST.busy = null; }); return ST.busy; }
  const pkOf = (im) => { const k = CV.keyOfIm(im); const v = k ? ST.m.get(k) : null; return v && !v.endsWith('|x') ? pkPart(v) : null; }; /* 못 받은 그림(c|x)은 예전 판정에 맡김 */
  const has = (im) => { const k = CV.keyOfIm(im); return !!(k && ST.m.has(k)); };
  /* 하루 회차(/daily 또는 숍 1분 고리가 하루 한 번) — 셈·채점·단계·고친 점·일지(eng_ledger/cov3d_<날>)·연구 맥박(research_pulse V02)·app_settings/cov3d_state */
  async function daily(items, picks) { await load(); const d = dayKey(); const P = new Map(); const byId = new Map((items || []).filter(Boolean).map((q) => [String(q.id), q])); for (const [id, x] of picks || []) { const it = byId.get(String(id)); const k = it && CV.keyOfIm(it.im); if (k && x && x.k) P.set(k, x.k); }
    const cnt = { all: 0, judged: 0, wait: 0, by: {} }; for (const x of items || []) { if (!x || !x.im) continue; const k = CV.keyOfIm(x.im); if (!k) continue; cnt.all++; const v = ST.m.get(k); const pk = v ? pkPart(v) : null; if (!v) { if (x.un || PH.wants(x, 'unreg')) cnt.wait++; continue; } cnt.judged++;
      const kind = String(x.cp || '').split('>')[0] || '?'; const g = (x.un ? '미등록' : '등록') + '·' + kind + '·' + (pk ? pk[0] : 'c'); cnt.by[g] = (cnt.by[g] || 0) + 1; }
    const sc = score(ST.m, P); let prev = {}; try { const s = await C('app_settings').doc('cov3d_state').get(); prev = s.exists ? s.data() || {} : {}; } catch (e) {}
    const fx2 = offFrom(sc, prev.off); const stage = stageOf(sc, prev.stage && prev.stage.n); ST.off = fx2.off;
    const fixes = (prev.fixes || []).slice(0, 30); for (const w of fx2.why) fixes.unshift({ d, t: w }); if (prev.stage && prev.stage.n !== stage.n) fixes.unshift({ d, t: `단계 ${prev.stage.n} → ${stage.n}: ${stage.why}` });
    const trend = (prev.trend || []).filter((x) => x.d !== d).concat([{ d, judged: cnt.judged, o: Object.entries(cnt.by).filter(([k]) => k.endsWith('·o')).reduce((a, [, v]) => a + v, 0), prec: sc.prec, rec: sc.rec }]).slice(-60);
    const state = { gen: GEN, at: new Date(NOW()).toISOString(), d, stage, off: fx2.off, fixes: fixes.slice(0, 30), score: sc, cnt, today: ST.day, trend, lab: prev.lab || null, th: TH };
    await C('app_settings').doc('cov3d_state').set(state, { merge: false });
    await C('eng_ledger').doc('cov3d_' + d).set({ engine: 'V02', at: state.at, saw: { items: cnt.all, judged: cnt.judged, wait: cnt.wait, human: sc.n }, did: { today: ST.day.n, paths: ST.day.paths }, why: '새 그림 판별 · 사람 고침 채점 · 틀린 길 끄기', result: { prec: sc.prec, rec: sc.rec, stage: stage.n }, fixed: fx2.why }, { merge: true });
    try { await C('app_settings').doc('research_pulse').set({ studies: { V02: { at: state.at, metric: '사람 고침 정밀도', value: sc.prec, judged: cnt.judged, o: trend[trend.length - 1].o, changed: fx2.why.length > 0 } } }, { merge: true }); } catch (e) {}
    return state; }
  return { tick, pkOf, has, load, daily, state: () => ({ gen: GEN, n: ST.m.size, done: ST.done, fail: ST.fail, runAt: ST.runAt, lastErr: ST.lastErr, lastN: ST.lastN || 0, today: ST.day, off: ST.off }) };
}
module.exports = { GEN, G2_RE, TH, tiny, patch, signals, decide, valStr, pkPart, sigPart, score, offFrom, stageOf, camOf, make3d, keyG, TICK_N, TICK_MS, rankOf };
