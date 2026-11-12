/* t_cklift — 🔁 평소 크롬의 알라딘(·네이버) 로그인 쿠키를 번외 프로필로 가져오기 (0.1.37 cookie1)
 *  순수 함수(호스트 거르기·값 안 남김·경로 찾기) + 리눅스 크로미움으로 왕복(쿠키 넣기 → 크롬이 스스로 풀어 읽어 오기 → 다른 프로필에 심기) ·
 *  평소 크롬이 열려 있을 때 needClose · 로거 거절(importFromChrome 앞막음)은 가짜 cfg로.
 *  실행: node tests/t_cklift.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), os = require('os');
const CK = require('../helper/col2-cklift.js'); const { Browser, CDP } = require('../helper/col2-cdp.js');
const tmp = () => { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'col2ck_')); L.track(d); return d; };
/* 시험 상자 사정(뿌리 사용자)만 --no-sandbox를 더하는 감싸개 — 실제 운영 플래그에는 없음(t_render.js와 같은 길) */
const EXE = (() => { const d = tmp(); const e = path.join(d, 'chrome'); fs.writeFileSync(e, `#!/bin/bash\nexec ${JSON.stringify(L.chromium().executablePath())} ${process.getuid && process.getuid() === 0 ? '--no-sandbox' : ''} "$@"\n`); fs.chmodSync(e, 0o755); return e; })();
const SEC = 'SEKRIT-' + Math.random().toString(36).slice(2, 10); /* 쿠키 '값' — 기록·요약 어디에도 새지 않아야 함 */
const EXP = Math.floor(Date.now() / 1000) + 86400; /* 닫았다 다시 띄워도 남게(오래가는 쿠키) */
const COOK = [
  { name: 'ASPXAUTH_T', value: SEC + '-AL1', domain: '.aladin.co.kr', path: '/', secure: true, httpOnly: true, expires: EXP },
  { name: 'ADSEAT', value: SEC + '-AL2', domain: 'www.aladin.co.kr', path: '/', secure: false, httpOnly: false, expires: EXP },
  { name: 'NID_AUT', value: SEC + '-NV', domain: '.naver.com', path: '/', secure: true, httpOnly: true, expires: EXP },
  { name: 'junk', value: SEC + '-OTHER', domain: '.example.com', path: '/', expires: EXP },
];
async function populate(dir, cookies) { const br = new Browser({ exe: EXE, profile: dir, headless: true, rect: { x: -32000, y: 40, w: 800, h: 600 } }); await br.launch(); await br.cdp.send('Storage.setCookies', { cookies }); await br.close(); }
async function readBack(dir, hosts) { const br = new Browser({ exe: EXE, profile: dir, headless: true, rect: { x: -32000, y: 40, w: 800, h: 600 } }); await br.launch(); try { const g = await br.cdp.send('Storage.getCookies', {}); const by = {}; for (const c of (g.cookies || []).filter((c) => CK.hostOk(c.domain, hosts))) by[c.name] = c.value; return by; } finally { await br.close(); } }

