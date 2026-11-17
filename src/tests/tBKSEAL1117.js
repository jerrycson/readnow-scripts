/* tBKSEAL1117 — 정범님 11/17 16:16 「백업할 때 문제 파일을 덮어쓰지 않도록 · 이미 백업한 파일들을 절대 수정하지 못하도록」 · 「모든 걸 무조건 백업해」 (일꾼 bkimmut1)
 *  ① 로거 도우미(local/readnow-local.js)의 '🔏 백업 봉인' 덩어리만 떼어 임시 폴더에서 돌림(tBK1과 같은 방식) — 인쇄 도우미(local/readnow-print.js)와 글자 하나 다르지 않은지도 봄
 *  ② 덮어쓰기 0: 같은 이름 다시 쓰기 · 봉인 파일 쓰기 시도 · 봉인 중(해시 세는 사이) 쓰기 · 사람이 읽기 전용을 풀어도 · 날짜 넘김·시계 틀림 · 해시 어긋남 알림(파일은 그대로) · 디스크 부족(지우지 않음) · icacls 모양
 *  ③ 인쇄 도우미를 실제로 띄워 /bk-put 이 봉인된 이름을 피해 -2 로 쓰는지(HTTP)
 *  ④ 다른 길(일지 보관함·보안 사본·GitHub 거울 이력)도 같은 이름을 덮지 않는지 · 수집기·웹앱이 봉인 상태를 싣고 보이는지 · 공간 때문에 백업을 건너뛰지 않는지
 * 실행: node src/tests/tBKSEAL1117.js */
