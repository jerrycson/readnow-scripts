// tCTRLIMP2_A — (ctrlimp2 · 설계 CTRLDES1 8.4절·9절 「아」 · 정범님 11/18 22:55·23:44 결정 ⑧ㄱ) 🗼 묶음 관제창 판 아 — 📝 메모 꽂기
//  ① 글: 새 이름 한 번 선언 · 브라우저 창 없음 · 새 저장 없음(memo1 부품 그대로) · 카드·까닭 한 줄·일괄 고르기·메모 다시 적용에 걸림 · 설명서 문단
//  ② vm: 메모 상태(적용·세움·글만·못 읽음·없음) · 일괄에서 빼기 · 카드 칸은 그룹 화면과 같은 부품·같은 종류 · 메모가 바뀌면 걸린 그룹만 다시 셈
// 실행: node tCTRLIMP2_A.js · 시험 자료에 손님 정보 없음 · 실제 가격 바꾸기·확정 실행 없음
const fs = require('fs'); const path = require('path'); const vm = require('vm');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const m0 = T.indexOf('/* (판 아 · ctrlimp2'), m1 = T.indexOf('/* (판 사 · ctrlimp2'); const A = m0 > 0 && m1 > m0 ? T.slice(m0, m1) : '';
console.log('① 글');
ok(!!A, '판 아 덩이가 있음');
{ const names = ['CTRL_MEMO_STOP', 'ctrlMemoSt', 'ctrlMemoSkip', 'ctrlMemoBox', 'ctrlMemoKick'];
  const dup = names.filter((n) => (T.match(new RegExp(`(?:function\\*? ${n}\\s*\\(|(?:const |let |var |, )${n}\\s*=(?!=))`, 'g')) || []).length !== 1); ok(!dup.length, `새 이름 ${names.length}개는 파일 전체에서 한 번만 선언`, dup); }
