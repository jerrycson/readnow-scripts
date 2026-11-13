// tINTEL1113 — (11/13 · 일꾼 intel1 · 정범님 「최상위 정보기관·대기업이 정보를 모으는 방식을 웹앱에 기록 · 연구 페이지 · 계속 쌓기」) 🕵 정보 수집 방법 연구
//  ① 클라우드 cloud/intel.js — 회차 지표 셈(intelCalc: 범위·끝까지 몫·신선도·7일 넘김·출처 등급·쪽·MB·사라짐·기준선 경보·PC 수) · 쌓기(tick: 날 문서·요약 hist) · 글 받기(put: 이전 판 남김·휴대전화 꼴 거절)
//  ② 웹앱 — 🔬 연구 탭 카드 · 화면(요약 수·회차 지표 표·목표 ✓/✗·경보·상위 10·조직 세 단계 펼침·항목 칩·찾기·지금 데이터 칸·연구 연계) · 🔬 연구 모음 링크 · 닫으면 판 버림 · 휴대폰 폭
//  실행: node tINTEL1113.js (harness.js·fbstub.js·seed.js 옆 · 빌드한 app/index.html을 harness 포트로)
const path = require('path'); const fs = require('fs');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const R = [path.join(__dirname, '../..'), path.join(__dirname, '..'), '/home/user/wk-intel1', '/home/user/readnow-scripts'].find((p) => fs.existsSync(path.join(p, 'cloud/intel.js')));
const day = '2026-11-12';
/* 판매자 A: 35일 동안 하루 판매율 1% 안팎 → 오늘 5%(경보) · B: 평소대로 · C: 새 것만 · D: 중간 멈춤 */
function mkDays() { const L = []; for (let i = 1; i <= 8; i++) { const d = new Date(Date.parse(day + 'T00:00:00Z') - i * 3 * 864e5).toISOString().slice(0, 10); L.push({ sc: 'A', name: '판매자A', day: d, complete: true, full: true, spanDays: 3, total: 1000, gone: 30 + (i % 2), lowNow: 100, pages: 20, pc: 'LOGGER' }); L.push({ sc: 'B', name: '판매자B', day: d, complete: true, full: true, spanDays: 3, total: 2000, gone: 60, lowNow: 300, pages: 40, pc: 'LOGGER' }); }
  L.push({ sc: 'A', name: '판매자A', day, complete: true, full: true, spanDays: 3, total: 1000, gone: 150, lowNow: 100, pages: 20, pc: 'LOGGER' });
  L.push({ sc: 'B', name: '판매자B', day, complete: true, full: true, spanDays: 3, total: 2000, gone: 61, lowNow: 300, pages: 40, pc: 'LOGGER', resumes: 2 });
  L.push({ sc: 'C', name: '판매자C', day, light: true, partial: true, complete: false, total: 500, newN: 40, pages: 3, pc: 'LOGGER' });
  L.push({ sc: 'D', name: '판매자D', day, complete: false, partial: true, total: 800, pages: 9, pc: 'LOGGER', anchorLost: true });
  L.push({ sc: 'E', name: '판매자E', day, base: true, complete: true, full: true, total: 300, pages: 6, pc: 'LOGGER' }); return L; }
