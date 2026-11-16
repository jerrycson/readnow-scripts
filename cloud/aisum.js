/* ✍ 상품 요약·추천글 엔진 (aisum1 · 2026-11-14 · 정범님 11/14 18:13 「우리숍 상품 AI 요약 및 추천글 … 이것을 스스로 전담해서 배우고 강화하며 실행할 수 있는 엔진을 만들고, 웹앱에 엔진 연구를 신설해」 · 연구 N14)
 *  글 한 벌(상품마다) = ① 한 줄 요약: 대표 키워드 2개로 · 스포일 없이 · 궁금하게(t1) ② 빈 줄 ③ 한 문장 요약: 키워드 10개 모두로(t2) ④ 빈 줄 ⑤ 판본·외부 요인 홍보(디자인·판형·한정/특별판·전문 번역 등 — 홍보할 값이 있을 때만 · 없으면 비움)(t3)
 *  저장 = ai_sum/{ISBN13} { isbn, title, claude:{…}, engine:{…}, human:{…}, hist[] } — 사람이 고친 글(human)은 어느 쓰기도 덮지 않음(제7조) · 보여 줄 글 = pick(): 사람 → Claude → (단계 3 이상) 엔진
 *  처음엔 Claude가 씀(/kp-in aisum · 진단 aisum=queue로 재료를 받음) · 엔진(AI 없음 · 무료 길)은 매일 그림자로 같은 상품에 써 보고, 같은 칸 채점(구조 규칙·키워드 일치)과 눈가림 견줌(ai_sum_judge — 사람·Claude가 A/B만 보고 고름)으로 단계를 스스로 올리고 내림
 *  단계: 0 후보 · 1 그림자(엔진 글은 기록만) · 2 안내(웹앱 상세에 '엔진 안' 함께) · 3 작게 실제(아무도 안 쓴 상품 몫 5%만 엔진 글을 보임) · 4 전부(새 상품 모두 엔진이 씀) — 규칙 STAGE_RULE · 올림·내림 모두 장부에
 *  배우기: Claude·사람 글에서 '어떤 낱말을 키워드로 고르나'(낱말마다 고른 몫 · 베이즈 수축) · 문서 빈도 · 눈가림 견줌 결과로 첫 줄 틀마다 이긴 몫(베타 · 톰슨 표집) → ai_sum_model
 *  지키는 것: 값·판매 상태·돈을 바꾸지 않음 · 출판사 글을 길게 옮기지 않음(같은 글 25자 넘게 이어지면 채점에서 떨어뜨림 — 저작권) · 손님 정보 없음 · 유료 AI 없음(유료 길은 정범님 허락 카드로만 — 설정 llm 칸은 기본 꺼짐) */
'use strict';
const AS_V = '1.0.1'; // (1.0.1) 모형을 글 한 칸(JSON)으로 저장 — 지도 칸 색인 한도로 첫 회차 쓰기가 막혔던 것
const AS_DEF = {
  on: true, hourKST: 3, // 하루 한 번 03시 넘어(밤 시간 · 다른 셈과 안 겹침)
  qMax: 4000, engDaily: 400, // 차례 길이 · 하루 엔진 그림자 글 수
  copyMax: 25, // 출판사 글과 같은 글이 이만큼 이어지면 '옮김'으로 봄
  small: 0.05, // 3단계에서 엔진 글을 보일 몫(아무도 안 쓴 상품 중)
  llm: false, // 💸 유료 AI 길 — 정범님 허락 전엔 늘 꺼짐(이 판에는 부르는 코드 없음)
};
/* 단계 규칙(근거: 없음 — 처음 값 · app_settings/aisum_cfg.rule로 바꿈) — n = 눈가림 견줌 수 · wt = 엔진이 이기거나 비긴 몫 · rub = 구조 규칙 점수 평균 · kw = Claude 키워드와 겹친 몫 평균 · days = 조건을 이어서 넘은 날 */
const STAGE_RULE = {
  2: { n: 30, wt: 0.35, rub: 0.9, kw: 0.4, days: 3 },
  3: { n: 100, wt: 0.5, rub: 0.95, kw: 0.5, days: 7 },
  4: { n: 200, wt: 0.55, rub: 0.95, kw: 0.55, days: 14, editMax: 0.1 },
  downDays: 3,
};

/* ── 글자 도구 ── */
const HANGUL = /[가-힣]/;
const hasBatchim = (w) => { const s = String(w || '').trim(); const c = s.charCodeAt(s.length - 1); if (c >= 0xac00 && c <= 0xd7a3) return (c - 0xac00) % 28 !== 0; return /[0-9lmnLMN]$/.test(s); };
const josa = (w, pair) => { const [a, b] = pair.split('/'); return w + (hasBatchim(w) ? a : b); }; /* pair = '과/와' · '을/를' · '은/는' · '이/가' · '으로/로' · '이라/라' */
const J = { wa: (w) => josa(w, '과/와'), eul: (w) => josa(w, '을/를'), eun: (w) => josa(w, '은/는'), i: (w) => josa(w, '이/가'), ro: (w) => (/[ㄹ]$/.test(w) ? w + '로' : josa(w, '으로/로')), ira: (w) => josa(w, '이라/라') };
const clean = (s) => String(s == null ? '' : s).replace(/\r/g, '').replace(/[ \t]+/g, ' ').trim();
const clip = (s, n) => { s = clean(s); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
const h32 = (s) => { let h = 2166136261 >>> 0; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }
const r3 = (x) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 1000) / 1000);

