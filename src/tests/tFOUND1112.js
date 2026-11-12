// tFOUND1112 — (11/12 밤 · 일꾼 found1 · 정범님 「새로 알아낸 모든 것을 한 곳에 · 엔진들도 수시로 참고」) 📚 발견 모음
//  ① 클라우드 cloud/found.js — 고르기(norm) · 더하기(addMany: 새로·같은 글·고쳐 씀·모양 틀림) · 요약 문서 j · 읽기(read: 분야·낱말·상태)
//  ② 웹앱 — 🔬 연구 탭 카드 · 화면 그리기(분야·상태 칩 수) · 찾기(낱말 여럿 = 모두 들어감 · 표시) · 칩 거르기 · 최근 순 · 카드 펼침 · 🔬 연구 모음 화면 맨 위 링크 · 요약 칸이 비면 컬렉션 직접 읽기
//  실행: RN_PORT=<포트> node tFOUND1112.js (harness.js·fbstub.js·seed.js 옆 · 빌드한 app/index.html을 그 포트로)
const path = require('path'); const fs = require('fs');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'cloud/found.js')));
/* ── ① 클라우드 쪽 — 가짜 Firestore(C·FV) */
async function cloudPart() {
  const { makeFound, foundNorm } = require(path.join(R, 'cloud/found.js'));
  const DB = {}; const col = (n) => (DB[n] = DB[n] || {});
  const inc = (n) => ({ __inc: n });
  const C = (n) => ({ doc: (id) => ({ get: async () => ({ exists: id in col(n), data: () => (col(n)[id] ? JSON.parse(JSON.stringify(col(n)[id])) : undefined) }), set: async (v, o) => { const cur = o && o.merge ? col(n)[id] || {} : {}; const nx = { ...cur }; for (const [k, x] of Object.entries(v)) nx[k] = x && x.__inc != null ? (Number(cur[k]) || 0) + x.__inc : x; col(n)[id] = nx; } }),
    get: async () => { const L = Object.entries(col(n)).map(([id, v]) => ({ id, data: () => JSON.parse(JSON.stringify(v)) })); return { size: L.length, forEach: (f) => L.forEach(f) }; }, select: () => C(n) });
  const F = makeFound({ C, FV: { increment: inc }, log: () => {}, W: () => ({ writer: 'cloud' }) });
  const n1 = foundNorm({ d: '2026-11-12', area: '알라딘', key: 'sp_kor', t: "목록 SP는 한글 '세일즈포인트'", st: '확인됨' });
  ok(n1.id === 'f_261112_sp_kor' && n1.rec.area === '알라딘' && n1.rec.st === '확인됨', '① 고르기: 열쇠로 id(f_YYMMDD_열쇠) · 분야·상태 그대로', n1);
  const n2 = foundNorm({ t: '분야를 모르는 발견 한 줄', area: '엉뚱', st: '몰라' }); ok(n2.rec.area === '기타' && n2.rec.st === '가설' && /^f_\d{6}_[a-z0-9]+$/.test(n2.id), '① 모르는 분야 = 기타 · 모르는 상태 = 가설 · id = 날짜+글 해시', n2);
  ok(foundNorm({ t: '짧' }).bad && foundNorm(null).bad, '① 한 줄이 없거나 모양이 틀리면 거절');
  const r1 = await F.addMany([{ d: '2026-11-12', area: '알라딘', key: 'sp_kor', t: "목록 SP는 한글 '세일즈포인트'로 씀", ev: '0% → 87.5%', st: '확인됨' }, { d: '2026-11-11', area: '우리숍', key: 'run429', t: '서가 일부 안 뜸 = Cloud Run 429', st: '확인됨' }, { t: 'x' }], 'found1');
  ok(r1.n === 2 && r1.bad.length === 1 && col('research_found').f_261112_sp_kor.by === 'found1' && col('research_found').f_261112_sp_kor.n === 1, '① 더하기: 2개 새로 · 1개 거절 · 누가(by)', r1);
  const meta = col('app_settings').research_found_meta; let J = []; try { J = JSON.parse(meta.j); } catch (e) {}
  ok(meta && meta.n === 2 && meta.areas['알라딘'] === 1 && J.length === 2 && J[0].d === '2026-11-12' && J[0].a === '알라딘', '① 요약 문서(research_found_meta) — 수·분야별·발견 전부(j · 최근 순)', meta && { n: meta.n, areas: meta.areas });
  const r2 = await F.addMany([{ d: '2026-11-12', area: '알라딘', key: 'sp_kor', t: "목록 SP는 한글 '세일즈포인트'로 씀", ev: '0% → 87.5%', st: '확인됨' }], 'lead');
  ok(r2.n === 0 && r2.same === 1 && col('research_found').f_261112_sp_kor.n === 2, '① 같은 글이 다시 오면 고치지 않고 n만 +1', r2);
  const r3 = await F.add({ d: '2026-11-12', area: '알라딘', key: 'sp_kor', t: "목록 SP는 한글 '세일즈포인트'로 씀", ev: '0% → 87.5% · 매일 표본도', st: '뒤집힘' }, 'adapt');
  ok(r3.n === 1 && col('research_found').f_261112_sp_kor.st === '뒤집힘' && col('research_found').f_261112_sp_kor.prevSt === '확인됨', '① 엔진 add(): 같은 id를 고쳐 씀(지우지 않음 · 앞 상태 prevSt)', r3);
  const q1 = await F.read({ q: '세일즈포인트' }); const q2 = await F.read({ area: '우리숍' }); const q3 = await F.read({});
  ok(q1.length === 1 && q2.length === 1 && q2[0].id === 'f_261111_run429' && q3.length === 2 && q3[0].d >= q3[1].d, '① 읽기 read(): 낱말·분야 거르기 · 최근 순', { q1: q1.length, q2: q2.length });
}
/* ── ② 웹앱 */
const L0 = [
  { id: 'f_261112_sp_kor', d: '2026-11-12', a: '알라딘', t: "목록 SP는 한글 '세일즈포인트'로 씀", e: 'SP 묶음 맞춤률 0% → 87.5%', u: 'SP 메우기', s: '확인됨', r: 'ADAPT.md', b: 'adapt', g: ['SP'] },
  { id: 'f_261112_rem_cnt', d: '2026-11-12', a: '예스24', t: '예스24 재고 칸 이름은 REM_CNT', e: 'ORD_REMAIN_CNT만 찾아 NaN', u: '수량 쓰기', s: '확인됨', r: '', b: 'y24chk', g: [] },
  { id: 'f_261112_front_age', d: '2026-11-12', a: '시장·매출', t: '앞 페이지 상품이 오래될수록 다음 매출이 줄어듦', e: 'r −0.39', u: '끌올 기능', s: '가설', r: '', b: 'sell3', g: ['앞 페이지'] },
  { id: 'f_261020_adult', d: '2026-10-20', a: '알라딘', t: '19금 상품 화면은 로그인해야 읽힘', e: '470권', u: '', s: '확인됨', r: '', b: 'lead', g: [] },
];
async function webPart(p) {
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
  await p.evaluate((L) => { window.__FS.app_settings = window.__FS.app_settings || {}; window.__FS.app_settings.research_found_meta = { n: L.length, j: JSON.stringify(L), at: '2026-11-12T14:00:00.000Z' }; }, L0);
  // 🔬 연구 탭 카드
  const tab = await p.evaluate(() => { S.q = ''; S.tab = 'research'; renderTabs(); renderMainNow(); afterRender(); const ks = [...document.querySelectorAll('#main .np-c[data-navgo]')].map((b) => b.dataset.navgo); return { ks, first: ks[0] }; });
  ok(tab.ks.includes('found') && tab.first === 'found', '② 🔬 연구 탭 첫 카드 = 📚 발견 모음', tab.ks.slice(0, 4));
  await p.evaluate(() => document.querySelector('#main .np-c[data-navgo="found"]').click()); await p.waitForTimeout(700);
  const d0 = await p.evaluate(() => ({ on: !!document.querySelector('#sheet.on'), found: !!(S.detail && S.detail.found), n: document.querySelectorAll('#fd_list .fd-it').length, areas: [...document.querySelectorAll('#fd_areas [data-fda]')].map((b) => b.textContent.trim()), sts: [...document.querySelectorAll('#fd_sts [data-fdst]')].map((b) => b.textContent.trim()), firstD: (document.querySelector('#fd_list .fd-it .fd-d') || {}).textContent, lastD: [...document.querySelectorAll('#fd_list .fd-it .fd-d')].pop().textContent }));
  ok(d0.on && d0.found && d0.n === 4, '② 카드를 누르면 📚 발견 모음 화면 · 발견 4개', d0);
  ok(d0.areas.join('|') === '전체 4|알라딘 2|예스24 1|시장·매출 1' && d0.sts.some((x) => /확인됨 3/.test(x)) && d0.sts.some((x) => /가설 1/.test(x)), '② 분야 칩·상태 칩에 수', { a: d0.areas, s: d0.sts });
  ok(d0.firstD === '2026-11-12' && d0.lastD === '2026-10-20', '② 최근 순(맨 위 11/12 · 맨 아래 10/20)', d0);
  // 찾기
  await p.fill('#fd_q', '세일즈포인트'); await p.waitForTimeout(600);
  const s1 = await p.evaluate(() => ({ n: document.querySelectorAll('#fd_list .fd-it').length, mark: (document.querySelector('#fd_list mark') || {}).textContent, focus: document.activeElement && document.activeElement.id }));
  ok(s1.n === 1 && s1.mark === '세일즈포인트' && s1.focus === 'fd_q', '② 찾기: 맞는 발견만 · 글자 표시 · 입력 칸 초점 그대로', s1);
  await p.fill('#fd_q', '알라딘 로그인'); await p.waitForTimeout(600);
  ok(await p.evaluate(() => document.querySelectorAll('#fd_list .fd-it').length === 1 && /19금/.test(document.querySelector('#fd_list .fd-t').textContent)), '② 낱말 여럿 = 모두 들어간 것(분야 이름도 찾음)');
  await p.fill('#fd_q', '없는낱말zz'); await p.waitForTimeout(600);
  ok(await p.evaluate(() => /맞는 발견이 없음/.test(document.querySelector('#fd_list').textContent)), '② 맞는 것이 없으면 그렇게 알림');
  await p.fill('#fd_q', ''); await p.waitForTimeout(600);
  // 칩
  await p.evaluate(() => document.querySelector('#fd_areas [data-fda="알라딘"]').click()); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.querySelectorAll('#fd_list .fd-it').length === 2 && [...document.querySelectorAll('#fd_list .fd-a')].every((x) => x.textContent === '알라딘')), '② 분야 칩 = 그 분야만');
  await p.evaluate(() => document.querySelector('#fd_sts [data-fdst="가설"]').click()); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.querySelectorAll('#fd_list .fd-it').length === 0), '② 분야+상태 함께 거름(알라딘 가설 0)');
  await p.evaluate(() => { document.querySelector('#fd_areas [data-fda=""]').click(); }); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.querySelectorAll('#fd_list .fd-it').length === 1 && /앞 페이지/.test(document.querySelector('#fd_list .fd-t').textContent)), '② 전체+가설 = 가설 1개');
  // 펼침
  const ex = await p.evaluate(() => { document.querySelector('#fd_sts [data-fdst=""]').click(); const it = document.querySelector('#fd_list .fd-it[data-fdid="f_261112_rem_cnt"]'); const before = it.open; it.querySelector('summary').click(); return { before, after: it.open, txt: it.textContent }; });
  ok(!ex.before && ex.after && /ORD_REMAIN_CNT/.test(ex.txt) && /y24chk/.test(ex.txt), '② 카드는 접혀 있다가 누르면 근거·쓰는 곳·누가', ex);
  // 닫기 → 판 버림
  await p.evaluate(() => history.back()); await p.waitForTimeout(500);
  ok(await p.evaluate(() => !(S.detail && S.detail.found) && S.fd == null), '② 닫으면 받은 판을 버림(메모리)');
  // 🔬 연구 모음 화면 맨 위 링크
  await p.evaluate(() => openResearch()); await p.waitForTimeout(600);
  const lk = await p.evaluate(() => { const b = document.querySelector('#sheet [data-rhfound]'); if (!b) return { has: false }; b.click(); return { has: true }; }); await p.waitForTimeout(500);
  ok(lk.has && (await p.evaluate(() => !!(S.detail && S.detail.found))), '② 🔬 연구 모음 맨 위 📚 발견 모음 › 링크로 열림', lk);
  await p.evaluate(() => history.back()); await p.waitForTimeout(400);
  // 요약 칸이 비면 컬렉션 직접
  await p.evaluate(() => { S.fd = null; window.__FS.app_settings.research_found_meta = { n: 0, j: '' }; window.__FS.research_found = { f_261112_a: { d: '2026-11-12', area: '기술·운영', t: '컬렉션에서 직접 읽은 발견', ev: '', use: '', st: '확인됨' } }; openFound(); }); await p.waitForTimeout(700);
  ok(await p.evaluate(() => document.querySelectorAll('#fd_list .fd-it').length === 1 && /컬렉션에서 직접/.test(document.querySelector('#fd_list').textContent)), '② 요약 칸이 비면 research_found 컬렉션을 직접 읽음');
  // 기능 찾기 · 바로 가기
  ok(await p.evaluate(() => FEAT.some((f) => /발견 모음/.test(f.t)) && GO_PAGES.some((g) => g[0] === 'found') && PG_SCR.some((x) => x[0] === 'found') && !!PAGE_GUIDES.found), '② 🔍 기능 찾기·🚪 바로 가기·화면 목록·화면 설명서에 들어 있음');
  // 휴대폰 폭
  await p.setViewportSize({ width: 390, height: 800 }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= 392), '② 휴대폰 390px에서 옆으로 넘치지 않음', await p.evaluate(() => document.documentElement.scrollWidth));
}
(async () => {
  console.log('① 클라우드 발견 모음'); try { await cloudPart(); } catch (e) { bad++; console.log('  ❌ 클라우드 시험 멈춤', e.message); }
  console.log('② 웹앱 📚 발견 모음');
  await require('./harness.js')(async (p) => { try { await webPart(p); } catch (e) { bad++; console.log('  ❌ 시험 멈춤:', String(e.message).slice(0, 300)); } });
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과'); process.exit(bad ? 1 : 0);
})();
