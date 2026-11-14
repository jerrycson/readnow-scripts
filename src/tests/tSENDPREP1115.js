// tSENDPREP1115 — (sendprep2 · 정범님 11/15 03:51 바로잡음) 발송준비시작은 모든 사무실 PC가 먼저 집어 처리 — 출고 PC(MJ-MAIN)만 하는 것은 송장 인쇄·송장 입력뿐
//  그래서 1.78.655의 '출고 PC 기다림(shipWait)' 표시를 없앰: 옛 맡김에 waitShip이 남아 있어도 예전처럼 대기·처리 중·응답 없음(stale · 다시 누르기 단추)
const fs = require('fs'); const path = require('path'); const A = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8');
const grab = (start, end) => { const i = A.indexOf(start); if (i < 0) throw new Error('없음: ' + start); const j = A.indexOf(end, i); return A.slice(i, j); };
const src = [grab('function cmdStateOf(ono)', '/* (정범님 11/04 밤) 한 주문의 상품 일부만'), grab('const SHIP_PROOF =', '// 오늘 출고 계획 (shp_plan')].join('\n');
let ok = 0, bad = 0; const t = (c, m) => { if (c) ok++; else { bad++; console.log('❌ ' + m); } };
const S = { shipCmds: [], shipC: { orders: [] } }; const regAgo = (ms) => { const m = Math.floor(ms / 60000), h = Math.floor(m / 60); return h ? `${h}시간 ${m % 60}분` : `${m}분`; };
const F = new Function('S', 'regAgo', src + '\nreturn { cmdStateOf, cmdResLine, CMD_TXT, CMD_RETRY };')(S, regAgo);
const old = new Date(Date.now() - 3 * 3600e3).toISOString();
S.shipCmds = [{ id: 'auto_A1', type: 'startDelivery', orderNos: ['A1'], status: 'queued', createdAt: old, dev: 'JS-MAIN', auto: true, waitShip: { pc: 'MJ-MAIN', at: old, by: 'JS-MAIN' } }];
t(F.cmdStateOf('A1') === 'stale', '① 옛 waitShip이 남아도 출고 PC 기다림이 아니라 응답 없음(stale): ' + F.cmdStateOf('A1'));
t(F.CMD_RETRY.has('stale'), '① 응답 없음이면 다시 누르기 단추 대상');
t(!F.CMD_TXT.shipWait && !/shipWait/.test(A), '② 출고 PC 기다림 표시(shipWait)가 웹앱에 없음');
t(!/출고 PC MJ-MAIN 기다림/.test(F.cmdResLine('A1')), '③ 근거 줄에 출고 PC 기다림 없음: ' + F.cmdResLine('A1'));
S.shipCmds = [{ ...S.shipCmds[0], status: 'running', claim: { pc: 'JS-MAIN', at: new Date().toISOString() }, beatAt: new Date().toISOString() }]; t(F.cmdStateOf('A1') === 'running', '④ 어느 PC가 맡으면 처리 중'); t(/처리: JS-MAIN/.test(F.cmdResLine('A1')), '④ 맡은 PC 이름이 근거 줄에');
S.shipCmds = [{ id: 'x', type: 'startDelivery', orderNos: ['A1'], status: 'queued', createdAt: new Date().toISOString() }]; t(F.cmdStateOf('A1') === 'queued', '④ 방금 맡긴 것은 대기');
console.log(`tSENDPREP1115: ${ok} 통과 · ${bad} 실패`); process.exit(bad ? 1 : 0);
