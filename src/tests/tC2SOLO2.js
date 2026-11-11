/* tC2SOLO2 — (11/12 col2rep6) 🔌 홀로 연결 첫 등록 순서 — PC마다 1·2·3
 *  ⚙ 설정 › 🔀 번외로 넘기기 · 🔌 칸 '처음 등록 순서'에 PC마다(col2_ctl 14일 안 소식 + 등록·요청한 PC)
 *  ① 번외 새 판(0.1.28 이상) ② 그 PC에서 「🔐 이 기기 등록」 두 번 ③ 관리자 기기 = 1분 안 🟢 / 로거 = HOME·JS-MAIN에서 [✓ 허락]
 *  지금 할 일(👉)이 PC마다 맞는 번호에 · 모두 끝나면 접힘 · 휴대폰 이름(JS-PHONE)은 목록에 안 넣음 · 브라우저 팝업 없음
 * 실행: cd pw && RN_PORT=<포트> node tC2SOLO2.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 800) : ''); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  let solo = { on: true, reg: 'link', live: false, okAt: null, err: '', fp: 'AAAA-BBBB-CCCC-DDDD', host: '' }; const pcName = 'HOME';
  const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
  await p.route(/127\.0\.0\.1:(8797|8898)/, async (rt) => { const u = new URL(rt.request().url()); if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS });
    const J = (x) => rt.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(x) });
    if (u.pathname === '/relay/pending') return J({ ok: true, want: [], sample: 0, pool: 0, fields: [], out: [], hot: false, pc: pcName, pcSrc: 'pc', ver: '0.1.28', kind: 'office', handBeat: {}, handAt: 0, solo });
    if (u.pathname === '/solo/st') return J({ ok: true, pub: '-----BEGIN PUBLIC KEY-----\nTEST\n-----END PUBLIC KEY-----\n', fp: solo.fp, pc: pcName, kind: 'office', solo });
    if (u.pathname === '/col2/status') return J({ ok: true, want: true, running: true, on: true, ver: '0.1.28', dayN: 3, dayCap: 1600, msg: '' });
    return J({ ok: true }); });
  const iso = (m) => new Date(Date.now() - m * 60e3).toISOString();
  await p.evaluate(async ({ a, b, c, old }) => { await db.collection('app_settings').doc('main').set({ cloudUrl: 'https://cloud.example.test' }, { merge: true }); localStorage.setItem('rn-device', 'HOME'); localStorage.setItem('rn-c2seen', '1'); S.devOk = true; S.app = S.app || {}; S.app.cloudUrl = 'https://cloud.example.test'; S.app.adminDevices = [];
    await db.collection('col2_ctl').doc('HOME').set({ at: a, st: { ver: '0.1.28', running: true } });
    await db.collection('col2_ctl').doc('JS-MAIN').set({ at: b, st: { ver: '0.1.22', running: true } });
    await db.collection('col2_ctl').doc('LOGGER').set({ at: c, st: { ver: '0.1.28', running: true } });
    await db.collection('col2_ctl').doc('JS-PHONE').set({ at: c, st: { ver: '0.1.28' } });
    await db.collection('col2_ctl').doc('OLDPC').set({ at: old, st: { ver: '0.1.10' } });
    await db.collection('app_settings').doc('col2_solo').set({ reqs: { LOGGER: { pub: 'PUBL', fp: 'LLLL-1111-2222-3333', at: a, by: '웹앱 LOGGER', kind: 'logger' } } }); }, { a: iso(1), b: iso(30), c: iso(2), old: iso(60 * 24 * 20) });
  const tick = () => p.evaluate(async () => { S._c2rTried = 0; clearTimeout(S._c2rT); await c2RelayTick(); clearTimeout(S._c2rT); });
  const draw = () => p.evaluate(async () => { c2SoloHtml(); await new Promise((r) => setTimeout(r, 400)); let d = document.getElementById('tsolo'); if (!d) { d = document.createElement('div'); d.id = 'tsolo'; d.style.cssText = 'position:fixed;top:60px;left:10px;z-index:99999;background:#fff;width:640px;max-height:800px;overflow:auto'; document.body.appendChild(d); } d.innerHTML = c2SoloHtml(); d.querySelectorAll('details').forEach((x) => (x.open = true)); return d.innerText; });
  const step = (pc) => p.evaluate((pc) => { const r = document.querySelector(`#tsolo .c2sostep[data-c2sopc="${pc}"]`); if (!r) return null; const li = [...r.querySelectorAll('li')]; return { now: li.findIndex((x) => /👉/.test(x.textContent)) + 1, done: li.map((x) => /✅/.test(x.textContent)), txt: r.innerText }; }, pc);
  let dlg = 0; p.on('dialog', (d) => { dlg++; d.dismiss(); });
  await tick(); await p.evaluate(() => { S._c2soCtlAt = 0; }); let txt = await draw();
  ok(/처음 등록 순서/.test(txt) && /PC마다 1·2·3/.test(txt), '🔌 칸에 처음 등록 순서(PC마다 1·2·3)', txt.slice(0, 600));
  let h = await step('HOME'), j = await step('JS-MAIN'), l = await step('LOGGER');
  ok(h && h.now === 2 && h.done[0] && /이 기기/.test(h.txt), 'HOME(이 기기 · 새 판) = 지금 할 일 2번(이 기기 등록)', h);
  ok(j && j.now === 1 && /0\.1\.22/.test(j.txt), 'JS-MAIN(옛 판 0.1.22) = 지금 할 일 1번(새 판 받기) · 지금 판 보임', j);
  ok(l && l.now === 3 && l.done[1] && /허락/.test(l.txt) && /LLLL-1111-2222-3333/.test(l.txt) && /로거/.test(l.txt), 'LOGGER(요청 남김) = 3번 HOME·JS-MAIN에서 허락 · 지문 보임', l);
  ok(!(await step('JS-PHONE')) && !(await step('OLDPC')), '휴대폰·14일 넘게 소식 없는 PC는 목록에 안 넣음');
  /* HOME 등록(관리자 기기 · 두 번) → ② 끝 · ③ 켜짐 기다림 → 켜짐 → ✓ 끝 */
  await p.evaluate(() => { S.app.adminDevices = ['HOME']; });
  await p.click('#tsolo [data-c2soreg]'); await p.waitForTimeout(600); await p.click('#tsolo [data-c2soreg]'); await p.waitForTimeout(1200);
  txt = await draw(); h = await step('HOME'); ok(h && h.done[1] && h.now === 3, 'HOME 등록 두 번 뒤 = 3번(🟢 켜짐 기다림)', h);
  solo = { ...solo, reg: 'ok', live: true, okAt: Date.now() }; await tick(); txt = await draw(); h = await step('HOME');
  ok(h && h.now === 0 && /✓ 끝/.test(h.txt), 'HOME 켜지면 ✓ 끝', h);
  /* 관리자 기기에서 LOGGER 허락 + 소식 → 모두 끝(JS-MAIN 빼고) */
  await p.evaluate(async (a) => { await db.collection('app_settings').doc('col2_solo').set({ pcs: { LOGGER: { pub: 'PUBL', fp: 'LLLL-1111-2222-3333', at: a, kind: 'logger' } } }, { merge: true }); await db.collection('app_settings').doc('col2_solo_seen').set({ LOGGER: { at: a, ver: '0.1.28' }, HOME: { at: a, ver: '0.1.28' } }); }, iso(0));
  await p.waitForTimeout(400); txt = await draw(); l = await step('LOGGER'); ok(l && /✓ 끝/.test(l.txt), 'LOGGER 허락·소식 있음 → ✓ 끝', l);
  ok(/👉 = 지금 할 일/.test(txt), 'JS-MAIN이 남아 있으면 순서표는 펼친 채', txt.slice(0, 200));
  ok(dlg === 0, '브라우저 팝업 없음');
  console.log(bad ? `✗ tC2SOLO2: ${bad}개 실패` : '✓ tC2SOLO2 모두 통과');
});
