/* col2-journal.js — 📜 번외 수집기 기록(기록창의 바탕 · 정범님 11/09 밤 '번외 수집기도 기록창을 쉽게 열고 닫게 · 기존 기록창을 똑같이 → 훨씬 편하고 쓸모 있게')
 * 운영 수집기 기록(__rnLog → 날짜별 보관 · 오늘 기록이 다시 켜도 이어 보임)과 같은 꼴: 한 줄 = { s(차례), t(시각), l(err·warn·ok·info·detail), m(일 이름), k(종류), x(글), d(덧붙임) }
 *  · 종류 k: read(받음 — 그림자 읽기 한 권) · rest(쉼 — 왜 쉬는지 · 다시 읽기 시작) · win(창 — 숨은 크롬·작은 창) · y24(예스24) · upd(새 판) · sys(그 밖)
 *  · 메모리에는 최근 MEM줄만(기본 4,000) · 날마다 HOME/journal/<날짜>.jsonl 에 덧붙여 보관(도우미를 다시 켜도 오늘 기록이 이어 보임)
 *  · '내려받기·비우기'는 지우지 않고 journal/old/ 로 옮김(데이터 안 지움 규칙)
 *  · 🔐 남기기 전에 가림: 쿠키·토큰·비밀번호 꼴 값 · 긴 열쇠 꼴 글자 · 전자우편 · 휴대전화 번호 — 계정·쿠키·비밀값을 기록에 남기지 않음(약속 0)
 *  · 🛰 로거 PC(이름 LOGGER…): 같은 프로그램 · 로거 조건만 다름 — 우리 숍·판매관리·예스24·주문·송장·손님 낱말과 알라딘 공개 상품 화면 밖 주소는 남기지 않음 · 예스24 줄은 아예 안 받음
 *  · 회차 요약(rounds): 시간마다(한국 시각) 읽은 화면·같음/다름/운영 칸 없음·실패·평균 걸린 시간·쉼 까닭 — 기록 줄에서 바로 셈(따로 쌓지 않음) */
'use strict';
const fs = require('fs'), path = require('path');

const LVS = ['err', 'warn', 'ok', 'info', 'detail'];
const KINDS = ['read', 'rest', 'win', 'y24', 'upd', 'sys'];
const kdayOf = (t) => new Date(t + 9 * 3600e3).toISOString().slice(0, 10);

