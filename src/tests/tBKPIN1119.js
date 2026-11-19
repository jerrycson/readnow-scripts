// tBKPIN1119 — (정범님 11/19 13:10 「지금 상태로 고정」) 📁 묶음 지킴 1.78.777
//  ① 이 기기가 모르는 그룹(목록을 덜 받은 기기)이 있어도 묶음 저장(bkfApply)이 그 그룹을 지우지 않음
//  ② 꺼진 원본 그룹을 저절로 빼지 않음(bkfReplFix는 제안 띠만 · 빼기는 누를 때만)
//  ③ 묶음을 바꾸는 저장은 바꾸기 전 구성을 _bkfold/hist에 남김 · 빼기·풀기·보관이 아닌 저장이 그룹 수를 줄이면 막음
// 실행: node tBKPIN1119.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const fn = (n) => { const i = T.search(new RegExp('(async )?function ' + n + '\\(')); if (i < 0) throw new Error('함수 못 찾음 ' + n); const j = T.indexOf('\nfunction ', i + 10), k = T.indexOf('\nasync function ', i + 10); const e = [j, k].filter((x) => x > 0).sort((a, b) => a - b)[0]; return T.slice(i, e); };
const blk = (() => { const i = T.indexOf('/* ◆bkfold 시작'), j = T.indexOf('/* ◆bkfold 끝 */', i); return T.slice(i, j); })();
let F = null; try { F = new Function('S', blk + '\nreturn { bkfApply, bkfNorm };')({}); } catch (e) { console.log('  (덩어리 실행 못 함 — 글로만 봄)', e.message); }
const doc = { folds: { f1: { name: '전체처리v1', gids: ['g1', 'g2', 'g3', 'g4'], at: '2026-11-19' } }, order: ['f:f1', 'g9'] };
const alive = new Set(['g1', 'g2', 'g9']);
if (F) {
  const r = F.bkfApply(doc, { t: 'ord', vis: ['g9'] }, alive, { now: '2026-11-19T00:00:00Z', by: 't' });
  ok(!r.err && r.folds.f1.gids.join() === 'g1,g2,g3,g4', '① 순서 저장이 모르는 그룹(g3·g4)을 묶음에서 지우지 않음', r);
  const r2 = F.bkfApply(doc, { t: 'put', fid: 'f1', gids: ['g9'] }, alive, { now: '2026-11-19T00:00:00Z', by: 't' });
  ok(!r2.err && ['g1', 'g2', 'g3', 'g4'].every((g) => r2.folds.f1.gids.includes(g)), '① 담기도 모르는 그룹을 남김', r2);
}
ok(/bkfNorm\(doc, null\)/.test(fn('bkfApply')), '① bkfApply는 bkfNorm(doc, null)로 읽음');
const rf = fn('bkfReplFix');
ok(!/bkfTx\(\{ t: 'out', fid, gids: \[x\.old\] \}\)\.then/.test(rf) && /bkfBar\([^]*async \(\) => \{ const r = await bkfTx\(\{ t: 'out'/.test(rf), '② 꺼진 원본은 저절로 빼지 않고 누를 때만 뺌');
const tx = fn('bkfTx');
ok(/collection\('hist'\)/.test(tx), '③ 바꾸기 전 구성을 _bkfold/hist에 남김');
ok(/n1 < n0 && !\(op && \['out', 'del', 'arch'\]\.includes\(op\.t\)\)/.test(tx), '③ 빼기·풀기·보관이 아닌 저장이 그룹 수를 줄이면 막음');
ok(!/\b(alert|confirm|prompt)\s*\(/.test(rf + tx), '브라우저 창 없음');
console.log(bad ? `❌ tBKPIN1119 ${bad}개 실패` : '✓ tBKPIN1119 통과'); process.exit(bad ? 1 : 0);
