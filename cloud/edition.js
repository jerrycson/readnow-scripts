/* 📚 판본 추적 엔진 (edition1 · 2026-11-14 · 정범님 11/14 18:13 「스스로 개정판 여부를 판단하고 판별하면서 이후에도 계속 추적하고 기능을 계속해서 보완해나가는 엔진」 · 연구 N15)
 *  하는 일(책 한 권마다 · 우리 판매 중 상품 중 새책이 품절·절판·구판절판인 것부터):
 *   ① 알라딘 공개 상품 화면(로그인 정보 없이 · credentials 'omit')에서 '개정판 안내'·'구판,개정판 정보'·품절 안내 칸의 다른 판본 링크를 찾아 양쪽(구판·개정판)으로 끝까지 따라감
 *   ② 링크가 있든 없든 제목(판 표시·부제 뗀 것) · 제목+지은이 · 원제(있으면)로 알라딘 공개 검색 + 국립중앙도서관 서지(열쇠가 있으면) → 다른 판본 후보
 *   ③ 후보마다 같은 책인지 다시 봄(제목 핵심·지은이·원제·옮긴이·출판사·쪽수 · 알라딘이 직접 이은 링크는 근거 가산) → 판본 / 다른 번역본 / 원서 / 다른 책 / 모양 다름(전자책 등)
 *   ④ 확정된 판본을 출간일 차례로 세우고 우리 것보다 옛 판(older)·새 판(newer)·같은 때(same)를 정함 · 가장 새 판 표시
 *   ⑤ 판본마다 책 정보를 한 번만 모음(ed_info — 우리 도서 기록 prd_books에 이미 있으면 '중복'만 표시하고 줄인 칸만)
 *   ⑥ 다시 보기(14~30일마다 · 새책 상태가 구판절판으로 바뀌면 바로) → 새 판이 새로 나왔으면 📓 작업판 카드 + 알림(하루 한 번 모아서)
 *   ⑦ 스스로 고침 — 알라딘이 이은 판본 짝(정답에 가까움)과 지은이·원제가 다 다른 검색 후보(분명히 다른 책)로 받아들임 문턱을 매일 다시 맞춤 · 링크 짝 대칭·출간일 차례 어긋남을 자기 점수로 · 모르는 화면 꼴은 ed_probe에 남김
 *  남기는 곳: ed_work/{판본 묶음} · ed_book/{ISBN13}(웹앱 상품 상세 '📚 판본' 칸이 이것 하나로 묶음을 찾음) · ed_info/{ISBN13|i상품번호} · ed_ledger/{회차}(덧붙이기만) · app_settings/ed_study(연구 페이지)
 *  지키는 것: 관찰·기록만 — 값·등록·돈을 바꾸지 않음(제33조 무손해) · 알라딘은 클라우드 공개 화면만(로거·사무실 PC에 일 없음 · 제5조) · 사람처럼 쉬엄쉬엄(화면 사이 2.5~6초 · 하루 상한 · 막히면 쉼)
 *          사람이 넣은 설정(app_settings/ed_cfg)은 읽기만 · 지우지 않음(묶음이 바뀌면 hist에 남김) · 손님 정보 없음 */
'use strict';
const ED_V = '0.1.1';
const ED_DEF = {
  on: true, tickMs: 95e3, dayCap: 600, gapMin: 2500, gapMax: 6000, // 근거: 없음(설정 app_settings/ed_cfg로 바꿈) — 하루 600쪽 · 화면 사이 2.5~6초(bookinfo 알라딘 간격과 비슷)
  maxEds: 24, maxLinkHops: 14, searchTop: 6, accept: 0.72, maybe: 0.52, // 받아들임 문턱 0.72 · 후보 0.52(첫 값 — 매일 스스로 맞춤 edTune)
  recheckOop: 14, recheckNewer: 30, recheckOn: 30, avs: 'GJP', // 다시 보기 날 · 대상 새책 상태(G 구판절판 · J 절판 · P 품절 · S 판매중을 넣으면 모두)
  notify: true, push: true, infoReuseDays: 30, nl: true,
};
const EDKW = /(개정|신판|구판|최신\s*판|이전\s*판|초판|증보|판본|새\s*버전|새\s*판|리커버|특별판|보급판|합본|양장|다른\s*판|기념판|완역판|결정판|\d+\s*판)/;
const NEWER = /(개정판|신판|최신|새\s*버전|새\s*판|새\s*상품|개정\s*증보)/;
const OLDER = /(구판|이전\s*판|초판|옛\s*판)/;

/* ── 글 다듬기 ── */
const nz = (x) => (x == null || x === '' ? null : x);
const norm = (s) => String(s || '').toLowerCase().normalize('NFKC').replace(/[\s\p{P}\p{S}]/gu, '');
const LABEL_RE = /(최신\s*)?(전면\s*)?(개정\s*증보|개정\s*\d*\s*판|개정판|증보판|증보|신판|\d+\s*주년\s*(기념|특별)\s*(판|에디션)?|리커버(\s*에디션|\s*특별판)?|특별판|한정판|기념판|보급판|양장(본|판)?|반양장|합본(판)?|완역판|결정판|무삭제판|큰\s*글(자|씨)\s*(책|판)?|포켓\s*(판|북)|미니\s*북|제?\s*\d+\s*판|\d+(st|nd|rd|th)\s*ed(ition)?\.?|revised\s*edition|new\s*edition|ed\.\s*\d+)/i;
function edLabel(title, sub) { const s = `${title || ''} ${sub || ''}`; const m = s.match(LABEL_RE); if (!m) return null; const t = m[0].replace(/\s+/g, ' ').trim(); const n = (t.match(/(\d+)\s*(판|st|nd|rd|th)/i) || [])[1]; return { t: t.slice(0, 24), n: n ? +n : /개정|revised|new/i.test(t) ? 2 : null }; }
function edVol(title) { const s = String(title || ''); const m = s.match(/(\d+)\s*(권|부|편|집)\s*$/) || s.match(/\s(\d+)\s*$/) || s.match(/[\s(]([상중하])[)\s]*$/) || s.match(/\b(vol\.?|volume)\s*(\d+)/i); if (!m) return null; return String(m[2] && /\d/.test(m[2]) ? m[2] : m[1]); }
function edCore(title) { let s = String(title || ''); s = s.replace(/[[(（【〈<][^\])）】〉>]*[\])）】〉>]/g, (x) => (EDKW.test(x) || /세트|전\s*\d+\s*권|에디션|edition|특장|한정|굿즈|양장|무선|반양장|큰글|전자책|ebook|오디오북/i.test(x) ? ' ' : x));
  s = s.split(/\s[-–—:]\s|\s?[:：]\s?/)[0]; s = s.replace(LABEL_RE, ' ').replace(/(\d+)\s*(권|부|편|집)\s*$/, ' '); return norm(s) || norm(title); }