/* ── 낱말 뽑기(형태소 분석기 없이 · 업종 낱말 없음) ── */
const JOSA = ['에서부터', '마다', '조차', '마저', '이야말로', '으로부터', '이라는', '에서는', '으로는', '에게서', '까지는', '에서도', '으로도', '이란', '처럼', '에서', '에게', '한테', '으로', '이라', '라는', '까지', '부터', '보다', '이나', '이며', '이고', '에는', '에도', '와의', '과의', '만의', '들의', '들이', '들을', '들은', '들과', '들도', '들', '의', '을', '를', '이', '가', '은', '는', '에', '와', '과', '도', '만', '로', '란'];
const VERBY = /(하다|한다|했다|하는|하며|하고|하게|하여|해서|했던|하던|되는|되어|된다|됐다|되고|있는|있다|있고|없는|없다|위한|대한|통한|같은|않는|않고|않은|이다|였다|이었|니다|어요|아요|는데|면서|도록|듯이|적인|스럽게|스러운|로운|롭게|해야|하면|라고|이라고|다고|냐고|던|며|고서|지만|거나|든지|ㄴ다|겠다|간다|온다|준다|낸다|본다|한|된|할|될|운|은지|는지|을까|ㄹ까|까지도|어진|아진|겨진|워진|해진|혀진|려진|잊힌|담긴|숨긴|놓인|쌓인|는다|았다|었다|겠다|린다|진다|난다|친다|든다|운다|낸다|켰다|렸다|졌다|웠다|았던|었던)$/;
const STOP = new Set(('이것 그것 저것 우리 그리고 하지만 그러나 또한 이런 그런 저런 모든 가장 바로 다시 함께 통해 위해 대해 무엇 어떻게 왜 언제 누구 어디 여기 거기 이번 지난 다음 처음 마지막 하나 둘 셋 정말 매우 아주 너무 많은 많이 조금 이제 오늘 지금 모두 자신 스스로 자기 사람 사람들 우리들 이야기 내용 부분 경우 때문 정도 이상 이하 수록 책 이책 이 그 저 것 수 등 때 중 더 및 각 권 편 장 부 년 월 일 쪽 판 전 후 안 밖 위 아래 속 곳 점 번 개 명 분 씨 님 저자 작가 지은이 옮긴이 역자 출판사 출간 출판 발간 소개 번역 원서 독자 세상 세계 시대 오늘날 과정 방법 문제 의미 생각 마음 시간 순간 하루 모습 가지 만큼 대로 뿐 듯 채 줄 바 데 터 측 간 중심 바탕 대한민국 한국 국내 해외 최고 최초 최근 새로운 다른 같은 여러 수많은 각각 서로 결국 마침내 비로소 특히 다양한 위대한 놀라운 아름다운 유일한 진정한 전체 일부 대부분 출간된 펴낸 펴냈다 출간했다 쓴 썼다 담은 담았다 담긴 보여준다 들려준다 말한다 전한다 이끈다 시작 끝 장편 단편 소설 에세이 산문 시집 신간 개정판 특별판 한정판 양장 페이지 권의 1권 2권 3권').split(/\s+/));
function stem(w0) { let w = String(w0 || '').replace(/^[^가-힣A-Za-z0-9]+|[^가-힣A-Za-z0-9]+$/g, ''); if (!w) return ''; if (!HANGUL.test(w)) return /^[A-Za-z][A-Za-z0-9]{2,}$/.test(w) ? w : '';
  for (const j of JOSA) if (w.length - j.length >= 2 && w.endsWith(j)) { w = w.slice(0, -j.length); break; }
  if (VERBY.test(w) || w.length < 2 || w.length > 9 || /^[0-9]/.test(w) || STOP.has(w)) return ''; return w; }
const tokens = (s) => String(s || '').split(/[^가-힣A-Za-z0-9]+/).map(stem).filter(Boolean);
/* 재료 글 묶음 — 칸마다 무게(제목·목차는 핵심 낱말이 몰림) */
function srcParts(src) { const t = (src && src.t) || {}; const b = (src && src.b) || {}; return [[String(b.title || src.title || ''), 3], [t.intro, 1], [t.pubrev, 1], [t.toc, 1.5], [t.inbook, 0.6], [t.rec, 0.4], [b.series, 1]]; }
function srcText(src) { const t = (src && src.t) || {}; return [t.intro, t.pubrev, t.toc, t.inbook, t.rec, t.auth, t.trans].filter(Boolean).join('\n'); }
/* model = { df:{낱말:문서 수}, N, pick:{낱말:[고른 수, 나온 수]}, tpl:{틀:[이김, 짐]} } */
function keywords(src, model, n) { n = n || 10; model = model || {}; const tf = new Map(); const first = new Map(); let pos = 0;
  for (const [txt, w] of srcParts(src)) { for (const k of tokens(txt)) { tf.set(k, (tf.get(k) || 0) + w); if (!first.has(k)) first.set(k, pos); pos++; } }
  const N = Math.max(1, +model.N || 0); const df = model.df || {}; const P = model.pick || {}; const auth = tokens([src && src.b && src.b.authors, src && src.b && src.b.translators, src && src.b && src.b.publisher].join(' '));
  const sc = []; for (const [k, f] of tf) { if (auth.includes(k)) continue; const idf = Math.log((N + 1) / ((df[k] || 0) + 1)) + 1; const p = P[k] || [0, 0]; const prior = (p[0] + 0.3) / (p[1] + 1); /* 베이즈 수축 — 모르는 낱말은 0.3 */ const early = 1 + 0.4 / (1 + (first.get(k) || 0) / 40);
    sc.push([k, Math.log(1 + f) * idf * (0.4 + prior) * early * (k.length >= 3 ? 1.1 : 1)]); }
  sc.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])); const out = [];
  for (const [k] of sc) { if (out.length >= n) break; if (out.some((o) => o.includes(k) || k.includes(o))) continue; out.push(k); }
  return out; }

