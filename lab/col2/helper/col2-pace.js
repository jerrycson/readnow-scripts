/* col2-pace.js — 그림자 읽기 속도 지키기(운영 수집기 makePacer와 따로 · 더 느리게)
 * 한 장 읽은 뒤 minGapMs(±jitter) 기다림 · 한 시간 hourCap장 · 하루(한국 날짜) dayCap장 넘으면 거절(기다리지 않고 알림)
 * 알라딘이 429·503을 주면 cool429Min분 × 횟수(최대 10배) 쉼 — 운영 makePacer의 '많음' 처리와 같은 꼴
 * 기록은 pace.json(도우미가 꺼졌다 켜져도 한 시간·하루 수를 이어 셈) */
'use strict';
const fs = require('fs');
const kday = (t) => new Date(t + 9 * 3600e3).toISOString().slice(0, 10);

function makePace(file, getCfg, o) {
  o = o || {}; const now = o.now || Date.now; const sleep = o.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  let S = { last: 0, hour: [], day: { d: '', n: 0 }, coolUntil: 0, n429: 0, fails: 0, oks: 0 };
  try { const v = JSON.parse(fs.readFileSync(file, 'utf8')); if (v && typeof v === 'object') S = { ...S, ...v }; } catch (e) {}
  const save = () => { try { fs.writeFileSync(file, JSON.stringify(S)); } catch (e) {} };
  const cfg = () => getCfg();
  function tidy() { const t = now(); S.hour = (S.hour || []).filter((x) => t - x < 3600e3); const d = kday(t); if (S.day.d !== d) S.day = { d, n: 0 }; }
  /* 지금 읽어도 되나 — { ok, waitMs } 또는 { ok:false, why, retryMs } */
  function check() { tidy(); const c = cfg(); const t = now();
    if (S.coolUntil > t) return { ok: false, why: `알라딘이 '요청이 많음'이라 답해 ${Math.ceil((S.coolUntil - t) / 60e3)}분 쉬는 중`, retryMs: S.coolUntil - t };
    if (S.hour.length >= c.hourCap) return { ok: false, why: `한 시간에 ${c.hourCap}장까지 — 이번 시간은 다 읽음`, retryMs: 3600e3 - (t - S.hour[0]) };
    if (S.day.n >= c.dayCap) return { ok: false, why: `하루 ${c.dayCap}장까지 — 오늘은 다 읽음`, retryMs: null };
    const gap = c.minGapMs * (1 - c.jitter + Math.random() * 2 * c.jitter); const w = Math.max(0, (S.last || 0) + gap - t);
    return { ok: true, waitMs: Math.round(w) }; }
  /* 차례를 기다렸다 받음(기다림은 최대 minGapMs×2) — 받은 뒤에야 요청 */
  async function take() { const c0 = check(); if (!c0.ok) return c0; if (c0.waitMs > 0) await sleep(c0.waitMs); const c1 = check(); if (!c1.ok) return c1;
    if (c1.waitMs > 0) await sleep(c1.waitMs); const t = now(); S.last = t; S.hour.push(t); S.day.n++; save(); return { ok: true, waited: c0.waitMs + (c1.waitMs || 0) }; }
  function fail(kind) { S.fails++; if (kind === '429') { S.n429 = (S.n429 || 0) + 1; S.coolUntil = now() + Math.min(10, S.n429) * cfg().cool429Min * 60e3; } save(); }
  function ok() { S.oks++; if (S.n429 && now() - S.last > 3600e3) S.n429 = 0; save(); }
  function state() { tidy(); const c = cfg(); return { last: S.last || null, hourN: S.hour.length, hourCap: c.hourCap, dayN: S.day.n, dayCap: c.dayCap, minGapMs: c.minGapMs, coolMs: Math.max(0, S.coolUntil - now()), fails: S.fails, oks: S.oks }; }
  return { check, take, fail, ok, state, _S: () => S };
}
module.exports = { makePace };