function bigr(s) { const o = new Map(); for (let i = 0; i < s.length - 1; i++) { const g = s.slice(i, i + 2); o.set(g, (o.get(g) || 0) + 1); } return o; }
function dice(a, b) { a = String(a || ''); b = String(b || ''); if (!a || !b) return 0; if (a === b) return 1; if (a.length < 2 || b.length < 2) return a === b ? 1 : 0; const A = bigr(a), B = bigr(b); let x = 0, n = 0; for (const [g, c] of A) { n += c; if (B.has(g)) x += Math.min(c, B.get(g)); } for (const c of B.values()) n += c; return (2 * x) / n; }
const nameN = (s) => norm(String(s || '').replace(/\(.*?\)/g, ''));
function nameOv(A, B) { A = (A || []).map(nameN).filter((x) => x.length >= 2); B = (B || []).map(nameN).filter((x) => x.length >= 2); if (!A.length || !B.length) return null; let k = 0; for (const a of A) if (B.some((b) => a === b || (a.length >= 3 && b.includes(a)) || (b.length >= 3 && a.includes(b)))) k++; return k / Math.min(A.length, B.length); }
const origN = (s) => norm(String(s || '').replace(/^\s*(the|a|an)\s+/i, '').replace(/\(.*?\)/g, ''));
function pubSame(a, b) { if (a.pubId && b.pubId && String(a.pubId) === String(b.pubId)) return true; const x = norm(a.publisher), y = norm(b.publisher); if (!x || !y) return null; return x === y || (x.length >= 2 && y.includes(x)) || (y.length >= 2 && x.includes(y)); }
const isForeign = (f) => /^외국도서/.test(String(f.cat || '')) || /외국도서/.test(String(f.cat || '').slice(0, 8));
const isFormat = (f) => /전자책|eBook|오디오북|e-?book/i.test(`${f.cat || ''} ${f.form || ''}`) || /\[(전자책|eBook|오디오북)\]/.test(f.title || '');
const isSet = (f) => /세트|전\s*\d+\s*권|박스\s*세트|\bset\b/i.test(`${f.title || ''}`);
const ymd = (d) => { const m = String(d || '').match(/(\d{4})\D{0,3}(\d{1,2})?\D{0,3}(\d{1,2})?/); if (!m) return null; return `${m[1]}-${String(m[2] || '01').padStart(2, '0')}-${String(m[3] || '01').padStart(2, '0')}`; };

/* ── 같은 책인가(a = 기준 · b = 후보) → { s 점수 0~1, kind, why[] } ──
 *  kind: self(같은 상품) · edition(판본) · trans(같은 원서의 다른 번역본) · orig(원서) · format(전자책 등 모양만 다름) · vol(다른 권) · set(세트) · diff(다른 책) */
function edSame(a, b, ev, o) { o = { accept: ED_DEF.accept, ...(o || {}) }; const why = []; ev = ev || {};
  if (a.isbn && b.isbn && a.isbn === b.isbn) return { s: 1, kind: 'self', why: ['ISBN 같음'] };
  if (a.iid && b.iid && String(a.iid) === String(b.iid)) return { s: 1, kind: 'self', why: ['상품 번호 같음'] };
  const t = dice(edCore(a.title), edCore(b.title)); const au = nameOv(a.authors, b.authors); const tr = nameOv(a.translators, b.translators);
  const oa = origN(a.orig), ob = origN(b.orig); const og = oa && ob ? (oa === ob || dice(oa, ob) >= 0.9 ? 1 : 0) : null; const ps = pubSame(a, b);
  const pa = +a.pages || 0, pb = +b.pages || 0; const pr = pa && pb ? Math.min(pa, pb) / Math.max(pa, pb) : null;
  let s = 0.45 * t + 0.3 * (au == null ? 0.5 : au); why.push(`제목 ${t.toFixed(2)}`); if (au != null) why.push(`지은이 ${au.toFixed(2)}`); else why.push('지은이 모름');
  if (og === 1) { s += 0.2; why.push('원제 같음'); } else if (og === 0) { s -= 0.25; why.push('원제 다름'); }
  if (ps) { s += 0.1; why.push('출판사 같음'); } if (tr != null && tr > 0) { s += 0.05; why.push('옮긴이 같음'); }
  if (pr != null) { if (pr >= 0.75) { s += 0.05; why.push('쪽수 비슷'); } else if (pr < 0.5) { s -= 0.1; why.push(`쪽수 ${pa}↔${pb}`); } }
  if (ev.link) { s += 0.25; why.push('알라딘이 판본으로 이음'); }
  s = Math.max(0, Math.min(1, s));
  const va = edVol(a.title), vb = edVol(b.title); if (va && vb && va !== vb && t >= 0.6) return { s: Math.min(s, 0.3), kind: 'vol', why: [...why, `권 다름 ${va}↔${vb}`] };
  if (isSet(b) !== isSet(a)) return { s: Math.min(s, 0.3), kind: 'set', why: [...why, '세트·낱권 다름'] };
  if (isFormat(b) && !isFormat(a)) return { s, kind: t >= 0.8 && au !== 0 ? 'format' : 'diff', why: [...why, '전자책·오디오북'] };
  if (isForeign(b) && !isForeign(a)) { const hit = og === 1 || (oa && norm(b.title) && dice(oa, norm(b.title)) >= 0.85); return { s: hit ? 0.9 : Math.min(s, 0.3), kind: hit ? 'orig' : 'diff', why: [...why, '외국도서(원서 후보)'] }; }
  if (au === 0 && og !== 1 && !ev.link) return { s: Math.min(s, 0.4), kind: 'diff', why: [...why, '지은이 겹침 없음'] };
  if (t < 0.5 && og !== 1 && !ev.link) return { s: Math.min(s, 0.45), kind: 'diff', why: [...why, '제목이 많이 다름'] };
  if (s < o.accept) return { s, kind: 'diff', why };
  if (a.translators && a.translators.length && b.translators && b.translators.length && tr === 0 && !ps) return { s, kind: 'trans', why: [...why, '옮긴이·출판사 다름 → 다른 번역본'] };
  return { s, kind: 'edition', why };
}

/* ── 상품 화면에서 다른 판본 링크 고르기(pg = 화면 안 함수가 돌려준 것) → [{ iid, dir newer|older|other, how, why }] ── */
function edLinks(pg) { if (!pg || !pg.f) return []; const self = String(pg.f.iid || ''); const seg = Object.values(pg.segs || {}).join(' '); const out = new Map();
  for (const a of pg.anchors || []) { const iid = String(a.iid || ''); if (!iid || iid === self) continue; const inSeg = seg.includes('ItemId=' + iid); const ctx = `${a.ctx || ''} ${a.a || ''}`;
    if (!(inSeg || a.so || EDKW.test(ctx))) continue; if (/(전자책|eBook|오디오북|중고|굿즈|사은품|이벤트|함께\s*(산|구매)|같이\s*보|이\s*분야|베스트|신간)/.test(a.a || '') && !inSeg) continue;
    const how = inSeg ? 'sec' : a.so ? 'soldout' : 'ctx'; const dir = /의\s*개정판입니다|구판|이전\s*판|초판/.test(ctx) ? 'older' : NEWER.test(ctx) ? 'newer' : 'other'; /* (0.1.1) 알라딘 실제 꼴(11/14 진단): 옛 판 화면 '개정판이 새로 출간되었습니다. [개정판 보기]' · 새 판 화면 '<옛 제목>의 개정판입니다. [구판 종이책 보기]' — 한 걸음씩만 이음 */
    if (how === 'ctx' && !/(개정|구판|신판|판본|이전\s*판|최신\s*판|초판|증보)/.test(ctx)) continue; /* 둘레 글만으로는 판 낱말이 분명할 때만 */
    if (!out.has(iid)) out.set(iid, { iid, dir, how, why: String(ctx).replace(/\s+/g, ' ').trim().slice(0, 90) }); }
  return [...out.values()].slice(0, 20); }

/* ── 검색 결과 한 줄 글(지은이·옮긴이 | 출판사 | 날짜) 풀기 ── */
function edLine(line) { const s = String(line || '').replace(/\s+/g, ' ').trim(); const P = s.split('|').map((x) => x.trim()); const au = [], tr = []; let pub = null, date = null;
  for (const part of P) { if (!date && /\d{4}\s*년(\s*\d{1,2}\s*월)?/.test(part) && part.length < 20) { date = ymd(part.replace(/년|월|일/g, '-')); continue; } if (/\((지은이|옮긴이|엮은이|글|그림|저|역|편|감수|번역)[^)]*\)/.test(part)) { for (const m of part.matchAll(/([^,()]+?)\s*\(([^)]+)\)/g)) { const nm = m[1].replace(/^\s*(외|,)\s*/, '').trim(); const r = m[2]; if (!nm) continue; if (/옮긴이|역|번역/.test(r)) tr.push(nm); else if (/지은이|저|글|엮은이|편/.test(r)) au.push(nm); } continue; } if (!pub && part && part.length <= 30 && !/정가|판매가|원\b|%|할인|포인트/.test(part)) pub = part; }
  return { authors: au.slice(0, 6), translators: tr.slice(0, 4), publisher: pub, pubDate: date }; }

