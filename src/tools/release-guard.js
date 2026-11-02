/* release-guard.js — release.js가 판을 만들 때마다 부르는 두 검사 (정범님 지시 2026-11-02 · 늘)
 *  ① 📱 휴대폰 반영(실패 = 빌드 멈춤): "새 탭·기능이 생기거나 기존 것이 개선되면 반드시 휴대폰에도 반영하고 고르기에도 선택지로 포함"
 *     - 탭 줄(renderTabs)의 모든 탭 → 휴대폰 고르기(THIN_SEC)에 있거나, 고르기 없이 휴대폰도 PC와 같은 화면인 탭(PLAIN · 이유 적음)
 *     - 탭 화면의 섹션(sec('id' …))·카드 거름(ptOn·puSecOn)·섹션 밖 카드(THIN_X) id → 그 탭의 고르기 항목에 있음
 *     - 고르기 항목 → 코드 어디선가 실제로 쓰임(죽은 항목 없음)
 *     - 코드에서 셀 수 없는 '섹션 밖 카드'는 동작 검사 tests/tTHIN.js(Playwright)가 PC ↔ 휴대폰(☑ 모두 체크)로 견줌
 *  ② 📖 자동 갱신(경고 = 빌드는 통과 · ⚠ 줄로 눈에 띄게): GitHub에 올라간 판(저장소 app/readnow-webapp.js)과 견줘 이번에 새로 생긴 것만 봄
 *     - 이번 판 웹앱 UPDATE_LOG 새 줄이 있는데 ❓ 설명서 부분이 그대로 · 등록 화면 코드가 바뀌었는데 📖 등록 백과(rgenData)가 그대로
 *     - 새 탭·새 FEAT(🔍 기능 찾기) 이름이 설명서에 없음 · 새 섹션이 🔍 기능 찾기 목록(featIndex SECS·FEAT)에 없음 · 새 홈 칸(WIDGETS)에 설명 없음
 *     - UPDATE_DATES에 이번 판 날짜 · CHANGELOG에 이번 판 줄
 *  쓰는 법(release.js 한 줄): require(이 파일)({ W, O, RN_REPO, bad }) — bad 배열에 넣으면 빌드 실패 */
