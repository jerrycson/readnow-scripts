/* readnow-pc-runtime.js — 리드나우 수집기 1.89.309의 바탕 — 이 PC 이름·네이버 다시 로그인·일시정지(모든 탭)·작업 기록·탭끼리 나누는 상태·통합 관제판
 * Tampermonkey의 '리드나우 수집기' 본체가 @require로 불러옴 (이 파일만 따로 설치하지 않음). 본체와 판이 같아야 함 — 다르면 관제판에 빨간 띠.
 * 원본 한 파일에서 기계로 나눈 것: 모듈을 차례로 이으면 원본 코드와 글자 하나까지 같음 (같은 코드 = 같은 기록). */
/* ◆ 🔄 목표·방법 적응 틀 ReadnowAdaptAg 0.1.7 — 공용 readnow-adapt-core.js의 ◆AG 덩어리를 글자 그대로(split.js가 떼어 넣음 · 수집기 머리 그대로 · adapt10) */
;(function (root) {
  'use strict';
  const toInt = (s) => { if (s == null) return null; if (typeof s === 'number') return isFinite(s) ? Math.round(s) : null; const m = String(s).replace(/,/g, '').match(/-?\d+/); return m ? +m[0] : null; };
  const fmtInt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
/* ◆AG-BEGIN — (0.1.7 adapt10) 여기부터 ◆AG-END까지는 수집기(PC)가 머리를 바꾸지 않고 쓰게 split.js가 그대로 떼어 readnow-pc-runtime.js 앞에 넣음(ReadnowAdaptAg) · 이 안에서는 toInt·fmtInt 말고 바깥 이름을 쓰지 않음 */
  /* ══ (0.1.6 adapt9 · 정범님 11/12 밤 · 약속 64) 🔄 목표·방법 적응 틀 — 전제: '상대(알라딘·예스24 등)는 방식을 바꾼다'
   *  목표(무엇을 얻나)는 고정하고 방법(어디서·어떤 표기·어떤 경로로)만 바꿈. 엔진마다 '목표 장부' 하나(g):
   *   methods[방법] = 날짜별 성적 d[[날, 시도, 성공, 비용, 시간ms]](21일) · 최근 회차 rr[[시도, 성공, 시각]](6번) · st: champ(지금 쓰는 길) | cand(후보) | arch(예전 챔피언 — 지우지 않음, 돌아갈 수 있게) | off
   *  agStep / agAdapt 흐름: ① 판정 agJudge(챔피언 최근 회차 성공률 vs 평소·목표) → ② 떨어지면 바뀐 것 찾기 agDiff·agClassify(잘 되던 원문 표본 vs 지금 원문: 표기·자리·경로·막힘·빈 답)
   *   → ③ 새 방법 후보 agLabelCands(아는 값이 있는 자리 앞 글 · 같은 뜻 다른 표기 AG_SYN · '이름표 : 숫자' 꼴) → ④ 작은 표본 시험 agTrial(새 요청 없음 — 받아 둔 원문으로)
   *   → ⑤ 통계로 고르기 agDecide(윌슨 하한 성공률 · 비용당 성공 · 연속 2번 이겨야 바꿈(고수) — 챔피언이 무너졌으면 표본 3개로 바로) → ⑥ 채택, 옛 방법은 보관(arch)
   *  탐색/활용 agPick: 대부분 챔피언 · ε(평소 6% · 떨어질 때 35%) 만큼 다른 길 — 100%여도 3% 밑으로 내리지 않음(더 싼 길·되돌아온 옛 길을 늘 찾음)
   *  바뀜·채택·되돌림·회복은 줄 { at, src:'엔진', eng, engL, kind, t, ev } → 부르는 쪽이 '발견 모음'에 넘김(클라우드 findsPush)
   *  순수 함수 · 저장·네트워크 없음 · reduce 안 씀(알라딘 화면 prototype.js) */
  const AG_DEF = { eps: 0.06, epsMin: 0.03, epsDrop: 0.35, minN: 12, drop: 0.2, low: 0.5, z: 1.28, effGain: 0.15, rateTie: 0.03, wins: 2, days: 21, win3: 3, ev: 30, arch: 8, target: 0.9, smp: 1200 };
  const agNow = (t) => (t == null ? Date.now() : typeof t === 'number' ? t : Date.parse(t) || Date.now());
  const agDay = (t) => new Date(agNow(t) + 9 * 3600e3).toISOString().slice(0, 10);
  const r3 = (x) => (x == null || !isFinite(x) ? null : Math.round(x * 1000) / 1000);
  const pct = (x) => (x == null ? '-' : Math.round(x * 100) + '%');
  function agNew(id, o) { o = o || {}; return { id: String(id), label: o.label || String(id), goal: o.goal || '', unit: o.unit || '건', target: o.target != null ? +o.target : AG_DEF.target, methods: {}, champ: null, arch: [], ev: [], smp: {}, flag: null, at: null, v: 1 }; }
  function agMethod(g, mid, o) { o = o || {}; mid = String(mid); let m = g.methods[mid]; if (!m) { m = g.methods[mid] = { id: mid, label: o.label || mid, how: o.how || null, from: o.from || 'seed', st: 'cand', d: [], rr: [], win: 0, at: o.at || null }; if (o.re) m.re = o.re; if (o.lbl) m.lbl = o.lbl; } return m; }
  /* 목표 장부를 만들거나 씨앗(seed: label·goal·unit·target·methods[]·champ)으로 이름·방법을 맞춤 — 성적은 그대로 */
  function agEnsure(map, id, seed) { let g = map[id]; if (!g || typeof g !== 'object' || !g.methods) g = map[id] = agNew(id, seed); if (seed) { if (seed.label) g.label = seed.label; if (seed.goal) g.goal = seed.goal; if (seed.unit) g.unit = seed.unit; if (seed.target != null) g.target = +seed.target; for (const m of seed.methods || []) agMethod(g, m.id, m); if (!g.champ && seed.champ && g.methods[seed.champ]) { g.champ = seed.champ; g.methods[seed.champ].st = 'champ'; } } return g; }
  /* 한 회차 결과 넣기 — r = { n 시도, ok 성공, cost 비용(요청 쪽 수 등 · 없으면 n), ms, meta(새 방법이면 그 설명) } */
  function agRecord(g, mid, r, now) { r = r || {}; const t = agNow(now); const m = agMethod(g, mid, r.meta); const n = Math.max(0, +r.n || 0); if (!n) return m; const ok = Math.min(n, Math.max(0, +r.ok || 0)); const cost = r.cost != null ? Math.max(0, +r.cost || 0) : n; const ms = Math.max(0, +r.ms || 0); const day = agDay(t);
    let b = m.d.length ? m.d[m.d.length - 1] : null; if (!b || b[0] !== day) { b = [day, 0, 0, 0, 0]; m.d.push(b); if (m.d.length > AG_DEF.days) m.d.splice(0, m.d.length - AG_DEF.days); } b[1] += n; b[2] += ok; b[3] += cost; b[4] += ms;
    m.rr.push([n, ok, new Date(t).toISOString()]); if (m.rr.length > 6) m.rr.splice(0, m.rr.length - 6); if (m.brk) { m.post = m.post || [0, 0, 0]; m.post[0] += n; m.post[1] += ok; m.post[2] += cost; } g.at = new Date(t).toISOString(); return m; }
  const agWilson = (ok, n, z) => { if (!(n > 0)) return { lo: 0, hi: 1 }; const p = ok / n, z2 = z * z, d = 1 + z2 / n, c = p + z2 / (2 * n), s = z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n)); return { lo: Math.max(0, (c - s) / d), hi: Math.min(1, (c + s) / d) }; };
  /* 성적 — 최근 3일 칸(모자라면 21일 전체) · 무너진 뒤 보관된 길은 무너진 뒤 성적(post)만 */
  function agStat(m, o) { o = o || AG_DEF; if (!m) return { n: 0, ok: 0, cost: 0, r: null, eff: null }; let n = 0, ok = 0, cost = 0;
    if (m.brk) { const P = m.post || [0, 0, 0]; n = P[0]; ok = P[1]; cost = P[2]; }
    else { const L = m.d || []; const take = (k) => { n = 0; ok = 0; cost = 0; for (let i = Math.max(0, L.length - k); i < L.length; i++) { n += L[i][1]; ok += L[i][2]; cost += L[i][3]; } }; take(o.win3 || 3); if (n < (o.minN || 12)) take(L.length); }
    return { n, ok, cost, r: n ? ok / n : null, eff: cost ? ok / cost : null }; }
  const agRecent = (m, k) => { let n = 0, ok = 0; const L = (m && m.rr) || []; for (let i = Math.max(0, L.length - (k || 3)); i < L.length; i++) { n += L[i][0]; ok += L[i][1]; } return { n, ok, r: n ? ok / n : null }; };
  /* 평소 = 최근 회차를 뺀 날짜 칸 */
  const agBase = (m, k) => { const S = agStat(m); const R = agRecent(m, k); const n = S.n - R.n, ok = S.ok - R.ok; return n > 0 ? { n, ok, r: ok / n } : { n: 0, ok: 0, r: null }; };
  /* ① 판정 — ok | low(목표 밑) | drop(평소보다 크게 떨어짐) | broken(무너짐) | new(챔피언 없음) | idle(기록 없음) */
  function agJudge(g, o) { o = { ...AG_DEF, ...(o || {}) }; const m = g && g.champ ? g.methods[g.champ] : null; if (!m) return { st: 'new' }; const R = agRecent(m, 3); if (!R.n) return { st: 'idle' }; const B = agBase(m, 3); const ref = B.n >= Math.min(o.minN, 6) ? B.r : g.target; const r = R.r;
    let st = 'ok'; if (R.n >= 3 && r < o.low * ref) st = 'broken'; else if (R.n >= 3 && ref - r > o.drop) st = 'drop'; else if (R.n >= 3 && r < g.target * 0.8) st = 'low';
    return { st, r: r3(r), base: r3(B.r), ref: r3(ref), n: R.n }; }
  /* 탐색/활용 — 이번 회차에 쓸 방법 하나 · rnd(0~1)를 넣으면 시험에서 같은 답 */
  function agPick(g, rnd, o) { o = { ...AG_DEF, ...(o || {}) }; rnd = rnd == null ? Math.random() : +rnd; const L = Object.values((g && g.methods) || {}).filter((m) => m.st !== 'off'); if (!L.length) return null; const ch = g.champ && g.methods[g.champ] && g.methods[g.champ].st !== 'off' ? g.methods[g.champ] : null;
    const j = agJudge(g, o); let eps = j.st === 'broken' || j.st === 'drop' ? o.epsDrop : o.eps; eps = Math.max(o.epsMin, eps); if (!ch) eps = 1; const others = L.filter((m) => m !== ch);
    if (!others.length || rnd >= eps) return { mid: (ch || L[0]).id, why: ch ? '고수' : '처음', eps: r3(eps) };
    let tot = 0; for (const m of L) tot += agStat(m, o).n; let best = null, bv = -1; for (const m of others) { const S = agStat(m, o); const u = S.n > 0 ? S.r + Math.sqrt((2 * Math.log(tot + 2)) / S.n) : 9; const v = m.st === 'arch' ? u * 0.9 : u; if (v > bv) { bv = v; best = m; } }
    return { mid: best.id, why: '탐색', eps: r3(eps) }; }
  const AG_KO = { broken: '옛 방법이 무너짐', better: '성공률이 확실히 높음', cheaper: '성공률은 같고 비용당 성공이 더 좋음' };
  function agLine(g, kind, t, ev, now) { const L = { at: new Date(agNow(now)).toISOString(), src: '엔진', eng: g.id, engL: g.label, kind, t, ...(ev ? { ev } : {}) }; g.ev = (g.ev || []).concat([{ at: L.at, kind, t }]).slice(-AG_DEF.ev); return L; }
  /* ⑤ 통계로 고르기 — 바꿀 때만 줄을 돌려줌 */
  function agDecide(g, now, o) { o = { ...AG_DEF, ...(o || {}) }; const lines = []; const L = Object.values(g.methods || {}).filter((m) => m.st !== 'off'); const ch = g.champ ? g.methods[g.champ] : null;
    if (!ch || ch.st === 'off') { let c = null, cr = -1; for (const m of L) { const S = agStat(m, o); if (S.n && S.ok && S.r > cr) { c = m; cr = S.r; } } if (c) { c.st = 'champ'; g.champ = c.id; c.since = new Date(agNow(now)).toISOString(); g.ev = (g.ev || []).concat([{ at: c.since, kind: '시작', t: `처음 방법 '${c.label}' (성공률 ${pct(cr)})` }]).slice(-o.ev); } return lines; }
    const j = agJudge(g, o); const CS = agStat(ch, o); const chR = CS.r == null ? 0 : CS.r; const chE = CS.eff || 0; const rec = agRecent(ch, 3); const broken = j.st === 'broken'; let pick = null, why = null, ps = -1;
    for (const m of L) { if (m === ch) continue; const S = agStat(m, o); if (!S.n) { m.win = 0; continue; } const w = agWilson(S.ok, S.n, o.z); let win = null;
      if (broken && S.n >= 3 && S.r >= 0.6 && w.lo > (rec.r || 0) + 0.1) win = 'broken';
      else if (S.n >= o.minN && w.lo > chR + 0.02) win = 'better';
      else if (S.n >= o.minN && CS.n >= o.minN && Math.abs(S.r - chR) <= o.rateTie && S.eff != null && S.eff >= chE * (1 + o.effGain) && w.lo >= chR - 0.05) win = 'cheaper';
      if (win) { m.win = (m.win || 0) + 1; if (win === 'broken' || m.win >= o.wins) { const sc = w.lo + (S.eff || 0) * 0.001; if (sc > ps) { pick = m; why = win; ps = sc; } } } else m.win = 0; }
    if (pick) { const at = new Date(agNow(now)).toISOString(); const back = pick.st === 'arch'; const S = agStat(pick, o); ch.st = 'arch'; if (broken) { ch.brk = at; ch.post = [0, 0, 0]; } g.arch = (g.arch || []).concat([{ id: ch.id, label: ch.label, at, why, r: r3(broken ? rec.r : chR), n: broken ? rec.n : CS.n }]).slice(-o.arch);
      pick.st = 'champ'; pick.win = 0; pick.since = at; if (pick.brk) { delete pick.brk; delete pick.post; } g.champ = pick.id;
      const t = `🔄 ${g.label}: 방법 '${ch.label}' → '${pick.label}'${back ? '(예전 방법으로 되돌림)' : ''} — ${AG_KO[why]} · 새 방법 성공률 ${pct(S.r)}(${Math.round(S.n)}${g.unit}) · 옛 방법 ${pct(broken ? rec.r : chR)}${why === 'cheaper' ? ` · 비용당 성공 ${r3(chE)} → ${r3(S.eff)}` : ''}`;
      lines.push(agLine(g, back ? '되돌림' : '채택', t, { from: ch.id, to: pick.id, why, newR: r3(S.r), newN: S.n, oldR: r3(broken ? rec.r : chR) }, now)); }
    return lines; }

  /* ② 바뀐 것 찾기 — 두 원문(잘 되던 것 a · 지금 b)의 낱말·class 이름 차이 */
  const agToks = (s) => { const S = String(s || ''); const w = new Set(), c = new Set(); for (const m of S.matchAll(/class\s*=\s*["']([^"']+)["']/gi)) for (const x of m[1].split(/\s+/)) if (x) c.add(x); const t = S.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '); for (const m of t.matchAll(/[가-힣]{2,}|[A-Za-z][A-Za-z]+(?:\s[A-Z][a-z]+)?/g)) w.add(m[0]); return { w, c }; };
  const jac = (A, B) => { if (!A.size && !B.size) return 1; let i = 0; for (const x of A) if (B.has(x)) i++; return i / (A.size + B.size - i); };
  function agDiff(a, b) { const A = agToks(a), B = agToks(b); const lostW = [...A.w].filter((x) => !B.w.has(x)), gainW = [...B.w].filter((x) => !A.w.has(x)), lostC = [...A.c].filter((x) => !B.c.has(x)), gainC = [...B.c].filter((x) => !A.c.has(x));
    return { lostW: lostW.slice(0, 12), gainW: gainW.slice(0, 12), lostC: lostC.slice(0, 12), gainC: gainC.slice(0, 12), jw: r3(jac(A.w, B.w)), jc: r3(jac(A.c, B.c)), nA: String(a || '').length, nB: String(b || '').length }; }
  const AG_KIND = { label: '표기 바뀜(같은 자리 다른 이름)', place: '자리 바뀜(화면 구조·칸 이름)', path: '경로 바뀜(주소 넘겨짐·로그인)', block: '막힘(요청 많음·로봇 확인)', empty: '빈 답(자료 없음)', page: '화면이 통째로 바뀜', none: '원문은 같음(값 쪽 문제)', unknown: '까닭 아직 모름(원문 표본 없음)' };
  function agClassify(a, b, info) { info = info || {}; const B = String(b == null ? '' : b); const st = +info.status || 0;
    if (st === 429 || st === 403 || /captcha|자동\s*입력\s*방지|비정상적인\s*접근|too many requests|access denied/i.test(B)) return { k: 'block', ko: AG_KIND.block };
    if (info.redirect || /\/login\/|wlogin\.aspx|로그인이\s*필요/i.test(B)) return { k: 'path', ko: AG_KIND.path };
    if (!B.replace(/<[^>]+>/g, '').trim() || B.length < 40) return { k: 'empty', ko: AG_KIND.empty };
    if (!a) return { k: 'unknown', ko: AG_KIND.unknown }; const D = agDiff(a, b);
    if (!D.lostW.length && !D.gainW.length && !D.lostC.length && !D.gainC.length) return { k: 'none', ko: AG_KIND.none, d: D };
    if (D.jw < 0.35) return { k: 'page', ko: AG_KIND.page, d: D };
    if (D.lostW.length && D.gainW.length && (D.jc >= 0.8 || !D.lostC.length)) return { k: 'label', ko: AG_KIND.label, d: D };
    if (D.lostC.length || D.gainC.length) return { k: 'place', ko: AG_KIND.place, d: D };
    return { k: 'label', ko: AG_KIND.label, d: D }; }
  /* 원문 표본 — 방법마다 잘 되던 것(good)·안 되던 것(bad) 하나씩 · 1,200자까지 */
  function agSample(g, mid, raw, good, now, info) { if (raw == null) return; const s = String(raw).slice(0, AG_DEF.smp); const z = (g.smp[mid] = g.smp[mid] || {}); z[good ? 'good' : 'bad'] = { at: new Date(agNow(now)).toISOString(), s, ...(info ? { info } : {}) }; const ks = Object.keys(g.smp); if (ks.length > 5) for (const k of ks) if (k !== g.champ && k !== mid && Object.keys(g.smp).length > 5) delete g.smp[k]; }

  /* ③ 새 방법 후보 — 같은 뜻 다른 표기 · 아는 값 자리 · '이름표 : 숫자' */
  const AG_SYN = { salesPoint: ['Sales Point', 'SalesPoint', '세일즈포인트', '세일즈 포인트', '판매지수', '판매 지수'], priceSales: ['판매가', '할인가', '구매가', '판매 가격'], priceList: ['정가', '정상가'], usedMin: ['중고 최저가', '최저가'], pages: ['쪽수', '페이지', '면수'], rating: ['평점', '별점'], reviews: ['구매평', '리뷰', '100자평', '한줄평'], items: ['상품 수', '상품수', '전체 상품', '등록 상품'] };
  const reEsc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const agLblRe = (l) => reEsc(String(l).trim()).replace(/\s+/g, '\\s*') + '\\s*[:：]?\\s*(\\d[\\d,]*)';
  const agPlain = (s) => String(s == null ? '' : s).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;| /g, ' ').replace(/\s+/g, ' ').trim();
  function agApply(m, s) { if (!m || !m.re) return null; let re; try { re = new RegExp(m.re); } catch (e) { return null; } const x = agPlain(s).match(re); return x ? toInt(x[1]) : null; }
  function agLabelCands(samples, spec, o) { o = o || {}; spec = spec || {}; const syn = spec.syn || AG_SYN[spec.field] || []; const S = (samples || []).filter((x) => x && x.s != null); const cnt = new Map();
    const add = (lbl, src, i) => { lbl = String(lbl || '').replace(/\s+/g, ' ').trim(); if (lbl.length < 2 || lbl.length > 16) return; const z = cnt.get(lbl) || { lbl, src, hit: new Set() }; z.hit.add(i); if (src === 'known') z.src = 'known'; cnt.set(lbl, z); };
    const pre = (s, k, i) => { const p = s.slice(Math.max(0, k - 28), k); const m = p.match(/([가-힣A-Za-z][가-힣A-Za-z ]{0,14}[가-힣A-Za-z]|[가-힣A-Za-z]{2})\s*[:：]?\s*$/); if (!m) return; const ws = m[1].trim().split(' '); add(m[1], 'known', i); if (ws.length > 1) { add(ws[ws.length - 1], 'known', i); add(ws.slice(-2).join(' '), 'known', i); } };
    S.forEach((x, i) => { const s = agPlain(x.s);
      if (x.v != null && isFinite(+x.v)) { for (const f of [...new Set([String(Math.round(+x.v)), fmtInt(Math.round(+x.v))])]) { let k = -1; while ((k = s.indexOf(f, k + 1)) >= 0) { const a = s[k - 1] || '', b = s[k + f.length] || ''; if (/[\d,]/.test(a) || /\d/.test(b) || (b === ',' && /\d/.test(s[k + f.length + 1] || ''))) continue; pre(s, k, i); } } }
      for (const w of syn) { try { if (new RegExp(agLblRe(w)).test(s)) add(w, 'syn', i); } catch (e) {} }
      if (o.scan) for (const m of s.matchAll(/([가-힣A-Za-z][가-힣A-Za-z ]{0,14}[가-힣A-Za-z])\s*[:：]\s*(\d[\d,]*)/g)) add(m[1], 'scan', i); });
    return [...cnt.values()].map((z) => ({ id: 'lbl:' + z.lbl, label: `이름표 '${z.lbl}'`, how: 'label', lbl: z.lbl, re: agLblRe(z.lbl), src: z.src, hit: z.hit.size })).sort((a, b) => b.hit - a.hit || (a.src === 'known' ? -1 : 1)).slice(0, o.max || 8); }
  /* ④ 작은 표본 시험 — 받아 둔 원문으로(새 요청 0) · 아는 값이 있으면 같아야 성공 · range 밖은 실패 */
  function agTrial(g, cands, samples, spec, now) { spec = spec || {}; const S = (samples || []).filter((x) => x && x.s != null); const out = []; if (!S.length) return out;
    for (const c of cands || []) { if (!c || !c.re || (g.champ && c.id === g.champ)) continue; let ok = 0; for (const x of S) { const v = agApply(c, x.s); if (v == null) continue; if (spec.range && (v < spec.range[0] || v > spec.range[1])) continue; if (x.v != null && Math.round(+x.v) !== v) continue; ok++; }
      agRecord(g, c.id, { n: S.length, ok, cost: S.length, meta: { ...c, from: c.from || 'found', at: new Date(agNow(now)).toISOString() } }, now); out.push({ id: c.id, ok, n: S.length }); }
    return out; }
  /* ①~⑥ 한 번에 — samples(지금 원문 [{s, v?(아는 값)}])·spec(field·type·range·syn)·info(status 등)을 주면 떨어졌을 때 스스로 후보를 찾아 시험·채택 · 늘(100%여도) 하루 한 번은 같은 뜻 다른 표기를 찾아 후보 성적을 쌓음 */
  function agAdapt(g, o) { o = o || {}; const now = agNow(o.now); const lines = []; const j = agJudge(g); const day = agDay(now); const bad = j.st === 'broken' || j.st === 'drop' || j.st === 'low';
    if (bad && (!g.flag || g.flag.st !== j.st || g.flag.day !== day)) { const ch = g.champ ? g.methods[g.champ] : null; const sm = (g.smp || {})[g.champ] || {}; const cur = o.raw != null ? o.raw : sm.bad ? sm.bad.s : (o.samples && o.samples[0] ? o.samples[0].s : null); const cl = agClassify(sm.good ? sm.good.s : null, cur, o.info || (sm.bad && sm.bad.info));
      const dd = cl.d ? [cl.d.lostW.length ? `사라진 낱말 ${cl.d.lostW.slice(0, 4).map((x) => `'${x}'`).join('·')}` : '', cl.d.gainW.length ? `새 낱말 ${cl.d.gainW.slice(0, 4).map((x) => `'${x}'`).join('·')}` : '', cl.d.lostC.length ? `사라진 칸 이름 ${cl.d.lostC.slice(0, 3).join('·')}` : ''].filter(Boolean).join(' · ') : '';
      g.flag = { st: j.st, day, at: new Date(now).toISOString(), k: cl.k }; lines.push(agLine(g, '바뀜', `🔎 ${g.label}: 목표 달성률 ${pct(j.ref)} → ${pct(j.r)}(${ch ? `방법 '${ch.label}'` : '방법 없음'}) — ${cl.ko}${dd ? ' · ' + dd : ''}`, { judge: j, k: cl.k, d: cl.d || null }, now)); }
    else if (!bad && g.flag && j.st === 'ok') { lines.push(agLine(g, '회복', `✅ ${g.label}: 목표 달성률 ${pct(j.r)}로 돌아옴(방법 '${(g.methods[g.champ] || {}).label || '-'}')`, { judge: j }, now)); g.flag = null; }
    let tried = null; const explore = !g.lastX || g.lastX !== day; if (o.samples && o.samples.length && (bad || explore || o.force)) { const cands = agLabelCands(o.samples, o.spec, { scan: bad || o.scan }); const arch = Object.values(g.methods).filter((m) => m.re && m.id !== g.champ).map((m) => ({ id: m.id, label: m.label, how: m.how, lbl: m.lbl, re: m.re, from: m.from })); const seen = new Set(); const all = cands.concat(arch).filter((c) => !seen.has(c.id) && seen.add(c.id)); tried = agTrial(g, all, o.samples, o.spec, now); g.lastX = day; }
    for (const L of agDecide(g, now)) lines.push(L); return { judge: j, tried, lines }; }
  /* 웹앱 🔬 연구 탭에 보일 작은 요약(문서 작게) */
  function agSummary(g) { if (!g || !g.methods) return null; const ch = g.champ ? g.methods[g.champ] : null; const S = ch ? agStat(ch) : null; const j = agJudge(g); const R = ch ? agRecent(ch, 3) : null;
    const others = Object.values(g.methods).filter((m) => m !== ch && m.st !== 'off').map((m) => { const s = agStat(m); return { id: m.id, label: m.label, st: m.st, r: r3(s.r), n: Math.round(s.n), eff: r3(s.eff) }; }).sort((a, b) => (b.r || 0) - (a.r || 0)).slice(0, 3);
    const last = (g.ev || []).filter((e) => e.kind !== '시작').slice(-1)[0] || null; const fl = g.fl || g.fl0 ? agFlSum(g) : null; return { id: g.id, label: g.label, goal: g.goal, unit: g.unit, st: j.st, ...(fl ? { fl } : {}), champ: ch ? { id: ch.id, label: ch.label, r: r3(S.r), n: Math.round(S.n), eff: r3(S.eff), since: ch.since || null, recent: R ? r3(R.r) : null } : null, cands: others, arch: (g.arch || []).length, last, at: g.at }; }

  /* (0.1.7 adapt10) 🧩 칸마다 길 성적 — 한 화면에서 칸마다 여러 길(운영 파서·글 이름표·구조 데이터 등)로 읽은 값을 견줘 [시도, 채움, 맞음]
   *  fields = { 칸: { 길: 값|null } } · 기준값 = 가장 많은 길이 낸 값(같으면 main 길) · 길 하나뿐이면 채움 = 맞음
   *  agFillTally(fields, {main}) → { t: { 칸: { 길: [1, 채움, 맞음] } }, tot: { 길: { n, ok } } } · agFillAdd(가, 나) 더하기 · agFill(g, t, now) 장부 g.fl(오늘)·g.fl0(어제)에 더함 · 칸 24개·길 6개까지 */
  const agHas = (v) => v != null && v !== '' && !(typeof v === 'number' && !isFinite(v)) && !(Array.isArray(v) && !v.length);
  const agKey = (v) => (Array.isArray(v) ? v.join('|') : String(v)).replace(/\s+/g, ' ').trim().toLowerCase();
  function agFillTally(fields, o) { o = o || {}; const t = {}, tot = {}; let nf = 0;
    for (const f of Object.keys(fields || {})) { const P = fields[f]; if (!P || typeof P !== 'object') continue; if (++nf > 24) break; const ps = Object.keys(P).slice(0, 6); const cnt = new Map(); for (const p of ps) if (agHas(P[p])) { const k = agKey(P[p]); cnt.set(k, (cnt.get(k) || 0) + 1); }
      let ref = null, rn = 0; const mk = o.main && agHas(P[o.main]) ? agKey(P[o.main]) : null; for (const [k, n] of cnt) if (n > rn || (n === rn && k === mk)) { ref = k; rn = n; }
      const F = (t[f] = {}); for (const p of ps) { const has = agHas(P[p]) ? 1 : 0; const ag = has && ref != null && agKey(P[p]) === ref ? 1 : 0; F[p] = [1, has, ag]; const z = (tot[p] = tot[p] || { n: 0, ok: 0 }); z.n++; z.ok += ag; } }
    return { t, tot }; }
  function agFillAdd(A, B) { A = A || {}; for (const f of Object.keys(B || {})) { const F = (A[f] = A[f] || {}); for (const p of Object.keys(B[f] || {})) { const z = (F[p] = F[p] || [0, 0, 0]); const y = B[f][p] || []; z[0] += +y[0] || 0; z[1] += +y[1] || 0; z[2] += +y[2] || 0; } } return A; }
  function agFill(g, T, now) { if (!g || !T) return g; const day = agDay(now); if (g.flDay !== day) { if (g.fl && g.flDay) { g.fl0 = g.fl; g.fl0Day = g.flDay; } g.fl = {}; g.flDay = day; }
    const fs = Object.keys(T); for (const f of fs) { if (!g.fl[f] && Object.keys(g.fl).length >= 24) continue; const F = (g.fl[f] = g.fl[f] || {}); for (const p of Object.keys(T[f] || {})) { if (!F[p] && Object.keys(F).length >= 6) continue; const z = (F[p] = F[p] || [0, 0, 0]); const y = T[f][p] || []; z[0] += +y[0] || 0; z[1] += +y[1] || 0; z[2] += +y[2] || 0; } } return g; }
  /* 칸별 길 요약(웹앱 · 진단) — 오늘 것이 적으면(칸당 5번 밑) 어제 것 · { day, f: { 칸: { 길: [시도, 채움률, 맞음률] } } } */
  function agFlSum(g) { if (!g) return null; let F = g.fl, d = g.flDay; const n0 = (X) => { let n = 0; for (const f of Object.keys(X || {})) for (const p of Object.keys(X[f])) n = Math.max(n, X[f][p][0]); return n; }; if ((!F || n0(F) < 5) && g.fl0 && n0(g.fl0) > n0(F)) { F = g.fl0; d = g.fl0Day; } if (!F || !Object.keys(F).length) return null;
    const f = {}; for (const k of Object.keys(F)) { f[k] = {}; for (const p of Object.keys(F[k])) { const z = F[k][p]; f[k][p] = [z[0], z[0] ? r3(z[1] / z[0]) : null, z[0] ? r3(z[2] / z[0]) : null]; } } return { day: d, f }; }
  
  root.ReadnowAdaptAg = { VERSION: '0.1.7', AG_DEF, AG_SYN, AG_KIND, agNew, agEnsure, agMethod, agRecord, agStat, agRecent, agJudge, agPick, agDecide, agDiff, agClassify, agSample, agLblRe, agApply, agLabelCands, agTrial, agAdapt, agSummary, agWilson, agFillTally, agFillAdd, agFill, agFlSum };
})(typeof globalThis !== 'undefined' ? globalThis : this);
;(function (g) { g.ReadnowPcMods = Object.assign(g.ReadnowPcMods || {}, { runtime: '1.89.309' }); })(typeof globalThis !== 'undefined' ? globalThis : this);
;(globalThis.__rnModQ = globalThis.__rnModQ || []).push(['runtime', '1.89.309', function () {
/* (1.64.0) 🌐 공개 전용 PC: 알라딘에 로그인하지 않는 PC가 공개 화면(우리 숍 목록 ?rnPub=1)에서 수집기를 띄움 — 로그인이 필요 없는 일만 함 · 이 PC는 알라딘 계정과 아무 연결이 없음 */
/* (1.68.2) 로거 첫 화면을 '우리 숍 목록 + ?rnPub=1'(알라딘 서버 기록에 우리 숍 번호와 낯선 표시가 함께 남음)에서 누구나 여는 '중고매장' 첫 화면 + #rnPub(# 뒤는 알라딘 서버로 가지 않음)으로 · 예전 주소로 열리면 새 주소로 바로 옮김 */
globalThis.__rnPubHome = (() => { try { if (window.top !== window) return false; if (/^\/shop\/usedshop\/wshopitem\.aspx$/i.test(location.pathname) && /[?&]rnPub=1(&|$)/.test(location.search)) { location.replace('https://www.aladin.co.kr/usedstore/wgate.aspx'); return false; } return !!globalThis.__rnEngine || (/^\/usedstore\/wgate\.aspx$/i.test(location.pathname) && (/^#rnPub\b/.test(location.hash) || !!globalThis.__rnPubHomeR)); /* (1.72.0) 🧪 로거 엔진 화면도 로거 첫 화면 */ /* (1.71.1 자동 점검) 본체가 #rnPub 표시를 주소에서 지우므로 본체가 알아본 '로거 첫 화면'(__rnPubHomeR)도 받음 */ } catch (e) { return false; } })();
/* (11/10 정범님 11/09 밤 '내가 따로 손댈 일 없이 적용되는 거야?') 🛡 Microsoft Clarity(방문 녹화)를 수집기가 알라딘 화면마다 손 0으로 막음 — 사무실 PC마다 웹앱 단추·관리자 허락 창을 누를 일 없게
 *  왜 이 길: 수집기 머리는 @run-at document-idle(화면 글을 다 읽은 뒤 깨어남)이고 머리·로더를 바꾸면 PC마다 Tampermonkey 업데이트를 사람이 눌러야 함(약속 5) → '화면 맨 처음'에는 못 끼어듦
 *    그러나 알라딘의 Clarity는 화면 끝의 구글 태그 관리자(GTM-NFVWV75 · async) → Clarity 태그(clarity.ms/tag/u5bx3exnb0 · async) → 본체(scripts.clarity.ms/0.8.75/clarity.js · async) 세 파일을 차례로 받아야 시작함(11/07 샵매니저 원문 aladin_raw wrecord_edit로 확인)
 *    → 수집기가 깨어날 때 본체가 아직 안 돌았으면: window.clarity 자리에 '이미 Clarity가 있음' 표(v)를 단 빈 함수를 먼저 둠
 *       · 근거(clarity-js 0.8.75 원문 queue.ts process): window.clarity.v가 있으면 'CL001 Multiple Clarity tags'만 남기고 시작하지 않음 → 녹화·기록·보내기 0 · 태그 조각(a[b]=a[b]||…)도 우리 함수를 그대로 둠 · 덮어쓰기는 무시(오류 안 냄)
 *    → 이미 돌고 있으면(본체가 먼저 돈 화면): 공식 clarity('stop')으로 바로 멈춘 뒤 같은 표를 덮음(다시 시작 못 하게) — 1.89.235는 숨은 틀을 만들 때만 멈췄음 → 이제 알라딘 화면마다 깨어나자마자
 *    → 같은 출처 틀(iframe — 수집기의 숨은 수정·등록 틀 · 알라딘 화면 속 틀): 틀 문서가 바뀔 때마다 0.1초 안에 같은 표를 넣음(틀 속 Clarity도 세 파일을 받아야 시작) · 이미 돌면 멈춤
 *  한계(정직하게): 파일 받기 자체(GTM·태그)는 못 막음(그건 hosts — 웹앱 🛡 단추 · 이제 선택) · 드물게 본체가 수집기보다 먼저 돈 화면은 깨어나자마자 멈춤(그 사이 몇 초는 녹화됨)
 *  알라딘 화면 동작·요청 수는 그대로 · 로거 크롬(rn-pubChrome)은 건드리지 않음(로거 도우미가 이미 막음 · 약속 0) · 끄기: 이 PC 수집기 저장소 rn-clarity-off = true · 셈은 PC 신호(pcBeat.blk.cg)로 웹앱 🖥 기기 운영 보고에 */
(function rnClarityGuard() { const G = globalThis; try { if (window.top !== window || !/(^|\.)aladin\.co\.kr$/i.test(location.hostname) || G.__rnPubChrome || GM_getValue('rn-clarity-off', false)) return; } catch (e) { return; }
  const UW = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window; const S = { on: true, pre: 0, stop: 0, frPre: 0, frStop: 0, since: Date.now() }; G.__rnClarityGuard = S;
  const guard = (w) => { try { const c = w.clarity; if (c && c.__rnBlk) return 'had'; let ran = false; if (typeof c === 'function' && c.v) { try { c('stop'); ran = true; } catch (e) {} }
      const f = function () {}; f.v = 'rn-block'; f.t = true; f.q = []; f.__rnBlk = 1; Object.defineProperty(w, 'clarity', { configurable: true, enumerable: false, get: () => f, set: () => {} }); return ran ? 'stop' : 'pre'; } catch (e) { return null; } };
  const r0 = guard(UW); if (r0 === 'pre') S.pre++; else if (r0 === 'stop') S.stop++;
  const FR = new WeakMap(); /* 틀 → 표를 넣은 문서(문서가 바뀌면 다시) */
  const scan = () => { try { const L = document.querySelectorAll('iframe,frame'); for (let i = 0; i < L.length; i++) { const f = L[i]; let w = null, d = null; try { w = f.contentWindow; d = w && w.document; } catch (e) { continue; } if (!w || !d || FR.get(f) === d) continue; let same = false; try { same = w.location.hostname === location.hostname; } catch (e) {} if (!same) continue; FR.set(f, d); const r = guard(w); if (r === 'pre') S.frPre++; else if (r === 'stop') S.frStop++; } } catch (e) {} };
  setInterval(scan, 100); setTimeout(() => { try { window.__rnLog && window.__rnLog('수집기', 'info', `🛡 이 화면의 Microsoft Clarity(방문 녹화) — ${S.stop ? '이미 돌고 있어 바로 멈춤' : '시작 전에 막음'}(사람 손 0 · 끄기: 이 PC 저장소 rn-clarity-off)`); } catch (e) {} }, 4000);
})();
/* (1.88.5) ⏱ 탭 성능 기록 — 정범님 10/20 '수집기 때문에 크롬 전체가 엄청 느려짐'(두 번째) · 짐작이 아니라 실측: 탭마다 5분에 한 번 작업 기록(rn_logs)에 한 줄
 *  역할·화면·힙(MB)·화면 요소 수·긴 작업(50ms 넘게 화면을 막은 것) 횟수·합계·되풀이 타이머(setInterval)마다 쓴 시간 상위·Tampermonkey 저장소 쓰기(GM_setValue) 횟수·크기 상위 · 값은 숫자와 함수 앞부분만(고객 정보 없음) */
(function rnPerfProbe() { const G = globalThis; if (window.top !== window || G.__rnPerf) return; const P = G.__rnPerf = { t0: Date.now(), iv: new Map(), gm: new Map(), lt: { n: 0, ms: 0, max: 0 } };
  try { const oSI = G.setInterval.bind(G); G.setInterval = function (fn, ms, ...a) { if (typeof fn !== 'function') return oSI(fn, ms, ...a); let key = ''; try { key = (ms | 0) + 'ms ' + String(fn).replace(/\s+/g, ' ').replace(/^(async )?\(\) => \{?\s*(try \{ )?/, '').slice(0, 56); } catch (e) { key = (ms | 0) + 'ms ?'; } let r = P.iv.get(key); if (!r) P.iv.set(key, (r = { n: 0, ms: 0, max: 0, c: 0 })); r.c++; return oSI(function () { const t = performance.now(); try { return fn.apply(this, arguments); } finally { const d = performance.now() - t; r.n++; r.ms += d; if (d > r.max) r.max = d; } }, ms, ...a); }; } catch (e) {}
  /* (1.89.1) 되풀이 타이머 말고도 — 한 번 도는 타이머(setTimeout)와 Firebase 실시간 받기(onSnapshot) 처리 중 50ms 넘게 걸린 것만 이름·시간 기록(어디가 화면을 막는지) */
  P.slow = new Map(); const slowAdd = (key, d) => { let r = P.slow.get(key); if (!r) P.slow.set(key, (r = { n: 0, ms: 0, max: 0 })); r.n++; r.ms += d; if (d > r.max) r.max = d; };
  try { const oST = G.setTimeout.bind(G); G.setTimeout = function (fn, ms, ...a) { if (typeof fn !== 'function') return oST(fn, ms, ...a); return oST(function () { const t = performance.now(); try { return fn.apply(this, arguments); } finally { const d = performance.now() - t; if (d > 50) { let k = ''; try { k = 't ' + String(fn).replace(/\s+/g, ' ').replace(/^(async )?\(\) => \{?\s*(try \{ )?/, '').slice(0, 56); } catch (e) { k = 't ?'; } slowAdd(k, d); } } }, ms, ...a); }; } catch (e) {}
  P.snapWrap = () => { try { const F = G.firebase && G.firebase.firestore; if (!F || F.__rnSnapW) return; F.__rnSnapW = 1; const wrap = (proto, kind) => { if (!proto || !proto.onSnapshot) return; const o = proto.onSnapshot; proto.onSnapshot = function (...args) { let key = kind; try { key = kind + ' ' + (this.path || (this._delegate && this._delegate._query && this._delegate._query.path && this._delegate._query.path.segments && this._delegate._query.path.segments.join('/')) || (this.id ? this.id : '?')); } catch (e) {} const W2 = (f) => (typeof f === 'function' ? function () { const t = performance.now(); try { return f.apply(this, arguments); } finally { const d = performance.now() - t; if (d > 50) slowAdd('snap ' + key.slice(0, 60), d); } } : f); for (let i = 0; i < args.length; i++) { if (typeof args[i] === 'function') { args[i] = W2(args[i]); break; } if (args[i] && typeof args[i] === 'object' && typeof args[i].next === 'function') { args[i] = { ...args[i], next: W2(args[i].next) }; break; } } return o.apply(this, args); }; }; wrap(F.DocumentReference && F.DocumentReference.prototype, 'doc'); wrap(F.Query && F.Query.prototype, 'q'); } catch (e) {} }; P.snapWrap(); setTimeout(P.snapWrap, 3000);
  try { const oSV = GM_setValue; GM_setValue = function (k, v) { try { const kk = /^rn-[a-z]+$/i.test(String(k)) ? String(k) : String(k).replace(/([-_])[a-z0-9]{6,12}(_\d+)?$/i, '$1*'); /* (1.89.76 자동 점검) 숫자 없는 고정 열쇠(rn-lcache·rn-engine 등)는 묶지 않음 — 'rn-*' 한 줄에 섞여 로거 큰 쓰기(10/25 하루 200번 약 1GB)가 어느 열쇠인지 못 가렸음 */ let r = P.gm.get(kk); if (!r) P.gm.set(kk, (r = { n: 0, b: 0 })); r.n++; r.b += v == null ? 0 : typeof v === 'string' ? v.length : (JSON.stringify(v) || '').length; } catch (e) {} return oSV(k, v); }; } catch (e) {}
  P.ltBy = new Map(); P.lfx = { n: 0, ms: 0, scr: 0, lay: 0, block: 0 }; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { P.lt.n++; P.lt.ms += e.duration; if (e.duration > P.lt.max) P.lt.max = e.duration; const at = (e.attribution || [])[0] || {}; const k = `${e.name}${at.containerType && at.containerType !== 'window' ? '/' + at.containerType : ''}${at.containerSrc ? ' ' + String(at.containerSrc).replace(/^https?:\/\/[^/]+/, '').slice(0, 40) : ''}`; let r = P.ltBy.get(k); if (!r) P.ltBy.set(k, (r = { n: 0, ms: 0 })); r.n++; r.ms += e.duration; } }).observe({ type: 'longtask', buffered: true }); } catch (e) {} /* (1.89.0) 긴 작업이 이 탭 것(self)인지, 같은 크롬 프로세스를 함께 쓰는 다른 탭·창 것(multiple-contexts·same-origin…)인지 */
  /* (1.88.6) 긴 작업이 '누구' 것인지 — 크롬의 긴 화면 그림(long-animation-frame) 기록에 든 스크립트별 시간(어느 파일·함수·무엇이 불렀는지)을 모음 · 1.88.5 실측: 아무 일도 안 하는 쉬는 탭에서도 5분에 7~15초(한 번에 최대 3.7초) 화면이 막혔는데 우리 타이머는 0.2초뿐이었음 */
  P.lf = new Map(); try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { P.lfx.n++; P.lfx.ms += e.duration; P.lfx.block += e.blockingDuration || 0; const scr = (e.scripts || []).reduce((a, x) => a + x.duration, 0); P.lfx.scr += scr; if (e.styleAndLayoutStart && e.startTime != null) P.lfx.lay += Math.max(0, e.startTime + e.duration - e.styleAndLayoutStart); for (const sc of e.scripts || []) { if (sc.duration < 30) continue; let src = String(sc.sourceURL || ''); src = /userscript|tampermonkey|chrome-extension|moz-extension/i.test(src) ? 'TM:' + (src.match(/[^/=?#]+\.user\.js|[^/]+$/) || [''])[0].slice(0, 40) : src.replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, '').slice(-50) || '(페이지)'; const k = `${sc.invokerType || ''}:${String(sc.invoker || '').slice(0, 50)} ${String(sc.sourceFunctionName || '').slice(0, 40)} @${src}`; let r = P.lf.get(k); if (!r) P.lf.set(k, (r = { n: 0, ms: 0, max: 0, lay: 0 })); r.n++; r.ms += sc.duration; r.lay += sc.forcedStyleAndLayoutDuration || 0; if (sc.duration > r.max) r.max = sc.duration; } } }).observe({ type: 'long-animation-frame', buffered: true }); } catch (e) {}
  /* (11/12 fix3 · verify3 '리드 탭 화면 요소 5분마다 +160') 화면 요소를 어디 것인지 나눠 셈 — 기록 창(#rn-jw) · 우리 칸(id가 rn으로 시작하는 맨 위 상자들) · 알라딘 표에 붙인 우리 표시(class rn…) · 숨은 틀(iframe) · 나머지(알라딘 화면) */
  P.domBy = () => { try { const top = []; const all = document.getElementsByTagName('*').length; const jwE = document.getElementById('rn-jw'); const jw = jwE ? 1 + jwE.getElementsByTagName('*').length : 0; let ui = 0, uiN = 0; for (const el of document.querySelectorAll('[id^="rn"],[id^="RN"]')) { if (el.parentElement && el.parentElement.closest('[id^="rn"],[id^="RN"]')) continue; const n0 = 1 + el.getElementsByTagName('*').length; ui += n0; uiN++; if (el.id !== 'rn-jw') top.push([el.id, n0]); }
    const tag = document.querySelectorAll('[class^="rn"]:not([id^="rn"])').length; const ifr = document.querySelectorAll('iframe,frame').length; const rows = jwE ? (jwE.querySelector('#rnjB') || { childElementCount: 0 }).childElementCount : 0; const sub = (id) => { const e = document.getElementById(id); return e ? 1 + e.getElementsByTagName('*').length : 0; }; return { jw, rows, ui: Math.max(0, ui - jw), uiN, tag, ifr, page: Math.max(0, all - ui - tag), top: top.sort((p, q) => q[1] - p[1]).slice(0, 3).map(([k, n]) => `${k} ${n}`).join('·'), plog: sub('rnpLog'), clog: (document.querySelector('#rn-crm .log') || { childElementCount: 0 }).childElementCount }; } catch (e) { return null; } };
  const mb = (b) => Math.round(b / 1048576); const kb = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + 'MB' : Math.round(b / 1024) + 'KB');
  window.__rnPerfNow = () => { const m = performance.memory || {}; const ivs = [...P.iv.entries()].filter(([, r]) => r.n).sort((a, b) => b[1].ms - a[1].ms).slice(0, 5); const gms = [...P.gm.entries()].sort((a, b) => b[1].b - a[1].b).slice(0, 5); const ivAll = [...P.iv.values()].reduce((a, r) => a + r.ms, 0); const gmN = [...P.gm.values()].reduce((a, r) => a + r.n, 0), gmB = [...P.gm.values()].reduce((a, r) => a + r.b, 0);
    let tabs = 0; try { for (const k of GM_listValues()) if (/^rnu-live-/.test(k)) { const v = GM_getValue(k, null); if (v && Date.now() - (v.at || 0) < 60000) tabs++; } } catch (e) {}
    return { min: Math.round((Date.now() - P.t0) / 60000), role: window.__rnRole ? window.__rnRole() : '-', page: location.pathname.split('/').pop(), heap: m.usedJSHeapSize ? mb(m.usedJSHeapSize) : null, lim: m.jsHeapSizeLimit ? mb(m.jsHeapSizeLimit) : null, dom: document.getElementsByTagName('*').length, domBy: P.domBy(), lt: { n: P.lt.n, s: +(P.lt.ms / 1000).toFixed(1), max: Math.round(P.lt.max) }, iv: { n: P.iv.size, s: +(ivAll / 1000).toFixed(1), top: ivs.map(([k, r]) => `${k} — ${r.n}번 ${(r.ms / 1000).toFixed(1)}초 최대 ${Math.round(r.max)}ms${r.c > 1 ? ` ×${r.c}` : ''}`) }, gm: { n: gmN, b: gmB, top: gms.map(([k, r]) => `${k} ${r.n}번 ${kb(r.b)}`) }, tabs, lf: [...(P.lf || new Map()).entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 6).map(([k, r]) => `${k} — ${r.n}번 ${(r.ms / 1000).toFixed(1)}초 최대 ${Math.round(r.max)}ms${r.lay > 50 ? ` (그리기 강제 ${(r.lay / 1000).toFixed(1)}초)` : ''}`), jw: !!(document.getElementById('rn-jw') && document.getElementById('rn-jw').classList.contains('on')) }; };
  const rep = () => { try { const x = window.__rnPerfNow(); window.__rnPerfLast = { ...x, at: Date.now() }; const line = `⏱ 5분 성능 [${x.role} · ${x.page}${x.jw ? ' · 기록 창 열림' : ''}] 힙 ${x.heap ?? '?'}/${x.lim ?? '?'}MB · 화면 요소 ${x.dom.toLocaleString()}${x.domBy ? `(기록 창 ${x.domBy.jw.toLocaleString()}·줄 ${x.domBy.rows} · 우리 칸 ${x.domBy.ui.toLocaleString()}/${x.domBy.uiN}개(${x.domBy.top} · 상품 패널 기록 ${x.domBy.plog} · 고객 패널 기록 ${x.domBy.clog}) · 표 표시 ${x.domBy.tag} · 틀 ${x.domBy.ifr} · 알라딘 화면 ${x.domBy.page.toLocaleString()})` : ''} · 긴 작업 ${x.lt.n}번 ${x.lt.s}초(최대 ${x.lt.max}ms) · 되풀이 타이머 ${x.iv.n}개 ${x.iv.s}초 · GM 쓰기 ${x.gm.n}번 ${kb(x.gm.b)} · 이 PC 수집기 탭 ${x.tabs}개 ‖ 타이머 상위: ${x.iv.top.join(' | ') || '-'} ‖ GM 상위: ${x.gm.top.join(' | ') || '-'}`;
      window.__rnLog && window.__rnLog('성능', x.lt.s > 30 || (x.heap && x.lim && x.heap / x.lim > 0.6) ? 'warn' : 'detail', line); window.__rnLog && window.__rnLog('성능', 'detail', `⏱ 50ms 넘은 한 번 일·실시간 받기 [${x.role} · ${x.page}] ${[...(P.slow || new Map()).entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 6).map(([k, r]) => `${k} ${r.n}번 ${(r.ms / 1000).toFixed(1)}초 최대 ${Math.round(r.max)}ms`).join(' | ') || '-'}`.slice(0, 590)); window.__rnLog && window.__rnLog('성능', 'detail', `⏱ 긴 작업 누구 것 [${x.role} · ${x.page}] ${[...(P.ltBy || new Map()).entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 5).map(([k, r]) => `${k} ${r.n}번 ${(r.ms / 1000).toFixed(1)}초`).join(' | ') || '-'} ‖ 이 탭 화면 그림 ${P.lfx.n}번 ${(P.lfx.ms / 1000).toFixed(1)}초(막음 ${(P.lfx.block / 1000).toFixed(1)}초 · 스크립트 ${(P.lfx.scr / 1000).toFixed(1)}초 · 그리기·배치 ${(P.lfx.lay / 1000).toFixed(1)}초) ‖ GM 상위: ${x.gm.top.join(' | ') || '-'}`.slice(0, 590)); if (x.lf.length) x.lf.forEach((t, i) => window.__rnLog('성능', 'detail', `⏱ 화면을 막은 스크립트 ${i + 1}위 [${x.role} · ${x.page}] ${t}`.slice(0, 590))); /* (1.88.7) 한 줄 600자 한도로 잘리던 것 → 순위마다 한 줄 */ P.iv.forEach((r) => { r.n = 0; r.ms = 0; r.max = 0; }); P.gm.clear(); P.lf && P.lf.clear(); P.ltBy && P.ltBy.clear(); P.slow && P.slow.clear(); P.lfx = { n: 0, ms: 0, scr: 0, lay: 0, block: 0 }; P.lt = { n: 0, ms: 0, max: 0 }; P.t0 = Date.now(); } catch (e) {} };
  setTimeout(rep, 60000); setInterval(rep, 5 * 60000); })();
/* 리드나우 수집기 1.0.0 — 고객 수집기(0.16.1)와 상품 수집기(0.8.1)를 하나로 합친 것.
 * 화면 오른쪽 위 탭으로 '고객'과 '상품·판매자·매입'을 바꿔 봄. 로그인·PC 이름·알라딘 아이디는 한 번만 넣으면 둘 다 씀.
 * 알라딘 작업 잠금은 하나(crm_system/work_lock): 고객 수집이 먼저(상품 쪽 긴 작업은 양보 후 자동으로 이어감). */
/* (1.63.6 전체 점검) 팝업 대신 화면 위 알림 띠 — alert()는 사람이 '확인'을 누를 때까지 탭 전체(잠금 신호·⏰ 자동·실시간 듣기)를 멈춰, 사람이 없는 PC에서 다른 PC까지 모두 막혔음
 *  __rnNote(글, 'err'|'warn') = 위에 띠를 띄우고(누르면 닫힘 · 같은 글은 한 번만) 기록에도 남김 · __rnUserAt = 사람이 마지막으로 누른 때(확인 창은 사람이 막 누른 때만) */
(function () { const G = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window; try { document.addEventListener('pointerdown', () => { window.__rnUserAt = Date.now(); }, true); document.addEventListener('keydown', () => { window.__rnUserAt = Date.now(); }, true); } catch (e) {}
  window.__rnHuman = (ms) => Date.now() - (window.__rnUserAt || 0) < (ms || 4000);
  window.__rnNote = (msg, kind) => { try { console.warn('[리드나우]', msg); const show = () => { let box = globalThis.__rnById('rn-note-box'); if (!box) { box = document.createElement('div'); box.id = 'rn-note-box'; box.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:2147483646;max-width:min(380px,90vw);max-height:45vh;overflow:auto;display:flex;flex-direction:column;align-items:flex-end;gap:4px;font:12px/1.45 system-ui,sans-serif'; globalThis.__rnMount(box); } /* (1.66.0) 화면 위 가운데(샵매니저 단추를 가림) → 오른쪽 아래 작게 · 15초 뒤 \'⚠ 알림 N\' 단추로 접힘 */
        if ([...box.children].some((x) => x.dataset.msg === msg)) return; const d = document.createElement('div'); d.dataset.msg = msg; d.className = 'rn-note-it'; d.style.cssText = `background:${kind === 'warn' ? '#FFF4E0;color:#7A4A00;border:1px solid #E8B860' : '#FDE8E6;color:#8A2420;border:1px solid #E7B4AE'};border-radius:8px;padding:6px 10px;white-space:pre-wrap;box-shadow:0 3px 10px rgba(0,0,0,.15);cursor:pointer`; d.textContent = msg + '  (누르면 닫힘)'; d.onclick = () => { d.remove(); noteChip(); }; box.appendChild(d); { const its = box.querySelectorAll('.rn-note-it'); for (let i = 0; i < its.length - 20; i++) its[i].remove(); } /* (fix3) 알림 띠는 최근 20개까지(사람이 없는 PC에서 글이 조금씩 달라 끝없이 쌓이지 않게) */ noteChip(true); clearTimeout(box._fold); box._fold = setTimeout(() => noteFold(true), 15000); };
        const noteFold = (on) => { const box = globalThis.__rnById('rn-note-box'); if (!box) return; box._folded = on; box.querySelectorAll('.rn-note-it').forEach((x) => (x.style.display = on ? 'none' : '')); noteChip(); };
        const noteChip = (open) => { const box = globalThis.__rnById('rn-note-box'); if (!box) return; if (open) box._folded = false; const n = box.querySelectorAll('.rn-note-it').length; let c = box.querySelector('.rn-note-chip'); if (!n) { if (c) c.remove(); return; } if (!c) { c = document.createElement('button'); c.className = 'rn-note-chip'; c.style.cssText = 'order:99;border:1px solid #E7B4AE;background:#fff;color:#8A2420;border-radius:14px;padding:3px 10px;font:12px system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.12)'; c.onclick = () => noteFold(!box._folded); box.appendChild(c); } c.textContent = box._folded ? `⚠ 리드나우 알림 ${n} — 펼치기` : `접기 (${n})`; if (!box._folded) box.querySelectorAll('.rn-note-it').forEach((x) => (x.style.display = '')); };
      if (document.body) show(); else document.addEventListener('DOMContentLoaded', show); } catch (e) {} };
  /* (1.63.8 점검) 남은 알림 팝업(alert) 모두 → 화면 위 알림 띠(멈추지 않음) — alert는 '확인'을 누를 때까지 탭 전체(잠금 신호·⏰ 자동·실시간 듣기)를 멈췄음 · 확인을 묻는 창(confirm)은 사람이 막 누른 때만 뜸 */
  try { window.alert = (m) => window.__rnNote(String(m == null ? '' : m), 'warn'); } catch (e) {}
  /* (1.89.173 정범님 11/01 '알라딘이 팝업을 띄우면 수집기와 브라우저가 멈춤 · 다른 곳에선 왜 멈췄는지 알 길이 없음') 🛡 알라딘 화면의 진짜 팝업(alert·confirm·prompt)을 가로챔
   *  까닭: 위 window.alert 바꾸기는 수집기 자기 공간(Tampermonkey 샌드박스)의 것이라 알라딘 화면이 띄우는 팝업은 그대로 탭을 멈췄음 → 화면 쪽(unsafeWindow)과 같은 출처 틀까지
   *  판단: 사람이 방금(8초 안) 눌렀으면 원래 팝업 그대로(사람이 결정) · 아니면 글을 읽어 갈래 —
   *   ⓐ 알림(alert): 탭을 멈추지 않고 '확인' 처리 · 글은 기록 · 오류·실패·로그인·세션 글이면 경고로 · 돈·주문 관련 글이면 관리자 알림
   *   ⓑ 확인 묻기(confirm): 삭제·취소·판매중지·환불·결제·출금·발송처리·반품·교환·일괄·초기화 같은 되돌리기 어려운 일이면 '취소'(하지 않음) + 관리자 확인 알림 · 그 밖도 모르는 것은 '취소' + 알림(안전 쪽) · 수집기 자신이 하는 일은 그 일이 잠깐 따로 정한 답을 씀(그대로)
   *   ⓒ 값 묻기(prompt): 빈 답(취소) + 알림
   *  남김: Firebase rn_dialogs(PC·화면·글·판단·관리자 확인 필요) — 웹앱 맨 위 '⚠ 알라딘 팝업 확인' 띠 · 이 PC 바탕화면 알림 · 기록 줄 */
  try { const DANGER = /삭제|취소|판매\s*중지|일시\s*중지|환불|결제|출금|발송\s*처리|반품|교환|일괄|초기화|탈퇴|해지|변경\s*하시겠|저장\s*하시겠|등록\s*하시겠|주문/; const WARN = /오류|에러|실패|잘못|권한|로그인|세션|만료|접근|차단|제한|초과/; const MONEY = /결제|환불|출금|정산|예치금|주문|취소|반품/;
    const Q = []; const rec = (kind, msg, decision, needAdmin, why) => { const m = String(msg == null ? '' : msg).slice(0, 500); const x = { kind, msg: m, decision, needAdmin: !!needAdmin, why, page: location.pathname + location.search.slice(0, 120), at: new Date().toISOString() }; Q.push(x);
        try { window.__rnLog && window.__rnLog('팝업', needAdmin ? 'err' : WARN.test(m) ? 'warn' : 'info', `🛡 알라딘 팝업(${kind}) — "${m.slice(0, 120)}" → ${decision}${needAdmin ? ' · ⚠ 관리자 확인 필요' : ''} (${why})`); } catch (e) {}
        if (needAdmin) { try { typeof GM_notification === 'function' && GM_notification({ title: '리드나우 — 알라딘 팝업 확인 필요', text: `${m.slice(0, 120)}\n→ 수집기가 '${decision}' 처리함 · 웹앱에서 확인`, timeout: 0 }); } catch (e) {} }
        flush(); };
    const flush = () => { try { const F = (typeof firebase !== 'undefined' && firebase) || null; if (!Q.length || !F || !F.apps || !F.apps.length || !F.auth().currentUser) return; const pc = (window.__rnPcName && window.__rnPcName.get()) || null; const L = Q.splice(0); const db = F.firestore(); L.forEach((x) => db.collection('rn_dialogs').add({ ...x, pc, ack: false, uploadedAt: F.firestore.FieldValue.serverTimestamp() }).catch(() => {})); } catch (e) {} };
    setInterval(flush, 30000);
    const guard = (w) => { try { if (!w || w.__rnDlg) return; w.__rnDlg = 1; const nA = w.alert, nC = w.confirm, nP = w.prompt;
        w.alert = function (m) { if (window.__rnHuman(8000)) return nA.call(w, m); const t = String(m == null ? '' : m); rec('알림', t, '확인(탭을 멈추지 않음)', MONEY.test(t) && WARN.test(t), '사람이 없을 때 알림은 닫아도 결과가 바뀌지 않음'); };
        w.confirm = function (m) { if (window.__rnHuman(8000)) return nC.call(w, m); const t = String(m == null ? '' : m); const dg = DANGER.test(t); rec('확인 묻기', t, '취소(하지 않음)', true, dg ? '되돌리기 어려운 일일 수 있어 사람이 없으면 하지 않음' : '모르는 확인 — 안전하게 하지 않음'); return false; };
        w.prompt = function (m) { if (window.__rnHuman(8000)) return nP.call(w, m); rec('값 묻기', String(m == null ? '' : m), '빈 답(취소)', true, '값을 넣어야 하는 창 — 사람이 필요'); return null; };
      } catch (e) {} };
    guard(G); /* 알라딘 화면 쪽 */
    /* (1.89.174) '사이트에서 나가시겠습니까?'(beforeunload) — 수집기가 안전한 새로고침·탭 닫기를 할 때 이 창이 뜨면 탭이 멈춤 → 사람이 방금 누르지 않았으면 화면이 건 떠나기 확인을 지움(기록) */
    try { const nAdd = G.addEventListener; G.addEventListener = function (t, f, o2) { if (String(t) === 'beforeunload' && !window.__rnHuman(8000)) { rec('떠나기 확인', '화면이 떠나기 확인(beforeunload)을 걸려 함', '걸지 않음', false, '수집기가 새로고침·닫기 할 때 탭이 멈추지 않게'); return; } return nAdd.call(this, t, f, o2); }; setInterval(() => { try { if (G.onbeforeunload && !window.__rnHuman(8000)) { G.onbeforeunload = null; rec('떠나기 확인', '화면에 걸린 떠나기 확인(onbeforeunload)', '지움', false, '수집기가 새로고침·닫기 할 때 탭이 멈추지 않게'); } } catch (e) {} }, 5000); } catch (e) {}
    const scan = (d, depth) => { try { for (const f of d.querySelectorAll('iframe,frame')) { try { const cw = f.contentWindow; if (cw && cw.location.hostname === location.hostname) { guard(cw); if (depth < 3) scan(cw.document, depth + 1); } } catch (e) {} if (!f.__rnDlgL) { f.__rnDlgL = 1; f.addEventListener('load', () => { try { if (f.contentWindow) { f.contentWindow.__rnDlg = 0; guard(f.contentWindow); } } catch (e) {} }); } } } catch (e) {} };
    const go = () => { scan(document, 0); try { new MutationObserver(() => scan(document, 0)).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) {} };
    if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
    window.__rnDlgGuard = guard; } catch (e) {} })();
function rnPwEye(filter) { /* (1.63.8) 비밀번호 칸 옆 👁 — 누르고 있는 동안만 보이고 떼면 다시 가림(마우스·손가락 모두) */
  const add = (inp) => { if (inp._rnEye || (filter && !filter(inp))) return; inp._rnEye = 1; const b = document.createElement('button'); b.type = 'button'; b.className = 'rn-pweye'; b.textContent = '👁'; b.title = '누르고 있는 동안만 비밀번호가 보임 · 떼면 다시 가림'; b.tabIndex = -1; b.setAttribute('aria-label', '비밀번호 잠깐 보기');
    b.style.cssText = 'margin-left:4px;padding:2px 7px;border:1px solid #C9D3CF;border-radius:6px;background:#fff;cursor:pointer;font-size:14px;line-height:1.2;vertical-align:middle;touch-action:none;user-select:none;-webkit-user-select:none';
    const show = (e) => { e.preventDefault(); inp.type = 'text'; b.style.background = '#FFF4E0'; }; const hide = () => { if (inp.type !== 'password') inp.type = 'password'; b.style.background = '#fff'; };
    b.addEventListener('pointerdown', show); ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach((ev) => b.addEventListener(ev, hide)); b.addEventListener('click', (e) => e.preventDefault()); b.addEventListener('contextmenu', (e) => e.preventDefault()); window.addEventListener('blur', hide);
    inp.insertAdjacentElement('afterend', b); };
  const scan = () => { try { document.querySelectorAll('input[type="password"]').forEach(add); } catch (e) {} }; let t = null;
  const go = () => { scan(); try { new MutationObserver(() => { clearTimeout(t); t = setTimeout(scan, 150); }).observe(document.body, { childList: true, subtree: true }); } catch (e) {} };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go); }
rnPwEye((inp) => !!(inp.closest && inp.closest('[id^="rn"], .rncard'))); /* 수집기 화면 안의 칸만(알라딘 로그인 화면 칸은 건드리지 않음) */
/* ═════════════ (1.63.7) 🧩 이 PC 기능 켜고 끄기 ═════════════
 *  📥 수집 = 일시정지와 같은 한 스위치(GM 'rnu-paused' · 이 PC의 모든 탭): 끄면 직접 누른 수집·⏰ 자동·웹앱 수집 요청·🌐 외부 정보·맡긴 수집 일(시장 지표·읽기·찾기)을 이 PC는 하지 않음 → 담당 PC 신호도 '쉬는 중'이라 다른 PC가 맡음
 *  수집 외 기능 = GM 'rnu-feat' { 열쇠: false } (이 PC만 · 기본은 모두 켬) — 화면 기능은 그 화면을 새로 열 때부터, 맡긴 일·바탕 기능은 곧바로 적용
 *  꺼 둔 맡긴 일(출고 시작·현금 판매·등록)은 이 PC가 받지 않고 대기로 남겨 다른 PC가 받음 */
/* (1.63.8) 연 탭 닫기 + 닫혔는지 확인(6초) — 못 닫으면 기록에 남김(빈 탭이 쌓이지 않게 눈에 보이게) */
window.__rnCloseTab = async (tb) => { if (!tb) return true; try { tb.close(); } catch (e) {} for (let i = 0; i < 12; i++) { if (tb.closed) return true; await new Promise((r) => setTimeout(r, 500)); } try { window.__rnLog && window.__rnLog('수집기', 'warn', '연 탭(로그인 등)을 닫지 못함 — 남은 탭이 있으면 직접 닫아 주세요'); } catch (e) {} return false; };
/* (정범님 11/13 11:54 tabfix) 🙈 수집기가 일을 위해 여는 탭은 모두 뒤 탭 — 사람이 보던 화면의 포커스를 뺏지 않음
 *  __rnTabOpt(): active:false · setParent 없음(닫힐 때 브라우저가 연 탭으로 포커스를 되돌리지 않게) · 사람 창이면 맨 뒤(insert 없음) · 🪟 작업 창 탭이면 같은 창 옆자리(insert — 11/05 작업 창 설계의 전제)
 *  __rnHumanAt: 이 탭에서 사람이 마지막으로 만진 때(마우스·키·휠·터치) · __rnHumanBusy(초): 이 탭이 화면에 보이고 그 초 안에 만졌으면 true(안전한 새로고침은 손을 놓을 때까지 기다림) */
window.__rnTabOpt = (o) => { let w = false; try { w = !!(window.__rnWork && window.__rnWork.isWork && window.__rnWork.isWork()); } catch (e) {} return { active: false, insert: w, setParent: false, ...(o || {}) }; };
window.__rnHumanAt = window.__rnHumanAt || 0;
try { const hu = (e) => { if (e && e.isTrusted === false) return; window.__rnHumanAt = Date.now(); }; for (const ev of ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'pointerdown']) window.addEventListener(ev, hu, { capture: true, passive: true }); } catch (e) {}
window.__rnHumanBusy = (sec) => { try { return document.visibilityState === 'visible' && Date.now() - (+window.__rnHumanAt || 0) < (sec || 90) * 1000; } catch (e) { return false; } };
(function rnFeatInit() {
  window.__rnFeats = [
    ['custCard', '🧑 고객 카드·고객 표시', '주문 상세 팝업의 고객 카드 · 판매관리·주문조회·주문확인요청·발송요청 목록의 주문번호 옆 고객 표시', '화면'],
    ['monitor', '🎨 가격 감시 색 표시', '상품 조회/수정 목록 줄마다 판정 엔진 묶음 색', '화면'],
    ['marks', '⚠ 우리 상품 옆 표시', '취소 주문 기록 · 참고 가격(정가·새상품 판매가) · 예스24 중고 링크 (상품 조회/수정·판매관리)', '화면'],
    ['cash', '💵 현금 판매 띠', '상품 조회/수정의 판매중지 바꾸기·다시 판매중 + 웹앱이 맡긴 현금 판매 판매중지', '화면·맡긴 일'],
    ['invoice', '🚚 송장 입력', '발송 요청 화면의 송장번호 넣기 · ALPS 파일 단추', '화면'],
    ['phrase', '💬 응대 문구 도우미', '묻고 답하기·구매평 화면의 문구 판', '화면'],
    ['reg', '📥 등록 도우미 · 🤖 자동 등록', '상품 등록 화면 채우기 + 웹앱이 맡긴 등록(개별·미등록·대량·분류 찾기)', '화면·맡긴 일'],
    ['ship', '📦 출고 시작 맡긴 일', '웹앱이 맡긴 주문확인요청 → 발송 요청 넘기기', '맡긴 일'],
    ['relogin', '🔑 자동 다시 로그인', '알라딘 로그인이 풀리면 네이버로 다시 로그인', '바탕'],
    ['update', '⟳ 새 판 저절로 맞추기', '다른 PC가 새 수집기로 돌면 쉬는 사이 새로고침해 새 판으로', '바탕'],
    ['remote', '🛰 원격 조작 받기', '웹앱·다른 PC가 보낸 ■ 중단 · ▶ 다시 시작 · ⟳ 업데이트', '바탕'],
    ['rules', '🔐 Firebase 규칙 점검', '이 PC 계정으로 쓰는 칸을 시험(6시간마다 · 남는 것 없음)', '바탕'],
  ];
  const get = () => { try { const v = GM_getValue('rnu-feat', null); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } };
  window.__rnFeat = (k) => get()[k] !== false;
  window.__rnFeatOff = () => window.__rnFeats.map((x) => x[0]).filter((k) => get()[k] === false);
  window.__rnFeatSet = (patch) => { const v = { ...get(), ...patch }; Object.keys(v).forEach((k) => { if (v[k] !== false) delete v[k]; }); GM_setValue('rnu-feat', v); return v; };
})();
/* ═════════════ 이 PC 이름: 한 곳에서 관리 ═════════════
 * 스크립트 저장공간(GM)과 알라딘 사이트의 브라우저 저장공간(localStorage) 두 곳에 함께 둠 → 스크립트를 다시 설치·교체해도 이름이 남음.
 * 고객 쪽(rn-pc)·상품 쪽(pcName)·기록이 모두 같은 이름을 씀. 자동 작업 중에는 묻지 않고, 버튼을 눌렀을 때만 한 번 물음. */
/* ═════════════ 알라딘 다시 로그인: 네이버로 로그인 (기본) ═════════════
 * 알라딘 아이디 로그인에 자동입력방지가 생겨, 알라딘 로그인 화면의 'SNS 계정으로 로그인 → 네이버'와 같은 길을 씀.
 * 알라딘 화면의 goNaverLogin()이 여는 주소: /login/wlogin_naver.aspx?returnurl=…&snsAppId=1&SecureOpener=1
 *  → 네이버 인증(nid.naver.com) → /login/wlogin_naver.aspx?code=…&state=… 로 돌아오며 알라딘 로그인 완료.
 * 네이버에 '로그인 상태 유지'로 로그인돼 있으면 아이디·비밀번호·자동입력방지 없이 바로 끝남. 네이버 아이디·비밀번호는 수집기가 절대 입력하지 않음.
 * 네이버 로그인까지 풀렸으면: 보이는 창을 열고 알림 → 사람이 네이버에 한 번 로그인(로그인 상태 유지 체크) → 수집이 이어짐 (최대 30분 기다림) */
(function rnNaverLoginInit() {
  if (window.__rnNaverLogin) return;
  const NAVER_URL = (ret) => `https://www.aladin.co.kr/login/wlogin_naver.aspx?returnurl=${encodeURIComponent(ret || 'https://www.aladin.co.kr/scm/wmain.aspx')}&snsAppId=1&SecureOpener=1`;
  window.__rnLoginMethod = () => GM_getValue('rnu-login-method', 'naver');
  window.__rnNaverLogin = async ({ isLoggedIn, log, stopped, ret }) => { /* (정범님 10/26) 1.89.105의 '무조건 멈춤'은 걷어냄 — 이 함수는 이제 로그인 규칙(__rnLoginGov.relogin)이 차례·간격·쉼을 허락했을 때만 불림 */
    const L = (m, lv) => { try { log(m, lv); } catch (e) { window.__rnLog && window.__rnLog('로그인', lv === 'err' ? 'err' : lv ? 'warn' : 'info', m); } }; if (globalThis.__rnPubHome || globalThis.__rnPubChrome) { L('🛡 로거 크롬은 알라딘에 로그인하지 않음', 1); return false; } /* (1.69.0) */ if (window.__rnFeat && !window.__rnFeat('relogin')) { L('알라딘 로그인이 풀렸지만 이 PC는 🧩 \'자동 다시 로그인\'을 꺼 둠 — 직접 로그인해 주세요', 'err'); return false; } // 각 모듈의 log가 기록 창에도 남김
    const busy = GM_getValue('rnu-naver-login', null);
    if (busy && Date.now() - busy.at < 120000) { // 다른 탭·모듈이 이미 하는 중 → 결과만 기다림
      for (let i = 0; i < 24; i++) { await new Promise((r) => setTimeout(r, 5000)); if (await isLoggedIn()) return true; if (stopped && stopped()) return false; }
      return false;
    }
    GM_setValue('rnu-naver-login', { at: Date.now() });
    L('알라딘 로그인이 풀려 네이버로 다시 로그인합니다 (네이버 로그인 상태 유지 사용)');
    let tab = GM_openInTab(NAVER_URL(ret), window.__rnTabOpt()); let ok = false;
    for (let i = 0; i < 12; i++) { await new Promise((r) => setTimeout(r, 5000)); if (stopped && stopped()) break; if (await isLoggedIn()) { ok = true; break; } } // 최대 60초
    await window.__rnCloseTab(tab);
    if (!ok && !(stopped && stopped())) { // 네이버 로그인도 풀림 → 사람에게
      L('네이버 로그인 상태가 풀려 있습니다. 새로 열린 창에서 네이버에 로그인해 주세요 ("로그인 상태 유지"를 켜면 다음부터 자동). 로그인하면 수집이 이어집니다 (최대 30분 기다림)', 'err');
      GM_setValue('rnu-need-naver', Date.now()); /* (정범님 10/26) 알림(GM_notification)은 보내지 않음 — 네이버 로그인 자체가 풀린 때만 이 PC 화면에 네이버 창을 띄우고(사람 손 없이는 안 되는 일) 기록에 남김 */
      try { if (window.firebase && firebase.apps.length && firebase.auth().currentUser) firebase.firestore().collection('rn_status').doc('needlogin_' + ((window.__rnPcName && window.__rnPcName.get()) || 'pc')).set({ need: 'naver', pcName: (window.__rnPcName && window.__rnPcName.get()) || '', at: Date.now() }, { merge: true }).catch(() => {}); } catch (e) {}
      try { window.__rnWorkShow && window.__rnWorkShow('네이버 로그인이 풀려 사람이 로그인해야 함'); } catch (e) {} /* (11/05) 🪟 작업 창에서 일하던 중이면 그 창을 화면 앞으로(숨은 창에 열린 네이버 탭을 사람이 보게) */
      tab = GM_openInTab(NAVER_URL(ret), { active: true, insert: true });
      for (let i = 0; i < 180; i++) { await new Promise((r) => setTimeout(r, 10000)); if (stopped && stopped()) break; if (await isLoggedIn()) { ok = true; break; } }
      await window.__rnCloseTab(tab);
      try { if (window.firebase && firebase.apps.length) firebase.firestore().collection('rn_status').doc('needlogin_' + ((window.__rnPcName && window.__rnPcName.get()) || 'pc')).set({ need: null, at: Date.now() }, { merge: true }).catch(() => {}); } catch (e) {}
    }
    GM_deleteValue('rnu-naver-login'); if (ok) GM_deleteValue('rnu-need-naver');
    GM_setValue(ok ? 'rnu-naver-okAt' : 'rnu-naver-failAt', Date.now());
    L(ok ? '네이버로 다시 로그인했습니다. 계속합니다' : '네이버 로그인이 되지 않았습니다', ok ? '' : 'err');
    return ok;
  };
})();
globalThis.__rnLoginRule = (function () { /* ⟦알라딘 로그인 규칙 — 수집기·클라우드에 글자 하나까지 같은 글(시험 t_login이 견줌) · 순수 함수만(저장·네트워크 없음)⟧
 *  계정 상태 문서 = Firestore app_settings/aladin_login (모든 PC·클라우드가 같이 봄)
 *   { tries:[{at,who,net,ok,how,why,code,blocked}](최근 cfg.keep개 · 기본 200) · next:{기기: 다음 시도 때(ms)} · dev:{기기:{in,at,how,pri,use,yield}} · net:{기기: 공인 IP 앞 두 마디}
 *     · blk:{'기기·망':{first,last,n,okAt}}(42FB 막힘이 기기·망별로 얼마나 갔나) · holdUntil·holdWhy(정범님이 켤 때만 — 자동으로는 넣지 않음) · cfg:{바꿀 수 있는 값}
 *     · wait:{기기:{at,since,pri}}(🪑 판매자 로그인 자리를 기다리는 기기 — 아래 '판매자 로그인 자리') }
 *  하루 요약 = app_settings/aladin_login/days/{KST 날짜} { c:{'기기·망·방법·결과·경고':수}, eps:[닫힌 막힘 {who,net,first,okAt,n}] }
 *  사람처럼(정범님 10/26 23:46 · 23:53): ① 한 회사에 사람이 여럿이듯 기기마다 각자 필요할 때 따로 시도(계정 전체 차례 없음 · 같은 기기 안의 여러 탭은 한 탭만 — 수집기 GM 표시) ② 진짜 풀린 것을 확인한 뒤 5~20초 알아차리는 시간 → 한 번
 *   ③ 안 되면(42FB 경고도 같음) 그 기기는 1~10분 사이 무작위(매번 새로) 뒤 다시 — 그 기기에 로그인이 필요한 일이 남아 있는 동안만 · 단계 간격·하루 상한·다음 날 9시 쉼 없음
 *   ④ 클라우드(데이터센터 IP): 2시간 안에 42FB가 있었고 그 뒤 어느 PC도 새 로그인에 성공하지 않았으면 기다림 → PC가 성공하면 그때부터 ①~③ */
  const DEF = { retrySec: [60, 600], noticeSec: [5, 20], keep: 200, dcWaitMin: 120, credBadMin: 360, maxDev: 4, liveMin: 30, beatSec: [600, 900], always: ['JS-MAIN', 'MJ-MAIN', 'HOME'], alwaysPair: [], phones: [], ppWinMin: 120, ppN: 3 }; /* maxDev·liveMin·beatSec = 🪑 판매자 로그인 자리(아래) · always·alwaysPair·phones = 🔒 상시 기기(정범님 10/27 15:12 — 아래 '상시 기기') */ /* credBadMin = '아이디·비밀번호가 틀림·자동입력 방지' 글이 뜬 때만(계정 잠김 막기 — 클라우드 0.11.0부터 있던 안전장치 · 42FB와 다름) */
  /* (정범님 10/28 09:39) 🪑 로그인 전용 4대 확정 = JS-MAIN · MJ-MAIN · HOME(각자 한 자리 — 짝 없음) + 클라우드(데이터센터 주소가 풀릴 때까지 🌙 조용히 기다림) · 휴대폰은 자리에 미리 셈하지 않음(웹앱으로 조작 · 우리 코드는 휴대폰에서 로그인하지 않음) */
  const num = (v, lo, hi, d) => { const n = +v; return Number.isFinite(n) && n >= lo && n <= hi ? n : d; };
  const pair = (v, lo, hi, d) => (Array.isArray(v) && v.length === 2 && +v[0] >= lo && +v[1] >= +v[0] && +v[1] <= hi ? v.map(Number) : d);
  /* 기기 이름 목록(관리도구에서 바꿈) — 빈 목록도 됨 · 'cloud'는 상시가 될 수 없음(휴대폰 목록은 이름만 셈) · 짝은 ['A','B'] 또는 Firestore용 글 'A+B'(배열 안 배열은 Firestore가 받지 않음) */
  const names = (v, d, ph) => (Array.isArray(v) ? v.map((x) => String(x == null ? '' : x).trim()).filter((x) => x && x.length <= 40 && (ph || x.toLowerCase() !== 'cloud')).slice(0, 12) : d);
  const pairs = (v, d) => (Array.isArray(v) ? v.map((p) => (Array.isArray(p) ? p : String(p == null ? '' : p).split('+')).map((x) => String(x == null ? '' : x).trim()).filter(Boolean)).filter((p) => p.length >= 2).slice(0, 6) : d);
  function cfgOf(doc) { const c = (doc && doc.cfg) || {}; return { retrySec: pair(c.retrySec, 10, 3600, DEF.retrySec), noticeSec: pair(c.noticeSec, 0, 120, DEF.noticeSec), keep: Math.round(num(c.keep, 20, 400, DEF.keep)), dcWaitMin: num(c.dcWaitMin, 0, 1440, DEF.dcWaitMin), credBadMin: num(c.credBadMin, 0, 1440, DEF.credBadMin), maxDev: Math.round(num(c.maxDev, 1, 4, DEF.maxDev)), liveMin: num(c.liveMin, 20, 120, DEF.liveMin), beatSec: pair(c.beatSec, 120, 1080, DEF.beatSec), always: names(c.always, DEF.always), alwaysPair: pairs(c.alwaysPair, DEF.alwaysPair), phones: names(c.phones, DEF.phones, true), ppWinMin: num(c.ppWinMin, 10, 1440, DEF.ppWinMin), ppN: Math.round(num(c.ppN, 1, 50, DEF.ppN)) }; } /* maxDev 1~4(5대부터 약관 위반) · 신호 간격 최대 18분 < 자리 유지 최소 20분(신호가 한 번 늦어도 자리가 풀리지 않게) */
  const kstDay = (ms) => new Date(+ms + 9 * 3600e3).toISOString().slice(0, 10);
  const kstHm = (ms) => { const k = new Date(+ms + 9 * 3600e3); return `${k.getUTCMonth() + 1}/${k.getUTCDate()} ${String(k.getUTCHours()).padStart(2, '0')}:${String(k.getUTCMinutes()).padStart(2, '0')}`; };
  const between = (a, rnd) => Math.round((a[0] + (Number.isFinite(rnd) ? Math.min(1, Math.max(0, rnd)) : Math.random()) * (a[1] - a[0])) * 1000);
  /* 계정 새 로그인 막힘 경고 — 정범님이 본 글: '로그인 과정에 문제가 발생하였습니다.(에러코드:42FB6013-…)' (같은 뜻 = 에러코드 42FB로 시작) */
  const BLOCK_RE = /로그인\s*과정에\s*문제|에러\s*코드\s*[:：]?\s*42FB|\b42FB[0-9A-F]{2,}/i;
  const isBlock = (msg) => BLOCK_RE.test(String(msg || ''));
  const codeOf = (msg) => { const m = String(msg || '').match(/에러\s*코드\s*[:：]?\s*([0-9A-F]{4,}(?:-[0-9A-F]+)?)/i) || String(msg || '').match(/\b(42FB[0-9A-F]{2,})/i); return m ? m[1].toUpperCase().slice(0, 24) : isBlock(msg) ? '42FB' : null; };
  /* 🪑 판매자 로그인 자리 (정범님 10/27) — 알라딘 이용약관 제19조(부정이용 금지) 1.① "동일한 아이디로 5대 이상의 기기(PC, 스마트폰, 태블릿PC, 전용 단말기 등)에서 동시 접속하여 서비스를 이용하는 경우"
   *  → 계정 전체로 cfg.maxDev(기본 4 · 1~4)대까지만 = 휴대폰(cfg.phones · 기본 JS-phone·MJ-phone 2대 — 사람 손 · 우리 코드는 휴대폰에서 로그인하지 않음 · 늘 쓰는 것으로 미리 셈)
   *     + 🔒 상시 PC 자리(cfg.always · 기본 JS-MAIN·MJ-MAIN·HOME — cfg.alwaysPair 짝 JS-MAIN·HOME은 정범님이 끄고 켜며 바꿔 쓰는 한 자리 = 둘이 함께 살아 있어도 한 자리로 셈) + 그 밖 기기(클라우드 등)
   *  🔒 상시 기기(정범님 10/27 15:12 절대 원칙 — '무슨 일이 있어도 JS-MAIN·MJ-MAIN은 자동 수집이든 엔진이든 Claude든 로그인을 방해하는 일이 절대로 있어서는 안 됨'):
   *     자리를 묻지 않고 늘 받음(꽉 차도) · 넘기지(양보) 않음 · 기다림 줄에 서지 않음 · 계정 쉼(holdUntil)·데이터센터 기다림·아이디 오류 6시간 쉼을 받지 않음
   *     → 그 PC에 로그인이 필요하면 언제나 바로(사람처럼: 필요할 때만 · 실패하면 1~10분 무작위 뒤 될 때까지) · 넘치면 늘 '그 밖' 기기가 넘김
   *  그 밖 기기의 자리 = maxDev − 휴대폰 − 지금 살아 있는 상시 PC 자리 − 이미 자리를 가진 그 밖 기기 (기본: 4 − 2 − 2 = 0 → 상시 PC 둘이 로그인 일을 하는 동안 클라우드는 받침으로만 · 쿠키 내려놓고 기다림)
   *  자리 = dev[기기]: in 참 · 신호(at)가 cfg.liveMin(기본 30)분 안 · 양보(yield) 아님. 신호는 그 기기가 로그인이 필요한 일(샵매니저·내 계정 등)을 하는 동안만 cfg.beatSec(10~15분 무작위)마다
   *   → 30분 동안 로그인 일을 하지 않은 기기는 신호가 끊겨 자리가 저절로 풀림(로그아웃 단추는 누르지 않음 — 세션은 그대로 두고 만료되면 다시 로그인하지 않음)
   *  그 밖 기기가 새로 로그인하거나 쉬다가 다시 로그인 일을 하려면 먼저 자리를 받음(seatAsk · 트랜잭션) — 없으면 로그인하지 않고 '자리 기다림'(retrySec 1~10분 무작위 뒤 다시 봄)
   *  우선순위 PRI(그 밖 기기끼리): 사람이 그 기기에서 웹앱·알라딘을 누름 3 > 출고·자동 발송 판단(주문확인요청 읽기) 2 > 그 밖 PC 1 > 클라우드 0(받침)
   *   · 빈자리는 기다리는 기기 중 우선순위가 높은(같으면 먼저 기다린) 기기 몫 · 자리를 가진 기기가 세션 만료로 다시 로그인할 때 더 높은 기기가 기다리면 다시 로그인하지 않고 넘김
   *   · 꽉 찼는데 PC가 기다리면 클라우드(받침)는 일하는 중이라도 로그인 일을 멈추고 자리를 넘김(seatYield) · 어떤 까닭으로든 maxDev대를 넘으면(상시 PC가 켜짐 등) 그 밖 기기 중 우선순위가 가장 낮은 기기(같으면 가장 오래 일 안 한 기기)가 넘김 — 상시 기기는 넘기지 않음 */
  const PRI = { human: 3, ship: 2, pc: 1, cloud: 0 };
  const UP = (x) => String(x == null ? '' : x).trim().toUpperCase();
  /* 상시 기기인가 — cfg(cfgOf 결과)·기기 이름 · 'cloud'는 언제나 아님 */
  const isAlways = (c, who) => UP(who) !== 'CLOUD' && !!who && (c.always || []).some((x) => UP(x) === UP(who));
  /* 상시 기기의 자리 이름 — 짝(JS-MAIN·HOME)은 한 자리 */
  const slotOf = (c, who) => { const p = (c.alwaysPair || []).find((q) => q.some((x) => UP(x) === UP(who))); return p ? p.map(UP).join('+') : UP(who); };
  const isLive = (v, now, c) => !!(v && v.in === true && !v.yield && now - (+v.at || 0) < c.liveMin * 60e3);
  const waitMs = (c) => c.retrySec[1] * 1500 + 60e3; /* 기다림 표시가 살아 있는 시간 = 다시 묻는 가장 긴 간격의 1.5배 + 1분(그 뒤엔 더 기다리지 않는 기기로 봄) */
  const priOf = (v, who) => (v && Number.isFinite(+v.pri) && v.pri !== null ? +v.pri : who === 'cloud' ? PRI.cloud : PRI.pc);
  /* 자리 보기 → { max, live(모두 · al = 상시), wait(그 밖 기기만), phones(휴대폰 대수), slots(살아 있는 상시 PC 자리 이름), used(계정 전체로 센 대수), room(그 밖 기기가 쓸 수 있는 자리 — 이미 가진 그 밖 기기 포함 전), cfg } */
  /* (정범님 11/05) 🪪 기기 표지: 수집기는 설치마다 한 번 만든 무작위 표지를 dev[이름].ids[표지] = 신호 시각으로 함께 적음 → 이름이 같은 PC 2대도 표지가 달라 따로 셈
   *  idsLive = 자리 신호(cfg.liveMin분) 안에 신호를 적은 표지 수 · 표지가 없던 예전 판·클라우드는 1대 */
  const idsLive = (v, now, c) => Math.max(1, Object.values((v && v.ids) || {}).filter((t) => now - (+t || 0) < c.liveMin * 60e3).length);
  function seatView(doc, now) { const c = cfgOf(doc); const D = (doc && doc.dev) || {}; const Wt = (doc && doc.wait) || {};
    const live = Object.entries(D).filter(([, v]) => isLive(v, now, c)).map(([w, v]) => ({ who: w, pri: priOf(v, w), at: +v.at || 0, use: +v.use || +v.at || 0, al: isAlways(c, w), n: idsLive(v, now, c) })).sort((a, b) => b.pri - a.pri || b.use - a.use);
    const wait = Object.entries(Wt).filter(([w, v]) => v && now - (+v.at || 0) < waitMs(c) && !isLive(D[w], now, c) && !isAlways(c, w)).map(([w, v]) => ({ who: w, pri: priOf(v, w), since: +v.since || +v.at || 0, at: +v.at || 0 })).sort((a, b) => b.pri - a.pri || a.since - b.since);
    const slots = [...new Set(live.filter((x) => x.al).map((x) => slotOf(c, x.who)))].sort(); const phones = c.phones.length; const others = live.filter((x) => !x.al).reduce((a, x) => a + x.n, 0);
    const dup = live.filter((x) => x.n > 1).map((x) => ({ who: x.who, n: x.n })); const dupX = live.filter((x) => x.al).reduce((a, x) => a + x.n - 1, 0); /* 이름이 같은 PC가 더 있으면 그만큼 더 셈 */
    return { max: c.maxDev, live, wait, phones, slots, dup, dupX, used: phones + slots.length + dupX + others, room: Math.max(0, c.maxDev - phones - slots.length - dupX), cfg: c }; }
  /* 자리 받기 → { ok:true, patch } | { ok:false, kind:'seat', until, why, patch(기다림 적기) } · o.pri = 이 기기 우선순위(없으면 PC 1 · o.dc면 클라우드 0) · 🔒 상시 기기는 늘 ok(always) */
  function seatAsk(doc, who, now, o, rnd) { o = o || {}; const V = seatView(doc, now); const pri = Number.isFinite(+o.pri) && o.pri !== null ? +o.pri : o.dc ? PRI.cloud : PRI.pc;
    if (!o.dc && isAlways(V.cfg, who)) { const sl = new Set(V.slots); sl.add(slotOf(V.cfg, who)); const n = V.phones + sl.size + V.dupX + V.live.filter((x) => !x.al).length;
      return { ok: true, always: true, n, max: V.max, patch: { dev: { [who]: { in: true, at: now, how: '상시', pri, use: now, yield: false } }, wait: { [who]: null } } }; }
    const others = V.live.filter((x) => !x.al && x.who !== who); const W0 = ((doc && doc.wait) || {})[who] || null; const since = W0 && now - (+W0.at || 0) < waitMs(V.cfg) ? +W0.since || +W0.at || now : now;
    const mine = V.live.some((x) => x.who === who); /* 이미 자리를 가진 기기(세션 만료로 다시 로그인 등)는 더 높은 기기에게만 넘김 · 새로 묻는 기기는 같은 우선순위면 먼저 기다린 기기 다음 */
    const ahead = V.wait.filter((x) => x.who !== who && (x.pri > pri || (!mine && x.pri === pri && x.since < since))); const free = V.room - others.length; const base = V.phones + V.slots.length;
    if (free - ahead.length >= 1) return { ok: true, n: base + others.length + 1, max: V.max, patch: { dev: { [who]: { in: true, at: now, how: '자리', pri, use: now, yield: false } }, wait: { [who]: null } } };
    const until = now + between(V.cfg.retrySec, rnd);
    const held = [V.phones ? `휴대폰 ${V.phones}대` : '', V.slots.length ? `🔒 상시 PC ${V.slots.join('·')}` : '', ...others.map((x) => x.who)].filter(Boolean).join(' · ');
    const why = free <= 0 ? `알라딘 판매자 로그인 ${base + others.length}/${V.max}대(${held}) — 자리 기다림(약관 제19조: 같은 아이디 5대 이상 동시 접속 금지 · 상시 PC·휴대폰이 먼저)` : `빈자리 ${free}개는 먼저 기다리는 우선순위 높은 기기(${ahead.slice(0, free).map((x) => x.who).join('·')}) 몫 — 자리 기다림`;
    return { ok: false, kind: 'seat', until, why, n: base + others.length, max: V.max, ahead: ahead.map((x) => x.who), patch: { dev: { [who]: { in: false, at: now, how: '자리 기다림', pri, yield: false } }, wait: { [who]: { at: now, since, pri } } } }; }
  /* 자리를 넘길 기기 하나(없으면 null) — 상시 기기는 절대 아님 · 계정 전체 대수가 maxDev를 넘으면 그 밖 기기 중 가장 낮은 기기(같으면 가장 오래 일 안 한 기기) · 꽉 찼고 클라우드보다 높은 기기가 기다리면 클라우드 */
  function seatYield(doc, now) { const V = seatView(doc, now); const over = V.used - V.max; const top = V.wait[0]; const ot = V.live.filter((x) => !x.al);
    if (over > 0) { const c = ot.slice().sort((a, b) => a.pri - b.pri || a.use - b.use); return c.length ? c[0].who : null; }
    if (over === 0 && top) { const c = ot.filter((x) => x.who === 'cloud' && x.pri < top.pri); return c.length ? 'cloud' : null; }
    return null; }
  /* 로그인 일을 하는 기기가 신호(10~15분마다) 때 부름 → 자리가 있으면 신호 적기 · 넘길 차례면 양보 · 자리가 없으면(신호가 끊겼던 기기) 새로 받기 · 🔒 상시 기기는 늘 신호만(넘기지 않음) */
  function seatKeep(doc, who, now, o, rnd) { o = o || {}; const c = cfgOf(doc); const me = ((doc && doc.dev) || {})[who];
    if (!o.dc && isAlways(c, who)) { const a = seatAsk(doc, who, now, o, rnd); return { ...a, keep: true, patch: { dev: { [who]: { in: true, at: now, how: '상시', pri: a.patch.dev[who].pri, use: +o.use || now, yield: false } }, wait: { [who]: null } } }; }
    if (!isLive(me, now, c)) return seatAsk(doc, who, now, o, rnd);
    const pri = Number.isFinite(+o.pri) && o.pri !== null ? +o.pri : priOf(me, who);
    if (seatYield(doc, now) === who) { const V = seatView(doc, now); const until = now + between(c.retrySec, rnd);
      return { ok: false, kind: 'yield', until, n: V.used - 1, max: V.max, why: V.used > V.max ? `알라딘 판매자 로그인이 계정 전체 ${V.used}대(휴대폰 ${V.phones} · 🔒 상시 PC ${V.slots.length}자리 포함)로 ${V.max}대를 넘음 — 우선순위가 가장 낮은 이 기기(${who})가 로그인 일을 멈추고 자리를 넘김(로그아웃 단추는 누르지 않음)` : `${V.wait[0].who}(우선순위 더 높음)가 자리를 기다림 — 받침인 ${who}가 로그인 일을 멈추고 자리를 넘김(로그아웃 단추는 누르지 않음)`,
        patch: { dev: { [who]: { in: false, at: now, how: '양보', pri, yield: true } } } }; }
    return { ok: true, keep: true, n: seatView(doc, now).used, max: c.maxDev, patch: { dev: { [who]: { in: true, at: now, pri, use: +o.use || now, yield: false } } } }; }
  /* 지금 이 기기(who)가 새 로그인을 해도 되나 → { ok:true, cfg } | { ok:false, kind:'hold'|'retry'|'dcwait', until, why }
   *  o.force = 사람이 직접 누른 시험(다시 시도 때만 건너뜀 — 🪑 자리는 건너뛰지 않음) · o.dc = 데이터센터(클라우드) — ④ 규칙 · o.pri = 🪑 자리 우선순위 · o.seat === false = 자리를 보지 않음(시험용)
   *  ⑤ 🪑 자리: 위가 모두 통과하면 판매자 로그인 자리를 받음(seatAsk) — 받으면 { ok:true, cfg, patch(자리 적기) } · 꽉 찼으면 { ok:false, kind:'seat', until, why, patch(기다림 적기) }
   *  🔒 상시 기기(cfg.always · 클라우드 아님): 계정 쉼·데이터센터 기다림·자리를 보지 않고 늘 바로 — 지킬 것은 '사람처럼' 실패 뒤 1~10분 무작위 간격 하나뿐
   *     (그 간격도 그 기기의 마지막 시도 + retrySec 최대(10분)를 넘지 않음 — 예전 판이 적은 아이디 오류 6시간 쉼 등은 무시) */
  /* ⑥ 🌙 데이터센터 주소 막힘 뒤 조용히 기다림 (정범님 10/27 23:38 '너가 정해 · 통계 근거로' · 클라우드 0.35.50)
   *  까닭: 10/26 22:40~10/27 21:49 클라우드 고정 주소에서 2시간마다 10번 모두 42FB · 같은 때 PC(집·사무실 주소)는 모두 로그인 성공 = 계정이 아니라 데이터센터 주소가 막힘
   *  근거: OWASP 자격 증명 대입 방어 지침 — 주소 막음은 '잠시'이고 '나쁜 신호가 줄거나 멈추면' 풀도록 권함 · 호스팅(데이터센터) 주소는 따로 분류해 더 엄하게 봄
   *        Fortinet 인증 평판 — 처음 10분 막고, 되풀이하면 막는 시간을 늘림(되풀이할수록 길어짐) → 막힌 동안 다시 두드리면 풀리는 시계가 다시 감김
   *  그래서: 막힌 뒤로는 시도하지 않음(로그인이 필요 없는 일만) → 72시간 조용히 둔 뒤 한 번 · 또 막히면 7일 뒤 한 번 · 또 막히면 멈춤(사람이 직접 '시험'하거나 주소를 바꿀 때까지)
   *        시도는 사람이 일하는 때(한국 시간 10~12시 사이 무작위)에만 · 같은 계정 PC가 그 전 6시간 안에 로그인 성공한 때만(계정 자체는 멀쩡할 때) · PC 로그인은 이 규칙을 전혀 받지 않음 */
  const DC_Q_FROM = Date.parse('2026-10-27T15:00:00Z'); const DC_Q_WAIT = [72 * 3600e3, 7 * 86400e3];
  function dcQuiet(doc, who, now, rnd) { const B = Object.entries((doc && doc.blk) || {}).filter(([k, v]) => k.split('·')[0] === who && v && !v.okAt).map(([, v]) => v)[0]; if (!B) return null;
    const T = (doc && doc.tries) || []; const mine = T.filter((t) => t && t.who === who && t.blocked && +t.at >= DC_Q_FROM); const k = mine.length;
    if (k >= DC_Q_WAIT.length) return { ok: false, kind: 'dcquiet', until: 0, stop: true, why: `${who} 주소가 72시간·7일 쉰 뒤에도 막힘 — 시도 멈춤(로그인이 필요 없는 일만 · 사람이 '시험'을 누르거나 주소를 바꾸면 다시)` };
    const base = Math.max(DC_Q_FROM, k ? +mine[k - 1].at : +B.last || DC_Q_FROM); let at = base + DC_Q_WAIT[k];
    const K = 9 * 3600e3; const d = new Date(at + K); let s = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 10) - K; if (at > s + 2 * 3600e3) s += 86400e3; if (at < s) at = s + Math.round((Number.isFinite(rnd) ? rnd : Math.random()) * 2 * 3600e3);
    if (now < at) return { ok: false, kind: 'dcquiet', until: at, why: `${who} 주소 막힘(42FB) — 조용히 기다림 ${k + 1}/2 · 다음 한 번 ${kstHm(at)}(사람이 일하는 10~12시)` };
    const pcOk = T.some((t) => t && t.ok && t.who !== who && now - (+t.at || 0) < 6 * 3600e3) || Object.entries((doc && doc.dev) || {}).some(([w, v]) => w !== who && v && v.in && now - (+v.at || 0) < 6 * 3600e3);
    if (!pcOk) return { ok: false, kind: 'dcquiet', until: now + 3600e3, why: `${who} 시험 차례지만 최근 6시간 안 PC 로그인 성공이 없음 — 계정이 멀쩡할 때만 시험` };
    return null; }
  function decide(doc, who, now, o) { o = o || {}; const c = cfgOf(doc);
    if (!o.dc && isAlways(c, who)) { const nx0 = +((doc && doc.next) || {})[who] || 0; const T = (doc && doc.tries) || []; let la = 0; for (let i = T.length - 1; i >= 0; i--) if (T[i] && T[i].who === who) { la = +T[i].at || 0; break; }
      const nx = Math.min(nx0, la ? la + c.retrySec[1] * 1000 : 0); if (!o.force && nx > now) return { ok: false, kind: 'retry', always: true, until: nx, why: `${who}(🔒 상시) 지난 시도가 안 됨 — 다음 시도 ${kstHm(nx)}(1~10분 무작위 · 사람처럼)` };
      if (o.seat !== false) { const s = seatAsk(doc, who, now, o, o.rnd); return { ok: true, always: true, cfg: c, patch: s.patch, seat: { n: s.n, max: s.max } }; }
      return { ok: true, always: true, cfg: c }; }
    if (doc && +doc.holdUntil > now) return { ok: false, kind: 'hold', until: +doc.holdUntil, why: doc.holdWhy || '정범님이 켠 계정 새 로그인 쉼' };
    const nx = +((doc && doc.next) || {})[who] || 0; if (!o.force && nx > now) return { ok: false, kind: 'retry', until: nx, why: `${who} 지난 시도가 안 됨 — 다음 시도 ${kstHm(nx)}(1~10분 무작위)` };
    if (o.dc && !o.force) { const q = dcQuiet(doc, who, now, o.rnd); if (q) return q; }
    if (o.dc && c.dcWaitMin > 0) { const T = (doc && doc.tries) || []; let bi = -1; for (let i = T.length - 1; i >= 0; i--) if (T[i] && T[i].blocked && now - (+T[i].at || 0) < c.dcWaitMin * 60e3) { bi = i; break; }
      if (bi >= 0 && !T.slice(bi + 1).some((t) => t && t.ok && t.who !== who)) return { ok: false, kind: 'dcwait', until: +T[bi].at + c.dcWaitMin * 60e3, why: `${kstHm(+T[bi].at)} ${T[bi].who}에 42FB 경고 뒤 아직 어느 PC도 새 로그인에 성공하지 않음 — 데이터센터(클라우드)는 PC가 먼저 성공할 때까지 기다림` }; }
    if (o.seat !== false) { const s = seatAsk(doc, who, now, o, o.rnd); if (!s.ok) return s; return { ok: true, cfg: c, patch: s.patch, seat: { n: s.n, max: s.max } }; }
    return { ok: true, cfg: c }; }
  /* 로그인 한 번 결과 → 계정 문서 고침(patch)과 하루 요약 고침(day) — r = { ok, how, why, blocked, net, credBad } · rnd = 0~1 무작위(다음 시도 간격) */
  function record(doc, who, now, r, rnd) { const c = cfgOf(doc); const net = r.net || ((doc && doc.net) || {})[who] || null; const code = r.ok ? null : codeOf(r.why);
    const t = { at: now, who, net, ok: !!r.ok, how: r.how || null, why: r.why ? String(r.why).slice(0, 200) : null, code }; if (r.blocked) t.blocked = true; if (r.credBad) t.credBad = true; if (r.id) t.id = String(r.id).slice(0, 40); /* 🪪 기기 표지(같은 이름 PC를 가름) */
    const tries = [...((doc && doc.tries) || []), t].slice(-c.keep); const nextAt = r.ok ? 0 : r.credBad && c.credBadMin > 0 && !isAlways(c, who) ? now + c.credBadMin * 60e3 : now + between(c.retrySec, rnd); /* 🔒 상시 기기는 아이디 오류여도 6시간 쉼 없이 1~10분 무작위 */
    const p = { tries, lastTry: t, next: { [who]: nextAt } };
    if (!r.ok) p.dev = { [who]: { in: false, at: now, how: r.how || 'fail' } }; /* 🪑 실패하면 받아 둔 자리를 바로 풀어 줌(다른 기기가 기다리지 않게) */
    if (doc && doc.lock) p.lock = null; /* 예전 판(차례 표)이 남긴 것 정리 */
    const bk = `${who}·${net || '?'}`; const B = ((doc && doc.blk) || {})[bk]; let closed = null;
    if (r.blocked) p.blk = { [bk]: B && !B.okAt ? { ...B, last: now, n: (+B.n || 0) + 1 } : { first: now, last: now, n: 1, okAt: null } };
    else if (r.ok) { const open = Object.entries((doc && doc.blk) || {}).filter(([k, v]) => k.split('·')[0] === who && v && !v.okAt); if (open.length) { p.blk = {}; for (const [k, v] of open) { p.blk[k] = { ...v, okAt: now }; closed = closed || []; closed.push({ who, net: k.split('·').slice(1).join('·'), first: +v.first, okAt: now, n: +v.n || 0, min: Math.round((now - +v.first) / 60e3) }); } } }
    const res = r.ok ? 'ok' : r.blocked ? 'blocked' : 'fail';
    return { patch: p, nextAt, day: { id: kstDay(now), key: [who, net || '?', r.how || '?', res, code || '-'].join('·'), closed } }; }
  /* 로그인 판단을 해도 되는 화면인가 — 사람이 아는 방식만: ⓐ 샵매니저(/scm/)를 열었는데 로그인 화면으로 넘어감·로그인 칸이 뜸 ⓑ 로그인이 필요한 곳(내 계정·주문·팔기 장바구니)이 로그인 주소로 넘어감
   *  공개 화면(상품·중고 목록·숍 목록 — /scm/ 밖)은 로그인 판단에 쓰지 않음 → 'gate'(그 화면만 로그인 필요 — 19금 등) 또는 false */
  const LOGIN_URL = /\/login\/|wlogin|wC2CUser_Login/i;
  const AUTH_URL = /^(?:https?:\/\/[^\/]+)?\/(?:scm|account|order|mypage)\/|wbasket|wc2b_sales/i;
  const SCM_URL = /^(?:https?:\/\/[^\/]+)?\/scm\//i;
  const EDIT_URL = /^(?:https?:\/\/[^\/]+)?\/scm\/wrecord\.aspx/i;
  function judge(url, finalUrl, hasPw, hasLogout, title, o) { o = o || {}; url = String(url || ''); finalUrl = String(finalUrl || url);
    if (LOGIN_URL.test(finalUrl) && !LOGIN_URL.test(url)) return AUTH_URL.test(url) ? 'suspect' : 'gate';
    if (!SCM_URL.test(url)) return false;
    if (o.editForm && !hasPw && EDIT_URL.test(url) && EDIT_URL.test(finalUrl)) return false; /* (정범님 11/02 승인 · 10/31 정밀 점검 ④-2) 상품 수정 화면(/scm/wrecord.aspx)은 로그아웃 고리가 원래 없음 — 수정 양식 입력 칸(frmRecord·UpdateItemId·bookDesc)이 그대로 보이면 로그인된 것(하루 386번 '잘못 봄' 확인 요청·다시 읽기 없앰) · 로그인 화면으로 넘어감은 위 첫 줄이 그대로 잡음 */
    if (hasPw && !hasLogout && !(o.titleOk || /샵매니저/).test(title || '')) return 'suspect';
    if (o.scmNeedsLogout && !hasLogout) return 'suspect';
    return false; }
  /* (정범님 11/05) 🏓 로그인 번갈아 넘어감(핑퐁) 알아채기 — cfg.ppWinMin분(기본 120) 안의 성공 로그인을 차례로 보며 주인(기기 이름 + 🪪 표지)이 바뀐 횟수를 셈
   *  바뀐 횟수가 cfg.ppN(기본 3)번을 넘으면 on — 알라딘이 앞 세션을 끊어 기기끼리 서로 밀어내는 것일 수 있음 · 보여 주기만(로그인을 막거나 늦추지 않음) · 근거: 없음, 설정으로 바꿈
   *  → { on, hops, n(성공 수), win(분), max(ppN), who:[주인 차례 — 최근 8], since } */
  function pingPong(doc, now) { const c = cfgOf(doc); const from = now - c.ppWinMin * 60e3; const T = ((doc && doc.tries) || []).filter((t) => t && t.ok && +t.at >= from && +t.at <= now).sort((a, b) => +a.at - +b.at);
    const key = (t) => String(t.who || '?') + (t.id ? '#' + String(t.id) : ''); let hops = 0; for (let i = 1; i < T.length; i++) if (key(T[i]) !== key(T[i - 1])) hops++;
    return { on: hops > c.ppN, hops, n: T.length, win: c.ppWinMin, max: c.ppN, who: T.slice(-8).map(key), since: T.length ? +T[0].at : null }; }
  const net2 = (ip) => { const m = String(ip || '').match(/^(\d{1,3})\.(\d{1,3})\./); return m ? `${m[1]}.${m[2]}` : null; };
  return { DEF, cfgOf, kstDay, kstHm, between, isBlock, codeOf, decide, dcQuiet, record, judge, net2, LOGIN_URL, AUTH_URL, SCM_URL, EDIT_URL, PRI, isLive, seatView, seatAsk, seatYield, seatKeep, isAlways, slotOf, idsLive, pingPong };
})();
/* ═════════════ (정범님 10/26) 🔑 알라딘 로그인 — 사람처럼 (계정 단위 · 모든 PC·클라우드가 같은 규칙 __rnLoginRule) ═════════════
 * 예전(~1.89.104): 고객·출고 리더가 공개 상품 화면(머리에 로그인 칸이 있고 제목이 '샵매니저'가 아님)을 '로그인 풀림'으로 잘못 보고, 실제로는 로그인돼 있는데
 *  네이버 로그인 흐름을 1분마다 되풀이(10/20~26 약 1,070번 · JS-MAIN 10/26 297번) → 10/26 21:3x 계정 새 로그인 막힘(42FB6013 · 사람 시크릿 창도 막힘)
 * 이제(사람이 하는 그대로):
 *  ① 로그아웃 판단은 샵매니저(/scm/)가 로그인 화면으로 넘어갔거나 로그인 칸이 뜬 때 · 로그인이 필요한 곳(내 계정·팔기 장바구니)이 로그인 주소로 넘어간 때만 '의심'
 *     공개 화면(상품·중고 목록·숍 목록)은 판단에 안 씀 — 로그인 화면으로 가면 '그 화면만 로그인 필요'로 그 장만 건너뜀(19금 등)
 *  ② 의심이면 샵매니저 주문 화면을 한 번 열어 확인 → 로그인돼 있으면 '잘못 본 것'(로그인 안 함 · 그 요청만 다시) · 같은 화면 꼴을 3번 잘못 보면 그 화면은 로그인 판단에서 뺌(7일)
 *  ③ 진짜 풀렸을 때만(기기마다 각자 — 계정 전체 차례 없음 · 같은 PC의 여러 탭은 한 탭만): 5~20초 알아차리는 시간 → 이 PC가 평소 쓰는 방법(네이버·아이디)으로 한 번
 *     → 확인되면 하던 요청을 그 자리부터 이어 감 · 안 되면(42FB 경고도 같음) 1~10분 사이 무작위(매번 새로) 뒤 다시 — 이 PC에 로그인이 필요한 일이 남아 있는 동안만
 *     그동안 로그인이 필요한 맡긴 일은 이 PC가 받지 않음(로그인된 다른 PC·클라우드가 맡음) · 다른 기기가 다 해 주면 이 PC는 더 시도하지 않음
 *  사람에게 알리지 않음(네이버 로그인 자체가 풀린 때만 그 PC 화면에 창 — 사람 손 없이는 안 되는 일) — 관리도구 '🔑 알라딘 로그인'과 작업 기록·계정 문서 통계에만 남김 */
(function rnLoginGovInit() {
  if (window.__rnLoginGov) return;
  const RULE = globalThis.__rnLoginRule;
  const G = (k, d) => { try { return GM_getValue(k, d); } catch (e) { return d; } }; const S = (k, v) => { try { GM_setValue(k, v); } catch (e) {} };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const PUB = () => !!(globalThis.__rnPubHome || globalThis.__rnPubChrome);
  const who = () => { try { return (window.__rnPcName && window.__rnPcName.get()) || 'PC'; } catch (e) { return 'PC'; } };
  /* (정범님 11/05) 🪪 기기 표지 — 이 수집기 설치(이 크롬 Tampermonkey)마다 한 번 만드는 무작위 표지(GM 저장 · 이 PC의 모든 탭이 같이 씀 · 지우지 않음)
   *  자리 신호(dev[이름].ids)·로그인 기록(tries[].id)·PC 신호(pcBeat.pcs[이름].ids)에 함께 적어 → 이름이 같은 PC 2대를 가름(알라딘 동시 로그인 대수 · 웹앱 '⚠ 이름이 같은 PC 2대') */
  const devId = () => { let v = G('rnu-dev-id', null); if (!v || !/^d[0-9a-z]{6,24}$/.test(String(v))) { v = 'd' + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 10); S('rnu-dev-id', v); } return String(v); };
  window.__rnDevId = devId;
  const tagId = (r) => { try { const v = r && r.patch && r.patch.dev && r.patch.dev[who()]; if (v && typeof v === 'object') v.ids = { [devId()]: +v.at || Date.now() }; } catch (e) {} return r; }; /* 계정 문서에 적는 이 PC 자리 칸마다 표지를 함께 */
  const L = (lv, m) => { try { window.__rnLog && window.__rnLog('로그인', lv, m); } catch (e) {} };
  /* 계정 문서 — Firebase에 로그인돼 있으면 Firestore(트랜잭션), 아니면 이 PC 저장소(같은 규칙 · 이 PC 것만 셈) */
  const fs = () => { try { return window.firebase && firebase.apps.length && firebase.auth().currentUser ? firebase.firestore() : null; } catch (e) { return null; } };
  const REF = (db) => db.collection('app_settings').doc('aladin_login');
  const deep = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b || {})) o[k] = v && typeof v === 'object' && !Array.isArray(v) && o[k] && typeof o[k] === 'object' && !Array.isArray(o[k]) ? { ...o[k], ...v } : v; return o; };
  async function tx(fn) { const db = fs();
    if (!db) { const d = G('rnu-login-acct', {}) || {}; CFG = RULE.cfgOf(d); const r = tagId(fn(d) || {}); if (r.patch) S('rnu-login-acct', deep(d, r.patch)); return { ...r, local: true }; }
    let out = null; await db.runTransaction(async (t) => { out = null; const sn = await t.get(REF(db)); const d = sn.exists ? sn.data() || {} : {}; CFG = RULE.cfgOf(d); out = tagId(fn(d) || {}); if (out.patch) t.set(REF(db), out.patch, { merge: true }); }); return out; }
  /* 하루 요약(부지런한 통계) — app_settings/aladin_login/days/{KST 날짜} · 기기·망·방법·결과·경고 코드별 수 + 닫힌 막힘(42FB가 처음 뜬 때 → 그 기기가 다시 성공한 때) */
  function dayPut(day) { const db = fs(); if (!db || !day) return; try { const FV = firebase.firestore.FieldValue; REF(db).collection('days').doc(day.id).set({ c: { [day.key]: FV.increment(1) }, at: Date.now(), ...(day.closed ? { eps: FV.arrayUnion(...day.closed) } : {}) }, { merge: true }).catch(() => {}); } catch (e) {} }
  /* 이 PC의 로그인 상태(모든 탭 공유) — { in: 참/거짓, at, until(다시 해 볼 수 있는 때), why } */
  const ST = 'rnu-login-st'; const st = () => G(ST, {}) || {};
  /* 🪑 판매자 로그인 자리(정범님 10/27 · 약관 제19조 — 규칙 __rnLoginRule.seatAsk 위 설명): 이 PC가 로그인 일을 하는 동안만 10~15분마다 신호(dev[이 PC] · 트랜잭션 seatKeep)
   *  · 신호 = 샵매니저 화면을 로그인된 채로 읽을 때(suspect가 로그아웃 링크를 봄 → seen) · 사람이 이 PC 알라딘 화면을 누를 때 · 다시 로그인했을 때
   *  · 자리가 없거나 넘길 차례면 이 PC 상태를 '자리 기다림'(in 거짓 · seat)으로 → 로그인 일은 받지 않고(ready 거짓) 샵매니저를 읽으려던 일은 '로그인 쉼'으로 그 일만 건너뜀 → 할 일이 남아 있으면 1~10분 무작위 뒤 다시 자리를 물음
   *  · 로그아웃 단추는 누르지 않음(그것도 사람답지 않은 되풀이가 될 수 있음) — 세션은 그대로 두고 쓰지 않을 뿐 */
  const SEAT = 'rnu-login-seat', USE = 'rnu-login-use', HUM = 'rnu-login-human', SHIP = 'rnu-login-ship'; let CFG = RULE.cfgOf(null);
  const ago = (k) => Date.now() - (+G(k, 0) || 0);
  const myPri = () => (ago(HUM) < CFG.liveMin * 60e3 ? RULE.PRI.human : ago(SHIP) < CFG.liveMin * 60e3 ? RULE.PRI.ship : RULE.PRI.pc);
  /* 🔒 상시 기기(정범님 10/27 15:12 절대 원칙 · 규칙 cfg.always — 기본 JS-MAIN·MJ-MAIN·HOME): 이 PC는 자리 기다림·로그인 쉼·잘못 본 화면 7일 제외를 받지 않음
   *  → 쉼 끝 시각(until)은 그 시각을 적은 때 + 1~10분 간격의 최대(retrySec)를 넘지 않게 자름 · 예전 판이 남긴 '자리 기다림' 표시는 무시 */
  /* (11/10 정범님 'HOME을 번외 수집기용으로 — 그 PC 자리를 번외가 이어받음') 🏠 이어받기 — 번외 도우미(127.0.0.1:8797) ⚙ '이 PC 알라딘 로그인 자리를 번외가 이어받음'을 다리(rnC2al)가 10초마다 받아 rn-c2own에 적음
   *  켜져 있는 동안 이 PC 운영 수집기는: 자리를 놓고(dev[이 PC] in 거짓 · how '번외가 이어받음') 로그인 일·다시 로그인·자리 신호를 하지 않음(🔒 상시 PC여도) · 샵매니저를 읽으려던 일은 '로그인 쉼'으로 그 일만 건너뜀
   *  번외가 30분 넘게 안 보이면(도우미 꺼짐 등) 이 표시는 저절로 풀려 예전처럼 이 PC가 자리를 받음(일이 끊기지 않게) · 로거 크롬은 늘 아님 */
  const OWN = 'rn-c2own'; const ownOn = () => { if (PUB()) return false; const o = G(OWN, null); return !!(o && o.on && Date.now() - (+o.at || 0) < 30 * 60e3 && (!o.pc || String(o.pc).toUpperCase() === String(who()).toUpperCase())); };
  const amAlways = () => !PUB() && !ownOn() && RULE.isAlways(CFG, who());
  const untilOf = (s) => { const u = +(s && s.until) || 0; return amAlways() ? Math.min(u, (+(s && s.at) || 0) + CFG.retrySec[1] * 1000) : u; };
  const seatOf = (s) => (!!(s && s.seat) && !amAlways()) || ownOn(); /* 🏠 이어받기 중이면 늘 '자리 없음'과 같게(로그인 일 안 함) */
  const seatAt = () => +((G(SEAT, null) || {}).at) || 0; const seatFresh = () => Date.now() - seatAt() < CFG.liveMin * 60e3 && !seatOf(st());
  let devAt = 0, devIn = null, beatGap = 0; const inCb = [];
  function devPut(inn, how, extra) { const now = Date.now(); if (devIn === inn && now - devAt < beatGap && !extra) return; devIn = inn; devAt = now; beatGap = RULE.between(CFG.beatSec); const db = fs(); const v = { dev: { [who()]: { in: inn, at: now, how: how || null, pri: myPri(), use: +G(USE, 0) || now, yield: false, ids: { [devId()]: now }, ...(extra || {}) } } }; if (inn) S(SEAT, { at: now }); if (db) REF(db).set(v, { merge: true }).catch(() => {}); else S('rnu-login-acct', deep(G('rnu-login-acct', {}) || {}, v)); }
  /* 자리 지키기·받기(트랜잭션) → 참(자리 있음) | 거짓(자리 기다림·양보 — 이 PC 상태를 '자리 기다림'으로) */
  let holding = null;
  function hold(why) { if (holding) return holding; holding = hold0(why).finally(() => { holding = null; }); return holding; }
  /* 🏠 이어받기 — 운영 자리를 놓음(한 트랜잭션 · 기다림 줄에서도 뺌) · 이 PC 상태를 '자리 기다림(own)'으로 · 이미 놓았으면 계정 문서를 다시 쓰지 않음 */
  let ownDropAt = 0;
  async function ownDrop(why) { if (PUB()) return false; const me = who(); const now = Date.now(); const s0 = st(); const fresh = s0.seat === 'own' && now - ownDropAt < 10 * 60e3;
    if (fresh) return true; S(SEAT, null); devIn = false; devAt = now; S(ST, { in: false, at: now, until: now + 10 * 60e3, why: '🏠 이 PC 알라딘 자리는 번외 수집기가 이어받음 — 운영은 로그인 일을 하지 않음', seat: 'own' });
    const out = await tx((doc) => { const D0 = ((doc && doc.dev) || {})[me], W0 = ((doc && doc.wait) || {})[me]; if (D0 && D0.in === false && D0.how === '번외가 이어받음' && !W0) return {}; return { patch: { dev: { [me]: { in: false, at: now, how: '번외가 이어받음', pri: RULE.PRI.pc, yield: false } }, wait: { [me]: null } } }; }).catch(() => null);
    if (!out) return false; ownDropAt = now; L('info', `🏠 이 PC 알라딘 로그인 자리를 놓음 — 번외 수집기가 이어받음${why ? ' · ' + why : ''} (운영은 로그인 일·다시 로그인·샵매니저 작업 창 다시 열기를 하지 않음 · 번외가 30분 넘게 안 보이면 저절로 되찾음)`); return true; }
  /* 🏠 이어받기 끝(번외 ⚙에서 끔 · 번외가 30분 넘게 안 보임) — 이 PC 상태를 '모름'으로 돌리고 곧바로 자리를 다시 받음 */
  function ownEnd(why) { const s = st(); if (s.seat !== 'own' || ownOn()) return false; ownDropAt = 0; S(ST, { at: Date.now(), how: '이어받기 끝' }); L('info', `🏠 번외 이어받기 끝 — 이 PC가 다시 알라딘 로그인 자리를 받음${why ? ' · ' + why : ''}`); hold('이어받기 끝').catch(() => {}); inCb.forEach((f) => { try { f(); } catch (e) {} }); return true; }
  setInterval(() => { try { if (!PUB() && window.top === window && st().seat === 'own' && !ownOn()) ownEnd('번외 표시가 30분 넘게 안 바뀜'); } catch (e) {} }, 60e3);
  async function hold0(why) { const me = who(); if (PUB()) return false; if (ownOn()) { await ownDrop(why); return false; } const out = await tx((doc) => RULE.seatKeep(doc, me, Date.now(), { pri: myPri(), use: +G(USE, 0) || Date.now() }, Math.random())).catch(() => null);
    if (!out) return seatOf(st()) ? false : true; /* 계정 문서를 못 읽음 — 지금 상태 그대로(🔒 상시 PC는 늘 참) */
    if (out.ok) { devIn = true; devAt = Date.now(); beatGap = RULE.between(CFG.beatSec); S(SEAT, { at: Date.now() }); const s = st(); if (s.seat) { S(ST, { in: true, at: Date.now(), how: out.always ? '🔒 상시' : '자리 받음' }); L('info', `🪑 알라딘 판매자 로그인 자리를 받음(${out.n}/${out.max}대) — 로그인이 필요한 일을 다시 함`); inCb.forEach((f) => { try { f(); } catch (e) {} }); } return true; }
    devIn = false; devAt = Date.now(); S(SEAT, null); S(ST, { in: false, at: Date.now(), until: out.until, why: out.why, seat: out.kind });
    L('warn', `🪑 ${out.why} — 로그인이 필요한 일은 받지 않음(로그인된 다른 기기가 맡음) · 이 PC에 로그인 일이 남아 있으면 ${RULE.kstHm(out.until)}에 다시 자리를 물음${why ? ' · ' + why : ''}`); return false; }
  /* 로그인 일을 했다는 표시(1분에 한 번만 저장) — 신호 때가 되면 자리 지키기 */
  let useAt = 0;
  function seen() { if (PUB() || ownOn()) return; const now = Date.now(); if (now - useAt > 60e3) { useAt = now; S(USE, now); } const s = st(); if (s.in === false) return; /* 풀림·자리 기다림은 다시 로그인 흐름이 맡음 */
    if (now - seatAt() < (beatGap || CFG.beatSec[0] * 1000)) return; S(SEAT, { at: now }); /* 이 PC 여러 탭 중 한 번만 */ hold().catch(() => {}); }
  function markIn(how) { if (ownOn()) return; /* 🏠 이어받기 중 — 이 PC 자리를 다시 적지 않음 */ const s = st(); S(ST, { in: true, at: Date.now(), how: how || null }); if (seatFresh()) devPut(true, how); else hold(how).catch(() => {}); /* 자리 신호가 30분 넘게 없던 PC는 자리부터 */ if (s.in === false) { L('info', `🔑 알라딘 로그인 확인됨(${how || '확인'}) — 로그인이 필요한 일을 다시 받음`); inCb.forEach((f) => { try { f(); } catch (e) {} }); } }
  function markOut(until, why) { const s0 = st(); if (seatOf(s0) && +s0.until > Date.now()) return; S(ST, { in: false, at: Date.now(), until: until || 0, why: why || null }); S(SEAT, null); devPut(false, 'out'); }
  /* 로그인이 필요한 일을 지금 받아도 되나(맡긴 일 pcCan) — 로그인돼 있거나(모름 포함), 풀렸어도 다시 해 볼 때가 됐으면 참 */
  const ready = () => { if (PUB()) return false; const s = st(); if (seatOf(s)) return false; /* 🪑 자리 기다림 — 자리를 받을 때까지(다시 로그인 흐름 relogin이 물음) · 🔒 상시 PC는 자리 기다림이 없음 */ return s.in !== false || Date.now() >= untilOf(s); };
  /* 잘못 본 화면 기억 — 같은 화면 꼴(주소 길)을 잘못 보면 세고, 3번이면 그 화면은 로그인 판단에서 뺌(7일 · 이 PC) */
  const MR = 'rn-login-misread'; const recent = new Map();
  const pkey = (u) => { try { return new URL(String(u), 'https://www.aladin.co.kr').pathname.toLowerCase(); } catch (e) { return String(u || '').split('?')[0].toLowerCase(); } };
  function misreadSkip(url) { const t = recent.get(String(url)); if (t && Date.now() - t < 120e3) return true; if (amAlways()) return false; /* 🔒 상시 PC는 '잘못 본 화면 7일 제외'를 받지 않음(2분 안 같은 주소만 거름) */ const m = G(MR, {}) || {}; const e = m[pkey(url)]; return !!(e && e.n >= 3 && Date.now() - e.at < 7 * 864e5); }
  function misreadAdd(url, why) { recent.set(String(url), Date.now()); if (recent.size > 200) recent.delete(recent.keys().next().value); const m = G(MR, {}) || {}; const k = pkey(url); const e = m[k] && Date.now() - m[k].at < 7 * 864e5 ? m[k] : { n: 0 }; m[k] = { n: e.n + 1, at: Date.now(), why: String(why || '').slice(0, 80) }; S(MR, m);
    L('warn', `🔑 로그인 풀림으로 잘못 봄(${k} · ${m[k].n}번째) — 샵매니저는 로그인돼 있어 다시 로그인하지 않고 그 요청만 다시${m[k].n >= 3 ? (amAlways() ? ' · 상시 PC라 7일 제외 없음(2분 안 같은 주소만 거름 — 로그인 판단은 늦추지 않음)' : ' · 이 화면은 이제 로그인 판단에서 뺌(7일)') : ''}`); } /* (1.89.159 🔬 정밀 점검) 상시 PC(JS-MAIN·MJ-MAIN·HOME)는 misreadSkip이 7일 제외를 안 받는데 글은 '뺌(7일)'이라 적혀 점검이 헛짚었음 — 글만 사실대로(판단 규칙은 그대로) */
  /* ① 의심 판단 — 'suspect' | 'gate'(그 화면만 로그인 필요) | false */
  function suspect(url, finalUrl, doc, o) { if (!doc) return false; let hasPw = false, hasOut = false; try { hasPw = !!doc.querySelector('input[type="password"]'); hasOut = !!doc.querySelector('a[href*="wC2Cuser_logout"]'); } catch (e) {}
    let editForm = false; try { editForm = !!(RULE.EDIT_URL && RULE.EDIT_URL.test(String(url || '')) && doc.querySelector('form#frmRecord, input[name="UpdateItemId"], #bookDesc')); } catch (e) {} /* (정범님 11/02) 상품 수정 화면은 수정 입력 칸이 있으면 로그인된 것 */
    const j = RULE.judge(url, finalUrl, hasPw, hasOut, doc.title || '', { ...(o || {}), editForm }); if (j === 'suspect' && misreadSkip(url)) return false;
    if (!j && (RULE.SCM_URL.test(String(url || '')) || RULE.AUTH_URL.test(String(url || '')))) { if (seatOf(st()) && !PUB()) return 'suspect'; /* 🪑 자리 기다림 중 — 로그인 일은 '로그인 쉼'으로(그 일만 건너뜀 · 다시 로그인 흐름이 자리를 물음) */ if (hasOut || editForm) seen(); }
    return j; }
  /* 일반 확인(샵매니저 주문 화면 한 번) — 모듈이 자기 확인 함수를 주면 그것을 씀 */
  async function checkIn() { try { const AL = globalThis.ReadnowAladin; const r = await fetch('https://www.aladin.co.kr/scm/worders.aspx?searchType=1&limitDate=1', { credentials: 'include' }); const h = await r.text(); const d = new DOMParser().parseFromString(h, 'text/html'); return r.ok && !(AL ? AL.looksLoggedOut(r.url, d, { titleOk: /샵매니저/ }) : /\/login\/|wlogin/i.test(r.url)); } catch (e) { return false; } }
  /* ② 의심이면 한 번 더 확인 → 'misread'(로그인돼 있음 — 잘못 본 것) | 'out'(진짜 풀림) */
  async function verify(o) { if (!ready()) return 'out'; /* 이미 풀린 것을 알고 다음 시도를 기다리는 중 — 다시 묻지 않음 */ const ok = await (o.isLoggedIn || checkIn)(); if (ok) { misreadAdd(o.url || '', o.why || ''); markIn('확인'); return 'misread'; } L('warn', `🔑 샵매니저 확인: 로그인이 풀려 있음(${pkey(o.url || '')}에서 알아챔)`); lostMark(); devPut(false, 'out'); return 'out'; }
  /* (11/10 🟧 번외 알라딘 다리) 운영 세션이 '로그인됨 → 진짜 풀림'으로 바뀐 시각(rnu-login-lost) — 번외 다리(rnC2al)가 opLostAt으로 넘김 → 번외 로그인 뒤 15분 안이면 번외가 멈춤(핑퐁 막기) · 이미 풀린 채 다시 시도할 때는 적지 않음 */
  function lostMark() { try { if (PUB()) return; const s = st(); if (s.in !== false) S('rnu-login-lost', Date.now()); } catch (e) {} }
  const waitErr = (o, d) => { const msg = `🔑 알라딘 로그인 쉼 — ${d.why}${d.until ? ` · ${RULE.kstHm(d.until)}에 다시 해 봄` : ''} (이 일은 건너뜀 · 로그인이 필요한 맡긴 일은 로그인된 다른 PC·클라우드가 맡음)`; const e = o.mkErr ? o.mkErr(msg, d) : new Error(msg); e.loginWait = true; e.until = d.until || 0; e.kind = d.kind; e.why0 = d.why; return e; };
  let inFlight = null, provider = null; const needs = new Map();
  /* ③ 진짜 풀렸을 때 — 사람처럼 한 번 로그인 → 참(로그인됨 · 하던 일 이어 감) 또는 throw(쉼 · 그 일만 건너뜀)
   *  o = { isLoggedIn, doLogin()→참/거짓, how:'naver'|'cred', canLogin()→못 하는 까닭|null, stopped(), say(글), mkErr(글, d), force } */
  function relogin(o) { if (inFlight) return inFlight.then(() => true, (e) => { throw waitErr(o, { why: (e && e.why0) || '같은 탭의 다른 일이 방금 로그인하지 못함', until: (e && e.until) || +st().until || 0, kind: (e && e.kind) || 'local' }); }); inFlight = relogin0(o).finally(() => { inFlight = null; }); return inFlight; }
  async function relogin0(o) { const me = who(); const isIn = o.isLoggedIn || checkIn; const say = (m) => { try { o.say && o.say(m); } catch (e) {} };
    if (PUB()) throw waitErr(o, { why: '🛡 로거는 알라딘에 로그인하지 않음', kind: 'pub' });
    if (ownOn()) { await ownDrop('다시 로그인 대신'); throw waitErr(o, { why: '🏠 이 PC 알라딘 자리는 번외 수집기가 이어받음', until: Date.now() + 10 * 60e3, kind: 'seat' }); }
    { const s0 = st(); const u0 = untilOf(s0); if (!o.force && s0.in === false && Date.now() < u0) throw waitErr(o, { why: s0.why || '다음 시도를 기다림', until: u0, kind: seatOf(s0) ? 'seat' : 'retry' }); }
    /* 🪑 로그인 일을 다시 하기 전에 판매자 로그인 자리부터(자리 기다림이었거나 30분 넘게 자리 신호가 없던 PC) — 세션이 살아 있어도 자리 없이 쓰지 않음 */
    if (!amAlways() && !seatFresh() && !(await hold('다시 로그인 전'))) { /* 🔒 상시 PC는 자리를 묻지 않음(아래 decide가 신호만 적음) */ const s1 = st(); throw waitErr(o, { why: s1.why || '판매자 로그인 자리 기다림', until: +s1.until || 0, kind: 'seat' }); }
    if (await isIn()) { markIn('확인'); return true; }
    lostMark(); /* (11/10) 진짜 풀림 — 번외 다리에 알릴 시각 */
    const cant = o.canLogin ? o.canLogin() : null; if (cant) { markOut(Date.now() + 10 * 60e3, cant); throw waitErr(o, { why: cant, until: Date.now() + 10 * 60e3, kind: 'nocred' }); }
    /* 같은 PC의 다른 탭이 로그인하는 중이면 그 결과를 기다림(각 탭이 따로 로그인하지 않게) */
    for (let i = 0; i < 40; i++) { const b = G('rnu-login-busy', null); if (!b || Date.now() - b.at > 4 * 60e3 || b.tab === window.__rnTab) break; say('같은 PC의 다른 탭이 알라딘에 로그인하는 중 — 기다림'); await sleep(6000); if (await isIn()) { markIn('다른 탭'); return true; } if (o.stopped && o.stopped()) throw waitErr(o, { why: '멈춤', kind: 'stop' }); }
    /* 이 기기가 지금 해도 되나 — 기기마다 각자(계정 전체 차례 없음 · 정범님 10/26 23:53): 이 기기의 다음 시도 때 · 정범님이 켠 계정 쉼만 봄 */
    const d = await tx((doc) => RULE.decide(doc, me, Date.now(), { force: o.force, pri: myPri(), rnd: Math.random() })).catch((e) => ({ ok: true, why: '계정 상태 문서를 못 읽음: ' + (e.code || e.message) })); /* 문서를 못 읽어도 이 PC 저장소의 다음 시도 때(위 s0)는 지킴 */
    if (!d.ok && d.kind === 'seat') { S(SEAT, null); devIn = false; devAt = Date.now(); S(ST, { in: false, at: Date.now(), until: d.until, why: d.why, seat: 'seat' }); L('warn', `🪑 ${d.why} — 세션이 풀렸지만 다시 로그인하지 않음(자리를 넘김) · ${RULE.kstHm(d.until)}에 다시 물음`); throw waitErr(o, d); }
    if (!d.ok) { markOut(d.until, d.why); L('warn', `🔑 ${d.why}`); throw waitErr(o, d); }
    if (d.seat) { S(SEAT, { at: Date.now() }); devIn = true; devAt = Date.now(); beatGap = RULE.between(CFG.beatSec); /* 방금 decide가 자리 신호를 적음 — 곧 이어지는 markIn이 같은 신호를 또 쓰지 않게 */ }
    const C0 = d.cfg || RULE.cfgOf(null);
    /* 알아차리는 시간 — 사람이 '어, 풀렸네' 하고 로그인하러 가는 만큼(5~20초 무작위) */
    const w = RULE.between(C0.noticeSec); say(`알라딘 로그인이 풀림 — ${Math.round(w / 1000)}초 뒤 ${o.how === 'naver' ? '네이버로' : '아이디로'} 한 번 로그인`); L('info', `🔑 로그인이 풀린 것을 확인 — ${Math.round(w / 1000)}초 뒤 ${o.how === 'naver' ? '네이버(로그인 상태 유지)' : '아이디·비밀번호'}로 한 번 로그인`);
    await sleep(w); if (await isIn()) { markIn('저절로 돌아옴'); return true; }
    S('rnu-login-busy', { at: Date.now(), tab: window.__rnTab || null }); const t1 = Date.now(); let ok = false, why = null;
    try { ok = !!(await o.doLogin()); } catch (e) { why = String(e && e.message || e).slice(0, 160); } finally { S('rnu-login-busy', null); }
    if (!ok) ok = await isIn();
    const al = G('rn-login-alert', null); const alMsg = al && +al.at >= t1 - 5000 ? String(al.msg || '') : ''; const blocked = !ok && RULE.isBlock(alMsg);
    if (!ok && !why) why = alMsg ? `알라딘 경고: ${alMsg}` : '로그인 뒤에도 샵매니저가 열리지 않음'; else if (!ok && alMsg && !why.includes(alMsg)) why = `알라딘 경고: ${alMsg} · ${why}`;
    let R = null; await tx((doc) => { R = RULE.record(doc, me, Date.now(), { ok, how: o.how || null, why: ok ? null : why, blocked, id: devId() }, Math.random()); return { patch: R.patch }; }).catch(() => {}); if (R) dayPut(R.day);
    if (ok) { markIn(o.how === 'naver' ? '네이버 로그인' : '아이디 로그인'); L('info', `🔑 다시 로그인함(${o.how === 'naver' ? '네이버' : '아이디'}) — 하던 일을 그 자리부터 이어 감`); return true; }
    const until = (R && R.nextAt) || Date.now() + RULE.between(C0.retrySec);
    markOut(until, why); L(blocked ? 'err' : 'warn', `🔑 로그인 안 됨: ${why}${blocked ? ' (계정 새 로그인 막힘 42FB — 같은 규칙으로 다시)' : ''} · 이 PC에 로그인이 필요한 일이 남아 있으면 ${RULE.kstHm(until)}에 다시(1~10분 무작위)`);
    throw waitErr(o, { why: blocked ? '알라딘 경고 42FB(계정 새 로그인 막힘)' : why, until, kind: 'retry' }); }
  /* 로그인이 필요한 일이 남아 있는 동안 다시 시도 — 모듈이 '할 일 있음'(need)과 로그인 방법(provide)을 알려 줌 · 20초마다 보고 다음 시도 때가 됐고 할 일이 있으면 한 번 */
  const anyNeed = () => [...needs.values()].some((f) => { try { return !!f(); } catch (e) { return false; } });
  setInterval(() => { try { if (PUB() || ownOn() || window.top !== window || inFlight || !provider) return; const s = st(); if (s.in !== false || Date.now() < untilOf(s) || !anyNeed()) return; L('info', `🔑 이 PC에 로그인이 필요한 일이 남아 있어 다시 로그인해 봄${amAlways() ? '(🔒 상시 PC)' : ''}`); relogin(provider()).catch(() => {}); } catch (e) {} }, 20e3);
  /* 로그인 화면 경고 잡기 — 알라딘 로그인 화면(/login/…)에서: ⓐ 화면 글·화면 안 스크립트에 막힘 글이 있으면 ⓑ 그 뒤에 뜨는 경고창(alert) 글을 화면 쪽에 심은 고리로 받아 'rn-login-alert'에 남김
   *  ⚠ 화면을 읽어 들이는 도중에 바로 뜨는 경고창은 이 스크립트가 깨어나기 전이라 못 잡을 수 있음(그때는 '샵매니저가 안 열림'으로만 남음) — 클라우드는 경고창을 늘 잡음 */
  if (/(^|\.)aladin\.co\.kr$/i.test(location.hostname) && /login/i.test(location.pathname) && !PUB()) {
    const put = (msg, src) => { msg = String(msg || '').replace(/\s+/g, ' ').trim().slice(0, 200); if (!msg) return; const prev = G('rn-login-alert', null); if (prev && prev.msg === msg && Date.now() - prev.at < 60e3) return; S('rn-login-alert', { msg, at: Date.now(), src, url: location.origin + location.pathname }); };
    try { const h = document.documentElement.innerHTML.slice(0, 400000); const m = h.match(/[^'"<>\n]{0,40}(로그인\s*과정에\s*문제|에러\s*코드\s*[:：]?\s*42FB)[^'"<>\n]{0,80}/i); if (m) put(m[0], 'html'); } catch (e) {}
    try { const sc = document.createElement('script'); sc.textContent = "(function(){try{var a=window.alert;window.alert=function(m){try{document.documentElement.setAttribute('data-rn-alert',String(m).slice(0,300)+'⁣'+Date.now());}catch(e){}return a.apply(this,arguments);};}catch(e){}})();"; (document.head || document.documentElement).appendChild(sc); sc.remove(); } catch (e) {}
    try { new MutationObserver(() => put(String(document.documentElement.getAttribute('data-rn-alert') || '').split('⁣')[0], 'alert')).observe(document.documentElement, { attributes: true, attributeFilter: ['data-rn-alert'] }); } catch (e) {}
  }
  /* 사람이 직접 로그인하다 42FB를 받아도(수집기가 시도하는 중이 아닐 때) 통계에 한 번 — 다음 자동 시도는 같은 규칙(1~10분 무작위) */
  const onAlert = (v) => { if (!v || !RULE.isBlock(v.msg) || Date.now() - (+v.at || 0) > 5 * 60e3 || !fs()) return; const b = G('rnu-login-busy', null); if (b && Date.now() - b.at < 4 * 60e3) return; let R = null; tx((doc) => { if ((doc.tries || []).some((t) => t && t.who === who() && Math.abs((+t.at || 0) - +v.at) < 60e3)) return {}; R = RULE.record(doc, who(), +v.at, { ok: false, how: '사람', why: `알라딘 경고: ${v.msg}`, blocked: true, id: devId() }, Math.random()); return { patch: R.patch }; }).then(() => { if (R) dayPut(R.day); }).catch(() => {}); };
  try { if (typeof GM_addValueChangeListener === 'function' && !/login/i.test(location.pathname) && window.top === window) GM_addValueChangeListener('rn-login-alert', (k, o, n, remote) => { if (remote) onAlert(n); }); } catch (e) {}
  /* 풀린 동안 10분마다 한 번 가볍게 확인(이 PC 모든 탭 중 하나만) — 사람이 직접 로그인했거나 세션이 돌아오면 곧 '로그인됨'으로 */
  setInterval(() => { try { if (PUB() || window.top !== window || !/\/scm\//i.test(location.pathname)) return; const s = st(); if (s.in !== false || seatOf(s)) return; /* 🪑 자리 기다림 중엔 확인도 하지 않음(계정을 쓰지 않음) */ const c = G('rnu-login-chk', 0); if (Date.now() - c < 10 * 60e3) return; S('rnu-login-chk', Date.now()); checkIn().then((ok) => { if (ok) markIn('10분 확인'); }); } catch (e) {} }, 60e3);
  /* 🪑 사람이 이 PC 알라딘 화면을 누름 = 우선순위 '사람'(30분) · 샵매니저 화면이 로그인된 채로 열림 = 로그인 일을 함(신호) */
  const human = () => { if (ago(HUM) > 60e3) S(HUM, Date.now()); };
  if (/(^|\.)aladin\.co\.kr$/i.test(location.hostname) && !PUB() && window.top === window) {
    try { const on = (e) => { if (e && e.isTrusted) human(); }; addEventListener('pointerdown', on, true); addEventListener('keydown', on, true); } catch (e) {}
    try { if (RULE.SCM_URL.test(location.pathname) && document.querySelector && document.querySelector('a[href*="wC2Cuser_logout"]')) setTimeout(() => { try { seen(); } catch (e) {} }, 3000 + Math.random() * 7000); } catch (e) {}
  }
  window.__rnLoginGov = { RULE, suspect, verify, relogin, ready, markIn, markOut, state: st, misreadSkip, hold, seen, always: amAlways, own: ownOn, ownDrop, ownEnd, /* (11/10) 🏠 이어받기 */
    human, ship: () => { if (ago(SHIP) > 60e3) S(SHIP, Date.now()); }, pri: myPri,
    provide: (fn) => { provider = fn; }, need: (k, fn) => { if (fn) needs.set(k, fn); else needs.delete(k); }, onIn: (fn) => inCb.push(fn),
    /* 맡긴 일 종류가 알라딘 로그인이 필요한가 — 노선표 lane 'scm' + 내 계정·팔기 장바구니 */
    needs: (type, kind) => !!((kind && kind.lane === 'scm') || type === 'aladinBuy' || type === 'c2bAdd' || type === 'c2bDel') };
})();
/* (1.38.0) 일시정지 = 이 PC의 모든 수집기 탭에 한 번에 (예전: 누른 탭에서만 멈춤 → 다른 탭에서 돌던 작업은 계속 돌고, 버튼은 3초 뒤 다시 켜져 '안 먹는' 것처럼 보였음)
 *  상태는 GM 'rnu-paused'(참/거짓) 한 곳. 값이 바뀌면 모든 탭이 바로 알아채고(GM_addValueChangeListener, 없으면 3초마다 확인) 자기 작업을 지금 항목까지 저장하고 멈춤 */
(function rnPause() {
  window.__rnPaused = !!GM_getValue('rnu-paused', false);
  const stopHere = () => { try { window.__rnCrm && window.__rnCrm.pause(); } catch (e) {} try { window.__rnPrd && window.__rnPrd.pause(); } catch (e) {} };
  const changed = () => { try { window.__rnCtlDraw && window.__rnCtlDraw(); } catch (e) {} };
  window.__rnPauseInfo = () => GM_getValue('rnu-paused-info', null);
  window.__rnPauseAll = (why) => { window.__rnPaused = true; let keys = []; try { const P0 = window.__rnPrd; keys = P0 && P0.runningKeys ? [...P0.runningKeys()] : []; } catch (e) {} GM_setValue('rnu-paused-info', { at: Date.now(), why: why || '사람이 누름', keys }); /* (1.89.68) 멈출 때 이 PC가 하던 일 — '다시 시작'은 이것만 이어감 */ GM_setValue('rnu-paused', true); stopHere(); window.__rnLog && window.__rnLog('수집기', 'warn', `■ 일시정지 (${why || '사람이 누름'}) — 이 PC의 모든 수집기 탭(고객·상품·일괄)이 지금 항목까지 저장하고 멈춤. 사람이 다시 시작하기 전에는 자동으로 다시 시작하지 않음`); changed(); };
  window.__rnResumeOk = () => { if (window.__rnPaused) window.__rnLog && window.__rnLog('수집기', 'info', '▶ 사람이 다시 시작함 (일시정지 풀림)'); window.__rnPaused = false; GM_setValue('rnu-paused', false); changed(); };
  const onRemote = (v) => { v = !!v; if (v === window.__rnPaused) return; window.__rnPaused = v; if (v) { stopHere(); window.__rnLog && window.__rnLog('수집기', 'warn', '■ 다른 탭에서 일시정지를 눌렀습니다 — 이 탭의 작업도 지금 항목까지 저장하고 멈춤'); } else window.__rnLog && window.__rnLog('수집기', 'info', '▶ 다른 탭에서 다시 시작을 눌렀습니다 (일시정지 풀림)'); changed(); };
  try { if (typeof GM_addValueChangeListener === 'function') GM_addValueChangeListener('rnu-paused', (k, o, n, remote) => { if (remote) onRemote(n); }); else throw 0; } catch (e) { setInterval(() => onRemote(GM_getValue('rnu-paused', false)), 3000); }
})();
/* (정범님 11/05 · 보고서 2026-11-05 ④안) 🪟 수집 작업 창 — 같은 크롬·같은 로그인 안에 PC 도우미(인쇄 도우미의 readnow-work.js)가 '리드나우 작업 창'을 하나 열어 화면 밖·작업 표시줄 밖에 둠
 *  이 PC가 웹앱 🧭 관리도구 › 🪟 수집 작업 창에서 켜져 있으면(GM rn-work-cfg.on — 수집기가 crm_system/work_win을 읽어 맞춤 · 기본 꺼짐):
 *   · 작업 창의 탭(도우미가 주소 끝 #rnWork로 연 탭 — 이 탭의 sessionStorage rn-w에 기억 · 주소의 표시는 바로 지움)만 이 PC의 수집기(지도자)가 됨
 *   · 사람이 연 알라딘 탭은 수집을 맡지 않음(화면 기능만) — 지도자였으면 지금 일을 마친 뒤(쉬는 사이) 작업 창에 넘김
 *   · 작업 창을 닫거나 3분 넘게 신호가 없으면 예전처럼 사람 탭이 이어받음(지우지 않은 옛 길 = 언제든 되돌리기) · 꺼 두면 모든 탭이 예전과 똑같음
 *  작업 창 탭은 5초마다 GM rnu-work{tab,at}을 적고, 30초마다 PC 도우미(127.0.0.1:8898/work/beat)에 살아 있음·지금 하는 일·기록 끝을 알림(도우미의 '수집 상태' 창이 보여 줌 · 10분 무응답이면 도우미가 다시 엶)
 *  머리(@match·@grant·@connect)는 그대로 — 127.0.0.1은 이미 @connect에 있음 */
(function rnWork() {
  const TOP = window.top === window; const AL = /(^|\.)aladin\.co\.kr$/i.test(location.hostname); const CK = 'rn-work-cfg', BK = 'rnu-work'; let mark = false;
  try { if (TOP && AL && /\/scm\//i.test(location.pathname)) { if (/(^#|[#&])rnWork\b/.test(location.hash)) { sessionStorage.setItem('rn-w', '1'); try { history.replaceState(history.state, '', location.href.replace(/#.*$/, '')); } catch (e) {} } mark = sessionStorage.getItem('rn-w') === '1'; } } catch (e) {}
  const cfg = () => { try { const v = GM_getValue(CK, null); return v && typeof v === 'object' ? v : { on: false }; } catch (e) { return { on: false }; } };
  const on = () => !!cfg().on;
  const H = 'http://127.0.0.1:8898';
  const call = (p, body, ms) => new Promise((res) => { try { GM_xmlhttpRequest({ method: body === undefined ? 'GET' : 'POST', url: H + p, headers: { 'X-RN-Work': '1', 'Content-Type': 'application/json' }, data: body === undefined ? undefined : JSON.stringify(body || {}), anonymous: true, timeout: ms || 15000,
    onload: (r) => { let j = null; try { j = JSON.parse(r.responseText); } catch (e) {} res(j && typeof j === 'object' ? { ...j, _st: r.status } : { ok: false, _st: r.status, err: r.status === 404 ? '도우미에 작업 창 기능이 없음(옛 판)' : '도우미 응답 ' + r.status }); },
    onerror: () => res({ ok: false, nohelper: true, err: '이 PC 도우미(127.0.0.1:8898)에 닿지 못함' }), ontimeout: () => res({ ok: false, nohelper: true, err: '도우미 응답 시간 초과' }) }); } catch (e) { res({ ok: false, nohelper: true, err: e.message }); } });
  /* 다른 탭(같은 PC)의 작업 창이 살아 있나 — 3분(백그라운드 탭의 타이머가 1분까지 늦춰져도 넉넉히) · 근거: 없음, 설정으로 바꿈(rn-work-cfg.aliveMin) */
  const alive = (me) => { if (!on()) return null; try { const v = GM_getValue(BK, null); const lim = Math.max(1, Math.min(10, +cfg().aliveMin || 3)) * 60000; return v && v.tab && v.tab !== me && Date.now() - (+v.at || 0) < lim ? v : null; } catch (e) { return null; } };
  const TITLE = '🪟 리드나우 작업 창';
  const W = (window.__rnWork = { mark, on, cfg, call, alive, TITLE, isWork: () => mark && on(), show: (why) => call('/work/show', { why: String(why || '').slice(0, 200), pc: (window.__rnPcName && window.__rnPcName.get()) || '' }) });
  window.__rnWorkShow = (why) => { if (!W.isWork() && !alive(window.__rnTab)) return Promise.resolve(null); try { window.__rnLog && window.__rnLog('수집기', 'warn', `🪟 사람 손이 필요한 일 — 작업 창을 화면 앞으로 꺼냄 (${why || ''})`); } catch (e) {} return W.show(why); };
  /* (정범님 11/09 oom1) 🩺 죽은 탭 되살리기 — 이 PC의 수집기 탭(일하는 탭)이 1분마다 PC 도우미(127.0.0.1:8898 · readnow-work.js)에 '살아 있음'을 알림(/work/lead)
   *  탭이 'Out of Memory'·'DNS_PROBE_FINISHED_NXDOMAIN' 화면으로 죽으면 스크립트가 안 돌아 알림이 끊김 → 도우미가 크롬이 떠 있고 인터넷이 되면 새 탭으로 알라딘 주문조회를 엶(1시간 2번까지 · 크롬은 죽이지 않음)
   *  도우미가 없거나 옛 판이면(닿지 못함·404) 10분에 한 번만 다시 물음 · 작업 창 탭은 위 /work/beat가 같은 일을 함 */
  if (TOP && AL && !globalThis.__rnPubChrome) { let leadNext = 0; setInterval(() => { try { if (mark || Date.now() < leadNext || !window.__rnRole || window.__rnRole() !== 'lead') return; leadNext = Date.now() + 55000;
    call('/work/lead', { pc: (window.__rnPcName && window.__rnPcName.get()) || '', page: location.pathname.split('/').pop(), paused: !!window.__rnPaused || (() => { try { const o = GM_getValue('rn-c2own', null); return !!(o && o.on && Date.now() - (+o.at || 0) < 30 * 60e3); } catch (e) { return false; } })(), /* (11/10) 🏠 번외 이어받기 중이면 도우미가 죽은 탭 되살리기(샵매니저 주문조회를 새로 엶)를 하지 않게 '일시정지'로 알림 */ ship: window.__rnSgShip ? window.__rnSgShip() : null, ver: (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || '' }, 8000).then((r) => { if (!r || !r.ok) leadNext = Date.now() + 10 * 60e3; }).catch(() => {}); } catch (e) {} }, 15000); }
  if (!mark) return;
  /* 작업 창 탭: 창 제목에 표시(도우미가 이 글로 창을 찾음) · 5초 GM 신호 · 30초 도우미 신호 */
  const title = () => { try { if (W.isWork() && !String(document.title || '').startsWith(TITLE)) document.title = TITLE + ' · ' + String(document.title || '').replace(/^🪟 리드나우 작업 창 · /, ''); } catch (e) {} };
  const gmBeat = () => { if (!W.isWork()) return; try { GM_setValue(BK, { tab: window.__rnTab || null, at: Date.now(), role: window.__rnRole ? window.__rnRole() : null }); } catch (e) {} title(); hBeat().catch(() => {}); /* 도우미 신호는 25초에 한 번(켜자마자 곧) */ };
  let hbAt = 0; const hBeat = async () => { if (!W.isWork() || Date.now() - hbAt < 25000) return; hbAt = Date.now(); let now = null; try { now = window.__rnWorkNow ? window.__rnWorkNow() : null; } catch (e) {}
    const lines = (() => { try { return (window.__rnLogTail ? window.__rnLogTail(15) : []).map((e) => ({ t: e.t, l: e.l, m: e.m, x: String(e.x || '').slice(0, 300) })); } catch (e) { return []; } })();
    const r = await call('/work/beat', { pc: (window.__rnPcName && window.__rnPcName.get()) || '', tab: window.__rnTab || null, role: window.__rnRole ? window.__rnRole() : null, ver: (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || '', page: location.pathname.split('/').pop(), paused: !!window.__rnPaused, ship: window.__rnSgShip ? window.__rnSgShip() : null, now, lines }, 10000);
    W.last = { at: Date.now(), ok: !!(r && r.ok), err: r && !r.ok ? r.err : null }; };
  setInterval(gmBeat, 5000); setInterval(() => { hBeat().catch(() => {}); }, 30000); setTimeout(gmBeat, 300); setTimeout(() => { hBeat().catch(() => {}); }, 4000);
  addEventListener('pagehide', () => { try { const v = GM_getValue(BK, null); if (v && v.tab === window.__rnTab) GM_deleteValue(BK); } catch (e) {} });
})();
/* (1.56.0) 한 PC에 수집기 하나 — 같은 PC(같은 브라우저)에서 수집기 화면(주문조회·판매관리·상품 조회)을 여러 탭·창으로 열어도 '일하는 수집기'는 한 탭뿐
 *  · 먼저 열린 탭 = 이 PC의 수집기(lead): 매일 자동 수집·웹앱 요청·맡긴 일(등록·송장·시장 지표)·이어가기를 모두 맡음
 *  · 나중에 열린 탭 = 쉬는 탭(follow): 관제판·기록 창이 접힌 채로 뜨고, 어떤 작업도 저절로 시작하지 않음. 머리줄 아래 옅은 띠에 '이미 이 PC에서 수집기가 일하는 중'을 표시
 *    수집기 탭을 닫으면 쉬는 탭 중 하나가 저절로 이어받음(그때부터 자동 작업도 맡음)
 *  · 꼭 필요하면 쉬는 탭에서 [이 탭도 수집기로 켜기] → 단점을 알린 뒤 켬(force): 사람이 직접 누른 작업만 하고, 자동·웹앱 요청·맡긴 일은 계속 원래 탭이 맡음. 새로고침하면 다시 쉬는 탭
 *  고르는 방법: 브라우저의 Web Locks('rn-collector-lead' — 탭이 닫히거나 멈추면 브라우저가 저절로 풀어 줌). 없는 브라우저면 GM 값 심장박동(5초, 15초 조용하면 넘겨받음)
 *  안전한 새로고침(새 탭을 열고 옛 탭을 닫음)으로 열린 새 탭은 '이어받을 탭(heir)'으로 표시해, 다른 쉬는 탭이 아니라 그 탭이 수집기를 이어받음 */
(function rnRole() {
  const W = window.__rnWork || null; const IS_WORK = !!(W && W.mark); /* (정범님 11/05) 🪟 작업 창 탭 — 켜져 있으면 이 탭만 수집기가 되고 사람 탭은 넘김(위 rnWork) */
  const PANEL = (window.top === window && /\/scm\/(worders|worder_preparatory_complete|wrecord_edit)\.aspx/i.test(location.pathname)) || !!globalThis.__rnPubHome || IS_WORK;
  const ME = window.__rnTab || Math.random().toString(36).slice(2, 8); window.__rnTab = ME;
  const PAGE = location.pathname.split('/').pop(); const PG = () => (IS_WORK && W.on() ? 'rnWork' : PAGE);
  const LK = 'rn-collector-lead', GK = 'rnu-lead', HK = 'rnu-lead-heir';
  /* 사람 탭이 비켜야 하나 — 작업 창 모드가 켜져 있고 다른 탭(작업 창)이 살아 있음 · 작업 창 탭 자신은 비키지 않음 */
  const workOther = () => (!IS_WORK && W && W.alive ? W.alive(ME) : null);
  let role = PANEL ? 'wait' : 'other'; let release = null; let beatT = null; let readyRes; const subs = [];
  window.__rnRoleReady = new Promise((r) => (readyRes = r)); if (!PANEL) readyRes();
  const L = (lv, m) => { try { window.__rnLog && window.__rnLog('수집기', lv, m); } catch (e) {} };
  const fire = () => { readyRes(); subs.forEach((f) => { try { f(role); } catch (e) {} }); try { window.__rnCtlDraw && window.__rnCtlDraw(); } catch (e) {} };
  window.__rnPageName = (p) => (/^rnWork$/.test(p || '') ? '🪟 작업 창' : /worders/i.test(p || '') ? '주문조회' : /wrecord_edit/i.test(p || '') ? '상품 조회' : /preparatory/i.test(p || '') ? '판매관리' : p || '다른 화면');
  window.__rnRole = () => role;
  window.__rnRoleOn = (f) => subs.push(f);
  window.__rnLead = () => { const v = GM_getValue(GK, null); return v && Date.now() - (v.at || 0) < 20000 ? v : null; };
  /* 자동·원격 작업을 건너뛸 탭: 쉬는 탭·확인 중·떠나는 탭, 그리고 '켜 둔' 탭(사람이 누른 것만) */
  window.__rnRest = () => role === 'wait' || role === 'follow' || role === 'force' || role === 'leaving';
  /* (1.89.120 2시간 점검) 얼어붙은 수집기 탭 — 10/27 JS-MAIN: 수집기 탭(상품 조회 · 기록 창 열림 · 5분에 긴 작업 30초)이 08:58 뒤 아무 코드도 돌지 않는데(브라우저가 탭을 얼림·멈춤) Web Lock은 계속 쥐고 있어,
   *  그 뒤 연 수집기 탭 넷이 모두 '이미 일하는 중'으로 쉬었고 7시간 넘게 이 PC 신호(pcBeat)·자동 일이 멈췄음. 쉬는 탭이 수집기 탭의 심장박동(rnu-lead · 5초, 백그라운드에서도 1분 안)을 1분마다 보고,
   *  15분 넘게 그대로인 것을 이 탭이 쉬지 않고 깨어 있는 3분 동안 거듭 확인하면(PC 잠자기에서 막 깬 때는 건너뜀) Web Lock을 넘겨받음(steal). 얼었던 탭이 깨어나면 다른 탭의 새 심장박동을 보고 스스로 쉬는 탭으로 물러남 */
  const lostLead = () => { const v = GM_getValue(GK, null); return v && v.tab !== ME && v.since && Date.now() - (v.at || 0) < 90000 && v.since > (window.__rnLeadSince || 0) ? v : null; }; /* 나보다 나중에 수집기가 된 다른 탭이 지금 뛰고 있으면 = 내 Web Lock은 넘겨짐 */
  const beat = () => { if (role === 'lead') { try { const o = lostLead(); if (o) return stepDown(o); GM_setValue(GK, { tab: ME, page: PG(), at: Date.now(), since: window.__rnLeadSince || Date.now() }); if (Date.now() - seenAt > 30000) { seenAt = Date.now(); GM_setValue('rnu-lead-seen', { at: seenAt, page: PG(), paused: !!window.__rnPaused }); } } catch (e) {} } }; let seenAt = 0; /* (11/09 oom1) 🩺 'rnu-lead-seen' = 이 PC 수집기 탭이 마지막으로 살아 있던 때(30초마다 · 탭을 닫아도 지우지 않음) — 죽은 탭 되살리기(rnRevive)가 봄 */
  let stepDown = () => {};
  const heirOther = () => { const h = GM_getValue(HK, null); return h && h.tab !== ME && Date.now() - (h.at || 0) < 3 * 60000 ? h : null; };
  const setLead = (how) => { role = 'lead'; window.__rnLeadSince = Date.now(); const h = GM_getValue(HK, null); if (h && h.tab === ME) GM_deleteValue(HK); beat(); clearInterval(beatT); beatT = setInterval(beat, 5000);
    if (how === 'promote') L('ok', '이 탭이 이제 이 PC의 수집기입니다 (앞서 일하던 수집기 탭이 닫혀 이어받음) — 지금부터 자동 수집·웹앱 요청·맡긴 일도 이 탭이 맡습니다'); fire(); };
  const setFollow = () => { if (role === 'force') return fire(); role = 'follow'; const v = window.__rnLead();
    L('info', `이 PC에서는 이미 수집기가 일하는 중${v ? ` (${window.__rnPageName(v.page)} 탭)` : ''} — 이 탭은 쉬는 상태로 엽니다. 저절로 시작하는 작업은 없고, 그 탭을 닫으면 이 탭이 이어받습니다`); fire(); };
  window.__rnForce = (on) => { if (!PANEL || role === 'lead') return; if (on) { role = 'force'; L('warn', '⚠ 이 탭도 수집기로 켬 (사람이 누름) — 이 PC에 수집기 2개. 자동·웹앱 요청은 원래 탭이 계속 맡고 이 탭은 직접 누른 작업만'); }
    else { const busy = (window.__rnPrd && window.__rnPrd.busy && window.__rnPrd.busy()) || (window.__rnCrm && window.__rnCrm.busy && window.__rnCrm.busy()); if (busy) { alert('이 탭에서 작업이 진행 중입니다. 일시정지로 멈춘 뒤 다시 눌러 주세요'); return; } role = 'follow'; L('info', '이 탭을 다시 쉬는 상태로 돌림'); } fire(); };
  /* 쉬는 탭에서 사람이 작업 단추를 누르면: 켤지 묻고(단점 안내) 켜면 진행. 저절로 온 요청이면 막고 기록만 (10분에 한 번) */
  let lastNote = 0;
  window.__rnForceAsk = () => { const v = window.__rnLead();
    return confirm(`이 탭도 수집기로 켤까요?\n\n이 PC에서는 이미 ${v ? `'${window.__rnPageName(v.page)}' 탭의 ` : '다른 탭의 '}수집기가 일하고 있습니다. 한 PC에는 수집기 하나가 원칙입니다.\n\n켜면 생기는 단점:\n· 같은 PC·같은 알라딘 아이디로 요청이 두 배로 나가, '요청 너무 많음(429)'·잠시 막힘에 더 빨리 걸립니다. 걸리면 두 탭 모두 느려지고, 다른 PC의 수집까지 늦어질 수 있습니다\n· 두 탭이 같은 종류의 작업을 하면 진행 위치(이어하기 자리)를 서로 덮어쓰거나 같은 쪽을 두 번 읽을 수 있습니다 (작업 잠금이 대부분 막지만 완전하지는 않습니다)\n· 브라우저 메모리·CPU를 두 배로 써서 탭이 느려지거나 멈출 수 있습니다\n· 기록과 진행 상태가 두 탭으로 나뉘어, 무엇이 어디서 도는지 헷갈리기 쉽습니다\n\n켜도 매일 자동 수집·웹앱 요청·맡긴 일(등록·송장·시장 지표)은 원래 탭이 계속 맡고, 이 탭은 사람이 직접 누른 작업만 합니다.\n이 탭을 새로고침하면 다시 쉬는 상태로 돌아갑니다.\n\n그래도 이 탭을 켤까요?`); };
  window.__rnGate = (what) => { if (role === 'lead' || role === 'other' || role === 'force') return true;
    let gesture = false; try { gesture = !!(navigator.userActivation && navigator.userActivation.isActive); } catch (e) {}
    if (gesture && role !== 'leaving') { if (window.__rnForceAsk()) { window.__rnForce(true); return true; } return false; }
    if (Date.now() - lastNote > 10 * 60000) { lastNote = Date.now(); L('info', `쉬는 탭이라 '${what || '작업'}'을(를) 시작하지 않음 — 이 PC의 수집기 탭이 맡습니다`); } return false; };
  /* 안전한 새로고침: 옛 탭은 넘겨주며 놓고(떠남), 새 탭은 '이어받을 탭'으로 표시 */
  window.__rnLeadRelease = () => { if (role !== 'lead') return; role = 'leaving'; clearInterval(beatT); try { const v = GM_getValue(GK, null); if (v && v.tab === ME) GM_deleteValue(GK); } catch (e) {} if (release) { const r = release; release = null; r(); } };
  window.__rnClaimHeir = () => { try { GM_setValue(HK, { tab: ME, at: Date.now() }); } catch (e) {} };
  addEventListener('pagehide', () => { if (role === 'lead') { try { const v = GM_getValue(GK, null); if (v && v.tab === ME) GM_deleteValue(GK); } catch (e) {} } });
  if (!PANEL) return;
  const hold = () => new Promise((res) => { release = res; });
  // 넘겨받을 차례가 됐는데 이어받을 탭(heir)이 따로 있으면, 그 탭에 양보하고 다시 줄을 섬
  let qAc = null; const queue = () => navigator.locks.request(LK, (() => { try { qAc = new AbortController(); return { signal: qAc.signal }; } catch (e) { qAc = null; return {}; } })(), () => { if (heirOther() || workOther()) { setTimeout(queue, 1500); return null; } setLead('promote'); return hold(); }).catch(() => {});
  let stealT = null, seen = null; const STALE = 5 * 60000; /* (1.89.173 정범님 11/01 '팝업으로 멈추면 다른 곳에선 알 길이 없음') 15분 → 5분 — 알라딘 팝업 등으로 일하는 탭이 얼면 쉬는 탭이 더 빨리 넘겨받음(확인 2분) · 백그라운드 탭도 심장박동은 1분 안이라 5분이면 충분 */
  const stealChk = () => { if (role !== 'follow') { seen = null; return; } const now = Date.now(); const v = GM_getValue(GK, null);
    if (!v || !v.at || now - v.at < STALE || heirOther() || (seen && now - seen.tick > 150000)) { seen = null; if (v && v.at && now - v.at >= STALE) seen = { at: v.at, t0: now, tick: now }; return; }
    if (!seen || seen.at !== v.at) { seen = { at: v.at, t0: now, tick: now }; return; } seen.tick = now; if (now - seen.t0 < 2 * 60000) return;
    clearInterval(stealT); stealT = null; seen = null; try { qAc && qAc.abort(); } catch (e) {} L('warn', `🧊 이 PC의 수집기 탭(${window.__rnPageName(v.page)})이 ${Math.round((now - v.at) / 60000)}분 넘게 신호가 없음(브라우저가 탭을 얼렸거나 멈춤) — 이 탭이 수집기를 넘겨받습니다`);
    navigator.locks.request(LK, { steal: true }, () => { setLead('steal'); return hold(); }).catch(() => {}); };
  const watchLead = () => { if (!stealT) stealT = setInterval(stealChk, 60000); };
  stepDown = (o) => { clearInterval(beatT); role = 'follow'; const r0 = release; release = null; if (r0) { try { r0(); } catch (e) {} } try { window.__rnPrd && window.__rnPrd.pause(); } catch (e) {} try { window.__rnCrm && window.__rnCrm.pause(); } catch (e) {}
    L('warn', `🧊 이 탭이 얼어 있던 사이 다른 탭(${window.__rnPageName(o.page)})이 수집기를 넘겨받았습니다 — 이 탭은 하던 일을 지금 항목까지 저장하고 쉬는 탭으로 물러납니다`); fire(); queue(); watchLead(); };
  const viaGM = () => { // Web Locks가 없는 브라우저: 심장박동
    const tick = () => { if (role === 'lead') return beat(); if (role === 'leaving') return; const v = GM_getValue(GK, null); const fresh = v && v.tab !== ME && Date.now() - (v.at || 0) < 15000;
      if (!fresh && !heirOther() && !workOther()) { GM_setValue(GK, { tab: ME, page: PG(), at: Date.now() }); setTimeout(() => { const w = GM_getValue(GK, null); if (w && w.tab === ME) setLead(role === 'wait' ? 'first' : 'promote'); else if (role === 'wait') setFollow(); }, 800); }
      else if (role === 'wait') setFollow(); };
    tick(); setInterval(tick, 5000); };
  try {
    if (!navigator.locks || !navigator.locks.request) throw 0;
    navigator.locks.request(LK, { ifAvailable: true }, (lk) => { if (!lk || heirOther() || workOther()) { setFollow(); queue(); watchLead(); return null; } setLead('first'); return hold(); }).catch(() => { if (role === 'wait') viaGM(); }); /* (1.89.120) 이미 정해진 뒤의 거절(넘겨받기로 Web Lock을 뺏김 = AbortError)에는 심장박동 방식으로 바꾸지 않음 — 바꾸면 두 탭이 번갈아 수집기가 됨 */
  } catch (e) { viaGM(); }
  setTimeout(() => { if (role === 'wait') { L('warn', '수집기 탭 정하기가 5초 안에 끝나지 않아 심장박동 방식으로 바꿉니다'); viaGM(); } }, 5000);
  /* (정범님 11/05) 🪟 사람 탭이 수집기(지도자)인데 이 PC의 작업 창이 살아 있으면 — 하던 일이 없을 때(쉬는 사이) 작업 창에 넘기고 쉬는 탭으로 물러남(줄은 다시 섬 · 작업 창이 닫히면 이 탭이 이어받음)
   *  하던 일 중이면 끊지 않고 기다림(기록 한 번) · 쉬는 탭이 켜 둔 탭(force)·떠나는 탭은 건드리지 않음 */
  if (!IS_WORK) { let waitNoted = 0; setInterval(() => { try { if (role !== 'lead' || window.__rnReloading) return; const w = workOther(); if (!w) { waitNoted = 0; return; }
    const busy = (window.__rnPrd && window.__rnPrd.busy && window.__rnPrd.busy()) || (window.__rnCrm && window.__rnCrm.busy && window.__rnCrm.busy());
    if (busy) { if (!waitNoted) { waitNoted = 1; L('info', '🪟 이 PC의 작업 창이 열려 있음 — 지금 하는 일을 마치면 수집을 작업 창에 넘깁니다'); } return; }
    clearInterval(beatT); role = 'follow'; try { const v = GM_getValue(GK, null); if (v && v.tab === ME) GM_deleteValue(GK); } catch (e) {} const r0 = release; release = null; if (r0) { try { r0(); } catch (e) {} }
    L('ok', '🪟 수집을 이 PC의 작업 창에 넘겼습니다 — 이 탭은 화면 기능만 합니다 (작업 창을 닫거나 작업 창 모드를 끄면 이 탭이 다시 이어받음)'); fire(); setTimeout(() => { try { if (navigator.locks && navigator.locks.request) { queue(); watchLead(); } } catch (e) {} }, 1500); } catch (e) {} }, 10000); }
  window.__rnWorkInfo = () => ({ isWork: IS_WORK, on: !!(W && W.on()), role, other: workOther() });
})();
/* (정범님 11/09 shipfz1 · 약속 0-1 '출고 처리 중에는 절대로 어떤 것도 출고 작업 중인 컴퓨터와 MJ-MAIN을 건드리지 않아 … 출고가 끝나면 정지된 시점부터 손실 없이 정확히 이어 감') 🚚 출고 보호
 *  · '출고 중' 판단은 여기 한 곳(shipGuardDecide) — 출고 표 shp_runs/_guard.holds{ 칸: { pc, why, t0, end } } + 이 PC 수집기가 막 맡은 출고 일(GM rn-sg-local · 서버를 거치지 않고 바로)
 *    칸을 적는 곳: 웹앱(▶ 오늘 출고 끝까지 · 📦 ALPS 송장 인쇄) · 수집기(출고 맡긴 일 = 발송준비시작·발송 요청 다시 읽기·주문 취소·현금 판매 중지 · 송장 입력 맡김(CSV 일괄·한 건씩) · 🚨 발송 요청 다시 읽기)
 *  · 보호하는 PC: 그 출고 일을 하는 PC(칸의 pc) + MJ-MAIN(살아 있는 칸이 하나라도 있으면 무조건)
 *  · 끝: 칸에 end가 적힘 · 끝 소식이 안 오면(탭이 죽음 등) 마지막 소식(시작 t0 · 맥박 beat 중 늦은 것)에서 maxH(기본 1시간 — 정범님 11/09 저녁 · 근거: 없음, 설정 oneShot.guardMaxH로 바꿈) 지나면 풀고 기록
 *    (shipsafe2) 출고가 1시간보다 길어도 웹앱·수집기가 맥박(beat)을 적는 동안은 풀리지 않음 — 맥박이 끊긴 뒤 1시간이면 풀림
 *  · 보호 중 멈추는 것: 새로고침 길 모두(⚡ 새 판 바꾸기·안전한 새로고침·메모리 정리·죽은 탭 되살리기·원격 업데이트) · 새로 시작하는 자동 일(⏰ 매일 자동·맡긴 일·쉴 때 하는 일)
 *    이미 돌던 자동 일은 상품 하나 끝난 틈에 자리를 저장하고 비킴(⏸ 자리 내줌 → 같은 회차로 이어 감) · PC 도우미(127.0.0.1:8898)에도 /work/lead로 알려 스스로 새 판·되살리기를 미룸
 *  · 미룬 것은 GM rn-sg-def(이 PC 공용 줄)에 적고 기록 창에 '🚚 출고 중 — ○○ 미룸(출고 끝나면 이어 감)' 한 번 → 풀리면 '🚚 출고 끝 — 미룬 n가지 이어 감' 뒤 적어 둔 차례대로 이어 감
 *    (새로고침이 끼어 있으면 그것 하나만 — 새 탭이 저장된 자리부터 모두 이어 감) */
(function rnShipGuard() { if (window.top !== window) return;
  const MJ = 'MJ-MAIN';
  /* (정범님 11/09 저녁 shipsafe2) 출고와 관련된 마지막 수집기 판 — 출고·송장·ALPS·발송 쪽을 바꾼 판을 낼 때 이 번호를 그 판 번호로 올림(판 표시 칸 shipRel) · ⚡ 받아 둔 새 판 글에서 이 줄을 읽어 '출고 관련 업데이트'인지 가름 */
  const RN_SHIP_REL = '1.89.241'; window.__rnShipRel = RN_SHIP_REL;
  function shipGuardDecide(o) { const up = (x) => String(x == null ? '' : x).trim().toUpperCase(); const P = up(o.pc); const maxH = Math.max(0.5, Math.min(12, +o.maxH || 1)); const lim = maxH * 3600e3; const live = [], expired = [];
    for (const [id, h] of Object.entries(o.holds || {})) { if (!h || h.end || !(+h.t0 > 0)) continue; const x = { id, pc: up(h.pc), why: String(h.why || '출고'), t0: +h.t0, ref: Math.max(+h.t0, +h.beat || 0) }; (o.now - x.ref >= lim ? expired : live).push(x); }
    const mine = live.filter((h) => P && h.pc === P); const mjOn = !!P && P === up(o.mj || 'MJ-MAIN') && live.length > 0; const src = mine.length ? mine : mjOn ? live : []; const on = src.length > 0; const t0 = on ? Math.min(...src.map((h) => h.t0)) : 0;
    return { on, why: !on ? null : mine.length ? mine.map((h) => h.why).join(' · ') : `MJ-MAIN 보호 — ${live.map((h) => `${h.pc || '?'} ${h.why}`).join(' · ')}`, since: t0, until: on ? Math.max(...src.map((h) => h.ref)) + lim : 0, maxH, mine: mine.length, live: live.length, mj: mjOn, expired }; } /* ⟦shipGuardDecide 끝⟧ */
  function sgDefAdd(L, it) { L = Array.isArray(L) ? L : []; if (L.some((x) => x && x.k === it.k)) return { L, added: false }; return { L: [...L, it], added: true }; }
  function sgResumePlan(items) { const L = (items || []).slice().sort((a, b) => (a.at || 0) - (b.at || 0)); const r = L.find((x) => x.reload); return r ? [r] : L; } /* ⟦sgResumePlan 끝⟧ */
  const GK = 'rn-sg-doc', LK = 'rn-sg-local', DK = 'rn-sg-def', CK = 'rn-sg-cfg';
  const gv = (k, d) => { try { const v = GM_getValue(k, d); return v == null ? d : v; } catch (e) { return d; } }; const sv = (k, v) => { try { GM_setValue(k, v); } catch (e) {} };
  const L = (lv, m) => { try { window.__rnLog && window.__rnLog('수집기', lv, m); } catch (e) {} };
  const pcName = () => { try { return (window.__rnPcName && window.__rnPcName.get()) || gv('rnu-pcname', '') || ''; } catch (e) { return ''; } };
  const TAB = Math.random().toString(36).slice(2, 9); const CBS = new Map(); const expNoted = {}; let cache = null, cacheAt = 0;
  function hold() { const now = Date.now(); if (cache && now - cacheAt < 1500) return cache; const d = gv(GK, null) || {}; const H = { ...(d.holds || {}) }; const pc = pcName(); const loc = gv(LK, {}) || {}; for (const [id, h] of Object.entries(loc)) if (h && !H[id]) H[id] = { ...h, pc }; /* 서버에 같은 칸이 있으면 서버 것(끝 표시 포함)을 믿음 */
    const c = gv(CK, {}) || {}; cache = shipGuardDecide({ now, pc, holds: H, maxH: (d.cfg && d.cfg.maxH) || c.maxH || 1, mj: (d.cfg && d.cfg.mj) || c.mj || MJ }); cacheAt = now; return cache; }
  window.__rnShipHold = hold; window.__rnSgOn = () => { try { return !!hold().on; } catch (e) { return false; } };
  /* 미룸 — k 하나에 한 번만 적고 한 번만 기록 · fn = 출고가 끝나면 이 탭이 다시 할 일(없으면 그 일이 스스로 다시 봄) · o.reload = 새로고침(끝나면 이것 하나만) */
  window.__rnShipDefer = (k, name, fn, o) => { const r = sgDefAdd(gv(DK, []), { k, name: String(name || k).slice(0, 80), tab: TAB, at: Date.now(), reload: !!(o && o.reload) }); if (typeof fn === 'function' && !CBS.has(k)) CBS.set(k, { k, name, fn, reload: !!(o && o.reload), at: Date.now() }); if (r.added) { sv(DK, r.L); L('warn', `🚚 출고 중 — ${name} 미룸(출고 끝나면 이어 감) · ${hold().why || ''}`); } return true; };
  window.__rnShipWait = (k, name, fn, o) => { if (!window.__rnSgOn()) return false; window.__rnShipDefer(k, name, fn, o); return true; };
  window.__rnShipDefN = () => (gv(DK, []) || []).length;
  window.__rnSgShip = () => { try { const h = hold(); return h.on ? { on: true, until: h.until, why: String(h.why || '').slice(0, 120) } : { on: false }; } catch (e) { return null; } }; /* PC 도우미(127.0.0.1:8898)에 알림 — 도우미가 스스로 새 판 받기·되살리기를 미룸(until = 최대 시간 · 수집기 탭이 죽어도 그때까지) */
  window.__rnShipGuardFeed = (data, src) => { const at = (data && data._at) || Date.now(); const cur = gv(GK, null); if (cur && src === 'web' && (cur.at || 0) > at) return; sv(GK, { holds: (data && data.holds) || {}, cfg: (data && data.cfg) || {}, at, src: src || 'fs' }); cache = null; };
  window.__rnShipLocal = (id, why, end) => { const o = gv(LK, {}) || {}; if (end) { if (!o[id]) return false; delete o[id]; } else { if (o[id]) return false; o[id] = { why: String(why || '출고').slice(0, 80), t0: Date.now(), tab: TAB }; } sv(LK, o); cache = null; return true; };
  /* (정범님 11/12 오후 shipq1) 🔕 출고 시간 방해 금지 — 웹앱 app_settings/ship_quiet { on, from, to }(기본 꺼짐 · 13:00~15:00 · 한국 시각)
   *  · 켜져 있고 지금이 그 시간대면: ⚡ 새 수집기 판 바꾸기 · 메모리 정리 새로고침(수집 중·쉬는 때·바쁜 중) · 새 판으로 가는 안전한 새로고침을 그 시간대 끝까지 미룸 → 끝나면 이어 감
   *  · 수집·맡긴 일 같은 다른 일은 막지 않음(그건 실제 출고 중 🚚 출고 보호만) · 사람이 보낸 🛰 원격 업데이트도 막지 않음
   *  · 메모리가 한계의 memPct(기본 85% — 근거: 없음, 11/08 HOME 탭이 97%에서 죽음 · 칸 memPct로 바꿈) 넘으면 탭이 죽기 전에 정리(미루지 않음)
   *  · 값은 수집기가 Firestore에서 직접 듣고(rnu 로그인 탭) + 웹앱 탭의 data-rn-sq로도 받아 GM rn-sq-cfg(이 PC 공용)에 둠 */
  function sqDecide(c, now) { const hm = (v, d) => { const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(v == null ? '' : v).trim()); return m ? { s: `${m[1].padStart(2, '0')}:${m[2]}`, n: +m[1] * 60 + +m[2] } : hm(d); };
    c = c || {}; const f = hm(c.from, '13:00'), t = hm(c.to, '15:00'); const base = { cfgOn: !!c.on, from: f.s, to: t.s, on: false, until: 0 }; if (!c.on || f.n === t.n) return base;
    const k = new Date(now + 9 * 3600e3); const m = k.getUTCHours() * 60 + k.getUTCMinutes(); const day0 = now - (m * 60 + k.getUTCSeconds()) * 1e3 - k.getUTCMilliseconds(); /* 한국 날짜 0시 */
    const inW = f.n < t.n ? m >= f.n && m < t.n : m >= f.n || m < t.n; if (!inW) return base;
    const until = day0 + (t.n + (f.n > t.n && m >= f.n ? 1440 : 0)) * 60e3; return { ...base, on: true, until }; } /* ⟦sqDecide 끝⟧ */
  const QK = 'rn-sq-cfg'; const QCB = new Map(); const sqMemNoted = {};
  window.__rnSqFeed = (c, src) => { const at = Date.parse((c && c.at) || '') || 0; const cur = gv(QK, null); if (cur && (Date.parse(cur.at || '') || 0) > at) return; sv(QK, c ? { on: !!c.on, from: c.from, to: c.to, at: c.at || null, memPct: +c.memPct || null, src: src || 'fs' } : { on: false, at: null, src: src || 'fs' }); };
  window.__rnSqOn = () => { try { return sqDecide(gv(QK, null), Date.now()); } catch (e) { return { on: false }; } };
  /* 미룸 — 시간대 안이면 true(한 번만 기록) · fn = 끝나면 이 탭이 다시 할 일(없으면 그 일이 스스로 다시 봄) · o.mem = 메모리 정리(o.ratio가 memPct를 넘으면 미루지 않음) */
  window.__rnSqWait = (k, name, fn, o) => { o = o || {}; const q = window.__rnSqOn(); if (!q.on) return false;
    if (o.mem) { const hi = Math.max(50, Math.min(98, +((gv(QK, null) || {}).memPct) || 85)) / 100; if (+o.ratio >= hi) { if (!sqMemNoted[k] || Date.now() - sqMemNoted[k] > 30 * 60e3) { sqMemNoted[k] = Date.now(); L('warn', `🔕 출고 시간 방해 금지(${q.from}~${q.to}) 중이지만 메모리 ${Math.round(o.ratio * 100)}% — 탭이 죽기 전에 ${name}(기준 ${Math.round(hi * 100)}%)`); } return false; } }
    if (!QCB.has(k)) { QCB.set(k, { k, name, fn: typeof fn === 'function' ? fn : null, reload: !!o.reload, at: Date.now() }); L('info', `🔕 출고 시간 방해 금지(${q.from}~${q.to}) — ${name} 미룸(${q.to} 뒤 이어 감)`); } return true; };
  window.__rnSqDefN = () => QCB.size;
  /* 5초마다: 최대 시간 지난 칸 기록 · 풀렸으면 미룬 것 이어 감 · 웹앱 화면 다리(data-rn-sgdoc 받기 · data-rn-shiphold 알리기) */
  const APP = /^(jerrycson\.github\.io|readnow\.kr)$/i.test(location.hostname); let lastFeed = '', lastNow = '', lastSq = '';
  async function sgTick() { try {
    if (APP) { const a = document.documentElement.getAttribute('data-rn-sgdoc'); if (a && a !== lastFeed) { lastFeed = a; try { const v = JSON.parse(a); window.__rnShipGuardFeed({ holds: v.holds, cfg: v.cfg, _at: +v.at || Date.now() }, 'web'); } catch (e) {} } }
    { /* (shipsafe2) 이 탭이 맡은 출고 칸은 5분마다 맥박(beat) — 1시간보다 긴 출고(송장 입력이 길 때)도 끝까지 보호 · 탭이 죽으면 맥박이 끊겨 1시간 뒤 풀림 */ const loc = gv(LK, {}) || {}; const own = Object.keys(loc).filter((id) => loc[id] && loc[id].tab === TAB && Date.now() - (+loc[id].beat || +loc[id].t0 || 0) > 5 * 60e3); if (own.length) { for (const id of own) loc[id].beat = Date.now(); sv(LK, loc); cache = null; try { window.__rnSgBeat && window.__rnSgBeat(own); } catch (e) {} } }
    if (APP) { const a = document.documentElement.getAttribute('data-rn-sq'); if (a && a !== lastSq) { lastSq = a; try { window.__rnSqFeed(JSON.parse(a), 'web'); } catch (e) {} } } /* (shipq1) 🔕 웹앱 탭 → 이 PC GM */
    if (QCB.size && !window.__rnSqOn().on && !(window.__rnSgOn && window.__rnSgOn())) { const plan = sgResumePlan([...QCB.values()]); const n = QCB.size; QCB.clear(); L('info', `🔕 출고 시간 방해 금지 끝 — 미룬 ${n}가지 이어 감`); for (const it of plan) { if (!it.fn) continue; try { await it.fn(); } catch (e) { L('err', `🔕 이어 가기 실패 — ${it.name}: ${e.message}`); } await new Promise((r) => setTimeout(r, 1500)); } }
    if (APP) { const u = document.documentElement.getAttribute('data-rn-sgupdnow'); if (u && u !== lastNow) { lastNow = u; try { const v = JSON.parse(u); if (v && Date.now() - (+v.at || 0) < 120e3) { sv('rn-sg-updnow', { at: +v.at, by: String(v.by || '웹앱').slice(0, 40) }); L('info', `🚚 출고 전에 업데이트 먼저(웹앱에서 고름) — 받아 둔 새 수집기 판으로 지금 바꿈(쉬는 사이를 기다리지 않음)`); } } catch (e) {} } } /* (shipsafe2) 웹앱 '업데이트 먼저 하고 출고' → 이 PC 수집기 탭(새 판 지킴이)이 바로 바꿈 */
    const h = hold();
    for (const x of h.expired || []) if (!expNoted[x.id]) { expNoted[x.id] = 1; const P = String(pcName()).trim().toUpperCase(); if (x.pc === P || P === MJ) L('warn', `🚚 출고 보호 최대 시간(${h.maxH}시간) 지나 풀림 — '${x.why}'(${x.pc || '?'}) 끝 소식이 오지 않음`); }
    if (!h.on) { const all = gv(DK, []) || []; if (all.length) { sv(DK, []); L('info', `🚚 출고 끝 — 미룬 ${all.length}가지 이어 감 (${all.map((x) => x.name).join(' · ').slice(0, 300)})`); }
      if (CBS.size) { const plan = sgResumePlan([...CBS.values()]); CBS.clear(); for (const it of plan) { try { await it.fn(); } catch (e) { L('err', `🚚 이어 가기 실패 — ${it.name}: ${e.message}`); } await new Promise((r) => setTimeout(r, 1500)); } } }
    if (APP) { const n = (gv(DK, []) || []).length; let upd = null; try { upd = window.__rnSgUpd ? window.__rnSgUpd() : null; } catch (e) {} document.documentElement.setAttribute('data-rn-shiphold', JSON.stringify({ on: !!h.on, why: h.why || '', n, since: h.since || 0, until: h.until || 0, at: Date.now(), upd })); } /* (shipsafe2) upd = 이 PC 수집기 업데이트 상태(지금 판·받아 둔 판·출고 관련인지·새 탭으로 바꾸는 중) → 웹앱 출고 단추가 봄 */
  } catch (e) {} }
  window.__rnShipTick = sgTick; setInterval(sgTick, 5000); setTimeout(sgTick, 1200);
})();
/* (정범님 11/09 oom1) 🩺 죽은 수집기 탭 되살리기 — HOME·MJ-MAIN 수집기 탭이 크롬 '앗, 이런! Out of Memory'·'DNS_PROBE_FINISHED_NXDOMAIN'(집 인터넷 흔들림) 화면으로 죽으면 그 화면엔 스크립트가 안 돌아 사람이 새로고침해야 했음
 *  · 같은 PC 같은 크롬에 이 스크립트가 도는 다른 탭(웹앱 탭 · 수집기가 아닌 알라딘 화면)이 있으면 그 탭이 1분마다 봄: 이 PC 수집기 탭이 마지막으로 살아 있던 때(rnu-lead-seen · 30초마다)가
 *    reviveMin(기본 10분 — 근거: 없음, 설정 GM 'rn-revive-cfg'로 바꿈) 넘게 지났고 · 그 전 6시간 안엔 살아 있었고(이 PC가 수집기 PC) · 마지막에 일시정지가 아니었고 · 이 탭이 3분 넘게 깨어 지켜봤으면(PC 잠자기에서 막 깬 때 제외)
 *    → 인터넷 확인(알라딘이 아닌 gstatic 204 — 알라딘 요청을 늘리지 않음 · 안 되면 기다렸다 다음 1분에 다시) → 새 탭(뒤쪽)으로 알라딘 주문조회를 엶(그 탭의 수집기가 이어받아 저장된 자리부터)
 *  · 1시간에 2번까지 · 한 번 연 뒤 reviveMin 동안은 다시 열지 않음(새 탭이 뜨길 기다림) · 여러 탭이 같이 보면 GM 'rn-revive' 한 칸으로 한 탭만 · 크롬·다른 탭은 닫거나 죽이지 않음
 *  · 쉬는 탭(같은 화면 두 번째 탭)은 이미 5분 넘게 신호 없는 수집기 탭을 넘겨받으므로(rnRole) 이것은 그런 탭도 없을 때를 위한 것 · 공개 수집 크롬(로거)은 로컬 도우미 지킴이가 맡아 여기선 안 함
 *  · 열 주소는 주문조회(/scm/worders.aspx) — 수집기는 주문조회·상품 조회·판매관리 화면에서만 돎(/scm/wmain.aspx엔 수집기가 안 뜸) */
(function rnRevive() { if (window.top !== window || globalThis.__rnPubHome || globalThis.__rnPubChrome) return;
  const AL = /(^|\.)aladin\.co\.kr$/i.test(location.hostname); const APP = /^(jerrycson\.github\.io|readnow\.kr)$/i.test(location.hostname) && /^\/(readnow-scripts\/)?app\//.test(location.pathname);
  if (!APP && !(AL && /^\/(scm|shop|usedstore)\//i.test(location.pathname) && !/\/scm\/(wrecord_edit|worders|worder_preparatory_complete)\.aspx/i.test(location.pathname))) return;
  const URL0 = 'https://www.aladin.co.kr/scm/worders.aspx';
  function reviveDecide(o) { const S = o.seen; const M = 60e3; if (o.off) return { act: 'none', why: '꺼 둠' }; if (!S || !S.at || o.now - S.at > o.aliveH * 3600e3) return { act: 'none', why: '이 PC 수집기 기록 없음(또는 오래됨)' }; if (o.now - S.at < o.staleMin * M) return { act: 'none', why: '살아 있음' }; if (S.paused) return { act: 'none', why: '일시정지 중이었음' }; if (o.ship) return { act: 'none', ship: true, why: '🚚 출고 중 — 되살리기 미룸(출고 끝나면 이어 감)' }; /* (11/09 shipfz1) 출고 중인 PC·MJ-MAIN은 건드리지 않음 */
    if (!o.watchFrom || o.now - o.watchFrom < 3 * M) return { act: 'none', why: '지켜보는 중(잠자기에서 깬 때 대비)' }; const opens = (o.opens || []).filter((t) => o.now - t < 3600e3); if (o.last && o.now - o.last < o.staleMin * M) return { act: 'none', why: '방금 새 탭을 엶 — 뜨길 기다림' }; if (opens.length >= o.perHour) return { act: 'limit', why: `1시간에 ${o.perHour}번 넘게 열어 쉼` };
    if (o.net === false) return { act: 'wait-net', why: '인터넷이 안 됨 — 기다렸다 다시' }; return { act: 'open' }; } /* ⟦reviveDecide 끝⟧ */
  const L = (lv, m) => { try { window.__rnLog && window.__rnLog('수집기', lv, m); } catch (e) {} };
  const net = () => new Promise((res) => { const t = setTimeout(() => res(false), 8000); fetch('https://www.gstatic.com/generate_204?rn=' + Date.now(), { mode: 'no-cors', cache: 'no-store' }).then(() => { clearTimeout(t); res(true); }, () => { clearTimeout(t); res(false); }); });
  let watchFrom = 0, tickAt = 0, noted = '';
  setInterval(async () => { try { const now = Date.now(); if (!tickAt || now - tickAt > 150000) watchFrom = now; tickAt = now; /* 이 탭이 멈췄던(잠자기) 틈이 있으면 다시 지켜보기 시작 */
    const cfg = GM_getValue('rn-revive-cfg', null) || {}; const seen = GM_getValue('rnu-lead-seen', null); const R = GM_getValue('rn-revive', null) || {};
    const base = { now, seen, watchFrom, ship: !!(window.__rnSgOn && window.__rnSgOn()), off: cfg.on === false, staleMin: Math.max(5, Math.min(120, +cfg.staleMin || 10)), aliveH: Math.max(1, Math.min(48, +cfg.aliveH || 6)), perHour: Math.max(1, Math.min(4, +cfg.perHour || 2)), opens: R.opens || [], last: R.last || 0 };
    let d = reviveDecide(base); if (d.ship) { window.__rnShipDefer && window.__rnShipDefer('revive', '죽은 수집기 탭 되살리기'); return; } if (d.act !== 'open') { if (d.act !== 'none' && noted !== d.why) { noted = d.why; L('warn', `🩺 이 PC 수집기 탭이 ${Math.round((now - (seen && seen.at || now)) / 60e3)}분 넘게 신호 없음 — ${d.why}`); } return; }
    d = reviveDecide({ ...base, net: await net() }); if (d.act !== 'open') { if (noted !== d.why) { noted = d.why; L('warn', `🩺 이 PC 수집기 탭이 멈춘 듯하지만 ${d.why}`); } return; }
    const R2 = GM_getValue('rn-revive', null) || {}; if (R2.last && Date.now() - R2.last < base.staleMin * 60e3) return; /* 다른 탭이 방금 엶 */ const opens = [...(R2.opens || []).filter((t) => Date.now() - t < 3600e3), Date.now()];
    GM_setValue('rn-revive', { last: Date.now(), opens, by: location.hostname }); noted = ''; L('warn', `🩺 이 PC 수집기 탭이 ${Math.round((now - seen.at) / 60e3)}분 동안 신호 없음(크롬 'Out of Memory'·인터넷 끊김 화면 추정) — 새 탭으로 알라딘 주문조회를 엶(1시간 ${opens.length}/${base.perHour}번째) · 저장된 자리부터 이어 함`);
    try { GM_openInTab(URL0, window.__rnTabOpt()); } catch (e) { L('err', '🩺 새 탭 열기 실패: ' + e.message); }
  } catch (e) {} }, 60000);
})();
(function rnPcName() {
  const keys = () => { let n = null; try { n = GM_getValue('rnu-pcname', null) || GM_getValue('pcName', null) || (GM_getValue('rn-pc', {}) || {}).name || localStorage.getItem('rnu-pcname'); } catch (e) {} return n && String(n).trim() ? String(n).trim() : null; };
  const setAll = (n) => { n = String(n || '').trim(); if (!n) return; try { GM_setValue('rnu-pcname', n); GM_setValue('pcName', n); const pc = GM_getValue('rn-pc', null) || { id: Math.random().toString(36).slice(2, 10), name: '' }; if (pc.name !== n) { pc.name = n; GM_setValue('rn-pc', pc); } if (!globalThis.__rnPubChrome) localStorage.setItem('rnu-pcname', n); /* (1.71.0) 로거 크롬은 알라딘 쪽 저장소에 PC 이름을 남기지 않음 */ } catch (e) {} };
  const cur = keys(); if (cur) setAll(cur); // 한 곳에만 있어도 모두 맞춤
  window.__rnPcName = { get: keys, set: setAll, ask: (why) => { const v = keys(); if (v) return v; if (!window.__rnHuman(8000)) { window.__rnNote('이 PC의 이름이 아직 없습니다 — 수집기 개요에서 PC 이름을 정해 주세요 (사람이 없을 때는 묻지 않고 넘어감)', 'warn'); return null; } const n = prompt(`이 PC의 이름을 정해 주세요 (예: JS-MAIN, HOME). ${why || ''}\n한 번만 정하면 됩니다 — 새로고침·스크립트 교체 뒤에도 기억합니다.`); if (n && n.trim()) { setAll(n.trim()); return n.trim(); } return null; } };
})();
/* ═════════════ 작업 기록 (두 모듈 공통) ═════════════
 * 모든 진행(단계 시작·끝, 쪽·항목마다의 진행, 양보·기다림·오류)을 초 단위로 남김.
 * 이 PC: 날짜별로 브라우저에 보관(최근 7일) — 새로고침·멈춤 뒤에도 남음.  Firebase: rn_logs/{PC}_{날짜시각10분} 에 1분마다 묶어서 올림 → 웹앱이나 다른 PC에서도 확인.
 * 화면: 위쪽 [기록] 버튼 → 크게 보는 창 (중요만/전체/오류, 검색, 자동 스크롤, 내려받기). 진행을 늦추지 않게 화면 갱신은 1초에 한 번. */
/* (1.60.1) 수집기 창들(관제판·상품/고객 패널·작업 기록·⏰ 칸 편집기·등록 창)의 앞뒤 — 누른 창이 맨 앞으로(늘 맨 위로 고정된 창 없음) */
(function rnZ() { if (window.top !== window || window.__rnFront) return; const SEL = '#rn-ctl, #rnp, #rn-crm, #rn-jw, #rnas, #rnRegFill'; let top = 2147483600;
  window.__rnFront = (el) => { if (!el) return; const L = globalThis.__rnQA(SEL); L.forEach((e) => { if (!e.style.zIndex) e.style.zIndex = String(++top); });
    if (top >= 2147483640) { top = 2147483600; L.filter((e) => e !== el).sort((a, b) => +a.style.zIndex - +b.style.zIndex).forEach((e) => (e.style.zIndex = String(++top))); } el.style.zIndex = String(++top); };
  globalThis.__rnOn('pointerdown', (e) => { const el = e.target && e.target.closest && e.target.closest(SEL); if (el) window.__rnFront(el); }, true); })();
(function rnJournal() {
  if (window.top !== window || window.__rnLog) return;
  const MAXMEM = 30000; const buf = []; let bufN = 0; /* (1.74.4) 화면이 그린 뒤 새 줄이 왔는지 — 예전엔 buf.length로 봐서 1만 줄이 차면 길이가 그대로라 '이번 화면'이 멈춰 보였음 */ const lt = []; let ltDirty = false; const pend = []; const idbPend = []; let dirty = false; let seq = 0;
  const day = (d) => { const k = new Date(d.getTime() + 9 * 3600e3); return k.toISOString().slice(0, 10); };
  const LSK = (d) => 'rnu-log-' + d;
  // ── 기록 보관: 이 PC의 IndexedDB('rn-journal')에 날짜별로 덧붙임 — 지우지 않고 계속 쌓음 (내려받기 하면 그때 비움)
  /* (1.71.0) 로거 크롬: 작업 기록을 알라딘 쪽 저장소(IndexedDB)에 두지 않고 이 탭 메모리에만(서버 기록 rn_logs는 그대로) — 알라딘 화면 스크립트가 읽을 수 있는 곳에 흔적을 남기지 않게 */
  const JMEM = globalThis.__rnPubChrome ? new Map() : null; const JDB = () => (JMEM ? Promise.resolve({ __mem: 1, close() {} }) : new Promise((res, rej) => { const r = indexedDB.open('rn-journal', 1); r.onupgradeneeded = () => r.result.createObjectStore('days', { keyPath: 'day' }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }));
  const jtx = async (mode, fn) => { if (JMEM) { let out; const st = { get: (k) => { const q = { result: JMEM.get(k) }; setTimeout(() => q.onsuccess && q.onsuccess()); return q; }, getAllKeys: () => { const q = { result: [...JMEM.keys()] }; setTimeout(() => q.onsuccess && q.onsuccess()); return q; }, getAll: (rg) => { const q = { result: [...JMEM.entries()].filter(([k]) => !rg || (k >= rg.lower && k <= rg.upper)).map(([, v]) => v) }; setTimeout(() => q.onsuccess && q.onsuccess()); return q; }, put: (rec) => { JMEM.set(rec.day, rec); if (JMEM.size > 6000) { const it = JMEM.keys(); for (let k = JMEM.size - 5000; k > 0; k--) JMEM.delete(it.next().value); } }, /* (1.71.1 자동 점검) 메모리 기록은 최근 묶음 5천~6천 개(20초 묶음 ≈ 하루 넘게)까지 — 24시간 켜 둔 로거 탭이 기록으로 메모리를 끝없이 쓰지 않게(서버 rn_logs에는 다 있음) */ clear: () => JMEM.clear() }; await fn(st, (v) => (out = v)); await new Promise((r) => setTimeout(r, 0)); return out; } const db = await JDB(); return new Promise((res, rej) => { const t = db.transaction('days', mode); const st = t.objectStore('days'); let out; Promise.resolve(fn(st, (v) => (out = v))).catch(rej); t.oncomplete = () => { db.close(); res(out); }; t.onerror = () => { db.close(); rej(t.error); }; }); };
  /* (1.74.4) 📜 로거 기록을 이 PC 디스크(로컬 도우미 D:\\ReadNow\\journal)에 보관 — 예전엔 탭 메모리에만 있어 새로고침·크롬 다시 켜기 때마다 '전체 기록'이 통째로 사라졌음
   *  알라딘 화면은 읽을 수 없는 곳(도우미 · X-RN-Jrn 머리) · 못 보내면 버리지 않고 모아 두었다 다시 보냄 · 도우미가 없으면 Firebase(rn_logs)에서 읽어 보여 줌 */
  const HJ = (pth, body) => new Promise((res) => { try { GM_xmlhttpRequest({ method: 'POST', url: 'http://127.0.0.1:8899' + pth, headers: { 'X-RN-Jrn': '1', 'Content-Type': 'application/json' }, data: JSON.stringify(body || {}), anonymous: true, timeout: 30000, onload: (r) => { try { const j = JSON.parse(r.responseText); res(r.status === 200 && j && j.ok ? j : null); } catch (e) { res(null); } }, onerror: () => res(null), ontimeout: () => res(null) }); } catch (e) { res(null); } });
  const hjPc = () => encodeURIComponent((window.__rnPcName && window.__rnPcName.get()) || 'LOGGER'); const hjPend = [];
  async function hjSend(chunks) { if (chunks) hjPend.push(...chunks); if (!hjPend.length) return true; const out = hjPend.splice(0, hjPend.length); const r = await HJ('/jrn-put?pc=' + hjPc(), { chunks: out }); window.__rnJrn = { okAt: r ? Date.now() : (window.__rnJrn || {}).okAt || 0, failAt: r ? (window.__rnJrn || {}).failAt || 0 : Date.now(), pend: hjPend.length + (r ? 0 : out.length) }; /* (1.77.4) 로거 디스크 기록이 실제로 쌓이는지 — 담당 PC 신호(pcBeat.jrn)로 웹앱·Claude가 확인 */ if (!r) { hjPend.unshift(...out); if (hjPend.length > 4000) hjPend.splice(0, hjPend.length - 4000); return false; } return true; }
  async function rnLogsDay(d) { try { if (!(window.firebase && firebase.apps.length && firebase.auth().currentUser)) return []; const a = d.replace(/-/g, ''); const pc = (window.__rnPcName && window.__rnPcName.get()) || ''; const ss = await firebase.firestore().collection('rn_logs').where(firebase.firestore.FieldPath.documentId(), '>=', pc + '_' + a).where(firebase.firestore.FieldPath.documentId(), '<=', pc + '_' + a + '\uf8ff').get(); const out = [];
      ss.forEach((x) => { for (const ln of (x.data().lines || [])) { const m = String(ln).match(/^(\d\d):(\d\d):(\d\d) \[([^\]]*)\] (⚠ |! |· )?([\s\S]*)$/); if (!m) continue; out.push({ t: Date.parse(`${d}T${m[1]}:${m[2]}:${m[3]}+09:00`), m: m[4], l: m[5] === '⚠ ' ? 'err' : m[5] === '! ' ? 'warn' : m[5] === '· ' ? 'detail' : 'info', x: m[6] }); } }); return out.sort((p, q) => p.t - q.t); } catch (e) { return []; } }
  const jget = (k) => jtx('readonly', (st, set) => { const r = st.get(k); r.onsuccess = () => set(r.result || null); });
  const jkeys = () => jtx('readonly', (st, set) => { const r = st.getAllKeys(); r.onsuccess = () => set(r.result || []); });
  const jput = (rec) => jtx('readwrite', (st) => { st.put(rec); });
  const jclear = async () => { await jtx('readwrite', (st) => { st.clear(); }); if (JMEM) await HJ('/jrn-clear?pc=' + hjPc()); /* 도우미는 지우지 않고 보관함으로 옮김 */ };
  // (1.25.1) 하루치 전체를 20초마다 읽고 다시 쓰던 방식이 오래 돌면 메모리를 크게 씀 → 작은 묶음으로 덧붙이기만 함 (키 '날짜#시각'), 읽을 때 날짜별로 합침
  async function jflush() { if (!idbPend.length) return; const out = idbPend.splice(0, idbPend.length); const g = {}; out.forEach((e) => { (g[day(new Date(e.t))] = g[day(new Date(e.t))] || []).push(e); });
    for (const [d, arr] of Object.entries(g)) { try { await jput({ day: `${d}#${String(Date.now()).padStart(15, '0')}-${++seq}`, lines: arr }); } catch (e) { idbPend.unshift(...arr); break; } }
    if (JMEM) await hjSend(Object.entries(g).map(([d, lines]) => ({ d, lines }))); }
  const jgetDay = (d) => jtx('readonly', (st, set) => { const r = st.getAll(IDBKeyRange.bound(d, d + '\uffff')); r.onsuccess = () => set({ day: d, lines: (r.result || []).flatMap((x) => x.lines || []) }); });
  const jgetDayL = jgetDay; const jdaysL = async () => [...new Set((await jkeys()).map((k) => String(k).split('#')[0]))];
  const jmerge = (A, B) => { const seen = new Set(); const out = []; for (const e of [...A, ...B]) { const k = e.t + '|' + e.m + '|' + e.x; if (seen.has(k)) continue; seen.add(k); out.push(e); } return out.sort((p, q) => p.t - q.t); };
  const jgetDayX = async (d) => { const loc = await jgetDayL(d); if (!JMEM) return loc; const h = await HJ('/jrn-day?pc=' + hjPc() + '&d=' + d); let L = jmerge((h && h.lines) || [], (loc && loc.lines) || []); if (!h) { const fb = await rnLogsDay(d); L = jmerge(fb, L); } return { day: d, lines: L }; };
  const jdays = async () => { const L = await jdaysL(); if (!JMEM) return L; const h = await HJ('/jrn-days?pc=' + hjPc()); const S = new Set([...L, ...((h && h.days) || [])]); if (!h) for (let i = 0; i < 7; i++) S.add(day(new Date(Date.now() - i * 864e5))); return [...S]; };
  (async () => { try { // 예전 localStorage 기록(7일치)을 옮겨 담고 지움 · 오늘 기록을 불러와 이어 씀
    for (let i = 0; i < 30; i++) { const d = day(new Date(Date.now() - i * 864e5)); const raw = localStorage.getItem(LSK(d)); if (!raw) continue; try { const arr = JSON.parse(raw); const rec = (await jget(d)) || { day: d, lines: [] }; if (!rec.lines.length) { rec.lines = arr; await jput(rec); } } catch (e) {} localStorage.removeItem(LSK(d)); }
  } catch (e) {} })(); // (1.74.4) 새로고침해도 '오늘 기록'은 오늘 0시부터 이어서(jPrefill)
  /* (1.74.4) '오늘 기록'은 새로고침·크롬 다시 켜기 뒤에도 오늘 0시부터 이어서 — 보관된 오늘 줄을 화면 앞에 다시 채움(다시 보관·업로드하지 않음 · 같은 줄은 하나로) */
  const jPrefill = async (tries) => { try { const td = day(new Date()); const rec = await jgetDayX(td); const L = (rec && rec.lines) || []; if (!L.length && JMEM && tries > 0) return setTimeout(() => jPrefill(tries - 1), 15000); const have = new Set(buf.map((e) => e.t + '|' + e.x)); const add = L.filter((e) => e && e.t && day(new Date(e.t)) === td && !have.has(e.t + '|' + e.x)); if (!add.length) return; buf.unshift(...add); buf.sort((p, q) => p.t - q.t); if (buf.length > MAXMEM) buf.splice(0, buf.length - MAXMEM); bufN++; } catch (e) {} };
  /* (1.88.5) 정범님 10/20 크롬 느림: 오늘 기록 전체(수만 줄)를 탭마다 읽어 메모리에 두던 것 → 기록 창을 처음 열 때만(쉬는 탭·다른 화면 탭은 읽지 않음) */ let jPre = false; const jPrefillOnce = () => { if (jPre) return; jPre = true; setTimeout(() => jPrefill(8), 300); };
  const pcName = () => (window.__rnPcName && window.__rnPcName.get()) || '이 PC';
  window.__rnStatus = window.__rnStatus || {};
  /* (1.43.0) 단계 표시 — 일괄이든 개별 수집이든 '지금 작업 안의 단계'를 차례로 적음 (지난 단계 ✓·걸린 시간, 지금 ▶).
   *  고객 쪽(progress)·상품 쪽(ui)이 단계 이름을 알리면 여기 한 곳에서 쌓음. 기다림·양보·로그인처럼 잠깐 지나가는 상태는 단계로 치지 않고 '잠깐' 글로만 */
  const PH_TMP = /^(다른 PC 작업 중|대기 중|기다리|양보|자동 로그인|네이버로 다시 로그인|알라딘 요청 제한|새 버전으로|시작 못 함|취소|오류로 멈춤|완료|일시정지)|기다리는 중|쉬는 중/;
  window.__rnPhaseReset = (kind, title) => { const S = window.__rnStatus; S.ph = S.ph || {}; S.ph[kind] = { title: title || null, list: [], note: null, start: Date.now() }; };
  window.__rnPhase = (kind, label, key) => { const S = window.__rnStatus; S.ph = S.ph || {}; let P = S.ph[kind]; if (!P || (key !== undefined && P.key !== key)) { window.__rnPhaseReset(kind, null); P = S.ph[kind]; P.key = key; }
    const l = String(label || '').replace(/\s+/g, ' ').trim().slice(0, 60); if (!l) return; if (PH_TMP.test(l)) { P.note = l; return; } P.note = null;
    const last = P.list[P.list.length - 1]; if (last && last.l === l) return; const now = Date.now(); if (last) last.ms = now - last.at;
    P.list.push({ l, at: now }); if (P.list.length > 40) { P.cut = (P.cut || 0) + 1; P.list.shift(); } };
  window.__rnLog = (mod, lv, msg) => { const now = new Date(); const e = { t: now.getTime(), m: mod, l: lv, x: String(msg).slice(0, 600) };
    const last = buf[buf.length - 1]; if (lv === 'detail' && last && last.l === 'detail' && last.m === mod && last.x === e.x) return; // 같은 줄 반복은 생략
    buf.push(e); bufN++; if (buf.length > MAXMEM) buf.splice(0, buf.length - MAXMEM); if (lv !== 'detail') { lt.push(e); if (lt.length > 80) lt.shift(); ltDirty = true; } pend.push(e); idbPend.push(e); dirty = true; };
  // 이 PC 보관 (5초마다), Firebase (1분마다, 10분 단위 문서)
  setInterval(() => { if (pend.length > 5000) pend.splice(0, pend.length - 5000); jflush().catch(() => {}); }, 20000); addEventListener('beforeunload', () => { jflush(); });
  /* (1.59.1) Firebase 기록(rn_logs) 빠짐 막기
   *  ① 올리다 실패한 칸의 줄은 버리지 않고 다음 분에 다시(예전: 실패하면 마지막 3,000줄만 남기고 앞을 버렸고, 한 칸이 계속 실패하면 그 뒤 칸도 모두 막혔음)
   *  ② 칸마다 몇 줄 올렸는지 이 PC에 적어 두고(rnu-log-upled), 30분마다 이 PC 보관 기록(IndexedDB)과 견주어 덜 올라간 칸을 다시 올림 — 같은 줄은 Firebase가 하나로 합치므로(arrayUnion) 두 번 쌓이지 않음
   *  ③ 기록 내려받기(이 PC 비우기) 전에 먼저 모두 올림 */
  const lineOf = (e) => `${new Date(e.t + 9 * 3600e3).toISOString().slice(11, 19)} [${e.m}] ${e.l === 'err' ? '⚠ ' : e.l === 'warn' ? '! ' : e.l === 'detail' ? '· ' : ''}${e.x}`;
  const slotOf = (t) => new Date(t + 9 * 3600e3).toISOString().slice(0, 15).replace(/[-:T]/g, '') + '0';
  const UPK = 'rnu-log-upled'; const upLed = () => { try { return GM_getValue(UPK, {}) || {}; } catch (e) { return {}; } };
  const upLedAdd = (slot, n) => { try { const L = upLed(); L[slot] = (L[slot] || 0) + n; const cut = slotOf(Date.now() - 4 * 864e5); for (const k of Object.keys(L)) if (k < cut) delete L[k]; GM_setValue(UPK, L); } catch (e) {} };
  const upLedSet = (slot, n) => { try { const L = upLed(); L[slot] = Math.max(L[slot] || 0, n); GM_setValue(UPK, L); } catch (e) {} };
  async function putSlot(slot, lines) { for (let i = 0; i < lines.length; i += 400) await firebase.firestore().collection('rn_logs').doc(`${pcName()}_${slot}`).set({ pc: pcName(), slot, lines: firebase.firestore.FieldValue.arrayUnion(...lines.slice(i, i + 400)), at: Date.now() }, { merge: true }); }
  const upOk = () => !!(window.firebase && firebase.apps.length && firebase.auth().currentUser) && !window.__rnLogDenied;
  const upNow = async () => { if (!pend.length || !upOk()) return; const out = pend.splice(0, pend.length);
    const groups = new Map(); out.forEach((e) => { const k = slotOf(e.t); (groups.get(k) || groups.set(k, []).get(k)).push(e); }); const failed = [];
    for (const [slot, es] of groups) { try { await putSlot(slot, es.map(lineOf)); upLedAdd(slot, es.length); } catch (e) { if (/permission/i.test(e.code || e.message)) { window.__rnLogDenied = true; buf.push({ t: Date.now(), m: '기록', l: 'warn', x: 'Firebase에 기록을 못 올림 (규칙에 rn_logs 허용 필요) — 이 PC 안에는 계속 보관합니다' }); return; } failed.push(...es); } }
    if (failed.length) { pend.unshift(...failed); if (pend.length > 30000) pend.splice(0, pend.length - 30000); /* 그래도 넘치면 오래된 것부터 — 이 PC 보관 기록에서 30분마다 다시 채움 */ } };
  let bfAt = 0, bfBusy = false;
  async function backfill(force) { if (bfBusy || !upOk() || (!force && Date.now() - bfAt < 30 * 60000)) return { skip: true }; bfBusy = true; bfAt = Date.now(); let slots = 0, lines = 0, bad = 0;
    try { await jflush(); const L = upLed(); const lim = force ? Date.now() : Date.now() - 15 * 60000; /* 지금 올리는 중인 칸은 빼고 */ const pendN = {}; pend.forEach((e) => { const k = slotOf(e.t); pendN[k] = (pendN[k] || 0) + 1; });
      for (const d of [day(new Date(Date.now() - 864e5)), day(new Date())]) { const rec = await jgetDayX(d); const G = new Map(); ((rec && rec.lines) || []).forEach((e) => { if (e.t > lim) return; const k = slotOf(e.t); (G.get(k) || G.set(k, []).get(k)).push(e); });
        for (const [slot, es] of G) { if (es.length <= (L[slot] || 0) + (pendN[slot] || 0)) continue; try { await putSlot(slot, es.map(lineOf)); upLedSet(slot, es.length); slots++; lines += es.length; } catch (e) { bad++; } } }
      if (slots) window.__rnLog('수집기', 'info', `Firebase 기록 채움: 덜 올라간 10분 칸 ${slots}개를 이 PC 보관 기록으로 다시 올림 (${lines.toLocaleString()}줄 — 이미 있던 줄은 하나로 합쳐짐)`); } catch (e) { bad++; } finally { bfBusy = false; } return { slots, lines, bad }; }
  setInterval(() => backfill().catch(() => {}), 5 * 60000); setTimeout(() => backfill(true).catch(() => {}), 90000);
  window.__rnLogBackfill = backfill;
  window.__rnLogDay = (d) => jgetDayX(d); /* (1.60.0) ⏰ 일마다 걸린 시간 — 예전 기록에서 채울 때 */
  setInterval(upNow, 60000);
  window.__rnFlush = async () => { try { await jflush(); } catch (e) {} try { await upNow(); } catch (e) {} }; // 탭을 닫기 직전 등: 남은 기록을 이 PC(IndexedDB)와 Firebase에 바로 저장
  /* (1.38.0) 탭끼리 나누는 '지금 상태'와 '최근 기록' — 개요 화면은 어느 탭에서 열어도 이 PC 전체(모든 수집기 탭)를 보여 줌
   *  GM 'rnu-live-{탭}' = 그 탭이 지금 하는 일(2초마다) · 'rnu-lt-{탭}' = 그 탭의 중요한 기록 마지막 80줄. 닫힌 탭의 값은 저절로 정리(상태 1분, 기록 12시간) */
  const TAB = window.__rnTab || Math.random().toString(36).slice(2, 8); window.__rnTab = TAB; // (1.56.0) 수집기 탭 고르기(rnRole)와 같은 이름
  const page = location.pathname.split('/').pop();
  const liveNow = () => { const S = window.__rnStatus || {}; let crmBusy = false, crmLabel = null; try { crmBusy = !!(window.__rnCrm && window.__rnCrm.busy()); crmLabel = crmBusy && window.__rnCrm.label ? String(window.__rnCrm.label() || '') : null; } catch (e) {}
    let imgBusy = false; try { imgBusy = !!(window.__rnPrd && window.__rnPrd.imgBusy && window.__rnPrd.imgBusy()); } catch (e) {}
    const slim = (o) => (o && typeof o === 'object' ? JSON.parse(JSON.stringify(o)) : o || null);
    return { tab: TAB, page, role: window.__rnRole ? window.__rnRole() : null, at: Date.now(), busy: !!(S.job || crmBusy || imgBusy), job: S.job || (crmBusy ? '고객·주문: ' + (crmLabel || '수집') : imgBusy ? '이미지 받기' : null), jobKey: S.jobKey || null, jobStart: S.jobStart || null, chain: slim(S.chain), sub: slim(S.sub), ms: slim(S.ms), cur: slim(S.cur), crm: slim(S.crm), ph: slim(S.ph), crmBusy, lastEnd: S.lastEnd || null, stopping: !!(S.job && window.__rnPaused) }; };
  /* (1.88.4) 크롬 느림: 탭마다 2초마다 GM 저장소에 쓰면 Tampermonkey가 그 값을 모든 탭에 다시 알림(탭 수 × 탭 수) → 내용이 바뀌었을 때만, 아니면 20초마다 살아 있음만 */
  let pubLast = '', pubAt = 0, ltAt = 0; const pubLive = () => { try { const lv = liveNow(); const sig = JSON.stringify({ ...lv, at: 0 }); if (sig !== pubLast || Date.now() - pubAt > 20000) { pubLast = sig; pubAt = Date.now(); GM_setValue('rnu-live-' + TAB, lv); }
      if (ltDirty && Date.now() - ltAt > 10000) { ltDirty = false; ltAt = Date.now(); GM_setValue('rnu-lt-' + TAB, lt.slice()); } } catch (e) {} }; /* (1.88.5) 최근 80줄 나눔은 10초에 한 번까지(2초마다 최대 48KB를 모든 탭에 알리던 것) */
  setInterval(pubLive, 2000); setTimeout(pubLive, 300);
  addEventListener('beforeunload', () => { try { GM_deleteValue('rnu-live-' + TAB); } catch (e) {} });
  window.__rnLive = () => { const out = []; try { for (const k of GM_listValues()) { if (!k.startsWith('rnu-live-')) continue; const v = GM_getValue(k, null); if (!v || Date.now() - (v.at || 0) > 60000) { if (!v || Date.now() - (v.at || 0) > 5 * 60000) GM_deleteValue(k); continue; } out.push(v); } } catch (e) { out.push(liveNow()); } return out; };
  window.__rnLogTail = (n) => { let all = []; try { for (const k of GM_listValues()) { if (!k.startsWith('rnu-lt-')) continue; const v = GM_getValue(k, null) || []; const last = v.length ? v[v.length - 1].t : 0; if (Date.now() - last > 12 * 3600e3) { GM_deleteValue(k); continue; } all = all.concat(v); } } catch (e) { all = buf.filter((e) => e.l !== 'detail'); } all.sort((a, b) => a.t - b.t); return all.slice(-(n || 30)); };
  // 크게 보는 기록 창
  const st = document.createElement('style'); st.textContent = `#rn-jw{position:fixed;left:12px;bottom:12px;z-index:2147483646;width:min(760px,calc(100vw - 470px));height:46vh;min-height:180px;background:#fff;border:1px solid #2F5D50;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.18);display:none;flex-direction:column;font:12px/1.5 Consolas,'Malgun Gothic',monospace;resize:both;overflow:hidden}
  #rn-jw.on{display:flex} #rn-jw .h{display:flex;gap:6px;align-items:center;padding:6px 8px;background:#2F5D50;color:#fff;font:600 12.5px system-ui,'Malgun Gothic';cursor:move;user-select:none} #rn-jw .h b{flex:1}
  #rn-jw .h button,#rn-jw .h select,#rn-jw .h input{font:12px system-ui,'Malgun Gothic';border:0;border-radius:5px;padding:3px 7px} #rn-jw .h input{width:120px}
  #rn-jw .b{flex:1;overflow:auto;padding:6px 8px;white-space:pre-wrap;word-break:break-all} #rn-jw .b div{border-bottom:1px solid #F1F3F2} #rn-jw .detail{color:#5B6B66} #rn-jw .info{color:#1E2B27;font-weight:600} #rn-jw .warn{color:#A8661B;font-weight:600} #rn-jw .err{color:#B0322A;font-weight:700} #rn-jw .ok{color:#2F7D4F;font-weight:600}
  #rn-jw .ov{padding:7px 10px;background:#F2F6F4;border-bottom:1px solid #D7E2DD;font:12.5px/1.5 system-ui,'Malgun Gothic'} #rn-jw .ov .ol{margin:1px 0} #rn-jw .ov .ol.now{margin-top:5px} #rn-jw .ov .ol.sub{color:#5B6B66;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #rn-jw .pb{height:9px;background:#DCE5E1;border-radius:5px;overflow:hidden;margin:3px 0} #rn-jw .pb i{display:block;height:100%;border-radius:5px;transition:width .5s}
  #rn-jw .chips{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px} #rn-jw .chip{font-size:11px;padding:1px 6px;border-radius:9px;background:#fff;border:1px solid #D7E2DD;color:#8A9692} #rn-jw .chip.done{background:#E3F1E8;border-color:#9CCBAE;color:#2F7D4F} #rn-jw .chip.now{background:#2F5D50;border-color:#2F5D50;color:#fff;font-weight:700} #rn-jw .chip.off{text-decoration:line-through;opacity:.6} #rn-jw .chip.skip{background:#FFF4E0;color:#A8661B} #rn-jw .chip.fail{background:#FDE8E6;color:#B0322A}
  #rn-jw .jt button{background:#24493F;color:#cfe3da;margin-left:2px} #rn-jw .jt button.on{background:#fff;color:#2F5D50;font-weight:700} #rn-jw details.jd{border-bottom:1px solid #E4ECE8} #rn-jw details.jd > summary{cursor:pointer;padding:4px 2px;font:600 12.5px system-ui,'Malgun Gothic';color:#2F5D50} #rn-jw details.jd > summary small{color:#8A9692;font-weight:400}
  #rn-jw .tm{color:#9AA5A1} #rn-jw .md{display:inline-block;min-width:34px;color:#2F5D50} #rn-jw [data-t]::before{content:attr(data-t) "  " attr(data-m) "  ";color:#7E8C87}`; /* (fix3) 기록 한 줄 앞 시각·칸 이름(요소 아님) */
  // (1.38.0) 진행 요약(지금 무엇을·전체 중 어디까지)을 만드는 곳은 여기 한 곳 — 기록 창 위쪽과 개요 화면이 같이 씀 (다른 탭의 상태로도 그릴 수 있게 상태를 인자로 받음)
  const fm = (ms) => { const m = Math.round(ms / 60000); return m < 60 ? `${m}분` : `${Math.floor(m / 60)}시간 ${m % 60}분`; };
  window.__rnOvHtml = (S, crmBusy) => { S = S || {}; const c = S.chain; const cur = S.cur || {}; const crm = S.crm;
    const bar = (p, col) => `<div class="pb"><i style="width:${Math.max(0, Math.min(100, p * 100)).toFixed(1)}%;background:${col || '#2F5D50'}"></i></div>`;
    const curFrac = (x) => (x && x.total ? Math.min(1, (x.done || 0) / x.total) : 0);
    if (!S.job && !crmBusy) { return `<div class="ol"><b>쉬는 중</b>${S.lastEnd ? ` · 마지막 작업 '${S.lastEnd.name}' ${new Date(S.lastEnd.at).toLocaleTimeString('ko-KR')} 끝 (${fm(S.lastEnd.ms)})` : ''}</div>`; return; }
    let h = `<div class="ol"><b>${S.job || '고객·주문 수집'}</b> · 시작 ${S.jobStart ? new Date(S.jobStart).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }) : '-'} · ${S.jobStart ? fm(Date.now() - S.jobStart) + '째' : ''}</div>`;
    if (c && c.order) { const on = c.order.filter((k) => c.on[k]); const di = on.filter((k) => c.res[k] === 'done' || c.res[k] === 'skip-busy' || c.res[k] === 'partial').length; const isCrmJob = S.job === '고객 전체 일괄 수집'; const inCur = c.cur && c.on[c.cur] ? (c.cur === 'crm' || isCrmJob ? curFrac(crm) : curFrac(cur)) : 0; const all = on.length ? (di + inCur) / on.length : 0;
      h += `<div class="ol">전체 ${di}/${on.length}단계 · ${(all * 100).toFixed(1)}%</div>${bar(all)}<div class="chips">${c.order.map((k, i) => { const st = !c.on[k] ? 'off' : c.res[k] === 'done' ? 'done' : c.res[k] === 'skip-busy' ? 'skip' : c.res[k] === 'fail' ? 'fail' : c.res[k] === 'partial' ? 'skip' : k === c.cur ? 'now' : 'wait';
        return `<span class="chip ${st}" title="${c.labels[k]}${st === 'off' ? ' (끔)' : st === 'skip' ? (c.res[k] === 'partial' ? ' (정한 시간만큼 하고 다음 단계로 — 나머지는 다음 일괄 때 이어서)' : ' (다른 PC가 하는 중이라 건너뜀)') : ''}">${st === 'done' ? '✓' : st === 'now' ? '▶' : st === 'off' ? '–' : st === 'skip' ? '↷' : st === 'fail' ? '✗' : i + 1} ${c.labels[k]}</span>`; }).join('')}</div>`; }
    if (S.ms && Array.isArray(S.ms.items) && S.ms.items.length) { const M = S.ms; const dn = M.items.filter((q) => q.st === 'done').length; const nowI = M.items.find((q) => q.st === 'now'); const fr = (dn + (nowI && cur && cur.total ? curFrac(cur) : 0)) / M.items.length; /* (1.89.54) 정범님 10/24 '중심 수집은 무슨 일이 있어도 마일스톤' — 이번 바퀴 판매자(또는 단계) 하나하나 */
      h += `<div class="ol">${String(M.title || '이번 바퀴').replace(/</g, '&lt;')} · ${dn}/${M.items.length} 끝 · ${(fr * 100).toFixed(1)}%${M.eta ? ` · 남은 약 ${String(M.eta).replace(/</g, '&lt;')}` : ''}</div>${bar(fr, '#D9822B')}<div class="chips">${M.items.map((q, i) => `<span class="chip ${q.st === 'done' ? 'done' : q.st === 'now' ? 'now' : q.st === 'fail' ? 'fail' : q.st === 'skip' ? 'skip' : 'wait'}" title="${String(q.t || q.l).replace(/"/g, '&quot;')}">${q.st === 'done' ? '✓' : q.st === 'now' ? '▶' : q.st === 'fail' ? '✗' : q.st === 'skip' ? '↷' : i + 1} ${String(q.l).replace(/</g, '&lt;')}${q.n ? ` <small>${String(q.n).replace(/</g, '&lt;')}</small>` : ''}</span>`).join('')}</div>`; }
    if (S.sub && S.sub.order) { const sb = S.sub; h += `<div class="chips" style="margin-left:14px"><span style="font-size:11px;color:#5B6B66">고객 세부:</span>${sb.order.map((k) => { const st = sb.res[k] === 'done' ? 'done' : k === sb.cur ? 'now' : 'wait'; return `<span class="chip ${st}">${st === 'done' ? '✓' : st === 'now' ? '▶' : ''} ${sb.labels[k]}</span>`; }).join('')}</div>`; }
    const x = (c && c.cur === 'crm') || (S.job === '고객 전체 일괄 수집') ? crm : cur;
    { const P = (S.ph || {})[x === crm ? 'crm' : 'prd']; if (P && P.list && P.list.length) { const L = P.list.slice(-12); const hid = P.list.length - L.length + (P.cut || 0);
      h += `<div class="chips" style="margin-left:${c && c.order ? 14 : 0}px"><span style="font-size:11px;color:#5B6B66">${c && c.order ? '이 단계 안:' : '단계:'}</span>${hid ? `<span class="chip done" title="앞 단계 ${hid}개">… ${hid}</span>` : ''}${L.map((q, i) => { const isNow = i === L.length - 1;
        return `<span class="chip ${isNow ? 'now' : 'done'}" title="${String(q.l).replace(/"/g, '&quot;')} · ${new Date(q.at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 시작${q.ms != null ? ' · ' + fm(q.ms) + ' 걸림' : ''}">${isNow ? '▶' : '✓'} ${String(q.l).replace(/</g, '&lt;')}${!isNow && q.ms != null && q.ms >= 60000 ? ` <small>${fm(q.ms)}</small>` : ''}</span>`; }).join('')}</div>${P.note ? `<div class="ol sub">잠깐: ${String(P.note).replace(/</g, '&lt;')}</div>` : ''}`; } }
    if (!(x && (x.state || x.label)) && S.job && S.jobStart) h += `<div class="ol now">지금: <b>준비 중</b> · ${fm(Date.now() - S.jobStart)}째 <small>(앞 단계·이어 읽을 자리 찾기 등)</small></div>`;
    if (x && (x.state || x.label)) h += `<div class="ol now">지금: <b>${x.state || x.label}</b>${x.total ? ` · ${(+x.done || 0).toLocaleString()} / ${(+x.total).toLocaleString()} (${(curFrac(x) * 100).toFixed(1)}%)` : ''}${x.etaMin != null ? ` · 남은 시간 약 ${fm(x.etaMin * 60000)} (끝 ${new Date(Date.now() + x.etaMin * 60000).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })})` : ''}</div>${x.total ? bar(curFrac(x), '#3F7FD1') : ''}${x.sub ? `<div class="ol sub">${String(x.sub).replace(/</g, '&lt;')}</div>` : ''}`;
    return h; };
  const mount = () => { globalThis.__rnHead(st); const w = document.createElement('div'); w.id = 'rn-jw';
    w.innerHTML = `<div class="h"><b title="이 띠를 잡고 끌어서 옮김 · 두 번 누르면 처음 자리로 · 오른쪽 아래 모서리로 크기 조절">⠿ 작업 기록 — ${pcName()}</b><span class="jt"><button data-jt="today" class="on" title="오늘(0시부터) 기록 — 새로고침·크롬 다시 켜기 뒤에도 이어서 보임 · 날이 바뀌면 '전체 기록'의 그날 칸으로">오늘 기록</button><button data-jt="hist" title="날짜별로 쌓인 모든 기록 (오늘 포함)">전체 기록</button><button data-jt="pw" title="가격 감시기의 지금 상태와 기록만 따로 (수집기 기록과 섞지 않음 · 이 PC의 감시 탭에서 모아 둠)">🛰 감시</button><button data-jt="pcs" title="다른 PC 수집기의 기록 (각 PC가 1분마다 Firebase에 올린 것 · 1분마다 새로 읽음)">🖥 다른 PC</button></span><select id="rnjF"><option value="imp">중요만</option><option value="all" selected>전체 (항목마다)</option><option value="err">오류·경고만</option></select><input id="rnjQ" placeholder="검색"><label style="font-weight:400"><input type="checkbox" id="rnjA" ${GM_getValue('rnu-log-autoscroll', true) ? 'checked' : ''} title="새 줄이 생기면 맨 아래로 저절로 내려감 — 끄면 올려 둔 자리에 그대로 · 켜고 끈 것은 이 PC에 저장(다음에 열어도 그대로)"> 자동 스크롤</label><button id="rnjD" title="모든 기록(오늘+지난)을 파일로 받고, 이 PC의 기록을 비웁니다">내려받기·비우기</button><button id="rnjX">닫기</button></div><div class="ov" id="rnjO"></div><div class="b" id="rnjB"></div>`;
    globalThis.__rnMount(w); let lastDrawn = -1;
    // 위쪽 초록 띠를 잡고 끌어서 옮김. 위치·크기는 기억 (화면 밖으로 나가지 않게)
    const place = () => { const g = GM_getValue('rnu-jw-geo', null); if (!g) return; const W = Math.min(g.w || 760, innerWidth - 20), H = Math.min(g.h || 360, innerHeight - 20);
      w.style.width = W + 'px'; w.style.height = H + 'px'; w.style.left = Math.max(0, Math.min(g.x, innerWidth - 120)) + 'px'; w.style.top = Math.max(0, Math.min(g.y, innerHeight - 40)) + 'px'; w.style.bottom = 'auto'; };
    const save = () => { const r = w.getBoundingClientRect(); GM_setValue('rnu-jw-geo', { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }); };
    place(); addEventListener('resize', place);
    w.querySelector('.h').addEventListener('mousedown', (ev) => { if (ev.target.closest('button,select,input,label') || ev.button !== 0) return; ev.preventDefault();
      const r = w.getBoundingClientRect(); const dx = ev.clientX - r.left, dy = ev.clientY - r.top; w.style.bottom = 'auto';
      const mv = (e) => { w.style.left = Math.max(0, Math.min(e.clientX - dx, innerWidth - 120)) + 'px'; w.style.top = Math.max(0, Math.min(e.clientY - dy, innerHeight - 40)) + 'px'; };
      const up = () => { removeEventListener('mousemove', mv); removeEventListener('mouseup', up); save(); }; addEventListener('mousemove', mv); addEventListener('mouseup', up); });
    w.addEventListener('mouseup', (ev) => { if (!ev.target.closest('.h')) save(); }); // 오른쪽 아래 모서리로 크기를 바꾼 뒤에도 기억
    w.querySelector('.h').addEventListener('dblclick', (ev) => { if (ev.target.closest('button,select,input,label')) return; GM_setValue('rnu-jw-geo', null); w.removeAttribute('style'); }); // 띠를 두 번 누르면 처음 자리로
    /* (11/12 fix3 · verify3 '리드 탭 화면 요소가 5분마다 약 +160') 기록 한 줄 = 요소 하나 — 예전엔 줄마다 div+시각 span+칸 span 셋이라 800줄 = 2,400개(새 탭은 줄이 차는 동안 5분에 기록 줄 수×3씩 늘었음 · 🖥 다른 PC 3만 줄이면 9만 개)
     *  → 시각·칸 이름은 data-t·data-m 칸에 두고 CSS ::before로 그림(화면 모양은 같음 · 요소가 아님) · 오늘 기록 화면 줄 상한 800 → 400(앞줄은 '전체 기록'·내려받기에 그대로) */
    const rnjA = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    const rowOne = (e) => `<div class="${rnjA(e.l)}" data-t="${rnjA(new Date(e.t).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }))}" data-m="${rnjA(e.m)}">${String(e.x).replace(/&/g, '&amp;').replace(/</g, '&lt;')}</div>`; window.__rnJwRow = rowOne;
    let tab = 'today'; const fmtRow = rowOne;
    const pass = (e) => { const f = w.querySelector('#rnjF').value, q = w.querySelector('#rnjQ').value.trim(); return (f === 'all' || (f === 'imp' ? e.l !== 'detail' : e.l === 'err' || e.l === 'warn')) && (!q || String(e.x).includes(q)); };
    const drawHist = async () => { const b = w.querySelector('#rnjB'); b.innerHTML = '<div class="detail">불러오는 중</div>'; let keys = []; try { await jflush(); keys = (await jdays()).sort().reverse(); } catch (e) {}
      b.innerHTML = keys.map((k) => `<details class="jd" data-day="${k}"><summary>${k}${k === day(new Date()) ? ' (오늘)' : ''} <small>펼쳐서 보기</small></summary><div class="jdb"></div></details>`).join('') || '<div class="detail">쌓인 기록 없음</div>';
      b.querySelectorAll('details.jd').forEach((d) => (d.ontoggle = async () => { if (!d.open) return; const rec = await jgetDayX(d.dataset.day); const L = (rec && rec.lines) || []; const rows = L.filter(pass); d.querySelector('summary small').textContent = `${L.length.toLocaleString()}줄 · 오류 ${L.filter((e) => e.l === 'err').length} · 경고 ${L.filter((e) => e.l === 'warn').length}${rows.length !== L.length ? ` · 거른 결과 ${rows.length.toLocaleString()}줄` : ''}`; d.querySelector('.jdb').innerHTML = rows.slice(-5000).map(fmtRow).join('') || '<div class="detail">없음</div>'; })); };
    w.querySelectorAll('[data-jt]').forEach((bt) => (bt.onclick = () => { tab = bt.dataset.jt; w.querySelectorAll('[data-jt]').forEach((x) => x.classList.toggle('on', x === bt)); lastDrawn = -1; pwDrawn = -1; if (tab === 'hist') drawHist(); else if (tab === 'pw') drawPw(); else if (tab === 'pcs') drawPcs(true); else draw(); drawOv(); }));
    /* (1.88.4) 정범님 10/20 '수집기 때문에 크롬이 매우 느림' — 기록 창이 1초마다 3만 줄을 거르고 3천 줄을 통째로 다시 그렸음(새 줄이 올 때마다) → 같은 거르기·같은 날이면 새 줄만 덧붙이고 3천 줄 넘는 앞줄만 떼어 냄 */
    let dKey = ''; const rowH = rowOne; const JW_MAX = 400; /* (fix3) 오늘 기록 화면 줄 상한 — 근거: 5분 성능 기록(리드 탭 줄 하나당 요소 3개 · 800줄이면 2,400개) · 기록 창 높이 46vh에 보이는 줄은 40줄 안팎 */
    const draw = () => { if (!w.classList.contains('on') || tab !== 'today') return; const f = w.querySelector('#rnjF').value, q = w.querySelector('#rnjQ').value.trim();
      const td = day(new Date()); const ok = (e) => day(new Date(e.t)) === td && (f === 'all' || (f === 'imp' ? e.l !== 'detail' : e.l === 'err' || e.l === 'warn')) && (!q || String(e.x).includes(q)); const b = w.querySelector('#rnjB'); const key = f + '|' + q + '|' + td;
      if (key === dKey && lastDrawn >= 0 && bufN > lastDrawn && bufN - lastDrawn <= buf.length) { const add = buf.slice(buf.length - (bufN - lastDrawn)).filter(ok); if (add.length) { const e0 = b.querySelector(':scope > .detail.rnj0'); if (e0) e0.remove(); b.insertAdjacentHTML('beforeend', add.map(rowH).join('')); let extra = b.childElementCount - JW_MAX; /* (rel10 메모리) 화면 줄 상한 3000 → 800 · (fix3) → 400 — 메모리 기록 MAXMEM은 그대로 */ while (extra-- > 0 && b.firstElementChild) b.firstElementChild.remove(); if (w.querySelector('#rnjA').checked) b.scrollTop = b.scrollHeight; } lastDrawn = bufN; return; }
      const rows = buf.filter(ok).slice(-JW_MAX); b.innerHTML = rows.map(rowH).join('') || '<div class="detail rnj0">기록 없음</div>'; dKey = key;
      if (w.querySelector('#rnjA').checked) b.scrollTop = b.scrollHeight; lastDrawn = bufN; };
      { const ca = w.querySelector('#rnjA'); if (ca && !ca._sv) { ca._sv = 1; ca.addEventListener('change', () => { GM_setValue('rnu-log-autoscroll', ca.checked); if (ca.checked) { const b2 = w.querySelector('#rnjB'); if (b2) b2.scrollTop = b2.scrollHeight; } }); } } /* (1.57.6) 자동 스크롤 켜고 끔을 저장 */
    // ── 맨 위 요약: 지금 무엇을, 전체 중 어디까지 (1초마다)
    const ov = w.querySelector('#rnjO');
    /* (1.43.0) 이 PC 전체에서 지금 하는 일 — 개요와 같은 기준(일하는 탭이 따로 있어도 그 탭의 단계가 보임). 예전엔 기록 창을 연 탭의 상태만 봐서, 다른 탭·자동 수집이 일할 때 단계 표시가 비었음 */
    const drawOv = () => { if (!w.classList.contains('on')) return; if (tab === 'pw') { const h = pwOvHtml(); if (ov.innerHTML !== h) ov.innerHTML = h; return; } if (tab === 'pcs') { const h = pcsOvHtml(); if (ov.innerHTML !== h) ov.innerHTML = h; return; } let lives = []; try { lives = window.__rnLive ? window.__rnLive() : []; } catch (e) {} const mine = lives.find((v) => v.tab === TAB); const busy = lives.filter((v) => v.busy); const main = mine && mine.busy ? mine : busy[0] || null;
      const html = main ? window.__rnOvHtml(main, !!main.crmBusy) + (main.tab !== TAB ? `<div class="ol sub">이 PC의 다른 탭(${main.page === 'worders.aspx' ? '주문조회' : main.page === 'wrecord_edit.aspx' ? '상품 조회' : '판매관리'})에서 진행 중${busy.length > 1 ? ` · 함께 진행 중: ${busy.filter((v) => v !== main).map((v) => String(v.job || '').replace(/</g, '&lt;')).join(', ')}` : ''}</div>` : busy.length > 1 ? `<div class="ol sub">함께 진행 중: ${busy.filter((v) => v !== main).map((v) => String(v.job || '').replace(/</g, '&lt;')).join(', ')}</div>` : '') : window.__rnOvHtml(window.__rnStatus || {}, !!(window.__rnCrm && window.__rnCrm.busy()));
      if (ov.innerHTML !== html) ov.innerHTML = html; };
    /* (1.43.0) 🛰 감시 탭: 가격 감시기(따로 도는 스크립트)의 지금 상태와 기록 — 수집기 기록과 섞지 않고 따로. 감시기가 도는 상품 조회 탭이 모아 두면(GM) 이 PC의 어느 탭에서도 봄 */
    let pwDrawn = -1;
    const pwOvHtml = () => { const st = GM_getValue('rnu-pw-st', null); const e = (x) => String(x || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
      if (!st) return '<div class="ol"><b>가격 감시기 신호 없음</b> — 이 PC에서 가격 감시기가 도는 상품 조회 탭(wrecord_edit)이 열려 있지 않거나, 감시기가 설치되지 않음</div>';
      const age = Date.now() - (st.at || 0); const off = age > 90000;
      return `<div class="ol"><b>${off ? '⚪ 감시기 신호 끊김' : '🛰 가격 감시기'}</b>${st.ver ? ` v${e(st.ver)}` : ''} · ${off ? `${Math.round(age / 60000)}분 전 마지막 신호 (감시 탭이 닫혔거나 멈춤)` : '지금'}</div><div class="ol now">${e(st.state) || '-'}</div>${st.prog ? `<div class="ol sub">${e(st.prog)}</div>` : ''}`; };
    const drawPw = () => { if (!w.classList.contains('on') || tab !== 'pw') return; const L = GM_getValue('rnu-pw-tail', []) || []; const stamp = L.length + ':' + (L.length ? L[L.length - 1].t : 0) + w.querySelector('#rnjF').value + w.querySelector('#rnjQ').value; if (stamp === pwDrawn) return; pwDrawn = stamp;
      const rows = L.filter(pass).slice(-3000); const b = w.querySelector('#rnjB'); b.innerHTML = rows.map(fmtRow).join('') || '<div class="detail">감시 기록 없음 — 가격 감시기가 이 PC에서 돌면 여기에 쌓입니다 (예전 기록은 가격 감시 탭의 기록 받기)</div>';
      if (w.querySelector('#rnjA').checked) b.scrollTop = b.scrollHeight; };
    setInterval(drawPw, 2000);
    /* (1.56.0) 🖥 다른 PC 탭: 다른 PC 수집기의 기록 — 각 PC가 1분마다 rn_logs/{PC}_{10분 칸}에 올린 줄을 읽어 PC별로 보여 줌 (이 PC는 빼고)
     *  기본 최근 3시간 · [하루]로 늘림 · 탭을 보고 있을 때만 1분마다 다시 읽음(안 볼 땐 읽지 않음 → Firebase 읽기 아낌) · 위쪽 칩 = PC마다 마지막 기록 시각·오류 수 */
    let pcsData = null, pcsSel = GM_getValue('rnu-jw-pc', null), pcsHours = 3, pcsAt = 0, pcsBusy = false, pcsErr = null, pcsDrawn = '', pcsLv = null;
    /* (웹앱 10/27 정범님) PC 칩의 '오류 n · 경고 m' = 그 PC가 rn_logs에 올린 줄 중 보는 기간(3시간·하루) 안의 ⚠ 오류(그 일을 끝내지 못함)·! 경고(일은 계속됨) 줄 수
     *  → 그 숫자를 누르면 그 PC의 그 줄만(시각·원문) + 줄마다 💡 풀이 + 같은 뜻끼리 묶은 수 · ✕ 거르기 풀기. 풀이 표는 웹앱 ⚙ 기록의 LOGW와 같은 글(고치면 둘 다) */
    const LOGW = [[/요청이 너무 많다|\(429\)/, '알라딘이 "요청이 너무 많다"고 막음 → 이 PC 수집이 정해진 시간 쉬고 요청 간격을 늘림(저절로 다시 함) · 자주면 설정 ⑨ 동시 PC 수를 줄임'], [/요청 실패|응답 시간 초과|다시 시도|재시도/, '알라딘 응답이 늦거나 끊겨 몇 초 뒤 다시 읽음 — 바로 뒤에 이어서 되면 문제 없음'], [/^\[성능\]|⏱/, '이 PC 크롬 탭이 느렸음(30초 넘는 긴 멈춤이나 메모리 60% 넘음) — 일은 계속 · 자주면 크롬 다시 켜기'],
      [/is not defined|TypeError|ReferenceError|처리되지 않은 오류|^\[오류\]/, '스크립트 오류 — 끝의 (파일)이 wgate.aspx 같은 알라딘 화면이면 알라딘 자체 오류(우리와 무관), readnow-…면 우리 코드(Claude에게 이 줄을 보여 주세요)'], [/로그인 풀림으로 잘못 봄/, '로그인이 풀린 줄 알았는데 아니었음 — 다시 확인하고 그대로 계속(할 일 없음)'], [/네이버/, '네이버 로그인이 안 됨 — 네이버 도서 외부 정보만 못 읽음(그 PC 크롬에서 네이버 로그인)'], [/로그인/, '알라딘·구글 로그인이 풀렸거나 다시 로그인하는 중 — 수집기가 스스로 다시 로그인 · 계속 실패면 로그인 막힘'],
      [/일시정지/, '사람이나 다른 탭이 이 PC 수집을 일시정지함 — 하던 일은 멈춘 자리에서 쉼'], [/메모리 절약으로 내려놓/, '크롬이 메모리를 아끼려 이 탭을 잠재웠다 다시 깨움 — 그동안 이 탭 일은 쉬었음'], [/이 크롬에 수집기 \d+개/, '같은 크롬에 수집기가 여러 개 — 하나만 남겨야 서로 겹치지 않음'], [/permission|권한/i, 'Firebase 규칙이 이 기록을 막음 — 그 칸 기록이 안 남음(Claude에게 이 줄을 보여 주세요)'],
      [/올리기 실패|Firebase/, 'Firebase에 올리다 실패 — 다음 분에 다시 올림(인터넷이 잠깐 끊기면 흔함)'], [/건너뜀|건너뜁/, '이번 회차는 이 일을 건너뜀(다른 일이 진행 중이거나 조건이 안 맞음) — 다음 회차에 다시'], [/다른 작업 진행 중|다른 탭/, '다른 작업이 알라딘을 쓰는 중이라 기다리거나 건너뜀'], [/예스24/, '예스24 읽기·올리기 실패 — 다음 회차에 다시'], [/SKU/, '샵매니저 화면의 SKU 표시용 코드를 못 읽음 — 표시만 빠짐'],
      [/드라이브/, '구글 드라이브 저장이 안 돼 PC 다운로드 폴더에 저장함'], [/점수 계산/, '고객·판매자 점수 계산이 멈추거나 건너뜀 — 다음 수집 때 다시 계산'], [/사진|📷/, '사진 받기·보관 실패 — 다음에 다시 받음'], [/보관본|🪶/, 'PC에 두는 보관본이 너무 커서 줄이거나 건너뜀 — 서버 기록은 그대로'], [/없음:/, '있어야 할 Firebase 문서가 없음'], [/실패/, '그 일이 실패함 — 같은 줄이 되풀이되면 점검 필요']];
    const logWhy = (e) => { const t = `[${e.m}] ${e.x}`; for (const [re, d] of LOGW) if (re.test(t)) return d; return e.l === 'err' ? '그 일을 끝내지 못함(오류) — 같은 줄이 되풀이되면 Claude에게 보여 주세요' : '주의 — 일은 계속됨'; };
    const kslot = (t) => new Date(t + 9 * 3600e3).toISOString().slice(0, 15).replace(/[-:T]/g, '') + '0';
    const pcsLine = (raw, slot) => { const m = String(raw).match(/^(\d{2}):(\d{2}):(\d{2}) \[([^\]]*)\] (⚠ |! |· )?(.*)$/s); if (!m) return { t: 0, m: '', l: 'info', x: String(raw) };
      const y = +slot.slice(0, 4), mo = +slot.slice(4, 6), d = +slot.slice(6, 8); const t = Date.UTC(y, mo - 1, d, +m[1], +m[2], +m[3]) - 9 * 3600e3;
      return { t, m: m[4], l: m[5] === '⚠ ' ? 'err' : m[5] === '! ' ? 'warn' : m[5] === '· ' ? 'detail' : 'info', x: m[6] }; };
    const pcsLoad = async () => { if (pcsBusy) return; if (!window.firebase || !firebase.apps.length || !firebase.auth().currentUser) { pcsErr = 'Firebase에 아직 로그인되지 않았습니다 (잠시 뒤 저절로 다시)'; return; } pcsBusy = true;
      try { const ss = await firebase.firestore().collection('rn_logs').where('slot', '>=', kslot(Date.now() - pcsHours * 3600e3)).get(); const by = {};
        ss.forEach((d) => { const v = d.data() || {}; const pc = v.pc || String(d.id).split('_')[0]; if (!pc || pc === pcName()) return; (by[pc] = by[pc] || []).push(v); });
        const out = {}; Object.entries(by).forEach(([pc, docs]) => { docs.sort((a, b) => String(a.slot).localeCompare(String(b.slot))); const L = []; docs.forEach((v) => (v.lines || []).forEach((r) => L.push(pcsLine(r, String(v.slot))))); L.sort((a, b) => a.t - b.t);
          out[pc] = { lines: L, last: L.length ? L[L.length - 1].t : 0, err: L.filter((e) => e.l === 'err').length, warn: L.filter((e) => e.l === 'warn').length }; });
        pcsData = out; pcsErr = null; pcsAt = Date.now(); if (!pcsSel || !out[pcsSel]) { const ks = Object.keys(out).sort((a, b) => out[b].last - out[a].last); pcsSel = ks[0] || null; } }
      catch (e) { pcsErr = /permission/i.test(e.code || e.message) ? 'Firebase 규칙이 rn_logs 읽기를 막고 있습니다 (웹앱의 기록 보기와 같은 규칙 필요)' : '기록을 못 읽음: ' + (e.code || e.message); }
      finally { pcsBusy = false; } };
    const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? '방금' : m < 60 ? `${m}분 전` : `${Math.floor(m / 60)}시간 ${m % 60}분 전`; };
    const pcsOvHtml = () => { const e = (x) => String(x || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
      if (pcsErr) return `<div class="ol"><b>🖥 다른 PC</b> · <span style="color:#B0322A">${e(pcsErr)}</span></div>`;
      if (!pcsData) return '<div class="ol"><b>🖥 다른 PC</b> · 불러오는 중…</div>';
      const ks = Object.keys(pcsData).sort((a, b) => pcsData[b].last - pcsData[a].last);
      if (!ks.length) return `<div class="ol"><b>🖥 다른 PC</b> · 최근 ${pcsHours}시간 동안 기록을 올린 다른 PC가 없습니다 ${pcsHours < 24 ? '<button data-pch="24" style="margin-left:6px">하루로 늘리기</button>' : ''}</div>`;
      return `<div class="ol"><b>🖥 다른 PC</b> · 최근 ${pcsHours}시간 · ${ago(pcsAt)} 읽음 <button data-pch="${pcsHours < 24 ? 24 : 3}" style="margin-left:6px">${pcsHours < 24 ? '하루로 늘리기' : '3시간만'}</button> <button data-pcr="1">↻ 지금 읽기</button></div><div class="chips">${ks.map((k) => { const x = pcsData[k]; const off = Date.now() - x.last > 15 * 60000;
        return `<span class="chip ${k === pcsSel ? 'now' : off ? '' : 'done'}" data-pc="${e(k)}" style="cursor:pointer" title="마지막 기록 ${x.last ? new Date(x.last).toLocaleString('ko-KR') : '-'} · ${x.lines.length.toLocaleString()}줄">${off ? '⚪' : '🟢'} ${e(k)} · ${x.last ? ago(x.last) : '-'}${x.err ? ` · <u data-pcw="err" data-pcwp="${e(k)}" title="⚠ 오류 줄 ${x.err}개(그 일을 끝내지 못함) — 누르면 이 줄들만 풀이와 함께">오류 ${x.err}</u>` : ''}${x.warn ? ` · <u data-pcw="warn" data-pcwp="${e(k)}" title="! 경고 줄 ${x.warn}개(일은 계속됨 — 다시 시도·쉬기·건너뜀 등) — 누르면 이 줄들만 풀이와 함께">경고 ${x.warn}</u>` : ''}</span>`; }).join('')}</div>${pcsLv && pcsData[pcsSel] ? `<div class="ol sub" style="white-space:normal">🔎 <b>${e(pcsSel)}</b>의 <b>${pcsLv === 'err' ? '⚠ 오류' : '! 경고'}</b> 줄만 보는 중 (최근 ${pcsHours}시간) <button data-pcwx="1" style="margin-left:6px">✕ 거르기 풀기</button></div>` : ''}`; };
    const drawPcs = async (load) => { if (!w.classList.contains('on') || tab !== 'pcs') return; const b = w.querySelector('#rnjB');
      if (load || !pcsData || Date.now() - pcsAt > 60000) { if (!pcsData) b.innerHTML = '<div class="detail">다른 PC의 기록을 불러오는 중…</div>'; await pcsLoad(); drawOv(); }
      if (tab !== 'pcs') return; const x = pcsData && pcsSel ? pcsData[pcsSel] : null;
      const stamp = `${pcsSel}|${pcsAt}|${w.querySelector('#rnjF').value}|${w.querySelector('#rnjQ').value}|${pcsLv}`; if (!load && stamp === pcsDrawn) return; pcsDrawn = stamp;
      if (pcsLv && x) { const q = w.querySelector('#rnjQ').value.trim(); const L = x.lines.filter((e) => e.l === pcsLv && (!q || String(e.x).includes(q))).slice(-5000); const esc2 = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); const G = {}; L.forEach((e) => { const k = logWhy(e); G[k] = (G[k] || 0) + 1; });
        b.innerHTML = L.length ? `<div class="info" style="white-space:normal;background:#F2F6F4;padding:4px 6px;border-radius:6px;margin-bottom:4px">💡 같은 뜻끼리 (${esc2(pcsSel)} · ${L.length.toLocaleString()}줄)${Object.entries(G).sort((p, q2) => q2[1] - p[1]).map(([k, n]) => `<br>· <b>${n.toLocaleString()}</b> — ${esc2(k)}`).join('')}</div>` + L.map((e) => fmtRow(e).replace(/<\/div>$/, `<br><span class="detail" style="padding-left:14px">💡 ${esc2(logWhy(e))}</span></div>`)).join('') : '<div class="detail">이 기간에 그런 줄이 없음</div>';
        if (w.querySelector('#rnjA').checked) b.scrollTop = b.scrollHeight; return; }
      const all0 = x ? x.lines.filter(pass) : []; const rows = all0.slice(-30000); /* (1.77.4) 3,000줄 → 3만 줄 — 로거는 한 시간에 3천 줄 넘게 써서 '다른 PC'에서 1시간치만 보였음(정범님 10/17) */ b.innerHTML = (all0.length > rows.length ? `<div class="detail">앞의 ${(all0.length - rows.length).toLocaleString()}줄은 생략 — 웹앱 ⚙ 기록 → 기록 내려받기로 전부 받을 수 있음</div>` : '') + rows.map(fmtRow).join('') || `<div class="detail">${pcsErr ? '' : x ? '거른 결과 없음' : '고를 PC가 없습니다'}</div>`;
      if (w.querySelector('#rnjA').checked) b.scrollTop = b.scrollHeight; };
    ov.addEventListener('click', (ev) => { if (tab !== 'pcs') return; const c = ev.target.closest('[data-pc]'); const hh = ev.target.closest('[data-pch]'); const rr = ev.target.closest('[data-pcr]'); const wv = ev.target.closest('[data-pcw]'); const wx = ev.target.closest('[data-pcwx]');
      if (wv) { pcsSel = wv.dataset.pcwp; GM_setValue('rnu-jw-pc', pcsSel); pcsLv = wv.dataset.pcw; pcsDrawn = ''; drawOv(); drawPcs(false); return; } if (wx) { pcsLv = null; pcsDrawn = ''; drawOv(); drawPcs(false); return; }
      if (c) { pcsLv = null; pcsSel = c.dataset.pc; GM_setValue('rnu-jw-pc', pcsSel); pcsDrawn = ''; drawOv(); drawPcs(false); }
      else if (hh) { pcsHours = +hh.dataset.pch; pcsData = null; drawOv(); drawPcs(true); } else if (rr) { drawPcs(true); } });
    setInterval(() => { if (tab === 'pcs') drawPcs(false); }, 5000);
    setInterval(drawOv, 1000);
    setInterval(() => { if (bufN !== lastDrawn) draw(); }, 1000); // 진행을 늦추지 않게 1초에 한 번만 그림
    ['#rnjF', '#rnjQ'].forEach((q) => (w.querySelector(q).oninput = () => (tab === 'hist' ? drawHist() : tab === 'pw' ? ((pwDrawn = -1), drawPw()) : tab === 'pcs' ? ((pcsDrawn = ''), drawPcs(false)) : draw()))); w.querySelector('#rnjX').onclick = () => { w.classList.remove('on'); GM_setValue('rnu-jw', 0); };
  // 구글 드라이브로 바로 저장 (설정 ⑨에 Apps Script 주소·열쇠가 있으면). 실패하면 PC로 내려받기
  const driveSave = (name, content) => new Promise((res) => { const url = GM_getValue('rnu-drive-url', ''), key = GM_getValue('rnu-drive-key', ''); if (!url) return res(null);
    GM_xmlhttpRequest({ method: 'POST', url, data: JSON.stringify({ key, name, content }), headers: { 'Content-Type': 'text/plain;charset=utf-8' }, timeout: 120000, onload: (r) => { try { const j = JSON.parse(r.responseText); res(j && j.ok ? j : null); } catch (e) { res(null); } }, onerror: () => res(null), ontimeout: () => res(null) }); });
    w.querySelector('#rnjD').onclick = async () => { // 모든 날짜를 한 파일로 받고, 이 PC의 기록을 비움 (Firebase에 올라간 기록은 그대로)
      if (!confirm('이 PC의 모든 작업 기록(오늘 + 지난 기록)을 파일로 내려받은 뒤, 이 PC에서 비웁니다. 계속할까요?')) return;
      await jflush(); try { await upNow(); } catch (e) {} const bfr = await backfill(true).catch(() => ({ bad: 1 })); if ((bfr && bfr.bad) || pend.length) { if (!confirm(`Firebase에 아직 못 올린 기록이 있습니다(${pend.length.toLocaleString()}줄${bfr && bfr.bad ? ' · 못 올린 칸 ' + bfr.bad + '개' : ''}). 그래도 이 PC 기록을 비울까요?\n(내려받는 파일에는 모두 들어 있음 · 취소하면 비우지 않음 — 인터넷이 되면 저절로 올라감)`)) return; } /* (1.59.1) 비우기 전에 Firebase에 모두 올림 */ const keys = (await jdays()).sort(); const parts = []; for (const k of keys) { const rec = await jgetDayX(k); (rec ? rec.lines : []).forEach((e) => parts.push(`${new Date(e.t).toLocaleString('ko-KR')} [${e.m}] [${e.l}] ${e.x}`)); }
      const fname = `리드나우-수집기록-${pcName()}-${keys[0] || day(new Date())}~${keys[keys.length - 1] || day(new Date())}.txt`; const drv = await driveSave(fname, parts.join('\n'));
      if (drv) { window.__rnLog('수집기', 'ok', `작업 기록을 구글 드라이브 '리드나우 수집기록' 폴더에 저장했습니다: ${fname}${drv.url ? ' · ' + drv.url : ''}`); if (drv.url) window.open(drv.url, '_blank'); }
      else { window.__rnLog('수집기', 'warn', GM_getValue('rnu-drive-url', '') ? '구글 드라이브 저장 실패 (주소·열쇠·배포 권한 확인) — PC의 다운로드 폴더로 내려받습니다' : '구글 드라이브 주소가 설정되지 않아 PC의 다운로드 폴더로 내려받습니다 (웹앱 설정 ⑨)'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([parts.join('\n')], { type: 'text/plain' })); a.download = fname; a.click(); }
      setTimeout(async () => { await jclear(); buf.length = 0; idbPend.length = 0; window.__rnLog('수집기', 'info', `작업 기록을 내려받고 이 PC의 기록을 비웠습니다 (${keys.length}일치, ${parts.length.toLocaleString()}줄)`); lastDrawn = -1; tab === 'hist' ? drawHist() : draw(); }, 1500); };
    window.__rnJournalToggle = () => { const on = !w.classList.contains('on'); w.classList.toggle('on', on); if (on) jPrefillOnce(); GM_setValue('rnu-jw', on ? 1 : 0); lastDrawn = -1; draw(); drawOv(); try { window.__rnJwSync && window.__rnJwSync(); } catch (e) {} };
    window.__rnJournalOpen = () => w.classList.contains('on'); /* (1.89.154) 머리줄 🗒 단추가 이 창(큰 기록창)을 열고 닫음 — 단추 색이 창 상태를 따름 */
    (window.__rnRoleReady || Promise.resolve()).then(() => { const r = window.__rnRole ? window.__rnRole() : 'lead'; if (r === 'lead' && !w.classList.contains('on')) window.__rnJournalToggle(); /* (1.88.5) 정범님 10/20: 기록 창은 이 PC의 '일하는 수집기 탭'(lead)에서만 저절로 열림 — 쉬는 탭·등록·주문 팝업 같은 다른 화면 탭에서는 열지 않음(사람이 [기록]을 누르면 열림) · 쉬는 탭이 일하는 탭을 이어받으면 그때 열림 */ try { window.__rnRoleOn && window.__rnRoleOn((r2) => { if (r2 === 'lead' && !w.classList.contains('on')) window.__rnJournalToggle(); }); } catch (e) {} /* (1.88.4) 정범님 10/20: 모든 PC — 수집기가 다시 열리면(일하는 탭) 기록 창을 늘 연 채로 시작 · 닫아도 다음에 열리면 다시 열림 */ /* (1.74.4) 로거는 크롬이 열리고 수집기가 돌면 기록 창을 늘 연 채로 시작 */ }); }; // (1.56.0) 쉬는 탭은 기록 창을 닫은 채로 (기억해 둔 '열림'은 그대로 둠)
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  /* (1.43.0) 가격 감시기 기록 모으기: 감시기 칸(#rn-prc)이 이 화면에 있으면 그 기록 줄·상태를 이 수집기의 GM에 모아 둠(최근 400줄) → 기록 창 🛰 감시 탭.
   *  감시기 코드는 바꾸지 않음(화면에 쓰는 글을 그대로 옮김). Firebase에는 다시 올리지 않음 — 감시기가 이미 rn_logs에 올림(중복 없게) */
  (function pwMirror() { let tail = null, dirty = false, seen = null;
    const ingest = (nodes) => { tail = tail || GM_getValue('rnu-pw-tail', []) || []; seen = seen || new Set(tail.slice(-300).map((e) => e.raw));
      for (const n of nodes) { const raw = String(n.textContent || '').trim(); if (!raw || seen.has(raw)) continue; seen.add(raw); const x = raw.replace(/^\d{2}:\d{2}:\d{2} \[가격 감시\] /, '');
        const bad = /B0322A|rgb\(176, 50, 42\)/i.test((n.getAttribute && n.getAttribute('style')) || '') || /^⚠/.test(x); tail.push({ t: Date.now(), m: '감시', l: bad ? 'err' : 'info', x, raw }); }
      if (tail.length > 400) tail.splice(0, tail.length - 400); if (seen.size > 1000) seen = new Set(tail.map((e) => e.raw)); dirty = true; };
    const attach = () => { const lg = document.getElementById('pw_log'); if (!lg) return false; ingest([...lg.children].reverse());
      new MutationObserver((ms) => { const add = []; ms.forEach((m) => m.addedNodes.forEach((x) => add.push(x))); if (add.length) ingest(add.reverse()); }).observe(lg, { childList: true });
      let pwSig = '', pwAt = 0; /* (1.88.4) 바뀔 때만 · 아니면 20초마다 */ setInterval(() => { try { const vm = ((globalThis.__rnQ('#rn-prc .hd small') || {}).textContent || '').match(/v([\d.]+)/); const st0 = { state: ((document.getElementById('pw_state') || {}).textContent || '').trim().slice(0, 300), prog: ((document.getElementById('pw_prog') || {}).textContent || '').trim().slice(0, 300) }; const sg = JSON.stringify(st0); if (sg !== pwSig || Date.now() - pwAt > 20000) { pwSig = sg; pwAt = Date.now(); GM_setValue('rnu-pw-st', { at: Date.now(), state: ((document.getElementById('pw_state') || {}).textContent || '').trim().slice(0, 300), prog: ((document.getElementById('pw_prog') || {}).textContent || '').trim().slice(0, 300), ver: vm ? vm[1] : null, tab: TAB }); }
        if (dirty) { dirty = false; GM_setValue('rnu-pw-tail', tail); } } catch (e) {} }, 2000); return true; };
    if (!attach()) { let n = 0; const t = setInterval(() => { if (attach() || ++n > 60) clearInterval(t); }, 1000); } })();
  /* (1.52.0) 'Script error. (:0)' = 다른 주소에서 온 알라딘 화면 자체 스크립트(광고·통계 등)의 오류 — 브라우저가 내용을 가려 보내 우리가 고칠 것이 없음 → 기록 창을 덮지 않게 빼고 하루 몇 번 나왔는지만 셈 */
  window.addEventListener('error', (ev) => { if (/^Script error\.?$/i.test(String(ev.message || '').trim()) && !ev.filename) { window.__rnXerr = (window.__rnXerr || 0) + 1; return; }
    /* (10/29 점검 제안 10/26·27·28 — 4번) 알라딘 화면 자체 스크립트 오류(우리 코드 아님 · 기록으로 확인된 것만: wgate.aspx 'mySwiper is not defined' · 판매관리 'searchText is not defined')는 오류 집계에서 빼고 정보로 — 점검이 진짜 오류를 가리게. 우리가 화면에 넣는 코드(alert 가로채기·shopInPage 등)의 오류는 그대로 오류 */
    if (/(^|ReferenceError: )(mySwiper|searchText) is not defined$/.test(String(ev.message || '').trim()) && /aladin\.co\.kr/.test(String(ev.filename || location.href))) { window.__rnAlErr = (window.__rnAlErr || 0) + 1; window.__rnLog('수집기', 'info', `알라딘 화면 자체 오류(우리 코드 아님 · 오류 집계에서 뺌): ${ev.message} (${(ev.filename || '').split('/').pop()}:${ev.lineno})`); return; }
    window.__rnLog('오류', 'err', `${ev.message} (${(ev.filename || '').split('/').pop()}:${ev.lineno})`); });
  window.addEventListener('unhandledrejection', (ev) => { const r = ev.reason; const st = r && r.stack ? String(r.stack).split('\n').slice(1, 5).map((x) => x.trim().replace(/https?:\/\/[^\s)]*\/([^/\s)]+)/g, '$1')).join(' ← ') : ''; window.__rnLog('오류', 'err', `처리되지 않은 오류: ${r && r.message ? r.message : r}${st ? ' · 어디서: ' + st.slice(0, 300) : ''} · ${location.pathname}`); }); /* (1.89.39) 3시간 점검 10/23 'Maximum call stack' — 어느 함수인지 남김(파일·줄) */
  window.__rnLog('수집기', 'info', `탭 열림 · ${location.pathname.split('/').pop()}`);
  try { if (document.wasDiscarded) window.__rnLog('수집기', 'warn', '⚠ 크롬이 이 탭을 메모리 절약으로 내려놓았다가 다시 열었음 — 그동안 수집이 멈춰 있었음. 크롬 설정 → 성능 → 메모리 절약 → \'항상 활성 상태로 유지할 사이트\'에 aladin.co.kr 추가'); } catch (e) {} /* (1.77.3) HOME 탭이 22:24~23:23 소리 없이 멈춘 일 — 까닭을 기록에 남김 */
})();
/* ═════════════ (정범님 11/04) 🛰 출고 맡긴 일 단계 기록 — '지금 어떤 것이 실행되고 있는지 세부적으로 · 문제가 생겼을 때 빨리 파악' ═════════════
 *  맡긴 일 문서(shp_cmds/{id} · shp_invoices/{id})에 단계마다 한 줄 → log(최근 N줄 · {at 시각 · lv ok/info/warn/err · m 한 줄 · by PC · o 주문번호 · inv 송장 · res 결과 · why 까닭}) + stepNow(지금 하는 일 한 줄)
 *  같은 줄을 이 PC 수집기 기록 창(__rnLog '출고')에도 남김 · Firestore 쓰기는 한 줄마다가 아니라 묶어서(기본 1.5초 · 근거: 없음, 설정 app_settings/main.stepLog {ms, keep}로 바꿈)
 *  손님 이름·전화·주소는 줄에 넣지 않음(주문번호·송장번호만) · 웹앱 오늘 출고 '🛰 지금 실행 중'이 실시간으로 그리고, 진단(q.shplog)으로 Claude가 읽음 */
(function rnStepLog() {
  if (window.__rnStep) return;
  const CF = { ms: 1500, keep: 100, at: 0 }; const J = new Map();
  const cfg = () => { if (Date.now() - CF.at < 3600e3) return; CF.at = Date.now(); try { if (!(window.firebase && firebase.apps.length && firebase.auth().currentUser)) { CF.at = 0; return; } firebase.firestore().collection('app_settings').doc('main').get().then((d) => { const s = ((d.exists && d.data()) || {}).stepLog || {}; if (+s.ms >= 300 && +s.ms <= 10000) CF.ms = +s.ms; if (+s.keep >= 20 && +s.keep <= 300) CF.keep = Math.round(+s.keep); }).catch(() => {}); } catch (e) {} };
  const pcN = () => { try { return (window.__rnPcName && window.__rnPcName.get()) || 'PC'; } catch (e) { return 'PC'; } };
  const clip = (x, n) => (x == null || x === '' ? undefined : String(x).slice(0, n));
  const flush = async (k) => { const j = J.get(k); if (!j) return; clearTimeout(j.t); j.t = null; if (!j.dirty) return; j.dirty = false; j.log = j.log.slice(-CF.keep);
    try { await j.ref.set({ log: j.log, stepNow: j.now, uploadedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }); } catch (e) { j.dirty = true; if (!j.t) j.t = setTimeout(() => flush(k), CF.ms * 4); } };
  /* 쓰는 법: const st = window.__rnStep(ref, v.log, '송장 입력'); st('info', '화면 엶', { o: 주문번호, inv: 송장 }); await st.flush(); — 화면을 옮기기(새로 열기·입력완료) 직전에는 꼭 flush */
  window.__rnStep = (ref, seed, mod) => { cfg(); const k = ref.path; let j = J.get(k);
    if (!j) { j = { ref, log: Array.isArray(seed) ? seed.slice(-CF.keep) : [], now: null, t: null, dirty: false }; J.set(k, j); if (J.size > 30) { const k0 = J.keys().next().value; if (k0 !== k) { flush(k0); J.delete(k0); } } }
    const f = (lv, m, x) => { x = x || {}; const at = new Date().toISOString(); const e = { at, lv: ['ok', 'info', 'warn', 'err'].includes(lv) ? lv : 'info', m: String(m || '').slice(0, 300), by: pcN() };
      for (const [kk, n] of [['o', 40], ['inv', 40], ['res', 40], ['why', 200]]) { const vv = clip(x[kk], n); if (vv !== undefined) e[kk] = vv; }
      j.log.push(e); if (j.log.length > CF.keep * 2) j.log = j.log.slice(-CF.keep); j.now = { at, lv: e.lv, m: e.m, by: e.by, ...(x.big ? { big: 1 } : {}) }; j.dirty = true;
      try { window.__rnLog && window.__rnLog(mod || '출고', e.lv === 'err' ? 'err' : e.lv === 'warn' ? 'warn' : 'info', `🛰 ${e.m}${e.o ? ' · 주문 ' + e.o : ''}${e.inv ? ' · 송장 ' + e.inv : ''}${e.res ? ' · ' + e.res : ''}${e.why ? ' · 까닭: ' + e.why : ''}`); } catch (er) {}
      if (!j.t) j.t = setTimeout(() => flush(k), CF.ms); return e; };
    f.flush = () => flush(k); return f; };
  window.__rnStep.flushAll = () => Promise.all([...J.keys()].map(flush)); window.__rnStep.cfg = CF;
  window.addEventListener('beforeunload', () => { try { window.__rnStep.flushAll(); } catch (e) {} });
})();
/* (10/30 정범님) 🧰 판매자 툴팁 스크립트(우리 것이 아닌 다른 Tampermonkey 스크립트)의 화면 왼쪽 아래 단추 — 🔄 판매자 전체 갱신 · 멈춤 · 데이터 다운로드 · 마지막 갱신 표시 — 를 작은 아이콘 하나로 접고 폄 · 기본은 접힘 · 이 PC에 기억(GM 'rnu-rh-open')
 *  그 스크립트 소스는 고치지 않음 — 우리 수집기가 같은 화면에서 그 단추들(id rh-…)만 숨김/보임으로 · 단추가 화면에 없으면 아이콘도 안 보임 */
(function rnRhFold() { if (window.top !== window) return; const IDS = ['rh-bulk-refresh-btn', 'rh-bulk-pause-btn', 'rh-download-btn', 'rh-last-refresh-label'];
  let open = false; try { open = !!GM_getValue('rnu-rh-open', 0); } catch (e) {}
  const st = document.createElement('style'); st.id = 'rn-rh-fold-st'; const css = () => (open ? '' : IDS.map((i) => '#' + i).join(',') + '{display:none !important}'); st.textContent = css();
  const ico = document.createElement('button'); ico.id = 'rn-rh-ico'; ico.type = 'button'; ico.style.cssText = 'position:fixed;left:16px;bottom:16px;z-index:2147483647;width:30px;height:30px;border-radius:50%;border:0;background:rgba(34,34,34,.55);color:#fff;font:15px/30px system-ui;cursor:pointer;padding:0;display:none;box-shadow:0 2px 6px rgba(0,0,0,.25)';
  const look = () => { ico.textContent = open ? '✕' : '🧰'; ico.title = open ? '판매자 툴팁 단추 접기' : '판매자 툴팁 단추 펴기 (판매자 전체 갱신 · 데이터 다운로드)'; ico.style.left = open ? '420px' : '16px'; };
  ico.onclick = (e) => { e.preventDefault(); e.stopPropagation(); open = !open; try { GM_setValue('rnu-rh-open', open ? 1 : 0); } catch (x) {} st.textContent = css(); look(); };
  const has = () => IDS.some((i) => document.getElementById(i));
  const tick = () => { if (!document.head || !document.body) return; if (!st.isConnected) document.head.appendChild(st); const h = has(); if (h && !ico.isConnected) { look(); document.body.appendChild(ico); } ico.style.display = h ? 'block' : 'none'; };
  tick(); let n = 0; const t = setInterval(() => { tick(); if (++n > 40) { clearInterval(t); setInterval(tick, 15000); } }, 1500); /* 그 스크립트가 늦게 단추를 붙여도 잡음 · 60초 뒤엔 찾았든 못 찾았든 15초마다만(1.89.158 🔬 정밀 점검 — 단추가 없는 화면에서 1.5초 타이머가 영원히 돌던 것) */
  try { GM_addValueChangeListener('rnu-rh-open', (k, o, v, remote) => { if (!remote) return; open = !!v; st.textContent = css(); look(); }); } catch (e) {} })();
/* ═════════════ 통합 관제판 (1.38.0) ═════════════
 * 예전: 오른쪽 위에 [▶ 모두][고객·주문][상품·매입][기록][–] 탭만 있고, 일시정지·이어하기·최근 기록이 패널마다 따로 있었음
 *       (상품 패널의 '최근 기록'은 상품 것만, 일시정지는 누른 탭에서만, 이어하기는 맨 앞 하나만, '▶ 모두'는 무엇을 하는지 안 보임)
 * 이제: 한 판(관제판)에 ① 머리줄 — 지금 상태(쉬는 중/작업 중/멈추는 중/일시정지)를 접어도 항상 보임
 *       ② 개요 탭 — 지금 하는 일과 전체 진행, 주 버튼 하나(일시정지 ↔ 다시 시작) + 전체 수집, 멈춘 작업 목록(작업마다 이어하기·버리기),
 *          다음 자동 수집, 이 PC 모든 탭의 최근 기록, 다른 PC·판 상태
 *       ③ 고객·주문 / 상품·매입 / 가격 감시 탭 — 개별 수집과 설정 (예전 패널을 그대로 이 판 안에 넣음)
 *       ④ 기록 — 크게 보는 기록 창
 * 근거: 큰 회사의 수집·배치 도구(Airflow·Jenkins·Datadog 같은)는 '한 곳에서 상태를 보고 한 버튼으로 멈추는' 관제판 하나를 두고,
 *       멈춘 작업(대기열)을 목록으로 보여 주며, 기록은 모든 작업을 한 줄기로 모음. 자주 쓰는 것만 앞에, 자세한 것은 탭 안에 (점진적 공개) */
(function rnCtl() {
  if (!globalThis.__rnPubHome && (window.top !== window || !/\/scm\/(worders|worder_preparatory_complete|wrecord_edit)\.aspx/i.test(location.pathname))) return;
  const VER = ((typeof globalThis !== 'undefined' && globalThis.__RN_FILE_VER) || (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version)) || '?';
  const G = '#2F5D50', AMB = '#A8661B', RED = '#B0322A', BLU = '#3F7FD1';
  const st = document.createElement('style');
  st.textContent = `#rn-ctl{position:fixed;top:8px;right:12px;z-index:2147483647;width:420px;max-height:calc(100vh - 16px);display:flex;flex-direction:column;background:#fff;border:1px solid #CFDAD5;border-radius:12px;box-shadow:0 10px 32px rgba(20,40,34,.18);font:13px/1.45 system-ui,'Malgun Gothic',sans-serif;color:#1E2B27;overflow:hidden}
  #rn-ctl .ch{display:flex;align-items:center;gap:8px;padding:9px 12px;background:${G};color:#fff;cursor:pointer;user-select:none}
  #rn-ctl .ch b{font-size:13.5px} #rn-ctl .ch small{opacity:.75;font-size:11px} #rn-ctl .ch .sp{flex:1}
  #rn-ctl .ch .bdg{font:700 11.5px system-ui,'Malgun Gothic';padding:3px 9px;border-radius:10px;background:#fff;color:${G};white-space:nowrap;max-width:190px;overflow:hidden;text-overflow:ellipsis}
  #rn-ctl .ch .bdg.busy{background:#DCEBFF;color:#1F4F96} #rn-ctl .ch .bdg.pause{background:#FFE7C2;color:#7A4A10} #rn-ctl .ch .bdg.stop{background:#FFE7C2;color:#7A4A10;animation:rnblink 1s infinite}
  @keyframes rnblink{50%{opacity:.55}}
  #rn-ctl .ch .tg{border:0;background:rgba(255,255,255,.18);color:#fff;border-radius:6px;width:26px;height:22px;cursor:pointer;font-weight:700}
  #rn-ctl.min #rn-uni,#rn-ctl.min .cb{display:none}
  #rn-ctl .ch .tg.on{background:#fff;color:${G}} #rn-ctl.lead{width:484px}
  /* (1.89.154 정범님 10/30 · 11/02 바꿈) 계기판 — 어두운 판 · 노란 고정폭 글자 · 줄마다 [시각 | 작업 | 지금 하는 것 | 상태] (11/02 정범님: '출발 안내'·비행기 같은 농담은 빼고 모양만) */
  #rn-ctl .dash{background:#0E1217;color:#F5C518;font:12px/1.35 Consolas,'D2Coding','Malgun Gothic',monospace;padding:6px 8px 7px;border-bottom:2px solid #000} #rn-ctl .dash[hidden]{display:none}
  #rn-ctl .dash .fh{display:flex;align-items:center;gap:6px;color:#9FB0BF;font:700 10.5px/1.2 system-ui,'Malgun Gothic';letter-spacing:.08em;margin-bottom:4px} #rn-ctl .dash .fh .sp{flex:1} #rn-ctl .dash .fh .ck{color:#F5C518;font:700 12px Consolas,monospace;letter-spacing:.05em}
  #rn-ctl .dash table{width:100%;border-collapse:separate;border-spacing:0 2px;table-layout:fixed} #rn-ctl .dash th{color:#7D8B98;font:600 10px system-ui,'Malgun Gothic';text-align:left;padding:0 4px;letter-spacing:.06em}
  #rn-ctl .dash td{background:#161C23;color:#F5C518;padding:3px 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;vertical-align:top} #rn-ctl .dash td:first-child{border-radius:3px 0 0 3px;color:#fff;width:42px} #rn-ctl .dash td:last-child{border-radius:0 3px 3px 0;text-align:right;width:54px}
  #rn-ctl .dash td.jb{width:31%;font-weight:700} #rn-ctl .dash td .s2{display:block;color:#C9D3DC;font-size:11px;white-space:normal;overflow:hidden;max-height:2.7em} #rn-ctl .dash .pb2{height:4px;background:#2A333D;border-radius:2px;margin-top:2px;overflow:hidden} #rn-ctl .dash .pb2 i{display:block;height:100%;background:#3DDC84}
  #rn-ctl .dash .st{font:800 10.5px system-ui,'Malgun Gothic';letter-spacing:.04em} #rn-ctl .dash .st.go{color:#3DDC84;animation:rnBlink 1.4s steps(2,start) infinite} #rn-ctl .dash .st.wt{color:#F5C518} #rn-ctl .dash .st.bd{color:#5BC0FF} #rn-ctl .dash .st.dn{color:#7D8B98} #rn-ctl .dash .st.dl{color:#FF5A4F}
  #rn-ctl .dash tr.now td{background:#1B2A22} #rn-ctl .dash tr.now td.jb{white-space:normal} #rn-ctl .dash tr.old td{color:#7D8B98} @keyframes rnBlink{to{visibility:hidden}}
  #rn-ctl .dash .dhb{display:flex;align-items:center;gap:5px;width:100%;margin-top:5px;padding:3px 6px;background:transparent;border:0;border-top:1px dashed #3A4652;color:#9FB0BF;font:700 11px system-ui,'Malgun Gothic';cursor:pointer;text-align:left;letter-spacing:.03em} #rn-ctl .dash .dhb small{color:#7D8B98;font-weight:600} #rn-ctl .dash .dhb:hover{color:#F5C518} #rn-ctl .dash .dhb .rl{display:inline-block;color:#F5C518;font-size:12px;line-height:1} #rn-ctl .dash .dhb:hover .rl{animation:rnReel .9s linear infinite reverse} #rn-ctl .dash .dhb.on .rl{animation:rnReel 2.4s linear infinite} @keyframes rnReel{to{transform:rotate(360deg)}} #rn-ctl .dash .dhl{max-height:220px;overflow:auto;margin-top:3px;border-left:2px solid #2A333D;padding-left:6px} #rn-ctl .dash .dhs{color:#C9D3DC;font:11px/1.4 system-ui,'Malgun Gothic';margin:4px 0 2px} #rn-ctl .dash .dhs b{color:#F5C518} #rn-ctl .dash .dhr{display:grid;grid-template-columns:42px 1fr auto;gap:6px;color:#9FB0BF;font-size:11px;padding:1px 0} #rn-ctl .dash .dhr span:nth-child(2){color:#F5C518;overflow:hidden;text-overflow:ellipsis;white-space:nowrap} #rn-ctl .dash .dhm{grid-template-columns:1fr;color:#7D8B98} #rn-ctl.lead .dash{font-size:13px;padding:8px 10px 9px} #rn-ctl.lead .dash td .s2{font-size:12px;max-height:6.8em} #rn-ctl.lead .dash td.jb{width:29%} #rn-ctl .dash tr.old td{color:#7D8B98}
  #rn-ctl .rsub.mini{padding:3px 10px;font-size:10.5px;justify-content:flex-end;gap:6px} #rn-ctl .rsub.mini .tx{flex:0 1 auto;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:78%} #rn-ctl .rsub.mini small{display:none} #rn-ctl .rsub.mini button{padding:2px 6px;font-size:10.5px}
  #rn-ov.nolog .lgcard{display:none}
  #rn-ctl .rsub{display:flex;align-items:center;gap:8px;padding:6px 12px;background:#EEF4F1;color:#3F524C;border-bottom:1px solid #DCE6E1;font-size:12px;line-height:1.4} #rn-ctl .rsub[hidden]{display:none} #rn-ctl .rsub .tx{flex:1;min-width:0} #rn-ctl .rsub small{display:block;color:#6B7A75;font-size:11px}
  #rn-ctl .rsub.follow{background:#C62828;color:#fff;border-bottom-color:#8E1B1B;font-weight:700} #rn-ctl .rsub.follow small{color:#FFE3E0} #rn-ctl .rsub.follow button{background:#fff;color:#C62828;border-color:#fff} /* (1.89.156 정범님 10/30) 'ⓘ 이 PC에서는 이미 수집기가 일하는 중'은 빨간 바탕·흰 글자 */ #rn-ctl .rsub.force{background:#FFF6E6;color:#7A4A10;border-bottom-color:#F0DDBA} #rn-ctl .rsub.force small{color:#8A6A3A} #rn-ctl .rsub.lead{background:#F4F8F6;color:#5B6B66} #rn-ctl .rsub.new{background:#E6F3EA;color:#2F7D4F}
  #rn-ctl .rsub button{flex:none;padding:4px 9px;border-radius:6px;border:1px solid #9DB5AC;background:#fff;color:#2F5D50;font:600 11.5px system-ui,'Malgun Gothic';cursor:pointer} #rn-ctl .rsub.force button{border-color:#D9B57A;color:#7A4A10}
  #rn-uni{display:flex;gap:0;border-bottom:1px solid #E1E8E5;background:#F6F9F8;padding:0 6px}
  #rn-uni button{flex:1;padding:8px 4px 7px;border:0;border-bottom:3px solid transparent;background:transparent;color:#4C5E58;cursor:pointer;font:600 12.5px system-ui,'Malgun Gothic'}
  #rn-uni button.on{color:${G};border-bottom-color:${G}} #rn-uni button:hover{color:${G}} #rn-uni small{font-weight:400;opacity:.8}
  #rn-uni .dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-left:4px;vertical-align:1px;background:#bbb}
  #rn-ctl .cb{overflow:auto;flex:1;min-height:0}
  #rn-ctl #rn-crm,#rn-ctl #rnp,#rn-ctl #rn-prc{position:static !important;top:auto !important;right:auto !important;left:auto !important;width:auto !important;max-height:none !important;box-shadow:none !important;border:0 !important;border-radius:0 !important;overflow:visible !important;z-index:auto !important;margin:0 !important}
  #rn-ctl #rn-crm>.hd,#rn-ctl #rnp>.hd,#rn-ctl #rn-prc>.hd{display:none !important}
  #rn-ctl #rn-crm.min .bd,#rn-ctl #rnp.min .bd{display:block !important}
  #rn-ctl #rn-crm>.bd,#rn-ctl #rnp>.bd{padding-top:8px}
  #rn-ctl #rn-crm .ctl,#rn-ctl #rnp #rnpCtlStop,#rn-ctl #rnp #rnpCtlResume{display:none !important}
  #rn-ctl #rnp .rnp-oldlog,#rn-ctl #rnp #rnpLog,#rn-ctl #rnp .fb .pcs{display:none !important}
  #rn-ctl:not([data-rnu="ov"]) #rn-ov{display:none !important} #rn-ctl:not([data-rnu="prd"]) #rnp{display:none !important} #rn-ctl:not([data-rnu="crm"]) #rn-crm{display:none !important} #rn-ctl:not([data-rnu="prc"]) #rn-prc{display:none !important}
  #rn-ov{padding:10px 12px 12px}
  #rn-ov .card{border:1px solid #E1E8E5;border-radius:10px;padding:9px 11px;margin-bottom:9px}
  #rn-ov .card.now{border-left:5px solid #9AA5A1} #rn-ov .card.now.busy{border-left-color:${BLU}} #rn-ov .card.now.pause,#rn-ov .card.now.stop{border-left-color:${AMB};background:#FFFBF3}
  #rn-ov .k{font-size:11.5px;color:#5B6B66;font-weight:700;letter-spacing:.02em;margin:0 0 5px;display:flex;align-items:center;gap:6px} #rn-ov .k .sp{flex:1} #rn-ov .k a{font-weight:400;color:${G}}
  #rn-ov .big{font-size:15px;font-weight:700} #rn-ov .mut{color:#5B6B66;font-size:12px}
  #rn-ov .ol{margin:1px 0} #rn-ov .ol.now{margin-top:5px} #rn-ov .ol.sub{color:#5B6B66;font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #rn-ov .pb{height:8px;background:#DCE5E1;border-radius:5px;overflow:hidden;margin:3px 0} #rn-ov .pb i{display:block;height:100%;border-radius:5px;transition:width .5s}
  #rn-ov .chips{display:flex;flex-wrap:wrap;gap:3px;margin-top:4px} #rn-ov .chip{font-size:11px;padding:1px 6px;border-radius:9px;background:#fff;border:1px solid #D7E2DD;color:#8A9692} #rn-ov .chip.done{background:#E3F1E8;border-color:#9CCBAE;color:#2F7D4F} #rn-ov .chip.now{background:${G};border-color:${G};color:#fff;font-weight:700} #rn-ov .chip.off{text-decoration:line-through;opacity:.6} #rn-ov .chip.skip{background:#FFF4E0;color:${AMB}} #rn-ov .chip.fail{background:#FDE8E6;color:${RED}}
  #rn-ov .acts{display:flex;gap:6px;margin-bottom:9px}
  #rn-ov details.feat>summary{cursor:pointer;list-style:none} #rn-ov details.feat>summary small{font-weight:400;color:#5B6B66;margin-left:4px} #rn-ov .fr{display:block;padding:3px 0;border-top:1px dashed #E3E9E6;font-size:12px;cursor:pointer} #rn-ov .fr small{display:block;color:#6B7A75;font-size:11px;margin-left:20px} #rn-ov .fr.main{background:#F4F8FD;padding:5px 4px;border-radius:6px;border:0;margin:4px 0} #rn-ov .fr .fw{font-size:10px;color:#1F5FAF;border:1px solid #C9D6E8;border-radius:8px;padding:0 5px;margin-left:4px} #rn-ov .fbar{display:flex;gap:5px;align-items:center;margin:6px 0 2px;font-size:12px} #rn-ov .fbar b{flex:1} #rn-ov .fbar button{font-size:11px;padding:2px 7px;border:1px solid #C9D6E8;background:#fff;border-radius:6px;cursor:pointer}
  #rn-feat-toast{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2147483647;background:#1F2A26;color:#fff;padding:8px 14px;border-radius:8px;font:600 12.5px/1.4 system-ui,'Malgun Gothic',sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.25)}
  #rn-ov .acts button{flex:1;padding:9px 8px;border-radius:9px;font:700 13px system-ui,'Malgun Gothic';cursor:pointer;line-height:1.25}
  #rn-ov .acts button small{display:block;font:400 11px system-ui,'Malgun Gothic';opacity:.85;margin-top:2px}
  #rn-ov .b-pause{background:#fff;color:${AMB};border:1.5px solid ${AMB}} #rn-ov .b-go{background:${G};color:#fff;border:1.5px solid ${G}} #rn-ov .b-all{background:#fff;color:${G};border:1.5px solid ${G}}
  #rn-ov .acts button:disabled{opacity:.45;cursor:default}
  #rn-ov .rs{display:flex;align-items:center;gap:6px;padding:5px 0;border-top:1px solid #F0F3F2} #rn-ov .rs:first-of-type{border-top:0}
  #rn-ov .rs .t{flex:1;min-width:0} #rn-ov .rs .t b{display:block;font-size:12.5px} #rn-ov .rs .t small{display:block;color:#5B6B66;font-size:11px}
  #rn-ov .rs button{padding:4px 8px;border-radius:6px;font:600 11.5px system-ui,'Malgun Gothic';cursor:pointer;background:#fff;border:1px solid ${G};color:${G}} #rn-ov .rs button.x{border-color:#D9A9A4;color:${RED}} #rn-ov .rs button:disabled{opacity:.4;cursor:default}
  #rn-ov .rs .on{font-size:11px;color:${BLU};font-weight:700}
  #rn-ov .lg{font:11.5px/1.5 Consolas,'Malgun Gothic',monospace;max-height:160px;overflow:auto} #rn-ov .lg div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis} #rn-ov .lg .tm{color:#9AA5A1} #rn-ov .lg .md{color:${G}} #rn-ov .lg .warn{color:${AMB}} #rn-ov .lg .err{color:${RED};font-weight:700} #rn-ov .lg .ok{color:#2F7D4F}
  #rn-ov .pc{font-size:11.5px;color:#5B6B66;margin:2px 0} #rn-ov .pc.busy{color:${RED}}`;
  globalThis.__rnHead(st);
  const box = document.createElement('div'); box.id = 'rn-ctl';
  const pc = () => (window.__rnPcName && window.__rnPcName.get()) || '이 PC';
  box.innerHTML = `<div class="ch" title="눌러서 접기·펼치기"><b>리드나우 수집기</b><small id="rnCtlWho"></small><span class="sp"></span><span class="bdg" id="rnCtlBadge">준비 중</span><button class="tg" id="rnCtlLog" title="최근 기록 칸 열기·닫기 (본체 탭은 처음에 열림 · 쉬는 탭은 처음에 닫힘)">🗒</button><button class="tg" id="rnCtlMin" title="접기·펼치기">–</button><button class="tg" id="rnCtlIco" title="작게(오른쪽 아래 아이콘으로) — 아이콘을 누르면 다시">▁</button></div>
    <div class="dash" id="rnCtlDash" hidden></div>
    <div class="rsub" id="rnCtlSub" hidden></div>
    <div id="rn-uni"><button data-t="ov">개요</button><button data-t="crm">고객·주문</button><button data-t="prd">상품·매입</button><button data-log="1" title="작업 기록 크게 보기 (이 PC의 모든 기록 · 날짜별 · 검색 · 내려받기)">기록</button></div>
    <div class="cb"><div id="rn-ov"></div></div>`;
  const bar = box.querySelector('#rn-uni'); const body = box.querySelector('.cb'); const ov = box.querySelector('#rn-ov');
  const set = (t) => { if (t === 'hide') t = 'ov'; box.dataset.rnu = t; /* (1.70.0) 알라딘 화면의 body에 표시를 남기지 않음 — 수집기 칸에만 */ GM_setValue('rnu-tab', t); bar.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.t === t)); draw(); };
  /* (1.89.154 정범님 10/30 '기록 단추가 작동하지 않아') 🗒 = 큰 기록창(아래 [기록]과 같은 창) 열기·닫기 — 1.89.151은 개요 화면의 작은 '최근 기록' 칸만 숨겨, 다른 화면(상품·매입 등)에서는 눌러도 아무것도 안 바뀌었음 · 창 상태는 기록창 쪽이 기억(본체 탭은 열린 채로 시작 · 쉬는 탭은 닫힌 채로) */
  { const b = box.querySelector('#rnCtlLog'); b.addEventListener('pointerdown', (e) => e.stopPropagation()); b.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); if (window.__rnJournalToggle) window.__rnJournalToggle(); else { try { window.__rnLog && window.__rnLog('수집기', 'warn', '🗒 기록창이 아직 준비되지 않음 — 잠시 뒤 다시'); } catch (x) {} } setTimeout(() => window.__rnJwSync && window.__rnJwSync(), 0); }); }
  const setMin = (on, keep) => { box.classList.toggle('min', on); if (!keep) GM_setValue('rnu-ctl-min', on ? 1 : 0); box.querySelector('#rnCtlMin').textContent = on ? '+' : '–'; };
  /* (1.89.19) 정범님 10/21: 머리 칸을 끌어 원하는 곳으로 옮기고 그 자리를 이 PC에 기억 — 일하는 수집기(활성)와 쉬는 수집기(비활성) 자리를 따로 · ▁ 단추 = 오른쪽 아래 반투명 아이콘으로(누르면 다시) · 아이콘은 오른쪽 아래에 다른 것이 있으면 그 위로 */
  const roleK = () => (window.__rnRest && window.__rnRest() ? 'rest' : 'act'); let posRole = null, dragMoved = false;
  const clampPos = (p) => { const w = box.offsetWidth || 420, h = Math.min(box.offsetHeight || 60, 60); return { left: Math.max(0, Math.min(window.innerWidth - Math.min(w, 120), p.left)), top: Math.max(0, Math.min(window.innerHeight - h, p.top)) }; };
  const posApply = (force) => { const k = roleK(); if (!force && k === posRole) return; posRole = k; const p = GM_getValue('rnu-pos-' + k, null); if (p && p.left != null) { const q = clampPos(p); box.style.left = q.left + 'px'; box.style.top = q.top + 'px'; box.style.right = 'auto'; } else { box.style.left = ''; box.style.top = ''; box.style.right = ''; } icoApply(); };
  const posSave = () => { const r = box.getBoundingClientRect(); GM_setValue('rnu-pos-' + roleK(), { left: Math.round(r.left), top: Math.round(r.top), at: Date.now() }); try { window.__rnLog && window.__rnLog('수집기', 'detail', `📌 수집기 자리 저장(${roleK() === 'act' ? '일하는 수집기' : '쉬는 수집기'})`); } catch (e) {} };
  { const ch = box.querySelector('.ch'); let sx = 0, sy = 0, bl = 0, bt = 0, on = false;
    ch.addEventListener('pointerdown', (e) => { if (e.button !== 0 || e.target.closest('button')) return; const r = box.getBoundingClientRect(); sx = e.clientX; sy = e.clientY; bl = r.left; bt = r.top; on = true; dragMoved = false; try { ch.setPointerCapture(e.pointerId); } catch (er) {} });
    ch.addEventListener('pointermove', (e) => { if (!on) return; const dx = e.clientX - sx, dy = e.clientY - sy; if (!dragMoved && Math.abs(dx) + Math.abs(dy) < 6) return; dragMoved = true; const q = clampPos({ left: bl + dx, top: bt + dy }); box.style.left = q.left + 'px'; box.style.top = q.top + 'px'; box.style.right = 'auto'; ch.style.cursor = 'grabbing'; });
    ch.addEventListener('pointerup', () => { if (!on) return; on = false; ch.style.cursor = ''; if (dragMoved) posSave(); });
    ch.addEventListener('dblclick', (e) => { if (e.target.closest('button')) return; GM_setValue('rnu-pos-' + roleK(), null); posApply(true); }); ch.title = '눌러서 접기·펼치기 · 끌어서 옮기기(자리 기억 — 일하는/쉬는 수집기 따로) · 두 번 누르면 원래 자리'; }
  box.querySelector('.ch').addEventListener('click', (e) => { if (dragMoved) { dragMoved = false; return; } if (e.target.closest('#rnCtlIco')) return; setMin(!box.classList.contains('min')); });
  /* ▁ 아이콘으로 작게 */
  const ico = document.createElement('div'); ico.id = 'rn-ctl-ico'; ico.title = '리드나우 수집기 — 누르면 다시 펼침'; ico.textContent = 'RN'; ico.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:2147483646;width:38px;height:38px;border-radius:50%;background:rgba(47,93,80,.55);color:#fff;font:800 13px/38px system-ui,Malgun Gothic,sans-serif;text-align:center;cursor:pointer;box-shadow:0 3px 10px rgba(0,0,0,.25);display:none;user-select:none';
  const icoK = () => 'rnu-ico-' + roleK(); const icoPlace = () => { if (ico.style.display === 'none') return; let bottom = 14; const seen = new Set(); for (let y = window.innerHeight - 20; y > window.innerHeight - 320; y -= 24) for (const x of [window.innerWidth - 24, window.innerWidth - 60]) { let L = []; try { L = document.elementsFromPoint(x, y); } catch (e) {} for (const el of L) { if (el === ico || el === document.body || el === document.documentElement || box.contains(el) || seen.has(el)) continue; seen.add(el); let f = el; for (let d = 0; f && d < 4 && f !== document.body; d++, f = f.parentElement) { if (getComputedStyle(f).position === 'fixed') { const r = f.getBoundingClientRect(); if (r.height < window.innerHeight * 0.6) bottom = Math.max(bottom, window.innerHeight - r.top + 8); break; } } } } ico.style.bottom = Math.min(bottom, window.innerHeight - 50) + 'px'; }; /* 오른쪽 아래 몇 점만 살펴 고정된 것(알림·칩 등)이 있으면 그 위로 — 화면 전체를 훑지 않음 */
  const icoApply = () => { const on = !!GM_getValue(icoK(), 0); box.style.display = on ? 'none' : ''; ico.style.display = on ? 'block' : 'none'; icoPlace(); };
  ico.onclick = () => { GM_setValue(icoK(), 0); icoApply(); }; box.querySelector('#rnCtlIco').onclick = (e) => { e.stopPropagation(); GM_setValue(icoK(), 1); icoApply(); };
  setInterval(() => { posApply(false); icoPlace(); }, 2000); window.addEventListener('resize', () => posApply(true));
  bar.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.log) { window.__rnJournalToggle && window.__rnJournalToggle(); return; } if (b.dataset.t) set(b.dataset.t); });
  // 예전 패널(고객·상품·가격 감시)을 이 판 안으로 옮김 — 패널 안의 단추·기능은 그대로
  const adopt = () => { ['rn-crm', 'rnp', 'rn-prc'].forEach((id) => { const el = globalThis.__rnById(id); if (el && el.parentElement !== body) body.appendChild(el); }); };
  const esc = (x) => String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const hm = (t) => new Date(t).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  const md = (t) => new Date(t).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  let crmRes = null; const pollCrm = async () => { try { crmRes = window.__rnCrm && window.__rnCrm.resumableInfo ? await window.__rnCrm.resumableInfo() : null; } catch (e) { crmRes = null; } };
  setInterval(pollCrm, 10000); setTimeout(pollCrm, 3000);
  const stateOf = () => { const lives = window.__rnLive ? window.__rnLive() : []; const mine = lives.find((v) => v.tab === window.__rnTab); const busy = lives.filter((v) => v.busy); const main = (mine && mine.busy) ? mine : busy[0] || null;
    const paused = !!window.__rnPaused; const kind = paused && busy.length ? 'stop' : paused ? 'pause' : busy.length ? 'busy' : 'idle';
    return { lives, busy, main, mine, paused, kind, last: lives.map((v) => v.lastEnd).filter(Boolean).sort((a, b) => b.at - a.at)[0] || null }; };
  /* (1.89.68) 정범님 10/25 20:23 'HOME에서 중단 → 시작만 눌렀는데 집중 벤치마킹이 시작됨': 예전 '▶ 다시 시작'은 멈춘 작업 목록에서 '가장 최근에 저장된 것'을 이어갔는데, 그 목록에 로거가 읽는 중인 벤치마킹 판매자 자리(쪽마다 저장 → 늘 가장 최근)가 섞여 있어 HOME이 로거의 벤치마킹을 이어받았음
   *  → '다시 시작' = 일시정지를 풀고, 멈출 때 이 PC가 하던 일만 그 자리부터(없으면 풀기만 — 그다음은 ⏰ 차례대로) · 로그인 PC의 멈춘 작업 목록에는 다른 PC의 공개 일(벤치마킹 등) 자리를 보이지 않음(로거 몫 — 버리면 로거가 처음부터 다시 읽음) */
  const resTarget = (R) => { const pi = window.__rnPauseInfo ? window.__rnPauseInfo() : null; const ks = new Set((pi && pi.keys) || []); if (!ks.size) return null; return R.filter((r) => !r.running && (ks.has(r.key) || (ks.has('bench') && /^bench_/.test(r.key)) || (r.mod === 'crm' && [...ks].some((k) => /crm/i.test(k)))) && (!r.by || r.by === pc())).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0))[0] || null; };
  const resList = () => { const P = window.__rnPrd; const out = []; const rk = P && P.runningKeys ? P.runningKeys() : new Set();
    if (crmRes) out.push({ mod: 'crm', key: crmRes.key, name: crmRes.name, meta: `이 PC에 저장된 자리${crmRes.savedAt ? ' · ' + md(crmRes.savedAt) + ' 멈춤' : ''}${crmRes.why ? ' · ' + crmRes.why : ''}`, savedAt: crmRes.savedAt || 0, running: false });
    ((P && P.resumables && P.resumables()) || []).filter((r) => globalThis.__rnPubHome || !(window.__rnIsPubKey && window.__rnIsPubKey(r.key) && r.by && r.by !== pc())).forEach((r) => out.push({ mod: 'prd', key: r.key, name: r.name, by: r.by || null, meta: [r.stage ? `단계: ${r.stage}` : '', r.prog, r.by ? `${r.by}에서 ${md(r.savedAt)} ${/^bench_\d+$/.test(r.key) && rk.has('bench') && Date.now() - (r.savedAt || 0) < 5 * 60000 ? '읽는 중(마지막 적음)' : '멈춤'}` : r.savedAt ? md(r.savedAt) + ' 멈춤' : ''].filter(Boolean).join(' · '), savedAt: r.savedAt || 0, running: rk.has(r.key) || (/^bench_\d+$/.test(r.key) && rk.has('bench') && Date.now() - (r.savedAt || 0) < 5 * 60000) /* (1.63.3) 벤치마킹 판매자: 어느 PC가 벤치마킹을 하는 중이고 이 판매자 자리가 5분 안에 적혔으면 = 지금 읽는 중(예전엔 '멈춤'으로 보여 이어하기·버리기를 눌러도 '진행 중'이라며 안 됐음) */ }));
    return out; };
  // 머리줄 배지: 접어도 보임
  const badge = (S) => { const b = box.querySelector('#rnCtlBadge'); const m = S.main;
    const txt = S.kind === 'stop' ? '■ 멈추는 중…' : S.kind === 'pause' ? '■ 일시정지됨' : S.kind === 'busy' ? `▶ ${m && m.job ? m.job : '작업 중'}` : '쉬는 중';
    b.textContent = txt; b.title = txt; b.className = 'bdg ' + ({ stop: 'stop', pause: 'pause', busy: 'busy', idle: '' })[S.kind];
    box.querySelector('#rnCtlWho').textContent = `${pc()} · v${VER}`; };
  /* (1.76.1) 🧩 한 크롬에 수집기가 두 개 깔렸는지 — 정범님 10/16: '수집기는 이미 업데이트했는데 샵매니저에 빨간 경고창(본체 1.70.2 · 모듈 1.72.0)이 계속 뜸'
   *  까닭: Tampermonkey에 예전에 붙여 넣은 옛 수집기(다른 이름·사본)가 함께 켜져 있으면 그 옛 것이 자기 판과 모듈 판이 다르다고 경고를 띄움(새 것은 멀쩡) · 옛 것은 고칠 수 없으니 새 것이 알아채 안내
   *  방법: 화면에 '리드나우 수집기' 머리 칸(#rn-ctl)이 둘 이상이고 판이 다르면 → 옛 것의 빨간 경고를 이 안내로 바꿈(지우는 단계까지) · 같은 판 둘이면 '같은 것 두 개' 안내 */
  const dupChk = () => { try { if (globalThis.__rnSR) return; const L = [...document.querySelectorAll('#rn-ctl')]; if (L.length < 2) return; const vs = L.map((b) => { const t = (b.querySelector('#rnCtlWho') || {}).textContent || ''; const m = t.match(/v(\d+\.\d+\.\d+)/); return m ? m[1] : '?'; }); const old = [...new Set(vs.filter((v) => v !== VER))];
      const key = vs.slice().sort().join(','); if (window.__rnDupShown === key) return; window.__rnDupShown = key;
      document.querySelectorAll('div').forEach((d) => { if (d !== box && /모듈 판이 맞지 않음/.test(d.textContent || '') && d.style && d.style.position === 'fixed' && (d.textContent || '').length < 900) d.style.display = 'none'; });
      const n = document.createElement('div'); n.style.cssText = 'position:fixed;right:10px;bottom:52px;z-index:2147483646;max-width:min(420px,92vw);background:#7A3E00;color:#fff;padding:8px 12px;border-radius:8px;font:600 12px/1.55 system-ui,Malgun Gothic,sans-serif;box-shadow:0 3px 10px rgba(0,0,0,.25)';
      n.innerHTML = `🧩 이 크롬에 리드나우 수집기가 <b>${L.length}개</b> 켜져 있습니다 (${vs.map((v) => 'v' + v).join(' · ')}) — 빨간 경고는 ${old.length ? '옛 것(v' + old.join(', v') + ')' : '같은 것 하나'}가 띄운 것이고, 새 판 v${VER}은 정상입니다.<br>지우는 법: ① 크롬 오른쪽 위 Tampermonkey 아이콘 → <b>대시보드</b> ② '리드나우 수집기'가 여러 줄이면 <b>판(버전) 칸이 ${old.length ? old.join('·') : '같은'}인 줄</b>의 휴지통(삭제) 누름 — <b>v${VER} 줄은 남김</b> ③ 이 화면 새로고침 → 오른쪽 위 수집기 칸이 하나(v${VER})만 보이면 끝<br><button style="margin-top:4px;padding:2px 8px;border-radius:5px;border:0;cursor:pointer">닫기</button>`;
      n.querySelector('button').onclick = () => n.remove(); document.body.appendChild(n); window.__rnLog && window.__rnLog('수집기', 'warn', `🧩 이 크롬에 수집기 ${L.length}개(${vs.join(', ')}) — 옛 것을 Tampermonkey에서 지워야 함`); } catch (e) {} };
  setTimeout(dupChk, 8000); setTimeout(dupChk, 45000);
  /* (1.56.0) 머리줄 아래 옅은 띠: 이 탭이 이 PC의 수집기인지, 쉬는 탭인지 (머리줄은 이름·판·상태로 이미 꽉 차서 따로) */
  const sub = box.querySelector('#rnCtlSub'); let subHtml = null, promotedAt = 0;
  const drawSub = (S) => { const r = window.__rnRole ? window.__rnRole() : 'lead'; const pn = window.__rnPageName || ((x) => x); let cls = '', h = '';
    if (r === 'wait') { h = '<div class="tx">이 PC의 수집기 탭을 확인하는 중…</div>'; }
    else if (r === 'follow') { cls = 'follow'; const v = window.__rnLead ? window.__rnLead() : null; const lv = v && S.lives.find((x) => x.tab === v.tab);
      h = `<div class="tx">ⓘ 이 PC에서는 이미 수집기가 일하는 중 — <b>${v ? esc(pn(v.page)) : '다른'} 탭</b>${lv ? (lv.busy ? ` · ▶ ${esc(lv.job || '작업 중')}` : ' · 쉬는 중') : ''}<small>이 탭은 쉬는 상태입니다 (저절로 시작하는 작업 없음 · 보기와 일시정지는 됨). 그 탭을 닫으면 이 탭이 이어받습니다.</small></div><button data-r="force" title="한 PC에 수집기 둘 — 누르면 단점을 먼저 알려 드립니다">이 탭도 켜기…</button>`; }
    else if (r === 'force') { h = `<div class="tx">⚠ 이 탭도 수집기로 켜 둠 — 이 PC에 수집기 2개<small>매일 자동·웹앱 요청·맡긴 일은 원래 탭이 맡고, 이 탭은 직접 누른 작업만 합니다. 알라딘 요청 제한에 더 빨리 걸릴 수 있어요.</small></div><button data-r="rest">다시 쉬게 하기</button>`; cls = 'force'; }
    else if (r === 'lead') { const others = S.lives.filter((x) => x.tab !== window.__rnTab && (x.role === 'follow' || x.role === 'force'));
      if (promotedAt && Date.now() - promotedAt < 60000) { h = '<div class="tx">✓ 앞서 일하던 수집기 탭이 닫혀, 이 탭이 이 PC의 수집기를 이어받았습니다</div>'; cls = 'new'; }
      else if (others.length) { const f = others.filter((x) => x.role === 'force').length; h = `<div class="tx">이 탭이 이 PC의 수집기 · 다른 수집기 화면 ${others.length}개${f ? ` (그중 ${f}개는 사람이 켜 둠)` : '는 쉬는 중'}</div>`; cls = 'lead'; } }
    if (r === 'lead' && cls !== 'new') h = ''; /* (10/30 정범님) 본체 탭은 설명 없이 계기판으로 */ if (h && r !== 'lead') { const full = h.replace(/<button[\s\S]*$/, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); h = h.replace('<div class="tx">', `<div class="tx" title="${esc(full)}">`); cls += ' mini'; } /* 쉬는 탭: 작은 한 줄로 오른쪽에(전체 글은 마우스를 올리면) */
    const k = cls + h; if (k === subHtml) return; subHtml = k; sub.className = 'rsub ' + cls; sub.hidden = !h; sub.innerHTML = h; };
  /* (10/30 정범님) 머리줄 아래 계기판 — 지금 무슨 작업을 하는지 늘 보임 · 본체(이 PC의 수집기 탭)는 자세히·크게, 쉬는 탭은 한 줄 · 🗒 = 개요의 최근 기록 칸 열기·닫기(본체 기본 열림 · 쉬는 탭 기본 닫힘 · 탭 종류마다 기억) */
  const dash = box.querySelector('#rnCtlDash'); let dashHtml = null; const isLead = () => (window.__rnRole ? window.__rnRole() : 'lead') === 'lead';
  const applyLog = () => { const on = !!(window.__rnJournalOpen && window.__rnJournalOpen()); const b = box.querySelector('#rnCtlLog'); if (b) { b.classList.toggle('on', on); b.title = on ? '🗒 기록창 닫기' : '🗒 기록창 열기 (본체 탭은 열린 채로 시작 · 쉬는 탭은 닫힌 채로)'; } }; window.__rnJwSync = applyLog;
  /* (1.89.154 정범님 10/30 '쉬는 중 같은 간단한 상태만이 아니라 지금 당장 하고 있는 구체적 업무의 요약을' · 11/02 농담 표현 빼고 모양만)
   *  줄 = [시각 | 작업 | 지금 하는 것(단계·이번 바퀴 항목·처리 중 항목·n/전체·남은 시간) | 상태]
   *  ① 진행 중(이 PC의 모든 수집기 탭 — 깜빡이는 초록 '진행') ② 일시정지·멈추는 중(빨강 '멈춤') ③ 다음 자동 일(⏰ 일정표 — 10분 안이면 파랑 '곧 시작', 아니면 노랑 '대기') ④ 마지막에 끝난 일(회색 '완료')
   *  본체(이 PC의 수집기 탭)는 다음 일 5개·자세한 둘째 줄, 쉬는 탭은 진행 1줄 + 다음 1줄 */
  const tHM = (t) => { const d = new Date(typeof t === 'number' ? t : Date.parse(t)); return isNaN(d) ? '--:--' : d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false }); };
  const nowOf = (m) => { const P = []; const c = m.chain; const cur = m.cur || {}; const crm = m.crm || {};
    if (c && c.order && c.cur) { const on = c.order.filter((k) => c.on[k]); P.push(`단계 ${Math.max(1, on.indexOf(c.cur) + 1)}/${on.length} ${c.labels[c.cur] || c.cur}`); }
    if (m.ms && Array.isArray(m.ms.items) && m.ms.items.length) { const it = m.ms.items.find((q) => q.st === 'now'); const dn = m.ms.items.filter((q) => q.st === 'done').length; P.push(`${m.ms.title || '이번 바퀴'} ${dn}/${m.ms.items.length}${it ? ` · ▶ ${it.l}${it.n ? ' ' + it.n : ''}` : ''}`); }
    if (m.sub && m.sub.order && m.sub.cur) P.push(`세부: ${m.sub.labels[m.sub.cur] || m.sub.cur}`); else if (m.sub && (m.sub.label || m.sub.name)) P.push(String(m.sub.label || m.sub.name));
    const x = cur.total ? cur : crm.total ? crm : null; if (x) P.push(`${(x.done || 0).toLocaleString()}/${x.total.toLocaleString()}${x.state ? ' ' + x.state : ''}`); else if (cur.state) P.push(String(cur.state));
    if (cur.sub) P.push(`지금: ${cur.sub}`); if (cur.etaMin != null) P.push(`남은 약 ${cur.etaMin < 60 ? cur.etaMin + '분' : Math.floor(cur.etaMin / 60) + '시간 ' + (cur.etaMin % 60) + '분'}`);
    const fr = x && x.total ? Math.min(1, (x.done || 0) / x.total) : null; return { txt: P.filter(Boolean).join(' · '), fr }; };
  /* (정범님 11/02) ◎◎ 되감기 — 계기판 아래 단추를 누르면 펼쳐져 이 PC가 끝낸 일의 요약 기록(날마다 건수·일한 시간 합·가장 오래 걸린 일 + 끝난 일 줄)을 더 봄 · 다시 누르면 감아 둠
   *  기록 = 이 PC 수집기 탭들의 '마지막에 끝난 일'(lastEnd)을 본체 탭이 볼 때마다 이 PC 저장소(GM 'rnu-dashhist')에 덧붙임 · 최근 80건 · 서버로 보내지 않음(읽기·쓰기 0) · 펼침 여부도 이 PC에 기억 */
  const DH_K = 'rnu-dashhist'; let dhOpen = (() => { try { return !!GM_getValue('rnu-dashhist-open', false); } catch (e) { return false; } })();
  const dhGet = () => { try { const v = GM_getValue(DH_K, []); return Array.isArray(v) ? v : []; } catch (e) { return []; } };
  let dhSeen = ''; const dhRec = (lives) => { const E = (lives || []).map((v) => v.lastEnd).filter((x) => x && x.at && x.name); const sig = E.map((x) => x.at + x.name).join('|'); if (!E.length || sig === dhSeen) return; dhSeen = sig; const L = dhGet(); let add = 0;
    for (const x of E) if (!L.some((y) => y.at === x.at && y.name === x.name)) { L.push({ name: String(x.name).slice(0, 60), at: x.at, ms: Math.max(0, +x.ms || 0) }); add++; } if (!add) return; L.sort((a, b) => a.at - b.at); while (L.length > 80) L.shift(); try { GM_setValue(DH_K, L); } catch (e) {} };
  const dhDur = (ms) => { const m = Math.round((ms || 0) / 60000); return m < 1 ? '1분 안' : m < 60 ? m + '분' : Math.floor(m / 60) + '시간' + (m % 60 ? ' ' + (m % 60) + '분' : ''); };
  const dhDay = (t) => { const d = new Date(t); return `${d.getMonth() + 1}/${d.getDate()}`; };
  const dhHtml = (lead) => { const L = dhGet(); const today = dhDay(Date.now()); const nT = L.filter((x) => dhDay(x.at) === today).length;
    const btn = `<button type="button" class="dhb${dhOpen ? ' on' : ''}" data-dh="1" title="${dhOpen ? '펼친 기록을 감아 둠' : '이 PC가 끝낸 일을 되감아 봄 — 날마다 건수·일한 시간·가장 오래 걸린 일'}"><span class="rl">◎</span><span class="rl">◎</span> ${dhOpen ? '다시 감아 두기' : `지난 일 되감기${L.length ? ` <small>오늘 ${nT}건${L.length > nT ? ` · 모두 ${L.length}건` : ''}</small>` : ' <small>아직 감긴 테이프 없음</small>'}`}</button>`;
    if (!dhOpen) return lead || L.length ? btn : ''; if (!L.length) return btn + '<div class="dhl"><div class="dhs">끝난 일이 생기면 여기에 차곡차곡 감깁니다.</div></div>';
    const G = new Map(); for (const x of L.slice().reverse()) { const k = dhDay(x.at); (G.get(k) || G.set(k, []).get(k)).push(x); }
    const days = [...G.entries()].slice(0, 4).map(([k, a]) => { const tot = a.reduce((s, x) => s + x.ms, 0); const top = a.slice().sort((p, q) => q.ms - p.ms)[0]; const cnt = new Map(); a.forEach((x) => cnt.set(x.name, (cnt.get(x.name) || 0) + 1)); const many = [...cnt.entries()].sort((p, q) => q[1] - p[1])[0];
      return `<div class="dhs"><b>${k === today ? '오늘' : k}</b> ${a.length}건 · 일한 시간 ${dhDur(tot)} · 가장 길었던 일 <b>${esc(top.name)}</b>(${dhDur(top.ms)})${many && many[1] > 1 ? ` · 가장 자주 ${esc(many[0])} ×${many[1]}` : ''}</div>` + a.slice(0, k === today ? 12 : 5).map((x) => `<div class="dhr"><span>${tHM(x.at)}</span><span>${esc(x.name)}</span><span>${dhDur(x.ms)}</span></div>`).join('') + (a.length > (k === today ? 12 : 5) ? `<div class="dhr dhm">… ${a.length - (k === today ? 12 : 5)}건 더</div>` : ''); }).join('');
    return btn + `<div class="dhl">${days}</div>`; };
  dash.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-dh]'); if (!b) return; e.stopPropagation(); dhOpen = !dhOpen; try { GM_setValue('rnu-dashhist-open', dhOpen); } catch (x) {} dashHtml = null; try { drawDash(stateOf()); } catch (x) {} });
  let dashTick = 0; const drawDash = (S) => { const lead = isLead(); box.classList.toggle('lead', lead); applyLog(); const R = [];
    const busy = (S.busy || []).slice().sort((a, b) => (a.tab === window.__rnTab ? -1 : b.tab === window.__rnTab ? 1 : 0));
    for (const m of (lead ? busy : busy.slice(0, 1))) { const n = nowOf(m); const where = m.tab !== window.__rnTab ? ' <small style="color:#7D8B98">(다른 탭)</small>' : '';
      const stc = S.paused ? (S.kind === 'stop' ? ['dl', '멈추는 중'] : ['dl', '멈춤']) : ['go', '진행'];
      R.push(`<tr class="now"><td>${m.jobStart ? tHM(m.jobStart) : '--:--'}</td><td class="jb">${esc(m.job || '작업')}${where}</td><td><span class="s2" title="${esc(n.txt)}">${esc(n.txt || '준비 중')}</span>${n.fr != null ? `<div class="pb2"><i style="width:${(n.fr * 100).toFixed(1)}%"></i></div>` : ''}</td><td><span class="st ${stc[0]}">${stc[1]}</span></td></tr>`); }
    if (!busy.length && S.kind === 'pause') R.push(`<tr class="now"><td>${tHM(Date.now())}</td><td class="jb">일시정지</td><td><span class="s2">다시 시작 전에는 저절로 시작하지 않음</span></td><td><span class="st dl">멈춤</span></td></tr>`);
    const up = window.__rnSchedUpcoming ? window.__rnSchedUpcoming(lead ? 5 : 1) : { known: false };
    if (up.known && up.on) for (const x of up.list || []) R.push(`<tr><td>${x.tomorrow ? '<small>내일</small>' : ''}${esc(x.t)}</td><td class="jb">${esc(x.label)}</td><td><span class="s2">⏰ ${x.d < 60 ? `${x.d}분 뒤` : `${Math.floor(x.d / 60)}시간${x.d % 60 ? ' ' + (x.d % 60) + '분' : ''} 뒤`}</span></td><td><span class="st ${x.d <= 10 ? 'bd' : 'wt'}">${x.d <= 10 ? '곧 시작' : '대기'}</span></td></tr>`);
    else if (up.known && !up.on && lead) R.push(`<tr class="old"><td>--:--</td><td class="jb">⏰ 매일 자동</td><td><span class="s2">꺼져 있음(웹앱 ⏰ 일정표)</span></td><td><span class="st dn">꺼짐</span></td></tr>`);
    if (S.last && (lead || !busy.length)) R.push(`<tr class="old"><td>${tHM(S.last.at)}</td><td class="jb">${esc(S.last.name || '')}</td><td><span class="s2">${S.last.ms ? '걸린 시간 ' + Math.max(1, Math.round(S.last.ms / 60000)) + '분' : '끝남'}</span></td><td><span class="st dn">완료</span></td></tr>`);
    if (!busy.length && !R.some((r) => r.includes('class="now"'))) R.unshift(`<tr class="now"><td>${tHM(Date.now())}</td><td class="jb">쉬는 중</td><td><span class="s2">지금 하는 일 없음 — 다음 자동 일·웹앱 요청을 기다림</span></td><td><span class="st dn">대기</span></td></tr>`);
    if (lead) dhRec(S.lives); const h = `<div class="fh">${lead ? '이 PC 수집기 · 지금 하는 일' : '이 PC 수집기 (쉬는 탭)'}<span class="sp"></span><span class="ck">${tHM(Date.now())}</span></div><table><tr><th>시각</th><th>작업</th><th>지금 하는 것</th><th style="text-align:right">상태</th></tr>${R.join('')}</table>${dhHtml(lead)}`;
    const k = (lead ? 'L' : 'F') + h; if (k === dashHtml) return; dashHtml = k; dash.className = 'dash ' + S.kind; dash.hidden = false; dash.innerHTML = h; };
  sub.addEventListener('click', (e) => { e.stopPropagation(); const b = e.target.closest('[data-r]'); if (!b) return; if (b.dataset.r === 'force') { if (window.__rnForceAsk && window.__rnForceAsk()) window.__rnForce(true); } else if (b.dataset.r === 'rest') window.__rnForce(false); subHtml = null; draw(); });
  if (window.__rnRoleOn) window.__rnRoleOn((r) => { if (r === 'lead' && window.__rnLeadSince && Date.now() - window.__rnLeadSince < 3000 && /follow|force/.test(String(lastRole))) promotedAt = Date.now(); if (r === 'follow') setMin(true, true); lastRole = r; subHtml = null; });
  let lastRole = null;
  let prevBusy = 0; function draw() { const S = stateOf(); badge(S); drawSub(S); try { drawDash(S); } catch (e) {}
    if (S.busy.length < prevBusy && window.__rnPrd && window.__rnPrd.refreshResume) { setTimeout(() => { try { window.__rnPrd.refreshResume(); pollCrm(); } catch (e) {} }, 3000); } prevBusy = S.busy.length; /* 어느 탭의 작업이 끝나거나 멈추면 멈춘 작업 목록을 다시 읽음 */ if (box.classList.contains('min') || box.dataset.rnu !== 'ov') return; /* (1.74.1) 1.70.0에서 탭 표시를 body → 수집기 칸(box)으로 옮기며 이 줄만 body를 봐서 개요가 늘 비어 있었음(모든 PC) */
    const P = window.__rnPrd; const R = resList(); const anyBusy = S.busy.length > 0;
    const pi = window.__rnPauseInfo ? window.__rnPauseInfo() : null;
    // ① 지금 상태
    let now = '';
    if (S.kind === 'stop') now = `<div class="big" style="color:${AMB}">■ 멈추는 중</div><div class="mut">지금 하던 항목을 마치고 진행 위치를 저장하는 중입니다. 몇 초~1분 걸릴 수 있어요. 멈추면 아래 '멈춘 작업'에 나타납니다.</div>${S.main ? `<div class="mut" style="margin-top:4px">멈추는 작업: <b>${esc(S.main.job)}</b>${S.main.tab !== window.__rnTab ? ' (이 PC의 다른 탭)' : ''}</div>` : ''}`;
    else if (S.kind === 'pause') now = `<div class="big" style="color:${AMB}">■ 일시정지됨</div><div class="mut">${pi && pi.at ? `${md(pi.at)}에 ${esc(pi.why || '')} 멈춤. ` : ''}<b>다시 시작</b>을 누르기 전에는 어떤 작업도 저절로 시작하지 않습니다 (매일 자동 수집 포함).</div>`;
    else if (S.kind === 'busy') now = `${window.__rnOvHtml ? window.__rnOvHtml(S.main, !!S.main.crmBusy) : esc(S.main.job)}${S.main.tab !== window.__rnTab ? `<div class="mut" style="margin-top:4px">이 PC의 다른 탭(${S.main.page === 'worders.aspx' ? '주문조회' : S.main.page === 'wrecord_edit.aspx' ? '상품 조회' : '판매관리'})에서 진행 중 — 여기서도 멈추고 볼 수 있습니다</div>` : ''}${S.busy.length > 1 ? `<div class="mut">함께 진행 중: ${S.busy.filter((v) => v !== S.main).map((v) => esc(v.job)).join(', ')}</div>` : ''}`;
    else now = `<div class="big">쉬는 중</div><div class="mut">${S.last ? `마지막 작업: '${esc(S.last.name)}' ${md(S.last.at)} 끝 · ` : ''}${R.length ? `멈춘 작업 ${R.length}개가 아래에 있습니다.` : '멈춘 작업 없음.'}</div>`;
    // ② 주 버튼
    const resumeTarget = resTarget(R);
    const chainRes = R.find((r) => r.key === 'chain');
    const pauseBtn = S.paused
      ? `<button class="b-go" data-a="resume">▶ 다시 시작<small>${anyBusy ? '멈추는 중 — 멈춘 뒤 누르세요' : resumeTarget ? `'${esc(resumeTarget.name)}' 이어서` : '일시정지 풀기'}</small></button>`
      : `<button class="b-pause" data-a="pause">■ 일시정지<small>${anyBusy ? '지금 항목까지 저장하고 멈춤 (모든 탭)' : '자동 수집도 하지 않게 멈춰 둠'}</small></button>`;
    const allBtn = `<button class="b-all" data-a="all" ${anyBusy || S.paused ? 'disabled' : ''} title="고객·주문부터 구매자 분포까지 켜 둔 단계를 차례로. 단계를 켜고 끄는 곳: 상품·매입 탭">▶ ${chainRes ? '전체 수집 이어서' : '전체 수집 시작'}<small>${chainRes ? esc(chainRes.meta.split(' · ')[0]) + '부터' : '고객·주문 → 상품 → 판매자 … 켜 둔 단계 차례로'}</small></button>`;
    // ③ 멈춘 작업
    const rs = R.length ? R.map((r) => `<div class="rs"><div class="t"><b>${esc(r.name)}</b><small>${esc(r.meta)}</small></div>${r.running ? `<span class="on" title="다른 PC(또는 이 PC의 다른 탭)가 지금 이 작업을 하는 중 — 멈추려면 그 PC를 일시정지(🛰 PC 원격 ■)">▶ 진행 중${/^bench_/.test(r.key) && r.meta ? '' : ''}</span>` : `<button data-a="res1" data-m="${r.mod}" data-k="${esc(r.key)}" ${anyBusy || S.paused ? 'disabled' : ''} title="${S.paused ? '먼저 다시 시작(일시정지 풀기)' : anyBusy ? '다른 작업이 끝난 뒤' : '멈춘 자리부터 이어서'}">이어하기</button><button class="x" data-a="dis1" data-m="${r.mod}" data-k="${esc(r.key)}" title="멈춘 자리만 잊음 — 받은 기록은 그대로">버리기</button>`}</div>`).join('') : '<div class="mut">없음 — 일시정지하거나 창이 닫혀 멈춘 작업이 생기면 여기에 작업마다 나옵니다.</div>';
    // ④ 다음 자동 수집
    const sn = window.__rnSchedNext ? window.__rnSchedNext() : { known: false };
    const sched = !sn.known ? '불러오는 중' : !sn.on ? '꺼짐 — 상품·매입 탭 맨 위 \'⏰ 매일 자동 수집\'에서 켬' : sn.next ? `${sn.next.tomorrow ? '내일 ' : ''}${sn.next.t} · ${esc(sn.next.label)}${S.paused ? ' <b style="color:#A8661B">(일시정지 중이라 하지 않음)</b>' : ''}` : '켠 항목 없음';
    // ⑤ 최근 기록 (이 PC 모든 탭)
    const tail = (window.__rnLogTail ? window.__rnLogTail(30) : []).filter((e) => !/^탭 열림/.test(e.x)).slice(-10);
    const lg = tail.length ? tail.map((e) => `<div class="${e.l}" title="${esc(e.x)}"><span class="tm">${hm(e.t)}</span> <span class="md">${esc(e.m)}</span> ${esc(e.x)}</div>`).join('') : '<div class="mut">아직 없음</div>';
    // ⑥ 다른 PC · 판
    const od = P && P.outdated ? P.outdated() : null;
    const pcs = P && P.pcsHtml ? P.pcsHtml() : '';
    const html = `<div class="card now ${S.kind}">${now}</div>
      <div class="acts">${pauseBtn}${allBtn}</div>
      ${featHtml(S)}
      <div class="card"><div class="k">멈춘 작업 ${R.length ? `(${R.length})` : ''}<span class="sp"></span><a href="#" data-a="rrf" title="다시 불러오기">↻</a></div>${rs}</div>
      <div class="card"><div class="k">⏰ 다음 자동 수집</div><div>${sched}</div></div>
      <div class="card lgcard"><div class="k">최근 기록 · 이 PC의 모든 탭<span class="sp"></span><a href="#" data-a="log">크게 보기 ›</a></div><div class="lg">${lg}</div></div>
      <div class="card"><div class="k">다른 PC · 판</div>${pcs ? pcs.replace(/class="pc/g, 'class="pc') : '<div class="mut">불러오는 중</div>'}<div class="pc">수집기 v${VER}${(() => { try { const L = window.__rnLiveInfo && window.__rnLiveInfo(); if (!L) return ''; return L.noeval ? ' · ⚡ 빠른 업데이트 안 됨(이 브라우저가 막음 — Tampermonkey 자동 업데이트만)' : L.used === 'live' ? ` · ⚡ 빠른 업데이트로 받은 판 (Tampermonkey 본체 ${esc(L.classic)})` : L.have && L.have !== L.ver ? ` · ⚡ 새 판 ${esc(L.have)} 받아 둠 — 쉬는 사이 바꿈` : ' · ⚡ 빠른 업데이트 켜짐(5분마다 확인)'; } catch (e) { return ''; } })()}${od ? ` · <b style="color:${AMB}">새 판 ${esc(od)} 있음</b> — 쉬는 사이(또는 긴 작업이면 저장 지점에서) 저절로 바꿔 그 자리부터 이어감` : ' · 최신'}${P && P.who ? ' · ' + esc(P.who()) : ''}</div></div>`;
    if (html === lastHtml) return; lastHtml = html; ov.innerHTML = html; // 바뀐 것이 있을 때만 다시 그림 (단추를 누르는 중에 사라지지 않게)
    const lgEl = ov.querySelector('.lg'); if (lgEl && GM_getValue('rnu-log-autoscroll', true)) lgEl.scrollTop = lgEl.scrollHeight; }
  let lastHtml = '';
  /* (1.63.7) 🧩 이 PC 기능 켜고 끄기 — 📥 수집(= 일시정지 스위치) + 수집 외 기능(전체 켜기·전체 끄기) · 바꾸면 곧바로 아래 알림 */
  function featHtml(S) { const FL = window.__rnFeats || []; const FO = window.__rnFeatOff ? window.__rnFeatOff() : []; const on = FL.length - FO.length;
    return `<details class="card feat" ${GM_getValue('rnu-feat-open', 0) ? 'open' : ''}><summary class="k">🧩 이 PC 기능 켜고 끄기 <small>${S.paused ? '<b style="color:#B0322A">📥 수집 꺼짐</b>' : '📥 수집 켜짐'} · 수집 외 ${on}/${FL.length} 켜짐</small></summary>
      <label class="fr main"><input type="checkbox" data-feat="__collect" ${S.paused ? '' : 'checked'}> <b>📥 수집</b><small>끄면 이 PC는 직접 누른 수집·⏰ 자동 수집·웹앱 수집 요청·🌐 외부 정보·맡긴 수집 일(시장 지표·읽기·찾기)을 하지 않음 — 하던 작업은 지금 항목까지 저장하고 멈춤(= 일시정지 · 이 PC의 모든 탭). 담당 PC면 순서대로 다른 PC가 맡음. 다시 켜도 멈춘 작업은 저절로 이어가지 않음(아래 '멈춘 작업'에서 이어하기)</small></label>
      <div class="fbar"><b>수집 외 기능</b><button type="button" data-fall="1">전체 켜기</button><button type="button" data-fall="0">전체 끄기</button></div>
      ${FL.map(([k, l, d, w]) => `<label class="fr"><input type="checkbox" data-feat="${esc(k)}" ${FO.includes(k) ? '' : 'checked'}> ${esc(l)}<span class="fw">${esc(w)}</span><small>${esc(d)}</small></label>`).join('')}
      <div class="mut" style="margin-top:4px">이 PC만 · 화면 기능은 그 화면을 새로 열 때부터, 맡긴 일·바탕 기능은 곧바로 · 꺼 둔 맡긴 일은 대기로 남아 다른 PC가 받음 · 늘 켜짐: 관제판·작업 기록·PC 이름·탭 나누기·담당 PC 신호</div></details>`; }
  const featToast = (m) => { let t = globalThis.__rnById('rn-feat-toast'); if (!t) { t = document.createElement('div'); t.id = 'rn-feat-toast'; globalThis.__rnMount(t); } t.textContent = m; t.style.display = ''; clearTimeout(t._t); t._t = setTimeout(() => (t.style.display = 'none'), 3500); }; window.__rnToast = featToast; /* (1.63.12) 다른 모듈에서도 같은 알림 */
  ov.addEventListener('toggle', (e) => { if (e.target.matches && e.target.matches('details.feat')) GM_setValue('rnu-feat-open', e.target.open ? 1 : 0); }, true);
  ov.addEventListener('change', (e) => { const c = e.target.closest && e.target.closest('[data-feat]'); if (!c) return; const k = c.dataset.feat;
    if (k === '__collect') { if (c.checked) { window.__rnResumeOk && window.__rnResumeOk(); featToast('📥 수집 켬 — 이 PC가 다시 수집함 (멈춘 작업은 \'멈춘 작업\'에서 이어하기)'); } else { window.__rnPauseAll && window.__rnPauseAll('🧩 수집 끔 (관제판)'); featToast('📥 수집 끔 — 이 PC는 수집하지 않음 (하던 작업은 저장하고 멈춤)'); } }
    else { window.__rnFeatSet({ [k]: c.checked }); const f = (window.__rnFeats || []).find((x) => x[0] === k) || [k, k]; window.__rnLog && window.__rnLog('수집기', 'info', `🧩 ${f[1]} ${c.checked ? '켬' : '끔'}`); featToast(`🧩 ${f[1]} ${c.checked ? '켬' : '끔'}${/화면/.test(f[3] || '') ? ' — 그 화면을 새로 열 때부터' : ''}`); }
    lastHtml = ''; draw(); });
  ov.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-fall]'); if (!b) return; e.preventDefault(); e.stopPropagation(); const on = b.dataset.fall === '1'; const P = {}; (window.__rnFeats || []).forEach((x) => (P[x[0]] = on)); window.__rnFeatSet(P); window.__rnLog && window.__rnLog('수집기', 'info', `🧩 수집 외 기능 전체 ${on ? '켬' : '끔'}`); featToast(`🧩 수집 외 기능 전체 ${on ? '켬' : '끔'} — 화면 기능은 그 화면을 새로 열 때부터`); lastHtml = ''; draw(); }, true);
  ov.addEventListener('click', async (e) => { const a = e.target.closest('[data-a]'); if (!a) return; e.preventDefault(); const P = window.__rnPrd; const k = a.dataset.k, m = a.dataset.m;
    if (a.dataset.a === 'pause') { window.__rnPauseAll && window.__rnPauseAll('관제판에서'); }
    else if (a.dataset.a === 'resume') { const S = stateOf(); if (S.busy.length) return alert('아직 멈추는 중입니다 — 멈춘 뒤에 눌러 주세요'); const t = resTarget(resList()); window.__rnResumeOk && window.__rnResumeOk();
      if (t) { if (t.mod === 'crm') window.__rnCrm.resume(); else P.resume(t.key); } }
    else if (a.dataset.a === 'all') { if (!P) return alert('수집기가 아직 준비 중입니다. 잠시 뒤 눌러 주세요'); if (stateOf().busy.length) return alert('이미 작업 중입니다'); window.__rnResumeOk && window.__rnResumeOk(); set('ov'); P.startAll(); }
    else if (a.dataset.a === 'res1') { window.__rnResumeOk && window.__rnResumeOk(); if (m === 'crm') window.__rnCrm.resume(); else { const r = P.resume(k); if (r && r.ok === false) { const row = a.closest('.rs'); let n = row && row.querySelector('.rs-why'); if (row && !n) { n = document.createElement('div'); n.className = 'rs-why'; n.style.cssText = 'flex-basis:100%;font-size:11.5px;color:#B0322A;margin-top:3px'; row.appendChild(n); } if (n) n.textContent = '✕ ' + r.why; return; } } }
    else if (a.dataset.a === 'dis1') { /* (1.63.2) 팝업 대신 단추 두 번 — 첫 누름은 '확정' 단추로 바뀜(4초) · 못 버리면 까닭을 그 줄 아래에 */ const row = a.closest('.rs'); const nm = (row.querySelector('b') || {}).textContent || k;
      if (a.dataset.arm !== '1') { a.dataset.arm = '1'; a.dataset.t0 = a.textContent; a.textContent = '확정'; a.title = `'${nm}'의 멈춘 자리만 잊음 — 받은 기록은 그대로, 다음엔 처음부터 훑되 이미 받은 것은 건너뜀`; a.style.background = '#B0322A'; a.style.color = '#fff'; setTimeout(() => { if (a.isConnected && a.dataset.arm === '1') { a.dataset.arm = ''; a.textContent = a.dataset.t0 || '버리기'; a.style.background = ''; a.style.color = ''; } }, 4000); return; }
      a.dataset.arm = ''; a.disabled = true; a.textContent = '지우는 중'; const r = m === 'crm' ? await window.__rnCrm.discard(k) : await P.discard(k);
      if (!r || !r.ok) { const why = (r && r.why) || '버리지 못했습니다'; a.disabled = false; a.textContent = a.dataset.t0 || '버리기'; a.style.background = ''; a.style.color = ''; let n = row.querySelector('.rs-why'); if (!n) { n = document.createElement('div'); n.className = 'rs-why'; n.style.cssText = 'flex-basis:100%;font-size:11.5px;color:#B0322A;margin-top:3px'; row.appendChild(n); } n.textContent = '✕ ' + why; try { log('버리기 못 함: ' + why, 1); } catch (e) {} return; }
      if (m === 'crm') await pollCrm(); }
    else if (a.dataset.a === 'rrf') { await pollCrm(); if (P && P.refreshResume) await P.refreshResume(); }
    else if (a.dataset.a === 'log') { window.__rnJournalToggle && window.__rnJournalToggle(); }
    lastHtml = ''; draw(); });
  window.__rnCtlDraw = () => { lastHtml = ''; draw(); };
  const go = () => { globalThis.__rnMount(box); try { globalThis.__rnMount(ico); } catch (e) { document.body.appendChild(ico); } adopt(); (window.__rnRoleReady || Promise.resolve()).then(() => posApply(true)); posApply(true); new MutationObserver(adopt).observe(document.body, { childList: true }); if (globalThis.__rnSR) new MutationObserver(adopt).observe(globalThis.__rnSR, { childList: true });
    let saved = GM_getValue('rnu-tab', 'ov'); if (saved === 'hide') saved = 'ov'; set(saved); setMin(!!GM_getValue('rnu-ctl-min', 0)); (window.__rnRoleReady || Promise.resolve()).then(() => { if (window.__rnRole && /^(follow|wait)$/.test(window.__rnRole())) setMin(true, true); }); /* (1.56.0) 쉬는 탭은 접힌 채로 (기억해 둔 접힘·펼침은 그대로) */
    if (saved === 'prc') setTimeout(() => { if (!bar.querySelector('button[data-t="prc"]')) set('ov'); }, 4000); // 가격 감시기 탭이 안 붙으면 개요로
    setInterval(draw, 1000); };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();

/* ══════════ (adapt10 11/12 밤 · 정범님 '알라딘은 방식을 계속 바꾼다는 전제' · 약속 64) 🔄 수집기(PC) 목표·방법 장부 — 머리 그대로
 *  틀 = globalThis.ReadnowAdaptAg(공용 readnow-adapt-core.js ◆AG 덩어리를 split.js가 readnow-pc-runtime.js 앞에 그대로 넣음 · 새 @require 없음)
 *  읽기 성적만 남김 — 수집기 동작(차례·속도·로그인·로거 잠금·네이버 와이파이 규칙)은 바꾸지 않음 · 손님 정보·값 원문은 남기지 않음(칸마다 '채움·맞음' 수만)
 *  붙인 곳(공용 파서를 감쌈 · 같은 화면은 한 번만 셈): 알라딘 상품 화면(시장 지표·매입·벤치마킹 상세가 같이 씀) · 전체 중고 화면 · 검색 목록 · 샵매니저 목록(운영) · 판매자 숍 요약
 *   · 예스24 검색 목록·묶음·가게 · 바깥 시세(ReadnowExt.run — 출처가 길) · 🎯 벤치마킹 숍 목록(간단히 보기 vs 상자 길) · 공개 화면 읽기 길(로그인 없이 vs 로그인) · 🟦 예스24 운영 응답 올리기
 *  칸마다 길: 상품 화면은 운영 파서(op) · 글 이름표(lbl: 'Sales Point'·세일즈포인트·판매가·정가·쪽) · 구조 데이터(ld: meta·JSON-LD)를 견줘 [시도, 채움, 합의값과 같음]
 *  회차 = 이 PC 모든 탭이 모은 시도 40번 또는 10분(GM 저장소 rn-ag-acc) → 장부(rn-ag-g) → 15분마다 한 탭이 adapt_pc/<PC>{g, lines}·app_settings/adapt_goals sum['pc_<엔진>@<PC>']·발견 모음 넘김(finds_inbox)
 *  끄기: GM rn-ag-off = 1 · 진단: window.__rnAgPc.peek() */
(function rnAgPc() { const G = globalThis; const AG = G.ReadnowAdaptAg; if (G.__rnAgPc || !AG || !AG.agRecord || !AG.agFillTally) return;
  const KG = 'rn-ag-g', KA = 'rn-ag-acc', KL = 'rn-ag-lines', KF = 'rn-ag-flush'; const ROUND_N = 40, ROUND_MS = 10 * 60e3, FLUSH_MS = 15 * 60e3;
  const gv = (k, d) => { try { const v = GM_getValue(k, d); return v == null ? d : v; } catch (e) { return d; } }; const sv = (k, v) => { try { GM_setValue(k, v); } catch (e) {} };
  const on = () => !gv('rn-ag-off', 0); const pcN = () => { try { return String((window.__rnPcName && window.__rnPcName.get()) || '').replace(/[^\w가-힣-]/g, '_').slice(0, 40); } catch (e) { return ''; } };
  const SEED = {
    al_product: { label: '수집기 알라딘 상품 화면 읽기', goal: '상품 화면 칸(SP·판매가·정가·ISBN·출간일·쪽수) — 시장 지표·매입·벤치마킹 상세가 같이 씀', unit: '칸', target: 0.9, methods: [{ id: 'op', label: '운영 파서(products-core)' }, { id: 'lbl', label: "글 이름표('Sales Point'·세일즈포인트·판매가·정가·쪽)" }, { id: 'ld', label: '구조 데이터(meta·JSON-LD)' }], champ: 'op' },
    al_sp: { label: '수집기 알라딘 상품 화면 SP 읽기', goal: '상품 화면마다 세일즈포인트(시장 지표·벤치마킹의 뼈대)', unit: '권', target: 0.9, methods: [{ id: 'op', label: '운영 파서(순위 상자 Sales Point)' }, { id: 'lbl', label: "글 이름표('Sales Point'·세일즈포인트·판매지수 — 화면 어디든)" }], champ: 'op' },
    al_used: { label: '수집기 알라딘 전체 중고 화면 읽기', goal: '전체 중고 수·매물 줄', unit: '칸', target: 0.9, methods: [{ id: 'op', label: '운영 파서' }, { id: 'lbl', label: "글 이름표('전체 중고 (n)')" }, { id: 'cart', label: '장바구니 칸 수' }], champ: 'op' },
    al_list: { label: '수집기 알라딘 검색 목록 읽기', goal: '목록 줄마다 상품 번호·제목·표지', unit: '칸', target: 0.9, methods: [{ id: 'op', label: '운영 파서(.ss_book_box)' }, { id: 'attr', label: '상자 itemid 속성' }, { id: 'href', label: '제목 링크 주소' }], champ: 'op' },
    al_scm: { label: '수집기 샵매니저 상품 목록 읽기(운영)', goal: '우리 상품 줄마다 값·수량·상태·관리 코드', unit: '칸', target: 0.9, methods: [{ id: 'op', label: '운영 파서(input.batchChkBox 줄)' }], champ: 'op' },
    seller_shop: { label: '수집기 판매자 숍 요약 읽기', goal: '숍 첫 화면 6개월 평가·등급·상태', unit: '칸', target: 0.8, methods: [{ id: 'op', label: '운영 파서(sellers-core)' }], champ: 'op' },
    y24_list: { label: '수집기 예스24 검색 목록 읽기', goal: '줄마다 묶음 번호·중고 수·새상품 값', unit: '칸', target: 0.8, methods: [{ id: 'op', label: '운영 파서(a.gd_name)' }, { id: 'href', label: '묶음 링크 주소' }], champ: 'op' },
    y24_hub: { label: '수집기 예스24 중고 묶음 읽기', goal: '매물 줄마다 값·등급·가게·배송비', unit: '칸', target: 0.9, methods: [{ id: 'op', label: '운영 파서(li[saleprice])' }], champ: 'op' },
    y24_shop: { label: '수집기 예스24 가게 읽기', goal: '가게 만족도·평가 수·상품 수', unit: '칸', target: 0.8, methods: [{ id: 'op', label: '운영 파서(글 정규식)' }], champ: 'op' },
    bench_list: { label: '수집기 🎯 벤치마킹 숍 목록 읽기', goal: '숍 목록 쪽마다 상품(값·등급·제목)', unit: '쪽', target: 0.9, methods: [{ id: 'simple', label: '간단히 보기(장바구니 칸)' }, { id: 'box', label: '상자 단위(자세히 보기)' }], champ: 'simple' },
    pub_read: { label: '수집기 공개 화면 읽기 길', goal: '공개 화면을 로그인 없이(안 되면 로그인)', unit: '장', target: 0.9, methods: [{ id: 'anon', label: '로그인 없이' }, { id: 'logged', label: '로그인 상태' }] },
    y24_ops: { label: '수집기 🟦 예스24 운영 응답 올리기', goal: '예스24 판매관리 응답(주문·상품)을 받아 올림', unit: '건', target: 0.9 },
    ext: { label: '수집기 바깥 시세·책 정보 읽기', goal: 'ISBN마다 바깥 출처(교보·국중·예스24 등) 값', unit: '번', target: 0.6 },
  };
  let P = {}; let pend = 0; const seen = new WeakMap();
  const once = (d, eng) => { if (!d || (typeof d !== 'object' && typeof d !== 'function')) return true; let s = seen.get(d); if (!s) { s = new Set(); try { seen.set(d, s); } catch (e) { return true; } } if (s.has(eng)) return false; s.add(eng); return true; };
  const box = (eng) => (P[eng] = P[eng] || { m: {}, fl: {}, raw: null });
  function obs(eng, mid, r) { try { if (!on() || !eng || !mid || !r || pend > 3000) return; const B = box(eng); const z = (B.m[mid] = B.m[mid] || [0, 0, 0, 0]); const n = Math.max(0, +r.n || 1); z[0] += n; z[1] += Math.min(n, Math.max(0, +r.ok || 0)); z[2] += r.cost != null ? Math.max(0, +r.cost || 0) : n; z[3] += Math.max(0, +r.ms || 0); pend += n;
      if (r.raw != null) smp(eng, mid, r.raw, r.good); } catch (e) {} }
  /* 원문 표본(바뀐 것 찾기용) — 길마다 안 된 것을 먼저 · 600자 · 전화번호 꼴 가림 */
  function smp(eng, mid, raw, good) { try { if (!on()) return; const B = box(eng); if (raw != null && (!B.raw || !good)) B.raw = [mid, String(raw).replace(/01[016789]-?\d{3,4}-?\d{4}/g, '＊').slice(0, 600), !!good]; } catch (e) {} }
  /* 칸마다 길 — fields = { 칸: { 길: 값|null } } → 길마다 성적도 같이(rec !== false) */
  function fill(eng, fields, o) { o = o || {}; try { if (!on()) return; const T = AG.agFillTally(fields, { main: o.main || 'op' }); AG.agFillAdd(box(eng).fl, T.t); if (o.rec !== false) for (const [p, z] of Object.entries(T.tot)) if (z.n) obs(eng, p, { n: z.n, ok: z.ok }); } catch (e) {} }
  /* 줄 목록 — 줄마다 칸(op 하나) 채움 + 쪽 하나 = 시도 하나(줄이 있으면 성공) */
  function rows(eng, mid, L, pick, o) { try { if (!on()) return; const A0 = Array.isArray(L) ? L : []; obs(eng, mid, { n: 1, ok: A0.length ? 1 : 0, ...(o || {}) }); const T = {}; for (const r of A0.slice(0, 60)) { const F = pick(r) || {}; const t = AG.agFillTally(Object.fromEntries(Object.entries(F).map(([k, v]) => [k, v && typeof v === 'object' && !Array.isArray(v) ? v : { [mid]: v }])), { main: mid }).t; AG.agFillAdd(T, t); } AG.agFillAdd(box(eng).fl, T); } catch (e) {} }
  /* 이 탭이 모은 것 → GM 저장소 회차 칸 → 회차가 차면 장부 */
  function push() { if (!pend && !Object.keys(P).length) return; const Pn = P; P = {}; pend = 0; try { const acc = gv(KA, {}) || {}; const t = Date.now();
      for (const [eng, B] of Object.entries(Pn)) { const a = (acc[eng] = acc[eng] || { t0: t, n: 0, m: {}, fl: {}, raw: null }); for (const [mid, z] of Object.entries(B.m)) { const y = (a.m[mid] = a.m[mid] || [0, 0, 0, 0]); for (let i = 0; i < 4; i++) y[i] += z[i]; a.n += z[0]; } AG.agFillAdd(a.fl, B.fl); if (B.raw && (!a.raw || !B.raw[2])) a.raw = B.raw; }
      const due = Object.keys(acc).filter((k) => acc[k].n >= ROUND_N || t - acc[k].t0 >= ROUND_MS); if (due.length) { const L = gv(KG, {}) || {}; const lines = gv(KL, []) || [];
        for (const eng of due) { const a = acc[eng]; delete acc[eng]; const id = 'pc_' + eng; const g = AG.agEnsure(L, id, SEED[eng] || { label: '수집기 ' + eng, unit: '번' }); for (const [mid, z] of Object.entries(a.m)) if (z[0]) AG.agRecord(g, mid, { n: z[0], ok: z[1], cost: z[2], ms: z[3] }, t); if (Object.keys(a.fl).length) AG.agFill(g, a.fl, t);
          if (a.raw) AG.agSample(g, a.raw[0], a.raw[1], a.raw[2], t); const res = AG.agAdapt(g, { now: t }); for (const x of res.lines || []) lines.push(x); }
        sv(KG, L); sv(KL, lines.slice(-60)); }
      sv(KA, acc); } catch (e) {} }
  /* 15분마다 이 PC 한 탭이 Firestore로 — adapt_pc/<PC>(장부 몸통) · adapt_goals sum(웹앱 🔄 엔진 적응 상태) · finds_inbox(발견 모음 넘김) */
  async function flush(force) { try { const F = G.firebase; if (!F || !F.apps || !F.apps.length || !F.auth().currentUser) return null; const pc = pcN(); if (!pc) return null; const t = Date.now(); const last = +gv(KF, 0) || 0; if (!force && t - last < FLUSH_MS) return null; sv(KF, t); push();
      const L = gv(KG, {}) || {}; const ks = Object.keys(L); if (!ks.length) return { n: 0 }; const db = F.firestore(); const FP = F.firestore.FieldPath; const at = new Date(t).toISOString(); const lines = (gv(KL, []) || []).slice(-60).map((x) => ({ at: x.at, src: '엔진', eng: x.eng, engL: x.engL, kind: x.kind, t: x.t, ...(x.ev ? { ev: JSON.stringify(x.ev).slice(0, 400) } : {}) })); /* (adapt10 둘째) 웹 SDK는 배열 안 배열을 거절 — 장부 몸통은 글(gs)로 · 근거(ev)도 글로 */
      await db.collection('adapt_pc').doc(pc).set({ pc, at, ver: (G.ReadnowAdaptAg || {}).VERSION || null, col: G.__rnLiveVer || null, n: ks.length, gs: JSON.stringify(L), lines }, { merge: false });
      const args = []; for (const k of ks) { const s0 = AG.agSummary(L[k]); if (s0) args.push(new FP('sum', k + '@' + pc), JSON.parse(JSON.stringify({ ...s0, id: k + '@' + pc, label: `${s0.label} · ${pc}`, by: '수집기', pc }))); }
      if (args.length) { try { await db.collection('app_settings').doc('adapt_goals').update('at', at, ...args); } catch (e) { sv('rn-ag-err', String((e && e.message) || e).slice(0, 200)); } }
      const sent = +gv('rn-ag-sent', 0) || 0; const nw = JSON.parse(JSON.stringify(lines.filter((x) => x && x.t && Date.parse(x.at || 0) > sent).map((x) => ({ ...x, engL: `${x.engL || x.eng} · ${pc}` }))));
      if (nw.length) { try { await db.collection('app_settings').doc('finds_inbox').set({ L: F.firestore.FieldValue.arrayUnion(...nw), at }, { merge: true }); sv('rn-ag-sent', Math.max(...nw.map((x) => Date.parse(x.at) || 0))); } catch (e) {} }
      sv('rn-ag-err', ''); return { n: ks.length, lines: nw.length }; } catch (e) { sv('rn-ag-err', String((e && e.message) || e).slice(0, 200)); return { err: String((e && e.message) || e).slice(0, 120) }; } } /* 실패 까닭은 GM rn-ag-err(peek에 보임) */
  setInterval(push, 30e3); setInterval(() => { flush().catch(() => {}); }, 60e3); try { addEventListener('pagehide', push); } catch (e) {}
  G.__rnAgPc = { obs, fill, rows, smp, push, flush, peek: () => ({ ver: AG.VERSION, pend, err: gv('rn-ag-err', '') || null, flushAt: +gv(KF, 0) || null, acc: gv(KA, {}), goals: Object.fromEntries(Object.entries(gv(KG, {}) || {}).map(([k, g]) => [k, AG.agSummary(g)])), lines: (gv(KL, []) || []).slice(-5) }) };
  /* ── 공용 파서 감싸기(같은 화면은 한 번만 · 실패해도 원래 결과 그대로) ── */
  const wrap = (o, k, fn) => { try { const f = o && o[k]; if (typeof f !== 'function' || f.__rnAg) return; const w = function () { const r = f.apply(this, arguments); try { if (on()) fn(arguments, r); } catch (e) {} return r; }; w.__rnAg = 1; o[k] = w; } catch (e) {} };
  const tx = (el) => (el ? String(el.textContent || '').replace(/[ \s]+/g, ' ').trim() : ''); const num = (s) => { const m = String(s == null ? '' : s).replace(/,/g, '').match(/\d+/); return m ? +m[0] : null; };
  const mt = (d, p) => { try { const m = d.querySelector(`meta[property="${p}"]`); return m ? m.getAttribute('content') || null : null; } catch (e) { return null; } };
  const ldOf = (d) => { try { for (const s of d.querySelectorAll('script[type="application/ld+json"]')) { try { const j = JSON.parse(s.textContent); if (j && j['@type'] === 'Book') return j; } catch (e) {} } } catch (e) {} return null; };
  const PR = G.ReadnowProducts || (typeof window !== 'undefined' && window.ReadnowProducts); const SL = G.ReadnowSellers || (typeof window !== 'undefined' && window.ReadnowSellers); const EX = G.ReadnowExt || (typeof window !== 'undefined' && window.ReadnowExt);
  if (PR) {
    wrap(PR, 'parseProductPage', (a, r) => { const d = a[0]; if (!r || !d || !d.querySelector || !once(d, 'p')) return; const bi = tx(d.querySelector('.Ere_prod_Binfowrap')); const rk = tx(d.querySelector('[id$="pnlRanking"]')) || tx(d.querySelector('.Ere_prod_titlewrap')); const ld = ldOf(d); const SPR = /(?:Sales\s*Point|세일즈\s*포인트|판매\s*지수)\s*[:：]?\s*([\d,]+)/i; let all = bi + ' ' + rk; if (!SPR.test(all) && d.body) all += ' ' + tx(d.body).slice(0, 200000); /* 늘 보던 자리에 없으면 화면 글 전체에서(자리가 바뀐 경우) */
      const spM = all.match(SPR); const sp = spM && spM[1]; const ps = (bi.match(/판매가\s*[:：]?\s*([\d,]+)\s*원/) || [])[1]; const pl = (bi.match(/정가\s*[:：]?\s*([\d,]+)\s*원/) || [])[1]; const pg = (tx(d.querySelector('.conts_info_list1')).match(/(\d+)\s*쪽/) || [])[1];
      const ldD = ld && ((ld.workExample && ld.workExample[0] && ld.workExample[0].datePublished) || ld.datePublished); const ldI = ld && ((ld.workExample && ld.workExample[0] && ld.workExample[0].isbn) || ld.isbn);
      fill('al_product', { salesPoint: { op: r.salesPoint, lbl: num(sp) }, priceSales: { op: r.priceSales, lbl: num(ps) }, priceList: { op: r.priceList, lbl: num(pl) }, isbn13: { op: r.isbn13, ld: mt(d, 'books:isbn') || ldI || null }, pubDate: { op: r.pubDate, ld: ldD ? String(ldD).slice(0, 10) : null }, pages: { op: r.pages, lbl: num(pg) }, title: { op: r.title }, publisher: { op: r.publisher } });
      fill('al_sp', { salesPoint: { op: r.salesPoint, lbl: num(sp) } }); /* SP만 따로 장부(시장 지표의 뼈대) — 운영 파서가 못 읽고 글 이름표만 읽으면 판정이 떨어짐 */
      if (r.title && all) { const at = spM ? Math.max(0, all.indexOf(spM[0]) - 300) : 0; const sx = all.slice(at, at + 600); smp('al_sp', 'op', sx, r.salesPoint != null); smp('al_product', 'op', sx, r.salesPoint != null); } });
    wrap(PR, 'parseUsedPage', (a, r) => { const d = a[0]; if (!r || !d || !d.querySelector || !once(d, 'u')) return; const tt = (tx(d.querySelector('.Ere_usedsell_list2')).match(/전체\s*중고\s*\(\s*(\d+)\s*\)/) || [])[1]; const n = Array.isArray(r.listings) ? r.listings.length : null;
      fill('al_used', { usedTotal: { op: r.usedTotal, lbl: num(tt) }, rows: { op: n, cart: d.querySelectorAll('.Ere_usedsell_table input[name^="chkCart."]').length || null }, lastPage: { op: r.lastPage } }); });
    wrap(PR, 'parseSearchResults', (a, r) => { const d = a[0]; if (!d || !d.querySelectorAll || !once(d, 's')) return; const B = [...d.querySelectorAll('.ss_book_box')].slice(0, 60); obs('al_list', 'op', { n: 1, ok: r && r.length ? 1 : 0 });
      const T = {}; (r || []).slice(0, 60).forEach((x, i) => { const b = B[i]; const lk = b && b.querySelector('a.bo3'); AG.agFillAdd(T, AG.agFillTally({ itemId: { op: x.itemId, attr: b ? b.getAttribute('itemid') : null, href: lk ? ((lk.getAttribute('href') || '').match(/ItemId=(\d+)/i) || [])[1] || null : null }, title: { op: x.title || null }, img: { op: x.img || null } }, { main: 'op' }).t); }); AG.agFillAdd(box('al_list').fl, T); });
    wrap(PR, 'parseScmList', (a, r) => { const d = a[0]; if (!r || !d || !once(d, 'm')) return; rows('al_scm', 'op', r.rows, (x) => ({ listingId: x.listingId, title: x.title, price: x.price, qty: x.qty, status: x.status, sku: x.sku, registeredAt: x.registeredAt })); });
    wrap(PR, 'parseYes24Search', (a, r) => { const d = a[0]; if (!d || !d.querySelectorAll || !once(d, 'ys')) return; const hubs = new Set([...d.querySelectorAll('a[href*="UsedShopHub/Hub/"]')].map((x) => ((x.getAttribute('href') || '').match(/Hub\/(\d+)/) || [])[1]).filter(Boolean)); obs('y24_list', 'op', { n: 1, ok: r && r.length ? 1 : 0 });
      AG.agFillAdd(box('y24_list').fl, AG.agFillTally({ rows: { op: r ? r.length || null : null, href: hubs.size || null } }, { main: 'op' }).t); const T = {}; for (const x of (r || []).slice(0, 40)) AG.agFillAdd(T, AG.agFillTally({ hubId: { op: x.hubId }, title: { op: x.title || null }, total: { op: x.total }, newPrice: { op: x.newPrice } }).t); AG.agFillAdd(box('y24_list').fl, T); });
    wrap(PR, 'parseYes24Hub', (a, r) => { const d = a[0]; if (!r || !d || !once(d, 'yh')) return; rows('y24_hub', 'op', r.offers, (x) => ({ price: x.price, grade: x.grade, shopId: x.shopId, ship: x.ship, ratingCount: x.ratingCount })); });
    wrap(PR, 'parseYes24Shop', (a, r) => { const d = a[0]; if (!r || !d || !once(d, 'yp')) return; fill('y24_shop', { shopName: { op: r.shopName }, score: { op: r.score }, ratingCount: { op: r.ratingCount }, totalItems: { op: r.totalItems }, shipFee: { op: r.shipFee } }); });
  }
  if (SL) wrap(SL, 'parseShopSummary', (a, r) => { const d = a[0]; if (!r || !d || !once(d, 'ss')) return; fill('seller_shop', { rev6m: { op: r.rev6m != null ? r.rev6m : r.rev6mLt3 ? 'lt3' : null }, grade: { op: r.grade }, total: { op: r.total != null ? r.total : r.totalLt3 ? 'lt3' : null }, status: { op: r.status || null } }); });
  if (EX && typeof EX.run === 'function' && !EX.run.__rnAg) { const f0 = EX.run; const w = async function (src, a) { const t0 = Date.now(); const r = await f0.apply(this, arguments); try { if (r && !r.skip) { const s = (EX.SOURCES || {})[src] || {}; obs('ext', String(src), { n: 1, ok: r.ok === false ? 0 : 1, ms: Date.now() - t0, raw: r.ok === false && r.why ? String(r.why).slice(0, 200) : null, good: r.ok !== false }); fill('ext', { ['grp_' + (s.grp || 'etc')]: { [String(src)]: r.ok === false ? null : 1 } }, { rec: false }); } } catch (e) {} return r; }; w.__rnAg = 1; try { EX.run = w; } catch (e) {} }
})();


}]);
