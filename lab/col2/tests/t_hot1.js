/* t_hot1 — (11/12 hot1 · 사무실 PC가 무거움) 🪫 CPU 재서 스스로 쉼(col2-load · 가짜 CPU 시간) · 창 다루기 C#을 dll로 한 번만 엮음(col2-win PS_SRC 글자 검사)
 *  · 그림자 일 한 시간 몫·헛 출처 쉼은 col2-jobs 글자 검사(실제 돌기는 t_jobs·t_site·t_render가 그대로 지나는지로 확인)
 * 실행: node tests/t_hot1.js */
const L = require('./lib.js'); const { ok } = L; const fs = require('fs'), path = require('path');
const { makeLoad } = require('../helper/col2-load.js'); const W = require('../helper/col2-win.js'); const COL2 = require('../col2-config.js');

(async () => {
  console.log('① 🪫 CPU 재기 — 넘으면 쉼 · 내려가 이어지면 다시');
  let T = 0, busy = 0, idle = 0; const notes = []; const cpus = () => [{ times: { user: busy, nice: 0, sys: 0, irq: 0, idle } }];
  const LD = makeLoad({ now: () => T, cpus, note: (m) => notes.push(m), cfg: () => ({}) });
  const tick = (pct) => { T += 10e3; busy += pct * 100; idle += (100 - pct) * 100; return LD.sample(); };
  LD.sample(); for (let i = 0; i < 6; i++) tick(30); ok(LD.hot() === null && LD.sum().pct === 30, '30%면 쉬지 않음', LD.sum().pct);
  for (let i = 0; i < 6; i++) tick(95); ok(!!LD.hot() && /CPU/.test(LD.hot().why) && notes.length === 1, '최근 1분 95%면 쉼(busyNow와 같은 꼴 · 알림 한 번)', LD.hot() && LD.hot().why);
  for (let i = 0; i < 6; i++) tick(60); ok(!!LD.hot(), '60%(75 아래 · 50 위)면 아직 쉼(들락날락 안 함)');
  for (let i = 0; i < 7; i++) tick(20); ok(!!LD.hot(), '50% 아래가 2분 안 됐으면 아직 쉼', LD.sum().pct);
  for (let i = 0; i < 12; i++) tick(20); ok(LD.hot() === null && notes.length === 2, '50% 아래가 2분 이어지면 다시 일함(알림)', notes[1]);
  const LD2 = makeLoad({ now: () => T, cpus, cfg: () => ({ on: false }) }); LD2.sample(); for (let i = 0; i < 6; i++) { T += 10e3; busy += 9900; idle += 100; LD2.sample(); } ok(LD2.hot() === null, 'col2.json load.on:false면 끔');

  console.log('② 창 다루기 — C#은 dll로 한 번만');
  const ps = W.PS_SRC({ showW: 1200, showH: 820 });
  ok(/^[0-9a-f]{12}$/.test(W.WIN_HASH) && ps.includes(`col2-win-${W.WIN_HASH}.dll`) && !ps.includes('${WIN_HASH}'), 'dll 이름에 C# 글 해시', W.WIN_HASH);
  ok(/Test-Path -LiteralPath \$rnDll\) \{ try \{ Add-Type -LiteralPath \$rnDll/.test(ps), '있으면 dll을 불러오기만(csc.exe 안 켬)');
  ok(/-OutputAssembly \$rnTmp -OutputType Library/.test(ps) && /if \(-not \('RnCol2Win' -as \[type\]\)\) \{ Add-Type -TypeDefinition \$rnSrc \} \}/.test(ps), '없으면 한 번 엮어 저장 · 무엇이든 실패하면 예전처럼 메모리에서 엮음');
  ok(/function Get-RnRect\(\$h\)/.test(ps) && /public static class RnCol2Win/.test(ps), '창 함수·C# 본문은 그대로');
  ok(COL2.WATCH.idleFindSec === 300, '숨김이 맞으면 5분 동안 1분 지킴이가 창 찾기(PowerShell)를 쉼');

  console.log('③ 그림자 일 — 한 시간 몫·헛 출처 쉼·저장 늦추기(글자)');
  const J = fs.readFileSync(path.join(__dirname, '../helper/col2-jobs.js'), 'utf8');
  ok(/extHourCap == null \? 90/.test(J) && /pageHourCap == null \? 30/.test(J), '바깥 일 한 시간 90번 · 화면 그리는 출처 30번(설정으로 바꿈)');
  ok(/failStopN == null \? 20/.test(J) && /0\.9 \*/.test(J), '오늘 20번 넘게·90% 넘게 못 읽은 출처는 그날 남은 시간 쉼');
  ok(/SAVE_MS = ctx\.test \? 3000 : 20e3/.test(J), 'jobs.json 다시 쓰기 20초마다(시험은 3초)');
  const H = fs.readFileSync(path.join(__dirname, '../helper/readnow-col2-helper.js'), 'utf8');
  ok(/function busyNow\(\) \{ const lh = LOAD\.hot\(\); if \(lh\) return lh;/.test(H), 'CPU 바쁨은 운영 바쁨과 같은 길(자동 읽기·그림자 일 쉼)');
  L.done('t_hot1');
})();