/* 🔐 모든 PC — 비밀값 꼴 가림 */
function scrub(s) {
  return String(s == null ? '' : s)
    .replace(/(?<![A-Za-z])((?:set-)?cookie|authorization|bearer|token|session(?:id)?|sid|passw(?:or)?d|pwd|apikey|api_key|secret|비밀번호|비번|암호)(\s*[:=]\s*|\s+)("[^"]*"|'[^']*'|[^\s,;·)]+)/gi, '$1$2(가림)')
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '(전자우편 가림)')
    .replace(/01[016789][- .]?\d{3,4}[- .]?\d{4}/g, '(전화 가림)')
    .replace(/\b(?=[A-Za-z0-9_\-+/]*\d)(?=[A-Za-z0-9_\-+/]*[A-Za-z])[A-Za-z0-9_\-+/]{32,}={0,2}/g, '(열쇠 꼴 가림)');
}
/* 🛰 로거 PC — 우리 숍·계정 흔적을 남기지 않음(약속 0: 로거는 알라딘 비로그인 일만) */
const LOGGER_WORD = /(예스24|yes24|uscm|판매관리|판매 관리|샵매니저|샵 매니저|판매자|우리 ?숍|우리 ?샵|우리 매물|매물|주문|송장|발송|손님|고객|로그인 세션)/gi;
function loggerScrub(s) {
  return String(s).replace(/https?:\/\/[^\s)'"]+/g, (u) => (/^https?:\/\/(www\.)?aladin\.co\.kr\/shop\/wproduct\.aspx\?ItemId=\d+$/i.test(u) ? u : '(주소 가림)')).replace(LOGGER_WORD, '(로거 기록에 안 남김)');
}

/* 글로 종류·수준·일 이름 짐작(예전 note(글)만 부르던 곳 그대로 두려고 — 부르는 쪽이 정하면 그것이 먼저) */
function guess(x) {
  const t = String(x);
  const k = /예스24|🟦|🔐 예스24/.test(t) ? 'y24' : /그림자 읽기|비교 /.test(t) ? 'read' : /쉼|쉬|기다림|몫|상한|429|다시 읽기 시작/.test(t) ? 'rest' : /새 판|판 확인|바꿔 끼/.test(t) ? 'upd' : /창|크롬/.test(t) ? 'win' : 'sys';
  const l = /✗|오류|못 받음|못 엶|못 찾음/.test(t) ? 'err' : /실패|넘게|429|못 |꺼짐|끊김|필요/.test(t) ? 'warn' : /✓|켬|저장함|띄움|엶/.test(t) ? 'ok' : 'info';
  const m = { read: '알라딘', rest: '쉼', upd: '새 판', win: '창', y24: '예스24', sys: '도우미' }[k];
  return { k, l, m };
}

function makeJournal(o) {
  o = o || {}; const now = o.now || Date.now; const MEM = o.mem || 4000; const DIR = path.join(o.home, 'journal'); const OLD = path.join(DIR, 'old');
  const isLogger = () => { try { return !!(o.isLogger && o.isLogger()); } catch (e) { return false; } };
  try { fs.mkdirSync(DIR, { recursive: true }); } catch (e) {}
  const buf = []; let seq = 0;
  const fileOf = (d) => path.join(DIR, d + '.jsonl');
  const readDay = (d, max) => { let L = []; try { L = fs.readFileSync(fileOf(d), 'utf8').split('\n').filter(Boolean).map((r) => { try { return JSON.parse(r); } catch (e) { return null; } }).filter(Boolean); } catch (e) {} return max && L.length > max ? L.slice(-max) : L; };
  /* 다시 켜도 오늘 기록이 이어 보이게 — 오늘 파일 끝 MEM줄을 메모리에 */
  { const L = readDay(kdayOf(now()), MEM); for (const e of L) { e.s = ++seq; buf.push(e); } }

  function add(x, opt) {
    opt = opt || {}; const g = guess(x); const k = KINDS.includes(opt.k) ? opt.k : g.k;
    if (isLogger() && k === 'y24') return null; /* 로거는 예스24 일을 하지 않음 — 혹시 와도 남기지 않음 */
    let text = scrub(x); if (isLogger()) text = loggerScrub(text);
    const e = { s: ++seq, t: now(), l: LVS.includes(opt.l) ? opt.l : g.l, m: String(opt.m || g.m).slice(0, 12), k, x: text.slice(0, 600) };
    if (opt.d && typeof opt.d === 'object') { const d = {}; for (const [a, v] of Object.entries(opt.d)) if (v != null && /^(ms|v|ok|id|why)$/.test(a)) d[a] = typeof v === 'string' ? (isLogger() ? loggerScrub(scrub(v)) : scrub(v)).slice(0, 120) : v; e.d = d; }
    buf.push(e); if (buf.length > MEM) buf.splice(0, buf.length - MEM);
    try { const { s, ...row } = e; fs.appendFileSync(fileOf(kdayOf(e.t)), JSON.stringify(row) + '\n'); } catch (er) {}
    return e;
  }
  const since = (after, n) => { after = +after || 0; n = Math.max(1, Math.min(MEM, +n || MEM)); const L = buf.filter((e) => e.s > after); return L.slice(-n); };
  const tail = (n) => buf.slice(-(n || 15));
  const days = () => { try { return fs.readdirSync(DIR).filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f)).map((f) => f.slice(0, 10)).sort().reverse(); } catch (e) { return []; } };
  const day = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(String(d)) ? readDay(d, 20000) : []);
  /* 내려받기용 한 덩어리 글(모든 날 · 오래된 것부터) */
  const lineText = (e) => `${new Date(e.t + 9 * 3600e3).toISOString().slice(0, 19).replace('T', ' ')} [${e.m}] [${e.l}] ${e.x}`;
  const allText = () => days().slice().reverse().flatMap((d) => readDay(d).map(lineText)).join('\n');
  /* 비우기 = 지우지 않고 old/ 로 옮김 → 화면에서만 비고 파일은 남음 */
  function clear() { let n = 0; try { fs.mkdirSync(OLD, { recursive: true }); } catch (e) {} const stamp = new Date(now() + 9 * 3600e3).toISOString().slice(0, 19).replace(/[-:T]/g, '');
    for (const d of days()) { try { fs.renameSync(fileOf(d), path.join(OLD, `${d}_${stamp}.jsonl`)); n++; } catch (e) {} } buf.length = 0; return { ok: true, moved: n }; }

  /* 회차 요약 — 한국 시각 한 시간이 한 회차 · 최근 n회차(지금 시간 먼저) */
  function rounds(n) { n = Math.max(1, Math.min(24, +n || 6)); const H = 3600e3; const cur = Math.floor((now() + 9 * H) / H); const out = [];
    for (let i = 0; i < n; i++) { const h = cur - i; const L = buf.filter((e) => Math.floor((e.t + 9 * H) / H) === h); const R = L.filter((e) => e.k === 'read' && e.d && e.d.ok != null);
      const ms = R.map((e) => +e.d.ms).filter((v) => v > 0); const rest = {}; L.filter((e) => e.k === 'rest' && e.l !== 'ok').forEach((e) => { const w = String(e.x).replace(/\d[\d,.]*/g, '#').slice(0, 60); rest[w] = (rest[w] || 0) + 1; });
      out.push({ h: new Date(h * H).toISOString().slice(11, 13) + '시', from: h * H - 9 * H, reads: R.length, ok: R.filter((e) => e.d.ok).length, fail: R.filter((e) => !e.d.ok).length,
        same: R.filter((e) => e.d.v === 'same').length, diff: R.filter((e) => e.d.v && e.d.v !== 'same' && e.d.v !== 'noprod').length, no: R.filter((e) => e.d.v === 'noprod').length,
        avgMs: ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : null, err: L.filter((e) => e.l === 'err').length, warn: L.filter((e) => e.l === 'warn').length,
        y24: L.filter((e) => e.k === 'y24').length, rest: Object.entries(rest).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w, c]) => ({ w, c })) }); }
    return out; }
  return { add, since, tail, days, day, allText, clear, rounds, seq: () => seq, kind: () => (isLogger() ? 'logger' : 'office'), lineText };
}

module.exports = { makeJournal, scrub, loggerScrub, guess, LVS, KINDS };
