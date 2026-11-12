// tC2STPUT — (11/12 col2rep6 · 진단 11/12 03:40 HOME 번외 상태가 00:12 0.1.25에서 멈춤 — 웹앱 탭 닫힘) 사무실 PC 수집기 다리가 번외 상태를 대신 씀
//   ① 이 PC 웹앱이 3분 넘게 번외에 안 왔으면(relay.pullAt) col2_ctl/<PC>.st(판·켜짐·오늘 몫·지금 글·새 판 받기 결과)를 씀 · by '수집기 다리'
//   ② 웹앱이 3분 안에 왔으면 · 🔌 홀로 연결이 살아 있으면 · 로거 번외면 · 도우미가 답하지 않으면 안 씀 · 5분에 한 번만
//   ③ 수집기 머리 그대로 · 손님 정보·키 칸 없음
// 실행: node src/tests/tC2STPUT.js
const fs = require('fs'); const path = require('path'); const cp = require('child_process');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const ROOT = path.resolve(__dirname, '..', '..'); const CS = fs.readFileSync(path.join(ROOT, 'src', 'readnow-collector.src.js'), 'utf8');
const i = CS.indexOf('let stAt = 0; const stPut'); const j = CS.indexOf('G.__rnC2yStPut = stPut;', i); if (i < 0 || j < i) throw new Error('stPut 덩어리 못 찾음');
const body = CS.slice(i, j);
(async () => {
  let ST = null; const writes = []; let clock = Date.parse('2026-11-12T03:40:00+09:00');
  const realNow = Date.now; Date.now = () => clock;
  const firebase = { firestore: () => ({ collection: (c) => ({ doc: (id) => ({ set: async (v, o) => { writes.push({ c, id, v, o }); } }) }) }) };
  const gx = async (m, p) => (p === '/status' ? ST : null);
  const stPut = new Function('gx', 'firebase', body + '\nreturn stPut;')(gx, firebase);
  console.log('① 웹앱이 안 오면 대신 씀');
  ST = { ok: true, pc: 'HOME', kind: 'office', ver: '0.1.28', on: true, msg: '작업 창 숨김 · 일할 준비', auto: { dayN: 120, dayCap: 1600 }, upd: { at: '2026-11-12 01:10', msg: '새 판 없음(GitHub 0.1.28)' }, relay: { pullAt: clock - 30 * 60e3 }, solo: { live: false } };
  await stPut('HOME'); const w = writes[0];
  ok(writes.length === 1 && w.c === 'col2_ctl' && w.id === 'HOME' && w.o && Array.isArray(w.o.mergeFields) && w.o.mergeFields.includes('st'), 'col2_ctl/HOME에 한 번 · (fix3) st는 통째로(mergeFields — 옛 st.y24가 남지 않게)', writes);
  ok(w && w.v.st.ver === '0.1.28' && w.v.st.dayN === 120 && w.v.st.dayCap === 1600 && /수집기 다리/.test(w.v.by) && w.v.via === 'col' && w.v.st.upd && /새 판 없음/.test(w.v.st.upd.msg), '판·오늘 몫·새 판 받기 결과·by 수집기 다리', w && w.v);
  ok(w && !/rn-cred|password|token|key/i.test(JSON.stringify(w.v)), '키·계정 칸 없음');
  console.log('② 비킴');
  await stPut('HOME'); ok(writes.length === 1, '5분 안 두 번 안 씀');
  clock += 6 * 60e3; ST = { ...ST, relay: { pullAt: clock - 60e3 } }; await stPut('HOME'); ok(writes.length === 1, '웹앱이 3분 안에 왔으면 안 씀(웹앱이 씀)');
  clock += 6 * 60e3; ST = { ...ST, relay: { pullAt: clock - 10 * 60e3 }, solo: { live: true } }; await stPut('HOME'); ok(writes.length === 1, '🔌 홀로 연결이 살아 있으면 안 씀(번외가 직접)');
  clock += 6 * 60e3; ST = { ...ST, solo: { live: false }, kind: 'logger' }; await stPut('LOGGER'); ok(writes.length === 1, '로거 번외는 이 다리가 아님(로거 다리 rnC2lg)');
  clock += 6 * 60e3; ST = null; await stPut('HOME'); ok(writes.length === 1, '도우미가 답하지 않으면 안 씀(💓 hlp:false는 따로)');
  clock += 6 * 60e3; ST = { ok: true, pc: 'JS-MAIN', kind: 'office', ver: '0.1.28', on: true, auto: {}, relay: {}, solo: null }; await stPut('JS-MAIN'); ok(writes.length === 2 && writes[1].id === 'JS-MAIN', '웹앱이 한 번도 안 왔어도(pullAt 없음) 씀');
  console.log('③ 글 검사');
  ok(/if \(!y\.logger\) stPut\(pc, y\)\.catch/.test(CS), '사무실 PC 다리 한 바퀴에서 부름(로거 크롬은 앞에서 이미 빠짐)');
  let head0 = ''; try { head0 = cp.execSync('git -C ' + JSON.stringify(ROOT) + ' show origin/main:src/readnow-collector.src.js', { maxBuffer: 64e6 }).toString(); } catch (e) {}
  const hd = (s) => s.split('\n').filter((l) => /^\/\/ @(match|grant|connect|require|include|noframes|run-at)/.test(l)).join('\n').replace(/\?v=[\d.]+/g, '');
  ok(!head0 || hd(head0) === hd(CS), '수집기 머리 그대로');
  Date.now = realNow; console.log(bad ? `✗ tC2STPUT: ${bad}개 실패` : '✓ tC2STPUT 모두 통과'); process.exit(bad ? 1 : 0);
})();
