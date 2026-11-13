// tAUDITFIX1113 — (11/13 일꾼 auditfix · 리드 결정) 11/12 매일 정밀 점검·11/13 4시간 점검이 '리드 몫'으로 넘긴 고침 모음
//  ☁ 클라우드: B1 판매가치 배우기 두 길도 HV 안 · 실패 뒤 30·60·120분 · B3 전체 다시 세우기에서 사라진 상품은 품절 기억에 안 넣음 · B4 진단 셋 가림(법정 고지 글까지)
//     · B5 위 경계 글자 보이게 · ④-4 숍 요약 목록에서 문 닫은 가게·3일 안 못 읽은 가게 빼기·하루 150·밤 쉼 · ④-12 자동 내림 예스24 주문은 바뀐 것만 · 판매자 배우기 책 문서 bk_ 번호
//  🤖 수집기·공용: ⭐ 6개월 평가 수 쪽 사이 2~4초·회차 600곳 · poolCaps 인터넷 없는 휴대폰 빼기 · 예스24 「이미 로그인된」 넷째 후보 뺌 · 로거 새 판 바꿈 통행증(도우미 /rpass)
//     · 같은 날 두 바퀴 막기 · 큰 숍 마무리 1만 개마다 양보
//  🖥 웹앱: 🔁 사후 확인 다시 맡기기 1일 회차만·사람 값 우선 · 예스24 맡기기 두 PC 겹침 막기(트랜잭션 표) · 가게 취소가 이 주문 잡음만 풂 · 업데이트 띠가 상세 화면을 가리지 않음
// 실행: node src/tests/tAUDITFIX1113.js (순수 셈·글자) · 화면은 pw/ 안에서 RN_PORT=<포트> node tAUDITFIX1113.js · 시험 자료에 손님 정보 없음(가짜 이름 '가나다')
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const find = (rel) => [path.resolve(__dirname, '..', '..', rel), path.resolve(__dirname, '..', rel), path.resolve(__dirname, rel), process.env.RN_REPO ? path.join(process.env.RN_REPO, rel) : ''].filter(Boolean).find((x) => fs.existsSync(x));
const rd = (rel) => { const f = find(rel); return f ? fs.readFileSync(f, 'utf8') : ''; };
const CL = rd('cloud/index.js'), SH = rd('cloud/shop.js'), APP = rd('src/app.html') || rd('app.html'), COL = rd('src/readnow-collector.src.js') || rd('readnow-collector.user.js'), LOC = rd('local/readnow-local.js'), Y24 = rd('lab/col2/helper/col2-y24.js');
const cut = (S, a, b) => { const i = S.indexOf(a); const j = S.indexOf(b, i + 1); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return S.slice(i, j); };
(async () => {
  console.log('① ☁ 클라우드');
  if (CL) {
    ok(!/await valueLearn\(true\);/.test(CL) && (CL.match(/HV\('valueLearn', \(\) => valueLearn\(true\)\)/g) || []).length >= 3, 'B1 판매가치 배우기를 바로 부르는 길(뜬 뒤 200초·5분 웹앱 요청)이 모두 HV 안');
    ok(/vlRtGap = \(n\) => \[30, 60, 120\]/.test(CL) && /VL_RT\.next = Date\.now\(\) \+ vlRtGap/.test(CL), 'B1 웹앱 요청 배우기가 못 끝나면 30·60·120분 뒤에만 다시');
    ok(/'\\uf8ff'\)\.limit\(6\)/.test(CL), 'B5 이름 범위 위 경계가 눈에 보이는 \\uf8ff');
    /* B4 가림 */
    const DS = new Function(cut(CL, 'const DIAG_PII_K = ', 'const diagScrubRaw = ') + cut(CL, 'const diagScrubRaw = ', '\n') + '\nreturn { diagScrub, diagScrubRaw };')();
    const raw = { raw: '<tr><th>대표자</th><td>가나다</td></tr><tr><th>주소</th><td>어딘가시 어딘가로 12</td></tr> 상호명 : 가짜책방 · 사업자등록번호 123-45-67890 · 전화 010-0000-0000 · 메일 a@b.example', lines: ['통신판매업신고번호: 제2026-가짜-0000호'], name: '가나다', n: 3 };
    const R = DS.diagScrubRaw(raw); const J = JSON.stringify(R);
    ok(!/가나다|어딘가시|가짜책방|123-45-67890|010-0000-0000|a@b\.example|제2026/.test(J) && R.n === 3 && !('name' in R), 'B4 원문 진단 가림 — 대표자·주소·상호·사업자 번호·통신판매업 번호·전화·메일 · 이름 칸 · 숫자는 그대로', R);
    ok(/out\.pend = diagScrubRaw\(await diagPend\(q\)\)/.test(CL) && /out\.shopraw = diagScrubRaw\(await diagShopRaw\(q\.shopraw\)\)/.test(CL) && /out\.clog = diagScrubRaw\(await require\('\.\/memwatch\.js'\)\.readCloudLog\(/.test(CL), 'B4 진단 pend·shopraw·clog 모두 가림을 거침');
    /* ④-4 숍 요약 목록 */
    const SS = new Function('C', 'log', cut(CL, 'const SSH_DEF = ', '\n') + '\n' + cut(CL, 'async function sshList(st, day) {', 'async function sellerShopTick(') + '\nreturn { sshList, SSH_DEF };');
    const ago = (d) => new Date(Date.now() - d * 864e5).toISOString();
    const SEL = [{ sc: '11', rev6m: 9 }, { sc: '12', rev6m: 8, shopGone: true }, { sc: '13', rev6m: 7, rev6mTriedAt: ago(1) }, { sc: '14', rev6m: 6, rev6mTriedAt: ago(5) }, { sc: '15', rev6m: 5, rev6mAt: ago(2) }];
    const Cf = (col) => ({ doc: () => ({ async get() { return { data: () => ({ sc: [] }) }; } }), select: () => ({ async get() { return { forEach: (f) => SEL.forEach((v) => f({ id: 'sc_' + v.sc, data: () => v })) }; } }) });
    const S1 = SS(Cf, () => {}); const L1 = await S1.sshList({}, '2026-11-13');
    ok(JSON.stringify(L1.list) === '["11","14"]', '④-4 목록 — 문 닫은 가게·3일 안 못 읽은 가게·7일 안 읽은 가게 뺌(5일 전 못 읽은 곳은 다시)', L1);
    ok(S1.SSH_DEF.cap === 150 && JSON.stringify(S1.SSH_DEF.night) === '["01:00","07:00"]' && /cfg\.night\.length === 2 && hm >= cfg\.night\[0\] && hm < cfg\.night\[1\]\) return null/.test(CL), '④-4 하루 몫 150 · 한국 01~07시 쉼');
    /* ④-12 자동 내림 예스24 주문 */
    const Q = []; const Y = [{ id: 'y1', v: { lastSeenAt: ago(2), orderedAt: ago(2) } }, { id: 'y2', v: { lastSeenAt: ago(0.01), orderedAt: ago(0.5) } }];
    const Cy = () => ({ where: (k, op, v) => ({ async get() { Q.push(v); const L = Y.filter((x) => x.v.lastSeenAt >= v); return { forEach: (f) => L.forEach((x) => f({ id: x.id, data: () => x.v })) }; } }) });
    const OY = new Function('C', cut(CL, 'const OMNI_YS = ', 'async function omniCloudTick() {') + '\nreturn { omniY24Docs, OMNI_YS };')(Cy);
    const cutA = ago(14); const a1 = await OY.omniY24Docs(cutA); const a2 = await OY.omniY24Docs(ago(13.99));
    ok(a1.length === 2 && a2.length === 2 && Q.length === 2 && Q[0] === cutA && Q[1] > ago(0.01), '④-12 처음은 14일 통째 · 다음 회차는 바뀐 것만(마지막 읽기 5분 전 뒤)', { Q, n1: a1.length, n2: a2.length });
    Y.push({ id: 'y3', v: { lastSeenAt: new Date().toISOString(), orderedAt: new Date().toISOString() } }); const a3 = await OY.omniY24Docs(ago(13.98)); ok(a3.length === 3 && a3.some((d) => d.id === 'y3' && d.data().orderedAt), '④-12 새 주문은 바뀐 것 읽기로 바로 들어옴');
    const n0 = Q.length; await OY.omniY24Docs(ago(15)); ok(Q.length === n0 + 1 && Q[Q.length - 1] === ago(15).slice(0, 13) + Q[Q.length - 1].slice(13), '④-12 범위가 넓어지면(밀린 일 미리보기 끝) 바로 통째');
    ok(/omniY24Docs\(cut\)/.test(CL), '④-12 자동 내림 클라우드가 새 읽기 길을 씀');
    /* 회귀 보조 B1 */
    ok(!/'isbn_' \+ s\)/.test(CL) && /where\('isbn13', 'in', isb\.slice\(k, k \+ 30\)\)\.select\('isbn13', 'author', 'publisher'\)/.test(CL), '판매자 배우기 롤모델 보강이 책 문서를 ISBN 칸으로 찾음(bk_ 번호)');
  } else ok(false, 'cloud/index.js 못 찾음');
  if (SH) ok(!/if \(!seen\.has\(k\)\) goneAdd\(k, it\)/.test(SH) && /\(auditfix 11\/13 B3\)/.test(SH), 'B3 우리숍 전체 다시 세우기 — 사라진 상품을 품절 기억에 넣지 않음(방문 때 MISS 길이 팔린 것만)');
  console.log('② 🤖 수집기·공용·도우미·번외');
  { require(find('readnow-autosched-core.js')); const AS = globalThis.ReadnowAuto.AS; const G = 1073741824;
    const pc = { phones: [{ id: 'A', dev: 'USB\\A', devUsed: 10 * G, left: 1 * G, monthLeft: 50 * G, active: true, connected: true, name: '휴대폰 1' }, { id: 'B', dev: 'USB\\B', devUsed: 0, left: 0, monthLeft: 100 * G, connected: true, netBad: true, name: '휴대폰 2' }], spare: { phone: 'B', later: false, leftM: 0, leftG: 0, monthLeft: 40 * G } };
    const c = AS.poolCaps(pc, { must: true }); ok(c['USB\\A'].lim === 11 * G && c['USB\\B'].lim < 41 * G, 'poolCaps — 여분 휴대폰이 인터넷 없음이면 넘쳐 쓸 휴대폰 없음 · 휴대폰 1은 오늘 몫까지(bovf 11/13 리드 결정 — 휴대폰 1로 넘겨 쓰지 않음)', c);
    pc.phones[1].netBad = false; const c2 = AS.poolCaps(pc, { must: true }); ok(c2['USB\\B'].lim === 40 * G && c2['USB\\A'].lim === 11 * G, 'poolCaps — 인터넷 되는 여분 휴대폰이면 그 휴대폰만 넘쳐 씀 · 상한 = 오늘 몫 + 여분 남은 양(bovf 11/13 — 예전엔 휴대폰 2 이달 남은 양 + 여분)', c2);
    ok(/netBad: !!\(live && live\.net && live\.net\.bad\)/.test(rd('readnow-autosched-core.js')), 'poolCalc가 도우미 net.bad를 휴대폰 물건에 실음'); }
  if (COL) {
    ok(/REV6M_RUN_MAX = Math\.max\(50, \+SET\.rev6mRunMax \|\| 600\)/.test(COL) && /if \(runPages > 0\) await sleep\(2000 \+ Math\.floor\(Math\.random\(\) \* 2000\)\)/.test(COL) && /return 'partial';/.test(cut(COL, 'async function rev6mJob(mode) {', 'const num6 = ')), '⭐ 6개월 평가 수 — 쪽 사이 2~4초 무작위 · 회차 600곳(남은 곳은 다음 회차가 이어 읽음 · 일괄 표 partial)');
    ok(/HLP \+ '\/rpass', \{ 'X-RN-Meter': '1' \}/.test(COL) && /globalThis\.__rnPubHome && \/새 \(버전\|판\)\/\.test\(reason\)/.test(COL), '로거 새 판 바꿈 — 서버 확인 전에 도우미 통행증(로거·새 판 바꿈일 때만)');
    ok(/const lateOld = oe >= D0k && !s0\.prog && rde >= D0k - 6 \* 3600e3 \? oe : 0;/.test(COL), '벤치마킹 — 어제 저녁까지 읽은 옛 회차를 오늘 마무리했으면 오늘 몫(새 바퀴 읽는 중이면 그대로)');
    const BF = cut(COL, 'async function benchFinish(t, prog, st) {', 'async function runChain('); ok((BF.match(/await bfYield\(\);/g) || []).length === 3 && /% 10000 === 0\) await sleep\(0\)/.test(BF), '큰 숍 마무리 견주기 1만 개마다 양보(세 반복)');
    ok(!/@grant\s+GM_xmlhttpRequest[\s\S]{0,5}@grant\s+GM_xmlhttpRequest/.test(COL), '수집기 머리 그대로(글자 검사 — 판 낼 때 HSIG로 다시 확인)');
  }
  if (LOC) ok(/if \(capped\(\) && !\(RPASS > Date\.now\(\)\)\) \{/.test(LOC) && /u\.pathname === '\/rpass' && req\.headers\['x-rn-meter'\] === '1'/.test(LOC) && /now - RPASS_AT < 10 \* 60e3/.test(LOC) && /if \(!ST\.tether\.ok\) why = '테더링 확인 안 됨'/.test(LOC), '도우미 /rpass — 테더링이 될 때만 · 상한 문만 3분 · 10분에 한 번');
  if (Y24) { const m = Y24.match(/const R=\[([\s\S]*?)\];\s*let b=null/); ok(m && !/확인\|예\|네/.test(m[1]) && /해제\|끊\|종료/.test(m[1]), '번외 예스24 「이미 로그인된」 — 그냥 확인·예·네 단추는 누르지 않음(넷째 후보 뺌)', m && m[1]); }
  console.log('③ 🖥 웹앱 글자');
  ok(/async function ledY24Claim\(rows\)/.test(APP) && /const cl = await ledY24Claim\(rows\);/.test(APP) && /try \{ await y24PLoad\(true\); \} catch \(e\) \{\}/.test(cut(APP, 'async function ledY24Go(items, opt) {', '\n/*')), '예스24 맡기기 — 새로 읽기 + 보내기 직전 트랜잭션 표');
  ok(/w = await rcRedo\(x\.e, TD, got\);/.test(APP) && /다시 맡기기는 \$\{d1\}일 회차만/.test(APP) && /async function rcHumanWhy\(e, a\)/.test(APP), '사후 확인 — 첫 회차만 다시 맡김 · 사람 값 우선');
  ok(/bqHoldFree\(x\.lid, no, at, '가게 취소 ' \+ no\)/.test(APP) && !/doc\(x\.lid\)\.set\(\{ on: 0, freeAt: at/.test(APP), '가게 취소 — 이 주문 잡음만 풂');
  ok(/body:has\(\.sheet\.on\) \.verbar:not\(\.mini\)\{display:none\}/.test(APP), '업데이트 띠 — 상세 화면이 열리면 숨김');
  ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(cut(APP, 'async function rcHumanWhy(e, a)', 'const RC_TICK_MS')) && !/\balert\(|\bconfirm\(/.test(cut(APP, 'const Y24GO_CLAIM_MS', 'async function ledY24Go(')), '새 코드에 브라우저 창 없음');
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tAUDITFIX1113 ${bad}개 실패` : '✓ tAUDITFIX1113 순수·글자 검사 통과 (화면은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  console.log('④ 화면(harness)');
  require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
    await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
    /* 사후 확인 다시 맡기기 */
    const R = await p.evaluate(async () => { const id = 'aladin_U215983415'; const l = S.plist.get(id); l.status = '판매중'; l.active = true; l.qty = 1; const at = new Date(Date.now() - 1.2 * 864e5).toISOString();
      const e = { ch: 'aladin', key: 'SK15', id, k: 'down', to: 0, at, r: {} }; const TD = [{ key: 'SK15', title: '시험', last: new Date(Date.now() - 3 * 3600e3).toISOString(), acts: [{ ch: 'aladin', id, k: 'down', to: 0, why: '시험' }] }];
      await db.collection('app_settings').doc('platforms').set({ omni: { autoDown: { on: 1, from: at }, recheck: { on: 1, days: [1, 3, 7, 30] } } }, { merge: true }); try { await omniLoad(true); } catch (x) {}
      const out = {}; out.d3 = await rcRedo(e, TD, ['3']); out.d37 = await rcRedo(e, TD, ['3', '7']);
      l.registeredAt = new Date().toISOString(); out.rereg = await rcHumanWhy(e, { ch: 'aladin', id }); delete l.registeredAt;
      await db.collection('shp_cmds').doc('pe_h1').set({ type: 'prdEdit', status: 'done', listingKey: id, ch: { state: '판매중' }, createdAt: new Date(Date.now() - 3600e3).toISOString() }); out.human = await rcHumanWhy(e, { ch: 'aladin', id }); out.redoH = await rcRedo(e, TD, ['1']);
      await db.collection('shp_cmds').doc('pe_h1').set({ type: 'prdEdit', status: 'done', listingKey: id, ch: { state: '판매중지' }, createdAt: new Date(Date.now() - 3600e3).toISOString() }); out.ourDone = await rcHumanWhy(e, { ch: 'aladin', id });
      await db.collection('shp_cmds').doc('pe_h1').set({ type: 'prdEdit', status: 'fail', listingKey: id, ch: { state: '판매중지' }, createdAt: new Date(Date.now() - 3600e3).toISOString() }); out.fail = await rcHumanWhy(e, { ch: 'aladin', id });
      await db.collection('shp_cmds').doc('pe_old').set({ type: 'prdEdit', status: 'done', listingKey: id, ch: { state: '판매중' }, createdAt: new Date(Date.now() - 3 * 864e5).toISOString() }); out.old = await rcHumanWhy(e, { ch: 'aladin', id });
      return out; });
    ok(/1일 회차만/.test(R.d3) && /1일 회차만/.test(R.d37), '사후 확인 — 3·7일 회차는 다시 맡기지 않음(사람이 확인)', R);
    ok(/다시 등록/.test(R.rereg), '맡긴 뒤 다시 등록된 상품 → 사람 값', R);
    ok(/판매재개·값·수량/.test(R.human) && /사람 값 우선 · 다시 맡기지 않음/.test(R.redoH), '맡긴 뒤 사람이 판매재개한 수정 → 1일 회차라도 다시 맡기지 않음(기록만)', R);
    ok(/우리 판매중지는 끝났는데 다시 판매중/.test(R.ourDone), '우리 판매중지가 끝났는데 지금 판매중 → 사람이 되살린 것으로 봄', R);
    ok(R.fail === '' && R.old === '', '우리 맡김이 실패했거나 맡기기 전 수정뿐이면 다시 맡길 수 있음', R);
    /* 예스24 맡기기 표 */
    const Y = await p.evaluate(async () => { const rows = [{ rid: 'K1|9001', rk: 'r1', no: '9001' }, { rid: 'K2|9002', rk: 'r2', no: '9002' }]; const ref = db.collection('app_settings').doc('y24_go_claim'); const out = {};
      out.a = await ledY24Claim(rows); out.a2 = await ledY24Claim(rows); /* 같은 기기는 다시 잡힘 */
      const now = new Date().toISOString(), old = new Date(Date.now() - 5 * 60e3).toISOString(); await ref.set({ m: { 'K1|9001': { at: now, by: '다른 PC' }, 'K2|9002': { at: old, by: '다른 PC' } } });
      out.b = await ledY24Claim(rows); const d = await ref.get(); const m = (d.data() || {}).m || {}; return { a: out.a.ok.length, a2: out.a2.ok.length, b: out.b.ok.map((r) => r.rid), bl: out.b.lost.map((x) => x.by), k2: (m['K2|9002'] || {}).by !== '다른 PC' }; });
    ok(Y.a === 2 && Y.a2 === 2 && Y.b.join() === 'K2|9002' && Y.bl.join() === '다른 PC' && Y.k2, '예스24 맡기기 — 다른 PC가 3분 안에 잡은 줄은 뺌 · 3분 지난 표·같은 PC는 그대로', Y);
    /* 가게 취소 잡음 */
    const H = await p.evaluate(async () => { const ref = (k) => db.collection('shop_holds').doc(k); const at = new Date().toISOString();
      await ref('L1').set({ on: 1, no: 'B001' }); await ref('L2').set({ on: 1, sold: 1, why: '예스24에서 팔림' }); await ref('L3').set({ on: 1, no: 'B999' }); await ref('L4').set({ on: 1, no: 'B001', sold: 1 });
      const r = []; for (const k of ['L1', 'L2', 'L3', 'L4', 'L5']) r.push(await bqHoldFree(k, 'B001', at, '가게 취소 B001')); const v = {}; for (const k of ['L1', 'L2', 'L3', 'L4']) v[k] = ((await ref(k).get()).data() || {}).on; return { r, v }; });
    ok(H.r.join() === 'free,sold,other,sold,none' && H.v.L1 === 0 && H.v.L2 === 1 && H.v.L3 === 1 && H.v.L4 === 1, '가게 취소 — 이 주문 잡음만 풂 · 다른 판매처 팔림 표·다른 주문 잡음은 그대로', H);
    /* 업데이트 띠 */
    const V = await p.evaluate(async () => { document.querySelectorAll('style').forEach((s) => { if (/\.verbar\{display:none!important\}/.test(s.textContent)) s.remove(); }); const b = document.createElement('div'); b.className = 'verbar'; b.textContent = '새 판'; document.body.prepend(b); const sh = document.getElementById('sheet'); const vis0 = getComputedStyle(b).display; sh.classList.add('on'); const vis1 = getComputedStyle(b).display; sh.classList.remove('on'); const vis2 = getComputedStyle(b).display; b.remove(); return { vis0, vis1, vis2 }; });
    ok(V.vis0 !== 'none' && V.vis1 === 'none' && V.vis2 !== 'none', '업데이트 띠 — 상세 화면이 열린 동안만 숨김', V);
    ok(dlg.length === 0, '브라우저 창(alert·confirm) 0', dlg);
    console.log(bad ? `❌ tAUDITFIX1113 ${bad}개 실패` : '✓ tAUDITFIX1113 모두 통과'); process.exit(bad ? 1 : 0); });
})().catch((e) => { console.log('❌ 오류', e); process.exit(1); });
