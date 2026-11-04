/* readnow-print.js — 리드나우 라벨 인쇄 도우미 (정범님 10/25)
 * 하는 일: 웹앱이 만든 라벨 그림을 '정한 프린터 이름'으로만 확인 창 없이 인쇄 — 윈도우 기본 프린터·크롬 설정은 건드리지 않음(다른 인쇄는 그대로 기본 프린터)
 * 듣는 곳: http://127.0.0.1:8898 (이 PC 안에서만) · 웹앱(jerrycson.github.io)만 부를 수 있음(X-RN-Print 머리 + 출처 확인)
 *   GET  /status   → { ok, ver }
 *   GET  /printers → { ok, printers: [{ name, def }] }
 *   POST /print    → { printer, wMm, hMm, imgs: ['data:image/png;base64,...'], copies } → { ok, n }
 * 인쇄: PowerShell + .NET PrintDocument — 프린터 이름 지정 · 용지 = 라벨 크기(mm) · 여백 0 · 장마다 그림 하나를 용지에 꽉 맞춤 · 창 없음(StandardPrintController)
 *   (1.1.0) /alps… — 📦 ALPS 자동 처리(같은 폴더 readnow-alps.js · 없으면 GitHub에서 받음) · GET /alps = 이 PC 설정 화면
 * 스스로 새 판: 6시간마다 GitHub에서 받아 판 번호가 높으면 바꾸고 끝남 → 실행기가 5초 뒤 다시 켬 */
