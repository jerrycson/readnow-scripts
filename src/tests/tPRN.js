/* tPRN — 정범님 11/05 'MJ-MAIN 일반 프린터로 출력이 안 돼' · '일반 삼성·라벨·송장 3개 — 기본은 일반, 매우 쉽게 고르기' · '송장·라벨을 뽑을 때는 자동으로 그 프린터로 → 다시 자동으로 일반'
 *  ① 도우미(local/readnow-print.js · 가짜 powershell): 역할 저장 · 라벨 인쇄 동안 기본 = 라벨 → 끝나면 일반 · /prn/temp 시작·끝 · /printer 화면은 주소창에서만 · 바꾼 적 없으면 기본을 건드리지 않음
 *  ② 웹앱: ⚙ 라벨 인쇄 설정 › 🖨 이 PC 프린터 3개(고르기 3칸·⭐ 기본으로·🔁 자동·🔎 점검) · 일반 고르면 역할 저장 + 기본 바꿈 · 🔎 점검 창(문제 줄·표·시험 한 장) + 서버 저장 · 인쇄 창 라벨 = 잠깐 라벨 → 창 닫으면 끝
 * 실행: cd pw && RN_PORT=<포트> node tPRN.js */
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process'), http = require('http');
const HELP = [path.join(__dirname, '../local/readnow-print.js'), path.join(__dirname, '../../local/readnow-print.js'), '/home/user/readnow-scripts/local/readnow-print.js'].find((p) => fs.existsSync(p));
const req = (m, p, body, hd) => new Promise((res) => { const r = http.request({ host: '127.0.0.1', port: 8898, path: p, method: m, headers: { 'X-RN-Print': '1', 'Content-Type': 'application/json', ...(hd || {}) } }, (x) => { let b = ''; x.on('data', (c) => (b += c)); x.on('end', () => { let j = null; try { j = JSON.parse(b); } catch (e) {} res({ st: x.statusCode, j, b }); }); }); r.on('error', (e) => res({ st: 0, err: e.message })); if (body) r.write(JSON.stringify(body)); r.end(); });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  /* ① 도우미 */
  const D = fs.mkdtempSync(path.join(os.tmpdir(), 'tprn_')); fs.mkdirSync(D + '/bin'); fs.copyFileSync(HELP, D + '/readnow-print.js'); const AL = path.join(path.dirname(HELP), 'readnow-alps.js'); if (fs.existsSync(AL)) fs.copyFileSync(AL, D + '/readnow-alps.js');
  fs.writeFileSync(D + '/bin/powershell.exe', `#!/usr/bin/env node
const fs=require('fs'); const f=process.argv[process.argv.indexOf('-File')+1]; const s=fs.readFileSync(f,'utf8'); const st=__dirname+'/state.json'; let S={def:'Samsung',calls:[]}; try{S=JSON.parse(fs.readFileSync(st,'utf8'))}catch(e){}
const P=['Samsung','라벨기','롯데택배'];
{ const m0=s.match(/\\$_.Name -eq '([^']+)'/); if(m0&&/NOPRINTER/.test(s)&&!P.includes(m0[1])){ console.error('NOPRINTER'); process.exit(3); } }
if(/DEVPKEY_PNPX_IpAddress/.test(s)){ console.log(JSON.stringify({port:S.port||'WSD-abc',ips:['192.168.0.9'],alive:S.dead?[]:['192.168.0.9']})); process.exit(0); }
if(/-Verb RunAs/.test(s)){ const b=s.match(/'-EncodedCommand','([^']+)'/); const el=Buffer.from(b[1],'base64').toString('utf16le'); S.el=el; S.port=(el.match(/-PortName '([^']+)'/)||[])[1]; fs.writeFileSync(st,JSON.stringify(S)); console.log('OK|0'); process.exit(0); }
if(/\\(Get-Printer -Name [^\\n]*\\)\\.PortName/.test(s)){ console.log(S.port||'WSD-abc'); process.exit(0); }
if(/SetDefaultPrinter/.test(s)){ const m=s.match(/\\$_.Name -eq '([^']+)'/); S.def=m[1]; S.calls.push('def:'+m[1]+(/LegacyDefaultPrinterMode -Value 1/.test(s)?'+keep':'')); fs.writeFileSync(st,JSON.stringify(S)); console.log('OK|0|'+S.def); }
else if(/PrintDocument/.test(s)){ S.calls.push('print@'+S.def); fs.writeFileSync(st,JSON.stringify(S)); console.log(/시험 인쇄/.test(s)?'OK':'OK 1'); }
else if(/Get-Service Spooler/.test(s)) console.log(JSON.stringify({printers:P.map(n=>({name:n,def:n===S.def,off:false,st:3,err:0,jobs:n==='롯데택배'?[{st:'Error',stc:2,pages:1}]:[]})),spooler:{st:'Running'},legacyDefault:0,events:[],procs:[]}));
else if(/def = \\[bool\\]/.test(s)) console.log(JSON.stringify(P.map(n=>({name:n,def:n===S.def,off:false}))));
else console.log('?');`); fs.chmodSync(D + '/bin/powershell.exe', 0o755);
  const st = () => { try { return JSON.parse(fs.readFileSync(D + '/bin/state.json', 'utf8')); } catch (e) { return { def: 'Samsung', calls: [] }; } };
  const ch = cp.spawn('node', ['readnow-print.js'], { cwd: D, env: { ...process.env, PATH: D + '/bin:' + process.env.PATH } }); await wait(1500);
  try {
    const s0 = await req('GET', '/status'); ok(s0.j && s0.j.ver === '1.2.0', '도우미 1.2.0 켜짐 ' + (s0.j && s0.j.ver));
    const r0 = await req('GET', '/prn/roles'); ok(r0.j && r0.j.ok && r0.j.roles.auto === true && !r0.j.roles.general, '역할 처음 = 비어 있음 · 자동 켬');
    /* 역할 없으면 라벨 인쇄는 기본을 건드리지 않음 */
    const IMG = 'data:image/png;base64,' + Buffer.from('x').toString('base64');
    await req('POST', '/print', { printer: '라벨기', imgs: [IMG] }); await wait(2000); ok(st().calls.join() === 'print@Samsung', '역할 안 정했으면 기본을 안 바꾸고 이름으로만 인쇄 ' + st().calls.join());
    const r1 = await req('POST', '/prn/roles', { general: 'Samsung', label: '라벨기', invoice: '롯데택배' }); ok(r1.j && r1.j.roles.general === 'Samsung' && r1.j.roles.invoice === '롯데택배', '역할 저장');
    fs.writeFileSync(D + '/bin/state.json', JSON.stringify({ def: 'Samsung', calls: [] }));
    const p1 = await req('POST', '/print', { printer: '라벨기', imgs: [IMG] }); await wait(2500); ok(p1.j && p1.j.ok, '라벨 인쇄 됨');
    ok(st().calls.join() === 'def:라벨기+keep,print@라벨기,def:Samsung+keep', '라벨 인쇄 동안만 기본 = 라벨 → 끝나면 일반 · 기본 관리 끔 ' + st().calls.join()); ok(st().def === 'Samsung', '끝나고 기본 = 일반');
    ok(!JSON.parse(fs.readFileSync(D + '/prn-roles.json', 'utf8')).temp, '되돌린 뒤 잠깐 바꿈 기록 지움');
    fs.writeFileSync(D + '/bin/state.json', JSON.stringify({ def: 'Samsung', calls: [] }));
    const t1 = await req('POST', '/prn/temp', { role: 'label', sec: 60 }); ok(t1.j && t1.j.want === 'label' && st().def === '라벨기', '/prn/temp 시작 → 기본 = 라벨');
    ok(JSON.parse(fs.readFileSync(D + '/prn-roles.json', 'utf8')).temp, '잠깐 바꿈을 파일에 적음(꺼졌다 켜져도 되돌리게)');
    const t2 = await req('POST', '/prn/temp', { end: 1 }); ok(t2.j && t2.j.want === 'general' && st().def === 'Samsung', '/prn/temp 끝 → 일반');
    const d1 = await req('POST', '/prn/default', { printer: '롯데택배', keep: true }); ok(d1.j && d1.j.ok && st().def === '롯데택배', '⭐ 기본으로(손으로) 됨');
    await req('POST', '/print', { printer: '라벨기', imgs: [IMG] }); await wait(2500); ok(st().def === 'Samsung', '손으로 바꾼 뒤 라벨 인쇄 → 끝나면 일반(역할 일반)으로');
    const d2 = await req('POST', '/prn/default', { printer: '없는것' }); ok(d2.j && !d2.j.ok && /없음/.test(d2.j.err), '없는 프린터 → 까닭');
    const pg = await req('GET', '/printer', null, { 'X-RN-Print': '' }); ok(pg.st === 200 && /이 PC 기본 프린터/.test(pg.b), '/printer 화면(주소창)');
    const pg2 = await req('GET', '/printer', null, { Origin: 'https://jerrycson.github.io' }); ok(pg2.st === 403, '/printer는 웹앱에서 못 엶');
    const dg = await req('GET', '/pdiag'); ok(dg.j && dg.j.ok && dg.j.hints.some((h) => /기본 프린터 관리/.test(h.t)) && dg.j.hints.some((h) => /롯데택배.*오류·멈춘 작업 1개/.test(h.t)), '🔎 점검 → 문제 줄(기본 관리 켜짐·대기열 오류) ' + JSON.stringify(dg.j && dg.j.hints));
    const tt = await req('POST', '/pdiag/test', { printer: 'Samsung' }); ok(tt.j && tt.j.ok, '🧪 시험 한 장');
    { fs.writeFileSync(D + '/bin/state.json', JSON.stringify({ def: 'Samsung', calls: [], dead: true })); const n1 = await req('POST', '/prn/netfix', { printer: 'Samsung' }); ok(n1.j && n1.j.ok === false && n1.j.step === 'ping' && /응답하지 않음/.test(n1.j.why), '🩺 프린터가 응답하지 않으면 바꾸지 않고 까닭 ' + JSON.stringify(n1.j));
      fs.writeFileSync(D + '/bin/state.json', JSON.stringify({ def: 'Samsung', calls: [] })); const n2 = await req('POST', '/prn/netfix', { printer: 'Samsung' }); const S2 = st(); ok(n2.j && n2.j.ok && n2.j.to === 'IP_192.168.0.9' && /Add-PrinterPort -Name 'IP_192.168.0.9' -PrinterHostAddress '192.168.0.9'/.test(S2.el) && /Set-Printer -Name 'Samsung' -PortName 'IP_192.168.0.9'/.test(S2.el) && /Restart-Service Spooler/.test(S2.el) && !/Remove-PrinterPort/.test(S2.el), '🩺 연결 고치기: 고정 IP 포트 만들고 프린터를 그리로 · 인쇄 서비스 다시 시작 · 예전 포트 안 지움 ' + JSON.stringify(n2.j)); }
    const off = await req('POST', '/prn/roles', { auto: false }); fs.writeFileSync(D + '/bin/state.json', JSON.stringify({ def: 'Samsung', calls: [] })); await req('POST', '/print', { printer: '라벨기', imgs: [IMG] }); await wait(2000); ok(off.j.roles.auto === false && st().calls.join() === 'print@Samsung', '자동 끄면 기본을 안 바꿈');
  } finally { ch.kill(); }
  /* ② 웹앱 */
  await new Promise((done) => require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js'));
    const calls = []; let roles = { general: '', label: '', invoice: '', auto: true, temp: null }; let def = '롯데택배'; let hv = '1.1.6';
    await p.route(/127\.0\.0\.1:8898/, async (rt) => { const u = new URL(rt.request().url()); const b = rt.request().postData(); const o = b ? JSON.parse(b) : null; calls.push(u.pathname + (o ? ' ' + JSON.stringify(o) : '')); const J = (x) => rt.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }, body: JSON.stringify(x) });
      if (rt.request().method() === 'OPTIONS') return rt.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST' } });
      if (u.pathname === '/status') return J({ ok: true, ver: hv }); if (u.pathname === '/alps/update') { setTimeout(() => { hv = '1.1.6'; }, 1000); return J({ ok: true }); } if (u.pathname === '/prn/netfix') return J({ ok: true, ip: '192.168.0.9', from: 'WSD-x', to: 'IP_192.168.0.9' }); if (u.pathname === '/printers') return J({ ok: true, printers: ['Samsung M2070', '라벨기', '롯데택배'].map((n) => ({ name: n, def: n === def })) });
      if (u.pathname === '/prn/roles') { if (o) roles = { ...roles, ...o }; return J({ ok: true, roles }); } if (u.pathname === '/prn/default') { def = o.printer; return J({ ok: true, def }); } if (u.pathname === '/prn/temp') return J({ ok: true });
      if (u.pathname === '/alps/config') return J({ ok: true }); if (u.pathname === '/pdiag/test') return J({ ok: true });
      if (u.pathname === '/pdiag') return J({ ok: true, ver: '1.1.4', pc: 'MJ-MAIN', at: new Date().toISOString(), hints: [{ lv: 'warn', t: "'Windows에서 기본 프린터 관리'가 켜져 있음" }, { lv: 'bad', t: "윈도우 기본 프린터가 '롯데택배'(택배·라벨 프린터로 보임)" }], printers: [{ name: '롯데택배', def: true, st: 3, jobs: [{ st: 'Error', pages: 1 }] }, { name: 'Samsung M2070', st: 4, port: 'WSD-x', netBad: true, jobs: [{ st: '인쇄 중', pages: 1 }] }], spooler: { st: 'Running' }, legacyDefault: 0, events: [], tail: ['a'] });
      return J({ ok: false }); });
    await p.evaluate(async () => { const C = LBL(); C.mode = 'pc'; lblSave(C); await lphCheck(true); await prnLoad(true); openLblCfg(); }); await p.waitForTimeout(600);
    const v = await p.evaluate(() => { const ov = LBL_OV; return { sel: ov.querySelectorAll('[data-prnrole]').length, auto: !!ov.querySelector('[data-prnauto]:checked'), diag: !!ov.querySelector('[data-prndiag]'), txt: ov.textContent }; });
    ok(v.sel === 3 && v.auto && v.diag && /이 PC 프린터 3개/.test(v.txt) && /지금 윈도우 기본: 롯데택배/.test(v.txt), '⚙ 라벨 인쇄 설정에 프린터 3칸·자동·점검 ' + JSON.stringify({ sel: v.sel, auto: v.auto }));
    await p.selectOption('[data-prnrole="general"]', 'Samsung M2070'); await p.waitForTimeout(800);
    ok(calls.some((c) => c.startsWith('/prn/roles {"general":"Samsung M2070"')) && calls.some((c) => c.startsWith('/prn/default {"printer":"Samsung M2070"')), '일반 고르면 역할 저장 + 윈도우 기본 바꿈 ' + calls.slice(-4).join(' | '));
    await p.waitForTimeout(400); ok(await p.evaluate(() => /⭐ 지금 기본/.test(LBL_OV.querySelector('[data-prnrole="general"]').closest('.rgpost-o').textContent)), '일반 줄에 ⭐ 지금 기본');
    await p.selectOption('[data-prnrole="label"]', '라벨기'); await p.waitForTimeout(500); ok(await p.evaluate(() => LBL().printer === '라벨기'), '라벨 역할 = 이 기기 라벨 프린터');
    await p.waitForTimeout(300); ok(await p.evaluate(() => { const rows = [...LBL_OV.querySelectorAll('[data-prnrole]')].map((x) => x.closest('.rgpost-o')); const g = rows[0].querySelector('[data-prntest]'), l = rows[1].querySelector('[data-lbltest]'); return !!(g && g.dataset.prntest === 'Samsung M2070' && l); }), '역할 줄마다 🧪 시험 인쇄(일반 = A4 한 장 · 라벨 = 라벨 한 장)');
    await p.selectOption('[data-prnrole="invoice"]', '롯데택배'); await p.waitForTimeout(500); ok(calls.some((c) => c.startsWith('/alps/config {"printer":"롯데택배"')), '송장 역할 = ALPS 설정 프린터');
    ok(await p.evaluate(() => { const r = [...LBL_OV.querySelectorAll('[data-prnrole]')][2].closest('.rgpost-o'); const b = r.querySelector('[data-prntest]'); return !!(b && b.dataset.prntest === '롯데택배'); }), '송장 줄에도 🧪 시험 인쇄');
    { const n0 = calls.length; await p.evaluate(() => [...LBL_OV.querySelectorAll('[data-prnrole]')][2].closest('.rgpost-o').querySelector('[data-prntest]').click()); await p.waitForTimeout(500); ok(calls.slice(n0).some((c) => c === '/pdiag/test {"printer":"롯데택배"}'), '송장 시험 인쇄 → 도우미에 그 프린터로 한 장'); }
    await p.click('[data-prndef="invoice"]'); await p.waitForTimeout(500); ok(calls.some((c) => c === '/prn/default {"printer":"롯데택배","keep":true}'), '⭐ 기본으로(송장)');
    await p.click('[data-prndiag]'); await p.waitForTimeout(900); const dg = await p.evaluate(() => ({ open: !!(PRN_OV && PRN_OV.isConnected), t: PRN_OV ? PRN_OV.textContent : '', test: PRN_OV ? PRN_OV.querySelectorAll('[data-prntest]').length : 0, clr: PRN_OV ? PRN_OV.querySelectorAll('[data-prnact="clear"]').length : 0 }));
    ok(dg.open && /기본 프린터 관리/.test(dg.t) && dg.test === 2 && dg.clr === 2, '🔎 점검 창: 문제 줄·시험 단추·멈춘 작업 취소 ' + JSON.stringify({ test: dg.test, clr: dg.clr }));
    { const nb = await p.evaluate(() => !!(PRN_OV && PRN_OV.querySelector('[data-prnnet="Samsung M2070"]'))); ok(nb, '🔎 점검 창: 네트워크(WSD) 프린터 줄에 🩺 연결 고치기'); const n0 = calls.length; await p.click('[data-prnnet="Samsung M2070"]'); await p.waitForTimeout(900); ok(calls.slice(n0).some((c) => c.startsWith('/prn/netfix {"printer":"Samsung M2070"')) && calls.slice(n0).some((c) => c.startsWith('/pdiag/test {"printer":"Samsung M2070"')), '🩺 누르면 연결 고치기 → 시험 한 장'); }
    const saved = await p.evaluate(async () => { const d = await db.collection('app_settings').doc('pdiag_MJ-MAIN').get(); return d.exists ? d.data() : null; }); ok(saved && saved.hints && saved.hints.length === 2 && saved.by, '점검 결과 서버 저장(app_settings/pdiag_MJ-MAIN)');
    const n0 = calls.length; await p.click('[data-prnact="clear"]'); await p.waitForTimeout(200); ok(!calls.slice(n0).some((c) => c.startsWith('/prn/clear')), '멈춘 작업 취소는 한 번 누르면 안 함');
    await p.click('[data-prnact="clear"]'); await p.waitForTimeout(600); ok(calls.slice(n0).some((c) => c.startsWith('/prn/clear {"printer":"롯데택배"')), '두 번 누르면 취소 맡김');
    await p.evaluate(() => { if (PRN_OV) PRN_OV.remove(); }); await p.click('[data-prntest]').catch(() => {});
    /* 🔧 한 번에 맞추기 — 짐작 */
    const g = await p.evaluate(() => { const L = (a, d) => a.map((n) => ({ name: n, def: n === d })); return {
      a: prnGuess(L(['Microsoft Print to PDF', 'Samsung M2070 Series', 'XP-420B 라벨', '롯데택배'], '롯데택배'), {}, '', '').roles,
      b: prnGuess(L(['Fax', 'HP LaserJet', 'Canon MF', 'TSC TE200'], 'HP LaserJet'), {}, 'TSC TE200', '').roles,
      c: prnGuess(L(['Samsung M2070', '라벨기', '롯데택배'], 'Samsung M2070'), { general: '라벨기' }, '', '').roles,
      d: prnGuess(L(['Samsung M2070', 'ZD420', 'GK420', '롯데택배'], 'Samsung M2070'), {}, '', '').roles }; });
    ok(g.a.general === 'Samsung M2070 Series' && g.a.label === 'XP-420B 라벨' && g.a.invoice === '롯데택배', '짐작: 삼성=일반 · 라벨 낱말=라벨 · 롯데=송장 (기본이 롯데여도) ' + JSON.stringify(g.a));
    ok(g.b.invoice === 'TSC TE200' && g.b.general === 'HP LaserJet' && !g.b.label, '짐작: ALPS 설정 프린터 = 송장 · 지금 기본 = 일반 · 라벨 후보 없으면 비움 ' + JSON.stringify(g.b));
    ok(g.c.general === '라벨기', '짐작: 정해 둔 역할은 그대로');
    ok(!g.d.label && g.d.general === 'Samsung M2070', '짐작: 라벨 후보 둘이면 고르지 않음 ' + JSON.stringify(g.d));
    roles = { general: '', label: '', invoice: '', auto: true, temp: null }; def = '롯데택배'; await p.evaluate(() => { const C = LBL(); C.printer = ''; lblSave(C); });
    const n2 = calls.length; await p.evaluate(() => prnAutoSetup()); await p.waitForTimeout(800);
    const su = await p.evaluate(() => ({ t: PRN_OV ? PRN_OV.textContent : '', lbl: LBL().printer })); const c2 = calls.slice(n2);
    ok(roles.general === 'Samsung M2070' && roles.label === '라벨기' && roles.invoice === '롯데택배' && def === 'Samsung M2070', '🔧 한 번에: 역할 셋 저장 + 기본 = 일반 ' + JSON.stringify(roles) + ' 기본 ' + def);
    ok(c2.some((c) => c.startsWith('/prn/clear {"printer":"롯데택배"')), '🔧 한 번에: 오류 작업이 있는 프린터 대기열 정리');
    ok(/한 일/.test(su.t) && /일반 = 'Samsung M2070'/.test(su.t) && su.lbl === '라벨기', '🔧 한 번에: 한 일·남은 일 창 · 라벨 프린터도 맞춤');
    await p.evaluate(() => { if (PRN_OV) PRN_OV.remove(); localStorage.removeItem('rn-prn-auto1'); });
    roles = { general: '', label: '', invoice: '', auto: true, temp: null }; const n3 = calls.length; await p.evaluate(() => prnAutoOnce()); await p.waitForTimeout(1200); ok(roles.general === 'Samsung M2070' && await p.evaluate(() => !!localStorage.getItem('rn-prn-auto1')), '처음 한 번 저절로 맞춤(역할이 하나도 없을 때)');
    const n4 = calls.length; await p.evaluate(() => { if (PRN_OV) PRN_OV.remove(); return prnAutoOnce(); }); await p.waitForTimeout(500); ok(!calls.slice(n4).some((c) => c.startsWith('/prn/roles {')), '두 번째는 저절로 안 함');
    /* (11/05 '삼성이 아직도 안 돼') 옛 도우미면 먼저 새 판 받게 하고 바뀔 때까지 기다림 · 옛 도우미 점검에도 WSD 연결 끊김 판단 */
    { hv = '1.1.4'; const n0 = calls.length; const H = await p.evaluate(async () => { S.lph.at = 0; const h = await prnHelperFresh(false); return { ver: h.ver }; }); ok(H.ver === '1.1.6' && calls.slice(n0).some((c) => c === '/alps/update'), '옛 도우미(1.1.4) → /alps/update 부탁 → 1.1.6으로 바뀔 때까지 기다림 ' + JSON.stringify(H));
      const nb = await p.evaluate(() => [prnNetBadOf({ port: 'WSD-1', jobs: [{ st: '인쇄 중', at: '11/04/2026 10:00:00' }] }), prnNetBadOf({ port: 'USB001', jobs: [{ st: 'Error' }] }), prnNetBadOf({ port: 'WSD-1', jobs: [] })]); ok(nb.join() === 'true,false,false', '옛 도우미 점검 자료로도 네트워크(WSD) 연결 끊김 판단(오래 걸린 작업) · USB·빈 대기열은 아님', nb); }
    /* 인쇄 창 라벨 — 잠깐 라벨 → 창 닫으면 끝 */
    const n1 = calls.length; const pop = p.waitForEvent('popup'); await p.evaluate(() => { window.__rnOpenRaw = null; regLabelPrintWin([{ sku: 'RN-1', ttl: '', gr: '' }], LBL()); }); const w = await pop; await p.waitForTimeout(800);
    ok(calls.slice(n1).some((c) => c.startsWith('/prn/temp {"role":"label","sec":120}')), '인쇄 창 라벨 → 잠깐 기본 = 라벨'); await w.close(); await p.waitForTimeout(1600); ok(calls.slice(n1).some((c) => c === '/prn/temp {"end":1}'), '인쇄 창 닫으면 일반으로(끝)');
  }).then(done));
  console.log(bad ? `❌ ${bad}개 실패` : '✅ tPRN 모두 통과'); process.exit(bad ? 1 : 0); })();
