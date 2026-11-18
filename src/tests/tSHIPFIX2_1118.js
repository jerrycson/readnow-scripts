// tSHIPFIX2_1118 — (정범님 11/18 I-1118-2245-28 · 일꾼 shipfix2) 유의 사항 '끝남' 판정 · 웹앱 고침 바로 반영 · 💰 이득/💸 손해 정렬 = 카드 % 순서
//  ① 같은 상품(SKU = 상품 번호)을 한 번 제대로 읽으면(글이 없다고 확인한 것도) 저절로 다시 맡기지 않음 — 등급(최상·상·중·하) 상관없이
//  ② 못 읽은 것만 간격을 늘려(30분 → 1시간 → 2시간 … 최대 하루) 다시 — 간격 전에는 안 맡기고 간격이 차면 맡김
//  ③ 웹앱에서 고친 유의 사항(prdEdit · 샵매니저 확인 st scm·pub·pubwait)이 이 기기 기억(S.uinfo · S.shipUinfo)에 바로 · 클라우드도 prd_used_info에 바로 씀
//  ④ 정렬 열쇠 = 카드 괄호 % 와 같은 함수(saleEvalIn → evalSale ratio) · 음수 · 여러 상품 주문 Σ(판매가×수량)/Σ(기준가×수량)−1 · 값 없는 주문은 늘 맨 아래
// 실행: node tSHIPFIX2_1118.js (브라우저 없이 · 함수만 떼어 냄 · 1초) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 600)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const CLOUD = [path.resolve(__dirname, '..', 'cloud', 'index.js'), path.resolve(__dirname, '..', '..', 'cloud', 'index.js')].find((x) => fs.existsSync(x));
const PRD = [path.resolve(__dirname, '..', 'readnow-collector.src.js'), path.resolve(__dirname, '..', '..', 'src', 'readnow-collector.src.js'), path.resolve(__dirname, '..', 'readnow-pc-products.js'), path.resolve(__dirname, '..', '..', 'readnow-pc-products.js')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const fnSrc = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; let d = 0, j = src.indexOf('{', i); for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (!d) break; } } return src.slice(i, j + 1); };
const lineOf = (src, head) => { const i = src.indexOf(head); return i < 0 ? '' : src.slice(i, src.indexOf('\n', i)); };

/* 웹앱 함수 떼어 내기 — S·uiAsk·db 등은 가짜 */
const env = { S: {}, asked: [], writes: [] };
const mk = () => new Function('env', `const S = env.S; const esc = (x) => String(x); const uiAsk = (lid, gr) => env.asked.push([lid, gr]); const noteRefresh = () => {}; const shipRerender = () => {};
  const peNoteParts = (h) => ({ text: String(h || '').replace(/<br\\s*\\/?>/gi, '\\n').replace(/<[^>]+>/g, '').trim() });
  const db = { collection: (n) => ({ doc: (id) => ({ set: (v, o) => { env.writes.push([n, id, v, o]); return Promise.resolve(); } }) }) };
  ${fnSrc(T, 'noteTxt')}
  ${fnSrc(T, 'noteAtTxt')}
  ${fnSrc(T, 'noteSt')}
  ${fnSrc(T, 'uiFin')}
  ${lineOf(T, 'const uiGap = ')}
  ${fnSrc(T, 'uiRetryAt')}
  ${fnSrc(T, 'uiAutoAsk')}
  ${lineOf(T, 'const uiNextTxt = ')}
  ${lineOf(T, 'const uiLink = ')}
  ${fnSrc(T, 'uiMissState')}
  ${fnSrc(T, 'uiNoneState')}
  ${lineOf(T, 'const NOTE_ED_OK = ')}
  ${fnSrc(T, 'noteEdApply')}
  return { uiFin, uiGap, uiRetryAt, uiAutoAsk, uiMissState, uiNoneState, noteEdApply };`)(env);
let F; try { F = mk(); } catch (e) { ok(false, '웹앱 함수 떼어 내기', e.message); }
const reset = () => { env.S = { user: { email: 'tester@example.com' } }; env.asked = []; env.writes = []; F = mk(); };
const iso = (msAgo) => new Date(Date.now() - msAgo).toISOString(); const MIN = 60e3, H = 36e5;

