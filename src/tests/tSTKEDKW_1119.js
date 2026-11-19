// tSTKEDKW — (11/19 정범님 I-1118-2245-28.3 판 ③) 📦 재고 품목 🔖 키워드 상품 탭: 갈래·개수·거르기 · 모으기(한 번 600권·이어서·설정 꺼짐·낱말 없는 유의 사항은 메모리에 안 둠) · 탭 시장 지표 24시간 잠금 · 판본 칸 · 재고·판매 상태 안 바뀜
// 실행: node tSTKEDKW_1119.js · 시험 자료는 가짜 상품만(손님 정보 없음)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i); if (i < 0 || j < i) throw new Error('못 찾음: ' + a); return T.slice(i, j); };
const BLK = cut('/* ◆stkedkw 시작', '/* ◆stkedkw 끝 */'); const PF = cut('async function edNotePrefetch(', '\n/* 수동 일괄');
const store = {}; const LS = { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } };
const toasts = []; const reads = []; const NOTES = {}; // listingId → note
const db = { collection: (c) => ({ where: (f, op, ids) => ({ get: async () => { reads.push(ids.length); return { forEach: (fn) => ids.filter((x) => x in NOTES).forEach((x) => fn({ id: x, data: () => ({ note: NOTES[x], hasNote: true }) })) }; } }) }) };
const firebase = { firestore: { FieldPath: { documentId: () => '__id__' } } };
const KW = ['사인본', '한정']; const P = { edNoteKw: (t) => KW.filter((k) => String(t).includes(k)) };
const S = { app: {}, nbmLoaded: true, nbm: new Map(), pmetrics: new Map() };
// 가짜 판본 함수 — 진짜 판단은 tEDKW1117·tEDKW2_1117이 봄 · 여기선 탭 틀만
const ED = { a: { kw: ['리커버'], br: [], note: [] }, b: { kw: [], br: [], note: ['사인본'] }, c: { kw: [], br: ['양장'], note: [] } };
const PICK = { c: { itemId: '9' } }; const USE = { a: 'check', b: 'auto', c: 'srch' }; const CANDS = { a: [{ itemId: '1', title: 'x', channels: { seller: { min: 9000, n: 3 } } }], b: [], c: [{ itemId: '9', channels: { seller: { min: 7000, n: 2 } } }] };
const env = { S, db, firebase, edSplitTxt: () => "", PRDF: () => P, localStorage: LS, toast: (m, e) => toasts.push([m, e]), num: (n) => String(n), won: (n) => n + '원', esc: (x) => String(x), regAgo: (ms) => Math.round(ms / 6e4) + '분',
  edOf: (l) => (S.app.edSearch === false ? null : ED[l.id] || null), edPickOf: (l) => PICK[l.id] || null, edUse: (l) => USE[l.id] || null, edCandsOf: (l) => CANDS[l.id] || [], edRec: () => null, edHide: (l) => USE[l.id] === 'check',
  edChMin: (c) => c.channels.seller.min, edChN: (c) => c.channels.seller.n, edKwHits: (l) => { const r = ED[l.id]; return r ? [...r.kw, ...r.br.map((b) => `(${b})`), ...r.note] : []; }, edKwState: () => '', edCandRow: (l, c) => `<div data-edpick="${l.id}|${c.itemId}">후보 ${c.itemId}</div>`,
  loadNbm: async () => { S.nbmLoaded = true; }, STK_MET_MS: 24 * 36e5, edUrlOut: () => false, edUrlBtn: (l) => `<button data-edurl="${l.id}">＋ 후보에 없는 판</button>` }; /* (판 ④) 주소 붙여 정함 단추 — 자세한 것은 tEDPICKURL_1119 */
