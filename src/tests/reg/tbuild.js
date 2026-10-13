const X = require('xlsx'); const fs = require('fs'); const RG = require('/home/claude/w/readnow-register-core.js');
const tpl = fs.readFileSync('v4test.xls'); const N = +process.argv[2] || 5;
const rows = [...Array(N)].map((_, i) => ({ isbn: i % 3 === 0 ? '9788977396005' : String(9791167030580 + i), state: 1, qty: 1, grade: (i % 3) + 1, price: 1000 + i * 10, title: '관광서비스의 이해 ' + i, code: 'BLKCMN' + (i % 3 === 2 ? '_' + RG.yymmdd() : ''), desc: i % 2 ? '띠지 있습니다. 그 외 상태 양호합니다.' : '' }));
const out = RG.buildBulkXls(tpl, rows, X.CFB); fs.writeFileSync('out' + N + '.xls', out);
const v = RG.verifyBulkXls(out, rows, X); console.log('N', N, 'bytes', out.length, 'verify', v.ok, v.bad.slice(0, 3));
// 머리 1~18행 그대로인지: 원본과 새 파일의 시트 레코드 중 18행 앞 셀 비교
const recsOf = (b) => { const c = X.CFB.read(b, { type: 'buffer' }); return RG._readRecs(new Uint8Array(X.CFB.find(c, 'Workbook').content)); };
const A = recsOf(tpl), B = recsOf(Buffer.from(out)); const key = (r) => r.t + ':' + Buffer.from(r.raw).toString('hex');
const cellT = new Set([0x0204, 0x0203, 0x027E, 0x00BD, 0x00BE, 0x0201, 0x00FD]); const rowOf = (r) => r.data[0] | (r.data[1] << 8);
const head = (L) => L.filter((r) => (cellT.has(r.t) || r.t === 0x0208) && rowOf(r) < 18).map(key).join('|');
console.log('header rows identical', head(A) === head(B)); const glob = (L) => { const i = L.findIndex((r, k) => r.t === 0x0809 && k > 0); return L.slice(0, i).map(key).join('|'); }; console.log('globals identical', glob(A) === glob(B));