'use strict';
const VERSION = '1.1.2'; // (1.1.2 정범님 11/03) /alps/journal(오늘 인쇄 기록)·/alps/unprint(안 나왔음으로 되돌리기) // (1.1.1 정범님 11/03) ALPS 「이어서 진행」(/alps/resume)·처리 기록(/alps/hist)
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const PORT = 8898; const HOME = __dirname; const RAW = 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/readnow-print.js';
const ORIGINS = [/^https:\/\/jerrycson\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const LOG = path.join(HOME, 'print.log');
const RAW_ALPS = RAW.replace(/readnow-print\.js$/, 'readnow-alps.js'); const ALPS_F = path.join(HOME, 'readnow-alps.js');
let ALPS = null; const loadAlps = () => { try { delete require.cache[require.resolve(ALPS_F)]; ALPS = require(ALPS_F); } catch (e) { ALPS = null; if (fs.existsSync(ALPS_F)) log('ALPS 모듈 읽기 실패: ' + e.message); } }; loadAlps();
const log = (m) => { const line = `${new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 19).replace('T', ' ')} ${m}\n`; try { fs.appendFileSync(LOG, line); } catch (e) {} process.stdout.write(line); };
const ps = (script, timeout) => new Promise((res) => { const f = path.join(os.tmpdir(), `rnp_${process.pid}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.ps1`); fs.writeFileSync(f, '﻿' + script, 'utf8');
  cp.execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', f], { windowsHide: true, timeout: timeout || 120000, maxBuffer: 8 * 1048576 }, (e, out, err) => { try { fs.unlinkSync(f); } catch (x) {} res({ e, out: String(out || ''), err: String(err || '') }); }); });
const psq = (s) => "'" + String(s).replace(/'/g, "''") + "'";

async function printers() { const r = await ps("[Console]::OutputEncoding = [Text.Encoding]::UTF8\n$L = Get-CimInstance Win32_Printer | ForEach-Object { [pscustomobject]@{ name = $_.Name; def = [bool]$_.Default; off = [bool]$_.WorkOffline } }\n@($L) | ConvertTo-Json -Compress", 30000);
  if (r.e) throw new Error('프린터 목록을 못 읽음: ' + (r.err || r.e.message).slice(0, 200)); let L = []; try { L = JSON.parse(r.out.trim() || '[]'); } catch (e) {} if (!Array.isArray(L)) L = [L]; return L.filter((x) => x && x.name); }

async function printImgs(o) { const printer = String(o.printer || '').trim(); if (!printer) throw new Error('라벨 프린터를 고르지 않음');
  const P = await printers(); if (!P.some((x) => x.name === printer)) throw new Error(`이 PC에 '${printer}' 프린터가 없음 — 웹앱에서 다시 고르세요`);
  const imgs = (o.imgs || []).map((d) => String(d).replace(/^data:image\/[a-z]+;base64,/, '')).filter(Boolean); if (!imgs.length) throw new Error('인쇄할 라벨이 없음'); if (imgs.length > 500) throw new Error('한 번에 500장까지');
  const wMm = Math.max(10, Math.min(200, +o.wMm || 40)), hMm = Math.max(10, Math.min(300, +o.hMm || 20)); const copies = Math.max(1, Math.min(10, Math.round(+o.copies || 1)));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rnlabel_')); const files = imgs.map((b, i) => { const f = path.join(dir, `l${String(i).padStart(4, '0')}.png`); fs.writeFileSync(f, Buffer.from(b, 'base64')); return f; });
  const w100 = Math.round(wMm / 25.4 * 100), h100 = Math.round(hMm / 25.4 * 100); /* .NET 용지 크기 단위 = 1/100인치 */
  const script = `Add-Type -AssemblyName System.Drawing
$script:files = @(${files.map(psq).join(',')})
$script:i = 0; $script:c = 0
$pd = New-Object System.Drawing.Printing.PrintDocument
$pd.PrinterSettings.PrinterName = ${psq(printer)}
if (-not $pd.PrinterSettings.IsValid) { Write-Error 'NOPRINTER'; exit 3 }
$pd.DocumentName = '리드나우 라벨'
$pd.PrintController = New-Object System.Drawing.Printing.StandardPrintController
$ps = New-Object System.Drawing.Printing.PaperSize('ReadNowLabel', ${w100}, ${h100})
$pd.DefaultPageSettings.PaperSize = $ps
$pd.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0,0,0,0)
$pd.DefaultPageSettings.Landscape = $false
$pd.OriginAtMargins = $false
$pd.add_PrintPage({ param($s, $e)
  $img = [System.Drawing.Image]::FromFile($script:files[$script:i])
  $g = $e.Graphics; $g.PageUnit = [System.Drawing.GraphicsUnit]::Display
  $hx = $e.PageSettings.HardMarginX; $hy = $e.PageSettings.HardMarginY
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($img, [single](-$hx), [single](-$hy), [single]${w100}, [single]${h100})
  $img.Dispose()
  $script:c++; if ($script:c -ge ${copies}) { $script:c = 0; $script:i++ }
  $e.HasMorePages = ($script:i -lt $script:files.Count) })
$pd.Print()
Write-Output ('OK ' + $script:files.Count)`;
  const r = await ps(script, 180000); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
  if (r.e || !/OK \d+/.test(r.out)) throw new Error(/NOPRINTER/.test(r.err) ? `'${printer}' 프린터를 열 수 없음(꺼져 있거나 이름이 바뀜)` : '인쇄 실패: ' + (r.err || (r.e && r.e.message) || r.out).replace(/\s+/g, ' ').slice(0, 300));
  log(`🖨 ${printer}: 라벨 ${imgs.length}장 × ${copies} (${wMm}×${hMm}mm)`); return imgs.length * copies; }

function readBody(req, max, cb) { const bufs = []; let n = 0, bad = false; req.on('data', (c) => { n += c.length; if (n > max) { bad = true; req.destroy(); } else bufs.push(c); }); req.on('end', () => (bad ? cb(new Error('너무 큼')) : cb(null, Buffer.concat(bufs)))); req.on('error', cb); }
const srv = http.createServer((req, res) => {
  const org = req.headers.origin || ''; const okOrg = !org || ORIGINS.some((r) => r.test(org)); const host = String(req.headers.host || '');
  const H = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...(org && okOrg ? { 'Access-Control-Allow-Origin': org, 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'Content-Type, X-RN-Print', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Private-Network': 'true' } : {}) };
  const J = (code, o) => { res.writeHead(code, H); res.end(JSON.stringify(o)); };
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host) || !okOrg) return J(403, { ok: false, err: '이 PC의 리드나우 웹앱만' });
  if (req.method === 'OPTIONS') { res.writeHead(204, H); return res.end(); }
  const u = new URL(req.url, 'http://127.0.0.1');
  if (u.pathname === '/status') return J(200, { ok: true, ver: VERSION, pc: os.hostname(), alps: ALPS ? ALPS.VERSION : null });
  if (u.pathname === '/alps' && req.method === 'GET') { if (org || !ALPS) return J(org ? 403 : 503, { ok: false, err: org ? '이 PC 브라우저 주소창에서만' : 'ALPS 모듈이 아직 없음(1분 안에 받음)' }); res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "frame-ancestors 'none'" }); return res.end(ALPS.pageHtml()); }
  if (req.headers['x-rn-print'] !== '1') return J(403, { ok: false, err: 'X-RN-Print 머리가 없음' });
  if (u.pathname.startsWith('/alps/')) return alpsApi(req, res, u, org, J);
  if (u.pathname === '/printers') return printers().then((L) => J(200, { ok: true, printers: L })).catch((e) => J(500, { ok: false, err: e.message }));
  if (u.pathname === '/print' && req.method === 'POST') return readBody(req, 60 * 1048576, (e, b) => { if (e) return J(400, { ok: false, err: e.message }); let o = null; try { o = JSON.parse(b.toString('utf8')); } catch (x) { return J(400, { ok: false, err: 'bad json' }); }
    printImgs(o).then((n) => J(200, { ok: true, n })).catch((er) => { log('✗ ' + er.message); J(500, { ok: false, err: er.message }); }); });
  return J(404, { ok: false });
});
/* 📦 ALPS 자동 처리 길 — 웹앱(jerrycson.github.io)·이 PC 설정 화면만 · 로그인 정보는 설정 화면(127.0.0.1:8898 출처)에서만 받음 */
function alpsApi(req, res, u, org, J) { if (!ALPS) return J(503, { ok: false, err: 'ALPS 모듈이 아직 없음 — 1분 뒤 다시(도우미가 GitHub에서 받음)' }); const A = ALPS; const p = u.pathname.slice(6); const selfPage = !org || /^http:\/\/(127\.0\.0\.1|localhost):8898$/.test(org);
  const body = (cb) => readBody(req, 25 * 1048576, (e, b) => { if (e) return J(400, { ok: false, err: e.message }); let o = null; try { o = JSON.parse(b.toString('utf8') || '{}'); } catch (x) { return J(400, { ok: false, err: 'bad json' }); } try { cb(o); } catch (er) { J(400, { ok: false, err: er.message }); } });
  if (p === 'status') { const c = A.cfg(); const k = A.keyInfo ? A.keyInfo().catch(() => null) : Promise.resolve(null); return k.then((key) => J(200, { ok: true, ver: A.VERSION, helper: VERSION, pc: key ? key.pc : os.hostname(), cfg: { printer: c.printer, confirmBeforePrint: c.confirmBeforePrint, firstOne: c.firstOne, headless: c.headless, cloud: !!c.cloudUrl }, cred: A.credInfo(), run: A.status(), key: key ? { fp: key.fp, pub: key.pub } : null, remote: A.remoteState ? A.remoteState() : null })); }
  if (p === 'journal') return J(200, { ok: true, groups: A.journalToday ? A.journalToday() : [] });
  if (p === 'unprint') return body((o) => { if (!A.unprint) return J(400, { ok: false, err: 'ALPS 모듈이 옛 판' }); J(200, { ok: true, ...A.unprint(o) }); });
  if (p === 'pcheck') return (A.printerCheck ? A.printerCheck(A.cfg().printer) : Promise.resolve({ ok: true, skip: 'ALPS 모듈이 옛 판(0.5.5 전) — 프린터 상태를 못 봄' })).then((r) => J(200, { ok: true, ...r })).catch((e) => J(200, { ok: true, skip: e.message })); /* (11/04 원스톱 P0) 프린터 오프라인·오류·대기열 */
  if (p === 'update') { if (alpsBusy()) return J(200, { ok: false, err: '처리 중 — 끝난 뒤에 바꿈' }); alpsUpdate(); setTimeout(selfUpdate, 3000); return J(200, { ok: true, msg: '새 판 받기 시작 — 30초 뒤 다시 확인' }); } /* (11/04 원스톱 F19) 웹앱이 시작 전 점검에서 '지금 새 판 받기' */
  if (p === 'hist') return J(200, { ok: true, hist: A.history ? A.history().slice(0, +(u.searchParams.get('n') || 100)) : [] }); /* (1.1.1) 처리 기록 — 성공·실패 한곳 */
  if (req.method !== 'POST' && p !== 'result') return J(405, { ok: false });
  if (p === 'cred') { if (!selfPage) return J(403, { ok: false, err: '로그인 정보는 이 PC 설정 화면(http://127.0.0.1:8898/alps)에서만' }); return body((o) => A.saveCred(o.id, o.pw).then(() => J(200, { ok: true })).catch((e) => J(400, { ok: false, err: e.message }))); }
  if (p === 'config') return body((o) => { delete o.cloudUrl; J(200, { ok: true, cfg: A.setCfg(o) }); });
  if (p === 'link') return body((o) => J(200, { ok: true, remote: A.link(o) })); /* 웹앱이 이 PC를 허락할 때 클라우드 주소를 넣어 줌 */
  if (p === 'run') return body((o) => J(200, { ok: true, run: A.start(o) }));
  if (p === 'resume') return body((o) => { if (!A.resume) return J(400, { ok: false, err: 'ALPS 모듈이 옛 판 — 1분 뒤 다시' }); J(200, { ok: true, run: A.resume(o) }); }); /* (1.1.1) 이어서 진행 — 마지막 파일로 · ALPS 목록에 있으면 접수 건너뜀 */
  if (p === 'input') return body((o) => J(200, A.input(o)));
  if (p === 'reset') return J(200, { ok: A.reset() });
  if (p === 'result') { const r = A.result(u.searchParams.get('id')); return r ? J(200, { ok: true, ...r }) : J(404, { ok: false, err: '결과 없음' }); }
  return J(404, { ok: false }); }
srv.on('error', (e) => { log('듣기 실패: ' + e.message + ' — 이미 켜져 있으면 그대로 둠'); setTimeout(() => process.exit(0), 1000); });
srv.listen(PORT, '127.0.0.1', () => log(`리드나우 라벨 인쇄 도우미 ${VERSION} 시작 — 127.0.0.1:${PORT}`));

/* 스스로 새 판 */
/* (정범님 11/04 원스톱 — 구멍 ①) ALPS가 처리 중(인쇄·접수 중)이면 스스로 새 판으로 바꾸며 꺼지지 않음 — 10분 뒤 다시 봄(예전엔 6시간마다 처리 중인지 보지 않고 process.exit → 인쇄 중 꺼짐 위험) */
const alpsBusy = () => { try { const s = ALPS && ALPS.status && ALPS.status(); return !!(s && !['done', 'error'].includes(s.status)); } catch (e) { return false; } };
const UPD_RETRY_MS = 10 * 60e3; /* 근거: 없음(처리 한 번이 보통 몇 분) — 처리 중이라 미룬 판 바꾸기를 다시 보는 간격 */
function selfUpdate() { if (alpsBusy()) { log('새 판 확인 미룸 — ALPS 처리 중(10분 뒤 다시)'); setTimeout(selfUpdate, UPD_RETRY_MS); return; } https.get(RAW + '?t=' + Date.now(), { timeout: 20000 }, (r) => { if (r.statusCode !== 200) { r.resume(); return; } let b = ''; r.setEncoding('utf8'); r.on('data', (c) => (b += c)); r.on('end', () => { const v = (b.match(/const VERSION = '([\d.]+)'/) || [])[1]; const n = (x) => String(x || '0').split('.').reduce((a, y) => a * 1000 + (+y || 0), 0); if (!v || n(v) <= n(VERSION)) return;
  const tmp = path.join(HOME, 'readnow-print.new.js'); fs.writeFileSync(tmp, b); const chk = cp.spawnSync(process.execPath, ['--check', tmp]); if (chk.status !== 0) { log(`새 판 ${v} 검사 실패 — 그대로 둠`); return; } if (alpsBusy()) { log(`새 판 ${v} 받음 — ALPS 처리 중이라 바꾸기를 미룸(10분 뒤 다시)`); try { fs.unlinkSync(tmp); } catch (e) {} setTimeout(selfUpdate, UPD_RETRY_MS); return; } fs.renameSync(tmp, path.join(HOME, 'readnow-print.js')); log(`새 판 ${v}로 바꿈 — 다시 켜짐`); setTimeout(() => process.exit(0), 500); }); }).on('error', () => {}).on('timeout', function () { this.destroy(); }); }
function alpsUpdate() { https.get(RAW_ALPS + '?t=' + Date.now(), { timeout: 20000 }, (r) => { if (r.statusCode !== 200) { r.resume(); return; } let b = ''; r.setEncoding('utf8'); r.on('data', (c) => (b += c)); r.on('end', () => { const v = (b.match(/const VERSION = '([\d.]+)'/) || [])[1]; const n = (x) => String(x || '0').split('.').reduce((a, y) => a * 1000 + (+y || 0), 0); if (!v || (ALPS && n(v) <= n(ALPS.VERSION))) return;
  if (alpsBusy()) { setTimeout(alpsUpdate, UPD_RETRY_MS); return; } /* 처리 중엔 안 바꿈 — 10분 뒤 다시(예전엔 6시간 뒤 다음 회차) */
  const tmp = path.join(HOME, 'readnow-alps.new.js'); fs.writeFileSync(tmp, b); const chk = cp.spawnSync(process.execPath, ['--check', tmp]); if (chk.status !== 0) { log(`ALPS 모듈 새 판 ${v} 검사 실패 — 그대로 둠`); return; } fs.renameSync(tmp, ALPS_F); loadAlps(); log(`ALPS 모듈 ${v}로 바꿈`); }); }).on('error', () => {}).on('timeout', function () { this.destroy(); }); }
if (!process.env.RN_PRINT_NOUPDATE) { setTimeout(selfUpdate, 60e3); setInterval(selfUpdate, 6 * 3600e3); setTimeout(alpsUpdate, ALPS ? 90e3 : 5e3); setInterval(alpsUpdate, 6 * 3600e3); }