/* ── 묶음 세우기: 확정된 판본을 출간일 차례로 · 우리 것과 견줌 ── */
function edOrder(eds, ourKeys) { const ours = new Set(ourKeys || []); const L = eds.slice().sort((x, y) => String(x.d || '9999').localeCompare(String(y.d || '9999')) || (+x.lbn || 0) - (+y.lbn || 0) || String(x.k).localeCompare(String(y.k)));
  const od = L.filter((x) => ours.has(x.k)).map((x) => x.d).filter(Boolean).sort(); const ref = od[od.length - 1] || null; /* 우리 것이 여럿이면 가장 새 것을 기준 */
  L.forEach((x, i) => { x.rank = i + 1; x.ours = ours.has(x.k) || undefined; x.rel = x.ours ? 'ours' : !ref || !x.d ? 'unk' : x.d < ref ? 'older' : x.d > ref ? 'newer' : 'same'; });
  const dated = L.filter((x) => x.d); const latest = dated.length ? dated[dated.length - 1].k : null; L.forEach((x) => { if (x.k === latest) x.latest = true; else delete x.latest; Object.keys(x).forEach((k) => x[k] === undefined && delete x[k]); }); return { list: L, ref, latest }; }

/* ── 스스로 맞춤: 알라딘이 이은 짝(+) · 지은이·원제가 다 다른 후보(−)로 문턱을 다시 셈(F1 가장 큰 곳 · 0.6~0.9 안 · 표본 적으면 그대로) ── */
function edTune(pos, neg, cur) { cur = +cur || ED_DEF.accept; if (pos.length < 20 || neg.length < 20) return { th: cur, n: [pos.length, neg.length], why: '표본 모자람(+20·−20 필요)' }; let best = { f: -1, th: cur };
  for (let th = 0.6; th <= 0.9001; th += 0.02) { const tp = pos.filter((s) => s >= th).length, fp = neg.filter((s) => s >= th).length; const fn = pos.length - tp; const p = tp + fp ? tp / (tp + fp) : 0, r = tp / pos.length; const f = p + r ? (2 * p * r) / (p + r) : 0; if (f > best.f + 1e-9 || (Math.abs(f - best.f) < 1e-9 && Math.abs(th - cur) < Math.abs(best.th - cur))) best = { f, th: Math.round(th * 100) / 100, p, r }; }
  const th = Math.abs(best.th - cur) < 0.015 ? cur : Math.round((cur + Math.max(-0.04, Math.min(0.04, best.th - cur))) * 100) / 100; /* 한 회차에 0.04까지만 옮김 */
  return { th, best: best.th, f1: Math.round(best.f * 1000) / 1000, p: Math.round((best.p || 0) * 1000) / 1000, r: Math.round((best.r || 0) * 1000) / 1000, n: [pos.length, neg.length], why: th === cur ? '그대로' : `F1 가장 큰 문턱 ${best.th} 쪽으로` }; }

/* ── 채점: 정답 표본(ed_truth: { our, same:[ISBN…], diff:[ISBN…] })과 엔진 묶음 견줌 → 정밀도·재현율 ── */
function edScore(truth, workOf) { let tp = 0, fp = 0, fn = 0, n = 0; for (const t of truth || []) { const w = workOf(t.our); if (!w) continue; n++; const got = new Set((w.eds || []).filter((e) => e.kind === 'edition' && e.isbn && e.isbn !== t.our).map((e) => e.isbn)); const S = new Set(t.same || []); for (const x of got) if (S.has(x)) tp++; else if ((t.diff || []).includes(x)) fp++; for (const x of S) if (!got.has(x)) fn++; }
  const p = tp + fp ? tp / (tp + fp) : null, r = tp + fn ? tp / (tp + fn) : null; return { n, tp, fp, fn, p: p == null ? null : Math.round(p * 1000) / 1000, r: r == null ? null : Math.round(r * 1000) / 1000 }; }

/* ── 자기 점검: 알라딘 링크 짝 대칭(A→B면 B→A) · 링크 방향과 출간일 차례가 맞나 ── */
function edSelfCheck(eds) { let sym = 0, pairs = 0, dirOk = 0, dirN = 0; const by = new Map(eds.filter((e) => e.iid).map((e) => [String(e.iid), e]));
  for (const e of eds) for (const l of e.lk || []) { const t = by.get(String(l.iid)); if (!t) continue; pairs++; if ((t.lk || []).some((x) => String(x.iid) === String(e.iid))) sym++; if (l.dir !== 'other' && e.d && t.d && e.d !== t.d) { dirN++; if ((l.dir === 'newer') === (t.d > e.d)) dirOk++; } }
  return { pairs, sym, dirN, dirOk }; }

/* ── 화면 안 함수(브라우저 · 클라우드 알라딘 화면 안에서 돎 — 바깥 변수 못 씀) ── */
function IN_PAGE_PRODUCT(o) { return (async () => { const P = window.ReadnowProducts; if (!P || !P.parseProductPage) return { err: '상품 공용 파일이 없음' };
  const u = o.iid ? '/shop/wproduct.aspx?ItemId=' + o.iid : '/shop/wproduct.aspx?ISBN=' + o.isbn; let r; try { r = await fetch(u, { credentials: 'omit', cache: 'no-store' }); } catch (e) { return { err: '받기 실패 ' + String(e.message || e).slice(0, 80) }; }
  if (/\/login\/|wlogin|adult/i.test(r.url)) return { gate: 1 }; if (r.status === 429 || r.status === 403 || r.status >= 500) return { block: r.status }; const h = await r.text(); const ms = 0;
  if (/비정상적인\s*접근|접근이\s*(제한|차단)|captcha|자동\s*입력\s*방지/i.test(h.slice(0, 30000)) && !/Ere_prod_titlewrap/.test(h)) return { block: 'page' };
  const d = new DOMParser().parseFromString(h, 'text/html'); const x = P.parseProductPage(d, r.url) || {}; if (!x.aladinItemId) return { none: 1, st: r.status, len: h.length };
  const T = (e) => (e ? String(e.textContent || '').replace(/\s+/g, ' ').trim() : '');
  const segs = {}; for (const [k, nm] of [['renew', '개정판 안내 레이어'], ['oldnew', '구판,개정판 정보'], ['soldout', '품절, 절판 정보']]) { const i = h.indexOf(nm); if (i < 0) continue; const s0 = h.indexOf('-->', i); const j = h.indexOf('<!--', s0 + 3); const s = h.slice(s0 + 3, j > 0 ? Math.min(j, s0 + 9000) : s0 + 9000); if (/<a\b|<div\b|<li\b/i.test(s)) segs[k] = s.slice(0, 6000); }
  const KW = /(개정|신판|구판|최신\s*판|이전\s*판|초판|증보|판본|새\s*버전|새\s*판|리커버|특별판|보급판|합본|양장|다른\s*판|기념판|완역판|결정판|\d+\s*판)/;
  const anchors = []; for (const a of d.querySelectorAll('a[href*="ItemId="], a[href*="itemid="]')) { const m = (a.getAttribute('href') || '').match(/wproduct\.aspx\?ItemId=(\d{5,})/i); if (!m) continue; const so = !!a.closest('.Ere_soldout_info, #topbtn_soldout_layer, .Ere_msg_box'); const blk = a.closest('li, dd, td, p, div'); const ctx = T(blk).slice(0, 240); const at = T(a).slice(0, 120); if (!(so || KW.test(ctx) || KW.test(at) || segs.renew || segs.oldnew)) continue; anchors.push({ iid: m[1], a: at, ctx, so: so || undefined }); if (anchors.length >= 80) break; }
  let kw = null; if (o.probe) { kw = []; const hs = h.replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' '); const re = /(개정판|구판|신판|판본|이전\s*판|최신\s*판)/g; let mm; while ((mm = re.exec(hs)) && kw.length < 14) { kw.push(hs.slice(Math.max(0, mm.index - 260), mm.index + 260).replace(/\s+/g, ' ')); re.lastIndex = mm.index + 260; } }
  const C = x.contributors || []; const tr = C.filter((c) => /옮김|옮긴이|역자|번역|^역$/.test(c.role || '')).map((c) => c.name); const au = C.filter((c) => !/옮김|옮긴이|역자|번역|^역$|그림|사진|감수|해설/.test(c.role || '')).map((c) => c.name);
  const cat = ((x.categories || [])[0] || { path: [] }).path.join('>'); const form = (x.basicExtra || []).join(' ').slice(0, 80);
  const f = { iid: String(x.aladinItemId), isbn: /^97[89]\d{10}$/.test(String(x.isbn13 || '')) ? String(x.isbn13) : null, title: x.title || null, sub: x.subtitle || null, series: x.series || null, authors: au.slice(0, 6), translators: tr.slice(0, 4), roles: C.slice(0, 8).map((c) => `${c.name}${c.role ? '(' + c.role + ')' : ''}`), publisher: x.publisher || null, pubId: x.aladinPublisherId || null, pubDate: x.pubDate || null, orig: x.originalTitle || null, pages: x.pages || null, size: x.size || null, weightG: x.weightG || null, priceList: x.priceList || null, priceSales: x.priceSales || null, sp: x.salesPoint ?? null, av: x.availability || null, avNote: x.availabilityNote ? String(x.availabilityNote).slice(0, 160) : null, soldAt: x.soldoutCheckedAt || null, cat: cat.slice(0, 160), form, cover: (x.images || {}).front || null, rating: x.rating ?? null, reviews: x.reviewCount ?? null };
  return { f, anchors, segs: o.probe ? segs : Object.fromEntries(Object.entries(segs).map(([k, v]) => [k, (v.match(/ItemId=\d+/gi) || []).join(' ')])), kw, len: h.length, ms }; })(); }
