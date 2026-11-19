/* tC2NAME1_1120 — 정범님 11/20 01:23 '이지클린으로 메모리를 정리하자 번외 수집기가 닫힘 · 웹앱에서 열려는데 HOME인데 HOME에서 열라며 안 열림'
 *  원인: 이지클린이 브라우저 저장 자료를 지워 웹앱 기기 이름(rn-device)이 비었는데, 되찾는 길이 번외 수집기(127.0.0.1:8797)뿐이라 번외가 죽어 있으면 못 켬.
 *  ① 이름 빔 + 로컬 도우미(8899 whoami)가 HOME → 번외 단추를 누르면 이름을 되찾고(app_devices 기록) 켜기를 그대로 이어 감
 *  ② 이름 빔 + 도우미·번외 모두 답 없음 → 새 안내 글(⚙ 설정 ① 이 기기 이름에 HOME를 적으면 바로 켜집니다) · 켜지 않음
 *  ③ 이름 있음 + 다른 PC → 예전 글('그 PC(HOME)의 웹앱에서 누르세요')
 *  ④ 이름 빔 + 도우미가 다른 PC 이름 → 그 PC 이름으로 받지 않고 새 안내 글
 *  ⑤ 이름 빔 + 번외(8797 status · pcSrc pc)가 HOME → 도움 없이도 되찾음 · 번외 status가 pcSrc os(컴퓨터 이름 추측)면 믿지 않음
 *  ⑥ 로거 묶음 막음(LOGGER로 시작하지 않는 로거 칸) · 출고 PC 막음 그대로
 *  ⑦ 시작 때(verifyDevice) 이름이 비었고 도우미가 답하면 저절로 되찾음 · 이름이 이미 있으면 도우미에 묻지 않음
 *  ⑧ 이름 충돌 안내에 '브라우저 자료를 지운 뒤라면 같은 PC일 가능성이 큼 — N분 뒤 가져오기 단추가 생김'
 * 실행: cd pw && RN_PORT=<포트> node tC2NAME1_1120.js */
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x != null ? JSON.stringify(x).slice(0, 500) : ''); } else console.log('  ✓', m); };

