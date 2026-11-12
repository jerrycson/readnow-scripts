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
    /* (11/12 handoff3 · 리드 '벤치마킹 넘기는 길') 🎯 집중 벤치마킹 — 숍 목록 끝까지(작은 숍부터 · 끝 쪽 maxPages 이하)
     *  읽기: 번외 로거가 1쪽~끝 쪽(한 쪽 48개 · 운영 benchUrl 꼴 그대로) · 해석 = 운영 본체 benchParse·benchLastPage 글자 그대로(떼어 씀)
     *  쓰기: 웹앱·클라우드가 운영 본체 benchFinish를 글자 그대로 떼어(benchCode) 진짜 Firestore로 부름 → bench_items·bench_days·bench_state(+조각)가 운영 회차와 똑같은 규칙(새로 올림·사라짐·값 바뀜·최저가·통계)
     *  나눔: 운영의 판매자 잡기(prd_jobs/bclaim_<숍> · 4분 신호)를 번외도 잡음 → 운영 benchOneT가 '다른 PC가 읽는 중'·'이번 실행 중에 이미 끝냄'으로 저절로 건너뜀(운영 수집기 본문·머리 그대로)
     *  그사이 운영이 그 숍을 끝냈으면(번외가 읽기 시작할 때 본 bench_state.endAt과 다름) 쓰지 않음 · 테더링: 로거 그림자 하루 몫(LOGGER.dayCap) 안에서만 쪽을 읽음 */
    bench: { name: '🎯 집중 벤치마킹 — 숍 목록 끝까지', col: 'bench_state', cols: ['bench_state', 'bench_days', 'bench_items', 'prd_jobs'], idRe: '^\\d{1,10}$', fields: ['run', 'claim'], mode: 'bench', lg: true, shadowK: 'benchFull', maxPages: 40, maxItems: 4000, everyH: 0, beatMaxH: 30,
      ops: "운영 benchJob이 그 숍을 '다른 PC가 읽는 중'(번외 잡기 신호)·'이번 실행 중에 이미 끝냄'(번외가 쓴 bench_state)으로 저절로 건너뜀 — 큰 숍(끝 쪽 40쪽 넘음)·상품 페이지 정보(benchDetail)·이어 읽기는 운영 그대로",
      why: '읽기 = 운영 benchParse·benchLastPage 글자 그대로 · 쓰기 = 운영 benchFinish 글자 그대로(웹앱·클라우드가 떼어 부름) · 그림자 = 숍 끝까지 읽은 목록을 운영 bench_state 지금 목록과 견줌' },
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
    if (!mine(doc, k, pc)) return { ok: false, why: '이 PC로 넘긴 일이 아님(⚙ 🔀 번외로 넘기기)' }; const clm = J.mode === 'bench' && it.c === 'prd_jobs' && /^bclaim_\d{1,10}$/.test(String(it.id || '')); /* (11/12 handoff3) 🎯 잡기 신호는 운영 잡기 문서 이름으로(회차와 따로 — 번외 내보내기 줄이 서로 덮지 않게) */ if (it.c !== J.col && !clm) return { ok: false, why: `${k}는 ${J.col} 칸에만` };
    if (!clm && !new RegExp(J.idRe).test(String(it.id || ''))) return { ok: false, why: '문서 이름 꼴이 다름' };
    const v = {}; for (const f of J.fields) if (it.v && it.v[f] !== undefined) v[f] = it.v[f]; if (!Object.keys(v).length) return { ok: false, why: '쓸 칸이 없음' };
    if (J.mode === 'ext' && !(v.obj && typeof v.obj === 'object' && typeof v.obj.sig === 'string' && v.obj.sig)) return { ok: false, why: '지문(sig) 없는 결과' };
    if (J.mode === 'nb' && !(v.main && typeof v.main === 'object' && v.main.src === 'usedSearch' && typeof v.sig === 'string')) return { ok: false, why: '시세 문서 꼴이 다름' };
    if (J.mode === 'once' && J.srcOnly && v.src !== J.srcOnly) return { ok: false, why: `출처가 ${J.srcOnly}가 아님(운영과 같은 출처만)` };
    if (J.mode === 'plan') { const bad = planBad(k, v); if (bad) return { ok: false, why: bad }; }
    if (J.mode === 'bench') { const bad = benchBad(String(it.id || ''), v); if (bad) return { ok: false, why: bad }; }
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
  const SHADOW_OF = {}; for (const [k, J] of Object.entries(JOBS)) if (J.shadowK) SHADOW_OF[J.shadowK] = k;
  const MINV = (k) => k === 'bench' ? '0.1.44' : (JOBS[k] && JOBS[k].mode === 'plan') || k === 'ext.lib' ? '0.1.41' : (/^ext\./.test(k) && !['ext.nl', 'ext.fx'].includes(k) ? '0.1.26' : '0.1.25'); /* (11/12 handoff2) 로거 칸 일·정보나루는 0.1.41부터 */ const FRESH_H = 3;
  const verGE = (a, b) => { const x = String(a || '').split('.').map((n) => +n || 0), y = String(b || '').split('.').map((n) => +n || 0); for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return true; };
  function candidates(jdays, t) { t = t || Date.now(); const by = {}; const last = {}; for (const j of jdays || []) { const a = Date.parse((j && j.at) || '') || 0; const u = String((j && j.pc) || ''); if (!last[u] || a > last[u].at) last[u] = { at: a, ver: (j && j.ver) || null, kind: (j && j.kind) || (/^LOGGER/i.test(u) ? 'logger' : 'office') }; }
    for (const j of jdays || []) { const T = (j && j.tasks) || {}; for (const [k0, s] of Object.entries(T)) { if (!s || !s.pass) continue; if (JOBS[k0] && JOBS[k0].shadowK && JOBS[k0].shadowK !== k0) continue; const k = SHADOW_OF[k0] || k0; /* (11/12 handoff3) 그림자 이름이 다른 일(🎯 첫 쪽 'bench' ↔ 끝까지 'benchFull') */ const o = by[k] || (by[k] = { k, name: s.name || k, days: new Set(), canDays: new Set(), n: 0, same: 0, un: 0, pcs: {} });
      o.days.add(j.d); o.n += +s.n || 0; o.same += +s.same || 0; o.un += +s.un || 0; if (s.pass.can) o.canDays.add(j.d); const p = o.pcs[j.pc] || (o.pcs[j.pc] = { n: 0, can: 0 }); p.n += +s.n || 0; if (s.pass.can) p.can++; } }
    return Object.values(by).map((o) => { const mv = MINV(o.k); const okPc = (x) => { const l = last[x] || {}; return verGE(l.ver, mv) && l.at && t - l.at < FRESH_H * 3600e3 && kindOk(o.k, l.kind); }; /* (11/12 handoff2 · 약속 0) 로거 칸 일은 로거 PC만 · 사무실 일은 사무실 PC만 */ const E = Object.fromEntries(Object.entries(o.pcs).filter(([x, v]) => v.can > 0 && okPc(x))); const pc = Object.keys(E).length ? pickPc(o.k, E) : null;
      const no = pc ? null : Object.keys(o.pcs).map((x) => { const l = last[x] || {}; return `${x} ${!kindOk(o.k, l.kind) ? (JOBS[o.k] && JOBS[o.k].lg ? '로거 칸 일 — 사무실 PC는 맡지 못함(약속 0)' : '사무실 일 — 로거 PC는 맡지 못함(약속 0)') : !verGE(l.ver, mv) ? `번외 ${l.ver || '?'}(${mv} 이상 필요)` : `${Math.round((t - l.at) / 3600e3)}시간째 소식 없음`}`; }).join(' · ');
      return { k: o.k, name: o.name, days: o.days.size, canDays: o.canDays.size, n: o.n, same: o.same, un: o.un, pc: pc ? pc[0] : null, no, path: !!JOBS[o.k], can: o.canDays.size > 0 && o.un === 0 }; })
      .filter((o) => o.can).sort((a, b) => b.canDays - a.canDays || b.same - a.same); }

  /* ══ (11/12 handoff2 · 리드 '묶음째 넘기기') ══════════════════════════════════════════════
   * ① 로거 칸 — 로거 고유 일(lg)은 하루 요약 kind 'logger'인 PC만 맡음 · 사무실 일은 로거 PC가 못 맡음(약속 0: 로거에 우리 매물·상품 이름·계정 없음) */
  const LG_K = ['dynamic', 'shopSum', 'metrics', 'usedPage', 'survey', 'bench', 'benchFull', 'voice']; /* col2-tasks.js who 'logger'와 같음 */
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
    product: '운영은 상품 화면 한 번으로 도서 정보·번호 색인·우리 상품 연결(prd_listings)·시장 지표·중고 첫 쪽·순위 기간을 함께 씀(refreshOne0) — 📘·📈·🏷 한 묶음 · (11/12 handoff3 약속 0 판단) 입력이 우리 상품 목록이고 우리 상품 칸을 쓰므로 맡을 PC = 사무실 PC 한 대(📦 pubset) · 로거는 맡지 않음 → 사무실 PC가 같은 상품 화면 읽기로 📈·🏷 그림자를 함께 내는 길을 만든 뒤',
    metrics: '📘 한 묶음(📦 pubset · 사무실 PC) — 우리 책의 시장 지표는 우리 상품 목록이 입력이라 로거 칸에서 넘기지 않음(약속 0) · 로거 📈 그림자는 견줌만',
    usedPage: '📘 한 묶음(📦 pubset · 사무실 PC) — 우리 책 중고 첫 쪽은 우리 상품 목록이 입력이라 로거 칸에서 넘기지 않음(약속 0) · 로거 🏷 그림자는 견줌만',
    survey: "운영은 평가 글까지 여러 쪽을 읽어 seller_reviews에 달마다 쌓고 고르는 차례에 손님 연결 점수를 씀(로거에 줄 수 없음 · 약속 0) — 번외 그림자는 첫 쪽 날짜별 수만 → 여러 쪽 읽기·차례를 번외에 만든 뒤",
    voice: '🗣 판매자 글은 번외가 처음부터 따로 모음(col2_voice) — 운영에 같은 일이 없어 넘길 것 없음(운영 구매평 글은 ⭐ 숍 평가와 같은 함수)',
    'ext.ttb': '알라딘 OpenAPI 종료(2026-10-30) — 운영도 묻지 않음',
  };
  /* (11/12 handoff3) 📦 pubset — 운영 refreshOne0 한 번 읽기 묶음의 약속 0 판단(같은 PC가 맡음 · 섞지 않음)
   *  운영이 쓰는 칸: prd_books·prd_ids(도서 정보·번호 색인) · prd_listings(우리 상품 연결 — 우리 매물) · prd_book_metrics·prd_metric_changes(시장 지표·중고 첫 쪽) · prd_rank_periods(순위 기간) · rn_status
   *  입력 = 우리 상품 목록(l.usedCode·listingId) → 로거 칸에 둘 수 없음(로거에 우리 매물·상품 이름을 두지 않음) → 맡을 PC = 사무실 PC 한 대(기본 JS-MAIN — 알라딘 몫이 남음)
   *  pool·explore 책(우리 책이 아닌 알라딘 구간 수집)도 같은 함수를 쓰지만 prd_books에 쓰는 칸이 우리 도서 기록이라 같은 사무실 PC 묶음으로(로거 칸과 섞지 않음)
   *  로거의 📈·🏷 그림자(운영 로거가 방금 읽은 책)는 견주기만 하고 넘기지 않음 — 운영 로거가 지금 하는 우리 책 시장 지표 일은 사무실 묶음이 넘겨받을 때 함께 멈춤 */
  const PUBSET = { id: 'pubset', pc: 'JS-MAIN', keys: ['product', 'metrics', 'usedPage'], lg: false, cols: ['prd_books', 'prd_ids', 'prd_listings', 'prd_book_metrics', 'prd_metric_changes', 'prd_rank_periods'],
    why: "입력이 우리 상품 목록(우리 매물)이고 prd_listings(우리 상품 연결)를 쓰므로 사무실 PC 한 대 · 로거 칸과 섞지 않음(약속 0)" };

  /* ══ (11/12 handoff3) 🎯 숍 목록 끝까지 — 그림자 견줌 · 넘김 값 검사 · 운영 benchFinish 떼어 부르기 ══ */
  /* 넘김 값 검사 — run(끝까지 읽은 회차) 또는 claim(잡기 신호) 하나 · 상품 줄 = 운영 prog.items 꼴 [id, 값, 등급, 제목, ISBN, 출간, 정가, 최저가(0·1), 쪽, 장바구니 코드, 지은이, 표지] */
  const ROW_OK = (r) => Array.isArray(r) && r.length >= 9 && r.length <= 12 && /^\d{1,13}$/.test(String(r[0])) && (r[1] == null || (typeof r[1] === 'number' && r[1] >= 0 && r[1] < 1e8)) && (r[3] == null || typeof r[3] === 'string') && (r[8] == null || (Number.isInteger(r[8]) && r[8] > 0 && r[8] < 1e5));
  function benchBad(id, v) { const J = JOBS.bench; id = String(id).replace(/^bclaim_/, ''); if (v.claim) { const c = v.claim; return c && typeof c === 'object' && (c.on === true || c.on === false) ? '' : '잡기 신호 꼴이 다름'; }
    const r = v.run; if (!r || typeof r !== 'object') return '회차 값이 없음'; if (String(r.sc) !== String(id)) return '숍 번호가 다름'; if (!/^\d{4}-\d{2}-\d{2}$/.test(String(r.day || ''))) return '회차 날짜 꼴이 다름';
    if (!Date.parse(r.startedAt || '')) return '읽기 시작 시각이 없음'; if (!(Number.isInteger(r.lastPage) && r.lastPage >= 1 && r.lastPage <= J.maxPages)) return `끝 쪽이 1~${J.maxPages}쪽이 아님(큰 숍은 운영 그대로)`;
    if (!Array.isArray(r.items) || !r.items.length || r.items.length > J.maxItems) return `상품 줄이 1~${J.maxItems}개가 아님`; if (!r.items.every(ROW_OK)) return '상품 줄 꼴이 다름(운영 prog.items 꼴)';
    if (new Set(r.items.map((x) => String(x[0]))).size !== r.items.length) return '같은 상품이 두 번'; if (r.pages !== r.lastPage) return '1쪽부터 끝 쪽까지 다 읽은 회차만(끝까지 못 읽은 회차는 운영처럼 통계에서 빼야 해 넘기지 않음)'; return ''; }
  /* 운영 bench_state 조각(c/<k>.s · 옛 모양 m)을 한 표로 — v = [값, 처음 본 날, 상태, 처음부터 있던 것, 제목 40자, 배지, 처음 안 보인 날, ISBN, 분류, 출간, 상세] */
  function chunkMap(chunks) { const M = new Map(); for (const c of chunks || []) { if (!c) continue; let m = c.m; if (c.s) { try { m = JSON.parse(c.s); } catch (e) { m = null; } } if (m) for (const [id, v] of Object.entries(m)) M.set(String(id), v); } return M; }
  /* 그림자 견줌 — 번외가 끝까지 읽은 목록(rows) ↔ 운영 bench_state 지금 목록(안 보임 표시 v[6] 없는 것)
   *  같음 = 상품 번호·값·등급·최저가 배지가 모두 같음 · 다르면 까닭: 운영 회차 끝(opsEnd)과 번외 읽기(myAt)가 gapH시간 넘게 떨어졌으면 '때가 다름'(move · 그사이 팔림·새로 올림·값 바꿈) · 아니면 '다름(까닭 모름)' */
  function benchCmp(rows, chunks, o) { o = o || {}; const ops = chunkMap(chunks); const live = new Map([...ops].filter(([, v]) => !(Array.isArray(v) && v[6])));
    const mine = new Map((rows || []).map((r) => [String(r[0]), r])); const onlyMine = [], onlyOps = [], chg = [];
    for (const [id, r] of mine) { const v = live.get(id); if (!v) { onlyMine.push(id); continue; } const f = []; if ((r[1] ?? null) !== (v[0] ?? null)) f.push('price'); if ((r[2] || null) !== (v[2] || null)) f.push('grade'); if ((r[7] ? 1 : 0) !== (v[5] ? 1 : 0)) f.push('low'); if (f.length) chg.push({ id, f, prod: [v[0] ?? null, v[2] || null, v[5] ? 1 : 0], shadow: [r[1] ?? null, r[2] || null, r[7] ? 1 : 0] }); }
    for (const id of live.keys()) if (!mine.has(id)) onlyOps.push(id);
    const n = mine.size; const same = n - chg.length - onlyMine.length; const gapH = o.opsEnd && o.myAt ? Math.abs(Date.parse(o.myAt) - Date.parse(o.opsEnd)) / 3600e3 : null; const lim = o.gapH == null ? 1 : +o.gapH;
    const bad = chg.length + onlyMine.length + onlyOps.length; const verdict = bad ? 'diff' : 'same'; const reasons = !bad ? [] : gapH != null && gapH > lim ? ['move'] : ['diff'];
    return { verdict, reasons, n, opsN: live.size, same, onlyMine: onlyMine.length, onlyOps: onlyOps.length, chg: chg.length, gapH: gapH == null ? null : Math.round(gapH * 10) / 10, rows: [...chg.slice(0, 4).map((x) => ({ f: x.f.join('·'), k: 'diff', prod: x.prod, shadow: x.shadow })), ...(onlyMine.length ? [{ f: '번외만 봄', k: 'diff', prod: null, shadow: onlyMine.length }] : []), ...(onlyOps.length ? [{ f: '운영만 봄', k: 'diff', prod: onlyOps.length, shadow: null }] : [])] }; }
  /* 운영 본체 글자에서 이름 정한 함수만 꺼냄 — helper/col2-lift.js grab과 같은 셈(웹앱·클라우드도 쓰게 여기 한 벌 · tests/t_handoff가 두 결과가 같은지 봄) */
  function grab(src, name) { const S = String(src || ''); let i = S.search(new RegExp(`\\n\\s*(async\\s+)?function ${name}\\s*\\(`));
    if (i >= 0) { const st = S.indexOf(S.slice(i).match(/(async\s+)?function /)[0], i); i = S.indexOf('function ' + name, i); const b = S.indexOf('{', S.indexOf(')', i)); if (b < 0) return null; let d = 0;
      for (let j = b; j < S.length; j++) { const c = S[j]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return S.slice(st, j + 1); } } return null; }
    const m = S.match(new RegExp(`\\n(\\s*)const ${name} = ([^\\n]*;)`)); return m ? `const ${name} = ${m[2]}` : null; }
  /* 운영 benchFinish를 떼어 부르는 함수 글자 — env { C, db, firebase, PC_NAME, W, nowIso, log, ui, REG, CFG, t, prog, st }
   *  benchFinish가 부르는 바깥 이름만 받침: BREG(노선표 — 웹앱·클라우드의 ReadnowRegistry) · BENCH_CFG(app_settings/bench) · benchDetail = 운영 BENCH_DEFER_DETAIL 길(상품 페이지 정보는 운영 📖이 따로 채움) */
  function benchCode(src) { const f = grab(src, 'benchFinish'); const ws = grab(src, 'WRITER_SCHEMA'); if (!f) return { err: '운영 본체에서 benchFinish를 못 찾음' };
    const code = `(async function (env) { 'use strict'; const { C, db, firebase, PC_NAME, W, nowIso, log, ui } = env; const BREG = () => env.REG || null; const BENCH_CFG = env.CFG || {};
      const benchDetail = async (t, now, newIds) => ({ tried: 0, filled: [], newIds }); ${ws || 'const WRITER_SCHEMA = 6;'}
      ${f}
      return benchFinish(env.t, env.prog, env.st); })`;
    const ver = (String(src).match(/@version\s+([\d.]+)/) || [])[1] || '?'; return { code, ver, len: f.length }; }
  /* 넘김 회차 → 운영 benchFinish에 줄 prog · st (끝까지 다 읽은 회차만 — fullRead) */
  function benchProg(run, st) { const items = run.items.map((r) => { const x = r.slice(0, 12); while (x.length < 12) x.push(null); return x; });
    return { prog: { day: run.day, page: run.lastPage + 1, items, blocks: 0, startedAt: run.startedAt, sc: String(run.sc), name: run.name || String(run.sc), readDone: true, pagingBroken: false, lastPage: run.lastPage, rows: 48, cover: 1, fullRead: true, fullWhy: '', readEndAt: run.readEndAt || null },
      st: { ...(st || {}), lastPage: run.lastPage } }; }
  /* 잡기 — 운영 benchClaim과 같은 판단(남이 4분 안에 잡았으면 못 잡음) · 번외 PC 이름 'col2-<PC>' */
  function claimOk(cur, pc, t) { const me = 'col2-' + String(pc); return !(cur && cur.pc && cur.pc !== me && (t || Date.now()) - (+cur.at || 0) < 4 * 60e3); }

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
  const api = { PUBSET, benchBad, chunkMap, benchCmp, grab, benchCode, benchProg, claimOk, SHADOW_OF, LG_K, kindOk, planBad, reads, plan, planCheck, due, BLOCK, ALR, ALR_WHY, BUNDLES, bundleView, EXT_HO, PC_PLAN, planPc, JOBS, DOC, state, mine, writeOk, candidates, extPlan, shard };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2Handoff = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