const names = Object.keys(env); const F = new Function(...names, PF + '\n' + BLK + '; return { edNotePrefetch, stkEkKind, stkEkIn, stkEkCount, stkEkLeft, stkEkAt, stkEkLock, stkEkGather, stkEkMkt, stkEkPanel, stkEkBar, stkEkTag, STK_EK_CAP, STK_EKF };')(...names.map((k) => env[k]));
const L = (id, o) => ({ id, listingId: 'L' + id, title: '책 ' + id, status: '판매중', price: 10000, qty: 1, ...o });
(async () => {
  console.log('① 갈래·개수·거르기');
  { const A = L('a'), B = L('b'), C = L('c'), X = L('x'); const k = F.stkEkKind(A); ok(k.k === 'kw' && k.chk && k.pk === null && k.nc === 1, '제목 낱말 + 사람 확인 = kw·확인 필요', k);
    ok(F.stkEkKind(B).k === 'note' && F.stkEkKind(B).nc === 0, '유의 사항만 = note · 후보 없음'); ok(F.stkEkKind(C).pk === 'done', '괄호 + 판 정함 = done'); ok(F.stkEkKind(X) === null, '판본 의심 아님 = null');
    const c = F.stkEkCount([A, B, C, X]); ok(c.n === 3 && c.kw === 2 && c.note === 1 && c.check === 1 && c.done === 1 && c.nocand === 1 && c.none === 0, '개수 — 3권(낱말 2·유의 사항 1·확인 필요 1·판 정함 1·후보 없음 1)', c);
    ok(F.stkEkIn('check', F.stkEkKind(A)) && !F.stkEkIn('check', F.stkEkKind(C)) && F.stkEkIn('all', F.stkEkKind(C)) && F.stkEkIn('nocand', F.stkEkKind(B)), '거르기 칩'); ok(F.STK_EKF.length === 5, '거르기 5개(모두·확인 필요·판 정함·다 아님·후보 없음)'); }
  console.log('② 모으기 — 재고·판매 상태 안 바뀜 · 한 번 600권 · 이어서 · 낱말 없는 글은 안 둠');
  { const ls = []; for (let n = 0; n < 650; n++) ls.push(L('p' + n)); ls[3].listingId = 'L3'; NOTES['Lp3'] = '사인본 있음'; NOTES['Lp4'] = '깨끗함'; NOTES['Lp640'] = '한정 1000부';
    const snap = JSON.stringify(ls); const pr = []; const r = await F.stkEkGather(ls, (d, t) => pr.push([d, t]));
    ok(JSON.stringify(ls) === snap, '상품 자료(상태·수량·판매가) 그대로'); ok(reads.reduce((a, b) => a + b, 0) === 600, '한 번에 600권만 읽음', reads.reduce((a, b) => a + b, 0));
    ok(S.uinfo.has('Lp4') === false && S._edNtAsk.has('Lp4'), '낱말 없는 유의 사항(Lp4)은 S.uinfo에 안 둠 · 다시 묻지 않음 표시');
    ok(r && r.left === 50, '남은 50권을 알려 줌', r && r.left); ok(pr.length && pr[pr.length - 1][0] === 600 && pr[pr.length - 1][1] === 600, '진행 600/600', pr.slice(-1)); ok(/참고용 · 재고·판매 상태는 그대로/.test(toasts[toasts.length - 1][0]) && /이어서 모으기/.test(toasts[toasts.length - 1][0]), '알림에 참고용·이어서 안내'); ok(F.stkEkAt() > 0, '마지막 모음 때를 기억');
    reads.length = 0; const r2 = await F.stkEkGather(ls); ok(reads.reduce((a, b) => a + b, 0) === 50 && r2.left === 0, '이어서 — 남은 50권만 읽음'); ok(S.uinfo.get('Lp640').note === '한정 1000부', '낱말 걸린 글(Lp640)은 둠');
    reads.length = 0; await F.stkEkGather(ls); ok(reads.length === 0, '다 본 뒤 다시 눌러도 안 읽음'); }
  { reads.length = 0; S.uinfo = new Map(); S._edNtAsk = new Set(); NOTES['Lq'] = '깨끗함'; await F.edNotePrefetch([L('q')]); ok(S.uinfo.has('Lq'), '수동 일괄(drop 없음)은 그대로 둠'); }
  { S.app.edSearch = false; const t0 = toasts.length; reads.length = 0; const r = await F.stkEkGather([L('zz')]); ok(r === null && reads.length === 0 && /꺼져/.test(toasts[t0][0]), '⚙ 판본 검색 꺼짐이면 안 모음·까닭 알림'); S.app.edSearch = undefined; }
  { S.nbmLoaded = false; await F.stkEkGather([]); ok(S.nbmLoaded === true, '판본 대조 기록이 없으면 먼저 받음'); }
  console.log('③ 탭 시장 지표 24시간 잠금');
  { ok(F.stkEkLock() === 0, '처음엔 안 잠김'); F.stkEkLock(1, 1000); ok(F.stkEkLock(0, 1000 + 36e5) > 0, '1시간 뒤엔 잠김'); ok(F.stkEkLock(0, 1000 + 24 * 36e5 + 1) === 0, '24시간 뒤 풀림');
    const bar = F.stkEkBar({ c: F.stkEkCount([L('a')]), f: 'all', at: 0, left: 5, lockMs: 3 * 36e5, nTab: 300, max: 200, off: false }); ok(/data-stkekmet="1"[^>]*disabled/.test(bar) && /3시간 뒤 다시/.test(bar), '잠긴 동안 단추 꺼짐 · 몇 시간 뒤'); ok(/판본 키워드 모으기\(5권\)/.test(bar), '처음 모으기 단추에 남은 수');
    const b2 = F.stkEkBar({ c: F.stkEkCount([L('a')]), f: 'check', at: Date.now(), left: 0, lockMs: 0, nTab: 300, max: 200, off: false }); ok(/\(200권\)/.test(b2) && !/disabled/.test(b2), '한 번 한도 200권'); ok(/class="on" data-stkekf="check"/.test(b2), '고른 거르기 on'); ok(/참고용 모음/.test(b2), '참고용이라 밝힘');
    const b3 = F.stkEkBar({ c: F.stkEkCount([]), f: 'all', at: 0, left: 0, lockMs: 0, nTab: 0, max: 200, off: true }); ok(/꺼져 있음/.test(b3) && !/data-stkekgo/.test(b3), '설정 꺼짐이면 모으기 단추 대신 까닭'); }
  console.log('④ 판본 칸 · 꼬리표');
  { S.nbmLoaded = true; const A = L('a', { bookId: 'bk' }); S.pmetrics.set('bk', { usedMins: { x: { min: 8000 }, y: { min: 6500 } }, usedTotal: 12 });
    const h = F.stkEkPanel(A); ok(/자동: 최저 6500원 · 12곳/.test(h) && /검색: 1위 후보 최저 9000원 · 3곳/.test(h), '시장 두 줄(자동·검색)', h.slice(0, 400)); ok(/data-edpick="a\|1"/.test(h), '후보 줄에 「이 판으로 정함」'); ok(/data-ednone="a"/.test(h) && !/data-edundo/.test(h), '정하기 전 — 다 아님만'); ok(/가격 계산에 안 씀/.test(h), '사람 확인 전 자동 값은 참고만');
    const hc = F.stkEkPanel(L('c')); ok(/검색: 정한 판 최저 7000원 · 2곳/.test(hc) && /data-edundo="c"/.test(hc), '정한 판 · 되돌리기');
    const hb = F.stkEkPanel(L('b')); ok(/후보 아직 없음/.test(hb) && /data-stkmet1="b"/.test(hb), '후보 없으면 판본 검색 맡기기'); ok(F.stkEkPanel(L('x')) === '', '판본 의심 아니면 빈칸');
    const t = F.stkEkTag(A, F.stkEkKind(A)); ok(/data-stkedx="a"/.test(t) && /리커버/.test(t) && /확인 필요/.test(t), '다른 탭 꼬리표 — 낱말·확인 필요'); }
  console.log(bad ? '❌ ' + bad + '개 실패' : '✓ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 오류', e.stack); process.exit(1); });
