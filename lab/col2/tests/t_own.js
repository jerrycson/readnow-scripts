/* t_own — (11/10 아침 정범님 'HOME 한 대에서 그 PC 자리를 번외가 이어받는 길 · HOME을 번외 수집기용으로') 번외 쪽 🏠 이어받기 + 🚚 출고 뒤 한꺼번에 받기
 *  ① ⚙ '이 PC 알라딘 로그인 자리를 번외가 이어받음' → col2.json alOwn · 알라딘 읽기도 켬 · 다리(/al/feed) 답에 al.own 참(운영 수집기가 이것을 보고 자리를 놓음 — src/tests/tC2OWN.js)
 *  ② 끄면 al.own 거짓 · 로거 PC는 켜지지 않음(약속 0) · 화면에 단추 하나
 *  ③ 출고 중 쌓였다가 한꺼번에 온 쓰기(late 1)는 col2_alw 문서에 late 1로 남고 기록창에 '출고가 끝난 뒤 한꺼번에' 한 줄
 * 실행: node tests/t_own.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path');
(async () => {
  const H = await L.startHelper({ cfg: { on: true, auto: false, headless: true, pc: 'HOME', pcSrc: 'pc', watch: { tickSec: 60 } } });
  const st = async () => (await H.api('GET', '/status')).j; const feed = () => H.api('POST', '/al/feed', { by: 'HOME', seat: { ok: false, why: '시험' }, hold: { on: false }, opLostAt: 0, cfg: { off: false } });
  try {
    console.log('① 이어받기 켬');
    let f = await feed(); ok(f.j.ok && f.j.al && f.j.al.own === false, '처음엔 이어받기 꺼짐(al.own 거짓)');
    let r = await H.api('POST', '/cfg', { alOwn: true, src: 'pc' }); ok(r.j.alOwn === true && r.j.alWant === true, '⚙ 단추 하나 → alOwn 켬 · 알라딘 읽기도 함께 켬', { alOwn: r.j.alOwn, al: r.j.alWant });
    ok(JSON.parse(fs.readFileSync(path.join(H.D, 'home', 'col2.json'), 'utf8')).alOwn === true, '이 PC 설정(col2.json)에 남음');
    f = await feed(); ok(f.j.al.own === true, '다리 답에 al.own 참 → 운영 수집기가 이 PC 자리를 놓고 번외가 받음');
    ok(/🏠 이어받기/.test(f.j.al.msg || '') || f.j.al.seat === false, '자리 기다림 글에 이어받기 차례가 보임', f.j.al.msg);
    const jl = (await H.api('GET', '/log/lines?after=0')).j.lines.map((e) => e.x).join('\n'); ok(/번외가 이어받음/.test(jl), '기록창에 한 줄');
    console.log('② 끔 · 로거 · 화면');
    r = await H.api('POST', '/cfg', { alOwn: false, src: 'pc' }); f = await feed(); ok(r.j.alOwn === false && f.j.al.own === false, '끄면 al.own 거짓 → 운영이 곧바로 되찾음');
    await H.api('POST', '/cfg', { pc: 'LOGGER-1', pcSrc: 'pc' }); r = await H.api('POST', '/cfg', { alOwn: true, src: 'pc' }); f = await feed(); ok(r.j.alOwn === false && f.j.al.own === false, '로거 PC는 켜지지 않음(약속 0)');
    await H.api('POST', '/cfg', { pc: 'HOME', pcSrc: 'pc' });
    const html = (await H.req('GET', '/')).b + (await H.req('GET', '/s/col2-ui.js')).b; ok(/id="tg_alown"/.test(html) && /tg_alown', S\.alOwn, 'alOwn'/.test(html), '옆 창 ⚙ › 일 켜기·끄기에 🏠 단추 하나(탭을 닫는 수작업 없음)');
    console.log('③ 출고 뒤 한꺼번에 받은 쓰기');
    const ev = (i, late) => ({ id: 'start_' + i + (late ? 'L' : 'N'), k: 'start', at: Date.now() - i * 1000, in: { ono: 'O-' + i }, rq: [{ m: 'GET', u: '/scm/worder_process.aspx?cmd=StartDelivery&ono=O-' + i, q: { cmd: 'StartDelivery', ono: 'O-' + i } }], ok: true, http: 200, ...(late ? { late: 1 } : {}) });
    r = await H.api('POST', '/al/wfeed', { by: 'HOME', w: [ev(1, true), ev(2, true), ev(3, false)] }); ok(r.j.ok && r.j.ack.length === 3, '한꺼번에 온 쓰기 받음(ack)', r.j);
    await wait(300); const out = fs.readFileSync(path.join(H.D, 'home', 'relay-out.json'), 'utf8'); const docs = JSON.parse(out).filter((x) => x.c === 'col2_alw' && !/^day_/.test(x.id));
    ok(docs.length >= 3 && docs.filter((x) => x.v.late === 1).length === 2 && docs.filter((x) => x.v.late === 0).length >= 1, 'col2_alw 문서에 late 1(출고 뒤 한꺼번에) / 0(곧바로)로 가름', docs.map((x) => x.v.late));
    const jl2 = (await H.api('GET', '/log/lines?after=0')).j.lines.map((e) => e.x).join('\n'); ok(/출고 중 그 PC에 쌓였던 쓰기 2건/.test(jl2), '기록창에 "출고가 끝난 뒤 한꺼번에 받아 견줌" 한 줄');
  } finally { await H.stop(); }
  L.done('t_own');
})();
