// 시험 tLAGSTALL_1120 — (정범님 I-1120-1055-16) 가격 반영 시간 평균에서 처리가 멈춘 시간을 따로 셈
//  ① 공개 반영: 확인이 예정보다 크게 늦게 돈 표본(밤 쉼·감시 탭 꺼짐·멈춤)은 평균에 안 넣고 stallN·stallSec로 따로
//  ② 샵매니저 반영: (걸린 시간 − 멈춘 시간) ÷ 반영 수 · 겹친 멈춤은 한 번만 · 마지막 30바퀴
//  ③ 웹앱 글: 멈춤 낀 표본·실측 평균을 보임
const fs = require('fs'), path = require('path');
const R = path.join(__dirname, '..', '..');
const PW = fs.readFileSync(path.join(R, 'readnow-price-watch.user.js'), 'utf8');
const APP = fs.readFileSync(path.join(R, 'src', 'app.html'), 'utf8');
let bad = 0; const ok = (c, m, x) => { if (c) console.log('  ✓ ' + m); else { bad++; console.log('  ❌ ' + m, x === undefined ? '' : JSON.stringify(x)); } };
const line = (src, k) => { const i = src.indexOf(k); if (i < 0) throw new Error('못 찾음 ' + k); return src.slice(i, src.indexOf('\n', i)); };
const F = new Function(line(PW, 'const pxlStall = (') + '\n' + line(PW, 'const pxlStallAdd = (') + '\n' + line(PW, 'const apSpdHeld = (') + '\n' + line(PW, 'const apSpdAdd = (') + '\nreturn { pxlStall, pxlStallAdd, apSpdHeld, apSpdAdd };')();
const T0 = Date.parse('2026-11-20T00:00:00Z'), iso = (ms) => new Date(T0 + ms).toISOString(), M = 60e3, H = 3600e3;

console.log('① 공개 반영 — 멈춤 가리기');
{ const a = { at: iso(0) };
  ok(F.pxlStall({ lastMissAt: iso(0), next: iso(30 * M), seenAt: iso(32 * M) }, a) === 0, '예정보다 2분 늦음 = 멈춤 아님');
  ok(F.pxlStall({ lastMissAt: iso(0), next: iso(30 * M), seenAt: iso(50 * M) }, a) > 0, '30분 간격인데 20분 늦음 = 멈춤(15분 넘음)');
  ok(F.pxlStall({ lastMissAt: iso(0), next: iso(4 * H), seenAt: iso(4 * H + 40 * M) }, a) === 0, '4시간 간격 40분 늦음 = 멈춤 아님(간격 절반 2시간 안)');
  ok(F.pxlStall({ lastMissAt: iso(0), next: iso(4 * H), seenAt: iso(13 * H) }, a) === 9 * 3600, '4시간 간격 9시간 늦음 = 멈춤 9시간(밤 쉼)');
  ok(F.pxlStall({ next: iso(2 * H), seenAt: iso(9 * H) }, a) > 0, '앞선 확인이 없으면 가격 바꾼 때부터 셈');
  ok(F.pxlStall({ seenAt: iso(9 * H) }, a) === 0 && F.pxlStall(null, a) === 0, '예정이 없으면 멈춤으로 안 셈(값 없음)');
  const o = F.pxlStallAdd({ stallN: 2, stallSec: 100 }, 50, 'x'); ok(o.stallN === 3 && o.stallSec === 150 && o.stallAt === 'x', '멈춤 수·시간만 더함(표본 안 건드림)', o); }
console.log('② 기록에서 멈춤 표본을 평균에 안 넣음');
{ const W = PW.slice(PW.indexOf('async function pxlLagW('), PW.indexOf('\n  }', PW.indexOf('async function pxlLagW(')));
  ok(/st > 0 \? pxlStallAdd\(o, st, at\) : pxlLagAdd\(o, sec\)/.test(W), '멈춤이면 pxlStallAdd · 아니면 표본에 더함');
  ok(/stallSec: pxlStall\(\{ \.\.\.x, seenAt: nowIso \}, a\)/.test(PW), '확인 성공 때 멈춤 시간을 함께 남김');
  ok(/async function pxlLagFixW\(\)/.test(PW) && /pxlLagFixW\(\)\.catch/.test(PW) && /oldSamples: keep/.test(PW), '지난 기록 한 번 다시 셈(옛 표본은 oldSamples로 남김 · 지우지 않음)'); }