const fs = require('fs'), path = require('path'), os = require('os'), vm = require('vm'), cp = require('child_process'), http = require('http'), crypto = require('crypto');
const pick = (...L) => L.find((p) => fs.existsSync(p));
const R = (...p) => pick(path.join(__dirname, '..', ...p), path.join(__dirname, '..', '..', ...p));
const LOCAL = R('local', 'readnow-local.js'), PRINT = R('local', 'readnow-print.js');
const COLS = pick(path.join(__dirname, '..', 'readnow-collector.src.js'), path.join(__dirname, '..', '..', 'src', 'readnow-collector.src.js'));
const APP = pick(path.join(__dirname, '..', 'app.html'), path.join(__dirname, '..', '..', 'src', 'app.html'));
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const S1 = fs.readFileSync(LOCAL, 'utf8'), S2 = fs.readFileSync(PRINT, 'utf8');
const cut = (S) => { const a = S.indexOf('/* ══ 🔏 백업 봉인 시작'), b = S.indexOf('/* ══ 🔏 백업 봉인 끝'); return a > 0 && b > a ? S.slice(a, b) : null; };
const B1 = cut(S1), B2 = cut(S2);
ok(B1 && B2, '두 도우미에 🔏 백업 봉인 덩어리가 있음');
ok(B1 === B2, '로거 도우미·인쇄 도우미의 봉인 덩어리가 글자 하나 다르지 않음');
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
(async () => {
  /* ── ① 떼어 돌리기 */
  const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'rnseal-')); const BK_DIR = path.join(ROOT, 'backup'); const FS = path.join(BK_DIR, 'firestore');
  let clock = Date.parse('2026-11-18T03:00:00Z'); /* 한국 11/18 12:00 */ let free = 50; const logs = []; const ic = [];
  const fakeCp = { execFile: (cmd, args, o, cb) => { ic.push([cmd, ...args]); setImmediate(() => cb(null, '처리됨', '')); } };
  const ctx = vm.createContext({ fs, path, BK_DIR, bkName: (x) => String(x || '').replace(/[^0-9A-Za-z_\-]/g, '').slice(0, 60), bkFree: () => free, log: (...x) => logs.push(x.join(' ')), require: (m) => (m === 'child_process' ? fakeCp : require(m)), process: { platform: 'linux' }, setTimeout, setInterval, setImmediate, Promise, JSON, Date, Math, Number, String, Error, Map, Set, Buffer, console });
  vm.runInContext(B1 + '\nglobalThis.__T = { SEAL, SEAL_RE, bkWrite, bkUniq, sealSweep, sealVerify, sealStat, sealLed, sealIs };', ctx);
  const T = ctx.__T; T.SEAL.now = () => clock;
  const C = 'prd_listings', dir = path.join(FS, C), F = (n) => path.join(dir, n), led = () => { try { return fs.readFileSync(path.join(BK_DIR, '_seal', C + '.jsonl'), 'utf8').trim().split('\n').filter(Boolean).map((x) => JSON.parse(x)); } catch (e) { return []; } };
  const age = (n, h) => { const t = (clock - h * 3600e3) / 1000; fs.utimesSync(F(n), t, t); };
  const files = () => fs.readdirSync(dir).sort();

  /* 같은 이름 다시 쓰기 — 봉인 전(그날 쓰는 중)에는 덧붙이기만 */
  let w = T.bkWrite(C, '2026-11-17', 'full', [{ id: 'a', v: { price: 1000 } }, { id: 'b' }]); ok(w.file === '2026-11-17-full.jsonl' && w.n === 2, '첫 쓰기 = <날짜>-full.jsonl');
  w = T.bkWrite(C, '2026-11-17', 'full', [{ id: 'c' }]); const t1 = fs.readFileSync(F('2026-11-17-full.jsonl'), 'utf8');
  ok(w.file === '2026-11-17-full.jsonl' && t1.split('\n').filter(Boolean).length === 3 && t1.startsWith('{"id":"a","v":{"price":1000}}\n'), '같은 이름 다시 쓰기(봉인 전) = 앞 줄을 지우지 않고 뒤에 덧붙임');
  ok(T.bkWrite(C, '2026-11-17', 'inc', []).n === 0 && !fs.existsSync(F('2026-11-17-inc.jsonl')), '빈 묶음은 파일을 만들지 않음');
  let er = null; try { T.bkWrite('../..', 'x', 'full', [{}]); } catch (e) { er = e; } ok(er && er.http === 400, '칸·날짜가 이상하면 400');

  /* 봉인 — 날짜가 오늘보다 앞 + 2시간 넘게 그대로 */
  T.bkWrite(C, '2026-11-18', 'inc', [{ id: 't' }]); age('2026-11-17-full.jsonl', 1); age('2026-11-18-inc.jsonl', 5);
  await T.sealSweep(); ok(led().length === 0, '봉인 안 함: 어제 파일이라도 1시간 전에 쓴 것(아직 이어 쓸 수 있음) · 오늘 파일');
  age('2026-11-17-full.jsonl', 3); const h0 = sha(F('2026-11-17-full.jsonl'));
  await T.sealSweep(); let L = led();
  ok(L.length === 1 && L[0].file === '2026-11-17-full.jsonl' && L[0].sha256 === h0 && L[0].lines === 3 && L[0].bytes === fs.statSync(F('2026-11-17-full.jsonl')).size && L[0].col === C, '봉인: 해시 장부 backup\\_seal\\<칸>.jsonl 에 SHA-256·크기·줄 수 ' + JSON.stringify(L[0] && { f: L[0].file, l: L[0].lines }));
  ok((fs.statSync(F('2026-11-17-full.jsonl')).mode & 0o222) === 0, '봉인: 읽기 전용 속성(쓰기 권한 없음)');
  ok(!fs.existsSync(F('2026-11-18-inc.jsonl')) || (fs.statSync(F('2026-11-18-inc.jsonl')).mode & 0o200), '오늘 날짜 파일은 봉인하지 않음');

  /* 봉인 파일 쓰기 시도 → 새 이름 -2 (덮지 않음) */
  w = T.bkWrite(C, '2026-11-17', 'full', [{ id: 'a', v: { price: 1 } }]);
  ok(w.file === '2026-11-17-full-2.jsonl' && sha(F('2026-11-17-full.jsonl')) === h0, '봉인 파일에 쓰려 하면 새 이름 -2 로 — 봉인 파일 해시 그대로');
  ok(logs.some((x) => /봉인됨 — 덮지 않고 새 이름 2026-11-17-full-2\.jsonl/.test(x)) && T.sealStat().alt === 1, '새 이름으로 간 것은 로그·상태(alt)에 남음');
  w = T.bkWrite(C, '2026-11-17', 'full', [{ id: 'z' }]); ok(w.file === '2026-11-17-full-2.jsonl' && fs.readFileSync(F('2026-11-17-full-2.jsonl'), 'utf8').split('\n').filter(Boolean).length === 2, '-2 는 아직 봉인 전이라 거기에 덧붙임');
  age('2026-11-17-full-2.jsonl', 3); await T.sealSweep(); w = T.bkWrite(C, '2026-11-17', 'full', [{ id: 'y' }]); ok(w.file === '2026-11-17-full-3.jsonl' && led().length === 2, '-2 도 봉인되면 -3 (끝없이 새 이름 · 덮지 않음)');

  /* 사람이 읽기 전용을 풀어도 장부에 있으면 쓰지 않음 · 다음 돌기에 다시 걺 */
  fs.chmodSync(F('2026-11-17-full.jsonl'), 0o644); w = T.bkWrite(C, '2026-11-17', 'full', [{ id: 'x' }]);
  ok(w.file === '2026-11-17-full-3.jsonl' && sha(F('2026-11-17-full.jsonl')) === h0, '읽기 전용이 풀려도(사람 손·복사 도구) 장부에 있으면 그 파일엔 안 씀');
  await T.sealSweep(); ok((fs.statSync(F('2026-11-17-full.jsonl')).mode & 0o222) === 0 && T.sealStat().relock >= 1 && sha(F('2026-11-17-full.jsonl')) === h0, '다음 봉인 돌기에 읽기 전용을 다시 걺(내용은 그대로)');

  /* 장부에 없어도 읽기 전용(사람이 걸어 둔 것)이면 피함 */
  T.bkWrite(C, '2026-11-16', 'inc', [{ id: 'q' }]); fs.chmodSync(F('2026-11-16-inc.jsonl'), 0o444); const h16 = sha(F('2026-11-16-inc.jsonl'));
  w = T.bkWrite(C, '2026-11-16', 'inc', [{ id: 'q2' }]); ok(w.file === '2026-11-16-inc-2.jsonl' && sha(F('2026-11-16-inc.jsonl')) === h16, '읽기 전용 파일(장부 밖)도 덮지 않고 -2');

  /* 봉인 중(해시를 세는 사이) 들어온 쓰기 → 새 이름 · 봉인은 처음 내용 그대로 */
  const C2 = 'crm_orders'; const d2 = path.join(FS, C2); T.bkWrite(C2, '2026-11-17', 'inc', [{ id: 'o1' }]); { const t = (clock - 4 * 3600e3) / 1000; fs.utimesSync(path.join(d2, '2026-11-17-inc.jsonl'), t, t); }
  const h2 = sha(path.join(d2, '2026-11-17-inc.jsonl')); const pr = T.sealSweep(); const w2 = T.bkWrite(C2, '2026-11-17', 'inc', [{ id: 'o2' }]); await pr;
  const L2 = fs.readFileSync(path.join(BK_DIR, '_seal', C2 + '.jsonl'), 'utf8').trim().split('\n').map((x) => JSON.parse(x));
  ok(w2.file === '2026-11-17-inc-2.jsonl' && L2.length === 1 && L2[0].sha256 === h2 && sha(path.join(d2, '2026-11-17-inc.jsonl')) === h2, '봉인하는 사이 들어온 쓰기는 -2 로 · 봉인 해시 = 처음 내용');

  /* 날짜 넘김·시계 틀림 */
  clock = Date.parse('2026-11-19T05:00:00Z'); /* 한국 11/19 14:00 */ age('2026-11-18-inc.jsonl', 3); await T.sealSweep();
  ok(led().some((x) => x.file === '2026-11-18-inc.jsonl'), '날짜 넘김: 어제가 된 11/18 파일이 봉인됨');
  w = T.bkWrite(C, '2026-11-18', 'inc', [{ id: 'late' }]); ok(w.file === '2026-11-18-inc-2.jsonl', '날짜 넘긴 뒤 늦게 온 같은 날짜 묶음(자정 넘어 이어진 백업)도 새 이름');
  clock = Date.parse('2026-11-15T05:00:00Z'); /* 시계가 나흘 뒤로 감 */ w = T.bkWrite(C, '2026-11-17', 'full', [{ id: 'back' }]); await T.sealSweep();
  ok(w.file !== '2026-11-17-full.jsonl' && sha(F('2026-11-17-full.jsonl')) === h0 && T.SEAL.led.get(C).has('2026-11-17-full.jsonl'), '시계가 뒤로 가도 이미 봉인한 파일은 그대로 봉인(장부 기준)');
  w = T.bkWrite(C, '2026-11-25', 'inc', [{ id: 'fut' }]); age('2026-11-25-inc.jsonl', 10); await T.sealSweep(); ok(w.file === '2026-11-25-inc.jsonl' && !led().some((x) => x.file === '2026-11-25-inc.jsonl'), '앞날짜(손님 시계가 앞섬) 파일은 그날이 지나기 전엔 봉인 안 함 · 덮지도 않음');
  clock = Date.parse('2026-11-19T05:00:00Z');

  /* 해시 어긋남 알림 — 파일은 손대지 않음 */
  let v = await T.sealVerify(); ok(v.n >= 4 && v.badN === 0 && v.ok === v.n, '검증: 장부의 모든 파일 해시가 같음 ' + v.n + '개');
  ok(fs.existsSync(path.join(BK_DIR, '_seal', 'verify.jsonl')), '검증 결과는 _seal\\verify.jsonl 에 덧붙임');
  fs.chmodSync(F('2026-11-17-full.jsonl'), 0o644); fs.writeFileSync(F('2026-11-17-full.jsonl'), fs.readFileSync(F('2026-11-17-full.jsonl'), 'utf8').replace('"price":1000', '"price":9000')); /* 같은 크기로 몰래 바꿈 */
  const tam = fs.readFileSync(F('2026-11-17-full.jsonl')); fs.renameSync(F('2026-11-16-inc-2.jsonl'), path.join(ROOT, 'moved.jsonl'));
    fs.chmodSync(F('2026-11-17-full-2.jsonl'), 0o644); fs.appendFileSync(F('2026-11-17-full-2.jsonl'), '{"id":"evil"}\n');
  const n0 = files().length; v = await T.sealVerify(); const why = v.bad.map((x) => x.file + ':' + x.why).join(' | ');
  ok(v.badN === 3 && /2026-11-17-full\.jsonl:내용\(SHA-256\)이 다름/.test(why) && /2026-11-17-full-2\.jsonl:크기가 다름/.test(why) && /2026-11-16-inc-2\.jsonl:파일이 없어짐/.test(why), '검증: 몰래 바뀐 내용(같은 크기)·크기 다름·옮겨진 파일을 잡음 — ' + why);
  ok(Buffer.compare(fs.readFileSync(F('2026-11-17-full.jsonl')), tam) === 0 && files().length === n0, '검증은 어긋난 파일을 되돌리거나 지우지 않음(그대로 둠)');
  ok(logs.some((x) => /🚨🚨 백업 봉인 검증: 3개 파일이 봉인 때와 다름/.test(x)) && T.sealStat().verify.badN === 3, '어긋나면 🚨 로그 + /bk-stat seal.verify.badN (웹앱 백업 줄)');
  fs.chmodSync(F('2026-11-18-inc.jsonl'), 0o644); fs.renameSync(F('2026-11-18-inc.jsonl'), path.join(ROOT, 'gone.jsonl')); v = await T.sealVerify(); ok(v.bad.some((x) => x.file === '2026-11-18-inc.jsonl' && x.why === '파일이 없어짐'), '검증: 봉인 파일이 없어지면 「파일이 없어짐」');
  fs.renameSync(path.join(ROOT, 'gone.jsonl'), F('2026-11-18-inc.jsonl'));

  /* 디스크 부족 — 지우지 않음 */
  free = 3; const nb = files().length; w = T.bkWrite(C, '2026-11-19', 'inc', [{ id: 'l1' }]); ok(w.n === 1 && T.SEAL.low && T.SEAL.low.gb === 3 && logs.some((x) => /디스크 여유 3GB — 5GB 아래 · 아무것도 지우지 않고 계속 씀/.test(x)), '디스크 5GB 아래: 알림만 하고 계속 씀');
  free = 0.3; er = null; try { T.bkWrite(C, '2026-11-19', 'inc', [{ id: 'l2' }]); } catch (e) { er = e; } ok(er && er.http === 507 && /아무것도 지우지 않음/.test(er.message) && T.SEAL.refused === 1 && files().length === nb + 1, '디스크 0.5GB 아래: 그 쓰기만 거절(507)하고 알림 · 파일을 지우지 않음');
  free = 50; T.bkWrite(C, '2026-11-19', 'inc', [{ id: 'l3' }]); ok(T.SEAL.low === null, '디스크가 돌아오면 알림을 거둠');

  /* bkUniq — 다른 길(일지 보관함·보안 사본·거울 이력)이 쓰는 새 이름 */
  const U = path.join(ROOT, 'u.json'); ok(T.bkUniq(U) === U, 'bkUniq: 없으면 그 이름'); fs.writeFileSync(U, '1'); ok(T.bkUniq(U) === path.join(ROOT, 'u-2.json'), 'bkUniq: 있으면 -2'); fs.writeFileSync(path.join(ROOT, 'u-2.json'), '2'); ok(T.bkUniq(U) === path.join(ROOT, 'u-3.json'), 'bkUniq: -2 도 있으면 -3');
  fs.mkdirSync(path.join(ROOT, 'PC-20261117120000')); ok(T.bkUniq(path.join(ROOT, 'PC-20261117120000')) === path.join(ROOT, 'PC-20261117120000-2'), 'bkUniq: 폴더 이름(일지 보관함)도 -2');

  /* icacls(Windows) 모양 — 읽기는 건드리지 않음 */
  T.SEAL.win = true; ic.length = 0; const C3 = 'prd_books'; T.bkWrite(C3, '2026-11-18', 'full', [{ id: 'k' }]); { const t = (clock - 5 * 3600e3) / 1000; fs.utimesSync(path.join(FS, C3, '2026-11-18-full.jsonl'), t, t); }
  await T.sealSweep(); const A = ic.map((x) => x.join(' '));
  ok(A.some((x) => x === `icacls ${path.join(FS, C3, '2026-11-18-full.jsonl')} /deny *S-1-1-0:(DE,WD,AD,WA,WEA)`) && A.some((x) => x === `icacls ${path.join(FS, C3)} /deny *S-1-1-0:(DC)`), 'Windows: 파일엔 모두(S-1-1-0) 지우기·쓰기·덧붙이기·속성 바꾸기 거부 · 폴더엔 안의 파일 지우기 거부 ' + JSON.stringify(A.slice(0, 3)));
  ok(!ic.some((x) => x.some((y) => /\/grant|\/remove|\/reset|\(R\)|\(RX\)|\(F\)|\(M\)|RD|\/setowner/.test(y))), 'Windows: 읽기 권한을 막거나 주인을 바꾸는 명령은 없음(열어 보기·복사는 그대로)');
  const n1 = ic.length; await T.sealSweep(); ok(ic.length === n1, 'icacls는 파일마다 한 번(장부에 acl 표시 · 다시 안 부름) — 기존 봉인 파일 ' + A.length + '번');
  ok(fs.readFileSync(path.join(BK_DIR, '_seal', C3 + '.jsonl'), 'utf8').includes('"acl":1'), 'icacls 건 것은 장부에 {file, acl} 줄로 덧붙임');
  fs.writeFileSync(path.join(BK_DIR, '_seal', 'NO_ACL'), ''); ic.length = 0; T.bkWrite(C3, '2026-11-17', 'full', [{ id: 'k0' }]); { const t = (clock - 5 * 3600e3) / 1000; fs.utimesSync(path.join(FS, C3, '2026-11-17-full.jsonl'), t, t); } await T.sealSweep();
  ok(ic.length === 0 && T.SEAL.led.get(C3).has('2026-11-17-full.jsonl'), 'backup\\_seal\\NO_ACL 이 있으면 icacls만 쉼(읽기 전용·장부는 그대로)'); T.SEAL.win = false;
  /* (listfix1 함께 · 리드 11/17) backup\listfix\<회차>\ 복구 파일도 봉인 — 그 회차의 SHA256.txt 는 listfix 가 이어 쓰므로 잠그지 않음 */
  fs.unlinkSync(path.join(BK_DIR, '_seal', 'NO_ACL')); /* 시험 임시 폴더 안 표시 파일만 */ T.SEAL.win = true; ic.length = 0;
  { const LD = path.join(BK_DIR, 'listfix', 'r1'); fs.mkdirSync(LD, { recursive: true }); const LF = (n) => path.join(LD, n); fs.writeFileSync(LF('prd_listings.jsonl'), '{"id":"a"}\n', { flag: 'wx', mode: 0o444 }); fs.writeFileSync(LF('SHA256.txt'), 'abc  prd_listings.jsonl\n'); fs.writeFileSync(LF('x.tmp'), 'tmp');
    const t = (clock - 5 * 3600e3) / 1000; for (const n of ['prd_listings.jsonl', 'SHA256.txt', 'x.tmp']) fs.utimesSync(LF(n), t, t); const hL = sha(LF('prd_listings.jsonl'));
    await T.sealSweep(); const LL = fs.readFileSync(path.join(BK_DIR, '_seal', 'listfix~r1.jsonl'), 'utf8').trim().split('\n').map((x) => JSON.parse(x)).filter((x) => x.sha256 && x.file !== '<dir>');
    ok(LL.length === 1 && LL[0].file === 'prd_listings.jsonl' && LL[0].sha256 === hL, 'listfix 복구 파일도 봉인(장부 _seal\\listfix~<회차>.jsonl · 해시) ' + JSON.stringify(LL.map((x) => x.file)));
    ok(!LL.some((x) => x.file === 'SHA256.txt' || x.file === 'x.tmp') && (fs.statSync(LF('SHA256.txt')).mode & 0o200) && !ic.some((x) => x[1] === LF('SHA256.txt')), 'listfix SHA256.txt(이어 쓰는 지문 목록)·임시 파일은 잠그지 않음 · icacls도 안 걺');
    fs.appendFileSync(LF('SHA256.txt'), 'def  next.jsonl\n'); ok(fs.readFileSync(LF('SHA256.txt'), 'utf8').split('\n').filter(Boolean).length === 2, 'listfix SHA256.txt 는 그대로 덧붙여 쓸 수 있음');
    ok(ic.some((x) => x[1] === LF('prd_listings.jsonl') && /\(DE,WD,AD,WA,WEA\)/.test(x[3])) && ic.some((x) => x[1] === LD && /\(DC\)/.test(x[3])), 'listfix: 복구 파일엔 쓰기·지우기 거부 · 회차 폴더엔 안의 파일 지우기 거부(새 파일 만들기·SHA256.txt 덧붙이기는 됨)');
    fs.chmodSync(LF('prd_listings.jsonl'), 0o644); fs.writeFileSync(LF('prd_listings.jsonl'), '{"id":"b"}\n'); const v = await T.sealVerify();
    ok(v.bad.some((x) => x.col === 'listfix~r1' && x.file === 'prd_listings.jsonl' && /SHA-256/.test(x.why)) && fs.readFileSync(LF('prd_listings.jsonl'), 'utf8') === '{"id":"b"}\n', 'listfix 복구 파일이 바뀌면 검증이 잡음(파일은 손대지 않음)'); }
  T.SEAL.win = false;
  fs.rmSync(ROOT, { recursive: true, force: true, maxRetries: 2 }); /* 시험 임시 폴더만 */

  /* ── ② 코드에서 다른 쓰기 길이 없는지 */
  for (const [nm, S] of [['로거 도우미', S1], ['인쇄 도우미', S2]]) {
    const bkApi = S.slice(S.indexOf('function bkApi('), S.indexOf('\n', S.indexOf("if (u.pathname === '/bk-state')")));
    ok(/const w = bkWrite\(col, d, kind, L\)/.test(bkApi) && !/appendFileSync|writeFileSync\(path\.join\(dir/.test(bkApi.replace(/\/bk-state[\s\S]*$/, '')), nm + ': /bk-put 쓰기는 bkWrite 하나뿐(직접 appendFileSync 없음)');
    ok(!/-\$\{kind\}\.jsonl`\)\s*,/.test(S.replace(B1, '')) && /seal: sealStat\(\)/.test(S), nm + ': 봉인 덩어리 밖에서 백업 파일 이름으로 직접 쓰지 않음 · /bk-stat 에 seal');
    ok(!/(unlinkSync|rmSync|rmdirSync|renameSync|truncateSync|writeFileSync)\([^)]*(firestore|BK_DIR, 'firestore')/.test(S), nm + ': backup\\firestore 안을 지우기·이름 바꾸기·통째로 쓰기 하는 줄 없음');
    ok(!/bk-(del|clear|rm)/.test(S), nm + ': 지우는 HTTP 길 없음'); }
  ok(/bkUniq\(path\.join\(ROOT, 'journal-archive'/.test(S1), '일지 비우기(/jrn-clear) 보관함 이름이 이미 있으면 -2 (덮지 않음)');
  ok(/fs\.copyFileSync\(f, bkUniq\(f\.replace\(\/\\\.json\$\/, '-'/.test(S1) && /file = bkUniq\(path\.join\(dd, nm \+ '-'/.test(S1), '보안 열쇠 옛 사본·같은 날 보안 자료: 같은 초 이름도 덮지 않음');
  ok(/fs\.copyFileSync\(f, bkUniq\(h\), fs\.constants\.COPYFILE_EXCL\)/.test(S1), 'GitHub 거울: 같은 날 두 번 바뀌어도 그날 이력의 앞 판을 덮지 않음');
  ok(/sealStart\(\)/.test(S1.replace(B1, '')) && /sealStart\(\)/.test(S2.replace(B2, '')) && /SEAL\.busy = \(\) => \{ try \{ return alpsBusy\(\) \|\| shipHold\(\)/.test(S2), '두 도우미가 봉인을 시작함 · 인쇄 도우미는 출고·ALPS 처리 중엔 쉼');

  /* ── ③ 인쇄 도우미를 띄워 HTTP로 */
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'rnsealp-')); fs.copyFileSync(PRINT, path.join(D, 'readnow-print.js')); const BR = path.join(D, 'root'); const pdir = path.join(BR, 'backup', 'firestore', 'prd_books'); fs.mkdirSync(pdir, { recursive: true }); fs.mkdirSync(path.join(BR, 'backup', '_seal'));
  fs.writeFileSync(path.join(pdir, '2026-11-06-full.jsonl'), '{"id":"b1"}\n'); const ph = sha(path.join(pdir, '2026-11-06-full.jsonl'));
  fs.writeFileSync(path.join(BR, 'backup', '_seal', 'prd_books.jsonl'), JSON.stringify({ file: '2026-11-06-full.jsonl', col: 'prd_books', sha256: ph, bytes: 12, lines: 1, at: '2026-11-07 03:00:00' }) + '\n');
  const ch = cp.spawn(process.execPath, ['readnow-print.js'], { cwd: D, env: { ...process.env, RN_BK_ROOT: BR, RN_PRINT_NOUPDATE: '1', RN_SEAL_OFF: '1' }, stdio: 'ignore' });
  const raw = (m, p, body) => new Promise((res) => { const r = http.request({ host: '127.0.0.1', port: 8898, path: p, method: m, headers: { 'X-RN-Bk': '1', 'Content-Type': 'application/json' } }, (x) => { let b = ''; x.on('data', (c) => (b += c)); x.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} res({ st: x.statusCode, j }); }); }); r.on('error', () => res({ st: 0 })); if (body) r.write(body); r.end(); });
  try { let up = null; for (let i = 0; i < 60 && !(up && up.j && /print 1\.2\.(\d+)/.test(up.j.helper || '') && up.j.seal); i++) { await new Promise((r) => setTimeout(r, 200)); up = await raw('GET', '/bk-stat'); } /* 다른 시험이 8898을 쓰고 있으면 기다림 */
    ok(up && up.j && up.j.seal, '인쇄 도우미(이 판)가 켜짐 ' + (up && up.j && up.j.helper));
    const p = await raw('POST', '/bk-put?col=prd_books&kind=full&day=2026-11-06', JSON.stringify({ lines: [{ id: 'b1', v: { title: '바뀐 값' } }] }));
    ok(p.st === 200 && p.j && p.j.file === '2026-11-06-full-2.jsonl' && sha(path.join(pdir, '2026-11-06-full.jsonl')) === ph, '인쇄 도우미 HTTP /bk-put: 장부에 봉인된 이름은 피해 -2 로 씀 · 봉인 파일 그대로 ' + JSON.stringify(p.j));
    const s = await raw('GET', '/bk-stat'); ok(s.j && s.j.seal && s.j.seal.alt === 1 && s.j.seal.n >= 1, '인쇄 도우미 /bk-stat 에 seal(봉인 수·새 이름 수) ' + JSON.stringify(s.j && s.j.seal && { n: s.j.seal.n, alt: s.j.seal.alt }));
  } finally { ch.kill(); fs.rmSync(D, { recursive: true, force: true, maxRetries: 2 }); }

  /* ── ④ 수집기·웹앱 */
  if (COLS) { const SC = fs.readFileSync(COLS, 'utf8');
    ok(!/freeGB < 5\) \{ BKX\.err = [^;]*; bkRep\(true\); return; \}/.test(SC), '수집기: 디스크 5GB 아래라고 백업을 통째로 건너뛰지 않음(알림만 · 「모든 걸 무조건 백업」)');
    ok(/const BK_SKIP = new Set\(\['app_secrets'\]\)/.test(SC), '수집기: 빼는 칸은 app_secrets 하나(🔐 보안 자료 매일 보관이 따로) — 사진 칸 ppt_photo_data 도 Firestore 백업에 넣음');
    ok(/seal: S\d?\.seal|seal: \(S\d?\s*&&\s*S\d?\.seal\)|seal: st\.seal|seal:/.test(SC.slice(SC.indexOf('bkAutoRep'), SC.indexOf('bkAutoRep') + 6000)), '수집기: 도우미 봉인 상태(seal)를 웹앱 백업 줄(backup_auto)에 실음'); }
  if (APP) { const SA = fs.readFileSync(APP, 'utf8'); ok(/🔏 봉인/.test(SA) && /seal\.verify/.test(SA), '웹앱 ⑪ 백업: 🔏 봉인 줄(봉인 수·검증·어긋남 크게)'); }
  console.log(bad ? `\n❌ ${bad}개 틀림` : '\n✅ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('  ❌ 시험 오류', e && e.stack); process.exit(1); });
