/* col2-voice-core.js — (정범님 11/10 '판매자 구매평·문의 글 전부 모아 소비자가 무엇을 중요하게 보는지 연구') 🗣 판매자 목소리 모으기 — 순수 함수(Node·브라우저 같이)
 *  · 알라딘 비로그인 공개 화면만: 판매자 숍 '구매 만족도'(wshopsurvey.aspx · 쪽 넘기며) · 숍 첫 화면에서 찾은 '판매자에게 문의하기' 목록 화면(주소 꼴은 화면의 링크에서 찾음 — 로그인 화면이면 건너뜀)
 *  · 작성자 아이디는 앞 2자 + '***'로만 남김(손님 개인 정보 · 정범님 11/10) — 해석 단계에서 바로 가림
 *  · 중복 없이 이어서: 글마다 열쇠(날짜·만족도·글·가린 아이디) → 판매자마다 최근 열쇠 고리(ring)로 쪽 경계·다시 읽기 중복을 거름
 *  · Firestore 문서 크기 한도(1MiB) 안: 판매자마다 조각 문서(글 200개 또는 글자 40만 자에서 끊음)
 *  · 비중 스스로 조절: 처음엔 그림자 일 차례의 큰 몫 → 모은 판매자 몫·지난 날이 늘수록 다른 일과 같은 몫으로(shareOf) */
