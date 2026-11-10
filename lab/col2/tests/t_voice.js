/* t_voice — (11/10 정범님) 🗣 판매자 구매평·문의 글 전부 모으기(번외 · 로거 고유 일)
 *  ① 순수: 아이디 가림(앞 2자+***) · 주소 꼴(우리 숍·판매자 센터 없음) · 쪽 경계 중복 거름 · 조각 끊기 · 비중(처음 큼 → 같은 몫) · 문의 링크 찾기·문의 쪽 해석(가짜 화면)
 *  ② 로거 PC(가짜 서버 · 웹앱 흉내): 판매자 목록(숍 번호만) → 구매평 끝 쪽까지 · 문의 목록 끝까지 · 중복 0 · 아이디 가림 · 비밀글 글 없음 · 우리 숍 안 엶 · 쿠키 없음 → 새 글만 이어서
 *  ③ 사무실 PC: 이 일을 하지 않음(로거 고유 일)
 * 실행: node tests/t_voice.js */
const L = require('./lib.js'); const { ok, wait } = L; const fs = require('fs'), path = require('path'), http = require('http');
const COL2 = require('../col2-config.js'); const VC = require('../shadow/col2-voice-core.js');
let VPORT = +process.env.RN_COL2_TPORT || 0; /* 다른 시험(8775)과 겹치지 않게 — 빈 포트를 골라 씀 */
const freePort = () => new Promise((r) => { const s = require('net').createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const until = async (f, n, ms) => { let v; for (let k = 0; k < (n || 60); k++) { v = await f(); if (v) return v; await wait(ms || 250); } return v; };

/* 가짜 화면(지어낸 값 · 실제 숍·손님 없음) — 구매평 3쪽 × 15건(마지막 쪽 5건) · 문의 2쪽 */
const RV = []; for (let i = 0; i < 35; i++) RV.push({ d: `2026-${String(10 - Math.floor(i / 12)).padStart(2, '0')}-${String(28 - (i % 12) * 2).padStart(2, '0')}`, r: ['만족', '만족', '보통', '불만족'][i % 4], c: `가짜 평가 글 ${i} 배송이 ${i % 3 ? '빨라요' : '늦어요'} 포장 ${i % 2 ? '꼼꼼' : '허술'}`, a: `tu${i}ser***` });
let NEW = []; /* ② 뒤 — 맨 위에 새 글 */
const surveyHtml = (p) => { const all = [...NEW, ...RV]; const per = 15; const L0 = all.slice((p - 1) * per, p * per); const last = Math.ceil(all.length / per);
  return `<!doctype html><title>구매 만족도 | 알라딘</title><body><table>${L0.map((x) => `<tr><td class="y_usedsmall">${x.d}</td><td>${x.r}</td><td>${x.a}</td><td>${x.c}</td></tr>`).join('')}</table>${Array.from({ length: last }, (_, i) => `<a href="javascript:Page_Set('${i + 1}')">${i + 1}</a>`).join(' ')}</body>`; };
const shopHtml = (sc) => `<!doctype html><title>가게일 | 알라딘</title><link rel="canonical" href="https://www.aladin.co.kr/shop/usedshop/wshopitem.aspx?SC=${sc}"><body><a href="/shop/usedshop/wshopitem.aspx?SC=${sc}">전체 상품</a> <a href="/shop/UsedShop/wshopsurvey.aspx?SC=${sc}">구매 만족도</a> <a href="/shop/usedshop/wshopqna.aspx?SC=${sc}&amp;tab=2">판매자에게 문의하기 (4)</a> <a href="/scm/qnawrite.aspx?SC=${sc}">문의 쓰기</a></body>`;
const QN = [[1, '2026-11-08', '책 상태가 사진과 같나요? 밑줄 있나요', 'ab***', false, '답변완료', '네 밑줄 없습니다'], [2, '2026-11-07', '', 'cd***', true, '답변완료', null], [3, '2026-11-05', '묶음 배송 되나요', 'ef***', false, '답변대기', null], [4, '2026-10-30', '언제 보내 주시나요 급해요', 'gh***', false, '답변완료', '오늘 보냅니다']];
const qnaHtml = (p) => { const L0 = p === 1 ? QN.slice(0, 2) : p === 2 ? QN.slice(2) : [];
  return `<!doctype html><title>판매자에게 문의하기 | 알라딘</title><body><table><tr><th>번호</th><th>제목</th><th>작성자</th><th>등록일</th><th>상태</th></tr>${L0.map(([no, d, t, a, sec, st, rep]) => `<tr><td>${no}</td><td>${sec ? '<img alt="비밀글"> 비밀글입니다' : t}</td><td>${a}</td><td>${d.replace(/-/g, '.')}</td><td>${st}</td></tr>${rep ? `<tr><td colspan="5">답변: ${rep}</td></tr>` : ''}`).join('')}</table><a href="?SC=1&page=1">1</a> <a href="?SC=1&page=2">2</a></body>`; };

function fake() { const reqs = []; const srv = http.createServer((q, s) => { const u = new URL(q.url, 'http://x'); reqs.push({ path: u.pathname + u.search, cookie: q.headers.cookie || null });
    const H = (h) => { s.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); s.end(h); };
    if (u.pathname === '/') { s.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': 'rnTestSid=abc; Path=/' }); return s.end('<!doctype html><title>알라딘</title>첫 화면'); }
    if (u.pathname === '/shop/UsedShop/wshopsurvey.aspx') return H(surveyHtml(+u.searchParams.get('page') || 1));
    if (u.pathname === '/shop/usedshop/wshopitem.aspx') return H(shopHtml(u.searchParams.get('SC')));
    if (u.pathname === '/shop/usedshop/wshopqna.aspx') return H(qnaHtml(+u.searchParams.get('page') || 1));
    s.writeHead(404); s.end(); });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r({ srv, reqs, base: `http://127.0.0.1:${srv.address().port}` }))); }
