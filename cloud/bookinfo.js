/* 📖 책 정보 모으기 (bookinfo1 · 정범님 11/12 '모든 상품의 책소개·목차·상세·출판사 홍보글·저자·옮긴이·출판사 소개 · 알라딘 밖 먼저 · 샘플 페이지도 자동')
 *  저장 = bk_info/{ISBN13} — 웹앱 상품 상세 '📖 책 정보' · 우리숍 책 화면 · 서가(shelf8)가 같은 칸 이름을 씀(아래 FIELDS · coord/BOARD.md 한 줄)
 *  출처 차례(알라딘 밖 먼저): ① 예스24 공개 상품 화면(글로 받음 · 칸이 가장 많음) ② 국립중앙도서관 서지의 책소개·목차 파일(ext_basic에 받아 둔 주소) ③ 교보 공개 상품 화면 ④ 알라딘 공개 상품 화면(위에서 못 채운 책만 · 하루 상한 작게)
 *  🧬 적응(약속 64 · 정범님 11/12 '사이트는 늘 방식을 바꾼다는 전제'): 칸마다 여러 길(칸 번호 id · 제목 글 · 구조 데이터 · 일반 제목 찾기)로 읽고,
 *     길마다 최근 성공률을 기억해 잘 되는 길을 고수하되(고정) 그 길이 비면 다른 길로 채우고 '바뀜'을 남김(변화) · 모든 길이 비는데 예전엔 잘 채우던 칸이면 '깨짐' + 화면 조각(probe)을 남겨 읽는 법을 고침
 *  ⏱ 속도: 출처마다 요청 사이 간격을 스스로 조절(AIMD — 빠르고 오류 없으면 조금씩 줄이고, 느려지거나 429·403·503·시간 초과면 두 배 · 4번 잇달아면 쉼) · 하루 상한
 *  🗂 차례: ① 새로 등록된 우리 상품(72시간 안) ② 판매 중인 우리 상품 ③ 그 밖의 우리 상품(판매 끝 등) ④ 빈 칸을 14일 뒤 다시 · 다 찬 책은 180일 뒤 다시
 *  🖼 샘플 페이지(알라딘 '미리보기' letslook 그림): ① 같은 책의 다른 매물이 이미 받은 것(prd_listings.previews)을 책 단위로 함께 씀(요청 0) ② 없으면 도서 기록(prd_books.images.preview)의 주소에서 받아 저장소에
 *     img/preview/isbn_<ISBN>/<n>.jpg · 하루 처음엔 많이, 다 모아 갈수록 적게(pvBudget — 남은 수 기준 자동) · 한 장 900KB · 한 권 16쪽 상한
 *  순수 함수(파서·속도·차례·예산·적응)는 아래에서 내보내 시험(src/tests/tBOOKINFO1112.js)이 그대로 씀 */
'use strict';
const VER = '0.1.1'; // (0.1.1) 예스24 번호를 모르면 교보(받아 둔 번호 → 교보 검색)를 먼저 · 그려 읽기는 그 뒤 · 제목 안 태그도 읽음 · 진단 화면 꼴(bkpage)

/* ── 칸 이름 (웹앱·우리숍·서가가 같이 씀) ── */
const FIELDS = [ /* [칸, 이름, 최대 글자] */
  ['intro', '책소개', 6000], ['toc', '목차', 8000], ['inbook', '책 속으로', 6000], ['pubrev', '출판사 서평', 8000],
  ['auth', '저자 소개', 5000], ['trans', '옮긴이 소개', 3000], ['pubintro', '출판사 소개', 2000], ['rec', '추천평', 3000],
];
const BASIC = [ /* bk_info.b 칸 */
  ['title', '제목'], ['authors', '저자'], ['translators', '옮긴이'], ['publisher', '출판사'], ['pubDate', '출간일'], ['cat', '주제 분류'],
  ['pages', '쪽수'], ['size', '크기'], ['weightG', '무게(g)'], ['isbn10', 'ISBN10'], ['priceList', '정가'], ['series', '시리즈'], ['kdc', 'KDC'],
];
const CORE = ['intro', 'toc', 'auth']; /* 이 셋이 차면 그 책은 '다 참'으로 보고 다음 출처를 묻지 않음 */
const LABELS = {
  intro: /^(책\s*소개|이\s*책은|책\s*정보\s*소개|소개)$/,
  toc: /^(목차|차례|목\s*차)$/,
  inbook: /^(책\s*속으로|책\s*속에서|본문\s*중에서|책\s*속\s*한\s*문장|발췌)$/,
  pubrev: /^(출판사\s*(리뷰|서평|제공\s*책\s*소개|책\s*소개|의\s*말)|편집자\s*(리뷰|추천|의\s*말))$/,
  auth: /^(저자\s*(소개|정보|및\s*역자\s*소개)?|작가\s*(소개|정보)|지은이\s*(소개)?|글쓴이\s*소개|저자\s*\/\s*역자\s*소개)$/,
  trans: /^(역자\s*(소개|정보)|옮긴이\s*(소개)?|번역가?\s*소개)$/,
  pubintro: /^(출판사\s*(소개|정보))$/,
  rec: /^(추천\s*(평|사|의\s*글|글))$/,
};
const TRANS_ROLE = /^(역|옮김|번역|역자|옮긴이|편역|공역)/;

