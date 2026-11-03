const s = require('fs').readFileSync(require('path').join(__dirname, '..', '..', 'local', 'readnow-alps.js'), 'utf8');
const m = s.match(/upPrep: `([\s\S]*?)`,\n/); if (!m) { console.log('❌ upPrep 못 찾음'); process.exit(1); }
const vm = require('vm');
const mk = (title, bdpkChk, bdpkCd) => { const ds = { pickYmd: '20261103', usrFmat: '', titleYn: title, bdpkBaseCd: bdpkCd, shpmFmat: '' };
  return { dsOpt01: { getValue: (_, k) => ds[k], setValue: (_, k, v) => { ds[k] = v; } }, cboUsrFmat01: { getItems: () => [{ label: '알라딘', value: 'F1' }], index: 0, get value() { return 'F1'; } }, edtPickYmd01: { value: '20261103' }, cboOrdSct01: { value: '01' }, chkOrdDupCd01: { value: 'N' }, cboOrdDupCd01: { value: '00' }, cboShpmFmat01: { value: '' }, chkTitleYn01: { value: title }, chkBdpkBaseCd01: { value: bdpkChk }, cboBdpkBaseCd01: { enable: false }, grdList01: { getColumns: () => [1, 2] }, fnCheckBeFile: (ok) => ok(), setTimeout, clearTimeout, JSON, String, ds }; };
(async () => { let bad = 0; const run = async (ctx) => vm.runInNewContext('(' + m[1] + ')', ctx)({ fmt: '알라딘', today: '20261103', ms: 1000 });
  for (const [t, b, c, want] of [['N', 'N', '00', '01'], ['Y', 'Y', '04', '04'], ['', 'N', '', '01']]) { const ctx = mk(t, b, c); const r = await run(ctx);
    const ok = r.ok && r.info.title === 'Y' && r.info.bdpk === 'Y' && r.info.bdpkCd === want && ctx.ds.titleYn === 'Y' && ctx.chkBdpkBaseCd01.value === 'Y'; if (!ok) bad++; console.log((ok ? '✓' : '❌') + ` 처음 타이틀 '${t}'·합포장 '${b}/${c}' → 타이틀 ${r.info.title} · 합포장 ${r.info.bdpk}/${r.info.bdpkCd}`); }
  console.log(bad ? '❌ 실패' : '✓ ALPS 옵션 맞추기 통과'); })();