const mkState = () => [{ id: 'A', complete: true, endAt: '2026-11-11T20:00:00Z' }, { id: 'B', complete: true, endAt: '2026-11-10T20:00:00Z' }, { id: 'C', complete: true, endAt: '2026-11-01T20:00:00Z' }, { id: 'D' }, { id: 'E', complete: true, endAt: '2026-11-12T01:00:00Z' }, { id: 'F', off: true }];
async function cloudPart() {
  const { intelCalc, makeIntel } = require(path.join(R, 'cloud/intel.js'));
  const m = intelCalc(mkDays(), mkState(), day);
  ok(m.planN === 5 && m.readN === 5 && m.cov === 1, '① 계획 판매자(꺼 둔 것 뺌) 5 · 읽음 5 · 범위 100%', m);
  ok(m.fullN === 3 && m.lightN === 1 && m.partN === 2 && m.useN === 2, '① 숍 끝까지 3 · 새 것만 1 · 중간 멈춤 2 · 비교 기준 회차 2(첫 바퀴 뺌)', m);
  ok(m.gA === 2 && m.gB === 1 && m.gC === 1 && m.gD === 1 && m.aShare === 0.4, '① 출처 등급 A2·B1·C1·D1 · A 몫 40%', { a: m.gA, b: m.gB, c: m.gC, d: m.gD });
  ok(m.stale7 === 2 && m.fresh != null && m.fresh < 3, '① 7일 넘게 못 읽은 판매자 2(C 11일·D 기록 없음) · 신선도 가운데 값', { s: m.stale7, f: m.fresh });
  ok(m.pages === 78 && Math.abs(m.mb - 44.9) < 0.11 && m.gone === 211 && m.mbPerGone > 0, '① 쪽 78 · MB(쪽×0.575) · 사라짐 211 · 1건당 MB', { p: m.pages, mb: m.mb, g: m.gone });
  ok(m.anomN === 1 && m.anom[0].sc === 'A' && m.anom[0].kind === '판매율' && m.anom[0].z > 3, '① 기준선 경보: 판매자A 판매율 급증만(B는 평소대로)', m.anom);
  ok(m.cut === 3 && m.pcN === 1 && m.pcs.LOGGER === 5 && m.newN === 40, '① 끊김 3 · 출처 PC 1(LOGGER) · 새 등록 40', { c: m.cut, p: m.pcs });
  // 쌓기·글 받기 — 가짜 Firestore
  const DB = {}; const col = (n) => (DB[n] = DB[n] || {});
  const C = (n) => ({ doc: (id) => ({ get: async () => ({ exists: id in col(n), data: () => (col(n)[id] ? JSON.parse(JSON.stringify(col(n)[id])) : undefined) }), set: async (v) => { col(n)[id] = JSON.parse(JSON.stringify(v)); } }),
    where: () => ({ select: () => ({ get: async () => { const L = mkDays(); return { forEach: (f) => L.forEach((v) => f({ data: () => v })) }; } }) }), select: () => ({ get: async () => { const L = mkState(); return { forEach: (f) => L.forEach((v) => f({ id: v.id, data: () => v })) }; } }) });
  const IN = makeIntel({ C, FV: {}, log: () => {}, W: () => ({ writer: 'cloud' }) });
  const dry = await IN.tick({ dry: true, day }); ok(dry.dry && dry.m[day].anomN === 1 && !col('research_intel_days')[day], '① 진단 셈만(dry) — 쓰지 않음', dry.m[day] && dry.m[day].anomN);
  const t1 = await IN.tick({ day }); const meta = col('app_settings').research_intel_meta;
  ok(t1.n === 1 && col('research_intel_days')[day] && meta && meta.latest.day === day && meta.hist.length === 1 && meta.hist[0].m.pcs === undefined, '① 쌓기: 날 문서 + 요약(최근 회차 · hist는 가볍게)', meta && meta.hist);
  await IN.tick({ day }); ok(col('app_settings').research_intel_meta.hist.length === 1, '① 같은 날을 다시 셈하면 hist에 한 줄만(고쳐 씀)');
  const p0 = await IN.put({ orgs: [] }); ok(!p0.ok, '① 글 받기: orgs·items 없으면 거절');
  const p1 = await IN.put({ orgs: [{ id: 'cia', docs: [{}, {}] }], items: [{ id: 'I01' }] }, 'intel1'); ok(p1.ok && p1.nDoc === 2 && col('app_settings').research_intel.nItem === 1, '① 글 받기: 통째로 씀(조직·항목·문서 수)', p1);
  await IN.put({ orgs: [{ id: 'cia', docs: [] }], items: [{ id: 'I01' }, { id: 'I02' }] }, 'intel1'); ok(Object.keys(col('research_intel_hist')).length === 1 && col('app_settings').research_intel.nItem === 2, '① 다시 올리면 이전 판을 research_intel_hist에 남김(지우지 않음)');
  const p3 = await IN.put({ orgs: [], items: [{ id: 'x', t: '010-1234-5678' }] }); ok(!p3.ok && /휴대전화/.test(p3.err), '① 휴대전화 번호 꼴이 있으면 거절');
}
/* ── ② 웹앱 */
const J = { q: '정보기관은 어떻게 모으나', cats: ['① 요구·계획', '③ 출처 평가'], mdef: { cov: '읽기 범위', fresh: '신선도', stale7: '7일 넘김', mb: '테더링 MB', pcN: '출처 PC 수' }, goals: { cov: ['>=', 0.9], fresh: ['<=', 7], stale7: ['<=', 0] }, top: ['I08', 'I01'],
  orgs: [{ id: 'cia', name: '미국 CIA(중앙정보국)', kind: '국가 정보기관', line: '구조화된 분석 기법의 본산', sent: '한 문장 요약 CIA', page: ['1페이지 첫 줄', 'ACH 표'], docs: [{ t: 'Psychology of Intelligence Analysis', pub: 'CIA CSI', y: 1999, url: 'https://example.org/heuer', g: '공식', v: 1 }] },
    { id: 'nato', name: 'NATO', kind: '동맹 교리', line: 'OSINT 교본', sent: '한 문장 NATO', page: ['네 단계'], docs: [{ t: 'OSINT Handbook', pub: 'NATO', y: 2001, url: '', g: '공식', v: 0 }] }],
  items: [{ id: 'I01', cat: '① 요구·계획', name: '정보 순환 주기', what: '요구→수집→처리', src: ['cia'], doc: 'JP 2-0', basis: 'planning and direction', app: '회차 = 한 바퀴', over: ['N07'], m: ['cov'], now: '', next: '다음 순서표', pr: 5 },
    { id: 'I08', cat: '③ 출처 평가', name: '교차 검증', what: '두 출처 이상', src: ['cia', 'nato'], doc: 'Butler', basis: 'validation', app: '사라짐=팔림 확인', over: ['f_261102_gone_is_sale_75'], m: ['mb'], now: '표본 4건', next: '표본 30건', pr: 5 },
    { id: 'I30', cat: '③ 출처 평가', name: 'OPSEC 노출 최소화', what: '드러나지 않게', src: ['nato'], doc: 'Berkeley', basis: 'security', app: '약속 0', over: [], m: ['pcN'], now: '', next: '', pr: 4 }],
  links: [{ id: 'N07', name: '성공 사례 견줌', kind: '연구 등록부', items: ['I01'] }, { id: 'f_261102_gone_is_sale_75', name: '사라짐 75%', kind: '발견 모음', items: ['I08'] }] };
