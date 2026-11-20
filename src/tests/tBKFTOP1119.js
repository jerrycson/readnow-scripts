// tBKFTOP1119 — (정범님 I-1119-1955-27 · bkftop1) 🛰 관제소(📁 묶음 화면 · openCtrlRoom → openBkfold) 맨 위 줄
//  ① 글: 맨 위 줄 단추 7종(🛰 가격 감시·⚡ 전략·🔒 잠금·🔬 연구·📚 발견·🎯 종합 비교·👀 조회수 분석) · 맨 위 줄·묶음 고르기 줄 붙음(sticky) CSS · 접기 기억(rn- 열쇠 · try) · 실행 카드 아래 옛 띠 없음 · 브라우저 창 없음
//  ② 화면(RN_PORT): 폭 360·768·1280·1920 — 단추 7개가 맨 위 줄에만 한 벌 · ⌨ 단축키·📖 설명서도 맨 위 줄(맨 아래엔 없음) · 끝까지 내려도 두 줄이 위에 붙음 · 가로 넘침 없음
//     · ▾ 접기/▸ 펼치기가 이 기기에 기억됨 · 내린 채로 🎯·👀를 누르면 안쪽 창 → 뒤로 가기로 묶음
//  ③ (정범님 I-1119-2051-30.1) 왼쪽 = ← 닫기 바로 옆부터 단추 · 오른쪽 = 수치 카드 다섯(총 상품수·최상단(최저가 배지)·동급 유효 최저가·상품 방문수·판매수) · 누르면 안쪽 창(지금 숫자·출처·기준·「📋 날마다 기록」 — kpia1 판 D·E가 채움) · 카드 셈은 Firestore 새 읽기 0 · 창은 날마다 기록 달 문서·묶음 장부만
// 실행: pw/ 안 RN_PORT=<포트> node tBKFTOP1119.js · 시험 자료(가짜 그룹 5개)에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 900)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8');
const KEYS = ['watch', 'strat', 'lock', 'res', 'found', 'cmp', 'px'];
console.log('① 글');
{ const i = T.indexOf('function bkfToolHtml('); const H = T.slice(i, T.indexOf('\nfunction ', i + 10));
  ok(i > 0 && KEYS.every((k) => H.includes(`B('${k}'`)), '맨 위 줄 단추 7종', KEYS.filter((k) => !H.includes(`B('${k}'`)));
  ok(/cmp: typeof openBenchHub === 'function' && \(\(\) => openBenchHub\('cmp'\)\)/.test(T) && /px: typeof openPxExp === 'function'/.test(T), '🎯 종합 비교 = openBenchHub(\'cmp\') · 👀 조회수 분석 = openPxExp');
  ok(/S\.detail\.benchHub \|\| S\.detail\.pxexp/.test(T), '두 새 화면도 안쪽 창 조건(bkfWinIs)에 들어감');
  ok(/\.sh\.bkfsh\{position:sticky;top:0;z-index:7;/.test(T), '맨 위 줄 = 붙음(sticky · z-index 7 — 안쪽 창 ✕(60)·물음 창보다 낮음)');
  ok(/#bkf_scr>\.csw\{top:var\(--bkftoph,0px\)/.test(T) && /--bkftoph/.test(T.slice(T.indexOf('function bkfTopObs('))), '묶음 고르기 줄 = 맨 위 줄 높이만큼 밑에 붙음');
  const F = T.slice(T.indexOf('function bkfSwFold('), T.indexOf('function bkfSwitch('));
  ok(/try \{/.test(F) && /'rn-bkf-swfold'/.test(F), '접기 기억 = 기기 저장 rn-bkf-swfold · try/catch');
  const A = T.slice(T.indexOf('function bkfActHtml('), T.indexOf('document.addEventListener', T.indexOf('function bkfActHtml(')));
  ok(!/bkfToolHtml|data-bkftool/.test(A) && !/bkf-tools/.test(T), '실행 카드 아래 옛 「🛰 감시·전략」 띠 없음');
  ok(/#bkf_top \[data-bkftool\]/.test(T), '맨 위 줄 단추 누름을 받음');
  const NEW = T.slice(T.indexOf('function bkfToolHtml('), T.indexOf('/* ◆ctrl 시작'));
  const KP = T.slice(T.indexOf('/* ◆ctrlkpi'), T.indexOf('/* ◆ctrl 시작'));
  ok(KP.length > 500 && ['ctrlKpiCalc', 'ctrlKpiCards', 'ctrlKpiOpen', 'ctrlKpiBody', 'ctrlKpiMore', 'ctrlKpiClose'].every((n) => KP.includes('function ' + n + '(')), '수치 카드 함수 나눔(ctrlKpiCalc·Cards·Open(kind)·Body·More·Close)');
  ok(['tot', 'top', 'low', 'view', 'sold'].every((k) => KP.includes(`['${k}', `)), '카드 다섯 종류(총 상품수·최상단·동급 유효 최저가·방문수·판매수)');
  ok(!/db\.collection|onSnapshot|\.get\(\)|firestore\(/.test(KP), '수치 카드 코드에 Firestore 읽기 없음(이미 받아 둔 것만)');
  ok(/return \{ n, amt, blk, stale, lk, lkx, cls, sk \}/.test(T), '상태판 셈이 팔린 상품 열쇠(sk)도 돌려줌 — 판매수 겹침 뺌');
  ok(/id="bkf_kpi"/.test(H) && /\.sh\.bkfsh>\.bkf-kpis\{order:5;margin-left:auto/.test(T), '카드 자리 = 맨 위 줄 오른쪽(margin-left:auto)');
  ok(!/\b(alert|confirm|prompt)\s*\(/.test(NEW + F), '새 코드에 브라우저 창 없음'); ok(!/01[016789]-?\d{3,4}-?\d{4}/.test(NEW + F), '전화번호 모양 없음'); }
if (!process.env.RN_PORT) { console.log(bad ? `❌ tBKFTOP1119 ${bad}개 실패` : '✓ tBKFTOP1119 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('② 화면');
const SEED = async function (d10) { if (!S.user) S.user = { email: 't@x', uid: 't' };
  for (let i = 0; i < 12; i++) { const uc = 'U5700000' + (10 + i); S.plist.set('aladin_' + uc, { id: 'aladin_' + uc, usedCode: uc, listingId: String(507937000 + i), title: '맨 위 줄 시험 책 ' + i, price: 7000 + i * 250, qty: 1, grade: ['최상', '상', '중'][i % 3], status: '판매중', active: true, bookId: 'bk57' + i }); }
  if (!(S.pbooks instanceof Map)) S.pbooks = new Map(); if (!(S.pmetrics instanceof Map)) S.pmetrics = new Map(); let n = 0;
  for (const l of S.plist.values()) { n++; if (!S.pbooks.has(l.bookId)) S.pbooks.set(l.bookId, { priceList: 12000 + n * 900, pubDate: '2001-03-01' }); if (!S.pmetrics.has(l.bookId)) S.pmetrics.set(l.bookId, { lastCheckedAt: new Date().toISOString(), usedFirstPage: [{ usedCode: 'OTH' + n, grade: l.grade, price: (+l.price || 5000) - 400, sellerCode: '1', listingId: '9' + n }] }); }
  S.pmLoaded = true; S.sellersLoaded = true;
  const put = (id, name) => db.collection('prd_price_batches').doc(id).set({ name, cond: { ...BATCH_DEF, name, pmin: 6900, pmax: 18900, recentDays: 0, kw: '' }, createdAt: d10, lastRunAt: d10, by: 't', writerSchema: 6, lastKeys: [], lastCount: 0, start: {} });
  const ids = ['gA', 'gB', 'gC', 'gD', 'gE']; const nm = ['1만-3만 중상태 아주 긴 그룹 이름 시험', '1만-3만 중상태(2)', '다른 그룹', '5천원 이하 최상 신간 위주 그룹', '그룹 다섯번째'];
  for (let i = 0; i < 5; i++) await put(ids[i], nm[i]);
  S.prBatches = undefined; S.bkfold = undefined; S.tab = 'products'; renderTabs(); renderMainNow();
  for (let i = 0; i < 40 && !(S.prBatches || []).find((b) => b.id === 'gE'); i++) await new Promise((r) => setTimeout(r, 150));
  const a = await bkfTx({ t: 'new', name: '전체처리v1' }); await bkfTx({ t: 'put', fid: a.fid, gids: ids }); await bkfTx({ t: 'new', name: '두번째 묶음' }); return a.fid; };
const Wt = (p, ms) => p.waitForTimeout(ms);
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await Wt(p, 500);
  const f = await p.evaluate(async ([src, d]) => (eval('(' + src + ')'))(d), [SEED.toString(), new Date(Date.now() - 10 * 864e5).toISOString()]);
  for (let i = 0; i < 60; i++) { if (await p.evaluate((f) => !!(S.bkfold && S.bkfold.folds && S.bkfold.folds[f] && S.bkfold.folds[f].gids.length === 5), f)) break; await Wt(p, 150); }
  await p.evaluate(() => { try { localStorage.removeItem('rn-bkf-swfold'); } catch (_) {} });
  const open = async (w, h) => { await p.setViewportSize({ width: w, height: h }); await p.evaluate((f) => openBkfold(f), f);
    for (let i = 0; i < 60; i++) { if (await p.evaluate(() => !!document.getElementById('bkf_tb') && Object.keys(S._bkfTb || {}).length >= 3 && !!document.querySelector('#bkf_top .kbbtn') && !!document.querySelector('#bkf_top .pgdbtn'))) break; await Wt(p, 150); }
    await Wt(p, 300); };
  for (const w of [360, 768, 1280, 1920]) {
    await open(w, 560);
    const m = await p.evaluate((KEYS) => { const sh = document.getElementById('sheet'), top = document.getElementById('bkf_top'); const iw = innerWidth;
      const inTop = KEYS.filter((k) => top && top.querySelector(`[data-bkftool="${k}"]`)); const all = sh.querySelectorAll('[data-bkftool]').length;
      const kb = sh.querySelectorAll('.kbbtn').length, pg = sh.querySelectorAll('.pgdbtn').length, kbT = top ? top.querySelectorAll('.kbbtn').length : 0, pgT = top ? top.querySelectorAll('.pgdbtn').length : 0;
      const act = document.getElementById('bkf_act'); const old = !!(act && act.querySelector('[data-bkftool]')) || !!sh.querySelector('.bkf-tools');
      const outR = top ? [...top.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().right > iw + 1).map((b) => b.textContent) : ['맨 위 줄 없음'];
      const n = document.getElementById('bkf_topn');
      return { inTop, all, kb, pg, kbT, pgT, old, outR, topn: n ? n.textContent : null, zi: top ? getComputedStyle(top).zIndex : '', pos: top ? getComputedStyle(top).position : '', topH: top ? top.getBoundingClientRect().height : 0 }; }, KEYS);
    ok(m.inTop.length === 7 && m.all === 7, `폭 ${w}: 맨 위 줄에 단추 7개 한 벌(두 번 보이지 않음)`, m);
    ok(m.kbT === 1 && m.pgT === 1 && m.kb === 1 && m.pg === 1, `폭 ${w}: ⌨ 단축키·📖 설명서 = 맨 위 줄에 하나씩(맨 아래엔 없음)`, m);
    ok(!m.old, `폭 ${w}: 실행 카드 아래 옛 감시·전략 띠 없음`, m);
    ok(/결정 대기/.test(m.topn || ''), `폭 ${w}: 맨 위 줄 주의 숫자 한 줄`, m.topn);
    ok(m.pos === 'sticky' && +m.zi < 60, `폭 ${w}: 맨 위 줄 붙음 · z-index ${m.zi} < 안쪽 창 ✕`, m);
    ok(!m.outR.length, `폭 ${w}: 맨 위 줄 단추가 화면 안(좁으면 줄바꿈)`, m);
    if (w === 360) ok(m.topH > 60, '폭 360: 맨 위 줄이 여러 줄로 줄바꿈', m.topH);
    const kp = await p.evaluate(() => { const top = document.getElementById('bkf_top'); const iw = innerWidth; const C = [...top.querySelectorAll('#bkf_kpi [data-ctrlkpi]')]; const bk = top.querySelector('#back'), t1 = top.querySelector('[data-bkftool="watch"]'), t7 = top.querySelector('[data-bkftool="px"]');
      const R = (e) => (e ? e.getBoundingClientRect() : null); const tr = R(top), br = R(bk), r1 = R(t1), r7 = R(t7), kr = R(document.getElementById('bkf_kpi'));
      return { n: C.length, kinds: C.map((c) => c.dataset.ctrlkpi).join(), txt: C.map((c) => c.querySelector('.pxtb').textContent), out: C.filter((c) => R(c).right > iw + 1 || R(c).left < -1).length, nextToBack: !!(br && r1 && r1.left > br.right - 1 && r1.left - br.right < 16 && Math.abs(r1.top - br.top) < 8), kRight: kr ? tr.right - kr.right : null, kLeft: kr ? kr.left : null, t7R: r7 ? r7.right : null, sameRow: kr && r7 ? kr.top < r7.bottom : null, iw }; });
    ok(kp.n === 6 && kp.kinds === 'tot,top,low,view,sold,watch', `폭 ${w}: 맨 위 줄에 수치 카드 여섯(ctrlkpi2 감시 중 상품 수)`, kp);
    ok(kp.nextToBack, `폭 ${w}: 단추가 ← 닫기 바로 오른쪽부터`, kp);
    ok(!kp.out, `폭 ${w}: 카드가 화면 안`, kp);
    if (w >= 1280) ok(kp.kRight != null && kp.kRight <= 16, `폭 ${w}: 카드가 맨 위 줄 오른쪽 끝에 붙음`, kp);
    if (w === 1920) ok(kp.sameRow && kp.kLeft > kp.t7R, '폭 1920: 단추(왼쪽)와 카드(오른쪽)가 한 줄', kp);
    ok(/^[0-9]/.test(kp.txt[0] || ''), `폭 ${w}: 총 상품수 카드에 숫자`, kp.txt);
    const s = await p.evaluate(() => { const sh = document.getElementById('sheet'); const sc = document.getElementById('bkf_scr'); const pad = document.createElement('div'); pad.id = 't_pad'; pad.style.height = '2400px'; sc.appendChild(pad);
      sh.scrollTop = sh.scrollHeight; return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => { const top = document.getElementById('bkf_top'), csw = document.querySelector('#bkf_scr > .csw'); const R = sh.getBoundingClientRect(), a = top.getBoundingClientRect(), b = csw.getBoundingClientRect();
        const cx = Math.min(innerWidth - 4, b.left + 30), cy = b.top + Math.min(10, b.height / 2); const hit = document.elementFromPoint(cx, cy);
        r({ st: sh.scrollTop, topT: a.top - R.top, gap: b.top - a.bottom, cswIn: !!(hit && hit.closest('.csw')), iw: innerWidth, sw: document.documentElement.scrollWidth, shsw: sh.scrollWidth }); }))); });
    ok(s.st > 1500 && Math.abs(s.topT) <= 1.5, `폭 ${w}: 끝까지 내려도 맨 위 줄이 맨 위에 붙음`, s);
    ok(s.gap >= -2 && s.gap <= 2 && s.cswIn, `폭 ${w}: 묶음 고르기 줄이 맨 위 줄 바로 밑에 붙어 보임`, s);
    ok(s.sw <= s.iw && s.shsw <= s.iw + 1, `폭 ${w}: 문서·묶음 화면 가로 넘침 없음`, s);
  }
  // 접기/펼치기 — 기기에 기억
  await open(1280, 700);
  let fd = await p.evaluate(() => { const b = document.querySelector('#bkf_scr .csw [data-cswfold]'); if (!b) return null; b.click(); const c = document.querySelector('#bkf_scr .csw'); const r = c.querySelector('.csw-row'); let v = null; try { v = localStorage.getItem('rn-bkf-swfold'); } catch (_) {}
    return { fold: c.classList.contains('fold'), rowHid: getComputedStyle(r).display === 'none', fs: (c.querySelector('.csw-fs') || {}).textContent, txt: b.textContent, v }; });
  ok(fd && fd.fold && fd.rowHid && /전체처리v1/.test(fd.fs || '') && /펼치기/.test(fd.txt) && fd.v === '1', '▾ 접기 → 묶음 이름 한 줄로 줄어듦 · 기기에 기억(1)', fd);
  await open(1280, 700); fd = await p.evaluate(() => { const c = document.querySelector('#bkf_scr .csw'); return { fold: c.classList.contains('fold'), txt: c.querySelector('[data-cswfold]').textContent }; });
  ok(fd.fold && /펼치기/.test(fd.txt), '다시 열어도 접힌 채(기억)', fd);
  await p.evaluate(() => { const b = document.querySelector('[data-csw]:not([aria-selected="true"])'); if (b) b.click(); }); await Wt(p, 500);
  fd = await p.evaluate(() => { const c = document.querySelector('#bkf_scr .csw'); return { fold: c && c.classList.contains('fold') }; }); ok(fd.fold, '다른 묶음으로 바꿔도 접힌 채', fd);
  await p.evaluate((f) => bkfSwitch(f), f); await Wt(p, 400);
  fd = await p.evaluate(() => { const c = document.querySelector('#bkf_scr .csw'); c.querySelector('[data-cswfold]').click(); let v = null; try { v = localStorage.getItem('rn-bkf-swfold'); } catch (_) {} return { fold: c.classList.contains('fold'), row: getComputedStyle(c.querySelector('.csw-row')).display, v }; });
  ok(!fd.fold && fd.row !== 'none' && fd.v === '0', '▸ 펼치기 → 칩 줄이 다시 보임 · 기억(0)', fd);
  // 내린 채로 🎯 종합 비교·👀 조회수 분석 → 안쪽 창 → 뒤로 가기로 묶음
  for (const [k, d] of [['cmp', 'benchHub'], ['px', 'pxexp']]) {
    await open(1280, 700); await p.evaluate(() => { const sh = document.getElementById('sheet'); sh.scrollTop = sh.scrollHeight; });
    await p.evaluate((k) => document.querySelector(`#bkf_top [data-bkftool="${k}"]`).click(), k); await Wt(p, 900);
    let s = await p.evaluate(() => ({ win: document.getElementById('sheet').classList.contains('bkfwin'), x: !!document.getElementById('bkfwin_x'), det: Object.keys(S.detail || {}).join(), bkf: !!document.getElementById('bkf_scr') }));
    ok(s.win && s.x && s.det === d && !s.bkf, `「${k}」(내린 채로 누름) = 묶음 위 안쪽 창`, s);
    await p.goBack(); await Wt(p, 600);
    s = await p.evaluate(() => ({ win: document.getElementById('sheet').classList.contains('bkfwin'), bkf: !!document.getElementById('bkf_scr'), top: !!document.getElementById('bkf_top'), det: Object.keys(S.detail || {}).join() }));
    ok(!s.win && s.bkf && s.top && s.det === 'bkfold', `「${k}」 뒤로 가기 → 묶음 화면(맨 위 줄 그대로)`, s);
  }
  // ③ 수치 카드 — 숫자 맞음 · 누르면 안쪽 창 · Firestore 새 읽기 0
  await open(1280, 700);
  const kc = await p.evaluate(() => { const fid = S.detail.bkfold; const f = bkfNorm(S.bkfold, null).folds[fid]; const ks = new Set(), sk = new Set(); for (const g of f.gids) { const c = (S._bkfTb || {})[g]; if (!c || !c.cls) continue; for (const [k, t] of c.cls) if (!['sold', 'gone', 'trash'].includes(t)) ks.add(k); (c.sk || []).forEach((k) => sk.add(k)); }
    let reads = 0; const dc = db.collection; db.collection = function () { reads++; return dc.apply(this, arguments); }; S._ctrlKpi = null; let err = null; try { ctrlKpiPaint(); } catch (e) { err = String(e); } db.collection = dc;
    const C = [...document.querySelectorAll('#bkf_kpi [data-ctrlkpi]')].map((c) => c.querySelector('.pxtb').textContent); const sub = (document.querySelector('#bkf_kpi [data-ctrlkpi="sold"] .pxts') || {}).textContent || '';
    return { want: ks.size, sold: sk.size, C, sub, reads, err }; });
  ok(!kc.err && kc.C[0] === kc.want.toLocaleString('ko-KR') && kc.want > 0 && kc.sub.startsWith('🏷 생성 뒤 판매 탭 ' + kc.sold.toLocaleString('ko-KR') + '개 ·'), '총 상품수 = 상태판 그룹 상품 합(겹침 뺌) · 판매수 작은 글 「생성 뒤 판매」 = 생성후판매완료 합(겹침 뺌)', kc);
  ok(kc.reads === 0, '카드 셈이 Firestore를 새로 읽지 않음', kc);
  for (const k of ['tot', 'top', 'low', 'view', 'sold']) {
    const o = await p.evaluate((k) => { let reads = 0; const nm = []; const dc = db.collection; db.collection = function (c) { if (!/^(ctl_kpi_m|ctl_kpi_days|prd_price_batches)$/.test(String(c))) reads++; nm.push(String(c)); return dc.apply(this, arguments); }; const sh = document.getElementById('sheet'); sh.scrollTop = sh.scrollHeight;
      document.querySelector(`#bkf_kpi [data-ctrlkpi="${k}"]`).click(); db.collection = dc; const ov = document.getElementById('ctrl_kpi'); const tx = ov ? ov.textContent : '';
      const r = ov ? ov.querySelector('.bigask').getBoundingClientRect() : null;
      return { ov: !!ov, now: !!(ov && ov.querySelector('.ctrlkpi-now .pxtb')), src: /출처·기준/.test(tx), more: !!(ov && ov.querySelector(`[data-ctrlkpimore="${k}"]`)) && /📋 날마다 기록/.test(tx), nm, pxBtn: !!(ov && ov.querySelector('[data-ctrlkpigo="px"]')), inV: !!r && r.left >= 0 && r.right <= innerWidth + 1, reads, det: Object.keys(S.detail || {}).join(), bkf: !!document.getElementById('bkf_scr') }; }, k);
    ok(o.ov && o.now && o.src && o.more && o.inV && o.reads === 0 && o.det === 'bkfold' && o.bkf, `카드 「${k}」 누름 → 안쪽 창(지금 숫자·출처·기준·📋 날마다 기록) · 관제소는 그대로 · 다른 읽기 0(kpia1 판 D·E: 날마다 기록 달 문서·묶음 장부만 · 30분 메모)`, o);
    if (k === 'view') ok(o.pxBtn === !(await p.evaluate(() => !!(S._pxVwOn && S.px && S.px.vw))), '방문수 — 조회수 기록이 없으면 「👀 조회수 분석 열기」 단추', o);
    await p.keyboard.press('Escape'); await Wt(p, 150);
    const gone = await p.evaluate(() => ({ ov: !!document.getElementById('ctrl_kpi'), det: Object.keys(S.detail || {}).join(), bkf: !!document.getElementById('bkf_scr') }));
    ok(!gone.ov && gone.det === 'bkfold' && gone.bkf, `카드 「${k}」 창 Esc → 닫히고 관제소 그대로`, gone);
  }
  await p.evaluate(() => { document.querySelector('#bkf_kpi [data-ctrlkpi="top"]').click(); }); await Wt(p, 100);
  let cl = await p.evaluate(() => { document.querySelector('#ctrl_kpi .bigask-x').click(); return !!document.getElementById('ctrl_kpi'); }); ok(!cl, '✕ 누름 → 닫힘', cl);
  await p.evaluate(() => { document.querySelector('#bkf_kpi [data-ctrlkpi="low"]').click(); }); await Wt(p, 100);
  cl = await p.evaluate(() => { const ov = document.getElementById('ctrl_kpi'); ov.dispatchEvent(new MouseEvent('click', { bubbles: true })); return !!document.getElementById('ctrl_kpi'); }); ok(!cl, '바깥 누름 → 닫힘', cl);
  await p.evaluate(() => { try { localStorage.removeItem('rn-bkf-swfold'); } catch (_) {} });
  ok(!dlg.length, '브라우저 창(alert·confirm·prompt) 한 번도 안 뜸', dlg);
  console.log(bad ? `❌ tBKFTOP1119 ${bad}개 실패` : '✓ tBKFTOP1119 통과'); return bad; });
