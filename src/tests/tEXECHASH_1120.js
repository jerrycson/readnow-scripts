// (1.78.839 정범님 I-1120-1430-27a) 공용 실행 부품 requestHash — Prototype.js가 Array.from을 바꿔도 지문이 바른 16진 64자
const path = require('path'); const fs = require('fs'); const ROOT = path.join(__dirname, '..', '..');
let fail = 0; const ok = (c, m) => { console.log((c ? '  ✓ ' : '  ❌ ') + m); if (!c) fail++; };
(async () => {
  for (const f of ['readnow-exec-core.js', 'cloud/readnow-exec-core.js']) {
    const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    ok(/const VERSION = '0\.1\.([3-9]|\d\d)'/.test(src), f + ' 판 0.1.3 뒤');
    ok(!/Array\.from\(new Uint8Array/.test(src), f + ' Array.from(…, 바꾸기) 안 씀');
    delete require.cache[require.resolve(path.join(ROOT, f))];
    const E = require(path.join(ROOT, f)); const good = await E.requestHash({ a: 1, b: [2, 3] });
    ok(/^[0-9a-f]{64}$/.test(good), f + ' 지문 16진 64자');
    const AF = Array.from; Array.from = function (x) { return AF.call(Array, x); }; /* Prototype.js 꼴: 두 번째 인수 무시 */
    let bad; try { bad = await E.requestHash({ a: 1, b: [2, 3] }); } finally { Array.from = AF; }
    ok(bad === good, f + ' Array.from을 바꿔 둬도 같은 지문');
    { const cp = require('child_process'); let old = null; try { old = cp.execSync('git show 7c2769132:readnow-exec-core.js', { cwd: ROOT, encoding: 'utf8' }); } catch (e) {} if (old) { const m = { exports: {} }; new Function('module', 'exports', 'require', 'globalThis', old)(m, m.exports, require, globalThis); const O = m.exports.requestHash ? m.exports : globalThis.ReadnowExec || m.exports; if (O && O.requestHash) ok((await O.requestHash({ a: 1, b: [2, 3] })) === good, f + ' 예전 판(0.1.2)과 같은 지문 — 남은 기록과 맞음'); else console.log('  (예전 판 모양을 못 읽어 건너뜀)'); } }
  }
  const W = fs.readFileSync(path.join(ROOT, 'readnow-price-watch.user.js'), 'utf8'); ok(W.includes('readnow-exec-core.js?v=0.1.3'), '감시기가 0.1.3을 부름');
  ok(fs.readFileSync(path.join(ROOT, 'src/split.js'), 'utf8').includes('exec-core.js?v=0.1.3'), '수집기가 0.1.3을 부름');
  ok(fs.readFileSync(path.join(ROOT, 'src/app.html'), 'utf8').includes('readnow-exec-core.js?v=0.1.3"'), '웹앱이 0.1.3을 부름');
  if (fail) { console.log('❌ ' + fail + '개 실패'); process.exit(1); } console.log('✅ tEXECHASH_1120 모두 통과');
})();
