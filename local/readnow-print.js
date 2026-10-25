/* readnow-print.js — 리드나우 라벨 인쇄 도우미 (정범님 10/25)
 * 하는 일: 웹앱이 만든 라벨 그림을 '정한 프린터 이름'으로만 확인 창 없이 인쇄 — 윈도우 기본 프린터·크롬 설정은 건드리지 않음(다른 인쇄는 그대로 기본 프린터)
 * 듣는 곳: http://127.0.0.1:8898 (이 PC 안에서만) · 웹앱(jerrycson.github.io)만 부를 수 있음(X-RN-Print 머리 + 출처 확인)
 *   GET  /status   → { ok, ver }
 *   GET  /printers → { ok, printers: [{ name, def }] }
 *   POST /print    → { printer, wMm, hMm, imgs: ['data:image/png;base64,...'], copies } → { ok, n }
 * 인쇄: PowerShell + .NET PrintDocument — 프린터 이름 지정 · 용지 = 라벨 크기(mm) · 여백 0 · 장마다 그림 하나를 용지에 꽉 맞춤 · 창 없음(StandardPrintController)
 * 스스로 새 판: 6시간마다 GitHub에서 받아 판 번호가 높으면 바꾸고 끝남 → 실행기가 5초 뒤 다시 켬 */
'use strict';
const VERSION = '1.0.0';
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const PORT = 8898; const HOME = __dirname; const RAW = 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/readnow-print.js';
const ORIGINS = [/^https:\/\/jerrycson\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const LOG = path.join(HOME, 'print.log');
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
  if (u.pathname === '/status') return J(200, { ok: true, ver: VERSION, pc: os.hostname() });
  if (req.headers['x-rn-print'] !== '1') return J(403, { ok: false, err: 'X-RN-Print 머리가 없음' });
  if (u.pathname === '/printers') return printers().then((L) => J(200, { ok: true, printers: L })).catch((e) => J(500, { ok: false, err: e.message }));
  if (u.pathname === '/print' && req.method === 'POST') return readBody(req, 60 * 1048576, (e, b) => { if (e) return J(400, { ok: false, err: e.message }); let o = null; try { o = JSON.parse(b.toString('utf8')); } catch (x) { return J(400, { ok: false, err: 'bad json' }); }
    printImgs(o).then((n) => J(200, { ok: true, n })).catch((er) => { log('✗ ' + er.message); J(500, { ok: false, err: er.message }); }); });
  return J(404, { ok: false });
});
srv.on('error', (e) => { log('듣기 실패: ' + e.message + ' — 이미 켜져 있으면 그대로 둠'); setTimeout(() => process.exit(0), 1000); });
srv.listen(PORT, '127.0.0.1', () => log(`리드나우 라벨 인쇄 도우미 ${VERSION} 시작 — 127.0.0.1:${PORT}`));

/* 스스로 새 판 */
function selfUpdate() { https.get(RAW + '?t=' + Date.now(), { timeout: 20000 }, (r) => { if (r.statusCode !== 200) { r.resume(); return; } let b = ''; r.setEncoding('utf8'); r.on('data', (c) => (b += c)); r.on('end', () => { const v = (b.match(/const VERSION = '([\d.]+)'/) || [])[1]; const n = (x) => String(x || '0').split('.').reduce((a, y) => a * 1000 + (+y || 0), 0); if (!v || n(v) <= n(VERSION)) return;
  const tmp = path.join(HOME, 'readnow-print.new.js'); fs.writeFileSync(tmp, b); const chk = cp.spawnSync(process.execPath, ['--check', tmp]); if (chk.status !== 0) { log(`새 판 ${v} 검사 실패 — 그대로 둠`); return; } fs.renameSync(tmp, path.join(HOME, 'readnow-print.js')); log(`새 판 ${v}로 바꿈 — 다시 켜짐`); setTimeout(() => process.exit(0), 500); }); }).on('error', () => {}).on('timeout', function () { this.destroy(); }); }
setTimeout(selfUpdate, 60e3); setInterval(selfUpdate, 6 * 3600e3);
