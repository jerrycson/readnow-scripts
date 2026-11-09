// tPEERW — 11/10 일꾼 sv1 · 정범님 11/10 새벽 '시트의 무효 판매자 — 내 판단은 빼고 너와 엔진의 근거로'
//  ① 공용 판매자 분류(classifySellerDoc)는 옛 시트 '허위' 표시를 읽지 않음 — 참고 글(sheetNote)만 · 범례 무효 조건에도 없음
//  ② 판매자 가치 무게 peerW(활동 × 배송 약속 × 독립 × 실제 팔림) — 시트 칸과 관계없음 · 엔진 무리 근거·지나침이 무게를 낮춤 · 모르면 unknown
//  ③ 가격 판정: 기본(peerUse 끔)은 지금 판정 그대로 + 그림자(peerShadow)만 붙음(값·상태 그대로) · peerUse 켜면 판매자 가치로 판정
//  ④ 감시기가 그림자를 기록(rec.peerShadow)하고 엔진 근거(app_settings/peer_ev)는 그림자에만 줌
// 시험 자료에 손님·판매자 이름 없음(꾸민 번호·값만)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { console.log((c ? '  ✓ ' : '  ❌ ') + m + (c || x === undefined ? '' : ' — ' + JSON.stringify(x).slice(0, 300))); if (!c) bad++; };
const find = (L) => L.map((x) => path.join(__dirname, x)).find((x) => fs.existsSync(x));
global.window = global; require(find(['../readnow-core.js', '../../readnow-core.js'])); const Core = global.ReadNowCore;
const RS = require(find(['../readnow-sellers-core.js', '../../readnow-sellers-core.js']));
const PR = require(find(['../readnow-pricing-core.js', '../../readnow-pricing-core.js']));
const PW = fs.readFileSync(find(['../readnow-price-watch.user.js', '../../readnow-price-watch.user.js']), 'utf8');

console.log('① 공용 분류에 시트 표시 안 넣음');
{ const d = { sc: '11', rev6m: 500, cancel3m: 0.01 }; const a = Core.classifySellerDoc(d, RS), b = Core.classifySellerDoc({ ...d, ourGrade: 'fake' }, RS);
  ok(a.cls === b.cls && a.cls !== 'red', '시트 허위 표시가 있어도 같은 색(두 축으로만)', [a.cls, b.cls]);
  ok(!!b.sheetNote && /근거 아님/.test(b.sheetNote) && !a.sheetNote, '시트 표시는 참고 글로만', b.sheetNote);
  const n = Core.classifySellerDoc({ sc: '12', ourGrade: 'fake' }, RS); ok(n.cls === 'unknown', '자료 없는 시트 표시 판매자 = 무효가 아니라 모름', n.cls);
  ok(!/허위 매물 표시 ·/.test(Core.sellerLegend().find((x) => x.cls === 'red').cond), '범례 무효 조건에 시트 표시 없음'); }

console.log('② 판매자 가치 무게');
{ const g = RS.peerW({ rev6m: 1500, cancel3m: 0.01 }); ok(g.cls === 'dkgreen' && g.w > 0.9, '활동 많고 취소 적음 = 짙은 유효', g);
  ok(RS.peerW({ rev6m: 1500, cancel3m: 0.01, ourGrade: 'fake' }).w === g.w, '시트 칸과 관계없음');
  ok(RS.peerW({ rev6m: 300, cancel3m: 0.25 }).cls === 'red', '품절취소율 25% = 무효 띠');
  const e = RS.peerW({ rev6m: 1500, cancel3m: 0.01 }, { grp: 'fam' }); ok(e.w < 0.25 && /같은 값 짝 가족/.test(e.why), '엔진 무리 근거 → 무게 낮음', e);
  const p = RS.peerW({ rev6m: 1500, cancel3m: 0.01 }, { sold: 1, passed: 20 }); ok(p.w < g.w && /지나침 20/.test(p.why), '손님이 지나친 매물 → 무게 낮음', p.w);
  ok(RS.peerW({ sc: '3' }).cls === 'unknown' && RS.peerW(null).cls === 'unknown', '자료 없음 = 모름');
  ok(RS.peerW({ rev6mLt3: true, cancel3m: 0 }).cls === 'red', '6개월 평가 3건 미만 = 무효 띠');
  // 첫 값이 시트 뺀 두 축(sellerBg)과 대체로 같은지(유효/아님 경계)
  const C = [[1500, 0.01], [1500, 0.03], [250, 0.01], [250, 0.03], [120, 0.01], [120, 0.06], [60, 0.01], [40, 0.0], [800, 0.12], [2000, 0.22]];
  const agree = C.filter(([n, c]) => { const a = Core.classifySellerDoc({ rev6m: n, cancel3m: c }, RS).cls; const b = RS.peerW({ rev6m: n, cancel3m: c }).cls; return ['dkgreen', 'green'].includes(a) === ['dkgreen', 'green'].includes(b); }).length;
  ok(agree >= 8, `비교군 넣음/뺌 경계가 두 축 기준과 ${agree}/10 같음`); }

