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
  /* (0.1.4 정범님 11/09) 예전 판이 알라딘에 안 가고도 하루 몫을 세던 것 바로잡기 — 오늘(한국 날짜) 실제로 읽은 수 realN보다 셈이 크면 realN으로 내림(새 판이 처음 켜질 때 한 번만 · 표시 fixOnce — 고친 뒤엔 셈이 실제 요청과 같아 다시 할 까닭 없음)
   *  · 한 시간 셈도 realN보다 많으면 최근 것만 남김 · 실제 읽기보다 늘리지는 않음(속도 규칙은 그대로) */
  function trueUp(realN, why) { tidy(); const d = S.day.d; if (S.fixOnce) return null; realN = Math.max(0, +realN || 0); S.fixOnce = d || '-'; const was = S.day.n;
    if (was <= realN) { save(); return null; } S.day.n = realN; if (S.hour.length > realN) S.hour = S.hour.slice(-realN || S.hour.length); if (!realN) S.hour = []; save(); return { d, was, now: realN, why: why || '' }; }
  function state() { tidy(); const c = cfg(); return { last: S.last || null, hourN: S.hour.length, hourCap: c.hourCap, dayN: S.day.n, dayCap: c.dayCap, minGapMs: c.minGapMs, coolMs: Math.max(0, S.coolUntil - now()), fails: S.fails, oks: S.oks }; }
  return { check, take, fail, ok, state, trueUp, _S: () => S };
}

/* (11/11 정범님 '바깥 사이트 읽기 몫') 바깥 사이트(교보·예스24 공개·번개장터·KPIPA·환율 …) 속도 — 알라딘 몫(makePace · 사람 속도 두 배 = 알라딘 화면 규칙)과 따로
 *  · 사이트(주소 host)마다 요청 사이 간격 = 운영 외부 정보 공용 파일의 출처 paceMs(같은 host를 쓰는 출처는 가장 긴 간격 · 흩음 ±15%)
 *  · 출처마다 하루(한국 날짜) 상한 = 운영 출처 cap(덮어쓰기 col2.json siteCfg) · 429·503이면 그 사이트만 cool429Min분 × 횟수(최대 10배) 쉼
 *  · 알라딘(aladin.co.kr)은 여기서 셈하지 않음(늘 makePace) · 기록은 site-pace.json(작음 · 출처·사이트 수십 개) */
function makeSitePace(file, getCfg, o) {
  o = o || {}; const now = o.now || Date.now; const sleep = o.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  let S = { h: {}, s: {} };
  try { const v = JSON.parse(fs.readFileSync(file, 'utf8')); if (v && typeof v === 'object') S = { h: v.h || {}, s: v.s || {} }; } catch (e) {}
  const save = () => { try { fs.writeFileSync(file, JSON.stringify(S)); } catch (e) {} };
  /* cfg(src) → { host, label, gapMs, dayCap, jitter, cool429Min } */
  const cfg = (src) => getCfg(src);
  const H = (h) => S.h[h] || (S.h[h] = { last: 0, coolUntil: 0, n429: 0 });
  const D = (src) => { const d = kday(now()); const x = S.s[src]; if (!x || x.d !== d) S.s[src] = { d, n: 0, ok: 0, fail: 0 }; return S.s[src]; };
  function check(src) { const c = cfg(src); const h = H(c.host); const d = D(src); const t = now();
    if (h.coolUntil > t) return { ok: false, why: `${c.label}이(가) '요청이 많음'이라 답해 ${Math.ceil((h.coolUntil - t) / 60e3)}분 쉬는 중(이 사이트만)`, retryMs: h.coolUntil - t };
    if (d.n >= c.dayCap) return { ok: false, why: `${c.label} 하루 ${c.dayCap}번까지 — 오늘은 다 씀(다른 사이트·알라딘은 따로)`, retryMs: null };
    const gap = c.gapMs * (1 - c.jitter + Math.random() * 2 * c.jitter); return { ok: true, waitMs: Math.round(Math.max(0, (h.last || 0) + gap - t)) }; }
  async function take(src) { const c0 = check(src); if (!c0.ok) return c0; if (c0.waitMs > 0) await sleep(c0.waitMs); const c1 = check(src); if (!c1.ok) return c1; if (c1.waitMs > 0) await sleep(c1.waitMs);
    const c = cfg(src); H(c.host).last = now(); D(src).n++; save(); return { ok: true, waited: c0.waitMs + (c1.waitMs || 0) }; }
  function fail(src, kind) { const c = cfg(src); const h = H(c.host); D(src).fail++; if (kind === '429') { h.n429 = (h.n429 || 0) + 1; h.coolUntil = now() + Math.min(10, h.n429) * c.cool429Min * 60e3; } save(); }
  function ok(src) { const c = cfg(src); const h = H(c.host); D(src).ok++; if (h.n429 && now() - h.last > 3600e3) h.n429 = 0; save(); }
  /* 화면용 — 오늘 쓴 출처만(쓴 수 많은 차례) */
  function state() { const d = kday(now()); const out = []; for (const [src, x] of Object.entries(S.s)) { if (!x || x.d !== d) continue; const c = cfg(src); const h = S.h[c.host] || {}; out.push({ src, label: c.label, host: c.host, n: x.n, cap: c.dayCap, ok: x.ok || 0, fail: x.fail || 0, gapMs: c.gapMs, coolMs: Math.max(0, (h.coolUntil || 0) - now()) }); }
    out.sort((a, b) => b.n - a.n); return { day: d, sites: out, n: out.reduce((a, x) => a + x.n, 0) }; }
  return { check, take, fail, ok, state, _S: () => S };
}
module.exports = { makePace, makeSitePace };