(async () => { await require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
  const st = { helper: null, c2: null, hcalls: 0, c2calls: 0 };
  const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' };
  await p.route(/127\.0\.0\.1:8899/, async (rt) => { if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS }); st.hcalls++; if (!st.helper) return rt.abort(); return rt.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify({ ok: true, pc: st.helper }) }); });
  await p.route(/127\.0\.0\.1:8797/, async (rt) => { if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: CORS }); st.c2calls++; if (!st.c2) return rt.abort(); return rt.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify({ ok: true, ...st.c2 }) }); });
  await p.evaluate(() => { window.__T = []; const t0 = window.toast; window.toast = (m, ...a) => { window.__T.push(String(m)); return t0(m, ...a); }; window.__STARTS = []; window.c2Start = async (pc) => { window.__STARTS.push(pc); }; });
  const reset = async (name, helper, c2) => { st.helper = helper; st.c2 = c2; st.hcalls = 0; st.c2calls = 0;
    await p.evaluate(async (n) => { try { clearInterval(S._devRecT); } catch (e) {} S._devRecT = null; S._devRec = null; S._devAdopt = 0; window.__T.length = 0; window.__STARTS.length = 0; if (n) localStorage.setItem('rn-device', n); else localStorage.removeItem('rn-device'); S.devOk = !!n; S.devConflict = null;
      for (const k of ['HOME', 'JS-PHONE', 'MJ-MAIN', 'LOGGER']) { try { await db.collection('app_devices').doc(k).delete(); } catch (e) {} } }, name || ''); };
  const click = (pc) => p.evaluate(async (pc) => { const b = document.createElement('button'); b.dataset.c2on = pc; document.body.appendChild(b); b.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); await new Promise((r) => setTimeout(r, 6500)); b.remove(); return { name: localStorage.getItem('rn-device') || '', T: window.__T.slice(), starts: window.__STARTS.slice() }; }, pc);

  console.log('① 이름 빔 + 도우미가 HOME → 이름 되찾고 켜기 이어 감');
  await reset('', 'HOME', null); let r = await click('HOME');
  ok(r.name === 'HOME', '웹앱 기기 이름을 HOME으로 되찾음', r);
  ok(r.starts.join() === 'HOME', '되찾은 뒤 번외 켜기(c2Start HOME)를 그대로 이어 감', r.starts);
  ok(!r.T.some((t) => /웹앱에서 누르세요|이름이 비어 있음\(브라우저/.test(t) && !/씀/.test(t)), '막는 글 없음', r.T);
  ok(r.T.some((t) => /로컬 도우미가 아는 이름 'HOME'/.test(t)), '토스트로 알림(로컬 도우미가 아는 이름)', r.T);
  ok(await p.evaluate(async () => (await db.collection('app_devices').doc('HOME').get()).exists), 'app_devices/HOME에 이 브라우저 기록');

  console.log('② 이름 빔 + 답 없음 → 새 안내 글');
  await reset('', null, null); r = await click('HOME');
  ok(r.name === '' && r.starts.length === 0, '이름 비어 있고 켜지 않음', r);
  ok(r.T.some((t) => /기기 이름이 비어 있음\(브라우저 자료를 지우면 생김\) — ⚙ 설정 ① 이 기기 이름에 HOME를 적으면 바로 켜집니다/.test(t)), '새 안내 글', r.T);
  ok(!r.T.some((t) => /그 PC\(HOME\)의 웹앱에서 누르세요/.test(t)), '예전 글은 안 나옴(이름이 비었을 때)', r.T);

  console.log('③ 이름 있음 + 다른 PC → 예전 글');
  await reset('JS-PHONE', 'HOME', { pc: 'HOME', pcSrc: 'pc' }); r = await click('HOME');
  ok(r.name === 'JS-PHONE' && r.starts.length === 0, '이름 그대로 · 켜지 않음', r);
  ok(r.T.some((t) => /그 PC\(HOME\)의 웹앱에서 누르세요.*이 기기는 JS-PHONE/.test(t)), '예전 글 그대로', r.T);
  ok(st.hcalls === 0 && st.c2calls === 0, '이름이 있으면 도우미·번외에 묻지 않음', { h: st.hcalls, c: st.c2calls });

  console.log('④ 이름 빔 + 도우미가 다른 PC 이름');
  await reset('', 'MJ-MAIN', null); r = await click('HOME');
  ok(r.name === '' && r.starts.length === 0 && r.T.some((t) => /이 기기 이름에 HOME를 적으면/.test(t)), '다른 PC 이름은 받지 않고 새 안내 글', r);

  console.log('⑤ 이름 빔 + 번외 status가 HOME');
  await reset('', null, { pc: 'HOME', pcSrc: 'pc' }); r = await click('HOME');
  ok(r.name === 'HOME' && r.starts.join() === 'HOME', '번외가 아는 이름(pcSrc pc)으로 되찾고 켜기 이어 감', r);
  await reset('', null, { pc: 'HOME', pcSrc: 'os' }); r = await click('HOME');
  ok(r.name === '' && r.starts.length === 0, '번외가 컴퓨터 이름을 추측한 것(pcSrc os)은 믿지 않음', r);

  console.log('⑥ 로거·출고 막음 그대로');
  await reset('HOME', null, null); r = await click('PUBX'); // 공개 전용 칸이 아닌 보통 이름 + 이름 다름 → 예전 글
  ok(r.starts.length === 0 && r.T.some((t) => /그 PC\(PUBX\)의 웹앱에서 누르세요/.test(t)), '다른 PC 칸은 막음', r);
  await reset('LOGGER', null, null); await p.evaluate(() => { window.__rnBeats = { pcs: { 'PUBX': { pubOnly: true } } }; });
  r = await p.evaluate(async () => { localStorage.setItem('rn-device', 'PUBX'); S.devOk = true; const b = document.createElement('button'); b.dataset.c2on = 'PUBX'; document.body.appendChild(b); b.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); await new Promise((r) => setTimeout(r, 400)); b.remove(); return { T: window.__T.slice(), starts: window.__STARTS.slice() }; });
  ok(r.starts.length === 0 && r.T.some((t) => /LOGGER로 시작하지 않아 로거 묶음으로 깔 수 없습니다/.test(t)), '로거 묶음 이름 막음(LOGGER로 시작하지 않음)', r);
  await reset('MJ-MAIN', null, null); await p.evaluate(() => { window.c2SoloShipBusy = () => '출고 중'; });
  r = await p.evaluate(async () => { const b = document.createElement('button'); b.dataset.c2on = 'MJ-MAIN'; document.body.appendChild(b); b.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); await new Promise((r) => setTimeout(r, 400)); b.remove(); return { T: window.__T.slice(), starts: window.__STARTS.slice(), adm: isAdminDevice() }; });
  ok(r.starts.length === 0 && r.T.some((t) => /출고가 끝난 뒤 다시 누르세요/.test(t)), '출고 PC 출고 중 막음 그대로', r);

  console.log('⑦ 시작 때 저절로');
  await reset('', 'HOME', null); await p.evaluate(async () => { await verifyDevice(); await new Promise((r) => setTimeout(r, 5500)); });
  ok(await p.evaluate(() => localStorage.getItem('rn-device') === 'HOME'), '이름이 빈 채 열려도 도우미가 답하면 시작 때 저절로 HOME');
  await reset('HOME', 'JS-PHONE', null); await p.evaluate(async () => { await verifyDevice(); await new Promise((r) => setTimeout(r, 800)); });
  ok(st.hcalls === 0 && await p.evaluate(() => localStorage.getItem('rn-device') === 'HOME'), '이름이 있으면 시작 때 도우미에 묻지 않음 · 이름 그대로');
  await reset('', null, null); await p.evaluate(async () => { await verifyDevice(); await new Promise((r) => setTimeout(r, 6000)); });
  ok(await p.evaluate(() => localStorage.getItem('rn-device') == null && !!S._devRecT), '도우미 없는 기기는 조용히 넘어가고 10분마다 다시(타이머)');
  await p.evaluate(() => { clearInterval(S._devRecT); S._devRecT = null; });

  console.log('⑧ 이름 충돌 안내 글');
  const h = await p.evaluate(() => { S.devConflict = { name: 'HOME', ageMin: 3, stale: false, ua: 'x' }; S.devTry = 'HOME'; return devConflictHtml(); });
  ok(/브라우저 자료를 지운 뒤\(이지클린 등\)라면 같은 PC일 가능성이 큼 — 27분 뒤 '🖥 이 PC가 맞음 — 이름 가져오기' 단추가 생김/.test(h), '안내 글에 N분 뒤 가져오기 단추가 생김(30-3=27)', h.slice(0, 600));
  await p.evaluate(() => { S.devConflict = null; });
}); console.log(bad ? '\n❌ tC2NAME1_1120 실패 ' + bad + '건' : '\n✅ tC2NAME1_1120 모두 통과'); process.exit(bad ? 1 : 0); })();
