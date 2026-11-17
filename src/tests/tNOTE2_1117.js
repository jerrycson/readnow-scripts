// tNOTE2_1117 — (정범님 11/17 I-1117-2027-23 · 일꾼 note2) 📝 상품 카드 「유의 사항」 단추
//  ① 코드 꼴: 상품 목록 카드·상품 상세·수동 일괄·등록·출고·알라딘 매입 카드가 모두 같은 함수(noteRow·noteCtl)를 씀 · 브라우저 창 없음
//  ② 판본 낱말(사인본·친필·서명·넘버링·한정…) 찾기(noteEdHits) — 「동방신기 정규 8집」처럼 유의 사항에만 '사인본'이 있는 경우
//  ③ 수집기: 로거(공개 전용)는 받지 않음 · 등록 PC(MJ-MAIN)는 사람이 누른 유의 사항 일을 다른 일반 PC가 살아 있으면 비켜 줌(없으면 예전처럼 받음) · 자동 '중' 다시 읽기는 그대로
//  ④ 화면: 저장된 글은 단추 없이 바로(첫 줄만 · 펼치기) + 읽은 때 + ✍ 판본 표시 → 📝 누름 = shp_cmds/ui_<상품 번호>(usedInfo · manual) 맡김 → PC가 받음(읽는 중) → 끝나면 prd_used_info 글이 그 자리에
// 실행: cd pw && RN_PORT=<포트> node tNOTE2_1117.js (harness.js·seed.js 옆) · RN_PORT가 없으면 ①~③만 · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0, nOk = 0; const ok = (c, m, x) => { nOk++; if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 700)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const COL = [path.resolve(__dirname, '..', 'readnow-collector.user.js'), path.resolve(__dirname, '..', 'readnow-collector.src.js'), path.resolve(__dirname, '..', '..', 'src', 'readnow-collector.src.js')].find((x) => fs.existsSync(x));
const CLOUD = [path.resolve(__dirname, '..', 'cloud', 'index.js'), path.resolve(__dirname, '..', '..', 'cloud', 'index.js')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const K = fs.readFileSync(COL, 'utf8');
const fnSrc = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; let d = 0, j = src.indexOf('{', i); for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (!d) break; } } return src.slice(i, j + 1); };

