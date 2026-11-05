/* readnow-print.js — 리드나우 라벨 인쇄 도우미 (정범님 10/25)
 * 하는 일: 웹앱이 만든 라벨 그림을 '정한 프린터 이름'으로만 확인 창 없이 인쇄 — 윈도우 기본 프린터·크롬 설정은 건드리지 않음(다른 인쇄는 그대로 기본 프린터)
 * 듣는 곳: http://127.0.0.1:8898 (이 PC 안에서만) · 웹앱(jerrycson.github.io)만 부를 수 있음(X-RN-Print 머리 + 출처 확인)
 *   GET  /status   → { ok, ver }
 *   GET  /printers → { ok, printers: [{ name, def }] }
 *   POST /print    → { printer, wMm, hMm, imgs: ['data:image/png;base64,...'], copies } → { ok, n }
 *   GET  /pdiag    → (1.1.4) 이 PC 인쇄 상태 점검 — 프린터마다 상태·대기열·윈도우 기본 프린터 관리 방식·인쇄 스풀러·최근 인쇄 오류·도우미 기록 · 보기만
 *   POST /pdiag/test → { printer } → 그 프린터로 A4 시험 한 장(문서 이름 '리드나우 시험 인쇄')
 *   (1.1.4 정범님 11/05 '일반 삼성·라벨·송장 3개 — 기본값은 일반, 경우에 따라 매우 쉽게 고르기')
 *   GET/POST /prn/roles → { general, label, invoice } = 이 PC 프린터 세 역할(prn-roles.json · 송장은 ALPS 설정 프린터와 같게)
 *   POST /prn/default → { printer, keep } → 윈도우 기본 프린터를 그 프린터로 + keep이면 'Windows에서 기본 프린터 관리'를 끔(마지막에 쓴 프린터로 저절로 바뀌지 않게)
 *   POST /prn/resume → { printer } → 일시 정지된 프린터를 다시 시작 · POST /prn/clear → { printer } → 그 프린터 대기열에서 오류·멈춘 작업만 취소
 *   (1.1.4 정범님 11/05 '송장·라벨을 뽑을 때는 자동으로 그 프린터로 바꿔 작업한 뒤 다시 자동으로 일반 프린터') 자동 바꾸기(역할 auto 기본 켬):
 *     라벨 인쇄(/print) 동안 기본 = 라벨 · ALPS 처리 동안 기본 = 송장 → 끝나면(실패해도) 기본 = 일반 · 잠깐 바꾼 것은 파일에 적어 두어 도우미가 꺼졌다 켜져도 되돌림
 *     POST /prn/temp → { role, sec } 웹앱 인쇄 창(도우미 없이 브라우저 창으로 찍을 때)용 — sec초(최대 300) 뒤 또는 { end: 1 } 때 일반으로
 *   GET  /printer → 이 PC 주소창 전용 화면(큰 단추 3개 — 지금 기본을 일반·라벨·송장 중 하나로)
 * 인쇄: PowerShell + .NET PrintDocument — 프린터 이름 지정 · 용지 = 라벨 크기(mm) · 여백 0 · 장마다 그림 하나를 용지에 꽉 맞춤 · 창 없음(StandardPrintController)
 *   (1.1.0) /alps… — 📦 ALPS 자동 처리(같은 폴더 readnow-alps.js · 없으면 GitHub에서 받음) · GET /alps = 이 PC 설정 화면
 *   (정범님 11/05) /work… · /render — 🪟 수집 작업 창(같은 폴더 readnow-work.js · 없으면 GitHub에서 받음 · 웹앱 관리도구에서 PC별로 켤 때만 창을 다룸) · GET /work = 📊 수집 상태 창
 * 스스로 새 판: 6시간마다 GitHub에서 받아 판 번호가 높으면 바꾸고 끝남 → 실행기가 5초 뒤 다시 켬 */
'use strict';
const VERSION = '1.1.7'; // (1.1.7 정범님 11/05 수집 작업 창) readnow-work.js(작업 창·수집 상태 창·바깥 읽기 따로)를 불러 씀 · /work·/render // (1.1.6 정범님 11/05 '인쇄가 여전히 안 돼' — 연결 고치기가 'IP 못 찾음') 프린터 IP 찾기를 넓힘: 삼성 이름 SEC+MAC → 이 PC가 아는 기기 목록(ARP) · 이름으로 찾기 · 같은 망 한 번 훑기 · WSD 장치 목록 넓게 // (1.1.5 정범님 11/05 '일반 테스트가 안 돼') /prn/netfix = 네트워크(WSD) 프린터 연결 고치기 — IP 찾기 → 고정 IP 포트(관리자 허락 창 한 번) · 막힌 대기열 비우기 · 점검에 '연결 끊김' 알림 // (1.1.4 정범님 11/05 'MJ-MAIN 일반 프린터로 출력이 안 돼') /pdiag = 이 PC 인쇄 상태 점검(보기만 · 아무것도 바꾸지 않음) · /pdiag/test = 고른 프린터로 시험 한 장 // (1.1.3 정범님 11/04 원스톱) ALPS 처리 중에는 새 판 받기를 미룸 · /alps/pcheck(프린터 상태)·/alps/update // (1.1.2 정범님 11/03) /alps/journal(오늘 인쇄 기록)·/alps/unprint(안 나왔음으로 되돌리기) // (1.1.1 정범님 11/03) ALPS 「이어서 진행」(/alps/resume)·처리 기록(/alps/hist)
const http = require('http'), https = require('https'), fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const PORT = 8898; const HOME = __dirname; const RAW = 'https://raw.githubusercontent.com/jerrycson/readnow-scripts/main/local/readnow-print.js';
const ORIGINS = [/^https:\/\/jerrycson\.github\.io$/, /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/];
const LOG = path.join(HOME, 'print.log');
const RAW_ALPS = RAW.replace(/readnow-print\.js$/, 'readnow-alps.js'); const ALPS_F = path.join(HOME, 'readnow-alps.js');
const RAW_WORK = RAW.replace(/readnow-print\.js$/, 'readnow-work.js'); const WORK_F = path.join(HOME, 'readnow-work.js');
let WORK = null; const loadWork = () => { try { if (WORK && WORK.stop) WORK.stop(); } catch (e) {} try { delete require.cache[require.resolve(WORK_F)]; WORK = require(WORK_F); WORK.start({ log: (m) => log(m) }); } catch (e) { WORK = null; if (fs.existsSync(WORK_F)) log('작업 창 모듈 읽기 실패: ' + e.message); } }; /* (정범님 11/05) 🪟 — log가 아래에서 정해지므로 처음 불러오기는 log 뒤에서 */
let ALPS = null; const loadAlps = () => { try { delete require.cache[require.resolve(ALPS_F)]; ALPS = require(ALPS_F); } catch (e) { ALPS = null; if (fs.existsSync(ALPS_F)) log('ALPS 모듈 읽기 실패: ' + e.message); } }; loadAlps();
const log = (m) => { const line = `${new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 19).replace('T', ' ')} ${m}\n`; try { fs.appendFileSync(LOG, line); } catch (e) {} process.stdout.write(line); };
loadWork();
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

