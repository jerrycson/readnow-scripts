/* tCUTUI1114 — ✂ 묶음 사진 판별 화면(웹앱 · 일꾼 spine2 · 정범님 11/14 18:13) — 실제 크롬 · 가짜 Firebase(fbstub)
 *  뒷면 2×3 지어낸 사진(바코드 읽기는 시험에서 정답 위치로 바꿔 끼움 — 헤드리스 크롬에는 기기 바코드 읽기가 없음)
 *  → 물건 6개 · ISBN 6 · 등록 줄 찾기(사진 있는 줄은 덮지 않음) · ⬆ 넣기 = 빈 칸만 · ✓/✎ 확인 기록 → app_settings/cut_engine(일지·확인 기록·단계) · research_pulse V01
 *  → 같은 배열 앞면(뒷면 짝) · 책등 줄(차례 짝) · 🔬 연구 칸 7가지 · 휴대폰 390 가로 넘침 없음 · 브라우저 팝업 없음
 * 실행: (pw/ 안 — harness.js·fbstub.js 옆) RN_PORT=<포트> node tCUTUI1114.js · 서버 뿌리 = /app/index.html(웹앱) · /readnow-cutout-core.js */
'use strict';
let bad = 0; const ok = (c, m, x) => { if (!c) { bad++; console.log('  ❌', m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); } else console.log('  ✓', m); };
const H = require(require('path').join(process.cwd(), 'harness.js'));
const SCENE = `(() => { let seed = 11; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  window.__mk = (mode) => { const R = mode === 'spine' ? 1 : 2, C = mode === 'spine' ? 6 : 3; const W = 1500, Hh = mode === 'spine' ? 800 : 1100; const c = document.createElement('canvas'); c.width = W; c.height = Hh; const g = c.getContext('2d'); g.fillStyle = '#5a4632'; g.fillRect(0, 0, W, Hh);
    const COL = ['#c83030', '#2860b4', '#1e8c46', '#e6be28', '#783c8c', '#f07820']; const codes = []; const isb = (n) => { const b = '979110' + String(100000 + n).slice(-6); let s = 0; for (let i = 0; i < 12; i++) s += +b[i] * (i % 2 ? 3 : 1); return b + ((10 - (s % 10)) % 10); };
    let n = 0; for (let r = 0; r < R; r++) for (let k = 0; k < C; k++) { const o = mode === 'front' ? (2 - k) : k; void o; const bw = mode === 'spine' ? 70 + n * 8 : 360, bh = mode === 'spine' ? 600 : 470; const x = mode === 'spine' ? 200 + (n ? [0, 70, 148, 234, 328, 430][n] : 0) : 90 + k * (bw + 60), y = mode === 'spine' ? 100 : 60 + r * (bh + 60);
      g.fillStyle = COL[n]; g.fillRect(x, y, bw, bh); g.fillStyle = '#111'; for (let t = 0; t < 8; t++) g.fillRect(x + 10 + rnd() * (bw - 60), y + 10 + rnd() * (bh - 30), 10 + rnd() * 40, 5);
      if (mode === 'back') { g.fillStyle = '#fff'; g.fillRect(x + bw - 140, y + bh - 90, 110, 60); codes.push({ text: isb(n), box: { x: (x + bw - 85) / W - 0.02, y: (y + bh - 60) / Hh - 0.01, w: 0.04, h: 0.02 }, hits: 3, unsure: false }); } n++; }
    return new Promise((res) => c.toBlob((b) => res({ file: new File([b], mode + '.png', { type: 'image/png' }), codes, isb }), 'image/png')); }; })()`;
