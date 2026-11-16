/* y24auto.js — (headless1 11/14 · 정범님 11/14 17:37 「왜 웹앱을 키도록 구성하고 있는 거야? 수집기만 해도 불편한데」) 🤖 예스24 자동 올림의 '무엇을 올릴지' 판단을 클라우드로
 *
 * 왜: 예전엔 후보 고르기·올림 장부 트랜잭션·판매가·엑셀 만들기를 HOME 웹앱 탭(src/app.html y24AutoTick)이 하고, 번외(col2-y24reg.js)는 받은 엑셀을 올리기만 함
 *     → 웹앱 탭이 닫히면 예스24 자동 올림이 멈춤. 사람 화면이 필요한 일이 아님(확인 화면 없음 · 자료 읽기와 셈뿐).
 * 어떻게: 번외가 1분마다 하는 홀로 연결(/c2/solo · cloud/col2solo.js · 서명된 그 PC만)에 '예스24 올림 상태·결과'를 실어 보냄 → 이 모듈이
 *     ① 결과를 장부(app_settings/y24_reg)에 적고(웹앱 y24AutoApply와 같음) ② 다음 묶음을 골라 장부에 먼저 적고(트랜잭션 · 되풀이 0 — 웹앱 y24AutoCommit과 같음)
 *     ③ 엑셀(같은 SheetJS 0.18.5 · 같은 칸 y24RegAoa)을 만들어 답에 실음 → 번외가 예전과 같은 put()·검사(checkJob)·올리기를 함
 * 셈은 한 벌: 후보·차례·까닭·엑셀 칸 = 웹앱 src/app.html의 ◆y24reg 덩어리를 그대로 떼어 씀(시험 tY24REG와 같은 방식 · 클라우드가 운영 본체 benchFinish를 떼어 쓰는 것과 같음)
 *            판매가(F45) = 공용 파일 readnow-ext-core.js y24PriceOf·y24FakeAll · SKU = readnow-registry.js skuFull · 멈춤 기준 = readnow-shipping-core.js autoCfg
 *            여기 있는 것은 Firestore에서 자료를 모으는 일(웹앱 y24RegL·y24RegX·y24RegC·y24HeldMap·y24WantLids·y24MktGo와 같은 뜻 — 함수마다 짝을 적음)뿐
 * 지킴: 로거 PC·MJ-MAIN은 안 함(약속 0·출고 보호) · 알라딘·예스24 로그인 일은 하지 않음(올리기는 그 PC 번외만 · F25/F33) · 모르면 빼는 쪽(예스24에 같은 책이 있을지 모르면 후보에서 뺌)
 *       장부에 '올리는 중'이 남아 있으면 새 묶음을 내지 않음(y24AutoPlan fly) · 처음 확인 전엔 1건만(번외 checkJob이 한 번 더 막음) · 지우지 않음 */
'use strict';
const ISBN_RE = /^(97[89]\d{10}|\d{9}[\dXx])$/;
const BLOCK_A = '/* ◆y24reg 시작', BLOCK_B = '/* ◆y24reg 끝 */';
const BLOCK_NAMES = ['Y24R_DEF', 'y24RegCfg', 'y24RegPrice', 'y24RegState', 'y24RegJudge', 'y24RegAoa', 'y24RegFilter', 'y24AutoHuman', 'y24AutoPlan', 'y24AutoCand'];
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; /* 웹앱 needXLSX·수집기 @require와 같은 판 */
const WEB_URL = 'https://readnow.kr/app/readnow-webapp.js'; /* 저장소에서 못 받을 때(비공개 뒤) — 같은 덩어리가 든 지금 웹앱 본문 */
const MKT_MAX = 120; /* 한 번에 시장 지표를 받는 책 수(웹앱 Y24E_MAX 400보다 작게 — 1분마다 불리므로) · 근거: 없음 */
const DATA_MS = 10 * 60e3; /* 상품·주문·예스24 목록 다시 읽기(웹앱은 실시간 듣기 · 클라우드는 10분) · 근거: 없음 — 웹앱 y24AdmLoad 10분과 같게 */
/* (r1116-y24 · 정밀 점검 11/14 ④·⑦ '위험 2 이중 판매') 🛑 알라딘에서 팔린 책 → 예스24 매물 판매중지 맡김 — 자동 올림이 기본 켬·상한 없음인데 내리는 쪽이 없었음
 *  on = 켬(기본) · day = 하루 맡김 상한 · run = 한 차례 상한 · gapMin = 실패 뒤 다시 맡기기까지 분 · tries = 몇 번 실패하면 사람에게 · everyS = 몇 초마다 · holdMin = 팔림 표시 없이 '판매중 아님'만이면 몇 분 이어 본 뒤
 *  trip = 한 차례 후보가 이 수를 넘고 올린 줄의 절반을 넘으면 멈춤(자료가 덜 온 때 한꺼번에 내리지 않게) · ⚙ app_settings/platforms.y24.down 으로 바꿈({ on: 0 } = 끔) · 근거: 없음 — 웹앱 자동 내림 예스24 한도(OMNI_LIM 10)보다 작게 시작 */
const DOWN_DEF = { on: 1, day: 30, run: 3, gapMin: 30, tries: 3, everyS: 120, holdMin: 10, trip: 40 };
const DOWN_MAX = { day: 200, run: 10, gapMin: 1440, tries: 10, everyS: 3600, holdMin: 1440, trip: 1000 };
const W_CMD = 'col2_y24_cmd'; /* 번외 예스24 쓰기 맡김(웹앱 Y24W_CMD · 수집기 wRelay가 맡은 PC 번외 /y24/w/put에 넘김) */
const W_ACT = ['hold', 'expired', 'new', 'took', 'run', 'local']; /* 웹앱 Y24P_ST — 아직 끝나지 않은 맡김 */
const ID_RE = /^[\w.:|-]{3,160}$/, SELF_RE = /^[\w.-]{2,40}$/; /* 번외 col2-y24w.js checkJob과 같은 검사 */
const SOLD_R = ['cash', 'elsewhere', 'lost', 'disp']; /* 웹앱 STOP_REASONS 중 '재고에서 뺌'(실물이 없음) */
const DOWN_SRC = 'alsold'; /* 맡김 줄 출처 — 웹앱 y24PFind가 이 줄은 클라우드에 맡김('wait') */
const holderOf = (plat) => String((plat && plat.y24Holder) || '').trim().toUpperCase().slice(0, 40) || 'HOME'; /* 웹앱 y24HolderOf */
function downCfg(plat) { const d = ((plat && plat.y24) || {}).down || {}; const o = { ...DOWN_DEF }; for (const k of Object.keys(DOWN_MAX)) if (d[k] != null && d[k] !== '' && isFinite(+d[k])) o[k] = Math.max(k === 'gapMin' || k === 'holdMin' ? 0 : 1, Math.min(DOWN_MAX[k], Math.round(+d[k]))); if (d.on != null) o.on = d.on ? 1 : 0; return o; }

