const X = require('xlsx'); const fs = require('fs'); const RG = require('/home/claude/w/readnow-register-core.js');
const c = X.CFB.read(fs.readFileSync(process.argv[2]), { type: 'buffer' }); const wb = new Uint8Array(X.CFB.find(c, 'Workbook').content); const L = RG._readRecs(wb);
let p = 0; const at = new Map(); L.forEach((r) => { at.set(p, r); r.pos = p; p += r.raw.length; });
const le32 = (d, o) => (d[o] | (d[o + 1] << 8) | (d[o + 2] << 16) | (d[o + 3] << 24)) >>> 0, le16 = (d, o) => d[o] | (d[o + 1] << 8);
const bs = L.find((r) => r.t === 0x0085); console.log('BOUNDSHEET→', at.get(le32(bs.data, 0)).t.toString(16));
const ix = L.find((r) => r.t === 0x020B); const n = (ix.data.length - 16) / 4; let ok = true; console.log('INDEX rows', le32(ix.data, 4), le32(ix.data, 8), 'defcol→', (at.get(le32(ix.data, 12)) || {}).t?.toString(16));
for (let k = 0; k < n; k++) { const dp = le32(ix.data, 16 + 4 * k); const db = at.get(dp); if (!db || db.t !== 0xD7) { ok = false; console.log('bad dbcell ptr', k); continue; }
  const first = at.get(dp - le32(db.data, 0)); if (!first || first.t !== 0x0208) { ok = false; console.log('bad rtrw', k); continue; }
  // 다시 계산: ROW들, 첫 셀들
  let q = first.pos; const rows = []; while (at.get(q) && at.get(q).t === 0x0208) { rows.push(at.get(q)); q += at.get(q).raw.length; }
  let prev = rows.length > 1 ? rows[1].pos : rows[0].pos + rows[0].raw.length; for (let i = 0; i < rows.length; i++) { prev += le16(db.data, 4 + 2 * i); const cell = at.get(prev); const rw = le16(rows[i].data, 0); if (!cell || ![0xFD, 0x204, 0x203, 0x27E, 0xBD, 0xBE, 0x201].includes(cell.t) || le16(cell.data, 0) !== rw) { if (!(cell && cell.t === 0x0208)) { ok = false; console.log('rgdb mismatch block', k, 'row', rw, cell && cell.t.toString(16)); } } } }
console.log(process.argv[2], 'blocks', n, 'index/dbcell consistent', ok);