(async () => {
  for (const vp of [{ width: 1400, height: 900 }, { width: 390, height: 844 }]) {
    console.log(`── ${vp.width}`);
    await H(async (p) => {
      await p.evaluate(SCENE); const dialogs = []; p.on('dialog', (d) => { dialogs.push(d.type()); d.dismiss(); });
      /* 등록 줄 셋: 0번 = 사진 칸 빔 · 1번 = 추가 이미지 1에 사람이 넣은 사진 · 2번 = 이미 올림(done) */
      await p.evaluate(() => { const isb = (n) => { const b = '979110' + String(100000 + n).slice(-6); let s = 0; for (let i = 0; i < 12; i++) s += +b[i] * (i % 2 ? 3 : 1); return b + ((10 - (s % 10)) % 10); };
        const F = window.__FS; F.reg_items = { r0: { isbn: isb(0), stage: 'sel', info: { title: '시험 책 영' } }, r1: { isbn: isb(1), stage: 'pick', info: { title: '시험 책 하나' }, photos: { main: null, z: [{ name: 'human.jpg', path: 'reg_photos/r1/z0_h.jpg', url: 'https://x/h.jpg', at: '2026-11-14T00:00:00Z' }], desc: [] } }, r2: { isbn: isb(2), stage: 'done', info: { title: '시험 책 둘' } } }; });
      ok(await p.evaluate(() => typeof openCutout === 'function' && !!NAV_X.cutout && !!RH_OPEN.cutout && !!RH_LATE.V01 && GO_PAGES.some((x) => x[0] === 'cutout') && FEAT.some((f) => /묶음 사진 판별/.test(f.t)) && !!PAGE_GUIDES.cutout), '화면·탭 묶음·연구 모음·바로 가기·기능 찾기·화면 설명서에 이어짐');
      ok(await p.evaluate(() => NAV_HUB.purchase[1][1].includes('cutout') && NAV_HUB.research[0][1].includes('cutout')), '🛒 매입 탭 · 🔬 연구 탭 묶음에 있음');
      await p.evaluate(() => openCutout()); await p.waitForFunction(() => !!window.ReadnowCutout, null, { timeout: 8000 }).catch(() => {});
      ok(await p.evaluate(() => !!window.ReadnowCutout && window.ReadnowCutout.VERSION === '0.1.0'), '공용 셈 파일을 화면 열 때 받음(0.1.0)');
      const st = await p.evaluate(() => { const d = document.querySelector('#cut_study'); d.open = true; return d.textContent; }); ok(['목적', '지금 단계', '점수 그래프', '일지', '고친 점', '남은 어려움', '다음 한 수'].every((k) => st.includes(k)), '🔬 연구 칸 7가지(목적·단계·점수·일지·고친 점·어려움·다음 한 수)');
      /* 뒷면 */
      await p.evaluate(async () => { const sc = await window.__mk('back'); window.__miss = sc.codes[5].text; window.pptBarcodes = async () => sc.codes.slice(0, 5); window.loadZX = async () => ({ readBarcodes: async () => [{ text: window.__miss + ' 52000' }] }); await cutRun(sc.file); });
      await p.waitForFunction(() => S.cut && S.cut.items.length && !S.cut.busy, null, { timeout: 20000 }).catch(() => {});
      const r = await p.evaluate(() => ({ n: S.cut.items.length, isbn: S.cut.items.filter((b) => b.isbn).length, cards: document.querySelectorAll('[data-cutn]').length, t0: S.cut.items[0].target, t1: S.cut.items[1].target, t2: S.cut.items[2].target, conf: S.cut.items.map((b) => b.conf), last: !!S.cutLast }));
      ok(r.n === 6 && r.isbn === 6 && r.cards === 6, '뒷면 6권 · ISBN 6 · 카드 6', r);
      ok(await p.evaluate(() => { const b = S.cut.items[5]; return b.isbn === window.__miss && b.add === '52000' && b.how === 'reread'; }), '바코드 0인 조각을 원본 크기로 다시 읽어 ISBN·부가기호 찾음'); ok(r.t0 && !r.t0.has && r.t1 && r.t1.has && !r.t2, '등록 줄: 빈 칸 · 사람 사진 있음(덮지 않음) · 올린 줄은 안 잡음', [r.t0, r.t1, r.t2]); ok(r.conf.every((c) => c >= 0.9), '띄워 놓은 뒷면 확신 높음', r.conf);
      await p.evaluate(async () => { await cutApply([S.cut.items[0], S.cut.items[1]]); });
      const fs1 = await p.evaluate(() => ({ r0: window.__FS.reg_items.r0.photos, r1: window.__FS.reg_items.r1.photos }));
      ok(fs1.r0 && fs1.r0.z && fs1.r0.z[0] && /_cut\.jpg$/.test(fs1.r0.z[0].path) && fs1.r0.z[0].cut && fs1.r0.z[0].cut.mode === 'back', '빈 줄: 추가 이미지 1에 잘린 그림', fs1.r0); ok(fs1.r1.z[0].name === 'human.jpg', '사람이 넣은 사진은 그대로', fs1.r1.z[0]);
      await p.click('[data-cutok="3"]'); await p.click('[data-cutfix="4"]'); await p.fill('[data-cutfixin]', await p.evaluate(() => S.cut.items[5].isbn)); await p.click('[data-cutfixgo]'); await p.waitForTimeout(2200);
      const E = await p.evaluate(() => ({ e: window.__FS.app_settings && window.__FS.app_settings.cut_engine, pu: window.__FS.app_settings && window.__FS.app_settings.research_pulse, ses: Object.keys(window.__FS.ppt_sessions || {}).filter((k) => /^cut_/.test(k)) }));
      ok(E.e && E.e.recs && E.e.recs.length >= 3 && E.e.recs.some((x) => x.ok === false) && E.e.log && E.e.log.length >= 2 && E.e.tot.items === 6, '엔진 요약: 확인 기록(맞음·고침)·일지·판별 수', E.e && { recs: E.e.recs, log: E.e.log, tot: E.e.tot });
      ok(E.e && E.e.cal && E.e.cal.back && E.e.cal.back.n >= 3 && E.e.stage === 2, '배우기 결과(방법마다 확인 수·문턱)·단계 2', E.e && E.e.cal);
      ok(E.pu && E.pu.studies && E.pu.studies.V01 && E.pu.studies.V01.at, '🧬 진화 증거 V01', E.pu); ok(E.ses.length === 1, '판별 기록 ppt_sessions/cut_…', E.ses);
      /* 글자로 찾기(견본 그림 없이) — ✎ 고치기에 제목 몇 글자 → 후보 → 고름 */
      await p.evaluate(() => { S.plist = new Map([['L1', { isbn13: '9788936434120', title: '소년이 온다', author: '한강', publisher: '창비' }], ['L2', { isbn13: '9788936433598', title: '채식주의자', author: '한강', publisher: '창비' }]]); cutDraw(); });
      await p.click('[data-cutfix="2"]'); await p.fill('[data-cutfixin]', '소년이온다 한강'); await p.click('[data-cutfixgo]'); await p.waitForSelector('[data-cutpick="0"]', { timeout: 3000 }).catch(() => {});
      const pickT = await p.evaluate(() => (document.querySelector('[data-cutpick="0"]') || {}).textContent || ''); ok(/소년이 온다/.test(pickT), '글자로 찾기 → 첫 후보 소년이 온다', pickT);
      await p.click('[data-cutpick="0"]'); await p.waitForTimeout(300); ok(await p.evaluate(() => S.cut.items[1].isbn === '9788936434120' && S.cut.items[1].human === 'fix'), '고르면 그 ISBN · 사람 고침 기록');
      /* 🔤 글자로 맞추기 — 기기 안(Tesseract 대신 가짜 읽기) · 구글(가짜 클라우드) */
      await p.evaluate(async () => { S.cut.mode = 'front'; const keep = S.cutLast; S.cutLast = null; const sc = await window.__mk('front'); await cutRun(sc.file); window.__keep = keep; });
      await p.waitForFunction(() => S.cut && S.cut.mode === 'front' && S.cut.items.length && !S.cut.busy, null, { timeout: 20000 }).catch(() => {});
      ok(await p.evaluate(() => !!document.querySelector('[data-cutocr="t"]') && !!document.querySelector('[data-cutocr="g"]') && !!document.querySelector('[data-cutlist]')), '🔤 글자로 맞추기 카드(목록 고름 · 기기 안 · 구글)');
      await p.evaluate(async () => { S._cutList = 'all'; window.cutTessWorker = async () => ({ recognize: async () => ({ data: { text: '소년이온다 한강 장편소설' } }) }); window.cutTessFree = async () => {}; await cutOcrTess(); });
      const t1 = await p.evaluate(() => ({ n: S.cut.items.filter((b) => b.how === 'ocr-t').length, isbn: S.cut.items.filter((b) => b.how === 'ocr-t').map((b) => b.isbn), note: S.cut.ocrNote }));
      ok(t1.n === 1 && t1.isbn[0] === '9788936434120' && /기기 안 읽기/.test(t1.note || ''), '기기 안 읽기 → 소년이 온다 하나만(같은 상품 두 조각에 안 줌)', t1);
      await p.evaluate(async () => { const b = S.cut.items.find((x) => !x.isbn); window.__gb = b.n; window.cloudCall = async (path, body) => (path === '/cut-ocr' && /^data:image\/jpeg/.test(body.image) ? { ok: true, quota: { n: 3, cap: 900 }, paras: [{ text: '채식주의자 한강 창비', box: { x: b.cx / S.cut.W - 0.01, y: b.cy / S.cut.H - 0.01, w: 0.02, h: 0.02 } }] } : { ok: false }); await cutOcrCloud(); });
      const g1 = await p.evaluate(() => { const b = S.cut.items.find((x) => x.n === window.__gb); return { isbn: b.isbn, how: b.how, q: S.cutQuota, note: S.cut.ocrNote }; });
      ok(g1.isbn === '9788936433598' && g1.how === 'ocr-g' && g1.q.n === 3 && /이번 달 3\/900/.test(g1.note || ''), '구글 읽기 → 조각 안 글자만 모아 채식주의자 · 이번 달 몫 표시', g1);
      await p.evaluate(() => { window.cloudCall = async () => ({ ok: false, err: '이번 달 구글 글자 읽기 무료 몫(900단위)을 다 씀', quota: { n: 900, cap: 900 } }); }); await p.evaluate(() => cutOcrCloud().catch(() => {})); await p.waitForTimeout(300);
      ok(await p.evaluate(() => /무료 몫/.test(S.cut.ocrNote || '') && !S.cut.busy), '몫을 다 쓰면 거절 글 · 멈추지 않음');
      await p.evaluate(() => { S.cutLast = window.__keep; S.cut.mode = 'front'; });
      /* 앞면(같은 자리) */
      await p.evaluate(async () => { S.cut.mode = 'front'; const sc = await window.__mk('front'); await cutRun(sc.file); }); await p.waitForFunction(() => S.cut && S.cut.mode === 'front' && S.cut.items.length && !S.cut.busy, null, { timeout: 20000 }).catch(() => {});
      const f = await p.evaluate(() => ({ n: S.cut.items.length, isbn: S.cut.items.map((b) => b.isbn), way: S.cut.pairWay, back: S.cutLast.items.map((b) => b.isbn) }));
      ok(f.n === 6 && f.isbn.every((v, i) => v === f.back[i]), '앞면 6권이 뒷면 같은 자리 ISBN을 받음', f); ok(/그대로/.test(f.way || ''), '짝 방법 적힘', f.way);
      /* 책등 */
      await p.evaluate(async () => { S.cut.mode = 'spine'; S.cut.expect = '6'; const sc = await window.__mk('spine'); await cutRun(sc.file); }); await p.waitForFunction(() => S.cut && S.cut.mode === 'spine' && S.cut.items.length && !S.cut.busy, null, { timeout: 20000 }).catch(() => {});
      const s = await p.evaluate(() => ({ n: S.cut.items.length, isbn: S.cut.items.filter((b) => b.isbn).length, way: S.cut.pairWay }));
      ok(s.n === 6 && s.isbn === 6, '책등 6개 · 차례로 ISBN 6', s);
      const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); ok(ov <= 1, '가로 넘침 없음', ov);
      ok(!dialogs.length, '브라우저 팝업 없음', dialogs);
      if (vp.width === 390) await p.screenshot({ path: (process.env.RN_SHOT || '/tmp') + '/cut_m390.jpg', quality: 70, fullPage: false }); else await p.screenshot({ path: (process.env.RN_SHOT || '/tmp') + '/cut_pc1400.jpg', quality: 70 });
    }, { vp: vp, touch: vp.width < 500 });
  }
  console.log(bad ? `❌ 실패 ${bad}` : '✓ 통과'); process.exit(bad ? 1 : 0);
})();