/* ── 웹앱과 같은 작은 셈(웹앱 줄을 그대로 옮김) ── */
const y24Isbn = (v) => { let s = String(v || '').replace(/[^0-9Xx]/g, ''); if (/^880\d{10}$/.test(s)) { const b = '978' + s.slice(3, 12); let t = 0; for (let i = 0; i < 12; i++) t += +b[i] * (i % 2 ? 3 : 1); s = b + ((10 - (t % 10)) % 10); } return s.length === 13 ? s : null; }; /* 웹앱 y24Isbn */
const y24G = (g) => { const m = String(g || '').match(/최상|상|중|하/); return m ? m[0] : null; }; /* 웹앱 y24G */
const aladinLive = (l) => !!l && (l._activeAladin ?? l.active) && !['판매중지', '일시판매중지', '판매완료', '판매금지'].includes(l.status || '') && !(l.qty === 0); /* 웹앱 aladinLive */
const isDupes = (l) => /^\s*DUPES/i.test(String((l && l.sku) || '')); /* 웹앱 isDupes */
const kstDay = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10); /* 웹앱 kstDay */
const y24eNd = (v) => !v || (!v.none && !Array.isArray(v.page1)); /* 웹앱 y24eNd — 아직 시장 지표 없음 */
const Y24_LV = { '01': '최상', '02': '상', '03': '중', '04': '하' };
const y24Pk = (r, re, ex) => { for (const k of Object.keys(r || {})) { if (re.test(k) && !(ex && ex.test(k)) && r[k] != null && r[k] !== '') return r[k]; } return null; };
const y24Nm = (r, L) => { for (const k of L) { const v = r && r[k]; if (v != null && v !== '') return v; } return null; };
/* 웹앱 y24AdmRow(쓰는 칸만: no·ean·grade·st·self·at) */
function y24AdmRow(r, at) { const no = String(r.GOODS_NO || y24Pk(r, /^(USED_)?GOODS_?NO$/i) || ''); if (!/^\d{6,}$/.test(no)) return null;
  const st = y24Nm(r, ['GOODS_STAT_GB', 'SALE_STATE_GB']) ?? y24Pk(r, /^(SALE_|GOODS_|USED_)?(STAT|STATE|STS)(_GB|_CD)?$/i, /LEVEL|NM$/i); const lv = r.GOODS_LEVEL_GB_NM || Y24_LV[String(r.GOODS_LEVEL_GB || '').padStart(2, '0')] || null;
  return { no, at, ean: y24Isbn(r.EAN || r.BARCODE || y24Pk(r, /ISBN/i)), grade: y24G(lv), st: st == null ? null : String(st).padStart(2, '0'), self: y24Pk(r, /(SELF|OWN|ENTR_GOODS|SELLER_GOODS|SELR_GOODS|MNG|CUST_GOODS)_?(CD|CODE|NO)$/i, /^MAN_NO$/i) }; }
const evalMod = (txt, extra) => { const m = { exports: {} }; const root = {}; new Function('module', 'exports', 'globalThis', 'window', txt)(m, m.exports, root, root); return (m.exports && Object.keys(m.exports).length ? m.exports : null) || extra && root[extra] || null; };
const cutBlock = (src) => { const a = src.indexOf(BLOCK_A), b = src.indexOf(BLOCK_B); if (a < 0 || b < a) return null; return src.slice(a, b + BLOCK_B.length); };
/* ◆y24reg 덩어리 → 함수 묶음(시험 tY24REG와 같은 방식) */
function blockOf(src) { const t = cutBlock(String(src || '')); if (!t) return null; const F = new Function(t + `\nreturn { ${BLOCK_NAMES.map((n) => `${n}: typeof ${n} !== 'undefined' ? ${n} : null`).join(', ')} };`)(); return BLOCK_NAMES.every((n) => F[n]) ? F : null; }

