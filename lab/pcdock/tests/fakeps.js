#!/usr/bin/env node
/* fakeps.js — 시험용 가짜 PowerShell(리눅스 상자엔 윈도우가 없어서) · pcdock.ps1과 같은 인자(-Act …)·표준 입력 JSON을 받아 정해 둔 답을 줌
 *  받은 것은 FAKE_LOG(있으면)에 한 줄씩 적음 → 시험이 '무엇을 넘겼나'를 봄
 *  모니터 셋: ① 주 1920×1080(100%) ② 오른쪽 2560×1080 울트라와이드(100%) ③ 왼쪽 위 3840×2160(150%) */
'use strict';
const fs = require('fs');
const a = process.argv.slice(2); const act = a[a.indexOf('-Act') + 1]; const on = a.includes('-On') ? +a[a.indexOf('-On') + 1] : -1;
let input = ''; process.stdin.on('data', (d) => (input += d)); process.stdin.on('end', () => {
  let j = {}; try { j = JSON.parse(input || '{}'); } catch (e) {}
  if (process.env.FAKE_LOG) fs.appendFileSync(process.env.FAKE_LOG, JSON.stringify({ act, on, input: j }) + '\n');
  /* (0.1.3) 모니터 셋 고르기 FAKE_MONS = one(1대 100%) · two125(2대 · 125%) · three150(기본 3대 · 150% 섞임) · mix(1대 100% + 1대 125% + 1대 150%)
   *  FAKE_SCREENS = fail(C# 엮기 실패 흉내) · empty(0대) · bom(답 앞에 BOM) · crash(JSON 없이 끝남) */
  const SETS = {
    one: [{ id: '\\\\.\\DISPLAY1', primary: true, b: { x: 0, y: 0, w: 1920, h: 1080 }, wa: { x: 0, y: 0, w: 1920, h: 1032 }, dpi: 96 }],
    two125: [{ id: '\\\\.\\DISPLAY1', primary: true, b: { x: 0, y: 0, w: 2560, h: 1440 }, wa: { x: 0, y: 0, w: 2560, h: 1380 }, dpi: 120 }, { id: '\\\\.\\DISPLAY2', primary: false, b: { x: 2560, y: 0, w: 1920, h: 1080 }, wa: { x: 2560, y: 0, w: 1920, h: 1032 }, dpi: 120 }],
    mix: [{ id: '\\\\.\\DISPLAY1', primary: true, b: { x: 0, y: 0, w: 1920, h: 1080 }, wa: { x: 0, y: 0, w: 1920, h: 1040 }, dpi: 96 }, { id: '\\\\.\\DISPLAY2', primary: false, b: { x: 1920, y: 0, w: 2560, h: 1440 }, wa: { x: 1920, y: 0, w: 2560, h: 1392 }, dpi: 120 }, { id: '\\\\.\\DISPLAY3', primary: false, b: { x: 4480, y: 0, w: 3840, h: 2160 }, wa: { x: 4480, y: 0, w: 3840, h: 2100 }, dpi: 144 }] };
  const SCR = process.env.FAKE_SCREENS || '';
  if (process.env.FAKE_OLD_PID && act === 'stopold') { try { process.kill(+process.env.FAKE_OLD_PID); } catch (e) {} process.stdout.write(JSON.stringify({ ok: true, act, stopped: 1 }) + '\n'); return; }
  if (SCR === 'fail') { process.stdout.write(JSON.stringify({ ok: false, act, err: "준비 실패: C# 글(pcdock-win.cs)을 엮지 못함 — c:\\Users\\someone\\AppData\\Local\\Temp\\x.cs(122) : 'RnDock.Front(long)'에 가장 잘 맞는 메서드에 잘못된 인수가 있습니다." }) + '\n'); return; }
  if (SCR === 'crash') { process.stderr.write('PowerShell이 멈춤\n'); process.exitCode = 1; return; }
  const MONS0 = [
    { id: '\\\\.\\DISPLAY1', primary: true, b: { x: 0, y: 0, w: 1920, h: 1080 }, wa: { x: 0, y: 0, w: 1920, h: 1040 }, dpi: 96 },
    { id: '\\\\.\\DISPLAY2', primary: false, b: { x: 1920, y: 0, w: 2560, h: 1080 }, wa: { x: 1920, y: 0, w: 2560, h: 1080 }, dpi: 96 },
    { id: '\\\\.\\DISPLAY3', primary: false, b: { x: -3840, y: -500, w: 3840, h: 2160 }, wa: { x: -3840, y: -500, w: 3840, h: 2100 }, dpi: 144 }];
  const MONS = SETS[process.env.FAKE_MONS] || MONS0;
  const SF = process.env.FAKE_STARTUP; const out = (o) => { process.stdout.write((SCR === 'bom' ? '\ufeff' : '준비 글\n') + JSON.stringify({ ok: true, act, aware: 'pmv2', ...o }) + '\n'); };
  if (act === 'screens') return out({ mons: SCR === 'empty' ? [] : MONS, build: 22631 });
  if (act === 'windows') return out({ mons: MONS, wins: [
    { h: 101, pid: 10, proc: 'chrome', cls: 'Chrome_WidgetWin_1', title: '리드나우 — Chrome' }, { h: 102, pid: 12, proc: 'claude', cls: 'Chrome_WidgetWin_1', title: 'Claude' },
    { h: 103, pid: 13, proc: 'explorer', cls: 'Progman', title: 'Program Manager' }, { h: 104, pid: 13, proc: 'explorer', cls: 'CabinetWClass', title: '다운로드' },
    { h: 105, pid: 14, proc: 'notepad', cls: 'Notepad', title: '제목 없음 - 메모장' }, { h: 106, pid: 15, proc: 'mstsc', cls: 'TscShellContainerClass', title: '원격 데스크톱 연결' }] });
  if (act === 'find') return out({ found: { 'chrome.exe': 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'KakaoTalk.exe': 'C:\\Program Files (x86)\\Kakao\\KakaoTalk\\KakaoTalk.exe', 'claude.exe': 'C:\\Users\\u\\AppData\\Local\\AnthropicClaude\\claude.exe' }, icons: {} });
  if (act === 'lnk') return out({ target: 'C:\\Program Files\\Notepad++\\notepad++.exe', args: '', icon: null });
  if (act === 'exe') return out({ list: j.name === 'notfound.exe' ? [] : ['C:\\Program Files\\Some\\' + j.name], icon: null });
  if (act === 'startup') { if (on === 1 && SF) fs.writeFileSync(SF, '1'); if (on === 0 && SF) { try { fs.renameSync(SF, SF + '.off'); } catch (e) {} } return out({ on: !!(SF && fs.existsSync(SF)), path: 'C:\\…\\ReadNow-PC배치.lnk' }); }
  if (act === 'run') return out({ build: 22631, closed: (j.close || []).map((c) => ({ h: c.h, proc: c.proc, title: c.title, ok: true, gone: true, why: '' })),
    res: (j.steps || []).map((s) => process.env.FAKE_RUN_FAIL && s.app === process.env.FAKE_RUN_FAIL ? { app: s.app, inst: s.inst, name: s.name, ok: false, how: '켜기 실패: 지정된 파일을 찾을 수 없습니다' } : { app: s.app, inst: s.inst, name: s.name, ok: true, how: '켬 → 자리 옮김' + (s.tabs ? ` · 탭 ${s.tabs.length}개 더함` : ''), want: s.rect, got: s.rect }) });
  if (act === 'fit') return out({ got: { x: 0, y: 0, w: j.w, h: j.h } });
  if (act === 'cleanscan') return out({ targets: (j.targets || []).filter((t) => !t.kind).map((t, i) => ({ id: t.id, files: i === 0 ? 1234 : 10 * i, bytes: (i + 1) * 50 * 1048576, sample: ['C:\\Users\\u\\AppData\\Local\\Temp\\old' + i + '.tmp'] })),
    procs: [{ pid: 11, name: 'chrome', ws: 900 * 1048576, cpu: 12, path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', cmd: 'chrome.exe' },
      { pid: 12, name: 'node', ws: 120 * 1048576, cpu: 3, path: 'C:\\Users\\u\\ReadNow\\node\\node.exe', cmd: 'node readnow-col2-helper.js' },
      { pid: 13, name: 'OneDrive', ws: 150 * 1048576, cpu: 6, path: 'C:\\Users\\u\\AppData\\Local\\Microsoft\\OneDrive\\OneDrive.exe', cmd: '' },
      { pid: 14, name: 'ms-teams', ws: 350 * 1048576, cpu: 2, path: 'C:\\Program Files\\WindowsApps\\MSTeams\\ms-teams.exe', cmd: '' },
      { pid: 15, name: 'CCXProcess', ws: 80 * 1048576, cpu: 1, path: 'C:\\Program Files\\Adobe\\CCX\\CCXProcess.exe', cmd: '' },
      { pid: 16, name: 'Photoshop', ws: 1200 * 1048576, cpu: 4, path: 'C:\\Program Files\\Adobe\\Adobe Photoshop 2025\\Photoshop.exe', cmd: '' },
      { pid: 17, name: 'MsMpEng', ws: 300 * 1048576, cpu: 26, path: 'C:\\ProgramData\\Microsoft\\Windows Defender\\MsMpEng.exe', cmd: '' },
      { pid: 18, name: 'SomeGame', ws: 600 * 1048576, cpu: 30, path: 'D:\\Games\\SomeGame.exe', cmd: '' }],
    startup: [{ name: 'OneDrive', cmd: 'OneDrive.exe /background', where: 'HKCU' }, { name: 'ReadNow-Print.lnk', cmd: 'C:\\…\\ReadNow-Print.lnk', where: '시작 프로그램 폴더' }, { name: 'Mystery', cmd: 'mystery.exe', where: 'HKCU' }], defEx: null });
  if (act === 'cleanrun') return out({ deleted: 42, freed: 123 * 1048576, failed: 3, stopped: (j.pids || []).map((p) => p.name), mem: j.trim ? { before: 8e9, after: 7e9, n: 40 } : null });
  process.stdout.write(JSON.stringify({ ok: false, err: '모르는 일' }) + '\n');
});
