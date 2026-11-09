/* col2-jobview.js — (0.1.9) 🔎 비교 화면 '일별 그림자' 칸: 이 PC가 하는 그림자 일마다 오늘 견줌 n · 같음 비율 · 다름 까닭 · '넘길 수 있음'
 * 도우미 GET /jobs(읽기만) · 이 PC가 안 하는 일은 까닭(로거 고유 일 · 사무실 PC 일 · 아직 안 돎)과 함께 흐리게 */
(function () {
  'use strict';
  const C = window.COL2, TK = window.Col2Tasks; const $ = (i) => document.getElementById(i);
  const E = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const HB = /^\/compare/.test(location.pathname) && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(location.origin) ? '' : `http://127.0.0.1:${C.PORT}`;
  const why = (w) => Object.entries(w || {}).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${E((TK && TK.WHY[k]) || k)} ${n}`).join(' · ') || '—';
  async function load() { let j; try { j = await (await fetch(HB + '/jobs', { headers: { 'X-RN-Col2': '1' }, cache: 'no-store' })).json(); } catch (e) { $('jobsum').textContent = '번외 도우미에 닿지 못함'; return; }
    if (!j || !j.ok) return; const mine = j.tasks.filter((t) => t.mine); const can = mine.filter((t) => t.today && t.today.pass.can).length;
    $('jobsum').textContent = `${j.kind === 'logger' ? '🛰 로거' : '🏢 사무실'} PC ${j.pc} · ${j.d} · 이 PC 일 ${mine.length}개 · 넘길 수 있음 ${can}개${j.wait ? ` · 운영 값 기다림 ${j.wait}` : ''}${j.busy ? ' · 운영이 바빠 쉼' : ''}`;
    $('jobrule').textContent = `넘길 수 있음 = ${j.rule}`;
    $('jobs').innerHTML = j.tasks.map((t) => { const d = t.today, p = d && d.pass; const dim = !t.mine;
      return `<tr data-k="${E(t.k)}" style="${dim ? 'opacity:.45' : ''}"><td>${E(t.name)}<br><span class="k">${E(t.ops.join('·'))} → ${E(t.col)}${dim ? ' · ' + E(t.notMine || '') : ''}${t.state === 'hold' && t.why ? ' · ' + E(t.why) : ''}</span></td>
        <td>${d ? `${d.n}건${d.fail ? ` · 못 읽음 ${d.fail}` : ''}${d.noprod ? ` · 운영 값 없음 ${d.noprod}` : ''}` : t.mine ? `차례 ${t.q}` : '—'}</td><td>${p && p.rate != null ? p.rate + '%' : '—'}</td><td class="k">${d ? why(d.why) : '—'}</td>
        <td>${!t.mine ? '—' : p && p.can ? '<span class="ok">✅ 넘길 수 있음</span>' : `<span class="wa">아직</span> <span class="k">${E(p ? p.why : '오늘 견준 것 없음')}</span>`}</td></tr>`; }).join(''); }
  load(); setInterval(load, 15000); window.__col2jobs = { load };
})();
