// 메모리 측정: node pw/tmem.js [label] — 큰 자료 + 큰 벤치마킹 기록으로 📖 도서 정보 검색을 열고 힙(가비지 수집 뒤)을 잼
const label = process.argv[2] || 'now'; const NF = +process.env.NF || 300000, NB = +process.env.NB || 15000;
require('./harness.js')(async (p) => { const cdp = await p.context().newCDPSession(p); await cdp.send('Performance.enable'); await cdp.send('HeapProfiler.enable');
  const heap = async () => { await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage'); const r = await cdp.send('Performance.getMetrics'); const m = {}; r.metrics.forEach((x) => (m[x.name] = x.value)); return Math.round(m.JSHeapUsedSize / 1048576); };
  await p.evaluate(() => { localStorage.setItem('rn-match-at', String(Date.now())); window.__LT = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => __LT.push(e.duration))).observe({ type: 'longtask' }); });
  await p.evaluate(require('./seedBig.js')); const st = await p.evaluate(require('./seedBench.js'), { nf: NF, nb: NB }); await p.waitForTimeout(1500);
  const out = { seed: st }; out.h0 = await heap();
  if (process.env.PROF) { await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start'); }
  const t0 = Date.now(); await p.evaluate(() => { __LT = []; S._userAt = Date.now(); openBookSearch(); });
  let peak = 0; const pk = setInterval(async () => { try { const r = await cdp.send('Performance.getMetrics'); const v = r.metrics.find((x) => x.name === 'JSHeapUsedSize').value; if (v > peak) peak = v; } catch (e) {} }, 200);
  for (let i = 0; i < 240; i++) { await p.waitForTimeout(500); const ok = await p.evaluate(() => !!(S.bkFocus && S.bkFocus.done && Array.isArray(S.bkBench))); if (ok) break; }
  await p.waitForTimeout(2000); clearInterval(pk); if (process.env.PROF) { const { profile } = await cdp.send('Profiler.stop'); const byId = new Map(profile.nodes.map((n) => [n.id, n])); const self = new Map(), tot = new Map(); const par = new Map(); profile.nodes.forEach((n) => (n.children || []).forEach((c) => par.set(c, n.id))); profile.samples.forEach((id, i) => { const us = profile.timeDeltas[i] || 0; const n = byId.get(id); const k = (n.callFrame.functionName || '(anon)') + ':' + (n.callFrame.lineNumber + 1); self.set(k, (self.get(k) || 0) + us); const seen = new Set(); for (let x = id; x != null; x = par.get(x)) { const nn = byId.get(x); const kk = (nn.callFrame.functionName || '(anon)') + ':' + (nn.callFrame.lineNumber + 1); if (seen.has(kk)) continue; seen.add(kk); tot.set(kk, (tot.get(kk) || 0) + us); } }); console.log('SELF', [...self].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => k + ' ' + Math.round(v / 1000)).join(' | ')); console.log('TOTAL', [...tot].sort((a, b) => b[1] - a[1]).slice(0, 35).map(([k, v]) => k + ' ' + Math.round(v / 1000)).join(' | ')); } out.peakMB = Math.round(peak / 1048576); out.openSec = Math.round((Date.now() - t0) / 100) / 10;
  out.peakNote = await p.evaluate(() => ({ fm: S.bkFocus && S.bkFocus.m.size, bb: Array.isArray(S.bkBench) ? S.bkBench.length : null, rows: (SWR.get('bkRows') || {}).r ? SWR.get('bkRows').r.length : null }));
  out.ltOpen = await p.evaluate(() => ({ n: __LT.length, max: Math.round(Math.max(0, ...__LT)), sum: Math.round(__LT.reduce((a, b) => a + b, 0)) }));
  out.hOpen = await heap();
  // 무엇이 큰지: 하나씩 놓아 보고 줄어든 만큼
  out.typing = await p.evaluate(async () => { __LT = []; const T = []; for (const q of ['벤치', '역사 이야기', '저자12', '']) { const t = performance.now(); S.bkP.q = q; bkDraw(); T.push(Math.round(performance.now() - t)); await new Promise((r) => setTimeout(r, 300)); } for (const lens of ['focus', 'bench', 'all']) { const t = performance.now(); S.bkP.lens = lens; bkDraw(); T.push(Math.round(performance.now() - t)); } return T; });
  out.hTyped = await heap();
  await p.evaluate(() => { history.back(); }); await p.waitForTimeout(1500); out.hClosed = await heap();
  if (process.env.WAITCLOSE) { await p.waitForTimeout(+process.env.WAITCLOSE); out.hClosedLater = await heap(); out.after = await p.evaluate(() => ({ f: !!S.bkFocus, b: !!S.bkBench, r: SWR.has('bkRows') })); }
  await p.evaluate(() => { document.getElementById('sheet').innerHTML = ''; SWR.delete('bkRows'); for (const k of [...MEMO.keys()]) if (/^bkCats_/.test(k)) MEMO.delete(k); }); const h1 = await heap();
  await p.evaluate(() => { S.bkBench = null; }); const h2 = await heap();
  await p.evaluate(() => { S.bkFocus = null; }); const h3 = await heap();
  out.part = { bkRows: out.hClosed - h1, bkBench: h1 - h2, bkFocus: h2 - h3, rest: h3 };
  console.log('MEM ' + label + ' ' + JSON.stringify(out));
});
