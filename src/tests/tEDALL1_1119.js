// tEDALL1_1119 — (edall1b · 판본 판 ①) 🔖 근거 틀과 낱말 한 벌 — edDecide가 근거 줄 ev·점수 sc·틀 번호 evV를 더 돌려줌(판정은 그대로) · 낱말 세 곳 같은 한 벌 · 「초판 6쇄」는 판 아님
// 쓰는 법: node tEDALL1_1119.js [저장소 뿌리=../..]
const fs = require('fs'), vm = require('vm'), path = require('path');
const R = process.argv[2] || path.join(__dirname, '..', '..');
const rd = (f) => fs.readFileSync(path.join(R, f), 'utf8');
let n = 0, bad = 0; const ok = (c, m) => { n++; if (!c) bad++; console.log((c ? '  ✓ ' : '  ❌ ') + m); };
const mk = (f, extra) => { const m = { exports: {} }; vm.runInNewContext(rd(f), { module: m, exports: m.exports, console, Date, JSON, Math, Intl, ...(extra || {}) }, { filename: f }); return m.exports; };
const P = mk('readnow-products-core.js');
const PRalone = mk('readnow-pricing-core.js');                       // 상품 공용 없이 불러옴 = 옛 글자 그대로
const PRwith = mk('readnow-pricing-core.js', { window: { ReadnowProducts: P } }); // 상품 공용이 같은 곳에 있음

console.log('① 근거 틀 ev·sc·evV');
const our = { title: '아내를 모자로 착각한 남자 (교보 리커버 한정판)', bookId: 'bk_1', bookTitle: '아내를 모자로 착각한 남자', code: null };
const d1 = P.edDecide(our, null);
ok(d1.on && d1.use === 'check' && d1.hold === true, '검색 전 · 자동 지표 낱말 다름 → 판정은 사람 확인(그대로)');
ok(Array.isArray(d1.ev) && d1.ev.length >= 2 && d1.ev.length <= 12, '근거 줄 2~12줄 — ' + d1.ev.length);
ok(d1.ev.every((e) => typeof e.k === 'string' && [1, -1, 0].includes(e.v) && e.w >= 0 && e.w <= 1 && typeof e.d === 'string' && e.d.length <= 60), '줄 꼴 {k,v,w,d} · v는 +1·−1·0 · w 0~1 · d 60자 안');
ok(d1.ev.some((e) => e.k === 'kw' && e.v === -1), '자동 지표 상품 낱말 다름 → 다른 판 쪽 줄(v −1)');
ok(d1.sc && d1.sc.diff > 0 && d1.sc.same === 0 && d1.evV === 1, '점수 sc.diff > 0 · evV 1');
const d0 = P.edDecide({ title: '평범한 책 제목' }, null);
ok(d0.on === false && d0.ev === undefined, '의심 아님 → 그대로(근거 줄 없음)');
const many = { title: '책 (' + Array.from({ length: 9 }, (_, i) => '리커버 한정판 특별판 에디션 사인본 가' + i).join(') (') + ')', bookId: 'bk_2', bookTitle: '책' };
ok(P.edDecide(many, null).ev.length <= 12, '근거 줄은 많아야 12줄');
const doc = { src: 'usedSearch', cands: [{ itemId: '11', title: '아내를 모자로 착각한 남자 (교보 리커버 한정판)', img: 'https://x/cover/K123456789_1.jpg', cov: 1 }, { itemId: '12', title: '아내를 모자로 착각한 남자', cov: 1 }] };
const d2 = P.edDecide({ ...our, code: 'K123456789' }, doc);
ok(d2.use === 'srch' && d2.pick.itemId === '11', '표지 코드 같은 후보 → 검색 시장(판정 그대로)');
ok(d2.ev.some((e) => e.k === 'code' && e.v === 1 && e.w === 0.9) && d2.sc.same >= 0.9, '표지 코드 같음 줄 +1 무게 0.9');
const d3 = P.edDecide(our, doc, { pick: { itemId: '12' } });
ok(d3.human === true && d3.ev.some((e) => e.k === 'human' && e.v === 1 && e.w === 1), '사람이 고른 판 줄');
ok(d2.why && d2.ids.length === 1 && d2.use === 'srch' && !('ev' in d0), 'ev·sc·evV 밖의 칸(why·ids·use)은 그대로');

console.log('② 「n쇄」 뒤집는 규칙');
ok(!P.edKwOf('어떤 책 초판 6쇄').includes('초판'), '「초판 6쇄」는 판 아님');
ok(!P.edKwOf('어떤 책 (초판 12쇄)').includes('초판'), '「초판 12쇄」도 판 아님');
ok(P.edKwOf('어떤 책 초판 1쇄').includes('초판'), '「초판 1쇄」는 그대로 초판');
ok(P.edKwOf('어떤 책 초판').includes('초판'), '「초판」만 있으면 그대로');
ok(P.edKwOf('어떤 책 리커버 초판 3쇄').includes('리커버'), '쇄가 있어도 다른 낱말(리커버)은 남음');

console.log('③ 낱말 한 벌 — 세 곳이 같은 결과');
const W16 = P.ED_KW;
ok(JSON.stringify(PRalone.DEFAULTS.specialKeywords) === JSON.stringify(W16), '가격 코어 단독 specialKeywords = 상품 공용 ED_KW 16개(옛 글자 그대로)');
ok(JSON.stringify(PRwith.DEFAULTS.specialKeywords) === JSON.stringify(W16), '상품 공용과 함께 불러도 같음');
const M0 = PRalone.Memo.ED_KW, M1 = PRwith.Memo.ED_KW;
ok(M0.length === 30 && P.ED_ALL.every((k) => M1.includes(k)) && M0.every((k) => M1.includes(k)), '메모 ED_KW — 단독은 옛 30개 · 함께 쓰면 상품 공용 표 전부 + 옛 낱말 모두');
ok(P.ED_ALL.length >= 60, '상품 공용 표 ED_ALL 유지');
console.log(bad ? `❌ 실패 ${bad}/${n}` : `✓ 통과 ${n}/${n}`); process.exit(bad ? 1 : 0);
