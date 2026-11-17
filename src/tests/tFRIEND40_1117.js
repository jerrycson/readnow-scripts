// tFRIEND40_1117 — (friend40 11/17 · 지피티 책방 친구 쪽지 「연구회차40-진입」 · PR #40 내용을 다시 얹음)
//  🧪 프로젝트 탭 🐾 책방 친구 카드가 11/14 고정 문구라 정범님이 최신 연구 회차를 못 보던 것 → 연구실 회차 목록(releases.json)을 읽어 최신 회차 이름·자료 수·새 탭 링크
//  ① 원문: 고정 문구 없음 · iframe·타이머 없음(탭 그릴 때 한 번 · 5분 안 다시 안 읽음) · 이름은 esc · 휴대폰은 읽지 않고 latest.html 링크 · 팝업 없음
//  ② 순수 함수: 최신 고르기(bookfriend·round 큰 것·틀린 줄 거름) · 회차 화면 주소(38차부터 pixel-lab/round<N>.html)
//  ③ 화면(harness.js가 옆에 있고 RN_PORT가 있을 때만): 가짜 releases.json → 카드에 🆕 최신 40차·이름·자료 수·40차 열기 ↗·🔭 최신 관찰창 ↗(새 탭) · 이름 속 <b>는 글자 · 다시 그려도 다시 안 읽음 · 목록이 없으면 까닭 글
const fs = require('fs'); const path = require('path'); const assert = require('assert'); const vm = require('vm');
const A = fs.readFileSync(path.join(__dirname, '..', 'app.html'), 'utf8');
const ok = (m) => console.log('✓', m);
const fnOf = (name) => { const i = A.indexOf('function ' + name + '('); assert(i >= 0, '함수 없음: ' + name); let j = A.indexOf('{', i), d = 0; for (let k = j; k < A.length; k++) { const c = A[k]; if (c === '{') d++; else if (c === '}') { d--; if (!d) return A.slice(i, k + 1); } } throw new Error('끝 못 찾음: ' + name); };