/* ── 판본·외부 요인(홍보할 값이 있을 때만) ── 신호마다 무게 · 합이 문턱(1.0) 넘을 때만 글을 씀 */
const EXT = [
  [/한정\s*판|한정\s*수량|넘버링/, '한정판', 1.0, '한정 수량으로 찍은 판본'],
  [/리커버|특별\s*판|스페셜\s*에디션|기념\s*판|에디션/, '특별판', 1.0, '특별판으로 새 옷을 입은 판본'],
  [/양장(본|\s*제본)?|하드\s*커버/, '양장', 0.5, '오래 두고 펼치기 좋은 양장 제본'],
  [/(컬러|올\s*컬러|전면\s*컬러)\s*(도판|화보|일러스트|그림|사진)|도판\s*\d+|화보/, '컬러 도판', 0.6, '컬러 도판을 풍성하게 실은 구성'],
  [/일러스트(레이터)?|삽화|그림\s*작가/, '일러스트', 0.4, '공들인 일러스트'],
  [/완역|무삭제|원전\s*번역|원문\s*그대로/, '완역', 0.6, '줄이지 않은 완역본'],
  [/개정\s*증보|증보\s*판|전면\s*개정/, '개정증보', 0.5, '내용을 더하고 다듬은 개정증보판'],
  [/(노벨|퓰리처|부커|맨부커|공쿠르|휴고|네뷸러|아쿠타가와|나오키|이상문학|동인문학|만해문학)\S*\s*(상|수상)/, '수상작', 0.8, '이름난 문학상 수상작'],
  [/박\s*(가공|인쇄)|금박|은박|사철\s*제본|누드\s*사철|에폭시|형압/, '제본·후가공', 0.6, '손에 닿는 감촉까지 살린 제본·후가공'],
  [/(부록|엽서|굿즈|포스터|책갈피|스티커)\s*(포함|증정|수록|동봉)?/, '부록', 0.4, '소장 욕구를 부르는 부록'],
  [/초판\s*(한정|본)|1쇄\s*한정/, '초판', 0.6, '초판 한정 구성'],
];
const TRANS_PRO = /(교수|박사|전문\s*번역가|번역\s*상|번역\s*대상|원전\s*연구|전공|유학|번역해\s*왔|옮긴\s*책으로|번역서로)/;
function extFeat(src) { const t = (src && src.t) || {}; const b = (src && src.b) || {}; const txt = [b.title, b.series, t.pubrev, t.intro, t.pubintro].filter(Boolean).join('\n'); const hit = []; let w = 0;
  for (const [re, k, wt, ph] of EXT) if (re.test(txt)) { hit.push({ k, ph }); w += wt; }
  const tr = String(b.translators || '').trim(); if (tr && t.trans && TRANS_PRO.test(t.trans)) { hit.push({ k: '전문 번역', ph: `${clip(tr.split(/[,·]/)[0], 20)}의 전문 번역` }); w += 0.6; }
  return { hit, w: Math.round(w * 100) / 100, worth: w >= 1.0 }; }

/* ── 엔진 글쓰기(무료 길 · AI 없음) — 틀 몇 개 중 하나(톰슨 표집 · 견줌에서 이긴 틀이 더 자주) ── */
const T1 = [
  (a, b) => `${J.wa(a)} ${b}, 그 사이에 숨은 진짜 이야기는 무엇일까?`,
  (a, b) => `${J.eul(a)} 따라가다 마주친 ${J.eun(b)} 어떤 얼굴을 하고 있을까?`,
  (a, b) => `${J.wa(a)} ${J.i(b)} 만나는 순간, 무엇이 달라질까?`,
  (a, b) => `왜 하필 ${a}, 그리고 왜 ${b}일까 — 마지막 장을 덮기 전엔 알 수 없다.`,
];
const T2 = [
  (k) => `${J.wa(k[0])} ${k[1]}에서 출발해 ${k[2]}·${k[3]}·${J.eul(k[4])} 거치고, ${J.wa(k[5])} ${J.eul(k[6])} 짚은 뒤 ${k[7]}·${J.eul(k[8])} 지나 마침내 ${k[9]}에 닿는 책이다.`,
  (k) => `${k[0]}·${k[1]}·${k[2]}라는 열쇠로 ${J.wa(k[3])} ${J.eul(k[4])} 열고, ${k[5]}·${k[6]}·${J.eul(k[7])} 차례로 비추며 ${J.wa(k[8])} ${k[9]}의 뜻을 새로 묻는다.`,
  (k) => `${J.wa(k[0])} ${J.i(k[1])} 얽힌 자리에서 ${k[2]}·${k[3]}·${k[4]}의 장면이 펼쳐지고, ${k[5]}·${k[6]}·${J.i(k[7])} 겹쳐지며 ${J.wa(k[8])} ${k[9]}에 대한 답을 건넨다.`,
];
function beta(r, a, b) { /* 베타 표집(작은 정수 근사 — 감마 합) */ const g = (k) => { let s = 0; for (let i = 0; i < k; i++) s -= Math.log(r() || 1e-9); return s; }; const x = g(Math.max(1, Math.round(a))), y = g(Math.max(1, Math.round(b))); return x / (x + y); }
function pickTpl(model, seed, n, key) { const r = rng(seed); const T = (model && model.tpl && model.tpl[key]) || {}; let best = 0, bv = -1; for (let i = 0; i < n; i++) { const w = T[i] || [0, 0]; const v = beta(r, 1 + w[0], 1 + w[1]); if (v > bv) { bv = v; best = i; } } return best; }
function extText(f) { if (!f.worth) return null; const ph = f.hit.map((x) => x.ph); const L = ph.length > 1 ? ph.slice(0, -1).join(', ') + '에 ' + ph[ph.length - 1] : ph[0]; return `${L}까지 — 읽는 즐거움에 소장하는 즐거움을 더한 판본이다.`; }
function engWrite(src, model) { const kw = keywords(src, model, 10); if (kw.length < 10) return { ok: false, why: `키워드 ${kw.length}개뿐(재료 글이 짧음)`, kw };
  const seed = h32((src.isbn || '') + (model && model.v || '')); const lead = [kw[0], kw[1]]; const i1 = pickTpl(model, seed, T1.length, 't1'); const i2 = pickTpl(model, seed ^ 0x9e37, T2.length, 't2');
  const f = extFeat(src); return { ok: true, lead, kw, t1: T1[i1](lead[0], lead[1]), t2: T2[i2](kw), t3: extText(f), tpl: { t1: i1, t2: i2 }, ext: f.hit.map((x) => x.k), extW: f.w }; }

/* ── 채점(같은 칸 · 누가 썼든 같은 자) ── */
const SPOIL = /(결말|범인은|범인이|정체는|죽는다|죽고 만다|반전은|끝내 죽|살아남는다|밝혀진다)/;
function longestCommon(a, b, cap) { a = String(a || ''); b = String(b || ''); if (!a || !b) return 0; cap = cap || 200; let best = 0; const n = Math.min(a.length, 600); /* 짧은 쪽(쓴 글)을 기준으로 미끄럼 */
  for (let i = 0; i < n && best < cap; i++) { let lo = best + 1; while (i + lo <= n && b.includes(a.slice(i, i + lo))) { best = lo; lo++; } } return best; }