function IN_PAGE_SEARCH(q) { return (async () => { let r; try { r = await fetch('/search/wsearchresult.aspx?SearchTarget=Book&SearchWord=' + encodeURIComponent(q) + '&ViewRowCount=25', { credentials: 'omit', cache: 'no-store' }); } catch (e) { return { err: String(e.message || e).slice(0, 80) }; }
  if (/\/login\/|wlogin/i.test(r.url)) return { gate: 1 }; if (r.status === 429 || r.status === 403 || r.status >= 500) return { block: r.status }; const h = await r.text(); const d = new DOMParser().parseFromString(h, 'text/html'); const T = (e) => (e ? String(e.textContent || '').replace(/\s+/g, ' ').trim() : '');
  const L = []; for (const b of d.querySelectorAll('.ss_book_box')) { const a = b.querySelector('a.bo3'); const id = b.getAttribute('itemid') || (((a && a.getAttribute('href')) || '').match(/ItemId=(\d+)/i) || [])[1]; if (!id || !a) continue; const bt = T(b); if (/\[중고\]/.test(bt.slice(0, 40))) continue; const li = [...b.querySelectorAll('li')].map(T).find((t) => /\|/.test(t) && /(\(지은이\)|\(옮긴이\)|\d{4}\s*년)/.test(t)) || ''; L.push({ iid: String(id), title: T(a).slice(0, 140), line: li.slice(0, 240), kind: (bt.match(/^\s*\[([^\]]{1,8})\]/) || [])[1] || null, ebook: /\[전자책\]|eBook/.test(bt.slice(0, 60)) || undefined }); if (L.length >= 25) break; }
  return { L, n: L.length }; })(); }

