/* tY24QTY1_1114 — (11/14 일꾼 y24qty1 · 원문 readnow-chats reports/yes24_raw/GRID_HOME_1114_0107.json) 예스24 수량 [상세수정]·판매중지 — 번외 0.1.58 · 웹앱 한 번짜리 y24Re1114b
 *  ① 웹앱 고르기(y24Re1114bPick) — 걸린 꼴('상세수정' 칸 자리를 못 셈 · '기간변경' 체크가 잠겨 있어 끌 수 없음 · 처음 한 건을 확인하는 중)만 · 판매가·이미 됨·다른 실패·re1114b 표시·같은 줄 옛 문서는 뺌
 *  ② 맡은 PC 번외 0.1.59 뒤에만 · 문서마다 한 번 · 맡긴 일 줄 처리 안에서 y24Re1114 다음에 불림
 *  ③ 번외: [상세수정]은 화면 함수와 같은 길 이동(SelectProduct)이 먼저 · 표 줄 상품번호 확인 · 칸 누르기는 그 뒤 · 판매중지 창이 스스로 끈 체크는 받아들이되 켜진 채 잠긴 것·창 자료 'Y'는 멈춤
 * 실행: node src/tests/tY24QTY1_1114.js (서버·브라우저 필요 없음) · 손님 정보 없음 */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..')].find((p) => fs.existsSync(path.join(p, 'src/app.html')));
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 400))); };
const A = rd('src/app.html');
const blkA = (A.match(/const Y24_RE_MAX = 3;[\s\S]*?\nfunction y24RePatch\([\s\S]*?\} \}; \}\n/) || [''])[0];
const blkP = (A.match(/const Y24_RE1114B_NEED = [\s\S]*?\nfunction y24Re1114bPick\([\s\S]*?return out; \}[^\n]*\n/) || [''])[0];
console.log('① 한 번짜리 고르기');
ok(!!blkA && !!blkP, '웹앱에 덩어리 있음');
const F = new Function(blkA + blkP + '; return { y24Re1114bPick, y24RePatch, Y24_RE_MAX };')();
const job = (id, kind, extra) => ({ id, rows: [{ rid: 'K|' + id, rk: 'rk' + id, no: '1951' + id, kind, to: kind === 'qty' ? 1 : null, ...(extra || {}) }] });
const res = (msg, st) => ({ state: st || 'fail', rows: { x: { state: st || 'fail', pre: true, msg } } });
const D = [
  { id: 'a', k: 'w', st: 'done', at: '2026-11-13T10:18:00Z', job: job('a', 'qty'), res: res("'상세수정' 칸 자리를 못 셈(화면 밖이거나 getCellBounds 없음) — 아무것도 저장하지 않음") },
  { id: 'b', k: 'w', st: 'done', at: '2026-11-13T16:18:00Z', job: job('b', 'stop'), res: res("창의 '기간변경'이 켜진 채 열렸는데 '기간변경' 체크가 잠겨 있어 끌 수 없음 — 판매기간을 건드리지 않으려고 멈춤 · [변경]은 누르지 않음") },
  { id: 'c', k: 'w', st: 'done', at: '2026-11-13T15:05:00Z', job: job('c', 'qty'), res: res('처음 한 건을 확인하는 중 — 그 결과를 본 뒤 이어 맡김(첫 실행은 1건 확인 뒤)') },
  { id: 'd', k: 'w', st: 'done', at: '2026-11-13T10:06:00Z', job: job('d', 'price', { src: 'price' }), res: res("'상세수정' 칸 자리를 못 셈") },
  { id: 'e', k: 'w', st: 'done', at: '2026-11-13T10:07:00Z', job: job('e', 'qty'), res: res('수량 1권 — 등록상품 목록에서 확인', 'done') },
  { id: 'f', k: 'w', st: 'done', at: '2026-11-13T10:08:00Z', job: job('f', 'stop'), res: res('예스24 1951f의 자체코드가 이미 PNKLUX — 장부가 이은 실물과 달라 아무것도 누르지 않음') },
  { id: 'g', k: 'w', st: 'done', at: '2026-11-13T10:09:00Z', re1114c: 'x', job: job('g', 'qty'), res: res("'상세수정' 칸 자리를 못 셈") },
  { id: 'i', k: 'w', st: 'done', at: '2026-11-13T10:11:00Z', job: job('i', 'qty'), res: res('[상세수정] 화면에서 저장 단추를 하나로 못 찾음(저장 이름 단추 2개 · [삭제] 짝 0개) — 아무것도 저장하지 않음') },
  { id: 'h', k: 'w', st: 'done', at: '2026-11-13T10:10:00Z', job: job('h', 'qty'), res: res('[상세수정]에서 저장을 누른 뒤 다시 읽으니 바라던 꼴이 아님', 'unsure') },
];
const old = { id: 'b0', k: 'w', st: 'done', at: '2026-11-13T10:05:00Z', job: { id: 'b0', rows: [{ ...job('b', 'stop').rows[0] }] }, res: res("창의 '기간변경'이 켜져 있어 멈춤") };
const P = F.y24Re1114bPick([...D, old], []); const ids = P.map((d) => d.id).sort().join(',');
ok(ids === 'a,b,c,i', "상세수정 칸 못 셈·기간변경 잠김·처음 한 건·저장 단추 못 찾음 네 꼴만 · 판매가·이미 됨·자체코드 다름·확실하지 않음·re1114c 표시·같은 줄 옛 문서는 뺌", ids);
ok(F.y24Re1114bPick(D, [{ id: 'live', st: 'hold', at: '2026-11-14T01:00:00Z', job: job('a', 'qty') }]).map((d) => d.id).sort().join(',') === 'b,c,i', '그 줄의 맡김이 지금 줄에 있으면 끝난 옛 문서는 되돌리지 않음');
console.log('② 되돌림');
const RS = [...A.matchAll(/const RES = (\{ state: 'fail', pre: true, same: true, msg: '[^']*' \});/g)].map((m) => m[1]).find((x) => /0\.1\.60/.test(x)); const res0 = RS ? new Function('return ' + RS)() : null;
ok(res0 && !/기간변경/.test(res0.msg), "되돌림 까닭 글에 '기간변경' 낱말이 없음(실패 셈에 막히지 않게)", RS);
for (const d of P) { const p = F.y24RePatch({ ...d, reN: Math.min(+d.reN || 0, F.Y24_RE_MAX - 1) }, res0, '시험', Date.parse('2026-11-14T02:10:00Z'), 0); ok(p && p.st === 'hold' && p.reN <= F.Y24_RE_MAX, `문서 ${d.id} 맡긴 일 줄로(hold) 되돌릴 수 있음`, p); }
ok(/const Y24_RE1114B_NEED = '0\.1\.60'/.test(A) && /if \(vn\(hv\) < vn\(Y24_RE1114B_NEED\)\) return;/.test(A) && /localStorage\.getItem\('rn-y24re1114c'\)/.test(A) && /c\.re1114c \|\| !y24Re1114bPick\(/.test(A) && /re1114c: iso/.test(A), '맡은 PC 번외 0.1.59 뒤에만 · 기기마다 한 번 · 문서마다 re1114b 표시로 한 번(거래 안에서 다시 확인)');
ok(/await y24Re1114\(\);[^\n]*\n    await y24Re1114b\(\);/.test(A), '맡긴 일 줄 처리 안에서 y24Re1114 다음에 불림');
console.log('③ 번외 0.1.58·0.1.59');
const W = rd('lab/col2/helper/col2-y24w.js');
ok(/COL2_VER: '0\.1\.60'/.test(rd('lab/col2/col2-config.js')), '번외 판 0.1.60');
ok(/const JS_ROUTE = /.test(W) && /name='SelectProduct'/.test(W) && /callbackGridButton/.test(W) && /맡긴 번호와 달라 열지 않음/.test(W), '[상세수정] = 화면 함수와 같은 길 이동(SelectProduct · 화면 함수 글에서 이름) · 표 줄 상품번호가 다르면 안 엶');
ok(/async function openDet\(h, no\) \{ const rd0 = await routeDet\(h, no\);/.test(W) && W.indexOf('const rd0 = await routeDet') < W.indexOf('const c = await o.ev(JS_UBCELL(h.r))'), '길 이동이 먼저 · 칸 누르기는 그 뒤(길이 없을 때만)');
ok(/if \(D\.route\) \{ const a2 = await look\(r\);/.test(W), '저장 뒤 확인도 목록에서 같은 길로 다시 엶');
ok(/if\(ck\.disabled\)\{const d0=dateSt\(P\);if\(!ck\.checked&&d0\.cy!=='Y'\)return\{ok:true,auto:true\}/.test(W) && /a0\.cy !== 'Y'/.test(W), "판매중지 창: 꺼진 채 잠긴 체크는 받아들임 · 켜진 채 잠김·창 자료 changeDateYn 'Y'는 멈춤");
ok(/const JS_PRICE = /.test(W), '판매가 쪽(JS_PRICE)은 그대로');
ok(/const SV_PICK_JS = /.test(W) && /if \(d\.sv !== 1\) return failP\(/.test(W) && /\/\^삭제\$\/\.test\(svTx\(x\)\)/.test(W) && /if\(\/삭제\|등록\/\.test\(t\)\)return\{ok:false/.test(W), "(0.1.60) '수정'이 여럿이면 바로 다음이 [삭제]인 맨 아래 짝 하나만 · 고른 단추 이름이 삭제·등록이면 안 누름");
console.log('④ 수집기 한 번짜리(웹앱이 밤에 안 열려 있어도)');
{ const C = rd('src/readnow-collector.src.js'); const b = (C.match(/    const RE14B_WHY = [\s\S]*?\n    function re14bPick\([\s\S]*?return out; \}\n/) || [''])[0];
  ok(!!b, '수집기에 고르기 덩어리 있음'); const G = b ? new Function(b.replace(/^\s+/, '') + '; return re14bPick;')() : null;
  ok(G && G([...D, old], []).map((d) => d.id).sort().join(',') === 'a,b,c,i', '수집기 고르기 = 웹앱 고르기(같은 네 꼴)', G && G([...D, old], []).map((d) => d.id));
  ok(/await wRe1114b\(fs, pc\);/.test(C) && /RE14B_NEED = '0\.1\.60'/.test(C) && /GM_setValue\('rn-y24re1114c'/.test(C) && /c\.re1114c \|\| !re14bPick\(/.test(C) && /y24RePatch\(\{ \.\.\.c, reN: Math\.min\(\+c\.reN \|\| 0, Y24_RE_MAX - 1\) \}, RES, pc, Date\.now\(\), 0\)/.test(C), '맡은 PC 수집기 다리 안에서 · 그 PC 번외 0.1.59 뒤 · 이 PC 한 번 · 문서마다 re1114b 한 번(거래 안에서 다시 확인)'); }
console.log(bad ? `❌ tY24QTY1_1114 실패 ${bad}` : '✓ tY24QTY1_1114 모두 통과'); process.exit(bad ? 1 : 0);
