#!/usr/bin/env node
/* weigh.js — 🪶 최적화 엔진 ② 판마다 '무게' 재기 (11/12 perf9 · 정범님 '웹앱·리드나우 2·우리숍을 지속적으로 최적화')
 *  쓰임: node src/tools/weigh.js            # 지금 무게를 재 app/weigh.json의 마지막 판(기준선)과 견줌 — 나빠졌으면 ⚠ + 까닭 후보 커밋
 *        node src/tools/weigh.js --save     # 판을 낼 때: 재서 app/weigh.json 끝에 한 줄 더함(최근 60판 · 웹앱 🪶 웹앱 무게 칸이 읽음)
 *        node src/tools/weigh.js --boot <포트> # + 시험 서버(<포트>/app/index.html)에서 큰 가짜 자료로 켜기 측정(src/tests/perf/tBOOT.js · playwright)
 *        node src/tools/weigh.js --quick    # ship-check용 — 웹앱 파일 크기만 · 경고만(멈추지 않음)
 *  재는 것: 웹앱 본문(app/readnow-webapp.js)·틀(app/index.html) KB · 되풀이 타이머(setInterval) 수 · 실시간 듣기(onSnapshot) 수 · 리드나우 2(옆 폴더 readnow-ui2) 프로그램 KB · 우리숍(shop/) KB
 *  기준선 = app/weigh.json의 바로 앞 판 · 나빠짐 = 웹앱 본문 +2% 또는 타이머·듣기 +3개 또는 리드나우 2·우리숍 +5% · 까닭 후보 = 기준선 커밋 뒤 그 파일을 고친 커밋(더한 줄 많은 순 5개)
 *  값만 잼 — 저장소 파일은 --save 때 app/weigh.json 하나만 고침 */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const A = process.argv.slice(2); const has = (k) => A.includes(k); const arg = (k) => { const i = A.indexOf(k); return i >= 0 ? A[i + 1] : null; };
