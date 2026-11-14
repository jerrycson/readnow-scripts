/* tY24RE9_1114 — (11/14 일꾼 y24re9 · 원문 진단 col2_y24_cmd·app_settings/omni_auto hb·prd_listings 11/14 02:2xZ) 옛 웹앱이 또 닫은 수량 맡김을 수집기가 알라딘 쪽 확인 뒤 바로 한 번 — 「hot banana fudge」 195142826 수량 1
 *  ① 고르기(y24NosDPick): 수집기가 한 번 돌린(reNos) 뒤 옛 웹앱(1.78.619 앞)이 또 '할 일 없음'으로 닫은 수량 맡김만 · 새 웹앱이 닫았거나·판매중지·ISBN 없음·0권·한 번 바로 맡긴 것(reNosD)·뒤에 맡긴 일 있음은 뺌
 *  ② 알라딘 쪽 맞음(y24NosDFit): 그 ISBN 판매중 알라딘 상품이 꼭 하나이고 수량 = 맡긴 수량일 때만
 *  ③ 쓰기 다리에서 wReNos 다음에 불림 · 번외 0.1.62 뒤에만 · 새 맡김 문서(holder 이 PC · st new) · 문서마다 한 번(트랜잭션 reNosD)
 * 실행: node src/tests/tY24RE9_1114.js (서버·브라우저 필요 없음) · 손님 정보 없음 */