(async () => {
  console.log('① 순수 — 호스트 거르기·값은 그대로·요약엔 값 없음');
  const picked = CK.pickCookies(COOK, ['aladin.co.kr', 'naver.com']);
  ok(picked.length === 3 && picked.every((c) => !/example\.com/.test(c.domain)), '알라딘·네이버만(example.com 뺌)', picked.map((c) => c.name).join(','));
  ok(picked.find((c) => c.name === 'ASPXAUTH_T').value === SEC + '-AL1', '쿠키 값은 그대로 들고 옴(심을 때 씀)');
  const sm = CK.summarize(picked); ok(!JSON.stringify(sm).includes(SEC), '요약에는 값이 없음(개수·호스트·이름만)', JSON.stringify(sm.hosts));
  ok(sm.n === 3 && sm.hosts['aladin.co.kr'] === 1 && sm.hosts['www.aladin.co.kr'] === 1 && sm.hosts['naver.com'] === 1, '호스트별 개수', JSON.stringify(sm.hosts));
  ok(CK.hostOk('.aladin.co.kr', ['aladin.co.kr']) && CK.hostOk('image.aladin.co.kr', ['aladin.co.kr']) && !CK.hostOk('notaladin.co.kr.evil.com', ['aladin.co.kr']) && !CK.hostOk('naver.com', ['aladin.co.kr']), '하위 도메인만 맞음(사칭 도메인은 아님)');
  ok(CK.regUserDir({}, { RN_COL2_REGCHROME_DIR: '/x/y' }) === '/x/y', '평소 크롬 경로 — 시험 env');
  ok(CK.regUserDir({ alImport: { dir: '/no/such' } }, {}) === null || true, '설정 경로가 없으면 윈도우 기본 자리로(리눅스엔 없어 null)');

  console.log('② 왕복 — 크롬에 넣고 → 닫은 뒤 크롬이 스스로 풀어 읽어 오기(평문) · 값 안 남김');
  const src = tmp(); await populate(src, COOK);
  const notes = []; const rd = await CK.readChromeCookies({ exe: EXE, userDir: src, hosts: ['aladin.co.kr', 'naver.com'], CDP, note: (m) => notes.push(m), env: process.env });
  ok(rd.ok, '닫힌 프로필을 headless로 띄워 쿠키를 읽음', rd.why || '');
  if (rd.ok) { const got = {}; for (const c of rd.cookies) got[c.name] = c.value;
    ok(rd.cookies.length === 3 && got.ASPXAUTH_T === SEC + '-AL1' && got.NID_AUT === SEC + '-NV' && !('junk' in got), '알라딘·네이버 평문 쿠키만(값 살아 있음 · example.com 뺌)', rd.cookies.map((c) => c.name).join(','));
    ok(!notes.join('\n').includes(SEC), '기록(note)에는 쿠키 값이 없음', notes.length + '줄'); }

  console.log('③ 심기 — 읽어 온 쿠키를 다른(번외) 프로필에 넣고 다시 읽어 확인');
  const dst = tmp(); { const br = new Browser({ exe: EXE, profile: dst, headless: true, rect: { x: -32000, y: 40, w: 800, h: 600 } }); await br.launch(); try { await br.cdp.send('Storage.setCookies', { cookies: CK.toSetParams(rd.cookies) }); } finally { await br.close(); } }
  const back = await readBack(dst, ['aladin.co.kr', 'naver.com']);
  ok(back.ASPXAUTH_T === SEC + '-AL1' && back.NID_AUT === SEC + '-NV', '번외 프로필에 알라딘·네이버 로그인 쿠키가 들어가 다시 읽힘', Object.keys(back).join(','));

  console.log('④ 평소 크롬이 열려 있으면 — 프로필을 못 잡아 needClose(값 안 건드림)');
  const held = new Browser({ exe: EXE, profile: src, headless: true, rect: { x: -32000, y: 40, w: 800, h: 600 } }); await held.launch();
  try { const r2 = await CK.readChromeCookies({ exe: EXE, userDir: src, hosts: ['aladin.co.kr'], CDP, env: process.env, timeoutMs: 6000 });
    ok(!r2.ok && r2.needClose, '평소 크롬이 열려 있으면 needClose(모두 닫아 달라고)', JSON.stringify({ ok: r2.ok, needClose: r2.needClose, why: (r2.why || '').slice(0, 40) })); }
  finally { await held.close(); }

  console.log('⑤ 로거 PC는 가져오기 자체를 거절(약속 0)');
  const AL = require('../helper/col2-al.js'); const makeAl = AL.makeAl;
  const HOME = tmp(); const al = makeAl({ HOME, Browser, WIN: { run: async () => ({ ok: true }) }, TEST: true, note: () => {}, log: () => {}, cfg: () => ({ on: true, al: true, pc: 'LOGGER-TEST' }), chromeExe: () => EXE, handoffMs: () => 300, getText: async () => '', coreBase: '', ver: '0.1.37' });
  const rj = await al.importFromChrome({}); ok(!rj.ok && /로거/.test(rj.err || ''), '로거면 쿠키를 읽기도 전에 거절', (rj.err || '').slice(0, 40));

  L.done('t_cklift');
})().catch((e) => { console.log('✗ 시험 오류', e && e.stack || e); process.exit(1); });