(function (root) {
  'use strict';
  const VERSION = '0.1.0';
  /* 설정 기본값 — 근거: 없음, 설정으로 바꿈(col2.json jobs.voiceCfg) */
  const CFG = { start: 0.6, rampDays: 45, burst: 8, flushN: 200, flushChars: 400000, ringN: 60, incEveryH: 24, findEveryD: 30, listN: 200, listEveryH: 12, maxPagesSeller: 5000, qnaMaxPages: 300 };

  /* 작성자 아이디 가림 — 보이는 앞 2자 + '***' (알라딘이 이미 가린 '*'는 떼고 셈) · 없으면 null */
  function maskId(a) { const s = String(a == null ? '' : a).replace(/\s+/g, '').replace(/\*+/g, ''); if (!s) return null; return Array.from(s).slice(0, 2).join('') + '***'; }
  /* 짧은 지문(FNV-1a 32비트 · 36진) — 열쇠 비교용(암호 아님) */
  function h32(s) { let h = 0x811c9dc5; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(36); }
  const norm = (t) => String(t == null ? '' : t).replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  const revKey = (x) => h32(['r', x.d, x.r || '', norm(x.c).slice(0, 200), x.a || ''].join('|'));
  const qnaKey = (x) => h32(['q', x.no || '', x.d || '', norm(x.t).slice(0, 200), x.a || ''].join('|'));

  /* 주소 꼴 — 구매 만족도 쪽(쪽 번호 아무것) · 문의 목록(숍 화면에서 찾은 링크 · 이름에 문의 낱말 · 판매자 센터·로그인·쓰기 화면 아님) */
  const SURVEY_RE = /^\/shop\/UsedShop\/wshopsurvey\.aspx\?SC=\d{1,10}&page=\d{1,5}$/;
  const QNA_RE = /^\/shop\/usedshop\/([A-Za-z_]{3,40})\.aspx\?SC=\d{1,10}(?:&[A-Za-z]{1,12}=\d{1,6}){0,3}$/i;
  const QNA_NAME = /(qna|question|inquir|ask|board|counsel|faq)/i, QNA_BAD = /(scm|login|logout|manage|admin|write|regist|order|mypage|cart|pay)/i;
  const surveyPath = (sc, page) => `/shop/UsedShop/wshopsurvey.aspx?SC=${sc}&page=${+page || 1}`;
  function qnaPathOk(p) { const m = QNA_RE.exec(String(p || '')); return !!(m && QNA_NAME.test(m[1]) && !QNA_BAD.test(m[1])); }
  function surveyPathOk(p) { return SURVEY_RE.test(String(p || '')); }
  /* 문의 목록 쪽 주소 — 찾은 꼴에 page를 바꾸거나 붙임 */
  function qnaPage(base, page) { const p = String(base || ''); if (!qnaPathOk(p)) return null; const n = Math.max(1, Math.min(99999, +page || 1)); const q = /([?&])page=\d+/i.test(p) ? p.replace(/([?&])page=\d+/i, `$1page=${n}`) : `${p}&page=${n}`; return qnaPathOk(q) ? q : null; }

  /* 숍 첫 화면 → '판매자에게 문의하기' 목록 링크 { path, n(보이는 글 수) } · 못 찾으면 null
   *  a[href] 또는 onclick 안 주소 · 같은 숍 번호(SC)만 · 주소 꼴(qnaPathOk) 밖이면 버림 */
  function findQnaLink(doc) { const out = []; const sc0 = (() => { const c = doc.querySelector('link[rel="canonical"]'); const m = /SC=(\d{1,10})/i.exec((c && c.getAttribute('href')) || ''); return m ? m[1] : null; })();
    doc.querySelectorAll('a').forEach((a) => { const t = norm(a.textContent); if (!/문의/.test(t)) return; const raw = [a.getAttribute('href') || '', a.getAttribute('onclick') || ''].join(' ');
      const m = /(\/shop\/usedshop\/[A-Za-z_]{3,40}\.aspx\?[^'"\s)]*)/i.exec(raw); if (!m) return; let u; try { u = new URL(m[1].replace(/&amp;/g, '&'), 'https://www.aladin.co.kr'); } catch (e) { return; }
      const sc = u.searchParams.get('SC') || u.searchParams.get('sc'); if (!/^\d{1,10}$/.test(sc || '') || (sc0 && sc !== sc0)) return;
      const keep = [...u.searchParams.entries()].filter(([k, v]) => !/^sc$/i.test(k) && /^[A-Za-z]{1,12}$/.test(k) && /^\d{1,6}$/.test(v) && !/^page$/i.test(k)).slice(0, 2).map(([k, v]) => `&${k}=${v}`).join('');
      const path = `${u.pathname.replace(/^\/shop\/usedshop\//i, '/shop/usedshop/')}?SC=${sc}${keep}`; if (!qnaPathOk(path)) return; const nm = /\(\s*([\d,]+)\s*\)/.exec(t); out.push({ path, n: nm ? +nm[1].replace(/,/g, '') : null, t: t.slice(0, 30) }); });
    return out[0] || null; }

  /* 문의 목록 한 쪽 → { rows: [{ no, d, t(질문 제목·글), a(가린 아이디), sec(비밀글), ans(답 있음 true·없음 false·모름 null), reply(답 글 — 같은 화면에 보일 때만) }], lastPage }
   *  화면 모양을 모르므로 줄(tr·li)마다 날짜 칸이 있는 것을 글 하나로 봄 · 날짜 없는 바로 다음 줄에 '답변' 글이 있으면 그 글의 답 · 화면 모양이 다르면 rows가 비고 n(줄 수)만 남김 */
  const DATE_RE = /(20\d{2})[.\-/](\d{1,2})[.\-/](\d{1,2})/;
  function parseQnaPage(doc) { const rows = []; const T = (el) => norm(el && el.textContent);
    const lines = [...doc.querySelectorAll('tr')]; const L = lines.length ? lines : [...doc.querySelectorAll('li')];
    for (let i = 0; i < L.length; i++) { const el = L[i]; const cells = el.children && el.children.length ? [...el.children].map(T).filter(Boolean) : [T(el)]; const all = cells.join(' | '); const dm = DATE_RE.exec(all);
      if (!dm) { const last = rows[rows.length - 1]; if (last && !last.reply && /^(A\.?|답변|└|\[답변\])/.test(all) && all.length > 4) { last.reply = all.replace(/^(A\.?|답변\s*[:：]?|└|\[답변\])\s*/, '').slice(0, 1000); if (last.ans == null) last.ans = true; } continue; }
      if (/^(번호|제목|작성자|등록일|상태)/.test(cells[0] || '') && cells.length > 2 && cells.every((c) => c.length < 6)) continue; /* 머리 줄 */
      const d = `${dm[1]}-${String(dm[2]).padStart(2, '0')}-${String(dm[3]).padStart(2, '0')}`;
      const img = el.querySelector ? el.querySelector('img[alt*="비밀"], img[alt*="잠금"], [class*="secret"], [class*="lock"]') : null; const sec = /비밀글|비공개|비밀 글/.test(all) || !!img;
      const ans = /답변\s*완료|답변완료|처리\s*완료/.test(all) ? true : /답변\s*(대기|전|중)|미답변|접수/.test(all) ? false : null;
      const noC = cells.find((c) => /^\d{1,9}$/.test(c)); const aC = cells.find((c) => /\*/.test(c) && c.length <= 30) || null;
      const t = cells.filter((c) => c !== noC && c !== aC && !DATE_RE.test(c) && !/^(답변\s*(완료|대기|전|중)|미답변|비밀글|처리\s*완료|접수)$/.test(c)).sort((x, y) => y.length - x.length)[0] || '';
      rows.push({ no: noC || null, d, t: sec ? '' : t.slice(0, 1000), a: maskId(aC), sec, ans, reply: null }); }
    const html = doc.documentElement ? doc.documentElement.innerHTML : ''; const nums = [...html.matchAll(/(?:(?:[?&]|&amp;)page=|Page_Set\(['"]?|goPage\(['"]?)(\d{1,5})/gi)].map((m) => +m[1]);
    return { rows, lastPage: nums.length ? Math.max(...nums) : 1, n: L.length }; }

  /* 구매 만족도 쪽(운영 공용 파일 ReadnowSellers.parseSurveyPage 결과) → 저장 꼴(아이디 가림) */
  const revRows = (pg) => ((pg && pg.rows) || []).filter((x) => x && /^\d{4}-\d{2}-\d{2}$/.test(String(x.d || ''))).map((x) => ({ d: x.d, r: x.r || null, c: norm(x.c).slice(0, 500), a: maskId(x.a) }));
  const qnaRows = (pg) => ((pg && pg.rows) || []).filter((x) => x && x.d).map((x) => ({ no: x.no || null, d: x.d, t: x.sec ? '' : norm(x.t).slice(0, 1000), a: maskId(x.a), sec: !!x.sec, ans: x.ans == null ? null : !!x.ans, reply: x.reply ? norm(x.reply).slice(0, 1000) : null }));

  /* 고리(ring)로 새 글만 — 반환 { fresh, seen(이미 본 글 수) } · ring은 바로 고침(최근 ringN개만) */
  function takeNew(rows, ring, keyOf, ringN) { const R = Array.isArray(ring) ? ring : []; const S = new Set(R); const fresh = []; let seen = 0;
    for (const x of rows) { const k = keyOf(x); if (S.has(k)) { seen++; continue; } S.add(k); R.push(k); fresh.push({ ...x, k }); }
    while (R.length > (ringN || CFG.ringN)) R.shift(); return { fresh, seen, ring: R }; }
  /* 조각으로 끊을 때인지 — 글 수·글자 수 */
  const bufChars = (buf) => (buf || []).reduce((n, x) => n + String(x.c || x.t || '').length + String(x.reply || '').length + 40, 0);
  const needFlush = (buf, cfg) => { const c = { ...CFG, ...(cfg || {}) }; return (buf || []).length >= c.flushN || bufChars(buf) >= c.flushChars; };
  const shardId = (sc, kind, seq) => `${sc}_${kind}${String(seq).padStart(4, '0')}`;

  /* 판매자 하나 모은 정도(0~1) — 구매평 끝까지 · 문의는 끝까지 또는 '없음/로그인 필요' */
  const sellerDone = (s) => !!(s && s.r && s.r.done && s.q && (s.q.done || s.q.state === 'none' || s.q.state === 'login'));
  /* 비중 — 처음엔 start(큰 몫) → 모은 판매자 몫(cover)·지난 날(rampDays)이 늘수록 eq(다른 일과 같은 몫)로 · 다른 일이 없으면 1 */
  function shareOf(o, cfg) { const c = { ...CFG, ...(cfg || {}) }; const others = Math.max(0, +o.others || 0); if (!others) return { share: 1, p: null, eq: 1, why: '다른 그림자 일 차례 없음 — 남는 차례 모두' };
    const eq = 1 / (others + 1); const start = Math.max(eq, Math.min(0.95, c.start)); const days = o.since ? Math.max(0, ((o.now || Date.now()) - o.since) / 864e5) : 0;
    const cover = o.known ? Math.min(1, (o.done || 0) / o.known) : 0; const p = Math.min(1, Math.max(cover, days / Math.max(1, c.rampDays)));
    const share = Math.round((eq + (start - eq) * (1 - p)) * 1000) / 1000;
    return { share, p: Math.round(p * 1000) / 1000, eq: Math.round(eq * 1000) / 1000, cover: Math.round(cover * 1000) / 1000, days: Math.round(days * 10) / 10, why: `처음 몫 ${Math.round(start * 100)}% → 같은 몫 ${Math.round(eq * 100)}% · 진행 ${Math.round(p * 100)}%(모은 판매자 ${Math.round(cover * 100)}% · ${Math.round(days)}/${c.rampDays}일)` }; }
  /* 이번 차례가 목소리 몫인지 — 오늘 쓴 차례(v·o)의 비율이 몫보다 작으면 */
  const turnIsVoice = (v, o, share) => (share >= 1 ? true : share <= 0 ? false : (v || 0) / Math.max(1, (v || 0) + (o || 0)) < share);

  const api = { VERSION, CFG, maskId, h32, revKey, qnaKey, SURVEY_RE, QNA_RE, surveyPath, surveyPathOk, qnaPathOk, qnaPage, findQnaLink, parseQnaPage, revRows, qnaRows, takeNew, bufChars, needFlush, shardId, sellerDone, shareOf, turnIsVoice };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2Voice = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