/* (1.1.4 정범님 11/05 'MJ-MAIN에서 일반 프린터로 출력이 안 돼 — 도우미가 문제인 듯') 이 PC 인쇄 상태 점검 — 보기만(설정·대기열·기본 프린터를 바꾸지 않음)
 *  읽는 것: 프린터마다 기본 여부·오프라인·상태·오류·포트·드라이버·대기열(작업마다 상태·장수·넣은 때 — 문서 이름은 읽지 않음) · 인쇄 스풀러 서비스 · 'Windows에서 기본 프린터 관리'(켜져 있으면 마지막에 쓴 프린터가 기본이 됨)
 *           최근 3일 인쇄 오류(윈도우 PrintService 기록) · 이 도우미 기록 끝 40줄 · ALPS 처리 중인지 · 크롬 ALPS 창·OZ 프로그램이 떠 있는지 */
async function pdiag() { const sc = `[Console]::OutputEncoding = [Text.Encoding]::UTF8
$o = [ordered]@{}
$o.printers = @(Get-CimInstance Win32_Printer | ForEach-Object { $n = $_.Name; $J = @(Get-CimInstance Win32_PrintJob | Where-Object { $_.Name -like ($n + ',*') }); [pscustomobject]@{ name = $n; def = [bool]$_.Default; off = [bool]$_.WorkOffline; st = [int]$_.PrinterStatus; err = [int]$_.DetectedErrorState; ext = [int]$_.ExtendedPrinterStatus; port = [string]$_.PortName; drv = [string]$_.DriverName; net = [bool]$_.Network; shared = [bool]$_.Shared; jobs = @($J | ForEach-Object { [pscustomobject]@{ st = [string]$_.JobStatus; stc = [int]$_.StatusMask; pages = [int]$_.TotalPages; at = [string]$_.TimeSubmitted } }) } })
try { $s = Get-Service Spooler; $o.spooler = [pscustomobject]@{ st = [string]$s.Status; start = [string]$s.StartType } } catch { $o.spooler = $_.Exception.Message }
try { $w = Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Windows' -ErrorAction Stop; $o.legacyDefault = $w.LegacyDefaultPrinterMode; $o.device = [string]$w.Device } catch { $o.legacyDefault = $null }
try { $o.events = @(Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-PrintService/Admin'; StartTime = (Get-Date).AddDays(-3) } -MaxEvents 30 -ErrorAction Stop | ForEach-Object { [pscustomobject]@{ at = $_.TimeCreated.ToString('MM-dd HH:mm'); id = $_.Id; lv = [string]$_.LevelDisplayName; msg = $(($m = ([string]$_.Message -replace '\\s+', ' ')).Substring(0, [Math]::Min(220, $m.Length))) } }) } catch { $o.events = @() }
try { $o.op = @(Get-WinEvent -FilterHashtable @{ LogName = 'Microsoft-Windows-PrintService/Operational'; StartTime = (Get-Date).AddDays(-1) } -MaxEvents 40 -ErrorAction Stop | ForEach-Object { [pscustomobject]@{ at = $_.TimeCreated.ToString('MM-dd HH:mm'); id = $_.Id; lv = [string]$_.LevelDisplayName } }) } catch { $o.op = $null }
$o.procs = @(Get-CimInstance Win32_Process | Where-Object { $_.Name -match '^(oz|OZ)|splwow64|PrintIsolationHost|printfilterpipelinesvc' -or ($_.Name -eq 'chrome.exe' -and [string]$_.CommandLine -match 'chrome-alps') } | ForEach-Object { [pscustomobject]@{ n = [string]$_.Name; alps = ([string]$_.CommandLine -match 'chrome-alps'); at = [string]$_.CreationDate } } | Select-Object -First 30)
$o | ConvertTo-Json -Depth 5 -Compress`;
  const r = await ps(sc, 90000); let x = null; try { x = JSON.parse(String(r.out || '').trim().split(/\r?\n/).filter(Boolean).pop()); } catch (e) { throw new Error('점검 결과를 못 읽음: ' + String(r.err || r.out || (r.e && r.e.message) || '').replace(/\s+/g, ' ').slice(0, 300)); }
  const arr = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]); x.printers = arr(x.printers).map((p) => ({ ...p, jobs: arr(p.jobs) })); x.events = arr(x.events); x.op = x.op == null ? null : arr(x.op); x.procs = arr(x.procs);
  let tail = []; try { tail = fs.readFileSync(LOG, 'utf8').split(/\r?\n/).filter(Boolean).slice(-40); } catch (e) {}
  let alps = null; try { const s = ALPS && ALPS.status && ALPS.status(); alps = s ? { status: s.status, step: s.step || null } : null; } catch (e) {}
  let cfgP = null; try { const c = ALPS && ALPS.cfg && ALPS.cfg(); cfgP = c ? { printer: c.printer || '', silentPrint: c.silentPrint !== false, forcePrinter: !!c.forcePrinter, autoPrintDlg: c.autoPrintDlg !== false } : null; } catch (e) {}
  const P = x.printers; const def = P.find((p) => p.def); const hints = []; const PRN_ERR = { 4: '용지 없음', 6: '토너·리본 없음', 7: '덮개 열림', 8: '용지 걸림', 9: '오프라인', 10: '점검 필요', 11: '배출구 가득' };
  const isLabel = (n) => /롯데|택배|라벨|label|zebra|tsc|godex|xprinter|bixolon|sewoo|zd\d|gk\d|lp-?\d/i.test(String(n || ''));
  if (x.spooler && x.spooler.st && x.spooler.st !== 'Running') hints.push({ lv: 'bad', t: `인쇄 스풀러(윈도우 인쇄 서비스)가 '${x.spooler.st}' — 이러면 모든 프린터가 인쇄를 못 함` });
  if (!def) hints.push({ lv: 'bad', t: '윈도우 기본 프린터가 없음' }); else if (isLabel(def.name)) hints.push({ lv: 'bad', t: `윈도우 기본 프린터가 '${def.name}'(택배·라벨 프린터로 보임) — 일반 문서가 그쪽으로 감` });
  if (x.legacyDefault == null || +x.legacyDefault === 0) hints.push({ lv: 'warn', t: "'Windows에서 기본 프린터 관리'가 켜져 있음 — 마지막에 쓴 프린터가 저절로 기본이 됨(택배 송장을 찍은 뒤 일반 인쇄가 택배 프린터로 갈 수 있음)" });
  for (const p of P) { const why = []; if (p.off) why.push('오프라인(연결 끊김으로 봄)'); if (p.st === 7) why.push('상태 오프라인'); if (p.st === 6) why.push('일시 정지'); if (PRN_ERR[p.err]) why.push(PRN_ERR[p.err]); const badJ = p.jobs.filter((j) => /error|오류|paused|일시|offline|blocked|deleting|삭제/i.test(j.st || '') || (+j.stc & (2 | 4 | 32 | 64 | 512 | 1024)));
    const oldJ = p.jobs.filter((j) => { const t = Date.parse(String(j.at || '').replace(/^(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2')); return t && Date.now() - t > 2 * 60e3; }); if (/^WSD-/i.test(p.port || '') && (badJ.length || oldJ.length)) { why.push('네트워크(WSD) 연결이 끊긴 듯 — 작업이 프린터로 안 넘어감(🩺 연결 고치기)'); p.netBad = true; } if (badJ.length) why.push(`대기열에 오류·멈춘 작업 ${badJ.length}개`); else if (p.jobs.length) why.push(`대기열에 남은 작업 ${p.jobs.length}개`); if (why.length) hints.push({ lv: badJ.length || p.off || p.st === 6 || p.st === 7 ? 'bad' : 'warn', t: `'${p.name}': ${why.join(' · ')}` }); }
  const evErr = x.events.filter((e) => /오류|error|경고|warn/i.test(e.lv || '')); if (evErr.length) hints.push({ lv: 'warn', t: `최근 3일 윈도우 인쇄 오류 기록 ${evErr.length}개 — 맨 끝: ${evErr[0].at} #${evErr[0].id} ${String(evErr[0].msg || '').slice(0, 120)}` });
  if (alps && !['done', 'error', 'idle'].includes(alps.status)) hints.push({ lv: 'warn', t: `ALPS 자동 처리가 지금 '${alps.status}' — 처리 중에는 도우미가 '인쇄' 창을 찾아 프린터를 '${(cfgP && cfgP.printer) || '롯데택배'}'로 바꿀 수 있음(그때 연 다른 인쇄 창도 바뀔 수 있음)` });
  if (!hints.length) hints.push({ lv: 'ok', t: '눈에 띄는 문제 없음 — 그 프로그램의 인쇄 창에서 고른 프린터 이름을 확인하고, 아래 「시험 한 장」으로 그 프린터를 시험해 보세요' });
  return { ok: true, ver: VERSION, alpsVer: ALPS ? ALPS.VERSION : null, pc: os.hostname(), at: new Date().toISOString(), hints, def: def ? def.name : null, ...x, alps, alpsCfg: cfgP, tail }; }
async function pdiagTest(printer) { printer = String(printer || '').trim(); const P = await printers(); if (!P.some((x) => x.name === printer)) throw new Error(`이 PC에 '${printer}' 프린터가 없음`);
  const sc = `Add-Type -AssemblyName System.Drawing
$pd = New-Object System.Drawing.Printing.PrintDocument
$pd.PrinterSettings.PrinterName = ${psq(printer)}
if (-not $pd.PrinterSettings.IsValid) { Write-Error 'NOPRINTER'; exit 3 }
$pd.DocumentName = '리드나우 시험 인쇄'
$pd.PrintController = New-Object System.Drawing.Printing.StandardPrintController
$pd.add_PrintPage({ param($s, $e) $f = New-Object System.Drawing.Font('Malgun Gothic', 16); $e.Graphics.DrawString(('리드나우 시험 인쇄 — ' + ${psq(printer)} + [Environment]::NewLine + (Get-Date).ToString('yyyy-MM-dd HH:mm:ss') + [Environment]::NewLine + '이 종이가 나오면 윈도우에서 이 프린터로 인쇄가 됩니다'), $f, [System.Drawing.Brushes]::Black, 60, 60); $e.HasMorePages = $false })
$pd.Print()
Write-Output 'OK'`;
  const r = await ps(sc, 120000); if (r.e || !/OK/.test(r.out)) throw new Error(/NOPRINTER/.test(r.err) ? `'${printer}' 프린터를 열 수 없음` : '시험 인쇄 실패: ' + String(r.err || (r.e && r.e.message) || r.out).replace(/\s+/g, ' ').slice(0, 300)); log(`🧪 시험 한 장 → ${printer}`); return true; }
/* (1.1.4) 이 PC 프린터 세 역할 · 기본 프린터 바꾸기 — 라벨(웹앱 라벨)·송장(ALPS)은 이름으로 곧장 보내므로 기본 프린터와 상관없음 · 기본 = 다른 프로그램(한글·워드·PDF·크롬 인쇄 창 첫 값)이 쓰는 것 */
const ROLES_F = path.join(HOME, 'prn-roles.json');
function rolesGet() { let r = {}; try { r = JSON.parse(fs.readFileSync(ROLES_F, 'utf8')); } catch (e) {} try { const c = ALPS && ALPS.cfg && ALPS.cfg(); if (c && c.printer && !r.invoice) r.invoice = c.printer; } catch (e) {} return { general: r.general || '', label: r.label || '', invoice: r.invoice || '', auto: r.auto !== false, at: r.at || null, temp: r.temp || null }; }
function rolesSet(o) { const r = { ...rolesGet() }; for (const k of ['general', 'label', 'invoice']) if (o[k] != null) r[k] = String(o[k]).trim().slice(0, 200); if (o.auto != null) r.auto = !!o.auto; let old = {}; try { old = JSON.parse(fs.readFileSync(ROLES_F, 'utf8')); } catch (e) {} if (old.temp) r.temp = old.temp; else delete r.temp; r.at = new Date().toISOString(); fs.writeFileSync(ROLES_F, JSON.stringify(r, null, 1)); try { if (o.invoice != null && r.invoice && ALPS && ALPS.setCfg) ALPS.setCfg({ printer: r.invoice }); } catch (e) {} log(`🖨 프린터 역할: 일반 '${r.general}' · 라벨 '${r.label}' · 송장 '${r.invoice}'`); return r; }
const psFindP = (printer) => `$p = Get-CimInstance Win32_Printer | Where-Object { $_.Name -eq ${psq(printer)} } | Select-Object -First 1\nif (-not $p) { Write-Error 'NOPRINTER'; exit 3 }\n`;
async function prnAct(act, o) { const printer = String((o && o.printer) || '').trim(); if (!printer) throw new Error('프린터를 고르지 않음');
  let sc = '[Console]::OutputEncoding = [Text.Encoding]::UTF8\n' + psFindP(printer);
  if (act === 'default') sc += `${o.keep !== false ? "Set-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Windows' -Name LegacyDefaultPrinterMode -Value 1 -Type DWord\n" : ''}$r = Invoke-CimMethod -InputObject $p -MethodName SetDefaultPrinter\nStart-Sleep -Milliseconds 600\n$d = Get-CimInstance Win32_Printer | Where-Object { $_.Default } | Select-Object -First 1\nWrite-Output ('OK|' + $r.ReturnValue + '|' + $d.Name)`;
  else if (act === 'resume') sc += `$r = Invoke-CimMethod -InputObject $p -MethodName Resume\nWrite-Output ('OK|' + $r.ReturnValue + '|')`;
  else if (act === 'clear') sc += `$J = @(Get-CimInstance Win32_PrintJob | Where-Object { $_.Name -like ($p.Name + ',*') -and (([int]$_.StatusMask -band (2 -bor 4 -bor 32 -bor 64 -bor 512 -bor 1024)) -or ([string]$_.JobStatus -match 'Error|오류|Paused|일시|Offline|Blocked')) })\n$n = 0; foreach ($j in $J) { try { Remove-CimInstance -InputObject $j -ErrorAction Stop; $n++ } catch {} }\nWrite-Output ('OK|' + $n + '|' + $J.Count)`;
  else throw new Error('모르는 일');
  const r = await ps(sc, 60000); const m = String(r.out || '').match(/OK\|([^|\r\n]*)\|([^\r\n]*)/); if (!m) throw new Error(/NOPRINTER/.test(r.err) ? `이 PC에 '${printer}' 프린터가 없음` : '실패: ' + String(r.err || (r.e && r.e.message) || r.out).replace(/\s+/g, ' ').slice(0, 300));
  if (act === 'default') { const now = m[2].trim(); if (now !== printer) throw new Error(`윈도우가 기본을 바꾸지 않음(지금 기본 '${now}' · 돌려준 값 ${m[1]})`); log(`⭐ 윈도우 기본 프린터 → ${printer}${o.keep !== false ? " · 'Windows에서 기본 프린터 관리' 끔" : ''}`); return { ok: true, def: now }; }
  if (act === 'resume') { log(`▶ 프린터 다시 시작 → ${printer} (${m[1]})`); return { ok: +m[1] === 0, code: +m[1] }; }
  log(`🧹 ${printer}: 오류·멈춘 작업 ${m[1]}/${m[2]}개 취소`); return { ok: true, n: +m[1], of: +m[2] }; }
function prnPageHtml() { return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>리드나우 프린터</title><style>body{font-family:'Malgun Gothic',sans-serif;margin:0;padding:18px;background:#f6f7f9;color:#222}h1{font-size:20px;margin:0 0 4px}.h{color:#666;font-size:13px;margin:0 0 14px}.r{display:flex;gap:10px;flex-wrap:wrap}.b{flex:1 1 200px;border:2px solid #ccd;border-radius:14px;background:#fff;padding:16px;font-size:17px;cursor:pointer;text-align:left}.b small{display:block;color:#666;font-size:12px;margin-top:4px}.b.on{border-color:#2a7;background:#eefaf2}.b:disabled{opacity:.5}#m{margin-top:14px;font-size:14px;min-height:20px}#d{margin-top:8px;font-size:13px;color:#555}</style></head><body>
<h1>🖨 이 PC 기본 프린터</h1><p class="h">누르면 윈도우 기본 프린터가 바로 바뀝니다(다른 프로그램 인쇄에 쓰임). 라벨·송장은 리드나우가 이름으로 따로 보내므로 기본이 '일반'이어도 그대로 나옵니다. 역할(어느 프린터가 일반·라벨·송장인지)은 웹앱 ⚙ 라벨 인쇄 설정 › 🖨 이 PC 프린터 3개에서 정합니다.</p>
<div class="r" id="r"></div><div id="m"></div><div id="d"></div>
<script>const H={'X-RN-Print':'1','Content-Type':'application/json'};const NM={general:'📄 일반',label:'🏷 라벨',invoice:'🚚 송장'};
async function load(){const a=await (await fetch('/prn/roles',{headers:H})).json();const p=await (await fetch('/printers',{headers:H})).json();const def=((p.printers||[]).find(x=>x.def)||{}).name||'';const R=a.roles||{};
document.getElementById('r').innerHTML=Object.keys(NM).map(k=>{const n=R[k]||'';return '<button class="b'+(n&&n===def?' on':'')+'" data-k="'+k+'" '+(n?'':'disabled')+'>'+NM[k]+(n&&n===def?' ✓ 지금 기본':'')+'<small>'+(n?n.replace(/</g,'&lt;'):'아직 안 정함 — 웹앱에서 정하기')+'</small></button>';}).join('');
document.getElementById('d').textContent='지금 윈도우 기본: '+(def||'(없음)');document.querySelectorAll('[data-k]').forEach(b=>b.onclick=async()=>{const n=R[b.dataset.k];document.getElementById('m').textContent='바꾸는 중…';const r=await (await fetch('/prn/default',{method:'POST',headers:H,body:JSON.stringify({printer:n,keep:true})})).json();document.getElementById('m').textContent=r.ok?'✅ 기본 프린터 → '+n:'✗ '+(r.err||'실패');load();});}
load();</script></body></html>`; }
/* (1.1.4) 자동 바꾸기 — want = 지금 기본이어야 할 역할(라벨 인쇄 중 'label' · ALPS 처리 중 'invoice' · 웹앱 인쇄 창 'label' 등 · 없으면 'general') · 3초마다 맞춤(바꿀 때만 PowerShell) */
const alpsPrinting = () => { try { const x = ALPS && ALPS.status && ALPS.status(); return !!(x && x.status === 'run' && x.step === 'print'); } catch (e) { return false; } }; /* 송장으로 바꾸는 때 = ALPS가 '인쇄' 단계를 돌리는 동안만(사람 답을 기다리는 동안·접수 단계는 일반 그대로 — 그 사이 다른 인쇄가 송장으로 가지 않게) */
const TEMP = { label: 0, web: null }; let PRN_CUR = null, PRN_BUSY = false, PRN_FAIL = 0;
function prnWant(R) { if (TEMP.label > 0) return 'label'; if (alpsPrinting()) return 'invoice'; if (TEMP.web && Date.now() < TEMP.web.until) return TEMP.web.role; return 'general'; }
async function prnSync() { if (PRN_BUSY) return; const R = rolesGet(); if (R.auto === false || !R.general) return; const want = prnWant(R); const name = R[want] || R.general; let rf = {}; try { rf = JSON.parse(fs.readFileSync(ROLES_F, 'utf8')); } catch (e) {}
  if (want === 'general' && !rf.temp && PRN_CUR == null) return; /* 바꾼 적이 없으면 손대지 않음(사람이 /printer·윈도우 설정에서 고른 기본을 존중) */
  if (PRN_CUR === name) { if (want === 'general' && rf.temp) { delete rf.temp; try { fs.writeFileSync(ROLES_F, JSON.stringify(rf, null, 1)); } catch (e) {} PRN_CUR = null; } return; }
  if (PRN_FAIL >= 3 && Date.now() - (prnSync.failAt || 0) < 60e3) return; PRN_BUSY = true;
  try { await prnAct('default', { printer: name, keep: true }); PRN_CUR = name; PRN_FAIL = 0; if (want !== 'general') { rf.temp = { role: want, printer: name, at: new Date().toISOString() }; } else delete rf.temp; try { fs.writeFileSync(ROLES_F, JSON.stringify(rf, null, 1)); } catch (e) {} log(`🔁 자동 바꾸기: 기본 프린터 = ${want === 'general' ? '일반' : want === 'label' ? '라벨' : '송장'} '${name}'`); if (want === 'general') PRN_CUR = null; }
  catch (e) { PRN_FAIL++; prnSync.failAt = Date.now(); log('✗ 자동 바꾸기 실패: ' + e.message); } finally { PRN_BUSY = false; } }
async function prnUse(role, fn) { const R = rolesGet(); if (R.auto === false || !R.general || !R[role]) return fn(); if (role === 'label') TEMP.label++; try { await prnSync(); return await fn(); } finally { if (role === 'label') TEMP.label = Math.max(0, TEMP.label - 1); setTimeout(() => prnSync(), 1500); } }
if (process.platform === 'win32') { setInterval(() => prnSync().catch(() => {}), 3000); setTimeout(() => { try { const rf = JSON.parse(fs.readFileSync(ROLES_F, 'utf8')); if (rf.temp) { PRN_CUR = rf.temp.printer; log(`도우미가 켜짐 — 지난번 잠깐 바꾼 기본(${rf.temp.printer})을 일반으로 되돌림`); } } catch (e) {} }, 500); }
/* (1.1.5 정범님 11/05 '일반 테스트가 안 돼 — 나머진 돼') 네트워크 프린터 연결 고치기 — MJ-PC 삼성 C56x는 WSD(네트워크 자동 연결) 포트라 작업이 대기열 '인쇄 중'에 걸린 채 프린터로 안 넘어감(라벨·송장은 USB라 됨)
 *  ① 그 프린터의 IP를 찾음(PnP 장치 속성 DEVPKEY_PNPX_IpAddress · 이름이 같은 장치) ② 그 IP가 응답하는지(ping) ③ 관리자 허락 창(UAC) 한 번 → 고정 IP 포트(IP_주소 · 9100 RAW) 만들고 프린터 포트를 그리로 · 인쇄 서비스 다시 시작(막힌 작업 풀림)
 *  지우지 않음: 예전 WSD 포트는 그대로 둠(되돌리기 = 프린터 속성에서 포트만 다시 고름 · /prn/netfix { undo:1 }) · ALPS 처리 중이면 하지 않음 */
async function prnNetFix(o) { const printer = String((o && o.printer) || '').trim(); if (!printer) throw new Error('프린터를 고르지 않음'); if (alpsBusy()) throw new Error('ALPS 처리 중 — 끝난 뒤에(인쇄 서비스를 다시 시작하므로)');
  const find = `[Console]::OutputEncoding = [Text.Encoding]::UTF8
$name = ${psq(printer)}
$p = Get-Printer -Name $name -ErrorAction Stop
$port = Get-PrinterPort -Name $p.PortName -ErrorAction SilentlyContinue
$ips = @()
foreach ($d in @(Get-PnpDevice -ErrorAction SilentlyContinue | Where-Object { $_.FriendlyName -and ($_.FriendlyName -eq $name -or $name.StartsWith($_.FriendlyName) -or $_.FriendlyName.StartsWith(($name -split '\\(')[0])) })) { try { $v = (Get-PnpDeviceProperty -InstanceId $d.InstanceId -KeyName 'DEVPKEY_PNPX_IpAddress' -ErrorAction Stop).Data; if ($v) { $ips += @($v) } } catch {} }
if ($port -and $port.PrinterHostAddress) { $ips += $port.PrinterHostAddress }
foreach ($d in @(Get-PnpDevice -ErrorAction SilentlyContinue | Where-Object { [string]$_.InstanceId -match 'WSD|DAFWSD|PRINTENUM' -and [string]$_.FriendlyName -match 'SEC|Samsung|C56|Xerox|HP|Canon|Epson|Brother' })) { try { $v = (Get-PnpDeviceProperty -InstanceId $d.InstanceId -KeyName 'DEVPKEY_PNPX_IpAddress' -ErrorAction Stop).Data; if ($v) { $ips += @($v) } } catch {} }
$mac = $null; if ($name -match 'SEC([0-9A-Fa-f]{12})') { $h = $matches[1].ToUpper(); $mac = ($h -replace '(..)(?=.)', '$1-') }
$how = @()
if ($mac) { $nb = @(Get-NetNeighbor -LinkLayerAddress $mac -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.State -ne 'Unreachable' }); if ($nb.Count) { $ips += @($nb | ForEach-Object { $_.IPAddress }); $how += 'ARP' } }
if (-not $ips.Count) { foreach ($hn in @(($name -split '\\(')[0].Trim(), (($name -split '\\(')[0].Trim() + '.local'))) { try { $a = [System.Net.Dns]::GetHostAddresses($hn) | Where-Object { $_.AddressFamily -eq 'InterNetwork' }; if ($a) { $ips += @($a | ForEach-Object { $_.IPAddressToString }); $how += 'NAME' } } catch {} } }
if (-not $ips.Count -and $mac) { $me = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch '^(127|169\\.254)\\.' -and $_.PrefixLength -ge 16 } | Select-Object -First 1
  if ($me) { $pre = ($me.IPAddress -split '\\.')[0..2] -join '.'; $tasks = @(); foreach ($i in 1..254) { $pg = New-Object System.Net.NetworkInformation.Ping; $tasks += $pg.SendPingAsync("$pre.$i", 300) }; try { [System.Threading.Tasks.Task]::WaitAll($tasks, 8000) | Out-Null } catch {}
    Start-Sleep -Milliseconds 500; $nb = @(Get-NetNeighbor -LinkLayerAddress $mac -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.State -ne 'Unreachable' }); if ($nb.Count) { $ips += @($nb | ForEach-Object { $_.IPAddress }); $how += 'SCAN' } } }
$ips = @($ips | Where-Object { $_ -match '^\\d+\\.\\d+\\.\\d+\\.\\d+$' } | Select-Object -Unique)
$alive = @($ips | Where-Object { (Test-Connection -ComputerName $_ -Count 1 -Quiet -ErrorAction SilentlyContinue) -or ($mac -and (Get-NetNeighbor -IPAddress $_ -ErrorAction SilentlyContinue | Where-Object { $_.LinkLayerAddress -eq $mac -and $_.State -ne 'Unreachable' })) })
[pscustomobject]@{ port = [string]$p.PortName; ips = $ips; alive = $alive; mac = $mac; how = ($how -join ',') } | ConvertTo-Json -Compress`;
  const r = await ps(find, 60000); let x = null; try { x = JSON.parse(String(r.out || '').trim().split(/\r?\n/).filter(Boolean).pop()); } catch (e) { throw new Error('프린터 정보를 못 읽음: ' + String(r.err || r.out).replace(/\s+/g, ' ').slice(0, 200)); }
  const ips = [].concat(x.ips || []), alive = [].concat(x.alive || []); log(`🩺 ${printer}: 포트 ${x.port} · IP ${ips.join(',') || '못 찾음'}${x.how ? '(' + x.how + ')' : ''}${x.mac ? ' · MAC ' + x.mac : ''} · 응답 ${alive.join(',') || '없음'}`);
  if (!ips.length) return { ok: false, step: 'ip', port: x.port, why: `이 프린터의 IP 주소를 찾지 못함${x.mac ? `(같은 망을 훑어도 MAC ${x.mac} 기기가 응답하지 않음 — 프린터가 꺼졌거나 다른 와이파이·공유기에 붙어 있음)` : ''} — 프린터 전원·네트워크를 확인해 주세요`, ips, alive, mac: x.mac || null };
  if (!alive.length) return { ok: false, step: 'ping', port: x.port, why: `프린터 IP ${ips.join(', ')}가 응답하지 않음 — 프린터 전원·네트워크(같은 와이파이·공유기)를 확인해 주세요`, ips, alive };
  const ip = alive[0]; const pn = 'IP_' + ip; if (x.port === pn) { /* 이미 고정 IP — 대기열만 풂 */ }
  const el = `$ErrorActionPreference = 'Stop'; if (-not (Get-PrinterPort -Name '${pn}' -ErrorAction SilentlyContinue)) { Add-PrinterPort -Name '${pn}' -PrinterHostAddress '${ip}' }; Set-Printer -Name ${psq(printer)} -PortName '${pn}'; Restart-Service Spooler -Force`;
  const sc = `$a = Start-Process powershell.exe -Verb RunAs -WindowStyle Hidden -Wait -PassThru -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-EncodedCommand','${Buffer.from(el, 'utf16le').toString('base64')}')
Write-Output ('OK|' + $a.ExitCode)`;
  const r2 = await ps(sc, 180000); const m = String(r2.out || '').match(/OK\|(-?\d+)/); if (!m) return { ok: false, step: 'uac', ip, why: /canceled|취소/i.test(String(r2.err)) ? 'PC에 뜬 관리자 허락 창에서 [예]를 눌러 주세요(아니요를 누르면 바꾸지 않음)' : '바꾸지 못함: ' + String(r2.err || r2.out).replace(/\s+/g, ' ').slice(0, 200) };
  await new Promise((res) => setTimeout(res, 3000)); let now = ''; try { const r3 = await ps(`(Get-Printer -Name ${psq(printer)}).PortName`, 30000); now = String(r3.out || '').trim(); } catch (e) {}
  log(`🩺 ${printer}: 포트 ${x.port} → ${now || '?'} (종료 ${m[1]}) · 인쇄 서비스 다시 시작`); return { ok: now === pn, ip, from: x.port, to: now, code: +m[1], why: now === pn ? '' : '포트가 바뀌지 않음(관리자 허락 창에서 아니요였거나 막힘)' }; }
function readBody(req, max, cb) { const bufs = []; let n = 0, bad = false; req.on('data', (c) => { n += c.length; if (n > max) { bad = true; req.destroy(); } else bufs.push(c); }); req.on('end', () => (bad ? cb(new Error('너무 큼')) : cb(null, Buffer.concat(bufs)))); req.on('error', cb); }
const srv = http.createServer((req, res) => {
  const org = req.headers.origin || ''; const okOrg = !org || ORIGINS.some((r) => r.test(org)); const host = String(req.headers.host || '');
  const H = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...(org && okOrg ? { 'Access-Control-Allow-Origin': org, 'Vary': 'Origin', 'Access-Control-Allow-Headers': 'Content-Type, X-RN-Print', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Private-Network': 'true' } : {}) };
  const J = (code, o) => { res.writeHead(code, H); res.end(JSON.stringify(o)); };
  /* (정범님 11/05) 🪟 작업 창·🖼 그려 읽기 — 이 PC 수집기(Tampermonkey · chrome-extension 출처)와 수집 상태 창(같은 출처)만 · 출처 검사는 모듈이 함(웹앱·알라딘 화면은 못 부름) */
  { const pn = String(req.url || '').split('?')[0]; if (/^\/(work(\/|$)|render$)/.test(pn)) { if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) { res.writeHead(403, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end('{"ok":false}'); } if (!WORK) { res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify({ ok: false, nohelper: true, err: '작업 창 모듈이 아직 없음 — 1분 뒤 다시(도우미가 GitHub에서 받음)' })); } return WORK.api(req, res, new URL(req.url, 'http://127.0.0.1'), { readBody, log }); } }
  if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host) || !okOrg) return J(403, { ok: false, err: '이 PC의 리드나우 웹앱만' });
  if (req.method === 'OPTIONS') { res.writeHead(204, H); return res.end(); }
  const u = new URL(req.url, 'http://127.0.0.1');
  if (u.pathname === '/status') return J(200, { ok: true, ver: VERSION, pc: os.hostname(), alps: ALPS ? ALPS.VERSION : null, work: WORK ? WORK.VERSION : null });
  if (u.pathname === '/alps' && req.method === 'GET') { if (org || !ALPS) return J(org ? 403 : 503, { ok: false, err: org ? '이 PC 브라우저 주소창에서만' : 'ALPS 모듈이 아직 없음(1분 안에 받음)' }); res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "frame-ancestors 'none'" }); return res.end(ALPS.pageHtml()); }
  if (u.pathname === '/printer' && req.method === 'GET') { if (org) return J(403, { ok: false, err: '이 PC 브라우저 주소창에서만' }); res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "frame-ancestors 'none'" }); return res.end(prnPageHtml()); }
  if (req.headers['x-rn-print'] !== '1') return J(403, { ok: false, err: 'X-RN-Print 머리가 없음' });
  if (u.pathname.startsWith('/alps/')) return alpsApi(req, res, u, org, J);
  if (u.pathname === '/pdiag') return pdiag().then((r) => { log('🔎 인쇄 상태 점검: ' + r.hints.map((h) => h.t).join(' / ').slice(0, 300)); J(200, r); }).catch((e) => J(500, { ok: false, err: e.message }));
  if (u.pathname === '/pdiag/test' && req.method === 'POST') return readBody(req, 4096, (e, b) => { let o = {}; try { o = JSON.parse(b.toString('utf8') || '{}'); } catch (x) {} pdiagTest(o.printer).then(() => J(200, { ok: true })).catch((er) => J(500, { ok: false, err: er.message })); });
  if (u.pathname === '/prn/roles') { if (req.method === 'POST') return readBody(req, 4096, (e, b) => { let o = {}; try { o = JSON.parse(b.toString('utf8') || '{}'); } catch (x) {} try { J(200, { ok: true, roles: rolesSet(o) }); } catch (er) { J(500, { ok: false, err: er.message }); } }); return J(200, { ok: true, roles: rolesGet() }); }
  if (u.pathname === '/prn/temp' && req.method === 'POST') return readBody(req, 4096, (e, b) => { let o = {}; try { o = JSON.parse(b.toString('utf8') || '{}'); } catch (x) {} if (o.end) TEMP.web = null; else if (['label', 'invoice', 'general'].includes(o.role)) TEMP.web = { role: o.role, until: Date.now() + Math.max(5, Math.min(300, +o.sec || 120)) * 1000 }; prnSync().then(() => J(200, { ok: true, want: prnWant(rolesGet()), roles: rolesGet() })).catch((er) => J(500, { ok: false, err: er.message })); });
  if (u.pathname === '/prn/netfix' && req.method === 'POST') return readBody(req, 4096, (e, b) => { let o = {}; try { o = JSON.parse(b.toString('utf8') || '{}'); } catch (x) {} prnNetFix(o).then((r) => J(200, r)).catch((er) => { log('✗ ' + er.message); J(500, { ok: false, err: er.message }); }); });
  if (/^\/prn\/(default|resume|clear)$/.test(u.pathname) && req.method === 'POST') return readBody(req, 4096, (e, b) => { let o = {}; try { o = JSON.parse(b.toString('utf8') || '{}'); } catch (x) {} prnAct(u.pathname.slice(5), o).then((r) => J(200, r)).catch((er) => { log('✗ ' + er.message); J(500, { ok: false, err: er.message }); }); });
  if (u.pathname === '/printers') return printers().then((L) => J(200, { ok: true, printers: L })).catch((e) => J(500, { ok: false, err: e.message }));
  if (u.pathname === '/print' && req.method === 'POST') return readBody(req, 60 * 1048576, (e, b) => { if (e) return J(400, { ok: false, err: e.message }); let o = null; try { o = JSON.parse(b.toString('utf8')); } catch (x) { return J(400, { ok: false, err: 'bad json' }); }
    prnUse('label', () => printImgs(o)).then((n) => J(200, { ok: true, n })).catch((er) => { log('✗ ' + er.message); J(500, { ok: false, err: er.message }); }); });
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
function workUpdate() { https.get(RAW_WORK + '?t=' + Date.now(), { timeout: 20000 }, (r) => { if (r.statusCode !== 200) { r.resume(); return; } let b = ''; r.setEncoding('utf8'); r.on('data', (c) => (b += c)); r.on('end', () => { const v = (b.match(/const VERSION = '([\d.]+)'/) || [])[1]; const n = (x) => String(x || '0').split('.').reduce((a, y) => a * 1000 + (+y || 0), 0); if (!v || (WORK && n(v) <= n(WORK.VERSION))) return;
  const tmp = path.join(HOME, 'readnow-work.new.js'); fs.writeFileSync(tmp, b); const chk = cp.spawnSync(process.execPath, ['--check', tmp]); if (chk.status !== 0) { log(`작업 창 모듈 새 판 ${v} 검사 실패 — 그대로 둠`); return; } fs.renameSync(tmp, WORK_F); loadWork(); log(`작업 창 모듈 ${v}로 바꿈`); }); }).on('error', () => {}).on('timeout', function () { this.destroy(); }); }
if (!process.env.RN_PRINT_NOUPDATE) { setTimeout(workUpdate, WORK ? 120e3 : 8e3); setInterval(workUpdate, 6 * 3600e3); }
if (!process.env.RN_PRINT_NOUPDATE) { setTimeout(selfUpdate, 60e3); setInterval(selfUpdate, 6 * 3600e3); setTimeout(alpsUpdate, ALPS ? 90e3 : 5e3); setInterval(alpsUpdate, 6 * 3600e3); }