const fs = require('fs'); const crypto = require('crypto');
/* 고르기 없이 휴대폰도 PC와 같은 화면인 탭 — 이유 (새 탭은 여기 넣지 말고 THIN_SEC에 고르기 항목을 만드는 것이 기본) */
const PLAIN = { home: '홈 — 칸마다 가벼운 요약본(home_sum)으로 그림 · 칸은 홈 편집(WIDGETS)으로 휴대폰마다 고름', search: '고객 — 고객 목록·찾기 · 큰 자료(상품·시장 지표·판매자 전체) 없음', orders: '주문·매출 — 휴대폰도 그대로(오늘 출고는 화면에 나온 상품만 한 건씩)' };
const PREFIX = { bz_: 'biz', pu_: 'purchase', pj_: 'projects' }; /* 섹션 id 머리 → 탭 (p_ → 상품 pt_ · sl_ → 판매자 'all') */
const RENDER = { biz: 'renderBiz', purchase: 'renderPurchase', market: 'renderMarket', projects: 'renderProjects' };
const sha = (t) => crypto.createHash('sha256').update(t || '', 'utf8').digest('hex').slice(0, 16);
const between = (t, a, b, from = 0) => { const i = t.indexOf(a, from); if (i < 0) return null; const j = t.indexOf(b, i + a.length); return j < 0 ? null : t.slice(i, j); };
const fnBody = (t, name) => { const m = new RegExp('\\n(?:async )?function ' + name + '\\(').exec(t); if (!m) return ''; const rest = t.slice(m.index + 1); const e = rest.slice(1).search(/\n(?:async )?function |\nconst |\nlet |\n\/\* ═/); return e < 0 ? rest : rest.slice(0, e + 1); };
const ids = (s) => [...(s || '').matchAll(/\['([a-z]+_[A-Za-z0-9_]+|all)', '/g)].map((m) => m[1]);
function thinModel(t) { /* app.html 글에서 휴대폰 고르기 구조를 읽음 */
  const tabsTxt = between(t, 'function renderTabs() {', '\n}') || ''; const tabs = [...(between(tabsTxt, 'const t = [', '];') || '').matchAll(/\['(\w+)', '([^']*)', ICON\./g)].map((m) => [m[1], m[2]]);
  const blk = between(t, 'const THIN_SEC = {', '\nconst THIN_X') || ''; const heads = [...blk.matchAll(/(?:\{|\n)\s*(\w+): \{ need: \[[^\]]*\], (?:get )?secs/g)];
  const sec = {}; heads.forEach((h, i) => { sec[h[1]] = ids(blk.slice(h.index, i + 1 < heads.length ? heads[i + 1].index : blk.length)); });
  if (sec.products && !sec.products.length) sec.products = ids(between(t, 'const PT_SECS = [', '];\n') || '');
  if (sec.market) sec.market.push(...ids(between(t, 'const MK_PAGES = [', '\n];') || '').filter((x) => /^mk_/.test(x)));
  const thinTabs = [...(between(t, 'const THIN_TABS = {', '};') || '').matchAll(/(\w+): \['/g)].map((m) => m[1]);
  const X = {}; { const xb = between(t, 'const THIN_X = {', '};\n') || ''; const hs = [...xb.matchAll(/(\w+): \[\[/g)]; hs.forEach((h, i) => { X[h[1]] = [...xb.slice(h.index, i + 1 < hs.length ? hs[i + 1].index : xb.length).matchAll(/\[(null|'(\w+)'), '/g)].map((y) => y[2] || null); }); }
  return { tabs, sec, thinTabs, X }; }
function thinCheck(t, bad, log) { const M = thinModel(t); const miss = (tab, what) => bad.push(`❌ 휴대폰 고르기에 없음: ${tab} · ${what}`);
  if (M.tabs.length < 5 || !Object.keys(M.sec).length) { bad.push('휴대폰 반영 검사: 탭 줄(renderTabs)·THIN_SEC를 못 읽음 — tools/release-guard.js 읽는 법을 고쳐야 함'); return M; }
  for (const [k, l] of M.tabs) if (!M.sec[k] && !PLAIN[k]) miss(`${l}(${k}) 탭`, 'THIN_SEC에 고르기 항목을 만들거나, 큰 자료가 없어 휴대폰도 그대로면 release-guard.js PLAIN에 이유와 함께');
  for (const k of M.thinTabs) if (!M.sec[k]) miss(k + ' 탭', 'THIN_TABS에는 있는데 THIN_SEC(고르기 항목)에 없음');
  const has = (tab, id) => (M.sec[tab] || []).includes(id);
  const secIds = [...new Set([...t.matchAll(/\bsec\('([a-z]+_[a-z0-9_]*)'/g)].map((m) => m[1]))];
  for (const id of secIds) { if (/^p_/.test(id)) { if (!has('products', 'pt_' + id.slice(2))) miss('상품', `섹션 ${id} → 고르기 항목 pt_${id.slice(2)}`); continue; } const p = Object.keys(PREFIX).find((x) => id.startsWith(x)); if (p && !has(PREFIX[p], id)) miss(PREFIX[p], '섹션 ' + id); }
  for (const [tab, fn] of Object.entries(RENDER)) { if (!M.sec[tab]) continue; for (const m of fnBody(t, fn).matchAll(/\bsec\('([a-z]+_[a-z0-9_]*)'/g)) if (!has(tab, m[1])) miss(tab, `섹션 ${m[1]} (${fn} 안)`); }
  for (const m of t.matchAll(/\bptOn\('(\w+)'\)/g)) if (m[1] !== 'drawer' && !has('products', m[1])) miss('상품', '카드 ' + m[1]);
  for (const m of t.matchAll(/\bpuSecOn\('(\w+)'\)/g)) if (!has('purchase', m[1])) miss('매입', '카드 ' + m[1]);
  for (const [tab, L] of Object.entries(M.X)) for (const id of L) if (id && !has(tab, id)) miss(tab, '섹션 밖 카드 ' + id + ' (THIN_X)');
  const dead = []; for (const [tab, L] of Object.entries(M.sec)) for (const id of L) { if (id === 'all' || /^mk_/.test(id)) continue; if (t.split(`'${id}'`).length - 1 < 2) dead.push(`${tab} · ${id}`); }
  if (dead.length) bad.push('휴대폰 고르기 항목이 코드 어디에도 안 쓰임(눌러도 아무것도 안 보임): ' + dead.join(', '));
  log(`📱 휴대폰 반영 검사: 탭 ${M.tabs.length}개(고르기 ${Object.keys(M.sec).length} · 그대로 ${M.tabs.filter(([k]) => PLAIN[k]).length}) · 고르기 항목 ${Object.values(M.sec).reduce((a, l) => a + l.length, 0)}개 · 섹션 ${secIds.length}개 확인 — 섹션 밖 카드는 tests/tTHIN.js(동작 검사)`);
  return M; }
/* ② 자동 갱신 — GitHub 판과 견줘 새로 생긴 것만 */
const MAN_A = "/* ══════════ 사용 설명서 (위 '❓ 설명서' 버튼) ══════════ */";
const manual = (t) => { const a = t.indexOf(MAN_A); if (a < 0) return null; const f = t.indexOf('\nfunction openManual() {', a); if (f < 0) return null; const e = t.indexOf('\n}\n', f + 1); return e < 0 ? null : t.slice(a, e + 3); };
const regCode = (t) => { const names = [...new Set([...t.matchAll(/\n(?:async )?function ((?:openRegister|reg[A-Z_]\w*|rg(?!en)[A-Z_]\w*))\(/g)].map((m) => m[1]))].sort(); return names.map((n) => fnBody(t, n)).join('\n'); };
const rgen = (t) => fnBody(t, 'rgenData');
const ulog = (t) => [...(between(t, 'const UPDATE_LOG = [', '\n];') || '').matchAll(/\{ d: '([\d-]+)', app: '([^']+)', v: '([\d.]+)'/g)].map((m) => `${m[2]} ${m[3]}`);
const featT = (t) => [...(between(t, 'const FEAT = [', '\n];') || '').matchAll(/\n\s*\{ t: '([^']+)'/g)].map((m) => m[1]);
const featSecs = (t) => new Set([...(fnBody(t, 'featIndex').match(/const SECS = \[[\s\S]*?\]\];/) || [''])[0].matchAll(/\["(\w+)"/g)].map((m) => m[1]).concat([...(between(t, 'const FEAT = [', '\n];') || '').matchAll(/sec: '(\w+)'/g)].map((m) => m[1])));
const widgets = (t) => { const b = between(t, 'const WIDGETS = {', '\n};') || ''; const k = [...b.matchAll(/\n  (\w+): \['([^']*)'/g)].map((m) => m[1]); let i = 0; while ((i = t.indexOf('Object.assign(WIDGETS, {', i + 1)) > 0) { const s = t.slice(i, t.indexOf('});', i)); k.push(...[...s.matchAll(/(?:\{|\n)\s*(\w+): \['/g)].map((m) => m[1])); } for (const m of t.matchAll(/WIDGETS\.(\w+) = \[/g)) k.push(m[1]); return [...new Set(k)]; };
const core = (s) => String(s).replace(/^[^\p{L}\p{N}]+/u, '').split(/ — | \(|·| ›/)[0].trim().replace(/\s+/g, ' ');
function docCheck(t, old, warn, log) { if (!old) { log('📖 자동 갱신 검사: GitHub 판(저장소 app/readnow-webapp.js)이 없어 견줄 수 없음 — 건너뜀'); return; }
  const mNow = manual(t), mOld = manual(old); const newLog = ulog(t).filter((x) => !ulog(old).includes(x)); const newWeb = newLog.filter((x) => /^웹앱 /.test(x));
  if (newWeb.length && mNow && mOld && sha(mNow) === sha(mOld)) warn(`이번 판 UPDATE_LOG 새 줄(${newWeb.join(', ')})이 있는데 ❓ 설명서 부분이 지난 판과 같음 — 이번 고침이 설명서에 들어갔는지 확인`);
  const rNow = regCode(t), rOld = regCode(old); if (sha(rNow) !== sha(rOld) && sha(rgen(t)) === sha(rgen(old))) warn('등록 화면 코드(openRegister·reg*·rg*)가 바뀌었는데 📖 등록 백과(rgenData) 내용이 그대로 — 등록 백과에 새 기능·바뀐 동작을 넣었는지 확인');
  const mn = (mNow || '').replace(/\s+/g, ' '); const M0 = thinModel(old), M1 = thinModel(t);
  for (const [k, l] of M1.tabs) if (!M0.tabs.some(([k0]) => k0 === k) && !mn.includes(l)) warn(`새 탭 '${l}'(${k}) 이름이 ❓ 설명서에 없음`);
  const f0 = new Set(featT(old)); for (const f of featT(t)) { if (f0.has(f)) continue; const c = core(f); if (c.length >= 2 && !mn.includes(c)) warn(`새 🔍 기능 찾기(FEAT) '${f.slice(0, 50)}' — 이름 '${c}'이(가) ❓ 설명서에 없음`); }
  const s0 = new Set([...old.matchAll(/\bsec\('([a-z]+_[a-z0-9_]*)'/g)].map((m) => m[1])), fs1 = featSecs(t); for (const m of new Set([...t.matchAll(/\bsec\('([a-z]+_[a-z0-9_]*)'/g)].map((m) => m[1]))) if (!s0.has(m) && !fs1.has(m)) warn(`새 섹션 ${m} 이(가) 🔍 기능 찾기 목록(featIndex SECS 또는 FEAT go.sec)에 없음`);
  const w0 = new Set(widgets(old)); const wd = between(t, 'const W_DESC = {', '};') || ''; const wb = between(t, 'const WIDGETS = {', '\n};') || ''; const wseg = (k) => { const i = wb.indexOf('\n  ' + k + ': ['); if (i < 0) return ''; const j = wb.slice(i + 3).search(/\n  \w+: \['/); return j < 0 ? wb.slice(i) : wb.slice(i, i + 3 + j); };
  for (const k of widgets(t)) if (!w0.has(k) && !new RegExp('[{ ,]' + k + ": '").test(wd) && !/, '[^']*', '[^']+'\],?\s*(\/\*[^]*?\*\/\s*)?$/.test(wseg(k))) warn(`새 홈 칸 ${k} 에 설명(W_DESC 또는 WIDGETS 넷째 칸)이 없음 — 홈 편집 '더할 수 있는 칸'에 설명 없이 보임`);
  const av = (t.match(/const APP_VER = '([\d.]+)'/) || [])[1]; if (av && !new RegExp(`'${av.replace(/\./g, '\\.')}': '\\d{4}-`).test(between(t, 'const UPDATE_DATES = {', '};') || '')) warn(`UPDATE_DATES에 이번 판 ${av} 날짜가 없음 (bump.py가 넣음)`);
  if (av && newWeb.length && !newWeb.includes('웹앱 ' + av)) warn(`UPDATE_LOG에 이번 판 웹앱 ${av} 줄이 없음`);
  log(`📖 자동 갱신 검사(GitHub 판과 견줌): 새 UPDATE_LOG ${newLog.length}줄 · 설명서 ${mNow && mOld && sha(mNow) !== sha(mOld) ? '바뀜' : '그대로'} · 등록 화면 코드 ${sha(rNow) !== sha(rOld) ? '바뀜' : '그대로'} / 📖 등록 백과 ${sha(rgen(t)) !== sha(rgen(old)) ? '바뀜' : '그대로'} · FEAT ${featT(t).length}개(새 ${featT(t).filter((f) => !f0.has(f)).length}) · 홈 칸 ${widgets(t).length}개`); }
module.exports = function ({ W, RN_REPO, bad }) { const log = (s) => console.log(s); const warns = []; const warn = (s) => warns.push(s);
  const t = fs.readFileSync(W + 'app.html', 'utf8'); thinCheck(t, bad, log);
  const oldF = RN_REPO + 'app/readnow-webapp.js'; let old = null; try { old = fs.readFileSync(oldF, 'utf8'); } catch (e) {}
  try { docCheck(t, old, warn, log); } catch (e) { warn('자동 갱신 검사 오류: ' + e.message); }
  if (warns.length) console.log('⚠ 자동 갱신 확인 필요 (빌드는 통과 — 판 내기 전에 보고 채우기):\n  ⚠ ' + warns.join('\n  ⚠ '));
  return { warns }; };
module.exports.thinModel = thinModel; module.exports.PLAIN = PLAIN;