const META = { latest: { day, m: { day, planN: 29, readN: 22, cov: 0.759, fresh: 5.9, stale7: 3, mb: 4822.5, pcN: 1, pcs: { LOGGER: 27 }, anomN: 1, anom: [{ sc: 'A', name: '판매자A', kind: '판매율', z: 5.2, x: 5, base: 1 }] } }, hist: [{ day: '2026-11-11', m: { cov: 0.7, mb: 4000 } }, { day, m: { cov: 0.759, mb: 4822.5 } }] };
async function webPart(p) {
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
  await p.evaluate(([J, M]) => { window.__FS.app_settings = window.__FS.app_settings || {}; window.__FS.app_settings.research_intel = { j: JSON.stringify(J), at: '2026-11-13T03:00:00.000Z', nOrg: 2, nItem: 3 }; window.__FS.app_settings.research_intel_meta = M; }, [J, META]);
  const tab = await p.evaluate(() => { S.q = ''; S.tab = 'research'; renderTabs(); renderMainNow(); afterRender(); return [...document.querySelectorAll('#main .np-c[data-navgo]')].map((b) => b.dataset.navgo); });
  ok(tab[0] === 'found' && tab[1] === 'intel', '② 🔬 연구 탭 둘째 카드 = 🕵 정보 수집 방법 연구(발견 모음 다음)', tab.slice(0, 4));
  await p.evaluate(() => document.querySelector('#main .np-c[data-navgo="intel"]').click()); await p.waitForTimeout(800);
  const d0 = await p.evaluate(() => ({ on: !!(S.detail && S.detail.intel), sum: document.querySelector('#it_top').textContent, mt: document.querySelector('#it_m').textContent, rows: document.querySelectorAll('#it_m tr[data-itm]').length, top: [...document.querySelectorAll('#it_top10 .it-tag')].map((x) => x.textContent), orgs: document.querySelectorAll('#it_orgs .it-o').length, items: [...document.querySelectorAll('#it_list .it-i')].map((x) => x.dataset.itid), links: document.querySelectorAll('#it_links tr').length }));
  ok(d0.on && /조직 2/.test(d0.sum) && /근거 문서 1|근거 문서 2/.test(d0.sum) && /항목 3/.test(d0.sum) && /연구 연계 2/.test(d0.sum), '② 요약: 조직·문서·항목·연계 수', d0.sum);
  ok(d0.rows >= 10 && /75\.9%/.test(d0.mt) && /✗ 목표 ≥ 90%/.test(d0.mt) && /✓ 목표 ≤ 7/.test(d0.mt) && /판매자A/.test(d0.mt) && /LOGGER 27/.test(d0.mt), '② 회차 지표 표 · 목표 ✓/✗ · 기준선 경보 · 읽은 PC', d0.mt.slice(0, 300));
  ok(d0.top.join('|') === 'I08|I01' && d0.orgs === 2 && d0.links === 3, '② 상위 10 순서 · 조직 2 · 연계 표 2줄', d0);
  ok(d0.items.join('|') === 'I01|I08|I30', '② 항목은 적용 우선 높은 것 먼저(같으면 번호 순)', d0.items);
  // 조직 세 단계
  const o = await p.evaluate(() => { const d = document.querySelector('#it_orgs .it-o[data-itorg="cia"]'); const s0 = d.open; d.querySelector('summary').click(); const s1 = d.open; const vis1 = /한 문장 요약 CIA/.test(d.innerText); const d2 = d.querySelector('.it-o2'); const p0 = d2.open; d2.querySelector('summary').click(); return { s0, s1, vis1, p0, p1: d2.open, txt: d2.innerText, a: (d2.querySelector('a') || {}).href }; });
  ok(!o.s0 && o.s1 && o.vis1 && !o.p0 && o.p1 && /1페이지 첫 줄/.test(o.txt) && /Psychology/.test(o.txt) && /example\.org\/heuer/.test(o.a), '② 조직: 한 줄 → 한 문장 → 1페이지·근거 문서(원문 링크)', o);
  ok(await p.evaluate(() => /발행처 목록 기준/.test(document.querySelector('#it_orgs .it-o[data-itorg="nato"]').innerHTML)), '② 주소를 확인 못 한 서지는 그렇게 표시');
  // 칩·찾기
  await p.evaluate(() => document.querySelector('#it_cats [data-itc="③ 출처 평가"]').click()); await p.waitForTimeout(200);
  ok(await p.evaluate(() => [...document.querySelectorAll('#it_list .it-i')].map((x) => x.dataset.itid).join('|') === 'I08|I30'), '② 갈래 칩 = 그 갈래만');
  await p.evaluate(() => document.querySelector('#it_cats [data-itc=""]').click()); await p.waitForTimeout(200);
  await p.fill('#it_q', 'OPSEC'); await p.waitForTimeout(600);
  const s1 = await p.evaluate(() => ({ ids: [...document.querySelectorAll('#it_list .it-i')].map((x) => x.dataset.itid), mark: (document.querySelector('#it_list mark') || {}).textContent, focus: document.activeElement && document.activeElement.id }));
  ok(s1.ids.join('|') === 'I30' && s1.mark === 'OPSEC' && s1.focus === 'it_q', '② 찾기: 맞는 항목만 · 글자 표시 · 초점 그대로', s1);
  await p.fill('#it_q', 'N07'); await p.waitForTimeout(600); ok(await p.evaluate(() => [...document.querySelectorAll('#it_list .it-i')].map((x) => x.dataset.itid).join('|') === 'I01'), '② 찾기: 겹침(연구 번호)으로도');
  await p.fill('#it_q', '없는낱말zz'); await p.waitForTimeout(600); ok(await p.evaluate(() => /맞는 항목이 없음/.test(document.querySelector('#it_list').textContent)), '② 맞는 것이 없으면 그렇게 알림');
  await p.fill('#it_q', ''); await p.waitForTimeout(600);
  // 항목 펼침 — 지금 데이터 칸에 회차 지표
  const ex = await p.evaluate(() => { const it = document.querySelector('#it_list .it-i[data-itid="I08"]'); it.querySelector('summary').click(); return { open: it.open, txt: it.innerText }; });
  ok(ex.open && /Butler/.test(ex.txt) && /validation/.test(ex.txt) && /사라짐=팔림 확인/.test(ex.txt) && /f_261102_gone_is_sale_75/.test(ex.txt) && /테더링 MB 4,823/.test(ex.txt) && /표본 4건/.test(ex.txt) && /표본 30건/.test(ex.txt), '② 항목 펼침: 출처·원문 근거·적용·겹침·지금 데이터(회차 지표+메모)·다음 회차', ex.txt);
  // 닫기 → 판 버림
  await p.evaluate(() => history.back()); await p.waitForTimeout(500); ok(await p.evaluate(() => !(S.detail && S.detail.intel) && S.it == null), '② 닫으면 받은 판을 버림(메모리)');
  // 🔬 연구 모음 링크
  await p.evaluate(() => openResearch()); await p.waitForTimeout(600);
  const lk = await p.evaluate(() => { const b = document.querySelector('#sheet [data-rhintel]'); if (!b) return false; b.click(); return true; }); await p.waitForTimeout(600);
  ok(lk && (await p.evaluate(() => !!(S.detail && S.detail.intel))), '② 🔬 연구 모음 맨 위 🕵 링크로 열림');
  // 휴대폰 폭
  await p.setViewportSize({ width: 390, height: 800 }); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= 392), '② 휴대폰 390px에서 옆으로 넘치지 않음', await p.evaluate(() => document.documentElement.scrollWidth));
  if (process.env.RN_SHOT) { await p.setViewportSize({ width: 1200, height: 900 }); await p.waitForTimeout(300); await p.screenshot({ path: process.env.RN_SHOT, fullPage: false }); }
  await p.evaluate(() => history.back()); await p.waitForTimeout(400);
  // 글이 비면
  await p.evaluate(() => { S.it = null; window.__FS.app_settings.research_intel = null; window.__FS.app_settings.research_intel_meta = null; openIntel(); }); await p.waitForTimeout(700);
  ok(await p.evaluate(() => /조직 0/.test(document.querySelector('#it_top').textContent) && /아직 회차 지표가 없습니다/.test(document.querySelector('#it_m').textContent)), '② 글·지표가 없어도 화면이 깨지지 않음');
  ok(await p.evaluate(() => FEAT.some((f) => /정보 수집 방법 연구/.test(f.t)) && GO_PAGES.some((g) => g[0] === 'intel') && PG_SCR.some((x) => x[0] === 'intel') && !!PAGE_GUIDES.intel), '② 🔍 기능 찾기·🚪 바로 가기·화면 목록·화면 설명서');
}
(async () => {
  console.log('① 클라우드 정보 수집 방법 연구'); try { await cloudPart(); } catch (e) { bad++; console.log('  ❌ 클라우드 시험 멈춤', e.stack); }
  console.log('② 웹앱 🕵 정보 수집 방법 연구');
  await require('./harness.js')(async (p) => { try { await webPart(p); } catch (e) { bad++; console.log('  ❌ 시험 멈춤:', String(e.message).slice(0, 300)); } });
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과'); process.exit(bad ? 1 : 0);
})();