function rubric(g, src, cfg) { cfg = { ...AS_DEF, ...(cfg || {}) }; const why = []; let s = 0, of = 0; const add = (c, m, w) => { of += w || 1; if (c) s += w || 1; else why.push(m); };
  const kw = Array.isArray(g && g.kw) ? g.kw : []; const lead = Array.isArray(g && g.lead) ? g.lead : []; const t1 = clean(g && g.t1), t2 = clean(g && g.t2), t3 = clean(g && g.t3);
  add(kw.length === 10 && new Set(kw).size === 10, '키워드 10개 아님'); add(lead.length === 2 && lead.every((k) => kw.includes(k)), '대표 키워드 2개가 10개 안에 없음');
  add(lead.length === 2 && lead.every((k) => t1.includes(k)), '한 줄 요약에 대표 키워드 2개가 없음'); add(t1.length >= 12 && t1.length <= 80 && !/\n/.test(t1), '한 줄 요약 길이·줄'); add(/[?…]|까\.?$|까 —|일까/.test(t1), '궁금하게 만드는 끝맺음 아님', 0.5);
  add(!SPOIL.test(t1), '한 줄 요약에 결말 낱말', 1); const miss = kw.filter((k) => !t2.includes(k)); add(!miss.length, `한 문장 요약에 빠진 키워드 ${miss.join('·')}`, 2);
  add(t2.length >= 50 && t2.length <= 320 && (t2.match(/[.!?](\s|$)/g) || []).length <= 1, '한 문장 요약이 한 문장이 아님·길이'); add(!t3 || (t3.length <= 260), '판본 글 길이', 0.5);
  const st = srcText(src); const cp = Math.max(longestCommon(t1, st), longestCommon(t2, st), t3 ? longestCommon(t3, st) : 0); add(cp <= cfg.copyMax, `재료 글과 ${cp}자 같음(옮김)`, 2);
  return { v: r3(s / of), why, copy: cp }; }
const kwAgree = (a, b) => { const A = new Set((a || []).map(String)), B = new Set((b || []).map(String)); if (!A.size || !B.size) return null; let n = 0; for (const x of A) if (B.has(x)) n++; return r3(n / Math.max(A.size, B.size)); };

/* ── 보여 줄 글 고르기(웹앱·우리숍 같은 뜻) — 사람 → Claude → 엔진(단계 3: 고른 몫만 · 4: 모두) ── */
function pick(doc, stage, small) { if (!doc) return null; const ok = (g) => g && g.t1 && g.t2; if (ok(doc.human)) return { ...doc.human, by: 'human' }; if (ok(doc.claude)) return { ...doc.claude, by: 'claude' };
  const st = +stage || 0; if (ok(doc.engine) && (st >= 4 || (st >= 3 && (h32(String(doc.isbn || '')) % 1000) < (small == null ? AS_DEF.small : small) * 1000))) return { ...doc.engine, by: 'engine' }; return null; }
const pubOf = (g) => (g ? { t1: g.t1, t2: g.t2, t3: g.t3 || null, kw: (g.kw || []).slice(0, 10), lead: (g.lead || []).slice(0, 2), by: g.by } : null);
const textOf = (g) => (g ? [g.t1, g.t2, g.t3].filter(Boolean).join('\n\n') : ''); /* 정범님 꼴: 한 줄 · 빈 줄 · 한 문장 · 빈 줄 · 판본 */

/* ── Claude가 보낸 글 검사(받기 전에) ── */
function checkIn(x) { const g = { isbn: String(x && x.isbn || '').replace(/\D/g, ''), lead: (Array.isArray(x && x.lead) ? x.lead : []).map((k) => clean(k).slice(0, 20)).filter(Boolean), kw: (Array.isArray(x && x.kw) ? x.kw : []).map((k) => clean(k).slice(0, 20)).filter(Boolean), t1: clip(x && x.t1, 120), t2: clip(x && x.t2, 400), t3: x && x.t3 ? clip(x.t3, 300) : null };
  const bad = []; if (!/^97[89]\d{10}$/.test(g.isbn)) bad.push('ISBN'); if (g.kw.length !== 10) bad.push('키워드 10개'); if (g.lead.length !== 2 || !g.lead.every((k) => g.kw.includes(k))) bad.push('대표 2개'); if (!g.lead.every((k) => g.t1.includes(k))) bad.push('t1 대표 키워드');
  const miss = g.kw.filter((k) => !g.t2.includes(k)); if (miss.length) bad.push('t2 빠짐 ' + miss.join('·')); return { g, bad }; }

/* ── 단계 한 걸음(순수) — st = {stage, ok:{2:n일,3:..,4:..}, down:n일} · sc = {n, wt, rub, kw, edit} ── */
function stageStep(st, sc, rule) { rule = rule || STAGE_RULE; st = { stage: 1, ok: {}, down: 0, ...(st || {}) }; const cur = Math.max(1, +st.stage || 1); const ok = { ...st.ok }; const meets = (k) => { const R = rule[k]; if (!R) return false; return (sc.n || 0) >= R.n && (sc.wt || 0) >= R.wt && (sc.rub || 0) >= R.rub && (sc.kw || 0) >= R.kw && (R.editMax == null || (sc.edit || 0) <= R.editMax); };
  for (const k of [2, 3, 4]) ok[k] = meets(k) ? (ok[k] || 0) + 1 : 0; let to = cur, why = null;
  const nx = cur + 1; if (rule[nx] && ok[nx] >= rule[nx].days) { to = nx; why = `${nx}단계 조건(견줌 ${sc.n}번 · 이기거나 비김 ${sc.wt} · 구조 ${sc.rub} · 키워드 ${sc.kw})을 ${ok[nx]}일 이어서 넘음`; }
  let down = cur > 1 && !meets(cur) ? (st.down || 0) + 1 : 0; if (to === cur && cur > 1 && down >= (rule.downDays || 3)) { to = cur - 1; why = `${cur}단계 조건을 ${down}일 이어서 못 넘음 → 한 단계 내림`; down = 0; }
  return { stage: to, ok, down, ch: to !== cur ? { from: cur, to, why } : null }; }

