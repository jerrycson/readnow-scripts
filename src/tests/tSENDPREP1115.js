// tSENDPREP1115 — 발송준비시작이 출고 PC(MJ-MAIN)를 기다리는 중이면 사실대로 (sendprep1 · 정범님 11/15 02:47)
//  그대로 재현: 자동 맡김(auto_ · dev JS-MAIN)이 대기 · JS-MAIN이 '출고 PC 기다림'(waitShip)을 적음 · MJ-MAIN 마지막 신호 6시간 전
//  ① 상태 = shipWait(예전 stale '2분 넘게 응답 없음 — 다시 누르세요') ② 다시 누르기 단추 대상 아님 ③ 근거 줄에 'MJ-MAIN 기다림 · 마지막 신호' ④ 맡은 PC가 있거나 waitShip이 없으면 예전 그대로
const fs = require('fs'); const path = require('path'); const A = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8');
const grab = (start, end) => { const i = A.indexOf(start); if (i < 0) throw new Error('없음: ' + start); const j = A.indexOf(end, i); return A.slice(i, j); };
const src = [grab('function cmdStateOf(ono)', '/* (정범님 11/04 밤) 한 주문의 상품 일부만'), grab('const SHIP_PROOF =', '// 오늘 출고 계획 (shp_plan')].join('\n');
let ok = 0, bad = 0; const t = (c, m) => { if (c) ok++; else { bad++; console.log('❌ ' + m); } };
const S = { shipCmds: [], shipC: { orders: [] } }; const regAgo = (ms) => { const m = Math.floor(ms / 60000), h = Math.floor(m / 60); return h ? `${h}시간 ${m % 60}분` : `${m}분`; };
const window = { __rnBeats: { pcs: { 'MJ-MAIN': { atMs: Date.now() - 6 * 3600e3 } } } }; const regPcBeatLoad = () => {};
const F = new Function('S', 'regAgo', 'window', 'regPcBeatLoad', src + '\nreturn { cmdStateOf, cmdResLine, CMD_TXT, CMD_RETRY };')(S, regAgo, window, regPcBeatLoad);
const old = new Date(Date.now() - 3 * 3600e3).toISOString();
S.shipCmds = [{ id: 'auto_A1', type: 'startDelivery', orderNos: ['A1'], status: 'queued', createdAt: old, dev: 'JS-MAIN', auto: true, waitShip: { pc: 'MJ-MAIN', at: old, by: 'JS-MAIN' } }];
t(F.cmdStateOf('A1') === 'shipWait', '① 출고 PC 기다림 상태여야 함: ' + F.cmdStateOf('A1'));
t(!F.CMD_RETRY.has('shipWait'), '② 다시 누르기 단추 대상이 아니어야 함');
t(/다시 눌러도 같음/.test(F.CMD_TXT.shipWait[0]), '② 글에 다시 눌러도 같음');
const L = F.cmdResLine('A1'); t(/출고 PC MJ-MAIN 기다림/.test(L) && /마지막 신호 6시간/.test(L), '③ 근거 줄: ' + L);
S.shipCmds = [{ ...S.shipCmds[0], waitShip: null }]; t(F.cmdStateOf('A1') === 'stale', '④ waitShip 없으면 예전대로 stale');
S.shipCmds = [{ ...S.shipCmds[0], waitShip: { pc: 'MJ-MAIN' }, status: 'running', claim: { pc: 'MJ-MAIN', at: new Date().toISOString() }, beatAt: new Date().toISOString() }]; t(F.cmdStateOf('A1') === 'running', '④ 출고 PC가 맡으면 처리 중');
window.__rnBeats.pcs['MJ-MAIN'].atMs = Date.now() - 60e3; S.shipCmds = [{ id: 'x', type: 'startDelivery', orderNos: ['A1'], status: 'queued', createdAt: old, waitShip: { pc: 'MJ-MAIN' } }]; t(/곧 맡음/.test(F.cmdResLine('A1')), '③ 신호가 살아 있으면 곧 맡음');
console.log(`tSENDPREP1115: ${ok} 통과 · ${bad} 실패`); process.exit(bad ? 1 : 0);
