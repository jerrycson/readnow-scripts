/* readnow-relist-core.js — 🔁 다시 올리기 목적 엔진 (일꾼 anom2 · 정범님 11/13 14:03 「판매자들이 이렇게 판매가 아닌 사라짐을 일부러 하는 이유도 엔진이 알아내게 해줘 · 어떤 목적으로 왜 사라지게 하는지」)
 * 왜: 🧠 자료 이상 판단(readnow-anom-core.js · anom1)이 '사라짐이 팔림이냐 아니냐'를 가린다면, 이 엔진은 '팔림이 아닌 사라짐(내렸다 새 번호로 다시 올림)을 판매자가 왜 하느냐'를 가린다.
 *   재료(이미 모은 것만 · 다른 판매자의 공개 숍 정보 · 손님 정보 없음 · 값을 바꾸거나 돈 드는 실험 없음 = 헌장 제33조 무손해):
 *     회차마다 사라짐 줄(goneList)과 같은 창의 새로 올림 줄(addList — 앞 회차 + 이번 회차) → 같은 제목(앞 40자·띄어쓰기 뺌)이면 짝(사라진 것 X ↔ 다시 올라온 것 Y)
 *     우연 몫 = 안 사라진 옛 상품(창 앞부터 있던 것)의 제목이 같은 창 새로 올림에 있는 몫(상품 수 무게) — 짝 수에서 이만큼은 우연(같은 책 한 권 더 들여옴)
 *   가설(목적) 여덟: 새 상품 노출·순위 되살리기 · 값 다시 매기기 · 등급·설명 바꾸기 · 최저가 표시 되찾기 · 팔린 뒤 같은 책 다시 들여옴(진짜 팔림) · 재고 확인(잠깐 내림) · 오래된 상품 정리 · 다른 판매처로 옮김(자료 없음)
 *   효과: 다시 올린 Y가 그 뒤 하루에 사라지는 몫(팔림 속도) ↔ ① 그대로 둔 옛 상품(처음부터 있던 것)의 하루 사라짐 ② 같은 창에 새로 올라온 다른 상품(값 맞춘 대조군)
 *   스스로 채점(anom1 verify 방식 · 사람을 교사·표본으로 쓰지 않음 — 사실 F32): 판정 때 '다음 회차들에 이렇게 보일 것' 예측(습관·주된 목적·효과 방향)을 남기고, 뒤 회차 자료로 맞음/틀림을 매겨 가설 무게를 고침
 * 순수 함수 · 저장·네트워크 없음 · 클라우드(cloud/relist.js)·Node 시험이 같이 씀. 사람용 글은 한국어.
 */