console.log('③ 가격 판정: 기본은 그대로 + 그림자');
{ const now = '2026-11-09T00:00:00Z'; const l = { key: 'k1', status: '판매중', price: 5000, grade: '상', registeredAt: '2026-09-01', usedCode: 'U1', ship: 2500 };
  const m = { at: now, rows: [{ sellerCode: '21', grade: '상', price: 3000, ship: 2500 }, { sellerCode: '22', grade: '상', price: 4000, ship: 2500 }] };
  const sel = { sc_21: { sc: '21', rev6m: 600, cancel3m: 0.01, ourGrade: 'fake' }, sc_22: { sc: '22', rev6m: 600, cancel3m: 0.01 } };
  const d = PR.decide(l, m, sel, { now, RS, core: Core });
  ok(d.ref && d.ref.sellerCode === '21' && d.target === 3000, '시트 표시가 있어도 두 축으로 유효면 기준 매물', d.ref);
  ok(d.peerShadow && d.peerShadow.target === 3000 && d.peerShadow.same === true, '그림자가 붙고 같은 판정', d.peerShadow);
  const ev = { 21: { grp: 'odd' } }; const d2 = PR.decide(l, m, sel, { now, RS, core: Core, peerEv: ev });
  ok(d2.target === 3000 && d2.action === d.action, '엔진 근거가 있어도 지금 판정(값)은 그대로', d2.target);
  ok(d2.peerShadow.ref && d2.peerShadow.ref.sc === '22' && d2.peerShadow.target === 4000 && d2.peerShadow.same === false && d2.peerShadow.ev === true, '그림자는 엔진 무리 근거로 다음 매물을 기준으로', d2.peerShadow);
  const d3 = PR.decide(l, m, sel, { now, RS, core: Core, peerEv: ev, settings: { peerUse: true } });
  ok(d3.target === 4000 && d3.ref.sellerCode === '22' && !d3.peerShadow, 'peerUse 켜면 판매자 가치로 판정(그림자 없음)', [d3.target, d3.ref]);
  const d4 = PR.decide(l, m, sel, { now, RS, core: Core, settings: { peerShadow: false } }); ok(!d4.peerShadow, 'peerShadow 끄면 그림자 없음');
  ok(PR.DEFAULTS.peerUse === false && PR.DEFAULTS.peerShadow === true, '기본: 판매자 가치 판정 끔 · 그림자 켬');
  const sk = PR.decide({ ...l, status: '판매완료' }, m, sel, { now, RS, core: Core }); ok(!sk.peerShadow, '판매중 아닌 상품은 그림자 셈 안 함'); }

console.log('④ 감시기 기록');
{ ok(/peerShadow: d\.peerShadow \|\| null/.test(PW), '감시 기록(rec)에 그림자');
  ok(/doc\('peer_ev'\)/.test(PW) && /peerEv: await peerEv\(\)/.test(PW), '엔진 근거 app_settings/peer_ev를 판정 ctx에(그림자만 씀)');
  ok(!/^\/\/ @(match|grant|connect|require).*peer/m.test(PW), '감시기 머리 줄은 그대로'); }

console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
