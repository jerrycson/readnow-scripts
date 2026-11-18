// tY24PAGE1118 — (y24page1 11/18 · 정범님 노트 b_mwllenfmptaj1 [4]) 📤 예스24에 새로 올리기 화면 개편
//   ① 코드 꼴: 위 띠(y24rbar) 없음 · 값 경고 설정(lowWon 기본 1,000 · 0~100,000) · 쪽 안내 새 판 · ISBN 복사 살림 · Alt+V 잡이 · 브라우저 창 0
//   ② 화면(RN_PORT): 카드 = 등록 카드(고르기 네모는 이 화면 것만) · 오른쪽 가운데 🔎/📋 단추(기억) · 한눈에 줄 누르면 그 상품만 자세히 → ▲ 접기 · Alt+V · 흐름 띠·까닭 칩 · 보이는 것 고르기/모두 풀기 · ⚠ 값 확인 · 안내 ✕
// 실행: node src/tests/tY24PAGE1118.js · 화면까지: RN_PORT=<포트> (pw/ 안 · harness.js·seed.js 옆) · 시험 자료에 손님 정보 없음
const fs = require('fs'); const path = require('path');
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
const APP = process.env.RN_APP || [path.resolve(__dirname, '..', 'app.html'), path.resolve(__dirname, '..', '..', 'src', 'app.html')].find((x) => fs.existsSync(x));
const T = fs.readFileSync(APP, 'utf8'); const cut = (a, b) => { const i = T.indexOf(a); const j = T.indexOf(b, i + 1); if (i < 0 || j < i) throw new Error('덩어리 못 찾음: ' + a); return T.slice(i, j); };
console.log('① 코드 꼴');
const F = new Function(cut('/* ◆y24reg 시작', '/* ◆y24reg 끝 */') + '\nreturn { Y24R_DEF, y24RegCfg };')();
ok(F.Y24R_DEF.lowWon === 1000 && F.y24RegCfg({}).lowWon === 1000 && F.y24RegCfg({ lowWon: 0 }).lowWon === 0 && F.y24RegCfg({ lowWon: 999999 }).lowWon === 100000 && F.y24RegCfg({ lowWon: -5 }).lowWon === 0 && F.y24RegCfg({ lowWon: 'x' }).lowWon === 1000, '⚠ 값 경고 기준 = 설정(기본 1,000원 · 0 = 끔 · 0~100,000)');
const blk = cut('function y24CardHtml(r, i)', '/* 두 번 누르기(브라우저 창 없음)');
ok(!/y24rbar/.test(blk) && /regCardFns\(new Map\(\), window\.ReadnowRegister, 'done', V\)/.test(blk), '카드 = 등록 카드 함수 그대로 · 위 띠 없음');
ok(/data-\(\?!full=\|mh=\|mk=\|rgn=\|isbncp=\)/.test(T), 'ISBN 누르면 복사(등록 카드와 같음) — 끊지 않음');
ok(/PAGE_GUIDES\['y24Reg'\] = \{ title: '📤 예스24에 새로 올리기', ver: '2026-11-18'/.test(T) && /t: '흐름 띠'/.test(T) && /t: '🔎 자세히 \/ 📋 한눈에'/.test(T), '쪽 안내 새 판(흐름 띠·보기·편의)');
ok(/bigTable === 'y24reg'\)\) return; const b = document\.querySelector\(`\[data-y24view=/.test(T), 'Alt+V는 이 화면이 열렸을 때만');
{ const sc = cut('/* (y24page1 11/18 · 정범님 노트 b_mwllenfmptaj1 [4]', '/* (plock2 11/18'); ok(!/\balert\(|\bconfirm\(|\bprompt\(/.test(sc + blk) && !/01[016789]-?\d{3,4}-?\d{4}/.test(sc + blk), '브라우저 창·휴대전화 번호 꼴 0'); }
(async () => {
  if (!process.env.RN_PORT) { console.log(bad ? `❌ tY24PAGE1118 ${bad}개 실패` : '✓ tY24PAGE1118 코드 꼴 통과 (화면 시험은 RN_PORT를 주면)'); process.exit(bad ? 1 : 0); }
  console.log('② 화면');
  await require('./harness.js')(async (p) => { const dlg = []; p.on('dialog', (d) => { dlg.push(d.type() + ': ' + d.message().slice(0, 80)); d.dismiss().catch(() => {}); });
    await p.evaluate(require('./seed.js')); await p.waitForTimeout(400);
    const o = await p.evaluate(async () => { const o = {}; try { const Wt = (ms) => new Promise((r) => setTimeout(r, ms));
      let i = 0; S.plist.forEach((l) => { l.sku = 'A01'; l.isbn13 = '97889000001' + String(10 + i).padStart(2, '0'); S.sku.map.set(l.id, { c: ['t' + String(2000 + i++)] }); }); S.ver++;
      S.y24.loaded = true; S.y24.adm = { t: Date.now(), m: new Map() }; S.app.platforms = { y24: {} }; try { localStorage.removeItem('rn-y24-view'); localStorage.removeItem('rn-y24-hint1118'); } catch (e) {}
      const live = y24RegRows().filter((r) => r.k === 'ok'); o.cand = live.length; if (live[0]) { live[0].l.price = 90; S.ver++; S._y24R = null; }
      S._bt_y24reg = { q: '', lim: 60, sort: 'price', f: { k: 'ok' } }; openY24Reg(); await Wt(500); const sh = document.getElementById('sheet');
      o.bar = sh.querySelectorAll('.y24rbar').length; o.cards = sh.querySelectorAll('.y24rc').length; o.rg = sh.querySelectorAll('.y24rc .rgc2').length;
      o.chk = sh.querySelectorAll('.y24rc .rgchk[data-y24rsel]').length; o.chkOther = sh.querySelectorAll('.y24rc .rgchk:not([data-y24rsel])').length; o.chkTop = sh.querySelectorAll('.y24rc .rgtop > .rgchk[data-y24rsel]').length;
      o.acts = sh.querySelectorAll('.y24rc .y24acts [data-y24rone]').length; o.ln = sh.querySelectorAll('.y24rc .y24ln').length; o.isbn = sh.querySelectorAll('.y24rc [data-isbncp]').length;
      o.vwf = !!sh.querySelector('.rgvwf [data-y24view="full"].on') && !!sh.querySelector('.rgvwf [data-y24view="compact"]'); o.flow = sh.querySelectorAll('.y24flow [data-y24flow]').length; o.hint = !!sh.querySelector('.y24hint [data-y24hintx]');
      o.low = sh.querySelectorAll('.y24rc.low .y24low').length; o.lowFlow = /값 확인/.test((sh.querySelector('.y24flow') || {}).textContent || '');
      /* 보이는 것 고르기 · 모두 풀기 */ S._y24Pick = new Set(); S._y24Unpick = new Set(); openY24Reg(); await Wt(300); sh.querySelector('[data-y24pickv]').click(); await Wt(300); o.pickAll = S._y24Pick.size === Math.min(o.cand, 60) && sh.querySelectorAll('[data-y24rsel]:checked').length === o.chk;
      sh.querySelector('[data-y24pick0]').click(); await Wt(300); o.pick0 = S._y24Pick.size === 0 && !sh.querySelector('[data-y24rsel]:checked');
      /* 안내 ✕ */ sh.querySelector('[data-y24hintx]').click(); await Wt(200); openY24Reg(); await Wt(300); o.hintGone = !sh.querySelector('.y24hint');
      /* 📋 한눈에 → 기억 · 줄 누르면 그 상품만 자세히 → 접기 */ sh.querySelector('.rgvwf [data-y24view="compact"]').click(); await Wt(400); o.mem = localStorage.getItem('rn-y24-view') === 'compact';
      o.rows = sh.querySelectorAll('.y24rc .rgrow').length; o.rowChk = sh.querySelectorAll('.y24rc .rgrow > .rgchk[data-y24rsel]').length; o.rowBtn = sh.querySelectorAll('.y24rc .rgrow .y24rs [data-y24rone]').length;
      const c1 = sh.querySelector('.y24rc[data-y24exp] .rgr-t'); const id1 = c1 && c1.closest('.y24rc').dataset.y24exp; c1.click(); await Wt(400);
      const e1 = sh.querySelector(`.y24rc[data-y24rc="${id1}"]`); o.exp = !!e1 && !!e1.querySelector('.rgc2 .rgtop') && !!e1.querySelector('[data-y24fold]') && sh.querySelectorAll('.y24rc .rgrow').length === o.rows - 1;
      e1.querySelector('[data-y24fold]').click(); await Wt(400); o.fold = sh.querySelectorAll('.y24rc .rgrow').length === o.rows && !sh.querySelector('[data-y24fold]');
      const b1 = sh.querySelector('.y24rc .rgrow [data-y24rsel]'); b1.click(); await Wt(200); o.chkNoExp = !sh.querySelector('[data-y24fold]') && S._y24Pick.has(b1.dataset.y24rsel);
      /* Alt+V */ document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyV', key: 'v', altKey: true, bubbles: true })); await Wt(400); o.altV = localStorage.getItem('rn-y24-view') === 'full' && !sh.querySelector('.y24rc .rgrow');
      /* 흐름 띠 → 못 올림 · 까닭 칩 */ const fno = sh.querySelector('[data-y24flow="no|"]'); fno.click(); await Wt(400); o.noTab = S._bt_y24reg.f.k === 'no'; const nNo = sh.querySelectorAll('.y24rc').length; const sb = [...sh.querySelectorAll('[data-y24sub^="no|"]')]; o.subN = sb.length;
      if (sb[0]) { const want = +sb[0].querySelector('b').textContent.replace(/[^0-9]/g, ''); sb[0].click(); await Wt(400); o.subCut = sh.querySelectorAll('.y24rc').length === Math.min(want, 60) && (want < nNo || sb.length === 1); }
      else o.subCut = true;
      S._bt_y24reg.f.k = 'led'; S._bt_y24reg.sub = ''; openY24Reg(); await Wt(300); o.subOtherTab = sh.querySelectorAll('[data-y24sub^="no|"]').length === 0;
      return o; } catch (e) { return { err: e.message, o: JSON.stringify(o).slice(0, 400) }; } });
    if (!o || o.err) { ok(false, '화면 시험 오류: ' + (o ? o.err + ' · ' + o.o : '멈춤')); return; }
    console.log('   ', JSON.stringify(o));
    ok(o.cand > 0 && o.bar === 0 && o.cards > 0 && o.rg === o.cards, `카드 = 등록 카드(${o.rg}/${o.cards}) · 위 띠 0`);
    ok(o.chk === o.cards && o.chkOther === 0 && o.chkTop === o.cards, '고르기 네모는 등록 카드 자리(rgtop 맨 앞)에 이 화면 것만');
    ok(o.acts === o.cards && o.ln === o.cards && o.isbn > 0, '상태·📤 단추는 카드 안 단추 칸 · 예스24 줄은 카드 안 · ISBN 복사 살아 있음');
    ok(o.vwf && o.hint && o.flow >= 6, '오른쪽 가운데 🔎/📋 단추 · 흐름 띠 · 안내(✕ 있음)');
    ok(o.low >= 1 && o.lowFlow, '⚠ 값 확인(알라딘 90원) 카드 표시 · 흐름 띠 숫자');
    ok(o.pickAll && o.pick0, '☑ 화면에 보이는 것 고르기 · ☐ 모두 풀기');
    ok(o.hintGone, '안내 ✕ 닫으면 다시 안 보임');
    ok(o.mem && o.rows === o.cards && o.rowChk === o.rows && o.rowBtn === o.rows, '📋 한눈에 = 등록 한눈에 줄 · 기억 · 줄에 고르기·📤 단추');
    ok(o.exp && o.fold, '한눈에서 줄 누르면 그 상품만 자세히 → ▲ 접기');
    ok(o.chkNoExp, '고르기 네모를 누르면 펼치지 않고 고르기만');
    ok(o.altV, 'Alt+V로 보기 바꾸기');
    ok(o.noTab && o.subN >= 1 && o.subCut && o.subOtherTab, `흐름 띠 → 못 올림 · 까닭 칩 ${o.subN}개로 거름 · 다른 탭엔 안 따라감`);
    ok(!dlg.length, '브라우저 창 0: ' + dlg.join(' / ')); });
  console.log(bad ? `❌ tY24PAGE1118 ${bad}개 실패` : '✓ tY24PAGE1118 모두 통과'); process.exit(bad ? 1 : 0); })();
