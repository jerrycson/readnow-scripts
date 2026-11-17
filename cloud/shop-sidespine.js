/* 📚 (11/18 일꾼 spine4 · 리드 결정 F57) 우리 사진(물건 전체 사진 'o')에서 책등 띠를 저절로 잘라 서가 책등으로 — 돈 0(화소 셈만 · 외부 AI·돈 드는 읽기 없음)
 *  까닭: 미등록 책(우리가 찍은 사진)은 알라딘 책등 그림이 없어 서가에 지어낸 책등이 나옴 · 비스듬히 세워 찍은 한 권 사진에는 왼쪽에 책등이 보이는 일이 많음
 *  하는 일(BG 서버만 · 10분마다 최대 30장 · 셋씩 나란히):
 *   ① 대상 = 판매중 상품 중 책등 칸이 비었고(도서 정보 images.spine 없음) 사진 판정이 'o'(물건 전체 사진)인 것 — 사람 판정(📷 서가 표지·사진 바로잡기)이 있으면 그것이 이김
 *      · 🔒 잠긴 상품(prd_locks on)은 건너뜀(안전 쪽 · 못 읽으면 이번 회차 쉼)
 *   ② 저장소 그림(사진 판정과 같은 길 loadCover)을 풀어 공용 셈 readnow-cutout-core.js sideSpine → 점수 ≥ 문턱(기본 0.95 · 설정 shelf.sideSpineMin)일 때만
 *      원본에서 기운 띠를 세워 잘라 img/<도서>/spine_p.jpg 로 저장 → prd_books/<도서>.images.spine = { src: null, stored, by: 'cloud-photo', conf, at }
 *      · 쓰기 바로 전 도서 정보를 다시 읽어 책등 칸이 여전히 비었을 때만 씀(수집기·사람이 넣은 값은 늘 이김 · 덮지 않음 · 지우지 않음)
 *   ③ 펼친 한 장 쪼개기(splitSpread)는 그림자 단계 — 결과(점수·책등 몫·짐작 몫)를 기록에만 남김(사진·도서 정보 안 바꿈)
 *  기록 shop_sidespine/b00~b31 {m:{도서:'YYMMDD.결과'}} — 결과 = S95(저장·점수%) · N42(문턱 아래) · H(이미 책등 있음) · E(못 받음) · 뒤에 ~쪼개기(점수%:책등 몫‰:짐작‰)
 *   · 한 번 본 사진은 다시 보지 않음(사진이 바뀌면 다시 셈하려면 그 줄만 지움) · 맞춤률이 낮으면 저절로 '천천히'·'멈춤'(shop-spine.js autoPlan 같은 틀 · _auto)
 *  잰 값: reports/SPINE4_1118.md(readnow-chats) — 문턱 0.95에서 받아들인 7장 모두 맞음 · 책등이 보이는 한 권 사진의 27% · 책등 아닌 사진 53장 0장
 *  설정(app_settings/shop.shelf): sideSpine(false면 끔) · sideSpineMin(문턱 0.8~0.99) · sideSpineN(회차당 장 수) · sideSpineRate(바라는 맞춤률 % · 기본 3) · sideSpineAuto(false면 저절로 줄이지 않음) */
'use strict';
const SPN = require('./shop-spine.js');
const CV = require('./shop-cover.js');
const CUT = (() => { for (const f of ['./cores_readnow-cutout-core.js', '../readnow-cutout-core.js']) { try { const m = require(f); if (m && m.sideSpine) return m; } catch (e) {} } return null; })();
const TICK_N = 30, PAR = 3, TICK_MS = 600e3, MAX_H = 900;
const REC_RE = /^\d{6}\.(?:S\d{1,3}|N\d{1,3}|H|E)(?:~\d{1,3}:\d{1,4}:\d{1,4})?$/;
const ymd = (t) => new Date(t + 9 * 3600e3).toISOString().slice(2, 10).replace(/-/g, '');
/* 짐작 책등 몫 — 크기 '가로x세로x두께'(mm)·쪽수 */
const ratioOf = (x) => (CUT && CUT.spineRatio ? CUT.spineRatio(x && x.sz, +(x && x.pg) || 0) : 0);
/* 설정 → autoPlan 틀(책등 규칙 주소와 같은 저절로 줄이기 · 바라는 맞춤률 기본 3%) */
const planCfg = (sc) => { sc = sc || {}; return { spineRule: sc.sideSpine === false ? false : undefined, spineRuleAuto: sc.sideSpineAuto, spineRuleMin: +sc.sideSpineRate || 3, spineRuleN: Math.max(1, Math.min(60, +sc.sideSpineN || TICK_N)) }; };
const minOf = (sc) => { const v = +((sc || {}).sideSpineMin); return v >= 0.8 && v <= 0.99 ? v : (CUT && CUT.SIDE ? CUT.SIDE.auto : 0.95); };
/* 고를 차례 — items = [{ x: 판매중 상품, id: 그 상품의 도서 번호 }] · books(도서 → 요약) · pk(사진 주소) → 'o…'|'c…'|null · human(상품) → {k,src}|null · locked(Set) · seen(도서 → 기록) */
function pick(items, o) { const out = []; const done = new Set(); const L = (items || []).filter((e) => e && e.x).sort((a, b) => String(b.x.at || '').localeCompare(String(a.x.at || '')));
  for (const e of L) { const x = e.x; if (x.sp) continue; const k = CV.keyOfIm(x.im); if (!k || done.has(k)) continue; done.add(k);
    if (o.locked && (o.locked.has(String(x.id)) || o.locked.has(k))) continue;
    const hu = o.human ? o.human(x.id) : null; if (hu && (hu.src || hu.k !== 'O')) continue; /* 사람이 표지·자리 그림으로 정했거나 다른 그림을 골랐으면 안 봄 */
    if (!hu) { const a = o.pk ? o.pk(x.im) : null; if (!a || a[0] !== 'o') continue; }
    const id = e.id || k; if (id !== k) continue; /* 사진이 그 도서의 앞표지 칸일 때만(다른 도서 그림을 빌린 것은 안 봄) */
    const b = o.books && o.books.get(id); if (!b || SPN.hasSpine(b)) continue; if (o.seen && o.seen.has(id)) continue;
    out.push({ id, x }); if (out.length >= (o.n || TICK_N)) break; }
  return out; }
