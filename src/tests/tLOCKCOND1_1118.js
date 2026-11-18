// tLOCKCOND1_1118 — (11/18 일꾼 lockcond1 · 정범님 I-1118-1417-15.3) 잠금 단추가 없던 카드·줄 모두에 🔓/🔒 단추
//   ① 작은 단추(plkMini) — 줄(button.item) 안에 넣어도 되게 span · 다시 그리기(plkPaint)가 작은 모양을 지킴 · Enter/Space로도 누름
//   ② 등록 페이지 — 📋 한눈에 줄·🔎 자세히 카드에 단추 · 알라딘에 올라간(live) 상품만 · 예스24 카드(_y24v)는 그 카드 자체 단추를 씀
//   ③ 수동 일괄(한눈에 줄·팔림 카드)·예스24 카드·조회수 실험·관찰·가격 결정·상품 고침 카드·상품 줄(button.item 13곳)·표(상품 전체·예스24 상품 전체·시장 지표)에 단추
// 실행: node src/tests/tLOCKCOND1_1118.js · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || path.resolve(__dirname, '..', 'app.html');
const T = fs.readFileSync(APP, 'utf8');
const fnIn = (S, name, pre) => { const i = S.indexOf((pre || 'function ') + name + '('); if (i < 0) throw new Error('함수 없음 ' + name); let d = 0; const k = S.indexOf('{', i); for (let j = k; j < S.length; j++) { if (S[j] === '{') d++; else if (S[j] === '}') { d--; if (!d) return S.slice(i, j + 1); } } return S.slice(i); };
const line = (re) => T.split('\n').filter((x) => re.test(x));