// ① 원문
const rp = fnOf('renderProjects');
assert(!/새로 시작 중\(11\/14\)/.test(rp), '11/14 고정 문구가 남아 있음'); ok('11/14 고정 문구 없음');
assert(/픽셀 캐릭터 기본형 연구/.test(rp), 'PR #40 소개 글'); ok('소개 = 픽셀 캐릭터 기본형 연구(PR #40 글)');
assert(/id="pj_friend_latest">\$\{pjFriendLatestHtml\(\)\}/.test(rp), '최신 회차 줄 자리'); ok('카드 안 #pj_friend_latest = pjFriendLatestHtml()');
assert(/pjFriendLatestLoad\(\)/.test(rp), '탭 그릴 때 읽기'); ok('탭을 그릴 때 회차 목록 읽기');
assert(!/<iframe/i.test(rp), 'iframe'); ok('카드에 iframe 없음(웹앱 메모리·15초 타이머 안 씀)');
assert(/\$\{PJ_RESEARCH_URL\}" target="_blank" rel="noopener"/.test(rp), '연구 페이지 링크'); ok('🎨 연구 페이지 열기 ↗ 그대로(새 탭)');
assert(/const PJ_FRIEND_REL_URL = '\.\.\/friend\/research\/hub\/releases\.json', PJ_FRIEND_LATEST_URL = '\.\.\/friend\/research\/hub\/latest\.html';/.test(A), '주소'); ok('읽는 곳 = friend/research/hub/releases.json · 휴대폰 링크 = latest.html');
const ld = fnOf('pjFriendLatestLoad'), hh = fnOf('pjFriendLatestHtml');
assert(!/setInterval|setTimeout/.test(ld + hh), '타이머'); ok('타이머 없음');
assert(/PHONE_THIN \|\|/.test(ld) && /300000/.test(ld) && /60000/.test(ld) && /F\.busy/.test(ld), '휴대폰·5분·겹침 막기'); ok('휴대폰은 안 읽음 · 받았으면 5분 · 못 받았으면 1분 안 다시 안 읽음 · 겹쳐 안 읽음');
assert(/credentials: 'omit'/.test(ld) && /cache: 'no-store'/.test(ld), 'fetch 꼴'); ok("읽기 = cache no-store · credentials omit");
assert(/getElementById\('pj_friend_latest'\)/.test(ld) && !/renderMain/.test(ld), '부분 다시 그리기'); ok('읽은 뒤 그 줄만 바꿈(탭 전체 다시 안 그림)');
assert(/\$\{esc\(r\.label\)\}/.test(hh) && /esc\(F\.err\)/.test(hh) && /esc\(pjFriendRoundUrl\(r\)\)/.test(hh), 'esc'); ok('이름·까닭·주소는 esc');
assert(/target="_blank" rel="noopener"/.test(hh), '새 탭'); ok('회차 링크 = 새 탭');
assert(/href="\$\{PJ_FRIEND_LATEST_URL\}" target="_blank" rel="noopener"[^>]*>🔭 최신 관찰창 ↗/.test(hh.split('const at')[1] || ''), '관찰창'); ok('회차를 읽은 뒤에도 🔭 최신 관찰창 ↗ = latest.html 새 탭(지피티 쪽지 13:13)');
for (const f of [rp, ld, hh]) assert(!/\b(alert|confirm|prompt)\s*\(/.test(f), '팝업'); ok('팝업 없음');
assert(/'pj_friend', '🐾 책방 친구 캐릭터·애니메이션 연구', '최신 회차/.test(A), '휴대폰 고르기 설명'); ok('휴대폰 카드 고르기 설명에 최신 회차');

// ② 순수 함수
const C = {}; vm.runInNewContext(fnOf('pjFriendPick') + '\n' + fnOf('pjFriendRoundUrl') + '\nthis.pick = pjFriendPick; this.url = pjFriendRoundUrl;', C);
const rel = { project: 'bookfriend', releases: [
  { project: 'bookfriend', round: 39, cards: 318, label: '39차' }, { project: 'bookfriend', round: 41, cards: 'x', label: '틀린 줄' },
  { project: 'other', round: 99, cards: 1, label: '다른 프로젝트' }, { project: 'bookfriend', round: 40, cards: 323, label: '40차 · 눈매' }, null, { project: 'bookfriend', round: 1.5, cards: 1, label: '소수' }] };
assert.strictEqual(C.pick(rel).round, 40); ok('최신 = bookfriend 중 round가 가장 큰 바른 줄(40) · 틀린 줄·다른 프로젝트 거름');
assert.strictEqual(C.pick({}), null); assert.strictEqual(C.pick(null), null); ok('목록이 없으면 null');
assert.strictEqual(C.url({ round: 40 }), '../friend/pixel-lab/round40.html'); assert.strictEqual(C.url({ round: 37 }), '../friend/research/hub/'); ok('38차부터 회차 화면 · 그 전은 연구실 첫 화면');
console.log('✅ tFRIEND40_1117 통과');

// ③ 화면
if (process.env.RN_PORT && fs.existsSync(path.join(__dirname, 'harness.js'))) (async () => { let bad = 0; const ck = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
  await require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type()); d.dismiss().catch(() => {}); });
    let hits = 0, mode = 'ok';
    await p.route(/\/friend\/research\/hub\/releases\.json/, (r) => { hits++; if (mode === 'fail') return r.fulfill({ status: 404, body: '' }); r.fulfill({ contentType: 'application/json', body: JSON.stringify({ project: 'bookfriend', releases: rel.releases.filter((x) => !(x && x.round === 40)).concat([{ project: 'bookfriend', round: 40, cards: 323, sources: 312, at: '2026-11-17T02:55:00.000Z', label: '40차 · <b>눈매</b>' }]) }) }); });
    await p.evaluate(require('./seed.js')); await p.waitForTimeout(500);
    const R = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const o = {}; uxTabGo('projects');
      let el = null; for (let i = 0; i < 40; i++) { el = document.querySelector('#pj_friend_latest'); if (el && /최신 40차/.test(el.textContent)) break; await W(150); }
      o.txt = el && el.textContent; const a = el && [...el.querySelectorAll('a')].find((x) => /40차 열기/.test(x.textContent)); o.href = a && a.getAttribute('href'); o.tgt = a && a.target; const v = el && [...el.querySelectorAll('a')].find((x) => /최신 관찰창/.test(x.textContent)); o.vhref = v && v.getAttribute('href'); o.vtgt = v && v.target; o.bold = !!(el && el.querySelector('b b'));
      o.card = (document.querySelector('#pj_friend .pj-what') || {}).textContent; o.research = !!document.querySelector('#pj_friend a[href="../friend/research.html"][target="_blank"]'); o.iframe = !!document.querySelector('#pj_friend iframe');
      renderMain(); await W(400); o.again = (document.querySelector('#pj_friend_latest') || {}).textContent; return o; });
    ck(/🆕 최신 40차/.test(R.txt || '') && /자료 323개/.test(R.txt) && /출처 312개/.test(R.txt) && /11\/17 11:55/.test(R.txt), '카드에 🆕 최신 40차 · 자료 323개 · 출처 312개 · 한국 시각 11/17 11:55', R);
    ck(/40차 · <b>눈매<\/b>/.test(R.txt || '') && !R.bold, '이름 속 <b>는 글자로 보임(esc)', R);
    ck(R.href === '../friend/pixel-lab/round40.html' && R.tgt === '_blank', '40차 열기 ↗ = round40.html 새 탭', R);
    ck(R.vhref === '../friend/research/hub/latest.html' && R.vtgt === '_blank', '🔭 최신 관찰창 ↗ = latest.html 새 탭', R);
    ck(/픽셀 캐릭터 기본형 연구/.test(R.card || '') && !/새로 시작 중/.test(R.card) && R.research && !R.iframe, '소개 글 바뀜 · 🎨 연구 페이지 링크 그대로 · iframe 없음', R);
    ck(hits === 1 && /최신 40차/.test(R.again || ''), '다시 그려도 다시 안 읽음(5분 안) · 받은 회차 그대로 보임', { hits, again: R.again });
    mode = 'fail'; const R2 = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); S._pjFr = null; renderMain(); let t = ''; for (let i = 0; i < 30; i++) { t = (document.querySelector('#pj_friend_latest') || {}).textContent || ''; if (/못 읽음/.test(t)) break; await W(150); } return t; });
    ck(/최신 회차를 못 읽음\(응답 404\)/.test(R2) && /연구 페이지에서/.test(R2), '목록을 못 받으면 까닭(응답 404)과 연구 페이지 안내', R2);
    ck(!dlg.length, '브라우저 팝업 없음', dlg);
  });
  console.log(bad ? `❌ tFRIEND40_1117 화면 실패 ${bad}` : '✅ tFRIEND40_1117 화면 통과'); process.exit(bad ? 1 : 0);
})().catch((e) => { console.log('❌ 시험 오류', e); process.exit(1); });