(function (root) {
  'use strict';
  const VERSION = '0.1.0';
  const fin = (x) => typeof x === 'number' && isFinite(x);
  const nt = (t) => String(t || '').slice(0, 40).replace(/\s+/g, '');
  const hh = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const th = (t) => hh(nt(t));
  /* 날 번호(1970-01-01부터 날 수) — 'YYYY-MM-DD'·'YYYYMMDD' 모두 */
  const dN = (s) => { s = String(s || '').replace(/-/g, ''); if (!/^\d{8}/.test(s)) return null; return Math.round(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)) / 864e5); };
  const GR = ['하', '중', '상', '최상'];
  const r3 = (x) => (fin(x) ? Math.round(x * 1000) / 1000 : null);
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const pc = (x) => (fin(x) ? `${Math.round(x * 1000) / 10}%` : '-');
  const nf = (x) => (fin(+x) ? Math.round(+x).toLocaleString('ko-KR') : '-');
  function medOf(a) { const b = (a || []).filter(fin).sort((x, y) => x - y); if (!b.length) return null; const m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; }
  /* 배열을 고르게 n개로 줄임(앞에서부터 같은 간격) — 저장 크기 */
  const thin = (a, n) => (a.length <= n ? a : a.filter((_, i) => i % Math.ceil(a.length / n) === 0).slice(0, n));
  const rows = (L) => (Array.isArray(L) ? L : []).map((r) => { try { return typeof r === 'string' ? JSON.parse(r) : r; } catch (e) { return null; } }).filter(Array.isArray);

  /* ── ① 한 회차의 짝 ──
   *  G: 이번 회차 사라짐 줄 [0 id, 1 제목, 2 값, 3 등급, 4 올라온 뒤 날(처음부터 있던 것은 null), 5 처음 본 날, 6 최저가 표시(1), …]
   *  A: 같은 창 새로 올림 [{ j: 0 앞 회차 | 1 이번 회차, d: 그 회차 날, r: [0 id, 1 제목, 2 값, 3 등급, 4 출간, 5 ISBN, 6 정가, 7 최저가, 8 분류] }]
   *  같은 제목 Y가 여럿이면 값이 가장 가까운 것 · Y는 한 번만 씀 */
  function pairs(G, A) {
    const byT = new Map(); for (const a of A) { const h = th(a.r[1]); if (!a.r[1]) continue; const L = byT.get(h) || []; L.push(a); byT.set(h, L); }
    const used = new Set(); const out = [];
    for (const g of G) { if (!g || !g[1]) continue; const L = (byT.get(th(g[1])) || []).filter((a) => String(a.r[0]) !== String(g[0]) && !used.has(String(a.r[0]))); if (!L.length) continue;
      let b = L[0]; for (const a of L) if (Math.abs((+a.r[2] || 0) - (+g[2] || 0)) < Math.abs((+b.r[2] || 0) - (+g[2] || 0))) b = a;
      used.add(String(b.r[0])); out.push({ x: g, y: b.r, j: b.j, yd: b.d }); }
    return out;
  }

  /* ── ② 한 회차 셈 ──
   *  o = { day, prevDay, win(사라짐이 실제로 일어난 간격 일), mo(앞 회차 처음 안 보임), mb(이번 다시 보임), cap(무리 줄 수 · 기본 150) }
   *  반환 { R(저장할 숫자), y·c(무리: [id, 올라온 날 번호, 제목 해시]), T(창 새로 올림 제목 해시 — 우연 몫·다시 다시 올림 셈) } */
  function runStat(G0, A0, o) {
    o = o || {}; const G = rows(G0).filter((g) => g[1]); const A = (A0 || []).map((a) => ({ ...a, r: Array.isArray(a.r) ? a.r : rows([a.r])[0] })).filter((a) => a.r && a.r[1]);
    const P = pairs(G, A); const pd = dN(o.prevDay || o.day); const capN = o.cap || 150;
    const R = { d: String(o.day || '').slice(0, 10), n: G.length, pr: P.length, imm: 0, base: 0, old14: 0, same: 0, up: 0, dn: 0, sameAll: 0, gch: 0, gUp: 0, gDn: 0, lg: 0, ll: 0, xl: 0, yl: 0, bG: 0, gN: 0,
      win: fin(+o.win) && +o.win > 0 ? r3(+o.win) : 1, mo: +o.mo || 0, mb: +o.mb || 0, addN: A.length, dnR: [], upR: [], age: [], plX: [], plY: [], ch: null, chO: 0, chH: 0, td: o.td ? 1 : 0 };
    const pairedX = new Set();
    for (const p of P) { const x = p.x, y = p.y; pairedX.add(String(x[0])); const xp = +x[2] || 0, yp = +y[2] || 0; const xg = x[3] || null, yg = y[3] || null;
      if (p.j === 0) R.imm++; const base = x[4] == null; if (base) R.base++; const fs = dN(x[5]); const age = fs != null && pd != null ? pd - fs : null; if (base || (age != null && age >= 14)) R.old14++; if (age != null && R.age.length < 400) R.age.push(age);
      const sp = xp && yp && Math.abs(yp - xp) / xp < 0.01; if (sp) R.same++; else if (yp > xp) { R.up++; if (xp) R.upR.push(yp / xp); } else if (yp < xp) { R.dn++; if (xp) R.dnR.push(yp / xp); }
      if (xg && yg && xg !== yg) { R.gch++; const a = GR.indexOf(xg), b = GR.indexOf(yg); if (a >= 0 && b >= 0) { if (b > a) R.gUp++; else R.gDn++; } }
      if (sp && !(xg && yg && xg !== yg)) R.sameAll++;
      const xl = !!+x[6], yl = !!+y[7]; if (xl) R.xl++; if (yl) R.yl++; if (!xl && yl) R.lg++; if (xl && !yl) R.ll++;
      const pl = +y[6] || 0; if (pl > 0) { if (xp) R.plX.push(xp / pl); if (yp) R.plY.push(yp / pl); } }
    for (const g of G) if (g[4] == null && !pairedX.has(String(g[0]))) R.bG++; R.gN = G.length - P.length;
    R.dnR = thin(R.dnR, 40).map(r3); R.upR = thin(R.upR, 40).map(r3); R.age = thin(R.age, 40); R.plX = thin(R.plX, 40).map(r3); R.plY = thin(R.plY, 40).map(r3);
    /* 무리 — 다시 올린 Y(이번 짝 전부 · 많으면 고르게 cap) · 대조군 C(같은 창의 다른 새로 올림 중 값이 가장 가까운 것 · 사라진 제목이 아닌 것) */
    const gT = new Set(G.map((g) => th(g[1]))); const T = new Set(A.map((a) => th(a.r[1])));
    const Ys = thin(P, capN); const pool = A.filter((a) => !gT.has(th(a.r[1]))).sort((a, b) => (+a.r[2] || 0) - (+b.r[2] || 0)); const usedC = new Set(); const y = [], c = [];
    for (const p of Ys) { y.push([String(p.y[0]), dN(p.yd) != null ? dN(p.yd) : dN(o.day), th(p.y[1])]);
      if (!pool.length) continue; const v = +p.y[2] || 0; let lo = 0, hi = pool.length; while (lo < hi) { const m = (lo + hi) >> 1; if ((+pool[m].r[2] || 0) < v) lo = m + 1; else hi = m; }
      for (let k = 0; k < 120; k++) { let hit = -1; for (const q of [lo + k, lo - k - 1]) if (q >= 0 && q < pool.length && !usedC.has(q)) { hit = q; break; } if (hit >= 0) { usedC.add(hit); const a = pool[hit]; c.push([String(a.r[0]), dN(a.d) != null ? dN(a.d) : dN(o.day), th(a.r[1])]); break; } } }
    return { R, y, c, T, pairs: P };
  }

  /* ── ③ 무리 운명 — 뒤 회차의 사라짐 줄에 Y·C 번호가 나오면 '사라짐'(팔림 + 다시 내림) · 그 제목이 같은 창에 또 올라왔으면 '또 다시 올림'(팔림 아님) ──
   *  coh = { d, y:[[id, 올라온 날, 해시]], c:[…], yE:{ev, t, re}, cE:{…} } · goneIds = Set(이번 사라짐 번호) · day = 이번 회차 날 · T = 이번 창 새로 올림 제목 해시 */
  function fate(coh, goneIds, day, T) {
    const n = dN(day); let ch = 0;
    for (const k of ['y', 'c']) { const E = (coh[k + 'E'] = coh[k + 'E'] || { ev: 0, t: 0, re: 0 }); const keep = [];
      for (const it of coh[k] || []) { if (!goneIds.has(String(it[0])) || n == null || n <= it[1]) { keep.push(it); continue; } ch++; if (T && T.has(it[2])) E.re++; else { E.ev++; E.t += Math.max(0.5, n - it[1]); } E.gone = (E.gone || 0) + 1; }
      coh[k] = keep; }
    return ch;
  }
  /* 무리들 → 하루 사라짐 몫(사건 ÷ 지켜본 날) */
  function haz(cohs, nowDay) {
    const n = dN(nowDay); const S = { y: { ev: 0, exp: 0, re: 0, n: 0 }, c: { ev: 0, exp: 0, re: 0, n: 0 } };
    for (const co of cohs || []) for (const k of ['y', 'c']) { const E = co[k + 'E'] || {}; const s = S[k]; s.ev += E.ev || 0; s.re += E.re || 0; s.exp += E.t || 0; s.n += (co[k] || []).length + (E.gone || 0);
      for (const it of co[k] || []) if (n != null && n > it[1]) s.exp += n - it[1]; }
    for (const k of ['y', 'c']) { S[k].exp = Math.round(S[k].exp * 10) / 10; S[k].rate = S[k].exp > 0 ? S[k].ev / S[k].exp : null; }
    return S;
  }

  /* ── ④ 회차들 모음 ── runs: R 배열(시간 순) · baseLive: 지금 숍의 '처음부터 있던 것' 수 → 옛 상품 하루 사라짐(짝이 아닌 것만) */
  function agg(runs, baseLive) {
    const L = (runs || []).filter(Boolean).slice().sort((a, b) => String(a.d).localeCompare(String(b.d)));
    const S = { runs: L.length, n: 0, pr: 0, ch: 0, chKnown: 0, imm: 0, base: 0, old14: 0, same: 0, up: 0, dn: 0, sameAll: 0, gch: 0, gUp: 0, gDn: 0, lg: 0, ll: 0, xl: 0, yl: 0, mo: 0, mb: 0, td: 0, dnR: [], upR: [], age: [], plX: [], plY: [], bulk: 0, first: L.length ? L[0].d : null, last: L.length ? L[L.length - 1].d : null, oldEv: 0, oldExp: 0 };
    for (const R of L) { for (const k of ['n', 'pr', 'imm', 'base', 'old14', 'same', 'up', 'dn', 'sameAll', 'gch', 'gUp', 'gDn', 'lg', 'll', 'xl', 'yl', 'mo', 'mb', 'td']) S[k] += +R[k] || 0;
      if (fin(R.ch)) { S.ch += R.ch; S.chKnown++; } for (const k of ['dnR', 'upR', 'age', 'plX', 'plY']) for (const v of R[k] || []) S[k].push(v);
      const ex = (+R.pr || 0) - (fin(R.ch) ? R.ch : 0); if (ex >= 10 && ex >= 0.05 * (+R.n || 0)) S.bulk++; }
    let cum = 0; for (let i = L.length - 1; i >= 0; i--) { const R = L[i]; const live = Math.max(0, +baseLive || 0) + cum + (+R.bG || 0) / 2; cum += +R.bG || 0; S.oldEv += +R.bG || 0; S.oldExp += live * Math.max(0.25, +R.win || 1); }
    S.oldRate = S.oldExp > 0 ? S.oldEv / S.oldExp : null; S.ch = Math.round(S.ch * 10) / 10;
    return S;
  }

  /* ── ⑤ 가설(목적) ── 점수 0~100 · 60↑ 강함 · 35~59 조금 · 35↓ 약함 */
  const HYPS = [
    { id: 'expose', name: '새 상품 노출·순위 되살리기(신착 정렬 맨 위로)' },
    { id: 'reprice', name: '값 다시 매기기(내림·올림)' },
    { id: 'regrade', name: '등급·설명 바꾸기' },
    { id: 'lowbadge', name: '최저가 표시 되찾기' },
    { id: 'restock', name: '팔린 뒤 같은 책 다시 들여옴(진짜 팔림 · 다시 올리기 아님)' },
    { id: 'stock', name: '재고 확인(잠깐 내렸다 같은 번호로 다시)' },
    { id: 'cleanup', name: '오래된 상품 정리(내리고 안 올림)' },
    { id: 'move', name: '다른 판매처로 옮김' },
  ];
  const verdictOf = (s) => (s == null ? '알 수 없음' : s >= 60 ? '강함' : s >= 35 ? '조금' : '약함');
  /* 비율 두 개의 견줌(포아송 · 로그 눈금 95% 범위) */
  function rateRatio(a, b) { if (!a || !b || !(a.exp > 0) || !(b.exp > 0)) return null; const ea = a.ev, eb = b.ev; if (ea < 1 || eb < 1) return { r: null, lo: null, hi: null, ea, eb, few: true };
    const r = ea / a.exp / (eb / b.exp); const se = Math.sqrt(1 / ea + 1 / eb); return { r: r3(r), lo: r3(r * Math.exp(-1.96 * se)), hi: r3(r * Math.exp(1.96 * se)), ea, eb, few: ea < 5 || eb < 5 }; }
  function effOf(H, S) {
    const y = H ? H.y : null; const c = H ? H.c : null; const old = { ev: S.oldEv, exp: S.oldExp };
    const rO = rateRatio(y, old); const rC = rateRatio(y, c);
    let v = 'unk', line = '';
    if (!y || (y.ev || 0) < 5) { v = 'unk'; line = `모름 — 다시 올린 상품이 그 뒤 사라진 것이 ${nf(y ? y.ev : 0)}개뿐(5개 넘어야 셈)`; }
    else if (rO && rO.lo > 1) { v = 'fast'; line = `더 빨리 팔림 — 다시 올린 상품의 하루 사라짐 ${pc(y.rate)} = 그대로 둔 옛 상품(${pc(S.oldRate)})의 ${rO.r}배(95% 범위 ${rO.lo}~${rO.hi}배)`; }
    else if (rO && rO.hi < 1) { v = 'slow'; line = `빨라지지 않음 — 다시 올린 상품의 하루 사라짐 ${pc(y.rate)} = 그대로 둔 옛 상품(${pc(S.oldRate)})의 ${rO.r}배(95% 범위 ${rO.lo}~${rO.hi}배 · 1 아래)`; }
    else if (rO) { v = 'same'; line = `뚜렷한 차이 없음 — 다시 올린 상품 ${pc(y.rate)} · 그대로 둔 옛 상품 ${pc(S.oldRate)}(${rO.r}배 · 95% 범위 ${rO.lo}~${rO.hi}배)`; }
    if (rC && rC.r != null && c && c.ev >= 3) line += ` · 같은 창 새 상품(값 맞춘 대조군 ${pc(c.rate)})의 ${rC.r}배`;
    return { v, line, y, c, old: { ev: S.oldEv, exp: Math.round(S.oldExp), rate: S.oldRate }, rOld: rO, rNew: rC };
  }
  /* S(모음) + H(무리 운명) + L(배움: bias) → 판정 */
  function judge(S, H, L, o) {
    o = o || {}; const B = (L && L.bias) || {}; const hc = (L && L.habitCut) || 0.03;
    const pr = S.pr || 0; const n = S.n || 0; const chance = S.chKnown ? S.ch : 0; const ex = Math.max(0, pr - chance); const share = n ? ex / n : 0; const purity = pr ? ex / pr : 0;
    const why = []; const f = (k) => (pr ? (S[k] || 0) / pr : 0);
    why.push(`사라진 상품 ${nf(n)}개(${S.runs}회차 · ${S.first || '-'}~${S.last || '-'}) 중 같은 제목이 같은 창에 새 번호로 올라온 짝 ${nf(pr)}개 · 우연 몫(안 사라진 옛 상품도 같은 창에 한 권 더 올라오는 몫) ${nf(chance)}개 → 다시 올리기로 볼 넘친 몫 ${nf(ex)}개 = 사라짐의 ${pc(share)}`);
    const habit = n < 100 || S.runs < 2 ? 'few' : share >= Math.max(0.08, hc * 2.5) ? 'strong' : share >= hc && ex >= 20 ? 'some' : 'none';
    const sc = {}; const ev = {};
    /* 새 상품 노출 — 값·등급 그대로(바뀐 것 없이 번호만 새로) · 옛 상품(처음부터 있던 것·14일 넘음)을 · 바로(같은 회차에) · 되풀이(여러 회차에 몰아서) */
    { const s1 = clamp(f('sameAll') / 0.35), s2 = f('old14'), s3 = f('imm'), s4 = clamp(S.bulk / 3); sc.expose = 100 * (0.35 * s1 + 0.25 * s2 + 0.2 * s3 + 0.2 * s4);
      ev.expose = `값·등급 그대로 ${pc(f('sameAll'))} · 옛 상품(처음부터 있던 것·14일↑) ${pc(f('old14'))} · 사라진 회차에 바로 올림 ${pc(f('imm'))} · 몰아서 한 회차 ${S.bulk}번`; }
    { const d = f('dn'), u = f('up'); const dm = medOf(S.dnR), um = medOf(S.upR); const mag = medOf([...S.dnR.map((r) => 1 - r), ...S.upR.map((r) => r - 1)]); /* 바꾼 폭이 작으면(±10% 안팎) 값 맞춤보다 '다시 올리는 김에 손봄'에 가까움 → 폭으로 무게 */
      sc.reprice = 100 * clamp((d + u) / 0.8) * (0.6 + 0.4 * clamp((mag || 0) / 0.25));
      ev.reprice = `값 내림 ${pc(d)}${dm != null ? `(가운데 ${Math.round((dm - 1) * 100)}%)` : ''} · 값 올림 ${pc(u)}${um != null ? `(가운데 +${Math.round((um - 1) * 100)}%)` : ''} · 같은 값 ${pc(f('same'))}${(medOf(S.plY) != null) ? ` · 정가 대비 ${Math.round(medOf(S.plX) * 100)}% → ${Math.round(medOf(S.plY) * 100)}%` : ''}`; }
    { sc.regrade = 100 * clamp(f('gch') / 0.5); ev.regrade = `등급 바뀜 ${pc(f('gch'))}(올림 ${nf(S.gUp)} · 내림 ${nf(S.gDn)}) · 설명·사진은 숍 목록에 없어 못 봄`; }
    { const net = (S.lg - S.ll) / Math.max(1, pr); sc.lowbadge = 100 * clamp(net / 0.2); ev.lowbadge = `최저가 표시 없던 것이 다시 올린 뒤 생김 ${nf(S.lg)} · 있던 것이 없어짐 ${nf(S.ll)} → 순 ${pc(net)} (최저가 표시 ${pc(f('xl'))} → ${pc(f('yl'))})`; }
    { const cs = pr ? clamp(chance / pr) : 1; sc.restock = 100 * (0.7 * cs + 0.3 * (1 - f('imm'))); ev.restock = `짝 가운데 우연 몫 ${pc(cs)} · 사라진 회차에 바로 올리지 않은 짝 ${pc(1 - f('imm'))}`; }
    { const m = S.mo ? S.mb / S.mo : null; sc.stock = m == null ? null : m > 0.5 ? 15 : 100 * clamp(m / 0.3); ev.stock = m == null ? '처음 안 보인 것 기록 없음' : `처음 안 보였다가 같은 번호로 다시 보인 몫 ${pc(m)}(${nf(S.mb)}/${nf(S.mo)})${m > 0.5 ? ' — 절반 넘게 다시 보임 = 판매자 손이 아니라 읽기 잡음(쪽 빠짐·이어 읽기 구멍)으로 봄' : ' — 쪽 빠짐(읽기 잡음)도 섞임'}`; }
    { const t = S.td || 0; sc.cleanup = t ? Math.min(100, 50 + 25 * t) : null; ev.cleanup = t ? `🧠 이상 판단이 '대량 내림·숍 닫음'으로 본 회차 ${t}번` : '내리고 안 올린 것은 팔림과 숫자로 가를 수 없음(대량 내림 판정 회차 없음)'; }
    sc.move = null; ev.move = '다른 판매처(예스24·교보·쿠팡 등)는 읽지 않아 알 수 없음';
    const on = habit === 'strong' || habit === 'some'; const PUR = ['expose', 'reprice', 'regrade', 'lowbadge'];
    const hy = HYPS.map((h) => { let s = sc[h.id]; if (s != null) s = Math.max(0, Math.min(100, Math.round(s + 10 * (B[h.id] || 0)))); return { id: h.id, name: h.name, score: s, verdict: !on && PUR.includes(h.id) && s != null ? '참고(다시 올리기 거의 안 함 — 짝 대부분 우연)' : verdictOf(s), ev: ev[h.id] }; });
    /* 습관이 있으면 다시 올리기 목적 가운데 1등 · 없으면 '다시 올리기 거의 안 함' */
    const purp = hy.filter((h) => ['expose', 'reprice', 'regrade', 'lowbadge'].includes(h.id) && h.score != null).sort((a, b) => b.score - a.score);
    let main; if (habit === 'strong' || habit === 'some') main = purp[0] ? { id: purp[0].id, name: purp[0].name, score: purp[0].score } : null; else if (habit === 'few') main = { id: 'few', name: '자료 적음(사라짐 100개·2회차 넘어야 판정)', score: null }; else main = { id: 'none', name: '다시 올리기 거의 안 함 — 짝은 대부분 우연(같은 책 한 권 더)', score: null };
    const also = habit === 'strong' || habit === 'some' ? purp.slice(1).filter((h) => h.score >= 60).map((h) => h.name) : [];
    const eff = effOf(H, S); if (!on && eff.v !== 'unk') { eff.v = 'ref'; eff.line = `참고만 — 짝 대부분이 우연(같은 책 새로 들여옴)이라 다시 올리기 효과로 못 봄 · ${eff.line}`; }
    const dm = medOf(S.dnR);
    const line = habit === 'strong' || habit === 'some' ? `🔁 다시 올리기 ${habit === 'strong' ? '습관 강함' : '조금'}(사라짐의 ${pc(share)}) — 주된 목적: ${main ? main.name : '-'}${also.length ? ` · 함께: ${also.join(' · ')}` : ''} · 효과: ${eff.line.split(' — ')[0]}` : habit === 'few' ? '🔁 자료 적음' : '🔁 다시 올리기 거의 안 함';
    const preds = [{ k: 'habit', exp: habit === 'strong' || habit === 'some' ? 'yes' : habit === 'none' ? 'no' : null }, main && main.score != null ? { k: 'main', id: main.id, exp: 'yes' } : null, eff.v === 'fast' || eff.v === 'slow' || eff.v === 'same' ? { k: 'eff', exp: eff.v } : null].filter((p) => p && p.exp);
    if (dm != null && f('dn') >= 0.4) why.push(`💸 내려서 다시 올린 것의 가운데 폭 ${Math.round((dm - 1) * 100)}%`);
    return { v: VERSION, at: o.now || null, sc: o.sc || null, name: o.name || null, habit, share: r3(share), excess: Math.round(ex), pairs: pr, chance, purity: r3(purity), n, runs: S.runs, from: S.first, to: S.last, main, also, hyps: hy, eff, why, line, preds, last: S.last };
  }

  /* ── ⑥ 스스로 채점 — 판정 때 남긴 예측(preds)을 그 뒤 회차들(Snew · 판정의 마지막 날 뒤 회차만)과 그 뒤 올라온 무리(Hnew)로 매김 ──
   *  habit yes: 뒤 회차의 넘친 몫이 사라짐의 1.5% 넘음 · no: 3% 아래 / main: 뒤 회차 같은 가설 점수 35 넘음 / eff fast: 뒤 무리 ≥ 옛 상품의 1배 · slow: ≤ 1배 · same: 0.67~1.5배
   *  자료가 모자라면(뒤 회차 2개·사라짐 100개 아래 · 뒤 무리 사건 5개 아래) ok:null(아직 모름) */
  function verify(rec, Snew, Hnew, L) {
    if (!rec || !Snew) return []; const out = []; const J = judge(Snew, Hnew, L, {});
    const enough = Snew.runs >= 2 && Snew.n >= 100;
    for (const p of rec.preds || []) { let ok = null, why = '';
      if (p.k === 'habit') { if (!enough) why = '뒤 회차 아직 모자람'; else { ok = p.exp === 'yes' ? J.share >= 0.015 : J.share < 0.03; why = `뒤 ${Snew.runs}회차 넘친 몫 ${pc(J.share)}(예측: ${p.exp === 'yes' ? '습관 있음' : '없음'})`; } }
      else if (p.k === 'main') { const h = J.hyps.find((x) => x.id === p.id); if (!enough || !(J.pairs >= 20)) why = '뒤 짝 아직 모자람'; else { ok = !!h && h.score >= 35; why = `뒤 회차 '${h ? h.name : p.id}' 점수 ${h ? h.score : '-'}(35 넘어야 맞음)`; } }
      else if (p.k === 'eff') { const e = J.eff; if (!e || !e.rOld || e.rOld.r == null || (e.y && e.y.ev < 5)) why = '뒤 무리 사건 아직 모자람'; else { const r = e.rOld.r; ok = p.exp === 'fast' ? r >= 1 : p.exp === 'slow' ? r <= 1 : r >= 0.67 && r <= 1.5; why = `뒤 무리 다시 올린 상품 ÷ 옛 상품 ${r}배(예측: ${p.exp === 'fast' ? '빠름' : p.exp === 'slow' ? '안 빠름' : '비슷'})`; } }
      out.push({ k: p.k, id: p.id || null, exp: p.exp, ok, why }); }
    return out;
  }
  function learnInit() { return { v: VERSION, bias: {}, habitCut: 0.03, n: { ok: 0, bad: 0 }, seen: [], log: [] }; }
  /* outs: [{ key(판정 열쇠 — sc|at), sc, name, k, id, exp, ok, why }] — 같은 예측은 한 번만 · 맞음: 그 가설 +0.1(위 1) · 틀림: −0.5(바닥 −4) · 습관 예측이 틀리면 기준 ±0.005(0.02~0.06) */
  function learn(state, outs) {
    const L = state && state.v ? state : { ...learnInit(), ...(state || {}) }; L.bias = L.bias || {}; L.n = L.n || { ok: 0, bad: 0 }; L.seen = L.seen || []; L.log = L.log || []; if (!fin(L.habitCut)) L.habitCut = 0.03;
    const seen = new Set(L.seen); let ch = 0;
    for (const x of outs || []) { if (!x || x.ok == null) continue; const id = `${x.key}|${x.k}`; if (seen.has(id)) continue; seen.add(id); ch++;
      if (x.ok) { L.n.ok++; if (x.k === 'main' && x.id) L.bias[x.id] = Math.min(1, (L.bias[x.id] || 0) + 0.1); continue; }
      L.n.bad++; if (x.k === 'main' && x.id) L.bias[x.id] = Math.max(-4, (L.bias[x.id] || 0) - 0.5);
      if (x.k === 'habit') L.habitCut = Math.max(0.02, Math.min(0.06, L.habitCut + (x.exp === 'yes' ? 0.005 : -0.005)));
      L.log.unshift({ at: x.at || null, sc: x.sc || null, why: `✗ ${x.name || x.sc || ''} ${x.k === 'habit' ? '습관' : x.k === 'main' ? '주된 목적' : '효과'} 예측 틀림 — ${String(x.why || '').slice(0, 120)}${x.k === 'main' ? ' → 그 가설 −0.5' : x.k === 'habit' ? ` → 습관 기준 ${pc(L.habitCut)}` : ''}` }); }
    L.seen = [...seen].slice(-800); L.log = L.log.slice(0, 40); L.v = VERSION; return { learn: L, changed: ch };
  }

  const API = { VERSION, HYPS, nt, hh, th, dN, rows, pairs, runStat, fate, haz, agg, judge, verify, learn, learnInit, rateRatio, medOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root) root.ReadnowRelist = API;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : null);