console.log('① 코드 꼴 — 한 함수를 모든 카드에');
ok(['noteEdRe', 'noteEdHits', 'noteTxt', 'noteCtl', 'noteRow', 'noteRowIn', 'noteLoad', 'noteRefresh', 'noteAsk', 'noteWatch'].every((f) => T.includes('function ' + f + '(')), '공용 함수 10개(noteRow·noteCtl·noteAsk·noteWatch …)');
ok(/\$\{whoLine\(b\)\}\$\{noteRow\(l\)\}/.test(fnSrc(T, 'prodCard2')), '상품 목록 카드(prodCard2)에 📝 줄');
ok(/\$\{noteRow\(l\)\}/.test(fnSrc(T, 'pedCardHtml')), '상품 상세 카드(pedCardHtml)에 📝 줄');
ok((fnSrc(T, 'bqUiHtml').match(/noteCtl\(lid/g) || []).length >= 2, '수동 일괄 카드(bqUiHtml) 유의 사항 칸에 📝 단추(글 있을 때·없을 때)');
{ const i = T.indexOf('const regLQ = '); ok(i > 0 && /noteCtl\(lid, l\.grade/.test(T.slice(i, T.indexOf('\n', i))), '등록 화면 재고 줄(regLQ)에 📝 단추'); }
ok((T.match(/noteCtl\(String\(it\.listingId \|\| ''\), gr, u/g) || []).length >= 2, '출고 주문 상품(글 있음·못 읽음)에 📝 단추');
ok(/noteCtl\(String\(l\.listingId\), l\.grade/.test(fnSrc(T, 'bbuyCard')), '알라딘 매입 카드(bbuyCard)에 📝 단추');
{ const blk = ['noteCtl', 'noteRowIn', 'noteAsk', 'noteWatch', 'noteLoad', 'noteRefresh'].map((f) => fnSrc(T, f)).join('\n'); ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(blk) && !/01[016789]-?\d{3,4}-?\d{4}/.test(blk), '새 덩어리에 브라우저 창·전화 번호 꼴 없음');
  ok(/collection\('shp_cmds'\)\.doc\('ui_' \+ lid\)/.test(blk) && /type: 'usedInfo', listingIds: \[lid\]/.test(blk) && /manual: 1/.test(blk) && /status: 'queued'/.test(blk), '📝 누름 = 시장 지표 갱신처럼 맡긴 일 대기열(shp_cmds/ui_<상품 번호> · usedInfo · manual)');
  ok(/collection\('prd_used_info'\)/.test(blk) && !/prd_used_info'\)\.doc\([^)]*\)\.(set|update)/.test(blk) && !/plist|prd_listings/.test(fnSrc(T, 'noteAsk')), '웹앱은 prd_used_info를 읽기만(쓰지 않음) · 상품 값 안 바꿈'); }

console.log('② 판본 낱말 찾기(noteEdHits)');
{ const f = new Function(fnSrc(T, 'noteEdRe') + '\n' + fnSrc(T, 'noteEdHits') + '\nreturn noteEdHits;')();
  const h1 = f('★사인본★ 멤버 전원 친필 사인 · 케이스 모서리 약간 눌림'); ok(h1.includes('사인본') && h1.includes('친필'), '「사인본·친필」을 찾음(동방신기 정규 8집 같은 경우)', h1);
  const h2 = f('한정판 넘버링 0123 / 리미티드'); ok(h2.includes('한정판') && h2.includes('넘버링') && h2.includes('리미티드'), '「한정판·넘버링·리미티드」', h2);
  const h3 = f('사인 본 있음'); ok(h3.length >= 1, '띄어 쓴 「사인 본」도', h3);
  ok(f('모서리 눌림 · 밑줄 약간 · 서가 보관').length === 0 && f('').length === 0, '보통 유의 사항에는 표시 없음'); }

console.log('③ 수집기 — 누가 받나');
{ const a = K.indexOf("  const PCROLE_DEF = { 'MJ-MAIN': 'reg' };"); const b = K.indexOf('\n', K.indexOf('  const regPcOther = '));
  ok(a > 0 && b > a && K.slice(a, b).includes('const genPcOther = '), '등록 PC 비켜 주기(genPcOther) 줄이 있음');
  const run = (pc, cmd, beats, pub) => new Function('PC_NAME', 'BEATS', 'PUBONLY', K.slice(a, b) + '\nreturn regSkipCmd;')(pc, beats, !!pub)(cmd.type, cmd);
  const now = Date.now(); const alive = (n, o) => ({ [n]: { atMs: now - 20e3, ok: true, paused: false, ...(o || {}) } });
  const man = { type: 'usedInfo', manual: 1, dev: 'MJ-MAIN', listingIds: ['1'] }; const auto = { type: 'usedInfo', listingIds: ['1'], grade: '중' };
  ok(run('MJ-MAIN', man, { pcs: { ...alive('MJ-MAIN'), ...alive('HOME') } }) === true, '등록 PC(MJ-MAIN)는 사람이 누른 유의 사항 일을 비켜 줌(다른 일반 PC HOME이 살아 있음 · MJ-MAIN에서 눌렀어도)');
  ok(run('MJ-MAIN', man, { pcs: { ...alive('MJ-MAIN') } }) === false, '다른 일반 PC가 없으면 등록 PC가 예전처럼 받음(일이 묶이지 않음)');
  ok(run('MJ-MAIN', man, { pcs: { ...alive('MJ-MAIN'), ...alive('LOGGER', { pubOnly: true, ok: false }) } }) === false, '살아 있는 것이 로거(공개 전용)뿐이면 로거는 셈에 안 넣음 — 등록 PC가 받음');
  ok(run('MJ-MAIN', man, { pcs: { ...alive('MJ-MAIN'), HOME: { atMs: now - 10 * 60e3, ok: true } } }) === false, '신호가 3분 넘게 끊긴 PC는 셈에 안 넣음');
  ok(run('MJ-MAIN', man, { pcs: { ...alive('MJ-MAIN'), ...alive('HOME', { paused: true, ok: false }) } }) === false, '일시정지한 PC는 셈에 안 넣음');
  ok(run('MJ-MAIN', auto, { pcs: { ...alive('MJ-MAIN'), ...alive('HOME') } }) === false, "자동 '중' 다시 읽기(manual 없음)는 예전 그대로");
  ok(run('HOME', man, { pcs: { ...alive('MJ-MAIN'), ...alive('HOME') } }) === false, '일반 PC(HOME)는 그대로 받음');
  ok(run('MJ-MAIN', { type: 'metrics', keys: [] }, { pcs: { ...alive('HOME') } }) === true, '시장 지표 큰 일 비켜 주기(예전 규칙)는 그대로');
  const pcb = K.slice(K.indexOf('  const pcCanBase = '), K.indexOf('\n', K.indexOf('  const pcCanBase = ')));
  ok(/^\s*const pcCanBase = \(type, x\) => \{ if \(PUBONLY\) return false;/.test(pcb), '로거(공개 전용 PC)는 맡긴 일을 받지 않음(pcCanBase 맨 앞)');
  const pub = (K.match(/const PUB_CMDS = new Set\(\[([^\]]*)\]\)/) || [])[1] || ''; ok(pub && !/usedInfo/.test(pub), '유의 사항 일(usedInfo)은 공개(비로그인) 일 목록에 없음 — 로거가 우리 매물 화면을 열지 않음', pub);
  ok(/v\.type === 'usedInfo'\) \{ const results = \{\};[\s\S]{0,600}readOurUsed\(lid, v\.grade \|\| null, prev\)[\s\S]{0,400}status: 'done', results, doneAt: nowIso\(\), by: PC_NAME/.test(K), 'PC가 받으면 readOurUsed로 읽어 prd_used_info에 저장 → 끝(done · doneAt · by = PC 이름)');
  if (CLOUD) { const C = fs.readFileSync(CLOUD, 'utf8'); ok(/usedInfo/.test(C), '클라우드도 같은 일(usedInfo)을 앎(PC가 없을 때 받쳐 줌)'); } }

(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tNOTE2_1117 ${bad}개 실패` : '✓ tNOTE2_1117 코드 꼴 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  const H = require(path.join(process.cwd(), 'harness.js')); const SEED = require(path.join(process.cwd(), 'seed.js'));
  const run = (vp, tag) => H(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
    await p.evaluate(SEED); await p.waitForTimeout(400); await p.addStyleTag({ content: '#seenp{display:none!important}.mkpanel,[class*=mktoast],.dlq,#dlq{display:none!important}' });
    console.log(`④ 화면 ${tag}`);
    await p.evaluate(async () => { S.user = S.user || { email: 'tester@example.com' }; S.uinfo = new Map(); S.noteW = null; S._noteNo = null; S._noteAsked = null; S._noteQ = null; S._noteOpen = null;
      await db.collection('prd_used_info').doc('404935000').set({ __id: '404935000', listingId: '404935000', note: '★사인본★ 멤버 전원 친필 사인\n케이스 모서리 약간 눌림 · 속지 깨끗', hasNote: true, photos: [], checkedAt: '2026-11-17T10:05:00.000Z' });
      const L = [...S.plist.values()]; const box = document.createElement('div'); box.id = 'tn2'; box.style.cssText = 'position:relative;z-index:5;background:#fff;max-width:900px'; box.innerHTML = prodCard2(L[0]) + prodCard2(L[1]) + prodCard2(L[3]); document.body.prepend(box); window.scrollTo(0, 0); });
    await p.waitForTimeout(1600);
    const c0 = await p.evaluate(() => { const r = (lid) => { const e = document.querySelector(`#tn2 .rnnote[data-nlid="${lid}"]`); return e ? { t: (e.querySelector('.rnn-t') || {}).textContent || '', ed: (e.querySelector('.rnn-ed') || {}).textContent || '', at: (e.querySelector('.rnn-at') || {}).textContent || '', btn: (e.querySelector('[data-nask]') || {}).textContent || '', more: !!e.querySelector('[data-nmore]'), all: e.textContent } : null; }; return { a: r('404935000'), b: r('404935001'), u: S.uinfo.has('404935000') }; });
    ok(c0.a && /사인본★ 멤버 전원 친필 사인/.test(c0.a.t) && !/케이스/.test(c0.a.t), '저장된 유의 사항은 단추를 누르지 않아도 바로 보임 — 첫 줄만', c0);
    ok(c0.a && /사인본/.test(c0.a.ed) && /친필/.test(c0.a.ed), '✍ 판본 표시(사인본·친필)', c0.a);
    ok(c0.a && /읽은 때 11\/17 19:05/.test(c0.a.at), '읽은 때(prd_used_info.checkedAt · 한국 시각)', c0.a);
    ok(c0.a && c0.a.more && /다시 읽기/.test(c0.a.btn), '「펼치기」 · 단추는 「📝 유의 사항 다시 읽기」', c0.a);
    ok(c0.b && /저장된 유의 사항 글 없음/.test(c0.b.all) && /📝\s*유의 사항$/.test(c0.b.btn.trim()), '저장된 기록이 없는 상품 — 「저장된 유의 사항 글 없음」 + 「📝 유의 사항」', c0.b);
    await p.click('#tn2 .rnnote[data-nlid="404935000"] [data-nmore]'); await p.waitForTimeout(300);
    const c1 = await p.evaluate(() => { const e = document.querySelector('#tn2 .rnnote[data-nlid="404935000"]'); const t = e.querySelector('.rnn-t'); return { t: t.textContent, open: t.classList.contains('open'), m: e.querySelector('[data-nmore]').textContent, det: !!S.detail }; });
    ok(c1.open && /케이스 모서리/.test(c1.t) && c1.m === '접기' && !c1.det, '「펼치기」 = 전체 글 · 「접기」로 바뀜 · 상품 화면이 열리지 않음', c1);
    // 📝 누름 → 맡김
    await p.click('#tn2 .rnnote[data-nlid="404935001"] [data-nask]'); await p.waitForTimeout(700);
    const q = await p.evaluate(() => { const c = (window.__FS.shp_cmds || {}).ui_404935001; const e = document.querySelector('#tn2 .rnnote[data-nlid="404935001"]'); return { c, me: (S.user || {}).email, st: (e.querySelector('.rnn-st') || {}).textContent || '', dis: e.querySelector('[data-nask]').disabled, det: !!S.detail }; });
    ok(q.c && q.c.type === 'usedInfo' && q.c.status === 'queued' && q.c.manual === 1 && JSON.stringify(q.c.listingIds) === '["404935001"]' && q.c.grade === '상' && q.c.cloudTried === false && !!q.c.by && q.c.by === q.me, '📝 누름 = shp_cmds/ui_404935001 맡김(usedInfo · manual · 등급 상 · 클라우드 아직)', q.c);
    ok(/맡김 .*비어 있는 사무실 PC가 받으면 바로 읽음/.test(q.st) && q.dis && !q.det, '카드에 「맡김 — 비어 있는 사무실 PC가 받으면 바로 읽음」 · 단추 잠김 · 상품 화면 안 열림', q);
    const c0at = q.c && q.c.createdAt;
    await p.evaluate(() => noteAsk('404935001', '상')); await p.waitForTimeout(400);
    ok(await p.evaluate((a) => (window.__FS.shp_cmds.ui_404935001 || {}).createdAt === a, c0at), '이미 대기 중이면 다시 눌러도 새로 맡기지 않음(덮지 않음)');
    // PC가 받음 → 읽는 중
    await p.evaluate(() => db.collection('shp_cmds').doc('ui_404935001').set({ status: 'running', claim: { pc: 'HOME', at: new Date().toISOString() } }, { merge: true })); await p.waitForTimeout(500);
    const r1 = await p.evaluate(() => (document.querySelector('#tn2 .rnnote[data-nlid="404935001"] .rnn-st') || {}).textContent || '');
    ok(/HOME가 읽는 중 — 보통 30초 안/.test(r1), '받은 PC 이름과 함께 「HOME가 읽는 중 — 보통 30초 안」', r1);
    // PC가 읽어 저장 → 끝
    await p.evaluate(async () => { const now = new Date().toISOString(); await db.collection('prd_used_info').doc('404935001').set({ __id: '404935001', listingId: '404935001', note: '한정판 넘버링 0123\n띠지 있음', hasNote: true, photos: [], checkedAt: now });
      await db.collection('shp_cmds').doc('ui_404935001').set({ status: 'done', results: { 404935001: { ok: true, note: true, at: now } }, doneAt: now, by: 'HOME' }, { merge: true }); }); await p.waitForTimeout(900);
    const r2 = await p.evaluate(() => { const e = document.querySelector('#tn2 .rnnote[data-nlid="404935001"]'); return { t: (e.querySelector('.rnn-t') || {}).textContent || '', ed: (e.querySelector('.rnn-ed') || {}).textContent || '', st: (e.querySelector('.rnn-st') || {}).textContent || '', at: (e.querySelector('.rnn-at') || {}).textContent || '', dis: e.querySelector('[data-nask]').disabled, u: S.uinfo.get('404935001') }; });
    ok(/한정판 넘버링 0123/.test(r2.t) && !/띠지/.test(r2.t) && r2.u && r2.u.note, '끝나면 읽은 글이 그 자리에 바로(첫 줄) — 저장 칸 prd_used_info.note', r2);
    ok(/한정판/.test(r2.ed) && /넘버링/.test(r2.ed) && /HOME .*에 읽음/.test(r2.st) && /읽은 때/.test(r2.at) && !r2.dis, '✍ 한정판·넘버링 · 「HOME … 에 읽음」 · 읽은 때 · 단추 다시 눌림', r2);
    // 기록이 없던 상품 — 그 사이 다른 PC가 읽어 저장했으면 10분 뒤 화면이 다시 그려질 때 저절로 보임(한 번 없다고 끝까지 안 읽지 않음)
    const tl = await p.evaluate(async () => { const lid = String([...S.plist.values()][3].listingId); const e = () => document.querySelector(`#tn2 .rnnote[data-nlid="${lid}"]`).textContent; const a = e();
      await db.collection('prd_used_info').doc(lid).set({ __id: lid, listingId: lid, note: '친필 서명본', hasNote: true, photos: [], checkedAt: new Date().toISOString() });
      noteRefresh(lid); await new Promise((r) => setTimeout(r, 1200)); const b = e(); S._noteAsked.set(lid, Date.now() - 11 * 60e3); noteRefresh(lid); await new Promise((r) => setTimeout(r, 1500)); return { a, b, c: e() }; });
    ok(/저장된 유의 사항 글 없음/.test(tl.a) && !/친필 서명본/.test(tl.b) && /친필 서명본/.test(tl.c) && /✍/.test(tl.c), '기록 없던 상품은 바로 다시 읽지 않고(읽기 줄임) 10분 뒤 다시 그려질 때 한 번 더 읽음', tl);
    // 못 읽음 길
    await p.evaluate(() => { S.noteW.delete('404935002'); }); await p.evaluate(() => noteAsk('404935002', '중')); await p.waitForTimeout(400);
    await p.evaluate(() => db.collection('shp_cmds').doc('ui_404935002').set({ status: 'done', results: { 404935002: { ok: false, why: '판매 화면에 유의 사항 칸 없음' } }, doneAt: new Date().toISOString(), by: 'HOME' }, { merge: true })); await p.waitForTimeout(700);
    ok(await p.evaluate(() => (S.noteW.get('404935002') || {}).st === 'fail' && /유의 사항 칸 없음/.test(S.noteW.get('404935002').why)), "못 읽으면 「못 읽음 — 까닭」(조용히 끝나지 않음)");
    // 다른 카드들도 같은 단추
    const o = await p.evaluate(() => { const L = [...S.plist.values()]; const l = L[0]; const ui = S.uinfo.get(String(l.listingId)); let ped = '', bq = '', rg = ''; try { ped = pedCardHtml(l); } catch (e) { ped = 'ERR ' + e.message; } try { bq = bqUiHtml(String(l.listingId), ui); } catch (e) { bq = 'ERR ' + e.message; } try { rg = regLQ(l); } catch (e) { rg = 'ERR ' + e.message; } return { ped: /class="rnnote"/.test(ped) && /data-nask="404935000"/.test(ped), bq: /data-nask="404935000"/.test(bq) && /✍/.test(bq), rg: /data-nask="404935000"/.test(rg), err: [ped, bq, rg].filter((x) => /^ERR/.test(x)) }; });
    ok(o.ped && o.bq && o.rg && !o.err.length, '상품 상세·수동 일괄·등록 줄에도 같은 📝 단추(✍ 표시 포함)', o);
    if (vp.width < 500) { const ov = await p.evaluate(() => [...document.querySelectorAll('#tn2 .rnnote, #tn2 .rnnote *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1; }).length); ok(ov === 0, '휴대폰 폭에서 📝 줄이 화면 밖으로 넘치지 않음', ov); }
    ok(!dlg.length, '브라우저 팝업(alert·confirm·prompt) 없음', dlg);
  }, { vp });
  const n0 = nOk; await run({ width: 1400, height: 900 }, 'pc'); const n1 = nOk; await run({ width: 390, height: 844 }, 'phone');
  ok(n1 - n0 >= 16 && nOk - n1 >= 17, '화면 시험이 끝까지 돌았음(웹앱을 못 열어 건너뛴 것이 아님)', { pc: n1 - n0, phone: nOk - n1 });
  console.log(bad ? `❌ tNOTE2_1117 ${bad}개 실패` : '✓ tNOTE2_1117 모두 통과'); process.exit(bad ? 1 : 0);
})();