console.log('① 작은 잠금 단추');
const mini = fnIn(T, 'plkMini'); const innerM = fnIn(T, 'plkInnerM');
ok(/<span role="button" tabindex="0" class="plk-c plk-m/.test(innerM) && !/<button/.test(innerM), '작은 단추는 span(role=button) — 줄 단추 안에 단추를 넣지 않음');
ok(/data-plkm="1"/.test(mini) && /data-plkx=/.test(mini), '작은 단추 겉에 data-plkx·data-plkm');
ok(/el\.dataset\.plkm \? plkInnerM\(k\) : plkInner\(k\)/.test(fnIn(T, 'plkPaint')), '다시 그리기(plkPaint)가 작은 모양을 지킴');
ok(/span\[data-plk\]/.test(T) && /plkToggle\(t\)/.test(T), 'Enter/Space로도 잠금(키 누름)');
{ // 실제로 그려 봄
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const M = new Map([['aladin_9', { on: true }]]);
  const cut = (a, b) => T.slice(T.indexOf(a), T.indexOf(b)); /* (판 ②) 작은 단추가 쓰는 갈래·풀이 도움 글 */
  const H = cut('const PLK_ML =', '/* 저장할 조건만 골라 냄') + cut('const PLK_TIP =', 'function plkChip(');
  const f = new Function('esc', 'plkMap', 'plkWatch', 'plkSig', H + '\n' + innerM + '\n' + mini + '\nreturn plkMini;')(esc, () => M, () => {}, () => 's');
  ok(/🔒/.test(f({ id: 'aladin_9' })) && /plk-m on/.test(f({ id: 'aladin_9' })), '잠긴 상품 → 🔒');
  ok(/🔓/.test(f({ id: 'aladin_1' })) && !/ on"/.test(f({ id: 'aladin_1' })), '안 잠긴 상품 → 🔓');
  ok(f({}) === '' && f(null) === '', '상품 키가 없으면 그리지 않음');
}

console.log('② 등록 페이지');
const rk = fnIn(T, 'regPlkKey');
const regPlkKey = new Function('S', rk + '\nreturn regPlkKey;')({ regCmds: new Map([['c1', { results: { i1: { usedCode: '555', state: 'live' }, i2: { usedCode: '556', state: 'fail' } } }]]) });
ok(regPlkKey({ id: 'i1', cmdId: 'c1' }) === 'aladin_555', '올라간 상품 → aladin_<상품 번호>');
ok(regPlkKey({ id: 'i2', cmdId: 'c1' }) === '', '올리지 못한 상품 → 단추 없음');
ok(regPlkKey({ id: 'i3' }) === '', '아직 안 올린 상품 → 단추 없음(잠글 상품이 없음)');
ok(regPlkKey({ id: 'i1', cmdId: 'c1', _y24v: 1 }) === '', '예스24 카드 줄은 그 카드 자체 단추를 씀(겹치지 않음)');
ok(regPlkKey({ id: 'i4', result: { usedCode: '777' } }) === 'aladin_777', '결과가 줄에 붙어 있어도 읽음');
ok(/regPlkChip\(it, 1\)/.test(fnIn(T, 'regRowX')), '📋 한눈에 줄에 작은 단추');
ok(/regPlkChip\(it\) \+ regAlChip\(it\)/.test(fnIn(T, 'regCardX')), '🔎 자세히 카드에 단추');

console.log('③ 그 밖 카드·줄·표');
ok(/<div class="bqc-c">\$\{plkChip\(\{ \.\.\.l, id: l\.id \|\| 'aladin_' \+ l\.usedCode \}\)\}/.test(T), '수동 일괄 📋 한눈에 줄');
ok(/card pq bqsr[\s\S]{0,400}plkChip\(\{ \.\.\.l, id: l\.id \|\| 'aladin_' \+ l\.usedCode \}\)/.test(T), '수동 일괄 팔림 카드');
ok(/l && l\.id \? plkChip\(l\) : ''/.test(fnIn(T, 'y24CardHtml')), '예스24 카드');
ok(/plkChip\(a\)/.test(fnIn(T, 'bqUpCardHtml')), '상품 고침 카드(bqUpCardHtml)');
ok(/l \? plkChip\(l\) : ''/.test(fnIn(T, 'pxCardHtml')), '조회수 실험 카드');
ok(/plkChip\(l\)/.test(fnIn(T, 'obsCard')), '관찰 카드');
ok(/x\.key \? plkChip\(\{ id: x\.key \}\) : ''/.test(T), '가격 결정 카드');
const items = line(/<button class="item" data-pid="\$\{esc\((x|l|x\.l|r\.l)\.id\)\}"><span>/);
ok(items.length >= 13 && items.every((x) => /<button class="item" data-pid="\$\{esc\((x|l|x\.l|r\.l)\.id\)\}"><span>[^`]{0,80}plkMini\(/.test(x)), '상품 줄(button.item data-pid) 모두에 작은 단추', items.filter((x) => !/plkMini/.test(x)).map((x) => x.trim().slice(0, 120)));
ok(line(/<li data-pid="\$\{esc\(l\.id\)\}"><span>\$\{plkMini\(l\)\}/).length >= 2, '홈 칸 줄');
ok(/regDoneHtml\(r\.ch\)\} \$\{plkMini\(r\.l\)\}<b>/.test(T), '📚 상품 전체 표');
ok(/r\.x\.goodsNo \? plkMini\(\{ id: 'yes24_' \+ r\.x\.goodsNo \}\) : ''/.test(T), '🟦 예스24 상품 전체 표(yes24_<상품 번호>)');
ok(/item cxrow[^`]{0,120}plkMini\(x\.l\)/.test(T), '세트·짝 줄(cxrow)');
// 남은 곳 없게 — usedBtn(상품 단추)을 그리는 줄은 잠금 단추도 그림(옛 죽은 함수 prodRowOld·상품 단추가 링크만인 줄은 빼고)
{
  const dead = fnIn(T, 'prodRowOld');
  const miss = T.replace(dead, '').split('\n').filter((x) => /<(button|div|li) class="item[^"]*"[^>]*><span>[^`]{0,200}usedBtn\((l|x\.l|r\.l)\)/.test(x) && !/plkMini|plkChip/.test(x));
  ok(miss.length === 0, '상품 줄 가운데 잠금 단추가 빠진 곳 없음', miss.map((x) => x.trim().slice(0, 140)));
}
if (!process.env.RN_PORT) { console.log(bad ? `❌ ${bad}개 실패` : '✓ tLOCKCOND1_1118 통과 (화면 시험은 RN_PORT가 있을 때)'); process.exit(bad ? 1 : 0); }
console.log('④ 화면(가짜 클라우드 · 지어낸 책 · 배율 1)');
const SHOT = process.env.RN_SHOT || ''; const shot = async (p, n, sel) => { if (SHOT) { if (sel) await p.evaluate((q) => { const e = document.querySelector(q); if (e) e.scrollIntoView({ block: 'start' }); }, sel); await p.waitForTimeout(150); fs.mkdirSync(SHOT, { recursive: true }); await p.screenshot({ path: path.join(SHOT, n + '.png') }); } };
require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
  await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
  /* 수동 일괄 📋 한눈에 */
  await p.evaluate(async () => { const now = new Date().toISOString(); const L = [...S.plist.values()].filter((l) => l.active).slice(0, 6);
    S.batchRes = L.map((l, j) => ({ l, target: l.price - 300 * (j + 1), reasons: ['시험'], page1: [], at: now, out: false })); S.batchId = 'bL'; S.prBatches = [{ id: 'bL', name: '잠금 단추 시험' }];
    S.batchSt = { start: {}, picks: {}, decided: {}, held: {}, trashed: {}, added: {} }; S.batchEdit = {}; S.batchMeta = {}; S.batchT = 'sel'; S._bFresh = true; S.batchSub = 'all'; S.bqOpen = new Set(); S.bqAddQ = '';
    try { localStorage.setItem('rn-bq-view', 'compact'); } catch (e) {} openBatch(JSON.parse(JSON.stringify({ ...BATCH_DEF, name: '잠금 단추 시험' }))); await new Promise((r) => setTimeout(r, 700)); });
  const bq = await p.evaluate(() => { const rows = [...document.querySelectorAll('#sheet .bqc')]; return { n: rows.length, withBtn: rows.filter((r) => r.querySelector('[data-plk]')).length, dup: rows.filter((r) => r.querySelectorAll('[data-plk]').length > 1).length }; });
  ok(bq.n > 0 && bq.withBtn === bq.n && bq.dup === 0, '수동 일괄 📋 한눈에 줄마다 잠금 단추 하나씩', bq);
  await shot(p, '1_수동일괄_한눈에', '#sheet .bqc');
  /* 누르면 잠기고 줄은 펼쳐지지 않음 */
  const k0 = await p.evaluate(() => { const b = document.querySelector('#sheet .bqc [data-plk]'); const k = b.dataset.plk; b.click(); return k; }); await p.waitForTimeout(500);
  const af = await p.evaluate((k) => ({ on: !!(plkMap().get(k) || {}).on, open: !!(S.bqOpen && S.bqOpen.has(k)), btn: (document.querySelector(`#sheet .bqc [data-plk="${k}"]`) || {}).textContent || '' }), k0);
  ok(af.on && !af.open && /🔒/.test(af.btn), '한눈에 줄의 단추를 누르면 잠김 · 줄은 안 펼쳐짐', af);
  await shot(p, '2_수동일괄_한눈에_잠금', '#sheet .bqc');
  /* 📚 상품 전체 표 — 작은 단추 */
  await p.evaluate(async () => { openProdAll(); await new Promise((r) => setTimeout(r, 900)); });
  const tb = await p.evaluate(() => { const m = [...document.querySelectorAll('#sheet [data-plkm]')]; return { n: m.length, on: m.filter((x) => /🔒/.test(x.textContent)).length, btn: m.filter((x) => x.querySelector('button')).length }; });
  ok(tb.n >= 5 && tb.on >= 1 && tb.btn === 0, '📚 상품 전체 표에 작은 단추(잠긴 상품은 🔒 · 진짜 button 아님)', tb);
  const sh0 = await p.evaluate(() => JSON.stringify(Object.keys(S.detail || {})) + ':' + ((S.detail && S.detail.bigTable) || ''));
  const k1 = await p.evaluate(() => { const m = [...document.querySelectorAll('#sheet [data-plkm] [data-plk]')].find((x) => /🔓/.test(x.textContent)); m.click(); return m.dataset.plk; }); await p.waitForTimeout(500);
  const af2 = await p.evaluate((k) => ({ on: !!(plkMap().get(k) || {}).on, mini: !!document.querySelector(`#sheet [data-plkm] [data-plk="${k}"].plk-m`), sh: JSON.stringify(Object.keys(S.detail || {})) + ':' + ((S.detail && S.detail.bigTable) || '') }), k1);
  ok(af2.on && af2.mini && af2.sh === sh0, '작은 단추를 누르면 잠기고 다시 그려도 작은 모양 · 상품 상세로 넘어가지 않음', { ...af2, sh0 });
  await shot(p, '3_상품전체_표_작은단추', '#sheet [data-plkm]');
  ok(dlg.length === 0, '브라우저 팝업 0', dlg);
}, { vp: { width: 1280, height: 900 } }).then(() => { console.log(bad ? `❌ ${bad}개 실패` : '✓ tLOCKCOND1_1118 통과'); process.exit(bad ? 1 : 0); });