console.log('③ 샵매니저 반영 — 멈춘 시간 빼기');
{ ok(F.apSpdHeld([[0, 10e3], [5e3, 20e3], [30e3, 40e3]]) === 30e3, '겹친 멈춤은 한 번만(0~20초 + 30~40초 = 30초)');
  ok(F.apSpdHeld([]) === 0 && F.apSpdHeld(null) === 0, '멈춤 없음 = 0');
  let o = {}; for (let i = 0; i < 35; i++) o = F.apSpdAdd(o, { n: 2, sec: i < 34 ? 10 : 4, lanes: i % 2 ? 2 : 1, heldSec: 1 });
  ok(o.rounds.length === 30, '마지막 30바퀴만', o.rounds.length);
  ok(o.n === 60 && o.heldSec === 30, '수·멈춘 시간 합', o);
  ok(Math.abs(o.avgSec - (29 * 10 + 4) / 30) < 0.06 && o.byLanes['1'] && o.byLanes['2'], '반영 수로 무게 둔 평균 · 줄 수별', o.avgSec);
  const E = PW.slice(PW.indexOf('  async function executeApproved() {'), PW.indexOf('\n  /* ── (0.7.0) 공개 반영 확인'));
  ok(!/PACE\.wait\(sleep, 1, true\)/.test(E.replace(/const apPace = [^\n]*/, '')) && (E.match(/await apPace\(\)/g) || []).length === 2, '반영 안의 알라딘 간격 기다림 둘 다 재는 길로');
  ok(/n\+\+; SPD\.n\+\+; await fzEnd\(true, price\)/.test(E) && /apSpdW\(SPD, APX\.lanes\)/.test(E), '성공한 가격만 셈 · 바퀴 끝에 기록');
  ok(/if \(!S \|\| S\.n < 2\) return/.test(PW) && /doc\('px_apply_spd'\)/.test(PW), '2건 미만 바퀴는 안 남김 · app_settings/px_apply_spd 한곳'); }
console.log('④ 웹앱 글');
{ const g = new Function('esc', 'pxlKst', line(APP, 'const pxlStallTxt = (') + '\n' + APP.slice(APP.indexOf('function apSpdTxt('), APP.indexOf('\n', APP.indexOf('function apSpdTxt('))) + '\nreturn { pxlStallTxt, apSpdTxt };')((s) => String(s), () => '11/20 11:00');
  ok(g.pxlStallTxt({ stallN: 0 }) === '' && /멈춤 낀 표본 3건\(늦어진 시간 합 2.5시간\)은 평균에서 뺌/.test(g.pxlStallTxt({ stallN: 3, stallSec: 9000 })), '공개 반영: 멈춤 낀 표본 따로 보임');
  ok(/반영 2건 이상인 바퀴/.test(g.apSpdTxt(null)) && /한 권 <b>7.2초<\/b>.*멈춘 시간 1.5분은 따로 뺌/.test(g.apSpdTxt({ n: 10, avgSec: 7.2, heldSec: 90, rounds: [{}, {}], byLanes: { 2: { n: 10, sec: 7.2 } } })), '반영 속도 칸: 실측 평균·멈춘 시간');
  ok(/\$\{pxlStallTxt\(lag\)\}/.test(APP) && /id="pr_aspd_m"/.test(APP) && /doc\('px_apply_spd'\)\.get\(\)/.test(APP), '화면에 이어짐'); }
console.log('⑤ 머리 그대로');
{ const hd = (t) => (t.match(/^\/\/ @(match|grant|connect|require|include)\b.*$/mg) || []).join('\n'); let old = ''; try { old = require('child_process').execSync('git show origin/main:readnow-price-watch.user.js', { cwd: R, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) {} ok(!old || hd(old) === hd(PW), '감시기 머리 줄(@match·@grant·@connect·@require)이 main과 같음'); }
if (bad) { console.log(`❌ tLAGSTALL_1120 ${bad}개 실패`); process.exit(1); } else console.log('✅ tLAGSTALL_1120 모두 통과');
