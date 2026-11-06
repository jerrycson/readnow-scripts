// tOSSESS — 정범님 11/06 '한 세션(한 묶음의 주문)만 자동화 · 세션 사이엔 반드시 관리자의 허락 — 세션마다 시작 단추 한 번'
//  (정범님 11/06 바로잡음 '마감·이어 돌기 기능은 그대로 두고 기본으로 꺼 놓기만')
//  ① 기본(loopOn 없음 — 이미 저장된 설정 그대로) 가짜 원스톱 문서로 CHECK 뒤 NEXT — 남은 주문 2건 → ph END · pendLeft 2 · P1로 가지 않음 · '이번 세션 끝 — … 이어 하지 않음'
//  ② loopOn 켬(maxLoop 3) → NEXT가 P1(다음 묶음) · 묶음 수를 다 쓰면 END
//  ③ 마감 켬 · 마감 시각 지남 → osCutoffTick이 shipOneShot({auto:true})를 부름 · 마감 꺼짐(기본) → 안 부름
//  ④ ⚙ 원스톱 설정 칸에 마감·이어서 칸이 보이고 '세션마다 ▶ 단추 한 번이 기본' 안내
//  ⑤ ⏰ 정한 시각(정범님 11/06): 꺼짐 → 안 함 · 켬 → 그날 처음이어도 시작(auto·sched) · 같은 시각 두 번 안 함 · 돌던 세션 있으면 끝난 뒤 · 주문 0건 → '주문 없음' 기록 · 너무 늦게 열림 → '놓침' 기록만
//  시험 자료에 손님 이름 없음(공개 저장소)
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => {
  p.on('dialog', (d) => d.accept());
  await p.evaluate(require('./seed.js'));
  const o = await p.evaluate(async () => { const o = {}; S.user = S.user || { email: 'tester@x' }; S.app = S.app || {};
    const puts = []; window.osPut = async (id, patch, line, lv) => { puts.push({ id, patch: JSON.parse(JSON.stringify(patch || {})), line, lv }); return true; };
    window.osPending = async () => ({ n: 2, al: ['A-91', 'A-92'], y24: 0, cash: 0 });
    const r = { id: 't_sess', status: 'run', ph: 'NEXT', loops: 0, cur: 0, bt: [{ n: 1, al: ['A-01'], chk: { fresh: true, left: 0 } }], warn: [], log: [] };
    /* ① */ S.app.oneShot = { maxLoop: 5 }; o.cf0 = { loopOn: osCfg().loopOn, cutOn: osCfg().cutOn }; await OS_FN.NEXT(r); o.a = puts.slice(-1)[0];
    /* ② */ S.app.oneShot = { loopOn: true, maxLoop: 3 }; await OS_FN.NEXT(r); o.b = puts.slice(-1)[0]; await OS_FN.NEXT({ ...r, loops: 2 }); o.b2 = puts.slice(-1)[0];
    /* ③ */ const calls = []; const keepShip = window.shipOneShot; window.shipOneShot = async (x) => { calls.push(JSON.parse(JSON.stringify(x || {}))); return 'x'; }; window.alpsFetch = async () => ({ ok: true });
    const keepOs = { drive: S.os.drive, lock: S.os.lock, doc: S.os.doc, cutNone: S.os.cutNone }; const FS = window.__FS;
    const prep = async () => { S.os.drive = null; S.os.lock = { n: { [osDay()]: 1 } }; S.os.doc = null; S.os.cutNone = null; if (FS.shp_runs && FS.shp_runs._lock) delete FS.shp_runs._lock.autoDay; try { await db.collection('shp_runs').doc('_lock').set({ autoDay: null }, { merge: true }); } catch (e) {} };
    S.app.oneShot = {}; await prep(); await osCutoffTick(); await new Promise((res) => setTimeout(res, 300)); o.offCalls = calls.length;
    S.app.oneShot = { cutOn: true, cutoff: '00:00' }; await prep(); await osCutoffTick(); await new Promise((res) => setTimeout(res, 300)); o.onCalls = calls.slice(); o.noAdm = typeof OS_ADMIN_START === 'undefined';
    /* ⑤ */ { calls.length = 0; const hm = (d) => { const k = new Date(Date.now() + 9 * 3600e3 - d * 60e3); return String(k.getUTCHours()).padStart(2, '0') + ':' + String(k.getUTCMinutes()).padStart(2, '0'); }; const t1 = hm(1), t2 = hm(0), t3 = hm(3), t4 = hm(200);
      const sd = () => (((FS.shp_runs || {})._lock || {}).schedDone || {})[osDay()] || {}; if (FS.shp_runs && FS.shp_runs._lock) FS.shp_runs._lock.schedDone = {};
      const go = async (doc) => { S.os.drive = null; S.os.doc = doc || null; S.os.lock = { ...(((FS.shp_runs || {})._lock) || {}), n: {} }; await osSchedTick(); await new Promise((res) => setTimeout(res, 200)); };
      window.osPending = async () => ({ n: 2, al: ['A-91', 'A-92'], y24: 0, cash: 0 });
      S.app.oneShot = { schedOn: false, schedAt: t1 }; await go(); o.s0 = calls.length;
      S.app.oneShot = { schedOn: true, schedAt: t1 }; await go(); o.s1 = calls.slice(); o.s1d = sd()[t1];
      await go(); o.s1b = calls.length;
      S.app.oneShot = { schedOn: true, schedAt: [t1, t2].join(',') }; await go({ status: 'run' }); o.s2run = calls.length; await go({ status: 'done' }); o.s2 = calls.slice(-1)[0]; o.s2n = calls.length;
      window.osPending = async () => ({ n: 0, al: [], y24: 0, cash: 0 }); S.app.oneShot = { schedOn: true, schedAt: t3 }; await go(); o.s3n = calls.length; o.s3d = sd()[t3];
      window.osPending = async () => ({ n: 2, al: ['A-91'], y24: 0, cash: 0 }); S.app.oneShot = { schedOn: true, schedAt: t4 }; await go(); o.s4n = calls.length; o.s4d = sd()[t4]; o.t = [t1, t2, t3, t4];
      S.app.oneShot = { schedOn: true, schedAt: t1, schedWd: [(new Date(Date.now() + 9 * 3600e3).getUTCDay() + 1) % 7] }; o.wdOff = osCfg().schedWd.length === 1; }
    Object.assign(S.os, keepOs); window.shipOneShot = keepShip;
    /* ④ */ S.app.oneShot = {}; const d = document.createElement('div'); d.innerHTML = shipOneShotHtml(); document.body.appendChild(d); d.querySelector('details') && (d.querySelector('details').open = true); const vis = (s) => { const e = d.querySelector(s); return !!e && e.offsetParent !== null; };
    o.vis = { cut: vis('#os_cut'), cuton: vis('#os_cuton'), loop: vis('#os_loop'), ml: vis('#os_ml'), loopChk: !!(d.querySelector('#os_loop') || {}).checked, cutChk: !!(d.querySelector('#os_cuton') || {}).checked }; o.setTxt = /세션마다 ▶ 단추 한 번이 기본/.test(d.textContent); d.remove();
    return o; });
  console.log(JSON.stringify(o).slice(0, 1500));
  ok(o.cf0.loopOn === false && o.cf0.cutOn === false && o.a && o.a.patch.ph === 'END' && o.a.patch.pendLeft === 2 && /이번 세션 끝 — 새로 들어온 주문 2건.*이어 하지 않음/.test(o.a.line || ''), '① 기본(loopOn·cutOn 없음 → 꺼짐 · 예전 maxLoop 5가 있어도): NEXT 남은 주문 2건 → ph END · pendLeft 2 · P1로 가지 않음');
  ok(o.b && o.b.patch.ph === 'P1' && o.b.patch.loops === 1 && o.b2 && o.b2.patch.ph === 'END' && o.b2.patch.pendLeft === 2, '② loopOn 켬 → NEXT가 P1(다음 묶음) · 묶음 수(3)를 다 쓰면 END');
  ok(o.offCalls === 0, '③ 마감 꺼짐(기본) → 마감 시각이 지나도 shipOneShot 부르지 않음');
  ok(o.noAdm && o.onCalls.length === 1 && o.onCalls[0].auto === true, '③ 마감 켬 → 마감 시각 지나면 shipOneShot({auto:true}) 한 번 ' + JSON.stringify(o.onCalls));
  ok(o.vis.cut && o.vis.cuton && o.vis.loop && o.vis.ml && !o.vis.loopChk && !o.vis.cutChk && o.setTxt, '④ ⚙ 원스톱 설정: 마감·이어서 칸 보임(기본 꺼짐) · 「세션마다 ▶ 단추 한 번이 기본」 안내 ' + JSON.stringify(o.vis));
  ok(o.s0 === 0, '⑤ 정한 시각 꺼짐(기본) → 시각이 지나도 시작 안 함');
  ok(o.s1.length === 1 && o.s1[0].auto === true && o.s1[0].sched === o.t[0] && o.s1d && o.s1d.st === '시작', '⑤ 정한 시각 켬 → 그날 처음이어도(앞서 돌린 적 없음) shipOneShot({auto, sched}) · schedDone 기록 ' + JSON.stringify(o.s1));
  ok(o.s1b === 1, '⑤ 같은 시각은 두 번 시작하지 않음');
  ok(o.s2run === 1 && o.s2n === 2 && o.s2.sched === o.t[1], '⑤ 돌던 세션이 있으면 기다렸다가 끝난 뒤 바로 시작');
  ok(o.s3n === 2 && o.s3d && o.s3d.st === '주문 없음', "⑤ 출고할 주문 0건이면 시작 안 하고 '주문 없음' 기록");
  ok(o.s4n === 2 && o.s4d && o.s4d.st === '놓침', "⑤ 그 시각 뒤 2시간 넘어 열림 → 시작 안 하고 '놓침' 기록 " + JSON.stringify(o.s4d));
  console.log(bad ? `❌ tOSSESS 실패 ${bad}` : '✓ tOSSESS 통과'); });
