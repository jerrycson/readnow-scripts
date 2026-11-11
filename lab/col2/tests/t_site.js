/* t_site — (11/11 정범님 '바깥 사이트 읽기 몫') 알라딘 몫(사람 속도 두 배 · makePace)과 바깥 사이트 몫(makeSitePace)을 따로
 *  ① 사이트마다 간격·하루 상한이 따로 — 교보를 다 써도 예스24·번개장터는 그대로 · 알라딘 몫은 셈하지 않음
 *  ② 같은 사이트(host)를 쓰는 출처는 간격을 같이 셈(예스24·예스24 중고)
 *  ③ 429면 그 사이트만 쉼
 *  ④ 그림자 일 차례: 알라딘 하루 몫을 다 써도 바깥 사이트 일은 차례를 받음(col2-jobs 글자 확인)
 * 실행: node tests/t_site.js */
const L = require('./lib.js'); const { ok } = L; const fs = require('fs'), path = require('path'), os = require('os');
const { makePace, makeSitePace } = require('../helper/col2-pace.js');
(async () => {
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'col2s_')); let t = Date.parse('2026-11-11T03:00:00Z'); const now = () => t; const sleep = async (ms) => { t += ms; };
  const SRC = { kyobo: { host: 'search.kyobobook.co.kr', label: '교보문고', gapMs: 2500, dayCap: 3 }, yes24: { host: 'www.yes24.com', label: '예스24', gapMs: 2500, dayCap: 5 }, yes24used: { host: 'www.yes24.com', label: '예스24 중고', gapMs: 3000, dayCap: 5 }, bunjang: { host: 'api.bunjang.co.kr', label: '번개장터', gapMs: 3000, dayCap: 5 } };
  const SP = makeSitePace(path.join(D, 's.json'), (s) => ({ ...SRC[s], jitter: 0, cool429Min: 10 }), { now, sleep });
  const AP = makePace(path.join(D, 'a.json'), () => ({ minGapMs: 4000, jitter: 0, hourCap: 240, dayCap: 1600, cool429Min: 10 }), { now, sleep });
  console.log('① 사이트마다 따로');
  for (let i = 0; i < 3; i++) await SP.take('kyobo'); const c = SP.check('kyobo'); ok(!c.ok && /교보문고 하루 3번까지/.test(c.why), '교보 하루 상한을 다 쓰면 교보만 멈춤', c.why);
  ok(SP.check('bunjang').ok && SP.check('yes24').ok, '번개장터·예스24는 그대로');
  ok(AP.state().dayN === 0 && AP.state().hourN === 0, '바깥 사이트 읽기는 알라딘 몫(시간·하루)을 쓰지 않음', AP.state());
  console.log('② 같은 사이트는 간격을 같이');
  await SP.take('yes24'); const w = SP.check('yes24used'); ok(w.ok && w.waitMs >= 2900, '예스24를 읽은 바로 뒤 예스24 중고는 같은 사이트라 간격을 기다림', w.waitMs); ok(SP.check('bunjang').waitMs === 0 || SP.check('bunjang').waitMs < 3000, '다른 사이트는 따로');
  console.log('③ 429는 그 사이트만');
  SP.fail('bunjang', '429'); const b = SP.check('bunjang'); ok(!b.ok && /번개장터.*쉬는 중\(이 사이트만\)/.test(b.why), '번개장터 429 → 번개장터만 10분 쉼', b.why); ok(SP.check('yes24used').ok, '예스24는 그대로');
  const st = SP.state(); ok(st.sites.some((x) => x.src === 'kyobo' && x.n === 3 && x.cap === 3) && st.n === 4, '화면용 — 오늘 사이트마다 쓴 수/상한', JSON.stringify(st));
  console.log('④ 그림자 일 차례 — 알라딘 몫과 바깥 몫 분리');
  { const J = fs.readFileSync(path.join(L.ROOT, 'helper', 'col2-jobs.js'), 'utf8'); ok(/cls === 'ext'/.test(J) && /ctx\.site\.check\(sk\)/.test(J) && /const SP = ctx\.site && SK/.test(J), '바깥 일(cls ext)은 사이트 몫으로 차례 · 알라딘 일만 알라딘 몫');
    const Hs = fs.readFileSync(path.join(L.ROOT, 'helper', 'readnow-col2-helper.js'), 'utf8'); ok(/site: SITE\.state\(\)/.test(Hs) && /CORE\.ext\.SOURCES/.test(Hs), '상태에 바깥 사이트 몫 · 간격·상한은 운영 외부 정보 출처 설정 그대로');
    const U = fs.readFileSync(path.join(L.ROOT, 'helper', 'col2-ui.js'), 'utf8'); ok(/🟧 알라딘 몫/.test(U) && /🌐 바깥 사이트 몫/.test(U), '옆 창 ▶ 지금 칸에 알라딘 몫·바깥 사이트 몫 따로'); }
  L.done('t_site');
})();
