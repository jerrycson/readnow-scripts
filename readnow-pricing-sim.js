global.window = global; require('./readnow-core.js'); // 툴팁 기준 파일(readnow-core.js)을 같이 불러 같은 분류
const P = require('./readnow-pricing-core.js');
const RS = require('./readnow-sellers-core.js');
const now = '2026-10-02T12:00:00+09:00';
const ago = (h) => new Date(Date.parse(now) - h * 3600e3).toISOString();
const daysAgo = (d) => new Date(Date.parse(now) - d * 864e5).toISOString().slice(0, 10);
const docs = { '1': { rev6m: 1500, cancel3m: 0.01 }, '2': { rev6m: 300, cancel3m: 0.02 }, '3': { rev6m: 150, cancel3m: 0.03 }, '4': { rev6m: 70, cancel3m: 0.2 }, '5': { rev6mLt3: true }, '6': { rev6m: 400, ourGrade: 'fake' }, '7': { rev6m: 350, cancel3m: 0.01 } };
const sellers = Object.fromEntries(Object.entries(docs).map(([k, d]) => ['sc_' + k, d])); // Firestore sellers 문서 그대로
const ctx = (x = {}) => ({ now, RS, core: window.ReadNowCore, policy: { fee: 2500, freeOver: 30000 }, defaultCost: 2000, buyback: { '최상': 700, '상': 600, '중': 300 }, ...x, settings: { cutoverAt: daysAgo(10), rollout: { treatPct: 100, controlPct: 0 }, ...(x.settings || {}) } });
const L = (x) => ({ key: 'aladin_U1', usedCode: 'U1', title: '보통 책', grade: '상', price: 5000, status: '판매중', registeredAt: daysAgo(30), ship: 2800, sku: 'BLKCMN', ...x });
const M = (rows, x) => ({ at: ago(2), pagesSeen: 1, lastPage: 1, rows, ...x });
const row = (sc, grade, price, ship, x) => ({ sellerCode: sc, sellerName: 'S' + sc, grade, price, ship, page: 1, firstSeenAt: ago(72), ...x });
const show = (name, d) => console.log(`\n■ ${name}\n  상태=${d.status} 행동=${d.action} 현재=${d.current} 목표=${d.target ?? '-'} 자동=${d.auto} 기간=${d.tier && d.tier.code + ' ' + d.tier.name}\n  기준=${d.ref ? `${d.ref.sellerName}(${d.ref.color}) ${d.ref.grade} ${d.ref.price}+${d.ref.ship} 맨위=${d.ref.isFirst}` : '-'}\n  이유: ${d.reasons.join(' / ')}\n  자동 막힘: ${d.autoBlock.join(' / ') || '-'}`);
// 1. 정범 예시: 기준 상 1000+3000, 맨 위 아님, 우리 배송비 2800 → 1100
show('정범 예시(맨 위 아님) → 1100 기대', P.decide(L({ price: 1500 }), M([row('5', '상', 900, 2500), row('2', '상', 1000, 3000)]), sellers, ctx({ buyback: {} , defaultCost: 0})));
// 2. 기준이 맨 위 → 동가 1000
show('정범 예시(맨 위) → 1000 기대', P.decide(L({ price: 1500 }), M([row('2', '상', 1000, 3000), row('7', '상', 1200, 2500)]), sellers, ctx({ buyback: {}, defaultCost: 0 })));
// 3. 신규 + 짙은 초록 동급 → 짙은 초록과 동가 (초록이 더 싸도)
show('신규·짙은 초록 기준', P.decide(L({ price: 9000 }), M([row('2', '상', 7000, 2500), row('1', '상', 8000, 2500)]), sellers, ctx()));
// 4. 출간 12개월 이내면 초록 기준
show('신규·출간 12개월 이내 → 초록 기준', P.decide(L({ price: 9000, pubDate: daysAgo(100) }), M([row('2', '상', 7000, 2500), row('1', '상', 8000, 2500)]), sellers, ctx()));
// 5. 빨강·허위는 무시
show('빨강·허위 무시', P.decide(L({ price: 6000 }), M([row('5', '상', 3000, 2500), row('6', '상', 3200, 2500), row('2', '상', 5500, 2500)]), sellers, ctx()));
// 6. 정상 재고(120일) 5% 할인
show('정상 재고 5% 할인', P.decide(L({ price: 6000, registeredAt: daysAgo(120) }), M([row('2', '상', 5500, 2500)]), sellers, ctx()));
// 7. 부동 재고 50% + 하한선
show('부동 재고 50% → 하한선', P.decide(L({ price: 3000, registeredAt: daysAgo(800), lowest: { days: 800 } }), M([row('3', '상', 2000, 2500)]), sellers, ctx()));
// 8. 청산 재고: 주황 포함
show('청산 재고 주황 포함', P.decide(L({ price: 9000, registeredAt: daysAgo(1200), lowest: { days: 1200 } }), M([row('4', '상', 8000, 2500), row('2', '상', 12000, 2500)]), sellers, ctx()));
// 9. 불용
show('불용 → BAD', P.decide(L({ registeredAt: daysAgo(1600) }), M([]), sellers, ctx()));
// 10. 첫 페이지에 기준 없음 → 대기열
show('기준 없음 → 대기열', P.decide(L(), M([row('5', '상', 3000, 2500), row('4', '상', 3500, 2500)]), sellers, ctx()));
// 11. 특별판: 2쪽 이상 필요
show('특별판 키워드 → 더 많은 쪽 필요', P.decide(L({ title: '어린 왕자 (리커버 한정판)' }), M([row('5', '상', 3000, 2500)], { lastPage: 6 }), sellers, ctx()));
show('특별판 6쪽 관측 → 뒤쪽 유효 기준', P.decide(L({ title: '어린 왕자 (리커버 한정판)', price: 30000 }), M([row('5', '상', 9000, 2500), row('6', '상', 9500, 2500), row('2', '상', 25000, 2500, { page: 5 })], { lastPage: 6, pagesSeen: 6 }), sellers, ctx()));
// 12. 올리기: 싼 매물이 30시간 전에 사라짐 → 다음 기준으로 올림
show('싼 매물 사라짐(30시간) → 올림', P.decide(L({ price: 4000 }), M([row('2', '상', 6000, 2500)], { recentGone: [{ ...row('7', '상', 4000, 2500), goneAt: ago(30) }] }), sellers, ctx()));
show('싼 매물 사라짐(5시간) → 아직 유지', P.decide(L({ price: 4000 }), M([row('2', '상', 6000, 2500)], { recentGone: [{ ...row('7', '상', 4000, 2500), goneAt: ago(5) }] }), sellers, ctx()));
// 13. 새 싼 매물이 5시간 전 등장 → 내리지 않고 기다림
show('새 싼 매물(5시간) → 기다림', P.decide(L({ price: 6000 }), M([row('2', '상', 4000, 2500, { firstSeenAt: ago(5) })]), sellers, ctx()));
// 14. 우리 변경 반영 대기
show('우리 변경 반영 대기', P.decide(L({ pendingChange: { at: ago(3), price: 4500 } }), M([row('2', '상', 4000, 2500)]), sellers, ctx()));
// 15. 등급 환산
show('같은 등급 없음 → 환산', P.decide(L({ grade: '중', price: 9000 }), M([row('2', '최상', 8000, 2500)]), sellers, ctx()));
// 16. 희소 후보
show('희소 후보', P.decide(L({ price: 20000, registeredAt: daysAgo(400), lowest: { days: 400 } }), M([row('2', '상', 15000, 2500)]), sellers, ctx()));
// 17. 4,000원 빨강 3개 + 35만원 → 사람 확인
show('35만 원 사고 방지', P.decide(L({ price: 5000 }), M([row('5', '상', 4000, 2500), row('5', '상', 4000, 2500), row('5', '상', 4000, 2500), row('2', '상', 350000, 2500)]), sellers, ctx()));
// 18. 알라딘측 포함
show('알라딘측이 더 쌈', P.decide(L({ price: 6000 }), M([row(null, '상', 4500, 0, { sellerName: '이 광활한 우주점' }), row('2', '상', 5500, 2500)]), sellers, ctx()));
// 19. L1 자동
show('L1 자동 적용 가능?', P.decide(L({ price: 5200 }), M([row('7', '상', 5000, 2500), row('2', '상', 5100, 2500)]), sellers, ctx({ settings: { autoLevel: 'L1' } })));
// 20. 추격자
const ev = P.chaseEvents([{ at: ago(150), price: 5000 }, { at: ago(100), price: 4900 }, { at: ago(50), price: 4800 }], [{ sellerCode: '7', at: ago(140), price: 4990 }, { sellerCode: '7', at: ago(90), price: 4890 }, { sellerCode: '7', at: ago(40), price: 4790 }]);
const st = P.chaseState(ev, now); console.log('\n■ 추격자 판정', JSON.stringify(st));
show('추격자가 기준 → 할인 없이 동가', P.decide(L({ price: 6000, registeredAt: daysAgo(120) }), M([row('7', '상', 4790, 2500)]), sellers, ctx({ chase: st })));
console.log('\n■ 단위', [99, 100, 380, 1000, 3780, 9999, 10000, 12345, 123456].map((p) => `${p}:${P.priceStep(p)}→${P.snapDown(p)}`).join('  '), ' stepDown(10000)=', P.stepDown(10000));
console.log('■ 기간 경계 고치기(정상 80~190)', P.setTierRange(P.DEFAULTS.tierBounds, 1, 80, 190));
// 추가: 희소 아닌 부동 재고(판매자 많음) → 50% 할인 후 하한선
const many = [row('3', '상', 4000, 2500), row('2', '상', 4200, 2500), row('7', '상', 4500, 2500), row('1', '상', 5000, 2500)];
show('부동 재고 50% (희소 아님)', P.decide(L({ price: 5000, registeredAt: daysAgo(800), lowest: { days: 800 } }), M(many), sellers, ctx()));
show('부동 재고 50% + 매입가 높음 → 하한선', P.decide(L({ price: 5000, registeredAt: daysAgo(800), lowest: { days: 800 } }), M(many), sellers, ctx({ buyback: { '상': 1800 } })));
show('신규 원가 하한선(원가 4000)', P.decide(L({ price: 6000, cost: 4000, costSource: '김미소' }), M(many), sellers, ctx()));
show('맨 위 동가 — 한 단위 미만이지만 순위가 바뀜', P.decide(L({ price: 4020 }), M(many), sellers, ctx()));

