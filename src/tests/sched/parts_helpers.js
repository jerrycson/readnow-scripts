  const schedHM = (iso) => AS.hm(AS.kst(AS.toMs(iso)).min);
  const schedFull = (iso) => { const k = AS.kst(AS.toMs(iso)); return `${+k.day.slice(5, 7)}/${+k.day.slice(8, 10)} ${AS.hm(k.min)}`; };
  const ST_ICON = { done: '✓', running: '▶', error: '⚠', stop: '■', timeout: '⏱', lost: '?', merged: '↷', missed: '⤼', skipped: '⤼', busy: '…' };
  const ST_TXT = { done: '끝', running: '하는 중', error: '멈춤(오류)', stop: '멈춤', timeout: '최대 시간이라 멈춤', lost: '신호 끊김', merged: '다음 회차와 함께 함', missed: '늦어서 건너뜀', skipped: '최근에 해서 건너뜀' };
  /* 오늘 회차 표시 (작은 칩) */
  function asChips(s, plan, S0) { const { min } = kstNow(); const L = plan[s.id] || []; if (!L.length) return s.trig.t === 'time' || s.trig.t === 'every' ? '<i>오늘 회차 없음</i>' : '<i>오늘 아직 안 함 — 조건이 되면</i>';
    return L.slice(0, 14).map((x) => { const r = x.r; const st = r ? (AS.isLost(r, Date.now()) ? 'lost' : r.state) : x.min <= min && (x.kind === 'time' || x.kind === 'every') ? 'late' : ''; const ic = r ? ST_ICON[st] || '·' : st === 'late' ? (S0.on && s.on ? '⌛' : '–') : x.guess ? '…' : '·';
      const lbl = x.kind === 'after' ? (x.guess ? `~${AS.hm(x.min)}` : AS.hm(x.min)) : x.kind === 'cond' ? AS.hm(x.min) : x.tag;
      const tip = `${lbl} ${r ? `${ST_TXT[st] || st}${r.by ? ' · ' + r.by : ''}${r.at ? ' · ' + schedFull(r.at) : ''}${r.ms ? ' · ' + AS.fmtMs(r.ms) : ''}${r.why ? ' · ' + r.why : ''}${r.err ? ' · ' + r.err : ''}` : st === 'late' ? '시각 지남 — 알라딘 화면이 열린 PC가 곧 함' : x.guess ? '앞 칸이 끝난 뒤(예상)' : '오늘 예정'}`;
      return `<span class="ts ${st}" title="${esc3(tip)}">${ic} ${esc3(lbl)}${r && r.at && st !== 'running' ? `<small class="tw">${schedHM(r.at)}</small>` : ''}</span>`; }).join('') + (L.length > 14 ? ` <small>+${L.length - 14}</small>` : ''); }
