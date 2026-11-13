// tFIX1113W — (11/13 fix1113 · 아침 점검) 웹앱 고침 시험
//   ② 🪶 켜기 기록(kind 'boot'): 받기(dlRun)가 없는 열기(휴대폰·출고 가벼운 모드·대표 탭 아님·오늘 이미 받음)도 연 뒤 한 번 'open' 기록 · 받기가 돌면 비킴 · 받기 끝(dl)은 그 뒤에도 남김 · 웹앱 무게 받기 시간엔 안 넣음
//   ③ 🟦 예스24 맡김 결과: 거울 문서(local)에 줄마다 state·맨 위 ok·msg·자취 · 예전 { st } 꼴도 바르게 읽음 · 맡김이 못 함이면 🔁 사후 확인 그 줄이 ⚠(wf) — 그 뒤 회차 판정이 나오면 그 판정
// 실행: pw/ 안(harness.js·fbstub.js 옆) RN_PORT=<포트> node tFIX1113W.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), process.env.RN_REPO ? path.join(process.env.RN_REPO, 'src', 'app.html') : ''].filter(Boolean).find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
console.log('③ 순수 셈 — 사후 확인 상태(wf)');
{ const F = new Function(cut('/* ◆recheck 시작', '/* ◆recheck 끝 */') + '\nreturn { rcRows };')(); const at = '2026-11-12T10:47:37.000Z'; const t0 = Date.parse(at);
  const e = { ch: 'yes24', key: 'PNKd3734EX', no: '195142826', k: 'qty', to: 1, at, r: {}, wf: { at: '2026-11-12T10:47:42.000Z', st: 'fail', m: 'ISBN으로 조회 0줄' } };
  const R1 = F.rcRows({ a: e }, [1, 3], t0 + 3600e3)[0]; ok(R1.st === 'bad' && /맡김 실패 — ISBN/.test(R1.last.m), '맡김이 실패한 줄 = 첫 회차 전이어도 ⚠ 어긋남(예전엔 ⏳ 첫 확인 전)', R1);
  const R2 = F.rcRows({ a: { ...e, ack: '2026-11-12T11:00:00.000Z' } }, [1, 3], t0 + 3600e3)[0]; ok(R2.st === 'wait', '사람이 ✓ 확인함을 누르면 ⏳ 첫 확인 전으로', R2);
  const R3 = F.rcRows({ a: { ...e, r: { 1: { at: '2026-11-13T11:00:00.000Z', v: 'ok', m: '수량 1권 그대로' } } } }, [1, 3], t0 + 1.2 * 864e5)[0]; ok(R3.st === 'ok' && R3.last.d === 1, '그 뒤 회차 판정이 나오면 그 판정을 따름(손으로 고쳤으면 ✅)', R3);
  const R4 = F.rcRows({ a: { ...e, wf: null } }, [1, 3], t0 + 3600e3)[0]; ok(R4.st === 'wait', '실패 표시 없는 줄은 예전 그대로', R4); }
