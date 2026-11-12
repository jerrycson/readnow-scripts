/* col2-settings.js — 번외 수집기 설정 한 곳 (11/11 정범님 '「하루 1600장」 같은 번외 수집기 굳은 값 대부분을 설정으로 · 이 PC만 / 모든 PC 공통')
 * 설정 표(SCHEMA) = 이름 · 묶음 · 범위 · 기본값(col2-config.js·각 일 파일의 기본값 그대로) · 어디에 두나(도우미 col2.json 안 경로)
 *  · 굳은 값을 읽는 일 파일(속도 col2-pace · 알라딘 읽기 col2-al · 예스24 col2-y24 · 다시 로그인 col2-relogin · 그림자 일 col2-jobs)은 고치지 않음 —
 *    그 파일들이 이미 읽는 col2.json 덮어쓰기 칸(pace·alcfg·y24cfg·relogin·watch·jobs.pass·keys …)에 값을 넣으면 곧바로 그 값으로 돎(바꾸면 바로 반영)
 *  · col2-config.js 값을 곧바로 읽는 곳(KPIPA·새상품 없는 시세·바쁨 쉼·새벽 쉼 시각)은 applyDirect가 그 자리에서 바꿔 끼움(기본값은 처음 받은 값을 따로 둠)
 *  · sc 'all' = 모든 PC 공통 — Firestore app_settings/col2_cfg 한 곳(웹앱 ⚙ 설정 › 🧪 번외 수집기 칸과 같은 값) · 도우미는 Firestore에 쓰지 않으므로
 *    옆 창에서 바꾸면 이 PC엔 곧바로 넣고 '올릴 것(setPend)'으로 두면 이 PC 웹앱이 1분 안에 그 문서에 올리고 모든 PC로 나눔
 *  · sc 'pc'  = 이 PC만(col2.json) · 누가 언제 무엇을 바꿨는지 기록(setLog · 공통 값은 문서 log에도)
 *  · 사이트별 한도(알라딘 몫 = 알라딘 화면만 · 바깥 사이트는 사이트마다 — fin1 판 규칙)는 그대로: pace.* = 알라딘 화면 · siteCfg.<출처>.* = 바깥 사이트 하나
 * 순수 부분(표·검사·보기)은 도우미(node)·옆 창(브라우저)이 같이 씀 · 비밀값·계정은 이 표에 없음 */