const R = path.resolve(arg('--root') || path.join(__dirname, '../..')); const OUT = path.join(R, 'app/weigh.json');
const kb = (f) => { try { return Math.round(fs.statSync(f).size / 1024); } catch (e) { return null; } };
const rd = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { return ''; } };
const cnt = (s, re) => (s.match(re) || []).length;
const git = (c) => { try { return cp.execSync(`git -C "${R}" ${c}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (e) { return ''; } };
const dirKb = (d, re) => { let t = 0, n = 0, big = null; try { for (const f of fs.readdirSync(d)) { if (!re.test(f)) continue; const k = kb(path.join(d, f)) || 0; t += k; n++; if (!big || k > big[1]) big = [f, k]; } } catch (e) { return null; } return { kb: t, n, big }; };
function measure() { const js = rd(path.join(R, 'app/readnow-webapp.js')); const idx = rd(path.join(R, 'app/index.html'));
  const ver = (idx.match(/const APP_VER = '([\d.]+)'/) || [])[1] || null;
  const U = [path.join(R, '../readnow-ui2'), path.join(R, 'readnow-ui2')].find((d) => fs.existsSync(path.join(d, 'u2-config.js')));
  let ui2 = null; if (U) { const s = dirKb(path.join(U, 'src'), /\.(js|css)$/); ui2 = { ver: (rd(path.join(U, 'u2-config.js')).match(/U2_VER = '([\d.]+)'/) || [])[1] || null, kb: (s ? s.kb : 0) + (kb(path.join(U, 'index.html')) || 0), files: s ? s.n : 0, big: s && s.big }; }
  const sh = dirKb(path.join(R, 'shop'), /\.(js|css|html)$/);
  return { ver, at: new Date().toISOString(), commit: git('rev-parse --short HEAD') || null, kb: kb(path.join(R, 'app/readnow-webapp.js')), idxKb: kb(path.join(R, 'app/index.html')), iv: cnt(js, /setInterval\(/g), snap: cnt(js, /\.onSnapshot\(/g), fns: cnt(js, /\bfunction\b/g), ui2, shop: sh ? { kb: sh.kb, files: sh.n } : null }; }
function blame(file, since) { if (!since) return []; const out = git(`log --format=@%h\\ %s --numstat ${since}..HEAD -- ${file}`); const L = []; let cur = null; for (const ln of out.split('\n')) { if (ln.startsWith('@')) { cur = { c: ln.slice(1, 9), s: ln.slice(10, 110), add: 0 }; L.push(cur); } else if (cur) { const m = ln.match(/^(\d+)\s+(\d+)/); if (m) cur.add += +m[1]; } } return L.sort((a, b) => b.add - a.add).slice(0, 5); }
(async () => { const now = measure(); let H = { v: [] }; try { H = JSON.parse(rd(OUT)) || H; } catch (e) {} if (!Array.isArray(H.v)) H.v = [];
  const base = [...H.v].reverse().find((x) => x.ver !== now.ver) || null; const pct = (a, b) => (a != null && b ? Math.round(((a - b) / b) * 1000) / 10 : null);
  if (has('--boot')) { const port = arg('--boot'); try { const o = cp.execSync(`node "${path.join(R, 'src/tests/perf/tBOOT.js')}" weigh`, { encoding: 'utf8', env: { ...process.env, RN_PORT: port }, timeout: 600000 }); const j = JSON.parse((o.match(/^\{.*\}$/m) || ['{}'])[0]); now.boot = { ms: j.done_ms, heapMax: j.heapMax, heapEnd: j.heapAfterGC, ltN: j.lt_n, ltMs: j.lt_sum, ltMax: j.lt_max }; } catch (e) { now.boot = { err: String(e.message || e).slice(0, 120) }; } }
  const W = []; const say = (m) => W.push(m);
  if (base) { const d = pct(now.kb, base.kb); if (d != null && d > 2) say(`웹앱 본문 ${base.kb}→${now.kb}KB (+${d}%)`); if (now.iv - (base.iv || 0) >= 3) say(`되풀이 타이머 ${base.iv}→${now.iv}개`); if (now.snap - (base.snap || 0) >= 3) say(`실시간 듣기 ${base.snap}→${now.snap}곳`);
    if (now.ui2 && base.ui2) { const d2 = pct(now.ui2.kb, base.ui2.kb); if (d2 > 5) say(`리드나우 2 ${base.ui2.kb}→${now.ui2.kb}KB (+${d2}%)`); } if (now.shop && base.shop) { const d3 = pct(now.shop.kb, base.shop.kb); if (d3 > 5) say(`우리숍 ${base.shop.kb}→${now.shop.kb}KB (+${d3}%)`); }
    if (now.boot && base.boot && now.boot.heapMax && base.boot.heapMax) { if (now.boot.heapMax > base.boot.heapMax * 1.2) say(`켜기 힙 최고 ${base.boot.heapMax}→${now.boot.heapMax}MB`); if (now.boot.ms > base.boot.ms * 1.3 && now.boot.ms - base.boot.ms > 3000) say(`켜기 ${Math.round(base.boot.ms / 100) / 10}→${Math.round(now.boot.ms / 100) / 10}초`); } }
  if (has('--quick')) { console.log(W.length ? `⚠ 🪶 무게: ${W.join(' · ')} (기준 ${base.ver}) — node src/tools/weigh.js 로 까닭 후보` : `✓ 🪶 무게: 웹앱 본문 ${now.kb}KB${base ? ` (기준 ${base.ver} ${base.kb}KB)` : ''}`); return; }
  console.log(`🪶 무게 ${now.ver} (${now.commit}) — 웹앱 본문 ${now.kb}KB · 틀 ${now.idxKb}KB · 되풀이 타이머 ${now.iv} · 실시간 듣기 ${now.snap} · 함수 ${now.fns}${now.ui2 ? ` · 리드나우 2 ${now.ui2.ver} ${now.ui2.kb}KB(${now.ui2.files}개 · 가장 큰 ${now.ui2.big ? now.ui2.big.join(' ') + 'KB' : '-'})` : ''}${now.shop ? ` · 우리숍 ${now.shop.kb}KB` : ''}${now.boot ? ` · 켜기 ${JSON.stringify(now.boot)}` : ''}`);
  if (base) console.log(`   기준선 ${base.ver} (${base.commit}) — 웹앱 본문 ${base.kb}KB(${pct(now.kb, base.kb)}%) · 타이머 ${base.iv} · 듣기 ${base.snap}${base.boot ? ` · 켜기 ${JSON.stringify(base.boot)}` : ''}`);
  if (W.length) { console.log('⚠ 나빠짐: ' + W.join(' · ')); const B = blame('src/app.html', base && base.commit); if (B.length) console.log('   까닭 후보(기준선 뒤 src/app.html을 고친 커밋 · 더한 줄 많은 순):\n' + B.map((x) => `   - ${x.c} +${x.add}줄 ${x.s}`).join('\n')); } else console.log('✓ 기준선보다 나빠진 칸 없음');
  if (has('--save')) { H.v = H.v.filter((x) => x.ver !== now.ver).concat([now]).slice(-60); H.note = '🪶 판마다 무게(src/tools/weigh.js --save) — 웹앱 ⚙ 설정 › 🪶 웹앱 무게가 읽음'; fs.writeFileSync(OUT, JSON.stringify(H, null, 1) + '\n'); console.log(`✓ app/weigh.json에 ${now.ver} 줄 (모두 ${H.v.length}판)`); }
})();
