/* tHEADBTN — 11/10 🌐 머리 받기 단추(웹앱 ⚙ 관리도구 › 🛰 PC 원격 조작) · 수집기 headget 명령 · 클라우드 진단 heads
 *  ① 단추 흐림/켜짐: readnow.kr 머리가 지금 것(HG_OLD)과 같으면 흐림 + '아직 머리 판 전' · 다르면 켜짐 · 이미 새 머리면 ✅(흐림) · 머리 받기를 모르는 옛 수집기면 흐림
 *  ② 출고 중 막힘: 출고 보호 중인 PC · 어느 PC든 출고 중일 때 MJ-MAIN · MJ-MAIN 출고 시간(원스톱 정한 시각 앞뒤) · 출고 표를 못 읽으면 막음 · 끝난/지난 칸은 막지 않음
 *  ③ 원격 맡김: 두 번 누르기(첫 번째는 아무것도 안 씀) → pc_ctl cmds.{PC} = headget(새 머리·판·감시기·로거) · 보내기 직전 출고 표를 다시 읽어 막힘이면 안 씀
 *  ④ 로거 처리: 로거는 감시기 화면 없음 · 쉬는 사이에만 · 설치 화면 하나만(알라딘·우리 숍 주소 없음) · 로더가 이미 연 판이면 다시 안 엶
 *  ⑤ 수집기: 설치 화면 주소(readnow.kr) · 감시기 PC면 둘 · 이미 새 머리면 아무것도 안 함 · 출고 중이면 미룸 · 대답에 '사람이 [업데이트]'
 *  ⑥ 팝업 없음(alert·confirm·prompt) · ⑦ 수집기 머리 그대로(나누기 결과 머리 서명 8559039d5a96110b) · ⑧ 클라우드 진단 heads
 * 실행: node src/tests/tHEADBTN.js (저장소 뿌리 기준 · 서버·브라우저 필요 없음) */
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const ROOT = [path.join(__dirname, '../..'), path.join(__dirname, '..')].find((p) => fs.existsSync(path.join(p, 'cloud/index.js')) && fs.existsSync(path.join(p, 'src/readnow-collector.src.js')));
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const cut = (s, a, b, incl) => { const i = s.indexOf(a); if (i < 0) throw new Error('못 찾음: ' + a.slice(0, 60)); const j = s.indexOf(b, i + a.length); if (j < 0) throw new Error('끝 못 찾음: ' + b.slice(0, 60)); return s.slice(i, incl ? j + b.length : j); };
const APP = rd('src/app.html'); const COL = rd('src/readnow-collector.src.js');
const NEW = '8ab2f661d1d8afa8', OLD = '8559039d5a96110b';
(async () => {
  /* 웹앱 순수 함수 */
  const hgSrc = cut(APP, "const HG_OLD = '", '/* ⟦hgState 끝⟧ */', true);
  const W = new Function(hgSrc.replace(/async function hgLoad[\s\S]*?\n(?=function hgOpts)/, '').replace(/function hgOpts[\s\S]*?\n(?=\/\* 출고 보호 판단)/, '') + '\nreturn { HG_OLD, HG_MJWIN, hgShip, hgState };')();
  const now = Date.parse('2026-11-10T01:00:00Z'); /* 한국 10:00 화요일 */
  const base = (x) => ({ hs: NEW, ver: '1.89.260', now, holds: {}, maxH: 1, mj: 'MJ-MAIN', sched: { on: false, at: [], wd: [] }, win: W.HG_MJWIN, loggers: ['LOGGER'], watchPcs: ['JS-MAIN', 'HOME'], ...(x || {}) });
  const pc = (n, hs, x) => ({ pcName: n, ver: '1.89.250', atMs: now - 60e3, tm: { hsig: hs, hg: 1, classic: '1.89.200', ...(x || {}) } });

  console.log('① 단추 흐림/켜짐');
  ok(W.HG_OLD === OLD, '머리 옮기기 전 머리 = ' + OLD);
  let s = W.hgState(pc('JS-MAIN', OLD), base({ hs: OLD })); ok(!s.ready && !s.can && /아직 머리 판 전/.test(s.why), 'readnow.kr 머리가 지금 것과 같으면 흐림 + 아직 머리 판 전');
  s = W.hgState(pc('JS-MAIN', OLD), base({ hs: null })); ok(!s.can && /읽는 중/.test(s.why), 'readnow.kr 머리를 아직 못 읽으면 흐림');
  s = W.hgState(pc('JS-MAIN', OLD), base({ hs: null, err: 'HTTP 404' })); ok(!s.can && /못 읽음/.test(s.why), 'readnow.kr이 안 열리면 흐림 + 까닭');
  s = W.hgState(pc('JS-MAIN', OLD), base()); ok(s.ready && s.can && s.mark === '—' && s.markT === '옛 머리', '머리 판 뒤 옛 머리 PC = 켜짐(— 옛 머리)');
  s = W.hgState(pc('JS-MAIN', NEW), base()); ok(s.isNew && !s.can && s.mark === '✅', '이미 새 머리 = ✅(누를 일 없음)');
  s = W.hgState(pc('JS-MAIN', OLD, { hwait: '1.89.260' }), base()); ok(s.can && s.mark === '⏳' && /머리 기다림/.test(s.markT), '빠른 업데이트로 못 받고 기다리는 PC = ⏳');
  s = W.hgState(pc('JS-MAIN', OLD, { hg: 0 }), base()); ok(!s.can && /머리 받기를 모름/.test(s.why), '머리 받기를 모르는 옛 수집기 = 흐림');

  console.log('② 출고 중 막힘');
  const H = (pcN, x) => ({ pc: pcN, why: '▶ 오늘 출고 끝까지', t0: now - 10 * 60e3, beat: now - 30e3, end: null, ...(x || {}) });
  s = W.hgState(pc('JS-MAIN', OLD), base({ holds: { a: H('JS-MAIN') } })); ok(!s.can && /출고 중/.test(s.why) && /0-1/.test(s.why), '출고 보호 중인 PC는 막음');
  s = W.hgState(pc('HOME', OLD), base({ holds: { a: H('JS-MAIN') } })); ok(s.can, '다른 PC가 출고 중이어도 출고와 무관한 PC(HOME)는 됨');
  s = W.hgState(pc('MJ-MAIN', OLD), base({ holds: { a: H('JS-MAIN') } })); ok(!s.can && /MJ-MAIN 보호/.test(s.why), '어느 PC든 출고 중이면 MJ-MAIN은 막음');
  s = W.hgState(pc('JS-MAIN', OLD), base({ holds: { a: H('JS-MAIN', { end: now - 1000 }) } })); ok(s.can, '끝난 출고 칸은 막지 않음');
  s = W.hgState(pc('JS-MAIN', OLD), base({ holds: { a: H('JS-MAIN', { t0: now - 3 * 3600e3, beat: now - 2 * 3600e3 }) } })); ok(s.can, '출고 보호 최대 시간(1시간) 지난 칸은 막지 않음(수집기와 같은 규칙)');
  s = W.hgState(pc('JS-MAIN', OLD), base({ holds: null })); ok(!s.can && /출고 표/.test(s.why), '출고 표를 못 읽으면 막음');
  const sch = { on: true, at: ['10:30'], wd: [0, 1, 2, 3, 4, 5, 6] };
  s = W.hgState(pc('MJ-MAIN', OLD), base({ sched: sch })); ok(!s.can && /MJ-MAIN 출고 시간/.test(s.why), 'MJ-MAIN 출고 시간(원스톱 10:30 앞 30분 안 — 지금 10:00) 막음');
  s = W.hgState(pc('MJ-MAIN', OLD), base({ sched: { ...sch, at: ['13:00'] } })); ok(s.can, 'MJ-MAIN 원스톱 시각과 멀면 됨');
  s = W.hgState(pc('MJ-MAIN', OLD), base({ sched: { ...sch, at: ['08:45'] } })); ok(!s.can, 'MJ-MAIN 원스톱 시각 뒤 90분 안(08:45 → 10:00)도 막음');
  s = W.hgState(pc('MJ-MAIN', OLD), base({ sched: { ...sch, on: false } })); ok(s.can, '원스톱 정한 시각이 꺼져 있으면 시간으로는 막지 않음');
  s = W.hgState(pc('JS-MAIN', OLD), base({ sched: sch })); ok(s.can, '출고 시간 막음은 MJ-MAIN만');

  console.log('④ 로거 처리 (웹앱 쪽)');
  s = W.hgState(pc('LOGGER', OLD), base({ watchPcs: ['LOGGER', 'HOME'] })); ok(s.logger && !s.watch && s.can, '로거 = 로거 차례 · 감시기 화면 없음(목록에 있어도)');
  s = W.hgState(pc('PUB1', OLD), base({ loggers: ['PUB1', 'LOGGER'] })); ok(s.logger, '로거 이름은 설정(pubPcName)을 따름');
  s = W.hgState(pc('HOME', OLD), base()); ok(s.watch && !s.logger, '감시기 PC(HOME)는 감시기 화면도');

  console.log('① 화면 (PC 줄 · 흐림 · 끝)');
  { const hh = cut(APP, 'function hgHtml(D, L, o) {', "document.addEventListener('click', async (e) => { const t = e.target.closest && e.target.closest('[data-hgget]')");
    const esc = (x) => String(x == null ? '' : x).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const R = new Function('S', 'esc', 'kTime', 'hgState', 'HG_OLD', hh + '\nreturn hgHtml;');
    const S0 = { pcCtl: {} }; const html = (L, o) => R(S0, esc, (x) => String(x), W.hgState, W.HG_OLD)({}, L, o);
    let h = html([pc('JS-MAIN', OLD), pc('HOME', OLD)], base({ hs: OLD })); ok((h.match(/data-hgget="[^"]+" disabled/g) || []).length === 2 && /아직 머리 판 전/.test(h), '머리 판 전: 모든 PC 단추 흐림(disabled) + 안내');
    ok(/<code>8559039d5a96110b<\/code>/.test(h) && /판 1\.89\.250/.test(h), 'PC 줄마다 지금 머리 서명·판');
    h = html([pc('JS-MAIN', OLD), pc('HOME', NEW)], base()); ok(/data-hgget="JS-MAIN" >|data-hgget="JS-MAIN"  /.test(h) && /data-hgget="HOME" disabled/.test(h) && /✅ 1\/2대/.test(h), '머리 판 뒤: 옛 머리 PC 켜짐 · 새 머리 PC ✅ · 1/2대');
    ok(/그 PC 앞에 사람이 있어야/.test(h), '화면에 \'그 PC 앞에 사람이 있어야 [업데이트]\'를 분명히');
    h = html([pc('JS-MAIN', NEW), pc('HOME', NEW)], base()); ok(/머리 옮기기 끝/.test(h), '모든 PC ✅면 \'머리 옮기기 끝\'');
    S0.pcCtl = { cmds: { 'JS-MAIN': { id: 'c1', cmd: 'headget', at: 'x' } }, acks: { HOME: { id: 'c0', cmd: 'headget', state: 'opened', msg: '수집기 설치 화면을 띄움', at: 'y' } } };
    h = html([pc('JS-MAIN', OLD), pc('HOME', OLD)], base()); ok(/머리 받기 보냄/.test(h) && /수집기 설치 화면을 띄움/.test(h), '보낸 명령 ⏳ 대답 기다림 · 받은 대답 글이 그 PC 줄에'); }

  console.log('③ 원격 맡김 (두 번 누르기 · 직전 다시 확인)');
  { const hs = cut(APP, "document.addEventListener('click', async (e) => { const t = e.target.closest && e.target.closest('[data-hgget]')", '}, true);\n', true);
    const body = hs.replace(/^document\.addEventListener\('click', /, 'return (').replace(/, true\);\n$/, ');');
    const mk = (guard, pcs) => { const writes = [], toasts = []; let reads = 0;
      const db = { collection: (c) => ({ doc: (d) => ({ get: async () => { reads++; const v = c === 'shp_runs' && d === '_guard' ? guard : null; return { exists: !!v, data: () => v }; }, set: async (v, o) => { writes.push({ c, d, v, o }); } }) }) };
      const S = { mgrData: { pcs: [] }, user: { email: 'a@b' }, hg: { at: Date.now(), hs: NEW, ver: '1.89.260' }, sg: { doc: null } };
      const env = { S, db, toast: (m) => toasts.push(m), mgrRedraw: () => {}, deviceName: () => 'HOME-웹앱', firebase: { firestore: { FieldValue: { arrayUnion: (...x) => ({ au: x }) } } },
        hgLoad: async () => {}, pcCtlList: () => pcs, hgOpts: () => base({ holds: (S.hgGuard || {}).holds || {} }), hgState: W.hgState, setTimeout: () => {} };
      const h = new Function(...Object.keys(env), body)(...Object.values(env));
      const el = { dataset: { hgget: pcs[0].pcName }, textContent: '🌐 머리 받기', disabled: false, isConnected: true, classList: { add() {}, remove() {} }, closest: (q) => (q === '[data-hgget]' || q === '#sheet' ? el : null) };
      const click = () => h({ target: el, preventDefault() {} }); return { click, writes, toasts, el, reads: () => reads }; };
    let X = mk({ holds: {} }, [pc('JS-MAIN', OLD)]); await X.click(); ok(!X.writes.length && /확정/.test(X.el.textContent), '첫 번째 누름은 \'확정\'으로 바뀌기만(아무것도 안 씀)');
    await X.click(); const w = X.writes[0]; const c = w && w.v.cmds['JS-MAIN'];
    ok(w && w.c === 'crm_system' && w.d === 'pc_ctl' && c.cmd === 'headget' && c.hs === NEW && c.want === '1.89.260' && c.watch === true && c.logger === false && w.o.merge, '두 번째 누름 → pc_ctl cmds.JS-MAIN = headget(새 머리·판·감시기)');
    ok(X.reads() >= 1 && /머리 받기 보냄/.test(X.toasts.join()), '보내기 직전에 출고 표를 다시 읽음 · 화면 글(toast)로 알림');
    X = mk({ holds: { a: H('JS-MAIN') } }, [pc('JS-MAIN', OLD)]); await X.click(); await X.click(); ok(!X.writes.length && /출고 중/.test(X.toasts.join()), '보내기 직전 다시 읽은 출고 표에 그 PC 출고가 있으면 안 보냄');
    X = mk({ holds: { a: H('JS-MAIN') } }, [pc('MJ-MAIN', OLD)]); await X.click(); await X.click(); ok(!X.writes.length && /MJ-MAIN/.test(X.toasts.join()), '출고 중엔 MJ-MAIN에 안 보냄');
    X = mk({ holds: {} }, [pc('LOGGER', OLD)]); await X.click(); await X.click(); const cl = X.writes[0] && X.writes[0].v.cmds.LOGGER; ok(cl && cl.logger === true && cl.watch === false, '로거에 보내면 logger 표시 · 감시기 없음');
    X = mk({ holds: {} }, [pc('JS-MAIN', NEW)]); X.el.disabled = true; await X.click(); await X.click(); ok(!X.writes.length, '흐린(disabled) 단추는 눌러도 아무것도 안 함'); }

  console.log('⑤ 수집기 headget');
  { const planSrc = cut(COL, '  const HG_BASE = ', '/* ⟦headgetPlan 끝⟧ */', true); const P = new Function(planSrc + '\nreturn headgetPlan;')();
    const c0 = { id: 'c1', cmd: 'headget', want: '1.89.260', hs: NEW, watch: false };
    let r = P({ c: c0, hsig: OLD, pub: false, now: 5 }); ok(r.st === 'open' && r.urls.length === 1 && r.urls[0] === 'https://readnow.kr/readnow-collector.user.js?v=1.89.260', '옛 머리 PC → readnow.kr 수집기 설치 화면 하나');
    r = P({ c: { ...c0, watch: true }, hsig: OLD, pub: false, now: 5 }); ok(r.urls.length === 2 && /readnow\.kr\/readnow-price-watch\.user\.js/.test(r.urls[1]), '감시기 PC → 감시기 설치 화면도 이어서');
    r = P({ c: c0, hsig: NEW, pub: false }); ok(r.st === 'done' && /이미 새 머리/.test(r.msg), '이미 새 머리면 아무것도 안 엶');
    r = P({ c: { ...c0, hs: '' }, hsig: OLD }); ok(r.st === 'fail', '새 머리 서명이 없는 명령은 안 함');
    r = P({ c: { ...c0, watch: true }, hsig: OLD, pub: true, hopen: '' }); ok(r.st === 'open' && r.urls.length === 1 && r.pub && !r.urls.some((u) => /aladin|price-watch/.test(u)), '로거: 설치 화면 하나만(감시기·알라딘 주소 없음)');
    r = P({ c: c0, hsig: OLD, pub: true, hopen: '1.89.260' }); ok(r.st === 'done' && /이미 열어 둠/.test(r.msg), '로거: 로더가 같은 판 설치 화면을 이미 열었으면 다시 안 엶');
    /* headgetNow 돌려 보기 */
    const nowSrc = cut(COL, '  async function headgetNow(c) {', '  /* ══════════ (정범님 11/05) 🪟 수집 작업 창');
    const run = async (o) => { const acks = [], tabs = [], gm = { 'rn-live-hopen': o.hopen || '' }; const st = { running: o.running || false, imgRunning: false }; let slept = 0; const win = { __rnLiveInfo: () => ({ hsig: o.hsig || OLD }), __rnWork: o.work ? { isWork: () => true } : null, __rnWorkShow: async () => { win.shown = 1; } };
      const f = new Function('PUBONLY', 'globalThis', 'window', 'GM_getValue', 'GM_setValue', 'GM_openInTab', 'ctlAck', 'sleep', 'log', 'headgetPlan', 'ST', `with (ST) { ${nowSrc}\n return headgetNow; }`);
      const g = f(!!o.pub, {}, win, (k, d) => (k in gm ? gm[k] : d), (k, v) => (gm[k] = v), (u, op) => tabs.push({ u, op }), async (id, cmd, s, m) => acks.push({ id, cmd, s, m }), async () => { slept++; if (slept > 2) st.running = false; }, () => {}, P, st);
      await g({ ...c0, watch: !!o.watch }); return { acks, tabs, gm, win, slept }; };
    let R = await run({ watch: true }); ok(R.tabs.length === 2 && R.tabs.every((t) => t.op.active === true) && R.acks.at(-1).s === 'opened' && /\[업데이트\]/.test(R.acks.at(-1).m), '사무실 PC: 수집기·감시기 설치 화면을 앞에 띄움 · 대답 \'사람이 [업데이트]\'');
    R = await run({ pub: true, running: '집중 벤치마킹' }); ok(R.acks[0].s === 'wait' && /로거 차례/.test(R.acks[0].m) && R.slept >= 3 && R.tabs.length === 1 && R.gm['rn-live-hopen'] === '1.89.260', '로거: 하던 일이 끝나 쉬는 사이에 하나만 엶 · 로더가 다시 안 열게 표시');
    R = await run({ work: true }); ok(R.win.shown === 1 && R.tabs.length === 1, '작업 창 탭이 맡았으면 작업 창을 화면 앞으로 꺼낸 뒤 엶');
    R = await run({ hsig: NEW }); ok(!R.tabs.length && R.acks[0].s === 'done', '이미 새 머리면 탭 안 엶');
    /* 출고 중 미룸(받는 쪽 마지막 받침) */
    const disp = COL.split('\n').find((l) => l.includes("if (c.cmd === 'headget')")); ok(!!disp, '원격 명령 받기에 headget 있음');
    const acks = []; let called = 0; new Function('window', 'ctlAck', 'headgetNow', 'c', `${disp}`)({ __rnShipWait: () => true }, (id, cmd, s, m) => acks.push({ s, m }), () => called++, c0);
    ok(!called && acks[0] && acks[0].s === 'wait' && /출고 중/.test(acks[0].m), '그 PC가 출고 중이면 설치 화면을 미룸(출고가 끝나면 띄움)');
    ok(/hwait: I\.hwait \|\| null, hsig: I\.hsig \|\| null, hg: 1 \}/.test(COL), '심장 신호 tm에 hg:1(머리 받기를 알아들음)'); }

  console.log('⑥ 팝업 없음');
  { const parts = [cut(APP, 'const PCCTL_LX', "const mgrAgo = (ms)"), cut(COL, '  /* ══════════ (11/10 headbtn', '  /* ══════════ (정범님 11/05) 🪟 수집 작업 창')];
    ok(parts.every((p) => !/\b(alert|confirm|prompt)\s*\(/.test(p)), '새 코드에 브라우저 alert·confirm·prompt 없음(두 번 누르기 · toast)'); }

  console.log('⑦ 수집기 머리 그대로');
  { const T = fs.mkdtempSync(path.join(os.tmpdir(), 'thb_')); cp.execFileSync(process.execPath, [path.join(ROOT, 'src/split.js'), path.join(ROOT, 'src/readnow-collector.src.js'), T + '/b'], { stdio: 'ignore' });
    const head = fs.readFileSync(T + '/b/pc-live-head.txt', 'utf8').split('\n')[0].trim(); ok(head === OLD, '나누기 결과 머리 서명 = ' + OLD + ' (이번 판은 머리 안 바뀜) · 지금 ' + head);
    let base0 = null; try { base0 = cp.execSync('git -C "' + ROOT + '" show origin/main:src/readnow-collector.src.js', { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) {}
    if (base0) { fs.writeFileSync(T + '/o.js', base0); cp.execFileSync(process.execPath, [path.join(ROOT, 'src/split.js'), T + '/o.js', T + '/a'], { stdio: 'ignore' }); for (const f of ['readnow-collector.user.js', 'readnow-pc-boot.js']) ok(fs.readFileSync(T + '/a/' + f, 'utf8') === fs.readFileSync(T + '/b/' + f, 'utf8'), f + ' 글자 하나 안 바뀜(origin/main과)'); } }

  console.log('⑧ 클라우드 진단 heads');
  { const S = rd('cloud/index.js'); const h = cut(S, '      if (q.heads) {', "      if (q.doc) {");
    const docs = [{ tool: '상품 수집기', pcName: 'HOME', ver: '1.89.260', atMs: Date.now() - 6e4, tm: { hsig: NEW, hg: 1 } }, { tool: '상품 수집기', pcName: 'JS-MAIN', ver: '1.89.250', atMs: Date.now() - 6e4, tm: { hsig: OLD, hwait: '1.89.260', hg: 1 } }, { tool: '고객 수집기', pcName: 'JS-MAIN', atMs: Date.now() }];
    const db = { collection: (c) => ({ get: async () => ({ forEach: (f) => docs.forEach((v) => f({ data: () => v })) }), doc: () => ({ get: async () => ({ data: () => ({ acks: { 'JS-MAIN': { cmd: 'headget', state: 'opened', msg: '띄움', at: 'x' } } }) }) }) }) };
    const out = {}; await new Function('q', 'db', 'out', 'fetch', `return (async () => { ${h} })();`)({ heads: '1' }, db, out, async () => ({ ok: true, json: async () => ({ ver: '1.89.260', hsig: NEW }) }));
    const H2 = out.heads || {}; ok(H2.n === 2 && H2.nNew === 1 && H2.want.hsig === NEW && H2.pcs.find((x) => x.pc === 'JS-MAIN').hsig === OLD && H2.pcs.find((x) => x.pc === 'JS-MAIN').headget.state === 'opened' && H2.pcs.find((x) => x.pc === 'HOME').isNew, '진단 heads=1: PC별 머리 서명·새 머리 여부·기다리는 판·마지막 머리 받기 대답'); }

  console.log(bad ? `tHEADBTN ❌ ${bad}개 실패` : 'tHEADBTN ✅ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('tHEADBTN ❌ 오류', e); process.exit(1); });
