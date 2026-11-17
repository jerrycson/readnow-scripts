// tBGCLOSE1117 — 정범님 11/17 13:31 「웹앱의 모든 배너/창들은 x표시 같은 단추뿐 아니라 빈 공간을 누르면 닫히게」
//  ① 덮개 창(askSheet) 바깥 누름 = 닫힘 · 확인 창이면 언제나 '취소'(false) — '예'는 절대 아님
//  ② 창 안에서 누르고 끌어 바깥에서 떼면 닫히지 않음(글 고르기 끌기)
//  ③ 손으로 적은 글이 있으면 첫 바깥 누름은 알림만 · 한 번 더 누르면 닫힘(취소)
//  ④ 덮개 없는 떠 있는 창·띠(알림 띠 · data-bgfloat)는 바깥을 누르면 닫히고, 그 누름은 누른 단추에 그대로 닿음
//  ⑤ 글 묻는 창(askText) 바깥 = 취소(null) · Esc 닫기 그대로
//  PC(마우스)와 휴대폰(손가락 누름) 둘 다
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 300)); } else console.log('  ✓', m); };
const H = require('./harness.js'); /* 폰도 같은 틀(touch:true · 390×844) — harnessM.js는 시험 포트(RN_PORT)를 안 따름 */
const run = (phone) => async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(400); const tag = phone ? '[폰]' : '[PC]';
  await p.addStyleTag({ content: '#seenp,#dlp,.rnfab,.rnfab-bg{display:none!important}' });
  const tap = async (x, y) => { if (phone) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); await p.waitForTimeout(250); };
  const open = (o) => p.evaluate((o) => { window.__r = 'pending'; askSheet(Object.assign({ title: '시험 확인', html: '<p>돈이 드는 단계 시험</p><input id="bgc_in" style="width:200px">', ok: '💳 결제', no: '취소' }, o || {})).then((v) => { window.__r = v; }); }, o);
  const has = () => p.evaluate(() => !!document.querySelector('.bigask-ov'));
  const r = () => p.evaluate(() => window.__r);
  // ① 바깥 누름 = 취소
  await open(); await p.waitForTimeout(300); ok(await has(), tag + ' 확인 창 열림');
  await tap(6, 300); ok(!(await has()), tag + ' ① 바깥(덮개) 누름 → 닫힘'); ok((await r()) === false, tag + ' ① 확인 창 바깥 = 취소(false) — 결제 안 함', await r());
  // ② 창 안에서 끌어 바깥에서 뗌 → 안 닫힘 (마우스만 — 손가락 끌기는 스크롤이라 누름이 생기지 않음)
  if (!phone) { await open(); await p.waitForTimeout(300); const bx = await p.evaluate(() => { const b = document.querySelector('.bigask').getBoundingClientRect(); return { x: b.left + b.width / 2, y: b.top + 20 }; });
    await p.mouse.move(bx.x, bx.y); await p.mouse.down(); await p.mouse.move(bx.x - 200, bx.y + 5, { steps: 6 }); await p.mouse.move(6, 300, { steps: 6 }); await p.mouse.up(); await p.waitForTimeout(250);
    ok(await has(), tag + ' ② 안에서 끌어 바깥에서 뗌 → 그대로 열림'); ok((await r()) === 'pending', tag + ' ② 아무것도 정해지지 않음', await r());
    await p.keyboard.press('Escape'); await p.waitForTimeout(250); ok(!(await has()) && (await r()) === false, tag + ' Esc 닫기 그대로(취소)', await r()); }
  // ③ 적은 글 지킴
  await open(); await p.waitForTimeout(300); await p.click('#bgc_in'); await p.keyboard.type('적던 글'); await tap(6, 300);
  ok(await has(), tag + ' ③ 적은 글이 있으면 첫 바깥 누름은 닫지 않음'); ok((await p.evaluate(() => (document.getElementById('bgc_in') || {}).value)) === '적던 글', tag + ' ③ 적던 글 그대로');
  await tap(6, 300); ok(!(await has()) && (await r()) === false, tag + ' ③ 한 번 더 누르면 닫힘(취소)', await r());
  // 안내만 하는 창(no:false) 바깥 = 그냥 닫힘
  await open({ no: false, ok: '닫기', html: '<p>안내</p>' }); await p.waitForTimeout(300); await tap(6, 300); ok(!(await has()), tag + ' 안내 창 바깥 → 닫힘');
  // ④ 떠 있는 창 — 바깥 누름은 다른 단추에도 그대로 닿음
  await p.evaluate(() => { window.__hit = 0; const f = document.createElement('div'); f.setAttribute('data-bgfloat', '1'); f.id = 'bgcf'; f.style.cssText = 'position:fixed;right:10px;top:120px;width:150px;height:80px;background:#fff;border:1px solid #888;z-index:9000'; f.innerHTML = '<button data-bgx="1" id="bgcfx">✕</button><span id="bgcin">안쪽</span>'; f.querySelector('#bgcfx').onclick = () => f.remove(); document.body.appendChild(f);
    const b = document.createElement('button'); b.id = 'bgcbtn'; b.textContent = '다른 단추'; b.style.cssText = 'position:fixed;left:10px;top:200px;z-index:9000;width:120px;height:40px'; b.onclick = () => { window.__hit++; }; document.body.appendChild(b); });
  const ib = await p.evaluate(() => { const b = document.getElementById('bgcf').getBoundingClientRect(); return { x: b.left + 100, y: b.bottom - 12 }; /* ✕에서 먼 안쪽 — 손가락 누름은 가까운 단추로 붙음 */ });
  await tap(ib.x, ib.y); ok(await p.evaluate(() => !!document.getElementById('bgcf')), tag + ' ④ 창 안을 누르면 그대로');
  await tap(60, 220); await p.waitForTimeout(150); ok(await p.evaluate(() => !document.getElementById('bgcf')), tag + ' ④ 바깥(다른 단추) 누름 → 떠 있는 창 닫힘'); ok((await p.evaluate(() => window.__hit)) === 1, tag + ' ④ 그 누름이 다른 단추에도 한 번에 닿음', await p.evaluate(() => window.__hit));
  // 알림 띠(옛 alert 자리) — 바깥 누르면 닫힘
  await p.evaluate(() => { document.querySelectorAll('#rn-notes > div').forEach((d) => d.remove()); rnNoteW('시험 알림 띠'); }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.querySelectorAll('#rn-notes > div').length === 1), tag + ' 알림 띠 뜸'); await tap(60, 220); await p.waitForTimeout(150);
  ok(await p.evaluate(() => document.querySelectorAll('#rn-notes > div').length === 0), tag + ' 알림 띠 바깥 누름 → 닫힘');
  // ⑤ 글 묻는 창 바깥 = 취소
  await p.evaluate(() => { window.__t = 'pending'; askText('이름표 시험', '처음 글').then((v) => { window.__t = v; }); }); await p.waitForTimeout(300); await tap(6, 600);
  ok((await p.evaluate(() => window.__t)) === null && !(await p.evaluate(() => !!document.querySelector('.asktxt'))), tag + ' ⑤ 글 묻는 창 바깥 = 취소(null)', await p.evaluate(() => window.__t));
  await p.evaluate(() => document.getElementById('bgcbtn').remove()); };
(async () => { await H(run(false), { vp: { width: 1400, height: 900 } }); await H(run(true), { vp: { width: 390, height: 844 }, touch: true }); console.log(bad ? `❌ tBGCLOSE1117 실패 ${bad}` : '✓ tBGCLOSE1117 통과'); })();
