// tALPSopts — 정범님 11/03: 출력 화면 옵션(상품명·상품상세·상품코드·내품수량 · 이름+전화번호 · 상품글씨 8) — ALPS 원본과 같은 칸 이름
process.env.RN_ALPS_HOME = require('path').join(require('os').tmpdir(), 'rnalps-o-' + Date.now()); const A = require(require('path').join(__dirname, '..', '..', 'local', 'readnow-alps.js')); const PG = A._t.PG; const vm = require('vm'); let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
const ctl = (v) => ({ value: v }); const ctx = { String, chkDtlOptGdsNm: ctl('N'), chkDtlOptGdsDtl: ctl('N'), chkDtlOptGdsCd: ctl('N'), chkDtlOptGdsQty: ctl('N'), edtGdsSortTxt: ctl(''), edtGdsSortVal: ctl(''), edtGdsFontSize: ctl('10'), rdoMaskOpt: ctl('NAME') }; ctx.window = ctx;
const o = vm.runInNewContext('(' + PG.popOpts + ')', ctx)();
ok(o.nm === 'gdsNm' && o.dtl === 'gdsDtlCont' && o.cd === 'gdsCd' && o.qty === 'ispdQty', '상품명·상품상세·상품코드·내품수량 켬');
ok(o.font === '8' && o.mask === 'ALL' && o.sort === 'gdsNm,ispdQty,gdsCd,gdsDtlCont,', '상품글씨 8 · 이름+전화번호 · 순서 상품명/내품수량/상품코드/상품상세');
console.log(bad ? `❌ tALPSopts 실패 ${bad}` : '✓ tALPSopts 통과'); process.exit(bad ? 1 : 0);