/* ── 배우기(순수) — samples = [{src, kw}] (Claude·사람 글) · judges = [{tpl:{t1,t2}, win:1|0|0.5}] ── */
function learn(prev, samples, judges, dfDocs) { const M = { v: '', N: 0, df: {}, pick: {}, tpl: { t1: {}, t2: {} }, ...(prev || {}) }; const df = { ...(dfDocs ? {} : M.df) }; let N = dfDocs ? 0 : M.N || 0;
  if (dfDocs) for (const src of dfDocs) { N++; for (const k of new Set(srcParts(src).flatMap(([t]) => tokens(t)))) df[k] = (df[k] || 0) + 1; }
  const P = {}; for (const s of samples || []) { const present = new Set(srcParts(s.src).flatMap(([t]) => tokens(t))); const chosen = new Set((s.kw || []).map((k) => stem(k) || k)); for (const k of present) { const p = P[k] || [0, 0]; p[1]++; if (chosen.has(k)) p[0]++; P[k] = p; } }
  const tpl = { t1: {}, t2: {} }; for (const j of judges || []) for (const key of ['t1', 't2']) { const i = j.tpl && j.tpl[key]; if (i == null) continue; const w = tpl[key][i] || [0, 0]; if (j.win >= 0.5) w[0] += j.win === 0.5 ? 0.5 : 1; if (j.win <= 0.5) w[1] += j.win === 0.5 ? 0.5 : 1; tpl[key][i] = w; }
  const keep = (o, n) => Object.fromEntries(Object.entries(o).sort((a, b) => (b[1][1] || b[1]) - (a[1][1] || a[1])).slice(0, n));
  const out = { v: 'm' + h32(JSON.stringify([N, Object.keys(P).length, (samples || []).length, (judges || []).length])).toString(36), N, df: Object.fromEntries(Object.entries(df).sort((a, b) => b[1] - a[1]).slice(0, 20000)), pick: keep(P, 8000), tpl, nS: (samples || []).length, nJ: (judges || []).length };
  return out; }