(async () => {
  const HP = path.join(__dirname, 'harness.js');
  if (!fs.existsSync(HP) || !process.env.RN_PORT) { console.log('… 웹앱 시험은 빌드 폴더 pw에서 RN_PORT로(건너뜀)'); console.log(bad ? `❌ tFIX1113W ${bad}개 실패` : '✓ tFIX1113W(순수 셈) 통과'); process.exit(bad ? 1 : 0); }
  await require(HP)(async (p) => {
    await p.waitForTimeout(1500);
    console.log('② 켜기 기록');
    const r1 = await p.evaluate(async () => { const L = () => Object.values((window.__FS && window.__FS.perf_logs) || {}).filter((x) => x.kind === 'boot'); const n0 = L().length;
      clearTimeout(S._bootOpenT); S._bootOpenT = null; S._bootSent = 0; localStorage.removeItem('rn-bootlog'); const was = S.dl.running; S.dl.running = true; bootMeasure.openLater(50); await new Promise((r) => setTimeout(r, 300)); const nRun = L().length - n0; S.dl.running = was;
      S._bootOpenT = null; S._bootSent = 0; S.shipLite = true; bootMeasure.openLater(50); await new Promise((r) => setTimeout(r, 400)); S.shipLite = false; const a = L().slice(n0); const o = a.find((x) => x.src === 'open');
      const B = bootMeasure.begin(); bootMeasure.step(B, '상품·도서'); await new Promise((r) => setTimeout(r, 320)); bootMeasure.end(B, []); await new Promise((r) => setTimeout(r, 300)); const d = L().slice(n0).find((x) => x.src === 'dl');
      bootMeasure.end(bootMeasure.begin(), []); await new Promise((r) => setTimeout(r, 200)); const nEnd = L().length - n0;
      return { nRun, o, d, nEnd }; });
    ok(r1.nRun === 0, '② 받기가 돌고 있으면 open 기록은 비킴(받기 끝 기록이 남음)');
    ok(r1.o && r1.o.dlMs === null && r1.o.lite === true && /출고 가벼운 모드/.test(r1.o.why) && r1.o.open && 'shell' in r1.o.open && r1.o.lt && r1.o.ver, '② 받기 없이 연 탭(📦 출고 가벼운 모드)도 kind boot · src open · 까닭 · 열기 단계 시간 · 긴 작업', r1.o);
    ok(r1.d && r1.d.dlMs > 0 && r1.d.steps.length === 1, '② open 기록 뒤에 받기가 끝나면 받기 끝(dl) 기록도 남김(더 자세함)', r1.d);
    ok(r1.nEnd === 2, '② 한 탭에서 open 한 번 · dl 한 번까지', r1.nEnd);
    const r1b = await p.evaluate(() => { const L = [{ ver: '9.0.1', kind: 'boot', src: 'open', dlMs: null, dev: 'PC1', at: '2026-11-13T00:00:00Z' }, { ver: '9.0.1', kind: 'boot', src: 'dl', dlMs: 4000, dev: 'PC1', at: '2026-11-13T00:01:00Z' }]; const V = wgAgg(L); const v = V.find((x) => x.v === '9.0.1'); return v && v.dl; });
    ok(r1b === 4, '② 웹앱 무게 \'받기 끝\'은 dl 기록만(open 기록은 0초로 안 섞임): ' + r1b);
    console.log('③ 예스24 맡김 결과');
    const r2 = await p.evaluate(async () => { const FS = window.__FS; const ok1 = y24PFinOf({ 'k|1': { st: 'done', msg: '확인' } }); const bad1 = y24PFinOf({ 'k|1': { st: 'fail', msg: 'ISBN으로 조회 0줄' }, 'k|2': { st: 'done' } }); const un = y24PFinOf({ 'k|1': { st: 'unsure', msg: '목록에서 확인 못 함' } });
      const jid = 'y24w-fix1113a'; await db.collection('col2_y24_cmd').doc(jid).set({ k: 'w', st: 'local', job: { id: jid, rows: [{ rid: 'PNKd3734EX|195142826' }] }, at: new Date().toISOString(), trail: [{ at: 'x', m: '맡은 PC가 제 번외에 바로 맡김(거울)' }] });
      await y24PMirrorFin({ [jid]: { 'PNKd3734EX|195142826': { st: 'fail', msg: '예스24 등록상품 목록에서 상품번호 195142826 줄을 못 찾음' } } }); const d = JSON.parse(JSON.stringify(FS.col2_y24_cmd[jid]));
      const old = y24WDocSt({ st: 'done', res: { state: 'done', rows: { 'a|1': { st: 'done', msg: '확인' } } } }, 'a|1'); const oldBad = y24WDocSt({ st: 'done', res: { state: 'fail', rows: { 'a|1': { st: 'fail', msg: 'x' } } } }, 'a|1'); const now = y24WDocSt(d, 'PNKd3734EX|195142826');
      return { ok1, bad1, un, d, old: old.st, oldBad: oldBad.st, now: now.st }; });
    ok(r2.ok1.state === 'done' && r2.ok1.ok && r2.ok1.rows['k|1'].state === 'done', '③ 모두 됨 = done · 줄마다 state', r2.ok1);
    ok(r2.bad1.state === 'fail' && !r2.bad1.ok && /^⚠ 못 함 — ISBN/.test(r2.bad1.msg) && r2.un.state === 'unsure' && /확실하지 않음/.test(r2.un.msg), '③ 하나라도 못 함 = fail(까닭 글) · 확실하지 않음 = unsure', [r2.bad1, r2.un]);
    ok(r2.d.st === 'done' && r2.d.ok === false && /⚠ 못 함/.test(r2.d.msg) && r2.d.res.rows['PNKd3734EX|195142826'].state === 'fail' && /⚠ 못 함/.test(r2.d.trail[r2.d.trail.length - 1].m) && r2.d.trail.length === 2, '③ 거울 문서: 맨 위 ok=false·msg ⚠ · 줄 state · 자취 끝에 같은 한 줄(진단·맡긴 일 줄에서 실패가 보임)', r2.d);
    ok(r2.old === 'done' && r2.oldBad === 'fail' && r2.now === 'fail', '③ 예전 { st } 꼴 문서도 바르게(성공이 못 함으로 보이던 것)', r2);
    const r3 = await p.evaluate(async () => { const at = new Date(Date.now() - 60e3).toISOString(); const id = rcId({ ch: 'yes24', no: '195968648', k: 'qty', to: 1, at }); const m = { [id]: { ch: 'yes24', key: 'PNKd3010EX', no: '195968648', k: 'qty', to: 1, t: '시험 책', src: 'auto', at, dev: 'HOME', r: {} }, other: { ch: 'yes24', key: 'PNKzzzz', no: '1', k: 'qty', to: 1, at, r: {} } };
      await db.collection('app_settings').doc('omni_recheck').set({ m }); S.rc.at = 0; await rcLoad(true); ledY24WSet({ 'PNKd3010EX|195968648': { st: 'fail', msg: '예스24 195968648의 자체코드가 이미 PNKLUX — 장부가 이은 실물(PNKd3010EX)과 달라 아무것도 누르지 않음', at: Date.now() - 60e3 } });
      await new Promise((r) => setTimeout(r, 600)); const D = JSON.parse(JSON.stringify(window.__FS.app_settings.omni_recheck.m)); const B = rcBad(); return { wf: D[id] && D[id].wf, other: D.other && D.other.wf, B: B.map((x) => x.id), id }; });
    ok(r3.wf && r3.wf.st === 'fail' && /PNKLUX/.test(r3.wf.m) && !r3.other && r3.B.includes(r3.id), '③ 예스24 맡김이 못 함으로 오면 🔁 사후 확인 그 줄(같은 실물·상품 번호)만 ⚠ — 홈 알림에도 잡힘', r3);
  });
  console.log(bad ? `❌ tFIX1113W ${bad}개 실패` : '✓ tFIX1113W 모두 통과'); process.exit(bad ? 1 : 0);
})();
