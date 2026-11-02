// tOPS — 정범님 11/02: 🖥 기기 운영 보고(하루 평균 요약·날짜별 상세·저절로 찾은 문제점·문턱 설정) · 🌙 밤 시간 설정(간격·외부 일·출고 경고 문턱) · 🏛 국중 날짜 차례 하루 상한·외국 책 칸
let bad = 0; const ok = (c, m) => { if (!c) { bad++; console.log('  ❌', m); } else console.log('  ✓', m); };
require('./harness.js')(async (p) => { await p.evaluate(require('./seed.js')); await p.waitForTimeout(600);
  const r = await p.evaluate(async () => { const W = (ms) => new Promise((r) => setTimeout(r, ms)); const out = {}; const FS = window.__FS; window.ask = async () => true; const T0 = window.toast; let lastT = ''; window.toast = (m) => { lastT = String(m); return T0 && T0(m); };
    const kd = (i) => new Date(Date.now() + 9 * 3600e3 - i * 864e5).toISOString().slice(0, 10);
    // ── ① 분석(순수 함수): 어제(i=1) 하루를 그 앞 7일과 견줌
    const mk = (i, over) => { const base = { 'JS-MAIN': { runs: 40, runMs: 4 * 3600e3, pages: 3000, chars: 9e7, ok: 38, fail: 2, cs: { ok: 500, fail: 10, n: 800, b: 2e6 }, jobs: { 'crm:orders': { n: 24, ms: 24 * 60e3, done: 24 }, 'prd:scanDaily': { n: 10, ms: 10 * 60e3, done: 10 } } },
      'HOME': { runs: 30, runMs: 3 * 3600e3, pages: 2500, chars: 7e7, ok: 30, fail: 0, cs: { ok: 400, fail: 5, n: 600 }, jobs: { 'prd:market': { n: 6, ms: 6 * 600e3, done: 6 } } },
      'LOGGER': { runs: 20, runMs: 5 * 3600e3, pages: 6000, chars: 2e8, tether: 3e9, wifi: 1e9, ok: 20, fail: 0, cs: { ok: 900, fail: 9, n: 2000 }, jobs: { 'prd:bench': { n: 4, ms: 4 * 3600e3, done: 4 } } } };
      return { day: kd(i), pcs: { ...base, ...(over || {}) } }; };
    const docs = [mk(0), mk(1, { 'HOME': { runs: 2, runMs: 10 * 60e3, pages: 50, chars: 1e6, ok: 1, fail: 1, cs: { ok: 10, fail: 0 }, jobs: {} }, 'JS-MAIN': { runs: 40, runMs: 22 * 3600e3, pages: 3000, chars: 9e7, ok: 20, fail: 20, cs: { ok: 300, fail: 200, n: 500 }, whys: [['crm · fail: 로그인 쉼', 150]], jobs: { 'crm:orders': { n: 24, ms: 24 * 180e3, done: 20, lost: 3 } } } })];
    for (let i = 2; i <= 9; i++) docs.push(mk(i));
    const A = devOpsAnalyze(docs, {}); out.names = A.names; out.avgLogger = Math.round(A.avg.LOGGER.pages); out.avgDays = A.avg['JS-MAIN'].nDays;
    out.kinds = A.probs.map((x) => x.pc + ':' + x.kind).sort(); out.lastDay = A.last && A.last.day;
    const A2 = devOpsAnalyze(docs, { shareMax: 99, idlePct: 1, failX: 50, slowX: 50 }); out.kinds2 = A2.probs.map((x) => x.kind).filter((k) => k !== '끊김');
    // ── ② 화면: ⚙ 설정 🖥 기기 운영 보고 — 문서는 prd_jobs/devops_날짜
    for (const d of docs) await db.collection('prd_jobs').doc('devops_' + d.day).set(JSON.parse(JSON.stringify(d)));
    localStorage.setItem('rn-device', 'TEST-PC'); S.devOk = true; S.app.adminDevices = [deviceName() || 'TEST-PC']; S.dvo = null; S.sec.set_devops = true; S.sec.set_night = true; S.tab = 'settings'; renderMain(); await W(1500); const box = document.getElementById('devops_box'); out.box = !!box; out.rows = box ? box.querySelectorAll('table.tbl')[0].querySelectorAll('tr').length : 0; out.probTxt = box ? (box.innerText.match(/⚠ [^\n]+/g) || []).length : 0; out.detN = box ? box.querySelectorAll('details').length : 0;
    // 문턱 저장 → app_settings/devops_cfg
    S.devOk = true; S.app.adminDevices = [deviceName() || 'TEST-PC']; devOpsLoad(true); await W(900); out.probTxt = box ? box.querySelectorAll('div[style*="color:#"]').length : 0;
    const sv = box && box.querySelector('[data-dvosave]'); document.getElementById('dvo_share').value = '75'; if (sv) sv.click(); await W(800); out.cfg = (FS.app_settings || {}).devops_cfg || null;
    // ── ③ 🌙 밤 시간 설정 → app_settings/night_ops · 출고 경고 문턱
    S.devOk = true; S.app.adminDevices = [deviceName() || 'TEST-PC']; S.sec.set_night = true; renderMain(); await W(900); out.admNow = isAdminDevice(); { const hn = document.createElement('div'); hn.id = 'ngtest'; document.querySelectorAll('#ng_q,#ng_prd,#ng_ord,#ng_on,#ng_ext,#ng_extm,[data-ngsave]').forEach((x) => x.remove()); hn.innerHTML = nightSetHtml(); document.body.appendChild(hn); }
    out.nightUi = !!document.getElementById('ng_q') && !!document.querySelector('[data-ngsave]');
    document.getElementById('ng_prd').value = '45'; document.getElementById('ng_ord').value = '7'; document.querySelector('[data-ngsave]').click(); await W(700); out.night = (FS.app_settings || {}).night_ops || null; out.nightToast = lastT;
    const hm = (ms) => { const k = new Date(ms + 9 * 3600e3); return String(k.getUTCHours()).padStart(2, '0') + ':' + String(k.getUTCMinutes()).padStart(2, '0'); };
    out.inNow = nightIn({ quiet: hm(Date.now() - 600e3) + '-' + hm(Date.now() + 600e3) }); out.outNow = nightIn({ quiet: hm(Date.now() + 600e3) + '-' + hm(Date.now() + 1200e3) });
    out.wrap = nightIn({ quiet: '23:00-02:00' }, Date.parse('2026-11-02T00:30:00+09:00')) && !nightIn({ quiet: '23:00-02:00' }, Date.parse('2026-11-02T03:00:00+09:00')) && nightIn({ quiet: '01:00-04:55' }, Date.parse('2026-11-02T04:54:00+09:00')) && !nightIn({ quiet: '01:00-04:55' }, Date.parse('2026-11-02T04:55:00+09:00'));
    S.night = { ...NIGHT_DEF, quiet: hm(Date.now() - 600e3) + '-' + hm(Date.now() + 600e3), orderMin: 5 }; S._nightAt = Date.now(); out.limNight = shipStaleLim(); S.night = { ...NIGHT_DEF, on: false }; out.limDay = shipStaleLim();
    // ── ④ 🏛 국중 날짜 차례 하루 상한·외국 책 (♾ 무한 도서 정보 조절판)
    const nd = kd(0); await db.collection('app_settings').doc('bi_x').set({ pool: 'nl', cur: '20140201', nlTop: '20261201', nlN: { [nd]: 1234 } }, { merge: true }); S.bxp = null; bxPanelLoad(); await W(600);
    const holder = document.createElement('div'); holder.id = 'bxpanel'; document.body.appendChild(holder); holder.innerHTML = bxPanelHtml(); out.bxHas = !!holder.querySelector('#bxNlCap') && /국중 날짜 차례/.test(holder.innerText) && /1,234/.test(holder.innerText); out.capDefault = (holder.querySelector('#bxNlCap') || {}).value;
    holder.querySelector('#bxNlCap').value = '150000'; holder.querySelector('[data-bxcap]').click(); await W(600); out.cap = ((FS.app_settings || {}).bi_x || {}).nlCap;
    const fx = holder.querySelector('[data-bxset="nlForeign:0"]'); if (fx) fx.click(); await W(600); out.fx = ((FS.app_settings || {}).bi_x || {}).nlForeign;
    return out; });
  console.log(JSON.stringify(r).slice(0, 1500));
  ok(r.names.join() === 'JS-MAIN,HOME,LOGGER' && r.avgDays === 7, '기기 목록·평균 낼 날 수(끝난 날 7일): ' + r.names + ' ' + r.avgDays);
  ok(r.avgLogger === 6000, '로거 하루 평균 쪽 6,000');
  ok(r.kinds.includes('JS-MAIN:쏠림') && r.kinds.includes('HOME:놀고 있음') && r.kinds.includes('JS-MAIN:실패 많음') && r.kinds.includes('JS-MAIN:느려짐') && r.kinds.includes('JS-MAIN:끊김'), '저절로 찾은 문제점(쏠림·놀고 있음·실패 많음·느려짐·끊김): ' + r.kinds.join(' '));
  ok(r.kinds2.length === 0, '문턱(설정)을 넓히면 문제점이 사라짐: ' + r.kinds2.join(' '));
  ok(r.box && r.rows === 4 && r.probTxt >= 4 && r.detN >= 10, `⚙ 🖥 기기 운영 보고 화면(요약 줄 ${r.rows} · 문제 ${r.probTxt} · 날짜 ${r.detN})`);
  ok(r.cfg && r.cfg.shareMax === 75, '문턱 저장(app_settings/devops_cfg): ' + JSON.stringify(r.cfg));
  ok(r.nightUi && r.night && r.night.prdMin === 45 && r.night.orderMin === 7 && r.night.quiet === '01:00-04:55' && r.night.on === true && r.night.ext === true && r.night.extMin === 10, '🌙 밤 시간 저장(app_settings/night_ops): ' + JSON.stringify(r.night));
  ok(r.inNow && !r.outNow && r.wrap, '밤 시간 판단(지금 안·밖 · 자정 넘김 · 끝 시각 4:55는 밖)');
  ok(r.limNight > 5 * 60e3 && r.limDay === 3 * 60e3, `출고 '새로 못 읽음' 경고 문턱 — 밤 ${Math.round(r.limNight / 1000)}초 · 낮 ${Math.round(r.limDay / 1000)}초`);
  ok(r.bxHas && r.capDefault === '200000', '♾ 조절판에 🏛 국중 날짜 차례 오늘 수·하루 상한(기본 20만)·외국 책 칸');
  ok(r.cap === 150000 && r.fx === false, '상한 저장(nlCap) · 외국 책 빼기(nlForeign false)');
  console.log(bad ? `❌ tOPS 실패 ${bad}` : '✓ tOPS 통과'); });
