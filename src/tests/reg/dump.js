const X = require('xlsx'); const fs = require('fs');
const cfb = X.CFB.read(fs.readFileSync(process.argv[2]), { type: 'buffer' });
const wb = X.CFB.find(cfb, 'Workbook'); const d = Buffer.from(wb.content); console.log('workbook bytes', d.length);
const N = { 0x0809: 'BOF', 0x000A: 'EOF', 0x0085: 'BOUNDSHEET', 0x00FC: 'SST', 0x00FF: 'EXTSST', 0x003C: 'CONTINUE', 0x020B: 'INDEX', 0x0200: 'DIMENSIONS', 0x0208: 'ROW', 0x00FD: 'LABELSST', 0x0204: 'LABEL', 0x0203: 'NUMBER', 0x027E: 'RK', 0x00BD: 'MULRK', 0x00BE: 'MULBLANK', 0x0201: 'BLANK', 0x00D7: 'DBCELL', 0x0055: 'DEFCOLWIDTH', 0x007D: 'COLINFO', 0x00E5: 'MERGEDCELLS', 0x023E: 'WINDOW2', 0x00E0: 'XF', 0x041E: 'FORMAT', 0x0031: 'FONT' };
let pos = 0, sheet = false; const recs = [];
while (pos < d.length) { const t = d.readUInt16LE(pos), l = d.readUInt16LE(pos + 2); recs.push({ pos, t, l, n: N[t] || t.toString(16) }); pos += 4 + l; }
let inSheet = 0; for (const r of recs) { if (r.n === 'BOF') inSheet++; const dd = d.slice(r.pos + 4, r.pos + 4 + r.l);
  let ex = '';
  if (r.n === 'BOUNDSHEET') ex = 'lbPlyPos=' + dd.readUInt32LE(0);
  if (r.n === 'INDEX') { const n = (r.l - 16) / 4; ex = `rwMic=${dd.readUInt32LE(4)} rwMac=${dd.readUInt32LE(8)} defcol=${dd.readUInt32LE(12)} dbcell=[${[...Array(n)].map((_, i) => dd.readUInt32LE(16 + i * 4))}]`; }
  if (r.n === 'DIMENSIONS') ex = `rw ${dd.readUInt32LE(0)}-${dd.readUInt32LE(4)} col ${dd.readUInt16LE(8)}-${dd.readUInt16LE(10)}`;
  if (r.n === 'ROW') ex = `rw=${dd.readUInt16LE(0)} col ${dd.readUInt16LE(2)}-${dd.readUInt16LE(4)} miyRw=${dd.readUInt16LE(6)} flags=${dd.readUInt32LE(12).toString(16)}`;
  if (['LABELSST', 'NUMBER', 'RK', 'BLANK', 'LABEL'].includes(r.n)) ex = `rw=${dd.readUInt16LE(0)} col=${dd.readUInt16LE(2)} xf=${dd.readUInt16LE(4)}` + (r.n === 'LABELSST' ? ' isst=' + dd.readUInt32LE(6) : r.n === 'NUMBER' ? ' v=' + dd.readDoubleLE(6) : '');
  if (r.n === 'MULRK' || r.n === 'MULBLANK') ex = `rw=${dd.readUInt16LE(0)} col=${dd.readUInt16LE(2)}..${dd.readUInt16LE(r.l - 2)}`;
  if (r.n === 'DBCELL') { const n = (r.l - 4) / 2; ex = `dbRtrw=${dd.readUInt32LE(0)} rgdb=[${[...Array(n)].map((_, i) => dd.readUInt16LE(4 + i * 2))}]`; }
  if (r.n === 'SST') ex = `total=${dd.readUInt32LE(0)} unique=${dd.readUInt32LE(4)}`;
  if (inSheet >= 2 || ['BOUNDSHEET', 'SST', 'EXTSST', 'BOF', 'EOF'].includes(r.n)) console.log(r.pos, r.n, r.l, ex);
}