console.log('① 한 번 제대로 읽으면 끝 — 글이 있든, 글이 없다고 확인했든 · 모든 등급');
if (F) { reset();
  for (const gr of ['최상', '상', '중', '하']) {
    ok(F.uiFin({ checkedAt: iso(H), hasNote: false, note: null }, gr) === 'done', `${gr}: 글 없음 확인(checkedAt) = 끝남`);
    ok(F.uiFin({ note: '모서리 약간 눌림', hasNote: true }, gr) === 'done', `${gr}: 글이 있음 = 끝남`);
    ok(F.uiFin({ checkedAt: iso(40 * 864e5), lastMissAt: iso(MIN), missN: 2 }, gr) === 'done', `${gr}: 예전에 읽은 뒤 실패가 와도 끝남 그대로`);
  }
  env.S.uiCmds = {}; const u = { checkedAt: iso(2 * H), hasNote: false, note: null };
  ok(F.uiAutoAsk('111', '중', u, null) === false && !env.asked.length, '끝난 상품은 저절로 맡기지 않음(중)');
  const t1 = F.uiMissState('111', u, '중'); ok(/글 없음/.test(t1) && /저절로 다시 읽지 않음/.test(t1) && !env.asked.length, '출고 카드(중): 「글 없음 — 확인함 · 저절로 다시 읽지 않음」', t1);
  const t2 = F.uiNoneState('222', '상', { checkedAt: iso(H), hasNote: false }); ok(/글 없음 확인/.test(t2) && !env.asked.length, '최상·상 카드: 「글 없음 확인 — 저절로 다시 읽지 않음」', t2);
  for (let i = 0; i < 5; i++) { F.uiMissState('111', u, '중'); F.uiNoneState('222', '상', { checkedAt: iso(H) }); } ok(!env.asked.length, '여러 번 다시 그려도(다른 화면이 같은 기록을 봐도) 맡기지 않음');
  ok(F.uiFin(undefined, '중') === undefined && F.uiAutoAsk('333', '중', undefined, null) === false, '기록을 아직 불러오는 중(undefined)이면 판정 안 함 · 맡기지 않음');
  env.S.shipUiBusy = true; ok(F.uiAutoAsk('334', '중', null, null) === false, '출고 탭이 기록을 불러오는 중(null + 불러오는 중)이면 맡기지 않음'); env.S.shipUiBusy = false;
  ok(F.uiFin({ editedAt: iso(MIN), note: null }, '중') === 'done', '웹앱에서 고친 것(editedAt)도 끝남(고친 글이 비어도)');
}