/* 모형 저장 꼴 — 낱말 수만 개를 Firestore 지도 칸으로 두면 칸마다 색인이 붙어 '색인 항목이 너무 많음'(문서당 한도)으로 쓰기가 막힘(0.35.256 첫 회차) → 글 한 칸(JSON)으로 · 문서 1MB 안(df 12,000 · pick 6,000) */
function modelIn(M) { const top = (o, n) => Object.fromEntries(Object.entries(o || {}).sort((a, b) => (Array.isArray(b[1]) ? b[1][1] : b[1]) - (Array.isArray(a[1]) ? a[1][1] : a[1])).slice(0, n)); return { v: M.v, N: M.N, nS: M.nS || 0, nJ: M.nJ || 0, dfJ: JSON.stringify(top(M.df, 12000)), pickJ: JSON.stringify(top(M.pick, 6000)), tplJ: JSON.stringify(M.tpl || {}) }; }
function modelOut(d) { if (!d) return {}; const P = (x, z) => { try { return x ? JSON.parse(x) : z; } catch (e) { return z; } }; return { v: d.v || '', N: +d.N || 0, nS: +d.nS || 0, nJ: +d.nJ || 0, df: d.df || P(d.dfJ, {}), pick: d.pick || P(d.pickJ, {}), tpl: d.tpl || P(d.tplJ, { t1: {}, t2: {} }) }; }
/* ── 클라우드 묶음 ── D = { C, FV, W, log, nowIso, db, bk: () => BKINFO.state, pulse, found } ── */
function makeAiSum(D) {
  const ST = { q: null, qAt: 0, done: null, doneAt: 0, busy: false, model: null, modelAt: 0 };
  const kDay = (ms) => new Date((ms || Date.now()) + 9 * 3600e3).toISOString().slice(0, 10);
  const kHour = () => new Date(Date.now() + 9 * 3600e3).getUTCHours();
  async function cfg() { let c = {}; try { const d = await D.C('app_settings').doc('aisum_cfg').get(); c = d.exists ? d.data() : {}; } catch (e) {} return { ...AS_DEF, ...c, llm: false, rule: { ...STAGE_RULE, ...(c.rule || {}) } }; } /* llm은 이 판에서 늘 꺼짐 */
  async function state() { try { const d = await D.C('app_settings').doc('aisum_state').get(); return d.exists ? d.data() : {}; } catch (e) { return {}; } }
  async function model() { if (ST.model && Date.now() - ST.modelAt < 3600e3) return ST.model; try { const d = await D.C('app_settings').doc('aisum_model').get(); ST.model = d.exists ? modelOut(d.data()) : {}; } catch (e) { ST.model = {}; } ST.modelAt = Date.now(); return ST.model; }
  async function doneSet(force) { if (ST.done && !force && Date.now() - ST.doneAt < 10 * 60e3) return ST.done; const M = new Map(); const qs = await D.C('ai_sum').select('claude.at', 'human.at', 'engine.at', 'engine.mv').get(); qs.forEach((d) => { const v = d.data() || {}; M.set(d.id, { c: !!(v.claude && v.claude.at), h: !!(v.human && v.human.at), e: !!(v.engine && v.engine.at), mv: v.engine && v.engine.mv || null }); }); ST.done = M; ST.doneAt = Date.now(); return M; }
  /* 차례 — 판매 중 · 책 정보(책소개나 출판사 서평)가 있는 상품을 수요 지수(SP) 높은 순 · 하루 한 번 다시 셈 · app_settings/aisum_q에 앞 4,000권 */
  async function queue(force) { if (ST.q && !force && Date.now() - ST.qAt < 24 * 3600e3) return ST.q; const c = await cfg();
    if (!force && !ST.q) { try { const d = await D.C('app_settings').doc('aisum_q').get(); const v = d.exists ? d.data() : null; if (v && v.s && Date.now() - Date.parse(v.at || 0) < 24 * 3600e3) { ST.q = String(v.s).split(',').filter(Boolean).map((x) => { const [isbn, sp] = x.split(':'); return { isbn, sp: +sp || 0 }; }); ST.qAt = Date.parse(v.at); return ST.q; } } catch (e) {} }
    const B = D.bk ? D.bk() : null; const cands = (B && B.cands) || []; const have = (B && B.have) || new Map(); if (!cands.length) return ST.q || [];
    const act = cands.filter((x) => x.st === 'act' && x.bookId && ((have.get(x.isbn) || {}).f || []).some((f) => f === 'intro' || f === 'pubrev'));
    const sp = new Map(); for (let i = 0; i < act.length; i += 300) { const refs = act.slice(i, i + 300).map((x) => D.C('prd_book_metrics').doc(String(x.bookId))); try { const R = await D.db.getAll(...refs, { fieldMask: ['salesPoint'] }); R.forEach((d, k) => { if (d.exists) sp.set(act[i + k].isbn, +(d.data() || {}).salesPoint || 0); }); } catch (e) { D.log('✍ 요약 차례 SP 읽기 실패', e.message); } }
    const L = act.map((x) => ({ isbn: x.isbn, sp: sp.get(x.isbn) || 0 })).sort((a, b) => b.sp - a.sp || a.isbn.localeCompare(b.isbn)).slice(0, c.qMax);
    ST.q = L; ST.qAt = Date.now(); try { await D.C('app_settings').doc('aisum_q').set({ s: L.map((x) => `${x.isbn}:${x.sp}`).join(','), n: L.length, act: act.length, at: D.nowIso(), ...D.W() }); } catch (e) {} return L; }
  async function srcOf(isbns) { const out = new Map(); for (let i = 0; i < isbns.length; i += 100) { const R = await D.db.getAll(...isbns.slice(i, i + 100).map((k) => D.C('bk_info').doc(k))); R.forEach((d) => { if (d.exists) out.set(d.id, { isbn: d.id, ...d.data() }); }); } return out; }
  const srcPub = (s) => { const t = s.t || {}, b = s.b || {}; return { isbn: s.isbn, title: b.title || null, authors: b.authors || null, translators: b.translators || null, publisher: b.publisher || null, pubDate: b.pubDate || null, cat: b.cat || null, pages: b.pages || null, size: b.size || null, series: b.series || null,
    intro: t.intro ? clip(t.intro, 1800) : null, pubrev: t.pubrev ? clip(t.pubrev, 1500) : null, toc: t.toc ? clip(t.toc, 700) : null, trans: t.trans ? clip(t.trans, 400) : null, rec: t.rec ? clip(t.rec, 300) : null, ext: extFeat(s).hit.map((x) => x.k) }; };
  /* 진단 aisum=queue&n=25 — 아직 Claude·사람 글이 없는 다음 상품의 재료(앞 글자만 · 손님 정보 없음) */
  async function nextBatch(n, skip) { n = Math.max(1, Math.min(40, +n || 25)); const Q = await queue(); const done = await doneSet(true); const want = Q.filter((x) => { const d = done.get(x.isbn); return !(d && (d.c || d.h)); }).slice(+skip || 0, (+skip || 0) + n); const S = await srcOf(want.map((x) => x.isbn));
    return { left: Q.filter((x) => { const d = done.get(x.isbn); return !(d && (d.c || d.h)); }).length, q: Q.length, items: want.map((x) => S.get(x.isbn) ? { sp: x.sp, ...srcPub(S.get(x.isbn)) } : null).filter(Boolean) }; }
  /* /kp-in aisum — Claude 글 받기 · human은 손대지 않음 · 같은 글이면 그대로 · 바뀐 글은 앞 글을 hist에 */
  async function put(P, by) { const L = Array.isArray(P && P.items) ? P.items.slice(0, 300) : []; let n = 0, same = 0; const bad = []; const model = String((P && P.model) || 'claude').slice(0, 40); const S = await srcOf(L.map((x) => String(x && x.isbn || '').replace(/\D/g, '')).filter((k) => /^97[89]\d{10}$/.test(k)));
    for (const x of L) { const { g, bad: b } = checkIn(x); if (b.length) { bad.push({ isbn: g.isbn, why: b.join(', ') }); continue; } const src = S.get(g.isbn) || { isbn: g.isbn }; const rb = rubric(g, src); if (rb.copy > AS_DEF.copyMax) { bad.push({ isbn: g.isbn, why: `재료 글과 ${rb.copy}자 같음` }); continue; }
      const ref = D.C('ai_sum').doc(g.isbn); const ex = (await ref.get()).data() || {}; const cur = ex.claude; if (cur && cur.t1 === g.t1 && cur.t2 === g.t2 && (cur.t3 || null) === g.t3) { same++; continue; }
      const rec = { ...g, at: D.nowIso(), by: String(by || 'claude').slice(0, 40), model, ver: String((P && P.ver) || '1').slice(0, 20), rub: rb.v }; delete rec.isbn;
      await ref.set({ isbn: g.isbn, title: ((src.b || {}).title || ex.title || null), claude: rec, ...(cur ? { hist: D.FV.arrayUnion({ ...cur, gone: D.nowIso() }) } : {}), ...D.W() }, { merge: true }); n++; if (ST.done) ST.done.set(g.isbn, { ...(ST.done.get(g.isbn) || {}), c: true }); }
    if (n) { try { await D.C('app_settings').doc('aisum_state').set({ claudeIn: D.FV.increment(n), claudeLastAt: D.nowIso() }, { merge: true }); } catch (e) {} }
    return { n, same, bad: bad.slice(0, 30) }; }
  /* 눈가림 견줌 — 진단 aisum=pairs&n=20: Claude(또는 사람) 글과 엔진 글을 A/B로 섞어 줌(누가 썼는지 안 알림 · tok에만 숨김) · /kp-in aisumJudge:[{tok, pick:'A'|'B'|'='}] · 웹앱도 같은 칸(ai_sum_judge)에 씀 */
  const tokOf = (isbn, aIs) => `${isbn}.${aIs === 'engine' ? 'e' : 'c'}.${h32(isbn + aIs + 'aisum').toString(36)}`;
  async function pairs(n) { n = Math.max(1, Math.min(40, +n || 20)); const qs = await D.C('ai_sum').where('engine.ok', '==', true).limit(400).get(); const L = []; qs.forEach((d) => { const v = d.data() || {}; const other = v.human && v.human.t1 ? v.human : v.claude; if (other && other.t1 && v.engine && v.engine.t1) L.push({ isbn: d.id, title: v.title || null, e: v.engine, o: other, jn: +v.jn || 0 }); });
    L.sort((a, b) => a.jn - b.jn || h32(a.isbn + kDay()) - h32(b.isbn + kDay())); return { items: L.slice(0, n).map((x) => { const eA = h32(x.isbn + Date.now()) % 2 === 0; const A = eA ? x.e : x.o, B = eA ? x.o : x.e; return { tok: tokOf(x.isbn, eA ? 'engine' : 'other'), isbn: x.isbn, title: x.title, A: textOf(A), B: textOf(B) }; }) }; }
  async function judge(L, by) { let n = 0; const bad = []; for (const j of (Array.isArray(L) ? L : []).slice(0, 200)) { const m = String(j && j.tok || '').match(/^(97[89]\d{10})\.(e|c)\.([0-9a-z]+)$/); if (!m || tokOf(m[1], m[2] === 'e' ? 'engine' : 'other') !== m[0] || !/^(A|B|=)$/.test(String(j.pick || ''))) { bad.push(String(j && j.tok || '').slice(0, 30)); continue; }
      const aIsEng = m[2] === 'e'; const win = j.pick === '=' ? 0.5 : (j.pick === 'A') === aIsEng ? 1 : 0; const d = (await D.C('ai_sum').doc(m[1]).get()).data() || {};
      await D.C('ai_sum_judge').add({ isbn: m[1], win, pick: j.pick, aIs: aIsEng ? 'engine' : 'other', tpl: (d.engine && d.engine.tpl) || null, mv: (d.engine && d.engine.mv) || null, by: String(by || 'claude').slice(0, 40), why: j.why ? String(j.why).slice(0, 200) : null, at: D.nowIso(), ...D.W() }); await D.C('ai_sum').doc(m[1]).set({ jn: D.FV.increment(1) }, { merge: true }); n++; }
    return { n, bad: bad.slice(0, 10) }; }
  /* 매일 회차(AI 없음) — ① 차례 다시 셈 ② 배우기 ③ 엔진 그림자 글 ④ 채점 ⑤ 단계 ⑥ 장부·연구 기록 */
  async function daily(o) { o = o || {}; if (ST.busy) return { skip: '도는 중' }; const c = await cfg(); if (!c.on && !o.force) return { skip: '꺼짐(app_settings/aisum_cfg.on)' }; const today = kDay(); const S0 = await state();
    if (!o.force && (S0.day === today || kHour() < c.hourKST)) return { skip: '오늘 함' }; ST.busy = true; const t0 = Date.now();
    try { const Q = await queue(true); const done = await doneSet(true); const qs = await D.C('ai_sum').get(); const docs = []; qs.forEach((d) => docs.push({ id: d.id, ...d.data() }));
      const ref = docs.filter((d) => (d.human && d.human.t1) || (d.claude && d.claude.t1)); const S = await srcOf(ref.map((d) => d.id));
      /* ② 배우기 — 문서 빈도는 차례 앞 1,500권 재료로 · 고르는 몫은 Claude·사람 글로 · 틀 이긴 몫은 견줌으로 */ const dfIs = Q.slice(0, 1500).map((x) => x.isbn); const DF = await srcOf(dfIs.filter((k) => !S.has(k))); for (const [k, v] of S) DF.set(k, v);
      const J0 = []; try { (await D.C('ai_sum_judge').get()).forEach((d) => J0.push(d.data())); } catch (e) {}
      const samples = ref.map((d) => ({ src: S.get(d.id), kw: (d.human && d.human.kw && d.human.kw.length ? d.human.kw : (d.claude || {}).kw) || [] })).filter((x) => x.src);
      const M = learn(await model(), samples, J0, [...DF.values()]); await D.C('app_settings').doc('aisum_model').set({ ...modelIn(M), at: D.nowIso(), ...D.W() }); ST.model = M; ST.modelAt = Date.now();
      /* ③ 엔진 그림자 글 — 견줄 짝(Claude·사람 글 있음)을 먼저, 남는 몫은 차례 앞(아직 아무도 안 씀) */ const targets = [...ref.map((d) => d.id), ...Q.map((x) => x.isbn).filter((k) => !(done.get(k) || {}).c && !(done.get(k) || {}).h)].filter((k, i, a) => a.indexOf(k) === i).slice(0, c.engDaily);
      const TS = await srcOf(targets.filter((k) => !S.has(k))); for (const [k, v] of S) TS.set(k, v); let wrote = 0, fail = 0; const rubs = [], kws = [], copies = [];
      for (const k of targets) { const src = TS.get(k); if (!src) continue; const g = engWrite(src, M); const d0 = docs.find((d) => d.id === k) || {}; if (!g.ok) { fail++; await D.C('ai_sum').doc(k).set({ isbn: k, engine: { ok: false, why: g.why, at: D.nowIso(), mv: M.v, v: AS_V } }, { merge: true }); continue; }
        const rb = rubric(g, src, c); const other = d0.human && d0.human.kw ? d0.human : d0.claude; const ka = other ? kwAgree(g.kw, other.kw) : null; rubs.push(rb.v); if (ka != null) kws.push(ka); copies.push(rb.copy);
        await D.C('ai_sum').doc(k).set({ isbn: k, title: d0.title || (src.b || {}).title || null, engine: { ok: true, ...g, rub: rb.v, rubWhy: rb.why.slice(0, 6), kwAgree: ka, at: D.nowIso(), mv: M.v, v: AS_V }, ...D.W() }, { merge: true }); wrote++; }
      /* ④ 채점 — 최근 30일 견줌 · 사람이 엔진 글을 고친 몫(엔진 글이 보였던 상품 중) */ const since = new Date(Date.now() - 30 * 864e5).toISOString(); const J30 = J0.filter((j) => String(j.at || '') >= since); const jHum = J30.filter((j) => !/^claude/.test(String(j.by || ''))); const wt = J30.length ? r3(J30.reduce((s, j) => s + (+j.win || 0), 0) / J30.length) : null;
      const shownEng = docs.filter((d) => d.engine && d.engine.ok && d.humanOver === 'engine'); const edit = shownEng.length ? r3(shownEng.length / Math.max(1, docs.filter((d) => d.shownBy === 'engine').length)) : 0;
      const sc = { n: J30.length, nHuman: jHum.length, wt: wt || 0, rub: rubs.length ? r3(rubs.reduce((a, b) => a + b, 0) / rubs.length) : 0, kw: kws.length ? r3(kws.reduce((a, b) => a + b, 0) / kws.length) : 0, edit, copyMax: copies.length ? Math.max(...copies) : 0 };
      /* ⑤ 단계 */ const step = stageStep(S0.st, sc, c.rule); const log0 = Array.isArray(S0.log) ? S0.log.slice(-59) : [];
      const left = Q.filter((x) => { const d = done.get(x.isbn); return !(d && (d.c || d.h)); }).length; const nC = docs.filter((d) => d.claude && d.claude.t1).length, nH = docs.filter((d) => d.human && d.human.t1).length;
      const fixes = []; if (M.nS) fixes.push(`Claude·사람 글 ${M.nS}벌에서 키워드 고르는 몫을 다시 배움(낱말 ${Object.keys(M.pick).length}개)`); if (M.nJ) fixes.push(`견줌 ${M.nJ}번으로 첫 줄·한 문장 틀 이긴 몫 다시 셈`);
      const B = D.bk ? D.bk() : null; const realDay = B && B.real ? B.real.h24 : null; const hard = []; if (!sc.n) hard.push('눈가림 견줌이 아직 0 — 사람·Claude가 A/B를 골라 줘야 단계 2 판정이 시작됨'); if (sc.kw < 0.4) hard.push(`엔진 키워드가 Claude 것과 ${Math.round(sc.kw * 100)}%만 겹침 — 낱말 뽑기가 아직 얕음(형태소 분석 없음)`); if (realDay === 0) hard.push('책 정보 모으기가 24시간 0권 — 재료 멈춤');
      const next = step.stage < 2 ? `견줌 ${Math.max(0, c.rule[2].n - sc.n)}번 더 · 키워드 겹침 ${c.rule[2].kw} 넘기` : step.stage < 4 ? `${step.stage + 1}단계 조건 ${c.rule[step.stage + 1].days}일 이어 넘기` : '전부 맡음 — 사람 고침 몫 지켜보기';
      const entry = { d: today, at: D.nowIso(), saw: `차례 ${Q.length}권(판매 중·책 정보 있음) · 아직 안 쓴 ${left} · Claude 글 ${nC} · 사람 글 ${nH} · 견줌 30일 ${sc.n}`, did: `엔진 그림자 글 ${wrote}벌(실패 ${fail}) · 모형 ${M.v}`, why: step.ch ? step.ch.why : '단계 그대로', sc, stage: step.stage, fix: fixes };
      log0.push(entry); const st = { stage: step.stage, ok: step.ok, down: step.down, since: step.ch ? today : (S0.st && S0.st.since) || today };
      const trend = (Array.isArray(S0.trend) ? S0.trend : []).filter((t) => t && t.d !== today).slice(-89); trend.push({ d: today, rub: sc.rub, kw: sc.kw, wt: sc.wt, n: sc.n });
      const doc = { v: AS_V, day: today, at: D.nowIso(), st, sc, q: Q.length, left, nC, nH, nE: wrote, fail, mv: M.v, trend, log: log0, fixes, hard, next, ms: Date.now() - t0, stageLog: [...(Array.isArray(S0.stageLog) ? S0.stageLog.slice(-19) : []), ...(step.ch ? [{ d: today, ...step.ch }] : [])] };
      await D.C('app_settings').doc('aisum_state').set({ ...doc, ...D.W() }, { merge: true });
      try { await D.C('eng_ledger').doc(`aisum_${today}`).set({ kind: 'aisum', v: AS_V, at: doc.at, day: today, by: o.by || 'engine', saw: entry.saw, did: entry.did, why: entry.why, sc, stage: step.stage, ch: step.ch, fixes, hard, ...D.W() }); } catch (e) {}
      if (D.pulse) { try { await D.pulse({ day: today, studies: { N14: { at: Date.now(), metric: '엔진 글 구조 점수(0~1) · 키워드 겹침 · 눈가림 이기거나 비김 몫', value: sc.rub, trend: trend.map((t) => ({ d: t.d, v: t.rub })), changed: step.ch ? `단계 ${step.ch.from}→${step.ch.to}` : '단계 그대로', note: `✍ 엔진(AI 없음) 그림자 ${wrote}벌 · Claude 글 ${nC} · 사람 ${nH} · 키워드 겹침 ${sc.kw} · 견줌 ${sc.n}번(이기거나 비김 ${sc.wt}) · 단계 ${step.stage}`, src: 'cloud aisum ' + AS_V } } }, 'engine:aisum'); } catch (e) {} }
      D.log('✍ 요약 엔진', entry.saw, '·', entry.did, '· 단계', step.stage); return { wrote, fail, stage: step.stage, sc, ms: doc.ms }; }
    finally { ST.busy = false; } }
  async function diag(q) { q = q || {}; const k = String(q.aisum || '1'); if (k === 'queue') return nextBatch(q.n, q.skip); if (k === 'pairs') return pairs(q.n); if (/^97[89]\d{10}$/.test(k)) { const d = (await D.C('ai_sum').doc(k).get()).data() || null; const s = (await srcOf([k])).get(k); return { doc: d, eng: s ? engWrite(s, await model()) : null, src: s ? srcPub(s) : null }; }
    if (k === 'run') return daily({ force: true, by: 'diag' }); const S = await state(); return { v: AS_V, st: S.st || null, sc: S.sc || null, q: S.q, left: S.left, nC: S.nC, nH: S.nH, nE: S.nE, day: S.day, next: S.next, hard: S.hard, log: (S.log || []).slice(-5), claudeIn: S.claudeIn || 0 }; }
  async function forShop(isbn) { if (!/^97[89]\d{10}$/.test(String(isbn || ''))) return null; const d = await D.C('ai_sum').doc(isbn).get(); if (!d.exists) return null; const S = await stageCached(); return pubOf(pick(d.data(), S.stage, S.small)); }
  let SC = { at: 0, v: { stage: 1, small: AS_DEF.small } }; async function stageCached() { if (Date.now() - SC.at < 10 * 60e3) return SC.v; try { const s = await state(); const c = await cfg(); SC = { at: Date.now(), v: { stage: (s.st && s.st.stage) || 1, small: c.small } }; } catch (e) {} return SC.v; }
  return { daily, diag, put, judge, pairs, nextBatch, queue, forShop, busy: () => ST.busy };
}
module.exports = { AS_V, AS_DEF, STAGE_RULE, hasBatchim, josa, stem, tokens, keywords, extFeat, extText, engWrite, rubric, kwAgree, pick, pubOf, textOf, checkIn, stageStep, learn, longestCommon, modelIn, modelOut, makeAiSum };