/* ── 작은 도구 ── */
const decodeEnt = (s) => String(s == null ? '' : s).replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&#x27;|&apos;/g, "'").replace(/&#(\d+);/g, (m, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCharCode(parseInt(n, 16))).replace(/&amp;/g, '&');
const JUNK = /^(펼쳐보기|접어보기|펼쳐보기\s*접어보기|더보기|닫기|관심작가\s*알림신청|작가\s*파일|작가\s*파일\s*보기|미리보기|책의 일부 내용을 미리 읽어보실 수 있습니다\.?(\s*미리보기)?|top|맨\s*위로|전체보기|이전|다음|[>›▶▼▲·|/-])$/i;
/* HTML 조각 → 읽는 글(줄 나눔 살림) · 예스24는 소개 글을 textarea 안에 escape된 HTML로 둠 → 풀어서 다시 태그를 걷음 */
function htmlText(seg, raw) {
  let t = String(seg || '').replace(/^[^<]*?>/, (m) => (/^\s*[a-z-]+=/i.test(m) ? '' : m)).replace(/<[^>]*$/, '').replace(/<(script|style|noscript|template|button|select)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  t = t.replace(/<textarea\b[^>]*>([\s\S]*?)<\/textarea>/gi, (m, x) => ' ' + decodeEnt(x) + ' ').replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ');
  t = t.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h[1-6]|dt|dd|th|td|tr|ul|ol|table|section|article|blockquote)>/gi, '\n').replace(/<li\b[^>]*>/gi, '\n').replace(/<[^>]+>/g, ' ');
  t = decodeEnt(t).replace(/ /g, ' ').replace(/[ \t\r\f\v]+/g, ' ');
  const out = []; for (let ln of t.split('\n')) { ln = ln.trim(); if (!ln || (!raw && JUNK.test(ln))) continue; if (out.length && out[out.length - 1] === ln) continue; out.push(ln); }
  return out.join('\n').trim();
}
const clip = (s, n) => { s = String(s == null ? '' : s).trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
const toNum = (s) => { if (s == null) return null; const m = String(s).replace(/,/g, '').match(/\d+(\.\d+)?/); return m ? +m[0] : null; };
const ymd = (s) => { s = String(s || ''); let m = s.match(/(\d{4})\s*[-.\/년]\s*(\d{1,2})\s*[-.\/월]\s*(\d{1,2})/); if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`; m = s.match(/(\d{4})\s*[-.\/년]\s*(\d{1,2})/); return m ? `${m[1]}-${m[2].padStart(2, '0')}` : null; };
const meta = (H, name) => { const re = new RegExp(`<meta[^>]+(?:property|name)=["']${name.replace(/[:.]/g, '\\$&')}["'][^>]*>`, 'i'); const t = (String(H).match(re) || [])[0]; if (!t) return null; const c = t.match(/content=["']([^"']*)["']/i); return c ? decodeEnt(c[1]).trim() : null; };
const hasIsbn = (H, isbn) => { H = String(H || ''); return !!isbn && (H.includes(isbn) || H.includes(isbn.replace(/^(\d{3})(\d+)$/, '$1-$2'))); };
const spec = (txt) => { const t = String(txt || ''); const pages = toNum((t.match(/([\d,]+)\s*(쪽|p\b|페이지|面)/i) || [])[1]); const weightG = toNum((t.match(/([\d,.]+)\s*g\b/i) || [])[1]); const size = ((t.match(/\d{2,4}\s*[*x×]\s*\d{2,4}(\s*[*x×]\s*\d{1,3})?\s*mm/i) || [])[0] || '').replace(/\s+/g, '').replace(/[x×]/gi, '*') || null; return { pages: pages && pages < 20000 ? pages : null, weightG: weightG && weightG < 20000 ? weightG : null, size }; };
/* 같은 사람 소개가 '짧게(…)' 다음 '길게'로 두 번 나오면 짧은 것은 뺌 */
const dedupLead = (txt) => { const L = String(txt || '').split('\n'); const out = []; for (let i = 0; i < L.length; i++) { const a = L[i]; const b = L[i + 1] || ''; if (/(\.\.\.|…)$/.test(a) && b.startsWith(a.replace(/(\.\.\.|…)$/, '').slice(0, 40))) continue; out.push(a); } return out.join('\n'); };

/* 칸 글 맨 앞의 제목 줄('책소개'·'목차'·'저자 소개 (3명)'…)은 뺌 */
const HEADW = /^(책\s*소개|목차|책\s*속으로|출판사\s*(리뷰|서평)|추천평|저자\s*소개|역자\s*소개|옮긴이\s*소개|출판사\s*소개)(\s*\(\d+명\))?$/;
const dropHead = (t) => { const L = String(t || '').split('\n'); while (L.length && (HEADW.test(L[0].trim()) || /^\(\d+명\)$/.test(L[0].trim()))) L.shift(); return L.join('\n').trim() || null; };
/* ── 일반 제목 찾기(어느 사이트든 · 사이트가 칸 번호를 바꿔도) — 짧은 글이 든 태그 중 LABELS에 맞는 것을 제목으로 보고 다음 제목까지를 그 칸 글로 ── */
function headings(H) { H = String(H || ''); const out = []; const re = /<(h[1-6]|strong|b|dt|th|span|div|p|em|a|li|button)\b[^>]*>((?:(?!<\/?\1\b)[\s\S]){1,240}?)<\/\1>/gi; let m; /* (0.1.1) 안에 태그가 있는 제목도(교보 '<h2 class="title_heading"><span>목차</span></h2>' 같은 꼴) — 글만 꺼내 30자 안이면 제목 후보 */
  while ((m = re.exec(H))) { const inner = m[2]; if (/<(div|p|ul|table|li|h[1-6])\b/i.test(inner)) { re.lastIndex = m.index + m[1].length + 1; continue; } /* 상자째 잡히면 안쪽 제목부터 다시 */ const label = decodeEnt(inner.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().replace(/\(\s*\d+\s*명?\s*\)$/, '').replace(/[\s:：·\-]+$/, '').trim(); if (!label || label.length > 30) { re.lastIndex = m.index + m[1].length + 1; continue; } for (const [f, rx] of Object.entries(LABELS)) if (rx.test(label)) { out.push({ f, at: m.index, end: m.index + m[0].length, label }); break; } }
  return out; }
function byHeadings(H, maxLen) { H = String(H || ''); const hs = headings(H); const got = {}; const stops = []; { const re = /<h[1-6]\b|<[a-z]+[^>]+class=["'][^"']*\b(tit_txt|title_heading|Ere_prod_mconts_LS)\b/gi; let m; while ((m = re.exec(H))) stops.push(m.index); } /* 다음 제목(이름표가 없는 제목 '상세 이미지' 등)에서 끊음 */
  for (let i = 0; i < hs.length; i++) { const h = hs[i]; if (got[h.f]) continue; const nx = hs.slice(i + 1).find((x) => x.at > h.end); const st = stops.find((x) => x > h.end); const seg = H.slice(h.end, Math.min(nx ? nx.at : H.length, st || H.length, h.end + (maxLen || 60000))); const t = dropHead(htmlText(seg)) || ''; if (t.length >= 2) got[h.f] = t; } return got; }

/* ── 🧬 적응: 여러 길 → 고르기 · 길마다 성공률 기억(낡은 것은 조금씩 잊음) ── */
const DECAY = 0.985;
function choose(field, cands, health, src) { /* cands [{how, v}] → {v, how, shift} — 성공률 높은 길 먼저(같으면 적힌 차례) · 비면 다음 길 */
  const st = (health && health[src] && health[src].p && health[src].p[field]) || {}; const rate = (how) => { const x = st[how]; return x ? (x.ok + 1) / (x.n + 2) : 0.5; };
  const order = cands.map((c, i) => ({ ...c, i })).sort((a, b) => rate(b.how) - rate(a.how) || a.i - b.i); const hit = order.find((c) => c.v && String(c.v).trim().length >= 2);
  const top = order[0]; return hit ? { v: hit.v, how: hit.how, shift: top && hit.how !== top.how && rate(top.how) > 0.6 ? `${top.how}→${hit.how}` : null } : { v: null, how: null }; }
function healthAdd(health, src, rep) { /* rep {paths:{field:{how:ok}}, filled:[fields], miss:[fields], shifts, at} → 기억 고침(순수) */
  const H = JSON.parse(JSON.stringify(health || {})); const S = H[src] = H[src] || { n: 0, p: {}, fill: {}, shifts: [], broken: {} }; S.n = (S.n || 0) * DECAY + 1;
  for (const [f, ways] of Object.entries(rep.paths || {})) { const P = S.p[f] = S.p[f] || {}; for (const [how, ok] of Object.entries(ways)) { const x = P[how] = P[how] || { ok: 0, n: 0 }; x.ok = x.ok * DECAY + (ok ? 1 : 0); x.n = x.n * DECAY + 1; x.ok = Math.round(x.ok * 1000) / 1000; x.n = Math.round(x.n * 1000) / 1000; } }
  const all = new Set([...(rep.filled || []), ...(rep.miss || [])]); for (const f of all) { const x = S.fill[f] = S.fill[f] || { ok: 0, n: 0 }; const was = x.n >= 10 ? x.ok / x.n : null; x.ok = x.ok * DECAY + ((rep.filled || []).includes(f) ? 1 : 0); x.n = x.n * DECAY + 1; x.ok = Math.round(x.ok * 1000) / 1000; x.n = Math.round(x.n * 1000) / 1000;
    if ((rep.miss || []).includes(f) && was != null && was > 0.6) S.broken[f] = { at: rep.at || null, was: Math.round(was * 100) / 100, k: ((S.broken[f] || {}).k || 0) + 1 }; else if ((rep.filled || []).includes(f) && S.broken[f]) delete S.broken[f]; }
  for (const sh of rep.shifts || []) { S.shifts.unshift({ ...sh, at: rep.at || null }); } S.shifts = S.shifts.slice(0, 20); return H; }
/* 깨짐 판정: 이 칸을 예전엔 60% 넘게 채웠는데 최근 연달아(3번 이상) 비면 — 읽는 법이 바뀐 것으로 보고 화면 조각을 남김 */
const isBroken = (health, src, f) => { const b = health && health[src] && health[src].broken && health[src].broken[f]; return !!(b && b.k >= 3); };

/* ── ① 예스24 공개 상품 화면 (2026-11-12 실제 화면으로 확인: id="infoset_introduce·toc·inBook·pubReivew·authorGrp·nomiCmt·specific·goodsCate·chYes") ── */
function y24Sections(H) { const ids = []; const re = /id=["']infoset_([A-Za-z]+)["']/g; let m; while ((m = re.exec(H))) ids.push([m.index, m[1]]); const o = {}; ids.forEach(([s, n], k) => { if (!o[n]) o[n] = H.slice(s, k + 1 < ids.length ? ids[k + 1][0] : s + 40000); }); return o; }
function y24Authors(seg) { const out = { auth: [], trans: [] }; const parts = String(seg || '').split(/<div[^>]+class=["'][^"']*authorInfoGrp/i).slice(1);
  for (const p of parts) { const nm = p.match(/class=["']author_name["'][^>]*>([\s\S]*?)<\/div>/i); const head = nm ? htmlText(nm[1]).replace(/\n/g, ' ') : ''; const role = (head.match(/^([^:：]{1,12})[:：]/) || [])[1] || ''; const name = head.replace(/^[^:：]{1,12}[:：]\s*/, '').trim();
    const full = p.match(/class=["'][^"']*info_origin[^"']*["'][^>]*>([\s\S]*?)<\/span>/i) || p.match(/class=["'][^"']*info_crop[^"']*["'][^>]*>([\s\S]*?)<\/span>/i); const body = full ? htmlText(full[1]) : '';
    if (!name && !body) continue; const line = `${name}${role ? ` (${role.trim()})` : ''}${body ? '\n' + body : ''}`; (TRANS_ROLE.test(role.trim()) ? out.trans : out.auth).push(line); }
  return { auth: out.auth.join('\n\n') || null, trans: out.trans.join('\n\n') || null }; }
function parseYes24(html, isbn, health) { const H = String(html || ''); if (!hasIsbn(H, isbn)) return { ok: false, why: '예스24 화면에 이 ISBN이 없음 — 다른 책일 수 있어 받지 않음', mismatch: true };
  const S = y24Sections(H); const G = byHeadings(H); const sx = (k) => (S[k] ? dropHead(htmlText(S[k])) : null); /* 첫 줄 = 칸 제목 */
  const A = S.authorGrp ? y24Authors(S.authorGrp) : { auth: null, trans: null };
  const ways = { intro: [{ how: 'id', v: sx('introduce') }, { how: 'head', v: G.intro }, { how: 'meta', v: meta(H, 'og:description') }], toc: [{ how: 'id', v: sx('toc') }, { how: 'head', v: G.toc }],
    inbook: [{ how: 'id', v: sx('inBook') }, { how: 'head', v: G.inbook }], pubrev: [{ how: 'id', v: sx('pubReivew') || sx('pubReview') }, { how: 'head', v: G.pubrev }],
    auth: [{ how: 'id', v: A.auth }, { how: 'head', v: G.auth && dedupLead(G.auth) }], trans: [{ how: 'id', v: A.trans }, { how: 'head', v: G.trans }], pubintro: [{ how: 'head', v: G.pubintro }], rec: [{ how: 'id', v: sx('nomiCmt') }, { how: 'head', v: G.rec }] };
  const sp = S.specific ? htmlText(S.specific) : ''; const kv = {}; sp.split('\n').forEach((ln, i, L) => { if (/^(발행일|쪽수, 무게, 크기|ISBN13|ISBN10|출간일)$/.test(ln) && L[i + 1]) kv[ln] = L[i + 1]; });
  const og = String(meta(H, 'og:title') || '').replace(/\s*-\s*예스24\s*$/, '').split(' | ').map((x) => x.trim());
  const catL = S.goodsCate ? htmlText(S.goodsCate, true).split('\n') : []; const ci = catL.indexOf('카테고리 분류'); let cat = null; if (ci >= 0) { const seg = []; for (let i = ci + 1; i < catL.length && !/분류$/.test(catL[i]); i++) { if (catL[i] === '>') continue; if (seg.length && catL[i - 1] !== '>') break; seg.push(catL[i]); } cat = seg.join(' > ') || null; }
  const sp2 = spec(kv['쪽수, 무게, 크기'] || sp); const dimg = S.chYes ? [...S.chYes.matchAll(/data-original=["']([^"']+)["']/gi)].map((m) => m[1]).filter((u) => /^https:\/\//.test(u) && !/Noimg/i.test(u)).slice(0, 8) : [];
  const b = { title: og[0] || null, authors: og[1] || null, publisher: og[2] || null, pubDate: ymd(kv['발행일'] || kv['출간일']), cat, pages: sp2.pages, size: sp2.size, weightG: sp2.weightG, isbn10: (String(kv.ISBN10 || '').match(/\d{9}[\dX]/) || [])[0] || null };
  return finish('yes24', ways, b, { dimg }, health); }

/* ── ③ 교보 · ④ 알라딘 · 그 밖: 같은 일반 길(제목 찾기 + 구조 데이터 + 표 칸) — 사이트 고유 칸 번호를 몰라도 읽고, 고유 길은 알게 되면 앞에 더함 ── */
function ldBook(H) { const out = []; String(H || '').replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi, (m, s) => { try { const j = JSON.parse(s.trim()); (Array.isArray(j) ? j : j['@graph'] || [j]).forEach((x) => out.push(x)); } catch (e) {} return m; }); return out.find((x) => x && /Book|Product/i.test(String(x['@type'] || ''))) || null; }
function kvPairs(H) { const o = {}; const put = (k, v) => { k = htmlText(k).replace(/\s+/g, ' ').replace(/[:：]$/, '').trim(); v = htmlText(v).replace(/\s+/g, ' ').trim(); if (k && v && k.length <= 20 && !(k in o)) o[k] = v.slice(0, 300); };
  String(H || '').replace(/<th[^>]*>((?:(?!<\/?th[\s>])[\s\S]){0,400}?)<\/th>\s*<td[^>]*>((?:(?!<\/?td[\s>])[\s\S]){0,3000}?)<\/td>/gi, (m, k, v) => { put(k, v); return m; }).replace(/<dt[^>]*>([\s\S]{0,400}?)<\/dt>\s*<dd[^>]*>([\s\S]{0,3000}?)<\/dd>/gi, (m, k, v) => { put(k, v); return m; }); return o; }
const kvFind = (kv, re) => { for (const [k, v] of Object.entries(kv || {})) if (re.test(k)) return v; return null; };
function parseGeneric(src, html, isbn, health) { const H = String(html || ''); if (!hasIsbn(H, isbn)) return { ok: false, why: `${src} 화면에 이 ISBN이 없음 — 다른 책일 수 있어 받지 않음`, mismatch: true };
  const G = byHeadings(H); const ld = ldBook(H); const kv = kvPairs(H); const ldTxt = (x) => (x ? htmlText(String(x)) : null);
  /* 알라딘 고유 길(공개 상품 화면 'Ere_prod_mconts_LS' 제목 칸 + 'Ere_prod_mconts_R' 글 칸) — 일반 길이 못 찾을 때 대비 */
  const AL = {}; if (src === 'aladin') { const re = /class=["']Ere_prod_mconts_LS["'][^>]*>([\s\S]*?)<\/div>[\s\S]{0,400}?class=["']Ere_prod_mconts_R["'][^>]*>([\s\S]*?)(?=<div[^>]+class=["']Ere_prod_mconts_LS|<div[^>]+class=["']Ere_line|$)/gi; let m; while ((m = re.exec(H))) { const lb = htmlText(m[1]).replace(/\s+/g, ' ').trim(); for (const [f, rx] of Object.entries(LABELS)) if (rx.test(lb) && !AL[f]) AL[f] = htmlText(m[2].slice(0, 60000)); } }
  const ways = {}; for (const [f] of FIELDS) ways[f] = [...(AL[f] ? [{ how: 'site', v: AL[f] }] : []), { how: 'head', v: f === 'auth' && G[f] ? dedupLead(G[f]) : G[f] }];
  ways.intro.push({ how: 'ld', v: ld && ldTxt(ld.description) }, { how: 'meta', v: meta(H, 'og:description') });
  const sp2 = spec([kvFind(kv, /쪽수|페이지|무게|크기|판형|규격/), Object.entries(kv).filter(([k]) => /쪽수|무게|크기|판형|규격/.test(k)).map(([, v]) => v).join(' | ')].join(' | '));
  const au = ld && ld.author ? [].concat(ld.author).map((a) => (typeof a === 'object' ? a.name : a)).filter(Boolean).join(', ') : null;
  const b = { title: (ld && ld.name) || (meta(H, 'og:title') || '').replace(/\s*[|:\-]\s*(교보문고|알라딘|예스24).*$/i, '').trim() || null, authors: au, publisher: (ld && ld.publisher && (ld.publisher.name || ld.publisher)) || kvFind(kv, /^출판사$/) || null, pubDate: ymd(kvFind(kv, /발행일|출간일|발행\(출시\)일자|출시일/) || (ld && ld.datePublished)), pages: sp2.pages || toNum(ld && ld.numberOfPages), size: sp2.size, weightG: sp2.weightG, cat: null };
  return finish(src, ways, b, {}, health); }

/* 여러 길 → 칸 값 · 길마다 됨/안 됨 · 바뀜(shift) */
function finish(src, ways, b, extra, health) { const t = {}, from = {}, paths = {}, shifts = [];
  for (const [f, , max] of FIELDS) { const c = (ways[f] || []).filter(Boolean); if (!c.length) continue; paths[f] = {}; c.forEach((x) => { paths[f][x.how] = !!(x.v && String(x.v).trim().length >= 2); }); const r = choose(f, c, health, src); if (r.v) { t[f] = clip(r.v, max); from[f] = r.how; if (r.shift) shifts.push({ f, how: r.shift }); } }
  const B = {}; for (const [k] of BASIC) if (b && b[k] != null && b[k] !== '') B[k] = b[k];
  const filled = FIELDS.map(([f]) => f).filter((f) => t[f]); const miss = FIELDS.map(([f]) => f).filter((f) => !t[f]);
  return { ok: true, src, t, b: B, from, paths, shifts, filled, miss, ...(extra && extra.dimg && extra.dimg.length ? { dimg: extra.dimg } : {}) }; }

/* 출처 여럿 → 한 책 문서(먼저 온 출처 값을 지키고 빈 칸만 다음 출처로) */
function merge(cur, res) { const o = cur ? JSON.parse(JSON.stringify(cur)) : { t: {}, b: {}, from: {} }; o.t = o.t || {}; o.b = o.b || {}; o.from = o.from || {};
  for (const [f] of FIELDS) if (!o.t[f] && res.t && res.t[f]) { o.t[f] = res.t[f]; o.from[f] = res.src; }
  for (const [k] of BASIC) if ((o.b[k] == null || o.b[k] === '') && res.b && res.b[k] != null) { o.b[k] = res.b[k]; o.from['b.' + k] = res.src; }
  if (!o.dimg && res.dimg) o.dimg = res.dimg; return o; }
const f0 = (o) => !!(o && o.t && Object.keys(o.t).length);
const coreFull = (o) => CORE.every((f) => o && o.t && o.t[f]);

/* ── ⏱ 출처마다 속도 스스로 조절 (순수 · AIMD) ── */
const PACE_DEF = { yes24: { gap: 3000, min: 1500, max: 60000, slowMs: 4000, cap: 9000 }, nl: { gap: 1500, min: 800, max: 30000, slowMs: 3000, cap: 6000 }, kyobo: { gap: 4000, min: 2500, max: 90000, slowMs: 5000, cap: 3000 }, aladin: { gap: 6000, min: 4000, max: 120000, slowMs: 5000, cap: 300 }, render: { gap: 30000, min: 20000, max: 600000, slowMs: 70000, cap: 400 }, pvimg: { gap: 1500, min: 800, max: 60000, slowMs: 3000, cap: 12000 } };
function paceInit(src, o) { const d = { ...(PACE_DEF[src] || PACE_DEF.yes24), ...(o || {}) }; return { ...d, lat: null, errRun: 0, pauseUntil: 0, pauseN: 0, ok: 0, err: 0 }; }
function paceStep(p, ev, now) { p = { ...p }; now = now || Date.now(); const ms = +ev.ms || 0; p.lat = p.lat == null ? ms : Math.round(p.lat * 0.8 + ms * 0.2);
  const hard = !ev.ok && (ev.status === 429 || ev.status === 403 || ev.status === 503 || ev.status === 418 || ev.timeout);
  if (ev.ok) { p.ok++; p.errRun = 0; p.pauseN = Math.max(0, p.pauseN - 0.1); p.gap = ms > p.slowMs ? Math.min(p.max, Math.round(p.gap * 1.25)) : Math.max(p.min, Math.round(p.gap * 0.95)); }
  else { p.err++; p.errRun++; p.gap = Math.min(p.max, Math.round(p.gap * (hard ? 2 : 1.3))); if (p.errRun >= 4 || (hard && p.errRun >= 2)) { p.pauseN = Math.min(6, Math.floor(p.pauseN) + 1); p.pauseUntil = now + Math.min(6 * 3600e3, 15 * 60e3 * 2 ** (p.pauseN - 1)); p.errRun = 0; } }
  return p; }
const paceWait = (p, last, now) => { now = now || Date.now(); if (p.pauseUntil > now) return p.pauseUntil - now; return Math.max(0, (last || 0) + p.gap - now); };

/* ── 🗂 차례 (순수) — cands [{isbn, st:'act'|'other', reg(ISO)}] · have Map isbn → {at, full, tries, nx(다시 볼 때 ms)} ── */
function planQ(cands, have, now) { now = now || Date.now(); const T = [[], [], [], []]; const seen = new Set();
  for (const c of cands || []) { if (!c || !/^97[89]\d{10}$/.test(String(c.isbn || '')) || seen.has(c.isbn)) continue; seen.add(c.isbn); const h = have && have.get(c.isbn);
    if (h && (h.nx || 0) > now) continue; if (!h) { const isNew = c.reg && now - Date.parse(c.reg) < 72 * 3600e3; T[isNew ? 0 : c.st === 'act' ? 1 : 2].push(c); } else T[3].push(c); }
  T[0].sort((a, b) => String(b.reg || '').localeCompare(String(a.reg || ''))); T[1].sort((a, b) => String(b.reg || '').localeCompare(String(a.reg || ''))); T[3].sort((a, b) => ((have.get(a.isbn) || {}).nx || 0) - ((have.get(b.isbn) || {}).nx || 0));
  return { list: [...T[0], ...T[1], ...T[2], ...T[3]], n: T.map((x) => x.length) }; }
/* 다음에 다시 볼 때: 다 참 → 180일 · 빈 칸 남음 → 14일 · 아무 출처에도 없음 → 30일 × 횟수(최대 120일) */
const nextAt = (o, tries, now) => { now = now || Date.now(); if (coreFull(o)) return now + 180 * 864e5; if (o && o.t && Object.keys(o.t).length) return now + 14 * 864e5; return now + Math.min(120, 30 * Math.max(1, tries || 1)) * 864e5; };

/* ── 🖼 샘플 페이지 하루 예산 (순수) — 하루 처음(0~7시)엔 크게, 저녁엔 작게 · 남은 책이 적을수록 작게 · 다 모으면 0 ── */
function pvBudget(o) { o = o || {}; const h = +o.hourKst || 0; const left = Math.max(0, +o.left || 0); const base = o.base == null ? 80 : +o.base; const cap = o.cap == null ? 1200 : +o.cap; const done = +o.todayDone || 0;
  if (!left) return { n: 0, why: '다 모음' }; const w = h < 7 ? 1 : h < 13 ? 0.6 : h < 19 ? 0.35 : 0.2; const f = left >= 500 ? 1 : 0.2 + (0.8 * left) / 500;
  const n = Math.max(0, Math.min(Math.round(base * w * f), cap - done, left)); return { n, w, f: Math.round(f * 100) / 100, why: n ? `시간 비중 ${w} × 남은 양 비중 ${Math.round(f * 100) / 100}` : done >= cap ? '오늘 상한' : '작음' }; }
const pvBookKey = (isbn) => 'isbn_' + String(isbn).replace(/\D/g, '');
const pvFromListing = (L) => (Array.isArray(L) ? L : []).filter((x) => x && x.stored).sort((a, b) => (a.n ?? 999) - (b.n ?? 999)).slice(0, 16).map((x) => ({ s: x.stored, t: x.thumb || null, n: x.n ?? null }));

/* 공개 요약(우리숍 · 웹앱이 같은 꼴) — 글 칸·기본 칸·미리보기 경로 */
function pubOf(d) { if (!d) return null; const t = {}; for (const [f, , max] of FIELDS) if (d.t && d.t[f]) t[f] = clip(d.t[f], max); const b = {}; for (const [k] of BASIC) if (d.b && d.b[k] != null) b[k] = d.b[k];
  return { t, b, pv: (d.pv && d.pv.list) || [], dimg: d.dimg || [], src: d.from || {}, at: d.at || null }; }

/* ══════════ 클라우드에서 돌기 ══════════ */
function makeBookInfo(ctx) { const { C, FV, log, W, bucket, render, fetchFn } = ctx; const nowIso = () => new Date().toISOString(); const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const UA = ctx.UA || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
  const ST = { cands: null, candAt: 0, newAt: null, have: null, haveAt: 0, pace: {}, last: {}, used: {}, day: '', health: null, healthAt: 0, busy: false, pvBusy: false, done: { ok: 0, none: 0, err: 0 }, pv: { share: 0, got: 0, imgs: 0, bytes: 0, none: 0, day: '', today: 0 }, errs: [], q: null, qAt: 0, cfg: null, cfgAt: 0, ext: new Map(), shareCur: null, shareDone: false, pvLeft: null, rate: [] };
  const kDay = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); const kHour = () => new Date(Date.now() + 9 * 3600e3).getUTCHours();
  const REF = () => C('app_settings').doc('bkinfo_run');
  async function cfg() { if (ST.cfg && Date.now() - ST.cfgAt < 10 * 60e3) return ST.cfg; let c = {}; try { const d = await C('app_settings').doc('bkinfo').get(); c = d.exists ? d.data() : {}; } catch (e) {} ST.cfg = { on: c.on !== false, aladin: c.aladin !== false, pvOn: c.pvOn !== false, pvBase: c.pvBase == null ? 80 : +c.pvBase, pvCap: c.pvCap == null ? 1200 : +c.pvCap, caps: c.caps || {} }; ST.cfgAt = Date.now(); return ST.cfg; }
  const P = (src) => (ST.pace[src] = ST.pace[src] || paceInit(src));
  const dayRoll = () => { const d = kDay(); if (ST.day !== d) { ST.day = d; ST.used = {}; } };
  const capOk = (src) => { dayRoll(); const cap = (ST.cfg && ST.cfg.caps && ST.cfg.caps[src] != null) ? +ST.cfg.caps[src] : P(src).cap; return (ST.used[src] || 0) < cap && P(src).pauseUntil <= Date.now(); };
  async function get(src, url, o) { o = o || {}; const p = P(src); const w = paceWait(p, ST.last[src]); if (w > 25000) return { skip: true, why: '쉬는 중' }; if (w) await sleep(w); ST.last[src] = Date.now(); dayRoll(); ST.used[src] = (ST.used[src] || 0) + 1;
    const t0 = Date.now(); const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), o.timeout || 25000);
    try { const r = await (fetchFn || fetch)(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'ko-KR,ko;q=0.9', ...(o.headers || {}) }, redirect: 'follow', signal: ctl.signal }); const buf = o.bin ? Buffer.from(await r.arrayBuffer()) : null; const text = o.bin ? null : await r.text(); const ms = Date.now() - t0;
      ST.pace[src] = paceStep(p, { ok: r.ok || r.status === 404, status: r.status, ms }); return { status: r.status, ok: r.ok, url: r.url, text, buf, ms, type: r.headers && r.headers.get ? r.headers.get('content-type') : null };
    } catch (e) { ST.pace[src] = paceStep(p, { ok: false, timeout: e.name === 'AbortError', ms: Date.now() - t0 }); return { status: 0, ok: false, err: e.name === 'AbortError' ? '응답 없음' : String(e.message || e).slice(0, 120) }; } finally { clearTimeout(to); } }
  /* 책 목록: 우리 상품(판매 중 먼저) — 6시간마다 다시 · 새 등록은 15분마다 firstSeenAt으로 */
  async function loadCands() { if (ST.cands && Date.now() - ST.candAt < 6 * 3600e3) return ST.cands; const m = new Map();
    const qs = await C('prd_listings').select('isbn13', 'status', 'active', 'firstSeenAt', 'registeredAt', 'bookId', 'title').get();
    qs.forEach((d) => { const v = d.data() || {}; const isbn = String(v.isbn13 || '').replace(/\D/g, ''); if (!/^97[89]\d{10}$/.test(isbn)) return; const act = v.active !== false && /판매중|일시판매중지/.test(String(v.status || '')); const reg = (typeof v.registeredAt === 'string' && v.registeredAt) || (typeof v.firstSeenAt === 'string' && v.firstSeenAt) || null; const o = m.get(isbn);
      if (!o) m.set(isbn, { isbn, st: act ? 'act' : 'other', reg, bookId: v.bookId || null, title: String(v.title || '').replace(/^\[중고[^\]]*\]\s*/, '').slice(0, 80) || null }); else { if (act) o.st = 'act'; if (reg && (!o.reg || reg > o.reg)) o.reg = reg; if (!o.bookId && v.bookId) o.bookId = v.bookId; } });
    ST.cands = [...m.values()]; ST.candAt = Date.now(); ST.newAt = nowIso(); ST.q = null; log('📖 책 정보 목록', ST.cands.length, '권 (우리 상품', qs.size, '개에서)'); return ST.cands; }
  async function watchNew() { if (!ST.cands || !ST.newAt) return 0; let n = 0; try { const qs = await C('prd_listings').where('firstSeenAt', '>', ST.newAt).select('isbn13', 'status', 'active', 'firstSeenAt', 'bookId', 'title').limit(500).get(); const idx = new Map(ST.cands.map((c) => [c.isbn, c]));
      qs.forEach((d) => { const v = d.data() || {}; const isbn = String(v.isbn13 || '').replace(/\D/g, ''); if (!/^97[89]\d{10}$/.test(isbn)) return; if (typeof v.firstSeenAt === 'string' && v.firstSeenAt > ST.newAt) ST.newAt = v.firstSeenAt; const c = idx.get(isbn); if (c) { c.reg = v.firstSeenAt; c.st = 'act'; } else { const o = { isbn, st: 'act', reg: v.firstSeenAt || nowIso(), bookId: v.bookId || null, title: String(v.title || '').slice(0, 80) || null }; ST.cands.push(o); idx.set(isbn, o); } n++; });
      if (n) ST.q = null; } catch (e) { ST.errs.unshift({ at: nowIso(), why: '새 등록 보기: ' + e.message }); } return n; }
  async function loadHave() { if (ST.have && Date.now() - ST.haveAt < 12 * 3600e3) return ST.have; const m = new Map(); const qs = await C('bk_info').select('nx', 'tries', 'full', 'f', 'pvN', 'pvAt').get(); qs.forEach((d) => { const v = d.data() || {}; m.set(d.id, { nx: +v.nx || 0, tries: +v.tries || 0, full: !!v.full, f: v.f || [], pvN: +v.pvN || 0, pvAt: v.pvAt || null }); }); ST.have = m; ST.haveAt = Date.now(); return m; }
  async function health() { if (ST.health) return ST.health; try { const d = await C('app_settings').doc('bkinfo_health').get(); ST.health = d.exists ? d.data().h || {} : {}; } catch (e) { ST.health = {}; } return ST.health; }
  async function saveHealth() { if (!ST.health || Date.now() - ST.healthAt < 10 * 60e3) return; ST.healthAt = Date.now(); try { await C('app_settings').doc('bkinfo_health').set({ h: ST.health, at: nowIso(), v: VER, ...W() }); } catch (e) {} }
  async function probe(src, isbn, html, why) { try { const id = `bk_${src}_${kDay().replace(/-/g, '')}`; const r = C('ext_probe').doc(id); const ex = await r.get(); if (!ex.exists) await r.set({ src: 'bkinfo:' + src, isbn, why, len: String(html || '').length, head: String(html || '').slice(0, 20000), at: nowIso(), by: 'cloud', ...W() }); } catch (e) {} }
  /* 예스24 상품 번호: ext_basic에 받아 둔 것(수집기가 그려 읽어 찾음) → 없으면 검색 글 → 그래도 없으면 클라우드 브라우저로 그려 읽기(하루 상한) */
  async function extOf(isbn) { if (ST.ext.has(isbn)) return ST.ext.get(isbn); let o = {}; try { const [d] = await ctx.db.getAll(C('ext_basic').doc(isbn), { fieldMask: ['src.yes24.d.id', 'src.kyobo.d.id', 'src.nl.d.introUrl', 'src.nl.d.tocUrl', 'src.nl.d.kdc', 'src.nl.d.series'] }); const s = (d && d.exists && d.data().src) || {}; o = { y24: s.yes24 && s.yes24.d && s.yes24.d.id, kb: s.kyobo && s.kyobo.d && s.kyobo.d.id, nlIntro: s.nl && s.nl.d && s.nl.d.introUrl, nlToc: s.nl && s.nl.d && s.nl.d.tocUrl, kdc: s.nl && s.nl.d && s.nl.d.kdc, series: s.nl && s.nl.d && s.nl.d.series }; } catch (e) {} if (ST.ext.size > 3000) ST.ext.clear(); ST.ext.set(isbn, o); return o; }
  async function y24Id(isbn, e) { if (e.y24) return { id: String(e.y24), via: 'ext' }; const s = `https://www.yes24.com/product/search?domain=BOOK&query=${isbn}&page=1&size=24`;
    /* 🧬 11/11 진단: 글로 받은 예스24 검색은 첫 화면으로 넘겨짐 → 그려 읽기(하루 상한)로 · 글 검색은 50번에 1번만 다시 시험(예스24가 되돌리면 ST.y24Get = true로 그 길을 다시 씀) */
    const canR = render && capOk('render') && paceWait(P('render'), ST.last.render) === 0; const tryGet = ST.y24Get || Math.random() < 0.02; if (!tryGet && !canR) return { skip: true, why: '그려 읽기 몫 다 씀·간격' };
    let H = ''; let via = 'get'; if (tryGet) { const r = await get('yes24', s); if (r.skip) return { skip: true }; H = String(r.text || ''); ST.y24Get = /itemUnit|yesSchList/.test(H); } if (!/itemUnit|yesSchList/.test(H) && canR) { ST.last.render = Date.now(); ST.used.render = (ST.used.render || 0) + 1; const t0 = Date.now(); let R = null; try { R = await render(s, { re: 'product\\/goods\\/\\d+', reFlags: 'i', html: true, max: 20000 }); } catch (e2) { R = null; } ST.pace.render = paceStep(P('render'), { ok: !!(R && R.ok), ms: Date.now() - t0 }); if (R && R.ok && R.html) { H = R.html; via = 'render'; } }
    const seg = H.split(/<div[^>]+class=["'][^"']*itemUnit[^"']*["']/i)[1] || ''; const m = seg && (seg.match(/class=["']gd_name["'][^>]*href=["'][^"']*\/goods\/(\d{4,})/i) || seg.match(/\/goods\/(\d{4,})/i)); return m ? { id: m[1], via } : { none: !!seg || /검색결과가 없|결과가 없습니다/.test(H), via }; }
  async function kbId(isbn) { const r = await get('kyobo', `https://search.kyobobook.co.kr/search?keyword=${isbn}&gbCode=TOT&target=total`); if (r.skip) return { skip: true }; if (!r.ok) return {}; const H = String(r.text || ''); for (const m of H.matchAll(/<[^>]*data-kbbfn-pid=["'](S\d{6,})["'][^>]*>/g)) { const b = (m[0].match(/data-kbbfn-bid=["'](\d{10,13})["']/) || [])[1]; if (b === isbn) return { id: m[1], via: 'search' }; }
    const any = /data-kbbfn-pid=/.test(H); return any ? { none: true } : /검색결과가 없|결과가 없습니다|검색 결과가 없/.test(H) ? { none: true } : {}; } /* 표지 칸 ISBN이 같은 상품만(공용 파일 ext-core 0.6.4와 같은 기준 — 추천 상품을 잘못 잡지 않게) */
  /* 진단: 화면 꼴(제목 후보·칸 길이·제목 둘레 글) — 읽는 법을 고칠 때 */ async function page(src, isbn) { const e = await extOf(isbn); let url = null; if (src === 'yes24' && e.y24) url = `https://www.yes24.com/Product/Goods/${e.y24}`; if (src === 'kyobo') { const kb = e.kb ? { id: e.kb } : await kbId(isbn); if (kb.id) url = `https://product.kyobobook.co.kr/detail/${kb.id}`; } if (src === 'aladin') url = `https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=${isbn}`; if (!url) return { err: '주소 없음', e };
    const r = await get(src, url); const H = String(r.text || ''); const hs = headings(H); const res = src === 'yes24' ? parseYes24(H, isbn, {}) : parseGeneric(src, H, isbn, {}); const around = hs.slice(0, 12).map((h) => ({ f: h.f, label: h.label, html: H.slice(Math.max(0, h.at - 200), h.end + 500).replace(/\s+/g, ' ') }));
    const tit = [...H.matchAll(/class=["'][^"']*(title_heading|tit_txt|Ere_prod_mconts_LS|section_title|title)[^"']*["'][^>]*>([\s\S]{0,160}?)</gi)].slice(0, 30).map((m) => decodeEnt(m[2]).replace(/\s+/g, ' ').trim()); return { url, st: r.status, len: H.length, ms: r.ms, heads: hs.map((h) => h.label), tit, filled: res.filled, len2: res.t ? Object.fromEntries(Object.entries(res.t).map(([k, v]) => [k, v.length])) : null, b: res.b, around }; }
  /* 한 책 */
  async function one(c) { const isbn = c.isbn; const hv = await health(); const e = await extOf(isbn); let doc = null; const srcs = {}; const rep = (src, res) => { if (res && res.ok) { ST.health = healthAdd(ST.health, src, { paths: res.paths, filled: res.filled, miss: res.miss, shifts: res.shifts, at: nowIso() }); for (const f of res.miss || []) if (isBroken(ST.health, src, f)) return f; } return null; };
    /* ⓪ 예스24 번호를 모르면 교보를 먼저(검색·상품 화면 모두 글로 받음 — 그려 읽기보다 훨씬 가벼움) */ const kbFirst = !e.y24; const doKb = async () => { if (srcs.kyobo || (doc && coreFull(doc)) || !capOk('kyobo')) return; const kb = e.kb ? { id: e.kb, via: 'ext' } : await kbId(isbn); if (!kb.id) { srcs.kyobo = { at: nowIso(), ok: false, none: !!kb.none, why: kb.skip ? '쉬는 중' : kb.none ? '교보에 없음' : '상품 번호를 못 찾음' }; return; } const r = await get('kyobo', `https://product.kyobobook.co.kr/detail/${kb.id}`); if (r.ok) { const res = parseGeneric('kyobo', r.text, isbn, hv); srcs.kyobo = { at: nowIso(), id: kb.id, via: kb.via, ok: !!res.ok, ...(res.ok ? { n: res.filled.length } : { why: res.why }) }; if (res.ok) { doc = merge(doc, res); const bf = rep('kyobo', res); if (bf) probe('kyobo', isbn, r.text, `칸 '${bf}' 비었음`); } } else srcs.kyobo = { at: nowIso(), id: kb.id, ok: false, why: r.err || 'HTTP ' + r.status }; };
    if (kbFirst) await doKb();
    /* ① 예스24 */ if (capOk('yes24') && !(doc && coreFull(doc))) { const id = await y24Id(isbn, e); if (id.id) { const r = await get('yes24', `https://www.yes24.com/Product/Goods/${id.id}`); if (r.ok) { const res = parseYes24(r.text, isbn, hv); srcs.yes24 = { at: nowIso(), id: id.id, via: id.via, ok: !!res.ok, ms: r.ms, ...(res.ok ? { n: res.filled.length } : { why: res.why }) }; if (res.ok) { doc = merge(doc, res); const bf = rep('yes24', res); if (bf) probe('yes24', isbn, r.text, `칸 '${bf}'이 예전엔 잘 채워졌는데 비었음 — 화면이 바뀐 듯`); } } else srcs.yes24 = { at: nowIso(), id: id.id, ok: false, why: r.err || 'HTTP ' + r.status }; } else srcs.yes24 = { at: nowIso(), ok: false, none: !!id.none, why: id.skip ? '쉬는 중' : id.none ? '예스24에 없음' : '상품 번호를 못 찾음', via: id.via }; }
    /* ② 국립중앙도서관 책소개·목차 파일 */ if ((!doc || !doc.t.intro || !doc.t.toc) && (e.nlIntro || e.nlToc) && capOk('nl')) { const t = {}; for (const [f, u] of [['intro', e.nlIntro], ['toc', e.nlToc]]) { if (!u || (doc && doc.t[f]) || !/^https?:\/\//.test(u)) continue; const r = await get('nl', u); const tx = r.ok && r.text && /text|html|json|xml/i.test(String(r.type || 'text')) ? htmlText(r.text) : ''; if (tx && (tx.match(/\uFFFD/g) || []).length < tx.length / 50 && /[가-힣]/.test(tx)) t[f] = clip(tx, f === 'toc' ? 8000 : 6000); } /* 글자가 깨졌거나(EUC-KR 등) 글이 아니면 받지 않음 */ const res = { ok: true, src: 'nl', t, b: { kdc: e.kdc || null, series: e.series || null }, filled: Object.keys(t), miss: [] }; doc = merge(doc, res); srcs.nl = { at: nowIso(), ok: true, n: Object.keys(t).length }; }
    /* ③ 교보(예스24를 먼저 물은 책) */ if (!kbFirst) await doKb();
    /* ④ 알라딘(알라딘 밖에 없거나 모자란 책만 — 예스24가 '없음'이라 했거나 예스24 화면에 핵심 칸이 비었을 때) */ if ((!doc || !coreFull(doc)) && ((srcs.yes24 && (srcs.yes24.none || srcs.yes24.ok)) || (srcs.kyobo && (srcs.kyobo.none || srcs.kyobo.ok))) && ST.cfg && ST.cfg.aladin && capOk('aladin')) { const r = await get('aladin', `https://www.aladin.co.kr/shop/wproduct.aspx?ISBN=${isbn}`, { headers: { Accept: 'text/html' } }); if (r.ok && !/wlogin|login\.aspx/i.test(r.url || '')) { const res = parseGeneric('aladin', r.text, isbn, hv); srcs.aladin = { at: nowIso(), ok: !!res.ok, ...(res.ok ? { n: res.filled.length } : { why: res.why }) }; if (res.ok) { doc = merge(doc, res); const bf = rep('aladin', res); if (bf) probe('aladin', isbn, r.text, `칸 '${bf}' 비었음`); } } else srcs.aladin = { at: nowIso(), ok: false, why: r.err || 'HTTP ' + r.status }; }
    const retry = !doc && srcs.yes24 && !srcs.yes24.ok && !srcs.yes24.none && !(srcs.kyobo && srcs.kyobo.none); /* 몫·쉼 때문에 못 물은 책은 실패로 세지 않음 — 6시간 뒤 다시 */
    return { doc, srcs, retry }; }
  async function save(c, got) { const ref = C('bk_info').doc(c.isbn); const h = ST.have.get(c.isbn) || {}; const tries = got.retry ? h.tries || 0 : (h.tries || 0) + 1; let cur = null; try { const s = await ref.get(); cur = s.exists ? s.data() : null; } catch (e) {}
    const d = got.doc ? merge(cur && cur.t ? { t: cur.t, b: cur.b || {}, from: cur.from || {}, dimg: cur.dimg } : null, { src: '_', t: got.doc.t, b: got.doc.b, dimg: got.doc.dimg }) : (cur ? { t: cur.t || {}, b: cur.b || {}, from: cur.from || {} } : { t: {}, b: {}, from: {} }); if (got.doc) for (const k of Object.keys(got.doc.from || {})) if (!d.from[k] || d.from[k] === '_') d.from[k] = got.doc.from[k];
    const f = FIELDS.map(([x]) => x).filter((x) => d.t && d.t[x]); const full = coreFull(d); const nx = got.retry && !f0(d) ? Date.now() + 6 * 3600e3 : nextAt(d, tries); const len = Object.fromEntries(f.map((x) => [x, d.t[x].length]));
    const out = { v: 1, isbn: c.isbn, title: (d.b && d.b.title) || c.title || null, t: d.t, b: d.b, from: d.from, ...(d.dimg ? { dimg: d.dimg } : {}), f, len, full, tries, nx, at: nowIso(), srcs: { ...((cur && cur.srcs) || {}), ...got.srcs }, st: c.st, ...W() };
    await ref.set(out, { merge: true }); ST.have.set(c.isbn, { ...h, nx, tries, full, f }); return f.length; }
  /* 회차(20초마다 · 한 번에 최대 budgetMs) */
  async function tick(budgetMs) { if (ST.busy) return { skip: '도는 중' }; ST.busy = true; const t0 = Date.now(); let n = 0; try { const c0 = await cfg(); if (!c0.on) return { skip: '꺼짐(app_settings/bkinfo.on)' }; await loadCands(); await loadHave(); await health();
      if (!ST.q || Date.now() - ST.qAt > 30 * 60e3) { ST.q = planQ(ST.cands, ST.have); ST.qi = 0; ST.qAt = Date.now(); }
      while (Date.now() - t0 < (budgetMs || 15000) && ST.qi < ST.q.list.length) { const c = ST.q.list[ST.qi++]; const h = ST.have.get(c.isbn); if (h && h.nx > Date.now()) continue;
        if (!capOk('yes24') && !capOk('kyobo') && !capOk('aladin')) break; try { const got = await one(c); if (got.retry && !got.doc) { ST.have.set(c.isbn, { ...(h || { tries: 0, f: [] }), nx: Date.now() + 6 * 3600e3 }); ST.done.wait = (ST.done.wait || 0) + 1; continue; } /* 몫이 없어 못 물은 책 — 쓰지 않고 6시간 뒤(메모리만) */ const k = await save(c, got); if (k) ST.done.ok++; else ST.done.none++; ST.rate.push(Date.now()); n++; } catch (e) { ST.done.err++; ST.errs.unshift({ at: nowIso(), isbn: c.isbn, why: String(e.message || e).slice(0, 160) }); ST.errs = ST.errs.slice(0, 10); } }
      ST.rate = ST.rate.filter((t) => Date.now() - t < 3600e3); await saveHealth(); if (n) await REF().set({ at: nowIso(), v: VER, done: ST.done, used: { [ST.day]: ST.used }, pace: Object.fromEntries(Object.entries(ST.pace).map(([k, p]) => [k, { gap: p.gap, lat: p.lat, ok: p.ok, err: p.err, pauseUntil: p.pauseUntil ? new Date(p.pauseUntil).toISOString() : null }])), perHour: ST.rate.length, q: ST.q ? { n: ST.q.n, i: ST.qi } : null, ...W() }, { merge: true }).catch(() => {});
      return { n, ms: Date.now() - t0 }; } catch (e) { ST.errs.unshift({ at: nowIso(), why: String(e.message || e).slice(0, 160) }); return { err: e.message }; } finally { ST.busy = false; } }
  /* 🖼 샘플 페이지 — ① 같은 책 다른 매물이 받은 것 함께 쓰기(요청 0 · 한 번 훑기) ② 도서 기록의 미리보기 주소에서 받기(예산 안) */
  async function pvShare() { if (ST.shareDone) return 0; let n = 0; const t0 = Date.now(); while (Date.now() - t0 < 20000) { let q = C('prd_listings').where('previewsStatus', 'in', ['done', 'shared']).select('isbn13', 'previews').limit(300); if (ST.shareCur) q = q.startAfter(ST.shareCur); const ss = await q.get(); if (ss.empty) { ST.shareDone = true; break; } ST.shareCur = ss.docs[ss.docs.length - 1];
      for (const d of ss.docs) { const v = d.data() || {}; const isbn = String(v.isbn13 || '').replace(/\D/g, ''); if (!/^97[89]\d{10}$/.test(isbn)) continue; const h = ST.have.get(isbn); if (h && h.pvN) continue; const list = pvFromListing(v.previews); if (!list.length) continue; await C('bk_info').doc(isbn).set({ isbn, pv: { list, from: 'listing', of: d.id, at: nowIso() }, pvN: list.length, pvAt: nowIso(), ...W() }, { merge: true }); ST.have.set(isbn, { ...(h || { nx: 0, tries: 0 }), pvN: list.length, pvAt: nowIso() }); n++; ST.pv.share++; }
      if (ss.size < 300) { ST.shareDone = true; break; } } return n; }
  async function pvFetch(c0, budget) { let n = 0; const cand = ST.cands.filter((c) => c.bookId && !((ST.have.get(c.isbn) || {}).pvN) && !((ST.have.get(c.isbn) || {}).pvAt)).sort((a, b) => (a.st === 'act' ? 0 : 1) - (b.st === 'act' ? 0 : 1)); ST.pvLeft = cand.length;
    for (const c of cand) { if (n >= budget || !capOk('pvimg')) break; let urls = []; try { const [b] = await ctx.db.getAll(C('prd_books').doc(String(c.bookId)), { fieldMask: ['images.preview', 'previewUrls'] }); const v = (b && b.exists && b.data()) || {}; urls = [].concat((v.images && v.images.preview) || v.previewUrls || []).filter((u) => typeof u === 'string' && /^https:\/\/image\.aladin\.co\.kr\/.*\/letslook\//i.test(u)).slice(0, 16); } catch (e) {}
      const at = nowIso(); if (!urls.length) { await C('bk_info').doc(c.isbn).set({ isbn: c.isbn, pvN: 0, pvAt: at, pv: { list: [], from: 'none', at }, ...W() }, { merge: true }); ST.have.set(c.isbn, { ...(ST.have.get(c.isbn) || { nx: 0, tries: 0 }), pvN: 0, pvAt: at }); ST.pv.none++; continue; }
      const list = []; const dir = 'img/preview/' + pvBookKey(c.isbn); for (let k = 0; k < urls.length; k++) { const r = await get('pvimg', urls[k], { bin: true, timeout: 20000 }); if (!r.ok || !r.buf || r.buf.length < 500 || r.buf.length > 900e3 || !/^image\//.test(String(r.type || 'image/jpeg'))) continue; const ext = (urls[k].match(/\.(jpe?g|png|gif|webp)(\?|$)/i) || [, 'jpg'])[1].toLowerCase(); const path = `${dir}/${k + 1}.${ext}`;
        try { await bucket().file(path).save(r.buf, { contentType: r.type || 'image/' + ext, metadata: { cacheControl: 'public,max-age=31536000,immutable' }, resumable: false }); list.push({ s: path, t: null, n: k + 1, src: urls[k], b: r.buf.length }); ST.pv.imgs++; ST.pv.bytes += r.buf.length; } catch (e) { ST.errs.unshift({ at, why: '미리보기 저장 실패: ' + e.message }); break; } }
      await C('bk_info').doc(c.isbn).set({ isbn: c.isbn, pv: { list, from: 'aladin', at }, pvN: list.length, pvAt: at, ...W() }, { merge: true }); ST.have.set(c.isbn, { ...(ST.have.get(c.isbn) || { nx: 0, tries: 0 }), pvN: list.length, pvAt: at }); if (list.length) { ST.pv.got++; n++; } else ST.pv.none++; }
    return n; }
  async function pvTick() { if (ST.pvBusy) return { skip: '도는 중' }; ST.pvBusy = true; try { const c0 = await cfg(); if (!c0.on || !c0.pvOn) return { skip: '꺼짐' }; await loadCands(); await loadHave(); const sh = await pvShare(); if (ST.pv.day !== kDay()) { ST.pv.day = kDay(); ST.pv.today = 0; }
      const left = ST.pvLeft == null ? ST.cands.filter((c) => c.bookId && !((ST.have.get(c.isbn) || {}).pvAt)).length : ST.pvLeft; const B = pvBudget({ hourKst: kHour(), left, base: c0.pvBase, cap: c0.pvCap, todayDone: ST.pv.today }); const per = Math.ceil(B.n / 12); /* 5분마다 → 한 시간 12번 */
      const got = per > 0 ? await pvFetch(c0, per) : 0; ST.pv.today += got; ST.pv.budget = B; return { share: sh, got, B }; } catch (e) { ST.errs.unshift({ at: nowIso(), why: '미리보기: ' + String(e.message || e).slice(0, 140) }); return { err: e.message }; } finally { ST.pvBusy = false; } }
  /* 진단 — 지금 숫자(우리 상품 몇 권이 채워졌나 · 칸마다 · 출처마다 · 하루 예상량 · 다 모으는 데 걸리는 시간) */
  async function diag(q) { q = q || {}; await loadCands(); if (q.reload) { ST.haveAt = 0; } await loadHave(); const cnt = { all: ST.cands.length, act: ST.cands.filter((c) => c.st === 'act').length };
    const F = {}; const FA = {}; let have = 0, haveAct = 0, full = 0, fullAct = 0, pv = 0, pvAct = 0, pvTried = 0; const stOf = new Map(ST.cands.map((c) => [c.isbn, c.st]));
    for (const [isbn, h] of ST.have) { const st = stOf.get(isbn); if (!st) continue; if (h.pvN) { pv++; if (st === 'act') pvAct++; } if (h.pvAt) pvTried++; if (!h.tries) continue; have++; if (st === 'act') haveAct++; if (h.full) { full++; if (st === 'act') fullAct++; } for (const f of h.f || []) { F[f] = (F[f] || 0) + 1; if (st === 'act') FA[f] = (FA[f] || 0) + 1; } }
    const perH = ST.rate.length; const left = cnt.all - have; const run = (await REF().get().catch(() => null)); return { v: VER, at: nowIso(), cands: cnt, have, haveAct, full, fullAct, fields: F, fieldsAct: FA, pv, pvAct, pvTried, pvState: ST.pv, pvLeft: ST.pvLeft, queue: ST.q ? { n: ST.q.n, i: ST.qi } : null, perHour: perH, perDay: perH * 24, etaH: perH ? Math.round((left / perH) * 10) / 10 : null, used: ST.used, pace: Object.fromEntries(Object.entries(ST.pace).map(([k, p]) => [k, { gap: p.gap, lat: p.lat, ok: p.ok, err: p.err, pause: p.pauseUntil > Date.now() ? Math.round((p.pauseUntil - Date.now()) / 60e3) + '분' : null }])), done: ST.done, errs: ST.errs.slice(0, 6), health: ST.health, run: run && run.exists ? run.data() : null }; }
  async function testOne(isbn) { await cfg(); await health(); const c = { isbn: String(isbn).replace(/\D/g, ''), st: 'act' }; const got = await one(c); return { srcs: got.srcs, f: got.doc ? Object.keys(got.doc.t) : [], len: got.doc ? Object.fromEntries(Object.entries(got.doc.t).map(([k, v]) => [k, v.length])) : {}, b: got.doc ? got.doc.b : null, head: got.doc ? Object.fromEntries(Object.entries(got.doc.t).map(([k, v]) => [k, v.slice(0, 80)])) : {} }; }
  return { tick, pvTick, watchNew, diag, testOne, page, busy: () => ST.busy || ST.pvBusy, state: ST }; }

module.exports = { VER, FIELDS, BASIC, CORE, LABELS, htmlText, headings, byHeadings, parseYes24, parseGeneric, y24Authors, y24Sections, merge, coreFull, choose, healthAdd, isBroken, paceInit, paceStep, paceWait, PACE_DEF, planQ, nextAt, pvBudget, pvFromListing, pvBookKey, pubOf, spec, makeBookInfo };