ok(!/\b(alert|confirm|prompt)\s*\(/.test(A), '브라우저 창 없음');
ok(!/db\.collection|\.set\(|\.update\(|batchSave|runTransaction/.test(A), '새 저장·새 읽기 없음(메모는 memo1 부품이 씀)');
ok(/ctrlMemoBox\(P, it\)/.test(T) && /ctrlMemoSt\(x\) : null; if \(ms\) L\.push\(ms\.t\)/.test(T), '카드 📝 칸 · 까닭 한 줄 되알림에 걸림');
ok(/ctrlMemoSkip\(it\.x\) \? '📝 메모 확인 필요/.test(T), '일괄 결정 대기로에서 뺌');
{ const r0 = T.indexOf('function jmemoReapply('), r1 = T.indexOf('\n/* ', r0); ok(r0 > 0 && /ctrlMemoKick\(ch\)/.test(T.slice(r0, r1)), '메모가 바뀌면 관제창도 다시 셈(memo1 다시 적용 길)'); }
ok(/jmemoHtml\(\{ l, kind: JM_KIND_OF_TAB\[T\] \|\| 'price', x \}\)/.test(T) && /jmemoHtml\(\{ l: it\.x\.l, kind: \(typeof JM_KIND_OF_TAB !== 'undefined' && JM_KIND_OF_TAB\[P\.tab\]\) \|\| 'price', x: it\.x \}\)/.test(A), '그룹 화면 카드와 같은 부품·같은 종류');
ok(/📝 메모 꽂기 \(판 아\)/.test(T), '설명서 문단');

console.log('② vm');
const MEMOS = new Map(); let engine = true; const DIRTY = []; const TO = [];
const ctx = { console, Map, Set, Math, JSON, Object, String, Number, Array, isFinite, num: (n) => String(n), toast: (t) => TO.push(t), S: {},
  jmemoFor: (l) => MEMOS.get(l.id) || [], jmM: () => (engine ? {} : null), jmState: (m) => ({ c: m.st || 'ok' }), jmKeyOf: (l) => String(l.listingId || l.id || ''), jmIsbn: (l) => String(l.isbn13 || ''),
  JM_KIND_OF_TAB: { keep: 'keep', few: 'few' }, jmemoHtml: (o) => `<jm ${o.l.id}|${o.kind}|${o.x ? 'x' : '-'}>`,
  bkfDirty: (g) => DIRTY.push(g), ctrlKids: () => [{ id: 'g1' }, { id: 'g2' }, { id: 'g3' }], ctrlReset: () => {}, ctrlPaint: () => {}, ctrlLoad: () => {}, setTimeout: (f) => { f(); return 1; }, clearTimeout: () => {} };
vm.createContext(ctx);
vm.runInContext(A + '\n;this.__M = { ctrlMemoSt, ctrlMemoSkip, ctrlMemoBox, ctrlMemoKick };', ctx);
const M = ctx.__M; const L = (id, o) => ({ id, title: '시험 책 ' + id, price: 9000, isbn13: '978000000000' + id.slice(-1), ...(o || {}) });
ok(M.ctrlMemoSt({ l: L('a1') }) === null, '메모 없으면 없음');
MEMOS.set('a2', [{ id: 'm2', text: '바닥 8000' }]);
{ const s = M.ctrlMemoSt({ l: L('a2'), memo: { n: 1, used: ['바닥 8,000원'], need: [], wait: [] } }); ok(s && s.k === 'used' && /메모 규칙 적용: 바닥 8,000원/.test(s.t), '적용된 규칙이 까닭 한 줄에', s); ok(M.ctrlMemoSkip({ l: L('a2'), memo: { n: 1, used: ['x'], need: [], wait: [] } }) === null, '적용된 메모는 일괄에서 안 뺌'); }
ok(M.ctrlMemoSt({ l: L('a2'), memo: { n: 1, used: [], need: [], wait: [], hold: 'err' }, memoHold: 'err' }).k === 'hold', '규칙 못 읽어 판정 세움 → 세움');
ok(M.ctrlMemoSt({ l: L('a2') }).k === 'unread', '메모가 있는데 판정이 안 읽음 → 못 읽음');
engine = false; ok(M.ctrlMemoSt({ l: L('a2'), memo: { n: 1, used: [], need: [], wait: [] } }).k === 'unread', '판정 엔진이 없으면 못 읽음'); engine = true;
ok(M.ctrlMemoSt({ l: L('a2'), memo: { n: 1, used: [], need: ['애매한 말'], wait: [] } }).k === 'raw', '못 알아들은 글 → 글만');
ok(M.ctrlMemoSt({ l: L('a2'), memo: { n: 1, used: [], need: [], wait: ['천장 7000'] } }).k === 'raw', '「맞음」 전 낮추는 규칙 → 글만');
MEMOS.set('a3', [{ id: 'm3', text: '?', st: 'warn' }]); ok(M.ctrlMemoSt({ l: L('a3'), memo: { n: 1, used: [], need: [], wait: [] } }).k === 'raw', '사람 확인 필요 메모 → 글만');
MEMOS.set('a4', [{ id: 'm4', text: '꺼짐', off: true }]); ok(M.ctrlMemoSt({ l: L('a4') }) === null, '휴지통 메모는 셈 안 함');
ok(/메모 확인|글만|못 읽/.test(M.ctrlMemoSkip({ l: L('a2'), memo: { n: 1, used: [], need: ['x'], wait: [] } }) || ''), '글만 상품은 일괄에서 뺄 까닭이 나옴');
ok(M.ctrlMemoBox({ tab: 'keep' }, { x: { l: L('a2') } }) === '<jm a2|keep|x>' && M.ctrlMemoBox({ tab: 'sel' }, { x: { l: L('a2') } }) === '<jm a2|price|x>', '카드 칸 = 같은 부품 · 탭 따라 같은 종류');
ok(M.ctrlMemoBox({ tab: 'sel' }, { x: { l: L('a2') }, moved: 'gone' }) === '', '빠진 카드엔 칸 없음');
// 메모가 바뀜 → 걸린 그룹만
ctx.S._bkfCtrl = { fid: 'f1', rows: [{ gid: 'g1', k: 'aladin_U1', x: { l: L('a5', { usedCode: 'U1' }) } }, { gid: 'g2', k: 'aladin_U2', x: { l: L('a6', { usedCode: 'U2' }) } }] };
DIRTY.length = 0; ok(M.ctrlMemoKick([{ scope: 'lid', key: 'aladin_U2' }]) === 1 && DIRTY.join() === 'g2', '상품 메모 → 그 상품 그룹만 다시 셈', DIRTY);
DIRTY.length = 0; ok(M.ctrlMemoKick([{ scope: 'seller', key: 's' }]) === 3 && DIRTY.length === 3, '판매자 메모 → 묶음 그룹 모두', DIRTY);
DIRTY.length = 0; ok(M.ctrlMemoKick([{ scope: 'lid', key: 'nothing' }]) === 0 && !DIRTY.length, '걸린 상품 없으면 안 셈');
ok(TO.some((t) => /다시 셈/.test(t)), '다시 셈 알림');
ctx.S._bkfCtrl = null; ok(M.ctrlMemoKick([{ scope: 'seller' }]) === 0, '관제창이 닫혀 있으면 아무것도 안 함');
console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
