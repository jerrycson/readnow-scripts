// tWX1110 — (정범님 11/10) 🌦 기상청 API허브 날씨(클라우드) · 열쇠는 시험 호출로 먼저 확인한 뒤에만 저장 · 날마다 지점별로 모아 쌓기
//  쓰는 법: node tWX1110.js (브라우저 없음 — cloud/index.js의 WX-START~WX-END 칸만 떼어 가짜 Firestore·가짜 http로)
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const fs = require('fs'); const path = require('path'); const vm = require('vm');
const src = fs.readFileSync(path.join(__dirname, '../../cloud/index.js'), 'utf8'); const a = src.indexOf('WX-START'); const b = src.indexOf('/* WX-END */'); const code = src.slice(src.indexOf('*/', a) + 2, b);
const store = {}; const col = (c) => (store[c] = store[c] || {});
const merge = (o, v) => { const r = { ...(o || {}) }; for (const [k, x] of Object.entries(v)) r[k] = x && typeof x === 'object' && !Array.isArray(x) && r[k] && typeof r[k] === 'object' && !Array.isArray(r[k]) ? merge(r[k], x) : x; return r; };
const C = (c) => ({ doc: (id) => ({ get: async () => ({ exists: !!col(c)[id], data: () => col(c)[id] }), set: async (v, o) => { col(c)[id] = o && o.merge ? merge(col(c)[id], v) : v; }, _c: c, _id: id }) });
const batch = () => { const ops = []; return { set: (r, v, o) => ops.push(() => r.set(v, o)), commit: async () => { for (const f of ops) await f(); } }; };
const KEY = 'AbCdEf12345_gH-ijk9'; let NOW = Date.parse('2026-11-10T03:00:00Z'); /* 한국 12시 */ const calls = []; let mode = 'ok';
const day = (d8) => `${d8} 108  1.9  1234  270  5.1 1530  290  8.2 1532  12.3  17.8 1412   6.9  0610   3.1   13.0   4.2  55.0  30.0 1500  7.7  1.2  1.8  0.0 1012.3 1020.1 1023.4 0900 1018.2 1600   3.4  9.5  9.0  92.0 13.21 1.82 1200  0.5  0.0  1.0`;
const http = async (o) => { calls.push(o.url); const q = new URL(o.url).searchParams; const k = q.get('authKey'); if (mode === 'net') throw new Error('connect ECONNREFUSED ' + o.url);
  if (k !== KEY) return { status: 403, text: `{"result":{"status":403,"message":"인증키가 유효하지 않습니다 authKey=${k}"}}` };
  const t1 = q.get('tm1'), t2 = q.get('tm2'), stn = q.get('stn'); const L = ['#START7777', '# TM STN WS_AVG WR_DAY WD_MAX WS_MAX WS_MAX_TM WD_INS WS_INS WS_INS_TM TA_AVG TA_MAX TA_MAX_TM TA_MIN TA_MIN_TM TD_AVG TS_AVG TG_MIN HM_AVG HM_MIN HM_MIN_TM PV_AVG EV_S EV_L FG_DUR PA_AVG PS_AVG PS_MAX PS_MAX_TM PS_MIN PS_MIN_TM CA_TOT SS_DAY SS_DUR SS_CMB SI_DAY SI_60M_MAX SI_60M_MAX_TM RN_DAY RN_D99 RN_DUR', '# KST - m/s ...'];
  for (let t = Date.parse(t1.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3T12:00:00Z')); ; t += 864e5) { const d8 = new Date(t).toISOString().slice(0, 10).replace(/-/g, ''); if (d8 > t2) break; let ln = day(d8).replace(/^(\d{8}) 108/, `$1 ${stn}`); if (d8.endsWith('5')) ln = ln.replace(/ 0\.5  0\.0  1\.0$/, ' -9.0 -9.0 -9.0'); L.push(ln); }
  L.push('#7777END'); return { status: 200, text: L.join('\n') }; };
const ctx = { console, Date, Math, String, JSON, Number, Object, Array, encodeURIComponent, URL };
vm.runInNewContext(code + '\nthis.wxMake = wxMake; this.wxParse = wxParse; this.WX_DEF = WX_DEF;', ctx);
const W = ctx.wxMake({ C, batch, http, now: () => NOW, nowIso: () => new Date(NOW).toISOString() });
(async () => {
  // ① 모양이 아닌 값(아이디·비번을 넣은 듯) — 부르지도 않고 거절
  let r = await W.saveKey('jerry 1234'); ok(!r.ok && r.bad && /아이디·비밀번호가 아니라/.test(r.why) && calls.length === 0 && !col('app_secrets').kma, '띄어쓰기 섞인 값 = 「아이디·비밀번호가 아니라 … 인증키」 안내 · 기상청을 부르지 않음 · 저장 안 함', r);
  // ② 틀린 열쇠 — 시험 호출 403 → 저장 안 함 · 까닭 · 오류 글에 열쇠 값 없음
  r = await W.saveKey('WrongKey_000000000'); ok(!r.ok && r.bad && /인증키가 맞지 않거나/.test(r.why) && /활용신청/.test(r.why) && !/WrongKey_000000000/.test(JSON.stringify(r)) && !col('app_secrets').kma, '틀린 열쇠 = 저장 안 함 · 「인증키가 맞지 않거나 … 활용신청」 · 답에 열쇠 값이 안 보임(••••)', r);
  ok(calls.length === 1 && /kma_sfcdd3\.php/.test(calls[0]) && /stn=108/.test(calls[0]) && /tm1=20261102&tm2=20261102/.test(calls[0]), '시험 호출 = 지상관측 일자료 기간 조회 · 서울 108 · 8일 전 하루 한 번', calls);
  // ③ 기상청 서버가 안 닿음 — 확인 못 함 → 저장 안 함
  mode = 'net'; r = await W.saveKey(KEY); mode = 'ok'; ok(!r.ok && r.unsure && /저장하지 않았습니다/.test(r.why) && !r.why.includes(KEY) && !col('app_secrets').kma, '서버가 안 닿음 = 「확인 못 함 — 저장하지 않았습니다」 · 오류 글에 열쇠 값 없음', r);
  // ④ 맞는 열쇠 — 저장 · 상태엔 끝 4자리만 · 보기 하루치
  r = await W.saveKey(KEY, '관리자'); const run = col('app_settings').wx_run || {};
  ok(r.ok && r.sample && r.sample.d === '2026-11-02' && r.sample.ta === 12.3 && col('app_secrets').kma.key === KEY && run.key.tail === 'ijk9' && !JSON.stringify(run).includes(KEY) && !JSON.stringify(r).includes(KEY), '맞는 열쇠 = app_secrets/kma에만 저장 · 상태(wx_run)엔 끝 4자리 · 답에 값 없음 · 보기 「11/02 서울 12.3도」', { r, run });
  // ⑤ 모으기 — 지점 셋 · 앞으로(어제까지 30일) 먼저
  calls.length = 0; let t = await W.tick(); const s1 = col('app_settings').wx_run.stn;
  ok(t && t.calls === 3 && t.rows === 90 && s1['108'].hi === '20261109' && s1['108'].lo === '20261011' && s1['119'] && s1['112'], '첫 회 = 서울·수원·인천 한 번씩 · 어제(11/09)까지 30일 · 90줄', { t, s1 });
  const d0 = col('wx_days')['108_20261109']; ok(d0 && d0.d === '2026-11-09' && d0.nm === '서울' && d0.taMax === 17.8 && d0.taMin === 6.9 && d0.rn === 0.5 && d0.hm === 55 && d0.ss === 9.5 && d0.ca === 3.4 && !d0.guess && d0.raw, 'wx_days 한 줄 = 평균·최고·최저 기온·강수·습도·일조·구름 · 원문 한 줄', d0);
  const d5 = col('wx_days')['108_20261105']; ok(d5 && d5.rn === 0 && d5.rnNA === true, '비 안 온 날(기상청 -9.0) = 강수 0 + rnNA', d5);
  const sm = col('wx_sum')['108']; ok(sm && sm.rows['20261109'] && sm.rows['20261109'][0] === 0.5 && sm.rows['20261109'][1] === 17.8 && Object.keys(sm.rows).length === 30, 'wx_sum/108 = 연구가 한 문서로 받는 [강수, 최고, 평균, 최저, 습도]', sm && Object.keys(sm.rows).length);
  // ⑥ 10분 안에는 다시 안 부름 · 10분 뒤엔 뒤로 채우기(30일씩)
  calls.length = 0; t = await W.tick(); ok(t === null && calls.length === 0, '10분 안 = 부르지 않음'); NOW += 11 * 60e3; t = await W.tick(); const s2 = col('app_settings').wx_run.stn;
  ok(t && t.calls === 3 && s2['108'].lo === '20260911' && s2['108'].hi === '20261109', '다음 회 = 앞 30일(9/11~10/10) 뒤로 채움', { t, s2: s2['108'] });
  // ⑦ 하루 최대 — perDay 4로 줄이면 그날은 4번에서 멈춤
  store.app_settings.wx = { cfg: { perDay: 7 } }; NOW += 11 * 60e3; t = await W.tick(); ok(t && t.calls === 1 && col('app_settings').wx_run.cnt['20261110'] === 7, '하루 최대(설정 7) = 그날 7번째에서 멈춤', { t, cnt: col('app_settings').wx_run.cnt });
  // ⑧ 머리 줄 없는 응답도 차례로 읽음(guess)
  const P = ctx.wxParse(day('20261101')); ok(P.rows.length === 1 && P.rows[0].guess && P.rows[0].taMax === 17.8 && P.rows[0].rn === 0.5, '머리 줄이 없으면 기상청 도움말 차례로 읽고 guess 표시', P.rows[0]);
  // ⑨ 열쇠가 나중에 틀리게 되면(만료) — 멈추고 keyBad · 6시간 쉼
  store.app_secrets.kma.key = 'Expired_Key_0000'; W._S.key = null; NOW += 864e5; t = await W.tick(); ok(t && t.badKey && /인증키/.test(col('app_settings').wx_run.keyBad.why) && !JSON.stringify(col('app_settings').wx_run).includes('Expired_Key_0000'), '열쇠가 틀리게 되면 keyBad(까닭 · 값 없음)로 알리고 멈춤', col('app_settings').wx_run.keyBad);
  // ⑩ 정적: 웹앱 ⚙ 칸·안내·클라우드 길 · 열쇠를 log로 찍지 않음
  ok(/path === '\/wx-key'/.test(src) && /path === '\/key-check'/.test(src) && /WX\.tick\(\)/.test(src), '클라우드 길 /wx-key · /key-check · /daily에서 WX.tick');
  ok(!/log\([^)]*\bkey\b[^)]*\)/.test(src.slice(a, b)), 'WX 칸 안에서 열쇠를 log로 찍지 않음');

  // ⑪ 🌐 외부 연결 키 확인(/key-check) — 진짜 공용 파일 readnow-ext-core.js + 가짜 http
  { const kc = src.slice(src.indexOf('async function keyCheck(b)'), src.indexOf('let extNextAt = 0;')); const X = require(path.join(__dirname, '../../readnow-ext-core.js')); const H = []; let net = false;
    const ctx2 = { console, Date, Math, String, JSON, Object, Array, encodeURIComponent, extMod: async () => X, extKeysC: async () => ({}), extHttp: async (o) => { H.push(o.url); if (net) throw new Error('응답 없음(30초)'); if (/kakao/.test(o.url)) return { status: (o.headers || {}).Authorization === 'KakaoAK GOODKAKAO' ? 200 : 401, text: JSON.stringify({ documents: [] }) }; if (/aladin/.test(o.url)) return { status: 200, text: /ttbkey=GOODTTB/.test(o.url) ? JSON.stringify({ item: [] , errorCode: 0 }) : JSON.stringify({ errorCode: 100, errorMessage: '잘못된 TTBKey 입니다' }) }; return { status: 500, text: '' }; } };
    vm.runInNewContext(kc + '\nthis.keyCheck = keyCheck;', ctx2);
    const k1 = await ctx2.keyCheck({ k: 'kakaoRest', v: 'BADKAKAO' }); ok(!k1.ok && k1.bad && /키가 맞지 않음/.test(k1.why) && !JSON.stringify(k1).includes('BADKAKAO'), '카카오 401 = 틀림(bad) · 답에 값 없음', k1);
    const k2 = await ctx2.keyCheck({ k: 'kakaoRest', v: 'GOODKAKAO' }); ok(k2.ok, '카카오 맞는 키 = 맞음', k2);
    const k3 = await ctx2.keyCheck({ k: 'aladinTtb', v: 'BADTTB' }); ok(!k3.ok && k3.bad && /TTBKey/.test(k3.why), '알라딘 TTB 잘못된 키 = 틀림 · 까닭(알라딘 답)', k3);
    net = true; const k4 = await ctx2.keyCheck({ k: 'kakaoRest', v: 'GOODKAKAO' }); net = false; ok(!k4.ok && k4.unsure, '서버가 안 닿음 = 확인 못 함(unsure)', k4);
    const k5 = await ctx2.keyCheck({ k: 'naverId', v: 'ANY' }); ok(!k5.ok && k5.unsure && /서비스가 끝나/.test(k5.why), '네이버 책 검색(끝난 서비스) = 확인 못 함', k5);
    const k6 = await ctx2.keyCheck({ k: 'kakaoRest', v: 'A B' }); ok(!k6.ok && k6.bad && /띄어쓰기/.test(k6.why), '띄어쓰기 섞임 = 다시 붙여 넣기', k6); }
  console.log(bad ? `❌ tWX1110 ${bad}개 실패` : '✓ tWX1110 모두 통과'); process.exit(bad ? 1 : 0); })();
