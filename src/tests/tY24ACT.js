// tY24ACT — 정범님 11/04 '왜 바로 자동으로 구현하지 않는거야?': 🤖 수집기 예스24 자동 처리(y24Act·y24Check)를 가짜 예스24 발송관리·신규 주문 화면(HTML)으로
//   칸 채우기(택배사·송장) · 그 줄만 체크 · [발송처리]/[주문접수확인] 하나만 · 확인 창은 글이 맞을 때만 · 다시 읽어 확인 · 이미 끝났으면 아무것도 안 함 · 모르는 화면이면 멈추고 칸 목록만 · 첫 건 확인 후 실행
//   + 공용 파일: 예전 주문 규칙(y24OrdOld) · 발송처리 예정 = 접수확인 끝 · 허브 요약(y24HubSum + ext-core 허브 읽기) · ALPS 줄(y24AlpsRows·y24AlpsWhy)
// 실행: node src/tests/tY24ACT.js (pw/ 사본은 ../readnow-collector.user.js) · 시험 자료 손님은 '손님A' 010-0000-0000
const fs = require('fs'); const path = require('path'); const { chromium } = require('playwright');
const SRC = [path.join(__dirname, '../readnow-collector.src.js'), path.join(__dirname, '../readnow-collector.user.js')].find((p) => fs.existsSync(p)); const src = fs.readFileSync(SRC, 'utf8');
const a = src.indexOf('/* ◆y24Act 시작'); const b = src.indexOf('/* ◆y24Act 끝 */'); let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
if (a < 0 || b < a) { console.log('❌ 수집기에서 y24Act 덩어리를 못 찾음'); process.exit(1); } const CODE = src.slice(a, b);
const core = (n) => [path.join(__dirname, '..', '..', n), path.join(__dirname, '..', n)].find((p) => fs.existsSync(p)); const SH = require(core('readnow-shipping-core.js')); const X = require(core('readnow-ext-core.js'));
const row = (ono, st, extra) => `<tr><td><input type="checkbox" class="rowck"></td><td>${ono}</td><td>손님A</td><td>${st}</td>${extra || ''}</tr>`;
const shipRow = (ono, st) => row(ono, st, `<td><select name="DELV_ENTR"><option value="">선택</option><option value="01">CJ대한통운</option><option value="05">롯데택배</option><option value="09">롯데택배 반품</option></select></td><td><input type="text" name="INVOICE_NO" placeholder="송장번호"></td>`);
const page = (rows, btns, opt) => `<!doctype html><meta charset="utf-8"><body><table><tr><th><input type="checkbox" id="all"></th><th>주문번호</th><th>주문자</th><th>상태</th></tr>${rows}</table>${btns}<script>window.__clicked=[];document.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{window.__clicked.push(b.textContent.trim()); ${opt && opt.modal ? `const d=document.createElement('div');d.className='modal';d.innerHTML='<p>${opt.modal}</p><button id="mok">확인</button>';document.body.appendChild(d);d.querySelector('#mok').onclick=()=>{window.__clicked.push('모달확인');d.remove();};` : `const ok=confirm(${JSON.stringify((opt && opt.cmsg) || '선택한 주문을 발송처리 하시겠습니까?')});window.__conf=ok;if(ok){window.__sent=[...document.querySelectorAll('tr')].filter(r=>r.querySelector('.rowck:checked')).map(r=>({t:r.children[1].textContent, c:(r.querySelector('select')||{}).value, n:(r.querySelector('input[type=text]')||{}).value}));alert('처리되었습니다');}`}}));</script>`;
const BTN_S = '<button>판매불가</button><button>예스24지정택배요청</button><button>발송처리</button><button>엑셀 다운로드</button>';
(async () => { const br = await chromium.launch(); const p = await br.newPage();
  const run = async (html, job, ask) => { await p.setContent(html); return p.evaluate(async ([code, job, ask]) => { const f = new Function(code + '\nreturn { y24Act, y24Check };')(); const H = { sleep: (ms) => new Promise((r) => setTimeout(r, Math.min(ms, 30))), ask: async () => { window.__asked = 1; window.__hl = document.querySelector('button[style*="outline"]') ? document.querySelector('button[style*="outline"]').textContent : null; return ask; } };
    window.__sent = null; window.__conf = undefined; window.__asked = 0; window.__hl = null; const r = await f.y24Act(document, window, job, H); return { r, clicked: window.__clicked, sent: window.__sent || null, conf: window.__conf, asked: !!window.__asked, hl: window.__hl || null, checked: [...document.querySelectorAll('input[type=checkbox]')].filter((c) => c.checked).length }; }, [CODE, job, ask]); };
  const check = async (html, job) => { await p.setContent(html); return p.evaluate(async ([code, job]) => { const f = new Function(code + '\nreturn { y24Act, y24Check };')(); return f.y24Check(document, window, job, { sleep: (ms) => new Promise((r) => setTimeout(r, 20)) }); }, [CODE, job]); };
  const J = { kind: 'ship', ono: 'Y2611030001', courier: '롯데택배', no: '240000000099', confirm: false };
  // ① 발송처리: 다른 줄이 체크돼 있어도 그 줄만 · 택배사(반품 아님)·송장 채움 · [발송처리] 하나만 · 확인 창 글이 맞음 → 확인
  const H1 = page(shipRow('Y2611039999', '발송처리 예정').replace('class="rowck"', 'class="rowck" checked') + shipRow('Y2611030001', '발송처리 예정'), BTN_S);
  let r = await run(H1, J, true); ok(r.r.state === 'clicked' && JSON.stringify(r.clicked) === '["발송처리"]' && r.conf === true && r.sent && r.sent.length === 1 && r.sent[0].t === 'Y2611030001' && r.sent[0].c === '05' && r.sent[0].n === '240000000099', `발송처리: 그 줄만·롯데택배(05)·송장 채우고 [발송처리] 하나만·확인 창 확인: ${JSON.stringify({ s: r.r.state, c: r.clicked, sent: r.sent })}`);
  // ② 첫 건 확인 후 실행 — 사람이 멈추면 아무것도 안 누름 · 단추가 빨갛게
  r = await run(H1, { ...J, confirm: true }, false); ok(r.asked && r.hl === '발송처리' && r.r.state === 'fail' && !r.clicked.length, `첫 건 확인: 단추를 빨갛게 두고 물음 · 멈춤이면 안 누름: ${r.r.msg}`);
  r = await run(H1, { ...J, confirm: true }, true); ok(r.asked && r.r.state === 'clicked' && r.clicked.length === 1, '첫 건 확인: [▶ 이대로 실행]이면 누름');
  // ③ 이미 발송완료면 아무것도 안 함
  r = await run(page(shipRow('Y2611030001', '발송완료'), BTN_S), J, true); ok(r.r.state === 'done' && r.r.already && !r.clicked.length, '이미 발송완료 → 아무것도 안 누름');
  // ④ 확인 창 글이 다르면 멈춤(누른 뒤 확인 창에서 '취소' 쪽)
  r = await run(page(shipRow('Y2611030001', '발송처리 예정'), BTN_S, { cmsg: '선택한 주문을 판매불가 처리합니다' }), J, true); ok(r.r.state === 'fail' && r.conf === false && !r.sent, `확인 창 글이 다르면 '확인'하지 않고 멈춤: ${r.r.msg}`);
  // ⑤ 모르는 화면(그 주문 줄 없음) → 아무것도 안 누르고 칸 목록만(손님 정보 없이)
  r = await run(page(shipRow('Y2611039999', '발송처리 예정'), BTN_S), J, true); const dg = JSON.stringify(r.r.diag || {}); ok(r.r.state === 'fail' && !r.clicked.length && /발송처리/.test(dg) && !/손님A|010-/.test(dg), `줄을 못 찾으면 멈춤·칸 목록(손님 정보 없음): ${dg.slice(0, 160)}`);
  // ⑥ 택배사 목록에 없음 · 송장 칸 없음 · 단추 여럿 → 멈춤
  r = await run(page(shipRow('Y2611030001', '발송처리 예정').replace(/<option value="05">롯데택배<\/option>/, ''), BTN_S), J, true); ok(r.r.state === 'fail' && !r.clicked.length, '택배사 목록에 롯데택배가 없으면 멈춤(반품 택배는 고르지 않음): ' + r.r.msg);
  r = await run(page(row('Y2611030001', '발송처리 예정', '<td><select><option>롯데택배</option></select></td>'), BTN_S), J, true); ok(r.r.state === 'fail' && !r.clicked.length, '송장 칸을 못 찾으면 멈춤: ' + r.r.msg);
  r = await run(page(shipRow('Y2611030001', '발송처리 예정'), BTN_S + '<button>발송처리</button>'), J, true); ok(r.r.state === 'fail' && !r.clicked.length, '[발송처리] 단추가 여럿이면 멈춤');
  // ⑦ 화면 안 확인 상자(모달)
  r = await run(page(shipRow('Y2611030001', '발송처리 예정'), BTN_S, { modal: '1건을 발송처리 하시겠습니까?' }), J, true); ok(r.r.state === 'clicked' && JSON.stringify(r.clicked) === '["발송처리","모달확인"]', '화면 안 확인 상자: 글이 맞으면 [확인]');
  r = await run(page(shipRow('Y2611030001', '발송처리 예정'), BTN_S, { modal: '주문을 취소하시겠습니까?' }), J, true); ok(r.r.state === 'fail' && JSON.stringify(r.clicked) === '["발송처리"]', '화면 안 확인 상자 글이 다르면 [확인]하지 않고 멈춤');
  // ⑧ 주문접수확인
  const BTN_A = '<button>주문접수확인</button><button>판매불가</button>'; const JA = { kind: 'ack', ono: 'Y2611030001', confirm: false };
  r = await run(page(row('Y2611030001', '신규주문') + row('Y2611030002', '신규주문'), BTN_A, { cmsg: '선택한 주문을 접수확인 하시겠습니까?' }), JA, true); ok(r.r.state === 'clicked' && JSON.stringify(r.clicked) === '["주문접수확인"]' && r.sent && r.sent.length === 1 && r.sent[0].t === 'Y2611030001', '주문접수확인: 그 줄만 체크 · [주문접수확인] 하나만');
  r = await run(page(row('Y2611030002', '신규주문'), BTN_A), JA, true); ok(r.r.state === 'gone' && !r.clicked.length, '신규 주문 목록에 없으면(이미 접수확인) 아무것도 안 누름');
  // ⑨ 다시 읽어 확인
  ok((await check(page(shipRow('Y2611039999', '발송처리 예정'), BTN_S), J)).state === 'done', '다시 읽은 발송관리 목록에서 빠짐 → 끝');
  ok((await check(page(shipRow('Y2611030001', '발송완료'), BTN_S), J)).state === 'done', '다시 읽은 목록에 발송완료 → 끝');
  ok((await check(page(shipRow('Y2611030001', '발송처리 예정'), BTN_S), J)).state === 'unsure', '그대로면 \'확인 못 함\'(사람에게)');
  await br.close();
  // ── 공용 파일
  const K = { NewOrderConfirmList: { at: '2026-11-04T05:00:00.000Z', unknown: 0 }, OrderDeliveryList: { at: '2026-11-04T05:00:00.000Z', unknown: 0 } };
  ok(SH.y24OrdParse('POST /api/Order/OrderDeliveryList', JSON.stringify({ DELIVERY_LIST: [{ ORD_NO: 'A1', ORD_STAT_NM: '발송처리 예정', GOODS_NM: 'x' }] }), '2026-11-04T05:00:00Z').rows[0].stage === 'deliv', "예스24 '발송처리 예정' = 접수확인 끝(deliv) — 발송 끝으로 읽지 않음");
  const old = { orderNo: 'O1', orderedAt: '2026-10-20T01:00:00.000Z', firstSeenAt: '2026-11-04T04:00:00.000Z', lastSeenAt: '2026-11-04T04:00:00.000Z', seen: { OrderList: '2026-11-04T04:00:00.000Z' }, ystage: null };
  ok(SH.y24OrdOld(old, K) && SH.y24OrdOld(old, K).kind === 'gone', '기능 켜기 전 주문 + 두 목록 더 새 응답에 없음 → 예전 주문');
  const today = { orderNo: 'T1', orderedAt: '2026-11-03T05:00:00.000Z', firstSeenAt: '2026-11-04T04:00:00.000Z', lastSeenAt: '2026-11-04T05:00:00.000Z', seen: { OrderDeliveryList: '2026-11-04T05:00:00.000Z' }, ystage: 'deliv' };
  ok(SH.y24OrdOld(today, K) === null, '발송관리 목록에 아직 있는 어제 주문(발송처리 예정)은 닫지 않음');
  ok(SH.y24OrdOld(old, { NewOrderConfirmList: K.NewOrderConfirmList }) === null, '발송관리 응답을 아직 못 받았으면 닫지 않음');
  ok(SH.y24OrdOld({ ...old, man: { ack: { at: 'x' } } }, K) === null && SH.y24OrdOld({ ...old, man: { old: { undo: {} } } }, K) === null, '사람이 단계를 적었거나 되돌린 주문은 다시 닫지 않음');
  ok(SH.y24OrdOld({ ...old, orderedAt: '2026-11-04T06:00:00.000Z' }, K) === null, '기능을 켠 뒤 주문은 이 규칙으로 닫지 않음');
  ok(SH.y24OrdOld({ ...old, ystage: 'cancel' }, K).kind === 'cancel', '기능 켜기 전 · 예스24 취소 → 예전 주문(취소)');
  ok(SH.y24AlFirst('2026-10-20T01:00:00Z', [{ at: '2026-10-18T00:00:00Z', ono: 'A' }, { at: '2026-10-25T00:00:00Z' }], false).ono === 'A' && SH.y24AlFirst('2026-10-20T01:00:00Z', [{ at: '2026-10-18T00:00:00Z' }], true) === null, '알라딘에서 먼저 팔림: 예스24 주문 전 판매 · 지금 판매중이면 아님');
  const hub = `<ul><li saleprice="9000" levelgb="02" data-goods-no="111"><span class="ico_used">상</span><a class="gd_name">책</a><em class="yes_b">9,000</em><div class="info_row info_deli">배송비 : 2,500원</div><span class="store_name"><a href="/24/usedShop/mall/other1/main">다른가게</a></span></li><li saleprice="12000" levelgb="02" data-goods-no="222"><span class="ico_used">상</span><em class="yes_b">12,000</em><span class="store_name"><a href="/24/usedShop/mall/jerrycson/main">북스퀸</a></span></li><li saleprice="7000" levelgb="03" data-goods-no="333"><span class="ico_used">중</span><em class="yes_b">7,000</em></li></ul>`;
  const HS = SH.y24HubSum(X._y24HubPage(hub, '3849060'), { grade: '상', own: ['222'], ownSeller: 'jerrycson' }); ok(HS.n === 2 && HS.minSame === 9000 && HS.min === 7000 && HS.mine.length === 1 && HS.low[0].p === 7000 && HS.low.some((x) => x.s === 2500), `허브 요약: 다른 판매자 2 · 같은 등급 최저 9,000 · 전체 최저 7,000 · 우리 매물 1: ${JSON.stringify(HS).slice(0, 160)}`);
  const yo = { orderNo: 'Y1', buyer: '손님A', recipient: { name: '손님A', phone: '010-0000-0000', address: '어느 시 어느 길 1', zip: '12345' }, orderedAt: '2026-11-03T05:00:00.000Z', items: [{ k: '1', title: '책 하나', qty: 1, price: 9000, ean: '9791100000031' }] };
  const R0 = SH.y24AlpsRows(yo, SH.ALADIN_XLS_HEAD, () => 'PNKd5001'); const H0 = SH.ALADIN_XLS_HEAD; const v = (n) => R0[0][H0.indexOf(n)];
  ok(R0.length === 1 && v('주문번호') === 'Y1' && v('수령인') === '손님A' && v('전화1') === '010-0000-0000' && v('수령 주소') === '어느 시 어느 길 1' && v('자체상품관리코드') === 'PNKd5001' && v('주문일') === '2026-11-03 14:00:00' && v('비고') === '예스24 주문', 'ALPS 줄: 알라딘 엑셀과 같은 칸(주문번호·수령인·전화·주소·관리코드·한국 주문일)');
  ok(SH.y24AlpsWhy(yo, 'ack') === null && /접수확인 전/.test(SH.y24AlpsWhy(yo, 'new')) && /이미 송장/.test(SH.y24AlpsWhy({ ...yo, yInv: { no: '1' } }, 'ack')) && /이미 ALPS/.test(SH.y24AlpsWhy({ ...yo, alps: { runId: 'r' } }, 'ack')) && /주소/.test(SH.y24AlpsWhy({ ...yo, recipient: { ...yo.recipient, address: '' } }, 'ack')), 'ALPS에 넣는 조건: 접수확인함 · 송장 없음 · 한 번만 · 받는 분 정보');
  console.log(bad ? `❌ ${bad}개 실패` : '✓ tY24ACT 모두 통과'); process.exit(bad ? 1 : 0); })();
