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
const BLOCK_NAMES = ['Y24R_DEF', 'y24RegCfg', 'y24RegPrice', 'y24RegState', 'y24RegJudge', 'y24RegAoa', 'y24RegFilter', 'y24AutoHuman', 'y24AutoPlan', 'y24AutoCand', 'y24RegDead', 'y24RegNLed', 'y24RegEan'];
/* (r1116-y24reg) 바코드 한 번 심기 — ISBN이 없는 상품(알라딘 isbn13 없음)의 EAN-13 바코드를 장부 app_settings/y24_reg.bc[상품]에 없을 때 한 번만 넣음(bcSeed에 적어 사람이 지운 뒤 다시 넣지 않음 · 지우지 않음)
 *  aladin_U495184596 = 블루레이(「🟦 예스24도」 켬 · 11/15) · 근거: 예스24 공개 상품 150109556의 바코드 8809866320756(검사 숫자 6 맞음 · resume y24reg 11/16) */
const BC_SEED = { aladin_U495184596: { bc: '8809866320756', why: '블루레이 — 알라딘 ISBN 없음 · 예스24 공개 상품 150109556 바코드' } };
const xlsxPkg = () => { try { return require('xlsx'); } catch (e) { return null; } }; /* SheetJS 0.18.5(cloud/package.json 의존 · 웹앱 needXLSX·수집기 @require와 같은 판) — 예전엔 실행 때 cdnjs에서 받아 new Function으로 돌렸음 */
const WEB_URL = 'https://readnow.kr/app/readnow-webapp.js'; /* 저장소에서 못 받을 때(비공개 뒤) — 같은 덩어리가 든 지금 웹앱 본문 */
const MKT_MAX = 120; /* 한 번에 시장 지표를 받는 책 수(웹앱 Y24E_MAX 400보다 작게 — 1분마다 불리므로) · 근거: 없음 */
/* (headless2 11/17 · RESUME_1116 8번 「10분마다 통째 읽기 → 바뀐 것만 읽기」) 큰 자료(판매중 상품·예스24 목록·주문 14일·등록 45일·SKU 짝·관리자 원문)는
 *  ① 처음과 FULL_MS(기본 6시간 · ⚙ platforms.y24.read.fullH 1~24)마다만 통째로 읽고 ② 그 사이 DATA_MS(10분)마다 '지난번 뒤 바뀐 줄'만 읽어 기억에 덧댐(uploadedAt · 상품은 markAt도 > 지난번 − LAP)
 *  예전: 큰 자료 45분마다 통째(하루 32번 × ≈1.6만) + 주문 14일 10분마다 통째(하루 144번) → 하루 ≈60만 읽기 · 이제: 통째 하루 4번 + 바뀐 줄(10분마다 몇~수십) — 숫자는 autoSt._RD(그날 읽기 셈)
 *  놓치지 않게: 판매중에서 빠짐·되돌림(다시 판매중)·값 바뀜·새 상품은 바뀐 줄(쓰는 쪽이 모두 W()/MW()로 uploadedAt·markAt을 새로 적음 — 웹앱·수집기의 바뀐 줄 동기화와 같은 약속)로 잡고
 *   ① 문서를 아예 지움·Firebase 콘솔에서 사람이 손으로 바꿈(uploadedAt 그대로)은 통째 다시 읽기(FULL_MS)가 잡음 ② 그 사이엔 보내기 직전 한 권씩 새로 읽기(step 재확인 · downStep)가 그대로 막음
 *   ③ 바뀐 줄이 DELTA_CAP을 넘거나(수집기 몰아 쓰기) 바뀐 줄 읽기가 실패하면 그 자리에서 통째로 다시 읽음 · 근거: 없음(정범님 결정 전 첫 값) */
const FULL_MS = 6 * 3600e3, DATA_MS = 10 * 60e3, LAP = 5 * 60e3, DELTA_CAP = 3000, ADM_SLOW = 45 * 60e3, FAIL_MS = 45 * 60e3; /* ADM_SLOW = 관리자 원문 '맨 위 한 줄 보기'가 안 되는(색인 없음) 때 예전처럼 45분마다 */
/* (bunoe1 11/17 · 정범님 19.10 · A95 리드 결정) 올릴 후보가 0건인 동안엔 통째 읽기를 24시간마다(FULL_IDLE_MS) — 6시간마다 통째(하루 약 7.2만 읽기)가 후보 없을 때도 돌던 것
 *  후보 수 = step이 마지막으로 센 y24AutoCand 수(PC마다 · 24시간 안에 본 값만) · 본 값이 없거나 한 PC라도 후보가 있으면 예전처럼 6시간 · ⚙ platforms.y24.read.fullH가 있으면 늘 그 값
 *  그대로 둠: 팔린 책 판매중지 작은 켜(FRESH_MS 5분)·바뀐 줄 읽기(DATA_MS 10분) · 되돌림 = app_settings/platforms.y24.read.fullH = 6 */
const FULL_IDLE_MS = 24 * 3600e3;
const RD_COLS = ['app_settings', 'prd_listings', 'y24_listings', 'crm_orders', 'reg_items', 'crm_y24_raw']; /* 읽기 셈 칸(늘 같은 칸 — 장부 merge가 옛 칸을 남기지 않게) */
/* (r1116-y24 · 합동 검토 「고친 뒤 내기」) 🛑 팔린 책 내림이 쓰는 알라딘 판매 상태만 작은 켜로 — 큰 켜(BIG_MS 45분)를 그대로 쓰면 주문 신호 없이 알라딘에서만 팔린 책의 예스24 판매중지가 최대 45분 늦었음(이중 판매 창)
 *  FRESH_MS마다 '지난번 뒤 바뀐 상품 줄'만 읽음(prd_listings.uploadedAt > 지난번 − FRESH_LAP · 클라우드 SKU·조회수 실험과 같은 길 · 칸은 L_FIELDS로 좁힘) → 큰 켜의 그 줄을 새 값으로 바꿈
 *  바뀐 줄이 FRESH_LIM 이상(수집기 몰아 쓰기)이거나 읽기가 실패하면 → 예스24에 올린(장부 sent) 책 중 판매중으로 보이는 것만 한 권씩 새로 읽음
 *  판단은 그대로 엄격: 여기서는 '후보가 됨'까지만 · 맡기기 전 한 권 새로 읽기(판매완료·수량 0·재고에서 뺀 까닭 · 그 밖엔 holdMin분)가 그대로 막음 · 근거: 없음 — 판매중지 지연 ≤ FRESH_MS + everyS(2분) ≈ 7분 */
