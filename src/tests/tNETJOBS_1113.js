/* tNETJOBS_1113 — (benchdata 11/13) 로거 벤치마킹 '쪽당 1.6MB · 3배' 오보 고침 시험
 *  원인: 수집기 netFlush가 5분 동안 읽은 화면이 없을 때도(로거는 도우미 사용량 때문에 늘 보냄) 빈 jobs {}를 merge로 보냄 →
 *        Firestore set merge는 빈 지도를 '빈 값'으로 덮음 → prd_jobs/net_<날짜>.pcs.LOGGER.jobs(그날 작업별 장 수·글자 수)가 지워짐
 *        (11/13 05:14~05:20 bookmart 저장 348초 동안 읽기 없음 → 그 뒤부터만 남아 08:19 '5,437쪽' · 실제 0시~8시 반 약 15,600쪽)
 *  ① 읽은 화면이 없으면 jobs 칸을 아예 보내지 않음(도우미 사용량 helper는 그대로 보냄)
 *  ② 읽은 화면이 있으면 전과 같이 jobs.<일>.pages·chars를 increment로 보냄
 *  ③ Firestore merge 흉내(빈 지도는 덮음 · increment는 더함)로 하루를 돌려 보면 쌓인 장 수가 지워지지 않음
 * 실행: node src/tests/tNETJOBS_1113.js (브라우저·서버 필요 없음) */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'src/readnow-collector.src.js')));
const SRC = fs.readFileSync(path.join(R, 'src/readnow-collector.src.js'), 'utf8');
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (!c && x !== undefined ? ' ' + JSON.stringify(x).slice(0, 300) : '')); };
const i0 = SRC.indexOf('async function netFlush()'), i1 = SRC.indexOf('\n  setInterval(netFlush', i0);
ok(i0 > 0 && i1 > i0, 'netFlush를 수집기 본문에서 찾음');
const body = SRC.slice(i0, i1);
/* Firestore 흉내: increment 표시 · set merge = 깊은 합침(빈 지도는 그 자리를 빈 지도로 덮음 · increment는 더함) */
const INC = (n) => ({ __inc: n });
const merge = (dst, src) => { for (const [k, v] of Object.entries(src)) { if (v && v.__inc != null) dst[k] = (+dst[k] || 0) + v.__inc; else if (v && typeof v === 'object' && !Array.isArray(v)) { if (!Object.keys(v).length) dst[k] = {}; else { if (!dst[k] || typeof dst[k] !== 'object') dst[k] = {}; merge(dst[k], v); } } else dst[k] = v; } return dst; };
const DB = {}; const sent = [];
const C = () => ({ doc: (id) => ({ set: async (v, o) => { sent.push(JSON.parse(JSON.stringify(v))); if (!(o && o.merge)) DB[id] = {}; merge((DB[id] = DB[id] || {}), v); } }) });
const firebase = { firestore: { FieldValue: { increment: INC } } };
const auth = { currentUser: { email: 'test@example.com' } };
const mk = new Function('C', 'firebase', 'auth', 'PC_NAME', 'PUBONLY', 'HELPER', 'NETM', 'nowIso', 'VER', 'W', body + '\nreturn netFlush;');
const dayK = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const H = { today: { key: dayK, tether: 5e9, wifi: 1e9, groups: {}, blocked: 0, tiers: {}, jobs: { bench: 4e9 } }, month: { key: dayK.slice(0, 7) }, capGB: 240, tether: { ok: true, ip: '1.2.3.4' }, wifi: {}, ver: '1.8.23', at: 'x', phones: [], days: {} };
(async () => {
  const NETM = { jobs: {}, n: 0 };
  const flush = mk(C, firebase, auth, 'LOGGER', true, H, NETM, () => new Date().toISOString(), '1.89.test', () => ({ writer: 'LOGGER' }));
  console.log('① 읽은 화면이 있을 때');
  NETM.jobs.bench = { pages: 300, chars: 160e6 }; await flush();
  let s = sent[sent.length - 1]; ok(s.pcs.LOGGER.jobs && s.pcs.LOGGER.jobs.bench.pages.__inc === 300, 'jobs.bench.pages를 increment(300)로 보냄', s.pcs.LOGGER.jobs);
  ok(!!s.pcs.LOGGER.helper, '도우미 사용량(helper)도 같이');
  console.log('② 5분 동안 읽은 화면이 없을 때(저장 348초 등)');
  await flush(); s = sent[sent.length - 1];
  ok(!('jobs' in s.pcs.LOGGER), 'jobs 칸을 보내지 않음(빈 {}로 덮지 않음)', Object.keys(s.pcs.LOGGER));
  ok(!!s.pcs.LOGGER.helper, '도우미 사용량(helper)은 그대로 보냄');
  console.log('③ 하루 흉내: 읽기 → 쉼 → 읽기');
  NETM.jobs.bench = { pages: 200, chars: 100e6 }; await flush();
  await flush(); await flush();
  NETM.jobs.bench = { pages: 50, chars: 27e6 }; await flush();
  const J = DB['net_' + dayK].pcs.LOGGER.jobs;
  ok(J && J.bench && J.bench.pages === 550, '쉬는 틈이 있어도 그날 장 수가 모두 쌓임(300+200+50 = 550)', J);
  ok(J && J.bench && J.bench.chars === 287e6, '글자 수도 모두 쌓임', J);
  /* 예전 코드라면 지워졌음을 같은 흉내로 확인(고침 전후 대조) */
  const old = body.replace(/\{ \.\.\.\(keys\.length \? \{ jobs \} : \{\}\), route:/, '{ jobs, route:');
  ok(old !== body, '대조용 예전 꼴 만들기');
  const DB2 = {}; const C2 = () => ({ doc: (id) => ({ set: async (v) => { merge((DB2[id] = DB2[id] || {}), JSON.parse(JSON.stringify(v))); } }) });
  const N2 = { jobs: {}, n: 0 }; const f2 = new Function('C', 'firebase', 'auth', 'PC_NAME', 'PUBONLY', 'HELPER', 'NETM', 'nowIso', 'VER', 'W', old + '\nreturn netFlush;')(C2, firebase, auth, 'LOGGER', true, H, N2, () => 'x', 'v', () => ({}));
  N2.jobs.bench = { pages: 300, chars: 1 }; await f2(); await f2(); N2.jobs.bench = { pages: 50, chars: 1 }; await f2();
  ok(DB2['net_' + dayK].pcs.LOGGER.jobs.bench.pages === 50, '예전 꼴은 쉰 뒤 50쪽만 남음(이번에 고친 증상 재현)', DB2['net_' + dayK].pcs.LOGGER.jobs);
  console.log(bad ? `❌ ${bad}개 실패` : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 오류', e.stack); process.exit(1); });
