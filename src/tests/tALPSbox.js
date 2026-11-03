process.env.RN_ALPS_HOME = require('path').join(require('os').tmpdir(), 'rnalps-bx'); const A = require(require('path').join(__dirname, '..', '..', 'local', 'readnow-alps.js')); const T = A._t; let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '❌ ') + m); if (!c) bad++; };
const m = A._t.PG.rows; const vm = require('vm');
const ds = [ { acperNm: '손님A', acperBscAdr: '서울 A', acperDtlAdr: '1', acperTelNo: '010-1', bdpkKey: 'K1', bdpkRpnSeq: '1' }, { acperNm: '손님A', acperBscAdr: '서울 A', acperDtlAdr: '1', acperTelNo: '010-1', bdpkKey: 'K1', bdpkRpnSeq: '2' }, { acperNm: '손님B', acperBscAdr: '부산 B', acperDtlAdr: '2', acperTelNo: '010-2', bdpkKey: 'K1', bdpkRpnSeq: '1' }, { acperNm: '손님C', acperBscAdr: '대구 C', acperDtlAdr: '3', acperTelNo: '010-3', bdpkKey: 'K1', bdpkRpnSeq: '1' } ];
const rows = vm.runInNewContext('(' + m + ')', { dsRsrvList: { getFilteredRows: () => ds }, String, Object })();
const B = T.boxesOf(rows); ok(B.groups.length === 3, '같은 합포장키(K1)라도 수하인이 다르면 다른 상자 — 3상자(손님A 2줄 · 손님B · 손님C): ' + B.groups.map((g) => g.length).join(','));
ok(B.of.get(0) === B.of.get(1) && B.of.get(0) !== B.of.get(2), '1장 먼저: 첫 상자 = 같은 수하인 줄만(손님A 2줄)');
console.log(bad ? '❌ 실패' : '✓ 상자 묶기 통과'); process.exit(bad ? 1 : 0);
