/* t_settings — (11/11 col2ui1 정범님 '번외 수집기 대부분을 설정으로 · 이 PC만 / 모든 PC 공통') ⚙ 설정 표
 *  ① 표·검사 — 기본값은 col2-config.js·일 파일 기본값 그대로 · 범위 검사 · 사이트별 한도 이름
 *  ② 도우미 — GET /settings · POST /set(범위 밖 거절 · 바로 반영: 알라딘 몫 하루 상한) · 기록 · 공통 값은 올릴 것(setPend)
 *  ③ 웹앱이 넘긴 공통 문서 받기(/cfg shared) · 올린 것 확인(sharedAck) · 이 PC가 더 늦게 바꾼 값은 그대로
 *  ④ ⏸ 잠깐 멈춤 → 정한 시각에 저절로 다시 켬 · ▶ 지금 읽기
 *  ⑤ 웹앱 안 사본(C2SET)이 이 표와 같음
 * 실행: node tests/t_settings.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path');
const SM = require('../helper/col2-settings.js'); const COL2 = require('../col2-config.js');
(async () => {
  console.log('① 표·검사');
  const keys = SM.SCHEMA.map((r) => r.k); ok(new Set(keys).size === keys.length && keys.length >= 40, '설정 이름이 겹치지 않음 · 굳은 값 40개 넘게', keys.length);
  const AL = fs.readFileSync(path.join(L.ROOT, 'helper', 'col2-al.js'), 'utf8'), Y = fs.readFileSync(path.join(L.ROOT, 'helper', 'col2-y24.js'), 'utf8'); const RG = require('../helper/col2-relogin.js');
  const lit = (src, re) => { const m = re.exec(src); return m ? Function('return {' + m[1] + '}')() : null; };
  const alD = lit(AL, /const C = \(\) => \(\{ ([^}]*?), \.\.\.\(cfg\(\)\.alcfg/), yD = lit(Y, /const C = \(\) => \(\{ ([^}]*?), \.\.\.\(cfg\(\)\.y24cfg/);
  ok(alD && Object.entries(SM.AL_DEF).every(([k, v]) => alD[k] === v), '🟧 샵매니저 기본값 = col2-al.js 기본값', JSON.stringify(alD));
  ok(yD && Object.entries(SM.Y24_DEF).every(([k, v]) => yD[k] === v), '🟦 예스24 기본값 = col2-y24.js 기본값', JSON.stringify(yD));
  ok(JSON.stringify(SM.RLG_DEF) === JSON.stringify(RG.DEF), '🔐 다시 로그인 기본값 = col2-relogin.js DEF');
  ok(SM.check('pace.dayCap', 1600).ok && !SM.check('pace.dayCap', 0).ok && !SM.check('pace.dayCap', 1.5).ok && /1~|사이로/.test(SM.check('pace.dayCap', 99999).err), '하루 상한 범위 검사(1~20,000 · 정수)', SM.check('pace.dayCap', 99999).err);
  ok(!SM.check('pace.minGapMs', 500).ok && SM.check('pace.minGapMs', 500, { test: true }).ok, '한 장 뒤 쉼은 0.7초 아래로 못 줄임(운영 최소 간격)');
  ok(SM.check('kpipa.after', '7:05').v === '07:05' && !SM.check('kpipa.after', '25:00').ok && SM.check('nightOn', 'false').v === false && SM.check('x.y', 1).err === '모르는 설정', '시각·켬끔·모르는 이름');
  ok(SM.rowOf('siteCfg.kyobo.dayCap') && SM.rowOf('siteCfg.kyobo.dayCap').site === 'kyobo' && !SM.rowOf('siteCfg.../x'), '바깥 사이트 한도는 사이트마다 이름(fin1 규칙)');
  ok(SM.show(SM.rowOf('pace.minGapMs'), 4000) === '4 초' && SM.show(SM.rowOf('prodShare'), 0.4) === '40 %', '보이는 값 단위(ms → 초 · 비율 → %)');

  console.log('② 도우미 /settings · /set');
  const H = await L.startHelper({ cfg: { on: false, pc: 'TEST-PC', pcSrc: 'pc', pace: { minGapMs: 120 } } });
  let s = await H.api('GET', '/settings'); const row = (k) => s.j.rows.find((r) => r.k === k);
  ok(s.j.ok && row('pace.dayCap').v === COL2.PACE.dayCap && row('pace.dayCap').d === 1600 && row('pace.dayCap').src === 'def' && s.j.groups.length === 3, '설정 표 — 기본값 1,600장 · 어디서 왔나(기본)', JSON.stringify(row('pace.dayCap')));
  let r = await H.api('POST', '/set', { k: 'pace.dayCap', v: 0 }); ok(r.st === 400 && /사이로/.test(r.j.err), '범위 밖은 거절하고 그대로', r.j.err);
  r = await H.api('POST', '/set', { k: 'pace.dayCap', v: 900 }); let st = await H.api('GET', '/status');
  ok(r.j.ok && st.j.pace.dayCap === 900, '바꾸면 바로 반영(알라딘 몫 하루 상한 900)', st.j.pace.dayCap);
  s = await H.api('GET', '/settings'); ok(row('pace.dayCap').src === 'all' && s.j.pend === 1 && s.j.log[0].k === 'pace.dayCap' && s.j.log[0].from === '1,600 장' && s.j.log[0].to === '900 장' && /옆 창/.test(s.j.log[0].by), '누가 언제 바꿨는지 기록 · 공통 값은 올릴 것으로 둠', JSON.stringify(s.j.log[0]));
  let pd = await H.api('GET', '/relay/pending?by=t'); ok(pd.j.setPend && pd.j.setPend['pace.dayCap'].v === 900 && pd.j.sharedAt > 0, '웹앱이 받아 갈 것(/relay/pending setPend)', JSON.stringify(pd.j.setPend));
  r = await H.api('POST', '/set', { k: 'kpipa.after', v: '01:30' }); st = await H.api('GET', '/settings'); ok(r.j.ok && st.j.rows.find((x) => x.k === 'kpipa.after').v === '01:30', 'KPIPA 시각처럼 설정 파일 값을 곧바로 읽는 곳도 바꿔 끼움');
  r = await H.api('POST', '/set', { k: 'y24', v: false }); st = await H.api('GET', '/status'); ok(r.j.ok && st.j.y24Want === false || st.j.y24 && st.j.y24.on === false, '이 PC만 켜끔은 예전 길(setCfg)로 — 예스24 끔', JSON.stringify(r.j.res));
  r = await H.api('POST', '/set', { k: 'pace.dayCap', v: null }); st = await H.api('GET', '/status'); ok(r.j.ok && st.j.pace.dayCap === 1600, '기본값으로 되돌림(null)');

  console.log('③ 웹앱 공통 문서');
  const at0 = Date.now() + 5000; await H.api('POST', '/cfg', { shared: { v: { 'pace.dayCap': 1200, nightOn: false, 'siteCfg.kyobo.dayCap': 50 }, at: at0, by: '웹앱 MJ-MAIN' }, sharedAck: { keys: ['pace.dayCap', 'kpipa.after'], at: at0 } });
  st = await H.api('GET', '/status'); s = await H.api('GET', '/settings');
  ok(st.j.pace.dayCap === 1200 && st.j.auto.nightOn === false && s.j.pend === 0 && s.j.shared.by === '웹앱 MJ-MAIN', '모든 PC 공통 값이 이 PC에 들어옴 · 올린 것 확인되면 올릴 것 비움', JSON.stringify({ d: st.j.pace.dayCap, n: st.j.auto.nightOn, p: s.j.pend }));
  ok(s.j.rows.some((x) => x.k === 'siteCfg.kyobo.dayCap' && x.v === 50) && s.j.log.some((e) => e.web && e.k === 'nightOn'), '바깥 사이트 한도도 · 웹앱에서 바꾼 것도 기록');
  await H.api('POST', '/set', { k: 'pace.hourCap', v: 100 }); await H.api('POST', '/cfg', { shared: { v: { 'pace.dayCap': 1300 }, at: at0 + 1, by: '웹앱' } });
  st = await H.api('GET', '/status'); ok(st.j.pace.hourCap === 100 && st.j.pace.dayCap === 1300 && st.j.auto.nightOn === true, '이 PC가 더 늦게 바꾼 값(한 시간 100)은 그대로 · 문서에서 빠진 값은 기본값으로', JSON.stringify({ h: st.j.pace.hourCap, d: st.j.pace.dayCap, n: st.j.auto.nightOn }));
  await H.api('POST', '/cfg', { shared: { v: { 'pace.dayCap': 5 }, at: 1000, by: '옛 문서' } }); st = await H.api('GET', '/status'); ok(st.j.pace.dayCap === 1300, '더 옛 문서는 버림');
  ok(st.j.set && st.j.set.n >= 2 && st.j.set.d['pace.dayCap'], '상태에 기본값과 다른 설정 요약(웹앱 기기 표)', JSON.stringify(st.j.set));

  console.log('④ 잠깐 멈춤 · 지금 읽기');
  await H.api('POST', '/cfg', { on: true, src: 'pc' }); r = await H.api('POST', '/read/now', {}); ok(r.j.ok, '▶ 지금 읽기', r.j.msg);
  r = await H.api('POST', '/pause', { min: 1 }); ok(r.j.ok && r.j.state.on === false && r.j.state.pause > Date.now(), '⏸ 잠깐 멈춤 — 꺼지고 다시 켤 시각을 앎');
  { const f = path.join(H.D, 'home', 'col2.json'); const c = JSON.parse(fs.readFileSync(f, 'utf8')); ok(c.pauseUntil > 0, '멈춤 시각은 파일에(도우미가 다시 켜져도)', JSON.stringify(Object.keys(c))); }
  r = await H.api('POST', '/pause', { min: 0 }); st = await H.api('GET', '/status'); ok(st.j.on === true && !st.j.pause, '[다시 켜기]면 곧바로 다시 켬');
  ok(!/password|"pw"|비밀번호값/.test(JSON.stringify((await H.api('GET', '/settings')).j.rows)), '설정 표에 계정·비밀값 없음');
  await H.stop();

  console.log('⑤ 웹앱 사본');
  const app = fs.readFileSync(path.join(L.ROOT, '..', '..', 'src', 'app.html'), 'utf8');
  const m = /\/\*C2SET\{\*\/([\s\S]*?)\/\*\}C2SET\*\//.exec(app); let W = null; try { W = m && JSON.parse(m[1]); } catch (e) {}
  const lite = SM.makeSettings({ get: () => ({}), save: () => {}, COL2: JSON.parse(JSON.stringify(COL2)) }).lite();
  ok(W && JSON.stringify(W) === JSON.stringify(lite), '웹앱 ⚙ 설정 › 번외 칸 표(C2SET) = 이 표(이름·범위·기본값) — 다르면 node tests/t_settings.js --print 로 새로 붙임', W ? W.length + '/' + lite.length : '없음');
  if (process.argv.includes('--print')) console.log(JSON.stringify(lite));
  L.done('t_settings');
})().catch((e) => { console.error(e); process.exit(1); });
