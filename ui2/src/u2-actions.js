/* 리드나우 2 — 행동 (설계안 5-4 · 단계 5)
 * 단추·카드·떠 있는 단추가 누르면 하는 일. 여러 행동을 '차례 행동' 칸에 한 줄씩(행동: 대상) — 늘 차례대로, 앞이 실패하면 멈춤(또는 계속)
 * 규칙: 브라우저 팝업(alert/confirm/prompt/window.open) 안 씀 — 확인은 화면 안 두 번 누르기(대상 이름 보임) · 모달·서랍은 화면 안 층
 *       옛 기능 실행은 이름이 있는 것(🔍 기능 찾기·화면 목록)만 — 아무 함수나 부르지 못함 · 쓰기는 u2-guard를 거침
 *       단축키는 옛 단축키(Alt+G·Alt+N·Alt+,·Ctrl+F·Ctrl+Z 등)와 겹치면 편집기가 막음 */
(function () {
  'use strict';
  const U2 = (window.U2 = window.U2 || {});
  const A = (U2.actions = { defs: {}, order: [] });
  const def = (k, name, help, run) => { A.defs[k] = { k, name, help, run }; A.order.push(k); };
  const nameOf = (s) => String(s || '').trim();
  const splitEq = (s) => { const i = String(s).indexOf('='); return i < 0 ? [String(s).trim(), ''] : [s.slice(0, i).trim(), s.slice(i + 1).trim()]; };
  def('none', '없음', '', () => {});
  def('page', '페이지로', '페이지 id (예 orders)', (arg) => U2.go(nameOf(arg)));
  def('link', '바깥 주소', 'https 주소 — 같은 창(새 탭은 링크 위젯)', (arg) => { if (!/^https?:\/\//.test(arg || '')) throw new Error('https 주소만'); location.href = arg; });
  def('modal', '모달로 열기', '페이지 id(그 페이지를 화면 안 층에) 또는 글', (arg) => { const id = nameOf(arg); if (U2.site && (U2.site.nav || []).some((n) => n.id === id) || (U2.pages && U2.pages[id])) return U2.miniPage(id, 'u2-modal'); U2W.layer('u2-modal', '안내', U2W.rich(arg)); });
  def('drawer', '서랍으로 열기', '페이지 id 또는 글', (arg) => { const id = nameOf(arg); if ((U2.site && (U2.site.nav || []).some((n) => n.id === id)) || (U2.pages && U2.pages[id])) return U2.miniPage(id, 'u2-drawer u2-d-right'); U2W.layer('u2-drawer u2-d-right', '서랍', U2W.rich(arg)); });
  def('toggle', '다른 위젯 접기/펴기', '위젯 id', (arg) => { const c = U2.view && U2.view.cell(nameOf(arg)); if (!c) throw new Error('위젯을 찾지 못함: ' + arg); c.classList.toggle('u2-folded'); });
  def('tab', '다른 위젯 탭 바꾸기', '위젯 id:몇째(1부터)', (arg) => { const [id, n] = String(arg).split(':'); const c = U2.view && U2.view.cell(nameOf(id)); const b = c && c.querySelectorAll('.u2-tabh [data-i]')[(+n || 1) - 1]; if (!b) throw new Error('탭을 찾지 못함'); b.click(); });
  def('screen', '지금 웹앱 화면 열기', '화면 이름(예 ship)', (arg, ctx) => U2.legacy.screen(nameOf(arg), ctx));
  def('tabopen', '지금 웹앱 탭 열기', '탭 이름(예 pending · orders) — 그 탭이 있는 페이지로, 없으면 그 탭만 있는 페이지', (arg) => { const t = nameOf(arg); const pid = U2.pageForTab(t) || t; return U2.go(pid); });
  def('u2', '새 웹앱 화면 열기', '충돌 감시 · 따라잡기 · 일정 · 체크리스트 · 쓰기 허락 · 찾기', (arg) => { const m = { '충돌 감시': 'watchScreen', '감시': 'watchScreen', '따라잡기': 'trackScreen', '일정': 'planScreen', '체크리스트': 'checkScreen', '쓰기 허락': 'permScreen', '찾기': '' }; const k = nameOf(arg); if (k === '찾기') return U2.find && U2.find.open(); const fn = U2[m[k]]; if (typeof fn !== 'function') throw new Error('새 웹앱 화면을 찾지 못함: ' + k); return fn(); }); /* (0.4.5) 받은편지함 줄이 갈 곳 */
  def('ledview', '지금 웹앱 통합 장부 보기', 'all 전체 · todo 처리할 일 · ord 주문 모음 · aud 실사 목록 · rc 사후 확인', (arg) => { const v = String(nameOf(arg) || 'all').trim(); const m = { 전체: 'all', '처리할 일': 'todo', 주문: 'ord', 실사: 'aud', '사후 확인': 'rc' }; const k = m[v] || v; if (!/^(all|todo|ord|aud|rc)$/.test(k)) throw new Error('통합 장부 보기 이름을 모름: ' + v); if (!U2.omni) throw new Error('통합 판매처 묶음을 아직 받지 않음'); return U2.omni.ledger(k); }); /* (0.4.13) 🔁 사후 확인(1.78.512)·🔍 실사 목록(1.78.504) 줄이 갈 곳 */
  def('feat', '지금 웹앱 기능 실행', '🔍 기능 찾기 이름 일부', (arg, ctx) => U2.legacy.feat(nameOf(arg), ctx));
  def('calc', '계산해서 변수에', '변수 = 식 (예 합계 = 수 × 2)', (arg) => { const [n, e] = splitEq(arg); const r = U2Expr.eval(e, U2.data.ctx()); if (r.err) throw new Error(r.err); U2.data.setVar(n, r.v); });
  def('set', '변수 바꾸기', '변수 = 값', (arg) => { const [n, v] = splitEq(arg); U2.data.setVar(n, v); });
  def('save', '이 기기에 저장', '이름(지금 변수들을 rn2-에)', (arg) => { U2.ls.set('save-' + nameOf(arg || '기본'), U2.clone(U2.vars)); U2.toast('저장함: ' + (arg || '기본')); });
  def('view', '저장한 보기 열기', '보기 이름', (arg) => U2.data.openView(nameOf(arg)));
  def('toast', '짧은 알림', '글({{식}} 됨)', (arg) => U2.toast(U2Expr.fill(arg, U2.data.ctx())));
  def('copy', '글 복사', '글({{식}} 됨)', async (arg) => { await navigator.clipboard.writeText(U2Expr.fill(arg, U2.data.ctx())); U2.toast('복사함'); });
  def('csv', '표를 CSV로 내려받기', '표 위젯 id', (arg) => { const w = U2.curPage() && U2.curPage().widgets[nameOf(arg)]; if (!w || w.type !== 'table') throw new Error('표 위젯을 찾지 못함'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + String(w.props.data || '')], { type: 'text/csv' })); a.download = (w.props.s_title || '표') + '-' + U2.today() + '.csv'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); });
  /* 한 줄 = '행동: 대상' (행동은 이름이나 열쇠) */
  A.parseSeq = (text) => String(text || '').split('\n').map((l) => l.trim()).filter(Boolean).map((l) => { const i = l.indexOf(':'); const h = (i < 0 ? l : l.slice(0, i)).trim(); const k = A.defs[h] ? h : (A.order.find((x) => A.defs[x].name === h) || null); return { do: k, arg: i < 0 ? '' : l.slice(i + 1).trim(), raw: l }; });
  A.run = async (list, ctx, opt) => {
    opt = opt || {}; const done = [];
    for (const a of list) {
      const d = A.defs[a.do]; if (!d) { U2.toast('모르는 행동: ' + (a.raw || a.do), 1); if (!opt.keepGoing) break; continue; }
      try { await d.run(a.arg, ctx || {}); done.push(a.do); } catch (e) { U2.toast('⚠ ' + d.name + ' 실패: ' + e.message, 1); if (!opt.keepGoing) break; }
    }
    return done;
  };
  /* 위젯 속성에서 행동 목록 만들기: 차례 행동 칸이 있으면 그것, 아니면 '누르면' 하나 */
  A.of = (p) => { const seq = A.parseSeq(p.seq); if (seq.length) return seq; return p.act && p.act !== 'none' ? [{ do: p.act, arg: p.arg }] : []; };
  A.fire = (p, el, ctx) => { const list = A.of(p); if (!list.length) return; const go = () => A.run(list, ctx, { keepGoing: p.onErr === 'go' }); if (p.confirm && el) return U2.twice(el, p.confirmLabel || A.defs[list[0].do] && A.defs[list[0].do].name || '실행', go); return go(); };
  /* 옛 호환(U2.act) */
  U2.act = (a, el, ctx) => A.fire({ act: a.do, arg: a.arg, confirm: a.confirm }, el, ctx);
  A.opts = () => Object.fromEntries(A.order.map((k) => [k, A.defs[k].name]));
  A.PROPS = () => [{ k: 'act', label: '누르면', type: 'select', opts: A.opts(), def: 'none' }, { k: 'arg', label: '대상(페이지 id·주소·글·기능 이름·변수 = 식)', type: 'text', def: '' }, { k: 'confirm', label: '두 번 눌러 확인', type: 'check', def: false }, { k: 'seq', label: '차례 행동(한 줄에 하나 — 행동: 대상 · 쓰면 위 칸 대신)', type: 'area', def: '' }, { k: 'onErr', label: '앞 행동이 실패하면', type: 'select', opts: { stop: '멈춤', go: '계속' }, def: 'stop' }, { k: 'key', label: '단축키(예 Alt+1 · 비우면 없음)', type: 'text', def: '' }];
  /* 단축키 — 옛 화면이 쓰는 것과 겹치면 안 됨 */
  A.TAKEN = ['Alt+G', 'Alt+N', 'Alt+,', 'Ctrl+F', 'Ctrl+Z', 'Ctrl+Shift+Z', 'Ctrl+Y', 'Ctrl+C', 'Ctrl+V', 'Ctrl+D', 'Ctrl+K', 'Escape', '/'];
  A.keyName = (e) => [e.ctrlKey || e.metaKey ? 'Ctrl' : '', e.altKey ? 'Alt' : '', e.shiftKey ? 'Shift' : '', e.key.length === 1 ? e.key.toUpperCase() : e.key].filter(Boolean).join('+');
  A.keyOk = (k) => { k = String(k || '').trim(); if (!k) return ''; if (!/^(Ctrl\+|Alt\+)(Shift\+)?[A-Z0-9]$/i.test(k)) return '단축키는 Ctrl+글자 또는 Alt+글자(숫자) 꼴로'; if (A.TAKEN.some((t) => t.toUpperCase() === k.toUpperCase())) return '지금 웹앱·편집기가 쓰는 단축키와 겹침: ' + k; return ''; };
  document.addEventListener('keydown', (e) => {
    if (U2.edit || !U2.curPage) return; const t = e.target; if (t && t.closest && t.closest('input,textarea,select,[contenteditable="true"]')) return;
    if (!(e.ctrlKey || e.metaKey || e.altKey)) return; const k = A.keyName(e); const pg = U2.curPage(); if (!pg) return;
    for (const [id, w] of Object.entries(pg.widgets || {})) { const p = (w && w.props) || {}; if (p.key && String(p.key).toUpperCase() === k.toUpperCase() && !A.keyOk(p.key)) { e.preventDefault(); e.stopPropagation(); A.fire(p, null, { wid: id, page: pg.id }); return; } }
  });
})();
