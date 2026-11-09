/* tBIG1 — 11/10 🌐 주소 옮기기 준비(머리 안 바뀌는 것만): '새 주소(readnow.kr) 먼저 · 안 되면 옛 주소(GitHub)'
 *  ① 클라우드: 공용 파일은 이미지 안 사본(같은 커밋일 때만) → 아니면 GitHub 그 커밋
 *  ② 수집기 빠른 업데이트: 새 주소의 pc-live.json·모듈(지문까지 같아야) → 새 주소가 안 열림·옛 판·지문 틀림이면 GitHub 커밋 길 · 머리가 다르면 받지 않음
 *  ③ 로컬 도우미 스스로 새 판: 두 주소 중 판 번호 높은 것 · 새 주소가 죽어 있어도 옛 주소로 · 새 웹앱 출처 허락 · readnow.kr은 와이파이 길
 *  ④ 인쇄 도우미: 두 주소 중 판 번호 높은 것 · 새 주소 출처 허락
 *  ⑤ 수집기 머리·본체는 한 글자도 안 바뀜(나누기 결과 비교)
 * 실행: node src/tests/tBIG1.js (저장소 뿌리 기준 · 서버·브라우저 필요 없음) */
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), crypto = require('crypto');
const ROOT = [path.join(__dirname, '../..'), path.join(__dirname, '..')].find((p) => fs.existsSync(path.join(p, 'cloud/index.js')) && fs.existsSync(path.join(p, 'src/readnow-collector.src.js')));
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const line = (s, start) => { const i = s.indexOf(start); if (i < 0) throw new Error('못 찾음: ' + start); return s.slice(i, s.indexOf('\n', i)); };
const sha = (t) => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
(async () => {
  /* ① 클라우드 */
  console.log('① 클라우드 공용 파일');
  { const S = rd('cloud/index.js'); const code = line(S, 'const CORE_LOCAL_OK') + '\n' + line(S, 'const coreFetch');
    ok((S.match(/fetch\(RAW \+/g) || []).length === 1 && (S.match(/coreFetch\(/g) || []).length === 6 && !/return coreFetch\(f\)/.test(S), '공용 파일 받기 6곳(코어·노선표·실행·자동 일정·학습·외부 정보)이 모두 coreFetch로(GitHub 부르기는 coreFetch 안 한 곳뿐)');
    const mk = (env, sha1, commitFile, files) => { const D = fs.mkdtempSync(path.join(os.tmpdir(), 'tbig1c_')); for (const [k, v] of Object.entries(files)) fs.writeFileSync(path.join(D, k), v); if (commitFile) fs.writeFileSync(path.join(D, 'cores_commit.js'), `module.exports = '${commitFile}';`);
      const fetched = []; const fakeFetch = async (u) => { fetched.push(u); return { ok: true, status: 200, text: async () => 'GITHUB' }; };
      const req = (m) => (m === './cores_commit.js' ? require(path.join(D, 'cores_commit.js')) : require(m));
      const f = new Function('process', 'CODE_SHA', 'RAW', 'fetch', 'require', '__dirname', code + '\nreturn { CORE_LOCAL_OK, coreFetch };');
      return { ...f({ env }, sha1, 'https://raw.githubusercontent.com/x/' + sha1 + '/', fakeFetch, req, D), fetched }; };
    const A = 'a'.repeat(40), B = 'b'.repeat(40);
    let X = mk({}, A, A, { 'cores_readnow-core.js': 'LOCAL' }); let r = await X.coreFetch('readnow-core.js');
    ok(X.CORE_LOCAL_OK && r.ok && (await r.text()) === 'LOCAL' && !X.fetched.length, '같은 커밋 사본이 있으면 GitHub를 부르지 않고 사본');
    r = await X.coreFetch('readnow-ext-core.js'); ok((await r.text()) === 'GITHUB' && X.fetched.length === 1 && X.fetched[0].includes(A + '/readnow-ext-core.js'), '사본에 없는 파일은 예전처럼 GitHub(같은 커밋)');
    X = mk({}, A, B, { 'cores_readnow-core.js': 'LOCAL' }); r = await X.coreFetch('readnow-core.js'); ok(!X.CORE_LOCAL_OK && (await r.text()) === 'GITHUB', '사본 커밋이 다르면 쓰지 않음 → GitHub');
    X = mk({}, null, null, {}); r = await X.coreFetch('readnow-core.js'); ok(!X.CORE_LOCAL_OK && (await r.text()) === 'GITHUB', '사본이 없으면(손으로 올린 판·지금 이미지) 예전과 똑같이 GitHub');
    X = mk({ CORE_BASE: 'https://x/' }, A, A, { 'cores_readnow-core.js': 'LOCAL' }); ok(!X.CORE_LOCAL_OK, 'CORE_BASE를 손으로 정하면 그것만');
    const Y = rd('.github/workflows/deploy-cloud.yml'); ok(/cp "\$f" "cores_\$\(basename "\$f"\)"/.test(Y) && /cores_commit\.js/.test(Y), '자동 배포가 공용 파일 사본·커밋 표를 이미지에 넣음');
    ok(/COPY \*\.js \.\//.test(rd('cloud/Dockerfile')), 'Dockerfile COPY *.js가 사본(cores_*.js)도 담음(바꾸지 않음)');
    ok(/'https:\/\/readnow\.kr'\]\)\]/.test(S) && /'https:\/\/jerrycson\.github\.io'/.test(line(S, 'const ORIGINS')), '클라우드 허락 출처: 옛 주소 그대로 + readnow.kr 늘'); }

  /* ② 수집기 빠른 업데이트 */
  console.log('② 수집기 빠른 업데이트');
  { const S = rd('src/readnow-collector.src.js'); const a = S.indexOf('(() => { let lastC = null; const RB'); const e = S.indexOf('setTimeout(sub, 15000); })();', a); ok(a > 0 && e > a, 'IIFE 찾음');
    const body = S.slice(a, e) + '__T.go = go; })();';
    const run = async (net, H0) => { const T = {}; const logs = []; const store = { 'rn-live': H0 || null }; const got = [];
      const fakeFetch = async (u) => { got.push(u); const k = u.replace(/\?t=\d+$/, ''); if (!(k in net)) throw new Error('연결 실패'); const v = net[k]; return { ok: true, json: async () => JSON.parse(v), text: async () => v }; };
      const W = { __rnLiveInfo: () => ({ hsig: 'H1' }), __rnLiveReady: (v) => (T.ready = v) };
      new Function('__T', 'fetch', 'crypto', 'GM_getValue', 'GM_setValue', 'window', 'log', 'C', 'verNum', 'VER', 'TextEncoder', body)(T, fakeFetch, globalThis.crypto, (k, d) => (k in store ? store[k] : d), (k, v) => (store[k] = v), W, (m) => logs.push(m), () => ({}), (v) => v.split('.').reduce((x, y) => x * 1000 + +y, 0), '1.89.247', TextEncoder);
      await T.go({ commit: 'c'.repeat(40), ver: '1.89.248' }); return { store, logs, got, T }; };
    const mods = { 'readnow-pc-runtime.js': 'RUNTIME_NEW', 'readnow-pc-products.js': 'PRODUCTS_NEW' };
    const man = (hs, sh) => JSON.stringify({ ver: '1.89.248', hsig: hs, files: Object.entries(mods).map(([f, t]) => ({ f, sha: sh || sha(t) })) });
    const NEW = 'https://readnow.kr/', OLD = 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/' + 'c'.repeat(40) + '/';
    const both = (o) => Object.fromEntries(Object.entries(mods).map(([f, t]) => [o + f, t]));
    let r = await run({ [NEW + 'pc-live.json']: man('H1'), ...both(NEW) });
    ok(r.store['rn-live'] && r.store['rn-live'].code.includes('PRODUCTS_NEW') && !r.got.some((u) => u.startsWith(OLD)) && /새 주소\(readnow\.kr\)/.test(r.logs.join()), '새 주소가 열려 있으면 새 주소에서만 받음');
    r = await run({ [OLD + 'pc-live.json']: man('H1'), ...both(OLD) });
    ok(r.store['rn-live'] && r.store['rn-live'].ver === '1.89.248' && /GitHub 커밋/.test(r.logs.join()), '새 주소가 안 열려 있으면(지금) 예전 GitHub 커밋 길 그대로');
    r = await run({ [NEW + 'pc-live.json']: man('H1').replace('1.89.248', '1.89.247'), [OLD + 'pc-live.json']: man('H1'), ...both(OLD) });
    ok(r.store['rn-live'] && /GitHub 커밋/.test(r.logs.join()), '새 주소가 옛 판(배포가 늦음)이면 GitHub 커밋 길');
    r = await run({ [NEW + 'pc-live.json']: man('H1'), [NEW + 'readnow-pc-runtime.js']: 'RUNTIME_NEW', [NEW + 'readnow-pc-products.js']: 'BROKEN', [OLD + 'pc-live.json']: man('H1'), ...both(OLD) });
    ok(r.store['rn-live'] && r.store['rn-live'].code.includes('PRODUCTS_NEW') && !r.store['rn-live'].code.includes('BROKEN'), '새 주소 파일 지문이 틀리면 버리고 GitHub에서 다시(틀린 글은 안 씀)');
    r = await run({ [NEW + 'pc-live.json']: man('H2'), [OLD + 'pc-live.json']: man('H2'), ...both(OLD) });
    ok(!r.store['rn-live'], '머리 서명이 다른 판이면 어느 길로도 받지 않음(예전과 같음)');
    r = await run({}); ok(!r.store['rn-live'] && /바로 받기 실패/.test(r.logs.join()), '두 길 다 안 되면 예전처럼 실패만 기록(5분 확인으로 이어감)');
    ok(/const COVER_FB_NEW = 'https:\/\/readnow\.kr\/app\/img\/booksking-preparing\.jpg'/.test(S) && /pageFetch: true/.test(S) && /\['기본 그림\(북스킹 실사진 준비 중\)', \{ url: \(fb && fb\.def\) \|\| COVER_FB_DEF/.test(S), '대체 표지: 새 주소(화면 fetch · @connect 안 늘림) 먼저 → 예전 주소'); }

  /* ③ 로컬 도우미 */
  console.log('③ 로컬 도우미');
  { const S = rd('local/readnow-local.js'); const gb = line(S, 'function getBest('); const vo = line(S, 'const verOf');
    const mk = (net) => new Function('getText', gb + '\n' + vo + '\nreturn { getBest, verOf };')((u, cb) => setTimeout(() => (u in net ? cb(null, net[u]) : cb(new Error('HTTP 404'))), 1));
    const NEW = 'https://readnow.kr/local/readnow-local.js', OLD = 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/readnow-local.js';
    const pickRun = (net) => new Promise((res) => { const X = mk(net); X.getBest([NEW, OLD], X.verOf, (e, src, u) => res({ e, src, u })); });
    let r = await pickRun({ [OLD]: "const VERSION = '1.8.20';" }); ok(!r.e && r.u === OLD && /1\.8\.20/.test(r.src), '새 주소가 없으면(지금) 옛 주소로 그대로');
    r = await pickRun({ [NEW]: "const VERSION = '1.8.21';", [OLD]: "const VERSION = '1.8.20';" }); ok(r.u === NEW, '새 주소가 더 새 판이면 새 주소');
    r = await pickRun({ [NEW]: "const VERSION = '1.8.19';", [OLD]: "const VERSION = '1.8.20';" }); ok(r.u === OLD, '새 주소가 늦으면 옛 주소의 새 판');
    r = await pickRun({ [NEW]: "const VERSION = '1.8.20';", [OLD]: "const VERSION = '1.8.20';" }); ok(r.u === NEW, '같으면 새 주소');
    r = await pickRun({ [NEW]: '<html>404</html>' }); ok(!!r.e, '판 번호 없는 글·실패뿐이면 오류(바꾸지 않음)');
    ok(/'readnow\.kr', \/\* \(11\/10 big1\)/.test(S) && /'tampermonkey\.net', 'readnow\.kr'\]\)\) return 'update'/.test(S), 'readnow.kr = 와이파이 길(테더링으로 안 감) · 업데이트 묶음');
    ok(/const WHO_ORIGINS = \['https:\/\/jerrycson\.github\.io', 'https:\/\/readnow\.kr'\]/.test(S) && !/WHO_ORIGIN\b(?!S)/.test(S.replace(/WHO_ORIGINS/g, '')), '/whoami 출처: 옛 주소 그대로 + readnow.kr'); }

  /* ④ 인쇄 도우미 */
  console.log('④ 인쇄 도우미');
  { const S = rd('local/readnow-print.js'); const code = ['const RAW_OLD_BASE', 'function getOne(', 'function bestGet(', '  Promise.all(urls.map(getOne))'].map((k) => line(S, k)).join('\n');
    ok(['selfUpdate', 'alpsUpdate', 'workUpdate', 'blkUpdate'].every((f) => new RegExp('function ' + f + '\\(\\) \\{[^\\n]*bestGet\\(').test(S)), '새 판 받기 4곳(인쇄·ALPS·작업 창·추적 차단) 모두 두 주소 비교');
    const mk = (net) => { const https = { get: (u, o, cb) => { const k = u.replace(/\?t=\d+$/, ''); const h = { on(ev, f) { if (ev === 'error' && !(k in net)) setTimeout(() => f(new Error('x')), 1); return h; } };
      if (k in net) setTimeout(() => { const L = {}; const r = { statusCode: 200, resume() {}, setEncoding() {}, on(ev, f) { L[ev] = f; return r; } }; cb(r); L.data(net[k]); L.end(); }, 1); return h; } };
      return new Function('https', code + '\nreturn bestGet;')(https); };
    const OLD = 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/readnow-print.js', NEW = 'https://readnow.kr/local/readnow-print.js'; const RE = /const VERSION = '([\d.]+)'/;
    const pr = (net) => new Promise((res) => { mk(net)(OLD, RE, res); setTimeout(() => res(null), 300); });
    ok(/1\.2\.3/.test(await pr({ [OLD]: "const VERSION = '1.2.3';" })), '새 주소가 없으면(지금) 옛 주소 그대로');
    ok(/NEW/.test(await pr({ [NEW]: "const VERSION = '1.2.4'; //NEW", [OLD]: "const VERSION = '1.2.3';" })), '새 주소가 더 새 판이면 새 주소');
    ok(/OLD/.test(await pr({ [NEW]: "const VERSION = '1.2.2';", [OLD]: "const VERSION = '1.2.3'; //OLD" })), '새 주소가 늦으면 옛 주소');
    ok((await pr({})) === null, '둘 다 실패면 아무것도 안 함(예전과 같음)');
    ok(/\/\^https:\\\/\\\/readnow\\\.kr\$\//.test(line(S, 'const ORIGINS')) && /jerrycson\\\.github\\\.io/.test(line(S, 'const ORIGINS')), '출처 허락: 옛 주소 그대로 + readnow.kr');
    ok(/rawNew: process\.env\.RN_COL2_RAW \? null : 'https:\/\/readnow\.kr\/lab\/col2\/'/.test(S) && /c2Get\(base \+ 'bundle\.json'/.test(S), '번외 묶음: 두 주소 중 판 높은 곳 한 군데에서 전부'); }

  /* ⑤ 머리 그대로 */
  console.log('⑤ 수집기 머리·본체 그대로');
  { const T = fs.mkdtempSync(path.join(os.tmpdir(), 'tbig1s_')); let base = null; try { base = cp.execSync('git -C "' + ROOT + '" show origin/main:src/readnow-collector.src.js', { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) {}
    if (/const RAW = 'https:\/\/readnow\.kr\/'/.test(rd('src/split.js'))) ok(true, '(머리 바꾼 판 가지 — 이 비교는 tBIG1H가 맡음)'); else if (!base) ok(true, '(origin/main 없음 — 건너뜀)'); else { fs.writeFileSync(T + '/o.js', base); cp.execFileSync(process.execPath, [path.join(ROOT, 'src/split.js'), T + '/o.js', T + '/a'], { stdio: 'ignore' }); cp.execFileSync(process.execPath, [path.join(ROOT, 'src/split.js'), path.join(ROOT, 'src/readnow-collector.src.js'), T + '/b'], { stdio: 'ignore' });
      for (const f of ['readnow-collector.user.js', 'readnow-pc-boot.js', 'pc-live-head.txt']) ok(fs.readFileSync(T + '/a/' + f, 'utf8') === fs.readFileSync(T + '/b/' + f, 'utf8'), f + ' 글자 하나 안 바뀜(머리 서명 그대로)'); } }
  console.log(bad ? `tBIG1 ❌ ${bad}개 실패` : 'tBIG1 ✅ 모두 통과'); process.exit(bad ? 1 : 0);
})();
