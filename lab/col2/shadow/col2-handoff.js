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
  };
  /* (11/11 col2rep5) 🔀 외부 정보 다른 출처도 국중과 같은 길로 — 운영 extSave(모든 출처 같은 함수)와 같은 쓰기: 같으면 확인 시각만 · 바뀌면 옛 값을 ext_hist에 먼저 · 기본 정보는 '없음'이면 받아 둔 값 그대로 · 출처 색인
   *  나눔: ISBN 있는 책은 번외(다시 볼 날 = 운영 공용 파일 기본 — 기본 정보 120일 · 장터 7일 · 해외 14일 · 전자책 30일) · ISBN 없는 상품(장터 시세만)·국중 날짜 차례는 운영 그대로
   *  [넘기기] 단추는 최근 3일 그림자에서 '넘길 수 있음'·까닭 모를 다름 0인 일에만 보임(쓰는 길이 있다고 바로 넘기지 않음)
   *  뺀 것: 🅣 알라딘 TTB(알라딘이 이 주소 서비스를 끝냄 · 로거는 안 씀) · 📚 도서관 정보나루(사무실 PC 공인 IP가 키 계정에 없어 사무실 번외는 못 읽음 — 운영 로거만 됨) · 💱 환율(위 'once' 길) */
  const EXT_HO = [['kyobo', '🔎 교보문고', 'ext_basic'], ['yes24', '🔎 예스24 도서 정보', 'ext_basic'], ['naverbook', '🔎 네이버 도서(화면)', 'ext_basic'], ['google', '🔎 구글 북스', 'ext_basic'], ['kakao', '🔎 카카오 책 검색', 'ext_basic'],
    ['joongmo', '🔎 중고닷(통합 장터)', 'ext_used'], ['yes24used', '🔎 예스24 중고', 'ext_used'], ['bunjang', '🔎 번개장터', 'ext_used'], ['joongna', '🔎 중고나라', 'ext_used'], ['daangn', '🔎 당근', 'ext_used'], ['dvdprime', '🔎 DVDPrime 장터', 'ext_used'],
    ['ebay', '🔎 eBay(공식)', 'ext_foreign'], ['abebooks', '🔎 AbeBooks', 'ext_foreign'], ['ridi', '🔎 리디(전자책)', 'ext_ebook']];
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
  function candidates(jdays) { const by = {};
    for (const j of jdays || []) { const T = (j && j.tasks) || {}; for (const [k, s] of Object.entries(T)) { if (!s || !s.pass) continue; const o = by[k] || (by[k] = { k, name: s.name || k, days: new Set(), canDays: new Set(), n: 0, same: 0, un: 0, pcs: {} });
      o.days.add(j.d); o.n += +s.n || 0; o.same += +s.same || 0; o.un += +s.un || 0; if (s.pass.can) o.canDays.add(j.d); const p = o.pcs[j.pc] || (o.pcs[j.pc] = { n: 0, can: 0 }); p.n += +s.n || 0; if (s.pass.can) p.can++; } }
    return Object.values(by).map((o) => { const pc = pickPc(o.k, o.pcs); return { k: o.k, name: o.name, days: o.days.size, canDays: o.canDays.size, n: o.n, same: o.same, un: o.un, pc: pc ? pc[0] : null, path: !!JOBS[o.k], can: o.canDays.size > 0 && o.un === 0 }; })
      .filter((o) => o.can).sort((a, b) => b.canDays - a.canDays || b.same - a.same); }
  const api = { EXT_HO, PC_PLAN, planPc, JOBS, DOC, state, mine, writeOk, candidates, extPlan, shard };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2Handoff = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
