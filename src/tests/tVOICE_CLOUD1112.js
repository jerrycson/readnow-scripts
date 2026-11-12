// tVOICE_CLOUD1112 — (cres1 11/12) 클라우드 연구 고침 묶음 · 브라우저 필요 없음
//  ① 🗣 구매평 연구 요약을 클라우드가 매일 셈(cloud/voice.js) — 웹앱 src/app.html 순수 셈(voRows·voStats)과 같은 자료로 같은 값 · 조각을 나눠 읽어도 같음 · 저장은 숫자·낱말만(글·아이디 없음) · 시간 넘김이면 partial
//  ② 🏪 판매자 상품 수 — 공용 해석이 못 찾는 꼴도 화면 글에서(sshItemsOf) · 못 찾으면 null + 글 조각
//  ③ 📮 진단 pend=1 — 고른 칸만(암호문·책 묶음·메일 가림) · 자동 일은 사람 맡김에서 뺌
//  ④ 🔬 진단 mlx=M 나눠 받기 — mp 없이 2만 권 넘으면 읽지 않고 쪽 수만
//  ⑤ 📥 등록 카드 '📣 구매평에서 자주 나온 말' 한 줄(웹앱 글자 확인)
// 실행: cd pw && node tVOICE_CLOUD1112.js   (../src/app.html · ../cloud/*.js) · 시험 자료는 모두 지어낸 값(가게 번호 9000001…)
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const ROOT = fs.existsSync(path.join(__dirname, '..', 'cloud')) ? path.join(__dirname, '..') : path.join(__dirname, '..', '..');
const APP = fs.readFileSync(fs.existsSync(path.join(ROOT, 'src', 'app.html')) ? path.join(ROOT, 'src', 'app.html') : path.join(ROOT, 'app.html'), 'utf8'); /* 저장소 꼴(src/app.html) · 시험 폴더 꼴(pw 옆 app.html) */ const SRC = fs.readFileSync(path.join(ROOT, 'cloud', 'index.js'), 'utf8');
const V = require(path.join(ROOT, 'cloud', 'voice.js'));