/* ══ 엔진 ══ ctx = { db, C, FV, W, log, nowIso, getPage, extKeys, notes, push, pulse, found } */
function makeEdition(ctx) { const { C, log } = ctx; const nowIso = ctx.nowIso || (() => new Date().toISOString()); const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); const kDay = (t) => new Date((t || Date.now()) + 9 * 3600e3).toISOString().slice(0, 10);
  const ST = { day: null, used: 0, pauseUntil: 0, last: 0, busy: false, cfg: null, cfgAt: 0, tg: null, tgAt: 0, cur: 0, errs: [], tick: null, newEd: [], blocks: 0 };
  const clean = (v) => JSON.parse(JSON.stringify(v, (k, x) => (x === undefined || (typeof x === 'number' && !Number.isFinite(x)) ? null : x)));
  async function cfg() { if (ST.cfg && Date.now() - ST.cfgAt < 10 * 60e3) return ST.cfg; let c = {}; try { const d = await C('app_settings').doc('ed_cfg').get(); c = d.exists ? d.data() || {} : {}; } catch (e) {} let st = {}; try { const d = await C('app_settings').doc('ed_study').get(); st = d.exists ? d.data() || {} : {}; } catch (e) {}
    ST.cfg = { ...ED_DEF, ...c, accept: +c.accept || +(st.tune && st.tune.th) || ED_DEF.accept }; ST.cfgAt = Date.now(); if (!ST.day && st.today && st.today.day === kDay()) { ST.day = st.today.day; ST.used = +st.today.pages || 0; } return ST.cfg; }
  function dayRoll() { const d = kDay(); if (ST.day !== d) { ST.day = d; ST.used = 0; ST.blocks = 0; } }
  async function pace() { const c = ST.cfg || ED_DEF; dayRoll(); if (ST.pauseUntil > Date.now()) throw Object.assign(new Error('쉬는 중'), { pause: 1 }); if (ST.used >= c.dayCap) throw Object.assign(new Error('오늘 상한'), { cap: 1 }); const gap = c.gapMin + Math.random() * (c.gapMax - c.gapMin); const w = ST.last + gap - Date.now(); if (w > 0) await sleep(w); ST.last = Date.now(); ST.used++; }
  function blocked(why) { ST.blocks++; ST.pauseUntil = Date.now() + Math.min(6, ST.blocks) * 30 * 60e3; ST.errs.unshift({ at: nowIso(), why: '알라딘이 막음 — ' + why + ` · ${Math.min(6, ST.blocks) * 30}분 쉼` }); ST.errs.length = Math.min(ST.errs.length, 20); }
  async function product(o) { await pace(); const p = await ctx.getPage(); const r = await p.evaluate(IN_PAGE_PRODUCT, o); if (r && r.block) { blocked(String(r.block)); throw Object.assign(new Error('막힘 ' + r.block), { pause: 1 }); } return r; }
  async function search(q) { await pace(); const p = await ctx.getPage(); const r = await p.evaluate(IN_PAGE_SEARCH, q); if (r && r.block) { blocked(String(r.block)); throw Object.assign(new Error('막힘 ' + r.block), { pause: 1 }); } return r && r.L ? r.L : []; }
  async function nlSearch(title) { const c = ST.cfg || ED_DEF; if (!c.nl || !ctx.extKeys) return []; let k = null; try { k = (await ctx.extKeys()).nlKey; } catch (e) {} if (!k) return []; try { const u = `https://www.nl.go.kr/seoji/SearchApi.do?cert_key=${encodeURIComponent(k)}&result_style=json&page_no=1&page_size=30&title=${encodeURIComponent(title)}`; const r = await fetch(u, { signal: AbortSignal.timeout(15000) }); if (!r.ok) return []; const j = await r.json(); return (j.docs || []).map((d) => ({ isbn: /^97[89]\d{10}$/.test(String(d.EA_ISBN || '')) ? String(d.EA_ISBN) : null, title: [d.TITLE, d.VOL].filter(Boolean).join(' ').slice(0, 140), authors: String(d.AUTHOR || '').split(/[;,]/).map((s) => s.replace(/(지음|지은이|저|글|옮김|역|번역|편|엮음|그림)\s*$/g, '').replace(/^.*:\s*/, '').trim()).filter((s) => s.length >= 2).slice(0, 6), translators: (String(d.AUTHOR || '').match(/([^;,:]+?)\s*(옮김|역|번역)/g) || []).map((s) => s.replace(/(옮김|역|번역)$/, '').trim()).slice(0, 4), publisher: d.PUBLISHER || null, pubDate: ymd(d.REAL_PUBLISH_DATE || d.PUBLISH_PREDATE), pages: parseInt(String(d.PAGE || '').replace(/\D/g, ''), 10) || null, edStmt: d.EDITION_STMT || null, form: [d.FORM, d.EBOOK_YN === 'Y' ? '전자책' : ''].filter(Boolean).join(' ') })).filter((x) => x.isbn); } catch (e) { return []; } }

  /* 대상: 우리 판매 중 상품(ISBN 있음) × 새책 상태(G 구판절판 · J 절판 · P 품절 · 설정 avs) — 6시간마다 다시 셈 · 새책 상태가 구판절판으로 바뀐 책(avHist 끝이 G)은 맨 앞 */
  async function targets() { if (ST.tg && Date.now() - ST.tgAt < 6 * 3600e3) return ST.tg; const c = ST.cfg || ED_DEF; const byBid = new Map(); (await C('prd_listings').where('active', '==', true).select('isbn13', 'bookId', 'title', 'priceList').get()).forEach((d) => { const v = d.data() || {}; const i = String(v.isbn13 || ''); if (!/^97[89]\d{10}$/.test(i) || !v.bookId) return; if (!byBid.has(String(v.bookId))) byBid.set(String(v.bookId), { isbn: i, bid: String(v.bookId), t: String(v.title || '').slice(0, 60), lp: +v.priceList || 0 }); });
    const L = []; const ids = [...byBid.keys()]; const avC = (a) => { a = String(a || ''); if (!a) return null; if (a === 'onSale') return 'S'; if (/^(구판|합본)절판/.test(a)) return 'G'; if (/일시품절/.test(a)) return 'T'; if (/^절판/.test(a)) return 'J'; if (/품절/.test(a)) return 'P'; return 'X'; };
    for (let i = 0; i < ids.length; i += 300) { const got = await ctx.db.getAll(...ids.slice(i, i + 300).map((x) => C('prd_book_metrics').doc(x)), { fieldMask: ['availability', 'avHist'] }); got.forEach((g) => { if (!g.exists) return; const v = g.data() || {}; const a = avC(v.availability); if (!a || !String(c.avs || 'GJP').includes(a)) return; const t = byBid.get(g.id); const h = Array.isArray(v.avHist) ? v.avHist : []; const lastH = String(h[h.length - 1] || ''); t.av = a; t.hot = /G$/.test(lastH) && /^\d{8}/.test(lastH) ? lastH.slice(0, 8) : null; L.push(t); }); }
    L.sort((x, y) => (y.hot ? 1 : 0) - (x.hot ? 1 : 0) || String(y.hot || '').localeCompare(String(x.hot || '')) || (x.av === 'G' ? 0 : 1) - (y.av === 'G' ? 0 : 1) || y.lp - x.lp || x.isbn.localeCompare(y.isbn));
    ST.tg = L; ST.tgAt = Date.now(); ST.cur = 0; return L; }

  async function infoOf(key) { try { const d = await C('ed_info').doc(key).get(); return d.exists ? d.data() : null; } catch (e) { return null; } }
  const keyOf = (f) => (f.isbn ? f.isbn : 'i' + f.iid);
  const slim = (f) => ({ k: keyOf(f), iid: f.iid || null, isbn: f.isbn || null, t: String(f.title || '').slice(0, 100), sub: f.sub ? String(f.sub).slice(0, 80) : null, au: (f.authors || []).slice(0, 3).join(', ') || null, tr: (f.translators || []).slice(0, 2).join(', ') || null, pb: f.publisher || null, d: ymd(f.pubDate), lb: (edLabel(f.title, f.sub) || {}).t || f.edStmt || null, lbn: (edLabel(f.title, f.sub) || {}).n || null, av: f.av || null, lp: f.priceList || null, pg: f.pages || null, cov: f.cover || null });

  /* 책 한 권: 우리 화면 → 링크 따라가기 → 검색 → 같은 책 다시 보기 → 차례 → 남기기 · dry = 남기지 않음(진단) */
  async function runBook(t, o) { o = o || {}; const c = ST.cfg || (await cfg()); const T0 = Date.now(); const out = { isbn: t.isbn, pages: 0, links: 0, cands: 0, nl: 0, why: [] }; const F = new Map(); /* key → { f, lk, src:Set, ev } */ const tried = new Set(); const pool = [];
    const fetchP = async (q) => { const k0 = q.iid ? 'i' + q.iid : q.isbn; if (tried.has(k0)) return null; tried.add(k0);
      if (!o.dry && !o.probe) { const old = await infoOf(q.isbn || 'i' + q.iid); if (old && old.f && old.at && Date.now() - Date.parse(old.at) < c.infoReuseDays * 864e5 && (old.lk || old.lk === null)) { out.reuse = (out.reuse || 0) + 1; return { f: old.f, lk: old.lk || [], reused: true }; } }
      const r = await product({ ...q, probe: !!o.probe }); out.pages++; if (!r || r.err || r.gate || r.none) { if (o.probe) out.why.push(`${k0}: ${r ? r.err || (r.gate ? '로그인·성인 화면' : '상품 없음') : '답 없음'}`); return null; } const lk = edLinks(r); if (o.probe && !out.probe) out.probe = { segs: r.segs, kw: r.kw, anchors: (r.anchors || []).slice(0, 30), len: r.len };
      if (!lk.length && (r.kw || []).length && o.probe) out.why.push('판 낱말은 있는데 링크를 못 고름 — 화면 꼴 확인'); if (!lk.length && Object.keys(r.segs || {}).some((k) => k !== 'soldout' && /ItemId/.test(r.segs[k]))) await probeSave(r, '판 칸에 링크가 있는데 못 고름'); return { f: r.f, lk }; };
    const me = await fetchP({ isbn: t.isbn }); if (!me) { out.err = '우리 책 상품 화면을 못 읽음'; return out; } const A = me.f; const mk = keyOf(A); F.set(mk, { f: A, lk: me.lk, src: new Set(['ours']), ev: { link: true } });
    /* ① 링크 따라가기(양쪽 끝까지) */ const Q = me.lk.map((l) => ({ ...l, from: mk })); let hops = 0;
    while (Q.length && hops < c.maxLinkHops && F.size < c.maxEds && Date.now() - T0 < (o.budgetMs || 80e3)) { const l = Q.shift(); if ([...F.values()].some((x) => String(x.f.iid) === String(l.iid))) continue; hops++; const r = await fetchP({ iid: l.iid }); if (!r) continue; out.links++; const v = edSame(A, r.f, { link: true }, { accept: c.accept }); const k = keyOf(r.f); if (v.kind === 'self') continue;
      if (F.has(k)) { F.get(k).src.add('link'); continue; } F.set(k, { f: r.f, lk: r.lk, src: new Set(['link']), ev: { link: true, dir: l.dir, how: l.how }, v }); if (v.kind === 'edition' || v.kind === 'trans') for (const x of r.lk) Q.push({ ...x, from: k }); }
    if (Q.some((l) => ![...F.values()].some((x) => String(x.f.iid) === String(l.iid)))) out.partial = 'link'; /* (0.1.1) 시간·걸음 상한으로 사슬 끝까지 못 감 → 곧 다시(이미 읽은 판본은 ed_info를 다시 써 쪽 수가 거의 안 듦) */
    /* ② 검색(제목 · 제목+지은이 · 원제) + 국립중앙도서관 */ const core = String(A.title || '').replace(/[[(（【][^\])）】]*[\])）】]/g, ' ').split(/\s[-–—:]\s|[:：]/)[0].replace(LABEL_RE, ' ').replace(/\s+/g, ' ').trim(); const au0 = (A.authors || [])[0] || '';
    const qs = [...new Set([core, au0 ? `${core} ${au0.replace(/\s+/g, ' ').split(' ').slice(-1)[0]}` : null, A.orig ? String(A.orig).replace(/\(.*?\)/g, '').trim() : null].filter((x) => x && x.length >= 2))].slice(0, 3);
    for (const q of qs) { if (Date.now() - T0 > (o.budgetMs || 80e3)) { out.partial = out.partial || 'search'; break; } let L = []; try { L = await search(q); out.pages++; } catch (e) { if (e.pause || e.cap) throw e; continue; } for (const x of L) { if (x.ebook) continue; const li = edLine(x.line); const g = { iid: x.iid, title: x.title, ...li }; const k = 'i' + x.iid; if ([...F.values()].some((y) => String(y.f.iid) === String(x.iid))) continue; const pre = edSame(A, { ...g, orig: null, pages: null }, {}, { accept: 0 }); pool.push({ g, pre: pre.s, q }); } }
    if (c.nl && core) { const N = await nlSearch(core); out.nl = N.length; for (const n of N) { if ([...F.values()].some((y) => y.f.isbn === n.isbn)) continue; const v = edSame(A, n, {}, { accept: c.accept }); if (v.kind === 'self') continue; if (v.s >= c.maybe) pool.push({ g: { ...n, iid: null }, pre: v.s, q: 'nl', nl: true }); } }
    pool.sort((x, y) => y.pre - x.pre); const seenI = new Set(); const top = pool.filter((x) => { const k = x.g.iid || x.g.isbn; if (seenI.has(k)) return false; seenI.add(k); return x.pre >= 0.35; }).slice(0, c.searchTop + 4); out.cands = top.length;
    for (const x of top) { if (Date.now() - T0 > (o.budgetMs || 80e3) || F.size >= c.maxEds) break; let r = null; if (x.g.iid) r = await fetchP({ iid: x.g.iid }); else if (x.g.isbn && !F.has(x.g.isbn)) r = (await fetchP({ isbn: x.g.isbn })) || { f: { ...x.g, iid: null, edStmt: x.g.edStmt }, lk: [], nlOnly: true }; if (!r) continue; const k = keyOf(r.f); if (F.has(k)) { F.get(k).src.add(x.nl ? 'nl' : 'search'); continue; } const v = edSame(A, r.f, {}, { accept: c.accept }); if (v.kind === 'self') continue; F.set(k, { f: r.f, lk: r.lk, src: new Set([x.nl ? 'nl' : 'search']), ev: {}, v, nlOnly: r.nlOnly });
      /* 검색으로 찾은 판본에 알라딘 판본 링크가 있으면 그것도 따라감(한 번 더) */ if (v.kind === 'edition') for (const l of r.lk) { if (F.size >= c.maxEds || Date.now() - T0 > (o.budgetMs || 80e3)) break; if ([...F.values()].some((y) => String(y.f.iid) === String(l.iid))) continue; const r2 = await fetchP({ iid: l.iid }); if (!r2) continue; const v2 = edSame(A, r2.f, { link: true }, { accept: c.accept }); const k2 = keyOf(r2.f); if (v2.kind !== 'self' && !F.has(k2)) F.set(k2, { f: r2.f, lk: r2.lk, src: new Set(['link']), ev: { link: true }, v: v2 }); } }
    /* ③ 묶음 세우기 */ const eds = [], maybe = [], other = []; const pos = [], neg = [];
    for (const [k, x] of F) { const v = k === mk ? { s: 1, kind: 'edition', why: ['우리 책'] } : x.v; const e = { ...slim(x.f), kind: v.kind, sc: Math.round(v.s * 100) / 100, src: [...x.src], why: (v.why || []).slice(0, 6).join(' · '), lk: (x.lk || []).slice(0, 8).map((l) => ({ iid: l.iid, dir: l.dir })), nl: x.nlOnly || undefined, f: x.f };
      if (k !== mk) { if (x.ev && x.ev.link) pos.push(edSame(A, x.f, {}, { accept: 0 }).s); else if (v.kind === 'diff' && /지은이 겹침 없음/.test(e.why) && !/원제 같음/.test(e.why)) neg.push(v.s); }
      if (v.kind === 'edition' || k === mk) eds.push(e); else if (v.kind === 'trans' || v.kind === 'orig' || v.kind === 'format') other.push(e); else if (v.s >= c.maybe && v.kind === 'diff') maybe.push(e); }
    /* 중복: 같은 ISBN 다른 상품 번호 · 같은 상품 번호 → 하나만(나머지는 dupOf) */ const byI = new Map(); for (const e of eds) { const kk = e.isbn || 'i' + e.iid; if (byI.has(kk)) { e.dupOf = byI.get(kk).k; } else byI.set(kk, e); }
    const ord = edOrder(eds.filter((e) => !e.dupOf), [mk]); out.eds = ord.list.length; out.newer = ord.list.filter((e) => e.rel === 'newer').length; out.older = ord.list.filter((e) => e.rel === 'older').length; out.trans = other.filter((e) => e.kind === 'trans').length; out.ms = Date.now() - T0; out.pos = pos; out.neg = neg; out.selfChk = edSelfCheck(eds);
    if (o.dry || o.probe) { out.list = ord.list.map(({ f, ...e }) => e); out.maybe = maybe.map(({ f, ...e }) => e); out.other = other.map(({ f, ...e }) => e); out.me = A; return out; }
    await save(t, A, mk, ord, maybe, other, eds.filter((e) => e.dupOf), out.partial); return out; }

  async function probeSave(r, why) { try { const id = `ed_${kDay().replace(/-/g, '')}_${String((r.f || {}).iid || 'x')}`; await C('ed_probe').doc(id).set(clean({ why, iid: (r.f || {}).iid || null, segs: r.segs || null, anchors: (r.anchors || []).slice(0, 20), at: nowIso(), v: ED_V })); } catch (e) {} }

  /* 남기기: 판본 정보 한 번만(우리 도서 기록에 있으면 중복 표시) · 묶음 · 책마다 가리킴 · 새 판 알림 거리 */
  async function save(t, A, mk, ord, maybe, other, dups, partial) { const c = ST.cfg || ED_DEF; const now = nowIso(); const all = [...ord.list, ...other];
    const isb = [...new Set(all.map((e) => e.isbn).filter(Boolean))]; const inBooks = new Map(); for (let i = 0; i < isb.length; i += 30) { try { (await C('prd_books').where('isbn13', 'in', isb.slice(i, i + 30)).select('isbn13').get()).forEach((d) => inBooks.set(String(d.data().isbn13), d.id)); } catch (e) {} }
    const wb = (await C('ed_book').doc(t.isbn).get().catch(() => null)); const wid = (wb && wb.exists && wb.data().w) || 'w' + t.isbn; const wref = C('ed_work').doc(wid); const prev = (await wref.get().catch(() => null)); const P = prev && prev.exists ? prev.data() : null;
    const B = ctx.db.batch(); let nInfo = 0, nDup = 0;
    for (const e of all) { const f = e.f || {}; const key = e.k; const bid = e.isbn ? inBooks.get(e.isbn) : null; const base = { k: key, iid: e.iid || null, isbn: e.isbn || null, w: wid, lk: e.lk || [], at: now, v: ED_V };
      if (bid) { nDup++; B.set(C('ed_info').doc(key), clean({ ...base, dupOf: 'prd_books/' + bid, f: { iid: f.iid, isbn: f.isbn, title: f.title, sub: f.sub, authors: f.authors, translators: f.translators, publisher: f.publisher, pubDate: f.pubDate, orig: f.orig, pages: f.pages, av: f.av } }), { merge: true }); }
      else { nInfo++; B.set(C('ed_info').doc(key), clean({ ...base, dupOf: null, f }), { merge: true }); } }
    const strip = (e) => { const { f, ...x } = e; return x; };
    const W0 = { v: ED_V, ours: [...new Set([...((P && P.ours) || []), t.isbn])], me: mk, eds: ord.list.map(strip), other: other.map(strip).slice(0, 12), maybe: maybe.map(strip).slice(0, 10), dups: dups.map((e) => ({ k: e.k, iid: e.iid || null, dupOf: e.dupOf })), latest: ord.latest, n: ord.list.length, newer: ord.list.filter((e) => e.rel === 'newer').length, older: ord.list.filter((e) => e.rel === 'older').length, checkedAt: now, firstAt: (P && P.firstAt) || now, runs: ((P && P.runs) || 0) + 1, av: t.av || null, th: c.accept };
    /* 새로 나타난 새 판(지난 회차 묶음에 없던 newer) — 첫 회차는 기준선(알림 안 함) */ const had = new Set(((P && P.eds) || []).map((e) => e.k)); const fresh = P && !P.partial ? W0.eds.filter((e) => e.rel === 'newer' && !had.has(e.k)) : []; /* 지난 회차가 사슬을 다 못 본 것(partial)이면 이어 본 것 — 새로 나온 판이 아님 */ const gone = P ? (P.eds || []).filter((e) => !W0.eds.some((x) => x.k === e.k)).map((e) => e.k) : [];
    W0.hist = [...(((P && P.hist) || []).slice(-19)), { at: now, add: P ? W0.eds.filter((e) => !had.has(e.k)).map((e) => e.k).slice(0, 10) : W0.eds.map((e) => e.k).slice(0, 10), gone: gone.slice(0, 10), base: !P || undefined }];
    const days = W0.newer ? c.recheckNewer : t.av && t.av !== 'S' ? c.recheckOop : c.recheckOn; W0.partial = partial || null; W0.nextAt = new Date(Date.now() + (partial ? 25 * 60e3 : days * 864e5)).toISOString();
    const act = new Set((ST.tg || []).map((x) => x.isbn)); B.set(wref, clean(W0)); for (const e of W0.eds) if (e.isbn) { const mine = !!e.ours || act.has(e.isbn); B.set(C('ed_book').doc(e.isbn), clean({ w: wid, rel: e.rel, ours: mine, newer: W0.newer, older: W0.older, n: W0.n, latest: W0.latest, at: now, ...(e.ours ? { nextAt: W0.nextAt } : {}) }), { merge: true }); }
    if (!W0.eds.some((e) => e.isbn === t.isbn)) B.set(C('ed_book').doc(t.isbn), clean({ w: wid, rel: 'ours', ours: true, newer: W0.newer, older: W0.older, n: W0.n, latest: W0.latest, at: now, nextAt: W0.nextAt }), { merge: true });
    await B.commit(); if (fresh.length) ST.newEd.push(...fresh.map((e) => ({ our: t.isbn, ourT: t.t || A.title, k: e.k, t: e.t, d: e.d, pb: e.pb, iid: e.iid }))); return { wid, nInfo, nDup, fresh: fresh.length }; }

  async function alertFlush() { const c = ST.cfg || ED_DEF; if (!ST.newEd.length || !c.notify) return null; const L = ST.newEd.splice(0); const today = kDay(); const body = L.slice(0, 30).map((x) => `- 우리 「${String(x.ourT || '').slice(0, 40)}」(${x.our}) → 새 판 「${String(x.t || '').slice(0, 40)}」 ${x.d || '날짜 모름'}${x.pb ? ' · ' + x.pb : ''}${x.iid ? ' · 알라딘 ' + x.iid : ''}`).join('\n');
    try { if (ctx.notes) await ctx.notes([{ op: 'merge', id: `ed_new_${today}`, data: { kind: 'card', cat: '연구', sub: '판본 추적', leaf: '📚 새 판본', imp: 2, title: `📚 새 판본 ${L.length}권 — 우리 상품의 새 판이 나옴(${today})`, body: body + '\n\n(📚 판본 추적 엔진이 다시 보기에서 찾음 · 상품 상세 「📚 판본」 칸에서 차례대로 볼 수 있음 · 값·등록은 바꾸지 않음)', src: 'engine:edition', state: 'open' } }], 'engine:edition'); } catch (e) {}
    let push = null; if (c.push && ctx.push) { try { const d = await C('app_settings').doc('ed_study').get(); const last = d.exists ? (d.data() || {}).pushDay : null; if (last !== today) { push = await ctx.push(null, { title: `📚 새 판본 ${L.length}권`, body: L.slice(0, 3).map((x) => String(x.ourT || '').slice(0, 20) + ' → ' + (x.d || '')).join(' · '), tag: 'rn-edition', url: './' }, 'edition'); await C('app_settings').doc('ed_study').set({ pushDay: today }, { merge: true }); } } catch (e) { push = { err: String(e.message || e).slice(0, 80) }; } }
    return { n: L.length, push }; }

  /* 한 회차(/daily 10분마다 · 95초 안) — 대상 차례대로 · 다시 볼 때가 안 된 책은 건너뜀 */
  async function tick(o) { o = o || {}; if (ST.busy) return { skip: 'busy' }; const c = await cfg(); if (!c.on && !o.force) return { skip: 'off' }; dayRoll(); if (ST.pauseUntil > Date.now() && !o.force) return { skip: 'pause', until: new Date(ST.pauseUntil).toISOString() }; if (ST.used >= c.dayCap && !o.force) return { skip: 'cap', used: ST.used };
    ST.busy = true; const T0 = Date.now(); const R = { at: nowIso(), books: [], pages0: ST.used, skipped: 0, errs: [] }; let tune = { pos: [], neg: [] };
    try { const L = o.isbn ? [{ isbn: o.isbn, t: '', av: null }] : await targets(); R.targets = L.length; let guard = 0;
      while (Date.now() - T0 < c.tickMs && guard++ < 200 && L.length) { if (!o.isbn && ST.cur >= L.length) { ST.cur = 0; ST.tgAt = 0; break; } const t = o.isbn ? L[0] : L[ST.cur++];
        if (!o.isbn) { const b = await C('ed_book').doc(t.isbn).get().catch(() => null); const v = b && b.exists ? b.data() : null; if (v && v.nextAt && Date.parse(v.nextAt) > Date.now() && !(t.hot && v.at && t.hot > v.at.slice(0, 10).replace(/-/g, '').slice(2) + '00')) { R.skipped++; continue; } }
        try { const r = await runBook(t, { budgetMs: Math.max(25e3, c.tickMs - (Date.now() - T0)) }); R.books.push({ isbn: t.isbn, eds: r.eds || 0, newer: r.newer || 0, older: r.older || 0, trans: r.trans || 0, pages: r.pages, links: r.links, cands: r.cands, err: r.err || null }); tune.pos.push(...(r.pos || [])); tune.neg.push(...(r.neg || [])); }
        catch (e) { R.errs.push(String(e.message || e).slice(0, 120)); if (e.pause || e.cap) break; }
        if (o.isbn) break; }
    } catch (e) { R.errs.push(String(e.message || e).slice(0, 160)); } finally { ST.busy = false; }
    R.pages = ST.used - R.pages0; R.ms = Date.now() - T0; const al = await alertFlush().catch(() => null); if (al) R.alert = al; ST.tick = R;
    try { await ledger(R, tune); } catch (e) { log('📚 판본 추적 장부 실패', e.message); } return R; }

  /* 장부 + 연구 요약(하루 셈 · 스스로 맞춤 · 채점 · 진화 기록) */
  async function ledger(R, tune) { const c = ST.cfg || ED_DEF; const today = kDay(); const ref = C('app_settings').doc('ed_study'); const S0 = ((await ref.get().catch(() => null)) || {}); const S = (S0.exists ? S0.data() : null) || {};
    const T = S.today && S.today.day === today ? S.today : { day: today, books: 0, eds: 0, newer: 0, older: 0, trans: 0, pages: 0, links: 0, withEd: 0, errs: 0 };
    for (const b of R.books) { T.books++; T.eds += b.eds; T.newer += b.newer; T.older += b.older; T.trans += b.trans; T.links += b.links || 0; if (b.eds > 1) T.withEd++; if (b.err) T.errs++; } T.pages = ST.used; T.errs += R.errs.length;
    const TP = { pos: [...((S.tunePool && S.tunePool.pos) || []), ...tune.pos].slice(-400), neg: [...((S.tunePool && S.tunePool.neg) || []), ...tune.neg].slice(-400) };
    if (R.books.length || R.errs.length) await C('ed_ledger').doc(new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16).replace(/[-:]/g, '').replace('T', '-')).set(clean({ at: R.at, saw: { targets: R.targets || 0, skipped: R.skipped }, did: R.books.slice(0, 20), pages: R.pages, ms: R.ms, errs: R.errs.slice(0, 6), alert: R.alert || null, th: c.accept, v: ED_V }));
    const upd = { v: ED_V, at: nowIso(), today: T, tunePool: TP, cfg: { dayCap: c.dayCap, accept: c.accept, maybe: c.maybe, avs: c.avs, on: c.on }, errs: ST.errs.slice(0, 10), pause: ST.pauseUntil > Date.now() ? new Date(ST.pauseUntil).toISOString() : null };
    if (S.dayDone !== today && new Date(Date.now() + 9 * 3600e3).getUTCHours() >= 22 || (S.dayDone !== today && S.today && S.today.day && S.today.day !== today)) { /* 하루 한 번(밤 10시 넘어 또는 날이 바뀐 첫 회차): 스스로 맞춤·채점·진화 기록 */
      const tn = edTune(TP.pos, TP.neg, c.accept); upd.tune = { ...tn, at: nowIso() }; const fixes = [...(S.fixes || [])]; if (tn.th !== c.accept) fixes.unshift({ d: today, t: `받아들임 문턱 ${c.accept} → ${tn.th} (${tn.why} · 링크 짝 ${tn.n[0]} · 분명히 다른 후보 ${tn.n[1]} · F1 ${tn.f1})` });
      const sc = await truthScore().catch(() => null); const day = S.today && S.today.day !== today ? S.today : T; const prevTrend = Array.isArray(S.trend) ? S.trend : []; const val = sc && sc.p != null && sc.r != null ? Math.round(((2 * sc.p * sc.r) / Math.max(1e-9, sc.p + sc.r)) * 1000) / 1000 : null;
      upd.score = sc; upd.trend = [...prevTrend.filter((x) => x.d !== day.day), { d: day.day, books: day.books, withEd: day.withEd, newer: day.newer, f1: val, th: tn.th }].slice(-90); upd.fixes = fixes.slice(0, 40); upd.dayDone = today;
      upd.stage = stageOf(sc, S.stage); if (ctx.pulse) { try { await ctx.pulse(clean({ day: today, studies: { N15: { at: Date.now(), metric: '판본 묶음 F1(정답 표본) · 없으면 하루 판본 찾은 책 수', value: val != null ? val : day.withEd, trend: upd.trend.map((x) => [x.d, x.f1 != null ? x.f1 : x.withEd]), changed: tn.th !== c.accept ? `문턱 ${c.accept}→${tn.th}` : '바뀐 문턱 없음', note: `📚 판본 추적(클라우드 · AI 없음) — 어제 ${day.books}권 · 판본 있음 ${day.withEd} · 새 판 ${day.newer} · 옛 판 ${day.older} · 다른 번역 ${day.trans}${sc && sc.n ? ` · 정답 표본 ${sc.n}권 정밀도 ${sc.p} 재현율 ${sc.r}` : ' · 정답 표본 아직 없음'}`, src: 'app_settings/ed_study' } } }), 'engine:edition'); } catch (e) {} } }
    await ref.set(clean(upd), { merge: true }); }
  function stageOf(sc, cur) { const s0 = cur && cur.n != null ? cur : { n: 1, at: nowIso(), why: '처음 — 그림자(셈만 · 상품 상세에 안내)' }; if (sc && sc.n >= 30 && sc.p >= 0.95 && sc.r >= 0.85 && s0.n < 2) return { n: 2, at: nowIso(), why: `정답 표본 ${sc.n}권 정밀도 ${sc.p}·재현율 ${sc.r} — 안내 단계` }; if (sc && sc.n >= 30 && (sc.p < 0.85) && s0.n >= 2) return { n: 1, at: nowIso(), why: `정밀도 ${sc.p} 떨어짐 — 그림자로 내림` }; return s0; }
  async function truthScore() { const ss = await C('ed_truth').limit(500).get(); const T = ss.docs.map((d) => ({ our: d.id, ...(d.data() || {}) })); if (!T.length) return { n: 0 }; const W = new Map(); for (const t of T) { const b = await C('ed_book').doc(t.our).get(); const w = b.exists ? (await C('ed_work').doc(b.data().w).get()).data() : null; W.set(t.our, w); } return edScore(T, (i) => W.get(i)); }

  async function diag(q) { const c = await cfg(); if (q.edprobe) { const s = String(q.edprobe); const t = /^97[89]\d{10}$/.test(s) ? { isbn: s } : { isbn: null }; if (!t.isbn) { const r = await product({ iid: s.replace(/\D/g, ''), probe: true }); return { one: r }; } return await runBook(t, { probe: true, budgetMs: 150e3 }); }
    if (q.edrun) { return await tick({ isbn: String(q.edrun), force: true }); }
    const d = await C('app_settings').doc('ed_study').get(); const L = await C('ed_ledger').orderBy('at', 'desc').limit(+q.n || 6).get().catch(() => null);
    return { v: ED_V, cfg: c, mem: { day: ST.day, used: ST.used, pause: ST.pauseUntil ? new Date(ST.pauseUntil).toISOString() : null, targets: ST.tg ? ST.tg.length : null, cur: ST.cur, busy: ST.busy, errs: ST.errs.slice(0, 6), tick: ST.tick }, study: d.exists ? { ...d.data(), tunePool: undefined } : null, ledger: L ? L.docs.map((x) => ({ id: x.id, ...x.data() })) : null }; }
  /* 정답 표본 넣기(/kp-in edtruth · 사람·Claude가 확인한 묶음) — [{ our: ISBN, same:[ISBN…], diff:[ISBN…], note }] · 덮지 않고 합침(같은 ISBN은 한 번) · 지우지 않음 */
  async function truthPut(L, by) { const out = { n: 0, bad: [] }; for (const t of (Array.isArray(L) ? L : []).slice(0, 200)) { const our = String((t && t.our) || ''); if (!/^97[89]\d{10}$/.test(our)) { out.bad.push(our.slice(0, 16)); continue; } const ok = (a) => [...new Set((Array.isArray(a) ? a : []).map(String).filter((x) => /^97[89]\d{10}$/.test(x) && x !== our))].slice(0, 60); const ref = C('ed_truth').doc(our); const o = ((await ref.get().catch(() => null)) || {}); const v = o.exists ? o.data() || {} : {};
      await ref.set(clean({ same: [...new Set([...(v.same || []), ...ok(t.same)])], diff: [...new Set([...(v.diff || []), ...ok(t.diff)])], note: t.note ? String(t.note).slice(0, 300) : v.note || null, by: String(by || 'claude').slice(0, 40), at: nowIso(), hist: [...((v.hist || []).slice(-9)), { at: nowIso(), by: String(by || '').slice(0, 40), same: ok(t.same).length, diff: ok(t.diff).length }] })); out.n++; } return out; }
  return { tick, diag, runBook, cfg, truthPut };
}

module.exports = { makeEdition, ED_V, ED_DEF, _t: { edLabel, edVol, edCore, dice, nameOv, edSame, edLinks, edLine, edOrder, edTune, edScore, edSelfCheck, ymd, norm, IN_PAGE_PRODUCT, IN_PAGE_SEARCH } };