console.log('② 못 읽은 것만 간격을 늘려 다시');
if (F) { reset(); env.S.uiCmds = {};
  ok(F.uiGap(1) === 30 * MIN && F.uiGap(2) === 60 * MIN && F.uiGap(3) === 120 * MIN && F.uiGap(20) === 24 * H, '간격 30분 → 1시간 → 2시간 … 최대 하루', [1, 2, 3, 20].map(F.uiGap));
  const f1 = { lastMissAt: iso(10 * MIN), missN: 1, lastMissWhy: '상품 화면에 유의 사항 칸이 없음' };
  ok(F.uiFin(f1, '상') === 'fail', '읽은 때(checkedAt) 없이 못 읽은 때만 = 실패');
  ok(F.uiAutoAsk('500', '상', f1, null) === false && !env.asked.length, '실패 10분 뒤(간격 30분 전)에는 안 맡김');
  const t1 = F.uiNoneState('500', '상', f1); ok(/못 읽음/.test(t1) && /저절로 다시/.test(t1) && !/읽은 때/.test(t1), '카드: 「못 읽음(까닭) · …쯤 저절로 다시」 — 실패를 「읽은 때」로 적지 않음', t1);
  const f2 = { lastMissAt: iso(31 * MIN), missN: 1 };
  ok(F.uiAutoAsk('501', '상', f2, null) === true && env.asked.length === 1 && env.asked[0][0] === '501', '간격(30분)이 차면 맡김 — 최상·상도(예전엔 실패해도 다시 안 읽음)');
  ok(F.uiAutoAsk('501', '상', f2, null) === false && env.asked.length === 1, '방금 맡긴 것은 한 번 더 안 맡김(이 기기 기억 S._uiAsk)');
  env.asked = []; const f3 = { lastMissAt: iso(90 * MIN), missN: 3 }; ok(F.uiAutoAsk('502', '중', f3, null) === false, '세 번 실패 → 간격 2시간 · 1시간 반 뒤에는 아직');
  const f4 = { lastMissAt: iso(121 * MIN), missN: 3 }; ok(F.uiAutoAsk('503', '중', f4, null) === true, "'중' 세 번 실패해도 2시간 뒤 다시 맡김(예전엔 3번 뒤 멈춤)");
  const f5 = { lastMissAt: iso(25 * H), missN: 9 }; ok(F.uiAutoAsk('504', '중', f5, { status: 'stuck', tries: 9, stuckAt: iso(25 * H) }) === true, '아홉 번 실패해도 하루 뒤 다시(멈춘 맡긴 일도)');
  env.asked = []; ok(F.uiAutoAsk('505', '중', f5, { status: 'queued' }) === false && F.uiAutoAsk('505', '중', f5, { status: 'running' }) === false && !env.asked.length, '이미 맡겨져 있거나(queued) 읽는 중(running)이면 겹쳐 맡기지 않음');
  const t2 = F.uiMissState('506', { lastMissAt: iso(5 * MIN), missN: 1, lastMissWhy: "'중' 상품인데 유의 사항 글이 비어 있음" }, '중'); ok(/못 읽음/.test(t2) && /저절로 다시/.test(t2) && !env.asked.length, '출고 카드(중) 실패: 까닭 + 다시 읽을 때', t2);
  env.asked = []; ok(F.uiAutoAsk('507', '하', null, null) === true, '기록이 아예 없음(null) = 한 번 맡김');
  const ua = fnSrc(T, 'uiAsk'); ok(/uiGap\(x\.tries \|\| 1\)/.test(ua) && !/tries\s*\|\|\s*0\)\s*>=\s*3/.test(ua), '맡기는 곳(uiAsk)도 「3번 뒤 그만」 대신 간격 규칙(다른 기기와 겹치지 않음)');
  const pk = fnSrc(T, 'plkNoteAuto'); ok(/uiFin\(/.test(pk) && /uiRetryAt\(/.test(pk), '잠금 서랍 자동 읽기(plkNoteAuto)도 같은 판정·간격');
}

console.log('③ 웹앱에서 고친 유의 사항이 바로 모든 화면에');
if (F) { reset(); env.S.uinfo = new Map([['700', { listingId: '700', note: '옛 글 — 모서리 눌림', hasNote: true, checkedAt: iso(3 * H) }], ['701', { listingId: '701', note: '다른 상품', checkedAt: iso(H) }]]); env.S.shipUinfo = new Map([['700', { listingId: '700', note: '옛 글 — 모서리 눌림', checkedAt: iso(3 * H) }]]);
  const c = { id: 'pe1', type: 'prdEdit', listingId: '700', listingKey: 'aladin_X', ch: { note: '새 글<br>밑줄 두 쪽' }, f: { note: { st: 'scm' } }, by: 'tester@example.com', scmAt: new Date().toISOString(), status: 'verify' };
  ok(F.noteEdApply({ ...c, f: { note: { st: 'send' } }, id: 'pe0' }, true) === false && env.S.uinfo.get('700').note.startsWith('옛 글'), '샵매니저 확인 전(보내는 중)에는 안 바꿈');
  ok(F.noteEdApply(c, true) === '700', '샵매니저에서 확인된 순간(st scm) 바꿈');
  const u = env.S.uinfo.get('700'), s = env.S.shipUinfo.get('700'); ok(u.note === '새 글\n밑줄 두 쪽' && u.hasNote && u.editedAt && u.editCmd === 'pe1', '상품 상세·수동 일괄·잠금 서랍 기억(S.uinfo)에 새 글', u);
  ok(s.note === '새 글\n밑줄 두 쪽' && s.editedAt, '출고 카드 기억(S.shipUinfo)에도 새 글', s);
  ok(env.S.uinfo.get('701').note === '다른 상품', '다른 상품은 그대로');
  ok(env.writes.length === 1 && env.writes[0][0] === 'prd_used_info' && env.writes[0][1] === '700' && env.writes[0][2].note === '새 글\n밑줄 두 쪽' && env.writes[0][2].editedAt && env.writes[0][3] && env.writes[0][3].merge, '고친 사람 기기가 prd_used_info에 새 글(editedAt · 합쳐 쓰기 · 지우지 않음)', env.writes);
  ok(F.noteEdApply(c, true) === false && env.writes.length === 1, '같은 고침은 한 번만');
  env.writes = []; ok(F.noteEdApply({ ...c, id: 'pe2', by: 'other@example.com', ch: { note: '세 번째 글' }, scmAt: new Date(Date.now() + 1000).toISOString() }, true) === '700' && env.S.uinfo.get('700').note === '세 번째 글' && !env.writes.length, '다른 사람이 고친 것도 이 기기 화면에 바로(쓰기는 고친 사람·클라우드 몫)');
  env.S.uinfo.set('702', { note: '알라딘에서 바로 고친 글', checkedAt: new Date(Date.now() + 60e3).toISOString() }); ok(F.noteEdApply({ ...c, id: 'pe3', listingId: '702', ch: { note: '옛 고침' } }, false) === false && env.S.uinfo.get('702').note === '알라딘에서 바로 고친 글', '고친 뒤 더 새로 읽은 글이 있으면 옛 고침으로 덮지 않음');
  ok(F.noteEdApply({ ...c, id: 'pe4', listingId: '703' }, false) === false && !env.S.uinfo.has('703'), '아직 안 불러온 상품은 건드리지 않음(불러올 때 새 기록이 옴)');
  ok(F.uiFin(env.S.uinfo.get('700'), '중') === 'done', '고친 글 = 끝남(저절로 다시 맡기지 않음)');
  ok(/function noteEdWatch\(\)[\s\S]{0,200}cmdHubOn\(\['prdEdit'\]/.test(T) && /noteEdWatch\(\)/.test(fnSrc(T, 'loadShip')), '고치기 맡긴 일 듣기(cmdHubOn prdEdit)가 출고 탭을 열 때 켜짐');
  if (CLOUD) { const C = fs.readFileSync(CLOUD, 'utf8'); const pe = fnSrc(C, 'prdEditRun'); const ru = fnSrc(C, 'refreshUsedInfo');
    ok(/done\.includes\('note'\) && v\.listingId\)[\s\S]{0,200}C\('prd_used_info'\)\.doc\(String\(v\.listingId\)\)\.set\(\{[^}]*editedAt: ea[^}]*\}, \{ merge: true \}\)/.test(pe), '클라우드: 고친 유의 사항을 샵매니저에서 확인한 순간 prd_used_info에도 씀(합쳐 쓰기)');
    ok(/const edPend = [^;]*prev\.editedAt[^;]*prev\.checkedAt/.test(ru) && /if \(!info\._box \|\| !info\.hasNote \|\| edPend\)/.test(ru), '클라우드: 고친 뒤 첫 다시 읽기는 샵매니저 수정 화면에서(공개 화면 캐시의 옛 글로 안 되돌아감)');
    ok(/grade === '중' && !\(prev && prev\.note\) && info\.src !== 'scm'\)/.test(ru), "클라우드: '중'도 샵매니저 수정 화면이 비어 있으면 글 없음 확인(읽음)");
    ok(/String\(ui\.checkedAt \|\| ''\) >= t0u\)\)/.test(C) && !/v\.grade !== '중' && String\(ui\.checkedAt/.test(C), '클라우드: 맡긴 일 성공 = 이번에 읽음(checkedAt) — 등급 상관없이'); }
  if (PRD) { const P = fs.readFileSync(PRD, 'utf8'); const ro = fnSrc(P, 'readOurUsed'); ok(/box = true; scm = true;/.test(ro) && /grade === '중' && !scm\) return miss/.test(ro), "수집기: '중'도 샵매니저 수정 화면이 비어 있으면 글 없음 확인(클라우드와 같은 규칙)"); }
}