(async () => {
  console.log('① 구매평 요약 — 웹앱 셈과 같음');
  const a0 = APP.indexOf('/* ══ 🗣 판매자 목소리 시작'); const a1 = APP.indexOf('/* ══ 🗣 판매자 목소리 순수 끝 ══ */'); ok(a0 > 0 && a1 > a0, '웹앱 순수 셈 구역 찾음');
  const WEB = new Function('S', APP.slice(a0, a1) + '\nreturn { voRows, voStats, voLex, VOICE_LEX };')({ app: {}, _voLexAdd: { cond: ['먼지'] } });
  ok(JSON.stringify(WEB.VOICE_LEX) === JSON.stringify(V.VOICE_LEX), '주제 사전(VOICE_LEX)이 웹앱과 클라우드 같음 — 한쪽만 고치면 이 시험이 막음');
  let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648); const pick = (a) => a[Math.floor(rnd() * a.length)];
  const words = ['배송이 빨라요', '포장이 꼼꼼', '책 상태 깨끗', '사진과 달라요', '찢어져 왔어요', '가격 저렴', '친절한 응대', '다른 책이 왔어요', '품절 취소', '좋아요 감사', '먼지투성이 책', '먼지투성이 였음', '냄새나는 종이', '그냥 그래요', '표지가 누렇'];
  const mkItem = (i) => ({ d: `2026-${String(1 + Math.floor(rnd() * 10)).padStart(2, '0')}-${String(1 + Math.floor(rnd() * 27)).padStart(2, '0')}`, r: pick(['good', 'good', 'mid', 'bad', 'bad']), c: pick(words) + ' ' + pick(words) + (i % 7 === 0 ? ' 먼지투성이' : ''), a: 'ab' + i, reply: i % 9 === 0 ? '사과드립니다 교환' : undefined });
  const c2 = []; for (let s = 0; s < 6; s++) { c2.push({ sc: String(9000001 + s), kind: 'r', items: Array.from({ length: 40 }, (_, i) => mkItem(i + s * 40)) }); c2.push({ sc: String(9000001 + s), kind: 'q', items: Array.from({ length: 6 }, (_, i) => ({ d: '2026-10-0' + (1 + (i % 9)), c: pick(words), sec: i % 3 === 0, ans: i % 2 === 0 })) }); }
  const op = [{ sellerId: 'sc_9000001', items: [...c2[0].items.slice(0, 15).map((x) => ({ ...x, a: 'zz' })), ...Array.from({ length: 20 }, (_, i) => mkItem(500 + i))] }, { sc: '9000009', items: Array.from({ length: 25 }, (_, i) => mkItem(700 + i)) }];
  const ours = [{ r: 'good', c: '배송 빨라요' }, { r: 'bad', c: '파손되어 왔어요 찢어져' }, { r: null, c: '평가 없음' }];
  const sizeOf = (sc) => (+sc % 2 ? '작음(<300)' : '큼(3천+)'); const lex = WEB.voLex();
  const W1 = WEB.voStats(WEB.voRows(c2, op, lex), { lex, sizeOf, ours });
  const A = V.makeAcc({ lex: V.lexOf({ cond: ['먼지'] }), sizeOf }); c2.forEach((v) => A.c2(v)); op.forEach((v) => A.op(v)); const C1 = A.result(ours);
  const pickK = (s) => ({ n: s.n, q: s.q, qSec: s.qSec, qAns: s.qAns, cnt: s.cnt, cover: s.cover, tp: s.tp, months: s.months, sizes: s.sizes, ours: s.ours, cands: s.cands, sellers: s.sellers });
  ok(JSON.stringify(pickK(W1)) === JSON.stringify(pickK(C1)), `같은 자료 → 같은 값(구매평 ${W1.n} · 문의 ${W1.q} · 주제 ${W1.tp.length} · 달 ${W1.months.length} · 후보 ${W1.cands.length})`, { w: pickK(W1).cands, c: pickK(C1).cands });
  ok(W1.n === 6 * 40 + 20 + 25, '같은 글(운영 평가에 겹친 15건)은 한 번만', W1.n);
  const D = V.docOf(C1, '2026-11-12'); const Dj = JSON.stringify(D); ok(!/ab\d|zz|사과드립니다|먼지투성이 책/.test(Dj) && D.by === 'cloud' && D.tp.length === 10 && D.cands.every((c) => Object.keys(c).join() === 'w,c,lift'), '저장 꼴 = 숫자·낱말만(글 원문·아이디 없음) · by cloud', Dj.slice(0, 300));

  console.log('  매일 일 — 가짜 Firestore(조각을 나눠 읽기)');
  const mkFS = (data) => { const reads = { n: 0 }; const Q = (n, o) => ({ orderBy: () => Q(n, o), select: () => Q(n, o), where: (k, op2, v) => Q(n, { ...o, w: [k, v] }), limit: (x) => Q(n, { ...o, lim: x }), startAfter: (d) => Q(n, { ...o, after: d.id }),
      get: async () => { let L = Object.entries(data[n] || {}).sort((a, b) => (a[0] < b[0] ? -1 : 1)); if (o.w) L = L.filter(([, v]) => v[o.w[0]] === o.w[1]); if (o.after) L = L.filter(([id]) => id > o.after); if (o.lim) L = L.slice(0, o.lim); reads.n++; const docs = L.map(([id, v]) => ({ id, data: () => JSON.parse(JSON.stringify(v)) })); return { size: docs.length, docs, forEach: (f) => docs.forEach(f) }; } });
    const C = (n) => ({ ...Q(n, {}), doc: (id) => ({ get: async () => ({ exists: !!(data[n] || {})[id], data: () => (data[n] || {})[id] }), set: async (v) => { (data[n] = data[n] || {})[id] = JSON.parse(JSON.stringify(v)); } }) }); return { C, reads }; };
  const data = { col2_voice: Object.fromEntries(c2.map((v, i) => [`${v.sc}_${v.kind}${String(i).padStart(4, '0')}`, v])), seller_reviews: Object.fromEntries(op.map((v, i) => ['sr' + i, v])), app_settings: { voice_lex: { add: { cond: ['먼지'] } } },
    sellers: Object.fromEntries([1, 2, 3, 4, 5, 6, 9].map((k) => ['sc_' + (9000000 + k), { totalReviewCount: (9000000 + k) % 2 ? '120' : '5,000' }])), crm_interactions: { i1: { type: 'review', rating: '만족', body: '배송 빨라요' }, i2: { type: 'review', rating: '불만족', body: '파손되어 왔어요 찢어져' }, i3: { type: 'question', rating: '', body: 'x' } } };
  const F = mkFS(data); const logs = []; const VS = V.makeVoiceStudy({ C: F.C, FieldPath: { documentId: () => '__name__' }, log: (...m) => logs.push(m.join(' ')), W: () => ({ writer: 'cloud' }) });
  const r1 = await VS.run(false, false, { page: 3 }); const doc = data.app_settings.voice_study;
  ok(r1 && r1.n === W1.n && doc && doc.n === W1.n && doc.by === 'cloud' && !doc.partial && doc.src.c2Docs === 12 && doc.src.opDocs === 2 && JSON.stringify(doc.tp) === JSON.stringify(D.tp) && doc.ours.n === 2 && doc.writer === 'cloud', '3개씩 나눠 읽어도 같은 요약 · 우리 숍 구매평은 수만(문의 글은 뺌)', { r1, src: doc && doc.src });
  ok((await VS.run(false, false)).skip === 1, '20시간 안엔 다시 안 셈(하루 한 번)');
  ok(data.app_settings.voice_study_run && data.app_settings.voice_study_run.ok === true, '끝나면 voice_study_run.ok = true');
  data.app_settings.voice_study_run = { ok: false, startAt: new Date().toISOString() }; delete data.app_settings.voice_study; ok((await VS.run(false, false)).skip === 'crash' && !data.app_settings.voice_study, '지난번이 끝나지 않은 채 다시 떴으면(멈춤 의심) 스스로는 하루 쉼(멈춤 고리 막이)');
  const rF = await VS.run(true, false); ok(rF.n === W1.n && data.app_settings.voice_study_run.ok === true, '사람이 부른 것(force·진단 voice=save)은 그대로 셈');
  const big = V.makeAcc({ lex: V.lexOf(null), waMax: 50 }); for (let i = 0; i < 300; i++) big.c2({ sc: '9000001', kind: 'r', items: [{ d: '2026-10-01', r: 'bad', c: '낱말' + String.fromCharCode(44032 + i) + String.fromCharCode(44100 + i) + ' 먼지투성이' }] }); const bs = big.result([]); ok(bs.n === 300 && bs.pruned > 0, '낱말 표가 상한을 넘으면 1번 나온 낱말은 버림(셈은 그대로)', { n: bs.n, p: bs.pruned });

  const r3 = await VS.run(true, true, { budgetMs: -1 }); ok(r3.partial === true && data.app_settings.voice_study.partial === false, "시간 상한을 넘기면 거기까지 'partial' · 진단(dry)은 쓰지 않음", { p: r3.partial });
  ok(/const VOICE = require\('\.\/voice\.js'\)\.makeVoiceStudy\(\{ C, FieldPath, log, W \}\);\nsetTimeout\(\(\) => VOICE\.run\(\)/.test(SRC) && /setInterval\(\(\) => VOICE\.run\(\)[^\n]*2 \* 3600e3\)/.test(SRC), '클라우드가 스스로 돎(올라온 뒤 40분 · 2시간마다 확인 · 20시간 막이)');
  ok(/if \(q\.voice\) \{ try \{ out\.voice = await VOICE\.run\(true, q\.voice !== 'save'/.test(SRC), '진단 voice=1(계산만) · voice=save(저장)');

  console.log('② 판매자 상품 수');
  const s0 = SRC.indexOf('function shopTreeItems('); const s1 = SRC.indexOf('function sshSumOf('); ok(s0 > 0 && s1 > s0, 'sshItemsOf 있음');
  const sshItemsOf = new Function(SRC.slice(s0, s1) + '\nreturn sshItemsOf;')(); const X = { strip: (h) => String(h).replace(/<[^>]+>/g, ' ') };
  const cases = [['<div>전체상품 (12,345)</div>', 12345], ['<span>총 <em>2,000</em>개의 상품</span>', 2000], ];
  for (const [h, n] of cases) { const r = sshItemsOf(X, h, null); ok(r.n === n, `꼴 '${X.strip(h).replace(/\s+/g, ' ').trim()}' → ${n}`, r); }
  ok(sshItemsOf(X, '<div>판매자 상품 모두보기 가게A 전문셀러 000 개 --> 중고국내도서 전체보기 건강/취미 (11469) 건강운동 (733) 스포츠/레저 기타 (249) 원예 (167)</div>', null).n === null, '(0.35.143) 실제 화면 꼴 — 분야 나무 숫자(기타 249)를 상품 수로 쓰지 않음(null)');
  { const tree = (o) => `<div class="wTrees" id="subtr-1" style="display:block"><ul>
<li id="tb1"><a href="#" class="fold"><img/></a><a href="#" onclick="Goto('1','100')" class="br">건강/취미 (11469)</a>
<div class="wTrees" id="subtr1" style="display:none"><ul><li id="tb2"><a href="#" class="br">건강운동 (733)</a></li><li id="tb3"><a href="#" class="br">기타 (249)</a></li></ul></div></li>
<li id="tb4"><a href="#" class="br">소설/시/희곡 (1,200)</a><div class="wTrees" id="subtr4"><ul><li><a class="br" href="#">한국소설 (1,000)</a></li></ul></div></li>
</ul></div>${o || ''}<ul><li><a class="br" href="#">딴 목록 (5)</a></li></ul>`;
    const r1 = sshItemsOf(X, tree(), null); ok(r1.n === 12669 && /^tree1:2$/.test(r1.how), '분야 나무 맨 윗줄만 더함(11,469 + 1,200 · 아랫분야·나무 밖 목록 뺌)', r1);
    const r2 = sshItemsOf(X, tree('<div class="wTrees" id="subtr-2"><ul><li><a class="br" href="#">외국도서 (30)</a></li></ul></div>'), null); ok(r2.n === 12699 && r2.how === 'tree2:3', '갈래가 둘이면(국내·외국) 둘 다', r2); }
  ok(/fix1112/.test(SRC) && /shopItemsBad: \{ v: v\.shopItems/.test(SRC), '0.35.142가 잘못 쓴 상품 수는 한 번 비우고 shopItemsBad에 남김(지우지 않음)');
  ok(sshItemsOf(X, '<p>상품 목록입니다</p>', null).n === null && /상품/.test(sshItemsOf(X, '<p>상품 목록입니다</p>', null).near), '못 찾으면 null(지어내지 않음) + 글 조각');
  ok(sshItemsOf(X, 'x', 55).n === 55 && sshItemsOf(X, 'x', 55).how === 'core', '공용 해석이 찾은 값은 그대로');
  ok(/itemsMiss: \{ at: nowIso\(\), \.\.\.out\.near \}/.test(SRC) && /itemsHow: out\.how/.test(SRC), '못 찾은 화면 글 조각은 seller_shop_state.itemsMiss(진단으로 꼴 확인)');
  ok(/if \(q\.shopraw\)/.test(SRC) && /wshopitem\.aspx\?SC=\$\{sc\}/.test(SRC.slice(SRC.indexOf('async function diagShopRaw'), SRC.indexOf('async function diagShopRaw') + 900)), '진단 shopraw=<번호> — 공개 가게 첫 화면 한 장만');

  console.log('③ 진단 pend=1');
  const p0 = SRC.indexOf('const pendWho'); const p1 = SRC.indexOf('const PEND_AUTO'); const P = new Function(SRC.slice(p0, p1) + '\nreturn { pendRow, pendWho };')();
  const row = P.pendRow('c1', { k: 'cred', env: { ct: '암호문AAAA' }, st: 'done', at: '2026-11-12T01:00:00Z', by: 'tester@example.com', job: { k: 'reg', book: { title: '책A', isbn: '9791100000001' }, rows: [{ rid: 'r1' }], sendAt: '2026-11-12T01:01:00Z' }, holdWhy: '로거 소식 없음', trail: [{ at: 't1', m: '맡김', by: 'MJ-1' }], cust: { name: '손님A', tel: '010-0000-0000' } }, 'nv');
  const rj = JSON.stringify(row); ok(!/암호문|책A|9791100000001|손님A|010-0000|example\.com/.test(rj) && row.by === 'tes…' && row.jk === 'reg' && row.rows === 1 && row.holdWhy === '로거 소식 없음' && row.sendAt && row.trail[0].m === '맡김', '고른 칸만 — 암호문·책 묶음·손님 정보 빠짐 · 메일 이름은 앞 3자', rj);
  const sr = P.pendRow('s1', { type: 'prdEdit', status: 'queued', createdAt: 't', by: 'MJ-MAIN', dev: 'MJ-MAIN', claim: { pc: 'HOME', at: 't2', secret: 'x' }, items: { a: { title: '책B' } } }, 'shp'); ok(sr.type === 'prdEdit' && sr.st === 'queued' && !/책B|secret/.test(JSON.stringify(sr)), 'shp_cmds 줄도 고른 칸만', sr);
  ok(/if \(q\.pend\) \{ try \{ out\.pend = await diagPend\(q\)/.test(SRC) && /C\('shp_cmds'\)\.orderBy\('createdAt', 'desc'\)\.limit\(400\)/.test(SRC) && /PEND_AUTO\.test/.test(SRC), '진단 연결 · shp_cmds는 자동 일 빼고 사람 맡김 최근 50');

  console.log('④ 진단 mlx=M 나눠 받기');
  const m0 = SRC.indexOf('async function mlxMPage'); const m1 = SRC.indexOf('/* (cres1 11/12) 📮 진단 pend=1');
  const mk = (total) => { const got = []; const Q = (o) => ({ orderBy: () => Q(o), select: () => Q(o), offset: (x) => Q({ ...o, off: x }), startAfter: (x) => Q({ ...o, after: x }), limit: (x) => Q({ ...o, lim: x }), count: () => ({ get: async () => ({ data: () => ({ count: total }) }) }), get: async () => { got.push(o); const n = Math.max(0, Math.min(o.lim, total - (o.off || 0))); const docs = Array.from({ length: n }, (_, i) => ({ id: 'b' + ((o.off || 0) + i), data: () => ({}) })); return { size: n, docs }; } }); return { C: () => Q({}), got }; };
  const run = async (total, q) => { const M = mk(total); const f = new Function('C', 'FieldPath', SRC.slice(m0, m1) + '\nreturn mlxMPage;')(M.C, { documentId: () => '__name__' }); const out = {}; const g = await f(q, out); return { out, g, got: M.got }; };
  const b1 = await run(49139, {}); ok(b1.g.docs.length === 0 && b1.got.length === 0 && b1.out.Mpage.pages === 5 && /mp=0/.test(b1.out.mlxErr), 'mp 없이 49,139권 → 읽지 않고 쪽 수(5)만 알려 줌(503 대신)', b1.out);
  const b2 = await run(49139, { mp: '4' }); ok(b2.g.size === 49139 - 48000 && b2.got[0].off === 48000 && b2.out.Mpage.more === false, '마지막 쪽(mp=4) = 남은 1,139권', b2.out.Mpage);
  const b3 = await run(9000, {}); ok(b3.g.size === 9000 && b3.out.Mpage.more === false, '2만 권 아래면 예전처럼 한 번에');
  ok(/want\('M'\) \? mlxMPage\(q, out\)/.test(SRC), 'mlx=M 이 나눠 받기를 씀');

  console.log('⑤ 등록 카드 한 줄');
  ok(/\$\{x && x\.ev \? vrHtml\(x\.ev, 'reg'\) : ''\}\$\{voRegLine\(\)\}/.test(APP) && /function voRegLine\(\)/.test(APP) && /doc\('voice_study'\)\.get\(\)/.test(APP), '🔎 자세히 카드 판매가치 상자 아래 · voice_study 문서 하나만 읽음');
  const r0 = APP.indexOf('const VO_RG_T'); const r1x = APP.indexOf('async function voRegLoad'); const r2 = APP.indexOf('\n', r1x);
  const RG = new Function('S', 'db', 'num', 'esc', 'document', APP.slice(r0, r2) + '\nreturn { voRegLine };');
  const S = { _voRegAt: Date.now(), _voReg: { n: 1000, sellers: 30, day: '2026-11-12', by: 'cloud', tp: [{ k: 'ship', n: 400, bad: 50, lift: 0.8 }, { k: 'cond', n: 300, bad: 80, lift: 1.4 }, { k: 'gap', n: 100, bad: 60, lift: 2.6 }, { k: 'praise', n: 900, bad: 3, lift: 0.1 }] } };
  const h = RG(S, null, (v) => String(v), (v) => String(v), { querySelectorAll: () => [] }).voRegLine();
  ok(/📣 구매평에서 자주 나온 말: 🚚 배송 40% · 📖 책 상태 30% · 🔍 설명·실물 차이 10% · 불만일 때 많이: <b>🔍 설명·실물 차이<\/b>/.test(h) && !/일반 만족/.test(h), '자주 나온 주제 셋 + 불만일 때 많이 나오는 주제(일반 만족 뺌)', h);
  const h2 = RG({ _voRegAt: Date.now(), _voReg: null }, null, String, String, { querySelectorAll: () => [] }).voRegLine(); ok(h2 === '<div class="rgvo" hidden></div>', '요약이 없으면 숨은 빈칸(등록 화면 그대로)');

  console.log(bad ? `❌ ${bad}개 실패` : '✅ 모두 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 오류', e && e.stack); process.exit(1); });