// v0.2.0: 최저가 등록 기간
show('감시 전 등록 800일·최저가 5일 → 임시 T3', P.decide(L({ price: 5000, registeredAt: daysAgo(800), lowest: { days: 5 } }), M(many), sellers, ctx()));
show('감시 후 등록(5일 전)·최저가 3일 → T1 (임시 없음)', P.decide(L({ price: 5000, registeredAt: daysAgo(5), lowest: { days: 3 } }), M(many), sellers, ctx()));
show('감시 전 등록 800일·최저가 200일 → 측정 T3가 따라잡음', P.decide(L({ price: 5000, registeredAt: daysAgo(800), lowest: { days: 200 } }), M(many), sellers, ctx()));
show('감시 시작 370일 뒤 → 임시 기준 자동 종료', P.decide(L({ price: 5000, registeredAt: daysAgo(800), lowest: { days: 40 } }), M(many), sellers, ctx({ settings: { cutoverAt: daysAgo(370) } })));
show('판매자 기록 없는 매물이 앞에', P.decide(L({ price: 6000 }), M([row('999', '상', 3000, 2500), row('2', '상', 5500, 2500)]), sellers, ctx()));
show('비교군(controlPct 100)', P.decide(L({ price: 6000 }), M([row('2', '상', 5500, 2500)]), sellers, ctx({ settings: { rollout: { treatPct: 0, controlPct: 100 } } })));
const g = { treat: 0, control: 0, off: 0 }; for (let i = 0; i < 15544; i++) g[P.groupOf('U' + (5000000 + i * 7), { rollout: { treatPct: 1, controlPct: 0 } })]++; console.log('\n■ 1% 배정 (판매중 15,544개 가정)', g);
let st2 = null; [[0, true], [24, true], [48, true], [120, true], [144, false], [168, true], [192, true]].forEach(([h, lo]) => { st2 = P.trackLowest(st2, { at: new Date(Date.parse(now) + h * 3600e3).toISOString(), atLowest: lo }); });
console.log('\n■ 최저가 기간 누적 (0·24·48h 최저, 120h 최저(72h 공백 → 안 셈), 144h 밀림, 168·192h 최저) =', st2.days, '일');
console.log('■ 분류 확인(readnow-core 한 곳)', Object.entries(sellers).map(([k, v]) => k + ':' + window.ReadNowCore.classifySellerDoc(v, RS).cls).join(' '));
