/* tY24HB1113 — (11/13 일꾼 train1) 💓 번외 예스24 상태(col2_ctl/<PC>.y24hb)가 번외 0.1.54 grid.probe(배열 속 배열) 때문에 Firestore 쓰기에서 조용히 실패하던 것
 *  ① 수집기 hbPut이 쓰기 직전에 fsFlat을 부름 ② fsFlat 뒤에는 배열 속 배열이 없음(Firestore 규칙) ③ 값·글은 그대로 남음(이름 ¦ 글) ④ 다른 칸 모양은 그대로
 * 실행: node src/tests/tY24HB1113.js (서버·브라우저 필요 없음) · 손님 정보 없음 */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..')].find((p) => fs.existsSync(path.join(p, 'src/readnow-collector.src.js')));
const C = fs.readFileSync(path.join(R, 'src/readnow-collector.src.js'), 'utf8');
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 300))); };
const m = C.match(/const fsFlat = (\(v, d\) => [\s\S]*?: v\)); G\.__rnFsFlat = fsFlat;/);
ok(!!m, '수집기에 fsFlat 있음');
ok(/const hbPut = async \(pc, o\) => \{ try \{ if \(!pc\) return; o = fsFlat\(o\);/.test(C), 'hbPut이 쓰기 전에 fsFlat을 부름');
const fsFlat = m ? new Function('const fsFlat = ' + m[1] + '; return fsFlat;')() : (v) => v;
const nested = (v) => (Array.isArray(v) ? v.some((x) => Array.isArray(x) || nested(x)) : v && typeof v === 'object' ? Object.values(v).some(nested) : false);
const hb = { hlp: true, on: true, w: { ok1: null, hist: [{ at: 1, no: '1', msg: '눌렀지만', dlg: ['화면 상자: 경고'] }], grid: { at: 2, n: 1, keys: ['A', 'B'], cols: { REM_CNT: { e: false, h: '재고수량' } }, opt: { editable: true }, probe: { v: 1, at: 3, url: '/Product/ProductList', cols: [['REM_CNT', 'REM_CNT', '재고수량', 0, 'text', '']], M: [['fnSave', 'function(){ save() }']], cbs: [['onCellEditable', 'function(a){return false}']] } } } };
ok(nested(hb), '시험 자료: 번외 0.1.54 꼴은 배열 속 배열이 있음');
const f = fsFlat(hb);
ok(!nested(f), 'fsFlat 뒤에는 배열 속 배열 없음(Firestore가 받음)', f.w.grid.probe);
ok(f.w.grid.probe.M[0] === 'fnSave ¦ function(){ save() }' && f.w.grid.probe.cbs[0].startsWith('onCellEditable ¦ ') && f.w.grid.probe.cols[0] === 'REM_CNT ¦ REM_CNT ¦ 재고수량 ¦ 0 ¦ text ¦ ', '함수 이름·글은 그대로 글로 남음', f.w.grid.probe);
ok(JSON.stringify(f.w.hist) === JSON.stringify(hb.w.hist) && JSON.stringify(f.w.grid.cols) === JSON.stringify(hb.w.grid.cols) && f.w.grid.keys.join() === 'A,B' && f.hlp === true, '다른 칸 모양은 그대로');
ok(fsFlat(null) === null && fsFlat(5) === 5 && fsFlat('x') === 'x', '빈 값·숫자·글은 그대로');
console.log(bad ? `❌ tY24HB1113 실패 ${bad}` : '✓ tY24HB1113 모두 통과'); process.exit(bad ? 1 : 0);
