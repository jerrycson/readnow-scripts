// tALPSsusp — 정범님 11/03: ALPS '출력의심목록'(PIDPIC051U03) — 창 알아보기 · '계속 출력'(N) 고르고 적용 · 원본과 같은 함수 이름(rdoPrntUpdYn·fn51u03Apply·dsSrched)
process.env.RN_ALPS_HOME = require('path').join(require('os').tmpdir(), 'rnalps-s-' + Date.now()); const A = require(require('path').join(__dirname, '..', '..', 'local', 'readnow-alps.js')); const PG = A._t.PG; const vm = require('vm'); let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
const mk = (open) => { const ctx = { applied: null, String }; ctx.window = ctx; ctx.jQuery = (sel) => ({ length: sel === '#PIDPIC051U03' ? 1 : 0, hasClass: () => true, dialog: (x) => (x === 'isOpen' ? open : null) }); ctx.dsSrched = { getRowCount: () => 1, getValue: () => '8162329982' }; let v = 'Y'; ctx.rdoPrntUpdYn = { get value() { return v; }, set value(x) { v = x; } }; ctx.fn51u03Apply = () => { ctx.applied = v; }; return ctx; };
const run = (code, ctx, a) => vm.runInNewContext('(' + code + ')', ctx)(a);
const c1 = mk(true); const r1 = run(PG.susp, c1); ok(r1.open && r1.mgr.join() === '8162329982', '열린 출력의심목록과 예약관리번호를 읽음');
const r2 = run(PG.suspApply, c1, { v: 'N' }); ok(r2.ok && c1.applied === 'N', "'출력이 되지 않았으므로 … 계속 출력'(N)을 고르고 적용");
const c3 = mk(false); ok(!run(PG.susp, c3).open, '닫혀 있으면 열린 것으로 보지 않음');
console.log(bad ? `❌ tALPSsusp 실패 ${bad}` : '✓ tALPSsusp 통과'); process.exit(bad ? 1 : 0);
