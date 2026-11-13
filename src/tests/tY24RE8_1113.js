/* tY24RE8_1113 — (11/13 일꾼 y24re8 · FOUND f_261113_y24_remcnt_locked) 예스24 수량은 [상세수정] 길 · 판매중지는 창의 '기간변경' 체크를 끈 뒤 — 번외 0.1.56
 *  ① 웹앱 한 번짜리(y24Re1114Pick) — 걸린 세 꼴(수량 '수정한 상품이 없습니다' 두 건 · 판매중지 '기간변경이 켜져 있어 멈춤' 한 건)만 · 판매가·이미 됨·다른 실패·옛 문서·re1114 표시는 뺌
 *  ② 고른 문서를 y24RePatch로 줄로 되돌릴 수 있음(실패 셈 '기간변경'에 막히지 않게 새 까닭 글) · 맡은 PC 번외 0.1.56 뒤에만 · 맡긴 일 줄 처리 안에서 불림
 *  ③ 번외 판 번호 0.1.56 · 상세수정 길·기간변경 끄기·원문 둘째가 들어 있음 · 판매가 쪽(JS_PRICE)은 그대로
 * 실행: node src/tests/tY24RE8_1113.js (서버·브라우저 필요 없음) · 손님 정보 없음 */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..')].find((p) => fs.existsSync(path.join(p, 'src/app.html')));
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 400))); };
const A = rd('src/app.html');
const blkA = (A.match(/const Y24_RE_MAX = 3;[\s\S]*?\nfunction y24RePatch\([\s\S]*?\} \}; \}\n/) || [''])[0];
const blkP = (A.match(/const Y24_RE1114_NEED = [\s\S]*?\nfunction y24Re1114Pick\([\s\S]*?return out; \}\n/) || [''])[0];
console.log('① 한 번짜리 고르기');
ok(!!blkA && !!blkP, '웹앱에 덩어리 있음');
const F = new Function(blkA + blkP + '; return { y24Re1114Pick, y24RePatch, Y24_RE_MAX };')();
const job = (id, kind, extra) => ({ id, rows: [{ rid: 'K|' + id, rk: 'rk' + id, no: '1951' + id, kind, to: kind === 'qty' ? 1 : null, ...(extra || {}) }] });
const res = (msg, st) => ({ state: st || 'fail', rows: { x: { state: st || 'fail', pre: true, same: /저장되지 않음/.test(msg), msg } } });
const D = [
  { id: 'a', k: 'w', st: 'done', at: '2026-11-13T09:00:00Z', job: job('a', 'qty'), res: res('눌렀지만 예스24가 저장했다는 말 없이(화면 상자: 경고 × 수정한 상품이 없습니다. 확인 [×]) 등록상품 목록 값도 그대로 — 저장되지 않음'), reN: 3 },
  { id: 'b', k: 'w', st: 'done', at: '2026-11-13T09:05:00Z', job: job('b', 'qty'), res: res('등록상품 관리 표에서 재고수량 칸을 사람처럼 더블 클릭해도 입력 칸이 안 열림 — 아무것도 누르지 않음'), reN: 1 },
  { id: 'c', k: 'w', st: 'done', at: '2026-11-13T10:05:00Z', job: job('c', 'stop'), res: res("창의 '기간변경'이 켜져 있어 멈춤(판매기간은 건드리지 않음) — [변경]은 누르지 않음") },
  { id: 'd', k: 'w', st: 'done', at: '2026-11-13T10:06:00Z', job: job('d', 'price', { src: 'price' }), res: res('눌렀지만 … 수정한 상품이 없습니다 — 저장되지 않음') },
  { id: 'e', k: 'w', st: 'done', at: '2026-11-13T10:07:00Z', job: job('e', 'qty'), res: res('수량 1권 — 등록상품 목록에서 확인', 'done') },
  { id: 'f', k: 'w', st: 'done', at: '2026-11-13T10:08:00Z', job: job('f', 'stop'), res: res('예스24 1951f의 자체코드가 이미 PNKLUX — 장부가 이은 실물과 달라 아무것도 누르지 않음') },
  { id: 'g', k: 'w', st: 'done', at: '2026-11-13T10:09:00Z', re1114: 'x', job: job('g', 'qty'), res: res('수정한 상품이 없습니다 — 저장되지 않음') },
];
const old = { id: 'a0', k: 'w', st: 'done', at: '2026-11-13T05:00:00Z', job: { id: 'a0', rows: [{ ...job('a', 'qty').rows[0] }] }, res: res('수정한 상품이 없습니다 — 저장되지 않음') };
const P = F.y24Re1114Pick([...D, old], []); const ids = P.map((d) => d.id).sort().join(',');
ok(ids === 'a,b,c', "수량(수정한 상품이 없습니다·재고수량 칸)·판매중지(기간변경) 세 꼴만 · 판매가·이미 됨·자체코드 다름·re1114 표시·같은 줄 옛 문서는 뺌", ids);
ok(F.y24Re1114Pick(D, [{ id: 'live', st: 'hold', at: '2026-11-13T11:00:00Z', job: job('c', 'stop') }]).map((d) => d.id).sort().join(',') === 'a,b', '그 줄의 맡김이 지금 줄에 있으면(더 새 문서) 끝난 옛 문서는 되돌리지 않음(겹침 0)');
console.log('② 되돌림 패치');
const RES = (A.match(/const RES = (\{ state: 'fail', pre: true, same: true, msg: '[^']*' \});/) || [])[1]; const res0 = RES ? new Function('return ' + RES)() : null;
ok(res0 && !/기간변경/.test(res0.msg), "되돌림 까닭 글에 '기간변경' 낱말이 없음(실패 셈 Y24_RE_NO에 막히지 않게)", RES);
for (const d of P) { const p = F.y24RePatch({ ...d, reN: Math.min(+d.reN || 0, F.Y24_RE_MAX - 1) }, res0, '시험', Date.parse('2026-11-14T02:10:00Z'), 0); ok(p && p.st === 'hold' && p.reN <= F.Y24_RE_MAX && p.retryAt === '2026-11-14T02:10:00.000Z', `${d.id}: 맡긴 일 줄(hold)로 · 바로 보냄 · 셈 ${p && p.reN}/${F.Y24_RE_MAX}`, p); }
ok(/const Y24_RE1114_NEED = '0\.1\.56'/.test(A) && /if \(vn\(hv\) < vn\(Y24_RE1114_NEED\)\) return;/.test(A) && /localStorage\.getItem\('rn-y24re1114'\)/.test(A) && /if \(c\.st !== 'done' \|\| c\.re1114 \|\| !y24Re1114Pick\(\[\{ \.\.\.c, id: d\.id \}\], \[\]\)\.length\) return;/.test(A), '맡은 PC 번외 0.1.56 뒤에만 · 이 기기 한 번 · 문서마다 거래(transaction) 안에서 다시 확인해 한 번만');
ok(/await y24Re1113\(\);[^\n]*\n    await y24Re1114\(\);/.test(A), '맡긴 일 줄 처리(ledY24HoldRetry) 안에서 불림');
console.log('③ 번외 0.1.56');
const W = rd('lab/col2/helper/col2-y24w.js'), Y = rd('lab/col2/helper/col2-y24.js');
ok(/COL2_VER: '0\.1\.56'/.test(rd('lab/col2/col2-config.js')), '번외 판 0.1.56');
ok(/async function detQty\(/.test(W) && /if \(ce === false\) return await detQty\(/.test(W) && /const SAVE_RE = /.test(W) && !/등록\|/.test((W.match(/const SAVE_RE = [^;]*;/) || [''])[0]), "표가 재고수량 칸을 잠그면 [상세수정] 길 · 저장 단추 이름에 '등록' 없음");
ok(/const JS_POP_UNDATE = /.test(W) && /a0\.on === false && a0\.dv === b0\.dv && a0\.act === b0\.act/.test(W), "판매중지 창 '기간변경' 체크 끈 뒤 꺼짐·판매종료일·기간 단추가 그대로일 때만 [변경]");
ok(/const JS_PROBE2 = /.test(W) && /probe2: r\.grid\.probe2 \|\| null, det: r\.det \|\| null, pop: r\.pop \|\| null/.test(Y), '화면 함수 원문 둘째·[상세수정]·판매상태 창 원문이 💓 grid 안에(수집기 판 없이 올라감)');
ok(/const JS_PRICE = \(r, kP, to\) =>/.test(W) && !/detQty[^\n]*kind === 'price'/.test(W), '판매가 길은 그대로(이번 판이 건드리지 않음)');
console.log(bad ? `❌ tY24RE8_1113 실패 ${bad}` : '✓ tY24RE8_1113 모두 통과'); process.exit(bad ? 1 : 0);