const fs = require('fs'), path = require('path');
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..')].find((p) => fs.existsSync(path.join(p, 'src/app.html')));
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' ' + JSON.stringify(x).slice(0, 400))); };
const C = fs.readFileSync(path.join(R, 'src/readnow-collector.src.js'), 'utf8');
const bN = (C.match(/const Y24_NOS_MS = 30 \* 60e3;[^\n]*\n\s*function y24NosPick\([\s\S]*?return out; \}\n/) || [''])[0];
const bD = (C.match(/const NOSD_OLD = '1\.78\.619';[^\n]*\n[\s\S]*?function y24NosDFit\([^\n]*\n/) || [''])[0];
ok(!!bN && !!bD, '수집기에 고르기 덩어리 둘 있음');
const F = new Function(bN + bD + '; return { y24NosDPick, y24NosDFit };')();
const NOW = Date.parse('2026-11-14T02:30:00Z');
const NOS = { state: 'already', msg: '할 일 없음 — 보내기 직전에 다시 셈(아무것도 안 보냄)', rows: {} };
const row = (no, kind, x) => ({ rid: 'PNKd3734EX|' + no, rk: 'PNKd3734EX|' + no + '|' + kind + '|1|', no, kind, to: kind === 'qty' ? 1 : null, isbn: '9788959191864', title: 't', ...(x || {}) });
const TR = (by, at) => [{ at: '2026-11-13T14:09:35.856Z', m: '다시 셈 — 할 일 없음으로 닫음', by: 'JS-phone' }, { at: '2026-11-13T19:46:28.053Z', m: "🔁 '할 일 없음'으로 닫혔던 맡김(아무것도 안 보냄) — 장부에 같은 할 일이 남아 맡긴 일 줄로 한 번 더(수집기)", by: 'HOME' }, { at: at || '2026-11-13T19:46:34.275Z', m: '다시 셈 — 할 일 없음으로 닫음', by }];
const base = (id, no, o) => ({ id, k: 'w', st: 'done', at: '2026-11-13T13:58:45Z', holdAt: '2026-11-13T19:46:28.053Z', doneAt: '2026-11-13T19:46:34.275Z', reNos: '2026-11-13T19:46:28.053Z', res: NOS, job: { rows: [row(no, 'qty')] }, trail: TR('MJ-MAIN'), ...(o || {}) });
const HB = { 'MJ-MAIN': { ver: '1.78.587' }, PC: { ver: '1.78.623' }, 'JS-phone': { ver: '1.78.598' } };
const D = [
  base('z2e', '195142826'), /* 고름 — 실제 꼴 */
  base('a', '1001', { trail: TR('PC') }), /* 새 웹앱(1.78.623)이 닫음 — 그 셈을 믿음 */
  base('b', '1002', { reNos: null }), /* 수집기가 아직 안 돌림 — 먼저 wReNos */
  base('c', '1003', { reNosD: 'x' }), /* 이미 한 번 */
  base('d', '1004', { job: { rows: [row('1004', 'stop')] } }), /* 판매중지 — 뺌 */
  base('e', '1005', { job: { rows: [row('1005', 'qty', { isbn: '' })] } }), /* ISBN 없음 — 알라딘 쪽 확인 못 함 */
  base('f', '1006', { trail: TR('NOPE') }), /* 닫은 기기 판을 모름 — 뺌 */
  base('g', '1007', { trail: TR('MJ-MAIN', '2026-11-13T19:40:00Z').slice(0, 1).concat([{ at: '2026-11-13T19:46:28.053Z', m: '맡은 PC(HOME)에 보냄 1건', by: 'MJ-MAIN' }]) }), /* 마지막이 닫음이 아님 */
  base('h', '1008', { reNosW: 'x' }), /* 새 웹앱이 이미 맡김 */
  base('i', '1009', { res: { state: 'skip', msg: '할 일 없음 — 보내기 직전에 다시 셈(아무것도 안 보냄)' } }), /* 할 일이 바뀜 — 뺌 */
  base('j', '1010'), /* 뒤에 맡긴 일이 있음 — 뺌 */
];
const ACT = [{ id: 'j2', st: 'run', at: '2026-11-14T01:00:00Z', job: { rows: [row('1010', 'qty')] } }];
console.log('① 고르기');
const ids = F.y24NosDPick(D, ACT, HB, NOW).map((d) => d.id); ok(JSON.stringify(ids) === '["z2e"]', '고른 것 = z2e 하나(옛 웹앱 1.78.587이 수집기 뒤에 또 닫은 수량 맡김)', ids);
ok(F.y24NosDPick([{ ...D[0], reNosD: '2026-11-14T02:30:00Z' }], [], HB, NOW).length === 0, '한 번 바로 맡긴 문서(reNosD)는 다시 고르지 않음(되풀이 0)');
ok(F.y24NosDPick(D.slice(0, 1), [{ id: 'new1', st: 'new', at: '2026-11-14T02:30:00Z', job: { rows: [row('195142826', 'qty')] } }], HB, NOW).length === 0, '새 맡김이 줄에 있으면 옛 문서는 고르지 않음(그 상품 번호의 가장 새 문서만)');
ok(F.y24NosDPick(D.slice(0, 1), [], { 'MJ-MAIN': { ver: '1.78.623' } }, NOW).length === 0, 'MJ-MAIN이 새 웹앱을 받은 뒤엔 그 셈을 믿음(바로 맡기지 않음)');
ok(F.y24NosDPick(D.slice(0, 1), [], HB, Date.parse('2026-11-17T02:30:00Z')).length === 0, '72시간 지난 문서는 뺌');
ok(F.y24NosDPick([base('k', '1011', { job: { rows: [row('1011', 'qty', { to: 0 })] } })], [], HB, NOW).length === 0, '0권(=판매중지)은 뺌');
console.log('② 알라딘 쪽 맞음');
const rows = D[0].job.rows; const L1 = { 9788959191864: [{ status: '판매중', active: true, qty: 1 }] };
ok(F.y24NosDFit(rows, L1) === '', '판매중 알라딘 1권 = 맡긴 1권 → 보냄(11/14 02:24Z 실제 aladin_U345587565)');
ok(/2권/.test(F.y24NosDFit(rows, { 9788959191864: [{ status: '판매중', active: true, qty: 2 }] })), '알라딘 2권이면 안 보냄(사람이 수량을 늘렸을 수 있음)');
ok(/0개/.test(F.y24NosDFit(rows, { 9788959191864: [{ status: '판매완료', active: false, qty: 1 }] })), '알라딘이 팔렸으면 안 보냄(그때는 판매중지 할 일 — 장부가 다시 셈)');
ok(/2개/.test(F.y24NosDFit(rows, { 9788959191864: [{ status: '판매중', qty: 1 }, { status: '판매중', qty: 1 }] })), '같은 ISBN 판매중 알라딘 상품이 둘이면 안 보냄');
ok(F.y24NosDFit(rows, { 9788959191864: [{ status: '판매중', active: true, qty: null }] }) === '', '알라딘 수량 칸이 비면 1권(장부 ledBuild와 같음)');
ok(/0개/.test(F.y24NosDFit(rows, {})), '알라딘 상품을 못 읽으면 안 보냄');
console.log('③ 이어짐');
ok(/await wReNos\(fs, pc\);[^\n]*\n\s*await wReNosD\(fs, pc\);/.test(C), '쓰기 다리에서 wReNos 다음에 wReNosD를 부름(같은 차례 ① 새 맡김 받기 앞)');
const W = (C.match(/async function wReNosD\(fs, pc\)[\s\S]*?\n    const wRelay = /) || [''])[0];
ok(/nosDVn\(hv\) < nosDVn\(NOS_NEED\)\) return/.test(W), '맡은 PC 번외 0.1.62 뒤에만');
ok(/c\.st !== 'done' \|\| c\.reNosD \|\| !y24NosDPick\(\[\{ \.\.\.c, id: d\.id \}\], \[\], hb\)\.length\) return;/.test(W), '트랜잭션 안에서 다시 확인(문서마다 한 번 · 두 PC가 함께 하지 않음)');
ok(/tx\.set\(nref, \{ k: 'w', job: \{ id: jid, rows: \(c\.job \|\| \{\}\)\.rows \|\| rows \}, st: 'new', holder: pc,/.test(W), '새 맡김 문서 — 이 PC 번외가 받음(st new · holder 이 PC) · 보내기 직전 다시 셈을 거치지 않음');
ok(/where\('isbn13', '==', String\(r\.isbn\)\)/.test(W) && /const why = y24NosDFit\(rows, LS\); if \(why\)/.test(W), '보내기 전 알라딘 상품 기록을 ISBN으로 읽어 맞을 때만');
ok(!/alert\(|confirm\(|prompt\(/.test(W), '브라우저 팝업 없음');
console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