/* 웹앱 흉내 — 판매자 목록 부탁엔 숍 번호·이름·평가 수만 · 맡긴 결과(col2_*)를 받아 둠 */
function webapp(H, SELL) { const got = []; let stop = false; const asks = [];
  (async () => { while (!stop) { try { const pd = (await H.api('GET', '/relay/pending?by=t')).j; if (pd && pd.ok) { const lw = (pd.lists || []).find((x) => x.c === 'sellers'); if (lw) { asks.push(lw); await H.api('POST', '/relay/answer', { lists: { sellers: SELL } }); }
        const keys = (pd.out || []).filter((o) => /^col2_/.test(o.c)).map((o) => { got.push(o); return o.k; }); if (keys.length) await H.api('POST', '/relay/ack', { keys }); } } catch (e) {} await wait(200); } })();
  return { got, asks, stop: () => { stop = true; } }; }
const shards = (W, sc, kind) => { const m = new Map(); for (const o of W.got) if (o.c === 'col2_voice' && o.v.sc === sc && o.v.kind === kind) m.set(o.id, o.v); return [...m.values()]; };
const items = (W, sc, kind) => shards(W, sc, kind).flatMap((v) => v.items);

(async () => {
  if (!VPORT) VPORT = await freePort();
  console.log('① 순수');
  ok(VC.maskId('tu12ser***') === 'tu***' && VC.maskId('홍길동') === '홍길***' && VC.maskId('a') === 'a***' && VC.maskId('') === null && VC.maskId('**') === null, '작성자 아이디 = 앞 2자 + *** (알라딘이 가린 * 는 떼고 셈)');
  ok(VC.surveyPathOk(VC.surveyPath('12345', 7)) && !VC.surveyPathOk('/shop/UsedShop/wshopsurvey.aspx?SC=1;x&page=1') && VC.qnaPathOk('/shop/usedshop/wshopqna.aspx?SC=12345&tab=2') && !VC.qnaPathOk('/scm/qnawrite.aspx?SC=1') && !VC.qnaPathOk('/shop/usedshop/wqnawrite.aspx?SC=1') && !VC.qnaPathOk('/shop/usedshop/wshopitem.aspx?SC=1') && VC.qnaPage('/shop/usedshop/wshopqna.aspx?SC=1&tab=2', 3) === '/shop/usedshop/wshopqna.aspx?SC=1&tab=2&page=3', '주소 꼴: 구매 만족도 쪽 · 문의 목록(판매자 센터·쓰기 화면·상품 목록 아님) · 쪽 번호 붙이기');
  { const ring = []; const a = VC.takeNew([{ d: '1', r: 'good', c: 'x', a: 'ab***' }, { d: '1', r: 'good', c: 'y', a: 'ab***' }], ring, VC.revKey, 60); const b = VC.takeNew([{ d: '1', r: 'good', c: 'y', a: 'ab***' }, { d: '0', r: 'bad', c: 'z', a: 'cd***' }], ring, VC.revKey, 60);
    ok(a.fresh.length === 2 && b.fresh.length === 1 && b.seen === 1 && b.fresh[0].c === 'z', '쪽 경계에서 다시 나온 글은 거름(고리)'); }
  ok(VC.needFlush(Array(200).fill({ c: 'x' })) && !VC.needFlush(Array(10).fill({ c: 'x' })) && VC.needFlush([{ c: 'x'.repeat(400000) }]) && VC.shardId('12', 'r', 3) === '12_r0003', '조각 = 글 200개 또는 40만 자에서 끊음(문서 1MiB 한도 안)');
  { const t0 = Date.now(); const s0 = VC.shareOf({ others: 4, known: 100, done: 0, since: t0, now: t0 }); const s1 = VC.shareOf({ others: 4, known: 100, done: 50, since: t0, now: t0 }); const s2 = VC.shareOf({ others: 4, known: 100, done: 10, since: t0 - 45 * 864e5, now: t0 }); const s3 = VC.shareOf({ others: 0 });
    ok(s0.share === 0.6 && s1.share > s2.share - 1e-9 && s1.share < s0.share && s2.share === 0.2 && s2.eq === 0.2 && s3.share === 1, '비중: 처음 60% → 모은 판매자 몫·지난 날이 늘수록 → 다른 일과 같은 몫(1/(일 수+1)) · 다른 일이 없으면 모두', [s0, s1, s2].map((x) => x.share).join(' → '));
    ok(VC.turnIsVoice(0, 0, 0.6) && !VC.turnIsVoice(6, 4, 0.6) && VC.turnIsVoice(5, 5, 0.6), '차례 나누기 = 오늘 쓴 차례 비율이 몫보다 작으면 목소리 차례'); }
  { const br = await L.chromium().launch(); try { const p = await (await br.newContext()).newPage(); await p.setContent('<!doctype html><title>t</title>'); await p.addScriptTag({ content: fs.readFileSync(path.join(L.ROOT, 'shadow', 'col2-voice-core.js'), 'utf8') });
      const R = await p.evaluate(([a, b]) => { const P = (h) => new DOMParser().parseFromString(h, 'text/html'); return { f: Col2Voice.findQnaLink(P(a)), q: Col2Voice.qnaRows(Col2Voice.parseQnaPage(P(b))), lp: Col2Voice.parseQnaPage(P(b)).lastPage, none: Col2Voice.findQnaLink(P('<a href="/scm/x.aspx?SC=1">문의</a>')) }; }, [shopHtml('12345'), qnaHtml(1)]);
      ok(R.f && R.f.path === '/shop/usedshop/wshopqna.aspx?SC=12345&tab=2' && R.f.n === 4 && R.none === null, "숍 첫 화면에서 '판매자에게 문의하기' 목록 링크를 찾음(보이는 글 수) · 판매자 센터 링크는 버림", R.f);
      ok(R.q.length === 2 && R.q[0].d === '2026-11-08' && R.q[0].ans === true && R.q[0].reply === '네 밑줄 없습니다' && /사진과 같나요/.test(R.q[0].t) && R.q[1].sec && R.q[1].t === '' && R.q.every((x) => /^\w{2}\*\*\*$/.test(x.a)) && R.lp === 2, '문의 쪽: 날짜·질문·답 있음·답 글 · 비밀글은 글을 남기지 않음 · 아이디 가림 · 끝 쪽', R.q); } finally { await br.close(); } }

  const A = await fake(); const SELL = [{ id: 'sc_12345', v: { sc: '12345', name: '가게일', n: 35 } }, { id: 'sc_' + COL2.OWN_SC[0], v: { sc: COL2.OWN_SC[0], name: '우리', n: 9 } }];
  console.log('② 로거 PC — 구매평·문의 끝까지 → 새 글만');
  const off = ['metrics', 'usedPage', 'shopSum', 'survey', 'bench', 'dynamic'];
  let H = await L.startHelper({ port: VPORT, aladin: A.base, cfg: { pc: 'LOGGER-V', pcSrc: 'pc', on: true, headless: true, pace: { minGapMs: 150 }, watch: { tickSec: 1 }, jobs: { on: true, voice: true, off, voiceCfg: { burst: 3, incEveryH: 0 } } } });
  try { await H.api('POST', '/cfg', { on: true }); const W = webapp(H, SELL);
    const done = await until(() => { const s = W.got.filter((o) => o.c === 'col2_voice_s' && o.id === '12345').slice(-1)[0]; return s && s.v.r.done && s.v.q.done ? s : null; }, 240, 250);
    ok(W.asks.length >= 1 && W.asks[0].n > 0, '웹앱에 판매자 목록(숍 번호·이름·평가 수)을 부탁함', W.asks[0]);
    ok(!!done, '판매자 요약: 구매평·문의 모두 끝까지 모음', done ? done.v : JSON.stringify(W.got.filter((o) => o.c === 'col2_voice_s').slice(-1).map((o) => o.v)) + ' · ' + A.reqs.map((r) => r.path).slice(-8).join(' ') + H.out().slice(-1500)); if (!done) throw new Error('멈춤');
    const R1 = items(W, '12345', 'r'); const keys = new Set(R1.map((x) => x.k));
    ok(R1.length === 35 && keys.size === 35 && R1.every((x) => /^tu\*\*\*$/.test(x.a)) && done.v.r.n === 35 && done.v.r.bad === 8, '구매평 35건 모두(3쪽) · 중복 0 · 아이디 앞 2자+***', { n: R1.length, uniq: keys.size, a: R1[0] && R1[0].a });
    const Q1 = items(W, '12345', 'q'); ok(Q1.length === 4 && Q1.filter((x) => x.sec).every((x) => x.t === '') && done.v.q.sec === 1 && done.v.q.path === '/shop/usedshop/wshopqna.aspx?SC=12345&tab=2', '문의 4건(2쪽) · 비밀글 글 없음 · 찾은 문의 목록 꼴', Q1.length);
    ok(!A.reqs.some((r) => r.path.includes('SC=' + COL2.OWN_SC[0])) && !A.reqs.some((r) => /\/scm\//i.test(r.path)) && A.reqs.filter((r) => r.path !== '/' && r.path !== '/favicon.ico').every((r) => !r.cookie), '우리 숍·판매자 센터는 열지 않음 · 쿠키 없이 읽음', A.reqs.length + '장');
    ok(W.got.every((o) => /^col2_/.test(o.c)) && W.got.some((o) => o.c === 'col2_voice' && /^12345_rtail$|^12345_r\d{4}$/.test(o.id)), '쓰기는 col2_voice·col2_voice_s만(조각·꼬리)');
    /* 새 글 2건이 맨 위에 → 다음 차례엔 그것만 */
    NEW = [{ d: '2026-11-09', r: '불만족', c: '새 글 파손되어 왔어요', a: 'zz9***' }, { d: '2026-11-09', r: '만족', c: '새 글 친절', a: 'yy8***' }]; const n0 = A.reqs.length;
    const d2 = await until(() => { const R = items(W, '12345', 'r'); return R.length >= 37 ? R : null; }, 120, 250); await wait(1500);
    const R2 = items(W, '12345', 'r'); ok(d2 && R2.length === 37 && new Set(R2.map((x) => x.k)).size === 37 && R2.some((x) => /파손/.test(x.c)), '새 글 2건만 더함(이미 본 글은 다시 안 넣음)', R2.length);
    ok(A.reqs.slice(n0).filter((r) => /wshopsurvey/.test(r.path)).every((r) => /page=[12]$/.test(r.path)), '새 글 찾기는 앞쪽만 읽고 이미 본 글에서 멈춤', A.reqs.slice(n0).filter((r) => /wshopsurvey/.test(r.path)).map((r) => r.path.slice(-6)).join(','));
    W.stop(); } finally { await H.stop(); }

  console.log('③ 사무실 PC — 하지 않음');
  const n1 = A.reqs.length; H = await L.startHelper({ port: VPORT, aladin: A.base, cfg: { pc: 'MJ-V', pcSrc: 'pc', on: true, headless: true, pace: { minGapMs: 150 }, watch: { tickSec: 1 }, jobs: { on: true, voice: true, off: ['product', 'kpipa', 'nbMarket', 'ext.fx'] } } });
  try { const W = webapp(H, SELL); await wait(5000); ok(!A.reqs.slice(n1).some((r) => /wshopsurvey|wshopqna|wshopitem/.test(r.path)) && !W.asks.length && !W.got.some((o) => /^col2_voice/.test(o.c)), '사무실 PC는 판매자 목소리를 읽지도 쓰지도 부탁하지도 않음(로거 고유 일)'); W.stop(); } finally { await H.stop(); }
  A.srv.close(); L.done('t_voice');
})().catch((e) => { console.error(e); process.exit(1); });