function makeY24Auto(o) { const { C, db, log = () => {} } = o; const now = o.now || Date.now; const iso = () => new Date(now()).toISOString(); const FV = o.FV;
  const getText = o.getText || (async (f) => { const r = await o.coreFetch(f); if (!r.ok) throw new Error(f + ' ' + r.status); return r.text(); });
  const getUrl = o.getUrl || (async (u) => { const r = await fetch(u + (u.includes('?') ? '&' : '?') + 't=' + now()); if (!r.ok) throw new Error(u + ' ' + r.status); return r.text(); });
  const M = { mods: null, modsAt: 0, data: null, dataAt: 0, mkt: new Map(), nd: new Map(), reqd: new Map(), last: new Map(), why: new Map() };
  /* 공용 셈 받기(30분마다 새로) — ◆y24reg 덩어리 · ext-core · registry · shipping · SheetJS */
  async function mods() { if (M.mods && now() - M.modsAt < 30 * 60e3) return M.mods; const m = { ...(M.mods || {}) }; const err = [];
    try { m.B = blockOf(await getText('src/app.html')); } catch (e) { m.B = null; } if (!m.B) { try { m.B = blockOf(await getUrl(WEB_URL)); } catch (e) { err.push('웹앱 셈 덩어리: ' + e.message); } }
    try { m.X = o.extMod ? await o.extMod() : evalMod(await getText('readnow-ext-core.js'), 'ReadnowExt'); } catch (e) { err.push('ext-core: ' + e.message); }
    try { m.R = evalMod(await getText('readnow-registry.js'), 'ReadnowRegistry'); } catch (e) { err.push('registry: ' + e.message); }
    try { m.SH = evalMod(await getText('readnow-shipping-core.js'), 'ReadnowShipping'); } catch (e) { err.push('shipping: ' + e.message); }
    if (!m.XL) { try { m.XL = o.xlsx || evalMod(await getUrl(XLSX_URL), 'XLSX'); } catch (e) { err.push('SheetJS: ' + e.message); } }
    m.err = err; if (m.B && m.X && m.X.y24PriceOf && m.R && m.R.skuFull && m.XL) { M.mods = m; M.modsAt = now(); } else M.mods = null; return m; }
  const doc = async (c, id) => { const d = await C(c).doc(id).get(); return d.exists ? d.data() || {} : null; };
  /* 자료 모으기(10분마다) — 웹앱이 실시간으로 듣던 칸을 읽기만 */
  async function data(force) { if (!force && M.data && now() - M.dataAt < DATA_MS) return M.data; const D = { at: now() };
    const [main, plat, ship, lk, seq] = await Promise.all(['main', 'platforms', 'ship_auto', 'y24_link', 'sku_seq'].map((k) => doc('app_settings', k)));
    D.main = main || {}; D.plat = plat || {}; D.ship = ship || {}; D.lk = { m: (lk && lk.m) || {}, x: (lk && lk.x) || {} };
    D.sku = new Map(); for (let i = 0; i <= +((seq && seq.mapN) || 0); i++) { const d = await doc('app_settings', 'sku_map_' + i); for (const [k, v] of Object.entries((d && d.m) || {})) D.sku.set(k, v); } /* 웹앱 skuWatch */
    D.list = []; (await C('prd_listings').where('status', '==', '판매중').get()).forEach((d) => { const v = d.data() || {}; D.list.push({ ...v, id: d.id }); }); /* 웹앱 S.plist 중 판매중(aladinLive가 다시 거름) */
    D.byLid = new Map(); for (const l of D.list) if (l.listingId != null) D.byLid.set(String(l.listingId), l.id);
    D.y24 = []; (await C('y24_listings').get()).forEach((d) => { const v = d.data() || {}; D.y24.push({ ...v, goodsNo: v.goodsNo || d.id }); }); /* 웹앱 y24Watch(S.y24.list) */
    D.adm = new Map(); try { const qs = await C('crm_y24_raw').where('sig', '==', 'POST /api/Product/ProductList').get(); const by = new Map(); qs.forEach((d) => { const v = { id: d.id, ...d.data() }; const base = v.part ? v.id.replace(/_\d+$/, '') : v.id; (by.get(base) || by.set(base, []).get(base)).push(v); }); /* 웹앱 y24AdmLoad(최근 60번) */
      const L = [...by.values()].map((X) => ({ at: X[0].at, body: X.sort((a, b) => (a.part || 0) - (b.part || 0)).map((x) => x.body || '').join('') })).sort((a, b) => String(a.at).localeCompare(String(b.at))).slice(-60);
      for (const r of L) { let j = null; try { j = JSON.parse(r.body); } catch (e) { continue; } const A = (j && (j.PRODUCT_LIST || j.RESULT_LIST || j.LIST)) || []; if (Array.isArray(A)) for (const x of A) { const a = y24AdmRow(x, r.at); if (a) D.adm.set(a.no, a); } } } catch (e) { D.admErr = e.code || e.message; }
    D.held = new Map(); D.heldAt = new Map(); const cut = new Date(now() - 14 * 864e5).toISOString(); /* 웹앱 y24HeldMap(MC_DAYS 14일) — 주문에 들어온 상품은 실물이 묶임 · (r1116-y24) heldAt = 그 상품의 가장 늦은 주문 시각(팔린 책 내림이 '올린 뒤 팔림'을 가림) */
    (await C('crm_orders').where('orderedAt', '>=', cut).get()).forEach((d) => { const v = d.data() || {}; if (v.kind !== 'sale') return; for (const it of v.items || []) { if (it.lineStatus && it.lineStatus !== 'normal') continue; const lid = it.listingKey || (it.aladinUsedCode ? 'aladin_' + it.aladinUsedCode : it.listingId != null ? D.byLid.get(String(it.listingId)) : null); if (!lid) continue; if (!D.held.has(lid)) D.held.set(lid, (v.platform === 'cash' ? '현금 ' : '주문 ') + String(v.orderNo || d.id || '').slice(-8)); const t = String(v.orderedAt || ''); if (t > ((D.heldAt.get(lid) || {}).t || '')) D.heldAt.set(lid, { t, ch: String(v.platform || '') }); } });
    D.reg = new Map(); const since = new Date(now() - 45 * 864e5).toISOString(); (await C('reg_items').where('createdAt', '>=', since).get()).forEach((d) => { const v = d.data() || {}; if (!v.bump) D.reg.set(d.id, { id: d.id, ...v }); }); /* 웹앱 regWatch */
    M.data = D; M.dataAt = now(); return D; }
  /* 웹앱 y24SkuSelf(skuFullOf + skuCoresL) */
  const skuSelf = (R, D, l) => { R.skuSupSet((D.main.reg || {}).srcX || []); const v = D.sku.get(l.id); const cores = v ? (v.c || []).map((c) => String(c).replace(/^RN(?=[a-z0-9]{5}$)/, '')) : []; const mg = String(l.sku || '').replace(/\s+/g, ''); return cores.map((c) => R.skuFull(mg, c)).filter(Boolean); };
  /* 웹앱 y24WantLids — 사람이 누른 기록(w.on) → 넣을 때 적힌 값(y24Reg) · 기기 🚦 토글은 기기에만 있어 모름 → 끔(기본값과 같음 · 모르면 안 올리는 쪽) */
  function wantLids(D, led) { const out = new Map(); const lidOf = (it) => { const rr = it && it.result; return rr && rr.state === 'live' && rr.usedCode ? 'aladin_' + rr.usedCode : null; };
    const on = (w, it) => (w && w.on != null ? !!+w.on : !it || it.mock || it.test ? false : it.y24Reg != null ? !!+it.y24Reg : false);
    for (const [rid, w] of Object.entries(led.w || {})) { const it = D.reg.get(rid); if (!on(w, it)) continue; const lid = (w && w.lid) || lidOf(it); if (lid) out.set(lid, rid); }
    for (const it of D.reg.values()) { if ((led.w || {})[it.id] || it.stage !== 'done' || !on(null, it)) continue; const lid = lidOf(it); if (lid && !out.has(lid)) out.set(lid, it.id); } return out; }
  /* 웹앱 y24RegC — 올라감 판정 자료 */
  const regC = (D) => ({ adm: [...D.adm.values()].map((a) => ({ no: a.no, ean: a.ean, grade: a.grade, self: a.self, at: a.at })), pub: D.y24.map((x) => ({ no: String(x.goodsNo), isbn: y24Isbn(x.isbn13), grade: y24G(x.grade), firstSeenAt: x.firstSeenAt })) });
  /* 웹앱 y24RegX — 예스24에 이미 있는 책·등급 · 자체코드 · 장부 SKU (y24V의 판매종료·판매완료 판단은 사람 기록·관리자 화면 그대로) */
  function regX(D, led, cfg, val) { const onY24 = new Map(); const add = (isbn, grade, no) => { if (!isbn) return; const k = isbn + '|' + (grade || ''); (onY24.get(k) || onY24.set(k, []).get(k)).push(String(no)); };
    const xOf = (no) => { for (const v of Object.values(D.lk.x)) if (v && v.gno && String(v.gno) === String(no)) return v; return null; };
    for (const x of D.y24) { if (x.goneAt) continue; const Mx = D.lk.m[x.goodsNo] || {}; const XL = xOf(x.goodsNo); const A = D.adm.get(String(x.goodsNo)) || null; const aNew = A && (!x.lastSeenAt || String(A.at) > String(x.lastSeenAt));
      const isbn = y24Isbn(Mx.isbn || (XL && XL.isbn) || x.isbn13 || (A && A.ean)); const grade = y24G(x.grade) || (A && A.grade) || y24G(XL && XL.grade) || y24G(Mx.grade);
      const ended = !!(Mx.ended != null ? Mx.ended : XL && XL.ended != null ? XL.ended : null); const admSold = !!(A && aNew && /^0?4$/.test(String(A.st || ''))); if (ended || admSold) continue;
      if (grade) add(isbn, grade, x.goodsNo); else ['최상', '상', '중', '하'].forEach((g) => add(isbn, g, x.goodsNo)); }
    const selfSet = new Set(); for (const a of D.adm.values()) { if (!/^0?(4|7)$/.test(String(a.st || ''))) add(a.ean, a.grade, a.no); String(a.self || '').split(/[,\s]+/).filter(Boolean).forEach((s) => selfSet.add(s)); }
    const ledSku = new Set(); for (const e of Object.values(led.r || {})) if (e && e.st !== 'retry') (e.skus || []).forEach((s) => ledSku.add(s)); return { onY24, selfSet, led: led.r || {}, ledSku, cfg, val }; }
  /* 웹앱 y24EngVal(use 'new') — 공용 파일 y24PriceOf 그대로 */
  function engVal(m, D, l, mk) { const y = D.plat.y24 || {}; const cfg = { ...(y.val || {}) }; if (cfg.cheapPct == null && m.SH && m.SH.autoCfg) { try { const A = m.SH.autoCfg(D.ship || {}); if (A && A.cheapPct != null) cfg.cheapPct = A.cheapPct; } catch (e) {} }
    const L = { alPrice: +l.price || 0, grade: y24G(l.grade), priceList: +l.priceList || 0, ourShip: cfg.ourShip != null ? cfg.ourShip : null };
    const d = mk || null; let page1 = d && Array.isArray(d.page1) ? d.page1 : d ? d.page1 : null; if (Array.isArray(page1) && !page1.some((x) => x && x.fk) && m.X.y24FakeAll) page1 = m.X.y24FakeAll(d, { own: ['jerrycson'] }, y.fake || null); /* 웹앱 y24EngRows */
    return m.X.y24PriceOf(L, d ? { ...d, page1 } : null, { cfg, use: 'new', lock: null, fkCfg: y.fake || null }); }
  /* 웹앱 y24EngLoad — 시장 지표 문서(y24_mkt) 모양 그대로 */
  async function mktLoad(isbns) { const t = now(); const L = [...new Set(isbns)].filter((i) => ISBN_RE.test(i) && (!M.mkt.has(i) || (y24eNd(M.mkt.get(i)) && t - M.mkt.get(i)._t > 10 * 60e3) || t - M.mkt.get(i)._t > 6 * 3600e3)).slice(0, MKT_MAX);
    for (let k = 0; k < L.length; k += 30) { const part = L.slice(k, k + 30); const got = await Promise.all(part.map((i) => C('y24_mkt').doc(i).get().catch(() => null)));
      got.forEach((d, n) => { const i = part[n]; const v = d && d.exists ? d.data() || {} : null; const x = v ? { none: !!v.none, page1: v.page1 || null, total: v.total ?? null, full: v.full ?? null, n: v.n ?? null, at: v.at || null, fkSum: v.fkSum || null, reqAt: (v.req && v.req.at) || null, err: !v.page1 && !v.none && v.err ? String(v.err).slice(0, 80) : null, _t: t } : { none: false, page1: null, reqAt: null, err: null, _t: t };
        M.mkt.set(i, x); if (y24eNd(x)) { if (!M.nd.has(i)) M.nd.set(i, t); } else M.nd.delete(i); }); } }
  /* 웹앱 y24MktGo — 시장 지표를 mktWaitH시간 기다렸거나 클라우드가 못 읽음 → 알라딘 값(F45 ②) */
  const mktGo = (i, cfg) => { const d = M.mkt.get(String(i)); if (d && !y24eNd(d)) return false; if (d && d.err) return true; const t0 = Math.min(M.nd.get(String(i)) || Infinity, (d && d.reqAt && Date.parse(d.reqAt)) || Infinity); return isFinite(t0) && now() - t0 >= (cfg && cfg.mktWaitH != null ? +cfg.mktWaitH : 6) * 3600e3; };
  const rowsOf = (E) => E.map((e) => ({ lid: e.lid, isbn: e.isbn, grade: e.grade, price: +e.price, qty: 1, self: (e.skus || []).join(','), title: String(e.title || '').slice(0, 60) })); /* 웹앱 y24AutoRowsOf */
  const xlsxOf = (m, rows) => { const X = m.XL; const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(m.B.y24RegAoa(rows)), 'Sheet1'); return X.write(wb, { type: 'base64', bookType: 'xlsx' }); }; /* 웹앱 y24AutoXlsx */
  const ref = () => C('app_settings').doc('y24_reg');
  /* 번외 결과 → 장부(웹앱 y24AutoApply와 같음 — 그 맡김 줄만 · 아직 'auto'인 줄만) */
  async function apply(led, resMap) { const at = iso(); const r = {}; let stop = null, last = null;
    for (const [jid, x] of Object.entries(resMap || {})) { last = { job: jid, state: x.state, msg: String(x.msg || '').slice(0, 200), at, n: (x.rows || []).length, ...(x.raw && typeof x.raw === 'object' ? { raw: JSON.parse(JSON.stringify(x.raw).slice(0, 3000).replace(/[\s\S]*/, (t) => { try { JSON.parse(t); return t; } catch (e) { return 'null'; } })) } : {}) }; /* (headless1) 번외가 멈춘 화면 원문(앞 300자·단추 이름 — 우리 상품 글뿐) */
      for (const lid of x.rows || []) { const e = (led.r || {})[lid]; if (!e || e.job !== jid || e.st !== 'auto') continue; const g = x.gno && x.gno[lid];
        if (g) r[lid] = { st: 'sent', ok: 1, gno: String(g), how: '🤖 번외 자동 확인(자체코드)', okAt: at, okBy: '🤖 번외 수집기', unsure: null, why: null, todo: null };
        else if (x.state === 'fail') r[lid] = { st: 'autofail', why: String(x.msg || '').slice(0, 200), todo: x.todo ? String(x.todo).slice(0, 200) : null, failAt: at };
        else r[lid] = { st: 'sent', unsure: 1, why: String(x.msg || '').slice(0, 200), todo: x.todo ? String(x.todo).slice(0, 200) : null }; }
      if (x.state !== 'done') stop = { why: String(x.msg || '').slice(0, 200), todo: x.todo ? String(x.todo).slice(0, 200) : null, at, job: jid, state: x.state }; }
    if (!last) return 0; await ref().set({ r, auto: { last, ...(stop ? { stop } : {}) } }, { merge: true }); for (const [k, v] of Object.entries(r)) led.r[k] = { ...led.r[k], ...v }; return Object.keys(r).length; }
  /* 다음 묶음 장부에 먼저(웹앱 y24AutoCommit과 같음 — 트랜잭션 안에서 장부를 다시 읽고 차례·되풀이를 다시 셈) */
  async function commit(m, cand, Cd, jid, by, pc, cfg) { let res = null;
    await db.runTransaction(async (tx) => { const cur = (await tx.get(ref())).data() || {}; if (cur.auto && cur.auto.stop) { res = { ok: [], stop: cur.auto.stop }; return; } const led = cur.r || {}; const at = iso();
      const P = m.B.y24AutoPlan(cand, led, Cd, at, cfg, kstDay(now())); const R = m.B.y24RegFilter(P.pick, led); res = { ...R, plan: P }; if (!R.ok.length) return; const r = {};
      R.ok.forEach((x) => { const before = Cd.pub.filter((q) => q.isbn === x.isbn).map((q) => q.no).concat(Cd.adm.filter((a) => a.ean === x.isbn).map((a) => a.no)); const prev = led[x.lid];
        r[x.lid] = { lid: x.lid, title: x.title.slice(0, 60), isbn: x.isbn, grade: x.grade, qty: 1, price: x.price, alPrice: x.alPrice, val: x.val ? { mode: x.val.mode, t: x.val.t } : null, skus: x.skus, at, day: kstDay(now()), by, batch: jid, job: jid, auto: 1, st: 'auto', before: [...new Set(before)].slice(0, 30), hist: prev ? [...(prev.hist || []), { st: prev.st, at: prev.at, by: prev.by, gno: prev.gno || null }].slice(-10) : [] }; });
      tx.set(ref(), { r, batches: FV.arrayUnion({ batch: jid, at, by, n: R.ok.length, auto: 1, lids: R.ok.map((x) => x.lid).slice(0, 60) }), auto: { lastJob: jid, lastAt: at, dev: 'cloud:' + pc } }, { merge: true }); });
    return res; }
  const byOf = (pc) => '🤖 자동 올림 · 클라우드(' + pc + ')';
  /* (headless1 판 뒤) 🔎 클라우드가 왜 맡기지 않는지 진단에서 보이게 — 웹앱 y24AutoStSave와 같은 칸(app_settings/y24_reg.autoSt) · 이름 CLOUD_<PC> · 바뀌었거나 10분 지났을 때만 · 값·손님 정보 없음 */
  const stSig = new Map();
  function stSave(pc, why, st, plan) { try { const k = ('CLOUD_' + String(pc).toUpperCase()).replace(/[^A-Z0-9_-]/g, '_').slice(0, 36); const w = String(why || '').slice(0, 200); const sig = w + '|' + (st && st.login) + '|' + (st && st.en); const o2 = stSig.get(k);
    if (o2 && o2.sig === sig && now() - o2.at < 10 * 60e3) return; stSig.set(k, { sig, at: now() });
    ref().set({ autoSt: { [k]: { why: w, login: (st && st.login) || null, en: st && st.en != null ? !!st.en : null, hold: !!(st && st.hold), plan: plan || null, ver: 'cloud', at: iso() } } }, { merge: true }).catch(() => {}); } catch (e) {} }
  /* ══ (r1116-y24 · 정밀 점검 11/14 ④·⑦ '위험 2 이중 판매') 🛑 알라딘에서 팔린 책 → 예스24 매물 판매중지 맡김
   *  왜: 자동 올림(기본 켬·상한 없음)으로 예스24에 올린 책이 알라딘에서 팔려도 예스24 매물을 내리는 길이 '통합 장부 자동 내림'(웹앱이 열린 PC · 켠 뒤 들어온 주문 · 이은 예스24 매물이 꼭 하나일 때)뿐이었음
   *      → 웹앱이 닫혀 있거나 짝을 못 지으면 예스24에 그대로 남아 같은 실물을 두 번 팔 수 있음
   *  어떻게: 자동 올림과 같은 길 — 같은 장부(app_settings/y24_reg r[상품].down) · 같은 실행 주체(맡은 PC 번외 · col2_y24_cmd → 수집기 wRelay → 번외 /y24/w/put 판매중지 · 웹앱 🛠 예스24 맡기기와 같은 문서 모양)
   *   ① 장부에 '올라감'(st sent · 예스24 상품 번호 앎)인 줄 중 알라딘에서 판매중이 아닌 것(또는 올린 뒤 알라딘 주문이 들어온 한 권짜리)
   *   ② 보내기 직전 그 상품 문서·판매중지 까닭을 새로 읽어 다시 확인 · 팔림 표시(판매완료·수량 0·'재고에서 뺌' 까닭·주문)가 없으면 holdMin분 이어 판매중 아님일 때만
   *   ③ 예스24가 이미 판매중 아님 · 예스24에서 팔림 → 맡기지 않고 '이미'로 적음
   *   ④ 겹침 막기: 통합 장부 자동 내림 기록(omni_auto.c · 예스24 · 3일)이나 끝나지 않은 예스24 쓰기 맡김(같은 상품 번호)이 있으면 건너뜀 · 맡김 줄 열쇠(rid)를 웹앱과 같은 꼴로 → 웹앱도 이 맡김을 보고 다시 맡기지 않음(y24PRid)
   *   ⑤ 되풀이 0: 장부 down.st(sent·done·already·human)이면 다시 안 함 · 하루 상한(downDay)·한 차례 상한 · 실패하면 gapMin분 뒤 새 열쇠로 · tries번 실패하면 사람(human)
   *   ⑥ 대량 막이: 후보가 trip을 넘고 올린 줄의 절반을 넘으면 멈춤 · 알라딘 판매중 목록이 비면 멈춤
   *  지킴: 맡은 PC(platforms.y24Holder · 기본 HOME)의 번외가 부를 때만 · 로거·MJ-MAIN은 앞에서 빠짐 · 예스24 로그인 전·출고 중엔 새 맡김을 미룸 · 지우지 않음 · 예스24에 직접 요청하지 않음(번외가 판매관리 화면에서) */
  const msOf = (v) => { if (!v) return 0; if (v.toMillis) return v.toMillis(); return Date.parse(String(v)) || 0; };
  const D_TERM = ['sent', 'done', 'already', 'human'];
  M.dLast = 0; M.dSeen = new Map(); M.dSkip = new Map(); M.dWhy = ''; const dSig = { sig: '', at: 0 };
  async function dSave(o) { const sig = JSON.stringify(o); if (sig === dSig.sig && now() - dSig.at < 10 * 60e3) return; dSig.sig = sig; dSig.at = now(); /* 웹앱 y24AutoLine이 보이는 상태 한 줄 · autoSt 아래라 웹앱 장부 다시 셈(regV)을 깨우지 않음 */
    try { await ref().set({ autoSt: { _ALSOLD: { ...o, ver: 'cloud', at: iso() } } }, { merge: true }); } catch (e) {} }
  const dSkipSet = (lid, min) => M.dSkip.set(lid, now() + min * 60e3);
  function gnoOf(e, D) { if (e.gno && /^\d{5,15}$/.test(String(e.gno))) return String(e.gno); const S0 = new Set(e.skus || []); if (!S0.size) return null; const L = [...D.adm.values()].filter((a) => String(a.self || '').split(/[,\s]+/).some((x) => S0.has(x))); return L.length === 1 ? L[0].no : null; } /* 장부에 번호가 없으면 관리자 목록 자체코드로 — 꼭 하나일 때만 */
  function y24Off(D, Y, no) { const A = D.adm.get(no) || null; const P = Y.get(no) || null; /* 예스24가 이미 판매중이 아님 — 관리자 목록(새것)·공개 목록 */
    if (A && A.st && !['02', '99'].includes(A.st) && (!P || P.goneAt || !P.lastSeenAt || String(A.at || '') >= String(P.lastSeenAt))) return `예스24 관리자 목록에서 이미 판매중 아님(${A.st})`;
    if (P && P.goneAt && !(A && ['02', '99'].includes(A.st) && String(A.at || '') > String(P.goneAt))) return '예스24 공개 목록에서 이미 사라짐'; return ''; }
  async function dDedupe() { const no = new Map(); /* 통합 장부 자동 내림·끝나지 않은 맡김 — 같은 예스24 상품 번호면 두 번 내리지 않음 */
    try { const o = await doc('app_settings', 'omni_auto'); const t0 = now() - 3 * 864e5; for (const v of Object.values((o && o.c) || {})) if (v && v.ch === 'yes24' && v.no && v.st !== 'fail' && msOf(v.at) > t0) no.set(String(v.no), `통합 장부 자동 내림이 이미 맡음(${v.st || ''})`); } catch (e) { return () => '통합 장부 자동 내림 기록을 못 읽음'; }
    try { const qs = await C(W_CMD).where('st', 'in', W_ACT).limit(100).get(); qs.forEach((d) => { const v = d.data() || {}; for (const r of ((v.job || {}).rows) || []) if (r && r.no && !no.has(String(r.no))) no.set(String(r.no), `끝나지 않은 예스24 쓰기 맡김이 있음(${v.st})`); }); } catch (e) { return () => '예스24 쓰기 맡김 줄을 못 읽음'; }
    return (g) => no.get(String(g)) || ''; }
  /* 맡김 줄 — 웹앱 ledY24Row와 같은 rid(줄 열쇠|번호) · rk는 시도마다 새로(번외가 끝낸 열쇠는 '되풀이 0'으로 막으므로) */
  function dRow(x, D, at, n) { const key = (x.e.skus || [])[0] || 'al:' + x.lid; let rid = key + '|' + x.gno; if (!ID_RE.test(rid) || rid.length > 130) rid = 'al:' + x.lid + '|' + x.gno; if (!ID_RE.test(rid) || rid.length > 130) return null;
    const rk = [rid, 'stop', '', at.replace(/\D/g, '').slice(0, 14) + '-' + n].join('|'); if (!ID_RE.test(rk)) return null; const title = String(x.e.title || '').slice(0, 60);
    const A = D.adm.get(x.gno) || {}; const sk = x.e.skus || []; const self = SELF_RE.test(String(A.self || '')) ? String(A.self) : sk.length === 1 && SELF_RE.test(String(sk[0])) ? String(sk[0]) : '';
    const isbn = /^\d{10,13}$/.test(String(x.e.isbn || '')) ? String(x.e.isbn) : ''; if (!self && !isbn && title.trim().length < 2) return null;
    return { rid, rk, no: x.gno, kind: 'stop', to: null, title, src: DOWN_SRC, ...(self ? { self } : { isbn, q: title }) }; }
  async function dSend(pc, plat, cfg, x, D, why, today) { const at = iso(); const jid = 'y24s' + at.replace(/\D/g, '').slice(2, 14) + Math.random().toString(36).slice(2, 5); const by = '☁ 클라우드 팔린 책 내림(' + pc + ')'; let res = 'cap';
    await db.runTransaction(async (tx) => { const cur = (await tx.get(ref())).data() || {}; const e = (cur.r || {})[x.lid]; if (!e || e.st !== 'sent') { res = 'gone'; return; } const d0 = e.down && (!e.down.gno || e.down.gno === x.gno) ? e.down : {}; /* 트랜잭션 안에서 다시 셈 — 다른 차례·다른 서버가 먼저 맡겼으면 그만 */
      if (D_TERM.includes(d0.st) || (d0.st === 'fail' && msOf(d0.nextAt) > now())) { res = 'dup'; return; }
      const dd = cur.downDay && cur.downDay.day === today ? +cur.downDay.n || 0 : 0; if (dd >= cfg.day) { res = 'cap'; return; }
      const n = (+d0.n || 0) + 1; const row = dRow(x, D, at, n); if (!row) { res = 'bad'; return; }
      tx.set(ref(), { r: { [x.lid]: { down: { st: 'sent', job: jid, at, n, gno: x.gno, rid: row.rid, rk: row.rk, why: String(why).slice(0, 200), by: 'cloud:' + pc, nextAt: null, endAt: null } } }, downDay: { day: today, n: dd + 1 } }, { merge: true });
      tx.set(C(W_CMD).doc(jid), { k: 'w', job: { id: jid, rows: [row] }, st: 'new', holder: holderOf(plat), by, at, src: DOWN_SRC, tries: 0, trail: [{ at, m: '☁ 알라딘에서 팔림 → 예스24 판매중지 맡김 — ' + String(why).slice(0, 120), by }] });
      res = 'ok'; x.jid = jid; });
    return res; }
  /* 맡긴 것 결과 보기 — 끝남(done·already) · 실패(gapMin분 뒤 다시 · tries번이면 사람) · 맡긴 일 줄(hold)이면 다시 셈 뒤 같은 문서를 다시 보냄(웹앱 ledY24HoldRetry와 같음 — 웹앱은 이 줄을 클라우드에 맡김) */
  async function dPoll(pc, plat, cfg, R, upd, cnt) { const by = '☁ 클라우드 팔린 책 내림(' + pc + ')';
    for (const [lid, e] of Object.entries(R).filter(([, e]) => e && e.down && e.down.st === 'sent' && e.down.job).slice(0, 20)) { const dn = e.down; let v = null; try { v = await doc(W_CMD, dn.job); } catch (x) { cnt.wait++; continue; }
      const fin = (st2, why) => { upd[lid] = { down: { ...dn, st: st2, why: String(why || '').slice(0, 200), endAt: iso() } }; };
      const failed = (why) => { const n = +dn.n || 1; if (n >= cfg.tries) { fin('human', `${n}번 못 내림 — 사람 확인(예스24 판매관리): ${String(why || '').slice(0, 140)}`); cnt.human++; } else { upd[lid] = { down: { ...dn, st: 'fail', why: String(why || '').slice(0, 200), failAt: iso(), nextAt: new Date(now() + cfg.gapMin * 60e3).toISOString() } }; cnt.fail++; } };
      if (!v) { failed('맡김 문서가 없음'); continue; }
      if (v.st === 'cancelled') { fin('cancel', '사람이 맡김을 취소함' + (v.cancelBy ? ' · ' + String(v.cancelBy).slice(0, 40) : '') + ' — 다시 맡기지 않음'); cnt.cancel++; continue; }
      if (v.st === 'done') { const res = v.res || {}; const x = (res.rows && res.rows[dn.rid]) || (v.drop || {})[dn.rid] || res; const s2 = String(x.state || x.st || res.state || ''); if (s2 === 'done') { fin('done', '예스24 판매중지 됨'); cnt.done++; } else if (s2 === 'already') { fin('already', x.msg || res.msg || '이미 판매중지'); cnt.done++; } else failed(x.msg || res.msg || s2 || '실패'); continue; }
      if (v.st === 'hold') { if (msOf(v.retryAt) > now()) { cnt.wait++; continue; }
        let l = null; try { l = await doc('prd_listings', lid); } catch (x) { cnt.wait++; continue; }
        if (aladinLive(l)) { try { await C(W_CMD).doc(dn.job).set({ st: 'done', doneAt: iso(), res: { state: 'already', msg: '☁ 다시 확인 — 알라딘에 다시 판매중이라 예스24를 내리지 않고 닫음' }, trail: FV.arrayUnion({ at: iso(), m: '다시 확인 — 알라딘 판매중 → 닫음', by }) }, { merge: true }); } catch (x) {} upd[lid] = { down: { ...dn, st: 'cancel', why: '알라딘에 다시 판매중 — 닫음', endAt: iso() } }; cnt.cancel++; continue; }
        const dref = C(W_CMD).doc(dn.job); let ok = false; try { await db.runTransaction(async (tx) => { const c = (await tx.get(dref)).data() || {}; if (c.st !== 'hold') return; const at = iso(); tx.set(dref, { st: 'new', at, holder: holderOf(plat), sentAt: at, sentBy: by, tries: (+c.tries || 0) + 1, trail: FV.arrayUnion({ at, m: '☁ 다시 셈(알라딘 아직 판매중 아님) 뒤 맡은 PC에 다시 보냄', by }) }, { merge: true }); ok = true; }); } catch (x) {}
        if (ok) cnt.resend++; else cnt.wait++; continue; }
      if (W_ACT.includes(v.st)) { cnt.wait++; continue; }
      failed('맡김이 ' + String(v.st || '?') + '(으)로 끝남'); } }
  /* 한 차례(맡은 PC 번외가 부를 때 · everyS초마다) → { why, sent, jobs } */
  async function downStep(pc, st, plat, ledGet) { const cfg = downCfg(plat); const P = String(pc).trim().toUpperCase(); const holder = holderOf(plat);
    if (P !== holder) return { why: `맡은 PC(${holder})가 아님 — 팔린 책 내림은 그 PC 차례에만` };
    if (!cfg.on) { await dSave({ why: '🛑 팔린 책 예스24 내림 꺼 둠(⚙ platforms.y24.down.on)', pc: P }); return { why: '꺼 둠' }; }
    if (now() - M.dLast < cfg.everyS * 1e3) return { why: M.dWhy || '다음 차례 기다림', skip: 1 }; M.dLast = now();
    const led = await ledGet(); const R = led.r || {}; const today = kstDay(now()); const upd = {}; const cnt = { sent: 0, wait: 0, fail: 0, human: 0, done: 0, cancel: 0, resend: 0, dup: 0, unk: 0, nogno: 0, hold: 0, already: 0 }; const jobs = [];
    const fin = async (why, more) => { if (Object.keys(upd).length) { try { await ref().set({ r: upd }, { merge: true }); } catch (e) {} } const dayN = led.downDay && led.downDay.day === today ? +led.downDay.n || 0 : 0; M.dWhy = why;
      await dSave({ why, pc: P, day: today, dayN: dayN + cnt.sent, dayMax: cfg.day, sent: cnt.sent, wait: cnt.wait + cnt.hold, fail: cnt.fail, human: Object.values(R).filter((e) => e && e.down && e.down.st === 'human').length + cnt.human, ...(more || {}) }); return { why, sent: cnt.sent, jobs, cnt }; };
    await dPoll(P, plat, cfg, R, upd, cnt);
    if (!Object.values(R).some((e) => e && e.st === 'sent')) return fin('예스24에 올린 책이 장부에 없음 — 내릴 것 0'); /* 읽기 줄이기 — 올린 책이 없으면 큰 자료(판매중 목록 등)를 읽지 않음 */
    const D = await data(); const liveIds = new Set(D.list.filter(aladinLive).map((l) => l.id)); const Y = new Map(D.y24.map((x) => [String(x.goodsNo), x]));
    if (!D.list.length) return fin('⛔ 알라딘 판매중 목록이 비어 있음 — 자료가 덜 온 듯해 예스24를 내리지 않음');
    const C0 = []; let nLed = 0, reset = 0;
    for (const [lid, e] of Object.entries(R)) { if (!e || e.st !== 'sent') continue; nLed++; const gno = gnoOf(e, D); const dn = e.down && (!e.down.gno || !gno || e.down.gno === gno) ? e.down : {}; const live = liveIds.has(lid);
      if (D_TERM.includes(dn.st) || dn.st === 'cancel') { if (dn.st !== 'sent' && live && reset < 5 && now() - msOf(dn.endAt || dn.at) > 3600e3) { upd[lid] = { down: { st: 'live', prev: dn.st, gno: dn.gno || null, n: 0, at: iso(), why: '알라딘에 다시 판매중 — 다시 팔리면 또 내림' } }; reset++; } continue; } /* 다시 올라간 책은 다음에 팔리면 다시 내릴 수 있게 */
      if (dn.st === 'fail' && msOf(dn.nextAt) > now()) continue;
      const h = D.heldAt.get(lid); const heldNew = !!(h && h.t > String(e.at || ''));
      if (live && !heldNew) { M.dSeen.delete(lid); continue; }
      if (!gno) { cnt.nogno++; continue; }
      if ((M.dSkip.get(lid) || 0) > now()) continue;
      if (!M.dSeen.has(lid)) M.dSeen.set(lid, now()); C0.push({ lid, e, gno, live, heldNew, h }); }
    if (C0.length > cfg.trip && C0.length > nLed / 2) return fin(`⛔ 한꺼번에 너무 많음 — 내릴 후보 ${C0.length}건(올린 ${nLed}건 중) · 자료가 덜 왔을 수 있어 멈춤 · 사람 확인(⚙ platforms.y24.down.trip)`, { cand: C0.length });
    const canNew = st.login === 'ok' && !st.hold && st.en !== false; let capHit = false, reads = 0; let dd = null;
    C0.sort((a, b) => (b.heldNew - a.heldNew) || (M.dSeen.get(a.lid) - M.dSeen.get(b.lid)));
    for (const x of C0) { if (cnt.sent >= cfg.run || reads >= cfg.run * 4) break;
      const off = y24Off(D, Y, x.gno); if (off) { upd[x.lid] = { down: { st: 'already', gno: x.gno, at: iso(), endAt: iso(), why: off } }; cnt.already++; continue; }
      if (x.h && x.h.ch === 'yes24') { upd[x.lid] = { down: { st: 'already', gno: x.gno, at: iso(), endAt: iso(), why: '예스24 주문으로 팔림 — 예스24 쪽은 이미 팔림' } }; cnt.already++; continue; }
      reads++; const l = await doc('prd_listings', x.lid); if (!l) { dSkipSet(x.lid, 60); cnt.unk++; continue; }
      let sold = ''; const ht = x.h ? x.h.t : '';
      if (!aladinLive(l)) sold = l.status === '판매완료' || l.qty === 0 ? '알라딘 ' + (l.status === '판매완료' ? '판매완료' : '수량 0') : x.heldNew ? '알라딘 판매중 아님 · 올린 뒤 주문 들어옴' : '';
      else if (x.heldNew && (l.qty == null || +l.qty <= 1) && ht > String(l.lastSeenAt || '')) sold = '올린 뒤 알라딘 주문 들어옴(목록은 아직 판매중)';
      else { dSkipSet(x.lid, 10); M.dSeen.delete(x.lid); continue; } /* 새로 읽으니 판매중 — 자료가 늦었음 */
      const sr = await doc('prd_stop_reasons', x.lid);
      if (sr && sr.reason === 'elsewhere' && /예스24/.test(String(sr.note || ''))) { upd[x.lid] = { down: { st: 'already', gno: x.gno, at: iso(), endAt: iso(), why: '예스24에서 팔림(판매중지 까닭)' } }; cnt.already++; continue; }
      if (!sold && sr && SOLD_R.includes(sr.reason)) sold = '알라딘 판매중지 · 까닭 ' + sr.reason;
      if (!sold) { if (now() - (M.dSeen.get(x.lid) || now()) < cfg.holdMin * 60e3) { cnt.hold++; continue; } sold = `알라딘 ${l.status || '판매중 아님'} ${cfg.holdMin}분 넘게`; }
      if (!canNew) { cnt.hold++; continue; }
      if (!dd) dd = await dDedupe(); const dw = dd(x.gno); if (dw) { dSkipSet(x.lid, 30); cnt.dup++; continue; }
      const r = await dSend(P, plat, cfg, x, D, sold, today); if (r === 'cap') { capHit = true; break; } if (r === 'ok') { cnt.sent++; jobs.push(x.jid); log('🛑 예스24 팔린 책 내림', P, x.jid, x.gno); } else if (r === 'bad') { dSkipSet(x.lid, 60); cnt.unk++; } }
    const tail = [cnt.wait + cnt.resend ? `결과 기다림 ${cnt.wait + cnt.resend}` : '', cnt.hold ? `미룸 ${cnt.hold}` : '', cnt.fail ? `실패 뒤 다시 기다림 ${cnt.fail}` : '', cnt.human ? `사람 확인 ${cnt.human}` : '', cnt.dup ? `다른 길이 맡음 ${cnt.dup}` : '', cnt.nogno ? `예스24 번호 모름 ${cnt.nogno}` : ''].filter(Boolean).join(' · ');
    const head = capHit ? `⏸ 오늘 판매중지 상한 ${cfg.day}건을 다 씀 — 내일 이어감` : cnt.sent ? `🛑 ${cnt.sent}건 예스24 판매중지 맡김(알라딘에서 팔림)` : !canNew && cnt.hold ? (st.login !== 'ok' ? '🔐 예스24 로그인 기다림 — 판매중지 맡김을 미룸' : st.hold ? '🚚 출고 중 — 끝나면 판매중지 맡김' : '이 PC 번외 예스24 읽기가 꺼져 있음 — 판매중지 맡김을 미룸') : C0.length ? `팔린 책 ${C0.length}건 확인 중` : '팔린 책 없음 — 예스24에서 내릴 것 0';
    return fin(head + (tail ? ' · ' + tail : ''), { cand: C0.length }); }
  /* 한 차례 — pc = 서명이 확인된 그 PC · y = 번외가 보낸 { st, res, rej } → { ack, jobs, why } */
  async function step(pc, y) { const out = { v: 1, at: now(), ack: [], jobs: [], why: '' }; const st = (y && y.st) || {}; const say = (w) => { out.why = w; M.why.set(pc, w); stSave(pc, w, st, out.plan); return out; };
    if (/^LOGGER/i.test(pc) || st.ban) return say(st.ban || '로거 PC — 예스24 자동 올림 안 함(약속 0)'); if (/^MJ-MAIN/i.test(pc)) return say('MJ-MAIN(등록·출고 PC) — 예스24 자동 올림 안 함(출고 보호)');
    const plat = (await doc('app_settings', 'platforms')) || {}; let led0 = null; const ledGet = async () => { if (!led0) { led0 = (await doc('app_settings', 'y24_reg')) || {}; led0.r = led0.r || {}; } return led0; };
    if (!(plat.y24 || {}).off) { try { out.down = await downStep(pc, st, plat, ledGet); } catch (e) { out.down = { why: '오류: ' + String((e && e.message) || e).slice(0, 120) }; } } /* (r1116-y24) 🛑 팔린 책 내림 — 자동 올림을 꺼도·멈춰도 돎(공용 셈 덩어리가 필요 없음) */
    const m = await mods(); if (!M.mods) return say('클라우드가 공용 셈을 못 받음 — ' + (m.err || []).join(' · ').slice(0, 160));
    const cfg = m.B.y24RegCfg((plat.y24 || {}).reg); if ((plat.y24 || {}).off) return say('🟦 예스24 꺼 둠(⚙)'); if (!cfg.auto) return say('🤖 자동 올림 꺼 둠(⚙)');
    const led = await ledGet();
    const res = (y && y.res) || {}; const rej = Array.isArray(y && y.rej) ? y.rej.slice(0, 10) : []; const rm = { ...res };
    for (const x of rej) if (x && x.id && !/되풀이/.test(String(x.err || ''))) rm[x.id] = { state: 'fail', pre: 1, rows: (x.rows || []).map(String), msg: '번외가 맡김을 거절 — ' + String(x.err || '').slice(0, 160), todo: '📤 장부에서 이 줄을 보고 「↩ 다시 올릴 수 있게」 뒤 「▶ 이어 가기」 또는 엑셀 길(손)로' };
    if (Object.keys(rm).length) { await apply(led, rm); out.ack = Object.keys(res); out.rejAck = rej.map((x) => x.id); }
    if (led.auto && led.auto.stop && !Object.keys(rm).length) return say('⛔ 멈춤 — ' + led.auto.stop.why);
    if (st.en === false) return say('이 PC 번외 예스24 읽기가 꺼져 있음');
    const fly = Object.values(led.r).filter((e) => e && e.auto && e.st === 'auto'); const known = new Set([...(st.wait || []).map((w) => w.id), st.cur && st.cur.id].filter(Boolean)); const me = byOf(pc);
    const lost = [...new Set(fly.filter((e) => { const age = now() - Date.parse(e.at || 0); return String(e.by || '') === me ? age > 3 * 60e3 : age > 30 * 60e3; }).map((e) => e.job))].filter((j) => j && !known.has(j)); /* 웹앱과 같음: 장부엔 적었는데 번외가 모르는 묶음 — 내 것은 3분 · 남의 것은 30분 뒤 다시 맡김(번외가 같은 상품·SKU를 두 번 받지 않음) */
    for (const jid of lost.slice(0, 2)) { const rows = rowsOf(fly.filter((e) => e.job === jid)); out.jobs.push({ id: jid, rows, xlsx: xlsxOf(m, rows), by: 'cloud:' + pc, again: 1 }); }
    if (fly.length) return say(`🤖 예스24에 올리는 중 ${fly.length}건${st.cur ? ' — ' + (st.cur.step || '') : st.why ? ' — ' + st.why : ''}`);
    if (led.auto && led.auto.stop) return say('⛔ 멈춤 — ' + led.auto.stop.why);
    if (st.login !== 'ok') return say('🔐 이 PC 번외 예스24 로그인 기다림'); if (st.hold) return say('🚚 출고 중 — 끝나면 이어감');
    const last = M.last.get(pc) || 0; if (now() - last < (y && y.fast ? 15e3 : 60e3)) return say(M.why.get(pc) || '다음 차례 기다림'); M.last.set(pc, now());
    const D = await data(); const W = wantLids(D, led); const X0 = regX(D, led, cfg, null);
    const L0 = D.list.filter(aladinLive).map((l) => ({ l, L: { id: l.id, title: l.title, isbn: y24Isbn(l.isbn13), grade: y24G(l.grade), price: +l.price || 0, qty: l.qty == null ? 1 : +l.qty, live: aladinLive(l), skus: isDupes(l) ? [] : skuSelf(m.R, D, l), dupes: isDupes(l), adult: !!l.adult, held: D.held.get(l.id) || null, unpub: null } })); /* 웹앱 y24RegL */
    const ok0 = L0.filter((x) => m.B.y24RegJudge(x.L, X0).ok); const nLed = Object.values(led.r).filter((e) => e && e.st !== 'retry').length; /* 「↩ 다시 올릴 수 있게」로 푼 줄은 세지 않음(웹앱과 같음) — 첫 시도가 실패해 풀면 첫 1건 고르기가 다시 열림 */
    const pickI = ok0.filter((x) => W.has(x.l.id) || cfg.autoAll).concat(!nLed && cfg.firstAny ? ok0.slice().sort((a, b) => a.L.price - b.L.price).slice(0, 60) : []).map((x) => x.L.isbn); /* 시장 지표를 받을 책 — 「🟦 예스24도」·판매중 전부(켰으면) · 처음 한 건은 값 싼 것부터 60권 */
    await mktLoad(pickI); const has = (i) => M.mkt.has(String(i)); const X = { ...X0, val: (L) => engVal(m, D, { ...(D.list.find((q) => q.id === L.id) || {}), price: L.price, grade: L.grade, isbn13: L.isbn }, M.mkt.get(String(L.isbn))) };
    const rows = L0.map((x) => { const j = has(x.L.isbn) ? m.B.y24RegJudge(x.L, X) : m.B.y24RegJudge(x.L, X0); return { k: j.ok ? 'ok' : 'no', why: j.why || '', row: j.row || null, lid: x.l.id, want: W.get(x.l.id) || null }; });
    const cand = m.B.y24AutoCand(rows, cfg, nLed, (i) => mktGo(i, cfg), has); const Cd = regC(D);
    const P = m.B.y24AutoPlan(cand, led.r, Cd, iso(), cfg, kstDay(now())); out.plan = { mode: P.mode, max: P.max, nOk: P.nOk, human: P.human.length, cand: cand.length };
    for (const h of P.human.filter((x) => x.mkt).slice(0, 10)) { const i = String(h.row.isbn); const d = M.mkt.get(i); if ((d && d.reqAt && now() - Date.parse(d.reqAt) < 6 * 3600e3) || now() - (M.reqd.get(i) || 0) < 6 * 3600e3) continue; M.reqd.set(i, now());
      try { const at = iso(); await C('y24_mkt').doc(i).set({ isbn: i, req: { at, by: 'cloud y24auto', dev: pc, auto: true } }, { merge: true }); if (d) d.reqAt = at; } catch (e) {} } /* 웹앱 y24mReq(auto) — 클라우드 시장 읽기에 맡김 */
    if (!P.pick.length) return say(P.t);
    const jid = 'y24a' + iso().replace(/\D/g, '').slice(2, 14) + Math.random().toString(36).slice(2, 5); const r = await commit(m, cand, Cd, jid, me, pc, cfg);
    if (!r || !r.ok.length) return say(r && r.stop ? '⛔ 멈춤 — ' + r.stop.why : (r && r.plan && r.plan.t) || P.t);
    const rows2 = rowsOf(r.ok); out.jobs.push({ id: jid, rows: rows2, xlsx: xlsxOf(m, rows2), by: 'cloud:' + pc }); log('🤖 예스24 자동 올림', pc, jid, rows2.length + '건 맡김');
    return say(`🤖 ${rows2.length}건 번외에 맡김 — 예스24 대량 등록 중`); }
  return { step, mods, data, _M: M, wantLids, regX, regC, engVal, mktGo, downStep };
}
module.exports = { makeY24Auto, blockOf, cutBlock, y24Isbn, y24AdmRow, aladinLive, BLOCK_NAMES, downCfg, holderOf, DOWN_DEF, DOWN_SRC };
