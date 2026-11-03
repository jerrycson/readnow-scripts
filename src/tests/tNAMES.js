// tNAMES — 정범님 11/03: 🏷 이름 바꾼 기록 · 긴 이름 → 간결한 이름(src/tools/naming/apply.js · names.json)
//  ① 적용된 판이면 ⚙ 설정 › 🏷 이름 바꾼 기록 표가 NAME_LOG 줄 수만큼 보이고 찾기 칸이 거름
//  ② 🔍 기능 찾기: 예전 이름으로 찾아도 새 이름 항목이 나옴(동의어) · 기능 설명 글의 긴 예전 이름은 새 이름으로 보임
//  ③ 대표 화면 이름이 새 이름(설정 섹션·취소 주문 대조 탭·알라딘 매입 단추) · 예전 이름은 화면에 없음
//  ④ 적용 전 판(NAME_LOG 비었음)이면 '아직 바꾼 이름이 없습니다'만 — 오류 없이
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = { errs: [] };
    window.addEventListener('error', (e) => out.errs.push(String(e.message)));
    out.n = NAME_LOG.length; out.ids = NAME_LOG.map((x) => x[3]);
    S.tab = 'settings'; S.sec.set_namelog = true; renderTabs(); renderMain(); await W(900);
    const box = document.querySelector('#main details[data-sec="set_namelog"]'); out.box = !!box; out.summary = box ? box.querySelector('summary').textContent : '';
    out.rows = document.querySelectorAll('#nl_tbl tr[data-nl]').length; out.empty = box ? /아직 바꾼 이름이 없습니다/.test(box.textContent) : false;
    const q = document.getElementById('nl_q');
    if (q && NAME_LOG.length) { const f = NAME_LOG.find((x) => x[3] === 'set_night') || NAME_LOG[0]; q.value = f[0].slice(0, 6); q.dispatchEvent(new Event('input', { bubbles: true })); await W(100); out.shown = [...document.querySelectorAll('#nl_tbl tr[data-nl]')].filter((r) => r.style.display !== 'none').length; out.shownHas = [...document.querySelectorAll('#nl_tbl tr[data-nl]')].some((r) => r.style.display !== 'none' && r.textContent.includes(f[1])); }
    // ② 기능 찾기 동의어
    S._featIx = null; const F = (s) => featFind(s).map((x) => x.t);
    const night = NAME_LOG.find((x) => x[3] === 'set_night'); if (night) { out.findOld = F('밤 시간').slice(0, 6); out.findNew = F('야간 운영').slice(0, 6); }
    out.findLog = F('이름 바꾼 기록').slice(0, 3);
    out.featOld = featIndex().filter((x) => NAME_LOG.some(([f]) => f.length >= 7 && String(x.t).includes(f))).map((x) => x.t).slice(0, 5);
    // ③ 대표 화면 이름
    const ns = document.querySelector('#main details[data-sec="set_night"] > summary'); const txt = ns ? ns.textContent : ''; out.setNight = txt.includes('🌙 야간 운영'); out.setNightOld = txt.includes('알라딘 일 간격 늘리고');
    out.cx = CX_TABS.map((x) => x[1]);
    return out; });
  console.log('  NAME_LOG', r.n, '줄 · 표', r.rows, '줄 · 섹션', r.summary.trim());
  ok(r.box, '⚙ 설정에 🏷 이름 바꾼 기록 섹션');
  if (!r.n) { ok(r.empty && r.rows === 0, '적용 전 판: 빈 안내만'); }
  else {
    ok(r.rows === r.n, `표 줄 수 = NAME_LOG (${r.rows}/${r.n})`);
    ok(r.shown >= 1 && r.shown < r.rows && r.shownHas, `찾기 칸이 거름 (${r.shown}줄 남음)`);
    if (r.ids.includes('set_night')) { ok(r.findOld.some((t) => /야간 운영/.test(t)), '예전 이름 「밤 시간」으로 찾아도 「야간 운영」 항목: ' + r.findOld.join(' | ')); ok(r.setNight && !r.setNightOld, '설정 화면 섹션 이름 = 🌙 야간 운영 (예전 꼬리 글 없음)'); }
    ok(r.findLog.some((t) => /이름 바꾼 기록/.test(t)), '기능 찾기 「이름 바꾼 기록」 → 설정 섹션');
    ok(!r.featOld.length, '기능 찾기 제목에 긴 예전 이름이 남지 않음 ' + r.featOld.join(' | '));
    if (r.ids.includes('cx_done')) ok(r.cx.join(',') === '⚠ 품절취소,판매전취소,기타취소,처리완료,사유기록,취소후판매', '취소 주문 대조 탭 = ' + r.cx.join('·'));
  }
  ok(!r.errs.length, '화면 오류 없음 ' + r.errs.join(' | '));
  console.log(bad ? `❌ tNAMES 실패 ${bad}` : '✅ tNAMES 통과'); process.exitCode = bad ? 1 : 0;
});