const FRESH_MS = 5 * 60e3, FRESH_LAP = 5 * 60e3, FRESH_LIM = 1500; /* 한 차례 바뀐 줄 상한(올린 책 수에 맞춰 더 작게 — freshLoad lim) */
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
  const M = { mods: null, modsAt: 0, data: null, dataAt: 0, big: null, bigAt: 0, mkt: new Map(), nd: new Map(), reqd: new Map(), last: new Map(), why: new Map(), cand: new Map() }; /* cand = PC → { n: 마지막으로 센 올릴 후보 수, at } (bunoe1 — 통째 읽기 간격) */
  /* 공용 셈 받기(30분마다 새로) — ◆y24reg 덩어리 · ext-core · registry · shipping · SheetJS */
  async function mods() { if (M.mods && now() - M.modsAt < 30 * 60e3) return M.mods; const m = { ...(M.mods || {}) }; const err = [];
    try { m.B = blockOf(await getText('src/app.html')); } catch (e) { m.B = null; } if (!m.B) { try { m.B = blockOf(await getUrl(WEB_URL)); } catch (e) { err.push('웹앱 셈 덩어리: ' + e.message); } }
    try { m.X = o.extMod ? await o.extMod() : evalMod(await getText('readnow-ext-core.js'), 'ReadnowExt'); } catch (e) { err.push('ext-core: ' + e.message); }
    try { m.R = evalMod(await getText('readnow-registry.js'), 'ReadnowRegistry'); } catch (e) { err.push('registry: ' + e.message); }
    try { m.SH = evalMod(await getText('readnow-shipping-core.js'), 'ReadnowShipping'); } catch (e) { err.push('shipping: ' + e.message); }
    if (!m.XL) { m.XL = o.xlsx || xlsxPkg(); if (!m.XL) err.push('SheetJS: xlsx 모듈이 없음(cloud/package.json 의존 설치 필요)'); }
    m.err = err; if (m.B && m.X && m.X.y24PriceOf && m.R && m.R.skuFull && m.XL) { M.mods = m; M.modsAt = now(); } else M.mods = null; return m; }
  const doc = async (c, id) => { const d = await C(c).doc(id).get(); return d.exists ? d.data() || {} : null; };
  /* (plock2 11/18) 🔒 상품 잠금(prd_locks/{상품 키} = { on, lid, … }) — 잠긴 상품은 예스24에 새로 올리지 않음 · 못 읽으면 잠긴 것으로(안전 쪽)
   *  plkSetY: 잠긴 것 모두 한 번(on == true · 잠긴 것만이라 몇 건) → { k: 상품 키 Set, lid: 알라딘 상품 번호 Set } · 못 읽으면 null
   *  plkHitY: 후보 한 줄(r.lid = 상품 키)이 잠겼나 — 키로, 또는 그 상품의 알라딘 상품 번호로
   *  plkOneY: 올리기 직전 한 권 다시 읽기 → true 잠김 · false 안 잠김 · undefined 못 읽음 */
  const plkSetY = async () => { try { const q = await C('prd_locks').where('on', '==', true).get(); rdAdd('doc', 'prd_locks', (q.docs || []).length); const k = new Set(), lid = new Set(); for (const d of q.docs || []) { const v = d.data() || {}; if (v.on !== true) continue; k.add(String(d.id)); if (v.lid != null && v.lid !== '') lid.add(String(v.lid)); } return { k, lid }; } catch (e) { return null; } };
  const plkHitY = (S, key, D) => { if (!S) return true; if (S.k.has(String(key))) return true; const l = D && D.idx && D.idx.get(key); return !!(l && l.listingId != null && S.lid.has(String(l.listingId))); };
  const plkOneY = async (key, lid) => { try { rdAdd('doc', 'prd_locks', 1); const d = await C('prd_locks').doc(String(key)).get(); if (d.exists && (d.data() || {}).on === true) return true; if (lid == null || lid === '') return false; const q = await C('prd_locks').where('lid', '==', String(lid)).get(); return (q.docs || []).some((x) => (x.data() || {}).on === true); } catch (e) { return undefined; } };
  /* 자료 모으기(10분마다) — 웹앱이 실시간으로 듣던 칸을 읽기만 */
  /* (r1116-y24 · 정밀 점검 11/14 위험 3 읽기 폭증) 자료 모으기를 두 켜로 —
   *  ① 작은 것(설정 문서 4 · 주문 14일)은 10분마다 — 팔림(주문)·설정은 빨리 봐야 함
   *  ② 큰 것(판매중 상품 ≈1.6만 · 예스24 목록 · 관리자 화면 원문 · 등록 45일 · SKU 짝)은 BIG_MS(45분)마다 — 예전엔 10분마다 전부 읽어 하루 ≈230만 읽기 → 이제 하루 ≈50만(≈4.5배 적게)
   *  묵히는 사이 알라딘에서 팔린 책이 자동 올림에 들어가지 않게: 보내기 직전 올릴 책을 한 권씩 새로 읽어 다시 확인(step의 recheck) · 판 안의 칸 값도 그때 새 것으로 바꿈
   *  읽는 칸을 select()로 좁힘(전송 바이트 줄임 — 읽기 수는 문서 수 그대로)
   *  → (headless2 11/17) 큰 것도 이제 통째는 FULL_MS(6시간)마다만 · 그 사이 10분마다 바뀐 줄만(주문 14일도 같이 — 기억에 두고 덧댐) · 맨 위 FULL_MS 설명 */
  const L_FIELDS = ['_activeAladin', 'active', 'adult', 'grade', 'isbn13', 'lastSeenAt', 'listingId', 'price', 'priceList', 'qty', 'sku', 'status', 'title']; /* 이 파일이 판매중 상품에서 쓰는 칸 전부 */
  const Y_FIELDS = ['goodsNo', 'isbn13', 'grade', 'firstSeenAt', 'goneAt', 'lastSeenAt', 'masterNo', 'price']; /* (y24reg5) masterNo·price — 올라감 확인(vfStep)이 우리 가게 새 매물을 값·등급·허브 번호로 맞춤 */ /* 예스24 공개 목록에서 쓰는 칸 */
  const O_FIELDS = ['kind', 'items', 'orderedAt', 'platform', 'orderNo']; /* 주문에서 쓰는 칸 */
  const R_FIELDS = ['bump', 'mock', 'test', 'y24Reg', 'result', 'stage', 'createdAt']; /* 등록 기록에서 쓰는 칸 */
  const sel = (q, f) => (q && typeof q.select === 'function' ? q.select(...f) : q);
  const RAW_SIG = 'POST /api/Product/ProductList'; const RAW_N = 120; /* 웹앱 y24AdmLoad는 60문서 — 그 두 배(쪽 나뉨 여유) */
  /* ── (headless2 11/17) 읽기 셈 — 그날(KST) 통째(full)·바뀐 줄(delta)·한 권씩(doc) 읽기 수 · 시간마다 장부 autoSt._RD에(웹앱 regV를 깨우지 않는 칸 · 값·손님 정보 없음) ── */
  M.rd = null; M.rdPrev = null; M.rdSaveAt = 0;
  const rdNew = () => { const z = () => Object.fromEntries(RD_COLS.map((c) => [c, 0])); return { day: kstDay(now()), full: z(), delta: z(), fresh: z(), doc: z(), runs: { full: 0, delta: 0 }, why: {}, since: iso() }; }; /* fresh = 팔린 책 내림 작은 켜(freshLoad) · doc = 보내기 직전 한 권씩 */
  const rdCur = () => { const d = kstDay(now()); if (!M.rd || M.rd.day !== d) { M.rdPrev = M.rd; M.rd = rdNew(); } return M.rd; };
  const rdAdd = (kind, c, n) => { const o = rdCur()[kind]; o[c] = (o[c] || 0) + Math.max(1, +n || 0); }; /* 문서 하나 = 1 · 빈 조회도 1(Firestore 셈과 같음) */
  const rdRun = (kind, why) => { const r = rdCur(); r.runs[kind]++; if (why) r.why[why] = (r.why[why] || 0) + 1; };
  const rdSum = (r) => { if (!r) return null; const t = (k) => RD_COLS.reduce((a, c) => a + (r[k][c] || 0), 0); return { day: r.day, full: t('full'), delta: t('delta'), fresh: t('fresh'), doc: t('doc'), all: t('full') + t('delta') + t('fresh') + t('doc'), runs: r.runs }; };
  async function rdSave() { if (!M.rd || now() - M.rdSaveAt < 3600e3) return; M.rdSaveAt = now(); const B = M.big || {};
    try { await C('app_settings').doc('y24_reg').set({ autoSt: { _RD: { ...M.rd, sum: rdSum(M.rd), prev: rdSum(M.rdPrev), fullH: Math.round((B.fullMs || FULL_MS) / 36e5), admVia: B.admVia || null, dErr: B.dErr || null, last: B.last || null, ver: 'cloud', at: iso() } } }, { merge: true }); } catch (e) {} }
  /* ── (headless2 11/17) 바뀐 것 목록 — 다른 코드(예: 통합 장부 엔진 감시 omniauto1)가 '지난번 뒤 바뀐 상품·주문'을 다시 읽지 않고 쓰게
   *  줄 = { s: 차례 번호, at, c: 칸(prd_listings·crm_orders·y24_listings·reg_items), id, k } · k: in(새로 판매중·되돌림)·up(판매중 그대로 값 바뀜)·out(판매중에서 빠짐)·set·del · 통째 다시 읽기는 { c: '*', k: 'full' }
   *  changes(after) → { seq, rows(after 뒤), gap(그사이 넘쳐 잃음 → 통째 자료로 다시 맞출 것), cur(칸마다 커서 ms), fullAt } · 최근 CHG_MAX줄만 기억 ── */
  const CHG_MAX = 3000; M.seq = 0; M.chg = [];
  const chg = (c, id, k) => { M.chg.push({ s: ++M.seq, at: now(), c, id, k }); if (M.chg.length > CHG_MAX) M.chg.splice(0, M.chg.length - CHG_MAX); };
  function changes(after) { const a = +after || 0; const first = M.chg.length ? M.chg[0].s : M.seq + 1; const B = M.big || {}; return { seq: M.seq, rows: M.chg.filter((x) => x.s > a), gap: a < first - 1, cur: { ...(B.cur || {}) }, fullAt: B.fullAt || 0 }; }
  const tsOf = (ms) => new Date(ms); /* Firestore 시각(서버 시각 칸)과 견줌 */
  const lSig = (v) => JSON.stringify(L_FIELDS.map((k) => (v && v[k] !== undefined ? v[k] : null)));
  const lPick = (v) => { const o = {}; for (const k of L_FIELDS) if (v && v[k] !== undefined) o[k] = v[k]; return o; };
  /* 상품 한 줄 덧댐 — 판매중이면 넣거나 바꾸고 아니면 뺌 · fresh(팔린 책 내림의 작은 켜)도 새 값으로(묵은 fresh가 새 값을 덮지 않게 — 되돌림) */
  function plPut(B, id, raw) { if (/^_perm/.test(id)) return 0; const v = { ...lPick(raw), id }; const old = B.idx.get(id); B.fresh.set(id, lPick(raw));
    if (v.status === '판매중') { if (old && lSig(old) === lSig(v)) return 0; if (old) { for (const k of L_FIELDS) { if (v[k] === undefined) delete old[k]; else old[k] = v[k]; } } else B.idx.set(id, v); chg('prd_listings', id, old ? 'up' : 'in'); return 1; } /* 같은 개체를 고침(재확인이 쥔 개체와 같게) */
    if (!old) return 0; B.idx.delete(id); chg('prd_listings', id, 'out'); return 1; }
  const plList = (B) => { B.list = [...B.idx.values()]; B.byLid = new Map(); for (const l of B.list) if (l.listingId != null) B.byLid.set(String(l.listingId), l.id); };
  const y24Put = (B, id, v) => { const x = {}; for (const k of Y_FIELDS) if (v[k] !== undefined) x[k] = v[k]; x.goodsNo = v.goodsNo || id; const o = B.y24M.get(id); if (o && JSON.stringify(o) === JSON.stringify(x)) return 0; B.y24M.set(id, x); chg('y24_listings', id, 'set'); return 1; };
  const ordCut = () => new Date(now() - 14 * 864e5).toISOString(), regCut = () => new Date(now() - 45 * 864e5).toISOString();
  const ordPut = (B, id, v) => { const x = {}; for (const k of O_FIELDS) if (v[k] !== undefined) x[k] = v[k]; if (String(x.orderedAt || '') >= ordCut()) { B.ord.set(id, x); chg('crm_orders', id, 'set'); return 1; } if (B.ord.delete(id)) { chg('crm_orders', id, 'del'); return 1; } return 0; };
  const regPut = (B, id, v) => { const x = { id }; for (const k of R_FIELDS) if (v[k] !== undefined) x[k] = v[k]; if (!x.bump && String(x.createdAt || '') >= regCut()) { B.reg.set(id, x); chg('reg_items', id, 'set'); return 1; } if (B.reg.delete(id)) { chg('reg_items', id, 'del'); return 1; } return 0; };
  const skuSig = (s) => [+((s && s.n) || 0), +((s && s.mapN) || 0), String((s && s.at) || ''), ((s && s.free) || []).length].join('|'); /* 새 코드를 받을 때(skuTake) 바뀌는 칸만 — lease는 빼고 */
  async function skuLoad(B, seq) { B.sku = new Map(); const n = +((seq && seq.mapN) || 0); for (let i = 0; i <= n; i++) { const d = await doc('app_settings', 'sku_map_' + i); rdAdd(B.kind, 'app_settings', 1); for (const [k, v] of Object.entries((d && d.m) || {})) B.sku.set(k, v); } B.skuSig = skuSig(seq); } /* 웹앱 skuWatch */
  async function admLoad(B) { B.adm = new Map(); B.admAt = now(); try { let qs; try { qs = await C('crm_y24_raw').where('sig', '==', RAW_SIG).orderBy('at', 'desc').limit(RAW_N).get(); B.admVia = 'order'; } catch (e) { qs = await C('crm_y24_raw').where('sig', '==', RAW_SIG).limit(RAW_N).get(); B.admVia = 'any'; } rdAdd(B.kind, 'crm_y24_raw', qs.size); /* 웹앱 y24AdmLoad와 같은 길(색인이 없으면 순서 없이) · 예전엔 전체(limit 없음) */
      const by = new Map(); qs.forEach((d) => { const v = { id: d.id, ...d.data() }; const base = v.part ? v.id.replace(/_\d+$/, '') : v.id; (by.get(base) || by.set(base, []).get(base)).push(v); });
      const L = [...by.values()].map((X) => ({ at: X[0].at, body: X.sort((a, b) => (a.part || 0) - (b.part || 0)).map((x) => x.body || '').join('') })).sort((a, b) => String(a.at).localeCompare(String(b.at))).slice(-60);
      B.admTop = L.length ? String(L[L.length - 1].at || '') : '';
      for (const r of L) { let j = null; try { j = JSON.parse(r.body); } catch (e) { continue; } const A = (j && (j.PRODUCT_LIST || j.RESULT_LIST || j.LIST)) || []; if (Array.isArray(A)) for (const x of A) { const a = y24AdmRow(x, r.at); if (a) B.adm.set(a.no, a); } } delete B.admErr; } catch (e) { B.admErr = e.code || e.message; } }
  /* 통째 읽기(처음 · FULL_MS마다 · 바뀐 줄이 넘치거나 실패할 때) */
  async function bigLoad(why) { const t0 = now(); const B = { at: t0, kind: 'full', fullAt: t0 }; B.fAt = t0; B.fresh = new Map(); rdRun('full', why || '처음'); /* fAt = 판매 상태 작은 켜가 마지막으로 본 때(큰 켜를 읽기 시작한 때부터) · fresh = 그 뒤 바뀐 줄(큰 켜에 없던 새 판매중 줄도) */
    const seq = await doc('app_settings', 'sku_seq'); rdAdd('full', 'app_settings', 1); await skuLoad(B, seq);
    B.idx = new Map(); const q1 = await sel(C('prd_listings').where('status', '==', '판매중'), L_FIELDS).get(); rdAdd('full', 'prd_listings', q1.size); q1.forEach((d) => { if (/^_perm/.test(d.id)) return; B.idx.set(d.id, { ...lPick(d.data() || {}), id: d.id }); }); plList(B); /* 웹앱 S.plist 중 판매중(aladinLive가 다시 거름) */
    B.y24M = new Map(); const q2 = await sel(C('y24_listings'), Y_FIELDS).get(); rdAdd('full', 'y24_listings', q2.size); q2.forEach((d) => { const v = d.data() || {}; const x = {}; for (const k of Y_FIELDS) if (v[k] !== undefined) x[k] = v[k]; x.goodsNo = v.goodsNo || d.id; B.y24M.set(d.id, x); }); B.y24 = [...B.y24M.values()]; /* 웹앱 y24Watch(S.y24.list) */
    await admLoad(B);
    B.reg = new Map(); const q3 = await sel(C('reg_items').where('createdAt', '>=', regCut()), R_FIELDS).get(); rdAdd('full', 'reg_items', q3.size); q3.forEach((d) => { const v = d.data() || {}; if (!v.bump) B.reg.set(d.id, { id: d.id, ...v }); }); /* 웹앱 regWatch */
    B.ord = new Map(); const q4 = await sel(C('crm_orders').where('orderedAt', '>=', ordCut()), O_FIELDS).get(); rdAdd('full', 'crm_orders', q4.size); q4.forEach((d) => { const v = d.data() || {}; const x = {}; for (const k of O_FIELDS) if (v[k] !== undefined) x[k] = v[k]; B.ord.set(d.id, x); }); /* 웹앱 y24HeldMap(MC_DAYS 14일) */
    B.cur = { pl: t0, plm: t0, y24: t0, ord: t0, reg: t0 }; B.kind = 'delta'; M.fLast = { via: 'full', n: 0, reads: 0 }; /* 방금 통째로 읽음 — 묵은 작은 켜 결과를 보이지 않게 */ B.last = { kind: 'full', why: why || '처음', at: iso(), ms: now() - t0 }; chg('*', '*', 'full'); return B; }
  /* 바뀐 줄 하나 읽기 — 넘치면 던짐(→ 통째로) */
  async function dq(c, k, from, f) { const qs = await sel(C(c).where(k, '>', k === 'createdAt' ? new Date(from - LAP).toISOString() : tsOf(from - LAP)), f).limit(DELTA_CAP).get(); rdAdd('delta', c, qs.size); if (qs.size >= DELTA_CAP) throw Object.assign(new Error(c + ' 바뀐 줄 ' + qs.size + '+'), { cap: 1 }); return qs; }
  /* 바뀐 것만 읽기(DATA_MS마다) — 칸마다 커서(그 조회를 시작한 때) · 겹침 LAP(시계 차·늦은 확정) · 같은 줄을 두 번 봐도 결과 같음 */
  async function bigDelta(B) { const t0 = now(); rdRun('delta'); let nPl = 0, nY = 0, n = 0;
    try { for (const [k, ck] of [['uploadedAt', 'pl'], ['markAt', 'plm']]) { const qs = await dq('prd_listings', k, B.cur[ck], L_FIELDS); qs.forEach((d) => { nPl += plPut(B, d.id, d.data() || {}); }); B.cur[ck] = t0; } }
    finally { if (nPl) plList(B); } /* 두 번째 조회가 실패해도 첫 조회로 고친 줄은 목록에 */
    { const qs = await dq('y24_listings', 'uploadedAt', B.cur.y24, Y_FIELDS); qs.forEach((d) => { nY += y24Put(B, d.id, d.data() || {}); }); B.cur.y24 = t0; if (nY) B.y24 = [...B.y24M.values()]; }
    { const qs = await dq('crm_orders', 'uploadedAt', B.cur.ord, O_FIELDS); qs.forEach((d) => { n += ordPut(B, d.id, d.data() || {}); }); B.cur.ord = t0; }
    { const seen = new Set(); for (const k of ['uploadedAt', 'createdAt']) { const qs = await dq('reg_items', k, B.cur.reg, R_FIELDS); qs.forEach((d) => { if (seen.has(d.id)) return; seen.add(d.id); n += regPut(B, d.id, d.data() || {}); }); } B.cur.reg = t0; } /* 새 등록 줄은 createdAt으로도(쓰는 쪽이 고르지 않아도) */
    { const seq = await doc('app_settings', 'sku_seq'); rdAdd('delta', 'app_settings', 1); if (skuSig(seq) !== B.skuSig) await skuLoad(B, seq); } /* SKU 짝은 새 코드를 받을 때만 다시(14문서) */
    { let top = null; if (B.admVia === 'order') { try { const qs = await C('crm_y24_raw').where('sig', '==', RAW_SIG).orderBy('at', 'desc').limit(1).get(); rdAdd('delta', 'crm_y24_raw', qs.size); qs.forEach((d) => { top = String((d.data() || {}).at || ''); }); } catch (e) { top = null; } }
      if (top != null ? top !== B.admTop : now() - (B.admAt || 0) >= ADM_SLOW) await admLoad(B); } /* 관리자 원문은 맨 위 한 줄(1읽기)이 바뀔 때만 120문서 · 색인이 없으면 45분마다(예전과 같음) */
    B.last = { kind: 'delta', pl: nPl, y24: nY, other: n, at: iso(), ms: now() - t0 }; return B; }
  /* 기억 안 창 다듬기(주문 14일 · 등록 45일) — 읽기 없음 */
  const trim = (B) => { const oc = ordCut(), rc = regCut(); for (const [id, v] of B.ord) if (!(String(v.orderedAt || '') >= oc)) { B.ord.delete(id); chg('crm_orders', id, 'del'); } for (const [id, v] of B.reg) if (!(String(v.createdAt || '') >= rc)) { B.reg.delete(id); chg('reg_items', id, 'del'); } };
  const candIdle = () => { const t = now(); const v = [...M.cand.values()].filter((x) => t - x.at < FULL_IDLE_MS); return v.length > 0 && v.every((x) => !x.n); }; /* (bunoe1) 24시간 안에 센 후보가 모든 PC에서 0건 */
  const fullMs = (plat) => { const h = +(((plat || {}).y24 || {}).read || {}).fullH; return isFinite(h) && h >= 1 ? Math.min(24, Math.round(h)) * 3600e3 : candIdle() ? FULL_IDLE_MS : FULL_MS; };
  async function data(force) { if (!force && M.data && now() - M.dataAt < DATA_MS) return M.data; const D = { at: now() };
    const [main, plat, ship, lk] = await Promise.all(['main', 'platforms', 'ship_auto', 'y24_link'].map((k) => doc('app_settings', k))); rdAdd(M.big ? 'delta' : 'full', 'app_settings', 4);
    D.main = main || {}; D.plat = plat || {}; D.ship = ship || {}; D.lk = { m: (lk && lk.m) || {}, x: (lk && lk.x) || {} }; const FM = fullMs(plat);
    if (force || !M.big || now() - M.bigAt >= FM) { M.big = await bigLoad(force ? '부름' : M.big ? '때 됨' : '처음'); M.bigAt = now(); }
    else { try { await bigDelta(M.big); delete M.big.dErr; } catch (e) { const why = String((e && e.message) || e).slice(0, 80); if (e && e.cap) { log('📚 예스24 자동 — 바뀐 줄이 넘쳐 통째로', why); M.big = await bigLoad('바뀐 줄 넘침'); M.bigAt = now(); }
      else if (now() - M.bigAt >= FAIL_MS) { log('📚 예스24 자동 — 바뀐 줄 읽기 실패 · 통째로(45분마다 · 예전과 같음)', why); M.big = await bigLoad('바뀐 줄 실패'); M.bigAt = now(); M.big.dErr = why; }
      else { M.big.dErr = why; if (!M.dErrLog || now() - M.dErrLog >= FAIL_MS) { M.dErrLog = now(); log('📚 예스24 자동 — 바뀐 줄 읽기 실패 · 큰 켜는 묵은 채(팔린 책 내림은 한 권씩 다시 읽음)', why); } } } } /* 넘침 = 정말 많이 바뀜 → 바로 통째 · 실패(색인 없음 등) = 10분마다 통째로 읽으면 예전보다 비쌈 → 예전처럼 45분마다 통째 + 팔린 책 내림은 freshLoad가 한 권씩 */
    M.big.fullMs = FM; trim(M.big);
    Object.assign(D, M.big, { at: D.at, bigAt: M.bigAt }); /* 큰 켜는 같은 개체를 나눠 씀(묵힘 사이 recheck가 바꾼 값이 이어짐) */
    D.held = new Map(); D.heldAt = new Map(); /* 웹앱 y24HeldMap(MC_DAYS 14일) — 주문에 들어온 상품은 실물이 묶임 · (r1116-y24) heldAt = 그 상품의 가장 늦은 주문 시각(팔린 책 내림이 '올린 뒤 팔림'을 가림) · 주문은 기억(B.ord)에서 */
    for (const [oid, v] of M.big.ord) { if (v.kind !== 'sale') continue; for (const it of v.items || []) { if (it.lineStatus && it.lineStatus !== 'normal') continue; const lid = it.listingKey || (it.aladinUsedCode ? 'aladin_' + it.aladinUsedCode : it.listingId != null ? D.byLid.get(String(it.listingId)) : null); if (!lid) continue; if (!D.held.has(lid)) D.held.set(lid, (v.platform === 'cash' ? '현금 ' : '주문 ') + String(v.orderNo || oid || '').slice(-8)); const t = String(v.orderedAt || ''); if (t > ((D.heldAt.get(lid) || {}).t || '')) D.heldAt.set(lid, { t, ch: String(v.platform || '') }); } }
    M.data = D; M.dataAt = now(); rdSave(); return D; }
  /* (r1116-y24 · 합동 검토) 판매 상태 작은 켜 — 팔린 책 내림(downStep)만 부름 · sent = 장부에 예스24로 올린(sent) 상품 열쇠들 → { via, n, reads } */
  async function freshLoad(sent) { const B = M.big; if (!B || !B.idx) return null; if (now() - (B.fAt || 0) < FRESH_MS) return M.fLast || null; const t0 = now(); let via = 'delta', n = 0, reads = 0;
    const put = (id, v) => { B.fresh.set(id, v); const b = B.idx.get(id); if (b) { for (const k of L_FIELDS) { if (v[k] === undefined) delete b[k]; else b[k] = v[k]; } } }; /* 큰 켜의 그 줄도 새 값으로(자동 올림 차례도 같은 값을 봄) */
    const liveNow = (id) => { const f = B.fresh.get(id); return f ? aladinLive(f) : aladinLive(B.idx.get(id)); }; const ids0 = [...new Set(sent)].filter(liveNow); /* 올린 책 중 지금 판매중으로 보이는 것(판매중 아님은 이미 후보 → 맡기기 전 한 권 새로 읽음) */
    if (!ids0.length) { M.fLast = { via: '없음(올린 책 중 판매중 0)', n: 0, reads: 0 }; return M.fLast; } /* 읽을 까닭 없음 · fAt는 그대로(다음에 그 뒤 바뀐 줄을 다 봄) */
    const lim = Math.min(FRESH_LIM, Math.max(100, ids0.length)); /* 바뀐 줄이 올린 책 수보다 많으면 올린 책을 콕 집어 읽는 쪽이 쌈 → 한 차례 읽기 ≤ 2 × max(100, 올린 책) */
    let qs = null; try { qs = await sel(C('prd_listings').where('uploadedAt', '>', new Date((B.fAt || t0) - FRESH_LAP)), L_FIELDS).limit(lim).get(); } catch (e) { qs = null; }
    const seen = new Set(); if (qs) { reads += Math.max(1, qs.size); qs.forEach((d) => { seen.add(d.id); if (!/^_perm/.test(d.id)) { put(d.id, d.data() || {}); n++; } }); }
    if (!qs || qs.size >= lim) { via = qs ? 'doc(바뀐 줄 ' + qs.size + '+)' : 'doc(바뀐 줄 읽기 실패)'; /* 다 못 봄 → 올린 책 중 판매중으로 보이는 것만 콕 집어 */
      const ids = ids0.filter((id) => !seen.has(id));
      for (let k = 0; k < ids.length; k += 100) { const part = ids.slice(k, k + 100); const got = await Promise.all(part.map((id) => C('prd_listings').doc(id).get().catch(() => null))); reads += part.length;
        got.forEach((d, i) => { if (d && d.exists) { put(part[i], d.data() || {}); n++; } }); } }
    B.fAt = t0; M.fLast = { via, n, reads }; if (reads) rdAdd('fresh', 'prd_listings', reads); if (via !== 'delta') log('🛑 팔린 책 내림 — 판매 상태를 한 권씩 다시 읽음', via, reads + '읽기'); return M.fLast; }
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
    const ledSku = new Set(); for (const e of Object.values(led.r || {})) if (e && e.st !== 'retry') (e.skus || []).forEach((s) => ledSku.add(s)); const pxAl = new Set(); for (const w of Object.values(led.w || {})) if (w && w.lid && w.px === 'al' && w.on != null && +w.on) pxAl.add(String(w.lid)); /* (y24pick1 11/18) 「알라딘 값과 같게」 정해 둔 상품 — 웹앱 y24PxAlSet 그대로 */
    return { onY24, selfSet, led: led.r || {}, ledSku, pxAl, cfg, val }; }
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
  const rowsOf = (E) => E.map((e) => ({ lid: e.lid, isbn: e.isbn, ...(e.bc ? { bc: e.bc } : {}), grade: e.grade, price: +e.price, qty: 1, self: (e.skus || []).join(','), title: String(e.title || '').slice(0, 60) })); /* 웹앱 y24AutoRowsOf */
  const xlsxOf = (m, rows) => { const X = m.XL; const wb = X.utils.book_new(); X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(m.B.y24RegAoa(rows)), 'Sheet1'); return X.write(wb, { type: 'base64', bookType: 'xlsx' }); }; /* 웹앱 y24AutoXlsx */
  const ref = () => C('app_settings').doc('y24_reg');
  /* 번외 결과 → 장부(웹앱 y24AutoApply와 같음 — 그 맡김 줄만 · 아직 'auto'인 줄만) */
  /* (r1116-y24) 번외가 멈춘 화면 원문 — 3,000자를 넘으면 앞쪽을 잘라 안에 글로 넣음(예전엔 글자 수로 자른 JSON을 다시 풀다 늘 실패해 null이 저장됐음) */
  const rawCut = (raw) => { let t; try { t = JSON.stringify(raw); } catch (e) { return null; } if (typeof t !== 'string') return null; if (t.length <= 3000) { try { return JSON.parse(t); } catch (e) { return null; } } return { cut: 1, len: t.length, txt: t.slice(0, 2900) }; };
  async function apply(led, resMap, hv) { const at = iso(); const r = {}; let stop = null, last = null;
    for (const [jid, x] of Object.entries(resMap || {})) { last = { job: jid, state: x.state, msg: String(x.msg || '').slice(0, 200), at, n: (x.rows || []).length, raw: x.raw && typeof x.raw === 'object' ? rawCut(x.raw) : null }; /* (y24reg5) raw가 없는 결과도 null로 씀 — 예전엔 merge라 옛 묶음의 raw가 그대로 남아 낡은 화면 원문이 새 결과처럼 보였음 */ /* (headless1) 번외가 멈춘 화면 원문(앞 300자·단추 이름 — 우리 상품 글뿐) */
      for (const lid of x.rows || []) { const e = (led.r || {})[lid]; if (!e || e.job !== jid || e.st !== 'auto') continue; const g = x.gno && x.gno[lid]; const mn = x.mno && /^\d{5,12}$/.test(String(x.mno[lid] || '')) ? { mno: String(x.mno[lid]) } : {}; /* (y24reg5) 예스24 허브(책 묶음) 번호 — 공개 화면 확인이 씀 */
        if (g) r[lid] = { st: 'sent', ok: 1, gno: String(g), how: '🤖 번외 자동 확인(자체코드)', okAt: at, okBy: '🤖 번외 수집기', unsure: null, why: null, todo: null };
        else if (x.state === 'fail') r[lid] = { st: 'autofail', why: String(x.msg || '').slice(0, 200), todo: x.todo ? String(x.todo).slice(0, 200) : null, failAt: at };
        else r[lid] = { st: 'sent', unsure: 1, why: String(x.msg || '').slice(0, 200), todo: x.todo ? String(x.todo).slice(0, 200) : null, ...mn };
        if (g) Object.assign(r[lid], mn); }
      if (x.state !== 'done') stop = { why: String(x.msg || '').slice(0, 200), todo: x.todo ? String(x.todo).slice(0, 200) : null, at, job: jid, state: x.state, ...(hv ? { hv: String(hv) } : {}) /* (y24reg3) 멈춘 번외 판 — 새 판이 오면 한 번 풂 */ }; }
    if (!last) return 0; await ref().set({ r, auto: { last, ...(stop ? { stop } : {}) } }, { merge: true }); for (const [k, v] of Object.entries(r)) led.r[k] = { ...led.r[k], ...v }; return Object.keys(r).length; }
  /* ══ (y24reg5 11/17) 🔎 올라감 확인 — 번외가 [등록]을 누른 뒤 '등록 완료' 창·알림을 못 봐 'sent · 확인 필요(unsure)'로 남긴 줄을 클라우드가 공개 자료에서 다시 찾음
   *  왜: 11/17 00:08Z 블루레이가 실제로 예스24에 올라갔는데(공개 화면 판매자 북스퀸 · goods_no 있음) 번외가 창을 못 봐 unsure → auto.stop이 걸려 사람이 「올라감 확인」을 눌러야 다음 책이 올라갔음
   *  어떻게(읽기만 · 예스24에 쓰지 않음 · 로그인 없이 손님 화면): 차례대로 셋 중 '꼭 하나'일 때만 그 번호
   *   ① 관리자 목록 원문(crm_y24_raw)에서 자체코드가 이 줄 SKU인 상품 ② 우리 가게 공개 목록(y24_listings)에서 맡긴 뒤 처음 보인 · 같은 값·등급 · 다른 책 표시가 없는 매물
   *   ③ 예스24 허브(책 묶음) 공개 화면에서 판매자 우리 가게(jerrycson) · 같은 값·등급 · 맡기기 전 있던 번호(before)·장부 다른 줄 번호·맡기기 전부터 있던 우리 매물이 아닌 줄
   *  애매(둘 넘음)·못 찾음이면 아무것도 바꾸지 않음(사람 확인 그대로) · 찾으면 웹앱 「올라감 확인」과 같은 모양(st sent · ok 1 · gno)
   *  그 묶음의 확인 필요 줄이 모두 풀리면 그 묶음이 건 멈춤(auto.stop · state unsure/part)만 풂(다른 까닭의 멈춤은 그대로) · 한 줄은 10분에 한 번 · 한 차례 화면 4쪽까지 */
  M.vf = new Map(); M.vfLast = null; const VF_DAYS = 14, VF_GAP = 10 * 60e3, VF_PAGES = 4, VF_ROWS = 3, VF_OWN = ['jerrycson'];
  const dig = (v) => String(v || '').replace(/\D/g, '');
  function hubOf(e, led, B) { if (/^\d{5,12}$/.test(String(e.mno || ''))) return String(e.mno); const K = new Set([dig(e.bc), dig(e.isbn)].filter(Boolean)); if (!K.size) return null;
    const L = ((((led.auto || {}).last || {}).raw || {}).vs || {}).rows; const x = Array.isArray(L) ? L.find((q) => q && K.has(dig(q.bc || q.isbn)) && /^\d{5,12}$/.test(String(q.no || ''))) : null; if (x) return String(x.no); /* 번외가 본 미리보기 결과 줄(상품 번호 = 허브 번호) */
    const H = new Set(((B && B.y24) || []).filter((q) => q.masterNo && K.has(dig(q.isbn13))).map((q) => String(q.masterNo))); return H.size === 1 ? [...H][0] : null; } /* 같은 책 우리 매물이 아는 허브 번호(꼭 하나일 때) */
  async function vfStep(led, m) { const t0 = now(); const T = Object.entries(led.r || {}).filter(([lid, e]) => e && (e.auto || e.job) && e.st === 'sent' && !e.ok && !e.gno && e.unsure && t0 - (Date.parse(e.at || 0) || 0) <= VF_DAYS * 864e5 && t0 - (M.vf.get(lid) || 0) >= VF_GAP).slice(0, VF_ROWS);
    if (!T.length) return null; T.forEach(([lid]) => M.vf.set(lid, t0)); let B = M.big; if (!B) { try { await data(); B = M.big; } catch (e) { B = null; } }
    const taken = new Set(); for (const e of Object.values(led.r || {})) if (e && e.gno) taken.add(String(e.gno)); const out = { at: iso(), n: T.length, ok: [], amb: [], none: [], err: [] }; const patch = {}; let pages = 0;
    for (const [lid, e] of T) { const tAt = (Date.parse(e.at || 0) || 0) - 2 * 60e3; const before = new Set((e.before || []).map(String)); const free = (no) => !!no && !before.has(String(no)) && !taken.has(String(no)); const S0 = new Set(e.skus || []); const K = new Set([dig(e.bc), dig(e.isbn)].filter(Boolean)); const hub = hubOf(e, led, B);
      const older = new Set(((B && B.y24) || []).filter((q) => (Date.parse(q.firstSeenAt || 0) || 0) < tAt).map((q) => String(q.goodsNo))); /* 맡기기 전부터 있던 우리 매물 */
      let hit = null, how = '', amb = '';
      if (B && B.adm && S0.size) { const L = [...new Set([...B.adm.values()].filter((a) => String(a.self || '').split(/[,\s]+/).some((s) => S0.has(s)) && free(a.no)).map((a) => String(a.no)))]; if (L.length === 1) { hit = L[0]; how = '관리자 목록 자체코드'; } else if (L.length > 1) amb = '관리자 목록 자체코드 ' + L.length + '개'; }
      if (!hit && !amb && B && B.y24) { const L = B.y24.filter((q) => !q.goneAt && (Date.parse(q.firstSeenAt || 0) || 0) >= tAt && +q.price === +e.price && y24G(q.grade) === e.grade && free(q.goodsNo) && !(hub && q.masterNo && String(q.masterNo) !== hub) && !(q.isbn13 && K.size && !K.has(dig(q.isbn13)) && !(hub && String(q.masterNo || '') === hub))).map((q) => String(q.goodsNo));
        if (L.length === 1) { hit = L[0]; how = '우리 가게 공개 목록 새 매물'; } else if (L.length > 1) amb = '우리 가게 새 매물 ' + L.length + '개'; }
      if (!hit && !amb && hub && o.hubGet && m && m.X && m.X._y24HubPage && pages < VF_PAGES) { const seen = new Map();
        const eat = (P) => { for (const it of (P && P.items) || []) if (it && it.id) seen.set(String(it.id), it); return P; };
        const mine = () => [...seen.values()].filter((it) => VF_OWN.includes(String(it.sellerId || '')) && +it.p === +e.price && y24G(it.g) === e.grade && free(it.id) && !older.has(String(it.id))).map((it) => String(it.id));
        try { const P = eat(m.X._y24HubPage(await o.hubGet(m.X.y24HubUrl ? m.X.y24HubUrl(hub) : 'https://www.yes24.com/Product/UsedShopHub/Hub/' + hub), hub)); pages++;
          const lv = Object.keys(Y24_LV).find((k) => Y24_LV[k] === e.grade) || '00';
          if (!mine().length && m.X.y24GoodsListUrl && (P.lastPage || 1) > 1) for (let pg = 1; pg <= 3 && pages < VF_PAGES && !mine().length; pg++) { const Q = eat(m.X._y24HubPage(await o.hubGet(m.X.y24GoodsListUrl({ hubId: hub, page: pg, levelGb: lv })), hub)); pages++; if (!Q.items.length || (Q.lastPage && pg >= Q.lastPage)) break; } /* 첫 화면은 최저가 24줄뿐 → 같은 등급만 다음 쪽 */
          const L = mine(); if (L.length === 1) { hit = L[0]; how = '공개 허브 화면 ' + hub + ' 판매자 우리 가게'; } else if (L.length > 1) amb = '공개 허브 화면에 같은 값·등급 우리 매물 ' + L.length + '개'; }
        catch (err) { out.err.push(lid + ': ' + String((err && err.message) || err).slice(0, 80)); continue; } }
      if (hit) { taken.add(hit); patch[lid] = { st: 'sent', ok: 1, gno: hit, how: '🤖 클라우드 공개 화면 확인(' + how + ')', okAt: iso(), okBy: '🤖 클라우드 확인', unsure: null, why: null, todo: null, vfAt: iso(), ...(hub && !e.mno ? { mno: hub } : {}) }; out.ok.push(lid + '=' + hit); }
      else if (amb) out.amb.push(lid + ': ' + amb); else out.none.push(lid + (hub ? '' : ' (허브 번호 모름)')); }
    M.vfLast = out; if (!Object.keys(patch).length) return out;
    for (const [lid, p] of Object.entries(patch)) led.r[lid] = { ...led.r[lid], ...p };
    const sp = led.auto && led.auto.stop; const rel = !!sp && ['unsure', 'part'].includes(sp.state) && !!sp.job && Object.values(patch).length > 0 && Object.entries(led.r).some(([lid, e]) => patch[lid] && e.job === sp.job) && !Object.values(led.r).some((e) => e && e.job === sp.job && e.st === 'sent' && !e.ok && e.unsure);
    const vf = { at: iso(), ok: out.ok.slice(0, 10), ...(rel ? { freed: { job: sp.job, why: String(sp.why || '').slice(0, 160), at: sp.at || null } } : {}) };
    await ref().set({ r: patch, auto: { vf, ...(rel ? { stop: null } : {}) } }, { merge: true }); if (rel) { led.auto.stop = null; out.freed = sp.job; } log('🔎 예스24 올라감 확인(클라우드 공개 화면)', out.ok.join(','), rel ? '멈춤 풂 ' + sp.job : ''); return out; }
  /* 다음 묶음 장부에 먼저(웹앱 y24AutoCommit과 같음 — 트랜잭션 안에서 장부를 다시 읽고 차례·되풀이를 다시 셈) */
  async function commit(m, cand, Cd, jid, by, pc, cfg) { let res = null;
    await db.runTransaction(async (tx) => { const cur = (await tx.get(ref())).data() || {}; if (cur.auto && cur.auto.stop) { res = { ok: [], stop: cur.auto.stop }; return; } const led = cur.r || {}; const at = iso();
      const P = m.B.y24AutoPlan(cand, led, Cd, at, cfg, kstDay(now())); const R = m.B.y24RegFilter(P.pick, led); res = { ...R, plan: P }; if (!R.ok.length) return; const r = {};
      R.ok.forEach((x) => { const before = Cd.pub.filter((q) => q.isbn === x.isbn).map((q) => q.no).concat(Cd.adm.filter((a) => a.ean === x.isbn).map((a) => a.no)); const prev = led[x.lid];
        r[x.lid] = { lid: x.lid, title: x.title.slice(0, 60), isbn: x.isbn, ...(x.bc ? { bc: x.bc } : {}), grade: x.grade, qty: 1, price: x.price, alPrice: x.alPrice, val: x.val ? { mode: x.val.mode, t: x.val.t } : null, skus: x.skus, at, day: kstDay(now()), by, batch: jid, job: jid, auto: 1, st: 'auto', before: [...new Set(before)].slice(0, 30), hist: prev ? [...(prev.hist || []), { st: prev.st, at: prev.at, by: prev.by, gno: prev.gno || null }].slice(-10) : [] }; });
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
    const led = await ledGet(); const R = led.r || {}; const today = kstDay(now()); const upd = {}; const cnt = { sent: 0, wait: 0, fail: 0, human: 0, done: 0, cancel: 0, resend: 0, dup: 0, unk: 0, nogno: 0, hold: 0, already: 0 }; const jobs = []; let fr = null; /* fr = 판매 상태 작은 켜 결과(돌려주는 값에만 — 상태 한 줄 dSave엔 안 넣음: 같은 글이면 쓰지 않는 막이를 깨지 않게) */
    const fin = async (why, more) => { if (Object.keys(upd).length) { try { await ref().set({ r: upd }, { merge: true }); } catch (e) {} } const dayN = led.downDay && led.downDay.day === today ? +led.downDay.n || 0 : 0; M.dWhy = why;
      await dSave({ why, pc: P, day: today, dayN: dayN + cnt.sent, dayMax: cfg.day, sent: cnt.sent, wait: cnt.wait + cnt.hold, fail: cnt.fail, human: Object.values(R).filter((e) => e && e.down && e.down.st === 'human').length + cnt.human, ...(more || {}) }); return { why, sent: cnt.sent, jobs, cnt, ...(fr ? { fresh: fr } : {}) }; };
    await dPoll(P, plat, cfg, R, upd, cnt);
    if (!Object.values(R).some((e) => e && e.st === 'sent')) return fin('예스24에 올린 책이 장부에 없음 — 내릴 것 0'); /* 읽기 줄이기 — 올린 책이 없으면 큰 자료(판매중 목록 등)를 읽지 않음 */
    const D = await data(); try { fr = await freshLoad(Object.keys(R).filter((k) => R[k] && R[k].st === 'sent')); } catch (e) { fr = { via: '오류 ' + String((e && e.message) || e).slice(0, 60), n: 0 }; } /* (r1116-y24 · 합동 검토) 판매 상태만 FRESH_MS마다 새로 — 큰 켜(45분)를 기다리지 않음 */
    const liveIds = new Set(D.list.filter(aladinLive).map((l) => l.id)); for (const [id, v] of (D.fresh || new Map())) { if (aladinLive(v)) liveIds.add(id); else liveIds.delete(id); } const Y = new Map(D.y24.map((x) => [String(x.goodsNo), x]));
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
      reads++; rdAdd('doc', 'prd_listings', 1); const l = await doc('prd_listings', x.lid); if (!l) { dSkipSet(x.lid, 60); cnt.unk++; continue; }
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
    { const add = {}, mark = {}; for (const [lid, x] of Object.entries(BC_SEED)) if (!(led.bc || {})[lid] && !(led.bcSeed || {})[lid] && m.B.y24RegEan(x.bc)) { add[lid] = x.bc; mark[lid] = { at: iso(), why: x.why, by: 'cloud y24auto' }; }
      if (Object.keys(add).length) { try { await ref().set({ bc: add, bcSeed: mark }, { merge: true }); led.bc = { ...(led.bc || {}), ...add }; led.bcSeed = { ...(led.bcSeed || {}), ...mark }; log('🟦 예스24 바코드 심음', Object.keys(add).join(',')); } catch (e) {} } } /* (r1116-y24reg) BC_SEED */
    const res = (y && y.res) || {}; const rej = Array.isArray(y && y.rej) ? y.rej.slice(0, 10) : []; const rm = { ...res }; const dupRej = [];
    for (const x of rej) { if (!x || !x.id) continue; const err = String(x.err || '');
      /* (r1116-y24) '되풀이 0' 거절 — 번외가 이미 한 일(또는 이미 줄에 있는 일)이라 다시 받지 않음. 예전엔 장부에 안 적어 그 줄이 영영 '올리는 중'으로 남고 3분마다 다시 맡겨졌음(거절 기록도 안 지워져 번외가 계속 빠른 차례로 돎)
       *  · '맡김 줄에 있음'(다른 묶음이 같은 책을 들고 있음) = 그 묶음의 결과를 기다림 → 거절 기록만 지움
       *  · 그 밖의 되풀이(이미 올림·이미 함) = 번외 기록상 이미 처리됨 → 줄을 '올림(확인 필요)'으로 닫아 다시 맡기지 않음(두 번 올리는 것보다 사람 확인이 안전) */
      if (/되풀이/.test(err)) { if (!/맡김 줄에 있음/.test(err)) rm[x.id] = { state: 'done', rows: (x.rows || []).map(String), msg: '번외가 되풀이로 거절(이미 처리한 일) — 예스24 등록상품 목록에서 올라갔는지 확인 · ' + err.slice(0, 100), dup: 1 }; dupRej.push(x.id); continue; }
      rm[x.id] = { state: 'fail', pre: 1, rows: (x.rows || []).map(String), msg: '번외가 맡김을 거절 — ' + String(x.err || '').slice(0, 160), todo: '📤 장부에서 이 줄을 보고 「↩ 다시 올릴 수 있게」 뒤 「▶ 이어 가기」 또는 엑셀 길(손)로' }; }
    if (Object.keys(rm).length) { await apply(led, rm, st.ver); out.ack = Object.keys(res); }
    const rejDone = rej.filter((x) => x && x.id && (!/되풀이/.test(String(x.err || '')) || dupRej.includes(x.id))).map((x) => x.id); if (rejDone.length) out.rejAck = rejDone;
    /* (y24first1 11/14 · HOME 20:50 첫 자동 올림) 번외 0.1.66까지는 미리보기 표(RealGrid — 그림으로 그리는 표)의 줄을 화면 글에서만 찾아 「미리보기 목록에 우리 줄이 안 보임」으로 늘 멈췄음([등록]은 안 누름 = 예스24에 아무것도 안 올라감)
     *  → 표 자료를 읽는 번외(0.1.68 뒤 · 멈춤 글에 '(표 …)'가 붙음)가 이 멈춤을 본 때 한 번 저절로 풂(사람 손 없이 · 같은 책은 장부에 실패로 남아 다시 고르지 않고 다음 책으로) · 새 판에서 또 멈추면 그대로 둠 */
    /*  (y24reg3 11/17) 넓힘 — 0.1.71도 '(표 0줄)'로 같은 자리에서 멈췄음(원인 = 웹앱 엑셀 27행 머리 칸 이름이 예스24 화면이 읽는 열쇠와 달라 모든 줄을 빈 줄로 버림 · 웹앱 1.78.675에서 고침)
     *  → '아무것도 누르지 않은 멈춤'(미리보기·올리기 전 실패)은 번외 판이 멈춘 판보다 새로우면 번외 판마다 한 번만 저절로 풂(auto.resumeVer에 그 판을 적어 같은 판에서 되풀이 0 · 누른 뒤 '확실하지 않음' 멈춤은 그대로 둠) */
    { const sp = led.auto && led.auto.stop; const vn = (x) => String(x || '0').split('.').reduce((a, q) => a * 1000 + (+q || 0), 0); const why0 = String((sp && sp.why) || '');
      const preStop = !!sp && (!sp.state || sp.state === 'fail') && (/미리보기 목록에 우리 줄이 안 보임|예스24 엑셀 확인 결과/.test(why0)) /* 미리보기·엑셀 확인 단계 멈춤만(화면 모양이 다름 같은 멈춤은 사람이 봄) */;
      const spVer = (sp && sp.hv) || (/\(표 /.test(why0) ? '0.1.71' : '0.1.66'); /* 판을 적지 않던 옛 멈춤: 표 줄 수가 붙으면 0.1.68~0.1.71 · 아니면 0.1.66까지 */
      if (preStop && st.ver && vn(st.ver) > vn(spVer) && String((led.auto && led.auto.resumeVer) || '') !== String(st.ver)) { try { await ref().set({ auto: { stop: null, resumeAt: iso(), resumeVer: String(st.ver), resumeBy: 'cloud y24auto — 번외 ' + st.ver + ' 새 판(멈춘 판 ' + spVer + ') · 아무것도 누르지 않은 멈춤을 판마다 한 번 풂' } }, { merge: true }); led.auto.stop = null; led.auto.resumeVer = String(st.ver); log('🤖 예스24 자동 올림', pc, '아무것도 안 누른 멈춤 풂(번외 ' + st.ver + ')'); } catch (e) {}
        /* (y24reg3 11/17 고침 2) 같은 때 그 멈춤으로 실패한 줄도 판마다 한 번 「↩ 다시 올릴 수 있게」(사람 단추 y24RegMark와 같은 모양 · 예전 상태는 hist · 지우지 않음)
         *  — 우리 엑셀 탓(머리글·칸 값)으로 예스24가 줄을 못 읽은 것이라 상품 탓이 아님 · 예스24가 오류 코드(-N)를 알려 준 줄은 그대로 사람에게 · 한 번에 최대 5줄 */
        const rv = {}; for (const [lid, e] of Object.entries(led.r || {})) { if (Object.keys(rv).length >= 5) break; const w = String((e && e.why) || '');
          const ours = /오류코드 -(?:4|5|6|7|9|13)\b/.test(w) && !/오류코드 -(?:1|2|3|8|10|11|12|14|15|16|17|18)\b/.test(w); /* (y24reg4 11/17) -4~-7 상태정보·사용흔적·손상여부·부속물(품질등급 칸에서 나옴)·-9 판매형태·-13 판매가 입력값 = 우리 엑셀 칸 값 탓 · 상품 탓(바코드·신간·재고·값 범위·미등록·금지어)이 하나라도 섞이면 그대로 사람에게 */
          if (!e || e.st !== 'autofail' || (/오류코드 -?\d/.test(w) && !ours) || !(ours || /미리보기 목록에 우리 줄이 안 보임|결과 표에 없음|모두 버려짐/.test(w)) || String(e.revVer || '') === String(st.ver)) continue;
          rv[lid] = { st: 'retry', ok: null, revVer: String(st.ver), markAt: iso(), markBy: '🤖 클라우드 — 번외 ' + st.ver + ' 새 판 · 아무것도 안 누른 실패 한 번 풂', hist: [...(e.hist || []), { st: e.st, ok: e.ok || null, at: e.markAt || e.failAt || e.at, by: e.markBy || e.by }].slice(-10) }; }
        if (Object.keys(rv).length) { try { await ref().set({ r: rv }, { merge: true }); for (const [lid, p] of Object.entries(rv)) Object.assign(led.r[lid], p); log('🤖 예스24 자동 올림', pc, '안 누른 실패 줄 다시 후보 ' + Object.keys(rv).join(',')); } catch (e) {} } } }
    try { const v = await vfStep(led, m); if (v) out.vf = v; } catch (e) { out.vf = { err: [String((e && e.message) || e).slice(0, 120)] }; } /* (y24reg5) 🔎 확인 필요 줄을 공개 자료에서 다시 찾음 — 찾으면 그 묶음 멈춤도 풂 */
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
    const bcOf = (l) => (y24Isbn(l.isbn13) ? null : m.B.y24RegEan((led.bc || {})[l.id]) || null); /* (r1116-y24reg) 웹앱 y24RegBc — ISBN이 없는 상품만 장부 바코드 */
    const L0 = D.list.filter(aladinLive).map((l) => ({ l, L: { id: l.id, title: l.title, isbn: y24Isbn(l.isbn13), bc: bcOf(l), grade: y24G(l.grade), price: +l.price || 0, qty: l.qty == null ? 1 : +l.qty, live: aladinLive(l), skus: isDupes(l) ? [] : skuSelf(m.R, D, l), dupes: isDupes(l), adult: !!l.adult, held: D.held.get(l.id) || null, unpub: null } })); /* 웹앱 y24RegL */
    const ok0 = L0.filter((x) => m.B.y24RegJudge(x.L, X0).ok); const Cd = regC(D); const nLed = m.B.y24RegNLed(led.r, Cd, iso(), cfg); /* 「↩ 다시 올릴 수 있게」로 푼 줄은 세지 않음(웹앱과 같음) · (r1116-y24reg) 자동 올림 실패·며칠째 안 보임 줄도 세지 않음 — 끝난 첫 시도 뒤 첫 1건 고르기가 다시 열림 */
    const pickI = ok0.filter((x) => W.has(x.l.id) || cfg.autoAll).concat(!nLed && cfg.firstAny ? ok0.slice().sort((a, b) => a.L.price - b.L.price).slice(0, 60) : []).map((x) => x.L.isbn); /* 시장 지표를 받을 책 — 「🟦 예스24도」·판매중 전부(켰으면) · 처음 한 건은 값 싼 것부터 60권 */
    await mktLoad(pickI); const has = (i) => M.mkt.has(String(i)); const X = { ...X0, val: (L) => engVal(m, D, { ...(D.list.find((q) => q.id === L.id) || {}), price: L.price, grade: L.grade, isbn13: L.isbn }, M.mkt.get(String(L.isbn))) };
    const rows = L0.map((x) => { const j = has(x.L.isbn) ? m.B.y24RegJudge(x.L, X) : m.B.y24RegJudge(x.L, X0); return { k: j.ok ? 'ok' : 'no', why: j.why || '', row: j.row || null, lid: x.l.id, want: W.get(x.l.id) || null }; });
    /* (plock2 11/18 · 정범님 I-1117-2027-23 「잠긴 상품은 판매 상태 말고 아무것도 안 바뀜」) 🔒 잠긴 상품(prd_locks · on)은 예스24에 새로 올리지 않음 — 후보에서 빼고 「🔒 잠금이라 건너뜀 N」 · 풀면 다음 차례에 저절로 후보 · 못 읽으면 이번엔 아무것도 올리지 않음(안전 쪽) */
    const bcOk = !!st.bc; const cand00 = m.B.y24AutoCand(rows, cfg, nLed, (i) => mktGo(i, cfg), has);
    const lkAll = cand00.length ? await plkSetY() : { k: new Set(), lid: new Set() }; if (!lkAll) return say('🔒 잠금 상태를 못 읽어 이번엔 예스24에 올리지 않음 — 다음 차례에 다시'); /* 후보가 있을 때만 읽음(잠긴 것만 · 몇 건) */
    const plkC = cand00.filter((r) => plkHitY(lkAll, r.lid, D)); const cand0 = plkC.length ? cand00.filter((r) => !plkHitY(lkAll, r.lid, D)) : cand00; const cand = cand0.filter((r) => !r.bc || bcOk); M.cand.set(pc, { n: cand0.length, at: now() }); /* (bunoe1) 후보 0건이면 통째 읽기 24시간마다 — fullMs */ /* (r1116-y24reg) 바코드 줄은 바코드를 아는 번외(state bc:1 · 0.1.71 뒤)에만 — 옛 번외는 ISBN 검사로 거절 → 멈춤이 되므로 */
    const P = m.B.y24AutoPlan(cand, led.r, Cd, iso(), cfg, kstDay(now())); out.plan = { mode: P.mode, max: P.max, nOk: P.nOk, human: P.human.length, cand: cand.length, ...(cand0.length > cand.length ? { bcWait: cand0.length - cand.length } : {}), ...(plkC.length ? { plk: plkC.length, plkLids: plkC.map((r) => r.lid).slice(0, 30) } : {}) }; const plkT = plkC.length ? ` · 🔒 잠금이라 건너뜀 ${plkC.length}` : ''; if (plkC.length) log('🔒 예스24 자동 올림 — 잠금이라 건너뜀', pc, plkC.length + '권');
    for (const h of P.human.filter((x) => x.mkt).slice(0, 10)) { const i = String(h.row.isbn); const d = M.mkt.get(i); if ((d && d.reqAt && now() - Date.parse(d.reqAt) < 6 * 3600e3) || now() - (M.reqd.get(i) || 0) < 6 * 3600e3) continue; M.reqd.set(i, now());
      try { const at = iso(); await C('y24_mkt').doc(i).set({ isbn: i, req: { at, by: 'cloud y24auto', dev: pc, auto: true } }, { merge: true }); if (d) d.reqAt = at; } catch (e) {} } /* 웹앱 y24mReq(auto) — 클라우드 시장 읽기에 맡김 */
    /* (r1116-y24) 보내기 직전 재확인 — 큰 자료가 묵었을 수 있으므로(바뀐 줄을 안 남긴 사람 손 바꿈·지움은 최대 FULL_MS) 올릴 책(한 차례 25권 이하)을 한 권씩 새로 읽음: 알라딘에서 팔렸거나(판매중 아님·수량 0) 값·등급이 바뀌었으면 이번엔 빼고(자료 개체도 새 값으로 바꿈 → 다음 차례엔 새 값으로 다시 셈) 다시 고름 */
    let cand2 = cand, P2 = P, drop = 0, nLk = 0;
    for (let round = 0; round < 3 && P2.pick.length; round++) { const bad = new Set();
      for (const x of P2.pick) { let l = null; try { rdAdd('doc', 'prd_listings', 1); l = await doc('prd_listings', x.lid); } catch (e) { bad.add(x.lid); continue; } const before = D.idx && D.idx.get(x.lid);
        if (!l) { bad.add(x.lid); continue; } const chg = !!before && (+before.price !== +l.price || y24G(before.grade) !== y24G(l.grade));
        if (before) { for (const k of L_FIELDS) { if (l[k] === undefined) delete before[k]; else before[k] = l[k]; } } /* 큰 자료의 그 줄을 새 값으로(다른 길도 같은 값을 봄) */
        if (!aladinLive(l) || chg) { bad.add(x.lid); continue; }
        const lk1 = await plkOneY(x.lid, l.listingId); if (lk1 !== false) { bad.add(x.lid); nLk++; } } /* (plock2 11/18) 🔒 올리기 직전 그 상품 잠금을 한 권씩 다시 읽음 — 차례 맨 앞 목록 뒤에 잠근 것도 바로 지킴 · 못 읽으면(undefined) 잠긴 것으로 */
      if (!bad.size) break; drop += bad.size; cand2 = cand2.filter((c) => !bad.has(c.lid)); P2 = m.B.y24AutoPlan(cand2, led.r, Cd, iso(), cfg, kstDay(now())); }
    if (drop) { out.plan = { ...out.plan, drop, ...(nLk ? { plk: (out.plan.plk || 0) + nLk } : {}) }; log('🔁 예스24 올리기 직전 재확인에서 뺌', pc, drop + '권' + (nLk ? ` (🔒 잠김 ${nLk})` : '')); }
    if (!P2.pick.length && cand0.length > cand.length && !cand.length) return say(`🟦 바코드 상품 ${cand0.length - cand.length}건 — 이 PC 번외가 바코드를 아는 새 판(0.1.71 뒤)을 받으면 올림`);
    const plkT2 = nLk ? ` · 🔒 잠금이라 건너뜀 ${(plkC.length || 0) + nLk}` : plkT;
    if (!P2.pick.length) return say((drop ? `재확인에서 ${drop}권을 뺌(알라딘에서 팔렸거나 값이 바뀜${nLk ? ' · 잠김' : ''}) — 다음 차례에 새 값으로 다시 고름` : P.t) + plkT2);
    const jid = 'y24a' + iso().replace(/\D/g, '').slice(2, 14) + Math.random().toString(36).slice(2, 5); const r = await commit(m, cand2, Cd, jid, me, pc, cfg);
    if (!r || !r.ok.length) return say((r && r.stop ? '⛔ 멈춤 — ' + r.stop.why : (r && r.plan && r.plan.t) || P.t) + plkT2);
    const rows2 = rowsOf(r.ok); out.jobs.push({ id: jid, rows: rows2, xlsx: xlsxOf(m, rows2), by: 'cloud:' + pc }); log('🤖 예스24 자동 올림', pc, jid, rows2.length + '건 맡김');
    return say(`🤖 ${rows2.length}건 번외에 맡김 — 예스24 대량 등록 중` + plkT2); }
  return { step, mods, data, changes, _M: M, wantLids, regX, regC, engVal, mktGo, downStep, vfStep, hubOf };
}
module.exports = { makeY24Auto, blockOf, cutBlock, y24Isbn, y24AdmRow, aladinLive, BLOCK_NAMES, downCfg, holderOf, DOWN_DEF, DOWN_SRC };
