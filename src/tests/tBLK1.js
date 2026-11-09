// tBLK1 — 정범님 11/09 '추적 차단을 우리 기기 전체에 설치하도록 · 최대한 우리 손이 안 가거나 최소로' (blk1)
//  ① 모듈(local/readnow-blk.js): 가짜 hosts — 넣기 · 이미 있음(남이 넣은 줄 포함) · 되돌리기(지우지 않고 # · 다시 넣으면 그 줄을 살림) · 다른 줄 그대로 · CRLF 그대로
//  ② 명령 길(node readnow-blk.js apply|undo <hosts> <결과>) · 사본(hosts.readnow-bak-…) · 관리자 아님(EPERM) → perm
//  ③ 가짜 레지스트리(ⓑ uBlock Origin Lite 크롬 정책): 넣기 · 이미 있음 · 빼기(blk-undo.json에 적어 둠) · 권한 없음
//  ④ 인쇄 도우미(local/readnow-print.js · 가짜 powershell = 관리자 허락 창): /blk/status · 저절로 넣기(관리자 아님 → '관리자 권한 필요') · /blk/install(허락 '예' → 됨 · '아니요' → 안 됨)
//     · /blk/undo → off(저절로 다시 넣지 않음) · 🚚 출고 중엔 미룸 · 수집기 출처(chrome-extension)는 상태만 · 알라딘 같은 다른 출처는 거절
//  ⑤ 수집기 PC 신호(pcBeat.blk) · 웹앱 한 줄·단추 · 머리 안 바꿈(원본 글 확인)
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), http = require('http');
const pick = (...L) => L.find((f) => f && fs.existsSync(f));
const LOC = pick(path.join(__dirname, '..', '..', 'local'), path.join(__dirname, '..', 'local'), '/home/user/readnow-scripts/local');
const MOD = path.join(LOC, 'readnow-blk.js'), HELP = path.join(LOC, 'readnow-print.js');
const COL = pick(path.join(__dirname, '..', 'readnow-collector.src.js'), path.join(__dirname, '..', 'readnow-collector.user.js'));
const APP = pick(path.join(__dirname, '..', 'app.html'));
let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const B = require(MOD);
const PORT = 8898;
const req = (m, p, body, hd) => new Promise((res) => { const r = http.request({ host: '127.0.0.1', port: PORT, path: p, method: m, headers: { 'X-RN-Print': '1', 'Content-Type': 'application/json', ...(hd || {}) } }, (x) => { let b = ''; x.on('data', (c) => (b += c)); x.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} res({ st: x.statusCode, j, b }); }); }); r.on('error', (e) => res({ st: 0, err: e.message })); if (body) r.write(JSON.stringify(body)); r.end(); });