/* 한 장 셈(순수) — 그림 → { side(sideSpine 결과), split(그림자), rec(기록 글 뒤쪽) } */
function judge(im, ratio, th) { if (!CUT) return null; const img = { w: im.width, h: im.height, d: im.data };
  const side = CUT.sideSpine(img); const sp = CUT.splitSpread(img, { ratio: ratio || 0 }); const ok = !!(side.ok && side.conf >= th);
  const code = (ok ? 'S' : 'N') + Math.round((side.conf || 0) * 100); const tail = sp.ok ? `~${Math.round(sp.conf * 100)}:${Math.round(sp.why.w * 1000)}:${Math.round((ratio || 0) * 1000)}` : '';
  return { ok, side, split: sp, code: code + tail }; }

/* 클라우드 일 — makeShop이 부름 · deps: { C, db, bucket, log, pathOf, srcOf, fetch(시험), onSaved(도서, 책등 칸) } */
function makeSideSpine({ C, db, bucket, log, pathOf, srcOf, fetch: F, onSaved, jpeg: J }) {
  const fx = F || ((u, op) => fetch(u, op));
  const ST = { m: new Map(), at: 0, busy: null, dirty: new Map(), runAt: 0, seen: 0, saved: 0, split: 0, fail: 0, skip: 0, lastErr: null, last: [], auto: { rec: '', until: null, stops: 0 }, autoDirty: false, plan: null, off: !CUT };
  const load = async () => { if (ST.at && Date.now() - ST.at < 6 * 3600e3) return; try { const ss = await C('shop_sidespine').get(); ss.forEach((d) => { const v = d.data() || {}; if (d.id === '_auto') { if (!ST.autoDirty) ST.auto = { rec: String(v.rec || '').replace(/[^01]/g, '').slice(-SPN.AUTO.WIN), until: v.until || null, stops: +v.stops || 0 }; return; } const m = v.m || {}; for (const k in m) if (REC_RE.test(m[k])) ST.m.set(k, m[k]); }); ST.at = Date.now(); } catch (e) { log && log('📚 사진 책등 기록 읽기 실패', e.message); } };
  const flush = async () => { const by = new Map(); for (const [k, v] of ST.dirty) { const b = SPN.bucketOf(k); if (!by.has(b)) by.set(b, {}); by.get(b)[k] = v; } ST.dirty.clear();
    for (const [b, m] of by) { try { await C('shop_sidespine').doc(b).set({ m, at: new Date().toISOString(), writer: 'cloud-shop' }, { merge: true }); } catch (e) { log && log('📚 사진 책등 기록 쓰기 실패', b, e.message); } } };
  const saveAuto = async () => { if (!ST.autoDirty) return; ST.autoDirty = false; try { await C('shop_sidespine').doc('_auto').set({ rec: ST.auto.rec, until: ST.auto.until || null, stops: ST.auto.stops || 0, at: new Date().toISOString(), writer: 'cloud-shop' }, { merge: true }); } catch (e) { ST.autoDirty = true; } };
  const rec1 = (v) => { ST.auto.rec = (ST.auto.rec + v).slice(-SPN.AUTO.WIN); ST.autoDirty = true; };
  async function plan(sc, now) { await load(); now = now || Date.now(); const a = ST.auto;
    if (a.until && now >= Date.parse(a.until)) { ST.auto = { rec: '', until: null, stops: a.stops || 1 }; ST.autoDirty = true; await saveAuto(); }
    const p = SPN.autoPlan(ST.auto, planCfg(sc), now); if (ST.off) { p.mode = 'off'; p.n = 0; p.why = '공용 셈 파일 못 읽음'; }
    if (p.stopNow) { ST.auto.until = new Date(now + SPN.AUTO.STOP_DAYS * 864e5).toISOString(); ST.auto.stops = (ST.auto.stops || 0) + 1; ST.autoDirty = true; await saveAuto(); log && log('📚 사진 책등 — ' + p.why); }
    ST.plan = { mode: p.mode, n: p.n, every: p.every, why: p.why, rate: p.rate, asked: p.asked }; return p; }
  const lockedNow = async () => { try { const q = await C('prd_locks').where('on', '==', true).get(); const S = new Set(); q.docs.forEach((d) => { const v = d.data() || {}; S.add(String(d.id)); if (v.lid) S.add(String(v.lid)); }); return S; } catch (e) { return null; } };
  /* 책등 칸이 비었을 때만 씀 — 거래(있으면) 안에서 다시 읽음 */
  const writeSpine = async (id, val) => { const ref = C('prd_books').doc(id); const body = { images: { spine: val }, writer: 'cloud-shop' };
    if (db && typeof db.runTransaction === 'function') return db.runTransaction(async (t) => { const s = await t.get(ref); const b = s.exists ? s.data() : null; if (!b || SPN.hasSpine(b)) return false; t.set(ref, body, { merge: true }); return true; });
    const s = await ref.get(); const b = s.exists ? s.data() : null; if (!b || SPN.hasSpine(b)) return false; await ref.set(body, { merge: true }); return true; };
  /* 회차: items([{x, id}] 판매중 상품·도서) · books · o = { n, sc(서가 설정), pk, human } */
  async function tick(items, books, o) { o = o || {}; if (ST.busy) return ST.busy; ST.busy = (async () => { await load(); if (!CUT) return 0; let jpeg = J || null; if (!jpeg) { try { jpeg = require('jpeg-js'); } catch (e) { ST.lastErr = 'jpeg-js 없음'; return 0; } }
    const locked = await lockedNow(); if (!locked) { ST.lastErr = '잠금 목록 못 읽음 — 이번 회차 쉼'; return 0; }
    const want = pick(items, { ...o, books, locked, seen: ST.m }); const B = bucket(); const th = minOf(o.sc); let qi = 0, hit = 0; const now = Date.now();
    const one = async () => { while (qi < want.length) { const { id, x } = want[qi++]; let v = null;
      try { const { im } = await CV.loadCover(id, { B, jpeg, pathOf, srcOf, fx }); const r = judge(im, ratioOf(x), th); ST.seen++; if (r.split.ok) ST.split++;
        if (r.ok) { const box = r.side.box; const c = CUT.cropBox({ w: im.width, h: im.height, d: im.data }, box, MAX_H); const buf = Buffer.from(jpeg.encode({ data: c.d, width: c.w, height: c.h }, 88).data);
          const path = `img/${id}/spine_p.jpg`; const val = { src: null, stored: path, by: 'cloud-photo', conf: r.side.conf, at: new Date().toISOString() };
          const b0 = books.get(id); if (b0 && SPN.hasSpine(b0)) { v = 'H'; ST.skip++; }
          else { await B.file(path).save(buf, { contentType: 'image/jpeg', metadata: { cacheControl: 'public,max-age=31536000' }, resumable: false });
            const w = await writeSpine(id, val); if (w) { ST.saved++; hit++; rec1('1'); v = r.code; if (onSaved) { try { onSaved(id, val); } catch (e) {} } } else { v = 'H'; ST.skip++; } } }
        else { v = r.code; rec1('0'); }
        ST.last.unshift([id, v]); ST.last.length = Math.min(ST.last.length, 12); }
      catch (e) { ST.fail++; ST.lastErr = String(e.message || e).slice(0, 120); v = 'E'; }
      const code = ymd(now) + '.' + v; ST.m.set(id, code); ST.dirty.set(id, code); if (ST.dirty.size >= 50) await flush(); } };
    await Promise.all(Array.from({ length: Math.min(PAR, want.length) }, one)); if (ST.dirty.size) await flush(); await saveAuto(); ST.runAt = Date.now(); ST.lastN = want.length; return hit; })().finally(() => { ST.busy = null; }); return ST.busy; }
  return { tick, load, plan, state: () => ({ n: ST.m.size, seen: ST.seen, saved: ST.saved, split: ST.split, skip: ST.skip, fail: ST.fail, runAt: ST.runAt, lastN: ST.lastN || 0, lastErr: ST.lastErr, last: ST.last.slice(0, 8), core: CUT ? CUT.VERSION : null, auto: { ...(ST.plan || {}), recN: ST.auto.rec.length, hitN: (ST.auto.rec.match(/1/g) || []).length, until: ST.auto.until, stops: ST.auto.stops } }) };
}
module.exports = { makeSideSpine, pick, judge, ratioOf, planCfg, minOf, REC_RE, TICK_N, TICK_MS, PAR, CUT };
