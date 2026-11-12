/* col2-load.js — 이 PC가 바쁜지(CPU) 재서 번외가 스스로 쉬게 (11/12 hot1 · 정범님 아침 'JS-MAIN이 거의 멈춤 · CPU 91%')
 *  · os.cpus() 누적 시간을 sampleSec(기본 10초)마다 재서 최근 winSec(기본 60초) 동안 PC 전체 CPU 쓰임(%)을 셈 — 번외·크롬·Defender·다른 프로그램 모두 포함(Windows도 됨 · os.loadavg는 Windows에서 늘 0이라 안 씀)
 *  · hiPct(기본 75%) 이상이면 '바쁨'으로 들어가고, loPct(기본 50%) 아래가 calmSec(기본 120초) 이어져야 풀림(들락날락하지 않게)
 *  · 바쁨이면 번외 도우미가 자동 읽기·그림자 일을 쉼(운영이 바쁨과 같은 길 — busyNow) · 정범님 일(운영 수집기·웹앱)에 CPU를 먼저 줌
 *  · 끄기: col2.json load:{ on:false } · 값 바꾸기: load:{ hiPct, loPct, calmSec } · 근거: 없음(사무실 PC 작업 관리자 91%에 멈춤 — 75%면 여유가 사라지기 시작) · 설정으로 바꿈
 *  · 시험: o.cpus(가짜 누적 시간)·o.now 를 넣어 셈만 확인 */
'use strict';
const os = require('os');
const DEF = { on: true, sampleSec: 10, winSec: 60, hiPct: 75, loPct: 50, calmSec: 120 };

function makeLoad(o) { o = o || {}; const now = o.now || Date.now; const cpus = o.cpus || (() => os.cpus());
  const cfg = () => { const u = (o.cfg && o.cfg()) || {}; const c = { ...DEF, ...u }; for (const k of Object.keys(DEF)) if (k !== 'on' && !(Number.isFinite(+c[k]) && +c[k] > 0)) c[k] = DEF[k]; c.on = c.on !== false; return c; };
  const S = { s: [], pct: null, hot: false, since: 0, calmAt: 0, n: 0, why: '' };
  const tot = () => { let busy = 0, all = 0; for (const c of cpus() || []) { const t = c.times || {}; const b = (t.user || 0) + (t.nice || 0) + (t.sys || 0) + (t.irq || 0); busy += b; all += b + (t.idle || 0); } return { busy, all }; };
  /* 한 번 재기 — 타이머가 부름(시험은 직접) */
  function sample() { const c = cfg(); const t = now(); const x = tot(); S.s.push({ t, ...x }); while (S.s.length > 2 && t - S.s[1].t >= c.winSec * 1000) S.s.shift();
    const a = S.s[0]; const db = x.busy - a.busy, da = x.all - a.all; S.pct = S.s.length >= 2 && da > 0 ? Math.round((db / da) * 1000) / 10 : null; S.n++;
    if (!c.on || S.pct == null) { if (!c.on && S.hot) { S.hot = false; S.why = ''; } return S.pct; }
    if (!S.hot && S.pct >= c.hiPct) { S.hot = true; S.since = t; S.calmAt = 0; S.why = `이 PC CPU ${S.pct}%(최근 ${c.winSec}초) — ${c.hiPct}% 넘어 번외가 쉼`; if (o.note) o.note(`🪫 ${S.why} · ${c.loPct}% 아래가 ${c.calmSec}초 이어지면 다시`); }
    else if (S.hot) { if (S.pct < c.loPct) { if (!S.calmAt) S.calmAt = t; if (t - S.calmAt >= c.calmSec * 1000) { S.hot = false; if (o.note) o.note(`🔋 이 PC CPU ${S.pct}% — 번외가 다시 일함(쉰 시간 ${Math.round((t - S.since) / 60e3)}분)`); S.why = ''; } } else { S.calmAt = 0; S.why = `이 PC CPU ${S.pct}%(최근 ${c.winSec}초) — 번외가 쉼(${c.loPct}% 아래가 ${c.calmSec}초 이어지면 다시)`; } }
    return S.pct; }
  /* 바쁨이면 { on, why } · 아니면 null (busyNow와 같은 꼴) */
  const hot = () => (cfg().on && S.hot ? { on: true, why: '🪫 ' + S.why, cpu: true } : null);
  const sum = () => ({ pct: S.pct, hot: !!(cfg().on && S.hot), since: S.hot ? S.since : null, n: S.n });
  let T = null; function start() { if (T) return; const c = cfg(); sample(); T = setInterval(sample, c.sampleSec * 1000); if (T.unref) T.unref(); }
  return { sample, hot, sum, start, _S: S };
}
module.exports = { makeLoad, LOAD_DEF: DEF };
