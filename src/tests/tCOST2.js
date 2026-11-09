// (cost2) 🧾 운영 서비스 비용 — 비공개 이전으로 생기는 비용(GitHub Actions 분·Pro·자기 도메인·Hosting·진단 직접 호출·Claude)을 '기타 지출'에 집계 · 옛 항목은 끝난 날이 오면 접힘
// 실행: RN_PORT=8820 node tCOST2.js  (pw/ 안에서 · harness.js)
const fs = require('fs'); const path = require('path');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };

// ── ① 클라우드: GitHub 실행 분 세기(ghKind·ghRunMin·ghRunsDay) — 가짜 GitHub 응답으로
(async () => {
  const cloud = fs.readFileSync(path.join(__dirname, '../cloud/index.js'), 'utf8');
  const pick = (re) => { const m = cloud.match(re); if (!m) throw new Error('클라우드에서 못 찾음: ' + re); return m[0]; };
  const src = [pick(/const GH_REPO = [^\n]+/), pick(/const ghKind = [^\n]+/), pick(/function ghRunMin\([^\n]+/), pick(/async function ghRunsDay\([\s\S]+?\n  return out; \}/)].join('\n');
  const fn = new Function('process', src + '\nreturn { ghKind, ghRunMin, ghRunsDay, GH_REPO };');
  const G = fn({ env: {} }); const urls = [];
  const runs = [
    { name: 'pages build and deployment', display_title: 'x', event: 'dynamic', status: 'completed', conclusion: 'success', run_started_at: '2026-11-08T01:00:00Z', updated_at: '2026-11-08T01:01:30Z' }, // 2분
    { name: '클라우드 자동 배포 (Cloud Run)', display_title: 'diag: 진단 묻기 (lead)', event: 'push', status: 'completed', conclusion: 'success', run_started_at: '2026-11-08T02:00:00Z', updated_at: '2026-11-08T02:00:40Z' }, // 1분
    { name: '클라우드 자동 배포 (Cloud Run)', display_title: '클라우드 0.35.115', event: 'push', status: 'completed', conclusion: 'success', run_started_at: '2026-11-08T03:00:00Z', updated_at: '2026-11-08T03:04:10Z' }, // 5분
    { name: '클라우드 자동 배포 (Cloud Run)', display_title: 'x', event: 'schedule', status: 'completed', conclusion: 'success', run_started_at: '2026-11-08T04:41:00Z', updated_at: '2026-11-08T04:42:00Z' }, // 1분
    { name: '책방 친구 PC 프로그램 (Windows)', display_title: 'x', event: 'push', status: 'completed', conclusion: 'success', run_started_at: '2026-11-08T05:00:00Z', updated_at: '2026-11-08T05:09:30Z' }, // 10분(윈도우)
    { name: '결과물 함께 내기 (Firebase Hosting)', display_title: 'x', event: 'push', status: 'completed', conclusion: 'skipped', run_started_at: '2026-11-08T06:00:00Z', updated_at: '2026-11-08T06:00:00Z' }, // 0분
    { name: '클라우드 자동 배포 (Cloud Run)', display_title: 'x', event: 'push', status: 'in_progress', run_started_at: '2026-11-08T07:00:00Z', updated_at: '2026-11-08T07:01:00Z' } ];
  const fake = async (u) => { urls.push(u); return { ok: true, status: 200, json: async () => ({ total_count: runs.length, workflow_runs: runs }) }; };
  const R = await G.ghRunsDay('2026-11-08', fake);
  console.log('① 클라우드 GitHub 실행 분');
  ok(/created=2026-11-07T15:00:00Z\.\.2026-11-08T14:59:59Z/.test(urls[0]), '한국 날짜 하루 = UTC 범위로 물음: ' + urls[0].split('created=')[1]);
  ok(R.runs === 6 && R.open === 1, '끝난 실행 6 · 도는 중 1 따로');
  ok(R.min === 19, '분 올림 합 19분 (2+1+5+1+10+0) — ' + R.min);
  ok(R.win === 10, '윈도우 분 따로 10 (비공개 청구 ×2용)');
  ok(R.kinds.pages.min === 2 && R.kinds.diag.n === 1 && R.kinds.deploy.min === 5 && R.kinds.health.n === 1 && R.kinds.friend.min === 10 && R.kinds.hosting.min === 0, '종류 나눔: pages·diag·deploy·health·friend·hosting');
  const bad = async () => ({ ok: false, status: 404 }); let er = ''; try { await G.ghRunsDay('2026-11-08', bad); } catch (e) { er = e.message; } ok(/404.*GH_TOKEN/.test(er), '비공개라 404면 열쇠 필요하다고 알림: ' + er);
  ok(/ghActDaily\(3\)/.test(cloud) && /J\.costs && Date\.now\(\) > ghNextAt/.test(cloud), '매일 일에 GitHub 실행 분 기록이 붙음');
  ok(/firebasehosting\.googleapis\.com\/network\/sent_bytes_count/.test(cloud) && /'host_xfer', 'Firebase Hosting'/.test(cloud), '클라우드 비용 기록에 Firebase Hosting 저장·전송 줄');

  // ── ② 웹앱
  require('./harness.js')(async (p) => {
    const r = await p.evaluate(async () => { const wait = (ms) => new Promise((res) => setTimeout(res, ms)); const O = {}; try { expWatch(); } catch (e) {} await wait(300);
      const cur = dstr(new Date()).slice(0, 7); const d1 = cur + '-01'; const today = dstr(new Date()); const dim = new Date(+cur.slice(0, 4), +cur.slice(5, 7), 0).getDate();
      S.costAuto = new Map([[cur, { ym: cur, days: { [d1]: { rate: 1400, lines: [{ service: 'Firestore', item: '문서 읽기', usd: 1, krw: 1400 }, { service: 'Firebase Hosting', item: '내려받기 전송', usd: 0.5, krw: 700 }] } } }]]);
      S.costBill = new Map(); S.expMan = { a1: { kind: 'sub', vendor: 'Anthropic', item: 'Claude Max (5x) — 예상', amount: 110, currency: 'USD', rate: 1400, from: '2026-01' } };
      // 공개인 동안: GitHub 0원 · 옛 항목은 '쓰는 중'
      S.expSvc = {}; S.costGh = new Map([[cur, { ym: cur, days: { [d1]: { runs: 150, min: 220, win: 0, kinds: { pages: { n: 70, min: 100 }, diag: { n: 50, min: 60 }, health: { n: 10, min: 10 }, deploy: { n: 20, min: 50 } } } } }]]);
      let X = otherExpForMonth(cur); const gA = X.svcL.find((l) => l.key === 'gh_act'); O.pub = { gh: gA.now, full: gA.full, src: gA.basis, svc: X.svc, oldAct: X.svcOld.filter((o) => !o.ended).length, oldMin: X.svcOld.find((o) => o.key === 'pages').min };
      // 비공개 전환(이 달 1일) · 진단 직접 · Pages 끔 · 도메인 · Pro · Hosting 시작
      S.expSvc = { privateFrom: d1, diagDirectFrom: d1, pagesOff: d1, hostingFrom: d1, domainName: 'example-books.kr', domainKrwYear: 24000, domainBought: d1, domainRenew: (+cur.slice(0, 4) + 1) + cur.slice(4) + '-01', ghPlan: 'pro', ghProFrom: cur };
      // 실제 분 3,500분(하루) → Pro 무료 3,000분 뺀 500분 × $0.006 × 1400원 = 4,200원
      S.costGh = new Map([[cur, { ym: cur, days: { [d1]: { runs: 900, min: 3400, win: 100, kinds: { deploy: { n: 800, min: 3000 }, friend: { n: 4, min: 100 }, pages: { n: 0, min: 0 } } } } }]]);
      X = otherExpForMonth(cur); const L = Object.fromEntries(X.svcL.map((l) => [l.key, l]));
      O.priv = { keys: Object.keys(L), gh: L.gh_act.now, ghFull: L.gh_act.full, ghF: L.gh_act.formula, pro: L.gh_pro.now, dom: L.domain.now, domF: L.domain.formula, host: L.hosting.now, hostIncl: L.hosting.incl, hostB: L.hosting.basis, diagIncl: L.diag_run.incl, diagF: L.diag_run.formula, anth: L.anthropic && L.anthropic.now, anthIncl: L.anthropic && L.anthropic.incl, svc: X.svc, total: X.total, subs: X.subs, estUsed: X.estUsed, old: X.svcOld.map((o) => o.key + ':' + o.ended + ':' + o.endDay) };
      // 직접 넣은 GitHub 청구서가 있으면 계산 줄은 세지 않음
      S.expMan.g1 = { kind: 'bill', vendor: 'GitHub', item: '11월 청구서', ym: cur, amount: 9000, currency: 'KRW' }; X = otherExpForMonth(cur); O.billOver = { gh: X.svcL.find((l) => l.key === 'gh_act').now, pro: X.svcL.find((l) => l.key === 'gh_pro').now, bill: X.bill }; delete S.expMan.g1;
      // 실제 분이 없으면 어림(옮긴 뒤 1,300분 → Pro 3,000 안 → 0원)
      S.costGh = new Map(); X = otherExpForMonth(cur); const g2 = X.svcL.find((l) => l.key === 'gh_act'); O.est = { now: g2.now, full: g2.full, src: g2.basis, M: g2.M.full };
      // 미래 날짜 = 아직 '쓰는 중'
      S.expSvc = { ...S.expSvc, pagesOff: '2099-01-01', diagDirectFrom: '2099-01-01' }; X = otherExpForMonth(cur); O.future = X.svcOld.map((o) => o.key + ':' + o.ended);
      S.expSvc = { ...S.expSvc, pagesOff: d1, diagDirectFrom: d1 }; S.costGh = new Map([[cur, { ym: cur, days: { [d1]: { runs: 900, min: 3400, win: 100, kinds: { deploy: { n: 800, min: 3000 } } } } }]]);
      // 화면
      const box = document.createElement('div'); box.className = 'card'; document.body.appendChild(box); box.innerHTML = expSection(); const el = document.getElementById('exp_box'); expBind(el); expRerender = () => {};
      const tx = el.innerText.replace(/\s+/g, ' '); O.ui = { has: !!el.querySelector('#svc_box'), rows: [...el.querySelectorAll('#svc_box tr[data-svc]')].map((t) => t.dataset.svc), endRows: [...el.querySelectorAll('#svc_old tr[data-svcend]')].map((t) => t.dataset.svcend), oldOpen: el.querySelector('#svc_old') ? el.querySelector('#svc_old').open : null, hasDay: /하루 평균/.test(tx), hasPct: /매출 대비/.test(tx), hasMonth: /한 달 합계/.test(tx), domTxt: /연 24,000원 ÷ 12|연 ₩?24,000/.test(tx) || tx.includes('÷ 12'), privCmd: /git clone https:\/\/github\.com\/jerrycson\/readnow-scripts &amp;&amp;|git clone https:\/\/github\.com\/jerrycson\/readnow-scripts && bash/.test(el.innerHTML), stages: (el.querySelector('#svc_cfg') || {}).textContent };
      // 설정 고치기 → 저장 (Firestore expenses.svc · 기록 남김)
      el.querySelector('#sv_edit').click(); await wait(100); const set = (id, v) => { const x = el.querySelector('#' + id); x.value = v; }; set('sv_domainKrwYear', '36000'); set('sv_ghMinUsd', '0.008'); el.querySelector('#sv_save').click(); await wait(500);
      const doc = await db.collection('app_settings').doc('expenses').get(); const dd = doc.data() || {}; O.saved = { y: dd.svc && dd.svc.domainKrwYear, u: dd.svc && dd.svc.ghMinUsd, pf: dd.svc && dd.svc.privateFrom, log: (dd.log || []).some((l) => l.act === 'svc') };
      X = otherExpForMonth(cur); O.after = { dom: X.svcL.find((l) => l.key === 'domain').now, gh: X.svcL.find((l) => l.key === 'gh_act').now };
      O.cur = cur; O.dim = dim; O.today = today; return O; });
    console.log('② 웹앱'); console.log('   ', JSON.stringify(r).slice(0, 1800));
    ok(r.pub.gh === 0 && r.pub.full === 0 && /공개 저장소/.test(r.pub.src) && r.pub.svc === 0, '공개인 동안 GitHub Actions 0원 (근거 "공개 저장소 — 무료")');
    ok(r.pub.oldAct === 3 && r.pub.oldMin === 100, '공개인 동안 옛 항목 3개 쓰는 중 · Pages 이 달 100분 보임');
    ok(r.priv.gh === 4200, `비공개 뒤 Actions = (3,500분 − Pro 무료 3,000) × $0.006 × 1400 = 4,200원 → ${r.priv.gh}`);
    ok(/3,500분 − 무료 3,000분/.test(r.priv.ghF), '셈 식 표시: ' + r.priv.ghF);
    ok(r.priv.pro === 5600, 'GitHub Pro $4 × 1400 = 5,600원 → ' + r.priv.pro);
    ok(r.priv.dom === 2000 && /÷ 12/.test(r.priv.domF), '도메인 연 24,000원 ÷ 12 = 2,000원/달 → ' + r.priv.dom);
    ok(r.priv.host === 700 && r.priv.hostIncl === false && /다시 더하지 않음/.test(r.priv.hostB), 'Hosting = 클라우드 자동 기록 줄 700원 · 합계에 다시 안 더함');
    ok(r.priv.diagIncl === false && /하루 35번/.test(r.priv.diagF), 'Cloud Run 진단 직접 호출 = 어림 몫만 (하루 35번 근거)');
    ok(r.priv.anth === 154000 && r.priv.anthIncl === false, 'Claude 구독 $110 = 154,000원 그대로 · 겹쳐 안 셈');
    ok(r.priv.svc === 4200 + 5600 + 2000, '계산 줄 합(합계에 더함) = 11,800원 → ' + r.priv.svc);
    ok(r.priv.total === r.priv.estUsed + r.priv.subs + r.priv.svc, '기타 지출 합계 = Google Cloud + 구독 + 계산 줄 (Hosting·Claude 두 번 안 셈)');
    ok(r.priv.old.every((x) => /:true:/.test(x)), '단계 날짜가 오면 옛 항목 3개 저절로 끝남: ' + r.priv.old.join(' '));
    ok(r.billOver.gh === 0 && r.billOver.pro === 0 && r.billOver.bill === 9000, 'GitHub 청구서를 직접 넣으면 계산 줄은 0 (청구서가 먼저)');
    ok(r.est.M > 0 && /어림 — 한 달 1,300분/.test(r.est.src) && r.est.full === 0, '실제 분이 없으면 옮긴 뒤 어림 1,300분 · Pro 무료 안 → 0원');
    ok(r.future.every((x) => /:false$/.test(x)), '끝나는 날이 미래면 아직 쓰는 중');
    ok(r.ui.has && r.ui.rows.includes('gh_act') && r.ui.rows.includes('domain') && r.ui.rows.includes('hosting'), '화면에 🧾 칸과 줄들: ' + r.ui.rows.join(','));
    ok(r.ui.endRows.length === 3 && r.ui.oldOpen === false, '끝난 옛 항목은 접힌 칸에 3줄 (지우지 않음)');
    ok(r.ui.hasDay && r.ui.hasPct && r.ui.hasMonth, '한 달 합계·하루 평균·매출 대비 칸');
    ok(r.ui.privCmd, '비공개 뒤 실제 비용 켜기 명령이 git clone 길로 바뀜');
    ok(/끝남·시작됨/.test(r.ui.stages || ''), '단계표에 끝남 날짜');
    ok(r.saved.y === 36000 && r.saved.u === 0.008 && r.saved.pf === r.cur + '-01' && r.saved.log, '설정 저장(expenses.svc · 기록 남김 · 넣어 둔 단계 날짜 그대로)');
    ok(r.after.dom === 3000, '저장 뒤 도메인 연 36,000원 → 3,000원/달');
    console.log(`\n결과: ${pass} 통과 · ${fail} 실패`); if (fail) process.exitCode = 1;
  });
})().catch((e) => { console.log('시험 오류', e); process.exitCode = 1; });