console.log('④ 💰 이득·💸 손해 정렬 = 카드 괄호 % 순서');
{ const evOf = new Map(); /* 상품 번호 → 카드에 보이는 평가(ratio = 카드 %) */
  const G = new Function('env', `const S = env.S; const window = { ReadnowML: { evalSale: () => null } }; const shipSevOf = (it) => env.evOf.get(String(it.listingId)) || null;
    ${fnSrc(T, 'shipGainOf')}
    const gainCmp = (d) => { const kk = 'gain'; ${lineOf(T, "if (kk === 'gain') {").replace(/\} \/\*.*$/, '}')} };
    return { shipGainOf, gainCmp };`)({ S: {}, evOf });
  const ev = (ratio, ref) => ({ ratio, ref, refHow: '동급 유효 최저가' });
  evOf.set('a', ev(0.40, 5000)); evOf.set('b', ev(0.05, 50000)); evOf.set('c', ev(-0.30, 10000)); evOf.set('d', ev(-0.05, 80000)); evOf.set('e1', ev(0.20, 10000)); evOf.set('e2', ev(-0.10, 30000));
  const O = [
    { orderNo: 'A', items: [{ listingId: 'a', price: 7000, qty: 1 }] }, // 싼 책 +40% (원 차이 2,000)
    { orderNo: 'B', items: [{ listingId: 'b', price: 52500, qty: 1 }] }, // 비싼 책 +5% (원 차이 2,500 — 예전 원 합계 정렬이면 A보다 위)
    { orderNo: 'C', items: [{ listingId: 'c', price: 7000, qty: 1 }] }, // −30%
    { orderNo: 'D', items: [{ listingId: 'd', price: 76000, qty: 1 }] }, // −5% (원 차이 −4,000 — 예전엔 C보다 손해로 보였음)
    { orderNo: 'E', items: [{ listingId: 'e1', price: 12000, qty: 2 }, { listingId: 'e2', price: 27000, qty: 1 }, { listingId: 'zz', price: 9000, qty: 1 }] }, // 여러 상품: (24000+27000)/(20000+30000)−1 = +2% · 값 없는 zz는 셈에서 뺌
    { orderNo: 'N', items: [{ listingId: 'zz', price: 9000, qty: 1 }] }, // 값 없음
    { orderNo: 'M', items: [] }, // 상품 없음
  ];
  const g = Object.fromEntries(O.map((o) => [o.orderNo, G.shipGainOf(o)]));
  ok(g.A === 0.40 && g.B === 0.05 && g.C === -0.30 && g.D === -0.05, '상품 하나 주문: 정렬 열쇠 = 카드 % 그대로(같은 평가 값 ratio)', g);
  ok(Math.abs(g.E - 0.02) < 1e-9, '여러 상품 주문: Σ(판매가×수량) ÷ Σ(기준가×수량) − 1 (값 있는 상품만) = +2%', g.E);
  ok(g.N === null && g.M === null, '값 없는 주문 = 열쇠 없음(null)');
  const by = (d) => [...O].sort(G.gainCmp(d)).map((o) => o.orderNo).join('');
  ok(by(0) === 'ABEDCNM' || by(0) === 'ABEDCMN', '💰 이득 많은 것 먼저: +40% · +5% · +2% · −5% · −30% · 값 없음은 맨 아래', by(0));
  ok(by(1) === 'CDEBANM' || by(1) === 'CDEBAMN', '💸 손해 많은 것 먼저: −30% · −5% · +2% · +5% · +40% · 값 없음은 그래도 맨 아래', by(1));
  ok(!/색|tier|yellow|orange|red/.test(fnSrc(T, 'shipGainOf')), '정렬은 판매자 색을 보지 않음(카드 %만)');
  ok(/saleEvalIn\(/.test(fnSrc(T, 'shipSevOf')) && /const SI = saleEvalIn\(o\)/.test(fnSrc(T, 'saleEvalBits')) && /shipSevOf\(it, o, EN\)/.test(fnSrc(T, 'shipGainOf')), '카드(saleEvalBits)와 정렬(shipSevOf → shipGainOf)이 같은 함수(saleEvalIn)로 % 를 냄');
  ok(/S\.liteNp/.test(fnSrc(T, 'shipSevOf')), '휴대폰 가벼운 보기도 카드와 같은 새상품가 재료(S.liteNp)'); }

console.log(bad ? `❌ tSHIPFIX2_1118 ${bad}개 실패` : '✓ tSHIPFIX2_1118 통과');
process.exitCode = bad ? 1 : 0;