(async () => {
  // ── ① 모듈 ──
  const BASE = '# Copyright (c) Microsoft Corp.\r\n#\r\n127.0.0.1 localhost\r\n0.0.0.0 aladin.co.kr # ReadNow-Lock\r\n192.168.0.5 printer.local\r\n';
  { const s0 = B.status(BASE); ok(!s0.on && s0.n === 0 && s0.total === 29 && s0.miss.length === 29, '① 처음: clarity 주소 29개 모두 빠짐');
    ok(B.HOSTS.includes('scripts.clarity.ms') && B.HOSTS.includes('www.clarity.ms') && B.HOSTS.includes('c.clarity.ms') && B.HOSTS.every((h) => /(^|\.)clarity\.ms$/.test(h)), '① 막는 주소는 clarity.ms뿐(다른 사이트 영향 0)');
    const a = B.apply(BASE); ok(a.changed && a.added === 29 && B.status(a.text).on, '① 넣기 → 29개 막힘');
    ok(a.text.startsWith(BASE.trimEnd()) && a.text.includes('0.0.0.0 aladin.co.kr # ReadNow-Lock') && a.text.includes('192.168.0.5 printer.local'), '① 다른 줄(로거 표시·프린터)은 한 글자도 안 바뀜');
    ok(/\r\n/.test(a.text) && !/[^\r]\n/.test(a.text), '① 윈도우 줄바꿈(CRLF) 그대로');
    ok(a.text.split(/\r\n/).filter((l) => l.includes(B.MARK)).length === 30 && a.text.includes('0.0.0.0 scripts.clarity.ms # readnow-blk'), "① 우리 줄마다 '# readnow-blk' 표시(머리 설명 한 줄 + 29줄)");
    const a2 = B.apply(a.text); ok(!a2.changed && a2.text === a.text, '① 이미 있으면 그대로(두 번 넣지 않음)');
    // 남이 넣은 줄이 있으면 그 주소는 건너뜀
    const foreign = BASE + '0.0.0.0 scripts.clarity.ms www.clarity.ms\r\n127.0.0.1 clarity.ms\r\n'; const f1 = B.apply(foreign); ok(f1.added === 26 && B.status(f1.text).on && (f1.text.match(/scripts\.clarity\.ms/g) || []).length === 1, '① 다른 프로그램이 이미 막은 주소(0.0.0.0·127.0.0.1)는 다시 넣지 않음 — 26개만 더함');
    ok(!B.status(BASE + '# 0.0.0.0 scripts.clarity.ms\r\n1.2.3.4 www.clarity.ms\r\n').n, '① 주석 줄·다른 IP로 가리키는 줄은 막힘으로 치지 않음');
    // 되돌리기
    const u = B.undo(a.text); ok(u.changed && u.n === 29 && B.status(u.text).n === 0 && B.status(u.text).off === 29, '① 되돌리기 → 우리 줄 29개를 # 로 꺼 둠');
    ok(u.text.split(/\r\n/).length === a.text.split(/\r\n/).length && u.text.includes('# 0.0.0.0 scripts.clarity.ms ' + B.OFF), '① 되돌리기는 줄을 지우지 않음(줄 수 같음 · # readnow-blk-off)');
    const uf = B.undo(f1.text); ok(B.status(uf.text).n === 3, '① 되돌리기는 우리 줄만 — 남이 넣은 줄 3개는 그대로 막힘');
    const r2 = B.apply(u.text); ok(r2.revived === 29 && r2.added === 0 && B.status(r2.text).on && r2.text.split(/\r\n/).length === a.text.split(/\r\n/).length, '① 다시 넣기 → 꺼 둔 줄을 살림(새 줄을 더하지 않음)');
    const lf = B.apply('127.0.0.1 localhost\n'); ok(!/\r/.test(lf.text) && B.status(lf.text).on, '① LF 파일은 LF 그대로');
    ok(B.apply('').text.includes('\r\n') && B.status(B.apply('').text).on, '① 빈 hosts에도 넣음'); }

  // ── ② 명령 길 ──
  const T = fs.mkdtempSync(path.join(os.tmpdir(), 'tblk1_'));
  { const H = path.join(T, 'hosts'); fs.writeFileSync(H, BASE); const out = path.join(T, 'r.json');
    let x = cp.spawnSync(process.execPath, [MOD, 'apply', H, out]); let r = JSON.parse(fs.readFileSync(out, 'utf8'));
    ok(x.status === 0 && r.ok && r.added === 29 && B.status(fs.readFileSync(H, 'utf8')).on, '② node readnow-blk.js apply → 됨(종료 0)');
    ok(fs.readdirSync(T).some((f) => /^hosts\.readnow-bak-\d{8}-\d{6}$/.test(f)) && fs.readFileSync(path.join(T, fs.readdirSync(T).find((f) => f.startsWith('hosts.readnow-bak-'))), 'utf8') === BASE, '② 바꾸기 전 hosts 사본(hosts.readnow-bak-날짜)');
    const nb = fs.readdirSync(T).length; x = cp.spawnSync(process.execPath, [MOD, 'apply', H, out]); r = JSON.parse(fs.readFileSync(out, 'utf8')); ok(x.status === 0 && r.ok && r.same && fs.readdirSync(T).length === nb, '② 이미 있음 → 바꾸지 않음(사본도 안 만듦)');
    x = cp.spawnSync(process.execPath, [MOD, 'undo', H, out]); r = JSON.parse(fs.readFileSync(out, 'utf8')); ok(x.status === 0 && r.ok && r.undone === 29 && B.status(fs.readFileSync(H, 'utf8')).off === 29, '② undo → 꺼 둠');
    const H2 = path.join(T, 'hosts2'); fs.writeFileSync(H2, BASE); x = cp.spawnSync(process.execPath, [MOD, 'apply', H2, out], { env: { ...process.env, RN_BLK_FAKE_RO: '1' } }); r = JSON.parse(fs.readFileSync(out, 'utf8'));
    ok(x.status === 2 && !r.ok && r.perm && /관리자 권한 필요/.test(r.why) && fs.readFileSync(H2, 'utf8') === BASE, "② 관리자 아님 → '관리자 권한 필요'(perm) · hosts 그대로");
    r = B.writeHosts('apply', path.join(T, 'none')); ok(!r.ok && /못 읽음/.test(r.why), '② hosts가 없으면 못 읽음'); }

  // ── ③ 가짜 레지스트리(ⓑ) ──
  { const RG = path.join(T, 'reg.json'); const env = { ...process.env, RN_BLK_REG: RG }; const out = path.join(T, 'u.json'); const K = B.FORCE_KEY;
    fs.writeFileSync(RG, JSON.stringify({ [K]: { 1: 'aaaabbbbccccddddeeeeffffgggghhhh;https://clients2.google.com/service/update2/crx', 3: 'x' } }));
    ok(B.forcePlan({ 1: 'a', 3: 'b' }).add === '4' && B.forcePlan({}).add === '1' && B.forcePlan({ 2: B.UBOL_ENTRY }).have, '③ 넣을 이름 = 가장 큰 번호 + 1 · 이미 있으면 안 넣음');
    let x = cp.spawnSync(process.execPath, [MOD, 'ubol', '-', out], { env }); let r = JSON.parse(fs.readFileSync(out, 'utf8')); let J = JSON.parse(fs.readFileSync(RG, 'utf8'))[K];
    ok(x.status === 0 && r.ok && J['4'] === B.UBOL_ENTRY && J['1'] && J['3'] === 'x', '③ uBlock Origin Lite 정책 넣음(4번) · 다른 확장 정책 그대로');
    ok(B.UBOL_ID === 'ddkjiahejlhfcafbddmgiahcphecmpfh' && B.UBOL_ENTRY.endsWith(';https://clients2.google.com/service/update2/crx'), '③ 크롬 웹스토어 uBlock Origin Lite id(MV3)');
    x = cp.spawnSync(process.execPath, [MOD, 'ubol', '-', out], { env }); r = JSON.parse(fs.readFileSync(out, 'utf8')); ok(r.ok && r.same && Object.keys(JSON.parse(fs.readFileSync(RG, 'utf8'))[K]).length === 3, '③ 이미 있음 → 그대로');
    x = cp.spawnSync(process.execPath, [MOD, 'ubol-undo', '-', out], { env }); r = JSON.parse(fs.readFileSync(out, 'utf8')); J = JSON.parse(fs.readFileSync(RG, 'utf8'))[K]; const L = JSON.parse(fs.readFileSync(path.join(T, 'blk-undo.json'), 'utf8'));
    ok(r.ok && r.removed === 1 && !J['4'] && J['3'] === 'x' && L.length === 1 && L[0].val === B.UBOL_ENTRY && L[0].name === '4', '③ 빼기 → 우리 값만 빼고 뺀 값은 blk-undo.json에 적어 둠');
    fs.writeFileSync(RG, JSON.stringify({ __ro: 1, [K]: {} })); x = cp.spawnSync(process.execPath, [MOD, 'ubol', '-', out], { env }); r = JSON.parse(fs.readFileSync(out, 'utf8')); ok(x.status === 2 && !r.ok && r.perm, '③ 권한 없음 → perm'); }

  // ── ④ 인쇄 도우미 ──
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'tblk1h_')); fs.mkdirSync(D + '/bin'); fs.copyFileSync(HELP, D + '/readnow-print.js'); fs.copyFileSync(MOD, D + '/readnow-blk.js'); fs.copyFileSync(path.join(LOC, 'readnow-work.js'), D + '/readnow-work.js');
  const HO = path.join(D, 'hosts'); fs.writeFileSync(HO, BASE);
  /* 가짜 powershell — '-Verb RunAs'(관리자 허락 창) → state.json의 uac가 'no'면 취소, 아니면 관리자로(RN_BLK_FAKE_ELEV) node 실행 */
  fs.writeFileSync(D + '/bin/powershell.exe', `#!/usr/bin/env node
const fs=require('fs'),cp=require('child_process'); const f=process.argv[process.argv.indexOf('-File')+1]; const s=fs.readFileSync(f,'utf8'); const st=__dirname+'/state.json'; let S={uac:'yes',n:0}; try{S=JSON.parse(fs.readFileSync(st,'utf8'))}catch(e){}
if(/-Verb RunAs/.test(s)){ S.n++; fs.writeFileSync(st,JSON.stringify(S)); if(S.uac==='no'){ console.error('작업이 사용자에 의해 취소되었습니다. (canceled)'); process.exit(1); }
  const exe=(s.match(/-FilePath '([^']+)'/)||[])[1]; const al=(s.match(/-ArgumentList @\\((.*)\\)/)||[])[1]; const args=[...al.matchAll(/'((?:[^']|'')*)'/g)].map(m=>m[1].replace(/''/g,"'").replace(/^"|"$/g,''));
  const r=cp.spawnSync(exe,args,{env:{...process.env,RN_BLK_FAKE_ELEV:'1'}}); console.log('OK|'+r.status); process.exit(0); }
console.log('?');`); fs.chmodSync(D + '/bin/powershell.exe', 0o755);
  const stS = (o) => fs.writeFileSync(D + '/bin/state.json', JSON.stringify({ uac: 'yes', n: 0, ...o })); const stG = () => JSON.parse(fs.readFileSync(D + '/bin/state.json', 'utf8')); stS({});
  const env = { ...process.env, PATH: D + '/bin:' + process.env.PATH, RN_PRINT_NOUPDATE: '1', RN_BLK_HOSTS: HO, RN_BLK_FAKE_RO: '1', RN_BLK_AUTO_MS: '800', RN_BK_DDRIVE: D + '/noD', RN_BK_CDRIVE: D };
  let ch = cp.spawn('node', ['readnow-print.js'], { cwd: D, env }); await wait(2500);
  try {
    let s = await req('GET', '/blk/status'); ok(s.j && s.j.ok && s.j.mod && !s.j.on && s.j.total === 29, '④ /blk/status — 모듈 있음 · 아직 안 됨');
    ok(/관리자 권한 필요/.test(s.j.why) && fs.readFileSync(HO, 'utf8') === BASE && stG().n === 0, "④ 저절로 넣기: 관리자 아님 → '관리자 권한 필요'로 끝 · 허락 창은 저절로 띄우지 않음 · hosts 그대로");
    const ce = await req('GET', '/blk/status', null, { Origin: 'chrome-extension://abcdefgh' }); ok(ce.st === 200 && ce.j && ce.j.ok && ce.j.total === 29, '④ 이 PC 수집기(chrome-extension 출처)도 상태를 읽음');
    const ce2 = await req('POST', '/blk/install', {}, { Origin: 'chrome-extension://abcdefgh' }); ok(ce2.st === 403 && stG().n === 0, '④ 수집기 출처는 넣기 못 함(상태만)');
    const al = await req('POST', '/blk/install', {}, { Origin: 'https://www.aladin.co.kr' }); ok(al.st === 403, '④ 다른 사이트(알라딘 등) 출처는 거절');
    stS({ uac: 'no' }); let r = await req('POST', '/blk/install', {}); ok(r.j && !r.j.ok && /허락 창에서 \[예\]/.test(r.j.why) && fs.readFileSync(HO, 'utf8') === BASE, "④ 허락 창에서 '아니요' → 안 됨 · hosts 그대로");
    stS({ uac: 'yes' }); r = await req('POST', '/blk/install', {}); const t1 = fs.readFileSync(HO, 'utf8');
    ok(r.j && r.j.ok && r.j.added === 29 && r.j.status.on && B.status(t1).on && stG().n === 1, "④ 단추 → 허락 창 '예' 한 번 → 29개 막힘");
    ok(JSON.parse(fs.readFileSync(D + '/blk-cfg.json', 'utf8')).via === 'uac', '④ blk-cfg.json에 넣은 길(uac) 적음');
    r = await req('POST', '/blk/install', {}); ok(r.j && r.j.ok && r.j.same && stG().n === 1 && fs.readFileSync(HO, 'utf8') === t1, '④ 이미 있으면 그대로(바꾸지 않음 · 허락 창도 안 띄움)');
    r = await req('POST', '/blk/undo', {}); s = await req('GET', '/blk/status'); ok(r.j && r.j.ok && !s.j.on && s.j.off && /되돌려 둠/.test(s.j.why) && B.status(fs.readFileSync(HO, 'utf8')).off === 29, '④ 되돌리기 → 꺼 둠(지우지 않음) · 상태 off');
    // 사라짐(Windows 보안 등) 알아챔
    fs.writeFileSync(D + '/blk-cfg.json', JSON.stringify({ okAt: '2026-11-09T01:00:00Z' })); fs.writeFileSync(HO, BASE); s = await req('GET', '/blk/status'); ok(!s.j.on && /사라짐/.test(s.j.why) && /uBlock Origin Lite/.test(s.j.why), "④ 넣었는데 사라지면 '사라짐 — 대신 uBlock Origin Lite 길'");
    // 🚚 출고 중엔 미룸
    const lead = await new Promise((res) => { const b = JSON.stringify({ tab: 't1', ship: { on: true, until: Date.now() + 3600e3, why: '▶ 오늘 출고 끝까지' } }); const q = http.request({ host: '127.0.0.1', port: PORT, path: '/work/lead', method: 'POST', headers: { 'X-RN-Work': '1', 'Content-Type': 'application/json', Origin: 'chrome-extension://abcdefgh' } }, (x) => { let t = ''; x.on('data', (c) => (t += c)); x.on('end', () => res(x.statusCode)); }); q.on('error', () => res(0)); q.write(b); q.end(); });
    s = await req('GET', '/blk/status');
    if (s.j && s.j.ship) { r = await req('POST', '/blk/install', {}); ok(r.j && !r.j.ok && r.j.ship && /출고 중/.test(r.j.why) && fs.readFileSync(HO, 'utf8') === BASE, '④ 🚚 출고 중 → 넣기 미룸(약속 0-1) · hosts 그대로'); }
    else ok(false, '④ 출고 중 흉내를 못 함(/work/lead ' + lead + ' · 작업 창 모듈 없음?)');
  } finally { ch.kill(); }
  // 저절로 넣기 — 도우미가 관리자로 도는 PC(또는 hosts를 쓸 수 있는 PC) → 사람 손 0
  { fs.writeFileSync(HO, BASE); try { fs.unlinkSync(D + '/blk-cfg.json'); } catch (e) {} stS({}); await wait(500);
    ch = cp.spawn('node', ['readnow-print.js'], { cwd: D, env: { ...env, RN_BLK_FAKE_ELEV: '1' } }); await wait(3000);
    try { const s = await req('GET', '/blk/status'); ok(s.j && s.j.on && B.status(fs.readFileSync(HO, 'utf8')).on && stG().n === 0 && JSON.parse(fs.readFileSync(D + '/blk-cfg.json', 'utf8')).via === 'auto', '④ 관리자로 도는 도우미 → 시작 뒤 저절로 넣음(허락 창 없음 · 사람 손 0)'); } finally { ch.kill(); } }
  // 되돌려 둔 PC는 저절로 다시 넣지 않음
  { fs.writeFileSync(HO, BASE); fs.writeFileSync(D + '/blk-cfg.json', JSON.stringify({ off: true, offAt: '2026-11-09T02:00:00Z' })); await wait(500);
    ch = cp.spawn('node', ['readnow-print.js'], { cwd: D, env: { ...env, RN_BLK_FAKE_ELEV: '1' } }); await wait(3000);
    try { ok(fs.readFileSync(HO, 'utf8') === BASE, '④ 되돌려 둔 PC는 저절로 다시 넣지 않음'); } finally { ch.kill(); } }

  // ── ⑤ 수집기·웹앱 ──
  { const c = fs.readFileSync(COL, 'utf8'); ok(/function blkRead\(\)/.test(c) && /\.\.\.\(BLKST \|\| globalThis\.__rnClarityGuard \? \{ blk: \{ \.\.\.\(BLKST \|\| \{\}\)/.test(c) && /if \(PUBONLY \|\| Date\.now\(\) - BLKAT < 30 \* 60e3\) return/.test(c), '⑤ 수집기: 30분마다 상태를 읽어 PC 신호 pcBeat.blk에 실음 · 공개 전용 PC(로거)는 안 읽음');
    const head = c.slice(0, c.indexOf('==/UserScript==')); ok(!/blk/i.test(head), '⑤ 수집기 머리(==UserScript==)는 안 바뀜');
    const a = fs.readFileSync(APP, 'utf8'); ok(/function blkBeatTxt\(k\)/.test(a) && /blkBeatTxt\(b\.blk\)/.test(a) && /🛡 추적 차단: 됨/.test(a) && /🛡 추적 차단: 안 됨/.test(a), "⑤ 웹앱 기기 운영 보고: PC마다 '🛡 추적 차단: 됨/안 됨(까닭)'");
    ok(/data-blk="install"/.test(a) && /data-blk="undo"/.test(a) && /관리자 허락 창 「예」 한 번/.test(a) && !/confirm\(Q/.test(a), "⑤ 웹앱: '이 PC에 추적 차단 넣기' 단추 · 되돌리기 · 묻기는 ask()(브라우저 팝업 아님)");
    ok(/휴대폰은 자동 설치 길이 없어 하지 않음/.test(a), '⑤ 휴대폰은 하지 않는다는 안내'); }
  fs.rmSync(T, { recursive: true, force: true }); fs.rmSync(D, { recursive: true, force: true });
  console.log(bad ? `\n❌ ${bad}개 실패` : '\n✓ tBLK1 모두 통과'); process.exit(bad ? 1 : 0);
})();
