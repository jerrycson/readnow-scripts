/* col2-handoff.js — (11/11 col2rep2 · 약속 38·48 '번외로 모두 바꾸기 ⑤ 일 하나씩 넘기기') 그림자 → 넘김 규칙 한 곳 (순수 · Node·브라우저·웹앱 같이)
 * 넘김 = 그 일을 운영 수집기(Tampermonkey)가 멈추고 번외가 운영 칸에 대신 씀 · 되돌리기 = 문서 한 칸(on:false)만 바꾸면 운영이 바로 다시 함
 *  · 설정 문서: app_settings/col2_handoff = { jobs: { <일>: { on, pc, at, by, beat, why } }, log: [ {k, on, pc, at, by} … 40줄 ] }
 *     on   = 넘김 켬(웹앱 ⚙ › 🔀 번외로 넘기기 [넘기기] 두 번 누름) · pc = 운영 칸에 쓰는 번외 PC(한 대만 — 두 PC가 같은 문서를 번갈아 쓰지 않게)
 *     beat = 그 PC 번외가 그 일을 마지막으로 해낸 때(웹앱이 30분에 한 번까지 적음) — beatMaxH 시간 넘게 소식이 없으면 운영 수집기가 스스로 다시 함(번외가 죽어도 일이 멈추지 않음)
 *  · 쓰는 길: 번외 도우미 → 그 PC 웹앱(이미 로그인)이 대신 씀 — 이 표의 col·idRe·fields 안만(그 밖은 웹앱이 거절) · 손님 정보 칸 없음
 *  · 운영 쪽 끄기: 수집기 본문(머리 그대로)이 같은 문서를 읽고 그 일의 그 부분만 건너뜀(아래 ops) */