(function (root) {
  'use strict';
  /* 묶음 — 옆 창 ⚙ 자세히·웹앱 ⚙ 설정 › 번외 칸이 같은 차례 */
  const GROUPS = [
    { id: 'limit', icon: '📏', t: '한도·속도', i: '알라딘 몫(알라딘 공개 화면만 · 사람 속도 두 배)과 샵매니저 읽기·다시 로그인 횟수 — 모든 PC 같음' },
    { id: 'time', icon: '⏰', t: '주기·시간대', i: '얼마마다 읽나 · 새벽 쉼 · 하루 한 번 일의 시각 — 모든 PC 같음' },
    { id: 'pc', icon: '🖥', t: '이 PC만', i: '이 PC에서만 켜고 끄는 일 — 다른 PC는 그대로' },
  ];
  /* 기본값은 col2-config.js(COL2)와 각 일 파일 기본값에서 — 여기 적은 숫자는 그 파일에 기본값이 없을 때만(시험 t_settings가 일 파일 글과 견줌) */
  const AL_DEF = { chkMin: 20, confirmMin: 30, delivMin: 30, listMin: 60, qnaMin: 120, gapA: 3000, gapB: 6000, hourCap: 30, dayCap: 300, cool429Min: 30, nightFrom: 1, nightTo: 5 }; /* col2-al.js C() 기본값과 같음 */
  const Y24_DEF = { ordMin: 5, prdH: 24, tourH: 24, takeover: true, tkHour: 3 }; /* col2-y24.js C() 기본값과 같음 */
  const RLG_DEF = { perHour: 3, perDay: 10, gapMin: 5, failStop: 2 }; /* col2-relogin.js DEF와 같음 */
  /* 표 한 줄: k 이름 · g 묶음 · t 이름표 · sc 범위 · ty int|num|bool|time · lo~hi(저장 값 단위) · mul(보이는 값 = 저장 값 ÷ mul) · u 단위 · f 자주(often)/가끔(some)/드묾(rare)
   *  · p = col2.json 안 경로 · dk = 기본값 찾는 곳(COL2 경로 'PACE.dayCap' 또는 'AL.chkMin' 같은 일 파일 기본값) · i = ⓘ 설명(숨김) */
  const S = (k, g, t, sc, ty, lo, hi, p, dk, o) => ({ k, g, t, sc, ty, lo, hi, p, dk, mul: 1, u: '', f: 'some', i: '', ...(o || {}) });
  const SCHEMA = [
    /* ── 📏 한도·속도 (모든 PC) ── */
    S('pace.dayCap', 'limit', '🟧 알라딘 화면 하루', 'all', 'int', 1, 20000, ['pace', 'dayCap'], 'PACE.dayCap', { u: '장', f: 'often', i: '알라딘 공개 상품 화면을 하루(한국 날짜)에 이만큼까지 읽음 · 정범님 11/05 밤 「메인으로 돌릴 때까지 사람 속도의 두 배」 · 바깥 사이트(교보·KPIPA 등)와 샵매니저 읽기는 따로 셈' }),
    S('pace.hourCap', 'limit', '🟧 알라딘 화면 한 시간', 'all', 'int', 1, 2000, ['pace', 'hourCap'], 'PACE.hourCap', { u: '장', i: '한 시간에 이만큼 넘게 읽으면 다음 시간까지 쉼' }),
    S('pace.minGapMs', 'limit', '🟧 한 장 읽은 뒤 쉼', 'all', 'num', 700, 3600e3, ['pace', 'minGapMs'], 'PACE.minGapMs', { mul: 1000, u: '초', i: '한 장 읽고 다음 장까지 기다리는 시간(흩음만큼 들쭉날쭉) · 0.7초(운영 수집기 최소 간격) 아래로는 못 줄임' }),
    S('pace.jitter', 'limit', '🟧 쉼 흩음', 'all', 'num', 0, 0.5, ['pace', 'jitter'], 'PACE.jitter', { mul: 0.01, u: '%', f: 'rare', i: '쉬는 시간을 ±이만큼 들쭉날쭉하게(사람처럼) · 0~50%' }),
    S('pace.cool429Min', 'limit', '🟧 「요청 많음」 답이면 쉼', 'all', 'int', 1, 600, ['pace', 'cool429Min'], 'PACE.cool429Min', { u: '분', f: 'rare', i: '알라딘이 429·503(요청이 너무 많음)을 주면 이만큼 × 횟수(최대 10배) 쉼' }),
    S('prodShare', 'limit', '🟧 상품 화면 몫', 'all', 'num', 0, 1, ['prodShare'], 'AUTO.prodShare', { mul: 0.01, u: '%', i: '하루 몫 가운데 공개 상품 화면 그림자가 이 비율을 넘게 쓴 날엔 다른 그림자 일(외부 정보·시세·KPIPA)에 차례를 먼저 줌' }),
    S('alcfg.dayCap', 'limit', '🟧 샵매니저 읽기 하루', 'all', 'int', 1, 5000, ['alcfg', 'dayCap'], 'AL.dayCap', { u: '번', i: '알라딘 샵매니저(로그인 화면) 읽기 그림자 하루 상한 — 운영 출고 읽기와 같은 계정이라 넉넉히 느리게' }),
    S('alcfg.hourCap', 'limit', '🟧 샵매니저 읽기 한 시간', 'all', 'int', 1, 500, ['alcfg', 'hourCap'], 'AL.hourCap', { u: '번' }),
    S('alcfg.gapA', 'limit', '🟧 샵매니저 한 번 뒤 쉼(짧게)', 'all', 'num', 700, 600e3, ['alcfg', 'gapA'], 'AL.gapA', { mul: 1000, u: '초', f: 'rare', i: '읽기 사이 쉼은 짧게~길게 사이에서 고름' }),
    S('alcfg.gapB', 'limit', '🟧 샵매니저 한 번 뒤 쉼(길게)', 'all', 'num', 700, 600e3, ['alcfg', 'gapB'], 'AL.gapB', { mul: 1000, u: '초', f: 'rare' }),
    S('alcfg.cool429Min', 'limit', '🟧 샵매니저 「요청 많음」 쉼', 'all', 'int', 1, 600, ['alcfg', 'cool429Min'], 'AL.cool429Min', { u: '분', f: 'rare' }),
    S('relogin.perHour', 'limit', '🔐 다시 로그인 한 시간', 'all', 'int', 1, 20, ['relogin', 'perHour'], 'RLG.perHour', { u: '번', i: '세션이 풀렸을 때 스스로 다시 로그인하는 횟수 상한(사이트마다)' }),
    S('relogin.perDay', 'limit', '🔐 다시 로그인 하루', 'all', 'int', 1, 100, ['relogin', 'perDay'], 'RLG.perDay', { u: '번' }),
    S('relogin.gapMin', 'limit', '🔐 다시 로그인 사이', 'all', 'int', 1, 240, ['relogin', 'gapMin'], 'RLG.gapMin', { u: '분', f: 'rare' }),
    S('relogin.failStop', 'limit', '🔐 연속 실패면 멈춤', 'all', 'int', 1, 10, ['relogin', 'failStop'], 'RLG.failStop', { u: '번', f: 'rare', i: '이만큼 연속으로 틀리면 멈추고 알림(정범님이 [다시 해 보기]를 누를 때까지 — 계정 잠김 막기)' }),
    /* ── ⏰ 주기·시간대 (모든 PC) ── */
    S('nightOn', 'time', '🌙 새벽에도 읽기', 'all', 'bool', 0, 1, ['nightOn'], 'AUTO.nightOn', { f: 'often', i: '끄면 새벽(아래 시각) 동안 공개 화면 그림자 읽기를 쉼 · 운영 수집기의 밤 쉼과 따로' }),
    S('nightFrom', 'time', '🌙 새벽 쉼 시작', 'all', 'int', 0, 23, ['nightFrom'], 'AUTO.nightFrom', { u: '시', f: 'rare' }),
    S('nightTo', 'time', '🌙 새벽 쉼 끝', 'all', 'int', 1, 24, ['nightTo'], 'AUTO.nightTo', { u: '시', f: 'rare' }),
    S('y24cfg.ordMin', 'time', '🟦 예스24 주문 읽기', 'all', 'int', 1, 120, ['y24cfg', 'ordMin'], 'Y24.ordMin', { u: '분마다', f: 'often', i: '예스24 신규 주문·발송관리 두 목록을 읽는 간격 · 웹앱 판매처 설정(예스24 주문 간격)을 수집기가 넘겨주면 그 값이 먼저' }),
    S('y24cfg.prdH', 'time', '🟦 예스24 등록상품 전부', 'all', 'int', 1, 168, ['y24cfg', 'prdH'], 'Y24.prdH', { u: '시간마다', f: 'rare' }),
    S('y24cfg.tourH', 'time', '🟦 예스24 메뉴 둘러보기', 'all', 'int', 1, 168, ['y24cfg', 'tourH'], 'Y24.tourH', { u: '시간마다', f: 'rare' }),
    S('alcfg.chkMin', 'time', '🟧 샵매니저 로그인 확인', 'all', 'int', 1, 1440, ['alcfg', 'chkMin'], 'AL.chkMin', { u: '분마다', f: 'rare' }),
    S('alcfg.confirmMin', 'time', '🟧 주문확인요청 읽기', 'all', 'int', 1, 1440, ['alcfg', 'confirmMin'], 'AL.confirmMin', { u: '분마다' }),
    S('alcfg.delivMin', 'time', '🟧 배송 목록 읽기', 'all', 'int', 1, 1440, ['alcfg', 'delivMin'], 'AL.delivMin', { u: '분마다' }),
    S('alcfg.listMin', 'time', '🟧 상품 목록 읽기', 'all', 'int', 1, 1440, ['alcfg', 'listMin'], 'AL.listMin', { u: '분마다' }),
    S('alcfg.qnaMin', 'time', '🟧 문의 읽기', 'all', 'int', 1, 1440, ['alcfg', 'qnaMin'], 'AL.qnaMin', { u: '분마다' }),
    S('alcfg.nightFrom', 'time', '🟧 샵매니저 밤 쉼 시작', 'all', 'int', 0, 23, ['alcfg', 'nightFrom'], 'AL.nightFrom', { u: '시', f: 'rare' }),
    S('alcfg.nightTo', 'time', '🟧 샵매니저 밤 쉼 끝', 'all', 'int', 1, 24, ['alcfg', 'nightTo'], 'AL.nightTo', { u: '시', f: 'rare' }),
    S('kpipa.after', 'time', '📚 KPIPA 하루 한 번 시각', 'all', 'time', 0, 1439, ['kpipa', 'after'], 'KPIPA.after', { f: 'rare', i: '한국 시각 이 뒤에 하루 한 번 최근 며칠치 출판 통계를 그림자로 읽음' }),
    S('kpipa.days', 'time', '📚 KPIPA 며칠치', 'all', 'int', 1, 60, ['kpipa', 'days'], 'KPIPA.days', { u: '일', f: 'rare' }),
    S('nb.everyH', 'time', '🔍 새상품 없는 시세 목록', 'all', 'int', 1, 168, ['nb', 'everyH'], 'NB.everyH', { u: '시간마다', f: 'rare' }),
    S('nb.listN', 'time', '🔍 시세 목록 한 번에', 'all', 'int', 1, 200, ['nb', 'listN'], 'NB.listN', { u: '권', f: 'rare' }),
    S('busy.restMs', 'time', '🚚 운영이 바쁠 때 쉼', 'all', 'num', 5000, 3600e3, ['busy', 'restMs'], 'BUSY.restMs', { mul: 1000, u: '초', f: 'rare', i: '출고 보호·운영 수집기가 바쁘다고 알리면 그림자 일을 이만큼씩 쉬었다 다시 봄' }),
    S('busy.maxSec', 'time', '🚚 바쁨 알림 최대', 'all', 'int', 60, 7200, ['busy', 'maxSec'], 'BUSY.maxSec', { u: '초', f: 'rare' }),
    S('watch.tickSec', 'time', '🪟 작업 창 지킴이', 'all', 'int', 10, 3600, ['watch', 'tickSec'], 'WATCH.tickSec', { u: '초마다', f: 'rare' }),
    S('watch.opensPerHour', 'time', '🪟 숨은 크롬 다시 띄움 한 시간', 'all', 'int', 1, 30, ['watch', 'opensPerHour'], 'WATCH.opensPerHour', { u: '번', f: 'rare' }),
    S('watch.coolMin', 'time', '🪟 다시 띄움 상한이면 쉼', 'all', 'int', 1, 600, ['watch', 'coolMin'], 'WATCH.coolMin', { u: '분', f: 'rare' }),
    S('watch.pageTimeoutSec', 'time', '🪟 화면 기다림 최대', 'all', 'int', 5, 300, ['watch', 'pageTimeoutSec'], 'WATCH.pageTimeoutSec', { u: '초', f: 'rare' }),
    S('keys.ttlH', 'time', '🔑 운영 키 메모리에 두는 시간', 'all', 'int', 1, 72, ['keys', 'ttlH'], 'KEYS.ttlH', { u: '시간', f: 'rare', i: '웹앱이 메모리로만 넘긴 운영 키를 이 시간 뒤 버리고 다시 부탁(파일에 안 씀)' }),
    S('pass.minN', 'time', '✅ 넘길 수 있음 — 하루 표본', 'all', 'int', 1, 100000, ['jobs', 'pass', 'minN'], 'PASS.minN', { u: '개 이상', f: 'rare', i: '그림자 일을 운영에서 번외로 넘겨도 되는지 셈 — 하루에 견준 표본 수 · 못 읽음 비율' }),
    S('pass.maxFailPct', 'time', '✅ 넘길 수 있음 — 못 읽음', 'all', 'int', 0, 100, ['jobs', 'pass', 'maxFailPct'], 'PASS.maxFailPct', { u: '% 이하', f: 'rare' }),
    /* ── 🖥 이 PC만 ── */
    S('on', 'pc', '번외 수집', 'pc', 'bool', 0, 1, ['on'], 'X.off', { f: 'often', i: '끄면 숨은 크롬을 닫고 모든 그림자 일을 멈춤 · 운영 수집기는 그대로' }),
    S('auto', 'pc', '공개 화면 자동 읽기', 'pc', 'bool', 0, 1, ['auto'], 'AUTO.on', { i: '웹앱이 넘긴 표본 책을 차례로 그림자 읽기' }),
    S('y24', 'pc', '🟦 예스24 판매관리 읽기', 'pc', 'bool', 0, 1, ['y24'], 'X.on', { f: 'often' }),
    S('y24cfg.takeover', 'pc', '🟦 예스24 다른 곳 로그인 이어받기', 'pc', 'bool', 0, 1, ['y24cfg', 'takeover'], 'Y24.takeover', { f: 'often', i: '(11/12) 다른 곳(휴대폰·다른 크롬)에서 판매관리에 로그인해 이 PC 세션이 끊기면 「이미 로그인된 예스24」 화면에서 저장된 계정으로 그 세션을 끊고 이 PC가 다시 가져옴 · 예스24를 맡은 PC만 · 출고 중엔 안 함 · 끄면 예전처럼 멈추고 사람을 기다림' }),
    S('y24cfg.tkHour', 'pc', '🟦 예스24 이어받기 한 시간', 'pc', 'int', 1, 10, ['y24cfg', 'tkHour'], 'Y24.tkHour', { u: '번', f: 'rare', i: '서로 끊기를 되풀이하지 않게 한 시간에 이만큼까지만 이어받음' }),
    S('y24Jobs', 'pc', '🟦 예스24 맡긴 일도 여기서', 'pc', 'bool', 0, 1, ['y24Jobs'], 'X.on', { i: '주문접수확인·발송처리를 이 PC 번외가 함' }),
    S('al', 'pc', '🟧 알라딘 샵매니저 읽기', 'pc', 'bool', 0, 1, ['al'], 'X.off', { f: 'often', i: '읽기만 · 기본 꺼짐' }),
    S('hands', 'pc', '🖐 알라딘은 평소 크롬을 손발로', 'pc', 'bool', 0, 1, ['hands'], 'HANDS.def', { f: 'often', nolg: true, i: '(11/12 정범님 결정) 로그인이 필요한 알라딘 일은 이미 로그인된 평소 크롬의 리드나우 수집기 탭이 하고, 번외는 일을 맡기고·결과를 받고·그 창을 숨기고 띄우기만 함 · 번외 창은 알라딘에 로그인하지 않음(새 기기 로그인 42FB를 키우지 않게) · 켜면 🏠 이어받기는 쓰지 않음 · 기본: HOME만 켬 · 로거는 없음' }),
    S('handsHide', 'pc', '🖐 평소 크롬 손발 창 늘 숨김', 'pc', 'bool', 0, 1, ['handsHide'], 'X.off', { nolg: true, i: '켜면 리드나우 수집기 탭이 앞 탭인 평소 크롬 창을 화면 밖으로 숨겨 둠(1분마다 봄 · 일은 그대로) · 로그인이 풀려 사람 손이 필요하면 앞으로 띄우고, 돌아오면 다시 숨김 · 그 창에 다른 탭도 쓰면 끄세요' }),
    S('alOwn', 'pc', '🏠 알라딘 로그인 자리 이어받기', 'pc', 'bool', 0, 1, ['alOwn'], 'X.off', { i: '켜면 이 PC 운영 수집기는 알라딘 로그인 자리를 놓고, 번외가 그 자리로 샵매니저 읽기를 맡음(번외가 30분 넘게 안 보이면 운영이 되찾음) · 로거 PC는 늘 끔' }),
    S('side', 'pc', '📊 켜질 때 옆 창 띄우기', 'pc', 'bool', 0, 1, ['side'], 'X.on', { f: 'rare' }),
  ];
  const BY = Object.fromEntries(SCHEMA.map((x) => [x.k, x]));
  /* 바깥 사이트(fin1 판 · 사이트마다) — siteCfg.<출처>.gapMs|dayCap 이름은 그때그때(출처는 운영 외부 정보 공용 파일이 정함) */
  const SITE_RE = /^siteCfg\.([\w.-]{1,30})\.(gapMs|dayCap)$/;
  const siteRow = (k) => { const m = SITE_RE.exec(String(k || '')); if (!m) return null; return m[2] === 'gapMs' ? S(k, 'limit', '🌐 ' + m[1] + ' 요청 사이', 'all', 'num', 700, 3600e3, ['siteCfg', m[1], 'gapMs'], 'SITE.' + m[1] + '.gapMs', { mul: 1000, u: '초', f: 'rare', site: m[1] }) : S(k, 'limit', '🌐 ' + m[1] + ' 하루', 'all', 'int', 0, 100000, ['siteCfg', m[1], 'dayCap'], 'SITE.' + m[1] + '.dayCap', { u: '번', f: 'rare', site: m[1] }); };
  const rowOf = (k) => BY[k] || siteRow(k);

  const getP = (o, p) => { let v = o; for (const x of p) { if (v == null || typeof v !== 'object') return undefined; v = v[x]; } return v; };
  const setP = (o, p, v) => { let c = o; for (let i = 0; i < p.length - 1; i++) { if (!c[p[i]] || typeof c[p[i]] !== 'object') c[p[i]] = {}; c = c[p[i]]; } c[p[p.length - 1]] = v; };
  const delP = (o, p) => { const c = getP(o, p.slice(0, -1)); if (c && typeof c === 'object') delete c[p[p.length - 1]]; };
  const hm2n = (s) => { const m = /^(\d{1,2}):(\d{2})$/.exec(String(s || '').trim()); if (!m) return NaN; const h = +m[1], mi = +m[2]; return h < 24 && mi < 60 ? h * 60 + mi : NaN; };
  /* 값 검사 → { ok, v } 또는 { ok:false, err } · v는 저장 값 단위(보이는 값 × mul은 화면이 함) · test면 쉼 하한을 0.1초까지 */
  function check(k, v, o) { const r = rowOf(k); if (!r) return { ok: false, err: '모르는 설정' }; o = o || {};
    if (v === null) return { ok: true, v: null, reset: true }; /* null = 기본값으로 되돌림 */
    if (r.ty === 'bool') { if (v === true || v === false) return { ok: true, v }; if (v === 'true' || v === 1) return { ok: true, v: true }; if (v === 'false' || v === 0) return { ok: true, v: false }; return { ok: false, err: '켬·끔만' }; }
    if (r.ty === 'time') { const n = hm2n(v); return Number.isFinite(n) ? { ok: true, v: String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0') } : { ok: false, err: '시각은 00:00~23:59 꼴로' }; }
    const n = +v; if (v === '' || v == null || !Number.isFinite(n)) return { ok: false, err: '숫자를 넣어 주세요' };
    const lo = o.test && r.lo === 700 ? 100 : r.lo; const sh = (x) => fmtNum(x / r.mul) + r.u;
    if (r.ty === 'int' && Math.round(n) !== n) return { ok: false, err: '정수로' };
    if (n < lo || n > r.hi) return { ok: false, err: `${sh(lo)} ~ ${sh(r.hi)} 사이로` };
    return { ok: true, v: r.ty === 'int' ? Math.round(n) : Math.round(n * 1e6) / 1e6 }; }
  const fmtNum = (x) => { const v = Math.round(x * 100) / 100; return Math.abs(v) >= 1000 ? v.toLocaleString('ko-KR') : String(v); };
  /* 보이는 글(값 하나) */
  function show(r, v) { if (v == null) return '—'; if (r.ty === 'bool') return v ? '켬' : '끔'; if (r.ty === 'time') return String(v); return fmtNum(+v / r.mul) + (r.u ? ' ' + r.u : ''); }
  /* 웹앱에 심는 가벼운 표(웹앱 ⚙ 설정 › 번외 칸이 같은 이름·범위·기본값으로 그림 — 시험이 웹앱 안 사본과 견줌) */
  function lite(defs) { return SCHEMA.filter((r) => r.sc === 'all').map((r) => ({ k: r.k, g: r.g, t: r.t, ty: r.ty, lo: r.lo, hi: r.hi, mul: r.mul, u: r.u, f: r.f, d: defs[r.k], i: r.i })); }

  /* ── 도우미(node) ── makeSettings({ get, save, COL2, note, pc, test, now })
   *  get() = 지금 CFG(col2.json 객체 · 제자리에서 고침) · save() = 파일에 씀 · COL2 = col2-config.js(처음 값은 여기서 따로 둠) */
  function makeSettings(o) {
    const now = o.now || Date.now; const C0 = JSON.parse(JSON.stringify(o.COL2)); /* 처음 받은 col2-config.js 값 = 기본값 */
    const SRC = { AL: AL_DEF, Y24: Y24_DEF, RLG: RLG_DEF, X: { on: true, off: false } };
    const defOf = (r) => { const [a, ...b] = r.dk.split('.'); if (a === 'HANDS') return !!(o.handsDef && o.handsDef()); /* (11/12 hands1) 손발 길 기본 = HOME만 켬 */ if (a === 'SITE') return o.siteDef ? o.siteDef(b[0], b[1]) : undefined; const base = SRC[a] || C0[a]; const v = getP(base, b); return v; };
    const defs = () => Object.fromEntries(SCHEMA.map((r) => [r.k, defOf(r)]));
    const cfg = () => o.get();
    const sh = () => { const c = cfg(); if (!c.shared || typeof c.shared !== 'object') c.shared = { v: {}, at: 0, by: '' }; if (!c.shared.v || typeof c.shared.v !== 'object') c.shared.v = {}; return c.shared; };
    const pend = () => { const c = cfg(); if (!c.setPend || typeof c.setPend !== 'object') c.setPend = {}; return c.setPend; };
    const logA = () => { const c = cfg(); if (!Array.isArray(c.setLog)) c.setLog = []; return c.setLog; };
    const addLog = (e) => { const L = logA(); L.unshift(e); if (L.length > 80) L.length = 80; };
    const effOf = (r) => { const v = getP(cfg(), r.p); return v === undefined || v === null ? defOf(r) : v; };
    const srcOf = (r) => { const v = getP(cfg(), r.p); if (v === undefined || v === null) return 'def'; if (r.sc === 'pc') return 'pc'; return Object.prototype.hasOwnProperty.call(sh().v, r.k) || pend()[r.k] ? 'all' : 'pc'; }; /* 'pc' = 예전 col2.json에 이 PC만 적어 둔 값(공통 값이 오면 공통으로) */
    /* col2-config.js 값을 곧바로 읽는 곳 — 제자리 바꿔 끼움(기본값 ← 설정) */
    function applyDirect() { const C = o.COL2; const c = cfg();
      for (const [K, sub] of [['KPIPA', 'kpipa'], ['NB', 'nb'], ['BUSY', 'busy']]) { if (!C[K]) continue; Object.assign(C[K], C0[K], Object.fromEntries(Object.entries(c[sub] || {}).filter(([, v]) => v != null))); }
      if (o.AC) { o.AC.nightFrom = c.nightFrom != null ? +c.nightFrom : C0.AUTO.nightFrom; o.AC.nightTo = c.nightTo != null ? +c.nightTo : C0.AUTO.nightTo; } }
    /* 바꾸기 — 옆 창(by = 'PC 이름 옆 창') · 공통 값은 이 PC에 곧바로 넣고 올릴 것으로 둠 */
    function set(k, v, by) { const r = rowOf(k); if (!r) return { ok: false, err: '모르는 설정: ' + k }; const ck = check(k, v, { test: o.test }); if (!ck.ok) return { ok: false, err: `${r.t} — ${ck.err}` };
      if ((r.k === 'hands' || r.k === 'handsHide') && o.isLogger && o.isLogger()) return { ok: false, err: '로거 PC에는 손발 길이 없음(약속 0)' };
      if (r.k === 'alOwn' && ck.v === true && o.isLogger && o.isLogger()) return { ok: false, err: '로거 PC는 알라딘 자리를 받지 않음(약속 0)' };
      const from = effOf(r); const c = cfg(); if (ck.reset) delP(c, r.p); else setP(c, r.p, ck.v); const to = effOf(r); const t = now();
      if (r.sc === 'all') { const s = sh(); if (ck.reset) delete s.v[k]; else s.v[k] = ck.v; s.at = Math.max(t, (+s.at || 0) + 1); pend()[k] = { v: ck.reset ? null : ck.v, at: s.at, by: String(by || '').slice(0, 60) }; }
      addLog({ k, t: r.t, from: show(r, from), to: show(r, to), by: String(by || '').slice(0, 60), at: t, sc: r.sc });
      applyDirect(); o.save(); if (o.note && JSON.stringify(from) !== JSON.stringify(to)) o.note(`⚙ ${r.t}: ${show(r, from)} → ${show(r, to)}${r.sc === 'all' ? ' (모든 PC 공통 — 이 PC 웹앱이 1분 안에 올려 다른 PC에도)' : ' (이 PC만)'}`);
      return { ok: true, k, v: to, from, sc: r.sc }; }
    /* 웹앱이 넘긴 공통 문서 받기 { v, at, by, log } · 이 PC가 더 늦게 바꾼 값(올릴 것)은 그대로 둠 */
    function take(doc, ack) { let ch = 0; const s = sh(), P = pend();
      if (ack && typeof ack === 'object' && Array.isArray(ack.keys)) for (const k of ack.keys) if (P[k] && +P[k].at <= +ack.at) { delete P[k]; ch++; }
      if (doc && typeof doc === 'object' && doc.v && typeof doc.v === 'object' && +doc.at > 0 && +doc.at >= (+s.at || 0)) { const c = cfg();
        const keys = new Set([...SCHEMA.filter((r) => r.sc === 'all').map((r) => r.k), ...Object.keys(doc.v).filter((k) => SITE_RE.test(k)), ...Object.keys(s.v).filter((k) => SITE_RE.test(k))]);
        const nv = {}; for (const k of keys) { const r = rowOf(k); if (!r) continue; if (P[k] && +P[k].at >= +doc.at) { if (P[k].v != null) nv[k] = P[k].v; continue; }
          const has = Object.prototype.hasOwnProperty.call(doc.v, k) && doc.v[k] != null; const ck = has ? check(k, doc.v[k], { test: o.test }) : null; const from = effOf(r);
          if (ck && ck.ok && !ck.reset) { setP(c, r.p, ck.v); nv[k] = ck.v; } else if (Object.prototype.hasOwnProperty.call(s.v, k)) delP(c, r.p); else continue;
          const to = effOf(r); if (JSON.stringify(from) !== JSON.stringify(to)) { ch++; addLog({ k, t: r.t, from: show(r, from), to: show(r, to), by: String(doc.by || '웹앱').slice(0, 60), at: +doc.at, sc: 'all', web: 1 }); } }
        cfg().shared = { v: nv, at: +doc.at, by: String(doc.by || '').slice(0, 60) }; ch++; }
      if (ch) { applyDirect(); o.save(); } return ch; }
    /* 화면에 줄 표 — 이 PC 지금 값 · 어디서 왔나 · 기본값 */
    function rows(extra) { const L = SCHEMA.map((r) => ({ ...r, p: undefined, dk: undefined, d: defOf(r), v: effOf(r), src: srcOf(r) }));
      for (const k of extra || []) { const r = siteRow(k); if (r) L.push({ ...r, p: undefined, dk: undefined, d: defOf(r), v: effOf(r), src: srcOf(r) }); } return L; }
    /* 이 PC만 켜고 끄는 일은 도우미 setCfg가 바꿈(크롬 닫기·자리 놓기 같은 뒷일까지) — 여기선 기록만 */
    function logPc(k, from, by) { const r = rowOf(k); if (!r) return; const to = effOf(r); if (JSON.stringify(from) === JSON.stringify(to)) return; addLog({ k, t: r.t, from: show(r, from), to: show(r, to), by: String(by || '').slice(0, 60), at: now(), sc: r.sc }); o.save(); }
    const pendOut = () => { const P = pend(); return Object.keys(P).length ? P : null; };
    /* 상태 요약(작게) — 기본값과 다른 값만(웹앱 기기 표 · col2_ctl) */
    function sum() { const out = {}; for (const r of SCHEMA) { const s = srcOf(r); if (s !== 'def') out[r.k] = { v: show(r, effOf(r)), s }; } return { n: Object.keys(out).length, d: out, at: +sh().at || 0, pend: Object.keys(pend()).length }; }
    applyDirect();
    return { set, take, rows, defs, lite: () => lite(defs()), pend: pendOut, sharedAt: () => +sh().at || 0, sum, logPc, log: () => logA().slice(0, 40), applyDirect, effOf: (k) => { const r = rowOf(k); return r ? effOf(r) : undefined; } };
  }

  const api = { GROUPS, SCHEMA, AL_DEF, Y24_DEF, RLG_DEF, SITE_RE, rowOf, check, show, fmtNum, hm2n, lite, makeSettings, getP };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Col2Set = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
