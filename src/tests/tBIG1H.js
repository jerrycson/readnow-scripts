/* tBIG1H — 11/10 🌐 '머리 바꾼 판'(work/big1-head-1110 · 정범님 허락 전 main에 안 올림)
 *  ① 수집기·감시기 머리: @updateURL·@downloadURL·우리 @require = readnow.kr · @match·@connect readnow.kr 더함(옛 github.io는 그대로 둠)
 *  ② 머리 서명은 이번 한 번만 바뀌고, 그 뒤 공용 파일 판(?v=)이 올라도 그대로(우리 파일 줄은 서명에서 뺌)
 *  ③ 로더 5분 확인: 새 주소·옛 주소 중 판 높은 것 · 새 주소가 죽어도 옛 주소로 · 새 주소 파일 지문이 틀리면 옛 주소 파일로
 *  ④ 웹앱 화면(로그인 넘기기·잠금 백업 다리·출고 알림)이 readnow.kr/app/에서도 깨어남
 * 실행: node src/tests/tBIG1H.js */
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), crypto = require('crypto');
const ROOT = [path.join(__dirname, '../..'), path.join(__dirname, '..')].find((p) => fs.existsSync(path.join(p, 'src/split.js')));
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const split = (src) => { const T = fs.mkdtempSync(path.join(os.tmpdir(), 'tbig1h_')); fs.writeFileSync(T + '/s.js', src); cp.execFileSync(process.execPath, [path.join(ROOT, 'src/split.js'), T + '/s.js', T + '/o'], { stdio: 'ignore' }); return { dir: T + '/o', hsig: fs.readFileSync(T + '/o/pc-live-head.txt', 'utf8').split('\n')[0].trim(), main: fs.readFileSync(T + '/o/readnow-collector.user.js', 'utf8'), boot: fs.readFileSync(T + '/o/readnow-pc-boot.js', 'utf8') }; };
(async () => {
  console.log('① 머리');
  const SRC = rd('src/readnow-collector.src.js'); const S1 = split(SRC); const H = S1.main.slice(0, S1.main.indexOf('// ==/UserScript=='));
  ok(/@updateURL\s+https:\/\/readnow\.kr\/readnow-collector\.user\.js/.test(H) && /@downloadURL\s+https:\/\/readnow\.kr\/readnow-collector\.user\.js/.test(H), '수집기 @updateURL·@downloadURL = readnow.kr');
  ok(!/raw\.githubusercontent\.com\/jerrycson/.test(H), '수집기 머리에 옛 GitHub 파일 주소 0');
  ok((H.match(/@require\s+https:\/\/readnow\.kr\//g) || []).length >= 19, '우리 파일 @require 모두 readnow.kr (' + (H.match(/@require\s+https:\/\/readnow\.kr\//g) || []).length + '줄)');
  ok(/@match\s+https:\/\/readnow\.kr\/\*/.test(H) && /@match\s+https:\/\/jerrycson\.github\.io\/\*/.test(H) && /@connect\s+readnow\.kr/.test(H), '@match·@connect readnow.kr 더함 · 옛 웹앱 주소 @match 그대로');
  const PW = rd('readnow-price-watch.user.js'); const PH = PW.slice(0, PW.indexOf('// ==/UserScript=='));
  ok(/@updateURL\s+https:\/\/readnow\.kr\//.test(PH) && !/raw\.githubusercontent/.test(PH) && (PH.match(/@require\s+https:\/\/readnow\.kr\//g) || []).length === 6, '감시기 머리 = readnow.kr(@require 6줄)');

  console.log('② 머리 서명');
  ok(S1.hsig !== '8559039d5a96110b', '머리 서명이 이번 한 번 바뀜 ' + S1.hsig + ' (지금 8559039d5a96110b) — PC마다 Tampermonkey 한 번');
  const bumped = SRC.replace(/(@require\s+https:\/\/readnow\.kr\/readnow-core\.js\?v=)[\d.]+/, '$19.9.9').replace(/(@version\s+)[\d.]+/, '$11.99.0');
  ok(split(bumped).hsig === S1.hsig, '그 뒤 공용 파일 판·수집기 판이 올라도 머리 서명 그대로(빠른 업데이트 이어짐)');
  ok(split(SRC.replace('// @connect      readnow.kr\n', '')).hsig !== S1.hsig, '@connect가 바뀌면 서명이 바뀜(검사는 그대로 살아 있음)');
  const SC = rd('src/tools/ship-check.sh'); ok(/grep -vE '\^\/\/ @require \+https:\/\/readnow\\\.kr\/'/.test(SC), 'ship-check ④ 머리 비교도 readnow.kr 우리 파일 줄을 뺌');
  const RL = rd('src/release.js'); ok((RL.match(/readnow\\\.kr\\\//g) || []).length >= 2, 'release.js 빠른 업데이트 목록·로컬 껍데기가 readnow.kr 줄도 읽음');

  console.log('③ 로더 5분 확인');
  { const M0 = S1.main; const a = M0.indexOf('const sha = async (t) =>', M0.indexOf('const RAWL2')); const e = M0.indexOf('window.__rnLiveCheck = () => chk(true);', a); ok(a > 0 && e > a, '로더 확인 코드 찾음');
    const code = M0.slice(a, e) + '\nreturn chk;';
    const run = async (net) => { const store = {}; const logs = []; const got = []; const W = { __rnLog: (a, b, m) => logs.push(m), __rnLiveReady: (v) => (store.ready = v) };
      const fakeFetch = async (u) => { got.push(u); const k = u.replace(/\?.*$/, ''); if (!(k in net)) throw new Error('연결 실패'); const v = net[k]; return { ok: true, status: 200, json: async () => JSON.parse(v), text: async () => v }; };
      const G = { __rnLiveVer: '1.89.247' }; const HSIG = S1.hsig;
      const chk = new Function('G', 'HSIG', 'RAWL', 'RAWL2', 'gv', 'sv', 'vn', 'fetch', 'window', 'crypto', 'TextEncoder', 'GM_openInTab', code)(G, HSIG, 'https://readnow.kr/', 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/', (k, d) => (k in store ? store[k] : d), (k, v) => (store[k] = v), (v) => String(v || '0').split('.').reduce((x, y) => x * 1000 + (+y || 0), 0), fakeFetch, W, globalThis.crypto, TextEncoder, () => {});
      await chk(true); if (process.env.DBG) console.log(JSON.stringify({ k: Object.keys(store), err: store['rn-live-err'], logs, got })); return { store, logs, got }; };
    const sha = (t) => crypto.createHash('sha256').update(t, 'utf8').digest('hex');
    const man = (ver, files) => JSON.stringify({ ver, hsig: S1.hsig, files: Object.entries(files).map(([f, t]) => ({ f, v: ver, sha: sha(t) })) });
    const F = { 'readnow-pc-runtime.js': 'R2', 'readnow-pc-products.js': 'P2' }; const N = 'https://readnow.kr/', O = 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/refs/heads/main/';
    const at = (b, files) => Object.fromEntries(Object.entries(files).map(([f, t]) => [b + f, t]));
    let r = await run({ [N + 'pc-live.json']: man('1.89.248', F), ...at(N, F) }); ok(r.store['rn-live'] && r.store['rn-live'].code.includes('P2') && !r.got.some((u) => u.startsWith(O + 'readnow-pc')), '새 주소에서 새 판 받음');
    r = await run({ [O + 'pc-live.json']: man('1.89.248', F), ...at(O, F) }); ok(r.store['rn-live'] && r.store['rn-live'].ver === '1.89.248', '새 주소가 죽어 있으면 옛 주소로(지금 공개인 동안)');
    r = await run({ [N + 'pc-live.json']: man('1.89.248', F), [O + 'pc-live.json']: man('1.89.249', F), ...at(O, F) }); ok(r.store['rn-live'] && r.store['rn-live'].ver === '1.89.249', '옛 주소 판이 더 높으면(새 주소 배포가 늦음) 옛 주소');
    r = await run({ [N + 'pc-live.json']: man('1.89.248', F), [N + 'readnow-pc-runtime.js']: 'R2', [N + 'readnow-pc-products.js']: 'XX', ...at(O, F) }); ok(r.store['rn-live'] && r.store['rn-live'].code.includes('P2') && !r.store['rn-live'].code.includes('XX'), '새 주소 파일 지문이 틀리면 그 파일만 옛 주소에서(틀린 글은 안 씀)');
    r = await run({}); ok(!r.store['rn-live'] && r.store['rn-live-err'], '두 주소 다 안 되면 실패만 기록(지금처럼)'); }

  console.log('④ 웹앱 화면');
  ok(/location\.hostname === 'readnow\.kr'/.test(S1.boot) && /\(readnow-scripts\\\/\)\?app/.test(S1.boot), '로그인 넘기기(시작 코드): readnow.kr/app/에서도');
  ok((SRC.match(/jerrycson\\\.github\\\.io\|readnow\\\.kr/g) || []).length === 3, '모듈의 웹앱 화면 확인 3곳(출고 알림·관제·잠금 백업 다리) readnow.kr도');
  console.log(bad ? `tBIG1H ❌ ${bad}개 실패` : 'tBIG1H ✅ 모두 통과'); process.exit(bad ? 1 : 0);
})();