(function (root) {
  'use strict';
  const JOBS = {
    kpipa: { name: '📚 출판 판매 통계(KPIPA) — 최근 7일 일별 표', col: 'mkt_kpipa', idRe: '^\\d{8}$', fields: ['date', 'onOff', 'bookType'], hist: true, everyH: 3, beatMaxH: 8,
      ops: "운영 kpipaJob의 '최근 7일 일별 표(판매채널별·도서유형별)'만 건너뜀 — 730일 빈 날 채우기·주제분류·더 가져오기는 운영 그대로",
      why: '두 PC 그림자 42줄 모두 같음(11/11 HOME 28 · JS-MAIN 14) · 운영과 같은 해석 함수(kpParse·kpFetch 글자 그대로)' },
    /* (11/11 col2rep3) 🔎 국립중앙도서관 ISBN 서지 — 운영 extSave와 같은 쓰기: 같으면 확인 시각(chk)만 · 바뀌면 옛 값을 ext_hist에 남긴 뒤 바꿈 · 받아 둔 값이 있는데 '없음'이면 받아 둔 값 그대로(noneAt만) · 출처 색인 ext_index/nl_<조각>
     *  번외는 지문(sig)까지 운영 공용 파일(ReadnowExt.sig)로 만들어 넘기고, 웹앱이 운영 문서를 다시 읽어 견준 뒤 씀(번외가 받아 둔 옛 문서로 판단하지 않음) */
    'ext.nl': { name: '🔎 국립중앙도서관 ISBN 서지', col: 'ext_basic', idRe: '^97[89]\\d{10}$', fields: ['obj', 'title', 'author'], mode: 'ext', src: 'nl', refreshDays: 120, everyH: 0, beatMaxH: 8,
      ops: "운영 외부 정보 한 바퀴(extFill)가 국립중앙도서관을 묻지 않음 — 다시 볼 날(120일)·옛 값 보관·색인은 번외가 운영과 같은 규칙으로 · 국중 날짜 차례(우리 책이 아닌 책)는 운영 그대로",
      why: '11/11 HOME 40건·JS-MAIN 27건 모두 같음(운영 공용 파일 ReadnowExt.run·sig 그대로)' },
    /* (11/11 col2rep3) 🔍 새상품 없는 시세 — 운영 nbMarketJob 쓰기 그대로(번외가 글자 그대로 떼어 온 nbMarketJob이 만든 문서): 후보가 바뀌면 판(v)을 통째로 보관 · 시세가 바뀌면 history 한 줄
     *  나눔: 처음 보는 상품은 운영 · 이미 본 상품 다시 보기(7일마다)는 번외 */
    nbMarket: { name: '🔍 새상품 없는 시세(미등록·세트)', col: 'prd_market_nobook', idRe: '^[\\w.-]{1,150}$', fields: ['main', 'vdoc', 'sig', 'hist'], mode: 'nb', nbDays: 7, everyH: 0, beatMaxH: 48,
      ops: '운영 nbMarketJob은 처음 보는 상품만 — 이미 본 상품의 다시 보기(7일마다)는 번외',
      why: "11/11 HOME 40·JS-MAIN 33 — 다른 것은 모두 '때가 다름'(움직이는 시세 · 운영이 읽은 뒤 바뀜)" },
    /* (11/11 col2rep3) 💱 환율 — 운영 extFx와 같은 쓰기: ext_fx/<고시일> 이 없을 때만 만듦 · 출처가 수출입은행(koreaexim)일 때만(운영과 같은 출처) */
    'ext.fx': { name: '💱 환율(수출입은행)', col: 'ext_fx', idRe: '^\\d{4}-\\d{2}-\\d{2}$', fields: ['date', 'rates', 'src', 'warn'], mode: 'once', srcOnly: 'koreaexim', everyH: 24, beatMaxH: 30,
      ops: '운영 extFx(하루 한 번 환율)가 쉼 — 번외가 한국 11:35 뒤 수출입은행 고시를 받아 없을 때만 씀',
      why: '11/11 HOME 같음 1 · JS-MAIN은 키가 늦게 와 frankfurter(출처 다름) → 이번 판부터 키가 온 뒤·11:35 뒤에만 읽음' },
    /* (11/12 handoff2 · 약속 0) 🌐 로거 고유 일 — lg:true = 로거 칸(맡을 PC는 하루 요약 kind 'logger'인 PC만 · 사무실 PC는 맡지 못함 · 로거는 사무실 일을 맡지 못함)
     *  mode 'plan' = 운영 쓰기 규칙을 아래 plan() 한 곳에(순수) — 웹앱·클라우드가 reads()의 운영 문서를 그 자리에서 다시 읽고 plan()이 낸 쓰기만 함(cols 밖 칸은 거절)
     *  나눔: 번외가 먼저 읽어 쓴 것(dynAt · rev6mAt)은 운영 수집기가 자기 규칙(30일 · 7일)으로 저절로 건너뜀 → 운영 수집기 본문은 그대로(머리·모듈 안 바뀜) */
    dynamic: { name: '👥 구매자 분포·함께 산 책', col: 'prd_book_metrics', cols: ['prd_book_metrics', 'prd_dyn_history'], idRe: '^[\\w.-]{1,150}$', fields: ['dyn'], mode: 'plan', lg: true, dynDays: 30, everyH: 0, beatMaxH: 8,
      ops: "운영 dynJob과 같은 쓰기(prd_book_metrics 구매자 분포·함께 산 책·dynAt · 바뀌면 prd_dyn_history 한 줄) — 번외가 먼저 읽은 책은 운영 dynJob이 30일 규칙(dynAt)으로 저절로 건너뜀 · 번외 로거가 읽는 책 = 운영 로거가 방금 시장 지표를 읽은 책(우리 도서 목록은 로거에 안 감 · 약속 0)",
      why: '운영 dynOne 쓰기 규칙 그대로(plan) · 읽기는 운영 getProductFull 글자 그대로' },
    shopSum: { name: '🏪 숍 요약 — 6개월 평가 수·등급·품절취소율', col: 'sellers', cols: ['sellers', 'seller_history', 'seller_rev6m', 'app_settings'], ids: { app_settings: '^seller_queue$' }, idRe: '^sc_\\d{1,10}$', fields: ['shop', 'ver'], mode: 'plan', lg: true, rev6mDays: 7, everyH: 0, beatMaxH: 30,
      ops: "운영 rev6mJob('오래된 것')과 같은 쓰기(sellers 칸 · 숍 화면이 바뀌면 seller_history · 날마다 seller_rev6m · 모으기 줄에서 뺌) — 7일 넘은 판매자만 · 번외가 먼저 읽은 판매자는 운영이 7일 규칙(rev6mAt)으로 저절로 건너뜀 · 전체 다시 읽기(수동)는 운영 그대로",
      why: '운영 rev6mJob 쓰기 규칙 그대로(plan) · 해석은 운영 공용 파일 parseShopSummary 그대로' },
  };
  /* (11/11 col2rep5) 🔀 외부 정보 다른 출처도 국중과 같은 길로 — 운영 extSave(모든 출처 같은 함수)와 같은 쓰기: 같으면 확인 시각만 · 바뀌면 옛 값을 ext_hist에 먼저 · 기본 정보는 '없음'이면 받아 둔 값 그대로 · 출처 색인
   *  나눔: ISBN 있는 책은 번외(다시 볼 날 = 운영 공용 파일 기본 — 기본 정보 120일 · 장터 7일 · 해외 14일 · 전자책 30일) · ISBN 없는 상품(장터 시세만)·국중 날짜 차례는 운영 그대로
   *  [넘기기] 단추는 최근 3일 그림자에서 '넘길 수 있음'·까닭 모를 다름 0인 일에만 보임(쓰는 길이 있다고 바로 넘기지 않음)
   *  뺀 것: 🅣 알라딘 TTB(알라딘이 이 주소 서비스를 끝냄 · 로거는 안 씀) · (11/12 handoff2) 📚 도서관 정보나루는 이제 넣음(IP가 키 계정에 있어 넘길 수 있음이 난 PC만) · 💱 환율(위 'once' 길) */
  const EXT_HO = [['kyobo', '🔎 교보문고', 'ext_basic'], ['yes24', '🔎 예스24 도서 정보', 'ext_basic'], ['naverbook', '🔎 네이버 도서(화면)', 'ext_basic'], ['google', '🔎 구글 북스', 'ext_basic'], ['kakao', '🔎 카카오 책 검색', 'ext_basic'],
    ['joongmo', '🔎 중고닷(통합 장터)', 'ext_used'], ['yes24used', '🔎 예스24 중고', 'ext_used'], ['bunjang', '🔎 번개장터', 'ext_used'], ['joongna', '🔎 중고나라', 'ext_used'], ['daangn', '🔎 당근', 'ext_used'], ['dvdprime', '🔎 DVDPrime 장터', 'ext_used'],
    ['ebay', '🔎 eBay(공식)', 'ext_foreign'], ['abebooks', '🔎 AbeBooks', 'ext_foreign'], ['ridi', '🔎 리디(전자책)', 'ext_ebook'],
    ['lib', '🔎 도서관 정보나루', 'ext_lib']]; /* (11/12 handoff2) 정보나루도 같은 길 — 그 PC 공인 IP가 키 계정에 있어 그림자 '넘길 수 있음'이 나온 PC만 맡음(candidates) · 운영 extFill hoX가 이미 모든 출처를 봄 */
  for (const [src, name, col] of EXT_HO) JOBS['ext.' + src] = { name, col, idRe: '^97[89]\\d{10}$', fields: ['obj', 'title', 'author'], mode: 'ext', src, everyH: 0, beatMaxH: 8,
    ops: `운영 외부 정보 한 바퀴(extFill)가 ${name.replace(/^🔎 /, '')}에서 ISBN 있는 책을 묻지 않음 — 다시 볼 날·옛 값 보관·색인은 번외가 운영과 같은 규칙으로 · ISBN 없는 상품은 운영 그대로`,
    why: '운영 공용 파일 ReadnowExt.run·sig 그대로 · 웹앱이 운영 문서를 다시 읽고 extSave와 같은 판단으로 씀' };
  /* (11/11 col2rep5 · 정범님 11/11 'JS-MAIN에도 번외가 깔림') 맡길 PC 차림표 — 그 PC가 '넘길 수 있음'을 낸 적이 있으면 그 PC가 [넘기기] 단추의 기본(없으면 표본 많은 PC)
   *  HOME = 바깥 사이트 일(외부 정보·KPIPA·환율) — HOME은 알라딘 하루 몫 1,600장을 상품 화면이 새벽에 다 쓰지만 바깥 사이트 몫은 따로라 남음 · 표본도 가장 많음(11/11 국중 368·eBay 34·리디 40)
   *  JS-MAIN = 알라딘 화면을 읽는 일(🔍 새상품 없는 시세 = 알라딘 중고 검색) — 11/11 알라딘 몫 642/1,600장만 씀 · 사무실 상시 켜짐 · 알라딘 로그인 그림자(읽기·쓰기)도 이 PC */
  const PC_PLAN = { kpipa: 'HOME', 'ext.fx': 'HOME', 'ext.nl': 'HOME', nbMarket: 'JS-MAIN', 'ext.*': 'HOME' };
  const planPc = (k) => PC_PLAN[k] || (/^ext\./.test(k) ? PC_PLAN['ext.*'] : null);
  const pickPc = (k, pcs) => { const P = planPc(k); const x = P && Object.entries(pcs).find(([pc, v]) => pc.toUpperCase() === P && v.can > 0); return x || Object.entries(pcs).sort((a, b) => b[1].can - a[1].can || b[1].n - a[1].n)[0]; };
  const DOC = { col: 'app_settings', id: 'col2_handoff' };
  /* 그 일이 넘겨져 있나 — { on(켬) · pc(맡은 PC) · fresh(맡은 PC 소식이 beatMaxH 안) · live(on && fresh = 운영이 쉬어도 됨) } */
  function state(doc, k, t) { const J = JOBS[k]; const x = (doc && doc.jobs && doc.jobs[k]) || null; if (!J || !x || x.on !== true) return { on: false, pc: null, fresh: false, live: false };
    const beat = Date.parse(x.beat || '') || +x.beat || 0; const at = Date.parse(x.at || '') || +x.at || 0; const ref = Math.max(beat, at); /* 막 넘긴 때는 켠 시각부터 셈 */
    const fresh = !!ref && (t || Date.now()) - ref < J.beatMaxH * 3600e3; return { on: true, pc: String(x.pc || ''), fresh, live: fresh, beat: beat || null, at: at || null }; }
  /* 이 PC 번외가 운영 칸에 써도 되나 */
  const mine = (doc, k, pc) => { const s = state(doc, k); return s.on && !!pc && s.pc.toUpperCase() === String(pc).toUpperCase(); };
  /* 웹앱이 대신 쓸 때 — 그 일 · 그 칸 · 그 문서 이름 꼴 · 정한 칸만(그 밖 칸은 버림) */
  function writeOk(doc, it, pc) { const k = String((it && it.job) || ''); const J = JOBS[k]; if (!J) return { ok: false, why: '넘김 표에 없는 일' };
    if (!mine(doc, k, pc)) return { ok: false, why: '이 PC로 넘긴 일이 아님(⚙ 🔀 번외로 넘기기)' }; if (it.c !== J.col) return { ok: false, why: `${k}는 ${J.col} 칸에만` };
    if (!new RegExp(J.idRe).test(String(it.id || ''))) return { ok: false, why: '문서 이름 꼴이 다름' };
    const v = {}; for (const f of J.fields) if (it.v && it.v[f] !== undefined) v[f] = it.v[f]; if (!Object.keys(v).length) return { ok: false, why: '쓸 칸이 없음' };
    if (J.mode === 'ext' && !(v.obj && typeof v.obj === 'object' && typeof v.obj.sig === 'string' && v.obj.sig)) return { ok: false, why: '지문(sig) 없는 결과' };
    if (J.mode === 'nb' && !(v.main && typeof v.main === 'object' && v.main.src === 'usedSearch' && typeof v.sig === 'string')) return { ok: false, why: '시세 문서 꼴이 다름' };
    if (J.mode === 'once' && J.srcOnly && v.src !== J.srcOnly) return { ok: false, why: `출처가 ${J.srcOnly}가 아님(운영과 같은 출처만)` };
    if (J.mode === 'plan') { const bad = planBad(k, v); if (bad) return { ok: false, why: bad }; }
    return { ok: true, v }; }
  /* (11/11 col2rep3) 운영 extSave 판단 그대로(순수) — cur = 운영 문서(ext_basic/<ISBN>) · sameSig = 운영 공용 파일 ReadnowExt.sameSig · obj = 번외 결과 {at, chk, sig, none, d, by, q}
   *  → { st: same|keep|none1|changed|new, hist: 옛 값 보관 문서(없으면 null), up: 고칠 칸 } · 웹앱이 같은 규칙으로 씀(tCOL2HO가 견줌) */
  function extPlan(cur, src, obj, grp, sameSig) { const prev = cur && cur.src ? cur.src[src] : null; const now = obj.chk || obj.at;
    const same = !prev ? '' : sameSig ? sameSig(src, prev, obj.sig) : prev.sig === obj.sig ? 'sig' : ''; /* 운영 ReadnowExt.sameSig — 'resign' = 옛 방식 지문이지만 받아 둔 값으로 다시 만들면 같음(지문만 고쳐 적음) */
    if (same) return { st: 'same', hist: null, up: { chk: now, errDel: true, noneDel: true, ...(same === 'resign' ? { sig: obj.sig } : {}) } };
    if (obj.none && prev && prev.d && !prev.none && grp === 'basic') return { st: 'keep', hist: null, up: { noneAt: prev.noneAt || now, chk: now, errDel: true } };
    if (obj.none && prev && prev.d && !prev.none && !prev.noneAt) return { st: 'none1', hist: null, up: { noneAt: now, chk: now, errDel: true } };
    const hist = prev && prev.at ? { at: prev.at, chk: prev.chk || null, none: !!prev.none, d: prev.d ?? null, sig: prev.sig || null } : null; return { st: prev ? 'changed' : 'new', hist, up: { obj } }; }
  const shard = (isbn) => (+String(isbn).slice(-2) || 0) % 8; /* 운영 ReadnowExt.shard와 같음(출처 색인 8조각) */
  /* 넘김 후보 — 하루 요약(col2_jday 여러 날·여러 PC)에서 일마다 '넘길 수 있음'이 나온 날 수·표본·까닭 모를 다름 · 넘김 표(JOBS)에 쓰는 길이 있는 일만 [넘기기] 가능
   *  차례 = 같음이 오래(날 수) → 표본 많음 · pc = 표본이 가장 많은 PC */
  /* (11/12 col2rep6) 맡을 PC = 그 일을 하는 번외 판(외부 정보 14곳 0.1.26 · 그 밖 0.1.25) · 최근 3시간 안 하루 요약을 올린 PC만 — 웹앱 c2HoCand와 같음 · 없으면 pc null + no(까닭) */
  const MINV = (k) => (JOBS[k] && JOBS[k].mode === 'plan') || k === 'ext.lib' ? '0.1.41' : (/^ext\./.test(k) && !['ext.nl', 'ext.fx'].includes(k) ? '0.1.26' : '0.1.25'); /* (11/12 handoff2) 로거 칸 일·정보나루는 0.1.41부터 */ const FRESH_H = 3;
  const verGE = (a, b) => { const x = String(a || '').split('.').map((n) => +n || 0), y = String(b || '').split('.').map((n) => +n || 0); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return true; };
  function candidates(jdays, t) { t = t || Date.now(); const by = {}; const last = {}; for (const j of jdays || []) { const a = Date.parse((j && j.at) || '') || 0; const u = String((j && j.pc) || ''); if (!last[u] || a > last[u].at) last[u] = { at: a, ver: (j && j.ver) || null, kind: (j && j.kind) || (/^LOGGER/i.test(u) ? 'logger' : 'office') }; }
    for (const j of jdays || []) { const T = (j && j.tasks) || {}; for (const [k, s] of Object.entries(T)) { if (!s || !s.pass) continue; const o = by[k] || (by[k] = { k, name: s.name || k, days: new Set(), canDays: new Set(), n: 0, same: 0, un: 0, pcs: {} });
      o.days.add(j.d); o.n += +s.n || 0; o.same += +s.same || 0; o.un += +s.un || 0; if (s.pass.can) o.canDays.add(j.d); const p = o.pcs[j.pc] || (o.pcs[j.pc] = { n: 0, can: 0 }); p.n += +s.n || 0; if (s.pass.can) p.can++; } }
    return Object.values(by).map((o) => { const mv = MINV(o.k); const okPc = (x) => { const l = last[x] || {}; return verGE(l.ver, mv) && l.at && t - l.at < FRESH_H * 3600e3 && kindOk(o.k, l.kind); }; /* (11/12 handoff2 · 약속 0) 로거 칸 일은 로거 PC만 · 사무실 일은 사무실 PC만 */ const E = Object.fromEntries(Object.entries(o.pcs).filter(([x, v]) => v.can > 0 && okPc(x))); const pc = Object.keys(E).length ? pickPc(o.k, E) : null;
      const no = pc ? null : Object.keys(o.pcs).map((x) => { const l = last[x] || {}; return `${x} ${!kindOk(o.k, l.kind) ? (JOBS[o.k] && JOBS[o.k].lg ? '로거 칸 일 — 사무실 PC는 맡지 못함(약속 0)' : '사무실 일 — 로거 PC는 맡지 못함(약속 0)') : !verGE(l.ver, mv) ? `번외 ${l.ver || '?'}(${mv} 이상 필요)` : `${Math.round((t - l.at) / 3600e3)}시간째 소식 없음`}`; }).join(' · ');
      return { k: o.k, name: o.name, days: o.days.size, canDays: o.canDays.size, n: o.n, same: o.same, un: o.un, pc: pc ? pc[0] : null, no, path: !!JOBS[o.k], can: o.canDays.size > 0 && o.un === 0 }; })
      .filter((o) => o.can).sort((a, b) => b.canDays - a.canDays || b.same - a.same); }

  /* ══ (11/12 handoff2 · 리드 '묶음째 넘기기') ══════════════════════════════════════════════
   * ① 로거 칸 — 로거 고유 일(lg)은 하루 요약 kind 'logger'인 PC만 맡음 · 사무실 일은 로거 PC가 못 맡음(약속 0: 로거에 우리 매물·상품 이름·계정 없음) */
  const LG_K = ['dynamic', 'shopSum', 'metrics', 'usedPage', 'survey', 'bench', 'voice']; /* col2-tasks.js who 'logger'와 같음 */
  const kindOk = (k, kind) => { const J = JOBS[k]; const lg = String(kind || '') === 'logger'; return (J ? !!J.lg : LG_K.includes(k)) ? lg : !lg; };
  /* ② mode 'plan' — 운영 쓰기 규칙 한 곳(순수). reads(k,id) = 웹앱·클라우드가 그 자리에서 다시 읽을 운영 문서 · plan(k,id,v,docs,o) = 쓸 것 [{c,id,v,set?,bare?}]
   *    v 안 특별 값: {$au:[…]} = arrayUnion · {$ar:[…]} = arrayRemove (쓰는 쪽이 FieldValue로 바꿈) · set:true = 덮어쓰기(운영 b.set 그대로) · bare:true = 쓴 이·시각 칸을 붙이지 않음(운영 그대로) */
  function planBad(k, v) { if (k === 'dynamic') return v.dyn && typeof v.dyn === 'object' && !Array.isArray(v.dyn) ? '' : '구매자 분포 값 꼴이 다름';
    if (k === 'shopSum') return v.shop && typeof v.shop === 'object' && typeof v.shop.status === 'string' ? '' : '숍 요약 값 꼴이 다름'; return '모르는 plan 일'; }
  function reads(k, id) { if (k === 'dynamic') return [['prd_dyn_history', String(id)]]; if (k === 'shopSum') return [['sellers', String(id)], ['app_settings', 'seller_queue']]; return []; }
  const noU = (o) => { for (const x of Object.keys(o)) if (o[x] === undefined) delete o[x]; return o; }; /* 운영 Firestore가 undefined 칸을 버리는 것과 같게 */
  function plan(k, id, v, docs, o) { docs = docs || {}; o = o || {}; const now = o.now || new Date().toISOString(); const day = o.day || new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); const W = []; id = String(id);
    if (k === 'dynamic') { /* 운영 dynOne(readnow-collector.src.js) 그대로 */ const p = v.dyn || {}; const upd = { dynTriedAt: now, dynLoaded: !!p.dynamicLoaded };
      if (p.buyerDist) upd.buyerDist = p.buyerDist; if (Array.isArray(p.relationBuy) && p.relationBuy.length) { upd.relationBuy = p.relationBuy.map((x) => x && x.title); upd.relationBuyIds = p.relationBuy; } if (Array.isArray(p.clickRelation) && p.clickRelation.length) upd.clickRelation = p.clickRelation; if (p.clickRaw) upd.clickRaw = p.clickRaw;
      if (upd.buyerDist || upd.relationBuyIds || upd.clickRelation) upd.dynAt = now;
      if (upd.buyerDist || upd.relationBuy || upd.clickRelation) { const hsig = JSON.stringify([upd.buyerDist || null, upd.relationBuy || null, upd.clickRelation || null]); const hp = docs['prd_dyn_history/' + id] || null;
        if (!hp || hp.lastSig !== hsig) W.push({ c: 'prd_dyn_history', id, v: { bookId: id, lastSig: hsig, snaps: { $au: [{ at: now, buyerDist: upd.buyerDist || null, relationBuy: upd.relationBuy || null, relationBuyIds: upd.relationBuyIds || null, clickRelation: upd.clickRelation || null, clickRaw: upd.clickRaw || null }] }, lastCheckedAt: now } });
        else W.push({ c: 'prd_dyn_history', id, v: { lastCheckedAt: now }, bare: true }); }
      W.push({ c: 'prd_book_metrics', id, v: { ...upd, dynamicPending: !(upd.buyerDist || upd.relationBuyIds) } }); return W; }
    if (k === 'shopSum') { /* 운영 rev6mJob 판매자 한 곳(readnow-collector.src.js) 그대로 */ const r = v.shop || {}; const sc = id.replace(/^sc_/, '');
      if (r.status === 'ok' || r.status === 'lt3') { const sNew = { rev6m: r.rev6m ?? null, rev6mLt3: r.rev6mLt3 ?? null, shopPeriods: r.periods ?? null, shopTotal: r.total ?? null, aladinGrade: r.grade ?? null, isPro: r.isPro ?? null, cancel3m: r.cancel3m ?? null, bizInfo: r.info || null, contactNote: r.infoNote || null };
        const sSig = JSON.stringify(sNew); const prev = docs['sellers/' + id] || {};
        if (prev.shopSig !== sSig) W.push({ c: 'seller_history', id: `${id}_${now.replace(/[:.]/g, '-')}`, v: { sellerId: id, sc, kind: 'shopSummary', at: now, ...sNew }, set: true });
        const q = docs['app_settings/seller_queue']; const qs = (q && Array.isArray(q.sc) ? q.sc : []).map(String); if (qs.includes(sc)) W.push({ c: 'app_settings', id: 'seller_queue', v: { sc: { $ar: [sc] } }, bare: true });
        W.push({ c: 'sellers', id, v: noU({ shopSig: sSig, sc, rev6m: r.rev6m, rev6mLt3: r.rev6mLt3, rev6mAt: now, shopPeriods: r.periods, shopTotal: r.total, shopTotalLt3: r.totalLt3, aladinGrade: r.grade, isPro: r.isPro, cancel3m: r.cancel3m, ...(r.info ? { bizInfo: r.info } : {}), ...(r.infoNote ? { contactNote: r.infoNote } : {}), shopAt: now }) });
        if (r.rev6m != null) W.push({ c: 'seller_rev6m', id, v: { sc, days: { [day]: r.rev6m } } }); return W; }
      W.push({ c: 'sellers', id, v: { rev6mTriedAt: now, rev6mTriedVer: v.ver || null } }); return W; }
    return W; }
  /* 쓸 것 검사(웹앱·클라우드 같이) — 그 일의 cols 칸 · 문서 이름 꼴 · 50개까지 */
  function planCheck(k, W) { const J = JOBS[k]; if (!J || J.mode !== 'plan') return '모르는 plan 일'; if (!Array.isArray(W) || !W.length || W.length > 50) return '쓸 것이 없음(또는 너무 많음)';
    for (const w of W) { if (!w || !(J.cols || [J.col]).includes(w.c)) return `${k}는 ${(J.cols || [J.col]).join('·')} 칸에만`; const re = (J.ids && J.ids[w.c]) || '^[\\w.-]{1,150}$'; if (!new RegExp(re).test(String(w.id || ''))) return '문서 이름 꼴이 다름'; if (!w.v || typeof w.v !== 'object') return '쓸 값이 없음'; } return ''; }
  /* (번외 쪽) 운영 규칙으로 '지금 써야 하나' — cur = 운영 문서(그림자 견줌에 받은 것) · 운영이 건너뛰는 책·판매자는 번외도 안 씀(값이 같아도 맥박은 남김) */
  function due(k, cur, t) { t = t || Date.now(); const J = JOBS[k] || {}; const ts = (x) => Date.parse(x || '') || 0;
    if (k === 'dynamic') { if (!cur) return true; const cut = t - (J.dynDays || 30) * 864e5; return cur.dynAt ? ts(cur.dynAt) < cut : !cur.dynTriedAt || ts(cur.dynTriedAt) < cut; }
    if (k === 'shopSum') { if (!cur) return true; const cut = t - (J.rev6mDays || 7) * 864e5; return (!cur.rev6mAt || ts(cur.rev6mAt) < cut) && !(cur.rev6mTriedAt && ts(cur.rev6mTriedAt) >= cut); }
    return true; }

  /* ③ 묶음 — 운영 수집기가 하는 일 68가지를 묶음째(웹앱 ⚙ › 🔀 번외로 넘기기). 일마다 { k, name, path(운영 칸에 쓰는 길 있음) · block(길이 없는 까닭) · login(로그인 필요) }
   *    판정(저절로): 넘김 = 문서 on · 넘길 수 있음 = 최근 3일 그림자 '넘길 수 있음' + 까닭 모를 다름 0 + 길 있음 + 맡을 PC 있음 · 그림자 중 = 길은 있는데 아직 기준 못 넘음(그 까닭) · 막힘 = 길 없음(까닭) */
  const BLOCK = {
    product: '운영은 상품 화면 한 번으로 도서 정보·번호 색인·상품 연결·시장 지표·중고 첫 쪽·순위 기간을 함께 씀(refreshOne0) — 📘·📈·🏷 셋을 같은 PC가 한 묶음으로 넘겨야 함 · 지금 번외는 📘은 사무실·📈🏷은 로거로 나뉨 → 같은 PC 묶음 길을 만든 뒤',
    metrics: '📘 공개 상품 화면과 같은 운영 함수(refreshOne0)가 함께 씀 — 📘·📈·🏷 한 묶음 길을 만든 뒤',
    usedPage: '📘 공개 상품 화면과 같은 운영 함수(refreshOne0)가 함께 씀 — 📘·📈·🏷 한 묶음 길을 만든 뒤',
    survey: "운영은 평가 글까지 여러 쪽을 읽어 seller_reviews에 달마다 쌓고 고르는 차례에 손님 연결 점수를 씀(로거에 줄 수 없음 · 약속 0) — 번외 그림자는 첫 쪽 날짜별 수만 → 여러 쪽 읽기·차례를 번외에 만든 뒤",
    bench: '운영은 숍 목록을 끝까지 읽어 사라짐·가격 바뀜·최저가 기록을 셈 — 번외 그림자는 첫 쪽 10줄 → 끝까지 읽기를 번외에 만든 뒤',
    voice: '🗣 판매자 글은 번외가 처음부터 따로 모음(col2_voice) — 운영에 같은 일이 없어 넘길 것 없음(운영 구매평 글은 ⭐ 숍 평가와 같은 함수)',
    'ext.ttb': '알라딘 OpenAPI 종료(2026-10-30) — 운영도 묻지 않음',
  };
  const ALR = [ /* 🟧 알라딘 샵매니저 읽기 22가지(lab/col2/LOGIN_PLAN.md R1~R22) — free = 로그인 없이 읽힘 */
    ['R1', '로그인 확인'], ['R2', '상품 조회 목록'], ['R3', '상품 찾기(키워드)'], ['R4', '상품 정보수정 화면 읽기'], ['R5', '주문확인요청'], ['R6', '발송 요청'], ['R7', '배송&구매확정전'], ['R8', '주문 엑셀 받기'],
    ['R9', '주문조회 목록'], ['R10', '주문 상세 팝업'], ['R11', '반품 목록'], ['R12', '묻고 답하기 목록'], ['R13', '문의 상세'], ['R14', '구매평 목록(판매자 화면)'], ['R15', '가게 설정·공지 읽기'], ['R16', '부가가치세 조회'],
    ['R17', '예치금(환급액)'], ['R18', '매입 신청 내역'], ['R19', '구매 내역'], ['R20', '매입가 조회', 'free'], ['R21', '추천 판매가', 'free?'], ['R22', '등록 보조 팝업']];
  const ALR_WHY = { login: '알라딘 판매자 로그인 필요 — 번외 창 로그인이 42FB(새 기기)로 막힘 · 로그인 길(가 평소 크롬 손발 · 나 쿠키 옮기기 · 다 사람이 한 번 로그인) 정범님 결정 전',
    free: '로그인 없이 읽히는 공개 화면(/shop/usedshop/wc2b_search) — 다만 운영에선 따로 도는 일이 아니라 ✍ W15 팔기 장바구니(매입 신청)의 앞 단계 → W15와 함께 넘김(따로 넘길 일 없음) · 시세 쪽 매입가는 🏷 중고 첫 쪽(buyback)이 이미 읽음',
    'free?': '공개 주소(/shop/usedshop/c2c_sales_ajax · 정가·등급으로 셈하는 값) — 운영은 ✍ 등록·등급 바꾸기(W6·W7) 안에서만 부름 → 그 쓰기와 함께 넘김 · 쿠키 없이 같은 답인지 아직 시험 안 함' };
  const BUNDLES = [
    { id: 'lg', name: '🌐 로거 고유 일', lg: true, note: '로거 PC 번외만 맡음 · 사무실과 엮지 않는 따로 칸(약속 0)', keys: ['dynamic', 'shopSum', 'metrics', 'usedPage', 'survey', 'bench', 'voice'] },
    { id: 'ext', name: '🔎 외부 정보·통계', note: '바깥 사이트 일 — 운영 extFill이 넘긴 출처는 ISBN 있는 책을 묻지 않음', keys: ['ext.nl', 'ext.lib', 'ext.kakao', 'ext.kyobo', 'ext.google', 'ext.yes24', 'ext.naverbook', 'ext.ttb', 'ext.joongmo', 'ext.yes24used', 'ext.bunjang', 'ext.joongna', 'ext.daangn', 'ext.dvdprime', 'ext.ebay', 'ext.abebooks', 'ext.ridi', 'ext.fx', 'kpipa'] },
    { id: 'pub', name: '📘 알라딘 공개 화면(사무실)', note: '로그인 없는 알라딘 화면 — 사무실 PC', keys: ['product', 'nbMarket'] },
    { id: 'alr', name: '🟧 알라딘 샵매니저 읽기', note: '22가지 — 로그인 없이 되는 것과 로그인이 필요한 것을 나눔', keys: ALR.map((x) => 'al.' + x[0]) },
  ];
  /* 묶음 보기 — jdays(최근 3일 col2_jday) · doc(app_settings/col2_handoff) → [{ id, name, items:[{k,name,st,why,pc}] , n:{on,can,shadow,block}, can:[넘길 수 있는 일 k…] }] */
  function bundleView(jdays, doc, t) { t = t || Date.now(); const cand = {}; for (const c of candidates(jdays, t)) cand[c.k] = c; const lastWhy = {}; const nameOf = {};
    for (const j of jdays || []) for (const [k, s] of Object.entries((j && j.tasks) || {})) { if (!s) continue; nameOf[k] = nameOf[k] || s.name; const a = Date.parse(j.at || '') || 0; if (!lastWhy[k] || a > lastWhy[k].a) lastWhy[k] = { a, why: (s.pass && s.pass.why) || '', pc: j.pc }; }
    return BUNDLES.map((B) => { const items = B.keys.map((k) => { const J = JOBS[k]; const st0 = state(doc, k, t); let name = (J && J.name) || nameOf[k] || k;
        if (/^al\./.test(k)) { const a = ALR.find((x) => 'al.' + x[0] === k) || []; name = `${a[0]} ${a[1]}`; const fr = a[2] || 'login'; return { k, name, st: 'block', login: fr === 'login', free: fr !== 'login', why: ALR_WHY[fr] }; }
        if (st0.on) return { k, name, st: 'on', pc: st0.pc, fresh: st0.fresh, why: st0.fresh ? `${st0.pc} 번외가 운영 칸에 씀` : `${J.beatMaxH}시간 넘게 소식 없음 — 운영 수집기가 다시 하는 중` };
        if (!J) return { k, name, st: 'block', why: BLOCK[k] || '운영 칸에 쓰는 길을 아직 안 만듦' };
        const c = cand[k]; if (c && c.pc) return { k, name, st: 'can', pc: c.pc, why: `'넘길 수 있음' ${c.canDays}일 · 견준 ${c.n}건 중 같음 ${c.same} · 까닭 모를 다름 0` };
        if (c && !c.pc) return { k, name, st: 'shadow', why: '맡을 PC 없음 — ' + (c.no || '') };
        const L = lastWhy[k]; return { k, name, st: 'shadow', why: L ? `그림자 중 — ${L.why || '기준 못 넘음'}(${L.pc})` : '그림자 표본 없음(최근 3일 하루 요약에 이 일이 없음)' }; });
      const n = { on: 0, can: 0, shadow: 0, block: 0 }; for (const x of items) n[x.st]++; return { id: B.id, name: B.name, note: B.note, lg: !!B.lg, items, n, can: items.filter((x) => x.st === 'can').map((x) => ({ k: x.k, pc: x.pc })), on: items.filter((x) => x.st === 'on').map((x) => x.k) }; }); }
  const api = { LG_K, kindOk, planBad, reads, plan, planCheck, due, BLOCK, ALR, ALR_WHY, BUNDLES, bundleView, EXT_HO, PC_PLAN, planPc, JOBS, DOC, state, mine, writeOk, candidates, extPlan, shard };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2Handoff = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
